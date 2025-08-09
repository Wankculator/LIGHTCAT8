/**
 * SIMPLE QR BUTTON FIX - Just make the button open the modal
 */

(function() {
    'use strict';
    
    console.log('[QR-BUTTON-FIX] Fixing QR scanner button...');
    
    function fixQRButton() {
        const scanBtn = document.getElementById('scanQRBtn');
        const modal = document.getElementById('qrScannerModal');
        
        if (!scanBtn || !modal) {
            console.log('[QR-BUTTON-FIX] Elements not ready yet...');
            return false;
        }
        
        // Remove ALL existing handlers
        const newBtn = scanBtn.cloneNode(true);
        scanBtn.parentNode.replaceChild(newBtn, scanBtn);
        
        // Add simple click handler
        document.getElementById('scanQRBtn').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[QR-BUTTON-FIX] Opening QR modal...');
            document.getElementById('qrScannerModal').style.display = 'flex';
        });
        
        // Fix close button too
        const closeBtn = document.getElementById('closeQRScanner');
        if (closeBtn) {
            const newClose = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(newClose, closeBtn);
            
            document.getElementById('closeQRScanner').addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                document.getElementById('qrScannerModal').style.display = 'none';
            });
        }
        
        console.log('[QR-BUTTON-FIX] ✅ Button fixed!');
        return true;
    }
    
    // Try immediately
    fixQRButton();
    
    // Keep trying for 5 seconds
    let attempts = 0;
    const interval = setInterval(() => {
        attempts++;
        if (fixQRButton() || attempts > 50) {
            clearInterval(interval);
        }
    }, 100);
    
})();