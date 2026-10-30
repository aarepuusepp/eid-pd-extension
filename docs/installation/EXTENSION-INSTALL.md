# Browser Extension Installation Guide

This guide explains how to install the Estonian ID Card Personal Data Reader browser extension and configure it to work with the native helper.

## Prerequisites

1. **Native Helper Installed**: Make sure you've built and installed `eid-pd-reader.exe` first
   - See [README.md](README.md#building) for build instructions
   - See [README.md](README.md#installation) for installation instructions

2. **Supported Browser**:
   - **Chrome**: Version 88+ (Manifest V3) - Latest: 142.0
   - **Edge**: Version 88+ (Manifest V3) - Latest: 142.0
   - **Firefox**: Version 109+ (Manifest V3) - Latest: 145.0
   - **Safari**: ❌ Not supported (see [SAFARI-LIMITATIONS.md](SAFARI-LIMITATIONS.md))

**Note:** All browsers use Manifest V3. Since Chrome 121+ and Firefox 121+, both `service_worker` and `scripts` can coexist in the same manifest (each browser uses what it needs and ignores the other).

## Installation Steps

Choose your browser:
- [Chrome / Edge (Chromium)](#chrome--edge-installation)
- [Firefox](#firefox-installation)
- [Safari](#safari-installation)

---

## Chrome / Edge Installation

### Step 1: Load the Extension

#### Option A: Load Unpacked (Development)

1. Open your browser and navigate to:
   - **Chrome**: `chrome://extensions/`
   - **Edge**: `edge://extensions/`

2. Enable **Developer mode** (toggle in top-right corner)

3. Click **"Load unpacked"**

4. Navigate to your project directory and select the `extension` folder:
   ```
   C:\WebROOT\TARKVARA.NEW\Digisign\web-eid\web-eid-pd\extension
   ```

5. The extension should now appear in your extensions list

6. **Copy the Extension ID** (it looks like: `abcdefghijklmnopqrstuvwxyzabcdef`)

#### Option B: Package and Install (Production)

1. Package the extension:
   ```powershell
   .\ops\package-extension.ps1
   ```

2. This creates: `dist/esteid-pd-extension-v1.0.0.zip`

3. In your browser:
   - Drag and drop the `.zip` file onto `chrome://extensions/`
   - OR extract the zip and use "Load unpacked" on the extracted folder

4. **Copy the Extension ID**

### Step 2: Update Native Host Manifest

The native host manifest tells the browser where to find the native helper and which extensions can use it.

1. Open the host manifest file:
   - **Windows**: `host-manifests\ee.aarepuusepp.eid_helper.json`
   - **Linux**: `~/.config/google-chrome/NativeMessagingHosts/ee.aarepuusepp.eid_helper.json`
   - **macOS**: `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/ee.aarepuusepp.eid_helper.json`

2. Update the `allowed_origins` field with your Extension ID:

```json
{
  "name": "ee.aarepuusepp.eid_helper",
  "description": "Estonian ID Card Personal Data Reader",
  "path": "C:\\Program Files\\eid-pd-reader\\eid-pd-reader.exe",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://YOUR_EXTENSION_ID_HERE/"
  ]
}
```

**Replace** `YOUR_EXTENSION_ID_HERE` with the actual Extension ID you copied in Step 1.

**Example**:
```json
"allowed_origins": [
  "chrome-extension://abcdefghijklmnopqrstuvwxyzabcdef/"
]
```

3. Save the file

### Step 3: Register the Host Manifest (Windows)

On Windows, you need to register the host manifest in the Windows Registry:

1. Open the registry script:
   ```
   host-manifests\windows\registry-install.cmd
   ```

2. **Verify the path** in the script matches your manifest location:
   ```batch
   reg add "HKLM\Software\Google\Chrome\NativeMessagingHosts\ee.aarepuusepp.eid_helper" /ve /t REG_SZ /d "C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_helper.json" /f
   ```

3. **Run as Administrator**:
   ```powershell
   # Right-click and "Run as Administrator"
   # OR from PowerShell:
   Start-Process -FilePath "host-manifests\windows\registry-install.cmd" -Verb RunAs
   ```

4. You should see: `The operation completed successfully.`

### Step 4: Verify Installation

1. **Restart your browser** (important!)

2. Open the extension popup:
   - Click the extension icon in the toolbar
   - OR click the puzzle icon and pin the extension

3. The popup should show:
   - ✅ **"Ready to read"** - Everything is working
   - ⚠️ **"Native helper not available"** - Check steps below

4. Test with the demo page:
   ```powershell
   # Start a local web server
   cd demo
   python -m http.server 8000
   # OR
   npx serve .
   ```

5. Open `http://localhost:8000` in your browser

6. Click **"Check Status"** - should show ✅ Ready

7. Insert your ID card and click **"Read ID Card"**

## Troubleshooting

### Extension Shows "Native helper not available"

**Check 1: Extension ID in Manifest**
```powershell
# View the manifest
Get-Content "C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_helper.json"

# Verify the Extension ID matches
# Open chrome://extensions/ and compare
```

**Check 2: Registry Entry**
```powershell
# Check if registry entry exists
reg query "HKLM\Software\Google\Chrome\NativeMessagingHosts\ee.aarepuusepp.eid_helper"

# Should show the path to your manifest file
```

**Check 3: Native Helper Path**
```powershell
# Verify the helper exists
Test-Path "C:\Program Files\eid-pd-reader\eid-pd-reader.exe"

# Try running it manually
& "C:\Program Files\eid-pd-reader\eid-pd-reader.exe" --dump
```

**Check 4: Browser Console**
1. Open extension popup
2. Right-click anywhere in the popup
3. Select "Inspect"
4. Check the Console tab for errors

**Check 5: Background Service Worker**
1. Go to `chrome://extensions/`
2. Find your extension
3. Click "Inspect views: service worker"
4. Check Console for errors like:
   - `Specified native messaging host not found`
   - `Native host has exited`

### Common Errors

#### "Specified native messaging host not found"

**Cause**: Browser can't find the host manifest

**Solution**:
1. Verify registry entry (Windows)
2. Check manifest file location
3. Restart browser

#### "Native host has exited"

**Cause**: Native helper crashed or can't run

**Solution**:
1. Test helper manually: `eid-pd-reader.exe --dump`
2. Check if PC/SC service is running
3. Check helper logs (if any)

#### "Access denied" when registering

**Cause**: Not running as Administrator

**Solution**: Right-click `registry-install.cmd` and "Run as Administrator"

#### Extension ID keeps changing

**Cause**: Loading unpacked extension generates a new ID each time

**Solution**:
1. Package the extension (creates stable ID)
2. OR use a fixed extension key (for development)

### Edge-Specific Configuration

Edge uses the same extension format as Chrome, but different registry location:

1. **Register for Edge**:
   ```batch
   reg add "HKLM\Software\Microsoft\Edge\NativeMessagingHosts\ee.aarepuusepp.eid_helper" /ve /t REG_SZ /d "C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_helper.json" /f
   ```

2. **Update host manifest** to include both Chrome and Edge:
   ```json
   "allowed_origins": [
     "chrome-extension://YOUR_CHROME_EXTENSION_ID/",
     "extension://YOUR_EDGE_EXTENSION_ID/"
   ]
   ```

---

## Firefox Installation

Firefox 109+ supports Manifest V3. Since Firefox 121+ and Chrome 121+, you can use both `service_worker` and `scripts` in the same manifest for cross-browser compatibility.

### Step 1: Load the Firefox Extension

#### Option A: Temporary Installation (Development)

1. Open Firefox and navigate to:
   ```
   about:debugging#/runtime/this-firefox
   ```

2. Click **"Load Temporary Add-on..."**

3. Navigate to the extension folder and select **`manifest-firefox.json`**:
   ```
   C:\WebROOT\TARKVARA.NEW\Digisign\web-eid\web-eid-pd\extension\manifest-firefox.json
   ```
   
   **Note:** Since Chrome 121+ and Firefox 121+, you can actually use the same `manifest.json` for both browsers (it includes both `service_worker` and `scripts`). We keep `manifest-firefox.json` for clarity and Firefox-specific settings.

4. The extension will be loaded temporarily (removed on browser restart)

5. **Copy the Extension ID** or use the predefined ID: `aare.puusepp@gmail.com`

#### Option B: Permanent Installation (Signed)

For permanent installation, the extension must be signed by Mozilla:

1. **Package the extension**:
   ```powershell
   # Firefox requires its own package (different background format)
   .\ops\package-extension-firefox.ps1
   ```

2. **Submit to Mozilla Add-ons**:
   - Go to https://addons.mozilla.org/developers/
   - Create an account
   - Submit the .zip file
   - Wait for review (1-7 days)

3. **Or self-sign** (for private distribution):
   ```bash
   # Install web-ext tool
   npm install -g web-ext
   
   # Sign the extension
   cd extension
   web-ext sign --api-key=YOUR_KEY --api-secret=YOUR_SECRET
   ```

### Step 2: Update Firefox Native Host Manifest

1. **Copy the Firefox manifest** to the installation directory:
   ```powershell
   # Windows
   Copy-Item host-manifests\ee.aarepuusepp.eid_helper.firefox.json "C:\Program Files\eid-pd-reader\"
   ```

2. **Verify the manifest** has the correct extension ID:
   ```json
   {
     "name": "ee.aarepuusepp.eid_helper",
     "description": "Estonian ID Card Personal Data Reader",
     "path": "C:\\Program Files\\eid-pd-reader\\eid-pd-reader.exe",
     "type": "stdio",
     "allowed_extensions": [
       "aare.puusepp@gmail.com"
     ]
   }
   ```

### Step 3: Register the Native Host (Windows)

1. **Run the Firefox registry installer**:
   ```powershell
   # Run as Administrator
   .\host-manifests\windows\registry-install-firefox.cmd
   ```

   Or manually:
   ```batch
   reg add "HKLM\Software\Mozilla\NativeMessagingHosts\ee.aarepuusepp.eid_helper" /ve /t REG_SZ /d "C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_helper.firefox.json" /f
   ```

### Step 4: Verify Firefox Installation

1. **Restart Firefox**

2. Open the extension popup or test page

3. Check Browser Console (Ctrl+Shift+J) for errors

### Firefox on Linux

1. **Copy manifest** to:
   ```bash
   mkdir -p ~/.mozilla/native-messaging-hosts/
   cp host-manifests/ee.aarepuusepp.eid_helper.firefox.json ~/.mozilla/native-messaging-hosts/
   ```

2. **Update path** in manifest:
   ```json
   "path": "/usr/local/bin/eid-pd-reader"
   ```

### Firefox on macOS

1. **Copy manifest** to:
   ```bash
   mkdir -p ~/Library/Application\ Support/Mozilla/NativeMessagingHosts/
   cp host-manifests/ee.aarepuusepp.eid_helper.firefox.json ~/Library/Application\ Support/Mozilla/NativeMessagingHosts/
   ```

2. **Update path** in manifest:
   ```json
   "path": "/usr/local/bin/eid-pd-reader"
   ```

---

## Safari Installation

**⚠️ Safari is NOT currently supported** due to lack of Native Messaging API.

See [SAFARI-LIMITATIONS.md](SAFARI-LIMITATIONS.md) for:
- Technical limitations
- Why Safari doesn't work
- Alternative approaches
- Possible future solutions

**Recommended alternatives for Safari users:**
1. Use Chrome, Firefox, or Edge instead
2. Use DigiDoc4 Client (official RIA application)
3. Wait for potential native macOS app development

## Testing the Installation

### Quick Test

```javascript
// Open browser console (F12) on any page
// Check if API is available
console.log(window.EstEID_PD);

// Try to read status
EstEID_PD.checkStatus().then(console.log);

// Try to read card (if inserted)
EstEID_PD.readPersonalData().then(console.log);
```

### Full Test with Demo Page

1. Open `demo/index.html` in your browser
2. Click "Check Status" - should be green
3. Insert ID card
4. Click "Read ID Card"
5. Personal data should appear

## Uninstallation

### Remove Extension

1. Go to `chrome://extensions/`
2. Find "Estonian ID Card Personal Data Reader"
3. Click "Remove"

### Remove Native Helper

```powershell
# Remove registry entry
reg delete "HKLM\Software\Google\Chrome\NativeMessagingHosts\ee.aarepuusepp.eid_helper" /f

# Remove files
Remove-Item "C:\Program Files\eid-pd-reader" -Recurse -Force
```

## Next Steps

- Read the [Usage Examples](README.md#usage) in the main README
- Check out the [Demo Page](demo/index.html) source code
- Integrate into your web application
- See [SUPPORTED-CARDS.md](SUPPORTED-CARDS.md) for card compatibility

## Support

If you encounter issues:

1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Run diagnostics: `.\ops\diagnose-card.ps1`
3. Check browser console for errors
4. Open an issue on GitHub with:
   - Browser version
   - Extension version
   - Error messages from console
   - Output of `eid-pd-reader.exe --debug`

