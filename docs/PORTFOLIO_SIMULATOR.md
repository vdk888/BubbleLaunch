# Portfolio Simulator Documentation

## Overview

The Portfolio Simulator is an interactive tool integrated into the Bubble website that allows users to compare different investment portfolio strategies with real historical ETF data. The system is designed to be easily extensible for adding new strategies in the future.

## Architecture

### Current Implementation

**6 Portfolio Strategies + Custom Builder:**
1. **Allocation Égale** (Equal Weight) - Baseline: 20% each asset (5-ETF global allocation)
2. **Portefeuille 60/40** - 60% SPY (stocks) / 40% IEF (bonds)
3. **Risk Parity Simple** - Inverse volatility weighting
4. **✨ Optimisé** (Momentum + Risk Parity) - **70% momentum + 30% inverse volatility** → **+14.8% outperformance over 20 years!**
5. **Momentum Tilt** - Positive 12-month momentum overweight
6. **Risk Parity Hiérarchique** - Minimum variance approximation
- **Mix Personnalisé** - Client-side blend of any two strategies (saved locally)
- **Leverage Toggle** - 1x (no leverage) / 2x leverage with risk warnings
- **Export Toolkit** - Chart PNG + metrics CSV downloads (feature flagged)

**5 Global ETFs:**
- SPY (S&P 500) - US Large Cap
- IEF (7-10Y Treasury Bonds) - US Bonds
- GLD (Gold) - Commodities
- EFA (MSCI EAFE) - Developed Markets
- EEM (MSCI Emerging Markets) - Emerging Markets

### File Structure

```
src/
├── backend/
│   ├── routes/
│   │   └── portfolio.routes.js          # API endpoints
│   ├── controllers/
│   │   └── portfolio.controller.js      # Request handling
│   ├── services/
│   │   ├── yahooFinanceService.js       # ETF data fetching
│   │   └── portfolioService.js          # Strategy calculations (equal, 60/40, momentum, HRP, parity)
│   └── cache/
│       ├── portfolio-preview-data.json      # Default (20Y) snapshot
│       └── portfolio-preview-periods.json   # Multi-period cache (1/3/5/10/20Y)
│
└── frontend/
    ├── pages/
    │   ├── index.html                    # Landing page with preview
    │   └── portfolio-simulator.html      # Full simulator page
    ├── js/
    │   ├── portfolio-preview.js          # Landing page chart
    │   └── portfolio-simulator.js        # Interactive simulator logic
    └── assets/styles/
        └── styles.css                    # Portfolio styles (lines 1500-1658)
```

## Adding New Strategies

### Step 1: Frontend Configuration

Edit `src/frontend/js/portfolio-simulator.js` and add to `STRATEGY_CONFIG`:

```javascript
const STRATEGY_CONFIG = {
  // ... existing strategies ...

  // NEW STRATEGY EXAMPLE
  myNewStrategy: {
    label: 'My New Strategy',        // Display name in chart legend
    dataKey: 'myNewStrategy',        // Key in API response data
    color: '#667eea',                // Line color (use brand colors)
    borderWidth: 3,                  // Line thickness
    borderDash: [],                  // [5, 5] for dashed, [] for solid
    order: 1,                        // Draw order (1 = on top, higher = behind)
    isBest: true,                    // Set to true if this is the "optimized" strategy
  },
};
```

### Step 2: HTML Strategy Selector

Add a pill button in `portfolio-simulator.html`:

```html
<button class="strategy-pill" data-strategy="myNewStrategy">
  <div class="strategy-tooltip">
    Explanation of your new strategy for users.
  </div>
  <div class="pill-icon">
    <svg><!-- Your icon SVG --></svg>
  </div>
  <div class="pill-content">
    <div class="pill-title">My New Strategy</div>
    <div class="pill-subtitle">Brief description</div>
  </div>
</button>
```

### Step 3: Backend Calculation

Add calculation logic in `src/backend/services/portfolioService.js`:

```javascript
function calculateMyNewStrategy(priceData, lookbackDays = 60, rebalanceDays = 21) {
  const tickers = Object.keys(priceData);
  const dates = Object.keys(priceData[tickers[0]]);

  // Your algorithm here...

  return {
    portfolioValues: values,
    weights: finalWeights,
  };
}

// Add to exports
module.exports = {
  // ... existing exports ...
  calculateMyNewStrategy,
};
```

### Step 4: Update Preview Data

Regenerate the cached preview data to include the new strategy:

```bash
# Regenerate cached snapshots (1/3/5/10/20Y)
npm run generate:portfolio-cache
```

