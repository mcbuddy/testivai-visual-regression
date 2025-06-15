/**
 * Cypress-specific configuration for testivAI Visual Regression
 */

import { testivAIOptions } from '../../core/interfaces';

/**
 * Cypress-specific configuration options
 */
export interface CypressConfig extends testivAIOptions {
  /**
   * Cypress-specific screenshot options
   */
  cypress?: {
    /**
     * Timeout for screenshot operations in milliseconds
     * @default 30000
     */
    timeout?: number;
    
    /**
     * Screenshot options
     */
    screenshotOptions?: {
      /**
       * Whether to capture full page screenshot
       * @default false
       */
      capture?: 'viewport' | 'fullPage' | 'runner';
      
      /**
       * Whether to disable CSS animations
       * @default true
       */
      disableTimersAndAnimations?: boolean;
      
      /**
       * Whether to include test runner UI in screenshots
       * @default false
       */
      includeRunner?: boolean;
      
      /**
       * Scale factor for screenshots
       * @default 1
       */
      scale?: number;
      
      /**
       * Whether to clip the screenshot to the viewport
       * @default true
       */
      clip?: boolean;
      
      /**
       * Whether to hide scrollbars in screenshot
       * @default true
       */
      hideScrollbars?: boolean;
      
      /**
       * Whether to blackout specific selectors
       */
      blackout?: string[];
      
      /**
       * Padding around the element for element screenshots
       */
      padding?: number | [number, number] | [number, number, number, number];
      
      /**
       * Overwrite existing screenshot files
       * @default true
       */
      overwrite?: boolean;
      
      /**
       * Whether to log the screenshot path to the console
       * @default false
       */
      log?: boolean;
    };
    
    /**
     * Command options
     */
    commandOptions?: {
      /**
       * Custom command name for screenshot capture
       * @default 'visualRegression'
       */
      commandName?: string;
      
      /**
       * Whether to register custom commands automatically
       * @default true
       */
      registerCommands?: boolean;
      
      /**
       * Whether to preserve Cypress's native screenshot behavior
       * @default true
       */
      preserveNativeScreenshot?: boolean;
    };
    
    /**
     * Viewport configuration
     */
    viewport?: {
      /**
       * Viewport width in pixels
       * @default 1280
       */
      width?: number;
      
      /**
       * Viewport height in pixels
       * @default 720
       */
      height?: number;
      
      /**
       * Device pixel ratio
       * @default 1
       */
      devicePixelRatio?: number;
      
      /**
       * Whether to automatically set viewport
       * @default true
       */
      autoSet?: boolean;
    };
    
    /**
     * Wait options
     */
    waitOptions?: {
      /**
       * Default timeout for wait operations in milliseconds
       * @default 30000
       */
      timeout?: number;
      
      /**
       * Whether to wait for animations to complete before taking screenshot
       * @default true
       */
      waitForAnimations?: boolean;
      
      /**
       * Whether to wait for page to stabilize before taking screenshot
       * @default true
       */
      waitForStability?: boolean;
      
      /**
       * Custom selectors to wait for before taking screenshot
       */
      waitForSelectors?: string[];
      
      /**
       * Time to wait after page load before taking screenshot (ms)
       * @default 0
       */
      stabilizationTime?: number;
    };
  };
}

/**
 * Default Cypress configuration
 */
export function getCypressDefaultConfig(): CypressConfig {
  return {
    framework: 'cypress',
    baselineDir: '.testivai/baseline',
    compareDir: '.testivai/compare',
    reportDir: '.testivai/reports',
    diffThreshold: 0.1,
    updateBaselines: false,
    cypress: {
      timeout: 30000,
      screenshotOptions: {
        capture: 'viewport',
        disableTimersAndAnimations: true,
        includeRunner: false,
        scale: 1,
        clip: true,
        hideScrollbars: true,
        overwrite: true,
        log: false
      },
      commandOptions: {
        commandName: 'visualRegression',
        registerCommands: true,
        preserveNativeScreenshot: true
      },
      viewport: {
        width: 1280,
        height: 720,
        devicePixelRatio: 1,
        autoSet: true
      },
      waitOptions: {
        timeout: 30000,
        waitForAnimations: true,
        waitForStability: true,
        stabilizationTime: 0
      }
    }
  };
}

/**
 * Validate Cypress configuration
 * @param config Configuration to validate
 * @returns Validation result with errors if any
 */
