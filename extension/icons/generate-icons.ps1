# Generate simple placeholder icons for the extension
# Requires PowerShell 5.1+ (Windows 10+)

Write-Host "Generating placeholder icons..." -ForegroundColor Cyan

# Create a simple SVG icon
$svg = @"
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" fill="#0072CE" rx="16"/>
  <rect x="16" y="32" width="96" height="64" fill="white" rx="8"/>
  <rect x="24" y="40" width="32" height="24" fill="#FFD700" rx="2"/>
  <text x="64" y="72" font-family="Arial" font-size="20" font-weight="bold" fill="#0072CE" text-anchor="middle">ID</text>
  <rect x="24" y="72" width="80" height="4" fill="#E0E0E0" rx="2"/>
  <rect x="24" y="80" width="60" height="4" fill="#E0E0E0" rx="2"/>
  <rect x="24" y="88" width="70" height="4" fill="#E0E0E0" rx="2"/>
</svg>
"@

# Save SVG
$svg | Out-File -FilePath "icon.svg" -Encoding utf8

Write-Host "✓ Created icon.svg" -ForegroundColor Green
Write-Host ""
Write-Host "To create PNG icons, you can:" -ForegroundColor Yellow
Write-Host "1. Use an online converter: https://www.aconvert.com/image/svg-to-png/" -ForegroundColor Gray
Write-Host "2. Use Inkscape: inkscape icon.svg --export-png=icon128.png -w 128 -h 128" -ForegroundColor Gray
Write-Host "3. Use ImageMagick: convert -density 300 icon.svg -resize 128x128 icon128.png" -ForegroundColor Gray
Write-Host ""
Write-Host "For now, Chrome will use default icons." -ForegroundColor Cyan

