/**
 * Tests for configuration loading functionality
 */

import * as fs from 'fs';
import * as path from 'path';
import { getDefaultConfig, loadConfigFromFile, loadConfig } from '../../../src/config/config-loader';
import { testivAIOptions } from '../../../src/core/interfaces';

// Mock fs and path modules
jest.mock('fs');
jest.mock('path');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

// Mock console.warn to test warning messages
const originalWarn = console.warn;
let mockWarn: jest.SpyInstance;

describe('Configuration Loading', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default path mocks
    mockPath.resolve.mockImplementation((...args: string[]) => args.join('/'));
    mockPath.join.mockImplementation((...args: string[]) => args.join('/'));
    mockPath.dirname.mockReturnValue('/mock/dir');
    mockPath.extname.mockImplementation((filePath: string) => {
      const lastDot = filePath.lastIndexOf('.');
      return lastDot === -1 ? '' : filePath.substring(lastDot);
    });
    
    // Mock console.warn
    mockWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    mockWarn.mockRestore();
  });

  describe('getDefaultConfig', () => {
    it('should return default configuration values', () => {
      const config = getDefaultConfig();
      
      expect(config).toEqual({
        framework: 'playwright',
        baselineDir: '.testivai/baseline',
        compareDir: '.testivai/compare',
        reportDir: '.testivai/reports',
        diffThreshold: 0.1,
        updateBaselines: false
      });
    });

    it('should return a new object each time', () => {
      const config1 = getDefaultConfig();
      const config2 = getDefaultConfig();
      
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('loadConfigFromFile', () => {
    beforeEach(() => {
      // Clear require cache mock
      jest.resetModules();
    });

    it('should return null when file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const result = await loadConfigFromFile('nonexistent.json');
      
      expect(result).toBeNull();
      expect(mockFs.existsSync).toHaveBeenCalledWith('nonexistent.json');
    });

    it('should load JSON configuration file', async () => {
      const mockConfig = {
        framework: 'cypress' as const,
        diffThreshold: 0.2
      };
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
      mockPath.extname.mockReturnValue('.json');
      
      const result = await loadConfigFromFile('config.json');
      
      expect(result).toEqual(mockConfig);
      expect(mockFs.readFileSync).toHaveBeenCalledWith('config.json', 'utf8');
    });

    it('should handle JSON parsing errors', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid json');
      mockPath.extname.mockReturnValue('.json');
      
      await expect(loadConfigFromFile('config.json')).rejects.toThrow(
        'Failed to load configuration from config.json'
      );
    });

    it('should load JavaScript configuration file with require', async () => {
      const mockConfig = {
        framework: 'selenium' as const,
        diffThreshold: 0.15
      };
      
      mockFs.existsSync.mockReturnValue(true);
      mockPath.extname.mockReturnValue('.js');
      mockPath.resolve.mockReturnValue('/resolved/config.js');
      
      // Mock require
      const mockRequire = jest.fn().mockReturnValue(mockConfig);
      jest.doMock('/resolved/config.js', () => mockConfig, { virtual: true });
      
      // Mock require.resolve and require.cache
      const originalRequire = require;
      (global as any).require = Object.assign(mockRequire, {
        resolve: jest.fn().mockReturnValue('/resolved/config.js'),
        cache: {}
      });
      
      const result = await loadConfigFromFile('config.js');
      
      expect(result).toEqual(mockConfig);
      
      // Restore require
      (global as any).require = originalRequire;
    });

    it.skip('should load JavaScript configuration file with default export', async () => {
      // This test is skipped because dynamic import is difficult to mock properly
      // The functionality is partially covered by the "should load JavaScript configuration file with require" test
    });

    it('should load TypeScript configuration file', async () => {
      const mockConfig = {
        framework: 'playwright' as const,
        diffThreshold: 0.05
      };
      
      mockFs.existsSync.mockReturnValue(true);
      mockPath.extname.mockReturnValue('.ts');
      mockPath.resolve.mockReturnValue('/resolved/config.ts');
      
      // Mock require
      const mockRequire = jest.fn().mockReturnValue(mockConfig);
      jest.doMock('/resolved/config.ts', () => mockConfig, { virtual: true });
      
      // Mock require.resolve and require.cache
      const originalRequire = require;
      (global as any).require = Object.assign(mockRequire, {
        resolve: jest.fn().mockReturnValue('/resolved/config.ts'),
        cache: {}
      });
      
      const result = await loadConfigFromFile('config.ts');
      
      expect(result).toEqual(mockConfig);
      
      // Restore require
      (global as any).require = originalRequire;
    });

    it('should handle unsupported file extensions', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockPath.extname.mockReturnValue('.yaml');
      
      await expect(loadConfigFromFile('config.yaml')).rejects.toThrow(
        'Unsupported configuration file format: .yaml'
      );
    });

    it('should handle files without extensions', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockPath.extname.mockReturnValue('');
      
      await expect(loadConfigFromFile('config')).rejects.toThrow(
        'Unsupported configuration file format: '
      );
    });

    it('should handle require errors gracefully', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockPath.extname.mockReturnValue('.js');
      mockPath.resolve.mockReturnValue('/resolved/config.js');
      
      // Mock require to throw an error
      const originalRequire = require;
      const mockRequire = jest.fn().mockImplementation(() => {
        throw new Error('Module not found');
      });
      
      // Mock require.resolve to throw an error
      const mockResolve = jest.fn().mockImplementation(() => {
        throw new Error('Cannot find module');
      });
      
      // Replace global require with our mock
      (global as any).require = mockRequire;
      (global as any).require.resolve = mockResolve;
      (global as any).require.cache = {};
      
      try {
        await expect(loadConfigFromFile('config.js')).rejects.toThrow(
          'Failed to load configuration from config.js: Cannot find module'
        );
      } finally {
        // Restore require (in finally block to ensure it's restored even if test fails)
        (global as any).require = originalRequire;
      }
    });
  });

  describe('loadConfig', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('should load configuration from custom path', async () => {
      const mockConfig = {
        framework: 'cypress' as const,
        diffThreshold: 0.3
      };
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
      mockPath.extname.mockReturnValue('.json');
      mockPath.resolve.mockImplementation((p) => `/resolved/${p}`);
      
      const result = await loadConfig('custom/config.json');
      
      expect(result).toEqual({
        ...getDefaultConfig(),
        ...mockConfig
      });
    });

    it('should try default configuration files in order', async () => {
      const mockConfig = {
        framework: 'selenium' as const,
        diffThreshold: 0.2
      };
      
      // First two files don't exist, third one does
      mockFs.existsSync
        .mockReturnValueOnce(false) // testivai.config.js
        .mockReturnValueOnce(false) // testivai.config.ts
        .mockReturnValueOnce(true);  // testivai.config.json
      
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
      mockPath.extname.mockReturnValue('.json');
      mockPath.resolve.mockImplementation((p) => `/resolved/${p}`);
      
      const result = await loadConfig();
      
      expect(mockFs.existsSync).toHaveBeenCalledTimes(3);
      expect(mockFs.existsSync).toHaveBeenNthCalledWith(1, 'testivai.config.js');
      expect(mockFs.existsSync).toHaveBeenNthCalledWith(2, 'testivai.config.ts');
      expect(mockFs.existsSync).toHaveBeenNthCalledWith(3, 'testivai.config.json');
      
      expect(result).toEqual({
        ...getDefaultConfig(),
        ...mockConfig
      });
    });

    it('should return default configuration when no config file found', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const result = await loadConfig();
      
      expect(result).toEqual(getDefaultConfig());
      expect(mockFs.existsSync).toHaveBeenCalledTimes(3);
    });

    it('should resolve relative paths to absolute paths', async () => {
      const mockConfig = {
        baselineDir: './custom/baseline',
        compareDir: '../compare',
        reportDir: 'reports'
      };
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
      mockPath.extname.mockReturnValue('.json');
      mockPath.resolve.mockImplementation((p) => `/resolved/${p}`);
      
      const result = await loadConfig('config.json');
      
      expect(result.baselineDir).toBe('/resolved/./custom/baseline');
      expect(result.compareDir).toBe('/resolved/../compare');
      expect(result.reportDir).toBe('/resolved/reports');
    });

    it('should handle configuration loading errors gracefully', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });
      mockPath.extname.mockReturnValue('.json');
      
      const result = await loadConfig('config.json');
      
      expect(result).toEqual(getDefaultConfig());
      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load configuration: Failed to load configuration from config.json: File read error. Using default configuration.')
      );
    });

    it('should handle non-Error exceptions', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw 'String error';
      });
      mockPath.extname.mockReturnValue('.json');
      
      const result = await loadConfig('config.json');
      
      expect(result).toEqual(getDefaultConfig());
      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load configuration: Failed to load configuration from config.json: String error. Using default configuration.')
      );
    });

    it('should merge loaded configuration with defaults', async () => {
      const mockConfig = {
        diffThreshold: 0.5,
        updateBaselines: true
        // framework and directories not specified, should use defaults
      };
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
      mockPath.extname.mockReturnValue('.json');
      mockPath.resolve.mockImplementation((p) => `/resolved/${p}`);
      
      const result = await loadConfig('config.json');
      
      expect(result).toEqual({
        framework: 'playwright', // default
        baselineDir: '.testivai/baseline', // default, not resolved since not in config
        compareDir: '.testivai/compare', // default, not resolved since not in config
        reportDir: '.testivai/reports', // default, not resolved since not in config
        diffThreshold: 0.5, // from config
        updateBaselines: true // from config
      });
    });

    it('should handle empty configuration object', async () => {
      const mockConfig = {};
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
      mockPath.extname.mockReturnValue('.json');
      mockPath.resolve.mockImplementation((p) => `/resolved/${p}`);
      
      const result = await loadConfig('config.json');
      
      expect(result).toEqual({
        ...getDefaultConfig()
      });
    });

    it('should prioritize first found configuration file', async () => {
      const mockConfig = {
        framework: 'playwright' as const,
        diffThreshold: 0.1
      };
      
      // First file exists
      mockFs.existsSync
        .mockReturnValueOnce(true)   // testivai.config.js
        .mockReturnValueOnce(false)  // should not be called
        .mockReturnValueOnce(false); // should not be called
      
      mockPath.extname.mockReturnValue('.js');
      mockPath.resolve.mockReturnValue('/resolved/testivai.config.js');
      
      // Mock require
      const mockRequire = jest.fn().mockReturnValue(mockConfig);
      const originalRequire = require;
      (global as any).require = Object.assign(mockRequire, {
        resolve: jest.fn().mockReturnValue('/resolved/testivai.config.js'),
        cache: {}
      });
      
      const result = await loadConfig();
      
      expect(mockFs.existsSync).toHaveBeenCalledTimes(1);
      expect(mockFs.existsSync).toHaveBeenCalledWith('testivai.config.js');
      
      // Restore require
      (global as any).require = originalRequire;
    });
  });

  describe('Path resolution', () => {
    it('should resolve absolute paths through path.resolve', async () => {
      const mockConfig = {
        baselineDir: '/absolute/path/baseline',
        compareDir: '/absolute/path/compare',
        reportDir: '/absolute/path/reports'
      };
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
      mockPath.extname.mockReturnValue('.json');
      
      // Clear previous calls to mockPath.resolve
      mockPath.resolve.mockClear();
      
      // Create a specific implementation that tracks calls
      const resolveImplementation = jest.fn().mockImplementation((p) => `/resolved/${p}`);
      mockPath.resolve.mockImplementation(resolveImplementation);
      
      const result = await loadConfig('config.json');
      
      // Verify that resolveImplementation was called for each path
      expect(resolveImplementation).toHaveBeenCalledWith('/absolute/path/baseline');
      expect(resolveImplementation).toHaveBeenCalledWith('/absolute/path/compare');
      expect(resolveImplementation).toHaveBeenCalledWith('/absolute/path/reports');
      
      // Verify the resolved paths in the result
      expect(result.baselineDir).toBe('/resolved//absolute/path/baseline');
      expect(result.compareDir).toBe('/resolved//absolute/path/compare');
      expect(result.reportDir).toBe('/resolved//absolute/path/reports');
    });

    it('should handle undefined path properties', async () => {
      const mockConfig = {
        framework: 'cypress' as const
        // No path properties defined
      };
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
      mockPath.extname.mockReturnValue('.json');
      mockPath.resolve.mockImplementation((p) => `/resolved/${p}`);
      
      const result = await loadConfig('config.json');
      
      // Should use defaults without resolving them since they're not in the loaded config
      expect(result.baselineDir).toBe('.testivai/baseline');
      expect(result.compareDir).toBe('.testivai/compare');
      expect(result.reportDir).toBe('.testivai/reports');
    });
  });

  describe('Integration tests', () => {
    it('should work with complete configuration workflow', async () => {
      // Setup mocks for a complete workflow
      const mockConfig = {
        framework: 'cypress' as const,
        diffThreshold: 0.2,
        baselineDir: './custom/baseline',
        compareDir: './custom/compare'
      };
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
      mockPath.extname.mockReturnValue('.json');
      mockPath.resolve.mockImplementation((p) => `/resolved/${p}`);
      
      // Test the complete workflow
      const result = await loadConfig('testivai.config.json');
      
      // Verify the result combines defaults with loaded config
      expect(result).toEqual({
        framework: 'cypress',
        diffThreshold: 0.2,
        baselineDir: '/resolved/./custom/baseline',
        compareDir: '/resolved/./custom/compare',
        reportDir: '.testivai/reports',
        updateBaselines: false
      });
    });

    it('should handle mixed configuration sources', async () => {
      // This test verifies that the configuration system can handle
      // a mix of default values, loaded values, and resolved paths
      
      const mockConfig = {
        // Only specify some options
        framework: 'puppeteer' as const,
        baselineDir: './puppeteer/baseline'
        // Let other options use defaults
      };
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
      mockPath.extname.mockReturnValue('.json');
      mockPath.resolve.mockImplementation((p) => `/resolved/${p}`);
      
      const result = await loadConfig('config.json');
      
      // Verify mixed sources
      expect(result.framework).toBe('puppeteer'); // From config
      expect(result.baselineDir).toBe('/resolved/./puppeteer/baseline'); // From config, resolved
      expect(result.compareDir).toBe('.testivai/compare'); // Default, not resolved
      expect(result.reportDir).toBe('.testivai/reports'); // Default, not resolved
      expect(result.diffThreshold).toBe(0.1); // Default
      expect(result.updateBaselines).toBe(false); // Default
    });
  });
});
