const riskBudgetingService = require("./riskBudgetingService");

/**
 * Portfolio Calculation Service
 * Simplified version of anim-main portfolio strategies
 *
 * Implements core strategies:
 * 1. Equal Weight - Simple 33.3% allocation
 * 2. 60/40 Portfolio - 60% equities (SPY), 40% bonds (IEF)
 * 3. Simple Risk Parity - Inverse volatility weighting
 * 4. Optimized Risk Parity - EWMA volatility + correlation adjustment
 * 5. Momentum Tilt - Return-weighted allocation favouring recent winners
 * 6. Hierarchical Risk Parity (Simplified minimum variance approximation)
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

function solveLinearSystem(matrix, vector, tolerance = 1e-12) {
  const n = matrix.length;
  if (vector.length !== n) {
    throw new Error("Matrix and vector dimensions must match for solving linear system");
  }

  // Build augmented matrix [matrix | vector]
  const augmented = matrix.map((row, i) => [...row, vector[i]]);

  for (let col = 0; col < n; col++) {
    // Partial pivoting
    let pivotRow = col;
    let maxVal = Math.abs(augmented[col][col]);
    for (let row = col + 1; row < n; row++) {
      const candidate = Math.abs(augmented[row][col]);
      if (candidate > maxVal) {
        maxVal = candidate;
        pivotRow = row;
      }
    }

    if (maxVal < tolerance) {
      return null; // Singular matrix
    }

    if (pivotRow !== col) {
      [augmented[col], augmented[pivotRow]] = [augmented[pivotRow], augmented[col]];
    }

    // Normalize pivot row
    const pivot = augmented[col][col];
    for (let j = col; j <= n; j++) {
      augmented[col][j] /= pivot;
    }

    // Eliminate column entries in other rows
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = augmented[row][col];
      if (Math.abs(factor) < tolerance) continue;

      for (let j = col; j <= n; j++) {
        augmented[row][j] -= factor * augmented[col][j];
      }
    }
  }

  return augmented.map((row) => row[n]);
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

function calculateMomentumTilt(priceData, lookbackDays = 52, rebalanceDays = 4) {
  const tickers = Object.keys(priceData);
  if (tickers.length === 0) return [];

  const allDates = priceData[tickers[0]].map((p) => p.date);
  const portfolio = [];
  let currentWeights = Object.fromEntries(tickers.map((ticker) => [ticker, 1 / tickers.length]));

  for (let i = 0; i < allDates.length; i++) {
    if (i >= lookbackDays && i % rebalanceDays === 0) {
      const trailingReturns = {};
      let totalPositive = 0;

      tickers.forEach((ticker) => {
        const currentPoint = priceData[ticker][i];
        const pastPoint = priceData[ticker][i - lookbackDays];
        if (!currentPoint || !pastPoint || pastPoint.price === 0) {
          trailingReturns[ticker] = 0;
          return;
        }
        const momentum = (currentPoint.price - pastPoint.price) / pastPoint.price;
        const positiveMomentum = Math.max(momentum, 0);
        trailingReturns[ticker] = positiveMomentum;
        totalPositive += positiveMomentum;
      });

      if (totalPositive === 0) {
        currentWeights = Object.fromEntries(tickers.map((ticker) => [ticker, 1 / tickers.length]));
      } else {
        currentWeights = Object.fromEntries(
          tickers.map((ticker) => [ticker, trailingReturns[ticker] / totalPositive])
        );
      }
    }

    let portfolioValue = 0;
    let hasAllPrices = true;

    tickers.forEach((ticker) => {
      const dataPoint = priceData[ticker][i];
      if (!dataPoint) {
        hasAllPrices = false;
        return;
      }
      const weight = currentWeights[ticker] ?? 0;
      portfolioValue += weight * dataPoint.price;
    });

    if (hasAllPrices) {
      portfolio.push({ date: allDates[i], value: portfolioValue });
    }
  }

  return portfolio;
}

function calculateMomentumTilt(priceData, lookbackDays = 52, rebalanceDays = 4) {
  const tickers = Object.keys(priceData);
  if (tickers.length === 0) return [];

  const allDates = priceData[tickers[0]].map((p) => p.date);
  const portfolio = [];
  let currentWeights = Object.fromEntries(tickers.map((ticker) => [ticker, 1 / tickers.length]));

  for (let i = 0; i < allDates.length; i++) {
    const date = allDates[i];

    if (i >= lookbackDays && i % rebalanceDays === 0) {
      // Calculate trailing returns over lookback window
      const trailingReturns = {};
      let totalPositive = 0;
      tickers.forEach((ticker) => {
        const currentPrice = priceData[ticker][i]?.price;
        const pastPrice = priceData[ticker][i - lookbackDays]?.price;
        if (!currentPrice || !pastPrice || pastPrice === 0) {
          trailingReturns[ticker] = 0;
          return;
        }
        const returnValue = (currentPrice - pastPrice) / pastPrice;
        // Use only positive momentum; floor at zero
        const positive = Math.max(returnValue, 0);
        trailingReturns[ticker] = positive;
        totalPositive += positive;
      });

      const weights = {};
      if (totalPositive === 0) {
        tickers.forEach((ticker) => {
          weights[ticker] = 1 / tickers.length;
        });
      } else {
        tickers.forEach((ticker) => {
          weights[ticker] = trailingReturns[ticker] / totalPositive;
        });
      }

      currentWeights = weights;
    }

    const value = tickers.reduce((sum, ticker) => {
      const point = priceData[ticker][i];
      if (!point || currentWeights[ticker] === undefined) return sum;
      return sum + currentWeights[ticker] * point.price;
    }, 0);

    if (value) {
      portfolio.push({ date, value });
    }
  }

  return portfolio;
}

function calculateMinimumVarianceWeights(priceData, lookbackDays = 52, rebalanceDays = 4) {
  const tickers = Object.keys(priceData);
  if (tickers.length === 0) return [];

  const allDates = priceData[tickers[0]].map((p) => p.date);
  const returnsData = {};
  tickers.forEach((ticker) => {
    returnsData[ticker] = calculateReturns(priceData[ticker]);
  });

  const portfolio = [];
  let currentWeights = Object.fromEntries(tickers.map((t) => [t, 1 / tickers.length]));

  for (let i = 0; i < allDates.length; i++) {
    const date = allDates[i];

    if (i >= lookbackDays && i % rebalanceDays === 0) {
      const windowReturns = tickers.map((ticker) =>
        returnsData[ticker].slice(Math.max(0, i - lookbackDays), i)
      );

      const length = Math.min(...windowReturns.map((series) => series.length));
      if (length >= tickers.length && length > 0) {
        const trimmedReturns = windowReturns.map((series) =>
          series.slice(series.length - length)
        );
        const means = trimmedReturns.map((series) => {
          return series.reduce((sum, value) => sum + value, 0) / length;
        });

        const covMatrix = tickers.map(() => Array(tickers.length).fill(0));
        for (let a = 0; a < tickers.length; a++) {
          for (let b = 0; b < tickers.length; b++) {
            let sum = 0;
            for (let k = 0; k < length; k++) {
              const centeredA = trimmedReturns[a][k] - means[a];
              const centeredB = trimmedReturns[b][k] - means[b];
              sum += centeredA * centeredB;
            }
            const denominator = Math.max(1, length - 1);
            covMatrix[a][b] = sum / denominator;
          }
        }

        // Apply small diagonal regularization to improve numerical stability
        const regularization = 1e-6;
        for (let d = 0; d < tickers.length; d++) {
          covMatrix[d][d] += regularization;
        }

        const ones = Array(tickers.length).fill(1);
        const weightsVector = solveLinearSystem(covMatrix, ones);

        if (weightsVector) {
          const weightSum = weightsVector.reduce((sum, value) => sum + value, 0);
          if (Math.abs(weightSum) > 1e-12) {
            currentWeights = {};
            tickers.forEach((ticker, idx) => {
              currentWeights[ticker] = weightsVector[idx] / weightSum;
            });
          }
        }
      }
    }

    const portfolioValue = tickers.reduce((sum, ticker) => {
      const point = priceData[ticker][i];
      if (!point || currentWeights[ticker] === undefined) return sum;
      return sum + currentWeights[ticker] * point.price;
    }, 0);

    if (portfolioValue) {
      portfolio.push({ date, value: portfolioValue });
    }
  }

  return portfolio;
}

/**
 * Strategy 2: Simple Risk Parity
 * Inverse volatility weighting with monthly rebalancing
 */
