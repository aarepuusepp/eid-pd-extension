# Sign Firefox extension using web-ext
# This creates a signed .xpi file that can be permanently installed in Firefox

param(
    [Parameter(Mandatory=$false)]
    [string]$ApiKey = $env:AMO_API_KEY,
    
    [Parameter(Mandatory=$false)]
    [string]$ApiSecret = $env:AMO_API_SECRET,
    
    [string]$OutputDir = "dist",
    
    [switch]$Help
)

if ($Help) {
    Write-Host @"

Sign Firefox Extension
======================

This script signs your Firefox extension with Mozilla, creating a .xpi file
that can be permanently installed in Firefox.

Usage:
  .\ops\sign-firefox-extension.ps1 -ApiKey YOUR_KEY -ApiSecret YOUR_SECRET

Parameters:
  -ApiKey      Mozilla AMO API key (JWT issuer)
  -ApiSecret   Mozilla AMO API secret (JWT secret)
  -OutputDir   Output directory for signed .xpi (default: dist)
  -Help        Show this help message

Environment Variables:
  AMO_API_KEY     Can be used instead of -ApiKey
  AMO_API_SECRET  Can be used instead of -ApiSecret

Getting API Credentials:
  1. Create account at https://addons.mozilla.org
  2. Go to https://addons.mozilla.org/developers/addon/api/key/
  3. Click "Generate new credentials"
  4. Save your API key and secret

Example:
  .\ops\sign-firefox-extension.ps1 -ApiKey "user:12345:67" -ApiSecret "abc123..."

For more information, see FIREFOX-DISTRIBUTION.md

"@
    exit 0
}

$ErrorActionPreference = "Stop"

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          Firefox Extension Signing Tool                      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Check for API credentials
if (-not $ApiKey -or -not $ApiSecret) {
    Write-Host "`n❌ ERROR: API credentials not provided" -ForegroundColor Red
    Write-Host "`nYou need Mozilla AMO API credentials to sign the extension." -ForegroundColor Yellow
    Write-Host "`nOptions:" -ForegroundColor Cyan
    Write-Host "  1. Pass as parameters:" -ForegroundColor White
    Write-Host "     .\ops\sign-firefox-extension.ps1 -ApiKey YOUR_KEY -ApiSecret YOUR_SECRET" -ForegroundColor Green
    Write-Host "`n  2. Set environment variables:" -ForegroundColor White
    Write-Host "     `$env:AMO_API_KEY = 'YOUR_KEY'" -ForegroundColor Green
    Write-Host "     `$env:AMO_API_SECRET = 'YOUR_SECRET'" -ForegroundColor Green
    Write-Host "`n  3. Get credentials:" -ForegroundColor White
    Write-Host "     https://addons.mozilla.org/developers/addon/api/key/" -ForegroundColor Green
    Write-Host "`nFor more information, run:" -ForegroundColor Yellow
    Write-Host "  .\ops\sign-firefox-extension.ps1 -Help" -ForegroundColor Green
    Write-Host ""
    exit 1
}

# Check if web-ext is installed
Write-Host "`n[1/5] Checking prerequisites..." -ForegroundColor Yellow
if (-not (Get-Command web-ext -ErrorAction SilentlyContinue)) {
    Write-Host "  web-ext not found, installing..." -ForegroundColor Yellow
    
    # Check if npm is installed
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Host "`n❌ ERROR: npm not found" -ForegroundColor Red
        Write-Host "`nPlease install Node.js from https://nodejs.org/" -ForegroundColor Yellow
        Write-Host "Then run this script again." -ForegroundColor Yellow
        exit 1
    }
    
    npm install -g web-ext
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n❌ ERROR: Failed to install web-ext" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✅ web-ext installed" -ForegroundColor Green
} else {
    Write-Host "  ✅ web-ext found" -ForegroundColor Green
}

# Check if extension directory exists
Write-Host "`n[2/5] Checking extension files..." -ForegroundColor Yellow
if (-not (Test-Path "extension\manifest-firefox.json")) {
    Write-Host "`n❌ ERROR: extension/manifest-firefox.json not found" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}
Write-Host "  ✅ Extension files found" -ForegroundColor Green

