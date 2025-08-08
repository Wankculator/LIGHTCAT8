#!/usr/bin/env node

/**
 * LIVE FIX INJECTOR MCP
 * Injects fixes directly into running site via JavaScript console
 * For when you can't deploy but need immediate fixes
 */

const fs = require('fs');

console.log('💉 LIVE FIX INJECTOR - Emergency Console Fixes');
console.log('===========================================\n');

// Generate console-ready JavaScript fixes
const CONSOLE_FIXES = {
    mobileVisibility: `
// MOBILE VISIBILITY FIX - Paste this in browser console
(function() {
    console.log('🔥 Applying mobile visibility fix...');
    
    // Create emergency style
    const style = document.createElement('style');
    style.id = 'mobile-emergency-fix';
    style.innerHTML = \`
        @media screen and (max-width: 768px) {
            /* Force visibility */
            h1, h2, h3, h4, h5, h6,
            .section-title,
            .mint-status-text,
            .stat-card,
            #stats h2,
            section h2,
            .hero-subtitle {
                opacity: 1 !important;
                visibility: visible !important;
                display: block !important;
                color: #FFD700 !important;
                transform: none !important;
                animation: none !important;
            }
            
            /* Fix header */
            header {
                background: #000 !important;
            }
            
            /* Fix spacing */
            .hero {
                padding-top: 80px !important;
            }
        }
    \`;
    
    // Inject style
    document.head.appendChild(style);
    
    // Force immediate visibility
    document.querySelectorAll('.section-title, h2').forEach(el => {
        el.style.opacity = '1';
        el.style.visibility = 'visible';
    });
    
    console.log('✅ Mobile fix applied!');
})();
`,
    
    gsapKiller: `
// GSAP ANIMATION KILLER - Stop animations hiding content
(function() {
    console.log('🔫 Killing GSAP animations...');
    
    // Kill all GSAP timelines
    if (typeof gsap !== 'undefined') {
        gsap.globalTimeline.clear();
        gsap.killTweensOf("*");
    }
    
    // Force visibility on all elements
    document.querySelectorAll('*').forEach(el => {
        const styles = window.getComputedStyle(el);
        if (styles.opacity === '0' || styles.visibility === 'hidden') {
            el.style.opacity = '1';
            el.style.visibility = 'visible';
        }
    });
    
    console.log('✅ Animations killed!');
})();
`,
    
    emergencyStats: `
// EMERGENCY STATS FIX - Force "LIVE MINT STATUS" visibility
(function() {
    console.log('📊 Fixing LIVE MINT STATUS...');
    
    // Find the stats section
    const statsSection = document.querySelector('#stats');
    if (!statsSection) {
        console.error('Stats section not found!');
        return;
    }
    
    // Find or create the title
    let title = statsSection.querySelector('h2');
    if (!title) {
        title = document.createElement('h2');
        title.className = 'section-title';
        title.textContent = 'LIVE MINT STATUS';
        statsSection.querySelector('.container').prepend(title);
    }
    
    // Force it to be visible
    title.style.cssText = 'opacity: 1 !important; visibility: visible !important; display: block !important; color: #FFD700 !important; font-size: 2rem !important; text-align: center !important; margin-bottom: 2rem !important;';
    
    console.log('✅ LIVE MINT STATUS fixed!');
})();
`,
    
    completeOverhaul: `
// COMPLETE MOBILE OVERHAUL - Nuclear option
(function() {
    console.log('☢️ NUCLEAR MOBILE FIX ENGAGED...');
    
    // 1. Kill all animations
    const styleOverride = document.createElement('style');
    styleOverride.innerHTML = \`
        * {
            animation: none !important;
            transition: none !important;
            opacity: 1 !important;
            visibility: visible !important;
        }
        
        @media (max-width: 768px) {
            body { padding-top: 60px !important; }
            header { position: fixed !important; top: 0 !important; background: #000 !important; }
            .hero { padding-top: 80px !important; min-height: auto !important; }
            .section-title { font-size: 1.8rem !important; }
            .stat-card { padding: 1rem !important; }
        }
    \`;
    document.head.appendChild(styleOverride);
    
    // 2. Fix all hidden elements
    document.querySelectorAll('*').forEach(el => {
        const computed = window.getComputedStyle(el);
        if (computed.opacity === '0') el.style.opacity = '1';
        if (computed.visibility === 'hidden') el.style.visibility = 'visible';
    });
    
    // 3. Ensure critical text is visible
    ['LIVE MINT STATUS', 'LITECAT RGB', 'Game Stats'].forEach(text => {
        const elements = Array.from(document.querySelectorAll('*')).filter(el => 
            el.textContent.includes(text) && el.children.length === 0
        );
        elements.forEach(el => {
            el.style.cssText = 'opacity: 1 !important; visibility: visible !important; color: #FFD700 !important;';
        });
    });
    
    console.log('✅ NUCLEAR FIX COMPLETE! Refresh might be needed.');
})();
`
};

