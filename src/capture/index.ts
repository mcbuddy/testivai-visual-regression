/**
 * Screenshot capture module for TestivaiVR Visual Regression
 */

import * as fs from 'fs';
import * as path from 'path';
import { FrameworkType, ScreenshotOptions } from '../core/interfaces';
import { ensureDirectoryExists, getScreenshotPath } from '../core/utils';

/**
 * Options for capturing a screenshot
 */
export interface CaptureScreenshotOptions {
  /**
   * Directory to store baseline screenshots
   */
  baselineDir: string;
  
  /**
   * Directory to store comparison screenshots (optional)
   */
  compareDir?: string;
  
  /**
   * Testing framework being used
   */
  framework: FrameworkType;
  
  /**
   * Name of the screenshot
   */
  name: string;
  
  /**
   * Git branch name
   */
  branch: string;
  
  /**
   * Whether this is a baseline screenshot
   */
  isBaseline: boolean;
  
  /**
   * Framework-specific target (page, browser, etc.)
   */
  target: {
    screenshot: (options?: unknown) => Promise<Buffer | string>;
  };
  
  /**
   * Screenshot options
   */
  screenshotOptions?: ScreenshotOptions;
}

/**
 * Capture a screenshot using the framework-specific implementation
 * @param options Options for capturing the screenshot
 * @returns Path to the captured screenshot
 */
export const captureScreenshot = async (options: CaptureScreenshotOptions): Promise<string> => {
  // Generate the path for the screenshot
  const screenshotPath = getScreenshotPath({
    baselineDir: options.baselineDir,
    compareDir: options.compareDir,
    framework: options.framework,
    name: options.name,
    branch: options.branch,
    isBaseline: options.isBaseline
  });
  
  // Ensure the directory exists
  ensureDirectoryExists(path.dirname(screenshotPath));
  
  // Capture the screenshot
  const screenshotData = await options.target.screenshot(options.screenshotOptions || {});
  
  // Write the screenshot to the file
  fs.writeFileSync(screenshotPath, screenshotData);
  
  return screenshotPath;
};
