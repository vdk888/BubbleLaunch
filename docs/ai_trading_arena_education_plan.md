# AI Trading Arena & Strategy Simulator — Education Module Plan

**Audience**: Engineering/design team
**Goal**: Launch two educational experiences with smart animations, chatbot-first interfaces, and professional futuristic design inspired by [Nof1.ai](https://nof1.ai) and [Obside](https://obside.com).

---

## Executive Summary

Two **separate but connected** educational experiences, both driven by **natural language chatbots**:

| Module | Purpose | Interface | Data |
|--------|---------|-----------|------|
| **AI Trading Arena** | Learn *how trading works* | Watch bots compete on historical data, gamified tutorials | 20-year historical replay |
| **Strategy Simulator** | Learn *strategies + build your own* | Plain language → strategy builder | Same 20-year backtest data |

**Core Principles**:
- Mobile-first (all designs start mobile, scale to desktop)
- Chatbot-first (natural language for beginners to experts)
- Instant feedback (no lag, like current simulator)
- Gamified but professional (futuristic animations, achievement system)
- Pedagogical (every element teaches something)

**Current Build (Dec 5, 2025)**
- FR/EN `/investors/education`, `/education/arena`, `/education/simulator` live with mobile-first layouts, tutorials, compliance ribbons, CTA blocks, floating chat input + side panel, and shared sessionStorage chat/tutorial state across the three pages.
- Arena timeline API (`/api/arena/*`) built from the 20Y portfolio cache (2005-11 → 2025-11), rendered via Chart.js with playback, scrubbing, event markers/vignettes, leaderboard, trade tape, and typed bot dialogues (per persona + event).
- Strategy Simulator wired to `/api/portfolio/custom-allocation` (20Y backtest) with natural-language allocation parsing, quick chips, sliders, Chart.js metrics view, and heuristic suggestions via `strategyBuilderService`; simulator chat sends mix/backtest metadata.
- Chat controller now routes education contexts (hub/arena/simulator) with page-aware system prompt; routes + hreflang for education pages are mounted in `pages.routes.js` with SEO meta in place.

**Known Gaps**
- Compliance gate modal not yet implemented; achievements/progress/prediction modes still placeholders; education analytics events not wired.
- Trade tape, action vignettes, and dialogue copy are synthetic (not derived from real allocation deltas); simulator lacks benchmark overlay; monthly P&L deltas use total-return diffs (approximate).

---

## IMPORTANT: Deployment & Approval Process

> **Nothing will be committed or pushed without explicit owner approval.**

**Migration Plan**:
1. **Phase 1**: Build mock pages at `/education`, `/education/arena`, `/education/simulator`
2. **Phase 2**: Owner reviews and validates mock pages
3. **Phase 3**: Once approved, the new education experience will **replace** the current `/investors/portfolio-simulator` page
4. **Phase 4**: Old simulator page redirects to new education hub

**Current Page to Replace**:
- `https://bubbleinvest.org/investors/portfolio-simulator` → will become part of `/education/simulator`

**Git Workflow**:
- All development on feature branch (not main)
- No commits without owner review
- No pushes without explicit approval
- PR required for any merge to main

**Progress Log (Dec 2025)**:
- Education pages (FR/EN hub, arena, simulator) now tagged `noindex, nofollow` via meta and `X-Robots-Tag` headers so they stay reachable by URL but out of search until we replace `/investors/portfolio-simulator`; no other site pages touched.

---

## 1. The Two Modules

### 1.1 AI Trading Arena — "Watch & Learn"

**Concept**: Users observe 3-4 AI "traders" (personas, not LLM names) compete using different strategies on historical market data. Each trader explains their decisions in real-time via dialogue bubbles.

**What Users Learn**:
- What is a trade (buy/sell, position sizing)
- How different strategies react to the same market conditions
- Why timing matters (entry/exit points)
- Risk management in action (stop losses, rebalancing)
- Reading P&L, drawdowns, Sharpe ratios

**Gamification Elements**:
- Leaderboard with live rankings
- "Prediction mode" — guess which bot wins before revealing
- Achievement badges (watched 10 trades, completed tutorial, etc.)
- Time-travel scrubber (jump to market crashes, rallies)

### 1.2 Strategy Simulator — "Build & Backtest"

**Concept**: Users describe what they want in plain language, chatbot guides them to either select existing strategies OR build a custom mix.

**User Journey**:
```
User: "I want something safe that grows slowly"
Bot: "Sounds like you prefer low volatility. Let me show you Defensive Risk Parity..."
      [Shows strategy with backtest]
Bot: "Want to customize it? We can adjust the mix."
User: "Add a bit of momentum for better returns"
Bot: "I'll blend 70% Defensive RP + 30% Momentum. Here's how it looks..."
      [Shows blended backtest instantly]
```

**What Users Learn**:
- Strategy concepts (risk parity, momentum, diversification)
- Trade-offs (return vs volatility)
- How allocation percentages affect outcomes
- Reading backtest charts and metrics

---

## 2. Visual Design System

### 2.1 Design Philosophy

**Respecting Bubble Brand Guidelines (Charte Graphique)**:

> ⚠️ **Critical**: The Charte Graphique specifies **white backgrounds as privileged default** and warns against dark themes unless absolutely necessary. The education module must remain on-brand.

**Design Principles**:
- **White backgrounds** as primary (reflecting transparency)
- **Glassmorphism** with light glass effects (`rgba(255, 255, 255, 0.7)`, blur 10px)
- **Violet #667eea** as the primary accent color for interactive elements
- **Subtle, efficient, futuristic animations** (0.3s-0.6s duration)
- **Inter font family** throughout (400-800 weights)
- Typography-forward with clear hierarchy

**Color Palette (Per Charte Graphique)**:
```css
/* REQUIRED - From Charte Graphique */
--background: #FFFFFF;           /* Primary background - PRIVILEGED */
--foreground: #000000;           /* Logo, main text */
--primary: #333333;              /* Titles, buttons, interactive elements */
--primary-hover: #444444;        /* Hover states */
--cta-hover: #6b7280;            /* CTA button hover only */
--card: #F8F8F8;                 /* Card backgrounds, alternating sections */
--border: #EEEEEE;               /* Borders, separators */
--text-secondary: #666666;       /* Secondary text, descriptions */

/* Charts & Visualizations - Violet accent */
--chart-primary: #667eea;        /* Main accent for graphs, highlights */
--chart-bg-light: rgba(102, 126, 234, 0.08);   /* Light backgrounds */
--chart-border: rgba(102, 126, 234, 0.2);      /* Borders */
--chart-hover: rgba(102, 126, 234, 0.12);      /* Hover states */
--chart-active: rgba(102, 126, 234, 0.3);      /* Active indicators */

/* Arena-specific (semantic colors only) */
--arena-gain: #10B981;           /* Positive P&L (green) */
--arena-loss: #EF4444;           /* Negative P&L (red) */
--arena-glow: rgba(102, 126, 234, 0.15);  /* Subtle pulse effect */
```

**Key Brand Constraints**:
- ❌ NO dark panels or dark backgrounds
- ❌ NO neon colors (no #00FFAA or similar)
- ✅ White/light gray backgrounds only
- ✅ Violet #667eea for accents and highlights
- ✅ Glassmorphism: `rgba(255, 255, 255, 0.7)` + `blur(10px)`

### 2.2 Bot Personas (4 Characters)

**Why Personas, Not LLM Names**:
- The Arena teaches **strategies**, not AI models
- LLM names (Claude, GPT, Gemini) would mislead users into thinking model = performance
- Personas are memorable, educational, and brand-consistent
- Strategy names help users understand the underlying approach

**Character Names (French-inspired, strategy-meaningful)**:

| Bot Name | Origin | Strategy | Personality | Color | Icon (SVG) |
|----------|--------|----------|-------------|-------|------------|
| **Équi** | "Équilibre" (balance) | Equal Weight | Calm, balanced, simple | #6B7280 | `scale-balanced` |
| **Pari** | "Parité" (parity) | Risk Parity | Thoughtful, analytical | #667eea | `shield-chart` |
| **Momo** | "Momentum" (trading slang) | Momentum | Energetic, trend-following | #F97316 | `trending-up` |
| **Sage** | "Wise/Cautious" (FR/EN) | Defensive RP | Cautious, protective | #10B981 | `shield-check` |

**Icon Style**: Dark SVG line icons only (no emoji). Source: Lucide or Heroicons per Charte Graphique.

### 2.3 Animation Specifications (Per Charte Graphique)

**Charte Graphique Requirements**:
- **Duration**: 0.3s to 0.6s
- **Timing**: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out naturel)
- **Style**: Subtle, efficient, futuristic
- **Respect**: `@media (prefers-reduced-motion: reduce)`
- **Performance**: 60fps on mobile Safari

**a) Trade Entry Animation** (Arena)
```css
@keyframes trade-appear {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}
.trade-entry {
  animation: trade-appear 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
```

