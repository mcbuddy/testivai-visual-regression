/**
 * Tests for Git baseline management functionality
 */

import { GitIntegration, BaselineManagementOptions } from '../../../../src/core/git-integration';
import * as fs from 'fs';
import * as path from 'path';
import { SimpleGit } from 'simple-git';

// Mock dependencies
jest.mock('simple-git');
jest.mock('fs');
jest.mock('../../../../src/core/utils');

// Import mocked modules
const mockSimpleGit = require('simple-git');
const mockFs = fs as jest.Mocked<typeof fs>;
const mockUtils = require('../../../../src/core/utils');

describe('Git Integration - Baseline Management', () => {
  let mockGit: jest.Mocked<SimpleGit>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock Git instance
    mockGit = {
      branchLocal: jest.fn(),
      revparse: jest.fn(),
      raw: jest.fn(),
      status: jest.fn()
    } as any;
    
    mockSimpleGit.mockReturnValue(mockGit);
    mockUtils.ensureDirectoryExists.mockImplementation(() => {});
  });
  
  describe('manageBaseline', () => {
    const baseOptions: BaselineManagementOptions = {
      baselineDir: '.testivai/baseline',
      compareDir: '.testivai/compare',
      framework: 'playwright',
      name: 'homepage',
      currentBranch: 'feature/login'
    };
    
    it('should use baseline mode on default main branch', async () => {
      const options = { ...baseOptions, currentBranch: 'main' };
      
      const gitIntegration = new GitIntegration();
      const result = await gitIntegration.manageBaseline(options);
      
      expect(result).toEqual({
        shouldUseBaseline: true,
        baselinePath: path.join('.testivai/baseline', 'playwright', 'homepage.png'),
        comparePath: path.join('.testivai/compare', 'main', 'playwright', 'homepage.png'),
        isMainBranch: true
      });
    });
    
    it('should use baseline mode on master branch', async () => {
      const options = { ...baseOptions, currentBranch: 'master' };
      
      const gitIntegration = new GitIntegration();
      const result = await gitIntegration.manageBaseline(options);
      
      expect(result).toEqual({
        shouldUseBaseline: true,
        baselinePath: path.join('.testivai/baseline', 'playwright', 'homepage.png'),
        comparePath: path.join('.testivai/compare', 'master', 'playwright', 'homepage.png'),
        isMainBranch: true
      });
    });
    
    it('should use baseline mode on custom default branch', async () => {
      const options = { 
        ...baseOptions, 
        currentBranch: 'develop',
        defaultBranch: 'develop'
      };
      
      const gitIntegration = new GitIntegration();
      const result = await gitIntegration.manageBaseline(options);
      
      expect(result).toEqual({
        shouldUseBaseline: true,
        baselinePath: path.join('.testivai/baseline', 'playwright', 'homepage.png'),
        comparePath: path.join('.testivai/compare', 'develop', 'playwright', 'homepage.png'),
        isMainBranch: true
      });
    });
    
    it('should use baseline mode on feature branch when baseline does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const gitIntegration = new GitIntegration();
      const result = await gitIntegration.manageBaseline(baseOptions);
      
      expect(result).toEqual({
        shouldUseBaseline: true,
        baselinePath: path.join('.testivai/baseline', 'playwright', 'homepage.png'),
        comparePath: path.join('.testivai/compare', 'feature-login', 'playwright', 'homepage.png'),
        isMainBranch: false
      });
      
      expect(mockFs.existsSync).toHaveBeenCalledWith(
        path.join('.testivai/baseline', 'playwright', 'homepage.png')
      );
    });
    
    it('should use comparison mode on feature branch when baseline exists', async () => {
      mockFs.existsSync.mockReturnValue(true);
      
      const gitIntegration = new GitIntegration();
      const result = await gitIntegration.manageBaseline(baseOptions);
      
      expect(result).toEqual({
        shouldUseBaseline: false,
        baselinePath: path.join('.testivai/baseline', 'playwright', 'homepage.png'),
        comparePath: path.join('.testivai/compare', 'feature-login', 'playwright', 'homepage.png'),
        isMainBranch: false
      });
    });
    
    it('should sanitize branch names in paths', async () => {
      const testCases = [
        { input: 'feature/user-login', expected: 'feature-user-login' },
        { input: 'bugfix\\windows-path', expected: 'bugfix-windows-path' },
        { input: 'feature.dotted.branch', expected: 'feature-dotted-branch' },
        { input: 'feature with spaces', expected: 'feature-with-spaces' },
        { input: 'feature#123', expected: 'feature-123' },
        { input: 'feature:colon', expected: 'feature-colon' },
        { input: 'feature*star', expected: 'feature-star' },
        { input: 'feature?question', expected: 'feature-question' },
        { input: 'feature"quote', expected: 'feature-quote' },
        { input: 'feature<less>greater', expected: 'feature-less-greater' },
        { input: 'feature|pipe', expected: 'feature-pipe' }
      ];
      
      const gitIntegration = new GitIntegration();
      
      for (const testCase of testCases) {
        const options = {
          ...baseOptions,
          currentBranch: testCase.input
        };
        
        const result = await gitIntegration.manageBaseline(options);
        expect(result.comparePath).toContain(testCase.expected);
      }
    });
    
    it('should handle feature branch with custom default branch', async () => {
      mockFs.existsSync.mockReturnValue(true);
      
      const options = {
        ...baseOptions,
        currentBranch: 'feature/test',
        defaultBranch: 'develop'
      };
      
      const gitIntegration = new GitIntegration();
      const result = await gitIntegration.manageBaseline(options);
      
      expect(result).toEqual({
        shouldUseBaseline: false,
        baselinePath: path.join('.testivai/baseline', 'playwright', 'homepage.png'),
        comparePath: path.join('.testivai/compare', 'feature-test', 'playwright', 'homepage.png'),
        isMainBranch: false
      });
    });
    
    it('should handle different frameworks', async () => {
      const frameworks = ['playwright', 'cypress', 'puppeteer', 'selenium'];
      
      const gitIntegration = new GitIntegration();
      
      for (const framework of frameworks) {
        const options = {
          ...baseOptions,
          framework,
          currentBranch: 'main'
        };
        
        const result = await gitIntegration.manageBaseline(options);
        expect(result.baselinePath).toContain(framework);
        expect(result.comparePath).toContain(framework);
      }
    });
    
    it('should handle different screenshot names', async () => {
      const names = ['homepage', 'login-form', 'dashboard', 'user-profile'];
      
      const gitIntegration = new GitIntegration();
      
      for (const name of names) {
        const options = {
          ...baseOptions,
          name,
          currentBranch: 'main'
        };
        
        const result = await gitIntegration.manageBaseline(options);
        expect(result.baselinePath).toContain(`${name}.png`);
        expect(result.comparePath).toContain(`${name}.png`);
      }
    });
  });
  
  describe('updateBaseline', () => {
    it('should successfully update baseline from comparison', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.copyFileSync.mockImplementation(() => {});
      
      const gitIntegration = new GitIntegration();
      const result = await gitIntegration.updateBaseline(
        '/path/to/compare.png',
        '/path/to/baseline.png'
      );
      
      expect(result).toBe(true);
      expect(mockFs.existsSync).toHaveBeenCalledWith('/path/to/compare.png');
      expect(mockUtils.ensureDirectoryExists).toHaveBeenCalledWith('/path/to');
      expect(mockFs.copyFileSync).toHaveBeenCalledWith(
        '/path/to/compare.png',
        '/path/to/baseline.png'
      );
    });
    
    it('should fail when comparison file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const gitIntegration = new GitIntegration();
      const result = await gitIntegration.updateBaseline(
        '/path/to/compare.png',
        '/path/to/baseline.png'
      );
      
      expect(result).toBe(false);
      expect(mockFs.copyFileSync).not.toHaveBeenCalled();
    });
    
    it('should handle file system errors', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.copyFileSync.mockImplementation(() => {
        throw new Error('File system error');
      });
      
      const gitIntegration = new GitIntegration();
      const result = await gitIntegration.updateBaseline(
        '/path/to/compare.png',
        '/path/to/baseline.png'
      );
      
      expect(result).toBe(false);
    });
    
    it('should handle directory creation errors', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockUtils.ensureDirectoryExists.mockImplementation(() => {
        throw new Error('Directory creation error');
      });
      
      const gitIntegration = new GitIntegration();
      const result = await gitIntegration.updateBaseline(
        '/path/to/compare.png',
        '/path/to/baseline.png'
      );
      
      expect(result).toBe(false);
    });
    
    it('should handle various file paths', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.copyFileSync.mockImplementation(() => {});
      
      const testPaths = [
        {
          compare: '/absolute/path/to/compare.png',
          baseline: '/absolute/path/to/baseline.png'
        },
        {
          compare: './relative/path/compare.png',
          baseline: './relative/path/baseline.png'
        },
        {
          compare: 'simple-compare.png',
          baseline: 'simple-baseline.png'
        }
      ];
      
      const gitIntegration = new GitIntegration();
      
      for (const testPath of testPaths) {
        const result = await gitIntegration.updateBaseline(
          testPath.compare,
          testPath.baseline
        );
        
        expect(result).toBe(true);
        expect(mockFs.copyFileSync).toHaveBeenCalledWith(
          testPath.compare,
          testPath.baseline
        );
      }
    });
  });
  
  describe('Error handling in baseline management', () => {
    it('should handle file system errors in baseline check', async () => {
      mockFs.existsSync.mockImplementation(() => {
        throw new Error('File system error');
      });
      
      const options: BaselineManagementOptions = {
        baselineDir: '.testivai/baseline',
        compareDir: '.testivai/compare',
        framework: 'playwright',
        name: 'homepage',
        currentBranch: 'feature/test'
      };
      
      const gitIntegration = new GitIntegration();
      
      // Should not throw, but handle the error gracefully
      await expect(gitIntegration.manageBaseline(options)).resolves.toBeDefined();
    });
    
    it('should handle path generation with special characters', async () => {
      const options: BaselineManagementOptions = {
        baselineDir: '.testivai/baseline',
        compareDir: '.testivai/compare',
        framework: 'playwright',
        name: 'test with spaces & symbols!',
        currentBranch: 'feature/special-chars#123'
      };
      
      const gitIntegration = new GitIntegration();
      const result = await gitIntegration.manageBaseline(options);
      
      expect(result.baselinePath).toContain('test with spaces & symbols!.png');
      expect(result.comparePath).toContain('feature-special-chars-123');
    });
    
    it('should handle empty or undefined values', async () => {
      const options: BaselineManagementOptions = {
        baselineDir: '',
        compareDir: '',
        framework: 'playwright',
        name: '',
        currentBranch: ''
      };
      
      const gitIntegration = new GitIntegration();
      const result = await gitIntegration.manageBaseline(options);
      
      expect(result).toBeDefined();
      expect(result.baselinePath).toBeDefined();
      expect(result.comparePath).toBeDefined();
    });
  });
});
