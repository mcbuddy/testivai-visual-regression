/**
 * CLI commands for testivAI Visual Regression
 */

import { CLICommand, CLICommandRegistry, Engine } from './interfaces';
import chalk from 'chalk';

/**
 * Implementation of the CLI Command Registry
 */
export class CLICommandRegistryImpl implements CLICommandRegistry {
  private commands: Map<string, CLICommand> = new Map();

  /**
   * Register a command
   * @param command Command to register
   */
  public register(command: CLICommand): void {
    this.commands.set(command.name, command);
  }

  /**
   * Get a command by name
   * @param name Name of the command
   */
  public get(name: string): CLICommand | undefined {
    return this.commands.get(name);
  }

  /**
   * Get all registered commands
   */
  public getAll(): CLICommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * Execute a command
   * @param name Name of the command
   * @param args Command arguments
   * @param options Command options
   */
  public async execute(name: string, args: string[], options: Record<string, unknown>): Promise<void> {
    const command = this.get(name);
    
    if (!command) {
      throw new Error(`Command '${name}' not found`);
    }
    
    await command.execute(args, options);
  }
}

/**
 * Base class for CLI commands
 */
export abstract class BaseCLICommand implements CLICommand {
  /**
   * Name of the command
   */
  public abstract name: string;
  
  /**
   * Description of the command
   */
  public abstract description: string;
  
  /**
   * Command options
   */
  public options?: import('./interfaces').CLICommandOption[];
  
  /**
   * Execute the command
   * @param args Command arguments
   * @param options Command options
   */
  public abstract execute(args: string[], options: Record<string, unknown>): Promise<void>;
}

/**
 * Help command implementation
 */
export class HelpCommand extends BaseCLICommand {
  public name = 'help';
  public description = 'Display help information';
  
  constructor(private registry: CLICommandRegistry) {
    super();
  }
  
  public async execute(args: string[], options: Record<string, unknown>): Promise<void> {
    if (args.length > 0) {
      const commandName = args[0];
      const command = this.registry.get(commandName);
      
      if (command) {
        this.displayCommandHelp(command);
      } else {
        console.error(chalk.red(`Command '${commandName}' not found`));
      }
    } else {
      this.displayGeneralHelp();
    }
  }
  
  private displayGeneralHelp(): void {
    console.log(chalk.blue.bold('testivAI Visual Regression CLI'));
    console.log('');
    console.log('Usage: testivai <command> [options]');
    console.log('');
    console.log(chalk.yellow('Commands:'));
    
    const commands = this.registry.getAll();
    const maxNameLength = Math.max(...commands.map(cmd => cmd.name.length));
    
    commands.forEach(command => {
      console.log(`  ${chalk.green(command.name.padEnd(maxNameLength + 2))}${command.description}`);
    });
    
    console.log('');
    console.log('For more information on a specific command, run:');
    console.log(`  ${chalk.cyan('testivai help <command>')}`);
  }
  
  private displayCommandHelp(command: CLICommand): void {
    console.log(chalk.blue.bold(`Command: ${command.name}`));
    console.log('');
    console.log(`Description: ${command.description}`);
    console.log('');
    
    if (command.options && command.options.length > 0) {
      console.log(chalk.yellow('Options:'));
      
      command.options.forEach(option => {
        const flag = option.shortFlag ? `${option.shortFlag}, ${option.flag}` : option.flag;
        console.log(`  ${chalk.green(flag.padEnd(20))}${option.description}`);
        
        if (option.defaultValue !== undefined) {
          console.log(`  ${''.padEnd(20)}Default: ${chalk.cyan(String(option.defaultValue))}`);
        }
      });
    }
  }
}

/**
 * Initialize command implementation
 */
export class InitCommand extends BaseCLICommand {
  public name = 'init';
  public description = 'Initialize testivAI Visual Regression in the current project';
  