**b) P&L Pulse** (when value changes)
```css
@keyframes pnl-flash {
  0% { background: transparent; }
  50% { background: var(--arena-glow); }  /* rgba(102, 126, 234, 0.15) */
  100% { background: transparent; }
}
.pnl-value.updated { animation: pnl-flash 0.4s ease-out; }
```

**c) Bot Dialogue Typing**
```css
@keyframes typing-dots {
  0%, 60%, 100% { opacity: 0.3; }
  30% { opacity: 1; }
}
.typing-indicator span:nth-child(1) { animation-delay: 0s; }
.typing-indicator span:nth-child(2) { animation-delay: 0.15s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.3s; }
```

**d) Chart Line Draw** (Simulator)
```javascript
// Chart.js animation config
animation: {
  duration: 600,
  easing: 'easeOutQuart',
}
```

**e) Card Hover** (Per Charte Graphique)
```css
.arena-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.08);
}
```

**f) Achievement Unlock**
```css
@keyframes achievement-pop {
  0% { transform: scale(0); opacity: 0; }
  70% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}
```

### 2.4 UI Components (Per Charte Graphique)

**Cards & Tiles**:
```css
.arena-card {
  background: var(--card);             /* #F8F8F8 */
  border-radius: 24px;                 /* Standard for all tiles */
  padding: 2rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
```

**CTA Buttons** (Pill shape):
```css
.arena-cta {
  background: linear-gradient(135deg, #333333 0%, #444444 100%);
  color: white;
  padding: 1.1rem 2.5rem;
  border-radius: 50px;                 /* Pill shape */
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.arena-cta:hover {
  background: #6b7280;                 /* Specific hover color */
}
```

