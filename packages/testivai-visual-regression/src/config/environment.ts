/**
 * Environment-specific configuration for testivAI Visual Regression
 */

import { FrameworkConfig } from './framework-loader';

/**
 * Supported environment types
 */
export type EnvironmentType = 'development' | 'test' | 'staging' | 'production';

/**
 * Environment-specific configuration options
 */
export interface EnvironmentConfig {
  /**
   * Current environment
   */
  environment: EnvironmentType;
  
  /**
   * Enable debug logging
   * @default varies by environment
   */
  debug: boolean;
  
  /**
   * Enable verbose output
   * @default varies by environment
   */
  verbose: boolean;
  
  /**
   * Whether to update baselines automatically
   * @default varies by environment
   */
  updateBaselines: boolean;
  
  /**
   * Diff threshold for comparison
   * @default varies by environment
   */
  diffThreshold: number;
  
  /**
   * Number of retry attempts for failed tests
   * @default varies by environment
   */
  retryAttempts: number;
  
  /**
   * Timeout for operations in milliseconds
   * @default varies by environment
   */
  timeout: number;
  
  /**
   * Whether to run tests in parallel
   * @default varies by environment
   */
  parallel: boolean;
  
  /**
   * Whether to cleanup temporary files
   * @default varies by environment
   */
  cleanup: boolean;
}

/**
 * Combined framework and environment configuration
 */
export interface EnvironmentAwareConfig extends Omit<FrameworkConfig, 'diffThreshold' | 'updateBaselines'>, EnvironmentConfig {}

/**
 * Environment-specific default configurations
 */
const environmentDefaults: Record<EnvironmentType, EnvironmentConfig> = {
  development: {
    environment: 'development',
    debug: true,
    verbose: true,
    updateBaselines: true,
    diffThreshold: 0.05,
    retryAttempts: 1,
    timeout: 60000,
    parallel: false,
    cleanup: false
  },
  test: {
    environment: 'test',
    debug: false,
    verbose: false,
    updateBaselines: false,
    diffThreshold: 0.1,
    retryAttempts: 3,
    timeout: 30000,
    parallel: true,
    cleanup: true
  },
  staging: {
    environment: 'staging',
    debug: false,
    verbose: true,
    updateBaselines: false,
    diffThreshold: 0.1,
    retryAttempts: 2,
    timeout: 45000,
    parallel: true,
    cleanup: true
  },
  production: {
    environment: 'production',
    debug: false,
    verbose: false,
    updateBaselines: false,
    diffThreshold: 0.15,
    retryAttempts: 3,
    timeout: 30000,
    parallel: true,
    cleanup: true
  }
};

/**
 * Detect current environment from environment variables
 * @returns Detected environment type
 */
export function detectEnvironment(): EnvironmentType {
  // Check NODE_ENV first
  const nodeEnv = process.env.NODE_ENV?.toLowerCase();
  if (nodeEnv && isValidEnvironment(nodeEnv)) {
    return nodeEnv as EnvironmentType;
  }
  
  // Check TESTIVAI_ENV as fallback
  const testivaiEnv = process.env.TESTIVAI_ENV?.toLowerCase();
  if (testivaiEnv && isValidEnvironment(testivaiEnv)) {
    return testivaiEnv as EnvironmentType;
  }
  
  // Default to development
  return 'development';
}

/**
 * Check if a string is a valid environment type
 * @param env Environment string to check
 * @returns True if valid environment
 */
function isValidEnvironment(env: string): env is EnvironmentType {
  return ['development', 'test', 'staging', 'production'].includes(env);
}

/**
 * Get default configuration for a specific environment
 * @param environment Environment to get configuration for
 * @returns Default environment configuration
 */
export function getEnvironmentConfig(environment: EnvironmentType): EnvironmentConfig {
  return { ...environmentDefaults[environment] };
}

/**
 * Validate environment configuration
 * @param config Configuration to validate
 * @returns Validation result with errors if any
 */
