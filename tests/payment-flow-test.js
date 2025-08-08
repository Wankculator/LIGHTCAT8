#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

console.log('=== RGB Payment Flow Test Suite ===\n');

// Test 1: Check critical payment files exist
console.log('Test 1: Critical Payment Files');
const paymentFiles = [
    'server/controllers/rgbPaymentController.js',
    'server/services/rgbService.js',
    'server/services/lightningService.js',
    'server/routes/rgb.js',
    'server/routes/webhooks.js'
];

let filesExist = true;
paymentFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} exists`);
    } else {
        console.log(`❌ ${file} missing`);
        filesExist = false;
    }
});

console.log('\n---\n');

// Test 2: Check for security issues in payment controllers
console.log('Test 2: Security Checks in Payment Flow');
const securityChecks = {
    'Math.random() usage': /Math\.random\(\)/g,
    '(() => { throw new Error("eval is not allowed"); })() usage': /eval\(/g,
    'SQL injection vulnerability': /query\s*\(\s*[`"'].*\$\{.*\}/g,
    'Hardcoded secrets': /(api_key|secret|password)\s*=\s*["'][^"']+["']/gi
};

let securityIssues = 0;
paymentFiles.filter(file => fs.existsSync(path.join(__dirname, '..', file))).forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    Object.entries(securityChecks).forEach(([check, pattern]) => {
        const matches = content.match(pattern);
        if (matches && matches.length > 0) {
            console.log(`⚠️  ${file}: Found ${matches.length} ${check}`);
            securityIssues += matches.length;
        }
    });
});

if (securityIssues === 0) {
    console.log('✅ No security issues found in payment files');
}

console.log('\n---\n');

// Test 3: Check environment variables
console.log('Test 3: Environment Configuration');
const requiredEnvVars = [
    'JWT_SECRET',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'BTCPAY_SERVER_URL',
    'BTCPAY_API_KEY',
    'BTCPAY_STORE_ID'
];

let envConfigured = true;
requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
        console.log(`✅ ${envVar} is configured`);
    } else {
        console.log(`❌ ${envVar} is missing`);
        envConfigured = false;
    }
});

console.log('\n---\n');

// Test 4: Check payment constants
console.log('Test 4: Payment Constants Validation');
const constantsToCheck = {
    'Invoice expiry': { expected: '15 minutes', pattern: /invoiceExpiry.*15.*60/i },
    'Polling interval': { expected: '3 seconds', pattern: /pollInterval.*3000/i },
    'Batch price': { expected: '2000 sats', pattern: /batchPrice.*2000/i },
    'Max batches': { expected: 'Bronze: 5, Silver: 8, Gold: 10', pattern: /maxBatches.*gold.*10/i }
};

const paymentControllerPath = path.join(__dirname, '..', 'server/controllers/rgbPaymentController.js');
if (fs.existsSync(paymentControllerPath)) {
    const content = fs.readFileSync(paymentControllerPath, 'utf8');
    
    Object.entries(constantsToCheck).forEach(([constant, { expected, pattern }]) => {
        if (pattern.test(content)) {
            console.log(`✅ ${constant}: ${expected}`);
        } else {
            console.log(`⚠️  ${constant}: Check manually (expected: ${expected})`);
        }
    });
}

console.log('\n---\n');

// Test 5: Memory leak prevention checks
console.log('Test 5: Memory Leak Prevention');
const memoryChecks = [
    { 
        file: 'client/js/game/ProGame.js',
        check: 'cleanup() method exists',
        pattern: /cleanup\s*\(\s*\)\s*{/
    },
    {
        file: 'client/js/game/ProGame.js',
        check: 'Event listeners removed',
        pattern: /removeEventListener/
    },
    {
        file: 'client/js/game/ObjectPool.js',
        check: 'Object pooling implemented',
        pattern: /pool|recycle|reuse/i
    }
];

memoryChecks.forEach(({ file, check, pattern }) => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (pattern.test(content)) {
            console.log(`✅ ${file}: ${check}`);
        } else {
            console.log(`⚠️  ${file}: ${check} - needs verification`);
        }
    }
});

console.log('\n---\n');

// Summary
console.log('=== Test Summary ===');
console.log(`Files Check: ${filesExist ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Security Check: ${securityIssues === 0 ? '✅ PASS' : `⚠️  ${securityIssues} issues found`}`);
console.log(`Environment Check: ${envConfigured ? '✅ PASS' : '❌ FAIL - Set missing variables'}`);
console.log('\nRecommendations:');
console.log('1. Run full Jest test suite when environment is properly configured');
console.log('2. Perform manual testing of payment flow end-to-end');
console.log('3. Monitor memory usage during extended game sessions');
console.log('4. Set up automated performance testing for production');

// Exit with appropriate code
process.exit(filesExist && securityIssues === 0 ? 0 : 1);