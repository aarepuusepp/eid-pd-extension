# Update Firefox manifest with current temporary addon ID
# Run this after loading the temporary addon in Firefox

param(
    [Parameter(Mandatory=$true)]
    [string]$ExtensionID
)

$ErrorActionPreference = "Stop"

Write-Host "`n=== Updating Firefox Manifest with Extension ID ===" -ForegroundColor Cyan
Write-Host "Extension ID: $ExtensionID" -ForegroundColor Yellow

# Update source manifest
$sourceManifest = "host-manifests\ee.aarepuusepp.eid_helper.firefox.json"
$manifestContent = Get-Content $sourceManifest | ConvertFrom-Json

# Check if ID already exists
if ($manifestContent.allowed_extensions -contains $ExtensionID) {
    Write-Host "`n✅ Extension ID already in manifest" -ForegroundColor Green
} else {
    # Add the new ID
    $manifestContent.allowed_extensions += $ExtensionID
    $manifestContent | ConvertTo-Json -Depth 10 | Set-Content $sourceManifest
    Write-Host "`n✅ Added extension ID to source manifest" -ForegroundColor Green
}

# Copy to Program Files
Write-Host "`nCopying to Program Files..." -ForegroundColor Cyan
Copy-Item $sourceManifest "C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_helper.firefox.json" -Force

Write-Host "`n=== Done! ===" -ForegroundColor Green
Write-Host "`nNow restart Firefox for changes to take effect." -ForegroundColor Yellow
Write-Host ""

# Show current allowed extensions
Write-Host "Current allowed extensions:" -ForegroundColor Cyan
$finalManifest = Get-Content "C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_helper.firefox.json" | ConvertFrom-Json
$finalManifest.allowed_extensions | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
Write-Host ""

