# Integration Flow Diagram

Visual guide showing how web applications integrate with the Estonian ID Card Reader extension.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Your Web Application                      │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Frontend (Browser)                     │  │
│  │                                                            │  │
│  │  JavaScript Code:                                         │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │  const result = await EstEID_PD.readPersonalData(); │ │  │
│  │  │  if (result.ok) {                                    │ │  │
│  │  │    // Use result.data                                │ │  │
│  │  │  }                                                    │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │                           │                                │  │
│  │                           │ window.EstEID_PD API           │  │
│  │                           ▼                                │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │         Browser Extension (Injected API)            │ │  │
│  │  │         • page-api.js (injected into page)          │ │  │
│  │  │         • content-bridge.js (message passing)       │ │  │
│  │  │         • background.js (native messaging)          │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────────┘
                              │ Native Messaging Protocol
                              │ (stdio, JSON, length-prefixed)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Operating System Level                        │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Native Helper (eid-pd-reader.exe)              │  │
│  │              • Reads PC/SC commands                       │  │
│  │              • Parses card data                           │  │
│  │              • Returns JSON response                      │  │
│  └──────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────────┘
                              │ PC/SC Protocol
                              │ (APDU commands)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Hardware Level                            │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Smart Card Reader                        │  │
│  │                  (USB or built-in)                        │  │
│  └──────────────────────────┬───────────────────────────────┘  │
│                              │ ISO 7816 Protocol                 │
│                              ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Estonian ID Card                         │  │
│  │                  • Personal Data Files                    │  │
│  │                  • No PIN required for reading            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Detailed Message Flow

### Successful Read Operation

```
┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
│   Web    │         │  Page    │         │ Content  │         │Background│         │  Native  │
│   Page   │         │   API    │         │  Bridge  │         │  Script  │         │  Helper  │
└────┬─────┘         └────┬─────┘         └────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │                    │                    │
     │ 1. User clicks     │                    │                    │                    │
     │    "Read ID Card"  │                    │                    │                    │
     │────────────────────>                    │                    │                    │
     │                    │                    │                    │                    │
     │ 2. Call API        │                    │                    │                    │
     │ EstEID_PD.read()   │                    │                    │                    │
     │────────────────────>                    │                    │                    │
     │                    │                    │                    │                    │
     │                    │ 3. postMessage     │                    │                    │
     │                    │ (window.postMessage)│                   │                    │
     │                    │────────────────────>                    │                    │
     │                    │                    │                    │                    │
     │                    │                    │ 4. Forward to      │                    │
     │                    │                    │ background         │                    │
     │                    │                    │ (chrome.runtime    │                    │
     │                    │                    │  .sendMessage)     │                    │
     │                    │                    │────────────────────>                    │
     │                    │                    │                    │                    │
     │                    │                    │                    │ 5. Call native     │
     │                    │                    │                    │ (chrome.runtime    │
     │                    │                    │                    │  .sendNative       │
     │                    │                    │                    │   Message)         │
     │                    │                    │                    │────────────────────>
     │                    │                    │                    │                    │
     │                    │                    │                    │                    │ 6. Read card
     │                    │                    │                    │                    │    via PC/SC
     │                    │                    │                    │                    │    ┌─────┐
     │                    │                    │                    │                    │───>│Card │
     │                    │                    │                    │                    │<───│     │
     │                    │                    │                    │                    │    └─────┘
     │                    │                    │                    │                    │
     │                    │                    │                    │ 7. Return data     │
     │                    │                    │                    │<────────────────────
     │                    │                    │                    │                    │
     │                    │                    │ 8. Return to       │                    │
     │                    │                    │    content         │                    │
     │                    │                    │<────────────────────                    │
     │                    │                    │                    │                    │
     │                    │ 9. postMessage     │                    │                    │
     │                    │    response        │                    │                    │
     │                    │<────────────────────                    │                    │
     │                    │                    │                    │                    │
     │ 10. Resolve        │                    │                    │                    │
     │     Promise        │                    │                    │                    │
     │<────────────────────                    │                    │                    │
     │                    │                    │                    │                    │
     │ 11. Use data       │                    │                    │                    │
     │ (populate form,    │                    │                    │                    │
     │  authenticate)     │                    │                    │                    │
     │                    │                    │                    │                    │
```

---

## Data Flow Details

### Request Format

**From Web Page to Extension:**
```javascript
// postMessage to content script
{
  target: 'ESTEID_PD_EXTENSION',
  type: 'READ_PERSONAL_DATA',
  requestId: 123,
  options: {
    useCache: false,
    timeout: 30000
  }
}
```

**From Extension to Native Helper:**
```json
{
  "command": "getPersonalData",
  "options": {
    "useCache": false
  }
}
```

### Response Format

**From Native Helper to Extension:**
```json
{
  "ok": true,
  "data": {
    "surname": "JÕEORG",
    "givenName": "JAAK-KRISTJAN",
    "sex": "M",
    "citizenship": "EST",
    "birthDate": "01 08 1980",
    "personalCode": "38001085718",
    "documentNr": "AT0000222",
    "expiryDate": "09 12 2029",
    "issueDate": "09 12 2024",
    "source": "chip:Thales"
  }
}
```

**From Extension to Web Page:**
```javascript
// postMessage response
{
  target: 'ESTEID_PD_PAGE',
  type: 'READ_PERSONAL_DATA_RESPONSE',
  requestId: 123,
  payload: {
    ok: true,
    data: { /* ... */ },
    cached: false,
    cacheAge: 0
  }
}
```

