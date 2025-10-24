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
    return document.documentElement.lang || localStorage.getItem('preferredLanguage') || 'fr';
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

  if (isSimulatorPage || alwaysVisible) {
    // Always show on simulator or explicitly requested pages
    floatingInput.classList.remove('hidden');
  } else {
    // Determine trigger element (defaults to main CTA button)
    const triggerElement = customTriggerSelector
      ? document.querySelector(customTriggerSelector)
      : document.querySelector('.cta-button[href="#waitlist"]');

    if (triggerElement) {
      const handleScroll = () => {
        const rect = triggerElement.getBoundingClientRect();

        // Show input when trigger element scrolls out of view (bottom above viewport)
        if (rect.bottom < 0) {
          floatingInput.classList.remove('hidden');
        } else {
          floatingInput.classList.add('hidden');
        }
      };

      // Initial check
      handleScroll();

      // Listen to scroll events (throttled with requestAnimationFrame)
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

  /**
   * Handle input submission - opens main chatbot and sends message
   */
  function handleSubmit() {
    const message = inputField.value.trim();
    if (!message) return;

    trackFloatingInputEvent('floating_input_submitted', {
      characters: message.length,
    });

    // Find the main chatbot section
    const chatSection = document.querySelector('.chat-section');
    const chatStandaloneSection = document.querySelector('.chat-standalone-section');
    const mainChatInput = document.querySelector('.chat-input');
    const mainChatSubmit = document.querySelector('.chat-submit');

    if (chatSection && mainChatInput && mainChatSubmit) {
      // Show chat section if it's hidden (businesses page)
      if (chatStandaloneSection && !chatStandaloneSection.classList.contains('visible')) {
        chatStandaloneSection.classList.add('visible');
      }

      // Scroll to chatbot section smoothly
      chatSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Wait for scroll, then populate and send message
      setTimeout(() => {
        // Populate input
        mainChatInput.value = message;

        // Focus the input (triggers fullscreen on mobile if needed)
        mainChatInput.focus();

        // Small delay to ensure input is focused, then submit
        setTimeout(() => {
          mainChatSubmit.click(); // Send the message

          // Clear the floating input
          inputField.value = '';

          // Hide floating input after submission
          floatingInput.classList.add('hidden');

          trackFloatingInputEvent('floating_input_forwarded', {
            success: true,
          });
        }, 100);
      }, 500); // Wait for smooth scroll
    } else if (window.bubbleMiniChat && typeof window.bubbleMiniChat.sendMessage === 'function') {
      window.bubbleMiniChat.open?.();
      window.bubbleMiniChat.sendMessage(message);
      inputField.value = '';

      trackFloatingInputEvent('floating_input_forwarded', {
        success: true,
        destination: 'mini_chat',
      });
    } else {
      trackFloatingInputEvent('floating_input_forwarded', {
        success: false,
        reason: 'main_chat_not_found',
      });
    }
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
    const lang = localStorage.getItem('preferredLanguage') || 'fr';
    const translations = window.translations?.['floating_input.placeholder'];

    if (translations && translations[lang]) {
      inputField.placeholder = translations[lang];
    }
  }

  // Initial placeholder update
  updatePlaceholder();

  // Listen for language changes
  window.addEventListener('languageChanged', updatePlaceholder);
})();
