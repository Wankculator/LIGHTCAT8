#!/usr/bin/env node

/**
 * Mobile Device Testing Matrix for LIGHTCAT
 * Tests across different devices, browsers, and network conditions
 */

const puppeteer = require('puppeteer');

const DEVICES = [
    // Low-end devices
    { name: 'Galaxy J2', viewport: { width: 320, height: 533 }, userAgent: 'Mozilla/5.0 (Linux; Android 5.1.1; SM-J200G)', cpu: 4, memory: 1 },
    { name: 'Nokia 2', viewport: { width: 360, height: 640 }, userAgent: 'Mozilla/5.0 (Linux; Android 7.1.1; Nokia 2)', cpu: 4, memory: 1 },
    
    // Mid-range devices
    { name: 'iPhone SE', viewport: { width: 375, height: 667 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_0)', cpu: 6, memory: 2 },
    { name: 'Pixel 3a', viewport: { width: 393, height: 808 }, userAgent: 'Mozilla/5.0 (Linux; Android 10; Pixel 3a)', cpu: 6, memory: 4 },
    
    // High-end devices
    { name: 'iPhone 14 Pro', viewport: { width: 393, height: 852 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0)', cpu: 1, memory: 6 },
    { name: 'Samsung S23', viewport: { width: 412, height: 915 }, userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S901B)', cpu: 1, memory: 8 }
];

const NETWORK_CONDITIONS = [
    { name: 'Slow 3G', downloadThroughput: 50 * 1024 / 8, uploadThroughput: 16 * 1024 / 8, latency: 400 },
    { name: 'Fast 3G', downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8, latency: 150 },
    { name: '4G', downloadThroughput: 4 * 1024 * 1024 / 8, uploadThroughput: 3 * 1024 * 1024 / 8, latency: 70 },
    { name: 'WiFi', downloadThroughput: 30 * 1024 * 1024 / 8, uploadThroughput: 15 * 1024 * 1024 / 8, latency: 2 }
];

class MobileDeviceTester {
    constructor(baseUrl = 'http://localhost:8082') {
        this.baseUrl = baseUrl;
        this.results = [];
    }

    async testDevice(device, networkCondition) {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        const client = await page.target().createCDPSession();

        try {
            // Set device emulation
            await page.setViewport(device.viewport);
            await page.setUserAgent(device.userAgent);

            // Set CPU throttling
            await client.send('Emulation.setCPUThrottlingRate', { rate: device.cpu });

            // Set network conditions
            await client.send('Network.enable');
            await client.send('Network.emulateNetworkConditions', {
                offline: false,
                downloadThroughput: networkCondition.downloadThroughput,
                uploadThroughput: networkCondition.uploadThroughput,
                latency: networkCondition.latency
            });

            console.log(`\n📱 Testing ${device.name} on ${networkCondition.name}...`);

            // Test 1: Page Load Performance
            const loadStart = Date.now();
            await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
            const loadTime = Date.now() - loadStart;
            console.log(`  ⏱️  Page load: ${loadTime}ms`);

            // Test 2: Touch Responsiveness
            const touchResult = await this.testTouchResponsiveness(page);
            console.log(`  👆 Touch response: ${touchResult.avgResponseTime}ms`);

            // Test 3: Game Performance
            const gameResult = await this.testGamePerformance(page, device);
            console.log(`  🎮 Game FPS: ${gameResult.averageFPS}`);

            // Test 4: Memory Usage
            const memoryResult = await this.testMemoryUsage(page);
            console.log(`  💾 Memory used: ${memoryResult.usedJSHeapSize}MB`);

            // Test 5: UI Elements Visibility
            const uiResult = await this.testUIElements(page);
            console.log(`  👁️  UI elements visible: ${uiResult.visibleCount}/${uiResult.totalCount}`);

            // Test 6: Purchase Flow
            const purchaseResult = await this.testPurchaseFlow(page);
            console.log(`  💰 Purchase flow: ${purchaseResult.success ? '✅' : '❌'}`);

            this.results.push({
                device: device.name,
                network: networkCondition.name,
                loadTime,
                touchResponse: touchResult.avgResponseTime,
                gameFPS: gameResult.averageFPS,
                memory: memoryResult.usedJSHeapSize,
                uiScore: `${uiResult.visibleCount}/${uiResult.totalCount}`,
                purchaseFlow: purchaseResult.success,
                errors: [...touchResult.errors, ...gameResult.errors, ...purchaseResult.errors]
            });

        } catch (error) {
            console.error(`  ❌ Error testing ${device.name}: ${error.message}`);
            this.results.push({
                device: device.name,
                network: networkCondition.name,
                error: error.message
            });
        } finally {
            await browser.close();
        }
    }

    async testTouchResponsiveness(page) {
        const errors = [];
        const responseTimes = [];

        try {
            // Test button clicks
            const buttons = await page.$$('button');
            
            for (let i = 0; i < Math.min(buttons.length, 5); i++) {
                const start = Date.now();
                await buttons[i].tap();
                const responseTime = Date.now() - start;
                responseTimes.push(responseTime);
            }

            // Test scroll performance
            const scrollStart = Date.now();
            await page.evaluate(() => {
                window.scrollTo({ top: 1000, behavior: 'smooth' });
            });
            await page.waitForTimeout(500);
            const scrollTime = Date.now() - scrollStart;
            responseTimes.push(scrollTime);

        } catch (error) {
            errors.push(error.message);
        }

        return {
            avgResponseTime: responseTimes.length > 0 
                ? Math.round(responseTimes.reduce((a, b) => a + b) / responseTimes.length)
                : 0,
            errors
        };
    }

    async testGamePerformance(page, device) {
        const errors = [];
        let averageFPS = 0;

        try {
            // Navigate to game
            await page.goto(`${this.baseUrl}/game.html`, { waitUntil: 'networkidle2' });
            
            // Start performance monitoring
            await page.evaluateOnNewDocument(() => {
                window.fpsData = [];
                let lastTime = performance.now();
                
                function measureFPS() {
                    const currentTime = performance.now();
                    const fps = 1000 / (currentTime - lastTime);
                    window.fpsData.push(fps);
                    lastTime = currentTime;
                    requestAnimationFrame(measureFPS);
                }
                
                requestAnimationFrame(measureFPS);
            });

            // Wait for game to load
            await page.waitForSelector('#game-canvas', { timeout: 10000 });
            
            // Simulate gameplay
            await page.evaluate(() => {
                // Start game if not started
                if (window.startGame) window.startGame();
            });

            // Let game run for 5 seconds
            await page.waitForTimeout(5000);

            // Collect FPS data
            const fpsData = await page.evaluate(() => window.fpsData || []);
            averageFPS = fpsData.length > 0 
                ? Math.round(fpsData.reduce((a, b) => a + b) / fpsData.length)
                : 0;

        } catch (error) {
            errors.push(`Game test error: ${error.message}`);
        }

        return { averageFPS, errors };
    }

    async testMemoryUsage(page) {
        try {
            const metrics = await page.metrics();
            const performanceMetrics = await page.evaluate(() => {
                if (performance.memory) {
                    return {
                        usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1048576),
                        totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1048576)
                    };
                }
                return { usedJSHeapSize: 0, totalJSHeapSize: 0 };
            });

            return performanceMetrics;
        } catch (error) {
            return { usedJSHeapSize: 0, totalJSHeapSize: 0 };
        }
    }

    async testUIElements(page) {
        try {
            const elements = await page.evaluate(() => {
                const checkElements = [
                    { selector: '.hero-section', name: 'Hero' },
                    { selector: '.stats-section', name: 'Stats' },
                    { selector: '.game-section', name: 'Game' },
                    { selector: '.purchase-section', name: 'Purchase' },
                    { selector: '.faq-section', name: 'FAQ' },
                    { selector: '.stat-card', name: 'Stat Cards' },
                    { selector: '.btn-primary', name: 'Primary Buttons' },
                    { selector: '.mobile-menu', name: 'Mobile Menu' }
                ];

                const results = checkElements.map(item => {
                    const el = document.querySelector(item.selector);
                    if (!el) return { ...item, visible: false };
                    
                    const rect = el.getBoundingClientRect();
                    const visible = rect.width > 0 && rect.height > 0 && 
                                  rect.top < window.innerHeight && 
                                  rect.bottom > 0;
                    
                    return { ...item, visible };
                });

                return results;
            });

            const visibleCount = elements.filter(el => el.visible).length;
            return { visibleCount, totalCount: elements.length, elements };
        } catch (error) {
            return { visibleCount: 0, totalCount: 0, error: error.message };
        }
    }

    async testPurchaseFlow(page) {
        const errors = [];
        let success = false;

        try {
            // Navigate to purchase section
            await page.evaluate(() => {
                const purchaseSection = document.querySelector('.purchase-section');
                if (purchaseSection) {
                    purchaseSection.scrollIntoView({ behavior: 'smooth' });
                }
            });

            await page.waitForTimeout(1000);

            // Check if purchase form is visible
            const formVisible = await page.evaluate(() => {
                const form = document.querySelector('#purchaseForm, .purchase-form');
                return form && form.offsetHeight > 0;
            });

            if (!formVisible) {
                errors.push('Purchase form not visible');
                return { success: false, errors };
            }

            // Test tier selection
            const tierButtons = await page.$$('.tier-button, .game-tier-btn');
            if (tierButtons.length > 0) {
                await tierButtons[0].tap();
                await page.waitForTimeout(500);
            }

            // Test batch counter
            const increaseBtn = await page.$('#increase-batch, .batch-increase');
            if (increaseBtn) {
                await increaseBtn.tap();
                await page.waitForTimeout(200);
            }

            // Check if RGB invoice input is accessible
            const invoiceInput = await page.$('#rgbInvoice, input[name="rgbInvoice"]');
            if (invoiceInput) {
                await invoiceInput.tap();
                await page.waitForTimeout(200);
                success = true;
            } else {
                errors.push('RGB invoice input not found');
            }

        } catch (error) {
            errors.push(`Purchase flow error: ${error.message}`);
        }

        return { success, errors };
    }

    async runFullTest() {
        console.log('📱 LIGHTCAT Mobile Device Testing Matrix');
        console.log('========================================\n');

        for (const device of DEVICES) {
            for (const network of NETWORK_CONDITIONS) {
                await this.testDevice(device, network);
                // Cool down between tests
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        this.generateReport();
    }

    generateReport() {
        console.log('\n\n📊 MOBILE TESTING REPORT');
        console.log('='.repeat(50));

        // Group results by device
        const deviceGroups = {};
        this.results.forEach(result => {
            if (!deviceGroups[result.device]) {
                deviceGroups[result.device] = [];
            }
            deviceGroups[result.device].push(result);
        });

        Object.entries(deviceGroups).forEach(([device, results]) => {
            console.log(`\n📱 ${device}`);
            results.forEach(result => {
                if (result.error) {
                    console.log(`  ❌ ${result.network}: ERROR - ${result.error}`);
                } else {
                    const status = result.loadTime < 3000 && result.gameFPS > 30 ? '✅' : '⚠️';
                    console.log(`  ${status} ${result.network}: Load ${result.loadTime}ms, FPS ${result.gameFPS}, Touch ${result.touchResponse}ms`);
                }
            });
        });

        // Summary statistics
        const avgLoadTime = this.results
            .filter(r => r.loadTime)
            .reduce((sum, r) => sum + r.loadTime, 0) / this.results.length;
        
        const avgFPS = this.results
            .filter(r => r.gameFPS)
            .reduce((sum, r) => sum + r.gameFPS, 0) / this.results.length;

        console.log('\n📈 Summary:');
        console.log(`  Average load time: ${Math.round(avgLoadTime)}ms`);
        console.log(`  Average game FPS: ${Math.round(avgFPS)}`);
        console.log(`  Tests passed: ${this.results.filter(r => !r.error).length}/${this.results.length}`);
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new MobileDeviceTester();
    tester.runFullTest().catch(console.error);
}

module.exports = MobileDeviceTester;