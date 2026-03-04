# Bubble Playground Chatbot-First Experience - Design Specification

## Executive Summary

This document specifies a comprehensive redesign of the Bubble Playground experience, transforming it into a **chatbot-first** educational platform. The primary interface will be a full-screen conversational AI overlay (similar to ChatGPT/Perplexity), with the current education pages becoming secondary exploration content.

**Key Transformation:**
- **Current State:** `/investors/education` with personality assessment chatbot + Arena + Simulator as separate pages
- **New State:** `/investors/playground` with full-screen LLM-powered chatbot as primary interface, seamless transitions to Arena/Simulator with persistent AI coaching

---

## 1. OVERALL PRODUCT CONCEPT

### 1.1 Vision
Replace the current scripted personality assessment chatbot (`playground-chat.js`) with a dynamic LLM-powered conversational experience that serves as the primary entry point for all educational content.

### 1.2 Current State Analysis

**Existing Components:**
- `/investors/education` (education.html) - Hub page with personality assessment chatbot
- `/investors/education/arena` (arena.html) - 4 bot trading simulation
- `/investors/education/simulator` (simulator.html) - Strategy builder with sliders
- `playground-chat.js` - Pre-scripted personality assessment (scenario-based, not LLM)
- `chat-side-panel.js` - LLM-powered floating chat panel (uses OpenRouter)
- `chat.controller.js` - Backend with unified system prompt for education contexts

**Current LLM Integration:**
- Backend uses OpenRouter with model fallback: Gemini 2.0 Flash → GPT-4.1-mini → Magistral → DeepSeek R1
- System prompt already has education context awareness for arena/simulator
- Session-based conversation persistence via sessionStorage

### 1.3 Proposed Architecture

```
                    +-----------------------+
                    |   FIRST ARRIVAL       |
                    |   Full-Screen         |
                    |   Chatbot Overlay     |
                    +-----------+-----------+
                                |
          +---------------------+---------------------+
          |                     |                     |
+---------v---------+ +---------v---------+ +---------v---------+
|   ARENA           | |   SIMULATOR       | |   SECONDARY       |
|   (with AI        | |   (with AI        | |   PLAYGROUND      |
|    Side Panel)    | |    Side Panel)    | |   PAGE            |
+-------------------+ +-------------------+ +-------------------+
```

---

## 2. CHATBOT UX AND BEHAVIOR

### 2.1 Full-Screen Chatbot Overlay

**Entry Point:** When user arrives at `/investors/playground`, display full-screen chatbot overlay.

**Visual Specifications (per Charte Graphique):**
- **Background:** `#FFFFFF` (white, privileged per brand guidelines)
- **Chat container:** Glassmorphism effect (`rgba(255, 255, 255, 0.7)`, `backdrop-filter: blur(10px)`)
- **Border radius:** 24px for main container
- **Input field:** 50px pill-shaped border-radius
- **Submit button:** Circular 40px, gray gradient per brand
- **Primary accent:** `#667eea` (Bubble violet)

**Layout (Desktop):**
```
+------------------------------------------------------------------+
|  [Header: Bubble. + minimal nav]                                   |
+------------------------------------------------------------------+
|                                                                    |
|   +----------------------------------------------------------+   |
|   |                    CHAT CONTAINER                        |   |
|   |  +----------------------------------------------------+  |   |
|   |  |  [Bubble Avatar]                                   |  |   |
|   |  |  "Bienvenue dans le Bubble Playground!"            |  |   |
|   |  |  "Je suis la pour t'aider a decouvrir..."          |  |   |
|   |  +----------------------------------------------------+  |   |
|   |                                                          |   |
|   |  [ONBOARDING CHIPS]                                     |   |
|   |  [ Debutant ] [ Intermediaire ] [ Avance ]              |   |
|   |                                                          |   |
|   |  +----------------------------------------------------+  |   |
|   |  | [Input: Pose ta question...]              [Send] |  |   |
|   |  +----------------------------------------------------+  |   |
|   +----------------------------------------------------------+   |
|                                                                    |
|   [ACTION BUTTONS - sticky bottom]                                 |
|   [ Rejoindre Bubble ] [ Arena ] [ Simulateur ] [ Quitter ]       |
+------------------------------------------------------------------+
```

**Layout (Mobile):**
- Chat occupies 85-90% of viewport
- Persistent action buttons as horizontal scroll at bottom
- Input field fixed at bottom with iOS keyboard-safe 16px font

