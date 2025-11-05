// Enhanced Risk Parity - EWMA + Correlation Adjusted (unleveraged)
// Ported from anim-main/src/services/portfolioCalculations.js

// Placeholder imports - these helper functions will be implemented in portfolioHelpers.js
// const { calculateReturns, calculateEWMAVolatility, calculatePearsonCorrelation } = require('../portfolioHelpers');

/**
 * Calculate Enhanced Risk Parity Portfolio
 *
 * Uses multi-horizon EWMA volatility estimation and correlation-adjusted weighting
 * to create a more sophisticated risk parity allocation.
 *
 * @param {Object} normalizedData - Price data normalized to base 100, keyed by ticker
 * @param {number} rebalanceFreqDays - How often to rebalance (default: 21 days)
 * @param {number} lookbackDays - Minimum lookback period for calculations (default: 60 days)
 * @returns {Object} { portfolioData, weightsData } - Portfolio values and weight allocations over time
 */
function calculateEnhancedRiskParity(normalizedData, rebalanceFreqDays = 21, lookbackDays = 60) {
  console.log('Calculating enhanced risk parity: EWMA + Correlation Adjusted (unleveraged)');

  if (!normalizedData || Object.keys(normalizedData).length === 0) {
    return { portfolioData: null, weightsData: null };
  }

  const tickers = Object.keys(normalizedData);
  const allDatesSet = new Set();

  tickers.forEach(ticker => {
    normalizedData[ticker].forEach(dataPoint => {
      allDatesSet.add(dataPoint.date);
    });
  });

  const allDates = Array.from(allDatesSet).sort();

  const priceMap = {};
  tickers.forEach(ticker => {
    priceMap[ticker] = {};
    normalizedData[ticker].forEach(dataPoint => {
      priceMap[ticker][dataPoint.date] = dataPoint.price;
    });
  });

  const portfolioData = [];
  const weightsData = [];
  let currentWeights = {};
  tickers.forEach(ticker => {
    currentWeights[ticker] = 1.0 / tickers.length;
  });

  allDates.forEach((date, i) => {
    let hasAllPrices = true;
    tickers.forEach(ticker => {
      if (!priceMap[ticker][date]) {
        hasAllPrices = false;
      }
    });

    if (!hasAllPrices) return;

    // Rebalance check
    const shouldRebalance = (i >= lookbackDays && i % rebalanceFreqDays === 0) || i === lookbackDays;

    if (shouldRebalance && i >= lookbackDays) {
      // Calculate multi-horizon volatilities using EWMA
      const volatilities = {};

      tickers.forEach(ticker => {
        // Calculate returns for different horizons
        const returns21 = [];
        const returns60 = [];
        const returns252 = [];

        // 21-day returns
        if (i >= 21) {
          for (let j = Math.max(0, i - 21); j < i - 1; j++) {
            const curr = priceMap[ticker][allDates[j + 1]];
            const prev = priceMap[ticker][allDates[j]];
            if (curr && prev && prev !== 0) {
              returns21.push((curr - prev) / prev);
            }
          }
        }

        // 60-day returns
        if (i >= 60) {
          for (let j = Math.max(0, i - 60); j < i - 1; j++) {
            const curr = priceMap[ticker][allDates[j + 1]];
            const prev = priceMap[ticker][allDates[j]];
            if (curr && prev && prev !== 0) {
              returns60.push((curr - prev) / prev);
            }
          }
        }

        // 252-day returns
        if (i >= 252) {
          for (let j = Math.max(0, i - 252); j < i - 1; j++) {
            const curr = priceMap[ticker][allDates[j + 1]];
            const prev = priceMap[ticker][allDates[j]];
            if (curr && prev && prev !== 0) {
              returns252.push((curr - prev) / prev);
            }
          }
        }

        // Calculate EWMA volatilities
        let vol21 = null, vol60 = null, vol252 = null;

        if (returns21.length >= 15) {
          vol21 = calculateEWMAVolatility(returns21, 0.94);
        }
        if (returns60.length >= 20) {
          vol60 = calculateEWMAVolatility(returns60, 0.94);
        }
        if (returns252.length >= 100) {
          vol252 = calculateEWMAVolatility(returns252, 0.94);
        }

        // Combine volatilities using weighted approach (from Python)
        let finalVolatility;
        if (vol21 !== null && vol60 !== null && vol252 !== null) {
          finalVolatility = 0.2 * vol21 + 0.5 * vol60 + 0.3 * vol252;
        } else if (vol60 !== null && vol252 !== null) {
          finalVolatility = 0.6 * vol60 + 0.4 * vol252;
        } else if (vol60 !== null) {
          finalVolatility = vol60;
        } else {
          finalVolatility = 0.15;
        }

        volatilities[ticker] = Math.max(finalVolatility, 0.05); // Floor at 5%
      });

      // Calculate correlation matrix using 60-day window
      const avgCorrelations = {};
      tickers.forEach(ticker => {
        avgCorrelations[ticker] = 0.0;
      });

      if (i >= 60) {
        const returnsSeries = {};
        tickers.forEach(ticker => {
          const returns = [];
          for (let j = Math.max(0, i - 60); j < i - 1; j++) {
            const curr = priceMap[ticker][allDates[j + 1]];
            const prev = priceMap[ticker][allDates[j]];
            if (curr && prev && prev !== 0) {
              returns.push((curr - prev) / prev);
            }
          }
          returnsSeries[ticker] = returns;
        });

        // Calculate average correlations
        tickers.forEach(ticker => {
          const otherCorrelations = [];
          tickers.forEach(otherTicker => {
            if (ticker !== otherTicker) {
              const corr = calculatePearsonCorrelation(returnsSeries[ticker], returnsSeries[otherTicker]);
              if (!isNaN(corr)) {
                otherCorrelations.push(Math.abs(corr));
              }
            }
          });
          if (otherCorrelations.length > 0) {
            avgCorrelations[ticker] = otherCorrelations.reduce((sum, val) => sum + val, 0) / otherCorrelations.length;
          }
        });
      }

      // Calculate correlation-adjusted inverse volatility weights
      const correlationPenaltyFactor = 0.5;
      const invVols = {};

      tickers.forEach(ticker => {
        const baseInvVol = 1.0 / volatilities[ticker];
        const correlationPenalty = 1.0 + correlationPenaltyFactor * avgCorrelations[ticker];
        const adjustedInvVol = baseInvVol / correlationPenalty;
        invVols[ticker] = adjustedInvVol;
      });

      const totalInvVol = Object.values(invVols).reduce((sum, val) => sum + val, 0);

      if (totalInvVol > 0) {
        tickers.forEach(ticker => {
          currentWeights[ticker] = invVols[ticker] / totalInvVol;
        });

        if (i % (rebalanceFreqDays * 12) === 0) { // Log every ~year
          console.log(`Enhanced Risk Parity Rebalancing on ${date}:`, currentWeights);
        }
      }
    }

    // Calculate portfolio value (unleveraged)
    let portfolioVal = 0;
    tickers.forEach(ticker => {
      portfolioVal += currentWeights[ticker] * priceMap[ticker][date];
    });

    portfolioData.push({
      date,
      value: portfolioVal
    });

    // Store base weights (for stacked chart display)
    const weightPoint = { date };
    tickers.forEach(ticker => {
      weightPoint[ticker] = currentWeights[ticker];
    });
    weightsData.push(weightPoint);
  });

  console.log(`Enhanced risk parity portfolio (unleveraged): ${portfolioData.length} data points`);
  return { portfolioData, weightsData };
}

// Temporary helper functions - these will be moved to portfolioHelpers.js
// For now, include them here to make the module self-contained

/**
 * Calculate EWMA (Exponentially Weighted Moving Average) volatility
 *
 * @param {Array<number>} returns - Array of return values
 * @param {number} lambda - Decay factor (default: 0.94)
 * @returns {number} Annualized volatility
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
 *
 * @param {Array<number>} x - First return series
 * @param {Array<number>} y - Second return series
 * @returns {number} Correlation coefficient (-1 to 1)
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
 * Calculate price returns from price array
 *
 * @param {Array<{price: number}>} prices - Array of price objects
 * @returns {Array<number>} Array of returns
 */
function calculateReturns(prices) {
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    const returnValue = (prices[i].price - prices[i-1].price) / prices[i-1].price;
    returns.push(returnValue);
  }
  return returns;
}

module.exports = { calculateEnhancedRiskParity };
