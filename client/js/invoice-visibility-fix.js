/**
 * Invoice Visibility Fix - Ensures RGB invoice form is always visible
 */
(function() {
    'use strict';
    
    console.log('[Invoice Visibility Fix] Initializing...');
    
    // 1. Force invoice form styles
    const invoiceStyles = document.createElement('style');
    invoiceStyles.innerHTML = `
        /* Force purchase section visibility */
        #purchase {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            background: #000000 !important;
            min-height: 100vh !important;
        }
        
        /* Force form visibility */
        .purchase-form,
        #purchaseForm {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            background: transparent !important;
        }
        
        /* Force all form elements visible */
        .form-group,
        .form-input,
        #rgbInvoice,
        #emailAddress,
        #submitRgbInvoice,
        .invoice-form {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        /* Style the RGB invoice input */
        #rgbInvoice {
            width: 100% !important;
            padding: 15px !important;
            background: rgba(255, 255, 255, 0.1) !important;
            border: 2px solid var(--yellow) !important;
            color: #fff !important;
            font-size: 1rem !important;
            border-radius: 8px !important;
            margin: 10px 0 !important;
        }
        
        #rgbInvoice:focus {
            outline: none !important;
            border-color: #fff !important;
            box-shadow: 0 0 20px rgba(255, 255, 0, 0.5) !important;
        }
        
        /* Style email input */
        #emailAddress {
            width: 100% !important;
            padding: 15px !important;
            background: rgba(255, 255, 255, 0.1) !important;
            border: 2px solid rgba(255, 255, 255, 0.3) !important;
            color: #fff !important;
            font-size: 1rem !important;
            border-radius: 8px !important;
            margin: 10px 0 !important;
        }
        
        /* Style submit button */
        #submitRgbInvoice {
            width: 100% !important;
            padding: 18px !important;
            background: var(--yellow) !important;
            color: #000 !important;
            border: none !important;
            font-size: 1.1rem !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
            border-radius: 8px !important;
            cursor: pointer !important;
            margin-top: 20px !important;
            transition: all 0.3s ease !important;
        }
        
        #submitRgbInvoice:hover:not(:disabled) {
            background: #fff !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 5px 20px rgba(255, 255, 255, 0.5) !important;
        }
        
        #submitRgbInvoice:disabled {
            opacity: 0.5 !important;
            cursor: not-allowed !important;
        }
        
        /* Style labels */
        .form-group label {
            display: block !important;
            color: var(--yellow) !important;
            font-weight: 600 !important;
            margin-bottom: 8px !important;
            font-size: 0.9rem !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
        }
        
        /* Container styling */
        .invoice-form,
        .purchase-form {
            max-width: 600px !important;
            margin: 0 auto !important;
            padding: 30px !important;
            background: rgba(255, 255, 255, 0.05) !important;
            border: 2px solid rgba(255, 255, 0, 0.3) !important;
            border-radius: 15px !important;
        }
        
        /* Fix section title */
        .section-title {
            color: var(--yellow) !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        /* Ensure container is visible */
        .container {
            visibility: visible !important;
            opacity: 1 !important;
        }
    `;
    document.head.appendChild(invoiceStyles);
    
    // 2. Function to ensure invoice form is visible
    function ensureInvoiceFormVisible() {
        console.log('[Invoice Visibility Fix] Checking invoice form visibility...');
        
        // Find purchase section
        const purchaseSection = document.getElementById('purchase');
        if (purchaseSection) {
            purchaseSection.style.display = 'block';
            purchaseSection.style.visibility = 'visible';
            purchaseSection.style.opacity = '1';
            
            // Ensure it's not hidden by any parent
            let parent = purchaseSection.parentElement;
            while (parent && parent !== document.body) {
                parent.style.visibility = 'visible';
                parent.style.opacity = '1';
                parent = parent.parentElement;
            }
        }
        
        // Find and show the form
        const purchaseForm = document.getElementById('purchaseForm') || document.querySelector('.purchase-form');
        if (purchaseForm) {
            purchaseForm.style.display = 'block';
            purchaseForm.style.visibility = 'visible';
            purchaseForm.style.opacity = '1';
            
            // Show all form groups
            const formGroups = purchaseForm.querySelectorAll('.form-group');
            formGroups.forEach(group => {
                group.style.display = 'block';
                group.style.visibility = 'visible';
                group.style.opacity = '1';
            });
        }
        
        // Ensure RGB invoice input is visible
        const rgbInput = document.getElementById('rgbInvoice');
        if (rgbInput) {
            rgbInput.style.display = 'block';
            rgbInput.style.visibility = 'visible';
            rgbInput.style.opacity = '1';
            
            // Make sure parent form group is visible
            const parentGroup = rgbInput.closest('.form-group');
            if (parentGroup) {
                parentGroup.style.display = 'block';
                parentGroup.style.visibility = 'visible';
                parentGroup.style.opacity = '1';
            }
            
            // Check if label already exists (don't add duplicate)
            const existingLabel = rgbInput.parentNode.querySelector('label') || document.querySelector('label[for="rgbInvoice"]');
            if (!existingLabel) {
                const label = document.createElement('label');
                label.setAttribute('for', 'rgbInvoice');
                label.textContent = 'RGB Invoice';
                label.style.cssText = 'color: var(--yellow); font-weight: 600; margin-bottom: 8px; display: block;';
                rgbInput.parentNode.insertBefore(label, rgbInput);
            }
        }
        
        // Ensure email input is visible
        const emailInput = document.getElementById('emailAddress');
        if (emailInput) {
            emailInput.style.display = 'block';
            emailInput.style.visibility = 'visible';
            emailInput.style.opacity = '1';
        }
        
        // Ensure submit button is visible
        const submitBtn = document.getElementById('submitRgbInvoice');
        if (submitBtn) {
            submitBtn.style.display = 'block';
            submitBtn.style.visibility = 'visible';
            submitBtn.style.opacity = '1';
        }
        
        // Check if we're coming from game
        if (window.location.hash.includes('purchase') && window.location.search.includes('tier')) {
            // Scroll to purchase section
            if (purchaseSection) {
                setTimeout(() => {
                    purchaseSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 500);
            }
        }
    }
    
    // 3. Run visibility check multiple times to ensure it sticks
    ensureInvoiceFormVisible();
    setTimeout(ensureInvoiceFormVisible, 100);
    setTimeout(ensureInvoiceFormVisible, 500);
    setTimeout(ensureInvoiceFormVisible, 1000);
    
    // 4. Monitor for changes
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureInvoiceFormVisible);
    }
    
    // Monitor hash changes
    window.addEventListener('hashchange', () => {
        if (window.location.hash.includes('purchase')) {
            ensureInvoiceFormVisible();
        }
    });
    
    // Monitor for visibility changes
    const observer = new MutationObserver(() => {
        const purchaseSection = document.getElementById('purchase');
        if (purchaseSection && purchaseSection.style.display !== 'none') {
            ensureInvoiceFormVisible();
        }
    });
    
    const purchaseSection = document.getElementById('purchase');
    if (purchaseSection) {
        observer.observe(purchaseSection, {
            attributes: true,
            attributeFilter: ['style', 'class']
        });
    }
    
    console.log('[Invoice Visibility Fix] Fix applied');
})();