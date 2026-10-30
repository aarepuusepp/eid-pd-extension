# Complete Installation Guide

## Quick Installation (Recommended)

### Prerequisites

1. **Windows 10/11** (64-bit)
2. **Administrator rights**
3. **Smart card reader** connected
4. **Built `eid-pd-reader.exe`** in project root

### One-Command Installation

```powershell
# Right-click and "Run as Administrator"
.\install.cmd
```

This will:
- ✅ Copy `eid-pd-reader.exe` to `C:\Program Files\eid-pd-reader\`
- ✅ Copy host manifests for all browsers
- ✅ Register native host for Chrome
- ✅ Register native host for Edge
- ✅ Register native host for Firefox
- ✅ Create all necessary registry entries

---

## What Gets Installed

### Files

```
C:\Program Files\eid-pd-reader\
├── eid-pd-reader.exe                           # Native helper
├── ee.aarepuusepp.eid_helper.json              # Chrome/Edge manifest
└── ee.aarepuusepp.eid_helper.firefox.json      # Firefox manifest
```

### Registry Entries

**Chrome:**
```
HKLM\Software\Google\Chrome\NativeMessagingHosts\ee.aarepuusepp.eid_helper
  (Default) = "C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_helper.json"
```

**Edge:**
```
HKLM\Software\Microsoft\Edge\NativeMessagingHosts\ee.aarepuusepp.eid_helper
  (Default) = "C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_helper.json"
```

**Firefox:**
```
HKLM\Software\Mozilla\NativeMessagingHosts\ee.aarepuusepp.eid_helper
  (Default) = "C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_helper.firefox.json"
```

---

## After Installation

### Step 1: Install Browser Extension

#### Chrome

1. Open `chrome://extensions/`
2. Enable **"Developer mode"** (top-right toggle)
3. Click **"Load unpacked"**
4. Select the `extension` folder
5. **Copy the Extension ID** (looks like: `abcdefghijklmnopqrstuvwxyzabcdef`)
6. Update `C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_helper.json`:
   ```json
   "allowed_origins": [
     "chrome-extension://YOUR_EXTENSION_ID/"
   ]
   ```

#### Edge

1. Open `edge://extensions/`
2. Enable **"Developer mode"** (left sidebar)
3. Click **"Load unpacked"**
4. Select the `extension` folder
5. **Copy the Extension ID**
6. Update `C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_helper.json`:
   ```json
   "allowed_origins": [
     "chrome-extension://YOUR_CHROME_ID/",
     "extension://YOUR_EDGE_ID/"
   ]
   ```

#### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click **"Load Temporary Add-on..."**
3. Select `extension/manifest-firefox.json`
4. Extension ID is predefined: `aare.puusepp@gmail.com`

### Step 2: Restart Browser

Close and restart your browser for the native host registration to take effect.

### Step 3: Test Installation

#### Test Native Helper

```powershell
# Test if helper works
C:\"Program Files"\eid-pd-reader\eid-pd-reader.exe --dump

# Should show personal data if card is inserted
```

#### Test Extension

1. **Open extension popup** (click extension icon)
2. Should show: **"Ready to read"** ✅
3. Insert ID card
4. Click **"Read ID Card"**
5. Personal data should appear

#### Test in Browser Console

Press F12, then:
```javascript
// Check if API is available
window.EstEID_PD

// Check status
await EstEID_PD.checkStatus()

// Read card
await EstEID_PD.readPersonalData()
```

---

## Manual Installation

If you prefer to install manually or the automatic installer fails:

### 1. Copy Files

```powershell
# Create directory
mkdir "C:\Program Files\eid-pd-reader"

# Copy files
copy eid-pd-reader.exe "C:\Program Files\eid-pd-reader\"
copy host-manifests\ee.aarepuusepp.eid_helper.json "C:\Program Files\eid-pd-reader\"
copy host-manifests\ee.aarepuusepp.eid_helper.firefox.json "C:\Program Files\eid-pd-reader\"
```

### 2. Register Native Hosts

```powershell
# Chrome
reg add "HKLM\Software\Google\Chrome\NativeMessagingHosts\ee.aarepuusepp.eid_helper" /ve /t REG_SZ /d "C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_helper.json" /f

# Edge
reg add "HKLM\Software\Microsoft\Edge\NativeMessagingHosts\ee.aarepuusepp.eid_helper" /ve /t REG_SZ /d "C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_helper.json" /f

# Firefox
reg add "HKLM\Software\Mozilla\NativeMessagingHosts\ee.aarepuusepp.eid_helper" /ve /t REG_SZ /d "C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_helper.firefox.json" /f
```

### 3. Install Browser Extensions

Follow the steps in "After Installation" above.

---

## Verification

