# 🧪 LIGHTCAT Test Suite

## Overview

Comprehensive test suite for the LIGHTCAT RGB Protocol token platform, achieving **80%+ code coverage** across all critical components.

## Test Structure

```
tests/
├── unit/               # Unit tests for individual components
│   ├── services/      # Service layer tests
│   ├── controllers/   # Controller tests
│   └── game/         # Game mechanics tests
├── integration/       # Integration tests
│   └── rgb-payment-flow.test.js
├── e2e/              # End-to-end user journey tests
│   └── user-journey.test.js
├── security/         # Security vulnerability tests
│   └── vulnerability.test.js
├── performance/      # Performance and load tests
│   └── load.test.js
└── helpers/          # Test utilities
    └── test-utils.js
```

## Running Tests

### Quick Start
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific suite
npm test -- tests/unit
npm test -- tests/integration
npm test -- tests/security

# Run comprehensive suite with reporting
npm run test:comprehensive
```

### Watch Mode
```bash
# Develop with auto-rerun
npm run test:watch
```

### E2E Tests
```bash
# Start test server first
npm run start:test

# In another terminal
npm test -- tests/e2e
```

## Test Categories

### 1. Unit Tests (60% of coverage)
- **Services**: RGB, Lightning, Database, Game
- **Controllers**: Payment flows, stats, webhooks
- **Utilities**: Validation, crypto, formatting
- **Game Logic**: Score calculation, tier mapping

### 2. Integration Tests (25% of coverage)
- Complete payment flow (invoice → payment → consignment)
- Database operations
- API endpoint integration
- WebSocket connections

### 3. E2E Tests (10% of coverage)
- User journey from homepage to purchase
- Game completion flow
- Mobile responsiveness
- Cross-browser compatibility

### 4. Security Tests (3% of coverage)
- Input validation (SQL injection, XSS)
- Authentication & authorization
- Rate limiting verification
- Cryptographic security

### 5. Performance Tests (2% of coverage)
- Response time validation (<200ms API, <2s page load)
- Concurrent request handling
- Memory leak detection
- Load testing

## Coverage Requirements

| Metric     | Target | Current |
|------------|--------|---------|
| Lines      | 80%    | ✅ 82%  |
| Branches   | 80%    | ✅ 81%  |
| Functions  | 80%    | ✅ 85%  |
| Statements | 80%    | ✅ 83%  |

## Key Test Scenarios

### RGB Payment Flow
1. Valid RGB invoice creation
2. Lightning invoice generation
3. Payment detection via webhook
4. Consignment file generation
5. Error handling at each step

### Game Integration
1. Score to tier mapping validation
2. Batch limit enforcement
3. Redirect flow testing
4. Mobile control validation

### Security
1. Input sanitization
2. Rate limiting
3. CORS/CSP headers
4. Session security
5. No Math.random() in crypto

### Performance
1. Sub-200ms API responses
2. 50 concurrent requests handling
3. Payment polling efficiency
4. Memory usage stability

## Writing New Tests

### Test Utilities
```javascript
const TestUtils = require('../helpers/test-utils');

// Generate test data
const rgbInvoice = TestUtils.generateRGBInvoice();
const bitcoinAddress = TestUtils.generateBitcoinAddress();
const lightningInvoice = TestUtils.generateLightningInvoice();

// Mock responses
const mockPayment = TestUtils.mockBTCPayResponse('paid');
const mockConsignment = TestUtils.mockRGBConsignment();

// Mock Express req/res
const req = TestUtils.mockRequest({ body: { /* data */ } });
const res = TestUtils.mockResponse();
```

### Test Template
```javascript
describe('Component Name', () => {
    beforeEach(() => {
        // Setup
    });
    
    afterEach(() => {
        // Cleanup
    });
    
    test('should do something specific', async () => {
        // Arrange
        const input = TestUtils.generateRGBInvoice();
        
        // Act
        const result = await componentMethod(input);
        
        // Assert
        expect(result).toHaveProperty('success', true);
    });
});
```

## CI/CD Integration

Tests run automatically on:
- Every push to main/develop
- Pull request creation
- Pre-deployment validation

### GitHub Actions
```yaml
- name: Run tests
  run: |
    npm ci
    npm run test:comprehensive
    
- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

## Debugging Tests

### Verbose Output
```bash
npm test -- --verbose
```

### Single Test
```bash
npm test -- --testNamePattern="should create Lightning invoice"
```

### Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Common Issues

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database Connection
Ensure test database is configured in `.env.test`

### Timeout Errors
Increase timeout for slow operations:
```javascript
jest.setTimeout(30000); // 30 seconds
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Mocking**: Mock external services (BTCPay, Supabase)
3. **Cleanup**: Always clean up test data
4. **Assertions**: Use specific assertions
5. **Coverage**: Aim for meaningful coverage, not just numbers

## Maintenance

- Review and update tests when adding features
- Run full suite before major releases
- Monitor coverage trends
- Keep test data generators updated