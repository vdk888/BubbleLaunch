/**
 * Portfolio Calculation Service
 * Simplified version of anim-main portfolio strategies
 *
 * Implements 3 strategies:
 * 1. Equal Weight - Simple 33.3% allocation
 * 2. Simple Risk Parity - Inverse volatility weighting
 * 3. Optimized Risk Parity - EWMA volatility + correlation adjustment
 */

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

function calculateFixedWeightPortfolio(priceData, weights) {
  const tickers = Object.keys(priceData);
  if (tickers.length === 0) return [];

  // Normalize weights (ignore tickers not present)
  const filteredWeights = {};
  let weightSum = 0;

  for (const ticker of tickers) {
    if (weights[ticker] !== undefined) {
      filteredWeights[ticker] = weights[ticker];
      weightSum += weights[ticker];
    }
  }

  if (weightSum === 0) {
    return [];
  }

  // Normalize weights to sum to 1
  for (const ticker of Object.keys(filteredWeights)) {
    filteredWeights[ticker] = filteredWeights[ticker] / weightSum;
  }

  const baseTicker = tickers[0];
  const allDates = priceData[baseTicker].map((p) => p.date);
  const portfolio = [];

  for (const date of allDates) {
    let portfolioValue = 0;
    let hasAllPrices = true;

    for (const [ticker, weight] of Object.entries(filteredWeights)) {
      const dataPoint = priceData[ticker].find((p) => p.date === date);
      if (!dataPoint) {
        hasAllPrices = false;
        break;
      }
      portfolioValue += weight * dataPoint.price;
    }

    if (hasAllPrices) {
      portfolio.push({ date, value: portfolioValue });
    }
  }

  return portfolio;
}

/**
 * Strategy 1: Equal Weight Portfolio
 * Simple 33.3% allocation to each ETF with quarterly rebalancing
 */
function calculateEqualWeight(priceData) {
  const tickers = Object.keys(priceData);
  if (tickers.length === 0) return [];

  const equalWeight = 1.0 / tickers.length;
  const weights = Object.fromEntries(tickers.map((ticker) => [ticker, equalWeight]));

  return calculateFixedWeightPortfolio(priceData, weights);
}

/**
 * Strategy 1b: 60/40 Portfolio (60% SPY / 40% IEF)
 */
function calculateSixtyForty(priceData) {
  return calculateFixedWeightPortfolio(priceData, {
    SPY: 0.6,
    IEF: 0.4,
  });
}

/**
 * Strategy 2: Simple Risk Parity
 * Inverse volatility weighting with monthly rebalancing
 */
function calculateSimpleRiskParity(priceData, lookbackDays = 60, rebalanceDays = 21) {
  const tickers = Object.keys(priceData);
  const allDates = priceData[tickers[0]].map(p => p.date);

  // Calculate returns for each ticker
  const returnsData = {};
  for (const ticker of tickers) {
    returnsData[ticker] = calculateReturns(priceData[ticker]);
  }

  const portfolio = [];
  let lastWeights = null;

  for (let i = 0; i < allDates.length; i++) {
    const date = allDates[i];

    // Rebalance every rebalanceDays
    if (i % rebalanceDays === 0 && i >= lookbackDays) {
      // Calculate volatilities using recent history
      const volatilities = {};

      for (const ticker of tickers) {
        const recentReturns = returnsData[ticker].slice(Math.max(0, i - lookbackDays), i);
        volatilities[ticker] = calculateStdDev(recentReturns);
      }

      // Calculate inverse volatility weights
      const weights = {};
      const sumInvVol = tickers.reduce((sum, ticker) => sum + 1 / volatilities[ticker], 0);

      for (const ticker of tickers) {
        weights[ticker] = (1 / volatilities[ticker]) / sumInvVol;
      }

      lastWeights = weights;
    }

    // Use equal weight until first rebalancing
    const weights = lastWeights || Object.fromEntries(tickers.map(t => [t, 1 / tickers.length]));

    // Calculate portfolio value
    let portfolioValue = 0;
    let hasAllPrices = true;

    for (const ticker of tickers) {
      const dataPoint = priceData[ticker][i];
      if (!dataPoint) {
        hasAllPrices = false;
        break;
      }
      portfolioValue += weights[ticker] * dataPoint.price;
    }

    if (hasAllPrices) {
      portfolio.push({ date, value: portfolioValue });
    }
  }

  return portfolio;
}

/**
 * Strategy 3: Optimized Risk Parity
 * EWMA volatility + correlation adjustment with monthly rebalancing
 */
