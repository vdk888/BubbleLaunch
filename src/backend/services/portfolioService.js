/**
 * Portfolio Calculation Service
 * Integrated service that wraps all ported strategy modules
 *
 * This service provides a unified interface for all portfolio calculation strategies.
 * It normalizes return formats from ported strategies to ensure consistent output.
 *
 * All strategies return: { portfolio: [{date, value}], allocations: [{date, ticker1, ticker2, ...}] }
 */

// ═══════════════════════════════════════════════════════════════
// Import Ported Strategies
// ═══════════════════════════════════════════════════════════════

const { calculateEqualWeight: _calculateEqualWeight } = require('./strategies/equalWeight');
const { calculateSixtyForty: _calculateSixtyForty } = require('./strategies/sixtyForty');
const { calculateSimpleRiskParity: _calculateSimpleRiskParity } = require('./strategies/simpleRiskParity');
const { calculateEnhancedRiskParity: _calculateEnhancedRiskParity } = require('./strategies/enhancedRiskParity');
const { calculateHierarchicalRiskParityPortfolio: _calculateHierarchicalRiskParityPortfolio } = require('./strategies/hierarchicalRiskParityPortfolio');
const { calculateOptimizedRiskBudgeting: _calculateOptimizedRiskBudgeting } = require('./strategies/optimizedRiskBudgeting');
const { calculateRegimeAwareRiskParity: _calculateRegimeAwareRiskParity } = require('./strategies/regimeAwareRiskParity');
const { calculateMomentum: _calculateMomentum } = require('./strategies/momentum');
const { findOptimalMix } = require('./strategies/optimizedMix');

// ═══════════════════════════════════════════════════════════════
// Helper Functions (kept from original portfolioService.js)
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate returns from price data
 * @param {Array} prices - Array of {date, price} objects
 * @returns {Array} Array of daily returns
 */
function calculateReturns(prices) {
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i].price - prices[i - 1].price) / prices[i - 1].price);
  }
  return returns;
}

/**
 * Calculate standard deviation (volatility)
 * @param {Array} returns - Array of returns
 * @returns {number} Standard deviation
 */
function calculateStdDev(returns) {
  if (returns.length === 0) return 0;

  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;

  return Math.sqrt(variance);
}

/**
 * Calculate EWMA volatility (Exponentially Weighted Moving Average)
 * @param {Array} returns - Array of returns
 * @param {number} lambda - Decay factor (default: 0.94)
 * @returns {number} EWMA volatility
 */
function calculateEWMAVolatility(returns, lambda = 0.94) {
  if (returns.length === 0) return 0;

  let variance = Math.pow(returns[0], 2);

  for (let i = 1; i < returns.length; i++) {
    variance = lambda * variance + (1 - lambda) * Math.pow(returns[i], 2);
  }

  return Math.sqrt(variance);
}

/**
 * Calculate Pearson correlation between two return series
 * @param {Array} returns1 - First return series
 * @param {Array} returns2 - Second return series
 * @returns {number} Correlation coefficient
 */
function calculateCorrelation(returns1, returns2) {
  const n = Math.min(returns1.length, returns2.length);
  if (n === 0) return 0;

  const mean1 = returns1.slice(0, n).reduce((sum, r) => sum + r, 0) / n;
  const mean2 = returns2.slice(0, n).reduce((sum, r) => sum + r, 0) / n;

  let numerator = 0;
  let sum1Sq = 0;
  let sum2Sq = 0;

  for (let i = 0; i < n; i++) {
    const dev1 = returns1[i] - mean1;
    const dev2 = returns2[i] - mean2;
    numerator += dev1 * dev2;
    sum1Sq += dev1 * dev1;
    sum2Sq += dev2 * dev2;
  }

  const denominator = Math.sqrt(sum1Sq * sum2Sq);
  return denominator > 0 ? numerator / denominator : 0;
}

function computeReturnStats(valueSeries) {
  if (!Array.isArray(valueSeries) || valueSeries.length < 2) {
    return { returns: [], periods: 0, annualizationFactor: 0, startValue: null, endValue: null };
  }

  const returns = [];
  let previous = valueSeries[0].value;
  for (let i = 1; i < valueSeries.length; i++) {
    const current = valueSeries[i].value;
    const ret = previous > 0 ? (current - previous) / previous : 0;
    returns.push(ret);
    previous = current;
  }

  const firstDate = new Date(valueSeries[0].date);
  const lastDate = new Date(valueSeries[valueSeries.length - 1].date);
  const diffMs = lastDate - firstDate;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const periodsPerYear = diffDays > 0 ? valueSeries.length / (diffDays / 365.25) : 52;

  return {
    returns,
    periods: valueSeries.length,
    annualizationFactor: periodsPerYear,
    startValue: valueSeries[0].value,
    endValue: valueSeries[valueSeries.length - 1].value,
  };
}

