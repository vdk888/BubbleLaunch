/**
 * Pricing Workflow Demo - Interactive Animated Chat
 * Showcases the Japanese Stocks workflow with input field typing, portfolio visualization, and enriched content
 */

document.addEventListener('DOMContentLoaded', () => {
  const workflowTranslations =
    (typeof window !== "undefined" && window.translations) ||
    (typeof translations !== "undefined" ? translations : {});
  const DEMO_SHOWN_KEY = 'bubble_workflow_demo_shown';
  const DEMO_EXPERIENCE_KEY = 'demoExperience';
  const TIMING = {
    typeSpeed: {
      user: 32,
      botShort: 22,
      botNormal: 20,
      botComplex: 18
    },
    readingDelay: {
      base: 1400,
      maxDelay: 8000,
      enrichedBonus: 2200,
      wordsPerMinute: 220
    },
    responseDelay: 900,
    pauseCheck: 60,
    typingTick: 6
  };
  const SPEED_PRESETS = [
    { key: 'demo.speed.normal', multiplier: 1 },
    { key: 'demo.speed.fast', multiplier: 1.5 },
    { key: 'demo.speed.faster', multiplier: 2 }
  ];
  const DEMO_STEPS = {
    'macro-defense': 16,
    'japan-momentum': 17,
    'semiconductors-sortino': 15
  };

  // Track current scenario for routing
  let currentScenario = 'japan-momentum'; // default to intermediate demo
  const overlay = document.getElementById('workflow-demo-overlay');
  const closeBtn = document.getElementById('workflow-demo-close');
  const messagesContainer = document.getElementById('workflow-demo-messages');
  const pricingContent = document.getElementById('pricing-content');
  const replayBtn = document.getElementById('replay-demo');
  const inputField = document.querySelector('.workflow-demo-input-field');
  const sendButton = document.querySelector('.workflow-demo-send-button');
  const progressLabel = document.getElementById('workflow-demo-progress-label');
  const progressFill = document.getElementById('workflow-demo-progress-fill');
  const progressTrack = document.getElementById('workflow-demo-progress-track');
  const speedToggleButton = document.getElementById('demo-speed-toggle');
  const pauseToggleButton = document.getElementById('demo-pause-toggle');
  const skipButton = document.getElementById('demo-skip-toggle') ||
    document.querySelector('[data-demo-action="skip"]');
  const langToggleButton = document.getElementById('demo-lang-toggle');
  const langCurrentSpan = langToggleButton ? langToggleButton.querySelector('.lang-current') : null;
  const pausedIndicator = document.getElementById('workflow-demo-paused-indicator');

  const redirectEntryPoints = new Set([
    'dual_path_homepage',
    'homepage_dual_path',
    'homepage_hero',
    'homepage_direct',
    'hero_demo_cta',
  ]);

  const isOnInvestorsRoute = () => {
    const path = window.location.pathname;
    const frenchPrefix = '/investors';
    const englishPrefix = '/en/investors';

    return (
      path === frenchPrefix ||
      path === `${frenchPrefix}/` ||
      path.startsWith(`${frenchPrefix}/`) ||
      path === englishPrefix ||
      path === `${englishPrefix}/` ||
      path.startsWith(`${englishPrefix}/`)
    );
  };

  const isOnProfessionalsRoute = () => {
    const path = window.location.pathname;
    return (
      path.startsWith('/professionals') ||
      path.startsWith('/en/professionals')
    );
  };

  const getInvestorsIndexUrl = () =>
    document.documentElement.lang === 'en' ? '/en/investors' : '/investors';

  const getStoredDemoExperience = () => {
    try {
      const stored = sessionStorage.getItem(DEMO_EXPERIENCE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('[WorkflowDemo] Failed to parse stored demo experience', error);
      return null;
    }
  };

  const syncScenarioFromStoredExperience = () => {
    const storedExperience = getStoredDemoExperience();
    if (storedExperience && storedExperience.scenarioId) {
      currentScenario = storedExperience.scenarioId;
    }
  };

  syncScenarioFromStoredExperience();

  const shouldRedirectAfterDemo = () => {
    const entryPoint = sessionStorage.getItem('demoEntryPoint');
    if (!entryPoint || !redirectEntryPoints.has(entryPoint)) {
      return false;
    }
    // Never redirect if already on investors or professionals route
    if (isOnInvestorsRoute() || isOnProfessionalsRoute()) {
      return false;
    }
    return true;
  };

  const maybeRedirectAfterDemoClose = () => {
    if (!shouldRedirectAfterDemo()) {
      return;
    }
    window.location.href = getInvestorsIndexUrl();
  };

  // Get current language from URL or default
  let currentLanguage = window.location.pathname.includes('/en/') ||
                        window.location.pathname.startsWith('/en') ? 'en' : 'fr';

  // Demo control flags and timeouts
  let pendingTimeouts = [];
  let isAnimationRunning = false;
  let isPaused = false;
  let manualPaused = false;
  let hoverPaused = false;
  let isSkipping = false;
  let skipMode = false;
  let pendingSkipBotMessages = 0;
  let fastForwardTargetStep = null;
  let progressJumpPending = false;
  let isTypingBotMessage = false;
  let hasCompleted = false;
  let speedMultiplier = 1;
  let completedSteps = 0;
  let totalSteps = 0;
  let demoStartTime = null;
  let pausedAt = null;
  let pausedDuration = 0;
  let completionPanel = null;
  let memoryInitialized = false;

  // Update language display buttons
  const updateLanguageButtons = () => {
    if (!langToggleButton) return;
    const label = currentLanguage === 'en' ? 'EN' : 'FR';
    if (langCurrentSpan) {
      langCurrentSpan.textContent = label;
    } else {
      langToggleButton.textContent = label;
    }
    const toggleLabel = getTranslation('demo.control.language', 'Switch language');
    langToggleButton.setAttribute('aria-label', toggleLabel);
    langToggleButton.setAttribute('title', toggleLabel);
  };

  const getTranslation = (key, fallback = '') => {
    const entry = workflowTranslations[key];
    if (entry && entry[currentLanguage]) {
      return entry[currentLanguage];
    }
    if (entry && entry.en) {
      return entry.en;
    }
    return fallback;
  };

  const pauseIcons = {
    play: `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M8 5v14l11-7z"></path>
      </svg>
    `,
    pause: `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <line x1="9" y1="6" x2="9" y2="18"></line>
        <line x1="15" y1="6" x2="15" y2="18"></line>
      </svg>
    `
  };

  const updateSpeedControls = () => {
    if (speedToggleButton) {
      const preset = SPEED_PRESETS.find(item => item.multiplier === speedMultiplier) || SPEED_PRESETS[0];
      speedToggleButton.textContent = getTranslation(preset.key, `${preset.multiplier}x`);
      const speedLabel = getTranslation('demo.control.speed', 'Playback speed');
      speedToggleButton.setAttribute('aria-label', speedLabel);
      speedToggleButton.setAttribute('title', speedLabel);
    }
    updateSkipControl();
  };

  const updateSkipControl = () => {
    if (!skipButton) return;
    const label = getTranslation('demo.speed.skip', 'Skip');
    skipButton.setAttribute('aria-label', label);
    skipButton.setAttribute('title', label);
  };

  const updatePauseControl = () => {
    if (!pauseToggleButton) return;
    const isPausedState = isPaused;
    const labelKey = isPausedState ? 'demo.control.play' : 'demo.control.pause';
    const fallback = isPausedState ? 'Play' : 'Pause';
    const label = getTranslation(labelKey, fallback);
    pauseToggleButton.innerHTML = isPausedState ? pauseIcons.play : pauseIcons.pause;
    pauseToggleButton.setAttribute('aria-label', label);
    pauseToggleButton.setAttribute('title', label);
    pauseToggleButton.setAttribute('aria-pressed', isPausedState ? 'true' : 'false');
    pauseToggleButton.disabled = !isAnimationRunning;
    pauseToggleButton.classList.toggle('active', isPausedState);
  };

  const updatePausedIndicator = () => {
    if (!pausedIndicator) return;
    pausedIndicator.textContent = getTranslation('demo.pause.indicator', 'Paused - tap to continue');
  };

  const updateDemoUILabels = () => {
    updateLanguageButtons();
    updateSpeedControls();
    updatePausedIndicator();
    updatePauseControl();
    if (completionPanel && !completionPanel.classList.contains('hidden')) {
      renderCompletionPanel();
    }
  };

  updateDemoUILabels();

  const shouldRunDemo = () => isAnimationRunning && !isSkipping;

  const updateProgress = (ratio) => {
    if (!progressLabel || !progressFill) return;
    const percentage = Math.max(0, Math.min(100, Math.round(ratio * 100)));
    progressLabel.textContent = `${percentage}%`;
    progressFill.style.width = `${percentage}%`;
  };

  const resetProgress = () => {
    totalSteps = DEMO_STEPS[currentScenario] || 0;
    completedSteps = 0;
    updateProgress(0);
  };

  const advanceProgress = () => {
    if (!shouldRunDemo() || totalSteps === 0) return;
    completedSteps = Math.min(totalSteps, completedSteps + 1);
    updateProgress(completedSteps / totalSteps);
    if (fastForwardTargetStep !== null && completedSteps >= fastForwardTargetStep) {
      fastForwardTargetStep = null;
      pendingSkipBotMessages = 0;
      setSkipMode(false);
    }
  };

  const setSpeedMultiplier = (multiplier) => {
    speedMultiplier = multiplier;
    updateSpeedControls();
  };

  const getAdjustedDelay = (ms) => {
    if (skipMode) return 0;
    return Math.max(0, Math.round(ms / speedMultiplier));
  };

  const applyPauseState = () => {
    const shouldPause = (manualPaused || hoverPaused) && !skipMode;
    if (!isAnimationRunning && isPaused) {
      isPaused = false;
    }
    if (shouldPause === isPaused) return;
    isPaused = shouldPause;
    if (isPaused) {
      pausedAt = Date.now();
      if (pausedIndicator && manualPaused) {
        pausedIndicator.classList.add('visible');
      }
      if (overlay) {
        overlay.classList.add('paused');
      }
    } else {
      if (pausedAt) {
        pausedDuration += Date.now() - pausedAt;
        pausedAt = null;
      }
      if (pausedIndicator) {
        pausedIndicator.classList.remove('visible');
      }
      if (overlay) {
        overlay.classList.remove('paused');
      }
    }
    updatePauseControl();
  };

  const setManualPaused = (paused) => {
    if (!isAnimationRunning) return;
    manualPaused = paused;
    applyPauseState();
  };

  const toggleManualPause = () => {
    setManualPaused(!manualPaused);
  };

  const setHoverPaused = (paused) => {
    if (!isAnimationRunning) return;
    hoverPaused = paused;
    applyPauseState();
  };

  const setSkipMode = (enabled) => {
    skipMode = enabled;
    if (skipMode) {
      manualPaused = false;
      hoverPaused = false;
    }
    applyPauseState();
  };

  const getBubbleMemory = () => {
    if (typeof BubbleAgentMemory === 'undefined') {
      return null;
    }
    if (!memoryInitialized) {
      try {
        BubbleAgentMemory.getProfile();
      } catch (error) {
        try {
          BubbleAgentMemory.init();
        } catch (initError) {
          console.warn('[WorkflowDemo] BubbleAgentMemory init failed:', initError);
          return null;
        }
      }
      memoryInitialized = true;
    }
    return BubbleAgentMemory;
  };

  const getLevelFromScenario = (scenarioId) => {
    switch (scenarioId) {
      case 'macro-defense':
        return 'beginner';
      case 'semiconductors-sortino':
        return 'expert';
      case 'japan-momentum':
      default:
        return 'intermediate';
    }
  };

  const getActiveLevel = () => {
    const experience = getStoredDemoExperience();
    if (experience && experience.level) {
      return experience.level;
    }
    return getLevelFromScenario(currentScenario);
  };

  const getCompletionConfig = (level) => {
    const waitlistHref = `${getInvestorsIndexUrl()}#investor-waitlist`;
    const playgroundHref = currentLanguage === 'en'
      ? '/en/investors/playground'
      : '/investors/playground';
    const simulatorHref = currentLanguage === 'en'
      ? '/en/investors/education/simulator'
      : '/investors/education/simulator';

    const configByLevel = {
      beginner: {
        primaryText: getTranslation('demo.complete.cta.beginner', 'Discover my investor profile'),
        primaryHref: playgroundHref,
        hint: getTranslation('demo.complete.hint.beginner', 'Start with a profile walkthrough to personalize your strategy.')
      },
      intermediate: {
        primaryText: getTranslation('demo.complete.cta.intermediate', 'Test strategies'),
        primaryHref: simulatorHref,
        hint: getTranslation('demo.complete.hint.intermediate', 'Try the simulator to compare allocations and risk levels.')
      },
      expert: {
        primaryText: getTranslation('demo.complete.cta.expert', 'Get priority access'),
        primaryHref: waitlistHref,
        hint: getTranslation('demo.complete.hint.expert', 'Get priority access to discuss deployment details.')
      }
    };

    return configByLevel[level] || configByLevel.intermediate;
  };

  function renderCompletionPanel() {
    if (!messagesContainer) return;
    const level = getActiveLevel();
    const config = getCompletionConfig(level);
    const titleText = getTranslation('demo.complete.title', 'Demo Complete!');
    const waitlistText = getTranslation('demo.complete.waitlist', 'Waitlist');
    const replayText = getTranslation('demo.complete.replay', 'Replay Demo');
    const waitlistHref = `${getInvestorsIndexUrl()}#investor-waitlist`;

    if (!completionPanel) {
      completionPanel = document.createElement('div');
      completionPanel.className = 'workflow-demo-completion-panel hidden';
      messagesContainer.appendChild(completionPanel);
    }

    completionPanel.replaceChildren();
    completionPanel.dataset.level = level;

    const icon = document.createElement('div');
    icon.className = 'workflow-demo-completion-icon';
    icon.innerHTML = `
      <svg class="workflow-demo-completion-check" viewBox="0 0 52 52" aria-hidden="true">
        <circle class="workflow-demo-completion-circle" cx="26" cy="26" r="25" fill="none"></circle>
        <path class="workflow-demo-completion-mark" fill="none" d="M14 27l7 7 17-17"></path>
      </svg>
    `;

    const title = document.createElement('div');
    title.className = 'workflow-demo-completion-title';
    title.textContent = titleText;

    const hint = document.createElement('div');
    hint.className = 'workflow-demo-completion-hint';
    hint.textContent = config.hint;

    const actions = document.createElement('div');
    actions.className = 'workflow-demo-completion-actions';

    const primary = document.createElement('a');
    primary.className = 'workflow-demo-cta primary';
    primary.href = config.primaryHref;
    primary.textContent = config.primaryText;
    primary.setAttribute('data-demo-action', 'primary-cta');

    const secondaryRow = document.createElement('div');
    secondaryRow.className = 'workflow-demo-completion-secondary';

    const waitlist = document.createElement('a');
    waitlist.className = 'workflow-demo-cta secondary';
    waitlist.href = waitlistHref;
    waitlist.textContent = waitlistText;

    const replay = document.createElement('button');
    replay.className = 'workflow-demo-cta ghost';
    replay.type = 'button';
    replay.textContent = replayText;
    replay.setAttribute('data-demo-action', 'replay');

    secondaryRow.appendChild(waitlist);
    secondaryRow.appendChild(replay);

    actions.appendChild(primary);
    actions.appendChild(secondaryRow);

    completionPanel.appendChild(icon);
    completionPanel.appendChild(title);
    completionPanel.appendChild(hint);
    completionPanel.appendChild(actions);
  }

  const recordDemoCompletion = (reason) => {
    const Memory = getBubbleMemory();
    if (!Memory) return;

    const level = getActiveLevel();
    const scenario = currentScenario;
    const durationMs = demoStartTime
      ? Math.max(0, Date.now() - demoStartTime - pausedDuration)
      : null;

    Memory.recordAction('demo_completed', {
      scenario,
      level,
      durationMs,
      speedMultiplier,
      reason
    });

    const profile = Memory.getProfile();
    if (!profile.knowledgeLevel) {
      const mappedLevel = level === 'expert' ? 'advanced' : level;
      Memory.setKnowledgeLevel(mappedLevel);
    }

    const insightKey = `demo.complete.insight.${level}`;
    const insightText = getTranslation(
      insightKey,
      'User showed interest in a personalized investing workflow.'
    );
    Memory.addKeyInsight(insightText, 'demo');
  };

  const finishDemo = (reason = 'completed') => {
    if (hasCompleted) return;
    hasCompleted = true;
    isSkipping = reason === 'skipped';
    fastForwardTargetStep = null;
    pendingSkipBotMessages = 0;
    progressJumpPending = false;
    isAnimationRunning = false;
    manualPaused = false;
    hoverPaused = false;
    if (pausedAt) {
      pausedDuration += Date.now() - pausedAt;
      pausedAt = null;
    }
    isPaused = false;
    setSkipMode(false);
    pendingTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    pendingTimeouts = [];
    if (pausedIndicator) {
      pausedIndicator.classList.remove('visible');
    }
    if (overlay) {
      overlay.classList.remove('paused');
    }

    updateProgress(1);
    renderCompletionPanel();
    if (completionPanel && messagesContainer) {
      completionPanel.classList.remove('hidden');
      messagesContainer.appendChild(completionPanel);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    sessionStorage.setItem(DEMO_SHOWN_KEY, 'true');
    recordDemoCompletion(reason);
  };

  const startDemoRun = () => {
    isAnimationRunning = true;
    isSkipping = false;
    hasCompleted = false;
    manualPaused = false;
    hoverPaused = false;
    isPaused = false;
    pausedAt = null;
    pausedDuration = 0;
    demoStartTime = Date.now();
    resetProgress();
    if (completionPanel) {
      completionPanel.remove();
      completionPanel = null;
    }
    if (pausedIndicator) {
      pausedIndicator.classList.remove('visible');
    }
    if (overlay) {
      overlay.classList.remove('paused');
    }
    pendingSkipBotMessages = 0;
    if (progressJumpPending && fastForwardTargetStep !== null && fastForwardTargetStep > 0) {
      setSkipMode(true);
    } else {
      fastForwardTargetStep = null;
      setSkipMode(false);
    }
    progressJumpPending = false;
    updateSpeedControls();
    updatePauseControl();
  };

  const confirmSkip = () => {
    const message = getTranslation(
      'demo.skip.confirm',
      'Skip the demo and jump to next steps?'
    );
    return window.confirm(message);
  };

  const skipDemo = (reason = 'skipped') => {
    if (hasCompleted) return;
    finishDemo(reason);
  };

  const skipToNextBotMessage = () => {
    if (!isAnimationRunning || hasCompleted) return;
    fastForwardTargetStep = null;
    progressJumpPending = false;
    const skipCount = isTypingBotMessage ? 2 : 1;
    pendingSkipBotMessages = Math.max(pendingSkipBotMessages, skipCount);
    setSkipMode(true);
  };

  const getSpeedIndex = () => {
    return SPEED_PRESETS.findIndex(item => item.multiplier === speedMultiplier);
  };

  const stepSpeed = (direction) => {
    const index = getSpeedIndex();
    if (index === -1) return;
    const nextIndex = Math.min(
      SPEED_PRESETS.length - 1,
      Math.max(0, index + direction)
    );
    const next = SPEED_PRESETS[nextIndex];
    if (next && next.multiplier !== speedMultiplier) {
      setSpeedMultiplier(next.multiplier);
    }
  };

  const jumpToProgressStep = (event) => {
    if (!isAnimationRunning || !progressTrack || totalSteps === 0) return;
    const rect = progressTrack.getBoundingClientRect();
    if (!rect.width) return;
    const rawRatio = (event.clientX - rect.left) / rect.width;
    const ratio = Math.max(0, Math.min(1, rawRatio));
    const targetStep = Math.max(0, Math.min(totalSteps, Math.round(ratio * totalSteps)));

    if (targetStep === completedSteps) return;

    fastForwardTargetStep = targetStep;
    pendingSkipBotMessages = 0;

    if (targetStep <= 0) {
      fastForwardTargetStep = null;
      progressJumpPending = true;
      routeDemo();
      return;
    }

    if (targetStep < completedSteps) {
      progressJumpPending = true;
      routeDemo();
    } else {
      setSkipMode(true);
    }
  };

  // Cancel all pending animations and timeouts
  const cancelAnimations = () => {
    isAnimationRunning = false;
    isSkipping = false;
    skipMode = false;
    pendingTimeouts = pendingTimeouts.filter(timeoutId => {
      clearTimeout(timeoutId);
      return false;
    });
    pendingSkipBotMessages = 0;
    hasCompleted = false;
    manualPaused = false;
    hoverPaused = false;
    isPaused = false;
    pausedAt = null;
    pausedDuration = 0;
    pendingTimeouts = [];
    if (inputField) inputField.value = '';
    if (pausedIndicator) {
      pausedIndicator.classList.remove('visible');
    }
    if (overlay) {
      overlay.classList.remove('paused');
    }
    if (completionPanel) {
      completionPanel.remove();
      completionPanel = null;
    }
    updateProgress(0);
    updatePauseControl();
  };

  // Wrapped setTimeout that tracks timeouts for cancellation
  const safeSetTimeout = (callback, delay) => {
    const timeoutId = setTimeout(() => {
      if (isAnimationRunning) {
        callback();
      }
      pendingTimeouts = pendingTimeouts.filter(id => id !== timeoutId);
    }, delay);
    pendingTimeouts.push(timeoutId);
    return timeoutId;
  };

  // Wrapped Promise.resolve for delays that respects cancellation
  const safeDelay = (ms, options = {}) => {
    return new Promise((resolve) => {
      if (!shouldRunDemo()) {
        resolve();
        return;
      }
      if (skipMode) {
        resolve();
        return;
      }
      const tickMs = options.tickMs || TIMING.pauseCheck;
      let elapsed = 0;
      const tick = () => {
        if (!shouldRunDemo()) {
          resolve();
          return;
        }
        if (skipMode) {
          resolve();
          return;
        }
        if (!isPaused) {
          elapsed += tickMs * speedMultiplier;
        }
        if (elapsed >= ms) {
          resolve();
          return;
        }
        safeSetTimeout(tick, tickMs);
      };
      safeSetTimeout(tick, tickMs);
    });
  };

  // Calculate dynamic reading delay based on content length and complexity
  const calculateReadingDelay = (content, hasEnrichedContent = false) => {
    const baseDelay = TIMING.readingDelay.base;
    const wordsPerMinute = TIMING.readingDelay.wordsPerMinute;
    const wordCount = content ? content.split(/\s+/).length : 0;
    const readingTime = (wordCount / wordsPerMinute) * 60 * 1000;

    // Add extra time for enriched content (cards, charts, tables)
    // More time for complex content with multiple cards/graphs
    const enrichedBonus = hasEnrichedContent ? TIMING.readingDelay.enrichedBonus : 0;

    // Minimum 2.5s, maximum 10s for really long/complex messages
    return Math.min(
      Math.max(baseDelay, readingTime + enrichedBonus),
      TIMING.readingDelay.maxDelay
    );
  };

  // Auto-resize textarea as content grows
  const autoResizeTextarea = () => {
    if (!inputField) return;
    inputField.style.height = 'auto';
    inputField.style.height = Math.min(inputField.scrollHeight, 120) + 'px';
  };

  const resolveBotTypingSpeed = (text, speedOverride) => {
    const length = text ? text.length : 0;
    let speed = TIMING.typeSpeed.botNormal;
    if (length <= 80) {
      speed = TIMING.typeSpeed.botShort;
    } else if (length > 180) {
      speed = TIMING.typeSpeed.botComplex;
    }
    if (typeof speedOverride === 'number') {
      if (speedOverride >= 65) {
        speed = Math.max(14, speed - 2);
      } else if (speedOverride <= 35) {
        speed = speed + 2;
      }
    }
    return speed;
  };

  // Type in input field, animate send button, then show message as user
  const typeInInputAndSend = async (text) => {
    if (!inputField || !sendButton || !isAnimationRunning) return;
    if (skipMode) {
      inputField.value = '';
      autoResizeTextarea();
      return;
    }

    // Type character by character in textarea
    inputField.value = '';
    autoResizeTextarea();

    const typingSpeed = TIMING.typeSpeed.user;

    for (let i = 0; i < text.length; i++) {
      if (!shouldRunDemo()) break; // Stop if animation was cancelled
      inputField.value += text.charAt(i);
      autoResizeTextarea(); // Resize as text is added
      await safeDelay(typingSpeed, { tickMs: TIMING.typingTick });
    }

    if (!shouldRunDemo()) return;

    // Wait briefly
    await safeDelay(500);

    if (!shouldRunDemo()) return;

    // Animate send button
    sendButton.classList.add('sending');
    await safeDelay(600);
    sendButton.classList.remove('sending');

    if (!shouldRunDemo()) return;

    // Clear input and reset height
    inputField.value = '';
    autoResizeTextarea();

    // Small delay before message appears
    await safeDelay(200);
  };

  // Add system message (time transition)
  const addSystemMessage = (text) => {
    const systemDiv = document.createElement('div');
    systemDiv.className = 'workflow-demo-system-message';

    const content = document.createElement('div');
    content.className = 'workflow-demo-system-message-content';
    content.textContent = text;

    systemDiv.appendChild(content);
    if (shouldRunDemo() && messagesContainer) {
      messagesContainer.appendChild(systemDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      advanceProgress();
    }

    return systemDiv;
  };

  // Typing animation function
  const typeMessage = async (element, text, speedOverride = null) => {
    if (!element || !text) return;
    if (!shouldRunDemo()) return;

    isTypingBotMessage = true;
    try {
      if (skipMode) {
        element.innerHTML = '';
        const textDiv = document.createElement('div');
        textDiv.textContent = text;
        element.appendChild(textDiv);
        return;
      }

      let index = 0;
      element.innerHTML = '';
      const cursor = document.createElement('span');
      cursor.className = 'typing-cursor';
      element.appendChild(cursor);

      const typingSpeed = resolveBotTypingSpeed(text, speedOverride);

      while (index < text.length) {
        if (!shouldRunDemo()) break;
        if (skipMode) {
          element.innerHTML = '';
          const textDiv = document.createElement('div');
          textDiv.textContent = text;
          element.appendChild(textDiv);
          break;
        }
        element.insertBefore(document.createTextNode(text.charAt(index)), cursor);
        index++;
        await safeDelay(typingSpeed, { tickMs: TIMING.typingTick });
      }

      if (cursor && cursor.parentNode) {
        cursor.remove();
      }

      // Collect all text nodes and consolidate them into a text-content div
      const textDiv = document.createElement('div');
      let textContent = '';
      const nodesToRemove = [];

      for (let node of element.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          textContent += node.textContent;
          nodesToRemove.push(node);
        }
      }

      // Remove individual text nodes
      nodesToRemove.forEach(node => node.remove());

      // Add consolidated text as the first child
      if (textContent) {
        textDiv.textContent = textContent;
        element.insertBefore(textDiv, element.firstChild);
      }
    } finally {
      isTypingBotMessage = false;
      if (skipMode && pendingSkipBotMessages > 0) {
        pendingSkipBotMessages -= 1;
        if (pendingSkipBotMessages === 0 && fastForwardTargetStep === null) {
          setSkipMode(false);
        }
      }
    }
  };

  // Create typing indicator
  const createTypingIndicator = () => {
    const indicator = document.createElement('div');
    indicator.className = 'workflow-demo-typing-indicator';
    indicator.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;
    return indicator;
  };

  // Add message to chat
  const addMessage = (text, isUser = false, enrichedContent = null) => {
    const messageDiv = document.createElement('div');
    messageDiv.className = `workflow-demo-message ${isUser ? 'user' : 'bot'}`;

    const bubble = document.createElement('div');
    bubble.className = 'workflow-demo-message-bubble';

    // Set text if provided
    if (text) {
      bubble.textContent = text;
    }

    messageDiv.appendChild(bubble);

    if (enrichedContent) {
      messageDiv.appendChild(enrichedContent);
    }

    if (shouldRunDemo() && messagesContainer) {
      messagesContainer.appendChild(messageDiv);

      // Auto-scroll to bottom
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 80);
      advanceProgress();
    }

    return { messageDiv, bubble };
  };

  // Create enriched research content (inline, not separate card)
  const createResearchContent = () => {
    const container = document.createElement('div');

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['workflow.message2.bot.research'][currentLanguage];
    container.appendChild(header);

    const stocks = workflowTranslations['workflow.message2.bot.stocks'];
    const list = document.createElement('div');
    list.className = 'workflow-demo-research-list';

    stocks.forEach(stock => {
      const item = document.createElement('div');
      item.className = 'workflow-demo-research-item';
      item.textContent = `${stock.name} (${stock.ticker})`;
      list.appendChild(item);
    });

    container.appendChild(list);
    return container;
  };

  // Create backtest metrics card
  const createBacktestCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['workflow.message4.bot.header'][currentLanguage];
    card.appendChild(header);

    const strategy = document.createElement('div');
    strategy.style.fontWeight = '600';
    strategy.style.color = '#6666ff';
    strategy.style.marginTop = '0.4rem';
    strategy.textContent = workflowTranslations['workflow.message4.bot.strategy'][currentLanguage];
    card.appendChild(strategy);

    const details = document.createElement('div');
    details.style.fontSize = '0.85rem';
    details.style.color = '#444444';
    details.style.marginTop = '0.3rem';
    details.style.lineHeight = '1.6';
    details.textContent = workflowTranslations['workflow.message4.bot.details'][currentLanguage];
    card.appendChild(details);

    const metricsHeader = document.createElement('div');
    metricsHeader.style.fontWeight = '600';
    metricsHeader.style.color = '#333333';
    metricsHeader.style.marginTop = '0.5rem';
    metricsHeader.textContent = workflowTranslations['workflow.message4.bot.metrics_header'][currentLanguage];
    card.appendChild(metricsHeader);

    const metricsData = workflowTranslations['workflow.message4.bot.metrics'];
    const table = document.createElement('table');
    table.className = 'workflow-demo-metrics-table';

    const rows = [
      {
        label: metricsData.annualized_return[currentLanguage],
        value: metricsData.return_value
      },
      {
        label: metricsData.volatility[currentLanguage],
        value: metricsData.volatility_value
      },
      {
        label: metricsData.sortino_ratio[currentLanguage],
        value: metricsData.sortino_value
      },
      {
        label: metricsData.max_drawdown[currentLanguage],
        value: `${metricsData.max_drawdown_value} (${metricsData.topix_comparison[currentLanguage]})`
      }
    ];

    rows.forEach(row => {
      const tr = document.createElement('tr');
      const tdLabel = document.createElement('td');
      tdLabel.textContent = row.label;
      const tdValue = document.createElement('td');
      tdValue.textContent = row.value;
      tr.appendChild(tdLabel);
      tr.appendChild(tdValue);
      table.appendChild(tr);
    });

    card.appendChild(table);
    return card;
  };

  // Create summary card
  const createSummaryCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.innerHTML = '✓ ' + workflowTranslations['workflow.message6.bot.summary_header'][currentLanguage];
    card.appendChild(header);

    const summary = workflowTranslations['workflow.message6.bot.summary'];
    const items = [
      { label: summary.name[currentLanguage], value: summary.name_value[currentLanguage] },
      { label: summary.allocation[currentLanguage], value: summary.allocation_value },
      { label: summary.strategy[currentLanguage], value: summary.strategy_value[currentLanguage] },
      { label: summary.rebalancing[currentLanguage], value: summary.rebalancing_value[currentLanguage] },
      { label: summary.activation[currentLanguage], value: summary.activation_value[currentLanguage] }
    ];

    items.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.style.padding = '0.3rem 0';
      itemDiv.style.borderBottom = '1px solid rgba(102, 126, 234, 0.1)';
      itemDiv.style.fontSize = '0.85rem';

      const label = document.createElement('strong');
      label.style.color = '#333333';
      label.textContent = item.label + ': ';

      const value = document.createElement('span');
      value.style.color = '#666666';
      value.textContent = item.value;

      itemDiv.appendChild(label);
      itemDiv.appendChild(value);
      card.appendChild(itemDiv);
    });

    return card;
  };

  // Create portfolio bar chart
  const createPortfolioBarChart = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['workflow.message9.bot.portfolio_header'][currentLanguage];
    card.appendChild(header);

    const allocHeader = document.createElement('div');
    allocHeader.style.fontSize = '0.85rem';
    allocHeader.style.fontWeight = '600';
    allocHeader.style.color = '#333333';
    allocHeader.style.marginTop = '0.4rem';
    allocHeader.style.marginBottom = '0.4rem';
    allocHeader.textContent = workflowTranslations['workflow.message9.bot.allocations'][currentLanguage];
    card.appendChild(allocHeader);

    const chartContainer = document.createElement('div');
    chartContainer.className = 'workflow-demo-bar-chart';

    const portfolioData = workflowTranslations['workflow.message9.bot.portfolio_items'];

    portfolioData.forEach((item, index) => {
      const barItem = document.createElement('div');
      barItem.className = 'portfolio-bar-item';

      // Label
      const label = document.createElement('div');
      label.className = 'portfolio-bar-label';
      label.innerHTML = `${item.flag} ${item.name[currentLanguage]}`;

      if (item.new) {
        const badge = document.createElement('span');
        badge.className = 'portfolio-bar-new-badge';
        badge.textContent = workflowTranslations['workflow.message9.bot.new_pocket'][currentLanguage];
        label.appendChild(badge);
      }

      barItem.appendChild(label);

      // Bar wrapper
      const barWrapper = document.createElement('div');
      barWrapper.className = 'portfolio-bar-wrapper';

      // Bar fill
      const barFill = document.createElement('div');
      barFill.className = `portfolio-bar-fill ${item.highlight ? 'highlight' : ''} animating`;
      barFill.style.width = '0%';
      barFill.dataset.targetWidth = item.percentage;

      // Value label
      const barValue = document.createElement('span');
      barValue.className = 'portfolio-bar-value';
      barValue.textContent = item.percentage;

      barWrapper.appendChild(barFill);
      barWrapper.appendChild(barValue);
      barItem.appendChild(barWrapper);
      chartContainer.appendChild(barItem);

      // Animate bars after a delay (stagger effect)
      safeSetTimeout(() => {
        if (!shouldRunDemo()) return;
        barFill.style.width = item.percentage;
        barFill.classList.remove('animating');
      }, getAdjustedDelay(100 + (index * 80)));
    });

    card.appendChild(chartContainer);
    return card;
  };

  // Intermediate Demo Sequence (Japan Momentum - Legacy)
  const runIntermediateDemo = async () => {
    messagesContainer.innerHTML = '';

    // Message 1: User
    const msg1Text = workflowTranslations['workflow.message1.user'][currentLanguage];
    await typeInInputAndSend(msg1Text);
    const { bubble: bubble1 } = addMessage(msg1Text, true);
    await safeDelay(TIMING.responseDelay);

    // Message 2: Bot with research (all in one bubble)
    const msg2IntroText = workflowTranslations['workflow.message2.bot.intro'][currentLanguage];
    const { messageDiv: msg2Div, bubble: msg2Bubble } = addMessage('', false);

    const typingIndicator = createTypingIndicator();
    msg2Div.insertBefore(typingIndicator, msg2Bubble.nextSibling);
    await safeDelay(TIMING.responseDelay);
    typingIndicator.remove();

    // Type intro text
    await typeMessage(msg2Bubble, msg2IntroText, 50);

    // Add line break and research content
    msg2Bubble.appendChild(document.createElement('br'));
    const researchContent = createResearchContent();
    msg2Bubble.appendChild(researchContent);

    // Add closing text
    msg2Bubble.appendChild(document.createElement('br'));
    const msg2ClosingText = workflowTranslations['workflow.message2.bot.closing'][currentLanguage];
    const closingSpan = document.createElement('span');
    closingSpan.style.color = '#444444';
    closingSpan.textContent = msg2ClosingText;
    msg2Bubble.appendChild(closingSpan);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(calculateReadingDelay(msg2IntroText + ' ' + msg2ClosingText, true));

    // Message 2.5: User asks about ChatGPT difference
    const msg2_5Text = workflowTranslations['workflow.message2_5.user'][currentLanguage];
    await typeInInputAndSend(msg2_5Text);
    const { bubble: bubble2_5 } = addMessage(msg2_5Text, true);
    await safeDelay(TIMING.responseDelay);

    // Message 2.5: Bot with ChatGPT explanation
    const msg2_5IntroText = workflowTranslations['workflow.message2_5.bot.intro'][currentLanguage];
    const { messageDiv: msg2_5Div, bubble: msg2_5Bubble } = addMessage('', false);

    const typingIndicator2_5 = createTypingIndicator();
    msg2_5Div.insertBefore(typingIndicator2_5, msg2_5Bubble.nextSibling);
    await safeDelay(TIMING.responseDelay);
    typingIndicator2_5.remove();

    await typeMessage(msg2_5Bubble, msg2_5IntroText, 70);

    // Add comparison text
    msg2_5Bubble.appendChild(document.createElement('br'));
    const comparisonText = workflowTranslations['workflow.message2_5.bot.comparison'][currentLanguage];
    const comparisonSpan = document.createElement('span');
    comparisonSpan.style.color = '#444444';
    comparisonSpan.style.whiteSpace = 'pre-wrap';
    comparisonSpan.style.lineHeight = '1.6';
    comparisonSpan.textContent = comparisonText;
    msg2_5Bubble.appendChild(comparisonSpan);

    // Add who for text
    msg2_5Bubble.appendChild(document.createElement('br'));
    msg2_5Bubble.appendChild(document.createElement('br'));
    const whoForText = workflowTranslations['workflow.message2_5.bot.who_for'][currentLanguage];
    const whoForSpan = document.createElement('span');
    whoForSpan.style.color = '#6666ff';
    whoForSpan.style.fontWeight = '600';
    whoForSpan.textContent = whoForText;
    msg2_5Bubble.appendChild(whoForSpan);

    // Add closing text
    msg2_5Bubble.appendChild(document.createElement('br'));
    msg2_5Bubble.appendChild(document.createElement('br'));
    const msg2_5ClosingText = workflowTranslations['workflow.message2_5.bot.closing'][currentLanguage];
    const closingSpan2_5 = document.createElement('span');
    closingSpan2_5.style.color = '#444444';
    closingSpan2_5.style.fontStyle = 'italic';
    closingSpan2_5.textContent = msg2_5ClosingText;
    msg2_5Bubble.appendChild(closingSpan2_5);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(calculateReadingDelay(msg2_5IntroText + ' ' + comparisonText + ' ' + whoForText + ' ' + msg2_5ClosingText, false));

    // Message 3: User asks about implementation details (after ChatGPT question)
    const msg3Text = workflowTranslations['workflow.message3.user'][currentLanguage];
    await typeInInputAndSend(msg3Text);
    const { bubble: bubble3 } = addMessage(msg3Text, true);
    await safeDelay(TIMING.responseDelay);

    // Message 4: Bot with backtest (all in one bubble)
    const msg4IntroText = workflowTranslations['workflow.message4.bot.intro'][currentLanguage];
    const { messageDiv: msg4Div, bubble: msg4Bubble } = addMessage('', false);

    const typingIndicator2 = createTypingIndicator();
    msg4Div.insertBefore(typingIndicator2, msg4Bubble.nextSibling);
    await safeDelay(TIMING.responseDelay);
    typingIndicator2.remove();

    await typeMessage(msg4Bubble, msg4IntroText, 50);

    // Add line break and backtest content
    msg4Bubble.appendChild(document.createElement('br'));
    const backtestContent = createBacktestCard();
    msg4Bubble.appendChild(backtestContent);

    // Add conclusion text
    msg4Bubble.appendChild(document.createElement('br'));
    const msg4ConclusionText = workflowTranslations['workflow.message4.bot.conclusion'][currentLanguage];
    const conclusionSpan = document.createElement('span');
    conclusionSpan.style.color = '#444444';
    conclusionSpan.textContent = msg4ConclusionText;
    msg4Bubble.appendChild(conclusionSpan);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(calculateReadingDelay(msg4IntroText + ' ' + msg4ConclusionText, true));

    // Message 5: User
    const msg5Text = workflowTranslations['workflow.message5.user'][currentLanguage];
    await typeInInputAndSend(msg5Text);
    const { bubble: bubble5 } = addMessage(msg5Text, true);
    await safeDelay(TIMING.responseDelay);

    // Message 5: Bot acknowledges confirmation
    const msg5BotText = "Excellent. I've logged this pocket into your account. Now, the important part: execution.";
    const msg5BotTextFr = "Parfait. J'ai enregistré cette poche dans votre compte. Maintenant, la partie importante : l'exécution.";
    const msg5BotConfirmText = currentLanguage === 'en' ? msg5BotText : msg5BotTextFr;
    const { messageDiv: msg5BotDiv, bubble: msg5BotBubble } = addMessage('', false);

    const typingIndicator5Bot = createTypingIndicator();
    msg5BotDiv.insertBefore(typingIndicator5Bot, msg5BotBubble.nextSibling);
    await safeDelay(TIMING.responseDelay);
    typingIndicator5Bot.remove();

    await typeMessage(msg5BotBubble, msg5BotConfirmText, 50);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(TIMING.responseDelay);

    // Message 5.5: User asks about execution
    const msg5_5Text = workflowTranslations['workflow.message5_5.user'][currentLanguage];
    await typeInInputAndSend(msg5_5Text);
    const { bubble: bubble5_5 } = addMessage(msg5_5Text, true);
    await safeDelay(TIMING.responseDelay);

    // Message 5.5: Bot with execution flow
    const msg5_5IntroText = workflowTranslations['workflow.message5_5.bot.intro'][currentLanguage];
    const { messageDiv: msg5_5Div, bubble: msg5_5Bubble } = addMessage('', false);

    const typingIndicator5_5 = createTypingIndicator();
    msg5_5Div.insertBefore(typingIndicator5_5, msg5_5Bubble.nextSibling);
    await safeDelay(TIMING.responseDelay);
    typingIndicator5_5.remove();

    await typeMessage(msg5_5Bubble, msg5_5IntroText, 50);

    // Add execution flow card
    msg5_5Bubble.appendChild(document.createElement('br'));
    const executionCard = createExecutionFlowCard();
    msg5_5Bubble.appendChild(executionCard);

    // Add delegation note
    msg5_5Bubble.appendChild(document.createElement('br'));
    const delegationText = workflowTranslations['workflow.message5_5.bot.delegation_note'][currentLanguage];
    const delegationSpan = document.createElement('span');
    delegationSpan.style.color = '#444444';
    delegationSpan.style.fontSize = '0.9rem';
    delegationSpan.textContent = delegationText;
    msg5_5Bubble.appendChild(delegationSpan);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(calculateReadingDelay(msg5_5IntroText + ' ' + delegationText, true));

    // Message 6: User confirms to proceed
    const msg6UserText = workflowTranslations['workflow.message6.user'][currentLanguage];
    await typeInInputAndSend(msg6UserText);
    const { bubble: bubble6User } = addMessage(msg6UserText, true);
    await safeDelay(TIMING.responseDelay);

    // Message 6: Bot with summary (all in one bubble)
    const msg6ConfirmText = workflowTranslations['workflow.message6.bot.confirmation'][currentLanguage];
    const { messageDiv: msg6Div, bubble: msg6Bubble } = addMessage('', false);

    const typingIndicator3 = createTypingIndicator();
    msg6Div.insertBefore(typingIndicator3, msg6Bubble.nextSibling);
    await safeDelay(TIMING.responseDelay);
    typingIndicator3.remove();

    await typeMessage(msg6Bubble, msg6ConfirmText, 50);

    // Add line break and summary content
    msg6Bubble.appendChild(document.createElement('br'));
    const summaryCard = createSummaryCard();
    msg6Bubble.appendChild(summaryCard);

    // Add pricing note
    msg6Bubble.appendChild(document.createElement('br'));
    const pricingNoteText = workflowTranslations['workflow.message6.bot.pricing_note'][currentLanguage];
    const pricingNoteSpan = document.createElement('span');
    pricingNoteSpan.style.color = '#6666ff';
    pricingNoteSpan.style.fontWeight = '600';
    pricingNoteSpan.textContent = pricingNoteText;
    msg6Bubble.appendChild(pricingNoteSpan);

    // Add academic disclosure card
    msg6Bubble.appendChild(document.createElement('br'));
    const academicCardIntermediate = createAcademicDisclosureCard();
    msg6Bubble.appendChild(academicCardIntermediate);

    // Add closing text
    msg6Bubble.appendChild(document.createElement('br'));
    msg6Bubble.appendChild(document.createElement('br'));
    const msg6ClosingText = workflowTranslations['workflow.message6.bot.closing'][currentLanguage];
    const msg6ClosingSpan = document.createElement('span');
    msg6ClosingSpan.style.color = '#444444';
    msg6ClosingSpan.textContent = msg6ClosingText;
    msg6Bubble.appendChild(msg6ClosingSpan);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(calculateReadingDelay(msg6ConfirmText + ' ' + pricingNoteText + ' ' + msg6ClosingText, true));

    // Message 7: System message (Time transition)
    const timeTransition = workflowTranslations['workflow.message7.system'][currentLanguage];
    addSystemMessage(timeTransition);
    await safeDelay(TIMING.responseDelay);

    // Message 8: User
    const msg8Text = workflowTranslations['workflow.message8.user'][currentLanguage];
    await typeInInputAndSend(msg8Text);
    const { bubble: bubble8 } = addMessage(msg8Text, true);
    await safeDelay(TIMING.responseDelay);

    // Message 9: Bubble with portfolio bar chart (all in one bubble)
    const msg9CelebrationText = workflowTranslations['workflow.message9.bot.celebration'][currentLanguage];
    const { messageDiv: msg9Div, bubble: msg9Bubble } = addMessage('', false);

    const typingIndicator4 = createTypingIndicator();
    msg9Div.insertBefore(typingIndicator4, msg9Bubble.nextSibling);
    await safeDelay(TIMING.responseDelay);
    typingIndicator4.remove();

    await typeMessage(msg9Bubble, msg9CelebrationText, 50);

    // Add line break and portfolio chart
    msg9Bubble.appendChild(document.createElement('br'));
    const portfolioBarChart = createPortfolioBarChart();
    msg9Bubble.appendChild(portfolioBarChart);

    // Add closing text
    msg9Bubble.appendChild(document.createElement('br'));
    const msg9ClosingText = workflowTranslations['workflow.message9.bot.closing'][currentLanguage];
    const msg9ClosingSpan = document.createElement('span');
    msg9ClosingSpan.style.color = '#444444';
    msg9ClosingSpan.textContent = msg9ClosingText;
    msg9Bubble.appendChild(msg9ClosingSpan);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(calculateReadingDelay(msg9CelebrationText + ' ' + msg9ClosingText, true));

    // Message 10: User thanks
    const msg10Text = workflowTranslations['workflow.message10.user'][currentLanguage];
    await typeInInputAndSend(msg10Text);
    const { bubble: bubble10 } = addMessage(msg10Text, true);
    await safeDelay(TIMING.responseDelay);

    // Message 11: Bubble closing
    const msg11Text = workflowTranslations['workflow.message11.bot'][currentLanguage];
    const { messageDiv: msg11Div } = addMessage('', false);
    const msg11Bubble = msg11Div.querySelector('.workflow-demo-message-bubble');

    const typingIndicator5 = createTypingIndicator();
    msg11Div.appendChild(typingIndicator5);
    await safeDelay(TIMING.responseDelay);
    typingIndicator5.remove();

    await typeMessage(msg11Bubble, msg11Text, 50);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    finishDemo('completed');
  };

  const showDemoOverlay = () => {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    if (pricingContent) {
      pricingContent.classList.add('hidden');
    }
  };

  // Close demo and show pricing
  const closeDemo = () => {
    cancelAnimations();
    fastForwardTargetStep = null;
    pendingSkipBotMessages = 0;
    progressJumpPending = false;
    setSkipMode(false);
    if (!overlay) return;
    overlay.classList.add('hidden');
    if (pricingContent) {
      pricingContent.classList.remove('hidden');
    }
    maybeRedirectAfterDemoClose();
  };

  // Route demo based on scenario
  const routeDemo = () => {
    console.log('[WorkflowDemo] Routing to scenario:', currentScenario);

    // Cancel any running animations and clear the container
    cancelAnimations();
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
    }

    // Start the new animation
    startDemoRun();

    switch(currentScenario) {
      case 'macro-defense':
        runBeginnerDemo();
        break;
      case 'japan-momentum':
        runIntermediateDemo(); // Legacy demo
        break;
      case 'semiconductors-sortino':
        runExpertDemo();
        break;
      default:
        console.warn('[WorkflowDemo] Unknown scenario, defaulting to intermediate');
        runIntermediateDemo();
    }
  };

  const launchWorkflowDemo = () => {
    showDemoOverlay();
    routeDemo();
  };

  const handleReplay = () => {
    syncScenarioFromStoredExperience();
    sessionStorage.removeItem(DEMO_SHOWN_KEY);
    launchWorkflowDemo();
  };

  // Event listeners
  if (closeBtn) {
    closeBtn.addEventListener('click', closeDemo);
  }

  if (speedToggleButton) {
    speedToggleButton.addEventListener('click', () => {
      const index = getSpeedIndex();
      const nextIndex = index === -1 ? 0 : (index + 1) % SPEED_PRESETS.length;
      const nextPreset = SPEED_PRESETS[nextIndex];
      if (nextPreset) {
        setSpeedMultiplier(nextPreset.multiplier);
      }
    });
  }

  if (pauseToggleButton) {
    pauseToggleButton.addEventListener('click', () => {
      if (!isAnimationRunning) return;
      toggleManualPause();
    });
  }

  if (skipButton) {
    skipButton.addEventListener('click', () => {
      skipToNextBotMessage();
    });
  }

  if (progressTrack) {
    progressTrack.addEventListener('click', (event) => {
      jumpToProgressStep(event);
    });
  }

  let touchStartY = null;
  let touchStartX = null;
  let longPressTimer = null;
  let longPressTriggered = false;

  const clearLongPressTimer = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  };

  if (messagesContainer) {
    messagesContainer.addEventListener('touchstart', (event) => {
      if (!isAnimationRunning) return;
      const touch = event.touches[0];
      touchStartY = touch.clientY;
      touchStartX = touch.clientX;
      longPressTriggered = false;
      clearLongPressTimer();
      longPressTimer = setTimeout(() => {
        longPressTriggered = true;
        if (confirmSkip()) {
          skipDemo('skipped');
        }
      }, 800);
    }, { passive: true });

    messagesContainer.addEventListener('touchmove', (event) => {
      if (touchStartY === null) return;
      const touch = event.touches[0];
      const deltaY = touch.clientY - touchStartY;
      const deltaX = touch.clientX - touchStartX;
      if (Math.abs(deltaY) > 12 || Math.abs(deltaX) > 12) {
        clearLongPressTimer();
      }
    }, { passive: true });

    messagesContainer.addEventListener('touchend', (event) => {
      clearLongPressTimer();
      if (touchStartY === null || touchStartX === null) return;
      const touch = event.changedTouches[0];
      const deltaY = touch.clientY - touchStartY;
      const deltaX = touch.clientX - touchStartX;
      touchStartY = null;
      touchStartX = null;

      if (longPressTriggered) return;
      if (Math.abs(deltaY) > 50 && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (deltaY < 0) {
          stepSpeed(1);
        } else {
          stepSpeed(-1);
        }
      }
    }, { passive: true });
  }

  // Keyboard support
  document.addEventListener('keydown', (e) => {
    if (!overlay || overlay.classList.contains('hidden')) return;
    if (e.key === 'Escape') {
      closeDemo();
      return;
    }
    if (e.code === 'Space') {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
      e.preventDefault();
      toggleManualPause();
    }
  });

  // Language switching
  if (langToggleButton) {
    langToggleButton.addEventListener('click', () => {
      currentLanguage = currentLanguage === 'en' ? 'fr' : 'en';
      updateDemoUILabels();
      routeDemo();
    });
  }

  // Replay button
  if (replayBtn) {
    replayBtn.addEventListener('click', handleReplay);
  }

  document.addEventListener('click', (event) => {
    const replayAction = event.target.closest('[data-demo-action="replay"]');
    if (!replayAction) return;
    event.preventDefault();
    handleReplay();
  });

  window.addEventListener('launchDemo', (event) => {
    const demoExperience = event.detail;
    if (demoExperience && demoExperience.scenarioId) {
      currentScenario = demoExperience.scenarioId;
      console.log('[WorkflowDemo] Scenario set to:', currentScenario);
    }
    launchWorkflowDemo();
  });

  // ========== BEGINNER DEMO VISUAL HELPERS ==========

  // Create "Why This Works" card with 4 benefits
  const createBeginnerWhyCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['beginner.message2.bot.why_works'][currentLanguage];
    card.appendChild(header);

    const items = workflowTranslations['beginner.message2.bot.why_works_items'];
    const itemsContainer = document.createElement('div');
    itemsContainer.style.display = 'grid';
    itemsContainer.style.gridTemplateColumns = '1fr 1fr';
    itemsContainer.style.gap = '0.5rem';
    itemsContainer.style.marginTop = '0.5rem';

    items.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.style.padding = '0.5rem';
      itemDiv.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
      itemDiv.style.borderRadius = '8px';
      itemDiv.style.borderLeft = '3px solid #6666ff';

      const title = document.createElement('div');
      title.style.fontWeight = '600';
      title.style.color = '#333333';
      title.style.marginBottom = '0.2rem';
      title.innerHTML = `${item.icon} ${item[`title_${currentLanguage}`]}`;

      const desc = document.createElement('div');
      desc.style.fontSize = '0.8rem';
      desc.style.color = '#666666';
      desc.style.lineHeight = '1.4';
      desc.textContent = item[`desc_${currentLanguage}`];

      itemDiv.appendChild(title);
      itemDiv.appendChild(desc);
      itemsContainer.appendChild(itemDiv);
    });

    card.appendChild(itemsContainer);
    return card;
  };

  // Create portfolio assets card with 5 allocations
  const createBeginnerPortfolioCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['beginner.message4.bot.portfolio_proposal'][currentLanguage];
    card.appendChild(header);

    const assets = workflowTranslations['beginner.message4.bot.assets'];
    const assetsContainer = document.createElement('div');
    assetsContainer.style.marginTop = '0.5rem';

    assets.forEach(asset => {
      const assetDiv = document.createElement('div');
      assetDiv.style.display = 'flex';
      assetDiv.style.justifyContent = 'space-between';
      assetDiv.style.alignItems = 'center';
      assetDiv.style.padding = '0.25rem 0';
      assetDiv.style.borderBottom = '1px solid rgba(102, 126, 234, 0.1)';

      const nameSpan = document.createElement('span');
      nameSpan.style.fontWeight = '500';
      nameSpan.style.color = '#333333';
      nameSpan.style.fontSize = '0.9rem';
      nameSpan.innerHTML = `${asset.icon} ${asset[`name_${currentLanguage}`]}`;

      const percentageSpan = document.createElement('span');
      percentageSpan.style.fontWeight = '700';
      percentageSpan.style.color = '#6666ff';
      percentageSpan.textContent = asset.percentage;

      assetDiv.appendChild(nameSpan);
      assetDiv.appendChild(percentageSpan);
      assetsContainer.appendChild(assetDiv);
    });

    card.appendChild(assetsContainer);
    return card;
  };

  // Create risk statistics card
  const createBeginnerRiskCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const riskExpl = workflowTranslations['beginner.message4.bot.risk_explanation'][currentLanguage];
    const explDiv = document.createElement('div');
    explDiv.style.fontSize = '0.85rem';
    explDiv.style.color = '#444444';
    explDiv.style.marginBottom = '0.4rem';
    explDiv.textContent = riskExpl;
    card.appendChild(explDiv);

    const stats = workflowTranslations['beginner.message4.bot.risk_stats'];
    const statsContainer = document.createElement('div');

    stats.forEach(stat => {
      const statDiv = document.createElement('div');
      statDiv.style.padding = '0.3rem';
      statDiv.style.marginBottom = '0.3rem';
      statDiv.style.borderLeft = '3px solid #4CAF50';
      statDiv.style.paddingLeft = '0.5rem';
      statDiv.style.fontSize = '0.85rem';
      statDiv.style.color = '#333333';
      statDiv.innerHTML = `${stat.icon} ${stat[`stat_${currentLanguage}`]}`;
      statsContainer.appendChild(statDiv);
    });

    card.appendChild(statsContainer);

    const finalNote = workflowTranslations['beginner.message4.bot.final_note'][currentLanguage];
    const noteDiv = document.createElement('div');
    noteDiv.style.marginTop = '0.5rem';
    noteDiv.style.padding = '0.4rem 0.5rem';
    noteDiv.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
    noteDiv.style.borderRadius = '6px';
    noteDiv.style.fontSize = '0.85rem';
    noteDiv.style.color = '#2e5c3e';
    noteDiv.style.lineHeight = '1.4';
    noteDiv.textContent = finalNote;
    card.appendChild(noteDiv);

    return card;
  };

  // Create automation checklist card (7 items)
  const createBeginnerChecklistCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['beginner.message6.bot.checklist_title'][currentLanguage];
    card.appendChild(header);

    const items = workflowTranslations['beginner.message6.bot.checklist_items'];
    const listContainer = document.createElement('div');
    listContainer.style.marginTop = '0.5rem';

    items.forEach((item, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.style.padding = '0.4rem 0.5rem';
      itemDiv.style.marginBottom = '0.3rem';
      itemDiv.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
      itemDiv.style.borderRadius = '6px';
      itemDiv.style.borderLeft = '3px solid #6666ff';

      const title = document.createElement('div');
      title.style.fontWeight = '600';
      title.style.color = '#333333';
      title.style.marginBottom = '0.15rem';
      title.innerHTML = `${item.icon} ${item[`title_${currentLanguage}`]}`;

      const desc = document.createElement('div');
      desc.style.fontSize = '0.8rem';
      desc.style.color = '#666666';
      desc.style.lineHeight = '1.3';
      desc.textContent = item[`desc_${currentLanguage}`];

      itemDiv.appendChild(title);
      itemDiv.appendChild(desc);
      listContainer.appendChild(itemDiv);
    });

    card.appendChild(listContainer);

    const example = workflowTranslations['beginner.message6.bot.real_life_example'][currentLanguage];
    const exampleDiv = document.createElement('div');
    exampleDiv.style.marginTop = '0.5rem';
    exampleDiv.style.padding = '0.4rem 0.5rem';
    exampleDiv.style.backgroundColor = 'rgba(255, 193, 7, 0.1)';
    exampleDiv.style.borderRadius = '6px';
    exampleDiv.style.fontSize = '0.85rem';
    exampleDiv.style.color = '#5d4037';
    exampleDiv.style.lineHeight = '1.4';
    exampleDiv.style.borderLeft = '3px solid #FFC107';
    exampleDiv.style.paddingLeft = '0.5rem';
    exampleDiv.textContent = example;
    card.appendChild(exampleDiv);

    return card;
  };

  // Create liquidity options card
  const createBeginnerLiquidityCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['beginner.message8.bot.liquidity'][currentLanguage];
    card.appendChild(header);

    const items = workflowTranslations['beginner.message8.bot.liquidity_items'];
    const itemsContainer = document.createElement('div');
    itemsContainer.style.marginTop = '0.4rem';

    items.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.style.padding = '0.2rem 0';
      itemDiv.style.fontSize = '0.9rem';
      itemDiv.style.color = '#333333';
      itemDiv.innerHTML = `${item.icon} ${item[`title_${currentLanguage}`]}`;
      itemsContainer.appendChild(itemDiv);
    });

    card.appendChild(itemsContainer);
    return card;
  };

  // Create timeline card (3 steps with sub-items)
  const createBeginnerTimelineCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['beginner.message8.bot.timeline_title'][currentLanguage];
    card.appendChild(header);

    const steps = workflowTranslations['beginner.message8.bot.timeline_steps'];
    const timelineContainer = document.createElement('div');
    timelineContainer.style.marginTop = '0.4rem';

    steps.forEach((step, stepIndex) => {
      const stepDiv = document.createElement('div');
      stepDiv.style.marginBottom = '0.5rem';
      stepDiv.style.paddingLeft = '0.6rem';
      stepDiv.style.borderLeft = '3px solid #6666ff';
      stepDiv.style.position = 'relative';

      const stepTitle = document.createElement('div');
      stepTitle.style.fontWeight = '700';
      stepTitle.style.color = '#333333';
      stepTitle.style.marginBottom = '0.25rem';
      stepTitle.style.fontSize = '0.9rem';
      stepTitle.textContent = step[`step${currentLanguage === 'en' ? '' : '_fr'}`];
      stepDiv.appendChild(stepTitle);

      const itemsList = document.createElement('div');
      itemsList.style.marginLeft = '0.3rem';

      step.items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.style.padding = '0.15rem 0';
        itemDiv.style.fontSize = '0.8rem';
        itemDiv.style.color = '#666666';
        itemDiv.style.lineHeight = '1.3';
        itemDiv.innerHTML = `${item.icon} ${item[`text_${currentLanguage}`]}`;
        itemsList.appendChild(itemDiv);
      });

      stepDiv.appendChild(itemsList);
      timelineContainer.appendChild(stepDiv);
    });

    card.appendChild(timelineContainer);
    return card;
  };

  // Create backtest results card
  const createBeginnerBacktestCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['beginner.message10.bot.backtest_title'][currentLanguage];
    card.appendChild(header);

    const metrics = workflowTranslations['beginner.message10.bot.backtest_metrics'];
    const table = document.createElement('table');
    table.className = 'workflow-demo-metrics-table';
    table.style.width = '100%';
    table.style.marginTop = '0.5rem';
    table.style.marginBottom = '0.5rem';

    const rows = [
      {
        label: metrics[`starting_amount_${currentLanguage}`],
        value: metrics[`starting_value${currentLanguage === 'en' ? '' : '_fr'}`]
      },
      {
        label: metrics[`ending_amount_${currentLanguage}`],
        value: metrics[`ending_value${currentLanguage === 'en' ? '' : '_fr'}`]
      },
      {
        label: metrics[`avg_return_${currentLanguage}`],
        value: metrics[`avg_return_value${currentLanguage === 'en' ? '' : '_fr'}`]
      },
      {
        label: metrics[`worst_year_${currentLanguage}`],
        value: metrics[`worst_year_value${currentLanguage === 'en' ? '' : '_fr'}`]
      },
      {
        label: metrics[`best_year_${currentLanguage}`],
        value: metrics[`best_year_value${currentLanguage === 'en' ? '' : '_fr'}`]
      },
      {
        label: metrics[`winning_years_${currentLanguage}`],
        value: metrics[`winning_years_value${currentLanguage === 'en' ? '' : '_fr'}`]
      },
      {
        label: metrics[`recovery_${currentLanguage}`],
        value: metrics[`recovery_value${currentLanguage === 'en' ? '' : '_fr'}`]
      }
    ];

    rows.forEach(row => {
      const tr = document.createElement('tr');
      const tdLabel = document.createElement('td');
      tdLabel.style.paddingRight = '0.6rem';
      tdLabel.style.fontWeight = '600';
      tdLabel.style.color = '#333333';
      tdLabel.textContent = row.label;

      const tdValue = document.createElement('td');
      tdValue.style.textAlign = 'right';
      tdValue.style.color = '#6666ff';
      tdValue.style.fontWeight = '600';
      tdValue.textContent = row.value;

      tr.appendChild(tdLabel);
      tr.appendChild(tdValue);
      table.appendChild(tr);
    });

    card.appendChild(table);

    const comparison = workflowTranslations['beginner.message10.bot.comparison_items'];
    const compHeader = document.createElement('div');
    compHeader.style.fontWeight = '600';
    compHeader.style.color = '#333333';
    compHeader.style.marginTop = '0.5rem';
    compHeader.style.marginBottom = '0.4rem';
    compHeader.textContent = workflowTranslations['beginner.message10.bot.comparison_title'][currentLanguage];
    card.appendChild(compHeader);

    const compContainer = document.createElement('div');
    comparison.forEach(comp => {
      const compDiv = document.createElement('div');
      compDiv.style.padding = '0.4rem 0.5rem';
      compDiv.style.marginBottom = '0.3rem';
      compDiv.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
      compDiv.style.borderRadius = '8px';

      const option = document.createElement('div');
      option.style.fontWeight = '600';
      option.style.color = '#333333';
      option.style.marginBottom = '0.4rem';
      option.innerHTML = `${comp.icon} ${comp[`option_${currentLanguage}`]}`;

      const result = document.createElement('div');
      result.style.fontSize = '0.85rem';
      result.style.color = '#6666ff';
      result.style.fontWeight = '600';
      result.textContent = comp[`result${currentLanguage === 'en' ? '' : '_fr'}`];

      compDiv.appendChild(option);
      compDiv.appendChild(result);
      compContainer.appendChild(compDiv);
    });

    card.appendChild(compContainer);

    const finalNote = workflowTranslations['beginner.message10.bot.final_note'][currentLanguage];
    const noteDiv = document.createElement('div');
    noteDiv.style.marginTop = '0.5rem';
    noteDiv.style.padding = '0.4rem 0.5rem';
    noteDiv.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
    noteDiv.style.borderRadius = '8px';
    noteDiv.style.fontSize = '0.85rem';
    noteDiv.style.color = '#2e5c3e';
    noteDiv.style.lineHeight = '1.5';
    noteDiv.textContent = finalNote;
    card.appendChild(noteDiv);

    return card;
  };

  // Create pricing comparison card for message 10.5
  const createBeginnerPricingCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['beginner.message10_5.bot.pricing_title'][currentLanguage];
    card.appendChild(header);

    const pricingRows = workflowTranslations['beginner.message10_5.bot.pricing_rows'];
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.marginTop = '0.5rem';
    table.style.marginBottom = '0.5rem';
    table.style.borderCollapse = 'collapse';

    const headerRow = document.createElement('tr');
    headerRow.style.borderBottom = '2px solid #6666ff';

    const headers = ['Provider', 'Fee Model', 'Annual Cost (€200k)'];
    headers.forEach((h, idx) => {
      const th = document.createElement('th');
      th.style.padding = '0.4rem';
      th.style.textAlign = idx === 0 ? 'left' : 'center';
      th.style.fontWeight = '700';
      th.style.color = '#333333';
      th.style.fontSize = '0.9rem';
      th.textContent = h;
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    pricingRows.forEach((row, rowIdx) => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid rgba(102, 126, 234, 0.1)';

      const tdProvider = document.createElement('td');
      tdProvider.style.padding = '0.4rem';
      tdProvider.style.fontWeight = '600';
      tdProvider.style.color = '#333333';
      tdProvider.textContent = row[`name_${currentLanguage}`];
      tr.appendChild(tdProvider);

      const tdFee = document.createElement('td');
      tdFee.style.padding = '0.4rem';
      tdFee.style.textAlign = 'center';
      tdFee.style.color = '#666666';
      tdFee.style.fontSize = '0.9rem';
      tdFee.textContent = row[`fee_${currentLanguage}`];
      tr.appendChild(tdFee);

      const tdExample = document.createElement('td');
      tdExample.style.padding = '0.4rem';
      tdExample.style.textAlign = 'center';
      tdExample.style.fontWeight = rowIdx === 2 ? '700' : '600';
      tdExample.style.color = rowIdx === 2 ? '#6666ff' : '#666666';
      tdExample.style.fontSize = '0.9rem';
      tdExample.textContent = row[`example_${currentLanguage}`];
      tr.appendChild(tdExample);

      table.appendChild(tr);
    });

    card.appendChild(table);

    // Add savings calculation
    const savingsDiv = document.createElement('div');
    savingsDiv.style.marginTop = '0.5rem';
    savingsDiv.style.padding = '0.5rem';
    savingsDiv.style.backgroundColor = 'rgba(76, 175, 80, 0.08)';
    savingsDiv.style.borderRadius = '8px';
    savingsDiv.style.borderLeft = '4px solid #4CAF50';
    savingsDiv.style.fontSize = '0.85rem';
    savingsDiv.style.color = '#2e5c3e';
    savingsDiv.style.lineHeight = '1.6';
    savingsDiv.style.whiteSpace = 'pre-wrap';
    savingsDiv.textContent = workflowTranslations['beginner.message10_5.bot.savings_calc'][currentLanguage];
    card.appendChild(savingsDiv);

    return card;
  };

  // Create ChatGPT comparison card for message 11
  const createBeginnerChatGPTCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['beginner.message11.bot.comparison_title'][currentLanguage];
    card.appendChild(header);

    const comparisonItems = workflowTranslations['beginner.message11.bot.comparison_items'];
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.marginTop = '0.5rem';
    table.style.borderCollapse = 'collapse';

    const headerRow = document.createElement('tr');
    headerRow.style.borderBottom = '2px solid #6666ff';

    const headers = ['Feature', 'ChatGPT', 'Bubble'];
    headers.forEach((h, idx) => {
      const th = document.createElement('th');
      th.style.padding = '0.4rem 0.5rem';
      th.style.textAlign = idx === 0 ? 'left' : 'center';
      th.style.fontWeight = '700';
      th.style.color = '#333333';
      th.style.fontSize = '0.9rem';
      th.textContent = h;
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    comparisonItems.forEach(item => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid rgba(102, 126, 234, 0.1)';

      const tdFeature = document.createElement('td');
      tdFeature.style.padding = '0.4rem 0.5rem';
      tdFeature.style.fontWeight = '600';
      tdFeature.style.color = '#333333';
      tdFeature.style.fontSize = '0.9rem';
      tdFeature.textContent = item[`feature_${currentLanguage}`];
      tr.appendChild(tdFeature);

      const tdChatGPT = document.createElement('td');
      tdChatGPT.style.padding = '0.4rem 0.5rem';
      tdChatGPT.style.textAlign = 'center';
      tdChatGPT.style.color = '#666666';
      tdChatGPT.style.fontSize = '0.9rem';
      tdChatGPT.textContent = item[`chatgpt_${currentLanguage}`];
      tr.appendChild(tdChatGPT);

      const tdBubble = document.createElement('td');
      tdBubble.style.padding = '0.4rem 0.5rem';
      tdBubble.style.textAlign = 'center';
      tdBubble.style.fontWeight = '600';
      tdBubble.style.color = '#6666ff';
      tdBubble.style.fontSize = '0.9rem';
      tdBubble.textContent = item[`bubble_${currentLanguage}`];
      tr.appendChild(tdBubble);

      table.appendChild(tr);
    });

    card.appendChild(table);

    return card;
  };

  // Create execution flow card for intermediate message 5.5
  const createExecutionFlowCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['workflow.message5_5.bot.execution_title'][currentLanguage];
    card.appendChild(header);

    const steps = workflowTranslations['workflow.message5_5.bot.execution_steps'];
    const stepsContainer = document.createElement('div');
    stepsContainer.style.marginTop = '0.5rem';

    steps.forEach((step, idx) => {
      const stepDiv = document.createElement('div');
      stepDiv.style.padding = '0.6rem';
      stepDiv.style.marginBottom = '0.5rem';
      stepDiv.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
      stepDiv.style.borderRadius = '8px';
      stepDiv.style.borderLeft = '4px solid #6666ff';

      const stepNum = document.createElement('div');
      stepNum.style.fontSize = '0.75rem';
      stepNum.style.fontWeight = '700';
      stepNum.style.color = '#6666ff';
      stepNum.style.marginBottom = '0.3rem';
      stepNum.style.textTransform = 'uppercase';
      stepNum.textContent = `${step.icon} Step ${idx + 1}`;
      stepDiv.appendChild(stepNum);

      const title = document.createElement('div');
      title.style.fontWeight = '700';
      title.style.color = '#333333';
      title.style.marginBottom = '0.3rem';
      title.style.fontSize = '0.95rem';
      title.textContent = step[`step_${currentLanguage}`];
      stepDiv.appendChild(title);

      const detail = document.createElement('div');
      detail.style.fontSize = '0.85rem';
      detail.style.color = '#666666';
      detail.style.lineHeight = '1.5';
      detail.textContent = step.detail_en; // Using English detail (same for both languages for now)
      stepDiv.appendChild(detail);

      stepsContainer.appendChild(stepDiv);
    });

    card.appendChild(stepsContainer);
    return card;
  };

  // Create academic formulas & backtesting transparency card
  const createAcademicDisclosureCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    // Title
    const title = document.createElement('div');
    title.style.fontSize = '0.9rem';
    title.style.fontWeight = '700';
    title.style.color = '#6666ff';
    title.style.marginBottom = '0.6rem';
    title.innerHTML = workflowTranslations['academic.disclosure.title'][currentLanguage];
    card.appendChild(title);

    // Subtitle
    const subtitle = document.createElement('div');
    subtitle.style.fontSize = '0.8rem';
    subtitle.style.color = '#666666';
    subtitle.style.fontStyle = 'italic';
    subtitle.style.marginBottom = '0.4rem';
    subtitle.textContent = workflowTranslations['academic.disclosure.subtitle'][currentLanguage];
    card.appendChild(subtitle);

    // Main description
    const desc = document.createElement('div');
    desc.style.fontSize = '0.85rem';
    desc.style.color = '#444444';
    desc.style.lineHeight = '1.5';
    desc.style.marginBottom = '0.5rem';
    desc.textContent = workflowTranslations['academic.disclosure.description'][currentLanguage];
    card.appendChild(desc);

    // Formulas list
    const formulas = workflowTranslations['academic.disclosure.formulas'];
    const formulasContainer = document.createElement('div');
    formulasContainer.style.marginBottom = '0.5rem';

    formulas.forEach(formula => {
      const formulaDiv = document.createElement('div');
      formulaDiv.style.marginBottom = '0.4rem';
      formulaDiv.style.paddingLeft = '0.5rem';
      formulaDiv.style.borderLeft = '3px solid #6666ff';

      const formulaName = document.createElement('div');
      formulaName.style.fontWeight = '600';
      formulaName.style.color = '#333333';
      formulaName.style.fontSize = '0.85rem';
      formulaName.style.marginBottom = '0.3rem';
      formulaName.textContent = formula[`name_${currentLanguage}`];
      formulaDiv.appendChild(formulaName);

      const formulaDesc = document.createElement('div');
      formulaDesc.style.fontSize = '0.75rem';
      formulaDesc.style.color = '#666666';
      formulaDesc.style.lineHeight = '1.4';
      formulaDesc.textContent = formula[`desc_${currentLanguage}`];
      formulaDiv.appendChild(formulaDesc);

      formulasContainer.appendChild(formulaDiv);
    });
    card.appendChild(formulasContainer);

    // Data sourcing
    const dataDiv = document.createElement('div');
    dataDiv.style.fontSize = '0.8rem';
    dataDiv.style.color = '#666666';
    dataDiv.style.marginBottom = '0.4rem';
    dataDiv.style.paddingTop = '0.3rem';
    dataDiv.style.borderTop = '1px solid rgba(102, 126, 234, 0.1)';
    dataDiv.innerHTML = `<strong>Data:</strong> ${workflowTranslations['academic.disclosure.data'][currentLanguage]}`;
    card.appendChild(dataDiv);

    // Metrics reliability
    const metricsDiv = document.createElement('div');
    metricsDiv.style.fontSize = '0.8rem';
    metricsDiv.style.color = '#666666';
    metricsDiv.style.marginBottom = '0.5rem';
    metricsDiv.innerHTML = `<strong>Metrics:</strong> ${workflowTranslations['academic.disclosure.metrics'][currentLanguage]}`;
    card.appendChild(metricsDiv);

    // Transparency message
    const transparencyDiv = document.createElement('div');
    transparencyDiv.style.fontSize = '0.8rem';
    transparencyDiv.style.color = '#6666ff';
    transparencyDiv.style.fontStyle = 'italic';
    transparencyDiv.style.paddingTop = '0.6rem';
    transparencyDiv.style.borderTop = '1px solid rgba(102, 126, 234, 0.1)';
    transparencyDiv.textContent = workflowTranslations['academic.disclosure.transparency'][currentLanguage];
    card.appendChild(transparencyDiv);

    return card;
  };

  // ========== BEGINNER DEMO (macro-defense) ==========
  const runBeginnerDemo = async () => {
    console.log('[WorkflowDemo] Launching Beginner Demo (macro-defense)');
    messagesContainer.innerHTML = '';

    // Message 1: User
    const msg1Text = workflowTranslations['beginner.message1.user'][currentLanguage];
    await typeInInputAndSend(msg1Text);
    const { bubble: bubble1 } = addMessage(msg1Text, true);
    await safeDelay(TIMING.responseDelay);

    // Message 2: Bot intro with "Why This Works" card
    const msg2IntroText = workflowTranslations['beginner.message2.bot.intro'][currentLanguage];
    const { messageDiv: msg2Div, bubble: msg2Bubble } = addMessage('', false);

    const typingIndicator2 = createTypingIndicator();
    msg2Div.insertBefore(typingIndicator2, msg2Bubble.nextSibling);
    await safeDelay(TIMING.responseDelay);
    typingIndicator2.remove();

    await typeMessage(msg2Bubble, msg2IntroText, 70);

    // Add "Why This Works" card
    msg2Bubble.appendChild(document.createElement('br'));
    const whyCard = createBeginnerWhyCard();
    msg2Bubble.appendChild(whyCard);

    // Add closing text
    msg2Bubble.appendChild(document.createElement('br'));
    const msg2ClosingText = workflowTranslations['beginner.message2.bot.closing'][currentLanguage];
    const closingSpan2 = document.createElement('span');
    closingSpan2.style.color = '#444444';
    closingSpan2.textContent = msg2ClosingText;
    msg2Bubble.appendChild(closingSpan2);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(calculateReadingDelay(msg2IntroText + ' ' + msg2ClosingText, true));

    // Message 3: User
    const msg3Text = workflowTranslations['beginner.message3.user'][currentLanguage];
    await typeInInputAndSend(msg3Text);
    const { bubble: bubble3 } = addMessage(msg3Text, true);
    await safeDelay(TIMING.responseDelay);

    // Message 4: Bot with portfolio proposal and risk card
    const msg4IntroText = workflowTranslations['beginner.message4.bot.intro'][currentLanguage];
    const { messageDiv: msg4Div, bubble: msg4Bubble } = addMessage('', false);

    const typingIndicator4 = createTypingIndicator();
    msg4Div.insertBefore(typingIndicator4, msg4Bubble.nextSibling);
    await safeDelay(TIMING.responseDelay);
    typingIndicator4.remove();

    await typeMessage(msg4Bubble, msg4IntroText, 50);

    // Add portfolio card
    msg4Bubble.appendChild(document.createElement('br'));
    const portfolioCard = createBeginnerPortfolioCard();
    msg4Bubble.appendChild(portfolioCard);

    // Add risk card
    msg4Bubble.appendChild(document.createElement('br'));
    const riskCard = createBeginnerRiskCard();
    msg4Bubble.appendChild(riskCard);

    // Add academic disclosure card
    msg4Bubble.appendChild(document.createElement('br'));
    const academicCard = createAcademicDisclosureCard();
    msg4Bubble.appendChild(academicCard);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(calculateReadingDelay(msg4IntroText, true));

    // Message 5: User
    const msg5Text = workflowTranslations['beginner.message5.user'][currentLanguage];
    await typeInInputAndSend(msg5Text);
    const { bubble: bubble5 } = addMessage(msg5Text, true);
    await safeDelay(TIMING.responseDelay);

    // Message 6: Bot with automation checklist
    const msg6IntroText = workflowTranslations['beginner.message6.bot.intro'][currentLanguage];
    const { messageDiv: msg6Div, bubble: msg6Bubble } = addMessage('', false);

    const typingIndicator6 = createTypingIndicator();
    msg6Div.insertBefore(typingIndicator6, msg6Bubble.nextSibling);
    await safeDelay(TIMING.responseDelay);
    typingIndicator6.remove();

    await typeMessage(msg6Bubble, msg6IntroText, 50);

    // Add checklist card
    msg6Bubble.appendChild(document.createElement('br'));
    const checklistCard = createBeginnerChecklistCard();
    msg6Bubble.appendChild(checklistCard);

    // Add closing text
    msg6Bubble.appendChild(document.createElement('br'));
    const msg6ClosingText = workflowTranslations['beginner.message6.bot.closing'][currentLanguage];
    const closingSpan6 = document.createElement('span');
    closingSpan6.style.color = '#444444';
    closingSpan6.textContent = msg6ClosingText;
    msg6Bubble.appendChild(closingSpan6);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(calculateReadingDelay(msg6IntroText + ' ' + msg6ClosingText, true));

    // Message 7: User
    const msg7Text = workflowTranslations['beginner.message7.user'][currentLanguage];
    await typeInInputAndSend(msg7Text);
    const { bubble: bubble7 } = addMessage(msg7Text, true);
    await safeDelay(TIMING.responseDelay);

    // Message 8: Bot with liquidity and timeline cards
    const msg8IntroText = workflowTranslations['beginner.message8.bot.intro'][currentLanguage];
    const { messageDiv: msg8Div, bubble: msg8Bubble } = addMessage('', false);

    const typingIndicator8 = createTypingIndicator();
    msg8Div.insertBefore(typingIndicator8, msg8Bubble.nextSibling);
    await safeDelay(TIMING.responseDelay);
    typingIndicator8.remove();

    await typeMessage(msg8Bubble, msg8IntroText, 50);

    // Add liquidity card
    msg8Bubble.appendChild(document.createElement('br'));
    const liquidityCard = createBeginnerLiquidityCard();
    msg8Bubble.appendChild(liquidityCard);

    // Add timeline card
    msg8Bubble.appendChild(document.createElement('br'));
    const timelineCard = createBeginnerTimelineCard();
    msg8Bubble.appendChild(timelineCard);

    // Add closing text
    msg8Bubble.appendChild(document.createElement('br'));
    const msg8ClosingText = workflowTranslations['beginner.message8.bot.closing'][currentLanguage];
    const closingSpan8 = document.createElement('span');
    closingSpan8.style.color = '#444444';
    closingSpan8.textContent = msg8ClosingText;
    msg8Bubble.appendChild(closingSpan8);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(calculateReadingDelay(msg8IntroText + ' ' + msg8ClosingText, true));

    // Message 9: User
    const msg9Text = workflowTranslations['beginner.message9.user'][currentLanguage];
    await typeInInputAndSend(msg9Text);
    const { bubble: bubble9 } = addMessage(msg9Text, true);
    await safeDelay(TIMING.responseDelay);

    // Message 10: Bot with backtest card
    const msg10IntroText = workflowTranslations['beginner.message10.bot.intro'][currentLanguage];
    const { messageDiv: msg10Div, bubble: msg10Bubble } = addMessage('', false);

    const typingIndicator10 = createTypingIndicator();
    msg10Div.insertBefore(typingIndicator10, msg10Bubble.nextSibling);
    await safeDelay(TIMING.responseDelay);
    typingIndicator10.remove();

    await typeMessage(msg10Bubble, msg10IntroText, 50);

    // Add backtest card
    msg10Bubble.appendChild(document.createElement('br'));
    const backtestCard = createBeginnerBacktestCard();
    msg10Bubble.appendChild(backtestCard);

    // Add closing text with P.S.
    msg10Bubble.appendChild(document.createElement('br'));
    const msg10ClosingText = workflowTranslations['beginner.message10.bot.closing'][currentLanguage];
    const closingSpan10 = document.createElement('span');
    closingSpan10.style.color = '#444444';
    closingSpan10.textContent = msg10ClosingText;
    msg10Bubble.appendChild(closingSpan10);

    // Add P.S.
    msg10Bubble.appendChild(document.createElement('br'));
    msg10Bubble.appendChild(document.createElement('br'));
    const psText = workflowTranslations['beginner.message10.bot.ps'][currentLanguage];
    const psSpan = document.createElement('span');
    psSpan.style.color = '#888888';
    psSpan.style.fontSize = '0.85rem';
    psSpan.style.fontStyle = 'italic';
    psSpan.textContent = psText;
    msg10Bubble.appendChild(psSpan);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(calculateReadingDelay(msg10IntroText + ' ' + msg10ClosingText + ' ' + psText, true));

    // Message 10.5: User asks about pricing
    const msg10_5Text = workflowTranslations['beginner.message10_5.user'][currentLanguage];
    await typeInInputAndSend(msg10_5Text);
    const { bubble: bubble10_5 } = addMessage(msg10_5Text, true);
    await safeDelay(TIMING.responseDelay);

    // Message 10.5: Bot with pricing card
    const msg10_5IntroText = workflowTranslations['beginner.message10_5.bot.intro'][currentLanguage];
    const { messageDiv: msg10_5Div, bubble: msg10_5Bubble } = addMessage('', false);

    const typingIndicator10_5 = createTypingIndicator();
    msg10_5Div.insertBefore(typingIndicator10_5, msg10_5Bubble.nextSibling);
    await safeDelay(TIMING.responseDelay);
    typingIndicator10_5.remove();

    await typeMessage(msg10_5Bubble, msg10_5IntroText, 50);

    // Add pricing card
    msg10_5Bubble.appendChild(document.createElement('br'));
    const pricingCard = createBeginnerPricingCard();
    msg10_5Bubble.appendChild(pricingCard);

    // Add why cheap text
    msg10_5Bubble.appendChild(document.createElement('br'));
    const whyCheapText = workflowTranslations['beginner.message10_5.bot.why_cheap'][currentLanguage];
    const whyCheapSpan = document.createElement('span');
    whyCheapSpan.style.color = '#444444';
    whyCheapSpan.textContent = whyCheapText;
    msg10_5Bubble.appendChild(whyCheapSpan);

    // Add closing text
    msg10_5Bubble.appendChild(document.createElement('br'));
    msg10_5Bubble.appendChild(document.createElement('br'));
    const msg10_5ClosingText = workflowTranslations['beginner.message10_5.bot.closing'][currentLanguage];
    const closingSpan10_5 = document.createElement('span');
    closingSpan10_5.style.color = '#6666ff';
    closingSpan10_5.style.fontWeight = '700';
    closingSpan10_5.textContent = msg10_5ClosingText;
    msg10_5Bubble.appendChild(closingSpan10_5);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(calculateReadingDelay(msg10_5IntroText + ' ' + whyCheapText + ' ' + msg10_5ClosingText, true));

    // Message 11: User asks about ChatGPT difference
    const msg11Text = workflowTranslations['beginner.message11.user'][currentLanguage];
    await typeInInputAndSend(msg11Text);
    const { bubble: bubble11 } = addMessage(msg11Text, true);
    await safeDelay(TIMING.responseDelay);

    // Message 11: Bot with ChatGPT comparison card
    const msg11IntroText = workflowTranslations['beginner.message11.bot.intro'][currentLanguage];
    const { messageDiv: msg11Div, bubble: msg11Bubble } = addMessage('', false);

    const typingIndicator11 = createTypingIndicator();
    msg11Div.insertBefore(typingIndicator11, msg11Bubble.nextSibling);
    await safeDelay(TIMING.responseDelay);
    typingIndicator11.remove();

    await typeMessage(msg11Bubble, msg11IntroText, 50);

    // Add ChatGPT comparison card
    msg11Bubble.appendChild(document.createElement('br'));
    const chatgptCard = createBeginnerChatGPTCard();
    msg11Bubble.appendChild(chatgptCard);

    // Add closing text
    msg11Bubble.appendChild(document.createElement('br'));
    const msg11ClosingText = workflowTranslations['beginner.message11.bot.closing'][currentLanguage];
    const closingSpan11 = document.createElement('span');
    closingSpan11.style.color = '#444444';
    closingSpan11.textContent = msg11ClosingText;
    msg11Bubble.appendChild(closingSpan11);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(calculateReadingDelay(msg11IntroText + ' ' + msg11ClosingText, true));

    // Message 12: User confirms to proceed
    const msg12Text = workflowTranslations['beginner.message12.user'][currentLanguage];
    await typeInInputAndSend(msg12Text);
    const { bubble: bubble12 } = addMessage(msg12Text, true);
    await safeDelay(TIMING.responseDelay);

    // Message 13: Bot sends closing with next steps
    const msg13IntroText = workflowTranslations['beginner.message13.bot.intro'][currentLanguage];
    const { messageDiv: msg13Div, bubble: msg13Bubble } = addMessage('', false);

    const typingIndicator13 = createTypingIndicator();
    msg13Div.insertBefore(typingIndicator13, msg13Bubble.nextSibling);
    await safeDelay(TIMING.responseDelay);
    typingIndicator13.remove();

    await typeMessage(msg13Bubble, msg13IntroText, 50);

    // Add next steps header
    msg13Bubble.appendChild(document.createElement('br'));
    const nextStepsHeader = document.createElement('div');
    nextStepsHeader.style.fontWeight = '700';
    nextStepsHeader.style.color = '#333333';
    nextStepsHeader.style.marginBottom = '0.4rem';
    nextStepsHeader.textContent = workflowTranslations['beginner.message13.bot.next_steps'][currentLanguage];
    msg13Bubble.appendChild(nextStepsHeader);

    // Add steps
    const steps = workflowTranslations['beginner.message13.bot.steps'];
    steps.forEach(step => {
      const stepDiv = document.createElement('div');
      stepDiv.style.display = 'flex';
      stepDiv.style.alignItems = 'flex-start';
      stepDiv.style.marginBottom = '0.6rem';
      stepDiv.style.paddingLeft = '0.5rem';

      const icon = document.createElement('span');
      icon.style.marginRight = '0.6rem';
      icon.textContent = step.icon;
      stepDiv.appendChild(icon);

      const text = document.createElement('span');
      text.style.color = '#444444';
      text.textContent = step[`step_${currentLanguage}`];
      stepDiv.appendChild(text);

      msg13Bubble.appendChild(stepDiv);
    });

    // Add final closing
    msg13Bubble.appendChild(document.createElement('br'));
    const msg13ClosingText = workflowTranslations['beginner.message13.bot.closing'][currentLanguage];
    const closingSpan13 = document.createElement('span');
    closingSpan13.style.color = '#6666ff';
    closingSpan13.style.fontWeight = '700';
    closingSpan13.textContent = msg13ClosingText;
    msg13Bubble.appendChild(closingSpan13);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    finishDemo('completed');
  };

  // ========== EXPERT DEMO VISUAL HELPERS ==========

  // Create strategy architecture card (4 layers)
  const createExpertStrategyCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['expert.message2.bot.strategy_overview'][currentLanguage];
    card.appendChild(header);

    const layers = workflowTranslations['expert.message2.bot.strategy_layers'];
    const layersContainer = document.createElement('div');
    layersContainer.style.marginTop = '0.5rem';

    layers.forEach((layer, idx) => {
      const layerDiv = document.createElement('div');
      layerDiv.style.padding = '0.5rem';
      layerDiv.style.marginBottom = '0.4rem';
      layerDiv.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
      layerDiv.style.borderRadius = '8px';
      layerDiv.style.borderLeft = '4px solid #6666ff';

      const layerNum = document.createElement('div');
      layerNum.style.fontSize = '0.75rem';
      layerNum.style.fontWeight = '700';
      layerNum.style.color = '#6666ff';
      layerNum.style.marginBottom = '0.4rem';
      layerNum.style.textTransform = 'uppercase';
      layerNum.textContent = `Layer ${idx + 1}`;
      layerDiv.appendChild(layerNum);

      const title = document.createElement('div');
      title.style.fontWeight = '700';
      title.style.color = '#333333';
      title.style.marginBottom = '0.3rem';
      title.style.fontSize = '0.95rem';
      title.innerHTML = `${layer.icon} ${layer[`title_${currentLanguage}`]}`;
      layerDiv.appendChild(title);

      const desc = document.createElement('div');
      desc.style.fontSize = '0.85rem';
      desc.style.color = '#666666';
      desc.style.lineHeight = '1.5';
      desc.textContent = layer[`desc_${currentLanguage}`];
      layerDiv.appendChild(desc);

      layersContainer.appendChild(layerDiv);
    });

    card.appendChild(layersContainer);
    return card;
  };

  // Create risk metrics comparison table
  const createExpertRiskMetricsCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['expert.message4.bot.risk_metrics_title'][currentLanguage];
    card.appendChild(header);

    const metrics = workflowTranslations['expert.message4.bot.risk_comparison'];
    const table = document.createElement('table');
    table.className = 'workflow-demo-metrics-table';
    table.style.width = '100%';
    table.style.marginTop = '0.5rem';

    const headerRow = document.createElement('tr');
    const thMetric = document.createElement('th');
    thMetric.style.textAlign = 'left';
    thMetric.style.fontWeight = '700';
    thMetric.style.color = '#333333';
    thMetric.style.paddingBottom = '0.4rem';
    thMetric.textContent = 'Metric';

    const thStrategy = document.createElement('th');
    thStrategy.style.textAlign = 'right';
    thStrategy.style.fontWeight = '700';
    thStrategy.style.color = '#6666ff';
    thStrategy.style.paddingBottom = '0.4rem';
    thStrategy.textContent = 'Our Strategy';

    const thBench = document.createElement('th');
    thBench.style.textAlign = 'right';
    thBench.style.fontWeight = '700';
    thBench.style.color = '#888888';
    thBench.style.paddingBottom = '0.4rem';
    thBench.textContent = 'Benchmark (SMH)';

    headerRow.appendChild(thMetric);
    headerRow.appendChild(thStrategy);
    headerRow.appendChild(thBench);
    table.appendChild(headerRow);

    metrics.forEach(metric => {
      const tr = document.createElement('tr');
      tr.style.borderTop = '1px solid rgba(102, 126, 234, 0.1)';

      const tdMetric = document.createElement('td');
      tdMetric.style.padding = '0.3rem 0';
      tdMetric.style.fontWeight = '600';
      tdMetric.style.color = '#333333';
      tdMetric.style.fontSize = '0.9rem';
      tdMetric.textContent = metric[`metric_${currentLanguage}`];

      const tdStrategy = document.createElement('td');
      tdStrategy.style.padding = '0.3rem 0.4rem 0.3rem 0';
      tdStrategy.style.textAlign = 'right';
      tdStrategy.style.color = '#6666ff';
      tdStrategy.style.fontWeight = '700';
      tdStrategy.textContent = metric.strategy;

      const tdBench = document.createElement('td');
      tdBench.style.padding = '0.3rem 0';
      tdBench.style.textAlign = 'right';
      tdBench.style.color = '#888888';
      tdBench.textContent = metric.benchmark;

      tr.appendChild(tdMetric);
      tr.appendChild(tdStrategy);
      tr.appendChild(tdBench);
      table.appendChild(tr);
    });

    card.appendChild(table);
    return card;
  };

  // Create stress test scenarios card
  const createExpertStressTestCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['expert.message4.bot.stress_title'][currentLanguage];
    card.appendChild(header);

    const scenarios = workflowTranslations['expert.message4.bot.stress_scenarios'];
    const scenariosContainer = document.createElement('div');
    scenariosContainer.style.marginTop = '0.5rem';

    scenarios.forEach(scenario => {
      const scDiv = document.createElement('div');
      scDiv.style.padding = '0.4rem 0.5rem';
      scDiv.style.marginBottom = '0.4rem';
      scDiv.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
      scDiv.style.borderRadius = '8px';
      scDiv.style.borderLeft = '3px solid #6666ff';

      const periodDiv = document.createElement('div');
      periodDiv.style.fontWeight = '700';
      periodDiv.style.color = '#333333';
      periodDiv.style.marginBottom = '0.3rem';
      periodDiv.textContent = scenario.date;
      scDiv.appendChild(periodDiv);

      const comparisonDiv = document.createElement('div');
      comparisonDiv.style.display = 'grid';
      comparisonDiv.style.gridTemplateColumns = '1fr 1fr';
      comparisonDiv.style.gap = '0.4rem';
      comparisonDiv.style.marginBottom = '0.3rem';

      const smhDiv = document.createElement('div');
      smhDiv.innerHTML = `<div style="font-size: 0.75rem; color: #888888; text-transform: uppercase;">SMH</div><div style="font-weight: 700; color: #f44336; font-size: 1rem;">${scenario.smh_loss || scenario.smh_gain || scenario.smh_dd}</div>`;
      comparisonDiv.appendChild(smhDiv);

      const strategyDiv = document.createElement('div');
      strategyDiv.innerHTML = `<div style="font-size: 0.75rem; color: #6666ff; text-transform: uppercase;">Strategy</div><div style="font-weight: 700; color: #6666ff; font-size: 1rem;">${scenario.strategy_loss || scenario.strategy_gain || scenario.strategy_dd}</div>`;
      comparisonDiv.appendChild(strategyDiv);

      comparisonDiv.appendChild(smhDiv);
      comparisonDiv.appendChild(strategyDiv);
      scDiv.appendChild(comparisonDiv);

      const noteDiv = document.createElement('div');
      noteDiv.style.fontSize = '0.85rem';
      noteDiv.style.color = '#666666';
      noteDiv.style.fontStyle = 'italic';
      noteDiv.style.padding = '0.3rem 0.4rem';
      noteDiv.style.backgroundColor = 'rgba(255, 193, 7, 0.1)';
      noteDiv.style.borderRadius = '4px';
      noteDiv.textContent = scenario[`hedge_benefit_${currentLanguage}`] || scenario[`note_${currentLanguage}`];
      scDiv.appendChild(noteDiv);

      scenariosContainer.appendChild(scDiv);
    });

    card.appendChild(scenariosContainer);
    return card;
  };

  // Create rebalancing rules card
  const createExpertRebalancingCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['expert.message6.bot.rebalancing_title'][currentLanguage];
    card.appendChild(header);

    const rules = workflowTranslations['expert.message6.bot.rebalancing_rules'];
    const rulesContainer = document.createElement('div');
    rulesContainer.style.marginTop = '0.5rem';

    rules.forEach(rule => {
      const ruleDiv = document.createElement('div');
      ruleDiv.style.padding = '0.4rem 0.5rem';
      ruleDiv.style.marginBottom = '0.4rem';
      ruleDiv.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
      ruleDiv.style.borderRadius = '8px';
      ruleDiv.style.borderLeft = '3px solid #6666ff';

      const ruleName = document.createElement('div');
      ruleName.style.fontWeight = '700';
      ruleName.style.color = '#333333';
      ruleName.style.marginBottom = '0.3rem';
      ruleName.innerHTML = `${rule.icon} ${rule[`rule_${currentLanguage}`]}`;
      ruleDiv.appendChild(ruleName);

      const detail = document.createElement('div');
      detail.style.fontSize = '0.85rem';
      detail.style.color = '#666666';
      detail.style.lineHeight = '1.5';
      detail.textContent = rule[`detail_${currentLanguage}`];
      ruleDiv.appendChild(detail);

      rulesContainer.appendChild(ruleDiv);
    });

    card.appendChild(rulesContainer);
    return card;
  };

  // Create black swan events card
  const createExpertBlackSwanCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['expert.message6.bot.black_swan_title'][currentLanguage];
    card.appendChild(header);

    const events = workflowTranslations['expert.message6.bot.black_swan_events'];
    const eventsContainer = document.createElement('div');
    eventsContainer.style.marginTop = '0.5rem';

    // Labels for bilingual support
    const marketLabel = currentLanguage === 'fr' ? 'Marché' : 'Market';
    const strategyLabel = currentLanguage === 'fr' ? 'Stratégie' : 'Strategy';
    const defenseLabel = currentLanguage === 'fr' ? 'Défense' : 'Defense';

    events.forEach(event => {
      const eventDiv = document.createElement('div');
      eventDiv.style.padding = '0.5rem';
      eventDiv.style.marginBottom = '0.4rem';
      eventDiv.style.backgroundColor = 'rgba(244, 67, 54, 0.05)';
      eventDiv.style.borderRadius = '8px';
      eventDiv.style.borderLeft = '3px solid #f44336';

      const eventTitle = document.createElement('div');
      eventTitle.style.fontWeight = '700';
      eventTitle.style.color = '#d32f2f';
      eventTitle.style.marginBottom = '0.4rem';
      eventTitle.style.fontSize = '0.95rem';
      eventTitle.textContent = event[`event_${currentLanguage}`];
      eventDiv.appendChild(eventTitle);

      const metricsGrid = document.createElement('div');
      metricsGrid.style.display = 'grid';
      metricsGrid.style.gridTemplateColumns = '1fr 1fr';
      metricsGrid.style.gap = '0.4rem';

      const markets = document.createElement('div');
      markets.innerHTML = `<div style="font-size: 0.75rem; color: #888888; text-transform: uppercase;">${marketLabel}</div><div style="font-weight: 700; color: #f44336;">${event.market_loss}</div>`;
      metricsGrid.appendChild(markets);

      const strat = document.createElement('div');
      strat.innerHTML = `<div style="font-size: 0.75rem; color: #6666ff; text-transform: uppercase;">${strategyLabel}</div><div style="font-weight: 700; color: #6666ff;">${event.strategy}</div>`;
      metricsGrid.appendChild(strat);

      eventDiv.appendChild(metricsGrid);

      // Add defense explanation
      const defenseDiv = document.createElement('div');
      defenseDiv.style.marginTop = '0.5rem';
      defenseDiv.style.fontSize = '0.85rem';
      defenseDiv.style.color = '#666666';
      defenseDiv.style.fontStyle = 'italic';
      defenseDiv.style.padding = '0.4rem 0.5rem';
      defenseDiv.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
      defenseDiv.style.borderRadius = '4px';
      defenseDiv.textContent = event[`defense_${currentLanguage}`];
      eventDiv.appendChild(defenseDiv);

      eventsContainer.appendChild(eventDiv);
    });

    card.appendChild(eventsContainer);
    return card;
  };

  // Create execution details card
  const createExpertExecutionCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['expert.message8.bot.execution_title'][currentLanguage];
    card.appendChild(header);

    const details = workflowTranslations['expert.message8.bot.execution_details'];
    const detailsContainer = document.createElement('div');
    detailsContainer.style.marginTop = '0.5rem';

    details.forEach(detail => {
      const detailDiv = document.createElement('div');
      detailDiv.style.padding = '0.5rem';
      detailDiv.style.marginBottom = '0.4rem';
      detailDiv.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
      detailDiv.style.borderRadius = '8px';
      detailDiv.style.borderLeft = '3px solid #6666ff';

      const title = document.createElement('div');
      title.style.fontWeight = '700';
      title.style.color = '#333333';
      title.style.marginBottom = '0.3rem';
      title.style.fontSize = '0.95rem';
      title.textContent = detail[`component_${currentLanguage}`];
      detailDiv.appendChild(title);

      const text = document.createElement('div');
      text.style.fontSize = '0.85rem';
      text.style.color = '#666666';
      text.style.lineHeight = '1.5';
      text.textContent = detail[`details_${currentLanguage}`];
      detailDiv.appendChild(text);

      detailsContainer.appendChild(detailDiv);
    });

    card.appendChild(detailsContainer);

    const slippageNote = workflowTranslations['expert.message8.bot.real_slippage'][currentLanguage];
    const slippageDiv = document.createElement('div');
    slippageDiv.style.marginTop = '0.5rem';
    slippageDiv.style.padding = '0.5rem';
    slippageDiv.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
    slippageDiv.style.borderRadius = '8px';
    slippageDiv.style.fontSize = '0.85rem';
    slippageDiv.style.color = '#2e5c3e';
    slippageDiv.style.lineHeight = '1.5';
    slippageDiv.style.borderLeft = '3px solid #4caf50';
    slippageDiv.style.paddingLeft = '0.5rem';
    slippageDiv.textContent = slippageNote;
    card.appendChild(slippageDiv);

    return card;
  };

  // Create implementation timeline card
  const createExpertTimelineCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['expert.message10.bot.timeline_title'][currentLanguage];
    card.appendChild(header);

    const steps = workflowTranslations['expert.message10.bot.timeline_steps'];
    const timelineContainer = document.createElement('div');
    timelineContainer.style.marginTop = '0.5rem';

    steps.forEach((step, stepIndex) => {
      const stepDiv = document.createElement('div');
      stepDiv.style.marginBottom = '0.6rem';
      stepDiv.style.paddingLeft = '0.6rem';
      stepDiv.style.borderLeft = '3px solid #6666ff';
      stepDiv.style.position = 'relative';

      const stepTitle = document.createElement('div');
      stepTitle.style.fontWeight = '700';
      stepTitle.style.color = '#333333';
      stepTitle.style.marginBottom = '0.3rem';
      stepTitle.style.fontSize = '0.95rem';
      stepTitle.textContent = step[`step${currentLanguage === 'en' ? '' : '_fr'}`];
      stepDiv.appendChild(stepTitle);

      const itemsList = document.createElement('div');
      itemsList.style.marginLeft = '0';

      step.items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.style.padding = '0.25rem 0';
        itemDiv.style.fontSize = '0.85rem';
        itemDiv.style.color = '#666666';
        itemDiv.style.lineHeight = '1.4';
        itemDiv.innerHTML = `${item.icon} ${item[`text_${currentLanguage}`]}`;
        itemsList.appendChild(itemDiv);
      });

      stepDiv.appendChild(itemsList);
      timelineContainer.appendChild(stepDiv);
    });

    card.appendChild(timelineContainer);

    const leverageNote = workflowTranslations['expert.message10.bot.leverage_note'][currentLanguage];
    const leverageDiv = document.createElement('div');
    leverageDiv.style.marginTop = '0.5rem';
    leverageDiv.style.padding = '0.5rem';
    leverageDiv.style.backgroundColor = 'rgba(255, 193, 7, 0.1)';
    leverageDiv.style.borderRadius = '8px';
    leverageDiv.style.fontSize = '0.85rem';
    leverageDiv.style.color = '#5d4037';
    leverageDiv.style.lineHeight = '1.5';
    leverageDiv.style.borderLeft = '3px solid #FFC107';
    leverageDiv.style.paddingLeft = '0.5rem';
    leverageDiv.textContent = leverageNote;
    card.appendChild(leverageDiv);

    return card;
  };

  // Create alpha decomposition card
  const createExpertAlphaCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['expert.message12.bot.alpha_breakdown'][currentLanguage];
    card.appendChild(header);

    const sources = workflowTranslations['expert.message12.bot.alpha_sources'];
    const sourcesContainer = document.createElement('div');
    sourcesContainer.style.marginTop = '0.5rem';

    sources.forEach((src, idx) => {
      const srcDiv = document.createElement('div');
      srcDiv.style.padding = '0.5rem';
      srcDiv.style.marginBottom = '0.4rem';
      srcDiv.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
      srcDiv.style.borderRadius = '8px';
      srcDiv.style.borderLeft = '3px solid #6666ff';

      const sourceTitle = document.createElement('div');
      sourceTitle.style.display = 'flex';
      sourceTitle.style.justifyContent = 'space-between';
      sourceTitle.style.alignItems = 'center';
      sourceTitle.style.marginBottom = '0.3rem';

      const title = document.createElement('span');
      title.style.fontWeight = '700';
      title.style.color = '#333333';
      title.textContent = src[`source${currentLanguage === 'en' ? '' : '_fr'}`];

      const alpha = document.createElement('span');
      alpha.style.fontWeight = '700';
      alpha.style.color = '#6666ff';
      alpha.style.fontSize = '1.1rem';
      alpha.textContent = src.alpha;

      sourceTitle.appendChild(title);
      sourceTitle.appendChild(alpha);
      srcDiv.appendChild(sourceTitle);

      const explanation = document.createElement('div');
      explanation.style.fontSize = '0.85rem';
      explanation.style.color = '#666666';
      explanation.style.lineHeight = '1.5';
      explanation.textContent = src[`explanation_${currentLanguage}`];
      srcDiv.appendChild(explanation);

      sourcesContainer.appendChild(srcDiv);
    });

    card.appendChild(sourcesContainer);

    const caveat = workflowTranslations['expert.message12.bot.alpha_caveat'][currentLanguage];
    const caveatDiv = document.createElement('div');
    caveatDiv.style.marginTop = '0.5rem';
    caveatDiv.style.padding = '0.5rem';
    caveatDiv.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
    caveatDiv.style.borderRadius = '8px';
    caveatDiv.style.fontSize = '0.85rem';
    caveatDiv.style.color = '#5d4037';
    caveatDiv.style.lineHeight = '1.5';
    caveatDiv.style.borderLeft = '3px solid #f44336';
    caveatDiv.style.paddingLeft = '0.5rem';
    caveatDiv.textContent = caveat;
    card.appendChild(caveatDiv);

    return card;
  };

  // Create next steps checklist card
  const createExpertNextStepsCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['expert.message13.bot.next_steps'][currentLanguage];
    card.appendChild(header);

    const steps = workflowTranslations['expert.message13.bot.steps'];
    const stepsContainer = document.createElement('div');
    stepsContainer.style.marginTop = '0.5rem';

    steps.forEach((step, idx) => {
      const stepDiv = document.createElement('div');
      stepDiv.style.padding = '0.5rem';
      stepDiv.style.marginBottom = '0.4rem';
      stepDiv.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
      stepDiv.style.borderRadius = '8px';
      stepDiv.style.borderLeft = '3px solid #6666ff';

      const stepText = document.createElement('div');
      stepText.style.fontSize = '0.9rem';
      stepText.style.color = '#333333';
      stepText.style.lineHeight = '1.5';
      stepText.innerHTML = `${step.icon} ${step[`step_${currentLanguage}`]}`;
      stepDiv.appendChild(stepText);

      stepsContainer.appendChild(stepDiv);
    });

    card.appendChild(stepsContainer);
    return card;
  };

  // ========== EXPERT DEMO (semiconductors-sortino) ==========
  const runExpertDemo = async () => {
    console.log('[WorkflowDemo] Launching Expert Demo (semiconductors-sortino)');
    messagesContainer.innerHTML = '';

    // Message 1: User
    const msg1Text = workflowTranslations['expert.message1.user'][currentLanguage];
    await typeInInputAndSend(msg1Text);
    const { bubble: bubble1 } = addMessage(msg1Text, true);
    await safeDelay(TIMING.responseDelay);

    // Message 2: Bot intro with strategy architecture
    const msg2IntroText = workflowTranslations['expert.message2.bot.intro'][currentLanguage];
    const { messageDiv: msg2Div, bubble: msg2Bubble } = addMessage('', false);

    const typingIndicator2 = createTypingIndicator();
    msg2Div.insertBefore(typingIndicator2, msg2Bubble.nextSibling);
    await safeDelay(TIMING.responseDelay);
    typingIndicator2.remove();

    await typeMessage(msg2Bubble, msg2IntroText, 50);

    // Add strategy card
    msg2Bubble.appendChild(document.createElement('br'));
    const strategyCard = createExpertStrategyCard();
    msg2Bubble.appendChild(strategyCard);

    // Add closing text
    msg2Bubble.appendChild(document.createElement('br'));
    const msg2ClosingText = workflowTranslations['expert.message2.bot.closing'][currentLanguage];
    const closingSpan2 = document.createElement('span');
    closingSpan2.style.color = '#444444';
    closingSpan2.textContent = msg2ClosingText;
    msg2Bubble.appendChild(closingSpan2);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(calculateReadingDelay(msg2IntroText + ' ' + msg2ClosingText, true));

    // Message 3: User
    const msg3Text = workflowTranslations['expert.message3.user'][currentLanguage];
    await typeInInputAndSend(msg3Text);
    const { bubble: bubble3 } = addMessage(msg3Text, true);
    await safeDelay(TIMING.responseDelay);

    // Message 4: Bot with risk metrics and stress tests
    const msg4IntroText = workflowTranslations['expert.message4.bot.intro'][currentLanguage];
    const { messageDiv: msg4Div, bubble: msg4Bubble } = addMessage('', false);

    const typingIndicator4 = createTypingIndicator();
    msg4Div.insertBefore(typingIndicator4, msg4Bubble.nextSibling);
    await safeDelay(TIMING.responseDelay);
    typingIndicator4.remove();

    await typeMessage(msg4Bubble, msg4IntroText, 50);

    // Add risk metrics card
    msg4Bubble.appendChild(document.createElement('br'));
    const riskMetricsCard = createExpertRiskMetricsCard();
    msg4Bubble.appendChild(riskMetricsCard);

    // Add stress test card
    msg4Bubble.appendChild(document.createElement('br'));
    const stressTestCard = createExpertStressTestCard();
    msg4Bubble.appendChild(stressTestCard);

    // Add closing text
    msg4Bubble.appendChild(document.createElement('br'));
    const msg4ClosingText = workflowTranslations['expert.message4.bot.closing'][currentLanguage];
    const closingSpan4 = document.createElement('span');
    closingSpan4.style.color = '#444444';
    closingSpan4.textContent = msg4ClosingText;
    msg4Bubble.appendChild(closingSpan4);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(calculateReadingDelay(msg4IntroText + ' ' + msg4ClosingText, true));

    // Message 5: User
    const msg5Text = workflowTranslations['expert.message5.user'][currentLanguage];
    await typeInInputAndSend(msg5Text);
    const { bubble: bubble5 } = addMessage(msg5Text, true);
    await safeDelay(TIMING.responseDelay);

    // Message 6: Bot with rebalancing and black swan cards
    const msg6IntroText = workflowTranslations['expert.message6.bot.intro'][currentLanguage];
    const { messageDiv: msg6Div, bubble: msg6Bubble } = addMessage('', false);

    const typingIndicator6 = createTypingIndicator();
    msg6Div.insertBefore(typingIndicator6, msg6Bubble.nextSibling);
    await safeDelay(TIMING.responseDelay);
    typingIndicator6.remove();

    await typeMessage(msg6Bubble, msg6IntroText, 50);

    // Add rebalancing card
    msg6Bubble.appendChild(document.createElement('br'));
    const rebalancingCard = createExpertRebalancingCard();
    msg6Bubble.appendChild(rebalancingCard);

    // Add black swan card
    msg6Bubble.appendChild(document.createElement('br'));
    const blackSwanCard = createExpertBlackSwanCard();
    msg6Bubble.appendChild(blackSwanCard);

    // Add closing text
    msg6Bubble.appendChild(document.createElement('br'));
    const msg6ClosingText = workflowTranslations['expert.message6.bot.closing'][currentLanguage];
    const closingSpan6 = document.createElement('span');
    closingSpan6.style.color = '#444444';
    closingSpan6.textContent = msg6ClosingText;
    msg6Bubble.appendChild(closingSpan6);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(calculateReadingDelay(msg6IntroText + ' ' + msg6ClosingText, true));

    // Message 7: User
    const msg7Text = workflowTranslations['expert.message7.user'][currentLanguage];
    await typeInInputAndSend(msg7Text);
    const { bubble: bubble7 } = addMessage(msg7Text, true);
    await safeDelay(TIMING.responseDelay);

    // Message 8: Bot with execution card
    const msg8IntroText = workflowTranslations['expert.message8.bot.intro'][currentLanguage];
    const { messageDiv: msg8Div, bubble: msg8Bubble } = addMessage('', false);

    const typingIndicator8 = createTypingIndicator();
    msg8Div.insertBefore(typingIndicator8, msg8Bubble.nextSibling);
    await safeDelay(TIMING.responseDelay);
    typingIndicator8.remove();

    await typeMessage(msg8Bubble, msg8IntroText, 50);

    // Add execution card
    msg8Bubble.appendChild(document.createElement('br'));
    const executionCard = createExpertExecutionCard();
    msg8Bubble.appendChild(executionCard);

    // Add academic disclosure card
    msg8Bubble.appendChild(document.createElement('br'));
    const academicCardExpert = createAcademicDisclosureCard();
    msg8Bubble.appendChild(academicCardExpert);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(calculateReadingDelay(msg8IntroText, true));

    // Message 9: User
    const msg9Text = workflowTranslations['expert.message9.user'][currentLanguage];
    await typeInInputAndSend(msg9Text);
    const { bubble: bubble9 } = addMessage(msg9Text, true);
    await safeDelay(TIMING.responseDelay);

    // Message 10: Bot with timeline and implementation
    const msg10IntroText = workflowTranslations['expert.message10.bot.intro'][currentLanguage];
    const { messageDiv: msg10Div, bubble: msg10Bubble } = addMessage('', false);

    const typingIndicator10 = createTypingIndicator();
    msg10Div.insertBefore(typingIndicator10, msg10Bubble.nextSibling);
    await safeDelay(TIMING.responseDelay);
    typingIndicator10.remove();

    await typeMessage(msg10Bubble, msg10IntroText, 50);

    // Add timeline card
    msg10Bubble.appendChild(document.createElement('br'));
    const timelineCard = createExpertTimelineCard();
    msg10Bubble.appendChild(timelineCard);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(calculateReadingDelay(msg10IntroText, true));

    // Message 11: User
    const msg11Text = workflowTranslations['expert.message11.user'][currentLanguage];
    await typeInInputAndSend(msg11Text);
    const { bubble: bubble11 } = addMessage(msg11Text, true);
    await safeDelay(TIMING.responseDelay);

    // Message 12: Bot with alpha decomposition
    const msg12IntroText = workflowTranslations['expert.message12.bot.intro'][currentLanguage];
    const { messageDiv: msg12Div, bubble: msg12Bubble } = addMessage('', false);

    const typingIndicator12 = createTypingIndicator();
    msg12Div.insertBefore(typingIndicator12, msg12Bubble.nextSibling);
    await safeDelay(TIMING.responseDelay);
    typingIndicator12.remove();

    await typeMessage(msg12Bubble, msg12IntroText, 50);

    // Add alpha card
    msg12Bubble.appendChild(document.createElement('br'));
    const alphaCard = createExpertAlphaCard();
    msg12Bubble.appendChild(alphaCard);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(calculateReadingDelay(msg12IntroText, true));

    // Message 13: Bot closing with next steps
    const msg13IntroText = workflowTranslations['expert.message13.bot.intro'][currentLanguage];
    const { messageDiv: msg13Div, bubble: msg13Bubble } = addMessage('', false);

    const typingIndicator13 = createTypingIndicator();
    msg13Div.insertBefore(typingIndicator13, msg13Bubble.nextSibling);
    await safeDelay(TIMING.responseDelay);
    typingIndicator13.remove();

    await typeMessage(msg13Bubble, msg13IntroText, 50);

    // Add next steps card
    msg13Bubble.appendChild(document.createElement('br'));
    const nextStepsCard = createExpertNextStepsCard();
    msg13Bubble.appendChild(nextStepsCard);

    // Add closing text
    msg13Bubble.appendChild(document.createElement('br'));
    const msg13ClosingText = workflowTranslations['expert.message13.bot.closing'][currentLanguage];
    const closingSpan13 = document.createElement('span');
    closingSpan13.style.color = '#444444';
    closingSpan13.textContent = msg13ClosingText;
    msg13Bubble.appendChild(closingSpan13);

    // Add P.S.
    msg13Bubble.appendChild(document.createElement('br'));
    msg13Bubble.appendChild(document.createElement('br'));
    const psText = workflowTranslations['expert.message13.bot.ps'][currentLanguage];
    const psSpan = document.createElement('span');
    psSpan.style.color = '#888888';
    psSpan.style.fontSize = '0.85rem';
    psSpan.style.fontStyle = 'italic';
    psSpan.textContent = psText;
    msg13Bubble.appendChild(psSpan);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(calculateReadingDelay(msg13IntroText + ' ' + msg13ClosingText + ' ' + psText, true));

    // Message 14: User confirms to proceed with paper trading
    const msg14Text = workflowTranslations['expert.message14.user'][currentLanguage];
    await typeInInputAndSend(msg14Text);
    const { bubble: bubble14 } = addMessage(msg14Text, true);
    await safeDelay(TIMING.responseDelay);

    // Message 15: Bot sends closing with setup steps
    const msg15IntroText = workflowTranslations['expert.message15.bot.intro'][currentLanguage];
    const { messageDiv: msg15Div, bubble: msg15Bubble } = addMessage('', false);

    const typingIndicator15 = createTypingIndicator();
    msg15Div.insertBefore(typingIndicator15, msg15Bubble.nextSibling);
    await safeDelay(TIMING.responseDelay);
    typingIndicator15.remove();

    await typeMessage(msg15Bubble, msg15IntroText, 50);

    // Add setup header
    msg15Bubble.appendChild(document.createElement('br'));
    const setupHeader = document.createElement('div');
    setupHeader.style.fontWeight = '700';
    setupHeader.style.color = '#333333';
    setupHeader.style.marginBottom = '0.4rem';
    setupHeader.textContent = workflowTranslations['expert.message15.bot.setup'][currentLanguage];
    msg15Bubble.appendChild(setupHeader);

    // Add setup steps
    const setupSteps = workflowTranslations['expert.message15.bot.setup_steps'];
    setupSteps.forEach(step => {
      const stepDiv = document.createElement('div');
      stepDiv.style.display = 'flex';
      stepDiv.style.alignItems = 'flex-start';
      stepDiv.style.marginBottom = '0.6rem';
      stepDiv.style.paddingLeft = '0.5rem';

      const icon = document.createElement('span');
      icon.style.marginRight = '0.6rem';
      icon.textContent = step.icon;
      stepDiv.appendChild(icon);

      const text = document.createElement('span');
      text.style.color = '#444444';
      text.textContent = step[`step_${currentLanguage}`];
      stepDiv.appendChild(text);

      msg15Bubble.appendChild(stepDiv);
    });

    // Add final closing
    msg15Bubble.appendChild(document.createElement('br'));
    const msg15ClosingText = workflowTranslations['expert.message15.bot.closing'][currentLanguage];
    const closingSpan15 = document.createElement('span');
    closingSpan15.style.color = '#6666ff';
    closingSpan15.style.fontWeight = '700';
    closingSpan15.textContent = msg15ClosingText;
    msg15Bubble.appendChild(closingSpan15);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    finishDemo('completed');
  };

  // Wealth manager demo trigger buttons
  const wealthDemoTrigger = document.getElementById('wealth-demo-trigger');
  const wealthDemoTriggerCta = document.getElementById('wealth-demo-trigger-cta');

  const handleWealthDemoClick = () => {
    const knowledgeOverlay = document.getElementById('knowledge-overlay');
    if (knowledgeOverlay) {
      window.dispatchEvent(new CustomEvent('openKnowledgeOverlay', {
        detail: { entryPoint: 'professional_demo' }
      }));
      return;
    }
    currentScenario = 'semiconductors-sortino'; // Expert demo fallback
    launchWorkflowDemo();
  };

  if (wealthDemoTrigger) {
    wealthDemoTrigger.addEventListener('click', handleWealthDemoClick);
  }

  if (wealthDemoTriggerCta) {
    wealthDemoTriggerCta.addEventListener('click', handleWealthDemoClick);
  }

  // Ensure overlay hidden on load
  closeDemo();
});
