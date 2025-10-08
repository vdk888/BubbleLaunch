# Bubble Architecture Documentation

## Overview

Bubble is a fintech application built with a **modular MVC architecture** featuring a Node.js/Express backend and vanilla JavaScript frontend. The application provides a multilingual waitlist landing page, AI chatbot, blog system, Knowledge Garden references, and portfolio simulator.

---

## Backend Architecture

### Directory Structure

```
src/backend/
├── server.js                    # Main application entry (35 lines)
├── config/
│   ├── env.js                   # Environment configuration & validation
│   └── express.js               # Middleware configuration
├── controllers/
│   ├── chat.controller.js       # AI chatbot logic
│   ├── waitlist.controller.js   # Waitlist subscription
│   ├── blog.controller.js       # Blog & image generation
│   ├── knowledge-garden.controller.js  # References management
│   └── portfolio.controller.js  # Portfolio simulator
├── routes/
│   ├── index.js                 # Route aggregator
│   ├── chat.routes.js           # Chat endpoints
│   ├── waitlist.routes.js       # Waitlist endpoints
│   ├── blog.routes.js           # Blog API endpoints
│   ├── knowledge-garden.routes.js  # References API
│   ├── portfolio.routes.js      # Portfolio simulator API
│   └── pages.routes.js          # HTML page serving
├── middleware/
│   ├── session.js               # Session configuration
│   ├── rate-limiter.js          # Chat rate limiting
│   └── error-handler.js         # Centralized error handling
├── services/
│   ├── blogService.js           # Notion blog CMS integration
│   ├── freepikService.js        # AI image generation
│   ├── knowledgeGardenService.js  # References with LLM enrichment
│   ├── llmEnrichmentService.js  # AI-powered metadata generation
│   ├── yahooFinanceService.js   # ETF historical data fetching
│   └── portfolioService.js      # Portfolio calculation algorithms
└── cache/
    ├── freepik-images.json      # Persistent image cache
    └── portfolio-preview-data.json  # Pre-calculated chart data
```

### Architecture Patterns

#### 1. **MVC (Model-View-Controller)**
- **Models**: Notion databases (via services)
- **Views**: Frontend HTML/JS
- **Controllers**: Business logic layer

#### 2. **Service Layer Pattern**
- Services handle external integrations (Notion, OpenRouter, Yahoo Finance)
- Controllers orchestrate services and handle HTTP logic
- Separation of concerns for testability

#### 3. **Route Aggregation**
- All routes mounted via central `routes/index.js`
- Clear separation: API routes (`/api/*`) vs Page routes (`/*`)

### Request Flow

```
Client Request
    ↓
Express Middleware (session, body-parser)
    ↓
Routes (route matching)
    ↓
Middleware (rate-limiting, validation)
    ↓
Controllers (business logic)
    ↓
Services (external APIs, calculations)
    ↓
Response (JSON API or HTML page)
```

---

## API Endpoints

### Waitlist
- `POST /subscribe` - Add to waitlist
- `POST /test-post` - Test endpoint

### Chat
- `POST /api/chat` - AI chatbot (rate-limited, streaming SSE)

### Blog
- `GET /api/blog/posts` - List all published posts
- `GET /api/blog/post/:slug` - Get single post
- `POST /api/blog/test-image-generation` - Test image generation
- `POST /api/blog/clear-image-cache` - Clear Freepik cache
- `GET /api/blog/image-cache-stats` - Cache statistics
- `POST /api/blog/regenerate-all-images` - Regenerate all images
- `POST /api/blog/regenerate-image/:slug` - Regenerate single image
- `POST /api/blog/generate-article-image` - Generate image for article

### Knowledge Garden
- `GET /api/knowledge-garden/references` - Get enriched references
- `GET /api/knowledge-garden/references-by-source-type` - Group by type
- `GET /api/knowledge-garden/references-by-theme` - Group by theme
- `GET /api/knowledge-garden/explore` - Database structure
- `POST /api/knowledge-garden/clear-cache` - Clear enrichment cache

