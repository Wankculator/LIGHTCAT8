#!/usr/bin/env node

/**
 * Full Game User Simulation
 * Tests both desktop and mobile flows
 */

const puppeteer = require('puppeteer');
const chalk = require('chalk');

class GameSimulator {
    constructor() {
        this.results = {
            desktop: {
                passed: [],
                failed: [],
                errors: [],
                performance: {}
            },
            mobile: {
                passed: [],
                failed: [],
                errors: [],
                performance: {}
            }
        };
    }

    log(type, message, device = 'desktop') {
        const prefix = device === 'desktop' ? '🖥️  ' : '📱 ';
        if (type === 'pass') {
            console.log(chalk.green(`${prefix}✅ ${message}`));
            this.results[device].passed.push(message);
        } else if (type === 'fail') {
            console.log(chalk.red(`${prefix}❌ ${message}`));
            this.results[device].failed.push(message);
        } else if (type === 'error') {
            console.log(chalk.yellow(`${prefix}⚠️  ${message}`));
            this.results[device].errors.push(message);
        } else {
            console.log(chalk.cyan(`${prefix}${message}`));
        }
    }

    async simulateDesktop() {
        console.log(chalk.bold('\n=== DESKTOP SIMULATION ===\n'));
        
        const browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1920, height: 1080 }
        });
        
        try {
            const page = await browser.newPage();
            
            // Monitor console errors
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    this.log('error', `Console error: ${msg.text()}`, 'desktop');
                }
            });
            
            // 1. Visit index.html
            await page.goto('http://localhost:8082', { waitUntil: 'networkidle2' });
            this.log('pass', 'Loaded index.html', 'desktop');
            
            // Check if game section exists
            const gameSection = await page.$('#game-section');
            if (gameSection) {
                this.log('pass', 'Game section found', 'desktop');
            } else {
                this.log('fail', 'Game section not found', 'desktop');
            }
            
            // 2. Click START GAME button
            await page.waitForSelector('#startGameBtn', { timeout: 5000 });
            await page.click('#startGameBtn');
            this.log('pass', 'Clicked START GAME button', 'desktop');
            
            // 3. Check if game iframe loads
            await page.waitForSelector('#gameFrame', { visible: true, timeout: 10000 });
            const gameFrame = await page.$('#gameFrame');
            
            if (gameFrame) {
                this.log('pass', 'Game iframe loaded', 'desktop');
                
                // Check iframe src
                const iframeSrc = await page.$(() => { throw new Error("eval is not allowed"); })('#gameFrame', el => el.src);
                if (iframeSrc.includes('game.html')) {
                    this.log('pass', 'Game iframe has correct src', 'desktop');
                } else {
                    this.log('fail', `Game iframe has wrong src: ${iframeSrc}`, 'desktop');
                }
                
                // Try to access game content
                const frame = await gameFrame.contentFrame();
                if (frame) {
                    // Wait for game canvas
                    await frame.waitForSelector('#game-canvas', { timeout: 10000 });
                    this.log('pass', 'Game canvas loaded inside iframe', 'desktop');
                    
                    // Check for mobile controls (should NOT be visible on desktop)
                    const mobileControls = await frame.$(() => { throw new Error("eval is not allowed"); })('.mobile-controls', el => {
                        return window.getComputedStyle(el).display;
                    }).catch(() => null);
                    
                    if (mobileControls === 'none' || !mobileControls) {
                        this.log('pass', 'Mobile controls correctly hidden on desktop', 'desktop');
                    } else {
                        this.log('fail', `Mobile controls showing on desktop: display=${mobileControls}`, 'desktop');
                    }
                    
                    // Check game state
                    const gameState = await frame.evaluate(() => {
                        return window.game ? window.game.gameState : null;
                    });
                    
                    if (gameState === 'playing') {
                        this.log('pass', 'Game is in playing state', 'desktop');
                    } else {
                        this.log('fail', `Game state is: ${gameState}`, 'desktop');
                    }
                }
            } else {
                this.log('fail', 'Game iframe not found', 'desktop');
            }
            
            // Performance metrics
            const metrics = await page.metrics();
            this.results.desktop.performance = {
                jsHeapUsed: Math.round(metrics.JSHeapUsedSize / 1024 / 1024) + ' MB',
                domNodes: metrics.Nodes,
                layoutDuration: Math.round(metrics.LayoutDuration * 1000) + ' ms'
            };
            
        } catch (error) {
            this.log('error', `Desktop simulation error: ${error.message}`, 'desktop');
        } finally {
            await browser.close();
        }
    }

    async simulateMobile() {
        console.log(chalk.bold('\n=== MOBILE SIMULATION ===\n'));
        
        const browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { 
                width: 375, 
                height: 812,
                isMobile: true,
                hasTouch: true
            }
        });
        
        try {
            const page = await browser.newPage();
            
            // Set mobile user agent
            await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1');
            
            // Monitor console errors
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    this.log('error', `Console error: ${msg.text()}`, 'mobile');
                }
            });
            
            // 1. Visit index.html
            await page.goto('http://localhost:8082', { waitUntil: 'networkidle2' });
            this.log('pass', 'Loaded index.html on mobile', 'mobile');
            
            // 2. Click START GAME button
            await page.waitForSelector('#startGameBtn', { timeout: 5000 });
            await page.click('#startGameBtn');
            this.log('pass', 'Clicked START GAME button on mobile', 'mobile');
            
            // 3. Check if redirected to game.html
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
            const currentUrl = page.url();
            
            if (currentUrl.includes('game.html')) {
                this.log('pass', 'Correctly redirected to game.html on mobile', 'mobile');
                
                // Wait for game to load
                await page.waitForSelector('#game-canvas', { timeout: 10000 });
                this.log('pass', 'Game canvas loaded', 'mobile');
                
                // Check for mobile controls
                const mobileControlsVisible = await page.$(() => { throw new Error("eval is not allowed"); })('.mobile-controls', el => {
                    const style = window.getComputedStyle(el);
                    return style.display !== 'none' && style.visibility !== 'hidden';
                }).catch(() => false);
                
                if (mobileControlsVisible) {
                    this.log('pass', 'Mobile controls visible on mobile', 'mobile');
                    
                    // Check joystick
                    const joystickExists = await page.$('#mobile-joystick');
                    if (joystickExists) {
                        this.log('pass', 'Mobile joystick present', 'mobile');
                    } else {
                        this.log('fail', 'Mobile joystick missing', 'mobile');
                    }
                    
                    // Check jump button
                    const jumpButtonExists = await page.$('#mobile-jump');
                    if (jumpButtonExists) {
                        this.log('pass', 'Mobile jump button present', 'mobile');
                    } else {
                        this.log('fail', 'Mobile jump button missing', 'mobile');
                    }
                } else {
                    this.log('fail', 'Mobile controls not visible on mobile', 'mobile');
                }
                
                // Check game state
                const gameState = await page.evaluate(() => {
                    return window.game ? window.game.gameState : null;
                });
                
                if (gameState === 'playing') {
                    this.log('pass', 'Game is in playing state on mobile', 'mobile');
                } else {
                    this.log('fail', `Game state on mobile is: ${gameState}`, 'mobile');
                }
                
            } else {
                this.log('fail', `Did not redirect to game.html, still on: ${currentUrl}`, 'mobile');
            }
            
            // Performance metrics
            const metrics = await page.metrics();
            this.results.mobile.performance = {
                jsHeapUsed: Math.round(metrics.JSHeapUsedSize / 1024 / 1024) + ' MB',
                domNodes: metrics.Nodes,
                layoutDuration: Math.round(metrics.LayoutDuration * 1000) + ' ms'
            };
            
        } catch (error) {
            this.log('error', `Mobile simulation error: ${error.message}`, 'mobile');
        } finally {
            await browser.close();
        }
    }

    async run() {
        console.log(chalk.bold.blue('\n🎮 LIGHTCAT GAME FULL USER SIMULATION\n'));
        
        // Run desktop simulation
        await this.simulateDesktop();
        
        // Run mobile simulation
        await this.simulateMobile();
        
        // Print summary
        this.printSummary();
    }

    printSummary() {
        console.log(chalk.bold('\n=== SIMULATION SUMMARY ===\n'));
        
        // Desktop results
        console.log(chalk.bold('🖥️  Desktop Results:'));
        console.log(chalk.green(`  ✅ Passed: ${this.results.desktop.passed.length}`));
        console.log(chalk.red(`  ❌ Failed: ${this.results.desktop.failed.length}`));
        console.log(chalk.yellow(`  ⚠️  Errors: ${this.results.desktop.errors.length}`));
        console.log(chalk.cyan('  📊 Performance:'), this.results.desktop.performance);
        
        // Mobile results
        console.log(chalk.bold('\n📱 Mobile Results:'));
        console.log(chalk.green(`  ✅ Passed: ${this.results.mobile.passed.length}`));
        console.log(chalk.red(`  ❌ Failed: ${this.results.mobile.failed.length}`));
        console.log(chalk.yellow(`  ⚠️  Errors: ${this.results.mobile.errors.length}`));
        console.log(chalk.cyan('  📊 Performance:'), this.results.mobile.performance);
        
        // Failed tests details
        if (this.results.desktop.failed.length > 0) {
            console.log(chalk.red('\n🖥️  Desktop Failed Tests:'));
            this.results.desktop.failed.forEach(test => {
                console.log(chalk.red(`  - ${test}`));
            });
        }
        
        if (this.results.mobile.failed.length > 0) {
            console.log(chalk.red('\n📱 Mobile Failed Tests:'));
            this.results.mobile.failed.forEach(test => {
                console.log(chalk.red(`  - ${test}`));
            });
        }
        
        // Overall status
        const allPassed = 
            this.results.desktop.failed.length === 0 && 
            this.results.mobile.failed.length === 0 &&
            this.results.desktop.errors.length === 0 &&
            this.results.mobile.errors.length === 0;
            
        console.log('\n' + chalk.bold(allPassed ? 
            chalk.green('✅ ALL TESTS PASSED!') : 
            chalk.red('❌ SOME TESTS FAILED!')
        ));
    }
}

// Check if puppeteer is installed
try {
    require.resolve('puppeteer');
} catch (e) {
    console.log(chalk.red('Puppeteer not installed. Installing...'));
    require('child_process').execSync('npm install puppeteer', { stdio: 'inherit' });
}

// Run simulation
const simulator = new GameSimulator();
simulator.run().catch(console.error);