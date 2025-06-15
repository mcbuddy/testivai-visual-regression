/**
 * Playwright-specific configuration for testivAI Visual Regression
 */

import { testivAIOptions } from '../../core/interfaces';

/**
 * Playwright-specific configuration options
 */
export interface PlaywrightConfig extends testivAIOptions {
  /**
   * Playwright-specific screenshot options
   */
  playwright?: {
    /**
     * Whether to disable animations during screenshot capture
     * @default true
     */
    disableAnimations?: boolean;
    
    /**
     * Whether to hide the text caret during screenshot capture
     * @default true
     */
    hideCaret?: boolean;
    
    /**
     * Timeout for screenshot operations in milliseconds
     * @default 30000
     */
    timeout?: number;
    
    /**
     * Whether to wait for fonts to load before taking screenshot
     * @default true
     */
    waitForFonts?: boolean;
    
    /**
     * Browser launch options
     */
    launchOptions?: {
      /**
       * Whether to run browser in headless mode
       * @default true
       */
      headless?: boolean;
      
      /**
       * Browser viewport size
       */
      viewport?: {
        width?: number;
        height?: number;
      };
      
      /**
       * Device scale factor
       * @default 1
       */
      deviceScaleFactor?: number;
    };
    
    /**
     * Page options for screenshot capture
     */
    pageOptions?: {
      /**
       * Whether to capture beyond the viewport
       * @default false
       */
      fullPage?: boolean;
      
      /**
       * Image quality (0-100) for JPEG screenshots
       * @default 90
       */
      quality?: number;
      
      /**
       * Screenshot format
       * @default 'png'
       */
      type?: 'png' | 'jpeg';
      
      /**
       * Clip area for screenshot
       */
      clip?: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    };
  };
}

/**
 * Default Playwright configuration
 */
export function getPlaywrightDefaultConfig(): PlaywrightConfig {
  return {
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
  };
}

/**
 * Validate Playwright configuration
 * @param config Configuration to validate
 * @returns Validation result with errors if any
 */
export function validatePlaywrightConfig(config: Partial<PlaywrightConfig>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validate framework
  if (config.framework && config.framework !== 'playwright') {
    errors.push(`Framework must be 'playwright', got '${config.framework}'`);
  }
  
  // Validate diff threshold
  if (config.diffThreshold !== undefined) {
    if (typeof config.diffThreshold !== 'number' || config.diffThreshold < 0 || config.diffThreshold > 1) {
      errors.push('diffThreshold must be a number between 0 and 1');
    }
  }
  
  // Validate Playwright-specific options
  if (config.playwright) {
    const pw = config.playwright;
    
    // Validate timeout
    if (pw.timeout !== undefined) {
      if (typeof pw.timeout !== 'number' || pw.timeout < 0) {
        errors.push('playwright.timeout must be a positive number');
      }
    }
    
    // Validate launch options
    if (pw.launchOptions) {
      const launch = pw.launchOptions;
      
      if (launch.viewport) {
        if (typeof launch.viewport.width !== 'number' || launch.viewport.width <= 0) {
          errors.push('playwright.launchOptions.viewport.width must be a positive number');
        }
        if (typeof launch.viewport.height !== 'number' || launch.viewport.height <= 0) {
          errors.push('playwright.launchOptions.viewport.height must be a positive number');
        }
      }
      
      if (launch.deviceScaleFactor !== undefined) {
        if (typeof launch.deviceScaleFactor !== 'number' || launch.deviceScaleFactor <= 0) {
          errors.push('playwright.launchOptions.deviceScaleFactor must be a positive number');
        }
      }
    }
    
    // Validate page options
    if (pw.pageOptions) {
      const page = pw.pageOptions;
      
      if (page.quality !== undefined) {
        if (typeof page.quality !== 'number' || page.quality < 0 || page.quality > 100) {
          errors.push('playwright.pageOptions.quality must be a number between 0 and 100');
        }
      }
      
      if (page.type !== undefined) {
        if (!['png', 'jpeg'].includes(page.type)) {
          errors.push("playwright.pageOptions.type must be 'png' or 'jpeg'");
        }
      }
      
      if (page.clip) {
        const clip = page.clip;
        if (typeof clip.x !== 'number' || clip.x < 0) {
          errors.push('playwright.pageOptions.clip.x must be a non-negative number');
        }
        if (typeof clip.y !== 'number' || clip.y < 0) {
          errors.push('playwright.pageOptions.clip.y must be a non-negative number');
        }
        if (typeof clip.width !== 'number' || clip.width <= 0) {
          errors.push('playwright.pageOptions.clip.width must be a positive number');
        }
        if (typeof clip.height !== 'number' || clip.height <= 0) {
          errors.push('playwright.pageOptions.clip.height must be a positive number');
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
 * Merge Playwright configuration with defaults
 * @param config Partial configuration to merge
 * @returns Complete configuration with defaults applied
 */
export function mergePlaywrightConfig(config: Partial<PlaywrightConfig>): PlaywrightConfig {
  const defaultConfig = getPlaywrightDefaultConfig();
  
  return {
    ...defaultConfig,
    ...config,
    playwright: {
      ...defaultConfig.playwright,
      ...config.playwright,
      launchOptions: {
        ...defaultConfig.playwright?.launchOptions,
        ...config.playwright?.launchOptions,
        viewport: {
          ...defaultConfig.playwright?.launchOptions?.viewport,
          ...config.playwright?.launchOptions?.viewport
        }
      },
      pageOptions: {
        ...defaultConfig.playwright?.pageOptions,
        ...config.playwright?.pageOptions
      }
    }
  };
}
