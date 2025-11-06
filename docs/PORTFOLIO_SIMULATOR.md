# Portfolio Simulator Documentation

## November 2025 Update at a Glance
- Leverage-aware preview API, cache metadata, and cron-based regeneration now live (`src/backend/controllers/portfolio.controller.js`, `src/backend/services/cacheScheduler.js`).
- Strategy suite rebuilt as modular Node services with momentum, regime-aware parity, and optimized mix support (`src/backend/services/strategies/*`).
- Simulator UI redesigned with multi-strategy toggles, ETF visibility controls, Calmar metrics, exports, and persistent custom mixes (`src/frontend/js/portfolio-simulator.js` plus associated HTML/CSS).
- Asset universe expanded to include VNQ (REITs) and a synthetic cash sleeve; caches refreshed with the wider coverage.
- Anim-main mirror (now under `archive/anim-main/`) gains a dedicated worker pipeline so the marketing animation stays in sync with backend logic.

## Snapshot of Current Capabilities
- 20-year default backtest with switchable 1/3/5/10/20-year snapshots served from cached JSON.
- Nine server-side strategies plus a client-side blend rendered simultaneously on chart and metrics.
- Optional 2× leverage overlay applied server-side with borrowing cost adjustments.
- Downloadable PNG chart and CSV metrics, localized for FR/EN audiences.
- Persisted user preferences for strategy visibility, ETF overlays, leverage, and custom mix weights.

## Recent Commit Highlights (24 commits reviewed)
| Commit | Scope | Summary |
|--------|-------|---------|
| `f859f82` | API | Added leverage parameter handling, cache validation headers, and consistent allocation payloads in `getPreviewData`. |
| `1240831` | Frontend Preview | Updated `src/frontend/js/portfolio-preview.js` to request leverage-aware snapshots and surface the expanded metrics. |
| `163cc23` | Data Refresh | Regenerated caches with VNQ + CASH coverage, introduced `check-allocations.js`, and hardened optimized mix inputs. |
| `91082c7` | Controller & Optimizer | Surfaced optimized mix calculations through the API and improved controller telemetry/error handling. |
| `7061f8f` | Cache Maintenance | Flushed stale snapshot files ahead of the optimized mix regeneration cycle. |
| `2cf081f` | Optimized Mix | Added exhaustive Calmar-optimized blending in `strategies/optimizedMix.js` and wired it through cache builder + HTML. |
| `de73af5` | Simulator UX | Major pass on `portfolio-simulator.js/html/css` adding sliders, exports, tooltips, and leverage toggles. |
| `6089bbf` | Momentum Tuning | Refined momentum strategy weights and synced translations/metrics with refreshed caches. |
| `1cd689d` | New Strategy | Introduced daily momentum backend module, translations, and UI hooks. |
| `0347c36` | Regime Engine | Added `regimeDetection.js`, `regimeAwareRiskParity.js`, and wired translations/strategy config. |
| `f62e5a5` | Modularization | Ported anim-main strategies into dedicated files, created `portfolioHelpers.js`, and documented the integration. |
| `1637824` | Anim-main Worker | Added `portfolioWorker.js` and companion services so marketing animations share the same math. |

## Architecture Overview
### Backend Data Pipeline
- `src/backend/services/yahooFinanceService.js` fetches and memoizes ETF price history (daily resolution, ~20-year horizon).
- `src/backend/services/portfolioService.js` orchestrates strategy modules, normalizes return formats, computes metrics, and provides leverage helpers.
- `src/backend/services/portfolioCacheService.js` generates `portfolio-preview-data.json` (20-year default) and `portfolio-preview-periods.json` (1/3/5/10/20-year slices) with per-strategy allocations and metrics.
- `src/backend/services/cacheScheduler.js` triggers regeneration every Sunday at 02:00 UTC when within seven days of month end and exposes `triggerCacheRegeneration()` for manual calls.
- `scripts/generate-portfolio-cache.js` remains the manual entry point (`npm run generate:portfolio-cache`).

