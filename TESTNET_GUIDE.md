# 🧪 LIGHTCAT Testnet Setup Guide

## Prerequisites

1. **Bitcoin Testnet Wallet**
   - Install: Sparrow Wallet, Electrum (testnet mode)
   - Get testnet Bitcoin: https://testnet-faucet.mempool.co/

2. **Lightning Testnet Wallet**
   - Phoenix Wallet (testnet)
   - Or use BTCPay testnet instance

3. **RGB Node (Optional)**
   - RGB node compiled for testnet
   - Or use mock mode initially

## Setup Steps

### 1. Configure Environment

```bash
# Copy and edit testnet config
cp .env.testnet.example .env.testnet
nano .env.testnet

# Add your testnet credentials:
# - BTCPay testnet API key
# - Supabase credentials (same as prod)
# - RGB testnet asset ID (when available)
```

### 2. Start in Testnet Mode

```bash
# Use the startup script
./start-testnet.sh

# Or manually:
export $(cat .env.testnet | grep -v '^#' | xargs)
npm run dev
```

### 3. Test Payment Flow

```bash
# Run the test script
node test-testnet-payment.js

# This will:
# 1. Create an RGB invoice
# 2. Generate Lightning invoice
# 3. Show payment details
```

### 4. Complete Payment

1. Copy the Lightning invoice from test output
2. Pay with testnet Lightning wallet
3. Monitor status endpoint for confirmation
4. Verify RGB consignment generation

## Testnet Resources

- **Bitcoin Testnet Faucet**: https://testnet-faucet.mempool.co/
- **Testnet Explorer**: https://mempool.space/testnet
- **Lightning Testnet**: https://htlc.me/
- **RGB Testnet Guide**: https://rgb.tech/testnet

## Troubleshooting

### "Cannot connect to RGB node"
- Ensure RGB node is running: `rgb-node --network testnet`
- Or enable mock mode: `USE_MOCK_RGB=true`

### "BTCPay connection failed"
- Verify testnet API credentials
- Check BTCPay testnet instance is running
- Try public testnet: https://testnet.btcpayserver.org

### "No testnet Bitcoin"
- Get from faucet: https://coinfaucet.eu/en/btc-testnet/
- Or ask in community channels

## Safety Notes

⚠️ **NEVER use mainnet credentials in testnet config**
⚠️ **NEVER send real Bitcoin to testnet addresses**
✅ **ALWAYS verify you're on testnet before testing**

## Next Steps

1. Complete successful testnet payment
2. Verify RGB token transfer
3. Test error scenarios
4. Load test with multiple payments
5. Document any issues found

Happy testing! 🚀