---

## Error Flow

### Card Not Found

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│   Web    │         │  Native  │         │   Card   │
│   Page   │         │  Helper  │         │  Reader  │
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │
     │ 1. Request read    │                    │
     │────────────────────>                    │
     │                    │                    │
     │                    │ 2. Connect to      │
     │                    │    reader          │
     │                    │────────────────────>
     │                    │                    │
     │                    │ 3. No card         │
     │                    │<────────────────────
     │                    │                    │
     │ 4. Error response  │                    │
     │<────────────────────                    │
     │ {                  │                    │
     │   ok: false,       │                    │
     │   error: "Card     │                    │
     │   not found!"      │                    │
     │ }                  │                    │
     │                    │                    │
     │ 5. Show error      │                    │
     │    to user         │                    │
     │                    │                    │
```

---

## Security Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                      Browser Sandbox                             │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Your Web Page (https://yourdomain.com)                  │  │
│  │  • Can only call EstEID_PD API                           │  │
│  │  • Cannot access native messaging directly               │  │
│  │  • Origin validated by extension                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Browser Extension                                        │  │
│  │  • Validates origin (externally_connectable)             │  │
│  │  • Bridges page ↔ native helper                          │  │
│  │  • Caches data (5 minutes)                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────┬───────────────────────────────────────┘
                            │ Native Messaging
                            │ (only allowed extension IDs)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Operating System                            │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Native Helper (eid-pd-reader.exe)                          │  │
│  │  • Validates extension ID (allowed_origins)              │  │
│  │  • Reads card via PC/SC                                  │  │
│  │  • Returns data only to allowed extension                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Security Checks

1. **Origin Validation**
   - Extension manifest: `externally_connectable.matches`
   - Only whitelisted domains can access API

2. **Extension ID Validation**
   - Host manifest: `allowed_origins`
   - Only registered extension can call native helper

3. **Content Script Validation**
   - `event.source === window` check
   - Prevents cross-frame attacks

4. **No Persistent Storage**
   - Data cached in memory only (5 minutes)
   - No localStorage, no IndexedDB

---

## Integration Checklist

### Prerequisites
- [ ] Extension installed in browser
- [ ] Native helper installed (`eid-pd-reader.exe`)
- [ ] Host manifest registered (registry/file)
- [ ] Extension ID configured in host manifest
- [ ] Web app origin configured in extension manifest

### Runtime Checks
- [ ] `window.EstEID_PD` is defined
- [ ] `checkStatus()` returns `available: true`
- [ ] Card reader is connected
- [ ] ID card is inserted

### Error Handling
- [ ] Extension not found → Show installation guide
- [ ] Helper not available → Show helper installation
- [ ] Card not found → Prompt to insert card
- [ ] Reader not found → Prompt to connect reader
- [ ] Timeout → Show retry option

### Security
- [ ] Use HTTPS only
- [ ] Verify data on backend
- [ ] Don't store data locally
- [ ] Clear cache on logout
- [ ] Validate personal code format

---

## Performance Considerations

### Typical Timings

| Operation | Time | Notes |
|-----------|------|-------|
| Extension load | < 100ms | On page load |
| Status check | < 50ms | Cached after first check |
| Card read (first) | 2-5s | Includes card detection |
| Card read (cached) | < 10ms | From memory cache |
| Cache expiry | 5 min | Configurable |

### Optimization Tips

1. **Check status once** on page load
2. **Use cache** for repeated reads (same session)
3. **Show loading state** during card read
4. **Debounce** rapid button clicks
5. **Clear cache** only when necessary (logout, verification)

---

## Troubleshooting Flow

```
Start: User clicks "Read ID Card"
│
├─> Is window.EstEID_PD defined?
│   ├─> NO: Show "Install Extension" message
│   │       └─> END
│   │
│   └─> YES: Continue
│       │
│       ├─> Call checkStatus()
│       │   ├─> available: false
│       │   │   └─> Show "Install Native Helper" message
│       │   │       └─> END
│       │   │
│       │   └─> available: true
│       │       │
│       │       ├─> Call readPersonalData()
│       │       │   ├─> Error: "Card not found"
│       │       │   │   └─> Show "Insert Card" prompt
│       │       │   │       └─> Retry or END
│       │       │   │
│       │       │   ├─> Error: "No readers found"
│       │       │   │   └─> Show "Connect Reader" prompt
│       │       │   │       └─> Retry or END
│       │       │   │
│       │       │   ├─> Error: "Timeout"
│       │       │   │   └─> Show "Retry" option
│       │       │   │       └─> Retry or END
│       │       │   │
│       │       │   └─> Success: ok: true
│       │       │       └─> Use data
│       │       │           └─> END (Success!)
```

---

## Next Steps

1. **Read the guides:**
   - [APPLICATION-INTEGRATION-GUIDE.md](../APPLICATION-INTEGRATION-GUIDE.md) - Complete integration guide
   - [INTEGRATION-QUICK-REFERENCE.md](../INTEGRATION-QUICK-REFERENCE.md) - Quick reference

2. **Try the demo:**
   - Open [demo/index.html](../demo/index.html)
   - Test with your ID card

3. **Integrate into your app:**
   - Copy minimal integration code
   - Add error handling
   - Test thoroughly

4. **Deploy to production:**
   - Configure origins in manifest
   - Sign extension (optional)
   - Create installer for users

---

**Questions?** See [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) or open an issue on GitHub.

