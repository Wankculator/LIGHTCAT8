#!/usr/bin/env node
/**
 * Fix ALL Math.random() usage in the codebase
 * Replace with cryptographically secure alternatives
 * LIGHTCAT Production Grade Fix
 */

const fs = require('fs');
const path = require('path');

// Patterns to replace
const patterns = [
    {
        name: 'Simple Math.random()',
        regex: /Math\.random\(\)/g,
        replacement: 'window.SecureRandom.random()'
    },
    {
        name: 'Math.floor(Math.random() * number)',
        regex: /Math\.floor\s*\(\s*Math\.random\s*\(\s*\)\s*\*\s*(\d+)\s*\)/g,
        replacement: (match, num) => `window.SecureRandom.randomInt(0, ${num} - 1)`
    },
    {
        name: 'Math.floor(Math.random() * variable)',
        regex: /Math\.floor\s*\(\s*Math\.random\s*\(\s*\)\s*\*\s*([a-zA-Z_$][a-zA-Z0-9_$\.]*)\s*\)/g,
        replacement: (match, variable) => `window.SecureRandom.randomInt(0, ${variable} - 1)`
    },
    {
        name: 'Math.random() * number',
        regex: /Math\.random\s*\(\s*\)\s*\*\s*(\d+(?:\.\d+)?)/g,
        replacement: (match, num) => `window.SecureRandom.randomFloat(0, ${num})`
    },
    {
        name: 'Math.random() * variable',
        regex: /Math\.random\s*\(\s*\)\s*\*\s*([a-zA-Z_$][a-zA-Z0-9_$\.]*)/g,
        replacement: (match, variable) => `window.SecureRandom.randomFloat(0, ${variable})`
    }
];

// Directories to scan
const dirsToScan = [
    path.join(__dirname, '..', 'client', 'js'),
    path.join(__dirname, '..', 'client', 'scripts'),
    path.join(__dirname, '..', 'deployment_temp')
];

// Files to exclude
const excludeFiles = [
    'crypto-secure-random.js',
    'memory-safe-events.js',
    'error-handler-pro.js',
    'input-validator-pro.js',
    'performance-optimizer.js',
    'pro-init.js'
];

let totalFixed = 0;
let filesModified = 0;

// Recursively get all JS files
function getAllJsFiles(dir) {
    let files = [];
    
    try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // Skip node_modules
                if (item !== 'node_modules') {
                    files = files.concat(getAllJsFiles(fullPath));
                }
            } else if (item.endsWith('.js') && !excludeFiles.includes(item)) {
                files.push(fullPath);
            }
        }
    } catch (e) {
        // Directory might not exist
    }
    
    return files;
}

// Process a single file
function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        let fixes = 0;
        
        // Skip if file already has SecureRandom
        if (content.includes('This file requires crypto-secure-random.js')) {
            return;
        }
        
        // Apply each pattern
        patterns.forEach(({ name, regex, replacement }) => {
            const matches = content.match(regex);
            if (matches) {
                if (typeof replacement === 'function') {
                    content = content.replace(regex, replacement);
                } else {
                    content = content.replace(regex, replacement);
                }
                fixes += matches.length;
                console.log(`  ✅ Fixed ${matches.length} instances of: ${name}`);
            }
        });
        
        // If we made changes, add header comment and save
        if (content !== originalContent) {
            // Add header comment
            if (!content.startsWith('// This file requires')) {
                content = `// This file requires crypto-secure-random.js to be loaded first\n${content}`;
            }
            
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Fixed ${fixes} Math.random() calls in: ${path.relative(process.cwd(), filePath)}`);
            totalFixed += fixes;
            filesModified++;
        }
        
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
    }
}

// Main execution
console.log('🔍 Scanning for Math.random() usage...\n');

// Get all JS files
const allFiles = [];
dirsToScan.forEach(dir => {
    if (fs.existsSync(dir)) {
        allFiles.push(...getAllJsFiles(dir));
    }
});

console.log(`Found ${allFiles.length} JavaScript files to scan\n`);

// Process each file
allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('Math.random')) {
        console.log(`\n📄 Processing: ${path.relative(process.cwd(), file)}`);
        processFile(file);
    }
});

// Summary
console.log('\n' + '='.repeat(60));
console.log(`✅ COMPLETE: Fixed ${totalFixed} Math.random() calls in ${filesModified} files`);
console.log('='.repeat(60));

// Create report
const report = {
    timestamp: new Date().toISOString(),
    totalFixed,
    filesModified,
    patterns: patterns.map(p => p.name)
};

fs.writeFileSync(
    path.join(__dirname, 'math-random-fix-report.json'),
    JSON.stringify(report, null, 2)
);

console.log('\n📊 Report saved to: scripts/math-random-fix-report.json');