**Submit Buttons** (Circular):
```css
.arena-submit {
  background: linear-gradient(135deg, rgba(107, 114, 128, 0.9), rgba(107, 114, 128, 0.7));
  border-radius: 50%;
  width: 40px;
  height: 40px;
  /* Upward arrow icon inside */
}
```

**Glassmorphism Panels**:
```css
.arena-glass-panel {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 24px;
}
```

**Input Fields** (Pill shape):
```css
.arena-input {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50px;                 /* Pill shape */
  padding: 1rem 1.5rem;
  font-size: 16px;                     /* Prevents iOS zoom */
}
.arena-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(51, 51, 51, 0.1);
}
```

### 2.5 Responsive Design (Per Charte Graphique)

**Breakpoints**:
- Petit mobile: < 480px
- Mobile: 481px - 768px
- Tablette: 769px - 1024px
- Desktop: > 1024px

**Touch Targets**: Minimum 44px × 44px on mobile
**Font Size Mobile**: 16px minimum for inputs (prevents iOS zoom)
**Chart Heights**:
- Desktop: 400px
- Tablet: 350px
- Mobile: 280-300px
- Petit mobile: 240-250px

**Hover Effects**: Disabled on touch devices (`@media (hover: none)`)
**Active States**: `transform: scale(0.98)` on touch

---

## 3. Mobile-First Layouts

### 3.1 Education Hub (`/education`)

**Mobile Layout** (primary):
```
┌─────────────────────────────┐
│ [← Back] BUBBLE LEARN       │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │     CHAT INPUT          │ │
│ │ "What do you want to    │ │
│ │  learn today?"          │ │
│ │ [________________________│ │
│ │  Type or tap below...   │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ Quick Start:                │
│ ┌───────────┐ ┌───────────┐ │
│ │ 🎮 Watch  │ │ 🛠️ Build  │ │
│ │   Bots    │ │  Strategy │ │
│ │   Trade   │ │           │ │
│ └───────────┘ └───────────┘ │
├─────────────────────────────┤
│ Your Progress:              │
│ [████░░░░░░] 2/10 lessons   │
│ 🏅 3 achievements           │
└─────────────────────────────┘
```

**Desktop Layout** (1200px+):
```
┌────────────────────────────────────────────────────────────┐
│ BUBBLE LEARN                               [FR|EN] [User]  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │         "What do you want to learn today?"           │ │
│  │  ┌──────────────────────────────────────────────┐    │ │
│  │  │ Type your question... (e.g., "How do bots   │    │ │
│  │  │ make trading decisions?")              [Send]│    │ │
│  │  └──────────────────────────────────────────────┘    │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │   🎮 TRADING ARENA  │  │  🛠️ STRATEGY LAB    │         │
│  │                     │  │                     │         │
│  │ Watch AI bots       │  │ Build your own      │         │
│  │ compete & explain   │  │ strategy from       │         │
│  │ their decisions     │  │ plain language      │         │
│  │                     │  │                     │         │
│  │     [Enter →]       │  │     [Enter →]       │         │
│  └─────────────────────┘  └─────────────────────┘         │
│                                                            │
│  Your Journey: [████████░░░░░░░░░░░░] Level 2             │
│  🏅 Achievements: First Trade Watched · Strategy Builder   │
└────────────────────────────────────────────────────────────┘
```

### 3.2 AI Trading Arena (`/education/arena`)

**Mobile Layout**:
```
┌─────────────────────────────┐
│ [←] ARENA        [?] [⚙️]   │
├─────────────────────────────┤
│ 📊 PERFORMANCE              │
│ ┌─────────────────────────┐ │
│ │   [Chart: 4 lines]      │ │
│ │   Height: 200px         │ │
│ │   Touch: zoom/pan       │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 🏆 LEADERBOARD              │
│ ┌───┬───────────┬─────────┐ │
│ │ 1 │ 🚀 Momo   │ +8.2%  ▲│ │
│ │ 2 │ ⚖️ Équi   │ +5.1%  ▲│ │
│ │ 3 │ 🛡️ Pari   │ +4.8%  ▲│ │
│ │ 4 │ 🏛️ Sage   │ +3.2%  ▲│ │
│ └───┴───────────┴─────────┘ │
├─────────────────────────────┤
│ 💬 MOMO IS THINKING...      │
│ ┌─────────────────────────┐ │
│ │ "SPY showing strong     │ │
│ │ momentum. Increasing    │ │
│ │ position to 45%..."     │ │
│ │                         │ │
│ │ Factors: [Trend ↑]      │ │
│ │          [Volume ↑]     │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 📜 RECENT TRADES            │
│ Momo BUY SPY +5%    2s ago  │
│ Sage SELL GLD -3%   15s ago │
│ Pari REBAL all      32s ago │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ Ask about this trade... │ │
│ └─────────────────────────┘ │
│ ⚠️ Educational only · Paper │
└─────────────────────────────┘
```

### 3.3 Strategy Simulator (`/education/simulator`)

