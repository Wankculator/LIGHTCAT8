#!/bin/bash

# LIGHTCAT RGB Node Installation Script
# Installs RGB node for automatic token distribution

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 LIGHTCAT RGB Node Installation${NC}"
echo "=================================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}❌ Please do not run as root${NC}"
   exit 1
fi

# Function to check system requirements
check_requirements() {
    echo -e "${YELLOW}📋 Checking system requirements...${NC}"
    
    # Check Ubuntu/Debian
    if ! command -v apt &> /dev/null; then
        echo -e "${RED}❌ This script requires Ubuntu/Debian${NC}"
        exit 1
    fi
    
    # Check memory
    TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
    if [ "$TOTAL_MEM" -lt 4000 ]; then
        echo -e "${RED}❌ At least 4GB RAM required${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ System requirements met${NC}"
}

# Function to install dependencies
install_dependencies() {
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    
    sudo apt update
    sudo apt install -y \
        build-essential \
        git \
        curl \
        wget \
        libssl-dev \
        pkg-config \
        libzmq3-dev \
        postgresql \
        postgresql-contrib \
        jq
    
    # Install Rust if not present
    if ! command -v cargo &> /dev/null; then
        echo -e "${YELLOW}🦀 Installing Rust...${NC}"
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source $HOME/.cargo/env
    fi
    
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Function to install RGB node
install_rgb_node() {
    echo -e "${YELLOW}🔧 Installing RGB node...${NC}"
    
    # Create RGB directory
    mkdir -p ~/rgb-node
    cd ~/rgb-node
    
    # Check latest release
    LATEST_VERSION=$(curl -s https://api.github.com/repos/RGB-WG/rgb-node/releases/latest | jq -r .tag_name)
    echo -e "${BLUE}📌 Latest version: $LATEST_VERSION${NC}"
    
    # Download binary
    wget https://github.com/RGB-WG/rgb-node/releases/download/${LATEST_VERSION}/rgb-node-linux-x86_64.tar.gz
    tar -xzf rgb-node-linux-x86_64.tar.gz
    
    # Install to system
    sudo cp rgb-node /usr/local/bin/
    sudo chmod +x /usr/local/bin/rgb-node
    
    # Verify installation
    if rgb-node --version; then
        echo -e "${GREEN}✅ RGB node installed successfully${NC}"
    else
        echo -e "${RED}❌ RGB node installation failed${NC}"
        exit 1
    fi
}

# Function to configure RGB node
configure_rgb_node() {
    echo -e "${YELLOW}⚙️  Configuring RGB node...${NC}"
    
    # Create config directory
    mkdir -p ~/.rgb
    
    # Create configuration file
    cat > ~/.rgb/rgb.conf << EOF
# LIGHTCAT RGB Node Configuration
network = "bitcoin"
data_dir = "$HOME/.rgb/data"
rpc_port = 8080
rpc_user = "lightcat"
rpc_password = "$(openssl rand -hex 32)"

# Bitcoin Core Connection
bitcoin_rpc_url = "http://localhost:8332"
bitcoin_rpc_user = "bitcoinrpc"
bitcoin_rpc_password = "changeme"

# Logging
log_level = "info"
log_file = "$HOME/.rgb/rgb.log"

# API Settings
rpc_enabled = true
rpc_bind = "127.0.0.1:8080"
max_connections = 100
EOF

    echo -e "${GREEN}✅ Configuration created${NC}"
}

# Function to create systemd service
create_systemd_service() {
    echo -e "${YELLOW}🔧 Creating systemd service...${NC}"
    
    sudo tee /etc/systemd/system/rgb-node.service > /dev/null << EOF
[Unit]
Description=LIGHTCAT RGB Node
After=network.target

[Service]
Type=simple
User=$USER
ExecStart=/usr/local/bin/rgb-node --config $HOME/.rgb/rgb.conf
Restart=on-failure
RestartSec=10
StandardOutput=append:$HOME/.rgb/rgb.log
StandardError=append:$HOME/.rgb/rgb-error.log

[Install]
WantedBy=multi-user.target
EOF

    # Enable service
    sudo systemctl daemon-reload
    sudo systemctl enable rgb-node
    
    echo -e "${GREEN}✅ Systemd service created${NC}"
}

# Function to create wallet import script
create_wallet_import_script() {
    echo -e "${YELLOW}📝 Creating wallet import script...${NC}"
    
    cat > ~/rgb-node/import-wallet.sh << 'EOF'
#!/bin/bash

# LIGHTCAT Wallet Import Script

echo "🔑 LIGHTCAT Wallet Import"
echo "======================="
echo ""
echo "This script will import your wallet with 21M LIGHTCAT tokens"
echo ""

# Create wallet
rgb-cli wallet create lightcat-distribution

echo ""
echo "Please enter your seed phrase (12 or 24 words):"
read -r -p "> " SEED_PHRASE

# Import wallet
echo "$SEED_PHRASE" | rgb-cli wallet import lightcat-distribution

# Check balance
echo ""
echo "Checking LIGHTCAT balance..."
rgb-cli asset list

echo ""
echo "✅ Wallet imported successfully!"
echo ""
echo "⚠️  IMPORTANT: Delete this script after use for security"
echo "rm ~/rgb-node/import-wallet.sh"
EOF

    chmod +x ~/rgb-node/import-wallet.sh
    
    echo -e "${GREEN}✅ Wallet import script created${NC}"
}

# Function to create management scripts
create_management_scripts() {
    echo -e "${YELLOW}📝 Creating management scripts...${NC}"
    
    # Start script
    cat > ~/rgb-node/start-rgb.sh << EOF
#!/bin/bash
echo "Starting RGB node..."
sudo systemctl start rgb-node
sleep 2
sudo systemctl status rgb-node
EOF
    
    # Stop script
    cat > ~/rgb-node/stop-rgb.sh << EOF
#!/bin/bash
echo "Stopping RGB node..."
sudo systemctl stop rgb-node
EOF
    
    # Logs script
    cat > ~/rgb-node/view-logs.sh << EOF
#!/bin/bash
echo "RGB Node Logs (Ctrl+C to exit):"
tail -f ~/.rgb/rgb.log
EOF
    
    # Status script
    cat > ~/rgb-node/check-status.sh << EOF
#!/bin/bash
echo "RGB Node Status:"
sudo systemctl status rgb-node
echo ""
echo "Recent logs:"
tail -10 ~/.rgb/rgb.log
EOF
    
    chmod +x ~/rgb-node/*.sh
    
    echo -e "${GREEN}✅ Management scripts created${NC}"
}

# Function to display final instructions
display_instructions() {
    echo ""
    echo -e "${GREEN}🎉 RGB Node Installation Complete!${NC}"
    echo "=================================="
    echo ""
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo ""
    echo "1. Import your wallet with 21M LIGHTCAT tokens:"
    echo -e "   ${YELLOW}cd ~/rgb-node && ./import-wallet.sh${NC}"
    echo ""
    echo "2. Update Bitcoin Core connection in ~/.rgb/rgb.conf"
    echo ""
    echo "3. Start the RGB node:"
    echo -e "   ${YELLOW}~/rgb-node/start-rgb.sh${NC}"
    echo ""
    echo "4. Check node status:"
    echo -e "   ${YELLOW}~/rgb-node/check-status.sh${NC}"
    echo ""
    echo -e "${BLUE}📁 Important Files:${NC}"
    echo "   Configuration: ~/.rgb/rgb.conf"
    echo "   Logs: ~/.rgb/rgb.log"
    echo "   Data: ~/.rgb/data/"
    echo ""
    echo -e "${YELLOW}⚠️  Security Notes:${NC}"
    echo "   - Keep your seed phrase secure"
    echo "   - Update the RPC password in config"
    echo "   - Delete import-wallet.sh after use"
    echo ""
}

# Main installation flow
main() {
    check_requirements
    install_dependencies
    install_rgb_node
    configure_rgb_node
    create_systemd_service
    create_wallet_import_script
    create_management_scripts
    display_instructions
}

# Run main function
main