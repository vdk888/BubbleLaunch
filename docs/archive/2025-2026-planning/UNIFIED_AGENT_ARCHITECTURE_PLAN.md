# Unified Bubble Agent Architecture Plan

**Status:** PLANNING (Awaiting Approval)
**Created:** 2026-01-08
**Author:** Claude + User collaboration

---

## Executive Summary

Transform Bubble's fragmented chatbot implementations into a **single omniscient AI agent** that:
- Remembers everything about the user (localStorage, forever)
- Builds a progressive risk profile through natural conversation (not MCQs)
- Feels like a helpful friend with a whimsical personality
- Provides personalized guidance across Playground, Arena, and Simulator

---

## Current Problems (Audit Findings)

### 1. Fragmented Memory
- 6 different sessionStorage keys across 9 JS files
- User profile from onboarding is NOT passed to other pages
- LLM literally "forgets" what user told it

### 2. Two Competing Onboarding Systems
- `playground-fullscreen-chat.js`: Scripted MCQ (12 stages, feels like a test)
- `playground-llm-chat.js`: LLM-driven (natural but forgets everything)

### 3. Wrong UX Pattern
- Current: Pre-written multiple choice answers
- Problem: Feels impersonal, like a quiz, not a conversation
- User wants: Free-form typing/voice, intimate "tu" tone, friend-like

---

## Architecture Vision

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BUBBLE UNIFIED AGENT                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                 BubbleAgentMemory (localStorage)              │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │   │
│  │  │ UserProfile │  │   Journey   │  │   Conversation      │   │   │
│  │  │ - riskScore │  │ - pages     │  │   History           │   │   │
│  │  │ - traits    │  │ - actions   │  │   (summarized)      │   │   │
│  │  │ - goals     │  │ - timestamp │  │                     │   │   │
│  │  │ - horizon   │  │             │  │                     │   │   │
│  │  │ - style     │  │             │  │                     │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Unified System Prompt (Backend)                  │   │
│  │  - Receives full userProfile                                  │   │
│  │  - Receives journey context                                   │   │
│  │  - Receives page-specific context (arena state, simulator)    │   │
│  │  - Adapts tone, vocabulary, suggestions                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│  │ Playground │  │   Arena    │  │ Simulator  │  │  Homepage  │    │
│  │ Onboarding │  │  Chatbot   │  │  Chatbot   │  │  Chatbot   │    │
│  │            │  │            │  │            │  │            │    │
│  │ "Entonnoir"│  │ Highlights │  │ Pre-applies│  │ Awareness  │    │
│  │ Profile    │  │ matching   │  │ allocation │  │ of profile │    │
│  │ Building   │  │ bot        │  │ + tutorial │  │            │    │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation - BubbleAgentMemory

### Goal
Create a unified memory system that persists forever and is accessible from all pages.

### Implementation

#### 1.1 Create `src/frontend/js/bubble-agent-memory.js`

```javascript
/**
 * BubbleAgentMemory - Unified persistent memory for the Bubble AI Agent
 * Stores user profile, journey, and conversation summaries in localStorage
 */
const BubbleAgentMemory = (function() {
  'use strict';

  const STORAGE_KEY = 'bubbleUnifiedAgent';
  const VERSION = '1.0';

  // Default structure
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
      rawInsights: []            // LLM-generated insights from conversations
    },

    // Journey tracking
    journey: {
      onboardingStarted: null,
      onboardingCompleted: null,
      onboardingProgress: 0,     // 0-100%
      pagesVisited: [],          // [{page, timestamp, duration}]
      actionsPerformed: [],      // [{action, context, timestamp}]
      questionsAsked: [],        // Topics user asked about
      strategiesTested: []       // Allocations user tried in simulator
    },

    // Conversation memory (summarized, not full history)
    memory: {
      keyInsights: [],           // Important things learned about user
      topicsDiscussed: [],       // Topics covered
      lastConversationSummary: null,
      conversationCount: 0
    }
  };

  let state = null;

  // Initialize or load existing state
  function init() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        state = JSON.parse(stored);
        // Migration if version mismatch
        if (state.version !== VERSION) {
          state = migrateState(state);
        }
      } catch (e) {
        console.warn('[BubbleAgentMemory] Corrupt state, resetting');
        state = createFreshState();
      }
    } else {
      state = createFreshState();
    }
    return state;
  }

  function createFreshState() {
    return {
      ...DEFAULT_STATE,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  }

  function save() {
    state.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // ═══════════════════════════════════════════════════════════════
  // Profile Methods (Entonnoir - Progressive Building)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Update risk score with new data point
   * Uses weighted average to refine progressively
   */
  function updateRiskScore(newDataPoint, weight = 1) {
    if (state.profile.riskScore === null) {
      state.profile.riskScore = newDataPoint;
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

  function addTrait(trait) {
    if (!state.profile.traits.includes(trait)) {
      state.profile.traits.push(trait);
      save();
    }
  }

  function addInsight(insight) {
    state.profile.rawInsights.push({
      insight,
      timestamp: new Date().toISOString()
    });
    // Keep only last 50 insights
    if (state.profile.rawInsights.length > 50) {
      state.profile.rawInsights = state.profile.rawInsights.slice(-50);
    }
    save();
  }

  function setGoal(goal) {
    state.profile.investmentGoal = goal;
    save();
  }

  function setHorizon(horizon) {
    state.profile.investmentHorizon = horizon;
    save();
  }

  function setKnowledgeLevel(level) {
    state.profile.knowledgeLevel = level;
    save();
  }

  function setLearningStyle(style) {
    state.profile.learningStyle = style;
    save();
  }

  function addEmotionalResponse(scenario, response, score) {
    state.profile.emotionalResponses.push({
      scenario,
      response,
      score,
      timestamp: new Date().toISOString()
    });
    save();
  }

  // ═══════════════════════════════════════════════════════════════
  // Journey Methods
  // ═══════════════════════════════════════════════════════════════

  function startOnboarding() {
    state.journey.onboardingStarted = new Date().toISOString();
    state.journey.onboardingProgress = 0;
    save();
  }

  function updateOnboardingProgress(progress) {
    state.journey.onboardingProgress = Math.min(100, progress);
    save();
  }

  function completeOnboarding() {
    state.journey.onboardingCompleted = new Date().toISOString();
    state.journey.onboardingProgress = 100;
    save();
  }

  function recordPageVisit(page) {
    state.journey.pagesVisited.push({
      page,
      timestamp: new Date().toISOString()
    });
    save();
  }

  function recordAction(action, context = {}) {
    state.journey.actionsPerformed.push({
      action,
      context,
      timestamp: new Date().toISOString()
    });
    save();
  }

  function recordStrategyTest(allocation, metrics) {
    state.journey.strategiesTested.push({
      allocation,
      metrics,
      timestamp: new Date().toISOString()
    });
    save();
  }

  // ═══════════════════════════════════════════════════════════════
  // Memory Methods (Conversation Summaries)
  // ═══════════════════════════════════════════════════════════════

  function addKeyInsight(insight, source) {
    state.memory.keyInsights.push({
      insight,
      source,
      timestamp: new Date().toISOString()
    });
    // Keep last 30 key insights
    if (state.memory.keyInsights.length > 30) {
      state.memory.keyInsights = state.memory.keyInsights.slice(-30);
    }
    save();
  }

  function recordTopic(topic) {
    if (!state.memory.topicsDiscussed.includes(topic)) {
      state.memory.topicsDiscussed.push(topic);
      save();
    }
  }

  function setConversationSummary(summary) {
    state.memory.lastConversationSummary = summary;
    state.memory.conversationCount++;
    save();
  }

  // ═══════════════════════════════════════════════════════════════
  // Getters
  // ═══════════════════════════════════════════════════════════════

  function getProfile() {
    return { ...state.profile };
  }

  function getJourney() {
    return { ...state.journey };
  }

  function getMemory() {
    return { ...state.memory };
  }

  function getFullState() {
    return JSON.parse(JSON.stringify(state));
  }

  /**
   * Get a summary suitable for sending to the LLM
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
        style: state.profile.learningStyle
      },
      journey: {
        onboardingCompleted: !!state.journey.onboardingCompleted,
        onboardingProgress: state.journey.onboardingProgress,
        pagesVisitedCount: state.journey.pagesVisited.length,
        lastPage: state.journey.pagesVisited.slice(-1)[0]?.page,
        strategiesTestedCount: state.journey.strategiesTested.length
      },
      memory: {
        keyInsights: state.memory.keyInsights.slice(-5).map(i => i.insight),
        topicsDiscussed: state.memory.topicsDiscussed.slice(-10),
        conversationCount: state.memory.conversationCount
      }
    };
  }

  function isOnboardingCompleted() {
    return !!state.journey.onboardingCompleted;
  }

  function getOnboardingProgress() {
    return state.journey.onboardingProgress;
  }

  // ═══════════════════════════════════════════════════════════════
  // Reset (for testing)
  // ═══════════════════════════════════════════════════════════════

  function reset() {
    state = createFreshState();
    save();
    console.log('[BubbleAgentMemory] State reset');
  }

  // Initialize on load
  init();

  // Public API
  return {
    // Profile
    updateRiskScore,
    addTrait,
    addInsight,
    setGoal,
    setHorizon,
    setKnowledgeLevel,
    setLearningStyle,
    addEmotionalResponse,

    // Journey
    startOnboarding,
    updateOnboardingProgress,
    completeOnboarding,
    recordPageVisit,
    recordAction,
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

    // Utils
    reset,
    init
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BubbleAgentMemory;
}
```

