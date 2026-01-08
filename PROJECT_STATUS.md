# Bubble Project – Current Status

**Last Updated**: 2026-01-08
**Version**: 2.2 – Bubble Playground UX improvements, multi-agent orchestration

---

## 📊 Project Health

| Metric | Status | Details |
|--------|--------|---------|
| **Backend** | ✅ Production Ready | Modular MVC architecture, 45-line entry server with dev routes gated behind `NODE_ENV` |
| **Frontend** | ✅ Production Ready | Vanilla JS + Chart.js v4, 32 HTML pages (16 FR + 16 EN) |
| **SEO** | ✅ Complete | GA4 tracking, sitemap (44+ URLs), hreflang, structured data, GDPR compliance |
| **Documentation** | ✅ Updated | CLAUDE.md, ARCHITECTURE.md, archive cleaned up |
| **Code Quality** | ✅ Excellent | Orphaned files archived, test routes protected, modular strategies |
| **Analytics** | ✅ Implemented | GA4 (G-T0MQEL0ZG0) on all 32 pages with event tracking |
| **Testing** | ⚠️ Manual Only | Manual endpoint verification; automated tests pending |

---

## 🎯 Core Features Status

1. **Multilingual Marketing Website**
   - 32 HTML pages: 16 French + 16 English
   - Page structure: `/investors/`, `/professionals/`, `/en/` locales
   - FR/EN toggle, Notion-backed lead capture, realtime validation

2. **Unified AI Chatbot**
   - SSE streaming with model fallback (Gemini Flash → GPT-4.1 Mini → Magistral Small → DeepSeek)
   - Page-context awareness (index, simulator, pricing, professionals), 10-message rate limiting
   - Glassmorphism UI + side panel chat component

3. **Portfolio Simulator v2.0**
   - Dataset: Daily prices 2005-2025 across SPY, IEF, GLD, EFA, EEM, VNQ, CASH
   - 9 server strategies: equalWeight, sixtyForty, simpleRP, hierarchicalRP, enhancedRiskParityDCC, optimizedRP, optimizedRiskBudgeting, regimeAwareRP, momentum
   - Client features: customMix, leverage toggle (1x/2x), CSV/PNG exports, GA4 events

4. **Google Analytics 4**
   - Measurement ID: `G-T0MQEL0ZG0`
   - Coverage: 100% (32 pages)
   - Events: CTA clicks, form submissions, simulator interactions, blog views
   - Privacy: GDPR/CNIL compliant with cookie consent integration

5. **SEO Infrastructure**
   - Sitemap: 44+ URLs with hreflang (FR/EN/x-default)
   - Structured data: 6 schema types (FinancialService, Organization, FAQPage, etc.)
   - Meta tags: 100% coverage
   - Blog: 7 articles with SSR and noscript fallback

6. **Content Systems**
   - Blog: Notion CMS, OpenAI image generation with persistent cache
   - Knowledge Garden: LLM enrichment, legal link generation

7. **Bubble Playground (Education Module)** ✨ NEW
   - Hub: `/investors/education` - Gateway with two learning paths
   - Arena: `/investors/education/arena` - 4 AI bots competing over 20 years
   - Simulator: `/investors/education/simulator` - Chat-driven strategy builder
   - Features: Onboarding awareness, chatbot-first UX, mobile-optimized
   - APIs: `window.simulatorBridge`, `window.arenaState` for chat-UI sync

---

## 📁 Project Structure

```
BubbleLaunch/
├── src/
│   ├── backend/
│   │   ├── server.js                # 45-line entrypoint
│   │   ├── routes/                  # API routes (dev routes gated)
│   │   ├── controllers/             # Business logic
│   │   ├── middleware/              # session, rate limiter, error handler
│   │   ├── services/                # Portfolio strategies, cache, Notion helpers
│   │   └── cache/                   # Simulator snapshots
│   └── frontend/
│       ├── pages/                   # 32 HTML pages
│       │   ├── investors/           # Retail investor pages (4 FR)
│       │   ├── professionals/       # B2B pages (4 FR)
│       │   └── en/                  # English locale mirror
│       ├── js/                      # 19 JS modules
│       │   └── seo/                 # GA4 events, cookie consent
│       ├── i18n/                    # FR/EN translations
│       └── assets/                  # Styles, icons
├── docs/
│   ├── seo/                         # SEO documentation (8 active files)
│   └── archive/                     # Historical summaries
├── archive/
│   ├── backend-backups/             # server.backup.js, server.old.js, riskBudgetingService.js
│   ├── frontend/                    # simulator-chat.js and legacy backups
│   ├── anim-main/                   # Marketing animation mirror
│   └── ...                          # experiments, data, scripts
└── scripts/                         # Utilities (business, deploy, portfolio)
```

