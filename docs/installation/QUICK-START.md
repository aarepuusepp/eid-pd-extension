# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Everything

```powershell
# Right-click and "Run as Administrator"
.\install.cmd
```

This installs:
- ✅ Native helper to `C:\Program Files\eid-pd-reader\`
- ✅ Registry entries for Chrome, Edge, and Firefox
- ✅ All necessary configuration files

### Step 2: Install Browser Extension

#### Chrome/Edge
1. Open `chrome://extensions/` or `edge://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension` folder
5. **Copy the Extension ID**
6. Update `C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_helper.json`:
   ```json
   "allowed_origins": [
     "chrome-extension://YOUR_EXTENSION_ID/"
   ]
   ```

#### Firefox
1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on..."
3. Select `extension/manifest-firefox.json`
4. **Copy the Extension ID** (e.g., `abc123...@temporary-addon`)
5. Run as Administrator:
   ```powershell
   .\ops\update-firefox-extension-id.ps1 -ExtensionID "YOUR_ID@temporary-addon"
   ```
6. Restart Firefox

### Step 3: Test It

1. **Insert your ID card** into the reader
2. **Open demo page:** `demo/index.html`
3. **Click "Check Status"** - should show ✅ Ready
4. **Click "Read ID Card"** - should display your data

---

## 🆘 Troubleshooting

### "Card not found! Please insert your ID card"
✅ **This is normal!** Just insert your ID card.

### "Native helper not available"
**Chrome/Edge:**
- Check extension ID in manifest
- Restart browser

**Firefox:**
- Extension ID changes each time you load it
- Run: `.\ops\update-firefox-extension-id.ps1 -ExtensionID "YOUR_ID"`
- Restart Firefox

### Extension works sometimes, not others (Firefox)
**Cause:** Firefox temporary addon gets a new ID each restart

**Fix:** Use the update script after each Firefox restart:
```powershell
.\ops\update-firefox-extension-id.ps1 -ExtensionID "YOUR_NEW_ID@temporary-addon"
```

**Better:** Use Chrome/Edge for development (stable IDs)

### "pcsc: no readers found"
- Check if card reader is connected
- Install card reader drivers
- Restart computer

---

## 📚 Next Steps

### For Development
- Read `FIREFOX-TEMPORARY-ADDON.md` for Firefox-specific issues
- Read `EXTENSION-GUIDE.md` for extension API details
- Read `README.md` for complete documentation

### For Production
- Sign the Firefox extension (see `FIREFOX-TEMPORARY-ADDON.md`)
- Package extensions: `.\ops\package-extension.ps1`
- Deploy using `install.cmd` on target machines

---

## 🎯 Common Tasks

### Update Native Helper
```powershell
# Rebuild
go build -o eid-pd-reader.exe .

# Copy to Program Files (as Admin)
Copy-Item eid-pd-reader.exe "C:\Program Files\eid-pd-reader\" -Force
```

### Update Extension
1. Make changes to `extension/` files
2. Reload extension in browser:
   - Chrome/Edge: Click reload icon on extension card
   - Firefox: Click "Reload" button
3. Reload your test page

### Test Without Card
Remove card and test error handling:
```powershell
.\eid-pd-reader.exe --dump
# Should show: {"ok":false,"error":"CARD_NOT_FOUND"}
```

### Uninstall Everything
```powershell
# Right-click and "Run as Administrator"
.\uninstall.cmd

# Or use registry file
.\ops\unregister-all.reg
```

---

## 📖 Documentation

| File | Description |
|------|-------------|
| `README.md` | Complete documentation |
| `INSTALLATION.md` | Detailed installation guide |
| `EXTENSION-INSTALL.md` | Browser extension installation |
| `FIREFOX-TEMPORARY-ADDON.md` | Firefox-specific issues |
| `BROWSER-SUPPORT.md` | Browser compatibility |
| `TROUBLESHOOTING.md` | Common issues and solutions |

---

## 🔗 Useful Links

- **Test Page:** `demo/index.html`
- **Diagnostic Page:** `test-extension.html`
- **Native Messaging Test:** `test-native-messaging.html`

---

## ⚡ Pro Tips

1. **Use Chrome/Edge for development** - stable extension IDs
2. **Sign Firefox extension** for permanent ID
3. **Check Browser Console** (F12) for detailed errors
4. **Use `--verbose` flag** for native helper debugging:
   ```powershell
   .\eid-pd-reader.exe --verbose --dump
   ```
5. **Cache is 5 minutes** - use "Clear Cache" to force re-read

---

**Need help?** Check the documentation or open an issue on GitHub.