#### 1.2 Update All Chat Implementations

Every frontend chatbot file will be updated to:
1. Import/use `BubbleAgentMemory`
2. Pass `getContextForLLM()` to `/api/chat`
3. Store insights returned by LLM

#### 1.3 Update Backend System Prompt

Modify `chat.controller.js` to use the full context from `BubbleAgentMemory`:

```javascript
// In unifiedSystemPrompt function
if (userContext && userContext.profile) {
  // Build personalized context block
  profileBlock = `
### USER PROFILE (Progressive - Confidence: ${userContext.profile.riskConfidence}%)
- Risk Score: ${userContext.profile.riskScore}/100
- Traits: ${userContext.profile.traits.join(', ')}
- Goal: ${userContext.profile.goal || 'not yet determined'}
- Horizon: ${userContext.profile.horizon || 'not yet determined'}
- Level: ${userContext.profile.level || 'beginner'}
- Style: ${userContext.profile.style || 'dialogue'}

### WHAT WE KNOW ABOUT THEM
${userContext.memory.keyInsights.map(i => `- ${i}`).join('\n')}

### ONBOARDING STATUS
- Completed: ${userContext.journey.onboardingCompleted ? 'Yes' : 'No'}
- Progress: ${userContext.journey.onboardingProgress}%
`;
}
```

---

## Phase 2: Conversational Onboarding (Entonnoir)

### Goal
Replace rigid MCQ onboarding with natural conversation that progressively reveals user's profile.

### Design Principles

1. **No pre-written answers for profiling questions**
   - User types freely or uses voice
   - LLM interprets and extracts insights

2. **Pre-written buttons ONLY for:**
   - Pedagogical: "C'est quoi un ETF ?" / "Explique-moi la volatilité"
   - Navigation: "Attends, je suis perdu" / "Reviens en arrière" / "Passe à la suite"

3. **Tone: Intimate friend with whimsical personality**
   - Always "tu" (never "vous")
   - Warm, curious, slightly playful
   - Never judgmental
   - Celebrates user's responses

4. **Progressive scoring (Entonnoir)**
   - Each response adds data to the profile
   - Risk score refines with confidence %
   - Never feels like a test

