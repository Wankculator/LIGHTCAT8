# 🔧 RGB Node Setup Guide for LIGHTCAT

## 📋 Prerequisites

### System Requirements
- Ubuntu 20.04+ or Debian 11+
- 4GB RAM minimum
- 50GB disk space
- Bitcoin Core (pruned mode OK)
- Stable internet connection

### Required Software
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y build-essential git curl wget
sudo apt install -y libssl-dev pkg-config libzmq3-dev
sudo apt install -y postgresql postgresql-contrib
```

## 🚀 RGB Node Installation

### Option 1: From Binary (Recommended)
```bash
# Download latest RGB node
wget https://github.com/RGB-WG/rgb-node/releases/download/v0.10.0/rgb-node-linux-x86_64.tar.gz

# Extract
tar -xzf rgb-node-linux-x86_64.tar.gz

# Move to system path
sudo mv rgb-node /usr/local/bin/
sudo chmod +x /usr/local/bin/rgb-node

# Verify installation
rgb-node --version
```

### Option 2: From Source
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Clone RGB node
git clone https://github.com/RGB-WG/rgb-node
cd rgb-node

# Build
cargo build --release

# Install
sudo cp target/release/rgb-node /usr/local/bin/
```

## 📁 Configuration

### 1. Create RGB Directory
```bash
mkdir -p ~/.rgb
cd ~/.rgb
```

### 2. Create Configuration File
```bash
cat > ~/.rgb/rgb.conf << EOF
# RGB Node Configuration
network = "bitcoin"
data_dir = "~/.rgb/data"
rpc_port = 8080
rpc_user = "rgbuser"
rpc_password = "secure_password_here"

# Bitcoin Core Connection
bitcoin_rpc_url = "http://localhost:8332"
bitcoin_rpc_user = "bitcoinrpc"
bitcoin_rpc_password = "bitcoin_password"

# Logging
log_level = "info"
log_file = "~/.rgb/rgb.log"
EOF
```

### 3. Create Systemd Service
```bash
sudo cat > /etc/systemd/system/rgb-node.service << EOF
[Unit]
Description=RGB Node
After=network.target

[Service]
Type=simple
User=$USER
ExecStart=/usr/local/bin/rgb-node --config ~/.rgb/rgb.conf
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl enable rgb-node
sudo systemctl start rgb-node
```

## 💰 Import LIGHTCAT Wallet

### 1. Create Wallet
```bash
# Create new wallet for LIGHTCAT distribution
rgb-cli wallet create lightcat-distribution

# Import your existing seed phrase
rgb-cli wallet import lightcat-distribution
# Enter your 12/24 word seed phrase when prompted
```

### 2. Verify Token Balance
```bash
# List assets
rgb-cli asset list

# Check LIGHTCAT balance (should show 21,000,000)
rgb-cli asset balance <LIGHTCAT_ASSET_ID>
```

## 🔌 API Integration

### 1. Enable RPC API
```bash
# Edit rgb.conf
echo "rpc_enabled = true" >> ~/.rgb/rgb.conf
echo "rpc_bind = 127.0.0.1:8080" >> ~/.rgb/rgb.conf

# Restart node
sudo systemctl restart rgb-node
```

### 2. Test API Connection
```bash
# Test RPC connection
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -u rgbuser:secure_password_here \
  -d '{"method": "getinfo", "params": []}'
```

## 🤖 Automatic Distribution Setup

### 1. Create Transfer Script
```bash
cat > /opt/rgb-transfer.sh << 'EOF'
#!/bin/bash
# RGB Automatic Transfer Script

ASSET_ID="$1"
AMOUNT="$2"
RECIPIENT="$3"

# Create transfer
TRANSFER_ID=$(rgb-cli transfer create \
  --asset "$ASSET_ID" \
  --amount "$AMOUNT" \
  --recipient "$RECIPIENT" \
  --fee-rate 5)

# Sign transfer
rgb-cli transfer sign "$TRANSFER_ID"

# Finalize and get consignment
CONSIGNMENT=$(rgb-cli transfer finalize "$TRANSFER_ID" --base64)

# Output consignment
echo "$CONSIGNMENT"
EOF

chmod +x /opt/rgb-transfer.sh
```

### 2. Node.js Integration
```javascript
// /server/services/rgbNodeService.js
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class RGBNodeService {
  constructor() {
    this.assetId = process.env.RGB_ASSET_ID;
    this.scriptPath = '/opt/rgb-transfer.sh';
  }

  async createTransfer(rgbInvoice, tokenAmount) {
    try {
      const { stdout, stderr } = await execAsync(
        `${this.scriptPath} ${this.assetId} ${tokenAmount} ${rgbInvoice}`
      );
      
      if (stderr) {
        throw new Error(`RGB transfer error: ${stderr}`);
      }
      
      return stdout.trim(); // Base64 consignment
    } catch (error) {
      console.error('RGB transfer failed:', error);
      throw error;
    }
  }
}

module.exports = new RGBNodeService();
```

## 🔍 Monitoring

### 1. Check Node Status
```bash
# Service status
sudo systemctl status rgb-node

# View logs
tail -f ~/.rgb/rgb.log

# Check sync status
rgb-cli getinfo
```

### 2. Monitor Transfers
```bash
# List recent transfers
rgb-cli transfer list --limit 10

# Check specific transfer
rgb-cli transfer get <TRANSFER_ID>
```

## 🚨 Troubleshooting

### Common Issues

1. **Node won't start**
   ```bash
   # Check logs
   journalctl -u rgb-node -n 50
   
   # Verify Bitcoin Core is running
   bitcoin-cli getblockchaininfo
   ```

2. **Transfer fails**
   ```bash
   # Check wallet balance
   rgb-cli asset balance <ASSET_ID>
   
   # Verify recipient invoice format
   echo "rgb:utxob:..." | rgb-cli invoice validate
   ```

3. **API connection refused**
   ```bash
   # Check if port is listening
   sudo netstat -tlnp | grep 8080
   
   # Test local connection
   curl http://localhost:8080
   ```

## 🔒 Security Best Practices

1. **Secure RPC Access**
   ```bash
   # Use strong passwords
   # Bind to localhost only
   # Enable SSL/TLS for production
   ```

2. **Wallet Security**
   ```bash
   # Encrypt wallet
   rgb-cli wallet encrypt lightcat-distribution
   
   # Backup regularly
   rgb-cli wallet backup lightcat-distribution ~/backups/
   ```

3. **System Security**
   ```bash
   # Firewall rules
   sudo ufw allow from 127.0.0.1 to any port 8080
   sudo ufw deny 8080
   
   # Regular updates
   sudo apt update && sudo apt upgrade
   ```

## 📞 Support Resources

- RGB Documentation: https://rgb.tech/docs
- RGB GitHub: https://github.com/RGB-WG
- Community Discord: https://discord.gg/rgb-protocol
- BTCPay + RGB Guide: https://docs.btcpayserver.org/RGB

---

**Note**: This guide assumes RGB node v0.10.0. Check for latest version at https://github.com/RGB-WG/rgb-node/releases