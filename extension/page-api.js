/**
 * Estonian ID Card Personal Data Reader - Page API
 * 
 * Provides a simple JavaScript API for web pages to read personal data from Estonian ID cards.
 * This script is injected into the page context and communicates with the extension via postMessage.
 * 
 * @example
 * // Check if extension is available
 * if (window.EstEID_PD) {
 *   // Read personal data
 *   const result = await EstEID_PD.readPersonalData();
 *   if (result.ok) {
 *     console.log('Name:', result.data.givenName, result.data.surname);
 *     console.log('Personal Code:', result.data.personalCode);
 *   }
 * }
 */

(function() {
  'use strict';
  
  // Check if already initialized
  if (window.EstEID_PD) {
    console.warn('[EstEID-PD] API already initialized');
    return;
  }
  
  let requestIdCounter = 0;
  const pendingRequests = new Map();
  let extensionReady = false;
  const readyCallbacks = [];
  
  /**
   * Wait for extension to be ready
   */
  function waitForExtension() {
    return new Promise((resolve) => {
      if (extensionReady) {
        resolve();
      } else {
        readyCallbacks.push(resolve);
      }
    });
  }
  
  /**
   * Send message to extension and wait for response
   */
  function sendMessage(type, options = {}) {
    return new Promise(async (resolve, reject) => {
      await waitForExtension();
      
      const requestId = ++requestIdCounter;
      const timeout = options.timeout || 30000; // 30 seconds default
      
      // Set up timeout
      const timeoutId = setTimeout(() => {
        pendingRequests.delete(requestId);
        reject(new Error('Request timeout: No response from extension'));
      }, timeout);
      
      // Store pending request
      pendingRequests.set(requestId, { resolve, reject, timeoutId });
      
      // Send message to content script
      window.postMessage({
        target: 'ESTEID_PD_EXTENSION',
        type: type,
        requestId: requestId,
        options: options
      }, '*');
    });
  }
  
  /**
   * Handle messages from extension
   */
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    
    const message = event.data;
    if (!message || message.target !== 'ESTEID_PD_PAGE') return;
    
    // Handle extension ready
    if (message.type === 'EXTENSION_READY') {
      console.log('[EstEID-PD] Extension is ready');
      extensionReady = true;
      readyCallbacks.forEach(cb => cb());
      readyCallbacks.length = 0;
      return;
    }
    
    // Handle responses
    const requestId = message.requestId;
    if (!requestId || !pendingRequests.has(requestId)) return;
    
    const { resolve, reject, timeoutId } = pendingRequests.get(requestId);
    clearTimeout(timeoutId);
    pendingRequests.delete(requestId);
    
    if (message.type === 'READ_PERSONAL_DATA_RESPONSE') {
      resolve(message.payload);
    } else if (message.type === 'READ_ALL_READERS_RESPONSE') {
      resolve(message.payload);
    } else if (message.type === 'CLEAR_CACHE_RESPONSE') {
      resolve(message.payload);
    } else if (message.type === 'CHECK_STATUS_RESPONSE') {
      resolve(message.payload);
    } else {
      reject(new Error('Unknown response type: ' + message.type));
    }
  });
  
  /**
   * Estonian ID Card Personal Data API
   */
  window.EstEID_PD = {
    /**
     * Read personal data from Estonian ID card
     * 
     * @param {Object} options - Reading options
     * @param {string} options.mode - Reading mode: 'contact' (default) or 'nfc'
     * @param {string} options.can - Card Access Number (required for NFC mode)
     * @param {Object} options.fids - Optional custom FID mapping (contact mode only)
     * @param {boolean} options.useCache - Use cached data if available (default: true, contact mode only)
     * @param {number} options.timeout - Request timeout in milliseconds (default: 30000)
     * @returns {Promise<Object>} Personal data object
     * 
     * @example
     * // Contact mode (default)
     * const result = await EstEID_PD.readPersonalData();
     * 
     * // NFC mode
     * const result = await EstEID_PD.readPersonalData({ mode: 'nfc', can: '123456' });
     * 
     * if (result.ok) {
     *   console.log('Surname:', result.data.surname);
     *   console.log('Given Name:', result.data.givenName);
     *   console.log('Personal Code:', result.data.personalCode);
     *   console.log('Document Number:', result.data.documentNr);
     * } else {
     *   console.error('Error:', result.error);
     * }
     */
    readPersonalData: async function(options = {}) {
      try {
        return await sendMessage('READ_PERSONAL_DATA', options);
      } catch (error) {
        return {
          ok: false,
          error: error.message || 'Failed to read personal data'
        };
      }
    },
    
    /**
     * Read personal data from all available card readers
     * 
     * @param {Object} options - Reading options
     * @param {Object} options.fids - Optional custom FID mapping
     * @param {number} options.timeout - Request timeout in milliseconds (default: 60000)
     * @returns {Promise<Object>} Multi-reader results
     * 
     * @example
     * const result = await EstEID_PD.readAllReaders();
     * if (result.ok) {
     *   result.results.forEach(r => {
     *     console.log(r.reader, r.data?.personalCode || r.error);
     *   });
     * }
     */
    readAllReaders: async function(options = {}) {
      try {
        return await sendMessage('READ_ALL_READERS', { 
          ...options, 
          timeout: options.timeout || 60000 
        });
      } catch (error) {
        return {
          ok: false,
          error: error.message || 'Failed to read from all readers'
        };
      }
    },
    
    /**
     * Read personal data from Estonian ID card (convenience wrapper)
     * Alias for readPersonalData with backward compatibility
     * 
     * @deprecated Use readPersonalData instead
     */
    readCard: async function(options = {}) {
      return this.readPersonalData(options);
    },
    
    /**
     * Clear cached personal data
     * 
     * @returns {Promise<Object>} Success status
     * 
     * @example
     * await EstEID_PD.clearCache();
     */
    clearCache: async function() {
      try {
        return await sendMessage('CLEAR_CACHE');
      } catch (error) {
        return {
          ok: false,
          error: error.message || 'Failed to clear cache'
        };
      }
    },
    
    /**
     * Check if extension and native helper are available
     * 
     * @returns {Promise<Object>} Status information
     * 
     * @example
     * const status = await EstEID_PD.checkStatus();
     * if (status.ok && status.available) {
     *   console.log('Extension is ready to use');
     * }
     */
    checkStatus: async function() {
      try {
        return await sendMessage('CHECK_STATUS');
      } catch (error) {
        return {
          ok: false,
          available: false,
          error: error.message || 'Failed to check status'
        };
      }
    },
    
    /**
     * Check if extension is available
     * 
     * @returns {boolean} True if extension is loaded
     */
    isAvailable: function() {
      return extensionReady;
    },
    
    /**
     * Version of the API
     */
    version: '1.0.3'
  };
  
  console.log('[EstEID-PD] Page API initialized (v' + window.EstEID_PD.version + ')');
  
  // Dispatch event for frameworks that need it
  window.dispatchEvent(new CustomEvent('esteid-pd-ready', {
    detail: { version: window.EstEID_PD.version }
  }));
  
})();