### 2.2 Onboarding Flow

**Stage 1: Welcome (Pre-filled options)**
```
Bot: "Bienvenue dans le Bubble Playground! Je suis la pour t'aider
      a decouvrir l'investissement de facon simple et interactive."

Bot: "Pour commencer, dis-moi ou tu en es:"

[Chip: Debutant - Je decouvre]
[Chip: Intermediaire - Je connais les bases]
[Chip: Avance - Je maitrise deja]
```

**Stage 2: Goal Discovery (Pre-filled options)**
```
Bot: "Super! Et qu'est-ce qui t'interesse le plus aujourd'hui?"

[Chip: Apprendre les bases]
[Chip: Construire une strategie]
[Chip: Observer des bots trader]
[Chip: Tester un portefeuille]
```

**Stage 3: Learning Style (Pre-filled options)**
```
Bot: "Comment preferes-tu apprendre?"

[Chip: Videos et explications visuelles]
[Chip: Exercices pratiques]
[Chip: Dialogue et questions-reponses]
[Chip: Explorer par moi-meme]
```

**Stage 4: Transition to Free-Form**
```
Bot: "Parfait! Je comprends que tu es [level] et que tu veux [goal].

      Tu peux maintenant me poser n'importe quelle question,
      ou utiliser les boutons ci-dessous pour explorer.

      Quelques idees:
      - Explique-moi ce qu'est un ETF
      - Montre-moi comment fonctionne l'Arena
      - Aide-moi a creer ma premiere strategie"

[Voice button: Dicte ta question]
[Keyboard input: Tape ta question...]
```

### 2.3 LLM Integration

**Backend Modifications to chat.controller.js:**

```javascript
// Enhanced education system prompt
const playgroundSystemPrompt = (language, userProfile, pageContext) => `
You are Bubble's Playground Assistant - a friendly, motivating guide
to financial education. You adapt your vocabulary and depth based on
the user's profile.

### USER PROFILE
- Knowledge Level: ${userProfile.level || 'unknown'}
- Primary Goal: ${userProfile.goal || 'exploring'}
- Learning Style: ${userProfile.learningStyle || 'mixed'}
- Previous Interactions: ${userProfile.interactionCount || 0}

### PERSONALITY
- Friendly and encouraging - never academic or boring
- Use metaphors and real-life examples
- Celebrate small wins and discoveries
- Ask clarifying questions rather than assuming
- Suggest next steps proactively

### CONTEXT AWARENESS
- Current Page: ${pageContext}
- If in Arena: Reference visible bots, trades, timeline
- If in Simulator: Reference current allocation, metrics
- Maintain conversation continuity across page transitions

### RESOURCE RECOMMENDATIONS
When relevant, suggest from our curated resources:
- YouTube videos (ETF basics, risk parity, diversification)
- Arena challenges (watch a crash, compare bots)
- Simulator exercises (build 60/40, add gold)

### RESPONSE STYLE
- 2-4 sentences typically, expand when explaining concepts
- Use emojis sparingly for warmth
- Include actionable next step when appropriate
- Always offer to go deeper or move to next topic

### LANGUAGE
Respond ONLY in ${language.toUpperCase()}.
`;
```

**Hybrid Approach:**
- First 3 questions use pre-filled chips (quicker, consistent data collection)
- After onboarding, transition to full LLM responses
- User can always type their own question at any stage

### 2.4 Persistent Action Buttons

**Desktop (sticky bottom of chat container):**
```
+------------------------------------------------------------------+
| [Subscribe to Bubble] [Exit to Playground] [Go to Arena] [Go to Simulator] |
+------------------------------------------------------------------+
```

**Mobile (horizontal scroll):**
```
| [Bubble] | [Explorer] | [Arena] | [Simulateur] | [Videos] |  ->
```

**Button Specifications:**
- Primary CTA (Subscribe): Gradient button per brand (`linear-gradient(135deg, #333333, #444444)`)
- Secondary CTAs: Outline pills with violet border (`#667eea`)
- Touch target: 44px minimum height

---

## 3. PERSONALIZATION LOGIC

### 3.1 User State Storage

