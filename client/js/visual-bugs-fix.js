/**
 * Visual Bugs Fix - Fixes duplicate labels, tier messages, and other visual issues
 */
(function() {
    'use strict';
    
    console.log('[Visual Bugs Fix] Initializing comprehensive visual fixes...');
    
    // 1. Fix duplicate RGB Invoice labels
    function fixDuplicateLabels() {
        const labels = document.querySelectorAll('label[for="rgbInvoice"]');
        if (labels.length > 1) {
            console.log('[Visual Bugs Fix] Found duplicate RGB Invoice labels, removing extras');
            // Keep only the first label
            for (let i = 1; i < labels.length; i++) {
                labels[i].remove();
            }
        }
    }
    
    // 2. Fix duplicate tier unlock messages
    function fixDuplicateTierMessages() {
        // Remove duplicate tier success messages
        const tierMessages = document.querySelectorAll('#tier-success-message, #tier-unlock-message, #unlocked-tier-display');
        if (tierMessages.length > 1) {
            console.log('[Visual Bugs Fix] Found duplicate tier messages, keeping only one');
            // Keep the first one, remove others
            for (let i = 1; i < tierMessages.length; i++) {
                tierMessages[i].remove();
            }
        }
    }
    
    // 3. Fix transparent button backgrounds
    function fixTransparentButtons() {
        // Fix game over buttons
        const gameOverButtons = document.querySelectorAll('#game-over .go-btn, #unlock-tier, #play-again, #verify-follow');
        gameOverButtons.forEach(btn => {
            const text = btn.textContent.toLowerCase();
            
            // Skip if button already has proper background
            const currentBg = window.getComputedStyle(btn).backgroundColor;
            if (currentBg && currentBg !== 'transparent' && currentBg !== 'rgba(0, 0, 0, 0)') {
                return;
            }
            
            // Apply appropriate background based on button type
            if (btn.id === 'unlock-tier' || text.includes('claim')) {
                btn.style.background = 'var(--primary-yellow, #FFFF00)';
                btn.style.color = '#000000';
            } else if (btn.id === 'verify-follow' || text.includes('verify')) {
                btn.style.background = '#4CAF50';
                btn.style.color = '#FFFFFF';
            } else if (text.includes('twitter') || text.includes('follow')) {
                btn.style.background = '#1DA1F2';
                btn.style.color = '#FFFFFF';
            } else if (btn.id === 'play-again') {
                btn.style.background = 'transparent';
                btn.style.borderColor = 'var(--primary-yellow, #FFFF00)';
                btn.style.color = 'var(--primary-yellow, #FFFF00)';
            } else {
                // Default yellow background for other buttons
                btn.style.background = 'var(--primary-yellow, #FFFF00)';
                btn.style.color = '#000000';
            }
        });
    }
    
    // 4. Fix overlapping elements
    function fixOverlappingElements() {
        // Ensure purchase form has proper spacing
        const purchaseForm = document.getElementById('purchaseForm');
        if (purchaseForm) {
            const formGroups = purchaseForm.querySelectorAll('.form-group');
            formGroups.forEach((group, index) => {
                if (index > 0) {
                    group.style.marginTop = '20px';
                }
            });
        }
        
        // Fix scanner button positioning
        const scanBtn = document.getElementById('scanQRBtn');
        if (scanBtn && scanBtn.parentElement) {
            scanBtn.parentElement.style.marginBottom = '20px';
        }
    }
    
    // 5. Fix input field styling consistency
    function fixInputStyling() {
        const rgbInput = document.getElementById('rgbInvoice');
        if (rgbInput) {
            // Ensure consistent styling
            rgbInput.style.width = '100%';
            rgbInput.style.padding = '15px';
            rgbInput.style.fontSize = '1rem';
            rgbInput.style.borderRadius = '8px';
            
            // Remove any duplicate placeholder styling
            if (rgbInput.placeholder === '') {
                rgbInput.placeholder = 'rgb:utxob:...';
            }
        }
        
        const emailInput = document.getElementById('emailAddress');
        if (emailInput) {
            emailInput.style.width = '100%';
            emailInput.style.padding = '15px';
            emailInput.style.fontSize = '1rem';
            emailInput.style.borderRadius = '8px';
        }
    }
    
    // 6. Fix z-index conflicts
    function fixZIndexIssues() {
        // Ensure modals are on top
        const modals = document.querySelectorAll('.modal, #qrScannerModal');
        modals.forEach(modal => {
            modal.style.zIndex = '100000';
        });
        
        // Game over screen should be below modals but above game
        const gameOver = document.getElementById('game-over');
        if (gameOver) {
            gameOver.style.zIndex = '99999';
        }
        
        // Purchase section should be visible
        const purchase = document.getElementById('purchase');
        if (purchase) {
            purchase.style.zIndex = '1000';
        }
    }
    
    // 7. Clean up empty or broken elements
    function cleanupBrokenElements() {
        // Remove empty tier displays
        const emptyDivs = document.querySelectorAll('div:empty[id*="tier"], div:empty[class*="tier"]');
        emptyDivs.forEach(div => {
            if (div.id || div.className.includes('tier')) {
                div.remove();
            }
        });
        
        // Remove duplicate loading screens
        const loadingScreens = document.querySelectorAll('#loading-screen');
        if (loadingScreens.length > 1) {
            for (let i = 1; i < loadingScreens.length; i++) {
                loadingScreens[i].remove();
            }
        }
    }
    
    // 8. Main fix function
    function applyAllFixes() {
        console.log('[Visual Bugs Fix] Applying all visual fixes...');
        
        fixDuplicateLabels();
        fixDuplicateTierMessages();
        fixTransparentButtons();
        fixOverlappingElements();
        fixInputStyling();
        fixZIndexIssues();
        cleanupBrokenElements();
        
        console.log('[Visual Bugs Fix] All fixes applied');
    }
    
    // 9. Run fixes at multiple times to catch dynamic content
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyAllFixes);
    } else {
        applyAllFixes();
    }
    
    // Run again after delays to catch dynamically added content
    setTimeout(applyAllFixes, 500);
    setTimeout(applyAllFixes, 1000);
    setTimeout(applyAllFixes, 2000);
    
    // Monitor for changes
    const observer = new MutationObserver((mutations) => {
        let shouldReapply = false;
        
        mutations.forEach(mutation => {
            // Check if RGB invoice elements were added
            if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        if (node.tagName === 'LABEL' || 
                            node.id === 'rgbInvoice' ||
                            (node.className && node.className.includes('tier'))) {
                            shouldReapply = true;
                        }
                    }
                });
            }
        });
        
        if (shouldReapply) {
            applyAllFixes();
        }
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('[Visual Bugs Fix] Monitoring for visual issues...');
})();