// Comprehensive Visual and Functional Test for Payment Modal
// Following CLAUDE.md testing requirements

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_URL = 'http://localhost:8082';
const SCREENSHOTS_DIR = '/root/tests/screenshots';

// Mobile viewport configurations
const MOBILE_VIEWPORTS = {
    'iPhone-12': { width: 390, height: 844 },
    'iPhone-SE': { width: 375, height: 667 },
    'Pixel-5': { width: 393, height: 851 },
    'Samsung-S21': { width: 384, height: 854 }
};

class PaymentModalVisualTest {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.results = [];
    }

    async init() {
        // Create screenshots directory
        if (!fs.existsSync(SCREENSHOTS_DIR)) {
            fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
        }

        this.browser = await chromium.launch({
            headless: false, // Show browser for visual debugging
            slowMo: 100 // Slow down for visibility
        });
    }

    async testMobileView(deviceName, viewport) {
        console.log(`\n📱 Testing ${deviceName} (${viewport.width}x${viewport.height})`);
        console.log('='.repeat(50));

        this.context = await this.browser.newContext({
            viewport: viewport,
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
            isMobile: true,
            hasTouch: true
        });

        this.page = await this.context.newPage();

        try {
            // 1. Navigate to site
            console.log('1. Loading homepage...');
            await this.page.goto(TEST_URL, { waitUntil: 'networkidle' });
            await this.page.screenshot({ 
                path: path.join(SCREENSHOTS_DIR, `${deviceName}-1-homepage.png`),
                fullPage: true 
            });

            // 2. Check if game unlock exists
            console.log('2. Checking for game/purchase section...');
            const hasGame = await this.page.locator('#game-section, #game, .game-container').count() > 0;
            const hasPurchase = await this.page.locator('#purchase-section, #purchase, .purchase-section').count() > 0;
            
            console.log(`   Game section: ${hasGame ? '✅' : '❌'}`);
            console.log(`   Purchase section: ${hasPurchase ? '✅' : '❌'}`);

            // 3. Simulate tier unlock (bypass game for testing)
            console.log('3. Simulating tier unlock...');
            await this.page.evaluate(() => {
                localStorage.setItem('unlockedTier', 'gold');
                localStorage.setItem('gameScore', '30');
            });

            // 4. Navigate to purchase section
            if (hasPurchase) {
                console.log('4. Scrolling to purchase section...');
                await this.page.locator('#purchase-section, #purchase, .purchase-section').first().scrollIntoViewIfNeeded();
                await this.page.waitForTimeout(500);
            }

            // 5. Enter RGB invoice
            console.log('5. Entering RGB invoice...');
            const rgbInput = await this.page.locator('input[placeholder*="rgb"], input[name*="rgb"], #rgbInvoice').first();
            if (await rgbInput.count() > 0) {
                await rgbInput.fill('rgb:utxob:testinvoice123');
                await this.page.screenshot({ 
                    path: path.join(SCREENSHOTS_DIR, `${deviceName}-2-invoice-entered.png`),
                    fullPage: true 
                });
            } else {
                console.log('   ❌ RGB invoice input not found!');
                this.results.push({
                    device: deviceName,
                    error: 'RGB invoice input not found'
                });
            }

            // 6. Click create invoice button
            console.log('6. Creating Lightning invoice...');
            const createButton = await this.page.locator('button:has-text("Create"), button:has-text("Lightning"), button:has-text("Invoice"), .submit-btn').first();
            
            if (await createButton.count() > 0) {
                await createButton.click();
                console.log('   Clicked create button, waiting for modal...');
                
                // Wait for either modal to appear
                await this.page.waitForTimeout(2000);
                
                // 7. Check which modal appeared
                console.log('7. Checking for payment modal...');
                
                // Check for new professional modal
                const newModal = await this.page.locator('#paymentModalPro, .payment-modal-overlay').first();
                const oldModal = await this.page.locator('#paymentModal, .modal:visible').first();
                
                let modalFound = false;
                
                if (await newModal.count() > 0 && await newModal.isVisible()) {
                    console.log('   ✅ New professional modal found!');
                    modalFound = true;
                    
                    // Take screenshot of new modal
                    await this.page.screenshot({ 
                        path: path.join(SCREENSHOTS_DIR, `${deviceName}-3-new-modal.png`),
                        fullPage: true 
                    });
                    
                    // Check for QR code
                    await this.testQRCode(deviceName, 'new');
                    
                } else if (await oldModal.count() > 0 && await oldModal.isVisible()) {
                    console.log('   ⚠️ Old modal still showing!');
                    modalFound = true;
                    
                    await this.page.screenshot({ 
                        path: path.join(SCREENSHOTS_DIR, `${deviceName}-3-old-modal.png`),
                        fullPage: true 
                    });
                    
                    // Check for QR code in old modal
                    await this.testQRCode(deviceName, 'old');
                    
                    this.results.push({
                        device: deviceName,
                        issue: 'Old modal still active instead of new professional modal'
                    });
                }
                
                if (!modalFound) {
                    console.log('   ❌ No modal appeared!');
                    
                    // Check console for errors
                    const errors = await this.page.evaluate(() => {
                        const logs = [];
                        const originalLog = console.error;
                        console.error = (...args) => {
                            logs.push(args.join(' '));
                            originalLog.apply(console, args);
                        };
                        return logs;
                    });
                    
                    if (errors.length > 0) {
                        console.log('   Console errors:', errors);
                    }
                    
                    this.results.push({
                        device: deviceName,
                        error: 'No modal appeared after clicking create invoice',
                        consoleErrors: errors
                    });
                }
                
            } else {
                console.log('   ❌ Create invoice button not found!');
                this.results.push({
                    device: deviceName,
                    error: 'Create invoice button not found'
                });
            }

            // 8. Test modal responsiveness
            await this.testModalResponsiveness(deviceName);

        } catch (error) {
            console.error(`   ❌ Error testing ${deviceName}:`, error.message);
            this.results.push({
                device: deviceName,
                error: error.message
            });
        } finally {
            await this.context.close();
        }
    }

    async testQRCode(deviceName, modalType) {
        console.log('8. Testing QR code display...');
        
        // Multiple selectors for QR code
        const qrSelectors = [
            '#qrcode',
            '#paymentQRCode',
            '.payment-qr-container canvas',
            '.payment-qr img',
            '#qrCodeContainer canvas',
            'canvas' // Generic canvas that might be QR
        ];
        
        let qrFound = false;
        
        for (const selector of qrSelectors) {
            const qrElement = await this.page.locator(selector).first();
            if (await qrElement.count() > 0) {
                const isVisible = await qrElement.isVisible();
                const box = await qrElement.boundingBox();
                
                console.log(`   QR element (${selector}): ${isVisible ? '✅ Visible' : '❌ Hidden'}`);
                
                if (box) {
                    console.log(`   Position: ${box.x}, ${box.y}`);
                    console.log(`   Size: ${box.width}x${box.height}`);
                    
                    // Check if QR is cut off
                    if (box.y < 0) {
                        console.log('   ⚠️ QR code is cut off at top!');
                        this.results.push({
                            device: deviceName,
                            issue: 'QR code cut off at top',
                            details: `Top position: ${box.y}px`
                        });
                    }
                    
                    if (box.width < 150 || box.height < 150) {
                        console.log('   ⚠️ QR code too small!');
                        this.results.push({
                            device: deviceName,
                            issue: 'QR code too small',
                            details: `Size: ${box.width}x${box.height}`
                        });
                    }
                    
                    qrFound = true;
                    
                    // Take close-up screenshot of QR area
                    if (isVisible && box.width > 0 && box.height > 0) {
                        await this.page.screenshot({
                            path: path.join(SCREENSHOTS_DIR, `${deviceName}-4-qr-closeup.png`),
                            clip: {
                                x: Math.max(0, box.x - 20),
                                y: Math.max(0, box.y - 20),
                                width: box.width + 40,
                                height: box.height + 40
                            }
                        });
                    }
                }
                
                if (isVisible) break;
            }
        }
        
        if (!qrFound) {
            console.log('   ❌ No QR code found!');
            this.results.push({
                device: deviceName,
                error: 'QR code not found in modal'
            });
        }
    }

    async testModalResponsiveness(deviceName) {
        console.log('9. Testing modal responsiveness...');
        
        // Check if modal is scrollable
        const modalScrollable = await this.page.evaluate(() => {
            const modal = document.querySelector('.payment-modal-container, .modal-content');
            if (modal) {
                return modal.scrollHeight > modal.clientHeight;
            }
            return false;
        });
        
        console.log(`   Modal scrollable: ${modalScrollable ? '✅' : '❌'}`);
        
        // Check modal positioning
        const modalPosition = await this.page.evaluate(() => {
            const modal = document.querySelector('.payment-modal-container, .modal-content');
            if (modal) {
                const rect = modal.getBoundingClientRect();
                return {
                    top: rect.top,
                    visible: rect.top >= 0 && rect.top < window.innerHeight,
                    height: rect.height,
                    screenHeight: window.innerHeight
                };
            }
            return null;
        });
        
        if (modalPosition) {
            console.log(`   Modal top: ${modalPosition.top}px`);
            console.log(`   Modal height: ${modalPosition.height}px`);
            console.log(`   Screen height: ${modalPosition.screenHeight}px`);
            
            if (!modalPosition.visible) {
                this.results.push({
                    device: deviceName,
                    issue: 'Modal not fully visible',
                    details: modalPosition
                });
            }
        }
    }

    async runAllTests() {
        await this.init();
        
        console.log('🧪 LIGHTCAT Payment Modal Visual Test Suite');
        console.log('=' .repeat(50));
        console.log('Following CLAUDE.md rules for testing\n');
        
        // Test all mobile viewports
        for (const [device, viewport] of Object.entries(MOBILE_VIEWPORTS)) {
            await this.testMobileView(device, viewport);
        }
        
        // Generate report
        this.generateReport();
        
        await this.browser.close();
    }

    generateReport() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 TEST RESULTS SUMMARY');
        console.log('='.repeat(50));
        
        if (this.results.length === 0) {
            console.log('✅ All tests passed!');
        } else {
            console.log(`⚠️ Found ${this.results.length} issues:\n`);
            
            this.results.forEach((result, index) => {
                console.log(`${index + 1}. ${result.device}:`);
                if (result.error) {
                    console.log(`   ❌ Error: ${result.error}`);
                }
                if (result.issue) {
                    console.log(`   ⚠️ Issue: ${result.issue}`);
                }
                if (result.details) {
                    console.log(`   Details:`, result.details);
                }
                console.log();
            });
        }
        
        // Save results to file
        const reportPath = path.join(SCREENSHOTS_DIR, 'test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`\n📁 Report saved to: ${reportPath}`);
        console.log(`📸 Screenshots saved to: ${SCREENSHOTS_DIR}`);
    }
}

// Run tests
const tester = new PaymentModalVisualTest();
tester.runAllTests().catch(console.error);