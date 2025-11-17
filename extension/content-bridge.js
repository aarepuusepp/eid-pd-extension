/**
 * Estonian ID Card Personal Data Reader - Content Script Bridge
 * 
 * Bridges communication between the web page and the extension background script.
 * Injects the page API script and handles message passing.
 */

(function() {
  'use strict';
  
  console.log('[EstEID-PD Bridge] Content script loaded on:', window.location.href);
  
  // Inject the page API script into the page context
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('page-api.js');
  script.type = 'module';
  script.onload = function() {
    console.log('[EstEID-PD Bridge] Page API injected');
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
  
  /**
   * Handle messages from the web page
   */
  window.addEventListener('message', async (event) => {
    // Only accept messages from the same window
    if (event.source !== window) return;
    
    const message = event.data;
    if (!message || message.target !== 'ESTEID_PD_EXTENSION') return;
    
    console.log('[EstEID-PD Bridge] Message from page:', message.type);
    
    // Forward to background script
    if (message.type === 'READ_PERSONAL_DATA') {
      const options = message.options || {};
      
      // Determine message type based on mode
      let messageType = 'EID_PD_READ';
      let messagePayload = { options };
      
      if (options.mode === 'nfc') {
        messageType = 'EID_PD_READ_NFC';
        messagePayload = { can: options.can };
      }
      
      chrome.runtime.sendMessage(
        { 
          type: messageType,
          ...messagePayload
        },
        (response) => {
          // Send response back to page
          window.postMessage({
            target: 'ESTEID_PD_PAGE',
            type: 'READ_PERSONAL_DATA_RESPONSE',
            requestId: message.requestId,
            payload: response
          }, '*');
        }
      );
    } else if (message.type === 'CLEAR_CACHE') {
      chrome.runtime.sendMessage(
        { type: 'EID_PD_CLEAR_CACHE' },
        (response) => {
          window.postMessage({
            target: 'ESTEID_PD_PAGE',
            type: 'CLEAR_CACHE_RESPONSE',
            requestId: message.requestId,
            payload: response
          }, '*');
        }
      );
    } else if (message.type === 'CHECK_STATUS') {
      chrome.runtime.sendMessage(
        { type: 'EID_PD_STATUS' },
        (response) => {
          window.postMessage({
            target: 'ESTEID_PD_PAGE',
            type: 'CHECK_STATUS_RESPONSE',
            requestId: message.requestId,
            payload: response
          }, '*');
        }
      );
    }
  });
  
  // Notify page that extension is ready
  window.postMessage({
    target: 'ESTEID_PD_PAGE',
    type: 'EXTENSION_READY'
  }, '*');
  
})();

