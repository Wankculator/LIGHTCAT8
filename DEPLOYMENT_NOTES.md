# 📝 DEPLOYMENT NOTES - LIGHTCAT8

## 🚨 CURRENT WORKING STATE (Aug 8, 2025)

### What's Working ✅
1. **Website**: http://rgblightcat.com loads successfully
2. **Frontend Server**: Python HTTP server on port 8082
3. **API Server**: Node.js Express on port 3000
4. **Nginx**: Properly configured and proxying requests

### Server Details
- **VPS IP**: 147.93.105.138
- **OS**: Ubuntu
- **Root Password**: ObamaknowsJA8@
- **Files Location**: `/var/www/rgblightcat/`

### Running Services
```bash
# Check status
systemctl status lightcat-ui    # Frontend
systemctl status lightcat-api   # Backend
systemctl status nginx          # Web server

# View logs
journalctl -u lightcat-ui -f
journalctl -u lightcat-api -f
```

### Critical Files on VPS
```
/var/www/rgblightcat/
├── client/                     # Frontend files (index.html, game.html, etc)
├── server/                     # Backend API files
├── serve-ui.js                # UI server script (Express static server)
├── serve-api.js               # API server script (Basic endpoints)
├── package.json               # Node dependencies
└── .env files                 # Environment variables
```

### Nginx Configuration
- Config file: `/etc/nginx/sites-enabled/rgblightcat`
- Proxies port 80 → 8082 (frontend) and /api/* → 3000 (backend)
- SSL configured but certificate not active yet

### Current Issues & TODOs
1. **SSL Certificate**: Need to run certbot for HTTPS
2. **Real Payment Integration**: BTCPay/Lightning not connected
3. **Database**: Supabase configured but not integrated
4. **RGB Node**: Not set up yet

### Emergency Recovery Commands
```bash
# If site goes down, SSH to VPS and run:

# 1. Start frontend manually
cd /var/www/rgblightcat/client
python3 -m http.server 8082 &

# 2. Start API manually  
cd /var/www/rgblightcat
node serve-api.js &

# 3. Restart nginx
systemctl restart nginx

# 4. Check if working
curl http://localhost:8082
curl http://localhost:3000/api/health
```

### Backup Strategy
- Full VPS backup: 29GB restored on Aug 8
- GitHub repo: github.com/Wankculator/LIGHTCAT8
- Local backups in: `/mnt/c/Users/sk84l/Downloads/RGB LIGHT CAT NEW/`

### Important Notes
⚠️ **DO NOT**:
- Delete `/var/www/rgblightcat/` - contains production files
- Change nginx config without backup
- Modify systemd services without testing
- Remove the Python process on port 8082

✅ **ALWAYS**:
- Test locally before deploying
- Keep backups before major changes
- Check service status after changes
- Monitor logs for errors

---
*This represents the working state as of Aug 8, 2025 - Site is LIVE*