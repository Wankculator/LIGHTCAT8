#!/bin/bash

# Deploy All Fixes Script
echo "🚀 Deploying ALL Fixes to rgblightcat.com"
echo "=========================================="

# Server details
SERVER="root@147.93.105.138"
REMOTE_PATH="/var/www/lightcat"

# SSH options to handle connection issues
SSH_OPTS="-o ConnectTimeout=30 -o ServerAliveInterval=15 -o ServerAliveCountMax=3"

# Function to retry commands
retry_command() {
    local command="$1"
    local max_attempts=3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo "Attempt $attempt of $max_attempts: $command"
        if eval "$command"; then
            return 0
        fi
        echo "Failed, waiting 10 seconds before retry..."
        sleep 10
        attempt=$((attempt + 1))
    done
    
    echo "Failed after $max_attempts attempts"
    return 1
}

# Step 1: Deploy critical game UI fixes
echo -e "\n🎮 Deploying Game UI Fixes..."
echo "=============================="

# Deploy mobile CSS fix
echo -e "\n📱 Deploying mobile CSS fix..."
retry_command "scp $SSH_OPTS client/css/game-mobile-fix.css $SERVER:$REMOTE_PATH/client/css/"

# Deploy GameUI.js (removes thunder emoji, adds retry message)
echo -e "\n🎯 Deploying GameUI.js (no emoji, retry message)..."
retry_command "scp $SSH_OPTS client/js/game/GameUI.js $SERVER:$REMOTE_PATH/client/js/game/"

# Deploy mobile handler
echo -e "\n📱 Deploying mobile handler..."
retry_command "scp $SSH_OPTS client/js/game-mobile-handler.js $SERVER:$REMOTE_PATH/client/js/"

# Step 2: Deploy security fixes for game files
echo -e "\n🔒 Deploying Security Fixes..."
echo "=============================="

# Deploy game files with gameRandom() fix
GAME_FILES=("CatModel.js" "CollectibleManager.js" "EffectsManager.js" "Explosion.js" "ObjectPool.js" "PlatformManager.js" "ProEnvironment.js" "ProGame.js" "Spawner.js" "main.js")

for file in "${GAME_FILES[@]}"; do
    echo "Deploying $file..."
    retry_command "scp $SSH_OPTS client/js/game/$file $SERVER:$REMOTE_PATH/client/js/game/"
done

# Step 3: Deploy main index.html with all fixes
echo -e "\n📄 Deploying index.html with all fixes..."
retry_command "scp $SSH_OPTS client/index.html $SERVER:$REMOTE_PATH/client/"

# Step 4: Deploy optimized mobile CSS
echo -e "\n🎨 Deploying mobile-optimized.css..."
retry_command "scp $SSH_OPTS client/css/mobile-optimized.css $SERVER:$REMOTE_PATH/client/css/"

# Step 5: Deploy mobile complete fix CSS
echo -e "\n🎨 Deploying mobile-complete-fix.css..."
retry_command "scp $SSH_OPTS client/css/mobile-complete-fix.css $SERVER:$REMOTE_PATH/client/css/"

# Step 6: Test deployment
echo -e "\n🧪 Testing deployment..."
echo "======================="

# Test if site is loading
if curl -s -o /dev/null -w "%{http_code}" https://rgblightcat.com | grep -q "200"; then
    echo "✅ Site is loading successfully"
else
    echo "❌ Site may be having issues"
fi

# Test if game page loads
if curl -s https://rgblightcat.com/game.html | grep -q "ProGame.js"; then
    echo "✅ Game page is loading"
else
    echo "❌ Game page may have issues"
fi

# Final message
echo -e "\n🎉 Deployment Process Complete!"
echo "================================"
echo "Please check:"
echo "1. Main site: https://rgblightcat.com"
echo "2. Game: https://rgblightcat.com/game.html"
echo "3. Mobile view: Use browser developer tools"
echo ""
echo "Fixed issues:"
echo "✅ Mobile UI overlapping elements"
echo "✅ Removed thunder emoji from buttons"
echo "✅ Added retry message when no tier reached"
echo "✅ Fixed Math.random() security issues in game"
echo ""
echo "If you see connection errors above, wait 30 seconds and run again."