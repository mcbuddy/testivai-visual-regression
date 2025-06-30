/**
 * Utility functions for testivAI CLI
 */

import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';
// Use require instead of import for pixelmatch
const pixelmatch = require('pixelmatch');

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
 * Compare two PNG images and generate a diff image
 * @param options Options for comparing images
 * @returns Comparison result
 */
export interface CompareImagesOptions {
  baselinePath: string;
  comparePath: string;
  diffPath: string;
  threshold: number;
}

/**
 * Result of image comparison
 */
export interface ComparisonResult {
  name: string;
  baselinePath: string;
  comparePath: string;
  diffPath: string | null;
  passed: boolean;
  diffPercentage: number;
  threshold: number;
}

/**
 * Compare two images and generate a diff image
 * @param options Options for comparing images
 * @returns Comparison result
 */
export async function compareImages(options: CompareImagesOptions): Promise<ComparisonResult> {
  const { baselinePath, comparePath, diffPath, threshold } = options;
  
  // Check if both images exist
  if (!fs.existsSync(baselinePath)) {
    throw new Error('Baseline image not found');
  }
  
  if (!fs.existsSync(comparePath)) {
    throw new Error('Comparison image not found');
  }
  
  // Read images
  const baselineImage = fs.readFileSync(baselinePath);
  const comparisonImage = fs.readFileSync(comparePath);
  
  // Parse PNG images
  const baseline = PNG.sync.read(baselineImage);
  const comparison = PNG.sync.read(comparisonImage);
  
  // Create diff image
  const { width, height } = baseline;
  const diff = new PNG({ width, height });
  
  // Ensure diff directory exists
  ensureDirectoryExists(path.dirname(diffPath));
  
  // Compare images
  const numDiffPixels = pixelmatch(
    baseline.data,
    comparison.data,
    diff.data,
    width,
    height,
    { threshold }
  );
  
  // Calculate diff percentage
  const totalPixels = width * height;
  const diffPercentage = numDiffPixels / totalPixels;
  
  // Write diff image
  fs.writeFileSync(diffPath, PNG.sync.write(diff));
  
  // Get screenshot name from baseline path
  const name = path.basename(baselinePath, '.png');
  
  // Determine if comparison passed
  const passed = diffPercentage <= threshold;
  
  return {
    name,
    baselinePath,
    comparePath,
    diffPath,
    passed,
    diffPercentage,
    threshold
  };
}

/**
 * Copy an image file from source to destination
 * @param sourcePath Source image path
 * @param destinationPath Destination image path
 * @param createDirectories Whether to create destination directories if they don't exist
 */
export function copyImage(sourcePath: string, destinationPath: string, createDirectories: boolean = true): void {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source image not found: ${sourcePath}`);
  }
  
  if (createDirectories) {
    ensureDirectoryExists(path.dirname(destinationPath));
  }
  
  fs.copyFileSync(sourcePath, destinationPath);
}

/**
 * Check if a file exists
 * @param filePath Path to the file
 * @returns True if the file exists
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Get image diff metrics
 * @param diffImagePath Path to the diff image
 * @returns Diff metrics (percentage and pixel count)
 */
export function getImageDiffMetrics(diffImagePath: string): { diffPercentage: number; diffPixels: number } {
  if (!fs.existsSync(diffImagePath)) {
    throw new Error(`Diff image not found: ${diffImagePath}`);
  }
  
  // Read diff image
  const diffImage = fs.readFileSync(diffImagePath);
  const diff = PNG.sync.read(diffImage);
  
  // Count non-transparent pixels (diff pixels)
  let diffPixels = 0;
  for (let i = 0; i < diff.data.length; i += 4) {
    if (diff.data[i + 3] > 0) {
      diffPixels++;
    }
  }
  
  // Calculate diff percentage
  const totalPixels = diff.width * diff.height;
  const diffPercentage = diffPixels / totalPixels;
  
  return {
    diffPercentage,
    diffPixels
  };
}

/**
 * Save an image to a file
 * @param imagePath Path to save the image
 * @param imageData Image data (PNG instance)
 * @param createDirectories Whether to create directories if they don't exist
 */
export function saveImage(imagePath: string, imageData: PNG, createDirectories: boolean = true): void {
  if (createDirectories) {
    ensureDirectoryExists(path.dirname(imagePath));
  }
  
  fs.writeFileSync(imagePath, PNG.sync.write(imageData));
}

/**
 * Get Git information for the current repository
 * @returns Git information
 */
export async function getGitInfo(): Promise<{
  sha: string;
  shortSha: string;
  author: string;
  email: string;
  date: string;
  message: string;
  branch: string;
}> {
  try {
    const { execSync } = require('child_process');
    
    const sha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const shortSha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const author = execSync('git log -1 --pretty=format:"%an"', { encoding: 'utf8' }).trim();
    const email = execSync('git log -1 --pretty=format:"%ae"', { encoding: 'utf8' }).trim();
    const date = execSync('git log -1 --pretty=format:"%aI"', { encoding: 'utf8' }).trim();
    const message = execSync('git log -1 --pretty=format:"%s"', { encoding: 'utf8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();

    return {
      sha,
      shortSha,
      author,
      email,
      date,
      message,
      branch
    };
  } catch (error) {
    // Fallback for non-git environments
    return {
      sha: 'unknown',
      shortSha: 'unknown',
      author: 'unknown',
      email: 'unknown@example.com',
      date: new Date().toISOString(),
      message: 'No git information available',
      branch: 'unknown'
    };
  }
}

/**
 * Recursively copy files and directories
 * @param src Source path
 * @param dest Destination path
 * @param exclude Files to exclude
 */
export function copyRecursive(src: string, dest: string, exclude: string[] = []): void {
  const stats = fs.statSync(src);
  
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const files = fs.readdirSync(src);
    files.forEach((file: string) => {
      if (!exclude.includes(file)) {
        copyRecursive(
          path.join(src, file),
          path.join(dest, file),
          exclude
        );
      }
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}
