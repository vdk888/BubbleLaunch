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
  const isSimulatorPage = window.location.pathname.includes('portfolio-simulator');

  if (isSimulatorPage) {
    // Always show on simulator page (no 'hidden' class)
    floatingInput.classList.remove('hidden');
  } else {
    // Main page: show when "Join Us" button is no longer visible
    const joinButton = document.querySelector('.cta-button[href="#waitlist"]');

    if (joinButton) {
      const handleScroll = () => {
        const buttonRect = joinButton.getBoundingClientRect();

        // Show input when "Join Us" button scrolls out of view (top of button is above viewport)
        if (buttonRect.bottom < 0) {
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
   * Handle input submission - opens floating bubble chat and sends message
   */
  function handleSubmit() {
    const message = inputField.value.trim();
    if (!message) return;

    // Open the floating bubble chat
    const floatingBubble = document.querySelector('.floating-bubble-inner');
    if (floatingBubble) {
      floatingBubble.click(); // Opens the chat window

      // Wait for chat to open, then populate and send message
      setTimeout(() => {
        const miniChatInput = document.querySelector('.mini-chat-input');
        const miniChatSend = document.querySelector('.mini-chat-send');

        if (miniChatInput && miniChatSend) {
          miniChatInput.value = message;
          miniChatSend.click(); // Send the message

          // Clear the floating input
          inputField.value = '';
        }
      }, 100);
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
