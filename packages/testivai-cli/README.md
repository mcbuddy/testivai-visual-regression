# TestiVAI CLI

Command-line interface for TestiVAI Visual Regression testing.

## Installation

```bash
npm install -g testivai-cli
```

## Quick Start

### Initialize a Project

```bash
testivai init --framework playwright --baseline-dir .testivai/baseline
```

### Compare Screenshots

```bash
testivai compare --baseline-dir .testivai/baseline --compare-dir .testivai/compare
```

### Get Help

```bash
testivai help
testivai help init
testivai help compare
```

## Commands

### `testivai init`

Initialize testivAI Visual Regression in the current project.

**Options:**
- `--framework, -f` - Testing framework to use (playwright, cypress, puppeteer, selenium) [default: playwright]
- `--baseline-dir, -b` - Directory to store baseline screenshots [default: .testivAI/visual-regression/baseline]
- `--compare-dir, -c` - Directory to store comparison screenshots [default: .testivAI/visual-regression/compare]
- `--report-dir, -r` - Directory to store generated reports [default: .testivAI/visual-regression/reports]
- `--diff-threshold, -t` - Threshold for acceptable difference between screenshots (0-1) [default: 0.1]

**Example:**
```bash
testivai init --framework playwright --baseline-dir ./screenshots/baseline --diff-threshold 0.05
```

### `testivai compare`

Compare screenshots against baselines.

**Options:**
- `--baseline-dir, -b` - Directory containing baseline screenshots [default: .testivAI/visual-regression/baseline]
- `--compare-dir, -c` - Directory containing comparison screenshots [default: .testivAI/visual-regression/compare]
- `--report-dir, -r` - Directory to store generated reports [default: .testivAI/visual-regression/reports]
- `--diff-threshold, -t` - Threshold for acceptable difference between screenshots (0-1) [default: 0.1]
- `--update-baselines, -u` - Update baselines with comparison screenshots if different [default: false]

**Example:**
```bash
testivai compare --baseline-dir ./screenshots/baseline --compare-dir ./screenshots/current --update-baselines
```

### `testivai help`

Display help information for commands.

**Usage:**
```bash
testivai help [command]
```

**Examples:**
```bash
testivai help           # Show general help
testivai help init      # Show help for init command
testivai help compare   # Show help for compare command
```

## Configuration File

The CLI can generate a configuration file (`testivai.config.js`) to store your settings:

```javascript
module.exports = {
  framework: 'playwright',
  baselineDir: '.testivAI/visual-regression/baseline',
  compareDir: '.testivAI/visual-regression/compare',
  reportDir: '.testivAI/visual-regression/reports',
  diffThreshold: 0.1,
  updateBaselines: false
};
```

## Integration with Testing Frameworks

The CLI is designed to work alongside the TestiVAI Visual Regression SDK. For programmatic usage in your tests, install the SDK:

```bash
npm install testivai-visual-regression
```

See [testivai-visual-regression](https://www.npmjs.com/package/testivai-visual-regression) for SDK documentation.

## Workflow

1. **Initialize**: Set up testivAI in your project
   ```bash
   testivai init --framework playwright
   ```

2. **Run Tests**: Use the SDK in your test files to capture screenshots

3. **Compare**: Compare captured screenshots against baselines
   ```bash
   testivai compare
   ```

4. **Review**: Check the generated HTML report for visual differences

5. **Update**: Update baselines when changes are intentional
   ```bash
   testivai compare --update-baselines
   ```

## Examples

### Basic Workflow

```bash
# Initialize project
testivai init

# Run your tests (using the SDK)
npm test

# Compare screenshots
testivai compare

# Update baselines if changes are intentional
testivai compare --update-baselines
```

### Custom Configuration

```bash
# Initialize with custom settings
testivai init \
  --framework cypress \
  --baseline-dir ./visual-tests/baseline \
  --compare-dir ./visual-tests/current \
  --report-dir ./visual-tests/reports \
  --diff-threshold 0.05

# Compare with custom settings
testivai compare \
  --baseline-dir ./visual-tests/baseline \
  --compare-dir ./visual-tests/current \
  --diff-threshold 0.05
```

## Exit Codes

- `0` - Success
- `1` - Error occurred

## License

MIT