function calculateSimpleRiskParity(priceData, lookbackDays = 12, rebalanceDays = 4) {
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
        const vol = calculateStdDev(recentReturns);
        volatilities[ticker] = Math.max(vol, 1e-4);
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
 * Strategy 3: Optimized Momentum + Risk Parity
 * HYBRID APPROACH: 70% Momentum (12-month returns) + 30% Risk Parity (inverse volatility)
 *
 * This strategy combines:
 * - 12-month momentum scores to favor uptrending assets (70% weight)
 * - EWMA volatility weighting for risk control (30% weight)
 * - Monthly rebalancing (21 days)
 * - Works with 5 ETFs for global diversification
 *
 * Expected performance: Should beat Equal Weight by +10% or more over 20 years
 */
function calculateOptimizedRiskParity(priceData, momentumLookback = 52, volatilityLookback = 12, rebalanceDays = 4, momentumWeight = 0.7, rpWeight = 0.3) {
  const tickers = Object.keys(priceData);
  if (tickers.length === 0) return [];

  const allDates = priceData[tickers[0]].map(p => p.date);
  const portfolio = [];

  // Initialize with equal weights
  let currentWeights = Object.fromEntries(
    tickers.map(ticker => [ticker, 1.0 / tickers.length])
  );

  for (let i = 0; i < allDates.length; i++) {
    const date = allDates[i];

    // Rebalance check: need sufficient data and at rebalance interval
    const shouldRebalance = i >= momentumLookback && i % rebalanceDays === 0;

    if (shouldRebalance) {
      // ═══════════════════════════════════════════════════
      // STEP 1: Calculate 12-month momentum scores
      // ═══════════════════════════════════════════════════
      const momentumScores = {};
      let totalPositiveMomentum = 0;

      for (const ticker of tickers) {
        const currentPrice = priceData[ticker][i]?.price;
        const pastPrice = priceData[ticker][i - momentumLookback]?.price;

        if (currentPrice && pastPrice && pastPrice > 0) {
          // Calculate 12-month return
          const return12m = (currentPrice - pastPrice) / pastPrice;
          // Only use positive momentum (floor at 0)
          const positiveMomentum = Math.max(0, return12m);
          momentumScores[ticker] = positiveMomentum;
          totalPositiveMomentum += positiveMomentum;
        } else {
          momentumScores[ticker] = 0;
        }
      }

      // Normalize momentum scores to sum to 1
      const momentumWeights = {};
      if (totalPositiveMomentum > 0) {
        for (const ticker of tickers) {
          momentumWeights[ticker] = momentumScores[ticker] / totalPositiveMomentum;
        }
      } else {
        // Fallback: Equal weights if no positive momentum
        for (const ticker of tickers) {
          momentumWeights[ticker] = 1.0 / tickers.length;
        }
      }

      // ═══════════════════════════════════════════════════
      // STEP 2: Calculate EWMA volatilities
      // ═══════════════════════════════════════════════════
      const volatilities = {};

      for (const ticker of tickers) {
        // Get recent price data for volatility calculation
        const recentPrices = [];
        for (let j = Math.max(0, i - volatilityLookback); j < i; j++) {
          const price = priceData[ticker][j]?.price;
          if (price) {
            recentPrices.push({ price });
          }
        }

        if (recentPrices.length >= 20) {
          // Calculate returns
          const returns = calculateReturns(recentPrices);
          // Calculate EWMA volatility (daily) and annualize it for risk parity weighting
          const dailyVol = calculateEWMAVolatility(returns, 0.94);
          const annualizedVol = dailyVol * Math.sqrt(252); // Annualize using sqrt(252) trading days
          volatilities[ticker] = Math.max(annualizedVol, 0.05); // Floor at 5% annual vol
        } else {
          volatilities[ticker] = 0.15; // Default 15% if insufficient data
        }
      }

      // Calculate inverse volatility weights (risk parity)
      const invVolatilities = {};
      let totalInvVol = 0;

      for (const ticker of tickers) {
        invVolatilities[ticker] = 1.0 / volatilities[ticker];
        totalInvVol += invVolatilities[ticker];
      }

      // Normalize to sum to 1
      const riskParityWeights = {};
      for (const ticker of tickers) {
        riskParityWeights[ticker] = invVolatilities[ticker] / totalInvVol;
      }

      // ═══════════════════════════════════════════════════
      // STEP 3: Combine momentum and risk parity weights
      // ═══════════════════════════════════════════════════
      for (const ticker of tickers) {
        currentWeights[ticker] = momentumWeight * momentumWeights[ticker] + rpWeight * riskParityWeights[ticker];
      }

      // Log rebalancing (every ~1 year for debugging)
      if (i % (rebalanceDays * 12) === 0) {
        console.log(`Optimised Strategy Rebalancing on ${date}:`, currentWeights);
      }
    }

    // ═══════════════════════════════════════════════════
    // Calculate portfolio value using current weights
    // ═══════════════════════════════════════════════════
    let portfolioValue = 0;
    let hasAllPrices = true;

    for (const ticker of tickers) {
      const dataPoint = priceData[ticker][i];
      if (!dataPoint) {
        hasAllPrices = false;
        break;
      }
      portfolioValue += currentWeights[ticker] * dataPoint.price;
    }

    if (hasAllPrices) {
      portfolio.push({ date, value: portfolioValue });
    }
  }

  console.log(`Optimised Strategy (Momentum + Risk Parity): ${portfolio.length} data points`);
  return portfolio;
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

function calculateOptimizedRiskBudgeting(
  priceData,
  lookbackPeriods = 52,
  rebalancePeriods = 4,
  optimizerOptions = {}
) {
  const tickers = Object.keys(priceData);
  if (tickers.length === 0) return [];

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
  if (!allDates.length) return [];

  let currentWeights = Object.fromEntries(
    tickers.map((ticker) => [ticker, 1 / tickers.length])
  );

  const portfolio = [];

  allDates.forEach((date, idx) => {
    const hasAllPrices = tickers.every((ticker) => priceMap[ticker].has(date));
    if (!hasAllPrices) {
      return;
    }

    const shouldRebalance =
      idx >= lookbackPeriods && idx % rebalancePeriods === 0;

    if (shouldRebalance) {
      const returnsSeries = {};
      tickers.forEach((ticker) => {
        returnsSeries[ticker] = [];
      });

      const startIdx = Math.max(0, idx - lookbackPeriods);
      for (let i = startIdx; i < idx; i++) {
        const prevDate = allDates[i];
        const nextDate = allDates[i + 1];
        if (!nextDate) continue;

        const valid = tickers.every(
          (ticker) =>
            priceMap[ticker].has(prevDate) && priceMap[ticker].has(nextDate)
        );
        if (!valid) continue;

        tickers.forEach((ticker) => {
          const prevPrice = priceMap[ticker].get(prevDate);
          const nextPrice = priceMap[ticker].get(nextDate);
          const ret = prevPrice > 0 ? (nextPrice - prevPrice) / prevPrice : 0;
          returnsSeries[ticker].push(ret);
        });
      }

      const minCount = Math.min(
        ...tickers.map((ticker) => returnsSeries[ticker].length)
      );

      if (minCount >= Math.max(lookbackPeriods * 0.5, 16)) {
        const covMatrix = riskBudgetingService.calculateCovarianceMatrix(
          returnsSeries,
          tickers
        );
        if (covMatrix) {
          try {
            currentWeights =
              riskBudgetingService.optimizeRiskBudgetingWeights(
                covMatrix,
                tickers,
                optimizerOptions
              );
          } catch (error) {
            console.warn(
              `Risk budgeting optimisation failed on ${date}:`,
              error.message
            );
          }
        }
      }
    }

    let value = 0;
    tickers.forEach((ticker) => {
      value += currentWeights[ticker] * priceMap[ticker].get(date);
    });
    portfolio.push({ date, value });
  });

  return portfolio;
}

function calculateEnhancedRiskParityWithDCC(
  priceData,
  volatilityLookback = 26,
  correlationLookback = 26,
  rebalancePeriods = 4,
  correlationPenaltyFactor = 0.5
) {
  const tickers = Object.keys(priceData);
  if (tickers.length === 0) return [];

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
  if (!allDates.length) return [];

  let currentWeights = Object.fromEntries(
    tickers.map((ticker) => [ticker, 1 / tickers.length])
  );
  const portfolio = [];

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
  });

  return portfolio;
}

/**
 * Calculate performance metrics
 * @param {Array} portfolio - Portfolio values over time
 * @returns {Object} Performance metrics
 */
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

module.exports = {
  calculateFixedWeightPortfolio,
  calculateEqualWeight,
  calculateSixtyForty,
  calculateMomentumTilt,
  calculateMinimumVarianceWeights,
  calculateSimpleRiskParity,
  calculateOptimizedRiskParity,
  calculateOptimizedRiskBudgeting,
  calculateEnhancedRiskParityWithDCC,
  calculateMetrics,
  applyLeverageToPortfolio,
};
