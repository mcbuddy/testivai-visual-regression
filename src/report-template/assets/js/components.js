// testivAI Visual Regression Report - Component Management
// Handles UI components, modals, and interactive elements

class ComponentManager {
  constructor() {
    this.modals = new Map();
    this.toasts = [];
    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupComponents());
    } else {
      this.setupComponents();
    }
  }

  setupComponents() {
    this.setupModals();
    this.setupToastContainer();
    this.setupKeyboardShortcuts();
    this.setupImageViewer();
    this.setupBulkActions();
  }

  // Modal Management
  setupModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      const modalId = modal.id;
      this.modals.set(modalId, {
        element: modal,
        isOpen: false
      });

      // Setup close handlers
      const closeBtn = modal.querySelector('.modal-close');
      const backdrop = modal.querySelector('.modal-backdrop');

      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeModal(modalId));
      }

      if (backdrop) {
        backdrop.addEventListener('click', () => this.closeModal(modalId));
      }

      // ESC key to close
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.modals.get(modalId)?.isOpen) {
          this.closeModal(modalId);
        }
      });
    });
  }

  openModal(modalId, options = {}) {
    const modal = this.modals.get(modalId);
    if (!modal) {
      console.warn(`Modal with id "${modalId}" not found`);
      return;
    }

    modal.element.classList.add('open');
    modal.isOpen = true;
    document.body.style.overflow = 'hidden';

    // Focus management
    const firstFocusable = modal.element.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
      firstFocusable.focus();
    }

    // Custom setup for specific modals
    if (options.setup && typeof options.setup === 'function') {
      options.setup(modal.element);
    }

    // Dispatch event
    window.dispatchEvent(new CustomEvent('modalOpened', { 
      detail: { modalId, modal: modal.element } 
    }));
  }

  closeModal(modalId) {
    const modal = this.modals.get(modalId);
    if (!modal || !modal.isOpen) return;

    modal.element.classList.remove('open');
    modal.isOpen = false;
    document.body.style.overflow = '';

    // Dispatch event
    window.dispatchEvent(new CustomEvent('modalClosed', { 
      detail: { modalId, modal: modal.element } 
    }));
  }

  closeAllModals() {
    this.modals.forEach((modal, modalId) => {
      if (modal.isOpen) {
        this.closeModal(modalId);
      }
    });
  }

  // Toast Notifications
  setupToastContainer() {
    if (!document.querySelector('.toast-container')) {
      const container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
  }

  showToast(message, type = 'info', duration = 5000) {
    const container = document.querySelector('.toast-container');
    if (!container) return;

    const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.id = toastId;

    const icons = {
      success: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" stroke-width="2" fill="none"/>
        <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" stroke-width="2"/>
      </svg>`,
      error: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
        <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/>
        <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
      </svg>`,
      warning: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" stroke-width="2" fill="none"/>
        <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2"/>
        <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" stroke-width="2"/>
      </svg>`,
      info: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
        <path d="M12 16v-4" stroke="currentColor" stroke-width="2"/>
        <path d="M12 8h.01" stroke="currentColor" stroke-width="2"/>
      </svg>`
    };

    toast.innerHTML = `
      ${icons[type] || icons.info}
      <div class="toast-content">
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" onclick="window.testivai.componentManager.closeToast('${toastId}')">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"/>
          <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"/>
        </svg>
      </button>
    `;

    container.appendChild(toast);
    this.toasts.push({ id: toastId, element: toast });

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => this.closeToast(toastId), duration);
    }

    return toastId;
  }

  closeToast(toastId) {
    const toastIndex = this.toasts.findIndex(t => t.id === toastId);
    if (toastIndex === -1) return;

    const toast = this.toasts[toastIndex];
    toast.element.style.transform = 'translateX(100%)';
    toast.element.style.opacity = '0';

    setTimeout(() => {
      if (toast.element.parentNode) {
        toast.element.parentNode.removeChild(toast.element);
      }
      this.toasts.splice(toastIndex, 1);
    }, 300);
  }

  // Image Viewer
  setupImageViewer() {
    // Will be called when image containers are clicked
    document.addEventListener('click', (e) => {
      const imageContainer = e.target.closest('.image-container');
      if (imageContainer) {
        const testCard = imageContainer.closest('.test-card');
        if (testCard) {
          this.openImageViewer(testCard);
        }
      }
    });
  }

  openImageViewer(testCard) {
    const testName = testCard.dataset.testName;
    const baseline = testCard.dataset.baseline;
    const current = testCard.dataset.current;
    const diff = testCard.dataset.diff;

    this.openModal('image-modal', {
      setup: (modal) => {
        const title = modal.querySelector('.modal-title');
        const viewer = modal.querySelector('.image-viewer');

        if (title) {
          title.textContent = `Image Comparison: ${testName}`;
        }

        if (viewer) {
          viewer.innerHTML = `
            <div class="viewer-controls">
              <button class="viewer-control-btn active" data-mode="side-by-side">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2" fill="none"/>
                  <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" stroke-width="2"/>
                </svg>
                Side by Side
              </button>
              <button class="viewer-control-btn" data-mode="overlay">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/>
                  <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" stroke-width="2"/>
                </svg>
                Overlay
              </button>
              <button class="viewer-control-btn" data-mode="diff-only">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2" fill="none"/>
                  <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2"/>
                  <line x1="16" y1="13" x2="8" y2="21" stroke="currentColor" stroke-width="2"/>
                  <line x1="8" y1="13" x2="16" y2="21" stroke="currentColor" stroke-width="2"/>
                </svg>
                Diff Only
              </button>
            </div>
            <div class="viewer-images">
              <div class="viewer-image-container">
                <div class="viewer-image-label">Baseline</div>
                <img src="${baseline}" alt="Baseline" class="viewer-image" />
              </div>
              <div class="viewer-image-container">
                <div class="viewer-image-label">Current</div>
                <img src="${current}" alt="Current" class="viewer-image" />
              </div>
              <div class="viewer-image-container">
                <div class="viewer-image-label">Difference</div>
                <img src="${diff}" alt="Difference" class="viewer-image" />
              </div>
            </div>
          `;

          // Setup viewer controls
          const controlBtns = viewer.querySelectorAll('.viewer-control-btn');
          controlBtns.forEach(btn => {
            btn.addEventListener('click', () => {
              controlBtns.forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
              this.updateViewerMode(viewer, btn.dataset.mode);
            });
          });
        }
      }
    });
  }

  updateViewerMode(viewer, mode) {
    const imagesContainer = viewer.querySelector('.viewer-images');
    if (!imagesContainer) return;

    // Reset classes
    imagesContainer.className = 'viewer-images';

    switch (mode) {
      case 'side-by-side':
        imagesContainer.style.gridTemplateColumns = '1fr 1fr 1fr';
        break;
      case 'overlay':
        imagesContainer.style.gridTemplateColumns = '1fr';
        // Hide baseline and current, show only overlay
        const containers = imagesContainer.querySelectorAll('.viewer-image-container');
        containers.forEach((container, index) => {
          container.style.display = index === 2 ? 'flex' : 'none';
        });
        break;
      case 'diff-only':
        imagesContainer.style.gridTemplateColumns = '1fr';
        // Show only diff
        const diffContainers = imagesContainer.querySelectorAll('.viewer-image-container');
        diffContainers.forEach((container, index) => {
          container.style.display = index === 2 ? 'flex' : 'none';
        });
        break;
    }
  }

  // Bulk Actions
  setupBulkActions() {
    const bulkBtn = document.getElementById('bulk-actions-btn');
    if (bulkBtn) {
      bulkBtn.addEventListener('click', () => this.openBulkActionsModal());
    }
  }

  openBulkActionsModal() {
    const selectedTests = document.querySelectorAll('.test-card-select:checked');
    
    this.openModal('bulk-modal', {
      setup: (modal) => {
        const body = modal.querySelector('.modal-body');
        if (body) {
          body.innerHTML = `
            <div class="bulk-summary">
              <div class="bulk-summary-text">You have selected:</div>
              <div class="bulk-summary-count">${selectedTests.length} test${selectedTests.length !== 1 ? 's' : ''}</div>
            </div>
            <p>Select an action to apply to all selected tests:</p>
            <div class="bulk-actions">
              <button class="btn btn-success" onclick="window.testivai.componentManager.bulkApprove()">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polyline points="20,6 9,17 4,12" stroke="currentColor" stroke-width="2"/>
                </svg>
                Accept All Selected
              </button>
              <button class="btn btn-danger" onclick="window.testivai.componentManager.bulkReject()">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"/>
                </svg>
                Reject All Selected
              </button>
            </div>
          `;
        }
      }
    });
  }

  bulkApprove() {
    const selectedTests = document.querySelectorAll('.test-card-select:checked');
    let count = 0;

    selectedTests.forEach(checkbox => {
      const testCard = checkbox.closest('.test-card');
      if (testCard) {
        window.testivai.reportManager.approveTest(testCard.dataset.testName);
        count++;
      }
    });

    this.closeModal('bulk-modal');
    this.showToast(`Accepted ${count} test${count !== 1 ? 's' : ''}`, 'success');
  }

  bulkReject() {
    const selectedTests = document.querySelectorAll('.test-card-select:checked');
    let count = 0;

    selectedTests.forEach(checkbox => {
      const testCard = checkbox.closest('.test-card');
      if (testCard) {
        window.testivai.reportManager.rejectTest(testCard.dataset.testName);
        count++;
      }
    });

    this.closeModal('bulk-modal');
    this.showToast(`Rejected ${count} test${count !== 1 ? 's' : ''}`, 'success');
  }

  // Keyboard Shortcuts
  setupKeyboardShortcuts() {
    let shortcutsVisible = false;

    document.addEventListener('keydown', (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case '?':
          e.preventDefault();
          this.toggleKeyboardShortcuts();
          break;
        case 'Escape':
          this.closeAllModals();
          break;
        case 'a':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.selectAllTests();
          }
          break;
      }
    });

    // Create shortcuts help
    this.createShortcutsHelp();
  }

  createShortcutsHelp() {
    const help = document.createElement('div');
    help.className = 'shortcuts-help';
    help.innerHTML = `
      <div class="shortcuts-list">
        <div class="shortcut-item">
          <span>Show/hide shortcuts</span>
          <span class="shortcut-key">?</span>
        </div>
        <div class="shortcut-item">
          <span>Close modal</span>
          <span class="shortcut-key">Esc</span>
        </div>
        <div class="shortcut-item">
          <span>Select all tests</span>
          <span class="shortcut-key">Ctrl+A</span>
        </div>
        <div class="shortcut-item">
          <span>Toggle theme</span>
          <span class="shortcut-key">Ctrl+Shift+T</span>
        </div>
      </div>
    `;
    document.body.appendChild(help);
  }

  toggleKeyboardShortcuts() {
    const help = document.querySelector('.shortcuts-help');
    if (help) {
      help.classList.toggle('visible');
    }
  }

  selectAllTests() {
    const checkboxes = document.querySelectorAll('.test-card-select');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(cb => {
      cb.checked = !allChecked;
      const testCard = cb.closest('.test-card');
      if (testCard) {
        testCard.classList.toggle('selected', cb.checked);
      }
    });

    this.showToast(
      allChecked ? 'Deselected all tests' : 'Selected all tests', 
      'info', 
      2000
    );
  }

  // Progress Bar
  createProgressBar(container, progress = 0) {
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.innerHTML = `<div class="progress-fill" style="width: ${progress}%"></div>`;
    
    if (container) {
      container.appendChild(progressBar);
    }
    
    return {
      element: progressBar,
      update: (newProgress, type = '') => {
        const fill = progressBar.querySelector('.progress-fill');
        fill.style.width = `${newProgress}%`;
        fill.className = `progress-fill ${type}`;
      }
    };
  }
}

// Initialize component manager
const componentManager = new ComponentManager();

// Export for use in other scripts
window.testivai = window.testivai || {};
window.testivai.componentManager = componentManager;

// Global functions for inline event handlers
window.closeBulkModal = () => componentManager.closeModal('bulk-modal');
window.bulkApprove = () => componentManager.bulkApprove();
window.bulkReject = () => componentManager.bulkReject();
