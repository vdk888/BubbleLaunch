document.addEventListener('DOMContentLoaded', () => {
  const chatInput = document.querySelector('.chat-input');
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
    
    if (isTyping) return;

    typePlaceholder(placeholders[currentPlaceholderIndex], () => {
      setTimeout(() => {
        currentPlaceholderIndex = (currentPlaceholderIndex + 1) % placeholders.length;
        if (document.activeElement !== chatInput) {
           startPlaceholderRotation();
        }
      }, 2000); // Wait 2 seconds before starting next one
    });
  };

  const startPlaceholderRotation = () => {
    clearInterval(placeholderInterval);
    placeholderInterval = setInterval(rotatePlaceholders, 4000); // Rotate every 4 seconds
    rotatePlaceholders(); // Start immediately
  };

  const stopPlaceholderRotation = () => {
    clearInterval(placeholderInterval);
    isTyping = false;
  };

  chatInput.addEventListener('focus', () => {
    stopPlaceholderRotation();
  });

  chatInput.addEventListener('blur', () => {
    if (chatInput.value === '') {
      startPlaceholderRotation();
    }
  });

  // Initial start
  startPlaceholderRotation();

  // Handle language change
  document.addEventListener('languageChanged', () => {
      stopPlaceholderRotation();
      currentPlaceholderIndex = 0;
      if (document.activeElement !== chatInput && chatInput.value === '') {
          startPlaceholderRotation();
      }
  });
});
