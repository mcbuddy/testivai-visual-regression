#!/usr/bin/env node

/**
 * CLI entry point for testivAI Visual Regression
 */

import { CLICommandRegistry } from './interfaces';
import { createCLICommandRegistry } from './commands';

/**
 * Parse command line arguments and execute the appropriate command
 * @param args Command line arguments
 */
async function parseAndExecuteCLI(args: string[]): Promise<void> {
  const registry = createCLICommandRegistry();
  
  if (args.length === 0) {
    // If no command is provided, show help
    await registry.execute('help', [], {});
    return;
  }
  
  const commandName = args[0];
  const commandArgs = args.slice(1).filter(arg => !arg.startsWith('-'));
  const commandOptions: Record<string, unknown> = {};
  
  // Parse options
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      // Long option (--option)
      const option = arg.substring(2);
      
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        // Option with value
        commandOptions[option] = args[i + 1];
        i++;
      } else {
        // Flag option
        commandOptions[option] = true;
      }
    } else if (arg.startsWith('-')) {
      // Short option (-o)
      const option = arg.substring(1);
      
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        // Option with value
        commandOptions[option] = args[i + 1];
        i++;
      } else {
        // Flag option
        commandOptions[option] = true;
      }
    }
  }
  
  try {
    await registry.execute(commandName, commandArgs, commandOptions);
  } catch (error) {
    console.error(`Error executing command '${commandName}':`, error);
    await registry.execute('help', [], {});
  }
}

// Get command line arguments (skip the first two: node and script path)
const args = process.argv.slice(2);

// Execute the CLI command
parseAndExecuteCLI(args)
  .catch(error => {
    console.error('Error executing CLI command:', error);
    process.exit(1);
  });