**Mobile Layout**:
```
┌─────────────────────────────┐
│ [←] BUILD STRATEGY    [?]   │
├─────────────────────────────┤
│ 💬 CHAT                     │
│ ┌─────────────────────────┐ │
│ │ Bot: "What kind of      │ │
│ │ investor are you? Tell  │ │
│ │ me in your own words."  │ │
│ │                         │ │
│ │ You: "I want growth but │ │
│ │ I'm scared of big drops"│ │
│ │                         │ │
│ │ Bot: "I understand! You │ │
│ │ want returns but with   │ │
│ │ protection. Let me show │ │
│ │ you Risk Parity..."     │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 📊 YOUR STRATEGY            │
│ ┌─────────────────────────┐ │
│ │   [Backtest Chart]      │ │
│ │   vs benchmark          │ │
│ └─────────────────────────┘ │
│                             │
│ Current Mix:                │
│ [Risk Parity    70%] ──●──  │
│ [Momentum       30%] ──●──  │
│                             │
│ Metrics:                    │
│ Return: +156%  Vol: 12%     │
│ Sharpe: 0.89   DD: -18%     │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ "Make it more defensive"│ │
│ └─────────────────────────┘ │
│ ⚠️ Past performance ≠ future│
└─────────────────────────────┘
```

---

## 4. Chatbot-First Architecture

### 4.1 Conversation Flows

**Arena Chatbot** (contextual Q&A):
```yaml
triggers:
  - "Why did {bot} buy {asset}?"
  - "What does Sharpe ratio mean?"
  - "Which bot is winning?"
  - "Explain this trade"

context:
  - Current leaderboard state
  - Recent trades (last 20)
  - Active bot dialogues
  - User's tutorial progress

responses:
  - Explain bot reasoning (reference dialogue)
  - Define terms with arena examples
  - Compare strategies using live data
  - Suggest tutorials based on questions
```

**Simulator Chatbot** (strategy builder):
```yaml
intents:
  - describe_preference: "I want safe/aggressive/balanced..."
  - modify_strategy: "Add more momentum / less risk..."
  - compare: "How does this compare to {strategy}?"
  - explain: "Why is drawdown important?"
  - create_custom: "Mix Risk Parity with Momentum"

actions:
  - suggest_strategy: Match intent to existing strategies
  - build_custom: Generate blend from description
  - show_backtest: Instantly render chart + metrics
  - explain_metric: Contextual education
```

### 4.2 Natural Language → Strategy Mapping

```javascript
// Intent recognition examples
const STRATEGY_KEYWORDS = {
  safe: ['defensive', 'safe', 'conservative', 'low risk', 'protect'],
  growth: ['growth', 'returns', 'aggressive', 'high returns'],
  balanced: ['balanced', 'moderate', 'middle ground'],
  momentum: ['momentum', 'trends', 'follow market', 'hot stocks'],
  diversified: ['diversified', 'spread out', 'not all eggs'],
};

// Example mapping
"I want growth but not too risky" → {
  primary: 'optimizedRiskParity',  // 60%
  secondary: 'momentum',           // 40%
  explanation: "Optimized Risk Parity gives you diversified growth while Momentum adds trend-following upside."
}
```

### 4.3 Backend Chatbot Integration

Extend existing chat controller with **page context awareness**:

```javascript
// In chat.controller.js, add arena/simulator contexts
const SYSTEM_PROMPTS = {
  arena: `You are Bubble's Arena Guide. The user is watching AI traders compete.
    Current state: {leaderboard}, {recentTrades}, {activeDialogue}.
    Explain trading concepts using what's happening in the arena.
    Keep responses short (2-3 sentences) and educational.`,

  simulator: `You are Bubble's Strategy Builder. Help users create investment strategies.
    Available strategies: {strategyList}.
    Current user mix: {currentMix}, backtest results: {metrics}.
    Guide them to build a strategy matching their goals. Be encouraging.`
};
```

---

## 5. Data Architecture

### 5.1 Historical Data Replay System

**Concept**: Pre-computed 20-year historical data, "replayed" with bot decisions generated based on strategy logic. Fast because all data is cached.

```javascript
// Data structure (per time point)
{
  timestamp: "2020-03-15",
  prices: { SPY: 234.50, IEF: 122.30, GLD: 158.20, ... },
  bots: {
    momo: {
      positions: { SPY: 0.45, IEF: 0.20, GLD: 0.15, CASH: 0.20 },
      pnl_total: 0.082,
      pnl_day: 0.012,
      dialogue: "Momentum still strong. Holding positions.",
      trade: null  // or { action: 'BUY', asset: 'SPY', size: 0.05 }
    },
    // ... other bots
  }
}
```

**Replay Modes**:
1. **Auto-play**: Advance 1 month per second (adjustable speed)
2. **Manual scrub**: User drags timeline to any date
3. **Jump to events**: "Show me March 2020 crash"

### 5.2 API Endpoints

| Endpoint | Method | Purpose | Cache |
|----------|--------|---------|-------|
| `/api/arena/timeline` | GET | Full timeline with all bot states | Heavy (24h) |
| `/api/arena/frame/:date` | GET | Single point in time | Light |
| `/api/arena/dialogue/:bot` | GET | Bot's full dialogue history | Heavy |
| `/api/simulator/strategies` | GET | Available strategies + metadata | Heavy |
| `/api/simulator/backtest` | POST | Compute custom mix backtest | None |
| `/api/simulator/suggest` | POST | NLP → strategy suggestion | None |

### 5.3 Dialogue Generation Strategy

**Hybrid Approach**: Pre-generated for known scenarios, LLM for custom creations.

