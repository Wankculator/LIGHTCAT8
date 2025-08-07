/**
 * Immediate Fix - Runs fixes without waiting for DOM
 */

// Fix 1: Mint percentage immediately
(function fixPercentageNow() {
    'use strict';
    
    function fix() {
        const progressText = document.getElementById('progressText');
        if (progressText) {
            const text = progressText.textContent.trim();
            if (text && !text.includes('%') && !text.includes('SOLD OUT')) {
                const match = text.match(/(\d+\.?\d*)/);
                if (match) {
                    progressText.textContent = `${match[1]}% SOLD`;
                    console.log('[Immediate Fix] Fixed percentage:', progressText.textContent);
                }
            }
        }
    }
    
    // Run multiple times
    fix();
    setTimeout(fix, 10);
    setTimeout(fix, 50);
    setTimeout(fix, 100);
    setTimeout(fix, 500);
    setTimeout(fix, 1000);
    setInterval(fix, 2000); // Keep checking
})();

// Fix 2: Scan button immediately  
(function fixScanButtonNow() {
    'use strict';
    
    function fix() {
        const scanBtn = document.getElementById('scanQRBtn');
        const modal = document.getElementById('qrScannerModal');
        
        if (scanBtn && !scanBtn.hasAttribute('data-fixed')) {
            scanBtn.setAttribute('data-fixed', 'true');
            
            scanBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('[Immediate Fix] Scan clicked');
                
                if (modal) {
                    modal.style.display = 'flex';
                    modal.style.position = 'fixed';
                    modal.style.top = '0';
                    modal.style.left = '0';
                    modal.style.width = '100%';
                    modal.style.height = '100%';
                    modal.style.alignItems = 'center';
                    modal.style.justifyContent = 'center';
                    modal.style.zIndex = '100000';
                }
                
                // Try to open scanner
                if (window.lightcatQRScanner && window.lightcatQRScanner.open) {
                    window.lightcatQRScanner.open();
                } else {
                    console.log('[Immediate Fix] Scanner not ready, showing modal anyway');
                    // Initialize if possible
                    if (window.LightcatQRScanner) {
                        window.lightcatQRScanner = new window.LightcatQRScanner();
                        setTimeout(() => {
                            if (window.lightcatQRScanner && window.lightcatQRScanner.open) {
                                window.lightcatQRScanner.open();
                            }
                        }, 100);
                    }
                }
                
                return false;
            };
            
            console.log('[Immediate Fix] Scan button fixed');
        }
        
        // Fix close button
        const closeBtn = document.getElementById('closeQRScanner');
        if (closeBtn && modal && !closeBtn.hasAttribute('data-fixed')) {
            closeBtn.setAttribute('data-fixed', 'true');
            
            closeBtn.onclick = function(e) {
                e.preventDefault();
                modal.style.display = 'none';
                if (window.lightcatQRScanner && window.lightcatQRScanner.close) {
                    window.lightcatQRScanner.close();
                }
                return false;
            };
        }
    }
    
    // Run multiple times
    fix();
    setTimeout(fix, 10);
    setTimeout(fix, 50);
    setTimeout(fix, 100);
    setTimeout(fix, 500);
    setTimeout(fix, 1000);
    setTimeout(fix, 2000);
    setInterval(fix, 3000); // Keep checking
})();

// Fix 3: Remove duplicate RGB Invoice labels
(function removeDuplicateLabels() {
    'use strict';
    
    function fix() {
        // Find all labels that contain "RGB Invoice" text
        const labels = Array.from(document.querySelectorAll('label')).filter(l => 
            l.textContent.includes('RGB Invoice') || l.textContent.includes('RGB INVOICE')
        );
        
        // If more than one found, keep first and remove others
        if (labels.length > 1) {
            console.log('[Immediate Fix] Found', labels.length, 'RGB Invoice labels, removing duplicates');
            for (let i = 1; i < labels.length; i++) {
                labels[i].remove();
            }
        }
    }
    
    // Run multiple times
    fix();
    setTimeout(fix, 10);
    setTimeout(fix, 50);
    setTimeout(fix, 100);
    setTimeout(fix, 500);
    setTimeout(fix, 1000);
    setTimeout(fix, 2000);
    setInterval(fix, 3000); // Keep checking
})();

console.log('[Immediate Fix] Applied');