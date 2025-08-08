#!/usr/bin/env node

/**
 * Security MCP - Scans for crypto vulnerabilities and security issues
 * Based on CLAUDE.md requirements
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔒 Security MCP - Vulnerability Scanner');
console.log('======================================\n');

let totalIssues = 0;
let criticalIssues = 0;

const securityIssues = {
    crypto: [],
    storage: [],
    injection: [],
    authentication: [],
    secrets: []
};

// Security patterns to check
const securityPatterns = {
    // Crypto vulnerabilities
    mathRandom: {
        pattern: /Math\.random\(\)/g,
        severity: 'HIGH',
        message: 'Math.random() used - must use crypto.randomBytes() for security',
        context: ['crypto', 'seed', 'token', 'password', 'key', 'secret', 'hash']
    },
    
    // LocalStorage sensitive data
    localStorageSecrets: {
        pattern: /localStorage\.setItem\s*\(\s*['"`](.*?)(key|token|password|secret|private|seed)/gi,
        severity: 'CRITICAL',
        message: 'Sensitive data stored in localStorage'
    },
    
    // Weak crypto
    weakCrypto: {
        pattern: /createHash\s*\(\s*['"`](md5|sha1)['"`]\)/gi,
        severity: 'HIGH',
        message: 'Weak cryptographic algorithm (MD5/SHA1)'
    },
    
    // SQL Injection
    sqlInjection: {
        pattern: /query\s*\(\s*['"`].*?\$\{.*?\}.*?['"`]\)/g,
        severity: 'CRITICAL',
        message: 'Potential SQL injection - use parameterized queries'
    },
    
    // XSS vulnerabilities
    dangerousHTML: {
        pattern: /innerHTML\s*=.*?\$\{.*?\}/g,
        severity: 'HIGH',
        message: 'Potential XSS - innerHTML with template literal'
    },
    
    // Eval usage
    evalUsage: {
        pattern: /eval\s*\(/g,
        severity: 'CRITICAL',
        message: '(() => {}) usage - major security risk'
    },
    
    // Hardcoded secrets
    hardcodedSecrets: {
        pattern: /(api[_-]?key|secret|password|token)\s*[:=]\s*['"`][a-zA-Z0-9]{16,}/gi,
        severity: 'CRITICAL',
        message: 'Potential hardcoded secret'
    },
    
    // Insecure random
    insecureRandom: {
        pattern: /(?:generate|create)(?:Token|Id|Key|Secret).*Math\.random/gi,
        severity: 'CRITICAL',
        message: 'Insecure random used for token/key generation'
    }
};

// Check if Math.random is used in crypto context
function checkCryptoContext(filePath, content) {
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
        if (line.includes('Math.random()')) {
            // Check surrounding lines for crypto context
            const contextStart = Math.max(0, index - 5);
            const contextEnd = Math.min(lines.length, index + 5);
            const context = lines.slice(contextStart, contextEnd).join('\n').toLowerCase();
            
            const cryptoKeywords = ['crypto', 'seed', 'random', 'secure', 'token', 'key', 'password', 'hash', 'salt'];
            const inCryptoContext = cryptoKeywords.some(keyword => context.includes(keyword));
            
            if (inCryptoContext) {
                securityIssues.crypto.push({
                    file: filePath,
                    line: index + 1,
                    severity: 'CRITICAL',
                    issue: 'Math.random() in cryptographic context',
                    code: line.trim()
                });
                criticalIssues++;
                totalIssues++;
            }
        }
    });
}

// Check for security vulnerabilities
function checkSecurityPatterns(filePath, content) {
    Object.entries(securityPatterns).forEach(([name, check]) => {
        const matches = content.match(check.pattern);
        
        if (matches) {
            matches.forEach(match => {
                const lines = content.split('\n');
                const lineNumber = lines.findIndex(line => line.includes(match)) + 1;
                
                const issue = {
                    file: filePath,
                    line: lineNumber,
                    severity: check.severity,
                    issue: check.message,
                    code: match.substring(0, 100)
                };
                
                // Categorize by type
                if (name.includes('crypto') || name.includes('Random')) {
                    securityIssues.crypto.push(issue);
                } else if (name.includes('storage')) {
                    securityIssues.storage.push(issue);
                } else if (name.includes('injection') || name.includes('XSS') || name.includes('eval')) {
                    securityIssues.injection.push(issue);
                } else if (name.includes('secret') || name.includes('hardcoded')) {
                    securityIssues.secrets.push(issue);
                }
                
                if (check.severity === 'CRITICAL') criticalIssues++;
                totalIssues++;
            });
        }
    });
}

// Check authentication patterns
function checkAuthPatterns(filePath, content) {
    // Check for missing auth checks
    if (content.includes('router.post') || content.includes('router.get')) {
        if (!content.includes('auth') && !content.includes('verify') && !content.includes('authenticate')) {
            if (filePath.includes('routes') && !filePath.includes('public')) {
                securityIssues.authentication.push({
                    file: filePath,
                    severity: 'MEDIUM',
                    issue: 'Route handler without apparent authentication'
                });
                totalIssues++;
            }
        }
    }
    
    // Check for JWT secret in code
    if (content.includes('jwt.sign') && content.includes("'") && !content.includes('process.env')) {
        securityIssues.secrets.push({
            file: filePath,
            severity: 'CRITICAL',
            issue: 'JWT secret might be hardcoded'
        });
        criticalIssues++;
        totalIssues++;
    }
}

// Check Bitcoin/Lightning specific security
function checkBitcoinSecurity(filePath, content) {
    // Check for private key exposure
    if (content.match(/private[_-]?key|priv[_-]?key|xprv/i) && content.includes('console.log')) {
        securityIssues.crypto.push({
            file: filePath,
            severity: 'CRITICAL',
            issue: 'Potential private key logging'
        });
        criticalIssues++;
        totalIssues++;
    }
    
    // Check for mnemonic/seed exposure
    if (content.match(/mnemonic|seed[_-]?phrase/i) && (content.includes('console.log') || content.includes('localStorage'))) {
        securityIssues.crypto.push({
            file: filePath,
            severity: 'CRITICAL',
            issue: 'Potential seed phrase exposure'
        });
        criticalIssues++;
        totalIssues++;
    }
}

// Main security scan
console.log('Scanning for security vulnerabilities...\n');

const files = [];
function findFiles(dir) {
    try {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
            const itemPath = path.join(dir, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory() && !item.includes('node_modules') && !item.startsWith('.')) {
                findFiles(itemPath);
            } else if (item.endsWith('.js') || item.endsWith('.env')) {
                files.push(itemPath);
            }
        });
    } catch (error) {
        // Skip inaccessible directories
    }
}

findFiles(process.cwd());

console.log(`Scanning ${files.length} files for security issues...\n`);

// Scan each file
files.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(process.cwd(), file);
        
        checkCryptoContext(relativePath, content);
        checkSecurityPatterns(relativePath, content);
        checkAuthPatterns(relativePath, content);
        checkBitcoinSecurity(relativePath, content);
    } catch (error) {
        // Skip files that can't be read
    }
});

// Generate security report
console.log('\n🔒 SECURITY SCAN RESULTS');
console.log('========================\n');

// Critical issues first
if (criticalIssues > 0) {
    console.log(`🚨 CRITICAL ISSUES FOUND: ${criticalIssues}\n`);
}

// Crypto issues
if (securityIssues.crypto.length > 0) {
    console.log('🔐 Cryptographic Vulnerabilities:');
    securityIssues.crypto.forEach(issue => {
        console.log(`   ${issue.severity === 'CRITICAL' ? '🚨' : '⚠️ '} ${issue.file}:${issue.line || '?'}`);
        console.log(`      ${issue.issue}`);
        if (issue.code) console.log(`      Code: ${issue.code}`);
    });
    console.log('');
}

// Storage issues
if (securityIssues.storage.length > 0) {
    console.log('💾 Storage Security Issues:');
    securityIssues.storage.forEach(issue => {
        console.log(`   ${issue.severity === 'CRITICAL' ? '🚨' : '⚠️ '} ${issue.file}:${issue.line || '?'}`);
        console.log(`      ${issue.issue}`);
    });
    console.log('');
}

// Injection vulnerabilities
if (securityIssues.injection.length > 0) {
    console.log('💉 Injection Vulnerabilities:');
    securityIssues.injection.forEach(issue => {
        console.log(`   ${issue.severity === 'CRITICAL' ? '🚨' : '⚠️ '} ${issue.file}:${issue.line || '?'}`);
        console.log(`      ${issue.issue}`);
    });
    console.log('');
}

// Authentication issues
if (securityIssues.authentication.length > 0) {
    console.log('🔑 Authentication Issues:');
    securityIssues.authentication.forEach(issue => {
        console.log(`   ⚠️  ${issue.file}`);
        console.log(`      ${issue.issue}`);
    });
    console.log('');
}

// Hardcoded secrets
if (securityIssues.secrets.length > 0) {
    console.log('🗝️  Hardcoded Secrets:');
    securityIssues.secrets.forEach(issue => {
        console.log(`   ${issue.severity === 'CRITICAL' ? '🚨' : '⚠️ '} ${issue.file}`);
        console.log(`      ${issue.issue}`);
    });
    console.log('');
}

// Summary and recommendations
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Total Security Issues: ${totalIssues}`);
console.log(`Critical Issues: ${criticalIssues}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (totalIssues > 0) {
    console.log('🛡️  Security Recommendations:');
    console.log('   1. Replace ALL Math.random() with crypto.randomBytes()');
    console.log('   2. Never store sensitive data in localStorage');
    console.log('   3. Use environment variables for all secrets');
    console.log('   4. Implement proper input validation');
    console.log('   5. Use parameterized queries for database operations');
    console.log('   6. Enable authentication on all private routes\n');
}

if (criticalIssues > 0) {
    console.log('❌ SECURITY SCAN FAILED - Critical issues must be fixed!');
    process.exit(1);
} else if (totalIssues > 0) {
    console.log('⚠️  Security issues found - please review and fix');
    process.exit(0);
} else {
    console.log('✅ Security scan PASSED - No major vulnerabilities found');
    process.exit(0);
}