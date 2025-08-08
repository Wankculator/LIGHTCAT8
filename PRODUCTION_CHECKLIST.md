# LIGHTCAT Production Deployment Checklist

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
```bash
ssh your-server
cd /path/to/lightcat
./scripts/install-rgb-node.sh
# Import wallet with your seed phrase
```

### 2. Update RGB Asset ID
```bash
# Get your RGB asset ID
rgb-cli asset list
# Update .env with RGB_ASSET_ID
nano .env
```

### 3. Build Frontend
```bash
npm run build
```

### 4. Deploy Files
```bash
./deploy.sh production
```

### 5. Start Production Server
```bash
# Using PM2 (recommended)
npm run pm2:start

# Or using systemd
sudo systemctl start lightcat
```

### 6. Configure Nginx
```nginx
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
```

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
Generated: 2025-07-28T03:11:30.295Z
