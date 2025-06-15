/**
 * Tests for Git information functionality
 */

import { GitIntegration } from '../../../../src/core/git-integration';
import { SimpleGit } from 'simple-git';

// Mock dependencies
jest.mock('simple-git');

// Import mocked modules
const mockSimpleGit = require('simple-git');

describe('Git Integration - Git Information', () => {
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
  
  describe('getGitInfo', () => {
    it('should return comprehensive Git information', async () => {
      const branchSummary = { 
        current: 'feature/login',
        detached: false,
        all: ['feature/login'],
        branches: {}
      };
      mockGit.branchLocal.mockResolvedValue(branchSummary);
      mockGit.revparse
        .mockResolvedValueOnce('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0')
        .mockResolvedValueOnce('a1b2c3d');
      mockGit.raw
        .mockResolvedValueOnce('John Doe')
        .mockResolvedValueOnce('john.doe@example.com')
        .mockResolvedValueOnce('2025-06-13T20:15:00Z')
        .mockResolvedValueOnce('feat: add login functionality');
      
      const gitIntegration = new GitIntegration();
      const result = await gitIntegration.getGitInfo();
      
      expect(result).toEqual({
        branch: 'feature/login',
        sha: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
        shortSha: 'a1b2c3d',
        author: 'John Doe',
        email: 'john.doe@example.com',
        timestamp: '2025-06-13T20:15:00Z',
        message: 'feat: add login functionality'
      });
    });
    
    it('should return unknown values when Git commands fail', async () => {
      mockGit.branchLocal.mockRejectedValue(new Error('Git error'));
      mockGit.revparse.mockRejectedValue(new Error('Git error'));
      mockGit.raw.mockRejectedValue(new Error('Git error'));
      
      const gitIntegration = new GitIntegration();
      const result = await gitIntegration.getGitInfo();
      
      expect(result).toEqual({
        branch: 'unknown',
        sha: 'unknown',
        shortSha: 'unknown',
        author: 'unknown',
        email: 'unknown',
        timestamp: 'unknown',
        message: 'unknown'
      });
    });
    
    it('should handle partial Git command failures', async () => {
      const branchSummary = { 
        current: 'main',
        detached: false,
        all: ['main'],
        branches: {}
      };
      mockGit.branchLocal.mockResolvedValue(branchSummary);
      mockGit.revparse
        .mockResolvedValueOnce('full-sha-here')
        .mockRejectedValueOnce(new Error('SHA error'));
      mockGit.raw
        .mockResolvedValueOnce('Jane Smith')
        .mockRejectedValueOnce(new Error('Git log error'))
        .mockRejectedValueOnce(new Error('Git log error'))
        .mockRejectedValueOnce(new Error('Git log error'));
      
      const gitIntegration = new GitIntegration();
      const result = await gitIntegration.getGitInfo();
      
      expect(result).toEqual({
        branch: 'main',
        sha: 'full-sha-here',
        shortSha: 'unknown',
        author: 'Jane Smith',
        email: 'unknown',
        timestamp: 'unknown',
        message: 'unknown'
      });
    });
    
    it('should handle empty Git responses', async () => {
      const branchSummary = { 
        current: 'empty-branch',
        detached: false,
        all: ['empty-branch'],
        branches: {}
      };
      mockGit.branchLocal.mockResolvedValue(branchSummary);
      mockGit.revparse.mockResolvedValue('');
      mockGit.raw.mockResolvedValue('');
      
      const gitIntegration = new GitIntegration();
      const result = await gitIntegration.getGitInfo();
      
      expect(result.branch).toBe('empty-branch');
      expect(result.sha).toBe('');
      expect(result.shortSha).toBe('');
      expect(result.author).toBe('');
      expect(result.email).toBe('');
      expect(result.timestamp).toBe('');
      expect(result.message).toBe('');
    });
    
    it('should handle special characters in Git information', async () => {
      const branchSummary = { 
        current: 'feature/special-chars',
        detached: false,
        all: ['feature/special-chars'],
        branches: {}
      };
      mockGit.branchLocal.mockResolvedValue(branchSummary);
      mockGit.revparse.mockResolvedValue('abc123def456');
      mockGit.raw
        .mockResolvedValueOnce('José García')
        .mockResolvedValueOnce('josé.garcía@example.com')
        .mockResolvedValueOnce('2025-06-13T20:15:00Z')
        .mockResolvedValueOnce('fix: handle special chars in "quotes" & symbols');
      
      const gitIntegration = new GitIntegration();
      const result = await gitIntegration.getGitInfo();
      
      expect(result.author).toBe('José García');
      expect(result.email).toBe('josé.garcía@example.com');
      expect(result.message).toBe('fix: handle special chars in "quotes" & symbols');
    });
  });
  
  describe('isMainBranch', () => {
    it('should return true for default main branch', async () => {
      const branchSummary = { 
        current: 'main',
        detached: false,
        all: ['main'],
        branches: {}
      };
      mockGit.branchLocal.mockResolvedValue(branchSummary);
      
      const gitIntegration = new GitIntegration();
      const result = await gitIntegration.isMainBranch();
      
      expect(result).toBe(true);
    });
    
    it('should return true for master branch', async () => {
      const branchSummary = { 
        current: 'master',
        detached: false,
        all: ['master'],
        branches: {}
      };
      mockGit.branchLocal.mockResolvedValue(branchSummary);
      
      const gitIntegration = new GitIntegration();
      const result = await gitIntegration.isMainBranch();
      
      expect(result).toBe(true);
    });
    
    it('should return false for feature branch', async () => {
      const branchSummary = { 
        current: 'feature/login',
        detached: false,
        all: ['feature/login'],
        branches: {}
      };
      mockGit.branchLocal.mockResolvedValue(branchSummary);
      
      const gitIntegration = new GitIntegration();
      const result = await gitIntegration.isMainBranch();
      
      expect(result).toBe(false);
    });
    
    it('should check specific branch when provided', async () => {
      const gitIntegration = new GitIntegration();
      
      expect(await gitIntegration.isMainBranch('main')).toBe(true);
      expect(await gitIntegration.isMainBranch('master')).toBe(true);
      expect(await gitIntegration.isMainBranch('feature/test')).toBe(false);
      
      // Should not call Git when branch is provided
      expect(mockGit.branchLocal).not.toHaveBeenCalled();
    });
    
    it('should use custom default branch', async () => {
      const gitIntegration = new GitIntegration();
      
      expect(await gitIntegration.isMainBranch('develop', 'develop')).toBe(true);
      expect(await gitIntegration.isMainBranch('main', 'develop')).toBe(false);
      expect(await gitIntegration.isMainBranch('master', 'develop')).toBe(true); // master is always considered main
    });
    
    it('should handle various custom default branches', async () => {
      const gitIntegration = new GitIntegration();
      
      const testCases = [
        { branch: 'trunk', defaultBranch: 'trunk', expected: true },
        { branch: 'production', defaultBranch: 'production', expected: true },
        { branch: 'stable', defaultBranch: 'stable', expected: true },
        { branch: 'release', defaultBranch: 'main', expected: false },
        { branch: 'master', defaultBranch: 'trunk', expected: true }, // master always true
      ];
      
      for (const testCase of testCases) {
        const result = await gitIntegration.isMainBranch(testCase.branch, testCase.defaultBranch);
        expect(result).toBe(testCase.expected);
      }
    });
    
    it('should handle Git errors when detecting current branch', async () => {
      mockGit.branchLocal.mockRejectedValue(new Error('Git error'));
      
      const gitIntegration = new GitIntegration();
      const result = await gitIntegration.isMainBranch();
      
      expect(result).toBe(false); // 'unknown' branch is not main
    });
  });
});
