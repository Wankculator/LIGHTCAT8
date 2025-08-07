/**
 * LIGHTCAT Invoice UI Improvements
 * Professional, clean, and mobile-optimized invoice creation experience
 */

(function() {
    'use strict';

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeInvoiceUI);
    } else {
        initializeInvoiceUI();
    }

    function initializeInvoiceUI() {
        console.log('🎨 Initializing improved invoice UI...');
        
        // Enhance the RGB invoice input field
        enhanceInvoiceInput();
        
        // Add validation feedback
        addRealTimeValidation();
        
        // Add copy/paste helpers
        addClipboardHelpers();
        
        // Add format helper text
        addFormatHelper();
        
        // Add progress indicator
        addProgressIndicator();
        
        // Improve error messages
        improveErrorMessages();
        
        // Add loading states
        addLoadingStates();
        
        // Mobile optimizations
        optimizeForMobile();
    }

    /**
     * Enhance the main invoice input field
     */
    function enhanceInvoiceInput() {
        const invoiceInput = document.getElementById('rgbInvoice');
        if (!invoiceInput) return;
        
        // Add better placeholder with example
        invoiceInput.placeholder = 'rgb:utxob:WiUyMWVkN... (paste your RGB invoice)';
        
        // Add auto-focus on modal open
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.style.display !== 'none') {
                    setTimeout(() => invoiceInput.focus(), 100);
                }
            });
        });
        
        const modal = invoiceInput.closest('.modal, [class*="modal"]');
        if (modal) {
            observer.observe(modal, { attributes: true, attributeFilter: ['style'] });
        }
        
        // Style improvements
        invoiceInput.style.fontFamily = 'monospace';
        invoiceInput.style.fontSize = '0.9rem';
        invoiceInput.style.padding = '12px';
        invoiceInput.style.borderRadius = '8px';
        invoiceInput.style.border = '2px solid rgba(255, 215, 0, 0.3)';
        invoiceInput.style.transition = 'all 0.3s ease';
        
        // Focus styles
        invoiceInput.addEventListener('focus', () => {
            invoiceInput.style.borderColor = 'var(--yellow)';
            invoiceInput.style.boxShadow = '0 0 0 3px rgba(255, 215, 0, 0.1)';
        });
        
        invoiceInput.addEventListener('blur', () => {
            invoiceInput.style.borderColor = 'rgba(255, 215, 0, 0.3)';
            invoiceInput.style.boxShadow = 'none';
        });
    }

    /**
     * Add real-time validation feedback
     */
    function addRealTimeValidation() {
        const invoiceInput = document.getElementById('rgbInvoice');
        if (!invoiceInput) return;
        
        // Create validation feedback element
        const feedbackDiv = document.createElement('div');
        feedbackDiv.id = 'invoiceValidationFeedback';
        feedbackDiv.style.cssText = `
            margin-top: 8px;
            font-size: 0.85rem;
            transition: all 0.3s ease;
            min-height: 20px;
        `;
        
        // Insert after input
        invoiceInput.parentNode.insertBefore(feedbackDiv, invoiceInput.nextSibling);
        
        // Validation patterns
        const validationPatterns = [
            { pattern: /^rgb:utxob:[\w\-+/:.]+$/, name: 'Standard RGB invoice' },
            { pattern: /^rgb1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]+$/, name: 'Bech32 RGB address' },
            { pattern: /^rgb:[2u][\w\-]+$/, name: 'RGB asset format' },
            { pattern: /^rgb:[\w\-+/:.]+$/, name: 'General RGB format' }
        ];
        
        // Validate on input
        invoiceInput.addEventListener('input', () => {
            const value = invoiceInput.value.trim();
            
            if (!value) {
                feedbackDiv.innerHTML = '';
                invoiceInput.style.borderColor = 'rgba(255, 215, 0, 0.3)';
                return;
            }
            
            // Check if starts with rgb
            if (!value.startsWith('rgb')) {
                feedbackDiv.innerHTML = '<span style="color: #ff6b6b;">✗ Invoice must start with "rgb"</span>';
                invoiceInput.style.borderColor = '#ff6b6b';
                return;
            }
            
            // Check length
            if (value.length < 10) {
                feedbackDiv.innerHTML = '<span style="color: #ffa500;">⚠ Invoice too short</span>';
                invoiceInput.style.borderColor = '#ffa500';
                return;
            }
            
            // Check against patterns
            const matchedPattern = validationPatterns.find(p => p.pattern.test(value));
            if (matchedPattern) {
                feedbackDiv.innerHTML = `<span style="color: #4caf50;">✓ Valid ${matchedPattern.name}</span>`;
                invoiceInput.style.borderColor = '#4caf50';
            } else if (value.length > 30) {
                feedbackDiv.innerHTML = '<span style="color: #ffa500;">⚠ Format may be valid</span>';
                invoiceInput.style.borderColor = '#ffa500';
            }
        });
    }

    /**
     * Add clipboard helpers (copy/paste buttons)
     */
    function addClipboardHelpers() {
        const invoiceInput = document.getElementById('rgbInvoice');
        if (!invoiceInput) return;
        
        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 10px;
            margin-top: 10px;
        `;
        
        // Paste button
        const pasteBtn = document.createElement('button');
        pasteBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
            </svg>
            Paste from Clipboard
        `;
        pasteBtn.style.cssText = `
            flex: 1;
            padding: 10px;
            background: rgba(255, 215, 0, 0.1);
            border: 1px solid var(--yellow);
            color: var(--yellow);
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 0.9rem;
            transition: all 0.3s ease;
        `;
        
        pasteBtn.addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                invoiceInput.value = text;
                invoiceInput.dispatchEvent(new Event('input'));
                showToast('Pasted from clipboard', 'success');
            } catch (err) {
                showToast('Could not access clipboard', 'error');
            }
        });
        
        // Clear button
        const clearBtn = document.createElement('button');
        clearBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Clear
        `;
        clearBtn.style.cssText = `
            padding: 10px 20px;
            background: rgba(255, 107, 107, 0.1);
            border: 1px solid #ff6b6b;
            color: #ff6b6b;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9rem;
            transition: all 0.3s ease;
        `;
        
        clearBtn.addEventListener('click', () => {
            invoiceInput.value = '';
            invoiceInput.dispatchEvent(new Event('input'));
            invoiceInput.focus();
        });
        
        buttonContainer.appendChild(pasteBtn);
        buttonContainer.appendChild(clearBtn);
        
        // Insert after validation feedback or input
        const feedbackDiv = document.getElementById('invoiceValidationFeedback');
        const insertAfter = feedbackDiv || invoiceInput;
        insertAfter.parentNode.insertBefore(buttonContainer, insertAfter.nextSibling);
    }

    /**
     * Add format helper text
     */
    function addFormatHelper() {
        const invoiceInput = document.getElementById('rgbInvoice');
        if (!invoiceInput) return;
        
        // Create helper text container
        const helperDiv = document.createElement('div');
        helperDiv.style.cssText = `
            margin-top: 15px;
            padding: 12px;
            background: rgba(255, 215, 0, 0.05);
            border: 1px solid rgba(255, 215, 0, 0.2);
            border-radius: 8px;
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.8);
        `;
        
        helperDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--yellow)" stroke="none">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
                <strong style="color: var(--yellow);">RGB Invoice Format</strong>
            </div>
            <div style="line-height: 1.5;">
                Your RGB invoice should look like:<br>
                <code style="background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; display: inline-block; margin-top: 5px;">
                    rgb:utxob:WiUyMWVkNzdBQzMyRDU...
                </code>
            </div>
            <div style="margin-top: 8px; font-size: 0.8rem; color: rgba(255,255,255,0.6);">
                Get this from your RGB-compatible wallet
            </div>
        `;
        
        // Find where to insert (after buttons or input)
        const buttonContainer = invoiceInput.parentNode.querySelector('div[style*="flex"]');
        const insertAfter = buttonContainer || document.getElementById('invoiceValidationFeedback') || invoiceInput;
        insertAfter.parentNode.insertBefore(helperDiv, insertAfter.nextSibling);
    }

    /**
     * Add progress indicator for invoice creation
     */
    function addProgressIndicator() {
        // Create progress container
        const progressDiv = document.createElement('div');
        progressDiv.id = 'invoiceProgressIndicator';
        progressDiv.style.cssText = `
            display: none;
            margin-top: 20px;
            padding: 15px;
            background: rgba(255, 215, 0, 0.1);
            border: 1px solid var(--yellow);
            border-radius: 8px;
        `;
        
        progressDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <div class="spinner" style="
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255, 215, 0, 0.3);
                    border-top-color: var(--yellow);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                "></div>
                <div>
                    <div style="color: var(--yellow); font-weight: 600;">Creating Lightning Invoice...</div>
                    <div style="font-size: 0.85rem; color: rgba(255,255,255,0.7); margin-top: 4px;">
                        This usually takes a few seconds
                    </div>
                </div>
            </div>
        `;
        
        // Add spinner animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        // Find form or modal to append to
        const form = document.querySelector('.purchase-form, #purchaseForm, [class*="purchase"]');
        if (form) {
            form.appendChild(progressDiv);
        }
    }

    /**
     * Improve error messages
     */
    function improveErrorMessages() {
        // Override global alert if it exists
        const originalAlert = window.alert;
        window.alert = function(message) {
            // Convert alerts to better notifications
            if (message.includes('RGB') || message.includes('invoice') || message.includes('payment')) {
                showToast(message, 'error');
            } else {
                originalAlert(message);
            }
        };
    }

    /**
     * Add loading states to buttons
     */
    function addLoadingStates() {
        // Find submit/purchase buttons
        const buttons = document.querySelectorAll('button[onclick*="createLightning"], button[onclick*="purchase"], button:contains("Get Invoice")');
        
        buttons.forEach(button => {
            const originalOnClick = button.onclick;
            button.onclick = async function(e) {
                // Add loading state
                const originalText = button.innerHTML;
                button.disabled = true;
                button.innerHTML = `
                    <span style="display: inline-flex; align-items: center; gap: 8px;">
                        <span class="button-spinner" style="
                            width: 14px;
                            height: 14px;
                            border: 2px solid rgba(255, 255, 255, 0.3);
                            border-top-color: white;
                            border-radius: 50%;
                            animation: spin 0.8s linear infinite;
                            display: inline-block;
                        "></span>
                        Processing...
                    </span>
                `;
                
                // Show progress indicator
                const progressDiv = document.getElementById('invoiceProgressIndicator');
                if (progressDiv) {
                    progressDiv.style.display = 'block';
                }
                
                try {
                    // Call original function
                    if (originalOnClick) {
                        await originalOnClick.call(this, e);
                    }
                } finally {
                    // Reset button state after 3 seconds
                    setTimeout(() => {
                        button.disabled = false;
                        button.innerHTML = originalText;
                        if (progressDiv) {
                            progressDiv.style.display = 'none';
                        }
                    }, 3000);
                }
            };
        });
    }

    /**
     * Mobile-specific optimizations
     */
    function optimizeForMobile() {
        if (window.innerWidth > 768) return;
        
        const invoiceInput = document.getElementById('rgbInvoice');
        if (!invoiceInput) return;
        
        // Make input larger on mobile
        invoiceInput.style.fontSize = '16px'; // Prevents zoom on iOS
        invoiceInput.style.padding = '14px';
        invoiceInput.style.minHeight = '50px';
        
        // Adjust button sizes for mobile
        const buttons = invoiceInput.parentNode.querySelectorAll('button');
        buttons.forEach(button => {
            button.style.minHeight = '44px';
            button.style.fontSize = '0.95rem';
        });
    }

    /**
     * Toast notification system
     */
    function showToast(message, type = 'info') {
        // Remove existing toasts
        const existingToast = document.getElementById('invoiceToast');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.id = 'invoiceToast';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            background: ${type === 'error' ? '#ff6b6b' : type === 'success' ? '#4caf50' : 'var(--yellow)'};
            color: ${type === 'error' || type === 'success' ? 'white' : 'black'};
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideUp 0.3s ease;
            font-size: 0.9rem;
            font-weight: 500;
            max-width: 90%;
            text-align: center;
        `;
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideUp {
                from {
                    transform: translate(-50%, 100%);
                    opacity: 0;
                }
                to {
                    transform: translate(-50%, 0);
                    opacity: 1;
                }
            }
        `;
        if (!document.head.querySelector('style[data-toast]')) {
            style.setAttribute('data-toast', 'true');
            document.head.appendChild(style);
        }
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'slideUp 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // Export for global use
    window.showInvoiceToast = showToast;
    
    console.log('✅ Invoice UI improvements loaded');
})();