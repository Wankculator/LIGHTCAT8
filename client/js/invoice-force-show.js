/**
 * Invoice Force Show - Ensures invoice form is absolutely visible after game claim
 */
(function() {
    'use strict';
    
    console.log('[Invoice Force Show] Initializing aggressive visibility fix...');
    
    // 1. Force all sections to proper state
    function forceShowInvoice() {
        console.log('[Invoice Force Show] Forcing invoice visibility...');
        
        // Hide all sections first
        const allSections = document.querySelectorAll('.section, section');
        allSections.forEach(section => {
            if (section.id !== 'purchase') {
                section.style.display = 'none';
                section.style.visibility = 'hidden';
            }
        });
        
        // Force show purchase section
        const purchaseSection = document.getElementById('purchase');
        if (purchaseSection) {
            // Remove any conflicting classes
            purchaseSection.className = 'purchase-section section';
            
            // Force visible with maximum priority
            purchaseSection.style.cssText = `
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                position: relative !important;
                z-index: 1000 !important;
                background: #000000 !important;
                min-height: 100vh !important;
                padding: 60px 20px !important;
            `;
            
            // Ensure container is visible
            const container = purchaseSection.querySelector('.container');
            if (container) {
                container.style.cssText = `
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    max-width: 800px !important;
                    margin: 0 auto !important;
                `;
            }
            
            // Force purchase form visible
            const purchaseForm = document.getElementById('purchaseForm');
            if (purchaseForm) {
                purchaseForm.style.cssText = `
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    background: rgba(255, 255, 255, 0.05) !important;
                    border: 2px solid var(--yellow) !important;
                    border-radius: 15px !important;
                    padding: 30px !important;
                    margin-top: 30px !important;
                `;
            }
            
            // Force RGB invoice input visible
            const rgbInput = document.getElementById('rgbInvoice');
            if (rgbInput) {
                rgbInput.style.cssText = `
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    width: 100% !important;
                    padding: 15px !important;
                    background: rgba(255, 255, 255, 0.1) !important;
                    border: 2px solid var(--yellow) !important;
                    color: #fff !important;
                    font-size: 1rem !important;
                    border-radius: 8px !important;
                `;
                
                // Focus the input
                setTimeout(() => {
                    rgbInput.focus();
                    rgbInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 500);
            }
            
            // Force all form elements visible
            const formElements = purchaseSection.querySelectorAll('input, button, label, .form-group, .batch-selector');
            formElements.forEach(el => {
                el.style.visibility = 'visible';
                el.style.opacity = '1';
                el.style.display = el.tagName === 'LABEL' ? 'block' : (el.style.display || 'block');
            });
            
            // Force title visible
            const title = purchaseSection.querySelector('.section-title');
            if (title) {
                title.style.cssText = `
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    color: var(--yellow) !important;
                    font-size: 2rem !important;
                    text-align: center !important;
                    margin-bottom: 30px !important;
                `;
            }
            
            // Scroll to purchase section
            purchaseSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Log success
            console.log('[Invoice Force Show] Purchase section forced visible');
        } else {
            console.error('[Invoice Force Show] Purchase section not found!');
        }
    }
    
    // 2. Check if we're coming from game
    function checkGameRedirect() {
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = window.location.hash.includes('?') ? 
            new URLSearchParams(window.location.hash.split('?')[1]) : null;
        
        const hasTier = urlParams.get('tier') || (hashParams && hashParams.get('tier'));
        const isPurchaseHash = window.location.hash.includes('purchase');
        
        if (hasTier || isPurchaseHash) {
            console.log('[Invoice Force Show] Game redirect detected, forcing invoice display');
            
            // Force show immediately
            forceShowInvoice();
            
            // Force show again after delays to override any other scripts
            setTimeout(forceShowInvoice, 100);
            setTimeout(forceShowInvoice, 500);
            setTimeout(forceShowInvoice, 1000);
            setTimeout(forceShowInvoice, 2000);
            
            // Add tier unlock message if tier is present
            const tier = urlParams.get('tier') || (hashParams && hashParams.get('tier'));
            if (tier) {
                setTimeout(() => {
                    const purchaseForm = document.getElementById('purchaseForm');
                    if (purchaseForm && !document.getElementById('tier-unlock-message')) {
                        const message = document.createElement('div');
                        message.id = 'tier-unlock-message';
                        message.style.cssText = `
                            background: linear-gradient(45deg, rgba(255, 215, 0, 0.2), rgba(255, 140, 0, 0.2));
                            border: 3px solid var(--yellow);
                            border-radius: 15px;
                            padding: 25px;
                            margin-bottom: 30px;
                            text-align: center;
                            animation: glow 2s ease-in-out infinite;
                        `;
                        message.innerHTML = `
                            <h2 style="color: var(--yellow); margin: 0 0 10px 0; font-size: 1.8rem;">
                                🎉 ${tier.toUpperCase()} TIER UNLOCKED! 🎉
                            </h2>
                            <p style="color: #fff; margin: 0; font-size: 1.1rem;">
                                Enter your RGB invoice below to claim your LIGHTCAT tokens!
                            </p>
                        `;
                        purchaseForm.parentNode.insertBefore(message, purchaseForm);
                    }
                }, 1000);
            }
        }
    }
    
    // 3. Add glow animation
    const glowStyle = document.createElement('style');
    glowStyle.innerHTML = `
        @keyframes glow {
            0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.5); }
            50% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.4); }
        }
    `;
    document.head.appendChild(glowStyle);
    
    // 4. Initialize on various events
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkGameRedirect);
    } else {
        checkGameRedirect();
    }
    
    // Monitor hash changes
    window.addEventListener('hashchange', checkGameRedirect);
    
    // Monitor for visibility changes
    const observer = new MutationObserver(() => {
        const purchaseSection = document.getElementById('purchase');
        if (purchaseSection && window.location.hash.includes('purchase')) {
            const display = window.getComputedStyle(purchaseSection).display;
            if (display === 'none') {
                forceShowInvoice();
            }
        }
    });
    
    // Start observing
    setTimeout(() => {
        const body = document.body;
        if (body) {
            observer.observe(body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class']
            });
        }
    }, 1000);
    
    console.log('[Invoice Force Show] Aggressive visibility fix applied');
})();