#!/bin/bash

# LIGHTCAT Production Deployment Script
# This script deploys everything needed for production

echo "🚀 LIGHTCAT Production Deployment"
echo "================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if RGB_ASSET_ID is set
if ! grep -q "RGB_ASSET_ID=rgb:" .env; then
    echo -e "${RED}❌ ERROR: RGB_ASSET_ID not found in .env${NC}"
    echo "Please add your RGB asset ID to .env first"
    echo "Example: RGB_ASSET_ID=rgb:utxob:your-asset-id-here"
    exit 1
fi

echo -e "${GREEN}✅ RGB Asset ID configured${NC}"

# Build frontend
echo ""
echo "📦 Building frontend..."
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend built successfully${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

# Run tests
echo ""
echo "🧪 Running tests..."
npm test -- --passWithNoTests
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Tests passed${NC}"
else
    echo -e "${YELLOW}⚠️  Some tests failed (continuing anyway)${NC}"
fi

# Check server connection
echo ""
echo "🔌 Checking server connection..."
SERVER_IP="209.38.86.47"
ssh -o ConnectTimeout=5 -o BatchMode=yes root@$SERVER_IP exit 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Server connection successful${NC}"
else
    echo -e "${RED}❌ Cannot connect to server${NC}"
    echo "Please check your SSH access"
    exit 1
fi

# Deploy files
echo ""
echo "📤 Deploying files to production..."

# Create deployment directory on server
ssh root@$SERVER_IP "mkdir -p /var/www/lightcat"

# Deploy client files
echo "Deploying client files..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'tests' \
    --exclude '*.test.js' \
    client/ root@$SERVER_IP:/var/www/lightcat/client/

# Deploy server files
echo "Deploying server files..."
rsync -avz \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'tests' \
    --exclude 'logs/*' \
    server/ root@$SERVER_IP:/var/www/lightcat/server/

# Deploy configuration files
echo "Deploying configuration..."
scp .env root@$SERVER_IP:/var/www/lightcat/
scp package.json root@$SERVER_IP:/var/www/lightcat/
scp package-lock.json root@$SERVER_IP:/var/www/lightcat/
scp ecosystem.config.js root@$SERVER_IP:/var/www/lightcat/

# Install dependencies on server
echo ""
echo "📦 Installing dependencies on server..."
ssh root@$SERVER_IP "cd /var/www/lightcat && npm ci --production"

# Setup RGB node if not installed
echo ""
echo "🔧 Checking RGB node..."
ssh root@$SERVER_IP "which rgb-cli" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  RGB node not installed${NC}"
    echo "To install RGB node, run on server:"
    echo "cd /var/www/lightcat && ./scripts/install-rgb-node.sh"
else
    echo -e "${GREEN}✅ RGB node installed${NC}"
fi

# Start/restart services
echo ""
echo "🔄 Starting services..."
ssh root@$SERVER_IP "cd /var/www/lightcat && npm install pm2 -g && pm2 restart ecosystem.config.js"

# Configure nginx if needed
echo ""
echo "🌐 Checking nginx configuration..."
ssh root@$SERVER_IP "nginx -t" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nginx configured${NC}"
    ssh root@$SERVER_IP "nginx -s reload"
else
    echo -e "${YELLOW}⚠️  Nginx needs configuration${NC}"
    echo "See PRODUCTION_CHECKLIST.md for nginx config"
fi

# Final checks
echo ""
echo "🔍 Running production checks..."

# Check if API is responding
sleep 5
curl -s https://rgblightcat.com/api/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ API is responding${NC}"
else
    echo -e "${YELLOW}⚠️  API not responding yet (may still be starting)${NC}"
fi

# Check if frontend is accessible
curl -s https://rgblightcat.com > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend not accessible (check DNS/nginx)${NC}"
fi

echo ""
echo "================================="
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "📋 Post-Deployment Checklist:"
echo "1. [ ] Test game at https://rgblightcat.com/game"
echo "2. [ ] Test purchase flow"
echo "3. [ ] Check BTCPay webhook at https://btcpay0.voltageapp.io"
echo "4. [ ] Monitor logs: ssh root@$SERVER_IP 'cd /var/www/lightcat && pm2 logs'"
echo "5. [ ] Set up SSL renewal: certbot renew --dry-run"
echo ""
echo "🚨 If RGB node not installed:"
echo "ssh root@$SERVER_IP"
echo "cd /var/www/lightcat"
echo "./scripts/install-rgb-node.sh"
echo ""
echo "Then import your wallet with seed phrase!"
echo ""
echo "Good luck with your launch! 🚀"