### Conversation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ONBOARDING ENTONNOIR                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Stage 1: WARM WELCOME (No profiling yet)                       │
│  ─────────────────────────────────────────                      │
│  Bot: "Salut ! Je suis ton assistant Bubble. Je suis là         │
│        pour t'aider à comprendre comment investir selon         │
│        TA personnalité. Pas de jargon, promis."                 │
│                                                                  │
│  Bot: "Avant qu'on commence, dis-moi... c'est quoi qui          │
│        t'amène ici aujourd'hui ?"                               │
│                                                                  │
│  [User types freely]                                            │
│  → LLM extracts: goal, initial sentiment, knowledge level       │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Stage 2: UNDERSTANDING THEIR WORLD                             │
│  ──────────────────────────────────                             │
│  Bot: "Cool ! Et niveau investissement, t'en es où ?            │
│        Tu débutes complètement ou t'as déjà touché à ça ?"      │
│                                                                  │
│  [User types freely]                                            │
│  → LLM extracts: knowledge level, confidence, past experience   │
│                                                                  │
│  [Buttons shown for pedagogy only]:                             │
│  "C'est quoi investir exactement ?" | "J'ai des questions"      │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Stage 3: EMOTIONAL SCENARIO (The real profiling)               │
│  ────────────────────────────────────────────────               │
│  Bot: "Imagine un truc : tu viens de mettre 10 000€ en bourse.  │
│        Le lendemain, paf, -20%. T'as perdu 2000€ sur le papier. │
│        Honnêtement, tu réagis comment ?"                        │
│                                                                  │
│  [User types freely - THIS IS KEY]                              │
│  → LLM analyzes emotional response, updates risk score          │
│  → "Je panique et je vends tout" → risk score -= 30             │
│  → "Ça me stresse mais je touche à rien" → risk score += 0      │
│  → "J'achète plus, c'est les soldes !" → risk score += 30       │
│                                                                  │
│  Bot validates and digs deeper:                                 │
│  "Intéressant ! Et si ça durait 6 mois, cette baisse ?"         │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Stage 4: TIME HORIZON                                          │
│  ─────────────────────                                          │
│  Bot: "Et cet argent, tu comptes en faire quoi ?                │
│        C'est pour un projet précis ou juste faire fructifier ?" │
│                                                                  │
│  [User types freely]                                            │
│  → LLM extracts: horizon, goal clarity, flexibility             │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Stage 5: PROFILE REVEAL (Celebration moment)                   │
│  ───────────────────────────────────────────                    │
│  [Progress bar fills to 100%]                                   │
│                                                                  │
│  Bot: "J'ai compris qui tu es ! 🎯                              │
│                                                                  │
│        Tu es plutôt [PROFIL NAME] - quelqu'un qui [description].│
│                                                                  │
│        Avec ton horizon de [X ans] et ta tolérance au risque,   │
│        je te recommande une approche avec environ [X]% actions  │
│        et [Y]% obligations.                                     │
│                                                                  │
│        Mais le plus cool, c'est qu'on va pouvoir personnaliser  │
│        tout ça ensemble. Tu veux voir ce que ça donnerait       │
│        sur 20 ans ?"                                            │
│                                                                  │
│  [Button]: "Montre-moi !" → Goes to Simulator                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### LLM Profile Extraction Prompt

The backend will have a special instruction for onboarding mode:

```
### ONBOARDING MODE: PROFILE EXTRACTION

You are conducting a natural conversation to understand the user's investment profile.

After EACH user response, you must:
1. Respond warmly and naturally like a friend (2-3 sentences max)
2. Extract insights in a structured format (invisible to user)

EXTRACTION FORMAT (append to your response as JSON comment):
<!-- PROFILE_UPDATE
{
  "riskScoreAdjustment": -10 to +10,
  "traits": ["trait1", "trait2"],
  "goalHint": "string or null",
  "horizonHint": "short|medium|long|very_long or null",
  "levelHint": "beginner|intermediate|advanced or null",
  "insight": "One sentence insight about this user"
}
-->

SCORING GUIDE:
- Panic selling, fear of loss → riskScoreAdjustment: -20 to -30
- Cautious, wants safety → riskScoreAdjustment: -10 to -15
- Balanced, pragmatic → riskScoreAdjustment: 0
- Growth-oriented, patient → riskScoreAdjustment: +10 to +15
- Aggressive, sees drops as opportunities → riskScoreAdjustment: +20 to +30
```

### Progress Sidebar Component

```
┌─────────────────────────┐
│  TON PROFIL SE DESSINE  │
├─────────────────────────┤
│                         │
│  Tolérance au risque    │
│  ████████░░░░░░  65%    │
│  (confiance: 40%)       │
│                         │
│  ─────────────────────  │
│                         │
│  Ce qu'on sait de toi:  │
│  • Patient sur le LT    │
│  • Objectif: retraite   │
│  • Niveau: débutant     │
│                         │
│  ─────────────────────  │
│                         │
│  Progression            │
│  ████████████░░  75%    │
│                         │
└─────────────────────────┘
```

---

## Phase 3: Post-Onboarding Magic

### Goal
When user arrives at Simulator after onboarding, create the "Aha moment"

### User Flow

```
User completes onboarding → Clicks "Voir le Simulateur"
                                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                     SIMULATOR PAGE LOADS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. IMMEDIATE (0ms)                                             │
│     - BubbleAgentMemory.getProfile() loaded                     │
│     - Allocation pre-applied based on profile                   │
│     - Chart shows personalized strategy                         │
│                                                                  │
│  2. AFTER 500ms                                                 │
│     - Chatbot auto-opens (not minimized)                        │
│     - Personalized welcome message appears                      │
│                                                                  │
│  3. AFTER 1500ms                                                │
│     - Guided tour overlay fades in                              │
│     - Spotlight on first element                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Welcome Message (Personalized)

```javascript
// Example for "Dynamique" profile (70% stocks)
const welcomeMessage = `
Bienvenue dans le Simulateur ! 

J'ai préparé quelque chose pour toi. Basé sur notre conversation,
j'ai appliqué une allocation "Dynamique" : 70% actions, 20% obligations, 10% or.

Sur 20 ans, cette stratégie aurait transformé 10 000€ en ~${projectedValue}€.

Mais c'est TON terrain de jeu ici. Tu veux :
`;

// Buttons (pedagogical, not profiling)
const buttons = [
  "Explique-moi ces résultats",
  "Je veux essayer autre chose",
  "C'est quoi le Sharpe ratio ?"
];
```

### Guided Tour Overlay

```
Step 1: Spotlight on Chart
─────────────────────────
"Voici l'évolution de ton portefeuille sur 20 ans.
 Les hauts et les bas, c'est normal - regarde comme
 ça finit par monter sur le long terme."

 [Button: "Compris !"]

Step 2: Spotlight on Allocation Sliders
──────────────────────────────────────
"Ces curseurs, c'est ton mix. Tu peux ajuster
 actions/obligations/or comme tu veux.
 Essaie de bouger SPY pour voir l'impact !"

 [Interactive: User must move a slider]
 [Button: "J'ai testé !"]

Step 3: Spotlight on Metrics
────────────────────────────
"Ces chiffres résument tout. Le Sharpe ratio,
 c'est le rendement par rapport au stress.
 Plus c'est haut, mieux c'est."

 [Hover tooltip on each metric]
 [Button: "C'est plus clair"]

Step 4: Spotlight on Strategy Comparison
────────────────────────────────────────
"Compare ta stratégie avec les classiques.
 Le 60/40 c'est la référence traditionnelle.
 Tu bats les pros ? 😏"

 [Button: "Je veux comparer !"]

