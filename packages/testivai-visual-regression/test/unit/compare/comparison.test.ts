/**
 * Tests for screenshot comparison functionality
 */

import { compareScreenshots } from '../../../src/compare';
import { ComparisonResult } from '../../../src/core/interfaces';
import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('pngjs', () => {
  return {
    PNG: class MockPNG {
      width = 100;
      height = 100;
      data = Buffer.alloc(100 * 100 * 4);
      
      constructor(options: { width?: number; height?: number } = {}) {
        if (options.width) this.width = options.width;
        if (options.height) this.height = options.height;
      }
      
      static sync: {
        read: jest.Mock;
        write: jest.Mock;
      } = {
        read: jest.fn().mockImplementation(() => {
          return { width: 100, height: 100, data: Buffer.alloc(100 * 100 * 4) };
        }),
        write: jest.fn().mockImplementation(() => Buffer.from('mock-png-data'))
      };
    }
  };
});

// Mock pixelmatch
jest.mock('pixelmatch', () => {
  return jest.fn().mockImplementation(() => 100);
});

// Get the mocked pixelmatch function
const mockPixelmatch = jest.requireMock('pixelmatch');

describe('Screenshot Comparison', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock implementation for each test
    mockPixelmatch.mockImplementation(() => 1001);
  });
  
  describe('compareScreenshots', () => {
    it('should compare two screenshots and return a comparison result', async () => {
      // Mock fs.readFileSync to return test buffers
      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('baseline')) {
          return Buffer.from('baseline-image');
        } else {
          return Buffer.from('comparison-image');
        }
      });
      
      // Mock fs.existsSync to return true
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      
      // Mock path.dirname to return the directory
      (path.dirname as jest.Mock).mockReturnValue('/path/to');
      
      // Mock path.basename to return the filename without extension
      (path.basename as jest.Mock).mockImplementation((filePath, ext) => {
        return 'test-screenshot';
      });
      
      const options = {
        baselinePath: '/path/to/baseline.png',
        comparePath: '/path/to/compare.png',
        diffPath: '/path/to/diff.png',
        threshold: 0.1
      };
      
      const result = await compareScreenshots(options);
      
      expect(fs.readFileSync).toHaveBeenCalledWith(options.baselinePath);
      expect(fs.readFileSync).toHaveBeenCalledWith(options.comparePath);
      expect(mockPixelmatch).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalledWith(options.diffPath, expect.any(Buffer));
      
      expect(result).toEqual({
        name: 'test-screenshot',
        baselinePath: options.baselinePath,
        comparePath: options.comparePath,
        diffPath: options.diffPath,
        passed: false,
        diffPercentage: expect.any(Number),
        threshold: options.threshold
      });
    });
    
    it('should handle missing baseline image', async () => {
      // Mock fs.existsSync to return false for baseline
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        return !filePath.includes('baseline');
      });
      
      const options = {
        baselinePath: '/path/to/baseline.png',
        comparePath: '/path/to/compare.png',
        diffPath: '/path/to/diff.png',
        threshold: 0.1
      };
      
      await expect(compareScreenshots(options)).rejects.toThrow('Baseline image not found');
    });
    
    it('should handle missing comparison image', async () => {
      // Mock fs.existsSync to return false for comparison
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        return !filePath.includes('compare');
      });
      
      const options = {
        baselinePath: '/path/to/baseline.png',
        comparePath: '/path/to/compare.png',
        diffPath: '/path/to/diff.png',
        threshold: 0.1
      };
      
      await expect(compareScreenshots(options)).rejects.toThrow('Comparison image not found');
    });
    
    it('should pass comparison if diff percentage is below threshold', async () => {
      // Mock fs.readFileSync to return test buffers
      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('baseline')) {
          return Buffer.from('baseline-image');
        } else {
          return Buffer.from('comparison-image');
        }
      });
      
      // Mock fs.existsSync to return true
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      
      // Mock pixelmatch to return a small diff count
      mockPixelmatch.mockImplementation(() => 10);
      
      // Mock path.dirname to return the directory
      (path.dirname as jest.Mock).mockReturnValue('/path/to');
      
      // Mock path.basename to return the filename without extension
      (path.basename as jest.Mock).mockImplementation((filePath, ext) => {
        return 'test-screenshot';
      });
      
      const options = {
        baselinePath: '/path/to/baseline.png',
        comparePath: '/path/to/compare.png',
        diffPath: '/path/to/diff.png',
        threshold: 0.1
      };
      
      const result = await compareScreenshots(options);
      
      expect(result.passed).toBe(true);
      expect(result.diffPercentage).toBeLessThan(options.threshold);
    });
  });
});
