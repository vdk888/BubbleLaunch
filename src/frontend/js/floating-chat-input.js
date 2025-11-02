/**
 * Floating Glassmorphism Chat Input
 * Appears at bottom center after scrolling past waitlist (main page)
 * or always visible (simulator page)
 */

(function() {
  'use strict';

  const floatingInput = document.getElementById('floating-chat-input');
  const inputField = floatingInput?.querySelector('.floating-input-field');
  const submitButton = floatingInput?.querySelector('.floating-input-submit');

  if (!floatingInput || !inputField || !submitButton) {
    console.warn('Floating chat input elements not found');
    return;
  }

  // Determine if we're on the simulator page
  const dataset = floatingInput.dataset || {};
  const isSimulatorPage = window.location.pathname.includes('portfolio-simulator');
  const pageContext = dataset.pageContext || (isSimulatorPage ? 'portfolio-simulator' : 'landing');
  const customTriggerSelector = dataset.triggerSelector;
  const alwaysVisible = dataset.alwaysVisible === 'true';

  function getCurrentLanguage() {
    return document.documentElement.lang || localStorage.getItem('bubbleLanguage') || 'fr';
  }

  function trackFloatingInputEvent(action, params = {}) {
    if (typeof window.gtag !== 'function') return;
    const state = window.bubbleSimulatorState || {};
    window.gtag('event', action, {
      event_category: 'Floating Chat Input',
      language: getCurrentLanguage(),
      page_context: pageContext,
      strategy: state.strategy || null,
      period_years: state.period || null,
      ...params,
    });
  }

  let panelOpen = Boolean(window.chatSidePanel?.isOpen && window.chatSidePanel.isOpen());
  let baseVisible = false;

  function applyVisibility() {
    const shouldShow = baseVisible && !panelOpen;
    floatingInput.classList.toggle('hidden', !shouldShow);
  }

  if (isSimulatorPage || alwaysVisible) {
    baseVisible = true;
    applyVisibility();
  } else {
    const triggerElement = customTriggerSelector
      ? document.querySelector(customTriggerSelector)
      : document.querySelector('.cta-button[href="#waitlist"], .cta-button[href="/#waitlist"], .cta-button[href*="#waitlist"], a[href="/#waitlist"]');

    if (triggerElement) {
      const handleScroll = () => {
        const rect = triggerElement.getBoundingClientRect();
        baseVisible = rect.bottom < 0;
        applyVisibility();
      };

      handleScroll();

      let ticking = false;
      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            handleScroll();
            ticking = false;
          });
          ticking = true;
        }
      });
    }
  }

  applyVisibility();

  /**
   * Handle input submission - opens main chatbot and sends message
   */
  function handleSubmit() {
    const message = inputField.value.trim();
    if (!message) return;

    trackFloatingInputEvent('floating_input_submitted', {
      characters: message.length,
    });

    if (window.chatSidePanel && typeof window.chatSidePanel.open === 'function') {
      window.chatSidePanel.open(message);
      panelOpen = true;
      applyVisibility();
      inputField.value = '';
      inputField.blur();

      trackFloatingInputEvent('floating_input_forwarded', {
        success: true,
        destination: 'chat_side_panel',
      });
      return;
    }

    trackFloatingInputEvent('floating_input_forwarded', {
      success: false,
      reason: 'chat_side_panel_unavailable',
    });
  }

  // Submit on button click
  submitButton.addEventListener('click', handleSubmit);

  // Submit on Enter key
  inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  });

  // Update placeholder based on language
  function updatePlaceholder() {
    const lang = localStorage.getItem('bubbleLanguage') || 'fr';
    const translations = window.translations?.['floating_input.placeholder'];

    if (translations && translations[lang]) {
      inputField.placeholder = translations[lang];
    }
  }

  // Initial placeholder update
  updatePlaceholder();

  // Listen for language changes
  window.addEventListener('languageChanged', updatePlaceholder);

  window.addEventListener('chatSidePanel:opened', () => {
    panelOpen = true;
    applyVisibility();
  });

  window.addEventListener('chatSidePanel:restored', () => {
    panelOpen = true;
    applyVisibility();
  });

  window.addEventListener('chatSidePanel:minimized', () => {
    panelOpen = true;
    applyVisibility();
  });

  window.addEventListener('chatSidePanel:closed', () => {
    panelOpen = false;
    inputField.value = '';
    applyVisibility();
  });
})();
