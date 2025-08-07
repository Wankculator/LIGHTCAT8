/**
 * Mint Status & Scanner Fix - Fixes missing % and scan button functionality
 */
(function() {
    'use strict';
    
    console.log('[Mint Status & Scanner Fix] Initializing...');
    
    // 1. Fix the mint status percentage display
    function fixMintStatusPercentage() {
        const progressText = document.getElementById('progressText');
        if (progressText) {
            // Check if the text doesn't have % at the end
            const currentText = progressText.textContent.trim();
            if (currentText && !currentText.includes('%') && !currentText.includes('SOLD OUT')) {
                // Extract the number and add % properly
                const match = currentText.match(/(\d+\.?\d*)/);
                if (match) {
                    const percentage = match[1];
                    progressText.textContent = `${percentage}% SOLD`;
                    console.log('[Mint Status & Scanner Fix] Fixed percentage display:', progressText.textContent);
                }
            }
        }
    }
    
    // 2. Fix the scan QR button functionality
    function fixScanButton() {
        const scanBtn = document.getElementById('scanQRBtn');
        const modal = document.getElementById('qrScannerModal');
        
        if (scanBtn && modal) {
            // Remove any existing listeners to prevent duplicates
            const newScanBtn = scanBtn.cloneNode(true);
            scanBtn.parentNode.replaceChild(newScanBtn, scanBtn);
            
            // Add click event listener
            newScanBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('[Mint Status & Scanner Fix] Scan button clicked');
                
                // Show the modal
                modal.style.display = 'flex';
                
                // Initialize scanner if available
                if (window.lightcatQRScanner && typeof window.lightcatQRScanner.open === 'function') {
                    window.lightcatQRScanner.open();
                } else {
                    console.error('[Mint Status & Scanner Fix] QR Scanner not initialized');
                    
                    // Fallback: try to initialize it
                    if (window.LightcatQRScanner) {
                        window.lightcatQRScanner = new window.LightcatQRScanner();
                        setTimeout(() => {
                            if (window.lightcatQRScanner && typeof window.lightcatQRScanner.open === 'function') {
                                window.lightcatQRScanner.open();
                            }
                        }, 100);
                    }
                }
            });
            
            console.log('[Mint Status & Scanner Fix] Scan button event listener attached');
        } else {
            console.warn('[Mint Status & Scanner Fix] Scan button or modal not found');
        }
        
        // Also fix the close button
        const closeBtn = document.getElementById('closeQRScanner');
        if (closeBtn && modal) {
            const newCloseBtn = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
            
            newCloseBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('[Mint Status & Scanner Fix] Close button clicked');
                
                modal.style.display = 'none';
                
                if (window.lightcatQRScanner && typeof window.lightcatQRScanner.close === 'function') {
                    window.lightcatQRScanner.close();
                }
            });
        }
        
        // Close modal when clicking outside
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    modal.style.display = 'none';
                    if (window.lightcatQRScanner && typeof window.lightcatQRScanner.close === 'function') {
                        window.lightcatQRScanner.close();
                    }
                }
            });
        }
    }
    
    // 3. Monitor for dynamic updates to mint status
    function monitorMintStatus() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.target.id === 'progressText') {
                    fixMintStatusPercentage();
                }
            });
        });
        
        const progressText = document.getElementById('progressText');
        if (progressText) {
            observer.observe(progressText, {
                childList: true,
                characterData: true,
                subtree: true
            });
        }
    }
    
    // 4. Apply all fixes
    function applyFixes() {
        fixMintStatusPercentage();
        fixScanButton();
        monitorMintStatus();
    }
    
    // 5. Initialize when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyFixes);
    } else {
        applyFixes();
    }
    
    // Apply again after delays to catch async content
    setTimeout(applyFixes, 500);
    setTimeout(applyFixes, 1000);
    setTimeout(applyFixes, 2000);
    
    // Also listen for hash changes
    window.addEventListener('hashchange', () => {
        if (window.location.hash.includes('purchase')) {
            setTimeout(fixScanButton, 100);
        }
    });
    
    console.log('[Mint Status & Scanner Fix] Fix applied');
})();