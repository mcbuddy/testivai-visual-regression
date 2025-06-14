/**
 * Comparison module for testivAI Visual Regression
 */

import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';
// Use require instead of import for pixelmatch
const pixelmatch = require('pixelmatch');
import { ComparisonResult } from '../core/interfaces';
import { ensureDirectoryExists } from '../core/utils';

/**
 * Options for comparing screenshots
 */
export interface CompareScreenshotsOptions {
  /**
   * Path to the baseline screenshot
   */
  baselinePath: string;
  
  /**
   * Path to the comparison screenshot
   */
  comparePath: string;
  
  /**
   * Path to save the diff image
   */
  diffPath: string;
  
  /**
   * Threshold for acceptable difference (0-1)
   * @default 0.1
   */
  threshold: number;
}

/**
 * Compare two screenshots and generate a diff image
 * @param options Options for comparing screenshots
 * @returns Comparison result
 */
export const compareScreenshots = async (options: CompareScreenshotsOptions): Promise<ComparisonResult> => {
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
};