// Create files with console commands
function createConsoleFiles() {
    Object.entries(CONSOLE_FIXES).forEach(([name, code]) => {
        const filename = `console-fix-${name}.js`;
        fs.writeFileSync(filename, code.trim());
        console.log(`✅ Created ${filename}`);
    });
    
    // Create master file
    const masterFile = `
LIGHTCAT EMERGENCY CONSOLE FIXES
================================

Copy and paste these into the browser console on the live site:

1. MOBILE VISIBILITY FIX (try first):
${CONSOLE_FIXES.mobileVisibility}

2. GSAP ANIMATION KILLER (if animations are the issue):
${CONSOLE_FIXES.gsapKiller}

3. EMERGENCY STATS FIX (specific for "LIVE MINT STATUS"):
${CONSOLE_FIXES.emergencyStats}

4. COMPLETE OVERHAUL (nuclear option):
${CONSOLE_FIXES.completeOverhaul}

HOW TO USE:
1. Open rgblightcat.com on mobile
2. Open browser developer tools
3. Go to Console tab
4. Paste the fix code and press Enter
5. Check if issue is resolved

PERMANENT FIX:
Once you identify which fix works, add it to index.html
`;
    
    fs.writeFileSync('EMERGENCY_CONSOLE_FIXES.txt', masterFile);
    console.log('✅ Created EMERGENCY_CONSOLE_FIXES.txt');
}

// Create bookmarklet versions
function createBookmarklets() {
    const bookmarklets = Object.entries(CONSOLE_FIXES).map(([name, code]) => {
        const minified = code.replace(/\/\/.*$/gm, '').replace(/\s+/g, ' ').trim();
        const bookmarklet = `javascript:${encodeURIComponent(minified)}`;
        return { name, bookmarklet };
    });
    
    const bookmarkletFile = `
LIGHTCAT FIX BOOKMARKLETS
========================

Save these as bookmarks and click them on the live site:

${bookmarklets.map(({ name, bookmarklet }) => `
${name.toUpperCase()}:
${bookmarklet}
`).join('\n')}

HOW TO USE:
1. Copy the javascript: link
2. Create a new bookmark
3. Paste as the URL
4. Visit rgblightcat.com
5. Click the bookmark to apply fix
`;
    
    fs.writeFileSync('FIX_BOOKMARKLETS.txt', bookmarkletFile);
    console.log('✅ Created FIX_BOOKMARKLETS.txt');
}

// Main execution
console.log('Creating console fix files...\n');
createConsoleFiles();

console.log('\nCreating bookmarklet versions...\n');
createBookmarklets();

console.log('\n✅ LIVE FIX INJECTOR COMPLETE!\n');
console.log('Next steps:');
console.log('1. Open EMERGENCY_CONSOLE_FIXES.txt');
console.log('2. Copy the appropriate fix');
console.log('3. Paste into browser console on live site');
console.log('4. Or use bookmarklets from FIX_BOOKMARKLETS.txt');
console.log('\nThese fixes work WITHOUT deployment!');