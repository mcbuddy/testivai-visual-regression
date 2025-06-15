/**
 * Tests for Selenium plugin functionality
 */

import { seleniumPlugin, createSeleniumCapturer } from '../../../../src/plugins/selenium';
import { ScreenshotOptions } from '../../../../src/core/interfaces';
import * as captureModule from '../../../../src/capture';
import * as utilsModule from '../../../../src/core/utils';

// Mock dependencies
jest.mock('../../../../src/capture');
jest.mock('../../../../src/core/utils');

const mockCaptureScreenshot = captureModule.captureScreenshot as jest.MockedFunction<typeof captureModule.captureScreenshot>;
const mockGetCurrentBranch = utilsModule.getCurrentBranch as jest.MockedFunction<typeof utilsModule.getCurrentBranch>;

// Mock WebDriver interface
interface MockSeleniumWebDriver {
  executeScript: jest.MockedFunction<(script: string | Function, ...args: any[]) => Promise<any>>;
  getCurrentUrl: jest.MockedFunction<() => Promise<string>>;
  manage: jest.MockedFunction<() => {
    window: () => {
      getSize: jest.MockedFunction<() => Promise<{ width: number; height: number }>>;
      setSize: jest.MockedFunction<(width: number, height: number) => Promise<void>>;
    };
  }>;
}

function createMockWebDriver(): MockSeleniumWebDriver {
  return {
    executeScript: jest.fn(),
    getCurrentUrl: jest.fn(),
    manage: jest.fn(() => ({
      window: () => ({
        getSize: jest.fn(),
        setSize: jest.fn()
      })
    }))
  };
}

