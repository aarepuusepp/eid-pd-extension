# eid-pd-extension - Estonian ID Card Browser Extension

Browser extension that provides JavaScript API for reading personal data from Estonian ID cards via the native eid-pd-reader component.

## Overview

The eid-pd-extension is a cross-browser extension (Chrome, Edge, Firefox) that bridges web applications with the native eid-pd-reader component via native messaging. It provides a simple JavaScript API for web developers to integrate ID card reading functionality.

## Features

- **Cross-Browser:** Chrome, Edge, Firefox support
- **Simple API:** Easy-to-use JavaScript interface
- **Data Caching:** Automatic 5-minute cache
- **Native Messaging:** Secure communication with reader
- **No External Dependencies:** Pure JavaScript

## Installation

### For End Users

#### Chrome/Edge
1. Open `chrome://extensions/` or `edge://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` folder
5. Note the Extension ID
6. Configure the ID in eid-pd-reader (see below)

#### Firefox
1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `extension/manifest-firefox.json`
4. Extension ID is fixed: `eid-pd@aarepuusepp.ee`

### Configuring Extension ID

After installation, you must configure the extension ID in the native reader:

1. Copy your extension ID from browser
2. Edit the reader's host manifest:
   - Location: `C:\Program Files\eid-pd-reader\ee.aarepuusepp.eid_pd_reader.json`
   - Replace `YOUR_EXTENSION_ID` with actual ID
3. Reload the extension

See [../eid-pd-reader/docs/guides/EXTENSION-ID-CONFIGURATION.md](../eid-pd-reader/docs/guides/EXTENSION-ID-CONFIGURATION.md) for details.

## Usage for Web Developers

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
    <script src="chrome-extension://YOUR_EXTENSION_ID/page-api.js"></script>
</head>
<body>
    <button onclick="readCard()">Read ID Card</button>
    <div id="result"></div>

    <script>
    async function readCard() {
        try {
            const data = await window.EstEID_PD.readPersonalData();
            document.getElementById('result').innerHTML = `
                <p>Name: ${data.givenName} ${data.surname}</p>
                <p>Personal Code: ${data.personalCode}</p>
                <p>Document: ${data.documentNumber}</p>
            `;
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
    </script>
</body>
</html>
```

### API Reference

#### `window.EstEID_PD.readPersonalData()`

Reads personal data from ID card.

**Returns:** Promise<PersonalData>

```javascript
{
    surname: string,
    givenName: string,
    personalCode: string,
    documentNumber: string,
    dateOfBirth: string,
    placeOfBirth: string,
    issuedDate: string,
    expiryDate: string,
    citizenship: string,
    source: string
}
```

#### `window.EstEID_PD.clearCache()`

Clears cached personal data.

**Returns:** Promise<void>

#### `window.EstEID_PD.version`

Extension version string.

**Type:** string

### Examples

See [examples/](./examples/) folder for:
- `demo/index.html` - Complete demo application
- `test-extension.html` - Extension testing page
- `test-native-messaging.html` - Native messaging test

## Building

### Package for Chrome/Edge

```powershell
cd ops
.\package-extension.ps1
```

Output: `dist/eid-pd-extension-chrome.zip`

### Package for Firefox

```powershell
cd ops
.\sign-firefox-extension.ps1
```

Output: `dist/eid-pd-extension-firefox.xpi`

## Development

### Project Structure

```
extension/
├── manifest.json              # Chrome/Edge manifest
├── manifest-firefox.json      # Firefox manifest
├── background.js              # Chrome/Edge background script
├── background-firefox.js      # Firefox background script
├── page-api.js                # Public JavaScript API
├── content-bridge.js          # Content script bridge
├── popup/                     # Extension popup UI
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
└── icons/                     # Extension icons
```

### Testing

1. Load extension in browser (see Installation)
2. Open `examples/demo/index.html`
3. Click "Read ID Card" button
4. Verify data is displayed

### Debugging

#### Chrome/Edge
1. Go to `chrome://extensions/`
2. Find your extension
3. Click "Inspect views: service worker"
4. Check console for errors

#### Firefox
1. Go to `about:debugging#/runtime/this-firefox`
2. Find your extension
3. Click "Inspect"
4. Check console for errors

## Documentation

- [Integration Guide](./docs/guides/APPLICATION-INTEGRATION-GUIDE.md)
- [Quick Reference](./docs/guides/INTEGRATION-QUICK-REFERENCE.md)
- [Installation Guide](./docs/installation/)
- [Developer Cheat Sheet](./docs/guides/DEVELOPER-CHEAT-SHEET.md)

## Browser Compatibility

- **Chrome:** 109+
- **Edge:** 109+
- **Firefox:** 109+

All browsers must support Manifest V3.

## Security

- Extension only communicates with configured native reader
- No data sent to external servers
- All processing is local
- Data cached only in browser's local storage
- Cache automatically expires after 5 minutes

See [Security Documentation](../eid-pd-reader/docs/reference/SECURITY.md) for details.

## Troubleshooting

### "Native helper not available"
- Ensure eid-pd-reader is installed
- Check extension ID is configured in reader's host manifest
- Verify host manifest path in registry (Windows)

### Extension doesn't load
- Check browser version (must be 109+)
- Verify manifest file is valid JSON
- Check browser console for errors

### Data not reading
- Ensure card is inserted in reader
- Check eid-pd-reader is running
- Try clearing cache: `EstEID_PD.clearCache()`

See [Troubleshooting Guide](../eid-pd-reader/docs/reference/TROUBLESHOOTING.md) for more.

## Related Components

- [eid-pd-reader](../eid-pd-reader/) - Native reader component
- [libopenpace-go](../libopenpace-go/) - PACE protocol library

## Publishing

### Chrome Web Store
1. Build extension: `.\ops\package-extension.ps1`
2. Upload to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. Fill in store listing details
4. Submit for review

### Mozilla Add-ons
1. Build extension: `.\ops\sign-firefox-extension.ps1`
2. Upload to [Mozilla Add-ons Developer Hub](https://addons.mozilla.org/developers/)
3. Fill in listing details
4. Submit for review

## License

MIT License

## Support

- **Issues:** [GitHub Issues](https://github.com/aarepuusepp/web-eid-pd/issues)
- **Email:** aare.puusepp@gmail.com
- **Documentation:** See [docs/](./docs/) folder

## Version

Current version: 1.0.2

See [Release Notes](../eid-pd-reader/docs/releases/) for changelog.

