/**
 * Portfolio Calculation Helper Functions
 * Pure mathematical utilities for portfolio analysis
 *
 * Ported from anim-main project with CommonJS compatibility
 * No external dependencies - pure JavaScript implementations
 */

/**
 * Calculate returns from price data
 * @param {Array} prices - Array of {date, price} objects or {price} objects
 * @returns {Array} Array of daily returns
 */
function calculateReturns(prices) {
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    const returnValue = (prices[i].price - prices[i - 1].price) / prices[i - 1].price;
    returns.push(returnValue);
  }
  return returns;
}

/**
 * Calculate standard deviation (volatility) from returns
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
 * Calculate EWMA (Exponentially Weighted Moving Average) volatility
 * This is a more reactive volatility measure than standard deviation,
 * giving more weight to recent observations.
 *
 * @param {Array} returns - Array of returns
 * @param {number} lambda - Decay factor (default: 0.94)
 *                         Higher lambda = more weight on historical data
 *                         Lower lambda = more reactive to recent changes
 * @returns {number} EWMA volatility (daily, not annualized)
 */
function calculateEWMAVolatility(returns, lambda = 0.94) {
  if (returns.length === 0) {
    return 0.15; // Default fallback
  }

  if (returns.length === 1) {
    return Math.abs(returns[0]) * Math.sqrt(252); // Annualize single return
  }

  // Initialize with first squared return
  let variance = returns[0] ** 2;

  // Iterate through returns to calculate EWMA variance
  for (let i = 1; i < returns.length; i++) {
    variance = lambda * variance + (1 - lambda) * (returns[i] ** 2);
  }

  // Convert to annualized volatility
  return Math.sqrt(variance * 252);
}

/**
 * Calculate Pearson correlation coefficient between two return series
 * Measures the linear relationship between two variables (-1 to +1)
 *
 * @param {Array} x - First return series
 * @param {Array} y - Second return series
 * @returns {number} Correlation coefficient between -1 and 1
 */
function calculatePearsonCorrelation(x, y) {
  if (x.length !== y.length || x.length === 0) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * Calculate Pearson correlation (alternative implementation using deviations)
 * This is the implementation from the current portfolioService.js
 *
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

/**
 * Calculate full correlation matrix for multiple return series
 * Builds an n x n matrix of correlations between all ticker pairs
 *
 * @param {Object} returnsSeries - Object mapping tickers to return arrays
 *                                 Example: { 'SPY': [0.01, 0.02, ...], 'IEF': [0.005, -0.001, ...] }
 * @returns {Object} Correlation matrix as nested object
 *                   Example: { 'SPY': { 'SPY': 1.0, 'IEF': 0.3 }, 'IEF': { 'SPY': 0.3, 'IEF': 1.0 } }
 */
function calculateCorrelationMatrix(returnsSeries) {
  const tickers = Object.keys(returnsSeries);
  const correlationMatrix = {};

  tickers.forEach(ticker1 => {
    correlationMatrix[ticker1] = {};
    tickers.forEach(ticker2 => {
      if (ticker1 === ticker2) {
        correlationMatrix[ticker1][ticker2] = 1.0;
      } else {
        const returns1 = returnsSeries[ticker1];
        const returns2 = returnsSeries[ticker2];
        const correlation = calculatePearsonCorrelation(returns1, returns2);
        correlationMatrix[ticker1][ticker2] = correlation;
      }
    });
  });

  return correlationMatrix;
}

/**
 * Calculate average correlation for each ticker against all others
 * Useful for correlation-adjusted risk parity weighting
 *
 * @param {Object} returnsSeries - Object mapping tickers to return arrays
 * @returns {Object} Average correlations per ticker
 *                   Example: { 'SPY': 0.45, 'IEF': 0.30, 'GLD': 0.25 }
 */
function calculateAverageCorrelations(returnsSeries) {
  const tickers = Object.keys(returnsSeries);
  const avgCorrelations = {};

  tickers.forEach(ticker => {
    const otherCorrelations = [];

    tickers.forEach(otherTicker => {
      if (ticker !== otherTicker) {
        const corr = calculatePearsonCorrelation(
          returnsSeries[ticker],
          returnsSeries[otherTicker]
        );
        if (!isNaN(corr)) {
          otherCorrelations.push(Math.abs(corr)); // Use absolute correlation
        }
      }
    });

    if (otherCorrelations.length > 0) {
      avgCorrelations[ticker] = otherCorrelations.reduce((sum, val) => sum + val, 0) / otherCorrelations.length;
    } else {
      avgCorrelations[ticker] = 0.0;
    }
  });

  return avgCorrelations;
}

/**
 * Calculate multi-horizon EWMA volatility
 * Combines short-term, medium-term, and long-term volatility estimates
 *
 * @param {Array} returns21 - 21-day return series (short-term)
 * @param {Array} returns60 - 60-day return series (medium-term)
 * @param {Array} returns252 - 252-day return series (long-term)
 * @param {number} lambda - EWMA decay factor (default: 0.94)
 * @returns {number} Combined multi-horizon volatility
 */
function calculateMultiHorizonVolatility(returns21, returns60, returns252, lambda = 0.94) {
  let vol21 = null, vol60 = null, vol252 = null;

  // Calculate EWMA volatilities for each horizon
  if (returns21 && returns21.length >= 15) {
    vol21 = calculateEWMAVolatility(returns21, lambda);
  }
  if (returns60 && returns60.length >= 20) {
    vol60 = calculateEWMAVolatility(returns60, lambda);
  }
  if (returns252 && returns252.length >= 100) {
    vol252 = calculateEWMAVolatility(returns252, lambda);
  }

  // Combine volatilities using weighted approach
  // Weights: 20% short-term, 50% medium-term, 30% long-term
  let finalVolatility;
  if (vol21 !== null && vol60 !== null && vol252 !== null) {
    finalVolatility = 0.2 * vol21 + 0.5 * vol60 + 0.3 * vol252;
  } else if (vol60 !== null && vol252 !== null) {
    finalVolatility = 0.6 * vol60 + 0.4 * vol252;
  } else if (vol60 !== null) {
    finalVolatility = vol60;
  } else {
    finalVolatility = 0.15; // Default fallback
  }

  return Math.max(finalVolatility, 0.05); // Floor at 5% annual volatility
}

/**
 * Calculate covariance between two return series
 * Covariance measures how two variables move together
 *
 * @param {Array} returns1 - First return series
 * @param {Array} returns2 - Second return series
 * @returns {number} Covariance value
 */
function calculateCovariance(returns1, returns2) {
  const n = Math.min(returns1.length, returns2.length);
  if (n === 0) return 0;

  const mean1 = returns1.slice(0, n).reduce((sum, r) => sum + r, 0) / n;
  const mean2 = returns2.slice(0, n).reduce((sum, r) => sum + r, 0) / n;

  let covariance = 0;
  for (let i = 0; i < n; i++) {
    covariance += (returns1[i] - mean1) * (returns2[i] - mean2);
  }

  return covariance / Math.max(1, n - 1); // Unbiased estimator (n-1)
}

/**
 * Calculate covariance matrix for multiple return series
 * Builds an n x n matrix of covariances between all ticker pairs
 *
 * @param {Object} returnsSeries - Object mapping tickers to return arrays
 * @returns {Array} 2D covariance matrix (array of arrays)
 */
function calculateCovarianceMatrix(returnsSeries, tickers) {
  const n = tickers.length;
  const covMatrix = Array(n).fill(0).map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const returns1 = returnsSeries[tickers[i]];
      const returns2 = returnsSeries[tickers[j]];
      covMatrix[i][j] = calculateCovariance(returns1, returns2);
    }
  }

  return covMatrix;
}