### API Layer (`src/backend/controllers/portfolio.controller.js`)
- `GET /api/portfolio/preview-data` returns cached chart/metric payloads with optional `period` (years) and `leverage` (1 or 2); sets `X-Cache-Age-Days` and `X-Cache-Status`.
- `GET /api/portfolio/etf-data` exposes normalized ETF price series for the simulator.
- `POST /api/portfolio/calculate` supports ad-hoc calculations (equal, simple RP, optimized RP) returning `{ portfolio, allocations, metrics }`.
- `POST /api/portfolio/clear-cache` and `POST /api/portfolio/regenerate-cache` wrap cache maintenance with optional bearer token protection.

### Frontend Experience
- `src/frontend/js/portfolio-simulator.js` drives Chart.js 4 rendering, multi-strategy visibility, leverage state, custom mix persistence (`bubbleCustomStrategy`), ETF overlays, analytics, and export buttons.
- `src/frontend/pages/portfolio-simulator.html` houses strategy pills, ETF toggles, leverage switch, metric cards (Sharpe + Calmar), and localized tooltips (`src/frontend/i18n/translations.js`).
- Styles in `src/frontend/assets/styles/styles.css` handle responsive sliders, pill states, warnings, and export section layout.
- Landing-page preview (`src/frontend/js/portfolio-preview.js`) now mirrors backend metrics and respects leverage parameter.

### Anim-main Mirror (`archive/anim-main/`)
- `public/portfolioWorker.js` offloads heavy calculations to a Web Worker shared by `src/services/portfolioWorkerService.js`.
- `src/services/portfolioCalculations.js` and `performanceMetrics.js` sync math with backend strategy modules.
- `src/components/PerformanceMetrics.js` and `StepByStepAnalysis.js` render worker output so marketing sequences reflect live strategy definitions.

## Strategy Catalogue (Server-side)
| Strategy Key | User-Facing Label | Module | Notes |
|--------------|------------------|--------|-------|
| `equalWeight` | Allocation Égale | `strategies/equalWeight.js` | Equal-weighted baseline across all assets. |
| `sixtyForty` | Portefeuille 60/40 | `strategies/sixtyForty.js` | Classic SPY/IEF 60/40 allocation. |
| `simpleRP` | Risk Parity Simple | `strategies/simpleRiskParity.js` | Inverse-volatility weights with monthly rebalancing. |
| `hierarchicalRiskParity` | Risk Parity Hiérarchique | `strategies/hierarchicalRiskParityPortfolio.js` | Correlation clustering + risk parity allocations. |
| `optimizedRP` | ✨ Optimisé | `portfolioService.calculateOptimizedRiskParity` | Calmar-optimized blend of base strategies via `findOptimalMix`. |
| `optimizedRiskBudgeting` | Répartition de Risque Optimisée | `strategies/optimizedRiskBudgeting.js` | Numerical risk budgeting (CCD + gradient descent). |
| `enhancedRiskParityDCC` | Risk Parity DCC | `strategies/enhancedRiskParity.js` | EWMA volatility and correlation-penalized weights (DCC ready). |
| `momentum` | Momentum Tilt | `strategies/momentum.js` | 12-month momentum weighting with drawdown-aware overlays. |
| `regimeAwareRP` | RP Adaptatif | `strategies/regimeAwareRiskParity.js` | Adjusts leverage/rebalance via `regimeDetection.js`. |
| `customMix` | Mix Personnalisé (client) | Frontend only | LocalStorage-backed blend of visible strategies. |

> All server strategies return `{ portfolio: [{ date, value }], allocations: [{ date, SPY, IEF, GLD, EFA, EEM, VNQ, CASH }] }`.

## Asset Universe
- **SPY** – US equities
- **IEF** – US 7–10Y Treasuries
- **GLD** – Gold
- **EFA** – Developed ex-US equities
- **EEM** – Emerging markets equities
- **VNQ** – US REITs (new in this cycle)
- **CASH** – Synthetic 2 % risk-free sleeve used for rebalancing and leverage adjustments