### Portfolio Simulator
- `GET /api/portfolio/preview-data` - Pre-calculated chart data (cached)
- `GET /api/portfolio/etf-data?tickers=SPY,IEF,GLD&period=10` - Historical prices
- `POST /api/portfolio/calculate` - Calculate strategy on-demand
- `POST /api/portfolio/clear-cache` - Clear Yahoo Finance cache

### Pages
- `GET /` - Landing page
- `GET /blog` - Blog index
- `GET /blog/:slug` - Individual blog post
- `GET /test-image` - Image generation test page
- `GET /clear-cache` - Cache management page

---

## Frontend Architecture

### Directory Structure

```
src/frontend/
├── pages/
│   ├── index.html               # Landing page
│   ├── blog.html                # Blog listing
│   └── blog-post.html           # Individual post
├── js/
│   ├── script.js                # Main app logic
│   ├── chatbot-logic.js         # AI chat implementation
│   ├── blog.js                  # Blog listing
│   ├── blog-post.js             # Post rendering
│   ├── references.js            # Knowledge Garden display
│   ├── animations.js            # Scroll animations
│   ├── floating-bubble.js       # Interactive bubbles
│   ├── portfolio-preview.js     # (TODO) Animated chart snapshot
│   └── portfolio-simulator.js   # (TODO) Interactive simulator
├── i18n/
│   └── translations.js          # French/English translations
├── assets/
│   ├── styles/
│   │   ├── styles.css           # Main styles
│   │   ├── blog.css             # Blog styles
│   │   ├── blog-post.css        # Post styles
│   │   ├── references.css       # References styles
│   │   └── portfolio.css        # (TODO) Simulator styles
│   └── images/
│       ├── blog-icons/
│       └── slider-icons/
```

### Frontend Patterns

1. **Vanilla JavaScript** - No frameworks, lightweight and fast
2. **Modular Components** - Separate JS files for each feature
3. **Progressive Enhancement** - Works without JS, enhanced with it
4. **Intersection Observer** - Scroll-triggered animations
5. **Server-Sent Events (SSE)** - Streaming chat responses

---

## Key Integrations

### 1. Notion CMS
- **Waitlist Database**: Stores subscriber information
- **Blog Database**: Bilingual blog content (FR/EN)
- **Knowledge Garden**: Reference library with AI summaries

### 2. OpenRouter API
- **LLM Provider**: Multi-model fallback (Gemini, GPT-4.1, Mistral, DeepSeek)
- **Streaming Responses**: Server-Sent Events for real-time chat
- **Rate Limiting**: 10 messages per session

### 3. Freepik API
- **AI Image Generation**: Automated blog cover images
- **Persistent Caching**: Avoid regeneration
- **Fallback System**: Thematic Unsplash images

### 4. Yahoo Finance API
- **ETF Historical Data**: 10-year price history
- **In-Memory Caching**: 24-hour TTL
- **Rate Limiting**: 100ms delay between requests

---

## Portfolio Simulator

### Architecture

The portfolio simulator uses a **simplified version** of the anim-main React app, rebuilt with vanilla JS for integration into the main Bubble project.

### Data Flow

```
User visits /api/portfolio/preview-data
    ↓
Controller checks cache (portfolio-preview-data.json)
    ↓
If cache exists: Return cached data (< 50ms)
If cache missing: Generate data:
    ↓
    Yahoo Finance Service (fetch 10Y data for SPY, IEF, GLD)
    ↓
    Portfolio Service (calculate 3 strategies)
    ↓
    Save to cache
    ↓
Return data to client
```

### Strategies Implemented

1. **Equal Weight** (Baseline)
   - Simple 33.3% allocation
   - Quarterly rebalancing
   - ~180% total return (10Y)

2. **Simple Risk Parity**
   - Inverse volatility weighting
   - Monthly rebalancing
   - ~60-day rolling volatility

3. **Optimized Risk Parity** (Best Performance)
   - EWMA volatility (λ=0.94)
   - Correlation penalty adjustment
   - Monthly rebalancing
   - ~134% total return (10Y)

### Performance Metrics

- Total Return (%)
- Annualized Return (%)
- Volatility (annualized %)
- Sharpe Ratio (2% risk-free rate)
- Maximum Drawdown (%)

---

## Caching Strategy