Step 5: Completion
──────────────────
"Tu maîtrises ! Maintenant amuse-toi.
 Je suis là si t'as des questions.

 Psst... quand tu seras prêt, Bubble peut
 gérer tout ça automatiquement pour toi."

 [Button: "Rejoindre la waitlist"] [Button: "Je continue à explorer"]
```

---

## Phase 4: Arena Integration

### Goal
Connect Arena experience to user's profile

### Implementation

When user visits Arena after onboarding:

```javascript
// In arena.js init()
const memory = BubbleAgentMemory.getContextForLLM();

if (memory.profile.riskScore !== null) {
  // Find matching bot
  const matchingBot = findMatchingBot(memory.profile.riskScore);
  // Renard (Risk Parity) for balanced profiles
  // Hérisson (Defensive) for conservative profiles
  // Faucon (Momentum) for aggressive profiles
  // Ours (Equal Weight) for moderate profiles

  highlightMatchingBot(matchingBot);
  showPersonalizedWelcome(matchingBot, memory.profile);
}
```

### Personalized Arena Welcome

```
"Salut [prénom si connu] !

Avec ton profil Dynamique, je pense que tu vas
kiffer le Renard 🦊 - c'est la stratégie Risk Parity
qui correspond le mieux à ta tolérance au risque.

Mais regarde bien comment les autres se débrouillent
pendant les crises... ça va te donner des idées !"

[Bot card "Renard" has special highlight/glow]
```

---

## Phase 5: Voice Mode Enhancement

### Goal
Ensure voice input works seamlessly throughout the experience

### Already Implemented
- `education-floating-chat.js` has voice recognition
- `playground-fullscreen-chat.js` has voice recognition

### To Add
- Visual feedback during recording (waveform animation)
- Voice-to-profile extraction (same LLM parsing)
- "Dis-moi..." prompts that encourage voice

---

## Migration Plan

### Step 1: Create BubbleAgentMemory (non-breaking)
- Add new file
- Does not affect existing functionality
- Can be tested in isolation

### Step 2: Integrate into Playground Onboarding
- Modify `playground-fullscreen-chat.js`
- Store profile in BubbleAgentMemory
- Keep backwards compatibility

### Step 3: Update Education Floating Chat
- Read from BubbleAgentMemory
- Pass context to backend
- Personalized responses start working

### Step 4: Build New Conversational Onboarding
- Replace MCQ stages with LLM conversation
- Add progress sidebar
- Profile extraction from natural language

### Step 5: Post-Onboarding Experience
- Auto-open chatbot on Simulator
- Pre-apply allocation
- Guided tour overlay

### Step 6: Arena Integration
- Highlight matching bot
- Personalized welcome

---

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/frontend/js/bubble-agent-memory.js` | NEW | Unified memory system |
| `src/frontend/js/playground-fullscreen-chat.js` | MODIFY | Use BubbleAgentMemory, conversational flow |
| `src/frontend/js/education-floating-chat.js` | MODIFY | Pass full context to backend |
| `src/frontend/js/arena.js` | MODIFY | Profile-aware bot highlighting |
| `src/backend/controllers/chat.controller.js` | MODIFY | Enhanced system prompt with full context |
| `src/frontend/assets/styles/education.css` | MODIFY | Progress sidebar, guided tour styles |
| `src/frontend/pages/investors/playground/index.html` | MODIFY | Add progress sidebar |
| `src/frontend/pages/investors/education/simulator.html` | MODIFY | Guided tour overlay |

---

## Success Metrics

1. **Memory Works**: User profile persists across page refreshes and navigation
2. **Personalization**: LLM responses reference user's profile and past answers
3. **No MCQ Feel**: Onboarding feels like a conversation, not a quiz
4. **Aha Moment**: Users see their personalized projection on Simulator
5. **Conversion**: Increase in waitlist signups after guided experience

---

## Design Decisions (User Answers)

### 1. Profile Visualization (No Sidebar)
**Decision**: NO progress sidebar. Instead:
- **Playground (fullscreen)**: Graph/visual on LEFT side next to chatbot showing evolving profile
- **Other pages**: Optional floating tracking icon (keep minimal, not crowded)
- **UX Principle**: Simplify as much as possible

### 2. Risk Score Display
**Decision**: Show evolving risk score as part of the graph in Playground
- Real-time visual feedback as user answers
- Makes the "entonnoir" visible and engaging

### 3. Conversation Style
**Decision**: Natural, friend-like, adaptive
- Questions feel like talking to a friend
- Adapt to user's language style and responses
- **Off-topic handling**: Acknowledge briefly ("Ah oui, le temps est bizarre en ce moment!") then redirect back to Bubble/investment/onboarding
- Never get stuck on off-topic subjects

### 4. Returning Users
**Decision**: Resume + Welcome Back
- Greet with "Welcome back!"
- Provide summary of last session
- Continue from where they left off
- Offer refresh ONLY if user explicitly requests it

---

## Implementation Agents Architecture

To implement this unified agent system efficiently and correctly, we propose a **multi-agent implementation team** with specialized roles. This architecture follows **Anthropic's recommended patterns** from their multi-agent research system documentation.