| Context | Approach | Latency |
|---------|----------|---------|
| Arena (watching bots trade) | 100% pre-generated (960 dialogues) | < 10ms |
| Simulator (existing strategies) | Pre-generated explanations | < 10ms |
| Simulator ("create your own") | LLM on-the-fly via chat endpoint | 300-800ms |

**Implementation Logic**:
```javascript
async function getBotDialogue(context, userSelection, eventDate) {
  // Check if this is a known/pre-built scenario
  if (context === 'arena' || isPreBuiltStrategy(userSelection)) {
    // Use pre-generated dialogue from cache (instant)
    return PREGENERATED_DIALOGUES[userSelection.strategyId]?.[eventDate]
      || PREGENERATED_DIALOGUES.fallback[eventDate];
  }

  // Custom strategy - use existing chat endpoint with simulator context
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      message: `Explain the performance of this custom strategy: ${JSON.stringify(userSelection)}`,
      pageContext: 'simulator',
      contextMetadata: JSON.stringify({
        customMix: userSelection,
        backtestMetrics: getMetricsForMix(userSelection),
        currentDate: eventDate
      })
    })
  });

  return response;
}
```

### 5.4 Pre-computation Strategy

To ensure **instant** (< 100ms) responses for arena and pre-built strategies:

```javascript
// Pre-compute on server startup or cron
const ARENA_TIMELINE = {
  // 240 months × 4 bots = 960 data points
  frames: generateAllFrames(historicalData, strategies),

  // Pre-generated bot dialogues for key moments
  dialogues: generateDialogues(frames, eventDates),

  // Pre-computed for quick "time travel" (12 key events across 20 years)
  keyEvents: [
    // 2008-2010: Financial Crisis
    { date: "2008-09-15", label: "Lehman Brothers Collapse", type: "crash",
      lesson: "How defensive strategies protect during systemic risk" },
    { date: "2009-03-09", label: "Market Bottom", type: "recovery",
      lesson: "The value of staying invested through volatility" },

    // 2011-2015: Recovery & Volatility
    { date: "2011-08-05", label: "US Credit Downgrade", type: "volatility",
      lesson: "Flight to quality - bonds and gold as safe havens" },
    { date: "2015-08-24", label: "China Black Monday", type: "crash",
      lesson: "Global contagion and momentum reversals" },

    // 2016-2019: Political Events
    { date: "2016-11-09", label: "Trump Election", type: "rally",
      lesson: "Unexpected momentum shifts from political events" },
    { date: "2018-12-24", label: "Christmas Eve Crash", type: "correction",
      lesson: "Rebalancing in action during sharp corrections" },

    // 2020: COVID
    { date: "2020-03-23", label: "COVID Bottom", type: "crash",
      lesson: "Worst single-month decline in decades - crisis behavior" },
    { date: "2020-11-09", label: "Vaccine Announcement", type: "rally",
      lesson: "Sector rotation and recovery momentum" },

    // 2022: Inflation & Geopolitics
    { date: "2022-02-24", label: "Russia Invades Ukraine", type: "geopolitical",
      lesson: "Commodity spikes and geopolitical risk hedging" },
    { date: "2022-10-13", label: "Inflation Peak (CPI 9.1%)", type: "bear",
      lesson: "Interest rate impact on all asset classes" },

    // 2023-2024: Recent Events
    { date: "2023-03-10", label: "SVB Bank Collapse", type: "banking",
      lesson: "Contagion risk and sector-specific crises" },
    { date: "2024-10-07", label: "Israel-Hamas Escalation", type: "geopolitical",
      lesson: "Safe haven flows during regional conflicts" },
  ]
};
```

---

## 6. Tutorial & Gamification System

### 6.1 Progressive Learning Path

**Arena Track** (6 lessons):
1. What is a Trade? (watch first trade, tap to learn)
2. Reading the Leaderboard (P&L, rankings)
3. Understanding Bot Thinking (dialogue deep-dive)
4. Market Events (time-travel to crash)
5. Risk vs Return (compare bot styles)
6. Quiz: Predict the Winner

**Simulator Track** (5 lessons):
1. Describe Your Goals (first chat)
2. Understanding Strategies (tour existing ones)
3. Reading a Backtest (chart + metrics)
4. Building a Custom Mix (blend strategies)
5. Challenge: Beat the Benchmark

### 6.2 Achievement System

**Philosophy**: Badges are **optional rewards**, not gates. All content is free. Sharing is encouraged but never required.

**Design Principles**:
- All content accessible without badges
- "Skip" button is equally prominent as "Share" button (same size, same style)
- No "You missed a badge!" guilt messages
- Badge collection visible in corner but not emphasized
- Professional, not gamey

**Badge Unlock Flow**:
```
User completes milestone (e.g., first demo)
              |
              v
┌─────────────────────────────────────────┐
│  You've completed your first demo!      │
│                                         │
│  Unlock the "Explorer" badge            │
│  Share Bubble with a friend             │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Enter email or phone...         │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [Share]           [Skip for now]       │
│  (same size, same style - no guilt)     │
└─────────────────────────────────────────┘
              |
              v
    Continue to next lesson (either way)
```

**Badge Definitions** (all icons are dark SVG line icons):

