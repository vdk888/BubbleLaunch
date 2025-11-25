document.addEventListener('DOMContentLoaded', () => {
  const chatInput = document.querySelector('.chat-input');
  const chatSubmit = document.querySelector('.chat-submit');
  const chatMessages = document.querySelector('.chat-messages');

  if (!chatInput || !chatSubmit || !chatMessages) {
    return;
  }

  function appendMessage(role, text) {
    const wrapper = document.createElement('div');
    wrapper.className = `chat-message ${role}`;

    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = text;

    wrapper.appendChild(content);
    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function getLocaleCopy(key) {
    const lang = document.documentElement.lang || 'en';
    const messages = {
      en: {
        opening: 'Opening Bubble Assistant…',
      },
      fr: {
        opening: 'Ouverture d’Assistant Bubble…',
      },
    };
    return (messages[lang] || messages.en)[key];
  }

  function openChatPanel(message) {
    if (window.chatSidePanel && typeof window.chatSidePanel.open === 'function') {
      window.chatSidePanel.open(message);
    }
  }

  function handleSubmit() {
    const value = chatInput.value.trim();
    if (!value) return;

    const hasPanel = Boolean(window.chatSidePanel && typeof window.chatSidePanel.open === 'function');

    appendMessage('user', value);
    if (hasPanel) {
      appendMessage('bot', getLocaleCopy('opening'));
      openChatPanel(value);
    }

    chatInput.value = '';
    chatInput.blur();
  }

  chatSubmit.addEventListener('click', handleSubmit);
  chatInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
    }
  });

  window.addEventListener('chatSidePanel:opened', () => {
    const lastBotMessage = chatMessages.querySelector('.chat-message.bot:last-child');
    if (!lastBotMessage) return;
    const content = lastBotMessage.querySelector('.message-content');
    if (content && content.textContent === getLocaleCopy('opening')) {
      lastBotMessage.remove();
    }
  });

  window.addEventListener('chatSidePanel:closed', () => {
    const botMessages = chatMessages.querySelectorAll('.chat-message.bot');
    botMessages.forEach((message, index) => {
      if (index > 0) {
        message.remove();
      }
    });

    const userMessages = chatMessages.querySelectorAll('.chat-message.user');
    userMessages.forEach((message) => message.remove());
  });
});

// Hero Chat Form Handler
document.addEventListener('DOMContentLoaded', () => {
  const heroChatForm = document.getElementById('hero-chat-form');
  const heroChatInput = document.querySelector('.hero-chat-input');
  const heroChatSubmit = document.querySelector('.hero-chat-submit');

  if (!heroChatForm || !heroChatInput || !heroChatSubmit) {
    return;
  }

  function handleHeroChatSubmit(e) {
    e.preventDefault();
    const message = heroChatInput.value.trim();
    if (!message) return;

    // Track analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'hero_chat_submit', {
        query: message,
        entry_point: 'homepage_hero'
      });
    }

    // Open chat side panel with the message
    if (window.chatSidePanel && typeof window.chatSidePanel.open === 'function') {
      window.chatSidePanel.open(message);
    }

    // Clear the input
    heroChatInput.value = '';
  }

  heroChatForm.addEventListener('submit', handleHeroChatSubmit);
  heroChatSubmit.addEventListener('click', (e) => {
    e.preventDefault();
    handleHeroChatSubmit(e);
  });
  heroChatInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleHeroChatSubmit(event);
    }
  });
});
