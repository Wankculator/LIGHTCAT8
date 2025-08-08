const { chromium } = require('playwright');

(async () => {
    console.log('🔍 Starting RGB Light Cat site analysis...\n');
    
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    
    const page = await context.newPage();
    
    // Collect console messages
    const consoleLogs = [];
    page.on('console', msg => {
        consoleLogs.push({
            type: msg.type(),
            text: msg.text()
        });
    });
    
    // Collect errors
    const errors = [];
    page.on('pageerror', error => {
        errors.push(error.toString());
    });
    
    try {
        console.log('📡 Navigating to https://rgblightcat.com...');
        await page.goto('https://rgblightcat.com', { 
            waitUntil: 'networkidle',
            timeout: 30000 
        });
        
        console.log('✅ Page loaded successfully\n');
        
        // Check for lightning canvas
        console.log('⚡ LIGHTNING EFFECT CHECK:');
        const lightningCanvas = await page.$('#lightning-canvas');
        if (lightningCanvas) {
            const isVisible = await lightningCanvas.isVisible();
            const boundingBox = await lightningCanvas.boundingBox();
            const styles = await lightningCanvas.evaluate(el => {
                const computed = window.getComputedStyle(el);
                return {
                    position: computed.position,
                    zIndex: computed.zIndex,
                    opacity: computed.opacity,
                    display: computed.display,
                    visibility: computed.visibility,
                    width: computed.width,
                    height: computed.height
                };
            });
            
            console.log('  Canvas found:', isVisible ? '✅ VISIBLE' : '❌ NOT VISIBLE');
            console.log('  Dimensions:', boundingBox ? `${boundingBox.width}x${boundingBox.height}` : 'N/A');
            console.log('  Styles:', JSON.stringify(styles, null, 2));
            
            // Check if canvas is actually drawing
            const hasContent = await page.evaluate(() => {
                const canvas = document.getElementById('lightning-canvas');
                if (!canvas) return false;
                const ctx = canvas.getContext('2d');
                const imageData = ctx.getImageData(0, 0, 100, 100);
                return Array.from(imageData.data).some(pixel => pixel > 0);
            });
            console.log('  Canvas has content:', hasContent ? '✅ YES' : '❌ NO');
        } else {
            console.log('  ❌ Lightning canvas NOT FOUND');
        }
        
        // Check for duplicate tier messages
        console.log('\n🏆 TIER MESSAGE CHECK:');
        const tierMessages = await page.$$eval('*', elements => {
            const messages = [];
            elements.forEach(el => {
                const text = el.textContent || '';
                if (text.includes('TIER UNLOCKED') || 
                    text.includes('🥇') || 
                    text.includes('🥈') || 
                    text.includes('🥉')) {
                    messages.push({
                        tag: el.tagName,
                        id: el.id,
                        class: el.className,
                        text: text.substring(0, 100),
                        visible: window.getComputedStyle(el).display !== 'none'
                    });
                }
            });
            return messages;
        });
        
        if (tierMessages.length > 0) {
            console.log('  Found tier-related elements:');
            tierMessages.forEach((msg, i) => {
                console.log(`  ${i+1}. ${msg.tag}${msg.id ? '#' + msg.id : ''}${msg.class ? '.' + msg.class : ''}`);
                console.log(`     Text: "${msg.text}"`);
                console.log(`     Visible: ${msg.visible ? 'YES' : 'NO'}`);
            });
        } else {
            console.log('  ✅ No tier messages currently visible');
        }
        
        // Check for console errors
        console.log('\n🔴 CONSOLE ERRORS:');
        const jsErrors = consoleLogs.filter(log => log.type === 'error');
        if (jsErrors.length > 0) {
            jsErrors.forEach((err, i) => {
                console.log(`  ${i+1}. ${err.text}`);
            });
        } else {
            console.log('  ✅ No JavaScript errors detected');
        }
        
        // Check for lightning-related console logs
        console.log('\n⚡ LIGHTNING-RELATED LOGS:');
        const lightningLogs = consoleLogs.filter(log => 
            log.text.includes('Lightning') || 
            log.text.includes('⚡') ||
            log.text.includes('lightning')
        );
        if (lightningLogs.length > 0) {
            lightningLogs.forEach((log, i) => {
                console.log(`  ${i+1}. [${log.type}] ${log.text}`);
            });
        } else {
            console.log('  ❌ No lightning-related console logs found');
        }
        
        // Check CSS files loaded
        console.log('\n🎨 CSS FILES CHECK:');
        const cssFiles = await page.$$eval('link[rel="stylesheet"]', links => 
            links.map(link => link.href)
        );
        const hasLightningCSS = cssFiles.some(css => css.includes('lightning-background.css'));
        console.log('  Lightning CSS loaded:', hasLightningCSS ? '✅ YES' : '❌ NO');
        
        // Check JS files loaded
        console.log('\n📜 JS FILES CHECK:');
        const jsFiles = await page.$$eval('script[src]', scripts => 
            scripts.map(script => script.src)
        );
        const hasLightningJS = jsFiles.some(js => js.includes('lightning-background.js'));
        console.log('  Lightning JS loaded:', hasLightningJS ? '✅ YES' : '❌ NO');
        
        // Take screenshot for analysis
        await page.screenshot({ 
            path: '/tmp/rgblightcat-screenshot.png',
            fullPage: false 
        });
        console.log('\n📸 Screenshot saved to /tmp/rgblightcat-screenshot.png');
        
        // Mobile view test
        console.log('\n📱 MOBILE VIEW TEST:');
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(2000);
        
        const mobileIssues = await page.evaluate(() => {
            const issues = [];
            
            // Check for double scrollbars
            if (document.body.scrollHeight > window.innerHeight && 
                document.documentElement.scrollHeight > window.innerHeight) {
                issues.push('Potential double scrollbar detected');
            }
            
            // Check for accessibility text
            const skipLink = document.querySelector('[href="#main-content"]');
            if (skipLink && window.getComputedStyle(skipLink).display !== 'none') {
                issues.push('Skip to main content link is visible');
            }
            
            return issues;
        });
        
        if (mobileIssues.length > 0) {
            console.log('  Issues found:');
            mobileIssues.forEach(issue => console.log(`  - ${issue}`));
        } else {
            console.log('  ✅ No mobile view issues detected');
        }
        
        await page.screenshot({ 
            path: '/tmp/rgblightcat-mobile.png',
            fullPage: false 
        });
        console.log('  📸 Mobile screenshot saved to /tmp/rgblightcat-mobile.png');
        
    } catch (error) {
        console.error('❌ Error during testing:', error.message);
    } finally {
        await browser.close();
        
        console.log('\n' + '='.repeat(60));
        console.log('🎯 SUMMARY:');
        console.log('='.repeat(60));
        
        if (errors.length > 0) {
            console.log(`❌ ${errors.length} page errors detected`);
        }
        
        const hasLightningIssue = !consoleLogs.some(log => 
            log.text.includes('Lightning background ACTIVE')
        );
        
        if (hasLightningIssue) {
            console.log('❌ Lightning effect may not be working properly');
            console.log('   - Check if lightning-background.js has escaped characters');
            console.log('   - Verify CSS z-index and opacity settings');
        } else {
            console.log('✅ Lightning effect appears to be initialized');
        }
        
        console.log('\n📋 NEXT STEPS:');
        console.log('1. Review screenshots in /tmp/');
        console.log('2. Check console logs above for specific errors');
        console.log('3. Deploy fixes if CSS/JS files are missing');
    }
})();