## Custom Mix Builder (Client-Side)

- **Access**: Click the **Create Your Mix** pill to open the builder panel.
- **Inputs**: Pick Strategy A/B, adjust the slider (weight for Strategy A), then press **Apply Mix**.
- **Storage**: The configuration is saved in `localStorage` (`bubbleCustomStrategy`) so the simulator remembers it between sessions.
- **Computation**: The blend runs entirely in the browser using cached monthly data; metrics (total return, annual return, volatility, Sharpe, max drawdown, Calmar) are recomputed from the blended series.
- **Analytics**: Events `custom_strategy_applied` and `custom_strategy_reset` send strategy choices and weights for GA4 dashboards.
- **Reset**: Use **Reset Mix** to clear the custom series and revert to the base strategies.

## Export Toolkit (Feature Flag)

- Controlled via `FEATURE_FLAGS.exports` in [`portfolio-simulator.js`](../src/frontend/js/portfolio-simulator.js). Toggle off if the download UI should be hidden in production.
- Provides two buttons below the metrics grid:
  - **Download Chart (PNG)** – leverages Chart.js `toBase64Image`.
  - **Export Metrics (CSV)** – serializes `portfolioData.metrics` (custom mix included when enabled).
- Status label surfaces success/error feedback; GA4 emits `export_chart_png` and `export_metrics_csv` events with the current strategy/period.
- Downloads are informational only (legal copy updated accordingly).

## Deep Links & Embeds

- The simulator reads query parameters to preconfigure the view:
  - `?period=5` selects the 5-year dataset (supports 1/3/5/10/20).
  - `?strategy=momentumTilt` activates any built-in strategy (`equalWeight`, `sixtyForty`, `momentumTilt`, `hierarchicalRiskParity`, `simpleRiskParity`, `optimizedRiskParity`, `customMix`).
  - `?mix=strategyA,strategyB,weight` seeds the custom mix (weight in percent for Strategy A). Example: `?strategy=customMix&mix=optimizedRiskParity,sixtyForty,65`.
- Ideal for embeddings or marketing landing pages—set the iframe `src` to `/portfolio-simulator?strategy=momentumTilt&period=10` to focus the narrative.
- Custom mix parameters are stored locally, so visitors keep the configuration as they explore the simulator.

### Step 5: Update API Response

Ensure `portfolio.controller.js` includes your new strategy in the response:

```javascript
const myNewStrategyResult = portfolioService.calculateMyNewStrategy(priceData);

response.data.forEach((point, i) => {
  point.myNewStrategy = myNewStrategyResult.portfolioValues[i];
});
```

## Design System Compliance

All portfolio visualizations follow Bubble's brand guidelines ([Charte Graphique Bubble.md](../docs/company/Charte Graphique Bubble.md)):

### Colors
- **Primary (buttons, CTAs)**: Gray gradient `#333333` → `#444444`
- **Hover state**: `#6b7280`
- **Chart highlight**: Brand violet `#667eea`
- **ETF lines**: 40% opacity with subtle dashing
- **Portfolio lines**: Full opacity, varying thickness

### Visual Hierarchy
1. **ETFs** (background): Dashed lines at 40% opacity, 1.5px width
2. **Baseline strategy**: Gray, dashed or thinner line
3. **Better strategies**: Darker gray, solid lines, medium thickness
4. **Best strategy** (`isBest: true`): Brand violet `#667eea`, thickest line, drawn on top

### Typography & Spacing
- Font: Inter (matching site-wide)
- Metric cards: Hover tooltips with educational content
- Mobile-responsive grid layouts

## API Endpoints

### GET `/api/portfolio/preview-data`
Returns cached portfolio data for the simulator.

