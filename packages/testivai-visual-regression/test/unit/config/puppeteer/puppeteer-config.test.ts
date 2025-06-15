/**
 * Tests for Puppeteer configuration
 */

import {
  PuppeteerConfig,
  getPuppeteerDefaultConfig,
  validatePuppeteerConfig,
  mergePuppeteerConfig
} from '../../../../src/config/puppeteer';

describe('Puppeteer Configuration', () => {
  describe('getPuppeteerDefaultConfig', () => {
    it('should return default configuration', () => {
      const config = getPuppeteerDefaultConfig();
      
      expect(config).toBeDefined();
      expect(config.framework).toBe('puppeteer');
      expect(config.baselineDir).toBe('.testivai/baseline');
      expect(config.compareDir).toBe('.testivai/compare');
      expect(config.reportDir).toBe('.testivai/reports');
      expect(config.diffThreshold).toBe(0.1);
      expect(config.updateBaselines).toBe(false);
      
      // Check Puppeteer-specific defaults
      expect(config.puppeteer).toBeDefined();
      expect(config.puppeteer?.timeout).toBe(30000);
      
      // Check launch options
      expect(config.puppeteer?.launchOptions).toBeDefined();
      expect(config.puppeteer?.launchOptions?.headless).toBe(true);
      expect(config.puppeteer?.launchOptions?.product).toBe('chrome');
      
      // Check default viewport
      expect(config.puppeteer?.defaultViewport).toBeDefined();
      expect(config.puppeteer?.defaultViewport?.width).toBe(1280);
      expect(config.puppeteer?.defaultViewport?.height).toBe(720);
      
      // Check screenshot options
      expect(config.puppeteer?.screenshotOptions).toBeDefined();
      expect(config.puppeteer?.screenshotOptions?.fullPage).toBe(false);
      expect(config.puppeteer?.screenshotOptions?.type).toBe('png');
      
      // Check navigation options
      expect(config.puppeteer?.navigationOptions).toBeDefined();
      expect(config.puppeteer?.navigationOptions?.waitUntil).toBe('load');
      
      // Check wait options
      expect(config.puppeteer?.waitOptions).toBeDefined();
      expect(config.puppeteer?.waitOptions?.waitForAnimations).toBe(true);
      expect(config.puppeteer?.waitOptions?.waitForNetworkIdle).toBe(true);
    });
  });
  
  describe('validatePuppeteerConfig', () => {
    it('should validate valid configuration', () => {
      const config: Partial<PuppeteerConfig> = {
        framework: 'puppeteer',
        baselineDir: 'custom/baseline',
        diffThreshold: 0.2,
        puppeteer: {
          timeout: 60000,
          launchOptions: {
            headless: false,
            product: 'chrome'
          },
          defaultViewport: {
            width: 1920,
            height: 1080
          }
        }
      };
      
      const result = validatePuppeteerConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should reject invalid framework', () => {
      const config: Partial<PuppeteerConfig> = {
        framework: 'playwright' as any,
        baselineDir: 'custom/baseline'
      };
      
      const result = validatePuppeteerConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Framework must be 'puppeteer', got 'playwright'");
    });
    
    it('should reject invalid diffThreshold', () => {
      const config: Partial<PuppeteerConfig> = {
        framework: 'puppeteer',
        diffThreshold: 1.5
      };
      
      const result = validatePuppeteerConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('diffThreshold must be a number between 0 and 1');
    });
    
    it('should reject invalid timeout', () => {
      const config: Partial<PuppeteerConfig> = {
        framework: 'puppeteer',
        puppeteer: {
          timeout: -1000
        }
      };
      
      const result = validatePuppeteerConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('puppeteer.timeout must be a positive number');
    });
    
    it('should reject invalid product', () => {
      const config: Partial<PuppeteerConfig> = {
        framework: 'puppeteer',
        puppeteer: {
          launchOptions: {
            product: 'safari' as any
          }
        }
      };
      
      const result = validatePuppeteerConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("puppeteer.launchOptions.product must be one of: chrome, firefox");
    });
    
    it('should reject invalid viewport dimensions', () => {
      const config: Partial<PuppeteerConfig> = {
        framework: 'puppeteer',
        puppeteer: {
          defaultViewport: {
            width: -800,
            height: 0
          }
        }
      };
      
      const result = validatePuppeteerConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('puppeteer.defaultViewport.width must be a positive number');
      expect(result.errors).toContain('puppeteer.defaultViewport.height must be a positive number');
    });
    
    it('should reject invalid screenshot options', () => {
      const config: Partial<PuppeteerConfig> = {
        framework: 'puppeteer',
        puppeteer: {
          screenshotOptions: {
            type: 'webp' as any,
            quality: 101
          }
        }
      };
      
      const result = validatePuppeteerConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("puppeteer.screenshotOptions.type must be one of: png, jpeg");
      expect(result.errors).toContain('puppeteer.screenshotOptions.quality must be a number between 0 and 100');
    });
    
    it('should reject invalid clip dimensions', () => {
      const config: Partial<PuppeteerConfig> = {
        framework: 'puppeteer',
        puppeteer: {
          screenshotOptions: {
            clip: {
              x: -10,
              y: 0,
              width: 0,
              height: -100
            }
          }
        }
      };
      
      const result = validatePuppeteerConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('puppeteer.screenshotOptions.clip.x must be a non-negative number');
      expect(result.errors).toContain('puppeteer.screenshotOptions.clip.width must be a positive number');
      expect(result.errors).toContain('puppeteer.screenshotOptions.clip.height must be a positive number');
    });
    
    it('should reject invalid navigation options', () => {
      const config: Partial<PuppeteerConfig> = {
        framework: 'puppeteer',
        puppeteer: {
          navigationOptions: {
            waitUntil: 'interactive' as any
          }
        }
      };
      
      const result = validatePuppeteerConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("puppeteer.navigationOptions.waitUntil must be one of: load, domcontentloaded, networkidle0, networkidle2");
    });
  });
  
  describe('mergePuppeteerConfig', () => {
    it('should merge with defaults', () => {
      const customConfig: Partial<PuppeteerConfig> = {
        baselineDir: 'custom/baseline',
        diffThreshold: 0.2,
        puppeteer: {
          timeout: 60000,
          launchOptions: {
            headless: false
          }
        }
      };
      
      const merged = mergePuppeteerConfig(customConfig);
      
      // Check merged values
      expect(merged.baselineDir).toBe('custom/baseline');
      expect(merged.diffThreshold).toBe(0.2);
      expect(merged.puppeteer?.timeout).toBe(60000);
      expect(merged.puppeteer?.launchOptions?.headless).toBe(false);
      
      // Check default values are preserved
      expect(merged.framework).toBe('puppeteer');
      expect(merged.compareDir).toBe('.testivai/compare');
      expect(merged.reportDir).toBe('.testivai/reports');
      expect(merged.puppeteer?.launchOptions?.product).toBe('chrome');
      expect(merged.puppeteer?.defaultViewport?.width).toBe(1280);
    });
    
    it('should deeply merge nested objects', () => {
      const customConfig: Partial<PuppeteerConfig> = {
        puppeteer: {
          defaultViewport: {
            width: 1920
          },
          screenshotOptions: {
            quality: 75
          }
        }
      };
      
      const merged = mergePuppeteerConfig(customConfig);
      
      // Check merged values
      expect(merged.puppeteer?.defaultViewport?.width).toBe(1920);
      expect(merged.puppeteer?.screenshotOptions?.quality).toBe(75);
      
      // Check default values are preserved
      expect(merged.puppeteer?.defaultViewport?.height).toBe(720);
      expect(merged.puppeteer?.screenshotOptions?.type).toBe('png');
    });
    
    it('should handle empty config', () => {
      const merged = mergePuppeteerConfig({});
      
      // Should be same as default config
      const defaultConfig = getPuppeteerDefaultConfig();
      expect(merged).toEqual(defaultConfig);
    });
    
    it('should handle null or undefined values', () => {
      const customConfig: Partial<PuppeteerConfig> = {
        puppeteer: {
          launchOptions: null as any,
          defaultViewport: undefined
        }
      };
      
      const merged = mergePuppeteerConfig(customConfig);
      
      // Default values should be used
      expect(merged.puppeteer?.launchOptions).toBeDefined();
      expect(merged.puppeteer?.defaultViewport).toBeDefined();
    });
  });
});
