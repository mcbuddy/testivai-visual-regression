import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { ComparisonResult } from '../core/interfaces';

export interface ReportMetadata {
  generatedAt: string;
  gitInfo: GitInfo;
  totalTests: number;
  changedTests: number;
  passedTests: number;
  framework: string;
  testivaiVersion: string;
}

export interface GitInfo {
  sha: string;
  shortSha: string;
  author: string;
  email: string;
  date: string;
  message: string;
  branch: string;
}

export interface TestResult {
  name: string;
  baseline: string;
  current: string;
  diff: string | null;
  status: 'passed' | 'changed' | 'failed';
  diffPercentage: number;
  diffPixels: number;
  dimensions: {
    width: number;
    height: number;
  };
  lastApproved?: {
    gitSha: string;
    shortSha: string;
    author: string;
    date: string;
    message: string;
  };
  testInfo: {
    framework: string;
    viewport: string;
    userAgent: string;
  };
}

export interface ReportData {
  metadata: ReportMetadata;
  tests: TestResult[];
}

export interface HistoryCommit {
  shortSha: string;
  fullSha: string;
  author: string;
  email: string;
  date: string;
  message: string;
  branch: string;
  approvalTimestamp: string;
  approvals: Record<string, {
    action: 'accept' | 'reject';
    timestamp: string;
  }>;
  summary: {
    totalTests: number;
    accepted: number;
    rejected: number;
    pending: number;
  };
}

export interface HistoryData {
  maxHistory: number;
  commits: HistoryCommit[];
}

export class ReportGenerator {
  private templatePath: string;
  private outputPath: string;

  constructor(templatePath?: string, outputPath?: string) {
    this.templatePath = templatePath || path.join(__dirname, '../../../templates/reports');
    this.outputPath = outputPath || './testivai-report';
  }

  /**
   * Generate an interactive HTML report from comparison results
   */
  async generateReport(
    comparisonResults: ComparisonResult[],
    options: {
      framework?: string;
      outputPath?: string;
      includeHistory?: boolean;
    } = {}
  ): Promise<string> {
    const outputDir = options.outputPath || this.outputPath;
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate report data
    const reportData = await this.generateReportData(comparisonResults, options.framework);
    
    // Generate history data if requested
    let historyData: HistoryData | null = null;
    if (options.includeHistory !== false) {
      historyData = await this.generateHistoryData();
    }

    // Copy template files
    await this.copyTemplateFiles(outputDir);

    // Write report data
    await this.writeReportData(outputDir, reportData, historyData);

    return path.resolve(outputDir, 'index.html');
  }

