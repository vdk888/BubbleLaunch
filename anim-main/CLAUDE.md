# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a sophisticated ETF portfolio analysis application built with React frontend and Express backend. It analyzes 20 years of historical ETF data to compare multiple advanced portfolio strategies including equal weight, risk parity, hierarchical risk parity, and leveraged approaches. The application fetches real Yahoo Finance data and implements cutting-edge portfolio optimization techniques including EWMA volatility calculations, dynamic conditional correlations (DCC), regime detection, and risk budgeting optimization.

## Architecture

### Frontend (React)
- **Main Component**: `src/components/StepByStepAnalysis.js` - The primary UI component that orchestrates the entire analysis workflow
- **Core Services**:
  - `src/services/etfDataService.js` - Handles API communication with backend for Yahoo Finance data
  - `src/services/portfolioCalculations.js` - Core portfolio calculation algorithms and coordination hub
  - `src/services/performanceMetrics.js` - Performance and risk metric calculations
- **Advanced Portfolio Services**:
  - `src/services/riskBudgeting.js` - Mathematical risk budgeting optimization with numerical algorithms
  - `src/services/hierarchicalRiskParity.js` - HRP implementation using machine learning clustering
  - `src/services/dynamicCorrelations.js` - DCC-GARCH models for time-varying correlations
  - `src/services/regimeDetection.js` - Market regime detection and adaptive parameters
- **Components**:
  - `src/components/PerformanceMetrics.js` - Displays performance metrics table

### Backend (Express)
- **Main Server**: `server.js` - Express server that fetches Yahoo Finance data using `yahoo-finance2` library
- **API Endpoints**:
  - `/api/etf-data` - Fetches 20 years of historical ETF data
  - `/api/health` - Health check endpoint
  - `/api/etf-config` - Returns ETF configuration

### Data Flow
1. Frontend requests ETF data from backend API
2. Backend fetches real historical data from Yahoo Finance (20 years, 5 ETFs: SPY, IEF, GLD, EFA, VNQ)
3. Frontend normalizes data to base 100 and calculates multiple portfolio strategies
4. Results displayed in interactive step-by-step analysis with charts and performance metrics

## Development Commands

### Running the Application
```bash
# Start both frontend and backend concurrently
npm run dev

# Start frontend only (React development server on port 3000)
npm start

# Start backend only (Express server on port 3001)
npm run server
```

### Testing and Building
```bash
# Run tests
npm test

# Build for production
npm run build
```

## ETF Configuration
The application analyzes 5 ETFs representing different asset classes:
- **SPY**: S&P 500 (US Large Cap)
- **IEF**: 7-10Y Treasury Bonds
- **GLD**: Gold
- **EFA**: Developed Markets (MSCI EAFE)
- **VNQ**: REITs

## Portfolio Strategies Implemented

### Basic Strategies
1. **Equal Weight Portfolio**: Simple 20% allocation to each ETF
2. **Leveraged Equal Weight**: 2x leveraged with 8% borrowing cost

### Risk Parity Strategies
3. **Simple Risk Parity**: Basic inverse volatility weighting
4. **Enhanced Risk Parity**: EWMA volatility + correlation adjustment (unleveraged)
5. **Enhanced Risk Parity (Leveraged)**: 2x leveraged with sophisticated rebalancing

### Advanced Strategies
6. **Optimized Risk Budgeting**: True mathematical risk parity using numerical optimization algorithms
7. **Hierarchical Risk Parity (HRP)**: Machine learning clustering approach with hierarchical allocation
8. **Enhanced Risk Parity with DCC**: Dynamic conditional correlation models with time-varying correlations
9. **Regime-Aware Risk Parity**: Adaptive strategy that adjusts parameters based on market regime detection

## Key Implementation Details