  public options = [
    {
      flag: '--framework',
      shortFlag: '-f',
      description: 'Testing framework to use (playwright, cypress, puppeteer, selenium)',
      requiresValue: true,
      defaultValue: 'playwright'
    },
    {
      flag: '--baseline-dir',
      shortFlag: '-b',
      description: 'Directory to store baseline screenshots',
      requiresValue: true,
      defaultValue: '.testivai/visual-regression/baseline'
    },
    {
      flag: '--compare-dir',
      shortFlag: '-c',
      description: 'Directory to store comparison screenshots',
      requiresValue: true,
      defaultValue: '.testivai/visual-regression/compare'
    },
    {
      flag: '--report-dir',
      shortFlag: '-r',
      description: 'Directory to store generated reports',
      requiresValue: true,
      defaultValue: '.testivai/visual-regression/reports'
    },
    {
      flag: '--diff-threshold',
      shortFlag: '-t',
      description: 'Threshold for acceptable difference between screenshots (0-1)',
      requiresValue: true,
      defaultValue: 0.1
    }
  ];
  
  public async execute(args: string[], options: Record<string, unknown>): Promise<void> {
    console.log(chalk.blue('Initializing testivAI Visual Regression...'));
    
    const framework = options.framework || 'playwright';
    // Convert option names from kebab-case to camelCase
    const baselineDir = options['baseline-dir'] || options.baselineDir || '.testivai/visual-regression/baseline';
    const compareDir = options['compare-dir'] || options.compareDir || '.testivai/visual-regression/compare';
    const reportDir = options['report-dir'] || options.reportDir || '.testivai/visual-regression/reports';
    const diffThreshold = options['diff-threshold'] || options.diffThreshold || 0.1;
    
    // Create configuration file
    const configContent = `module.exports = {
  framework: '${framework}',
  baselineDir: '${baselineDir}',
  compareDir: '${compareDir}',
  reportDir: '${reportDir}',
  diffThreshold: ${diffThreshold},
  updateBaselines: false,
  engine: 'pixelmatch'
};
`;
    
    // Actually write the configuration file to disk
    const fs = require('fs');
    const path = require('path');
    
    // Write the configuration file
    fs.writeFileSync('testivai.config.js', configContent);
    
    // Create the directories
    fs.mkdirSync(String(baselineDir), { recursive: true });
    fs.mkdirSync(String(compareDir), { recursive: true });
    fs.mkdirSync(String(reportDir), { recursive: true });
    
    console.log(chalk.green('Configuration file created: testivai.config.js'));
    console.log('');
    console.log(chalk.yellow('Configuration:'));
    console.log(configContent);
    
    console.log('');
    console.log(chalk.green.bold('testivAI Visual Regression initialized successfully!'));
  }
}

/**
 * Compare command implementation
 */
export class CompareCommand extends BaseCLICommand {
  public name = 'compare';
  public description = 'Compare screenshots against baselines';
  
  public options = [
    {
      flag: '--baseline-dir',
      shortFlag: '-b',
      description: 'Directory containing baseline screenshots',
      requiresValue: true,
      defaultValue: '.testivai/visual-regression/baseline'
    },
    {
      flag: '--compare-dir',
      shortFlag: '-c',
      description: 'Directory containing comparison screenshots',
      requiresValue: true,
      defaultValue: '.testivai/visual-regression/compare'
    },
    {
      flag: '--report-dir',
      shortFlag: '-r',
      description: 'Directory to store generated reports',
      requiresValue: true,
      defaultValue: '.testivai/visual-regression/reports'
    },
    {
      flag: '--diff-threshold',
      shortFlag: '-t',
      description: 'Threshold for acceptable difference between screenshots (0-1)',
      requiresValue: true,
      defaultValue: 0.1
    },
    {
      flag: '--update-baselines',
      shortFlag: '-u',
      description: 'Update baselines with comparison screenshots if different',
      requiresValue: false,
      defaultValue: false
    },
    {
      flag: '--engine',
      shortFlag: '-e',
      description: 'Comparison engine to use (pixelmatch, jimp, opencv)',
      requiresValue: true,
      defaultValue: 'pixelmatch'
    }
  ];
  
