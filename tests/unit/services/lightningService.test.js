// Unit tests for Lightning Service

const LightningService = require('../../../server/services/lightningService');
const TestUtils = require('../../helpers/test-utils');
const axios = require('axios');

// Mock dependencies
jest.mock('axios');
jest.mock('../../../server/utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
}));

describe('LightningService', () => {
    let lightningService;
    
    beforeEach(() => {
        lightningService = new LightningService();
        jest.clearAllMocks();
        
        // Set test environment variables
        process.env.BTCPAY_URL = 'https://btcpay.test.com';
        process.env.BTCPAY_API_KEY = 'test-api-key';
        process.env.BTCPAY_STORE_ID = 'test-store-id';
    });
    
    describe('createInvoice', () => {
        test('should create Lightning invoice with correct parameters', async () => {
            const mockResponse = TestUtils.mockBTCPayResponse('pending');
            axios.post.mockResolvedValue({ data: mockResponse });
            
            const result = await lightningService.createInvoice({
                amount: 2000,
                description: 'LIGHTCAT: 1 batch (700 tokens)',
                metadata: { batchCount: 1 }
            });
            
            expect(result).toHaveProperty('invoiceId');
            expect(result).toHaveProperty('invoice');
            expect(result).toHaveProperty('amount', 2000);
            expect(result).toHaveProperty('expiresAt');
            expect(result).toHaveProperty('status', 'pending');
            
            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/invoices'),
                expect.objectContaining({
                    amount: 2000,
                    currency: 'SAT'
                }),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'token test-api-key'
                    })
                })
            );
        });
        
        test('should handle BTCPay API errors', async () => {
            axios.post.mockRejectedValue(new Error('BTCPay API error'));
            
            await expect(lightningService.createInvoice({
                amount: 2000,
                description: 'Test invoice'
            })).rejects.toThrow('Failed to create Lightning invoice');
        });
        
        test('should validate amount is positive', async () => {
            await expect(lightningService.createInvoice({
                amount: -1000,
                description: 'Test'
            })).rejects.toThrow('Invalid amount');
        });
        
        test('should set correct expiry time', async () => {
            const mockResponse = TestUtils.mockBTCPayResponse('pending');
            axios.post.mockResolvedValue({ data: mockResponse });
            
            const result = await lightningService.createInvoice({
                amount: 2000,
                description: 'Test'
            });
            
            const expiresAt = new Date(result.expiresAt);
            const now = new Date();
            const diffMinutes = (expiresAt - now) / (1000 * 60);
            
            expect(diffMinutes).toBeGreaterThan(14);
            expect(diffMinutes).toBeLessThan(16);
        });
    });
    
    describe('checkPaymentStatus', () => {
        test('should return correct status for paid invoice', async () => {
            const mockResponse = TestUtils.mockBTCPayResponse('paid');
            axios.get.mockResolvedValue({ data: mockResponse });
            
            const result = await lightningService.checkPaymentStatus('test-invoice-id');
            
            expect(result).toHaveProperty('status', 'paid');
            expect(result).toHaveProperty('paid', true);
            expect(result).toHaveProperty('amount', 2000);
            
            expect(axios.get).toHaveBeenCalledWith(
                expect.stringContaining('/invoices/test-invoice-id'),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'token test-api-key'
                    })
                })
            );
        });
        
        test('should return correct status for pending invoice', async () => {
            const mockResponse = TestUtils.mockBTCPayResponse('pending');
            axios.get.mockResolvedValue({ data: mockResponse });
            
            const result = await lightningService.checkPaymentStatus('test-invoice-id');
            
            expect(result).toHaveProperty('status', 'pending');
            expect(result).toHaveProperty('paid', false);
        });
        
        test('should handle expired invoices', async () => {
            const mockResponse = {
                ...TestUtils.mockBTCPayResponse('expired'),
                expiresAt: new Date(Date.now() - 1000).toISOString()
            };
            axios.get.mockResolvedValue({ data: mockResponse });
            
            const result = await lightningService.checkPaymentStatus('test-invoice-id');
            
            expect(result).toHaveProperty('status', 'expired');
            expect(result).toHaveProperty('paid', false);
        });
        
        test('should handle API errors gracefully', async () => {
            axios.get.mockRejectedValue(new Error('Network error'));
            
            const result = await lightningService.checkPaymentStatus('test-invoice-id');
            
            expect(result).toHaveProperty('status', 'error');
            expect(result).toHaveProperty('error');
        });
    });
    
    describe('decodeInvoice', () => {
        test('should decode valid Lightning invoice', async () => {
            const invoice = TestUtils.generateLightningInvoice();
            const mockDecoded = {
                amount: 2000,
                description: 'LIGHTCAT purchase',
                expiresAt: new Date(Date.now() + 900000).toISOString(),
                paymentHash: 'abc123'
            };
            
            // Mock BTCPay decode endpoint
            axios.post.mockResolvedValue({ data: mockDecoded });
            
            const result = await lightningService.decodeInvoice(invoice);
            
            expect(result).toHaveProperty('amount');
            expect(result).toHaveProperty('description');
            expect(result).toHaveProperty('expiresAt');
        });
        
        test('should validate invoice format', async () => {
            await expect(lightningService.decodeInvoice('invalid'))
                .rejects.toThrow('Invalid Lightning invoice format');
        });
    });
    
    describe('calculateFees', () => {
        test('should calculate correct fees for different amounts', () => {
            expect(lightningService.calculateFees(1000)).toBe(10); // 1%
            expect(lightningService.calculateFees(2000)).toBe(20);
            expect(lightningService.calculateFees(10000)).toBe(100);
        });
        
        test('should have minimum fee', () => {
            expect(lightningService.calculateFees(100)).toBe(5); // Min 5 sats
            expect(lightningService.calculateFees(200)).toBe(5);
            expect(lightningService.calculateFees(500)).toBe(5);
        });
        
        test('should have maximum fee', () => {
            expect(lightningService.calculateFees(100000)).toBe(500); // Max 500 sats
            expect(lightningService.calculateFees(200000)).toBe(500);
        });
    });
    
    describe('validateWebhookSignature', () => {
        test('should validate correct webhook signature', () => {
            const payload = { status: 'paid', invoiceId: '123' };
            const secret = 'webhook-secret';
            const signature = crypto
                .createHmac('sha256', secret)
                .update(JSON.stringify(payload))
                .digest('hex');
            
            process.env.BTCPAY_WEBHOOK_SECRET = secret;
            
            const isValid = lightningService.validateWebhookSignature(
                JSON.stringify(payload),
                signature
            );
            
            expect(isValid).toBe(true);
        });
        
        test('should reject invalid signature', () => {
            const payload = { status: 'paid', invoiceId: '123' };
            process.env.BTCPAY_WEBHOOK_SECRET = 'webhook-secret';
            
            const isValid = lightningService.validateWebhookSignature(
                JSON.stringify(payload),
                'invalid-signature'
            );
            
            expect(isValid).toBe(false);
        });
    });
    
    describe('processWebhook', () => {
        test('should process paid invoice webhook', async () => {
            const webhookData = {
                type: 'InvoicePaid',
                invoiceId: 'test-123',
                btcPaid: '0.00002',
                status: 'paid'
            };
            
            const result = await lightningService.processWebhook(webhookData);
            
            expect(result).toHaveProperty('processed', true);
            expect(result).toHaveProperty('action', 'payment_confirmed');
            expect(result).toHaveProperty('invoiceId', 'test-123');
        });
        
        test('should ignore non-payment webhooks', async () => {
            const webhookData = {
                type: 'InvoiceCreated',
                invoiceId: 'test-123'
            };
            
            const result = await lightningService.processWebhook(webhookData);
            
            expect(result).toHaveProperty('processed', false);
            expect(result).toHaveProperty('reason', 'Not a payment event');
        });
    });
    
    describe('getInvoiceQR', () => {
        test('should generate QR code for Lightning invoice', async () => {
            const invoice = TestUtils.generateLightningInvoice();
            const qrCode = await lightningService.getInvoiceQR(invoice);
            
            expect(qrCode).toMatch(/^data:image\/png;base64,/);
            expect(qrCode.length).toBeGreaterThan(100);
        });
        
        test('should handle QR generation errors', async () => {
            await expect(lightningService.getInvoiceQR(null))
                .rejects.toThrow();
        });
    });
});