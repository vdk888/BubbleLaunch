/**
 * BubbleAgentMemory Test Suite
 *
 * Comprehensive tests for the BubbleAgentMemory module.
 * Can run in browser console or Node.js environment.
 *
 * Usage:
 *   Browser: Include after bubble-agent-memory.js and call BubbleAgentMemoryTests.runAll()
 *   Node.js: node bubble-agent-memory.test.js
 *
 * @version 1.0.0
 */

(function (global) {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  const TestUtils = {
    passCount: 0,
    failCount: 0,
    currentGroup: '',

    /**
     * Reset test counters
     */
    reset() {
      this.passCount = 0;
      this.failCount = 0;
      this.currentGroup = '';
    },

    /**
     * Set current test group for output formatting
     */
    group(name) {
      this.currentGroup = name;
      console.log('\n' + '='.repeat(60));
      console.log('TEST GROUP: ' + name);
      console.log('='.repeat(60));
    },

    /**
     * Assert a condition is true
     */
    assert(condition, message) {
      if (condition) {
        this.passCount++;
        console.log('[PASS] ' + message);
        return true;
      } else {
        this.failCount++;
        console.error('[FAIL] ' + message);
        return false;
      }
    },

    /**
     * Assert two values are equal
     */
    assertEqual(actual, expected, message) {
      const isEqual = actual === expected;
      if (!isEqual) {
        console.log('  Expected:', expected);
        console.log('  Actual:', actual);
      }
      return this.assert(isEqual, message);
    },

    /**
     * Assert two values are deeply equal (for objects/arrays)
     */
    assertDeepEqual(actual, expected, message) {
      const isEqual = JSON.stringify(actual) === JSON.stringify(expected);
      if (!isEqual) {
        console.log('  Expected:', JSON.stringify(expected, null, 2));
        console.log('  Actual:', JSON.stringify(actual, null, 2));
      }
      return this.assert(isEqual, message);
    },

    /**
     * Assert value is null
     */
    assertNull(value, message) {
      return this.assert(value === null, message);
    },

    /**
     * Assert value is not null
     */
    assertNotNull(value, message) {
      return this.assert(value !== null, message);
    },

    /**
     * Assert value is truthy
     */
    assertTrue(value, message) {
      return this.assert(!!value, message);
    },

    /**
     * Assert value is falsy
     */
    assertFalse(value, message) {
      return this.assert(!value, message);
    },

    /**
     * Assert value is within range (inclusive)
     */
    assertInRange(value, min, max, message) {
      const inRange = value >= min && value <= max;
      if (!inRange) {
        console.log('  Value:', value, 'Expected range:', min, '-', max);
      }
      return this.assert(inRange, message);
    },

    /**
     * Assert array contains value
     */
    assertContains(array, value, message) {
      return this.assert(Array.isArray(array) && array.includes(value), message);
    },

    /**
     * Assert array length
     */
    assertLength(array, expectedLength, message) {
      const actualLength = Array.isArray(array) ? array.length : -1;
      if (actualLength !== expectedLength) {
        console.log('  Expected length:', expectedLength, 'Actual:', actualLength);
      }
      return this.assert(actualLength === expectedLength, message);
    },

    /**
     * Assert object has property
     */
    assertHasProperty(obj, property, message) {
      return this.assert(obj && typeof obj === 'object' && property in obj, message);
    },

    /**
     * Assert function throws error
     */
    assertThrows(fn, message) {
      let threw = false;
      try {
        fn();
      } catch (e) {
        threw = true;
      }
      return this.assert(threw, message);
    },

    /**
     * Assert function does not throw error
     */
    assertNoThrow(fn, message) {
      let threw = false;
      let error = null;
      try {
        fn();
      } catch (e) {
        threw = true;
        error = e;
      }
      if (threw) {
        console.log('  Error thrown:', error.message);
      }
      return this.assert(!threw, message);
    },

    /**
     * Print final summary
     */
    summary() {
      console.log('\n' + '='.repeat(60));
      console.log('TEST SUMMARY');
      console.log('='.repeat(60));
      console.log('Passed: ' + this.passCount);
      console.log('Failed: ' + this.failCount);
      console.log('Total:  ' + (this.passCount + this.failCount));
      console.log('='.repeat(60));

      if (this.failCount === 0) {
        console.log('ALL TESTS PASSED!');
      } else {
        console.log('SOME TESTS FAILED');
      }

      return this.failCount === 0;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MOCK LOCALSTORAGE
  // ═══════════════════════════════════════════════════════════════════════════

  class MockLocalStorage {
    constructor() {
      this.store = {};
      this.quota = 5 * 1024 * 1024; // 5MB default
      this.used = 0;
      this.isDisabled = false;
    }

    getItem(key) {
      if (this.isDisabled) throw new Error('localStorage is disabled');
      return this.store[key] || null;
    }

    setItem(key, value) {
      if (this.isDisabled) throw new Error('localStorage is disabled');
      const size = value.length * 2; // Approximate UTF-16 size
      if (this.used + size > this.quota) {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      }
      this.store[key] = value;
      this.used += size;
    }

    removeItem(key) {
      if (this.isDisabled) throw new Error('localStorage is disabled');
      if (this.store[key]) {
        this.used -= this.store[key].length * 2;
        delete this.store[key];
      }
    }

    clear() {
      this.store = {};
      this.used = 0;
    }

    disable() {
      this.isDisabled = true;
    }

    enable() {
      this.isDisabled = false;
    }

    setQuota(bytes) {
      this.quota = bytes;
    }

    getUsage() {
      return this.used;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST SUITES
  // ═══════════════════════════════════════════════════════════════════════════

  const TestSuites = {

    // =========================================================================
    // 1. INITIALIZATION TESTS
    // =========================================================================
    initializationTests(BubbleAgentMemory, mockStorage) {
      TestUtils.group('1. INITIALIZATION TESTS');

      // 1.1 Fresh state creation
      mockStorage.clear();
      BubbleAgentMemory.reset();
      const freshState = BubbleAgentMemory.getFullState();

      TestUtils.assertNotNull(freshState, '1.1.1 Fresh state is created');
      TestUtils.assertNotNull(freshState.createdAt, '1.1.2 createdAt is set');
      TestUtils.assertNotNull(freshState.lastUpdated, '1.1.3 lastUpdated is set');
      TestUtils.assertEqual(freshState.version, '1.0.0', '1.1.4 Version is set correctly');
      TestUtils.assertEqual(freshState.journey.totalVisits, 1, '1.1.5 Total visits starts at 1');
      TestUtils.assertNull(freshState.profile.riskScore, '1.1.6 Risk score starts as null');
      TestUtils.assertEqual(freshState.profile.riskConfidence, 0, '1.1.7 Risk confidence starts at 0');
      TestUtils.assertDeepEqual(freshState.profile.traits, [], '1.1.8 Traits start empty');

      // 1.2 State recovery from localStorage
      BubbleAgentMemory.updateRiskScore(50);
      BubbleAgentMemory.addTrait('cautious');
      BubbleAgentMemory.setGoal('retirement');

      // Simulate page reload by reinitializing
      BubbleAgentMemory.init();
      const recoveredState = BubbleAgentMemory.getFullState();

      TestUtils.assertEqual(recoveredState.profile.riskScore, 50, '1.2.1 Risk score is recovered from localStorage');
      TestUtils.assertContains(recoveredState.profile.traits, 'cautious', '1.2.2 Traits are recovered');
      TestUtils.assertEqual(recoveredState.profile.investmentGoal, 'retirement', '1.2.3 Goal is recovered');
      TestUtils.assertEqual(recoveredState.journey.totalVisits, 2, '1.2.4 Total visits increments on reload');

      // 1.3 Corrupt data handling
      mockStorage.clear();
      mockStorage.setItem('bubbleUnifiedAgent', 'this is not valid JSON {{{');

      TestUtils.assertNoThrow(() => {
        BubbleAgentMemory.init();
      }, '1.3.1 Corrupt JSON does not throw error');

      const resetState = BubbleAgentMemory.getFullState();
      TestUtils.assertNotNull(resetState.createdAt, '1.3.2 Fresh state created after corrupt data');
      TestUtils.assertNull(resetState.profile.riskScore, '1.3.3 Corrupt data results in fresh profile');

      // 1.4 Version migration
      mockStorage.clear();
      const oldVersionState = {
        version: '0.9.0',
        createdAt: '2024-01-01T00:00:00.000Z',
        lastUpdated: '2024-01-01T00:00:00.000Z',
        profile: {
          riskScore: 65,
          riskConfidence: 50,
          traits: ['aggressive'],
          investmentGoal: 'growth'
          // Missing new fields
        },
        journey: {
          totalVisits: 10,
          lastVisit: '2024-01-01T00:00:00.000Z'
          // Missing new fields
        },
        memory: {}
      };
      mockStorage.setItem('bubbleUnifiedAgent', JSON.stringify(oldVersionState));

      BubbleAgentMemory.init();
      const migratedState = BubbleAgentMemory.getFullState();

      TestUtils.assertEqual(migratedState.version, '1.0.0', '1.4.1 Version is updated after migration');
      TestUtils.assertEqual(migratedState.profile.riskScore, 65, '1.4.2 Old profile data preserved');
      TestUtils.assertContains(migratedState.profile.traits, 'aggressive', '1.4.3 Old traits preserved');
      TestUtils.assertHasProperty(migratedState.profile, 'learningStyle', '1.4.4 New fields added during migration');
      TestUtils.assertEqual(migratedState.journey.totalVisits, 11, '1.4.5 Visit count incremented after migration');
    },

    // =========================================================================
    // 2. PROFILE METHODS TESTS
    // =========================================================================
    profileMethodsTests(BubbleAgentMemory, mockStorage) {
      TestUtils.group('2. PROFILE METHODS TESTS');

      // Reset before tests
      mockStorage.clear();
      BubbleAgentMemory.reset();

      // 2.1 updateRiskScore - weighted averaging
      BubbleAgentMemory.updateRiskScore(50, 1);
      let profile = BubbleAgentMemory.getProfile();
      TestUtils.assertEqual(profile.riskScore, 50, '2.1.1 First risk score sets value directly');
      TestUtils.assertInRange(profile.riskConfidence, 10, 20, '2.1.2 First update sets initial confidence');

      BubbleAgentMemory.updateRiskScore(70, 1);
      profile = BubbleAgentMemory.getProfile();
      TestUtils.assertInRange(profile.riskScore, 50, 70, '2.1.3 Second update creates weighted average');
      TestUtils.assertTrue(profile.riskConfidence >= 20, '2.1.4 Confidence increases with more data');

      // 2.1.5 Invalid risk score handling
      const scoreBefore = BubbleAgentMemory.getProfile().riskScore;
      BubbleAgentMemory.updateRiskScore(-10);
      TestUtils.assertEqual(BubbleAgentMemory.getProfile().riskScore, scoreBefore, '2.1.5 Negative score ignored');

      BubbleAgentMemory.updateRiskScore(150);
      TestUtils.assertEqual(BubbleAgentMemory.getProfile().riskScore, scoreBefore, '2.1.6 Score > 100 ignored');

      BubbleAgentMemory.updateRiskScore('invalid');
      TestUtils.assertEqual(BubbleAgentMemory.getProfile().riskScore, scoreBefore, '2.1.7 Non-number score ignored');

      // 2.2 adjustRiskScore - delta adjustments
      mockStorage.clear();
      BubbleAgentMemory.reset();

      BubbleAgentMemory.adjustRiskScore(10);
      profile = BubbleAgentMemory.getProfile();
      TestUtils.assertEqual(profile.riskScore, 60, '2.2.1 First adjustment starts from 50 + delta');

      BubbleAgentMemory.adjustRiskScore(-20);
      profile = BubbleAgentMemory.getProfile();
      TestUtils.assertEqual(profile.riskScore, 40, '2.2.2 Negative adjustment subtracts from score');

      BubbleAgentMemory.adjustRiskScore(-100);
      profile = BubbleAgentMemory.getProfile();
      TestUtils.assertEqual(profile.riskScore, 0, '2.2.3 Score cannot go below 0');

      BubbleAgentMemory.adjustRiskScore(200);
      profile = BubbleAgentMemory.getProfile();
      TestUtils.assertEqual(profile.riskScore, 100, '2.2.4 Score cannot exceed 100');

      // 2.3 addTrait / addTraits
      mockStorage.clear();
      BubbleAgentMemory.reset();

      BubbleAgentMemory.addTrait('patient');
      profile = BubbleAgentMemory.getProfile();
      TestUtils.assertContains(profile.traits, 'patient', '2.3.1 Single trait added');

      BubbleAgentMemory.addTrait('PATIENT'); // Duplicate with different case
      profile = BubbleAgentMemory.getProfile();
      TestUtils.assertLength(profile.traits, 1, '2.3.2 Duplicate traits not added (case insensitive)');

      BubbleAgentMemory.addTraits(['analytical', 'risk-averse', 'long-term']);
      profile = BubbleAgentMemory.getProfile();
      TestUtils.assertLength(profile.traits, 4, '2.3.3 Multiple traits added');

      BubbleAgentMemory.addTrait('');
      BubbleAgentMemory.addTrait(null);
      BubbleAgentMemory.addTrait(undefined);
      profile = BubbleAgentMemory.getProfile();
      TestUtils.assertLength(profile.traits, 4, '2.3.4 Empty/null/undefined traits ignored');

      // Test trait limit (15 max)
      for (let i = 0; i < 20; i++) {
        BubbleAgentMemory.addTrait('trait' + i);
      }
      profile = BubbleAgentMemory.getProfile();
      TestUtils.assertTrue(profile.traits.length <= 15, '2.3.5 Traits limited to 15 max');

      // 2.4 setGoal, setHorizon, setKnowledgeLevel
      mockStorage.clear();
      BubbleAgentMemory.reset();

      BubbleAgentMemory.setGoal('RETIREMENT');
      profile = BubbleAgentMemory.getProfile();
      TestUtils.assertEqual(profile.investmentGoal, 'retirement', '2.4.1 Goal normalized to lowercase');

      BubbleAgentMemory.setHorizon('long');
      profile = BubbleAgentMemory.getProfile();
      TestUtils.assertEqual(profile.investmentHorizon, 'long', '2.4.2 Valid horizon accepted');

      BubbleAgentMemory.setHorizon('invalid');
      profile = BubbleAgentMemory.getProfile();
      TestUtils.assertEqual(profile.investmentHorizon, 'long', '2.4.3 Invalid horizon ignored');

      BubbleAgentMemory.setKnowledgeLevel('intermediate');
      profile = BubbleAgentMemory.getProfile();
      TestUtils.assertEqual(profile.knowledgeLevel, 'intermediate', '2.4.4 Valid knowledge level accepted');

      BubbleAgentMemory.setKnowledgeLevel('expert');
      profile = BubbleAgentMemory.getProfile();
      TestUtils.assertEqual(profile.knowledgeLevel, 'intermediate', '2.4.5 Invalid knowledge level ignored');

      BubbleAgentMemory.setLearningStyle('visual');
      profile = BubbleAgentMemory.getProfile();
      TestUtils.assertEqual(profile.learningStyle, 'visual', '2.4.6 Valid learning style accepted');

      BubbleAgentMemory.setPreferredLanguage('fr');
      profile = BubbleAgentMemory.getProfile();
      TestUtils.assertEqual(profile.preferredLanguage, 'fr', '2.4.7 Valid language accepted');

      // 2.5 applyProfileUpdate - from LLM
      mockStorage.clear();
      BubbleAgentMemory.reset();

      BubbleAgentMemory.applyProfileUpdate({
        riskScoreAdjustment: 15,
        traits: ['data-driven', 'curious'],
        goalHint: 'wealth_building',
        horizonHint: 'long',
        levelHint: 'beginner',
        insight: 'User shows strong interest in passive investing'
      });

      profile = BubbleAgentMemory.getProfile();
      TestUtils.assertEqual(profile.riskScore, 65, '2.5.1 Risk score adjusted via applyProfileUpdate');
      TestUtils.assertContains(profile.traits, 'data-driven', '2.5.2 Traits added via applyProfileUpdate');
      TestUtils.assertEqual(profile.investmentGoal, 'wealth_building', '2.5.3 Goal set via applyProfileUpdate');
      TestUtils.assertEqual(profile.investmentHorizon, 'long', '2.5.4 Horizon set via applyProfileUpdate');
      TestUtils.assertEqual(profile.knowledgeLevel, 'beginner', '2.5.5 Knowledge level set via applyProfileUpdate');
      TestUtils.assertTrue(profile.rawInsights.length > 0, '2.5.6 Insight added via applyProfileUpdate');

      // 2.5.7 Null/undefined update handling
      TestUtils.assertNoThrow(() => {
        BubbleAgentMemory.applyProfileUpdate(null);
        BubbleAgentMemory.applyProfileUpdate(undefined);
        BubbleAgentMemory.applyProfileUpdate({});
      }, '2.5.7 Null/undefined/empty updates do not throw');
    },

    // =========================================================================
    // 3. JOURNEY METHODS TESTS
    // =========================================================================
    journeyMethodsTests(BubbleAgentMemory, mockStorage) {
      TestUtils.group('3. JOURNEY METHODS TESTS');

      mockStorage.clear();
      BubbleAgentMemory.reset();

      // 3.1 Onboarding flow
      BubbleAgentMemory.startOnboarding();
      let journey = BubbleAgentMemory.getJourney();
      TestUtils.assertNotNull(journey.onboardingStarted, '3.1.1 Onboarding start timestamp set');
      TestUtils.assertEqual(journey.onboardingProgress, 0, '3.1.2 Progress starts at 0');
      TestUtils.assertEqual(journey.currentOnboardingStage, 'welcome', '3.1.3 Initial stage is welcome');

      BubbleAgentMemory.updateOnboardingProgress(25, 'profile_questions');
      journey = BubbleAgentMemory.getJourney();
      TestUtils.assertEqual(journey.onboardingProgress, 25, '3.1.4 Progress updated to 25');
      TestUtils.assertEqual(journey.currentOnboardingStage, 'profile_questions', '3.1.5 Stage updated');

      BubbleAgentMemory.updateOnboardingProgress(50);
      journey = BubbleAgentMemory.getJourney();
      TestUtils.assertEqual(journey.onboardingProgress, 50, '3.1.6 Progress updated without stage change');
      TestUtils.assertEqual(journey.currentOnboardingStage, 'profile_questions', '3.1.7 Stage preserved when not provided');

      BubbleAgentMemory.updateOnboardingProgress(-10);
      journey = BubbleAgentMemory.getJourney();
      TestUtils.assertEqual(journey.onboardingProgress, 0, '3.1.8 Progress clamped to minimum 0');

      BubbleAgentMemory.updateOnboardingProgress(150);
      journey = BubbleAgentMemory.getJourney();
      TestUtils.assertEqual(journey.onboardingProgress, 100, '3.1.9 Progress clamped to maximum 100');

      BubbleAgentMemory.completeOnboarding();
      journey = BubbleAgentMemory.getJourney();
      TestUtils.assertNotNull(journey.onboardingCompleted, '3.1.10 Onboarding completion timestamp set');
      TestUtils.assertEqual(journey.onboardingProgress, 100, '3.1.11 Progress set to 100 on completion');
      TestUtils.assertEqual(journey.currentOnboardingStage, 'completed', '3.1.12 Stage set to completed');
      TestUtils.assertTrue(BubbleAgentMemory.isOnboardingCompleted(), '3.1.13 isOnboardingCompleted returns true');

      // 3.2 Page visit recording
      mockStorage.clear();
      BubbleAgentMemory.reset();

      BubbleAgentMemory.recordPageVisit('home');
      BubbleAgentMemory.recordPageVisit('simulator');
      BubbleAgentMemory.recordPageVisit('blog');

      journey = BubbleAgentMemory.getJourney();
      TestUtils.assertEqual(journey.pagesVisited.length, 3, '3.2.1 Three page visits recorded');
      TestUtils.assertEqual(journey.pagesVisited[0].page, 'home', '3.2.2 First visit is home');
      TestUtils.assertNotNull(journey.pagesVisited[0].timestamp, '3.2.3 Timestamp included with visit');

      // Test limit (100 max)
      for (let i = 0; i < 110; i++) {
        BubbleAgentMemory.recordPageVisit('page' + i);
      }
      journey = BubbleAgentMemory.getJourney();
      TestUtils.assertTrue(journey.pagesVisited.length <= 100, '3.2.4 Page visits limited to 100');

      // 3.3 Action recording
      mockStorage.clear();
      BubbleAgentMemory.reset();

      BubbleAgentMemory.recordAction('click_cta', { button: 'get_started' });
      BubbleAgentMemory.recordAction('strategy_change', { from: 'equal_weight', to: 'risk_parity' });

      journey = BubbleAgentMemory.getJourney();
      TestUtils.assertEqual(journey.actionsPerformed.length, 2, '3.3.1 Two actions recorded');
      TestUtils.assertEqual(journey.actionsPerformed[0].action, 'click_cta', '3.3.2 Action name recorded');
      TestUtils.assertEqual(journey.actionsPerformed[0].context.button, 'get_started', '3.3.3 Context preserved');

      // Test limit (100 max)
      for (let i = 0; i < 110; i++) {
        BubbleAgentMemory.recordAction('action' + i);
      }
      journey = BubbleAgentMemory.getJourney();
      TestUtils.assertTrue(journey.actionsPerformed.length <= 100, '3.3.4 Actions limited to 100');

      // 3.4 Strategy test recording
      mockStorage.clear();
      BubbleAgentMemory.reset();

      BubbleAgentMemory.recordStrategyTest(
        { stocks: 60, bonds: 30, gold: 10 },
        { totalReturn: 150, sharpeRatio: 0.85, maxDrawdown: -25 }
      );

      journey = BubbleAgentMemory.getJourney();
      TestUtils.assertEqual(journey.strategiesTested.length, 1, '3.4.1 Strategy test recorded');
      TestUtils.assertEqual(journey.strategiesTested[0].allocation.stocks, 60, '3.4.2 Allocation preserved');
      TestUtils.assertEqual(journey.strategiesTested[0].metrics.sharpeRatio, 0.85, '3.4.3 Metrics preserved');

      // Test limit (50 max)
      for (let i = 0; i < 60; i++) {
        BubbleAgentMemory.recordStrategyTest({ stocks: i }, { return: i * 10 });
      }
      journey = BubbleAgentMemory.getJourney();
      TestUtils.assertTrue(journey.strategiesTested.length <= 50, '3.4.4 Strategies limited to 50');

      // 3.5 Question recording
      mockStorage.clear();
      BubbleAgentMemory.reset();

      BubbleAgentMemory.recordQuestion('risk_parity');
      BubbleAgentMemory.recordQuestion('etf_basics');
      BubbleAgentMemory.recordQuestion('risk_parity'); // Duplicate

      journey = BubbleAgentMemory.getJourney();
      TestUtils.assertEqual(journey.questionsAsked.length, 2, '3.5.1 Duplicate questions not added');
      TestUtils.assertContains(journey.questionsAsked, 'risk_parity', '3.5.2 Question topic recorded');
    },

    // =========================================================================
    // 4. MEMORY METHODS TESTS
    // =========================================================================
    memoryMethodsTests(BubbleAgentMemory, mockStorage) {
      TestUtils.group('4. MEMORY METHODS TESTS');

      mockStorage.clear();
      BubbleAgentMemory.reset();

      // 4.1 Key insights management
      BubbleAgentMemory.addKeyInsight('User prefers passive investing', 'chat');
      BubbleAgentMemory.addKeyInsight('User has 10-year horizon', 'onboarding');

      let memory = BubbleAgentMemory.getMemory();
      TestUtils.assertEqual(memory.keyInsights.length, 2, '4.1.1 Two key insights added');
      TestUtils.assertEqual(memory.keyInsights[0].insight, 'User prefers passive investing', '4.1.2 Insight text preserved');
      TestUtils.assertEqual(memory.keyInsights[0].source, 'chat', '4.1.3 Source preserved');
      TestUtils.assertNotNull(memory.keyInsights[0].timestamp, '4.1.4 Timestamp included');

      // Test limit (30 max)
      for (let i = 0; i < 35; i++) {
        BubbleAgentMemory.addKeyInsight('Insight ' + i);
      }
      memory = BubbleAgentMemory.getMemory();
      TestUtils.assertTrue(memory.keyInsights.length <= 30, '4.1.5 Key insights limited to 30');

      // 4.2 Topic recording
      mockStorage.clear();
      BubbleAgentMemory.reset();

      BubbleAgentMemory.recordTopic('diversification');
      BubbleAgentMemory.recordTopic('rebalancing');
      BubbleAgentMemory.recordTopic('diversification'); // Duplicate

      memory = BubbleAgentMemory.getMemory();
      TestUtils.assertEqual(memory.topicsDiscussed.length, 2, '4.2.1 Duplicate topics not added');
      TestUtils.assertContains(memory.topicsDiscussed, 'diversification', '4.2.2 Topic recorded');

      // Test limit (50 max)
      for (let i = 0; i < 60; i++) {
        BubbleAgentMemory.recordTopic('topic' + i);
      }
      memory = BubbleAgentMemory.getMemory();
      TestUtils.assertTrue(memory.topicsDiscussed.length <= 50, '4.2.3 Topics limited to 50');

      // 4.3 Conversation summary
      mockStorage.clear();
      BubbleAgentMemory.reset();

      BubbleAgentMemory.setConversationSummary('User discussed risk tolerance and investment goals.');

      memory = BubbleAgentMemory.getMemory();
      TestUtils.assertEqual(memory.lastConversationSummary, 'User discussed risk tolerance and investment goals.', '4.3.1 Summary saved');
      TestUtils.assertEqual(memory.conversationCount, 1, '4.3.2 Conversation count incremented');
      TestUtils.assertNotNull(memory.lastMessageTimestamp, '4.3.3 Last message timestamp set');

      BubbleAgentMemory.setConversationSummary('Follow-up on portfolio allocation.');
      memory = BubbleAgentMemory.getMemory();
      TestUtils.assertEqual(memory.conversationCount, 2, '4.3.4 Conversation count incremented again');
    },

    // =========================================================================
    // 5. GETTER TESTS
    // =========================================================================
    getterTests(BubbleAgentMemory, mockStorage) {
      TestUtils.group('5. GETTER TESTS');

      mockStorage.clear();
      BubbleAgentMemory.reset();

      // Setup state for getter tests
      BubbleAgentMemory.updateRiskScore(65);
      BubbleAgentMemory.addTraits(['analytical', 'patient', 'risk-averse', 'curious', 'data-driven', 'extra-trait']);
      BubbleAgentMemory.setGoal('retirement');
      BubbleAgentMemory.setHorizon('long');
      BubbleAgentMemory.setKnowledgeLevel('intermediate');
      BubbleAgentMemory.setLearningStyle('visual');
      BubbleAgentMemory.setPreferredLanguage('fr');
      BubbleAgentMemory.startOnboarding();
      BubbleAgentMemory.completeOnboarding();
      BubbleAgentMemory.recordPageVisit('home');
      BubbleAgentMemory.recordPageVisit('simulator');
      BubbleAgentMemory.recordStrategyTest({ stocks: 60 }, {});
      BubbleAgentMemory.addKeyInsight('Insight 1');
      BubbleAgentMemory.addKeyInsight('Insight 2');
      BubbleAgentMemory.addKeyInsight('Insight 3');
      BubbleAgentMemory.addKeyInsight('Insight 4');
      BubbleAgentMemory.addKeyInsight('Insight 5');
      BubbleAgentMemory.addKeyInsight('Insight 6'); // Sixth insight
      BubbleAgentMemory.recordTopic('topic1');
      BubbleAgentMemory.setConversationSummary('Test summary');

      // 5.1 getContextForLLM - token efficiency
      const llmContext = BubbleAgentMemory.getContextForLLM();

      TestUtils.assertHasProperty(llmContext, 'profile', '5.1.1 LLM context has profile');
      TestUtils.assertHasProperty(llmContext, 'journey', '5.1.2 LLM context has journey');
      TestUtils.assertHasProperty(llmContext, 'memory', '5.1.3 LLM context has memory');

      // Check token efficiency - traits limited to 5
      TestUtils.assertTrue(llmContext.profile.traits.length <= 5, '5.1.4 Traits limited to 5 for token efficiency');

      // Check key insights limited to 5
      TestUtils.assertTrue(llmContext.memory.keyInsights.length <= 5, '5.1.5 Key insights limited to 5 for token efficiency');

      // Check topics limited to 10
      TestUtils.assertTrue(llmContext.memory.topicsDiscussed.length <= 10, '5.1.6 Topics limited to 10 for token efficiency');

      // Check summarized journey data
      TestUtils.assertTrue(llmContext.journey.onboardingCompleted, '5.1.7 Onboarding completion boolean');
      TestUtils.assertEqual(llmContext.journey.pagesVisitedCount, 2, '5.1.8 Page visit count (not full array)');
      TestUtils.assertEqual(llmContext.journey.lastPage, 'simulator', '5.1.9 Only last page included');
      TestUtils.assertTrue(llmContext.journey.isReturningUser !== undefined, '5.1.10 isReturningUser flag included');

      // 5.2 getRecommendedAllocation
      const allocation = BubbleAgentMemory.getRecommendedAllocation();

      TestUtils.assertNotNull(allocation, '5.2.1 Allocation returned for user with risk score');
      TestUtils.assertHasProperty(allocation, 'stocks', '5.2.2 Allocation has stocks');
      TestUtils.assertHasProperty(allocation, 'bonds', '5.2.3 Allocation has bonds');
      TestUtils.assertHasProperty(allocation, 'gold', '5.2.4 Allocation has gold');
      TestUtils.assertTrue(allocation.gold >= 5, '5.2.5 Gold has minimum 5%');
      TestUtils.assertHasProperty(allocation, 'profileName', '5.2.6 Profile name included');
      TestUtils.assertEqual(allocation.riskScore, 65, '5.2.7 Risk score included in allocation');

      // 5.3 getProfileName (French profile names with accents)
      TestUtils.assertTrue(
        BubbleAgentMemory.getProfileName(10).includes('Prudent'),
        '5.3.1 Score 10 contains Prudent'
      );
      TestUtils.assertEqual(BubbleAgentMemory.getProfileName(30), 'Prudent', '5.3.2 Score 30 = Prudent');
      TestUtils.assertTrue(
        BubbleAgentMemory.getProfileName(50).includes('quilibr'),
        '5.3.3 Score 50 contains quilibr (Equilibre with accent)'
      );
      TestUtils.assertEqual(BubbleAgentMemory.getProfileName(70), 'Dynamique', '5.3.4 Score 70 = Dynamique');
      TestUtils.assertEqual(BubbleAgentMemory.getProfileName(90), 'Offensif', '5.3.5 Score 90 = Offensif');
      TestUtils.assertNull(BubbleAgentMemory.getProfileName(null), '5.3.6 Null score returns null');

      // 5.4 getWelcomeBackData
      // Simulate returning user
      BubbleAgentMemory.init(); // Increments visit count

      const welcomeData = BubbleAgentMemory.getWelcomeBackData();
      TestUtils.assertNotNull(welcomeData, '5.4.1 Welcome data returned for returning user');
      TestUtils.assertHasProperty(welcomeData, 'hoursSinceLastVisit', '5.4.2 Has hours since last visit');
      TestUtils.assertHasProperty(welcomeData, 'daysSinceLastVisit', '5.4.3 Has days since last visit');
      TestUtils.assertHasProperty(welcomeData, 'profileName', '5.4.4 Has profile name');
      TestUtils.assertHasProperty(welcomeData, 'conversationCount', '5.4.5 Has conversation count');

      // 5.5 isReturningUser
      TestUtils.assertTrue(BubbleAgentMemory.isReturningUser(), '5.5.1 isReturningUser true after multiple visits');

      mockStorage.clear();
      BubbleAgentMemory.reset();
      TestUtils.assertFalse(BubbleAgentMemory.isReturningUser(), '5.5.2 isReturningUser false for new user');

      // 5.5.3 welcomeData null for new user
      TestUtils.assertNull(BubbleAgentMemory.getWelcomeBackData(), '5.5.3 Welcome data null for new user');

      // 5.6 getRecommendedAllocation with null risk score
      mockStorage.clear();
      BubbleAgentMemory.reset();
      TestUtils.assertNull(BubbleAgentMemory.getRecommendedAllocation(), '5.6.1 Null allocation when no risk score');
    },

    // =========================================================================
    // 6. EDGE CASES
    // =========================================================================
    edgeCaseTests(BubbleAgentMemory, mockStorage) {
      TestUtils.group('6. EDGE CASES');

      // 6.1 localStorage unavailable
      mockStorage.clear();
      mockStorage.disable();

      TestUtils.assertNoThrow(() => {
        BubbleAgentMemory.init();
      }, '6.1.1 Init does not throw when localStorage unavailable');

      TestUtils.assertNoThrow(() => {
        BubbleAgentMemory.updateRiskScore(50);
        BubbleAgentMemory.addTrait('test');
        BubbleAgentMemory.recordPageVisit('home');
      }, '6.1.2 Operations work in memory-only mode');

      // Re-enable storage
      mockStorage.enable();

      // 6.2 Quota exceeded simulation
      mockStorage.clear();
      mockStorage.setQuota(500); // Very small quota
      BubbleAgentMemory.reset();

      TestUtils.assertNoThrow(() => {
        // Try to exceed quota
        for (let i = 0; i < 100; i++) {
          BubbleAgentMemory.addKeyInsight('This is a very long insight that should eventually exceed the quota limit ' + i);
        }
      }, '6.2.1 Quota exceeded handled gracefully');

      mockStorage.setQuota(5 * 1024 * 1024); // Reset quota
      mockStorage.clear();

      // 6.3 Invalid inputs
      BubbleAgentMemory.reset();

      TestUtils.assertNoThrow(() => {
        BubbleAgentMemory.updateRiskScore(null);
        BubbleAgentMemory.updateRiskScore(undefined);
        BubbleAgentMemory.updateRiskScore(NaN);
        BubbleAgentMemory.updateRiskScore({});
        BubbleAgentMemory.updateRiskScore([]);
      }, '6.3.1 Invalid risk score inputs do not throw');

      TestUtils.assertNoThrow(() => {
        BubbleAgentMemory.addTrait(null);
        BubbleAgentMemory.addTrait(undefined);
        BubbleAgentMemory.addTrait(123);
        BubbleAgentMemory.addTrait({});
      }, '6.3.2 Invalid trait inputs do not throw');

      TestUtils.assertNoThrow(() => {
        BubbleAgentMemory.addTraits(null);
        BubbleAgentMemory.addTraits(undefined);
        BubbleAgentMemory.addTraits('not an array');
        BubbleAgentMemory.addTraits(123);
      }, '6.3.3 Invalid traits array inputs do not throw');

      TestUtils.assertNoThrow(() => {
        BubbleAgentMemory.setGoal(null);
        BubbleAgentMemory.setGoal(undefined);
        BubbleAgentMemory.setGoal('');
      }, '6.3.4 Invalid goal inputs do not throw');

      // 6.4 Null/undefined handling in complex objects
      TestUtils.assertNoThrow(() => {
        BubbleAgentMemory.applyProfileUpdate(null);
        BubbleAgentMemory.applyProfileUpdate(undefined);
        BubbleAgentMemory.applyProfileUpdate({ randomField: 'ignored' });
      }, '6.4.1 applyProfileUpdate handles null/undefined/unknown fields');

      TestUtils.assertNoThrow(() => {
        BubbleAgentMemory.recordAction(null);
        BubbleAgentMemory.recordAction(undefined, null);
      }, '6.4.2 recordAction handles null/undefined');

      TestUtils.assertNoThrow(() => {
        BubbleAgentMemory.recordStrategyTest(null, null);
        BubbleAgentMemory.recordStrategyTest(undefined, undefined);
      }, '6.4.3 recordStrategyTest handles null/undefined');

      // 6.5 State immutability (getters return clones)
      mockStorage.clear();
      BubbleAgentMemory.reset();
      BubbleAgentMemory.updateRiskScore(50);

      const profile1 = BubbleAgentMemory.getProfile();
      profile1.riskScore = 999;
      const profile2 = BubbleAgentMemory.getProfile();

      TestUtils.assertEqual(profile2.riskScore, 50, '6.5.1 getProfile returns immutable clone');

      const journey1 = BubbleAgentMemory.getJourney();
      journey1.totalVisits = 999;
      const journey2 = BubbleAgentMemory.getJourney();

      TestUtils.assertEqual(journey2.totalVisits, 1, '6.5.2 getJourney returns immutable clone');

      // 6.6 Reset and exportData
      mockStorage.clear();
      BubbleAgentMemory.reset();
      BubbleAgentMemory.updateRiskScore(75);
      BubbleAgentMemory.addTrait('test');

      const exported = BubbleAgentMemory.exportData();
      TestUtils.assertHasProperty(exported, 'exportedAt', '6.6.1 Export has timestamp');
      TestUtils.assertHasProperty(exported, 'data', '6.6.2 Export has data');
      TestUtils.assertEqual(exported.data.profile.riskScore, 75, '6.6.3 Export contains current state');

      BubbleAgentMemory.reset();
      const resetProfile = BubbleAgentMemory.getProfile();
      TestUtils.assertNull(resetProfile.riskScore, '6.6.4 Reset clears risk score');
      TestUtils.assertDeepEqual(resetProfile.traits, [], '6.6.5 Reset clears traits');

      // 6.7 resetProfile (keeps journey)
      mockStorage.clear();
      BubbleAgentMemory.reset();
      BubbleAgentMemory.updateRiskScore(80);
      BubbleAgentMemory.recordPageVisit('home');
      BubbleAgentMemory.recordPageVisit('simulator');

      BubbleAgentMemory.resetProfile();

      const resetProfileOnly = BubbleAgentMemory.getProfile();
      const preservedJourney = BubbleAgentMemory.getJourney();

      TestUtils.assertNull(resetProfileOnly.riskScore, '6.7.1 resetProfile clears risk score');
      TestUtils.assertEqual(preservedJourney.pagesVisited.length, 2, '6.7.2 resetProfile preserves journey');

      // 6.8 Very long string handling
      const longString = 'x'.repeat(10000);
      TestUtils.assertNoThrow(() => {
        BubbleAgentMemory.addKeyInsight(longString);
        BubbleAgentMemory.setConversationSummary(longString);
      }, '6.8.1 Long strings do not throw');

      // 6.9 Concurrent-like operations (rapid succession)
      mockStorage.clear();
      BubbleAgentMemory.reset();

      for (let i = 0; i < 100; i++) {
        BubbleAgentMemory.updateRiskScore(Math.random() * 100);
        BubbleAgentMemory.addTrait('trait' + i);
        BubbleAgentMemory.recordPageVisit('page' + i);
      }

      const finalState = BubbleAgentMemory.getFullState();
      TestUtils.assertInRange(finalState.profile.riskScore, 0, 100, '6.9.1 Rapid operations maintain valid state');
      TestUtils.assertTrue(finalState.profile.traits.length <= 15, '6.9.2 Limits maintained under rapid operations');
    },

    // =========================================================================
    // 7. ADDITIONAL COVERAGE TESTS
    // =========================================================================
    additionalCoverageTests(BubbleAgentMemory, mockStorage) {
      TestUtils.group('7. ADDITIONAL COVERAGE TESTS');

      mockStorage.clear();
      BubbleAgentMemory.reset();

      // 7.1 addEmotionalResponse
      BubbleAgentMemory.addEmotionalResponse(
        'Market drops 20%',
        'I would hold and wait',
        10
      );

      const profile = BubbleAgentMemory.getProfile();
      TestUtils.assertEqual(profile.emotionalResponses.length, 1, '7.1.1 Emotional response recorded');
      TestUtils.assertEqual(profile.emotionalResponses[0].scenario, 'Market drops 20%', '7.1.2 Scenario preserved');
      TestUtils.assertEqual(profile.emotionalResponses[0].response, 'I would hold and wait', '7.1.3 Response preserved');
      TestUtils.assertEqual(profile.emotionalResponses[0].score, 10, '7.1.4 Score preserved');

      // Test limit (20 max)
      for (let i = 0; i < 25; i++) {
        BubbleAgentMemory.addEmotionalResponse('Scenario ' + i, 'Response ' + i, i);
      }
      const profileAfter = BubbleAgentMemory.getProfile();
      TestUtils.assertTrue(profileAfter.emotionalResponses.length <= 20, '7.1.5 Emotional responses limited to 20');

      // 7.2 addInsight (raw insights)
      mockStorage.clear();
      BubbleAgentMemory.reset();

      BubbleAgentMemory.addInsight('User mentioned they are 35 years old');
      BubbleAgentMemory.addInsight('User has existing investments in real estate');

      const profileWithInsights = BubbleAgentMemory.getProfile();
      TestUtils.assertEqual(profileWithInsights.rawInsights.length, 2, '7.2.1 Raw insights recorded');
      TestUtils.assertNotNull(profileWithInsights.rawInsights[0].timestamp, '7.2.2 Insight has timestamp');

      // Test limit (50 max)
      for (let i = 0; i < 55; i++) {
        BubbleAgentMemory.addInsight('Insight ' + i);
      }
      const profileWithManyInsights = BubbleAgentMemory.getProfile();
      TestUtils.assertTrue(profileWithManyInsights.rawInsights.length <= 50, '7.2.3 Raw insights limited to 50');

      // 7.3 getHoursSinceLastVisit
      mockStorage.clear();
      BubbleAgentMemory.reset();

      const hoursSince = BubbleAgentMemory.getHoursSinceLastVisit();
      TestUtils.assertInRange(hoursSince, 0, 1, '7.3.1 Hours since last visit is 0 for fresh state');

      // 7.4 getOnboardingProgress
      mockStorage.clear();
      BubbleAgentMemory.reset();

      TestUtils.assertEqual(BubbleAgentMemory.getOnboardingProgress(), 0, '7.4.1 Initial onboarding progress is 0');

      BubbleAgentMemory.updateOnboardingProgress(45);
      TestUtils.assertEqual(BubbleAgentMemory.getOnboardingProgress(), 45, '7.4.2 Onboarding progress getter works');

      // 7.5 Full state getter
      mockStorage.clear();
      BubbleAgentMemory.reset();

      const fullState = BubbleAgentMemory.getFullState();
      TestUtils.assertHasProperty(fullState, 'version', '7.5.1 Full state has version');
      TestUtils.assertHasProperty(fullState, 'createdAt', '7.5.2 Full state has createdAt');
      TestUtils.assertHasProperty(fullState, 'lastUpdated', '7.5.3 Full state has lastUpdated');
      TestUtils.assertHasProperty(fullState, 'profile', '7.5.4 Full state has profile');
      TestUtils.assertHasProperty(fullState, 'journey', '7.5.5 Full state has journey');
      TestUtils.assertHasProperty(fullState, 'memory', '7.5.6 Full state has memory');

      // 7.6 Profile name edge cases (testing boundary values)
      // Note: Using includes() for accented French text compatibility
      TestUtils.assertTrue(
        BubbleAgentMemory.getProfileName(0).includes('Prudent'),
        '7.6.1 Score 0 contains Prudent (Tres Prudent)'
      );
      TestUtils.assertTrue(
        BubbleAgentMemory.getProfileName(19).includes('Prudent'),
        '7.6.2 Score 19 contains Prudent (Tres Prudent)'
      );
      TestUtils.assertEqual(BubbleAgentMemory.getProfileName(20), 'Prudent', '7.6.3 Score 20 = Prudent');
      TestUtils.assertEqual(BubbleAgentMemory.getProfileName(39), 'Prudent', '7.6.4 Score 39 = Prudent');
      TestUtils.assertTrue(
        BubbleAgentMemory.getProfileName(40).includes('quilibr'),
        '7.6.5 Score 40 contains quilibr (Equilibre)'
      );
      TestUtils.assertTrue(
        BubbleAgentMemory.getProfileName(59).includes('quilibr'),
        '7.6.6 Score 59 contains quilibr (Equilibre)'
      );
      TestUtils.assertEqual(BubbleAgentMemory.getProfileName(60), 'Dynamique', '7.6.7 Score 60 = Dynamique');
      TestUtils.assertEqual(BubbleAgentMemory.getProfileName(79), 'Dynamique', '7.6.8 Score 79 = Dynamique');
      TestUtils.assertEqual(BubbleAgentMemory.getProfileName(80), 'Offensif', '7.6.9 Score 80 = Offensif');
      TestUtils.assertEqual(BubbleAgentMemory.getProfileName(100), 'Offensif', '7.6.10 Score 100 = Offensif');

      // 7.7 Allocation calculation edge cases
      mockStorage.clear();
      BubbleAgentMemory.reset();

      BubbleAgentMemory.updateRiskScore(0);
      let allocation = BubbleAgentMemory.getRecommendedAllocation();
      TestUtils.assertEqual(allocation.stocks, 0, '7.7.1 Score 0 = 0% stocks');
      TestUtils.assertTrue(allocation.bonds > 0, '7.7.2 Score 0 = high bonds');

      mockStorage.clear();
      BubbleAgentMemory.reset();
      BubbleAgentMemory.updateRiskScore(100);
      allocation = BubbleAgentMemory.getRecommendedAllocation();
      TestUtils.assertEqual(allocation.stocks, 80, '7.7.3 Score 100 = 80% stocks (max)');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST RUNNER
  // ═══════════════════════════════════════════════════════════════════════════

  const BubbleAgentMemoryTests = {
    /**
     * Run all tests
     */
    runAll(BubbleAgentMemory) {
      console.log('\n');
      console.log('*'.repeat(60));
      console.log('*  BUBBLEAGENTMEMORY TEST SUITE');
      console.log('*'.repeat(60));

      TestUtils.reset();

      // Create mock localStorage if needed
      let mockStorage;
      let originalLocalStorage;

      if (typeof localStorage !== 'undefined') {
        // Browser environment - create mock and swap
        mockStorage = new MockLocalStorage();
        originalLocalStorage = global.localStorage;

        // We can't directly replace localStorage in modern browsers
        // So we'll work with the real one but clear it
        try {
          localStorage.clear();
        } catch (e) {
          console.warn('Cannot clear localStorage, tests may have side effects');
        }

        // For browser, use real localStorage but wrap the storage object for tests
        mockStorage = {
          store: {},
          clear() {
            try { localStorage.removeItem('bubbleUnifiedAgent'); } catch (e) { }
          },
          disable() { this._disabled = true; },
          enable() { this._disabled = false; },
          setQuota() { /* Browser handles quota */ },
          setItem(k, v) { localStorage.setItem(k, v); },
          getItem(k) { return localStorage.getItem(k); },
          removeItem(k) { localStorage.removeItem(k); }
        };
      } else {
        // Node.js environment - create full mock
        mockStorage = new MockLocalStorage();
        global.localStorage = mockStorage;
      }

      // Get or require BubbleAgentMemory
      let BAM = BubbleAgentMemory;
      if (!BAM && typeof require !== 'undefined') {
        try {
          BAM = require('../bubble-agent-memory.js');
        } catch (e) {
          console.error('Could not load BubbleAgentMemory module:', e.message);
          return false;
        }
      }

      if (!BAM) {
        console.error('BubbleAgentMemory not available. Ensure it is loaded before running tests.');
        return false;
      }

      // Run test suites
      try {
        TestSuites.initializationTests(BAM, mockStorage);
        TestSuites.profileMethodsTests(BAM, mockStorage);
        TestSuites.journeyMethodsTests(BAM, mockStorage);
        TestSuites.memoryMethodsTests(BAM, mockStorage);
        TestSuites.getterTests(BAM, mockStorage);
        TestSuites.edgeCaseTests(BAM, mockStorage);
        TestSuites.additionalCoverageTests(BAM, mockStorage);
      } catch (e) {
        console.error('Test execution error:', e);
        TestUtils.failCount++;
      }

      // Cleanup
      mockStorage.clear();

      // Print summary
      const allPassed = TestUtils.summary();

      return allPassed;
    },

    /**
     * Run specific test group
     */
    runGroup(groupName, BubbleAgentMemory) {
      TestUtils.reset();

      const mockStorage = new MockLocalStorage();
      if (typeof localStorage === 'undefined') {
        global.localStorage = mockStorage;
      } else {
        // Browser - use wrapper
        mockStorage.clear = () => { try { localStorage.removeItem('bubbleUnifiedAgent'); } catch (e) { } };
        mockStorage.disable = () => { };
        mockStorage.enable = () => { };
        mockStorage.setQuota = () => { };
      }

      let BAM = BubbleAgentMemory;
      if (!BAM && typeof require !== 'undefined') {
        BAM = require('../bubble-agent-memory.js');
      }

      const groupMap = {
        'initialization': TestSuites.initializationTests,
        'profile': TestSuites.profileMethodsTests,
        'journey': TestSuites.journeyMethodsTests,
        'memory': TestSuites.memoryMethodsTests,
        'getter': TestSuites.getterTests,
        'edge': TestSuites.edgeCaseTests,
        'additional': TestSuites.additionalCoverageTests
      };

      if (groupMap[groupName]) {
        groupMap[groupName](BAM, mockStorage);
        return TestUtils.summary();
      } else {
        console.error('Unknown test group:', groupName);
        console.log('Available groups:', Object.keys(groupMap).join(', '));
        return false;
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORTS
  // ═══════════════════════════════════════════════════════════════════════════

  // Export for browser
  if (typeof window !== 'undefined') {
    window.BubbleAgentMemoryTests = BubbleAgentMemoryTests;
  }

  // Export for Node.js
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = BubbleAgentMemoryTests;
  }

  // Auto-run in Node.js if executed directly
  if (typeof require !== 'undefined' && require.main === module) {
    // Running directly in Node.js
    console.log('Running BubbleAgentMemory tests...\n');

    // Setup Node.js environment
    const MockLS = new MockLocalStorage();
    global.localStorage = MockLS;

    // Load the module
    const BubbleAgentMemory = require('../bubble-agent-memory.js');

    // Run tests
    const success = BubbleAgentMemoryTests.runAll(BubbleAgentMemory);

    // Exit with appropriate code
    process.exit(success ? 0 : 1);
  }

})(typeof window !== 'undefined' ? window : global);
