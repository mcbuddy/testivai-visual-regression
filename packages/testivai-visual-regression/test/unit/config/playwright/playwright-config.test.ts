/**
 * Tests for Playwright-specific configuration functionality
 */

import {
  PlaywrightConfig,
  getPlaywrightDefaultConfig,
  validatePlaywrightConfig,
  mergePlaywrightConfig
} from '../../../../src/config/playwright';

describe('Playwright Configuration', () => {
  describe('getPlaywrightDefaultConfig', () => {
    it('should return default Playwright configuration', () => {
      const config = getPlaywrightDefaultConfig();
      
      expect(config).toEqual({
        framework: 'playwright',
        baselineDir: '.testivai/baseline',
        compareDir: '.testivai/compare',
        reportDir: '.testivai/reports',
        diffThreshold: 0.1,
        updateBaselines: false,
        playwright: {
          disableAnimations: true,
          hideCaret: true,
          timeout: 30000,
          waitForFonts: true,
          launchOptions: {
            headless: true,
            viewport: {
              width: 1280,
              height: 720
            },
            deviceScaleFactor: 1
          },
          pageOptions: {
            fullPage: false,
            quality: 90,
            type: 'png'
          }
        }
      });
    });
    
    it('should return a new object each time', () => {
      const config1 = getPlaywrightDefaultConfig();
      const config2 = getPlaywrightDefaultConfig();
      
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
    
    it('should have framework set to playwright', () => {
      const config = getPlaywrightDefaultConfig();
      expect(config.framework).toBe('playwright');
    });
    
    it('should have sensible default values', () => {
      const config = getPlaywrightDefaultConfig();
      
      expect(config.diffThreshold).toBe(0.1);
      expect(config.updateBaselines).toBe(false);
      expect(config.playwright?.disableAnimations).toBe(true);
      expect(config.playwright?.hideCaret).toBe(true);
      expect(config.playwright?.timeout).toBe(30000);
      expect(config.playwright?.waitForFonts).toBe(true);
    });
  });
  
  describe('validatePlaywrightConfig', () => {
    it('should validate correct configuration', () => {
      const config: Partial<PlaywrightConfig> = {
        framework: 'playwright',
        diffThreshold: 0.2,
        playwright: {
          timeout: 5000,
          launchOptions: {
            headless: true,
            viewport: {
              width: 1920,
              height: 1080
            },
            deviceScaleFactor: 2
          },
          pageOptions: {
            fullPage: true,
            quality: 80,
            type: 'jpeg'
          }
        }
      };
      
      const result = validatePlaywrightConfig(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    it('should reject invalid framework', () => {
      const config: Partial<PlaywrightConfig> = {
        framework: 'cypress' as any
      };
      
      const result = validatePlaywrightConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Framework must be 'playwright', got 'cypress'");
    });
    
    it('should reject invalid diffThreshold values', () => {
      const testCases = [
        { diffThreshold: -0.1, error: 'diffThreshold must be a number between 0 and 1' },
        { diffThreshold: 1.1, error: 'diffThreshold must be a number between 0 and 1' },
        { diffThreshold: 'invalid' as any, error: 'diffThreshold must be a number between 0 and 1' }
      ];
      
      testCases.forEach(testCase => {
        const config: Partial<PlaywrightConfig> = {
          diffThreshold: testCase.diffThreshold
        };
        
        const result = validatePlaywrightConfig(config);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(testCase.error);
      });
    });
    
    it('should reject invalid timeout values', () => {
      const testCases = [
        { timeout: -1000, error: 'playwright.timeout must be a positive number' },
        { timeout: 'invalid' as any, error: 'playwright.timeout must be a positive number' }
      ];
      
      testCases.forEach(testCase => {
        const config: Partial<PlaywrightConfig> = {
          playwright: {
            timeout: testCase.timeout
          }
        };
        
        const result = validatePlaywrightConfig(config);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(testCase.error);
      });
    });
    
    it('should reject invalid viewport dimensions', () => {
      const testCases = [
        {
          viewport: { width: 0, height: 720 },
          error: 'playwright.launchOptions.viewport.width must be a positive number'
        },
        {
          viewport: { width: 1280, height: -100 },
          error: 'playwright.launchOptions.viewport.height must be a positive number'
        },
        {
          viewport: { width: 'invalid' as any, height: 720 },
          error: 'playwright.launchOptions.viewport.width must be a positive number'
        }
      ];
      
      testCases.forEach(testCase => {
        const config: Partial<PlaywrightConfig> = {
          playwright: {
            launchOptions: {
              viewport: testCase.viewport
            }
          }
        };
        
        const result = validatePlaywrightConfig(config);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(testCase.error);
      });
    });
    
    it('should reject invalid deviceScaleFactor', () => {
      const testCases = [
        { deviceScaleFactor: 0, error: 'playwright.launchOptions.deviceScaleFactor must be a positive number' },
        { deviceScaleFactor: -1, error: 'playwright.launchOptions.deviceScaleFactor must be a positive number' },
        { deviceScaleFactor: 'invalid' as any, error: 'playwright.launchOptions.deviceScaleFactor must be a positive number' }
      ];
      
      testCases.forEach(testCase => {
        const config: Partial<PlaywrightConfig> = {
          playwright: {
            launchOptions: {
              deviceScaleFactor: testCase.deviceScaleFactor
            }
          }
        };
        
        const result = validatePlaywrightConfig(config);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(testCase.error);
      });
    });
    
    it('should reject invalid quality values', () => {
      const testCases = [
        { quality: -1, error: 'playwright.pageOptions.quality must be a number between 0 and 100' },
        { quality: 101, error: 'playwright.pageOptions.quality must be a number between 0 and 100' },
        { quality: 'invalid' as any, error: 'playwright.pageOptions.quality must be a number between 0 and 100' }
      ];
      
      testCases.forEach(testCase => {
        const config: Partial<PlaywrightConfig> = {
          playwright: {
            pageOptions: {
              quality: testCase.quality
            }
          }
        };
        
        const result = validatePlaywrightConfig(config);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(testCase.error);
      });
    });
    
    it('should reject invalid screenshot type', () => {
      const config: Partial<PlaywrightConfig> = {
        playwright: {
          pageOptions: {
            type: 'gif' as any
          }
        }
      };
      
      const result = validatePlaywrightConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("playwright.pageOptions.type must be 'png' or 'jpeg'");
    });
    
    it('should reject invalid clip coordinates', () => {
      const testCases = [
        {
          clip: { x: -1, y: 0, width: 100, height: 100 },
          error: 'playwright.pageOptions.clip.x must be a non-negative number'
        },
        {
          clip: { x: 0, y: -1, width: 100, height: 100 },
          error: 'playwright.pageOptions.clip.y must be a non-negative number'
        },
        {
          clip: { x: 0, y: 0, width: 0, height: 100 },
          error: 'playwright.pageOptions.clip.width must be a positive number'
        },
        {
          clip: { x: 0, y: 0, width: 100, height: -1 },
          error: 'playwright.pageOptions.clip.height must be a positive number'
        }
      ];
      
      testCases.forEach(testCase => {
        const config: Partial<PlaywrightConfig> = {
          playwright: {
            pageOptions: {
              clip: testCase.clip
            }
          }
        };
        
        const result = validatePlaywrightConfig(config);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(testCase.error);
      });
    });
    
    it('should accept valid boundary values', () => {
      const config: Partial<PlaywrightConfig> = {
        diffThreshold: 0,
        playwright: {
          timeout: 1,
          launchOptions: {
            viewport: {
              width: 1,
              height: 1
            },
            deviceScaleFactor: 0.1
          },
          pageOptions: {
            quality: 0,
            clip: {
              x: 0,
              y: 0,
              width: 1,
              height: 1
            }
          }
        }
      };
      
      const result = validatePlaywrightConfig(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    it('should accept maximum boundary values', () => {
      const config: Partial<PlaywrightConfig> = {
        diffThreshold: 1,
        playwright: {
          pageOptions: {
            quality: 100
          }
        }
      };
      
      const result = validatePlaywrightConfig(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });
  
  describe('mergePlaywrightConfig', () => {
    it('should merge partial config with defaults', () => {
      const partialConfig: Partial<PlaywrightConfig> = {
        diffThreshold: 0.2,
        playwright: {
          timeout: 5000,
          launchOptions: {
            headless: false
          }
        }
      };
      
      const result = mergePlaywrightConfig(partialConfig);
      
      expect(result).toEqual({
        framework: 'playwright',
        baselineDir: '.testivai/baseline',
        compareDir: '.testivai/compare',
        reportDir: '.testivai/reports',
        diffThreshold: 0.2, // overridden
        updateBaselines: false,
        playwright: {
          disableAnimations: true,
          hideCaret: true,
          timeout: 5000, // overridden
          waitForFonts: true,
          launchOptions: {
            headless: false, // overridden
            viewport: {
              width: 1280,
              height: 720
            },
            deviceScaleFactor: 1
          },
          pageOptions: {
            fullPage: false,
            quality: 90,
            type: 'png'
          }
        }
      });
    });
    
    it('should merge nested viewport options', () => {
      const partialConfig: Partial<PlaywrightConfig> = {
        playwright: {
          launchOptions: {
            viewport: {
              width: 1920
              // height should remain default
            }
          }
        }
      };
      
      const result = mergePlaywrightConfig(partialConfig);
      
      expect(result.playwright?.launchOptions?.viewport).toEqual({
        width: 1920,
        height: 720 // default value preserved
      });
    });
    
    it('should merge nested page options', () => {
      const partialConfig: Partial<PlaywrightConfig> = {
        playwright: {
          pageOptions: {
            fullPage: true,
            quality: 80
            // type should remain default
          }
        }
      };
      
      const result = mergePlaywrightConfig(partialConfig);
      
      expect(result.playwright?.pageOptions).toEqual({
        fullPage: true,
        quality: 80,
        type: 'png' // default value preserved
      });
    });
    
    it('should handle empty config', () => {
      const result = mergePlaywrightConfig({});
      
      expect(result).toEqual(getPlaywrightDefaultConfig());
    });
    
    it('should handle config with only top-level properties', () => {
      const partialConfig: Partial<PlaywrightConfig> = {
        framework: 'playwright',
        diffThreshold: 0.05,
        updateBaselines: true
      };
      
      const result = mergePlaywrightConfig(partialConfig);
      
      expect(result.framework).toBe('playwright');
      expect(result.diffThreshold).toBe(0.05);
      expect(result.updateBaselines).toBe(true);
      expect(result.playwright).toEqual(getPlaywrightDefaultConfig().playwright);
    });
    
    it('should handle config with only playwright-specific properties', () => {
      const partialConfig: Partial<PlaywrightConfig> = {
        playwright: {
          disableAnimations: false,
          hideCaret: false,
          waitForFonts: false
        }
      };
      
      const result = mergePlaywrightConfig(partialConfig);
      
      expect(result.framework).toBe('playwright');
      expect(result.diffThreshold).toBe(0.1);
      expect(result.playwright?.disableAnimations).toBe(false);
      expect(result.playwright?.hideCaret).toBe(false);
      expect(result.playwright?.waitForFonts).toBe(false);
      expect(result.playwright?.timeout).toBe(30000); // default preserved
    });
  });
  
  describe('Integration tests', () => {
    it('should work with real-world configuration scenarios', () => {
      // Mobile viewport configuration
      const mobileConfig: Partial<PlaywrightConfig> = {
        playwright: {
          launchOptions: {
            viewport: {
              width: 375,
              height: 667
            },
            deviceScaleFactor: 2
          },
          pageOptions: {
            fullPage: true
          }
        }
      };
      
      const merged = mergePlaywrightConfig(mobileConfig);
      const validation = validatePlaywrightConfig(merged);
      
      expect(validation.isValid).toBe(true);
      expect(merged.playwright?.launchOptions?.viewport?.width).toBe(375);
      expect(merged.playwright?.launchOptions?.deviceScaleFactor).toBe(2);
      expect(merged.playwright?.pageOptions?.fullPage).toBe(true);
    });
    
    it('should work with high-quality JPEG configuration', () => {
      const jpegConfig: Partial<PlaywrightConfig> = {
        playwright: {
          pageOptions: {
            type: 'jpeg',
            quality: 95
          }
        }
      };
      
      const merged = mergePlaywrightConfig(jpegConfig);
      const validation = validatePlaywrightConfig(merged);
      
      expect(validation.isValid).toBe(true);
      expect(merged.playwright?.pageOptions?.type).toBe('jpeg');
      expect(merged.playwright?.pageOptions?.quality).toBe(95);
    });
    
    it('should work with clipped screenshot configuration', () => {
      const clipConfig: Partial<PlaywrightConfig> = {
        playwright: {
          pageOptions: {
            clip: {
              x: 100,
              y: 50,
              width: 800,
              height: 600
            }
          }
        }
      };
      
      const merged = mergePlaywrightConfig(clipConfig);
      const validation = validatePlaywrightConfig(merged);
      
      expect(validation.isValid).toBe(true);
      expect(merged.playwright?.pageOptions?.clip).toEqual({
        x: 100,
        y: 50,
        width: 800,
        height: 600
      });
    });
  });
});