---

## 🔧 Technical Stack

### Backend
- Node.js 18 + Express
- node-cron, express-session, axios
- Notion API (waitlist, blog, knowledge garden)
- OpenRouter API (LLM) with streaming SSE
- Yahoo Finance data fetcher
- OpenAI `gpt-image-1` for blog illustrations

### Frontend
- Vanilla JS modules, Chart.js 4.4.x
- Google Analytics 4 with custom events
- Responsive CSS (~3.8k lines)
- LocalStorage persistence
- i18n dictionary-driven (FR/EN)

### SEO & Analytics
- GA4 tracking (G-T0MQEL0ZG0)
- Dynamic sitemap generation
- Cookie consent (Tarteaucitron - CNIL compliant)
- Structured data (JSON-LD)

---

## 🆕 Recent Updates

### v2.2 (Jan 8, 2026)
- **Bubble Playground UX Overhaul** via multi-agent orchestration:
  - SimulatorAgent: Onboarding awareness, `window.simulatorBridge` API, metric tooltips, action-based suggestions
  - ArenaAgent: `window.arenaState` API, leaderboard animations, haptic feedback, arena-chat integration
  - AuditAgent: Comprehensive QA validation, documentation updates
- New JS APIs for chat-UI synchronization (`simulatorBridge`, `arenaState`)
- Mobile improvements: scroll-snap carousels, 44px touch targets, hidden hero on mobile
- Added ~400 lines of CSS for tooltips, animations, mobile layouts
- Updated `BUBBLE_PLAYGROUND_PROJECT.md`, `ai_trading_arena_education_plan.md`

### v2.1 (Nov 26, 2025)
- Archived orphaned files: `server.backup.js`, `server.old.js`, `riskBudgetingService.js`, `simulator-chat.js`
- Gated development routes behind `NODE_ENV !== "production"`
- Updated ARCHITECTURE.md and CLAUDE.md with current page/JS structure
- Created archive README documenting archived files

### v2.0.1 (Nov 23, 2025)
- Implemented GA4 tracking on all 32 pages
- Created `ga4-events.js` library with event tracking functions
- Integrated cookie consent with GA4
- SEO audit: verified 44+ sitemap URLs, removed 7 redundant docs
- Updated README-SEO.md with decision tree and status dashboard

### v2.0 (Nov 5, 2025)
- Modularized portfolio strategies (9 total)
- Added VNQ + CASH sleeves, leverage-aware API
- Built cron-driven cache regeneration
- Redesigned simulator UI with exports

---

## 🚀 Deployment Readiness

### ✅ Production-Ready
- Environment variable validation
- Session + rate limiting safeguards
- Dev routes protected (`NODE_ENV` gating)
- GA4 analytics with GDPR compliance
- SEO infrastructure complete
- Portfolio cache automation

### ⚠️ Outstanding
1. Submit sitemap to Google Search Console
2. Add automated test coverage (unit + integration)
3. Core Web Vitals optimization
4. Backlink strategy implementation

---

## 📈 SEO Metrics

| Component | Score | Status |
|-----------|-------|--------|
| Meta Tags | 100% | All 32 pages |
| Sitemap | 100% | 44+ URLs verified |
| GA4 Analytics | 100% | All pages tracked |
| Structured Data | 100% | 6 schemas |
| GDPR Compliance | 100% | Cookie consent |
| Bilingual Support | 100% | Hreflang implemented |
| **Overall** | **95/100** | Excellent |

---

## 📋 Key Configuration

| Item | Value |
|------|-------|
| GA4 Measurement ID | `G-T0MQEL0ZG0` |
| Production Domain | `bubbleinvest.org` |
| Sitemap URL | `/sitemap.xml` |
| Blog Articles | 7 published |
| HTML Pages | 32 total |
| JS Modules | 19 active |

---

**Maintainer**: Bubble Team
**Repository**: BubbleLaunch (Marketing Website)