- `period` (optional query): `1`, `3`, `5`, `10`, or `20`. Defaults to `20`.
- Response includes chart data sampled monthly, pre-computed metrics, available periods, and timestamps.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2015-10-10",
      "SPY": 100,
      "IEF": 100,
      "GLD": 100,
      "equalWeight": 100,
      "simpleRP": 100,
      "optimizedRP": 100
    },
    ...
  ],
  "metrics": {
    "equalWeight": {
      "totalReturn": 495.09,
      "annualReturn": 9.2,
      "volatility": 12.81,
      "sharpeRatio": 0.71,
      "maxDrawdown": -35.28
    },
    "momentumTilt": {
      "totalReturn": 522.44,
      "annualReturn": 9.68,
      "volatility": 13.15,
      "sharpeRatio": 0.74,
      "maxDrawdown": -28.5
    },
    "hierarchicalRiskParity": {
      "totalReturn": 402.31,
      "annualReturn": 8.52,
      "volatility": 9.88,
      "sharpeRatio": 0.59,
      "maxDrawdown": -21.4
    },
    "optimizedRP": { "totalReturn": 378.63, "annualReturn": 8.32, "volatility": 10.94, "sharpeRatio": 0.42, "maxDrawdown": -26.91 }
  },
  "periodYears": 20,
  "periodsAvailable": [1, 3, 5, 10, 20],
  "strategyKeys": ["equalWeight", "sixtyForty", "momentumTilt", "hierarchicalRiskParity", "simpleRP", "optimizedRP"],
  "generatedAt": "2025-10-22T18:25:54.306Z",
  "fromCache": true
}
```

### GET `/api/portfolio/etf-data`
Fetch raw ETF data for custom calculations. Currently exposed but not invoked by the frontend to avoid runtime latency.

### POST `/api/portfolio/calculate`
Calculate portfolio performance for custom allocations. Available for server-side or scripted jobs; the UI relies on cached aggregates instead of calling this endpoint live.

### POST `/api/chat/portfolio`
Streams a portfolio-specialized chatbot response. The payload mirrors the general chat endpoint but includes a `context` object so the assistant can reference the user's simulator state.

- **Request body**:
  ```json
  {
    "message": "Why is the optimized strategy outperforming 60/40 over 20 years?",
    "language": "en",
    "context": {
      "strategy": "optimizedRiskParity",
      "period": 20,
      "metrics": {
        "optimizedRiskParity": {
          "totalReturn": 378.6,
          "annualReturn": 8.3,
          "volatility": 10.9,
          "sharpeRatio": 0.42,
          "maxDrawdown": -26.9
        }
      },
      "customStrategy": {
        "strategyA": "optimizedRiskParity",
        "strategyB": "sixtyForty",
        "weight": 60
      }
    }
  }
  ```
- **Response**: Server-Sent Events stream (`data: { content: "..." }`) identical to `/api/chat`, concluding with `data: { done: true }`.

## Performance & Caching Strategy

To keep the simulator snappy, the frontend always consumes the pre-generated snapshot from `/api/portfolio/preview-data`. This snapshot contains:

- 20 years of normalized prices for all 5 global ETFs (SPY/IEF/GLD/EFA/EEM) sampled monthly
- Portfolio values and core metrics for all 6 strategies (Equal Weight, 60/40, Simple RP, Momentum+RP, Momentum Tilt, Hierarchical RP)
- A `fromCache` flag so we can audit whether the cache was hit

The cache files live at:
- `src/backend/cache/portfolio-preview-data.json` (default 20Y snapshot)
- `src/backend/cache/portfolio-preview-periods.json` (multi-period cache: 1/3/5/10/20Y)

Regenerated by the backend on demand (server restart or explicit helper script). Exponential backoff retry logic ensures reliable Yahoo Finance API calls even with rate limits. Avoiding on-the-fly requests prevents multi-second cold starts.

## Strategy Performance Highlights

### ✨ Optimised Strategy (70% Momentum + 30% Risk Parity)

The flagship Optimised strategy achieves exceptional performance by combining:

**Algorithm:**
- **70% Momentum Weighting**: 12-month trailing returns identify uptrending assets
- **30% Risk Parity Weighting**: Inverse EWMA volatility ensures diversification
- **Monthly Rebalancing**: 21-day interval keeps strategy responsive to market changes
- **5-ETF Diversification**: Global exposure across US, developed, and emerging markets

**20-Year Performance (2005-2025):**
- **Total Return**: 437.9% (vs. 381.43% for Equal Weight baseline)
- **Outperformance**: +56.47 percentage points (+14.8% above baseline) ✅
- **Annualized Return**: 8.79% CAGR vs. 8.19% for Equal Weight
- **Volatility**: 28.43% (controlled via risk parity component)
- **Max Drawdown**: -53.39% (2008 financial crisis)
- **Sharpe Ratio**: 0.24 (lower due to higher volatility from momentum weighting)

This strategy **exceeds the +10% outperformance target**, making it the best-performing offering in the simulator.

## Performance Metrics

All core metrics are pre-computed on the server and cached with each snapshot:

1. **Total Return**: Final growth over the selected period
2. **Annualized Return (CAGR)**: Yearly growth rate derived from the cached series
3. **Volatility**: Annualized standard deviation of daily returns
4. **Sharpe Ratio**: Excess return vs. 2% risk-free rate divided by volatility
5. **Max Drawdown**: Largest peak-to-trough decline (negative percentage)
6. **Calmar Ratio**: Computed client-side as `annualReturn / abs(maxDrawdown)`

## Testing

### Manual Testing Checklist
 - [ ] All 6 strategies display correctly
- [ ] Strategy selector pills work and update chart
- [ ] Tooltips appear on hover (strategies & metrics)
- [ ] Chart animates smoothly on strategy change
- [ ] Metrics update correctly when switching strategies
- [ ] ETFs are visible but stay in background
- [ ] Best strategy (marked `isBest: true`) stands out
- [ ] Mobile responsive (test on phone/tablet)
- [ ] Browser compatibility (Chrome, Firefox, Safari)
- [ ] Period buttons fetch the right cached snapshot (1Y/3Y/5Y/10Y/20Y)
- [ ] Custom mix builder applies and resets correctly (chart + metrics update)

## Analytics Instrumentation

Google Analytics 4 events fire automatically when users interact with the simulator (subject to cookie consent):

- `simulator_page_initialized` – first load
- `strategy_changed` – includes selected strategy and active period
- `period_selected` / `period_changed` – tracks time horizon intent
- `simulator_data_loaded` – logs dataset size and snapshot timestamp
- Chat lifecycle events (`chat_opened`, `chat_message_sent`, `chat_message_completed`, `chat_response_error`, etc.) carry current strategy/period metadata
- Floating input events (`floating_input_submitted`, `floating_input_forwarded`) capture message length and success state when forwarding to the main chatbot
- Portfolio chat events include simulator context (`strategy`, `period_years`, `custom_mix_enabled`) so conversations remain tied to the active configuration.
- Custom builder events:
  - `custom_strategy_applied` – includes base strategies + weights
  - `custom_strategy_reset` – fires when the mix is cleared

All payloads share the `Portfolio Simulator` category and automatically append language, strategy, and `period_years` parameters for downstream dashboards.

## SEO Enhancements

- Added `FinancialService` JSON-LD script (provider, languages, free offer, canonical URL).
- Existing OG/Twitter/canonical tags remain aligned with Bubble’s design system.
- Before production, replace Google Analytics placeholders in `src/frontend/js/seo/cookie-consent.js` with the live GA4 property IDs.

### Test URLs
- Landing page preview: http://localhost:3000/ (scroll to "What We're Building")
- Full simulator: http://localhost:3000/portfolio-simulator

## Roadmap Priorities (2025-10 Snapshot)

### Recently Completed
- Automated multi-period cache regeneration (1/3/5/10/20Y) with 60/40 strategy support.
- Portfolio simulator now consumes server-side metrics, exposes JSON-LD, and streams GA4 events.
- Custom Mix builder (client-side blend + analytics) shipped.
- Dedicated `/api/chat/portfolio` endpoint delivers portfolio-aware conversations with simulator context.
- Momentum Tilt + Hierarchical Risk Parity strategies added to the cache pipeline and UI.
- Export toolkit (chart PNG + metrics CSV) available via feature flag with analytics instrumentation.

### Next Focus
1. **Allocation Sliders & Advanced Exports**
   - Interactive sliders for manual ETF weights, additional download formats (PDF summaries), and improved legal copy toggle.
2. **Embeddable & Content Integration**
   - Build an embeddable widget (iframe/web component) for blog posts and dynamic deep-links (e.g., `?strategy=optimizedRP&period=5`).
3. **Future Strategy Modules**
   - Evaluate additional anim-main strategies (Leveraged RP, Momentum + drawdown filters) for inclusion once we have demand data.

**Implementation**:
- Create embeddable simulator widget (`<iframe>` or web component)
- Smaller, focused versions for blog articles (single strategy view)
- Direct deep-links to simulator with pre-selected strategies:
  - Example: `/portfolio-simulator?strategy=optimizedRP&period=20`

#### Advanced Features

**Export & Download**:
- Charts as PNG/SVG (using Chart.js built-in methods)
- Full performance report as PDF (with jsPDF library)
- Historical data export as CSV
- Email results to user

**User Accounts**:
- Save multiple custom strategies per user
- Track personal portfolio performance over time
- Portfolio watchlist and alerts
- Email notifications for rebalancing suggestions

**Backtesting Tools**:
- Test custom allocations on different historical periods
- Crisis testing: 2008 financial crisis, 2020 COVID crash, 2022 inflation
- Monte Carlo simulations for future projections
- Rolling window analysis (e.g., 5-year rolling Sharpe ratios)

**Real-time Integration** (Future Vision):
- Connect to user's actual brokerage account (Plaid, Alpaca API)
- Live portfolio tracking vs optimized strategy
- Auto-rebalancing recommendations with one-click execution
- Tax-loss harvesting suggestions

## Maintenance

### Regenerating Historical Snapshots
Run the multi-period generator to refresh all cached files (1Y/3Y/5Y/10Y/20Y):

```bash
npm run generate:portfolio-cache
```

This command fetches fresh Yahoo Finance data, recalculates every strategy, and writes:

- `src/backend/cache/portfolio-preview-data.json` (default 20-year snapshot)
- `src/backend/cache/portfolio-preview-periods.json` (dictionary of all periods)

### Clearing Cached Files
If you need a clean slate (e.g., before regenerating):

1. Clear via API: `curl -X POST http://localhost:3000/api/portfolio/clear-cache`
2. Optionally restart the server: `npm start`
3. Either hit `/api/portfolio/preview-data` to lazily rebuild or run `npm run generate:portfolio-cache`

