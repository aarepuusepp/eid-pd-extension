# Update Firefox native host manifest with extension ID
# Run this after loading the temporary addon in Firefox
# Requires administrator privileges to write to Program Files

param(
    [Parameter(Mandatory=$true)]
    [string]$ExtensionID
)

$ErrorActionPreference = "Stop"

$manifestPath = "C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_pd_reader.firefox.json"

Write-Host "`n=== Updating Firefox Native Host Manifest ===" -ForegroundColor Cyan
Write-Host "Extension ID: $ExtensionID" -ForegroundColor Yellow
Write-Host "Manifest: $manifestPath" -ForegroundColor Gray

if (-not (Test-Path $manifestPath)) {
    Write-Host "`nERROR: Native host manifest not found at: $manifestPath" -ForegroundColor Red
    Write-Host "Please install eid-pd-reader first (run install-reader.cmd)." -ForegroundColor Yellow
    exit 1
}

$manifestContent = Get-Content $manifestPath | ConvertFrom-Json

if ($manifestContent.allowed_extensions -contains $ExtensionID) {
    Write-Host "`nExtension ID already in manifest" -ForegroundColor Green
} else {
    $manifestContent.allowed_extensions += $ExtensionID
    $manifestContent | ConvertTo-Json -Depth 10 | Set-Content $manifestPath -Force
    Write-Host "`nAdded extension ID to manifest" -ForegroundColor Green
}

Write-Host "`n=== Done! ===" -ForegroundColor Green
Write-Host "`nNow restart Firefox for changes to take effect." -ForegroundColor Yellow
Write-Host ""

Write-Host "Current allowed extensions:" -ForegroundColor Cyan
$finalManifest = Get-Content $manifestPath | ConvertFrom-Json
$finalManifest.allowed_extensions | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
Write-Host ""

