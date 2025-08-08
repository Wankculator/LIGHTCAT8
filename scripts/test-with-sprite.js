#!/usr/bin/env node

/**
 * TestSprite MCP - Validates CORS compliance and ElementFactory usage
 * Based on CLAUDE.md requirements
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 TestSprite Validation - CORS & ElementFactory Checker');
console.log('======================================================\n');

let totalIssues = 0;
const issues = {
    cors: [],
    elementFactory: [],
    performance: [],
    seedGeneration: []
};

// Get all JavaScript files
function getAllJSFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.includes('node_modules') && !file.startsWith('.')) {
            getAllJSFiles(filePath, fileList);
        } else if (file.endsWith('.js')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

// Check for direct external API calls
function checkCORSCompliance(filePath, content) {
    const directAPIPatterns = [
        /fetch\s*\(\s*['"`]https?:\/\/(?!localhost|127\.0\.0\.1|rgblightcat\.com)/g,
        /axios\s*\.\s*\w+\s*\(\s*['"`]https?:\/\/(?!localhost|127\.0\.0\.1|rgblightcat\.com)/g,
        /XMLHttpRequest.*open\s*\(\s*['"`]\w+['"`]\s*,\s*['"`]https?:\/\/(?!localhost|127\.0\.0\.1)/g
    ];
    
    directAPIPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
            matches.forEach(match => {
                issues.cors.push(`${filePath}: Direct external API call - ${match.substring(0, 50)}...`);
                totalIssues++;
            });
        }
    });
}

// Check for jQuery-style element factory usage
function checkElementFactory(filePath, content) {
    const jqueryPatterns = [
        /\$\s*\.\s*nav\s*\(/g,
        /\$\s*\.\s*header\s*\(/g,
        /\$\s*\.\s*div\s*\(/g,
        /\$\s*\.\s*span\s*\(/g,
        /\$\s*\.\s*button\s*\(/g,
        /\$\s*\(\s*['"`]<\w+/g  // $('<div>') style
    ];
    
    jqueryPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
            matches.forEach(match => {
                issues.elementFactory.push(`${filePath}: jQuery-style element creation - ${match}`);
                totalIssues++;
            });
        }
    });
}

// Check for performance anti-patterns
function checkPerformancePatterns(filePath, content) {
    // Check for DOM manipulation in loops
    if (content.match(/for\s*\([^)]+\)[^{]*{[^}]*\.innerHTML\s*[+=]/)) {
        issues.performance.push(`${filePath}: DOM manipulation inside loop`);
        totalIssues++;
    }
    
    // Check for synchronous XHR
    if (content.includes('XMLHttpRequest') && content.includes('false')) {
        issues.performance.push(`${filePath}: Possible synchronous XMLHttpRequest`);
        totalIssues++;
    }
    
    // Check for document.write
    if (content.includes('document.write')) {
        issues.performance.push(`${filePath}: Uses document.write`);
        totalIssues++;
    }
}

// Check seed generation integrity
function checkSeedGeneration(filePath, content) {
    // Skip files that are implementing secure random
    if (filePath.includes('crypto-secure-random.js') || 
        filePath.includes('secure-random') ||
        content.includes('window.crypto.getRandomValues')) {
        return;
    }
    
    // Check for Math.random() in actual crypto/seed generation (not just mentioning it)
    const lines = content.split('\n');
    lines.forEach((line, index) => {
        // Skip comments and console warnings about Math.random
        if (line.trim().startsWith('//') || line.trim().startsWith('*') || 
            line.includes('console.') || line.includes("'Math.random()'")) {
            return;
        }
        
        // Check for actual usage in crypto contexts
        if (line.includes('Math.random()') && 
            (line.match(/seed|key|token|uuid|id|hash|salt/i) || 
             content.substring(Math.max(0, content.indexOf(line) - 200), content.indexOf(line)).match(/crypto|security|auth/i))) {
            issues.seedGeneration.push(`${filePath}:${index + 1}: Uses Math.random() in potential crypto context`);
            totalIssues++;
        }
    });
    
    // Check for weak randomness in actual implementations
    if (content.match(/function\s+(generateSeed|createSeed|randomSeed|generateKey)/i)) {
        if (!content.includes('crypto.') && !content.includes('randomBytes') && !content.includes('getRandomValues')) {
            issues.seedGeneration.push(`${filePath}: Seed/key generation without crypto module`);
            totalIssues++;
        }
    }
}

// Main validation
console.log('Scanning JavaScript files...\n');

const clientFiles = getAllJSFiles(path.join(process.cwd(), 'client'));
const serverFiles = getAllJSFiles(path.join(process.cwd(), 'server'));
const allFiles = [...clientFiles, ...serverFiles];

console.log(`Found ${allFiles.length} JavaScript files to check\n`);

allFiles.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(process.cwd(), file);
        
        checkCORSCompliance(relativePath, content);
        checkElementFactory(relativePath, content);
        checkPerformancePatterns(relativePath, content);
        checkSeedGeneration(relativePath, content);
    } catch (error) {
        console.error(`Error reading ${file}: ${error.message}`);
    }
});

// Report results
console.log('\n📊 TESTSPRITE VALIDATION RESULTS');
console.log('================================\n');

// CORS Issues
if (issues.cors.length > 0) {
    console.log('❌ CORS Compliance Issues:');
    issues.cors.forEach(issue => console.log(`   • ${issue}`));
    console.log('');
} else {
    console.log('✅ CORS Compliance: PASSED - No direct external API calls\n');
}

// ElementFactory Issues
if (issues.elementFactory.length > 0) {
    console.log('❌ ElementFactory Issues:');
    issues.elementFactory.forEach(issue => console.log(`   • ${issue}`));
    console.log('');
} else {
    console.log('✅ ElementFactory: PASSED - No jQuery-style element creation\n');
}

// Performance Issues
if (issues.performance.length > 0) {
    console.log('⚠️  Performance Patterns:');
    issues.performance.forEach(issue => console.log(`   • ${issue}`));
    console.log('');
} else {
    console.log('✅ Performance: PASSED - No major anti-patterns found\n');
}

// Seed Generation Issues
if (issues.seedGeneration.length > 0) {
    console.log('🔒 Seed Generation Security:');
    issues.seedGeneration.forEach(issue => console.log(`   • ${issue}`));
    console.log('');
} else {
    console.log('✅ Seed Generation: PASSED - Secure randomness used\n');
}

// Summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Total Issues Found: ${totalIssues}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (totalIssues === 0) {
    console.log('🎉 All TestSprite validations PASSED!');
    process.exit(0);
} else {
    console.log('⚠️  Please fix the issues above for better security and performance.');
    process.exit(1);
}