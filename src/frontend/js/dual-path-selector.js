/**
 * Dual-Path Selector Module
 * Handles the retail vs professional user journey selection
 */

class DualPathSelector {
  constructor() {
    this.retailBtn = document.querySelector('.retail-demo-btn');
    this.retailTriggers = document.querySelectorAll('.js-retail-demo-trigger');
    this.professionalBtn = document.querySelector('.professional-btn');
    this.sessionKey = 'demoExperience';

    this.init();
  }

  init() {
    if (this.retailBtn) {
      this.retailBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleRetailClick(e);
      });
    }

    if (this.retailTriggers.length) {
      this.retailTriggers.forEach((trigger) => {
        trigger.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleRetailClick(e);
        });
      });
    }

    if (!this.retailBtn && !this.retailTriggers.length) {
      console.warn('[DualPathSelector] No retail CTA found in DOM');
    }

    // Professional button link is handled by HTML href attribute
    if (this.professionalBtn) {
      this.professionalBtn.addEventListener('click', () => {
        this.trackAnalytics('dual_cta_clicked', {
          cta_type: 'professionals',
          entry_point: 'homepage'
        });
      });
    }

    // Check for return visitor and update label if needed
    this.updateReturnVisitorLabel();
  }

  handleRetailClick(event) {
    // Detect entry point from button attributes or class
    let entryPoint = 'dual_path_homepage'; // default context

    if (event && event.currentTarget) {
      const button = event.currentTarget;

      // Check for explicit data-entry-point attribute
      if (button.dataset.entryPoint) {
        entryPoint = button.dataset.entryPoint;
      }
      // Check for data-cta attribute
      else if (button.dataset.cta) {
        entryPoint = button.dataset.cta;
      }
      // Check if it's in dropdown menu
      else if (button.classList.contains('dropdown-link')) {
        entryPoint = 'header_dropdown_agent';
      }
      // Check if it's js-retail-demo-trigger in hero
      else if (button.classList.contains('retail-demo-btn')) {
        entryPoint = 'homepage_dual_path';
      }
      // Check if it's in mobile nav
      else if (button.classList.contains('mobile-nav-link')) {
        entryPoint = 'mobile_nav_agent';
      }
      // Check for gray-btn class (vision section)
      else if (button.classList.contains('gray-btn')) {
        entryPoint = 'vision_section_demo';
      }
    }

    // Track the click with specific entry point
    this.trackAnalytics('dual_cta_clicked', {
      cta_type: 'retail_investors',
      entry_point: entryPoint
    });

    // Check if this is a return visitor
    const stored = this.getStoredDemoExperience();

    if (stored && stored.level && stored.scenarioId) {
      // Return visitor - replay their previous demo
      this.replayDemo(stored);
      return;
    }

    // Try to open overlay directly on the page (homepage or other surface)
    if (!this.openKnowledgeOverlay(entryPoint)) {
      // Overlay not available on this page yet - just store the intent
      // TODO: Add demo overlay to all pages instead of redirecting to pricing
      sessionStorage.setItem('pendingOverlayEntryPoint', entryPoint);
      console.log('[DualPathSelector] Knowledge overlay not available on this page yet');
    }
  }

  getStoredDemoExperience() {
    try {
      const stored = sessionStorage.getItem(this.sessionKey);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error('[DualPathSelector] Error reading session storage:', e);
      return null;
    }
  }

  updateReturnVisitorLabel() {
    // Only update retail button if it exists on this page
    if (!this.retailBtn) {
      return;
    }

    const stored = this.getStoredDemoExperience();

    if (stored && stored.level && stored.scenarioId) {
      const levelMap = {
        'beginner': 'Débutant',
        'intermediate': 'Intermédiaire',
        'expert': 'Expert'
      };

      const levelDisplay = levelMap[stored.level] || stored.level;
      const baseText = document.documentElement.lang === 'en'
        ? `Replay Your Demo (Level: ${levelDisplay})`
        : `Revoir votre démo (Niveau : ${levelDisplay})`;

      this.retailBtn.textContent = baseText;
      this.retailBtn.setAttribute('data-return-visitor', 'true');
    }
  }

  showReturnVisitorOptions(demoExperience) {
    // For now, just proceed to replay the demo
    // Could be enhanced to show a menu with "Replay" vs "Change Demo" options
    this.replayDemo(demoExperience);
  }

  replayDemo(demoExperience) {
    // Scroll to pricing/demo section or trigger demo directly
    // This will be coordinated with the knowledge overlay and demo player

    // Temporarily store that this is a replay (not first-time)
    const updatedExperience = {
      ...demoExperience,
      isReplay: true,
      replayTimestamp: Date.now()
    };

    sessionStorage.setItem(this.sessionKey, JSON.stringify(updatedExperience));

    // Dispatch custom event that knowledge overlay and demo player can listen to
    window.dispatchEvent(new CustomEvent('dualPathReturnVisitorClick', {
      detail: updatedExperience
    }));

    // Try to open the demo overlay if available
    // TODO: Add demo overlay to all pages instead of redirecting to pricing
    this.openKnowledgeOverlay('return_visitor_replay');
  }

  openKnowledgeOverlay(entryPoint = 'dual_path_homepage') {
    const overlay = document.getElementById('knowledge-overlay');
    if (!overlay) {
      return false;
    }

    window.dispatchEvent(new CustomEvent('openKnowledgeOverlay', {
      detail: { entryPoint }
    }));
    return true;
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
    new DualPathSelector();
  });
} else {
  new DualPathSelector();
}
