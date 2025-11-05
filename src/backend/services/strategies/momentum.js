/**
 * Momentum Portfolio Strategy
 *
 * This strategy allocates more weight to assets with higher recent momentum.
 * Momentum is calculated as the return over a lookback period (100 days default).
 *
 * Key Features:
 * - Momentum Score: (current_price - price_lookback_days_ago) / price_lookback_days_ago
 * - ALL assets get allocation (both positive and negative momentum)
 * - Proportional weighting based on relative momentum ranking
 * - Constraints: minimum 2% per asset (worst performer), maximum 30% per asset (best performer)
 * - Monthly rebalancing (21 days default)
 *
 * Momentum investing is based on the behavioral finance concept that assets showing
 * strong recent performance tend to continue performing well in the near term.
 */

/**
 * Calculate momentum score for a ticker
 * @param {Object} priceMap - Price map for the ticker
 * @param {Array} allDates - Sorted array of all dates
 * @param {number} currentIdx - Current date index
 * @param {number} lookbackDays - Lookback period for momentum calculation
 * @returns {number} Momentum score (raw return, can be negative)
 */
function calculateMomentumScore(priceMap, allDates, currentIdx, lookbackDays) {
  const currentDate = allDates[currentIdx];
  const lookbackIdx = currentIdx - lookbackDays;

  if (lookbackIdx < 0) {
    return 0; // Insufficient data
  }

  const lookbackDate = allDates[lookbackIdx];
  const currentPrice = priceMap[currentDate];
  const lookbackPrice = priceMap[lookbackDate];

  if (!currentPrice || !lookbackPrice || lookbackPrice <= 0) {
    return 0; // Invalid data
  }

  const momentumReturn = (currentPrice - lookbackPrice) / lookbackPrice;

  // Return raw momentum (can be positive or negative)
  return momentumReturn;
}

/**
 * Apply weight constraints and normalize
 * @param {Object} rawWeights - Raw weights before constraints
 * @param {Array} tickers - Array of ticker symbols
 * @param {number} minWeight - Minimum weight per asset (default: 0.02)
 * @param {number} maxWeight - Maximum weight per asset (default: 0.30)
 * @returns {Object} Constrained and normalized weights
 */
function applyConstraints(rawWeights, tickers, minWeight, maxWeight) {
  const constrainedWeights = {};

  // First pass: Apply max constraint and filter out zero weights
  tickers.forEach(function(ticker) {
    if (rawWeights[ticker] > 0) {
      constrainedWeights[ticker] = Math.min(rawWeights[ticker], maxWeight);
    } else {
      constrainedWeights[ticker] = 0;
    }
  });

  // Calculate sum after max constraint
  let weightSum = Object.values(constrainedWeights).reduce(function(sum, w) {
    return sum + w;
  }, 0);

  // Normalize to 1.0
  if (weightSum > 0) {
    tickers.forEach(function(ticker) {
      constrainedWeights[ticker] = constrainedWeights[ticker] / weightSum;
    });
  }

  // Second pass: Apply minimum constraint
  // Count how many assets have non-zero allocation
  const activeAssets = tickers.filter(function(ticker) {
    return constrainedWeights[ticker] > 0;
  });

  if (activeAssets.length > 0) {
    activeAssets.forEach(function(ticker) {
      // Only apply minimum if we have positive allocation
      if (constrainedWeights[ticker] > 0 && constrainedWeights[ticker] < minWeight) {
        constrainedWeights[ticker] = minWeight;
      }
    });

    // Final normalization after applying minimum constraint
    weightSum = Object.values(constrainedWeights).reduce(function(sum, w) {
      return sum + w;
    }, 0);

    if (weightSum > 0) {
      tickers.forEach(function(ticker) {
        constrainedWeights[ticker] = constrainedWeights[ticker] / weightSum;
      });
    }
  }

  return constrainedWeights;
}

/**
 * Calculate Momentum Portfolio
 * @param {Object} normalizedData - Price data normalized to base 100, format: { ticker: [{date, price}] }
 * @param {number} lookbackDays - Lookback period for momentum calculation (default: 100 days)
 * @param {number} rebalanceDays - Rebalancing frequency in days (default: 21 days = monthly)
 * @param {number} minWeight - Minimum allocation per asset (default: 0.02 = 2%)
 * @param {number} maxWeight - Maximum allocation per asset (default: 0.30 = 30%)
 * @returns {Object} { portfolio: [{date, value}], allocations: [{date, SPY, IEF, GLD, ...}] }
 */
