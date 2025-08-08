const { chromium } = require('playwright');

async function test() {
  console.log('Starting Playwright test...');
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://rgblightcat.com');
    console.log('Successfully loaded page');
    await browser.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();