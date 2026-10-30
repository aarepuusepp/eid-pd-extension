# Application Integration Guide

**How to integrate Estonian ID Card Personal Data reading into your web application**

This guide is for developers who want to add Estonian ID card reading capabilities to their web applications using the `web-eid-pd` extension.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Integration](#quick-integration)
- [API Reference](#api-reference)
- [Integration Patterns](#integration-patterns)
- [Framework Examples](#framework-examples)
- [Security Considerations](#security-considerations)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

### What You Get

The `web-eid-pd` extension allows your web application to:

- ✅ Read personal data from Estonian ID cards (name, personal code, etc.)
- ✅ Work as a fallback when certificates are unavailable
- ✅ Support both IDEMIA and Thales cards
- ✅ Operate without server-side infrastructure
- ✅ Maintain user privacy (no data leaves the browser)

### Architecture

```
┌─────────────────┐
│   Your Web App  │  Uses window.EstEID_PD API
│                 │
└────────┬────────┘
         │ JavaScript API
         ▼
┌─────────────────┐
│    Browser      │  Extension injects API
│   Extension     │
└────────┬────────┘
         │ Native Messaging
         ▼
┌─────────────────┐
│ Native Helper   │  Reads card via PC/SC
│ (eid-pd-reader)    │
└─────────────────┘
```

### Data You Can Read

All fields are available **without PIN** (read-only access):

- **Surname** (Perekonnanimi)
- **Given Name** (Eesnimi)
- **Sex** (Sugu: M/F)
- **Citizenship** (Kodakondsus: EST, etc.)
- **Birth Date** (Sünniaeg: DD MM YYYY)
- **Personal Code** (Isikukood: 11 digits)
- **Document Number** (Dokumendi number)
- **Expiry Date** (Kehtivusaeg: DD MM YYYY)
- **Issue Date** (Väljastamise aeg: DD MM YYYY)

---

## Prerequisites

### For End Users

Your users must have:

1. **Browser Extension** installed (Chrome, Edge, or Firefox)
2. **Native Helper** (`eid-pd-reader.exe`) installed
3. **Smart card reader** (USB or built-in)
4. **Estonian ID card** inserted

### For Developers

You need:

1. **Basic JavaScript knowledge**
2. **HTTPS** (required for extension communication)
3. **Modern browser** (Chrome 88+, Edge 88+, Firefox 78+)

---

## Quick Integration

### Step 1: Check Extension Availability

Add this to your application's initialization:

```javascript
// Check if extension is available
if (window.EstEID_PD) {
  console.log('EstEID extension available, version:', EstEID_PD.version);
  initializeIDCardFeatures();
} else {
  console.warn('EstEID extension not available');
  // Hide ID card features or show installation instructions
}

// Listen for extension ready event
window.addEventListener('esteid-pd-ready', (event) => {
  console.log('EstEID extension ready:', event.detail.version);
  initializeIDCardFeatures();
});
```

### Step 2: Read Personal Data

```javascript
async function readIDCard() {
  try {
    // Read personal data from ID card
    const result = await EstEID_PD.readPersonalData();
    
    if (result.ok) {
      // Success! Use the data
      const { givenName, surname, personalCode } = result.data;
      console.log(`User: ${givenName} ${surname} (${personalCode})`);
      
      // Populate your form or authenticate user
      document.getElementById('firstName').value = givenName;
      document.getElementById('lastName').value = surname;
      document.getElementById('personalCode').value = personalCode;
      
      return result.data;
    } else {
      // Error occurred
      console.error('Error reading ID card:', result.error);
      alert('Failed to read ID card: ' + result.error);
      return null;
    }
  } catch (error) {
    console.error('Exception reading ID card:', error);
    alert('Unexpected error: ' + error.message);
    return null;
  }
}
```

### Step 3: Add UI Button

```html
<button id="readCardBtn" onclick="readIDCard()">
  📇 Read from ID Card
</button>
```

That's it! You now have basic ID card reading functionality.

---

## API Reference

### `EstEID_PD.readPersonalData(options)`

Read personal data from Estonian ID card.

**Parameters:**

```javascript
{
  useCache: true,      // Use cached data if available (default: true)
  timeout: 30000,      // Request timeout in ms (default: 30000)
  fids: {}            // Custom FID mapping (advanced, optional)
}
```

**Returns:** `Promise<Object>`

**Success Response:**

```javascript
{
  ok: true,
  data: {
    surname: "JÕEORG",
    givenName: "JAAK-KRISTJAN",
    sex: "M",
    citizenship: "EST",
    birthDate: "01 08 1980",
    personalCode: "38001085718",
    documentNr: "AT0000222",
    expiryDate: "09 12 2029",
    issueDate: "09 12 2024",
    source: "chip:Thales"
  },
  cached: false,      // true if from cache
  cacheAge: 0         // milliseconds since cached
}
```

**Error Response:**

```javascript
{
  ok: false,
  error: "Card not found! Please insert your ID card."
}
```

**Common Error Messages:**

- `"Native helper not installed. Please run the installer."`
- `"Card not found! Please insert your ID card."`
- `"No readers found. Please connect a card reader."`
- `"Failed to read personal data: [technical details]"`
- `"Request timeout: No response from extension"`

---

### `EstEID_PD.checkStatus()`

Check if extension and native helper are available.

**Returns:** `Promise<Object>`

```javascript
{
  ok: true,
  available: true,    // Native helper is available
  cached: false,      // Cached data exists
  cacheAge: null      // Age of cached data (ms)
}
```

**Usage:**

```javascript
const status = await EstEID_PD.checkStatus();
if (status.ok && status.available) {
  // Show "Read ID Card" button
  showIDCardButton();
} else {
  // Show installation instructions
  showInstallationGuide();
}
```

---

### `EstEID_PD.clearCache()`

Clear cached personal data (forces fresh read on next call).

**Returns:** `Promise<Object>`

```javascript
await EstEID_PD.clearCache();
console.log('Cache cleared');
```

---

### `EstEID_PD.isAvailable()`

Synchronously check if extension is loaded.

**Returns:** `Boolean`

```javascript
if (EstEID_PD.isAvailable()) {
  console.log('Extension is ready');
}
```

---

### `EstEID_PD.version`

Extension API version (string).

```javascript
console.log('EstEID_PD version:', EstEID_PD.version);
// Output: "1.0.0"
```

---

### Event: `esteid-pd-ready`

Fired when the extension API is initialized.

```javascript
window.addEventListener('esteid-pd-ready', (event) => {
  console.log('EstEID_PD ready, version:', event.detail.version);
  initializeApp();
});
```

---

## Integration Patterns

### Pattern 1: Form Auto-Fill

Pre-fill registration or profile forms with ID card data.

```javascript
async function autoFillForm() {
  const result = await EstEID_PD.readPersonalData();
  
  if (result.ok) {
    const data = result.data;
    
    // Fill form fields
    document.getElementById('firstName').value = data.givenName;
    document.getElementById('lastName').value = data.surname;
    document.getElementById('personalCode').value = data.personalCode;
    document.getElementById('birthDate').value = data.birthDate;
    document.getElementById('citizenship').value = data.citizenship;
    
    // Mark fields as verified
    markFieldsAsVerified(['firstName', 'lastName', 'personalCode']);
  }
}
```

---

### Pattern 2: Authentication / Login

Use ID card as an authentication method.

```javascript
async function loginWithIDCard() {
  // Show loading state
  showLoading('Reading ID card...');
  
  try {
    // Read ID card
    const result = await EstEID_PD.readPersonalData({ useCache: false });
    
    if (!result.ok) {
      showError('Failed to read ID card: ' + result.error);
      return;
    }
    
    // Send to backend for verification
    const response = await fetch('/api/auth/id-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        personalCode: result.data.personalCode,
        givenName: result.data.givenName,
        surname: result.data.surname,
        documentNr: result.data.documentNr,
        source: result.data.source
      })
    });
    
    if (response.ok) {
      const session = await response.json();
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } else {
      showError('Authentication failed');
    }
  } catch (error) {
    showError('Error: ' + error.message);
  } finally {
    hideLoading();
  }
}
```

**Backend Example (Node.js/Express):**

```javascript
app.post('/api/auth/id-card', async (req, res) => {
  const { personalCode, givenName, surname } = req.body;
  
  // Verify personal code format (11 digits)
  if (!/^\d{11}$/.test(personalCode)) {
    return res.status(400).json({ error: 'Invalid personal code' });
  }
  
  // Look up user in database
  const user = await db.users.findOne({ personalCode });
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Verify name matches
  if (user.givenName !== givenName || user.surname !== surname) {
    return res.status(401).json({ error: 'Name mismatch' });
  }
  
  // Create session
  req.session.userId = user.id;
  req.session.authenticated = true;
  
  res.json({ success: true, user: { id: user.id, name: user.name } });
});
```

---

### Pattern 3: Identity Verification

Verify user identity during sensitive operations.

```javascript
async function verifyIdentityBeforeTransaction() {
  // Show verification dialog
  const confirmed = await showVerificationDialog(
    'Please insert your ID card to verify your identity'
  );
  
  if (!confirmed) return false;
  
  // Read ID card
  const result = await EstEID_PD.readPersonalData({ useCache: false });
  
  if (!result.ok) {
    showError('Verification failed: ' + result.error);
    return false;
  }
  
  // Check if personal code matches logged-in user
  const currentUser = getCurrentUser();
  if (result.data.personalCode !== currentUser.personalCode) {
    showError('ID card does not match your account');
    return false;
  }
  
  // Verification successful
  return true;
}

// Usage
async function performSensitiveOperation() {
  if (await verifyIdentityBeforeTransaction()) {
    // Proceed with operation
    await executeTransaction();
  }
}
```

---

### Pattern 4: Fallback from Certificate-Based Auth

Use as fallback when web-eid.js certificate authentication fails.

```javascript
async function authenticateUser() {
  try {
    // Try certificate-based authentication first
    const cert = await webEid.authenticate(challenge);
    return { method: 'certificate', data: cert };
  } catch (error) {
    console.warn('Certificate auth failed:', error);
    
    // Check if EstEID_PD is available
    if (!window.EstEID_PD) {
      throw new Error('No authentication method available');
    }
    
    // Fallback to chip reading
    const result = await EstEID_PD.readPersonalData();
    
    if (!result.ok) {
      throw new Error('All authentication methods failed');
    }
    
    return { method: 'chip', data: result.data };
  }
}
```

---

### Pattern 5: Progressive Enhancement

Gracefully degrade if extension is not available.

```javascript
class IDCardService {
  constructor() {
    this.available = false;
    this.checkAvailability();
  }
  
  async checkAvailability() {
    if (!window.EstEID_PD) {
      this.available = false;
      return;
    }
    
    const status = await EstEID_PD.checkStatus();
    this.available = status.ok && status.available;
  }
  
  async read() {
    if (!this.available) {
      throw new Error('ID card reading not available');
    }
    
    return await EstEID_PD.readPersonalData();
  }
  
  isAvailable() {
    return this.available;
  }
}

// Usage
const idCard = new IDCardService();

// Show ID card option only if available
if (idCard.isAvailable()) {
  showIDCardButton();
} else {
  showManualEntryForm();
}
```

---

## Framework Examples

### React

```jsx
import React, { useState, useEffect } from 'react';

function IDCardReader() {
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if extension is available
    const checkExtension = async () => {
      if (window.EstEID_PD) {
        const status = await window.EstEID_PD.checkStatus();
        setAvailable(status.ok && status.available);
      }
    };

    // Listen for extension ready event
    window.addEventListener('esteid-pd-ready', checkExtension);
    checkExtension();

    return () => {
      window.removeEventListener('esteid-pd-ready', checkExtension);
    };
  }, []);

  const readCard = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.EstEID_PD.readPersonalData();
      if (result.ok) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!available) {
    return (
      <div className="alert alert-warning">
        Extension not available. Please install it.
      </div>
    );
  }

  return (
    <div className="id-card-reader">
      <button 
        onClick={readCard} 
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? 'Reading...' : '📇 Read ID Card'}
      </button>

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      {data && (
        <div className="card mt-3">
          <div className="card-body">
            <h5 className="card-title">
              {data.givenName} {data.surname}
            </h5>
            <p className="card-text">
              <strong>Personal Code:</strong> {data.personalCode}<br/>
              <strong>Document:</strong> {data.documentNr}<br/>
              <strong>Expires:</strong> {data.expiryDate}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default IDCardReader;
```

**React Hook:**

```jsx
// useIDCard.js
import { useState, useEffect } from 'react';

export function useIDCard() {
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkExtension = async () => {
      if (window.EstEID_PD) {
        const status = await window.EstEID_PD.checkStatus();
        setAvailable(status.ok && status.available);
      }
    };

    window.addEventListener('esteid-pd-ready', checkExtension);
    checkExtension();

    return () => {
      window.removeEventListener('esteid-pd-ready', checkExtension);
    };
  }, []);

  const read = async (options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.EstEID_PD.readPersonalData(options);
      if (result.ok) {
        setData(result.data);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    if (window.EstEID_PD) {
      await window.EstEID_PD.clearCache();
      setData(null);
    }
  };

  return { available, loading, data, error, read, clearCache };
}

// Usage in component
function MyComponent() {
  const { available, loading, data, error, read } = useIDCard();

  return (
    <div>
      {available && (
        <button onClick={() => read()} disabled={loading}>
          Read ID Card
        </button>
      )}
      {data && <div>Welcome, {data.givenName}!</div>}
      {error && <div>Error: {error}</div>}
    </div>
  );
}
```

---

### Vue.js

```vue
<template>
  <div class="id-card-reader">
    <button 
      @click="readCard" 
      :disabled="!available || loading"
      class="btn btn-primary"
    >
      {{ loading ? 'Reading...' : '📇 Read ID Card' }}
    </button>

    <div v-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <div v-if="data" class="card mt-3">
      <div class="card-body">
        <h5 class="card-title">
          {{ data.givenName }} {{ data.surname }}
        </h5>
        <p class="card-text">
          <strong>Personal Code:</strong> {{ data.personalCode }}<br>
          <strong>Document:</strong> {{ data.documentNr }}<br>
          <strong>Expires:</strong> {{ data.expiryDate }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      available: false,
      loading: false,
      data: null,
      error: null
    };
  },

  mounted() {
    this.checkExtension();
    window.addEventListener('esteid-pd-ready', this.checkExtension);
  },

  beforeUnmount() {
    window.removeEventListener('esteid-pd-ready', this.checkExtension);
  },

  methods: {
    async checkExtension() {
      if (window.EstEID_PD) {
        const status = await window.EstEID_PD.checkStatus();
        this.available = status.ok && status.available;
      }
    },

    async readCard() {
      this.loading = true;
      this.error = null;

      try {
        const result = await window.EstEID_PD.readPersonalData();
        if (result.ok) {
          this.data = result.data;
        } else {
          this.error = result.error;
        }
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
```

**Vue Composable (Vue 3):**

```javascript
// useIDCard.js
import { ref, onMounted, onUnmounted } from 'vue';

export function useIDCard() {
  const available = ref(false);
  const loading = ref(false);
  const data = ref(null);
  const error = ref(null);

  const checkExtension = async () => {
    if (window.EstEID_PD) {
      const status = await window.EstEID_PD.checkStatus();
      available.value = status.ok && status.available;
    }
  };

  const read = async (options = {}) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await window.EstEID_PD.readPersonalData(options);
      if (result.ok) {
        data.value = result.data;
        return result.data;
      } else {
        error.value = result.error;
        return null;
      }
    } catch (err) {
      error.value = err.message;
      return null;
    } finally {
      loading.value = false;
    }
  };

  const clearCache = async () => {
    if (window.EstEID_PD) {
      await window.EstEID_PD.clearCache();
      data.value = null;
    }
  };

  onMounted(() => {
    window.addEventListener('esteid-pd-ready', checkExtension);
    checkExtension();
  });

  onUnmounted(() => {
    window.removeEventListener('esteid-pd-ready', checkExtension);
  });

  return { available, loading, data, error, read, clearCache };
}
```

---

### Angular

```typescript
// id-card.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

declare global {
  interface Window {
    EstEID_PD: any;
  }
}

export interface PersonalData {
  surname: string;
  givenName: string;
  personalCode: string;
  documentNr: string;
  citizenship: string;
  sex: string;
  birthDate: string;
  expiryDate: string;
  issueDate: string;
  source: string;
}

@Injectable({
  providedIn: 'root'
})
export class IDCardService {
  private availableSubject = new BehaviorSubject<boolean>(false);
  public available$ = this.availableSubject.asObservable();

  constructor() {
    this.checkAvailability();
    window.addEventListener('esteid-pd-ready', () => this.checkAvailability());
  }

  private async checkAvailability() {
    if (window.EstEID_PD) {
      const status = await window.EstEID_PD.checkStatus();
      this.availableSubject.next(status.ok && status.available);
    } else {
      this.availableSubject.next(false);
    }
  }

  async readPersonalData(options = {}): Promise<PersonalData | null> {
    if (!window.EstEID_PD) {
      throw new Error('Extension not available');
    }

    const result = await window.EstEID_PD.readPersonalData(options);
    
    if (result.ok) {
      return result.data;
    } else {
      throw new Error(result.error);
    }
  }

  async checkStatus() {
    if (!window.EstEID_PD) {
      return { ok: false, available: false };
    }
    return await window.EstEID_PD.checkStatus();
  }

  async clearCache() {
    if (window.EstEID_PD) {
      await window.EstEID_PD.clearCache();
    }
  }
}
```

```typescript
// id-card-reader.component.ts
import { Component, OnInit } from '@angular/core';
import { IDCardService, PersonalData } from './id-card.service';

@Component({
  selector: 'app-id-card-reader',
  template: `
    <div class="id-card-reader">
      <button 
        (click)="readCard()" 
        [disabled]="!available || loading"
        class="btn btn-primary">
        {{ loading ? 'Reading...' : '📇 Read ID Card' }}
      </button>

      <div *ngIf="error" class="alert alert-danger">
        {{ error }}
      </div>

      <div *ngIf="data" class="card mt-3">
        <div class="card-body">
          <h5 class="card-title">
            {{ data.givenName }} {{ data.surname }}
          </h5>
          <p class="card-text">
            <strong>Personal Code:</strong> {{ data.personalCode }}<br>
            <strong>Document:</strong> {{ data.documentNr }}<br>
            <strong>Expires:</strong> {{ data.expiryDate }}
          </p>
        </div>
      </div>
    </div>
  `
})
export class IDCardReaderComponent implements OnInit {
  available = false;
  loading = false;
  data: PersonalData | null = null;
  error: string | null = null;

  constructor(private idCardService: IDCardService) {}

  ngOnInit() {
    this.idCardService.available$.subscribe(available => {
      this.available = available;
    });
  }

  async readCard() {
    this.loading = true;
    this.error = null;

    try {
      this.data = await this.idCardService.readPersonalData();
    } catch (err: any) {
      this.error = err.message;
    } finally {
      this.loading = false;
    }
  }
}
```

---

### jQuery

```javascript
// ID Card integration with jQuery
(function($) {
  'use strict';

  // Plugin defaults
  var defaults = {
    onSuccess: function(data) {},
    onError: function(error) {},
    onStatusChange: function(available) {},
    autoCheck: true
  };

  // ID Card Reader Plugin
  $.fn.idCardReader = function(options) {
    var settings = $.extend({}, defaults, options);
    var $element = $(this);

    // Check extension availability
    function checkAvailability() {
      if (window.EstEID_PD) {
        window.EstEID_PD.checkStatus().then(function(status) {
          var available = status.ok && status.available;
          settings.onStatusChange(available);
          
          if (available) {
            $element.prop('disabled', false);
          } else {
            $element.prop('disabled', true);
          }
        });
      } else {
        settings.onStatusChange(false);
        $element.prop('disabled', true);
      }
    }

    // Read ID card
    function readCard() {
      if (!window.EstEID_PD) {
        settings.onError('Extension not available');
        return;
      }

      $element.prop('disabled', true).text('Reading...');

      window.EstEID_PD.readPersonalData()
        .then(function(result) {
          if (result.ok) {
            settings.onSuccess(result.data);
          } else {
            settings.onError(result.error);
          }
        })
        .catch(function(error) {
          settings.onError(error.message);
        })
        .finally(function() {
          $element.prop('disabled', false).text('📇 Read ID Card');
        });
    }

    // Bind click event
    $element.on('click', readCard);

    // Auto-check availability
    if (settings.autoCheck) {
      checkAvailability();
      window.addEventListener('esteid-pd-ready', checkAvailability);
    }

    return this;
  };

})(jQuery);

// Usage
$('#readCardBtn').idCardReader({
  onSuccess: function(data) {
    $('#firstName').val(data.givenName);
    $('#lastName').val(data.surname);
    $('#personalCode').val(data.personalCode);
    alert('ID card read successfully!');
  },
  onError: function(error) {
    alert('Error: ' + error);
  },
  onStatusChange: function(available) {
    if (available) {
      $('#status').text('✅ Ready').addClass('text-success');
    } else {
      $('#status').text('❌ Not Available').addClass('text-danger');
    }
  }
});
```

---

## Security Considerations

### 1. Origin Validation

The extension uses origin validation to prevent unauthorized access:

```json
// manifest.json
{
  "externally_connectable": {
    "matches": ["https://yourdomain.com/*"]
  }
}
```

**For production:**
- Configure allowed origins in extension manifest
- Use HTTPS only
- Whitelist specific domains

### 2. Data Handling

**Best practices:**

```javascript
// ✅ Good: Use data immediately
async function processIDCard() {
  const result = await EstEID_PD.readPersonalData();
  if (result.ok) {
    // Send to server immediately
    await sendToServer(result.data);
    // Don't store locally
  }
}

// ❌ Bad: Store in localStorage
async function processIDCard() {
  const result = await EstEID_PD.readPersonalData();
  if (result.ok) {
    // Don't do this!
    localStorage.setItem('idCardData', JSON.stringify(result.data));
  }
}
```

### 3. Backend Verification

**Always verify on the backend:**

```javascript
// Frontend
const result = await EstEID_PD.readPersonalData();
await fetch('/api/verify', {
  method: 'POST',
  body: JSON.stringify(result.data)
});

// Backend (Node.js)
app.post('/api/verify', (req, res) => {
  const { personalCode, givenName, surname } = req.body;
  
  // Validate format
  if (!/^\d{11}$/.test(personalCode)) {
    return res.status(400).json({ error: 'Invalid format' });
  }
  
  // Verify against database
  const user = db.findUser(personalCode);
  if (!user || user.name !== `${givenName} ${surname}`) {
    return res.status(401).json({ error: 'Verification failed' });
  }
  
  res.json({ verified: true });
});
```

### 4. Cache Management

```javascript
// Clear cache on logout
async function logout() {
  // Clear ID card cache
  if (window.EstEID_PD) {
    await EstEID_PD.clearCache();
  }
  
  // Clear session
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/login';
}

// Force fresh read for sensitive operations
async function sensitiveOperation() {
  const result = await EstEID_PD.readPersonalData({
    useCache: false  // Always read fresh
  });
  // ...
}
```

### 5. Error Information Disclosure

```javascript
// ✅ Good: Generic user messages
function handleError(error) {
  console.error('Detailed error:', error); // Log for debugging
  
  // Show generic message to user
  showMessage('Failed to read ID card. Please try again.');
}

// ❌ Bad: Expose technical details
function handleError(error) {
  // Don't show technical details to users
  alert('Error: ' + error.stack);
}
```

---

## Error Handling

### Comprehensive Error Handler

```javascript
async function readIDCardWithErrorHandling() {
  try {
    // Check if extension is available
    if (!window.EstEID_PD) {
      return {
        success: false,
        code: 'EXTENSION_NOT_FOUND',
        message: 'Please install the ID card reader extension.',
        userMessage: 'ID-kaardi lugeja laiendus puudub. Palun paigaldage laiendus.',
        action: 'install_extension'
      };
    }

    // Check status
    const status = await EstEID_PD.checkStatus();
    if (!status.ok || !status.available) {
      return {
        success: false,
        code: 'HELPER_NOT_AVAILABLE',
        message: 'Native helper is not available.',
        userMessage: 'ID-kaardi lugeja tarkvara ei ole saadaval. Palun paigaldage tarkvara.',
        action: 'install_helper'
      };
    }

    // Read card
    const result = await EstEID_PD.readPersonalData({ useCache: false });
    
    if (!result.ok) {
      // Parse error message
      const error = result.error.toLowerCase();
      
      if (error.includes('card not found') || error.includes('no card')) {
        return {
          success: false,
          code: 'CARD_NOT_FOUND',
          message: result.error,
          userMessage: 'ID-kaarti ei leitud. Palun sisestage ID-kaart lugejasse.',
          action: 'insert_card'
        };
      }
      
      if (error.includes('no readers') || error.includes('reader not found')) {
        return {
          success: false,
          code: 'READER_NOT_FOUND',
          message: result.error,
          userMessage: 'Kaardilugejat ei leitud. Palun ühendage kaardilugeja.',
          action: 'connect_reader'
        };
      }
      
      if (error.includes('timeout')) {
        return {
          success: false,
          code: 'TIMEOUT',
          message: result.error,
          userMessage: 'Aeg sai otsa. Palun proovige uuesti.',
          action: 'retry'
        };
      }
      
      // Generic error
      return {
        success: false,
        code: 'READ_ERROR',
        message: result.error,
        userMessage: 'ID-kaardi lugemine ebaõnnestus. Palun proovige uuesti.',
        action: 'retry'
      };
    }

    // Success
    return {
      success: true,
      data: result.data
    };

  } catch (error) {
    // Unexpected error
    console.error('Unexpected error:', error);
    return {
      success: false,
      code: 'UNEXPECTED_ERROR',
      message: error.message,
      userMessage: 'Ootamatu viga. Palun proovige hiljem uuesti.',
      action: 'contact_support'
    };
  }
}

// Usage
const result = await readIDCardWithErrorHandling();

if (result.success) {
  // Use data
  console.log('User:', result.data.givenName, result.data.surname);
} else {
  // Handle error
  console.error('Error:', result.code, result.message);
  
  // Show user-friendly message
  showError(result.userMessage);
  
  // Take action based on error
  switch (result.action) {
    case 'install_extension':
      showInstallationGuide();
      break;
    case 'install_helper':
      showHelperInstallationGuide();
      break;
    case 'insert_card':
      showInsertCardPrompt();
      break;
    case 'connect_reader':
      showConnectReaderPrompt();
      break;
    case 'retry':
      // Show retry button
      break;
    case 'contact_support':
      showSupportContact();
      break;
  }
}
```

### Error Messages (Estonian/English)

```javascript
const ERROR_MESSAGES = {
  EXTENSION_NOT_FOUND: {
    et: 'ID-kaardi lugeja laiendus puudub. Palun paigaldage laiendus.',
    en: 'ID card reader extension not found. Please install the extension.'
  },
  HELPER_NOT_AVAILABLE: {
    et: 'ID-kaardi lugeja tarkvara ei ole saadaval. Palun paigaldage tarkvara.',
    en: 'ID card reader software not available. Please install the software.'
  },
  CARD_NOT_FOUND: {
    et: 'ID-kaarti ei leitud. Palun sisestage ID-kaart lugejasse.',
    en: 'ID card not found. Please insert your ID card into the reader.'
  },
  READER_NOT_FOUND: {
    et: 'Kaardilugejat ei leitud. Palun ühendage kaardilugeja.',
    en: 'Card reader not found. Please connect a card reader.'
  },
  TIMEOUT: {
    et: 'Aeg sai otsa. Palun proovige uuesti.',
    en: 'Operation timed out. Please try again.'
  },
  READ_ERROR: {
    et: 'ID-kaardi lugemine ebaõnnestus. Palun proovige uuesti.',
    en: 'Failed to read ID card. Please try again.'
  }
};

function getErrorMessage(code, language = 'et') {
  return ERROR_MESSAGES[code]?.[language] || ERROR_MESSAGES.READ_ERROR[language];
}
```

---

## Testing

### Unit Tests (Jest)

```javascript
// idcard.test.js
describe('ID Card Integration', () => {
  beforeEach(() => {
    // Mock EstEID_PD
    window.EstEID_PD = {
      version: '1.0.0',
      checkStatus: jest.fn(),
      readPersonalData: jest.fn(),
      clearCache: jest.fn(),
      isAvailable: jest.fn(() => true)
    };
  });

  afterEach(() => {
    delete window.EstEID_PD;
  });

  test('should check extension availability', async () => {
    window.EstEID_PD.checkStatus.mockResolvedValue({
      ok: true,
      available: true
    });

    const status = await window.EstEID_PD.checkStatus();
    expect(status.ok).toBe(true);
    expect(status.available).toBe(true);
  });

  test('should read personal data successfully', async () => {
    const mockData = {
      ok: true,
      data: {
        givenName: 'JAAK',
        surname: 'JÕEORG',
        personalCode: '38001085718'
      }
    };

    window.EstEID_PD.readPersonalData.mockResolvedValue(mockData);

    const result = await window.EstEID_PD.readPersonalData();
    expect(result.ok).toBe(true);
    expect(result.data.personalCode).toBe('38001085718');
  });

  test('should handle card not found error', async () => {
    window.EstEID_PD.readPersonalData.mockResolvedValue({
      ok: false,
      error: 'Card not found! Please insert your ID card.'
    });

    const result = await window.EstEID_PD.readPersonalData();
    expect(result.ok).toBe(false);
    expect(result.error).toContain('Card not found');
  });
});
```

### Integration Tests

```javascript
// Test with actual extension (E2E)
describe('ID Card E2E Tests', () => {
  test('should detect extension', () => {
    expect(window.EstEID_PD).toBeDefined();
    expect(window.EstEID_PD.version).toBeTruthy();
  });

  test('should check status', async () => {
    const status = await window.EstEID_PD.checkStatus();
    expect(status).toHaveProperty('ok');
    expect(status).toHaveProperty('available');
  });

  test('should read card if inserted', async () => {
    const result = await window.EstEID_PD.readPersonalData();
    
    if (result.ok) {
      expect(result.data).toHaveProperty('personalCode');
      expect(result.data).toHaveProperty('givenName');
      expect(result.data).toHaveProperty('surname');
      expect(result.data.personalCode).toMatch(/^\d{11}$/);
    } else {
      // Card not inserted - expected in test environment
      expect(result.error).toBeTruthy();
    }
  }, 30000); // 30 second timeout
});
```

### Manual Testing Checklist

- [ ] Extension loads correctly
- [ ] Status check works
- [ ] Read succeeds with card inserted
- [ ] Error shown when card not inserted
- [ ] Error shown when reader not connected
- [ ] Cache works correctly
- [ ] Clear cache works
- [ ] Timeout handling works
- [ ] Works in all supported browsers
- [ ] Works with IDEMIA cards
- [ ] Works with Thales cards
- [ ] Estonian characters display correctly (Õ, Ä, Ö, Ü)

---

## Production Deployment

### 1. Extension Configuration

Update `manifest.json` with your domain:

```json
{
  "externally_connectable": {
    "matches": [
      "https://yourdomain.com/*",
      "https://www.yourdomain.com/*"
    ]
  },
  "host_permissions": [
    "https://yourdomain.com/*",
    "https://www.yourdomain.com/*"
  ]
}
```

### 2. Host Manifest Configuration

Update `ee.aarepuusepp.eid_helper.json`:

```json
{
  "name": "ee.aarepuusepp.eid_helper",
  "description": "Estonian ID Card Personal Data Reader",
  "path": "C:\\Program Files\\eid-pd-reader\\eid-pd-reader.exe",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://YOUR_PRODUCTION_EXTENSION_ID/"
  ]
}
```

### 3. User Installation Package

Create an installer that:

1. Installs `eid-pd-reader.exe`
2. Registers native host
3. Provides extension installation link
4. Tests the installation

**Example installer script:**

```powershell
# install-production.ps1
param(
    [string]$ExtensionID = "YOUR_EXTENSION_ID"
)

Write-Host "Installing Estonian ID Card Reader..." -ForegroundColor Green

# Check admin rights
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "This script must be run as Administrator"
    exit 1
}

# Install native helper
$installPath = "C:\Program Files\eid-pd-reader"
New-Item -ItemType Directory -Force -Path $installPath | Out-Null
Copy-Item "eid-pd-reader.exe" -Destination $installPath -Force

# Create host manifest
$manifest = @{
    name = "ee.aarepuusepp.eid_helper"
    description = "Estonian ID Card Personal Data Reader"
    path = "$installPath\eid-pd-reader.exe"
    type = "stdio"
    allowed_origins = @("chrome-extension://$ExtensionID/")
} | ConvertTo-Json

$manifest | Out-File -FilePath "$installPath\ee.aarepuusepp.eid_helper.json" -Encoding UTF8

# Register with browsers
$regPath = "HKLM:\Software\Google\Chrome\NativeMessagingHosts\ee.aarepuusepp.eid_helper"
New-Item -Path $regPath -Force | Out-Null
Set-ItemProperty -Path $regPath -Name "(Default)" -Value "$installPath\ee.aarepuusepp.eid_helper.json"

$regPath = "HKLM:\Software\Microsoft\Edge\NativeMessagingHosts\ee.aarepuusepp.eid_helper"
New-Item -Path $regPath -Force | Out-Null
Set-ItemProperty -Path $regPath -Name "(Default)" -Value "$installPath\ee.aarepuusepp.eid_helper.json"

Write-Host "Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Install browser extension from: https://yourdomain.com/extension"
Write-Host "2. Restart your browser"
Write-Host "3. Visit https://yourdomain.com to test"
```

### 4. User Documentation

Provide clear documentation for users:

**Installation Guide:**
```markdown
# How to Enable ID Card Reading

## Step 1: Install Software

Download and run the installer:
[Download ID Card Reader Installer](https://yourdomain.com/downloads/installer.exe)

## Step 2: Install Browser Extension

### Chrome
1. Visit [Chrome Web Store](https://chrome.google.com/webstore/...)
2. Click "Add to Chrome"

### Edge
1. Visit [Edge Add-ons](https://microsoftedge.microsoft.com/addons/...)
2. Click "Get"

### Firefox
1. Visit [Firefox Add-ons](https://addons.mozilla.org/...)
2. Click "Add to Firefox"

## Step 3: Restart Browser

Close and reopen your browser.

## Step 4: Test

1. Visit https://yourdomain.com
2. Insert your ID card
3. Click "Read from ID Card"

## Troubleshooting

If it doesn't work:
- Check that your card reader is connected
- Check that your ID card is inserted
- Try restarting your computer
- Contact support: support@yourdomain.com
```

### 5. Monitoring and Analytics

Track usage and errors:

```javascript
// Track successful reads
async function readIDCard() {
  try {
    const result = await EstEID_PD.readPersonalData();
    
    if (result.ok) {
      // Track success
      analytics.track('id_card_read_success', {
        source: result.data.source,
        cached: result.cached
      });
      
      return result.data;
    } else {
      // Track error
      analytics.track('id_card_read_error', {
        error: result.error,
        error_type: categorizeError(result.error)
      });
      
      return null;
    }
  } catch (error) {
    // Track exception
    analytics.track('id_card_read_exception', {
      error: error.message
    });
    
    return null;
  }
}

function categorizeError(error) {
  if (error.includes('card not found')) return 'card_not_found';
  if (error.includes('no readers')) return 'reader_not_found';
  if (error.includes('timeout')) return 'timeout';
  return 'other';
}
```

---

## Troubleshooting

### Common Issues

#### 1. Extension Not Found

**Symptoms:**
- `window.EstEID_PD` is `undefined`
- No `esteid-pd-ready` event fires

**Solutions:**
```javascript
// Check if extension is loaded
setTimeout(() => {
  if (!window.EstEID_PD) {
    console.error('Extension not loaded after 5 seconds');
    showInstallationPrompt();
  }
}, 5000);

// Provide installation link
function showInstallationPrompt() {
  const message = `
    <div class="alert alert-warning">
      <h4>ID Card Reader Extension Required</h4>
      <p>To use ID card reading, please install the extension:</p>
      <a href="https://yourdomain.com/extension" class="btn btn-primary">
        Install Extension
      </a>
    </div>
  `;
  document.getElementById('alerts').innerHTML = message;
}
```

#### 2. Native Helper Not Available

**Symptoms:**
- `checkStatus()` returns `available: false`
- Error: "Native helper not installed"

**Solutions:**
```javascript
async function diagnoseHelper() {
  const status = await EstEID_PD.checkStatus();
  
  if (!status.available) {
    console.error('Native helper not available');
    
    // Show installation instructions
    const message = `
      <div class="alert alert-danger">
        <h4>Native Helper Not Installed</h4>
        <p>The ID card reader software is not installed.</p>
        <ol>
          <li>Download the installer</li>
          <li>Run as Administrator</li>
          <li>Restart your browser</li>
        </ol>
        <a href="https://yourdomain.com/downloads/installer.exe" 
           class="btn btn-primary">
          Download Installer
        </a>
      </div>
    `;
    
    document.getElementById('alerts').innerHTML = message;
  }
}
```

#### 3. Card Not Found

**Symptoms:**
- Error: "Card not found! Please insert your ID card."

**Solutions:**
```javascript
async function readWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const result = await EstEID_PD.readPersonalData();
    
    if (result.ok) {
      return result.data;
    }
    
    if (result.error.includes('card not found')) {
      if (i < maxRetries - 1) {
        // Show prompt and wait
        await showPromptAndWait(
          'Please insert your ID card and click OK',
          5000
        );
      } else {
        throw new Error('Card not found after ' + maxRetries + ' attempts');
      }
    } else {
      // Other error, don't retry
      throw new Error(result.error);
    }
  }
}

function showPromptAndWait(message, timeout) {
  return new Promise((resolve) => {
    const modal = showModal({
      title: 'ID Card Required',
      message: message,
      buttons: [
        {
          text: 'OK',
          onClick: () => {
            modal.close();
            resolve();
          }
        }
      ]
    });
    
    // Auto-resolve after timeout
    setTimeout(resolve, timeout);
  });
}
```

#### 4. Timeout Errors

**Symptoms:**
- Error: "Request timeout: No response from extension"

**Solutions:**
```javascript
// Increase timeout for slow readers
const result = await EstEID_PD.readPersonalData({
  timeout: 60000  // 60 seconds
});

// Or implement custom timeout handling
async function readWithCustomTimeout(timeoutMs = 30000) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Custom timeout')), timeoutMs);
  });
  
  const readPromise = EstEID_PD.readPersonalData({
    timeout: timeoutMs + 5000  // Slightly longer than our timeout
  });
  
  try {
    return await Promise.race([readPromise, timeoutPromise]);
  } catch (error) {
    if (error.message === 'Custom timeout') {
      // Show user-friendly message
      showError('Reading is taking longer than expected. Please check your card and reader.');
    }
    throw error;
  }
}
```

#### 5. Estonian Characters Not Displaying

**Symptoms:**
- Names with Õ, Ä, Ö, Ü show as � or incorrect characters

**Solutions:**
```html
<!-- Ensure UTF-8 encoding -->
<meta charset="UTF-8">
```

```javascript
// Verify encoding
console.log('Encoding test: JÕEORG ÄÖÜÕ');

// If still issues, check font support
document.body.style.fontFamily = 'Arial, sans-serif';
```

### Debug Mode

Enable detailed logging:

```javascript
// Enable debug mode
window.ESTEID_DEBUG = true;

// Custom logging wrapper
const originalRead = EstEID_PD.readPersonalData;
EstEID_PD.readPersonalData = async function(options) {
  console.log('[DEBUG] Reading ID card with options:', options);
  const start = Date.now();
  
  try {
    const result = await originalRead.call(this, options);
    const duration = Date.now() - start;
    console.log('[DEBUG] Read completed in', duration, 'ms:', result);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error('[DEBUG] Read failed after', duration, 'ms:', error);
    throw error;
  }
};
```

### Getting Help

If you encounter issues:

1. **Check browser console** (F12) for errors
2. **Test native helper** directly:
   ```powershell
   C:\"Program Files"\eid-pd-reader\eid-pd-reader.exe --dump
   ```
3. **Check extension status** in browser:
   - Chrome: `chrome://extensions/`
   - Firefox: `about:debugging#/runtime/this-firefox`
4. **Review logs** in extension service worker
5. **Contact support** with:
   - Browser version
   - Extension version
   - Error messages
   - Steps to reproduce

---

## Summary

### Quick Checklist for Integration

- [ ] Check `window.EstEID_PD` availability
- [ ] Listen for `esteid-pd-ready` event
- [ ] Call `checkStatus()` to verify setup
- [ ] Call `readPersonalData()` to read card
- [ ] Handle errors gracefully
- [ ] Show user-friendly messages
- [ ] Clear cache on logout
- [ ] Test with both card types (IDEMIA, Thales)
- [ ] Test error scenarios (no card, no reader)
- [ ] Verify Estonian characters display correctly
- [ ] Implement backend verification
- [ ] Add analytics/monitoring
- [ ] Provide user documentation

### Key Points to Remember

1. **Always check availability** before showing ID card features
2. **Handle errors gracefully** with user-friendly messages
3. **Don't store personal data** locally
4. **Verify on backend** - never trust client-side data alone
5. **Clear cache on logout** for security
6. **Use HTTPS** - required for extension communication
7. **Test thoroughly** with real cards
8. **Provide clear instructions** for users

### Next Steps

1. Review the [EXTENSION-GUIDE.md](EXTENSION-GUIDE.md) for detailed API documentation
2. Check [INSTALLATION.md](INSTALLATION.md) for deployment instructions
3. See [demo/index.html](demo/index.html) for a working example
4. Read [SECURITY.md](SECURITY.md) for security best practices
5. Consult [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues

---

**Need help?** Open an issue on GitHub or contact support.

**Ready to integrate?** Start with the [Quick Integration](#quick-integration) section above!