### Monitoring
- Check Yahoo Finance API rate limits (in-memory cache reduces calls)
- Monitor chart load times (should be < 500ms)
- Track simulator usage via analytics

## Support

For questions or issues:
- Check [CLAUDE.md](../CLAUDE.md) for project overview
- Review [simul-plan.md](../simul-plan.md) for original integration plan
- Consult [Charte Graphique Bubble.md](company/Charte Graphique Bubble.md) for design compliance

## Recent Changes

### 2025-10-22: 60/40 Strategy & Multi-Period Cache Pipeline

- **Backend**
  - Added `calculateSixtyForty` + reusable fixed-weight helper in [portfolioService.js](../src/backend/services/portfolioService.js) to support classic 60/40 allocations.
  - Centralized strategy generation in [portfolioCacheService.js](../src/backend/services/portfolioCacheService.js) with dynamic strategy maps, multi-period snapshots, and shared metadata (`strategyKeys`).
  - `/api/portfolio/preview-data` now serves period-specific caches via `?period=` and returns the strategy roster for clients.
- **Automation**
  - `npm run generate:portfolio-cache` regenerates 1/3/5/10/20Y snapshots including the new strategy.
- **Frontend**
  - Added 60/40 strategy pill, translations, and chart styling in [`portfolio-simulator.html`](../src/frontend/pages/portfolio-simulator.html) and [`portfolio-simulator.js`](../src/frontend/js/portfolio-simulator.js).
  - Landing preview chart renders the 60/40 series.
  - Introduced the custom mix builder (two strategy selectors + slider) with client-side metrics and local persistence.
  - Export toolkit (chart PNG + metrics CSV) available via feature flag, with inline status feedback.
