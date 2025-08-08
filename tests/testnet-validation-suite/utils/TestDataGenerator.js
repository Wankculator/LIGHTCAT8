/**
 * TestDataGenerator - Utility for generating test data
 * 
 * Generates various test data types:
 * - Valid RGB invoices
 * - Invalid test data for edge cases
 * - Mock payment data
 * - Test user profiles
 * - Consignment test data
 */

const crypto = require('crypto');

class TestDataGenerator {
  constructor() {
    this.testSequence = 0;
    this.generatedData = new Set(); // Track generated data to avoid duplicates
  }

  /**
   * Generate a valid RGB invoice for testing
   */
  generateRGBInvoice(options = {}) {
    const {
      format = 'utxob', // 'utxob', 'base64', 'rgb20'
      includeAmount = false,
      customData = null
    } = options;

    this.testSequence++;
    const timestamp = Date.now();
    const testId = `test_${this.testSequence}_${timestamp}`;

    switch (format) {
      case 'utxob':
        return this.generateUtxobInvoice(testId, options);
      case 'base64':
        return this.generateBase64Invoice(testId, options);
      case 'rgb20':
        return this.generateRgb20Invoice(testId, options);
      default:
        return this.generateUtxobInvoice(testId, options);
    }
  }

  /**
   * Generate RGB UTXOB format invoice
   */
  generateUtxobInvoice(testId, options = {}) {
    const { includeAmount, customBlindingFactor } = options;
    
    // Generate blinded UTXO
    const blindingFactor = customBlindingFactor || crypto.randomBytes(32).toString('hex');
    const utxoId = crypto.randomBytes(32).toString('hex');
    const vout = Math.floor(Math.random() * 4);
    
    // Construct UTXOB invoice
    let invoice = `rgb:utxob:${utxoId}:${vout}:${blindingFactor}`;
    
    if (includeAmount) {
      invoice += `:${700}`; // Default batch amount
    }

    // Add test metadata in comments (won't affect validity)
    invoice += `#test=${testId}`;

    this.generatedData.add(invoice);
    return invoice;
  }

  /**
   * Generate RGB Base64 format invoice
   */
  generateBase64Invoice(testId, options = {}) {
    const { includeMetadata } = options;
    
    const invoiceData = {
      version: 1,
      network: 'testnet',
      assetId: 'rgb:uQsgEYWo-T6mnwCS-N6mH90J-w6fAeQJ-p53B8gi-UKIY7Po',
      amount: 700,
      blindingKey: crypto.randomBytes(32).toString('hex'),
      derivationPath: 'm/84\'/1\'/0\'/0/0',
      timestamp: Date.now(),
      testId: testId
    };

    if (includeMetadata) {
      invoiceData.metadata = {
        purpose: 'LIGHTCAT Token Purchase',
        batchSize: 700,
        testEnvironment: true
      };
    }

    const jsonString = JSON.stringify(invoiceData);
    const base64Data = Buffer.from(jsonString).toString('base64');
    
    const invoice = `rgb:${base64Data}`;
    
    this.generatedData.add(invoice);
    return invoice;
  }

  /**
   * Generate RGB20 format invoice
   */
  generateRgb20Invoice(testId, options = {}) {
    const { contractId, iface } = options;
    
    const defaultContractId = contractId || crypto.randomBytes(32).toString('hex');
    const defaultIface = iface || 'RGB20';
    
    const invoice = `rgb20:${defaultContractId}:${defaultIface}:${testId}:${Date.now()}`;
    
    this.generatedData.add(invoice);
    return invoice;
  }

  /**
   * Generate invalid RGB invoice for negative testing
   */
  generateInvalidRGBInvoice(invalidType = 'format') {
    this.testSequence++;
    
    switch (invalidType) {
      case 'format':
        return 'invalid-rgb-format-test-' + this.testSequence;
      
      case 'empty':
        return '';
      
      case 'null':
        return null;
      
      case 'too_long':
        return 'rgb:' + 'x'.repeat(2000);
      
      case 'malformed_utxob':
        return 'rgb:utxob:invalid:format:test';
      
      case 'invalid_base64':
        return 'rgb:invalid-base64-data!!!';
      
      case 'wrong_network':
        return 'btc:utxob:' + crypto.randomBytes(32).toString('hex') + ':0:' + crypto.randomBytes(32).toString('hex');
      
      case 'missing_parts':
        return 'rgb:utxob:' + crypto.randomBytes(32).toString('hex');
      
      default:
        return 'invalid-test-' + this.testSequence;
    }
  }

