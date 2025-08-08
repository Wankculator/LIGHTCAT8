#!/usr/bin/env node

const { chromium } = require('playwright');

async function testMaxButton() {
  const browser = await chromium.launch({ headless: false });
  
  try {
    // Desktop test
    console.log('🖥️  Testing Desktop View...');
    const desktopPage = await browser.newPage();
    await desktopPage.setViewportSize({ width: 1920, height: 1080 });
    await desktopPage.goto('https://rgblightcat.com');
    await desktopPage.waitForTimeout(2000);
    
    // Scroll to purchase section
    await desktopPage.evaluate(() => {
      document.querySelector('#purchase').scrollIntoView({ behavior: 'smooth' });
    });
    await desktopPage.waitForTimeout(1000);
    
    // Get button styles
    const desktopStyles = await desktopPage.evaluate(() => {
      const decrease = document.querySelector('#decreaseBatch');
      const increase = document.querySelector('#increaseBatch');
      const max = document.querySelector('#maxBatch');
      
      const getStyles = (el) => {
        const computed = window.getComputedStyle(el);
        return {
          width: computed.width,
          height: computed.height,
          borderRadius: computed.borderRadius,
          border: computed.border,
          padding: computed.padding,
          fontSize: computed.fontSize,
          display: computed.display,
          alignItems: computed.alignItems,
          justifyContent: computed.justifyContent
        };
      };
      
      return {
        decrease: getStyles(decrease),
        increase: getStyles(increase),
        max: getStyles(max)
      };
    });
    
    console.log('Desktop - Decrease button:', desktopStyles.decrease);
    console.log('Desktop - MAX button:', desktopStyles.max);
    
    // Mobile test
    console.log('\n📱 Testing Mobile View (375px)...');
    const mobilePage = await browser.newPage();
    await mobilePage.setViewportSize({ width: 375, height: 667 });
    await mobilePage.goto('https://rgblightcat.com');
    await mobilePage.waitForTimeout(2000);
    
    // Scroll to purchase section
    await mobilePage.evaluate(() => {
      document.querySelector('#purchase').scrollIntoView({ behavior: 'smooth' });
    });
    await mobilePage.waitForTimeout(1000);
    
    const mobileStyles = await mobilePage.evaluate(() => {
      const decrease = document.querySelector('#decreaseBatch');
      const increase = document.querySelector('#increaseBatch');
      const max = document.querySelector('#maxBatch');
      
      const getStyles = (el) => {
        const computed = window.getComputedStyle(el);
        return {
          width: computed.width,
          height: computed.height,
          borderRadius: computed.borderRadius,
          fontSize: computed.fontSize
        };
      };
      
      return {
        decrease: getStyles(decrease),
        increase: getStyles(increase),
        max: getStyles(max)
      };
    });
    
    console.log('Mobile - Decrease button:', mobileStyles.decrease);
    console.log('Mobile - MAX button:', mobileStyles.max);
    
    // Take screenshots
    await desktopPage.screenshot({ path: 'desktop-max-button.png', fullPage: false });
    await mobilePage.screenshot({ path: 'mobile-max-button.png', fullPage: false });
    
    console.log('\n✅ Screenshots saved!');
    
  } finally {
    await browser.close();
  }
}

testMaxButton().catch(console.error);