#!/usr/bin/env node

/**
 * MOBILE OVERRIDE FIX MCP
 * Forces mobile styles to work by injecting critical CSS
 */

const fs = require('fs');
const path = require('path');
// No chalk - keep it simple

console.log('🔥 MOBILE OVERRIDE FIX - EMERGENCY MODE');
console.log('=====================================\n');

// Critical mobile CSS that MUST work
const CRITICAL_MOBILE_CSS = `
/* MOBILE OVERRIDE - MAXIMUM PRIORITY */
@media screen and (max-width: 768px) {
    /* Force ALL text to be visible */
    * {
        opacity: 1 !important;
        visibility: visible !important;
    }
    
    /* Specific fixes for problem elements */
    h1, h2, h3, h4, h5, h6,
    .section-title,
    .mint-status-text,
    .stat-card,
    .stat-card h3,
    .stat-card p,
    #stats h2,
    #stats .section-title,
    section h2,
    section .section-title,
    .hero-subtitle,
    .progress-bar,
    .progress-fill,
    .progress-text {
        opacity: 1 !important;
        visibility: visible !important;
        display: block !important;
        transform: none !important;
        animation: none !important;
        color: inherit !important;
    }
    
    /* Fix LIVE MINT STATUS specifically */
    #stats > .container > h2:first-of-type,
    #stats > .container > .section-title,
    h2:contains("LIVE MINT STATUS") {
        opacity: 1 !important;
        visibility: visible !important;
        display: block !important;
        color: #FFD700 !important;
        font-size: 2rem !important;
        margin-bottom: 2rem !important;
        text-align: center !important;
    }
    
    /* Fix header */
    header {
        background: #000 !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        z-index: 9999 !important;
    }
    
    /* Fix hero spacing */
    .hero {
        padding-top: 80px !important;
        min-height: auto !important;
    }
    
    /* Fix stat cards */
    .stat-card {
        background: rgba(255, 215, 0, 0.1) !important;
        border: 1px solid #FFD700 !important;
        padding: 1.5rem !important;
        margin-bottom: 1rem !important;
    }
    
    /* Nuclear option - remove ALL animations on mobile */
    *, *::before, *::after {
        animation: none !important;
        transition: none !important;
    }
}

/* Ultra-specific selectors to override everything */
body #stats h2.section-title,
body #stats .section-title,
body section#stats h2,
body section#stats .container h2 {
    opacity: 1 !important;
    visibility: visible !important;
}
`;

// Files to update
const filesToUpdate = [
    {
        path: 'client/css/mobile-optimized.css',
        action: 'prepend',
        content: CRITICAL_MOBILE_CSS
    },
    {
        path: 'client/index.html',
        action: 'inject-head',
        content: `<style id="mobile-emergency-override">${CRITICAL_MOBILE_CSS}</style>`
    }
];

// Function to update files
function updateFile(fileInfo) {
    const filePath = path.join(process.cwd(), fileInfo.path);
    
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  File not found: ${fileInfo.path}`);
            return false;
        }
        
        let content = fs.readFileSync(filePath, 'utf8');
        
        switch (fileInfo.action) {
            case 'prepend':
                // Add to beginning of file
                content = fileInfo.content + '\n\n' + content;
                break;
                
            case 'inject-head':
                // Inject into <head> section
                if (content.includes('id="mobile-emergency-override"')) {
                    console.log(`ℹ️  Override already exists in ${fileInfo.path}`);
                    return true;
                }
                content = content.replace('</head>', `${fileInfo.content}\n</head>`);
                break;
        }
        
        // Backup original
        fs.writeFileSync(filePath + '.backup', fs.readFileSync(filePath));
        
        // Write updated content
        fs.writeFileSync(filePath, content);
        
        console.log(`✅ Updated ${fileInfo.path}`);
        return true;
        
    } catch (error) {
        console.log(`❌ Failed to update ${fileInfo.path}: ${error.message}`);
        return false;
    }
}

// Function to create standalone fix file
function createStandaloneFix() {
    const fixContent = `<!DOCTYPE html>
<html>
<head>
    <title>Mobile CSS Fix Test</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { background: #000; color: #fff; font-family: Arial; padding: 20px; }
        .test-element { opacity: 0; visibility: hidden; }
    </style>
    <style id="mobile-fix">
        ${CRITICAL_MOBILE_CSS}
    </style>
</head>
<body>
    <h1>Mobile Fix Test Page</h1>
    <h2 class="section-title test-element">LIVE MINT STATUS</h2>
    <p>If you can see "LIVE MINT STATUS" above, the fix is working!</p>
    <div class="stat-card test-element">
        <h3>Test Stat Card</h3>
        <p>This should be visible on mobile</p>
    </div>
</body>
</html>`;
    
    fs.writeFileSync('mobile-fix-test.html', fixContent);
    console.log('✅ Created mobile-fix-test.html for testing');
}

// Function to verify current issues
function verifyIssues() {
    console.log('\n🔍 Checking for known issues...\n');
    
    const indexPath = path.join(process.cwd(), 'client/index.html');
    if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath, 'utf8');
        
        // Check for problematic patterns
        const issues = [];
        
        if (content.includes('opacity: 0') && !content.includes('@media')) {
            issues.push('Found opacity: 0 without media query protection');
        }
        
        if (content.includes('animation:') && content.includes('fadeIn')) {
            issues.push('Fade-in animations may hide content initially');
        }
        
        if (!content.includes('mobile-optimized.css')) {
            issues.push('Mobile CSS file not linked in index.html');
        }
        
        if (issues.length > 0) {
            console.log('Found issues:');
            issues.forEach(issue => console.log(`  - ${issue}`));
        } else {
            console.log('✅ No obvious issues found');
        }
    }
}

// Main execution
console.log('1️⃣  Verifying current issues...');
verifyIssues();

console.log('\n2️⃣  Applying mobile override fixes...');
let successCount = 0;
filesToUpdate.forEach(fileInfo => {
    if (updateFile(fileInfo)) {
        successCount++;
    }
});

console.log('\n3️⃣  Creating test file...');
createStandaloneFix();

console.log('\n4️⃣  Creating inline fix for immediate use...');
const inlineFixPath = 'MOBILE_FIX_INLINE.txt';
fs.writeFileSync(inlineFixPath, `
COPY AND PASTE THIS INTO YOUR INDEX.HTML <head> SECTION:
=========================================================

${`<style id="mobile-emergency-override">${CRITICAL_MOBILE_CSS}</style>`}

=========================================================
END OF FIX
`);

// Summary
console.log('\n✅ MOBILE OVERRIDE COMPLETE!\n');
console.log('Next steps:');
console.log('1. Deploy the updated files using emergency-deploy.sh');
console.log('2. Or copy content from MOBILE_FIX_INLINE.txt to index.html');
console.log('3. Test on actual mobile device');
console.log('4. Check mobile-fix-test.html locally first');

if (successCount < filesToUpdate.length) {
    console.log('\n⚠️  Some files could not be updated automatically.');
    console.log('Use MOBILE_FIX_INLINE.txt for manual fix.');
}