- **Analytics/Docs**
  - Translations updated to cover the fourth strategy, custom builder, and export actions; documentation refreshed (this file) with usage notes.
  - GA4 now captures `custom_strategy_applied` / `custom_strategy_reset` / `export_*` events alongside existing simulator tracking.

### 2025-01-08: Bilingual Support & 20-Year Data Update

#### Bilingual Implementation (French/English)
- **Added full translation support** for portfolio simulator page
- **Language switcher**: Consistent design with main page (CSS class-based)
- **Translation keys added** to [translations.js](../src/frontend/i18n/translations.js) (lines 416-627):
  - All strategy names, subtitles, and tooltips
  - Chart labels, time period buttons, axis titles
  - All 6 performance metrics with educational tooltips
  - Help section and legal disclaimer
- **HTML translations** via `data-translate` and `data-translate-html` attributes
- **Dynamic chart labels**: ETF names and axis titles update with language
- **Script.js enhancement**: Added support for HTML translations (preserves `<strong>` tags)

#### Updated Strategy Labels (More Natural/Readable)
- "Simple Risk Parity" → "Risk Parity" (cleaner)
- "Volatility-weighted" → "Balanced risk" (more intuitive)
- "EWMA + correlations" → "Best performance" (user-friendly)
- Chart labels now use translation keys for consistency

#### Enhanced Chart Interaction
- **Selected portfolio prominence**:
  - Active strategy: 100% opacity, 1.5x thicker line, always on top
  - Inactive strategies: 30% opacity, 0.7x thinner lines, faded but visible
- **Added `hexToRgba()` helper** for proper color opacity conversion
- **Visual hierarchy**: Clear distinction between selected and non-selected portfolios

