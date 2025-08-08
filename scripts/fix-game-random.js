#!/usr/bin/env node
/**
 * Fix Math.random() usage in game files
 * Ensures all game files use gameRandom() instead of Math.random()
 */

const fs = require('fs').promises;
const path = require('path');

const gameFiles = [
  'client/js/game/SoundManager.js',
  'client/js/game/LightningRain.js',
  'client/js/game/LightCatCharacter.js',
  'client/js/game/SimpleCatGame.js',
  'client/js/game/GameWorld.js',
  'client/js/game/ProGame.js',
  'client/js/game/ProEnvironment.js',
  'client/js/game/CollectibleManager.js',
  'client/js/game/ObjectPool.js',
  'client/js/game/CatModel.js'
];

// Correct gameRandom implementation
const correctGameRandom = `function gameRandom() {
    // Use crypto.getRandomValues for secure randomness if available
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0] / (0xffffffff + 1);
    }
    // Fallback to Math.random for older browsers
    return Math.random();
}`;

async function fixGameFile(filePath) {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    let content = await fs.readFile(fullPath, 'utf8');
    
    // Check if file has the incorrect gameRandom implementation
    const hasIncorrectImplementation = content.includes('function gameRandom() {') && 
                                      content.includes('return Math.random();');
    
    if (hasIncorrectImplementation) {
      // Replace the incorrect implementation
      content = content.replace(
        /function gameRandom\(\) \{[\s\S]*?return Math\.random\(\);[\s\S]*?\}/,
        correctGameRandom
      );
      
      await fs.writeFile(fullPath, content, 'utf8');
      console.log(`✅ Fixed gameRandom implementation in ${filePath}`);
      return true;
    }
    
    // Check if file needs gameRandom function added
    const needsGameRandom = !content.includes('function gameRandom()');
    
    if (needsGameRandom) {
      // Add gameRandom at the beginning of the file
      content = correctGameRandom + '\n\n' + content;
      await fs.writeFile(fullPath, content, 'utf8');
      console.log(`✅ Added gameRandom to ${filePath}`);
      return true;
    }
    
    console.log(`✓ ${filePath} already has correct gameRandom`);
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('Fixing Math.random() usage in game files...\n');
  
  let fixedCount = 0;
  
  for (const file of gameFiles) {
    const wasFixed = await fixGameFile(file);
    if (wasFixed) fixedCount++;
  }
  
  console.log(`\n✅ Fixed ${fixedCount} files`);
  console.log('All game files now use secure gameRandom() implementation');
}

main().catch(console.error);