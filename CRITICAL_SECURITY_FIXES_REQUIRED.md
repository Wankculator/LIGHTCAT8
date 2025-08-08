# 🚨 CRITICAL SECURITY & FUNCTIONALITY FIXES REQUIRED

## IMMEDIATE ACTIONS NEEDED BEFORE LAUNCH

### 1. 🔐 ROTATE ALL EXPOSED CREDENTIALS (CRITICAL!)

**Exposed in codebase:**
```
BTCPay API Key: 1dpQWkChRWpEWiilo1D1ZlI0PEv7EOIIIhliMiD7LnM
Store ID: HNQsGSwdyQb8Vg3y6srogKjXCDXdARt9Q113N4urcUcG
xpub: xpub6CjGpeuifmhhvy9emDMrkoL5GkTdcXvtnuJLWoeywsZgXCVMBPQuLWRjkfKYfy5PBFt7umMushrbNCL8A6B1PwAyPeHhT8JUZsYL9ZU6XN1
```

**Actions:**
1. Log into Voltage/BTCPay and **regenerate ALL API keys**
2. Create new store if necessary
3. Never commit credentials to git

### 2. 🧪 SET UP REAL TESTNET TESTING

**Current State:** Everything is mocked - no real Bitcoin integration tested

**Required Steps:**
```bash
# 1. Configure for Bitcoin testnet
echo "RGB_NETWORK=testnet" >> .env
echo "USE_TESTNET=true" >> .env
echo "BTCPAY_NETWORK=testnet" >> .env

# 2. Get testnet Bitcoin
# Visit: https://coinfaucet.eu/en/btc-testnet/

# 3. Set up BTCPay testnet store
# Create new store on BTCPay with testnet enabled

# 4. Test real RGB invoice flow
# Generate real RGB testnet invoices
```

### 3. 🛠️ FIX MCP VALIDATION ISSUES

**Run these commands to see all issues:**
```bash
npm run mcp:validate-all
npm run mcp:security
npm run mcp:sprite
```

**Critical Fixes Needed:**
- Remove all Function() usage (8 instances)
- Fix Math.random() in crypto contexts (4 instances)
- Update npm packages (12 vulnerabilities)
- Add tests for payment routes

### 4. 🔧 FIX TEST SUITE

**The tests are failing due to import issues:**
```bash
# Fix the RGB service export
# In rgbService.js, change:
module.exports = new RGBService();
# To:
module.exports = RGBService;
```

### 5. 📋 TESTNET VALIDATION CHECKLIST

Before going to mainnet, you MUST:

- [ ] Generate real RGB testnet invoice
- [ ] Create Lightning invoice via BTCPay testnet
- [ ] Complete payment with testnet Bitcoin
- [ ] Verify RGB consignment generation
- [ ] Test game → purchase → payment flow
- [ ] Verify database records payment correctly
- [ ] Test webhook callbacks
- [ ] Validate rate limiting works
- [ ] Test error scenarios (expired, failed payments)
- [ ] Mobile device testing on testnet

### 6. 🚀 DEPLOYMENT READINESS

**DO NOT DEPLOY TO MAINNET UNTIL:**
1. ✅ All credentials rotated and secured
2. ✅ Testnet flow validated end-to-end
3. ✅ MCP validation passes (0 critical issues)
4. ✅ Test suite achieves 80%+ coverage
5. ✅ Security audit completed

## EXAMPLE TESTNET FLOW

```javascript
// 1. User provides RGB invoice (testnet)
const rgbInvoice = "rgb:utxob:testnet-invoice-data";

// 2. System creates Lightning invoice (testnet)
const lightningInvoice = await btcpayService.createInvoice({
    network: 'testnet',
    amount: 2000, // sats
    description: 'LIGHTCAT testnet purchase'
});

// 3. User pays with testnet Bitcoin
// Monitor payment status

// 4. Generate RGB consignment
const consignment = await rgbService.generateConsignment({
    network: 'testnet',
    invoice: rgbInvoice,
    amount: 700 // tokens
});

// 5. Deliver consignment file
```

## SECURITY BEST PRACTICES

1. **Use environment variables from secure sources:**
   ```bash
   # Use a secrets manager
   source /secure/vault/env-vars
   ```

2. **Never commit .env files:**
   ```bash
   echo ".env*" >> .gitignore
   git rm --cached .env*
   ```

3. **Implement key rotation:**
   - Rotate API keys every 90 days
   - Use separate keys for dev/test/prod
   - Monitor key usage

## TIMELINE ESTIMATE

- **Credential Rotation**: 1 hour
- **Testnet Setup**: 2-4 hours
- **Testing RGB Flow**: 4-8 hours
- **Fixing MCP Issues**: 4-6 hours
- **Test Suite Fixes**: 2-3 hours

**Total: 1-2 days of focused work**

## SUPPORT RESOURCES

- RGB Protocol Testnet: https://rgb.tech/testnet
- BTCPay Testnet Guide: https://docs.btcpayserver.org/Development/
- Bitcoin Testnet Faucet: https://testnet-faucet.mempool.co/
- Lightning Testnet: https://htlc.me/

---

⚠️ **WARNING**: The platform is NOT ready for mainnet until these issues are resolved. Running with exposed credentials and untested payment flows risks total loss of funds and security breaches.