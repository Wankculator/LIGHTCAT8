// Test utilities and helpers for comprehensive test suite

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

class TestUtils {
    /**
     * Generate a valid RGB invoice for testing
     */
    static generateRGBInvoice() {
        const randomHex = crypto.randomBytes(16).toString('hex');
        return `rgb:utxob:${randomHex}:transfer/consignment`;
    }
    
    /**
     * Generate a valid Lightning invoice for testing
     */
    static generateLightningInvoice() {
        const prefix = 'lnbc';
        const amount = '2000000n'; // 2000 sats in nanosats
        const randomData = crypto.randomBytes(32).toString('hex');
        return `${prefix}${amount}1${randomData}`;
    }
    
    /**
     * Generate a valid Bitcoin address
     */
    static generateBitcoinAddress(type = 'segwit') {
        const types = {
            segwit: 'bc1',
            legacy: '1',
            p2sh: '3'
        };
        const prefix = types[type] || types.segwit;
        const randomData = crypto.randomBytes(20).toString('hex');
        return `${prefix}${randomData}`.substring(0, 42);
    }
    
    /**
     * Generate a test JWT token
     */
    static generateTestToken(payload = {}, secret = 'test-secret') {
        const defaultPayload = {
            userId: 'test-user-123',
            walletAddress: this.generateBitcoinAddress(),
            tier: 'bronze',
            ...payload
        };
        return jwt.sign(defaultPayload, secret, { expiresIn: '1h' });
    }
    
    /**
     * Generate test game score data
     */
    static generateGameScore(tier = 'bronze') {
        const scores = {
            bronze: 12,
            silver: 19,
            gold: 29
        };
        return {
            score: scores[tier] || 12,
            time: 30000,
            coinsCollected: Math.floor(Math.random() * 50),
            tier: tier
        };
    }
    
    /**
     * Mock Supabase response
     */
    static mockSupabaseResponse(data = {}, error = null) {
        return {
            data: error ? null : data,
            error: error,
            count: Array.isArray(data) ? data.length : null
        };
    }
    
    /**
     * Mock BTCPay Server response
     */
    static mockBTCPayResponse(status = 'pending') {
        return {
            id: crypto.randomUUID(),
            invoice: this.generateLightningInvoice(),
            status: status,
            amount: 2000,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            btcPaid: status === 'paid' ? '0.00002' : '0',
            btcDue: status === 'paid' ? '0' : '0.00002'
        };
    }
    
    /**
     * Mock RGB consignment data
     */
    static mockRGBConsignment() {
        const consignmentData = {
            assetId: 'rgb:uQsgEYWo-T6mnwCS-N6mH90J-w6fAeQJ-p53B8gi-UKIY7Po',
            amount: 700,
            recipient: this.generateBitcoinAddress(),
            timestamp: new Date().toISOString()
        };
        return Buffer.from(JSON.stringify(consignmentData)).toString('base64');
    }
    
    /**
     * Create mock Express request object
     */
    static mockRequest(overrides = {}) {
        return {
            body: {},
            query: {},
            params: {},
            headers: {
                'user-agent': 'test-agent',
                'x-forwarded-for': '127.0.0.1'
            },
            ip: '127.0.0.1',
            method: 'GET',
            url: '/',
            ...overrides
        };
    }
    
    /**
     * Create mock Express response object
     */
    static mockResponse() {
        const res = {
            statusCode: 200,
            headers: {},
            body: null
        };
        
        res.status = jest.fn((code) => {
            res.statusCode = code;
            return res;
        });
        
        res.json = jest.fn((data) => {
            res.body = data;
            return res;
        });
        
        res.send = jest.fn((data) => {
            res.body = data;
            return res;
        });
        
        res.set = jest.fn((key, value) => {
            res.headers[key] = value;
            return res;
        });
        
        res.header = res.set;
        
        return res;
    }
    
    /**
     * Wait for async operations
     */
    static async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Clean up test data
     */
    static async cleanupTestData(supabase) {
        if (!supabase) return;
        
        try {
            // Clean test purchases
            await supabase
                .from('purchases')
                .delete()
                .like('wallet_address', 'test-%');
                
            // Clean test invoices
            await supabase
                .from('lightning_invoices')
                .delete()
                .like('id', 'test-%');
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    }
}

module.exports = TestUtils;