function calculateOptimizedRiskParity(priceData, lookbackDays = 60, rebalanceDays = 21) {
  const tickers = Object.keys(priceData);
  const allDates = priceData[tickers[0]].map(p => p.date);

  // Calculate returns for each ticker
  const returnsData = {};
  for (const ticker of tickers) {
    returnsData[ticker] = calculateReturns(priceData[ticker]);
  }

  const portfolio = [];
  let lastWeights = null;

  for (let i = 0; i < allDates.length; i++) {
    const date = allDates[i];

    // Rebalance every rebalanceDays
    if (i % rebalanceDays === 0 && i >= lookbackDays) {
      // Calculate EWMA volatilities
      const volatilities = {};

      for (const ticker of tickers) {
        const recentReturns = returnsData[ticker].slice(Math.max(0, i - lookbackDays), i);
        volatilities[ticker] = calculateEWMAVolatility(recentReturns, 0.94);
      }

      // Calculate average correlation for each ticker
      const avgCorrelations = {};

      for (const ticker of tickers) {
        const correlations = [];

        for (const otherTicker of tickers) {
          if (ticker !== otherTicker) {
            const recentReturns1 = returnsData[ticker].slice(Math.max(0, i - lookbackDays), i);
            const recentReturns2 = returnsData[otherTicker].slice(Math.max(0, i - lookbackDays), i);
            const corr = calculateCorrelation(recentReturns1, recentReturns2);
            correlations.push(Math.abs(corr));
          }
        }

        avgCorrelations[ticker] = correlations.reduce((sum, c) => sum + c, 0) / correlations.length;
      }

      // Calculate weights: w_i = (1/vol_i) * (1 - avg_corr_i * penalty)
      const correlationPenalty = 0.5;
      const weights = {};
      let sumWeights = 0;

      for (const ticker of tickers) {
        const invVol = 1 / volatilities[ticker];
        const corrAdjustment = 1 - avgCorrelations[ticker] * correlationPenalty;
        weights[ticker] = invVol * corrAdjustment;
        sumWeights += weights[ticker];
      }

      // Normalize weights
      for (const ticker of tickers) {
        weights[ticker] /= sumWeights;
      }

      lastWeights = weights;
    }

    // Use equal weight until first rebalancing
    const weights = lastWeights || Object.fromEntries(tickers.map(t => [t, 1 / tickers.length]));

    // Calculate portfolio value
    let portfolioValue = 0;
    let hasAllPrices = true;

    for (const ticker of tickers) {
      const dataPoint = priceData[ticker][i];
      if (!dataPoint) {
        hasAllPrices = false;
        break;
      }
      portfolioValue += weights[ticker] * dataPoint.price;
    }

    if (hasAllPrices) {
      portfolio.push({ date, value: portfolioValue });
    }
  }

  return portfolio;
}

/**
 * Calculate performance metrics
 * @param {Array} portfolio - Portfolio values over time
 * @returns {Object} Performance metrics
 */
function calculateMetrics(portfolio) {
  if (portfolio.length === 0) {
    return { totalReturn: 0, annualReturn: 0, volatility: 0, sharpeRatio: 0, maxDrawdown: 0 };
  }

  const startValue = portfolio[0].value;
  const endValue = portfolio[portfolio.length - 1].value;
  const totalReturn = (endValue - startValue) / startValue;

  // Calculate daily returns
  const returns = [];
  for (let i = 1; i < portfolio.length; i++) {
    returns.push((portfolio[i].value - portfolio[i - 1].value) / portfolio[i - 1].value);
  }

  // Annualized metrics (assuming ~252 trading days per year)
  const years = portfolio.length / 252;
  const annualReturn = Math.pow(1 + totalReturn, 1 / years) - 1;
  const volatility = calculateStdDev(returns) * Math.sqrt(252);

  // Sharpe ratio (assuming 2% risk-free rate)
  const riskFreeRate = 0.02;
  const sharpeRatio = volatility > 0 ? (annualReturn - riskFreeRate) / volatility : 0;

  // Maximum drawdown
  let maxDrawdown = 0;
  let peak = portfolio[0].value;

  for (const point of portfolio) {
    if (point.value > peak) {
      peak = point.value;
    }
    const drawdown = (point.value - peak) / peak;
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return {
    totalReturn,
    annualReturn,
    volatility,
    sharpeRatio,
    maxDrawdown,
  };
}

module.exports = {
  calculateFixedWeightPortfolio,
  calculateEqualWeight,
  calculateSixtyForty,
  calculateSimpleRiskParity,
  calculateOptimizedRiskParity,
  calculateMetrics,
};
