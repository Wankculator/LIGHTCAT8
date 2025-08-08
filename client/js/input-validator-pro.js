// This file requires memory-safe-events.js to be loaded first
/**
 * Professional Input Validation System
 * Comprehensive validation for all user inputs
 * LIGHTCAT Security Implementation
 */

class InputValidatorPro {
    constructor() {
        // Validation patterns
        this.patterns = {
            // Bitcoin addresses
            bitcoin: {
                p2pkh: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34
    
    /**
     * Clean up resources and event listeners
     */
    cleanup() {
        // Clean up all event listeners for this component
        window.SafeEvents.cleanup();
    }
}$/,
                p2sh: /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/,
                bech32: /^bc1[a-z0-9]{39,59}$/,
                bech32m: /^bc1p[a-z0-9]{38,58}$/,
                testnet: /^[mn2][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
                testnetBech32: /^tb1[a-z0-9]{39,59}$/
            },
            
            // RGB Protocol - Updated to accept all valid RGB invoice formats
            // Formats: rgb:utxob:..., rgb1q..., or complex format with slashes and special chars
            rgbInvoice: /^rgb[1:][\w\-+/:.]+$/,
            
            // Lightning
            lightningInvoice: /^ln(bc|tb)[0-9]+[a-z0-9]+$/,
            
            // Email
            email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
            
            // Numbers
            integer: /^-?\d+$/,
            decimal: /^-?\d+(\.\d+)?$/,
            positive: /^\d+$/,
            
            // Security
            alphanumeric: /^[a-zA-Z0-9]+$/,
            hex: /^[0-9a-fA-F]+$/,
            base64: /^[A-Za-z0-9+/]+=*$/,
            
            // Dangerous patterns to block
            sqlInjection: /(\b(union|select|insert|update|delete|drop|exec|script)\b)|(-{2})|(\|\|)|(\/\*)|(\*\/)/i,
            xss: /<script|javascript:|onerror=|onclick=|<iframe|<object|<embed/i,
            pathTraversal: /\.\.[\/\\]/
        };

        // Sanitizers
        this.setupSanitizers();
    }

    /**
     * Validate Bitcoin address
     * @param {string} address - Bitcoin address
     * @returns {Object} Validation result
     */
    validateBitcoinAddress(address) {
        if (!address || typeof address !== 'string') {
            return { valid: false, error: 'Invalid address format' };
        }

        address = address.trim();

        // Check mainnet addresses
        if (this.patterns.bitcoin.p2pkh.test(address) || 
            this.patterns.bitcoin.p2sh.test(address) || 
            this.patterns.bitcoin.bech32.test(address) || 
            this.patterns.bitcoin.bech32m.test(address)) {
            return { valid: true, type: 'mainnet', format: this.getAddressType(address) };
        }

        // Check testnet addresses
        if (this.patterns.bitcoin.testnet.test(address) || 
            this.patterns.bitcoin.testnetBech32.test(address)) {
            return { valid: true, type: 'testnet', format: this.getAddressType(address) };
        }

        return { valid: false, error: 'Invalid Bitcoin address' };
    }

    /**
     * Get Bitcoin address type
     * @param {string} address - Bitcoin address
     * @returns {string} Address type
     */
    getAddressType(address) {
        if (address.startsWith('1')) return 'p2pkh';
        if (address.startsWith('3')) return 'p2sh';
        if (address.startsWith('bc1p')) return 'p2tr';
        if (address.startsWith('bc1')) return 'p2wpkh';
        if (address.startsWith('m') || address.startsWith('n')) return 'testnet-p2pkh';
        if (address.startsWith('2')) return 'testnet-p2sh';
        if (address.startsWith('tb1')) return 'testnet-segwit';
        return 'unknown';
    }

    /**
     * Validate RGB invoice
     * @param {string} invoice - RGB invoice
     * @returns {Object} Validation result
     */
    validateRGBInvoice(invoice) {
        if (!invoice || typeof invoice !== 'string') {
            return { valid: false, error: 'Invalid invoice format' };
        }

        invoice = invoice.trim();

        if (!this.patterns.rgbInvoice.test(invoice)) {
            return { valid: false, error: 'Invalid RGB invoice format. Must start with "rgb"' };
        }

        // Don't enforce strict structure as RGB invoices can have various formats
        // Just ensure it starts with rgb and has reasonable content
        if (invoice.length < 10) {
            return { valid: false, error: 'RGB invoice too short' };
        }

        return { valid: true, invoice: invoice };
    }

