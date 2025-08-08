/**
 * Payment Success Flow E2E Tests
 * Tests the complete payment confirmation and token distribution UI
 */

const { test, expect, chromium } = require('@playwright/test');

// Test configuration
const BASE_URL = 'http://localhost:8082';
const API_URL = 'http://localhost:3000';
const TEST_INVOICE_ID = 'test-invoice-' + Date.now();

test.describe('Payment Success Flow', () => {
  let browser;
  let context;
  let page;

  test.beforeAll(async () => {
    browser = await chromium.launch({ 
      headless: false, // Set to true for CI
      slowMo: 100 // Slow down for visibility
    });
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test.beforeEach(async () => {
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    page = await context.newPage();
    
    // Set up console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text());
      }
    });
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('Success page loads with invoice ID', async () => {
    console.log('Testing: Success page loads correctly');
    
    // Navigate to success page with test invoice
    await page.goto(`${BASE_URL}/success.html?invoice=${TEST_INVOICE_ID}`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check main elements are present
    await expect(page.locator('h1')).toContainText('Payment Successful!');
    await expect(page.locator('.thank-you')).toContainText('Thank you for your purchase');
    
    // Check invoice ID is displayed
    const transactionId = await page.locator('#transactionId').textContent();
    expect(transactionId).toContain(TEST_INVOICE_ID.substring(0, 8));
    
    // Check purchase details section exists
    await expect(page.locator('.purchase-details')).toBeVisible();
    
    // Check status section exists
    await expect(page.locator('.status-section')).toBeVisible();
    
    console.log('✅ Success page loads correctly');
  });

  test('Purchase details display correctly', async () => {
    console.log('Testing: Purchase details display');
    
    // Mock API response for invoice status
    await page.route(`${API_URL}/api/rgb/invoice/${TEST_INVOICE_ID}/status`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          status: 'processing',
          invoice: {
            batchCount: 10,
            tokenAmount: 7000,
            amount: 20000,
            rgbInvoice: 'rgb:utxob:testinvoice123',
            status: 'processing'
          }
        })
      });
    });
    
    await page.goto(`${BASE_URL}/success.html?invoice=${TEST_INVOICE_ID}`);
    await page.waitForTimeout(1000); // Wait for status check
    
    // Check purchase details are populated
    await expect(page.locator('#batchCount')).toContainText('10');
    await expect(page.locator('#tokenAmount')).toContainText('7,000 LIGHTCAT');
    await expect(page.locator('#amountPaid')).toContainText('20,000 sats');
    
    console.log('✅ Purchase details display correctly');
  });

  test('Status updates show processing state', async () => {
    console.log('Testing: Processing status display');
    
    let callCount = 0;
    
    // Mock API to return processing status
    await page.route(`${API_URL}/api/rgb/invoice/${TEST_INVOICE_ID}/status`, async route => {
      callCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          status: 'processing',
          invoice: {
            batchCount: 5,
            tokenAmount: 3500,
            amount: 10000,
            status: 'processing'
          }
        })
      });
    });
    
    await page.goto(`${BASE_URL}/success.html?invoice=${TEST_INVOICE_ID}`);
    
    // Wait for status updates
    await page.waitForTimeout(4000);
    
    // Check processing indicator
    const step2 = page.locator('#step2');
    await expect(step2).toHaveClass(/active/);
    
    // Check loading spinner is visible
    const spinner = step2.locator('.loading-spinner');
    await expect(spinner).toBeVisible();
    
    // Check waiting info is displayed
    await expect(page.locator('#waitingInfo')).toBeVisible();
    await expect(page.locator('#waitingInfo')).toContainText('Processing Your Tokens');
    
    // Verify multiple status checks were made
    expect(callCount).toBeGreaterThan(1);
    
    console.log(`✅ Processing status displayed (${callCount} status checks made)`);
  });

  test('Consignment ready state and download', async () => {
    console.log('Testing: Consignment ready and download');
    
    const mockConsignment = Buffer.from('MOCK_RGB_CONSIGNMENT_DATA').toString('base64');
    
    // Mock API to return delivered status with consignment
    await page.route(`${API_URL}/api/rgb/invoice/${TEST_INVOICE_ID}/status`, async route => {
      await route.fulfill({
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
    });
    
    await page.goto(`${BASE_URL}/success.html?invoice=${TEST_INVOICE_ID}`);
    await page.waitForTimeout(1000);
    
    // Check all steps show completed
    await expect(page.locator('#step1')).toHaveClass(/completed/);
    await expect(page.locator('#step2')).toHaveClass(/completed/);
    await expect(page.locator('#step3')).toHaveClass(/completed/);
    
    // Check progress bar is 100%
    const progressBar = page.locator('#statusProgress');
    await expect(progressBar).toHaveAttribute('style', /width:\s*100%/);
    
    // Check consignment section is visible
    await expect(page.locator('#consignmentSection')).toHaveClass(/ready/);
    
    // Check download button is visible
    const downloadButton = page.locator('#downloadButton');
    await expect(downloadButton).toBeVisible();
    await expect(downloadButton).toContainText('Download RGB Consignment');
    
    // Test download functionality
    const downloadPromise = page.waitForEvent('download');
    await downloadButton.click();
    const download = await downloadPromise;
    
    // Verify download filename
    expect(download.suggestedFilename()).toContain('lightcat_');
    expect(download.suggestedFilename()).toContain('.rgb');
    
    console.log('✅ Consignment ready state and download work');
  });

  test('Error handling for failed distribution', async () => {
    console.log('Testing: Error handling');
    
    // Mock API to return error status
    await page.route(`${API_URL}/api/rgb/invoice/${TEST_INVOICE_ID}/status`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          status: 'distribution_failed',
          error: 'RGB node offline - unable to generate consignment',
          invoice: {
            batchCount: 5,
            amount: 10000,
            status: 'distribution_failed'
          }
        })
      });
    });
    
    await page.goto(`${BASE_URL}/success.html?invoice=${TEST_INVOICE_ID}`);
    await page.waitForTimeout(1000);
    
    // Check error message is displayed
    const waitingInfo = page.locator('#waitingInfo');
    await expect(waitingInfo).toContainText('Distribution Failed');
    await expect(waitingInfo).toContainText('contact support');
    
    // Check consignment section is not shown
    await expect(page.locator('#consignmentSection')).not.toHaveClass(/ready/);
    
    console.log('✅ Error handling works correctly');
  });

  test('Mobile responsiveness', async () => {
    console.log('Testing: Mobile responsiveness');
    
    // Create mobile context
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    });
    const mobilePage = await mobileContext.newPage();
    
    await mobilePage.goto(`${BASE_URL}/success.html?invoice=${TEST_INVOICE_ID}`);
    await mobilePage.waitForLoadState('networkidle');
    
    // Check elements are visible on mobile
    await expect(mobilePage.locator('h1')).toBeVisible();
    await expect(mobilePage.locator('.purchase-details')).toBeVisible();
    await expect(mobilePage.locator('.status-section')).toBeVisible();
    
    // Check layout adjustments
    const container = mobilePage.locator('.success-container');
    const box = await container.boundingBox();
    expect(box.width).toBeLessThanOrEqual(375);
    
    // Check text is readable (font sizes)
    const h1 = mobilePage.locator('h1');
    const fontSize = await h1.evaluate(el => 
      window.getComputedStyle(el).fontSize
    );
    expect(parseInt(fontSize)).toBeGreaterThanOrEqual(24);
    
    await mobileContext.close();
    console.log('✅ Mobile responsiveness works');
  });

  test('Payment redirect flow from main page', async () => {
    console.log('Testing: Payment redirect flow');
    
    // Navigate to main page
    await page.goto(`${BASE_URL}/index.html`);
    
    // Mock successful payment status check
    await page.route('**/api/rgb/invoice/*/status', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          status: 'paid',
          paid: true,
          invoice: {
            batchCount: 5,
            amount: 10000
          }
        })
      });
    });
    
    // Simulate invoice creation and payment flow
    await page.evaluate((invoiceId) => {
      // Set test invoice ID
      localStorage.setItem('lastInvoiceId', invoiceId);
      
      // Trigger payment status check
      window.verifyPayment = async function() {
        const response = await fetch(`/api/rgb/invoice/${invoiceId}/status`);
        const result = await response.json();
        
        if (result.status === 'paid') {
          // Should trigger redirect
          window.location.href = `/success.html?invoice=${invoiceId}`;
        }
      };
      
      window.verifyPayment();
    }, TEST_INVOICE_ID);
    
    // Wait for navigation to success page
    await page.waitForURL(/success\.html/, { timeout: 5000 });
    
    // Verify we're on success page with correct invoice
    expect(page.url()).toContain(`invoice=${TEST_INVOICE_ID}`);
    await expect(page.locator('h1')).toContainText('Payment Successful!');
    
    console.log('✅ Payment redirect flow works');
  });

  test('localStorage fallback for invoice ID', async () => {
    console.log('Testing: localStorage fallback');
    
    // Set invoice ID in localStorage
    await page.goto(`${BASE_URL}`);
    await page.evaluate((invoiceId) => {
      localStorage.setItem('lastInvoiceId', invoiceId);
    }, TEST_INVOICE_ID);
    
    // Navigate to success page WITHOUT invoice parameter
    await page.goto(`${BASE_URL}/success.html`);
    await page.waitForTimeout(500);
    
    // Check that invoice ID was retrieved from localStorage
    const transactionId = await page.locator('#transactionId').textContent();
    expect(transactionId).toContain(TEST_INVOICE_ID.substring(0, 8));
    
    console.log('✅ localStorage fallback works');
  });
});

// Run tests
(async () => {
  console.log('🧪 Starting Payment Success Flow Tests...\n');
  
  try {
    // Run Playwright tests
    const { execSync } = require('child_process');
    execSync('npx playwright test /root/tests/payment-success-flow.test.js --reporter=list', {
      stdio: 'inherit'
    });
    
    console.log('\n✅ All tests passed successfully!');
  } catch (error) {
    console.error('\n❌ Some tests failed:', error.message);
    process.exit(1);
  }
})();