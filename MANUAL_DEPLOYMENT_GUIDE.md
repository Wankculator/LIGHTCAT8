# 🚀 Manual Deployment Guide for rgblightcat.com

Since SSH authentication is required, please follow these steps to deploy the security fixes manually.

## ⚠️ CRITICAL: Before You Begin

**You MUST rotate all exposed API keys first:**
- BTCPay API Key: `1dpQWkChRWpEWiilo1D1ZlI0PEv7EOIIIhliMiD7LnM` (COMPROMISED)
- BTCPay Store ID: `HNQsGSwdyQb8Vg3y6srogKjXCDXdARt9Q113N4urcUcG` (COMPROMISED)
- Bitcoin xpub: `xpub6CjGpeuifmhhvy9emDMrkoL5GkTdcXvtnuJLWoeywsZgXCVMBPQuLWRjkfKYfy5PBFt7umMushrbNCL8A6B1PwAyPeHhT8JUZsYL9ZU6XN1` (COMPROMISED)

## 📋 Option 1: Quick Deploy (Code Only)

This deploys only code changes, not configuration files.

```bash
# 1. SSH into your server
ssh root@147.93.105.138

# 2. Navigate to the website directory
cd /var/www/rgblightcat

# 3. Create a backup (just in case)
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz \
    --exclude=node_modules \
    --exclude=.env* \
    --exclude=logs \
    .

# 4. Pull the latest code from GitHub
git fetch origin production-ready-january-2025
git checkout production-ready-january-2025
git pull origin production-ready-january-2025

# 5. Install updated dependencies
npm install --production

# 6. Restart the application
pm2 restart rgblightcat-api

# 7. Verify it's working
pm2 status
curl -s http://localhost:3000/health
```

## 📋 Option 2: Full Security Deployment

This includes updating configuration with new API keys.

```bash
# 1. SSH into your server
ssh root@147.93.105.138

# 2. Navigate to the website directory
cd /var/www/rgblightcat

# 3. Create a full backup
tar -czf full-backup-$(date +%Y%m%d-%H%M%S).tar.gz .

# 4. Save your current .env file
cp .env .env.backup-$(date +%Y%m%d)

# 5. Pull the latest code
git fetch origin production-ready-january-2025
git checkout production-ready-january-2025
git pull origin production-ready-january-2025

# 6. Update .env with NEW API keys
nano .env

# Replace these values with your NEW keys:
BTCPAY_API_KEY=${BTCPAY_API_KEY}  # Your NEW BTCPay API key
BTCPAY_STORE_ID=${BTCPAY_STORE_ID}  # Your NEW BTCPay store ID
BITCOIN_XPUB=${BITCOIN_XPUB}  # Your NEW Bitcoin xpub

# 7. Install dependencies
npm install --production

# 8. Run security audit
npm audit

# 9. Restart services
pm2 restart all

# 10. Test the deployment
pm2 logs --lines 50
```

## 🔍 Post-Deployment Verification

After deployment, verify everything is working:

```bash
# 1. Check API health
curl http://localhost:3000/health
# Should return: {"status":"ok"}

# 2. Check game stats
curl http://localhost:3000/api/rgb/stats
# Should return stats JSON

# 3. Check PM2 status
pm2 status
# All processes should show "online"

# 4. Monitor logs for errors
pm2 logs --lines 100
# Look for any error messages

# 5. Test from browser
# Visit https://rgblightcat.com
# - Check stats display
# - Test game loading
# - Verify no console errors
```

## 🚨 If Something Goes Wrong

### Rollback procedure:
```bash
# 1. Restore from backup
cd /var/www/rgblightcat
tar -xzf backup-[timestamp].tar.gz

# 2. Restore .env
cp .env.backup-[date] .env

# 3. Restart services
pm2 restart all
```

### Common Issues:

**PM2 not found:**
```bash
npm install -g pm2
```

**Port already in use:**
```bash
pm2 kill
pm2 start server/app.js --name rgblightcat-api
```

**Permission denied:**
```bash
sudo chown -R $USER:$USER /var/www/rgblightcat
```

## 📝 What Was Fixed

This deployment includes:

1. **Security Fixes:**
   - Removed all hardcoded API credentials
   - Fixed Function() constructor vulnerabilities
   - Updated npm packages with known vulnerabilities
   - Fixed potential memory leaks

2. **Code Improvements:**
   - Fixed RGB service exports for better testing
   - Added comprehensive test suite
   - Configured testnet support
   - Improved error handling

3. **Performance:**
   - Optimized service initialization
   - Added proper cleanup for event listeners
   - Improved caching strategies

## ⏰ Deployment Timeline

1. **Immediate** (5 minutes):
   - SSH and pull latest code
   - Install dependencies
   - Restart services

2. **Required** (30 minutes):
   - Rotate all API keys
   - Update .env configuration
   - Test all functionality

3. **Recommended** (1 hour):
   - Run full test suite locally
   - Test on Bitcoin testnet
   - Monitor logs for issues

## 🔐 Security Checklist

After deployment, ensure:

- [ ] All old API keys have been rotated
- [ ] New keys are stored securely
- [ ] .env files are not in version control
- [ ] 2FA is enabled on all service accounts
- [ ] Access logs show no suspicious activity
- [ ] No sensitive data in browser console

## 📞 Need Help?

If you encounter issues:

1. Check the logs first: `pm2 logs`
2. Review the changes: `git log --oneline -10`
3. Test locally before deploying
4. Keep backups of working configurations

Remember: The exposed credentials MUST be rotated before the site is safe to use again!