**sessionStorage Schema:**
```javascript
{
  "bubblePlaygroundSession": {
    "started": 1704456000000,
    "language": "fr",
    "profile": {
      "level": "beginner", // beginner | intermediate | advanced
      "goal": "learn_basics", // learn_basics | build_strategy | watch_arena | test_portfolio
      "learningStyle": "exercises", // videos | exercises | dialogue | explore
      "riskTolerance": 50, // 0-100 from personality assessment (optional)
    },
    "progress": {
      "onboardingComplete": true,
      "arenaVisited": false,
      "simulatorVisited": true,
      "videosWatched": ["etf-basics"],
      "challengesCompleted": ["watch-first-trade"]
    },
    "conversationHistory": [
      { "role": "assistant", "content": "Bienvenue...", "timestamp": 1704456000000 },
      { "role": "user", "content": "Qu'est-ce qu'un ETF?", "timestamp": 1704456100000 }
    ],
    "lastModule": "simulator" // hub | arena | simulator
  }
}
```

### 3.2 Adaptive Vocabulary

**Beginner Level:**
```
"Un ETF, c'est comme un panier d'actions. Imagine que tu achetes
un petit morceau de toutes les entreprises du CAC 40 d'un coup!"
```

**Intermediate Level:**
```
"Un ETF replique un indice (comme le S&P 500) avec des frais
tres faibles. C'est la base de l'investissement passif."
```

**Advanced Level:**
```
"Les ETF offrent une tracking difference minimale vs l'indice,
avec des TER de 0.03-0.20%. Pour le risk parity, on utilise
SPY, IEF, et GLD comme building blocks."
```

### 3.3 Personalized Resource Medley

**After onboarding, suggest personalized next steps:**

```javascript
const generateMedley = (profile) => {
  const suggestions = [];

  if (profile.level === 'beginner') {
    suggestions.push({
      type: 'video',
      id: 'etf-basics',
      reason: 'Parfait pour commencer - une explication simple des ETF'
    });
    suggestions.push({
      type: 'arena_challenge',
      id: 'watch-first-crash',
      reason: 'Voir comment reagissent les bots pendant une crise'
    });
  }

  if (profile.goal === 'build_strategy') {
    suggestions.push({
      type: 'simulator_exercise',
      id: 'create-60-40',
      reason: 'Le classique 60/40 actions/obligations - parfait debut'
    });
  }

  return suggestions;
};
```

---

## 4. RESOURCE INTEGRATION

### 4.1 Redefine "Videos References" as "Deepen Your Knowledge"

**Current State:** 4 curated YouTube videos in education.html

**New Architecture:**
```javascript
const educationalResources = {
  videos: [
    {
      id: 'etf-basics',
      title: { fr: "C'est quoi un ETF?", en: "What is an ETF?" },
      url: 'https://www.youtube.com/watch?v=OwpFBi_jUVw',
      channel: 'Finary',
      duration: '8:42',
      level: 'beginner',
      tags: ['etf', 'basics', 'passive-investing']
    },
    // ... more videos
  ],
  articles: [
    {
      id: 'risk-parity-explained',
      title: { fr: 'La parite de risque expliquee', en: 'Risk Parity Explained' },
      source: 'Bubble Blog',
      url: '/blog/risk-parity',
      readTime: 5,
      level: 'intermediate'
    }
  ],
  notion: [
    {
      id: 'quiz-beginner-etf',
      title: { fr: '02 - Investir dans les ETF Actions', en: '02 - Investing in Stock ETFs' },
      type: 'quiz',
      level: 'beginner'
    }
  ]
};
```

### 4.2 Dynamic Resource Recommendations

**Chatbot Integration:**
```
User: "Je ne comprends pas la risk parity"

Bot: "La risk parity, c'est une facon d'equilibrer ton portefeuille
      par le risque plutot que par les montants.

      Pour approfondir, je te recommande:

      [Video] Comprendre la Risk Parity (Ben Felix, 12 min)
      - Explique pourquoi equilibrer le risque, pas les montants

      [Arena] Voir Renard (Risk Parity) vs Ours (Equal Weight)
      - Compare leurs performances pendant les crises

      Lequel tu veux explorer?"
```

---

## 5. ARENA AND SIMULATOR INTEGRATION

### 5.1 Chat Persistence Across Modules

**Side Panel Configuration:**
- **Desktop:** Collapsible side panel (400px width)
- **Mobile:** Floating bubble that expands to bottom sheet
- **State:** Shared sessionStorage conversation history

**Context-Aware System Prompt Enhancement:**
```javascript
// When in Arena
`CURRENT ARENA STATE:
- Timeline Position: ${currentFrame} (${formatDate(currentDate)})
- Active Event: ${activeEvent?.name || 'Normal trading'}
- Bot Rankings: ${formatLeaderboard(rankings)}
- Recent Trade: ${lastTrade?.bot} ${lastTrade?.action} ${lastTrade?.asset}