```javascript
const ACHIEVEMENTS = [
  // Arena badges
  { id: 'explorer', name: 'Explorer', desc: 'Completed your first demo', icon: 'compass',
    unlock: 'share_optional' },
  { id: 'time_traveler', name: 'Time Traveler', desc: 'Visited a market crash', icon: 'clock',
    unlock: 'share_optional' },
  { id: 'analyst', name: 'Analyst', desc: 'Read 10 bot dialogues', icon: 'message-circle',
    unlock: 'automatic' },
  { id: 'predictor', name: 'Oracle', desc: 'Made a prediction', icon: 'target',
    unlock: 'automatic' },

  // Simulator badges
  { id: 'architect', name: 'Architect', desc: 'Built your first strategy', icon: 'layers',
    unlock: 'share_optional' },
  { id: 'mixer', name: 'Mixer', desc: 'Created a custom blend', icon: 'sliders',
    unlock: 'automatic' },
  { id: 'champion', name: 'Champion', desc: 'Beat the S&P 500', icon: 'trophy',
    unlock: 'automatic' },
  { id: 'guardian', name: 'Guardian', desc: 'Created a low-volatility strategy', icon: 'shield',
    unlock: 'automatic' },
];

// unlock types:
// 'automatic' - Badge unlocks immediately upon milestone
// 'share_optional' - Soft prompt to share, but Skip works too
```

### 6.3 Tutorial UX Components

**Tooltip Spotlight**:
```html
<div class="spotlight-overlay">
  <div class="spotlight-hole" style="top: 120px; left: 50px; width: 200px; height: 80px;"></div>
  <div class="spotlight-tooltip">
    <p>This is the <strong>P&L</strong> – it shows how much this bot has gained or lost.</p>
    <button class="spotlight-next">Got it! →</button>
  </div>
</div>
```

**Progress Indicator**:
```html
<div class="lesson-progress">
  <div class="progress-steps">
    <span class="step completed">1</span>
    <span class="step current">2</span>
    <span class="step">3</span>
    <span class="step">4</span>
  </div>
  <p class="progress-label">Lesson 2 of 4: Reading the Leaderboard</p>
</div>
```

---

## 7. Technical Implementation

### 7.1 New Files to Create

**Frontend**:
```
src/frontend/
├── pages/
│   ├── education.html              # Hub page
│   ├── education-arena.html        # Arena page
│   └── education-simulator.html    # Simulator page
├── js/
│   ├── education-hub.js            # Hub orchestration, progress tracking
│   ├── trading-arena.js            # Arena replay engine, animations
│   ├── strategy-builder.js         # Simulator chat, mix builder
│   ├── education-tutorials.js      # Tutorial/spotlight system
│   └── education-achievements.js   # Achievement tracking
└── assets/
    └── styles/
        └── education.css           # All education-specific styles
```

**Backend**:
```
src/backend/
├── routes/
│   └── arena.routes.js             # All /api/arena/* endpoints
├── controllers/
│   └── arena.controller.js         # Arena + simulator handlers
└── services/
    ├── arenaTimelineService.js     # Pre-computed timeline generator
    ├── arenaDialogueService.js     # Bot dialogue generator
    └── strategyBuilderService.js   # NLP → strategy mapping
```

### 7.2 Files to Modify

| File | Changes |
|------|---------|
| `src/frontend/i18n/translations.js` | Add ~200 keys for arena/simulator/tutorials |
| `src/frontend/pages/index.html` | Add education CTA in vision section |
| `src/backend/routes/index.js` | Mount `/api/arena` routes |
| `src/backend/controllers/chat.controller.js` | Add arena/simulator contexts |
| `src/frontend/assets/styles/styles.css` | Import education.css |

### 7.3 State Management

**Session-Only State** (no localStorage - marketing site, not the app)

```javascript
// education-hub.js
// State lives in memory only - resets on page refresh
// This is intentional: marketing site should feel like a fresh demo each time

const EducationState = {
  // Session progress (resets on refresh)
  session: {
    arena: {
      currentFrame: 0,           // Month index (0-239)
      isPlaying: false,
      isPaused: false,           // Auto-pause at key events
      selectedBot: null,
      lessonsViewed: new Set(),
      dialoguesRead: 0,
    },
    simulator: {
      currentMix: [],
      chatHistory: [],
      backtestResult: null,
      lessonsViewed: new Set(),
    },
    badges: {
      unlocked: new Set(),       // Badges earned this session
      sharePromptShown: false,   // Don't show share prompt twice
    },
  },

  // Read language from existing Bubble i18n system
  get language() {
    return window.getCurrentLanguage?.() || 'fr';
  },

  // No persist/load - session only
  reset() {
    this.session = { /* fresh state */ };
  },
};

// On page load: always fresh state
document.addEventListener('DOMContentLoaded', () => {
  EducationState.reset();
});
```

**Why Session-Only**:
- This is a **marketing website**, not the product
- Users should experience the full demo each visit
- No false expectations about "saved progress"
- Soft prompt to join waitlist for "future access to saved strategies"

---

## 8. Compliance & Disclaimers

### 8.1 Persistent Elements

**Sticky Footer Ribbon** (always visible):
```html
<div class="compliance-ribbon">
  <span class="compliance-icon">ℹ️</span>
  <span class="compliance-text" data-translate="education.compliance">
    Educational simulation only · Past performance ≠ future results · Not investment advice
  </span>
</div>
```

