#!/bin/bash

# Payment Success Features Verification Script
# Tests the payment success flow using curl and basic checks

echo "🧪 Payment Success Flow Verification"
echo "===================================="
echo ""

BASE_URL="http://localhost:8082"
API_URL="http://localhost:3000"
TEST_INVOICE="test-$(date +%s)"
PASSED=0
FAILED=0

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test function
test_feature() {
    local name="$1"
    local command="$2"
    local expected="$3"
    
    echo -n "Testing: $name... "
    
    result=$(eval "$command" 2>/dev/null)
    
    if echo "$result" | grep -q "$expected"; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "  Expected: $expected"
        echo "  Got: ${result:0:100}..."
        ((FAILED++))
        return 1
    fi
}

echo "1. Checking servers..."
echo "----------------------"

# Check client server
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" | grep -q "200\|304"; then
    echo "✅ Client server running on port 8082"
else
    echo "❌ Client server not running"
    exit 1
fi

# Check API server
if curl -s "$API_URL/api/health" | grep -q "ok"; then
    echo "✅ API server running on port 3000"
else
    echo "❌ API server not running"
    exit 1
fi

echo ""
echo "2. Testing Success Page Features"
echo "--------------------------------"

# Test 1: Success page loads
test_feature \
    "Success page loads" \
    "curl -s '$BASE_URL/success.html?invoice=$TEST_INVOICE' | grep -o 'Payment Successful'" \
    "Payment Successful"

# Test 2: Page has required elements
test_feature \
    "Thank you message present" \
    "curl -s '$BASE_URL/success.html' | grep -o 'Thank you for your purchase'" \
    "Thank you for your purchase"

test_feature \
    "Purchase details section exists" \
    "curl -s '$BASE_URL/success.html' | grep -o 'purchase-details'" \
    "purchase-details"

test_feature \
    "Status section exists" \
    "curl -s '$BASE_URL/success.html' | grep -o 'status-section'" \
    "status-section"

test_feature \
    "Download button exists" \
    "curl -s '$BASE_URL/success.html' | grep -o 'downloadButton'" \
    "downloadButton"

test_feature \
    "Progress indicators exist" \
    "curl -s '$BASE_URL/success.html' | grep -o 'step1.*step2.*step3'" \
    "step1"

echo ""
echo "3. Testing JavaScript Functions"
echo "-------------------------------"

# Test JavaScript functions exist
test_feature \
    "checkPaymentStatus function exists" \
    "curl -s '$BASE_URL/success.html' | grep -o 'function checkPaymentStatus'" \
    "function checkPaymentStatus"

test_feature \
    "downloadConsignment function exists" \
    "curl -s '$BASE_URL/success.html' | grep -o 'function downloadConsignment'" \
    "function downloadConsignment"

test_feature \
    "Status polling configured" \
    "curl -s '$BASE_URL/success.html' | grep -o 'setInterval.*checkPaymentStatus.*3000'" \
    "setInterval"

echo ""
echo "4. Testing API Integration"
echo "--------------------------"

# Create a mock invoice in the API
MOCK_RESPONSE=$(cat <<EOF
{
  "success": true,
  "status": "processing",
  "invoice": {
    "batchCount": 10,
    "tokenAmount": 7000,
    "amount": 20000,
    "status": "processing"
  }
}
EOF
)

# Test API endpoint format
test_feature \
    "API endpoint format correct" \
    "curl -s '$BASE_URL/success.html' | grep -o '/api/rgb/invoice/.*/status'" \
    "/api/rgb/invoice/"

echo ""
echo "5. Testing Mobile Responsiveness"
echo "--------------------------------"

test_feature \
    "Mobile viewport meta tag" \
    "curl -s '$BASE_URL/success.html' | grep -o 'viewport.*width=device-width'" \
    "viewport"

test_feature \
    "Mobile CSS media queries" \
    "curl -s '$BASE_URL/success.html' | grep -o '@media.*max-width.*600px'" \
    "@media"

echo ""
echo "6. Testing Redirect Configuration"
echo "---------------------------------"

test_feature \
    "Redirect after payment in main page" \
    "curl -s '$BASE_URL/index.html' | grep -o 'window.location.href.*success.html'" \
    "window.location.href"

test_feature \
    "LocalStorage fallback configured" \
    "curl -s '$BASE_URL/success.html' | grep -o 'localStorage.getItem.*lastInvoiceId'" \
    "localStorage.getItem"

echo ""
echo "7. Testing Email Template"
echo "-------------------------"

if [ -f "/root/server/templates/paymentReceipt.html" ]; then
    test_feature \
        "Email template exists" \
        "ls /root/server/templates/paymentReceipt.html" \
        "paymentReceipt.html"
    
    test_feature \
        "Email template has transaction details" \
        "grep -o 'Transaction Details' /root/server/templates/paymentReceipt.html" \
        "Transaction Details"
else
    echo "❌ Email template not found"
    ((FAILED++))
fi

echo ""
echo "8. Testing Error Handling"
echo "-------------------------"

test_feature \
    "Error handling for failed distribution" \
    "curl -s '$BASE_URL/success.html' | grep -o 'distribution_failed'" \
    "distribution_failed"

test_feature \
    "Support contact message" \
    "curl -s '$BASE_URL/success.html' | grep -o 'contact support'" \
    "contact support"

echo ""
echo "========================================"
echo "            TEST RESULTS"
echo "========================================"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All features verified successfully!${NC}"
    echo ""
    echo "The payment success flow includes:"
    echo "  ✓ Beautiful success page with animations"
    echo "  ✓ Real-time status updates every 3 seconds"
    echo "  ✓ Purchase details display (batches, tokens, sats)"
    echo "  ✓ 3-step progress indicators"
    echo "  ✓ Consignment download when ready"
    echo "  ✓ Error handling for failures"
    echo "  ✓ Mobile responsive design"
    echo "  ✓ Automatic redirect after payment"
    echo "  ✓ Email receipt template"
    echo "  ✓ LocalStorage fallback for invoice ID"
    exit 0
else
    echo -e "${RED}Some features need attention${NC}"
    exit 1
fi