Use this context to answer questions about what's happening.
Example: "Pourquoi Renard a vendu?" -> Reference the specific trade and explain.`

// When in Simulator
`CURRENT SIMULATOR STATE:
- Allocation: ${formatAllocation(currentMix)}
- Period: ${period}Y, Leverage: ${leverage}x
- Performance Metrics: ${formatMetrics(metrics)}
- Comparison: ${activeBaselines.join(', ')}

Use this context to suggest adjustments or explain results.
Example: "Trop volatile" -> Suggest reducing SPY, adding bonds.`
```

### 5.2 Proactive Assistance

**Arena Triggers:**
```javascript
const arenaProactiveMessages = {
  'first_play': {
    trigger: 'playButton clicked && !progress.arenaVisited',
    message: 'Regarde bien les bulles de dialogue de chaque bot - ils expliquent leurs decisions!'
  },
  'crisis_event': {
    trigger: 'timeline reaches crisis marker',
    message: 'On arrive au crash de 2008! Observe comment chaque bot reagit differemment.'
  },
  'leaderboard_change': {
    trigger: 'rankings change',
    message: 'Renard vient de passer en tete! Sa strategie risk parity brille pendant les crises.'
  }
};
```

**Simulator Triggers:**
```javascript
const simulatorProactiveMessages = {
  'high_volatility': {
    trigger: 'metrics.volatility > 20',
    message: 'Attention, ton portefeuille est assez volatile! Veux-tu ajouter des obligations pour lisser?'
  },
  'no_diversification': {
    trigger: 'allocation.SPY === 100',
    message: 'Tout en actions? C\'est risque! Veux-tu voir l\'effet d\'ajouter 20% d\'obligations?'
  },
  'first_backtest': {
    trigger: 'firstBacktestComplete && !progress.firstStrategyCreated',
    message: 'Bravo, ta premiere strategie! Compare-la a "Pari Optimise" pour voir la difference.'
  }
};
```

---

## 6. NAVIGATION AND URLs

### 6.1 URL Structure

**Current:**
- `/investors/education` (Hub)
- `/investors/education/arena`
- `/investors/education/simulator`
- `/investors/portfolio-simulator` (Legacy - to be decommissioned)

**New:**
- `/investors/playground` (New Hub - Chatbot-first)
- `/investors/playground/arena`
- `/investors/playground/simulator`
- `/en/investors/playground/*` (English mirrors)

### 6.2 Redirects

```javascript
// pages.routes.js additions
app.get('/investors/education*', (req, res) => {
  const newPath = req.path.replace('/education', '/playground');
  res.redirect(301, newPath);
});

app.get('/investors/portfolio-simulator', (req, res) => {
  res.redirect(301, '/investors/playground/simulator');
});

app.get('/portfolio-simulator', (req, res) => {
  res.redirect(301, '/investors/playground/simulator');
});
```

### 6.3 Navigation Updates

**Nav Menu:**
```html
<!-- Current -->
<a href="/investors/education" data-translate="nav.solution.education">Playground</a>

<!-- New - no change needed, just update URL -->
<a href="/investors/playground" data-translate="nav.solution.education">Playground</a>
```

**Footer:**
```html
<li><a href="/investors/playground" data-translate="footer.nav.resources.education">Playground</a></li>
```

---

## 7. VISUAL GUIDELINES

### 7.1 Full-Screen Chatbot Overlay

**Desktop (>1024px):**
```
+------------------------------------------------------------------+
| [Logo] Bubble.                               [EN|FR]   [X Close] |
+------------------------------------------------------------------+
|                                                                    |
|          +----------------------------------------------+         |
|          |                                              |         |
|          |  CHAT MESSAGES AREA                          |         |
|          |  (scroll container, max-width: 700px)        |         |
|          |                                              |         |
|          |  [Bot message with avatar]                   |         |
|          |                    [User message - right]    |         |
|          |  [Bot message]                               |         |
|          |                                              |         |
|          |  [CHIPS: Quick suggestions]                  |         |
|          |                                              |         |
|          +----------------------------------------------+         |
|                                                                    |
|          +----------------------------------------------+         |
|          | [Input field - pill shape]         [Send] |         |
|          +----------------------------------------------+         |
|                                                                    |
|          [Subscribe] [Arena] [Simulator] [Videos]                  |
+------------------------------------------------------------------+
```

