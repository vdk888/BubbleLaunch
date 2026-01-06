/**
 * Bubble Playground - LLM-Powered Chatbot Experience
 * Full conversational AI with onboarding flow and session memory
 */

const PlaygroundLLMChat = (function() {
  'use strict';

  // Session state
  const SESSION_KEY = 'bubblePlaygroundLLMSession';
  let session = null;
  let chatContainer = null;
  let inputField = null;
  let abortController = null;

  // Onboarding stages
  const ONBOARDING_STAGES = {
    welcome: 'welcome',
    level: 'level',
    goal: 'goal',
    style: 'style',
    complete: 'complete'
  };

  // Onboarding options
  const ONBOARDING = {
    level: {
      question: {
        fr: "Pour commencer, dis-moi ou tu en es :",
        en: "To start, tell me where you are:"
      },
      options: [
        { id: 'beginner', text: { fr: "Debutant - Je decouvre", en: "Beginner - I'm discovering" } },
        { id: 'intermediate', text: { fr: "Intermediaire - Je connais les bases", en: "Intermediate - I know the basics" } },
        { id: 'advanced', text: { fr: "Avance - Je maitrise deja", en: "Advanced - I already know well" } }
      ]
    },
    goal: {
      question: {
        fr: "Super ! Et qu'est-ce qui t'interesse le plus aujourd'hui ?",
        en: "Great! What interests you most today?"
      },
      options: [
        { id: 'learn_basics', text: { fr: "Apprendre les bases", en: "Learn the basics" } },
        { id: 'build_strategy', text: { fr: "Construire une strategie", en: "Build a strategy" } },
        { id: 'watch_arena', text: { fr: "Observer des bots trader", en: "Watch AI bots trade" } },
        { id: 'test_portfolio', text: { fr: "Tester un portefeuille", en: "Test a portfolio" } }
      ]
    },
    style: {
      question: {
        fr: "Comment preferes-tu apprendre ?",
        en: "How do you prefer to learn?"
      },
      options: [
        { id: 'videos', text: { fr: "Videos et explications visuelles", en: "Videos and visual explanations" } },
        { id: 'exercises', text: { fr: "Exercices pratiques", en: "Hands-on exercises" } },
        { id: 'dialogue', text: { fr: "Dialogue et questions-reponses", en: "Q&A dialogue" } },
        { id: 'explore', text: { fr: "Explorer par moi-meme", en: "Explore on my own" } }
      ]
    }
  };

  // Navigation cards for quick access
  const NAVIGATION_CARDS = {
    arena: {
      icon: '&#128065;',
      title: { fr: "Voir l'Arena", en: "Watch the Arena" },
      description: { fr: "Observe 4 bots IA trader en temps reel", en: "Watch 4 AI bots trade in real-time" },
      url: { fr: '/investors/playground/arena', en: '/en/investors/playground/arena' }
    },
    simulator: {
      icon: '&#128736;',
      title: { fr: "Creer ma Strategie", en: "Build My Strategy" },
      description: { fr: "Construis et teste ton allocation", en: "Build and test your allocation" },
      url: { fr: '/investors/playground/simulator', en: '/en/investors/playground/simulator' }
    },
    waitlist: {
      icon: '&#128640;',
      title: { fr: "Rejoindre Bubble", en: "Join Bubble" },
      description: { fr: "Acces anticipe a la plateforme", en: "Early access to the platform" },
      url: { fr: '/investors#investor-waitlist', en: '/en/investors#investor-waitlist' }
    },
    videos: {
      icon: '&#127909;',
      title: { fr: "Videos Educatives", en: "Educational Videos" },
      description: { fr: "Approfondis tes connaissances", en: "Deepen your knowledge" },
      action: 'scrollToVideos'
    }
  };

  // Welcome messages
  const WELCOME_MESSAGES = {
    fr: [
      "Bienvenue dans le Bubble Playground !",
      "Je suis la pour t'aider a decouvrir l'investissement de facon simple et fun."
    ],
    en: [
      "Welcome to the Bubble Playground!",
      "I'm here to help you discover investing in a simple, fun way."
    ]
  };

  // Transition message after onboarding
  const TRANSITION_MESSAGE = {
    fr: "Parfait ! Je comprends mieux ton profil. Tu peux maintenant me poser n'importe quelle question, ou utiliser les boutons ci-dessous pour explorer.\n\nQuelques idees :\n- Explique-moi ce qu'est un ETF\n- Montre-moi comment fonctionne l'Arena\n- Aide-moi a creer ma premiere strategie",
    en: "Perfect! I understand your profile better. You can now ask me any question, or use the buttons below to explore.\n\nSome ideas:\n- Explain what an ETF is\n- Show me how the Arena works\n- Help me create my first strategy"
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
   * Get text in current language
   */
  function t(textObj) {
    if (typeof textObj === 'string') return textObj;
    const lang = getLang();
    return textObj[lang] || textObj.fr || textObj.en || '';
  }

  /**
   * Load or initialize session
   */
  function loadSession() {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        session = JSON.parse(stored);
        return true;
      } catch (e) {
        console.error('Failed to parse session:', e);
      }
    }

    session = {
      version: 2,
      started: Date.now(),
      language: getLang(),
      onboardingStage: ONBOARDING_STAGES.welcome,
      profile: {
        level: null,
        goal: null,
        learningStyle: null,
        onboardingComplete: false
      },
      progress: {
        arenaVisited: false,
        simulatorVisited: false,
        videosWatched: [],
        challengesCompleted: []
      },
      conversation: [],
      lastModule: 'hub'
    };
    saveSession();
    return false;
  }

  /**
   * Save session to storage
   */
  function saveSession() {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  /**
   * Create message bubble HTML
   */
  function createMessageBubble(content, type = 'bot', animate = true) {
    const bubble = document.createElement('div');
    bubble.className = `playground-message ${type}${animate ? ' animate' : ''}`;

    if (type === 'bot') {
      bubble.innerHTML = `
        <div class="message-avatar">
          <svg width="24" height="24" viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="41" r="22" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-dasharray="120 24" stroke-dashoffset="8"/>
            <circle cx="54" cy="22" r="5" fill="currentColor"/>
          </svg>
        </div>
        <div class="message-content">${formatMessage(content)}</div>
      `;
    } else {
      bubble.innerHTML = `<div class="message-content">${escapeHtml(content)}</div>`;
    }

    return bubble;
  }

  /**
   * Escape HTML for user messages
   */
  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Format bot messages with markdown-like syntax
   */
  function formatMessage(text) {
    if (!text) return '';

    let html = escapeHtml(text);

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Line breaks
    html = html.replace(/\n/g, '<br>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    return html;
  }

  /**
   * Create option buttons for onboarding
   */
  function createOptionButtons(options, onSelect) {
    const container = document.createElement('div');
    container.className = 'playground-options';

    options.forEach((option, index) => {
      const btn = document.createElement('button');
      btn.className = 'playground-option';
      btn.innerHTML = t(option.text);
      btn.style.animationDelay = `${index * 0.1}s`;
      btn.addEventListener('click', () => {
        // Remove options container after selection
        container.remove();
        onSelect(option);
      });
      container.appendChild(btn);
    });

    return container;
  }

  /**
   * Create navigation cards
   */
  function createNavigationCards(cardKeys) {
    const container = document.createElement('div');
    container.className = 'playground-nav-cards';

    cardKeys.forEach(cardKey => {
      const card = NAVIGATION_CARDS[cardKey];
      if (!card) return;

      const el = document.createElement('a');
      el.className = 'playground-nav-card';

      if (card.action === 'scrollToVideos') {
        el.href = '#educationVideos';
        el.addEventListener('click', (e) => {
          e.preventDefault();
          document.getElementById('educationVideos')?.scrollIntoView({ behavior: 'smooth' });
        });
      } else {
        el.href = t(card.url);
      }

      el.innerHTML = `
        <span class="nav-card-icon">${card.icon}</span>
        <div class="nav-card-content">
          <span class="nav-card-title">${t(card.title)}</span>
          <span class="nav-card-description">${t(card.description)}</span>
        </div>
        <svg class="nav-card-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      `;

      container.appendChild(el);
    });

    return container;
  }

  /**
   * Create persistent action buttons
   */
  function createActionButtons() {
    const container = document.createElement('div');
    container.className = 'playground-action-buttons';

    const lang = getLang();
    const buttons = [
      {
        id: 'arena',
        text: { fr: "Arena", en: "Arena" },
        url: { fr: '/investors/playground/arena', en: '/en/investors/playground/arena' }
      },
      {
        id: 'simulator',
        text: { fr: "Simulateur", en: "Simulator" },
        url: { fr: '/investors/playground/simulator', en: '/en/investors/playground/simulator' }
      },
      {
        id: 'subscribe',
        text: { fr: "Rejoindre Bubble", en: "Join Bubble" },
        url: { fr: '/investors#investor-waitlist', en: '/en/investors#investor-waitlist' },
        primary: true
      }
    ];

    buttons.forEach(btn => {
      const el = document.createElement('a');
      el.href = t(btn.url);
      el.className = `playground-action-btn${btn.primary ? ' primary' : ''}`;
      el.textContent = t(btn.text);
      container.appendChild(el);
    });

    return container;
  }

  /**
   * Show typing indicator
   */
  function showTyping() {
    const typing = document.createElement('div');
    typing.className = 'playground-typing';
    typing.id = 'playgroundTyping';
    typing.innerHTML = '<span></span><span></span><span></span>';
    chatContainer.appendChild(typing);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return typing;
  }

  /**
   * Remove typing indicator
   */
  function hideTyping() {
    const typing = document.getElementById('playgroundTyping');
    if (typing) typing.remove();
  }

  /**
   * Add message with optional delay (for non-LLM messages)
   */
  async function addMessage(content, type = 'bot', delay = 0) {
    return new Promise(resolve => {
      if (delay > 0 && type === 'bot') {
        const typing = showTyping();
        setTimeout(() => {
          typing.remove();
          const bubble = createMessageBubble(content, type);
          chatContainer.appendChild(bubble);
          chatContainer.scrollTop = chatContainer.scrollHeight;

          // Store in history
          session.conversation.push({ role: type === 'bot' ? 'assistant' : 'user', content, timestamp: Date.now() });
          saveSession();

          resolve();
        }, delay);
      } else {
        const bubble = createMessageBubble(content, type, delay > 0);
        chatContainer.appendChild(bubble);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        session.conversation.push({ role: type === 'bot' ? 'assistant' : 'user', content, timestamp: Date.now() });
        saveSession();

        resolve();
      }
    });
  }

  /**
   * Add element to chat (for options, cards, etc.)
   */
  function addElement(element) {
    chatContainer.appendChild(element);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  /**
   * Send message to LLM backend
   */
  async function sendToLLM(message) {
    // Abort any existing request
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    // Add user message to UI
    addMessage(message, 'user');

    // Show typing indicator
    const typing = showTyping();

    // Create streaming message bubble
    const bubble = createMessageBubble('', 'bot');
    const contentEl = bubble.querySelector('.message-content');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          language: getLang(),
          pageContext: 'playground',
          history: session.conversation.slice(-10), // Last 10 messages for context
          contextMetadata: {
            profile: session.profile,
            progress: session.progress,
            lastModule: session.lastModule
          }
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // Remove typing, add the bubble
      typing.remove();
      chatContainer.appendChild(bubble);

      // Stream the response
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
              chatContainer.scrollTop = chatContainer.scrollHeight;
            }
            if (parsed.done) {
              // Store in conversation history
              session.conversation.push({ role: 'assistant', content: fullResponse, timestamp: Date.now() });
              saveSession();
            }
          } catch (e) {
            // Skip unparseable chunks
          }
        }
      }

      // Ensure final content is stored
      if (fullResponse && !session.conversation.some(c => c.content === fullResponse)) {
        session.conversation.push({ role: 'assistant', content: fullResponse, timestamp: Date.now() });
        saveSession();
      }

    } catch (error) {
      typing.remove();
      if (error.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }

      // Show error message
      const lang = getLang();
      const errorMsg = lang === 'fr'
        ? "Desole, une erreur s'est produite. Reessaie dans un moment."
        : "Sorry, an error occurred. Try again in a moment.";
      addMessage(errorMsg, 'bot');
    }
  }

  /**
   * Handle welcome stage
   */
  async function handleWelcome() {
    const messages = WELCOME_MESSAGES[getLang()] || WELCOME_MESSAGES.fr;

    for (let i = 0; i < messages.length; i++) {
      await addMessage(messages[i], 'bot', i === 0 ? 500 : 800);
    }

    // Move to level question
    setTimeout(() => {
      session.onboardingStage = ONBOARDING_STAGES.level;
      saveSession();
      handleOnboardingQuestion('level');
    }, 1000);
  }

  /**
   * Handle onboarding questions
   */
  async function handleOnboardingQuestion(stage) {
    const data = ONBOARDING[stage];
    if (!data) return;

    await addMessage(t(data.question), 'bot', 600);

    setTimeout(() => {
      const options = createOptionButtons(data.options, (selected) => {
        // Show user selection
        addMessage(t(selected.text), 'user');

        // Store in profile
        if (stage === 'level') {
          session.profile.level = selected.id;
          session.onboardingStage = ONBOARDING_STAGES.goal;
          saveSession();
          setTimeout(() => handleOnboardingQuestion('goal'), 500);
        } else if (stage === 'goal') {
          session.profile.goal = selected.id;
          session.onboardingStage = ONBOARDING_STAGES.style;
          saveSession();
          setTimeout(() => handleOnboardingQuestion('style'), 500);
        } else if (stage === 'style') {
          session.profile.learningStyle = selected.id;
          session.profile.onboardingComplete = true;
          session.onboardingStage = ONBOARDING_STAGES.complete;
          saveSession();
          setTimeout(() => handleOnboardingComplete(), 500);
        }
      });
      addElement(options);
    }, 300);
  }

  /**
   * Handle onboarding completion - transition to LLM mode
   */
  async function handleOnboardingComplete() {
    await addMessage(t(TRANSITION_MESSAGE), 'bot', 800);

    // Show navigation cards based on goal
    setTimeout(() => {
      let cards = ['arena', 'simulator'];
      if (session.profile.goal === 'watch_arena') {
        cards = ['arena', 'simulator', 'videos'];
      } else if (session.profile.goal === 'build_strategy' || session.profile.goal === 'test_portfolio') {
        cards = ['simulator', 'arena', 'videos'];
      } else {
        cards = ['videos', 'arena', 'simulator'];
      }
      cards.push('waitlist');

      const navCards = createNavigationCards(cards);
      addElement(navCards);

      // Show hint about typing
      setTimeout(async () => {
        const lang = getLang();
        const hint = lang === 'fr'
          ? "Tu peux aussi me poser tes propres questions ci-dessous !"
          : "You can also ask me your own questions below!";
        await addMessage(hint, 'bot', 800);
      }, 1000);
    }, 500);
  }

  /**
   * Handle user text input
   */
  function handleUserInput(text) {
    if (!text.trim()) return;

    // If onboarding not complete, guide user to complete it
    if (!session.profile.onboardingComplete) {
      const lang = getLang();
      addMessage(text, 'user');
      setTimeout(() => {
        const msg = lang === 'fr'
          ? "Termine d'abord les quelques questions ci-dessus, et je pourrai mieux t'aider !"
          : "First complete the questions above, and I can better help you!";
        addMessage(msg, 'bot', 500);
      }, 300);
      return;
    }

    // Send to LLM
    sendToLLM(text);
  }

  /**
   * Resume from stored conversation
   */
  function resumeSession() {
    // Replay conversation history (last 10 messages)
    const recentConversation = session.conversation.slice(-10);
    recentConversation.forEach(msg => {
      const bubble = createMessageBubble(msg.content, msg.role === 'assistant' ? 'bot' : 'user', false);
      chatContainer.appendChild(bubble);
    });
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // If onboarding not complete, continue from current stage
    if (!session.profile.onboardingComplete) {
      const stage = session.onboardingStage;
      if (stage === ONBOARDING_STAGES.welcome) {
        handleWelcome();
      } else if (stage === ONBOARDING_STAGES.level) {
        handleOnboardingQuestion('level');
      } else if (stage === ONBOARDING_STAGES.goal) {
        handleOnboardingQuestion('goal');
      } else if (stage === ONBOARDING_STAGES.style) {
        handleOnboardingQuestion('style');
      }
    } else {
      // Onboarding complete - show welcome back and nav
      const lang = getLang();
      setTimeout(async () => {
        const msg = lang === 'fr'
          ? "Content de te revoir ! Que veux-tu explorer aujourd'hui ?"
          : "Nice to see you again! What do you want to explore today?";
        await addMessage(msg, 'bot', 500);

        setTimeout(() => {
          const navCards = createNavigationCards(['arena', 'simulator', 'videos', 'waitlist']);
          addElement(navCards);
        }, 500);
      }, 300);
    }
  }

  /**
   * Initialize the LLM playground chatbot
   */
  function init(containerId, inputId) {
    chatContainer = document.getElementById(containerId);
    inputField = document.getElementById(inputId);

    if (!chatContainer) {
      console.error('Playground LLM chat container not found:', containerId);
      return;
    }

    // Load or create session
    const hasExistingSession = loadSession();

    // Setup input handler
    if (inputField) {
      const form = inputField.closest('form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const text = inputField.value.trim();
          if (text) {
            handleUserInput(text);
            inputField.value = '';
          }
        });
      }

      inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const text = inputField.value.trim();
          if (text) {
            handleUserInput(text);
            inputField.value = '';
          }
        }
      });
    }

    // Start or resume conversation
    if (hasExistingSession && session.conversation.length > 0) {
      resumeSession();
    } else {
      handleWelcome();
    }
  }

  /**
   * Reset session and start fresh
   */
  function reset() {
    if (abortController) {
      abortController.abort();
    }
    sessionStorage.removeItem(SESSION_KEY);
    if (chatContainer) {
      chatContainer.innerHTML = '';
    }
    loadSession();
    handleWelcome();
  }

  /**
   * Get current session data
   */
  function getSession() {
    return session ? { ...session } : null;
  }

  /**
   * Get user profile
   */
  function getProfile() {
    return session?.profile || null;
  }

  /**
   * Check if onboarding is complete
   */
  function isOnboardingComplete() {
    return session?.profile?.onboardingComplete || false;
  }

  // Public API
  return {
    init,
    reset,
    getSession,
    getProfile,
    isOnboardingComplete,
    handleUserInput
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PlaygroundLLMChat;
}