### Check Files

```powershell
# Verify files exist
Test-Path "C:\Program Files\eid-pd-reader\eid-pd-reader.exe"
Test-Path "C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_helper.json"
Test-Path "C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_helper.firefox.json"
```

### Check Registry

```powershell
# Chrome
reg query "HKLM\Software\Google\Chrome\NativeMessagingHosts\ee.aarepuusepp.eid_helper"

# Edge
reg query "HKLM\Software\Microsoft\Edge\NativeMessagingHosts\ee.aarepuusepp.eid_helper"

# Firefox
reg query "HKLM\Software\Mozilla\NativeMessagingHosts\ee.aarepuusepp.eid_helper"
```

### Check Extension

```javascript
// In browser console
EstEID_PD.checkStatus().then(status => {
  if (status.ok && status.available) {
    console.log('✅ Extension is working!');
  } else {
    console.error('❌ Extension not working:', status.error);
  }
});
```

---

## Uninstallation

### Automatic Uninstall

```powershell
# Right-click and "Run as Administrator"
.\uninstall.cmd
```

### Manual Uninstall

```powershell
# Remove registry entries
reg delete "HKLM\Software\Google\Chrome\NativeMessagingHosts\ee.aarepuusepp.eid_helper" /f
reg delete "HKLM\Software\Microsoft\Edge\NativeMessagingHosts\ee.aarepuusepp.eid_helper" /f
reg delete "HKLM\Software\Mozilla\NativeMessagingHosts\ee.aarepuusepp.eid_helper" /f

# Remove files
Remove-Item "C:\Program Files\eid-pd-reader" -Recurse -Force

# Remove browser extensions manually from browser settings
```

---

## Troubleshooting

### Issue: "This script must be run as Administrator"

**Solution:** Right-click `install.cmd` and select "Run as Administrator"

### Issue: "eid-pd-reader.exe not found"

**Solution:** Run `install.cmd` from the project root directory where `eid-pd-reader.exe` is located

### Issue: "Failed to create directory"

**Solution:** Check if you have write permissions to `C:\Program Files\`

### Issue: Extension shows "Native helper not available"

**Possible causes:**
1. Native host not registered (run `install.cmd` as Administrator)
2. Browser not restarted after installation
3. Extension ID not updated in manifest (Chrome/Edge only)

**Solution:**
```powershell
# Check if registry entries exist
reg query "HKLM\Software\Google\Chrome\NativeMessagingHosts\ee.aarepuusepp.eid_helper"

# Re-run installer if missing
.\install.cmd
```

### Issue: "Access denied" errors

**Solution:** Ensure you're running as Administrator and no other programs are using the files

---

## Multi-User Installation

To install for all users on the computer, modify the registry paths:

```powershell
# Instead of HKLM (current user), use HKLM (local machine)
# Requires Administrator rights

# Chrome (all users)
reg add "HKLM\Software\Google\Chrome\NativeMessagingHosts\ee.aarepuusepp.eid_helper" /ve /t REG_SZ /d "C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_helper.json" /f

# Edge (all users)
reg add "HKLM\Software\Microsoft\Edge\NativeMessagingHosts\ee.aarepuusepp.eid_helper" /ve /t REG_SZ /d "C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_helper.json" /f

# Firefox (all users)
reg add "HKLM\Software\Mozilla\NativeMessagingHosts\ee.aarepuusepp.eid_helper" /ve /t REG_SZ /d "C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_helper.firefox.json" /f
```

---

## Enterprise Deployment

For deploying to multiple computers:

### Option 1: Group Policy (Windows Domain)

1. Create a Group Policy Object (GPO)
2. Add registry entries via GPO
3. Deploy `eid-pd-reader.exe` via software distribution
4. Deploy extension via Chrome/Edge/Firefox enterprise policies

### Option 2: SCCM/Intune

1. Package `install.cmd` and files as application
2. Deploy to target computers
3. Configure extension deployment via enterprise policies

### Option 3: Silent Installation Script

```powershell
# Silent install (no prompts)
Start-Process -FilePath "install.cmd" -Verb RunAs -WindowStyle Hidden -Wait
```

---

## Next Steps

After successful installation:

1. ✅ Test with demo page: `demo/index.html`
2. ✅ Read documentation: `README.md`
3. ✅ Integrate into your web application
4. ✅ Test with both IDEMIA and Thales cards

---

## Support

- **Documentation**: See `README.md`
- **Troubleshooting**: See `TROUBLESHOOTING.md`
- **Browser Support**: See `BROWSER-SUPPORT.md`
- **Extension Guide**: See `EXTENSION-GUIDE.md`

---

**Installation complete! You're ready to read Estonian ID cards from web browsers!** 🎉