**CSS Specifications:**
```css
.playground-overlay {
  position: fixed;
  inset: 0;
  background: #FFFFFF;
  z-index: 9999;
  display: flex;
  flex-direction: column;
}

.playground-chat-wrapper {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 2rem;
  overflow: hidden;
}

.playground-chat-container {
  width: 100%;
  max-width: 700px;
  display: flex;
  flex-direction: column;
  background: rgba(248, 248, 248, 0.6);
  border-radius: 24px;
  border: 1px solid #EEEEEE;
}

.playground-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.playground-message.bot {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.playground-message.bot .message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #818CF8);
  display: flex;
  align-items: center;
  justify-content: center;
}

.playground-message.user {
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.playground-message.user .message-content {
  background: linear-gradient(135deg, #333333, #444444);
  color: white;
  border-radius: 20px 20px 4px 20px;
  padding: 0.75rem 1rem;
  max-width: 80%;
}

.playground-option-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.playground-option {
  background: rgba(102, 126, 234, 0.08);
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 50px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.playground-option:hover {
  background: rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
}

.playground-input-container {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #EEEEEE;
}

.playground-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50px;
  padding: 0.75rem 1.25rem;
  font-size: 1rem; /* 16px for iOS */
}

.playground-send-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(107, 114, 128, 0.9), rgba(107, 114, 128, 0.7));
  border: none;
  color: white;
  cursor: pointer;
}
```

### 7.2 Secondary Playground Page

**Layout (visible when exiting chatbot):**
```
+------------------------------------------------------------------+
| [Header]                                                           |
+------------------------------------------------------------------+
| HERO: "L'IA est ton alliee, pas ton ennemi"                       |
|       [Button: Parler a l'assistant]                               |
+------------------------------------------------------------------+
|                                                                    |
|  +---------------------------+  +---------------------------+     |
|  | ARENA CARD                |  | SIMULATOR CARD            |     |
|  | [Icon]                    |  | [Icon]                    |     |
|  | Observer les bots trader  |  | Construire ta strategie   |     |
|  | [Enter Arena]             |  | [Create Strategy]         |     |
|  +---------------------------+  +---------------------------+     |
|                                                                    |
+------------------------------------------------------------------+
|  YOUR PROGRESS                                                     |
|  [Badge: First Trade Watched] [Badge: Strategy Created]           |
+------------------------------------------------------------------+
|  DEEPEN YOUR KNOWLEDGE                                             |
|  [Video Card] [Video Card] [Article Card] [Video Card]            |
+------------------------------------------------------------------+
```

### 7.3 Arena/Simulator with Embedded Chatbot

**Desktop Layout:**
```
+------------------------------------------------------------------+
|                              ARENA CONTENT                         |
|  +--------------------------------------------+  +--------------+ |
|  |                                            |  | CHAT PANEL   | |
|  |  [Bot Cards]                               |  | (400px)      | |
|  |  [Timeline]                                |  |              | |
|  |  [Chart]                                   |  | [Messages]   | |
|  |                                            |  |              | |
|  |                                            |  | [Input]      | |
|  +--------------------------------------------+  +--------------+ |
+------------------------------------------------------------------+
```

**Mobile Layout:**
```
+------------------------+
|  [Header]              |
+------------------------+
|                        |
|  ARENA CONTENT         |
|  (full width)          |
|                        |
+------------------------+
|  [Floating Chat Bubble]|
|  (bottom right)        |
+------------------------+

[On bubble tap -> Bottom sheet chat]
+------------------------+
|  [Drag handle]         |
|  [Chat messages]       |
|  [Input]               |
+------------------------+
```

---

## 8. TECHNICAL REQUIREMENTS

### 8.1 LLM Provider

**Recommendation:** Continue using OpenRouter with existing model fallback chain:
1. `google/gemini-2.0-flash-001` (primary - fast, cheap, good quality)
2. `openai/gpt-4.1-mini` (fallback)
3. `mistralai/magistral-small-2506` (fallback)
4. `deepseek/deepseek-r1-0528:free` (final fallback)

**Cost Estimate:**
- Gemini Flash: ~$0.075/1M input tokens, ~$0.30/1M output tokens
- Typical conversation: ~500 input + ~200 output tokens = ~$0.0001/message
- At 1000 users x 10 messages each = $1.00/day

