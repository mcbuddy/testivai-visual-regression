/**
 * Main testivAI class
 */

import { FrameworkType, Plugin, ScreenshotOptions, testivAIOptions } from './interfaces';

/**
 * Main class for testivAI Visual Regression
 */
export class testivAI {
  private options: Required<testivAIOptions>;
  private plugin: Plugin | null = null;
  
  /**
   * Private constructor - use testivAI.init() instead
   * @param options testivAI options
   */
  private constructor(options: testivAIOptions) {
    // Set default options
    this.options = {
      framework: options.framework,
      baselineDir: options.baselineDir,
      compareDir: options.compareDir || '.testivAI/visual-regression/compare',
      reportDir: options.reportDir || '.testivAI/visual-regression/reports',
      diffThreshold: options.diffThreshold !== undefined ? options.diffThreshold : 0.1,
      updateBaselines: options.updateBaselines !== undefined ? options.updateBaselines : false
    };
  }
  
  /**
   * Initialize a new testivAI instance
   * @param options testivAI options
   * @returns testivAI instance
   */
  public static init(options: testivAIOptions): testivAI {
    return new testivAI(options);
  }
  
  /**
   * Get the current options
   * @returns testivAI options
   */
  public getOptions(): Required<testivAIOptions> {
    return this.options;
  }
  
  /**
   * Register a plugin
   * @param plugin Plugin to register
   * @returns testivAI instance for chaining
   */
  public use(plugin: Plugin): testivAI {
    const pluginFramework = this.getPluginFramework(plugin);
    
    if (pluginFramework !== 'unknown' && pluginFramework !== this.options.framework) {
      throw new Error(
        `Plugin ${plugin.name} is for framework ${pluginFramework}, but testivAI is configured for ${this.options.framework}`
      );
    }
    
    this.plugin = plugin;
    plugin.init();
    
    return this;
  }
  
  /**
   * Capture a screenshot
   * @param name Name of the screenshot (optional - will be generated from URL if not provided)
   * @param target Framework-specific target (page, browser, etc.)
   * @param options Screenshot options
   * @returns Path to the captured screenshot
   */
  public async capture(name: string | undefined, target: unknown, options?: ScreenshotOptions): Promise<string> {
    if (!this.plugin) {
      throw new Error(`No plugin registered for framework ${this.options.framework}`);
    }
    
    return this.plugin.capture(name, target, options);
  }
  
  /**
   * Determine the framework from the plugin name
   * @param plugin Plugin to check
   * @returns Framework name or 'unknown'
   */
  public getPluginFramework(plugin: Plugin): FrameworkType | 'unknown' {
    const name = plugin.name.toLowerCase();
    
    if (name.includes('playwright')) {
      return 'playwright';
    } else if (name.includes('cypress')) {
      return 'cypress';
    } else if (name.includes('puppeteer')) {
      return 'puppeteer';
    } else if (name.includes('selenium')) {
      return 'selenium';
    }
    
    return 'unknown';
  }
  
  /**
   * Generate a report of comparison results
   * @returns Path to the generated report
   */
  public async generateReport(): Promise<string> {
    // This will be implemented in the report module
    return `${this.options.reportDir}/index.html`;
  }
}