  /**
   * Generate test purchase request
   */
  generatePurchaseRequest(options = {}) {
    const {
      batchCount = 1,
      useValidInvoice = true,
      includeIdempotencyKey = false,
      customTestId = null
    } = options;

    this.testSequence++;
    const testId = customTestId || `purchase_test_${this.testSequence}`;

    const request = {
      rgbInvoice: useValidInvoice 
        ? this.generateRGBInvoice() 
        : this.generateInvalidRGBInvoice(),
      batchCount: batchCount,
      testId: testId
    };

    if (includeIdempotencyKey) {
      request.idempotencyKey = `idem_${testId}_${Date.now()}`;
    }

    return request;
  }

  /**
   * Generate test user profile
   */
  generateTestUser(options = {}) {
    const {
      includeGameTier = true,
      includeWalletAddress = true,
      customUserId = null
    } = options;

    this.testSequence++;
    const userId = customUserId || `test_user_${this.testSequence}`;

    const user = {
      userId: userId,
      email: `${userId}@test.lightcat.com`,
      createdAt: new Date(),
      testData: true
    };

    if (includeGameTier) {
      user.gameTier = this.generateGameTier();
      user.gameScore = this.generateGameScore(user.gameTier);
    }

    if (includeWalletAddress) {
      user.walletAddress = this.generateTestWalletAddress();
    }

    return user;
  }

  /**
   * Generate game tier for testing
   */
  generateGameTier() {
    const tiers = ['bronze', 'silver', 'gold'];
    return tiers[Math.floor(Math.random() * tiers.length)];
  }

  /**
   * Generate game score based on tier
   */
  generateGameScore(tier) {
    switch (tier) {
      case 'bronze':
        return 11 + Math.floor(Math.random() * 7); // 11-17
      case 'silver':
        return 18 + Math.floor(Math.random() * 10); // 18-27
      case 'gold':
        return 28 + Math.floor(Math.random() * 22); // 28-49
      default:
        return Math.floor(Math.random() * 50);
    }
  }

  /**
   * Generate test wallet address
   */
  generateTestWalletAddress(type = 'bitcoin') {
    switch (type) {
      case 'bitcoin':
        return this.generateBitcoinAddress();
      case 'rgb':
        return this.generateRgbAddress();
      default:
        return this.generateBitcoinAddress();
    }
  }

  /**
   * Generate test Bitcoin address
   */
  generateBitcoinAddress() {
    // Generate testnet bech32 address (simplified)
    const hash = crypto.randomBytes(20);
    const prefix = 'tb1q'; // testnet bech32 prefix
    const address = prefix + this.bech32Encode(hash);
    return address.substring(0, 62); // Proper length
  }

  /**
   * Generate test RGB address
   */
  generateRgbAddress() {
    const hash = crypto.randomBytes(32).toString('hex');
    return `rgb:${hash}`;
  }

  /**
   * Generate mock consignment data
   */
  generateMockConsignment(options = {}) {
    const {
      tokenAmount = 700,
      recipient = null,
      includeMetadata = true
    } = options;

    const consignmentData = {
      version: 1,
      assetId: 'rgb:uQsgEYWo-T6mnwCS-N6mH90J-w6fAeQJ-p53B8gi-UKIY7Po',
      amount: tokenAmount,
      recipient: recipient || this.generateRGBInvoice(),
      timestamp: Date.now(),
      contractCommitment: crypto.randomBytes(32).toString('hex'),
      stateTransition: crypto.randomBytes(64).toString('hex'),
      blindingFactors: Array.from({ length: 3 }, () => crypto.randomBytes(32).toString('hex')),
      testData: true
    };

    if (includeMetadata) {
      consignmentData.metadata = {
        purpose: 'LIGHTCAT Token Distribution',
        batchNumber: Math.floor(Math.random() * 1000),
        distributionId: crypto.randomBytes(16).toString('hex')
      };
    }

    // Convert to binary format
    const jsonString = JSON.stringify(consignmentData);
    const header = Buffer.from('RGB_CONSIGNMENT_V1');
    const data = Buffer.from(jsonString);
    
    return Buffer.concat([header, data]);
  }

  /**
   * Generate test Lightning invoice
   */
  generateMockLightningInvoice(options = {}) {
    const {
      amount = 2000,
      description = 'LIGHTCAT Token Purchase',
      expiry = 3600
    } = options;

    this.testSequence++;
    const timestamp = Math.floor(Date.now() / 1000);
    const paymentHash = crypto.randomBytes(32).toString('hex');
    
    // Simplified BOLT11 format (not a real implementation)
    const invoice = `lnbc${amount}n${timestamp}${paymentHash.substring(0, 20)}test${this.testSequence}`;
    
    return {
      payment_request: invoice,
      payment_hash: paymentHash,
      amount_sat: amount,
      description: description,
      expiry: expiry,
      created_at: new Date(),
      test_data: true
    };
  }

