/**
 * Tests for utility functions
 */

import { 
  ensureDirectoryExists, 
  getScreenshotPath, 
  getCurrentBranch,
  isMainBranch
} from '../../../src/core/utils';
import * as fs from 'fs';
import * as path from 'path';
import { SimpleGit } from 'simple-git';

// Mock fs and simple-git
jest.mock('fs');
jest.mock('simple-git');

describe('Utility Functions', () => {
  describe('ensureDirectoryExists', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    
    it('should create directory if it does not exist', () => {
      // Mock fs.existsSync to return false (directory does not exist)
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      
      // Mock fs.mkdirSync
      const mkdirSyncMock = fs.mkdirSync as jest.Mock;
      
      ensureDirectoryExists('/path/to/directory');
      
      expect(fs.existsSync).toHaveBeenCalledWith('/path/to/directory');
      expect(mkdirSyncMock).toHaveBeenCalledWith('/path/to/directory', { recursive: true });
    });
    
    it('should not create directory if it already exists', () => {
      // Mock fs.existsSync to return true (directory exists)
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      
      // Mock fs.mkdirSync
      const mkdirSyncMock = fs.mkdirSync as jest.Mock;
      
      ensureDirectoryExists('/path/to/directory');
      
      expect(fs.existsSync).toHaveBeenCalledWith('/path/to/directory');
      expect(mkdirSyncMock).not.toHaveBeenCalled();
    });
  });
  
  describe('getScreenshotPath', () => {
    it('should generate path for baseline screenshot', () => {
      const result = getScreenshotPath({
        baselineDir: '.testivai/visual-regression/baseline',
        framework: 'playwright',
        name: 'homepage',
        branch: 'main',
        isBaseline: true
      });
      
      expect(result).toBe(
        path.join('.testivai/visual-regression/baseline', 'playwright', 'homepage.png')
      );
    });
    
    it('should generate path for comparison screenshot', () => {
      const result = getScreenshotPath({
        baselineDir: '.testivai/visual-regression/baseline',
        compareDir: '.testivai/visual-regression/compare',
        framework: 'cypress',
        name: 'login-form',
        branch: 'feature/login',
        isBaseline: false
      });
      
      expect(result).toBe(
        path.join('.testivai/visual-regression/compare', 'feature-login', 'cypress', 'login-form.png')
      );
    });
    
    it('should sanitize branch name in path', () => {
      const result = getScreenshotPath({
        baselineDir: '.testivai/visual-regression/baseline',
        compareDir: '.testivai/visual-regression/compare',
        framework: 'puppeteer',
        name: 'dashboard',
        branch: 'feature/user-dashboard#123',
        isBaseline: false
      });
      
      expect(result).toBe(
        path.join('.testivai/visual-regression/compare', 'feature-user-dashboard-123', 'puppeteer', 'dashboard.png')
      );
    });
  });
  
  describe('getCurrentBranch', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    
    it('should return current branch name', async () => {
      // Mock simple-git
      const branchMock = {
        current: 'feature/login'
      };
      
      const gitMock = {
        branchLocal: jest.fn().mockResolvedValue(branchMock)
      } as unknown as SimpleGit;
      
      const result = await getCurrentBranch(gitMock);
      
      expect(result).toBe('feature/login');
      expect(gitMock.branchLocal).toHaveBeenCalled();
    });
    
    it('should return "unknown" if git command fails', async () => {
      // Mock simple-git to throw an error
      const gitMock = {
        branchLocal: jest.fn().mockRejectedValue(new Error('Git error'))
      } as unknown as SimpleGit;
      
      const result = await getCurrentBranch(gitMock);
      
      expect(result).toBe('unknown');
      expect(gitMock.branchLocal).toHaveBeenCalled();
    });
  });
  
  describe('isMainBranch', () => {
    it('should return true for main branch', () => {
      expect(isMainBranch('main')).toBe(true);
      expect(isMainBranch('master')).toBe(true);
    });
    
    it('should return false for feature branches', () => {
      expect(isMainBranch('feature/login')).toBe(false);
      expect(isMainBranch('develop')).toBe(false);
      expect(isMainBranch('release/1.0.0')).toBe(false);
    });
  });
});
