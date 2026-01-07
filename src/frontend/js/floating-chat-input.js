/**
 * Floating Glassmorphism Chat Input
 * Appears at bottom center after scrolling past waitlist (main page)
 * or always visible (simulator page)
 *
 * On education pages (arena, simulator), event handling is delegated to
 * education-floating-chat.js which connects to the Playground session.
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

  // Detect education pages - these are handled by education-floating-chat.js
  // Check both /education/ and /playground/ paths (routes serve files from different paths)
  const isEducationPage = window.location.pathname.includes('/education/arena') ||
                          window.location.pathname.includes('/education/simulator') ||
                          window.location.pathname.includes('/playground/arena') ||
                          window.location.pathname.includes('/playground/simulator');

  // Determine if we're on the simulator page
  const dataset = floatingInput.dataset || {};
  const isSimulatorPage = window.location.pathname.includes('portfolio-simulator');
  const pageContext = dataset.pageContext || (isSimulatorPage ? 'portfolio-simulator' : 'landing');
  const customTriggerSelector = dataset.triggerSelector;
  const alwaysVisible = dataset.alwaysVisible === 'true';

  // Skip event handling on education pages - delegated to education-floating-chat.js
  // BUT still set up language change listener for placeholder updates
  if (isEducationPage) {
    console.log('[FloatingChatInput] Education page detected - delegating to education-floating-chat.js');
    // Still handle visibility for education pages
    if (alwaysVisible) {
      floatingInput.classList.remove('hidden');
    }

    // Update placeholder based on language for education pages too
    function updateEducationPlaceholder() {
      const lang = localStorage.getItem('bubbleLanguage') || 'fr';
      const translations = window.translations?.['floating_input.placeholder'];

      if (translations && translations[lang]) {
        inputField.placeholder = translations[lang];
      }
    }

    // Initial placeholder update
    updateEducationPlaceholder();

    // Listen for language changes (dispatched on document, not window)
    document.addEventListener('languageChanged', updateEducationPlaceholder);

    return;
  }

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
  const storageKey = `floatingChatUsed:${pageContext}`;
  let alreadyUsed = false;

  try {
    alreadyUsed = sessionStorage.getItem(storageKey) === '1';
  } catch (e) {
    alreadyUsed = false;
  }

  function applyVisibility() {
    const shouldShow = baseVisible && !panelOpen && (!alreadyUsed || alwaysVisible);
    floatingInput.classList.toggle('hidden', !shouldShow);
  }

  if (alwaysVisible) {
    baseVisible = true;
    alreadyUsed = false; // force show even if previously used
    applyVisibility();
    console.log('[FloatingChatInput] Always visible mode enabled');
  } else if (!alreadyUsed) {
    // Find the trigger element - the hero chat input section
    const triggerElement = customTriggerSelector
      ? document.querySelector(customTriggerSelector)
      : document.querySelector('.hero-chat-form') || document.querySelector('.hero-section');

    if (triggerElement) {
      console.log('[FloatingChatInput] Trigger element found:', triggerElement.className);
      const handleScroll = () => {
        const rect = triggerElement.getBoundingClientRect();
        // Show floating input when hero input scrolls out of view (top of screen)
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
    } else {
      console.warn('[FloatingChatInput] Trigger element not found - floating chat will not appear on scroll');
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
      alreadyUsed = true;
      try {
        sessionStorage.setItem(storageKey, '1');
      } catch (e) {
        /* ignore */
      }
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

  // Listen for language changes (dispatched on document, not window)
  document.addEventListener('languageChanged', updatePlaceholder);

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
