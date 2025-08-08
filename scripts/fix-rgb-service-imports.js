#!/usr/bin/env node

/**
 * Fix RGB service imports to use .default
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

async function fixFile(filePath) {
    try {
        let content = await fs.readFile(filePath, 'utf8');
        let modified = false;
        
        // Fix rgbService imports (but not rgbServiceV2)
        if (content.includes("require('../services/rgbService')") && !content.includes('.default')) {
            content = content.replace(
                /const rgbService = require\('\.\.\/services\/rgbService'\);/g,
                "const rgbService = require('../services/rgbService').default;"
            );
            modified = true;
        }
        
        if (modified) {
            await fs.writeFile(filePath, content);
            console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
        }
        
        return modified;
    } catch (error) {
        console.error(`❌ Error fixing ${filePath}:`, error.message);
        return false;
    }
}

async function main() {
    console.log('🔧 Fixing RGB service imports...\n');
    
    // Files that need fixing
    const filesToFix = [
        'server/routes/admin.js',
        'server/controllers/rgbPaymentController.js',
        'server/controllers/rgbPaymentController-updated.js',
        'server/controllers/paymentController.js',
        'server/controllers/enhancedRgbPaymentController.js'
    ];
    
    let fixedCount = 0;
    
    for (const file of filesToFix) {
        const filePath = path.join(process.cwd(), file);
        try {
            await fs.access(filePath);
            const fixed = await fixFile(filePath);
            if (fixed) fixedCount++;
        } catch (error) {
            console.log(`⚠️  Skipping ${file} (not found)`);
        }
    }
    
    console.log(`\n✅ Fixed ${fixedCount} files`);
    console.log('\n✨ RGB service imports updated!');
}

main().catch(console.error);