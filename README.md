# Bubble - AI-Powered Robo-Advisory Platform

**Democratizing investment through AI, with transparency and efficiency.**

---

## 🎯 Project Overview

Bubble is a fintech startup revolutionizing investment through AI-powered robo-advisory services. This repository contains the production-ready waitlist landing page with integrated AI chatbot, blog system, and interactive portfolio simulator.

### Key Features

- **Multilingual Support** (French/English) with seamless language switching
- **AI Chatbot** with streaming responses powered by OpenRouter LLM
- **Interactive Portfolio Simulator** - Compare 3 investment strategies with 20 years of real ETF data
- **Dynamic Blog System** with Notion CMS and AI-generated images (Freepik API)
- **Knowledge Garden** - Curated investment references with LLM enrichment
- **Glassmorphism UI** - Modern, transparent design with floating chat input
- **Unified Button Design** - Pill-shaped CTAs for consistent brand experience

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+ and npm
- Notion API access (for waitlist, blog, Knowledge Garden)
- OpenRouter API key (for AI chatbot)
- Freepik API key (for blog image generation)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd BubbleLaunch

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys (see Configuration section)

# Start development server
npm start
```

The application will be available at `http://localhost:3000`

---

## ⚙️ Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Notion Integration
NOTION_TOKEN=your_notion_integration_token
NOTION_DATABASE_ID_WAITLIST=your_waitlist_database_id
NOTION_BLOG_API_KEY=your_blog_api_key  # Also used for Knowledge Garden
NOTION_BLOG_DATABASE_ID=your_blog_database_id

# AI Services
OPENROUTER_API_KEY=your_openrouter_api_key
FREEPIK_API_KEY=your_freepik_api_key