### Anthropic's Core Loop (Our Guiding Principle)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     ANTHROPIC AGENT FEEDBACK LOOP                        │
│                                                                          │
│    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐             │
│    │   GATHER     │───▶│    TAKE      │───▶│   VERIFY     │──┐          │
│    │   CONTEXT    │    │   ACTION     │    │    WORK      │  │          │
│    └──────────────┘    └──────────────┘    └──────────────┘  │          │
│           ▲                                        │         │          │
│           │                                        ▼         │          │
│           │                               ┌──────────────┐   │          │
│           └───────────────────────────────│   EVALUATE   │◀──┘          │
│                    (iterate if needed)    │  Good enough?│              │
│                                           └──────────────┘              │
└─────────────────────────────────────────────────────────────────────────┘
```

### Agent Orchestra

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     IMPLEMENTATION AGENT ORCHESTRA                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                          ┌─────────────────┐                                 │
│                          │   COORDINATOR   │                                 │
│                          │     AGENT       │                                 │
│                          │                 │                                 │
│                          │ • Task planning │                                 │
│                          │ • Agent dispatch│                                 │
│                          │ • Conflict res. │                                 │
│                          │ • Quality gate  │                                 │
│                          └────────┬────────┘                                 │
│                                   │                                          │
│     ┌───────────┬───────────┬─────┴─────┬───────────┬───────────┐           │
│     │           │           │           │           │           │           │
│     ▼           ▼           ▼           ▼           ▼           ▼           │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────┐  │
│ │   UX    │ │ DESIGN  │ │  CODE   │ │  AUDIT  │ │  TEST   │ │ EVALUATOR │  │
│ │  AGENT  │ │  AGENT  │ │  AGENT  │ │  AGENT  │ │  AGENT  │ │   AGENT   │  │
│ │         │ │         │ │         │ │         │ │         │ │           │  │
│ │• Mobile │ │• Visual │ │• Backend│ │• Code   │ │• Manual │ │• Quality  │  │
│ │• Desktop│ │• CSS    │ │• Frontend│ │ quality│ │• Auto   │ │  scoring  │  │
│ │• Flow   │ │• Animate│ │• API    │ │• Security│ │• E2E   │ │• Iterate? │  │
│ │• A11y   │ │• Theme  │ │• Memory │ │• Perf   │ │• Edge   │ │• Ship it? │  │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └───────────┘  │
│                                                                              │
│  ════════════════════════════════════════════════════════════════════════   │
│  │ EXECUTION AGENTS (do the work)                    │ VALIDATION AGENTS │  │
│  │ UX, DESIGN, CODE                                  │ AUDIT, TEST, EVAL │  │
│  ════════════════════════════════════════════════════════════════════════   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Agent Definitions

---

## Anthropic Best Practices (Per Agent)

> Source: Official Anthropic documentation (2025-2026)
> - Building Effective Agents
> - Claude Agent SDK
> - Context Engineering Guide
> - Secure Deployment Guide

---

### 1. COORDINATOR AGENT (Orchestrator)

**Role**: Central brain that plans, dispatches, and validates all implementation work

**Responsibilities**:
- Parse implementation phases into atomic tasks
- Assign tasks to appropriate specialist agents
- Resolve conflicts between agent outputs (e.g., UX vs Design trade-offs)
- Enforce quality gates before merging changes
- Track progress and report status
- Handle dependencies between tasks

**Inputs**:
- This architecture plan document
- Current codebase state
- User feedback and priorities

**Outputs**:
- Task breakdown with assignments
- Implementation order (dependency-aware)
- Quality reports
- Progress updates

**Decision Authority**:
- Can reject agent output if it violates constraints
- Can re-assign tasks if agent struggles
- Final approval on all changes

**Anthropic Best Practices**:
> "Start with simple prompts, optimize them with comprehensive evaluation, and add multi-step agentic systems only when simpler solutions fall short."

> "Maintain simplicity in agent architecture, prioritize transparency through explicit planning visibility, and carefully craft agent-computer interfaces via thorough tool documentation and testing."

- **Subagent Pattern**: Farm out (X + Y) tokens to specialized agents, main agent only gets Z tokens → context stays clean
- **Context Clearing**: Reset context every 20 iterations - "Performance craters after 20. Fresh start = fresh code."
- **Pipeline Architecture**: Chain agents deterministically: analyst → architect → implementer → tester → security audit

---

### 2. UX AGENT (User Experience Specialist)

**Role**: Ensure the experience is simple, intuitive, and delightful on all devices. OpenAI or Apple's like experience, minimum clicks and interactions. Respect Bubble charte graphique. 

**Mission Statement**: *"Simplify as much as possible"*

**Responsibilities**:
- **Mobile-first design**: Touch targets (44px+), swipe gestures, bottom navigation. Mobile responsiveness 
- **Desktop optimization**: Keyboard shortcuts, hover states, multi-column layouts
- **User flow analysis**: Identify friction points, reduce clicks/steps
- **Accessibility (a11y)**: ARIA labels, focus management, screen reader support
- **Loading states**: Skeleton screens, progressive disclosure
- **Error handling UX**: Friendly messages, recovery paths

**Focus Areas for This Project**:
| Page | UX Considerations |
|------|-------------------|
| Playground (Fullscreen) | Profile graph placement on LEFT, chatbot on RIGHT, mobile stack view |
| Simulator | Auto-applied allocation feeling magical, guided tour non-intrusive |
| Arena | Bot highlight visible but not jarring, smooth transitions |
| All Pages | Floating chat icon consistent, not cluttering viewport |

**Artifacts Produced**:
- Mobile wireframes
- Desktop wireframes
- User flow diagrams
- Touch interaction specs
- A11y checklist

**Constraints**:
- Never add UI that clutters
- Prioritize speed and simplicity over features
- Mobile experience must be equal to desktop (on mobile it must feel like a native ios app)

**Anthropic Best Practices**:
> "Replace vague requests ('add tests for foo.py') with explicit requirements: 'write test cases covering edge cases where users are logged out; avoid mocks.' Precision on first attempts reduces correction cycles significantly."

> "Provide design mocks, screenshots, or test cases as concrete targets. Claude improves substantially through 2-3 iterations when given visual feedback."

- **Visual-Driven Development**: Return screenshots for model verification - check layout, styling, content hierarchy, responsiveness
- **Specificity**: Explicit requirements reduce correction cycles
- **Agent Transparency**: File system structure becomes context engineering—make it discoverable

---

### 3. DESIGN AGENT (Visual & Styling Specialist)

**Role**: Ensure visual consistency with Bubble's glassmorphism design system (Bubble charte graphique)

**Responsibilities**:
- **CSS implementation**: Glassmorphism effects, gradients, shadows
- **Animation**: Smooth transitions, micro-interactions, loading states
- **Theming**: Color palette consistency, dark/light mode readiness
- **Component library**: Reusable styled components
- **Typography**: Font weights, sizes, line heights
- **Responsive breakpoints**: Consistent behavior across screen sizes

**Design System Reference** (from existing codebase):
```css
/* Glassmorphism base */
background: rgba(255, 255, 255, 0.15);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.2);
border-radius: 24px;

