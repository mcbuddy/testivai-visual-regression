/**
 * Selenium-specific configuration for testivAI Visual Regression
 */

import { testivAIOptions } from '../../core/interfaces';

/**
 * Selenium-specific configuration options
 */
export interface SeleniumConfig extends testivAIOptions {
  /**
   * Selenium-specific screenshot options
   */
  selenium?: {
    /**
     * Browser name to use for testing (Chrome only for MVP)
     * @default 'chrome'
     */
    browserName?: 'chrome';
    
    /**
     * Browser version constraint
     */
    browserVersion?: string;
    
    /**
     * Platform name for testing
     */
    platformName?: string;
    
    /**
     * Timeout for screenshot operations in milliseconds
     * @default 30000
     */
    timeout?: number;
    
    /**
     * Whether to run browser in headless mode
     * @default true
     */
    headless?: boolean;
    
    /**
     * Browser window size
     */
    windowSize?: {
      width?: number;
      height?: number;
    };
    
    /**
     * WebDriver capabilities
     */
    capabilities?: {
      /**
       * Whether to accept insecure certificates
       * @default false
       */
      acceptInsecureCerts?: boolean;
      
      /**
       * Page load strategy
       * @default 'normal'
       */
      pageLoadStrategy?: 'none' | 'eager' | 'normal';
      
      /**
       * Unhandled prompt behavior
       * @default 'dismiss'
       */
      unhandledPromptBehavior?: 'dismiss' | 'accept' | 'dismiss and notify' | 'accept and notify' | 'ignore';
      
      /**
       * Strict file interactability
       * @default false
       */
      strictFileInteractability?: boolean;
      
      /**
       * Custom capabilities
       */
      [key: string]: any;
    };
    
    /**
     * Screenshot options
     */
    screenshotOptions?: {
      /**
       * Whether to capture full page screenshot
       * @default false
       */
      fullPage?: boolean;
      
      /**
       * Image format for screenshots
       * @default 'png'
       */
      format?: 'png' | 'jpeg';
      
      /**
       * JPEG quality (0-100) when format is 'jpeg'
       * @default 90
       */
      quality?: number;
      
      /**
       * Whether to hide scrollbars in screenshot
       * @default true
       */
      hideScrollbars?: boolean;
      
      /**
       * Element selector to screenshot (if not full page)
       */
      element?: string;
    };
    
    /**
     * WebDriver server configuration
     */
    server?: {
      /**
       * WebDriver server URL
       * @default 'http://localhost:4444'
       */
      url?: string;
      
      /**
       * Connection timeout in milliseconds
       * @default 30000
       */
      connectionTimeout?: number;
      
      /**
       * Request timeout in milliseconds
       * @default 60000
       */
      requestTimeout?: number;
      
      /**
       * Whether to use local WebDriver
       * @default true
       */
      local?: boolean;
    };
    
    /**
     * Wait strategies
     */
    waits?: {
      /**
       * Implicit wait timeout in milliseconds
       * @default 10000
       */
      implicit?: number;
      
      /**
       * Page load timeout in milliseconds
       * @default 30000
       */
      pageLoad?: number;
      
      /**
       * Script timeout in milliseconds
       * @default 30000
       */
      script?: number;
    };
  };
}

/**
 * Default Selenium configuration
 */
export function getSeleniumDefaultConfig(): SeleniumConfig {
  return {
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
  };
}

/**
 * Validate Selenium configuration
 * @param config Configuration to validate
 * @returns Validation result with errors if any
 */
