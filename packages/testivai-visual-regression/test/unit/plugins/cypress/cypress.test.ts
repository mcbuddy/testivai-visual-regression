/**
 * Tests for Cypress plugin
 */

import * as fs from 'fs';
import * as path from 'path';
import { cypressPlugin } from '../../../../src/plugins/cypress';
import { CypressConfig } from '../../../../src/config/cypress';

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

describe('Cypress Plugin', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
  });
  
  describe('initialization', () => {
    it('should create a plugin with default options', () => {
      const plugin = cypressPlugin();
      
      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('cypress-plugin');
      expect(typeof plugin.init).toBe('function');
      expect(typeof plugin.capture).toBe('function');
    });
    
    it('should initialize with custom config', () => {
      const config: CypressConfig = {
        framework: 'cypress',
        baselineDir: 'custom/baseline',
        diffThreshold: 0.2,
        updateBaselines: true,
        cypress: {
          timeout: 60000
        }
      };
      
      const plugin = cypressPlugin({ config });
      plugin.init({ config });
      
      // We can't directly test the internal state, but we can test the behavior
      // in the capture method tests
    });
  });
  
  describe('capture', () => {
    it('should validate Cypress object', async () => {
      const plugin = cypressPlugin();
      
      // Test with null Cypress
      await expect(plugin.capture('test', null)).rejects.toThrow('Cypress instance is required');
      
      // Test with invalid Cypress (missing screenshot method)
      await expect(plugin.capture('test', {})).rejects.toThrow('Invalid Cypress instance: missing screenshot method');
      
      // Test with invalid Cypress (missing get method)
      await expect(plugin.capture('test', { screenshot: jest.fn() })).rejects.toThrow('Invalid Cypress instance: missing get method');
    });
    
    it('should create directory if it does not exist', async () => {
      const plugin = cypressPlugin();
      
      // Mock directory does not exist
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      
      // Create mock Cypress
      const mockCypress = createMockCypress();
      
      // Capture screenshot
      await plugin.capture('test', mockCypress);
      
      // Check if directory was created
      expect(fs.mkdirSync).toHaveBeenCalledWith('/mock/dir', { recursive: true });
    });
    
    it('should generate name from URL if not provided', async () => {
      const plugin = cypressPlugin();
      
      // Create mock Cypress with URL
      const mockCypress = createMockCypress();
      mockCypress.url.mockReturnValue('https://example.com/path/to/page');
      
      // Capture screenshot without name
      await plugin.capture(undefined, mockCypress);
      
      // Check if screenshot was taken with generated name
      expect(path.join).toHaveBeenCalledWith('.testivai/baseline', 'example.com_path_to_page.png');
      expect(mockCypress.screenshot).toHaveBeenCalled();
    });
    
    it('should capture full page screenshot', async () => {
      const plugin = cypressPlugin();
      
      // Create mock Cypress
      const mockCypress = createMockCypress();
      
      // Capture full page screenshot
      await plugin.capture('test', mockCypress, { fullPage: true });
      
      // Check if screenshot was taken with fullPage option
      expect(mockCypress.screenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          capture: 'fullPage',
          path: '.testivai/baseline/test.png'
        })
      );
    });
    
    it('should capture element screenshot', async () => {
      const plugin = cypressPlugin();
      
      // Create mock Cypress with element
      const mockCypress = createMockCypress();
      const mockElement = {
        screenshot: jest.fn().mockResolvedValue('mock-screenshot-path'),
        should: jest.fn().mockReturnThis(),
        wait: jest.fn().mockReturnThis()
      };
      mockCypress.get.mockReturnValue(mockElement);
      
      // Capture element screenshot
      await plugin.capture('test', mockCypress, { selector: '.element' });
      
      // Check if element was selected
      expect(mockCypress.get).toHaveBeenCalledWith('.element');
      
      // Check if element screenshot was taken
      expect(mockElement.screenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '.testivai/baseline/test.png'
        })
      );
    });
    
    it('should handle element screenshot errors', async () => {
      const plugin = cypressPlugin();
      
      // Create mock Cypress with element that throws error
      const mockCypress = createMockCypress();
      const mockElement = {
        screenshot: jest.fn().mockRejectedValue(new Error('Element screenshot failed')),
        should: jest.fn().mockReturnThis(),
        wait: jest.fn().mockReturnThis()
      };
      mockCypress.get.mockReturnValue(mockElement);
      
      // Capture element screenshot
      await expect(plugin.capture('test', mockCypress, { selector: '.element' }))
        .rejects.toThrow('Failed to capture element screenshot: Element screenshot failed');
    });
    
    it('should handle page screenshot errors', async () => {
      const plugin = cypressPlugin();
      
      // Create mock Cypress that throws error on screenshot
      const mockCypress = createMockCypress();
      mockCypress.screenshot.mockRejectedValue(new Error('Page screenshot failed'));
      
      // Capture page screenshot
      await expect(plugin.capture('test', mockCypress))
        .rejects.toThrow('Failed to capture page screenshot: Page screenshot failed');
    });
    
    it('should set viewport if configured', async () => {
      // Create plugin with viewport configuration
      const config: CypressConfig = {
        framework: 'cypress',
        baselineDir: '.testivai/baseline',
        cypress: {
          viewport: {
            width: 1920,
            height: 1080,
            autoSet: true
          }
        }
      };
      const plugin = cypressPlugin({ config });
      
      // Create mock Cypress
      const mockCypress = createMockCypress();
      
      // Capture screenshot
      await plugin.capture('test', mockCypress);
      
      // Check if viewport was set
      expect(mockCypress.viewport).toHaveBeenCalledWith(1920, 1080);
    });
    
    it('should not set viewport if autoSet is false', async () => {
      // Create plugin with viewport configuration
      const config: CypressConfig = {
        framework: 'cypress',
        baselineDir: '.testivai/baseline',
        cypress: {
          viewport: {
            width: 1920,
            height: 1080,
            autoSet: false
          }
        }
      };
      const plugin = cypressPlugin({ config });
      
      // Create mock Cypress
      const mockCypress = createMockCypress();
      
      // Capture screenshot
      await plugin.capture('test', mockCypress);
      
      // Check if viewport was not set
      expect(mockCypress.viewport).not.toHaveBeenCalled();
    });
    
    it('should perform waits before taking screenshot', async () => {
      // Create plugin with wait options
      const config: CypressConfig = {
        framework: 'cypress',
        baselineDir: '.testivai/baseline',
        cypress: {
          waitOptions: {
            waitForAnimations: true,
            waitForStability: true,
            stabilizationTime: 1000,
            waitForSelectors: ['.ready', '#loaded']
          }
        }
      };
      const plugin = cypressPlugin({ config });
      
      // Create mock Cypress
      const mockCypress = createMockCypress();
      const mockElement = {
        screenshot: jest.fn().mockResolvedValue('mock-screenshot-path'),
        should: jest.fn().mockReturnThis(),
        wait: jest.fn().mockReturnThis()
      };
      mockCypress.get.mockReturnValue(mockElement);
      
      // Capture screenshot
      await plugin.capture('test', mockCypress);
      
      // Check if waits were performed
      expect(mockCypress.config).toHaveBeenCalledWith('animationDistanceThreshold');
      expect(mockCypress.wait).toHaveBeenCalledWith(1000); // stabilizationTime
      expect(mockCypress.get).toHaveBeenCalledWith('.ready');
      expect(mockCypress.get).toHaveBeenCalledWith('#loaded');
    });
    
    it('should register custom commands if configured', async () => {
      // Create plugin with command options
      const config: CypressConfig = {
        framework: 'cypress',
        baselineDir: '.testivai/baseline',
        cypress: {
          commandOptions: {
            commandName: 'customVisualTest',
            registerCommands: true
          }
        }
      };
      const plugin = cypressPlugin({ config });
      
      // Create mock Cypress with Commands
      const mockCypress = createMockCypress();
      mockCypress.Commands = {
        add: jest.fn()
      } as any;
      
      // Capture screenshot
      await plugin.capture('test', mockCypress);
      
      // Check if command was registered
      expect(mockCypress.Commands.add).toHaveBeenCalledWith(
        'customVisualTest',
        expect.any(Function)
      );
    });
    
    it('should not register custom commands if disabled', async () => {
      // Create plugin with command options disabled
      const config: CypressConfig = {
        framework: 'cypress',
        baselineDir: '.testivai/baseline',
        cypress: {
          commandOptions: {
            commandName: 'customVisualTest',
            registerCommands: false
          }
        }
      };
      const plugin = cypressPlugin({ config });
      
      // Create mock Cypress with Commands
      const mockCypress = createMockCypress();
      mockCypress.Commands = {
        add: jest.fn()
      };
      
      // Capture screenshot
      await plugin.capture('test', mockCypress);
      
      // Check if command was not registered
      expect(mockCypress.Commands.add).not.toHaveBeenCalled();
    });
  });
});

/**
 * Create a mock Cypress object for testing
 */
function createMockCypress() {
  return {
    screenshot: jest.fn().mockResolvedValue('mock-screenshot-path'),
    get: jest.fn(),
    wait: jest.fn().mockResolvedValue(undefined),
    url: jest.fn().mockReturnValue('https://example.com'),
    viewport: jest.fn(),
    config: jest.fn().mockReturnValue(0),
    Commands: undefined as any
  };
}