function calculateMetrics(portfolio) {
  if (!Array.isArray(portfolio) || portfolio.length === 0) {
    return { totalReturn: 0, annualReturn: 0, volatility: 0, sharpeRatio: 0, maxDrawdown: 0 };
  }

  const stats = computeReturnStats(portfolio);
  const totalReturn = stats.startValue > 0 ? (stats.endValue - stats.startValue) / stats.startValue : 0;

  const returns = stats.returns;
  const annualization = Math.max(stats.annualizationFactor, 1);
  const years = Math.max(stats.periods / annualization, 1 / 12);
  const annualReturn = Math.pow(1 + totalReturn, 1 / years) - 1;
  const volatility = calculateStdDev(returns) * Math.sqrt(annualization);

  const riskFreeRate = 0.02;
  const sharpeRatio = volatility > 0 ? (annualReturn - riskFreeRate) / volatility : 0;

  let peak = portfolio[0].value;
  let maxDrawdown = 0;
  portfolio.forEach((point) => {
    if (point.value > peak) {
      peak = point.value;
    }
    const drawdown = peak > 0 ? (point.value - peak) / peak : 0;
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });

  return {
    totalReturn,
    annualReturn,
    volatility,
    sharpeRatio,
    maxDrawdown,
  };
}

/**
 * Apply leverage to portfolio returns
 * @param {Array} unleveragedPortfolio - Portfolio without leverage
 * @param {number} leverage - Leverage multiplier (e.g., 2 for 2x)
 * @param {number} borrowingRate - Annual borrowing rate (default: 0.08 = 8%)
 * @returns {Array} Leveraged portfolio with borrowing costs
 */
function applyLeverageToPortfolio(unleveragedPortfolio, leverage = 2, borrowingRate = 0.08) {
  if (!unleveragedPortfolio || unleveragedPortfolio.length === 0) {
    return [];
  }

  if (leverage === 1) {
    return unleveragedPortfolio; // No leverage, return as-is
  }

  const leveragedPortfolio = [];
  let previousValue = 100; // Starting portfolio value

  for (let i = 0; i < unleveragedPortfolio.length; i++) {
    const { date } = unleveragedPortfolio[i];

    if (i === 0) {
      // First day: start at base 100, no leverage effect yet
      leveragedPortfolio.push({ date, value: 100 });
      previousValue = 100;
      continue;
    }

    // Calculate daily unleveraged return
    const unleveragedReturn =
      (unleveragedPortfolio[i].value - unleveragedPortfolio[i - 1].value) /
      unleveragedPortfolio[i - 1].value;

    // Apply leverage multiplier to return
    const leveragedReturn = leverage * unleveragedReturn;

    // Calculate portfolio value before borrowing costs
    const valueBeforeCost = previousValue * (1 + leveragedReturn);

    // Calculate daily borrowing cost
    // Equity = Portfolio Value / Leverage
    // Borrowed Amount = Portfolio Value - Equity = Portfolio Value * (1 - 1/Leverage)
    const equity = previousValue / leverage;
    const borrowedAmount = previousValue - equity;
    const dailyBorrowingRate = borrowingRate / 252; // Annualized to daily
    const dailyBorrowingCost = borrowedAmount * dailyBorrowingRate;

    // Final portfolio value after borrowing costs
    const finalValue = valueBeforeCost - dailyBorrowingCost;

    leveragedPortfolio.push({ date, value: finalValue });
    previousValue = finalValue;
  }

  console.log(`Applied ${leverage}x leverage: ${leveragedPortfolio.length} data points, ${(borrowingRate * 100).toFixed(1)}% borrowing rate`);
  return leveragedPortfolio;
}

// ═══════════════════════════════════════════════════════════════
// Return Format Normalizer
// ═══════════════════════════════════════════════════════════════

/**
 * Normalize return format from ported strategies
 * Some ported strategies return { portfolioData, weightsData }, but BubbleLaunch expects { portfolio, allocations }
 *
 * @param {Object} result - Strategy calculation result
 * @returns {Object} Normalized result with { portfolio, allocations }
 */
