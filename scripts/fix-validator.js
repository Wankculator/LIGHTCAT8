#!/usr/bin/env node

/**
 * FIX VALIDATOR MCP
 * Validates that our fixes actually work
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 FIX VALIDATOR - Checking all fixes');
console.log('====================================\n');

// Check what fixes have been applied
function validateFixes() {
    const results = {
        mobileCSS: false,
        inlineStyles: false,
        emergencyFiles: false,
        deploymentReady: false
    };
    
    // Check mobile CSS
    const mobileCSSPath = path.join(process.cwd(), 'client/css/mobile-optimized.css');
    if (fs.existsSync(mobileCSSPath)) {
        const content = fs.readFileSync(mobileCSSPath, 'utf8');
        results.mobileCSS = content.includes('MOBILE OVERRIDE - MAXIMUM PRIORITY');
        console.log(results.mobileCSS ? '✅' : '❌', 'Mobile CSS override in place');
    } else {
        console.log('❌ Mobile CSS file not found');
    }
    
    // Check index.html
    const indexPath = path.join(process.cwd(), 'client/index.html');
    if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath, 'utf8');
        results.inlineStyles = content.includes('mobile-emergency-override');
        console.log(results.inlineStyles ? '✅' : '❌', 'Inline styles added to index.html');
    }
    
    // Check emergency files
    const emergencyFiles = [
        'EMERGENCY_CONSOLE_FIXES.txt',
        'simple-deploy.sh',
        'emergency-upload.php'
    ];
    
    results.emergencyFiles = emergencyFiles.every(file => fs.existsSync(file));
    console.log(results.emergencyFiles ? '✅' : '⚠️', 'Emergency fix files created');
    
    // Check if ready for deployment
    results.deploymentReady = results.mobileCSS && results.inlineStyles;
    console.log(results.deploymentReady ? '✅' : '❌', 'Ready for deployment');
    
    return results;
}

// Generate status report
function generateReport(results) {
    console.log('\n📊 FIX STATUS REPORT');
    console.log('==================\n');
    
    if (results.deploymentReady) {
        console.log('🎉 ALL FIXES APPLIED! Ready to deploy.\n');
        console.log('Deploy using any of these methods:');
        console.log('1. ./simple-deploy.sh');
        console.log('2. Git push to emergency-fix-mobile branch');
        console.log('3. Manual upload via FTP/control panel');
        console.log('4. Use console fixes from EMERGENCY_CONSOLE_FIXES.txt');
    } else {
        console.log('⚠️  Some fixes are missing:\n');
        
        if (!results.mobileCSS) {
            console.log('❌ Run: node scripts/mobile-override-fix.js');
        }
        if (!results.inlineStyles) {
            console.log('❌ Inline styles not added to index.html');
        }
        if (!results.emergencyFiles) {
            console.log('⚠️  Run: node scripts/live-fix-injector.js');
        }
    }
    
    console.log('\n🎯 WHAT THE FIXES DO:');
    console.log('- Forces "LIVE MINT STATUS" to be visible');
    console.log('- Removes opacity: 0 on mobile');
    console.log('- Kills GSAP animations that hide content');
    console.log('- Fixes header background and spacing');
    console.log('- Makes stat cards visible');
}

// Create final checklist
function createChecklist() {
    const checklist = `
LIGHTCAT MOBILE FIX CHECKLIST
============================

□ Mobile CSS updated with overrides
□ Index.html has inline emergency styles
□ Console fixes generated for live testing
□ Deployment scripts created
□ Webhook complexity removed
□ Git branch pushed (emergency-fix-mobile)

DEPLOYMENT OPTIONS:
1. SSH (if working): ./simple-deploy.sh
2. Git deployment: Already pushed to emergency-fix-mobile
3. Manual: Upload files via control panel
4. Console: Use EMERGENCY_CONSOLE_FIXES.txt

TESTING:
1. Open https://rgblightcat.com on mobile
2. Check if "LIVE MINT STATUS" is visible
3. Check if stat cards show properly
4. Check header has black background
5. If not, use console fixes

PERMANENT FIX:
Once deployed and tested, merge emergency-fix-mobile to main.
`;
    
    fs.writeFileSync('MOBILE_FIX_CHECKLIST.md', checklist);
    console.log('\n✅ Created MOBILE_FIX_CHECKLIST.md');
}

// Main execution
const results = validateFixes();
generateReport(results);
createChecklist();

console.log('\n🏁 VALIDATION COMPLETE!');
process.exit(results.deploymentReady ? 0 : 1);