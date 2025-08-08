const playwright = require('playwright');

async function test() {
    try {
        console.log('Creating browser...');
        const browser = await playwright.chromium.launch({ headless: true });
        
        console.log('Creating page...');
        const page = await browser.newPage();
        
        console.log('Going to site...');
        await page.goto('https://rgblightcat.com');
        
        console.log('Taking screenshot...');
        await page.screenshot({ path: '/root/test-screenshot.png' });
        
        console.log('Getting title...');
        const title = await page.title();
        console.log('Title:', title);
        
        await browser.close();
        console.log('Test completed successfully!');
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

test();