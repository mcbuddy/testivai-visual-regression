/**
 * Configuration loader for testivAI Visual Regression
 */

import * as fs from 'fs';
import * as path from 'path';
import { testivAIOptions } from '../core/interfaces';

/**
 * Default configuration values
 */
export function getDefaultConfig(): testivAIOptions {
  return {
    framework: 'playwright',
    baselineDir: '.testivai/baseline',
    compareDir: '.testivai/compare',
    reportDir: '.testivai/reports',
    diffThreshold: 0.1,
    updateBaselines: false
  };
}

/**
 * Load configuration from a specific file
 * @param filePath Path to the configuration file
 * @returns Configuration object or null if file doesn't exist
 */
export async function loadConfigFromFile(filePath: string): Promise<Partial<testivAIOptions> | null> {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const ext = path.extname(filePath)?.toLowerCase() || '';
    
    if (ext === '.json') {
      // Load JSON configuration
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } else if (ext === '.js' || ext === '.ts') {
      // Load JavaScript/TypeScript configuration
      try {
        // Clear require cache to ensure fresh load
        const resolvedPath = path.resolve(filePath);
        delete require.cache[require.resolve(resolvedPath)];
        
        // Try to require the module
        const configModule = require(resolvedPath);
        
        // Handle both default export and direct export
        return configModule.default || configModule;
      } catch (requireError) {
        // If require fails, try dynamic import for ES modules
        try {
          const configModule = await import(path.resolve(filePath));
          return configModule.default || configModule;
        } catch (importError) {
          throw requireError; // Throw the original require error
        }
      }
    } else {
      throw new Error(`Unsupported configuration file format: ${ext}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load configuration from ${filePath}: ${errorMessage}`);
  }
}

/**
 * Resolve relative paths to absolute paths
 * @param config Configuration object with potentially relative paths
 * @returns Configuration object with absolute paths
 */
function resolveConfigPaths(config: Partial<testivAIOptions>): Partial<testivAIOptions> {
  const resolved = { ...config };
  
  if (resolved.baselineDir) {
    resolved.baselineDir = path.resolve(resolved.baselineDir);
  }
  
  if (resolved.compareDir) {
    resolved.compareDir = path.resolve(resolved.compareDir);
  }
  
  if (resolved.reportDir) {
    resolved.reportDir = path.resolve(resolved.reportDir);
  }
  
  return resolved;
}

/**
 * Load configuration from default locations or a custom path
 * @param customPath Optional custom path to configuration file
 * @returns Complete configuration object
 */
export async function loadConfig(customPath?: string): Promise<testivAIOptions> {
  const defaultConfig = getDefaultConfig();
  
  try {
    let loadedConfig: Partial<testivAIOptions> | null = null;
    
    if (customPath) {
      // Load from custom path
      loadedConfig = await loadConfigFromFile(customPath);
    } else {
      // Try default configuration file locations in priority order
      const defaultPaths = [
        'testivai.config.js',
        'testivai.config.ts',
        'testivai.config.json'
      ];
      
      for (const configPath of defaultPaths) {
        loadedConfig = await loadConfigFromFile(configPath);
        if (loadedConfig !== null) {
          break;
        }
      }
    }
    
    if (loadedConfig === null) {
      // No configuration file found, return defaults
      return defaultConfig;
    }
    
    // Resolve relative paths to absolute paths
    const resolvedConfig = resolveConfigPaths(loadedConfig);
    
    // Merge with defaults
    return {
      ...defaultConfig,
      ...resolvedConfig
    };
  } catch (error) {
    // If loading fails, log error and return defaults
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Failed to load configuration: ${errorMessage}. Using default configuration.`);
    return defaultConfig;
  }
}