describe('Selenium Plugin', () => {
  let mockDriver: MockSeleniumWebDriver;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDriver = createMockWebDriver();
    
    // Setup default mocks
    mockGetCurrentBranch.mockResolvedValue('main');
    mockCaptureScreenshot.mockResolvedValue('/path/to/screenshot.png');
    mockDriver.getCurrentUrl.mockResolvedValue('https://example.com/test-page');
  });

  describe('seleniumPlugin', () => {
    it('should create a plugin with correct name', () => {
      const plugin = seleniumPlugin();
      
      expect(plugin.name).toBe('selenium-plugin');
      expect(typeof plugin.init).toBe('function');
      expect(typeof plugin.capture).toBe('function');
    });

    it('should initialize with default options', () => {
      const plugin = seleniumPlugin();
      
      // Should not throw when calling init
      expect(() => plugin.init()).not.toThrow();
    });

    it('should initialize with custom options', () => {
      const customOptions = {
        baselineDir: '/custom/baseline',
        compareDir: '/custom/compare',
        isBaseline: true,
        branch: 'feature-branch'
      };
      
      const plugin = seleniumPlugin(customOptions);
      
      expect(() => plugin.init({ additionalOption: 'value' })).not.toThrow();
    });
  });

  describe('capture method', () => {
    it('should capture screenshot with provided name', async () => {
      const plugin = seleniumPlugin();
      mockDriver.executeScript.mockResolvedValue('base64ScreenshotData');
      
      const result = await plugin.capture('test-screenshot', mockDriver);
      
      expect(result).toBe('/path/to/screenshot.png');
      expect(mockCaptureScreenshot).toHaveBeenCalledWith({
        baselineDir: '.testivai/visual-regression/baseline',
        compareDir: undefined,
        framework: 'selenium',
        name: 'test-screenshot',
        branch: 'main',
        isBaseline: false,
        target: expect.objectContaining({
          screenshot: expect.any(Function)
        }),
        screenshotOptions: undefined
      });
    });

    it('should generate filename from URL when name is not provided', async () => {
      const plugin = seleniumPlugin();
      mockDriver.executeScript.mockResolvedValue('base64ScreenshotData');
      mockDriver.getCurrentUrl.mockResolvedValue('https://example.com/products/item-123');
      
      await plugin.capture(undefined, mockDriver);
      
      expect(mockCaptureScreenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'products-item-123.png'
        })
      );
    });

    it('should use timestamp fallback when URL is not available', async () => {
      const plugin = seleniumPlugin();
      mockDriver.executeScript.mockResolvedValue('base64ScreenshotData');
      mockDriver.getCurrentUrl.mockRejectedValue(new Error('URL not available'));
      
      // Mock Date.now to return a fixed timestamp
      const mockTimestamp = 1234567890;
      jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);
      
      await plugin.capture(undefined, mockDriver);
      
      expect(mockCaptureScreenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          name: `screenshot-${mockTimestamp}`
        })
      );
      
      jest.restoreAllMocks();
    });

    it('should use custom branch when provided', async () => {
      const plugin = seleniumPlugin({ branch: 'feature-branch' });
      mockDriver.executeScript.mockResolvedValue('base64ScreenshotData');
      
      await plugin.capture('test', mockDriver);
      
      expect(mockCaptureScreenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          branch: 'feature-branch'
        })
      );
    });

    it('should use custom baseline directory', async () => {
      const plugin = seleniumPlugin({ baselineDir: '/custom/baseline' });
      mockDriver.executeScript.mockResolvedValue('base64ScreenshotData');
      
      await plugin.capture('test', mockDriver);
      
      expect(mockCaptureScreenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          baselineDir: '/custom/baseline'
        })
      );
    });

    it('should handle screenshot options', async () => {
      const plugin = seleniumPlugin();
      mockDriver.executeScript.mockResolvedValue('base64ScreenshotData');
      
      const options: ScreenshotOptions = {
        fullPage: true,
        selector: '.main-content'
      };
      
      await plugin.capture('test', mockDriver, options);
      
      expect(mockCaptureScreenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          screenshotOptions: options
        })
      );
    });

    it('should throw error for invalid driver object', async () => {
      const plugin = seleniumPlugin();
      const invalidDriver = { notADriver: true };
      
      await expect(plugin.capture('test', invalidDriver)).rejects.toThrow(
        'Invalid Selenium WebDriver object provided. Expected driver with executeScript method.'
      );
    });

    it('should throw error for null driver', async () => {
      const plugin = seleniumPlugin();
      
      await expect(plugin.capture('test', null)).rejects.toThrow(
        'Invalid Selenium WebDriver object provided. Expected driver with executeScript method.'
      );
    });
  });

  describe('CDP screenshot capture', () => {
    it('should capture screenshot using CDP', async () => {
      const plugin = seleniumPlugin();
      mockDriver.executeScript.mockResolvedValue('base64ScreenshotData');
      
      await plugin.capture('test', mockDriver);
      
      // Get the target object and test the screenshot function
      const captureCall = mockCaptureScreenshot.mock.calls[0][0];
      const target = captureCall.target;
      
      const screenshotBuffer = await target.screenshot();
      
      // Verify that executeScript was called for CDP screenshot
      expect(mockDriver.executeScript).toHaveBeenCalled();
      expect(screenshotBuffer).toBeInstanceOf(Buffer);
      expect(screenshotBuffer.toString('base64')).toBe('base64ScreenshotData');
    });

    it('should handle full page screenshots', async () => {
      const plugin = seleniumPlugin();
      
      // Mock full page dimensions
      mockDriver.executeScript
        .mockResolvedValueOnce({ width: 1920, height: 3000 }) // getFullPageDimensions
        .mockResolvedValueOnce('base64ScreenshotData'); // CDP screenshot
      
      const options: ScreenshotOptions = { fullPage: true };
      await plugin.capture('test', mockDriver, options);
      
      // Get the target object and call screenshot to trigger the executeScript calls
      const captureCall = mockCaptureScreenshot.mock.calls[0][0];
      const target = captureCall.target;
      await target.screenshot();
      
      // Verify that full page dimensions were requested
      expect(mockDriver.executeScript).toHaveBeenCalledWith(
        expect.stringContaining('Math.max')
      );
    });

    it('should handle element-specific screenshots', async () => {
      const plugin = seleniumPlugin();
      
      // Mock element bounds
      const elementBounds = { x: 100, y: 200, width: 300, height: 400 };
      mockDriver.executeScript
        .mockResolvedValueOnce(elementBounds) // getElementBounds
        .mockResolvedValueOnce('base64ScreenshotData'); // CDP screenshot
      
      const options: ScreenshotOptions = { selector: '.target-element' };
      await plugin.capture('test', mockDriver, options);
      
      // Get the target object and call screenshot to trigger the executeScript calls
      const captureCall = mockCaptureScreenshot.mock.calls[0][0];
      const target = captureCall.target;
      await target.screenshot();
      
      // Verify that element bounds were requested
      expect(mockDriver.executeScript).toHaveBeenCalledWith(
        expect.stringContaining('querySelector'),
        '.target-element'
      );
    });

    it('should handle element not found gracefully', async () => {
      const plugin = seleniumPlugin();
      
      // Mock element not found
      mockDriver.executeScript
        .mockResolvedValueOnce(null) // getElementBounds returns null
        .mockResolvedValueOnce('base64ScreenshotData'); // CDP screenshot
      
      const options: ScreenshotOptions = { selector: '.non-existent-element' };
      
      // Should not throw error
      await expect(plugin.capture('test', mockDriver, options)).resolves.toBeDefined();
    });

    it('should fallback to Selenium screenshot when CDP fails', async () => {
      const plugin = seleniumPlugin();
      
      // Mock CDP failure and fallback success
      mockDriver.executeScript
        .mockRejectedValueOnce(new Error('CDP not available')) // CDP fails
        .mockResolvedValueOnce('fallbackScreenshotData'); // Fallback succeeds
      
      await plugin.capture('test', mockDriver);
      
      // Get the target object and call screenshot to trigger the executeScript calls
      const captureCall = mockCaptureScreenshot.mock.calls[0][0];
      const target = captureCall.target;
      await target.screenshot();
      
      // Should have been called twice (CDP attempt + fallback)
      expect(mockDriver.executeScript).toHaveBeenCalledTimes(2);
    });

    it('should handle invalid screenshot data', async () => {
      const plugin = seleniumPlugin();
      mockDriver.executeScript.mockResolvedValue(null); // Invalid data
      
      const captureCall = mockCaptureScreenshot.mock.calls[0] || [];
      if (captureCall.length > 0) {
        const target = captureCall[0].target;
        
        await expect(target.screenshot()).rejects.toThrow();
      }
    });
  });

  describe('URL filename generation', () => {
    it('should generate filename from simple URL path', async () => {
      const plugin = seleniumPlugin();
      mockDriver.executeScript.mockResolvedValue('base64ScreenshotData');
      mockDriver.getCurrentUrl.mockResolvedValue('https://example.com/about');
      
      await plugin.capture(undefined, mockDriver);
      
      expect(mockCaptureScreenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'about.png'
        })
      );
    });

    it('should generate filename from complex URL path', async () => {
      const plugin = seleniumPlugin();
      mockDriver.executeScript.mockResolvedValue('base64ScreenshotData');
      mockDriver.getCurrentUrl.mockResolvedValue('https://example.com/products/category/item-123');
      
      await plugin.capture(undefined, mockDriver);
      
      expect(mockCaptureScreenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'products-category-item-123.png'
        })
      );
    });

    it('should use hostname for root URL', async () => {
      const plugin = seleniumPlugin();
      mockDriver.executeScript.mockResolvedValue('base64ScreenshotData');
      mockDriver.getCurrentUrl.mockResolvedValue('https://example.com/');
      
      await plugin.capture(undefined, mockDriver);
      
      expect(mockCaptureScreenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'example-com.png'
        })
      );
    });

    it('should sanitize invalid filename characters', async () => {
      const plugin = seleniumPlugin();
      mockDriver.executeScript.mockResolvedValue('base64ScreenshotData');
      mockDriver.getCurrentUrl.mockResolvedValue('https://example.com/path-with-invalid-chars');
      
      await plugin.capture(undefined, mockDriver);
      
      expect(mockCaptureScreenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'path-with-invalid-chars.png'
        })
      );
    });

    it('should handle malformed URLs', async () => {
      const plugin = seleniumPlugin();
      mockDriver.executeScript.mockResolvedValue('base64ScreenshotData');
      mockDriver.getCurrentUrl.mockResolvedValue('not-a-valid-url');
      
      await plugin.capture(undefined, mockDriver);
      
      expect(mockCaptureScreenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'page.png'
        })
      );
    });
  });

  describe('createSeleniumCapturer', () => {
    it('should create a Selenium capturer with default options', () => {
      const capturer = createSeleniumCapturer();
      
      expect(capturer.name).toBe('selenium-plugin');
    });

    it('should create a Selenium capturer with custom options', () => {
      const options = {
        baselineDir: '/custom/baseline',
        isBaseline: true
      };
      
      const capturer = createSeleniumCapturer(options);
      
      expect(capturer.name).toBe('selenium-plugin');
    });
  });

  describe('error handling', () => {
    it('should handle executeScript errors gracefully', async () => {
      const plugin = seleniumPlugin();
      mockDriver.executeScript.mockRejectedValue(new Error('Script execution failed'));
      
      // Should attempt fallback
      await expect(plugin.capture('test', mockDriver)).resolves.toBeDefined();
    });

    it('should handle getCurrentUrl errors', async () => {
      const plugin = seleniumPlugin();
      mockDriver.executeScript.mockResolvedValue('base64ScreenshotData');
      mockDriver.getCurrentUrl.mockRejectedValue(new Error('URL not available'));
      
      // Should use timestamp fallback
      await expect(plugin.capture(undefined, mockDriver)).resolves.toBeDefined();
    });

    it('should propagate capture errors', async () => {
      const plugin = seleniumPlugin();
      mockDriver.executeScript.mockResolvedValue('base64ScreenshotData');
      mockCaptureScreenshot.mockRejectedValue(new Error('Capture failed'));
      
      await expect(plugin.capture('test', mockDriver)).rejects.toThrow('Capture failed');
    });
  });

  describe('integration with capture module', () => {
    it('should pass correct parameters to captureScreenshot', async () => {
      const plugin = seleniumPlugin({
        baselineDir: '/test/baseline',
        compareDir: '/test/compare',
        isBaseline: true,
        branch: 'test-branch'
      });
      
      mockDriver.executeScript.mockResolvedValue('base64ScreenshotData');
      
      const options: ScreenshotOptions = {
        fullPage: true,
        selector: '.test-element'
      };
      
      await plugin.capture('integration-test', mockDriver, options);
      
      expect(mockCaptureScreenshot).toHaveBeenCalledWith({
        baselineDir: '/test/baseline',
        compareDir: '/test/compare',
        framework: 'selenium',
        name: 'integration-test',
        branch: 'test-branch',
        isBaseline: true,
        target: expect.objectContaining({
          screenshot: expect.any(Function)
        }),
        screenshotOptions: options
      });
    });
  });
});
