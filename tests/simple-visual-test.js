// Simple visual test for payment modal
console.log('Starting visual test for payment modal...');

const fs = require('fs');
const path = require('path');

// Create screenshots directory
const SCREENSHOTS_DIR = '/root/tests/screenshots';
if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    console.log('Created screenshots directory:', SCREENSHOTS_DIR);
}

// Test configuration
const TEST_URL = 'http://localhost:8082';

async function runTest() {
    try {
        const playwright = require('playwright');
        const browser = await playwright.chromium.launch({
            headless: true
        });
        
        console.log('Browser launched successfully');
        
        const context = await browser.newContext({
            viewport: { width: 375, height: 667 }, // iPhone SE size
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
            isMobile: true,
            hasTouch: true
        });
        
        const page = await context.newPage();
        
        console.log('Navigating to', TEST_URL);
        await page.goto(TEST_URL, { waitUntil: 'networkidle' });
        
        // Take homepage screenshot
        await page.screenshot({ 
            path: path.join(SCREENSHOTS_DIR, 'homepage-mobile.png'),
            fullPage: true 
        });
        console.log('Homepage screenshot taken');
        
        // Look for purchase section
        const purchaseSection = await page.locator('#purchase-section, .purchase-section').first();
        if (await purchaseSection.count() > 0) {
            console.log('Purchase section found');
            await purchaseSection.scrollIntoViewIfNeeded();
            
            // Take purchase section screenshot
            await page.screenshot({ 
                path: path.join(SCREENSHOTS_DIR, 'purchase-section.png'),
                fullPage: true 
            });
            console.log('Purchase section screenshot taken');
        } else {
            console.log('Purchase section not found');
        }
        
        // Look for RGB input
        const rgbInput = await page.locator('input[placeholder*="rgb"], input[name*="rgb"], #rgbInvoice').first();
        if (await rgbInput.count() > 0) {
            console.log('RGB input found');
            await rgbInput.fill('rgb:utxob:testinvoice123');
            
            // Take screenshot with filled input
            await page.screenshot({ 
                path: path.join(SCREENSHOTS_DIR, 'rgb-input-filled.png'),
                fullPage: true 
            });
            console.log('RGB input filled screenshot taken');
            
            // Look for create button
            const createButton = await page.locator('button:has-text("Create"), button:has-text("Lightning"), button:has-text("Invoice")').first();
            if (await createButton.count() > 0) {
                console.log('Create button found, clicking...');
                await createButton.click();
                
                // Wait for modal
                await page.waitForTimeout(3000);
                
                // Check for modals
                const newModal = await page.locator('#paymentModalPro, .payment-modal-overlay').first();
                const oldModal = await page.locator('#paymentModal').first();
                
                if (await newModal.count() > 0 && await newModal.isVisible()) {
                    console.log('✅ New professional modal found!');
                    await page.screenshot({ 
                        path: path.join(SCREENSHOTS_DIR, 'new-modal.png'),
                        fullPage: true 
                    });
                } else if (await oldModal.count() > 0 && await oldModal.isVisible()) {
                    console.log('⚠️ Old modal still showing');
                    await page.screenshot({ 
                        path: path.join(SCREENSHOTS_DIR, 'old-modal.png'),
                        fullPage: true 
                    });
                } else {
                    console.log('❌ No modal found');
                    await page.screenshot({ 
                        path: path.join(SCREENSHOTS_DIR, 'no-modal.png'),
                        fullPage: true 
                    });
                }
                
                // Look for QR code
                const qrCode = await page.locator('#qrcode, #paymentQRCode, canvas').first();
                if (await qrCode.count() > 0) {
                    console.log('QR code found');
                    const qrBox = await qrCode.boundingBox();
                    if (qrBox) {
                        console.log('QR position:', qrBox.x, qrBox.y);
                        console.log('QR size:', qrBox.width, qrBox.height);
                        
                        if (qrBox.y < 0) {
                            console.log('⚠️ QR code is cut off at top!');
                        }
                    }
                } else {
                    console.log('❌ QR code not found');
                }
                
            } else {
                console.log('❌ Create button not found');
            }
        } else {
            console.log('❌ RGB input not found');
        }
        
        await browser.close();
        console.log('✅ Test completed successfully!');
        console.log('Screenshots saved to:', SCREENSHOTS_DIR);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

runTest();