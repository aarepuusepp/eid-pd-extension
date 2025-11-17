# When to Use web-eid-pd

Guide to help you decide if `web-eid-pd` is the right solution for your use case.

---

## Overview

`web-eid-pd` is a **fallback solution** for reading personal data from Estonian ID cards when certificate-based authentication is not available or not suitable.

---

## Use This Solution When...

### ✅ Certificates Are Missing or Expired

**Scenario:** User's ID card certificates are expired, but personal data is still valid.

**Why web-eid-pd:**
- Personal data files remain readable even when certificates expire
- No need to renew certificates just to access basic identity information
- Provides graceful degradation from certificate-based auth

**Example:**
```javascript
try {
  // Try certificate-based auth first
  const cert = await webeid.authenticate(challenge);
} catch (error) {
  // Fallback to chip reading
  const result = await EstEID_PD.readPersonalData();
  // Use personal code for identification
}
```

---

### ✅ You Only Need Identity Information

**Scenario:** You need to verify user identity but don't need cryptographic signatures.

**Why web-eid-pd:**
- Simple identity verification (name, personal code)
- No complex PKI infrastructure needed
- Faster implementation
- Lower technical complexity

**Use cases:**
- Registration forms
- Profile verification
- Age verification
- Citizenship checks
- Document number lookup

**Example:**
```javascript
// Simple identity verification
const result = await EstEID_PD.readPersonalData();
if (result.ok) {
  // Verify against database
  const user = await db.findByPersonalCode(result.data.personalCode);
  if (user) {
    // Identity verified
    loginUser(user);
  }
}
```

---

### ✅ Offline or Air-Gapped Environments

**Scenario:** Application runs without internet access or in isolated network.

**Why web-eid-pd:**
- No OCSP/CRL checks needed (no certificate validation)
- No backend server required for basic reading
- Works completely offline
- Suitable for kiosks, terminals, secure facilities

**Use cases:**
- Self-service kiosks
- Secure facilities without internet
- Offline registration terminals
- Air-gapped systems

---

### ✅ Form Auto-Fill

**Scenario:** Pre-fill registration or profile forms with ID card data.

**Why web-eid-pd:**
- Direct access to all personal data fields
- No certificate parsing needed
- Simpler UX (one button click)
- Faster than certificate-based flow

**Example:**
```javascript
async function autoFillForm() {
  const result = await EstEID_PD.readPersonalData();
  if (result.ok) {
    document.getElementById('firstName').value = result.data.givenName;
    document.getElementById('lastName').value = result.data.surname;
    document.getElementById('personalCode').value = result.data.personalCode;
    document.getElementById('birthDate').value = result.data.birthDate;
  }
}
```

---

### ✅ Development and Testing

**Scenario:** Testing ID card integration without full PKI setup.

**Why web-eid-pd:**
- No certificate infrastructure needed
- No backend OCSP/CRL services
- Quick setup and testing
- Easy debugging

---

### ✅ Legacy System Integration

**Scenario:** Integrating with systems that can't handle certificates.

**Why web-eid-pd:**
- Simple JSON output
- No cryptographic operations
- Easy to integrate with any backend
- Works with systems that only need identity data

---

## Don't Use This Solution When...

### ❌ You Need Cryptographic Signatures

**Scenario:** Digital signatures, document signing, secure transactions.

**Why NOT web-eid-pd:**
- Cannot create digital signatures
- No access to private keys
- No cryptographic proof of identity

**Use instead:**
- `web-eid.js` for authentication
- DigiDoc4 for document signing
- Smart-ID for mobile signatures

---

### ❌ You Need Strong Authentication

**Scenario:** High-security applications requiring cryptographic proof.

**Why NOT web-eid-pd:**
- No challenge-response authentication
- No cryptographic binding
- Personal data can be copied/replayed
- No proof of card possession at authentication time

**Use instead:**
- `web-eid.js` with certificate-based authentication
- Smart-ID with challenge-response
- Mobile-ID with PIN verification

**Security note:**
```javascript
// ❌ BAD: Using personal code alone for authentication
const result = await EstEID_PD.readPersonalData();
if (result.data.personalCode === expectedCode) {
  // INSECURE! Personal code can be known/guessed
  loginUser();
}

// ✅ GOOD: Use as identity verification with additional factors
const result = await EstEID_PD.readPersonalData();
if (result.data.personalCode === expectedCode) {
  // Send OTP to registered phone
  await sendOTP(user.phone);
  // Verify OTP before login
}
```

---

### ❌ You Need PIN Verification

**Scenario:** Verifying user knows the card PIN.

**Why NOT web-eid-pd:**
- Personal data readable without PIN
- Cannot verify PIN
- Cannot access PIN-protected operations