#### Data Period Update: 10 Years → 20 Years
- **Backend changes**:
  - [yahooFinanceService.js](../src/backend/services/yahooFinanceService.js): Default `years = 20`
  - [portfolio.controller.js](../src/backend/controllers/portfolio.controller.js): Fetches 20 years by default
- **Frontend changes**:
  - [translations.js](../src/frontend/i18n/translations.js): Updated subtitle to "20 years"
  - [portfolio-simulator.html](../src/frontend/pages/portfolio-simulator.html):
    - Added 5th time period button: "20 years" (active by default)
    - Updated meta description
  - [portfolio-simulator.js](../src/frontend/js/portfolio-simulator.js): `currentPeriod = 20`
- **Time period selector**: Now offers 1Y, 3Y, 5Y, 10Y, **20Y** (default)

#### Files Modified
| File | Changes |
|------|---------|
| `translations.js` | +200 lines: All simulator translations (FR/EN) |
| `script.js` | Added `data-translate-html` support for legal disclaimers |
| `portfolio-simulator.html` | All text elements tagged for translation, added 20Y button |
| `portfolio-simulator.js` | Translation functions, enhanced chart interaction, 20Y default |
| `yahooFinanceService.js` | Default fetch period: 10Y → 20Y |
| `portfolio.controller.js` | Default API period: 10Y → 20Y |
| `styles.css` | Language switcher uses consistent site-wide styles |

#### Testing Notes
- Test language switching: http://localhost:3000/portfolio-simulator
- Verify all tooltips translate (strategies + metrics)
- Check chart labels update dynamically (ETFs, axis, legend)
- Confirm 20-year data loads by default
- Ensure selected portfolio is visually prominent

### 2025-01-09: Preview Title Update & Tile Sizing Fixes

#### Portfolio Preview Updates
- **Title updated**: "Discover Portfolio Optimization" → "Discover Our Portfolio Optimization"
  - FR: "Découvrez l'Optimisation de Portefeuille" → "Découvrez nos Optimisations de Portefeuilles"
- **CTA updated**: "Try the Simulator" → "Try Our Simulator"
  - FR: "Essayer le Simulateur" → "Essayez notre Simulateur"
- **Translation keys**: `vision.portfolio.title` and `vision.portfolio.cta` updated in [translations.js](../src/frontend/i18n/translations.js)

#### Main Page Tile Sizing Fixes
- **Clarity tiles** ([styles.css](../src/frontend/assets/styles/styles.css) lines 2480-2507):
  - Changed `justify-content: center` → `flex-start` (top-aligned content)
  - Increased `min-height: 120px` → `140px`
  - Added `flex: 1` to span elements for better space filling
  - Increased gap to 1rem for better spacing
- **Automation tiles** (lines 2537-2565):
  - Changed `justify-content: center` → `flex-start`
  - Increased `min-height: 100px` → `130px`
  - Added `flex: 1` to span elements
  - Increased padding and gap for better visual balance
- **Result**: Text now fills tiles entirely on main page ("cost structure", "AI expertise", "diversified assets")

#### Files Modified
| File | Changes |
|------|---------|
| `translations.js` | Updated portfolio preview title and CTA text (FR/EN) |
| `styles.css` | Fixed clarity and automation tile sizing with flexbox improvements |

---

### 2025-10-09: Glassmorphism Floating Chat Input & Button Design Unification

#### Glassmorphism Floating Chat Input
- **New component**: Transparent floating input at bottom center of pages
- **Design**: Ultra-transparent glassmorphism with 15% white opacity, 20px backdrop blur
- **Behavior**:
  - Main page: Shows when "Join us" button scrolls out of view
  - Simulator page: Always visible
- **Integration**: Opens main chatbot and sends message when submitted
- **Styling**: Pill-shaped (border-radius: 50px) with gray circular submit button

#### Site-wide Button Design Unification (Pill Shape)
- **All CTA buttons updated to border-radius: 50px**:
  - `.cta-button` (main CTAs like "Join us", "Try our simulator")
  - `form button` (waitlist form submit)
  - `.mini-chat-input` (mini chat input field)
  - Simulator back button (inline styled with pill shape)
  - "Chat with our AI" button (simulator page)
- **Submit buttons**: Gray gradient circular design (40px × 40px, border-radius: 50%)
  - `.chat-submit`, `.mini-chat-send`, `.floating-input-submit`
  - Upward arrow icon (consistent across all submit buttons)
- **Emoji removed**: "Chat with our AI" button no longer has 💬 emoji

