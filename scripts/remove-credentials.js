#!/usr/bin/env node

/**
 * Remove all hardcoded credentials from .env files
 * Replace with placeholders
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const SENSITIVE_PATTERNS = [
    // BTCPay credentials
    /BTCPAY_API_KEY=.*/g,
    /BTCPAY_STORE_ID=.*/g,
    /BTCPAY_WEBHOOK_SECRET=.*/g,
    
    // Supabase credentials
    /SUPABASE_SERVICE_KEY=.*/g,
    /SUPABASE_ANON_KEY=eyJ[^"]*/g,
    
    // JWT secrets
    /JWT_SECRET=.*/g,
    /JWT_REFRESH_SECRET=.*/g,
    /SESSION_SECRET=.*/g,
    
    // Email credentials
    /SMTP_PASS=.*/g,
    
    // API keys
    /API_KEY=.*/g,
    /PRIVATE_KEY=.*/g,
    /SECRET_KEY=.*/g,
    
    // Bitcoin keys (xpub)
    /xpub[a-zA-Z0-9]{107}/g
];

async function cleanEnvFile(filePath) {
    try {
        let content = await fs.readFile(filePath, 'utf8');
        let cleaned = content;
        
        // Replace sensitive values with placeholders
        SENSITIVE_PATTERNS.forEach(pattern => {
            cleaned = cleaned.replace(pattern, (match) => {
                const key = match.split('=')[0];
                return `${key}=\${${key}}`;
            });
        });
        
        // Special handling for known exposed credentials
        const EXPOSED_CREDENTIALS = {
            '1dpQWkChRWpEWiilo1D1ZlI0PEv7EOIIIhliMiD7LnM': '${BTCPAY_API_KEY}',
            'HNQsGSwdyQb8Vg3y6srogKjXCDXdARt9Q113N4urcUcG': '${BTCPAY_STORE_ID}',
            'xpub6CjGpeuifmhhvy9emDMrkoL5GkTdcXvtnuJLWoeywsZgXCVMBPQuLWRjkfKYfy5PBFt7umMushrbNCL8A6B1PwAyPeHhT8JUZsYL9ZU6XN1': '${BITCOIN_XPUB}'
        };
        
        Object.entries(EXPOSED_CREDENTIALS).forEach(([exposed, placeholder]) => {
            cleaned = cleaned.replace(new RegExp(exposed, 'g'), placeholder);
        });
        
        // Write cleaned content back
        await fs.writeFile(filePath, cleaned);
        console.log(`✅ Cleaned: ${path.basename(filePath)}`);
        
    } catch (error) {
        console.error(`❌ Error cleaning ${filePath}:`, error.message);
    }
}

async function main() {
    console.log('🔒 Removing hardcoded credentials from .env files...\n');
    
    // Get all .env files
    const envFiles = [
        '.env',
        '.env.production',
        '.env.voltage',
        '.env.secure',
        '.env.btcpay',
        '.env.testnet',
        '.env.production-ready'
    ];
    
    for (const file of envFiles) {
        const filePath = path.join(__dirname, '..', file);
        try {
            await fs.access(filePath);
            await cleanEnvFile(filePath);
        } catch (error) {
            // File doesn't exist, skip
        }
    }
    
    // Create .gitignore entry if not exists
    const gitignorePath = path.join(__dirname, '..', '.gitignore');
    try {
        let gitignore = await fs.readFile(gitignorePath, 'utf8');
        if (!gitignore.includes('.env*')) {
            gitignore += '\n# Environment files with secrets\n.env*\n!.env.example\n!.env.example.secure\n';
            await fs.writeFile(gitignorePath, gitignore);
            console.log('\n✅ Updated .gitignore to exclude .env files');
        }
    } catch (error) {
        console.error('❌ Error updating .gitignore:', error.message);
    }
    
    console.log('\n✅ Credential removal complete!');
    console.log('\n⚠️  IMPORTANT: You must now:');
    console.log('1. Rotate all API keys in BTCPay/Supabase/etc');
    console.log('2. Store new credentials in a secure vault');
    console.log('3. Never commit real credentials to git');
}

main().catch(console.error);