## Data Pipeline & Cache Lifecycle
1. `generateSnapshots()` pulls raw prices via Yahoo Finance, normalizes them, and runs every strategy, capturing allocations.
2. Metrics (total/annual return, volatility, Sharpe, Calmar, max drawdown) are computed through `portfolioService.calculateMetrics`.
3. Results populate `portfolio-preview-data.json`, `portfolio-preview-periods.json`, and `cache-metadata.json` (`lastGenerated`, `ttlDays`, `nextScheduled`, strategy coverage).
4. `cacheScheduler.initialize()` (invoked from `src/backend/server.js`) checks cache freshness on boot and schedules monthly regeneration; `triggerCacheRegeneration()` can be called manually or via API.
5. `scripts/portfolio/check-allocations.js` inspects the 20-year snapshot to confirm allocations sum to ≈1.0 and that VNQ is present for every strategy.

**Manual refresh workflow**
```bash
npm run generate:portfolio-cache              # Recompute local cache snapshots
node scripts/portfolio/check-allocations.js   # Sanity-check allocations and ETF coverage
```

## Frontend Features & Persistence
- **Strategy visibility:** Toggle multiple lines; `visibleStrategies` + `prominentStrategy` tracked in-memory.
- **ETF toggles:** Stored under `bubbleSimulatorEtfVisibility`; defaults show all tickers.
- **Leverage pills:** Switch between 1× and 2×; server applies borrowing cost adjustments.
- **Metrics grid:** Shows absolute values and deltas vs baseline (`equalWeight`), including Calmar ratio.
- **Exports:** Guarded by `FEATURE_FLAGS.exports`; downloads PNG (`toBase64Image`) and CSV metrics.
- **Custom mix drawer:** Multi-strategy builder storing `{ key, weight }` arrays backed by translation keys.
- **Responsive sliders & tooltips:** `SLIDER_CONFIGS` / `initMobileSliders` manage horizontal scrolling and mobile overlays.

## Adding or Updating a Strategy (End-to-End)
1. **Backend module**: Implement under `src/backend/services/strategies/` returning `{ portfolio, allocations }`; reuse helpers from `portfolioHelpers.js` as needed.
2. **Register in orchestrator**: Import in `src/backend/services/portfolioService.js`, export a wrapper that normalizes the return shape, and (if cached) add to `STRATEGY_BUILDERS` in `portfolioCacheService.js`.
3. **Translations**: Add `simulator.strategy.<key>` entries to `src/frontend/i18n/translations.js` for FR/EN.
4. **Frontend config**: Extend `STRATEGY_CONFIG` in `src/frontend/js/portfolio-simulator.js` (set `labelKey`, `dataKey`, color, order, `isBest` if needed).
5. **HTML pill**: Add a `data-strategy="<key>"` button in `src/frontend/pages/portfolio-simulator.html` with tooltip copy.
6. **Cache refresh**: Run `npm run generate:portfolio-cache` and re-run `node scripts/portfolio/check-allocations.js`.
7. **Preview sync**: Commit refreshed cache files (`portfolio-preview-*.json`, `cache-metadata.json`).
8. **Analytics**: If required, extend GA4 payloads in `trackSimulatorEvent`.

## QA & Monitoring Checklist
- Verify `GET /api/portfolio/preview-data?leverage=2&period=10` returns `leverage: 2`, allocations including VNQ, and `X-Cache-Age-Days < 31`.
- Ensure custom mix CSV exports include a `strategy=customMix` row with blended metrics.
- Confirm Calmar ratio calculations display correctly in both FR/EN and mobile layouts.
- Use Chrome dev tools to watch `portfolioWorker.js` in `archive/anim-main/` and ensure worker responses match backend strategy totals.

## Open Follow-Ups
- Port the enhanced-risk-parity DCC variant to consume `dynamicCorrelations.js` outputs end-to-end (currently placeholder math inside module).
- Extend `POST /api/portfolio/calculate` to embrace the newer strategy set or mark it as legacy in UI copy.
- Automate allocation sanity checks (`scripts/portfolio/check-allocations.js`) within CI once test scaffolding exists.
- Evaluate storing cache artifacts outside Git to reduce extremely large diffs on each regeneration.

_Last updated: 2025-11-05_
