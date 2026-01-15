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

  // ═══════════════════════════════════════════════════════════════════════════
  // BUBBLE AGENT MEMORY INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Dynamically load BubbleAgentMemory if not already loaded
   * This ensures the omniscient chatbot works on ALL pages without editing every HTML file
   */
  function loadBubbleAgentMemory() {
    if (typeof BubbleAgentMemory !== 'undefined') {
      console.log('[chat-side-panel] BubbleAgentMemory already loaded');
      return Promise.resolve();
    }

    // Try multiple path variations for different deployment environments
    const pathsToTry = [
      '/js/bubble-agent-memory.js',  // Absolute path (most common)
    ];

    // Try to compute relative path based on current script location
    try {
      const currentScript = document.currentScript || document.querySelector('script[src*="chat-side-panel"]');
      if (currentScript && currentScript.src) {
        const scriptUrl = new URL(currentScript.src);
        const basePath = scriptUrl.pathname.substring(0, scriptUrl.pathname.lastIndexOf('/'));
        pathsToTry.push(`${basePath}/bubble-agent-memory.js`);
      }
    } catch (e) {
      // Ignore URL parsing errors
    }

    // Add relative path as final fallback
    pathsToTry.push('./bubble-agent-memory.js');

    /**
     * Attempt to load script from a specific path
     * @param {string} path - Script path to try
     * @returns {Promise} Resolves on success, rejects on failure
     */
    function tryLoadScript(path) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = path;
        script.async = true;
        script.onload = () => {
          console.log(`[chat-side-panel] BubbleAgentMemory loaded from ${path}`);
          // Initialize it
          if (typeof BubbleAgentMemory !== 'undefined') {
            BubbleAgentMemory.init();
          }
          resolve();
        };
        script.onerror = () => {
          // Clean up failed script element
          script.remove();
          reject(new Error(`Failed to load from ${path}`));
        };
        document.head.appendChild(script);
      });
    }

    /**
     * Try loading from each path sequentially until one succeeds
     * @param {number} index - Current path index to try
     * @returns {Promise}
     */
    function tryNextPath(index) {
      if (index >= pathsToTry.length) {
        console.warn('[chat-side-panel] Failed to load BubbleAgentMemory from all paths - continuing without it');
        return Promise.resolve(); // Graceful degradation
      }

      return tryLoadScript(pathsToTry[index]).catch(() => {
        console.log(`[chat-side-panel] Path ${pathsToTry[index]} failed, trying next...`);
        return tryNextPath(index + 1);
      });
    }

    return tryNextPath(0);
  }

  // Attempt to load BubbleAgentMemory dynamically (non-blocking)
  loadBubbleAgentMemory().catch(() => {});

  /**
   * Dynamically load StrategyEventBus if not already loaded
   */
  function loadStrategyEventBus() {
    if (typeof window.StrategyEventBus !== 'undefined') {
      return Promise.resolve();
    }

    const pathsToTry = [
      '/js/strategy-event-bus.js',
    ];

    // Try to compute relative path based on current script location
    try {
      const currentScript = document.currentScript || document.querySelector('script[src*="chat-side-panel"]');
      if (currentScript && currentScript.src) {
        const scriptUrl = new URL(currentScript.src);
        const basePath = scriptUrl.pathname.substring(0, scriptUrl.pathname.lastIndexOf('/'));
        pathsToTry.push(`${basePath}/strategy-event-bus.js`);
      }
    } catch (e) {
      // Ignore URL parsing errors
    }
    
    pathsToTry.push('./strategy-event-bus.js');

    function tryLoadScript(path) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = path;
        script.async = true;
        script.onload = () => {
          console.log(`[chat-side-panel] StrategyEventBus loaded from ${path}`);
          resolve();
        };
        script.onerror = () => {
          script.remove();
          reject(new Error(`Failed to load from ${path}`));
        };
        document.head.appendChild(script);
      });
    }

    function tryNextPath(index) {
      if (index >= pathsToTry.length) {
        console.warn('[chat-side-panel] Failed to load StrategyEventBus from all paths');
        return Promise.resolve();
      }
      return tryLoadScript(pathsToTry[index]).catch(() => tryNextPath(index + 1));
    }

    return tryNextPath(0);
  }

  // Attempt to load StrategyEventBus dynamically (non-blocking)
  loadStrategyEventBus().catch(() => {});

  /**
   * Get BubbleAgentMemory if available (graceful degradation)
   * @returns {Object|null} Memory module or null
   */
  function getMemory() {
    return typeof BubbleAgentMemory !== 'undefined' ? BubbleAgentMemory : null;
  }

  /**
   * Build user context for LLM from BubbleAgentMemory
   * Token-efficient format for inclusion in system context
   * @returns {string} Formatted user context or empty string
   */
  function buildUserProfileContext() {
    const Memory = getMemory();
    if (!Memory) return '';

    const ctx = Memory.getContextForLLM();
    if (!ctx) return '';

    const parts = [];

    // Profile information
    if (ctx.profile) {
      if (ctx.profile.riskScore !== null) {
        parts.push(`Risk Profile: ${ctx.profile.riskScore}/100 (confidence: ${ctx.profile.riskConfidence}%)`);
      }
      if (ctx.profile.traits && ctx.profile.traits.length > 0) {
        parts.push(`Traits: ${ctx.profile.traits.join(', ')}`);
      }
      if (ctx.profile.goal) {
        parts.push(`Investment Goal: ${ctx.profile.goal}`);
      }
      if (ctx.profile.horizon) {
        parts.push(`Time Horizon: ${ctx.profile.horizon}`);
      }
      if (ctx.profile.level) {
        parts.push(`Knowledge Level: ${ctx.profile.level}`);
      }
    }

    // Journey information
    if (ctx.journey) {
      if (ctx.journey.isReturningUser) {
        parts.push(`Returning user (visit #${ctx.journey.totalVisits})`);
      }
      if (ctx.journey.onboardingCompleted) {
        parts.push('Onboarding completed');
      } else if (ctx.journey.onboardingProgress > 0) {
        parts.push(`Onboarding: ${ctx.journey.onboardingProgress}% complete`);
      }
      if (ctx.journey.strategiesTestedCount > 0) {
        parts.push(`Tested ${ctx.journey.strategiesTestedCount} strategies`);
      }
    }

    // Memory insights
    if (ctx.memory) {
      if (ctx.memory.keyInsights && ctx.memory.keyInsights.length > 0) {
        parts.push(`Key insights: ${ctx.memory.keyInsights.slice(-3).join('; ')}`);
      }
      if (ctx.memory.topicsDiscussed && ctx.memory.topicsDiscussed.length > 0) {
        parts.push(`Topics discussed: ${ctx.memory.topicsDiscussed.slice(-5).join(', ')}`);
      }
    }

    if (parts.length === 0) return '';

    return `[User Profile Context: ${parts.join(' | ')}]`;
  }

  /**
   * Track conversation in memory
   * @param {string} userMessage - User's message
   * @param {string} assistantResponse - Assistant's response
   */
  function trackConversationInMemory(userMessage, assistantResponse) {
    const Memory = getMemory();
    if (!Memory) return;

    // Increment conversation count
    Memory.setConversationSummary(`Last exchange on ${new Date().toLocaleDateString()}`);

    // Try to extract topic from the conversation
    const topicKeywords = {
      'risk': ['risk', 'risque', 'volatility', 'volatilité'],
      'portfolio': ['portfolio', 'portefeuille', 'allocation'],
      'strategy': ['strategy', 'stratégie', 'momentum', 'risk parity'],
      'pricing': ['price', 'prix', 'cost', 'coût', 'fee', 'frais'],
      'simulation': ['simulate', 'simuler', 'backtest', 'test'],
      'education': ['learn', 'apprendre', 'explain', 'expliquer', 'understand', 'comprendre'],
      'waitlist': ['waitlist', 'liste d\'attente', 'join', 'rejoindre', 'subscribe', 's\'inscrire']
    };

    const lowerMessage = userMessage.toLowerCase();
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(kw => lowerMessage.includes(kw))) {
        Memory.recordTopic(topic);
        break;
      }
    }
  }

  /**
   * Record page visit in memory
   */
  function recordPageVisitInMemory() {
    const Memory = getMemory();
    if (!Memory) return;

    const path = window.location.pathname;
    Memory.recordPageVisit(path);

    // Sync language preference
    const lang = getLanguage();
    if (lang) {
      Memory.setPreferredLanguage(lang.startsWith('fr') ? 'fr' : 'en');
    }
  }

  // Record page visit on load
  recordPageVisitInMemory();

  let initialMessagesHTML = messagesContainer.innerHTML;
  if (window.location.pathname.includes('/playground/resources')) {
    initialMessagesHTML = '';
    messagesContainer.innerHTML = '';
  }
  const pageContext = getPageContext();

  // ═══════════════════════════════════════════════════════════════════════════
  // UNIFIED CHATBOT - SITE-WIDE CONVERSATION HISTORY
  // ═══════════════════════════════════════════════════════════════════════════

  const UNIFIED_HISTORY_KEY = 'bubbleUnifiedChatHistory';
  const CHAT_VERSION_KEY = 'bubbleChatVersion';
  const CURRENT_CHAT_VERSION = '2.1'; // Increment when greeting format changes

  // Clear old conversations when version changes (ensures fresh greeting)
  (function clearStaleConversations() {
    try {
      const storedVersion = localStorage.getItem(CHAT_VERSION_KEY);
      if (storedVersion !== CURRENT_CHAT_VERSION) {
        console.log('[chat-side-panel] Chat version changed, clearing old conversations');
        localStorage.removeItem(UNIFIED_HISTORY_KEY);
        sessionStorage.removeItem('educationChatHistoryShared');
        // Also clear BubbleAgentMemory conversation data to prevent duplicate greetings
        localStorage.removeItem('bubbleAgentMemory');
        localStorage.setItem(CHAT_VERSION_KEY, CURRENT_CHAT_VERSION);
      }
    } catch (e) {
      console.warn('[chat-side-panel] Failed to check chat version:', e);
    }
  })();

  /**
   * Check if current page is within the /investors section
   * @returns {boolean} True if on an investor page
   */
  function isInvestorPage() {
    const path = window.location.pathname;
    return path.startsWith('/investors') || path.startsWith('/en/investors');
  }

  /**
   * Load unified conversation history (shared across ALL investor pages)
   * @returns {Array} Conversation history
   */
  function loadUnifiedHistory() {
    try {
      const raw = localStorage.getItem(UNIFIED_HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[chat-side-panel] Failed to load unified history:', e);
    }
    return [];
  }

  /**
   * Save unified conversation history
   * @param {Array} history - Conversation to save
   */
  function saveUnifiedHistory(history) {
    try {
      // Keep last 20 messages to prevent localStorage bloat
      const trimmed = Array.isArray(history) ? history.slice(-20) : [];
      localStorage.setItem(UNIFIED_HISTORY_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('[chat-side-panel] Failed to save unified history:', e);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ONBOARDING STATUS CHECK
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Check if onboarding is completed using BubbleAgentMemory
   * @returns {boolean} True if onboarding is complete
   */
  function isOnboardingComplete() {
    const Memory = getMemory();
    if (!Memory) return false;

    try {
      const journey = Memory.getJourney();
      return journey && journey.onboardingCompleted;
    } catch (e) {
      console.warn('[chat-side-panel] Error checking onboarding status:', e);
      return false;
    }
  }

  /**
   * Get onboarding progress percentage
   * @returns {number} Progress percentage (0-100)
   */
  function getOnboardingProgress() {
    const Memory = getMemory();
    if (!Memory) return 0;

    try {
      const journey = Memory.getJourney();
      return journey ? journey.onboardingProgress || 0 : 0;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Get playground URL based on current language
   * @returns {string} Playground URL
   */
  function getPlaygroundUrl() {
    const lang = getLanguage();
    return lang.startsWith('fr') ? '/investors/playground' : '/en/investors/playground';
  }

  const state = {
    isOpen: false,
    isMinimized: false,
    isProcessing: false,
    abortController: null,
    conversation: [],
  };

  const isEducationContext =
    pageContext === 'education' ||
    pageContext === 'education_arena' ||
    pageContext === 'education_simulator';

  // Clear education conversation when outside education pages
  if (!isEducationContext) {
    try {
      sessionStorage.removeItem('educationChatHistoryShared');
    } catch {
      // ignore
    }
  }

  function loadPersistedConversation() {
    // Playground resources: force fresh start, avoid old history and duplicate greetings
    if (pageContext === 'playground_resources') {
      state.conversation = [];
      messagesContainer.innerHTML = '';
      initialMessagesHTML = '';
      if (!isOnboardingComplete()) {
        addOnboardingPrompt();
      }
      return;
    }

    // For ALL investor pages, load unified conversation history
    if (isInvestorPage()) {
      const unifiedHistory = loadUnifiedHistory();
      if (unifiedHistory.length > 0) {
        state.conversation = unifiedHistory;
        console.log('[chat-side-panel] Loaded unified history with', unifiedHistory.length, 'messages');
      }
    }

    // First try to load from BubbleAgentMemory for cross-page context
    const Memory = getMemory();
    if (Memory) {
      try {
        const memoryData = Memory.getMemory();
        const journey = Memory.getJourney();

        // If we have key insights or conversation summary, show context-aware greeting
        if (memoryData && (memoryData.keyInsights.length > 0 || memoryData.lastConversationSummary)) {
          const lang = getLanguage();
          const isReturning = journey && journey.totalVisits > 1;

          // For returning users on ANY investor page, show personalized context
          if (isReturning && isOnboardingComplete() && isInvestorPage()) {
            const profile = Memory?.getProfile?.();
            const profileName = profile && Memory?.getProfileName?.(profile.riskScore);

            let contextGreeting = '';
            if (pageContext === 'education_arena') {
              contextGreeting = lang.startsWith('fr')
                ? `Content de te revoir dans l'Arena ! ${profileName ? `En tant qu'investisseur ${profileName.toLowerCase()}, ` : ''}je peux t'aider à comprendre comment les différents bots réagissent aux événements de marché.`
                : `Welcome back to the Arena! ${profileName ? `As a ${profileName.toLowerCase()} investor, ` : ''}I can help you understand how different bots react to market events.`;
            } else if (pageContext === 'education_simulator') {
              contextGreeting = lang.startsWith('fr')
                ? `Content de te revoir dans le Strategy Builder ! ${profileName ? `Avec ton profil ${profileName.toLowerCase()}, ` : ''}on peut créer des stratégies adaptées à tes objectifs.`
                : `Welcome back to the Strategy Builder! ${profileName ? `With your ${profileName.toLowerCase()} profile, ` : ''}we can create strategies suited to your goals.`;
            } else if (isInvestorPage()) {
              // Generic welcome for other investor pages
              contextGreeting = lang.startsWith('fr')
                ? `Content de te revoir ! ${profileName ? `En tant qu'investisseur ${profileName.toLowerCase()}, ` : ''}je suis là pour t'aider.`
                : `Welcome back! ${profileName ? `As a ${profileName.toLowerCase()} investor, ` : ''}I'm here to help.`;
            }

            if (contextGreeting && !messagesContainer.querySelector('.context-greeting')) {
              const greetingWrapper = document.createElement('div');
              greetingWrapper.className = 'chat-side-panel-message bot context-greeting';
              greetingWrapper.innerHTML = `<div class="message-content"><p>${contextGreeting}</p></div>`;
              messagesContainer.appendChild(greetingWrapper);
            }
          }
        }
      } catch (e) {
        console.warn('[chat-side-panel] Error loading from BubbleAgentMemory:', e);
      }
    }

    // Also load sessionStorage conversation for continuity within session (legacy for education)
    if (isEducationContext) {
      try {
        const raw = sessionStorage.getItem('educationChatHistoryShared');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            // Merge with unified history if not already present
            if (state.conversation.length === 0) {
              state.conversation = parsed;
            }
            // Only restore UI if there are messages to show
            if (parsed.length > 0 && !messagesContainer.querySelector('.chat-side-panel-message.user')) {
              parsed.forEach((msg) => {
                const contentEl = createMessageElement(msg.role === 'user' ? 'user' : 'bot', msg.content);
                if (msg.role !== 'user' && contentEl) {
                  contentEl.innerHTML = msg.content;
                }
              });
            }
          }
        }
      } catch {
        // ignore
      }
    }

    // If no user messages yet and onboarding not complete on investor pages,
    // replace the static greeting with a single onboarding prompt to avoid duplicates.
    if (
      isInvestorPage() &&
      !isOnboardingComplete() &&
      !messagesContainer.querySelector('.chat-side-panel-message.user') &&
      !messagesContainer.querySelector('.onboarding-prompt')
    ) {
      messagesContainer.innerHTML = '';
      addOnboardingPrompt();
    }
  }

  function persistConversation() {
    // Save to unified history for ALL investor pages
    if (isInvestorPage()) {
      saveUnifiedHistory(state.conversation);
    }

    // Also save to sessionStorage for education (legacy)
    if (isEducationContext) {
      try {
        sessionStorage.setItem('educationChatHistoryShared', JSON.stringify(state.conversation.slice(-12)));
      } catch {
        // ignore
      }
    }
  }

  /**
   * Show proactive onboarding invitation for users who haven't completed onboarding
   * Works on ALL investor pages, not just education
   */
  function showProactiveOnboardingInvitation() {
    const Memory = getMemory();
    if (!Memory) return false;

    // Skip if already onboarded
    if (isOnboardingComplete()) return false;

    // Skip if onboarding prompt already shown
    if (messagesContainer.querySelector('.proactive-onboarding-prompt')) return false;

    const lang = getLanguage();
    const playgroundUrl = getPlaygroundUrl();
    const progress = getOnboardingProgress();

    // Create the proactive invitation message (as per issue requirements)
    let invitationText = lang.startsWith('fr')
      ? "Je vois que tu n'as pas encore decouvert ton profil investisseur. Veux-tu qu'on fasse ca ensemble ?"
      : "I see you haven't discovered your investor profile yet. Want to do it together?";

    // If they started but didn't finish, acknowledge progress
    if (progress > 0 && progress < 100) {
      invitationText = lang.startsWith('fr')
        ? `Tu as deja commence ton onboarding (${progress}% fait) ! On continue ?`
        : `You already started your onboarding (${progress}% done)! Shall we continue?`;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'chat-side-panel-message bot proactive-onboarding-prompt';
    wrapper.innerHTML = `
      <div class="message-content">
        <p>${invitationText}</p>
        <div class="proactive-onboarding-buttons" style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
          <a href="${playgroundUrl}" class="onboarding-start-btn" style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 13px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polygon points="10,8 16,12 10,16" fill="currentColor"/>
            </svg>
            ${progress > 0 ? (lang.startsWith('fr') ? 'Continuer' : 'Continue') : (lang.startsWith('fr') ? 'Oui, allons-y !' : 'Yes, let\'s go!')}
          </a>
          <button class="skip-proactive-onboarding-btn" style="padding: 8px 14px; background: transparent; border: 1px solid #e5e7eb; color: #6b7280; border-radius: 8px; font-size: 13px; cursor: pointer;">
            ${lang.startsWith('fr') ? 'Plus tard' : 'Maybe later'}
          </button>
        </div>
      </div>
    `;

    messagesContainer.appendChild(wrapper);

    // Handle skip button click
    const skipBtn = wrapper.querySelector('.skip-proactive-onboarding-btn');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        // Hide the buttons but keep the message
        const buttonsDiv = wrapper.querySelector('.proactive-onboarding-buttons');
        if (buttonsDiv) {
          buttonsDiv.style.display = 'none';
        }
        // Add a friendly follow-up
        const followUp = document.createElement('p');
        followUp.style.marginTop = '8px';
        followUp.style.fontSize = '13px';
        followUp.style.color = '#6b7280';
        followUp.textContent = lang.startsWith('fr')
          ? "Pas de souci ! Je reste disponible si tu as des questions."
          : "No problem! I'm here if you have questions.";
        wrapper.querySelector('.message-content').appendChild(followUp);
      });
    }

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return true;
  }

  function addEducationSuggestions() {
    if (!isEducationContext) return;
    // If suggestions already present, skip
    if (messagesContainer.querySelector('.chat-suggestion-btn')) return;

    // Check onboarding status - hide suggestions if not complete
    if (!isOnboardingComplete()) {
      addOnboardingPrompt();
      return;
    }

    const lang = getLanguage();
    const base = lang.startsWith('fr')
      ? {
          intro: 'Comment puis-je t\'aider ?',
          general: [
            'Je débute, par où commencer ?',
            'J\'ai un peu d\'épargne, que faire ?',
            'C\'est quoi un ETF en fait ?',
            'Comment savoir si je prends trop de risque ?',
          ],
          arena: [
            'Explique-moi ce trade',
            'Compare ces deux bots',
            'Montre-moi la crise de 2008',
            'C\'est quoi la différence momentum vs défensif ?',
          ],
          simulator: [
            'Aide-moi à créer une stratégie prudente',
            'Comment rendre ma stratégie moins risquée ?',
            'C\'est quoi le momentum en fait ?',
            'Compare ma stratégie au S&P 500',
          ],
          waitlist: "Je veux essayer la version complète !",
        }
      : {
          intro: 'How can I help you?',
          general: [
            'I\'m new, where do I start?',
            'I have some savings, what should I do?',
            'What\'s an ETF actually?',
            'How do I know if I\'m taking too much risk?',
          ],
          arena: [
            'Explain this trade to me',
            'Compare these two bots',
            'Show me the 2008 crisis',
            'What\'s the difference between momentum and defensive?',
          ],
          simulator: [
            'Help me create a conservative strategy',
            'How do I make my strategy less risky?',
            'What\'s momentum actually?',
            'Compare my strategy to the S&P 500',
          ],
          waitlist: 'I want to try the full version!',
        };

    const rows = [];
    if (pageContext === 'education_arena') {
      rows.push(...base.arena);
    } else if (pageContext === 'education_simulator') {
      rows.push(...base.simulator);
    } else {
      // On main page and other pages, show friendly general suggestions
      rows.push(...base.general);
    }
    // Only add waitlist on non-playground pages
    if (!pageContext.includes('playground') && !pageContext.includes('education')) {
      rows.push(base.waitlist);
    }

    rows.forEach((label) => {
      const btn = document.createElement('button');
      btn.className = 'chat-suggestion-btn';
      btn.textContent = label;
      btn.dataset.prompt = label;
      const wrapper = document.createElement('div');
      wrapper.className = 'chat-side-panel-message bot';
      const content = document.createElement('div');
      content.className = 'message-content';
      content.appendChild(btn);
      wrapper.appendChild(content);
      messagesContainer.appendChild(wrapper);
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Add onboarding prompt when user hasn't completed onboarding
   * Shows a context-aware message encouraging onboarding completion
   */
  function addOnboardingPrompt() {
    const lang = getLanguage();
    const playgroundUrl = getPlaygroundUrl();
    const progress = getOnboardingProgress();

    // Create context-aware welcome message
    let welcomeText = '';
    let ctaText = '';

    if (pageContext === 'education_arena') {
      welcomeText = lang.startsWith('fr')
        ? 'Bienvenue dans l\'Arena ! Avant d\'explorer les stratégies des bots, un rapide onboarding va personnaliser ton expérience et rendre les concepts comme le Sharpe ratio et le drawdown beaucoup plus clairs.'
        : 'Welcome to the Arena! Before exploring the bot strategies, a quick onboarding will personalize your experience and make concepts like Sharpe ratio and drawdown much clearer.';
      ctaText = lang.startsWith('fr') ? 'Commencer l\'onboarding' : 'Start Onboarding';
    } else if (pageContext === 'education_simulator') {
      welcomeText = lang.startsWith('fr')
        ? 'Bienvenue dans le Strategy Builder ! Avant de créer des stratégies, un rapide onboarding va t\'aider à comprendre des concepts clés comme la volatilité et l\'allocation d\'actifs.'
        : 'Welcome to the Strategy Builder! Before creating strategies, a quick onboarding will help you understand key concepts like volatility and asset allocation.';
      ctaText = lang.startsWith('fr') ? 'Commencer l\'onboarding' : 'Start Onboarding';
    } else {
      welcomeText = lang.startsWith('fr')
        ? 'Bienvenue ! Pour personnaliser ton expérience, commence par un rapide onboarding qui va t\'aider à découvrir ton profil d\'investisseur.'
        : 'Welcome! To personalize your experience, start with a quick onboarding that will help you discover your investor profile.';
      ctaText = lang.startsWith('fr') ? 'Découvrir mon profil' : 'Discover My Profile';
    }

    // Add progress info if started but not complete
    if (progress > 0 && progress < 100) {
      const progressText = lang.startsWith('fr')
        ? ` Tu as déjà ${progress}% de fait !`
        : ` You're already ${progress}% through!`;
      welcomeText += progressText;
      ctaText = lang.startsWith('fr') ? 'Continuer l\'onboarding' : 'Continue Onboarding';
    }

    // Create welcome message
    const welcomeWrapper = document.createElement('div');
    welcomeWrapper.className = 'chat-side-panel-message bot onboarding-prompt';
    welcomeWrapper.innerHTML = `
      <div class="message-content">
        <p>${welcomeText}</p>
        <div class="onboarding-cta-container" style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">
          <a href="${playgroundUrl}" class="onboarding-cta-btn" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px; transition: transform 0.2s, box-shadow 0.2s;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polygon points="10,8 16,12 10,16" fill="currentColor"/>
            </svg>
            ${ctaText}
          </a>
          <button class="skip-onboarding-btn" style="background: none; border: none; color: #6b7280; font-size: 13px; cursor: pointer; padding: 6px;">
            ${lang.startsWith('fr') ? 'Explorer sans onboarding' : 'Explore without onboarding'}
          </button>
        </div>
      </div>
    `;

    messagesContainer.appendChild(welcomeWrapper);

    // Handle skip button click
    const skipBtn = welcomeWrapper.querySelector('.skip-onboarding-btn');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        welcomeWrapper.remove();
        // Show regular suggestions after skip
        showSuggestionsAfterSkip();
      });
    }

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Show limited suggestions after user skips onboarding
   */
  function showSuggestionsAfterSkip() {
    const lang = getLanguage();

    // Show a simplified help message
    const helpMsg = lang.startsWith('fr')
      ? 'Pas de souci ! Je suis là pour t\'aider. Tu peux me poser des questions sur les stratégies d\'investissement, ou utiliser les suggestions ci-dessous.'
      : 'No problem! I\'m here to help. You can ask me questions about investment strategies, or use the suggestions below.';

    const helpWrapper = document.createElement('div');
    helpWrapper.className = 'chat-side-panel-message bot';
    helpWrapper.innerHTML = `<div class="message-content"><p>${helpMsg}</p></div>`;
    messagesContainer.appendChild(helpWrapper);

    // Show basic suggestions (limited set for non-onboarded users)
    const basicSuggestions = lang.startsWith('fr')
      ? [
          { text: 'Qu\'est-ce que le ratio de Sharpe ?', prompt: 'Explique-moi le ratio de Sharpe' },
          { text: 'Comment fonctionne l\'Arena ?', prompt: 'Comment fonctionne l\'Arena et les bots ?' },
          { text: 'Commencer l\'onboarding', prompt: '__START_ONBOARDING__' }
        ]
      : [
          { text: 'What is the Sharpe ratio?', prompt: 'Explain the Sharpe ratio to me' },
          { text: 'How does the Arena work?', prompt: 'How does the Arena and the bots work?' },
          { text: 'Start onboarding', prompt: '__START_ONBOARDING__' }
        ];

    basicSuggestions.forEach((suggestion) => {
      const btn = document.createElement('button');
      btn.className = 'chat-suggestion-btn';
      btn.textContent = suggestion.text;
      btn.dataset.prompt = suggestion.prompt;

      // Special handling for onboarding button
      if (suggestion.prompt === '__START_ONBOARDING__') {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          window.location.href = getPlaygroundUrl();
        });
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'chat-side-panel-message bot';
      const content = document.createElement('div');
      content.className = 'message-content';
      content.appendChild(btn);
      wrapper.appendChild(content);
      messagesContainer.appendChild(wrapper);
    });

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Load and seed suggestions for education contexts
  loadPersistedConversation();
  addEducationSuggestions();

  function emit(eventName, detail = {}) {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  function updateMinimizeButton() {
    const lang = getLanguage();
    if (state.isMinimized) {
      minimizeButton.textContent = '+';
      minimizeButton.setAttribute(
        'aria-label',
        lang.startsWith('fr') ? 'Restaurer le chat' : 'Restore chat'
      );
    } else {
      minimizeButton.textContent = '−';
      minimizeButton.setAttribute(
        'aria-label',
        lang.startsWith('fr') ? 'Réduire le chat' : 'Minimize chat'
      );
    }
  }

  function extractSuggestionPayload(button) {
    if (!button) {
      return { display: '', prompt: '' };
    }

    const translationsMap =
      (typeof window !== 'undefined' && window.translations) || undefined;

    const display =
      (button.getAttribute('data-display') || button.textContent || '').trim();

    const translateKey = button.getAttribute('data-translate');
    let prompt =
      button.getAttribute('data-prompt') ||
      (button.dataset ? button.dataset.prompt : '') ||
      '';

    if ((!prompt || prompt === '') && translateKey && translationsMap) {
      const entry = translationsMap[translateKey];
      if (entry) {
        prompt = entry.en || entry.fr || entry.en_us || display;
      }
    }

    if (!prompt) {
      prompt = display;
    }

    return { display, prompt };
  }

  function applySuggestionFromButton(button) {
    if (!button || !input) return;
    const { display, prompt } = extractSuggestionPayload(button);
    if (!display) return;

    button.classList.add('active');
    setTimeout(() => button.classList.remove('active'), 300);

    input.value = display;
    input.dataset.promptOverride = prompt;
    input.dataset.promptSource = display;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }

  const markdownLinkRegex = /\[([^[\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/g;

  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function applyInlineFormatting(text) {
    if (!text) return '';

    // Reset regex state (important for global regex reuse)
    markdownLinkRegex.lastIndex = 0;

    let html = '';
    let lastIndex = 0;
    let match;

    while ((match = markdownLinkRegex.exec(text)) !== null) {
      html += escapeHtml(text.slice(lastIndex, match.index));
      const label = escapeHtml(match[1]);
      const url = match[2];
      const isRelative = url.startsWith('/');
      html += `<a href="${url}" target="${isRelative ? '_self' : '_blank'}" rel="noopener noreferrer">${label}</a>`;
      lastIndex = match.index + match[0].length;
    }

    html += escapeHtml(text.slice(lastIndex));

    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    html = html.replace(/(^|\s)\*(.+?)\*(?=\s|$)/g, (full, prefix, content) => {
      const trailing = full.endsWith('*') ? '' : ' ';
      return `${prefix}<em>${content}</em>${trailing}`;
    });

    html = html.replace(/(^|[\s>])((?:https?:\/\/[^\s<]+)|(?:\/[^\s<]+))/g, (_, prefix, url) => {
      const isRelative = url.startsWith('/');
      return `${prefix}<a href="${url}" target="${isRelative ? '_self' : '_blank'}" rel="noopener noreferrer">${url}</a>`;
    });

    return html.replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  function formatAssistantMessage(text) {
    if (!text) return '';

    const lines = text.split(/\r?\n/);
    const fragments = [];
    let listItems = [];

    const flushList = () => {
      if (!listItems.length) return;
      fragments.push(`<ul class="chat-list">${listItems.join('')}</ul>`);
      listItems = [];
    };

    lines.forEach((line) => {
      const trimmed = line.trim();

      if (!trimmed) {
        flushList();
        fragments.push('<div class="chat-paragraph-spacer"></div>');
        return;
      }

      const headingMatch = trimmed.match(/^#{1,3}\s+(.*)$/);
      if (headingMatch) {
        flushList();
        const hashes = trimmed.match(/^#{1,3}/)[0].length;
        const level = Math.min(3 + hashes - 1, 5);
        const content = applyInlineFormatting(headingMatch[1].trim());
        fragments.push(`<h${level} class="chat-heading">${content}</h${level}>`);
        return;
      }

      if (/^[-*]\s+/.test(trimmed)) {
        const itemText = trimmed.replace(/^[-*]\s+/, '');
        listItems.push(`<li>${applyInlineFormatting(itemText)}</li>`);
        return;
      }

      flushList();
      fragments.push(`<p>${applyInlineFormatting(trimmed)}</p>`);
    });

    flushList();
    return fragments.join('');
  }

  function getLanguage() {
    return document.documentElement.lang || localStorage.getItem('bubbleLanguage') || 'fr';
  }

  function getPageContext() {
    const path = window.location.pathname;
    if (path.includes('pricing')) return 'pricing';
    if (path.includes('portfolio-simulator')) return 'simulator';
    if (path.includes('/playground/resources')) return 'playground_resources';
    if (path.includes('/education/arena')) return 'education_arena';
    if (path.includes('/education/simulator')) return 'education_simulator';
    if (path.includes('/education')) return 'education';
    if (path.includes('professionals/solutions-companies')) return 'professionals_companies';
    if (path.includes('professionals/solutions-wealth-managers')) return 'professionals_wealth';
    if (path.includes('professionals')) return 'professionals';
    if (path.includes('businesses')) return 'businesses';
    return 'index';
  }


  function buildContextMetadata(context) {
    if (context === 'professionals_companies') {
      return [
        'Visitor is reviewing the SME/CGPs consulting page.',
        'Highlight custom AI workflow sprints using Claude Code / Codex / Gemini, revenue recognition automation, monthly reporting copilots, client intelligence digests, and custom dashboards.',
        'Emphasize transparent €15k-30k projects delivered in 2-4 months and the /api/business-contact form for follow-up.',
        'Clarify that Bubble provides AI empowerment and automation, not financial advice.'
      ].join(' ');
    }
    if (context === 'professionals_wealth') {
      return [
        'Visitor is on the white-label Bubble Portfolio page for Wealth Managers/family offices.',
        'Focus on multi-client dashboards, personalized AI agents per client, advanced reporting, broker APIs (IBKR, Alpaca, Saxo), 20+ years of historical data, and the quant strategy library.',
        'Mention demo CTA (#pro-demo) and contact CTA pointing to /professionals#enterprise-waitlist.',
        'Reinforce that Bubble Portfolio is an automated trading copilot, not financial advice.'
      ].join(' ');
    }
    if (context === 'education') {
      return 'Visitor is on the education hub (Arena + Simulator). Keep tone educational, concise, not investment advice.';
    }
    if (context === 'education_arena') {
      return 'Visitor is in the AI Trading Arena education page. Explain bot actions, strategies, risk/return using current frame. Not investment advice.';
    }
    if (context === 'education_simulator') {
      return 'Visitor is in the Strategy Simulator education page. Guide plain language to strategy mixes; keep explanations simple. Not investment advice.';
    }
    return '';
  }

  panel.addEventListener('click', (event) => {
    const suggestionButton = event.target.closest('.chat-suggestion-btn');
    if (!suggestionButton) return;
    event.preventDefault();

    // Check if button has data-auto-submit="false" to disable auto-submit
    const autoSubmit = suggestionButton.dataset.autoSubmit !== 'false';

    if (autoSubmit) {
      // Auto-submit: directly send the message
      const { display, prompt } = extractSuggestionPayload(suggestionButton);
      if (display) {
        suggestionButton.classList.add('active');
        setTimeout(() => suggestionButton.classList.remove('active'), 300);
        sendMessage(display, prompt);
      }
    } else {
      // Legacy behavior: just fill the input
      applySuggestionFromButton(suggestionButton);
    }
  });

  function resetConversation() {
    state.conversation = [];
    state.isProcessing = false;
    if (state.abortController) {
      state.abortController.abort();
      state.abortController = null;
    }
    messagesContainer.innerHTML = initialMessagesHTML;
    persistConversation();
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

  /**
   * Dynamically load ToolResultVisualizer if not already loaded
   */
  function loadToolResultVisualizer() {
    if (typeof window.ToolResultVisualizer !== 'undefined') {
      return Promise.resolve();
    }

    const pathsToTry = [
      '/js/tool-result-visualizer.js',
    ];

    function tryLoadScript(path) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = path;
        script.async = true;
        script.onload = () => {
          console.log(`[chat-side-panel] ToolResultVisualizer loaded from ${path}`);
          resolve();
        };
        script.onerror = () => {
          script.remove();
          reject(new Error(`Failed to load from ${path}`));
        };
        document.head.appendChild(script);
      });
    }

    function tryNextPath(index) {
      if (index >= pathsToTry.length) {
        console.warn('[chat-side-panel] Failed to load ToolResultVisualizer - using fallback');
        return Promise.resolve();
      }
      return tryLoadScript(pathsToTry[index]).catch(() => tryNextPath(index + 1));
    }

    return tryNextPath(0);
  }

  // Attempt to load ToolResultVisualizer (non-blocking)
  loadToolResultVisualizer().catch(() => {});

  /**
   * Render tool result using ToolResultVisualizer or fallback
   * @param {Object} toolResult - Tool result from SSE
   * @param {HTMLElement} anchorEl - Anchor element for visualization
   */
  function renderToolResult(toolResult, anchorEl) {
    if (!toolResult || !anchorEl) return;

    // Use ToolResultVisualizer if available
    if (window.ToolResultVisualizer) {
      window.ToolResultVisualizer.handleToolResult(toolResult, anchorEl);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      return;
    }

    // Fallback to basic rendering
    const wrapper = anchorEl.closest('.chat-side-panel-message');
    if (!wrapper) return;

    const card = document.createElement('div');
    card.className = 'tool-result-card';
    card.style.marginTop = '8px';
    card.style.padding = '12px';
    card.style.border = '1px solid #e3e7ef';
    card.style.borderRadius = '10px';
    card.style.background = '#f8fafc';
    card.style.width = '100%';
    card.style.boxSizing = 'border-box';

    const name = document.createElement('div');
    name.style.fontWeight = '600';
    name.style.marginBottom = '6px';
    name.textContent = toolResult.name || 'Resultat outil';
    card.appendChild(name);

    const result = toolResult.result || {};

    // Metrics list
    if (result.data?.metrics) {
      const m = result.data.metrics;
      const list = document.createElement('div');
      list.style.display = 'flex';
      list.style.flexWrap = 'wrap';
      list.style.gap = '6px 12px';
      list.style.fontSize = '13px';
      list.style.color = '#334155';
      const entries = [
        ['Rendement total', m.totalReturn, '%'],
        ['Annualise', m.annualizedReturn, '%'],
        ['Volatilite', m.volatility, '%'],
        ['Sharpe', m.sharpeRatio, ''],
        ['Max DD', m.maxDrawdown, '%'],
      ];
      entries.forEach(([label, val, suffix]) => {
        if (val === undefined || val === null || Number.isNaN(val)) return;
        const item = document.createElement('div');
        item.textContent = `${label}: ${val}${suffix}`;
        list.appendChild(item);
      });
      card.appendChild(list);
    }

    // Chart (sparkline) if data present
    const series = result.data?.chartData;
    if (Array.isArray(series) && series.length > 1) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 100 40');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.style.width = '100%';
      svg.style.height = '120px';
      svg.style.marginTop = '10px';

      const values = series.map((p) => p.value).filter((v) => typeof v === 'number');
      const min = Math.min(...values);
      const max = Math.max(...values);
      const span = max - min || 1;
      const pts = series.map((p, i) => {
        const x = (i / (series.length - 1)) * 100;
        const y = 40 - ((p.value - min) / span) * 40;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      });

      const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      polyline.setAttribute('fill', 'none');
      polyline.setAttribute('stroke', '#4f46e5');
      polyline.setAttribute('stroke-width', '1.5');
      polyline.setAttribute('points', pts.join(' '));

      const baseline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      baseline.setAttribute('x1', '0');
      baseline.setAttribute('x2', '100');
      baseline.setAttribute('y1', '40');
      baseline.setAttribute('y2', '40');
      baseline.setAttribute('stroke', '#e5e7eb');
      baseline.setAttribute('stroke-width', '0.5');

      svg.appendChild(baseline);
      svg.appendChild(polyline);
      card.appendChild(svg);
    }

    wrapper.appendChild(card);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Track if we've shown the onboarding suggestion for this session
  let hasShownOnboardingInterrupt = false;

  /**
   * Check if message suggests user needs onboarding
   * @param {string} message - User's message
   * @returns {boolean} True if message suggests basic question
   */
  function detectBasicQuestion(message) {
    const basicPatterns = [
      // English patterns
      /what is (a |the )?(leverage|levier)/i,
      /what('s| is) (a |the )?(benchmark|volatility|risk parity|etf|sharpe ratio|drawdown|cagr|rebalancing|allocation|portfolio)/i,
      /how does (this|it) work/i,
      /explain (me |to me )?(what|how|the)/i,
      /i don't understand/i,
      /i('m| am) (lost|confused|new)/i,
      /can you explain/i,
      /help me understand/i,
      // French patterns
      /c'est quoi (le |la |un |une )?(levier|volatilit[eé]|etf|benchmark|sharpe|drawdown)/i,
      /expliqu(e|ez)(-moi)? /i,
      /qu'est[- ]ce que/i,
      /je (ne |)comprends pas/i,
      /aidez-moi [aà] comprendre/i,
      /je suis perdu/i,
      /comment [cç]a (marche|fonctionne)/i
    ];
    return basicPatterns.some(regex => regex.test(message));
  }

  /**
   * Show onboarding suggestion when user asks basic questions
   */
  function showOnboardingInterrupt(userMessage) {
    const lang = getLanguage();
    const playgroundUrl = getPlaygroundUrl();

    const suggestionText = lang.startsWith('fr')
      ? "Il semble que tu découvres ces concepts ! Avant de continuer, un rapide onboarding va rendre tout beaucoup plus clair. Veux-tu que je te guide ?"
      : "It looks like you're new to these concepts! Before we continue, a quick onboarding will make everything much clearer. Want me to guide you?";

    const wrapper = document.createElement('div');
    wrapper.className = 'chat-side-panel-message bot onboarding-interrupt';
    wrapper.innerHTML = `
      <div class="message-content">
        <p>${suggestionText}</p>
        <div class="onboarding-interrupt-buttons" style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
          <a href="${playgroundUrl}" class="onboarding-start-btn" style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 13px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polygon points="10,8 16,12 10,16" fill="currentColor"/>
            </svg>
            ${lang.startsWith('fr') ? 'Commencer l\'onboarding' : 'Start Onboarding'}
          </a>
          <button class="onboarding-answer-btn" data-pending-message="${escapeHtml(userMessage)}" style="padding: 8px 14px; background: transparent; border: 1px solid #e5e7eb; color: #6b7280; border-radius: 8px; font-size: 13px; cursor: pointer;">
            ${lang.startsWith('fr') ? 'Réponds à ma question' : 'Answer my question'}
          </button>
        </div>
      </div>
    `;

    messagesContainer.appendChild(wrapper);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Handle "Answer my question" button
    const answerBtn = wrapper.querySelector('.onboarding-answer-btn');
    if (answerBtn) {
      answerBtn.addEventListener('click', () => {
        const pendingMsg = answerBtn.dataset.pendingMessage;
        wrapper.remove();
        // Proceed with the original question, skipping onboarding check
        // Note: skipUserBubble=true because user message was already displayed in sendMessage()
        sendMessageDirect(pendingMsg, pendingMsg, { skipUserBubble: true });
      });
    }

    hasShownOnboardingInterrupt = true;
  }

  async function sendMessage(displayMessage, promptOverride) {
    const display = (displayMessage || '').trim();
    const prompt = (promptOverride || display).trim();

    if (!prompt || state.isProcessing) {
      return;
    }

    // Check if user hasn't completed onboarding and is asking a basic question
    // Only show interrupt once per session on education pages
    if (isEducationContext && !isOnboardingComplete() && !hasShownOnboardingInterrupt) {
      if (detectBasicQuestion(prompt)) {
        // Show user message first
        createMessageElement('user', display);
        // Then show onboarding suggestion
        showOnboardingInterrupt(prompt);
        return;
      }
    }

    // Proceed with normal message sending
    return sendMessageDirect(displayMessage, promptOverride);
  }

  /**
   * Send message directly without onboarding checks
   * Used after user confirms they want to skip onboarding
   * @param {string} displayMessage - The message to display
   * @param {string} promptOverride - The prompt to send to the API
   * @param {Object} options - Optional configuration
   * @param {boolean} options.skipUserBubble - If true, skip creating the user message bubble (already displayed)
   */
  async function sendMessageDirect(displayMessage, promptOverride, options = {}) {
    const display = (displayMessage || '').trim();
    const prompt = (promptOverride || display).trim();
    const { skipUserBubble = false } = options;

    if (!prompt || state.isProcessing) {
      return;
    }

    state.isProcessing = true;
    input.disabled = true;
    sendButton.disabled = true;

    // Remove initial suggestions when user sends first message
    const initialSuggestions = messagesContainer.querySelectorAll('.initial-suggestions');
    initialSuggestions.forEach(el => el.remove());

    // Render user message (unless already displayed via onboarding interrupt)
    if (!skipUserBubble) {
      createMessageElement('user', display);
    }

    // Prepare bot message placeholder
    const botMessageContent = createMessageElement('bot', '');

    state.conversation.push({ role: 'user', content: prompt });
    persistConversation();

    try {
      state.abortController = new AbortController();
      const payload = {
        message: prompt,
        language: getLanguage(),
        pageContext,
        history: state.conversation.slice(-10),
      };
      // Add page-specific context
      const metadata = buildContextMetadata(pageContext);
      if (metadata) {
        payload.contextMetadata = metadata;
      }
      // Add user profile context from BubbleAgentMemory (if available)
      const userProfileContext = buildUserProfileContext();
      if (userProfileContext) {
        payload.userProfileContext = userProfileContext;
      }
      // Add full user profile for tool execution (get_profile_visualization)
      const Memory = getMemory();
      if (Memory) {
        const profile = Memory.getProfile();
        if (profile) {
          payload.userProfile = profile;
        }
      }
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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
            if (payload.typing) {
              // ensure typing indicator is visible if no content yet
              if (isFirstChunk) {
                botMessageContent.innerHTML = '<div class="typing-indicator"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>';
              }
              continue;
            }
            if (payload.tool_result) {
              renderToolResult(payload.tool_result, botMessageContent);
              // If tool result carries an error flag, surface it as text too
              if (payload.tool_result.result && payload.tool_result.result.success === false) {
                const errText = payload.tool_result.result.error || 'Une erreur est survenue avec l’outil.';
                botMessageContent.textContent = errText;
              }
              continue;
            }
            if (payload.error && payload.is_error) {
              botMessageContent.textContent = payload.text || payload.error || 'Erreur';
              isFirstChunk = false;
              collected += botMessageContent.textContent;
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
      } else {
        botMessageContent.innerHTML = formatAssistantMessage(collected);
      }

      state.conversation.push({ role: 'assistant', content: collected || '...' });
      persistConversation();

      // Track conversation in BubbleAgentMemory
      trackConversationInMemory(prompt, collected);
    } catch (error) {
      console.error('chat-side-panel.js: sendMessage failed', error);
      const errorText = error.name === 'AbortError' ? '' : (error.message || 'Une erreur est survenue.');
      botMessageContent.textContent = errorText;
      if (errorText) {
        state.conversation.push({ role: 'assistant', content: errorText });
        persistConversation();
      }
    } finally {
      state.isProcessing = false;
      input.disabled = false;
      sendButton.disabled = false;
      input.value = '';
      delete input.dataset.promptOverride;
      delete input.dataset.promptSource;
      input.focus();
      state.abortController = null;
    }
  }

  function openPanel(initialMessage) {
    if (state.isOpen && state.isMinimized) {
      panel.classList.remove('is-minimized');
      state.isMinimized = false;
      document.body.classList.add('chat-side-panel-open');
      document.body.classList.remove('chat-collapsed');
      emit('chatSidePanel:restored');
      updateMinimizeButton();
    }

    document.body.classList.add('chat-side-panel-open');
    document.body.classList.remove('chat-collapsed');

    if (!state.isOpen) {
      state.isOpen = true;
      panel.classList.add('is-open');
      panel.classList.remove('is-minimized');
      panel.setAttribute('aria-hidden', 'false');
      document.body.classList.add('chat-side-panel-open');
      document.body.classList.remove('chat-collapsed');
      emit('chatSidePanel:opened');

      // For ALL investor pages, show proactive onboarding invitation if not completed
      // This ensures consistent onboarding experience across the entire investor section
      if (isInvestorPage() && !isEducationContext) {
        // Wait for BubbleAgentMemory to be loaded (it's async)
        setTimeout(() => {
          showProactiveOnboardingInvitation();
        }, 100);
      }

      // Ensure scroll position at bottom for existing messages
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      updateMinimizeButton();

      setTimeout(() => {
        input.focus();
      }, 150);
    }

    if (initialMessage) {
      sendMessage(initialMessage, initialMessage);
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
    document.body.classList.add('chat-collapsed');
    resetConversation();
    updateMinimizeButton();
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
      document.body.classList.add('chat-collapsed');
      emit('chatSidePanel:minimized');
    } else {
      document.body.classList.add('chat-side-panel-open');
      document.body.classList.remove('chat-collapsed');
      emit('chatSidePanel:restored');
      setTimeout(() => {
        input.focus();
      }, 150);
    }
    updateMinimizeButton();
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const display = input.value.trim();
    if (!display) return;

    const source = input.dataset.promptSource;
    const override = input.dataset.promptOverride;
    let prompt = display;
    if (override && source && display === source.trim()) {
      prompt = override;
    }

    delete input.dataset.promptOverride;
    delete input.dataset.promptSource;

    sendMessage(display, prompt);
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

  input.addEventListener('input', () => {
    const source = input.dataset.promptSource;
    if (!source) return;
    if (input.value.trim() !== source.trim()) {
      delete input.dataset.promptOverride;
      delete input.dataset.promptSource;
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
  updateMinimizeButton();

  // Set chat-collapsed by default for expanded results view on desktop
  document.body.classList.add('chat-collapsed');

  // Education-only: add a persistent toggle button to reopen the chat when floating input is gone
  if (isEducationContext) {
    const toggle = document.createElement('button');
    toggle.className = 'education-chat-toggle';
    toggle.type = 'button';
    const lang = getLanguage();
    toggle.setAttribute('aria-label', lang.startsWith('fr') ? 'Ouvrir le chat' : 'Open chat');
    // Bubble logo SVG - black on white background
    toggle.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="55" r="32" fill="none" stroke="#111827" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="160 40" stroke-dashoffset="10" />
        <circle cx="72" cy="32" r="8" fill="#111827" />
      </svg>
    `;

    toggle.addEventListener('click', () => {
      openPanel();
    });

    document.body.appendChild(toggle);

    // Track toggle visibility based on panel state AND floating input visibility
    let panelClosed = true;

    function isFloatingInputVisible() {
      const floatingInput = document.getElementById('floating-chat-input');
      return floatingInput && !floatingInput.classList.contains('hidden');
    }

    function updateToggleVisibility() {
      // Only show toggle when panel is closed/minimized AND floating input is NOT visible
      const shouldShow = panelClosed && !isFloatingInputVisible();
      toggle.classList.toggle('hidden', !shouldShow);
    }

    window.addEventListener('chatSidePanel:opened', () => {
      panelClosed = false;
      updateToggleVisibility();
    });
    window.addEventListener('chatSidePanel:restored', () => {
      panelClosed = false;
      updateToggleVisibility();
    });
    window.addEventListener('chatSidePanel:closed', () => {
      panelClosed = true;
      updateToggleVisibility();
    });
    window.addEventListener('chatSidePanel:minimized', () => {
      panelClosed = true;
      updateToggleVisibility();
    });

    // Also update when floating input visibility changes (on scroll)
    const floatingInput = document.getElementById('floating-chat-input');
    if (floatingInput) {
      const observer = new MutationObserver(updateToggleVisibility);
      observer.observe(floatingInput, { attributes: true, attributeFilter: ['class'] });
    }

    // Initial state - hidden until floating input is used/hidden
    updateToggleVisibility();
  }
})();