  /**
   * Generate report data from comparison results
   */
  private async generateReportData(
    comparisonResults: ComparisonResult[],
    framework: string = 'unknown'
  ): Promise<ReportData> {
    const gitInfo = await this.getGitInfo();
    const tests = this.convertComparisonResultsToTestResults(comparisonResults, framework);
    
    const changedTests = tests.filter(t => t.status === 'changed' || t.status === 'failed').length;
    const passedTests = tests.filter(t => t.status === 'passed').length;

    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        gitInfo,
        totalTests: tests.length,
        changedTests,
        passedTests,
        framework,
        testivaiVersion: this.getTestiVAIVersion()
      },
      tests
    };
  }

  /**
   * Convert comparison results to test results format
   */
  private convertComparisonResultsToTestResults(
    comparisonResults: ComparisonResult[],
    framework: string
  ): TestResult[] {
    return comparisonResults.map(result => ({
      name: result.name,
      baseline: result.baselinePath,
      current: result.comparePath,
      diff: result.diffPath || null,
      status: result.passed ? 'passed' : 'changed',
      diffPercentage: result.diffPercentage || 0,
      diffPixels: Math.round((result.diffPercentage || 0) * 1280 * 800), // Estimate pixels from percentage
      dimensions: {
        width: 1280, // Default dimensions - could be enhanced to read from image metadata
        height: 800
      },
      testInfo: {
        framework,
        viewport: '1280x800',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }));
  }

  /**
   * Get Git information for the current repository
   */
  private async getGitInfo(): Promise<GitInfo> {
    try {
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
   * Generate history data from Git log
   */
  private async generateHistoryData(): Promise<HistoryData> {
    try {
      // Get last 5 commits with approval history
      const commits: HistoryCommit[] = [];
      const maxHistory = 5;

      // This would typically read from a history file or database
      // For now, return empty history
      return {
        maxHistory,
        commits
      };
    } catch (error) {
      return {
        maxHistory: 5,
        commits: []
      };
    }
  }

  /**
   * Copy template files to output directory
   */
  private async copyTemplateFiles(outputDir: string): Promise<void> {
    if (!fs.existsSync(this.templatePath)) {
      throw new Error(`Template path does not exist: ${this.templatePath}`);
    }

    // Copy all template files
    this.copyRecursive(this.templatePath, outputDir, ['compare-report.json', 'history.json']);
  }

  /**
   * Recursively copy files and directories
   */
  private copyRecursive(src: string, dest: string, exclude: string[] = []): void {
    const stats = fs.statSync(src);
    
    if (stats.isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      
      const files = fs.readdirSync(src);
      files.forEach(file => {
        if (!exclude.includes(file)) {
          this.copyRecursive(
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

  /**
   * Write report data to output directory
   */
  private async writeReportData(
    outputDir: string,
    reportData: ReportData,
    historyData: HistoryData | null
  ): Promise<void> {
    // Write compare-report.json
    const reportPath = path.join(outputDir, 'compare-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

    // Write history.json if available
    if (historyData) {
      const historyPath = path.join(outputDir, 'history.json');
      fs.writeFileSync(historyPath, JSON.stringify(historyData, null, 2));
    }
  }

  /**
   * Get TestiVAI version from package.json
   */
  private getTestiVAIVersion(): string {
    try {
      const packagePath = path.join(__dirname, '../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      return packageJson.version || '1.0.0';
    } catch (error) {
      return '1.0.0';
    }
  }

  /**
   * Update history with approval decisions
   */
  async updateHistory(
    decisions: Record<string, { action: 'accept' | 'reject'; timestamp: string }>,
    outputPath?: string
  ): Promise<void> {
    const historyPath = path.join(outputPath || this.outputPath, 'history.json');
    
    try {
      let historyData: HistoryData;
      
      if (fs.existsSync(historyPath)) {
        historyData = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      } else {
        historyData = { maxHistory: 5, commits: [] };
      }

      const gitInfo = await this.getGitInfo();
      const totalDecisions = Object.keys(decisions).length;
      const accepted = Object.values(decisions).filter(d => d.action === 'accept').length;
      const rejected = Object.values(decisions).filter(d => d.action === 'reject').length;

      // Add or update current commit
      const existingCommitIndex = historyData.commits.findIndex(c => c.shortSha === gitInfo.shortSha);
      
      const commitData: HistoryCommit = {
        shortSha: gitInfo.shortSha,
        fullSha: gitInfo.sha,
        author: gitInfo.author,
        email: gitInfo.email,
        date: gitInfo.date,
        message: gitInfo.message,
        branch: gitInfo.branch,
        approvalTimestamp: new Date().toISOString(),
        approvals: decisions,
        summary: {
          totalTests: totalDecisions,
          accepted,
          rejected,
          pending: totalDecisions - accepted - rejected
        }
      };

      if (existingCommitIndex >= 0) {
        historyData.commits[existingCommitIndex] = commitData;
      } else {
        historyData.commits.unshift(commitData);
        
        // Keep only maxHistory commits
        if (historyData.commits.length > historyData.maxHistory) {
          historyData.commits = historyData.commits.slice(0, historyData.maxHistory);
        }
      }

      fs.writeFileSync(historyPath, JSON.stringify(historyData, null, 2));
    } catch (error) {
      throw new Error(`Failed to update history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export default instance
export const reportGenerator = new ReportGenerator();
