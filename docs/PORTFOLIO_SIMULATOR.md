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
Returns pre-calculated portfolio data for all strategies (20 years, monthly).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2015-10-07",
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
    "equalWeight": { "totalReturn": 180.47, "sharpeRatio": 0.94 },
    "optimizedRP": { "totalReturn": 133.78, "sharpeRatio": 0.52 }
  },
  "fromCache": true
}
```

### GET `/api/portfolio/etf-data` (Future)
Fetch raw ETF data for custom calculations.

### POST `/api/portfolio/calculate` (Future)
Calculate portfolio performance for custom allocations.

## Performance Metrics

Calculated client-side in `updateMetrics()`:

1. **Total Return**: `(final_value / initial_value - 1) * 100`
2. **Annualized Return (CAGR)**: `(1 + total_return)^(1/years) - 1`
3. **Volatility**: `std_dev(monthly_returns) * sqrt(12)`
4. **Sharpe Ratio**: From API (pre-calculated)
5. **Max Drawdown**: `max((value - peak) / peak)`
6. **Calmar Ratio**: `annualized_return / abs(max_drawdown)`

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

### Test URLs
- Landing page preview: http://localhost:3000/ (scroll to "What We're Building")
- Full simulator: http://localhost:3000/portfolio-simulator

## Future Enhancements

Potential strategies to add (from [simul-plan.md](../simul-plan.md)):
- **Leveraged Risk Parity**: 1.5x leverage on bonds/gold
- **Hierarchical Risk Parity (HRP)**: Cluster-based allocation
- **Momentum Strategy**: Tactical allocation based on trends
- **60/40 Portfolio**: Classic 60% stocks, 40% bonds
- **All Weather**: Ray Dalio's strategy

Additional features:
- User customization (adjust allocations)
- More ETFs (sector-specific)
- Export charts/reports as PDF
- Chat integration ("Ask AI about this strategy")
- Embed in blog articles

## Maintenance

### Updating Historical Data
Data is cached in `portfolio-preview-data.json`. To refresh:

1. Clear cache: `curl -X POST http://localhost:3000/api/portfolio/clear-cache`
2. Restart server: `npm start`
3. Data will regenerate on first request

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

---

**Last Updated**: 2025-01-08
**Current Version**: v1.1 - Bilingual support + 20-year historical data