### Portfolio Calculations (`src/services/portfolioCalculations.js`)
- **Coordination Hub**: Central module that imports and orchestrates all portfolio calculation services
- All strategies use 21-day rebalancing frequency with 60-day lookback periods
- EWMA volatility calculation with lambda=0.94
- Multi-horizon volatility estimation (21, 60, 252 days)
- Correlation penalty factor of 0.5 for enhanced risk parity
- Leveraged strategies include daily borrowing costs

### Advanced Modules

#### Risk Budgeting (`src/services/riskBudgeting.js`)
- **Gradient Descent with Momentum**: Primary optimization algorithm for risk parity
- **Cyclical Coordinate Descent**: Alternative optimization approach
- Numerical convergence checking with configurable tolerance
- Mathematical risk contribution calculations using portfolio theory

#### Hierarchical Risk Parity (`src/services/hierarchicalRiskParity.js`)
- **Correlation Distance Clustering**: Groups similar assets using correlation-based distance metrics
- **Hierarchical Allocation**: Risk parity applied at both cluster and individual asset levels
- Designed for small portfolios (5 assets) with proper edge case handling
- Machine learning clustering techniques for portfolio construction

#### Dynamic Correlations (`src/services/dynamicCorrelations.js`)
- **DCC-GARCH Models**: Sophisticated time-varying correlation estimation
- **Regime Change Detection**: Identifies structural shifts in correlation patterns
- **Correlation Forecasting**: Predictive capabilities for future correlation estimates
- Matrix operations and statistical modeling for enhanced risk management

#### Regime Detection (`src/services/regimeDetection.js`)
- **Volatility Regimes**: Low, medium, high volatility environment classification
- **Trend Detection**: Bull, bear, sideways market identification
- **Crisis Detection**: Financial stress period identification
- **Adaptive Parameters**: Dynamic strategy parameter adjustment based on market conditions

### Performance Metrics (`src/services/performanceMetrics.js`)
- Total return, annualized return, volatility (annualized)
- Sharpe ratio (vs 2% risk-free rate)
- Maximum drawdown calculation
- All metrics calculated over full 20-year period

### Data Service (`src/services/etfDataService.js`)
- Fetches real Yahoo Finance data via backend proxy
- Normalizes all price series to base 100 for comparison
- Error handling for API failures

## Development Notes

### Architecture Patterns
- **Modular Service Design**: Each advanced strategy is implemented as a separate service module
- **Coordination Hub Pattern**: `portfolioCalculations.js` imports and orchestrates all strategy modules
- **Real Data Testing**: Always test with actual Yahoo Finance data, never mock data or placeholders
- The application uses Recharts for data visualization
- The backend handles Yahoo Finance rate limiting with delays between requests
- The proxy configuration in `package.json` routes `/api` calls to the Express server on port 3001
- Performance metrics use 252 trading days per year for annualization

### Multi-Agent Development
- **Progress Tracking**: Use `PORTFOLIO_ENHANCEMENTS_PROGRESS.md` for coordinating work across agents
- **Integration Guides**: Specialized integration documentation (e.g., `DCC_INTEGRATION_GUIDE.md`) for complex features
- **Modular Implementation**: New strategies should be implemented as separate service modules and imported into the coordination hub

### Testing and Validation
- **Test Files**: Use `test_*.js` files for standalone algorithm validation
- **Python Reference**: `fetch_etf_analysis.py` contains the original implementation for validation
- Always test new portfolio strategies with the full 20-year dataset
- Validate results against Python reference implementation when available

### Code Style
- Export calculation functions with descriptive names (`calculateOptimizedRiskBudgeting`, etc.)
- Include comprehensive JSDoc comments for complex mathematical functions
- Use consistent parameter structures across portfolio calculation functions
- Handle edge cases gracefully (missing data, insufficient history, etc.)

## Python Analysis Script
The `fetch_etf_analysis.py` file contains the original Python implementation that was ported to JavaScript. It includes comprehensive portfolio analysis with matplotlib visualization and can be used for validation and development of new strategies.