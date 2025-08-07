// This file requires memory-safe-events.js to be loaded first
/**
 * Enhanced Game Loader with Multiple Fallback Strategies
 * Ensures game loads across all browsers
 */

(function() {
    'use strict';
    
    console.log('[EnhancedLoader] Initializing enhanced game loader...');
    
    // Configuration
    const CONFIG = {
        maxLoadTime: 10000, // 10 seconds max load time
        retryAttempts: 3,
        retryDelay: 2000,
        cdnFallbacks: [
            'https://unpkg.com/three@0.160.0/build/three.module.js',
            'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js',
            'https://cdnjs.cloudflare.com/ajax/libs/three.js/r160/three.module.js'
        ]
    };
    
    let loadStartTime = Date.now();
    let currentAttempt = 0;
    
    // Enhanced browser detection
    function getBrowserInfo() {
        const ua = navigator.userAgent;
        const info = {
            name: 'Unknown',
            version: '',
            isMobile: /iPhone|iPad|iPod|Android/i.test(ua),
            hasModuleSupport: 'noModule' in document.createElement('script'),
            hasImportMapSupport: HTMLScriptElement.supports?.('importmap') || false
        };
        
        // Detailed browser detection
        if (ua.includes('Chrome/')) {
            info.name = 'Chrome';
            info.version = ua.match(/Chrome\/(\d+)/)?.[1] || '';
        } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
            info.name = 'Safari';
            info.version = ua.match(/Version\/(\d+)/)?.[1] || '';
        } else if (ua.includes('Firefox/')) {
            info.name = 'Firefox';
            info.version = ua.match(/Firefox\/(\d+)/)?.[1] || '';
        } else if (ua.includes('Edge/')) {
            info.name = 'Edge';
            info.version = ua.match(/Edge\/(\d+)/)?.[1] || '';
        }
        
        return info;
    }
    
    const browserInfo = getBrowserInfo();
    console.log('[EnhancedLoader] Browser:', browserInfo);
    
    // Monitor game loading progress
    function monitorGameLoading() {
        const checkInterval = setInterval(() => {
            const elapsed = Date.now() - loadStartTime;
            
            // Check if game loaded successfully
            if (window.game && window.game.proGame && window.game.proGame.renderer) {
                console.log('[EnhancedLoader] Game loaded successfully!');
                clearInterval(checkInterval);
                hideLoadingScreen();
                return;
            }
            
            // Check if loading is stuck
            const loadingProgress = document.getElementById('loading-progress');
            const loadingText = document.getElementById('loading-text');
            
            if (elapsed > CONFIG.maxLoadTime) {
                clearInterval(checkInterval);
                console.warn('[EnhancedLoader] Load timeout reached, attempting recovery...');
                attemptRecovery();
            } else if (loadingProgress && loadingText) {
                // Update loading text with progress
                const progress = Math.min(90, Math.floor((elapsed / CONFIG.maxLoadTime) * 90));
                loadingText.textContent = `Loading... ${progress}%`;
            }
        }, 500);
    }
    
    // Attempt recovery strategies
    function attemptRecovery() {
        currentAttempt++;
        
        if (currentAttempt > CONFIG.retryAttempts) {
            showFinalError();
            return;
        }
        
        console.log(`[EnhancedLoader] Recovery attempt ${currentAttempt}/${CONFIG.retryAttempts}`);
        
        const loadingText = document.getElementById('loading-text');
        if (loadingText) {
            loadingText.textContent = `Retrying... (Attempt ${currentAttempt})`;
        }
        
        // Strategy 1: Try different CDN
        if (currentAttempt <= CONFIG.cdnFallbacks.length) {
            tryAlternativeCDN(currentAttempt - 1);
        } else {
            // Strategy 2: Force reload with cache bust
            forceReloadWithCacheBust();
        }
    }
    
    // Try alternative CDN for Three.js
    function tryAlternativeCDN(index) {
        const newCDN = CONFIG.cdnFallbacks[index];
        console.log('[EnhancedLoader] Trying alternative CDN:', newCDN);
        
        // Update import map
        const importMapScript = document.querySelector('script[type="importmap"]');
        if (importMapScript) {
            const importMap = {
                imports: {
                    "three": newCDN,
                    "three/addons/": newCDN.replace('/three.module.js', '/examples/jsm/')
                }
            };
            
            // Create new import map
            const newScript = document.createElement('script');
            newScript.type = 'importmap';
            newScript.textContent = JSON.stringify(importMap);
            importMapScript.replaceWith(newScript);
        }
        
        // Reload main game module
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
    
    // Force reload with cache bust
    function forceReloadWithCacheBust() {
        console.log('[EnhancedLoader] Force reloading with cache bust...');
        const url = new URL(window.location.href);
        url.searchParams.set('_cb', Date.now());
        window.location.href = url.toString();
    }
    
    // Hide loading screen
    function hideLoadingScreen() {
        const loadingProgress = document.getElementById('loading-progress');
        const gameUI = document.getElementById('game-ui');
        
        if (loadingProgress) {
            loadingProgress.style.display = 'none';
        }
        
        if (gameUI) {
            gameUI.style.display = 'flex';
        }
    }
    
    // Show final error
    function showFinalError() {
        const loadingProgress = document.getElementById('loading-progress');
        const loadingText = document.getElementById('loading-text');
        
        if (loadingText) {
            loadingText.innerHTML = `
                <div style="text-align: center; color: #ff5252;">
                    <h3>Loading Failed</h3>
                    <p>Browser: ${browserInfo.name} ${browserInfo.version}</p>
                    <p style="margin: 15px 0;">Please try:</p>
                    <ul style="text-align: left; display: inline-block; margin: 10px 0;">
                        <li>Clear browser cache (Ctrl+Shift+Delete)</li>
                        <li>Disable ad blockers</li>
                        <li>Try Chrome or Firefox</li>
                        <li>Check internet connection</li>
                    </ul>
                    <button onclick="location.reload()" style="
                        margin-top: 20px;
                        padding: 10px 20px;
                        background: #FFFF00;
                        color: black;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                    ">Retry</button>
                    <button onclick="window.location.href='/'" style="
                        margin: 20px 0 0 10px;
                        padding: 10px 20px;
                        background: transparent;
                        color: #FFFF00;
                        border: 2px solid #FFFF00;
                        border-radius: 5px;
                        cursor: pointer;
                    ">Back to Home</button>
                </div>
            `;
        }
    }
    
    // Safari-specific fixes
    function applySafariFixes() {
        if (browserInfo.name === 'Safari') {
            console.log('[EnhancedLoader] Applying Safari-specific fixes...');
            
            // Safari needs explicit module preload
            const preloadLink = document.createElement('link');
            preloadLink.rel = 'modulepreload';
            preloadLink.href = 'https://unpkg.com/three@0.160.0/build/three.module.js';
            document.head.appendChild(preloadLink);
            
            // Safari WebGL context fix
            window.SafeEvents.on(window, 'load', () => {
                if (!window.game || !window.game.proGame) {
                    console.warn('[EnhancedLoader] Safari: Game not loaded, forcing initialization...');
                    // Force a reload after a delay
                    setTimeout(() => {
                        if (!window.game || !window.game.proGame) {
                            attemptRecovery();
                        }
                    }, 3000);
                }
            });
        }
    }
    
    // Firefox-specific fixes
    function applyFirefoxFixes() {
        if (browserInfo.name === 'Firefox') {
            console.log('[EnhancedLoader] Applying Firefox-specific fixes...');
            
            // Firefox sometimes needs explicit async=false for modules
            document.querySelectorAll('script[type="module"]').forEach(script => {
                script.async = false;
            });
        }
    }
    
    // Initialize enhanced loader
    function init() {
        console.log('[EnhancedLoader] Starting enhanced loading process...');
        
        // Apply browser-specific fixes
        applySafariFixes();
        applyFirefoxFixes();
        
        // Start monitoring
        monitorGameLoading();
        
        // Add global error handler
        window.SafeEvents.on(window, 'error', (e) => {
            if (e.message && (e.message.includes('Failed to fetch dynamically imported module') ||
                             e.message.includes('TypeError: Failed to fetch'))) {
                console.error('[EnhancedLoader] Module import error:', e.message);
                if (currentAttempt === 0) {
                    attemptRecovery();
                }
            }
        });
        
        // Add unhandled rejection handler
        window.SafeEvents.on(window, 'unhandledrejection', (e) => {
            if (e.reason && e.reason.message && e.reason.message.includes('import')) {
                console.error('[EnhancedLoader] Import rejection:', e.reason);
                if (currentAttempt === 0) {
                    attemptRecovery();
                }
            }
        });
    }
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        window.SafeEvents.on(document, 'DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Export for debugging
    window.enhancedLoader = {
        browserInfo: browserInfo, forceReload: forceReloadWithCacheBust,
        attemptRecovery: attemptRecovery
    };
    
})();