  /**
   * Generate batch test data
   */
  generateBatchTestData(count, dataType = 'rgb_invoices') {
    const batchData = [];
    
    for (let i = 0; i < count; i++) {
      switch (dataType) {
        case 'rgb_invoices':
          batchData.push(this.generateRGBInvoice({ 
            customData: `batch_${i}` 
          }));
          break;
          
        case 'purchase_requests':
          batchData.push(this.generatePurchaseRequest({ 
            customTestId: `batch_purchase_${i}` 
          }));
          break;
          
        case 'test_users':
          batchData.push(this.generateTestUser({ 
            customUserId: `batch_user_${i}` 
          }));
          break;
          
        case 'lightning_invoices':
          batchData.push(this.generateMockLightningInvoice({ 
            description: `Batch Lightning Invoice ${i}` 
          }));
          break;
          
        default:
          batchData.push({ id: i, type: dataType, data: `test_data_${i}` });
      }
    }
    
    return batchData;
  }

  /**
   * Generate edge case test data
   */
  generateEdgeCaseData(edgeCaseType) {
    switch (edgeCaseType) {
      case 'boundary_values':
        return {
          minBatchCount: 1,
          maxBatchCount: 10,
          zeroAmount: 0,
          maxSupply: 21_000_000,
          minAmount: 1,
          maxAmount: 20_000_000
        };
        
      case 'special_characters':
        return {
          rgbInvoiceWithSpecialChars: 'rgb:test+/=_-special',
          unicodeInvoice: 'rgb:test_ü€¢ñ',
          emptyString: '',
          whitespace: '   ',
          newlines: 'rgb:test\n\r\t'
        };
        
      case 'large_data':
        return {
          largeInvoice: 'rgb:' + 'x'.repeat(1000),
          hugeBatchCount: 999999,
          massiveAmount: 999999999
        };
        
      case 'timing_edge_cases':
        return {
          pastTimestamp: Date.now() - 86400000, // 24 hours ago
          futureTimestamp: Date.now() + 86400000, // 24 hours future
          zeroTimestamp: 0,
          negativeTimestamp: -1
        };
        
      default:
        return { type: edgeCaseType, generated: true };
    }
  }

  /**
   * Generate performance test data
   */
  generatePerformanceTestData(config = {}) {
    const {
      userCount = 100,
      transactionCount = 1000,
      includeVariations = true
    } = config;

    const performanceData = {
      users: [],
      transactions: [],
      metadata: {
        generatedAt: new Date(),
        userCount: userCount,
        transactionCount: transactionCount,
        testPurpose: 'performance_validation'
      }
    };

    // Generate test users
    for (let i = 0; i < userCount; i++) {
      performanceData.users.push(this.generateTestUser({
        customUserId: `perf_user_${i}`
      }));
    }

    // Generate test transactions
    for (let i = 0; i < transactionCount; i++) {
      const batchCount = includeVariations 
        ? Math.floor(Math.random() * 5) + 1 
        : 1;
        
      performanceData.transactions.push({
        id: `perf_tx_${i}`,
        rgbInvoice: this.generateRGBInvoice(),
        batchCount: batchCount,
        expectedAmount: batchCount * 700,
        expectedPrice: batchCount * 2000,
        userId: `perf_user_${Math.floor(Math.random() * userCount)}`,
        timestamp: Date.now() + (i * 1000) // Spread over time
      });
    }

    return performanceData;
  }

  /**
   * Clear generated data cache
   */
  clearGeneratedData() {
    this.generatedData.clear();
    this.testSequence = 0;
  }

  /**
   * Get generation statistics
   */
  getGenerationStats() {
    return {
      totalGenerated: this.generatedData.size,
      currentSequence: this.testSequence,
      uniqueItems: this.generatedData.size
    };
  }

  // Helper methods
  bech32Encode(hash) {
    // Simplified bech32 encoding (not a complete implementation)
    return hash.toString('hex').substring(0, 50);
  }

  /**
   * Validate generated data
   */
  validateGeneratedData(data, type) {
    switch (type) {
      case 'rgb_invoice':
        return data && typeof data === 'string' && data.startsWith('rgb:');
      case 'purchase_request':
        return data && data.rgbInvoice && data.batchCount && data.testId;
      case 'user':
        return data && data.userId && data.email;
      default:
        return !!data;
    }
  }
}

module.exports = TestDataGenerator;