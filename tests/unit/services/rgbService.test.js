// Unit tests for RGB Service

const RGBService = require('../../../server/services/rgbService');
const TestUtils = require('../../helpers/test-utils');
const crypto = require('crypto');

// Mock dependencies
jest.mock('crypto');
jest.mock('../../../server/utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
}));

describe('RGBService', () => {
    let rgbService;
    
    beforeEach(() => {
        rgbService = new RGBService();
        jest.clearAllMocks();
    });
    
    describe('validateRGBInvoice', () => {
        test('should validate correct RGB invoice format', () => {
            const validInvoice = TestUtils.generateRGBInvoice();
            const result = rgbService.validateRGBInvoice(validInvoice);
            expect(result).toBe(true);
        });
        
        test('should reject invalid RGB invoice format', () => {
            const invalidInvoices = [
                '',
                'invalid',
                'btc:123',
                'rgb:invalid',
                'rgb:',
                null,
                undefined
            ];
            
            invalidInvoices.forEach(invoice => {
                expect(rgbService.validateRGBInvoice(invoice)).toBe(false);
            });
        });
        
        test('should validate RGB invoice with specific pattern', () => {
            const invoice = 'rgb:utxob:abc123:transfer/consignment';
            expect(rgbService.validateRGBInvoice(invoice)).toBe(true);
        });
    });
    
    describe('parseRGBInvoice', () => {
        test('should parse valid RGB invoice', () => {
            const invoice = 'rgb:utxob:abc123:transfer/consignment';
            const parsed = rgbService.parseRGBInvoice(invoice);
            
            expect(parsed).toMatchObject({
                protocol: 'rgb',
                type: 'utxob',
                data: 'abc123',
                operation: 'transfer/consignment'
            });
        });
        
        test('should throw error for invalid invoice', () => {
            expect(() => {
                rgbService.parseRGBInvoice('invalid');
            }).toThrow('Invalid RGB invoice format');
        });
    });
    
    describe('generateConsignment', () => {
        test('should generate consignment for valid parameters', async () => {
            const params = {
                rgbInvoice: TestUtils.generateRGBInvoice(),
                amount: 700,
                recipientAddress: TestUtils.generateBitcoinAddress(),
                paymentHash: crypto.randomBytes(32).toString('hex')
            };
            
            const mockConsignment = TestUtils.mockRGBConsignment();
            rgbService.createConsignmentData = jest.fn().mockReturnValue(mockConsignment);
            
            const result = await rgbService.generateConsignment(params);
            
            expect(result).toHaveProperty('consignment');
            expect(result).toHaveProperty('assetId');
            expect(result).toHaveProperty('amount', 700);
            expect(result).toHaveProperty('timestamp');
        });
        
        test('should validate amount is positive', async () => {
            const params = {
                rgbInvoice: TestUtils.generateRGBInvoice(),
                amount: -100,
                recipientAddress: TestUtils.generateBitcoinAddress()
            };
            
            await expect(rgbService.generateConsignment(params))
                .rejects.toThrow('Invalid amount');
        });
        
        test('should validate recipient address', async () => {
            const params = {
                rgbInvoice: TestUtils.generateRGBInvoice(),
                amount: 700,
                recipientAddress: 'invalid-address'
            };
            
            await expect(rgbService.generateConsignment(params))
                .rejects.toThrow('Invalid recipient address');
        });
    });
    
    describe('verifyConsignment', () => {
        test('should verify valid consignment', async () => {
            const consignment = TestUtils.mockRGBConsignment();
            const result = await rgbService.verifyConsignment(consignment);
            
            expect(result).toHaveProperty('valid', true);
            expect(result).toHaveProperty('assetId');
            expect(result).toHaveProperty('amount');
        });
        
        test('should reject invalid consignment', async () => {
            const invalidConsignment = 'invalid-base64';
            const result = await rgbService.verifyConsignment(invalidConsignment);
            
            expect(result).toHaveProperty('valid', false);
            expect(result).toHaveProperty('error');
        });
    });
    
    describe('calculateBatchAmount', () => {
        test('should calculate correct token amount for batches', () => {
            expect(rgbService.calculateBatchAmount(1)).toBe(700);
            expect(rgbService.calculateBatchAmount(5)).toBe(3500);
            expect(rgbService.calculateBatchAmount(10)).toBe(7000);
        });
        
        test('should handle edge cases', () => {
            expect(rgbService.calculateBatchAmount(0)).toBe(0);
            expect(rgbService.calculateBatchAmount(-1)).toBe(0);
            expect(rgbService.calculateBatchAmount(null)).toBe(0);
        });
    });
    
    describe('getAssetId', () => {
        test('should return configured asset ID', () => {
            process.env.RGB_ASSET_ID = 'rgb:uQsgEYWo-T6mnwCS-N6mH90J-w6fAeQJ-p53B8gi-UKIY7Po';
            const assetId = rgbService.getAssetId();
            expect(assetId).toBe('rgb:uQsgEYWo-T6mnwCS-N6mH90J-w6fAeQJ-p53B8gi-UKIY7Po');
        });
        
        test('should return default asset ID if not configured', () => {
            delete process.env.RGB_ASSET_ID;
            const assetId = rgbService.getAssetId();
            expect(assetId).toBeTruthy();
            expect(assetId).toMatch(/^rgb:/);
        });
    });
    
    describe('validateBatchLimit', () => {
        test('should validate batch limits by tier', () => {
            expect(rgbService.validateBatchLimit('bronze', 5)).toBe(true);
            expect(rgbService.validateBatchLimit('bronze', 6)).toBe(false);
            
            expect(rgbService.validateBatchLimit('silver', 8)).toBe(true);
            expect(rgbService.validateBatchLimit('silver', 9)).toBe(false);
            
            expect(rgbService.validateBatchLimit('gold', 10)).toBe(true);
            expect(rgbService.validateBatchLimit('gold', 11)).toBe(false);
        });
        
        test('should reject invalid tier', () => {
            expect(rgbService.validateBatchLimit('platinum', 1)).toBe(false);
            expect(rgbService.validateBatchLimit(null, 1)).toBe(false);
        });
    });
    
    describe('createTransferData', () => {
        test('should create valid transfer data', () => {
            const transferData = rgbService.createTransferData({
                invoice: TestUtils.generateRGBInvoice(),
                batchCount: 5,
                recipientAddress: TestUtils.generateBitcoinAddress()
            });
            
            expect(transferData).toHaveProperty('invoice');
            expect(transferData).toHaveProperty('tokenAmount', 3500); // 5 * 700
            expect(transferData).toHaveProperty('recipientAddress');
            expect(transferData).toHaveProperty('timestamp');
            expect(transferData).toHaveProperty('assetId');
        });
    });
});