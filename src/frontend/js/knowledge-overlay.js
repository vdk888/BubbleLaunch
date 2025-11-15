/**
 * Knowledge Overlay Module
 * Manages the user knowledge level selection before demo playback
 */

class KnowledgeOverlay {
  constructor() {
    this.overlay = document.getElementById('knowledge-overlay');
    this.options = document.querySelectorAll('.knowledge-option');
    this.fallbackLink = document.querySelector('.knowledge-fallback-link');
    this.sessionKey = 'demoExperience';
    this.scenarioMap = {
      'beginner': 'macro-defense',
      'intermediate': 'japan-momentum',
      'expert': 'semiconductors-sortino'
    };

    this.init();
  }

  init() {
    if (!this.overlay) {
      console.warn('[KnowledgeOverlay] Overlay element not found');
      return;
    }

    // Set up option button click handlers
    this.options.forEach(option => {
      option.addEventListener('click', (e) => this.handleOptionSelect(e));
    });

    // Set up fallback link handler
    if (this.fallbackLink) {
      this.fallbackLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.selectLevel('intermediate');
      });
    }

    // Listen for custom event from dual-path selector
    window.addEventListener('openKnowledgeOverlay', (e) => {
      this.show(e.detail?.entryPoint || 'unknown');
    });

    // Listen for return visitor event
    window.addEventListener('dualPathReturnVisitorClick', (e) => {
      // For return visitors, skip knowledge overlay and go directly to demo
      this.hide();
      this.launchDemo(e.detail);
    });

    // Keyboard navigation
    this.setupKeyboardNavigation();

    // Focus trap
    this.setupFocusTrap();

    // ESC key to close (if already at pricing page)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.overlay.classList.contains('hidden')) {
        this.hide();
      }
    });

    // Auto-show on pricing page if user came from homepage
    this.autoShowIfNeeded();
  }

  autoShowIfNeeded() {
    // Check if we're on the pricing page
    if (!window.location.pathname.includes('/pricing')) {
      return;
    }

    // Check if user just arrived from homepage (referrer check)
    const referrer = document.referrer;
    const isFromHomepage = referrer.includes('bubbleinvest.org') ||
                          referrer.includes('localhost') ||
                          referrer === '';

    // Check if user already selected a level
    const stored = this.getStoredDemoExperience();

    // If coming from homepage AND no prior selection, show the overlay
    if (isFromHomepage && (!stored || !stored.level)) {
      setTimeout(() => {
        this.show('homepage_to_pricing');
      }, 300);
    }
  }

  getStoredDemoExperience() {
    try {
      const stored = sessionStorage.getItem(this.sessionKey);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error('[KnowledgeOverlay] Error reading session storage:', e);
      return null;
    }
  }

  handleOptionSelect(event) {
    const button = event.currentTarget;
    const level = button.getAttribute('data-level');

    // Remove active state from all options
    this.options.forEach(opt => {
      opt.classList.remove('active');
      opt.setAttribute('aria-pressed', 'false');
    });

    // Add active state to clicked option
    button.classList.add('active');
    button.setAttribute('aria-pressed', 'true');

    // Short delay to show visual feedback before proceeding
    setTimeout(() => {
      this.selectLevel(level);
    }, 200);
  }

  selectLevel(level) {
    // Validate level
    if (!this.scenarioMap[level]) {
      console.error('[KnowledgeOverlay] Invalid level:', level);
      level = 'intermediate'; // Fallback
    }

    const scenarioId = this.scenarioMap[level];
    const entryPoint = this.getEntryPoint();

    // Store selection
    const demoExperience = {
      level,
      scenarioId,
      timestamp: Date.now(),
      entryPoint
    };

    sessionStorage.setItem(this.sessionKey, JSON.stringify(demoExperience));

    // Track analytics
    this.trackAnalytics('demo_knowledge_selected', {
      knowledge_level: level,
      scenario_id: scenarioId,
      entry_point: entryPoint
    });

    // Close overlay
    this.hide();

    // Launch demo
    this.launchDemo(demoExperience);
  }

  launchDemo(demoExperience) {
    // Dispatch event for demo player to listen to
    window.dispatchEvent(new CustomEvent('launchDemo', {
      detail: demoExperience
    }));
  }

  show(entryPoint = 'unknown') {
    this.overlay.classList.remove('hidden');
    this.setEntryPoint(entryPoint);

    // Set focus to first interactive element
    setTimeout(() => {
      const firstOption = this.options[0];
      if (firstOption) {
        firstOption.focus();
      }
    }, 100);

    // Track analytics
    this.trackAnalytics('demo_knowledge_question_shown', {
      entry_point: entryPoint
    });
  }

  hide() {
    this.overlay.classList.add('hidden');
  }

  setupKeyboardNavigation() {
    // Allow arrow key navigation between options
    this.options.forEach((option, index) => {
      option.addEventListener('keydown', (e) => {
        let nextIndex = -1;

        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          nextIndex = (index + 1) % this.options.length;
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          nextIndex = (index - 1 + this.options.length) % this.options.length;
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleOptionSelect({ currentTarget: option });
        }

        if (nextIndex >= 0) {
          this.options[nextIndex].focus();
        }
      });
    });
  }

  setupFocusTrap() {
    // Focus trap: keep focus within overlay while it's visible
    const focusableElements = this.overlay.querySelectorAll(
      'button, [href], textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    this.overlay.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    });
  }

  setEntryPoint(entryPoint) {
    sessionStorage.setItem('demoEntryPoint', entryPoint);
  }

  getEntryPoint() {
    return sessionStorage.getItem('demoEntryPoint') || 'homepage';
  }

  trackAnalytics(eventName, eventData) {
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, eventData);
    } else {
      console.log('[Analytics]', eventName, eventData);
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new KnowledgeOverlay();
  });
} else {
  new KnowledgeOverlay();
}
