# 🐱⚡ LIGHTCAT8 - RGB Protocol Token Platform

## 🚀 Live Site: [rgblightcat.com](http://rgblightcat.com)

### Current Status (Aug 8, 2025)
✅ **SITE IS LIVE AND WORKING**
- Frontend: Running on port 8082
- API: Running on port 3000  
- VPS: 147.93.105.138

## 📁 Project Structure
```
LIGHTCAT8/
├── client/              # Frontend files
│   ├── index.html      # Main landing page
│   ├── game.html       # Three.js arcade game
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript files
│   └── images/         # Assets
├── server/             # Backend API
│   ├── serve-ui.js     # UI server (port 8082)
│   └── serve-api.js    # API server (port 3000)
├── scripts/            # Deployment scripts
└── docs/               # Documentation
```

## 🔧 Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Start frontend
cd client && python3 -m http.server 8082

# Start API (in another terminal)
node server/serve-api.js
```

### Production Deployment
```bash
# SSH to VPS
ssh root@147.93.105.138
# Password: ObamaknowsJA8@

# Navigate to project
cd /var/www/rgblightcat

# Restart services
systemctl restart lightcat-ui lightcat-api
```

## 🌟 Features
- **RGB Protocol Integration** - First cat meme token on RGB
- **Lightning Payments** - Via BTCPay Server
- **3D Arcade Game** - Unlock purchase tiers
- **Real-time Updates** - WebSocket integration
- **Mobile Responsive** - Optimized for all devices

## 📊 Token Economics
- **Total Supply**: 21,000,000 LIGHTCAT
- **Batch Size**: 700 tokens
- **Price**: 2,000 sats per batch
- **Game Tiers**:
  - Bronze (11+ score): 5 batches max
  - Silver (18+ score): 8 batches max
  - Gold (28+ score): 10 batches max

## 🛠️ Tech Stack
- **Frontend**: Vanilla JS, Three.js, HTML5
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL)
- **Payments**: BTCPay Server, Lightning Network
- **Blockchain**: RGB Protocol on Bitcoin
- **Server**: Ubuntu VPS with Nginx

## 📝 Important Files
- `/etc/systemd/system/lightcat-ui.service` - UI service config
- `/etc/systemd/system/lightcat-api.service` - API service config
- `/etc/nginx/sites-enabled/rgblightcat` - Nginx config
- `/var/www/rgblightcat/` - Production files location

## 🔐 Security
- Rate limiting on all endpoints
- Input validation for RGB invoices
- CORS properly configured
- No private keys in codebase

## 📞 Support
- **GitHub**: [github.com/Wankculator/LIGHTCAT8](https://github.com/Wankculator/LIGHTCAT8)
- **Website**: [rgblightcat.com](http://rgblightcat.com)

---
*Last Updated: August 8, 2025*