export function validateSeleniumConfig(config: Partial<SeleniumConfig>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validate framework
  if (config.framework && config.framework !== 'selenium') {
    errors.push(`Framework must be 'selenium', got '${config.framework}'`);
  }
  
  // Validate diff threshold
  if (config.diffThreshold !== undefined) {
    if (typeof config.diffThreshold !== 'number' || config.diffThreshold < 0 || config.diffThreshold > 1) {
      errors.push('diffThreshold must be a number between 0 and 1');
    }
  }
  
  // Validate Selenium-specific options
  if (config.selenium) {
    const sel = config.selenium;
    
    // Validate browser name (Chrome only for MVP)
    if (sel.browserName !== undefined) {
      if (sel.browserName !== 'chrome') {
        errors.push(`selenium.browserName must be 'chrome' (MVP limitation)`);
      }
    }
    
    // Validate timeout
    if (sel.timeout !== undefined) {
      if (typeof sel.timeout !== 'number' || sel.timeout < 0) {
        errors.push('selenium.timeout must be a positive number');
      }
    }
    
    // Validate headless
    if (sel.headless !== undefined) {
      if (typeof sel.headless !== 'boolean') {
        errors.push('selenium.headless must be a boolean');
      }
    }
    
    // Validate window size
    if (sel.windowSize) {
      if (typeof sel.windowSize.width !== 'number' || sel.windowSize.width <= 0) {
        errors.push('selenium.windowSize.width must be a positive number');
      }
      if (typeof sel.windowSize.height !== 'number' || sel.windowSize.height <= 0) {
        errors.push('selenium.windowSize.height must be a positive number');
      }
    }
    
    // Validate capabilities
    if (sel.capabilities) {
      const caps = sel.capabilities;
      
      if (caps.acceptInsecureCerts !== undefined && typeof caps.acceptInsecureCerts !== 'boolean') {
        errors.push('selenium.capabilities.acceptInsecureCerts must be a boolean');
      }
      
      if (caps.pageLoadStrategy !== undefined) {
        const validStrategies = ['none', 'eager', 'normal'];
        if (!validStrategies.includes(caps.pageLoadStrategy)) {
          errors.push(`selenium.capabilities.pageLoadStrategy must be one of: ${validStrategies.join(', ')}`);
        }
      }
      
      if (caps.unhandledPromptBehavior !== undefined) {
        const validBehaviors = ['dismiss', 'accept', 'dismiss and notify', 'accept and notify', 'ignore'];
        if (!validBehaviors.includes(caps.unhandledPromptBehavior)) {
          errors.push(`selenium.capabilities.unhandledPromptBehavior must be one of: ${validBehaviors.join(', ')}`);
        }
      }
      
      if (caps.strictFileInteractability !== undefined && typeof caps.strictFileInteractability !== 'boolean') {
        errors.push('selenium.capabilities.strictFileInteractability must be a boolean');
      }
    }
    
    // Validate screenshot options
    if (sel.screenshotOptions) {
      const screenshot = sel.screenshotOptions;
      
      if (screenshot.fullPage !== undefined && typeof screenshot.fullPage !== 'boolean') {
        errors.push('selenium.screenshotOptions.fullPage must be a boolean');
      }
      
      if (screenshot.format !== undefined) {
        const validFormats = ['png', 'jpeg'];
        if (!validFormats.includes(screenshot.format)) {
          errors.push(`selenium.screenshotOptions.format must be one of: ${validFormats.join(', ')}`);
        }
      }
      
      if (screenshot.quality !== undefined) {
        if (typeof screenshot.quality !== 'number' || screenshot.quality < 0 || screenshot.quality > 100) {
          errors.push('selenium.screenshotOptions.quality must be a number between 0 and 100');
        }
      }
      
      if (screenshot.hideScrollbars !== undefined && typeof screenshot.hideScrollbars !== 'boolean') {
        errors.push('selenium.screenshotOptions.hideScrollbars must be a boolean');
      }
      
      if (screenshot.element !== undefined && typeof screenshot.element !== 'string') {
        errors.push('selenium.screenshotOptions.element must be a string');
      }
    }
    
    // Validate server options
    if (sel.server) {
      const server = sel.server;
      
      if (server.url !== undefined && typeof server.url !== 'string') {
        errors.push('selenium.server.url must be a string');
      }
      
      if (server.connectionTimeout !== undefined) {
        if (typeof server.connectionTimeout !== 'number' || server.connectionTimeout < 0) {
          errors.push('selenium.server.connectionTimeout must be a positive number');
        }
      }
      
      if (server.requestTimeout !== undefined) {
        if (typeof server.requestTimeout !== 'number' || server.requestTimeout < 0) {
          errors.push('selenium.server.requestTimeout must be a positive number');
        }
      }
      
      if (server.local !== undefined && typeof server.local !== 'boolean') {
        errors.push('selenium.server.local must be a boolean');
      }
    }
    
    // Validate wait options
    if (sel.waits) {
      const waits = sel.waits;
      
      if (waits.implicit !== undefined) {
        if (typeof waits.implicit !== 'number' || waits.implicit < 0) {
          errors.push('selenium.waits.implicit must be a positive number');
        }
      }
      
      if (waits.pageLoad !== undefined) {
        if (typeof waits.pageLoad !== 'number' || waits.pageLoad < 0) {
          errors.push('selenium.waits.pageLoad must be a positive number');
        }
      }
      
      if (waits.script !== undefined) {
        if (typeof waits.script !== 'number' || waits.script < 0) {
          errors.push('selenium.waits.script must be a positive number');
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
 * Merge Selenium configuration with defaults
 * @param config Partial configuration to merge
 * @returns Complete configuration with defaults applied
 */
export function mergeSeleniumConfig(config: Partial<SeleniumConfig>): SeleniumConfig {
  const defaultConfig = getSeleniumDefaultConfig();
  
  return {
    ...defaultConfig,
    ...config,
    selenium: {
      ...defaultConfig.selenium,
      ...config.selenium,
      capabilities: {
        ...defaultConfig.selenium?.capabilities,
        ...config.selenium?.capabilities
      },
      screenshotOptions: {
        ...defaultConfig.selenium?.screenshotOptions,
        ...config.selenium?.screenshotOptions
      },
      server: {
        ...defaultConfig.selenium?.server,
        ...config.selenium?.server
      },
      waits: {
        ...defaultConfig.selenium?.waits,
        ...config.selenium?.waits
      },
      windowSize: {
        ...defaultConfig.selenium?.windowSize,
        ...config.selenium?.windowSize
      }
    }
  };
}
