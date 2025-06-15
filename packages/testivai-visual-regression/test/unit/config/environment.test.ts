/**
 * Tests for environment-specific configuration functionality
 */

import {
  EnvironmentConfig,
  getEnvironmentConfig,
  loadEnvironmentConfig,
  mergeEnvironmentConfig,
  detectEnvironment,
  validateEnvironmentConfig,
  createEnvironmentAwareConfig
} from '../../../src/config/environment';
import { FrameworkConfig } from '../../../src/config/framework-loader';

// Mock process.env
const originalEnv = process.env;

describe('Environment Configuration', () => {
  beforeEach(() => {
    // Reset process.env before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original process.env
    process.env = originalEnv;
  });

  describe('detectEnvironment', () => {
    it('should detect development environment', () => {
      process.env.NODE_ENV = 'development';
      
      const env = detectEnvironment();
      expect(env).toBe('development');
    });
    
    it('should detect test environment', () => {
      process.env.NODE_ENV = 'test';
      
      const env = detectEnvironment();
      expect(env).toBe('test');
    });
    
    it('should detect staging environment', () => {
      process.env.NODE_ENV = 'staging';
      
      const env = detectEnvironment();
      expect(env).toBe('staging');
    });
    
    it('should detect production environment', () => {
      process.env.NODE_ENV = 'production';
      
      const env = detectEnvironment();
      expect(env).toBe('production');
    });
    
    it('should default to development when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;
      
      const env = detectEnvironment();
      expect(env).toBe('development');
    });
    
    it('should default to development for unknown environments', () => {
      process.env.NODE_ENV = 'unknown';
      
      const env = detectEnvironment();
      expect(env).toBe('development');
    });
    
    it('should detect from TESTIVAI_ENV when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;
      process.env.TESTIVAI_ENV = 'production';
      
      const env = detectEnvironment();
      expect(env).toBe('production');
    });
    
    it('should prioritize NODE_ENV over TESTIVAI_ENV', () => {
      process.env.NODE_ENV = 'staging';
      process.env.TESTIVAI_ENV = 'production';
      
      const env = detectEnvironment();
      expect(env).toBe('staging');
    });
  });
  
  describe('getEnvironmentConfig', () => {
    it('should return development configuration', () => {
      const config = getEnvironmentConfig('development');
      
      expect(config).toEqual({
        environment: 'development',
        debug: true,
        verbose: true,
        updateBaselines: true,
        diffThreshold: 0.05,
        retryAttempts: 1,
        timeout: 60000,
        parallel: false,
        cleanup: false
      });
    });
    
    it('should return test configuration', () => {
      const config = getEnvironmentConfig('test');
      
      expect(config).toEqual({
        environment: 'test',
        debug: false,
        verbose: false,
        updateBaselines: false,
        diffThreshold: 0.1,
        retryAttempts: 3,
        timeout: 30000,
        parallel: true,
        cleanup: true
      });
    });
    
    it('should return staging configuration', () => {
      const config = getEnvironmentConfig('staging');
      
      expect(config).toEqual({
        environment: 'staging',
        debug: false,
        verbose: true,
        updateBaselines: false,
        diffThreshold: 0.1,
        retryAttempts: 2,
        timeout: 45000,
        parallel: true,
        cleanup: true
      });
    });
    
    it('should return production configuration', () => {
      const config = getEnvironmentConfig('production');
      
      expect(config).toEqual({
        environment: 'production',
        debug: false,
        verbose: false,
        updateBaselines: false,
        diffThreshold: 0.15,
        retryAttempts: 3,
        timeout: 30000,
        parallel: true,
        cleanup: true
      });
    });
    
    it('should return a new object each time', () => {
      const config1 = getEnvironmentConfig('development');
      const config2 = getEnvironmentConfig('development');
      
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });
  
  describe('validateEnvironmentConfig', () => {
    it('should validate correct environment configuration', () => {
      const config: Partial<EnvironmentConfig> = {
        environment: 'development',
        debug: true,
        diffThreshold: 0.1,
        retryAttempts: 2,
        timeout: 30000
      };
      
      const result = validateEnvironmentConfig(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    it('should reject invalid environment values', () => {
      const config: Partial<EnvironmentConfig> = {
        environment: 'invalid' as any
      };
      
      const result = validateEnvironmentConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("environment must be one of: development, test, staging, production");
    });
    
    it('should reject invalid diffThreshold values', () => {
      const testCases = [
        { diffThreshold: -0.1, error: 'diffThreshold must be between 0 and 1' },
        { diffThreshold: 1.1, error: 'diffThreshold must be between 0 and 1' },
        { diffThreshold: 'invalid' as any, error: 'diffThreshold must be a number' }
      ];
      
      testCases.forEach(testCase => {
        const config: Partial<EnvironmentConfig> = {
          diffThreshold: testCase.diffThreshold
        };
        
        const result = validateEnvironmentConfig(config);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(testCase.error);
      });
    });
    
    it('should reject invalid retryAttempts values', () => {
      const testCases = [
        { retryAttempts: -1, error: 'retryAttempts must be a non-negative integer' },
        { retryAttempts: 1.5, error: 'retryAttempts must be a non-negative integer' },
        { retryAttempts: 'invalid' as any, error: 'retryAttempts must be a non-negative integer' }
      ];
      
      testCases.forEach(testCase => {
        const config: Partial<EnvironmentConfig> = {
          retryAttempts: testCase.retryAttempts
        };
        
        const result = validateEnvironmentConfig(config);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(testCase.error);
      });
    });
    
    it('should reject invalid timeout values', () => {
      const testCases = [
        { timeout: 0, error: 'timeout must be a positive number' },
        { timeout: -1000, error: 'timeout must be a positive number' },
        { timeout: 'invalid' as any, error: 'timeout must be a positive number' }
      ];
      
      testCases.forEach(testCase => {
        const config: Partial<EnvironmentConfig> = {
          timeout: testCase.timeout
        };
        
        const result = validateEnvironmentConfig(config);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(testCase.error);
      });
    });
    
    it('should validate boolean properties', () => {
      const config: Partial<EnvironmentConfig> = {
        debug: 'true' as any,
        verbose: 'false' as any,
        updateBaselines: 1 as any,
        parallel: 0 as any,
        cleanup: 'yes' as any
      };
      
      const result = validateEnvironmentConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('debug must be a boolean');
      expect(result.errors).toContain('verbose must be a boolean');
      expect(result.errors).toContain('updateBaselines must be a boolean');
      expect(result.errors).toContain('parallel must be a boolean');
      expect(result.errors).toContain('cleanup must be a boolean');
    });
    
    it('should accept valid boundary values', () => {
      const config: Partial<EnvironmentConfig> = {
        diffThreshold: 0,
        retryAttempts: 0,
        timeout: 1
      };
      
      const result = validateEnvironmentConfig(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    it('should accept maximum boundary values', () => {
      const config: Partial<EnvironmentConfig> = {
        diffThreshold: 1,
        retryAttempts: 10,
        timeout: 300000
      };
      
      const result = validateEnvironmentConfig(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });
  
  describe('mergeEnvironmentConfig', () => {
    it('should merge partial config with environment defaults', () => {
      const partialConfig: Partial<EnvironmentConfig> = {
        debug: false,
        diffThreshold: 0.2
      };
      
      const result = mergeEnvironmentConfig('development', partialConfig);
      
      expect(result).toEqual({
        environment: 'development',
        debug: false, // overridden
        verbose: true, // from defaults
        updateBaselines: true, // from defaults
        diffThreshold: 0.2, // overridden
        retryAttempts: 1, // from defaults
        timeout: 60000, // from defaults
        parallel: false, // from defaults
        cleanup: false // from defaults
      });
    });
    
    it('should handle empty config', () => {
      const result = mergeEnvironmentConfig('test', {});
      
      expect(result).toEqual(getEnvironmentConfig('test'));
    });
    
    it('should override environment property', () => {
      const partialConfig: Partial<EnvironmentConfig> = {
        environment: 'production' as any // This should be overridden
      };
      
      const result = mergeEnvironmentConfig('development', partialConfig);
      
      expect(result.environment).toBe('development');
    });
  });
  
  describe('loadEnvironmentConfig', () => {
    it('should load and validate environment configuration', () => {
      const config: Partial<EnvironmentConfig> = {
        debug: true,
        diffThreshold: 0.1,
        retryAttempts: 2
      };
      
      const result = loadEnvironmentConfig('staging', config);
      
      expect(result.environment).toBe('staging');
      expect(result.debug).toBe(true);
      expect(result.diffThreshold).toBe(0.1);
      expect(result.retryAttempts).toBe(2);
      expect(result.verbose).toBe(true); // from staging defaults
    });
    
    it('should throw error for invalid configuration', () => {
      const config: Partial<EnvironmentConfig> = {
        diffThreshold: -0.1 // Invalid
      };
      
      expect(() => {
        loadEnvironmentConfig('production', config);
      }).toThrow('Invalid environment configuration: diffThreshold must be between 0 and 1');
    });
    
    it('should load configuration for all environments', () => {
      const environments = ['development', 'test', 'staging', 'production'] as const;
      
      environments.forEach(env => {
        const config = { debug: false };
        const result = loadEnvironmentConfig(env, config);
        
        expect(result.environment).toBe(env);
        expect(result.debug).toBe(false);
      });
    });
  });
  
  describe('createEnvironmentAwareConfig', () => {
    it('should create environment-aware configuration from framework config', () => {
      process.env.NODE_ENV = 'development';
      
      const frameworkConfig: FrameworkConfig = {
        framework: 'playwright',
        baselineDir: '.testivai/baseline',
        compareDir: '.testivai/compare',
        reportDir: '.testivai/reports',
        diffThreshold: 0.1,
        updateBaselines: false
      };
      
      const result = createEnvironmentAwareConfig(frameworkConfig);
      
      expect(result.framework).toBe('playwright');
      expect(result.environment).toBe('development');
      expect(result.debug).toBe(true); // from development defaults
      expect(result.diffThreshold).toBe(0.05); // environment overrides framework
      expect(result.updateBaselines).toBe(true); // environment overrides framework
    });
    
    it('should use custom environment when specified', () => {
      process.env.NODE_ENV = 'development';
      
      const frameworkConfig: FrameworkConfig = {
        framework: 'playwright',
        baselineDir: '.testivai/baseline',
        compareDir: '.testivai/compare',
        reportDir: '.testivai/reports',
        diffThreshold: 0.1,
        updateBaselines: false
      };
      
      const result = createEnvironmentAwareConfig(frameworkConfig, 'production');
      
      expect(result.environment).toBe('production');
      expect(result.debug).toBe(false); // from production defaults
      expect(result.diffThreshold).toBe(0.15); // environment overrides framework
      expect(result.updateBaselines).toBe(false); // environment overrides framework
    });
    
    it('should preserve framework-specific properties', () => {
      process.env.NODE_ENV = 'test';
      
      const frameworkConfig: FrameworkConfig = {
        framework: 'playwright',
        baselineDir: '.testivai/baseline',
        compareDir: '.testivai/compare',
        reportDir: '.testivai/reports',
        diffThreshold: 0.1,
        updateBaselines: false,
        playwright: {
          timeout: 5000,
          disableAnimations: true
        }
      };
      
      const result = createEnvironmentAwareConfig(frameworkConfig);
      
      expect(result.framework).toBe('playwright');
      expect(result.playwright?.timeout).toBe(5000);
      expect(result.playwright?.disableAnimations).toBe(true);
      expect(result.environment).toBe('test');
      expect(result.parallel).toBe(true); // from test environment
    });
    
    it('should handle environment-specific overrides', () => {
      process.env.NODE_ENV = 'staging';
      
      const frameworkConfig: FrameworkConfig = {
        framework: 'playwright',
        baselineDir: '.testivai/baseline',
        compareDir: '.testivai/compare',
        reportDir: '.testivai/reports',
        diffThreshold: 0.2,
        updateBaselines: true
      };
      
      const envOverrides: Partial<EnvironmentConfig> = {
        debug: true,
        diffThreshold: 0.05,
        retryAttempts: 5
      };
      
      const result = createEnvironmentAwareConfig(frameworkConfig, 'staging', envOverrides);
      
      expect(result.environment).toBe('staging');
      expect(result.debug).toBe(true); // from overrides
      expect(result.diffThreshold).toBe(0.05); // from overrides
      expect(result.retryAttempts).toBe(5); // from overrides
      expect(result.verbose).toBe(true); // from staging defaults
    });
  });
  
  describe('Integration tests', () => {
    it('should work with complete environment workflow', () => {
      process.env.NODE_ENV = 'production';
      
      // Detect environment
      const env = detectEnvironment();
      expect(env).toBe('production');
      
      // Get environment defaults
      const envDefaults = getEnvironmentConfig(env);
      expect(envDefaults.debug).toBe(false);
      expect(envDefaults.parallel).toBe(true);
      
      // Validate custom config
      const customConfig = { diffThreshold: 0.1, retryAttempts: 2 };
      const validation = validateEnvironmentConfig(customConfig);
      expect(validation.isValid).toBe(true);
      
      // Load environment config
      const envConfig = loadEnvironmentConfig(env, customConfig);
      expect(envConfig.environment).toBe('production');
      expect(envConfig.diffThreshold).toBe(0.1);
      expect(envConfig.retryAttempts).toBe(2);
    });
    
    it('should work with environment variables', () => {
      process.env.NODE_ENV = 'development';
      process.env.TESTIVAI_DEBUG = 'false';
      process.env.TESTIVAI_DIFF_THRESHOLD = '0.2';
      process.env.TESTIVAI_RETRY_ATTEMPTS = '3';
      
      const frameworkConfig: FrameworkConfig = {
        framework: 'playwright',
        baselineDir: '.testivai/baseline',
        compareDir: '.testivai/compare',
        reportDir: '.testivai/reports',
        diffThreshold: 0.1,
        updateBaselines: false
      };
      
      // Environment variables should be handled by the config loader
      const result = createEnvironmentAwareConfig(frameworkConfig);
      
      expect(result.environment).toBe('development');
      expect(result.framework).toBe('playwright');
    });
    
    it('should handle CI environment detection', () => {
      process.env.CI = 'true';
      process.env.NODE_ENV = 'test';
      
      const env = detectEnvironment();
      expect(env).toBe('test');
      
      const config = getEnvironmentConfig(env);
      expect(config.parallel).toBe(true); // CI-friendly defaults
      expect(config.cleanup).toBe(true);
    });
  });
});
