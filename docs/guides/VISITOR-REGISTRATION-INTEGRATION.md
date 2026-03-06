# Visitor Registration -- ID Card Integration

Implementation guide for adding an "Read from ID Card" button to a Visitor Registration webpage using the `eid-pd-extension` and `eid-pd-reader`.

## Prerequisites

On every workstation where the feature will be used:

| Component | Purpose |
|-----------|---------|
| `eid-pd-reader` v2.0.0+ | Native helper that reads the card via PC/SC |
| `eid-pd-extension` v1.0.3+ | Browser extension that bridges the web page to the reader |
| USB smart card reader | Hardware (or NFC reader for contactless mode) |
| Chrome 109+ / Edge 109+ / Firefox 109+ | Supported browsers |

Run `install-reader.cmd` (from the reader's `build/` folder) to install both the native helper and register it for all browsers. Then load the extension in the browser.

---

## Architecture Overview

```
Visitor Registration Page
        |
        | window.EstEID_PD.readPersonalData()
        v
 eid-pd-extension (content-bridge.js -> background.js)
        |
        | Native Messaging (stdin/stdout JSON)
        v
   eid-pd-reader.exe
        |
        | PC/SC (SCardTransmit)
        v
   Smart Card Reader + ID Card
```

The extension injects `page-api.js` into every page, exposing the `window.EstEID_PD` object. All communication is local -- no data leaves the machine.

---

## Implementation Steps

### Step 1: Detect Extension Availability

The extension fires an `esteid-pd-ready` event when loaded. If the page loads after the extension is already initialized, `window.EstEID_PD` is immediately available.

```javascript
let esteidAvailable = false;

function onExtensionReady() {
  esteidAvailable = true;
  // Show the "Read from ID Card" button
  document.getElementById('readCardBtn').style.display = 'inline-block';
}

// Extension may already be loaded
if (window.EstEID_PD) {
  onExtensionReady();
}

// Or it may load after DOMContentLoaded
window.addEventListener('esteid-pd-ready', onExtensionReady);
```

If the extension is not installed, `window.EstEID_PD` remains `undefined`. The button stays hidden and manual entry is the only option.

### Step 2: Add the Button and Card Picker to the Registration Form

Place the button next to or above the form fields it will fill. Include a hidden card picker area that appears only when multiple cards are detected.

```html
<form id="visitorForm">
  <fieldset>
    <legend>Visitor Information</legend>

    <div class="form-row">
      <button type="button" id="readCardBtn" style="display:none"
              onclick="readFromIDCard()">
        Read from ID Card
      </button>
    </div>

    <div id="cardStatus" class="status-message" style="display:none"></div>

    <!-- Card picker: shown when multiple cards are detected -->
    <div id="cardPicker" style="display:none">
      <p class="picker-label">Multiple cards detected. Select one:</p>
      <div id="cardPickerList"></div>
    </div>

    <div class="form-row">
      <label for="firstName">First Name</label>
      <input type="text" id="firstName" name="firstName" required>
    </div>

    <div class="form-row">
      <label for="lastName">Last Name</label>
      <input type="text" id="lastName" name="lastName" required>
    </div>

    <div class="form-row">
      <label for="personalCode">Personal Code</label>
      <input type="text" id="personalCode" name="personalCode"
             pattern="\d{11}" maxlength="11" required>
    </div>

    <div class="form-row">
      <label for="documentNr">Document Number</label>
      <input type="text" id="documentNr" name="documentNr">
    </div>

    <div class="form-row">
      <label for="citizenship">Citizenship</label>
      <input type="text" id="citizenship" name="citizenship">
    </div>

    <button type="submit">Register Visitor</button>
  </fieldset>
</form>
```

### Step 3: Implement the Read Function with Multi-Card Selection

When the user clicks "Read from ID Card", the function first uses `readAllReaders()` to discover all inserted cards. If only one card is found, the form is filled immediately. If multiple cards are found, a picker is shown so the user can choose.

```javascript
async function readFromIDCard() {
  const btn = document.getElementById('readCardBtn');
  const status = document.getElementById('cardStatus');
  const picker = document.getElementById('cardPicker');

  btn.disabled = true;
  btn.textContent = 'Reading\u2026';
  status.style.display = 'none';
  picker.style.display = 'none';

  try {
    const result = await window.EstEID_PD.readAllReaders();

    if (!result.ok) {
      showStatus(status, 'error', mapError(result.error));
      return;
    }

    // Filter to only successfully read cards
    const cards = (result.results || []).filter(function(r) { return r.data; });

    if (cards.length === 0) {
      showStatus(status, 'error', 'No ID cards found. Please insert a card.');
      return;
    }

    if (cards.length === 1) {
      // Single card: fill immediately
      fillForm(cards[0].data);
      showStatus(status, 'success',
        cards[0].data.givenName + ' ' + cards[0].data.surname +
        (cards[0].duration ? ' (' + cards[0].duration + ')' : ''));
      return;
    }

    // Multiple cards: show picker
    showCardPicker(cards);

  } catch (err) {
    showStatus(status, 'error', 'Unexpected error: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Read from ID Card';
  }
}
```

### Step 4: Card Picker for Multiple Readers

When multiple cards are detected, render a clickable card for each person. Clicking one fills the form.

```javascript
function showCardPicker(cards) {
  var picker = document.getElementById('cardPicker');
  var list = document.getElementById('cardPickerList');
  var status = document.getElementById('cardStatus');

  // Clear previous entries
  while (list.firstChild) list.removeChild(list.firstChild);

  cards.forEach(function(card) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'card-pick-btn';

    var name = document.createElement('span');
    name.className = 'card-pick-name';
    name.textContent = card.data.givenName + ' ' + card.data.surname;

    var code = document.createElement('span');
    code.className = 'card-pick-code';
    code.textContent = card.data.personalCode;

    var reader = document.createElement('span');
    reader.className = 'card-pick-reader';
    reader.textContent = card.reader;

    btn.appendChild(name);
    btn.appendChild(code);
    btn.appendChild(reader);

    btn.addEventListener('click', function() {
      fillForm(card.data);
      picker.style.display = 'none';
      showStatus(status, 'success',
        card.data.givenName + ' ' + card.data.surname + ' selected');
    });

    list.appendChild(btn);
  });

  picker.style.display = 'block';
}
```

### Step 4: Fill the Form Fields

```javascript
function fillForm(data) {
  setField('firstName',    data.givenName);
  setField('lastName',     data.surname);
  setField('personalCode', data.personalCode);
  setField('documentNr',   data.documentNr);
  setField('citizenship',  data.citizenship);
}

function setField(id, value) {
  const el = document.getElementById(id);
  if (el && value) {
    el.value = value.trim();
    // Trigger change event so any framework bindings update
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
}
```

### Step 5: Map Errors to User-Friendly Messages

```javascript
function mapError(error) {
  if (!error) return 'Unknown error';
  const e = error.toLowerCase();

  if (e.includes('card_not_found') || e.includes('no card'))
    return 'ID card not found. Please insert the card into the reader.';
  if (e.includes('no readers') || e.includes('no contact readers'))
    return 'Card reader not found. Please connect a USB card reader.';
  if (e.includes('native helper') || e.includes('not installed'))
    return 'Reader software is not installed. Contact IT support.';
  if (e.includes('timeout'))
    return 'Card read timed out. Remove and re-insert the card.';

  return 'Failed to read card: ' + error;
}

function showStatus(el, type, message) {
  el.textContent = message;
  el.className = 'status-message status-' + type;
  el.style.display = 'block';
}
```

---

## Response Data Reference

### `readAllReaders()` response (used by this integration)

```json
{
  "ok": true,
  "timestamp": "2026-03-06 15:54:32.11669",
  "duration": "2484ms",
  "results": [
    {
      "reader": "Alcor Micro USB Smart Card Reader 0",
      "duration": "1241ms",
      "data": {
        "surname": "JÕEORG",
        "givenName": "JAAK-KRISTJAN",
        "personalCode": "38001085718",
        "documentNr": "AT0000222",
        "citizenship": "EST",
        "sex": "M",
        "birthDate": "01 08 1980",
        "expiryDate": "09 12 2029",
        "issueDate": "09 12 2024",
        "source": "chip:IDEMIA"
      }
    },
    {
      "reader": "Generic Smart Card Reader Interface 0",
      "duration": "1237ms",
      "data": {
        "surname": "PUUSEPP",
        "givenName": "AARE",
        "personalCode": "37503294229",
        "documentNr": "AB1234567",
        "citizenship": "EST",
        "source": "chip:Thales"
      }
    }
  ]
}
```

Each entry in `results` has either `data` (success) or `error` (failure string). The code filters to entries where `data` is present.

### `readPersonalData()` response (single reader, for reference)

```json
{
  "ok": true,
  "timestamp": "2026-03-06 15:54:32.11669",
  "duration": "1241ms",
  "data": {
    "surname": "JÕEORG",
    "givenName": "JAAK-KRISTJAN",
    "personalCode": "38001085718",
    "documentNr": "AT0000222",
    "citizenship": "EST",
    "sex": "M",
    "birthDate": "01 08 1980",
    "expiryDate": "09 12 2029",
    "issueDate": "09 12 2024",
    "source": "chip:IDEMIA"
  }
}
```

### Error response

```json
{
  "ok": false,
  "error": "Card not found! Please insert your ID card.",
  "details": "CARD_NOT_FOUND"
}
```

### Field Mapping

| ID Card Field | JSON key | Form field suggestion | Notes |
|---------------|----------|-----------------------|-------|
| Surname | `surname` | Last Name | May contain `-`, `Õ`, `Ä`, `Ö`, `Ü` |
| Given Name(s) | `givenName` | First Name | May contain multiple names separated by space |
| Personal Code | `personalCode` | Personal Code / ID Code | 11 digits, always present |
| Document Nr | `documentNr` | Document Number | e.g. `AT0000222` |
| Citizenship | `citizenship` | Citizenship | ISO 3166-1 alpha-3, e.g. `EST` |
| Sex | `sex` | -- | `M` or `F` |
| Date of Birth | `birthDate` | Date of Birth | Format: `DD MM YYYY` |
| Expiry Date | `expiryDate` | -- | Format: `DD MM YYYY` |
| Issue Date | `issueDate` | -- | Format: `DD MM YYYY` |
| Source | `source` | -- | Card type, e.g. `chip:Thales`, `chip:IDEMIA` |

---

## Complete Working Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Visitor Registration</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 40px auto; }
    fieldset { border: 1px solid #ccc; border-radius: 8px; padding: 20px; }
    legend { font-size: 1.2em; font-weight: 600; }
    .form-row { margin-bottom: 12px; }
    .form-row label { display: block; font-size: 0.85em; color: #555; margin-bottom: 2px; }
    .form-row input {
      width: 100%; padding: 8px; border: 1px solid #ccc;
      border-radius: 4px; box-sizing: border-box;
    }
    #readCardBtn {
      background: #0066cc; color: #fff; border: none; border-radius: 6px;
      padding: 10px 20px; cursor: pointer; font-size: 0.95em; margin-bottom: 16px;
    }
    #readCardBtn:hover { background: #0055aa; }
    #readCardBtn:disabled { background: #999; cursor: wait; }
    button[type="submit"] {
      background: #28a745; color: #fff; border: none; border-radius: 6px;
      padding: 10px 20px; cursor: pointer; font-size: 1em; margin-top: 8px;
    }
    .status-message {
      padding: 8px 12px; border-radius: 4px;
      margin-bottom: 12px; font-size: 0.9em;
    }
    .status-success { background: #d4edda; color: #155724; }
    .status-error   { background: #f8d7da; color: #721c24; }

    /* Card picker */
    #cardPicker { margin-bottom: 16px; }
    .picker-label { font-size: 0.9em; color: #333; margin: 0 0 8px; }
    #cardPickerList { display: flex; flex-direction: column; gap: 6px; }
    .card-pick-btn {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; width: 100%; padding: 10px 14px; border: 2px solid #0066cc;
      border-radius: 6px; background: #f0f7ff; cursor: pointer;
      text-align: left; font-size: 0.9em;
    }
    .card-pick-btn:hover { background: #dceeff; }
    .card-pick-name { font-weight: 600; flex: 1; }
    .card-pick-code { font-family: monospace; color: #333; }
    .card-pick-reader {
      font-size: 0.75em; color: #888;
      max-width: 140px; overflow: hidden;
      text-overflow: ellipsis; white-space: nowrap;
    }
  </style>
</head>
<body>

<form id="visitorForm">
  <fieldset>
    <legend>Visitor Registration</legend>

    <div class="form-row">
      <button type="button" id="readCardBtn" style="display:none"
              onclick="readFromIDCard()">
        Read from ID Card
      </button>
    </div>

    <div id="cardStatus" class="status-message" style="display:none"></div>

    <div id="cardPicker" style="display:none">
      <p class="picker-label">Multiple cards detected. Select one:</p>
      <div id="cardPickerList"></div>
    </div>

    <div class="form-row">
      <label for="firstName">First Name</label>
      <input type="text" id="firstName" name="firstName" required>
    </div>
    <div class="form-row">
      <label for="lastName">Last Name</label>
      <input type="text" id="lastName" name="lastName" required>
    </div>
    <div class="form-row">
      <label for="personalCode">Personal Code</label>
      <input type="text" id="personalCode" name="personalCode"
             pattern="\d{11}" maxlength="11" required>
    </div>
    <div class="form-row">
      <label for="documentNr">Document Number</label>
      <input type="text" id="documentNr" name="documentNr">
    </div>
    <div class="form-row">
      <label for="citizenship">Citizenship</label>
      <input type="text" id="citizenship" name="citizenship">
    </div>

    <button type="submit">Register Visitor</button>
  </fieldset>
</form>

<script>
  /* --- Extension detection --- */
  function onExtensionReady() {
    document.getElementById('readCardBtn').style.display = 'inline-block';
  }
  if (window.EstEID_PD) onExtensionReady();
  window.addEventListener('esteid-pd-ready', onExtensionReady);

  /* --- Read all cards, then pick or fill directly --- */
  async function readFromIDCard() {
    var btn = document.getElementById('readCardBtn');
    var status = document.getElementById('cardStatus');
    var picker = document.getElementById('cardPicker');

    btn.disabled = true;
    btn.textContent = 'Reading\u2026';
    status.style.display = 'none';
    picker.style.display = 'none';

    try {
      var result = await window.EstEID_PD.readAllReaders();

      if (!result.ok) {
        showStatus(status, 'error', mapError(result.error));
        return;
      }

      var cards = (result.results || []).filter(function(r) { return r.data; });

      if (cards.length === 0) {
        showStatus(status, 'error',
          'No ID cards found. Please insert a card into the reader.');
        return;
      }

      if (cards.length === 1) {
        fillForm(cards[0].data);
        showStatus(status, 'success',
          cards[0].data.givenName + ' ' + cards[0].data.surname +
          (cards[0].duration ? ' (' + cards[0].duration + ')' : ''));
        return;
      }

      // Multiple cards found -- let the user pick
      showCardPicker(cards);

    } catch (err) {
      showStatus(status, 'error', 'Unexpected error: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Read from ID Card';
    }
  }

  /* --- Card picker --- */
  function showCardPicker(cards) {
    var picker = document.getElementById('cardPicker');
    var list = document.getElementById('cardPickerList');
    var status = document.getElementById('cardStatus');

    while (list.firstChild) list.removeChild(list.firstChild);

    cards.forEach(function(card) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'card-pick-btn';

      var name = document.createElement('span');
      name.className = 'card-pick-name';
      name.textContent = card.data.givenName + ' ' + card.data.surname;

      var code = document.createElement('span');
      code.className = 'card-pick-code';
      code.textContent = card.data.personalCode;

      var reader = document.createElement('span');
      reader.className = 'card-pick-reader';
      reader.textContent = card.reader;

      btn.appendChild(name);
      btn.appendChild(code);
      btn.appendChild(reader);

      btn.addEventListener('click', function() {
        fillForm(card.data);
        picker.style.display = 'none';
        showStatus(status, 'success',
          card.data.givenName + ' ' + card.data.surname + ' selected');
      });

      list.appendChild(btn);
    });

    picker.style.display = 'block';
  }

  /* --- Fill form --- */
  function fillForm(data) {
    setField('firstName',    data.givenName);
    setField('lastName',     data.surname);
    setField('personalCode', data.personalCode);
    setField('documentNr',   data.documentNr);
    setField('citizenship',  data.citizenship);
  }

  function setField(id, value) {
    var el = document.getElementById(id);
    if (el && value) {
      el.value = value.trim();
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  /* --- Error mapping --- */
  function mapError(error) {
    if (!error) return 'Unknown error';
    var e = error.toLowerCase();
    if (e.includes('card_not_found') || e.includes('no card'))
      return 'ID card not found. Please insert the card into the reader.';
    if (e.includes('no readers') || e.includes('no contact readers'))
      return 'Card reader not found. Please connect a USB card reader.';
    if (e.includes('native helper') || e.includes('not installed'))
      return 'Reader software not installed. Contact IT support.';
    if (e.includes('timeout'))
      return 'Card read timed out. Remove and re-insert the card.';
    return 'Failed to read card: ' + error;
  }

  function showStatus(el, type, msg) {
    el.textContent = msg;
    el.className = 'status-message status-' + type;
    el.style.display = 'block';
  }

  /* --- Form submit --- */
  document.getElementById('visitorForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var formData = new FormData(this);
    var data = Object.fromEntries(formData.entries());
    console.log('Registering visitor:', data);
    alert('Visitor registered: ' + data.firstName + ' ' + data.lastName);
  });
</script>

</body>
</html>
```

---

## Integrating into an Existing Page

If the registration form already exists, the integration requires three additions to the page.

### 1. Add the HTML elements

Place this wherever you want the button and card picker to appear:

```html
<button type="button" id="readCardBtn" style="display:none"
        onclick="readFromIDCard()">Read from ID Card</button>
<div id="cardStatus" class="status-message" style="display:none"></div>
<div id="cardPicker" style="display:none">
  <p class="picker-label">Multiple cards detected. Select one:</p>
  <div id="cardPickerList"></div>
</div>
```

### 2. Add the JavaScript

Add the following `<script>` block before `</body>` (or in your existing JS bundle). Adjust the field IDs in `fillForm` to match your form.

```html
<script>
  // Show button when extension is available
  if (window.EstEID_PD) document.getElementById('readCardBtn').style.display = 'inline-block';
  window.addEventListener('esteid-pd-ready', function() {
    document.getElementById('readCardBtn').style.display = 'inline-block';
  });

  async function readFromIDCard() {
    var btn = document.getElementById('readCardBtn');
    var status = document.getElementById('cardStatus');
    var picker = document.getElementById('cardPicker');
    btn.disabled = true; btn.textContent = 'Reading\u2026';
    status.style.display = 'none'; picker.style.display = 'none';

    try {
      var result = await window.EstEID_PD.readAllReaders();
      if (!result.ok) {
        showMsg(status, 'error', result.error || 'Read failed'); return;
      }
      var cards = (result.results || []).filter(function(r) { return r.data; });
      if (cards.length === 0) {
        showMsg(status, 'error', 'No ID cards found. Insert a card.'); return;
      }
      if (cards.length === 1) {
        useCard(cards[0].data);
        showMsg(status, 'success', cards[0].data.givenName + ' ' + cards[0].data.surname);
        return;
      }
      // Multiple cards: show picker
      var list = document.getElementById('cardPickerList');
      while (list.firstChild) list.removeChild(list.firstChild);
      cards.forEach(function(c) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'card-pick-btn';
        b.textContent = c.data.givenName + ' ' + c.data.surname + '  ' + c.data.personalCode;
        b.addEventListener('click', function() {
          useCard(c.data); picker.style.display = 'none';
          showMsg(status, 'success', c.data.givenName + ' ' + c.data.surname + ' selected');
        });
        list.appendChild(b);
      });
      picker.style.display = 'block';
    } catch (err) {
      showMsg(status, 'error', err.message);
    } finally { btn.disabled = false; btn.textContent = 'Read from ID Card'; }
  }

  function useCard(data) {
    // ADJUST THESE IDs TO MATCH YOUR FORM
    document.getElementById('firstName').value = data.givenName || '';
    document.getElementById('lastName').value = data.surname || '';
    document.getElementById('personalCode').value = data.personalCode || '';
  }

  function showMsg(el, type, msg) {
    el.textContent = msg;
    el.className = 'status-message status-' + type;
    el.style.display = 'block';
  }
</script>
```

### 3. Add minimal CSS (if not already styled)

```css
.status-message { padding: 8px 12px; border-radius: 4px; margin: 8px 0; font-size: 0.9em; }
.status-success { background: #d4edda; color: #155724; }
.status-error   { background: #f8d7da; color: #721c24; }
.picker-label   { font-size: 0.9em; color: #333; margin: 0 0 8px; }
#cardPickerList { display: flex; flex-direction: column; gap: 6px; }
.card-pick-btn  {
  width: 100%; padding: 10px 14px; border: 2px solid #0066cc;
  border-radius: 6px; background: #f0f7ff; cursor: pointer;
  text-align: left; font-size: 0.9em;
}
.card-pick-btn:hover { background: #dceeff; }
```

---

## Backend Considerations

The ID card data is read locally in the browser. No server-side code is required for the card reading itself. However, when the form is submitted:

### Validate Personal Code Format

Estonian personal codes follow the format `GYYMMDDSSSC`:
- `G` = gender/century (1-6)
- `YYMMDD` = birth date
- `SSS` = serial number
- `C` = checksum

```javascript
function isValidPersonalCode(code) {
  if (!/^\d{11}$/.test(code)) return false;

  var weights1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1];
  var weights2 = [3, 4, 5, 6, 7, 8, 9, 1, 2, 3];
  var digits = code.split('').map(Number);

  var sum = 0;
  for (var i = 0; i < 10; i++) sum += digits[i] * weights1[i];
  var check = sum % 11;

  if (check === 10) {
    sum = 0;
    for (var j = 0; j < 10; j++) sum += digits[j] * weights2[j];
    check = sum % 11;
    if (check === 10) check = 0;
  }

  return check === digits[10];
}
```

### Server-Side Validation

Always validate on the server. The client-side data can be tampered with.

```
POST /api/visitors
Content-Type: application/json

{
  "firstName": "JAAK-KRISTJAN",
  "lastName": "JÕEORG",
  "personalCode": "38001085718",
  "documentNr": "AT0000222",
  "citizenship": "EST"
}
```

The server should:
1. Validate personal code checksum
2. Check that the birth date encoded in the personal code is plausible
3. Sanitize all string inputs (prevent XSS/injection)
4. Log the registration event

---

## Edge Cases

| Scenario | Behavior | Handling |
|----------|----------|----------|
| Extension not installed | `window.EstEID_PD` is `undefined` | Button stays hidden; manual entry only |
| Reader not installed | `checkStatus()` returns `available: false` | Show error: "Reader software not installed" |
| No card reader connected | `readAllReaders()` returns error | Show error: "Card reader not found" |
| Card not inserted | `readAllReaders()` returns 0 successful results | Show error: "No ID cards found" |
| Single card in single reader | 1 successful result | Form filled immediately, no picker |
| Multiple readers, one card | 1 successful + N errors in results | Form filled immediately from the successful one |
| Multiple readers, multiple cards | N successful results | Card picker shown; user clicks to select |
| User reads card, then edits fields | Fields are editable after fill | Allow manual corrections |
| Estonian characters (Õ, Ä, Ö, Ü) | Returned as UTF-8 | Ensure page has `<meta charset="UTF-8">` |
| Card read takes >5 seconds | Button shows "Reading..." | Timeout at 60s (readAllReaders default) |
| Repeat reads | Each click reads all readers fresh | User can pick a different card each time |

---

## Security Notes

1. **Data stays local.** The extension communicates only with the locally installed `eid-pd-reader.exe` via Native Messaging. No data is sent to any external server by the extension.

2. **No PIN required.** Personal data files on the card are publicly readable (no authentication needed). This is by design -- the same data is printed on the card surface.

3. **Do not store card data in localStorage/sessionStorage.** Fill the form fields and submit. Let the server persist the data.

4. **HTTPS recommended.** While the extension works on `http://localhost`, production deployments should use HTTPS.

5. **Validate on the server.** Client-side data from the card can be modified before submission. Always validate and sanitize on the backend.
