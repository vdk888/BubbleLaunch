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
   * Get BubbleAgentMemory if available (graceful degradation)
   * @returns {Object|null} Memory module or null
   */
  function getMemory() {
    return typeof BubbleAgentMemory !== 'undefined' ? BubbleAgentMemory : null;
  }

  /**
   * Build visitor context for LLM from BubbleAgentMemory
   * Token-efficient format for inclusion in system context
   * @returns {string} Formatted visitor context or empty string
   */
  function buildUserProfileContext() {
    const Memory = getMemory();
    if (!Memory) return '';

    const ctx = Memory.getContextForLLM();
    if (!ctx) return '';

    const parts = [];

    // Visitor type information
    if (ctx.profile) {
      if (ctx.profile.visitorType) {
        parts.push(`Visitor type: ${ctx.profile.visitorType}`);
      }
      if (ctx.profile.painPoint) {
        parts.push(`Pain point: ${ctx.profile.painPoint}`);
      }
      if (ctx.profile.aiMaturity) {
        parts.push(`AI maturity: ${ctx.profile.aiMaturity}`);
      }
      if (ctx.profile.companyType) {
        parts.push(`Company: ${ctx.profile.companyType}`);
      }
      if (ctx.profile.industry) {
        parts.push(`Industry: ${ctx.profile.industry}`);
      }
      if (ctx.profile.interests && ctx.profile.interests.length > 0) {
        parts.push(`Interests: ${ctx.profile.interests.join(', ')}`);
      }
    }

    // Journey information
    if (ctx.journey) {
      if (ctx.journey.isReturningUser) {
        parts.push(`Returning user (visit #${ctx.journey.totalVisits})`);
      }
    }

    // Memory insights
    if (ctx.memory) {
      if (ctx.memory.topicsDiscussed && ctx.memory.topicsDiscussed.length > 0) {
        parts.push(`Topics discussed: ${ctx.memory.topicsDiscussed.slice(-5).join(', ')}`);
      }
    }

    if (parts.length === 0) return '';

    return `[Visitor Context: ${parts.join(' | ')}]`;
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
      'ai_agents': ['agent', 'ai agent', 'automatisation', 'automation', 'workflow', 'copilot'],
      'consulting': ['consulting', 'accompagnement', 'diagnostic', 'sprint', 'project', 'projet'],
      'pricing': ['price', 'prix', 'cost', 'coût', 'fee', 'frais', 'budget', 'tarif'],
      'poc': ['poc', 'proof of concept', 'investment agent', 'simulator', 'simulateur', 'portfolio'],
      'content': ['blog', 'newsletter', 'youtube', 'tutorial', 'tutoriel', 'article'],
      'philosophy': ['selfware', 'philosophy', 'philosophie', 'build in public', 'transparency'],
      'booking': ['book', 'réserver', 'call', 'appel', 'calendly', 'rendez-vous', 'meeting']
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
    // Playground resources: force fresh start
    if (pageContext === 'playground_resources') {
      state.conversation = [];
      messagesContainer.innerHTML = '';
      initialMessagesHTML = '';
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


  // Load persisted conversation
  loadPersistedConversation();

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
    if (path.includes('portfolio-simulator')) return 'simulator';
    if (path.includes('/playground/resources')) return 'playground_resources';
    if (path.includes('/education/arena')) return 'education_arena';
    if (path.includes('/education/simulator')) return 'education_simulator';
    if (path.includes('/education')) return 'education';
    if (path.includes('professionals/solutions-companies')) return 'professionals_companies';
    if (path.includes('professionals/solutions-wealth-managers')) return 'professionals_wealth';
    if (path.includes('professionnels') || path.includes('professionals')) return 'professionals';
    if (path.includes('businesses')) return 'professionals';
    if (path.includes('particuliers') || path.includes('individuals') || path.includes('investors')) return 'individuals';
    if (path.includes('a-propos') || path.includes('about')) return 'about';
    if (path.includes('blog')) return 'blog';
    if (path.includes('pricing')) return 'individuals';
    return 'index';
  }


  function buildContextMetadata(context) {
    if (context === 'professionals_companies' || context === 'professionals') {
      return [
        'Visitor is browsing B2B consulting pages.',
        'Focus on co-construction approach, custom AI agent sprints, diagnostic calls.',
        'Highlight ex-Deloitte & UBS background for finance clients.',
        'Use qualify_professional_need tool when pain points emerge, then guide to book_consultation.'
      ].join(' ');
    }
    if (context === 'professionals_wealth') {
      return [
        'Visitor is a wealth manager or CGP exploring AI automation.',
        'Emphasize regulatory expertise (UCITS, KYC, AMF), client intelligence agents, reporting copilots.',
        'Guide toward diagnostic call via book_consultation tool.'
      ].join(' ');
    }
    if (context === 'individuals') {
      return [
        'Visitor is an individual exploring Bubble content.',
        'Share educational content, POC showcase, and blog resources.',
        'Use get_poc_showcase and recommend_content tools. Bridge interest to B2B when relevant.'
      ].join(' ');
    }
    if (context === 'blog') {
      return 'Visitor is reading the blog. Use recommend_content to suggest related articles and channels.';
    }
    if (context === 'education' || context === 'education_arena' || context === 'education_simulator') {
      return 'Visitor is exploring educational content (Arena / Simulator). Keep tone educational and concise.';
    }
    if (context === 'simulator') {
      return 'Visitor is using the portfolio simulator. Explain strategies in simple terms. This is an educational showcase, not investment advice.';
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

    // Fallback to basic text rendering
    const wrapper = anchorEl.closest('.chat-side-panel-message');
    if (!wrapper) return;

    const card = document.createElement('div');
    card.style.marginTop = '8px';
    card.style.padding = '12px';
    card.style.border = '1px solid #e3e7ef';
    card.style.borderRadius = '10px';
    card.style.background = '#f8fafc';
    card.style.width = '100%';
    card.style.boxSizing = 'border-box';
    card.style.fontSize = '13px';
    card.style.color = '#334155';

    const toolName = toolResult.name || 'tool';
    const data = toolResult.result?.data || toolResult.result || {};

    // Simple fallback: show tool name and key info
    card.textContent = data.message || data.description || `[${toolName}]`;

    wrapper.appendChild(card);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  async function sendMessage(displayMessage, promptOverride) {
    const display = (displayMessage || '').trim();
    const prompt = (promptOverride || display).trim();

    if (!prompt || state.isProcessing) {
      return;
    }

    return sendMessageDirect(displayMessage, promptOverride);
  }

  /**
   * Send message to the chatbot API
   * @param {string} displayMessage - The message to display
   * @param {string} promptOverride - The prompt to send to the API
   */
  async function sendMessageDirect(displayMessage, promptOverride) {
    const display = (displayMessage || '').trim();
    const prompt = (promptOverride || display).trim();

    if (!prompt || state.isProcessing) {
      return;
    }

    const skipUserBubble = false;

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

    // Show typing indicator immediately (Jade msg 5020 — UX while LLM cold-starts) :
    // Le placeholder bot est vide jusqu'au premier chunk SSE. Avec OpenRouter free
    // models, le 1er chunk peut tarder 10-30s. On affiche typing dots de suite pour
    // rassurer l'utilisateur.
    botMessageContent.innerHTML = '<div class="typing-indicator"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>';

    let timeoutId = null;
    let slowMessageTimeoutId = null;
    try {
      state.abortController = new AbortController();
      // Timeout client : 90s (Jade msg 5020 — passé de 45s à 90s pour laisser
      // le temps aux modèles free OpenRouter de répondre, ils sont parfois lents)
      timeoutId = setTimeout(() => {
        if (state.abortController) state.abortController.abort();
      }, 90000);
      // Au bout de 15s sans réponse, on ajoute un sous-message pour rassurer
      slowMessageTimeoutId = setTimeout(() => {
        const lang = getLanguage();
        const slowMsg = lang.startsWith('fr')
          ? '<div class="typing-indicator"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div><div style="font-size:0.85em;opacity:0.7;margin-top:0.5rem;">Modèle gratuit en cours de chargement…</div>'
          : '<div class="typing-indicator"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div><div style="font-size:0.85em;opacity:0.7;margin-top:0.5rem;">Free model loading…</div>';
        // Only swap if still showing initial typing (no content yet)
        if (botMessageContent.querySelector('.typing-indicator') && !botMessageContent.textContent.replace(/[\s•]+/g, '').length) {
          botMessageContent.innerHTML = slowMsg;
        }
      }, 15000);
      const payload = {
        message: prompt,
        language: getLanguage(),
        pageContext,
        history: state.conversation.slice(-5),
      };
      // Add page-specific context
      const metadata = buildContextMetadata(pageContext);
      if (metadata) {
        payload.contextMetadata = metadata;
      }
      // Add visitor context from BubbleAgentMemory (if available)
      const userProfileContext = buildUserProfileContext();
      if (userProfileContext) {
        payload.userProfileContext = userProfileContext;
      }
      console.log('[chat-side-panel] Sending to /api/chat:', { message: prompt.substring(0, 50), pageContext });
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
      let errorText;
      if (error.name === 'AbortError') {
        const lang = getLanguage();
        errorText = lang.startsWith('fr')
          ? 'Le serveur met trop de temps à répondre. Réessayez.'
          : 'Server took too long to respond. Please try again.';
      } else {
        errorText = error.message || 'Une erreur est survenue.';
      }
      botMessageContent.textContent = errorText;
      if (errorText) {
        state.conversation.push({ role: 'assistant', content: errorText });
        persistConversation();
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      if (slowMessageTimeoutId) clearTimeout(slowMessageTimeoutId);
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
