/**
 * Tests for screenshot capture functionality
 */

import { captureScreenshot } from '../../../src/capture';
import { ensureDirectoryExists, getScreenshotPath } from '../../../src/core/utils';
import { ScreenshotOptions, FrameworkType } from '../../../src/core/interfaces';
import * as fs from 'fs';
import * as path from 'path';

// Mock dependencies
jest.mock('fs');
jest.mock('../../../src/core/utils');

describe('Screenshot Capture', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('captureScreenshot', () => {
    it('should capture a screenshot and save it to the specified path', async () => {
      // Mock getScreenshotPath to return a test path
      const mockPath = '/path/to/screenshot.png';
      (getScreenshotPath as jest.Mock).mockReturnValue(mockPath);
      
      // Mock ensureDirectoryExists to do nothing
      (ensureDirectoryExists as jest.Mock).mockImplementation(() => {});
      
      // Mock fs.writeFileSync to do nothing
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
      
      const options = {
        baselineDir: '.testivAI/visual-regression/baseline',
        framework: 'playwright' as FrameworkType,
        name: 'test-screenshot',
        branch: 'main',
        isBaseline: true,
        target: { screenshot: jest.fn().mockResolvedValue(Buffer.from('test')) },
        screenshotOptions: { fullPage: true } as ScreenshotOptions
      };
      
      const result = await captureScreenshot(options);
      
      expect(getScreenshotPath).toHaveBeenCalledWith({
        baselineDir: options.baselineDir,
        framework: options.framework,
        name: options.name,
        branch: options.branch,
        isBaseline: options.isBaseline
      });
      
      expect(ensureDirectoryExists).toHaveBeenCalledWith(path.dirname(mockPath));
      expect(options.target.screenshot).toHaveBeenCalledWith(options.screenshotOptions);
      expect(fs.writeFileSync).toHaveBeenCalledWith(mockPath, Buffer.from('test'));
      expect(result).toBe(mockPath);
    });
    
    it('should handle errors during screenshot capture', async () => {
      // Mock getScreenshotPath to return a test path
      const mockPath = '/path/to/screenshot.png';
      (getScreenshotPath as jest.Mock).mockReturnValue(mockPath);
      
      // Mock ensureDirectoryExists to do nothing
      (ensureDirectoryExists as jest.Mock).mockImplementation(() => {});
      
      // Mock target.screenshot to throw an error
      const error = new Error('Screenshot capture failed');
      const options = {
        baselineDir: '.testivAI/visual-regression/baseline',
        framework: 'playwright' as FrameworkType,
        name: 'test-screenshot',
        branch: 'main',
        isBaseline: true,
        target: { screenshot: jest.fn().mockRejectedValue(error) },
        screenshotOptions: { fullPage: true } as ScreenshotOptions
      };
      
      await expect(captureScreenshot(options)).rejects.toThrow('Screenshot capture failed');
      
      expect(getScreenshotPath).toHaveBeenCalledWith({
        baselineDir: options.baselineDir,
        framework: options.framework,
        name: options.name,
        branch: options.branch,
        isBaseline: options.isBaseline
      });
      
      expect(ensureDirectoryExists).toHaveBeenCalledWith(path.dirname(mockPath));
      expect(options.target.screenshot).toHaveBeenCalledWith(options.screenshotOptions);
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
    
    it('should use default screenshot options if not provided', async () => {
      // Mock getScreenshotPath to return a test path
      const mockPath = '/path/to/screenshot.png';
      (getScreenshotPath as jest.Mock).mockReturnValue(mockPath);
      
      // Mock ensureDirectoryExists to do nothing
      (ensureDirectoryExists as jest.Mock).mockImplementation(() => {});
      
      // Mock fs.writeFileSync to do nothing
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
      
      const options = {
        baselineDir: '.testivAI/visual-regression/baseline',
        framework: 'playwright' as FrameworkType,
        name: 'test-screenshot',
        branch: 'main',
        isBaseline: true,
        target: { screenshot: jest.fn().mockResolvedValue(Buffer.from('test')) }
      };
      
      const result = await captureScreenshot(options);
      
      expect(options.target.screenshot).toHaveBeenCalledWith({});
      expect(result).toBe(mockPath);
    });
  });
});