function calculateMomentum(normalizedData, lookbackDays = 100, rebalanceDays = 21, minWeight = 0.02, maxWeight = 0.30) {
  console.log('Calculating momentum portfolio...');
  console.log(`Parameters: lookback=${lookbackDays} days, rebalance=${rebalanceDays} days, min=${(minWeight*100).toFixed(0)}%, max=${(maxWeight*100).toFixed(0)}%`);

  if (!normalizedData || Object.keys(normalizedData).length === 0) {
    return { portfolio: [], allocations: [] };
  }

  // Extract tickers and build date/price maps
  const tickers = Object.keys(normalizedData);
  const allDatesSet = new Set();

  tickers.forEach(function(ticker) {
    normalizedData[ticker].forEach(function(dataPoint) {
      allDatesSet.add(dataPoint.date);
    });
  });

  const allDates = Array.from(allDatesSet).sort();

  // Create price map for quick lookups
  const priceMap = {};
  tickers.forEach(function(ticker) {
    priceMap[ticker] = {};
    normalizedData[ticker].forEach(function(dataPoint) {
      priceMap[ticker][dataPoint.date] = dataPoint.price;
    });
  });

  const portfolio = [];
  const allocations = [];
  let currentWeights = {};
  let rebalanceCount = 0;

  // Start with equal weights
  tickers.forEach(function(ticker) {
    currentWeights[ticker] = 1.0 / tickers.length;
  });

  allDates.forEach(function(date, i) {
    // Check if all ETFs have prices for this date
    let hasAllPrices = true;
    tickers.forEach(function(ticker) {
      if (!priceMap[ticker][date]) {
        hasAllPrices = false;
      }
    });

    if (!hasAllPrices) return;

    // Determine if we should rebalance
    // Start momentum allocation after lookback period, then rebalance every rebalanceDays
    const shouldRebalance = (i >= lookbackDays && i % rebalanceDays === 0) || i === lookbackDays;

    if (shouldRebalance && i >= lookbackDays) {
      // Calculate momentum scores for each ticker
      const momentumScores = {};

      tickers.forEach(function(ticker) {
        momentumScores[ticker] = calculateMomentumScore(
          priceMap[ticker],
          allDates,
          i,
          lookbackDays
        );
      });

      // Calculate total momentum (only positive scores)
      const totalMomentum = Object.values(momentumScores).reduce(function(sum, score) {
        return sum + score;
      }, 0);

      if (totalMomentum > 0) {
        // Calculate proportional raw weights based on momentum
        const rawWeights = {};
        tickers.forEach(function(ticker) {
          rawWeights[ticker] = momentumScores[ticker] / totalMomentum;
        });

        // Apply constraints (min/max) and normalize
        currentWeights = applyConstraints(rawWeights, tickers, minWeight, maxWeight);

        rebalanceCount++;

        // Log rebalancing periodically (every ~year)
        if (rebalanceCount % 12 === 1) {
          console.log(`Momentum rebalancing on ${date}:`,
            Object.keys(currentWeights).map(function(t) {
              return t + '=' + (currentWeights[t] * 100).toFixed(1) + '%';
            }).join(', ')
          );
        }
      } else {
        // If all momentum scores are zero or negative, use equal weight
        console.log(`Warning: All momentum scores are zero on ${date}, using equal weight`);
        tickers.forEach(function(ticker) {
          currentWeights[ticker] = 1.0 / tickers.length;
        });
      }
    }

    // Calculate portfolio value using current weights
    let portfolioValue = 0;
    tickers.forEach(function(ticker) {
      portfolioValue += currentWeights[ticker] * priceMap[ticker][date];
    });

    portfolio.push({
      date: date,
      value: portfolioValue
    });

    // Store allocation weights
    const allocationPoint = { date: date };
    tickers.forEach(function(ticker) {
      allocationPoint[ticker] = currentWeights[ticker];
    });
    allocations.push(allocationPoint);
  });

  console.log(`Momentum portfolio: ${portfolio.length} data points, ${rebalanceCount} rebalances`);
  return { portfolio: portfolio, allocations: allocations };
}

module.exports = { calculateMomentum };