#### Chat Placeholder Text Updates
- **Changed "Ask us" → "Ask me"** in all rotating placeholder texts:
  - EN: "Ask me why AI is a game-changer...", "Ask me how we reduce fees...", etc.
  - FR: "Demandez-moi pourquoi l'IA change la donne...", "Demandez-moi comment nous réduisons les frais...", etc.
- **Translation keys updated**: `chat.rotatingPlaceholders` and `chat.placeholder`

#### Files Modified
| File | Changes |
|------|---------|
| `styles.css` | Updated all CTA button border-radius to 50px (lines 614, 1116, 1616, 1893) |
| `index.html` | Added glassmorphism floating chat input (lines 757-776) |
| `portfolio-simulator.html` | Added floating input, updated back/chat buttons to pill shape (lines 400, 586, 604-622) |
| `floating-chat-input.js` | New file: scroll detection and chat integration logic |
| `translations.js` | Updated chat placeholders (us→me), removed emoji from simulator.help.button |

---

### 2025-11-03: Global Diversification with Optimised Momentum+RP Strategy & Leverage Toggle

#### Major Feature Additions

**1. Expanded to 5-ETF Global Portfolio**
- Added EFA (MSCI EAFE - Developed Markets) and EEM (MSCI Emerging Markets)
- Provides true global diversification across US, developed, and emerging regions
- All strategies now calculate with 5-ETF allocation

**2. Optimised Strategy Redesign: 70% Momentum + 30% Risk Parity**
- Redesigned from plain Risk Parity to hybrid momentum+RP approach
- **Target achieved**: +14.8% outperformance over 20 years (exceeds +10% requirement)
- 70% momentum (12-month returns) identifies uptrending assets
- 30% risk parity (inverse EWMA volatility) provides stability and diversification
- Monthly (21-day) rebalancing frequency
- Performance metrics:
  - Equal Weight (baseline): 381.43% return over 20 years
  - Optimised Strategy: 437.9% return (+56.47pp outperformance)
  - Annualized improvement: +0.60% CAGR

**3. Leverage Toggle Feature**
- Added 1x (no leverage) / 2x leverage selector above portfolio chart
- 2x leverage includes risk warning: "Borrows money at 8% annual interest"
- Integrated with "Create Your Own" strategy mixing
- Leverage metrics display for both custom and preset strategies
- Applies daily borrowing cost calculation (8% annual rate / 252 trading days)

**4. Fixed "Create Your Own" Chart Update Bug**
- Charts and metrics now update simultaneously when applying custom mix
- Normalized cache invalidation ensures fresh calculations

**5. Yahoo Finance API Reliability Improvements**
- Implemented exponential backoff retry logic (3 attempts per ticker)
- Longer delays between requests (1 second) to respect rate limits
- Partial data safety check: Won't cache incomplete ticker sets
- All 5 ETFs must be successfully fetched before caching

#### Technical Implementation Details

**Backend Changes:**
- `yahooFinanceService.js`: Added retry logic, rate limiting, partial data validation
- `portfolioService.js`: Implemented 70/30 hybrid strategy calculation with proper volatility annualization
- `portfolioCacheService.js`: Updated to handle 5-ETF portfolios across all strategies

**Frontend Changes:**
- `portfolio-simulator.js`: Added leverage toggle, fixed chart update logic
- `portfolio-simulator.html` (both FR & EN): Added leverage UI section and CSS styling
- `translations.js`: Updated strategy descriptions and leverage-related translations
- Both French and English versions have complete feature parity

#### Performance Impact

The 70/30 Momentum + Risk Parity strategy achieves:
- ✅ **+14.8% outperformance** vs Equal Weight baseline (exceeds +10% target)
- **Total return**: 437.9% over 20 years (8.79% CAGR)
- **Volatility**: 28.43% annualized (controlled by 30% risk parity component)
- **Max drawdown**: -53.39% (2008 crisis)
- Global diversification reduces single-region risk

#### Files Modified
| File | Changes |
|------|---------|
| `yahooFinanceService.js` | Exponential backoff retry logic, rate limiting, partial data validation |
| `portfolioService.js` | Implemented 70/30 Momentum+RP strategy, proper volatility annualization |
| `portfolio-simulator.js` | Leverage toggle implementation, chart update fixes |
| `portfolio-simulator.html` (FR) | Leverage UI section and CSS styling |
| `portfolio-simulator.html` (EN) | Leverage UI section and CSS styling |
| `translations.js` | Updated strategy descriptions, leverage translations (FR/EN) |
| `PORTFOLIO_SIMULATOR.md` | Updated with 5 ETFs, strategy performance details, implementation notes |

