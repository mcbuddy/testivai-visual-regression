/**
 * Example of using TestiVAI Visual Regression with Playwright
 */

import { test, expect } from '@playwright/test';
import { testivAI } from '../src';
import { playwrightPlugin } from '../src/plugins/playwright';

// Initialize TestiVAI with Playwright plugin
const visualTest = testivAI.init({
  framework: 'playwright',
  baselineDir: '.testivai/visual-regression/baseline',
  compareDir: '.testivai/visual-regression/compare',
  diffThreshold: 0.1
});

// Register the Playwright plugin
visualTest.use(playwrightPlugin({
  baselineDir: '.testivai/visual-regression/baseline',
  compareDir: '.testivai/visual-regression/compare',
  isBaseline: false // Set to true when creating baseline screenshots
}));

test.describe('Visual Regression Tests', () => {
  test('homepage visual test', async ({ page }) => {
    // Navigate to the page
    await page.goto('https://example.com');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Capture full page screenshot
    await visualTest.capture('homepage-full', page, {
      fullPage: true
    });
    
    // Capture viewport screenshot
    await visualTest.capture('homepage-viewport', page, {
      fullPage: false
    });
    
    // Capture specific element
    await visualTest.capture('homepage-header', page, {
      selector: 'header',
      fullPage: false
    });
    
    // Continue with other test assertions
    await expect(page.locator('h1')).toBeVisible();
  });

  test('responsive design test', async ({ page }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('https://example.com');
      await page.waitForLoadState('networkidle');
      
      // Capture screenshot for each viewport
      await visualTest.capture(`homepage-${viewport.name}`, page, {
        fullPage: false
      });
    }
  });

  test('form interaction test', async ({ page }) => {
    await page.goto('https://example.com/contact');
    
    // Capture initial state
    await visualTest.capture('contact-form-initial', page, {
      selector: 'form',
      fullPage: false
    });
    
    // Fill form
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('textarea[name="message"]', 'Hello, this is a test message.');
    
    // Capture filled state
    await visualTest.capture('contact-form-filled', page, {
      selector: 'form',
      fullPage: false
    });
    
    // Submit form (if applicable)
    // await page.click('button[type="submit"]');
    // await visualTest.capture('contact-form-submitted', page);
  });
});
