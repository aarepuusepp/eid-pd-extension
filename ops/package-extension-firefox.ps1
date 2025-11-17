# Package the Firefox browser extension for distribution

param(
    [string]$OutputDir = "dist",
    [switch]$IncludeIcons = $false
)

$ErrorActionPreference = "Stop"

Write-Host "=== Packaging Firefox Extension ===" -ForegroundColor Cyan
Write-Host ""

# Get extension version from manifest
$manifest = Get-Content "extension/manifest-firefox.json" | ConvertFrom-Json
$version = $manifest.version
$outputFile = "$OutputDir/esteid-pd-extension-firefox-v$version.zip"

# Create output directory
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
    Write-Host "✓ Created output directory: $OutputDir" -ForegroundColor Green
}

# Remove old package if exists
if (Test-Path $outputFile) {
    Remove-Item $outputFile -Force
    Write-Host "✓ Removed old package" -ForegroundColor Green
}

# Create temporary directory
$tempDir = "temp-firefox-build"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy files
Write-Host "Copying files..." -ForegroundColor Yellow

# Copy manifest as manifest.json (Firefox expects this name)
Copy-Item "extension/manifest-firefox.json" "$tempDir/manifest.json"

# Copy JavaScript files
Copy-Item "extension/background-firefox.js" "$tempDir/background-firefox.js"
Copy-Item "extension/content-bridge.js" "$tempDir/content-bridge.js"
Copy-Item "extension/page-api.js" "$tempDir/page-api.js"
Copy-Item "extension/web-eid-fallback.js" "$tempDir/web-eid-fallback.js"

# Copy popup
Copy-Item "extension/popup" "$tempDir/popup" -Recurse

# Copy icons if they exist
$iconsExist = Test-Path "extension/icons/icon16.png"
if ($iconsExist -or $IncludeIcons) {
    Copy-Item "extension/icons" "$tempDir/icons" -Recurse
}

Write-Host "Packaging files..." -ForegroundColor Yellow

# Create zip archive from temp directory
Compress-Archive -Path "$tempDir\*" -DestinationPath $outputFile -Force

# Clean up temp directory
Remove-Item $tempDir -Recurse -Force

Write-Host ""
Write-Host "=== Firefox Package Created ===" -ForegroundColor Green
Write-Host "File: $outputFile" -ForegroundColor Cyan
Write-Host "Version: $version" -ForegroundColor Cyan
Write-Host "Size: $([math]::Round((Get-Item $outputFile).Length / 1KB, 2)) KB" -ForegroundColor Cyan
Write-Host ""

if (!$iconsExist) {
    Write-Host "⚠️  Warning: Icons not found. Extension will use default icons." -ForegroundColor Yellow
    Write-Host "   Run 'extension/icons/generate-icons.ps1' to create icons." -ForegroundColor Gray
    Write-Host ""
}

Write-Host "To install in Firefox:" -ForegroundColor Yellow
Write-Host "1. Open about:debugging#/runtime/this-firefox" -ForegroundColor Gray
Write-Host "2. Click 'Load Temporary Add-on...'" -ForegroundColor Gray
Write-Host "3. Select the manifest-firefox.json file" -ForegroundColor Gray
Write-Host ""
Write-Host "For permanent installation:" -ForegroundColor Yellow
Write-Host "1. Sign the extension at https://addons.mozilla.org/developers/" -ForegroundColor Gray
Write-Host "2. Or use web-ext: web-ext sign --api-key=KEY --api-secret=SECRET" -ForegroundColor Gray
Write-Host ""

Write-Host "Don't forget to register the native host:" -ForegroundColor Cyan
Write-Host ".\host-manifests\windows\registry-install-firefox.cmd" -ForegroundColor Gray

