#!/usr/bin/env node
/**
 * Visual Testing Framework for LIGHTCAT
 * Instantly see how UI changes look across devices
 */

import puppeteer from 'puppeteer';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);

const DEVICES = {
  'iphone-se': { width: 375, height: 667, deviceScaleFactor: 2 },
  'iphone-12': { width: 390, height: 844, deviceScaleFactor: 3 },
  'iphone-14-pro': { width: 393, height: 852, deviceScaleFactor: 3 },
  'pixel-5': { width: 393, height: 851, deviceScaleFactor: 2.75 },
  'samsung-s21': { width: 360, height: 800, deviceScaleFactor: 3 },
  'ipad': { width: 768, height: 1024, deviceScaleFactor: 2 },
  'desktop': { width: 1920, height: 1080, deviceScaleFactor: 1 }
};

const CRITICAL_ELEMENTS = [
  { name: 'header', selector: 'header', mustBeVisible: true },
  { name: 'live-mint-status', selector: '.section-title', mustBeVisible: true },
  { name: 'stats-cards', selector: '.stat-card', mustBeVisible: true },
  { name: 'game-button', selector: '.play-button', mustBeVisible: true },
  { name: 'purchase-form', selector: '.purchase-form', mustBeVisible: true }
];

async function visualTest(options = {}) {
  console.log('🎨 LIGHTCAT Visual Testing Framework');
  console.log('=====================================\n');
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const results = {
    timestamp: new Date().toISOString(),
    issues: [],
    screenshots: []
  };
  
  try {
    for (const [deviceName, viewport] of Object.entries(DEVICES)) {
      console.log(`📱 Testing ${deviceName}...`);
      
      const page = await browser.newPage();
      await page.setViewport(viewport);
      
      // Load the page
      await page.goto('http://localhost:8082', { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      // Wait for critical elements
      await page.waitForSelector('header', { timeout: 5000 });
      
      // Check each critical element
      for (const element of CRITICAL_ELEMENTS) {
        try {
          const isVisible = await page.evaluate((selector) => {
            const el = document.querySelector(selector);
            if (!el) return false;
            
            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            
            return rect.width > 0 && 
                   rect.height > 0 && 
                   style.opacity !== '0' &&
                   style.visibility !== 'hidden' &&
                   style.display !== 'none';
          }, element.selector);
          
          if (!isVisible && element.mustBeVisible) {
            results.issues.push({
              device: deviceName,
              element: element.name,
              issue: 'Element not visible',
              selector: element.selector
            });
            console.log(`  ❌ ${element.name} - NOT VISIBLE`);
          } else {
            console.log(`  ✅ ${element.name} - OK`);
          }
        } catch (e) {
          results.issues.push({
            device: deviceName,
            element: element.name,
            issue: 'Element not found',
            selector: element.selector
          });
          console.log(`  ❌ ${element.name} - NOT FOUND`);
        }
      }
      
      // Take screenshot
      const screenshotPath = `visual-tests/${deviceName}-${Date.now()}.png`;
      await page.screenshot({ 
        path: screenshotPath,
        fullPage: true 
      });
      results.screenshots.push(screenshotPath);
      
      // Check for mobile-specific issues
      if (viewport.width <= 768) {
        // Check header height
        const headerHeight = await page.evaluate(() => {
          const header = document.querySelector('header');
          return header ? header.offsetHeight : 0;
        });
        
        if (headerHeight > 120) {
          results.issues.push({
            device: deviceName,
            element: 'header',
            issue: `Header too tall: ${headerHeight}px (should be ≤ 100px)`,
            severity: 'high'
          });
        }
        
        // Check for horizontal scroll
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        
        if (hasHorizontalScroll) {
          results.issues.push({
            device: deviceName,
            element: 'body',
            issue: 'Horizontal scroll detected',
            severity: 'high'
          });
        }
      }
      
      await page.close();
    }
    
  } finally {
    await browser.close();
  }
  
  // Generate report
  console.log('\n📊 VISUAL TEST REPORT');
  console.log('====================');
  
  if (results.issues.length === 0) {
    console.log('✅ All visual tests passed!');
  } else {
    console.log(`❌ Found ${results.issues.length} issues:\n`);
    
    // Group by device
    const issuesByDevice = {};
    results.issues.forEach(issue => {
      if (!issuesByDevice[issue.device]) {
        issuesByDevice[issue.device] = [];
      }
      issuesByDevice[issue.device].push(issue);
    });
    
    for (const [device, issues] of Object.entries(issuesByDevice)) {
      console.log(`\n${device}:`);
      issues.forEach(issue => {
        const severity = issue.severity === 'high' ? '🔴' : '🟡';
        console.log(`  ${severity} ${issue.element}: ${issue.issue}`);
      });
    }
  }
  
  // Save detailed report
  await fs.mkdir('visual-tests', { recursive: true });
  await fs.writeFile(
    'visual-tests/report.json', 
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n📸 Screenshots saved to: visual-tests/');
  console.log('📄 Detailed report: visual-tests/report.json');
  
  // Return exit code based on issues
  return results.issues.length === 0 ? 0 : 1;
}

// Auto-fix common issues
async function autoFix(issues) {
  console.log('\n🔧 Attempting auto-fixes...');
  
  for (const issue of issues) {
    if (issue.element === 'live-mint-status' && issue.issue === 'Element not visible') {
      console.log('🔧 Fixing LIVE MINT STATUS visibility...');
      
      // Add emergency CSS fix
      const emergencyCSS = `
/* Emergency Mobile Fix - Added by Visual Test */
@media screen and (max-width: 768px) {
  .section-title {
    opacity: 1 !important;
    visibility: visible !important;
    display: block !important;
    transform: none !important;
    position: relative !important;
    z-index: 100 !important;
  }
}`;
      
      // Append to mobile CSS
      await fs.appendFile(
        'client/css/mobile-optimized.css',
        emergencyCSS
      );
      
      console.log('✅ Added emergency CSS fix');
    }
  }
}

// Run tests
if (process.argv[2] === '--fix') {
  visualTest().then(async (code) => {
    if (code !== 0) {
      const report = JSON.parse(
        await fs.readFile('visual-tests/report.json', 'utf-8')
      );
      await autoFix(report.issues);
    }
    process.exit(code);
  });
} else {
  visualTest().then(code => process.exit(code));
}