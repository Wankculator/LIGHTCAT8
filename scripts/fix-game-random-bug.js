#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to fix
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

const projectRoot = path.join(__dirname, '..');

console.log('Fixing gameRandom() recursive bug in game files...\n');

gameFiles.forEach(file => {
    const filePath = path.join(projectRoot, file);
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Fix the recursive gameRandom() bug
        const buggyPattern = /function gameRandom\(\) \{\s*\/\/ For game physics and visual effects, Math\.random is acceptable\s*\/\/ This is NOT used for any security-critical operations\s*return gameRandom\(\);\s*\}/g;
        
        const fixedFunction = `function gameRandom() {
    // For game physics and visual effects, Math.random is acceptable
    // This is NOT used for any security-critical operations
    return Math.random();
}`;

        if (content.includes('return gameRandom();')) {
            content = content.replace(buggyPattern, fixedFunction);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Fixed: ${file}`);
        } else {
            console.log(`⏭️  Skipped: ${file} (already fixed or no bug found)`);
        }
        
    } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
    }
});

console.log('\n✅ Fix complete!');
console.log('\nNote: This fixes the recursive bug while maintaining Math.random() for game physics.');
console.log('Math.random() is acceptable for visual effects and game mechanics.');
console.log('For cryptographic operations, always use crypto.getRandomValues().');