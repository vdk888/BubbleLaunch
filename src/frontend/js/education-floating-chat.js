/**
 * Education Floating Chat - Connects floating input to Playground chatbot session
 * Used on Arena and Strategy Builder pages only
 * Shares session with Playground via bubblePlaygroundFullscreenSession key
 */

const EducationFloatingChat = (function() {
  'use strict';

  // Session key shared with playground-fullscreen-chat.js
  const SESSION_KEY = 'bubblePlaygroundFullscreenSession';

  // DOM Elements
  let modal = null;
  let messagesContainer = null;
  let inputField = null;
  let closeBtn = null;
  let session = null;
  let abortController = null;

  // Page context detection - check both /education/ and /playground/ paths
  const isArenaPage = window.location.pathname.includes('/education/arena') ||
                      window.location.pathname.includes('/playground/arena');
  const isSimulatorPage = window.location.pathname.includes('/education/simulator') ||
                          window.location.pathname.includes('/playground/simulator');
  const isEducationPage = isArenaPage || isSimulatorPage;

  // SVG Icons
  const ICONS = {
    close: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    send: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 10L12 3L19 10" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 21V4" stroke-linecap="round"/></svg>',
    mic: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>'
  };

  /**
   * Get current language
   */
  function getLang() {
    const stored = localStorage.getItem('bubbleLanguage');
    if (stored) return stored;
    return document.documentElement.lang || 'fr';
  }

  /**
   * Get context-aware suggestions based on page
   */
  function getContextSuggestions() {
    const lang = getLang();

    if (isArenaPage) {
      return lang === 'fr' ? [
        { text: "Explique-moi la strategie du Renard", prompt: "Explique-moi la strategie Risk Parity du Renard" },
        { text: "Pourquoi le Herisson performe bien en crise?", prompt: "Pourquoi la strategie defensive du Herisson performe bien pendant les crises?" },
        { text: "Compare Faucon et Ours", prompt: "Compare la strategie Momentum du Faucon avec l'allocation egale de l'Ours" },
        { text: "Quel bot me correspond?", prompt: "Quel bot d'investissement correspond le mieux a mon profil?" }
      ] : [
        { text: "Explain the Fox strategy", prompt: "Explain the Risk Parity strategy of the Fox" },
        { text: "Why does Hedgehog perform well in crisis?", prompt: "Why does the Hedgehog's defensive strategy perform well during crises?" },
        { text: "Compare Hawk and Bear", prompt: "Compare the Hawk's Momentum strategy with the Bear's equal allocation" },
        { text: "Which bot fits me?", prompt: "Which investment bot fits my profile best?" }
      ];
    }

    if (isSimulatorPage) {
      return lang === 'fr' ? [
        { text: "Aide-moi a trouver mon profil", prompt: "Aide-moi a determiner mon profil d'investisseur (ours, renard, faucon ou herisson)" },
        { text: "Je suis prudent, que choisir?", prompt: "Je suis plutot prudent avec mes investissements. Quelle strategie me recommandes-tu?" },
        { text: "Difference actions/obligations?", prompt: "Quelle est la difference entre investir en actions et en obligations?" },
        { text: "Comment mixer les strategies?", prompt: "Comment puis-je mixer plusieurs strategies pour creer mon allocation personnalisee?" }
      ] : [
        { text: "Help me find my profile", prompt: "Help me determine my investor profile (bear, fox, hawk or hedgehog)" },
        { text: "I'm conservative, what to choose?", prompt: "I'm rather conservative with my investments. What strategy do you recommend?" },
        { text: "Stocks vs bonds difference?", prompt: "What's the difference between investing in stocks and bonds?" },
        { text: "How to mix strategies?", prompt: "How can I mix multiple strategies to create my personalized allocation?" }
      ];
    }

    return [];
  }

  /**
   * Load or initialize session (shared with playground)
   */
  function loadSession() {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        session = JSON.parse(stored);
        return true;
      } catch (e) {
        console.error('[EducationChat] Failed to parse session:', e);
      }
    }

    // Initialize new session compatible with playground
    session = {
      started: Date.now(),
      stage: 'free_chat',
      scores: [],
      profile: null,
      answers: {},
      conversation: [],
      onboardingPaused: false,
      lastOnboardingStage: null
    };
    saveSession();
    return false;
  }

  /**
   * Save session
   */
  function saveSession() {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  /**
   * Create the fullscreen modal
   */
  function createModal() {
    const lang = getLang();
    const pageTitle = isArenaPage
      ? (lang === 'fr' ? 'Arena' : 'Arena')
      : (lang === 'fr' ? 'Simulateur' : 'Simulator');

    modal = document.createElement('div');
    modal.id = 'educationChatModal';
    modal.className = 'education-chat-modal';
    modal.innerHTML = `
      <div class="education-chat-container">
        <div class="education-chat-header">
          <div class="education-chat-header-info">
            <div class="education-chat-avatar">
              <svg width="20" height="20" viewBox="0 0 72 72" fill="none">
                <circle cx="36" cy="41" r="22" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-dasharray="120 24" stroke-dashoffset="8"/>
                <circle cx="54" cy="22" r="5" fill="currentColor"/>
              </svg>
            </div>
            <div class="education-chat-titles">
              <span class="education-chat-title">Bubble Assistant</span>
              <span class="education-chat-subtitle">${pageTitle}</span>
            </div>
          </div>
          <button class="education-chat-close" aria-label="${lang === 'fr' ? 'Fermer' : 'Close'}">
            ${ICONS.close}
          </button>
        </div>
        <div class="education-chat-messages" id="educationChatMessages">
          <!-- Messages will be rendered here -->
        </div>
        <div class="education-chat-suggestions" id="educationChatSuggestions">
          <!-- Context-aware suggestions -->
        </div>
        <form class="education-chat-input-form" id="educationChatForm">
          <input
            type="text"
            class="education-chat-input"
            id="educationChatInput"
            placeholder="${lang === 'fr' ? 'Pose ta question...' : 'Ask your question...'}"
            autocomplete="off"
          />
          <button class="education-chat-send" type="submit" aria-label="${lang === 'fr' ? 'Envoyer' : 'Send'}">
            ${ICONS.send}
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Cache DOM references
    messagesContainer = modal.querySelector('#educationChatMessages');
    inputField = modal.querySelector('#educationChatInput');
    closeBtn = modal.querySelector('.education-chat-close');

    // Event listeners
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    const form = modal.querySelector('#educationChatForm');
    form.addEventListener('submit', handleSubmit);

    // Escape key to close
    document.addEventListener('keydown', handleEscape);

    // Render suggestions
    renderSuggestions();
  }

  /**
   * Render context-aware suggestions
   */
  function renderSuggestions() {
    if (!modal) return;

    const container = modal.querySelector('#educationChatSuggestions');
    if (!container) return;

    const suggestions = getContextSuggestions();

    container.innerHTML = suggestions.map(s => `
      <button class="education-suggestion-btn" data-prompt="${escapeHtml(s.prompt)}">
        ${escapeHtml(s.text)}
      </button>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.education-suggestion-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const prompt = btn.dataset.prompt;
        sendMessage(prompt);
        container.style.display = 'none';
      });
    });
  }

  /**
   * Handle escape key
   */
  function handleEscape(e) {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
      closeModal();
    }
  }

  /**
   * Open the modal
   */
  function openModal(initialMessage = null) {
    if (!modal) {
      createModal();
    }

    loadSession();
    renderConversation();

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      inputField.focus();
    }, 300);

    // If initial message provided, send it
    if (initialMessage) {
      sendMessage(initialMessage);
      const suggestionsContainer = modal.querySelector('#educationChatSuggestions');
      if (suggestionsContainer) suggestionsContainer.style.display = 'none';
    }
  }

  /**
   * Close the modal
   */
  function closeModal() {
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  /**
   * Render existing conversation
   */
  function renderConversation() {
    if (!messagesContainer || !session) return;

    messagesContainer.innerHTML = '';

    // Add welcome message if no conversation
    if (session.conversation.length === 0) {
      const lang = getLang();
      const welcomeMsg = isArenaPage
        ? (lang === 'fr'
          ? "Salut ! Je suis la pour t'aider a comprendre les differentes strategies de trading. Pose-moi tes questions sur les bots !"
          : "Hi! I'm here to help you understand the different trading strategies. Ask me your questions about the bots!")
        : (lang === 'fr'
          ? "Salut ! Je vais t'aider a trouver la strategie qui te correspond. On decouvre ensemble ton profil d'investisseur ?"
          : "Hi! I'll help you find the strategy that fits you. Shall we discover your investor profile together?");

      addMessageBubble(welcomeMsg, 'bot');
    } else {
      // Render existing messages
      session.conversation.forEach(msg => {
        addMessageBubble(msg.content, msg.role === 'assistant' ? 'bot' : 'user', false);
      });
    }

    scrollToBottom();
  }

  /**
   * Add message bubble to chat
   */
  function addMessageBubble(content, type = 'bot', save = true) {
    const bubble = document.createElement('div');
    bubble.className = `education-chat-message ${type}`;

    if (type === 'bot') {
      bubble.innerHTML = `
        <div class="message-avatar">
          <svg width="16" height="16" viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="41" r="22" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-dasharray="120 24" stroke-dashoffset="8"/>
            <circle cx="54" cy="22" r="5" fill="currentColor"/>
          </svg>
        </div>
        <div class="message-content">${formatMessage(content)}</div>
      `;
    } else {
      bubble.innerHTML = `<div class="message-content">${escapeHtml(content)}</div>`;
    }

    messagesContainer.appendChild(bubble);
    scrollToBottom();

    if (save && session) {
      session.conversation.push({
        role: type === 'bot' ? 'assistant' : 'user',
        content
      });
      saveSession();
    }

    return bubble;
  }

  /**
   * Show typing indicator
   */
  function showTyping() {
    const typing = document.createElement('div');
    typing.className = 'education-chat-typing';
    typing.id = 'educationTyping';
    typing.innerHTML = `
      <div class="message-avatar">
        <svg width="16" height="16" viewBox="0 0 72 72" fill="none">
          <circle cx="36" cy="41" r="22" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-dasharray="120 24" stroke-dashoffset="8"/>
          <circle cx="54" cy="22" r="5" fill="currentColor"/>
        </svg>
      </div>
      <div class="typing-dots">
        <span></span><span></span><span></span>
      </div>
    `;
    messagesContainer.appendChild(typing);
    scrollToBottom();
    return typing;
  }

  /**
   * Hide typing indicator
   */
  function hideTyping() {
    const typing = document.getElementById('educationTyping');
    if (typing) typing.remove();
  }

  /**
   * Scroll to bottom of messages
   */
  function scrollToBottom() {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  /**
   * Handle form submission
   */
  function handleSubmit(e) {
    e.preventDefault();
    const text = inputField.value.trim();
    if (text) {
      sendMessage(text);
      inputField.value = '';

      // Hide suggestions after first message
      const suggestionsContainer = modal.querySelector('#educationChatSuggestions');
      if (suggestionsContainer) suggestionsContainer.style.display = 'none';
    }
  }

  /**
   * Send message to LLM
   */
  async function sendMessage(message) {
    if (abortController) abortController.abort();
    abortController = new AbortController();

    addMessageBubble(message, 'user');
    const typing = showTyping();

    // Create streaming response bubble
    const responseBubble = document.createElement('div');
    responseBubble.className = 'education-chat-message bot';
    responseBubble.innerHTML = `
      <div class="message-avatar">
        <svg width="16" height="16" viewBox="0 0 72 72" fill="none">
          <circle cx="36" cy="41" r="22" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-dasharray="120 24" stroke-dashoffset="8"/>
          <circle cx="54" cy="22" r="5" fill="currentColor"/>
        </svg>
      </div>
      <div class="message-content"></div>
    `;
    const contentEl = responseBubble.querySelector('.message-content');

    try {
      const pageContext = isArenaPage ? 'education_arena' : 'education_simulator';

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          language: getLang(),
          pageContext: pageContext,
          history: session.conversation.slice(-10),
          contextMetadata: {
            isEducation: true,
            pageType: isArenaPage ? 'arena' : 'simulator',
            profile: session.profile ? {
              level: session.profile <= 30 ? 'beginner' : session.profile <= 60 ? 'intermediate' : 'advanced',
              riskProfile: session.profile
            } : null
          }
        }),
        signal: abortController.signal
      });

      hideTyping();
      messagesContainer.appendChild(responseBubble);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          const data = line.replace('data: ', '');
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullResponse += parsed.content;
              contentEl.innerHTML = formatMessage(fullResponse);
              scrollToBottom();
            }
          } catch (e) {}
        }
      }

      if (fullResponse) {
        session.conversation.push({ role: 'assistant', content: fullResponse });
        saveSession();
      }

    } catch (error) {
      hideTyping();
      if (error.name === 'AbortError') return;

      const lang = getLang();
      const errorMsg = lang === 'fr'
        ? "Desole, une erreur s'est produite. Reessaie."
        : "Sorry, an error occurred. Try again.";
      addMessageBubble(errorMsg, 'bot');
    }
  }

  /**
   * Escape HTML
   */
  function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /**
   * Format message with basic markdown
   */
  function formatMessage(text) {
    if (!text) return '';
    let html = escapeHtml(text);
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\n/g, '<br>');
    return html;
  }

  /**
   * Intercept floating chat input on education pages
   */
  function interceptFloatingInput() {
    const floatingInput = document.getElementById('floating-chat-input');
    if (!floatingInput) return;

    const inputField = floatingInput.querySelector('.floating-input-field');
    const submitButton = floatingInput.querySelector('.floating-input-submit');

    if (!inputField || !submitButton) return;

    // Intercept click on input field - open modal
    inputField.addEventListener('focus', (e) => {
      e.preventDefault();
      inputField.blur();
      openModal();
    });

    // Intercept submit button
    submitButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const message = inputField.value.trim();
      inputField.value = '';
      openModal(message || null);
    });

    // Intercept Enter key
    inputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const message = inputField.value.trim();
        inputField.value = '';
        openModal(message || null);
      }
    });

    console.log('[EducationChat] Floating input intercepted for education page');
  }

  /**
   * Update UI when language changes
   */
  function handleLanguageChange() {
    const lang = getLang();
    console.log('[EducationChat] Language change detected:', lang);

    // If modal doesn't exist yet, nothing to update there
    if (!modal) return;

    const pageTitle = isArenaPage
      ? (lang === 'fr' ? 'Arena' : 'Arena')
      : (lang === 'fr' ? 'Simulateur' : 'Simulator');

    // Update subtitle
    const subtitle = modal.querySelector('.education-chat-subtitle');
    if (subtitle) subtitle.textContent = pageTitle;

    // Update input placeholder
    const input = modal.querySelector('#educationChatInput');
    if (input) input.placeholder = lang === 'fr' ? 'Pose ta question...' : 'Ask your question...';

    // Update close button aria-label
    const closeButton = modal.querySelector('.education-chat-close');
    if (closeButton) closeButton.setAttribute('aria-label', lang === 'fr' ? 'Fermer' : 'Close');

    // Update send button aria-label
    const sendButton = modal.querySelector('.education-chat-send');
    if (sendButton) sendButton.setAttribute('aria-label', lang === 'fr' ? 'Envoyer' : 'Send');

    // Re-render suggestions with new language
    renderSuggestions();

    // Update welcome message if conversation is empty
    if (session && session.conversation.length === 0 && messagesContainer) {
      // Find and update the welcome message bubble
      const existingWelcome = messagesContainer.querySelector('.education-chat-message.bot');
      if (existingWelcome) {
        const welcomeMsg = isArenaPage
          ? (lang === 'fr'
            ? "Salut ! Je suis la pour t'aider a comprendre les differentes strategies de trading. Pose-moi tes questions sur les bots !"
            : "Hi! I'm here to help you understand the different trading strategies. Ask me your questions about the bots!")
          : (lang === 'fr'
            ? "Salut ! Je vais t'aider a trouver la strategie qui te correspond. On decouvre ensemble ton profil d'investisseur ?"
            : "Hi! I'll help you find the strategy that fits you. Shall we discover your investor profile together?");

        const contentEl = existingWelcome.querySelector('.message-content');
        if (contentEl) {
          contentEl.innerHTML = formatMessage(welcomeMsg);
        }
      }
    }

    console.log('[EducationChat] Language updated to:', lang);
  }

  /**
   * Initialize
   */
  function init() {
    if (!isEducationPage) {
      console.log('[EducationChat] Not an education page, skipping initialization');
      return;
    }

    console.log('[EducationChat] Initializing for', isArenaPage ? 'Arena' : 'Simulator');

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', interceptFloatingInput);
    } else {
      interceptFloatingInput();
    }

    // Listen for language changes
    document.addEventListener('languageChanged', handleLanguageChange);
    window.addEventListener('languageChange', handleLanguageChange);
  }

  // Auto-initialize
  init();

  return {
    open: openModal,
    close: closeModal,
    isEducationPage: () => isEducationPage
  };
})();

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.EducationFloatingChat = EducationFloatingChat;
}
