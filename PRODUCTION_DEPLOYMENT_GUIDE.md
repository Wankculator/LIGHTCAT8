# 🚀 LIGHTCAT Production Deployment Guide

## 📋 Pre-Launch Checklist

### ✅ What's Ready
- Full RGB payment flow implementation
- BTCPay Voltage.cloud integration code
- Automatic distribution system
- Real-time progress tracking
- RGB node installation scripts
- Blockchain monitoring service
- Security validations complete

### 🔧 What You Need
1. **BTCPay Server Account** at https://voltage.cloud/btcpay
2. **RGB Node Server** (4GB RAM, Ubuntu/Debian)
3. **Your RGB Wallet** with 21M LIGHTCAT tokens
4. **Production Database** (Supabase)
5. **Domain with SSL** (e.g., rgblightcat.com)

## 🏃 Quick Start (3 Steps)

### Step 1: Install RGB Node (30 minutes)
```bash
# On your server
cd /mnt/c/Users/sk84l/Downloads/RGB\ LIGHT\ CAT/litecat-website
scp scripts/install-rgb-node.sh your-server:~/
ssh your-server
./install-rgb-node.sh

# Import your wallet
cd ~/rgb-node && ./import-wallet.sh
# Enter your seed phrase with 21M LIGHTCAT
```

### Step 2: Configure BTCPay (15 minutes)
1. Sign up at https://voltage.cloud/btcpay ($6.99/month)
2. Create a new store
3. Get your API credentials
4. Update `.env.production`:
```env
BTCPAY_URL=https://your-store.voltage.cloud
BTCPAY_STORE_ID=your-store-id
BTCPAY_API_KEY=your-api-key
BTCPAY_WEBHOOK_SECRET=your-webhook-secret
```

### Step 3: Deploy & Launch (15 minutes)
```bash
# Update production config
cp .env.testnet .env.production
nano .env.production  # Add your credentials

# Deploy
npm run build
./deploy.sh production

# Start services
pm2 start ecosystem.config.js --env production
```

## 📊 Detailed Setup Instructions

### 1. Server Requirements
- **Minimum**: 4GB RAM, 2 CPU cores, 50GB storage
- **Recommended**: 8GB RAM, 4 CPU cores, 100GB SSD
- **OS**: Ubuntu 20.04+ or Debian 11+

### 2. RGB Node Setup
```bash
# SSH to your server
ssh your-server

# Run installation
wget https://raw.githubusercontent.com/your-repo/scripts/install-rgb-node.sh
chmod +x install-rgb-node.sh
./install-rgb-node.sh

# Import wallet (IMPORTANT: Have your seed phrase ready)
cd ~/rgb-node
./import-wallet.sh

# Start RGB node
./start-rgb.sh

# Verify it's running
./check-status.sh
```

### 3. BTCPay Configuration

#### A. Create BTCPay Account
1. Go to https://voltage.cloud
2. Choose "BTCPay Server" ($6.99/month)
3. Create your store
4. Name it "LIGHTCAT Token Sale"

#### B. Configure Store Settings
1. **General Settings**:
   - Store Name: LIGHTCAT
   - Default Currency: BTC
   - Preferred Price Source: Kraken

2. **Payment Settings**:
   - Enable Lightning Network
   - Invoice Expiry: 15 minutes
   - Payment Tolerance: 0%

3. **Webhook Settings**:
   - Webhook URL: `https://yourdomain.com/api/rgb/webhook/btcpay`
   - Events: Invoice Settled, Invoice Expired
   - Get your webhook secret

#### C. Get API Credentials
1. Go to Store Settings → Access Tokens
2. Create new token with permissions:
   - View invoices
   - Create invoice
   - View store settings
3. Save the API key securely

### 4. Environment Configuration

