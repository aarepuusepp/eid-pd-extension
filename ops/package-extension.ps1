# Package the browser extension for distribution
# Creates a .zip file ready for Chrome Web Store or manual installation
# Can be run from any directory (resolves paths relative to script location)

param(
    [string]$OutputDir = "",
    [switch]$IncludeIcons = $false
)

$ErrorActionPreference = "Stop"

# Resolve project root (parent of ops/ directory)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Push-Location $ProjectRoot

if ([string]::IsNullOrEmpty($OutputDir)) {
    $OutputDir = "dist"
}

Write-Host "=== Packaging Browser Extension ===" -ForegroundColor Cyan
Write-Host "Project root: $ProjectRoot" -ForegroundColor Gray
Write-Host ""

# Get extension version from manifest
$manifest = Get-Content "extension/manifest.json" | ConvertFrom-Json
$version = $manifest.version
$outputFile = "$OutputDir/esteid-pd-extension-v$version.zip"

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

# Files to include
$files = @(
    "extension/manifest.json",
    "extension/background.js",
    "extension/content-bridge.js",
    "extension/page-api.js",
    "extension/web-eid-fallback.js",
    "extension/popup/popup.html",
    "extension/popup/popup.css",
    "extension/popup/popup.js"
)

# Check if icons exist (SVG or PNG)
$iconsSvgExist = Test-Path "extension/icons/icon.svg"
$iconsPngExist = Test-Path "extension/icons/icon16.png"
if ($iconsSvgExist) {
    $files += @("extension/icons/icon.svg")
}
if ($iconsPngExist -or $IncludeIcons) {
    $files += @(
        "extension/icons/icon16.png",
        "extension/icons/icon32.png",
        "extension/icons/icon48.png",
        "extension/icons/icon128.png"
    )
}

Write-Host "Packaging files..." -ForegroundColor Yellow

# Create zip archive
Compress-Archive -Path $files -DestinationPath $outputFile -Force

Write-Host ""
Write-Host "=== Package Created ===" -ForegroundColor Green
Write-Host "File: $outputFile" -ForegroundColor Cyan
Write-Host "Version: $version" -ForegroundColor Cyan
Write-Host "Size: $([math]::Round((Get-Item $outputFile).Length / 1KB, 2)) KB" -ForegroundColor Cyan
Write-Host ""

if (!$iconsSvgExist -and !$iconsPngExist) {
    Write-Host "Warning: Icons not found. Extension will use default icons." -ForegroundColor Yellow
    Write-Host "   Run 'extension/icons/generate-icons.ps1' to create icons." -ForegroundColor Gray
    Write-Host ""
}

Write-Host "To install in Chrome:" -ForegroundColor Yellow
Write-Host "1. Open chrome://extensions/" -ForegroundColor Gray
Write-Host "2. Enable 'Developer mode'" -ForegroundColor Gray
Write-Host "3. Click 'Load unpacked' and select the 'extension' folder" -ForegroundColor Gray
Write-Host "   OR" -ForegroundColor Gray
Write-Host "4. Drag and drop the .zip file onto the extensions page" -ForegroundColor Gray
Write-Host ""

Write-Host "Extension ID will be generated on first load." -ForegroundColor Cyan
Write-Host "Copy the ID and update ee.aarepuusepp.eid_pd_reader.json" -ForegroundColor Cyan

Pop-Location
