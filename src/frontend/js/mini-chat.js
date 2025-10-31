document.addEventListener('DOMContentLoaded', () => {
  const floatingBubble = document.getElementById('floating-chat-bubble');
  const chatBubble = floatingBubble?.querySelector('.floating-bubble-inner');
  const miniChatWindow = floatingBubble?.querySelector('.mini-chat-window');
  const chatInput = floatingBubble?.querySelector('.mini-chat-input');
  const chatMessages = floatingBubble?.querySelector('.mini-chat-messages');
  const closeButton = floatingBubble?.querySelector('.mini-chat-close');
  const sendButton = floatingBubble?.querySelector('.mini-chat-send');

  if (!floatingBubble || !chatBubble || !miniChatWindow || !chatInput || !chatMessages || !closeButton || !sendButton) {
    console.warn('Mini chat elements not found');
    return;
  }

  // Detect chatbot type based on current page
  function getChatbotType() {
    const path = window.location.pathname;
    if (path.includes('pricing')) return 'pricing';
    if (path.includes('portfolio-simulator')) return 'simulator';
    return 'index'; // Default for home page
  }

  const chatbotType = getChatbotType();
  const storageKey = `bubble_chat_history_${chatbotType}`;
  let conversationHistory = [];

  // Load conversation history from localStorage
  function loadConversationHistory() {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        conversationHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load conversation history:', error);
    }
  }

  // Save conversation history to localStorage
  function saveConversationHistory() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(conversationHistory));
    } catch (error) {
      console.warn('Failed to save conversation history:', error);
    }
  }

  let isChatOpen = false;
  let isProcessing = false;
  let currentAbortController = null;

  const setChatOpen = (open) => {
    if (isChatOpen === open) return;
    isChatOpen = open;
    floatingBubble.classList.toggle('chat-open', isChatOpen);

    if (isChatOpen) {
      setTimeout(() => {
        chatInput.focus();
      }, 300);
    }
  };

  // Toggle chat window
  const toggleChat = () => {
    setChatOpen(!isChatOpen);
  };

  // Add message to chat
  const addMessage = (text, isUser = false) => {
    const messageDiv = document.createElement('div');
    messageDiv.className = `mini-chat-message ${isUser ? 'user' : 'bot'}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    if (isUser) {
      contentDiv.textContent = text;
    } else {
      // Bot message starts with typing indicator
      contentDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    }

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return contentDiv; // Return for updating with streamed response
  };

  // Handle send message with SSE streaming
  const sendMessage = async (presetMessage) => {
    const usingPreset = typeof presetMessage === 'string';
    const message = (usingPreset ? presetMessage : chatInput.value).trim();
    if (!message || isProcessing) return;

    if (usingPreset) {
      chatInput.value = '';
    }

    // Add user message
    addMessage(message, true);
    if (!usingPreset) {
      chatInput.value = '';
    }
    chatInput.disabled = true;
    sendButton.disabled = true;

    isProcessing = true;
    const botMessageContent = addMessage('', false);

    try {
      // Create new AbortController for this request
      currentAbortController = new AbortController();

      // Get current language
      const lang = document.documentElement.lang || 'en';

      // Add user message to history
      conversationHistory.push({ role: 'user', content: message });
      saveConversationHistory();

      // Call chatbot API with SSE streaming
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          language: lang,
          chatbotType,
          history: conversationHistory.slice(-10) // Send last 10 messages for context
        }),
        signal: currentAbortController.signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An error occurred.');
      }

      // Handle SSE streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let isFirstChunk = true;
      let fullResponse = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep the last partial line in the buffer

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.substring(5).trim();
            if (data === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.done) {
                break;
              }
              if (parsed.content) {
                if (isFirstChunk) {
                  // Replace typing indicator with first chunk
                  botMessageContent.textContent = parsed.content;
                  isFirstChunk = false;
                } else {
                  // Append subsequent chunks
                  botMessageContent.textContent += parsed.content;
                }
                fullResponse += parsed.content;
                chatMessages.scrollTop = chatMessages.scrollHeight;
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

      // If no content received, show error
      if (!fullResponse) {
        botMessageContent.textContent = 'I apologize, but I encountered an error processing your request.';
      }

      // Save assistant response to history
      if (fullResponse) {
        conversationHistory.push({ role: 'assistant', content: fullResponse });
        saveConversationHistory();
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        botMessageContent.textContent = 'Request was cancelled.';
      } else {
        console.error('Error:', error);
        botMessageContent.textContent = error.message || 'Sorry, I encountered an error. Please try again.';
      }
    } finally {
      isProcessing = false;
      currentAbortController = null;
      chatInput.disabled = false;
      sendButton.disabled = false;
      if (!usingPreset) {
        chatInput.focus();
      }
    }
  };

  // Event Listeners
  chatBubble.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleChat();
  });

  closeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleChat();
  });

  sendButton.addEventListener('click', sendMessage);

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (isChatOpen && !floatingBubble.contains(e.target)) {
      toggleChat();
    }
  });

  // Prevent clicks inside the chat from closing it
  miniChatWindow.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Load conversation history at startup
  loadConversationHistory();

  // Add initial bot message only if starting fresh conversation
  if (conversationHistory.length === 0) {
    addMessage('Hello! How can I help you today?');
  } else {
    // Display loaded conversation history
    conversationHistory.forEach(msg => {
      addMessage(msg.content, msg.role === 'user');
    });
  }

  // Expose minimal API for other modules (floating input, etc.)
  window.bubbleMiniChat = {
    open: () => setChatOpen(true),
    close: () => setChatOpen(false),
    isOpen: () => isChatOpen,
    sendMessage: (text) => {
      if (!text) return;
      setChatOpen(true);
      sendMessage(text);
    },
  };
});
