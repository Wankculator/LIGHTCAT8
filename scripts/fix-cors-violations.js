#!/usr/bin/env node

/**
 * Fix CORS violations by moving external API calls to backend proxy
 */

const fs = require('fs').promises;
const path = require('path');

const EXTERNAL_API_PATTERNS = [
    {
        // Mempool.space API calls
        pattern: /axios\.get\s*\(\s*[`'"]https:\/\/mempool\.space[^`'"]*[`'"]\s*\)/g,
        replacement: (match) => {
            // Extract the path from the URL
            const pathMatch = match.match(/\/api\/[^`'"]+/);
            if (pathMatch) {
                return `this.makeProxiedRequest('mempool', '${pathMatch[0]}')`;
            }
            return match;
        }
    },
    {
        // Blockstream API calls
        pattern: /axios\.get\s*\(\s*[`'"]https:\/\/blockstream\.info[^`'"]*[`'"]\s*\)/g,
        replacement: (match) => {
            const pathMatch = match.match(/\/api\/[^`'"]+/);
            if (pathMatch) {
                return `this.makeProxiedRequest('blockstream', '${pathMatch[0]}')`;
            }
            return match;
        }
    },
    {
        // Generic external HTTPS calls
        pattern: /axios\.(get|post|put|delete)\s*\(\s*[`'"]https:\/\/(?!localhost|127\.0\.0\.1)[^`'"]+[`'"]/g,
        replacement: (match) => {
            console.log(`   ⚠️  Found external API call: ${match.substring(0, 50)}...`);
            return match; // Log but don't auto-fix generic calls
        }
    }
];

async function addProxyMethod(content, filePath) {
    // Check if proxy method already exists
    if (content.includes('makeProxiedRequest')) {
        return content;
    }
    
    // Add the proxy method to the class
    const classEndPattern = /^}$/m;
    const proxyMethod = `
  /**
   * Make proxied request to avoid CORS issues
   * @private
   */
  async makeProxiedRequest(service, path) {
    try {
      // Use internal proxy endpoint
      const response = await axios.get(\`/api/proxy/\${service}\${path}\`, {
        baseURL: process.env.API_BASE_URL || 'http://localhost:3000'
      });
      return response;
    } catch (error) {
      logger.error(\`Proxy request failed for \${service}\${path}:\`, error);
      throw error;
    }
  }
}`;
    
    // Find the last closing brace of the class
    const lines = content.split('\n');
    let lastBraceIndex = -1;
    
    for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].trim() === '}') {
            // Check if this is likely the class closing brace
            const prevLines = lines.slice(Math.max(0, i - 10), i).join('\n');
            if (!prevLines.includes('function') && !prevLines.includes('=>')) {
                lastBraceIndex = i;
                break;
            }
        }
    }
    
    if (lastBraceIndex > 0) {
        lines[lastBraceIndex] = proxyMethod;
        return lines.join('\n');
    }
    
    return content;
}

async function fixFile(filePath) {
    try {
        let content = await fs.readFile(filePath, 'utf8');
        let modified = false;
        const originalContent = content;
        
        // Apply CORS fixes
        EXTERNAL_API_PATTERNS.forEach(({ pattern, replacement }) => {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    const newValue = typeof replacement === 'function' 
                        ? replacement(match) 
                        : replacement;
                    
                    if (newValue !== match) {
                        content = content.replace(match, newValue);
                        modified = true;
                    }
                });
            }
        });
        
        // Add proxy method if we made changes
        if (modified && content.includes('this.makeProxiedRequest')) {
            content = await addProxyMethod(content, filePath);
        }
        
        if (modified) {
            await fs.writeFile(filePath, content);
            console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
            
            // Count what was fixed
            const mempoolCalls = (originalContent.match(/mempool\.space/g) || []).length;
            const blockstreamCalls = (originalContent.match(/blockstream\.info/g) || []).length;
            
            if (mempoolCalls > 0) {
                console.log(`   - Fixed ${mempoolCalls} mempool.space API calls`);
            }
            if (blockstreamCalls > 0) {
                console.log(`   - Fixed ${blockstreamCalls} blockstream.info API calls`);
            }
        }
        
        return modified;
    } catch (error) {
        console.error(`❌ Error fixing ${filePath}:`, error.message);
        return false;
    }
}

async function createProxyRoute() {
    const proxyRoute = `// API Proxy Route - Handles external API calls to avoid CORS
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { logger } = require('../utils/logger');

// Allowed proxy services
const ALLOWED_SERVICES = {
    mempool: {
        baseURL: process.env.BITCOIN_NETWORK === 'testnet' 
            ? 'https://mempool.space/testnet'
            : 'https://mempool.space',
        headers: {
            'User-Agent': 'LIGHTCAT/1.0'
        }
    },
    blockstream: {
        baseURL: process.env.BITCOIN_NETWORK === 'testnet'
            ? 'https://blockstream.info/testnet'
            : 'https://blockstream.info',
        headers: {
            'User-Agent': 'LIGHTCAT/1.0'
        }
    }
};

// Proxy endpoint
router.get('/proxy/:service/*', async (req, res) => {
    try {
        const { service } = req.params;
        const path = req.params[0];
        
        // Validate service
        if (!ALLOWED_SERVICES[service]) {
            return res.status(400).json({
                success: false,
                error: 'Invalid proxy service'
            });
        }
        
        // Make proxied request
        const config = ALLOWED_SERVICES[service];
        const response = await axios.get(\`\${config.baseURL}/\${path}\`, {
            headers: config.headers,
            params: req.query
        });
        
        // Return response
        res.json(response.data);
        
    } catch (error) {
        logger.error('Proxy request failed:', error);
        res.status(error.response?.status || 500).json({
            success: false,
            error: 'Proxy request failed'
        });
    }
});

module.exports = router;
`;
    
    const routePath = path.join(process.cwd(), 'server/routes/proxy.js');
    await fs.writeFile(routePath, proxyRoute);
    console.log('✅ Created proxy route: server/routes/proxy.js');
}

async function main() {
    console.log('🔒 Fixing CORS violations...\n');
    
    // Files with CORS issues
    const filesToFix = [
        'server/services/bitcoinMonitor.js',
        'server/services/blockchainMonitorService.js'
    ];
    
    let fixedCount = 0;
    
    for (const file of filesToFix) {
        const filePath = path.join(process.cwd(), file);
        try {
            await fs.access(filePath);
            const fixed = await fixFile(filePath);
            if (fixed) fixedCount++;
        } catch (error) {
            console.log(`⚠️  Skipping ${file} (not found)`);
        }
    }
    
    // Create proxy route if we fixed any files
    if (fixedCount > 0) {
        await createProxyRoute();
        
        console.log('\n📝 Next steps:');
        console.log('1. Add to server/app.js:');
        console.log("   app.use('/api', require('./routes/proxy'));");
        console.log('2. Test the proxy endpoints');
    }
    
    console.log(`\n✅ Fixed ${fixedCount} files with CORS violations`);
}

main().catch(console.error);