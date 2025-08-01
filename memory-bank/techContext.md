# Technical Context: testivAI Visual Regression

## Technologies Used

### Core Technologies

| Technology | Purpose |
|------------|---------|
| TypeScript | Primary development language for type safety and developer experience |
| Node.js    | Runtime environment for the package |
| Git        | Version control and branch detection for comparison workflows |
| HTML/CSS/JS | For interactive report generation |
| Chalk      | Terminal coloring for CLI output |

### Testing Frameworks

| Framework  | Integration Method |
|------------|-------------------|
| Playwright | Plugin hooks into test lifecycle events |

### Image Processing

| Technology | Purpose |
|------------|---------|
| Sharp/Jimp | Node.js image processing for screenshot comparison |
| Canvas     | Browser-based image manipulation for report visualization |
| PixelMatch | Pixel-by-pixel comparison algorithm |

### Build & Development

| Tool       | Purpose |
|------------|---------|
| TypeScript | Compilation for JavaScript/TypeScript |
| ESLint     | Code quality and style enforcement |
| Prettier   | Code formatting |
| TypeDoc    | API documentation generation |

### Testing Tools

| Tool       | Purpose |
|------------|---------|
| Jest       | Primary test runner for JavaScript/TypeScript tests |
| Testing Library | Component testing utilities |
| Sinon      | Mocks, stubs, and spies for unit testing |
| Chai       | Assertion library for expressive test cases |

### Documentation Technologies

| Technology | Purpose |
|------------|---------|
| Markdown   | Documentation format for README and guides |
| Shell Commands | Examples in Quick Start guide |
| Mermaid    | Diagrams for architecture visualization |
| JSDoc      | Code documentation for TypeScript/JavaScript |

## Development Environment

### Prerequisites

- Node.js (v16+)
- Git
- npm
- Playwright for integration testing

### Project Structure

```
testivai/
├── src/                       # Source code
│   ├── cli.ts                 # CLI entry point
│   ├── commands.ts            # Command implementations
│   ├── interfaces.ts          # TypeScript interfaces
│   ├── utils.ts               # Utility functions
│   └── types.d.ts             # Type declarations
├── test/                      # Test files
├── dist/                      # Compiled JavaScript
├── templates/                 # Report templates
│   └── reports/               # Interactive HTML report templates
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

### Build Process

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Test the package
npm test

# Lint the code
npm run lint

# Clean build artifacts
npm run clean
```

### Development Workflow

1. **Setup**: Clone repository and run `npm install` to set up dependencies
2. **Feature Development**: Work on features in appropriate modules
3. **Testing**: Run tests during development
4. **Build Verification**: Ensure package builds successfully
5. **Documentation Updates**: Update documentation as needed

### Quick Start Development Workflow

1. **Install Package**: `npm install -g testivai`
2. **Initialize Project**: `testivai init --framework playwright`
3. **Capture Baseline Screenshots**: Use Playwright to capture screenshots in the baseline directory
4. **Capture Comparison Screenshots**: After making changes, capture screenshots in the compare directory
5. **Run Comparison**: `testivai compare`
6. **Review Results**: Open generated HTML report
7. **Approve Changes**: `testivai compare --update-baselines`

## Technical Constraints

### Cross-Framework Compatibility

- Focused on Playwright integration
- API designed to be extensible for future framework support
- Support for different browser rendering engines

### Image Comparison Challenges

- Handling dynamic content (dates, animations)
- Browser rendering inconsistencies
- Performance considerations for large or numerous screenshots
- Color space and format consistency

### Git Integration Limitations

- Requires Git repository for branch detection
- Large binary files (screenshots) management
- Potential conflicts in baseline updates

### Browser Environment Constraints

- Cross-browser rendering differences
- Headless vs headed browser variations
- Mobile emulation considerations

### Documentation Constraints

- Beginner-friendly Quick Start guide
- Clear, concise instructions with shell commands
- Explanation of each step without overwhelming users
- Balance between simplicity and completeness

## Dependencies

### Package Dependencies

```json
{
  "dependencies": {
    "chalk": "^4.1.2",          // Terminal coloring for CLI output
    "glob": "^10.3.10",         // File pattern matching
    "pixelmatch": "^5.3.0",     // Screenshot comparison
    "pngjs": "^7.0.0",          // PNG image processing
    "sharp": "^0.34.2"          // Image processing
  },
  "devDependencies": {
    "@types/jest": "^29.5.14",
    "@types/pixelmatch": "^5.2.6",
    "@types/pngjs": "^6.0.5",
    "@typescript-eslint/eslint-plugin": "^8.34.0",
    "@typescript-eslint/parser": "^8.34.0",
    "eslint": "^9.28.0",
    "jest": "^29.7.0",
    "rimraf": "^5.0.10",
    "ts-jest": "^29.3.4",
    "typescript": "^5.8.3"
  },
  "peerDependencies": {
    "playwright": "^1.20.0"      // Optional Playwright integration
  }
}
```

### Package Configuration

