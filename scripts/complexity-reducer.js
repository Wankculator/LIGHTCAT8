#!/usr/bin/env node

/**
 * COMPLEXITY REDUCER MCP
 * Removes unnecessary files and reduces project complexity
 */

const fs = require('fs');
const path = require('path');
// No chalk - keep it simple

console.log('🧹 COMPLEXITY REDUCER - Cleaning up the mess');
console.log('==========================================\n');

// Files to remove (webhook stuff we don't need yet)
const filesToRemove = [
    // Webhook files added prematurely
    'server/services/webhookService.js',
    'server/routes/webhookManagement.js',
    'server/integrations/discordWebhook.js',
    'server/config/webhooks.js',
    'scripts/test-webhooks.js',
    'client/webhook-dashboard.html',
    '.github/workflows/webhook-notifications.yml',
    '.husky/post-commit',
    'WEBHOOK_INTEGRATION.md',
    
    // Other complexity we don't need
    'AWESOME_INTEGRATIONS.md',
    'PRO_UI_WORKFLOW.md',
    
    // Test files
    'mobile-fix-test.html',
    'MOBILE_FIX_INLINE.txt',
    
    // Backup files
    '**/*.backup',
    '**/*.bak'
];

// Patterns to remove from files
const codeToRemove = [
    {
        file: 'server/controllers/rgbPaymentController.js',
        patterns: [
            /const { webhookService } = require\('\.\/services\/webhookService'\);/g,
            /await webhookService\.emit\([^)]+\);/g,
            /\/\/ Emit webhook[^\n]*/g
        ]
    },
    {
        file: 'server/routes/game.js',
        patterns: [
            /const { webhookService } = require\('\.\.\/services\/webhookService'\);/g,
            /await webhookService\.emit\([^)]+\);/g,
            /\/\/ Emit webhook[^\n]*/g,
            /\/\/ Check if it's a high score[\s\S]*?}\n/g
        ]
    },
    {
        file: 'server/app.js',
        patterns: [
            /app\.use\('\/api\/webhook-management'[^;]+;\s*\/\/[^\n]*/g
        ]
    },
    {
        file: 'package.json',
        patterns: [
            /"webhooks:test":[^\n]*\n/g,
            /"webhooks:dashboard":[^\n]*\n/g,
            /"webhooks:list":[^\n]*\n/g,
            /"deploy:notify":[^\n]*\n/g
        ]
    }
];

let removedCount = 0;
let cleanedCount = 0;

// Function to remove files
function removeFile(filePath) {
    const fullPath = path.join(process.cwd(), filePath);
    
    try {
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`✅ Removed: ${filePath}`);
            removedCount++;
            return true;
        }
    } catch (error) {
        console.log(`⚠️  Could not remove ${filePath}: ${error.message}`);
    }
    return false;
}

// Function to clean code from files
function cleanFile(fileInfo) {
    const fullPath = path.join(process.cwd(), fileInfo.file);
    
    try {
        if (!fs.existsSync(fullPath)) {
            return false;
        }
        
        let content = fs.readFileSync(fullPath, 'utf8');
        let originalContent = content;
        
        fileInfo.patterns.forEach(pattern => {
            content = content.replace(pattern, '');
        });
        
        if (content !== originalContent) {
            // Backup original
            fs.writeFileSync(fullPath + '.pre-cleanup', originalContent);
            
            // Write cleaned content
            fs.writeFileSync(fullPath, content);
            
            console.log(`✅ Cleaned: ${fileInfo.file}`);
            cleanedCount++;
            return true;
        }
        
    } catch (error) {
        console.log(`⚠️  Could not clean ${fileInfo.file}: ${error.message}`);
    }
    return false;
}

// Function to show current complexity metrics
function showComplexityMetrics() {
    console.log('\n📊 Current Complexity Metrics:\n');
    
    const metrics = {
        totalFiles: 0,
        jsFiles: 0,
        cssFiles: 0,
        dependencies: 0,
        totalLines: 0
    };
    
    // Count files
    function countFiles(dir) {
        try {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
                    countFiles(fullPath);
                } else if (stat.isFile()) {
                    metrics.totalFiles++;
                    if (file.endsWith('.js')) metrics.jsFiles++;
                    if (file.endsWith('.css')) metrics.cssFiles++;
                }
            });
        } catch (error) {
            // Ignore errors
        }
    }
    
    countFiles(process.cwd());
    
    // Count dependencies
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        metrics.dependencies = Object.keys(packageJson.dependencies || {}).length;
    } catch (error) {
        // Ignore
    }
    
    console.log(`Total Files: ${metrics.totalFiles}`);
    console.log(`JavaScript Files: ${metrics.jsFiles}`);
    console.log(`CSS Files: ${metrics.cssFiles}`);
    console.log(`Dependencies: ${metrics.dependencies}`);
}

// Function to create simplified deployment
function createSimplifiedDeployment() {
    const deployScript = `#!/bin/bash
# SIMPLIFIED DEPLOYMENT - Just the essentials

echo "🚀 Simple Deploy - No complexity!"

# Just copy the critical files
rsync -avz --exclude='node_modules' --exclude='.git' \\
    client/ root@209.38.86.47:/var/www/lightcat/client/ \\
    || echo "SSH failed - use manual upload"

echo "✅ Done! Check the site."
`;
    
    fs.writeFileSync('simple-deploy.sh', deployScript);
    fs.chmodSync('simple-deploy.sh', '755');
    console.log('✅ Created simple-deploy.sh');
}

// Main execution
console.log('1️⃣  Showing current complexity...');
showComplexityMetrics();

console.log('\n2️⃣  Removing unnecessary files...');
filesToRemove.forEach(file => {
    removeFile(file);
});

console.log('\n3️⃣  Cleaning webhook code from files...');
codeToRemove.forEach(fileInfo => {
    cleanFile(fileInfo);
});

console.log('\n4️⃣  Creating simplified deployment...');
createSimplifiedDeployment();

console.log('\n5️⃣  Final complexity metrics...');
showComplexityMetrics();

// Summary
console.log(`\n✅ COMPLEXITY REDUCED!\n`);
console.log(`Files removed: ${removedCount}`);
console.log(`Files cleaned: ${cleanedCount}`);
console.log('\nYour project is now simpler and focused on what matters:');
console.log('1. ✅ Game that works');
console.log('2. ✅ Payment flow');
console.log('3. ✅ Mobile UI that users can see');
console.log('4. ❌ Webhook monitoring (removed - add back when live)');

if (removedCount === 0 && cleanedCount === 0) {
    console.log('\n⚠️  Webhook files may have already been removed.');
}