**First-Visit Modal**:
```html
<div class="education-gate-modal">
  <h2>Welcome to Bubble Learn</h2>
  <p>This is an <strong>educational simulation</strong> using historical data.</p>
  <ul>
    <li>No real money is involved</li>
    <li>Past performance does not predict future results</li>
    <li>This is not investment advice</li>
  </ul>
  <label>
    <input type="checkbox" required> I understand this is for educational purposes only
  </label>
  <button disabled>Enter Learning Zone</button>
</div>
```

### 8.2 Contextual Disclaimers

- **On every trade**: "Simulated based on historical data"
- **On every backtest**: "Past performance is not indicative of future results"
- **On strategy suggestions**: "This is educational, not financial advice"

### 8.3 Waitlist Integration (CTA)

**Goal**: Convert engaged learners into waitlist signups by surfacing the CTA at high-intent moments.

**CTA Placement**:
1. **After Tutorial Completion**: Modal appears after completing any track
2. **After Achievement Unlock**: Subtle banner below achievement notification
3. **Sticky Footer CTA**: Always visible "Join the Waitlist" button in education pages
4. **Exit Intent**: Modal on page leave after 3+ minutes engagement

**CTA Design** (per Charte Graphique):
```html
<div class="waitlist-cta-card">
  <div class="cta-content">
    <h3>Ready to automate your strategy?</h3>
    <p>Join 2,000+ investors waiting for Bubble Portfolio</p>
  </div>
  <a href="/investors" class="arena-cta">
    Join the Waitlist
    <svg class="icon"><!-- arrow-right --></svg>
  </a>
</div>
```

**Trigger Conditions**:
| Trigger | CTA Type | Copy (FR) | Copy (EN) |
|---------|----------|-----------|-----------|
| Tutorial complete | Modal | "Bravo ! Rejoignez la liste d'attente" | "Well done! Join the waitlist" |
| Achievement unlock | Banner | "Débloquez plus avec Bubble" | "Unlock more with Bubble" |
| 3+ min on page | Sticky | "Prêt à passer au réel ?" | "Ready for the real thing?" |
| Time-travel to 3+ events | Inline | "Ces stratégies vous intéressent ?" | "Interested in these strategies?" |

**Link Destination**: `/investors` (existing waitlist page)

---

## 9. Analytics Events

```javascript
// Key events to track
const EDUCATION_EVENTS = {
  // Hub
  'education_hub_visit': { page: 'hub' },
  'education_module_select': { module: 'arena|simulator' },

  // Arena
  'arena_frame_view': { frame: number, bot: string },
  'arena_time_travel': { targetDate: string, eventType: string },
  'arena_bot_dialogue_read': { bot: string, messageId: string },
  'arena_tutorial_step': { lesson: number, step: number },
  'arena_prediction_made': { predictedBot: string, actualWinner: string },

  // Simulator
  'simulator_chat_message': { intent: string },
  'simulator_strategy_select': { strategy: string },
  'simulator_custom_mix_create': { mix: object },
  'simulator_backtest_run': { mix: object, period: number },
  'simulator_tutorial_step': { lesson: number, step: number },

  // Achievements
  'achievement_unlocked': { achievementId: string },
};
```

## Data Cohesion & UX Improvements (Next)
- **Make trades/data real**: Derive trade tape, action vignettes, and dialogue tone from actual allocation deltas/returns in the arena timeline (not synthetic); compute monthly returns as ratios instead of total-return diffs.
- **Benchmark context**: Add benchmark/bot overlays in simulator charts + delta callouts (e.g., vs SPY and Pari) so users see relative performance, not just absolute metrics.
- **Compliance & analytics**: Add the first-visit compliance gate + sticky ribbon across education pages; instrument GA4 events for play/pause, event jumps, chat sends, slider apply, template clicks, and tutorial completions.
- **Cache + resilience**: Regenerate `arena-timeline.json` whenever portfolio caches refresh; show skeleton/error states when `/api/arena/timeline` is unavailable; add smoke tests for cache presence.
- **Accessibility & motion**: Add focus trapping for overlays, `prefers-reduced-motion` fallbacks for typing/hover effects, and ensure sliders/buttons meet 44px touch targets on petit mobile.

---

## 10. Phased Implementation

### Phase 1: Foundation (Week 1-2)
**Goal**: Static pages with mock data, basic navigation

- [x] Create `education.html`, `education-arena.html`, `education-simulator.html`
- [x] Implement mobile-first layouts with CSS (education.css)
- [x] Add chat input components (floating input + side panel) with shared session history
- [ ] Create bot persona visual assets (SVG avatars/illustrations)
- [x] Add compliance ribbon on education pages
- [ ] Add first-visit compliance gate modal
- [x] Wire navigation between pages
- [x] Add FR/EN translations for all static text

**Deliverable**: Navigable education section with placeholder content

### Phase 2: Arena Core (Week 3-4)
**Goal**: Functional arena with historical replay

- [x] Build `arenaTimelineService.js` with pre-computed data (from portfolio cache) + disk cache
- [x] Implement Chart.js timeline visualization with playback/scrubbing + event markers
- [x] Create leaderboard component with animations
- [x] Build trade tape with slide-in entries (currently synthetic actions)
- [x] Add bot dialogue panel with typing effect
- [x] Implement auto-play and manual scrubbing
- [x] Connect arena chatbot for Q&A (context metadata + session chat history)
- [ ] Tie trade/vignette/dialogue copy to actual allocation deltas for data fidelity

**Deliverable**: Users can watch bots trade through history

