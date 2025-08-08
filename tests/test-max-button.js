const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testMaxButton() {
    const browser = await chromium.launch({ headless: true });
    
    try {
        // Test both desktop and mobile viewports
        const viewports = [
            { name: 'desktop', width: 1920, height: 1080 },
            { name: 'mobile', width: 375, height: 667 }
        ];

        for (const viewport of viewports) {
            console.log(`\n=== Testing ${viewport.name.toUpperCase()} (${viewport.width}x${viewport.height}) ===`);
            
            const context = await browser.newContext({
                viewport: { width: viewport.width, height: viewport.height }
            });
            
            const page = await context.newPage();
            
            try {
                // Navigate to the site
                console.log('Navigating to https://rgblightcat.com...');
                await page.goto('https://rgblightcat.com', { waitUntil: 'networkidle' });
                
                // Wait for the page to load and look for purchase section
                await page.waitForTimeout(2000);
                
                // Look for batch quantity controls (+ - MAX buttons)
                const batchControls = page.locator('.batch-controls, .quantity-controls, [data-testid="batch-controls"]');
                
                // If not found, try to find buttons by their likely selectors
                let plusButton, minusButton, maxButton;
                
                // Try different selectors for the buttons
                const selectors = [
                    { plus: 'button:has-text("+")', minus: 'button:has-text("-")', max: 'button:has-text("MAX")' },
                    { plus: '.plus-btn, .increment-btn', minus: '.minus-btn, .decrement-btn', max: '.max-btn' },
                    { plus: '[data-action="increment"]', minus: '[data-action="decrement"]', max: '[data-action="max"]' }
                ];
                
                for (const selectorSet of selectors) {
                    try {
                        plusButton = page.locator(selectorSet.plus).first();
                        minusButton = page.locator(selectorSet.minus).first();
                        maxButton = page.locator(selectorSet.max).first();
                        
                        // Check if all three buttons exist
                        if (await plusButton.count() > 0 && await minusButton.count() > 0 && await maxButton.count() > 0) {
                            console.log(`Found buttons using selectors: ${JSON.stringify(selectorSet)}`);
                            break;
                        }
                    } catch (e) {
                        continue;
                    }
                }
                
                // If still not found, scroll and look for purchase section
                if (!plusButton || await plusButton.count() === 0) {
                    console.log('Buttons not immediately visible, looking for purchase section...');
                    
                    // Try to find and scroll to purchase section
                    const purchaseSection = page.locator('section:has-text("Purchase"), .purchase-section, #purchase');
                    if (await purchaseSection.count() > 0) {
                        console.log('Found purchase section, scrolling to it...');
                        await purchaseSection.scrollIntoViewIfNeeded();
                        await page.waitForTimeout(1000);
                    }
                    
                    // Try again after scrolling
                    for (const selectorSet of selectors) {
                        try {
                            plusButton = page.locator(selectorSet.plus).first();
                            minusButton = page.locator(selectorSet.minus).first();
                            maxButton = page.locator(selectorSet.max).first();
                            
                            if (await plusButton.count() > 0 && await minusButton.count() > 0 && await maxButton.count() > 0) {
                                console.log(`Found buttons after scrolling using: ${JSON.stringify(selectorSet)}`);
                                break;
                            }
                        } catch (e) {
                            continue;
                        }
                    }
                }
                
                // Take screenshot of the current view
                const screenshotPath = `/root/screenshot-${viewport.name}-full.png`;
                await page.screenshot({ path: screenshotPath, fullPage: true });
                console.log(`Full page screenshot saved: ${screenshotPath}`);
                
                if (!plusButton || await plusButton.count() === 0) {
                    console.log('❌ Could not find the quantity control buttons on the page');
                    
                    // Let's see what's actually on the page
                    const allButtons = await page.locator('button').all();
                    console.log(`Found ${allButtons.length} buttons on the page:`);
                    for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
                        const buttonText = await allButtons[i].textContent();
                        console.log(`  Button ${i + 1}: "${buttonText}"`);
                    }
                    
                    continue;
                }
                
                console.log('✅ Found all three buttons (+, -, MAX)');
                
                // Scroll to the buttons to ensure they're visible
                await maxButton.scrollIntoViewIfNeeded();
                await page.waitForTimeout(500);
                
                // Take screenshot focused on the buttons area
                const buttonsBbox = await maxButton.boundingBox();
                if (buttonsBbox) {
                    const focusedScreenshotPath = `/root/screenshot-${viewport.name}-buttons.png`;
                    await page.screenshot({
                        path: focusedScreenshotPath,
                        clip: {
                            x: Math.max(0, buttonsBbox.x - 50),
                            y: Math.max(0, buttonsBbox.y - 50),
                            width: Math.min(viewport.width, 300),
                            height: Math.min(viewport.height, 200)
                        }
                    });
                    console.log(`Button area screenshot saved: ${focusedScreenshotPath}`);
                }
                
                // Get computed styles for all three buttons
                const buttons = [
                    { name: 'Plus (+)', element: plusButton },
                    { name: 'Minus (-)', element: minusButton },
                    { name: 'MAX', element: maxButton }
                ];
                
                console.log('\n--- COMPUTED STYLES ANALYSIS ---');
                
                const buttonStyles = {};
                
                for (const button of buttons) {
                    console.log(`\n${button.name} Button:`);
                    
                    const styles = await button.element.evaluate((el) => {
                        const computed = window.getComputedStyle(el);
                        return {
                            width: computed.width,
                            height: computed.height,
                            borderRadius: computed.borderRadius,
                            border: computed.border,
                            borderWidth: computed.borderWidth,
                            borderStyle: computed.borderStyle,
                            borderColor: computed.borderColor,
                            backgroundColor: computed.backgroundColor,
                            color: computed.color,
                            fontSize: computed.fontSize,
                            fontWeight: computed.fontWeight,
                            display: computed.display,
                            justifyContent: computed.justifyContent,
                            alignItems: computed.alignItems,
                            textAlign: computed.textAlign,
                            padding: computed.padding,
                            margin: computed.margin,
                            minWidth: computed.minWidth,
                            minHeight: computed.minHeight
                        };
                    });
                    
                    buttonStyles[button.name] = styles;
                    
                    // Display key properties
                    console.log(`  Width: ${styles.width}`);
                    console.log(`  Height: ${styles.height}`);
                    console.log(`  Border Radius: ${styles.borderRadius}`);
                    console.log(`  Border: ${styles.border}`);
                    console.log(`  Background: ${styles.backgroundColor}`);
                    console.log(`  Text Align: ${styles.textAlign}`);
                    console.log(`  Display: ${styles.display}`);
                    console.log(`  Justify Content: ${styles.justifyContent}`);
                    console.log(`  Align Items: ${styles.alignItems}`);
                }
                
                // Analyze consistency
                console.log('\n--- CONSISTENCY ANALYSIS ---');
                
                const plusStyles = buttonStyles['Plus (+)'];
                const minusStyles = buttonStyles['Minus (-)'];
                const maxStyles = buttonStyles['MAX'];
                
                // Check if MAX button has same circular frame (border-radius: 50%)
                const isMaxCircular = maxStyles.borderRadius === '50%' || 
                                    maxStyles.borderRadius.includes('50%') ||
                                    (parseFloat(maxStyles.borderRadius) >= Math.min(parseFloat(maxStyles.width), parseFloat(maxStyles.height)) / 2);
                
                const isPlusCircular = plusStyles.borderRadius === '50%' || 
                                     plusStyles.borderRadius.includes('50%') ||
                                     (parseFloat(plusStyles.borderRadius) >= Math.min(parseFloat(plusStyles.width), parseFloat(plusStyles.height)) / 2);
                
                const isMinusCircular = minusStyles.borderRadius === '50%' || 
                                      minusStyles.borderRadius.includes('50%') ||
                                      (parseFloat(minusStyles.borderRadius) >= Math.min(parseFloat(minusStyles.width), parseFloat(minusStyles.height)) / 2);
                
                console.log(`✓ Plus button circular: ${isPlusCircular} (border-radius: ${plusStyles.borderRadius})`);
                console.log(`✓ Minus button circular: ${isMinusCircular} (border-radius: ${minusStyles.borderRadius})`);
                console.log(`${isMaxCircular ? '✅' : '❌'} MAX button circular: ${isMaxCircular} (border-radius: ${maxStyles.borderRadius})`);
                
                // Check size consistency
                const sizeConsistent = (plusStyles.width === minusStyles.width && 
                                      minusStyles.width === maxStyles.width &&
                                      plusStyles.height === minusStyles.height && 
                                      minusStyles.height === maxStyles.height);
                
                console.log(`${sizeConsistent ? '✅' : '❌'} Size consistency: ${sizeConsistent}`);
                console.log(`  Plus: ${plusStyles.width} x ${plusStyles.height}`);
                console.log(`  Minus: ${minusStyles.width} x ${minusStyles.height}`);
                console.log(`  MAX: ${maxStyles.width} x ${maxStyles.height}`);
                
                // Check if MAX text is centered
                const isMaxCentered = (maxStyles.textAlign === 'center' || 
                                     (maxStyles.display === 'flex' && 
                                      maxStyles.justifyContent === 'center' && 
                                      maxStyles.alignItems === 'center'));
                
                console.log(`${isMaxCentered ? '✅' : '❌'} MAX text centered: ${isMaxCentered}`);
                console.log(`  Text align: ${maxStyles.textAlign}`);
                console.log(`  Flex centering: justify-content: ${maxStyles.justifyContent}, align-items: ${maxStyles.alignItems}`);
                
                // Overall assessment
                const allTestsPassed = isMaxCircular && sizeConsistent && isMaxCentered;
                console.log(`\n${allTestsPassed ? '🎉 ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED'} for ${viewport.name}`);
                
            } catch (error) {
                console.error(`Error testing ${viewport.name}:`, error);
            }
            
            await context.close();
        }
        
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await browser.close();
    }
}

// Run the test
console.log('Starting MAX button test...');
testMaxButton().then(() => {
    console.log('Test completed.');
}).catch((error) => {
    console.error('Test error:', error);
});