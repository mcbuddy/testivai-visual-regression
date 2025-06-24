// testivAI Visual Regression Report - Main Application
// Handles data loading, test management, filtering, and Git short SHA history

class ReportManager {
  constructor() {
    this.reportData = null;
    this.historyData = null;
    this.approvalsData = null;
    this.filteredTests = [];
    this.decisions = new Map();
    this.currentFilters = {
      status: ['all', 'approved', 'rejected', 'new', 'deleted'],
      search: ''
    };
    this.init();
  }

  async init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.loadReport());
    } else {
      await this.loadReport();
    }
  }

  async loadReport() {
    try {
      this.showLoading(true);
      
      // Load report data, history, and approvals in parallel
      const [reportResponse, historyResponse, approvalsResponse] = await Promise.all([
        fetch('compare-report.json'),
        fetch('history.json'),
        fetch('approvals.json')
      ]);

      if (!reportResponse.ok) {
        throw new Error(`Failed to load report data: ${reportResponse.status}`);
      }

      this.reportData = await reportResponse.json();
      
      // History is optional
      if (historyResponse.ok) {
        this.historyData = await historyResponse.json();
      } else {
        console.warn('History data not available');
        this.historyData = { maxHistory: 5, commits: [] };
      }

      // Approvals is optional
      if (approvalsResponse.ok) {
        this.approvalsData = await approvalsResponse.json();
      } else {
        console.warn('Approvals data not available');
        this.approvalsData = { 
          approved: [], 
          rejected: [], 
          new: [], 
          deleted: [],
          meta: {
            author: this.reportData?.metadata?.gitInfo?.author || 'unknown',
            timestamp: new Date().toISOString()
          }
        };
      }

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

    } catch (error) {
      console.error('Failed to load report:', error);
      this.showError('Failed to load report data. Please check if the files exist and try again.');
      this.showLoading(false);
    }
  }

  // PR Information Display
  updatePRInfo() {
    if (!this.reportData?.metadata?.prInfo) return;

    const prInfo = this.reportData.metadata.prInfo;
    const headerRight = document.querySelector('.header-right');
    
    if (headerRight) {
      const prInfoElement = document.createElement('div');
      prInfoElement.className = 'pr-info';
      prInfoElement.innerHTML = `
        <div class="pr-number">
          <a href="${prInfo.url}" target="_blank" rel="noopener noreferrer">PR #${prInfo.number}</a>
        </div>
        <div class="pr-commit">
          <a href="${prInfo.commitUrl}" target="_blank" rel="noopener noreferrer" title="${prInfo.commitSha}">
            ${prInfo.commitSha.substring(0, 7)}
          </a>
        </div>
      `;
      
      // Insert before the theme toggle
      const themeToggle = headerRight.querySelector('.theme-toggle');
      if (themeToggle) {
        headerRight.insertBefore(prInfoElement, themeToggle);
      } else {
        headerRight.appendChild(prInfoElement);
      }
    }

    // Add meta information to the summary card
    const summaryCard = document.querySelector('.summary-card');
    if (summaryCard && this.approvalsData?.meta) {
      const meta = this.approvalsData.meta;
      const metaInfo = document.createElement('div');
      metaInfo.className = 'meta-info';
      metaInfo.innerHTML = `
        <div class="meta-item">
          <span class="meta-label">Author:</span>
          <span class="meta-value">${meta.author}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Last Updated:</span>
          <span class="meta-value">${new Date(meta.timestamp).toLocaleString()}</span>
        </div>
        ${meta.source ? `
          <div class="meta-item">
            <span class="meta-label">Source:</span>
            <span class="meta-value">${meta.source}</span>
          </div>
        ` : ''}
      `;
      summaryCard.appendChild(metaInfo);
    }
  }

  showLoading(show) {
    const loadingState = document.getElementById('loading-state');
    const testResults = document.getElementById('test-results');
    
    if (loadingState) {
      loadingState.style.display = show ? 'flex' : 'none';
    }
    if (testResults) {
      testResults.style.display = show ? 'none' : 'grid';
    }
  }

  showError(message) {
    const emptyState = document.getElementById('empty-state');
    if (emptyState) {
      emptyState.innerHTML = `
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/>
            <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
        <h3>Error Loading Report</h3>
        <p>${message}</p>
      `;
      emptyState.style.display = 'flex';
    }
  }

  // Git Information Display
  updateGitInfo() {
    if (!this.reportData?.metadata?.gitInfo) return;

    const gitInfo = this.reportData.metadata.gitInfo;
    const branchElement = document.getElementById('git-branch');
    const commitElement = document.getElementById('git-commit');

    if (branchElement) {
      branchElement.textContent = gitInfo.branch || 'unknown';
    }
    if (commitElement) {
      commitElement.textContent = gitInfo.shortSha || 'unknown';
      commitElement.title = `${gitInfo.sha}\n${gitInfo.message}\nby ${gitInfo.author} on ${new Date(gitInfo.date).toLocaleString()}`;
    }
  }

  // Summary Statistics
  updateSummaryStats() {
    if (!this.reportData?.tests) return;

    const tests = this.reportData.tests;
    const totalTests = tests.length;
    
    // Count by status
    const changedTests = tests.filter(t => t.status === 'changed' || t.status === 'failed').length;
    const unchangedTests = tests.filter(t => t.status === 'passed').length;
    const newTests = tests.filter(t => t.status === 'new').length;
    const deletedTests = tests.filter(t => t.status === 'deleted').length;
    
    // Count by approval status
    const approvedTests = tests.filter(t => t.approvalStatus === 'approved').length;
    const rejectedTests = tests.filter(t => t.approvalStatus === 'rejected').length;
    
    // Count tests with decisions as pending review
    const pendingTests = totalTests - approvedTests - rejectedTests;

    // Update summary stats
    this.updateStatElement('total-tests', totalTests);
    this.updateStatElement('changed-tests', changedTests);
    this.updateStatElement('unchanged-tests', unchangedTests);
    this.updateStatElement('pending-tests', Math.max(0, pendingTests));
    
    // Add new stats for approved, rejected, new, and deleted
    this.updateOrCreateStatElement('approved-tests', approvedTests, 'approved');
    this.updateOrCreateStatElement('rejected-tests', rejectedTests, 'rejected');
    this.updateOrCreateStatElement('new-tests', newTests, 'new');
    this.updateOrCreateStatElement('deleted-tests', deletedTests, 'deleted');
  }

  updateStatElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }
  
  updateOrCreateStatElement(id, value, className) {
    let element = document.getElementById(id);
    const summaryStats = document.getElementById('summary-stats');
    
    if (!element && summaryStats) {
      const statItem = document.createElement('div');
      statItem.className = 'stat-item';
      statItem.innerHTML = `
        <div class="stat-value ${className}" id="${id}">${value}</div>
        <div class="stat-label">${className.charAt(0).toUpperCase() + className.slice(1)}</div>
      `;
      summaryStats.appendChild(statItem);
    } else if (element) {
      element.textContent = value;
    }
  }

  // History Management with Git Short SHA
  renderHistory() {
    const historyList = document.getElementById('history-list');
    if (!historyList || !this.historyData?.commits) return;

    if (this.historyData.commits.length === 0) {
      historyList.innerHTML = `
        <div class="history-item">
          <div class="history-message">No approval history available</div>
        </div>
      `;
      return;
    }

    historyList.innerHTML = this.historyData.commits.map(commit => `
      <div class="history-item" data-sha="${commit.shortSha}">
        <div class="history-header">
          <div class="history-sha" title="${commit.fullSha}">${commit.shortSha}</div>
          <div class="history-time">${this.formatRelativeTime(commit.date)}</div>
        </div>
        <div class="history-author">${commit.author}</div>
        <div class="history-message">${commit.message}</div>
        <div class="history-stats">
          ${commit.summary.accepted > 0 ? `<span class="history-stat accepted">${commit.summary.accepted} accepted</span>` : ''}
          ${commit.summary.rejected > 0 ? `<span class="history-stat rejected">${commit.summary.rejected} rejected</span>` : ''}
        </div>
        <button class="revert-btn" onclick="window.testivAI.reportManager.revertToCommit('${commit.shortSha}')">
          <svg class="revert-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polyline points="1,4 1,10 7,10" stroke="currentColor" stroke-width="2"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" stroke="currentColor" stroke-width="2"/>
          </svg>
          Revert to ${commit.shortSha}
        </button>
      </div>
    `).join('');
  }

  formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }

  revertToCommit(shortSha) {
    const commit = this.historyData.commits.find(c => c.shortSha === shortSha);
    if (!commit) {
      window.testivAI.componentManager.showToast('Commit not found in history', 'error');
      return;
    }

    const confirmMessage = `Are you sure you want to revert to commit ${shortSha}?\n\n` +
      `This will restore baselines from:\n` +
      `${commit.message}\n` +
      `by ${commit.author} on ${new Date(commit.date).toLocaleDateString()}`;

    if (confirm(confirmMessage)) {
      // In a real implementation, this would call the CLI to revert baselines
      // For now, we'll simulate the action
      this.simulateRevert(commit);
    }
  }

  simulateRevert(commit) {
    // Simulate revert process
    window.testivAI.componentManager.showToast(
      `Reverting to commit ${commit.shortSha}...`, 
      'info', 
      2000
    );

    setTimeout(() => {
      window.testivAI.componentManager.showToast(
        `Successfully reverted to commit ${commit.shortSha}`, 
        'success'
      );
      
      // In real implementation, this would reload the report with reverted baselines
      console.log('Revert completed:', commit);
    }, 2000);
  }

  // Test Rendering
  renderTests() {
    if (!this.reportData?.tests) return;

    this.filteredTests = this.applyFilters(this.reportData.tests);
    const testResults = document.getElementById('test-results');
    const emptyState = document.getElementById('empty-state');

    if (this.filteredTests.length === 0) {
      if (testResults) testResults.style.display = 'none';
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }

    if (testResults) testResults.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';

    // Separate tests into changed and unchanged
    const changedTests = this.filteredTests.filter(test => 
      test.status === 'changed' || 
      test.status === 'failed' || 
      test.status === 'new' || 
      test.status === 'deleted'
    );
    
    const unchangedTests = this.filteredTests.filter(test => 
      test.status === 'passed' && 
      !test.approvalStatus // Only include tests that don't have an explicit approval status
    );

    if (testResults) {
      // Render changed tests first
      const changedTestsHtml = changedTests.map(test => this.createTestCard(test)).join('');
      
      // Create a collapsible section for unchanged tests
      const unchangedTestsHtml = unchangedTests.length > 0 ? `
        <div class="unchanged-tests-section">
          <div class="unchanged-tests-header" id="unchanged-tests-toggle">
            <h3>Unchanged Tests (${unchangedTests.length})</h3>
            <button class="toggle-btn">
              <svg class="toggle-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polyline points="6,9 12,15 18,9" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
          </div>
          <div class="unchanged-tests-content" id="unchanged-tests-content" style="display: none;">
            ${unchangedTests.map(test => this.createTestCard(test)).join('')}
          </div>
        </div>
      ` : '';
      
      testResults.innerHTML = changedTestsHtml + unchangedTestsHtml;
      this.setupTestCardEvents();
      this.setupUnchangedTestsToggle();
    }
  }
  
  setupUnchangedTestsToggle() {
    const toggleBtn = document.getElementById('unchanged-tests-toggle');
    const content = document.getElementById('unchanged-tests-content');
    
    if (toggleBtn && content) {
      toggleBtn.addEventListener('click', () => {
        const isHidden = content.style.display === 'none';
        content.style.display = isHidden ? 'grid' : 'none';
        
        // Update the toggle icon
        const toggleIcon = toggleBtn.querySelector('.toggle-icon');
        if (toggleIcon) {
          toggleIcon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0)';
        }
      });
    }
  }

  createTestCard(test) {
    const decision = this.decisions.get(test.name);
    // Use approvalStatus from test if available, otherwise use decision
    const approvalStatus = test.approvalStatus || (decision ? decision.action : null);
    const status = approvalStatus || test.status;
    const statusClass = this.getStatusClass(status);
    const diffPercentage = test.diffPercentage || 0;
    
    // Determine if we should show the diff image
    const showDiff = (test.status === 'changed' || test.status === 'failed') && test.diff;
    
    // Determine if this is an unchanged test
    const isUnchanged = test.status === 'passed' && !test.approvalStatus;
    
    // Only show action buttons for changed tests, never for unchanged tests
    const showActions = !isUnchanged;

    return `
      <div class="test-card ${approvalStatus ? 'decided' : ''} ${isUnchanged ? 'unchanged' : ''}" 
           data-test-name="${test.name}"
           data-baseline="${test.baseline}"
           data-current="${test.current}"
           data-diff="${test.diff || ''}"
           data-status="${status}">
        
        <div class="test-card-header">
          <input type="checkbox" class="test-card-select" />
          <h3 class="test-card-title">${test.name}</h3>
        </div>

        <div class="status-badge ${statusClass}">
          <svg class="status-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            ${this.getStatusIcon(status)}
          </svg>
          ${status}
        </div>

        ${test.status === 'changed' || test.status === 'failed' ? `
          <div class="diff-stats">
            <span class="diff-percentage">${diffPercentage.toFixed(2)}% different</span>
            <span class="diff-pixels">${test.diffPixels || 0} pixels</span>
          </div>
        ` : ''}

        <div class="image-comparison side-by-side">
          <div class="image-grid ${showDiff ? 'with-diff' : 'no-diff'}">
            <div class="image-cell">
              <div class="image-label">Baseline</div>
              <div class="image-wrapper">
                <img src="${test.baseline}" alt="${test.name} - Baseline" class="comparison-image" />
              </div>
            </div>
            <div class="image-cell">
              <div class="image-label">Current</div>
              <div class="image-wrapper">
                <img src="${test.current}" alt="${test.name} - Current" class="comparison-image" />
              </div>
            </div>
            ${showDiff ? `
              <div class="image-cell">
                <div class="image-label">Diff</div>
                <div class="image-wrapper">
                  <img src="${test.diff}" alt="${test.name} - Diff" class="comparison-image" />
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        ${showActions ? `
          <div class="test-actions">
            <button class="test-action-btn accept" 
                    onclick="window.testivAI.reportManager.approveTest('${test.name}')"
                    ${decision?.action === 'accept' ? 'disabled' : ''}>
              <svg class="action-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polyline points="20,6 9,17 4,12" stroke="currentColor" stroke-width="2"/>
              </svg>
              ${decision?.action === 'accept' ? 'Accepted' : 'Accept'}
            </button>
            
            <button class="test-action-btn reject" 
                    onclick="window.testivAI.reportManager.rejectTest('${test.name}')"
                    ${decision?.action === 'reject' ? 'disabled' : ''}>
              <svg class="action-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"/>
              </svg>
              ${decision?.action === 'reject' ? 'Rejected' : 'Reject'}
            </button>

            ${decision ? `
              <button class="test-action-btn revert" 
                      onclick="window.testivAI.reportManager.revertDecision('${test.name}')">
                <svg class="action-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polyline points="1,4 1,10 7,10" stroke="currentColor" stroke-width="2"/>
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" stroke="currentColor" stroke-width="2"/>
                </svg>
                Revert
              </button>
            ` : ''}
          </div>
        ` : ''}

        ${decision ? `
          <div class="test-status ${decision.action}">
            ${decision.action === 'accept' ? 'Accepted' : 'Rejected'}
          </div>
        ` : ''}
      </div>
    `;
  }

  setupTestCardEvents() {
    // Image tab switching
    document.querySelectorAll('.image-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const testCard = e.target.closest('.test-card');
        const imageContainer = testCard.querySelector('.image-container');
        const tabs = testCard.querySelectorAll('.image-tab');
        const image = imageContainer.querySelector('.comparison-image');
        const imageType = e.target.dataset.image;

        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');

        // Update image
        const testName = testCard.dataset.testName;
        const imageSrc = testCard.dataset[imageType];
        if (imageSrc && image) {
          image.src = imageSrc;
          image.alt = `${testName} - ${imageType}`;
          imageContainer.dataset.activeImage = imageType;
        }
      });
    });

    // Test selection
    document.querySelectorAll('.test-card-select').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const testCard = e.target.closest('.test-card');
        testCard.classList.toggle('selected', e.target.checked);
      });
    });
  }

  getStatusClass(status) {
    switch (status) {
      case 'passed': return 'passed';
      case 'failed':
      case 'changed': return 'failed';
      case 'accept':
      case 'approved': return 'passed';
      case 'reject':
      case 'rejected': return 'failed';
      case 'new': return 'new';
      case 'deleted': return 'deleted';
      default: return 'pending';
    }
  }

  getStatusIcon(status) {
    switch (status) {
      case 'passed':
      case 'accept':
      case 'approved':
        return '<polyline points="20,6 9,17 4,12" stroke="currentColor" stroke-width="2"/>';
      case 'failed':
      case 'changed':
      case 'reject':
      case 'rejected':
        return '<line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"/>';
      case 'new':
        return '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><text x="12" y="16" text-anchor="middle" font-size="12" fill="currentColor">N</text>';
      case 'deleted':
        return '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="2"/>';
      default:
        return '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2"/>';
    }
  }

  // Decision Management
  approveTest(testName) {
    this.makeDecision(testName, 'accept');
  }

  rejectTest(testName) {
    this.makeDecision(testName, 'reject');
  }

  makeDecision(testName, action) {
    const decision = {
      action: action,
      timestamp: new Date().toISOString(),
      gitSha: this.reportData?.metadata?.gitInfo?.shortSha || 'unknown'
    };

    this.decisions.set(testName, decision);
    this.storeDecisions();
    
    // Update approvals.json in memory
    if (this.approvalsData) {
      // Remove from all categories first
      this.approvalsData.approved = this.approvalsData.approved.filter(name => name !== testName);
      this.approvalsData.rejected = this.approvalsData.rejected.filter(name => name !== testName);
      
      // Add to appropriate category
      if (action === 'accept') {
        this.approvalsData.approved.push(testName);
      } else if (action === 'reject') {
        this.approvalsData.rejected.push(testName);
      }
      
      // Update timestamp
      this.approvalsData.meta.timestamp = new Date().toISOString();
      
      // Save to server (in a real implementation)
      // For now, we'll just update the UI
      console.log('Updated approvals.json in memory:', this.approvalsData);
    }
    
    this.renderTests(); // Re-render to update UI
    this.updateSummaryStats();

    window.testivAI.componentManager.showToast(
      `Test "${testName}" ${action}ed`,
      action === 'accept' ? 'success' : 'warning',
      3000
    );
  }

  revertDecision(testName) {
    if (this.decisions.has(testName)) {
      this.decisions.delete(testName);
      this.storeDecisions();
      
      // Update approvals.json in memory
      if (this.approvalsData) {
        // Remove from all categories
        this.approvalsData.approved = this.approvalsData.approved.filter(name => name !== testName);
        this.approvalsData.rejected = this.approvalsData.rejected.filter(name => name !== testName);
        
        // Update timestamp
        this.approvalsData.meta.timestamp = new Date().toISOString();
        
        // Save to server (in a real implementation)
        console.log('Updated approvals.json in memory after revert:', this.approvalsData);
      }
      
      this.renderTests();
      this.updateSummaryStats();

      window.testivAI.componentManager.showToast(
        `Decision for "${testName}" reverted`,
        'info',
        3000
      );
    }
  }

  // Local Storage Management
  loadStoredDecisions() {
    try {
      const stored = localStorage.getItem('testivai-decisions');
      if (stored) {
        const data = JSON.parse(stored);
        const currentSha = this.reportData?.metadata?.gitInfo?.shortSha;
        
        // Only load decisions for the current commit
        if (data.gitSha === currentSha && data.decisions) {
          Object.entries(data.decisions).forEach(([testName, decision]) => {
            this.decisions.set(testName, decision);
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load stored decisions:', error);
    }
  }

  storeDecisions() {
    try {
      const data = {
        gitSha: this.reportData?.metadata?.gitInfo?.shortSha || 'unknown',
        timestamp: new Date().toISOString(),
        decisions: Object.fromEntries(this.decisions)
      };
      localStorage.setItem('testivai-decisions', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to store decisions:', error);
    }
  }

  // Filtering
  setupFilters() {
    // Status filters
    document.querySelectorAll('input[type="checkbox"][value]').forEach(checkbox => {
      checkbox.addEventListener('change', () => this.updateFilters());
    });

    // Search filter
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.currentFilters.search = e.target.value.toLowerCase();
        this.renderTests();
      });
    }
  }

  updateFilters() {
    const checkedFilters = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
      .map(cb => cb.value)
      .filter(value => ['all', 'changed', 'unchanged', 'approved', 'rejected', 'new', 'deleted'].includes(value));

    this.currentFilters.status = checkedFilters.length > 0 ? checkedFilters : ['all'];
    this.renderTests();
  }

  applyFilters(tests) {
    return tests.filter(test => {
      // Status filter for visual regression
      const decision = this.decisions.get(test.name);
      const effectiveStatus = decision ? decision.action : test.status;
      const approvalStatus = test.approvalStatus;
      
      const statusMatch = this.currentFilters.status.includes('all') ||
        this.currentFilters.status.some(filter => {
          switch (filter) {
            case 'changed': 
              return test.status === 'changed' || test.status === 'failed';
            case 'unchanged': 
              return test.status === 'passed';
            case 'approved':
              return approvalStatus === 'approved' || effectiveStatus === 'accept';
            case 'rejected':
              return approvalStatus === 'rejected' || effectiveStatus === 'reject';
            case 'new':
              return test.status === 'new';
            case 'deleted':
              return test.status === 'deleted';
            default: 
              return true;
          }
        });

      // Search filter
      const searchMatch = !this.currentFilters.search || 
        test.name.toLowerCase().includes(this.currentFilters.search);

      return statusMatch && searchMatch;
    });
  }

  // Export Functionality
  setupExport() {
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportDecisions());
    }
  }

  exportDecisions() {
    if (this.decisions.size === 0 && (!this.approvalsData || 
        (this.approvalsData.approved.length === 0 && 
         this.approvalsData.rejected.length === 0 && 
         this.approvalsData.new.length === 0 && 
         this.approvalsData.deleted.length === 0))) {
      window.testivAI.componentManager.showToast(
        'No decisions to export',
        'warning'
      );
      return;
    }

    // Export both decisions and approvals
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        gitInfo: this.reportData?.metadata?.gitInfo,
        totalDecisions: this.decisions.size
      },
      decisions: Object.fromEntries(this.decisions),
      approvals: this.approvalsData || {
        approved: [],
        rejected: [],
        new: [],
        deleted: [],
        meta: {
          author: this.reportData?.metadata?.gitInfo?.author || 'unknown',
          timestamp: new Date().toISOString()
        }
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `testivai-approvals-${exportData.metadata.gitInfo?.shortSha || 'unknown'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    window.testivAI.componentManager.showToast(
      'Approvals exported successfully',
      'success'
    );
  }

  // Public API
  getDecisions() {
    return Object.fromEntries(this.decisions);
  }

  getFilteredTests() {
    return this.filteredTests;
  }

  refreshReport() {
    this.loadReport();
  }
}

// Initialize report manager
const reportManager = new ReportManager();

// Export for use in other scripts
window.testivAI = window.testivAI || {};
window.testivAI.reportManager = reportManager;

// Global functions for inline event handlers
window.approve = (testName) => reportManager.approveTest(testName);
window.reject = (testName) => reportManager.rejectTest(testName);