# Create output directory
Write-Host "`n[3/5] Preparing output directory..." -ForegroundColor Yellow
New-Item -Path $OutputDir -ItemType Directory -Force | Out-Null
Write-Host "  ✅ Output directory: $OutputDir" -ForegroundColor Green

# Package extension first (using manifest-firefox.json)
Write-Host "`n[4/5] Packaging extension..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$packagePath = "$OutputDir\esteid-pd-extension-unsigned-$timestamp.zip"

# Create temporary directory with correct manifest
$tempDir = "$OutputDir\temp-firefox-extension"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
Copy-Item "extension" $tempDir -Recurse

# Use Firefox manifest
Copy-Item "extension\manifest-firefox.json" "$tempDir\manifest.json" -Force

# Create ZIP
Compress-Archive -Path "$tempDir\*" -DestinationPath $packagePath -Force
Remove-Item $tempDir -Recurse -Force

Write-Host "  ✅ Package created: $packagePath" -ForegroundColor Green

# Sign the extension
Write-Host "`n[5/5] Signing extension with Mozilla..." -ForegroundColor Yellow
Write-Host "  This may take a few minutes..." -ForegroundColor Gray

try {
    # Recreate temp dir for signing
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force
    }
    New-Item -Path $tempDir -ItemType Directory -Force | Out-Null
    
    # Copy extension files
    Copy-Item "extension\*" $tempDir -Recurse -Force
    Copy-Item "extension\manifest-firefox.json" "$tempDir\manifest.json" -Force
    
    # Sign with web-ext
    $artifactsDir = (Resolve-Path $OutputDir).Path
    $sourceDir = (Resolve-Path $tempDir).Path
    
    web-ext sign `
        --api-key=$ApiKey `
        --api-secret=$ApiSecret `
        --channel=unlisted `
        --artifacts-dir=$artifactsDir `
        --source-dir=$sourceDir
    
    if ($LASTEXITCODE -ne 0) {
        throw "web-ext sign failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "`n❌ ERROR: Signing failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`nCommon issues:" -ForegroundColor Yellow
    Write-Host "  • Invalid API credentials" -ForegroundColor White
    Write-Host "  • Extension validation errors" -ForegroundColor White
    Write-Host "  • Network connectivity issues" -ForegroundColor White
    Write-Host "`nCheck the error message above for details." -ForegroundColor Yellow
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force
    }
    exit 1
} finally {
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force
    }
}

# Find the signed .xpi file
$signedFiles = Get-ChildItem -Path $OutputDir -Filter "*.xpi" | Sort-Object LastWriteTime -Descending
if ($signedFiles.Count -eq 0) {
    Write-Host "`n⚠️  WARNING: No .xpi file found in output directory" -ForegroundColor Yellow
    Write-Host "The signing may have failed. Check the output above for errors." -ForegroundColor Yellow
    exit 1
}

$signedFile = $signedFiles[0]
$finalPath = "$OutputDir\esteid-pd-extension-signed.xpi"
Copy-Item $signedFile.FullName $finalPath -Force

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║          ✅ EXTENSION SIGNED SUCCESSFULLY!                  ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`n📦 Signed extension:" -ForegroundColor Cyan
Write-Host "   $finalPath" -ForegroundColor Green
Write-Host "`n📊 File size: $([math]::Round($signedFile.Length / 1KB, 2)) KB" -ForegroundColor Yellow

Write-Host "`n🎯 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Test the signed extension:" -ForegroundColor White
Write-Host "      • Open Firefox" -ForegroundColor Gray
Write-Host "      • Drag $finalPath into Firefox" -ForegroundColor Gray
Write-Host "      • Click 'Add' to install" -ForegroundColor Gray
Write-Host "`n   2. Distribute the .xpi file:" -ForegroundColor White
Write-Host "      • Include in your installer" -ForegroundColor Gray
Write-Host "      • Host on your website" -ForegroundColor Gray
Write-Host "      • Send to users" -ForegroundColor Gray
Write-Host "`n   3. Update installer:" -ForegroundColor White
Write-Host "      • Copy .xpi file to installer package" -ForegroundColor Gray
Write-Host "      • Update install.cmd to include extension" -ForegroundColor Gray

Write-Host "`n📚 Documentation:" -ForegroundColor Cyan
Write-Host "   See FIREFOX-DISTRIBUTION.md for complete guide" -ForegroundColor White
Write-Host ""

