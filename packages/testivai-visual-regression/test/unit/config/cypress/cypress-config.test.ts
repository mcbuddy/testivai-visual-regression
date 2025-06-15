/**
 * Tests for Cypress configuration
 */

import {
  CypressConfig,
  getCypressDefaultConfig,
  validateCypressConfig,
  mergeCypressConfig
} from '../../../../src/config/cypress';

describe('Cypress Configuration', () => {
  describe('getCypressDefaultConfig', () => {
    it('should return default configuration', () => {
      const config = getCypressDefaultConfig();
      
      expect(config).toBeDefined();
      expect(config.framework).toBe('cypress');
      expect(config.baselineDir).toBe('.testivai/baseline');
      expect(config.compareDir).toBe('.testivai/compare');
      expect(config.reportDir).toBe('.testivai/reports');
      expect(config.diffThreshold).toBe(0.1);
      expect(config.updateBaselines).toBe(false);
      
      // Check Cypress-specific defaults
      expect(config.cypress).toBeDefined();
      expect(config.cypress?.timeout).toBe(30000);
      
      // Check screenshot options
      expect(config.cypress?.screenshotOptions).toBeDefined();
      expect(config.cypress?.screenshotOptions?.capture).toBe('viewport');
      expect(config.cypress?.screenshotOptions?.disableTimersAndAnimations).toBe(true);
      
      // Check command options
      expect(config.cypress?.commandOptions).toBeDefined();
      expect(config.cypress?.commandOptions?.commandName).toBe('visualRegression');
      expect(config.cypress?.commandOptions?.registerCommands).toBe(true);
      
      // Check viewport options
      expect(config.cypress?.viewport).toBeDefined();
      expect(config.cypress?.viewport?.width).toBe(1280);
      expect(config.cypress?.viewport?.height).toBe(720);
      
      // Check wait options
      expect(config.cypress?.waitOptions).toBeDefined();
      expect(config.cypress?.waitOptions?.waitForAnimations).toBe(true);
      expect(config.cypress?.waitOptions?.waitForStability).toBe(true);
    });
  });
  
  describe('validateCypressConfig', () => {
    it('should validate valid configuration', () => {
      const config: Partial<CypressConfig> = {
        framework: 'cypress',
        baselineDir: 'custom/baseline',
        diffThreshold: 0.2,
        cypress: {
          timeout: 60000,
          screenshotOptions: {
            capture: 'fullPage',
            disableTimersAndAnimations: false
          },
          commandOptions: {
            commandName: 'customCommand',
            registerCommands: true
          }
        }
      };
      
      const result = validateCypressConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should reject invalid framework', () => {
      const config: Partial<CypressConfig> = {
        framework: 'playwright' as any,
        baselineDir: 'custom/baseline'
      };
      
      const result = validateCypressConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Framework must be 'cypress', got 'playwright'");
    });
    
    it('should reject invalid diffThreshold', () => {
      const config: Partial<CypressConfig> = {
        framework: 'cypress',
        diffThreshold: 1.5
      };
      
      const result = validateCypressConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('diffThreshold must be a number between 0 and 1');
    });
    
    it('should reject invalid timeout', () => {
      const config: Partial<CypressConfig> = {
        framework: 'cypress',
        cypress: {
          timeout: -1000
        }
      };
      
      const result = validateCypressConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('cypress.timeout must be a positive number');
    });
    
    it('should reject invalid capture mode', () => {
      const config: Partial<CypressConfig> = {
        framework: 'cypress',
        cypress: {
          screenshotOptions: {
            capture: 'invalid' as any
          }
        }
      };
      
      const result = validateCypressConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("cypress.screenshotOptions.capture must be one of: viewport, fullPage, runner");
    });
    
    it('should reject invalid command options', () => {
      const config: Partial<CypressConfig> = {
        framework: 'cypress',
        cypress: {
          commandOptions: {
            commandName: 123 as any,
            registerCommands: 'yes' as any
          }
        }
      };
      
      const result = validateCypressConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('cypress.commandOptions.commandName must be a string');
      expect(result.errors).toContain('cypress.commandOptions.registerCommands must be a boolean');
    });
    
    it('should reject invalid viewport dimensions', () => {
      const config: Partial<CypressConfig> = {
        framework: 'cypress',
        cypress: {
          viewport: {
            width: -800,
            height: 0
          }
        }
      };
      
      const result = validateCypressConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('cypress.viewport.width must be a positive number');
      expect(result.errors).toContain('cypress.viewport.height must be a positive number');
    });
    
    it('should reject invalid wait options', () => {
      const config: Partial<CypressConfig> = {
        framework: 'cypress',
        cypress: {
          waitOptions: {
            waitForAnimations: 'true' as any,
            waitForStability: 1 as any,
            stabilizationTime: -100
          }
        }
      };
      
      const result = validateCypressConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('cypress.waitOptions.waitForAnimations must be a boolean');
      expect(result.errors).toContain('cypress.waitOptions.waitForStability must be a boolean');
      expect(result.errors).toContain('cypress.waitOptions.stabilizationTime must be a non-negative number');
    });
    
    it('should validate padding options correctly', () => {
      // Valid padding as number
      let config: Partial<CypressConfig> = {
        framework: 'cypress',
        cypress: {
          screenshotOptions: {
            padding: 10
          }
        }
      };
      
      let result = validateCypressConfig(config);
      expect(result.isValid).toBe(true);
      
      // Valid padding as [number, number]
      config = {
        framework: 'cypress',
        cypress: {
          screenshotOptions: {
            padding: [10, 20]
          }
        }
      };
      
      result = validateCypressConfig(config);
      expect(result.isValid).toBe(true);
      
      // Valid padding as [number, number, number, number]
      config = {
        framework: 'cypress',
        cypress: {
          screenshotOptions: {
            padding: [10, 20, 30, 40]
          }
        }
      };
      
      result = validateCypressConfig(config);
      expect(result.isValid).toBe(true);
      
      // Invalid padding as array with wrong length
      config = {
        framework: 'cypress',
        cypress: {
          screenshotOptions: {
            padding: [10, 20, 30] as any
          }
        }
      };
      
      result = validateCypressConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('cypress.screenshotOptions.padding must be a number or an array of 2 or 4 numbers');
      
      // Invalid padding with non-number values
      config = {
        framework: 'cypress',
        cypress: {
          screenshotOptions: {
            padding: [10, '20'] as any
          }
        }
      };
      
      result = validateCypressConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('cypress.screenshotOptions.padding array must contain only numbers');
    });
  });
  
  describe('mergeCypressConfig', () => {
    it('should merge with defaults', () => {
      const customConfig: Partial<CypressConfig> = {
        baselineDir: 'custom/baseline',
        diffThreshold: 0.2,
        cypress: {
          timeout: 60000,
          screenshotOptions: {
            capture: 'fullPage',
            disableTimersAndAnimations: false
          }
        }
      };
      
      const merged = mergeCypressConfig(customConfig);
      
      // Check merged values
      expect(merged.baselineDir).toBe('custom/baseline');
      expect(merged.diffThreshold).toBe(0.2);
      expect(merged.cypress?.timeout).toBe(60000);
      expect(merged.cypress?.screenshotOptions?.capture).toBe('fullPage');
      expect(merged.cypress?.screenshotOptions?.disableTimersAndAnimations).toBe(false);
      
      // Check default values are preserved
      expect(merged.framework).toBe('cypress');
      expect(merged.compareDir).toBe('.testivai/compare');
      expect(merged.reportDir).toBe('.testivai/reports');
      expect(merged.cypress?.commandOptions?.commandName).toBe('visualRegression');
      expect(merged.cypress?.viewport?.width).toBe(1280);
    });
    
    it('should deeply merge nested objects', () => {
      const customConfig: Partial<CypressConfig> = {
        cypress: {
          viewport: {
            width: 1920
          },
          waitOptions: {
            stabilizationTime: 1000
          }
        }
      };
      
      const merged = mergeCypressConfig(customConfig);
      
      // Check merged values
      expect(merged.cypress?.viewport?.width).toBe(1920);
      expect(merged.cypress?.waitOptions?.stabilizationTime).toBe(1000);
      
      // Check default values are preserved
      expect(merged.cypress?.viewport?.height).toBe(720);
      expect(merged.cypress?.waitOptions?.waitForAnimations).toBe(true);
    });
    
    it('should handle empty config', () => {
      const merged = mergeCypressConfig({});
      
      // Should be same as default config
      const defaultConfig = getCypressDefaultConfig();
      expect(merged).toEqual(defaultConfig);
    });
    
    it('should handle null or undefined values', () => {
      const customConfig: Partial<CypressConfig> = {
        cypress: {
          commandOptions: null as any,
          viewport: undefined
        }
      };
      
      const merged = mergeCypressConfig(customConfig);
      
      // Default values should be used
      expect(merged.cypress?.commandOptions).toBeDefined();
      expect(merged.cypress?.viewport).toBeDefined();
    });
  });
});
