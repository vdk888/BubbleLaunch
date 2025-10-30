#Bubble Portfolio Management System

**Note**: Internal technical documentation for Bubble's portfolio management application (beta version).

## Overview

Bubble is building an AI-powered portfolio management system that automates the entire investment process from stock screening to order execution. The system combines quantitative strategies with disciplined risk management, leveraging AI (particularly Claude Code) for rapid development while maintaining robust investment principles based on institutional asset management experience.

### What is Bubble's Proprietary Technology?

**Bubble's core IP is:**
1. **Multi-factor scoring engine**: Proprietary algorithms for momentum, quality, and risk-adjusted scoring
2. **11-step automated process**: End-to-end workflow from data collection to execution
3. **Risk management framework**: Institutional-grade constraints (max 30 positions, 1-10% sizing, progressive rebalancing)
4. **Multi-broker routing intelligence**: Automatic broker selection and capacity management
5. **Backtesting infrastructure**: 17+ years validation system

**What Bubble is NOT:**
- **NOT a data provider**: We use third-party sources (Uncle Stock for stock screening, Yahoo Finance for historical data, etc.)
- **NOT a broker**: Users maintain their own accounts with IBKR/Alpaca/Saxo
- **NOT a custody platform**: Users own and control their assets directly

**Data Sources (Third-Party):**
- **Uncle Stock**: Stock screening data provider (external vendor, like Yahoo Finance)
- **Yahoo Finance**: Historical price data for backtesting
- **Future**: AI-augmented sources (Perplexity API, LLM-enhanced research)

## Core Philosophy

### Key Principles:
- **Disciplined investing**: Clear rules, systematic approach, accessible to all
- **AI-Accelerated Development**: AI as copilot for rapid prototyping, testing, and documentation
- **Institutional-Grade Risk Management**: Rules derived from professional asset management experience
- **Transparency**: Visible, understandable strategies on the platform
- **Long-term Value Creation**: Focus on sustainable returns, not short-term speculation

## The 11-Step Portfolio Management Process

### 1. Stock Screening (Étape 1: Listes actions)
- **Purpose**: Collect data from multiple third-party sources
- **API**: `POST /api/v1/screeners/fetch`
- **Input**: sources, user_id
- **Output**: raw_screener_data
- **Data Sources** (Third-Party Providers):
  - Uncle Stock (stock screening data provider, similar to Yahoo Finance)
  - Predefined ETF lists (Core ETFs, Crypto ETFs)
  - Future: AI-augmented sources (Perplexity, other data providers)
  - Standardized through adapters

**Note**: Uncle Stock is an external data provider used for stock screening information, similar to how Yahoo Finance provides market data. Bubble's proprietary technology is the **multi-factor scoring engine** and **11-step automated process**, not the data sources themselves.

### 2. Universe Construction (Étape 2: Univers)
- **Purpose**: Clean and unify data into single source of truth
- **API**: `POST /api/v1/universe/parse`
- **Input**: raw_screener_data
- **Output**: universe.json
- **Content**: Standardized tickers + metadata + performance by screener

### 3. Historical Context (Étape 3: Historique)
- **Purpose**: Add long-term performance context to avoid bias
- **API**: `POST /api/v1/historical/universe/update`
- **Input**: universe.json
- **Output**: universe.json enriched with historical performance data

### 4. Risk Parity Optimization (Étape 4: Equilibre risque)
- **Purpose**: Allocate coherent weights for portfolio robustness
- **API**: `POST /api/v1/portfolio/optimize`
- **Input**: universe.json
- **Output**: universe.json with allocation field per pocket
- **Methods**:
  - Risk Parity
  - Sharpe-optimized allocation
  - Kelly Criterion
  - Regime detection

### 5. Currency Conversion (Étape 5: Conversion EUR)
- **Purpose**: Enable apples-to-apples comparison across currencies
- **API**: `POST /api/v1/currency/update-universe`
- **Input**: universe + FX rates
- **Output**: universe.json with exchange rate field

### 6. Target Calculation (Étape 6: Cibles)
- **Purpose**: Allocate according to scoring rules
- **API**: `POST /api/v1/portfolio/targets/calculate`
- **Input**: universe.json, strategy_params
- **Output**: universe.json with allocation field
- **Scoring Types**:
  - Pure momentum (180-day ranking)
  - Momentum + quality factors
  - Risk-adjusted momentum
- **Configurable by strategy pocket**: Each strategy uses its own scoring combination

### 7. Share Quantities (Étape 7: Quantités)
- **Purpose**: Convert percentages to executable share quantities
- **API**: `GET /api/v1/orders/positions/targets`
- **Input**: account_value, universe.json
- **Output**: universe.json with quantities field

### 8. Broker Reference Mapping (Étape 8: References IBKR)
- **Purpose**: Map tickers to broker-specific identifiers
- **API**: `POST /api/v1/ibkr/search-universe`
- **Input**: universe tickers
- **Output**: universe_with_ibkr.json

