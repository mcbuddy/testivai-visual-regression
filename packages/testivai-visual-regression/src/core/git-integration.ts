/**
 * Git integration module for TestiVAI Visual Regression
 */

import simpleGit, { SimpleGit } from 'simple-git';
import * as fs from 'fs';
import * as path from 'path';
import { ensureDirectoryExists } from './utils';

/**
 * Git information interface
 */
export interface GitInfo {
  branch: string;
  sha: string;
  shortSha: string;
  author: string;
  email: string;
  timestamp: string;
  message: string;
}

/**
 * Baseline management options
 */
export interface BaselineManagementOptions {
  baselineDir: string;
  compareDir: string;
  framework: string;
  name: string;
  currentBranch: string;
  defaultBranch?: string;
}

/**
 * Baseline management result
 */
export interface BaselineManagementResult {
  shouldUseBaseline: boolean;
  baselinePath: string;
  comparePath: string;
  isMainBranch: boolean;
}

/**
 * Git integration class for managing Git-based workflows
 */
export class GitIntegration {
  private git: SimpleGit;
  
  constructor(workingDir?: string) {
    this.git = simpleGit(workingDir);
  }
  
  /**
   * Get current Git branch
   * @returns Current branch name or 'unknown' if not in a Git repository
   */
  async getCurrentBranch(): Promise<string> {
    try {
      const branchSummary = await this.git.branchLocal();
      return branchSummary.current;
    } catch (error) {
      console.error('Error getting current branch:', error);
      return 'unknown';
    }
  }
  
  /**
   * Get comprehensive Git information
   * @returns Git information object
   */
  async getGitInfo(): Promise<GitInfo> {
    try {
      const [
        branch,
        sha,
        shortSha,
        author,
        email,
        timestamp,
        message
      ] = await Promise.all([
        this.getCurrentBranch(),
        this.git.revparse(['HEAD']).catch(() => 'unknown'),
        this.git.revparse(['--short', 'HEAD']).catch(() => 'unknown'),
        this.git.raw(['log', '-1', '--pretty=format:%an']).catch(() => 'unknown'),
        this.git.raw(['log', '-1', '--pretty=format:%ae']).catch(() => 'unknown'),
        this.git.raw(['log', '-1', '--pretty=format:%aI']).catch(() => 'unknown'),
        this.git.raw(['log', '-1', '--pretty=format:%s']).catch(() => 'unknown')
      ]);
      
      return {
        branch,
        sha,
        shortSha,
        author,
        email,
        timestamp,
        message
      };
    } catch (error) {
      console.error('Error getting Git info:', error);
      return {
        branch: 'unknown',
        sha: 'unknown',
        shortSha: 'unknown',
        author: 'unknown',
        email: 'unknown',
        timestamp: 'unknown',
        message: 'unknown'
      };
    }
  }
  
  /**
   * Check if current branch is a main branch
   * @param branch Branch name (optional, will detect current branch if not provided)
   * @param defaultBranch Default branch name (defaults to 'main')
   * @returns True if the branch matches the default branch or is 'master'
   */
  async isMainBranch(branch?: string, defaultBranch: string = 'main'): Promise<boolean> {
    const currentBranch = branch || await this.getCurrentBranch();
    return currentBranch === defaultBranch || currentBranch === 'master';
  }
  
  /**
   * Check if we're in a Git repository
   * @returns True if in a Git repository
   */
  async isGitRepository(): Promise<boolean> {
    try {
      await this.git.status();
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get the root directory of the Git repository
   * @returns Path to Git repository root or null if not in a Git repository
   */
  async getRepositoryRoot(): Promise<string | null> {
    try {
      const root = await this.git.revparse(['--show-toplevel']);
      return root.trim();
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Manage baseline workflow based on Git branch
   * @param options Baseline management options
   * @returns Baseline management result
   */
  async manageBaseline(options: BaselineManagementOptions): Promise<BaselineManagementResult> {
    const { baselineDir, compareDir, framework, name, currentBranch, defaultBranch = 'main' } = options;
    
    const isMain = await this.isMainBranch(currentBranch, defaultBranch);
    const sanitizedBranch = this.sanitizeBranchName(currentBranch);
    
    // Generate paths
    const baselinePath = path.join(baselineDir, framework, `${name}.png`);
    const comparePath = path.join(compareDir, sanitizedBranch, framework, `${name}.png`);
    
    // Determine if we should use baseline
    let shouldUseBaseline = false;
    
    if (isMain) {
      // On main branch, always use baseline mode
      shouldUseBaseline = true;
    } else {
      // On feature branch, check if baseline exists
      try {
        shouldUseBaseline = !fs.existsSync(baselinePath);
      } catch (error) {
        // If file system check fails, default to baseline mode
        shouldUseBaseline = true;
      }
    }
    
    return {
      shouldUseBaseline,
      baselinePath,
      comparePath,
      isMainBranch: isMain
    };
  }
  
  /**
   * Update baseline from comparison screenshot
   * @param comparePath Path to comparison screenshot
   * @param baselinePath Path to baseline screenshot
   * @returns True if baseline was updated successfully
   */
  async updateBaseline(comparePath: string, baselinePath: string): Promise<boolean> {
    try {
      if (!fs.existsSync(comparePath)) {
        throw new Error(`Comparison screenshot not found: ${comparePath}`);
      }
      
      // Ensure baseline directory exists
      ensureDirectoryExists(path.dirname(baselinePath));
      
      // Copy comparison to baseline
      fs.copyFileSync(comparePath, baselinePath);
      
      return true;
    } catch (error) {
      console.error('Error updating baseline:', error);
      return false;
    }
  }
  
  /**
   * Sanitize a branch name for use in file paths
   * @param branch Branch name
   * @returns Sanitized branch name
   */
  private sanitizeBranchName(branch: string): string {
    // Replace slashes, dots, and special characters with hyphens
    return branch.replace(/[\/\\\.\s#:*?"<>|]/g, '-');
  }
}

/**
 * Create a new Git integration instance
 * @param workingDir Working directory (optional)
 * @returns GitIntegration instance
 */
export function createGitIntegration(workingDir?: string): GitIntegration {
  return new GitIntegration(workingDir);
}

/**
 * Get Git information for the current repository
 * @param workingDir Working directory (optional)
 * @returns Git information
 */
export async function getGitInfo(workingDir?: string): Promise<GitInfo> {
  const gitIntegration = createGitIntegration(workingDir);
  return await gitIntegration.getGitInfo();
}

/**
 * Check if current branch is a main branch
 * @param workingDir Working directory (optional)
 * @returns True if current branch is main or master
 */
export async function isMainBranch(workingDir?: string): Promise<boolean> {
  const gitIntegration = createGitIntegration(workingDir);
  return await gitIntegration.isMainBranch();
}

/**
 * Manage baseline workflow for a screenshot
 * @param options Baseline management options
 * @param workingDir Working directory (optional)
 * @returns Baseline management result
 */
export async function manageBaseline(
  options: BaselineManagementOptions,
  workingDir?: string
): Promise<BaselineManagementResult> {
  const gitIntegration = createGitIntegration(workingDir);
  return await gitIntegration.manageBaseline(options);
}
