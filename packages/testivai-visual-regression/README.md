# TestiVAI Visual Regression SDK

A TypeScript SDK for visual regression testing that integrates with multiple testing frameworks.

## Installation

```bash
npm install testivai-visual-regression
```

## Quick Start

### Playwright Integration

```typescript
import { test } from '@playwright/test';
import { testivAI } from 'testivai-visual-regression';
import { playwrightPlugin } from 'testivai-visual-regression/plugins/playwright';

// Initialize TestiVAI with Playwright plugin
const visualTest = testivAI.init({
  framework: 'playwright',
  baselineDir: '.testivai/visual-regression/baseline',
  diffThreshold: 0.1
});

visualTest.use(playwrightPlugin());

test('homepage visual test', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Capture screenshot for visual comparison
  await visualTest.capture('homepage', page);
});
```

### Cypress Integration

```javascript
// cypress/support/e2e.js
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

// In test file
describe('Visual Tests', () => {
  it('should match homepage visual baseline', () => {
    cy.visit('/');
    cy.compareScreenshot('homepage');
  });
});
```

## Features

- **Multi-Framework Support**: Works with Playwright, Cypress, Puppeteer, and Selenium
- **Cross-Browser Testing**: Consistent screenshot capture across different browsers
- **Flexible Configuration**: Customizable thresholds, directories, and options
- **TypeScript Support**: Full TypeScript support with comprehensive type definitions
- **Plugin Architecture**: Extensible plugin system for framework-specific integrations

## API Reference

### testivAI.init(options)

Initialize a new testivAI instance.

**Parameters:**
- `options` (testivAIOptions): Configuration options

**Returns:** testivAI instance

### instance.use(plugin)

Register a framework plugin.

**Parameters:**
- `plugin` (Plugin): Framework-specific plugin

**Returns:** testivAI instance (for chaining)

### instance.capture(name, target, options?)

Capture a screenshot for visual comparison.

**Parameters:**
- `name` (string): Name of the screenshot
- `target` (unknown): Framework-specific target (page, browser, etc.)
- `options` (ScreenshotOptions, optional): Screenshot options

**Returns:** Promise<string> - Path to the captured screenshot

## Configuration

```typescript
interface testivAIOptions {
  framework: 'playwright' | 'cypress' | 'puppeteer' | 'selenium';
  baselineDir: string;
  compareDir?: string;
  reportDir?: string;
  diffThreshold?: number;
  updateBaselines?: boolean;
}
```

## Plugins

### Available Plugins

- `playwrightPlugin()` - Playwright integration
- `cypressPlugin()` - Cypress integration
- `puppeteerPlugin()` - Puppeteer integration
- `seleniumPlugin()` - Selenium integration

### Plugin Usage

```typescript
import { playwrightPlugin } from 'testivai-visual-regression/plugins/playwright';

const visualTest = testivAI.init({
  framework: 'playwright',
  baselineDir: '.testivai/visual-regression/baseline'
});

visualTest.use(playwrightPlugin());
```

## CLI Tool

For command-line usage, install the separate CLI package:

```bash
npm install -g testivai-cli
```

See [testivai-cli](https://www.npmjs.com/package/testivai-cli) for CLI documentation.

## License

MIT