function normalizeReturnFormat(result) {
  if (!result) {
    return { portfolio: [], allocations: [] };
  }

  // Already in correct format: { portfolio, allocations }
  if (result.portfolio && result.allocations) {
    return result;
  }

  // Old anim-main format: { portfolioData, weightsData }
  if (result.portfolioData && result.weightsData) {
    return {
      portfolio: result.portfolioData,
      allocations: result.weightsData
    };
  }

  // Fallback: assume it's just the portfolio array
  if (Array.isArray(result)) {
    return { portfolio: result, allocations: [] };
  }

  // Unknown format
  console.warn('Unknown strategy return format:', result);
  return { portfolio: [], allocations: [] };
}

// ═══════════════════════════════════════════════════════════════
// Strategy Wrappers (Exported to portfolioCacheService.js)
// ═══════════════════════════════════════════════════════════════

/**
 * Strategy 1: Equal Weight Portfolio
 * Simple 33.3% allocation to each ETF with quarterly rebalancing
 * @returns {Object} { portfolio: [{date, value}], allocations: [{date, SPY, IEF, GLD, EFA, EEM, CASH}] }
 */
function calculateEqualWeight(priceData) {
  const result = _calculateEqualWeight(priceData);
  return normalizeReturnFormat(result);
}

/**
 * Strategy 1b: 60/40 Portfolio (60% SPY / 40% IEF)
 * @returns {Object} { portfolio: [{date, value}], allocations: [{date, SPY, IEF, GLD, EFA, EEM, CASH}] }
 */
function calculateSixtyForty(priceData) {
  const result = _calculateSixtyForty(priceData);
  return normalizeReturnFormat(result);
}

/**
 * Strategy 2: Simple Risk Parity
 * Inverse volatility weighting with monthly rebalancing
 * DAILY DATA: lookbackDays=60 (3 months), rebalanceDays=21 (monthly)
 * Based on anim-main implementation with explicit annualization
 * @returns {Object} { portfolio: [{date, value}], allocations: [{date, SPY, IEF, GLD, EFA, EEM, CASH}] }
 */
function calculateSimpleRiskParity(priceData, lookbackDays = 60, rebalanceDays = 21) {
  const result = _calculateSimpleRiskParity(priceData, rebalanceDays, lookbackDays);
  return normalizeReturnFormat(result);
}

/**
 * Strategy 3: Optimized Risk Parity (Enhanced Risk Parity with EWMA + Correlation)
 * This strategy uses:
 * - Multi-horizon EWMA volatility estimation (21, 60, 252 days)
 * - Correlation-adjusted weighting to penalize highly correlated assets
 * - Monthly rebalancing (21 days)
 *
 * NOTE: This is the "Optimized Risk Parity" from BubbleLaunch's perspective,
 * which maps to "Enhanced Risk Parity" from anim-main.
 *
 * @returns {Object} { portfolio: [{date, value}], allocations: [{date, SPY, IEF, GLD, EFA, EEM, CASH}] }
 */
function calculateOptimizedRiskParity(
  priceData,
  strategySeries = null,
  allocationData = null,
  tickers = ['SPY', 'IEF', 'GLD', 'EFA', 'EEM', 'CASH']
) {
  // If called without strategy series (e.g., standalone test), fall back to Enhanced RP
  if (!strategySeries || Object.keys(strategySeries).length < 2) {
    console.warn('⚠️  Optimizer requires pre-calculated strategy series. Falling back to Enhanced Risk Parity.');
    const result = _calculateEnhancedRiskParity(priceData);
    return normalizeReturnFormat(result);
  }

  // Run optimizer to find best mix (maximize return with volatility constraint)
  const result = findOptimalMix(
    priceData,
    strategySeries,
    allocationData || {},
    tickers,
    'annualReturn',  // Maximize annual return
    15.0             // Max volatility constraint: 15%
  );

  return normalizeReturnFormat(result);
}

/**
 * Strategy 4: Hierarchical Risk Parity (Machine Learning Clustering)
 * Uses hierarchical clustering to group similar assets, then applies risk parity allocation
 *
 * NOTE: BubbleLaunch's "Minimum Variance Weights" maps to anim-main's "Hierarchical Risk Parity"
 *
 * @returns {Object} { portfolio: [{date, value}], allocations: [{date, SPY, IEF, GLD, EFA, EEM, CASH}] }
 */
