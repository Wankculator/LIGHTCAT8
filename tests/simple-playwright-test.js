const { chromium } = require('playwright');

async function testBasic() {
    console.log('Starting basic Playwright test...');
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        console.log('Navigating to localhost:8082...');
        await page.goto('http://localhost:8082', { timeout: 10000 });
        
        const title = await page.title();
        console.log('Page title:', title);
        
        console.log('✅ Basic test passed!');
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

testBasic();