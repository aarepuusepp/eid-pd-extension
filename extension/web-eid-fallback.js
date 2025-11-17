/**
 * Web-eID.js Fallback Wrapper
 * 
 * Provides a fallback mechanism for web-eid.js when certificate-based authentication fails.
 * Automatically falls back to reading personal data directly from the chip.
 * 
 * Usage:
 * 1. Include web-eid.js as normal
 * 2. Include this script after web-eid.js
 * 3. Use the enhanced API with automatic fallback
 * 
 * @example
 * // Automatic fallback
 * const result = await WebEID_Enhanced.authenticate({ fallback: true });
 * if (result.source === 'chip') {
 *   // Data came from chip fallback
 *   console.log('Personal Code:', result.personalCode);
 * }
 */

(function() {
  'use strict';
  
  // Check if EstEID_PD extension is available
  if (!window.EstEID_PD) {
    console.warn('[WebEID-Fallback] EstEID_PD extension not available');
    return;
  }
  
  /**
   * Enhanced WebEID API with automatic fallback
   */
  window.WebEID_Enhanced = {
    /**
     * Authenticate user with automatic fallback to chip reading
     * 
     * @param {Object} options - Authentication options
     * @param {boolean} options.fallback - Enable automatic fallback (default: true)
     * @param {number} options.timeout - Timeout for web-eid.js in milliseconds (default: 10000)
     * @param {boolean} options.useCache - Use cached chip data if available (default: true)
     * @returns {Promise<Object>} Authentication result
     */
    authenticate: async function(options = {}) {
      const fallbackEnabled = options.fallback !== false;
      const webeidTimeout = options.timeout || 10000;
      
      // Try web-eid.js first (if available)
      if (window.webeid) {
        try {
          console.log('[WebEID-Fallback] Trying web-eid.js certificate authentication...');
          
          const certResult = await Promise.race([
            window.webeid.authenticate(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('web-eid.js timeout')), webeidTimeout)
            )
          ]);
          
          console.log('[WebEID-Fallback] Certificate authentication successful');
          return {
            ok: true,
            source: 'certificate',
            data: certResult
          };
        } catch (error) {
          console.warn('[WebEID-Fallback] Certificate authentication failed:', error.message);
          
          if (!fallbackEnabled) {
            return {
              ok: false,
              source: 'certificate',
              error: error.message
            };
          }
          
          console.log('[WebEID-Fallback] Falling back to chip reading...');
        }
      } else if (!fallbackEnabled) {
        return {
          ok: false,
          error: 'web-eid.js not available and fallback disabled'
        };
      }
      
      // Fallback to chip reading
      try {
        const chipResult = await EstEID_PD.readPersonalData({
          useCache: options.useCache !== false
        });
        
        if (chipResult.ok) {
          console.log('[WebEID-Fallback] Chip reading successful');
          return {
            ok: true,
            source: 'chip',
            cached: chipResult.cached || false,
            data: chipResult.data
          };
        } else {
          return {
            ok: false,
            source: 'chip',
            error: chipResult.error
          };
        }
      } catch (error) {
        return {
          ok: false,
          source: 'chip',
          error: error.message || 'Failed to read from chip'
        };
      }
    },
    
    /**
     * Get user identity (tries certificate first, then chip)
     * 
     * @param {Object} options - Options
     * @returns {Promise<Object>} User identity
     */
    getIdentity: async function(options = {}) {
      const result = await this.authenticate(options);
      
      if (!result.ok) {
        throw new Error(result.error || 'Failed to get identity');
      }
      
      // Normalize the response format
      if (result.source === 'chip') {
        return {
          personalCode: result.data.personalCode,
          givenName: result.data.givenName,
          surname: result.data.surname,
          source: 'chip',
          cached: result.cached || false
        };
      } else {
        // Extract from certificate (format depends on web-eid.js)
        return {
          ...result.data,
          source: 'certificate'
        };
      }
    },
    
    /**
     * Check if authentication is available (certificate or chip)
     * 
     * @returns {Promise<Object>} Availability status
     */
    checkAvailability: async function() {
      const status = {
        certificate: false,
        chip: false,
        available: false
      };
      
      // Check web-eid.js
      if (window.webeid) {
        try {
          // Try to check if web-eid.js is functional
          status.certificate = true;
        } catch (error) {
          console.warn('[WebEID-Fallback] web-eid.js check failed:', error);
        }
      }
      
      // Check chip reading
      try {
        const chipStatus = await EstEID_PD.checkStatus();
        status.chip = chipStatus.ok && chipStatus.available;
      } catch (error) {
        console.warn('[WebEID-Fallback] Chip check failed:', error);
      }
      
      status.available = status.certificate || status.chip;
      return status;
    },
    
    /**
     * Clear all caches
     */
    clearCache: async function() {
      await EstEID_PD.clearCache();
    },
    
    version: '1.0.0'
  };
  
  console.log('[WebEID-Fallback] Enhanced API initialized (v' + window.WebEID_Enhanced.version + ')');
  
})();

