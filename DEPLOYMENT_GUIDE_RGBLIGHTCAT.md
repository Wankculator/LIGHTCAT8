# 🚀 RGBLIGHTCAT.COM DEPLOYMENT GUIDE

## ⚡ CRITICAL SERVER INFORMATION

**ALWAYS USE THESE DETAILS - DO NOT USE ANY OTHER SERVER INFO:**

- **Server IP**: `147.93.105.138` ❗ (NOT 209.38.86.47)
- **Username**: `root`
- **Password**: `ObamaknowsJA8@`
- **Deploy Path**: `/var/www/rgblightcat/client/`
- **Website URL**: https://rgblightcat.com

## 📁 Project Structure

```
litecat-website/
├── client/              # Frontend files (deploy this folder)
│   ├── js/             # JavaScript files
│   ├── css/            # Stylesheets
│   ├── images/         # Image assets
│   ├── game.html       # Game page
│   └── index.html      # Main page
└── server/             # Backend (separate deployment)
```

## 🔧 DEPLOYMENT COMMANDS

### 1. Deploy Single File
```bash
cd /mnt/c/Users/sk84l/Downloads/RGB\ LIGHT\ CAT/litecat-website

# Deploy a single file (example: game.html)
sshpass -p 'ObamaknowsJA8@' scp -o StrictHostKeyChecking=no \
  client/game.html \
  root@147.93.105.138:/var/www/rgblightcat/client/
```

### 2. Deploy Multiple Files
```bash
# Deploy multiple specific files
sshpass -p 'ObamaknowsJA8@' scp -o StrictHostKeyChecking=no \
  client/game.html \
  client/index.html \
  client/js/emergency-yellow-fix.js \
  root@147.93.105.138:/var/www/rgblightcat/client/
```

### 3. Deploy Entire Folders
```bash
# Deploy all JavaScript files
sshpass -p 'ObamaknowsJA8@' scp -r -o StrictHostKeyChecking=no \
  client/js/* \
  root@147.93.105.138:/var/www/rgblightcat/client/js/

# Deploy all CSS files
sshpass -p 'ObamaknowsJA8@' scp -r -o StrictHostKeyChecking=no \
  client/css/* \
  root@147.93.105.138:/var/www/rgblightcat/client/css/
```

### 4. Deploy Everything (Full Client Folder)
```bash
# Deploy entire client folder
sshpass -p 'ObamaknowsJA8@' rsync -avz --delete \
  -e "ssh -o StrictHostKeyChecking=no" \
  client/ \
  root@147.93.105.138:/var/www/rgblightcat/client/
```

### 5. Clear Cache After Deployment
```bash
# Clear nginx cache and reload
sshpass -p 'ObamaknowsJA8@' ssh -o StrictHostKeyChecking=no \
  root@147.93.105.138 \
  "rm -rf /var/cache/nginx/* && systemctl reload nginx"
```

## 📋 STEP-BY-STEP DEPLOYMENT PROCESS

### For Bug Fixes:
1. **Navigate to project directory**:
   ```bash
   cd /mnt/c/Users/sk84l/Downloads/RGB\ LIGHT\ CAT/litecat-website
   ```

2. **Make your fixes** in the appropriate files

3. **Test locally** if possible

4. **Deploy the fixed files**:
   ```bash
   # Example: Deploying a game.html fix
   sshpass -p 'ObamaknowsJA8@' scp -o StrictHostKeyChecking=no \
     client/game.html \
     root@147.93.105.138:/var/www/rgblightcat/client/
   ```

5. **Clear cache**:
   ```bash
   sshpass -p 'ObamaknowsJA8@' ssh -o StrictHostKeyChecking=no \
     root@147.93.105.138 \
     "rm -rf /var/cache/nginx/* && systemctl reload nginx"
   ```

6. **Verify** at https://rgblightcat.com

## ⚠️ COMMON MISTAKES TO AVOID

### ❌ WRONG Server IP
```bash
# NEVER USE THIS:
root@209.38.86.47  # This is WRONG!

# ALWAYS USE THIS:
root@147.93.105.138  # This is CORRECT!
```