### 8.2 Session State Management

**Existing Pattern:** `sessionStorage` for education chat (via `chat-side-panel.js`)

**Enhanced Schema:**
```javascript
// Key: bubblePlaygroundSession
{
  version: 2, // Schema version for migrations
  started: timestamp,
  language: 'fr' | 'en',
  profile: {
    level: 'beginner' | 'intermediate' | 'advanced',
    goal: 'learn_basics' | 'build_strategy' | 'watch_arena' | 'test_portfolio',
    learningStyle: 'videos' | 'exercises' | 'dialogue' | 'explore',
    onboardingComplete: boolean
  },
  progress: {
    arenaVisited: boolean,
    simulatorVisited: boolean,
    videosWatched: string[],
    challengesCompleted: string[]
  },
  conversation: [
    { role: 'assistant' | 'user', content: string, timestamp: number }
  ].slice(-20), // Keep last 20 messages
  lastModule: 'hub' | 'arena' | 'simulator',
  currentContext: { /* dynamic context from current page */ }
}
```

### 8.3 Backend Enhancements

**New API Endpoint:**
```
POST /api/chat/playground
```

**Request Body:**
```json
{
  "message": "Qu'est-ce qu'un ETF?",
  "language": "fr",
  "profile": {
    "level": "beginner",
    "goal": "learn_basics"
  },
  "pageContext": "hub",
  "moduleState": {
    // Arena-specific or Simulator-specific state
  },
  "conversationHistory": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response (SSE stream):**
```
data: {"type": "token", "content": "Un "}
data: {"type": "token", "content": "ETF "}
data: {"type": "suggestion", "items": [{"type": "video", "id": "etf-basics"}]}
data: {"type": "done"}
```

### 8.4 Multilingual Support

**Existing:** Full FR/EN translations in `translations.js`

**New Keys Required:**
```javascript
// Add to translations.js
"playground.overlay.title": {
  fr: "Bubble Playground",
  en: "Bubble Playground"
},
"playground.overlay.welcome": {
  fr: "Bienvenue dans le Bubble Playground!",
  en: "Welcome to the Bubble Playground!"
},
"playground.onboarding.level.question": {
  fr: "Pour commencer, dis-moi ou tu en es:",
  en: "To start, tell me where you are:"
},
"playground.onboarding.level.beginner": {
  fr: "Debutant - Je decouvre",
  en: "Beginner - I'm discovering"
},
"playground.onboarding.level.intermediate": {
  fr: "Intermediaire - Je connais les bases",
  en: "Intermediate - I know the basics"
},
"playground.onboarding.level.advanced": {
  fr: "Avance - Je maitrise deja",
  en: "Advanced - I already know well"
},
// ... continue for all new UI elements
```

---

## 9. DETAILED UX FLOWS

### 9.1 First Visit to /investors/playground

```
1. User arrives at /investors/playground
   |
2. Check sessionStorage for existing session
   |
   +-- No session found:
   |   |
   |   3. Display full-screen chatbot overlay
   |   |
   |   4. Bot sends welcome message (animated typing)
   |      "Bienvenue dans le Bubble Playground!"
   |      "Je suis la pour t'aider a decouvrir..."
   |   |
   |   5. Display first onboarding chips
   |      [ Debutant ] [ Intermediaire ] [ Avance ]
   |   |
   |   6. User selects or types -> store in session
   |   |
   |   7. Continue onboarding flow (goal, style)
   |   |
   |   8. Onboarding complete -> free-form LLM mode
   |
   +-- Session found:
       |
       3. Load conversation history
       |
       4. Display messages with scroll to bottom
       |
       5. Bot sends contextual welcome-back
          "Content de te revoir! On en etait a..."
       |
       6. User continues conversation
```

### 9.2 Transition: Chatbot to Arena

```
1. User in chatbot overlay clicks [Go to Arena] button
   OR Bot suggests "Tu veux voir ca en action dans l'Arena?"
   |
2. Store current conversation state
   |
3. Animate overlay sliding left/fading
   |
4. Navigate to /investors/playground/arena
   |
5. Arena page loads with:
   - Full arena content (bots, chart, timeline)
   - Collapsible side panel chat (desktop)
   - Floating bubble (mobile)
   |
6. Chat loads from session, adds context message:
   "Tu es maintenant dans l'Arena! Clique Play pour demarrer."
   |
7. Chat has arena-specific suggestions:
   [ Explique ce trade ] [ Compare les bots ] [ Saute a une crise ]
