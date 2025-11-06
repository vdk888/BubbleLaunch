# Portfolio Enhancements Progress

## November 2025 Cycle Overview
- Backend strategies are now fully modular (`src/backend/services/strategies/*`) with momentum, regime-aware parity, and Calmar-optimized blends surfaced through `portfolioService.js`.
- Cache lifecycle is automated: `cacheScheduler.js` runs monthly refreshes, metadata is exposed in API headers, and `check-allocations.js` verifies VNQ/CASH coverage after each regeneration.
- Frontend simulator received a complete UX overhaul with multi-strategy selection, ETF overlays, leverage toggle, custom mix builder, and export toolkit (JS/HTML/CSS stack).
- Anim-main mirror stays in sync via the new worker pipeline (`public/portfolioWorker.js`, `portfolioWorkerService.js`, updated components).
- Landing page preview and API endpoints now support leverage-aware snapshots and expanded metric sets.

## Delivery Breakdown
### Backend
- Ported anim-main strategy implementations into dedicated modules and rewrote `portfolioService.js` as an orchestrator.
- Added `strategies/momentum.js`, `strategies/regimeAwareRiskParity.js`, and `strategies/optimizedMix.js` to broaden the catalogue.
- Introduced `portfolioHelpers.js` for shared math, normalized return structures, and Calmar metric computation.
- Expanded cache content (allocations, metrics, metadata) and added VNQ + CASH tickers across the stack.
- Created `cacheScheduler.js` for cron-triggered regenerations; manual hooks exposed via `POST /api/portfolio/regenerate-cache`.

### Frontend
- Reworked `src/frontend/js/portfolio-simulator.js` to manage strategy visibility, ETF toggles, leverage pills, GA4 events, and exports.
- Updated `portfolio-simulator.html` and `styles.css` with new layout, sliders, tooltips, and custom mix drawer.
- Extended translations (`src/frontend/i18n/translations.js`) for all new strategy labels and UI copy.
- Synced landing preview (`portfolio-preview.js`) with new API payloads, including leverage-aware data.

### Anim-main / Marketing
- Added `public/portfolioWorker.js` and `src/services/portfolioWorkerService.js` to offload heavy calculations.
- Updated `PerformanceMetrics.js` and `StepByStepAnalysis.js` to render worker responses that mirror backend metrics.
- Introduced supporting CSS for the richer storytelling and performance widgets.

### QA & Operations
- New `check-allocations.js` script validates regenerated caches (weights sum, VNQ presence).
- API now returns cache age/status headers; leverage defaults to 1× with validation for 2× requests.
- Manual workflow documented: `npm run generate:portfolio-cache` followed by `node check-allocations.js`.

## Timeline (Key Commits Reviewed)
| Commit | Area | Summary |
|--------|------|---------|
| `f62e5a5` | Backend | Ported strategy modules, added `portfolioHelpers.js`, documented integration. |
| `0347c36` | Backend | Introduced regime detection + regime-aware risk parity strategy. |
| `1cd689d` | Backend/Frontend | Added momentum strategy, translations, and UI binding. |
| `2cf081f` | Backend | Implemented Calmar-optimized mix search and refreshed caches. |
| `de73af5` | Frontend | Major simulator UX overhaul with exports, sliders, and leverage toggle. |
| `1637824` | Anim-main | Added worker pipeline and synced marketing components. |
| `163cc23` | Data | Regenerated caches with VNQ + CASH, added `check-allocations.js`. |
| `f859f82` | API | Leverage-aware preview responses with cache metadata headers. |

## Next Steps
1. Wire `dynamicCorrelations.js` into the enhanced risk parity (DCC) path end-to-end.
2. Extend `POST /api/portfolio/calculate` to the full strategy set or deprecate the legacy endpoint.
3. Automate allocation validation within CI to avoid manual checks after cache rebuilds.
4. Evaluate external storage for cache artifacts to reduce Git diff size.

_Last updated: 2025-11-05_