### ❌ WRONG Deploy Path
```bash
# NEVER USE THESE:
/var/www/lightcat/      # Wrong!
/var/www/html/          # Wrong!

# ALWAYS USE THIS:
/var/www/rgblightcat/client/  # Correct!
```

### ❌ WRONG Password Format
```bash
# If password has special characters, use single quotes:
sshpass -p 'ObamaknowsJA8@'  # Correct!
sshpass -p "ObamaknowsJA8@"  # May fail with special chars
```

## 🎯 SPECIFIC FILE LOCATIONS

### Game Files:
- Game HTML: `/var/www/rgblightcat/client/game.html`
- Game JS: `/var/www/rgblightcat/client/js/game/`
- Game CSS: `/var/www/rgblightcat/client/css/`

### Main Site:
- Homepage: `/var/www/rgblightcat/client/index.html`
- Main CSS: `/var/www/rgblightcat/client/styles/main.css`
- Main JS: `/var/www/rgblightcat/client/js/`

### Emergency Fixes:
- Yellow Fix: `/var/www/rgblightcat/client/js/emergency-yellow-fix.js`
- Mobile Fix: `/var/www/rgblightcat/client/js/mobile-game-freeze-fix.js`

## 🔍 VERIFICATION COMMANDS

### Check if file was deployed:
```bash
sshpass -p 'ObamaknowsJA8@' ssh -o StrictHostKeyChecking=no \
  root@147.93.105.138 \
  "ls -la /var/www/rgblightcat/client/game.html"
```

### View deployed file content:
```bash
sshpass -p 'ObamaknowsJA8@' ssh -o StrictHostKeyChecking=no \
  root@147.93.105.138 \
  "head -20 /var/www/rgblightcat/client/game.html"
```

### Check nginx status:
```bash
sshpass -p 'ObamaknowsJA8@' ssh -o StrictHostKeyChecking=no \
  root@147.93.105.138 \
  "systemctl status nginx"
```

## 🚨 TROUBLESHOOTING

### If deployment fails:

1. **Connection refused/reset**:
   - Wait 30 seconds and try again
   - The server might be rate-limiting connections

2. **Permission denied**:
   - Double-check password: `ObamaknowsJA8@`
   - Ensure using single quotes around password

3. **File not updating**:
   - Clear browser cache (Ctrl+Shift+R)
   - Clear server nginx cache (see command above)

4. **SSH warnings**:
   - The "Warning: Permanently added..." message is normal
   - Use `-o StrictHostKeyChecking=no` to suppress

## 📝 QUICK REFERENCE CARD

```bash
# SAVE THIS FOR QUICK COPY-PASTE:

# Server Details:
IP: 147.93.105.138
User: root
Pass: ObamaknowsJA8@
Path: /var/www/rgblightcat/client/

# Quick Deploy Command Template:
cd /mnt/c/Users/sk84l/Downloads/RGB\ LIGHT\ CAT/litecat-website && \
sshpass -p 'ObamaknowsJA8@' scp -o StrictHostKeyChecking=no \
  client/[FILE_TO_DEPLOY] \
  root@147.93.105.138:/var/www/rgblightcat/client/[DESTINATION_PATH]

# Clear Cache:
sshpass -p 'ObamaknowsJA8@' ssh -o StrictHostKeyChecking=no \
  root@147.93.105.138 "rm -rf /var/cache/nginx/* && systemctl reload nginx"
```

## ✅ DEPLOYMENT CHECKLIST

Before deploying:
- [ ] Using correct server IP (147.93.105.138)?
- [ ] Using correct path (/var/www/rgblightcat/client/)?
- [ ] Password in single quotes?
- [ ] Files tested locally?

After deploying:
- [ ] Files uploaded successfully?
- [ ] Cache cleared?
- [ ] Website working at https://rgblightcat.com?
- [ ] No console errors in browser?

---

**REMEMBER**: When in doubt, always refer to this guide. Using the wrong server or path will deploy to the wrong location!

Last Updated: 2025-07-29