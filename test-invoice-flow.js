const { chromium } = require('playwright');

async function testInvoiceFlow() {
    console.log('🚀 Starting LIGHTCAT Invoice Flow Test...\n');
    
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true 
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    // Capture console logs
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        if (type === 'error') {
            console.log('❌ Console Error:', text);
        } else if (type === 'warning') {
            console.log('⚠️ Console Warning:', text);
        } else if (text.includes('Invoice') || text.includes('tier') || text.includes('batch')) {
            console.log('📝 Console:', text);
        }
    });
    
    // Capture network failures
    page.on('requestfailed', request => {
        console.log('❌ Request failed:', request.url(), request.failure().errorText);
    });
    
    // Monitor network requests
    page.on('request', request => {
        if (request.url().includes('/api/')) {
            console.log('🌐 API Request:', request.method(), request.url());
            if (request.method() === 'POST') {
                console.log('   Body:', request.postData());
            }
        }
    });
    
    page.on('response', response => {
        if (response.url().includes('/api/')) {
            console.log('📥 API Response:', response.status(), response.url());
        }
    });
    
    try {
        // Step 1: Go to the site
        console.log('\n📍 Step 1: Loading rgblightcat.com...');
        await page.goto('https://rgblightcat.com', { 
            waitUntil: 'networkidle',
            timeout: 30000 
        });
        console.log('✅ Site loaded successfully\n');
        
        // Step 2: Check if game section exists
        console.log('📍 Step 2: Checking game section...');
        const gameSection = await page.$('#game');
        if (gameSection) {
            console.log('✅ Game section found');
            
            // Scroll to game
            await page.evaluate(() => {
                document.querySelector('#game').scrollIntoView({ behavior: 'smooth' });
            });
            await page.waitForTimeout(1000);
        }
        
        // Step 3: Click Play Game button
        console.log('\n📍 Step 3: Looking for Play Game button...');
        const playButton = await page.$('button:has-text("PLAY GAME"), a[href*="game.html"]');
        if (playButton) {
            console.log('✅ Play button found, clicking...');
            await playButton.click();
            await page.waitForTimeout(3000);
        } else {
            console.log('⚠️ Play button not found, checking if already in game...');
        }
        
        // Step 4: Check if we're on the game page
        const currentUrl = page.url();
        console.log('📍 Current URL:', currentUrl);
        
        if (currentUrl.includes('game.html')) {
            console.log('\n📍 Step 4: On game page, waiting for game to load...');
            await page.waitForTimeout(5000);
            
            // Simulate game completion
            console.log('📍 Simulating game completion...');
            await page.evaluate(() => {
                // Set a high score to unlock tier
                localStorage.setItem('lastGameScore', '30');
                localStorage.setItem('unlockedTier', 'gold');
                localStorage.setItem('gameSessionId', 'test-session-' + Date.now());
                console.log('Game data set:', {
                    score: localStorage.getItem('lastGameScore'),
                    tier: localStorage.getItem('unlockedTier')
                });
            });
            
            // Go back to main page
            console.log('📍 Returning to main page...');
            await page.goto('https://rgblightcat.com');
            await page.waitForTimeout(2000);
        } else {
            // We're still on main page, simulate tier unlock directly
            console.log('\n📍 Step 4: Simulating tier unlock on main page...');
            await page.evaluate(() => {
                localStorage.setItem('lastGameScore', '30');
                localStorage.setItem('unlockedTier', 'gold');
                localStorage.setItem('gameSessionId', 'test-session-' + Date.now());
                
                // Try to unlock the form
                const form = document.getElementById('purchaseForm');
                if (form) {
                    form.style.display = 'block';
                    console.log('Form display set to block');
                }
                
                // Check for lock message
                const lockMessage = document.querySelector('.mint-lock-message');
                if (lockMessage) {
                    lockMessage.style.display = 'none';
                    console.log('Lock message hidden');
                }
            });
        }
        
        // Step 5: Check purchase section
        console.log('\n📍 Step 5: Checking purchase section...');
        await page.evaluate(() => {
            const section = document.querySelector('#purchase');
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        });
        await page.waitForTimeout(1000);
        
        // Check if form is visible
        const formVisible = await page.evaluate(() => {
            const form = document.getElementById('purchaseForm');
            return form ? window.getComputedStyle(form).display !== 'none' : false;
        });
        
        console.log('📝 Purchase form visible:', formVisible);
        
        if (!formVisible) {
            console.log('⚠️ Form not visible, checking for lock message...');
            const lockMessage = await page.$('.mint-lock-message');
            if (lockMessage) {
                const lockText = await lockMessage.textContent();
                console.log('🔒 Lock message found:', lockText);
                
                // Try to force unlock
                console.log('📍 Attempting to force unlock...');
                await page.evaluate(() => {
                    // Remove lock message
                    const lock = document.querySelector('.mint-lock-message');
                    if (lock) lock.remove();
                    
                    // Show form
                    const form = document.getElementById('purchaseForm');
                    if (form) {
                        form.style.display = 'block';
                        form.style.opacity = '1';
                        form.style.pointerEvents = 'auto';
                    }
                    
                    // Set tier data
                    window.unlockedTier = 'gold';
                    window.mintLocked = false;
                });
            }
        }
        
        // Step 6: Fill in RGB invoice
        console.log('\n📍 Step 6: Filling RGB invoice...');
        const rgbInput = await page.$('#rgbInvoice');
        if (rgbInput) {
            await rgbInput.fill('rgb:utxob:test-invoice-data-here');
            console.log('✅ RGB invoice filled');
        } else {
            console.log('❌ RGB invoice input not found');
        }
        
        // Step 7: Check batch selector
        console.log('\n📍 Step 7: Checking batch selector...');
        const batchDisplay = await page.$('#batchCount');
        if (batchDisplay) {
            const batchCount = await batchDisplay.textContent();
            console.log('📝 Current batch count:', batchCount);
            
            // Try to increase batch count
            const increaseBtn = await page.$('#increaseBatch');
            if (increaseBtn) {
                await increaseBtn.click();
                await page.waitForTimeout(500);
                const newCount = await batchDisplay.textContent();
                console.log('📝 New batch count after increase:', newCount);
            }
        }
        
        // Step 8: Find and click submit button
        console.log('\n📍 Step 8: Looking for submit button...');
        const submitButton = await page.$('#submitRgbInvoice, button[type="submit"]');
        if (submitButton) {
            const buttonText = await submitButton.textContent();
            const isDisabled = await submitButton.isDisabled();
            console.log('📝 Submit button found:', buttonText);
            console.log('📝 Button disabled:', isDisabled);
            
            if (!isDisabled) {
                console.log('🖱️ Clicking submit button...');
                await submitButton.click();
                
                // Wait for response
                await page.waitForTimeout(5000);
                
                // Check button state after click
                const newButtonText = await submitButton.textContent();
                console.log('📝 Button text after click:', newButtonText);
                
                // Check for any modals
                const modal = await page.$('.modal, #paymentModal');
                if (modal) {
                    console.log('✅ Payment modal appeared!');
                    const modalContent = await modal.textContent();
                    console.log('📝 Modal content preview:', modalContent.substring(0, 200));
                } else {
                    console.log('⚠️ No payment modal appeared');
                }
                
                // Check for notifications
                const notification = await page.$('.notification');
                if (notification) {
                    const notifText = await notification.textContent();
                    console.log('📝 Notification:', notifText);
                }
            } else {
                console.log('❌ Submit button is disabled');
            }
        } else {
            console.log('❌ Submit button not found');
        }
        
        // Step 9: Capture final state
        console.log('\n📍 Step 9: Capturing final state...');
        const finalState = await page.evaluate(() => {
            return {
                formDisplay: document.getElementById('purchaseForm')?.style.display,
                mintLocked: window.mintLocked,
                unlockedTier: window.unlockedTier || localStorage.getItem('unlockedTier'),
                gameScore: localStorage.getItem('lastGameScore'),
                currentBatches: window.currentBatches,
                errors: Array.from(document.querySelectorAll('.error, .notification')).map(el => el.textContent)
            };
        });
        
        console.log('\n📊 Final State:', JSON.stringify(finalState, null, 2));
        
    } catch (error) {
        console.error('\n❌ Test failed:', error);
    } finally {
        console.log('\n📍 Test complete. Browser will close in 10 seconds...');
        await page.waitForTimeout(10000);
        await browser.close();
    }
}

// Run the test
testInvoiceFlow().catch(console.error);