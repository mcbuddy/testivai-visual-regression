/**
 * Tests for core interfaces
 */

import { testivAIOptions, Plugin, Framework, ScreenshotOptions } from '../../../src/core/interfaces';

describe('Core Interfaces', () => {
  describe('testivAIOptions', () => {
    it('should define required properties', () => {
      const options: testivAIOptions = {
        framework: 'playwright',
        baselineDir: '.testivAI/visual-regression/baseline'
      };
      
      expect(options.framework).toBe('playwright');
      expect(options.baselineDir).toBe('.testivAI/visual-regression/baseline');
    });

    it('should allow optional properties', () => {
      const options: testivAIOptions = {
        framework: 'cypress',
        baselineDir: '.testivAI/visual-regression/baseline',
        compareDir: '.testivAI/visual-regression/compare',
        reportDir: '.testivAI/visual-regression/reports',
        diffThreshold: 0.1,
        updateBaselines: false
      };
      
      expect(options.framework).toBe('cypress');
      expect(options.baselineDir).toBe('.testivAI/visual-regression/baseline');
      expect(options.compareDir).toBe('.testivAI/visual-regression/compare');
      expect(options.reportDir).toBe('.testivAI/visual-regression/reports');
      expect(options.diffThreshold).toBe(0.1);
      expect(options.updateBaselines).toBe(false);
    });
  });

  describe('Framework enum', () => {
    it('should define supported frameworks', () => {
      expect(Framework.PLAYWRIGHT).toBe('playwright');
      expect(Framework.CYPRESS).toBe('cypress');
      expect(Framework.PUPPETEER).toBe('puppeteer');
      expect(Framework.SELENIUM).toBe('selenium');
    });
  });

  describe('Plugin interface', () => {
    it('should define required methods', () => {
      // This is a type check test, not a runtime test
      const mockPlugin: Plugin = {
        name: 'test-plugin',
        init: jest.fn(),
        capture: jest.fn()
      };
      
      expect(mockPlugin.name).toBe('test-plugin');
      expect(typeof mockPlugin.init).toBe('function');
      expect(typeof mockPlugin.capture).toBe('function');
    });
  });

  describe('ScreenshotOptions', () => {
    it('should define optional properties', () => {
      const options: ScreenshotOptions = {
        fullPage: true,
        selector: '.main-content',
        ignoreRegions: ['.date-time', '.ad-banner']
      };
      
      expect(options.fullPage).toBe(true);
      expect(options.selector).toBe('.main-content');
      expect(options.ignoreRegions).toEqual(['.date-time', '.ad-banner']);
    });
  });
});