### 1. **Freepik Images** (Persistent)
- **Location**: `cache/freepik-images.json`
- **TTL**: Permanent (manual clearing)
- **Size**: ~4 images currently
- **Strategy**: Save on graceful shutdown

### 2. **Yahoo Finance Data** (In-Memory)
- **Location**: Memory only
- **TTL**: 24 hours
- **Size**: 3 ETFs × 10 years daily data
- **Strategy**: Auto-refresh daily

### 3. **Portfolio Preview** (Static File)
- **Location**: `cache/portfolio-preview-data.json`
- **TTL**: Permanent (regenerate on demand)
- **Size**: 120 monthly data points
- **Strategy**: Generate once, serve forever

### 4. **LLM Enrichment** (In-Memory)
- **Location**: Memory only
- **TTL**: Session lifetime
- **Size**: ~50 references
- **Strategy**: On-demand enrichment

---

## Deployment

### Environment Variables

```bash
# Required
NOTION_TOKEN=secret_...
NOTION_DATABASE_ID_WAITLIST=...
OPENROUTER_API_KEY=...

# Optional
FREEPIK_API_KEY=...
SESSION_SECRET=...
PORT=3000
```

### Production Checklist

- [ ] Set `cookie.secure: true` in session config (HTTPS)
- [ ] Configure proper `SESSION_SECRET`
- [ ] Set up reverse proxy (nginx)
- [ ] Configure CORS for production domain
- [ ] Monitor Yahoo Finance API rate limits
- [ ] Set up logging (Winston/Morgan)
- [ ] Configure error tracking (Sentry)

---

## Development Workflow

### Starting the Server

```bash
npm start  # Runs on port 3000
```

### Testing Endpoints

```bash
# Waitlist
curl -X POST http://localhost:3000/subscribe -H "Content-Type: application/json" -d '{"name":"Test","email":"test@example.com","profile":"retail"}'

# Blog
curl http://localhost:3000/api/blog/posts

# Portfolio
curl http://localhost:3000/api/portfolio/preview-data
```

### Adding New Features

1. **Create Service** (if external integration needed)
2. **Create Controller** (business logic)
3. **Create Routes** (endpoint definitions)
4. **Update `routes/index.js`** (mount routes)
5. **Test endpoints**
6. **Update documentation**

---

## Performance Metrics

### Server Response Times
- Static pages: < 50ms
- Blog API: < 200ms
- Chat API: Streaming (SSE)
- Portfolio preview (cached): < 50ms
- Portfolio preview (uncached): ~10s (Yahoo Finance API)

### Optimization Techniques
1. **Route-level caching** for static data
2. **In-memory caching** for expensive computations
3. **Persistent file caching** for AI-generated images
4. **Lazy loading** for frontend assets
5. **Code splitting** by feature

---

## Security Considerations

1. **Rate Limiting**: Chat endpoint limited to 10 messages/session
2. **Session Management**: Secure cookie configuration
3. **Environment Variables**: Sensitive keys in `.env`
4. **CORS**: Will need configuration for production domain
5. **Input Validation**: Sanitize user inputs (waitlist, chat)
6. **API Key Rotation**: OpenRouter, Freepik, Notion keys

---

## Future Enhancements

### Short-term
- [ ] Add portfolio simulator frontend (animated snapshot + full page)
- [ ] Implement WebSocket for real-time chat updates
- [ ] Add user authentication system
- [ ] Create admin dashboard for content management

### Long-term
- [ ] Migrate to TypeScript for better type safety
- [ ] Add automated testing (Jest/Mocha)
- [ ] Implement GraphQL API layer
- [ ] Add real-time portfolio tracking
- [ ] Mobile app (React Native)

---

## Troubleshooting

### Server won't start
- Check `.env` file exists and has required variables
- Verify port 3000 is not already in use
- Check Node.js version (>= 18.0.0)

### API returns errors
- Check Notion API keys are valid
- Verify OpenRouter API key has credits
- Check Yahoo Finance API is accessible
- Review logs in console

### Caching issues
- Clear cache: `rm src/backend/cache/*.json`
- Restart server to reload in-memory cache
- Check file permissions on cache directory

---

**Last Updated**: October 2025
**Maintainer**: Bubble Team
**Version**: 2.0.0 (Modular Architecture)