    /**
     * Validate Lightning invoice
     * @param {string} invoice - Lightning invoice
     * @returns {Object} Validation result
     */
    validateLightningInvoice(invoice) {
        if (!invoice || typeof invoice !== 'string') {
            return { valid: false, error: 'Invalid invoice format' };
        }

        invoice = invoice.trim().toLowerCase();

        if (!this.patterns.lightningInvoice.test(invoice)) {
            return { valid: false, error: 'Invalid Lightning invoice format' };
        }

        // Decode and validate (basic check)
        try {
            const network = invoice.startsWith('lnbc') ? 'mainnet' : 'testnet';
            return { valid: true, network };
        } catch (e) {
            return { valid: false, error: 'Invalid Lightning invoice encoding' };
        }
    }

    /**
     * Validate email address
     * @param {string} email - Email address
     * @returns {Object} Validation result
     */
    validateEmail(email) {
        if (!email || typeof email !== 'string') {
            return { valid: false, error: 'Invalid email format' };
        }

        email = email.trim().toLowerCase();

        if (!this.patterns.email.test(email)) {
            return { valid: false, error: 'Invalid email address' };
        }

        // Additional checks
        if (email.length > 254) {
            return { valid: false, error: 'Email address too long' };
        }

        const [local, domain] = email.split('@');
        if (local.length > 64) {
            return { valid: false, error: 'Local part too long' };
        }

        return { valid: true, normalized: email };
    }

    /**
     * Validate number input
     * @param {*} value - Value to validate
     * @param {Object} options - Validation options
     * @returns {Object} Validation result
     */
    validateNumber(value, options = {}) {
        const {
            min = -Infinity,
            max = Infinity,
            integer = false,
            positive = false
        } = options;

        // Convert to number
        const num = Number(value);

        if (isNaN(num)) {
            return { valid: false, error: 'Not a valid number' };
        }

        if (integer && !Number.isInteger(num)) {
            return { valid: false, error: 'Must be an integer' };
        }

        if (positive && num <= 0) {
            return { valid: false, error: 'Must be positive' };
        }

        if (num < min) {
            return { valid: false, error: `Must be at least ${min}` };
        }

        if (num > max) {
            return { valid: false, error: `Must be at most ${max}` };
        }

        return { valid: true, value: num };
    }

    /**
     * Check for dangerous patterns
     * @param {string} input - Input to check
     * @returns {Object} Security check result
     */
    checkSecurity(input) {
        if (typeof input !== 'string') {
            return { safe: true };
        }

        const threats = [];

        if (this.patterns.sqlInjection.test(input)) {
            threats.push('SQL injection attempt detected');
        }

        if (this.patterns.xss.test(input)) {
            threats.push('XSS attempt detected');
        }

        if (this.patterns.pathTraversal.test(input)) {
            threats.push('Path traversal attempt detected');
        }

        return {
            safe: threats.length === 0,
            threats
        };
    }

    /**
     * Sanitize HTML input
     * @param {string} input - Input to sanitize
     * @returns {string} Sanitized input
     */
    sanitizeHTML(input) {
        if (typeof input !== 'string') return '';

        // Create a temporary element
        const temp = document.createElement('div');
        temp.textContent = input;
        return temp.innerHTML;
    }

    /**
     * Sanitize for SQL
     * @param {string} input - Input to sanitize
     * @returns {string} Sanitized input
     */
    sanitizeSQL(input) {
        if (typeof input !== 'string') return '';

        return input
            .replace(/'/g, "''")
            .replace(/\\/g, '\\\\')
            .replace(/\0/g, '\\0')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\x1a/g, '\\Z');
    }

