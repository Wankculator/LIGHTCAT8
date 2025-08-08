// E2E tests for complete user journeys

const puppeteer = require('puppeteer');
const TestUtils = require('../helpers/test-utils');

describe('E2E User Journeys', () => {
    let browser;
    let page;
    const baseURL = process.env.TEST_URL || 'http://localhost:8082';
    
    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    });
    
    afterAll(async () => {
        await browser.close();
    });
    
    beforeEach(async () => {
        page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
    });
    
    afterEach(async () => {
        await page.close();
    });
    
    describe('Homepage to Purchase Flow', () => {
        test('should load homepage and display stats', async () => {
            await page.goto(baseURL);
            
            // Wait for stats to load
            await page.waitForSelector('#progressText');
            
            // Check critical elements
            const progressText = await page.$eval('#progressText', el => el.textContent);
            expect(progressText).toMatch(/\d+(\.\d+)?% SOLD/);
            
            // Check stat cards
            await page.waitForSelector('.stat-card');
            const statCards = await page.$$('.stat-card');
            expect(statCards.length).toBeGreaterThanOrEqual(4);
        });
        
        test('should navigate to game from hero section', async () => {
            await page.goto(baseURL);
            
            // Click play game button
            await page.waitForSelector('.play-game-btn');
            await page.click('.play-game-btn');
            
            // Wait for navigation
            await page.waitForNavigation();
            expect(page.url()).toContain('/game.html');
            
            // Verify game loads
            await page.waitForSelector('#game-canvas', { timeout: 10000 });
            const canvas = await page.$('#game-canvas');
            expect(canvas).toBeTruthy();
        });
        
        test('should complete game and redirect to purchase', async () => {
            // Navigate to game
            await page.goto(`${baseURL}/game.html`);
            await page.waitForSelector('#game-canvas');
            
            // Mock game completion with silver tier
            await page.evaluate(() => {
                window.postMessage({
                    type: 'GAME_COMPLETE',
                    tier: 'silver',
                    score: 20
                }, '*');
            });
            
            // Wait for redirect
            await page.waitForFunction(
                () => window.location.hash === '#purchase',
                { timeout: 5000 }
            );
            
            // Verify purchase section is visible
            const purchaseSection = await page.$('#purchase');
            expect(purchaseSection).toBeTruthy();
            
            // Check tier is applied
            const urlParams = new URLSearchParams(page.url().split('?')[1]);
            expect(urlParams.get('tier')).toBe('silver');
        });
    });
    
    describe('RGB Invoice Purchase Flow', () => {
        test('should display purchase form with tier limits', async () => {
            await page.goto(`${baseURL}/#purchase?tier=bronze`);
            
            // Wait for purchase form
            await page.waitForSelector('#purchaseForm');
            
            // Check batch limit is displayed
            const batchInfo = await page.$eval('.batch-info', el => el.textContent);
            expect(batchInfo).toContain('5'); // Bronze limit
            
            // Verify input fields
            const rgbInput = await page.$('#rgbInvoice');
            const batchInput = await page.$('#batchCount');
            const walletInput = await page.$('#walletAddress');
            
            expect(rgbInput).toBeTruthy();
            expect(batchInput).toBeTruthy();
            expect(walletInput).toBeTruthy();
        });
        
        test('should validate RGB invoice format', async () => {
            await page.goto(`${baseURL}/#purchase`);
            await page.waitForSelector('#purchaseForm');
            
            // Enter invalid invoice
            await page.type('#rgbInvoice', 'invalid-invoice');
            await page.type('#batchCount', '1');
            await page.type('#walletAddress', TestUtils.generateBitcoinAddress());
            
            // Submit form
            await page.click('#submitPurchase');
            
            // Check for error message
            await page.waitForSelector('.error-message');
            const errorText = await page.$eval('.error-message', el => el.textContent);
            expect(errorText).toContain('Invalid RGB invoice');
        });
        
        test('should create Lightning invoice for valid input', async () => {
            await page.goto(`${baseURL}/#purchase?tier=silver`);
            await page.waitForSelector('#purchaseForm');
            
            // Fill valid form
            await page.type('#rgbInvoice', TestUtils.generateRGBInvoice());
            await page.type('#batchCount', '3');
            await page.type('#walletAddress', TestUtils.generateBitcoinAddress());
            
            // Mock API response
            await page.setRequestInterception(true);
            page.on('request', request => {
                if (request.url().includes('/api/rgb/invoice')) {
                    request.respond({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            success: true,
                            invoiceId: 'test-123',
                            lightningInvoice: TestUtils.generateLightningInvoice(),
                            amount: 6000,
                            expiresAt: new Date(Date.now() + 900000).toISOString(),
                            qrCode: 'data:image/png;base64,test'
                        })
                    });
                } else {
                    request.continue();
                }
            });
            
            // Submit form
            await page.click('#submitPurchase');
            
            // Wait for payment modal
            await page.waitForSelector('#paymentModal', { visible: true });
            
            // Verify QR code and invoice are displayed
            const qrCode = await page.$('.qr-code img');
            const invoiceText = await page.$('.lightning-invoice');
            
            expect(qrCode).toBeTruthy();
            expect(invoiceText).toBeTruthy();
        });
    });
    
    describe('Mobile Responsiveness', () => {
        const devices = [
            { name: 'iPhone SE', width: 375, height: 667 },
            { name: 'iPhone 12', width: 390, height: 844 },
            { name: 'iPad', width: 768, height: 1024 },
            { name: 'Pixel 5', width: 393, height: 851 }
        ];
        
        devices.forEach(device => {
            test(`should be responsive on ${device.name}`, async () => {
                await page.setViewport({
                    width: device.width,
                    height: device.height,
                    isMobile: true
                });
                
                await page.goto(baseURL);
                
                // Check mobile menu
                const mobileMenu = await page.$('.mobile-menu-toggle');
                expect(mobileMenu).toBeTruthy();
                
                // Check stat cards stack properly
                const statCards = await page.$$eval('.stat-card', cards => {
                    return cards.map(card => ({
                        width: card.offsetWidth,
                        height: card.offsetHeight
                    }));
                });
                
                // All cards should be visible
                statCards.forEach(card => {
                    expect(card.width).toBeGreaterThan(0);
                    expect(card.height).toBeGreaterThan(0);
                });
                
                // Check text doesn't overflow
                const overflowingElements = await page.$$eval('*', elements => {
                    return elements.filter(el => {
                        return el.scrollWidth > el.clientWidth;
                    }).length;
                });
                
                expect(overflowingElements).toBe(0);
            });
        });
    });
    
    describe('Payment Status Polling', () => {
        test('should poll for payment status', async () => {
            await page.goto(`${baseURL}/#purchase`);
            
            // Set up request interception
            await page.setRequestInterception(true);
            let pollCount = 0;
            
            page.on('request', request => {
                if (request.url().includes('/api/rgb/invoice/test-123/status')) {
                    pollCount++;
                    
                    // Return pending for first 2 polls, then paid
                    const status = pollCount < 3 ? 'pending' : 'paid';
                    const response = {
                        success: true,
                        status: status,
                        consignment: status === 'paid' ? TestUtils.mockRGBConsignment() : null
                    };
                    
                    request.respond({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify(response)
                    });
                } else {
                    request.continue();
                }
            });
            
            // Trigger payment status check
            await page.evaluate(() => {
                window.checkPaymentStatus('test-123');
            });
            
            // Wait for polling to complete
            await page.waitForFunction(
                () => window.paymentStatus === 'paid',
                { timeout: 10000 }
            );
            
            // Verify polls happened
            expect(pollCount).toBeGreaterThanOrEqual(3);
        });
    });
    
    describe('Error Handling', () => {
        test('should handle network errors gracefully', async () => {
            await page.goto(baseURL);
            
            // Simulate offline
            await page.setOfflineMode(true);
            
            // Try to load stats
            await page.reload();
            
            // Should show error state
            await page.waitForSelector('.error-state', { timeout: 5000 });
            const errorMessage = await page.$eval('.error-state', el => el.textContent);
            expect(errorMessage).toContain('connection');
            
            // Go back online
            await page.setOfflineMode(false);
            await page.reload();
            
            // Should recover
            await page.waitForSelector('#progressText', { timeout: 5000 });
        });
        
        test('should handle API errors with user-friendly messages', async () => {
            await page.goto(`${baseURL}/#purchase`);
            await page.waitForSelector('#purchaseForm');
            
            // Mock API error
            await page.setRequestInterception(true);
            page.on('request', request => {
                if (request.url().includes('/api/rgb/invoice')) {
                    request.respond({
                        status: 500,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            success: false,
                            error: 'Internal server error'
                        })
                    });
                } else {
                    request.continue();
                }
            });
            
            // Fill and submit form
            await page.type('#rgbInvoice', TestUtils.generateRGBInvoice());
            await page.type('#batchCount', '1');
            await page.type('#walletAddress', TestUtils.generateBitcoinAddress());
            await page.click('#submitPurchase');
            
            // Should show error
            await page.waitForSelector('.error-banner');
            const errorText = await page.$eval('.error-banner', el => el.textContent);
            expect(errorText).toContain('Something went wrong');
            expect(errorText).not.toContain('500'); // Don't expose technical details
        });
    });
    
    describe('Performance', () => {
        test('should load homepage within 2 seconds', async () => {
            const startTime = Date.now();
            
            await page.goto(baseURL, { waitUntil: 'networkidle2' });
            
            const loadTime = Date.now() - startTime;
            expect(loadTime).toBeLessThan(2000);
        });
        
        test('should have good Core Web Vitals', async () => {
            await page.goto(baseURL);
            
            // Measure LCP (Largest Contentful Paint)
            const lcp = await page.evaluate(() => {
                return new Promise(resolve => {
                    new PerformanceObserver(list => {
                        const entries = list.getEntries();
                        const lastEntry = entries[entries.length - 1];
                        resolve(lastEntry.startTime);
                    }).observe({ entryTypes: ['largest-contentful-paint'] });
                });
            });
            
            expect(lcp).toBeLessThan(2500); // Good LCP is < 2.5s
            
            // Measure FID (First Input Delay) - simulated
            const fidStart = Date.now();
            await page.click('body');
            const fidEnd = Date.now();
            const fid = fidEnd - fidStart;
            
            expect(fid).toBeLessThan(100); // Good FID is < 100ms
        });
    });
});