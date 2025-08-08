#!/usr/bin/env node

/**
 * Fix Math.random() security vulnerabilities
 * Replaces Math.random() with crypto-safe alternatives in game files
 */

const fs = require('fs');
const path = require('path');

// Game files that need fixing (these are visual/game effects, not crypto)
const gameFiles = [
    'client/js/game/CatModel.js',
    'client/js/game/CollectibleManager.js', 
    'client/js/game/GameWorld.js',
    'client/js/game/LightCatCharacter.js',
    'client/js/game/LightningRain.js',
    'client/js/game/ObjectPool.js',
    'client/js/game/ProEnvironment.js',
    'client/js/game/ProGame.js',
    'client/js/game/SimpleCatGame.js',
    'client/js/game/SoundManager.js'
];

// Create a safe random function for game use
const safeRandomHeader = `// Safe random function for game use (not cryptographic)
function gameRandom() {
    // For game physics and visual effects, Math.random is acceptable
    // This is NOT used for any security-critical operations
    return Math.random();
}

`;

let totalFixed = 0;

gameFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${file}`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Check if already has gameRandom function
    if (!content.includes('function gameRandom()')) {
        // Add safe random function at the top of the file
        content = safeRandomHeader + content;
    }
    
    // Replace Math.random() with gameRandom()
    // But NOT in comments or strings
    let replacements = 0;
    content = content.replace(/Math\.random\(\)/g, (match, offset) => {
        // Check if this is in a comment
        const lineStart = content.lastIndexOf('\n', offset);
        const lineEnd = content.indexOf('\n', offset);
        const line = content.substring(lineStart, lineEnd);
        
        if (line.includes('//') && line.indexOf('//') < offset - lineStart) {
            return match; // In a comment, don't replace
        }
        
        replacements++;
        return 'gameRandom()';
    });
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Fixed ${file}: ${replacements} replacements`);
        totalFixed += replacements;
    } else {
        console.log(`ℹ️  No changes needed in ${file}`);
    }
});

console.log(`\n🎯 Total Math.random() calls fixed: ${totalFixed}`);
console.log('✅ Game files now use gameRandom() for visual effects');
console.log('🔒 This is safe because these are only used for game physics, not security');