/**
 * Simulator Chat Window
 * Expandable/collapsible chat for portfolio simulator page
 * Uses SSE streaming with OpenRouter LLMs
 */

(function() {
  'use strict';

  // Chat window elements
  const chatWindow = document.getElementById('simulator-chat-window');
  const chatMessages = document.getElementById('simulator-chat-messages');
  const chatInput = document.getElementById('simulator-chat-input');
  const chatSend = document.getElementById('simulator-chat-send');
  const minimizeBtn = document.getElementById('simulator-chat-minimize');
  const closeBtn = document.getElementById('simulator-chat-close');

  // Floating input elements
  const floatingInput = document.querySelector('.floating-input-field');
  const floatingSubmit = document.querySelector('.floating-input-submit');

  if (!chatWindow || !chatMessages || !chatInput || !chatSend) {
    console.warn('Simulator chat elements not found');
    return;
  }

  let isProcessing = false;
  let currentAbortController = null;
  let isMinimized = false;
  let hasTrackedOpen = false;

  function getCurrentLanguage() {
    return document.documentElement.lang || localStorage.getItem('preferredLanguage') || 'fr';
  }

  function getSimulatorState() {
    return window.bubbleSimulatorState || {};
  }

  function trackChatEvent(action, params = {}) {
    if (typeof window.gtag !== 'function') return;
    const state = getSimulatorState();
    window.gtag('event', action, {
      event_category: 'Portfolio Simulator Chat',
      language: getCurrentLanguage(),
      strategy: state.strategy || null,
      period_years: state.period || null,
      ...params,
    });
  }

  /**
   * Open chat window
   */
  function openChat(trigger = 'manual') {
    const wasHidden = chatWindow.classList.contains('hidden');

    chatWindow.classList.remove('hidden');
    chatWindow.classList.remove('minimized');
    isMinimized = false;
    setTimeout(() => chatInput.focus(), 300);

    if (wasHidden || !hasTrackedOpen) {
      trackChatEvent('chat_opened', { trigger });
      hasTrackedOpen = true;
    }
  }

  /**
   * Minimize chat window
   */
  function minimizeChat() {
    if (isMinimized) {
      chatWindow.classList.remove('minimized');
      isMinimized = false;
      trackChatEvent('chat_restored');
    } else {
      chatWindow.classList.add('minimized');
      isMinimized = true;
      trackChatEvent('chat_minimized');
    }
  }

  /**
   * Close chat window
   */
  function closeChat() {
    chatWindow.classList.add('hidden');
    chatWindow.classList.remove('minimized');
    isMinimized = false;
    // Abort any ongoing request
    if (currentAbortController) {
      currentAbortController.abort();
    }
    trackChatEvent('chat_closed');
  }

  /**
   * Add message to chat
   */
  function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `simulator-chat-message ${isUser ? 'user' : 'bot'}`;

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
  }

  /**
   * Send message with SSE streaming
   */
  async function sendMessage(message, source = 'chat_window') {
    if (!message || isProcessing) return;

    // Add user message
    addMessage(message, true);

    // Disable input
    chatInput.disabled = true;
    chatSend.disabled = true;
    isProcessing = true;

    const botMessageContent = addMessage('', false);
    const sendStartedAt = performance.now();

    trackChatEvent('chat_message_sent', {
      source,
      characters: message.length,
    });

    try {
      // Create new AbortController
      currentAbortController = new AbortController();

      // Get current language
      const lang = document.documentElement.lang || 'fr';

      // Call chatbot API with SSE streaming
      const response = await fetch('/api/chat/portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          language: lang,
          context: getSimulatorState(),
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

    } catch (error) {
      if (error.name === 'AbortError') {
        botMessageContent.textContent = 'Request was cancelled.';
        trackChatEvent('chat_message_cancelled', { source });
      } else {
        console.error('Error:', error);
        botMessageContent.textContent = error.message || 'Sorry, I encountered an error. Please try again.';
        trackChatEvent('chat_response_error', {
          source,
          error_message: error.message || error.name || 'unknown_error',
        });
      }
    } finally {
      const durationMs = performance.now() - sendStartedAt;
      if (botMessageContent.textContent) {
        trackChatEvent('chat_message_completed', {
          source,
          response_characters: botMessageContent.textContent.length,
          duration_ms: Math.round(durationMs),
        });
      }
      isProcessing = false;
      currentAbortController = null;
      chatInput.disabled = false;
      chatSend.disabled = false;
      chatInput.focus();
    }
  }

  /**
   * Handle floating input submission
   */
  function handleFloatingSubmit() {
    const message = floatingInput.value.trim();
    if (!message) return;

    // Open chat window
    openChat('floating_input');

    // Send message after a short delay
    setTimeout(() => {
      sendMessage(message, 'floating_input');
      floatingInput.value = '';
    }, 100);
  }

  /**
   * Handle chat input submission
   */
  function handleChatSubmit() {
    const message = chatInput.value.trim();
    if (!message) return;

    sendMessage(message, 'chat_window');
    chatInput.value = '';
  }

  // Event Listeners
  if (floatingSubmit) {
    floatingSubmit.addEventListener('click', handleFloatingSubmit);
  }

  if (floatingInput) {
    floatingInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleFloatingSubmit();
      }
    });
  }

  chatSend.addEventListener('click', handleChatSubmit);

  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSubmit();
    }
  });

  minimizeBtn.addEventListener('click', minimizeChat);
  closeBtn.addEventListener('click', closeChat);

  // Click on header to toggle minimize
  const chatHeader = document.querySelector('.simulator-chat-header h3');
  if (chatHeader) {
    chatHeader.addEventListener('click', minimizeChat);
    chatHeader.style.cursor = 'pointer';
  }
})();
