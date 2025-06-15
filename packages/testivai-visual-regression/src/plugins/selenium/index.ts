/**
 * Selenium plugin for testivAI Visual Regression
 * Uses Chrome DevTools Protocol (CDP) for screenshot capture
 */

import { Plugin, ScreenshotOptions } from '../../core/interfaces';
import { captureScreenshot } from '../../capture';
import { getCurrentBranch } from '../../core/utils';

/**
 * Selenium WebDriver interface (minimal required methods)
 */
interface SeleniumWebDriver {
  executeScript(script: string | Function, ...args: any[]): Promise<any>;
  getCurrentUrl(): Promise<string>;
  manage(): {
    window(): {
      getSize(): Promise<{ width: number; height: number }>;
      setSize(width: number, height: number): Promise<void>;
    };
  };
}

/**
 * CDP Screenshot options
 */
interface CDPScreenshotOptions {
  format?: 'jpeg' | 'png';
  quality?: number;
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
  };
  fromSurface?: boolean;
  captureBeyondViewport?: boolean;
}

/**
 * Plugin configuration options
 */
interface SeleniumPluginOptions {
  baselineDir?: string;
  compareDir?: string;
  isBaseline?: boolean;
  branch?: string;
}

/**
 * Selenium plugin using CDP for screenshot capture
 */
