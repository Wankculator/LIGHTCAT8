const { chromium } = require('playwright');

async function testClaimButton() {
  console.log('🔍 Testing Claim Button Visibility on Desktop');
  console.log('=========================================\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
    });
    
    const page = await context.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
      }
    });
    
    // Test 1: Load game page
    console.log('1. Loading game page...');
    await page.goto('https://rgblightcat.com/game.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Wait for game to initialize
    
    // Test 2: Simulate winning game score (Gold tier - 30 points)
    console.log('2. Simulating game win with Gold tier score...');
    
    // Trigger game over with high score
    await page.evaluate(() => {
      // Find game instance and trigger game over
      if (window.game && window.game.showGameOver) {
        window.game.showGameOver(30); // Gold tier score
      } else if (window.gameInstance) {
        window.gameInstance.gameOver(30);
      } else {
        // Fallback: dispatch custom event
        window.dispatchEvent(new CustomEvent('gameOver', { detail: { score: 30 } }));
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Test 3: Check game over screen visibility
    console.log('3. Checking game over screen...');
    const gameOverVisible = await page.isVisible('#game-over');
    console.log(`   Game Over Screen: ${gameOverVisible ? '✅ Visible' : '❌ Not Visible'}`);
    
    // Test 4: Analyze claim button
    console.log('\n4. Analyzing CLAIM button...');
    
    // Check button existence
    const claimButton = await page.$('#unlock-tier');
    if (!claimButton) {
      console.log('   ❌ CLAIM button not found!');
      return;
    }
    
    // Get button styles
    const buttonStyles = await page.evaluate(() => {
      const btn = document.getElementById('unlock-tier');
      if (!btn) return null;
      
      const computed = window.getComputedStyle(btn);
      const rect = btn.getBoundingClientRect();
      
      return {
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        border: computed.border,
        position: computed.position,
        zIndex: computed.zIndex,
        width: rect.width,
        height: rect.height,
        isVisible: rect.width > 0 && rect.height > 0,
        text: btn.textContent.trim()
      };
    });
    
    console.log('   Button Properties:');
    console.log(`   - Display: ${buttonStyles.display}`);
    console.log(`   - Visibility: ${buttonStyles.visibility}`);
    console.log(`   - Opacity: ${buttonStyles.opacity}`);
    console.log(`   - Background: ${buttonStyles.backgroundColor}`);
    console.log(`   - Text Color: ${buttonStyles.color}`);
    console.log(`   - Border: ${buttonStyles.border}`);
    console.log(`   - Z-Index: ${buttonStyles.zIndex}`);
    console.log(`   - Dimensions: ${buttonStyles.width}x${buttonStyles.height}`);
    console.log(`   - Text: "${buttonStyles.text}"`);
    
    // Test 5: Screenshot the issue
    console.log('\n5. Taking screenshot...');
    await page.screenshot({ 
      path: '/root/claim-button-issue.png',
      fullPage: true 
    });
    console.log('   Screenshot saved: /root/claim-button-issue.png');
    
    // Test 6: Check for CSS conflicts
    console.log('\n6. Checking for CSS conflicts...');
    const cssIssues = await page.evaluate(() => {
      const btn = document.getElementById('unlock-tier');
      if (!btn) return { error: 'Button not found' };
      
      // Check all stylesheets for rules affecting the button
      const issues = [];
      const sheets = document.styleSheets;
      
      for (let sheet of sheets) {
        try {
          const rules = sheet.cssRules || sheet.rules;
          for (let rule of rules) {
            if (rule.selectorText && btn.matches(rule.selectorText)) {
              if (rule.style.backgroundColor === 'black' || 
                  rule.style.background === 'black' ||
                  rule.style.color === 'black') {
                issues.push({
                  selector: rule.selectorText,
                  styles: rule.style.cssText,
                  source: sheet.href || 'inline'
                });
              }
            }
          }
        } catch (e) {
          // Cross-origin stylesheets
        }
      }
      
      return { issues, buttonHTML: btn.outerHTML };
    });
    
    if (cssIssues.issues.length > 0) {
      console.log('   ❌ Found CSS conflicts:');
      cssIssues.issues.forEach(issue => {
        console.log(`      - ${issue.selector}: ${issue.styles}`);
        console.log(`        Source: ${issue.source}`);
      });
    } else {
      console.log('   ✅ No CSS conflicts found');
    }
    
    // Test 7: Check mobile vs desktop styles
    console.log('\n7. Comparing mobile vs desktop styles...');
    
    // Mobile viewport
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileStyles = await page.evaluate(() => {
      const btn = document.getElementById('unlock-tier');
      if (!btn) return null;
      const computed = window.getComputedStyle(btn);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        display: computed.display
      };
    });
    
    console.log('   Mobile styles:', mobileStyles);
    
    // Return to desktop
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('\n✅ Analysis complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testClaimButton().catch(console.error);