**Use instead:**
- `web-eid.js` (requires PIN for authentication)
- DigiDoc4 (requires PIN for signing)

---

### ❌ You Need to Read Certificates

**Scenario:** Need certificate data, validity period, issuer info.

**Why NOT web-eid-pd:**
- Only reads personal data files
- No certificate parsing
- No certificate chain access

**Use instead:**
- `web-eid.js` for certificate reading
- Direct PKCS#11 access for advanced certificate operations

---

### ❌ You Need NFC/Contactless Reading

**Scenario:** Reading via smartphone NFC.

**Why NOT web-eid-pd:**
- Currently only supports contact readers
- No PACE implementation
- No secure messaging for NFC

**Use instead:**
- Mobile apps with NFC support
- RIA's nfc-Android-lib
- Platform-specific NFC APIs

**Note:** NFC support is planned for future versions.

---

## Comparison Matrix

| Feature | web-eid-pd | web-eid.js | DigiDoc4 | Smart-ID |
|---------|------------|------------|----------|----------|
| **Read personal data** | ✅ Yes | ⚠️ Via cert | ⚠️ Via cert | ❌ No |
| **Digital signatures** | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| **Authentication** | ⚠️ Weak | ✅ Strong | ✅ Strong | ✅ Strong |
| **Requires PIN** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **Works offline** | ✅ Yes | ⚠️ Partial | ⚠️ Partial | ❌ No |
| **Expired certs OK** | ✅ Yes | ❌ No | ❌ No | N/A |
| **Requires card** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **Mobile support** | ❌ No | ⚠️ Partial | ❌ No | ✅ Yes |
| **Setup complexity** | ⭐ Low | ⭐⭐ Medium | ⭐⭐⭐ High | ⭐⭐ Medium |

Legend:
- ✅ Fully supported
- ⚠️ Partially supported or with limitations
- ❌ Not supported
- N/A: Not applicable

---

## Decision Tree

```
Do you need digital signatures?
│
├─> YES: Use DigiDoc4 or web-eid.js
│
└─> NO: Continue
    │
    Do you need strong cryptographic authentication?
    │
    ├─> YES: Use web-eid.js or Smart-ID
    │
    └─> NO: Continue
        │
        Do you only need identity information?
        │
        ├─> YES: Use web-eid-pd ✅
        │
        └─> NO: Continue
            │
            Are certificates available and valid?
            │
            ├─> YES: Use web-eid.js
            │
            └─> NO: Use web-eid-pd as fallback ✅
```

---

## Recommended Patterns

### Pattern 1: Certificate-First with Fallback

**Best for:** Production applications requiring both strong auth and fallback.

```javascript
async function authenticate() {
  try {
    // Try certificate-based authentication first
    const cert = await webeid.authenticate(challenge);
    return { method: 'certificate', data: cert, strength: 'strong' };
  } catch (error) {
    if (error.code === 'NO_CERTIFICATES' || error.code === 'CERT_EXPIRED') {
      // Fallback to chip reading
      const result = await EstEID_PD.readPersonalData();
      if (result.ok) {
        // Require additional verification
        await sendOTP(result.data.personalCode);
        return { method: 'chip+otp', data: result.data, strength: 'medium' };
      }
    }
    throw error;
  }
}
```

### Pattern 2: Chip-Only for Simple Use Cases

**Best for:** Registration, form filling, low-security identity verification.

```javascript
async function registerUser() {
  const result = await EstEID_PD.readPersonalData();
  if (result.ok) {
    // Use data directly
    await createAccount({
      firstName: result.data.givenName,
      lastName: result.data.surname,
      personalCode: result.data.personalCode,
      birthDate: result.data.birthDate
    });
  }
}
```

### Pattern 3: Chip Reading + Additional Factors

**Best for:** Medium-security applications.

```javascript
async function secureLogin() {
  // Step 1: Read ID card
  const result = await EstEID_PD.readPersonalData();
  if (!result.ok) {
    throw new Error('Failed to read ID card');
  }
  
  // Step 2: Verify against database
  const user = await db.findByPersonalCode(result.data.personalCode);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Step 3: Send OTP
  await sendOTP(user.phone);
  
  // Step 4: Verify OTP
  const otp = await promptForOTP();
  if (!verifyOTP(otp)) {
    throw new Error('Invalid OTP');
  }
  
  // Step 5: Create session
  return createSession(user);
}
```

---

## Security Considerations

### What web-eid-pd Provides

✅ **Identity verification** - Confirms data matches ID card chip  
✅ **Data integrity** - Data comes directly from secure chip  
✅ **Tamper resistance** - Chip data cannot be modified  

### What web-eid-pd Does NOT Provide

❌ **Authentication** - No cryptographic proof of identity  
❌ **Non-repudiation** - No digital signature  
❌ **PIN verification** - Cannot verify user knows PIN  
❌ **Card possession proof** - Data could be copied  

