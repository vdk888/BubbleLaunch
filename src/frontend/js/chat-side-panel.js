(function() {
  'use strict';

  const panel = document.getElementById('chat-side-panel');
  if (!panel) {
    console.warn('chat-side-panel.js: #chat-side-panel not found');
    return;
  }

  const messagesContainer = panel.querySelector('.chat-side-panel-messages');
  const form = panel.querySelector('.chat-side-panel-input-container');
  const input = panel.querySelector('.chat-side-panel-input');
  const sendButton = panel.querySelector('.chat-side-panel-send');
  const closeButton = panel.querySelector('.chat-side-panel-close');
  const minimizeButton = panel.querySelector('.chat-side-panel-minimize');

  if (!messagesContainer || !form || !input || !sendButton || !closeButton || !minimizeButton) {
    console.warn('chat-side-panel.js: missing required elements', {
      messagesContainer: !!messagesContainer,
      form: !!form,
      input: !!input,
      sendButton: !!sendButton,
      closeButton: !!closeButton,
      minimizeButton: !!minimizeButton,
    });
    return;
  }

  const initialMessagesHTML = messagesContainer.innerHTML;

  const state = {
    isOpen: false,
    isMinimized: false,
    isProcessing: false,
    abortController: null,
    conversation: [],
  };

  function emit(eventName, detail = {}) {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  function getLanguage() {
    return document.documentElement.lang || localStorage.getItem('bubbleLanguage') || 'fr';
  }

  function getPageContext() {
    const path = window.location.pathname;
    if (path.includes('pricing')) return 'pricing';
    if (path.includes('portfolio-simulator')) return 'simulator';
    if (path.includes('businesses')) return 'businesses';
    return 'index';
  }

  const pageContext = getPageContext();

  function resetConversation() {
    state.conversation = [];
    state.isProcessing = false;
    if (state.abortController) {
      state.abortController.abort();
      state.abortController = null;
    }
    messagesContainer.innerHTML = initialMessagesHTML;
    input.disabled = false;
    sendButton.disabled = false;
    input.value = '';
  }

  function createMessageElement(role, text) {
    const wrapper = document.createElement('div');
    wrapper.className = `chat-side-panel-message ${role === 'user' ? 'user' : 'bot'}`;

    const content = document.createElement('div');
    content.className = 'message-content';

    if (role === 'bot' && !text) {
      content.innerHTML = '<div class="typing-indicator"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>';
    } else {
      content.textContent = text || '';
    }

    wrapper.appendChild(content);
    messagesContainer.appendChild(wrapper);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return content;
  }

  async function sendMessage(message) {
    if (!message || state.isProcessing) {
      return;
    }

    state.isProcessing = true;
    input.disabled = true;
    sendButton.disabled = true;

    // Render user message
    createMessageElement('user', message);

    // Prepare bot message placeholder
    const botMessageContent = createMessageElement('bot', '');

    state.conversation.push({ role: 'user', content: message });

    try {
      state.abortController = new AbortController();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          language: getLanguage(),
          pageContext,
          history: state.conversation.slice(-10),
        }),
        signal: state.abortController.signal,
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || 'Une erreur est survenue.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let collected = '';
      let isFirstChunk = true;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data:')) {
            continue;
          }

          const data = line.slice(5).trim();
          if (!data || data === '[DONE]') {
            continue;
          }

          try {
            const payload = JSON.parse(data);
            if (payload.done) {
              continue;
            }
            if (payload.content) {
              if (isFirstChunk) {
                botMessageContent.textContent = payload.content;
                isFirstChunk = false;
              } else {
                botMessageContent.textContent += payload.content;
              }
              collected += payload.content;
              messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
          } catch (error) {
            console.error('chat-side-panel.js: failed to parse chunk', error);
          }
        }
      }

      if (!collected) {
        botMessageContent.textContent = '...';
      }

      state.conversation.push({ role: 'assistant', content: collected || '...' });
    } catch (error) {
      console.error('chat-side-panel.js: sendMessage failed', error);
      const errorText = error.name === 'AbortError' ? '' : (error.message || 'Une erreur est survenue.');
      botMessageContent.textContent = errorText;
      if (errorText) {
        state.conversation.push({ role: 'assistant', content: errorText });
      }
    } finally {
      state.isProcessing = false;
      input.disabled = false;
      sendButton.disabled = false;
      input.value = '';
      input.focus();
      state.abortController = null;
    }
  }

  function openPanel(initialMessage) {
    if (state.isOpen && state.isMinimized) {
      panel.classList.remove('is-minimized');
      state.isMinimized = false;
      document.body.classList.add('chat-side-panel-open');
      emit('chatSidePanel:restored');
    }

    document.body.classList.add('chat-side-panel-open');

    if (!state.isOpen) {
      state.isOpen = true;
      panel.classList.add('is-open');
      panel.classList.remove('is-minimized');
      panel.setAttribute('aria-hidden', 'false');
      document.body.classList.add('chat-side-panel-open');
      emit('chatSidePanel:opened');

      // Ensure scroll position at bottom for existing messages
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      setTimeout(() => {
        input.focus();
      }, 150);
    }

    if (initialMessage) {
      sendMessage(initialMessage);
    }
  }

  function closePanel() {
    if (!state.isOpen) {
      return;
    }

    state.isOpen = false;
    state.isMinimized = false;
    panel.classList.remove('is-open', 'is-minimized');
    panel.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('chat-side-panel-open');
    resetConversation();
    emit('chatSidePanel:closed');
  }

  function toggleMinimize() {
    if (!state.isOpen) {
      openPanel();
      return;
    }

    state.isMinimized = !state.isMinimized;
    panel.classList.toggle('is-minimized', state.isMinimized);

    if (state.isMinimized) {
      document.body.classList.remove('chat-side-panel-open');
      emit('chatSidePanel:minimized');
    } else {
      document.body.classList.add('chat-side-panel-open');
      emit('chatSidePanel:restored');
      setTimeout(() => {
        input.focus();
      }, 150);
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message) return;
    sendMessage(message);
  });

  closeButton.addEventListener('click', () => {
    closePanel();
  });

  minimizeButton.addEventListener('click', () => {
    toggleMinimize();
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.isOpen && !state.isMinimized) {
      closePanel();
    }
  });

  window.chatSidePanel = {
    open(message) {
      openPanel(message);
    },
    close() {
      closePanel();
    },
    minimize() {
      toggleMinimize();
    },
    isOpen() {
      return state.isOpen;
    },
    isProcessing() {
      return state.isProcessing;
    },
  };

  // Ensure panel is hidden on load
  panel.classList.remove('is-open', 'is-minimized');
  panel.setAttribute('aria-hidden', 'true');
})();