/* Primary gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Shadows */
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
```

**Focus Areas for This Project**:
| Component | Design Requirements |
|-----------|---------------------|
| Profile Graph | Animated fill, color gradient based on risk score |
| Chat Messages | Friend-like bubbles, typing indicator animation |
| Guided Tour Spotlight | Soft glow, backdrop blur outside focus |
| Bot Cards (Arena) | Highlight glow for matching bot |
| Progress Visualization | Animated bar/gauge for onboarding progress |

**Artifacts Produced**:
- CSS classes/variables
- Animation keyframes
- Component style specs
- Color palette updates

**Constraints**:
- Match existing Bubble design system
- Keep animations subtle (no flashy distractions)
- Performance: GPU-accelerated animations only

**Anthropic Best Practices**:
> "Code is precise, composable, and infinitely reusable. Python scripts excel for file creation. Bash serves as a flexible execution layer."

- **Code as Output**: Generate reusable CSS/JS components, not one-off fixes
- **Minimal Toolset**: Ensure design tokens are self-contained, error-robust, and token-efficient
- **Iterative Refinement**: 2-3 iterations with visual feedback substantially improves output

---

### 4. CODE AGENT (Implementation Specialist)

**Role**: Write the actual JavaScript, backend logic, and integrations (best practices, clean code, performance optimization based on Anthropic documentation - to search online if needed). 

**Responsibilities**:
- **Backend (Node.js/Express)**:
  - Update `chat.controller.js` for profile-aware prompts
  - Add profile extraction parsing logic
  - Implement conversation summarization endpoint

- **Frontend (Vanilla JS)**:
  - Create `BubbleAgentMemory` module
  - Modify chat implementations to use unified memory
  - Implement profile graph component
  - Build guided tour overlay system

- **API Design**:
  - New endpoints for profile management
  - WebSocket considerations for real-time updates

**Focus Areas for This Project**:
| File | Changes |
|------|---------|
| `bubble-agent-memory.js` | NEW - Unified localStorage module |
| `chat.controller.js` | Enhanced system prompt with profile context |
| `playground-fullscreen-chat.js` | Conversational onboarding, profile extraction |
| `arena.js` | Profile-aware bot highlighting |
| `education-floating-chat.js` | Pass full context to backend |

**Artifacts Produced**:
- JavaScript modules
- API endpoint implementations
- Data models
- Integration code

**Constraints**:
- Vanilla JS only (no frameworks)
- Backwards compatible with existing flows
- No breaking changes to current functionality

**Anthropic Best Practices**:
> "Put yourself in the model's shoes. Is it obvious how to use this tool, based on the description and parameters?"

> "Design tool interfaces with clarity comparable to excellent API documentation. Include example usage, edge cases, input requirements, and clear boundaries between similar tools."

- **Tool Definition Standards**: Self-contained, error-robust, token-efficient outputs
- **CLAUDE.md**: Document bash commands, code style conventions, testing procedures - keep concise, refine iteratively
- **Tests First**: Write tests first → run & confirm failures → implement → code review
- **Context Management**: Use `/clear` frequently between tasks - can cut token consumption by 50-70%
- **Long-Running Pattern**: Use `init.sh` + `claude-progress.txt` + Git for continuity across sessions

---

### 5. AUDIT AGENT (Quality & Security Specialist)

**Role**: Review all code for quality, security and cyber-security, and best practices

**Responsibilities**:
- **Code quality**: Clean code principles, DRY, SOLID, based on best practices
- **Security**: XSS prevention, localStorage security, API input validation
- **Performance**: Memory leaks, render blocking, bundle size
- **Best practices**: Anthropic agent patterns, error handling
- **Technical debt**: Identify and flag shortcuts

**Audit Checklist for This Project**:
```
□ BubbleAgentMemory handles corrupt localStorage gracefully
□ Profile data is sanitized before sending to LLM
□ No sensitive data exposed in localStorage
□ Rate limiting on profile update endpoints
□ LLM prompt injection prevention
□ GDPR compliance (user can request data deletion)
□ Memory module doesn't block main thread
□ Fallback if localStorage is full/unavailable
```

**Artifacts Produced**:
- Code review reports
- Security assessment
- Performance benchmarks
- Refactoring recommendations
- archive unnecessary documents (like md file or delete them)
- tracking and updating documentation in md files

**Constraints**:
- Block deployment if critical issues found
- Provide specific fix recommendations (not just problems)

**Anthropic Best Practices**:
> "Claude Opus 4.5 sets a new standard in robustness to prompt injections—adversarial instructions hidden within content that AI models process."

> "No single technique closes the gap. Providers are layering training, classifiers, monitoring tools and internal guardrails to shrink the window in which prompt injection succeeds."

> "Defense in depth is still good practice. If an agent processes a malicious file that instructs it to send customer data to an external server, network controls can block that request entirely."

**Security Layers**:
- **Prompt Injection Defense**: Use `<thinking>` and `<answer>` tags, treat untrusted content as hostile
- **Permission Model**: Deny-all baseline with allowlists per subagent, confirmations for sensitive actions
- **Credential Management**: Run proxy outside agent boundary that injects credentials - agent never sees actual credentials
- **Sandboxing Options** (by strength):
  1. Sandbox runtime (lightweight)
  2. Containers (Docker with `--cap-drop ALL --network none`)
  3. gVisor (userspace kernel)
  4. Virtual Machines (Firecracker for microVMs)

**Container Security Config**:
```bash
docker run \
  --cap-drop ALL \
  --security-opt no-new-privileges \
  --read-only \
  --network none \
  --memory 2g \
  --user 1000:1000 \
  agent-image
```

---

### 6. TEST AGENT (Validation Specialist)

**Role**: Ensure all features work correctly across scenarios

**Responsibilities**:
- **Manual test cases**: User flow validation
- **Automated tests**: Unit tests for memory module
- **E2E scenarios**: Full onboarding → simulator → arena journey
- **Edge cases**: Returning users, corrupt data, network failures
- **Cross-browser**: Chrome, Safari, Firefox, mobile browsers
- **Regression**: Existing features still work

**Test Scenarios for This Project**:
```
ONBOARDING FLOW
├── New user completes full onboarding
├── User abandons mid-onboarding
├── User returns after partial completion
├── User provides off-topic responses
├── Voice input vs typing
└── Mobile vs desktop experience

MEMORY PERSISTENCE
├── Profile survives page refresh
├── Profile survives browser restart
├── Corrupt localStorage recovery
├── localStorage full scenario
└── Incognito mode behavior

CROSS-PAGE CONTINUITY
├── Onboarding → Simulator transition
├── Simulator → Arena transition
├── Profile shown correctly on all pages
└── Chat history awareness across pages

