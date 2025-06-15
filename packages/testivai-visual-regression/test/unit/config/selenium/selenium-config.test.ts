/**
 * Tests for Selenium-specific configuration functionality
 */

import {
  SeleniumConfig,
  getSeleniumDefaultConfig,
  validateSeleniumConfig,
  mergeSeleniumConfig
} from '../../../../src/config/selenium';

describe('Selenium Configuration', () => {
  describe('getSeleniumDefaultConfig', () => {
    it('should return default Selenium configuration', () => {
      const config = getSeleniumDefaultConfig();
      
      expect(config).toEqual({
        framework: 'selenium',
        baselineDir: '.testivai/baseline',
        compareDir: '.testivai/compare',
        reportDir: '.testivai/reports',
        diffThreshold: 0.1,
        updateBaselines: false,
        selenium: {
          browserName: 'chrome',
          timeout: 30000,
          headless: true,
          windowSize: {
            width: 1280,
            height: 720
          },
          capabilities: {
            acceptInsecureCerts: false,
            pageLoadStrategy: 'normal',
            unhandledPromptBehavior: 'dismiss',
            strictFileInteractability: false
          },
          screenshotOptions: {
            fullPage: false,
            format: 'png',
            quality: 90,
            hideScrollbars: true
          },
          server: {
            url: 'http://localhost:4444',
            connectionTimeout: 30000,
            requestTimeout: 60000,
            local: true
          },
          waits: {
            implicit: 10000,
            pageLoad: 30000,
            script: 30000
          }
        }
      });
    });
    
    it('should return a new object each time', () => {
      const config1 = getSeleniumDefaultConfig();
      const config2 = getSeleniumDefaultConfig();
      
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
    
    it('should have framework set to selenium', () => {
      const config = getSeleniumDefaultConfig();
      expect(config.framework).toBe('selenium');
    });
    
    it('should have sensible default values', () => {
      const config = getSeleniumDefaultConfig();
      
      expect(config.diffThreshold).toBe(0.1);
      expect(config.updateBaselines).toBe(false);
      expect(config.selenium?.browserName).toBe('chrome');
      expect(config.selenium?.headless).toBe(true);
      expect(config.selenium?.timeout).toBe(30000);
    });
  });
  
  describe('validateSeleniumConfig', () => {
    it('should validate correct configuration', () => {
      const config: Partial<SeleniumConfig> = {
        framework: 'selenium',
        diffThreshold: 0.2,
        selenium: {
          browserName: 'chrome',
          timeout: 5000,
          headless: false,
          windowSize: {
            width: 1920,
            height: 1080
          },
          capabilities: {
            acceptInsecureCerts: true,
            pageLoadStrategy: 'eager'
          },
          screenshotOptions: {
            fullPage: true,
            format: 'jpeg',
            quality: 80
          }
        }
      };
      
      const result = validateSeleniumConfig(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    it('should reject invalid framework', () => {
      const config: Partial<SeleniumConfig> = {
        framework: 'playwright' as any
      };
      
      const result = validateSeleniumConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Framework must be 'selenium', got 'playwright'");
    });
    
    it('should reject invalid diffThreshold values', () => {
      const testCases = [
        { diffThreshold: -0.1, error: 'diffThreshold must be a number between 0 and 1' },
        { diffThreshold: 1.1, error: 'diffThreshold must be a number between 0 and 1' },
        { diffThreshold: 'invalid' as any, error: 'diffThreshold must be a number between 0 and 1' }
      ];
      
      testCases.forEach(testCase => {
        const config: Partial<SeleniumConfig> = {
          diffThreshold: testCase.diffThreshold
        };
        
        const result = validateSeleniumConfig(config);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(testCase.error);
      });
    });
    
    it('should reject invalid browser names', () => {
      const config: Partial<SeleniumConfig> = {
        selenium: {
          browserName: 'firefox' as any
        }
      };
      
      const result = validateSeleniumConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("selenium.browserName must be 'chrome' (MVP limitation)");
    });
    
    it('should reject invalid timeout values', () => {
      const testCases = [
        { timeout: -1000, error: 'selenium.timeout must be a positive number' },
        { timeout: 'invalid' as any, error: 'selenium.timeout must be a positive number' }
      ];
      
      testCases.forEach(testCase => {
        const config: Partial<SeleniumConfig> = {
          selenium: {
            timeout: testCase.timeout
          }
        };
        
        const result = validateSeleniumConfig(config);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(testCase.error);
      });
    });
    
    it('should reject invalid headless values', () => {
      const config: Partial<SeleniumConfig> = {
        selenium: {
          headless: 'true' as any
        }
      };
      
      const result = validateSeleniumConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('selenium.headless must be a boolean');
    });
    
    it('should reject invalid window size dimensions', () => {
      const testCases = [
        {
          windowSize: { width: 0, height: 720 },
          error: 'selenium.windowSize.width must be a positive number'
        },
        {
          windowSize: { width: 1280, height: -100 },
          error: 'selenium.windowSize.height must be a positive number'
        },
        {
          windowSize: { width: 'invalid' as any, height: 720 },
          error: 'selenium.windowSize.width must be a positive number'
        }
      ];
      
      testCases.forEach(testCase => {
        const config: Partial<SeleniumConfig> = {
          selenium: {
            windowSize: testCase.windowSize
          }
        };
        
        const result = validateSeleniumConfig(config);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(testCase.error);
      });
    });
    
    it('should reject invalid capabilities', () => {
      const testCases = [
        {
          capabilities: { acceptInsecureCerts: 'true' as any },
          error: 'selenium.capabilities.acceptInsecureCerts must be a boolean'
        },
        {
          capabilities: { pageLoadStrategy: 'invalid' as any },
          error: 'selenium.capabilities.pageLoadStrategy must be one of: none, eager, normal'
        },
        {
          capabilities: { unhandledPromptBehavior: 'invalid' as any },
          error: 'selenium.capabilities.unhandledPromptBehavior must be one of: dismiss, accept, dismiss and notify, accept and notify, ignore'
        },
        {
          capabilities: { strictFileInteractability: 'false' as any },
          error: 'selenium.capabilities.strictFileInteractability must be a boolean'
        }
      ];
      
      testCases.forEach(testCase => {
        const config: Partial<SeleniumConfig> = {
          selenium: testCase
        };
        
        const result = validateSeleniumConfig(config);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(testCase.error);
      });
    });
    
    it('should reject invalid screenshot options', () => {
      const testCases = [
        {
          screenshotOptions: { fullPage: 'true' as any },
          error: 'selenium.screenshotOptions.fullPage must be a boolean'
        },
        {
          screenshotOptions: { format: 'gif' as any },
          error: 'selenium.screenshotOptions.format must be one of: png, jpeg'
        },
        {
          screenshotOptions: { quality: -1 },
          error: 'selenium.screenshotOptions.quality must be a number between 0 and 100'
        },
        {
          screenshotOptions: { quality: 101 },
          error: 'selenium.screenshotOptions.quality must be a number between 0 and 100'
        },
        {
          screenshotOptions: { hideScrollbars: 'true' as any },
          error: 'selenium.screenshotOptions.hideScrollbars must be a boolean'
        },
        {
          screenshotOptions: { element: 123 as any },
          error: 'selenium.screenshotOptions.element must be a string'
        }
      ];
      
      testCases.forEach(testCase => {
        const config: Partial<SeleniumConfig> = {
          selenium: testCase
        };
        
        const result = validateSeleniumConfig(config);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(testCase.error);
      });
    });
    
    it('should reject invalid server options', () => {
      const testCases = [
        {
          server: { url: 123 as any },
          error: 'selenium.server.url must be a string'
        },
        {
          server: { connectionTimeout: -1000 },
          error: 'selenium.server.connectionTimeout must be a positive number'
        },
        {
          server: { requestTimeout: 'invalid' as any },
          error: 'selenium.server.requestTimeout must be a positive number'
        },
        {
          server: { local: 'true' as any },
          error: 'selenium.server.local must be a boolean'
        }
      ];
      
      testCases.forEach(testCase => {
        const config: Partial<SeleniumConfig> = {
          selenium: testCase
        };
        
        const result = validateSeleniumConfig(config);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(testCase.error);
      });
    });
    
    it('should reject invalid wait options', () => {
      const testCases = [
        {
          waits: { implicit: -1000 },
          error: 'selenium.waits.implicit must be a positive number'
        },
        {
          waits: { pageLoad: 'invalid' as any },
          error: 'selenium.waits.pageLoad must be a positive number'
        },
        {
          waits: { script: -500 },
          error: 'selenium.waits.script must be a positive number'
        }
      ];
      
      testCases.forEach(testCase => {
        const config: Partial<SeleniumConfig> = {
          selenium: testCase
        };
        
        const result = validateSeleniumConfig(config);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(testCase.error);
      });
    });
    
    it('should accept valid boundary values', () => {
      const config: Partial<SeleniumConfig> = {
        diffThreshold: 0,
        selenium: {
          timeout: 1,
          windowSize: {
            width: 1,
            height: 1
          },
          screenshotOptions: {
            quality: 0
          },
          server: {
            connectionTimeout: 1,
            requestTimeout: 1
          },
          waits: {
            implicit: 1,
            pageLoad: 1,
            script: 1
          }
        }
      };
      
      const result = validateSeleniumConfig(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    it('should accept maximum boundary values', () => {
      const config: Partial<SeleniumConfig> = {
        diffThreshold: 1,
        selenium: {
          screenshotOptions: {
            quality: 100
          }
        }
      };
      
      const result = validateSeleniumConfig(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });
  
  describe('mergeSeleniumConfig', () => {
    it('should merge partial config with defaults', () => {
      const partialConfig: Partial<SeleniumConfig> = {
        diffThreshold: 0.2,
        selenium: {
          browserName: 'chrome',
          timeout: 5000,
          headless: false
        }
      };
      
      const result = mergeSeleniumConfig(partialConfig);
      
      expect(result).toEqual({
        framework: 'selenium',
        baselineDir: '.testivai/baseline',
        compareDir: '.testivai/compare',
        reportDir: '.testivai/reports',
        diffThreshold: 0.2, // overridden
        updateBaselines: false,
        selenium: {
          browserName: 'chrome', // overridden
          timeout: 5000, // overridden
          headless: false, // overridden
          windowSize: {
            width: 1280,
            height: 720
          },
          capabilities: {
            acceptInsecureCerts: false,
            pageLoadStrategy: 'normal',
            unhandledPromptBehavior: 'dismiss',
            strictFileInteractability: false
          },
          screenshotOptions: {
            fullPage: false,
            format: 'png',
            quality: 90,
            hideScrollbars: true
          },
          server: {
            url: 'http://localhost:4444',
            connectionTimeout: 30000,
            requestTimeout: 60000,
            local: true
          },
          waits: {
            implicit: 10000,
            pageLoad: 30000,
            script: 30000
          }
        }
      });
    });
    
    it('should merge nested window size options', () => {
      const partialConfig: Partial<SeleniumConfig> = {
        selenium: {
          windowSize: {
            width: 1920
            // height should remain default
          }
        }
      };
      
      const result = mergeSeleniumConfig(partialConfig);
      
      expect(result.selenium?.windowSize).toEqual({
        width: 1920,
        height: 720 // default value preserved
      });
    });
    
    it('should merge nested capabilities', () => {
      const partialConfig: Partial<SeleniumConfig> = {
        selenium: {
          capabilities: {
            acceptInsecureCerts: true,
            pageLoadStrategy: 'eager'
            // other capabilities should remain default
          }
        }
      };
      
      const result = mergeSeleniumConfig(partialConfig);
      
      expect(result.selenium?.capabilities).toEqual({
        acceptInsecureCerts: true,
        pageLoadStrategy: 'eager',
        unhandledPromptBehavior: 'dismiss', // default preserved
        strictFileInteractability: false // default preserved
      });
    });
    
    it('should merge nested screenshot options', () => {
      const partialConfig: Partial<SeleniumConfig> = {
        selenium: {
          screenshotOptions: {
            fullPage: true,
            format: 'jpeg'
            // other options should remain default
          }
        }
      };
      
      const result = mergeSeleniumConfig(partialConfig);
      
      expect(result.selenium?.screenshotOptions).toEqual({
        fullPage: true,
        format: 'jpeg',
        quality: 90, // default preserved
        hideScrollbars: true // default preserved
      });
    });
    
    it('should merge nested server options', () => {
      const partialConfig: Partial<SeleniumConfig> = {
        selenium: {
          server: {
            url: 'http://selenium-grid:4444',
            local: false
            // other options should remain default
          }
        }
      };
      
      const result = mergeSeleniumConfig(partialConfig);
      
      expect(result.selenium?.server).toEqual({
        url: 'http://selenium-grid:4444',
        local: false,
        connectionTimeout: 30000, // default preserved
        requestTimeout: 60000 // default preserved
      });
    });
    
    it('should merge nested wait options', () => {
      const partialConfig: Partial<SeleniumConfig> = {
        selenium: {
          waits: {
            implicit: 5000,
            pageLoad: 45000
            // script timeout should remain default
          }
        }
      };
      
      const result = mergeSeleniumConfig(partialConfig);
      
      expect(result.selenium?.waits).toEqual({
        implicit: 5000,
        pageLoad: 45000,
        script: 30000 // default preserved
      });
    });
    
    it('should handle empty config', () => {
      const result = mergeSeleniumConfig({});
      
      expect(result).toEqual(getSeleniumDefaultConfig());
    });
    
    it('should handle config with only top-level properties', () => {
      const partialConfig: Partial<SeleniumConfig> = {
        framework: 'selenium',
        diffThreshold: 0.05,
        updateBaselines: true
      };
      
      const result = mergeSeleniumConfig(partialConfig);
      
      expect(result.framework).toBe('selenium');
      expect(result.diffThreshold).toBe(0.05);
      expect(result.updateBaselines).toBe(true);
      expect(result.selenium).toEqual(getSeleniumDefaultConfig().selenium);
    });
    
    it('should handle config with only selenium-specific properties', () => {
      const partialConfig: Partial<SeleniumConfig> = {
        selenium: {
          browserName: 'chrome',
          headless: false,
          timeout: 45000
        }
      };
      
      const result = mergeSeleniumConfig(partialConfig);
      
      expect(result.framework).toBe('selenium');
      expect(result.diffThreshold).toBe(0.1);
      expect(result.selenium?.browserName).toBe('chrome');
      expect(result.selenium?.headless).toBe(false);
      expect(result.selenium?.timeout).toBe(45000);
      expect(result.selenium?.windowSize).toEqual({ width: 1280, height: 720 }); // default preserved
    });
  });
  
  describe('Integration tests', () => {
    it('should work with real-world configuration scenarios', () => {
      // Chrome configuration
      const chromeConfig: Partial<SeleniumConfig> = {
        selenium: {
          browserName: 'chrome',
          headless: false,
          windowSize: {
            width: 1920,
            height: 1080
          },
          capabilities: {
            acceptInsecureCerts: true
          },
          screenshotOptions: {
            fullPage: true
          }
        }
      };
      
      const merged = mergeSeleniumConfig(chromeConfig);
      const validation = validateSeleniumConfig(merged);
      
      expect(validation.isValid).toBe(true);
      expect(merged.selenium?.browserName).toBe('chrome');
      expect(merged.selenium?.headless).toBe(false);
      expect(merged.selenium?.windowSize?.width).toBe(1920);
      expect(merged.selenium?.capabilities?.acceptInsecureCerts).toBe(true);
      expect(merged.selenium?.screenshotOptions?.fullPage).toBe(true);
    });
    
    it('should work with remote Selenium Grid configuration', () => {
      const gridConfig: Partial<SeleniumConfig> = {
        selenium: {
          server: {
            url: 'http://selenium-grid.example.com:4444',
            local: false,
            connectionTimeout: 60000,
            requestTimeout: 120000
          },
          capabilities: {
            pageLoadStrategy: 'eager'
          }
        }
      };
      
      const merged = mergeSeleniumConfig(gridConfig);
      const validation = validateSeleniumConfig(merged);
      
      expect(validation.isValid).toBe(true);
      expect(merged.selenium?.server?.url).toBe('http://selenium-grid.example.com:4444');
      expect(merged.selenium?.server?.local).toBe(false);
      expect(merged.selenium?.server?.connectionTimeout).toBe(60000);
      expect(merged.selenium?.capabilities?.pageLoadStrategy).toBe('eager');
    });
    
    it('should work with high-quality JPEG configuration', () => {
      const jpegConfig: Partial<SeleniumConfig> = {
        selenium: {
          screenshotOptions: {
            format: 'jpeg',
            quality: 95,
            fullPage: false,
            hideScrollbars: false
          }
        }
      };
      
      const merged = mergeSeleniumConfig(jpegConfig);
      const validation = validateSeleniumConfig(merged);
      
      expect(validation.isValid).toBe(true);
      expect(merged.selenium?.screenshotOptions?.format).toBe('jpeg');
      expect(merged.selenium?.screenshotOptions?.quality).toBe(95);
      expect(merged.selenium?.screenshotOptions?.fullPage).toBe(false);
      expect(merged.selenium?.screenshotOptions?.hideScrollbars).toBe(false);
    });
    
    it('should work with custom wait timeouts', () => {
      const waitConfig: Partial<SeleniumConfig> = {
        selenium: {
          waits: {
            implicit: 15000,
            pageLoad: 60000,
            script: 45000
          }
        }
      };
      
      const merged = mergeSeleniumConfig(waitConfig);
      const validation = validateSeleniumConfig(merged);
      
      expect(validation.isValid).toBe(true);
      expect(merged.selenium?.waits?.implicit).toBe(15000);
      expect(merged.selenium?.waits?.pageLoad).toBe(60000);
      expect(merged.selenium?.waits?.script).toBe(45000);
    });
  });
});
