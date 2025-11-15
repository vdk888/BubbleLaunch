/**
 * Dual-Path Selector Module
 * Handles the retail vs professional user journey selection
 */

class DualPathSelector {
  constructor() {
    this.retailBtn = document.querySelector('.retail-demo-btn');
    this.professionalBtn = document.querySelector('.professional-btn');
    this.sessionKey = 'demoExperience';

    this.init();
  }

  init() {
    if (!this.retailBtn) {
      console.warn('[DualPathSelector] Retail button not found in DOM');
      return;
    }

    // Add analytics tracking for retail button click
    this.retailBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleRetailClick();
    });

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

  handleRetailClick() {
    // Track the click
    this.trackAnalytics('dual_cta_clicked', {
      cta_type: 'retail_investors',
      entry_point: 'homepage'
    });

    // Check if this is a return visitor
    const stored = this.getStoredDemoExperience();

    if (stored && stored.level && stored.scenarioId) {
      // Return visitor - replay their previous demo
      this.replayDemo(stored);
    } else {
      // New visitor - navigate to investors page
      const investorsUrl = document.documentElement.lang === 'en' ? '/en/investors' : '/investors';
      window.location.href = investorsUrl;
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

    // Optionally navigate to investors pricing page if not already there
    if (!window.location.pathname.includes('/investors') && !window.location.pathname.includes('/pricing')) {
      const investorsUrl = document.documentElement.lang === 'en' ? '/en/investors/pricing' : '/investors/pricing';
      window.location.href = investorsUrl;
    }
  }

  openKnowledgeOverlay() {
    // Dispatch custom event that knowledge overlay will listen to
    window.dispatchEvent(new CustomEvent('openKnowledgeOverlay', {
      detail: { entryPoint: 'homepage' }
    }));
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
