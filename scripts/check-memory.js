#!/usr/bin/env node

/**
 * Memory MCP - Analyzes JavaScript memory usage and detects leaks
 * Based on CLAUDE.md requirements
 */

const fs = require('fs');
const path = require('path');
const v8 = require('v8');

console.log('💾 Memory MCP - JavaScript Memory Analysis');
console.log('=========================================\n');

let totalIssues = 0;
const memoryIssues = {
    eventListeners: [],
    timers: [],
    largeFiles: [],
    codeSplitting: [],
    heapUsage: []
};

// Analyze heap statistics
function analyzeHeapUsage() {
    const heapStats = v8.getHeapStatistics();
    const heapUsedMB = Math.round(heapStats.used_heap_size / 1024 / 1024);
    const heapTotalMB = Math.round(heapStats.total_heap_size / 1024 / 1024);
    const heapLimitMB = Math.round(heapStats.heap_size_limit / 1024 / 1024);
    
    console.log('📊 Current Heap Usage:');
    console.log(`   Used: ${heapUsedMB} MB`);
    console.log(`   Total: ${heapTotalMB} MB`);
    console.log(`   Limit: ${heapLimitMB} MB`);
    console.log(`   Usage: ${Math.round((heapUsedMB / heapLimitMB) * 100)}%\n`);
    
    if (heapUsedMB > heapLimitMB * 0.8) {
        memoryIssues.heapUsage.push('Heap usage exceeds 80% of limit');
        totalIssues++;
    }
}

// Check for event listener leaks
function checkEventListeners(filePath, content) {
    const addListenerPattern = /addEventListener\s*\(/g;
    const removeListenerPattern = /removeEventListener\s*\(/g;
    
    const addCount = (content.match(addListenerPattern) || []).length;
    const removeCount = (content.match(removeListenerPattern) || []).length;
    
    if (addCount > removeCount + 2) { // Allow some difference
        memoryIssues.eventListeners.push({
            file: filePath,
            added: addCount,
            removed: removeCount,
            difference: addCount - removeCount
        });
        totalIssues++;
    }
    
    // Check for anonymous functions in event listeners
    const anonymousListenerPattern = /addEventListener\s*\([^,]+,\s*function\s*\(/g;
    const arrowListenerPattern = /addEventListener\s*\([^,]+,\s*\([^)]*\)\s*=>/g;
    
    const anonymousMatches = content.match(anonymousListenerPattern) || [];
    const arrowMatches = content.match(arrowListenerPattern) || [];
    
    if (anonymousMatches.length + arrowMatches.length > 0) {
        memoryIssues.eventListeners.push({
            file: filePath,
            issue: 'Anonymous functions in event listeners (cannot be removed)',
            count: anonymousMatches.length + arrowMatches.length
        });
        totalIssues++;
    }
}

// Check for timer leaks
function checkTimers(filePath, content) {
    const setIntervalPattern = /setInterval\s*\(/g;
    const clearIntervalPattern = /clearInterval\s*\(/g;
    const setTimeoutPattern = /setTimeout\s*\(/g;
    const clearTimeoutPattern = /clearTimeout\s*\(/g;
    
    const intervalSet = (content.match(setIntervalPattern) || []).length;
    const intervalClear = (content.match(clearIntervalPattern) || []).length;
    const timeoutSet = (content.match(setTimeoutPattern) || []).length;
    const timeoutClear = (content.match(clearTimeoutPattern) || []).length;
    
    if (intervalSet > intervalClear) {
        memoryIssues.timers.push({
            file: filePath,
            type: 'interval',
            set: intervalSet,
            cleared: intervalClear,
            leaked: intervalSet - intervalClear
        });
        totalIssues++;
    }
    
    // Check for recursive setTimeout (which is fine) vs potential leaks
    if (timeoutSet > timeoutClear + 5) { // Allow some uncleareds
        memoryIssues.timers.push({
            file: filePath,
            type: 'timeout',
            set: timeoutSet,
            cleared: timeoutClear,
            potential: timeoutSet - timeoutClear
        });
    }
}

// Analyze large files for code splitting opportunities
function analyzeLargeFiles(filePath, content) {
    const lines = content.split('\n').length;
    const sizeKB = Buffer.byteLength(content, 'utf8') / 1024;
    
    if (lines > 1000 || sizeKB > 100) {
        memoryIssues.largeFiles.push({
            file: filePath,
            lines: lines,
            sizeKB: Math.round(sizeKB),
            recommendation: lines > 1000 ? 'Consider splitting this file' : 'Large file size'
        });
        
        // Suggest code splitting points
        const exportCount = (content.match(/export\s+(function|class|const)/g) || []).length;
        if (exportCount > 10) {
            memoryIssues.codeSplitting.push({
                file: filePath,
                exports: exportCount,
                suggestion: 'Multiple exports - good candidate for code splitting'
            });
        }
        
        totalIssues++;
    }
}

// Check for common memory leak patterns
function checkMemoryLeakPatterns(filePath, content) {
    // Global variable assignments
    const globalPattern = /window\.[a-zA-Z_$][a-zA-Z0-9_$]*\s*=/g;
    const globalMatches = content.match(globalPattern) || [];
    
    if (globalMatches.length > 5) {
        memoryIssues.heapUsage.push({
            file: filePath,
            issue: 'Multiple global variable assignments',
            count: globalMatches.length
        });
        totalIssues++;
    }
    
    // Large array/object literals
    const largeArrayPattern = /\[[^\]]{1000,}\]/g;
    const largeObjectPattern = /\{[^}]{1000,}\}/g;
    
    if (content.match(largeArrayPattern) || content.match(largeObjectPattern)) {
        memoryIssues.heapUsage.push({
            file: filePath,
            issue: 'Large inline data structures detected'
        });
        totalIssues++;
    }
    
    // Circular reference risk
    if (content.includes('parent') && content.includes('child') && 
        (content.includes('.parent =') || content.includes('.child ='))) {
        memoryIssues.heapUsage.push({
            file: filePath,
            issue: 'Potential circular reference pattern detected'
        });
    }
}

// Main analysis
analyzeHeapUsage();

console.log('Analyzing JavaScript files for memory issues...\n');

const jsFiles = [];
function findJSFiles(dir) {
    try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory() && !file.includes('node_modules') && !file.startsWith('.')) {
                findJSFiles(filePath);
            } else if (file.endsWith('.js')) {
                jsFiles.push(filePath);
            }
        });
    } catch (error) {
        // Ignore permission errors
    }
}

findJSFiles(process.cwd());

console.log(`Found ${jsFiles.length} JavaScript files to analyze\n`);

// Analyze each file
jsFiles.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(process.cwd(), file);
        
        checkEventListeners(relativePath, content);
        checkTimers(relativePath, content);
        analyzeLargeFiles(relativePath, content);
        checkMemoryLeakPatterns(relativePath, content);
    } catch (error) {
        // Skip files that can't be read
    }
});

