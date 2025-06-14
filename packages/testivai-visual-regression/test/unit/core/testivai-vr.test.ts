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
});
