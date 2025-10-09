# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Bubble**, a fintech startup revolutionizing investment through AI-powered robo-advisory services. The application consists of a multilingual waitlist landing page with an integrated AI chatbot and blog system, built with vanilla JavaScript and Node.js/Express.

## Commands

### Development
- `npm start` - Start the development server (runs on port 3000)
- `node src/backend/server.js` - Direct server start

### Database Migration
- `./migrate.sh` - Run database migration script

### Testing
- No specific test framework is configured in package.json
- Manual testing endpoints are available at `/test-post` and `/api/test-freepik-connection`

## Architecture & Key Components

### Backend Structure (`src/backend/`) - **Modular MVC Architecture**

#### Core Files
- **`server.js`** - Minimal application entry point (~35 lines)
- **`config/`** - Environment and middleware configuration
  - `env.js` - Environment variable validation
  - `express.js` - Express middleware setup
- **`routes/`** - Route definitions (separated by feature)
  - `index.js` - Route aggregator
  - `chat.routes.js`, `waitlist.routes.js`, `blog.routes.js`, etc.
- **`controllers/`** - Business logic layer
  - `chat.controller.js` - AI chatbot logic
  - `waitlist.controller.js` - Subscription handling
  - `blog.controller.js` - Blog and image management
  - `knowledge-garden.controller.js` - References management
  - `portfolio.controller.js` - Portfolio simulator
- **`middleware/`** - Custom middleware
  - `session.js` - Session configuration
  - `rate-limiter.js` - Chat rate limiting
  - `error-handler.js` - Centralized error handling
- **`services/`** - External integrations and calculations
  - `blogService.js` - Notion CMS integration
  - `freepikService.js` - AI image generation
  - `knowledgeGardenService.js` - References with LLM enrichment
  - `llmEnrichmentService.js` - AI metadata generation
  - `yahooFinanceService.js` - ETF historical data fetching
  - `portfolioService.js` - Portfolio calculation algorithms

### Frontend Structure (`src/frontend/`)
- **`pages/`** - HTML pages (index.html, blog.html, blog-post.html, portfolio-simulator.html)
- **`js/`** - Modular JavaScript components:
  - `script.js` - Main application logic (includes bilingual support via `data-translate-html`)
  - `chatbot-logic.js` - AI chatbot implementation
  - `blog.js` - Blog listing functionality
  - `blog-post.js` - Individual blog post rendering
  - `references.js` - Knowledge Garden references display with enriched metadata
  - `portfolio-simulator.js` - Interactive portfolio comparison tool
  - `portfolio-preview.js` - Landing page portfolio chart
  - `animations.js` - UI animations and effects
  - `floating-bubble.js` - Interactive bubble elements
- **`i18n/translations.js`** - Internationalization (French/English) - includes all portfolio simulator translations
- **`assets/`** - Static resources (styles, images)

### Key Integrations
- **Notion API** - Content management for waitlist, blog posts, and Knowledge Garden
- **OpenRouter API** - LLM provider with fallback model rotation (Gemini, GPT-4.1, Mistral, DeepSeek)
- **Freepik API** - Automated blog image generation with intelligent caching
- **Yahoo Finance API** - ETF historical data for portfolio simulator
- **Express Sessions** - Chat rate limiting (10 messages per session)

### Environment Configuration
The application requires several environment variables in `.env`:
- `NOTION_TOKEN` - Waitlist database access
- `NOTION_DATABASE_ID_WAITLIST` - Waitlist storage
- `NOTION_BLOG_API_KEY` & `NOTION_BLOG_DATABASE_ID` - Blog CMS
- `OPENROUTER_API_KEY` - AI chatbot functionality
- `FREEPIK_API_KEY` - Blog image generation
- `SESSION_SECRET` - Session security

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
- **Interactive AI chatbot** with streaming responses and glassmorphism floating input
- **Dynamic blog system** with bilingual content rendering
- **Portfolio Simulator** - Interactive comparison of 3 investment strategies with 20 years of real ETF data (SPY, IEF, GLD)
- **Unified button design** - All CTA buttons use pill-shaped design (border-radius: 50px) for consistent brand experience
  - Real-time strategy switching with prominent visual feedback
  - 6 performance metrics with educational tooltips
  - Time period selection (1Y, 3Y, 5Y, 10Y, 20Y)
  - Fully bilingual with dynamic chart label translation
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
- Context-aware responses about Bubble's mission and services
- Integrated rate limiting for abuse prevention

### Image Generation
- Freepik API integration with intelligent prompt generation
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

**Recent Updates** (2025-01-09):
- Fixed tile sizing on main page (clarity/automation tiles now fill properly)
- Updated portfolio preview title: "Discover Our Portfolio Optimization"
- CTA button text: "Try Our Simulator" (FR: "Essayez notre Simulateur")

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