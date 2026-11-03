# Submit a checked package to Mozilla AMO. Never print credentials.
param(
 [string]$ApiKey=$env:AMO_API_KEY,
 [string]$ApiSecret=$env:AMO_API_SECRET,
 [ValidateSet('unlisted','listed')][string]$Channel='unlisted',
 [string]$OutputDir='',
 [string]$AmoMetadataFile='',
 [int]$ApprovalTimeout=900000,
 [switch]$Help
)
if($Help){
 Write-Host 'Run npm ci first. Set AMO_API_KEY and AMO_API_SECRET locally, then run ./ops/sign-firefox-extension.ps1. Default: -Channel unlisted (signed XPI for permanent installation). For a public listing use -Channel listed; initial submissions also require -AmoMetadataFile <metadata.json>. See docs/installation/FIREFOX-DISTRIBUTION.md.'
 return
}
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot
if(!$OutputDir){$OutputDir=Join-Path $root 'dist'}
$OutputDir=[IO.Path]::GetFullPath($OutputDir)
$webExt=Join-Path $root 'node_modules/web-ext/bin/web-ext.js'
if(!(Test-Path -LiteralPath $webExt)){throw 'Run npm ci in eid-pd-extension first.'}
if(!$ApiKey){$ApiKey=$env:WEB_EXT_API_KEY}
if(!$ApiSecret){$ApiSecret=$env:WEB_EXT_API_SECRET}
if(!$ApiKey -or !$ApiSecret){throw 'Set AMO_API_KEY and AMO_API_SECRET locally. Do not send credentials in chat.'}
if($AmoMetadataFile){$AmoMetadataFile=(Resolve-Path -LiteralPath $AmoMetadataFile).Path}
$manifest=Get-Content (Join-Path $root 'extension/manifest-firefox.json') -Raw|ConvertFrom-Json
& (Join-Path $PSScriptRoot 'package-extension-firefox.ps1') -OutputDir $OutputDir
$zip=Join-Path $OutputDir "eid-pd-extension-firefox-$($manifest.version).zip"
# A unique directory prevents an old signed XPI from being reported as success.
$submission=Join-Path $OutputDir ('amo-'+$Channel+'-'+[guid]::NewGuid().ToString('N'))
$stage=Join-Path $submission 'source'
New-Item -ItemType Directory -Path $stage -Force|Out-Null
$previousKey=$env:WEB_EXT_API_KEY
$previousSecret=$env:WEB_EXT_API_SECRET
try{
 Expand-Archive -LiteralPath $zip -DestinationPath $stage
 & node $webExt lint --source-dir $stage --warnings-as-errors --no-config-discovery
 if($LASTEXITCODE -ne 0){throw 'Mozilla lint failed; nothing submitted.'}
 $env:WEB_EXT_API_KEY=$ApiKey
 $env:WEB_EXT_API_SECRET=$ApiSecret
 $signArgs=@($webExt,'sign','--channel',$Channel,'--source-dir',$stage,'--artifacts-dir',$submission,'--approval-timeout',"$ApprovalTimeout",'--no-config-discovery','--no-input')
 if($AmoMetadataFile){$signArgs+=@('--amo-metadata',$AmoMetadataFile)}
 Write-Host "START AMO submission: version=$($manifest.version), channel=$Channel"
 & node @signArgs
 if($LASTEXITCODE -ne 0){throw "AMO submission did not complete (exit $LASTEXITCODE). Check the Developer Hub before retrying; a version may already be pending review."}
 $signed=@(Get-ChildItem -LiteralPath $submission -Filter '*.xpi' -File)
 if($signed.Count -eq 0){throw "No signed XPI downloaded. Check Mozilla review status; artifacts: $submission"}
 Add-Type -AssemblyName System.IO.Compression.FileSystem
 foreach($file in $signed){
  $archive=[IO.Compression.ZipFile]::OpenRead($file.FullName)
  try{
   foreach($entry in @('manifest.json','META-INF/mozilla.rsa','META-INF/mozilla.sf')){if(!$archive.GetEntry($entry)){throw "Missing signed package entry: $entry"}}
   $reader=[IO.StreamReader]::new($archive.GetEntry('manifest.json').Open())
   try{$actual=$reader.ReadToEnd()|ConvertFrom-Json}finally{$reader.Dispose()}
   if($actual.version -ne $manifest.version -or $actual.browser_specific_settings.gecko.id -ne $manifest.browser_specific_settings.gecko.id){throw 'Signed package identity/version mismatch.'}
  }finally{$archive.Dispose()}
  Write-Host "PASS signed XPI: $($file.FullName)"
  Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256
 }
}finally{
 $env:WEB_EXT_API_KEY=$previousKey
 $env:WEB_EXT_API_SECRET=$previousSecret
 $stagePath=[IO.Path]::GetFullPath($stage)
 if(!$stagePath.StartsWith($OutputDir+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw 'Stage path outside output directory'}
 if(Test-Path -LiteralPath $stagePath){Remove-Item -LiteralPath $stagePath -Recurse -Force}
}
