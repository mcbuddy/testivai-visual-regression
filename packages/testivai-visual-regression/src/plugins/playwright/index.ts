/**
 * Playwright plugin for testivAI Visual Regression
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
  url(): string;
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
    
    async capture(name: string | undefined, page: unknown, options?: ScreenshotOptions): Promise<string> {
      const playwrightPage = page as PlaywrightPage;
      
      if (!playwrightPage || typeof playwrightPage.screenshot !== 'function') {
        throw new Error('Invalid Playwright page object provided. Expected page with screenshot method.');
      }

      // Generate filename from URL path if name is not provided
      let screenshotName = name;
      if (!screenshotName) {
        try {
          const currentUrl = playwrightPage.url();
          screenshotName = generateFilenameFromUrl(currentUrl);
        } catch (error) {
          // Fallback to timestamp if URL is not available
          screenshotName = `screenshot-${Date.now()}`;
        }
      }

      // Get current branch if not provided
      const branch = pluginOptions.branch || await getCurrentBranch();
      
      // Convert testivAI screenshot options to Playwright options
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
        name: screenshotName,
        branch,
        isBaseline: pluginOptions.isBaseline || false,
        target,
        screenshotOptions: options
      });
    }
  };
};

/**
 * Generate a filename from URL path
 */
function generateFilenameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    let pathname = urlObj.pathname;
    
    // Remove leading slash and replace slashes with dashes
    pathname = pathname.replace(/^\//, '').replace(/\//g, '-');
    
    // If pathname is empty, use the hostname
    if (!pathname || pathname === '') {
      pathname = urlObj.hostname.replace(/\./g, '-');
    }
    
    // Remove or replace invalid filename characters
    pathname = pathname.replace(/[<>:"/\\|?*]/g, '-');
    
    // Remove multiple consecutive dashes
    pathname = pathname.replace(/-+/g, '-');
    
    // Remove trailing dashes
    pathname = pathname.replace(/-$/, '');
    
    // If still empty, use default
    if (!pathname) {
      pathname = 'page';
    }
    
    // Ensure it ends with .png
    if (!pathname.endsWith('.png')) {
      pathname = pathname.replace(/\.(jpg|jpeg|gif|bmp|webp)$/i, '') + '.png';
    }
    
    return pathname;
  } catch (error) {
    // If URL parsing fails, return a safe default
    return 'page.png';
  }
}

/**
 * Convert testivAI screenshot options to Playwright-specific options
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
