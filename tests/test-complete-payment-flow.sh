#!/bin/bash

echo "🔍 Testing Complete Payment Flow"
echo "================================"
echo ""

# Test 1: Create game session
echo "1. Creating game session..."
SESSION_RESPONSE=$(curl -s -X POST http://localhost:3000/api/game/start \
  -H "Content-Type: application/json")
  
SESSION_ID=$(echo "$SESSION_RESPONSE" | jq -r '.sessionId // empty')

if [ -z "$SESSION_ID" ]; then
    echo "❌ Failed to create game session"
    echo "$SESSION_RESPONSE"
    exit 1
fi

echo "✅ Game session created: $SESSION_ID"

# Test 2: Submit a game score (Gold tier - 30 points)
echo ""
echo "2. Submitting game score (30 points - Gold tier)..."
SCORE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/game/score \
  -H "Content-Type: application/json" \
  -d "{
    \"score\": 30,
    \"sessionId\": \"$SESSION_ID\",
    \"gameData\": {
      \"duration\": 45000,
      \"actions\": $(seq 1 300 | jq -s '.'),
      \"checkpoints\": $(seq 1 10 | jq -Rs 'split("\n")[:-1] | map({score: (. | tonumber * 3), time: (. | tonumber * 4500)})')
    }
  }")

TIER=$(echo "$SCORE_RESPONSE" | jq -r '.tier // empty')
MAX_BATCHES=$(echo "$SCORE_RESPONSE" | jq -r '.maxBatches // empty')

echo "Response: $SCORE_RESPONSE"
echo "✅ Score submitted - Tier: $TIER, Max Batches: $MAX_BATCHES"

# Test 3: Create RGB invoice
echo ""
echo "3. Creating RGB invoice..."
INVOICE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/rgb/invoice \
  -H "Content-Type: application/json" \
  -d "{
    \"rgbInvoice\": \"rgb:utxob:2a1GCz-aZR78Mo-e4N7Lqp-BBoes5P-EfSgVuW-TtNFWQX\",
    \"batchCount\": 2,
    \"sessionId\": \"$SESSION_ID\"
  }")

echo "Invoice Response: $INVOICE_RESPONSE"

# Extract invoice details
INVOICE_UUID=$(echo "$INVOICE_RESPONSE" | jq -r '.uuid // empty')
LIGHTNING_INVOICE=$(echo "$INVOICE_RESPONSE" | jq -r '.lightningInvoice // empty')
AMOUNT_BTC=$(echo "$INVOICE_RESPONSE" | jq -r '.amount // empty')

if [ -z "$INVOICE_UUID" ]; then
    echo "❌ Failed to create invoice"
    echo "$INVOICE_RESPONSE"
else
    echo "✅ Invoice created:"
    echo "   UUID: $INVOICE_UUID"
    echo "   Amount: $AMOUNT_BTC BTC"
    echo "   Lightning Invoice: ${LIGHTNING_INVOICE:0:50}..."
fi

# Test 4: Check invoice status
echo ""
echo "4. Checking invoice status..."
if [ ! -z "$INVOICE_UUID" ]; then
    STATUS_RESPONSE=$(curl -s http://localhost:3000/api/rgb/invoice/$INVOICE_UUID/status)
    echo "Status Response: $STATUS_RESPONSE"
fi

# Test 5: Check configuration
echo ""
echo "5. System Configuration:"
curl -s http://localhost:3000/health | jq '{
  status: .status,
  btcpay: .btcpay,
  mode: .mode,
  database: .database
}'

echo ""
echo "6. Environment Status:"
echo "RGB Mock Mode: $(grep USE_MOCK_RGB /var/www/rgblightcat/.env | cut -d= -f2)"
echo "BTCPay URL: $(grep BTCPAY_URL /var/www/rgblightcat/.env | cut -d= -f2)"
echo "RGB Wallet: $(grep RGB_WALLET_ADDRESS /var/www/rgblightcat/.env | cut -d= -f2)"

echo ""
echo "✅ Payment flow test complete!"