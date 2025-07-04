document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit to ensure all other scripts are loaded
  setTimeout(() => {
    const chatInput = document.querySelector('.chat-input');
    if (!chatInput) return;

    let placeholderInterval;
    let currentPlaceholderIndex = 0;
    let isTyping = false;

    const typePlaceholder = (text, callback) => {
      let i = 0;
      chatInput.placeholder = '';
      isTyping = true;

      const typing = setInterval(() => {
        if (i < text.length) {
          chatInput.placeholder += text.charAt(i);
          i++;
        } else {
          clearInterval(typing);
          isTyping = false;
          if (callback) callback();
        }
      }, 50);
    };

    const rotatePlaceholders = () => {
      const lang = document.documentElement.lang || 'fr';
      const placeholders = translations['chat.rotatingPlaceholders'][lang];
      if (!placeholders || !placeholders.length || isTyping) return;

      typePlaceholder(placeholders[currentPlaceholderIndex], () => {
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
      clearInterval(placeholderInterval);
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
