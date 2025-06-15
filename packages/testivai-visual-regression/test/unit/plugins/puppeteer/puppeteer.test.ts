/**
 * Tests for Puppeteer plugin
 */

import * as fs from 'fs';
import * as path from 'path';
import { puppeteerPlugin } from '../../../../src/plugins/puppeteer';
import { PuppeteerConfig } from '../../../../src/config/puppeteer';

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn()
}));

// Mock path
jest.mock('path', () => ({
  dirname: jest.fn().mockReturnValue('/mock/dir'),
  join: jest.fn().mockImplementation((...args) => args.join('/'))
}));

describe('Puppeteer Plugin', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
  });
  
  describe('initialization', () => {
    it('should create a plugin with default options', () => {
      const plugin = puppeteerPlugin();
      
      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('puppeteer-plugin');
      expect(typeof plugin.init).toBe('function');
      expect(typeof plugin.capture).toBe('function');
    });
    
    it('should initialize with custom config', () => {
      const config: PuppeteerConfig = {
        framework: 'puppeteer',
        baselineDir: 'custom/baseline',
        diffThreshold: 0.2,
        updateBaselines: true,
        puppeteer: {
          timeout: 60000
        }
      };
      
      const plugin = puppeteerPlugin({ config });
      plugin.init({ config });
      
      // We can't directly test the internal state, but we can test the behavior
      // in the capture method tests
    });
  });
  
  describe('capture', () => {
    it('should validate page object', async () => {
      const plugin = puppeteerPlugin();
      
      // Test with null page
      await expect(plugin.capture('test', null)).rejects.toThrow('Puppeteer page is required');
      
      // Test with invalid page (missing screenshot method)
      await expect(plugin.capture('test', {})).rejects.toThrow('Invalid Puppeteer page: missing screenshot method');
      
      // Test with invalid page (missing $ method)
      await expect(plugin.capture('test', { screenshot: jest.fn() })).rejects.toThrow('Invalid Puppeteer page: missing $ method');
    });
    
    it('should create directory if it does not exist', async () => {
      const plugin = puppeteerPlugin();
      
      // Mock directory does not exist
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      
      // Create mock page
      const mockPage = createMockPage();
      
      // Capture screenshot
      await plugin.capture('test', mockPage);
      
      // Check if directory was created
      expect(fs.mkdirSync).toHaveBeenCalledWith('/mock/dir', { recursive: true });
    });
    
    it('should generate name from URL if not provided', async () => {
      const plugin = puppeteerPlugin();
      
      // Create mock page with URL
      const mockPage = createMockPage();
      mockPage.url.mockReturnValue('https://example.com/path/to/page');
      
      // Capture screenshot without name
      await plugin.capture(undefined, mockPage);
      
      // Check if screenshot was taken with generated name
      expect(path.join).toHaveBeenCalledWith('.testivai/baseline', 'example.com_path_to_page.png');
      expect(mockPage.screenshot).toHaveBeenCalled();
    });
    
    it('should capture full page screenshot', async () => {
      const plugin = puppeteerPlugin();
      
      // Create mock page
      const mockPage = createMockPage();
      
      // Capture full page screenshot
      await plugin.capture('test', mockPage, { fullPage: true });
      
      // Check if screenshot was taken with fullPage option
      expect(mockPage.screenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '.testivai/baseline/test.png',
          fullPage: true
        })
      );
    });
    
    it('should capture element screenshot', async () => {
      const plugin = puppeteerPlugin();
      
      // Create mock page with element
      const mockPage = createMockPage();
      const mockElement = {
        screenshot: jest.fn().mockResolvedValue(Buffer.from('mock-screenshot')),
        boundingBox: jest.fn().mockResolvedValue({ x: 10, y: 20, width: 100, height: 200 })
      };
      mockPage.$.mockResolvedValue(mockElement);
      
      // Capture element screenshot
      await plugin.capture('test', mockPage, { selector: '.element' });
      
      // Check if element was selected
      expect(mockPage.$).toHaveBeenCalledWith('.element');
      
      // Check if element screenshot was taken
      expect(mockElement.screenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '.testivai/baseline/test.png',
          clip: { x: 10, y: 20, width: 100, height: 200 }
        })
      );
    });
    
    it('should throw error if element not found', async () => {
      const plugin = puppeteerPlugin();
      
      // Create mock page with no element
      const mockPage = createMockPage();
      mockPage.$.mockResolvedValue(null);
      
      // Capture element screenshot
      await expect(plugin.capture('test', mockPage, { selector: '.missing' }))
        .rejects.toThrow('Element not found: .missing');
    });
    
    it('should throw error if element has no dimensions', async () => {
      const plugin = puppeteerPlugin();
      
      // Create mock page with element that has no dimensions
      const mockPage = createMockPage();
      const mockElement = {
        screenshot: jest.fn(),
        boundingBox: jest.fn().mockResolvedValue(null)
      };
      mockPage.$.mockResolvedValue(mockElement);
      
      // Capture element screenshot
      await expect(plugin.capture('test', mockPage, { selector: '.invisible' }))
        .rejects.toThrow('Element has no dimensions: .invisible');
    });
    
    it('should perform waits before taking screenshot', async () => {
      // Create plugin with wait options
      const config: PuppeteerConfig = {
        framework: 'puppeteer',
        baselineDir: '.testivai/baseline',
        puppeteer: {
          waitOptions: {
            waitForAnimations: true,
            waitForNetworkIdle: true,
            waitForSelectors: ['.ready', '#loaded']
          }
        }
      };
      const plugin = puppeteerPlugin({ config });
      
      // Create mock page
      const mockPage = createMockPage();
      
      // Capture screenshot
      await plugin.capture('test', mockPage);
      
      // Check if waits were performed
      expect(mockPage.evaluate).toHaveBeenCalled(); // For animations
      expect(mockPage.waitForSelector).toHaveBeenCalledWith('.ready', expect.any(Object));
      expect(mockPage.waitForSelector).toHaveBeenCalledWith('#loaded', expect.any(Object));
    });
  });
});

/**
 * Create a mock Puppeteer page for testing
 */
function createMockPage() {
  return {
    screenshot: jest.fn().mockResolvedValue(Buffer.from('mock-screenshot')),
    $: jest.fn(),
    $eval: jest.fn(),
    evaluate: jest.fn().mockImplementation((fn) => {
      if (typeof fn === 'function') {
        return Promise.resolve(fn());
      }
      return Promise.resolve();
    }),
    waitForSelector: jest.fn().mockResolvedValue({}),
    waitForNavigation: jest.fn().mockResolvedValue({}),
    waitForNetworkIdle: jest.fn().mockResolvedValue({}),
    url: jest.fn().mockReturnValue('https://example.com')
  };
}
