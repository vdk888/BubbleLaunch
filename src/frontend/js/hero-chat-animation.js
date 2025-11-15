/**
 * Hero Chat Input Placeholder Rotation Animation
 * Rotates through sample questions with typing animation
 * ONLY animates the hero section input, not the main chat input
 */

document.addEventListener('DOMContentLoaded', () => {
  const getTranslations = () =>
    (typeof window !== "undefined" && window.translations) ||
    (typeof translations !== "undefined" ? translations : {});
  // Wait a bit to ensure all other scripts are loaded
  setTimeout(() => {
    const heroChatInput = document.querySelector('.hero-chat-input');
    if (!heroChatInput) {
      console.log('[HeroChatAnimation] Hero chat input not found on this page');
      return;
    }

    let placeholderInterval;
    let currentPlaceholderIndex = 0;
    let isTyping = false;
    let currentTypingInterval = null;

    const typePlaceholder = (text, callback) => {
      // Clear any existing typing animation
      if (currentTypingInterval) {
        clearInterval(currentTypingInterval);
        currentTypingInterval = null;
      }

      // Validate text input
      if (!text || typeof text !== 'string') {
        console.warn('[HeroChatAnimation] Invalid placeholder text:', text);
        isTyping = false;
        if (callback) callback();
        return;
      }

      let i = 0;
      heroChatInput.placeholder = '';
      isTyping = true;

      currentTypingInterval = setInterval(() => {
        if (i < text.length) {
          heroChatInput.placeholder += text.charAt(i);
          i++;
        } else {
          clearInterval(currentTypingInterval);
          currentTypingInterval = null;
          isTyping = false;
          if (callback) callback();
        }
      }, 50);
    };

    const rotatePlaceholders = () => {
      const translationsData = getTranslations();
      // Ensure translations is loaded
      if (!translationsData || Object.keys(translationsData).length === 0) {
        console.warn('[HeroChatAnimation] Translations not loaded yet');
        return;
      }

      const lang = document.documentElement.lang || 'fr';

      // Check if chat.rotatingPlaceholders exists
      if (!translationsData['chat.rotatingPlaceholders']) {
        console.warn('[HeroChatAnimation] chat.rotatingPlaceholders not found in translations');
        return;
      }

      const placeholders = translationsData['chat.rotatingPlaceholders'][lang];

      // Validate placeholders array
      if (!placeholders || !Array.isArray(placeholders) || placeholders.length === 0) {
        console.warn('[HeroChatAnimation] Invalid placeholders array for lang:', lang);
        return;
      }

      if (isTyping) return;

      // Ensure index is within bounds
      if (currentPlaceholderIndex >= placeholders.length) {
        currentPlaceholderIndex = 0;
      }

      const currentText = placeholders[currentPlaceholderIndex];

      // Increment index BEFORE typing (not after) to avoid showing same question twice
      currentPlaceholderIndex = (currentPlaceholderIndex + 1) % placeholders.length;

      typePlaceholder(currentText, () => {
        // No wait needed here - timing is handled by setInterval
      });
    };

    const startPlaceholderRotation = () => {
      if (placeholderInterval) clearInterval(placeholderInterval);
      // Initial call
      rotatePlaceholders();
      // Subsequent calls
      placeholderInterval = setInterval(rotatePlaceholders, 4000); // Rotate every 4 seconds (2s typing + 2s pause)
    };

    const stopPlaceholderRotation = () => {
      // Clear main rotation interval
      if (placeholderInterval) {
        clearInterval(placeholderInterval);
        placeholderInterval = null;
      }
      // Clear any active typing animation
      if (currentTypingInterval) {
        clearInterval(currentTypingInterval);
        currentTypingInterval = null;
      }
      isTyping = false; // Reset typing state
      // Restore default placeholder from translations
      const lang = document.documentElement.lang || 'fr';
      const translationsData = getTranslations();
      if (
        translationsData['chat.placeholder'] &&
        translationsData['chat.placeholder'][lang]
      ) {
        heroChatInput.placeholder = translationsData['chat.placeholder'][lang];
      }
    };

    heroChatInput.addEventListener('focus', stopPlaceholderRotation);
    heroChatInput.addEventListener('blur', () => {
      if (heroChatInput.value === '') {
        startPlaceholderRotation();
      }
    });

    // Start rotation if the input is not focused and empty
    if (document.activeElement !== heroChatInput && heroChatInput.value === '') {
      startPlaceholderRotation();
    }

    // Handle language change
    document.addEventListener('languageChanged', () => {
      stopPlaceholderRotation();
      currentPlaceholderIndex = 0;
      if (document.activeElement !== heroChatInput && heroChatInput.value === '') {
        startPlaceholderRotation();
      }
    });
  }, 500); // Wait 500ms after DOM load
});
