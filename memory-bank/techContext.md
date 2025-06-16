# Technical Context: testivAI Visual Regression

## Technologies Used

### Core Technologies

| Technology | Purpose | Package |
|------------|---------|---------|
| TypeScript | Primary development language for type safety and developer experience | Both |
| Node.js    | Runtime environment for the SDK and CLI | Both |
| npm Workspaces | Monorepo management and dependency coordination | Root |
| Git        | Version control and branch detection for comparison workflows | SDK |
| HTML/CSS/JS | For interactive report generation | SDK |

### Testing Frameworks

| Framework  | Integration Method | Package |
|------------|-------------------|---------|
| Playwright | Plugin hooks into test lifecycle events | SDK |
| Cypress    | Custom commands and plugin architecture | SDK |
| Puppeteer  | Page event listeners and custom hooks | SDK |
| Selenium   | WebDriver extensions and event listeners | SDK |

### Image Processing

| Technology | Purpose | Package |
|------------|---------|---------|
| Sharp/Jimp | Node.js image processing for screenshot comparison | SDK |
| Canvas     | Browser-based image manipulation for report visualization | SDK |
| PixelMatch | Pixel-by-pixel comparison algorithm | SDK |

### Build & Development

| Tool       | Purpose | Package |
|------------|---------|---------|
| TypeScript | Compilation for both packages | Both |
| ESLint     | Code quality and style enforcement | Both |
| Prettier   | Code formatting | Both |
| TypeDoc    | API documentation generation | SDK |

### Testing Tools

| Tool       | Purpose | Package |
|------------|---------|---------|
| Jest       | Primary test runner for unit and integration tests | Both |
| Testing Library | Component testing utilities | SDK |
| Sinon      | Mocks, stubs, and spies for unit testing | SDK |
| Chai       | Assertion library for expressive test cases | SDK |

### CLI-Specific Technologies

| Technology | Purpose | Package |
|------------|---------|---------|
| Chalk      | Terminal coloring and formatting | CLI |
| Commander  | Command-line argument parsing (future) | CLI |

## Development Environment

### Prerequisites

- Node.js (v16+)
- Git
- npm (with workspaces support)
- Testing frameworks for integration testing (Playwright, Cypress, etc.)

### Monorepo Structure

```
testivai/
├── packages/
│   ├── testivai-visual-regression/     # Core SDK package
│   │   ├── src/
│   │   │   ├── core/                   # Core SDK functionality
│   │   │   ├── capture/                # Screenshot capture module
│   │   │   ├── compare/                # Comparison module
│   │   │   ├── report/                 # Report generation
│   │   │   ├── plugins/                # Framework-specific plugins
│   │   │   │   ├── playwright/
│   │   │   │   ├── cypress/
│   │   │   │   ├── puppeteer/
│   │   │   │   └── selenium/
│   │   │   ├── config/                 # Configuration handling
│   │   │   └── ai/                     # AI integration placeholder
│   │   ├── test/                       # SDK test suite
│   │   ├── package.json                # SDK package configuration
│   │   ├── tsconfig.json               # SDK TypeScript config
│   │   ├── jest.config.js              # SDK Jest config
│   │   └── README.md                   # SDK documentation
│   │
│   └── testivai-cli/                   # CLI package
│       ├── src/
│       │   ├── cli.ts                  # CLI entry point
│       │   ├── commands.ts             # Command implementations
│       │   ├── interfaces.ts           # CLI-specific interfaces
│       │   └── index.ts                # CLI package exports
│       ├── test/                       # CLI test suite
│       ├── package.json                # CLI package configuration
│       ├── tsconfig.json               # CLI TypeScript config
│       ├── jest.config.js              # CLI Jest config
│       └── README.md                   # CLI documentation
│
├── memory-bank/                        # Project documentation
├── package.json                        # Root workspace configuration
├── README.md                           # Monorepo documentation
└── .gitignore                         # Git ignore rules
```

### Build Process

#### Workspace-Level Commands

```bash
# Install all dependencies
npm install

# Build all packages
npm run build

# Test all packages
npm test

# Lint all packages
npm run lint

# Clean all packages
npm run clean
```

#### Package-Specific Commands

```bash
# Build specific package
npm run build --workspace=packages/testivai-visual-regression
npm run build --workspace=packages/testivai-cli

# Test specific package
npm run test --workspace=packages/testivai-visual-regression
npm run test --workspace=packages/testivai-cli
```

### Development Workflow

1. **Monorepo Setup**: Clone repository and run `npm install` to set up all packages
2. **Feature Development**: Work in appropriate package (SDK or CLI)
3. **Testing**: Run package-specific tests during development
4. **Integration Testing**: Test cross-package functionality
5. **Build Verification**: Ensure all packages build successfully
6. **Documentation Updates**: Update package-specific and root documentation

## Technical Constraints

### Monorepo Management

- **Workspace Dependencies**: CLI package must properly depend on SDK package
- **Version Synchronization**: Need strategy for coordinating package versions
- **Build Order**: CLI package build depends on SDK package being built first
- **Testing Isolation**: Each package must be testable independently

### Cross-Framework Compatibility (SDK)

- Must maintain consistent API across different testing frameworks
- Need to handle framework-specific quirks and limitations
- Support for different browser rendering engines

### Image Comparison Challenges (SDK)

- Handling dynamic content (dates, animations)
- Browser rendering inconsistencies
- Performance considerations for large or numerous screenshots
- Color space and format consistency

### CLI User Experience

- Cross-platform compatibility (Windows, macOS, Linux)
- Intuitive command-line interface design
- Proper error handling and user feedback
- Integration with existing development workflows

