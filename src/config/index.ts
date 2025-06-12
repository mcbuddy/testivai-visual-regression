/**
 * Configuration module for TestivaiVR Visual Regression
 */

// This is a placeholder file
// The actual implementation will be added in the configuration module

import { TestivaiVROptions } from '../core/interfaces';

/**
 * Placeholder function for loading configuration
 */
export const loadConfig = async (): Promise<TestivaiVROptions> => {
  return {
    framework: 'playwright',
    baselineDir: '.testivai/visual-regression/baseline',
    compareDir: '.testivai/visual-regression/compare',
    reportDir: '.testivai/visual-regression/reports',
    diffThreshold: 0.1,
    updateBaselines: false
  };
};
