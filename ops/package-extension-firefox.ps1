param([string]$OutputDir='', [switch]$IncludeIcons)
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot
if(!$OutputDir){$OutputDir=Join-Path $root 'dist'}
$OutputDir=[IO.Path]::GetFullPath($OutputDir)
New-Item -ItemType Directory -Force $OutputDir|Out-Null
$stage=Join-Path $OutputDir ('stage-'+[guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory $stage|Out-Null
Copy-Item (Join-Path $root 'extension/*') $stage -Recurse
Copy-Item (Join-Path $stage 'manifest-firefox.json') (Join-Path $stage 'manifest.json') -Force
Remove-Item -LiteralPath (Join-Path $stage 'manifest-firefox.json')
$manifest=Get-Content (Join-Path $stage 'manifest.json') -Raw|ConvertFrom-Json
$zip=Join-Path $OutputDir "eid-pd-extension-firefox-$($manifest.version).zip"
Compress-Archive -Path "$stage/*" -DestinationPath $zip -Force
Write-Host "PASS $zip"
Write-Host 'This is a store submission/development ZIP, not a signed public release. Use eid-pd-installer/build-installer.ps1 for a matched workstation package.'
