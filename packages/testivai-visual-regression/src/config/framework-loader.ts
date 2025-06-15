/**
 * Framework-specific configuration loader for testivAI Visual Regression
 */

import { testivAIOptions, FrameworkType } from '../core/interfaces';
import { PlaywrightConfig, getPlaywrightDefaultConfig, validatePlaywrightConfig, mergePlaywrightConfig } from './playwright';
import { SeleniumConfig, getSeleniumDefaultConfig, validateSeleniumConfig, mergeSeleniumConfig } from './selenium';
import { PuppeteerConfig, getPuppeteerDefaultConfig, validatePuppeteerConfig, mergePuppeteerConfig } from './puppeteer';
import { CypressConfig, getCypressDefaultConfig, validateCypressConfig, mergeCypressConfig } from './cypress';

/**
 * Union type for all framework-specific configurations
 */
export type FrameworkConfig = PlaywrightConfig | SeleniumConfig | PuppeteerConfig | CypressConfig;

/**
 * Framework configuration factory interface
 */
export interface FrameworkConfigFactory {
  getDefaultConfig(): FrameworkConfig;
  validateConfig(config: Partial<FrameworkConfig>): { isValid: boolean; errors: string[] };
  mergeConfig(config: Partial<FrameworkConfig>): FrameworkConfig;
}

/**
 * Registry of framework configuration factories
 */
const frameworkFactories: Record<FrameworkType, FrameworkConfigFactory> = {
  playwright: {
    getDefaultConfig: getPlaywrightDefaultConfig,
    validateConfig: validatePlaywrightConfig,
    mergeConfig: mergePlaywrightConfig
  },
  cypress: {
    getDefaultConfig: getCypressDefaultConfig,
    validateConfig: validateCypressConfig,
    mergeConfig: mergeCypressConfig
  },
  puppeteer: {
    getDefaultConfig: getPuppeteerDefaultConfig,
    validateConfig: validatePuppeteerConfig,
    mergeConfig: mergePuppeteerConfig
  },
  selenium: {
    getDefaultConfig: getSeleniumDefaultConfig,
    validateConfig: validateSeleniumConfig,
    mergeConfig: mergeSeleniumConfig
  }
};

/**
 * Get default configuration for a specific framework
 * @param framework The framework to get default configuration for
 * @returns Default configuration for the framework
 */
export function getFrameworkDefaultConfig(framework: FrameworkType): FrameworkConfig {
  const factory = frameworkFactories[framework];
  if (!factory) {
    throw new Error(`Unsupported framework: ${framework}`);
  }
  return factory.getDefaultConfig();
}

/**
 * Validate framework-specific configuration
 * @param framework The framework to validate configuration for
 * @param config Configuration to validate
 * @returns Validation result with errors if any
 */
export function validateFrameworkConfig(
  framework: FrameworkType,
  config: Partial<FrameworkConfig>
): { isValid: boolean; errors: string[] } {
  const factory = frameworkFactories[framework];
  if (!factory) {
    return {
      isValid: false,
      errors: [`Unsupported framework: ${framework}`]
    };
  }
  
  // Validate that the framework matches
  if (config.framework && config.framework !== framework) {
    return {
      isValid: false,
      errors: [`Framework mismatch: expected '${framework}', got '${config.framework}'`]
    };
  }
  
  return factory.validateConfig(config);
}

/**
 * Merge framework-specific configuration with defaults
 * @param framework The framework to merge configuration for
 * @param config Partial configuration to merge
 * @returns Complete configuration with defaults applied
 */
export function mergeFrameworkConfig(
  framework: FrameworkType,
  config: Partial<FrameworkConfig>
): FrameworkConfig {
  const factory = frameworkFactories[framework];
  if (!factory) {
    throw new Error(`Unsupported framework: ${framework}`);
  }
  
  // Ensure framework is set correctly
  const configWithFramework = {
    ...config,
    framework
  };
  
  return factory.mergeConfig(configWithFramework);
}

/**
 * Load and validate framework-specific configuration
 * @param framework The framework to load configuration for
 * @param config Raw configuration object
 * @returns Validated and merged configuration
 * @throws Error if configuration is invalid
 */
export function loadFrameworkConfig(
  framework: FrameworkType,
  config: Partial<FrameworkConfig>
): FrameworkConfig {
  // Validate the configuration
  const validation = validateFrameworkConfig(framework, config);
  if (!validation.isValid) {
    throw new Error(`Invalid ${framework} configuration: ${validation.errors.join(', ')}`);
  }
  
  // Merge with defaults
  return mergeFrameworkConfig(framework, config);
}

/**
 * Get list of supported frameworks
 * @returns Array of supported framework names
 */
export function getSupportedFrameworks(): FrameworkType[] {
  return Object.keys(frameworkFactories) as FrameworkType[];
}

/**
 * Check if a framework is supported
 * @param framework Framework name to check
 * @returns True if framework is supported
 */
export function isFrameworkSupported(framework: string): framework is FrameworkType {
  return framework in frameworkFactories;
}

/**
 * Auto-detect framework from configuration
 * @param config Configuration object that may contain framework information
 * @returns Detected framework or null if not detectable
 */
export function detectFramework(config: Partial<testivAIOptions>): FrameworkType | null {
  // Check explicit framework property
  if (config.framework && isFrameworkSupported(config.framework)) {
    return config.framework;
  }
  
  // Check for framework-specific properties
  const configAny = config as any;
  
  if (configAny.playwright) {
    return 'playwright';
  }
  
  if (configAny.cypress) {
    return 'cypress';
  }
  
  if (configAny.puppeteer) {
    return 'puppeteer';
  }
  
  if (configAny.selenium) {
    return 'selenium';
  }
  
  return null;
}

/**
 * Create a framework-specific configuration from a generic configuration
 * @param config Generic configuration object
 * @param defaultFramework Default framework to use if not detectable
 * @returns Framework-specific configuration
 */
export function createFrameworkConfig(
  config: Partial<testivAIOptions>,
  defaultFramework: FrameworkType = 'playwright'
): FrameworkConfig {
  const framework = detectFramework(config) || defaultFramework;
  return loadFrameworkConfig(framework, config as Partial<FrameworkConfig>);
}
