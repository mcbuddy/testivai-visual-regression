/**
 * Utility functions for testivAI Visual Regression
 */

import * as fs from 'fs';
import * as path from 'path';
import simpleGit, { SimpleGit } from 'simple-git';
import { FrameworkType } from './interfaces';

/**
 * Ensure a directory exists, creating it if necessary
 * @param dirPath Path to the directory
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Options for generating screenshot paths
 */
interface ScreenshotPathOptions {
  baselineDir: string;
  compareDir?: string;
  framework: FrameworkType;
  name: string;
  branch: string;
  isBaseline: boolean;
}

/**
 * Generate a path for a screenshot
 * @param options Options for generating the path
 * @returns Path to the screenshot
 */
export function getScreenshotPath(options: ScreenshotPathOptions): string {
  const { baselineDir, compareDir, framework, name, branch, isBaseline } = options;
  
  if (isBaseline) {
    // Baseline screenshots are stored in baselineDir/framework/name.png
    return path.join(baselineDir, framework, `${name}.png`);
  } else {
    // Comparison screenshots are stored in compareDir/branch/framework/name.png
    const sanitizedBranch = sanitizeBranchName(branch);
    return path.join(compareDir || '.testivAI/visual-regression/compare', sanitizedBranch, framework, `${name}.png`);
  }
}

/**
 * Sanitize a branch name for use in a file path
 * @param branch Branch name
 * @returns Sanitized branch name
 */
export function sanitizeBranchName(branch: string): string {
  // Replace slashes, dots, and special characters with hyphens
  return branch.replace(/[\/\\\.\s#:*?"<>|]/g, '-');
}

/**
 * Get the current Git branch
 * @param git SimpleGit instance (optional, will create one if not provided)
 * @returns Current branch name or 'unknown' if not in a Git repository
 */
export async function getCurrentBranch(git?: SimpleGit): Promise<string> {
  try {
    const gitInstance = git || simpleGit();
    const branchSummary = await gitInstance.branchLocal();
    return branchSummary.current;
  } catch (error) {
    console.error('Error getting current branch:', error);
    return 'unknown';
  }
}

/**
 * Check if a branch is the main branch
 * @param branch Branch name
 * @returns True if the branch is main or master
 */
export function isMainBranch(branch: string): boolean {
  return branch === 'main' || branch === 'master';
}

/**
 * Generate a timestamp string
 * @returns Timestamp string in ISO format
 */
export function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Generate a unique ID
 * @returns Unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
