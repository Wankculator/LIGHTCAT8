#!/usr/bin/env node

/**
 * Switch LIGHTCAT to Production Mode
 * Uses real BTCPay credentials and prepares for deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Switching LIGHTCAT to Production Mode...\n');

// Production configuration
const productionConfig = `# LIGHTCAT Production Configuration
# Generated: ${new Date().toISOString()}

# Network Mode
NODE_ENV=production
USE_TESTNET=false
PORT=3000

# BTCPay Server Configuration (YOUR REAL CREDENTIALS)
BTCPAY_URL=https://btcpay0.voltageapp.io
BTCPAY_STORE_ID=HNQsGSwdyQb8Vg3y6srogKjXCDXdARt9Q113N4urcUcG
BTCPAY_API_KEY=1dpQWkChRWpEWiilo1D1ZlI0PEv7EOIIIhliMiD7LnM
BTCPAY_WEBHOOK_SECRET=${generateSecret()}
USE_BTCPAY=true
USE_MOCK_SERVICES=false
USE_MOCK_LIGHTNING=false

# Your Bitcoin wallet (from xpub)
BTC_WALLET_XPUB=xpub6CjGpeuifmhhvy9emDMrkoL5GkTdcXvtnuJLWoeywsZgXCVMBPQuLWRjkfKYfy5PBFt7umMushrbNCL8A6B1PwAyPeHhT8JUZsYL9ZU6XN1

# RGB Configuration
RGB_NETWORK=mainnet
RGB_MOCK_MODE=false
RGB_ASSET_ID=YOUR_LIGHTCAT_ASSET_ID_HERE
RGB_NODE_URL=http://localhost:8080
RGB_NODE_RPC_USER=lightcat
RGB_NODE_RPC_PASSWORD=${generateSecret()}
RGB_WALLET_NAME=lightcat-distribution

# Supabase Configuration (YOUR REAL CREDENTIALS)
SUPABASE_URL=https://xyfqpvxwvlemnraldbjd.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZnFwdnh3dmxlbW5yYWxkYmpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzEwOTYzOSwiZXhwIjoyMDY4Njg1NjM5fQ.GSMgIcht9_O77tPkb1ofQxRixUHt7OdaVXHwUYJ1Y60
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZnFwdnh3dmxlbW5yYWxkYmpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMDk2MzkiZXhwIjoyMDY4Njg1NjM5fQ.dIF_7uErKhpAeBurPGv_oS3gQEfJ6sHQP9mr0FUuC0M
USE_SUPABASE=true

# Security (Generated)
JWT_SECRET=${generateSecret()}
SESSION_SECRET=${generateSecret()}

# Email (Optional - for notifications)
EMAIL_ENABLED=false

# Production Features
ENABLE_REAL_PAYMENTS=true
ENABLE_WEBHOOKS=true
ENABLE_MONITORING=true

# Server Configuration
SERVER_URL=https://rgblightcat.com
CORS_ORIGIN=https://rgblightcat.com

# Token Configuration
TOKEN_PRICE_SATS=2000
TOKENS_PER_BATCH=700
TOTAL_SUPPLY=21000000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
`;

function generateSecret() {
    return require('crypto').randomBytes(32).toString('hex');
}

// Backup current .env
const envPath = path.join(__dirname, '..', '.env');
const backupPath = path.join(__dirname, '..', `.env.backup.${Date.now()}`);

if (fs.existsSync(envPath)) {
    fs.copyFileSync(envPath, backupPath);
    console.log(`✅ Backed up current .env to ${path.basename(backupPath)}`);
}

// Write production config
fs.writeFileSync(envPath, productionConfig);
console.log('✅ Created production .env file');

// Update package.json scripts for production
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

packageJson.scripts['start:production'] = 'NODE_ENV=production node server/index.js';
packageJson.scripts['pm2:start'] = 'pm2 start ecosystem.config.js';
packageJson.scripts['pm2:stop'] = 'pm2 stop all';
packageJson.scripts['pm2:restart'] = 'pm2 restart all';
packageJson.scripts['pm2:logs'] = 'pm2 logs';

fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
console.log('✅ Updated package.json with production scripts');

// Create PM2 ecosystem file
const ecosystemConfig = `module.exports = {
  apps: [{
    name: 'lightcat-api',
    script: './server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'client'],
    wait_ready: true,
    listen_timeout: 3000,
    kill_timeout: 5000
  }]
};`;

fs.writeFileSync(path.join(__dirname, '..', 'ecosystem.config.js'), ecosystemConfig);
console.log('✅ Created PM2 ecosystem configuration');

// Create production deployment checklist
const checklist = `# LIGHTCAT Production Deployment Checklist

## ✅ Pre-Deployment
- [x] Production .env created
- [x] BTCPay credentials configured
- [x] Supabase connected
- [x] Security secrets generated
- [ ] RGB Asset ID added to .env
- [ ] RGB node installed on server
- [ ] SSL certificates configured
- [ ] Domain DNS configured

## 🚀 Deployment Steps

### 1. Install RGB Node (30 min)
\`\`\`bash
ssh your-server
cd /path/to/lightcat
./scripts/install-rgb-node.sh
# Import wallet with your seed phrase
\`\`\`

### 2. Update RGB Asset ID
\`\`\`bash
# Get your RGB asset ID
rgb-cli asset list
# Update .env with RGB_ASSET_ID
nano .env
\`\`\`

### 3. Build Frontend
\`\`\`bash
npm run build
\`\`\`

### 4. Deploy Files
\`\`\`bash
./deploy.sh production
\`\`\`

### 5. Start Production Server
\`\`\`bash
# Using PM2 (recommended)
npm run pm2:start

# Or using systemd
sudo systemctl start lightcat
\`\`\`

### 6. Configure Nginx
\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name rgblightcat.com;
    
    ssl_certificate /etc/letsencrypt/live/rgblightcat.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rgblightcat.com/privkey.pem;
    
    location / {
        root /var/www/lightcat/client;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
\`\`\`

### 7. Test Production
- [ ] Homepage loads
- [ ] Game works
- [ ] Purchase flow works
- [ ] Lightning invoices generate
- [ ] BTCPay webhooks work
- [ ] RGB consignments generate

## 🔒 Post-Deployment Security
- [ ] Run security audit
- [ ] Check SSL rating
- [ ] Test rate limiting
- [ ] Monitor error logs
- [ ] Set up alerts

## 📊 Monitoring
- [ ] PM2 monitoring active
- [ ] Error tracking configured
- [ ] Performance monitoring
- [ ] Uptime monitoring

---
Generated: ${new Date().toISOString()}
`;

fs.writeFileSync(path.join(__dirname, '..', 'PRODUCTION_CHECKLIST.md'), checklist);
console.log('✅ Created production deployment checklist');

console.log('\n🎯 Production Mode Activated!');
console.log('\n📋 Next Steps:');
console.log('1. Review PRODUCTION_CHECKLIST.md');
console.log('2. Add your RGB_ASSET_ID to .env');
console.log('3. Install RGB node on your server');
console.log('4. Run: npm run build');
console.log('5. Deploy with: ./deploy.sh production');
console.log('\n⚠️  IMPORTANT: Do not commit .env to git!');
console.log('\n🚀 Ready for production deployment!');