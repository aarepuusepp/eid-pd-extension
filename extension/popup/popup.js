/**
 * Estonian ID Card Reader - Popup UI Script
 */

document.addEventListener('DOMContentLoaded', async () => {
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  const readBtn = document.getElementById('readBtn');
  const clearBtn = document.getElementById('clearBtn');
  const resultsDiv = document.getElementById('results');
  const errorDiv = document.getElementById('error');
  const extensionVersionSpan = document.getElementById('extensionVersion');
  const helperVersionSpan = document.getElementById('helperVersion');
  const modeContact = document.getElementById('modeContact');
  const modeNFC = document.getElementById('modeNFC');
  const canInputDiv = document.getElementById('canInput');
  const canInput = document.getElementById('can');
  const nfcNotice = document.getElementById('nfcNotice');
  
  let nfcSupported = false;
  
  // Set extension version
  extensionVersionSpan.textContent = chrome.runtime.getManifest().version;
  
  // Get helper version and capabilities
  async function getHelperVersion() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'EID_PD_VERSION' });
      if (response.ok && response.version) {
        helperVersionSpan.textContent = response.version;
        helperVersionSpan.classList.remove('error');
      } else {
        helperVersionSpan.textContent = 'not available';
        helperVersionSpan.classList.add('error');
      }
    } catch (error) {
      helperVersionSpan.textContent = 'not available';
      helperVersionSpan.classList.add('error');
    }
  }
  
  // Check NFC capabilities
  async function checkCapabilities() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'EID_PD_CAPABILITIES' });
      if (response.ok && response.data) {
        nfcSupported = response.data.nfcSupported || false;
        if (!nfcSupported) {
          // Disable NFC mode if not supported
          modeNFC.disabled = true;
        }
      }
    } catch (error) {
      console.error('Failed to check capabilities:', error);
      nfcSupported = false;
      modeNFC.disabled = true;
    }
  }
  
  // Fetch helper version and capabilities
  getHelperVersion();
  checkCapabilities();
  
  /**
   * Update status indicator
   */
  function updateStatus(status, text) {
    statusIndicator.className = 'status-indicator ' + status;
    statusText.textContent = text;
  }
  
  /**
   * Show error
   */
  function showError(message, details = '') {
    errorDiv.classList.remove('hidden');
    resultsDiv.classList.add('hidden');
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorDetails').textContent = details;
  }
  
  /**
   * Show results
   */
  function showResults(data) {
    resultsDiv.classList.remove('hidden');
    errorDiv.classList.add('hidden');
    
    document.getElementById('name').textContent = 
      (data.givenName || '') + ' ' + (data.surname || '');
    document.getElementById('personalCode').textContent = data.personalCode || '-';
    document.getElementById('documentNr').textContent = data.documentNr || '-';
    document.getElementById('citizenship').textContent = data.citizenship || '-';
    document.getElementById('birthDate').textContent = data.birthDate || '-';
    document.getElementById('expiryDate').textContent = data.expiryDate || '-';
    document.getElementById('source').textContent = data.source || 'chip';
  }
  
  /**
   * Check status on load
   */
  async function checkStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'EID_PD_STATUS' });
      
      if (response.ok && response.available) {
        updateStatus('ready', 'Ready to read');
        readBtn.disabled = false;
        
        if (response.cached) {
          const ageSeconds = Math.round(response.cacheAge / 1000);
          updateStatus('ready', `Ready (cached ${ageSeconds}s ago)`);
        }
      } else {
        updateStatus('error', 'Native helper not available');
        readBtn.disabled = true;
        showError(
          'Native helper is not installed or not responding.',
          response.error || 'Please run the installer and restart the browser.'
        );
      }
    } catch (error) {
      updateStatus('error', 'Extension error');
      readBtn.disabled = true;
      showError('Failed to check status', error.message);
    }
  }
  
  /**
   * Update mode UI
   */
  function updateModeUI() {
    const isNFC = modeNFC.checked;
    
    if (isNFC) {
      canInputDiv.classList.remove('hidden');
      if (!nfcSupported) {
        nfcNotice.classList.remove('hidden');
        readBtn.disabled = true;
      } else {
        nfcNotice.classList.add('hidden');
        // Enable read button only if CAN is valid
        validateCAN();
      }
    } else {
      canInputDiv.classList.add('hidden');
      nfcNotice.classList.add('hidden');
      readBtn.disabled = false;
    }
  }
  
  /**
   * Validate CAN input
   */
  function validateCAN() {
    const can = canInput.value;
    const isValid = /^[0-9]{6}$/.test(can);
    
    if (modeNFC.checked) {
      readBtn.disabled = !isValid || !nfcSupported;
    }
    
    return isValid;
  }
  
  /**
   * Read personal data
   */
  async function readPersonalData() {
    updateStatus('', 'Reading card...');
    readBtn.disabled = true;
    errorDiv.classList.add('hidden');
    resultsDiv.classList.add('hidden');
    
    try {
      const isNFC = modeNFC.checked;
      let response;
      
      if (isNFC) {
        // NFC mode
        if (!validateCAN()) {
          showError('Invalid CAN', 'Please enter a valid 6-digit CAN from your ID card.');
          readBtn.disabled = false;
          return;
        }
        
        response = await chrome.runtime.sendMessage({ 
          type: 'EID_PD_READ_NFC',
          can: canInput.value
        });
      } else {
        // Contact mode
        response = await chrome.runtime.sendMessage({ 
          type: 'EID_PD_READ',
          options: { useCache: false } // Always read fresh in popup
        });
      }
      
      if (response.ok && response.data) {
        updateStatus('ready', 'Read successful');
        showResults(response.data);
      } else {
        updateStatus('error', 'Read failed');
        showError(
          response.error || 'Failed to read personal data',
          response.details || 'Make sure the ID card is inserted/placed properly.'
        );
      }
    } catch (error) {
      updateStatus('error', 'Read failed');
      showError('Failed to read personal data', error.message);
    } finally {
      readBtn.disabled = false;
      if (modeNFC.checked) {
        validateCAN(); // Re-validate to set correct button state
      }
    }
  }
  
  /**
   * Clear cache
   */
  async function clearCache() {
    try {
      await chrome.runtime.sendMessage({ type: 'EID_PD_CLEAR_CACHE' });
      resultsDiv.classList.add('hidden');
      errorDiv.classList.add('hidden');
      updateStatus('ready', 'Cache cleared');
      
      // Re-check status
      setTimeout(checkStatus, 500);
    } catch (error) {
      showError('Failed to clear cache', error.message);
    }
  }
  
  // Event listeners
  readBtn.addEventListener('click', readPersonalData);
  clearBtn.addEventListener('click', clearCache);
  modeContact.addEventListener('change', updateModeUI);
  modeNFC.addEventListener('change', updateModeUI);
  canInput.addEventListener('input', validateCAN);
  
  // Initial status check and mode UI
  checkStatus();
  updateModeUI();
});