export function validateCypressConfig(config: Partial<CypressConfig>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validate framework
  if (config.framework && config.framework !== 'cypress') {
    errors.push(`Framework must be 'cypress', got '${config.framework}'`);
  }
  
  // Validate diff threshold
  if (config.diffThreshold !== undefined) {
    if (typeof config.diffThreshold !== 'number' || config.diffThreshold < 0 || config.diffThreshold > 1) {
      errors.push('diffThreshold must be a number between 0 and 1');
    }
  }
  
  // Validate Cypress-specific options
  if (config.cypress) {
    const cy = config.cypress;
    
    // Validate timeout
    if (cy.timeout !== undefined) {
      if (typeof cy.timeout !== 'number' || cy.timeout < 0) {
        errors.push('cypress.timeout must be a positive number');
      }
    }
    
    // Validate screenshot options
    if (cy.screenshotOptions) {
      const screenshot = cy.screenshotOptions;
      
      if (screenshot.capture !== undefined) {
        const validCaptureModes = ['viewport', 'fullPage', 'runner'];
        if (!validCaptureModes.includes(screenshot.capture)) {
          errors.push(`cypress.screenshotOptions.capture must be one of: ${validCaptureModes.join(', ')}`);
        }
      }
      
      if (screenshot.disableTimersAndAnimations !== undefined && typeof screenshot.disableTimersAndAnimations !== 'boolean') {
        errors.push('cypress.screenshotOptions.disableTimersAndAnimations must be a boolean');
      }
      
      if (screenshot.includeRunner !== undefined && typeof screenshot.includeRunner !== 'boolean') {
        errors.push('cypress.screenshotOptions.includeRunner must be a boolean');
      }
      
      if (screenshot.scale !== undefined) {
        if (typeof screenshot.scale !== 'number' || screenshot.scale <= 0) {
          errors.push('cypress.screenshotOptions.scale must be a positive number');
        }
      }
      
      if (screenshot.clip !== undefined && typeof screenshot.clip !== 'boolean') {
        errors.push('cypress.screenshotOptions.clip must be a boolean');
      }
      
      if (screenshot.hideScrollbars !== undefined && typeof screenshot.hideScrollbars !== 'boolean') {
        errors.push('cypress.screenshotOptions.hideScrollbars must be a boolean');
      }
      
      if (screenshot.blackout !== undefined && !Array.isArray(screenshot.blackout)) {
        errors.push('cypress.screenshotOptions.blackout must be an array of strings');
      }
      
      if (screenshot.padding !== undefined) {
        if (Array.isArray(screenshot.padding)) {
          if (screenshot.padding.length !== 2 && screenshot.padding.length !== 4) {
            errors.push('cypress.screenshotOptions.padding must be a number or an array of 2 or 4 numbers');
          }
          
          for (const pad of screenshot.padding) {
            if (typeof pad !== 'number') {
              errors.push('cypress.screenshotOptions.padding array must contain only numbers');
              break;
            }
          }
        } else if (typeof screenshot.padding !== 'number') {
          errors.push('cypress.screenshotOptions.padding must be a number or an array of 2 or 4 numbers');
        }
      }
      
      if (screenshot.overwrite !== undefined && typeof screenshot.overwrite !== 'boolean') {
        errors.push('cypress.screenshotOptions.overwrite must be a boolean');
      }
      
      if (screenshot.log !== undefined && typeof screenshot.log !== 'boolean') {
        errors.push('cypress.screenshotOptions.log must be a boolean');
      }
    }
    
    // Validate command options
    if (cy.commandOptions) {
      const command = cy.commandOptions;
      
      if (command.commandName !== undefined && typeof command.commandName !== 'string') {
        errors.push('cypress.commandOptions.commandName must be a string');
      }
      
      if (command.registerCommands !== undefined && typeof command.registerCommands !== 'boolean') {
        errors.push('cypress.commandOptions.registerCommands must be a boolean');
      }
      
      if (command.preserveNativeScreenshot !== undefined && typeof command.preserveNativeScreenshot !== 'boolean') {
        errors.push('cypress.commandOptions.preserveNativeScreenshot must be a boolean');
      }
    }
    
    // Validate viewport options
    if (cy.viewport) {
      const viewport = cy.viewport;
      
      if (viewport.width !== undefined) {
        if (typeof viewport.width !== 'number' || viewport.width <= 0) {
          errors.push('cypress.viewport.width must be a positive number');
        }
      }
      
      if (viewport.height !== undefined) {
        if (typeof viewport.height !== 'number' || viewport.height <= 0) {
          errors.push('cypress.viewport.height must be a positive number');
        }
      }
      
      if (viewport.devicePixelRatio !== undefined) {
        if (typeof viewport.devicePixelRatio !== 'number' || viewport.devicePixelRatio <= 0) {
          errors.push('cypress.viewport.devicePixelRatio must be a positive number');
        }
      }
      
      if (viewport.autoSet !== undefined && typeof viewport.autoSet !== 'boolean') {
        errors.push('cypress.viewport.autoSet must be a boolean');
      }
    }
    
    // Validate wait options
    if (cy.waitOptions) {
      const wait = cy.waitOptions;
      
      if (wait.timeout !== undefined) {
        if (typeof wait.timeout !== 'number' || wait.timeout < 0) {
          errors.push('cypress.waitOptions.timeout must be a positive number');
        }
      }
      
      if (wait.waitForAnimations !== undefined && typeof wait.waitForAnimations !== 'boolean') {
        errors.push('cypress.waitOptions.waitForAnimations must be a boolean');
      }
      
      if (wait.waitForStability !== undefined && typeof wait.waitForStability !== 'boolean') {
        errors.push('cypress.waitOptions.waitForStability must be a boolean');
      }
      
      if (wait.waitForSelectors !== undefined && !Array.isArray(wait.waitForSelectors)) {
        errors.push('cypress.waitOptions.waitForSelectors must be an array of strings');
      }
      
      if (wait.stabilizationTime !== undefined) {
        if (typeof wait.stabilizationTime !== 'number' || wait.stabilizationTime < 0) {
          errors.push('cypress.waitOptions.stabilizationTime must be a non-negative number');
        }
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Merge Cypress configuration with defaults
 * @param config Partial configuration to merge
 * @returns Complete configuration with defaults applied
 */
export function mergeCypressConfig(config: Partial<CypressConfig>): CypressConfig {
  const defaultConfig = getCypressDefaultConfig();
  
  return {
    ...defaultConfig,
    ...config,
    cypress: {
      ...defaultConfig.cypress,
      ...config.cypress,
      screenshotOptions: {
        ...defaultConfig.cypress?.screenshotOptions,
        ...config.cypress?.screenshotOptions
      },
      commandOptions: {
        ...defaultConfig.cypress?.commandOptions,
        ...config.cypress?.commandOptions
      },
      viewport: {
        ...defaultConfig.cypress?.viewport,
        ...config.cypress?.viewport
      },
      waitOptions: {
        ...defaultConfig.cypress?.waitOptions,
        ...config.cypress?.waitOptions
      }
    }
  };
}
