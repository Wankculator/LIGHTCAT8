#!/bin/bash

echo "🔍 Testing LIGHTCAT Invoice API"
echo "================================"

# Test 1: Check if API is responding
echo -e "\n1. Testing API health endpoint..."
curl -s https://rgblightcat.com/api/health | head -50 || echo "API health check failed"

# Test 2: Check server logs
echo -e "\n2. Checking server status..."
ssh root@147.93.105.138 "pm2 status"

# Test 3: Test invoice endpoint with proper data
echo -e "\n3. Testing invoice creation..."
curl -X POST https://rgblightcat.com/api/rgb/invoice \
  -H "Content-Type: application/json" \
  -d '{
    "rgbInvoice": "rgb:utxob:sample-invoice-data",
    "batchCount": 1,
    "tier": "bronze",
    "email": "test@example.com"
  }' -w "\nHTTP Status: %{http_code}\n" --max-time 10

echo -e "\n4. Checking server error logs..."
ssh root@147.93.105.138 "tail -20 /var/www/rgblightcat/server/logs/* 2>/dev/null || echo 'No log files found'"

echo -e "\n✅ Test complete"