    /**
     * Setup input sanitizers on DOM elements
     */
    setupSanitizers() {
        // Auto-sanitize all inputs
        window.SafeEvents.on(document, 'input', (e) => {
            if (e.target.matches('input, textarea')) {
                this.sanitizeInput(e.target);
            }
        });

        // Prevent paste of dangerous content
        window.SafeEvents.on(document, 'paste', (e) => {
            if (e.target.matches('input, textarea')) {
                e.preventDefault();
                const text = (e.clipboardData || window.clipboardData).getData('text');
                const sanitized = this.sanitizeForInput(text, e.target);
                e.target.value = sanitized;
            }
        });
    }

    /**
     * Sanitize input element
     * @param {HTMLElement} element - Input element
     */
    sanitizeInput(element) {
        const type = element.getAttribute('data-validate');
        if (!type) return;

        let value = element.value;
        let sanitized = value;

        switch (type) {
            case 'bitcoin':
                sanitized = value.replace(/[^a-zA-Z0-9]/g, '');
                break;
            case 'number':
                sanitized = value.replace(/[^0-9.-]/g, '');
                break;
            case 'email':
                sanitized = value.toLowerCase().trim();
                break;
            case 'alphanumeric':
                sanitized = value.replace(/[^a-zA-Z0-9]/g, '');
                break;
        }

        if (sanitized !== value) {
            element.value = sanitized;
        }
    }

    /**
     * Sanitize for specific input type
     * @param {string} text - Text to sanitize
     * @param {HTMLElement} element - Target element
     * @returns {string} Sanitized text
     */
    sanitizeForInput(text, element) {
        const type = element.getAttribute('data-validate');
        
        // Check security first
        const security = this.checkSecurity(text);
        if (!security.safe) {
            console.warn('Security threat blocked:', security.threats);
            return '';
        }

        // Apply type-specific sanitization
        switch (type) {
            case 'bitcoin':
                return text.replace(/[^a-zA-Z0-9]/g, '');
            case 'number':
                return text.replace(/[^0-9.-]/g, '');
            case 'email':
                return text.toLowerCase().trim();
            default:
                return this.sanitizeHTML(text);
        }
    }

    /**
     * Validate form data
     * @param {Object} data - Form data
     * @param {Object} rules - Validation rules
     * @returns {Object} Validation result
     */
    validateForm(data, rules) {
        const errors = {};
        const validated = {};

        for (const [field, rule] of Object.entries(rules)) {
            const value = data[field];
            const result = this.validateField(value, rule);

            if (!result.valid) {
                errors[field] = result.error;
            } else {
                validated[field] = result.value !== undefined ? result.value : value;
            }
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors,
            data: validated
        };
    }

    /**
     * Validate single field
     * @param {*} value - Field value
     * @param {Object} rule - Validation rule
     * @returns {Object} Validation result
     */
    validateField(value, rule) {
        // Required check
        if (rule.required && (!value || value === '')) {
            return { valid: false, error: 'This field is required' };
        }

        // Type-specific validation
        if (rule.type) {
            switch (rule.type) {
                case 'bitcoin':
                    return this.validateBitcoinAddress(value);
                case 'rgb':
                    return this.validateRGBInvoice(value);
                case 'lightning':
                    return this.validateLightningInvoice(value);
                case 'email':
                    return this.validateEmail(value);
                case 'number':
                    return this.validateNumber(value, rule);
                default:
                    break;
            }
        }

        // Pattern validation
        if (rule.pattern && !rule.pattern.test(value)) {
            return { valid: false, error: rule.message || 'Invalid format' };
        }

        // Length validation
        if (rule.minLength && value.length < rule.minLength) {
            return { valid: false, error: `Must be at least ${rule.minLength} characters` };
        }

        if (rule.maxLength && value.length > rule.maxLength) {
            return { valid: false, error: `Must be at most ${rule.maxLength} characters` };
        }

        // Custom validation
        if (rule.custom && typeof rule.custom === 'function') {
            const customResult = rule.custom(value);
            if (customResult !== true) {
                return { valid: false, error: customResult || 'Invalid value' };
            }
        }

        return { valid: true, value };
    }
}

// Create global instance
window.InputValidator = new InputValidatorPro();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputValidatorPro;
}