# Chrome/Edge Extension Setup Guide

**Issue:** "Native helper not available" error in Chrome/Edge

**Cause:** The host manifest needs the actual extension ID, not a placeholder.

---

## 🔧 Quick Fix

### Step 1: Get Your Extension ID

1. Open `edge://extensions/` (or `chrome://extensions/`)
2. Find "Estonian ID Card Personal Data Reader"
3. Copy the **Extension ID** (looks like: `abcdefghijklmnopqrstuvwxyzabcdef`)

### Step 2: Update Host Manifest

**Option A: Manual Update**

1. Open: `C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_helper.json`
2. Replace `YOUR_EXTENSION_ID` with your actual ID:

```json
{
  "name": "ee.aarepuusepp.eid_helper",
  "description": "Estonian ID Card Personal Data Reader",
  "path": "C:\\Program Files\\eid-pd-reader\\eid-pd-reader.exe",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://YOUR_ACTUAL_EXTENSION_ID_HERE/"
  ]
}
```

**Option B: Use PowerShell Script**

```powershell
# Run this in PowerShell (as Administrator)
$extensionId = "YOUR_ACTUAL_EXTENSION_ID_HERE"
$manifestPath = "C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_helper.json"

$manifest = @{
    name = "ee.aarepuusepp.eid_helper"
    description = "Estonian ID Card Personal Data Reader"
    path = "C:\\Program Files\\eid-pd-reader\\eid-pd-reader.exe"
    type = "stdio"
    allowed_origins = @("chrome-extension://$extensionId/")
} | ConvertTo-Json

$manifest | Set-Content -Path $manifestPath -Encoding UTF8
Write-Host "✓ Host manifest updated!" -ForegroundColor Green
```

### Step 3: Reload Extension

1. Go to `edge://extensions/`
2. Click the **Reload** button on your extension
3. Open the extension popup
4. Should now show "Helper: 1.0.2" ✅

---

## 📝 Full Setup Instructions

### For Chrome/Edge (Unpacked Extension)

1. **Load Extension:**
   ```
   - Open edge://extensions/ (or chrome://extensions/)
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the "extension" folder
   ```

2. **Copy Extension ID:**
   - Look for the extension in the list
   - Copy the ID (under the extension name)
   - Example: `abcdefghijklmnopqrstuvwxyzabcdef`

3. **Update Host Manifest:**
   - Edit: `C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_helper.json`
   - Replace `YOUR_EXTENSION_ID` with actual ID
   - Save file

4. **Update Registry (if needed):**
   - The registry should already be set by `install.cmd`
   - Location: `HKEY_LOCAL_MACHINE\SOFTWARE\Google\Chrome\NativeMessagingHosts\ee.aarepuusepp.eid_helper`
   - Value: `C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_helper.json`

5. **Reload Extension:**
   - Click reload button in extensions page
   - Test by opening popup

---

## 🔍 Troubleshooting

### Error: "Native helper not available"

**Check 1: Extension ID**
```powershell
# View current host manifest
Get-Content "C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_helper.json"
```

Should show your actual extension ID, not `YOUR_EXTENSION_ID`.

**Check 2: Registry**
```powershell
# Check registry entry
Get-ItemProperty "HKLM:\SOFTWARE\Google\Chrome\NativeMessagingHosts\ee.aarepuusepp.eid_helper"
```

Should point to: `C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_helper.json`

**Check 3: Helper Executable**
```powershell
# Test helper directly
& "C:\Program Files\eid-pd-reader\eid-pd-reader.exe" --version
```

Should show: `eid-pd-reader version 1.0.2`

**Check 4: Extension Console**
1. Go to `edge://extensions/`
2. Click "Details" on your extension
3. Click "Inspect views: service worker"
4. Look for errors in console

---

## 🎯 Why Firefox Works But Chrome/Edge Doesn't

### Firefox
- Uses extension ID from manifest: `eid-pd@aarepuusepp.ee`
- ID is **fixed** and known in advance
- Host manifest already has correct ID

### Chrome/Edge
- Generates **random** ID for unpacked extensions
- ID changes if you reload from different folder
- Must update host manifest with actual ID

---

## 📦 Alternative: Use Packed Extension

To get a fixed extension ID in Chrome/Edge:

1. **Pack Extension:**
   ```
   - Go to edge://extensions/
   - Click "Pack extension"
   - Select "extension" folder
   - Creates extension.crx and extension.pem
   ```

2. **Keep .pem File:**
   - The `.pem` file ensures same ID on reload
   - Store it safely

3. **Install Packed Extension:**
   - Drag .crx file to edge://extensions/
   - Extension will have same ID every time

---

## 🚀 Automated Setup Script

Create `setup-chrome-extension.ps1`:

```powershell
# Setup Chrome/Edge Extension
param(
    [Parameter(Mandatory=$true)]
    [string]$ExtensionId
)

$ErrorActionPreference = "Stop"

Write-Host "=== Setting up Chrome/Edge Extension ===" -ForegroundColor Cyan
Write-Host "Extension ID: $ExtensionId" -ForegroundColor Yellow

# Update host manifest
$manifestPath = "C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_helper.json"

$manifest = @{
    name = "ee.aarepuusepp.eid_helper"
    description = "Estonian ID Card Personal Data Reader"
    path = "C:\\Program Files\\eid-pd-reader\\eid-pd-reader.exe"
    type = "stdio"
    allowed_origins = @("chrome-extension://$ExtensionId/")
} | ConvertTo-Json

$manifest | Set-Content -Path $manifestPath -Encoding UTF8

Write-Host "✓ Host manifest updated!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Go to edge://extensions/"
Write-Host "2. Click 'Reload' on the extension"
Write-Host "3. Test by opening the extension popup"
```

**Usage:**
```powershell
.\setup-chrome-extension.ps1 -ExtensionId "abcdefghijklmnopqrstuvwxyzabcdef"
```

---

## ✅ Verification

After setup, verify everything works:

1. **Open Extension Popup:**
   - Click extension icon in toolbar

2. **Check Version Display:**
   - Should show: Extension: 1.0.2
   - Should show: Helper: 1.0.2
   - NOT: "not available"

3. **Test Card Reading:**
   - Insert ID card
   - Click "Read ID Card"
   - Should display personal data

---

## 📚 Related Files

- Host manifest: `C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_helper.json`
- Registry key: `HKLM:\SOFTWARE\Google\Chrome\NativeMessagingHosts\ee.aarepuusepp.eid_helper`
- Extension folder: `extension/`
- Background script: `extension/background.js`

---

**Status:** Follow these steps and your Chrome/Edge extension will work! 🎉

