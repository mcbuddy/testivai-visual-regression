# TestiVAI Visual Regression

A TypeScript SDK for visual regression testing that integrates with multiple testing frameworks.

## Features

- Cross-browser screenshot capture
- Integration with Playwright, Cypress, Puppeteer, and Selenium
- Git branch-based comparison
- Interactive HTML reports with Accept/Reject functionality
- Customizable configuration

## Installation

```bash
npm install testivai-visual-regression
```

## Quick Start

### Playwright

```typescript
import { test } from '@playwright/test';
import { TestiVAI } from 'testivai-visual-regression';
import { playwrightPlugin } from 'testivai-visual-regression/plugins/playwright';

// Initialize TestiVAI
const visualTest = TestiVAI.init({
  framework: 'playwright',
  baselineDir: '.testivai/visual-regression/baseline'
});

visualTest.use(playwrightPlugin());

// Use in your tests
test('homepage visual test', async ({ page }) => {
  await page.goto('https://example.com');
  await visualTest.capture('homepage', page);
});
```

### Cypress

```javascript
// cypress/support/e2e.js
import { TestiVAI } from 'testivai-visual-regression';
import { cypressPlugin } from 'testivai-visual-regression/plugins/cypress';

const visualTest = TestiVAI.init({
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

## Configuration

Create a `testivai.config.js` file in your project root:

```javascript
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

## Viewing Reports

Reports are automatically generated after test runs. You can access them programmatically:

```javascript
const reportPath = await visualTest.generateReport();
console.log(`Report available at: ${reportPath}`);
```

## Documentation

For more detailed documentation, see the [docs](./docs) directory.

## For Developers

If you want to use this package as a library in your own project or contribute to its development, see [PUBLISHING.md](./PUBLISHING.md) for detailed instructions on how to publish and use this package as a Node.js library.

## License

MIT