# Session Security
SESSION_SECRET=your_random_session_secret
```

**Note:** The Knowledge Garden feature uses `NOTION_BLOG_API_KEY` (shared with blog). The Knowledge Garden database ID is hardcoded in `src/backend/services/knowledgeGardenService.js`.

---

## 📁 Project Structure

```
BubbleLaunch/
├── src/
│   ├── backend/                    # Node.js/Express backend (Modular MVC)
│   │   ├── server.js              # Application entry point (~35 lines)
│   │   ├── config/                # Environment & middleware configuration
│   │   ├── routes/                # API route definitions
│   │   ├── controllers/           # Business logic layer
│   │   ├── middleware/            # Custom middleware (session, rate limiting, errors)
│   │   └── services/              # External integrations & calculations
│   │       ├── blogService.js
│   │       ├── freepikService.js
│   │       ├── knowledgeGardenService.js
│   │       ├── llmEnrichmentService.js
│   │       ├── portfolioService.js
│   │       └── yahooFinanceService.js
│   │
│   └── frontend/                   # Vanilla JavaScript frontend
│       ├── pages/
│       │   ├── index.html         # Main landing page
│       │   ├── blog.html          # Blog listing
│       │   ├── blog-post.html     # Individual blog posts
│       │   ├── portfolio-simulator.html  # Portfolio comparison tool
│       │   ├── clear-cache.html   # Cache management
│       │   └── test-image-generation.html  # Image generation testing
│       ├── js/
│       │   ├── script.js          # Main app logic
│       │   ├── chatbot-logic.js   # AI chatbot with SSE
│       │   ├── chatbot-animations.js  # Message animations
│       │   ├── portfolio-simulator.js  # 20Y data, 3 strategies
│       │   ├── portfolio-preview.js    # Landing page chart
│       │   ├── charts.js          # Shared chart utilities
│       │   ├── floating-chat-input.js  # Glassmorphism floating input
│       │   ├── floating-bubble.js # Interactive bubble elements
│       │   ├── mini-chat.js       # Embedded chat widget
│       │   ├── animations.js      # UI animations
│       │   ├── blog.js            # Blog listing logic
│       │   ├── blog-post.js       # Blog post rendering
│       │   └── references.js      # Knowledge Garden display
│       ├── i18n/
│       │   └── translations.js    # FR/EN translations
│       └── assets/
│           ├── styles/
│           │   ├── styles.css     # Main stylesheet (~3770 lines)
│           │   ├── blog.css
│           │   ├── blog-post.css
│           │   └── references.css
│           └── images/
│
├── docs/                          # Project documentation
│   ├── PORTFOLIO_SIMULATOR.md     # Portfolio simulator docs
│   ├── ARCHITECTURE.md            # System architecture
│   ├── company/
│   │   └── Charte Graphique Bubble.md  # Brand design guidelines
│   └── technical/
│
├── CLAUDE.md                      # AI assistant guidance
├── package.json
└── README.md
```

---

## 🛠️ Tech Stack

### Backend
- **Node.js + Express** - Server framework
- **Notion API** - Headless CMS for blog & waitlist
- **OpenRouter** - LLM provider (GPT-4, Gemini, Claude, etc.)
- **Yahoo Finance API** - Historical ETF data for portfolio simulator
- **Freepik API** - AI image generation for blog articles

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **Chart.js 4.4.0** - Interactive portfolio charts
- **Inter Font (Google Fonts)** - Typography (weights 400-800)
- **Glassmorphism Design** - Modern UI with backdrop-filter effects

### Architecture
- **MVC Pattern** - Modular backend with routes/controllers/services separation
- **RESTful API** - Clean API endpoints for all features
- **Server-Sent Events (SSE)** - Streaming AI chatbot responses
- **Session Management** - Rate limiting for chat (10 messages/session)

---

## 📊 Key Features Details

### Portfolio Simulator
- **3 Investment Strategies**: Equal Weight, Risk Parity, Optimized (EWMA + Correlations)
- **3 Core ETFs**: SPY (S&P 500), IEF (Treasury Bonds), GLD (Gold)
- **20 Years** of historical data (2005-2025)
- **6 Performance Metrics**: Total Return, CAGR, Volatility, Sharpe Ratio, Max Drawdown, Calmar Ratio
- **Interactive Charts** with time period filtering (1Y, 3Y, 5Y, 10Y, 20Y)
- **Bilingual Support** with dynamic translation

### AI Chatbot
- **Streaming Responses** using Server-Sent Events (SSE)
- **Model Fallback System**:
  1. `google/gemini-2.0-flash-001` (primary)
  2. `openai/gpt-4.1-mini` (fallback)
  3. `mistralai/magistral-small-2506` (fallback)
  4. `deepseek/deepseek-r1-0528:free` (final fallback)
- **Rate Limiting**: 10 messages per session
- **Context-Aware**: Understands Bubble's mission and services
- **Glassmorphism Floating Input**: Appears on scroll with 15% opacity, 20px blur
- **Animations**: Message animations, typing indicators, smooth scroll behavior

### Blog System
- **Notion as CMS** - Content managed in Notion databases
- **Bilingual Content** - French (primary) + English
- **AI-Generated Images** - Automatic blog image creation with Freepik
- **Smart Caching** - Persistent image cache to avoid regeneration
- **SEO-Friendly** - Slug generation, meta tags, publication date validation

### Knowledge Garden
- **LLM Enrichment** - Automatic metadata generation for references
- **Legal Compliance** - Generates purchase links instead of sharing copyrighted PDFs
- **Cost-Optimized** - Uses cheapest models first (GPT-4o-mini → GPT-4o → Claude-3-Haiku)
- **Categorization** - By source type (Books, Articles, Papers, Websites)

---

## 🎨 Design System

All UI follows the brand guidelines in `docs/company/Charte Graphique Bubble.md`:

### Colors
- **Primary**: `#333333` (Dark Gray) - Buttons, titles
- **Hover**: `#444444` / `#6b7280` - Interactive states
- **Accent**: `#667eea` (Violet) - Charts, highlights
- **Background**: `#FFFFFF` (White) - Clean, transparent feel

### Typography
- **Font**: Inter (Google Fonts, weights 400-800)
- **H1**: 4rem, weight 800
- **Body**: 1rem, weight 400, line-height 1.6

### Button Design (Unified)
- **CTA Buttons**: Pill shape (border-radius: 50px)
- **Submit Buttons**: Circular (40px × 40px) with upward arrow icon
- **Glassmorphism Inputs**: 15% white opacity, 20px blur

---

## 📖 API Documentation

### Endpoints

