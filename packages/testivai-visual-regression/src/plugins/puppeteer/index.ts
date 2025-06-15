/**
 * Puppeteer plugin for TestivAI Visual Regression
 */

import * as fs from 'fs';
import * as path from 'path';
import { Plugin, ScreenshotOptions } from '../../core/interfaces';
import { PuppeteerConfig } from '../../config/puppeteer';

/**
 * Type definition for Puppeteer Page
 */
interface PuppeteerPage {
  screenshot: (options?: PuppeteerScreenshotOptions) => Promise<Buffer | string>;
  $: (selector: string) => Promise<PuppeteerElementHandle | null>;
  $eval: (selector: string, pageFunction: Function, ...args: any[]) => Promise<any>;
  evaluate: (pageFunction: Function | string, ...args: any[]) => Promise<any>;
  waitForSelector: (selector: string, options?: any) => Promise<PuppeteerElementHandle>;
  waitForNavigation: (options?: any) => Promise<any>;
  waitForNetworkIdle: (options?: any) => Promise<void>;
  url: () => string;
}

/**
 * Type definition for Puppeteer ElementHandle
 */
interface PuppeteerElementHandle {
  screenshot: (options?: PuppeteerScreenshotOptions) => Promise<Buffer | string>;
  boundingBox: () => Promise<{ x: number; y: number; width: number; height: number } | null>;
}

/**
 * Type definition for Puppeteer Screenshot Options
 */
interface PuppeteerScreenshotOptions {
  path?: string;
  type?: 'png' | 'jpeg';
  quality?: number;
  fullPage?: boolean;
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  omitBackground?: boolean;
  encoding?: 'base64' | 'binary';
}

/**
 * Puppeteer plugin options
 */
interface PuppeteerPluginOptions {
  /**
   * Puppeteer configuration
   */
  config?: PuppeteerConfig;
}

/**
 * Create a Puppeteer plugin for TestivAI Visual Regression
 * @param options Plugin options
 * @returns Puppeteer plugin
 */
