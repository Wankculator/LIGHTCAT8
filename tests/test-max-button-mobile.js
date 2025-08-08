const { chromium } = require('playwright');

async function testMobileMaxButton() {
  console.log('Starting mobile MAX button test...');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }, // iPhone SE dimensions
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('Navigating to https://rgblightcat.com...');
    
    // Set up console logging from the page
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
    await page.goto('https://rgblightcat.com', { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('Page loaded successfully');
    
    // Wait for page to stabilize
    await page.waitForTimeout(3000);
    
    // Take initial screenshot
    console.log('Taking initial full page screenshot...');
    await page.screenshot({ 
      path: '/root/mobile-initial.png', 
      fullPage: true 
    });
    
    console.log('Looking for purchase/buy buttons to open purchase flow...');
    
    // Look for various purchase triggers
    const purchaseTriggers = [
      'button:has-text("Buy")',
      'button:has-text("Purchase")', 
      'button:has-text("Get")',
      'button:has-text("Start")',
      '.buy-btn',
      '.purchase-btn',
      '.cta-button',
      '[data-action="purchase"]'
    ];
    
    let purchaseOpened = false;
    for (const selector of purchaseTriggers) {
      const button = page.locator(selector).first();
      if (await button.count() > 0) {
        console.log(`Found purchase trigger: ${selector}`);
        try {
          await button.click();
          await page.waitForTimeout(2000);
          purchaseOpened = true;
          break;
        } catch (e) {
          console.log(`Failed to click ${selector}:`, e.message);
        }
      }
    }
    
    if (!purchaseOpened) {
      console.log('No purchase button found, checking for modal triggers...');
      // Try clicking anywhere that might open a modal
      const body = page.locator('body');
      await body.click();
      await page.waitForTimeout(1000);
    }
    
    // Take screenshot after potential modal opening
    console.log('Taking screenshot after purchase flow attempt...');
    await page.screenshot({ 
      path: '/root/mobile-after-purchase.png', 
      fullPage: true 
    });
    
    // Look for batch controls with various selectors
    console.log('Searching for batch control elements...');
    
    const batchControlSelectors = [
      'button:has-text("MAX")',
      '.max-btn',
      '[data-action="max"]',
      'button[data-testid="max-button"]',
      '.batch-max',
      '.quantity-max'
    ];
    
    const plusMinusSelectors = [
      'button:has-text("+")',
      'button:has-text("-")',
      '.plus-btn',
      '.minus-btn',
      '[data-action="plus"]',
      '[data-action="minus"]',
      '.quantity-plus',
      '.quantity-minus'
    ];
    
    let maxButton = null;
    let plusButton = null;
    let minusButton = null;
    
    // Find MAX button
    for (const selector of batchControlSelectors) {
      const button = page.locator(selector).first();
      if (await button.count() > 0) {
        console.log(`Found MAX button with selector: ${selector}`);
        maxButton = button;
        break;
      }
    }
    
    // Find plus/minus buttons
    for (const selector of plusMinusSelectors) {
      const buttons = page.locator(selector);
      const count = await buttons.count();
      if (count > 0) {
        console.log(`Found ${count} buttons with selector: ${selector}`);
        for (let i = 0; i < count; i++) {
          const buttonText = await buttons.nth(i).textContent();
          if (buttonText.includes('+')) {
            plusButton = buttons.nth(i);
            console.log('Found plus button');
          } else if (buttonText.includes('-')) {
            minusButton = buttons.nth(i);
            console.log('Found minus button');
          }
        }
      }
    }
    
    if (!maxButton) {
      console.log('MAX button not found. Listing all buttons on page...');
      const allButtons = await page.locator('button').all();
      console.log(`Total buttons found: ${allButtons.length}`);
      
      for (let i = 0; i < Math.min(allButtons.length, 20); i++) {
        try {
          const buttonText = await allButtons[i].textContent();
          const isVisible = await allButtons[i].isVisible();
          console.log(`Button ${i + 1}: "${buttonText}" (visible: ${isVisible})`);
        } catch (e) {
          console.log(`Button ${i + 1}: Error getting text`);
        }
      }
      
      // Also check for input elements that might be styled as buttons
      const inputs = await page.locator('input[type="button"], input[type="submit"]').all();
      console.log(`Input buttons found: ${inputs.length}`);
      
      for (let i = 0; i < inputs.length; i++) {
        try {
          const value = await inputs[i].getAttribute('value');
          console.log(`Input button ${i + 1}: value="${value}"`);
        } catch (e) {
          console.log(`Input button ${i + 1}: Error getting value`);
        }
      }
      
      return;
    }
    
    // Scroll to MAX button and take focused screenshot
    console.log('Scrolling to MAX button...');
    await maxButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    
    // Take screenshot of the batch control area
    console.log('Taking screenshot of batch control area...');
    try {
      // Try to get the parent container
      const container = maxButton.locator('..').first();
      await container.screenshot({ path: '/root/batch-controls.png' });
    } catch (e) {
      console.log('Could not screenshot container, taking element screenshot...');
      await maxButton.screenshot({ path: '/root/max-button-only.png' });
    }
    
    // Get computed styles
    console.log('Getting computed styles for MAX button...');
    const maxStyles = await maxButton.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        // Dimensions
        width: computed.width,
        height: computed.height,
        minWidth: computed.minWidth,
        minHeight: computed.minHeight,
        
        // Border radius
        borderRadius: computed.borderRadius,
        borderTopLeftRadius: computed.borderTopLeftRadius,
        borderTopRightRadius: computed.borderTopRightRadius,
        borderBottomLeftRadius: computed.borderBottomLeftRadius,
        borderBottomRightRadius: computed.borderBottomRightRadius,
        
        // Positioning and display
        display: computed.display,
        position: computed.position,
        padding: computed.padding,
        margin: computed.margin,
        
        // Typography
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        textAlign: computed.textAlign,
        
        // Colors
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        borderColor: computed.borderColor,
        
        // Actual rendered dimensions
        actualWidth: rect.width,
        actualHeight: rect.height
      };
    });
    
    console.log('MAX button computed styles:', JSON.stringify(maxStyles, null, 2));
    
    // Get styles for comparison buttons if they exist
    let plusStyles = null;
    let minusStyles = null;
    
    if (plusButton) {
      console.log('Getting plus button styles...');
      plusStyles = await plusButton.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          width: computed.width,
          height: computed.height,
          borderRadius: computed.borderRadius,
          actualWidth: rect.width,
          actualHeight: rect.height
        };
      });
      console.log('Plus button styles:', JSON.stringify(plusStyles, null, 2));
    }
    
    if (minusButton) {
      console.log('Getting minus button styles...');
      minusStyles = await minusButton.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          width: computed.width,
          height: computed.height,
          borderRadius: computed.borderRadius,
          actualWidth: rect.width,
          actualHeight: rect.height
        };
      });
      console.log('Minus button styles:', JSON.stringify(minusStyles, null, 2));
    }
    
    // Analysis
    console.log('\n=== ANALYSIS RESULTS ===');
    
    // Check if circular (border-radius: 50%)
    const isCircular = maxStyles.borderRadius === '50%' || maxStyles.borderRadius.includes('50%');
    console.log(`MAX button has circular border-radius (50%): ${isCircular}`);
    console.log(`MAX button border-radius value: ${maxStyles.borderRadius}`);
    
    // Check actual dimensions
    const actualWidth = maxStyles.actualWidth;
    const actualHeight = maxStyles.actualHeight;
    console.log(`MAX button actual dimensions: ${actualWidth}px x ${actualHeight}px`);
    
    // Check mobile accessibility compliance (44px minimum)
    const meetsAccessibility = actualWidth >= 44 && actualHeight >= 44;
    console.log(`Meets mobile accessibility requirements (44px min): ${meetsAccessibility}`);
    
    // Compare with plus/minus buttons
    if (plusStyles) {
      const widthMatch = Math.abs(actualWidth - plusStyles.actualWidth) < 2;
      const heightMatch = Math.abs(actualHeight - plusStyles.actualHeight) < 2;
      console.log(`Size comparison with plus button: Width match: ${widthMatch} (${actualWidth}px vs ${plusStyles.actualWidth}px), Height match: ${heightMatch} (${actualHeight}px vs ${plusStyles.actualHeight}px)`);
    }
    
    if (minusStyles) {
      const widthMatch = Math.abs(actualWidth - minusStyles.actualWidth) < 2;
      const heightMatch = Math.abs(actualHeight - minusStyles.actualHeight) < 2;
      console.log(`Size comparison with minus button: Width match: ${widthMatch} (${actualWidth}px vs ${minusStyles.actualWidth}px), Height match: ${heightMatch} (${actualHeight}px vs ${minusStyles.actualHeight}px)`);
    }
    
    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`✓ MAX button found: ${maxButton ? 'YES' : 'NO'}`);
    console.log(`✓ Is circular (50% border-radius): ${isCircular ? 'YES' : 'NO'}`);
    console.log(`✓ Meets accessibility standards: ${meetsAccessibility ? 'YES' : 'NO'}`);
    console.log(`✓ Same size as +/- buttons: ${(plusStyles || minusStyles) ? 'CHECKED ABOVE' : 'NO +/- BUTTONS FOUND'}`);
    
  } catch (error) {
    console.error('Error during testing:', error);
    await page.screenshot({ path: '/root/error-screenshot.png', fullPage: true });
  } finally {
    console.log('Closing browser...');
    await browser.close();
  }
}

// Run the test
testMobileMaxButton().catch(console.error);