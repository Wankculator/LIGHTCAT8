#!/bin/bash

echo "🔍 Testing All API Endpoints"
echo "==========================="
echo ""

# Function to test endpoint
test_endpoint() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local description="$4"
    
    echo -n "$description: "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" http://localhost:3000$endpoint 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X $method http://localhost:3000$endpoint \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "400" ] || [ "$http_code" = "404" ]; then
        echo "✓ ($http_code)"
    else
        echo "✗ ($http_code)"
    fi
}

echo "📋 Core Endpoints:"
test_endpoint "GET" "/health" "" "Health check"
test_endpoint "GET" "/api/stats" "" "Stats endpoint"

echo ""
echo "📋 Game Endpoints:"
test_endpoint "POST" "/api/game/start" "{}" "Start game"
test_endpoint "POST" "/api/game/score" '{"score":15,"sessionId":"test","gameData":{"duration":10000,"actions":[],"checkpoints":[]}}' "Submit score"
test_endpoint "GET" "/api/game/leaderboard" "" "Get leaderboard"

echo ""
echo "📋 RGB Payment Endpoints:"
test_endpoint "POST" "/api/rgb/invoice" '{"rgbInvoice":"rgb:test","batchCount":1}' "Create invoice"
test_endpoint "GET" "/api/rgb/invoice/test-uuid/status" "" "Check invoice status"

echo ""
echo "📋 Configuration Status:"
echo -n "RGB Mock Mode: "
grep "USE_MOCK_RGB" /var/www/rgblightcat/server/.env 2>/dev/null | cut -d= -f2 || echo "Not found"
echo -n "Environment: "
grep "NODE_ENV" /var/www/rgblightcat/server/.env 2>/dev/null | cut -d= -f2 || echo "Not found"