ARENA INTEGRATION
├── Correct bot highlighted for profile
├── No highlight if no profile
├── Transition animation smooth
└── Personalized welcome message
```

**Artifacts Produced**:
- Test case documentation
- Bug reports
- Test coverage report
- Browser compatibility matrix

**Constraints**:
- All P0 tests must pass before deployment
- Document any known limitations

**Anthropic Best Practices**:
> "Agents write better code when they follow the same discipline as senior engineers. Ask the testing subagent to write tests first; run them and confirm failures; then instruct the implementer subagent to make the tests pass without changing the tests."

> "Design evals that mirror your real-world task distribution. Don't forget to factor in edge cases like: irrelevant or nonexistent input data, overly long input data, poor/harmful user input, and ambiguous test cases."

> "Prioritize volume over quality: More questions with slightly lower signal automated grading is better than fewer questions with high-quality human hand-graded evals."

**Grading Strategy Hierarchy**:
1. **Code-based** (fastest): `output == golden_answer`, `key_phrase in output`
2. **LLM-based** (flexible): Detailed rubrics, empirical instructions, reasoning before deciding
3. **Human** (most flexible, slowest): Use when rule-based judgment isn't feasible

**Eval Methods by Use Case**:
| Use Case | Method |
|----------|--------|
| Consistency | Cosine similarity of embeddings |
| Summarization | ROUGE-L (longest common subsequence) |
| Tone/Style | LLM-based Likert scale (1-5) |
| Privacy/Safety | LLM-based binary classification |

**Failure Mode Investigation**:
- Missing key information? → Restructure search APIs
- Repeated failures? → Add formal validation rules
- Error-correction limitations? → Provide alternative tools
- Performance variance? → Build representative test sets

---

### 7. EVALUATOR AGENT (Quality & Iteration Specialist)

**Role**: Assess output quality and decide whether to ship or iterate

**Why This Agent Exists** (per Anthropic guidance):
> The feedback loop is critical: "gather context → take action → verify work → **evaluate** → repeat if needed"

The EVALUATOR is distinct from TEST and AUDIT:
- **TEST**: "Does it work?" (binary pass/fail)
- **AUDIT**: "Is it secure and well-coded?" (technical review)
- **EVALUATOR**: "Is it good enough for users? Should we iterate?" (quality judgment)

**Responsibilities**:
- **Quality scoring**: Rate outputs on defined criteria (not just pass/fail)
- **User perspective**: Would a real user understand/enjoy this? What are the user stories and does they respect the requirements ?
- **Iteration decision**: "Ship it" vs "Needs another round"
- **Gap identification**: What's missing? What could be better?
- **Acceptance criteria**: Define and verify "done" for each phase

**Evaluation Criteria for This Project**:

| Dimension | Question | Score 1-5 |
|-----------|----------|-----------|
| **Simplicity** | Can a non-tech user figure this out in <30 seconds? | |
| **Naturalness** | Does the conversation feel like talking to a friend? | |
| **Continuity** | Does the agent feel like it "knows" the user across pages? | |
| **Delight** | Is there an "aha moment" that creates emotional response? | |
| **Robustness** | Does it handle edge cases gracefully? | |

**Phase-Specific Evaluation**:

```
PHASE 1 (BubbleAgentMemory):
├── Is the API intuitive for other agents to use?
├── Does it handle corrupt data gracefully?
└── Minimum score: 4/5 on Robustness

PHASE 2 (Conversational Onboarding):
├── Does it feel like a quiz or a natural conversation?
├── Does off-topic handling feel natural?
├── Is the profile extraction accurate?
└── Minimum score: 4/5 on Naturalness

PHASE 3 (Profile Visualization):
├── Is the graph intuitive without explanation?
├── Does real-time update feel magical or distracting?
└── Minimum score: 4/5 on Simplicity

PHASE 4 (Post-Onboarding):
├── Does the guided tour help or annoy?
├── Is the "aha moment" actually delightful?
└── Minimum score: 4/5 on Delight

PHASE 5 (Arena Integration):
├── Is the bot highlight obvious but not jarring?
├── Does the personalized welcome feel authentic?
└── Minimum score: 4/5 on Continuity
```

**Iteration Protocol**:

```
IF score < 4/5 on any critical dimension:
  → EVALUATOR flags specific issues
  → COORDINATOR re-assigns to relevant agent
  → Cycle repeats until 4/5+ achieved

IF score >= 4/5 on all dimensions:
  → EVALUATOR approves for next phase
  → COORDINATOR proceeds
```

**Artifacts Produced**:
- Quality scorecards per phase
- Iteration recommendations (specific, actionable)
- "Ship it" approval with rationale
- User perspective insights

**Constraints**:
- Must evaluate from USER perspective, not developer perspective
- Cannot approve if any critical dimension < 4/5
- Must provide specific improvement suggestions (not vague feedback)

**Anthropic Best Practices**:
> "Active collaboration rather than passive automation. Four correction tools: request planning before implementation, use Escape to interrupt, double-tap Escape to revisit, ask to undo changes when approaches fail."

> "Evaluate agents by examining failure cases. Ask critical questions: Missing key information? Restructure. Repeated failures? Add validation. Error-correction limitations? Provide alternatives."

**Evaluation Patterns**:
- **Rules-Based Feedback**: Define explicit validation rules, use TypeScript for strictness
- **Visual Feedback**: Return screenshots for UI verification - layout, styling, content hierarchy
- **LLM-as-Judge**: Use secondary models to evaluate tone/quality when gains justify latency
- **Iterative Correction**: 2-3 iterations with visual feedback substantially improves output

**When to Iterate vs Ship**:
| Signal | Action |
|--------|--------|
| Score < 4/5 on critical dimension | Iterate with specific feedback |
| User won't understand in <30s | Iterate (simplicity issue) |
| Feels like a quiz, not conversation | Iterate (naturalness issue) |
| No "aha moment" felt | Iterate (delight issue) |
| All dimensions ≥ 4/5 | Ship it |

---

### Agent Interaction Protocol

```
WORKFLOW EXAMPLE: Implement Profile Graph Component

1. COORDINATOR receives task "Add profile graph to Playground"

2. COORDINATOR breaks down:
   - UX: Define graph placement and behavior
   - DESIGN: Create visual style for graph
   - CODE: Implement graph component
   - AUDIT: Review code quality
   - TEST: Validate functionality
   - EVALUATOR: Assess user experience quality

3. COORDINATOR dispatches to UX AGENT first (dependency: design needs UX spec)

4. UX AGENT produces:
   - Wireframe showing graph on LEFT side
   - Mobile behavior (collapsed under chat, expandable)
   - Interaction: updates in real-time as user answers

5. COORDINATOR validates UX output, dispatches to DESIGN AGENT

6. DESIGN AGENT produces:
   - CSS for animated gauge
   - Color gradient (red→yellow→green for risk)
   - Animation keyframes for smooth transitions

7. COORDINATOR validates DESIGN output, dispatches to CODE AGENT

8. CODE AGENT implements:
   - ProfileGraph.js component
   - Integration with BubbleAgentMemory
   - Real-time update hooks

