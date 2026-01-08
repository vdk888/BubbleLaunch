/**
 * Education Floating Chat - Connects floating input to Playground chatbot session
 * Used on Arena and Strategy Builder pages only
 * Shares session with Playground via bubblePlaygroundFullscreenSession key
 *
 * Features:
 * - Onboarding awareness: checks if user completed onboarding
 * - Strategy parsing: understands natural language allocations
 * - simulatorBridge integration: syncs with simulator UI
 * - Step-by-step guided flow for strategy building
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
  let hasShownOnboardingPrompt = false;
  let currentBuilderStep = 0; // Track step-by-step builder flow

  // Page context detection - check both /education/ and /playground/ paths
  const isArenaPage = window.location.pathname.includes('/education/arena') ||
                      window.location.pathname.includes('/playground/arena');
  const isSimulatorPage = window.location.pathname.includes('/education/simulator') ||
                          window.location.pathname.includes('/playground/simulator');
  const isEducationPage = isArenaPage || isSimulatorPage;

  // Arena state integration
  let arenaStateReady = false;
  let lastArenaState = null;

  // Listen for arena state being ready
  if (isArenaPage) {
    window.addEventListener('arenaStateReady', () => {
      arenaStateReady = true;
      console.log('[EducationChat] Arena state is now available');
    });
  }

  // SVG Icons
  const ICONS = {
    close: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    send: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 10L12 3L19 10" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 21V4" stroke-linecap="round"/></svg>',
    mic: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
    info: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };

  /**
   * Check if user has completed onboarding
   * Returns: { completed: boolean, stage: string, profile: object|null }
   */
  function checkOnboardingStatus() {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) {
      return { completed: false, stage: null, profile: null };
    }
    try {
      const data = JSON.parse(stored);
      const completed = data.stage === 'free_chat' && data.profile !== null;
      return {
        completed,
        stage: data.stage || null,
        profile: data.profile || null
      };
    } catch (e) {
      return { completed: false, stage: null, profile: null };
    }
  }

  /**
   * Parse natural language strategy intent and map to template
   * Returns: { template: string, allocations: object, confidence: number }
   */
  function parseStrategyIntent(text) {
    const lower = text.toLowerCase();
    const lang = getLang();

    // Keywords for strategy templates
    const defensiveKeywords = lang === 'fr'
      ? ['prudent', 'securite', 'safe', 'defensif', 'protege', 'risque faible', 'peu risque', 'conservateur']
      : ['safe', 'defensive', 'conservative', 'protect', 'low risk', 'secure', 'cautious'];

    const growthKeywords = lang === 'fr'
      ? ['croissance', 'rendement', 'agressif', 'dynamique', 'opportunite', 'plus de gains']
      : ['growth', 'aggressive', 'dynamic', 'high return', 'opportunity', 'more gains'];

    const balancedKeywords = lang === 'fr'
      ? ['equilibre', 'balance', '60/40', 'moyen', 'mixte', 'diversifie']
      : ['balanced', 'moderate', '60/40', 'mixed', 'diversified', 'middle'];

    // Gold-related keywords
    const goldKeywords = lang === 'fr'
      ? ['or', 'gold', 'valeur refuge', 'inflation']
      : ['gold', 'hedge', 'inflation', 'precious'];

    // Check for template match
    let template = null;
    let allocations = null;
    let confidence = 0;

    if (defensiveKeywords.some(k => lower.includes(k))) {
      template = 'defensive';
      allocations = { SPY: 20, IEF: 60, GLD: 10, CASH: 10 };
      confidence = 0.7;
    } else if (growthKeywords.some(k => lower.includes(k))) {
      template = 'growth';
      allocations = { SPY: 70, IEF: 20, GLD: 10 };
      confidence = 0.7;
    } else if (balancedKeywords.some(k => lower.includes(k))) {
      template = 'balanced';
      allocations = { SPY: 50, IEF: 40, GLD: 10 };
      confidence = 0.7;
    }

    // Add gold if mentioned
    if (goldKeywords.some(k => lower.includes(k)) && allocations) {
      allocations.GLD = Math.min((allocations.GLD || 0) + 5, 25);
      // Rebalance
      const total = Object.values(allocations).reduce((a, b) => a + b, 0);
      if (total > 100) {
        const excess = total - 100;
        if (allocations.SPY > excess) allocations.SPY -= excess;
        else if (allocations.IEF > excess) allocations.IEF -= excess;
      }
    }

    return { template, allocations, confidence };
  }

  /**
   * Get the playground base URL based on current language
   */
  function getPlaygroundUrl() {
    const lang = getLang();
    return lang === 'fr' ? '/investors/playground' : '/en/investors/playground';
  }

  /**
   * Get current language
   */
  function getLang() {
    const stored = localStorage.getItem('bubbleLanguage');
    if (stored) return stored;
    return document.documentElement.lang || 'fr';
  }

  /**
   * Get current arena state if available
   */
  function getArenaContext() {
    if (!isArenaPage || !arenaStateReady || !window.arenaState) return null;
    try {
      return window.arenaState.getCurrentState();
    } catch {
      return null;
    }
  }

  /**
   * Get context-aware suggestions based on page and arena state
   */
  function getContextSuggestions() {
    const lang = getLang();

    if (isArenaPage) {
      const arenaContext = getArenaContext();

      // Dynamic suggestions based on arena state
      if (arenaContext) {
        const leadingBot = arenaContext.leadingBotName || 'Renard';
        const event = arenaContext.recentEvent;
        const isPlaying = arenaContext.isPlaying;

        // If there's a current event, show event-specific suggestions
        if (event) {
          return lang === 'fr' ? [
            { text: `Pourquoi ${leadingBot} mene ?`, prompt: `Pourquoi ${leadingBot} est en tete pendant ${event.label} ?` },
            { text: `Explique ${event.label}`, prompt: `Qu'est-ce qui s'est passe pendant ${event.label} et comment les bots ont reagi ?` },
            { text: "Compare les reactions", prompt: `Compare comment chaque bot a reagi pendant ${event.label}` },
            { text: "C'etait previsible?", prompt: `Est-ce que les bots auraient pu prevoir ${event.label} ?` }
          ] : [
            { text: `Why is ${leadingBot} leading?`, prompt: `Why is ${leadingBot} leading during ${event.label}?` },
            { text: `Explain ${event.label}`, prompt: `What happened during ${event.label} and how did the bots react?` },
            { text: "Compare reactions", prompt: `Compare how each bot reacted during ${event.label}` },
            { text: "Was it predictable?", prompt: `Could the bots have predicted ${event.label}?` }
          ];
        }

        // If not playing, prompt to start
        if (!isPlaying && arenaContext.currentFrame === 0) {
          return lang === 'fr' ? [
            { text: "Comment ca marche?", prompt: "Comment fonctionne l'Arena et qu'est-ce que je vais voir?" },
            { text: "C'est quoi les 4 bots?", prompt: "Explique-moi les 4 strategies des bots dans l'Arena" },
            { text: "Appuie sur Play!", prompt: "Appuie sur le bouton Play pour lancer la simulation!" },
            { text: "Quel bot me correspond?", prompt: "Quel bot d'investissement correspond le mieux a mon profil?" }
          ] : [
            { text: "How does it work?", prompt: "How does the Arena work and what will I see?" },
            { text: "What are the 4 bots?", prompt: "Explain the 4 bot strategies in the Arena" },
            { text: "Press Play!", prompt: "Press the Play button to start the simulation!" },
            { text: "Which bot fits me?", prompt: "Which investment bot fits my profile best?" }
          ];
        }

        // Default dynamic suggestions during playback
        return lang === 'fr' ? [
          { text: `Pourquoi ${leadingBot} gagne?`, prompt: `Pourquoi ${leadingBot} performe mieux que les autres en ce moment?` },
          { text: "Explique le classement", prompt: "Explique-moi le classement actuel et pourquoi les bots sont dans cet ordre" },
          { text: "Qui va finir premier?", prompt: "Selon toi, qui va finir premier a la fin de la simulation?" },
          { text: "Aller au Simulateur", prompt: "Je veux creer ma propre strategie dans le Simulateur" }
        ] : [
          { text: `Why is ${leadingBot} winning?`, prompt: `Why is ${leadingBot} performing better than the others right now?` },
          { text: "Explain the leaderboard", prompt: "Explain the current leaderboard and why the bots are in this order" },
          { text: "Who will finish first?", prompt: "In your opinion, who will finish first at the end of the simulation?" },
          { text: "Go to Simulator", prompt: "I want to create my own strategy in the Simulator" }
        ];
      }

      // Fallback static suggestions if arena state not available
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
        { text: "Rends-le plus defensif", prompt: "Rends ma stratégie plus défensive avec moins de risque", action: 'defensive' },
        { text: "Plus de rendement", prompt: "Je veux plus de rendement même si c'est plus risqué", action: 'growth' },
        { text: "Mix 60/40", prompt: "Applique un mix classique 60% actions 40% obligations", action: 'balanced' },
        { text: "Ajoute de l'or", prompt: "Ajoute un peu d'or à ma stratégie pour me protéger", action: 'gold' },
        { text: "Aide-moi à trouver mon profil", prompt: "Aide-moi à déterminer mon profil d'investisseur" },
        { text: "C'est quoi le Sharpe?", prompt: "Explique-moi ce qu'est le ratio de Sharpe et pourquoi c'est important" }
      ] : [
        { text: "Make it safer", prompt: "Make my strategy more defensive with less risk", action: 'defensive' },
        { text: "More growth", prompt: "I want more returns even if it's riskier", action: 'growth' },
        { text: "60/40 mix", prompt: "Apply a classic 60% stocks 40% bonds mix", action: 'balanced' },
        { text: "Add gold", prompt: "Add some gold to my strategy for protection", action: 'gold' },
        { text: "Help me find my profile", prompt: "Help me determine my investor profile" },
        { text: "What's Sharpe ratio?", prompt: "Explain what the Sharpe ratio is and why it matters" }
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
      <button class="education-suggestion-btn" data-prompt="${escapeHtml(s.prompt)}" ${s.action ? `data-action="${s.action}"` : ''}>
        ${escapeHtml(s.text)}
      </button>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.education-suggestion-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const prompt = btn.dataset.prompt;
        const action = btn.dataset.action;

        // If action is defined and simulatorBridge is available, apply directly
        if (action && isSimulatorPage && window.simulatorBridge) {
          applyStrategyAction(action);
        }

        sendMessage(prompt);
        container.style.display = 'none';
      });
    });
  }

  /**
   * Apply a strategy action via simulatorBridge
   */
  function applyStrategyAction(action) {
    if (!window.simulatorBridge) return;

    const allocations = {
      defensive: { SPY: 20, IEF: 60, GLD: 10, CASH: 10 },
      growth: { SPY: 70, IEF: 20, GLD: 10 },
      balanced: { SPY: 50, IEF: 40, GLD: 10 },
      gold: null // Special case: add gold to current allocation
    };

    if (action === 'gold') {
      // Add gold to current allocation
      const current = window.simulatorBridge.getCurrentState?.();
      if (current?.allocations) {
        const newAlloc = { ...current.allocations };
        newAlloc.GLD = Math.min((newAlloc.GLD || 0) + 10, 25);
        // Rebalance
        const total = Object.values(newAlloc).reduce((a, b) => a + b, 0);
        if (total > 100) {
          const excess = total - 100;
          if (newAlloc.SPY >= excess) newAlloc.SPY -= excess;
          else if (newAlloc.IEF >= excess) newAlloc.IEF -= excess;
        }
        window.simulatorBridge.setAllocation(newAlloc);
      }
    } else if (allocations[action]) {
      window.simulatorBridge.setAllocation(allocations[action]);
    }
  }

  /**
   * Get formatted allocation string for display
   */
  function formatAllocation(allocation) {
    if (!allocation) return '';
    return Object.entries(allocation)
      .filter(([k, v]) => v > 0)
      .map(([k, v]) => `${v}% ${k}`)
      .join(', ');
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
    const lang = getLang();

    // Add welcome message if no conversation
    if (session.conversation.length === 0) {
      // Check onboarding status for simulator page
      if (isSimulatorPage && !hasShownOnboardingPrompt) {
        const onboardingStatus = checkOnboardingStatus();

        if (!onboardingStatus.completed) {
          // Show onboarding prompt
          const onboardingMsg = lang === 'fr'
            ? "Salut ! Avant de construire ta strategie ensemble, un petit onboarding va rendre les concepts comme la volatilite et le levier beaucoup plus clairs. Tu veux que je te guide ?"
            : "Hi! Before we build strategies together, a quick onboarding will make concepts like volatility and leverage much easier. Want me to guide you through the basics?";

          addMessageBubble(onboardingMsg, 'bot');

          // Add onboarding CTA button
          setTimeout(() => {
            addOnboardingButton();
          }, 500);

          hasShownOnboardingPrompt = true;
          return;
        }
      }

      const welcomeMsg = isArenaPage
        ? (lang === 'fr'
          ? "Salut ! Je suis la pour t'aider a comprendre les differentes strategies de trading. Pose-moi tes questions sur les bots !"
          : "Hi! I'm here to help you understand the different trading strategies. Ask me your questions about the bots!")
        : (lang === 'fr'
          ? "Salut ! Je vais t'aider a trouver la strategie qui te correspond. Decris simplement ce que tu veux : \"je veux un portefeuille pas trop risque\" ou \"plus de rendement sans trop de stress\"."
          : "Hi! I'll help you find the strategy that fits you. Just describe what you want: \"I want a not-too-risky portfolio\" or \"more growth without too much stress\".");

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
   * Add onboarding CTA button to messages
   */
  function addOnboardingButton() {
    if (!messagesContainer) return;

    const lang = getLang();
    const playgroundUrl = getPlaygroundUrl();

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'education-chat-onboarding-cta';
    buttonContainer.innerHTML = `
      <a href="${playgroundUrl}" class="onboarding-start-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polygon points="10,8 16,12 10,16"/>
        </svg>
        <span>${lang === 'fr' ? 'Commencer l\'onboarding' : 'Start Onboarding'}</span>
      </a>
      <button class="onboarding-skip-btn">
        ${lang === 'fr' ? 'Continuer sans' : 'Skip for now'}
      </button>
    `;

    messagesContainer.appendChild(buttonContainer);

    // Handle skip button
    const skipBtn = buttonContainer.querySelector('.onboarding-skip-btn');
    skipBtn?.addEventListener('click', () => {
      buttonContainer.remove();
      const welcomeMsg = lang === 'fr'
        ? "Pas de souci ! Decris-moi simplement ce que tu veux : \"je veux un portefeuille equilibre\" ou utilise les suggestions ci-dessous."
        : "No problem! Just describe what you want: \"I want a balanced portfolio\" or use the suggestions below.";
      addMessageBubble(welcomeMsg, 'bot');
    });

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

      // Build context metadata with arena state if available
      const contextMetadata = {
        isEducation: true,
        pageType: isArenaPage ? 'arena' : 'simulator',
        profile: session.profile ? {
          level: session.profile <= 30 ? 'beginner' : session.profile <= 60 ? 'intermediate' : 'advanced',
          riskProfile: session.profile
        } : null
      };

      // Include arena state if on arena page
      if (isArenaPage) {
        const arenaContext = getArenaContext();
        if (arenaContext) {
          contextMetadata.arenaState = {
            currentFrame: arenaContext.currentFrame,
            currentMonth: arenaContext.currentMonth,
            leadingBot: arenaContext.leadingBot,
            leadingBotName: arenaContext.leadingBotName,
            recentEvent: arenaContext.recentEvent,
            leaderboard: arenaContext.leaderboard.map(b => ({
              bot: b.bot,
              name: b.name,
              pnl: b.pnl.toFixed(2)
            })),
            isPlaying: arenaContext.isPlaying
          };
        }
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          language: getLang(),
          pageContext: pageContext,
          history: session.conversation.slice(-10),
          contextMetadata
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
            ? "Salut ! Je suis là pour t'aider à comprendre les différentes stratégies de trading. Pose-moi tes questions sur les bots !"
            : "Hi! I'm here to help you understand the different trading strategies. Ask me your questions about the bots!")
          : (lang === 'fr'
            ? "Salut ! Je vais t'aider à trouver la stratégie qui te correspond. On découvre ensemble ton profil d'investisseur ?"
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
