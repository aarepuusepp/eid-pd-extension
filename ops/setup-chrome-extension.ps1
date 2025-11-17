# Setup Chrome/Edge Extension
# Updates the host manifest with the actual extension ID

param(
    [Parameter(Mandatory=$false)]
    [string]$ExtensionId
)

$ErrorActionPreference = "Stop"

Write-Host "`n=== Chrome/Edge Extension Setup ===" -ForegroundColor Cyan
Write-Host "This script updates the host manifest with your extension ID`n" -ForegroundColor Yellow

# If extension ID not provided, prompt for it
if (-not $ExtensionId) {
    Write-Host "To find your Extension ID:" -ForegroundColor White
    Write-Host "1. Open edge://extensions/ (or chrome://extensions/)" -ForegroundColor Gray
    Write-Host "2. Find 'Estonian ID Card Personal Data Reader'" -ForegroundColor Gray
    Write-Host "3. Copy the Extension ID (looks like: abcdefghijklmnopqrstuvwxyzabcdef)`n" -ForegroundColor Gray
    
    $ExtensionId = Read-Host "Enter your Extension ID"
    
    if ([string]::IsNullOrWhiteSpace($ExtensionId)) {
        Write-Host "✗ Extension ID is required!" -ForegroundColor Red
        exit 1
    }
}

# Validate extension ID format (32 lowercase letters)
if ($ExtensionId -notmatch '^[a-z]{32}$') {
    Write-Host "✗ Invalid Extension ID format!" -ForegroundColor Red
    Write-Host "  Expected: 32 lowercase letters (a-z)" -ForegroundColor Yellow
    Write-Host "  Got: $ExtensionId" -ForegroundColor Yellow
    exit 1
}

Write-Host "Extension ID: $ExtensionId" -ForegroundColor Green

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "`n⚠️  Warning: Not running as Administrator" -ForegroundColor Yellow
    Write-Host "   You may not have permission to update the host manifest" -ForegroundColor Yellow
    Write-Host "   Consider running as Administrator if this fails`n" -ForegroundColor Yellow
}

# Update host manifest
$manifestPath = "C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_helper.json"

Write-Host "`nUpdating host manifest..." -ForegroundColor Yellow
Write-Host "Path: $manifestPath" -ForegroundColor Gray

try {
    $manifest = @{
        name = "ee.aarepuusepp.eid_helper"
        description = "Estonian ID Card Personal Data Reader"
        path = "C:\\Program Files\\eid-pd-reader\\eid-pd-reader.exe"
        type = "stdio"
        allowed_origins = @("chrome-extension://$ExtensionId/")
    } | ConvertTo-Json -Depth 10

    $manifest | Set-Content -Path $manifestPath -Encoding UTF8 -Force
    
    Write-Host "✓ Host manifest updated successfully!" -ForegroundColor Green
    
    # Verify the update
    Write-Host "`nVerifying update..." -ForegroundColor Yellow
    $content = Get-Content -Path $manifestPath -Raw | ConvertFrom-Json
    
    if ($content.allowed_origins[0] -eq "chrome-extension://$ExtensionId/") {
        Write-Host "✓ Verification passed!" -ForegroundColor Green
    } else {
        Write-Host "✗ Verification failed!" -ForegroundColor Red
        Write-Host "  Expected: chrome-extension://$ExtensionId/" -ForegroundColor Yellow
        Write-Host "  Got: $($content.allowed_origins[0])" -ForegroundColor Yellow
        exit 1
    }
    
} catch {
    Write-Host "✗ Failed to update host manifest!" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Yellow
    
    if (-not $isAdmin) {
        Write-Host "`n  Try running as Administrator:" -ForegroundColor Yellow
        Write-Host "  Right-click PowerShell → Run as Administrator" -ForegroundColor Gray
    }
    
    exit 1
}

# Check if helper is installed
Write-Host "`nChecking helper installation..." -ForegroundColor Yellow
$helperPath = "C:\Program Files\eid-pd-reader\eid-pd-reader.exe"

if (Test-Path $helperPath) {
    Write-Host "✓ Helper found: $helperPath" -ForegroundColor Green
    
    # Get version
    try {
        $version = & $helperPath --version 2>&1 | Select-Object -First 1
        Write-Host "  Version: $version" -ForegroundColor Gray
    } catch {
        Write-Host "  (Could not get version)" -ForegroundColor Gray
    }
} else {
    Write-Host "✗ Helper not found!" -ForegroundColor Red
    Write-Host "  Please run install.cmd first" -ForegroundColor Yellow
}

# Check registry
Write-Host "`nChecking registry..." -ForegroundColor Yellow

$registryFound = $false

# Check HKCU (Current User) - where install.cmd registers
$regPathHKCU = "HKCU:\SOFTWARE\Google\Chrome\NativeMessagingHosts\ee.aarepuusepp.eid_helper"
try {
    $regValue = Get-ItemProperty -Path $regPathHKCU -Name "(Default)" -ErrorAction Stop
    Write-Host "✓ Registry entry found (HKCU)" -ForegroundColor Green
    Write-Host "  Path: $($regValue.'(Default)')" -ForegroundColor Gray
    $registryFound = $true
} catch {
    # Try HKLM (Local Machine)
    $regPathHKLM = "HKLM:\SOFTWARE\Google\Chrome\NativeMessagingHosts\ee.aarepuusepp.eid_helper"
    try {
        $regValue = Get-ItemProperty -Path $regPathHKLM -Name "(Default)" -ErrorAction Stop
        Write-Host "✓ Registry entry found (HKLM)" -ForegroundColor Green
        Write-Host "  Path: $($regValue.'(Default)')" -ForegroundColor Gray
        $registryFound = $true
    } catch {
        Write-Host "✗ Registry entry not found!" -ForegroundColor Red
        Write-Host "  Please run install.cmd first" -ForegroundColor Yellow
    }
}

# Final instructions
Write-Host "`n=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Open edge://extensions/ (or chrome://extensions/)" -ForegroundColor White
Write-Host "2. Find 'Estonian ID Card Personal Data Reader'" -ForegroundColor White
Write-Host "3. Click the 'Reload' button (circular arrow icon)" -ForegroundColor White
Write-Host "4. Click the extension icon in toolbar" -ForegroundColor White
Write-Host "5. Verify it shows: Helper: 1.0.2 (not 'not available')" -ForegroundColor White

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "If you still see 'Native helper not available', try:" -ForegroundColor Yellow
Write-Host "  - Restart Edge/Chrome completely" -ForegroundColor Gray
Write-Host "  - Check extension console for errors (Details → Inspect views)" -ForegroundColor Gray

