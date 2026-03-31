# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**IMPORTANT: This Repository is BubbleLaunch (Marketing Website)**

This is the **marketing website** for **Bubble Invest**, a fintech startup. This codebase is NOT the main product—it's the public-facing website that presents Bubble Invest's services and product vision.

- **This Codebase (BubbleLaunch)**: Content platform with blog, tutorials, portfolio simulator demo, B2B consulting page, and newsletter subscription (https://bit.ly/3Z9Cncr)
- **Investment Agent**: Personal proof of concept shared openly for educational purposes, NOT a commercial product 

---

### Bubble Invest Company Overview

**Bubble Invest** operates a dual-activity business model combining free educational content (B2C) with AI automation consulting (B2B).

**Business Model**:
1. **B2C - Free Content, Education & Expertise Showcase** – Our consumer-facing activity is entirely free and serves as our marketing. We share our investment agent proof of concept openly, along with tutorials, demos, and resources on AI agents (Claude Code, Open Claw, etc.). The B2C feeds the B2B by proving our expertise.
2. **B2B - Custom AI Automation Consulting** – We help professionals (wealth advisors, asset managers, SMEs) deploy cutting-edge AI agents and automation. Our unique edge: systematic early adoption—we master tools weeks after release, well ahead of the market.

### Bubble Invest's Core Approach

**What Makes Bubble Different:**

#### **B2C Activity - Free Content as Marketing**
- **Investment Agent Proof of Concept**: We built an automated investment agent for our own use. We share it open-source, transparently showing what it does well, its limits, and how it's built. This is NOT a paid product—it's our showcase.
- **Educational Content**: Tutorials, demos, build-in-public resources on AI agents (Claude Code, Open Claw, etc.), extending beyond just investment to general AI automation.
- **Blog & Resources**: Free knowledge sharing on automation, AI agents, and technology trends.
- **No Forced Monetization**: We don't artificially monetize content that's becoming commoditized. Our value lies in context, curation, and honesty.
- **Newsletter**: Free educational content via Substack (https://bubbleinvest.substack.com) and Bitly subscription (https://bit.ly/3Z9Cncr)

#### **B2B Activity - AI Automation Consulting**
- **Target Clients**: Wealth advisors (CGP), asset management firms, small/medium SMEs, tech-forward independents
- **Services**: AI agent deployment (Claude Code, Open Claw, etc.), workflow automation, technology monitoring, training on latest AI tools
- **Unique Edge**: Systematic early adopters—we master tools released weeks ago, placing clients well ahead of competitors
- **Approach**: Continuous support, rolling upgrades, always at the cutting edge of AI innovations
- **Pricing & Scope**: Custom projects ranging from diagnostics to full automation deployments, with transparent budgets and agile delivery

---

### Current Status

**Investment Agent**: Personal proof of concept used by founders, shared publicly for educational purposes. NOT a commercial product—serves as demonstration of AI automation capabilities.

**BubbleLaunch Website** (this codebase): Content platform showcasing expertise through free resources, tutorials, blog, and newsletter (https://bit.ly/3Z9Cncr). Acts as marketing funnel for B2B consulting services.

## BubbleLaunch Website (This Codebase)

**Current Web Application (2026 Refresh):**
The codebase is a bilingual (FR/EN) marketing website with integrated AI chatbot, blog system, and Knowledge Garden, built with vanilla JavaScript and Node.js/Express. Refreshed in 2026 with new design system (Inter font, glassmorphism, `--purple: #93acf0` accent).

**Active Pages (2026)**:

| FR Route | EN Route | File (FR) | File (EN) |
|----------|----------|-----------|-----------|
| `/` | `/en/` | `pages/index.html` | `pages/en/index.html` |
| `/particuliers` | `/en/individuals` | `pages/particuliers.html` | `pages/en/individuals.html` |
| `/professionnels` | `/en/professionals` | `pages/professionnels.html` | `pages/en/professionals.html` |
| `/a-propos` | `/en/about` | `pages/a-propos.html` | `pages/en/about.html` |
| `/blog` | `/en/blog` | `pages/blog.html` | `pages/en/blog.html` |
| `/blog/:slug` | `/en/blog/:slug` | `pages/blog-post.html` | `pages/en/blog-post.html` |
| `/mentions-legales` | `/en/legal-notice` | `pages/mentions-legales.html` | `pages/en/legal-notice.html` |
| `/privacy` | `/en/privacy` | `pages/privacy.html` | `pages/en/privacy.html` |

**Key Features**:
- **AI Chatbot** - Educational chatbot on every page via floating input + slide-in panel
- **Blog + Knowledge Garden** - SEO-driven content with Notion CMS + reference library
- **Bilingual** - Full FR/EN with language toggle in header, `data-translate` attributes, `translations.js`
- **Cookie Banner** - GDPR/CNIL compliant, bilingual, GA4 consent mode
- **Mobile Hamburger Menu** - Responsive nav for ≤768px viewports

**Archived Pages** (in `pages/archive/2024-2025/`):
- `investors/` — legacy retail investor section (replaced by `/particuliers`)
- `professionals/` — legacy B2B section (replaced by `/professionnels`)
- `portfolio-simulator.html` — legacy simulator (feature removed from 2026 refresh)
- `pricing.html` — legacy pricing page (integrated into new pages)
- `design-mock.html`, `workflow-visualization-mock.html` — old design mocks
- `archive/mock-files/` — 10 standalone mock HTML files used during 2026 design phase

---

## Investment Agent (Proof of Concept - NOT a Commercial Product)

**Status**: Personal tool used by founders, shared openly for educational purposes

The **Investment Agent** is a proof of concept we built for our own portfolio automation. We share it transparently as part of our B2C content strategy—showing what works, what doesn't, and how it's built. **This is NOT a commercial product.**

### Agent Characteristics (Shared Openly):
- **Personal Use**: Currently automated for founders' own portfolios with IBKR/Alpaca/Saxo brokers
- **Open Sharing**: Build-in-public approach—we transparently share the architecture, strategies, successes, and failures
- **Educational Purpose**: Demonstrates AI agent capabilities for investment automation, not a financial product or advice service
- **No Custody**: Users (if they replicate) maintain control with their own brokerage accounts—we NEVER take custody
- **No Financial Advice**: This is a personal tool shared for education, NOT personalized investment recommendations

### How BubbleLaunch Showcases the Agent:
1. **Content Platform**: Blog posts, tutorials, and demos explaining how the agent works
2. **Portfolio Simulator**: Educational tool showing backtesting concepts (9 strategies, 20 years of data)
3. **Transparent Sharing**: "Build in public" philosophy—we share learnings, iterations, and even failures
4. **B2B Proof Point**: Demonstrates our AI automation expertise to attract consulting clients
5. **Newsletter**: Regular updates on agent improvements and AI automation insights (https://bit.ly/3Z9Cncr)

**Key Points:**
1. **Free Content, Not a Product**: The agent is shared for free as proof of expertise—B2C is marketing, not revenue
2. **No Regulatory Constraints**: We're not offering financial advice, asset management, or a financial product—just sharing our personal tool
3. **Focus on B2B**: The real business is helping professionals (CGPs, asset managers, SMEs) deploy AI automation in their own workflows
4. **Early Adopter Edge**: We stay ahead by mastering cutting-edge tools (Claude Code, Open Claw, etc.) weeks after release
5. **Build Trust Through Transparency**: Honest sharing of what works (and what doesn't) builds credibility for B2B consulting

## Commands

### Development
- `npm start` - Start the development server (runs on port 3000)
- `node src/backend/server.js` - Direct server start

### Testing
- **Manual Testing Endpoints (2026)**:
  - `/` - Homepage (FR)
  - `/en/` - Homepage (EN)
  - `/particuliers` - Individuals landing (FR)
  - `/en/individuals` - Individuals landing (EN)
  - `/professionnels` - Professionals landing (FR)
  - `/en/professionals` - Professionals landing (EN)
  - `/a-propos` - About (FR)
  - `/en/about` - About (EN)
  - `/blog` - Blog listing (FR)
  - `/en/blog` - Blog listing (EN)
  - `/clear-cache` - Clear blog image cache
  - `/api/blog/test-image-service-connection` - Test OpenAI image service connectivity
- Playwright available as dev dependency (`@playwright/test`) for E2E testing
- Primary testing remains manual

## Architecture & Key Components

### Backend Structure (`src/backend/`) - **Modular MVC Architecture**

#### Core Files
- **`server.js`** - Application entry point (~45 lines) that mounts routes and initializes the cache scheduler
- **`config/`** - Environment and middleware configuration
  - `env.js` - Environment variable validation
  - `express.js` - Express middleware setup
- **`routes/`** - Route definitions (separated by feature)
  - `index.js` - Route aggregator
  - `chat.routes.js`, `waitlist.routes.js`, `newsletter.routes.js`, `blog.routes.js`, `knowledge-garden.routes.js`, `portfolio.routes.js`, `arena.routes.js`, `business-contact.routes.js`, `sitemap.routes.js`, `pages.routes.js`
- **`controllers/`** - Business logic layer
  - `chat.controller.js` - AI chatbot logic
  - `waitlist.controller.js` - Subscription handling
  - `newsletter.controller.js` - Newsletter subscription handling
  - `blog.controller.js` - Blog and image management
  - `knowledge-garden.controller.js` - References management
  - `portfolio.controller.js` - Portfolio simulator APIs + cache orchestration
  - `arena.controller.js` - AI Trading Arena logic
  - `business-contact.controller.js` - B2B lead capture
- **`middleware/`** - Custom middleware
  - `session.js` - Session configuration
  - `rate-limiter.js` - Chat rate limiting
  - `error-handler.js` - Centralized error handling
- **`services/`** - External integrations and calculations
  - `blogService.js` - Notion CMS integration
  - `blogStatusScheduler.js` - Hourly blog status sync
  - `imageService.js` - AI image generation
  - `knowledgeGardenService.js` - References with LLM enrichment
  - `yahooFinanceService.js` - ETF historical data fetching
  - `portfolioService.js` - Portfolio calculation orchestrator (strategy wrappers + metrics)
  - `portfolioCacheService.js` - Snapshot generation & formatting
  - `cacheScheduler.js` - Cron-based cache regeneration
  - `portfolioHelpers.js` / `strategies/*` - Modular strategy implementations
  - **`toolExecutionService.js`** - Tool invocation service with 5 callable tools for LLM integration (get_profile_visualization, recommend_learning_path, explain_bot_trade, backtest_strategy, compare_strategies)
  - **`arenaTimelineService.js`** - Historical timeline generation for 4 trading bots with dialogue and decision explanations
  - **`strategyBuilderService.js`** - Heuristic intent detection for strategy simulation and custom allocation suggestions

### Frontend Structure (`src/frontend/`)
- **`pages/`** - HTML pages (2026 refresh):
  - FR: `index.html`, `particuliers.html`, `professionnels.html`, `a-propos.html`, `blog.html`, `blog-post.html`
  - EN: `en/index.html`, `en/individuals.html`, `en/professionals.html`, `en/about.html`, `en/blog.html`, `en/blog-post.html`
  - Legal: `mentions-legales.html`, `privacy.html`, `en/legal-notice.html`, `en/privacy.html`
  - Utility: `404.html`, `clear-cache.html`
  - Archive: `archive/2024-2025/` (legacy pages), `archive/mock-files/` (design mocks)
- **`js/`** - Modular JavaScript components:
  - `chat-side-panel.js` - Slide-in chat panel with SSE streaming
  - `floating-chat-input.js` - Glassmorphism floating chat input (triggers side panel)
  - `bubble-agent-memory.js` - **Unified Agent Memory System** (localStorage-based persistent memory)
  - `blog-2026.js` - Blog listing with API integration + Knowledge Garden references
  - `blog-post.js` - Individual blog post rendering
  - `chatbot-animations.js` - Message animations and typing indicators
  - `chatbot-logic.js` - Chatbot core logic
  - `animations.js` - UI animations and effects
  - `language-switcher.js` - Language toggle logic
  - `knowledge-overlay.js` - Knowledge Garden overlay UI
  - `tool-result-visualizer.js` - Tool result display for chatbot
  - `seo/cookie-banner.js` - GDPR/CNIL cookie consent banner
  - `seo/ga4-events.js` - Google Analytics 4 event tracking
  - `seo/structured-data.js` - JSON-LD structured data
- **`i18n/translations.js`** - Internationalization (French/English)
- **`assets/`** - Static resources (styles, images)
  - `styles/core-2026.css` - Shared styles: CSS variables, header, footer, buttons, chat panel, mobile hamburger
  - `styles/homepage-2026.css` - Homepage-specific styles
  - `styles/particuliers-2026.css` - Particuliers/Individuals page styles
  - `styles/professionnels-2026.css` - Professionnels/Professionals page styles
  - `styles/a-propos-2026.css` - À Propos/About page styles
  - `styles/blog-2026.css` - Blog listing + Knowledge Garden styles
  - `styles/cookie-banner.css` - Cookie banner styles
  - `styles/styles.css` - Legacy stylesheet (kept for blog-post pages, to be migrated)
  - `styles/blog.css`, `styles/blog-post.css` - Legacy blog styles

### Key Integrations
- **Notion API** - Content management for waitlist, blog posts, and Knowledge Garden
- **OpenRouter API** - LLM provider with 100% free model rotation:
  1. `stepfun/step-3.5-flash:free` (primary - 196B sparse MoE)
  2. `qwen/qwen3.6-plus-preview:free` (fallback)
  3. `nvidia/nemotron-3-super-120b-a12b:free` (fallback - 120B)
  4. `qwen/qwen3-next-80b-a3b-instruct:free` (fallback - 80B)
  5. `meta-llama/llama-3.3-70b-instruct:free` (fallback - 70B)
  6. `nvidia/nemotron-3-nano-30b-a3b:free` (fallback - 30B)
  7. `arcee-ai/trinity-large-preview:free` (final fallback - 400B sparse MoE)
  - **Cost Model**: 100% free models ($0/month)
  - **Model Selection**: Automatic fallback if primary model rejects tool calls or encounters rate limits
- **OpenAI Images (gpt-image-1)** - Automated blog image generation with intelligent caching
- **Yahoo Finance API** - ETF historical data for portfolio simulator
- **Express Sessions** - Chat rate limiting (100 messages per session)

### Environment Configuration
The application requires several environment variables in `.env`:
- `NOTION_TOKEN` - Waitlist database access
- `NOTION_DATABASE_ID_WAITLIST` - Waitlist storage
- `NOTION_DATABASE_ID_BUSINESS` - Business contact database
- `NOTION_DATABASE_ID_NEWSLETTER` - Newsletter subscriber database
- `NOTION_BLOG_API_KEY` - Blog CMS (also used for Knowledge Garden)
- `NOTION_BLOG_DATABASE_ID` - Blog database ID
- `NOTION_KNOWLEDGE_GARDEN_DATABASE_ID` - Knowledge Garden database ID
- `OPENROUTER_API_KEY` - AI chatbot functionality
- `OPENAI_API_KEY` - Blog image generation (OpenAI Images API)
- `SESSION_SECRET` - Session security

**Note:** Knowledge Garden uses `NOTION_BLOG_API_KEY` (shared with blog). The Knowledge Garden database ID is configured via the `NOTION_KNOWLEDGE_GARDEN_DATABASE_ID` environment variable.

### Database Schema (Notion)
**Waitlist Database:** Properties include Nom (title), Email, Profil (select), Commentaires (rich_text)

**Blog Database:** Bilingual content with Title FR (title), Title EN (rich_text), Content Summary FR/EN, Content FR/EN, Status (select), Publication Date, Topic Tags (multi_select)

**Knowledge Garden Database:** Reference management with Name (title), Author, Source Type (select), Category (multi_select), Topics (multi_select), URL, AI summary, Bubble Blog (multi_select), Status (select), Date. Automatically enriched with LLM-generated metadata for legal compliance.

### Content Management
- Blog posts support bilingual content (French primary, English secondary)
- Automatic slug generation from French titles
- AI-powered image generation with fallback to thematic Unsplash images
- Status-based publishing (Published/Scheduled with date validation)

### Frontend Features
- **Responsive multilingual design** with language toggle (FR/EN)
- **Interactive AI chatbot** with streaming responses, unified system prompt, and glassmorphism floating input
- **Dynamic blog system** with bilingual content rendering
- **Portfolio Simulator v2.0** – Interactive comparison of nine backend strategies plus client-side custom mix across 20 years of ETF data (SPY, IEF, GLD, EFA, EEM, VNQ, CASH)
  - Leverage toggle (1× / 2×) with borrowing cost adjustment
  - ETF visibility controls, persistent preferences, GA4 instrumentation
  - 6 core metrics + Calmar ratio, PNG/CSV export toolkit, responsive sliders
  - Fully bilingual with dynamic chart/tooltip translation
  - See [docs/PORTFOLIO_SIMULATOR.md](docs/PORTFOLIO_SIMULATOR.md) for details
- Real-time form validation and submission
- Animated UI elements and smooth transitions

## Development Notes

### Blog System
- Uses Notion as headless CMS with rich bilingual content support
- Automatic image generation for articles using AI
- Intelligent caching system for generated images
- Falls back to thematic stock images when AI generation fails

### Chatbot Implementation
**Status**: ✅ **Production-ready** with integrated tool invocation loop

- **Streaming Architecture**: Server-Sent Events (SSE) with two-pass streaming pattern for tool execution
  - First pass: LLM response may include tool calls (get_profile_visualization, recommend_learning_path, explain_bot_trade, backtest_strategy, compare_strategies)
  - Tool Execution: Services invoked with automatic error handling and retry logic
  - Second Pass: LLM incorporates tool results into final response for user
- **Model Fallback System**: Automatic rotation across 7 free models via OpenRouter with intelligent retry on tool rejection
- **Unified System Prompt**: Adapts to page context (index, simulator, pricing, businesses) with dynamic context module loading
  - Context modules: core, technical, pitch, vision, detailed_mission, professionals
  - Keyword triggers for intelligent module selection (price|cost|broker → technical; ethics|future|philosophy → vision)
  - Token-optimized loading (46% reduction from baseline)
- **Tool Invocation Service** (`toolExecutionService.js`):
  - **5 Available Tools**:
    - `get_profile_visualization` (Playground): Returns user profile from BubbleAgentMemory
    - `recommend_learning_path` (Playground): Suggests educational resources based on focus area
    - `explain_bot_trade` (Arena): Explains historical trading decisions from bot timeline
    - `backtest_strategy` (Simulator): Backtests custom allocations (heuristic-based)
    - `compare_strategies` (Education): Compares performance of multiple strategies
  - Automatic pre-invocation for simulator (detects backtest intent, executes before LLM sees message)
  - Tool result formatting for transparent user display
  - Graceful fallback to text-only if tools rejected
- **Per-context Conversation History**: Persists in localStorage with BubbleAgentMemory integration
- **Integrated Rate Limiting**: 100 messages per session for abuse prevention
- **BubbleAgentMemory Integration**: User profile context passed to LLM and tools for personalized responses

### Image Generation
- OpenAI image integration with intelligent prompt generation
- Persistent caching system to avoid regeneration
- Thematic fallback images based on article tags
- Cache management endpoints for debugging

### LLM Enrichment System
The application features an intelligent reference enrichment system for the Knowledge Garden:

**Architecture:**
- **Hybrid Polling Approach:** On-demand enrichment when API is called + background processing
- **Cost Optimization:** Uses cheapest models first (GPT-4o-mini → GPT-4o → Claude-3-Haiku)
- **Legal Compliance:** Generates legitimate purchase/access links instead of sharing copyrighted content
- **Intelligent Caching:** Avoids re-processing already enriched references

**Enrichment Features:**
- **Type Detection:** Automatically categorizes Books vs Articles vs Papers vs Websites
- **Legal Links Generation:** Amazon purchase links, publisher sites, DOI links, library catalogs
- **Cost-Optimized Summaries:** Uses existing Notion AI summaries instead of generating new ones
- **Key Insights:** Strategic takeaways for investors and finance professionals  
- **Accessibility Analysis:** Determines legal access methods and availability

**API Endpoints:**
- `/api/knowledge-garden/references` - Basic or enriched references (default: enriched)
- `/api/knowledge-garden/references-by-source-type` - Enriched references grouped by type
- `/api/knowledge-garden/references-by-theme` - References grouped by categories
- `/api/knowledge-garden/explore` - Database structure exploration
- `/api/knowledge-garden/clear-cache` - Clear enrichment cache (testing only)

**Data Flow:**
1. References marked as "Published" in Notion Knowledge Garden
2. System detects un-enriched references on API calls
3. LLM analyzes title/author to generate metadata and legal links (uses existing Notion AI summaries)
4. Legal compliance check ensures no copyrighted PDFs are shared
5. Results cached to avoid re-processing
6. Frontend displays enriched references with proper purchase links

**Cost Optimization:**
- **Leverages Notion AI:** Uses existing AI summaries instead of generating new ones
- **Reduced Token Usage:** ~50% fewer output tokens per reference
- **Focused Prompts:** Only generates essential metadata and legal links
- **Intelligent Caching:** Prevents redundant API calls for already enriched references

### Bubble Playground (Education Module) — ARCHIVED
**Status**: 📦 **Archived** (2026 refresh) — Pages moved to `pages/archive/2024-2025/investors/`

**Note**: The Playground, Arena, Simulator, and Resources pages were part of the `/investors/` section which has been replaced by `/particuliers` in the 2026 refresh. The BubbleAgentMemory system and chat-side-panel remain active across the new site.

**Documentation**: See [docs/BUBBLE_PLAYGROUND_PROJECT.md](docs/BUBBLE_PLAYGROUND_PROJECT.md) for historical reference.

**Archived Pages** (were under `/investors/`):
- Playground Chat, AI Trading Arena, Strategy Simulator, Resources Hub

**Bot Mascots** (Animal-themed for memorability):
| Animal (FR) | Animal (EN) | Strategy | Color | Profile Match |
|-------------|-------------|----------|-------|---------------|
| Ours | Bear | Equal Weight | #6B7280 | - |
| Renard | Fox | Risk Parity | #667eea | Balanced (40-60) |
| Faucon | Hawk | Momentum | #F97316 | Growth (70-100) |
| Hérisson | Hedgehog | Defensive | #10B981 | Conservative (0-30) |

#### Unified Agent Architecture (BubbleAgentMemory)

**Core Module**: `bubble-agent-memory.js` - localStorage-based persistent memory system

**Key Features**:
- **Conversational Onboarding**: LLM-driven profile discovery (replaces scripted MCQ flow)
- **Progressive Profile Building**: Risk score refined through natural conversation
- **Profile Extraction Protocol**: LLM outputs `<!-- PROFILE_UPDATE {...} -->` in responses
- **Confidence Tracking**: Profile revealed when confidence reaches 70% (min 3 exchanges)
- **Site-wide Memory**: User context persists across all pages (/investors, /professionals)
- **Bilingual Support**: Full FR/EN with language sync

**Memory API** (BubbleAgentMemory):
```javascript
// Profile Management
BubbleAgentMemory.getProfile()           // { riskScore, riskConfidence, traits, goal, horizon, level }
BubbleAgentMemory.applyProfileUpdate()   // Apply LLM-extracted profile updates

// Journey Tracking
BubbleAgentMemory.getJourney()           // { onboardingCompleted, questionsAsked, strategiesTested }
BubbleAgentMemory.recordPageVisit(path)  // Track page visits
BubbleAgentMemory.recordStrategyTested() // Track strategies explored

// LLM Context
BubbleAgentMemory.getContextForLLM()     // Token-efficient context for system prompts
```

**Integration Points**:
- `chat-side-panel.js` - Floating chatbot loads memory dynamically, includes user context in API calls
- `playground-fullscreen-chat.js` - Conversational onboarding with profile extraction
- `profile-graph.js` - Left sidebar visualization (risk gauge, traits, confidence bar)
- `arena.js` - Highlights recommended bot based on profile, tracks strategies viewed

**Profile-Based Recommendations**:
- Conservative (0-30%) → Hedgehog (Defensive)
- Balanced (40-60%) → Fox (Risk Parity)
- Growth (70-100%) → Hawk (Momentum)

**Post-Onboarding Features**:
- Personalized returning user welcome (time-aware greetings)
- Profile reminder with risk allocation
- Journey progress tracking
- Proactive LLM suggestions based on profile

**Development Guidelines**:
- Test changes in both FR and EN pages
- Update translations in `src/frontend/i18n/translations.js`
- Follow glassmorphism design patterns
- Use `data-translate` attributes for bilingual text
- Always null-check Memory: `if (!Memory) return;`

### Tool Invocation & Integration

**Status**: ✅ **Production-ready** - Full two-pass streaming implementation

**Architecture Overview**:
The chatbot implements a sophisticated tool invocation loop that enables LLM-driven function calling across multiple service integrations. This architecture follows a two-pass streaming pattern:

1. **First Pass**: LLM generates response (which may include tool calls)
2. **Tool Execution**: If tool call detected, service is invoked with proper error handling
3. **Result Transmission**: Tool result sent to frontend for optional visualization
4. **Second Pass**: LLM receives tool result and incorporates into final response

**Tool Definitions** (`toolExecutionService.js`):

| Tool Name | Page Context | Status | Data Source | Notes |
|-----------|--------------|--------|-------------|-------|
| `get_profile_visualization` | Playground | ⚠️ Needs wiring | BubbleAgentMemory (placeholder) | Returns user risk profile, traits, recommendations |
| `recommend_learning_path` | Playground | ✅ Production | Educational guides (static) | Returns 7 guides with focus area filtering |
| `explain_bot_trade` | Arena | ✅ Production | arenaTimelineService | Explains historical bot decisions |
| `backtest_strategy` | Simulator | 🟡 Heuristic | Calculation formula | Tests custom allocations (MVP acceptable) |
| `compare_strategies` | Education | 🟡 Static data | Strategy comparison (static) | Compares bot performance metrics |

**Automatic Pre-Invocation** (Simulator Only):
The system detects backtest intent patterns (e.g., "test 60/40", "try equal weight") and automatically executes `backtest_strategy` BEFORE the LLM sees the message, injecting results as context. This provides instant feedback without waiting for LLM tool invocation.

**Error Handling**:
- If model rejects tools (status 400/422), system retries WITHOUT tools
- Tool execution errors logged with user-friendly fallback messages
- Graceful degradation ensures users always receive text-only response if tools fail

**Integration Points**:
- `chat.controller.js` (lines 575-819): Tool invocation loop with streaming
- `chat-side-panel.js`: Sends userProfileContext in API calls for tool personalization
- `playground-fullscreen-chat.js`: Receives tool_result events for optional profile visualization

---

### Portfolio Simulator — ARCHIVED
**Status**: 📦 **Archived** (2026 refresh) — Page moved to `pages/archive/2024-2025/portfolio-simulator.html`

The portfolio simulator was a standalone page at `/portfolio-simulator`. It has been archived as part of the 2026 refresh. The simulator functionality may be reintroduced in a future iteration.

Previously included a **lightweight, interactive portfolio simulator** integrated into the main Bubble project:

**Architecture:**
- **Simplified from anim-main**: Reduced from 9 strategies (4000+ lines) to 3 core strategies (~1096 lines total)
- **Vanilla JS Implementation**: No React dependency, built with native JavaScript + Chart.js 4.4.0
- **Yahoo Finance Integration**: Fetches **20 years** of historical data for SPY (stocks), IEF (bonds), GLD (gold)
- **Caching Strategy**: Pre-calculated preview data for <500ms landing page loading
- **Bilingual Support**: Full FR/EN translations for all UI elements, tooltips, and chart labels

**Strategies Implemented:**
1. **Equal Weight** (Allocation Égale): Simple 33.3% allocation (baseline comparison)
2. **Simple Risk Parity**: Inverse volatility weighting with 60-day rolling window
3. **Optimized Risk Parity** ✨: EWMA volatility (λ=0.94) + correlation adjustment ← Highlighted as best performer

**API Endpoints:**
- `GET /api/portfolio/preview-data` - Pre-calculated chart data with all 3 strategies (cached)
- `POST /api/portfolio/clear-cache` - Clear cache for testing (regenerates on next request)

**Performance Metrics** (6 metrics with educational tooltips):
- Total Return, Annualized Return (CAGR), Volatility (annualized)
- Sharpe Ratio (2% risk-free rate), Maximum Drawdown, Calmar Ratio
- Historical data: 240 monthly data points (20 years: 2005-2025)

**Data Flow:**
1. User lands on page → Preview chart loads from cache → Animated snapshot displays
2. User clicks "Try Our Simulator" → Standalone page loads
3. User selects strategy → Chart updates with opacity-based prominence (active: 100%, others: 30%)
4. User changes time period (1Y/3Y/5Y/10Y/20Y) → Chart filters data accordingly

**Frontend Integration:**
- ✅ [portfolio-preview.js](src/frontend/js/portfolio-preview.js) - Animated chart in "What We're Building" section (landing page)
- ✅ [portfolio-simulator.html](src/frontend/pages/portfolio-simulator.html) - Full interactive page at `/portfolio-simulator`
- ✅ [portfolio-simulator.js](src/frontend/js/portfolio-simulator.js) - Strategy switching, metrics calculation, bilingual support
- ✅ Chart.js for lightweight visualization matching Bubble's design system
- ✅ "Ask our AI" CTA button connected to main page chatbot via `document.querySelector('.floating-bubble-inner').click()`

**Key Features:**
- **Enhanced Visual Hierarchy**: Active strategy displayed with 1.5x thicker line, 100% opacity; inactive at 30% opacity
- **Educational Tooltips**: Hover on strategy pills and metrics for detailed explanations
- **Responsive Design**: Mobile-optimized with touch-friendly controls
- **Time Period Selector**: 1Y, 3Y, 5Y, 10Y, 20Y buttons for flexible analysis
- **Bilingual**: Language switcher updates all text, chart labels, and tooltips dynamically

**Recent Updates** (2025-10-09):
- **Comprehensive Responsive Design**: All pages now fully responsive for mobile, tablet, and desktop
  - Portfolio simulator: Enhanced strategy pills with touch-friendly controls, optimized chart heights
  - Main page: Icon sizing adjusted for mobile (24px → 20px @ 768px, 18px @ 480px)
  - Chart slides: Improved touch targets (44px minimum), better carousel navigation
  - Chat interface: iOS keyboard-friendly (16px font prevents zoom), adjusts height on focus
  - Touch devices: Removed hover effects, added active states, 44px minimum touch targets
  - Small mobile (≤480px): Back button shows icon only, compact layouts
- **Tile Border-Radius Standardization**: All tiles now use 24px border-radius (previously 16px)
- **Glassmorphism UI**: Added floating chat input with transparent design (15% white opacity, 20px blur)
- **Button Design Unification**: All CTA buttons now pill-shaped (border-radius: 50px)
- **Submit Buttons**: Circular gray gradient buttons (40px × 40px) with upward arrow icon
- **Strategy Icons**: Added SVG icons to portfolio tiles (equal, AI, scale)
- **Form Inputs**: Enhanced with glassmorphism styling matching floating input
- **Font Consistency**: All pages load Inter font weights 400-800

**Future Enhancements** (See [PORTFOLIO_SIMULATOR.md](docs/PORTFOLIO_SIMULATOR.md)):
- **Short-term**: Analytics integration, SEO optimization, cross-browser testing
- **Medium-term**: "Create Your Own" strategy feature (chatbot-guided mixing of strategies), specialized portfolio agent
- **Long-term**: Expand to 8-10 strategies, 10+ ETFs, blog integration, user accounts with saved portfolios

### Deployment Considerations
- Designed for cloud deployment (includes Dockerfile and replit.nix)
- Graceful shutdown handling for cache persistence
- Environment-specific configurations
- Static file serving with proper routing
- LLM enrichment scales automatically with reference volume
- Yahoo Finance API caching (24h TTL) to respect rate limits