### Phase 3: Simulator Chat (Week 5-6)
**Goal**: Functional strategy builder via chat

- [x] Build `strategyBuilderService.js` with NLP heuristics
- [x] Extend chat controller with simulator context + metadata injection
- [x] Create strategy suggestion UI (templates, chips, suggestions in chat)
- [x] Build custom mix slider interface
- [x] Implement instant backtest visualization (via `/api/portfolio/custom-allocation`)
- [ ] Add comparison mode (mix vs benchmark/bots overlay)
- [ ] Add education analytics for builder interactions

**Deliverable**: Users can build strategies via natural language

### Phase 4: Tutorials & Gamification (Week 7-8)
**Goal**: Complete learning experience

- [x] Build spotlight/tooltip tutorial system (hub + arena + simulator overlays)
- [ ] Implement 6 arena lessons + 5 simulator lessons (current overlays are intro-only)
- [ ] Create achievement system with storage
- [ ] Add progress tracking UI
- [x] Implement "time travel to events" feature (event buttons + timeline markers)
- [ ] Add prediction mode for arena

**Deliverable**: Full gamified learning journey

### Phase 5: Polish & Analytics (Week 9-10)
**Goal**: Production-ready

- [ ] Performance optimization (lazy loading, caching)
- [ ] Accessibility audit (ARIA, keyboard nav)
- [ ] Cross-browser testing (Safari, Chrome, Firefox)
- [ ] Mobile testing (iOS Safari, Android Chrome)
- [ ] Analytics integration
- [ ] A/B test landing page CTAs

**Deliverable**: Launch-ready education module

---

## 11. Design Decisions (Confirmed)

| Question | Decision | Rationale |
|----------|----------|-----------|
| Bot Naming | Personas (Équi, Pari, Momo, Sage) | French-inspired, strategy-meaningful, educational |
| Visual Style | Light theme (per Charte Graphique) | White backgrounds privileged, violet accents |
| Icons | Dark SVG line icons only | No emoji per brand guidelines |
| Waitlist CTA | Yes, multiple touchpoints | Modal after tutorial, sticky footer, exit intent |
| Time-Travel Events | 12 key events (2008-2024) | Crashes, rallies, geopolitical (see Section 5.3) |

### 11.1 Final Decisions (All Questions Resolved)

| Question | Decision | Rationale |
|----------|----------|-----------|
| **Progress Persistence** | Session-only (JS state, no localStorage) | Marketing site, not the app. Fresh start each visit. Soft prompt to join waitlist for "future" persistence. |
| **Replay Speed** | Smart defaults (1 month/sec) + auto-pause at events + "Continue" button | Clean UI, no speed selector. Educational moments get emphasis. |
| **Achievement Badges** | Optional, non-blocking. Soft share prompt with equally-prominent "Skip" button. All content free. | Encouraging without being pushy. No FOMO tactics. Professional feel. |
| **Bot Dialogue** | Pre-generated batch (960 dialogues) + LLM on-the-fly for custom strategies only | Fast for common cases. Creative flexibility for "create your own" via existing chat endpoint. |

---

## 12. Success Metrics

| Metric | Target |
|--------|--------|
| Time on education page | > 3 minutes avg |
| Tutorial completion rate | > 40% |
| Strategy builds | > 2 per user session |
| Mobile vs Desktop | 60/40 (mobile first) |
| Bounce rate | < 30% |
| Waitlist conversion from education | > 15% |

---

## Appendix A: Design References

### Internal Reference (REQUIRED)
- **Charte Graphique Bubble**: `docs/company/Charte Graphique Bubble.md` — **Must be followed for all visual decisions**
  - White backgrounds privileged
  - Violet #667eea for accents
  - Inter font family
  - Animation timing: 0.3s-0.6s with `cubic-bezier(0.16, 1, 0.3, 1)`
  - Border-radius: 24px (cards), 50px (buttons/inputs)

### External Inspiration (Adapt to Bubble brand)
- **Nof1.ai Alpha Arena**: [https://nof1.ai](https://nof1.ai) — AI trading competition format, transparency, leaderboard
- **Obside**: [https://obside.com](https://obside.com) — Conversational UI, "Arena" concept (adapt: use light theme, not dark)
- **Composer.trade**: Strategy builder via natural language (paid product)
- **TradingView**: Chart interaction patterns, mobile UX

> ⚠️ **Note**: Obside uses a dark theme which is **NOT** compliant with Bubble's Charte Graphique. Adapt their UX patterns (animations, conversational flow) but use white/light backgrounds.

## Appendix B: Key Existing Code Patterns

**SSE Streaming** (chat.controller.js:174-248):
```javascript
// Reusable pattern for arena updates
res.setHeader("Content-Type", "text/event-stream");
res.setHeader("Cache-Control", "no-cache");
res.setHeader("Connection", "keep-alive");
```

**Strategy Config** (portfolio-simulator.js:349):
```javascript
// Bot config can follow same pattern
const BOT_CONFIG = {
  momo: { name: 'Momo', strategy: 'momentum', color: '#F97316', ... }
};
```

**Chart.js Setup** (portfolio-simulator.js):
```javascript
// Existing chart patterns can be adapted for arena
portfolioChart = new Chart(ctx, {
  type: 'line',
  data: { datasets: [...] },
  options: { responsive: true, ... }
});
```
