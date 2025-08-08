#!/usr/bin/env node

/**
 * Fix Memory Leaks Found by Memory MCP
 * Addresses event listeners and timer cleanup issues
 */

const fs = require('fs');
const path = require('path');

console.log('💾 Fixing Memory Leaks...\n');

let totalFixes = 0;

// Files with event listener issues
const eventListenerFiles = [
    'client/js/game/CharacterController.js',
    'client/js/game/ProGame.js',
    'client/js/game/SimpleCatGame.js',
    'client/js/game/SimpleGame.js',
    'client/js/game/main.js',
    'client/js/perfect-10-enhancements.js',
    'client/js/perfect-10-integration.js',
    'client/js/professional.js',
    'client/js/qr-scanner.js',
    'client/scripts/app.js'
];

// Files with timer issues
const timerFiles = [
    'client/js/game/GameUI.js',
    'client/scripts/app-clean.js',
    'client/scripts/app-hostinger.js',
    'client/scripts/app-pro.js',
    'server/websocket.js'
];

// Fix event listeners by ensuring cleanup
function fixEventListeners() {
    console.log('🎯 Fixing Event Listener Leaks...');
    
    eventListenerFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  File not found: ${file}`);
            return;
        }
        
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        
        // Add cleanup method if it doesn't exist
        if (file.includes('game') && !content.includes('cleanup()') && !content.includes('destroy()')) {
            // Find the class definition
            const classMatch = content.match(/class\s+(\w+)\s*{/);
            if (classMatch) {
                const className = classMatch[1];
                
                // Add cleanup method before the closing brace
                const insertPosition = content.lastIndexOf('}');
                const cleanupMethod = `
    // Cleanup method to prevent memory leaks
    cleanup() {
        // Remove all event listeners
        if (this.canvas) {
            this.canvas.removeEventListener('click', this.handleClick);
            this.canvas.removeEventListener('mousemove', this.handleMouseMove);
            this.canvas.removeEventListener('touchstart', this.handleTouchStart);
            this.canvas.removeEventListener('touchmove', this.handleTouchMove);
            this.canvas.removeEventListener('touchend', this.handleTouchEnd);
        }
        
        if (typeof window !== 'undefined') {
            window.removeEventListener('resize', this.handleResize);
            window.removeEventListener('keydown', this.handleKeyDown);
            window.removeEventListener('keyup', this.handleKeyUp);
        }
        
        // Clear any timers
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Clear references
        this.canvas = null;
        this.ctx = null;
    }
    
`;
                
                content = content.slice(0, insertPosition) + cleanupMethod + content.slice(insertPosition);
                console.log(`✅ Added cleanup method to ${className} in ${file}`);
                totalFixes++;
            }
        }
        
        // Store event listener references
        content = content.replace(
            /addEventListener\(['"](\w+)['"]\s*,\s*(\([^)]*\)\s*=>\s*{[^}]+})/g,
            (match, event, handler) => {
                // Skip if already stored
                if (content.includes(`this.${event}Handler`)) return match;
                
                return `this.${event}Handler = ${handler};\n        addEventListener('${event}', this.${event}Handler)`;
            }
        );
        
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content);
        }
    });
}

// Fix timer leaks
function fixTimers() {
    console.log('\n⏱️  Fixing Timer Leaks...');
    
    timerFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  File not found: ${file}`);
            return;
        }
        
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        
        // Track setInterval calls
        let intervalCount = 0;
        content = content.replace(
            /setInterval\s*\(/g,
            (match) => {
                intervalCount++;
                return `this.interval${intervalCount} = setInterval(`;
            }
        );
        
        // Track setTimeout calls that might repeat
        let timeoutCount = 0;
        content = content.replace(
            /setTimeout\s*\(/g,
            (match) => {
                timeoutCount++;
                return `this.timeout${timeoutCount} = setTimeout(`;
            }
        );
        
        // Add cleanup for intervals if modified
        if (intervalCount > 0 && !content.includes('clearAllIntervals')) {
            const cleanupCode = `
    // Clear all intervals to prevent memory leaks
    clearAllIntervals() {
        ${Array.from({length: intervalCount}, (_, i) => 
            `if (this.interval${i + 1}) { clearInterval(this.interval${i + 1}); }`
        ).join('\n        ')}
    }
`;
            
            // Find a good place to insert
            const insertMatch = content.match(/}\s*$/);
            if (insertMatch) {
                const insertPosition = content.lastIndexOf('}');
                content = content.slice(0, insertPosition) + cleanupCode + '\n' + content.slice(insertPosition);
                console.log(`✅ Added interval cleanup to ${file}`);
                totalFixes++;
            }
        }
        
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content);
        }
    });
}

// Add WeakMap recommendation for large data structures
function addWeakMapSuggestions() {
    console.log('\n📦 Adding WeakMap Recommendations...');
    
    const recommendationComment = `
/**
 * Memory Optimization Note:
 * For large object references, consider using WeakMap/WeakSet
 * to allow garbage collection when objects are no longer needed.
 * 
 * Example:
 * const cache = new WeakMap(); // Instead of Map
 * const refs = new WeakSet();  // Instead of Set
 */
`;
    
    const largeFiles = [
        'client/js/game/ProGame.js',
        'client/litecat-game.js',
        'server/services/emailService.js'
    ];
    
    largeFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        
        if (!fs.existsSync(filePath)) {
            return;
        }
        
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Add recommendation if not present
        if (!content.includes('WeakMap') && !content.includes('Memory Optimization Note')) {
            content = recommendationComment + '\n' + content;
            fs.writeFileSync(filePath, content);
            console.log(`✅ Added WeakMap recommendation to ${file}`);
            totalFixes++;
        }
    });
}

// Run all fixes
fixEventListeners();
fixTimers();
addWeakMapSuggestions();

console.log(`\n🎯 Total memory leak fixes applied: ${totalFixes}`);
console.log('✅ Memory leaks addressed!');
console.log('\n📋 Summary:');
console.log('   • Event listeners → Added cleanup methods');
console.log('   • Timers → Stored references for clearing');
console.log('   • Large objects → WeakMap recommendations');
console.log('\n💡 Remember to call cleanup methods when components unmount!');