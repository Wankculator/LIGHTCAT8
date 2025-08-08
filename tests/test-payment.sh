#!/bin/bash

echo "🔍 Testing Payment Flow"
echo "======================"
echo ""

# Test RGB invoice creation
echo "1. Testing RGB invoice creation..."
curl -X POST http://localhost:3000/api/rgb/invoice \
  -H "Content-Type: application/json" \
  -d '{"rgbInvoice":"rgb:utxob:2a1GCz-aZR78Mo-e4N7Lqp-BBoes5P-EfSgVuW-TtNFWQX","batchCount":1,"tier":"bronze"}' \
  2>/dev/null | jq . || echo "Failed"

echo ""
echo "2. Testing game session validation..."
curl -X POST http://localhost:3000/api/game/validate-session \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-session-12345"}' \
  2>/dev/null | jq . || echo "Failed"

echo ""
echo "3. Testing health endpoint..."
curl -s http://localhost:3000/health | jq .

echo ""
echo "4. Checking RGB configuration..."
curl -s http://localhost:3000/health | jq -r .mode