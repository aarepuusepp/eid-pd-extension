# Bulk update script for housekeeping changes
# Updates GitHub URLs, email addresses, and host names

$ErrorActionPreference = "Stop"

Write-Host "Starting bulk updates..." -ForegroundColor Green

# Define replacements
$replacements = @(
    @{
        Pattern = 'github\.com/yourusername/web-eid-pd'
        Replacement = 'github.com/aarepuusepp/web-eid-pd'
        Description = 'GitHub URL'
    },
    @{
        Pattern = 'esteid-pd@example\.com'
        Replacement = 'aare.puusepp@gmail.com'
        Description = 'Email address'
    },
    @{
        Pattern = 'com\.example\.eid_helper'
        Replacement = 'ee.aarepuusepp.eid_helper'
        Description = 'Host name'
    }
)

# Files to update (excluding binary files and specific directories)
$filesToUpdate = Get-ChildItem -Path . -Recurse -File | 
    Where-Object { 
        $_.Extension -match '\.(md|json|js|cmd|ps1|reg|html|yaml|yml|txt|go)$' -and
        $_.FullName -notmatch '\\(node_modules|dist|\.git|repos)\\' -and
        $_.Name -ne 'update-references.ps1'
    }

$totalFiles = $filesToUpdate.Count
$updatedFiles = 0
$currentFile = 0

foreach ($file in $filesToUpdate) {
    $currentFile++
    Write-Progress -Activity "Updating files" -Status "Processing $($file.Name)" -PercentComplete (($currentFile / $totalFiles) * 100)
    
    try {
        $content = Get-Content $file.FullName -Raw -ErrorAction Stop
        $originalContent = $content
        $fileUpdated = $false
        
        foreach ($replacement in $replacements) {
            if ($content -match $replacement.Pattern) {
                $content = $content -replace $replacement.Pattern, $replacement.Replacement
                $fileUpdated = $true
                Write-Host "  Updated $($replacement.Description) in: $($file.Name)" -ForegroundColor Cyan
            }
        }
        
        if ($fileUpdated) {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            $updatedFiles++
        }
    }
    catch {
        Write-Host "  Warning: Could not process $($file.Name): $_" -ForegroundColor Yellow
    }
}

Write-Progress -Activity "Updating files" -Completed

Write-Host "`nUpdate complete!" -ForegroundColor Green
Write-Host "Files processed: $totalFiles" -ForegroundColor White
Write-Host "Files updated: $updatedFiles" -ForegroundColor White

# Rename old host manifest files
Write-Host "`nRenaming old host manifest files..." -ForegroundColor Green

if (Test-Path "host-manifests\com.example.eid_helper.json") {
    Remove-Item "host-manifests\com.example.eid_helper.json" -Force
    Write-Host "  Removed old com.example.eid_helper.json" -ForegroundColor Cyan
}

if (Test-Path "host-manifests\com.example.eid_helper.firefox.json") {
    Remove-Item "host-manifests\com.example.eid_helper.firefox.json" -Force
    Write-Host "  Removed old com.example.eid_helper.firefox.json" -ForegroundColor Cyan
}

Write-Host "`nDone!" -ForegroundColor Green