function calculateMinimumVarianceWeights(priceData, lookbackDays = 252, rebalanceDays = 21) {
  const result = _calculateHierarchicalRiskParityPortfolio(priceData, rebalanceDays, lookbackDays);
  return normalizeReturnFormat(result);
}

/**
 * Strategy 5: Optimized Risk Budgeting (True Risk Parity with Mathematical Optimization)
 * Uses gradient descent or CCD optimization to achieve equal risk contributions from all assets
 *
 * @returns {Object} { portfolio: [{date, value}], allocations: [{date, SPY, IEF, GLD, EFA, EEM, CASH}] }
 */
function calculateOptimizedRiskBudgeting(priceData, lookbackPeriods = 252, rebalancePeriods = 21, optimizerOptions = {}) {
  // Extract optimization method from options
  const optimizationMethod = optimizerOptions.method || 'gradient_descent';

  const result = _calculateOptimizedRiskBudgeting(
    priceData,
    rebalancePeriods,
    lookbackPeriods,
    optimizationMethod
  );
  return normalizeReturnFormat(result);
}

/**
 * Strategy 6: Enhanced Risk Parity with DCC (Dynamic Conditional Correlation)
 * Advanced correlation modeling with EWMA volatility and correlation penalty
 *
 * NOTE: This strategy is NOT yet ported from anim-main.
 * Keeping the original BubbleLaunch implementation for now.
 *
 * @returns {Object} { portfolio: [{date, value}], allocations: [{date, SPY, IEF, GLD, EFA, EEM, CASH}] }
 */
function calculateEnhancedRiskParityWithDCC(
  priceData,
  volatilityLookback = 126,
  correlationLookback = 126,
  rebalancePeriods = 21,
  correlationPenaltyFactor = 0.5
) {
  const tickers = Object.keys(priceData);
  if (tickers.length === 0) return { portfolio: [], allocations: [] };

  const priceMap = {};
  const allDatesSet = new Set();

  tickers.forEach((ticker) => {
    priceMap[ticker] = new Map();
    priceData[ticker].forEach((point) => {
      if (point && point.date && typeof point.price === "number") {
        priceMap[ticker].set(point.date, point.price);
        allDatesSet.add(point.date);
      }
    });
  });

  const allDates = Array.from(allDatesSet).sort();
  if (!allDates.length) return { portfolio: [], allocations: [] };

  let currentWeights = Object.fromEntries(
    tickers.map((ticker) => [ticker, 1 / tickers.length])
  );
  const portfolio = [];
  const allocations = [];

  allDates.forEach((date, idx) => {
    const hasAllPrices = tickers.every((ticker) => priceMap[ticker].has(date));
    if (!hasAllPrices) return;

    const shouldRebalance =
      idx >= volatilityLookback && idx % rebalancePeriods === 0;

    if (shouldRebalance) {
      const volatilities = {};
      tickers.forEach((ticker) => {
        const returns = [];
        for (
          let i = Math.max(0, idx - volatilityLookback);
          i < idx;
          i++
        ) {
          const prevDate = allDates[i];
          const nextDate = allDates[i + 1];
          if (!nextDate) continue;

          const prevPrice = priceMap[ticker].get(prevDate);
          const nextPrice = priceMap[ticker].get(nextDate);
          if (prevPrice && nextPrice && prevPrice > 0) {
            returns.push((nextPrice - prevPrice) / prevPrice);
          }
        }

        if (returns.length >= Math.max(volatilityLookback * 0.5, 8)) {
          const ewmaVol = calculateEWMAVolatility(returns, 0.94);
          volatilities[ticker] = Math.max(ewmaVol, 0.05);
        } else {
          volatilities[ticker] = 0.15;
        }
      });

      const avgCorrelations = {};
      tickers.forEach((ticker) => {
        const returns = [];
        for (
          let i = Math.max(0, idx - correlationLookback);
          i < idx;
          i++
        ) {
          const prevDate = allDates[i];
          const nextDate = allDates[i + 1];
          if (!nextDate) continue;

          const prevPrice = priceMap[ticker].get(prevDate);
          const nextPrice = priceMap[ticker].get(nextDate);
          if (prevPrice && nextPrice && prevPrice > 0) {
            returns.push((nextPrice - prevPrice) / prevPrice);
          }
        }

        const correlations = [];
        tickers.forEach((other) => {
          if (other === ticker) return;
          const otherReturns = [];
          for (
            let i = Math.max(0, idx - correlationLookback);
            i < idx;
            i++
          ) {
            const prevDate = allDates[i];
            const nextDate = allDates[i + 1];
            if (!nextDate) continue;

            const prevPrice = priceMap[other].get(prevDate);
            const nextPrice = priceMap[other].get(nextDate);
            if (prevPrice && nextPrice && prevPrice > 0) {
              otherReturns.push((nextPrice - prevPrice) / prevPrice);
            }
          }

          const n = Math.min(returns.length, otherReturns.length);
          if (n >= Math.max(correlationLookback * 0.5, 8)) {
            const corr = calculateCorrelation(
              returns.slice(0, n),
              otherReturns.slice(0, n)
            );
            if (!Number.isNaN(corr)) {
              correlations.push(Math.abs(corr));
            }
          }
        });

        avgCorrelations[ticker] =
          correlations.length > 0
            ? correlations.reduce((sum, val) => sum + val, 0) /
              correlations.length
            : 0;
      });

      const weights = {};
      let weightSum = 0;
      tickers.forEach((ticker) => {
        const invVol = 1 / volatilities[ticker];
        const penalty = 1 + correlationPenaltyFactor * avgCorrelations[ticker];
        const adjusted = invVol / penalty;
        weights[ticker] = adjusted;
        weightSum += adjusted;
      });

      if (weightSum > 0) {
        currentWeights = {};
        tickers.forEach((ticker) => {
          currentWeights[ticker] = weights[ticker] / weightSum;
        });
      }
    }

    let value = 0;
    tickers.forEach((ticker) => {
      value += currentWeights[ticker] * priceMap[ticker].get(date);
    });
    portfolio.push({ date, value });

    // Store allocation weights
    allocations.push({
      date,
      ...currentWeights
    });
  });

  return { portfolio, allocations };
}

