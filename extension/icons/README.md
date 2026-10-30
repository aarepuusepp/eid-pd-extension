# Extension icons

`icon.svg` is the source artwork. Firefox uses this vector file; Chromium uses
PNGs rendered at 16, 20, 24, 32, 48, 64, 96 and 128 pixels. The toolbar manifest
supplies explicit sizes for standard and scaled displays.

After editing the SVG, regenerate the PNGs on Windows:

```powershell
pwsh -File extension/icons/generate-icons.ps1
```

The generator supports the rectangle shapes used by this SVG and renders the
entire 128-by-128 viewBox before downsampling. If other SVG elements are added,
extend the renderer before regenerating.

Reload the unpacked extension after updating its files; refreshing a website
alone does not refresh browser toolbar icons.
