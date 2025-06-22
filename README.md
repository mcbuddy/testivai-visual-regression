# testivAI Visual Regression

A comprehensive TypeScript SDK and CLI for visual regression testing that integrates with multiple testing frameworks.

## Packages

This monorepo contains the following packages:

### 📦 [testivai-visual-regression](./packages/testivai-visual-regression)

The core SDK for visual regression testing.

```bash
npm install testivai-visual-regression
```

**Features:**
- Multi-framework support (Playwright, Cypress, Puppeteer, Selenium)
- TypeScript support with comprehensive type definitions
- Plugin architecture for framework-specific integrations
- Cross-browser screenshot capture
- Flexible configuration options

### 🔧 [testivai-cli](./packages/testivai-cli)

Command-line interface for testivAI Visual Regression.

```bash
npm install -g testivai-cli
```

**Features:**
- Initialize projects with `testivai init`
- Compare screenshots with `testivai compare`
- Update baselines with `--update-baselines`
- Comprehensive help system

### 💎 [testivai-ruby](./packages/testivai-ruby)

Ruby gem for testivAI Visual Regression that integrates with RSpec and Capybara.

```ruby
gem 'testivai-ruby'
```

**Features:**
- RSpec integration with custom matchers
- Capybara support for browser automation
- Remote debugging port connection
- Flexible configuration options

## Quick Start

### 1. Install the CLI (optional)

```bash
npm install -g testivai-cli
```

### 2. Install the SDK

```bash
npm install testivai-visual-regression
```

### 3. Initialize your project (using CLI)

```bash
testivai init --framework playwright
```

### 4. Use in your tests (SDK)

```typescript
import { test } from '@playwright/test';
import { testivAI } from 'testivai-visual-regression';
import { playwrightPlugin } from 'testivai-visual-regression/plugins/playwright';

const visualTest = testivAI.init({
  framework: 'playwright',
  baselineDir: '.testivai/visual-regression/baseline'
});

visualTest.use(playwrightPlugin());

test('homepage visual test', async ({ page }) => {
  await page.goto('https://example.com');
  await visualTest.capture('homepage', page);
});
```

### 5. Compare results (using CLI)

```bash
testivai compare
```

## Architecture

```
testivai/
├── packages/
│   ├── testivai-visual-regression/     # Core SDK: capture, compare, plugins
│   └── testivai-cli/                   # CLI layer that calls into SDK
├── .gitignore
├── package.json (root, with workspaces config)
└── README.md
```

## Development

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Development Tools

This project is developed using:

- **[Cline](https://github.com/cline/cline)** - AI-powered coding assistant extension for VS Code
- **[Anthropic Claude](https://www.anthropic.com/claude)** - Advanced AI model for code generation and analysis
- **VS Code** - Primary development environment with Cline extension

The combination of Cline and Claude enables rapid development, comprehensive testing, and high-quality code generation while maintaining best practices and architectural consistency.

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd testivai

# Install dependencies for all packages
npm install

# Build all packages
npm run build

# Run tests for all packages
npm test
```

### Working with Packages

```bash
# Build specific package
npm run build --workspace=packages/testivai-visual-regression

# Test specific package
npm run test --workspace=packages/testivai-cli

# Lint all packages
npm run lint
```

## Supported Testing Frameworks

- **Playwright** - Full support with native integration
- **Cypress** - Custom commands and plugin architecture
- **Puppeteer** - Page event listeners and custom hooks
- **Selenium** - WebDriver extensions and event listeners
- **RSpec/Capybara** - Ruby integration via testivai-ruby gem

## Features

### Core SDK Features

- 🎯 **Multi-Framework Support**: Works seamlessly with popular testing frameworks
- 🔧 **Plugin Architecture**: Extensible system for framework-specific integrations
- 📸 **Cross-Browser Screenshots**: Consistent capture across different browsers
- ⚙️ **Flexible Configuration**: Customizable thresholds, directories, and options
- 📝 **TypeScript Support**: Full type safety and IntelliSense support
- 🔄 **Git Integration**: Branch-based comparison workflows (planned)
- 📊 **HTML Reports**: Interactive reports for reviewing differences (planned)

### CLI Features

- 🚀 **Quick Setup**: Initialize projects with a single command
- 📋 **Comprehensive Commands**: Init, compare, and help commands
- ⚙️ **Flexible Options**: Customizable settings for different workflows
- 🎨 **Colored Output**: Enhanced terminal experience with chalk
- 📖 **Built-in Help**: Detailed help for all commands and options

## Documentation

- [SDK Documentation](./packages/testivai-visual-regression/README.md)
- [CLI Documentation](./packages/testivai-cli/README.md)
- [Ruby Gem Documentation](./packages/testivai-ruby/README.md)
- [Publishing Guide](./PUBLISHING.md)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for your changes
5. Ensure all tests pass
6. Submit a pull request

## License

MIT

## Support

For issues and questions:
- Create an issue in this repository
- Check the documentation in each package
- Review the examples in the package READMEs
