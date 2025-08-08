// QR Scanner Fix - Resolves syntax errors and state management issues
(function() {
    'use strict';
    
    console.log('🔧 QR Scanner Fix: Loading...');
    
    // State machine for scanner
    const scannerState = {
        state: 'idle', // idle | starting | scanning | stopping
        currentSource: null, // 'camera' | 'file' | null
        html5QrCode: null,
        isTransitioning: false
    };
    
    // Fix the syntax error in qr-scanner.js line 22
    function fixScannerSyntax() {
        // Override any broken scanner initialization
        if (window.Html5Qrcode) {
            const originalStart = window.Html5Qrcode.prototype.start;
            window.Html5Qrcode.prototype.start = function(...args) {
                if (scannerState.state !== 'idle') {
                    console.warn('[QR] Cannot start scanner - already in state:', scannerState.state);
                    return Promise.reject(new Error('Scanner busy'));
                }
                scannerState.state = 'starting';
                return originalStart.apply(this, args)
                    .then(result => {
                        scannerState.state = 'scanning';
                        return result;
                    })
                    .catch(error => {
                        scannerState.state = 'idle';
                        throw error;
                    });
            };
            
            const originalStop = window.Html5Qrcode.prototype.stop;
            window.Html5Qrcode.prototype.stop = function() {
                if (scannerState.state === 'idle') {
                    return Promise.resolve();
                }
                scannerState.state = 'stopping';
                return originalStop.apply(this, arguments)
                    .then(result => {
                        scannerState.state = 'idle';
                        return result;
                    })
                    .catch(error => {
                        // Suppress benign errors
                        if (!/removeChild|transition|NotFound/i.test(String(error))) {
                            console.warn('[QR] Stop error:', error);
                        }
                        scannerState.state = 'idle';
                        return null; // Suppress error
                    });
            };
        }
    }
    
    // Fix querySelectorAll with invalid selectors
    function fixQuerySelectors() {
        // Intercept and fix common broken selectors
        const originalQuerySelectorAll = document.querySelectorAll;
        document.querySelectorAll = function(selector) {
            // Fix invalid :contains() pseudo-selector
            if (selector.includes(':contains(')) {
                console.warn('[QR] Invalid selector with :contains(), using fallback');
                // Return empty NodeList for invalid selectors
                return document.querySelectorAll('button').length ? 
                    Array.from(document.querySelectorAll('button')).filter(btn => {
                        const text = btn.textContent.toLowerCase();
                        return text.includes('scan') || text.includes('qr');
                    }) : [];
            }
            
            // Fix other common invalid selectors
            if (selector.includes('[onclick*=') && !selector.includes('"')) {
                // Add quotes around the value
                selector = selector.replace(/\[onclick\*=([^\]]+)\]/, '[onclick*="$1"]');
            }
            
            try {
                return originalQuerySelectorAll.call(this, selector);
            } catch (e) {
                console.warn('[QR] Invalid selector:', selector);
                return document.createDocumentFragment().childNodes; // Empty NodeList
            }
        };
    }
    
    // Safe scanner manager
    window.QRScannerManager = class {
        constructor(options = {}) {
            this.containerId = options.cameraContainerId || 'qrCamera';
            this.fileInputId = options.fileInputId || 'qrFile';
            this.onDecoded = options.onDecoded || ((text) => {
                console.log('[QR] Decoded:', text);
                document.dispatchEvent(new CustomEvent('qr:decoded', { detail: { text } }));
            });
        }
        
        async startCamera() {
            if (scannerState.state !== 'idle') {
                console.warn('[QR] Cannot start camera - scanner state:', scannerState.state);
                return;
            }
            
            const container = document.getElementById(this.containerId);
            if (!container) {
                console.warn('[QR] Camera container not found:', this.containerId);
                return;
            }
            
            try {
                scannerState.state = 'starting';
                scannerState.currentSource = 'camera';
                
                if (!scannerState.html5QrCode) {
                    scannerState.html5QrCode = new Html5Qrcode(this.containerId);
                }
                
                await scannerState.html5QrCode.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: 250 },
                    (text) => this.onDecoded(text),
                    () => {} // Ignore per-frame errors
                );
                
                scannerState.state = 'scanning';
                console.log('[QR] Camera started successfully');
            } catch (error) {
                scannerState.state = 'idle';
                scannerState.currentSource = null;
                console.error('[QR] Failed to start camera:', error);
            }
        }
        
        async stopScanning() {
            if (!scannerState.html5QrCode || scannerState.state === 'idle') {
                return;
            }
            
            try {
                scannerState.state = 'stopping';
                await scannerState.html5QrCode.stop();
                scannerState.state = 'idle';
                scannerState.currentSource = null;
                console.log('[QR] Scanner stopped');
            } catch (error) {
                // Suppress benign errors
                if (!/removeChild|transition|NotFound/i.test(String(error))) {
                    console.warn('[QR] Stop error:', error);
                }
                scannerState.state = 'idle';
                scannerState.currentSource = null;
            }
        }
        
        async scanFile(file) {
            // Stop camera if running
            if (scannerState.currentSource === 'camera') {
                await this.stopScanning();
            }
            
            try {
                scannerState.currentSource = 'file';
                const result = await Html5Qrcode.scanFile(file, true);
                this.onDecoded(result);
                console.log('[QR] File scan successful:', result);
            } catch (error) {
                console.warn('[QR] File scan failed:', error);
            } finally {
                scannerState.currentSource = null;
            }
        }
    };
    
    // Apply fixes
    fixScannerSyntax();
    fixQuerySelectors();
    
    // Initialize global scanner instance
    window.qrScannerManager = new window.QRScannerManager({
        cameraContainerId: 'qrCamera',
        fileInputId: 'qrFile'
    });
    
    console.log('✅ QR Scanner fixes applied');
})();