```

### 9.3 Transition: Arena to Simulator

```
1. User in Arena side panel says:
   "Je veux creer ma propre strategie"
   |
2. Bot responds:
   "Bonne idee! Je t'emmene au Simulateur."
   [Button: Aller au Simulateur]
   |
3. User clicks button OR bot auto-navigates
   |
4. Navigate to /investors/playground/simulator
   |
5. Simulator loads with:
   - Sliders, chart, metrics
   - Side panel chat with session history
   |
6. Chat adds context:
   "On est dans le Simulateur! Dis-moi ton objectif,
    par exemple: 'Je veux un mix equilibre'"
```

### 9.4 Exit to Secondary Page

```
1. User clicks [Exit and Explore] in chatbot overlay
   |
2. Animate overlay fading out
   |
3. Show secondary playground page with:
   - Hero section with [Talk to Assistant] button
   - Arena/Simulator cards
   - Progress badges
   - Video/resource section
   |
4. Floating chat bubble appears (bottom right)
   |
5. User can re-open full chatbot or navigate to modules
```

---

## 10. COPYWRITING PROPOSAL

### 10.1 Key Labels - English with French Localization

| Key | English | French |
|-----|---------|--------|
| `playground.title` | Bubble Playground | Bubble Playground |
| `playground.hero.headline` | AI is your ally, not your enemy | L'IA est ton alliee, pas ton ennemi |
| `playground.hero.subtitle` | Learn investing through conversation. No jargon, no pressure, just discovery. | Apprends l'investissement par la conversation. Pas de jargon, pas de pression, juste la decouverte. |
| `playground.cta.talk` | Talk to the Assistant | Parler a l'assistant |
| `playground.cta.arena` | Enter the Arena | Entrer dans l'Arena |
| `playground.cta.simulator` | Build My Strategy | Creer ma strategie |
| `playground.cta.subscribe` | Join Bubble | Rejoindre Bubble |
| `playground.cta.exit` | Explore on my own | Explorer par moi-meme |
| | | |
| `playground.chat.welcome` | Welcome to the Bubble Playground! | Bienvenue dans le Bubble Playground! |
| `playground.chat.intro` | I'm here to help you discover investing in a simple, fun way. | Je suis la pour t'aider a decouvrir l'investissement de facon simple et fun. |
| `playground.chat.placeholder` | Ask me anything... | Pose-moi n'importe quelle question... |
| `playground.chat.voice` | Speak your question | Dicte ta question |
| | | |
| `playground.onboarding.level` | Where are you in your investment journey? | Ou en es-tu dans ton parcours d'investissement? |
| `playground.onboarding.beginner` | Beginner - I'm just discovering | Debutant - Je decouvre |
| `playground.onboarding.intermediate` | Intermediate - I know the basics | Intermediaire - Je connais les bases |
| `playground.onboarding.advanced` | Advanced - I already master this | Avance - Je maitrise deja |
| | | |
| `playground.onboarding.goal` | What interests you most today? | Qu'est-ce qui t'interesse le plus aujourd'hui? |
| `playground.onboarding.learn` | Learn the basics | Apprendre les bases |
| `playground.onboarding.build` | Build a strategy | Construire une strategie |
| `playground.onboarding.watch` | Watch AI bots trade | Observer des bots IA trader |
| `playground.onboarding.test` | Test a portfolio | Tester un portefeuille |
| | | |
| `playground.onboarding.style` | How do you prefer to learn? | Comment preferes-tu apprendre? |
| `playground.onboarding.videos` | Videos and visual explanations | Videos et explications visuelles |
| `playground.onboarding.exercises` | Hands-on exercises | Exercices pratiques |
| `playground.onboarding.dialogue` | Q&A dialogue | Dialogue et questions-reponses |
| `playground.onboarding.explore` | Explore on my own | Explorer par moi-meme |
| | | |
| `playground.resources.title` | Deepen Your Knowledge | Approfondis tes Connaissances |
| `playground.resources.subtitle` | Curated videos, articles, and exercises to take you further. | Videos, articles et exercices selectionnes pour aller plus loin. |
| | | |
| `playground.progress.title` | Your Progress | Ton Parcours |
| `playground.progress.empty` | Complete challenges to earn badges! | Complete des defis pour gagner des badges! |
| | | |
| `playground.arena.sidepanel.title` | Arena Assistant | Assistant Arena |
| `playground.arena.sidepanel.hint` | Ask me about what's happening | Demande-moi ce qu'il se passe |
| | | |
| `playground.simulator.sidepanel.title` | Strategy Coach | Coach Strategie |
| `playground.simulator.sidepanel.hint` | Describe your goals, I'll suggest a mix | Decris tes objectifs, je suggere un mix |

### 10.2 Chatbot Personality Samples

**Welcome (Beginner):**
```
EN: "Hey there! I'm your guide to the world of investing. No scary
    jargon here - just plain explanations and lots of practice.
    Ready to start? Tell me what interests you most!"

