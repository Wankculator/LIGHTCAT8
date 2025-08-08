# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Project Overview
LIGHTCAT is an RGB Protocol token platform featuring:
- First cat meme token on RGB Protocol (Bitcoin)
- Lightning Network payment integration via BTCPay Server
- Gamified purchase system with Three.js arcade game
- 21M token supply (700 tokens per batch @ 2,000 sats each)
- Real-time WebSocket updates and progress tracking
- Mobile-responsive professional UI

## 🏗️ Architecture & Structure

### Directory Layout:
```
/
├── client/              # Frontend (Vanilla JS, no frameworks)
│   ├── js/game/        # Three.js game files
│   ├── css/            # Styles (mobile-optimized.css)
│   └── index.html      # Main SPA entry point
├── server/             # Express.js backend
│   ├── controllers/    # Request handlers
│   ├── services/       # Business logic (RGB, Lightning, Supabase)
│   ├── routes/         # API endpoints
│   └── app.js         # Server entry point
├── docs/               # Comprehensive documentation
│   ├── ARCHITECTURE.md # System design and components
│   ├── API_REFERENCE.md # Complete API documentation
│   ├── PAYMENT_FLOW.md # RGB + Lightning flow details
│   ├── GAME_MECHANICS.md # Game logic and scoring
│   ├── SECURITY.md     # Security measures and checklist
│   ├── DEPLOYMENT.md   # Production deployment guide
│   ├── DATABASE_SCHEMA.md # Supabase schema details
│   └── TROUBLESHOOTING.md # Common issues and solutions
├── scripts/           # Deployment and utility scripts
└── tests/            # Jest test suites
```

[... rest of the existing content remains the same ...]

## 🚢 Production Deployment Method

### Production Environment:
- **Domain**: rgblightcat.com
- **Production Path**: `/var/www/rgblightcat/`
- **Frontend Port**: 8082 (http-server for static files)
- **API Port**: 3000 (Node.js Express server)
- **Reverse Proxy**: Nginx (SSL termination, routing)
- **Process Manager**: nohup (logs to /var/www/rgblightcat/logs/)

### Deployment Architecture:
```
User → rgblightcat.com → Nginx (80/443)
                           ↓
         ┌─────────────────┴─────────────────┐
         ↓                                   ↓
   Frontend (8082)                     API (3000)
   http-server                    Node.js/Express
   /var/www/rgblightcat/client    /var/www/rgblightcat/server
```

### Standard Deployment Commands:

#### Full Deployment (Frontend + Backend):
```bash
# 1. Create timestamped backup
BACKUP_DATE=$(date +%Y%m%d-%H%M%S)
mkdir -p /root/backups/${BACKUP_DATE}
cp -r /var/www/rgblightcat /root/backups/${BACKUP_DATE}/

# 2. Deploy frontend (instant, no restart needed)
cp -rf /root/client/* /var/www/rgblightcat/client/
chmod -R 755 /var/www/rgblightcat/client/

# 3. Deploy backend (requires restart)
cp -rf /root/server/* /var/www/rgblightcat/server/
pkill -f "node.*app.js"
cd /var/www/rgblightcat/server
nohup node app.js > /var/www/rgblightcat/logs/api.log 2>&1 &

# 4. Verify deployment
sleep 5
curl -s http://localhost:8082 && echo "✅ Frontend OK"
curl -s http://localhost:3000/api/health && echo "✅ API OK"
```

#### Frontend-Only Deployment:
```bash
# No restart needed - changes are immediate
cp -rf /root/client/* /var/www/rgblightcat/client/
echo "✅ Frontend deployed instantly"
```

#### Backend-Only Deployment:
```bash
cp -rf /root/server/* /var/www/rgblightcat/server/
pkill -f "node.*app.js"
cd /var/www/rgblightcat/server
nohup node app.js > /var/www/rgblightcat/logs/api.log 2>&1 &
```

### Service Management:

#### Check Service Status:
```bash
ps aux | grep -E "(http-server|node.*app.js)"
netstat -tulpn | grep -E "(8082|3000)"
```

#### Restart Frontend (rarely needed):
```bash
pkill -f "http-server.*8082"
cd /var/www/rgblightcat
nohup npx http-server client -p 8082 -c-1 --cors > logs/client.log 2>&1 &
```

#### Restart Backend:
```bash
pkill -f "node.*app.js"
cd /var/www/rgblightcat/server
nohup node app.js > logs/api.log 2>&1 &
```

### Critical Paths:
- **Production**: `/var/www/rgblightcat/`
- **Development**: `/root/`
- **Logs**: `/var/www/rgblightcat/logs/`
- **Backups**: `/root/backups/`

### Deployment Verification:
1. Frontend loads: `curl http://localhost:8082`
2. API health: `curl http://localhost:3000/api/health`
3. Game loads: `curl http://localhost:8082/game.html | grep game-canvas`
4. Stats work: `curl http://localhost:3000/api/stats`
5. No errors: `tail -20 /var/www/rgblightcat/logs/api.log`

### Rollback Procedure:
```bash
# Restore from backup if deployment fails
BACKUP_DATE="20250807-HHMMSS"  # Use actual timestamp
cp -r /root/backups/${BACKUP_DATE}/rgblightcat/* /var/www/rgblightcat/
# Then restart services as needed
```

📚 **Complete deployment documentation**: `/root/DEPLOYMENT_METHOD.md`

## 💾 Memory Log
- 2024-02-25: Initialized Claude.md memory tracking system
- 2025-08-07: Added comprehensive deployment method documentation
- Production deployment confirmed working with real Bitcoin Lightning payments