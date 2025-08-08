// Invoice Format Fix - Handle special characters in RGB invoices
(function() {
    'use strict';
    
    console.log('🔧 Invoice Format Fix: Initializing...');
    
    // Override the form submission to handle special characters
    function fixInvoiceSubmission() {
        const purchaseForm = document.getElementById('purchaseForm');
        if (!purchaseForm) {
            console.log('Purchase form not found, waiting...');
            setTimeout(fixInvoiceSubmission, 1000);
            return;
        }
        
        // Store original submit handler
        const originalSubmit = purchaseForm.onsubmit;
        
        // Override form submission
        purchaseForm.onsubmit = function(e) {
            e.preventDefault();
            
            const rgbInvoiceInput = document.getElementById('rgbInvoice');
            if (rgbInvoiceInput && rgbInvoiceInput.value) {
                // Get the invoice value
                let invoice = rgbInvoiceInput.value.trim();
                
                // Log original invoice
                console.log('Original invoice:', invoice);
                
                // The invoice format from Iris wallet uses ~ as separators
                // Format: rgb:~/~/~/bc:utxob:...
                // This is valid but may need proper encoding
                
                // Check if it's an Iris wallet format
                if (invoice.includes('rgb:~/~/~/')) {
                    console.log('✅ Detected Iris wallet RGB invoice format');
                    
                    // The invoice is valid as-is, but let's ensure it's properly encoded
                    // Don't modify the invoice - it's the correct format from Iris
                    
                    // Just validate basic structure
                    if (!invoice.includes(':utxob:')) {
                        alert('Invalid RGB invoice: Missing UTXO data. Please copy the complete invoice from your Iris wallet.');
                        return false;
                    }
                    
                    console.log('✅ Invoice validation passed for Iris format');
                } else if (invoice.startsWith('rgb:')) {
                    // Standard RGB invoice format
                    console.log('✅ Detected standard RGB invoice format');
                    
                    if (!invoice.includes(':utxob:')) {
                        alert('Invalid RGB invoice: Missing UTXO data');
                        return false;
                    }
                }
                
                // Update the input with the processed invoice
                rgbInvoiceInput.value = invoice;
            }
            
            // Call original handler if it exists
            if (originalSubmit) {
                return originalSubmit.call(this, e);
            }
            
            return true;
        };
        
        console.log('✅ Invoice format fix applied');
    }
    
    // Also fix the validation message
    function improveValidationMessages() {
        const rgbInvoiceInput = document.getElementById('rgbInvoice');
        if (!rgbInvoiceInput) {
            setTimeout(improveValidationMessages, 1000);
            return;
        }
        
        // Add input event listener for real-time validation
        rgbInvoiceInput.addEventListener('input', function(e) {
            const value = e.target.value.trim();
            
            if (value) {
                // Check format
                if (value.includes('rgb:~/~/~/') && value.includes(':utxob:')) {
                    // Iris wallet format
                    rgbInvoiceInput.setCustomValidity('');
                    console.log('✅ Valid Iris wallet invoice format detected');
                    
                    // Show success indicator
                    rgbInvoiceInput.style.borderColor = '#4CAF50';
                    
                    // Add or update validation message
                    let validMsg = document.getElementById('invoice-valid-msg');
                    if (!validMsg) {
                        validMsg = document.createElement('div');
                        validMsg.id = 'invoice-valid-msg';
                        validMsg.style.cssText = 'color: #4CAF50; font-size: 0.85rem; margin-top: 5px;';
                        rgbInvoiceInput.parentNode.appendChild(validMsg);
                    }
                    validMsg.textContent = '✅ Valid Iris wallet RGB invoice';
                    
                } else if (value.startsWith('rgb:') && value.includes(':utxob:')) {
                    // Standard format
                    rgbInvoiceInput.setCustomValidity('');
                    rgbInvoiceInput.style.borderColor = '#4CAF50';
                    
                    let validMsg = document.getElementById('invoice-valid-msg');
                    if (!validMsg) {
                        validMsg = document.createElement('div');
                        validMsg.id = 'invoice-valid-msg';
                        validMsg.style.cssText = 'color: #4CAF50; font-size: 0.85rem; margin-top: 5px;';
                        rgbInvoiceInput.parentNode.appendChild(validMsg);
                    }
                    validMsg.textContent = '✅ Valid RGB invoice format';
                    
                } else if (value.startsWith('rgb:')) {
                    // Partial - might be typing
                    rgbInvoiceInput.style.borderColor = '#FFA500';
                    
                    let validMsg = document.getElementById('invoice-valid-msg');
                    if (!validMsg) {
                        validMsg = document.createElement('div');
                        validMsg.id = 'invoice-valid-msg';
                        validMsg.style.cssText = 'color: #FFA500; font-size: 0.85rem; margin-top: 5px;';
                        rgbInvoiceInput.parentNode.appendChild(validMsg);
                    }
                    validMsg.textContent = '⚠️ Invoice incomplete - must include :utxob: section';
                    
                } else {
                    // Invalid format
                    rgbInvoiceInput.style.borderColor = '';
                    
                    let validMsg = document.getElementById('invoice-valid-msg');
                    if (validMsg) {
                        validMsg.textContent = '';
                    }
                }
            } else {
                // Empty
                rgbInvoiceInput.style.borderColor = '';
                let validMsg = document.getElementById('invoice-valid-msg');
                if (validMsg) {
                    validMsg.remove();
                }
            }
        });
        
        console.log('✅ Validation messages improved');
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            fixInvoiceSubmission();
            improveValidationMessages();
        });
    } else {
        fixInvoiceSubmission();
        improveValidationMessages();
    }
    
})();