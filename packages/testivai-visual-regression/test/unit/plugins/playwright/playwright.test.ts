/**
 * Tests for Playwright plugin
 */

import { playwrightPlugin, createPlaywrightCapturer } from '../../../../src/plugins/playwright';
import * as captureModule from '../../../../src/capture';
import * as utilsModule from '../../../../src/core/utils';

// Mock the capture module
jest.mock('../../../../src/capture');
const mockCaptureScreenshot = captureModule.captureScreenshot as jest.MockedFunction<typeof captureModule.captureScreenshot>;

// Mock the utils module
jest.mock('../../../../src/core/utils');
const mockGetCurrentBranch = utilsModule.getCurrentBranch as jest.MockedFunction<typeof utilsModule.getCurrentBranch>;

describe('Playwright Plugin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentBranch.mockResolvedValue('main');
    mockCaptureScreenshot.mockResolvedValue('/path/to/screenshot.png');
  });

  describe('playwrightPlugin', () => {
    it('should create a plugin with default options', () => {
      const plugin = playwrightPlugin();
      
      expect(plugin.name).toBe('playwright-plugin');
      expect(typeof plugin.init).toBe('function');
      expect(typeof plugin.capture).toBe('function');
    });

    it('should create a plugin with custom options', () => {
      const options = {
        baselineDir: '/custom/baseline',
        compareDir: '/custom/compare',
        isBaseline: true,
        branch: 'feature-branch'
      };
      
      const plugin = playwrightPlugin(options);
      
      expect(plugin.name).toBe('playwright-plugin');
    });

    describe('init', () => {
      it('should initialize without options', () => {
        const plugin = playwrightPlugin();
        
        expect(() => plugin.init()).not.toThrow();
      });

      it('should initialize with options', () => {
        const plugin = playwrightPlugin();
        const initOptions = { customOption: 'value' };
        
        expect(() => plugin.init(initOptions)).not.toThrow();
      });

      it('should merge initialization options with plugin options', () => {
        const plugin = playwrightPlugin({ baselineDir: '/initial' });
        
        plugin.init({ baselineDir: '/updated' });
        
        // The init should not throw and should handle option merging
        expect(() => plugin.init({ baselineDir: '/updated' })).not.toThrow();
      });
    });

    describe('capture', () => {
      let mockPage: any;
      let mockLocator: any;

      beforeEach(() => {
        mockLocator = {
          screenshot: jest.fn().mockResolvedValue(Buffer.from('locator-screenshot-data'))
        };

        mockPage = {
          screenshot: jest.fn().mockResolvedValue(Buffer.from('page-screenshot-data')),
          locator: jest.fn().mockReturnValue(mockLocator)
        };
      });

      it('should capture a full page screenshot', async () => {
        const plugin = playwrightPlugin({
          baselineDir: '/test/baseline',
          compareDir: '/test/compare',
          isBaseline: false
        });

        // Mock captureScreenshot to call the target.screenshot function
        mockCaptureScreenshot.mockImplementation(async (options) => {
          await options.target.screenshot();
          return '/path/to/screenshot.png';
        });

        const result = await plugin.capture('test-screenshot', mockPage, {
          fullPage: true
        });

        expect(mockPage.screenshot).toHaveBeenCalledWith({
          type: 'png',
          fullPage: true,
          animations: 'disabled',
          caret: 'hide'
        });

        expect(mockCaptureScreenshot).toHaveBeenCalledWith({
          baselineDir: '/test/baseline',
          compareDir: '/test/compare',
          framework: 'playwright',
          name: 'test-screenshot',
          branch: 'main',
          isBaseline: false,
          target: expect.objectContaining({
            screenshot: expect.any(Function)
          }),
          screenshotOptions: {
            fullPage: true
          }
        });

        expect(result).toBe('/path/to/screenshot.png');
      });

      it('should capture an element screenshot using selector', async () => {
        const plugin = playwrightPlugin();

        // Mock captureScreenshot to call the target.screenshot function
        mockCaptureScreenshot.mockImplementation(async (options) => {
          await options.target.screenshot();
          return '/path/to/screenshot.png';
        });

        await plugin.capture('element-screenshot', mockPage, {
          selector: '.test-element',
          fullPage: false
        });

        expect(mockPage.locator).toHaveBeenCalledWith('.test-element');
        expect(mockLocator.screenshot).toHaveBeenCalledWith({
          type: 'png',
          fullPage: false,
          animations: 'disabled',
          caret: 'hide'
        });
      });

      it('should use default options when none provided', async () => {
        const plugin = playwrightPlugin();

        // Mock captureScreenshot to call the target.screenshot function
        mockCaptureScreenshot.mockImplementation(async (options) => {
          await options.target.screenshot();
          return '/path/to/screenshot.png';
        });

        await plugin.capture('default-screenshot', mockPage);

        expect(mockPage.screenshot).toHaveBeenCalledWith({
          type: 'png',
          fullPage: false,
          animations: 'disabled',
          caret: 'hide'
        });
      });

      it('should use custom branch from plugin options', async () => {
        const plugin = playwrightPlugin({
          branch: 'custom-branch'
        });

        await plugin.capture('branch-test', mockPage);

        expect(mockCaptureScreenshot).toHaveBeenCalledWith(
          expect.objectContaining({
            branch: 'custom-branch'
          })
        );
      });

      it('should get current branch when not provided in options', async () => {
        mockGetCurrentBranch.mockResolvedValue('detected-branch');
        const plugin = playwrightPlugin();

        await plugin.capture('auto-branch-test', mockPage);

        expect(mockGetCurrentBranch).toHaveBeenCalled();
        expect(mockCaptureScreenshot).toHaveBeenCalledWith(
          expect.objectContaining({
            branch: 'detected-branch'
          })
        );
      });

      it('should throw error for invalid page object', async () => {
        const plugin = playwrightPlugin();
        const invalidPage = {};

        await expect(
          plugin.capture('invalid-page-test', invalidPage)
        ).rejects.toThrow('Invalid Playwright page object provided. Expected page with screenshot method.');
      });

      it('should throw error for null page object', async () => {
        const plugin = playwrightPlugin();

        await expect(
          plugin.capture('null-page-test', null)
        ).rejects.toThrow('Invalid Playwright page object provided. Expected page with screenshot method.');
      });

      it('should handle page without locator method for element screenshots', async () => {
        const pageWithoutLocator = {
          screenshot: jest.fn().mockResolvedValue(Buffer.from('screenshot-data'))
        };

        const plugin = playwrightPlugin();

        // Mock captureScreenshot to call the target.screenshot function
        mockCaptureScreenshot.mockImplementation(async (options) => {
          await options.target.screenshot();
          return '/path/to/screenshot.png';
        });

        await plugin.capture('no-locator-test', pageWithoutLocator, {
          selector: '.test-element'
        });

        // Should fall back to page screenshot when locator is not available
        expect(pageWithoutLocator.screenshot).toHaveBeenCalled();
      });

      it('should merge screenshot options correctly', async () => {
        const plugin = playwrightPlugin();

        // Mock the target.screenshot function to verify merged options
        mockCaptureScreenshot.mockImplementation(async (options) => {
          const target = options.target;
          await target.screenshot({ quality: 90 });
          return '/path/to/screenshot.png';
        });

        await plugin.capture('merge-options-test', mockPage, {
          fullPage: true
        });

        expect(mockPage.screenshot).toHaveBeenCalledWith({
          type: 'png',
          fullPage: true,
          animations: 'disabled',
          caret: 'hide',
          quality: 90
        });
      });
    });
  });

  describe('createPlaywrightCapturer', () => {
    it('should create a capturer with default options', () => {
      const capturer = createPlaywrightCapturer();
      
      expect(capturer.name).toBe('playwright-plugin');
    });

    it('should create a capturer with custom options', () => {
      const options = {
        baselineDir: '/custom/baseline',
        isBaseline: true
      };
      
      const capturer = createPlaywrightCapturer(options);
      
      expect(capturer.name).toBe('playwright-plugin');
    });
  });

  describe('Integration with capture module', () => {
    it('should pass correct parameters to captureScreenshot', async () => {
      const plugin = playwrightPlugin({
        baselineDir: '/integration/baseline',
        compareDir: '/integration/compare',
        isBaseline: true,
        branch: 'integration-branch'
      });

      const mockPage = {
        screenshot: jest.fn().mockResolvedValue(Buffer.from('integration-test'))
      };

      await plugin.capture('integration-test', mockPage, {
        fullPage: true,
        selector: undefined
      });

      expect(mockCaptureScreenshot).toHaveBeenCalledWith({
        baselineDir: '/integration/baseline',
        compareDir: '/integration/compare',
        framework: 'playwright',
        name: 'integration-test',
        branch: 'integration-branch',
        isBaseline: true,
        target: expect.objectContaining({
          screenshot: expect.any(Function)
        }),
        screenshotOptions: {
          fullPage: true,
          selector: undefined
        }
      });
    });

    it('should handle capture module errors', async () => {
      mockCaptureScreenshot.mockRejectedValue(new Error('Capture failed'));
      
      const plugin = playwrightPlugin();
      const mockPage = {
        screenshot: jest.fn().mockResolvedValue(Buffer.from('test-data'))
      };

      await expect(
        plugin.capture('error-test', mockPage)
      ).rejects.toThrow('Capture failed');
    });
  });

  describe('Screenshot options conversion', () => {
    let mockPage: any;

    beforeEach(() => {
      mockPage = {
        screenshot: jest.fn().mockResolvedValue(Buffer.from('test-data'))
      };
    });

    it('should convert fullPage option correctly', async () => {
      const plugin = playwrightPlugin();

      // Mock captureScreenshot to call the target.screenshot function
      mockCaptureScreenshot.mockImplementation(async (options) => {
        await options.target.screenshot();
        return '/path/to/screenshot.png';
      });

      await plugin.capture('fullpage-test', mockPage, { fullPage: true });

      expect(mockPage.screenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          fullPage: true
        })
      );
    });

    it('should set default animations and caret options', async () => {
      const plugin = playwrightPlugin();

      // Mock captureScreenshot to call the target.screenshot function
      mockCaptureScreenshot.mockImplementation(async (options) => {
        await options.target.screenshot();
        return '/path/to/screenshot.png';
      });

      await plugin.capture('defaults-test', mockPage);

      expect(mockPage.screenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          animations: 'disabled',
          caret: 'hide'
        })
      );
    });

    it('should set PNG as default type', async () => {
      const plugin = playwrightPlugin();

      // Mock captureScreenshot to call the target.screenshot function
      mockCaptureScreenshot.mockImplementation(async (options) => {
        await options.target.screenshot();
        return '/path/to/screenshot.png';
      });

      await plugin.capture('png-test', mockPage);

      expect(mockPage.screenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'png'
        })
      );
    });
  });
});
