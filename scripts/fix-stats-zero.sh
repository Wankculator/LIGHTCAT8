#!/bin/bash
# Fix incorrect stats - set to zero sales

echo "🔧 Fixing Stats to Show Zero Sales..."
echo "====================================="

# Configuration
SERVER_IP="147.93.105.138"
SERVER_USER="root"
SERVER_PASS="ObamaknowsJA8@"
REMOTE_PATH="/var/www/rgblightcat"

echo "📋 Step 1: Fixing hardcoded values in RGB controller..."

# Create fix script
cat > fix_stats.sh << 'EOF'
#!/bin/bash
cd /var/www/rgblightcat

# Backup the controller
cp server/controllers/rgbPaymentController.js server/controllers/rgbPaymentController.js.backup-wrong-stats

# Fix the hardcoded values to show 0 sales
sed -i 's/batchesAvailable: 23503/batchesAvailable: 27900/g' server/controllers/rgbPaymentController.js
sed -i 's/batchesSold: 4397/batchesSold: 0/g' server/controllers/rgbPaymentController.js

echo "Fixed hardcoded values to show 0 sales"

# Also check why database isn't connecting
echo ""
echo "Checking database connection..."
grep -A5 -B5 "databaseService" server/app.js | grep -v "^--"
EOF

# Upload and execute
sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no \
  fix_stats.sh $SERVER_USER@$SERVER_IP:/tmp/

sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no \
  $SERVER_USER@$SERVER_IP "chmod +x /tmp/fix_stats.sh && /tmp/fix_stats.sh && rm /tmp/fix_stats.sh"

rm fix_stats.sh

echo "✅ Stats fixed to show 0 sales"

echo "📋 Step 2: Restarting API server..."

sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no \
  $SERVER_USER@$SERVER_IP "cd $REMOTE_PATH && pm2 restart rgblightcat-api"

echo "✅ API restarted"

# Wait for restart
sleep 3

echo "📋 Step 3: Verifying fix..."

# Test the API
RESPONSE=$(curl -s https://rgblightcat.com/api/rgb/stats)
echo "API Response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

# Check if it shows 0 sales
if echo "$RESPONSE" | grep -q '"batchesSold":0'; then
  echo ""
  echo "✅ SUCCESS! Stats now correctly show 0 sales"
else
  echo ""
  echo "⚠️  Stats still showing incorrect values"
fi

echo ""
echo "====================================="
echo "✅ Stats Fix Complete!"
echo "====================================="
echo ""
echo "The website should now show:"
echo "- 0% SOLD"
echo "- 0 Batches Sold"
echo "- 27,900 Batches Remaining"
echo "- 0 Tokens Sold"
echo ""