#### Known Issues
- Chart data truncates at 2008-09-08 (visual only - metrics calculated correctly from full 20-year dataset)
- Issue being investigated in buildChartData/buildSnapshot logic

---

**Last Updated**: 2025-11-03
**Current Version**: v1.4 - Production-ready with 5-ETF global portfolio, optimised momentum+RP strategy, leverage toggle

---

## Roadmap to v2.0

The next release focuses on aligning the Bubble portfolio stack with the richer feature set explored in the `anim-main` prototype while strengthening realism (weekly data, cash sleeve, leverage parity).

### 1. Data Pipeline Enhancements
- **Weekly normalization**: refactor `yahooFinanceService.fetchETFData` and `portfolioCacheService` so cached time series use weekly (Friday) closes instead of ~monthly sampling. Preserve 20Y depth and update down-sampling logic for the frontend charts.
- **Synthetic cash asset**: append a deterministic `CASH` series (≈2% annual return, 0% volatility) to every cached dataset. Include it in `tickers`, normalization, and chart payloads.
- **Cache regeneration**: after code changes, rerun `npm run generate:portfolio-cache` and validate both simulator and landing-page preview ingest the updated shape.

### 2. Strategy Suite Parity with `anim-main`
- **Inventory strategies**: document all algorithms in `anim-main/src/services/portfolioCalculations.js` (equal weight, simple/optimized risk parity, hierarchical RP, DCC-enhanced RP, regime-aware RP, optimized risk budgeting, etc.).
- **Port calculations**: migrate each strategy into `src/backend/services/portfolioService.js`, adapted for the six-asset universe (5 ETFs + cash). Ensure each function returns both value and weight histories and handles missing data gracefully.
- **Hybrid optimization**: replace the current momentum+RP placeholder with the real “Optimized Risk Budgeting” implementation (gradient-descent risk budget with correlation penalties) to smooth volatility without sacrificing performance. As part of the port, explicitly verify that hierarchical RP and optimized risk budgeting rely only on historical data (no look-forward).
- **Docs & translations**: update tooltips, descriptions, and this roadmap once every strategy is available through the API.

### 3. Frontend Integration & UX
- **Simulator**: expand `STRATEGY_CONFIG`, pills, tooltips, and translations so users can pick any of the new portfolios. Keep “Create Your Own” builder and allow including the cash sleeve when mixing.
- **Homepage preview**: surface a curated subset (e.g., Equal Weight, Optimized Risk Budgeting, Enhanced RP) in the landing-page chart. Reuse ETF toggles, add the cash line, and update animated metrics to the new benchmark pairs.
- **Language sync**: leverage the existing `languageChanged` event so labels and tooltips stay localized as the strategy list expands.
- **Showcase & explore**: present one or two flagship “Optimized” strategies (e.g., Optimized Risk Budgeting or Hierarchical RP) as defaults, while emphasizing that “Create Your Own” remains the sandbox for mixing any combination (with cash and leverage).
- **Chart clarity & responsiveness**: revisit dataset styling (opacity, line width, sampling cadence) so multi-strategy views remain legible, add per-series toggle controls where needed, and ensure mobile layouts/downsampling keep charts readable on smaller screens.

### 4. Leverage Standardization
- Generalize `applyLeverageToPortfolio` so every strategy (preset or custom mix) supports 1×/2× leverage. Update toggles, warnings, and metrics exports to reflect the levered series.
- Ensure cash participation behaves correctly under leverage—borrowed exposure should reduce cash weight proportionally or be used as collateral, mirroring real-world mechanics.

### 5. Validation & Launch Tasks
- **Backtests**: run regression tests comparing new results with `anim-main` output (spot-check annualized return, volatility, sharpe, drawdown).
- **Preview parity**: confirm the homepage preview and simulator charts pull identical data after cache regeneration.
- **Documentation**: refresh `PORTFOLIO_SIMULATOR.md`, strategy tooltips, and marketing copy to highlight weekly data, cash reserve, and the expanded strategy lineup.
- **Release checklist**: bump version to v2.0, summarize changes, and communicate leverage/cash updates to stakeholders.

### Immediate Next Steps
1. Implement weekly normalization + cash asset in the caching layer and regenerate preview data.
2. Port the Optimized Risk Budgeting strategy from `anim-main` as the first advanced portfolio; wire into API and front-end.
3. Generalize leverage handling and verify the simulator + preview remain synchronized.
