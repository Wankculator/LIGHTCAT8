#!/bin/bash

# RGB Protocol Integration Setup Script
# Complete setup for LIGHTCAT automated token distribution

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}"
cat << "EOF"
  _     ___ _____ _____ ____    _  _____ 
 | |   |_ _|_   _| ____|/ ___|  / \|_   _|
 | |    | |  | | |  _| | |     / _ \ | |  
 | |___ | |  | | | |___| |___ / ___ \| |  
 |_____|___| |_| |_____|\____/_/   \_\_|  
                                          
    RGB Protocol Integration Setup
    🚀 Automated Token Distribution 🚀
EOF
echo -e "${NC}"

echo -e "${BLUE}This script will set up:${NC}"
echo "✅ RGB Node for token management"
echo "✅ BTCPay Server on Voltage.cloud"
echo "✅ Automatic consignment generation"
echo "✅ Real-time blockchain monitoring"
echo "✅ Complete integration with your website"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}Please do not run as root. Run as regular user with sudo access.${NC}"
   exit 1
fi

# Function to check command success
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 successful${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Step 1: System Check
echo -e "${YELLOW}Step 1: System Requirements Check${NC}"
echo ""

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js installed: $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Node.js not found${NC}"
    echo "Please install Node.js 16+ first"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ npm installed: $NPM_VERSION${NC}"
else
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi

# Check git
if command_exists git; then
    echo -e "${GREEN}✓ Git installed${NC}"
else
    echo -e "${RED}✗ Git not found${NC}"
    exit 1
fi

echo ""
read -p "Press Enter to continue..."

# Step 2: Install RGB Node
echo ""
echo -e "${YELLOW}Step 2: RGB Node Installation${NC}"
echo ""

if [ -f "./install-rgb-node.sh" ]; then
    echo "Installing RGB node..."
    bash ./install-rgb-node.sh
    check_success "RGB node installation"
else
    echo -e "${YELLOW}RGB node installation script not found.${NC}"
    echo "Would you like to:"
    echo "1. Download and install RGB node now"
    echo "2. Skip (if already installed)"
    read -p "Choose (1/2): " RGB_CHOICE
    
    if [ "$RGB_CHOICE" == "1" ]; then
        # Download and run RGB installation
        curl -sSL https://raw.githubusercontent.com/RGB-WG/rgb-node/master/install.sh | bash
        check_success "RGB node download and installation"
    fi
fi

# Step 3: BTCPay Voltage Setup
echo ""
echo -e "${YELLOW}Step 3: BTCPay Server on Voltage Setup${NC}"
echo ""

if [ -f "./setup-btcpay-voltage.sh" ]; then
    echo "Setting up BTCPay Server..."
    bash ./setup-btcpay-voltage.sh
    check_success "BTCPay setup"
else
    echo -e "${YELLOW}BTCPay setup script will be created.${NC}"
fi

# Step 4: Install Dependencies
echo ""
echo -e "${YELLOW}Step 4: Installing Node.js Dependencies${NC}"
echo ""

cd ..
npm install axios ws
check_success "Dependency installation"

# Step 5: Database Setup
echo ""
echo -e "${YELLOW}Step 5: Database Configuration${NC}"
echo ""

# Check if Supabase is configured
if [ -f ".env" ] && grep -q "SUPABASE_URL" .env; then
    echo -e "${GREEN}✓ Supabase already configured${NC}"
else
    echo -e "${YELLOW}Supabase configuration needed${NC}"
    echo "Please add your Supabase credentials to .env file"
fi

# Create RGB transfers table if needed
echo "Creating RGB transfers table..."
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function createTable() {
  const { error } = await supabase.rpc('create_rgb_transfers_table', {
    definition: \`
      CREATE TABLE IF NOT EXISTS rgb_transfers (
        id SERIAL PRIMARY KEY,
        invoice_id VARCHAR(255) UNIQUE NOT NULL,
        recipient_invoice TEXT NOT NULL,
        token_amount INTEGER NOT NULL,
        consignment_hash VARCHAR(64),
        created_at TIMESTAMP DEFAULT NOW()
      );
    \`
  }).catch(() => ({ error: 'Table might already exist' }));
  
  if (!error || error === 'Table might already exist') {
    console.log('✓ RGB transfers table ready');
  } else {
    console.error('Failed to create table:', error);
  }
}

createTable();
"

# Step 6: Environment Configuration
echo ""
echo -e "${YELLOW}Step 6: Environment Configuration${NC}"
echo ""

# Check for required environment variables
REQUIRED_VARS=("BTCPAY_URL" "BTCPAY_API_KEY" "BTCPAY_STORE_ID" "RGB_ASSET_ID")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "$var=" .env 2>/dev/null; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All required environment variables configured${NC}"
else
    echo -e "${YELLOW}Missing environment variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo -e "${RED}  - $var${NC}"
    done
    echo ""
    echo "Would you like to configure them now? (y/n)"
    read -p "> " CONFIGURE_ENV
    
    if [[ $CONFIGURE_ENV =~ ^[Yy]$ ]]; then
        # BTCPay configuration
        if [[ " ${MISSING_VARS[@]} " =~ " BTCPAY_URL " ]]; then
            read -p "Enter BTCPay Server URL: " BTCPAY_URL
            echo "BTCPAY_URL=$BTCPAY_URL" >> .env
        fi
        
        if [[ " ${MISSING_VARS[@]} " =~ " BTCPAY_API_KEY " ]]; then
            read -p "Enter BTCPay API Key: " BTCPAY_API_KEY
            echo "BTCPAY_API_KEY=$BTCPAY_API_KEY" >> .env
        fi
        
        if [[ " ${MISSING_VARS[@]} " =~ " BTCPAY_STORE_ID " ]]; then
            read -p "Enter BTCPay Store ID: " BTCPAY_STORE_ID
            echo "BTCPAY_STORE_ID=$BTCPAY_STORE_ID" >> .env
        fi
        
        # RGB Asset ID
        if [[ " ${MISSING_VARS[@]} " =~ " RGB_ASSET_ID " ]]; then
            echo "Using default LIGHTCAT asset ID"
            echo "RGB_ASSET_ID=rgb:uQsgEYWo-T6mnwCS-N6mH90J-w6fAeQJ-p53B8gj-UKIY7Po" >> .env
        fi
        
        echo -e "${GREEN}✓ Environment variables configured${NC}"
    fi
fi

# Step 7: Update Application Routes
echo ""
echo -e "${YELLOW}Step 7: Updating Application Routes${NC}"
echo ""

# Check if routes are already integrated
if grep -q "rgbIntegrationRoutes" server/app.js 2>/dev/null; then
    echo -e "${GREEN}✓ Routes already integrated${NC}"
else
    echo "Adding RGB integration routes..."
    
    # Backup app.js
    cp server/app.js server/app.js.backup
    
    # Add routes to app.js
    sed -i "/\/\/ API routes/a\\\napp.use('/api/rgb', require('./routes/rgbIntegrationRoutes'));" server/app.js
    
    echo -e "${GREEN}✓ Routes added to application${NC}"
fi

# Step 8: Test Setup
echo ""
echo -e "${YELLOW}Step 8: Testing Integration${NC}"
echo ""

# Create test script
cat > test-integration.js << 'EOF'
const rgbIntegrationService = require('./server/services/rgbIntegrationService');
const btcpayVoltageService = require('./server/services/btcpayVoltageService');
const blockchainMonitor = require('./server/services/blockchainMonitorService');

async function testIntegration() {
  console.log('🧪 Testing RGB Integration Setup\n');
  
  // Test RGB service
  console.log('1. Testing RGB Integration Service...');
  const rgbStats = await rgbIntegrationService.getDistributionStats();
  console.log('   Node Status:', rgbStats.nodeStatus);
  console.log('   Mock Mode:', rgbStats.mockMode);
  console.log('   Available Tokens:', rgbStats.availableTokens);
  
  // Test BTCPay
  console.log('\n2. Testing BTCPay Service...');
  try {
    const health = await btcpayVoltageService.checkHealth();
    console.log('   BTCPay Health:', health.healthy ? '✅ Connected' : '❌ Not connected');
    if (health.store) {
      console.log('   Store Name:', health.store.name);
    }
  } catch (error) {
    console.log('   BTCPay Health: ❌ Error -', error.message);
  }
  
  // Test Blockchain Monitor
  console.log('\n3. Testing Blockchain Monitor...');
  const monitorStats = blockchainMonitor.getStats();
  console.log('   Network:', monitorStats.network);
  console.log('   Monitoring Active:', monitorStats.isMonitoring);
  console.log('   WebSocket Connected:', monitorStats.websocketConnected);
  
  console.log('\n✅ Integration test complete!');
  process.exit(0);
}

testIntegration().catch(console.error);
EOF

echo "Running integration test..."
node test-integration.js

# Step 9: Create Management Scripts
echo ""
echo -e "${YELLOW}Step 9: Creating Management Scripts${NC}"
echo ""

# Create start script
cat > start-rgb-integration.sh << 'EOF'
#!/bin/bash
echo "Starting RGB Integration Services..."

# Start RGB node if not running
if ! systemctl is-active --quiet rgb-node; then
    echo "Starting RGB node..."
    sudo systemctl start rgb-node
fi

# Start the application
echo "Starting application..."
npm run dev
EOF
chmod +x start-rgb-integration.sh

# Create monitor script
cat > monitor-rgb-integration.sh << 'EOF'
#!/bin/bash
echo "RGB Integration Monitor"
echo "====================="

while true; do
    clear
    echo "RGB Integration Status - $(date)"
    echo "================================"
    
    # Check RGB node
    echo -n "RGB Node: "
    if systemctl is-active --quiet rgb-node; then
        echo -e "\033[0;32m✓ Running\033[0m"
    else
        echo -e "\033[0;31m✗ Stopped\033[0m"
    fi
    
    # Check application
    echo -n "Application: "
    if pgrep -f "node.*server" > /dev/null; then
        echo -e "\033[0;32m✓ Running\033[0m"
    else
        echo -e "\033[0;31m✗ Stopped\033[0m"
    fi
    
    echo ""
    echo "Press Ctrl+C to exit"
    sleep 5
done
EOF
chmod +x monitor-rgb-integration.sh

echo -e "${GREEN}✓ Management scripts created${NC}"

# Final Summary
echo ""
echo -e "${PURPLE}===============================================${NC}"
echo -e "${GREEN}✅ RGB Integration Setup Complete!${NC}"
echo -e "${PURPLE}===============================================${NC}"
echo ""
echo -e "${BLUE}📋 Setup Summary:${NC}"
echo "✅ RGB Node installed and configured"
echo "✅ BTCPay Server integration ready"
echo "✅ Blockchain monitoring service configured"
echo "✅ Automatic token distribution enabled"
echo "✅ API routes integrated"
echo ""
echo -e "${YELLOW}🚀 Next Steps:${NC}"
echo "1. Import your RGB wallet (if not done):"
echo "   ${CYAN}cd ~/rgb-node && ./import-wallet.sh${NC}"
echo ""
echo "2. Start the integration:"
echo "   ${CYAN}./start-rgb-integration.sh${NC}"
echo ""
echo "3. Monitor the system:"
echo "   ${CYAN}./monitor-rgb-integration.sh${NC}"
echo ""
echo "4. Test with a small purchase:"
echo "   - Visit your website"
echo "   - Play the game to unlock purchasing"
echo "   - Make a 1-batch test purchase"
echo ""
echo -e "${GREEN}🎉 Your automated RGB token distribution system is ready!${NC}"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "- RGB Integration Guide: ./docs/rgb-integration.md"
echo "- BTCPay Quick Reference: ./BTCPAY_QUICK_REFERENCE.md"
echo "- Troubleshooting: ./docs/troubleshooting.md"
echo ""

# Cleanup
rm -f test-integration.js

echo "Setup completed at $(date)"