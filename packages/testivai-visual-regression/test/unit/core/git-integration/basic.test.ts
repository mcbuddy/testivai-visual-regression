/**
 * Tests for basic Git integration functionality
 */

import { GitIntegration } from '../../../../src/core/git-integration';
import { SimpleGit } from 'simple-git';

// Mock dependencies
jest.mock('simple-git');

// Import mocked modules
const mockSimpleGit = require('simple-git');

describe('Git Integration - Basic Functionality', () => {
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
  
  describe('constructor', () => {
    it('should initialize with default working directory', () => {
      new GitIntegration();
      expect(mockSimpleGit).toHaveBeenCalledWith(undefined);
    });
    
    it('should initialize with custom working directory', () => {
      const workingDir = '/custom/path';
      new GitIntegration(workingDir);
      expect(mockSimpleGit).toHaveBeenCalledWith(workingDir);
    });
  });
  
  describe('getCurrentBranch', () => {
    it('should return current branch name', async () => {
      const branchSummary = { 
        current: 'feature/login',
        detached: false,
        all: ['feature/login'],
        branches: {}
      };
      mockGit.branchLocal.mockResolvedValue(branchSummary);
      
      const gitIntegration = new GitIntegration();
      const result = await gitIntegration.getCurrentBranch();
      
      expect(result).toBe('feature/login');
      expect(mockGit.branchLocal).toHaveBeenCalled();
    });
    
    it('should return "unknown" when Git command fails', async () => {
      mockGit.branchLocal.mockRejectedValue(new Error('Git error'));
      
      const gitIntegration = new GitIntegration();
      const result = await gitIntegration.getCurrentBranch();
      
      expect(result).toBe('unknown');
    });
    
    it('should handle various branch names', async () => {
      const testBranches = [
        'main',
        'master',
        'develop',
        'feature/user-login',
        'bugfix/fix-header',
        'release/v1.0.0'
      ];
      
      const gitIntegration = new GitIntegration();
      
      for (const branch of testBranches) {
        const branchSummary = {
          current: branch,
          detached: false,
          all: [branch],
          branches: {}
        };
        mockGit.branchLocal.mockResolvedValue(branchSummary);
        const result = await gitIntegration.getCurrentBranch();
        expect(result).toBe(branch);
      }
    });
  });
  
  describe('isGitRepository', () => {
    it('should return true when in Git repository', async () => {
      mockGit.status.mockResolvedValue({} as any);
      
      const gitIntegration = new GitIntegration();
      const result = await gitIntegration.isGitRepository();
      
      expect(result).toBe(true);
      expect(mockGit.status).toHaveBeenCalled();
    });
    
    it('should return false when not in Git repository', async () => {
      mockGit.status.mockRejectedValue(new Error('Not a git repository'));
      
      const gitIntegration = new GitIntegration();
      const result = await gitIntegration.isGitRepository();
      
      expect(result).toBe(false);
    });
    
    it('should handle various Git errors', async () => {
      const gitErrors = [
        'fatal: not a git repository',
        'fatal: not a git repository (or any of the parent directories)',
        'Permission denied'
      ];
      
      const gitIntegration = new GitIntegration();
      
      for (const errorMessage of gitErrors) {
        mockGit.status.mockRejectedValue(new Error(errorMessage));
        const result = await gitIntegration.isGitRepository();
        expect(result).toBe(false);
      }
    });
  });
  
  describe('getRepositoryRoot', () => {
    it('should return repository root path', async () => {
      mockGit.revparse.mockResolvedValue('/path/to/repo\n');
      
      const gitIntegration = new GitIntegration();
      const result = await gitIntegration.getRepositoryRoot();
      
      expect(result).toBe('/path/to/repo');
      expect(mockGit.revparse).toHaveBeenCalledWith(['--show-toplevel']);
    });
    
    it('should return null when not in Git repository', async () => {
      mockGit.revparse.mockRejectedValue(new Error('Not a git repository'));
      
      const gitIntegration = new GitIntegration();
      const result = await gitIntegration.getRepositoryRoot();
      
      expect(result).toBe(null);
    });
    
    it('should trim whitespace from repository root', async () => {
      mockGit.revparse.mockResolvedValue('  /path/to/repo  \n');
      
      const gitIntegration = new GitIntegration();
      const result = await gitIntegration.getRepositoryRoot();
      
      expect(result).toBe('/path/to/repo');
    });
  });
});
