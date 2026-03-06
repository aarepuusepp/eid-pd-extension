/**
 * Estonian ID Card Personal Data Reader - Firefox Background Script
 * 
 * Firefox 109+ supports Manifest V3 with service workers.
 * This uses the same logic as background.js but with browser.* API
 * (Firefox supports both browser.* and chrome.* in MV3)
 */

const NATIVE_HOST = "ee.aarepuusepp.eid_pd_reader";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Use browser API (Firefox) with fallback to chrome API
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// In-memory cache for personal data
let cachedData = null;
let cacheTimestamp = null;

/**
 * Call the native helper application
 */
async function callNativeHelper(message) {
  return new Promise((resolve) => {
    console.log('[EstEID-PD] Calling native helper:', message);
    
    browserAPI.runtime.sendNativeMessage(NATIVE_HOST, message, (response) => {
      const lastError = browserAPI.runtime.lastError;
      if (lastError) {
        const error = lastError.message;
        console.error('[EstEID-PD] Native messaging error:', error);
        
        let userMessage = error;
        if (error.includes('Specified native messaging host not found') || 
            error.includes('No such native application')) {
          userMessage = 'Native helper not installed. Please run the installer.';
        } else if (error.includes('Native host has exited')) {
          userMessage = 'Native helper crashed. Please check if ID card is inserted.';
        }
        
        resolve({ 
          ok: false, 
          error: userMessage,
          details: error
        });
      } else {
        console.log('[EstEID-PD] Native helper response:', response);
        resolve(response || { ok: false, error: 'No response from native helper' });
      }
    });
  });
}

/**
 * Read personal data from ID card
 */
async function readPersonalData(options = {}) {
  if (options.mode !== 'nfc' && options.useCache !== false && cachedData && cacheTimestamp) {
    const age = Date.now() - cacheTimestamp;
    if (age < CACHE_DURATION) {
      console.log('[EstEID-PD] Returning cached data (age: ' + Math.round(age / 1000) + 's)');
      return { ...cachedData, cached: true, cacheAge: age };
    }
  }
  
  let message;
  if (options.mode === 'nfc') {
    if (!options.can) {
      return {
        ok: false,
        error: 'NFC mode requires CAN (Card Access Number)',
        errorCode: 'CAN_REQUIRED'
      };
    }
    message = {
      command: 'readPersonalDataNFC',
      can: options.can
    };
    if (options.retry && options.retry > 0) {
      message.retry = options.retry;
    }
  } else {
    message = {
      command: 'getPersonalData',
      fids: options.fids || {}
    };
  }
  
  const response = await callNativeHelper(message);
  
  if (!response.ok && response.error && response.error.includes('CARD_NOT_FOUND')) {
    return {
      ok: false,
      error: 'Card not found! Please insert your ID card into the reader.',
      errorCode: 'CARD_NOT_FOUND'
    };
  }
  
  if (!response.ok && response.error) {
    if (response.error.includes('PACE not available')) {
      return {
        ok: false,
        error: 'NFC/PACE not supported in this build. Please use contact mode or install NFC-enabled version.',
        errorCode: 'PACE_NOT_AVAILABLE',
        details: response.error
      };
    }
    if (response.error.includes('PACE failed')) {
      return {
        ok: false,
        error: 'PACE authentication failed. Please check your CAN and try again.',
        errorCode: 'PACE_FAILED',
        details: response.error
      };
    }
  }
  
  if (options.mode !== 'nfc' && response.ok && response.data) {
    cachedData = response;
    cacheTimestamp = Date.now();
    console.log('[EstEID-PD] Data cached');
  }
  
  return response;
}

/**
 * Read personal data from all available readers
 */
async function readAllReaders(options = {}) {
  const message = {
    command: 'readAllReaders',
    fids: options.fids || {}
  };
  
  const response = await callNativeHelper(message);
  return response;
}

/**
 * Clear cached personal data
 */
function clearCache() {
  cachedData = null;
  cacheTimestamp = null;
  console.log('[EstEID-PD] Cache cleared');
}

/**
 * Handle messages from content scripts
 */
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[EstEID-PD] Message received:', request.type, 'from', sender.tab?.url || 'popup');
  
  if (request.type === 'EID_PD_READ') {
    (async () => {
      try {
        const result = await readPersonalData(request.options || {});
        sendResponse(result);
      } catch (error) {
        console.error('[EstEID-PD] Error reading personal data:', error);
        sendResponse({ 
          ok: false, 
          error: error.message || 'Unknown error occurred'
        });
      }
    })();
    return true;
  }
  
  if (request.type === 'EID_PD_CLEAR_CACHE') {
    clearCache();
    sendResponse({ ok: true });
    return false;
  }
  
  if (request.type === 'EID_PD_STATUS') {
    (async () => {
      try {
        const result = await callNativeHelper({ command: 'ping' });
        sendResponse({ 
          ok: true, 
          available: result.ok,
          cached: cachedData !== null,
          cacheAge: cacheTimestamp ? Date.now() - cacheTimestamp : null
        });
      } catch (error) {
        sendResponse({ 
          ok: false, 
          available: false,
          error: error.message
        });
      }
    })();
    return true;
  }
  
  if (request.type === 'EID_PD_VERSION') {
    // Get version from native helper
    (async () => {
      try {
        const result = await callNativeHelper({ command: 'version' });
        sendResponse(result);
      } catch (error) {
        sendResponse({ 
          ok: false, 
          error: error.message
        });
      }
    })();
    return true;
  }
  
  if (request.type === 'EID_PD_CAPABILITIES') {
    // Get capabilities from native helper
    (async () => {
      try {
        const result = await callNativeHelper({ command: 'capabilities' });
        sendResponse(result);
      } catch (error) {
        sendResponse({ 
          ok: false, 
          error: error.message
        });
      }
    })();
    return true;
  }
  
  if (request.type === 'EID_PD_READ_NFC') {
    (async () => {
      try {
        const result = await readPersonalData({ 
          mode: 'nfc', 
          can: request.can,
          retry: request.retry,
          useCache: false 
        });
        sendResponse(result);
      } catch (error) {
        console.error('[EstEID-PD] Error reading personal data via NFC:', error);
        sendResponse({ 
          ok: false, 
          error: error.message || 'Unknown error occurred'
        });
      }
    })();
    return true;
  }
  
  if (request.type === 'EID_PD_READ_ALL') {
    (async () => {
      try {
        const result = await readAllReaders(request.options || {});
        sendResponse(result);
      } catch (error) {
        console.error('[EstEID-PD] Error reading from all readers:', error);
        sendResponse({ 
          ok: false, 
          error: error.message || 'Unknown error occurred'
        });
      }
    })();
    return true;
  }
  
  return false;
});

/**
 * Handle extension installation
 */
browserAPI.runtime.onInstalled.addListener((details) => {
  console.log('[EstEID-PD] Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    browserAPI.storage.local.set({ 
      installed: true, 
      installDate: Date.now(),
      version: browserAPI.runtime.getManifest().version
    });
  } else if (details.reason === 'update') {
    const newVersion = browserAPI.runtime.getManifest().version;
    console.log('[EstEID-PD] Updated to version:', newVersion);
    clearCache();
  }
});

/**
 * Handle browser startup
 */
browserAPI.runtime.onStartup.addListener(() => {
  console.log('[EstEID-PD] Browser started, clearing cache');
  clearCache();
});

console.log('[EstEID-PD] Firefox background script initialized');

