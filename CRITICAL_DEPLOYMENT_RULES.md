# 🚨 CRITICAL DEPLOYMENT RULES - READ BEFORE DEPLOYING! 🚨

## ⛔ NEVER MAKE THESE MISTAKES AGAIN

### 1. WRONG DIRECTORIES - THE #1 MISTAKE
```
❌ NEVER USE: /var/www/lightcat/        <- OLD, WRONG!
❌ NEVER USE: /var/www/rgblightcat.com/  <- OLD, WRONG!
✅ ALWAYS USE: /var/www/rgblightcat/    <- ONLY CORRECT DIRECTORY!
```

### 2. EXACT DEPLOYMENT PATHS
```bash
# Frontend files MUST go here:
/var/www/rgblightcat/client/           <- index.html, game.html
/var/www/rgblightcat/client/css/       <- All CSS files
/var/www/rgblightcat/client/js/        <- All JS files
/var/www/rgblightcat/client/js/game/   <- Game JS files

# Backend files go here:
/var/www/rgblightcat/server/           <- API files
```

### 3. HOW FILES ARE SERVED
```
User visits rgblightcat.com
    ↓
Nginx (port 443/80)
    ↓
Proxies to PM2 UI Server (port 8082)
    ↓
serve-ui.js serves from /var/www/rgblightcat/client/
```

### 4. DEPLOYMENT COMMANDS - COPY & PASTE THESE!

#### Deploy a JavaScript file:
```bash
sshpass -p 'ObamaknowsJA8@' scp -o StrictHostKeyChecking=no \
  client/js/[filename].js \
  root@147.93.105.138:/var/www/rgblightcat/client/js/
```

#### Deploy index.html:
```bash
sshpass -p 'ObamaknowsJA8@' scp -o StrictHostKeyChecking=no \
  client/index.html \
  root@147.93.105.138:/var/www/rgblightcat/client/
```

#### Deploy CSS:
```bash
sshpass -p 'ObamaknowsJA8@' scp -o StrictHostKeyChecking=no \
  client/css/[filename].css \
  root@147.93.105.138:/var/www/rgblightcat/client/css/
```

### 5. VERIFICATION STEPS - DO THESE EVERY TIME!

#### Step 1: Check file was copied
```bash
sshpass -p 'ObamaknowsJA8@' ssh root@147.93.105.138 \
  "ls -la /var/www/rgblightcat/client/[your-file]"
```

#### Step 2: Check it's being served
```bash
curl -s https://rgblightcat.com | grep "[your-feature]"
```

#### Step 3: Clear cache and test
- Add ?v=timestamp to URL: https://rgblightcat.com/?v=123456
- Use incognito/private browsing
- Clear mobile browser cache: Settings → Safari → Clear History

### 6. COMMON PROBLEMS & SOLUTIONS

#### "I deployed but don't see changes"
1. You deployed to WRONG directory (check paths above)
2. Browser cache - use incognito mode
3. CloudFlare cache - wait 5 minutes or purge cache
4. PM2 needs restart: `pm2 restart rgblightcat-ui`

#### "Site shows redirect error"
DON'T EDIT NGINX! You probably broke it. Restore backup:
```bash
sshpass -p 'ObamaknowsJA8@' ssh root@147.93.105.138 \
  "cp /etc/nginx/sites-enabled/rgblightcat.backup /etc/nginx/sites-enabled/rgblightcat && nginx -s reload"
```

#### "Changes work on desktop but not mobile"
1. Mobile browsers cache aggressively
2. Clear Safari: Settings → Safari → Clear History and Website Data
3. Chrome: Three dots → History → Clear browsing data
4. Or just use incognito/private mode

### 7. PM2 COMMANDS
```bash
# Check status
pm2 list

# Restart UI server (if needed)
pm2 restart rgblightcat-ui

# Check logs
pm2 logs rgblightcat-ui --lines 50
```

### 8. THE GOLDEN RULE
```
IF YOU'RE NOT SURE WHERE TO DEPLOY:
/var/www/rgblightcat/client/  <- ALWAYS HERE!
```

### 9. EMERGENCY CONTACTS
- Server IP: 147.93.105.138
- Password: ObamaknowsJA8@
- Main directory: /var/www/rgblightcat/
- UI Port: 8082
- API Port: 3000

### 10. CHECKLIST BEFORE SAYING "IT'S NOT WORKING"
- [ ] Did you deploy to /var/www/rgblightcat/client/?
- [ ] Did you clear your browser cache?
- [ ] Did you try incognito mode?
- [ ] Did you check the file exists on server?
- [ ] Did you wait 2-3 minutes for caches to clear?
- [ ] Did you add ?v=timestamp to force refresh?

## 🎯 QUICK DEPLOY SCRIPT
Save this as `deploy-quick.sh`:
```bash
#!/bin/bash
FILE=$1
TYPE=$2  # js, css, or html

if [ "$TYPE" = "js" ]; then
    sshpass -p 'ObamaknowsJA8@' scp -o StrictHostKeyChecking=no \
      client/js/$FILE root@147.93.105.138:/var/www/rgblightcat/client/js/
elif [ "$TYPE" = "css" ]; then
    sshpass -p 'ObamaknowsJA8@' scp -o StrictHostKeyChecking=no \
      client/css/$FILE root@147.93.105.138:/var/www/rgblightcat/client/css/
elif [ "$TYPE" = "html" ]; then
    sshpass -p 'ObamaknowsJA8@' scp -o StrictHostKeyChecking=no \
      client/$FILE root@147.93.105.138:/var/www/rgblightcat/client/
fi

echo "✅ Deployed $FILE to production!"
echo "🌐 Check: https://rgblightcat.com/?v=$(date +%s)"
```

## REMEMBER: /var/www/rgblightcat/ IS THE ONLY CORRECT PATH!