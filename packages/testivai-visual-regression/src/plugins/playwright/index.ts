/**
 * Playwright plugin for TestivaiVR Visual Regression
 */

import { Plugin, ScreenshotOptions } from '../../core/interfaces';
import { captureScreenshot } from '../../capture';
import { getCurrentBranch } from '../../core/utils';

/**
 * Playwright Page interface (minimal required methods)
 */
interface PlaywrightPage {
  screenshot(options?: PlaywrightScreenshotOptions): Promise<Buffer>;
  locator?(selector: string): PlaywrightLocator;
}

/**
 * Playwright Locator interface (minimal required methods)
 */
interface PlaywrightLocator {
  screenshot(options?: PlaywrightScreenshotOptions): Promise<Buffer>;
}

/**
 * Playwright screenshot options
 */
interface PlaywrightScreenshotOptions {
  path?: string;
  fullPage?: boolean;
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  type?: 'png' | 'jpeg';
  quality?: number;
  omitBackground?: boolean;
  animations?: 'disabled' | 'allow';
  caret?: 'hide' | 'initial';
  scale?: 'css' | 'device';
  mask?: PlaywrightLocator[];
  maskColor?: string;
  threshold?: number;
  timeout?: number;
}

/**
 * Plugin configuration options
 */
interface PlaywrightPluginOptions {
  baselineDir?: string;
  compareDir?: string;
  isBaseline?: boolean;
  branch?: string;
}

/**
 * Playwright plugin
 */
export const playwrightPlugin = (pluginOptions: PlaywrightPluginOptions = {}): Plugin => {
  return {
    name: 'playwright-plugin',
    
    init(options?: Record<string, unknown>): void {
      // Initialize plugin with options
      if (options) {
        Object.assign(pluginOptions, options);
      }
    },
    
    async capture(name: string, page: unknown, options?: ScreenshotOptions): Promise<string> {
      const playwrightPage = page as PlaywrightPage;
      
      if (!playwrightPage || typeof playwrightPage.screenshot !== 'function') {
        throw new Error('Invalid Playwright page object provided. Expected page with screenshot method.');
      }

      // Get current branch if not provided
      const branch = pluginOptions.branch || await getCurrentBranch();
      
      // Convert TestiVAI screenshot options to Playwright options
      const playwrightOptions = convertToPlaywrightOptions(options);
      
      // Create target object that matches the expected interface
      const target = {
        screenshot: async (opts?: unknown) => {
          const mergedOptions = { ...playwrightOptions, ...(opts as PlaywrightScreenshotOptions || {}) };
          
          // Handle element-specific screenshots
          if (options?.selector && playwrightPage.locator) {
            const locator = playwrightPage.locator(options.selector);
            return await locator.screenshot(mergedOptions);
          }
          
          // Handle full page screenshots
          return await playwrightPage.screenshot(mergedOptions);
        }
      };

      // Use the generic capture function
      return await captureScreenshot({
        baselineDir: pluginOptions.baselineDir || '.testivai/visual-regression/baseline',
        compareDir: pluginOptions.compareDir,
        framework: 'playwright',
        name,
        branch,
        isBaseline: pluginOptions.isBaseline || false,
        target,
        screenshotOptions: options
      });
    }
  };
};

/**
 * Convert TestiVAI screenshot options to Playwright-specific options
 */
function convertToPlaywrightOptions(options?: ScreenshotOptions): PlaywrightScreenshotOptions {
  const playwrightOptions: PlaywrightScreenshotOptions = {
    type: 'png',
    fullPage: options?.fullPage || false,
    // Add animations disabled for consistent screenshots
    animations: 'disabled',
    // Hide caret for consistent text screenshots
    caret: 'hide'
  };

  return playwrightOptions;
}

/**
 * Create a Playwright screenshot capturer with specific configuration
 */
export function createPlaywrightCapturer(options: PlaywrightPluginOptions = {}) {
  return playwrightPlugin(options);
}
