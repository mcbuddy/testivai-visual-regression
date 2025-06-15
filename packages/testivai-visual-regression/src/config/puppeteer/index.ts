/**
 * Puppeteer-specific configuration for testivAI Visual Regression
 */

import { testivAIOptions } from '../../core/interfaces';

/**
 * Puppeteer-specific configuration options
 */
export interface PuppeteerConfig extends testivAIOptions {
  /**
   * Puppeteer-specific screenshot options
   */
  puppeteer?: {
    /**
     * Timeout for screenshot operations in milliseconds
     * @default 30000
     */
    timeout?: number;
    
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
       * Browser to use
       * @default 'chrome'
       */
      product?: 'chrome' | 'firefox';
      
      /**
       * Whether to ignore HTTPS errors
       * @default false
       */
      ignoreHTTPSErrors?: boolean;
      
      /**
       * Slow down operations by the specified amount of milliseconds
       * @default 0
       */
      slowMo?: number;
      
      /**
       * Path to a browser executable to use instead of the bundled Chromium
       */
      executablePath?: string;
      
      /**
       * Additional arguments to pass to the browser instance
       */
      args?: string[];
      
      /**
       * Close the browser process on Ctrl+C
       * @default true
       */
      handleSIGINT?: boolean;
      
      /**
       * Maximum time in milliseconds to wait for the browser to start
       * @default 30000
       */
      timeout?: number;
      
      /**
       * Whether to pipe browser process stdout and stderr
       * @default false
       */
      dumpio?: boolean;
    };
    
    /**
     * Default viewport settings
     */
    defaultViewport?: {
      /**
       * Width of the viewport in pixels
       * @default 1280
       */
      width?: number;
      
      /**
       * Height of the viewport in pixels
       * @default 720
       */
      height?: number;
      
      /**
       * Device scale factor
       * @default 1
       */
      deviceScaleFactor?: number;
      
      /**
       * Whether the viewport is in landscape mode
       * @default false
       */
      isLandscape?: boolean;
      
      /**
       * Whether the viewport supports touch events
       * @default false
       */
      hasTouch?: boolean;
      
      /**
       * Whether the viewport is in mobile mode
       * @default false
       */
      isMobile?: boolean;
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
      type?: 'png' | 'jpeg';
      
      /**
       * JPEG quality (0-100) when type is 'jpeg'
       * @default 90
       */
      quality?: number;
      
      /**
       * Whether to capture screenshot with transparency
       * @default true
       */
      omitBackground?: boolean;
      
      /**
       * Clip area for screenshot
       */
      clip?: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      
      /**
       * Path to save the screenshot to
       */
      path?: string;
      
      /**
       * Encoding of the screenshot
       * @default 'binary'
       */
      encoding?: 'base64' | 'binary';
    };
    
    /**
     * Page navigation options
     */
    navigationOptions?: {
      /**
       * Maximum navigation time in milliseconds
       * @default 30000
       */
      timeout?: number;
      
      /**
       * When to consider navigation succeeded
       * @default 'load'
       */
      waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
      
      /**
       * Referer header value
       */
      referer?: string;
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
       * Whether to wait for network to be idle before taking screenshot
       * @default true
       */
      waitForNetworkIdle?: boolean;
      
      /**
       * Custom selectors to wait for before taking screenshot
       */
      waitForSelectors?: string[];
    };
  };
}

/**
 * Default Puppeteer configuration
 */
export function getPuppeteerDefaultConfig(): PuppeteerConfig {
  return {
    framework: 'puppeteer',
    baselineDir: '.testivai/baseline',
    compareDir: '.testivai/compare',
    reportDir: '.testivai/reports',
    diffThreshold: 0.1,
    updateBaselines: false,
    puppeteer: {
      timeout: 30000,
      launchOptions: {
        headless: true,
        product: 'chrome',
        ignoreHTTPSErrors: false,
        slowMo: 0,
        handleSIGINT: true,
        timeout: 30000,
        dumpio: false
      },
      defaultViewport: {
        width: 1280,
        height: 720,
        deviceScaleFactor: 1,
        isLandscape: false,
        hasTouch: false,
        isMobile: false
      },
      screenshotOptions: {
        fullPage: false,
        type: 'png',
        quality: 90,
        omitBackground: true,
        encoding: 'binary'
      },
      navigationOptions: {
        timeout: 30000,
        waitUntil: 'load'
      },
      waitOptions: {
        timeout: 30000,
        waitForAnimations: true,
        waitForNetworkIdle: true
      }
    }
  };
}

/**
 * Validate Puppeteer configuration
 * @param config Configuration to validate
 * @returns Validation result with errors if any
 */
