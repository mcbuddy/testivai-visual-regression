/**
 * Tests for testivAI main class
 */

import { testivAI } from '../../../src/core/testivai-vr';
import { Plugin, testivAIOptions } from '../../../src/core/interfaces';

describe('testivAI', () => {
  describe('init', () => {
    it('should create a new instance with default options', () => {
      const options: testivAIOptions = {
        framework: 'playwright',
        baselineDir: '.testivAI/visual-regression/baseline'
      };
      
      const instance = testivAI.init(options);
      
      expect(instance).toBeInstanceOf(testivAI);
      expect(instance.getOptions().framework).toBe('playwright');
      expect(instance.getOptions().baselineDir).toBe('.testivAI/visual-regression/baseline');
      expect(instance.getOptions().compareDir).toBe('.testivAI/visual-regression/compare');
      expect(instance.getOptions().reportDir).toBe('.testivAI/visual-regression/reports');
      expect(instance.getOptions().diffThreshold).toBe(0.1);
      expect(instance.getOptions().updateBaselines).toBe(false);
    });
    
    it('should create a new instance with custom options', () => {
      const options: testivAIOptions = {
        framework: 'cypress',
        baselineDir: 'custom/baseline',
        compareDir: 'custom/compare',
        reportDir: 'custom/reports',
        diffThreshold: 0.2,
        updateBaselines: true
      };
      
      const instance = testivAI.init(options);
      
      expect(instance).toBeInstanceOf(testivAI);
      expect(instance.getOptions().framework).toBe('cypress');
      expect(instance.getOptions().baselineDir).toBe('custom/baseline');
      expect(instance.getOptions().compareDir).toBe('custom/compare');
      expect(instance.getOptions().reportDir).toBe('custom/reports');
      expect(instance.getOptions().diffThreshold).toBe(0.2);
      expect(instance.getOptions().updateBaselines).toBe(true);
    });
  });
  
  describe('use', () => {
    it('should register a plugin', () => {
      const options: testivAIOptions = {
        framework: 'playwright',
        baselineDir: '.testivAI/visual-regression/baseline'
      };
      
      const instance = testivAI.init(options);
      
      const mockPlugin: Plugin = {
        name: 'test-plugin',
        init: jest.fn(),
        capture: jest.fn()
      };
      
      instance.use(mockPlugin);
      
      expect(mockPlugin.init).toHaveBeenCalled();
    });
    
    it('should throw an error if plugin framework does not match', () => {
      const options: testivAIOptions = {
        framework: 'playwright',
        baselineDir: '.testivAI/visual-regression/baseline'
      };
      
      const instance = testivAI.init(options);
      
      const mockPlugin: Plugin = {
        name: 'cypress-plugin',
        init: jest.fn(),
        capture: jest.fn()
      };
      
      // Mock the plugin to indicate it's for a different framework
      jest.spyOn(instance, 'getPluginFramework').mockReturnValue('cypress');
      
      expect(() => {
        instance.use(mockPlugin);
      }).toThrow('Plugin cypress-plugin is for framework cypress, but testivAI is configured for playwright');
    });
  });
  
  describe('capture', () => {
    it('should call the plugin capture method', async () => {
      const options: testivAIOptions = {
        framework: 'playwright',
        baselineDir: '.testivAI/visual-regression/baseline'
      };
      
      const instance = testivAI.init(options);
      
      const mockPlugin: Plugin = {
        name: 'test-plugin',
        init: jest.fn(),
        capture: jest.fn().mockResolvedValue('screenshot-path.png')
      };
      
      instance.use(mockPlugin);
      
      const target = { screenshot: jest.fn() }; // Mock page/browser object
      const result = await instance.capture('test-screenshot', target);
      
      expect(mockPlugin.capture).toHaveBeenCalledWith('test-screenshot', target, undefined);
      expect(result).toBe('screenshot-path.png');
    });
    
    it('should throw an error if no plugin is registered', async () => {
      const options: testivAIOptions = {
        framework: 'playwright',
        baselineDir: '.testivAI/visual-regression/baseline'
      };
      
      const instance = testivAI.init(options);
      
      const target = { screenshot: jest.fn() }; // Mock page/browser object
      
      await expect(instance.capture('test-screenshot', target)).rejects.toThrow(
        'No plugin registered for framework playwright'
      );
    });
  });
  
  describe('getPluginFramework', () => {
    it('should determine the framework from the plugin name', () => {
      const options: testivAIOptions = {
        framework: 'playwright',
        baselineDir: '.testivAI/visual-regression/baseline'
      };
      
      const instance = testivAI.init(options);
      
      const mockPlugin: Plugin = {
        name: 'playwright-plugin',
        init: jest.fn(),
        capture: jest.fn()
      };
      
      expect(instance.getPluginFramework(mockPlugin)).toBe('playwright');
      
      mockPlugin.name = 'cypress-plugin';
      expect(instance.getPluginFramework(mockPlugin)).toBe('cypress');
      
      mockPlugin.name = 'puppeteer-plugin';
      expect(instance.getPluginFramework(mockPlugin)).toBe('puppeteer');
      
      mockPlugin.name = 'selenium-plugin';
      expect(instance.getPluginFramework(mockPlugin)).toBe('selenium');
      
      mockPlugin.name = 'unknown-plugin';
      expect(instance.getPluginFramework(mockPlugin)).toBe('unknown');
    });
  });
  
  describe('generateReport', () => {
    // Mock the report module
    jest.mock('../../../src/report', () => ({
      reportGenerator: {
        generateReport: jest.fn().mockResolvedValue('report-path/index.html')
      }
    }));
    
    it('should call the report generator with the correct parameters', async () => {
      const options: testivAIOptions = {
        framework: 'playwright',
        baselineDir: '.testivAI/visual-regression/baseline',
        reportDir: 'custom-reports'
      };
      
      const instance = testivAI.init(options);
      
      // Import the mocked report generator
      const { reportGenerator } = require('../../../src/report');
      
      // Create mock comparison results
      const mockComparisonResults = [
        {
          name: 'test-screenshot',
          baselinePath: 'baseline/test-screenshot.png',
          comparePath: 'compare/test-screenshot.png',
          diffPath: 'diff/test-screenshot.png',
          passed: true,
          diffPercentage: 0,
          threshold: 0.1
        }
      ];
      
      // Call generateReport
      const result = await instance.generateReport(mockComparisonResults, {
        framework: 'playwright',
        outputPath: 'custom-output'
      });
      
      // Verify the report generator was called with the correct parameters
      expect(reportGenerator.generateReport).toHaveBeenCalledWith(
        mockComparisonResults,
        {
          framework: 'playwright',
          outputPath: 'custom-output',
          includeHistory: undefined,
          approvalsData: undefined,
          prInfo: undefined
        }
      );
      
      // Verify the result is the path returned by the report generator
      expect(result).toBe('report-path/index.html');
    });
    
    it('should use default options if not provided', async () => {
      const options: testivAIOptions = {
        framework: 'playwright',
        baselineDir: '.testivAI/visual-regression/baseline',
        reportDir: 'custom-reports'
      };
      
      const instance = testivAI.init(options);
      
      // Import the mocked report generator
      const { reportGenerator } = require('../../../src/report');
      
      // Reset the mock to clear previous calls
      reportGenerator.generateReport.mockClear();
      
      // Create mock comparison results
      const mockComparisonResults = [
        {
          name: 'test-screenshot',
          baselinePath: 'baseline/test-screenshot.png',
          comparePath: 'compare/test-screenshot.png',
          diffPath: 'diff/test-screenshot.png',
          passed: true,
          diffPercentage: 0,
          threshold: 0.1
        }
      ];
      
      // Call generateReport without options
      await instance.generateReport(mockComparisonResults);
      
      // Verify the report generator was called with default options
      expect(reportGenerator.generateReport).toHaveBeenCalledWith(
        mockComparisonResults,
        {
          framework: 'playwright',
          outputPath: 'custom-reports',
          includeHistory: undefined,
          approvalsData: undefined,
          prInfo: undefined
        }
      );
    });
  });
});
