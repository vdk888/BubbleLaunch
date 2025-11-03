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

function calculateMomentumTilt(priceData, lookbackDays = 252, rebalanceDays = 21) {
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

function invert3x3(matrix) {
  const det =
    matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
    matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
    matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]);

  if (Math.abs(det) < 1e-12) {
    return null;
  }

  const inverse = [
    [],
    [],
    [],
  ];

  inverse[0][0] = (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) / det;
  inverse[0][1] = (matrix[0][2] * matrix[2][1] - matrix[0][1] * matrix[2][2]) / det;
  inverse[0][2] = (matrix[0][1] * matrix[1][2] - matrix[0][2] * matrix[1][1]) / det;
  inverse[1][0] = (matrix[1][2] * matrix[2][0] - matrix[1][0] * matrix[2][2]) / det;
  inverse[1][1] = (matrix[0][0] * matrix[2][2] - matrix[0][2] * matrix[2][0]) / det;
  inverse[1][2] = (matrix[0][2] * matrix[1][0] - matrix[0][0] * matrix[1][2]) / det;
  inverse[2][0] = (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]) / det;
  inverse[2][1] = (matrix[0][1] * matrix[2][0] - matrix[0][0] * matrix[2][1]) / det;
  inverse[2][2] = (matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0]) / det;

  return inverse;
}

function calculateMinimumVarianceWeights(priceData, lookbackDays = 252, rebalanceDays = 21) {
  const tickers = Object.keys(priceData);
  if (tickers.length === 0) return [];

  const allDates = priceData[tickers[0]].map((p) => p.date);
  const returnsData = {};
  tickers.forEach((ticker) => {
    returnsData[ticker] = calculateReturns(priceData[ticker]);
  });

  const portfolio = [];
  let currentWeights = Object.fromEntries(tickers.map((ticker) => [ticker, 1 / tickers.length]));

  for (let i = 0; i < allDates.length; i++) {
    if (i >= lookbackDays && i % rebalanceDays === 0) {
      const covMatrix = tickers.map(() => Array(tickers.length).fill(0));
      let observations = 0;

      for (let k = i; k > i - lookbackDays; k--) {
        if (k <= 0) continue;
        const row = tickers.map((ticker) => {
          const currentPoint = priceData[ticker][k];
          const previousPoint = priceData[ticker][k - 1];
          if (!currentPoint || !previousPoint || previousPoint.price === 0) {
            return 0;
          }
          return (currentPoint.price - previousPoint.price) / previousPoint.price;
        });

        observations += 1;

        for (let a = 0; a < tickers.length; a++) {
          for (let b = a; b < tickers.length; b++) {
            const increment = row[a] * row[b];
            covMatrix[a][b] += increment;
            if (a !== b) {
              covMatrix[b][a] += increment;
            }
          }
        }
      }

      if (observations > 0) {
        for (let a = 0; a < tickers.length; a++) {
          for (let b = 0; b < tickers.length; b++) {
            covMatrix[a][b] /= observations;
          }
        }

        const inverse = invert3x3(covMatrix);
        if (inverse) {
          const weightsVector = inverse.map((row) => row.reduce((sum, value) => sum + value, 0));
          const weightSum = weightsVector.reduce((sum, value) => sum + value, 0);

          if (weightSum !== 0) {
            currentWeights = Object.fromEntries(
              tickers.map((ticker, idx) => [ticker, weightsVector[idx] / weightSum])
            );
          }
        }
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

function calculateMomentumTilt(priceData, lookbackDays = 252, rebalanceDays = 21) {
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

function calculateMinimumVarianceWeights(priceData, lookbackDays = 252, rebalanceDays = 21) {
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
      if (length > 2) {
        // Build covariance matrix
        const covMatrix = tickers.map(() => Array(tickers.length).fill(0));
        for (let a = 0; a < tickers.length; a++) {
          for (let b = a; b < tickers.length; b++) {
            let sum = 0;
            for (let k = 0; k < length; k++) {
              sum += windowReturns[a][k] * windowReturns[b][k];
            }
            const cov = sum / length;
            covMatrix[a][b] = cov;
            covMatrix[b][a] = cov;
          }
        }

        // Invert covariance matrix using pseudo inverse (since small matrix)
        const det =
          covMatrix[0][0] * (covMatrix[1][1] * covMatrix[2][2] - covMatrix[1][2] * covMatrix[2][1]) -
          covMatrix[0][1] * (covMatrix[1][0] * covMatrix[2][2] - covMatrix[1][2] * covMatrix[2][0]) +
          covMatrix[0][2] * (covMatrix[1][0] * covMatrix[2][1] - covMatrix[1][1] * covMatrix[2][0]);

        if (Math.abs(det) > 1e-12) {
          const inverse = [];
          inverse[0] = [];
          inverse[1] = [];
          inverse[2] = [];

          inverse[0][0] = (covMatrix[1][1] * covMatrix[2][2] - covMatrix[1][2] * covMatrix[2][1]) / det;
          inverse[0][1] = (covMatrix[0][2] * covMatrix[2][1] - covMatrix[0][1] * covMatrix[2][2]) / det;
          inverse[0][2] = (covMatrix[0][1] * covMatrix[1][2] - covMatrix[0][2] * covMatrix[1][1]) / det;
          inverse[1][0] = (covMatrix[1][2] * covMatrix[2][0] - covMatrix[1][0] * covMatrix[2][2]) / det;
          inverse[1][1] = (covMatrix[0][0] * covMatrix[2][2] - covMatrix[0][2] * covMatrix[2][0]) / det;
          inverse[1][2] = (covMatrix[0][2] * covMatrix[1][0] - covMatrix[0][0] * covMatrix[1][2]) / det;
          inverse[2][0] = (covMatrix[1][0] * covMatrix[2][1] - covMatrix[1][1] * covMatrix[2][0]) / det;
          inverse[2][1] = (covMatrix[0][1] * covMatrix[2][0] - covMatrix[0][0] * covMatrix[2][1]) / det;
          inverse[2][2] = (covMatrix[0][0] * covMatrix[1][1] - covMatrix[0][1] * covMatrix[1][0]) / det;

          const ones = [1, 1, 1];
          const weightsVector = inverse.map((row) =>
            row.reduce((sum, value, idx) => sum + value * ones[idx], 0)
          );
          const weightSum = weightsVector.reduce((sum, value) => sum + value, 0);

          if (weightSum !== 0) {
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
function calculateOptimizedRiskParity(priceData, momentumLookback = 252, volatilityLookback = 60, rebalanceDays = 21, momentumWeight = 0.7, rpWeight = 0.3) {
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
  calculateMetrics,
  applyLeverageToPortfolio,
};