/**
 * Strategy 7: Regime-Aware Risk Parity
 * Adaptive risk parity that adjusts parameters based on market regime detection
 *
 * Detects market regimes across three dimensions:
 * - Volatility: Low/Medium/High based on annualized volatility
 * - Trend: Bull/Bear/Sideways based on moving averages
 * - Crisis: Normal/Stress/Crisis based on correlation + volatility
 *
 * Adjusts these parameters based on regime:
 * - EWMA lambda (volatility responsiveness)
 * - Rebalancing frequency (5-27 days)
 * - Correlation penalty (0.5-1.0)
 *
 * @returns {Object} { portfolio: [{date, value}], allocations: [{date, SPY, IEF, GLD, EFA, EEM, CASH}] }
 */
function calculateRegimeAwareRiskParity(priceData, baseRebalanceFreqDays = 21, baseLookbackDays = 60) {
  const result = _calculateRegimeAwareRiskParity(priceData, baseRebalanceFreqDays, baseLookbackDays);
  return normalizeReturnFormat(result);
}

/**
 * Strategy 8: Momentum
 * Allocates more to assets with higher recent returns (100-day momentum)
 *
 * - Calculates 100-day return for each asset
 * - Allocates proportionally to positive momentum (declining assets get 0%)
 * - Enforces constraints: minimum 2% per asset, maximum 30% per asset
 * - Monthly rebalancing (21 days)
 *
 * @returns {Object} { portfolio: [{date, value}], allocations: [{date, SPY, IEF, GLD, EFA, EEM, CASH}] }
 */
function calculateMomentum(priceData, lookbackDays = 100, rebalanceDays = 21, minWeight = 0.02, maxWeight = 0.30) {
  const result = _calculateMomentum(priceData, lookbackDays, rebalanceDays, minWeight, maxWeight);
  return normalizeReturnFormat(result);
}

// ═══════════════════════════════════════════════════════════════
// Module Exports
// ═══════════════════════════════════════════════════════════════

module.exports = {
  // Strategy calculation functions (used by portfolioCacheService.js)
  calculateEqualWeight,
  calculateSixtyForty,
  calculateSimpleRiskParity,
  calculateOptimizedRiskParity,
  calculateMinimumVarianceWeights,
  calculateOptimizedRiskBudgeting,
  calculateEnhancedRiskParityWithDCC,
  calculateRegimeAwareRiskParity,
  calculateMomentum,

  // Helper functions (used by strategies and metrics calculation)
  calculateMetrics,
  applyLeverageToPortfolio,

  // Utility functions (exposed for testing)
  calculateReturns,
  calculateStdDev,
  calculateEWMAVolatility,
  calculateCorrelation,
};
