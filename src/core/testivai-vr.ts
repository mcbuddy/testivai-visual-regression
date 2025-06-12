/**
 * Main TestivaiVR class
 */

import { FrameworkType, Plugin, ScreenshotOptions, TestivaiVROptions } from './interfaces';

/**
 * Main class for TestivaiVR Visual Regression
 */
export class TestivaiVR {
  private options: Required<TestivaiVROptions>;
  private plugin: Plugin | null = null;
  
  /**
   * Private constructor - use TestivaiVR.init() instead
   * @param options TestivaiVR options
   */
  private constructor(options: TestivaiVROptions) {
    // Set default options
    this.options = {
      framework: options.framework,
      baselineDir: options.baselineDir,
      compareDir: options.compareDir || '.testivai/visual-regression/compare',
      reportDir: options.reportDir || '.testivai/visual-regression/reports',
      diffThreshold: options.diffThreshold !== undefined ? options.diffThreshold : 0.1,
      updateBaselines: options.updateBaselines !== undefined ? options.updateBaselines : false
    };
  }
  
  /**
   * Initialize a new TestivaiVR instance
   * @param options TestivaiVR options
   * @returns TestivaiVR instance
   */
  public static init(options: TestivaiVROptions): TestivaiVR {
    return new TestivaiVR(options);
  }
  
  /**
   * Get the current options
   * @returns TestivaiVR options
   */
  public getOptions(): Required<TestivaiVROptions> {
    return this.options;
  }
  
  /**
   * Register a plugin
   * @param plugin Plugin to register
   * @returns TestivaiVR instance for chaining
   */
  public use(plugin: Plugin): TestivaiVR {
    const pluginFramework = this.getPluginFramework(plugin);
    
    if (pluginFramework !== 'unknown' && pluginFramework !== this.options.framework) {
      throw new Error(
        `Plugin ${plugin.name} is for framework ${pluginFramework}, but TestivaiVR is configured for ${this.options.framework}`
      );
    }
    
    this.plugin = plugin;
    plugin.init();
    
    return this;
  }
  
  /**
   * Capture a screenshot
   * @param name Name of the screenshot
   * @param target Framework-specific target (page, browser, etc.)
   * @param options Screenshot options
   * @returns Path to the captured screenshot
   */
  public async capture(name: string, target: unknown, options?: ScreenshotOptions): Promise<string> {
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