9. COORDINATOR dispatches to AUDIT + TEST (parallel)

10. AUDIT AGENT reviews:
    - Code quality: ✓
    - Security: ✓
    - Performance: "Consider requestAnimationFrame for updates"

11. TEST AGENT validates:
    - Graph updates on profile change: ✓
    - Mobile layout correct: ✓
    - Animation smooth: ✓

12. COORDINATOR dispatches to EVALUATOR AGENT (final gate)

13. EVALUATOR AGENT assesses:
    - Simplicity: 4/5 "User understands graph purpose immediately"
    - Naturalness: 5/5 "Animation feels organic"
    - Delight: 3/5 ⚠️ "Graph update lacks 'wow' factor"

    VERDICT: "Iterate - add subtle particle effect on score change"

14. COORDINATOR re-dispatches to DESIGN + CODE for iteration

15. After iteration, EVALUATOR re-assesses:
    - Delight: 4/5 ✓ "Particle effect adds satisfying feedback"

    VERDICT: "Ship it"

16. COORDINATOR marks task complete, proceeds to next
```

---

### Agent Communication Format

Each agent communicates via structured reports:

```markdown
## [AGENT_NAME] Report - [TASK_ID]

### Status: [PENDING | IN_PROGRESS | BLOCKED | COMPLETE]

### Summary
[2-3 sentences describing work done]

### Artifacts
- [List of files/specs produced]

### Issues Found
- [Any blockers or concerns]

### Recommendations
- [Suggestions for improvement]

### Ready for Next Agent: [YES | NO]
If NO, explain what's blocking
```

---

### Implementation Order (Agent-Driven)

```
PHASE 1: FOUNDATION
├─ CODE AGENT: Create BubbleAgentMemory.js
├─ AUDIT AGENT: Review memory module security
├─ TEST AGENT: Unit tests for memory operations
├─ EVALUATOR: Assess API usability (Robustness ≥4/5)
└─ COORDINATOR: Approve Phase 1

PHASE 2: CONVERSATIONAL ONBOARDING
├─ UX AGENT: Onboarding flow wireframes
├─ DESIGN AGENT: Chat bubble styles, typing indicators
├─ CODE AGENT: Modify playground-fullscreen-chat.js
├─ CODE AGENT: Update chat.controller.js (profile extraction)
├─ AUDIT AGENT: Review LLM prompt injection risks
├─ TEST AGENT: Full onboarding journey tests
├─ EVALUATOR: Assess conversation feel (Naturalness ≥4/5)
└─ COORDINATOR: Approve Phase 2

PHASE 3: PROFILE VISUALIZATION
├─ UX AGENT: Graph placement and behavior spec
├─ DESIGN AGENT: Graph visual design, animations
├─ CODE AGENT: Implement ProfileGraph component
├─ TEST AGENT: Real-time update tests
├─ EVALUATOR: Assess intuitiveness (Simplicity ≥4/5)
└─ COORDINATOR: Approve Phase 3

PHASE 4: POST-ONBOARDING EXPERIENCE
├─ UX AGENT: Guided tour flow design
├─ DESIGN AGENT: Spotlight overlay styling
├─ CODE AGENT: Auto-open chat, pre-apply allocation
├─ CODE AGENT: Guided tour overlay system
├─ TEST AGENT: Full journey tests (onboarding → simulator)
├─ EVALUATOR: Assess magic moment (Delight ≥4/5)
└─ COORDINATOR: Approve Phase 4

PHASE 5: ARENA INTEGRATION
├─ UX AGENT: Bot highlight behavior
├─ DESIGN AGENT: Highlight glow effect
├─ CODE AGENT: Modify arena.js for profile awareness
├─ TEST AGENT: Profile-to-bot matching tests
├─ EVALUATOR: Assess personalization feel (Continuity ≥4/5)
└─ COORDINATOR: Approve Phase 5

PHASE 6: POLISH & OPTIMIZATION
├─ AUDIT AGENT: Full security review
├─ TEST AGENT: Cross-browser, mobile, edge cases
├─ UX AGENT: Final UX review and tweaks
├─ DESIGN AGENT: Animation polish
├─ EVALUATOR: Final quality scorecard (ALL dimensions ≥4/5)
└─ COORDINATOR: Final approval → DEPLOY
```

### Iteration Gate (Per Phase)

```
┌─────────────────────────────────────────────────────────────────┐
│                     PHASE COMPLETION GATE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. TEST AGENT: All tests pass?                                 │
│     └─ NO → Back to CODE AGENT                                  │
│     └─ YES → Continue                                           │
│                                                                  │
│  2. AUDIT AGENT: Security/quality OK?                           │
│     └─ NO → Back to CODE AGENT with specific fixes              │
│     └─ YES → Continue                                           │
│                                                                  │
│  3. EVALUATOR: Quality score ≥4/5 on critical dimensions?       │
│     └─ NO → Back to relevant agent (UX/DESIGN/CODE)             │
│     └─ YES → COORDINATOR approves phase                         │
│                                                                  │
│  4. USER (you): Happy with the result?                          │
│     └─ NO → Feedback incorporated, iterate                      │
│     └─ YES → Proceed to next phase                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Approval Checklist

### Product Architecture
- [ ] Phase 1: BubbleAgentMemory architecture approved
- [ ] Phase 2: Conversational onboarding flow approved
- [ ] Phase 3: Profile visualization (graph) approved
- [ ] Phase 4: Post-onboarding experience approved
- [ ] Phase 5: Arena integration approved
- [ ] Phase 6: Polish & optimization approved

### Implementation Agents (7 Total)
- [ ] COORDINATOR AGENT role and authority approved
- [ ] UX AGENT responsibilities and constraints approved
- [ ] DESIGN AGENT scope and design system approved
- [ ] CODE AGENT file ownership approved
- [ ] AUDIT AGENT security checklist approved
- [ ] TEST AGENT test scenarios approved
- [ ] EVALUATOR AGENT quality criteria approved ← NEW (per Anthropic guidance)

### Execution
- [ ] Anthropic feedback loop understood (gather → act → verify → evaluate → iterate)
- [ ] Agent interaction protocol approved
- [ ] Iteration gate mechanism approved
- [ ] Implementation order (6 phases) approved
- [ ] Ready to begin Phase 1

---

## Next Steps (After Approval)

1. **I (Claude) become COORDINATOR AGENT**
2. Dispatch Phase 1 tasks to specialist sub-agents
3. Report progress after each phase
4. Block on your approval between major phases

---

*Document ready for review. Please provide feedback on each section.*
