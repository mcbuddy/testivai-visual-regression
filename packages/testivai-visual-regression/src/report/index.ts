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
  prInfo?: {
    number: string;
    url: string;
    commitSha: string;
    commitUrl: string;
  };
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
  status: 'passed' | 'changed' | 'failed' | 'new' | 'deleted';
  approvalStatus?: 'approved' | 'rejected';
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
  groupedTests?: {
    approved: TestResult[];
    rejected: TestResult[];
    new: TestResult[];
    deleted: TestResult[];
    pending: TestResult[];
  };
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

export interface ApprovalsData {
  approved: string[];
  rejected: string[];
  new: string[];
  deleted: string[];
  meta: {
    author: string;
    timestamp: string;
    source?: string;
    pr_url?: string;
    commit_sha?: string;
    commit_url?: string;
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
    // Look for templates in the package's templates directory
    // Try different paths to find the templates
    const possiblePaths = [
      path.join(__dirname, '../../../templates/reports'), // Local development
      path.join(__dirname, '../../templates/reports'),    // Published package
      path.join(process.cwd(), 'node_modules/testivai-visual-regression/templates/reports') // Installed package
    ];
    
    // Find the first path that exists
    this.templatePath = templatePath || possiblePaths.find(p => {
      try {
        return fs.existsSync(p);
      } catch (e) {
        return false;
      }
    }) || possiblePaths[0]; // Default to the first path if none exist
    
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
      approvalsData?: ApprovalsData;
      prInfo?: {
        number: string;
        url: string;
        commitSha: string;
        commitUrl: string;
      };
    } = {}
  ): Promise<string> {
    const outputDir = options.outputPath || this.outputPath;
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate report data
    const reportData = await this.generateReportData(comparisonResults, options.framework, options.approvalsData, options.prInfo);
    
    // Generate history data if requested
    let historyData: HistoryData | null = null;
    if (options.includeHistory !== false) {
      historyData = await this.generateHistoryData();
    }

    // Copy template files
    await this.copyTemplateFiles(outputDir);

    // Write report data
    await this.writeReportData(outputDir, reportData, historyData, options.approvalsData);

    return path.resolve(outputDir, 'index.html');
  }

  /**
   * Generate report data from comparison results
   */
  private async generateReportData(
    comparisonResults: ComparisonResult[],
    framework: string = 'unknown',
    approvalsData?: ApprovalsData,
    prInfo?: {
      number: string;
      url: string;
      commitSha: string;
      commitUrl: string;
    }
  ): Promise<ReportData> {
    const gitInfo = await this.getGitInfo();
    const tests = this.convertComparisonResultsToTestResults(comparisonResults, framework, approvalsData);
    
    const changedTests = tests.filter(t => t.status === 'changed' || t.status === 'failed').length;
    const passedTests = tests.filter(t => t.status === 'passed').length;

    // Group tests by status
    const groupedTests = this.groupTestsByStatus(tests, approvalsData);

    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        gitInfo,
        totalTests: tests.length,
        changedTests,
        passedTests,
        framework,
        testivaiVersion: this.getTestivAIVersion(),
        prInfo
      },
      tests,
      groupedTests
    };
  }

  /**
   * Group tests by their status (approved, rejected, new, deleted, pending)
   */
  private groupTestsByStatus(tests: TestResult[], approvalsData?: ApprovalsData): ReportData['groupedTests'] {
    const approved: TestResult[] = [];
    const rejected: TestResult[] = [];
    const newTests: TestResult[] = [];
    const deleted: TestResult[] = [];
    const pending: TestResult[] = [];

    tests.forEach(test => {
      if (test.approvalStatus === 'approved') {
        approved.push(test);
      } else if (test.approvalStatus === 'rejected') {
        rejected.push(test);
      } else if (test.status === 'new') {
        newTests.push(test);
      } else if (test.status === 'deleted') {
        deleted.push(test);
      } else {
        pending.push(test);
      }
    });

    return {
      approved,
      rejected,
      new: newTests,
      deleted,
      pending
    };
  }

  /**
   * Convert comparison results to test results format
   */
  private convertComparisonResultsToTestResults(
    comparisonResults: ComparisonResult[],
    framework: string,
    approvalsData?: ApprovalsData
  ): TestResult[] {
    const results = comparisonResults.map(result => {
      // Determine status based on comparison result
      let status: TestResult['status'] = result.passed ? 'passed' : 'changed';
      
      // Apply approval status if available
      let approvalStatus: TestResult['approvalStatus'] = undefined;
      
      if (approvalsData) {
        const testName = result.name;
        
        if (approvalsData.approved.includes(testName)) {
          approvalStatus = 'approved';
        } else if (approvalsData.rejected.includes(testName)) {
          approvalStatus = 'rejected';
        } else if (approvalsData.new.includes(testName)) {
          status = 'new';
        } else if (approvalsData.deleted.includes(testName)) {
          status = 'deleted';
        }
      }
      
      return {
        name: result.name,
        baseline: result.baselinePath,
        current: result.comparePath,
        diff: result.diffPath || null,
        status,
        approvalStatus,
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
      };
    });

    // Add any deleted tests from approvals data that aren't in the comparison results
    if (approvalsData && approvalsData.deleted.length > 0) {
      const existingTestNames = results.map(r => r.name);
      
      approvalsData.deleted.forEach(deletedTest => {
        if (!existingTestNames.includes(deletedTest)) {
          results.push({
            name: deletedTest,
            baseline: '', // No baseline for deleted tests
            current: '',  // No current for deleted tests
            diff: null,
            status: 'deleted',
            approvalStatus: undefined,
            diffPercentage: 0,
            diffPixels: 0,
            dimensions: {
              width: 1280,
              height: 800
            },
            testInfo: {
              framework,
              viewport: '1280x800',
              userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
        }
      });
    }

    return results;
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
    historyData: HistoryData | null,
    approvalsData?: ApprovalsData
  ): Promise<void> {
    // Create default approvals data if none provided
    if (!approvalsData) {
      approvalsData = {
        approved: [],
        rejected: [],
        new: [],
        deleted: [],
        meta: {
          author: reportData.metadata.gitInfo.author || 'unknown',
          timestamp: new Date().toISOString(),
          commit_sha: reportData.metadata.gitInfo.sha,
          commit_url: reportData.metadata.prInfo?.commitUrl || ''
        }
      };
      
      if (reportData.metadata.prInfo) {
        approvalsData.meta.source = `GitHub PR #${reportData.metadata.prInfo.number}`;
        approvalsData.meta.pr_url = reportData.metadata.prInfo.url;
      }
    }

    // Write compare-report.json
    const reportPath = path.join(outputDir, 'compare-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

    // Write history.json if available
    if (historyData) {
      const historyPath = path.join(outputDir, 'history.json');
      fs.writeFileSync(historyPath, JSON.stringify(historyData, null, 2));
    }

    // Write approvals.json
    const approvalsPath = path.join(outputDir, 'approvals.json');
    fs.writeFileSync(approvalsPath, JSON.stringify(approvalsData, null, 2));

    // Write diffs.json for CI/CD integration
    this.writeDiffsJson(outputDir, reportData);

    // Embed data in HTML file to avoid CORS issues when viewing locally
    this.embedDataInHtml(outputDir, reportData, historyData || { maxHistory: 5, commits: [] }, approvalsData);
  }

  /**
   * Write a simplified diffs.json file for CI/CD integration
   * This file is designed to be easily parsed by GitHub Actions to determine if there are any differences
   */
  private writeDiffsJson(outputDir: string, reportData: ReportData): void {
    // Create diffs directory if it doesn't exist
    const diffsDir = path.join(outputDir, 'diffs');
    if (!fs.existsSync(diffsDir)) {
      fs.mkdirSync(diffsDir, { recursive: true });
    }

    // Extract tests with differences
    const testsWithDiffs = reportData.tests.filter(test => 
      test.status === 'changed' || test.status === 'failed' || test.status === 'new'
    );

    // Create a simplified structure for CI/CD integration
    const diffsData = {
      summary: {
        totalTests: reportData.metadata.totalTests,
        passedTests: reportData.metadata.passedTests,
        changedTests: reportData.metadata.changedTests,
        newTests: reportData.tests.filter(t => t.status === 'new').length,
        deletedTests: reportData.tests.filter(t => t.status === 'deleted').length,
        hasDifferences: testsWithDiffs.length > 0
      },
      testsWithDifferences: testsWithDiffs.map(test => ({
        name: test.name,
        status: test.status,
        diffPercentage: test.diffPercentage,
        diffPixels: test.diffPixels,
        baseline: test.baseline,
        current: test.current,
        diff: test.diff
      })),
      gitInfo: reportData.metadata.gitInfo,
      generatedAt: reportData.metadata.generatedAt,
      prInfo: reportData.metadata.prInfo
    };

    // Write diffs.json
    const diffsPath = path.join(diffsDir, 'diffs.json');
    fs.writeFileSync(diffsPath, JSON.stringify(diffsData, null, 2));
  }

  /**
   * Embed report data directly in the HTML file to avoid CORS issues when viewing locally
   */
  private embedDataInHtml(
    outputDir: string,
    reportData: ReportData,
    historyData: HistoryData,
    approvalsData: ApprovalsData
  ): void {
    const indexHtmlPath = path.join(outputDir, 'index.html');
    
    // Check if index.html exists
    if (!fs.existsSync(indexHtmlPath)) {
      console.warn('index.html not found, skipping data embedding');
      return;
    }

    try {
      // Read the HTML file
      let htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

      // Create script tag with embedded data
      const scriptContent = `
<!-- Embedded report data to avoid CORS issues when viewing locally -->
<script>
  // Pre-loaded report data
  window.testivAI = window.testivAI || {};
  window.testivAI.embeddedData = {
    reportData: ${JSON.stringify(reportData)},
    historyData: ${JSON.stringify(historyData)},
    approvalsData: ${JSON.stringify(approvalsData)}
  };
</script>
`;

      // Insert script tag before the closing </head> tag
      htmlContent = htmlContent.replace('</head>', `${scriptContent}</head>`);

      // Modify the script.js to use embedded data if fetch fails
      const scriptJsPath = path.join(outputDir, 'assets', 'js', 'script.js');
      if (fs.existsSync(scriptJsPath)) {
        let scriptContent = fs.readFileSync(scriptJsPath, 'utf8');
        
        // Find the loadReport method
        const loadReportMethodRegex = /async loadReport\(\) \{[\s\S]*?try \{[\s\S]*?this\.showLoading\(true\);/;
        const loadReportMethod = scriptContent.match(loadReportMethodRegex);
        
        if (loadReportMethod) {
          // Add code to use embedded data if fetch fails
          const modifiedLoadReportMethod = `async loadReport() {
    try {
      this.showLoading(true);
      
      // Check if we have embedded data
      if (window.testivAI && window.testivAI.embeddedData) {
        console.log('Using embedded data');
        this.reportData = window.testivAI.embeddedData.reportData;
        this.historyData = window.testivAI.embeddedData.historyData;
        this.approvalsData = window.testivAI.embeddedData.approvalsData;
        
        // Load stored decisions
        this.loadStoredDecisions();

        // Initialize UI
        this.updateGitInfo();
        this.updatePRInfo();
        this.updateSummaryStats();
        this.renderHistory();
        this.renderTests();
        this.setupFilters();
        this.setupExport();

        this.showLoading(false);
        return;
      }
      
      // If no embedded data, try to fetch from files
      console.log('Fetching data from files');`;
          
          scriptContent = scriptContent.replace(loadReportMethodRegex, modifiedLoadReportMethod);
          fs.writeFileSync(scriptJsPath, scriptContent);
        }
      }

      // Write the modified HTML file
      fs.writeFileSync(indexHtmlPath, htmlContent);
    } catch (error) {
      console.error('Failed to embed data in HTML:', error);
    }
  }

  /**
   * Get testivAI version from package.json
   */
  private getTestivAIVersion(): string {
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
      
      // Also update approvals.json
      await this.updateApprovalsJson(decisions, outputPath);
    } catch (error) {
      throw new Error(`Failed to update history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Update approvals.json with approval decisions
   */
  async updateApprovalsJson(
    decisions: Record<string, { action: 'accept' | 'reject'; timestamp: string }>,
    outputPath?: string
  ): Promise<void> {
    const approvalsPath = path.join(outputPath || this.outputPath, 'approvals.json');
    
    try {
      let approvalsData: ApprovalsData;
      
      if (fs.existsSync(approvalsPath)) {
        approvalsData = JSON.parse(fs.readFileSync(approvalsPath, 'utf8'));
      } else {
        // Create default approvals data
        const gitInfo = await this.getGitInfo();
        approvalsData = {
          approved: [],
          rejected: [],
          new: [],
          deleted: [],
          meta: {
            author: gitInfo.author,
            timestamp: new Date().toISOString(),
            commit_sha: gitInfo.sha,
            commit_url: ''
          }
        };
      }

      // Update approvals based on decisions
      for (const [testName, decision] of Object.entries(decisions)) {
        // Remove from all categories first
        approvalsData.approved = approvalsData.approved.filter(name => name !== testName);
        approvalsData.rejected = approvalsData.rejected.filter(name => name !== testName);
        
        // Add to appropriate category
        if (decision.action === 'accept') {
          approvalsData.approved.push(testName);
        } else if (decision.action === 'reject') {
          approvalsData.rejected.push(testName);
        }
      }

      // Update timestamp
      approvalsData.meta.timestamp = new Date().toISOString();
      
      fs.writeFileSync(approvalsPath, JSON.stringify(approvalsData, null, 2));
    } catch (error) {
      throw new Error(`Failed to update approvals: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export default instance
export const reportGenerator = new ReportGenerator();