/**
 * Annualize daily volatility to annual volatility
 * @param {number} dailyVol - Daily volatility
 * @param {number} periodsPerYear - Number of trading periods per year (default: 252)
 * @returns {number} Annualized volatility
 */
function annualizeVolatility(dailyVol, periodsPerYear = 252) {
  return dailyVol * Math.sqrt(periodsPerYear);
}

/**
 * Annualize daily return to annual return (using geometric compounding)
 * @param {number} dailyReturn - Daily return (e.g., 0.01 = 1%)
 * @param {number} periodsPerYear - Number of trading periods per year (default: 252)
 * @returns {number} Annualized return
 */
function annualizeReturn(dailyReturn, periodsPerYear = 252) {
  return Math.pow(1 + dailyReturn, periodsPerYear) - 1;
}

/**
 * Calculate inverse volatility weights for risk parity
 * Allocates inversely proportional to volatility (more to lower vol assets)
 *
 * @param {Object} volatilities - Object mapping tickers to volatilities
 * @returns {Object} Normalized weights summing to 1
 */
function calculateInverseVolatilityWeights(volatilities) {
  const tickers = Object.keys(volatilities);
  const invVols = {};

  // Calculate inverse volatilities
  tickers.forEach(ticker => {
    invVols[ticker] = 1.0 / volatilities[ticker];
  });

  // Normalize to sum to 1
  const totalInvVol = Object.values(invVols).reduce((sum, val) => sum + val, 0);
  const weights = {};

  if (totalInvVol > 0) {
    tickers.forEach(ticker => {
      weights[ticker] = invVols[ticker] / totalInvVol;
    });
  } else {
    // Fallback to equal weights
    tickers.forEach(ticker => {
      weights[ticker] = 1.0 / tickers.length;
    });
  }

  return weights;
}

/**
 * Normalize weights to sum to 1.0
 * @param {Object} weights - Object mapping tickers to weights
 * @returns {Object} Normalized weights
 */
function normalizeWeights(weights) {
  const tickers = Object.keys(weights);
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);

  if (total === 0) {
    // Return equal weights if total is zero
    const equalWeight = 1.0 / tickers.length;
    return Object.fromEntries(tickers.map(t => [t, equalWeight]));
  }

  const normalized = {};
  tickers.forEach(ticker => {
    normalized[ticker] = weights[ticker] / total;
  });

  return normalized;
}

// Export all helper functions
module.exports = {
  // Basic calculations
  calculateReturns,
  calculateStdDev,
  calculateEWMAVolatility,

  // Correlation functions
  calculatePearsonCorrelation,
  calculateCorrelation, // Alternative implementation
  calculateCorrelationMatrix,
  calculateAverageCorrelations,

  // Covariance functions
  calculateCovariance,
  calculateCovarianceMatrix,

  // Multi-horizon volatility
  calculateMultiHorizonVolatility,

  // Annualization utilities
  annualizeVolatility,
  annualizeReturn,

  // Weight calculation utilities
  calculateInverseVolatilityWeights,
  normalizeWeights
};