```json
{
  "name": "testivai",
  "version": "1.0.15",
  "description": "CLI tool for testivAI Visual Regression testing",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "testivai": "dist/cli.js"
  },
  "files": [
    "dist/**/*"
  ],
  "publishConfig": {
    "access": "public"
  }
}
```

## Tool Usage Patterns

### CLI Usage

```bash
# Install the package globally
npm install -g testivai

# Initialize a new project
testivai init --framework playwright

# Customize initialization with options
testivai init --framework playwright --diff-threshold 0.2

# Compare screenshots
testivai compare

# Update baselines with comparison screenshots
testivai compare --update-baselines

# Get help
testivai help
```

### Playwright Integration

```typescript
// Playwright test file
import { test } from '@playwright/test';
import { testivAI } from 'testivai';
import { playwrightPlugin } from 'testivai/plugins/playwright';

// Initialize testivAI with Playwright plugin
const visualTest = testivAI.init({
  framework: 'playwright',
  baselineDir: '.testivai/visual-regression/baseline',
  diffThreshold: 0.1
});

visualTest.use(playwrightPlugin());

// Use standard Playwright test commands with testivAI visual assertions
test('homepage visual test', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Capture screenshot for visual comparison
  await visualTest.capture('homepage', page);
  
  // Continue with other Playwright test assertions
  await expect(page.locator('h1')).toHaveText('Welcome');
});

// Run with standard Playwright command:
// npx playwright test
```

### Quick Start Usage Pattern

```typescript
// Step 1: Install testivai
// npm install -g testivai

// Step 2: Initialize your project
// testivai init --framework playwright

// Step 3: Import and initialize
import { testivAI } from 'testivai';
import { playwrightPlugin } from 'testivai/plugins/playwright';
import { chromium } from 'playwright';

// Step 4: Set up Playwright and testivAI
async function runVisualTest() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const visualTest = testivAI.init({
    framework: 'playwright',
    baselineDir: '.testivai/visual-regression/baseline',
    compareDir: '.testivai/visual-regression/compare',
    reportDir: '.testivai/visual-regression/reports'
  });
  
  visualTest.use(playwrightPlugin());
  
  // Step 5: Capture baseline screenshot
  await page.goto('https://example.com');
  await visualTest.capture('homepage', page);
  
  // Step 6: Make changes (in a real scenario, this would be your app changes)
  // ...
  
  // Step 7: Capture comparison screenshot
  await visualTest.capture('homepage', page, { mode: 'compare' });
  
  // Step 8: Run comparison and generate report
  const results = await visualTest.compare();
  await visualTest.generateReport(results);
  
  // Step 9: Update baselines if needed
  // await visualTest.updateBaselines();
  
  await browser.close();
}

runVisualTest().catch(console.error);
```

### Configuration File

```js
// testivai.config.js
module.exports = {
  framework: 'playwright',
  baselineDir: '.testivai/visual-regression/baseline',
  compareDir: '.testivai/visual-regression/compare',
  reportDir: '.testivai/visual-regression/reports',
  diffThreshold: 0.1,
  updateBaselines: false,
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

## Deployment Considerations

### Package Distribution Strategy

#### Publishing
- Published as `testivai` on npm
- Follows semantic versioning

#### Installation Pattern

```bash
# For programmatic use
npm install testivai

# For CLI use (global installation)
npm install -g testivai
```

### CI/CD Integration

#### CI/CD Pipeline

```yaml
# Example GitHub Actions workflow
name: CI/CD
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm run build
      - run: npm test
      
  publish:
    needs: [test]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
          registry-url: 'https://registry.npmjs.org'
      - run: npm install
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Performance Optimization

#### Build Optimization
- **Incremental Builds**: Only rebuild files that have changed
- **Caching**: Leverage npm caching for dependencies

#### Test Optimization
- **Selective Testing**: Run tests only for changed files in CI
- **Coverage Optimization**: High coverage thresholds for core functionality

### Version Management

#### Versioning Strategy
- **Semantic Versioning**: Follow semver for package versioning
- **Release Notes**: Detailed release notes for each version
- **Migration Guides**: Guides for upgrading between major versions

#### Release Process
1. **Development**: Work on features in feature branches
2. **Testing**: Ensure all tests pass
3. **Versioning**: Update package version appropriately
4. **Publishing**: Publish to npm
5. **Documentation**: Update documentation and release notes

### Documentation Strategy

#### Documentation Types
- **Quick Start Guide**: Beginner-friendly "Quick Start in 5 Minutes" section
- **API Documentation**: Detailed documentation for SDK APIs
- **CLI Documentation**: Command reference and usage examples
- **Framework Integration Guides**: Playwright integration instructions
- **Troubleshooting Guide**: Common issues and solutions

#### Documentation Principles
- **Progressive Disclosure**: Basic information first, advanced options later
- **Concrete Examples**: Real code snippets and shell commands
- **Clear Explanations**: Brief explanations of what each step does
- **Visual Aids**: Diagrams and screenshots where helpful
- **Consistency**: Consistent terminology and formatting across all documentation
