# Emergency Deployment Strategy - SSH Access Blocked

## Current Situation
- **Server IP**: 209.38.86.47
- **Domain**: https://rgblightcat.com (HTTP 200 OK - Site is live)
- **Issue**: SSH port 22 connection reset by peer
- **Error**: `kex_exchange_identification: read: Connection reset by peer`

## Root Cause Analysis
The SSH connection reset typically indicates:
1. **Firewall/Security**: Server firewall blocking IP after failed attempts
2. **SSH Service**: SSH daemon crashed or misconfigured
3. **DDoS Protection**: Hosting provider's automatic protection triggered
4. **Rate Limiting**: Too many connection attempts from same IP

## Alternative Deployment Methods

### Method 1: FTP/SFTP Deployment
**Priority**: HIGH - Most reliable fallback

```bash
# Install lftp if not present
sudo apt-get install lftp

# Deploy using FTP with automatic retry
lftp -c "
set ftp:ssl-allow no
set ftp:retry-530-anonymous 5
open ftp://209.38.86.47
user root $FTP_PASSWORD
mirror -R --parallel=4 --exclude node_modules/ ./client /var/www/lightcat/client
bye
"
```

### Method 2: Control Panel Deployment
**Platforms**: cPanel, Plesk, Hostinger Panel

1. **File Manager Upload**:
   - Login to hosting control panel
   - Navigate to File Manager
   - Upload to `/var/www/lightcat/` or `public_html/`
   - Compress files locally first for faster upload

2. **Git Deployment** (if available):
   - Set up deployment key in control panel
   - Configure auto-deploy from specific branch
   - Push to deployment branch triggers update

### Method 3: HTTP-Based Deployment
**Emergency PHP Uploader**:

```php
<?php
// deploy-receiver.php - Place on server temporarily
$secret = 'your-secret-key-here';
if ($_POST['secret'] !== $secret) die('Unauthorized');

$zipFile = $_FILES['deployment']['tmp_name'];
$extractTo = '/var/www/lightcat/';

$zip = new ZipArchive;
if ($zip->open($zipFile) === TRUE) {
    $zip->extractTo($extractTo);
    $zip->close();
    echo 'Deployment successful';
    unlink(__FILE__); // Self-destruct
} else {
    echo 'Deployment failed';
}
?>
```

### Method 4: GitHub Actions Deployment
**Automated CI/CD Pipeline**:

```yaml
name: Deploy to Production
on:
  push:
    branches: [main, emergency-fix-*]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy via FTP
        uses: SamKirkland/FTP-Deploy-Action@4.3.0
        with:
          server: 209.38.86.47
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          local-dir: ./client/
          server-dir: /var/www/lightcat/client/
```

### Method 5: Rsync over Alternative Ports
**If SSH on different port**:

```bash
# Check common alternative SSH ports
for port in 2222 2022 22222 10022; do
    echo "Trying port $port..."
    ssh -p $port -o ConnectTimeout=5 root@209.38.86.47 echo "Success on port $port"
done

# Deploy using discovered port
rsync -avz -e "ssh -p 2222" ./client/ root@209.38.86.47:/var/www/lightcat/client/
```

## Recovery Steps

### 1. Immediate Actions
```bash
# Test connectivity
curl -I https://rgblightcat.com
ping 209.38.86.47

# Check if FTP is available
nc -zv 209.38.86.47 21

# Check alternative SSH ports
nmap -p 22,2222,2022 209.38.86.47
```

### 2. Contact Hosting Provider
- Report SSH access issue
- Request firewall whitelist for your IP
- Ask about alternative access methods
- Inquire about recent security events

### 3. Temporary Workarounds
- Use CDN for static assets
- Deploy to backup server
- Use GitHub Pages for emergency hosting
- Cloudflare Workers for API proxy

## Monitoring Setup

### Uptime Monitoring Script
```bash
#!/bin/bash
# monitor-production.sh

SITE_URL="https://rgblightcat.com"
SLACK_WEBHOOK="your-webhook-url"

while true; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" $SITE_URL)
    
    if [ $STATUS -ne 200 ]; then
        curl -X POST $SLACK_WEBHOOK \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"🚨 Site Down! Status: $STATUS\"}"
    fi
    
    sleep 300 # Check every 5 minutes
done
```

### External Monitoring Services
1. **UptimeRobot**: Free tier available
2. **Pingdom**: Advanced monitoring
3. **StatusCake**: Good free options
4. **Better Uptime**: Modern interface

## Backup Deployment Checklist

- [ ] Create local backup of current production files
- [ ] Test deployment method on staging first
- [ ] Verify file permissions after deployment
- [ ] Check all API endpoints are working
- [ ] Confirm WebSocket connections functional
- [ ] Test payment flow end-to-end
- [ ] Monitor error logs post-deployment

## Emergency Contacts

- **Hosting Support**: [Check control panel for ticket system]
- **Domain Registrar**: [For DNS changes if needed]
- **Team Escalation**: [Internal contact list]

## Prevention Measures

1. **SSH Key Rotation**: Regular key updates
2. **Fail2ban Configuration**: Prevent lockouts
3. **VPN Access**: Dedicated IP for server access
4. **Backup Access Methods**: Always have 2-3 ways in
5. **Monitoring Alerts**: Know before users do

---
Last Updated: 2025-01-28
Status: ACTIVE INCIDENT - SSH BLOCKED