/**
 * BubbleAgentMemory - Unified persistent memory for the Bubble AI Agent
 *
 * Purpose: Single source of truth for visitor profile, journey, and conversation memory
 * Storage: localStorage (persists forever until user clears)
 *
 * Architecture follows Anthropic best practices:
 * - Self-contained, error-robust, token-efficient
 * - Graceful degradation if localStorage unavailable
 * - GDPR-ready with reset capability
 *
 * v2.0.0 — Redesigned for Bubble's new business model:
 *   B2C = free content/showcase/marketing (not a product)
 *   B2B = custom AI agent consulting & implementation (core revenue)
 *
 * @version 2.0.0
 * @author Bubble Invest
 */
const BubbleAgentMemory = (function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTANTS
  // ═══════════════════════════════════════════════════════════════════════════

  const STORAGE_KEY = 'bubbleUnifiedAgent';
  const VERSION = '2.0.0';
  const MAX_INSIGHTS = 50;
  const MAX_KEY_INSIGHTS = 30;
  const MAX_CONTENT_VIEWED = 50;
  const MAX_QUESTIONS_ASKED = 50;
  const DEBUG = false; // Set to true for development logging

  // ═══════════════════════════════════════════════════════════════════════════
  // DEFAULT STATE STRUCTURE
  // ═══════════════════════════════════════════════════════════════════════════

  const DEFAULT_STATE = {
    version: VERSION,
    createdAt: null,
    lastUpdated: null,

    // Visitor profile (progressive)
    profile: {
      visitorType: null,           // 'individual' | 'professional' | null
      interestArea: null,          // 'poc_showcase' | 'ai_consulting' | 'newsletter' | 'blog' | 'learn_ai'
      // Professional-specific
      companyType: null,           // 'wealth_manager' | 'cgp' | 'sme' | 'startup' | 'independent' | 'asset_manager'
      companySize: null,           // 'solo' | 'small' | 'medium'
      industry: null,              // 'finance' | 'tech' | 'other'
      painPoint: null,             // 'too_many_tools' | 'no_internal_skills' | 'fear_of_falling_behind' | 'generic_solutions' | 'need_trusted_guide'
      projectScope: null,          // 'diagnostic' | 'targeted_automation' | 'full_project'
      aiMaturity: null,            // 'unaware' | 'curious' | 'experimenting' | 'deploying'
      // Individual-specific
      followChannels: [],          // ['linkedin', 'substack', 'github', 'instagram', 'x', 'youtube']
      contentInterests: [],        // ['investment_agent', 'ai_agents', 'tutorials', 'philosophy', 'build_in_public', 'demystification']
      // Shared
      traits: [],                  // ['early_adopter', 'tech_forward', 'pragmatic', 'curious', ...]
      knowledgeLevel: null,        // 'beginner' | 'intermediate' | 'advanced'
      learningStyle: null,         // 'visual' | 'dialogue' | 'hands_on' | 'explore'
      preferredLanguage: null,     // 'fr' | 'en'
      rawInsights: []              // LLM-generated insights from conversations
    },

    // Journey tracking
    journey: {
      firstContactType: null,      // 'chat' | 'newsletter' | 'social' | 'direct'
      engagementLevel: 'visitor',  // 'visitor' | 'engaged' | 'prospect' | 'lead'
      pagesVisited: [],            // [{page, timestamp}]
      actionsPerformed: [],        // [{action, context, timestamp}]
      questionsAsked: [],          // Topics user asked about
      contentViewed: [],           // [{type, title, timestamp}]
      contactRequested: false,     // Has user expressed interest in booking a call
      newsletterSubscribed: false, // Has user subscribed or shown interest
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

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

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
        if (parsed.version !== VERSION) {
          state = migrateState(parsed);
        } else {
          state = deepMerge(deepClone(DEFAULT_STATE), parsed);
        }
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
      visitorType: state.profile.visitorType,
      engagementLevel: state.journey.engagementLevel,
      totalVisits: state.journey.totalVisits
    });

    return state;
  }

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

  function migrateState(oldState) {
    console.log('[BubbleAgentMemory] Migrating from version', oldState.version, 'to', VERSION);

    // Merge old state with new defaults to preserve compatible data and add new fields
    const migrated = deepMerge(deepClone(DEFAULT_STATE), oldState);
    migrated.version = VERSION;
    migrated.lastUpdated = new Date().toISOString();

    // Clean up obsolete v1 fields if present
    if (migrated.profile) {
      delete migrated.profile.riskScore;
      delete migrated.profile.riskConfidence;
      delete migrated.profile.investmentGoal;
      delete migrated.profile.investmentHorizon;
      delete migrated.profile.emotionalResponses;
    }
    if (migrated.journey) {
      delete migrated.journey.onboardingStarted;
      delete migrated.journey.onboardingCompleted;
      delete migrated.journey.onboardingProgress;
      delete migrated.journey.currentOnboardingStage;
      delete migrated.journey.strategiesTested;
      // Ensure new fields exist
      if (migrated.journey.engagementLevel === undefined) {
        migrated.journey.engagementLevel = 'visitor';
      }
      if (migrated.journey.contentViewed === undefined) {
        migrated.journey.contentViewed = [];
      }
      if (migrated.journey.contactRequested === undefined) {
        migrated.journey.contactRequested = false;
      }
      if (migrated.journey.newsletterSubscribed === undefined) {
        migrated.journey.newsletterSubscribed = false;
      }
    }

    if (isStorageAvailable) {
      save(migrated);
    }

    return migrated;
  }

  function save(stateToSave = state) {
    if (!isStorageAvailable) return false;

    try {
      stateToSave.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      return true;
    } catch (e) {
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

  function trimOldData() {
    if (state.profile.rawInsights.length > 20) {
      state.profile.rawInsights = state.profile.rawInsights.slice(-20);
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
    if (state.journey.contentViewed.length > 25) {
      state.journey.contentViewed = state.journey.contentViewed.slice(-25);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFILE METHODS (Progressive Building)
  // ═══════════════════════════════════════════════════════════════════════════

  function setVisitorType(type) {
    const valid = ['individual', 'professional'];
    if (valid.includes(type)) {
      state.profile.visitorType = type;
      save();
    }
  }

  function setInterestArea(area) {
    const valid = ['poc_showcase', 'ai_consulting', 'newsletter', 'blog', 'learn_ai'];
    if (valid.includes(area)) {
      state.profile.interestArea = area;
      save();
    }
  }

  function setCompanyType(type) {
    const valid = ['wealth_manager', 'cgp', 'sme', 'startup', 'independent', 'asset_manager'];
    if (valid.includes(type)) {
      state.profile.companyType = type;
      save();
    }
  }

  function setCompanySize(size) {
    const valid = ['solo', 'small', 'medium'];
    if (valid.includes(size)) {
      state.profile.companySize = size;
      save();
    }
  }

  function setIndustry(industry) {
    const valid = ['finance', 'tech', 'other'];
    if (valid.includes(industry)) {
      state.profile.industry = industry;
      save();
    }
  }

  function setPainPoint(painPoint) {
    const valid = ['too_many_tools', 'no_internal_skills', 'fear_of_falling_behind', 'generic_solutions', 'need_trusted_guide'];
    if (valid.includes(painPoint)) {
      state.profile.painPoint = painPoint;
      save();
    }
  }

  function setProjectScope(scope) {
    const valid = ['diagnostic', 'targeted_automation', 'full_project'];
    if (valid.includes(scope)) {
      state.profile.projectScope = scope;
      save();
    }
  }

  function setAiMaturity(level) {
    const valid = ['unaware', 'curious', 'experimenting', 'deploying'];
    if (valid.includes(level)) {
      state.profile.aiMaturity = level;
      save();
    }
  }

  function addFollowChannel(channel) {
    const valid = ['linkedin', 'substack', 'github', 'instagram', 'x', 'youtube'];
    if (valid.includes(channel) && !state.profile.followChannels.includes(channel)) {
      state.profile.followChannels.push(channel);
      save();
    }
  }

  function addContentInterest(interest) {
    const valid = ['investment_agent', 'ai_agents', 'tutorials', 'philosophy', 'build_in_public', 'demystification'];
    if (valid.includes(interest) && !state.profile.contentInterests.includes(interest)) {
      state.profile.contentInterests.push(interest);
      save();
    }
  }

  function addTrait(trait) {
    if (!trait || typeof trait !== 'string') return;
    const normalizedTrait = trait.toLowerCase().trim();
    if (!state.profile.traits.includes(normalizedTrait)) {
      state.profile.traits.push(normalizedTrait);
      if (state.profile.traits.length > 15) {
        state.profile.traits = state.profile.traits.slice(-15);
      }
      save();
    }
  }

  function addTraits(traits) {
    if (!Array.isArray(traits)) return;
    traits.forEach(trait => addTrait(trait));
  }

  function addInsight(insight) {
    if (!insight || typeof insight !== 'string') return;
    state.profile.rawInsights.push({
      insight: insight.trim(),
      timestamp: new Date().toISOString()
    });
    if (state.profile.rawInsights.length > MAX_INSIGHTS) {
      state.profile.rawInsights = state.profile.rawInsights.slice(-MAX_INSIGHTS);
    }
    save();
  }

  function setKnowledgeLevel(level) {
    const valid = ['beginner', 'intermediate', 'advanced'];
    if (valid.includes(level)) {
      state.profile.knowledgeLevel = level;
      save();
    }
  }

  function setLearningStyle(style) {
    const valid = ['visual', 'dialogue', 'hands_on', 'explore'];
    if (valid.includes(style)) {
      state.profile.learningStyle = style;
      save();
    }
  }

  function setPreferredLanguage(lang) {
    const valid = ['fr', 'en'];
    if (valid.includes(lang)) {
      state.profile.preferredLanguage = lang;
      save();
    }
  }

  /**
   * Apply profile update from LLM extraction
   * @param {Object} update - Profile update object from LLM
   */
  function applyProfileUpdate(update) {
    if (!update || typeof update !== 'object') return;

    if (update.visitorType) setVisitorType(update.visitorType);
    if (update.interestArea) setInterestArea(update.interestArea);
    if (update.companyType) setCompanyType(update.companyType);
    if (update.companySize) setCompanySize(update.companySize);
    if (update.industry) setIndustry(update.industry);
    if (update.painPoint) setPainPoint(update.painPoint);
    if (update.projectScope) setProjectScope(update.projectScope);
    if (update.aiMaturity) setAiMaturity(update.aiMaturity);
    if (update.levelHint) setKnowledgeLevel(update.levelHint);
    if (Array.isArray(update.traits)) addTraits(update.traits);
    if (update.insight) addInsight(update.insight);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // JOURNEY METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  function recordPageVisit(page) {
    state.journey.pagesVisited.push({
      page,
      timestamp: new Date().toISOString()
    });
    if (state.journey.pagesVisited.length > 100) {
      state.journey.pagesVisited = state.journey.pagesVisited.slice(-100);
    }
    save();
  }

  function recordAction(action, context = {}) {
    state.journey.actionsPerformed.push({
      action,
      context,
      timestamp: new Date().toISOString()
    });
    if (state.journey.actionsPerformed.length > 100) {
      state.journey.actionsPerformed = state.journey.actionsPerformed.slice(-100);
    }
    save();
  }

  function recordQuestion(topic) {
    if (!topic || typeof topic !== 'string') return;
    if (!state.journey.questionsAsked.includes(topic)) {
      state.journey.questionsAsked.push(topic);
      if (state.journey.questionsAsked.length > MAX_QUESTIONS_ASKED) {
        state.journey.questionsAsked = state.journey.questionsAsked.slice(-MAX_QUESTIONS_ASKED);
      }
      save();
    }
  }

  function recordContentViewed(type, title) {
    const valid = ['blog', 'poc', 'resource', 'demo'];
    if (!valid.includes(type)) return;
    state.journey.contentViewed.push({
      type,
      title: title || '',
      timestamp: new Date().toISOString()
    });
    if (state.journey.contentViewed.length > MAX_CONTENT_VIEWED) {
      state.journey.contentViewed = state.journey.contentViewed.slice(-MAX_CONTENT_VIEWED);
    }
    save();
  }

  function setEngagementLevel(level) {
    const valid = ['visitor', 'engaged', 'prospect', 'lead'];
    if (valid.includes(level)) {
      state.journey.engagementLevel = level;
      save();
    }
  }

  function setFirstContactType(type) {
    const valid = ['chat', 'newsletter', 'social', 'direct'];
    if (valid.includes(type) && !state.journey.firstContactType) {
      state.journey.firstContactType = type;
      save();
    }
  }

  function markContactRequested() {
    state.journey.contactRequested = true;
    state.journey.engagementLevel = 'lead';
    save();
  }

  function markNewsletterInterest() {
    state.journey.newsletterSubscribed = true;
    save();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MEMORY METHODS (Conversation Summaries)
  // ═══════════════════════════════════════════════════════════════════════════

  function addKeyInsight(insight, source = 'conversation') {
    state.memory.keyInsights.push({
      insight,
      source,
      timestamp: new Date().toISOString()
    });
    if (state.memory.keyInsights.length > MAX_KEY_INSIGHTS) {
      state.memory.keyInsights = state.memory.keyInsights.slice(-MAX_KEY_INSIGHTS);
    }
    save();
  }

  function recordTopic(topic) {
    if (!state.memory.topicsDiscussed.includes(topic)) {
      state.memory.topicsDiscussed.push(topic);
      if (state.memory.topicsDiscussed.length > 50) {
        state.memory.topicsDiscussed = state.memory.topicsDiscussed.slice(-50);
      }
      save();
    }
  }

  function setConversationSummary(summary) {
    state.memory.lastConversationSummary = summary;
    state.memory.conversationCount++;
    state.memory.lastMessageTimestamp = new Date().toISOString();
    save();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════════════════

  function getProfile() {
    return deepClone(state.profile);
  }

  function getJourney() {
    return deepClone(state.journey);
  }

  function getMemory() {
    return deepClone(state.memory);
  }

  function getFullState() {
    return deepClone(state);
  }

  /**
   * Get a summary suitable for sending to the LLM
   * Token-efficient format
   */
  function getContextForLLM() {
    return {
      profile: {
        visitorType: state.profile.visitorType,
        interestArea: state.profile.interestArea,
        companyType: state.profile.companyType,
        companySize: state.profile.companySize,
        industry: state.profile.industry,
        painPoint: state.profile.painPoint,
        projectScope: state.profile.projectScope,
        aiMaturity: state.profile.aiMaturity,
        traits: state.profile.traits.slice(-5),
        level: state.profile.knowledgeLevel,
        followChannels: state.profile.followChannels,
        contentInterests: state.profile.contentInterests,
        language: state.profile.preferredLanguage
      },
      journey: {
        engagementLevel: state.journey.engagementLevel,
        firstContactType: state.journey.firstContactType,
        pagesVisitedCount: state.journey.pagesVisited.length,
        lastPage: state.journey.pagesVisited.slice(-1)[0]?.page || null,
        contentViewedCount: state.journey.contentViewed.length,
        contactRequested: state.journey.contactRequested,
        newsletterSubscribed: state.journey.newsletterSubscribed,
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

  function isReturningUser() {
    return state.journey.totalVisits > 1;
  }

  function getHoursSinceLastVisit() {
    if (!state.journey.lastVisit) return 0;
    const lastVisit = new Date(state.journey.lastVisit);
    const now = new Date();
    return Math.floor((now - lastVisit) / (1000 * 60 * 60));
  }

  /**
   * Get recommended next step based on visitor profile and engagement
   */
  function getRecommendedNextStep() {
    const type = state.profile.visitorType;

    if (!type) {
      return { action: 'discover', suggestion: 'Identify if individual or professional' };
    }

    if (type === 'professional') {
      if (!state.profile.painPoint) {
        return { action: 'qualify', suggestion: 'Understand their pain point and needs' };
      }
      if (!state.journey.contactRequested) {
        return { action: 'book_call', suggestion: 'Suggest booking a diagnostic call' };
      }
      return { action: 'nurture', suggestion: 'Continue building relationship' };
    }

    // Individual
    if (!state.journey.newsletterSubscribed) {
      return { action: 'subscribe', suggestion: 'Suggest newsletter or social follow' };
    }
    return { action: 'engage', suggestion: 'Share relevant content and resources' };
  }

  /**
   * Get human-readable label for visitor type
   */
  function getVisitorLabel() {
    const type = state.profile.visitorType;
    if (!type) return null;
    if (type === 'professional') {
      const companyLabels = {
        wealth_manager: 'Wealth Manager',
        cgp: 'CGP',
        sme: 'PME',
        startup: 'Startup',
        independent: 'Indépendant',
        asset_manager: 'Asset Manager'
      };
      return companyLabels[state.profile.companyType] || 'Professional';
    }
    return 'Individual';
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
      visitorType: profile.visitorType,
      visitorLabel: getVisitorLabel(),
      interestArea: profile.interestArea,
      engagementLevel: journey.engagementLevel,
      contactRequested: journey.contactRequested,
      lastPage: journey.pagesVisited.slice(-1)[0]?.page,
      contentViewedCount: journey.contentViewed.length,
      conversationCount: state.memory.conversationCount
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESET & GDPR
  // ═══════════════════════════════════════════════════════════════════════════

  function reset() {
    state = createFreshState();
    console.log('[BubbleAgentMemory] State reset');
    return true;
  }

  function resetProfile() {
    state.profile = deepClone(DEFAULT_STATE.profile);
    save();
    console.log('[BubbleAgentMemory] Profile reset');
  }

  function exportData() {
    return {
      exportedAt: new Date().toISOString(),
      data: deepClone(state)
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  init();

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    // Profile — Visitor type & interests
    setVisitorType,
    setInterestArea,
    setCompanyType,
    setCompanySize,
    setIndustry,
    setPainPoint,
    setProjectScope,
    setAiMaturity,
    addFollowChannel,
    addContentInterest,
    addTrait,
    addTraits,
    addInsight,
    setKnowledgeLevel,
    setLearningStyle,
    setPreferredLanguage,
    applyProfileUpdate,

    // Journey
    recordPageVisit,
    recordAction,
    recordQuestion,
    recordContentViewed,
    setEngagementLevel,
    setFirstContactType,
    markContactRequested,
    markNewsletterInterest,

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
    isReturningUser,
    getHoursSinceLastVisit,
    getRecommendedNextStep,
    getVisitorLabel,
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
