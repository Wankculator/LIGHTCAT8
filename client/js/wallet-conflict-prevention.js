// This file requires memory-safe-events.js to be loaded first
/**
 * Wallet Extension Conflict Prevention
 * Prevents crypto wallet extensions from interfering with the game
 */

(function() {
    'use strict';
    
    console.log('[WalletConflict] Initializing wallet conflict prevention...');
    
    // Store original window properties before wallets inject
    const originalWindow = {
        ethereum: window.ethereum,
        solana: window.solana,
        phantom: window.phantom,
        BitcoinProvider: window.BitcoinProvider
    };
    
    // List of known wallet properties that cause conflicts
    const walletProperties = [
        'ethereum',
        'solana',
        'phantom',
        'BitcoinProvider',
        'tronWeb',
        'tronLink',
        'okxwallet',
        'coin98',
        'rabby',
        'metamask'
    ];
    
    // Prevent wallet extensions from redefining properties
    function preventWalletInjection() {
        walletProperties.forEach(prop => {
            try {
                Object.defineProperty(window, prop, {
                    get: function() {
                        // Return undefined for wallet properties to prevent conflicts
                        return undefined;
                    },
                    set: function(value) {
                        // Silently ignore wallet injection attempts
                        console.log(`[WalletConflict] Blocked ${prop} injection attempt`);
                        return false;
                    },
                    configurable: false,
                    enumerable: false
                });
            } catch (e) {
                // Property may already be defined, ignore
            }
        });
    }
    
    // Remove injected wallet scripts
    function removeWalletScripts() {
        // Remove scripts from known wallet extensions
        const walletScriptPatterns = [
            'inpage.js',
            'inject.js',
            'evmAsk.js',
            'inapp.js',
            'content-script.js',
            'ethereum-provider.js',
            'solana-provider.js'
        ];
        
        document.querySelectorAll('script').forEach(script => {
            const src = script.src || '';
            if (walletScriptPatterns.some(pattern => src.includes(pattern))) {
                console.log('[WalletConflict] Removing wallet script:', src);
                script.remove();
            }
        });
    }
    
    // Block wallet postMessage communications
    function blockWalletMessages() {
        const originalPostMessage = window.postMessage;
        
        window.postMessage = function(message, targetOrigin, transfer) {
            // Check if message is from wallet extension
            if (typeof message === 'object' && message !== null) {
                const messageStr = JSON.stringify(message);
                const walletPatterns = [
                    'metamask',
                    'ethereum',
                    'phantom',
                    'solana',
                    'wallet',
                    'web3',
                    'crypto'
                ];
                
                if (walletPatterns.some(pattern => messageStr.toLowerCase().includes(pattern))) {
                    console.log('[WalletConflict] Blocked wallet postMessage');
                    return;
                }
            }
            
            // Allow non-wallet messages
            return originalPostMessage.apply(window, arguments);
        };
    }
    
    // Clean up wallet-related console errors
    function suppressWalletErrors() {
        const originalError = console.error;
        const originalWarn = console.warn;
        
        console.error = function() {
            const args = Array.from(arguments);
            const errorStr = args.join(' ').toLowerCase();
            
            // Suppress wallet-related errors
            const walletErrorPatterns = [
                'ethereum',
                'metamask',
                'phantom',
                'solana',
                'bitcoinprovider',
                'failed to connect',
                'wallet',
                'web3',
                'multiplex'
            ];
            
            if (walletErrorPatterns.some(pattern => errorStr.includes(pattern))) {
                // Silently ignore wallet errors
                return;
            }
            
            // Allow other errors
            return originalError.apply(console, arguments);
        };
        
        console.warn = function() {
            const args = Array.from(arguments);
            const warnStr = args.join(' ').toLowerCase();
            
            // Suppress wallet-related warnings
            if (warnStr.includes('could not assign') || 
                warnStr.includes('wallet') || 
                warnStr.includes('provider')) {
                return;
            }
            
            // Allow other warnings
            return originalWarn.apply(console, arguments);
        };
    }
    
    // Initialize conflict prevention
    function init() {
        console.log('[WalletConflict] Applying conflict prevention measures...');
        
        // Apply all prevention measures
        preventWalletInjection();
        removeWalletScripts();
        blockWalletMessages();
        suppressWalletErrors();
        
        // Monitor for new wallet injection attempts
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.tagName === 'SCRIPT' && node.src) {
                            const src = node.src.toLowerCase();
                            if (src.includes('wallet') || 
                                src.includes('ethereum') || 
                                src.includes('metamask') ||
                                src.includes('phantom')) {
                                console.log('[WalletConflict] Blocking new wallet script:', src);
                                node.remove();
                            }
                        }
                    });
                }
            });
        });
        
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
        
        console.log('[WalletConflict] Wallet conflict prevention active');
    }
    
    // Initialize immediately
    init();
    
    // Also initialize on DOMContentLoaded
    if (document.readyState === 'loading') {
        window.SafeEvents.on(document, 'DOMContentLoaded', init);
    }
    
    // Export for debugging
    window.walletConflictPrevention = {
        active: true, reapply: init,
        restore: function() {
            // Restore original window properties if needed
            Object.keys(originalWindow).forEach(key => {
                if (originalWindow[key] !== undefined) {
                    try {
                        window[key] = originalWindow[key];
                    } catch (e) {
                        // Ignore if property is non-configurable
                    }
                }
            });
        }
    };
    
})();