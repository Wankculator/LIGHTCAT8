/**
 * Game Loading E2E Tests
 * End-to-end testing of game loading and initialization
 */

import { test, expect } from '@playwright/test';

test.describe('Game Loading', () => {
  test('should load game successfully', async ({ page }) => {
    // Navigate to game page
    await page.goto('/game.html');
    
    // Wait for game canvas to be visible
    await expect(page.locator('#game-canvas')).toBeVisible({ timeout: 10000 });
    
    // Check that loading screen disappears
    await expect(page.locator('.loading-screen')).toBeHidden({ timeout: 15000 });
    
    // Verify game is ready
    const gameReady = await page.evaluate(() => {
      return window.gameLoaded === true;
    });
    
    expect(gameReady).toBe(true);
  });

  test('should display proper loading states', async ({ page }) => {
    await page.goto('/game.html');
    
    // Check initial loading screen
    await expect(page.locator('.loading-screen')).toBeVisible();
    await expect(page.locator('.loading-text')).toContainText(/loading/i);
    
    // Check progress indicator exists
    await expect(page.locator('.loading-progress')).toBeVisible();
    
    // Wait for loading to complete
    await page.waitForFunction(() => window.gameLoaded === true, { timeout: 30000 });
    
    // Verify loading screen is hidden
    await expect(page.locator('.loading-screen')).toBeHidden();
  });

  test('should handle loading errors gracefully', async ({ page }) => {
    // Mock a network error
    await page.route('**/three.min.js', route => route.abort());
    
    await page.goto('/game.html');
    
    // Should show error message instead of indefinite loading
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 10000 });
    
    // Should provide retry option
    await expect(page.locator('.retry-button')).toBeVisible();
  });

  test('should load on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/game.html');
    
    // Should load successfully on mobile
    await expect(page.locator('#game-canvas')).toBeVisible({ timeout: 15000 });
    
    // Mobile controls should be visible
    await expect(page.locator('.mobile-controls')).toBeVisible();
    
    // Game should be ready
    await page.waitForFunction(() => window.gameLoaded === true, { timeout: 30000 });
  });

  test('should handle slow connections', async ({ page }) => {
    // Simulate slow 3G connection
    await page.context().route('**/*', route => {
      setTimeout(() => route.continue(), 200); // Add 200ms delay
    });
    
    await page.goto('/game.html');
    
    // Should still load within reasonable time
    await expect(page.locator('#game-canvas')).toBeVisible({ timeout: 30000 });
    
    // Should complete loading
    await page.waitForFunction(() => window.gameLoaded === true, { timeout: 60000 });
  });
});

test.describe('Game Performance', () => {
  test('should meet performance benchmarks', async ({ page }) => {
    await page.goto('/game.html');
    
    // Wait for game to load
    await page.waitForFunction(() => window.gameLoaded === true, { timeout: 30000 });
    
    // Run for a few seconds to measure performance
    await page.waitForTimeout(5000);
    
    // Check FPS is acceptable
    const fps = await page.evaluate(() => {
      return window.game?.performanceMonitor?.getStats()?.fps || 0;
    });
    
    expect(fps).toBeGreaterThan(25); // Minimum acceptable FPS
  });

  test('should not exceed memory limits', async ({ page }) => {
    await page.goto('/game.html');
    await page.waitForFunction(() => window.gameLoaded === true, { timeout: 30000 });
    
    // Run game for extended period
    await page.waitForTimeout(10000);
    
    // Check memory usage
    const memoryUsage = await page.evaluate(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        return memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
      }
      return 0;
    });
    
    expect(memoryUsage).toBeLessThan(300); // Less than 300MB
  });
});