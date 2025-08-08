const { chromium } = require('playwright');

(async () => {
    console.log('🚀 Starting MAX button test for rgblightcat.com');
    
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const viewports = [
        { name: 'desktop', width: 1920, height: 1080 },
        { name: 'mobile', width: 375, height: 667 }
    ];
    
    for (const viewport of viewports) {
        console.log(`\n📱 Testing ${viewport.name.toUpperCase()} viewport (${viewport.width}x${viewport.height})`);
        
        const context = await browser.newContext({
            viewport: { width: viewport.width, height: viewport.height },
            userAgent: viewport.name === 'mobile' ? 
                'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15' : 
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        });
        
        const page = await context.newPage();
        
        try {
            console.log('📍 Navigating to https://rgblightcat.com...');
            await page.goto('https://rgblightcat.com', { 
                waitUntil: 'networkidle',
                timeout: 30000 
            });
            
            // Take initial screenshot
            await page.screenshot({ 
                path: `/root/rgblightcat-${viewport.name}-full.png`, 
                fullPage: true 
            });
            console.log(`📸 Full page screenshot saved: rgblightcat-${viewport.name}-full.png`);
            
            // Wait and scroll a bit to load dynamic content
            await page.waitForTimeout(3000);
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
            await page.waitForTimeout(1000);
            
            // Look for buttons with different strategies
            console.log('🔍 Searching for quantity control buttons...');
            
            let foundButtons = false;
            let plusBtn, minusBtn, maxBtn;
            
            // Strategy 1: Look for buttons with specific text
            try {
                const allButtons = await page.locator('button').all();
                console.log(`Found ${allButtons.length} total buttons on page`);
                
                for (const btn of allButtons) {
                    const text = await btn.textContent();
                    const trimmedText = text?.trim();
                    console.log(`Button text: "${trimmedText}"`);
                    
                    if (trimmedText === '+') plusBtn = btn;
                    else if (trimmedText === '-') minusBtn = btn;
                    else if (trimmedText === 'MAX') maxBtn = btn;
                }
                
                if (plusBtn && minusBtn && maxBtn) {
                    foundButtons = true;
                    console.log('✅ Found all three buttons (+, -, MAX) using text search');
                }
            } catch (e) {
                console.log('❌ Text search failed:', e.message);
            }
            
            // Strategy 2: Look for common class patterns
            if (!foundButtons) {
                try {
                    plusBtn = page.locator('.increment, .plus, .add, [data-action="increment"]').first();
                    minusBtn = page.locator('.decrement, .minus, .subtract, [data-action="decrement"]').first();
                    maxBtn = page.locator('.max, [data-action="max"]').first();
                    
                    if (await plusBtn.count() > 0 && await minusBtn.count() > 0 && await maxBtn.count() > 0) {
                        foundButtons = true;
                        console.log('✅ Found buttons using class patterns');
                    }
                } catch (e) {
                    console.log('❌ Class pattern search failed:', e.message);
                }
            }
            
            if (!foundButtons) {
                console.log('❌ Could not locate the quantity control buttons');
                console.log('📝 Available button texts on page:');
                
                const allButtons = await page.locator('button').all();
                for (let i = 0; i < Math.min(allButtons.length, 15); i++) {
                    try {
                        const text = await allButtons[i].textContent();
                        const isVisible = await allButtons[i].isVisible();
                        console.log(`  ${i + 1}. "${text?.trim()}" (visible: ${isVisible})`);
                    } catch (e) {
                        console.log(`  ${i + 1}. [Error reading button]`);
                    }
                }
                
                await context.close();
                continue;
            }
            
            // Scroll to buttons and take focused screenshot
            await maxBtn.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);
            
            const buttonBox = await maxBtn.boundingBox();
            if (buttonBox) {
                await page.screenshot({
                    path: `/root/rgblightcat-${viewport.name}-buttons.png`,
                    clip: {
                        x: Math.max(0, buttonBox.x - 50),
                        y: Math.max(0, buttonBox.y - 30),
                        width: 250,
                        height: 100
                    }
                });
                console.log(`📸 Button area screenshot saved: rgblightcat-${viewport.name}-buttons.png`);
            }
            
            // Analyze button styles
            console.log('\n🎨 ANALYZING BUTTON STYLES:');
            
            const buttons = [
                { name: 'Plus (+)', locator: plusBtn },
                { name: 'Minus (-)', locator: minusBtn },
                { name: 'MAX', locator: maxBtn }
            ];
            
            const buttonData = {};
            
            for (const button of buttons) {
                console.log(`\n🔍 ${button.name}:`);
                
                const styles = await button.locator.evaluate((el) => {
                    const computed = window.getComputedStyle(el);
                    return {
                        width: computed.width,
                        height: computed.height,
                        borderRadius: computed.borderRadius,
                        border: computed.border,
                        backgroundColor: computed.backgroundColor,
                        color: computed.color,
                        fontSize: computed.fontSize,
                        textAlign: computed.textAlign,
                        display: computed.display,
                        justifyContent: computed.justifyContent,
                        alignItems: computed.alignItems,
                        padding: computed.padding,
                        minWidth: computed.minWidth,
                        minHeight: computed.minHeight
                    };
                });
                
                buttonData[button.name] = styles;
                
                console.log(`  📏 Size: ${styles.width} × ${styles.height}`);
                console.log(`  🔘 Border Radius: ${styles.borderRadius}`);
                console.log(`  🎨 Background: ${styles.backgroundColor}`);
                console.log(`  📝 Text Align: ${styles.textAlign}`);
                console.log(`  📦 Display: ${styles.display}`);
                if (styles.display === 'flex') {
                    console.log(`  🎯 Justify: ${styles.justifyContent}, Align: ${styles.alignItems}`);
                }
            }
            
            // Consistency Analysis
            console.log('\n📊 CONSISTENCY ANALYSIS:');
            
            const plus = buttonData['Plus (+)'];
            const minus = buttonData['Minus (-)'];
            const max = buttonData['MAX'];
            
            // 1. Check circular frame (border-radius: 50%)
            const checkCircular = (styles) => {
                return styles.borderRadius === '50%' || 
                       styles.borderRadius.includes('50%') ||
                       styles.borderRadius === '50px' || // might be pixel value
                       (parseFloat(styles.borderRadius) >= parseFloat(styles.width) / 2);
            };
            
            const plusCircular = checkCircular(plus);
            const minusCircular = checkCircular(minus);
            const maxCircular = checkCircular(max);
            
            console.log(`🔘 Plus button circular: ${plusCircular ? '✅' : '❌'} (${plus.borderRadius})`);
            console.log(`🔘 Minus button circular: ${minusCircular ? '✅' : '❌'} (${minus.borderRadius})`);
            console.log(`🔘 MAX button circular: ${maxCircular ? '✅' : '❌'} (${max.borderRadius})`);
            
            // 2. Check size consistency
            const sameWidth = plus.width === minus.width && minus.width === max.width;
            const sameHeight = plus.height === minus.height && minus.height === max.height;
            const sizeConsistent = sameWidth && sameHeight;
            
            console.log(`📏 Size consistency: ${sizeConsistent ? '✅' : '❌'}`);
            console.log(`   Plus: ${plus.width} × ${plus.height}`);
            console.log(`   Minus: ${minus.width} × ${minus.height}`);
            console.log(`   MAX: ${max.width} × ${max.height}`);
            
            // 3. Check MAX text centering
            const maxCentered = max.textAlign === 'center' || 
                              (max.display === 'flex' && 
                               max.justifyContent === 'center' && 
                               max.alignItems === 'center');
            
            console.log(`🎯 MAX text centered: ${maxCentered ? '✅' : '❌'}`);
            console.log(`   Text align: ${max.textAlign}`);
            if (max.display === 'flex') {
                console.log(`   Flex centering: justify-content: ${max.justifyContent}, align-items: ${max.alignItems}`);
            }
            
            // Final verdict
            const allPassed = maxCircular && sizeConsistent && maxCentered;
            console.log(`\n🏆 FINAL VERDICT for ${viewport.name}: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
            
        } catch (error) {
            console.error(`❌ Error testing ${viewport.name}:`, error.message);
        }
        
        await context.close();
    }
    
    await browser.close();
    console.log('\n✨ Testing complete!');
})();