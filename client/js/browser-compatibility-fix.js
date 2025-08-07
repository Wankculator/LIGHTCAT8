// This file requires memory-safe-events.js to be loaded first
/**
 * Browser Compatibility Fix for RGBLightCat Game
 * Handles cross-browser issues with module loading, WebGL, and importmaps
 */

(function() {
    'use strict';
    
    console.log('[BrowserCompat] Initializing browser compatibility checks...');
    
    // Detect browser
    const ua = navigator.userAgent.toLowerCase();
    const browserInfo = {
        isChrome: /chrome/.test(ua) && !/edge/.test(ua),
        isFirefox: /firefox/.test(ua),
        isSafari: /safari/.test(ua) && !/chrome/.test(ua),
        isEdge: /edge/.test(ua),
        isIE: /msie|trident/.test(ua),
        isMobile: /iphone|ipad|ipod|android/i.test(ua)
    };
    
    console.log('[BrowserCompat] Browser detected:', browserInfo);
    
    // Check WebGL support
    function checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) {
                throw new Error('WebGL not supported');
            }
            return true;
        } catch (e) {
            console.error('[BrowserCompat] WebGL check failed:', e);
            return false;
        }
    }
    
    // Check ES Module support
    function checkESModuleSupport() {
        try {
            (() => { try { return typeof import === "function"; } catch (e) { return false; } })()'import("")');
            return true;
        } catch (e) {
            return false;
        }
    }
    
    // Check Import Map support
    function checkImportMapSupport() {
        const script = document.createElement('script');
        return 'importmap' in script || HTMLScriptElement.supports?.('importmap');
    }
    
    // Add polyfill for older browsers
    function addModulePolyfills() {
        if (!checkImportMapSupport()) {
            console.log('[BrowserCompat] Import maps not supported, adding polyfill...');
            
            // Force es-module-shims to polyfill mode
            window.esmsInitOptions = {
                shimMode: true,
                fetch: function(url) {
                    // Add cache-busting for module loads
                    const bustUrl = url.includes('?') ? 
                        url + '&_t=' + Date.now() : 
                        url + '?_t=' + Date.now();
                    return fetch(bustUrl);
                }
            };
        }
    }
    
    // Fix Safari-specific issues
    function fixSafariIssues() {
        if (browserInfo.isSafari) {
            console.log('[BrowserCompat] Applying Safari fixes...');
            
            // Safari needs explicit WebGL context attributes
            window.safariWebGLFix = {
                alpha: false,
                antialias: true,
                preserveDrawingBuffer: true,
                powerPreference: 'high-performance'
            };
            
            // Fix Safari module loading timing
            window.SafeEvents.on(window, 'load', function() {
                setTimeout(function() {
                    if (window.game && !window.game.proGame) {
                        console.log('[BrowserCompat] Safari: Retrying game initialization...');
                        window.location.reload();
                    }
                }, 3000);
            });
        }
    }
    
    // Fix Firefox-specific issues
    function fixFirefoxIssues() {
        if (browserInfo.isFirefox) {
            console.log('[BrowserCompat] Applying Firefox fixes...');
            
            // Firefox sometimes has issues with module loading order
            window.SafeEvents.on(document, 'DOMContentLoaded', function() {
                const scripts = document.querySelectorAll('script[type="module"]');
                scripts.forEach(script => {
                    script.async = false;
                });
            });
        }
    }
    
    // Show compatibility error
    function showCompatibilityError(message) {
        const loadingProgress = document.getElementById('loading-progress');
        const loadingText = document.getElementById('loading-text');
        
        if (loadingProgress) {
            loadingProgress.style.display = 'flex';
        }
        
        if (loadingText) {
            loadingText.innerHTML = `
                <div style="color: #ff5252; text-align: center; padding: 20px;">
                    <h3>Browser Compatibility Issue</h3>
                    <p>${message}</p>
                    <p style="margin-top: 10px;">Please try:</p>
                    <ul style="text-align: left; display: inline-block;">
                        <li>Using Chrome, Firefox, or Safari (latest versions)</li>
                        <li>Updating your browser to the latest version</li>
                        <li>Enabling WebGL in your browser settings</li>
                        <li>Disabling browser extensions that might interfere</li>
                    </ul>
                </div>
            `;
        }
    }
    
    // Clear browser cache for modules
    function clearModuleCache() {
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    if (name.includes('module') || name.includes('three')) {
                        caches.delete(name);
                        console.log('[BrowserCompat] Cleared cache:', name);
                    }
                });
            });
        }
    }
    
    // Main compatibility check
    function runCompatibilityChecks() {
        console.log('[BrowserCompat] Running compatibility checks...');
        
        // Check WebGL
        if (!checkWebGLSupport()) {
            showCompatibilityError('WebGL is not supported in your browser.');
            return false;
        }
        
        // Check ES Modules
        if (!checkESModuleSupport()) {
            console.warn('[BrowserCompat] ES Modules not supported natively');
            // Will rely on es-module-shims
        }
        
        // Add polyfills
        addModulePolyfills();
        
        // Apply browser-specific fixes
        fixSafariIssues();
        fixFirefoxIssues();
        
        // Clear old module cache
        clearModuleCache();
        
        // Add error handler for module loading
        window.SafeEvents.on(window, 'error', function(e) {
            if (e.message && (e.message.includes('import') || e.message.includes('module'))) {
                console.error('[BrowserCompat] Module loading error:', e);
                
                // Try fallback loading
                setTimeout(function() {
                    if (!window.game || !window.game.proGame) {
                        console.log('[BrowserCompat] Attempting fallback load...');
                        
                        // Force reload with cache clear
                        if (window.location.href.includes('?')) {
                            window.location.href = window.location.href + '&_cb=' + Date.now();
                        } else {
                            window.location.href = window.location.href + '?_cb=' + Date.now();
                        }
                    }
                }, 2000);
            }
        });
        
        return true;
    }
    
    // Run checks immediately
    const isCompatible = runCompatibilityChecks();
    
    // Export for other scripts
    window.browserCompat = {
        info: browserInfo,
        isCompatible: isCompatible,
        checkWebGL: checkWebGLSupport,
        checkModules: checkESModuleSupport
    };
    
})();