### Git Integration Limitations (SDK)

- Requires Git repository for branch detection
- Large binary files (screenshots) management
- Potential conflicts in baseline updates

### Browser Environment Constraints (SDK)

- Cross-browser rendering differences
- Headless vs headed browser variations
- Mobile emulation considerations

## Dependencies

### Root Package Dependencies

```json
{
  "devDependencies": {
    "@types/jest": "^29.5.14",
    "@typescript-eslint/eslint-plugin": "^8.34.0",
    "@typescript-eslint/parser": "^8.34.0",
    "eslint": "^9.28.0",
    "jest": "^29.7.0",
    "rimraf": "^5.0.10",
    "ts-jest": "^29.3.4",
    "typescript": "^5.8.3"
  }
}
```

### SDK Package Dependencies

```json
{
  "dependencies": {
    "glob": "^8.1.0",           // File pattern matching (CommonJS compatible)
    "pixelmatch": "^5.3.0",    // Screenshot comparison (CommonJS compatible)
    "sharp": "^0.34.2",         // Image processing
    "simple-git": "^3.28.0"    // Git integration
  },
  "devDependencies": {
    "@types/pixelmatch": "^5.2.6",
    "@types/pngjs": "^6.0.5",
    // ... shared dev dependencies from root
  },
  "peerDependencies": {
    "playwright": "^1.20.0",      // Optional Playwright integration
    "cypress": "^10.0.0",         // Optional Cypress integration
    "puppeteer": "^13.0.0",       // Optional Puppeteer integration
    "selenium-webdriver": "^4.1.0" // Optional Selenium integration
  }
}
```

### CLI Package Dependencies

```json
{
  "dependencies": {
    "testivai-visual-regression": "^1.0.0", // Core SDK dependency
    "chalk": "^4.1.2"                       // Terminal coloring (CommonJS compatible)
  },
  "devDependencies": {
    // ... shared dev dependencies from root
  }
}
```

### Package Configuration

#### SDK Package Configuration

```json
{
  "name": "testivai-visual-regression",
  "version": "1.0.0",
  "description": "A TypeScript SDK for visual regression testing that integrates with multiple testing frameworks.",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist/**/*"
  ],
  "publishConfig": {
    "access": "public"
  }
}
```

#### CLI Package Configuration

```json
{
  "name": "testivai-cli",
  "version": "1.0.0",
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

### SDK Integration with Testing Frameworks

The testivAI Visual Regression SDK is designed to integrate seamlessly with existing testing framework commands rather than requiring a separate CLI. This allows users to run visual regression tests alongside their existing test suites.

#### Playwright Integration

```typescript
// Playwright test file
import { test } from '@playwright/test';
import { testivAI } from 'testivai-visual-regression';
import { playwrightPlugin } from 'testivai-visual-regression/plugins/playwright';

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

### CLI Usage Patterns

The CLI provides standalone functionality for project initialization and screenshot comparison:

#### Project Initialization

```bash
# Initialize with default settings
testivai init

# Initialize with custom framework
testivai init --framework cypress --baseline-dir ./screenshots/baseline

# Get help for init command
testivai help init
```

#### Screenshot Comparison

```bash
# Compare with default settings
testivai compare

# Compare with custom directories
testivai compare --baseline-dir ./screenshots/baseline --compare-dir ./screenshots/current

# Update baselines after review
testivai compare --update-baselines
```

### Monorepo Development Patterns

#### Working with Both Packages

```bash
# Install all dependencies
npm install

# Build all packages (SDK first, then CLI)
npm run build

# Test all packages
npm test

# Work on SDK package
cd packages/testivai-visual-regression
npm run test:watch

# Work on CLI package
cd packages/testivai-cli
npm run test:watch
```

#### Package Publishing

```bash
# Build and test before publishing
npm run build && npm test

# Publish SDK package
cd packages/testivai-visual-regression
npm publish

# Publish CLI package (after SDK is published)
cd packages/testivai-cli
npm publish
```

### Configuration File

```js
// testivai.config.js (generated by CLI init command)
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

#### Independent Publishing
- **SDK Package**: Published as `testivai-visual-regression`
- **CLI Package**: Published as `testivai-cli`
- **User Choice**: Install only what's needed

#### Installation Patterns

```bash
# For programmatic use only
npm install testivai-visual-regression

# For command-line use only
npm install -g testivai-cli

# For both programmatic and CLI use
npm install testivai-visual-regression
npm install -g testivai-cli
```

### CI/CD Integration

#### Monorepo CI/CD Pipeline

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
    needs: test
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
      - run: cd packages/testivai-visual-regression && npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      - run: cd packages/testivai-cli && npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Performance Optimization

#### Build Optimization
- **Parallel Builds**: Packages can be built in parallel where dependencies allow
- **Incremental Builds**: Only rebuild packages that have changed
- **Caching**: Leverage npm workspace caching for dependencies

#### Test Optimization
- **Package Isolation**: Tests run independently for each package
- **Selective Testing**: Run tests only for changed packages in CI
- **Coverage Optimization**: Different coverage thresholds for different package types

### Version Management

#### Versioning Strategy
- **Independent Versioning**: Each package can have its own version
- **Coordinated Releases**: Major releases coordinated across packages
- **Semantic Versioning**: Follow semver for both packages
- **Dependency Management**: CLI package version constraints on SDK package

#### Release Process
1. **Development**: Work on features in appropriate packages
2. **Testing**: Ensure all packages pass tests
3. **Versioning**: Update package versions appropriately
4. **Publishing**: Publish SDK first, then CLI
5. **Documentation**: Update documentation and release notes