### Security Recommendations

1. **For low-security use cases:**
   - Form auto-fill: OK to use alone
   - Public information lookup: OK to use alone

2. **For medium-security use cases:**
   - Add OTP verification
   - Add password authentication
   - Add biometric verification
   - Verify against existing account

3. **For high-security use cases:**
   - Use certificate-based authentication instead
   - Use web-eid-pd only as fallback
   - Require additional strong factors
   - Implement transaction signing

---

## Cost-Benefit Analysis

### Benefits of web-eid-pd

| Benefit | Impact |
|---------|--------|
| **Simple implementation** | ⭐⭐⭐ Faster development |
| **No PKI infrastructure** | ⭐⭐⭐ Lower costs |
| **Works offline** | ⭐⭐ More use cases |
| **Expired certs OK** | ⭐⭐ Better UX |
| **Easy debugging** | ⭐⭐ Faster troubleshooting |

### Limitations of web-eid-pd

| Limitation | Impact |
|------------|--------|
| **No signatures** | ⭐⭐⭐ Cannot replace DigiDoc |
| **Weak authentication** | ⭐⭐⭐ Need additional factors |
| **No PIN verification** | ⭐⭐ Less secure |
| **Contact readers only** | ⭐ Limited hardware support |

---

## Real-World Examples

### ✅ Good Use Cases

1. **E-Government Registration Portal**
   - Use: Pre-fill registration forms
   - Why: Reduces data entry errors, improves UX
   - Security: Medium (registration, not authentication)

2. **Healthcare Check-In Kiosk**
   - Use: Patient identification at clinic
   - Why: Fast, works offline, no internet needed
   - Security: Low-medium (verified by staff)

3. **Library Card Registration**
   - Use: Register for library card
   - Why: Simple, fast, no high security needed
   - Security: Low (public service)

4. **Age Verification System**
   - Use: Verify age for age-restricted content
   - Why: Fast, reliable, no auth needed
   - Security: Low (only need birth date)

### ❌ Bad Use Cases

1. **Online Banking**
   - Why bad: Requires strong authentication
   - Use instead: Certificate-based auth + 2FA

2. **Document Signing**
   - Why bad: Requires digital signatures
   - Use instead: DigiDoc4 or web-eid.js

3. **High-Value Transactions**
   - Why bad: No non-repudiation
   - Use instead: Certificate-based auth + transaction signing

4. **Remote Authentication**
   - Why bad: No proof of card possession
   - Use instead: Smart-ID or Mobile-ID

---

## Migration Guide

### From Certificate-Based to Chip Reading

If you're considering switching from certificate-based authentication:

**⚠️ Warning:** This is usually a downgrade in security. Only do this if:
- You don't need strong authentication
- You only need identity information
- You have other security measures in place

**Migration steps:**
1. Keep certificate-based auth as primary method
2. Add chip reading as fallback
3. Monitor usage and security incidents
4. Gradually increase chip reading usage if appropriate
5. Never remove certificate-based auth for high-security operations

### Adding Chip Reading to Existing System

**Recommended approach:**

```javascript
// Existing certificate-based auth
async function authenticateWithCert() {
  // Your existing implementation
}

// New chip reading fallback
async function authenticateWithChip() {
  const result = await EstEID_PD.readPersonalData();
  if (result.ok) {
    // Add additional verification
    await requireOTP();
    return result.data;
  }
}

// Combined authentication
async function authenticate() {
  try {
    return await authenticateWithCert();
  } catch (error) {
    if (shouldFallbackToChip(error)) {
      return await authenticateWithChip();
    }
    throw error;
  }
}
```

---

## Conclusion

### Use web-eid-pd when:
- ✅ You need identity information only
- ✅ Certificates are unavailable or expired
- ✅ You have low-medium security requirements
- ✅ You want simple implementation
- ✅ You need offline capability

### Don't use web-eid-pd when:
- ❌ You need digital signatures
- ❌ You need strong authentication
- ❌ You need high security
- ❌ You need PIN verification
- ❌ You need NFC support

### Best practice:
Use web-eid-pd as a **fallback** or **supplement** to certificate-based authentication, not as a replacement for high-security operations.

---

## Further Reading

- [APPLICATION-INTEGRATION-GUIDE.md](../APPLICATION-INTEGRATION-GUIDE.md) - How to integrate
- [SECURITY.md](../SECURITY.md) - Security considerations
- [EXTENSION-GUIDE.md](../EXTENSION-GUIDE.md) - API documentation
- [web-eid.js documentation](https://github.com/web-eid/web-eid.js) - Certificate-based auth

---

**Questions?** Open an issue on GitHub or contact support.

