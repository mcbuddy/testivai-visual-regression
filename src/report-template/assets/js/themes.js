// testivAI Visual Regression Report - Theme Management
// Handles theme switching and persistence

class ThemeManager {
  constructor() {
    this.currentTheme = this.getStoredTheme() || 'light';
    this.themeToggle = null;
    this.init();
  }

  init() {
    // Apply stored theme immediately
    this.applyTheme(this.currentTheme);
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
    } else {
      this.setupEventListeners();
    }
  }

  setupEventListeners() {
    this.themeToggle = document.getElementById('theme-toggle');
    
    if (this.themeToggle) {
      this.themeToggle.addEventListener('click', () => this.toggleTheme());
      this.updateThemeIcon();
    }

    // Listen for system theme changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        if (!this.hasStoredTheme()) {
          this.applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }

    // Keyboard shortcut for theme toggle (Ctrl/Cmd + Shift + T)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        this.toggleTheme();
      }
    });
  }

  getStoredTheme() {
    try {
      return localStorage.getItem('testivai-theme');
    } catch (e) {
      console.warn('Failed to read theme from localStorage:', e);
      return null;
    }
  }

  hasStoredTheme() {
    return this.getStoredTheme() !== null;
  }

  storeTheme(theme) {
    try {
      localStorage.setItem('testivai-theme', theme);
    } catch (e) {
      console.warn('Failed to store theme in localStorage:', e);
    }
  }

  getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  applyTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    this.updateThemeIcon();
    this.storeTheme(theme);
    
    // Dispatch theme change event
    window.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { theme: theme } 
    }));
  }

  toggleTheme() {
    const themes = ['light', 'dark'];
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    
    this.applyTheme(nextTheme);
    
    // Show toast notification
    this.showThemeChangeNotification(nextTheme);
  }

  updateThemeIcon() {
    if (!this.themeToggle) return;

    const icon = this.themeToggle.querySelector('.theme-icon');
    if (!icon) return;

    // Update icon based on current theme
    if (this.currentTheme === 'dark') {
      // Sun icon for switching to light
      icon.innerHTML = `
        <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2" fill="none"/>
        <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" stroke-width="2"/>
        <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="2"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" stroke-width="2"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2"/>
        <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2"/>
        <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" stroke-width="2"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="2"/>
      `;
      this.themeToggle.setAttribute('aria-label', 'Switch to light theme');
    } else {
      // Moon icon for switching to dark
      icon.innerHTML = `
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" fill="none"/>
      `;
      this.themeToggle.setAttribute('aria-label', 'Switch to dark theme');
    }
  }

  showThemeChangeNotification(theme) {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.className = 'theme-toast';
    toast.innerHTML = `
      <div class="theme-toast-content">
        <span class="theme-toast-icon">${theme === 'dark' ? '🌙' : '☀️'}</span>
        <span class="theme-toast-text">Switched to ${theme} theme</span>
      </div>
    `;

    // Add toast styles
    Object.assign(toast.style, {
      position: 'fixed',
      top: 'calc(var(--header-height) + 1rem)',
      right: '1rem',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--border-radius)',
      padding: '0.75rem 1rem',
      boxShadow: 'var(--shadow-lg)',
      zIndex: '9999',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.875rem',
      color: 'var(--color-text-primary)',
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease-in-out',
      pointerEvents: 'none'
    });

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
    });

    // Remove after delay
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 2000);
  }

  // Public API
  getCurrentTheme() {
    return this.currentTheme;
  }

  setTheme(theme) {
    if (['light', 'dark'].includes(theme)) {
      this.applyTheme(theme);
    }
  }

  resetToSystemTheme() {
    const systemTheme = this.getSystemTheme();
    this.applyTheme(systemTheme);
    localStorage.removeItem('testivai-theme');
  }
}

// Initialize theme manager
const themeManager = new ThemeManager();

// Export for use in other scripts
window.testivai = window.testivai || {};
window.testivai.themeManager = themeManager;

// CSS for theme toast (injected dynamically)
const themeToastStyles = `
  .theme-toast-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .theme-toast-icon {
    font-size: 1rem;
  }
  
  .theme-toast-text {
    font-weight: 500;
  }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = themeToastStyles;
document.head.appendChild(styleSheet);
