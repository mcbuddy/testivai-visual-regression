/**
 * Cypress plugin for TestivAI Visual Regression
 */

import * as fs from 'fs';
import * as path from 'path';
import { Plugin, ScreenshotOptions } from '../../core/interfaces';
import { CypressConfig } from '../../config/cypress';

/**
 * Type definition for Cypress
 */
interface Cypress {
  screenshot: (options?: CypressScreenshotOptions) => Promise<string>;
  get: (selector: string) => CypressChainable;
  wait: (timeOrAlias: number | string) => Promise<void>;
  url: () => string;
  viewport: (width: number, height: number) => void;
  config: (key: string) => any;
  Commands: {
    add: (name: string, fn: Function) => void;
  };
}

/**
 * Type definition for Cypress Chainable
 */
interface CypressChainable {
  screenshot: (options?: CypressScreenshotOptions) => Promise<string>;
  should: (assertion: string, ...args: any[]) => CypressChainable;
  wait: (timeOrAlias: number | string) => CypressChainable;
}

/**
 * Type definition for Cypress Screenshot Options
 */
interface CypressScreenshotOptions {
  capture?: 'viewport' | 'fullPage' | 'runner';
  disableTimersAndAnimations?: boolean;
  blackout?: string[];
  clip?: { x: number; y: number; width: number; height: number };
  padding?: number | [number, number] | [number, number, number, number];
  scale?: boolean;
  overwrite?: boolean;
  onBeforeScreenshot?: Function;
  onAfterScreenshot?: Function;
  log?: boolean;
  // Additional properties for internal use
  path?: string;
}

/**
 * Cypress plugin options
 */
interface CypressPluginOptions {
  /**
   * Cypress configuration
   */
  config?: CypressConfig;
}

/**
 * Create a Cypress plugin for TestivAI Visual Regression
 * @param options Plugin options
 * @returns Cypress plugin
 */
