# Render the rectangle-based icon.svg in its full viewBox before downsampling.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
[xml]$svg = Get-Content (Join-Path $PSScriptRoot 'icon.svg') -Raw
$canvas = [Drawing.Bitmap]::new(1024, 1024)
$graphics = [Drawing.Graphics]::FromImage($canvas)
try {
    $graphics.Clear([Drawing.Color]::Transparent)
    $graphics.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.ScaleTransform(8, 8)
    foreach ($rect in $svg.svg.ChildNodes | Where-Object LocalName -eq 'rect') {
        $x = [single]$rect.GetAttribute('x'); $y = [single]$rect.GetAttribute('y')
        $w = [single]$rect.GetAttribute('width'); $h = [single]$rect.GetAttribute('height')
        $radius = [single]$rect.GetAttribute('rx')
        $brush = [Drawing.SolidBrush]::new([Drawing.ColorTranslator]::FromHtml($rect.GetAttribute('fill')))
        $path = [Drawing.Drawing2D.GraphicsPath]::new()
        try {
            if ($radius -gt 0) {
                $d = 2 * [Math]::Min($radius, [Math]::Min($w, $h) / 2)
                $path.AddArc($x, $y, $d, $d, 180, 90)
                $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
                $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
                $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
                $path.CloseFigure()
                $graphics.FillPath($brush, $path)
            } else { $graphics.FillRectangle($brush, $x, $y, $w, $h) }
        } finally { $path.Dispose(); $brush.Dispose() }
    }
    foreach ($size in @(16, 20, 24, 32, 48, 64, 96, 128)) {
        $bitmap = [Drawing.Bitmap]::new($size, $size)
        $output = [Drawing.Graphics]::FromImage($bitmap)
        try {
            $output.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $output.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $output.DrawImage($canvas, [Drawing.Rectangle]::new(0, 0, $size, $size), 0, 0, 1024, 1024, [Drawing.GraphicsUnit]::Pixel)
            $bitmap.Save((Join-Path $PSScriptRoot "icon$size.png"), [Drawing.Imaging.ImageFormat]::Png)
        } finally { $output.Dispose(); $bitmap.Dispose() }
        Write-Host "Generated icon$size.png"
    }
} finally { $graphics.Dispose(); $canvas.Dispose() }
