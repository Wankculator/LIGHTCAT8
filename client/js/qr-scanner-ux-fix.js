/**
 * QR Scanner UX Improvements for LIGHTCAT
 * Adds loading states and better user feedback
 * Following CLAUDE.md UX requirements
 */

(function() {
    'use strict';
    
    // Wait for DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        enhanceQRScanner();
    }
    
    function enhanceQRScanner() {
        // Create loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'qr-loading-overlay';
        loadingOverlay.className = 'qr-loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="qr-loading-content">
                <div class="qr-loading-spinner"></div>
                <p class="qr-loading-text">Initializing camera...</p>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .qr-loading-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.9);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                backdrop-filter: blur(5px);
            }
            
            .qr-loading-content {
                text-align: center;
                color: #fff;
            }
            
            .qr-loading-spinner {
                width: 50px;
                height: 50px;
                border: 3px solid rgba(255, 246, 0, 0.3);
                border-top-color: #fff600;
                border-radius: 50%;
                animation: qr-spin 1s linear infinite;
                margin: 0 auto 20px;
            }
            
            @keyframes qr-spin {
                to { transform: rotate(360deg); }
            }
            
            .qr-loading-text {
                font-size: 1rem;
                color: #fff;
                margin: 0;
                font-family: 'Space Grotesk', sans-serif;
            }
            
            /* Enhance scanner UI */
            #qrReaderDiv {
                position: relative;
                min-height: 400px;
            }
            
            #qrReaderDiv video {
                border-radius: 15px;
                box-shadow: 0 5px 30px rgba(255, 246, 0, 0.3);
            }
            
            /* Scanner frame animation */
            .qr-scanner-frame {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 250px;
                height: 250px;
                border: 2px solid #fff600;
                border-radius: 15px;
                pointer-events: none;
                z-index: 100;
                animation: qr-pulse 2s ease-in-out infinite;
            }
            
            @keyframes qr-pulse {
                0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.05); }
            }
            
            /* Success animation */
            .qr-success-animation {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 100px;
                height: 100px;
                background: #4CAF50;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: qr-success 0.5s ease-out;
                z-index: 200;
            }
            
            .qr-success-animation::after {
                content: '✓';
                color: white;
                font-size: 50px;
                font-weight: bold;
            }
            
            @keyframes qr-success {
                0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
            
            /* Error shake animation */
            .qr-error-shake {
                animation: qr-shake 0.5s ease-in-out;
            }
            
            @keyframes qr-shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-10px); }
                75% { transform: translateX(10px); }
            }
            
            /* Enhanced buttons */
            .qr-action-button {
                position: relative;
                overflow: hidden;
            }
            
            .qr-action-button::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                transition: width 0.6s, height 0.6s;
            }
            
            .qr-action-button:active::after {
                width: 300px;
                height: 300px;
            }
            
            /* Mobile optimizations */
            @media (max-width: 768px) {
                .qr-scanner-frame {
                    width: 200px;
                    height: 200px;
                }
                
                #qrReaderDiv {
                    min-height: 300px;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Enhance existing scanner
        const scannerModal = document.getElementById('qrScannerModal');
        const readerDiv = document.getElementById('qrReaderDiv');
        const startBtn = document.getElementById('startScannerBtn');
        const uploadBtn = document.getElementById('uploadQRBtn');
        
        if (readerDiv) {
            readerDiv.appendChild(loadingOverlay);
            
            // Add scanner frame
            const scannerFrame = document.createElement('div');
            scannerFrame.className = 'qr-scanner-frame';
            readerDiv.appendChild(scannerFrame);
        }
        
        // Intercept scanner initialization
        if (startBtn) {
            const originalClick = startBtn.onclick;
            startBtn.onclick = async function(e) {
                // Show loading
                showLoading('Requesting camera access...');
                
                // Add button classes
                startBtn.classList.add('qr-action-button');
                
                try {
                    // Check camera permission first
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    stream.getTracks().forEach(track => track.stop());
                    
                    showLoading('Initializing scanner...');
                    
                    // Call original handler
                    if (originalClick) {
                        originalClick.call(this, e);
                    }
                    
                    // Hide loading after delay
                    setTimeout(() => {
                        hideLoading();
                    }, 1000);
                    
                } catch (error) {
                    hideLoading();
                    showError('Camera access denied. Please enable camera permissions.');
                }
            };
        }
        
        // Enhance upload button
        if (uploadBtn) {
            uploadBtn.classList.add('qr-action-button');
            
            // Add loading state for file upload
            const fileInput = document.getElementById('qrFileInput');
            if (fileInput) {
                fileInput.addEventListener('change', function() {
                    if (this.files && this.files[0]) {
                        showLoading('Processing QR code...');
                        setTimeout(() => {
                            hideLoading();
                        }, 1500);
                    }
                });
            }
        }
        
        // Helper functions
        function showLoading(text = 'Loading...') {
            const overlay = document.getElementById('qr-loading-overlay');
            const textEl = overlay.querySelector('.qr-loading-text');
            if (overlay) {
                overlay.style.display = 'flex';
                if (textEl) {
                    textEl.textContent = text;
                }
            }
        }
        
        function hideLoading() {
            const overlay = document.getElementById('qr-loading-overlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
        }
        
        function showError(message) {
            const modal = document.getElementById('qrScannerModal');
            if (modal) {
                modal.classList.add('qr-error-shake');
                setTimeout(() => {
                    modal.classList.remove('qr-error-shake');
                }, 500);
            }
            
            // Show error notification
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #f44336;
                color: white;
                padding: 15px 30px;
                border-radius: 5px;
                font-weight: 500;
                z-index: 10000;
                animation: slideDown 0.3s ease-out;
            `;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideUp 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
        
        // Add success animation on successful scan
        const originalOnScanSuccess = window.onScanSuccess;
        window.onScanSuccess = function(decodedText) {
            // Show success animation
            const successAnim = document.createElement('div');
            successAnim.className = 'qr-success-animation';
            readerDiv.appendChild(successAnim);
            
            // Haptic feedback on mobile
            if (navigator.vibrate) {
                navigator.vibrate(200);
            }
            
            setTimeout(() => {
                successAnim.remove();
            }, 1000);
            
            // Call original handler
            if (originalOnScanSuccess) {
                originalOnScanSuccess(decodedText);
            }
        };
        
        // Add animations CSS
        const animStyle = document.createElement('style');
        animStyle.textContent = `
            @keyframes slideDown {
                from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                to { transform: translateX(-50%) translateY(0); opacity: 1; }
            }
            
            @keyframes slideUp {
                from { transform: translateX(-50%) translateY(0); opacity: 1; }
                to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
            }
        `;
        document.head.appendChild(animStyle);
    }
    
    console.log('[QRScannerUX] Enhanced QR scanner with loading states and animations');
    
})();