/**
 * Estonian ID Card Reader - Popup UI Script
 */

document.addEventListener('DOMContentLoaded', async () => {
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  const readBtn = document.getElementById('readBtn');
  const clearBtn = document.getElementById('clearBtn');
  const resultsDiv = document.getElementById('results');
  const multiResultsDiv = document.getElementById('multiResults');
  const errorDiv = document.getElementById('error');
  const extensionVersionSpan = document.getElementById('extensionVersion');
  const helperVersionSpan = document.getElementById('helperVersion');
  const modeContact = document.getElementById('modeContact');
  const modeNFC = document.getElementById('modeNFC');
  const modeAll = document.getElementById('modeAll');
  const canInputDiv = document.getElementById('canInput');
  const canInput = document.getElementById('can');
  const retryInput = document.getElementById('retryCount');
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
   * Show single-reader results
   */
  function showResults(data, response) {
    resultsDiv.classList.remove('hidden');
    multiResultsDiv.classList.add('hidden');
    errorDiv.classList.add('hidden');
    
    document.getElementById('name').textContent = 
      (data.givenName || '') + ' ' + (data.surname || '');
    document.getElementById('personalCode').textContent = data.personalCode || '-';
    document.getElementById('documentNr').textContent = data.documentNr || '-';
    document.getElementById('citizenship').textContent = data.citizenship || '-';
    document.getElementById('birthDate').textContent = data.birthDate || '-';
    document.getElementById('expiryDate').textContent = data.expiryDate || '-';
    document.getElementById('source').textContent = data.source || 'chip';
    
    if (response && response.timestamp) {
      document.getElementById('timestamp').textContent = response.timestamp;
      document.getElementById('duration').textContent = response.duration || '';
      document.getElementById('timingInfo').classList.remove('hidden');
    }
  }
  
  /**
   * Show multi-reader results
   */
  function showMultiResults(response) {
    multiResultsDiv.classList.remove('hidden');
    resultsDiv.classList.add('hidden');
    errorDiv.classList.add('hidden');
    
    const list = document.getElementById('multiResultsList');
    while (list.firstChild) { list.removeChild(list.firstChild); }
    
    (response.results || []).forEach(result => {
      const card = document.createElement('div');
      card.className = 'reader-card' + (result.data ? ' reader-success' : ' reader-error');
      
      const nameDiv = document.createElement('div');
      nameDiv.className = 'reader-name';
      nameDiv.textContent = result.reader;
      card.appendChild(nameDiv);
      
      if (result.duration) {
        const durationSpan = document.createElement('span');
        durationSpan.className = 'reader-duration';
        durationSpan.textContent = result.duration;
        card.appendChild(durationSpan);
      }
      
      if (result.data) {
        const dataDiv = document.createElement('div');
        dataDiv.className = 'reader-data';
        const fullName = document.createElement('span');
        fullName.textContent = (result.data.givenName || '') + ' ' + (result.data.surname || '');
        const idCode = document.createElement('span');
        idCode.textContent = result.data.personalCode || '';
        dataDiv.appendChild(fullName);
        dataDiv.appendChild(idCode);
        card.appendChild(dataDiv);
      } else if (result.error) {
        const errDiv = document.createElement('div');
        errDiv.className = 'reader-error-msg';
        errDiv.textContent = result.error;
        card.appendChild(errDiv);
      }
      
      list.appendChild(card);
    });
    
    if (response.timestamp) {
      document.getElementById('multiTimestamp').textContent = response.timestamp;
      document.getElementById('multiDuration').textContent = response.duration || '';
      document.getElementById('multiTimingInfo').classList.remove('hidden');
    }
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
    const isAll = modeAll.checked;
    
    if (isNFC) {
      canInputDiv.classList.remove('hidden');
      if (!nfcSupported) {
        nfcNotice.classList.remove('hidden');
        readBtn.disabled = true;
      } else {
        nfcNotice.classList.add('hidden');
        validateCAN();
      }
    } else {
      canInputDiv.classList.add('hidden');
      nfcNotice.classList.add('hidden');
      readBtn.disabled = false;
    }
    
    readBtn.textContent = isAll ? 'Read All Readers' : 'Read ID Card';
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
    multiResultsDiv.classList.add('hidden');
    
    try {
      const isNFC = modeNFC.checked;
      const isAll = modeAll.checked;
      let response;
      
      if (isAll) {
        response = await chrome.runtime.sendMessage({ 
          type: 'EID_PD_READ_ALL',
          options: {}
        });
        
        if (response.ok && response.results) {
          const successCount = response.results.filter(r => r.data).length;
          const statusMsg = 'Read ' + successCount + '/' + response.results.length + ' readers';
          updateStatus('ready', statusMsg + (response.duration ? ' in ' + response.duration : ''));
          showMultiResults(response);
        } else {
          updateStatus('error', 'Read failed');
          showError(
            response.error || 'Failed to read from readers',
            response.details || 'Make sure cards are inserted.'
          );
        }
      } else if (isNFC) {
        if (!validateCAN()) {
          showError('Invalid CAN', 'Please enter a valid 6-digit CAN from your ID card.');
          readBtn.disabled = false;
          return;
        }
        
        response = await chrome.runtime.sendMessage({ 
          type: 'EID_PD_READ_NFC',
          can: canInput.value,
          retry: parseInt(retryInput.value) || 3
        });
        
        if (response.ok && response.data) {
          updateStatus('ready', 'Read successful' + (response.duration ? ' in ' + response.duration : ''));
          showResults(response.data, response);
        } else {
          updateStatus('error', 'Read failed');
          showError(
            response.error || 'Failed to read personal data',
            response.details || 'Make sure the ID card is placed on the NFC reader.'
          );
        }
      } else {
        response = await chrome.runtime.sendMessage({ 
          type: 'EID_PD_READ',
          options: { useCache: false }
        });
        
        if (response.ok && response.data) {
          updateStatus('ready', 'Read successful' + (response.duration ? ' in ' + response.duration : ''));
          showResults(response.data, response);
        } else {
          updateStatus('error', 'Read failed');
          showError(
            response.error || 'Failed to read personal data',
            response.details || 'Make sure the ID card is inserted properly.'
          );
        }
      }
    } catch (error) {
      updateStatus('error', 'Read failed');
      showError('Failed to read personal data', error.message);
    } finally {
      readBtn.disabled = false;
      if (modeNFC.checked) {
        validateCAN();
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
  modeAll.addEventListener('change', updateModeUI);
  canInput.addEventListener('input', validateCAN);
  
  // Initial status check and mode UI
  checkStatus();
  updateModeUI();
});