Create `.env.production`:
```env
# Node Environment
NODE_ENV=production
PORT=3000

# BTCPay Configuration
BTCPAY_URL=https://your-store.voltage.cloud
BTCPAY_STORE_ID=YOUR_STORE_ID
BTCPAY_API_KEY=YOUR_API_KEY
BTCPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET

# RGB Configuration
RGB_NODE_URL=http://localhost:8080
RGB_NODE_RPC_USER=lightcat
RGB_NODE_RPC_PASSWORD=YOUR_RGB_PASSWORD
RGB_ASSET_ID=YOUR_LIGHTCAT_ASSET_ID
RGB_WALLET_NAME=lightcat-distribution

# Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_KEY=YOUR_SERVICE_KEY

# Security
JWT_SECRET=YOUR_JWT_SECRET
SESSION_SECRET=YOUR_SESSION_SECRET

# Features
USE_MOCK_SERVICES=false
USE_MOCK_LIGHTNING=false
RGB_MOCK_MODE=false
ENABLE_REAL_PAYMENTS=true
```

### 5. Database Setup

```bash
# Run migrations
npm run db:migrate

# Verify tables
psql $DATABASE_URL -c "\dt"
```

### 6. SSL Certificate

Using Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d rgblightcat.com -d www.rgblightcat.com
```

### 7. Process Management with PM2

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
pm2 ecosystem

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup
```

### 8. Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name rgblightcat.com;

    ssl_certificate /etc/letsencrypt/live/rgblightcat.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rgblightcat.com/privkey.pem;

    # Frontend
    location / {
        root /var/www/lightcat/client;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 🧪 Testing Before Launch

### 1. Test RGB Node
```bash
# Check wallet balance
rgb-cli asset balance YOUR_ASSET_ID

# Test transfer (small amount)
rgb-cli transfer create --asset YOUR_ASSET_ID --amount 700 --recipient TEST_INVOICE
```

### 2. Test BTCPay
```bash
# Create test invoice
curl -X POST https://your-store.voltage.cloud/api/v1/stores/YOUR_STORE_ID/invoices \
  -H "Authorization: token YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"amount": 2000, "currency": "SATS"}'
```

### 3. Test Full Flow
1. Go to https://yourdomain.com
2. Play game to unlock tier
3. Enter test RGB invoice
4. Pay Lightning invoice
5. Verify consignment download

## 🚨 Launch Day Protocol

### 1. Pre-Launch (1 hour before)
- [ ] Verify all services running
- [ ] Check RGB node sync status
- [ ] Test payment flow one more time
- [ ] Clear test data from database
- [ ] Enable production monitoring

### 2. Launch
- [ ] Announce on social media
- [ ] Monitor first transactions closely
- [ ] Watch server resources
- [ ] Check error logs

### 3. Post-Launch
- [ ] Monitor conversion rates
- [ ] Track any errors
- [ ] Respond to user issues
- [ ] Celebrate! 🎉

## 📊 Monitoring

### Real-time Monitoring
```bash
# Watch API logs
pm2 logs api

# Monitor RGB node
tail -f ~/.rgb/rgb.log

# Check payment status
curl https://yourdomain.com/api/rgb/stats
```

### Key Metrics
- Total batches sold
- Unique buyers
- Average transaction time
- Error rate
- Server response time

## 🆘 Troubleshooting

### RGB Node Issues
```bash
# Node not starting
sudo systemctl status rgb-node
journalctl -u rgb-node -n 50

# Wallet not found
rgb-cli wallet list
rgb-cli wallet unlock lightcat-distribution
```

### BTCPay Issues
```bash
# Webhook not received
curl https://your-store.voltage.cloud/api/v1/stores/YOUR_STORE_ID/webhooks

# Invoice not created
Check API key permissions
Verify store configuration
```

### Payment Not Processing
1. Check BTCPay webhook logs
2. Verify RGB node is running
3. Check database for invoice record
4. Review application logs

## 📞 Support Contacts

- **BTCPay Support**: support@voltage.cloud
- **RGB Community**: https://t.me/rgbprotocol
- **Your Team**: [Add your contacts]

## 🎯 Success Criteria

Launch is successful when:
- ✅ First 10 payments process successfully
- ✅ No critical errors in first hour
- ✅ Server load remains under 50%
- ✅ Users can download consignments
- ✅ Progress bar updates in real-time

---

**Remember**: The system is designed to handle failures gracefully. If something goes wrong, check logs, fix the issue, and the system will recover automatically.

**Good luck with your launch! 🚀**