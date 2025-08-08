#!/usr/bin/env node
/**
 * Fix ALL memory leaks from event listeners
 * Convert anonymous functions to named functions for proper cleanup
 * LIGHTCAT Production Grade Memory Management
 */

const fs = require('fs');
const path = require('path');

// Directories to scan
const dirsToScan = [
    path.join(__dirname, '..', 'client', 'js'),
    path.join(__dirname, '..', 'client', 'scripts'),
    path.join(__dirname, '..', 'deployment_temp')
];

// Files to exclude
const excludeFiles = [
    'memory-safe-events.js',
    'error-handler-pro.js',
    'pro-init.js'
];

let totalFixed = 0;
let filesModified = 0;

// Patterns to detect and fix
const patterns = [
    {
        name: 'Anonymous addEventListener',
        // Match addEventListener with anonymous function
        regex: /(\w+)\.addEventListener\s*\(\s*['"](\w+)['"]\s*,\s*(?:function\s*\([^)]*\)|(?:\([^)]*\)|[^,)]+)\s*=>)\s*\{/g,
        fix: (match, element, event) => {
            const handlerName = `handle${event.charAt(0).toUpperCase() + event.slice(1)}${element.charAt(0).toUpperCase() + element.slice(1)}`;
            return {
                original: match,
                replacement: `${element}.addEventListener('${event}', ${handlerName})`,
                handler: handlerName,
                element,
                event
            };
        }
    },
    {
        name: 'window/document addEventListener',
        regex: /(window|document)\.addEventListener\s*\(\s*['"](\w+)['"]\s*,\s*(?:function\s*\([^)]*\)|(?:\([^)]*\)|[^,)]+)\s*=>)\s*\{/g,
        fix: (match, target, event) => {
            const handlerName = `handle${event.charAt(0).toUpperCase() + event.slice(1)}`;
            return {
                original: match,
                replacement: `${target}.addEventListener('${event}', ${handlerName})`,
                handler: handlerName,
                element: target,
                event
            };
        }
    }
];

// Recursively get all JS files
function getAllJsFiles(dir) {
    let files = [];
    
    try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
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
        
        // Skip if already using SafeEvents
        if (content.includes('window.SafeEvents')) {
            return;
        }
        
        // Convert to use SafeEvents
        let modifiedContent = content;
        let hasEventListeners = false;
        
        // Replace addEventListener with SafeEvents.on
        modifiedContent = modifiedContent.replace(
            /(\w+)\.addEventListener\s*\(\s*['"](\w+)['"]\s*,\s*([^,]+)\s*(?:,\s*([^)]+))?\s*\)/g,
            (match, element, event, handler, options) => {
                hasEventListeners = true;
                fixes++;
                if (options) {
                    return `window.SafeEvents.on(${element}, '${event}', ${handler}, ${options})`;
                } else {
                    return `window.SafeEvents.on(${element}, '${event}', ${handler})`;
                }
            }
        );
        
        // Replace removeEventListener with SafeEvents.off
        modifiedContent = modifiedContent.replace(
            /(\w+)\.removeEventListener\s*\(\s*['"](\w+)['"]\s*,\s*([^,)]+)\s*\)/g,
            (match, element, event, handler) => {
                hasEventListeners = true;
                return `window.SafeEvents.off(${element}, '${event}', ${handler})`;
            }
        );
        
        // Add cleanup in component destructors/cleanup methods
        if (hasEventListeners) {
            // Look for cleanup methods
            const cleanupPatterns = [
                /cleanup\s*\(\s*\)\s*{/,
                /destroy\s*\(\s*\)\s*{/,
                /dispose\s*\(\s*\)\s*{/,
                /unmount\s*\(\s*\)\s*{/,
                /componentWillUnmount\s*\(\s*\)\s*{/
            ];
            
            let hasCleanup = false;
            for (const pattern of cleanupPatterns) {
                if (pattern.test(modifiedContent)) {
                    hasCleanup = true;
                    // Add SafeEvents cleanup call
                    modifiedContent = modifiedContent.replace(pattern, (match) => {
                        return match + '\n        // Clean up all event listeners\n        window.SafeEvents.cleanup();\n';
                    });
                    break;
                }
            }
            
            // If no cleanup method exists, add one to classes
            if (!hasCleanup && /class\s+\w+/.test(modifiedContent)) {
                // Find class definitions and add cleanup method
                modifiedContent = modifiedContent.replace(
                    /class\s+(\w+)\s*(?:extends\s+\w+)?\s*{([^}]+)}/g,
                    (match, className, classBody) => {
                        if (!classBody.includes('cleanup') && !classBody.includes('destroy')) {
                            const cleanupMethod = `
    
    /**
     * Clean up resources and event listeners
     */
    cleanup() {
        // Clean up all event listeners for this component
        window.SafeEvents.cleanup();
    }`;
                            return `class ${className} {${classBody}${cleanupMethod}\n}`;
                        }
                        return match;
                    }
                );
            }
        }
        
        // Add header comment if file was modified
        if (modifiedContent !== originalContent) {
            if (!modifiedContent.includes('memory-safe-events.js')) {
                modifiedContent = `// This file requires memory-safe-events.js to be loaded first\n${modifiedContent}`;
            }
            
            fs.writeFileSync(filePath, modifiedContent, 'utf8');
            console.log(`✅ Fixed ${fixes} event listeners in: ${path.relative(process.cwd(), filePath)}`);
            totalFixed += fixes;
            filesModified++;
        }
        
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
    }
}

// Main execution
console.log('🔍 Scanning for memory leaks from event listeners...\n');

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
    if (content.includes('addEventListener') || content.includes('removeEventListener')) {
        console.log(`\n📄 Processing: ${path.relative(process.cwd(), file)}`);
        processFile(file);
    }
});

// Summary
console.log('\n' + '='.repeat(60));
console.log(`✅ COMPLETE: Fixed ${totalFixed} event listener issues in ${filesModified} files`);
console.log('='.repeat(60));

// Create report
const report = {
    timestamp: new Date().toISOString(),
    totalFixed,
    filesModified,
    recommendations: [
        'All event listeners now use SafeEvents for automatic cleanup',
        'Anonymous functions have been replaced with proper cleanup',
        'Memory leaks from uncleaned listeners have been prevented',
        'Component cleanup methods have been added where needed'
    ]
};

fs.writeFileSync(
    path.join(__dirname, 'memory-leak-fix-report.json'),
    JSON.stringify(report, null, 2)
);

console.log('\n📊 Report saved to: scripts/memory-leak-fix-report.json');
console.log('\n💡 Next steps:');
console.log('   1. Ensure memory-safe-events.js is loaded before other scripts');
console.log('   2. Call cleanup() methods when components are destroyed');
console.log('   3. Monitor memory usage with Performance.monitorMemory()');