#### Portfolio Simulator
- `GET /api/portfolio/preview-data` - Pre-calculated portfolio data (20 years)
- `GET /api/portfolio/etf-data` - Get ETF historical data with parameters
- `POST /api/portfolio/calculate` - Calculate portfolio optimization
- `POST /api/portfolio/clear-cache` - Clear portfolio cache (development)

#### Chat
- `POST /api/chat` - Stream AI chatbot responses (SSE)

#### Waitlist
- `POST /api/subscribe` - Submit waitlist form to Notion
- `POST /api/test-post` - Test POST endpoint (development)

#### Blog
- `GET /api/blog/posts` - Fetch all published blog posts
- `GET /api/blog/post/:slug` - Fetch single blog post by slug
- `GET /api/blog/test-freepik-connection` - Test Freepik API connectivity
- `POST /api/blog/test-image-generation` - Test image generation
- `POST /api/blog/clear-image-cache` - Clear Freepik cache
- `GET /api/blog/image-cache-stats` - Get cache statistics
- `POST /api/blog/regenerate-all-images` - Regenerate all images
- `POST /api/blog/regenerate-image/:slug` - Regenerate single image
- `POST /api/blog/generate-article-image` - Generate image for article

#### Knowledge Garden
- `GET /api/knowledge-garden/references` - Fetch enriched references
- `GET /api/knowledge-garden/references-by-source-type` - Group by type
- `GET /api/knowledge-garden/references-by-theme` - Group by category
- `GET /api/knowledge-garden/explore` - Database structure exploration
- `POST /api/knowledge-garden/clear-cache` - Clear enrichment cache

#### Pages
- `GET /` - Main landing page
- `GET /blog` - Blog listing page
- `GET /blog/:slug` - Individual blog post page
- `GET /portfolio-simulator` - Portfolio simulator page
- `GET /test-image` - Image generation test page
- `GET /clear-cache` - Cache management page

---

## 🧪 Testing

### Manual Testing Pages
- **Main Landing Page**: `http://localhost:3000/`
- **Portfolio Simulator**: `http://localhost:3000/portfolio-simulator`
- **Blog**: `http://localhost:3000/blog`
- **Image Cache Test**: `http://localhost:3000/test-image-generation`
- **Cache Clear**: `http://localhost:3000/clear-cache`

### Testing Checklist
- [ ] Waitlist form submission (check Notion database)
- [ ] AI chatbot responses (all 4 LLM models)
- [ ] Portfolio simulator strategy switching
- [ ] Blog post rendering (French & English)
- [ ] Knowledge Garden references loading
- [ ] Language toggle functionality
- [ ] Mobile responsive design
- [ ] Glassmorphism floating input (scroll behavior)

---

## 📝 Documentation

- **[CLAUDE.md](CLAUDE.md)** - AI assistant project guidance
- **[docs/PORTFOLIO_SIMULATOR.md](docs/PORTFOLIO_SIMULATOR.md)** - Portfolio simulator documentation
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture details
- **[docs/company/Charte Graphique Bubble.md](docs/company/Charte%20Graphique%20Bubble.md)** - Brand design guidelines
- **[simul-plan.md](simul-plan.md)** - Portfolio simulator implementation plan

---

## 🚢 Deployment

### Production Checklist
1. Set all environment variables in production environment
2. Ensure Notion databases are properly configured
3. Configure CORS for production domain
4. Set `SESSION_SECRET` to a strong random value
5. Enable HTTPS for secure session cookies
6. Configure CDN for static assets (optional)

### Environment-Specific Notes
- Development server runs on port 3000 by default
- Production deployment compatible with Docker (Dockerfile included)
- Static files served from `src/frontend/` directory

---

## 🤝 Contributing

This is a private project. For internal development:

1. Follow the existing code style (see `CLAUDE.md`)
2. Update documentation when adding features
3. Test all changes locally before committing
4. Use meaningful commit messages

---

## 📄 License

Private - All Rights Reserved

---

## 🔗 Links

- **Website**: [bubble.com](https://bubble.com) (when live)
- **Documentation**: See `docs/` directory
- **Design Guidelines**: `docs/company/Charte Graphique Bubble.md`

---

**Last Updated**: 2025-10-09
**Version**: 1.3 - Production-ready with glassmorphism UI and unified button design
