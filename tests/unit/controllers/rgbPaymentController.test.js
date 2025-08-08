// Unit tests for RGB Payment Controller

const rgbPaymentController = require('../../../server/controllers/rgbPaymentController');
const TestUtils = require('../../helpers/test-utils');

// Mock services
jest.mock('../../../server/services/rgbService');
jest.mock('../../../server/services/lightningService');
jest.mock('../../../server/services/databaseService');
jest.mock('../../../server/utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
}));

const RGBService = require('../../../server/services/rgbService');
const LightningService = require('../../../server/services/lightningService');
const DatabaseService = require('../../../server/services/databaseService');

describe('RGB Payment Controller', () => {
    let req, res, mockRGBService, mockLightningService, mockDatabaseService;
    
    beforeEach(() => {
        req = TestUtils.mockRequest();
        res = TestUtils.mockResponse();
        
        mockRGBService = {
            validateRGBInvoice: jest.fn().mockReturnValue(true),
            parseRGBInvoice: jest.fn().mockReturnValue({
                protocol: 'rgb',
                type: 'utxob',
                data: 'test'
            }),
            generateConsignment: jest.fn().mockResolvedValue({
                consignment: TestUtils.mockRGBConsignment(),
                assetId: 'rgb:test',
                amount: 700
            }),
            validateBatchLimit: jest.fn().mockReturnValue(true),
            calculateBatchAmount: jest.fn().mockReturnValue(700)
        };
        
        mockLightningService = {
            createInvoice: jest.fn().mockResolvedValue({
                invoiceId: 'test-invoice-123',
                invoice: TestUtils.generateLightningInvoice(),
                amount: 2000,
                expiresAt: new Date(Date.now() + 900000).toISOString()
            }),
            checkPaymentStatus: jest.fn().mockResolvedValue({
                status: 'pending',
                paid: false
            }),
            getInvoiceQR: jest.fn().mockResolvedValue('data:image/png;base64,test')
        };
        
        mockDatabaseService = {
            createPurchase: jest.fn().mockResolvedValue({
                id: 'purchase-123',
                invoiceId: 'test-invoice-123'
            }),
            updatePurchaseStatus: jest.fn().mockResolvedValue(true),
            getPurchaseByInvoiceId: jest.fn().mockResolvedValue({
                id: 'purchase-123',
                status: 'pending'
            })
        };
        
        RGBService.mockImplementation(() => mockRGBService);
        LightningService.mockImplementation(() => mockLightningService);
        DatabaseService.mockImplementation(() => mockDatabaseService);
        
        req.rgbService = mockRGBService;
        req.lightningService = mockLightningService;
        req.databaseService = mockDatabaseService;
    });
    
    afterEach(() => {
        jest.clearAllMocks();
    });
    
    describe('createInvoice', () => {
        test('should create invoice for valid RGB invoice', async () => {
            req.body = {
                rgbInvoice: TestUtils.generateRGBInvoice(),
                batchCount: 1,
                walletAddress: TestUtils.generateBitcoinAddress()
            };
            
            await rgbPaymentController.createInvoice(req, res);
            
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                invoiceId: 'test-invoice-123',
                lightningInvoice: expect.any(String),
                amount: 2000,
                expiresAt: expect.any(String),
                qrCode: 'data:image/png;base64,test'
            });
            
            expect(mockRGBService.validateRGBInvoice).toHaveBeenCalledWith(req.body.rgbInvoice);
            expect(mockLightningService.createInvoice).toHaveBeenCalled();
            expect(mockDatabaseService.createPurchase).toHaveBeenCalled();
        });
        
        test('should reject invalid RGB invoice', async () => {
            req.body = {
                rgbInvoice: 'invalid-invoice',
                batchCount: 1
            };
            
            mockRGBService.validateRGBInvoice.mockReturnValue(false);
            
            await rgbPaymentController.createInvoice(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid RGB invoice format'
            });
        });
        
        test('should enforce batch limits by tier', async () => {
            req.body = {
                rgbInvoice: TestUtils.generateRGBInvoice(),
                batchCount: 10,
                tier: 'bronze'
            };
            
            mockRGBService.validateBatchLimit.mockReturnValue(false);
            
            await rgbPaymentController.createInvoice(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Batch count exceeds tier limit'
            });
        });
        
        test('should validate batch count range', async () => {
            req.body = {
                rgbInvoice: TestUtils.generateRGBInvoice(),
                batchCount: 0
            };
            
            await rgbPaymentController.createInvoice(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid batch count'
            });
        });
        
        test('should handle service errors gracefully', async () => {
            req.body = {
                rgbInvoice: TestUtils.generateRGBInvoice(),
                batchCount: 1
            };
            
            mockLightningService.createInvoice.mockRejectedValue(new Error('Service error'));
            
            await rgbPaymentController.createInvoice(req, res);
            
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Failed to create invoice'
            });
        });
    });
    
    describe('checkPaymentStatus', () => {
        test('should return pending status', async () => {
            req.params = { invoiceId: 'test-invoice-123' };
            
            await rgbPaymentController.checkPaymentStatus(req, res);
            
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                status: 'pending',
                consignment: null
            });
        });
        
        test('should return paid status with consignment', async () => {
            req.params = { invoiceId: 'test-invoice-123' };
            
            mockLightningService.checkPaymentStatus.mockResolvedValue({
                status: 'paid',
                paid: true
            });
            
            mockDatabaseService.getPurchaseByInvoiceId.mockResolvedValue({
                id: 'purchase-123',
                status: 'paid',
                rgb_invoice: TestUtils.generateRGBInvoice(),
                batch_count: 1,
                wallet_address: TestUtils.generateBitcoinAddress()
            });
            
            await rgbPaymentController.checkPaymentStatus(req, res);
            
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                status: 'paid',
                consignment: expect.any(String)
            });
            
            expect(mockRGBService.generateConsignment).toHaveBeenCalled();
            expect(mockDatabaseService.updatePurchaseStatus).toHaveBeenCalledWith(
                'purchase-123',
                'delivered'
            );
        });
        
        test('should handle expired invoices', async () => {
            req.params = { invoiceId: 'test-invoice-123' };
            
            mockLightningService.checkPaymentStatus.mockResolvedValue({
                status: 'expired',
                paid: false
            });
            
            await rgbPaymentController.checkPaymentStatus(req, res);
            
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                status: 'expired',
                consignment: null
            });
        });
        
        test('should handle missing invoice', async () => {
            req.params = { invoiceId: 'non-existent' };
            
            mockDatabaseService.getPurchaseByInvoiceId.mockResolvedValue(null);
            
            await rgbPaymentController.checkPaymentStatus(req, res);
            
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invoice not found'
            });
        });
    });
    
    describe('getStats', () => {
        test('should return current stats', async () => {
            mockDatabaseService.getSalesStats = jest.fn().mockResolvedValue({
                batches_sold: 100,
                tokens_sold: 70000,
                unique_wallets: 50,
                total_sats: 200000
            });
            
            await rgbPaymentController.getStats(req, res);
            
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                stats: {
                    totalSupply: 21000000,
                    batchesAvailable: 27800, // 27900 - 100
                    batchesSold: 100,
                    tokensSold: 70000,
                    uniqueBuyers: 50,
                    pricePerBatch: 2000,
                    tokensPerBatch: 700,
                    percentSold: expect.any(Number),
                    totalSatsReceived: 200000
                }
            });
        });
        
        test('should handle database errors', async () => {
            mockDatabaseService.getSalesStats = jest.fn()
                .mockRejectedValue(new Error('Database error'));
            
            await rgbPaymentController.getStats(req, res);
            
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Failed to fetch stats'
            });
        });
        
        test('should include pre-allocation in stats', async () => {
            mockDatabaseService.getSalesStats = jest.fn().mockResolvedValue({
                batches_sold: 0,
                tokens_sold: 0,
                unique_wallets: 0,
                total_sats: 0
            });
            
            await rgbPaymentController.getStats(req, res);
            
            const response = res.json.mock.calls[0][0];
            expect(response.stats.batchesSold).toBe(0);
            expect(response.stats.percentSold).toBeCloseTo(0, 2);
        });
    });
    
    describe('processWebhook', () => {
        test('should process payment webhook', async () => {
            req.body = {
                type: 'InvoicePaid',
                invoiceId: 'test-invoice-123',
                btcPaid: '0.00002'
            };
            
            req.headers['x-btcpay-signature'] = 'valid-signature';
            mockLightningService.validateWebhookSignature = jest.fn().mockReturnValue(true);
            mockLightningService.processWebhook = jest.fn().mockResolvedValue({
                processed: true,
                action: 'payment_confirmed'
            });
            
            await rgbPaymentController.processWebhook(req, res);
            
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                processed: true
            });
            
            expect(mockDatabaseService.updatePurchaseStatus).toHaveBeenCalledWith(
                expect.any(String),
                'paid'
            );
        });
        
        test('should reject invalid webhook signature', async () => {
            req.body = { type: 'InvoicePaid' };
            req.headers['x-btcpay-signature'] = 'invalid';
            
            mockLightningService.validateWebhookSignature = jest.fn().mockReturnValue(false);
            
            await rgbPaymentController.processWebhook(req, res);
            
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid webhook signature'
            });
        });
    });
});