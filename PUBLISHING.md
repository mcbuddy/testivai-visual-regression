# Publishing testivAI Visual Regression

This document explains how to publish the testivAI Visual Regression package to npm and how to use it as a Node.js library.

## Preparing for Publishing

The package is already configured for publishing to npm. Here's what's already set up:

1. **package.json** is configured with:
   - `main` and `types` fields pointing to the compiled output
   - `files` field specifying which files to include in the published package
   - `prepublishOnly` script to clean and build the project before publishing
   - `publishConfig` to ensure the package is published with public access

2. **.npmignore** is configured to exclude unnecessary files from the published package

3. **TypeScript configuration** is set up to generate declaration files and compile to CommonJS

## Publishing to npm

To publish the package to npm, follow these steps:

1. **Login to npm** (if you haven't already):
   ```bash
   npm login
   ```

2. **Update the version** in package.json:
   ```bash
   npm version patch  # or minor, or major
   ```

3. **Publish the package**:
   ```bash
   npm publish
   ```

The `prepublishOnly` script will automatically clean and build the project before publishing.

## Using the Package

### Installation

Once published, users can install the package using npm or yarn:

```bash
# Using npm
npm install testivai-visual-regression

# Using yarn
yarn add testivai-visual-regression
```

### Basic Usage

Here's how to use the package in a Node.js application:

```typescript
import { testivAI } from 'testivai-visual-regression';

// Initialize testivAI
const visualTest = testivAI.init({
  framework: 'playwright', // or 'cypress', 'puppeteer', 'selenium'
  baselineDir: '.testivai/visual-regression/baseline',
  compareDir: '.testivai/visual-regression/compare',
  reportDir: '.testivai/visual-regression/reports',
  diffThreshold: 0.1,
  updateBaselines: false
});
```

### Using with Playwright

```typescript
import { testivAI } from 'testivai-visual-regression';
import { playwrightPlugin } from 'testivai-visual-regression/plugins/playwright';
import { chromium } from 'playwright';

async function runTest() {
  // Initialize testivAI
  const visualTest = testivAI.init({
    framework: 'playwright',
    baselineDir: '.testivai/visual-regression/baseline'
  });

  // Register the Playwright plugin
  visualTest.use(playwrightPlugin());

  // Launch browser and capture screenshot
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');
  
  // Capture screenshot
  const screenshotPath = await visualTest.capture('homepage', page, {
    fullPage: true
  });
  
  console.log(`Screenshot captured: ${screenshotPath}`);
  
  // Generate report
  const reportPath = await visualTest.generateReport();
  console.log(`Report available at: ${reportPath}`);
  
  await browser.close();
}

runTest().catch(console.error);
```

### Using with Cypress

```javascript
// In your Cypress support file
import { testivAI } from 'testivai-visual-regression';
import { cypressPlugin } from 'testivai-visual-regression/plugins/cypress';

const visualTest = testivAI.init({
  framework: 'cypress',
  baselineDir: '.testivai/visual-regression/baseline'
});

visualTest.use(cypressPlugin());

// Add custom command
Cypress.Commands.add('compareScreenshot', (name) => {
  return visualTest.capture(name);
});
```

### Using with Puppeteer

```typescript
import { testivAI } from 'testivai-visual-regression';
import { puppeteerPlugin } from 'testivai-visual-regression/plugins/puppeteer';
import puppeteer from 'puppeteer';

async function runTest() {
  // Initialize testivAI
  const visualTest = testivAI.init({
    framework: 'puppeteer',
    baselineDir: '.testivai/visual-regression/baseline'
  });

  // Register the Puppeteer plugin
  visualTest.use(puppeteerPlugin());

  // Launch browser and capture screenshot
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');
  
  // Capture screenshot
  const screenshotPath = await visualTest.capture('homepage', page, {
    fullPage: true
  });
  
  console.log(`Screenshot captured: ${screenshotPath}`);
  
  await browser.close();
}

runTest().catch(console.error);
```

### Using with Selenium

```typescript
import { testivAI } from 'testivai-visual-regression';
import { seleniumPlugin } from 'testivai-visual-regression/plugins/selenium';
import { Builder } from 'selenium-webdriver';

async function runTest() {
  // Initialize testivAI
  const visualTest = testivAI.init({
    framework: 'selenium',
    baselineDir: '.testivai/visual-regression/baseline'
  });

  // Register the Selenium plugin
  visualTest.use(seleniumPlugin());

  // Launch browser and capture screenshot
  const driver = await new Builder().forBrowser('chrome').build();
  await driver.get('https://example.com');
  
  // Capture screenshot
  const screenshotPath = await visualTest.capture('homepage', driver, {
    fullPage: true
  });
  
  console.log(`Screenshot captured: ${screenshotPath}`);
  
  await driver.quit();
}

runTest().catch(console.error);
```

## Configuration

You can create a configuration file to customize the behavior of testivAI:

```javascript
// testivai.config.js
module.exports = {
  baselineDir: '.testivai/visual-regression/baseline',
  compareDir: '.testivai/visual-regression/compare',
  reportDir: '.testivai/visual-regression/reports',
  diffThreshold: 0.1,
  ignoreRegions: [
    { name: 'date-display', selector: '.date-time' }
  ]
};
```

## Advanced Usage

### Ignoring Regions

You can ignore specific regions during comparison:

```typescript
await visualTest.capture('homepage', page, {
  fullPage: true,
  ignoreRegions: [
    { name: 'date-display', selector: '.date-time' },
    { name: 'ad-banner', coordinates: { x: 100, y: 200, width: 300, height: 100 } }
  ]
});
```

### Capturing Specific Elements

You can capture specific elements instead of the entire page:

```typescript
await visualTest.capture('login-form', page, {
  selector: '#login-form'
});
```

## Troubleshooting

### ESM vs CommonJS

This package is built using CommonJS. If you're using it in an ESM project, you may need to adjust your import statements or configuration.

### Dependency Issues

If you encounter issues with dependencies, make sure you have the correct versions of the testing frameworks installed:

- Playwright: `npm install @playwright/test`
- Cypress: `npm install cypress`
- Puppeteer: `npm install puppeteer`
- Selenium: `npm install selenium-webdriver`
