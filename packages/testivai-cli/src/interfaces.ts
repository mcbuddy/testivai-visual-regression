/**
 * CLI interfaces for testivAI Visual Regression CLI
 */

/**
 * CLI command option interface
 */
export interface CLICommandOption {
  flag: string;
  shortFlag?: string;
  description: string;
  requiresValue: boolean;
  defaultValue?: unknown;
}

/**
 * CLI command interface
 */
export interface CLICommand {
  name: string;
  description: string;
  options?: CLICommandOption[];
  execute(args: string[], options: Record<string, unknown>): Promise<void>;
}

/**
 * CLI command registry interface
 */
export interface CLICommandRegistry {
  register(command: CLICommand): void;
  get(name: string): CLICommand | undefined;
  getAll(): CLICommand[];
  execute(name: string, args: string[], options: Record<string, unknown>): Promise<void>;
}