export const puppeteerPlugin = (options?: PuppeteerPluginOptions): Plugin => {
  // Plugin configuration
  let config: PuppeteerConfig | undefined = options?.config;
  
  // Ensure directory exists
  const ensureDirectoryExists = (filePath: string): void => {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
      return;
    }
    fs.mkdirSync(dirname, { recursive: true });
  };
  
  // Validate page object
  const validatePage = (page: unknown): PuppeteerPage => {
    if (!page) {
      throw new Error('Puppeteer page is required');
    }
    
    const puppeteerPage = page as PuppeteerPage;
    
    if (typeof puppeteerPage.screenshot !== 'function') {
      throw new Error('Invalid Puppeteer page: missing screenshot method');
    }
    
    if (typeof puppeteerPage.$ !== 'function') {
      throw new Error('Invalid Puppeteer page: missing $ method');
    }
    
    return puppeteerPage;
  };
  
  // Wait for animations to complete
  const waitForAnimationsToComplete = async (page: PuppeteerPage): Promise<void> => {
    try {
      await page.evaluate(() => {
        return new Promise<void>((resolve) => {
          // Check if any animations are running
          const hasAnimations = () => {
            const elements = document.querySelectorAll('*');
            for (const element of elements) {
              const computed = window.getComputedStyle(element);
              const animationState = computed.animationPlayState;
              
              if (
                (animationState && animationState !== 'paused' && computed.animationName !== 'none') ||
                (computed.transitionProperty !== 'none' && computed.transitionDuration !== '0s')
              ) {
                return true;
              }
            }
            return false;
          };
          
          // If no animations, resolve immediately
          if (!hasAnimations()) {
            resolve();
            return;
          }
          
          // Otherwise, set up a check every 100ms
          const checkInterval = setInterval(() => {
            if (!hasAnimations()) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 100);
          
          // Timeout after 5 seconds
          setTimeout(() => {
            clearInterval(checkInterval);
            resolve();
          }, 5000);
        });
      });
    } catch (error) {
      console.warn('Failed to wait for animations to complete:', error);
    }
  };
  
  // Wait for network to be idle
  const waitForNetworkIdle = async (page: PuppeteerPage): Promise<void> => {
    try {
      if (typeof page.waitForNetworkIdle === 'function') {
        await page.waitForNetworkIdle({ timeout: config?.puppeteer?.navigationOptions?.timeout || 30000 });
      } else {
        // Fallback for older Puppeteer versions
        await page.evaluate(() => {
          return new Promise<void>((resolve) => {
            let active = 0;
            let timeout: NodeJS.Timeout;
            
            const onRequest = () => {
              active++;
              clearTimeout(timeout);
            };
            
            const onResponse = () => {
              active--;
              if (active === 0) {
                timeout = setTimeout(onDone, 500);
              }
            };
            
            const onDone = () => {
              window.removeEventListener('request', onRequest);
              window.removeEventListener('response', onResponse);
              window.removeEventListener('error', onResponse);
              window.removeEventListener('abort', onResponse);
              resolve();
            };
            
            window.addEventListener('request', onRequest);
            window.addEventListener('response', onResponse);
            window.addEventListener('error', onResponse);
            window.addEventListener('abort', onResponse);
            
            // Initial timeout
            timeout = setTimeout(onDone, 500);
          });
        });
      }
    } catch (error) {
      console.warn('Failed to wait for network idle:', error);
    }
  };
  
  // Wait for custom selectors
  const waitForSelectors = async (page: PuppeteerPage, selectors: string[]): Promise<void> => {
    if (!selectors || selectors.length === 0) {
      return;
    }
    
    try {
      for (const selector of selectors) {
        await page.waitForSelector(selector, {
          timeout: config?.puppeteer?.waitOptions?.timeout || 30000
        });
      }
    } catch (error) {
      console.warn(`Failed to wait for selector(s): ${selectors.join(', ')}`, error);
    }
  };
  
  // Perform pre-screenshot waits
  const performWaits = async (page: PuppeteerPage): Promise<void> => {
    const waitOptions = config?.puppeteer?.waitOptions;
    
    if (waitOptions?.waitForAnimations) {
      await waitForAnimationsToComplete(page);
    }
    
    if (waitOptions?.waitForNetworkIdle) {
      await waitForNetworkIdle(page);
    }
    
    if (waitOptions?.waitForSelectors && waitOptions.waitForSelectors.length > 0) {
      await waitForSelectors(page, waitOptions.waitForSelectors);
    }
  };
  
  // Capture element screenshot
  const captureElementScreenshot = async (
    page: PuppeteerPage,
    selector: string,
    outputPath: string,
    options?: ScreenshotOptions
  ): Promise<string> => {
    const element = await page.$(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    
    // Get element dimensions
    const boundingBox = await element.boundingBox();
    if (!boundingBox) {
      throw new Error(`Element has no dimensions: ${selector}`);
    }
    
    // Prepare screenshot options
    const screenshotOptions: PuppeteerScreenshotOptions = {
      path: outputPath,
      ...config?.puppeteer?.screenshotOptions,
      clip: boundingBox
    };
    
    // Take screenshot
    await element.screenshot(screenshotOptions);
    
    return outputPath;
  };
  
  // Capture full page or viewport screenshot
  const capturePageScreenshot = async (
    page: PuppeteerPage,
    outputPath: string,
    options?: ScreenshotOptions
  ): Promise<string> => {
    // Prepare screenshot options
    const screenshotOptions: PuppeteerScreenshotOptions = {
      path: outputPath,
      ...config?.puppeteer?.screenshotOptions,
      fullPage: options?.fullPage ?? config?.puppeteer?.screenshotOptions?.fullPage ?? false
    };
    
    // Take screenshot
    await page.screenshot(screenshotOptions);
    
    return outputPath;
  };
  
  return {
    name: 'puppeteer-plugin',
    
    init(options?: Record<string, unknown>): void {
      // Initialize plugin with options
      if (options && options.config) {
        config = options.config as PuppeteerConfig;
      }
    },
    
    async capture(name: string, page: unknown, options?: ScreenshotOptions): Promise<string> {
      // Validate page object
      const puppeteerPage = validatePage(page);
      
      // Generate screenshot name if not provided
      if (!name) {
        const url = puppeteerPage.url();
        const urlObj = new URL(url);
        name = `${urlObj.hostname}${urlObj.pathname.replace(/\//g, '_')}`;
      }
      
      // Determine output path
      const baseDir = config?.baselineDir || '.testivai/baseline';
      const outputPath = path.join(baseDir, `${name}.png`);
      
      // Ensure directory exists
      ensureDirectoryExists(outputPath);
      
      // Perform pre-screenshot waits
      await performWaits(puppeteerPage);
      
      // Capture screenshot based on options
      if (options?.selector) {
        return captureElementScreenshot(puppeteerPage, options.selector, outputPath, options);
      } else {
        return capturePageScreenshot(puppeteerPage, outputPath, options);
      }
    }
  };
};