// Report results
console.log('\n📊 MEMORY ANALYSIS RESULTS');
console.log('==========================\n');

// Event Listener Issues
if (memoryIssues.eventListeners.length > 0) {
    console.log('⚠️  Event Listener Leaks:');
    memoryIssues.eventListeners.forEach(issue => {
        if (issue.difference) {
            console.log(`   • ${issue.file}: ${issue.added} added, ${issue.removed} removed (${issue.difference} potential leaks)`);
        } else {
            console.log(`   • ${issue.file}: ${issue.issue} (${issue.count} instances)`);
        }
    });
    console.log('');
}

// Timer Issues
if (memoryIssues.timers.length > 0) {
    console.log('⏱️  Timer Leaks:');
    memoryIssues.timers.forEach(issue => {
        console.log(`   • ${issue.file}: ${issue.set} ${issue.type}s set, ${issue.cleared} cleared`);
    });
    console.log('');
}

// Large Files
if (memoryIssues.largeFiles.length > 0) {
    console.log('📦 Large Files (Code Splitting Opportunities):');
    memoryIssues.largeFiles.forEach(issue => {
        console.log(`   • ${issue.file}: ${issue.lines} lines, ${issue.sizeKB} KB - ${issue.recommendation}`);
    });
    console.log('');
}

// Code Splitting Suggestions
if (memoryIssues.codeSplitting.length > 0) {
    console.log('✂️  Code Splitting Suggestions:');
    memoryIssues.codeSplitting.forEach(issue => {
        console.log(`   • ${issue.file}: ${issue.exports} exports - ${issue.suggestion}`);
    });
    console.log('');
}

// Memory Patterns
if (memoryIssues.heapUsage.length > 0) {
    console.log('💾 Memory Usage Patterns:');
    memoryIssues.heapUsage.forEach(issue => {
        if (typeof issue === 'string') {
            console.log(`   • ${issue}`);
        } else {
            console.log(`   • ${issue.file}: ${issue.issue}${issue.count ? ` (${issue.count})` : ''}`);
        }
    });
    console.log('');
}

// Summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Total Memory Issues: ${totalIssues}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Recommendations
if (totalIssues > 0) {
    console.log('💡 Recommendations:');
    console.log('   1. Remove event listeners in cleanup/unmount');
    console.log('   2. Clear timers when components unmount');
    console.log('   3. Consider code splitting for large files');
    console.log('   4. Avoid global variables where possible');
    console.log('   5. Use WeakMap/WeakSet for object references\n');
}

process.exit(totalIssues > 10 ? 1 : 0); // Fail if more than 10 issues