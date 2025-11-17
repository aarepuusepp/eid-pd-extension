/**
 * Estonian ID Card Personal Data Reader - Background Service Worker
 * 
 * Handles communication between content scripts and the native helper application.
 * Uses Chrome Native Messaging API to read personal data from ID cards via PC/SC.
 */

const NATIVE_HOST = "ee.aarepuusepp.eid_pd_reader";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// In-memory cache for personal data (cleared on browser restart)
let cachedData = null;
let cacheTimestamp = null;

/**
 * Call the native helper application
 * @param {Object} message - Message to send to native helper
 * @returns {Promise<Object>} Response from native helper
 */
async function callNativeHelper(message) {
  return new Promise((resolve) => {
    console.log('[EstEID-PD] Calling native helper:', message);
    
    chrome.runtime.sendNativeMessage(NATIVE_HOST, message, (response) => {
      if (chrome.runtime.lastError) {
        const error = chrome.runtime.lastError.message;
        console.error('[EstEID-PD] Native messaging error:', error);
        
        // Provide helpful error messages
        let userMessage = error;
        if (error.includes('Specified native messaging host not found')) {
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
 * @param {Object} options - Reading options (fids, useCache, mode, can)
 * @returns {Promise<Object>} Personal data or error
 */
async function readPersonalData(options = {}) {
  // Check cache if requested (only for contact mode)
  if (options.mode !== 'nfc' && options.useCache !== false && cachedData && cacheTimestamp) {
    const age = Date.now() - cacheTimestamp;
    if (age < CACHE_DURATION) {
      console.log('[EstEID-PD] Returning cached data (age: ' + Math.round(age / 1000) + 's)');
      return { ...cachedData, cached: true, cacheAge: age };
    }
  }
  
  // Call native helper
  let message;
  if (options.mode === 'nfc') {
    // NFC mode with PACE
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
  } else {
    // Contact mode (default)
    message = {
      command: 'getPersonalData',
      fids: options.fids || {}
    };
  }
  
  const response = await callNativeHelper(message);
  
  // Handle card not found error with user-friendly message
  if (!response.ok && response.error && response.error.includes('CARD_NOT_FOUND')) {
    return {
      ok: false,
      error: 'Card not found! Please insert your ID card into the reader.',
      errorCode: 'CARD_NOT_FOUND'
    };
  }
  
  // Handle PACE-specific errors
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
  
  // Cache successful responses (only contact mode)
  if (options.mode !== 'nfc' && response.ok && response.data) {
    cachedData = response;
    cacheTimestamp = Date.now();
    console.log('[EstEID-PD] Data cached');
  }
  
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
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[EstEID-PD] Message received:', request.type, 'from', sender.tab?.url || 'popup');
  
  if (request.type === 'EID_PD_READ') {
    // Read personal data
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
    return true; // Keep message channel open for async response
  }
  
  if (request.type === 'EID_PD_CLEAR_CACHE') {
    // Clear cache
    clearCache();
    sendResponse({ ok: true });
    return false;
  }
  
  if (request.type === 'EID_PD_STATUS') {
    // Check if native helper is available
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
    // Read personal data via NFC
    (async () => {
      try {
        const result = await readPersonalData({ 
          mode: 'nfc', 
          can: request.can,
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
  
  return false;
});

/**
 * Handle extension installation
 */
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[EstEID-PD] Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    // First installation
    chrome.storage.local.set({ 
      installed: true, 
      installDate: Date.now(),
      version: chrome.runtime.getManifest().version
    });
    
    // Open welcome page (optional)
    // chrome.tabs.create({ url: 'welcome.html' });
  } else if (details.reason === 'update') {
    // Extension updated
    const newVersion = chrome.runtime.getManifest().version;
    console.log('[EstEID-PD] Updated to version:', newVersion);
    clearCache(); // Clear cache on update
  }
});

/**
 * Handle browser startup
 */
chrome.runtime.onStartup.addListener(() => {
  console.log('[EstEID-PD] Browser started, clearing cache');
  clearCache();
});

console.log('[EstEID-PD] Background service worker initialized');

