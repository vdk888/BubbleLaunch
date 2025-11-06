# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Bubble Invest**, a fintech startup providing an **AI-powered quantitative platform** that delivers **AI-powered insights** on how to invest according to users' own decisions and profiles. **Bubble's mission: AI empowerment to replace traditional financial actors**, not traditional asset management.

**What Bubble Actually Is:**
- **AI empowerment platform**: Provides AI-powered insights for user-driven investment decisions based on individual profiles and preferences
- **Focus on ETF-based portfolios**: Privileges ETF strategies to keep fees low, but adapts to whatever users want to focus on
- **Fixed-fee model**: €0-10/month depending on plan (platform access, APIs, infrastructure — NOT asset management fees)
- **Full transparency**: All strategies, backtests (17+ years), and rules visible to users
- **Educational + Insightful**: AI chatbot for financial education + AI-powered investment insights tailored to user profiles
- **User-controlled accounts**: Users maintain full control with their own brokerage accounts (Interactive Brokers, Alpaca, Saxo Bank) - NOT a custody model
- **Current automation**: Bubble portfolio system (founders' investments) uses automated API integration with IBKR/Alpaca/Saxo. User automation planned for future product launch.

**Current Web Application:**
The current codebase is a multilingual waitlist landing page with integrated AI chatbot, blog system, and an expanded portfolio simulator (9 strategies + custom mix, leverage toggle, exports), built with vanilla JavaScript and Node.js/Express. This serves as the public-facing website while the core portfolio management system is being developed in beta. The beta product now includes Saxo Bank API integration alongside Interactive Brokers and Alpaca.

**Key Differentiators from Traditional Robo-Advisors:**
1. **AI empowerment, not asset management**: Provides insights for user decisions, not portfolio control
2. **User-driven investment focus**: Adapts to user preferences (privileges ETF strategies for low fees)
3. **Fixed fees**: €0-10/month depending on tier vs. 0.85-1.6% AUM percentage fees
4. **Build in public**: Transparent development, sharing learnings and iterations
5. **Direct broker integration**: Users maintain control with their own brokerage accounts (Interactive Brokers, Alpaca, Saxo Bank) - NO custody model
6. **Automation status**: Currently automated for founders' portfolios; user automation planned for full product launch (SaaS platform, not financial advisory service)

## Commands

### Development
- `npm start` - Start the development server (runs on port 3000)
- `node src/backend/server.js` - Direct server start

### Testing
- **Manual Testing Endpoints**:
  - `/` - Main landing page
  - `/portfolio-simulator` - Interactive portfolio simulator
  - `/blog` - Blog listing
  - `/test-image-generation` - OpenAI image generation test
  - `/clear-cache` - Clear blog image cache
  - `/api/blog/test-image-service-connection` - Test OpenAI image service connectivity
- No automated test framework configured (manual testing only)

## Architecture & Key Components

### Backend Structure (`src/backend/`) - **Modular MVC Architecture**

#### Core Files
- **`server.js`** - Application entry point (~45 lines) that mounts routes and initializes the cache scheduler
- **`config/`** - Environment and middleware configuration
  - `env.js` - Environment variable validation
  - `express.js` - Express middleware setup
- **`routes/`** - Route definitions (separated by feature)
  - `index.js` - Route aggregator
  - `chat.routes.js`, `waitlist.routes.js`, `blog.routes.js`, `knowledge-garden.routes.js`, `portfolio.routes.js`, `business-contact.routes.js`, `sitemap.routes.js`
- **`controllers/`** - Business logic layer
  - `chat.controller.js` - AI chatbot logic
  - `waitlist.controller.js` - Subscription handling
  - `blog.controller.js` - Blog and image management
  - `knowledge-garden.controller.js` - References management
  - `portfolio.controller.js` - Portfolio simulator APIs + cache orchestration
  - `business-contact.controller.js` - B2B lead capture
- **`middleware/`** - Custom middleware
  - `session.js` - Session configuration
  - `rate-limiter.js` - Chat rate limiting
  - `error-handler.js` - Centralized error handling
- **`services/`** - External integrations and calculations
  - `blogService.js` - Notion CMS integration
  - `imageService.js` - AI image generation
  - `knowledgeGardenService.js` - References with LLM enrichment
  - `llmEnrichmentService.js` - AI metadata generation
  - `yahooFinanceService.js` - ETF historical data fetching
  - `portfolioService.js` - Portfolio calculation orchestrator (strategy wrappers + metrics)
  - `portfolioCacheService.js` - Snapshot generation & formatting
  - `cacheScheduler.js` - Cron-based cache regeneration
  - `portfolioHelpers.js` / `strategies/*` - Modular strategy implementations

### Frontend Structure (`src/frontend/`)
- **`pages/`** - HTML pages (index.html, blog.html, blog-post.html, portfolio-simulator.html, clear-cache.html, test-image-generation.html)
- **`js/`** - Modular JavaScript components:
  - `script.js` - Main application logic with bilingual support
  - `chatbot-logic.js` - AI chatbot implementation
  - `chatbot-animations.js` - Message animations and typing indicators
  - `blog.js` - Blog listing functionality
  - `blog-post.js` - Individual blog post rendering
  - `references.js` - Knowledge Garden references display with enriched metadata
  - `portfolio-simulator.js` - Interactive portfolio comparison tool (9 strategies + custom mix, leverage toggle)
  - `portfolio-preview.js` - Landing page portfolio chart preview
  - `charts.js` - Shared chart utilities and configurations
  - `animations.js` - UI animations and effects
  - `floating-bubble.js` - Interactive bubble elements
  - `floating-chat-input.js` - Glassmorphism floating chat input
  - `mini-chat.js` - Embedded chat widget
- **`i18n/translations.js`** - Internationalization (French/English)
- **`assets/`** - Static resources (styles, images)
  - `styles/styles.css` - Main stylesheet (3,769 lines)
  - `styles/blog.css` - Blog-specific styles
  - `styles/blog-post.css` - Blog post styles
  - `styles/references.css` - Knowledge Garden styles

### Key Integrations
- **Notion API** - Content management for waitlist, blog posts, and Knowledge Garden
- **OpenRouter API** - LLM provider with fallback model rotation:
  1. `google/gemini-2.0-flash-001` (primary)
  2. `openai/gpt-4.1-mini` (fallback)
  3. `mistralai/magistral-small-2506` (fallback)
  4. `deepseek/deepseek-r1-0528:free` (final fallback)
- **OpenAI Images (gpt-image-1)** - Automated blog image generation with intelligent caching
- **Yahoo Finance API** - ETF historical data for portfolio simulator
- **Express Sessions** - Chat rate limiting (10 messages per session)

### Environment Configuration
The application requires several environment variables in `.env`:
- `NOTION_TOKEN` - Waitlist database access
- `NOTION_DATABASE_ID_WAITLIST` - Waitlist storage
- `NOTION_BLOG_API_KEY` - Blog CMS (also used for Knowledge Garden)
- `NOTION_BLOG_DATABASE_ID` - Blog database ID
- `OPENROUTER_API_KEY` - AI chatbot functionality
- `OPENAI_API_KEY` - Blog image generation (OpenAI Images API)
- `SESSION_SECRET` - Session security

**Note:** Knowledge Garden uses `NOTION_BLOG_API_KEY` (shared with blog). The Knowledge Garden database ID is hardcoded in `knowledgeGardenService.js` as `1ffcfc520644805b8bb9c9207fb2cb31`.

### Database Schema (Notion)
**Waitlist Database:** Properties include Nom (title), Email, Profil (select), Commentaires (rich_text)

**Blog Database:** Bilingual content with Title FR (title), Title EN (rich_text), Content Summary FR/EN, Content FR/EN, Status (select), Publication Date, Topic Tags (multi_select)

**Knowledge Garden Database:** Reference management with Name (title), Author, Source Type (select), Category (multi_select), Topics (multi_select), Drive URL, AI summary, Bubble Blog (multi_select), Status (select), Date. Automatically enriched with LLM-generated metadata for legal compliance.

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
- Streams responses using Server-Sent Events (SSE)
- Model fallback system with multiple LLM providers
- Unified system prompt that adapts to page context (index, simulator, pricing, businesses)
- Persists per-context conversation history in localStorage
- Integrated rate limiting for abuse prevention

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

### Portfolio Simulator
**Status**: ✅ **Production-ready** (v1.2) - Fully integrated and deployed

The application includes a **lightweight, interactive portfolio simulator** integrated into the main Bubble project:

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
