# testivAI Visual Regression

A simple yet powerful CLI tool for visual regression testing that works with Playwright testing framework.

## 🔧 Installation

```bash
npm install -g testivai
```

## ✨ Features

- **Simple CLI Interface**: Easy-to-use commands for visual regression testing
- **Framework Agnostic**: Works with any testing framework that can capture screenshots
- **Flexible Configuration**: Customizable thresholds, directories, and options
- **HTML Reports**: Interactive reports for reviewing differences
- **Git Integration**: Branch-based comparison workflows

## 🚀 Quick Start in 5 Minutes

### 1. Install testivai

```bash
npm install -g testivai
```

### 2. Initialize Your Project

Initialize your project with the `testivai init` command:

```bash
testivai init --framework playwright
```

This will:
- Create a configuration file (testivai.config.js) with default settings
- Set up the necessary directory structure (.testivai/visual-regression/baseline, compare, reports)
- Configure the framework to use (Playwright in this example)

You can customize the initialization with options:
```bash
testivai init --framework playwright --diff-threshold 0.2
```

### 3. Capture Baseline Screenshots

Place your baseline screenshots in the baseline directory created during initialization. You can capture these using Playwright:

```bash
# Example with Playwright
npx playwright screenshot https://example.com .testivai/visual-regression/baseline/homepage.png
```

### 4. Run a Comparison Test

After making changes to your application, capture new screenshots for comparison:

```bash
npx playwright screenshot https://example.com .testivai/visual-regression/compare/homepage.png
```

Then run the comparison:

```bash
testivai compare
```

This will:
- Compare all screenshots in the compare directory against their baseline versions
- Generate diff images highlighting the differences
- Create an HTML report showing the results

You can also specify custom directories if needed:
```bash
testivai compare --baseline-dir .testivai/visual-regression/baseline --compare-dir .testivai/visual-regression/compare
```

#### Comparison Engines

testivAI supports multiple comparison engines:

- **pixelmatch** (default): Fast and accurate pixel-by-pixel comparison
- **jimp**: Image processing library with additional capabilities
- **opencv**: Computer vision library with advanced image analysis (experimental)

You can specify which engine to use for comparison:

```bash
testivai compare --engine opencv
```

Or set the default engine for your project:

```bash
testivai set-engine jimp
```

The engine can also be configured in your testivai.config.js file:

```javascript
module.exports = {
  // Other configuration options
  engine: 'pixelmatch'
};
```

### 5. Approve Changes

If the changes are expected and you want to update your baselines:

```bash
testivai compare --update-baselines
```

This will replace your baseline screenshots with the new versions, making them the new reference point for future comparisons.

## Architecture

```
testivai/
├── src/                               # Source code
│   ├── cli.ts                         # CLI entry point
│   ├── commands.ts                    # Command implementations
│   ├── interfaces.ts                  # TypeScript interfaces
│   ├── utils.ts                       # Utility functions
│   └── types.d.ts                     # Type declarations
├── test/                              # Test files
├── dist/                              # Compiled JavaScript
├── .gitignore
├── package.json
├── tsconfig.json
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

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

### Development Commands

```bash
# Build the project
npm run build

# Run tests
npm run test

# Run tests with watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint the code
npm run lint

# Clean build artifacts
npm run clean
```

## Supported Testing Frameworks

- **Playwright** - Full support with native integration (Done)
- **Cypress** - Custom commands and plugin architecture (WIP)
- **Puppeteer** - Page event listeners and custom hooks (WIP)
- **Selenium** - WebDriver extensions and event listeners (WIP)

## Features

### Key Features

- 🎯 **Framework Agnostic**: Works with screenshots from any testing tool
- 📸 **Pixel-Perfect Comparison**: Accurate image diffing with customizable thresholds
- 🔍 **Multiple Comparison Engines**: Support for Pixelmatch, Jimp, and OpenCV
- ⚙️ **Flexible Configuration**: Customizable directories, thresholds, and options
- 📊 **HTML Reports**: Interactive reports for reviewing differences
- 🔄 **Git Integration**: Branch-based comparison workflows
- 📝 **TypeScript Support**: Full type safety and IntelliSense support
- 🚀 **Quick Setup**: Initialize projects with a single command
- 📋 **Comprehensive Commands**: Init, compare, set-engine, and help commands
- 🎨 **Colored Output**: Enhanced terminal experience with chalk
- 📖 **Built-in Help**: Detailed help for all commands and options

## Documentation

- [Publishing Guide](./PUBLISHING.md)
- [Diffs JSON Format](./DIFFS_JSON_FORMAT.md)
- [Migration Guide](./MIGRATION.md)

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
- Check the documentation files
- Review the examples in the test files
