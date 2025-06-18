# Migration Guide: testivAI Visual Regression

This guide helps users migrate from previous versions of testivAI Visual Regression to the new monorepo structure with separate SDK and CLI packages.

## Migrating from v0.x to v1.0.0

Version 1.0.0 introduces a significant architectural change: the project has been transformed into a monorepo with two separate packages:

1. `testivai-visual-regression`: The core SDK package
2. `testivai-cli`: The command-line interface package

### Key Changes

- **Package Separation**: Functionality is now split between SDK and CLI packages
- **Installation Changes**: You may need to install one or both packages depending on your needs
- **Import Path Updates**: Some import paths have changed
- **Enhanced Reporting**: New interactive HTML reports with approvals tracking
- **Framework Support**: Complete support for Playwright, Cypress, Puppeteer, and Selenium

### Migration Steps

#### 1. Update Installation

**Before (v0.x):**
```bash
npm install testivai-visual-regression
```

**After (v1.0.0):**

For programmatic use only:
```bash
npm install testivai-visual-regression
```

For command-line use:
```bash
npm install -g testivai-cli
```

For both:
```bash
npm install testivai-visual-regression
npm install -g testivai-cli
```

#### 2. Update Import Paths

**Before (v0.x):**
```typescript
import { testivAI, playwrightPlugin } from 'testivai-visual-regression';
```

**After (v1.0.0):**
```typescript
import { testivAI } from 'testivai-visual-regression';
import { playwrightPlugin } from 'testivai-visual-regression/plugins/playwright';
```

#### 3. Update CLI Commands

**Before (v0.x):**
```bash
npx testivai-visual-regression init
npx testivai-visual-regression compare
```

**After (v1.0.0):**
```bash
testivai init
testivai compare
```

Or if you haven't installed globally:
```bash
npx testivai-cli init
npx testivai-cli compare
```

#### 4. Update Configuration

The configuration format remains the same, but you may need to update paths if you were using relative paths:

```javascript
// testivai.config.js
module.exports = {
  baselineDir: '.testivai/visual-regression/baseline',
  compareDir: '.testivai/visual-regression/compare',
  reportDir: '.testivai/visual-regression/reports',
  diffThreshold: 0.1,
  // New options available in v1.0.0:
  ignoreRegions: [
    { name: 'date-display', selector: '.date-time' }
  ],
  hooks: {
    beforeCapture: async (page) => {
      // Custom logic before screenshot
    }
  }
};
```

### Framework-Specific Changes

#### Playwright

**Before (v0.x):**
```typescript
import { testivAI, playwrightPlugin } from 'testivai-visual-regression';

const visualTest = testivAI.init({ framework: 'playwright' });
visualTest.use(playwrightPlugin);
```

**After (v1.0.0):**
```typescript
import { testivAI } from 'testivai-visual-regression';
import { playwrightPlugin } from 'testivai-visual-regression/plugins/playwright';

const visualTest = testivAI.init({ framework: 'playwright' });
visualTest.use(playwrightPlugin());
```

#### Cypress

**Before (v0.x):**
```typescript
import { testivAI, cypressPlugin } from 'testivai-visual-regression';

const visualTest = testivAI.init({ framework: 'cypress' });
visualTest.use(cypressPlugin);
```

**After (v1.0.0):**
```typescript
import { testivAI } from 'testivai-visual-regression';
import { cypressPlugin } from 'testivai-visual-regression/plugins/cypress';

const visualTest = testivAI.init({ framework: 'cypress' });
visualTest.use(cypressPlugin());
```

#### Puppeteer

**Before (v0.x):**
```typescript
import { testivAI, puppeteerPlugin } from 'testivai-visual-regression';

const visualTest = testivAI.init({ framework: 'puppeteer' });
visualTest.use(puppeteerPlugin);
```

**After (v1.0.0):**
```typescript
import { testivAI } from 'testivai-visual-regression';
import { puppeteerPlugin } from 'testivai-visual-regression/plugins/puppeteer';

const visualTest = testivAI.init({ framework: 'puppeteer' });
visualTest.use(puppeteerPlugin());
```

#### Selenium

**Before (v0.x):**
```typescript
import { testivAI, seleniumPlugin } from 'testivai-visual-regression';

const visualTest = testivAI.init({ framework: 'selenium' });
visualTest.use(seleniumPlugin);
```

**After (v1.0.0):**
```typescript
import { testivAI } from 'testivai-visual-regression';
import { seleniumPlugin } from 'testivai-visual-regression/plugins/selenium';

const visualTest = testivAI.init({ framework: 'selenium' });
visualTest.use(seleniumPlugin());
```

### New Features in v1.0.0

#### Enhanced HTML Reports

Version 1.0.0 introduces a professional visual regression dashboard with:

- Side-by-side image comparison (baseline, current, diff)
- Status filtering (approved, rejected, new, deleted)
- PR metadata display with commit information
- Collapsible section for unchanged/passed images
- Toggle functionality to show/hide unchanged tests
- Git short SHA-based history with revert capability
- Accept/reject functionality with localStorage persistence

To use the new reporting features:

```typescript
// Generate a report with all new features
const reportPath = await visualTest.generateReport();
console.log(`Report available at: ${reportPath}`);
```

#### Framework-Specific Configuration

Each framework now supports specific configuration options:

```typescript
// Playwright-specific configuration
const visualTest = testivAI.init({
  framework: 'playwright',
  playwright: {
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
    scale: 'device'
  }
});

// Selenium-specific configuration
const visualTest = testivAI.init({
  framework: 'selenium',
  selenium: {
    useCDP: true,
    fullPage: true,
    timeout: 5000
  }
});

// Puppeteer-specific configuration
const visualTest = testivAI.init({
  framework: 'puppeteer',
  puppeteer: {
    fullPage: true,
    waitUntil: 'networkidle0',
    timeout: 5000
  }
});

// Cypress-specific configuration
const visualTest = testivAI.init({
  framework: 'cypress',
  cypress: {
    capture: 'viewport',
    timeout: 5000
  }
});
```

### Troubleshooting Common Migration Issues

#### Issue: Cannot find module 'testivai-visual-regression/plugins/playwright'

**Solution**: Make sure you're importing from the correct path. In v1.0.0, plugins are in separate directories:

```typescript
// Correct import
import { playwrightPlugin } from 'testivai-visual-regression/plugins/playwright';
```

#### Issue: TypeError: playwrightPlugin is not a function

**Solution**: In v1.0.0, plugins are factory functions that need to be called:

```typescript
// Correct usage
visualTest.use(playwrightPlugin());
```

#### Issue: CLI commands not found

**Solution**: Make sure you've installed the CLI package:

```bash
npm install -g testivai-cli
```

#### Issue: Configuration not being loaded

**Solution**: Make sure your configuration file is in the correct location and format:

```javascript
// testivai.config.js in project root
module.exports = {
  // configuration options
};
```

## Need Help?

If you encounter any issues during migration, please:

1. Check the [documentation](https://github.com/yourusername/testivai/README.md)
2. Open an issue on GitHub
3. Reach out to the maintainers
