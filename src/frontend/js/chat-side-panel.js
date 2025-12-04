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
  const pageContext = getPageContext();

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
    if (!isEducationContext) return;
    try {
      const raw = sessionStorage.getItem('educationChatHistoryShared');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          state.conversation = parsed;
          messagesContainer.innerHTML = '';
          parsed.forEach((msg) => {
            const contentEl = createMessageElement(msg.role === 'user' ? 'user' : 'bot', msg.content);
            if (msg.role !== 'user' && contentEl) {
              contentEl.innerHTML = msg.content;
            }
          });
        }
      }
    } catch {
      // ignore
    }
  }

  function persistConversation() {
    if (!isEducationContext) return;
    try {
      sessionStorage.setItem('educationChatHistoryShared', JSON.stringify(state.conversation.slice(-12)));
    } catch {
      // ignore
    }
  }

  function addEducationSuggestions() {
    if (!isEducationContext) return;
    // If suggestions already present, skip
    if (messagesContainer.querySelector('.chat-suggestion-btn')) return;
    const lang = getLanguage();
    const base = lang.startsWith('fr')
      ? {
          intro: 'Suggestions rapides',
          arena: [
            'Expliquer ce trade',
            'Comparer deux bots ce mois-ci',
            'Montrer une crise (2008, COVID, SVB)',
            'Différence momentum vs défensif',
          ],
          simulator: [
            'Propose 2 mixes pour un profil prudent',
            'Rends ma stratégie plus défensive',
            'Ajoute du momentum si la tendance est forte',
            'Compare ma stratégie au S&P 500',
          ],
          waitlist: 'Je veux la version complète (liste d’attente)',
        }
      : {
          intro: 'Quick suggestions',
          arena: [
            'Explain this trade',
            'Compare two bots this month',
            'Jump to a crisis (2008, COVID, SVB)',
            'Difference between momentum and defensive',
          ],
          simulator: [
            'Suggest 2 mixes for a cautious profile',
            'Make my strategy more defensive',
            'Add momentum only if trend is strong',
            'Compare my strategy to the S&P 500',
          ],
          waitlist: 'I want the full version (join waitlist)',
        };

    const rows = [];
    if (pageContext === 'education_arena') {
      rows.push(...base.arena);
    } else if (pageContext === 'education_simulator') {
      rows.push(...base.simulator);
    } else {
      rows.push(...base.arena.slice(0, 2), ...base.simulator.slice(0, 2));
    }
    rows.push(base.waitlist);

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

  const markdownLinkRegex = /\[([^[\]]+)\]\((https?:\/\/[^\s)]+|\/#[^\s)]+)\)/g;

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

    html = html.replace(/(^|[\s>])((?:https?:\/\/[^\s<]+)|(?:\/#[^\s<]+))/g, (_, prefix, url) => {
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

  async function sendMessage(displayMessage, promptOverride) {
    const display = (displayMessage || '').trim();
    const prompt = (promptOverride || display).trim();

    if (!prompt || state.isProcessing) {
      return;
    }

    state.isProcessing = true;
    input.disabled = true;
    sendButton.disabled = true;

    // Render user message
    createMessageElement('user', display);

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
      const metadata = buildContextMetadata(pageContext);
      if (metadata) {
        payload.contextMetadata = metadata;
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
