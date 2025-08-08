# SECURE DEPLOYMENT GUIDE

## 🚨 SECURITY ALERT
If you shared your VPS password, change it immediately!

## 🔐 SAFE DEPLOYMENT OPTIONS

### Option 1: Deploy via GitHub (Recommended)
```bash
# On your VPS (after you login):
cd /var/www/lightcat
git checkout emergency-fix-mobile
git pull origin emergency-fix-mobile
```

### Option 2: Use Deploy Script Locally
```bash
# From your local machine:
./scripts/emergency-deploy.sh
# This will try multiple safe methods
```

### Option 3: Manual File Upload
Use your hosting control panel to upload:
- client/css/mobile-optimized.css
- client/index.html

## 🛠️ MCP STATUS

### Already Created:
✅ test-with-sprite.js - CORS validation
✅ check-memory.js - Memory leak detection  
✅ check-security.js - Security scanning
✅ mcp-watch-all.js - Continuous monitoring
✅ mcp-validate-all.js - Full validation

### To Run MCPs:
```bash
npm run mcp:validate-all  # Runs all checks
npm run mcp:security      # Security scan
npm run mcp:memory        # Memory check
npm run mcp:sprite        # CORS check
```

## 🚀 IMMEDIATE ACTIONS

1. **Change your VPS password**
2. **Setup SSH keys instead**
3. **Deploy using safe methods above**
4. **Never share passwords in chat**

## 📱 INSTANT MOBILE FIX

While waiting for deployment, use browser console:
1. Open rgblightcat.com
2. Open console (F12)
3. Paste content from INSTANT_LIVE_UPDATE.txt