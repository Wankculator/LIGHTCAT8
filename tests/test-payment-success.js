#!/usr/bin/env node

/**
 * Simple Payment Success Flow Test
 * Tests the payment success page functionality
 */

const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:8082';
const API_URL = 'http://localhost:3000';
const TEST_INVOICE_ID = 'test-' + Date.now();

// Test results
const results = {
  passed: [],
  failed: []
};

async function test(name, fn) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    await fn();
    console.log(`✅ PASSED: ${name}`);
    results.passed.push(name);
  } catch (error) {
    console.error(`❌ FAILED: ${name}`);
    console.error(`   Error: ${error.message}`);
    results.failed.push({ name, error: error.message });
  }
}

async function runTests() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // Test 1: Success page loads
    await test('Success page loads with invoice ID', async () => {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/success.html?invoice=${TEST_INVOICE_ID}`);
      
      // Check main elements
      const title = await page.$eval('h1', el => el.textContent);
      if (!title.includes('Payment Successful')) {
        throw new Error('Title not found');
      }
      
      const transactionId = await page.$eval('#transactionId', el => el.textContent);
      if (!transactionId.includes(TEST_INVOICE_ID.substring(0, 4))) {
        throw new Error('Transaction ID not displayed');
      }
      
      await page.close();
    });

    // Test 2: Status checking works
    await test('Status checking and updates', async () => {
      const page = await browser.newPage();
      
      // Intercept API calls
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().includes('/api/rgb/invoice/')) {
          request.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              status: 'processing',
              invoice: {
                batchCount: 10,
                tokenAmount: 7000,
                amount: 20000,
                status: 'processing'
              }
            })
          });
        } else {
          request.continue();
        }
      });
      
      await page.goto(`${BASE_URL}/success.html?invoice=${TEST_INVOICE_ID}`);
      await page.waitForTimeout(2000);
      
      // Check if details were populated
      const batchCount = await page.$eval('#batchCount', el => el.textContent);
      if (batchCount !== '10') {
        throw new Error(`Batch count not updated: ${batchCount}`);
      }
      
      const tokenAmount = await page.$eval('#tokenAmount', el => el.textContent);
      if (!tokenAmount.includes('7,000')) {
        throw new Error(`Token amount not formatted: ${tokenAmount}`);
      }
      
      await page.close();
    });

    // Test 3: Consignment ready state
    await test('Consignment ready and download button', async () => {
      const page = await browser.newPage();
      
      const mockConsignment = Buffer.from('TEST_CONSIGNMENT').toString('base64');
      
      // Mock delivered status
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().includes('/api/rgb/invoice/')) {
          request.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              status: 'delivered',
              consignment: mockConsignment,
              invoice: {
                batchCount: 5,
                tokenAmount: 3500,
                amount: 10000,
                status: 'delivered'
              }
            })
          });
        } else {
          request.continue();
        }
      });
      
      await page.goto(`${BASE_URL}/success.html?invoice=${TEST_INVOICE_ID}`);
      await page.waitForTimeout(2000);
      
      // Check if consignment section is visible
      const consignmentVisible = await page.$eval('#consignmentSection', el => {
        return el.classList.contains('ready');
      });
      
      if (!consignmentVisible) {
        throw new Error('Consignment section not visible');
      }
      
      // Check download button
      const downloadButton = await page.$('#downloadButton');
      if (!downloadButton) {
        throw new Error('Download button not found');
      }
      
      await page.close();
    });

    // Test 4: Error handling
    await test('Error handling for failed distribution', async () => {
      const page = await browser.newPage();
      
      // Mock error status
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().includes('/api/rgb/invoice/')) {
          request.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              status: 'distribution_failed',
              error: 'RGB node offline',
              invoice: {
                batchCount: 5,
                amount: 10000,
                status: 'distribution_failed'
              }
            })
          });
        } else {
          request.continue();
        }
      });
      
      await page.goto(`${BASE_URL}/success.html?invoice=${TEST_INVOICE_ID}`);
      await page.waitForTimeout(2000);
      
      // Check error message
      const errorText = await page.$eval('#waitingInfo', el => el.textContent);
      if (!errorText.includes('Failed') && !errorText.includes('failed')) {
        throw new Error('Error message not displayed');
      }
      
      await page.close();
    });

    // Test 5: Mobile responsiveness
    await test('Mobile responsiveness', async () => {
      const page = await browser.newPage();
      
      // Set mobile viewport
      await page.setViewport({
        width: 375,
        height: 667,
        isMobile: true
      });
      
      await page.goto(`${BASE_URL}/success.html?invoice=${TEST_INVOICE_ID}`);
      
      // Check if main elements are visible
      const isVisible = await page.$eval('.success-container', el => {
        const rect = el.getBoundingClientRect();
        return rect.width <= 375 && rect.width > 0;
      });
      
      if (!isVisible) {
        throw new Error('Container not responsive');
      }
      
      await page.close();
    });

    // Test 6: Progress indicators
    await test('Progress indicators update correctly', async () => {
      const page = await browser.newPage();
      
      // Mock processing status
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().includes('/api/rgb/invoice/')) {
          request.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              status: 'processing',
              invoice: {
                batchCount: 5,
                amount: 10000,
                status: 'processing'
              }
            })
          });
        } else {
          request.continue();
        }
      });
      
      await page.goto(`${BASE_URL}/success.html?invoice=${TEST_INVOICE_ID}`);
      await page.waitForTimeout(2000);
      
      // Check step 2 is active
      const step2Active = await page.$eval('#step2', el => {
        return el.classList.contains('active');
      });
      
      if (!step2Active) {
        throw new Error('Step 2 not showing as active');
      }
      
      // Check progress bar
      const progressWidth = await page.$eval('#statusProgress', el => {
        return el.style.width;
      });
      
      if (progressWidth !== '66%') {
        throw new Error(`Progress bar incorrect: ${progressWidth}`);
      }
      
      await page.close();
    });

  } finally {
    await browser.close();
  }

  // Print results
  console.log('\n' + '='.repeat(50));
  console.log('TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log('\nFailed tests:');
    results.failed.forEach(f => {
      console.log(`  - ${f.name}: ${f.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
  }
}

// Check if servers are running
const http = require('http');

function checkServer(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 404);
    }).on('error', () => {
      resolve(false);
    });
  });
}

async function main() {
  console.log('🚀 Payment Success Flow Test Suite');
  console.log('==================================\n');
  
  // Check if servers are running
  console.log('Checking servers...');
  const clientRunning = await checkServer(BASE_URL);
  const apiRunning = await checkServer(API_URL + '/api/health');
  
  if (!clientRunning) {
    console.error('❌ Client server not running on port 8082');
    console.log('   Run: npm run dev:client');
    process.exit(1);
  }
  
  if (!apiRunning) {
    console.error('❌ API server not running on port 3000');
    console.log('   Run: npm run dev:server');
    process.exit(1);
  }
  
  console.log('✅ Servers are running\n');
  
  // Run tests
  await runTests();
}

main().catch(console.error);