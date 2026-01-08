/**
 * AI Trading Arena JavaScript
 *
 * Handles:
 * - Fetching timeline data from /api/arena/timeline
 * - Chart.js visualization with 4 bot portfolios
 * - Timeline playback controls (play/pause, speed)
 * - Manual timeline scrubbing
 * - Bot dialogue updates with typing effect
 * - Leaderboard animations
 * - Event jump navigation
 */

(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // Configuration
  // ═══════════════════════════════════════════════════════════════

  const CONFIG = {
    API_ENDPOINT: '/api/arena/timeline',
    PLAYBACK_SPEEDS: [0.5, 1, 2, 4],
    DEFAULT_SPEED_INDEX: 1,
    FRAME_INTERVAL_MS: 500, // Base interval between frames
    TYPING_SPEED_MS: 30, // Typing effect speed
    BOT_COLORS: {
      equi: '#6B7280',
      pari: '#667eea',
      momo: '#F97316',
      sage: '#10B981',
    },
    BOT_NAMES: {
      fr: {
        equi: 'Ours',
        pari: 'Renard',
        momo: 'Faucon',
        sage: 'Hérisson',
      },
      en: {
        equi: 'Bear',
        pari: 'Fox',
        momo: 'Hawk',
        sage: 'Hedgehog',
      },
    },
  };

  // ═══════════════════════════════════════════════════════════════
  // State
  // ═══════════════════════════════════════════════════════════════

  const state = {
    timeline: null,
    frames: [],
    currentFrameIndex: 0,
    isPlaying: false,
    playbackSpeedIndex: CONFIG.DEFAULT_SPEED_INDEX,
    playbackInterval: null,
    chart: null,
    language: document.documentElement.lang || 'fr',
    chatHistory: [],
    selectedBot: null, // Track selected bot for highlighting
    previousLeaderboard: [], // Track previous leaderboard for change detection
  };

  // ═══════════════════════════════════════════════════════════════
  // Onboarding Awareness Check
  // ═══════════════════════════════════════════════════════════════

  const PLAYGROUND_SESSION_KEY = 'bubblePlaygroundFullscreenSession';
  const ONBOARDING_DISMISSED_KEY = 'arenaOnboardingPromptDismissed';

  /**
   * Check if user has completed onboarding in playground
   * @returns {boolean}
   */
  function hasCompletedOnboarding() {
    const stored = sessionStorage.getItem(PLAYGROUND_SESSION_KEY);
    if (!stored) return false;
    try {
      const session = JSON.parse(stored);
      // User completed onboarding if they have a profile or completed quiz
      return session.profile !== null || (session.scores && session.scores.length > 0);
    } catch {
      return false;
    }
  }

  /**
   * Show onboarding prompt if user hasn't completed playground onboarding
   */
  function checkOnboardingAwareness() {
    // Skip if already dismissed or completed
    if (sessionStorage.getItem(ONBOARDING_DISMISSED_KEY)) return;
    if (hasCompletedOnboarding()) return;

    const lang = state.language;
    const container = document.querySelector('.arena-container');
    if (!container) return;

    const prompt = document.createElement('div');
    prompt.id = 'arenaOnboardingPrompt';
    prompt.className = 'arena-onboarding-prompt';
    prompt.innerHTML = `
      <div class="onboarding-prompt-content">
        <div class="onboarding-prompt-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div class="onboarding-prompt-text">
          <strong>${lang === 'fr' ? 'Nouveau ici ?' : 'New here?'}</strong>
          <p>${lang === 'fr'
            ? "L'Arena est plus fun une fois que tu comprends les bases. Envie d'un petit tour d'abord ?"
            : "The Arena is more fun once you understand the basics. Want a quick tour first?"}</p>
        </div>
        <div class="onboarding-prompt-actions">
          <a href="${lang === 'fr' ? '/investors/playground' : '/en/investors/playground'}" class="onboarding-prompt-btn primary">
            ${lang === 'fr' ? 'Commencer le Tour' : 'Start Onboarding'}
          </a>
          <button class="onboarding-prompt-btn secondary" id="dismissOnboardingPrompt">
            ${lang === 'fr' ? "Non merci, j'explore" : "No thanks, I'll explore"}
          </button>
        </div>
      </div>
    `;

    // Insert after back button
    const backBtn = container.querySelector('.back-button');
    if (backBtn && backBtn.nextSibling) {
      container.insertBefore(prompt, backBtn.nextSibling);
    } else {
      container.insertBefore(prompt, container.firstChild);
    }

    // Dismiss handler
    document.getElementById('dismissOnboardingPrompt')?.addEventListener('click', () => {
      sessionStorage.setItem(ONBOARDING_DISMISSED_KEY, 'true');
      prompt.classList.add('dismissed');
      setTimeout(() => prompt.remove(), 300);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // Helper Functions
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get bot name based on current language
   * @param {string} botId - Bot identifier (equi, pari, momo, sage)
   * @returns {string} Localized bot name
   */
  function getBotName(botId) {
    const lang = state.language === 'en' ? 'en' : 'fr';
    return CONFIG.BOT_NAMES[lang][botId] || botId;
  }

  // ═══════════════════════════════════════════════════════════════
  // DOM Elements
  // ═══════════════════════════════════════════════════════════════

  const elements = {
    chart: null,
    playPauseBtn: null,
    playIcon: null,
    pauseIcon: null,
    speedBtn: null,
    timelineSlider: null,
    currentDate: null,
    eventMarkers: null,
    leaderboardList: null,
    tradeTape: null,
    botDialogues: {},
    botPnls: {},
    chatFab: null,
    chatPanel: null,
    chatOverlay: null,
    chatMessages: null,
    chatInput: null,
    chatSend: null,
    chatClose: null,
    // Tutorial overlay elements
    tutorialOverlay: null,
    tutorialCloseBtn: null,
    tutorialHelpBtn: null,
    tutorialNextBtn: null,
    tutorialSkipBtn: null,
  };

  // ═══════════════════════════════════════════════════════════════
  // Initialization
  // ═══════════════════════════════════════════════════════════════

  async function init() {
    console.log('[Arena] Initializing...');

    // Cache DOM elements
    cacheElements();

    // Detect language
    detectLanguage();

    // Check onboarding awareness
    checkOnboardingAwareness();

    // Load timeline data
    try {
      await loadTimelineData();
      console.log('[Arena] Timeline data loaded:', state.frames.length, 'frames');
    } catch (error) {
      console.error('[Arena] Failed to load timeline:', error);
      showError('Failed to load arena data. Please refresh the page.');
      return;
    }

    // Initialize chart
    initChart();

    // Initialize controls
    initControls();

    // Add event markers
    addEventMarkers();

    // Set initial frame
    updateFrame(0);

    // Initialize tutorial overlay
    initTutorial();

    // Expose arena state for chatbot integration
    exposeArenaState();

    console.log('[Arena] Initialization complete');
  }

  /**
   * Expose arena state globally for chatbot context integration
   */
  function exposeArenaState() {
    window.arenaState = {
      getCurrentState: () => {
        const frame = state.frames[state.currentFrameIndex];
        if (!frame) return null;

        // Build leaderboard
        const leaderboard = Object.entries(frame.bots)
          .map(([botId, data]) => ({
            bot: botId,
            name: getBotName(botId),
            pnl: data.pnlPercent,
          }))
          .sort((a, b) => b.pnl - a.pnl);

        return {
          currentFrame: state.currentFrameIndex,
          totalFrames: state.frames.length,
          currentMonth: frame.month,
          isPlaying: state.isPlaying,
          playbackSpeed: CONFIG.PLAYBACK_SPEEDS[state.playbackSpeedIndex],
          leadingBot: leaderboard[0]?.bot || null,
          leadingBotName: leaderboard[0]?.name || null,
          recentEvent: frame.event ? {
            type: frame.event.type,
            label: frame.event.label[state.language] || frame.event.label.fr,
          } : null,
          leaderboard: leaderboard,
          language: state.language,
        };
      },
      jumpToFrame: (frameIndex) => {
        if (frameIndex >= 0 && frameIndex < state.frames.length) {
          updateFrame(frameIndex);
          if (elements.timelineSlider) {
            elements.timelineSlider.value = frameIndex;
          }
        }
      },
      togglePlayback: () => {
        togglePlayback();
      },
      getBotName: getBotName,
    };

    // Dispatch event to notify chatbot that arena state is available
    window.dispatchEvent(new CustomEvent('arenaStateReady', { detail: window.arenaState }));
  }

  function cacheElements() {
    elements.chart = document.getElementById('arenaChart');
    elements.playPauseBtn = document.getElementById('playPauseBtn');
    elements.playIcon = document.getElementById('playIcon');
    elements.pauseIcon = document.getElementById('pauseIcon');
    elements.speedBtn = document.getElementById('speedBtn');
    elements.timelineSlider = document.getElementById('timelineSlider');
    elements.currentDate = document.getElementById('currentDate');
    elements.eventMarkers = document.getElementById('eventMarkers');
    elements.leaderboardList = document.getElementById('leaderboardList');
    elements.tradeTape = document.getElementById('tradeTape');
    elements.chatFab = document.getElementById('arenaChatFab');
    elements.chatPanel = document.getElementById('arenaChatPanel');
    elements.chatOverlay = document.getElementById('arenaChatOverlay');
    elements.chatMessages = document.getElementById('arenaChatMessages');
    elements.chatInput = document.getElementById('arenaChatInput');
    elements.chatSend = document.getElementById('arenaChatSend');
    elements.chatClose = document.getElementById('arenaChatClose');

    // Bot-specific elements
    ['equi', 'pari', 'momo', 'sage'].forEach((botId) => {
      elements.botDialogues[botId] = document.getElementById(`${botId}Dialogue`);
      elements.botPnls[botId] = document.getElementById(`${botId}Pnl`);
    });

    // Tutorial overlay elements
    elements.tutorialOverlay = document.getElementById('tutorialOverlay');
    elements.tutorialCloseBtn = document.getElementById('tutorialCloseBtn');
    elements.tutorialHelpBtn = document.getElementById('arenaHelpBtn');
    elements.tutorialNextBtn = document.getElementById('tutorialNext');
    elements.tutorialSkipBtn = document.getElementById('tutorialSkip');
  }

  function detectLanguage() {
    // Check for language from i18n system or HTML lang attribute
    const htmlLang = document.documentElement.lang;
    const savedLang = localStorage.getItem('bubbleLanguage');
    state.language = savedLang || htmlLang || 'fr';

    // Listen for language changes
    window.addEventListener('languageChange', (e) => {
      state.language = e.detail.language;
      // Update dialogues with new language
      if (state.frames.length > 0) {
        updateBotDialogues(state.frames[state.currentFrameIndex]);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // Tutorial Overlay
  // ═══════════════════════════════════════════════════════════════

  const TUTORIAL_STORAGE_KEY = 'arenaTutorialSeen';
  let tutorialStep = 0;
  const TUTORIAL_STEPS = 5;

  const TUTORIAL_CONTENT = {
    fr: [
      '<strong>Les 4 bots</strong> ci-dessous représentent différentes stratégies d\'investissement. Chacun a sa personnalité et sa façon de gérer le risque. Observez comment ils réagissent aux mêmes conditions de marché.',
      '<strong>Le graphique</strong> affiche l\'évolution de la valeur de chaque portefeuille au fil du temps. Suivez les performances et comparez visuellement les stratégies.',
      '<strong>Les contrôles</strong> vous permettent de jouer/pauser la simulation, ajuster la vitesse, et naviguer dans le temps avec le slider.',
      '<strong>Le fil d\'actualité</strong> en bas affiche les trades effectués en temps réel. Cliquez sur "Expliquer ce trade" pour comprendre la décision.',
      '<strong>Le chat IA</strong> est disponible pour répondre à vos questions sur les stratégies, les décisions des bots, et les concepts d\'investissement.',
    ],
    en: [
      '<strong>The 4 bots</strong> below represent different investment strategies. Each has its own personality and risk management approach. Watch how they react to the same market conditions.',
      '<strong>The chart</strong> shows the portfolio value evolution over time. Follow performance and visually compare strategies.',
      '<strong>The controls</strong> let you play/pause the simulation, adjust speed, and navigate through time with the slider.',
      '<strong>The trade tape</strong> at the bottom displays trades in real-time. Click "Explain this trade" to understand the decision.',
      '<strong>The AI chat</strong> is available to answer your questions about strategies, bot decisions, and investment concepts.',
    ],
  };

  function initTutorial() {
    if (!elements.tutorialOverlay) return;

    // Check if user has seen tutorial this session
    const hasSeenTutorial = sessionStorage.getItem(TUTORIAL_STORAGE_KEY);

    if (!hasSeenTutorial) {
      // First visit - show tutorial overlay
      openTutorial();
    } else {
      // Already seen - show help button
      showHelpButton();
    }

    // Bind event listeners
    elements.tutorialCloseBtn?.addEventListener('click', closeTutorial);
    elements.tutorialSkipBtn?.addEventListener('click', closeTutorial);
    elements.tutorialNextBtn?.addEventListener('click', nextTutorialStep);
    elements.tutorialHelpBtn?.addEventListener('click', openTutorial);

    // Close on overlay background click
    elements.tutorialOverlay?.addEventListener('click', (e) => {
      if (e.target === elements.tutorialOverlay) {
        closeTutorial();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && elements.tutorialOverlay?.classList.contains('active')) {
        closeTutorial();
      }
    });
  }

  function openTutorial() {
    tutorialStep = 0;
    const tutorialCard = document.getElementById('arenaTutorial');
    if (tutorialCard) {
      tutorialCard.style.removeProperty('display'); // reset if hidden by older scripts
    }
    updateTutorialContent();
    elements.tutorialOverlay?.classList.add('active');
    elements.tutorialHelpBtn?.classList.remove('visible');
    document.body.style.overflow = 'hidden';
  }

  function closeTutorial() {
    elements.tutorialOverlay?.classList.remove('active');
    document.body.style.overflow = '';
    sessionStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    showHelpButton();
  }

  function showHelpButton() {
    setTimeout(() => {
      elements.tutorialHelpBtn?.classList.add('visible');
    }, 300);
  }

  function nextTutorialStep() {
    tutorialStep++;
    if (tutorialStep >= TUTORIAL_STEPS) {
      closeTutorial();
    } else {
      updateTutorialContent();
    }
  }

  function updateTutorialContent() {
    const tutorial = document.getElementById('arenaTutorial');
    if (!tutorial) return;

    const lang = state.language || 'fr';
    const content = TUTORIAL_CONTENT[lang] || TUTORIAL_CONTENT.fr;

    // Update step indicators
    const steps = tutorial.querySelectorAll('.tutorial-step');
    steps.forEach((step, index) => {
      step.classList.remove('active', 'completed');
      if (index < tutorialStep) {
        step.classList.add('completed');
      } else if (index === tutorialStep) {
        step.classList.add('active');
      }
    });

    // Update progress text
    const progress = tutorial.querySelector('.tutorial-progress');
    if (progress) {
      progress.textContent = `${tutorialStep + 1} / ${TUTORIAL_STEPS}`;
    }

    // Update content
    const contentEl = tutorial.querySelector('.tutorial-content p');
    if (contentEl) {
      contentEl.innerHTML = content[tutorialStep];
    }

    // Update button text on last step
    if (elements.tutorialNextBtn) {
      const isLastStep = tutorialStep === TUTORIAL_STEPS - 1;
      elements.tutorialNextBtn.textContent = isLastStep
        ? (lang === 'fr' ? 'Commencer' : 'Start')
        : (lang === 'fr' ? 'Compris, continuer' : 'Got it, continue');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Chat History Helpers (session-scoped across education pages)
  // ═══════════════════════════════════════════════════════════════
  function loadChatHistory() {
    try {
      const raw = sessionStorage.getItem('educationChatHistory');
      if (raw) state.chatHistory = JSON.parse(raw);
    } catch {
      state.chatHistory = [];
    }
  }

  function persistChatHistory() {
    try {
      sessionStorage.setItem('educationChatHistory', JSON.stringify(state.chatHistory.slice(-12)));
    } catch {
      // ignore
    }
  }

  function pushHistory(role, content) {
    state.chatHistory.push({ role, content });
    persistChatHistory();
  }

  // ═══════════════════════════════════════════════════════════════
  // Data Loading
  // ═══════════════════════════════════════════════════════════════

  async function loadTimelineData() {
    const response = await fetch(CONFIG.API_ENDPOINT);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success || !result.data) {
      throw new Error('Invalid API response');
    }

    state.timeline = result.data;
    state.frames = result.data.frames || [];

    // Update slider max value
    if (elements.timelineSlider && state.frames.length > 0) {
      elements.timelineSlider.max = state.frames.length - 1;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Chart Initialization
  // ═══════════════════════════════════════════════════════════════

  function initChart() {
    if (!elements.chart || state.frames.length === 0) {
      console.warn('[Arena] Cannot initialize chart: missing canvas or data');
      return;
    }

    const ctx = elements.chart.getContext('2d');

    // Prepare datasets for each bot
    const datasets = Object.keys(CONFIG.BOT_COLORS).map((botId) => ({
      label: getBotName(botId),
      data: [],
      borderColor: CONFIG.BOT_COLORS[botId],
      backgroundColor: hexToRgba(CONFIG.BOT_COLORS[botId], 0.1),
      borderWidth: 2,
      tension: 0.3,
      fill: false,
      pointRadius: 0,
      pointHoverRadius: 4,
    }));

    state.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 300,
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              font: { family: 'Inter', size: 12 },
              padding: 16,
            },
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#1F2937',
            bodyColor: '#4B5563',
            borderColor: 'rgba(102, 126, 234, 0.3)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            titleFont: { family: 'Inter', weight: '600' },
            bodyFont: { family: 'Inter' },
            callbacks: {
              label: function (context) {
                const value = context.parsed.y;
                const pnl = ((value - 100) / 100) * 100;
                const sign = pnl >= 0 ? '+' : '';
                return `${context.dataset.label}: ${value.toFixed(2)} (${sign}${pnl.toFixed(2)}%)`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: { family: 'Inter', size: 11 },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 10,
            },
          },
          y: {
            beginAtZero: false,
            grid: {
              color: 'rgba(107, 114, 128, 0.1)',
            },
            ticks: {
              font: { family: 'Inter', size: 11 },
              callback: function (value) {
                return value.toFixed(0);
              },
            },
            title: {
              display: true,
              text: state.language === 'fr' ? 'Valeur du portefeuille' : 'Portfolio Value',
              font: { family: 'Inter', size: 12 },
            },
          },
        },
      },
    });

    // Populate chart with data up to current frame
    updateChartData(0);
  }

  function updateChartData(frameIndex) {
    if (!state.chart || state.frames.length === 0) return;

    // Get frames from start to current index
    const framesToShow = state.frames.slice(0, frameIndex + 1);

    // Update labels (dates)
    state.chart.data.labels = framesToShow.map((f) => formatMonthYear(f.month));

    // Update each bot's data
    const botIds = ['equi', 'pari', 'momo', 'sage'];
    botIds.forEach((botId, datasetIndex) => {
      state.chart.data.datasets[datasetIndex].data = framesToShow.map((f) => f.bots[botId]?.value || 100);
    });

    state.chart.update('none'); // No animation for smoother scrubbing

    // Show action vignettes if at an event frame
    const currentFrame = state.frames[frameIndex];
    if (currentFrame?.event) {
      showActionVignettes(currentFrame, frameIndex);
    } else {
      hideActionVignettes();
    }
  }

  /**
   * Highlight a specific bot's line in the chart
   * @param {string} botId - Bot identifier to highlight
   */
  function highlightBotInChart(botId) {
    if (!state.chart) return;

    const botIds = ['equi', 'pari', 'momo', 'sage'];
    const botIndex = botIds.indexOf(botId);
    if (botIndex === -1) return;

    state.chart.data.datasets.forEach((dataset, index) => {
      if (index === botIndex) {
        // Highlight selected bot
        dataset.borderWidth = 4;
        dataset.borderColor = CONFIG.BOT_COLORS[botIds[index]];
        dataset.backgroundColor = hexToRgba(CONFIG.BOT_COLORS[botIds[index]], 0.2);
      } else {
        // Dim other bots
        dataset.borderWidth = 1;
        dataset.borderColor = hexToRgba(CONFIG.BOT_COLORS[botIds[index]], 0.3);
        dataset.backgroundColor = hexToRgba(CONFIG.BOT_COLORS[botIds[index]], 0.05);
      }
    });

    state.chart.update('none');
  }

  /**
   * Reset chart highlighting to default state
   */
  function resetChartHighlight() {
    if (!state.chart) return;

    const botIds = ['equi', 'pari', 'momo', 'sage'];

    state.chart.data.datasets.forEach((dataset, index) => {
      dataset.borderWidth = 2;
      dataset.borderColor = CONFIG.BOT_COLORS[botIds[index]];
      dataset.backgroundColor = hexToRgba(CONFIG.BOT_COLORS[botIds[index]], 0.1);
    });

    state.chart.update('none');
  }

  // ═══════════════════════════════════════════════════════════════
  // Action Vignettes - Show bot buy/sell explanations
  // ═══════════════════════════════════════════════════════════════

  const BOT_ACTIONS_BY_EVENT = {
    crash: {
      equi: { action: 'HOLD', reason: { en: 'Discipline: maintain equal allocation', fr: 'Discipline : maintenir allocation égale' } },
      pari: { action: 'SELL', reason: { en: 'Reduce stocks, increase bonds (volatility rising)', fr: 'Réduire actions, augmenter obligations (volatilité haute)' } },
      momo: { action: 'SELL', reason: { en: 'Exit positions - trend reversed (late reaction)', fr: 'Sortie des positions - tendance inversée (réaction tardive)' } },
      sage: { action: 'SELL', reason: { en: 'Defensive shift to gold & bonds', fr: 'Passage défensif vers or & obligations' } },
    },
    recovery: {
      equi: { action: 'HOLD', reason: { en: 'Maintain allocation, benefit equally', fr: 'Maintenir allocation, bénéficier équitablement' } },
      pari: { action: 'BUY', reason: { en: 'Volatility normalizing, return to stocks', fr: 'Volatilité normale, retour aux actions' } },
      momo: { action: 'BUY', reason: { en: 'Positive momentum detected, entering positions', fr: 'Momentum positif détecté, entrée en position' } },
      sage: { action: 'HOLD', reason: { en: 'Cautious - wait for confirmation', fr: 'Prudent - attendre confirmation' } },
    },
    rally: {
      equi: { action: 'REBAL', reason: { en: 'Rebalance overweight stocks to equal', fr: 'Rééquilibrer actions surpondérées' } },
      pari: { action: 'HOLD', reason: { en: 'Risk balanced, maintain positions', fr: 'Risque équilibré, maintenir positions' } },
      momo: { action: 'BUY', reason: { en: 'Strong momentum - overweight trending assets', fr: 'Fort momentum - surpondérer actifs en tendance' } },
      sage: { action: 'HOLD', reason: { en: 'Keep protections despite euphoria', fr: 'Garder protections malgré euphorie' } },
    },
    volatility: {
      equi: { action: 'HOLD', reason: { en: 'Ignore volatility, stay the course', fr: 'Ignorer volatilité, rester discipliné' } },
      pari: { action: 'REBAL', reason: { en: 'Rebalance for equal risk contribution', fr: 'Rééquilibrer pour contribution risque égale' } },
      momo: { action: 'REDUCE', reason: { en: 'Mixed signals - reduce position sizes', fr: 'Signaux mixtes - réduire tailles positions' } },
      sage: { action: 'SELL', reason: { en: 'Increase defensive assets', fr: 'Augmenter actifs défensifs' } },
    },
    geopolitical: {
      equi: { action: 'HOLD', reason: { en: 'Events pass, strategy stays constant', fr: 'Événements passent, stratégie constante' } },
      pari: { action: 'REBAL', reason: { en: 'Adjust for increased volatility', fr: 'Ajuster pour volatilité accrue' } },
      momo: { action: 'BUY', reason: { en: 'Follow commodity spike momentum', fr: 'Suivre momentum matières premières' } },
      sage: { action: 'SELL', reason: { en: 'Flight to quality - gold & bonds', fr: 'Fuite vers qualité - or & obligations' } },
    },
    bear: {
      equi: { action: 'HOLD', reason: { en: 'No panic, discipline matters', fr: 'Pas de panique, discipline compte' } },
      pari: { action: 'HOLD', reason: { en: 'Already defensively positioned', fr: 'Déjà positionné défensivement' } },
      momo: { action: 'SELL', reason: { en: 'Few positive trends - switch defensive', fr: 'Peu de tendances positives - mode défensif' } },
      sage: { action: 'HOLD', reason: { en: 'Losses limited by caution', fr: 'Pertes limitées par prudence' } },
    },
    banking: {
      equi: { action: 'HOLD', reason: { en: 'Diversified, no sector overweight', fr: 'Diversifié, pas de surpondération sectorielle' } },
      pari: { action: 'REBAL', reason: { en: 'Monitor correlations closely', fr: 'Surveiller corrélations de près' } },
      momo: { action: 'SELL', reason: { en: 'Financial sector falling - exit', fr: 'Secteur financier chute - sortie' } },
      sage: { action: 'HOLD', reason: { en: 'Glad for existing caution', fr: 'Content de la prudence existante' } },
    },
    correction: {
      equi: { action: 'HOLD', reason: { en: 'Part of the game, no changes', fr: 'Fait partie du jeu, pas de changement' } },
      pari: { action: 'BUY', reason: { en: 'Auto-rebalance buys at lower prices', fr: 'Auto-rééquilibrage achète à bon prix' } },
      momo: { action: 'HOLD', reason: { en: 'Wait before re-entering (was fully exposed)', fr: 'Attendre avant réentrer (était exposé à 100%)' } },
      sage: { action: 'HOLD', reason: { en: 'Low equity exposure limits damage', fr: 'Faible exposition actions limite dégâts' } },
    },
  };

  const ACTION_COLORS = {
    BUY: '#10B981',    // Green
    SELL: '#EF4444',   // Red
    HOLD: '#6B7280',   // Gray
    REBAL: '#667eea',  // Violet
    REDUCE: '#F97316', // Orange
  };

  function showActionVignettes(frame, frameIndex) {
    const container = document.getElementById('actionVignettes');
    if (!container) return;

    const eventType = frame.event?.type;
    const actions = BOT_ACTIONS_BY_EVENT[eventType];

    if (!actions) {
      hideActionVignettes();
      return;
    }

    const lang = state.language;
    const eventLabel = frame.event.label[lang];
    const askWhyText = lang === 'fr' ? 'Demander' : 'Ask why';
    const chatIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

    let html = `
      <div class="vignettes-header">
        <span class="vignettes-title">${lang === 'fr' ? 'Actions des Bots' : 'Bot Actions'}</span>
        <span class="vignettes-event">${eventLabel}</span>
      </div>
      <div class="vignettes-grid">
    `;

    Object.entries(actions).forEach(([botId, { action, reason }]) => {
      const color = ACTION_COLORS[action] || '#6B7280';
      const botName = getBotName(botId);
      const askQuestion = lang === 'fr'
        ? `Pourquoi ${botName} a choisi ${action} pendant ${eventLabel} ?`
        : `Why did ${botName} choose ${action} during ${eventLabel}?`;

      html += `
        <div class="vignette-item" style="--action-color: ${color}; --bot-color: ${CONFIG.BOT_COLORS[botId]}">
          <div class="vignette-bot">
            <span class="vignette-avatar">${botId.charAt(0).toUpperCase()}</span>
            <span class="vignette-name">${botName}</span>
          </div>
          <div class="vignette-action">${action}</div>
          <div class="vignette-reason">${reason[lang]}</div>
          <button class="vignette-ask-btn" data-question="${askQuestion}">
            ${chatIcon} ${askWhyText}
          </button>
        </div>
      `;
    });

    html += '</div>';

    // Add proactive chatbot prompt
    const proactiveText = lang === 'fr'
      ? `<strong>Curieux ?</strong> Demandez-moi pourquoi chaque bot a réagi différemment à cet événement.`
      : `<strong>Curious?</strong> Ask me why each bot reacted differently to this event.`;
    const askBtnText = lang === 'fr' ? 'Poser une question' : 'Ask a question';
    const defaultQuestion = lang === 'fr'
      ? `Explique-moi les différentes réactions des bots pendant ${eventLabel}`
      : `Explain the different bot reactions during ${eventLabel}`;

    html += `
      <div class="proactive-prompt">
        <div class="proactive-prompt-content">
          <div class="proactive-prompt-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div class="proactive-prompt-text">${proactiveText}</div>
        </div>
        <button class="proactive-prompt-btn" data-question="${defaultQuestion}">
          ${askBtnText}
        </button>
      </div>
    `;

    container.innerHTML = html;
    container.classList.add('visible');

    // Add click handlers for vignette ask buttons
    container.querySelectorAll('.vignette-ask-btn, .proactive-prompt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const question = btn.dataset.question;
        if (question && window.chatSidePanel?.open) {
          window.chatSidePanel.open(question);
        }
      });
    });
  }

  function hideActionVignettes() {
    const container = document.getElementById('actionVignettes');
    if (container) {
      container.classList.remove('visible');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Controls
  // ═══════════════════════════════════════════════════════════════

  function initControls() {
    // Play/Pause button
    elements.playPauseBtn?.addEventListener('click', togglePlayback);

    // Speed button
    elements.speedBtn?.addEventListener('click', cycleSpeed);

    // Timeline slider
    elements.timelineSlider?.addEventListener('input', handleSliderInput);

    // Event buttons
    document.querySelectorAll('.event-btn').forEach((btn) => {
      btn.addEventListener('click', () => jumpToEvent(btn.dataset.event));
    });

    // Bot card click handlers - highlight bot in chart
    document.querySelectorAll('.arena-bot-card').forEach((card) => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        const botId = card.dataset.bot;
        if (!botId) return;

        // Toggle selection: if already selected, deselect; otherwise select
        if (state.selectedBot === botId) {
          state.selectedBot = null;
          // Remove active class from all cards
          document.querySelectorAll('.arena-bot-card').forEach((c) => c.classList.remove('active'));
          // Reset all chart lines to normal
          resetChartHighlight();
        } else {
          state.selectedBot = botId;
          // Update active class on cards
          document.querySelectorAll('.arena-bot-card').forEach((c) => {
            c.classList.toggle('active', c.dataset.bot === botId);
          });
          // Highlight selected bot in chart
          highlightBotInChart(botId);
        }
      });
    });

    // "Explain this trade" buttons - use event delegation since they're dynamically created
    document.addEventListener('click', (e) => {
      const askTradeBtn = e.target.closest('.ask-trade-btn');
      if (!askTradeBtn) return;

      e.preventDefault();
      const question = askTradeBtn.dataset.question;
      if (!question) return;

      // Build a full question with context
      const frame = state.frames[state.currentFrameIndex];
      const dateContext = frame ? formatMonthYearFull(frame.month, state.language) : '';
      const fullQuestion =
        state.language === 'fr'
          ? `Explique ce trade (${dateContext}) : ${question}`
          : `Explain this trade (${dateContext}): ${question}`;

      // Open chat panel and auto-submit the question
      if (window.chatSidePanel?.open) {
        window.chatSidePanel.open(fullQuestion);
      }
    });
  }

  function togglePlayback() {
    state.isPlaying = !state.isPlaying;

    // Update icons and button state
    if (elements.playIcon && elements.pauseIcon) {
      elements.playIcon.style.display = state.isPlaying ? 'none' : 'block';
      elements.pauseIcon.style.display = state.isPlaying ? 'block' : 'none';
    }

    // Toggle playing class for CSS styling (stops pulse animation)
    if (elements.playPauseBtn) {
      elements.playPauseBtn.classList.toggle('playing', state.isPlaying);

      // Add tap animation
      elements.playPauseBtn.classList.add('tapped');
      setTimeout(() => elements.playPauseBtn.classList.remove('tapped'), 150);
    }

    // Trigger haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    if (state.isPlaying) {
      startPlayback();
    } else {
      stopPlayback();
    }
  }

  function startPlayback() {
    if (state.playbackInterval) {
      clearInterval(state.playbackInterval);
    }

    const speed = CONFIG.PLAYBACK_SPEEDS[state.playbackSpeedIndex];
    const intervalMs = CONFIG.FRAME_INTERVAL_MS / speed;

    state.playbackInterval = setInterval(() => {
      if (state.currentFrameIndex < state.frames.length - 1) {
        updateFrame(state.currentFrameIndex + 1);
      } else {
        // Reached end, stop playback
        state.isPlaying = false;
        stopPlayback();
        if (elements.playIcon && elements.pauseIcon) {
          elements.playIcon.style.display = 'block';
          elements.pauseIcon.style.display = 'none';
        }
        // Remove playing class to restore pulse animation
        if (elements.playPauseBtn) {
          elements.playPauseBtn.classList.remove('playing');
        }
      }
    }, intervalMs);
  }

  function stopPlayback() {
    if (state.playbackInterval) {
      clearInterval(state.playbackInterval);
      state.playbackInterval = null;
    }
  }

  function cycleSpeed() {
    state.playbackSpeedIndex = (state.playbackSpeedIndex + 1) % CONFIG.PLAYBACK_SPEEDS.length;
    const speed = CONFIG.PLAYBACK_SPEEDS[state.playbackSpeedIndex];

    if (elements.speedBtn) {
      elements.speedBtn.textContent = `${speed}x`;
    }

    // Restart playback with new speed if currently playing
    if (state.isPlaying) {
      startPlayback();
    }
  }

  function handleSliderInput(e) {
    const frameIndex = parseInt(e.target.value, 10);
    updateFrame(frameIndex);

    // Trigger haptic feedback if supported (mobile)
    if ('vibrate' in navigator) {
      navigator.vibrate(5); // Light haptic feedback
    }

    // Pause playback when manually scrubbing
    if (state.isPlaying) {
      state.isPlaying = false;
      stopPlayback();
      if (elements.playIcon && elements.pauseIcon) {
        elements.playIcon.style.display = 'block';
        elements.pauseIcon.style.display = 'none';
      }
      // Remove playing class to restore pulse animation
      if (elements.playPauseBtn) {
        elements.playPauseBtn.classList.remove('playing');
      }
    }
  }

  function jumpToEvent(eventKey) {
    // Find frame matching the event month (format: YYYY-MM)
    const frameIndex = state.frames.findIndex((f) => f.month === eventKey);

    if (frameIndex !== -1) {
      updateFrame(frameIndex);

      // Update slider
      if (elements.timelineSlider) {
        elements.timelineSlider.value = frameIndex;
      }

      // Highlight the event button briefly
      document.querySelectorAll('.event-btn').forEach((btn) => {
        btn.classList.remove('active');
        if (btn.dataset.event === eventKey) {
          btn.classList.add('active');
          setTimeout(() => btn.classList.remove('active'), 2000);
        }
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Frame Updates
  // ═══════════════════════════════════════════════════════════════

  function updateFrame(frameIndex) {
    if (frameIndex < 0 || frameIndex >= state.frames.length) return;

    state.currentFrameIndex = frameIndex;
    const frame = state.frames[frameIndex];

    // Update slider position
    if (elements.timelineSlider) {
      elements.timelineSlider.value = frameIndex;
    }

    // Update current date display
    updateDateDisplay(frame);

    // Update chart
    updateChartData(frameIndex);

    // Update bot P&L values
    updateBotPnLs(frame);

    // Update bot dialogues
    updateBotDialogues(frame);

    // Update leaderboard
    updateLeaderboard(frame);

    // Update trade tape
    updateTradeTape(frame, frameIndex);

    // Seed chat with context hint on first load
    updateChatContextHint(frame);

    // Expose proactive prompt for last trade
    const lastTrade = frame.latestTradePrompt;
    if (lastTrade && window.chatSidePanel?.open) {
      const question =
        state.language === 'fr'
          ? `Voulez-vous expliquer ce trade ? ${lastTrade}`
          : `Want me to explain this trade? ${lastTrade}`;
      // Only append a gentle prompt without sending
      appendChatMessage(question, 'bot');
    }
  }

  function updateDateDisplay(frame) {
    if (!elements.currentDate) return;

    const date = formatMonthYearFull(frame.month, state.language);
    elements.currentDate.textContent = date;

    // Show event badge if there's an event this month
    if (frame.event) {
      const eventLabel =
        state.language === 'fr' ? frame.event.label.fr : frame.event.label.en;
      elements.currentDate.innerHTML = `${date} <span class="event-badge">${eventLabel}</span>`;
    }
  }

  function updateBotPnLs(frame) {
    Object.keys(frame.bots).forEach((botId) => {
      const element = elements.botPnls[botId];
      if (!element) return;

      const bot = frame.bots[botId];
      const pnl = bot.pnlPercent;
      const sign = pnl >= 0 ? '+' : '';

      element.textContent = `${sign}${pnl.toFixed(2)}%`;
      element.classList.remove('positive', 'negative');
      element.classList.add(pnl >= 0 ? 'positive' : 'negative');
    });
  }

  function updateBotDialogues(frame) {
    const dialogues = frame.dialogues;

    Object.keys(dialogues).forEach((botId) => {
      const element = elements.botDialogues[botId];
      if (!element) return;

      const dialogue = dialogues[botId];
      const text = state.language === 'fr' ? dialogue.fr : dialogue.en;

      // Use typing effect for a more engaging experience
      typeText(element, text);
    });
  }

  function updateLeaderboard(frame) {
    if (!elements.leaderboardList) return;

    // Sort bots by P&L
    const botRankings = Object.entries(frame.bots)
      .map(([botId, data]) => ({
        botId,
        name: getBotName(botId),
        color: CONFIG.BOT_COLORS[botId],
        initial: botId.charAt(0).toUpperCase(),
        pnl: data.pnlPercent,
      }))
      .sort((a, b) => b.pnl - a.pnl);

    // Check for position changes from previous leaderboard
    const previousRanks = {};
    state.previousLeaderboard.forEach((bot, idx) => {
      previousRanks[bot.botId] = idx + 1;
    });

    // Build leaderboard HTML with change indicators
    const html = botRankings
      .map((bot, index) => {
        const currentRank = index + 1;
        const previousRank = previousRanks[bot.botId];
        let changeClass = '';
        let changeIndicator = '';

        if (previousRank !== undefined && previousRank !== currentRank) {
          if (currentRank < previousRank) {
            changeClass = 'rank-up';
            changeIndicator = '<span class="rank-change up">&#9650;</span>';
          } else {
            changeClass = 'rank-down';
            changeIndicator = '<span class="rank-change down">&#9660;</span>';
          }
        }

        return `
      <div class="leaderboard-item ${index === 0 ? 'leader' : ''} ${changeClass}" data-rank="${currentRank}" data-bot="${bot.botId}">
        <div class="leaderboard-rank">${currentRank}${changeIndicator}</div>
        <div class="leaderboard-bot-info">
          <div class="leaderboard-bot-avatar" style="--bot-color: ${bot.color}">${bot.initial}</div>
          <span class="leaderboard-bot-name">${bot.name}</span>
        </div>
        <span class="leaderboard-pnl ${bot.pnl >= 0 ? 'positive' : 'negative'}">
          ${bot.pnl >= 0 ? '+' : ''}${bot.pnl.toFixed(2)}%
        </span>
      </div>
    `;
      })
      .join('');

    elements.leaderboardList.innerHTML = html;

    // Store current leaderboard for next comparison
    state.previousLeaderboard = [...botRankings];

    // Trigger highlight animation for changed positions
    requestAnimationFrame(() => {
      elements.leaderboardList.querySelectorAll('.rank-up, .rank-down').forEach((item) => {
        item.classList.add('highlight');
        setTimeout(() => item.classList.remove('highlight', 'rank-up', 'rank-down'), 600);
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // Trade Tape
  // ═══════════════════════════════════════════════════════════════

  const TRADE_ACTIONS = {
    equi: {
      rebalance: {
        en: 'Rebalancing to equal weights',
        fr: 'Rééquilibrage vers poids égaux',
      },
      buy: { en: 'Buying underweight assets', fr: 'Achat actifs sous-pondérés' },
      sell: { en: 'Selling overweight assets', fr: 'Vente actifs sur-pondérés' },
      hold: { en: 'Holding steady', fr: 'Maintien des positions' },
    },
    pari: {
      rebalance: {
        en: 'Adjusting risk parity weights',
        fr: 'Ajustement parité de risque',
      },
      defensive: {
        en: 'Shifting to defensive assets',
        fr: 'Passage en mode défensif',
      },
      aggressive: {
        en: 'Increasing risk exposure',
        fr: 'Augmentation exposition risque',
      },
      hold: { en: 'Maintaining risk balance', fr: 'Maintien équilibre risque' },
    },
    momo: {
      chase: { en: 'Chasing momentum signals', fr: 'Poursuite signaux momentum' },
      rotate: {
        en: 'Rotating to trending assets',
        fr: 'Rotation vers actifs en tendance',
      },
      exit: { en: 'Exiting weak performers', fr: 'Sortie des sous-performants' },
      hold: { en: 'Riding current trends', fr: 'Surf des tendances actuelles' },
    },
    sage: {
      adapt: { en: 'Adapting to market regime', fr: 'Adaptation au régime marché' },
      defensive: {
        en: 'Detecting bear regime',
        fr: 'Détection régime baissier',
      },
      aggressive: { en: 'Detecting bull regime', fr: 'Détection régime haussier' },
      rebalance: {
        en: 'Regime-aware rebalancing',
        fr: 'Rééquilibrage adaptatif',
      },
    },
  };

  // Emoji icons for assets in trade entries
  const ASSET_ICONS = {
    SPY: '🇺🇸',
    IEF: '📊',
    GLD: '🪙',
    EFA: '🌍',
    EEM: '🌏',
    VNQ: '🏠',
    CASH: '💵',
  };

  function updateTradeTape(frame, frameIndex) {
    if (!elements.tradeTape) return;

    // Generate trade entries based on frame data
    const trades = generateTradeEntries(frame, frameIndex);

    // Keep only the last 6 trades visible
    const maxTrades = 6;

    // Get existing entries
    const existingEntries = elements.tradeTape.querySelectorAll('.trade-entry');

    // Add new trade entries with slide-in animation
    trades.forEach((trade, idx) => {
      // Create trade entry element
      const entry = document.createElement('div');
      entry.className = `trade-entry trade-${trade.type} slide-in`;
      entry.innerHTML = `
        <div class="trade-bot">
          <span class="trade-bot-avatar" style="--bot-color: ${CONFIG.BOT_COLORS[trade.botId]}">${trade.botId.charAt(0).toUpperCase()}</span>
          <span class="trade-bot-name">${getBotName(trade.botId)}</span>
        </div>
        <div class="trade-action">${trade.action}</div>
        <div class="trade-details">
          ${trade.assets.map((a) => `<span class="trade-asset">${ASSET_ICONS[a] || ''} ${a}</span>`).join('')}
        </div>
        <div class="trade-pnl ${trade.pnl >= 0 ? 'positive' : 'negative'}">
          ${trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}%
        </div>
        <button class="ask-trade-btn" data-question="${getBotName(trade.botId)} ${trade.action} — ${trade.assets.join(', ')}">
          ${state.language === 'fr' ? 'Expliquer ce trade' : 'Explain this trade'}
        </button>
      `;

      // Insert at top (newest first)
      elements.tradeTape.insertBefore(entry, elements.tradeTape.firstChild);

      // Trigger reflow for animation
      entry.offsetHeight;
      entry.classList.add('visible');
    });

    // Remove excess entries (keep only maxTrades)
    const allEntries = elements.tradeTape.querySelectorAll('.trade-entry');
    if (allEntries.length > maxTrades) {
      for (let i = maxTrades; i < allEntries.length; i++) {
        allEntries[i].classList.add('slide-out');
        setTimeout(() => allEntries[i].remove(), 300);
      }
    }
  }

  function generateTradeEntries(frame, frameIndex) {
    const trades = [];
    const lang = state.language;

    // Only generate trades when there's significant movement or events
    const isEventFrame = !!frame.event;
    const prevFrame = frameIndex > 0 ? state.frames[frameIndex - 1] : null;

    Object.keys(frame.bots).forEach((botId) => {
      const bot = frame.bots[botId];
      const prevBot = prevFrame?.bots[botId];

      // Calculate P&L change from previous frame
      const pnlChange = prevBot ? bot.pnlPercent - prevBot.pnlPercent : bot.pnlPercent;

      // Determine trade action based on conditions
      let actionKey = 'hold';
      let tradeType = 'neutral';
      const assets = selectRandomAssets(2);

      if (isEventFrame) {
        // Event-driven trades
        const eventType = frame.event.type;
        if (eventType === 'crash') {
          actionKey = botId === 'pari' || botId === 'sage' ? 'defensive' : 'exit';
          tradeType = 'sell';
        } else if (eventType === 'recovery' || eventType === 'rally') {
          actionKey = botId === 'momo' ? 'chase' : 'aggressive';
          tradeType = 'buy';
        } else {
          actionKey = 'rebalance';
          tradeType = 'neutral';
        }
      } else if (Math.abs(pnlChange) > 2) {
        // Significant P&L movement triggers rebalancing
        actionKey = pnlChange > 0 ? 'buy' : 'sell';
        tradeType = pnlChange > 0 ? 'buy' : 'sell';

        // Bot-specific action selection
        if (botId === 'momo') {
          actionKey = pnlChange > 0 ? 'chase' : 'exit';
        } else if (botId === 'sage') {
          actionKey = 'adapt';
        } else if (botId === 'pari') {
          actionKey = pnlChange < 0 ? 'defensive' : 'rebalance';
        }
      } else if (frameIndex % 3 === 0) {
        // Regular rebalancing every few frames
        actionKey = botId === 'sage' ? 'adapt' : 'rebalance';
        tradeType = 'neutral';
      } else {
        // Skip if no significant activity
        return;
      }

      // Get action text
      const actions = TRADE_ACTIONS[botId];
      const actionText = actions[actionKey]?.[lang] || actions.hold[lang];

      trades.push({
        botId,
        type: tradeType,
        action: actionText,
        assets,
        pnl: pnlChange,
        timestamp: frame.month,
      });
    });

    // Shuffle and limit to 2 trades per frame to avoid overwhelming
    const finalTrades = shuffleArray(trades).slice(0, 2);
    if (finalTrades.length) {
      frame.latestTradePrompt = finalTrades
        .map((t) => `${getBotName(t.botId)} ${t.action}`)
        .join(' | ');
    }
    return finalTrades;
  }

  function selectRandomAssets(count) {
    const allAssets = ['SPY', 'IEF', 'GLD', 'EFA', 'EEM', 'VNQ'];
    return shuffleArray(allAssets).slice(0, count);
  }

  function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ═══════════════════════════════════════════════════════════════
  // Event Markers
  // ═══════════════════════════════════════════════════════════════

  function addEventMarkers() {
    if (!elements.eventMarkers || !state.timeline?.keyEvents) return;

    const totalFrames = state.frames.length;
    if (totalFrames === 0) return;

    state.timeline.keyEvents.forEach((event) => {
      const eventMonth = event.date.substring(0, 7);
      const frameIndex = state.frames.findIndex((f) => f.month === eventMonth);

      if (frameIndex === -1) return;

      const position = (frameIndex / (totalFrames - 1)) * 100;
      const label = state.language === 'fr' ? event.label.fr : event.label.en;

      const marker = document.createElement('div');
      marker.className = `event-marker event-${event.type}`;
      marker.style.left = `${position}%`;
      marker.title = label;
      marker.dataset.frameIndex = frameIndex;

      marker.addEventListener('click', () => {
        updateFrame(frameIndex);
        if (elements.timelineSlider) {
          elements.timelineSlider.value = frameIndex;
        }
      });

      elements.eventMarkers.appendChild(marker);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // Utility Functions
  // ═══════════════════════════════════════════════════════════════

  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function formatMonthYear(monthStr) {
    // monthStr format: YYYY-MM
    const [year, month] = monthStr.split('-');
    const monthNames =
      state.language === 'fr'
        ? ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return `${monthNames[parseInt(month, 10) - 1]} ${year.slice(2)}`;
  }

  function formatMonthYearFull(monthStr, lang) {
    const [year, month] = monthStr.split('-');
    const monthNames =
      lang === 'fr'
        ? [
            'Janvier',
            'Février',
            'Mars',
            'Avril',
            'Mai',
            'Juin',
            'Juillet',
            'Août',
            'Septembre',
            'Octobre',
            'Novembre',
            'Décembre',
          ]
        : [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
          ];

    return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
  }

  // Track active typing animations to cancel them when new ones start
  const activeTypingAnimations = new WeakMap();

  function typeText(element, text, speed = CONFIG.TYPING_SPEED_MS) {
    // Cancel any existing animation on this element
    const existingAnimation = activeTypingAnimations.get(element);
    if (existingAnimation) {
      existingAnimation.cancelled = true;
    }

    // Create animation state object
    const animationState = { cancelled: false };
    activeTypingAnimations.set(element, animationState);

    // Clear existing content
    element.innerHTML = '';

    let i = 0;
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    cursor.textContent = '|';

    element.appendChild(cursor);

    function type() {
      // Stop if animation was cancelled
      if (animationState.cancelled) return;

      // Safety check: ensure cursor is still a child of element
      if (!element.contains(cursor)) return;

      if (i < text.length) {
        element.insertBefore(document.createTextNode(text.charAt(i)), cursor);
        i++;
        setTimeout(type, speed);
      } else {
        // Remove cursor after typing
        setTimeout(() => {
          if (!animationState.cancelled && element.contains(cursor)) {
            cursor.remove();
          }
        }, 500);
      }
    }

    type();
  }

  // ═══════════════════════════════════════════════════════════════
  // Arena Chat UI (floating panel)
  // ═══════════════════════════════════════════════════════════════

  function initChat() {
    const { chatFab, chatPanel, chatOverlay, chatSend, chatInput, chatClose } = elements;
    if (!chatFab || !chatPanel) return;

    chatFab.addEventListener('click', () => chatPanel.classList.add('open'));
    chatOverlay?.addEventListener('click', () => chatPanel.classList.remove('open'));
    chatClose?.addEventListener('click', () => chatPanel.classList.remove('open'));
    chatSend?.addEventListener('click', handleChatSend);
    chatInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleChatSend();
    });

    // Quick ask buttons (optional data-ask-bot hooks)
    document.querySelectorAll('[data-ask-bot]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const botId = btn.dataset.askBot;
        const prompt =
          state.language === 'fr'
            ? `Pourquoi ${getBotName(botId)} a agi ainsi ?`
            : `Why did ${getBotName(botId)} act this way?`;
        setChatInput(prompt);
      });
    });

    // Render existing history if any
    if (elements.chatMessages && state.chatHistory.length) {
      state.chatHistory.forEach((h) => appendChatMessage(h.content, h.role === 'user' ? 'user' : 'bot'));
    }
  }

  function setChatInput(text) {
    if (elements.chatInput) {
      elements.chatInput.value = text;
      elements.chatInput.focus();
    }
  }

  function getCurrentFrameMetadata() {
    const frame = state.frames[state.currentFrameIndex];
    if (!frame) return {};
    const leaderboard = Object.entries(frame.bots)
      .map(([id, data]) => ({ id, pnl: data.pnlPercent }))
      .sort((a, b) => b.pnl - a.pnl)
      .map((b) => `${getBotName(b.id)} ${b.pnl.toFixed(2)}%`)
      .join(', ');

    return {
      page: 'education-arena',
      month: frame.month,
      event: frame.event?.label?.[state.language] || null,
      bots: frame.bots,
      leaderboard,
      language: state.language,
    };
  }

  function appendChatMessage(text, role = 'bot') {
    if (!elements.chatMessages) return;
    const div = document.createElement('div');
    div.className = `arena-chat-message ${role}`;
    div.innerHTML = `<span>${text}</span>`;
    elements.chatMessages.appendChild(div);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  }

  async function handleChatSend() {
    const text = elements.chatInput?.value?.trim();
    if (!text) return;
    appendChatMessage(text, 'user');
    pushHistory('user', text);
    if (elements.chatInput) elements.chatInput.value = '';

    const metadata = getCurrentFrameMetadata();
    const historyPayload = state.chatHistory.map((h) => ({ role: h.role, content: h.content }));
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: 'education-arena',
          lang: state.language,
          contextMetadata: metadata,
          history: historyPayload,
        }),
      });

      if (!res.ok || !res.body) {
        appendChatMessage(
          state.language === 'fr'
            ? "Désolé, je n'ai pas pu répondre. Réessayez."
            : "Sorry, I couldn't respond. Please try again."
        );
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let botMessage = '';
      const div = document.createElement('div');
      div.className = 'arena-chat-message bot';
      div.innerHTML = '<span></span>';
      const span = div.querySelector('span');
      elements.chatMessages.appendChild(div);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                botMessage += parsed.content;
                span.innerHTML = botMessage;
                elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
              }
            } catch {
              if (data) {
                botMessage += data;
                span.innerHTML = botMessage;
              }
            }
          }
        }
      }

      if (!botMessage) {
        span.innerHTML =
          state.language === 'fr'
            ? 'Posez-moi une question sur un trade ou un bot, je répondrai avec le contexte actuel.'
            : 'Ask me about a trade or bot and I will answer with current context.';
      }
      pushHistory('assistant', botMessage || span.innerText);
    } catch (error) {
      console.error('[Arena Chat] error', error);
      appendChatMessage(
        state.language === 'fr'
          ? 'Une erreur est survenue. Réessayez.'
          : 'Something went wrong. Please try again.'
      );
    }
  }

  function updateChatContextHint(frame) {
    if (!elements.chatMessages || elements.chatMessages.childElementCount) return;
    if (!frame) return;
    const hint =
      state.language === 'fr'
        ? `Vous regardez ${formatMonthYearFull(frame.month, 'fr')}. Demandez « Pourquoi ${getBotName('pari')} a vendu ? »`
        : `You are viewing ${formatMonthYearFull(frame.month, 'en')}. Ask "Why did ${getBotName('pari')} sell?"`;
    appendChatMessage(hint, 'bot');
  }

  function showError(message) {
    const container = document.querySelector('.arena-container');
    if (container) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'arena-error';
      errorDiv.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p>${message}</p>
      `;
      container.insertBefore(errorDiv, container.firstChild);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Initialize on DOM Ready
  // ═══════════════════════════════════════════════════════════════

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