export function validatePuppeteerConfig(config: Partial<PuppeteerConfig>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validate framework
  if (config.framework && config.framework !== 'puppeteer') {
    errors.push(`Framework must be 'puppeteer', got '${config.framework}'`);
  }
  
  // Validate diff threshold
  if (config.diffThreshold !== undefined) {
    if (typeof config.diffThreshold !== 'number' || config.diffThreshold < 0 || config.diffThreshold > 1) {
      errors.push('diffThreshold must be a number between 0 and 1');
    }
  }
  
  // Validate Puppeteer-specific options
  if (config.puppeteer) {
    const pup = config.puppeteer;
    
    // Validate timeout
    if (pup.timeout !== undefined) {
      if (typeof pup.timeout !== 'number' || pup.timeout < 0) {
        errors.push('puppeteer.timeout must be a positive number');
      }
    }
    
    // Validate launch options
    if (pup.launchOptions) {
      const launch = pup.launchOptions;
      
      if (launch.headless !== undefined && typeof launch.headless !== 'boolean') {
        errors.push('puppeteer.launchOptions.headless must be a boolean');
      }
      
      if (launch.product !== undefined) {
        const validProducts = ['chrome', 'firefox'];
        if (!validProducts.includes(launch.product)) {
          errors.push(`puppeteer.launchOptions.product must be one of: ${validProducts.join(', ')}`);
        }
      }
      
      if (launch.ignoreHTTPSErrors !== undefined && typeof launch.ignoreHTTPSErrors !== 'boolean') {
        errors.push('puppeteer.launchOptions.ignoreHTTPSErrors must be a boolean');
      }
      
      if (launch.slowMo !== undefined) {
        if (typeof launch.slowMo !== 'number' || launch.slowMo < 0) {
          errors.push('puppeteer.launchOptions.slowMo must be a non-negative number');
        }
      }
      
      if (launch.executablePath !== undefined && typeof launch.executablePath !== 'string') {
        errors.push('puppeteer.launchOptions.executablePath must be a string');
      }
      
      if (launch.args !== undefined && !Array.isArray(launch.args)) {
        errors.push('puppeteer.launchOptions.args must be an array of strings');
      }
      
      if (launch.handleSIGINT !== undefined && typeof launch.handleSIGINT !== 'boolean') {
        errors.push('puppeteer.launchOptions.handleSIGINT must be a boolean');
      }
      
      if (launch.timeout !== undefined) {
        if (typeof launch.timeout !== 'number' || launch.timeout < 0) {
          errors.push('puppeteer.launchOptions.timeout must be a positive number');
        }
      }
      
      if (launch.dumpio !== undefined && typeof launch.dumpio !== 'boolean') {
        errors.push('puppeteer.launchOptions.dumpio must be a boolean');
      }
    }
    
    // Validate default viewport
    if (pup.defaultViewport) {
      const viewport = pup.defaultViewport;
      
      if (viewport.width !== undefined) {
        if (typeof viewport.width !== 'number' || viewport.width <= 0) {
          errors.push('puppeteer.defaultViewport.width must be a positive number');
        }
      }
      
      if (viewport.height !== undefined) {
        if (typeof viewport.height !== 'number' || viewport.height <= 0) {
          errors.push('puppeteer.defaultViewport.height must be a positive number');
        }
      }
      
      if (viewport.deviceScaleFactor !== undefined) {
        if (typeof viewport.deviceScaleFactor !== 'number' || viewport.deviceScaleFactor <= 0) {
          errors.push('puppeteer.defaultViewport.deviceScaleFactor must be a positive number');
        }
      }
      
      if (viewport.isLandscape !== undefined && typeof viewport.isLandscape !== 'boolean') {
        errors.push('puppeteer.defaultViewport.isLandscape must be a boolean');
      }
      
      if (viewport.hasTouch !== undefined && typeof viewport.hasTouch !== 'boolean') {
        errors.push('puppeteer.defaultViewport.hasTouch must be a boolean');
      }
      
      if (viewport.isMobile !== undefined && typeof viewport.isMobile !== 'boolean') {
        errors.push('puppeteer.defaultViewport.isMobile must be a boolean');
      }
    }
    
    // Validate screenshot options
    if (pup.screenshotOptions) {
      const screenshot = pup.screenshotOptions;
      
      if (screenshot.fullPage !== undefined && typeof screenshot.fullPage !== 'boolean') {
        errors.push('puppeteer.screenshotOptions.fullPage must be a boolean');
      }
      
      if (screenshot.type !== undefined) {
        const validTypes = ['png', 'jpeg'];
        if (!validTypes.includes(screenshot.type)) {
          errors.push(`puppeteer.screenshotOptions.type must be one of: ${validTypes.join(', ')}`);
        }
      }
      
      if (screenshot.quality !== undefined) {
        if (typeof screenshot.quality !== 'number' || screenshot.quality < 0 || screenshot.quality > 100) {
          errors.push('puppeteer.screenshotOptions.quality must be a number between 0 and 100');
        }
      }
      
      if (screenshot.omitBackground !== undefined && typeof screenshot.omitBackground !== 'boolean') {
        errors.push('puppeteer.screenshotOptions.omitBackground must be a boolean');
      }
      
      if (screenshot.clip) {
        const clip = screenshot.clip;
        if (typeof clip.x !== 'number' || clip.x < 0) {
          errors.push('puppeteer.screenshotOptions.clip.x must be a non-negative number');
        }
        if (typeof clip.y !== 'number' || clip.y < 0) {
          errors.push('puppeteer.screenshotOptions.clip.y must be a non-negative number');
        }
        if (typeof clip.width !== 'number' || clip.width <= 0) {
          errors.push('puppeteer.screenshotOptions.clip.width must be a positive number');
        }
        if (typeof clip.height !== 'number' || clip.height <= 0) {
          errors.push('puppeteer.screenshotOptions.clip.height must be a positive number');
        }
      }
      
      if (screenshot.path !== undefined && typeof screenshot.path !== 'string') {
        errors.push('puppeteer.screenshotOptions.path must be a string');
      }
      
      if (screenshot.encoding !== undefined) {
        const validEncodings = ['base64', 'binary'];
        if (!validEncodings.includes(screenshot.encoding)) {
          errors.push(`puppeteer.screenshotOptions.encoding must be one of: ${validEncodings.join(', ')}`);
        }
      }
    }
    
    // Validate navigation options
    if (pup.navigationOptions) {
      const navigation = pup.navigationOptions;
      
      if (navigation.timeout !== undefined) {
        if (typeof navigation.timeout !== 'number' || navigation.timeout < 0) {
          errors.push('puppeteer.navigationOptions.timeout must be a positive number');
        }
      }
      
      if (navigation.waitUntil !== undefined) {
        const validWaitUntil = ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'];
        if (!validWaitUntil.includes(navigation.waitUntil)) {
          errors.push(`puppeteer.navigationOptions.waitUntil must be one of: ${validWaitUntil.join(', ')}`);
        }
      }
      
      if (navigation.referer !== undefined && typeof navigation.referer !== 'string') {
        errors.push('puppeteer.navigationOptions.referer must be a string');
      }
    }
    
    // Validate wait options
    if (pup.waitOptions) {
      const wait = pup.waitOptions;
      
      if (wait.timeout !== undefined) {
        if (typeof wait.timeout !== 'number' || wait.timeout < 0) {
          errors.push('puppeteer.waitOptions.timeout must be a positive number');
        }
      }
      
      if (wait.waitForAnimations !== undefined && typeof wait.waitForAnimations !== 'boolean') {
        errors.push('puppeteer.waitOptions.waitForAnimations must be a boolean');
      }
      
      if (wait.waitForNetworkIdle !== undefined && typeof wait.waitForNetworkIdle !== 'boolean') {
        errors.push('puppeteer.waitOptions.waitForNetworkIdle must be a boolean');
      }
      
      if (wait.waitForSelectors !== undefined && !Array.isArray(wait.waitForSelectors)) {
        errors.push('puppeteer.waitOptions.waitForSelectors must be an array of strings');
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Merge Puppeteer configuration with defaults
 * @param config Partial configuration to merge
 * @returns Complete configuration with defaults applied
 */
export function mergePuppeteerConfig(config: Partial<PuppeteerConfig>): PuppeteerConfig {
  const defaultConfig = getPuppeteerDefaultConfig();
  
  return {
    ...defaultConfig,
    ...config,
    puppeteer: {
      ...defaultConfig.puppeteer,
      ...config.puppeteer,
      launchOptions: {
        ...defaultConfig.puppeteer?.launchOptions,
        ...config.puppeteer?.launchOptions
      },
      defaultViewport: {
        ...defaultConfig.puppeteer?.defaultViewport,
        ...config.puppeteer?.defaultViewport
      },
      screenshotOptions: {
        ...defaultConfig.puppeteer?.screenshotOptions,
        ...config.puppeteer?.screenshotOptions
      },
      navigationOptions: {
        ...defaultConfig.puppeteer?.navigationOptions,
        ...config.puppeteer?.navigationOptions
      },
      waitOptions: {
        ...defaultConfig.puppeteer?.waitOptions,
        ...config.puppeteer?.waitOptions
      }
    }
  };
}
