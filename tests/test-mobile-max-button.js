const { chromium } = require('playwright');

async function testMobileMaxButton() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }, // iPhone SE dimensions
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('Navigating to https://rgblightcat.com...');
    await page.goto('https://rgblightcat.com', { waitUntil: 'networkidle' });
    
    // Wait for the page to load completely
    await page.waitForTimeout(3000);
    
    // Look for the purchase section - it might be in a modal or main content
    console.log('Looking for purchase section...');
    
    // Try to find the batch selector area
    const batchSelector = await page.locator('[data-testid="batch-selector"], .batch-selector, .batch-count-container, .quantity-controls, .batch-controls').first();
    
    if (await batchSelector.count() === 0) {
      // Try to trigger purchase flow by looking for a "Buy" or "Purchase" button
      const purchaseButton = await page.locator('button:has-text("Buy"), button:has-text("Purchase"), button:has-text("Get"), .buy-btn, .purchase-btn').first();
      if (await purchaseButton.count() > 0) {
        console.log('Found purchase button, clicking to open purchase section...');
        await purchaseButton.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Take a full page screenshot first
    console.log('Taking full page screenshot...');
    await page.screenshot({ path: '/root/mobile-full-page.png', fullPage: true });
    
    // Look for batch selector elements more broadly
    const maxButton = await page.locator('button:has-text("MAX"), .max-btn, [data-action="max"]').first();
    const minusButton = await page.locator('button:has-text("-"), .minus-btn, [data-action="minus"]').first();
    const plusButton = await page.locator('button:has-text("+"), .plus-btn, [data-action="plus"]').first();
    
    console.log(`Found MAX button: ${await maxButton.count() > 0}`);
    console.log(`Found minus button: ${await minusButton.count() > 0}`);
    console.log(`Found plus button: ${await plusButton.count() > 0}`);
    
    if (await maxButton.count() > 0) {
      // Scroll to the MAX button
      await maxButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      
      // Take screenshot of the batch selector area
      console.log('Taking screenshot of batch selector area...');
      const batchContainer = maxButton.locator('..').first(); // Parent element
      await batchContainer.screenshot({ path: '/root/batch-selector-area.png' });
      
      // Get computed styles for MAX button
      console.log('Getting computed styles for MAX button...');
      const maxStyles = await maxButton.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          width: computed.width,
          height: computed.height,
          borderRadius: computed.borderRadius,
          minWidth: computed.minWidth,
          minHeight: computed.minHeight,
          padding: computed.padding,
          fontSize: computed.fontSize,
          display: computed.display
        };
      });
      
      console.log('MAX button styles:', maxStyles);
      
      // Get computed styles for +/- buttons if they exist
      let minusStyles = null;
      let plusStyles = null;
      
      if (await minusButton.count() > 0) {
        minusStyles = await minusButton.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            width: computed.width,
            height: computed.height,
            borderRadius: computed.borderRadius,
            minWidth: computed.minWidth,
            minHeight: computed.minHeight,
            padding: computed.padding,
            fontSize: computed.fontSize
          };
        });
        console.log('Minus button styles:', minusStyles);
      }
      
      if (await plusButton.count() > 0) {
        plusStyles = await plusButton.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            width: computed.width,
            height: computed.height,
            borderRadius: computed.borderRadius,
            minWidth: computed.minWidth,
            minHeight: computed.minHeight,
            padding: computed.padding,
            fontSize: computed.fontSize
          };
        });
        console.log('Plus button styles:', plusStyles);
      }
      
      // Analysis
      console.log('\n=== ANALYSIS ===');
      
      // Check if MAX button is circular (border-radius: 50%)
      const isCircular = maxStyles.borderRadius === '50%' || 
                        (maxStyles.borderRadius.includes('px') && 
                         parseFloat(maxStyles.borderRadius) >= Math.min(parseFloat(maxStyles.width), parseFloat(maxStyles.height)) / 2);
      
      console.log(`MAX button is circular: ${isCircular}`);
      console.log(`MAX button border-radius: ${maxStyles.borderRadius}`);
      
      // Compare sizes
      const compareSize = (style1, style2, buttonName) => {
        if (!style2) return `${buttonName} button not found for comparison`;
        
        const width1 = parseFloat(style1.width);
        const height1 = parseFloat(style1.height);
        const width2 = parseFloat(style2.width);
        const height2 = parseFloat(style2.height);
        
        const sameWidth = Math.abs(width1 - width2) < 2; // Allow 2px difference
        const sameHeight = Math.abs(height1 - height2) < 2;
        
        return `MAX vs ${buttonName}: Width match: ${sameWidth} (${width1}px vs ${width2}px), Height match: ${sameHeight} (${height1}px vs ${height2}px)`;
      };
      
      if (minusStyles) console.log(compareSize(maxStyles, minusStyles, 'Minus'));
      if (plusStyles) console.log(compareSize(maxStyles, plusStyles, 'Plus'));
      
      // Check if buttons meet mobile accessibility requirements (44px min)
      const maxWidth = parseFloat(maxStyles.width);
      const maxHeight = parseFloat(maxStyles.height);
      const meetsAccessibility = maxWidth >= 44 && maxHeight >= 44;
      
      console.log(`MAX button meets mobile accessibility (44px min): ${meetsAccessibility}`);
      console.log(`MAX button size: ${maxWidth}px x ${maxHeight}px`);
      
    } else {
      console.log('MAX button not found on the page');
      
      // Let's see what buttons are available
      const allButtons = await page.locator('button').all();
      console.log(`Total buttons found: ${allButtons.length}`);
      
      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        const buttonText = await allButtons[i].textContent();
        console.log(`Button ${i + 1}: "${buttonText}"`);
      }
    }
    
  } catch (error) {
    console.error('Error during testing:', error);
    await page.screenshot({ path: '/root/error-screenshot.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Run the test
testMobileMaxButton().catch(console.error);