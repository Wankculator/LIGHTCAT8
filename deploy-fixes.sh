#!/bin/bash

echo "🚀 Deploying fixes to rgblightcat.com..."
echo "========================================"

# Server details
SERVER="147.93.105.138"
USER="root"
REMOTE_PATH="/var/www/rgblightcat/client"

echo -e "\n📦 Files to deploy:"
echo "  1. lightning-background.js (fixed escaped characters)"
echo "  2. lightning-background.css"
echo "  3. main-page-tier-detector.js (disabled duplicate notifications)"
echo "  4. tier-display-restart-fix.js (removed duplicate messages)"

echo -e "\n🔧 Creating deployment package..."

# Create temp directory for deployment
DEPLOY_DIR="/tmp/rgblightcat-deploy-$(date +%s)"
mkdir -p $DEPLOY_DIR/js
mkdir -p $DEPLOY_DIR/css

# Copy fixed files
cp client/js/lightning-background.js $DEPLOY_DIR/js/
cp client/css/lightning-background.css $DEPLOY_DIR/css/
cp client/js/main-page-tier-detector.js $DEPLOY_DIR/js/
cp client/js/tier-display-restart-fix.js $DEPLOY_DIR/js/

echo "✅ Deployment package created"

echo -e "\n📡 Manual deployment required due to SSH restrictions"
echo "========================================"
echo "Please run these commands manually:"
echo ""
echo "# 1. Connect to server:"
echo "ssh root@$SERVER"
echo ""
echo "# 2. Backup existing files:"
echo "cd $REMOTE_PATH"
echo "cp js/lightning-background.js js/lightning-background.js.backup-$(date +%Y%m%d)"
echo "cp js/main-page-tier-detector.js js/main-page-tier-detector.js.backup-$(date +%Y%m%d)"
echo "cp js/tier-display-restart-fix.js js/tier-display-restart-fix.js.backup-$(date +%Y%m%d)"
echo ""
echo "# 3. Create new files with fixed content:"
echo "# Copy the content from local files to server"
echo ""
echo "# 4. Clear nginx cache:"
echo "nginx -s reload"
echo "rm -rf /var/cache/nginx/*"
echo ""
echo "# 5. Test the deployment:"
echo "curl -s https://rgblightcat.com/js/lightning-background.js | grep -q '\\\\!' && echo 'NEEDS FIX' || echo 'FIXED'"
echo ""
echo "========================================"

# Save files for manual inspection
echo -e "\n💾 Saving fixed files for inspection..."
echo "Fixed files are in: $DEPLOY_DIR"
ls -la $DEPLOY_DIR/js/
ls -la $DEPLOY_DIR/css/

echo -e "\n✅ Files ready for manual deployment"