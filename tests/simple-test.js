const { chromium } = require('playwright');

async function simpleTest() {
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: true });
    
    console.log('Creating page...');
    const page = await browser.newPage();
    
    try {
        console.log('Navigating to rgblightcat.com...');
        await page.goto('https://rgblightcat.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        console.log('Page loaded, taking screenshot...');
        await page.screenshot({ path: '/root/initial-page.png', fullPage: true });
        
        console.log('Getting page title...');
        const title = await page.title();
        console.log('Page title:', title);
        
        console.log('Looking for buttons...');
        const buttons = await page.locator('button').all();
        console.log(`Found ${buttons.length} buttons`);
        
        for (let i = 0; i < Math.min(buttons.length, 20); i++) {
            try {
                const text = await buttons[i].textContent();
                const isVisible = await buttons[i].isVisible();
                console.log(`Button ${i + 1}: "${text}" (visible: ${isVisible})`);
            } catch (e) {
                console.log(`Button ${i + 1}: Error getting text - ${e.message}`);
            }
        }
        
    } catch (error) {
        console.error('Navigation error:', error);
    } finally {
        console.log('Closing browser...');
        await browser.close();
        console.log('Done!');
    }
}

simpleTest();