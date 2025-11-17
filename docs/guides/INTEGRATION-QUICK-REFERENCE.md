# Integration Quick Reference

**One-page reference for integrating Estonian ID card reading into your web application**

---

## 🚀 Minimal Integration (3 Steps)

### 1. Check Extension

```javascript
if (window.EstEID_PD) {
  console.log('Extension available');
}
```

### 2. Read Card

```javascript
const result = await EstEID_PD.readPersonalData();
if (result.ok) {
  console.log(result.data.givenName, result.data.surname);
}
```

### 3. Handle Errors

```javascript
if (!result.ok) {
  alert('Error: ' + result.error);
}
```

---

## 📚 Complete API

### Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `readPersonalData(options)` | Read ID card | `Promise<Object>` |
| `checkStatus()` | Check availability | `Promise<Object>` |
| `clearCache()` | Clear cached data | `Promise<Object>` |
| `isAvailable()` | Sync availability check | `Boolean` |

### Properties

| Property | Description | Type |
|----------|-------------|------|
| `version` | API version | `String` |

### Events

| Event | Description | Detail |
|-------|-------------|--------|
| `esteid-pd-ready` | Extension loaded | `{ version }` |

---

## 📦 Data Structure

```javascript
{
  ok: true,
  data: {
    surname: "JÕEORG",              // String
    givenName: "JAAK-KRISTJAN",     // String
    sex: "M",                       // "M" | "F"
    citizenship: "EST",             // ISO 3166-1 alpha-3
    birthDate: "01 08 1980",        // DD MM YYYY
    personalCode: "38001085718",    // 11 digits
    documentNr: "AT0000222",        // String
    expiryDate: "09 12 2029",       // DD MM YYYY
    issueDate: "09 12 2024",        // DD MM YYYY
    source: "chip:Thales"           // String
  },
  cached: false,                    // Boolean
  cacheAge: 0                       // Number (ms)
}
```

---

## ⚙️ Options

```javascript
await EstEID_PD.readPersonalData({
  useCache: true,    // Use cached data (default: true)
  timeout: 30000,    // Timeout in ms (default: 30000)
  fids: {}          // Custom FID mapping (advanced)
});
```

---

## ❌ Error Codes

| Error Message | Meaning | Action |
|---------------|---------|--------|
| `"Native helper not installed..."` | Software not installed | Install helper |
| `"Card not found!..."` | No card in reader | Insert card |
| `"No readers found..."` | No card reader | Connect reader |
| `"Request timeout..."` | Operation timed out | Retry |

---

## 🔒 Security Checklist

- [ ] Use HTTPS only
- [ ] Verify data on backend
- [ ] Don't store data locally
- [ ] Clear cache on logout
- [ ] Handle errors gracefully
- [ ] Validate personal code format (`/^\d{11}$/`)

---

## 🎯 Common Patterns

### Form Auto-Fill

```javascript
const result = await EstEID_PD.readPersonalData();
if (result.ok) {
  document.getElementById('firstName').value = result.data.givenName;
  document.getElementById('lastName').value = result.data.surname;
  document.getElementById('personalCode').value = result.data.personalCode;
}
```

### Authentication

```javascript
const result = await EstEID_PD.readPersonalData({ useCache: false });
if (result.ok) {
  await fetch('/api/auth/id-card', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result.data)
  });
}
```

### Progressive Enhancement

```javascript
if (window.EstEID_PD) {
  const status = await EstEID_PD.checkStatus();
  if (status.available) {
    showIDCardButton();
  } else {
    showManualForm();
  }
} else {
  showManualForm();
}
```

### Error Handling

```javascript
try {
  const result = await EstEID_PD.readPersonalData();
  if (result.ok) {
    processData(result.data);
  } else {
    showError(result.error);
  }
} catch (error) {
  showError('Unexpected error: ' + error.message);
}
```

---

## 🧪 Testing

### Check Extension

```javascript
// Browser console (F12)
window.EstEID_PD
// Should show: { version: "1.0.0", readPersonalData: ƒ, ... }
```

### Check Status

```javascript
await EstEID_PD.checkStatus()
// Should show: { ok: true, available: true, ... }
```

### Read Card

```javascript
await EstEID_PD.readPersonalData()
// Should show: { ok: true, data: { ... } }
```

### Test Native Helper

```powershell
# Windows
C:\"Program Files"\eid-pd-reader\eid-pd-reader.exe --dump

# Should output JSON with personal data
```

---

## 🔧 Troubleshooting

### Extension Not Found

```javascript
if (!window.EstEID_PD) {
  console.error('Extension not installed');
  // Show installation instructions
}
```

### Helper Not Available

```javascript
const status = await EstEID_PD.checkStatus();
if (!status.available) {
  console.error('Helper not available:', status.error);
  // Show helper installation instructions
}
```

### Card Not Found

```javascript
const result = await EstEID_PD.readPersonalData();
if (!result.ok && result.error.includes('card not found')) {
  console.error('Please insert ID card');
  // Show "insert card" prompt
}
```

---

## 📱 Framework Examples

### React Hook

```javascript
import { useState, useEffect } from 'react';

function useIDCard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  
  const read = async () => {
    const result = await window.EstEID_PD.readPersonalData();
    if (result.ok) {
      setData(result.data);
    } else {
      setError(result.error);
    }
  };
  
  return { data, error, read };
}
```

### Vue Composable

```javascript
import { ref } from 'vue';

export function useIDCard() {
  const data = ref(null);
  const error = ref(null);
  
  const read = async () => {
    const result = await window.EstEID_PD.readPersonalData();
    if (result.ok) {
      data.value = result.data;
    } else {
      error.value = result.error;
    }
  };
  
  return { data, error, read };
}
```

### Angular Service

```typescript
@Injectable({ providedIn: 'root' })
export class IDCardService {
  async read() {
    return await (window as any).EstEID_PD.readPersonalData();
  }
}
```

---

## 📖 Full Documentation

- **Complete Guide:** [APPLICATION-INTEGRATION-GUIDE.md](APPLICATION-INTEGRATION-GUIDE.md)
- **API Reference:** [EXTENSION-GUIDE.md](EXTENSION-GUIDE.md)
- **Installation:** [INSTALLATION.md](INSTALLATION.md)
- **Security:** [SECURITY.md](SECURITY.md)
- **Troubleshooting:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## 💡 Pro Tips

1. **Always check availability** before showing ID card features
2. **Use `useCache: false`** for authentication/verification
3. **Clear cache on logout** for security
4. **Show loading state** during card reading (can take 2-5 seconds)
5. **Provide fallback** for users without extension
6. **Test with real cards** - both IDEMIA and Thales
7. **Handle Estonian characters** (Õ, Ä, Ö, Ü) properly
8. **Verify on backend** - never trust client-side data

---

## 🆘 Support

- **Issues:** [GitHub Issues](https://github.com/aarepuusepp/web-eid-pd/issues)
- **Demo:** [demo/index.html](demo/index.html)
- **Email:** aare.puusepp@gmail.com

---

**Quick Start:** Copy the [Minimal Integration](#-minimal-integration-3-steps) code and you're ready to go!

