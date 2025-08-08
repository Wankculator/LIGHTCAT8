# 🚀 RGBLIGHTCAT DEPLOYMENT PROCESS GUIDE

## ⚠️ CRITICAL: How to Deploy UI Changes That Actually Show Up!

This guide documents the EXACT process to deploy changes to rgblightcat.com and ensure they're visible immediately.

---

## 🔴 COMMON MISTAKES THAT PREVENT UI UPDATES

### 1. **LOCALHOST API CALLS** (Most Common Issue)
```javascript
// ❌ WRONG - This breaks in production!
const response = await fetch('http://localhost:3000/api/rgb/stats');

// ✅ CORRECT - Use relative paths
const response = await fetch('/api/rgb/stats');
```

### 2. **JavaScript Not Running Due to Errors**
- If your JavaScript has errors, the entire script stops
- Numbers won't format, features won't work
- Always check browser console!

### 3. **Cache Issues**
- Browsers aggressively cache JavaScript and CSS
- CloudFlare might cache for 5 minutes
- Mobile browsers are worst offenders

### 4. **Wrong Deployment Directory**
```bash
# ❌ WRONG DIRECTORIES
/var/www/lightcat/
/var/www/rgblightcat.com/
/var/www/html/

# ✅ CORRECT DIRECTORY
/var/www/rgblightcat/
```

---

## ✅ CORRECT DEPLOYMENT PROCESS

### Step 1: Pre-Deployment Checks
```bash
# 1. Test locally first
npm run dev
# Visit http://localhost:8082 and verify changes work

# 2. Check for localhost references
grep -r "localhost:3000" client/ --include="*.html" --include="*.js"
# If found, change to relative paths!

# 3. Run linter to catch errors
npm run lint
```

### Step 2: Deploy Files
```bash
# Deploy HTML files
sshpass -p 'ObamaknowsJA8@' scp client/index.html root@147.93.105.138:/var/www/rgblightcat/client/

# Deploy JavaScript files
sshpass -p 'ObamaknowsJA8@' scp client/js/*.js root@147.93.105.138:/var/www/rgblightcat/client/js/

# Deploy CSS files
sshpass -p 'ObamaknowsJA8@' scp client/css/*.css root@147.93.105.138:/var/www/rgblightcat/client/css/
```

### Step 3: Verify Deployment
```bash
# Check file was uploaded
sshpass -p 'ObamaknowsJA8@' ssh root@147.93.105.138 "ls -la /var/www/rgblightcat/client/index.html"

# Check for JavaScript errors in the file
sshpass -p 'ObamaknowsJA8@' ssh root@147.93.105.138 "grep -c 'localhost:3000' /var/www/rgblightcat/client/index.html"
# Should return 0!
```

### Step 4: Force Browser Refresh
```bash
# Method 1: Add timestamp to URL
https://rgblightcat.com/?v=$(date +%s)

# Method 2: Use private/incognito mode

# Method 3: Clear browser cache completely
```

---

## 📱 MOBILE-SPECIFIC DEPLOYMENT ISSUES

### Problem: Numbers Not Formatting on Mobile
**Symptoms**: You see 2,100 instead of 2.1k

**Solutions**:
1. **Add inline formatting script** right after the numbers:
```html
<script>
    if (window.innerWidth <= 768) {
        // Format immediately on page load
        setTimeout(() => {
            const sold = document.getElementById('soldBatches');
            if (sold) sold.textContent = formatNumber(sold.textContent);
        }, 100);
    }
</script>
```

2. **Ensure NumberFormatter is called** after API updates:
```javascript
// In updateMintStats function
NumberFormatter.applyToElement('soldBatches', data.batchesSold);
```

3. **Debug on mobile** using test page:
```bash
# Deploy test page
sshpass -p 'ObamaknowsJA8@' scp client/test-mobile-numbers.html root@147.93.105.138:/var/www/rgblightcat/client/

# Visit on phone
https://rgblightcat.com/test-mobile-numbers.html
```

---

## 🔍 DEBUGGING CHECKLIST

When changes don't appear:

1. **Check nginx is serving correct directory**:
```bash
sshpass -p 'ObamaknowsJA8@' ssh root@147.93.105.138 "grep root /etc/nginx/sites-enabled/rgblightcat"
# Should show: root /var/www/rgblightcat/client;
```

2. **Check for JavaScript errors**:
```javascript
// Add to top of your script
console.log('Script loaded!');
// If you don't see this in console, script didn't run
```

3. **Check API is accessible**:
```bash
curl https://rgblightcat.com/api/rgb/stats
# Should return JSON data
```

4. **Check file permissions**:
```bash
sshpass -p 'ObamaknowsJA8@' ssh root@147.93.105.138 "ls -la /var/www/rgblightcat/client/index.html"
# Should be readable by www-data
```

---

## 🚨 EMERGENCY FIXES

### If Nothing Works:
1. **Direct file edit on server** (last resort):
```bash
# SSH in
ssh root@147.93.105.138

# Edit file directly
nano /var/www/rgblightcat/client/index.html

# Make changes and save
# Ctrl+O, Enter, Ctrl+X
```

2. **Restart nginx** (if config issues):
```bash
sshpass -p 'ObamaknowsJA8@' ssh root@147.93.105.138 "systemctl restart nginx"
```

3. **Clear CloudFlare cache**:
- Log into CloudFlare
- Purge cache for rgblightcat.com

---

## 📋 DEPLOYMENT VERIFICATION SCRIPT

Save this as `verify-deployment.sh`:
```bash
#!/bin/bash
echo "🔍 Verifying deployment..."

# Check localhost references
echo -n "Checking for localhost references... "
COUNT=$(sshpass -p 'ObamaknowsJA8@' ssh root@147.93.105.138 "grep -c 'localhost:3000' /var/www/rgblightcat/client/index.html")
if [ "$COUNT" -eq "0" ]; then
    echo "✅ CLEAN"
else
    echo "❌ FOUND $COUNT localhost references!"
fi

# Check file exists
echo -n "Checking index.html exists... "
if sshpass -p 'ObamaknowsJA8@' ssh root@147.93.105.138 "test -f /var/www/rgblightcat/client/index.html"; then
    echo "✅ EXISTS"
else
    echo "❌ MISSING"
fi

# Check API
echo -n "Checking API endpoint... "
if curl -s https://rgblightcat.com/api/rgb/stats | grep -q "totalSupply"; then
    echo "✅ WORKING"
else
    echo "❌ FAILING"
fi

echo "Visit: https://rgblightcat.com/?v=$(date +%s)"
```

---

## 🎯 GOLDEN RULES

1. **NEVER use localhost in production code**
2. **ALWAYS test locally first**
3. **ALWAYS add cache-busting params when testing**
4. **ALWAYS check browser console for errors**
5. **ALWAYS deploy to `/var/www/rgblightcat/` (not any other directory)**

---

## 📝 QUICK DEPLOYMENT COMMAND

For convenience, here's a one-liner that deploys and verifies:
```bash
# Deploy index.html with verification
sshpass -p 'ObamaknowsJA8@' scp client/index.html root@147.93.105.138:/var/www/rgblightcat/client/ && \
sshpass -p 'ObamaknowsJA8@' ssh root@147.93.105.138 "grep -c 'localhost:3000' /var/www/rgblightcat/client/index.html" && \
echo "✅ Deployed! Visit: https://rgblightcat.com/?v=$(date +%s)"
```

---

Last Updated: July 28, 2025
Never make deployment mistakes again! 🚀