// Test environment setup
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.BTCPAY_SERVER_URL = 'https://test-btcpay.local';
process.env.BTCPAY_API_KEY = 'test-api-key';
process.env.BTCPAY_STORE_ID = 'test-store-id';

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Global test utilities
global.testUtils = {
  generateRandomInvoice: () => `rgb:utxob:test-${Date.now()}`,
  generateLightningInvoice: () => `lnbc${Date.now()}test`,
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Mock crypto for tests
if (!global.crypto) {
  global.crypto = {
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }
  };
}