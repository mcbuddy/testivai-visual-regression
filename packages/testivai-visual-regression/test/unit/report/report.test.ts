import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { ReportGenerator, ReportData, HistoryData } from '../../../src/report';
import { ComparisonResult } from '../../../src/core/interfaces';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock child_process module
jest.mock('child_process');
const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

// Mock path module for some functions
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn((...args) => args.join('/')),
  resolve: jest.fn((...args) => args.filter(arg => arg !== '.').join('/'))
}));

describe('ReportGenerator', () => {
  let reportGenerator: ReportGenerator;
  let mockComparisonResults: ComparisonResult[];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockFs.existsSync.mockReturnValue(true);
    mockFs.mkdirSync.mockImplementation();
    mockFs.writeFileSync.mockImplementation();
    mockFs.copyFileSync.mockImplementation();
    mockFs.readdirSync.mockReturnValue([] as any);
    mockFs.statSync.mockReturnValue({
      isDirectory: () => false
    } as any);
    mockFs.readFileSync.mockReturnValue('{"version": "1.0.0"}');

    // Mock Git commands
    mockExecSync.mockImplementation((command: string) => {
      switch (command) {
        case 'git rev-parse HEAD':
          return 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0';
        case 'git rev-parse --short HEAD':
          return 'a1b2c3d';
        case 'git log -1 --pretty=format:"%an"':
          return 'John Doe';
        case 'git log -1 --pretty=format:"%ae"':
          return 'john.doe@example.com';
        case 'git log -1 --pretty=format:"%aI"':
          return '2025-06-13T20:15:00Z';
        case 'git log -1 --pretty=format:"%s"':
          return 'feat: update login form styling';
        case 'git rev-parse --abbrev-ref HEAD':
          return 'feature/login-ui';
        default:
          return '';
      }
    });

    reportGenerator = new ReportGenerator();
    
    mockComparisonResults = [
      {
        name: 'home-page',
        baselinePath: 'baseline/home-page.png',
        comparePath: 'current/home-page.png',
        diffPath: 'diff/home-page.diff.png',
        passed: false,
        diffPercentage: 0.0234,
        threshold: 0.1
      },
      {
        name: 'login-form',
        baselinePath: 'baseline/login-form.png',
        comparePath: 'current/login-form.png',
        diffPath: 'diff/login-form.diff.png',
        passed: true,
        diffPercentage: 0,
        threshold: 0.1
      }
    ];
  });

  describe('constructor', () => {
    it('should initialize with default paths', () => {
      const generator = new ReportGenerator();
      expect(generator).toBeInstanceOf(ReportGenerator);
    });

    it('should initialize with custom paths', () => {
      const customTemplatePath = '/custom/templates';
      const customOutputPath = '/custom/output';
      const generator = new ReportGenerator(customTemplatePath, customOutputPath);
      expect(generator).toBeInstanceOf(ReportGenerator);
    });
  });

  describe('generateReport', () => {
    it('should generate a complete HTML report', async () => {
      const outputPath = './test-report';
      
      // Mock existsSync to return false for the output directory to trigger mkdirSync
      mockFs.existsSync.mockImplementation((path) => {
        if (path.toString().includes('test-report')) {
          return false;
        }
        return true;
      });
      
      const result = await reportGenerator.generateReport(mockComparisonResults, {
        framework: 'playwright',
        outputPath
      });

      expect(result).toBe('./test-report/index.html');
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(outputPath, { recursive: true });
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        './test-report/compare-report.json',
        expect.stringContaining('"framework": "playwright"')
      );
    });

    it('should handle empty comparison results', async () => {
      const result = await reportGenerator.generateReport([]);

      expect(result).toBe('./testivai-report/index.html');
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        './testivai-report/compare-report.json',
        expect.stringContaining('"totalTests": 0')
      );
    });

    it('should include history data by default', async () => {
      await reportGenerator.generateReport(mockComparisonResults);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        './testivai-report/history.json',
        expect.stringContaining('"maxHistory": 5')
      );
    });

    it('should exclude history data when requested', async () => {
      await reportGenerator.generateReport(mockComparisonResults, {
        includeHistory: false
      });

      expect(mockFs.writeFileSync).not.toHaveBeenCalledWith(
        expect.stringContaining('history.json'),
        expect.any(String)
      );
    });
  });

  describe('Git integration', () => {
    it('should extract Git information correctly', async () => {
      await reportGenerator.generateReport(mockComparisonResults);

      const reportCall = mockFs.writeFileSync.mock.calls.find(call => 
        call[0].toString().includes('compare-report.json')
      );
      
      expect(reportCall).toBeDefined();
      const reportData = JSON.parse(reportCall![1] as string);
      
      expect(reportData.metadata.gitInfo).toEqual({
        sha: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
        shortSha: 'a1b2c3d',
        author: 'John Doe',
        email: 'john.doe@example.com',
        date: '2025-06-13T20:15:00Z',
        message: 'feat: update login form styling',
        branch: 'feature/login-ui'
      });
    });

    it('should handle Git command failures gracefully', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Git command failed');
      });

      await reportGenerator.generateReport(mockComparisonResults);

      const reportCall = mockFs.writeFileSync.mock.calls.find(call => 
        call[0].toString().includes('compare-report.json')
      );
      
      expect(reportCall).toBeDefined();
      const reportData = JSON.parse(reportCall![1] as string);
      
      expect(reportData.metadata.gitInfo.sha).toBe('unknown');
      expect(reportData.metadata.gitInfo.shortSha).toBe('unknown');
      expect(reportData.metadata.gitInfo.author).toBe('unknown');
    });
  });

  describe('Report data generation', () => {
    it('should convert comparison results to test results correctly', async () => {
      await reportGenerator.generateReport(mockComparisonResults, {
        framework: 'cypress'
      });

      const reportCall = mockFs.writeFileSync.mock.calls.find(call => 
        call[0].toString().includes('compare-report.json')
      );
      
      expect(reportCall).toBeDefined();
      const reportData: ReportData = JSON.parse(reportCall![1] as string);
      
      expect(reportData.tests).toHaveLength(2);
      expect(reportData.tests[0]).toEqual({
        name: 'home-page',
        baseline: 'baseline/home-page.png',
        current: 'current/home-page.png',
        diff: 'diff/home-page.diff.png',
        status: 'changed',
        diffPercentage: 0.0234,
        diffPixels: Math.round(0.0234 * 1280 * 800),
        dimensions: { width: 1280, height: 800 },
        testInfo: {
          framework: 'cypress',
          viewport: '1280x800',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
    });

    it('should calculate summary statistics correctly', async () => {
      await reportGenerator.generateReport(mockComparisonResults);

      const reportCall = mockFs.writeFileSync.mock.calls.find(call => 
        call[0].toString().includes('compare-report.json')
      );
      
      expect(reportCall).toBeDefined();
      const reportData: ReportData = JSON.parse(reportCall![1] as string);
      
      expect(reportData.metadata.totalTests).toBe(2);
      expect(reportData.metadata.changedTests).toBe(1);
      expect(reportData.metadata.passedTests).toBe(1);
    });
  });

  describe('updateHistory', () => {
    const mockDecisions = {
      'home-page': { action: 'accept' as const, timestamp: '2025-06-13T22:33:30Z' },
      'login-form': { action: 'reject' as const, timestamp: '2025-06-13T22:34:15Z' }
    };

    it('should create new history file if none exists', async () => {
      mockFs.existsSync.mockImplementation((path) => {
        return !path.toString().includes('history.json');
      });

      await reportGenerator.updateHistory(mockDecisions, './test-output');

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        './test-output/history.json',
        expect.stringContaining('"maxHistory": 5')
      );
    });

    it('should update existing history file', async () => {
      const existingHistory: HistoryData = {
        maxHistory: 5,
        commits: []
      };

      mockFs.readFileSync.mockImplementation((path) => {
        if (path.toString().includes('history.json')) {
          return JSON.stringify(existingHistory);
        }
        return '{"version": "1.0.0"}';
      });

      await reportGenerator.updateHistory(mockDecisions);

      const historyCall = mockFs.writeFileSync.mock.calls.find(call => 
        call[0].toString().includes('history.json')
      );
      
      expect(historyCall).toBeDefined();
      const historyData: HistoryData = JSON.parse(historyCall![1] as string);
      
      expect(historyData.commits).toHaveLength(1);
      expect(historyData.commits[0].shortSha).toBe('a1b2c3d');
      expect(historyData.commits[0].approvals).toEqual(mockDecisions);
    });

    it('should maintain maximum history limit', async () => {
      const existingHistory: HistoryData = {
        maxHistory: 2,
        commits: [
          {
            shortSha: 'old1',
            fullSha: 'old1full',
            author: 'Old Author 1',
            email: 'old1@example.com',
            date: '2025-06-12T10:00:00Z',
            message: 'Old commit 1',
            branch: 'old-branch-1',
            approvalTimestamp: '2025-06-12T10:30:00Z',
            approvals: {},
            summary: { totalTests: 0, accepted: 0, rejected: 0, pending: 0 }
          },
          {
            shortSha: 'old2',
            fullSha: 'old2full',
            author: 'Old Author 2',
            email: 'old2@example.com',
            date: '2025-06-11T10:00:00Z',
            message: 'Old commit 2',
            branch: 'old-branch-2',
            approvalTimestamp: '2025-06-11T10:30:00Z',
            approvals: {},
            summary: { totalTests: 0, accepted: 0, rejected: 0, pending: 0 }
          }
        ]
      };

      mockFs.readFileSync.mockImplementation((path) => {
        if (path.toString().includes('history.json')) {
          return JSON.stringify(existingHistory);
        }
        return '{"version": "1.0.0"}';
      });

      await reportGenerator.updateHistory(mockDecisions);

      const historyCall = mockFs.writeFileSync.mock.calls.find(call => 
        call[0].toString().includes('history.json')
      );
      
      expect(historyCall).toBeDefined();
      const historyData: HistoryData = JSON.parse(historyCall![1] as string);
      
      // Should only keep maxHistory (2) commits
      expect(historyData.commits).toHaveLength(2);
      expect(historyData.commits[0].shortSha).toBe('a1b2c3d'); // New commit first
      expect(historyData.commits[1].shortSha).toBe('old1'); // Keep only one old commit
    });

    it('should update existing commit if same SHA', async () => {
      const existingHistory: HistoryData = {
        maxHistory: 5,
        commits: [
          {
            shortSha: 'a1b2c3d',
            fullSha: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
            author: 'John Doe',
            email: 'john.doe@example.com',
            date: '2025-06-13T20:15:00Z',
            message: 'feat: update login form styling',
            branch: 'feature/login-ui',
            approvalTimestamp: '2025-06-13T20:30:00Z',
            approvals: { 'old-test': { action: 'accept', timestamp: '2025-06-13T20:30:00Z' } },
            summary: { totalTests: 1, accepted: 1, rejected: 0, pending: 0 }
          }
        ]
      };

      mockFs.readFileSync.mockImplementation((path) => {
        if (path.toString().includes('history.json')) {
          return JSON.stringify(existingHistory);
        }
        return '{"version": "1.0.0"}';
      });

      await reportGenerator.updateHistory(mockDecisions);

      const historyCall = mockFs.writeFileSync.mock.calls.find(call => 
        call[0].toString().includes('history.json')
      );
      
      expect(historyCall).toBeDefined();
      const historyData: HistoryData = JSON.parse(historyCall![1] as string);
      
      // Should still have only 1 commit, but updated
      expect(historyData.commits).toHaveLength(1);
      expect(historyData.commits[0].approvals).toEqual(mockDecisions);
      expect(historyData.commits[0].summary.totalTests).toBe(2);
      expect(historyData.commits[0].summary.accepted).toBe(1);
      expect(historyData.commits[0].summary.rejected).toBe(1);
    });

    it('should handle file system errors gracefully', async () => {
      // Mock readFileSync to return valid history data first
      mockFs.readFileSync.mockImplementation((path) => {
        if (path.toString().includes('history.json')) {
          return JSON.stringify({ maxHistory: 5, commits: [] });
        }
        return '{"version": "1.0.0"}';
      });

      // Then mock writeFileSync to throw error
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      await expect(reportGenerator.updateHistory(mockDecisions)).rejects.toThrow(
        'Failed to update history: Permission denied'
      );
    });

    it('should handle malformed history file', async () => {
      mockFs.readFileSync.mockImplementation((path) => {
        if (path.toString().includes('history.json')) {
          return 'invalid json';
        }
        return '{"version": "1.0.0"}';
      });

      await expect(reportGenerator.updateHistory(mockDecisions)).rejects.toThrow(
        'Failed to update history:'
      );
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle missing template directory', async () => {
      const generator = new ReportGenerator('/nonexistent/templates');
      
      mockFs.existsSync.mockImplementation((path) => {
        return !path.toString().includes('/nonexistent/templates');
      });

      await expect(generator.generateReport(mockComparisonResults)).rejects.toThrow(
        'Template path does not exist: /nonexistent/templates'
      );
    });

    it('should handle file copy errors during template copying', async () => {
      mockFs.statSync.mockReturnValue({
        isDirectory: () => false
      } as any);
      
      mockFs.readdirSync.mockReturnValue(['index.html'] as any);
      
      mockFs.copyFileSync.mockImplementation(() => {
        throw new Error('Copy failed');
      });

      await expect(reportGenerator.generateReport(mockComparisonResults)).rejects.toThrow(
        'Copy failed'
      );
    });

    it('should handle comparison results with null diff paths', async () => {
      const resultsWithNullDiff: ComparisonResult[] = [
        {
          name: 'test-without-diff',
          baselinePath: 'baseline/test.png',
          comparePath: 'current/test.png',
          diffPath: null,
          passed: true,
          diffPercentage: 0,
          threshold: 0.1
        }
      ];

      const result = await reportGenerator.generateReport(resultsWithNullDiff);

      expect(result).toBe('./testivai-report/index.html');
      
      const reportCall = mockFs.writeFileSync.mock.calls.find(call => 
        call[0].toString().includes('compare-report.json')
      );
      
      expect(reportCall).toBeDefined();
      const reportData: ReportData = JSON.parse(reportCall![1] as string);
      
      expect(reportData.tests[0].diff).toBeNull();
      expect(reportData.tests[0].status).toBe('passed');
    });

    it('should handle comparison results with undefined diff percentage', async () => {
      const resultsWithUndefinedDiff: ComparisonResult[] = [
        {
          name: 'test-undefined-diff',
          baselinePath: 'baseline/test.png',
          comparePath: 'current/test.png',
          diffPath: 'diff/test.diff.png',
          passed: false,
          diffPercentage: undefined,
          threshold: 0.1
        }
      ];

      const result = await reportGenerator.generateReport(resultsWithUndefinedDiff);

      expect(result).toBe('./testivai-report/index.html');
      
      const reportCall = mockFs.writeFileSync.mock.calls.find(call => 
        call[0].toString().includes('compare-report.json')
      );
      
      expect(reportCall).toBeDefined();
      const reportData: ReportData = JSON.parse(reportCall![1] as string);
      
      expect(reportData.tests[0].diffPercentage).toBe(0);
      expect(reportData.tests[0].diffPixels).toBe(0);
    });

    it('should handle package.json read errors gracefully', async () => {
      mockFs.readFileSync.mockImplementation((path) => {
        if (path.toString().includes('package.json')) {
          throw new Error('File not found');
        }
        return '{}';
      });

      const result = await reportGenerator.generateReport(mockComparisonResults);

      expect(result).toBe('./testivai-report/index.html');
      
      const reportCall = mockFs.writeFileSync.mock.calls.find(call => 
        call[0].toString().includes('compare-report.json')
      );
      
      expect(reportCall).toBeDefined();
      const reportData: ReportData = JSON.parse(reportCall![1] as string);
      
      expect(reportData.metadata.testivaiVersion).toBe('1.0.0');
    });

    it('should handle malformed package.json gracefully', async () => {
      mockFs.readFileSync.mockImplementation((path) => {
        if (path.toString().includes('package.json')) {
          return 'invalid json';
        }
        return '{}';
      });

      const result = await reportGenerator.generateReport(mockComparisonResults);

      expect(result).toBe('./testivai-report/index.html');
      
      const reportCall = mockFs.writeFileSync.mock.calls.find(call => 
        call[0].toString().includes('compare-report.json')
      );
      
      expect(reportCall).toBeDefined();
      const reportData: ReportData = JSON.parse(reportCall![1] as string);
      
      expect(reportData.metadata.testivaiVersion).toBe('1.0.0');
    });

    it('should handle directory creation when output path has nested directories', async () => {
      const deepOutputPath = './reports/visual/regression/test';
      
      mockFs.existsSync.mockImplementation((path) => {
        // Return false for the deep output path to trigger directory creation
        if (path.toString().includes('reports/visual/regression/test')) {
          return false;
        }
        // Return true for template path to avoid template not found error
        return true;
      });

      await reportGenerator.generateReport(mockComparisonResults, {
        outputPath: deepOutputPath
      });

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(deepOutputPath, { recursive: true });
    });

    it('should handle template file copying', async () => {
      // Test that template files are copied correctly
      mockFs.readdirSync.mockReturnValue(['index.html', 'style.css'] as any);
      
      await reportGenerator.generateReport(mockComparisonResults);

      // Should copy template files
      expect(mockFs.copyFileSync).toHaveBeenCalled();
    });
  });
});
