# CORRECT VPS DEPLOYMENT INFORMATION

## VPS Details (from VPS folder)
- **Server IP**: 147.93.105.138
- **SSH User**: root
- **Password**: ObamaknowsJA8@
- **Correct Path**: `/var/www/rgblightcat/`

## DNS Configuration
- Domain: rgblightcat.com
- A Record: Points to 147.93.105.138
- www Record: Points to 147.93.105.138

## CRITICAL PATH RULES
✅ **ALWAYS USE**: `/var/www/rgblightcat/`
❌ **NEVER USE**: `/var/www/lightcat/`
❌ **NEVER USE**: `/var/www/rgblightcat.com/html/`

## Directory Structure on VPS
```
/var/www/rgblightcat/
├── client/           # Frontend files
│   ├── index.html
│   ├── game.html
│   ├── css/         # All CSS files
│   └── js/          # All JS files
│       └── game/    # Game-specific JS
└── server/          # Backend files
    ├── controllers/
    ├── services/
    └── routes/
```

## Deployment Command Template
```bash
sshpass -p "ObamaknowsJA8@" scp -o StrictHostKeyChecking=no \
  [local-file] root@147.93.105.138:/var/www/rgblightcat/[path]
```

## Files Updated for Tier Changes
### Client Files
- client/index.html
- client/game.html
- client/ui-library.html
- client/css/game-ui-layout-fix.css
- client/js/game/main.js
- client/js/game/GameUI.js
- client/js/tier-display-restart-fix.js
- client/js/game-over-emergency-fix.js

### Server Files
- server/controllers/rgbPaymentController.js
- server/controllers/enhancedRgbPaymentController.js
- server/routes/gameRoutes.js
- server/services/emailTemplates.js
- server/services/paymentSecurityService.js
- server/services/paymentHelperService.js
- server/services/gameValidationService.js

## Current SSH Issue
As of deployment attempt, SSH is rejecting connections with "Connection reset by peer"
This may be due to:
- IP blocking/rate limiting
- Server maintenance
- Firewall rules

Alternative deployment methods:
1. Wait for SSH to be available
2. Use hosting control panel if available
3. Contact hosting support