export function validateEnvironmentConfig(config: Partial<EnvironmentConfig>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validate environment
  if (config.environment !== undefined) {
    if (!isValidEnvironment(config.environment)) {
      errors.push('environment must be one of: development, test, staging, production');
    }
  }
  
  // Validate debug
  if (config.debug !== undefined) {
    if (typeof config.debug !== 'boolean') {
      errors.push('debug must be a boolean');
    }
  }
  
  // Validate verbose
  if (config.verbose !== undefined) {
    if (typeof config.verbose !== 'boolean') {
      errors.push('verbose must be a boolean');
    }
  }
  
  // Validate updateBaselines
  if (config.updateBaselines !== undefined) {
    if (typeof config.updateBaselines !== 'boolean') {
      errors.push('updateBaselines must be a boolean');
    }
  }
  
  // Validate diffThreshold
  if (config.diffThreshold !== undefined) {
    if (typeof config.diffThreshold !== 'number') {
      errors.push('diffThreshold must be a number');
    } else if (config.diffThreshold < 0 || config.diffThreshold > 1) {
      errors.push('diffThreshold must be between 0 and 1');
    }
  }
  
  // Validate retryAttempts
  if (config.retryAttempts !== undefined) {
    if (typeof config.retryAttempts !== 'number' || 
        !Number.isInteger(config.retryAttempts) || 
        config.retryAttempts < 0) {
      errors.push('retryAttempts must be a non-negative integer');
    }
  }
  
  // Validate timeout
  if (config.timeout !== undefined) {
    if (typeof config.timeout !== 'number' || config.timeout <= 0) {
      errors.push('timeout must be a positive number');
    }
  }
  
  // Validate parallel
  if (config.parallel !== undefined) {
    if (typeof config.parallel !== 'boolean') {
      errors.push('parallel must be a boolean');
    }
  }
  
  // Validate cleanup
  if (config.cleanup !== undefined) {
    if (typeof config.cleanup !== 'boolean') {
      errors.push('cleanup must be a boolean');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Merge environment configuration with defaults
 * @param environment Environment to merge configuration for
 * @param config Partial configuration to merge
 * @returns Complete environment configuration
 */
export function mergeEnvironmentConfig(
  environment: EnvironmentType,
  config: Partial<EnvironmentConfig>
): EnvironmentConfig {
  const defaults = getEnvironmentConfig(environment);
  
  return {
    ...defaults,
    ...config,
    environment // Always override environment to match the specified one
  };
}

/**
 * Load and validate environment configuration
 * @param environment Environment to load configuration for
 * @param config Raw configuration object
 * @returns Validated and merged environment configuration
 * @throws Error if configuration is invalid
 */
export function loadEnvironmentConfig(
  environment: EnvironmentType,
  config: Partial<EnvironmentConfig>
): EnvironmentConfig {
  // Validate the configuration
  const validation = validateEnvironmentConfig(config);
  if (!validation.isValid) {
    throw new Error(`Invalid environment configuration: ${validation.errors.join(', ')}`);
  }
  
  // Merge with defaults
  return mergeEnvironmentConfig(environment, config);
}

/**
 * Create environment-aware configuration from framework configuration
 * @param frameworkConfig Framework-specific configuration
 * @param environment Optional environment override (defaults to detected environment)
 * @param envOverrides Optional environment-specific overrides
 * @returns Combined framework and environment configuration
 */
export function createEnvironmentAwareConfig(
  frameworkConfig: FrameworkConfig,
  environment?: EnvironmentType,
  envOverrides?: Partial<EnvironmentConfig>
): EnvironmentAwareConfig {
  // Detect or use specified environment
  const env = environment || detectEnvironment();
  
  // Get environment defaults
  const envDefaults = getEnvironmentConfig(env);
  
  // Apply environment overrides if provided
  const envConfig = envOverrides 
    ? mergeEnvironmentConfig(env, envOverrides)
    : envDefaults;
  
  // Combine framework and environment configurations
  // Environment settings override framework settings for common properties
  const combined: EnvironmentAwareConfig = {
    ...frameworkConfig,
    ...envConfig,
    // Preserve framework-specific properties
    framework: frameworkConfig.framework,
    baselineDir: frameworkConfig.baselineDir,
    compareDir: frameworkConfig.compareDir,
    reportDir: frameworkConfig.reportDir
  };
  
  // Handle framework-specific properties
  if ('playwright' in frameworkConfig && frameworkConfig.playwright) {
    (combined as any).playwright = frameworkConfig.playwright;
  }
  
  if ('selenium' in frameworkConfig && frameworkConfig.selenium) {
    (combined as any).selenium = frameworkConfig.selenium;
  }
  
  return combined;
}

/**
 * Load environment variables into configuration
 * @param config Base configuration to extend
 * @returns Configuration with environment variables applied
 */
export function loadEnvironmentVariables(config: Partial<EnvironmentConfig>): Partial<EnvironmentConfig> {
  const envConfig = { ...config };
  
  // Load debug setting
  if (process.env.TESTIVAI_DEBUG !== undefined) {
    envConfig.debug = process.env.TESTIVAI_DEBUG.toLowerCase() === 'true';
  }
  
  // Load verbose setting
  if (process.env.TESTIVAI_VERBOSE !== undefined) {
    envConfig.verbose = process.env.TESTIVAI_VERBOSE.toLowerCase() === 'true';
  }
  
  // Load updateBaselines setting
  if (process.env.TESTIVAI_UPDATE_BASELINES !== undefined) {
    envConfig.updateBaselines = process.env.TESTIVAI_UPDATE_BASELINES.toLowerCase() === 'true';
  }
  
  // Load diffThreshold setting
  if (process.env.TESTIVAI_DIFF_THRESHOLD !== undefined) {
    const threshold = parseFloat(process.env.TESTIVAI_DIFF_THRESHOLD);
    if (!isNaN(threshold)) {
      envConfig.diffThreshold = threshold;
    }
  }
  
  // Load retryAttempts setting
  if (process.env.TESTIVAI_RETRY_ATTEMPTS !== undefined) {
    const attempts = parseInt(process.env.TESTIVAI_RETRY_ATTEMPTS, 10);
    if (!isNaN(attempts)) {
      envConfig.retryAttempts = attempts;
    }
  }
  
  // Load timeout setting
  if (process.env.TESTIVAI_TIMEOUT !== undefined) {
    const timeout = parseInt(process.env.TESTIVAI_TIMEOUT, 10);
    if (!isNaN(timeout)) {
      envConfig.timeout = timeout;
    }
  }
  
  // Load parallel setting
  if (process.env.TESTIVAI_PARALLEL !== undefined) {
    envConfig.parallel = process.env.TESTIVAI_PARALLEL.toLowerCase() === 'true';
  }
  
  // Load cleanup setting
  if (process.env.TESTIVAI_CLEANUP !== undefined) {
    envConfig.cleanup = process.env.TESTIVAI_CLEANUP.toLowerCase() === 'true';
  }
  
  return envConfig;
}

/**
 * Get list of supported environments
 * @returns Array of supported environment names
 */
export function getSupportedEnvironments(): EnvironmentType[] {
  return ['development', 'test', 'staging', 'production'];
}

/**
 * Check if an environment is supported
 * @param environment Environment name to check
 * @returns True if environment is supported
 */
export function isEnvironmentSupported(environment: string): environment is EnvironmentType {
  return isValidEnvironment(environment);
}
