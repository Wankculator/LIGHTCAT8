/**
 * QR Scanner Lazy Loading Fix
 * Only initializes QR scanner when actually needed
 */

(function() {
    'use strict';
    
    let scannerInstance = null;
    let scannerInitialized = false;
    
    /**
     * Lazy load QR scanner library
     */
    async function loadQRScannerLibrary() {
        if (window.Html5Qrcode) {
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    /**
     * Initialize scanner only when needed
     */
    async function initializeScanner() {
        if (scannerInitialized) {
            return scannerInstance;
        }
        
        try {
            // Load library first
            await loadQRScannerLibrary();
            
            // Create scanner instance
            const scannerId = 'qr-reader' + Date.now();
            const scannerDiv = document.createElement('div');
            scannerDiv.id = scannerId;
            
            scannerInstance = new Html5Qrcode(scannerId);
            scannerInitialized = true;
            
            console.log('QR Scanner initialized');
            return scannerInstance;
        } catch (error) {
            console.error('Failed to initialize QR scanner:', error);
            throw error;
        }
    }
    
    /**
     * Clean up scanner
     */
    async function cleanupScanner() {
        if (scannerInstance) {
            try {
                await scannerInstance.stop();
                scannerInstance.clear();
                scannerInstance = null;
                scannerInitialized = false;
                console.log('QR Scanner cleaned up');
            } catch (error) {
                console.error('Error cleaning up scanner:', error);
            }
        }
    }
    
    /**
     * Override scanner initialization
     */
    function overrideScannerInit() {
        // Find and override existing scanner init functions
        const scannerButtons = document.querySelectorAll('[onclick*="scan"], [onclick*="QR"], button:contains("Scan")');
        
        scannerButtons.forEach(button => {
            const originalOnClick = button.onclick;
            
            button.onclick = async function(e) {
                e.preventDefault();
                
                try {
                    // Show loading state
                    const originalText = button.innerHTML;
                    button.innerHTML = 'Loading scanner...';
                    button.disabled = true;
                    
                    // Initialize scanner
                    await initializeScanner();
                    
                    // Restore button
                    button.innerHTML = originalText;
                    button.disabled = false;
                    
                    // Call original function if exists
                    if (originalOnClick) {
                        return originalOnClick.call(this, e);
                    }
                } catch (error) {
                    console.error('Scanner initialization failed:', error);
                    button.innerHTML = 'Scanner failed';
                    setTimeout(() => {
                        button.innerHTML = originalText;
                        button.disabled = false;
                    }, 3000);
                }
            };
        });
    }
    
    /**
     * Auto cleanup on modal close
     */
    function setupAutoCleanup() {
        const modals = document.querySelectorAll('.modal, [id*="Modal"]');
        
        modals.forEach(modal => {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        const display = window.getComputedStyle(modal).display;
                        if (display === 'none') {
                            cleanupScanner();
                        }
                    }
                });
            });
            
            observer.observe(modal, { attributes: true });
        });
    }
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            overrideScannerInit();
            setupAutoCleanup();
        });
    } else {
        overrideScannerInit();
        setupAutoCleanup();
    }
    
    // Public API
    window.qrScannerLazy = {
        initialize: initializeScanner,
        cleanup: cleanupScanner,
        isInitialized: () => scannerInitialized
    };
    
    console.log('✅ QR Scanner lazy loading initialized');
})();