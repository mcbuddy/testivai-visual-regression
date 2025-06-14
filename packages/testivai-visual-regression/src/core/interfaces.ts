/**
 * Core interfaces for testivAI Visual Regression
 */

/**
 * Supported testing frameworks
 */
export enum Framework {
  PLAYWRIGHT = 'playwright',
  CYPRESS = 'cypress',
  PUPPETEER = 'puppeteer',
  SELENIUM = 'selenium'
}

/**
 * Type for framework strings
 */
export type FrameworkType = 'playwright' | 'cypress' | 'puppeteer' | 'selenium';

/**
 * Options for initializing testivAI
 */
export interface testivAIOptions {
  /**
   * The testing framework being used
   */
  framework: FrameworkType;
  
  /**
   * Directory to store baseline screenshots
   * @default '.testivAI/visual-regression/baseline'
   */
  baselineDir: string;
  
  /**
   * Directory to store comparison screenshots
   * @default '.testivAI/visual-regression/compare'
   */
  compareDir?: string;
  
  /**
   * Directory to store generated reports
   * @default '.testivAI/visual-regression/reports'
   */
  reportDir?: string;
  
  /**
   * Threshold for acceptable difference between screenshots (0-1)
   * @default 0.1
   */
  diffThreshold?: number;
  
  /**
   * Whether to automatically update baselines
   * @default false
   */
  updateBaselines?: boolean;
}

/**
 * Plugin interface for framework-specific implementations
 */
export interface Plugin {
  /**
   * Name of the plugin
   */
  name: string;
  
  /**
   * Initialize the plugin with the given options
   * @param options Plugin-specific options
   */
  init(options?: Record<string, unknown>): void | Promise<void>;
  
  /**
   * Capture a screenshot using the framework-specific implementation
   * @param name Name of the screenshot (optional - will be generated from URL if not provided)
   * @param target Framework-specific target (page, browser, etc.)
   * @param options Screenshot options
   */
  capture(name: string | undefined, target: unknown, options?: ScreenshotOptions): Promise<string>;
}

/**
 * Options for capturing screenshots
 */
export interface ScreenshotOptions {
  /**
   * Whether to capture the full page or just the viewport
   * @default false
   */
  fullPage?: boolean;
  
  /**
   * CSS selector to capture a specific element
   */
  selector?: string;
  
  /**
   * CSS selectors or regions to ignore during comparison
   */
  ignoreRegions?: string[] | Region[];
}

/**
 * Region to ignore during comparison
 */
export interface Region {
  /**
   * Name of the region
   */
  name: string;
  
  /**
   * CSS selector for the region
   */
  selector?: string;
  
  /**
   * Coordinates for the region (x, y, width, height)
   */
  coordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Screenshot metadata
 */
export interface ScreenshotMetadata {
  /**
   * Name of the screenshot
   */
  name: string;
  
  /**
   * Path to the screenshot file
   */
  path: string;
  
  /**
   * Testing framework used
   */
  framework: FrameworkType;
  
  /**
   * Git branch name
   */
  branch?: string;
  
  /**
   * Timestamp when the screenshot was taken
   */
  timestamp: number;
  
  /**
   * Screenshot options used
   */
  options?: ScreenshotOptions;
}

/**
 * Comparison result
 */
export interface ComparisonResult {
  /**
   * Name of the comparison
   */
  name: string;
  
  /**
   * Path to the baseline screenshot
   */
  baselinePath: string;
  
  /**
   * Path to the comparison screenshot
   */
  comparePath: string;
  
  /**
   * Path to the diff image (null if no diff was generated)
   */
  diffPath: string | null;
  
  /**
   * Whether the comparison passed
   */
  passed: boolean;
  
  /**
   * Difference percentage (0-1, undefined if comparison failed)
   */
  diffPercentage?: number;
  
  /**
   * Threshold used for the comparison
   */
  threshold: number;
}
