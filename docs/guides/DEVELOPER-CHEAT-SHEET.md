# Estonian ID Card Reader - Developer Cheat Sheet

**Quick reference for integrating web-eid-pd into your application**

---

## 🚀 3-Step Integration

```javascript
// 1. Check extension
if (window.EstEID_PD) {
  
  // 2. Read card
  const result = await EstEID_PD.readPersonalData();
  
  // 3. Use data
  if (result.ok) {
    console.log(result.data.personalCode);
  }
}
```

---

## 📦 API Methods

| Method | Returns | Use For |
|--------|---------|---------|
| `readPersonalData(opts)` | `Promise<Object>` | Read ID card |
| `checkStatus()` | `Promise<Object>` | Check availability |
| `clearCache()` | `Promise<Object>` | Clear cache |
| `isAvailable()` | `Boolean` | Sync check |

---

## 📊 Data Structure

```javascript
{
  ok: true,
  data: {
    surname: "JÕEORG",
    givenName: "JAAK-KRISTJAN",
    personalCode: "38001085718",  // 11 digits
    documentNr: "AT0000222",
    citizenship: "EST",            // ISO 3166-1
    sex: "M",                      // M or F
    birthDate: "01 08 1980",       // DD MM YYYY
    expiryDate: "09 12 2029",      // DD MM YYYY
    issueDate: "09 12 2024",       // DD MM YYYY
    source: "chip:Thales"
  },
  cached: false,
  cacheAge: 0
}
```

---

## ⚙️ Options

```javascript
await EstEID_PD.readPersonalData({
  useCache: true,    // default: true
  timeout: 30000,    // default: 30000ms
  fids: {}          // advanced: custom FIDs
});
```

---

## ❌ Error Handling

```javascript
try {
  const result = await EstEID_PD.readPersonalData();
  
  if (result.ok) {
    // Success
    processData(result.data);
  } else {
    // Error
    handleError(result.error);
  }
} catch (error) {
  // Exception
  console.error(error);
}
```

### Common Errors

| Error | Meaning | Fix |
|-------|---------|-----|
| Extension not found | Not installed | Install extension |
| Helper not available | Software missing | Install helper |
| Card not found | No card | Insert card |
| No readers found | No reader | Connect reader |
| Timeout | Too slow | Retry |

---

## 🎯 Common Patterns

### Form Auto-Fill

```javascript
const r = await EstEID_PD.readPersonalData();
if (r.ok) {
  $('#firstName').val(r.data.givenName);
  $('#lastName').val(r.data.surname);
  $('#personalCode').val(r.data.personalCode);
}
```

### Authentication

```javascript
const r = await EstEID_PD.readPersonalData({ useCache: false });
if (r.ok) {
  await fetch('/api/auth', {
    method: 'POST',
    body: JSON.stringify(r.data)
  });
}
```

### Progressive Enhancement

```javascript
if (window.EstEID_PD) {
  const s = await EstEID_PD.checkStatus();
  if (s.available) {
    showIDCardButton();
  } else {
    showManualForm();
  }
}
```

---

## 🔒 Security Checklist

- [ ] Use HTTPS only
- [ ] Verify on backend
- [ ] Don't store locally
- [ ] Clear cache on logout
- [ ] Validate personal code: `/^\d{11}$/`
- [ ] Never trust client data alone

---

## 🧪 Testing

### Browser Console (F12)

```javascript
// Check extension
window.EstEID_PD

// Check status
await EstEID_PD.checkStatus()

// Read card
await EstEID_PD.readPersonalData()
```

### Native Helper

```powershell
# Windows
C:\"Program Files"\eid-pd-reader\eid-pd-reader.exe --dump

# Should output JSON
```

---

## 📱 Framework Hooks

### React

```javascript
import { useState, useEffect } from 'react';

function useIDCard() {
  const [data, setData] = useState(null);
  
  const read = async () => {
    const r = await window.EstEID_PD.readPersonalData();
    if (r.ok) setData(r.data);
  };
  
  return { data, read };
}
```

