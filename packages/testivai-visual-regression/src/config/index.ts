/**
 * Configuration module for testivAI Visual Regression
 */

// This is a placeholder file
// The actual implementation will be added in the configuration module

import { testivAIOptions } from '../core/interfaces';

/**
 * Placeholder function for loading configuration
 */
export const loadConfig = async (): Promise<testivAIOptions> => {
  return {
    framework: 'playwright',
    baselineDir: '.testivAI/visual-regression/baseline',
    compareDir: '.testivAI/visual-regression/compare',
    reportDir: '.testivAI/visual-regression/reports',
    diffThreshold: 0.1,
    updateBaselines: false
  };
};
