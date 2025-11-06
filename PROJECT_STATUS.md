# Bubble Project – Current Status

**Last Updated**: 2025-11-05  
**Version**: 2.0 – Portfolio overhaul, unified chatbot, automated cache lifecycle

---

## 📊 Project Health

| Metric | Status | Details |
|--------|--------|---------|
| **Backend** | ✅ Production Ready | Modular MVC architecture, 45-line entry server (`src/backend/server.js`) with cronified cache scheduler |
| **Frontend** | ✅ Production Ready | Vanilla JS + Chart.js v4 with responsive simulators and marketing pages |
| **Documentation** | ⚠️ Updating | Key refs (CLAUDE, architecture, simulator) refreshed; legacy plans under review |
| **Code Quality** | ✅ Excellent | Isolated strategy modules, service abstraction, console telemetry for schedulers |
| **Performance** | ✅ Optimized | Cached simulator snapshots, leverage-aware APIs, lazy assets, worker offloading (anim-main) |
| **Testing** | ⚠️ Manual Only | Manual endpoint verification; automated tests still pending |

---

## 🎯 Core Features Status

1. **Multilingual Waitlist Landing Page**
   - FR/EN toggle, Notion-backed lead capture, realtime validation

2. **Unified AI Chatbot**
   - SSE streaming with model fallback (Gemini Flash → GPT-4.1 Mini → Magistral Small → DeepSeek)
   - Page-context awareness (index, simulator, pricing, businesses), 10-message rate limiting
   - Glassmorphism UI + mini widget reuse across pages

3. **Portfolio Simulator v2.0**
   - Dataset: Daily prices 2005-2025 across SPY, IEF, GLD, EFA, EEM, VNQ, CASH
   - Strategies (server): equalWeight, sixtyForty, simpleRP, hierarchicalRP, enhancedRiskParityDCC, optimizedRP (Calmar mix), optimizedRiskBudgeting, regimeAwareRP, momentum
   - Strategies (client): customMix with persistent weights & CSV/PNG exports
   - Features: Leverage toggle (1x/2x), ETF visibility controls, Calmar ratio, GA4 instrumentation

4. **Automated Cache Lifecycle**
   - `src/backend/services/cacheScheduler.js` schedules regeneration (Sunday 02:00 UTC near month end)
   - Preview API surfaces `X-Cache-Age-Days` / `X-Cache-Status`; manual regen endpoint supported
   - `check-allocations.js` validates VNQ/CASH weights post-generation

5. **Content Systems**
   - Blog: Notion CMS, OpenAI image generation with persistent cache + Unsplash fallback
   - Knowledge Garden: LLM enrichment, legal link generation, cost-aware model rotation

6. **Operational Tooling**
   - Business contact API, sitemap route, bilingual businesses/pricing pages, responsive marketing assets

---

## 📁 Project Structure Snapshot

```
BubbleLaunch/
├── src/
│   ├── backend/
│   │   ├── server.js                # 45-line entrypoint + cache scheduler init
│   │   ├── routes/                  # chat, waitlist, blog, knowledge-garden, portfolio, business-contact, sitemap
│   │   ├── controllers/             # matching business logic modules
│   │   ├── middleware/              # session, rate limiter, error handler
│   │   ├── services/                # portfolio strategies, cache scheduler, Notion/blog helpers
│   │   └── cache/                   # simulator snapshots & metadata
│   └── frontend/
│       ├── pages/                   # Landing, simulator, pricing, businesses, blog, legal, etc.
│       ├── js/                      # Chatbot, simulator v2, portfolio preview, businesses UX, analytics
│       ├── i18n/                    # FR/EN translation dictionaries
│       └── assets/                  # Styles, icons, illustrations
├── docs/                            # Living documentation (architecture, simulator, strategy summary, SEO)
├── anim-main/                       # Marketing animation mirror (web worker powered)
├── scripts/                         # Utilities (portfolio cache generation, Notion sync, etc.)
└── check-allocations.js             # Cache validation helper
```

---

## 🔧 Technical Stack

### Backend
- Node.js 18 + Express
- node-cron (cache automation), express-session, axios
- Notion API (waitlist, blog, knowledge garden)
- OpenRouter API (LLM access) with streaming SSE
- Yahoo Finance data fetcher + local caching
- OpenAI `gpt-image-1` for blog illustrations

### Frontend
- Vanilla JS modules, Chart.js 4.4.x
- Responsive SCSS-like CSS (hand-authored, ~3.8k lines)
- LocalStorage persistence for simulator preferences & chat history
- i18n dictionary-driven text replacements (FR/EN)

### Supporting Services
- Portfolio strategy modules under `src/backend/services/strategies/*`
- Optimized mix search (Calmar objective) + risk budgeting numerical solvers
- Anim-main worker mirror for marketing assets

---

## 🆕 Recent Milestones (v2.0)

- Modularized portfolio strategies; introduced momentum, regime-aware RP, optimized mix
- Added VNQ + CASH sleeves, leverage-aware preview API, and Calmar ratio metrics
- Built cron-driven cache regeneration with metadata introspection and manual override endpoints
- Redesigned simulator UI with exports, ETF toggles, custom mix builder, mobile sliders
- Migrated chat controller to unified system prompt with page context; updated frontend logic accordingly
- Synced anim-main marketing worker with backend calculations

_For historical v1.4 responsive updates, see Git history (tag `v1.4-responsive`)._

---

## 🚀 Deployment Readiness

### ✅ Production-Ready
- Environment variable validation (`src/backend/config/env.js`)
- Session + rate limiting safeguards
- Portfolio cache automation & telemetry
- Blog image cache persistence + graceful shutdown hooks
- Static asset serving & gzip-friendly layout

### ⚠️ Outstanding Before Launch
1. Provision production environment variables (`OPENROUTER_API_KEY`, Notion IDs, cache secrets).
2. Harden `SESSION_SECRET` and enable HTTPS-only cookies behind TLS.
3. Decide storage strategy for large cache JSON (Git vs object storage).
4. Add automated test coverage (unit + integration) and hook into CI.
5. Document operational runbook (cache regeneration, Notion content workflows).

--- 