FR: "Salut! Je suis ton guide dans le monde de l'investissement.
    Pas de jargon effrayant ici - juste des explications simples
    et beaucoup de pratique. Pret a commencer? Dis-moi ce qui
    t'interesse le plus!"
```

**Explaining a Concept (ETF):**
```
EN: "An ETF is like a shopping basket of stocks. Instead of buying
    one company, you get a small piece of many companies at once.
    It's cheaper and easier than picking stocks yourself.

    Want to see how ETFs perform in our Arena? The bots use them!"

FR: "Un ETF, c'est comme un panier d'actions. Au lieu d'acheter
    une seule entreprise, tu obtiens un petit morceau de plein
    d'entreprises d'un coup. C'est moins cher et plus simple que
    de choisir des actions toi-meme.

    Tu veux voir comment les ETF performent dans notre Arena?
    Les bots les utilisent!"
```

**Proactive in Arena:**
```
EN: "Look at that! The market just dropped 30%, but Hedgehog
    (Defensive) is barely down. That's the power of bonds and gold
    in a crisis. Meanwhile, Hawk (Momentum) took a hit - it was
    all-in on stocks. Want me to explain why?"

FR: "Regarde ca! Le marche vient de chuter de 30%, mais Herisson
    (Defensif) a a peine baisse. C'est la force des obligations et
    de l'or en crise. Pendant ce temps, Faucon (Momentum) a souffert
    - il etait 100% actions. Tu veux que je t'explique pourquoi?"
```

**Coaching in Simulator:**
```
EN: "Your mix looks good! 50% stocks, 30% bonds, 20% gold gives you
    nice balance. But I notice it's a bit defensive - want to add
    some momentum for potentially higher returns? Or are you happy
    with steady and calm?"

FR: "Ton mix a l'air bien! 50% actions, 30% obligations, 20% or
    te donne un bon equilibre. Mais je remarque que c'est assez
    defensif - tu veux ajouter du momentum pour potentiellement
    plus de rendement? Ou tu preferes rester calme et stable?"
```

---

## 11. IMPLEMENTATION PRIORITIES

### Phase 1: Core Chatbot Overlay
1. Create `/investors/playground` route and page
2. Build full-screen chatbot overlay component
3. Implement onboarding flow with pre-filled chips
4. Connect to existing chat API with enhanced prompt
5. Add session state management

### Phase 2: Integration with Existing Modules
1. Modify Arena page to include chat side panel
2. Modify Simulator page to include chat side panel
3. Implement shared session state across pages
4. Add context-aware prompts per module
5. Wire proactive message triggers

### Phase 3: Resource System
1. Build resource recommendation engine
2. Add video/article cards to secondary page
3. Implement progress tracking and badges
4. Create personalized medley suggestions

### Phase 4: Polish and Launch
1. Update all navigation links
2. Set up redirects from old URLs
3. Add analytics events
4. Testing across devices and languages
5. Soft launch with noindex, gather feedback

---

## 12. CRITICAL FILES FOR IMPLEMENTATION

1. **`/src/frontend/js/playground-chat.js`** - Must be completely rewritten to use LLM instead of scripted scenarios; becomes the core chatbot overlay logic

2. **`/src/backend/controllers/chat.controller.js`** - Needs enhanced system prompt for playground context, new endpoint for profile-aware responses

3. **`/src/frontend/pages/investors/education.html`** - Rename to playground.html, restructure for chatbot-first with overlay pattern

4. **`/src/frontend/js/chat-side-panel.js`** - Already implements LLM chat; reuse patterns for arena/simulator integration, extend session management

5. **`/src/frontend/i18n/translations.js`** - Add all new playground copywriting keys (approximately 50+ new translation pairs)

---

**Note:** This specification is READ-ONLY. Implementation requires creating and modifying the files listed above according to this plan. The user should review and approve before any development begins.