### 9. Order Generation (Étape 9: Ordres)
- **Purpose**: Generate rebalancing basket
- **API**: `POST /api/v1/orders/generate`
- **Input**: targets, ibkr_refs, positions + database
- **Output**: orders.json

### 10. Order Execution (Étape 10: Execution)
- **Purpose**: Submit trades and track live execution
- **API**: `POST /api/v1/orders/execute`
- **Input**: orders.json
- **Output**: execution_report.json

### 11. Post-Trade Control (Étape 11: Contrôle)
- **Purpose**: Verify deviation from targets, close the loop
- **API**: `POST /api/v1/orders/status`
- **Input**: execution_id
- **Output**: status.json, KPIs

## Multi-Broker Architecture (Active)

The system supports intelligent routing across multiple brokers:

### Current Brokers:
- **Interactive Brokers (IBKR)**: International stocks
- **Alpaca** ✅ ACTIVE: US stocks and ETFs, commission-free
- **Saxo Bank** ✅ ACTIVE (Beta): Integrated in beta product for European market access
- **Crypto.com** 🔜 ROADMAP: Cryptocurrency trading

### Intelligent Routing Features:
- **Automatic broker selection**: System chooses best broker for each asset type
- **Capacity verification**: Checks available capacity per broker before generating orders
- **Over-allocation prevention**: Ensures orders don't exceed broker account limits

## Scoring System and Backtesting

### Multi-Factor Scoring Engine (October 2025 ✅)
- **Configurable by pocket**: Each strategy uses its own scoring criteria
- **Scoring types**:
  - Pure momentum (180-day performance ranking)
  - Momentum + quality (combining trend and fundamental quality)
  - Risk-adjusted momentum (Sharpe-based ranking)

### Comprehensive Backtesting Engine (October 2025 ✅)
- **Historical testing**: 17+ years of market data (2005-2025)
- **Pre-deployment validation**: Test strategies before live trading
- **Performance metrics**:
  - Sharpe Ratio (risk-adjusted returns)
  - Maximum Drawdown (worst peak-to-trough decline)
  - Annualized Volatility (risk measurement)
- **Rigorous validation**: Every strategy backtested before deployment

## Technical Architecture

### Design Principles:
- **Reusable**: Each step can be re-executed on demand
- **Transparent**: Clear data lineage (know where numbers come from and where they go)
- **Documented**: Clear access points and practical guides
- **Automated**: End-to-end automation with AI assistance

### AI Role:
- **Development Copilot**: AI proposes solid initial codebase from intent descriptions
- **Systematic Testing**: Generation of test cases, edge cases, automated verifications
- **Documentation & Tooling**: Clear interfaces, replayable steps, action logging

**IMPORTANT**: AI is the methodical copilot. The framework, constraints, and investment decisions remain guided by experience and explicit rules defined above.

## What Bubble Shares Publicly

### Transparent Progress Updates:
- Complete run demonstrations of all 11 steps
- Deviations between targets and actual portfolio after execution
- Time per step and overall reliability
- Learnings when something breaks... and how it's fixed

**Goal**: Show progress without polish, so everyone understands the "why" as much as the "how".

## Fee Model

**10€/month fixed subscription** regardless of account size - fundamentally different from traditional percentage-based AUM fees that incentivize high fees.

This fixed-fee model symbolizes Bubble's conviction that value is no longer in information secrecy or privilege, but in equitable access to powerful tools. At scale (millions of users), the service becomes "practically free" while maintaining cutting-edge AI-powered portfolio management.

## Current Status (October 2025)

✅ **Multi-factor scoring engine**: Configurable per strategy pocket
✅ **Backtesting engine**: 17+ years historical validation
✅ **Multi-broker integration**: Interactive Brokers, Alpaca (US stocks/ETFs), Saxo Bank (Beta - European markets)
✅ **Intelligent routing**: Multi-broker with capacity checking
✅ **11-step process**: Complete end-to-end automation

🔜 **Roadmap**: Crypto.com integration for cryptocurrency portfolios

## How This Differs from Traditional Robo-Advisors

### NOT a Traditional Robo-Advisor:
- **No pre-packaged ETF portfolios**: Active stock selection with quantitative screening
- **No percentage-based fees**: Fixed 10€/month subscription
- **Full transparency**: All strategies, rules, and backtests visible to users
- **Institutional-grade methodology**: Risk parity, multi-factor scoring, regime detection
- **Multi-asset capability**: Stocks, ETFs, and (soon) cryptocurrencies
- **Direct broker integration**: Users maintain control with their own brokerage accounts (Interactive Brokers, Alpaca, Saxo Bank)

### What Bubble Actually Is:
- **AI-powered portfolio management platform**: Combines quantitative strategies with automated execution
- **Educational + Autonomous**: Chatbot IA for financial education + automated trading capabilities
- **Build in public approach**: Transparent development, sharing learnings and iterations
- **Long-term value focus**: Disciplined investing for sustainable wealth creation, not speculation
