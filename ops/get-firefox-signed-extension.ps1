# Fetch an existing AMO submission without uploading the same version again.
param(
 [Parameter(Mandatory)][string]$CredentialsFile,
 [Parameter(Mandatory)][int]$VersionId,
 [ValidateSet('unlisted','listed')][string]$Channel='unlisted',
 [string]$OutputDir=''
)
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot
if(!$OutputDir){$OutputDir=Join-Path $root 'dist'}
$OutputDir=[IO.Path]::GetFullPath($OutputDir)
$text=[IO.File]::ReadAllText((Resolve-Path -LiteralPath $CredentialsFile).Path)
$issuer=[regex]::Match($text,'user:\d+:\d+')
$secret=[regex]::Match($text,'(?im)^\s*JWT secret\s*[:=]?\s*([A-Za-z0-9_-]{20,})')
if(!$issuer.Success -or !$secret.Success){throw 'Expected a Mozilla issuer (user:...) and JWT secret label in the local credentials file.'}
function EncodeJwt([byte[]]$bytes){[Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+','-').Replace('/','_')}
$now=[DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$header=EncodeJwt ([Text.Encoding]::UTF8.GetBytes('{"alg":"HS256","typ":"JWT"}'))
$payload=EncodeJwt ([Text.Encoding]::UTF8.GetBytes((@{iss=$issuer.Value;jti=[guid]::NewGuid().ToString();iat=$now;exp=$now+120}|ConvertTo-Json -Compress)))
$hmac=[Security.Cryptography.HMACSHA256]::new([Text.Encoding]::UTF8.GetBytes($secret.Groups[1].Value))
try{$signature=EncodeJwt ($hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes("$header.$payload")))}finally{$hmac.Dispose()}
$auth=@{Authorization="JWT $header.$payload.$signature";'User-Agent'='EID-PD-release'}
$manifest=Get-Content (Join-Path $root 'extension/manifest-firefox.json') -Raw|ConvertFrom-Json
$addon=[uri]::EscapeDataString($manifest.browser_specific_settings.gecko.id)
$version=Invoke-RestMethod "https://addons.mozilla.org/api/v5/addons/addon/$addon/versions/$VersionId/" -Headers $auth
if($version.channel -ne $Channel){throw "Expected a $Channel submission."}
if($version.version -ne $manifest.version){throw 'Submitted version differs from the local Firefox manifest.'}
if($version.file.status -ne 'public'){
 Write-Host "WAIT Mozilla submission $VersionId, version $($version.version): $($version.file.status). No new submission was made."
 return
}
$url=[uri]$version.file.url
if($url.Scheme -ne 'https' -or $url.Host -ne 'addons.mozilla.org'){throw 'Unexpected Mozilla download origin.'}
New-Item -ItemType Directory -Path $OutputDir -Force|Out-Null
$path=Join-Path $OutputDir "eid-pd-extension-firefox-$($version.version)-signed.xpi"
Invoke-WebRequest $url.AbsoluteUri -Headers $auth -OutFile $path
$hash=Get-FileHash -LiteralPath $path -Algorithm SHA256
if($version.file.hash -and $version.file.hash -ne ('sha256:'+$hash.Hash.ToLowerInvariant())){throw 'Downloaded XPI hash differs from Mozilla metadata.'}
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive=[IO.Compression.ZipFile]::OpenRead($path)
try{
 foreach($entry in @('manifest.json','META-INF/mozilla.rsa','META-INF/mozilla.sf')){if(!$archive.GetEntry($entry)){throw "Missing signed XPI entry: $entry"}}
 $reader=[IO.StreamReader]::new($archive.GetEntry('manifest.json').Open())
 try{$actual=$reader.ReadToEnd()|ConvertFrom-Json}finally{$reader.Dispose()}
 if($actual.version -ne $version.version -or $actual.browser_specific_settings.gecko.id -ne $manifest.browser_specific_settings.gecko.id){throw 'Downloaded package identity/version mismatch.'}
}finally{$archive.Dispose()}
Write-Host "PASS signed XPI: $path"
$hash