export const cypressPlugin = (options?: CypressPluginOptions): Plugin => {
  // Plugin configuration
  let config: CypressConfig | undefined = options?.config;
  
  // Ensure directory exists
  const ensureDirectoryExists = (filePath: string): void => {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
      return;
    }
    fs.mkdirSync(dirname, { recursive: true });
  };
  
  // Validate Cypress object
  const validateCypress = (cy: unknown): Cypress => {
    if (!cy) {
      throw new Error('Cypress instance is required');
    }
    
    const cypress = cy as Cypress;
    
    if (typeof cypress.screenshot !== 'function') {
      throw new Error('Invalid Cypress instance: missing screenshot method');
    }
    
    if (typeof cypress.get !== 'function') {
      throw new Error('Invalid Cypress instance: missing get method');
    }
    
    return cypress;
  };
  
  // Register custom commands
  const registerCommands = (cy: Cypress): void => {
    if (!config?.cypress?.commandOptions?.registerCommands) {
      return;
    }
    
    const commandName = config.cypress.commandOptions.commandName || 'visualRegression';
    
    // Check if command already exists
    try {
      if (typeof cy.Commands?.add === 'function') {
        cy.Commands.add(commandName, function(this: any, name: string, options?: ScreenshotOptions) {
          return captureScreenshot(name, cy, options);
        });
      }
    } catch (error) {
      console.warn(`Failed to register Cypress command '${commandName}':`, error);
    }
  };
  
  // Set viewport if configured
  const setViewport = (cy: Cypress): void => {
    if (!config?.cypress?.viewport?.autoSet) {
      return;
    }
    
    const width = config.cypress.viewport.width || 1280;
    const height = config.cypress.viewport.height || 720;
    
    try {
      if (typeof cy.viewport === 'function') {
        cy.viewport(width, height);
      }
    } catch (error) {
      console.warn('Failed to set viewport:', error);
    }
  };
  
  // Wait for animations to complete
  const waitForAnimations = async (cy: Cypress): Promise<void> => {
    if (!config?.cypress?.waitOptions?.waitForAnimations) {
      return;
    }
    
    try {
      // Use Cypress's built-in capability to disable animations
      if (typeof cy.config === 'function') {
        const animationsDisabled = cy.config('animationDistanceThreshold') === 0;
        if (!animationsDisabled) {
          // Wait a bit for any ongoing animations
          await cy.wait(500);
        }
      } else {
        // Fallback: just wait a bit
        await cy.wait(500);
      }
    } catch (error) {
      console.warn('Failed to wait for animations:', error);
    }
  };
  
  // Wait for page stability
  const waitForStability = async (cy: Cypress): Promise<void> => {
    if (!config?.cypress?.waitOptions?.waitForStability) {
      return;
    }
    
    const stabilizationTime = config.cypress.waitOptions.stabilizationTime || 0;
    if (stabilizationTime > 0) {
      try {
        await cy.wait(stabilizationTime);
      } catch (error) {
        console.warn('Failed to wait for stability:', error);
      }
    }
  };
  
  // Wait for selectors
  const waitForSelectors = async (cy: Cypress): Promise<void> => {
    const selectors = config?.cypress?.waitOptions?.waitForSelectors;
    if (!selectors || selectors.length === 0) {
      return;
    }
    
    const timeout = config?.cypress?.waitOptions?.timeout || 30000;
    
    try {
      for (const selector of selectors) {
        await cy.get(selector).should('exist').wait(100);
      }
    } catch (error) {
      console.warn(`Failed to wait for selector(s): ${selectors.join(', ')}`, error);
    }
  };
  
  // Perform pre-screenshot waits
  const performWaits = async (cy: Cypress): Promise<void> => {
    await waitForAnimations(cy);
    await waitForStability(cy);
    await waitForSelectors(cy);
  };
  
  // Convert TestivAI options to Cypress options
  const convertOptions = (options?: ScreenshotOptions): CypressScreenshotOptions => {
    // Start with default options from config
    const baseOptions = config?.cypress?.screenshotOptions || {};
    
    // Create new options object with correct types
    const cypressOptions: CypressScreenshotOptions = {
      capture: options?.fullPage ? 'fullPage' : (baseOptions.capture || 'viewport'),
      disableTimersAndAnimations: baseOptions.disableTimersAndAnimations,
      blackout: baseOptions.blackout,
      padding: baseOptions.padding,
      // Ensure scale is a boolean
      scale: typeof baseOptions.scale === 'boolean' ? baseOptions.scale : undefined,
      log: baseOptions.log || false,
      overwrite: baseOptions.overwrite || true
    };
    
    return cypressOptions;
  };
  
  // Capture element screenshot
  const captureElementScreenshot = async (
    name: string,
    cy: Cypress,
    selector: string,
    outputPath: string,
    options?: ScreenshotOptions
  ): Promise<string> => {
    try {
      const element = cy.get(selector);
      
      // Convert options
      const cypressOptions = convertOptions(options);
      
      // Take screenshot
      await element.screenshot({
        ...cypressOptions,
        path: outputPath
      });
      
      return outputPath;
    } catch (error: any) {
      throw new Error(`Failed to capture element screenshot: ${error?.message || 'Unknown error'}`);
    }
  };
  
  // Capture page screenshot
  const capturePageScreenshot = async (
    name: string,
    cy: Cypress,
    outputPath: string,
    options?: ScreenshotOptions
  ): Promise<string> => {
    try {
      // Convert options
      const cypressOptions = convertOptions(options);
      
      // Take screenshot
      await cy.screenshot({
        ...cypressOptions,
        path: outputPath
      });
      
      return outputPath;
    } catch (error: any) {
      throw new Error(`Failed to capture page screenshot: ${error?.message || 'Unknown error'}`);
    }
  };
  
  // Main screenshot capture function
  const captureScreenshot = async (
    name: string,
    cy: Cypress,
    options?: ScreenshotOptions
  ): Promise<string> => {
    // Validate Cypress instance
    validateCypress(cy);
    
    // Generate screenshot name if not provided
    if (!name) {
      const url = cy.url();
      try {
        const urlObj = new URL(url);
        name = `${urlObj.hostname}${urlObj.pathname.replace(/\//g, '_')}`;
      } catch (error) {
        name = `screenshot_${Date.now()}`;
      }
    }
    
    // Determine output path
    const baseDir = config?.baselineDir || '.testivai/baseline';
    const outputPath = path.join(baseDir, `${name}.png`);
    
    // Ensure directory exists
    ensureDirectoryExists(outputPath);
    
    // Set viewport if configured
    setViewport(cy);
    
    // Perform pre-screenshot waits
    await performWaits(cy);
    
    // Capture screenshot based on options
    if (options?.selector) {
      return captureElementScreenshot(name, cy, options.selector, outputPath, options);
    } else {
      return capturePageScreenshot(name, cy, outputPath, options);
    }
  };
  
  return {
    name: 'cypress-plugin',
    
    init(options?: Record<string, unknown>): void {
      // Initialize plugin with options
      if (options && options.config) {
        config = options.config as CypressConfig;
      }
    },
    
    async capture(name: string, cy: unknown, options?: ScreenshotOptions): Promise<string> {
      const cypress = validateCypress(cy);
      
      // Register custom commands if needed
      registerCommands(cypress);
      
      // Capture screenshot
      return captureScreenshot(name, cypress, options);
    }
  };
};
