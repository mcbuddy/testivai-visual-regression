/**
 * Tests for Git integration factory functions and integration
 */

import {
  createGitIntegration,
  getGitInfo,
  isMainBranch,
  manageBaseline,
  GitIntegration,
  BaselineManagementOptions
} from '../../../../src/core/git-integration';
import { SimpleGit } from 'simple-git';

// Mock dependencies
jest.mock('simple-git');

// Import mocked modules
const mockSimpleGit = require('simple-git');

describe('Git Integration - Factory Functions', () => {
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
  });
  
  describe('createGitIntegration', () => {
    it('should create GitIntegration instance', () => {
      const instance = createGitIntegration();
      expect(instance).toBeInstanceOf(GitIntegration);
    });
    
    it('should create GitIntegration instance with working directory', () => {
      const workingDir = '/custom/path';
      const instance = createGitIntegration(workingDir);
      expect(instance).toBeInstanceOf(GitIntegration);
      expect(mockSimpleGit).toHaveBeenCalledWith(workingDir);
    });
    
    it('should create multiple independent instances', () => {
      const instance1 = createGitIntegration('/path1');
      const instance2 = createGitIntegration('/path2');
      
      expect(instance1).toBeInstanceOf(GitIntegration);
      expect(instance2).toBeInstanceOf(GitIntegration);
      expect(instance1).not.toBe(instance2);
      expect(mockSimpleGit).toHaveBeenCalledWith('/path1');
      expect(mockSimpleGit).toHaveBeenCalledWith('/path2');
    });
  });
  
  describe('getGitInfo', () => {
    it('should return Git information', async () => {
      const branchSummary = { 
        current: 'main',
        detached: false,
        all: ['main'],
        branches: {}
      };
      mockGit.branchLocal.mockResolvedValue(branchSummary);
      mockGit.revparse
        .mockResolvedValueOnce('abc123def456')
        .mockResolvedValueOnce('abc123d');
      mockGit.raw
        .mockResolvedValueOnce('Test Author')
        .mockResolvedValueOnce('test@example.com')
        .mockResolvedValueOnce('2025-06-14T10:30:00Z')
        .mockResolvedValueOnce('test commit message');
      
      const result = await getGitInfo();
      
      expect(result).toHaveProperty('branch', 'main');
      expect(result).toHaveProperty('sha', 'abc123def456');
      expect(result).toHaveProperty('shortSha', 'abc123d');
      expect(result).toHaveProperty('author', 'Test Author');
      expect(result).toHaveProperty('email', 'test@example.com');
      expect(result).toHaveProperty('timestamp', '2025-06-14T10:30:00Z');
      expect(result).toHaveProperty('message', 'test commit message');
    });
    
    it('should pass working directory to GitIntegration', async () => {
      const workingDir = '/custom/path';
      await getGitInfo(workingDir);
      
      expect(mockSimpleGit).toHaveBeenCalledWith(workingDir);
    });
    
    it('should handle Git errors gracefully', async () => {
      mockGit.branchLocal.mockRejectedValue(new Error('Git error'));
      mockGit.revparse.mockRejectedValue(new Error('Git error'));
      mockGit.raw.mockRejectedValue(new Error('Git error'));
      
      const result = await getGitInfo();
      
      expect(result.branch).toBe('unknown');
      expect(result.sha).toBe('unknown');
      expect(result.shortSha).toBe('unknown');
      expect(result.author).toBe('unknown');
      expect(result.email).toBe('unknown');
      expect(result.timestamp).toBe('unknown');
      expect(result.message).toBe('unknown');
    });
  });
  
  describe('isMainBranch', () => {
    it('should check if current branch is main', async () => {
      const branchSummary = { 
        current: 'main',
        detached: false,
        all: ['main'],
        branches: {}
      };
      mockGit.branchLocal.mockResolvedValue(branchSummary);
      
      const result = await isMainBranch();
      
      expect(result).toBe(true);
    });
    
    it('should check if current branch is master', async () => {
      const branchSummary = { 
        current: 'master',
        detached: false,
        all: ['master'],
        branches: {}
      };
      mockGit.branchLocal.mockResolvedValue(branchSummary);
      
      const result = await isMainBranch();
      
      expect(result).toBe(true);
    });
    
    it('should return false for feature branch', async () => {
      const branchSummary = { 
        current: 'feature/test',
        detached: false,
        all: ['feature/test'],
        branches: {}
      };
      mockGit.branchLocal.mockResolvedValue(branchSummary);
      
      const result = await isMainBranch();
      
      expect(result).toBe(false);
    });
    
    it('should pass working directory to GitIntegration', async () => {
      const workingDir = '/custom/path';
      await isMainBranch(workingDir);
      
      expect(mockSimpleGit).toHaveBeenCalledWith(workingDir);
    });
    
    it('should handle Git errors', async () => {
      mockGit.branchLocal.mockRejectedValue(new Error('Git error'));
      
      const result = await isMainBranch();
      
      expect(result).toBe(false);
    });
  });
  
  describe('manageBaseline', () => {
    const options: BaselineManagementOptions = {
      baselineDir: '.testivai/baseline',
      compareDir: '.testivai/compare',
      framework: 'playwright',
      name: 'homepage',
      currentBranch: 'main'
    };
    
    it('should manage baseline workflow', async () => {
      const result = await manageBaseline(options);
      
      expect(result).toHaveProperty('shouldUseBaseline');
      expect(result).toHaveProperty('baselinePath');
      expect(result).toHaveProperty('comparePath');
      expect(result).toHaveProperty('isMainBranch');
    });
    
    it('should pass working directory to GitIntegration', async () => {
      const workingDir = '/custom/path';
      await manageBaseline(options, workingDir);
      
      expect(mockSimpleGit).toHaveBeenCalledWith(workingDir);
    });
    
    it('should handle custom default branch in factory function', async () => {
      const optionsWithCustomDefault = {
        ...options,
        currentBranch: 'develop',
        defaultBranch: 'develop'
      };
      
      const result = await manageBaseline(optionsWithCustomDefault);
      
      expect(result.isMainBranch).toBe(true);
      expect(result.shouldUseBaseline).toBe(true);
    });
    
    it('should handle feature branch workflow', async () => {
      const featureBranchOptions = {
        ...options,
        currentBranch: 'feature/login'
      };
      
      const result = await manageBaseline(featureBranchOptions);
      
      expect(result.isMainBranch).toBe(false);
      expect(result.comparePath).toContain('feature-login');
    });
    
    it('should handle different frameworks through factory', async () => {
      const frameworks = ['playwright', 'cypress', 'puppeteer', 'selenium'];
      
      for (const framework of frameworks) {
        const frameworkOptions = {
          ...options,
          framework
        };
        
        const result = await manageBaseline(frameworkOptions);
        expect(result.baselinePath).toContain(framework);
        expect(result.comparePath).toContain(framework);
      }
    });
  });
  
  describe('Integration tests', () => {
    it('should work with real Git workflow simulation', async () => {
      // Simulate a complete Git workflow
      const branchSummary = { 
        current: 'feature/new-component',
        detached: false,
        all: ['feature/new-component'],
        branches: {}
      };
      mockGit.branchLocal.mockResolvedValue(branchSummary);
      mockGit.revparse
        .mockResolvedValueOnce('1234567890abcdef')
        .mockResolvedValueOnce('1234567');
      mockGit.raw
        .mockResolvedValueOnce('Developer Name')
        .mockResolvedValueOnce('dev@company.com')
        .mockResolvedValueOnce('2025-06-14T15:30:00Z')
        .mockResolvedValueOnce('feat: add new component');
      
      // Get Git info
      const gitInfo = await getGitInfo('/project/path');
      expect(gitInfo.branch).toBe('feature/new-component');
      expect(gitInfo.message).toBe('feat: add new component');
      
      // Check if main branch
      const isMain = await isMainBranch('/project/path');
      expect(isMain).toBe(false);
      
      // Manage baseline
      const baselineOptions: BaselineManagementOptions = {
        baselineDir: '.testivai/baseline',
        compareDir: '.testivai/compare',
        framework: 'playwright',
        name: 'new-component',
        currentBranch: gitInfo.branch
      };
      
      const baselineResult = await manageBaseline(baselineOptions, '/project/path');
      expect(baselineResult.isMainBranch).toBe(false);
      expect(baselineResult.comparePath).toContain('feature-new-component');
    });
    
    it('should handle main branch workflow', async () => {
      const branchSummary = { 
        current: 'main',
        detached: false,
        all: ['main'],
        branches: {}
      };
      mockGit.branchLocal.mockResolvedValue(branchSummary);
      mockGit.revparse
        .mockResolvedValueOnce('abcdef1234567890')
        .mockResolvedValueOnce('abcdef1');
      mockGit.raw
        .mockResolvedValueOnce('Main Developer')
        .mockResolvedValueOnce('main@company.com')
        .mockResolvedValueOnce('2025-06-14T16:00:00Z')
        .mockResolvedValueOnce('chore: update baseline screenshots');
      
      const gitInfo = await getGitInfo();
      const isMain = await isMainBranch();
      const baselineResult = await manageBaseline({
        baselineDir: '.testivai/baseline',
        compareDir: '.testivai/compare',
        framework: 'cypress',
        name: 'homepage',
        currentBranch: gitInfo.branch
      });
      
      expect(gitInfo.branch).toBe('main');
      expect(isMain).toBe(true);
      expect(baselineResult.isMainBranch).toBe(true);
      expect(baselineResult.shouldUseBaseline).toBe(true);
    });
    
    it('should handle custom default branch workflow', async () => {
      const branchSummary = { 
        current: 'develop',
        detached: false,
        all: ['develop'],
        branches: {}
      };
      mockGit.branchLocal.mockResolvedValue(branchSummary);
      
      const baselineResult = await manageBaseline({
        baselineDir: '.testivai/baseline',
        compareDir: '.testivai/compare',
        framework: 'puppeteer',
        name: 'dashboard',
        currentBranch: 'develop',
        defaultBranch: 'develop'
      });
      
      expect(baselineResult.isMainBranch).toBe(true);
      expect(baselineResult.shouldUseBaseline).toBe(true);
    });
    
    it('should handle error scenarios across all functions', async () => {
      mockGit.branchLocal.mockRejectedValue(new Error('Not a git repository'));
      mockGit.revparse.mockRejectedValue(new Error('Not a git repository'));
      mockGit.raw.mockRejectedValue(new Error('Not a git repository'));
      
      const gitInfo = await getGitInfo();
      const isMain = await isMainBranch();
      const baselineResult = await manageBaseline({
        baselineDir: '.testivai/baseline',
        compareDir: '.testivai/compare',
        framework: 'selenium',
        name: 'error-test',
        currentBranch: 'unknown'
      });
      
      expect(gitInfo.branch).toBe('unknown');
      expect(isMain).toBe(false);
      expect(baselineResult.isMainBranch).toBe(false);
    });
  });
});
