# CORRECT DEPLOYMENT GUIDE FOR RGBLIGHTCAT

## ⚠️ CRITICAL: Use These Directories

### Production Server Details:
- **Server IP**: 147.93.105.138
- **Password**: ObamaknowsJA8@
- **CORRECT Deploy Directory**: `/var/www/rgblightcat/`
- **DO NOT USE**: `/var/www/lightcat/` or `/var/www/rgblightcat.com/`

### Directory Structure:
```
/var/www/rgblightcat/
├── client/           # Frontend files (THIS IS WHAT NGINX SERVES)
│   ├── index.html
│   ├── game.html
│   ├── css/
│   ├── js/
│   └── assets/
├── server/           # Backend API
└── ...
```

### Deployment Commands:

#### Deploy Frontend Files:
```bash
# Deploy index.html
sshpass -p 'ObamaknowsJA8@' scp -o StrictHostKeyChecking=no \
  client/index.html root@147.93.105.138:/var/www/rgblightcat/client/

# Deploy JavaScript
sshpass -p 'ObamaknowsJA8@' scp -o StrictHostKeyChecking=no \
  client/js/*.js root@147.93.105.138:/var/www/rgblightcat/client/js/

# Deploy CSS
sshpass -p 'ObamaknowsJA8@' scp -o StrictHostKeyChecking=no \
  client/css/*.css root@147.93.105.138:/var/www/rgblightcat/client/css/

# Deploy Game Files
sshpass -p 'ObamaknowsJA8@' scp -o StrictHostKeyChecking=no \
  client/js/game/*.js root@147.93.105.138:/var/www/rgblightcat/client/js/game/
```

#### Deploy Backend:
```bash
# API files go to server directory
sshpass -p 'ObamaknowsJA8@' scp -r server/* \
  root@147.93.105.138:/var/www/rgblightcat/server/

# Restart API
sshpass -p 'ObamaknowsJA8@' ssh root@147.93.105.138 \
  "cd /var/www/rgblightcat && pm2 restart rgblightcat-api"
```

### Nginx Configuration:
- Config file: `/etc/nginx/sites-enabled/rgblightcat`
- Document root: `/var/www/rgblightcat/client`
- API proxy: `http://127.0.0.1:3000`

### Common Issues:

1. **Wrong Directory**: Always use `/var/www/rgblightcat/`
2. **Cache Issues**: Files update but browser shows old version
   - Clear CloudFlare cache if using CDN
   - Add version parameter: `?v=timestamp`
3. **PM2 Issues**: UI servers crash, use nginx static serving instead

### Quick Deploy Script:
```bash
#!/bin/bash
PASS="ObamaknowsJA8@"
SERVER="root@147.93.105.138"
DEPLOY_DIR="/var/www/rgblightcat"

# Deploy all frontend
sshpass -p "$PASS" scp -r client/* $SERVER:$DEPLOY_DIR/client/

echo "✅ Deployed to production"
```

## Remember:
- ALWAYS deploy to `/var/www/rgblightcat/`
- NEVER edit nginx without backing up first
- Test locally before deploying
- Check site works after deployment