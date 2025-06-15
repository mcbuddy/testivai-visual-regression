/**
 * Tests for framework-specific configuration loader
 */

import {
  FrameworkConfig,
  getFrameworkDefaultConfig,
  validateFrameworkConfig,
  mergeFrameworkConfig,
  loadFrameworkConfig,
  getSupportedFrameworks,
  isFrameworkSupported,
  detectFramework,
  createFrameworkConfig
} from '../../../src/config/framework-loader';
import { FrameworkType } from '../../../src/core/interfaces';
import { PlaywrightConfig } from '../../../src/config/playwright';

describe('Framework Configuration Loader', () => {
  describe('getFrameworkDefaultConfig', () => {
    it('should return Playwright default config', () => {
      const config = getFrameworkDefaultConfig('playwright') as PlaywrightConfig;
      
      expect(config.framework).toBe('playwright');
      expect(config.baselineDir).toBe('.testivai/baseline');
      expect(config.playwright).toBeDefined();
      expect(config.playwright?.timeout).toBe(30000);
    });
    
    it('should return Cypress default config', () => {
      const config = getFrameworkDefaultConfig('cypress');
      
      expect(config.framework).toBe('cypress');
      expect(config.baselineDir).toBe('.testivai/baseline');
      expect(config.diffThreshold).toBe(0.1);
    });
    
    it('should return Puppeteer default config', () => {
      const config = getFrameworkDefaultConfig('puppeteer');
      
      expect(config.framework).toBe('puppeteer');
      expect(config.baselineDir).toBe('.testivai/baseline');
      expect(config.diffThreshold).toBe(0.1);
    });
    
    it('should return Selenium default config', () => {
      const config = getFrameworkDefaultConfig('selenium');
      
      expect(config.framework).toBe('selenium');
      expect(config.baselineDir).toBe('.testivai/baseline');
      expect(config.diffThreshold).toBe(0.1);
    });
    
    it('should throw error for unsupported framework', () => {
      expect(() => {
        getFrameworkDefaultConfig('unsupported' as FrameworkType);
      }).toThrow('Unsupported framework: unsupported');
    });
  });
  
  describe('validateFrameworkConfig', () => {
    it('should validate Playwright configuration', () => {
      const config = {
        framework: 'playwright' as const,
        diffThreshold: 0.2,
        playwright: {
          timeout: 5000
        }
      };
      
      const result = validateFrameworkConfig('playwright', config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    it('should reject framework mismatch', () => {
      const config = {
        framework: 'cypress' as const
      };
      
      const result = validateFrameworkConfig('playwright', config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Framework mismatch: expected 'playwright', got 'cypress'");
    });
    
    it('should validate Cypress configuration', () => {
      const config = {
        framework: 'cypress' as const,
        diffThreshold: 0.15
      };
      
      const result = validateFrameworkConfig('cypress', config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    it('should handle unsupported framework', () => {
      const config = {};
      
      const result = validateFrameworkConfig('unsupported' as FrameworkType, config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unsupported framework: unsupported');
    });
    
    it('should validate without framework property', () => {
      const config = {
        diffThreshold: 0.2
      };
      
      const result = validateFrameworkConfig('playwright', config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });
  
  describe('mergeFrameworkConfig', () => {
    it('should merge Playwright configuration with defaults', () => {
      const config = {
        diffThreshold: 0.2,
        playwright: {
          timeout: 5000
        }
      };
      
      const result = mergeFrameworkConfig('playwright', config) as PlaywrightConfig;
      
      expect(result.framework).toBe('playwright');
      expect(result.diffThreshold).toBe(0.2);
      expect(result.playwright?.timeout).toBe(5000);
      expect(result.playwright?.disableAnimations).toBe(true); // default preserved
    });
    
    it('should merge Cypress configuration with defaults', () => {
      const config = {
        diffThreshold: 0.15,
        updateBaselines: true
      };
      
      const result = mergeFrameworkConfig('cypress', config);
      
      expect(result.framework).toBe('cypress');
      expect(result.diffThreshold).toBe(0.15);
      expect(result.updateBaselines).toBe(true);
      expect(result.baselineDir).toBe('.testivai/baseline'); // default preserved
    });
    
    it('should set framework property correctly', () => {
      const config = {
        framework: 'puppeteer' as const // This should be overridden
      };
      
      const result = mergeFrameworkConfig('playwright', config);
      
      expect(result.framework).toBe('playwright');
    });
    
    it('should throw error for unsupported framework', () => {
      expect(() => {
        mergeFrameworkConfig('unsupported' as FrameworkType, {});
      }).toThrow('Unsupported framework: unsupported');
    });
  });
  
  describe('loadFrameworkConfig', () => {
    it('should load and validate Playwright configuration', () => {
      const config = {
        diffThreshold: 0.2,
        playwright: {
          timeout: 5000,
          launchOptions: {
            headless: false
          }
        }
      };
      
      const result = loadFrameworkConfig('playwright', config) as PlaywrightConfig;
      
      expect(result.framework).toBe('playwright');
      expect(result.diffThreshold).toBe(0.2);
      expect(result.playwright?.timeout).toBe(5000);
      expect(result.playwright?.launchOptions?.headless).toBe(false);
    });
    
    it('should throw error for invalid configuration', () => {
      const config = {
        framework: 'cypress' as const // Mismatch
      };
      
      expect(() => {
        loadFrameworkConfig('playwright', config);
      }).toThrow("Invalid playwright configuration: Framework mismatch: expected 'playwright', got 'cypress'");
    });
    
    it('should load configuration for all supported frameworks', () => {
      const frameworks: FrameworkType[] = ['playwright', 'cypress', 'puppeteer', 'selenium'];
      
      frameworks.forEach(framework => {
        const config = { diffThreshold: 0.15 };
        const result = loadFrameworkConfig(framework, config);
        
        expect(result.framework).toBe(framework);
        expect(result.diffThreshold).toBe(0.15);
      });
    });
  });
  
  describe('getSupportedFrameworks', () => {
    it('should return all supported frameworks', () => {
      const frameworks = getSupportedFrameworks();
      
      expect(frameworks).toEqual(['playwright', 'cypress', 'puppeteer', 'selenium']);
      expect(frameworks).toHaveLength(4);
    });
    
    it('should return a new array each time', () => {
      const frameworks1 = getSupportedFrameworks();
      const frameworks2 = getSupportedFrameworks();
      
      expect(frameworks1).not.toBe(frameworks2);
      expect(frameworks1).toEqual(frameworks2);
    });
  });
  
  describe('isFrameworkSupported', () => {
    it('should return true for supported frameworks', () => {
      expect(isFrameworkSupported('playwright')).toBe(true);
      expect(isFrameworkSupported('cypress')).toBe(true);
      expect(isFrameworkSupported('puppeteer')).toBe(true);
      expect(isFrameworkSupported('selenium')).toBe(true);
    });
    
    it('should return false for unsupported frameworks', () => {
      expect(isFrameworkSupported('jest')).toBe(false);
      expect(isFrameworkSupported('mocha')).toBe(false);
      expect(isFrameworkSupported('unknown')).toBe(false);
      expect(isFrameworkSupported('')).toBe(false);
    });
    
    it('should handle case sensitivity', () => {
      expect(isFrameworkSupported('Playwright')).toBe(false);
      expect(isFrameworkSupported('CYPRESS')).toBe(false);
    });
  });
  
  describe('detectFramework', () => {
    it('should detect framework from explicit framework property', () => {
      const configs = [
        { framework: 'playwright' as const },
        { framework: 'cypress' as const },
        { framework: 'puppeteer' as const },
        { framework: 'selenium' as const }
      ];
      
      configs.forEach(config => {
        const detected = detectFramework(config);
        expect(detected).toBe(config.framework);
      });
    });
    
    it('should detect Playwright from playwright property', () => {
      const config = {
        playwright: {
          timeout: 5000
        }
      } as any;
      
      const detected = detectFramework(config);
      expect(detected).toBe('playwright');
    });
    
    it('should detect Cypress from cypress property', () => {
      const config = {
        cypress: {
          timeout: 5000
        }
      } as any;
      
      const detected = detectFramework(config);
      expect(detected).toBe('cypress');
    });
    
    it('should detect Puppeteer from puppeteer property', () => {
      const config = {
        puppeteer: {
          timeout: 5000
        }
      } as any;
      
      const detected = detectFramework(config);
      expect(detected).toBe('puppeteer');
    });
    
    it('should detect Selenium from selenium property', () => {
      const config = {
        selenium: {
          timeout: 5000
        }
      } as any;
      
      const detected = detectFramework(config);
      expect(detected).toBe('selenium');
    });
    
    it('should prioritize explicit framework over framework-specific properties', () => {
      const config = {
        framework: 'cypress' as const,
        playwright: {
          timeout: 5000
        }
      };
      
      const detected = detectFramework(config);
      expect(detected).toBe('cypress');
    });
    
    it('should return null when no framework is detectable', () => {
      const configs = [
        {},
        { diffThreshold: 0.1 },
        { baselineDir: './baseline' },
        { framework: 'unknown' as any }
      ];
      
      configs.forEach(config => {
        const detected = detectFramework(config);
        expect(detected).toBeNull();
      });
    });
    
    it('should handle multiple framework-specific properties', () => {
      const config = {
        playwright: { timeout: 5000 },
        cypress: { timeout: 3000 }
      } as any;
      
      // Should detect the first one found (playwright)
      const detected = detectFramework(config);
      expect(detected).toBe('playwright');
    });
  });
  
  describe('createFrameworkConfig', () => {
    it('should create Playwright config when detected', () => {
      const config = {
        playwright: {
          timeout: 5000
        },
        diffThreshold: 0.2
      };
      
      const result = createFrameworkConfig(config) as PlaywrightConfig;
      
      expect(result.framework).toBe('playwright');
      expect(result.diffThreshold).toBe(0.2);
      expect(result.playwright?.timeout).toBe(5000);
    });
    
    it('should use default framework when not detectable', () => {
      const config = {
        diffThreshold: 0.15
      };
      
      const result = createFrameworkConfig(config);
      
      expect(result.framework).toBe('playwright'); // default
      expect(result.diffThreshold).toBe(0.15);
    });
    
    it('should use custom default framework', () => {
      const config = {
        diffThreshold: 0.15
      };
      
      const result = createFrameworkConfig(config, 'cypress');
      
      expect(result.framework).toBe('cypress');
      expect(result.diffThreshold).toBe(0.15);
    });
    
    it('should handle explicit framework property', () => {
      const config = {
        framework: 'selenium' as const,
        diffThreshold: 0.25
      };
      
      const result = createFrameworkConfig(config, 'cypress');
      
      expect(result.framework).toBe('selenium'); // explicit wins over default
      expect(result.diffThreshold).toBe(0.25);
    });
    
    it('should throw error for invalid configuration', () => {
      const config = {
        framework: 'playwright' as const,
        playwright: {
          timeout: -1000 // Invalid
        }
      };
      
      expect(() => {
        createFrameworkConfig(config);
      }).toThrow('Invalid playwright configuration');
    });
  });
  
  describe('Integration tests', () => {
    it('should work with complete Playwright workflow', () => {
      const config = {
        diffThreshold: 0.2,
        playwright: {
          timeout: 10000,
          launchOptions: {
            headless: false,
            viewport: {
              width: 1920,
              height: 1080
            }
          },
          pageOptions: {
            fullPage: true,
            type: 'jpeg' as const,
            quality: 85
          }
        }
      };
      
      // Detect framework
      const framework = detectFramework(config);
      expect(framework).toBe('playwright');
      
      // Validate configuration
      const validation = validateFrameworkConfig('playwright', config);
      expect(validation.isValid).toBe(true);
      
      // Load configuration
      const result = loadFrameworkConfig('playwright', config) as PlaywrightConfig;
      expect(result.framework).toBe('playwright');
      expect(result.diffThreshold).toBe(0.2);
      expect(result.playwright?.timeout).toBe(10000);
      expect(result.playwright?.launchOptions?.headless).toBe(false);
      expect(result.playwright?.pageOptions?.fullPage).toBe(true);
    });
    
    it('should work with minimal configuration', () => {
      const config = {};
      
      const result = createFrameworkConfig(config, 'playwright') as PlaywrightConfig;
      
      expect(result.framework).toBe('playwright');
      expect(result.diffThreshold).toBe(0.1);
      expect(result.playwright?.timeout).toBe(30000);
      expect(result.playwright?.disableAnimations).toBe(true);
    });
    
    it('should work with all supported frameworks', () => {
      const frameworks = getSupportedFrameworks();
      
      frameworks.forEach(framework => {
        const config = { diffThreshold: 0.15 };
        
        expect(isFrameworkSupported(framework)).toBe(true);
        
        const defaultConfig = getFrameworkDefaultConfig(framework);
        expect(defaultConfig.framework).toBe(framework);
        
        const validation = validateFrameworkConfig(framework, config);
        expect(validation.isValid).toBe(true);
        
        const result = loadFrameworkConfig(framework, config);
        expect(result.framework).toBe(framework);
        expect(result.diffThreshold).toBe(0.15);
      });
    });
  });
});