### Vue 3

```javascript
import { ref } from 'vue';

export function useIDCard() {
  const data = ref(null);
  
  const read = async () => {
    const r = await window.EstEID_PD.readPersonalData();
    if (r.ok) data.value = r.data;
  };
  
  return { data, read };
}
```

### Angular

```typescript
@Injectable({ providedIn: 'root' })
export class IDCardService {
  async read() {
    return await (window as any).EstEID_PD.readPersonalData();
  }
}
```

---

## 🔍 Troubleshooting

### Extension Not Found

```javascript
if (!window.EstEID_PD) {
  alert('Please install the extension');
  // Show installation link
}
```

### Helper Not Available

```javascript
const s = await EstEID_PD.checkStatus();
if (!s.available) {
  alert('Please install the helper software');
  // Show helper installation link
}
```

### Card Not Found

```javascript
const r = await EstEID_PD.readPersonalData();
if (!r.ok && r.error.includes('card not found')) {
  alert('Please insert your ID card');
}
```

---

## 📖 Full Documentation

- **Quick Start:** [QUICK-START.md](QUICK-START.md)
- **Complete Guide:** [APPLICATION-INTEGRATION-GUIDE.md](APPLICATION-INTEGRATION-GUIDE.md)
- **API Reference:** [INTEGRATION-QUICK-REFERENCE.md](INTEGRATION-QUICK-REFERENCE.md)
- **All Docs:** [INTEGRATION-SUMMARY.md](INTEGRATION-SUMMARY.md)

---

## 💡 Pro Tips

1. Check availability before showing ID card features
2. Use `useCache: false` for authentication
3. Clear cache on logout
4. Show loading state (reading takes 2-5s)
5. Provide fallback for users without extension
6. Test with real cards (IDEMIA & Thales)
7. Handle Estonian characters (Õ, Ä, Ö, Ü)
8. Always verify on backend

---

## 🆘 Quick Help

| Problem | Solution |
|---------|----------|
| Extension not loading | Check if installed, refresh page |
| Helper not working | Run installer as admin, restart browser |
| Card not reading | Check card is inserted, reader connected |
| Timeout errors | Increase timeout, check reader |
| Estonian chars broken | Ensure UTF-8 encoding |

---

## 📞 Support

- **Demo:** [demo/index.html](demo/index.html)
- **Issues:** [GitHub Issues](https://github.com/aarepuusepp/web-eid-pd/issues)
- **Docs:** [INTEGRATION-SUMMARY.md](INTEGRATION-SUMMARY.md)

---

**Print this page for quick reference while coding!**

---

## 🎓 Learning Path

1. **Install** → [QUICK-START.md](QUICK-START.md) (10 min)
2. **Try demo** → [demo/index.html](demo/index.html) (5 min)
3. **Copy code** → This cheat sheet (5 min)
4. **Integrate** → Start coding!

**Total: 20 minutes to first integration**

---

## 📋 Installation Quick Reference

### Windows

```powershell
# As Administrator
.\install.cmd
```

### Browser Extension

1. Open `chrome://extensions/` (or `edge://extensions/`)
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extension` folder
5. Copy Extension ID
6. Update host manifest with Extension ID
7. Restart browser

### Verify

```javascript
// In browser console
window.EstEID_PD
// Should show: { version: "1.0.0", ... }
```

---

## 🔗 Quick Links

- [Main README](README.md)
- [Complete Integration Guide](APPLICATION-INTEGRATION-GUIDE.md)
- [Quick Reference](INTEGRATION-QUICK-REFERENCE.md)
- [When to Use](docs/WHEN-TO-USE.md)
- [Architecture](docs/INTEGRATION-FLOW.md)
- [Security](SECURITY.md)
- [Troubleshooting](TROUBLESHOOTING.md)

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**License:** [Your License]

---

**Keep this cheat sheet handy while developing!** 📌

For complete documentation, see [INTEGRATION-SUMMARY.md](INTEGRATION-SUMMARY.md)