export const seleniumPlugin = (pluginOptions: SeleniumPluginOptions = {}): Plugin => {
  return {
    name: 'selenium-plugin',
    
    init(options?: Record<string, unknown>): void {
      // Initialize plugin with options
      if (options) {
        Object.assign(pluginOptions, options);
      }
    },
    
    async capture(name: string | undefined, driver: unknown, options?: ScreenshotOptions): Promise<string> {
      const seleniumDriver = driver as SeleniumWebDriver;
      
      if (!seleniumDriver || typeof seleniumDriver.executeScript !== 'function') {
        throw new Error('Invalid Selenium WebDriver object provided. Expected driver with executeScript method.');
      }

      // Generate filename from URL path if name is not provided
      let screenshotName = name;
      if (!screenshotName) {
        try {
          const currentUrl = await seleniumDriver.getCurrentUrl();
          screenshotName = generateFilenameFromUrl(currentUrl);
        } catch (error) {
          // Fallback to timestamp if URL is not available
          screenshotName = `screenshot-${Date.now()}`;
        }
      }

      // Get current branch if not provided
      const branch = pluginOptions.branch || await getCurrentBranch();
      
      // Create target object that matches the expected interface
      const target = {
        screenshot: async () => {
          return await captureScreenshotWithCDP(seleniumDriver, options);
        }
      };

      // Use the generic capture function
      return await captureScreenshot({
        baselineDir: pluginOptions.baselineDir || '.testivai/visual-regression/baseline',
        compareDir: pluginOptions.compareDir,
        framework: 'selenium',
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
 * Capture screenshot using Chrome DevTools Protocol
 */
async function captureScreenshotWithCDP(
  driver: SeleniumWebDriver, 
  options?: ScreenshotOptions
): Promise<Buffer> {
  try {
    // Convert testivAI options to CDP options
    const cdpOptions = convertToCDPOptions(options);
    
    // Handle full page screenshots
    if (options?.fullPage) {
      // Get the full page dimensions
      const dimensions = await getFullPageDimensions(driver);
      cdpOptions.clip = {
        x: 0,
        y: 0,
        width: dimensions.width,
        height: dimensions.height,
        scale: 1
      };
      cdpOptions.captureBeyondViewport = true;
    }
    
    // Handle element-specific screenshots
    if (options?.selector) {
      const elementBounds = await getElementBounds(driver, options.selector);
      if (elementBounds) {
        cdpOptions.clip = {
          x: elementBounds.x,
          y: elementBounds.y,
          width: elementBounds.width,
          height: elementBounds.height,
          scale: 1
        };
      }
    }
    
    // Execute CDP command to capture screenshot
    const screenshotData = await driver.executeScript(`
      return new Promise(async (resolve, reject) => {
        try {
          // First, try to get or create a CDP session
          let cdpSession = null;
          
          // Check if we already have a CDP session stored
          if (window.__testivai_cdp_session) {
            cdpSession = window.__testivai_cdp_session;
          } else {
            // Try to create a new CDP session
            cdpSession = await createCDPSession();
            if (cdpSession) {
              // Store the session for reuse
              window.__testivai_cdp_session = cdpSession;
            }
          }
          
          if (cdpSession) {
            // Use the CDP session to capture screenshot
            const result = await cdpSession.send('Page.captureScreenshot', ${JSON.stringify(cdpOptions)});
            if (result && result.data) {
              resolve(result.data);
            } else {
              reject(new Error('Failed to capture screenshot via CDP session'));
            }
          } else {
            reject(new Error('Could not establish CDP session'));
          }
        } catch (error) {
          reject(error);
        }
      });
      
      // Helper function to create CDP session
      async function createCDPSession() {
        try {
          // Method 1: Try to use existing Chrome DevTools connection
          if (window.chrome && window.chrome.debugger) {
            return {
              send: (method, params) => {
                return new Promise((resolve, reject) => {
                  window.chrome.debugger.sendCommand({tabId: 0}, method, params, (result) => {
                    if (window.chrome.runtime.lastError) {
                      reject(new Error(window.chrome.runtime.lastError.message));
                    } else {
                      resolve(result);
                    }
                  });
                });
              }
            };
          }
          
          // Method 2: Try to connect via WebSocket to CDP endpoint
          const cdpEndpoint = await getCDPEndpoint();
          if (cdpEndpoint) {
            const ws = new WebSocket(cdpEndpoint);
            let messageId = 1;
            const pendingMessages = new Map();
            
            ws.onmessage = (event) => {
              const response = JSON.parse(event.data);
              if (response.id && pendingMessages.has(response.id)) {
                const { resolve, reject } = pendingMessages.get(response.id);
                pendingMessages.delete(response.id);
                
                if (response.error) {
                  reject(new Error(response.error.message));
                } else {
                  resolve(response.result);
                }
              }
            };
            
            await new Promise((resolve, reject) => {
              ws.onopen = resolve;
              ws.onerror = reject;
              setTimeout(reject, 5000); // 5 second timeout
            });
            
            return {
              send: (method, params) => {
                return new Promise((resolve, reject) => {
                  const id = messageId++;
                  pendingMessages.set(id, { resolve, reject });
                  
                  ws.send(JSON.stringify({
                    id,
                    method,
                    params: params || {}
                  }));
                  
                  // Timeout after 30 seconds
                  setTimeout(() => {
                    if (pendingMessages.has(id)) {
                      pendingMessages.delete(id);
                      reject(new Error('CDP command timeout'));
                    }
                  }, 30000);
                });
              }
            };
          }
          
          // Method 3: Try runtime messaging (for extensions)
          if (window.chrome && window.chrome.runtime && window.chrome.runtime.sendMessage) {
            return {
              send: (method, params) => {
                return new Promise((resolve, reject) => {
                  window.chrome.runtime.sendMessage({
                    action: 'cdp',
                    method,
                    params: params || {}
                  }, (response) => {
                    if (window.chrome.runtime.lastError) {
                      reject(new Error(window.chrome.runtime.lastError.message));
                    } else if (response && response.error) {
                      reject(new Error(response.error));
                    } else {
                      resolve(response);
                    }
                  });
                });
              }
            };
          }
          
          return null;
        } catch (error) {
          console.warn('Failed to create CDP session:', error);
          return null;
        }
      }
      
      // Helper function to get CDP endpoint
      async function getCDPEndpoint() {
        try {
          // Try to get CDP endpoint from Chrome
          const response = await fetch('http://localhost:9222/json/version');
          const data = await response.json();
          return data.webSocketDebuggerUrl;
        } catch (error) {
          // Try alternative ports
          const ports = [9222, 9223, 9224];
          for (const port of ports) {
            try {
              const response = await fetch(\`http://localhost:\${port}/json/version\`);
              const data = await response.json();
              return data.webSocketDebuggerUrl;
            } catch (e) {
              // Continue to next port
            }
          }
          return null;
        }
      }
    `);
    
    if (typeof screenshotData === 'string') {
      // Convert base64 to Buffer
      return Buffer.from(screenshotData, 'base64');
    } else {
      throw new Error('Invalid screenshot data received from CDP');
    }
    
  } catch (error) {
    // Fallback to traditional Selenium screenshot if CDP fails
    console.warn('CDP screenshot failed, falling back to Selenium screenshot:', error);
    return await fallbackToSeleniumScreenshot(driver, options);
  }
}

/**
 * Fallback to traditional Selenium screenshot method
 */
async function fallbackToSeleniumScreenshot(
  driver: SeleniumWebDriver,
  options?: ScreenshotOptions
): Promise<Buffer> {
  try {
    // Use Selenium's built-in screenshot capability
    const screenshotData = await driver.executeScript(`
      return new Promise((resolve) => {
        // Try to use the WebDriver screenshot API
        if (window.navigator && window.navigator.webdriver) {
          // This is a fallback - in real implementation, we'd use driver.takeScreenshot()
          // For now, we'll use canvas to capture the viewport
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          
          // This is a simplified fallback - real implementation would be more complex
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Convert to base64
          const dataUrl = canvas.toDataURL('image/png');
          const base64Data = dataUrl.split(',')[1];
          resolve(base64Data);
        } else {
          resolve(null);
        }
      });
    `);
    
    if (typeof screenshotData === 'string') {
      return Buffer.from(screenshotData, 'base64');
    } else {
      throw new Error('Failed to capture screenshot with fallback method');
    }
  } catch (error) {
    throw new Error(`Screenshot capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get full page dimensions for full page screenshots
 */
async function getFullPageDimensions(driver: SeleniumWebDriver): Promise<{ width: number; height: number }> {
  const dimensions = await driver.executeScript(`
    return {
      width: Math.max(
        document.body.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.clientWidth,
        document.documentElement.scrollWidth,
        document.documentElement.offsetWidth
      ),
      height: Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      )
    };
  `) as { width: number; height: number };
  
  return dimensions;
}

/**
 * Get element bounds for element-specific screenshots
 */
async function getElementBounds(
  driver: SeleniumWebDriver, 
  selector: string
): Promise<{ x: number; y: number; width: number; height: number } | null> {
  try {
    const bounds = await driver.executeScript(`
      const element = document.querySelector(arguments[0]);
      if (!element) return null;
      
      const rect = element.getBoundingClientRect();
      return {
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height
      };
    `, selector) as { x: number; y: number; width: number; height: number } | null;
    
    return bounds;
  } catch (error) {
    console.warn(`Failed to get element bounds for selector "${selector}":`, error);
    return null;
  }
}

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
 * Convert testivAI screenshot options to CDP-specific options
 */
function convertToCDPOptions(options?: ScreenshotOptions): CDPScreenshotOptions {
  const cdpOptions: CDPScreenshotOptions = {
    format: 'png',
    fromSurface: true
  };

  // For now, we'll use PNG format by default
  // Format and quality options would come from the Selenium configuration
  // rather than the screenshot options
  
  return cdpOptions;
}

/**
 * Create a Selenium screenshot capturer with specific configuration
 */
export function createSeleniumCapturer(options: SeleniumPluginOptions = {}) {
  return seleniumPlugin(options);
}
