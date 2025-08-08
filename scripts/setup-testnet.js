#!/usr/bin/env node

/**
 * Setup script for Bitcoin/RGB testnet configuration
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

async function setupTestnet() {
    console.log('🧪 Setting up LIGHTCAT for Bitcoin Testnet...\n');
    
    // Check if .env.testnet exists
    const testnetEnvPath = path.join(process.cwd(), '.env.testnet');
    const examplePath = path.join(process.cwd(), '.env.testnet.example');
    
    try {
        await fs.access(testnetEnvPath);
        console.log('⚠️  .env.testnet already exists. Backing up...');
        await fs.copyFile(testnetEnvPath, `${testnetEnvPath}.backup.${Date.now()}`);
    } catch (error) {
        // File doesn't exist, create from example
        console.log('📝 Creating .env.testnet from example...');
        const exampleContent = await fs.readFile(examplePath, 'utf8');
        
        // Generate secure random values
        const secrets = {
            TESTNET_JWT_SECRET: crypto.randomBytes(32).toString('hex'),
            TESTNET_JWT_REFRESH_SECRET: crypto.randomBytes(32).toString('hex'),
            TESTNET_SESSION_SECRET: crypto.randomBytes(32).toString('hex'),
            RGB_TESTNET_PASSWORD: crypto.randomBytes(16).toString('hex')
        };
        
        let content = exampleContent;
        Object.entries(secrets).forEach(([key, value]) => {
            content = content.replace(`\${${key}}`, value);
        });
        
        await fs.writeFile(testnetEnvPath, content);
        console.log('✅ Created .env.testnet with secure defaults');
    }
    
    // Create testnet startup script
    const startupScript = `#!/bin/bash
# Start LIGHTCAT in testnet mode

echo "🚀 Starting LIGHTCAT in Bitcoin Testnet mode..."

# Load testnet environment
export $(cat .env.testnet | grep -v '^#' | xargs)

# Start the application
npm run dev

echo "✅ LIGHTCAT running on testnet!"
echo "   Frontend: http://localhost:8082"
echo "   API: http://localhost:3000"
echo ""
echo "📋 Next steps:"
echo "1. Get testnet Bitcoin: https://testnet-faucet.mempool.co/"
echo "2. Create testnet RGB assets"
echo "3. Configure BTCPay testnet store"
`;
    
    await fs.writeFile('start-testnet.sh', startupScript);
    await fs.chmod('start-testnet.sh', '755');
    console.log('✅ Created start-testnet.sh script');
    
    // Create testnet test script
    const testScript = `#!/usr/bin/env node

/**
 * Test RGB payment flow on testnet
 */

const axios = require('axios');

async function testPaymentFlow() {
    console.log('🧪 Testing RGB payment flow on testnet...\\n');
    
    try {
        // 1. Create RGB invoice
        console.log('1️⃣ Creating RGB invoice...');
        const invoiceResponse = await axios.post('http://localhost:3000/api/rgb/invoice', {
            rgbInvoice: 'rgb:utxob:testnet-test-invoice',
            batchCount: 1,
            walletAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx', // Testnet address
            tier: 'bronze'
        }, {
            headers: { 'X-Network': 'testnet' }
        });
        
        console.log('✅ Invoice created:', invoiceResponse.data.invoiceId);
        console.log('   Lightning invoice:', invoiceResponse.data.lightningInvoice.substring(0, 50) + '...');
        console.log('   Amount:', invoiceResponse.data.amount, 'sats');
        
        // 2. Check payment status
        console.log('\\n2️⃣ Checking payment status...');
        const statusResponse = await axios.get(
            \`http://localhost:3000/api/rgb/invoice/\${invoiceResponse.data.invoiceId}/status\`
        );
        
        console.log('✅ Status:', statusResponse.data.status);
        
        console.log('\\n📋 Test completed successfully!');
        console.log('   Now pay the Lightning invoice with a testnet wallet');
        console.log('   Monitor status at: /api/rgb/invoice/' + invoiceResponse.data.invoiceId + '/status');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Run if called directly
if (require.main === module) {
    testPaymentFlow();
}

module.exports = { testPaymentFlow };
`;
    
    await fs.writeFile('test-testnet-payment.js', testScript);
    await fs.chmod('test-testnet-payment.js', '755');
    console.log('✅ Created test-testnet-payment.js script');
    
    // Create documentation
    const docs = `# 🧪 LIGHTCAT Testnet Setup Guide

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

\`\`\`bash
# Copy and edit testnet config
cp .env.testnet.example .env.testnet
nano .env.testnet

# Add your testnet credentials:
# - BTCPay testnet API key
# - Supabase credentials (same as prod)
# - RGB testnet asset ID (when available)
\`\`\`

### 2. Start in Testnet Mode

\`\`\`bash
# Use the startup script
./start-testnet.sh

# Or manually:
export $(cat .env.testnet | grep -v '^#' | xargs)
npm run dev
\`\`\`

### 3. Test Payment Flow

\`\`\`bash
# Run the test script
node test-testnet-payment.js

# This will:
# 1. Create an RGB invoice
# 2. Generate Lightning invoice
# 3. Show payment details
\`\`\`

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
- Ensure RGB node is running: \`rgb-node --network testnet\`
- Or enable mock mode: \`USE_MOCK_RGB=true\`

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
`;
    
    await fs.writeFile('TESTNET_GUIDE.md', docs);
    console.log('✅ Created TESTNET_GUIDE.md');
    
    console.log('\n✨ Testnet setup complete!\n');
    console.log('📋 Next steps:');
    console.log('1. Edit .env.testnet with your testnet credentials');
    console.log('2. Run: ./start-testnet.sh');
    console.log('3. Test payment flow: node test-testnet-payment.js');
    console.log('4. Read TESTNET_GUIDE.md for detailed instructions');
}

setupTestnet().catch(console.error);