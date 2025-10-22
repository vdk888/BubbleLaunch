# Portfolio Simulator Documentation

## Overview

The Portfolio Simulator is an interactive tool integrated into the Bubble website that allows users to compare different investment portfolio strategies with real historical ETF data. The system is designed to be easily extensible for adding new strategies in the future.

## Architecture

### Current Implementation

**3 Portfolio Strategies:**
1. **Allocation Égale** (Equal Weight) - Baseline: 33.3% each asset
2. **Risk Parity Simple** - Inverse volatility weighting
3. **✨ Optimisé** (Currently: Optimized Risk Parity) - EWMA + correlations

**3 Core ETFs:**
- SPY (S&P 500) - US Stocks
- IEF (Treasury Bonds) - US Bonds
- GLD (Gold) - Commodities

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
│   │   └── portfolioService.js          # Strategy calculations
│   └── cache/
│       └── portfolio-preview-data.json  # Pre-calculated data
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
# Run the portfolio calculation script or restart the server
npm start
```

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
    "optimizedRP": { "totalReturn": 378.63, "annualReturn": 8.32, "volatility": 10.94, "sharpeRatio": 0.42, "maxDrawdown": -26.91 }
  },
  "periodYears": 20,
  "periodsAvailable": [1, 3, 5, 10, 20],
  "generatedAt": "2025-10-22T18:25:54.306Z",
  "fromCache": true
}
```

### GET `/api/portfolio/etf-data`
Fetch raw ETF data for custom calculations. Currently exposed but not invoked by the frontend to avoid runtime latency.

### POST `/api/portfolio/calculate`
Calculate portfolio performance for custom allocations. Available for server-side or scripted jobs; the UI relies on cached aggregates instead of calling this endpoint live.

## Performance & Caching Strategy

To keep the simulator snappy, the frontend always consumes the pre-generated snapshot from `/api/portfolio/preview-data`. This snapshot contains:

- 20 years of normalized prices for SPY/IEF/GLD sampled monthly
- Portfolio values and core metrics for Equal Weight, Simple Risk Parity, and Optimized Risk Parity
- A `fromCache` flag so we can audit whether the cache was hit

The cache file lives at `src/backend/cache/portfolio-preview-data.json` and is regenerated by the backend on demand (server restart or explicit helper script). Avoiding on-the-fly Yahoo Finance requests prevents the multi-second cold start the original `anim-main` stack incurred.

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
- [ ] All 3 strategies display correctly
- [ ] Strategy selector pills work and update chart
- [ ] Tooltips appear on hover (strategies & metrics)
- [ ] Chart animates smoothly on strategy change
- [ ] Metrics update correctly when switching strategies
- [ ] ETFs are visible but stay in background
- [ ] Best strategy (marked `isBest: true`) stands out
- [ ] Mobile responsive (test on phone/tablet)
- [ ] Browser compatibility (Chrome, Firefox, Safari)
- [ ] Period buttons fetch the right cached snapshot (1Y/3Y/5Y/10Y/20Y)

### Test URLs
- Landing page preview: http://localhost:3000/ (scroll to "What We're Building")
- Full simulator: http://localhost:3000/portfolio-simulator

## Roadmap Priorities (2025-10 Snapshot)

1. **Automated Cache Regeneration**
   - Nightly (or deploy-time) job that fetches ETF history, runs strategy calculators, and emits pre-sliced JSON bundles for 1Y/3Y/5Y/10Y/20Y horizons.
   - Consolidate outputs under `src/backend/cache/` so the frontend can switch periods without runtime API calls.
2. **Server-Side Metrics & Multi-Period Delivery**
   - Port the richer metric helpers from `anim-main` so each cached bundle stores Sharpe, Calmar, total return, etc.
   - Update `portfolio-simulator.js` to consume the precomputed period files rather than estimating metrics client-side.
3. **Analytics & SEO Foundation**
   - Implement GA4/Plausible tracking for strategy + period interactions.
   - Apply the SEO roadmap: structured data, meta refinements, internal links, and share images.
4. **Strategy Expansion Pipeline**
   - Reuse `anim-main` strategy modules (60/40, HRP, Momentum, Leveraged RP) inside the offline cache job.
   - Surface new strategies incrementally through the `STRATEGY_CONFIG` map with accompanying translations and tooltips.
5. **“Create Your Own” Strategy MVP**
   - Introduce a fourth pill that lets users mix two cached strategies client-side; persist selections in `localStorage`.
   - Defer chatbot handover until the mechanics are proven.
6. **Portfolio Chatbot Specialization**
   - Stand up a dedicated `/api/chat/portfolio` endpoint with a portfolio-specific prompt.
   - Pass active strategy/period context so responses are tailored to the current chart.
7. **UX Enhancements & Exports**
   - Add allocation sliders, chart/metric export options, and refined legal copy.
   - Launch behind feature flags and graduate once analytics shows sustained simulator usage.

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

**Last Updated**: 2025-10-09
**Current Version**: v1.3 - Production-ready with glassmorphism UI and unified button design
