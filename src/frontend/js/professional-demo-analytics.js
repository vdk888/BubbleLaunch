/**
 * Professional Demo Analytics
 * Tracks entry points and prompt button clicks for professional demo pages
 */

(function() {
  'use strict';

  // Track page entry
  function trackDemoEntry() {
    // Detect entry point from referrer
    const referrer = document.referrer;
    let entryPoint = 'direct';

    if (referrer.includes('/professionals') && !referrer.includes('/demo')) {
      entryPoint = 'professionals_index';
    } else if (referrer.includes('solutions-companies')) {
      entryPoint = 'solutions_companies';
    } else if (referrer.includes('solutions-wealth')) {
      entryPoint = 'solutions_wealth_managers';
    } else if (referrer) {
      entryPoint = 'other';
    }

    // Fire analytics event
    if (typeof gtag !== 'undefined') {
      gtag('event', 'professional_demo_entry', {
        entry_point: entryPoint,
        page_path: window.location.pathname
      });
    } else {
      console.log('[Professional Demo Analytics] Demo entry:', { entry_point: entryPoint });
    }
  }

  // Track prompt button clicks
  function attachPromptAnalytics() {
    const promptButtons = document.querySelectorAll('[data-prompt-key]');

    promptButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        const promptKey = this.getAttribute('data-prompt-key');
        const promptLabel = this.textContent.trim();

        // Fire analytics event
        if (typeof gtag !== 'undefined') {
          gtag('event', 'demo_prompt_clicked', {
            audience: 'professional',
            prompt_key: promptKey,
            prompt_label: promptLabel,
            page_path: window.location.pathname
          });
        } else {
          console.log('[Professional Demo Analytics] Prompt clicked:', {
            audience: 'professional',
            prompt_key: promptKey,
            prompt_label: promptLabel
          });
        }
      });
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      trackDemoEntry();
      attachPromptAnalytics();
    });
  } else {
    trackDemoEntry();
    attachPromptAnalytics();
  }
})();
