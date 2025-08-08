const { chromium } = require('playwright');

async function testInvoiceFlow() {
    console.log('🎭 Starting Playwright test of LIGHTCAT invoice flow...\n');
    
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true,
        slowMo: 500 // Slow down for visibility
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    // Capture console logs
    const consoleLogs = [];
    page.on('console', msg => {
        const text = msg.text();
        consoleLogs.push(text);
        
        // Log important messages
        if (text.includes('DIRECT SUBMIT') || 
            text.includes('Invoice') || 
            text.includes('✅') || 
            text.includes('❌') ||
            text.includes('📤') ||
            text.includes('📥')) {
            console.log('🖥️ Console:', text);
        }
    });
    
    // Capture network requests
    page.on('request', request => {
        if (request.url().includes('/api/rgb/invoice')) {
            console.log('🌐 Invoice API Request:', request.method());
            console.log('   Body:', request.postData());
        }
    });
    
    page.on('response', response => {
        if (response.url().includes('/api/rgb/invoice')) {
            console.log('📥 Invoice API Response:', response.status());
        }
    });
    
    try {
        // Step 1: Go to the site
        console.log('📍 Step 1: Loading rgblightcat.com...');
        await page.goto('https://rgblightcat.com', { 
            waitUntil: 'networkidle',
            timeout: 30000 
        });
        console.log('✅ Site loaded\n');
        
        // Step 2: Set tier in localStorage to bypass game
        console.log('📍 Step 2: Setting tier directly in localStorage...');
        await page.evaluate(() => {
            localStorage.setItem('unlockedTier', 'bronze');
            localStorage.setItem('lastGameScore', '15');
            localStorage.setItem('gameSessionId', 'test-' + Date.now());
            window.unlockedTier = 'bronze';
            console.log('Tier set to bronze');
        });
        console.log('✅ Tier unlocked\n');
        
        // Step 3: Scroll to purchase section
        console.log('📍 Step 3: Scrolling to purchase section...');
        await page.evaluate(() => {
            const purchaseSection = document.querySelector('#purchase');
            if (purchaseSection) {
                purchaseSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
        await page.waitForTimeout(1000);
        
        // Step 4: Check if form is visible
        console.log('📍 Step 4: Checking purchase form visibility...');
        const formVisible = await page.evaluate(() => {
            const form = document.getElementById('purchaseForm');
            if (!form) return 'NOT_FOUND';
            const display = window.getComputedStyle(form).display;
            return display !== 'none' ? 'VISIBLE' : 'HIDDEN';
        });
        console.log(`   Form status: ${formVisible}`);
        
        if (formVisible === 'HIDDEN') {
            console.log('   Attempting to show form...');
            await page.evaluate(() => {
                const form = document.getElementById('purchaseForm');
                if (form) {
                    form.style.display = 'block';
                    form.style.opacity = '1';
                }
                // Remove any lock messages
                const lockMsg = document.querySelector('.mint-lock-message');
                if (lockMsg) lockMsg.remove();
            });
        }
        
        // Step 5: Fill in RGB invoice
        console.log('\n📍 Step 5: Filling RGB invoice...');
        const rgbInput = await page.$('#rgbInvoice');
        if (rgbInput) {
            // Use the Iris wallet format
            const testInvoice = 'rgb:~/~/~/bc:utxob:giagOvLc-SD~LLWl-M9ckx88-2uV76p5-L_E_fcc-6YZNNV~-bq6uG?expiry=1754627227&endpoints=rpcs://proxy.iriswallet.com/0.2/json-rpc';
            await rgbInput.fill(testInvoice);
            console.log('✅ RGB invoice filled\n');
        } else {
            console.log('❌ RGB invoice input not found\n');
        }
        
        // Step 6: Check batch selector
        console.log('📍 Step 6: Checking batch count...');
        const batchCount = await page.evaluate(() => {
            const el = document.getElementById('batchCount');
            return el ? el.textContent : 'NOT_FOUND';
        });
        console.log(`   Current batch count: ${batchCount}\n`);
        
        // Step 7: Find submit button
        console.log('📍 Step 7: Finding submit button...');
        const submitButton = await page.$('#submitRgbInvoice');
        if (submitButton) {
            const buttonText = await submitButton.textContent();
            console.log(`   Button found: "${buttonText}"`);
            
            // Check if button is enabled
            const isDisabled = await submitButton.isDisabled();
            console.log(`   Button disabled: ${isDisabled}\n`);
            
            if (!isDisabled) {
                // Step 8: Click submit
                console.log('📍 Step 8: Clicking submit button...');
                await submitButton.click();
                console.log('   Button clicked!\n');
                
                // Wait for response
                console.log('📍 Step 9: Waiting for response...');
                await page.waitForTimeout(5000);
                
                // Check button state
                const newButtonText = await submitButton.textContent();
                console.log(`   Button text after click: "${newButtonText}"`);
                
                // Check for modal
                const modalFound = await page.evaluate(() => {
                    // Check for payment modal
                    const modal = document.querySelector('#paymentModal, .modal, [class*="modal"]');
                    if (modal && window.getComputedStyle(modal).display !== 'none') {
                        return 'PAYMENT_MODAL';
                    }
                    
                    // Check for our fallback modal
                    const fallback = document.querySelector('div[style*="z-index: 10000"]');
                    if (fallback) {
                        return 'FALLBACK_MODAL';
                    }
                    
                    return 'NO_MODAL';
                });
                
                console.log(`   Modal status: ${modalFound}`);
                
                if (modalFound !== 'NO_MODAL') {
                    console.log('✅ Success! Invoice modal appeared');
                    
                    // Try to get invoice details
                    const invoiceDetails = await page.evaluate(() => {
                        // Try to find invoice text
                        const invoiceEls = document.querySelectorAll('[class*="invoice"], [id*="invoice"], pre, code');
                        for (let el of invoiceEls) {
                            const text = el.textContent;
                            if (text && text.includes('lightning:') || text.includes('lnbc')) {
                                return text.substring(0, 100) + '...';
                            }
                        }
                        return 'Invoice text not found';
                    });
                    console.log(`   Invoice: ${invoiceDetails}`);
                } else {
                    console.log('⚠️ No modal appeared');
                    
                    // Check for errors
                    const notification = await page.$('.notification, .error, .alert');
                    if (notification) {
                        const errorText = await notification.textContent();
                        console.log(`   Error message: ${errorText}`);
                    }
                }
            } else {
                console.log('❌ Submit button is disabled');
            }
        } else {
            console.log('❌ Submit button not found\n');
        }
        
        // Step 10: Check console logs
        console.log('\n📍 Step 10: Checking console logs...');
        const relevantLogs = consoleLogs.filter(log => 
            log.includes('DIRECT SUBMIT') || 
            log.includes('Invoice') ||
            log.includes('Error') ||
            log.includes('API')
        );
        
        if (relevantLogs.length > 0) {
            console.log('   Important console messages:');
            relevantLogs.forEach(log => console.log(`   - ${log}`));
        } else {
            console.log('   No relevant console messages found');
        }
        
    } catch (error) {
        console.error('\n❌ Test failed:', error);
    } finally {
        console.log('\n📊 Test complete. Browser will close in 10 seconds...');
        await page.waitForTimeout(10000);
        await browser.close();
    }
}

// Check if playwright is installed
try {
    require.resolve('playwright');
    testInvoiceFlow().catch(console.error);
} catch(e) {
    console.log('Installing Playwright first...');
    const { execSync } = require('child_process');
    execSync('npm install playwright', { stdio: 'inherit' });
    console.log('Playwright installed. Running test...');
    testInvoiceFlow().catch(console.error);
}