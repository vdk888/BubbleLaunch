/**
 * BubbleAgentMemory - Unified persistent memory for the Bubble AI Agent
 *
 * Purpose: Single source of truth for user profile, journey, and conversation memory
 * Storage: localStorage (persists forever until user clears)
 *
 * Architecture follows Anthropic best practices:
 * - Self-contained, error-robust, token-efficient
 * - Graceful degradation if localStorage unavailable
 * - GDPR-ready with reset capability
 *
 * @version 1.0.0
 * @author Bubble Invest
 */
const BubbleAgentMemory = (function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTANTS
  // ═══════════════════════════════════════════════════════════════════════════

  const STORAGE_KEY = 'bubbleUnifiedAgent';
  const VERSION = '1.0.0';
  const MAX_INSIGHTS = 50;
  const MAX_KEY_INSIGHTS = 30;
  const MAX_EMOTIONAL_RESPONSES = 20;
  const MAX_STRATEGIES_TESTED = 50;
  const MAX_QUESTIONS_ASKED = 50;
  const DEBUG = false; // Set to true for development logging

  // ═══════════════════════════════════════════════════════════════════════════
  // DEFAULT STATE STRUCTURE
  // ═══════════════════════════════════════════════════════════════════════════

  const DEFAULT_STATE = {
    version: VERSION,
    createdAt: null,
    lastUpdated: null,

    // Progressive profile (entonnoir)
    profile: {
      riskScore: null,           // 0-100 (null = not yet determined)
      riskConfidence: 0,         // 0-100 (how confident are we in this score)
      traits: [],                // ['patient', 'analytical', 'risk-averse', ...]
      investmentGoal: null,      // 'retirement', 'house', 'growth', 'learn', ...
      investmentHorizon: null,   // 'short', 'medium', 'long', 'very_long'
      learningStyle: null,       // 'visual', 'dialogue', 'hands_on', 'explore'
      knowledgeLevel: null,      // 'beginner', 'intermediate', 'advanced'
      emotionalResponses: [],    // How they react to scenarios
      rawInsights: [],           // LLM-generated insights from conversations
      preferredLanguage: null    // 'fr', 'en'
    },

    // Journey tracking
    journey: {
      onboardingStarted: null,
      onboardingCompleted: null,
      onboardingProgress: 0,     // 0-100%
      currentOnboardingStage: null, // Current stage identifier
      pagesVisited: [],          // [{page, timestamp, duration}]
      actionsPerformed: [],      // [{action, context, timestamp}]
      questionsAsked: [],        // Topics user asked about
      strategiesTested: [],      // Allocations user tried in simulator
      lastVisit: null,
      totalVisits: 0
    },

    // Conversation memory (summarized, not full history)
    memory: {
      keyInsights: [],           // Important things learned about user
      topicsDiscussed: [],       // Topics covered
      lastConversationSummary: null,
      conversationCount: 0,
      lastMessageTimestamp: null
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERNAL STATE
  // ═══════════════════════════════════════════════════════════════════════════

  let state = null;
  let isStorageAvailable = true;

  // ═══════════════════════════════════════════════════════════════════════════
  // STORAGE UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Debug logging helper
   */
  function log(...args) {
    if (DEBUG) {
      console.log('[BubbleAgentMemory]', ...args);
    }
  }

  function warn(...args) {
    if (DEBUG) {
      console.warn('[BubbleAgentMemory]', ...args);
    }
  }

  /**
   * Check if localStorage is available
   */
  function checkStorageAvailability() {
    try {
      const testKey = '__bubble_storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn('[BubbleAgentMemory] localStorage not available:', e.message);
      return false;
    }
  }

  /**
   * Deep clone an object
   */
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Deep merge two objects
   */
  function deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION & PERSISTENCE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Initialize or load existing state
   */
  function init() {
    isStorageAvailable = checkStorageAvailability();

    if (!isStorageAvailable) {
      state = createFreshState();
      console.warn('[BubbleAgentMemory] Running in memory-only mode (no persistence)');
      return state;
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Migration if version mismatch
        if (parsed.version !== VERSION) {
          state = migrateState(parsed);
        } else {
          // Merge with defaults to handle any new fields
          state = deepMerge(deepClone(DEFAULT_STATE), parsed);
        }
        // Update visit tracking
        state.journey.lastVisit = new Date().toISOString();
        state.journey.totalVisits++;
        save();
      } catch (e) {
        console.warn('[BubbleAgentMemory] Corrupt state, resetting:', e.message);
        state = createFreshState();
      }
    } else {
      state = createFreshState();
    }

    console.log('[BubbleAgentMemory] Initialized', {
      isNew: !stored,
      onboardingCompleted: !!state.journey.onboardingCompleted,
      riskScore: state.profile.riskScore,
      totalVisits: state.journey.totalVisits
    });

    return state;
  }

  /**
   * Create a fresh state
   */
  function createFreshState() {
    const now = new Date().toISOString();
    const fresh = deepClone(DEFAULT_STATE);
    fresh.createdAt = now;
    fresh.lastUpdated = now;
    fresh.journey.lastVisit = now;
    fresh.journey.totalVisits = 1;

    if (isStorageAvailable) {
      save(fresh);
    }

    return fresh;
  }

  /**
   * Migrate state from older version
   */
  function migrateState(oldState) {
    console.log('[BubbleAgentMemory] Migrating from version', oldState.version, 'to', VERSION);

    // Merge old state with new defaults to preserve data and add new fields
    const migrated = deepMerge(deepClone(DEFAULT_STATE), oldState);
    migrated.version = VERSION;
    migrated.lastUpdated = new Date().toISOString();

    if (isStorageAvailable) {
      save(migrated);
    }

    return migrated;
  }

  /**
   * Save state to localStorage
   */
  function save(stateToSave = state) {
    if (!isStorageAvailable) return false;

    try {
      stateToSave.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      return true;
    } catch (e) {
      // Handle quota exceeded
      if (e.name === 'QuotaExceededError') {
        console.warn('[BubbleAgentMemory] Storage quota exceeded, trimming data');
        trimOldData();
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
          return true;
        } catch (e2) {
          console.error('[BubbleAgentMemory] Failed to save even after trimming:', e2.message);
        }
      }
      return false;
    }
  }

  /**
   * Trim old data to free up space
   */
  function trimOldData() {
    // Keep only recent data
    if (state.profile.rawInsights.length > 20) {
      state.profile.rawInsights = state.profile.rawInsights.slice(-20);
    }
    if (state.profile.emotionalResponses.length > 10) {
      state.profile.emotionalResponses = state.profile.emotionalResponses.slice(-10);
    }
    if (state.memory.keyInsights.length > 15) {
      state.memory.keyInsights = state.memory.keyInsights.slice(-15);
    }
    if (state.journey.pagesVisited.length > 50) {
      state.journey.pagesVisited = state.journey.pagesVisited.slice(-50);
    }
    if (state.journey.actionsPerformed.length > 50) {
      state.journey.actionsPerformed = state.journey.actionsPerformed.slice(-50);
    }
    if (state.journey.strategiesTested.length > 25) {
      state.journey.strategiesTested = state.journey.strategiesTested.slice(-25);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFILE METHODS (Entonnoir - Progressive Building)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Update risk score with new data point
   * Uses weighted average to refine progressively
   * @param {number} newDataPoint - New risk score data (0-100)
   * @param {number} weight - Weight of this data point (default 1)
   */
  function updateRiskScore(newDataPoint, weight = 1) {
    if (typeof newDataPoint !== 'number' || newDataPoint < 0 || newDataPoint > 100) {
      console.warn('[BubbleAgentMemory] Invalid risk score:', newDataPoint);
      return;
    }

    if (state.profile.riskScore === null) {
      // First data point
      state.profile.riskScore = Math.round(newDataPoint);
      state.profile.riskConfidence = Math.min(20, weight * 10);
    } else {
      // Weighted average
      const currentWeight = state.profile.riskConfidence / 100;
      const newWeight = weight * 0.2;
      state.profile.riskScore = Math.round(
        (state.profile.riskScore * currentWeight + newDataPoint * newWeight) /
        (currentWeight + newWeight)
      );
      state.profile.riskConfidence = Math.min(100, state.profile.riskConfidence + weight * 10);
    }
    save();
  }

  /**
   * Adjust risk score by delta
   * @param {number} adjustment - Amount to adjust (-30 to +30 typical)
   * @param {number} weight - Weight of this adjustment
   */
  function adjustRiskScore(adjustment, weight = 1) {
    if (state.profile.riskScore === null) {
      // Start from neutral 50
      state.profile.riskScore = 50 + adjustment;
      state.profile.riskConfidence = Math.min(20, weight * 10);
    } else {
      state.profile.riskScore = Math.max(0, Math.min(100, state.profile.riskScore + adjustment));
      state.profile.riskConfidence = Math.min(100, state.profile.riskConfidence + weight * 5);
    }
    state.profile.riskScore = Math.round(state.profile.riskScore);
    save();
  }

  /**
   * Add a personality trait
   * @param {string} trait - Trait to add
   */
  function addTrait(trait) {
    if (!trait || typeof trait !== 'string') return;
    const normalizedTrait = trait.toLowerCase().trim();
    if (!state.profile.traits.includes(normalizedTrait)) {
      state.profile.traits.push(normalizedTrait);
      // Keep only last 15 traits
      if (state.profile.traits.length > 15) {
        state.profile.traits = state.profile.traits.slice(-15);
      }
      save();
    }
  }

  /**
   * Add multiple traits at once
   * @param {string[]} traits - Array of traits
   */
  function addTraits(traits) {
    if (!Array.isArray(traits)) return;
    traits.forEach(trait => addTrait(trait));
  }

  /**
   * Add an insight from conversation
   * @param {string} insight - Insight text
   */
  function addInsight(insight) {
    if (!insight || typeof insight !== 'string') return;
    state.profile.rawInsights.push({
      insight: insight.trim(),
      timestamp: new Date().toISOString()
    });
    // Keep only last MAX_INSIGHTS
    if (state.profile.rawInsights.length > MAX_INSIGHTS) {
      state.profile.rawInsights = state.profile.rawInsights.slice(-MAX_INSIGHTS);
    }
    save();
  }

  /**
   * Set investment goal
   * @param {string} goal - Goal identifier
   */
  function setGoal(goal) {
    if (!goal) return;
    state.profile.investmentGoal = goal.toLowerCase().trim();
    save();
  }

  /**
   * Set investment horizon
   * @param {string} horizon - 'short', 'medium', 'long', 'very_long'
   */
  function setHorizon(horizon) {
    const valid = ['short', 'medium', 'long', 'very_long'];
    if (valid.includes(horizon)) {
      state.profile.investmentHorizon = horizon;
      save();
    }
  }

  /**
   * Set knowledge level
   * @param {string} level - 'beginner', 'intermediate', 'advanced'
   */
  function setKnowledgeLevel(level) {
    const valid = ['beginner', 'intermediate', 'advanced'];
    if (valid.includes(level)) {
      state.profile.knowledgeLevel = level;
      save();
    }
  }

  /**
   * Set learning style
   * @param {string} style - 'visual', 'dialogue', 'hands_on', 'explore'
   */
  function setLearningStyle(style) {
    const valid = ['visual', 'dialogue', 'hands_on', 'explore'];
    if (valid.includes(style)) {
      state.profile.learningStyle = style;
      save();
    }
  }

  /**
   * Set preferred language
   * @param {string} lang - 'fr' or 'en'
   */
  function setPreferredLanguage(lang) {
    const valid = ['fr', 'en'];
    if (valid.includes(lang)) {
      state.profile.preferredLanguage = lang;
      save();
    }
  }

  /**
   * Add emotional response to scenario
   * @param {string} scenario - Scenario description
   * @param {string} response - User's response
   * @param {number} score - Score impact on risk profile (-30 to +30 typical)
   */
  function addEmotionalResponse(scenario, response, score) {
    // Validate inputs
    if (!scenario || typeof scenario !== 'string') return;
    if (!response || typeof response !== 'string') return;
    if (typeof score !== 'number' || isNaN(score)) return;

    state.profile.emotionalResponses.push({
      scenario: scenario.trim(),
      response: response.trim(),
      score: Math.max(-50, Math.min(50, score)), // Clamp to reasonable range
      timestamp: new Date().toISOString()
    });
    // Keep only last MAX_EMOTIONAL_RESPONSES
    if (state.profile.emotionalResponses.length > MAX_EMOTIONAL_RESPONSES) {
      state.profile.emotionalResponses = state.profile.emotionalResponses.slice(-MAX_EMOTIONAL_RESPONSES);
    }
    save();
  }

  /**
   * Apply profile update from LLM extraction
   * @param {Object} update - Profile update object from LLM
   */
  function applyProfileUpdate(update) {
    if (!update || typeof update !== 'object') return;

    if (typeof update.riskScoreAdjustment === 'number') {
      adjustRiskScore(update.riskScoreAdjustment, 1);
    }
    if (Array.isArray(update.traits)) {
      addTraits(update.traits);
    }
    if (update.goalHint) {
      setGoal(update.goalHint);
    }
    if (update.horizonHint) {
      setHorizon(update.horizonHint);
    }
    if (update.levelHint) {
      setKnowledgeLevel(update.levelHint);
    }
    if (update.insight) {
      addInsight(update.insight);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // JOURNEY METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Start onboarding
   */
  function startOnboarding() {
    state.journey.onboardingStarted = new Date().toISOString();
    state.journey.onboardingProgress = 0;
    state.journey.currentOnboardingStage = 'welcome';
    save();
  }

  /**
   * Update onboarding progress
   * @param {number} progress - Progress percentage (0-100)
   * @param {string} stage - Current stage identifier
   */
  function updateOnboardingProgress(progress, stage = null) {
    state.journey.onboardingProgress = Math.min(100, Math.max(0, progress));
    if (stage) {
      state.journey.currentOnboardingStage = stage;
    }
    save();
  }

  /**
   * Complete onboarding
   */
  function completeOnboarding() {
    state.journey.onboardingCompleted = new Date().toISOString();
    state.journey.onboardingProgress = 100;
    state.journey.currentOnboardingStage = 'completed';
    save();
  }

  /**
   * Record a page visit
   * @param {string} page - Page identifier
   */
  function recordPageVisit(page) {
    state.journey.pagesVisited.push({
      page,
      timestamp: new Date().toISOString()
    });
    // Keep only last 100 visits
    if (state.journey.pagesVisited.length > 100) {
      state.journey.pagesVisited = state.journey.pagesVisited.slice(-100);
    }
    save();
  }

  /**
   * Record an action
   * @param {string} action - Action identifier
   * @param {Object} context - Additional context
   */
  function recordAction(action, context = {}) {
    state.journey.actionsPerformed.push({
      action,
      context,
      timestamp: new Date().toISOString()
    });
    // Keep only last 100 actions
    if (state.journey.actionsPerformed.length > 100) {
      state.journey.actionsPerformed = state.journey.actionsPerformed.slice(-100);
    }
    save();
  }

  /**
   * Record a question asked
   * @param {string} topic - Topic of the question
   */
  function recordQuestion(topic) {
    if (!topic || typeof topic !== 'string') return;
    if (!state.journey.questionsAsked.includes(topic)) {
      state.journey.questionsAsked.push(topic);
      // Keep only last MAX_QUESTIONS_ASKED
      if (state.journey.questionsAsked.length > MAX_QUESTIONS_ASKED) {
        state.journey.questionsAsked = state.journey.questionsAsked.slice(-MAX_QUESTIONS_ASKED);
      }
      save();
    }
  }

  /**
   * Record a strategy test in simulator
   * @param {Object} allocation - Allocation object
   * @param {Object} metrics - Performance metrics
   */
  function recordStrategyTest(allocation, metrics) {
    state.journey.strategiesTested.push({
      allocation,
      metrics,
      timestamp: new Date().toISOString()
    });
    // Keep only last MAX_STRATEGIES_TESTED
    if (state.journey.strategiesTested.length > MAX_STRATEGIES_TESTED) {
      state.journey.strategiesTested = state.journey.strategiesTested.slice(-MAX_STRATEGIES_TESTED);
    }
    save();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MEMORY METHODS (Conversation Summaries)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Add a key insight about the user
   * @param {string} insight - Insight text
   * @param {string} source - Where this insight came from
   */
  function addKeyInsight(insight, source = 'conversation') {
    state.memory.keyInsights.push({
      insight,
      source,
      timestamp: new Date().toISOString()
    });
    // Keep last MAX_KEY_INSIGHTS
    if (state.memory.keyInsights.length > MAX_KEY_INSIGHTS) {
      state.memory.keyInsights = state.memory.keyInsights.slice(-MAX_KEY_INSIGHTS);
    }
    save();
  }

  /**
   * Record a topic discussed
   * @param {string} topic - Topic identifier
   */
  function recordTopic(topic) {
    if (!state.memory.topicsDiscussed.includes(topic)) {
      state.memory.topicsDiscussed.push(topic);
      // Keep last 50 topics
      if (state.memory.topicsDiscussed.length > 50) {
        state.memory.topicsDiscussed = state.memory.topicsDiscussed.slice(-50);
      }
      save();
    }
  }

  /**
   * Set conversation summary
   * @param {string} summary - Summary text
   */
  function setConversationSummary(summary) {
    state.memory.lastConversationSummary = summary;
    state.memory.conversationCount++;
    state.memory.lastMessageTimestamp = new Date().toISOString();
    save();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get profile data
   */
  function getProfile() {
    return deepClone(state.profile);
  }

  /**
   * Get journey data
   */
  function getJourney() {
    return deepClone(state.journey);
  }

  /**
   * Get memory data
   */
  function getMemory() {
    return deepClone(state.memory);
  }

  /**
   * Get full state (for debugging)
   */
  function getFullState() {
    return deepClone(state);
  }

  /**
   * Get a summary suitable for sending to the LLM
   * Token-efficient format following Anthropic best practices
   */
  function getContextForLLM() {
    return {
      profile: {
        riskScore: state.profile.riskScore,
        riskConfidence: state.profile.riskConfidence,
        traits: state.profile.traits.slice(-5),
        goal: state.profile.investmentGoal,
        horizon: state.profile.investmentHorizon,
        level: state.profile.knowledgeLevel,
        style: state.profile.learningStyle,
        language: state.profile.preferredLanguage
      },
      journey: {
        onboardingCompleted: !!state.journey.onboardingCompleted,
        onboardingProgress: state.journey.onboardingProgress,
        currentStage: state.journey.currentOnboardingStage,
        pagesVisitedCount: state.journey.pagesVisited.length,
        lastPage: state.journey.pagesVisited.slice(-1)[0]?.page || null,
        strategiesTestedCount: state.journey.strategiesTested.length,
        totalVisits: state.journey.totalVisits,
        isReturningUser: state.journey.totalVisits > 1
      },
      memory: {
        keyInsights: state.memory.keyInsights.slice(-5).map(i => i.insight),
        topicsDiscussed: state.memory.topicsDiscussed.slice(-10),
        conversationCount: state.memory.conversationCount,
        lastSummary: state.memory.lastConversationSummary
      }
    };
  }

  /**
   * Check if onboarding is completed
   */
  function isOnboardingCompleted() {
    return !!state.journey.onboardingCompleted;
  }

  /**
   * Get onboarding progress
   */
  function getOnboardingProgress() {
    return state.journey.onboardingProgress;
  }

  /**
   * Check if user is returning
   */
  function isReturningUser() {
    return state.journey.totalVisits > 1;
  }

  /**
   * Get time since last visit in hours
   */
  function getHoursSinceLastVisit() {
    if (!state.journey.lastVisit) return 0;
    const lastVisit = new Date(state.journey.lastVisit);
    const now = new Date();
    return Math.floor((now - lastVisit) / (1000 * 60 * 60));
  }

  /**
   * Get recommended allocation based on risk score
   */
  function getRecommendedAllocation() {
    const score = state.profile.riskScore;
    if (score === null) return null;

    // Map risk score to allocation
    // Lower score = more conservative (more bonds)
    // Higher score = more aggressive (more stocks)
    const stockPercent = Math.round(score * 0.8); // 0-80% stocks
    const bondPercent = Math.round((100 - score) * 0.6); // 60-0% bonds
    const goldPercent = 100 - stockPercent - bondPercent;

    return {
      stocks: stockPercent,
      bonds: bondPercent,
      gold: Math.max(5, goldPercent), // Minimum 5% gold
      riskScore: score,
      confidence: state.profile.riskConfidence,
      profileName: getProfileName(score)
    };
  }

  /**
   * Get profile name based on risk score
   */
  function getProfileName(score) {
    if (score === null) return null;
    if (score < 20) return 'Très Prudent';
    if (score < 40) return 'Prudent';
    if (score < 60) return 'Équilibré';
    if (score < 80) return 'Dynamique';
    return 'Offensif';
  }

  /**
   * Get welcome back message data
   */
  function getWelcomeBackData() {
    if (!isReturningUser()) return null;

    const hoursSince = getHoursSinceLastVisit();
    const profile = getProfile();
    const journey = getJourney();

    return {
      hoursSinceLastVisit: hoursSince,
      daysSinceLastVisit: Math.floor(hoursSince / 24),
      onboardingCompleted: journey.onboardingCompleted,
      onboardingProgress: journey.onboardingProgress,
      riskScore: profile.riskScore,
      profileName: getProfileName(profile.riskScore),
      lastPage: journey.pagesVisited.slice(-1)[0]?.page,
      strategiesCount: journey.strategiesTested.length,
      conversationCount: state.memory.conversationCount
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESET & GDPR
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Reset all data (GDPR compliance)
   */
  function reset() {
    state = createFreshState();
    console.log('[BubbleAgentMemory] State reset');
    return true;
  }

  /**
   * Reset only profile (keep journey for analytics)
   */
  function resetProfile() {
    state.profile = deepClone(DEFAULT_STATE.profile);
    save();
    console.log('[BubbleAgentMemory] Profile reset');
  }

  /**
   * Export all data (GDPR compliance)
   */
  function exportData() {
    return {
      exportedAt: new Date().toISOString(),
      data: deepClone(state)
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  // Initialize on load
  init();

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    // Profile
    updateRiskScore,
    adjustRiskScore,
    addTrait,
    addTraits,
    addInsight,
    setGoal,
    setHorizon,
    setKnowledgeLevel,
    setLearningStyle,
    setPreferredLanguage,
    addEmotionalResponse,
    applyProfileUpdate,

    // Journey
    startOnboarding,
    updateOnboardingProgress,
    completeOnboarding,
    recordPageVisit,
    recordAction,
    recordQuestion,
    recordStrategyTest,

    // Memory
    addKeyInsight,
    recordTopic,
    setConversationSummary,

    // Getters
    getProfile,
    getJourney,
    getMemory,
    getFullState,
    getContextForLLM,
    isOnboardingCompleted,
    getOnboardingProgress,
    isReturningUser,
    getHoursSinceLastVisit,
    getRecommendedAllocation,
    getProfileName,
    getWelcomeBackData,

    // Reset & GDPR
    reset,
    resetProfile,
    exportData,

    // Re-init (for testing)
    init
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BubbleAgentMemory;
}