  public async execute(args: string[], options: Record<string, unknown>): Promise<void> {
    console.log(chalk.blue('Comparing screenshots against baselines...'));
    
    // Try to load configuration from file
    let configFromFile: Record<string, any> = {};
    try {
      const fs = require('fs');
      const path = require('path');
      
      const configPath = 'testivai.config.js';
      
      if (fs.existsSync(configPath)) {
        configFromFile = require(path.resolve(configPath));
      }
    } catch (error) {
      console.warn(chalk.yellow('Failed to load configuration file, using defaults'));
    }
    
    // Convert option names from kebab-case to camelCase
    const baselineDir = options['baseline-dir'] || options.baselineDir || configFromFile.baselineDir || '.testivai/visual-regression/baseline';
    const compareDir = options['compare-dir'] || options.compareDir || configFromFile.compareDir || '.testivai/visual-regression/compare';
    const reportDir = options['report-dir'] || options.reportDir || configFromFile.reportDir || '.testivai/visual-regression/reports';
    const diffThreshold = options['diff-threshold'] || options.diffThreshold || configFromFile.diffThreshold || 0.1;
    const updateBaselines = options['update-baselines'] || options.updateBaselines || configFromFile.updateBaselines || false;
    const engine = options['engine'] || options.engine || configFromFile.engine || 'pixelmatch';
    
    console.log(`Baseline directory: ${chalk.cyan(String(baselineDir))}`);
    console.log(`Compare directory: ${chalk.cyan(String(compareDir))}`);
    console.log(`Report directory: ${chalk.cyan(String(reportDir))}`);
    console.log(`Diff threshold: ${chalk.cyan(String(diffThreshold))}`);
    console.log(`Update baselines: ${chalk.cyan(String(updateBaselines))}`);
    console.log(`Comparison engine: ${chalk.cyan(String(engine))}`);
    
    try {
      // Import required modules
      const fs = require('fs');
      const path = require('path');
      const glob = require('glob');
      const { PNG } = require('pngjs');
      const pixelmatch = require('pixelmatch');
      
      // Initialize testivAI
      const visualTest = this.initTestivAI({
        framework: 'cli',
        baselineDir: String(baselineDir),
        compareDir: String(compareDir),
        reportDir: String(reportDir),
        diffThreshold: Number(diffThreshold),
        updateBaselines: Boolean(updateBaselines)
      });
      
      // Find all screenshots in the compare directory
      const globPattern = `${compareDir}/**/*.png`;
      console.log(`Using glob pattern: ${chalk.cyan(globPattern)}`);
      console.log(`Current working directory: ${chalk.cyan(process.cwd())}`);
      
      // Check if the compare directory exists
      if (!fs.existsSync(compareDir)) {
        console.log(chalk.yellow(`Compare directory does not exist: ${compareDir}`));
        // Create the directory
        fs.mkdirSync(compareDir, { recursive: true });
        console.log(chalk.green(`Created compare directory: ${compareDir}`));
      } else {
        console.log(chalk.green(`Compare directory exists: ${compareDir}`));
        // List files in the compare directory
        const files = fs.readdirSync(compareDir);
        console.log(`Files in compare directory: ${files.length > 0 ? files.join(', ') : 'none'}`);
      }
      
      const compareFiles = glob.sync(globPattern);
      
      if (compareFiles.length === 0) {
        console.log(chalk.yellow('No comparison screenshots found.'));
        return;
      }
      
      console.log(`Found ${chalk.cyan(compareFiles.length)} comparison screenshots.`);
      
      // Compare each screenshot against its baseline
      const comparisonResults = [];
      
      for (const compareFile of compareFiles) {
        // Determine the relative path from the compare directory
        const relativePath = path.relative(compareDir, compareFile);
        
        // Construct the baseline path
        const baselineFile = path.join(baselineDir, relativePath);
        
        // Construct the diff path
        const diffDir = path.join(reportDir, 'diffs');
        const diffFile = path.join(diffDir, relativePath);
        
        // Ensure diff directory exists
        const diffDirPath = path.dirname(diffFile);
        if (!fs.existsSync(diffDirPath)) {
          fs.mkdirSync(diffDirPath, { recursive: true });
        }
        
        try {
          // Compare the screenshots
          const result = await this.compareScreenshots({
            baselinePath: baselineFile,
            comparePath: compareFile,
            diffPath: diffFile,
            threshold: Number(diffThreshold),
            engine: String(engine)
          });
          
          comparisonResults.push(result);
          
          // Update baseline if requested and different
          if (updateBaselines && !result.passed) {
            this.updateBaseline(compareFile, baselineFile, relativePath);
          }
        } catch (error) {
          // Handle missing baseline
          if (error instanceof Error && error.message === 'Baseline image not found') {
            console.log(`Creating new baseline: ${chalk.cyan(relativePath)}`);
            
            // Update baseline with comparison
            this.updateBaseline(compareFile, baselineFile, relativePath);
            
            // Add as new baseline to results
            comparisonResults.push({
              name: path.basename(compareFile, '.png'),
              baselinePath: baselineFile,
              comparePath: compareFile,
              diffPath: null,
              passed: true,
              diffPercentage: 0,
              threshold: Number(diffThreshold)
            });
          } else {
            console.error(`Error comparing ${chalk.red(relativePath)}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }
      
      // Generate report
      const reportPath = await visualTest.generateReport(comparisonResults, {
        framework: 'cli',
        outputPath: String(reportDir)
      });
      
      // Summary
      const passedCount = comparisonResults.filter(r => r.passed).length;
      const failedCount = comparisonResults.length - passedCount;
      
      console.log('');
      console.log(chalk.green('Comparison complete!'));
      console.log(`Total: ${chalk.cyan(comparisonResults.length)}, Passed: ${chalk.green(passedCount)}, Failed: ${chalk.red(failedCount)}`);
      console.log(`Report generated at: ${chalk.cyan(reportPath)}`);
    } catch (error) {
      console.error(chalk.red('Error during comparison:'), error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Compare two screenshots and generate a diff image
   */
  private async compareScreenshots(options: {
    baselinePath: string;
    comparePath: string;
    diffPath: string;
    threshold: number;
    engine?: string;
  }): Promise<{
    name: string;
    baselinePath: string;
    comparePath: string;
    diffPath: string | null;
    passed: boolean;
    diffPercentage: number;
    threshold: number;
  }> {
    const { compareImages } = require('./utils');
    
    // Check which engine to use
    if (options.engine === Engine.OpenCV) {
      // Use opencv.js for comparison
      console.log(chalk.blue("Using opencv.js engine"));
      // For now, fall back to pixelmatch since opencv implementation is not available yet
      return await compareImages(options);
    } else if (options.engine === Engine.Jimp) {
      // Use Jimp for comparison
      console.log(chalk.blue("Using Jimp engine"));
      // For now, fall back to pixelmatch since Jimp implementation is not available yet
      return await compareImages(options);
    } else {
      // Default to pixelmatch
      console.log(chalk.blue("Using Pixelmatch engine"));
      return await compareImages(options);
    }
  }

  /**
   * Initialize a testivAI instance
   */
  private initTestivAI(options: {
    framework: string;
    baselineDir: string;
    compareDir: string;
    reportDir: string;
    diffThreshold: number;
    updateBaselines: boolean;
  }) {
    // Create a simplified testivAI class that only implements what we need
    return {
      getOptions: () => options,
      
      generateReport: async (
        comparisonResults: any[],
        reportOptions: {
          framework?: string;
          outputPath?: string;
        }
      ) => {
        const fs = require('fs');
        const path = require('path');
        const { execSync } = require('child_process');
        
        const outputDir = reportOptions.outputPath || options.reportDir;
        
        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Generate report data
        const reportData = await this.generateReportData(comparisonResults, reportOptions.framework || options.framework);
        
        // Copy template files
        await this.copyTemplateFiles(outputDir);
        
        // Write report data
        await this.writeReportData(outputDir, reportData);
        
        return path.resolve(outputDir, 'index.html');
      }
    };
  }

  /**
   * Generate report data from comparison results
   */
  private async generateReportData(
    comparisonResults: any[],
    framework: string = 'unknown'
  ): Promise<any> {
    const gitInfo = await this.getGitInfo();
    const tests = this.convertComparisonResultsToTestResults(comparisonResults, framework);
    
    const changedTests = tests.filter(t => t.status === 'changed' || t.status === 'failed').length;
    const passedTests = tests.filter(t => t.status === 'passed').length;

    // Group tests by status
    const groupedTests = this.groupTestsByStatus(tests);

    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        gitInfo,
        totalTests: tests.length,
        changedTests,
        passedTests,
        framework,
        testivaiVersion: this.getTestivAIVersion()
      },
      tests,
      groupedTests
    };
  }

  /**
   * Group tests by their status
   */
  private groupTestsByStatus(tests: any[]): any {
    const approved: any[] = [];
    const rejected: any[] = [];
    const newTests: any[] = [];
    const deleted: any[] = [];
    const pending: any[] = [];

    tests.forEach(test => {
      if (test.approvalStatus === 'approved') {
        approved.push(test);
      } else if (test.approvalStatus === 'rejected') {
        rejected.push(test);
      } else if (test.status === 'new') {
        newTests.push(test);
      } else if (test.status === 'deleted') {
        deleted.push(test);
      } else {
        pending.push(test);
      }
    });

    return {
      approved,
      rejected,
      new: newTests,
      deleted,
      pending
    };
  }

  /**
   * Convert comparison results to test results format
   */
  private convertComparisonResultsToTestResults(
    comparisonResults: any[],
    framework: string
  ): any[] {
    return comparisonResults.map(result => {
      // Determine status based on comparison result
      const status = result.passed ? 'passed' : 'changed';
      
      return {
        name: result.name,
        baseline: result.baselinePath,
        current: result.comparePath,
        diff: result.diffPath || null,
        status,
        diffPercentage: result.diffPercentage || 0,
        diffPixels: Math.round((result.diffPercentage || 0) * 1280 * 800), // Estimate pixels from percentage
        dimensions: {
          width: 1280, // Default dimensions
          height: 800
        },
        testInfo: {
          framework,
          viewport: '1280x800',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      };
    });
  }

  /**
   * Get Git information for the current repository
   */
  private async getGitInfo(): Promise<any> {
    const { getGitInfo } = require('./utils');
    return await getGitInfo();
  }

  /**
   * Copy template files to output directory
   */
  private async copyTemplateFiles(outputDir: string): Promise<void> {
    const fs = require('fs');
    const path = require('path');
    const { copyRecursive } = require('./utils');
    
    // Look for templates in the package's templates directory
    const possiblePaths = [
      path.join(__dirname, 'report-template'),           // New location in src directory
      path.join(__dirname, '../report-template'),        // Compiled location in dist directory
      path.join(__dirname, '../../../templates/reports'), // Legacy location for backward compatibility
      path.join(process.cwd(), 'templates/reports'),      // Project root
      path.join(process.cwd(), 'node_modules/testivai-cli/dist/report-template') // Installed package
    ];
    
    // Find the first path that exists
    const templatePath = possiblePaths.find(p => {
      try {
        return fs.existsSync(p);
      } catch (e) {
        return false;
      }
    });
    
    if (!templatePath) {
      throw new Error('Template path not found');
    }
    
    // Copy all template files
    copyRecursive(templatePath, outputDir, ['compare-report.json', 'history.json']);
  }

  /**
   * Write report data to output directory
   */
  private async writeReportData(
    outputDir: string,
    reportData: any
  ): Promise<void> {
    const fs = require('fs');
    const path = require('path');
    
    // Create default approvals data
    const approvalsData = {
      approved: [],
      rejected: [],
      new: [],
      deleted: [],
      meta: {
        author: reportData.metadata.gitInfo.author || 'unknown',
        timestamp: new Date().toISOString(),
        commit_sha: reportData.metadata.gitInfo.sha
      }
    };

    // Write compare-report.json
    const reportPath = path.join(outputDir, 'compare-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

    // Write history.json
    const historyPath = path.join(outputDir, 'history.json');
    fs.writeFileSync(historyPath, JSON.stringify({ maxHistory: 5, commits: [] }, null, 2));

    // Write approvals.json
    const approvalsPath = path.join(outputDir, 'approvals.json');
    fs.writeFileSync(approvalsPath, JSON.stringify(approvalsData, null, 2));

    // Write diffs.json for CI/CD integration
    this.writeDiffsJson(outputDir, reportData);

    // Embed data in HTML file to avoid CORS issues when viewing locally
    this.embedDataInHtml(outputDir, reportData);
  }

  /**
   * Write a simplified diffs.json file for CI/CD integration
   */
  private writeDiffsJson(outputDir: string, reportData: any): void {
    const fs = require('fs');
    const path = require('path');
    
    // Create diffs directory if it doesn't exist
    const diffsDir = path.join(outputDir, 'diffs');
    if (!fs.existsSync(diffsDir)) {
      fs.mkdirSync(diffsDir, { recursive: true });
    }

    // Extract tests with differences
    const testsWithDiffs = reportData.tests.filter((test: any) => 
      test.status === 'changed' || test.status === 'failed' || test.status === 'new'
    );

    // Create a simplified structure for CI/CD integration
    const diffsData = {
      summary: {
        totalTests: reportData.metadata.totalTests,
        passedTests: reportData.metadata.passedTests,
        changedTests: reportData.metadata.changedTests,
        newTests: reportData.tests.filter((t: any) => t.status === 'new').length,
        deletedTests: reportData.tests.filter((t: any) => t.status === 'deleted').length,
        hasDifferences: testsWithDiffs.length > 0
      },
      testsWithDifferences: testsWithDiffs.map((test: any) => ({
        name: test.name,
        status: test.status,
        diffPercentage: test.diffPercentage,
        diffPixels: test.diffPixels,
        baseline: test.baseline,
        current: test.current,
        diff: test.diff
      })),
      gitInfo: reportData.metadata.gitInfo,
      generatedAt: reportData.metadata.generatedAt
    };

    // Write diffs.json
    const diffsPath = path.join(diffsDir, 'diffs.json');
    fs.writeFileSync(diffsPath, JSON.stringify(diffsData, null, 2));
  }

  /**
   * Embed report data directly in the HTML file to avoid CORS issues when viewing locally
   */
  private embedDataInHtml(
    outputDir: string,
    reportData: any
  ): void {
    const fs = require('fs');
    const path = require('path');
    
    const indexHtmlPath = path.join(outputDir, 'index.html');
    
    // Check if index.html exists
    if (!fs.existsSync(indexHtmlPath)) {
      console.warn('index.html not found, skipping data embedding');
      return;
    }

    try {
      // Read the HTML file
      let htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

      // Create script tag with embedded data
      const scriptContent = `
<!-- Embedded report data to avoid CORS issues when viewing locally -->
<script>
  // Pre-loaded report data
  window.testivai = window.testivai || {};
  window.testivai.embeddedData = {
    reportData: ${JSON.stringify(reportData)},
    historyData: ${JSON.stringify({ maxHistory: 5, commits: [] })},
    approvalsData: ${JSON.stringify({
      approved: [],
      rejected: [],
      new: [],
      deleted: [],
      meta: {
        author: reportData.metadata.gitInfo.author || 'unknown',
        timestamp: new Date().toISOString(),
        commit_sha: reportData.metadata.gitInfo.sha
      }
    })}
  };
</script>
`;

      // Insert script tag before the closing </head> tag
      htmlContent = htmlContent.replace('</head>', `${scriptContent}</head>`);

      // Write the modified HTML file
      fs.writeFileSync(indexHtmlPath, htmlContent);
    } catch (error) {
      console.error('Failed to embed data in HTML:', error);
    }
  }

  /**
   * Update baseline image with comparison image
   * @param compareFile Path to comparison image
   * @param baselineFile Path to baseline image
   * @param relativePath Relative path for logging
   */
  private updateBaseline(compareFile: string, baselineFile: string, relativePath: string): void {
    const { copyImage } = require('./utils');
    
    // Copy comparison to baseline
    copyImage(compareFile, baselineFile);
    console.log(`Updated baseline: ${chalk.cyan(relativePath)}`);
  }

  /**
   * Get testivAI version
   */
  private getTestivAIVersion(): string {
    return '1.0.16'; // Updated version to match package.json
  }
}

/**
 * Set Engine command implementation
 */
export class SetEngineCommand extends BaseCLICommand {
  public name = 'set-engine';
  public description = 'Set the comparison engine (pixelmatch, jimp, or opencv)';
  
  public options = [];
  
  public async execute(args: string[], options: Record<string, unknown>): Promise<void> {
    if (args.length === 0) {
      console.error(chalk.red('Error: Engine name is required'));
      console.log(`Usage: testivai set-engine <engine>`);
      console.log(`Available engines: ${chalk.cyan('pixelmatch')}, ${chalk.cyan('jimp')}, ${chalk.cyan('opencv')}`);
      return;
    }
    
    const engine = args[0].toLowerCase();
    
    if (engine !== Engine.Pixelmatch && engine !== Engine.Jimp && engine !== Engine.OpenCV) {
      console.error(chalk.red(`Error: Invalid engine '${engine}'`));
      console.log(`Available engines: ${chalk.cyan('pixelmatch')}, ${chalk.cyan('jimp')}, ${chalk.cyan('opencv')}`);
      return;
    }
    
    // Update the configuration file with the new engine setting
    try {
      const fs = require('fs');
      const path = require('path');
      
      const configPath = 'testivai.config.js';
      
      // Check if the configuration file exists
      if (!fs.existsSync(configPath)) {
        console.error(chalk.red(`Configuration file not found: ${configPath}`));
        console.log(chalk.yellow('Run `testivai init` to create a configuration file'));
        return;
      }
      
      // Read the configuration file
      let configContent = fs.readFileSync(configPath, 'utf8');
      
      // Check if the engine setting already exists
      if (configContent.includes('engine:')) {
        // Update the existing engine setting
        configContent = configContent.replace(/engine:\s*['"].*?['"]/g, `engine: '${engine}'`);
      } else {
        // Add the engine setting
        configContent = configContent.replace(/updateBaselines:\s*(true|false)/g, `updateBaselines: $1,\n  engine: '${engine}'`);
      }
      
      // Write the updated configuration back to the file
      fs.writeFileSync(configPath, configContent);
      
      console.log(chalk.green(`Engine set to ${chalk.cyan(engine)} in ${chalk.cyan(configPath)}`));
      
      if (engine === Engine.OpenCV) {
        console.log(chalk.yellow('Note: OpenCV engine is currently in development and will fall back to pixelmatch'));
      } else if (engine === Engine.Jimp) {
        console.log(chalk.yellow('Note: Jimp engine is currently in development and will fall back to pixelmatch'));
      }
    } catch (error) {
      console.error(chalk.red('Error updating configuration file:'), error instanceof Error ? error.message : String(error));
    }
  }
}

/**
 * Create a new CLI command registry with default commands
 */
export function createCLICommandRegistry(): CLICommandRegistry {
  const registry = new CLICommandRegistryImpl();
  
  // Register help command (needs to be registered first to avoid circular dependency)
  const helpCommand = new HelpCommand(registry);
  registry.register(helpCommand);
  
  // Register other commands
  registry.register(new InitCommand());
  registry.register(new CompareCommand());
  registry.register(new SetEngineCommand());
  
  return registry;
}
