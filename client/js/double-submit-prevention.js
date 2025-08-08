/**
 * Double-Submit Prevention for LIGHTCAT
 * Prevents users from accidentally submitting forms/requests multiple times
 */

(function() {
    'use strict';

    // Track pending submissions
    const pendingSubmissions = new Map();
    const submissionHistory = new Map();
    
    // Configuration
    const config = {
        debounceDelay: 500, // ms between allowed submissions
        lockoutDuration: 3000, // ms to lock button after submission
        showLoadingState: true,
        preventMultipleClicks: true
    };

    /**
     * Generate unique key for submission
     */
    function generateSubmissionKey(data) {
        if (typeof data === 'string') {
            return data;
        }
        
        // Create key from important fields
        const key = JSON.stringify({
            rgbInvoice: data.rgbInvoice,
            batchCount: data.batchCount,
            tier: data.tier
        });
        
        return btoa(key).substring(0, 20);
    }

    /**
     * Check if submission is duplicate
     */
    function isDuplicateSubmission(key) {
        const lastSubmission = submissionHistory.get(key);
        
        if (!lastSubmission) {
            return false;
        }
        
        const timeSinceLastSubmission = Date.now() - lastSubmission;
        return timeSinceLastSubmission < config.debounceDelay;
    }

    /**
     * Protect form from double submission
     */
    function protectForm(form) {
        if (!form || form.dataset.protected === 'true') {
            return;
        }
        
        form.dataset.protected = 'true';
        
        form.addEventListener('submit', function(e) {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            const key = generateSubmissionKey(data);
            
            // Check if already submitting
            if (pendingSubmissions.has(key)) {
                e.preventDefault();
                console.warn('Prevented duplicate submission');
                showNotification('Please wait, your request is being processed...', 'warning');
                return false;
            }
            
            // Check submission history
            if (isDuplicateSubmission(key)) {
                e.preventDefault();
                console.warn('Submission too fast, throttled');
                showNotification('Please wait a moment before trying again', 'warning');
                return false;
            }
            
            // Mark as pending
            pendingSubmissions.set(key, Date.now());
            submissionHistory.set(key, Date.now());
            
            // Disable submit button
            const submitButton = form.querySelector('[type="submit"], button:not([type="button"])');
            if (submitButton) {
                disableButton(submitButton);
            }
            
            // Clear pending after timeout
            setTimeout(() => {
                pendingSubmissions.delete(key);
                if (submitButton) {
                    enableButton(submitButton);
                }
            }, config.lockoutDuration);
        });
    }

    /**
     * Protect button from double clicks
     */
    function protectButton(button) {
        if (!button || button.dataset.protected === 'true') {
            return;
        }
        
        button.dataset.protected = 'true';
        const originalOnClick = button.onclick;
        let isProcessing = false;
        
        button.addEventListener('click', function(e) {
            if (isProcessing) {
                e.preventDefault();
                e.stopPropagation();
                console.warn('Prevented double click');
                return false;
            }
            
            isProcessing = true;
            disableButton(button);
            
            // Reset after timeout
            setTimeout(() => {
                isProcessing = false;
                enableButton(button);
            }, config.lockoutDuration);
        });
        
        // If button has onclick, wrap it
        if (originalOnClick) {
            button.onclick = async function(e) {
                if (isProcessing) {
                    return false;
                }
                
                try {
                    return await originalOnClick.call(this, e);
                } finally {
                    // Ensure button is re-enabled even if error occurs
                    setTimeout(() => {
                        isProcessing = false;
                        enableButton(button);
                    }, config.lockoutDuration);
                }
            };
        }
    }

    /**
     * Disable button with loading state
     */
    function disableButton(button) {
        button.disabled = true;
        button.dataset.originalText = button.innerHTML;
        
        if (config.showLoadingState) {
            button.innerHTML = `
                <span style="display: inline-flex; align-items: center; gap: 8px;">
                    <span class="spinner" style="
                        width: 14px;
                        height: 14px;
                        border: 2px solid rgba(255, 255, 255, 0.3);
                        border-top-color: currentColor;
                        border-radius: 50%;
                        animation: spin 0.8s linear infinite;
                        display: inline-block;
                    "></span>
                    Processing...
                </span>
            `;
        }
        
        button.style.cursor = 'not-allowed';
        button.style.opacity = '0.6';
    }

    /**
     * Enable button and restore original state
     */
    function enableButton(button) {
        button.disabled = false;
        
        if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText;
            delete button.dataset.originalText;
        }
        
        button.style.cursor = '';
        button.style.opacity = '';
    }

    /**
     * Protect AJAX requests
     */
    function protectAjaxRequest(url, data) {
        const key = generateSubmissionKey({ url, ...data });
        
        if (pendingSubmissions.has(key)) {
            console.warn('Duplicate AJAX request blocked:', url);
            return Promise.reject(new Error('Request already in progress'));
        }
        
        if (isDuplicateSubmission(key)) {
            console.warn('AJAX request throttled:', url);
            return Promise.reject(new Error('Please wait before trying again'));
        }
        
        pendingSubmissions.set(key, Date.now());
        submissionHistory.set(key, Date.now());
        
        // Clear after timeout
        setTimeout(() => {
            pendingSubmissions.delete(key);
        }, config.lockoutDuration);
        
        return Promise.resolve();
    }

    /**
     * Override fetch to prevent double submissions
     */
    const originalFetch = window.fetch;
    window.fetch = async function(url, options = {}) {
        // Only protect POST/PUT/DELETE requests
        if (options.method && ['POST', 'PUT', 'DELETE'].includes(options.method.toUpperCase())) {
            // Check if it's an invoice creation request
            if (url.includes('/api/rgb/invoice') || url.includes('/api/payment')) {
                let body = {};
                
                try {
                    if (options.body) {
                        if (typeof options.body === 'string') {
                            body = JSON.parse(options.body);
                        } else if (options.body instanceof FormData) {
                            body = Object.fromEntries(options.body);
                        }
                    }
                } catch (e) {
                    // Ignore parse errors
                }
                
                try {
                    await protectAjaxRequest(url, body);
                } catch (error) {
                    return Promise.reject(error);
                }
            }
        }
        
        return originalFetch.apply(this, arguments);
    };

    /**
     * Protect specific invoice creation function
     */
    function protectInvoiceCreation() {
        const originalCreateInvoice = window.createLightningInvoice;
        
        if (originalCreateInvoice) {
            window.createLightningInvoice = async function(...args) {
                const rgbInvoice = document.getElementById('rgbInvoice')?.value;
                const key = generateSubmissionKey({ rgbInvoice });
                
                if (pendingSubmissions.has(key)) {
                    showNotification('Invoice creation already in progress...', 'warning');
                    return;
                }
                
                if (isDuplicateSubmission(key)) {
                    showNotification('Please wait a moment before creating another invoice', 'warning');
                    return;
                }
                
                pendingSubmissions.set(key, Date.now());
                submissionHistory.set(key, Date.now());
                
                try {
                    return await originalCreateInvoice.apply(this, args);
                } finally {
                    setTimeout(() => {
                        pendingSubmissions.delete(key);
                    }, config.lockoutDuration);
                }
            };
        }
    }

    /**
     * Show notification
     */
    function showNotification(message, type = 'info') {
        // Try to use existing toast system
        if (window.showInvoiceToast) {
            window.showInvoiceToast(message, type);
        } else if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }

    /**
     * Initialize protection on page load
     */
    function initialize() {
        // Add spinner animation if not exists
        if (!document.querySelector('style[data-spinner]')) {
            const style = document.createElement('style');
            style.setAttribute('data-spinner', 'true');
            style.textContent = `
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Protect all forms
        document.querySelectorAll('form').forEach(protectForm);
        
        // Protect specific buttons
        const buttonsToProtect = [
            'button[onclick*="createLightning"]',
            'button[onclick*="createInvoice"]',
            'button[onclick*="purchase"]',
            'button[onclick*="submit"]',
            'button[type="submit"]',
            '.purchase-button',
            '.submit-button',
            '#purchaseButton',
            '#submitButton'
        ];
        
        buttonsToProtect.forEach(selector => {
            document.querySelectorAll(selector).forEach(protectButton);
        });
        
        // Protect invoice creation
        protectInvoiceCreation();
        
        // Observe DOM for new forms/buttons
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        if (node.tagName === 'FORM') {
                            protectForm(node);
                        } else if (node.tagName === 'BUTTON') {
                            protectButton(node);
                        }
                        
                        // Check children
                        if (node.querySelectorAll) {
                            node.querySelectorAll('form').forEach(protectForm);
                            node.querySelectorAll('button').forEach(protectButton);
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Public API
     */
    window.doubleSubmitPrevention = {
        config: config,
        reset: () => {
            pendingSubmissions.clear();
            submissionHistory.clear();
            console.log('Double-submit prevention reset');
        },
        getStatus: () => ({
            pending: pendingSubmissions.size,
            history: submissionHistory.size
        }),
        protectButton: protectButton,
        protectForm: protectForm
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    console.log('✅ Double-submit prevention initialized');
})();