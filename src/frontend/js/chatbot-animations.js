document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit to ensure all other scripts are loaded
  setTimeout(() => {
    const chatInput = document.querySelector('.chat-input');
    if (!chatInput) return;

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
        console.warn('Invalid placeholder text:', text);
        isTyping = false;
        if (callback) callback();
        return;
      }

      let i = 0;
      chatInput.placeholder = '';
      isTyping = true;

      currentTypingInterval = setInterval(() => {
        if (i < text.length) {
          chatInput.placeholder += text.charAt(i);
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
      // Ensure translations is loaded
      if (typeof translations === 'undefined') {
        console.warn('Translations not loaded yet');
        return;
      }

      const lang = document.documentElement.lang || 'fr';

      // Check if chat.rotatingPlaceholders exists
      if (!translations['chat.rotatingPlaceholders']) {
        console.warn('chat.rotatingPlaceholders not found in translations');
        return;
      }

      const placeholders = translations['chat.rotatingPlaceholders'][lang];

      // Validate placeholders array
      if (!placeholders || !Array.isArray(placeholders) || placeholders.length === 0) {
        console.warn('Invalid placeholders array for lang:', lang);
        return;
      }

      if (isTyping) return;

      // Ensure index is within bounds
      if (currentPlaceholderIndex >= placeholders.length) {
        currentPlaceholderIndex = 0;
      }

      const currentText = placeholders[currentPlaceholderIndex];

      typePlaceholder(currentText, () => {
        setTimeout(() => {
          currentPlaceholderIndex = (currentPlaceholderIndex + 1) % placeholders.length;
        }, 2000); // Wait 2 seconds before typing the next one
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
      // Restore default placeholder
      const lang = document.documentElement.lang || 'fr';
      if (translations['chat.placeholder'] && translations['chat.placeholder'][lang]) {
        chatInput.placeholder = translations['chat.placeholder'][lang];
      }
    };

    chatInput.addEventListener('focus', stopPlaceholderRotation);
    chatInput.addEventListener('blur', () => {
      if (chatInput.value === '') {
        startPlaceholderRotation();
      }
    });

    // Start rotation if the input is not focused and empty
    if (document.activeElement !== chatInput && chatInput.value === '') {
      startPlaceholderRotation();
    }

    // Handle language change
    document.addEventListener('languageChanged', () => {
      stopPlaceholderRotation();
      currentPlaceholderIndex = 0;
      if (document.activeElement !== chatInput && chatInput.value === '') {
        startPlaceholderRotation();
      }
    });
  }, 500); // Wait 500ms after DOM load
});
