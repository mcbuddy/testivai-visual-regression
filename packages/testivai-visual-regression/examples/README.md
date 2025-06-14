# TestiVAI Visual Regression Examples

This directory contains examples of how to use TestiVAI Visual Regression with different testing frameworks.

## Playwright Example

The `playwright-example.ts` file demonstrates how to integrate TestiVAI with Playwright for visual regression testing.

### Prerequisites

To run the Playwright example, you need to install Playwright as a peer dependency:

```bash
npm install --save-dev @playwright/test
npx playwright install
```

### Key Features Demonstrated

1. **Basic Setup**: How to initialize TestiVAI with the Playwright plugin
2. **Full Page Screenshots**: Capturing entire page content
3. **Viewport Screenshots**: Capturing visible area only
4. **Element Screenshots**: Capturing specific elements using CSS selectors
5. **Responsive Testing**: Testing across different viewport sizes
6. **Form Interaction**: Capturing UI states before and after user interactions

### Usage

The example shows three main patterns:

#### 1. Basic Page Screenshot
```typescript
await visualTest.capture('homepage-full', page, {
  fullPage: true
});
```

#### 2. Element-Specific Screenshot
```typescript
await visualTest.capture('homepage-header', page, {
  selector: 'header',
  fullPage: false
});
```

#### 3. Responsive Testing
```typescript
await page.setViewportSize({ width: 1920, height: 1080 });
await visualTest.capture('homepage-desktop', page);
```

#### 4. Automatic Filename Generation
```typescript
// Navigate to https://example.com/products/shoes
await page.goto('https://example.com/products/shoes');

// Capture without providing a name - filename will be "products-shoes.png"
await visualTest.capture(undefined, page, {
  fullPage: true
});

// For homepage (https://example.com/), filename will be "example-com.png"
await page.goto('https://example.com/');
await visualTest.capture(undefined, page);
```

### Screenshot Organization

Screenshots are automatically organized in the following structure:

```
.testivai/visual-regression/
├── baseline/
│   └── playwright/
│       ├── homepage-full.png
│       ├── homepage-viewport.png
│       └── homepage-header.png
└── compare/
    └── [branch-name]/
        └── playwright/
            ├── homepage-full.png
            ├── homepage-viewport.png
            └── homepage-header.png
```

### Configuration Options

The Playwright plugin supports several configuration options:

- `baselineDir`: Directory for baseline screenshots
- `compareDir`: Directory for comparison screenshots
- `isBaseline`: Whether to create baseline screenshots
- `branch`: Git branch name (auto-detected if not provided)

### Screenshot Options

The capture method supports various options:

- `fullPage`: Capture the entire page or just the viewport
- `selector`: CSS selector for element-specific screenshots
- `ignoreRegions`: Areas to ignore during comparison

### Running the Example

1. Install dependencies:
   ```bash
   npm install
   npm install --save-dev @playwright/test
   npx playwright install
   ```

2. Create baseline screenshots:
   ```typescript
   // Set isBaseline: true in plugin configuration
   visualTest.use(playwrightPlugin({
     isBaseline: true
   }));
   ```

3. Run tests:
   ```bash
   npx playwright test examples/playwright-example.ts
   ```

4. Compare screenshots:
   ```typescript
   // Set isBaseline: false in plugin configuration
   visualTest.use(playwrightPlugin({
     isBaseline: false
   }));
   ```

### Integration with CI/CD

For continuous integration, you can:

1. Store baseline screenshots in version control
2. Run visual regression tests on pull requests
3. Generate reports for visual differences
4. Automatically update baselines when approved

### Best Practices

1. **Consistent Environment**: Use the same browser version and settings
2. **Wait for Content**: Ensure dynamic content is loaded before capturing
3. **Disable Animations**: Use `animations: 'disabled'` for consistent results
4. **Ignore Dynamic Content**: Exclude timestamps, ads, or other changing elements
5. **Meaningful Names**: Use descriptive names for screenshot identification

### Troubleshooting

- **Flaky Tests**: Ensure proper wait conditions and disable animations
- **Large Diffs**: Check for dynamic content or timing issues
- **Missing Screenshots**: Verify file paths and permissions
- **Browser Differences**: Use consistent browser versions across environments
