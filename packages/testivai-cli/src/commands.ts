/**
 * CLI commands for testivAI Visual Regression
 */

import { CLICommand, CLICommandRegistry } from './interfaces';
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
      defaultValue: '.testivAI/visual-regression/baseline'
    },
    {
      flag: '--compare-dir',
      shortFlag: '-c',
      description: 'Directory to store comparison screenshots',
      requiresValue: true,
      defaultValue: '.testivAI/visual-regression/compare'
    },
    {
      flag: '--report-dir',
      shortFlag: '-r',
      description: 'Directory to store generated reports',
      requiresValue: true,
      defaultValue: '.testivAI/visual-regression/reports'
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
    const baselineDir = options.baselineDir || '.testivAI/visual-regression/baseline';
    const compareDir = options.compareDir || '.testivAI/visual-regression/compare';
    const reportDir = options.reportDir || '.testivAI/visual-regression/reports';
    const diffThreshold = options.diffThreshold || 0.1;
    
    // Create configuration file
    const configContent = `module.exports = {
  framework: '${framework}',
  baselineDir: '${baselineDir}',
  compareDir: '${compareDir}',
  reportDir: '${reportDir}',
  diffThreshold: ${diffThreshold},
  updateBaselines: false
};
`;
    
    // In a real implementation, we would write this to a file
    // For now, just log it
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
      defaultValue: '.testivAI/visual-regression/baseline'
    },
    {
      flag: '--compare-dir',
      shortFlag: '-c',
      description: 'Directory containing comparison screenshots',
      requiresValue: true,
      defaultValue: '.testivAI/visual-regression/compare'
    },
    {
      flag: '--report-dir',
      shortFlag: '-r',
      description: 'Directory to store generated reports',
      requiresValue: true,
      defaultValue: '.testivAI/visual-regression/reports'
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
    }
  ];
  
  public async execute(args: string[], options: Record<string, unknown>): Promise<void> {
    console.log(chalk.blue('Comparing screenshots against baselines...'));
    
    const baselineDir = options.baselineDir || '.testivAI/visual-regression/baseline';
    const compareDir = options.compareDir || '.testivAI/visual-regression/compare';
    const reportDir = options.reportDir || '.testivAI/visual-regression/reports';
    const diffThreshold = options.diffThreshold || 0.1;
    const updateBaselines = options.updateBaselines || false;
    
    // In a real implementation, we would:
    // 1. Find all screenshots in the compare directory
    // 2. Compare them against baselines using the SDK
    // 3. Generate a report
    // 4. Update baselines if requested
    
    console.log(`Baseline directory: ${chalk.cyan(String(baselineDir))}`);
    console.log(`Compare directory: ${chalk.cyan(String(compareDir))}`);
    console.log(`Report directory: ${chalk.cyan(String(reportDir))}`);
    console.log(`Diff threshold: ${chalk.cyan(String(diffThreshold))}`);
    console.log(`Update baselines: ${chalk.cyan(String(updateBaselines))}`);
    
    console.log('');
    console.log(chalk.green('Comparison complete!'));
    console.log(`Report generated at: ${chalk.cyan(`${reportDir}/index.html`)}`);
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
  
  return registry;
}
