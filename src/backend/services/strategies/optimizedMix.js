/**
 * Portfolio Optimizer - Find Best Mix of Strategies
 *
 * Automatically finds the optimal weighted combination of base strategies
 * to maximize annual return subject to a volatility constraint.
 *
 * Algorithm: Exhaustive grid search with 10% weight increments
 * Optimization Objective: Maximize annual return with volatility ≤ 15%
 *
 * This constrained optimization ensures high returns while maintaining
 * moderate risk levels suitable for most investors.
 *
 * This runs during backend cache generation, not per-user request.
 */

/**
 * Generate weight combinations on-the-fly using callback (memory efficient)
 * @param {number} numStrategies - Number of strategies to combine
 * @param {number} granularity - Weight increment (e.g., 5 for 5% steps)
 * @param {Function} callback - Function to call for each combination
 * @returns {number} Total combinations generated
 */
function generateWeightCombinationsStreaming(numStrategies, granularity, callback) {
  let count = 0;

  function recurse(weights, remaining, index) {
    // Base case: last strategy gets all remaining weight
    if (index === numStrategies - 1) {
      weights[index] = remaining;
      // Filter: require at least 2 strategies with non-zero weights
      const nonZero = weights.filter(w => w > 0).length;
      if (nonZero >= 2) {
        callback([...weights]);
        count++;
      }
      return;
    }

    // Recursive case: try all valid weights for current strategy
    for (let w = 0; w <= remaining; w += granularity) {
      weights[index] = w;
      recurse(weights, remaining - w, index + 1);
    }
  }

  recurse(new Array(numStrategies).fill(0), 100, 0);
  return count;
}

/**
 * Generate all valid weight combinations that sum to 100% (for testing)
 * @param {number} numStrategies - Number of strategies to combine
 * @param {number} granularity - Weight increment (e.g., 5 for 5% steps)
 * @returns {Array<Array<number>>} Array of weight combinations
 */
function generateWeightCombinations(numStrategies, granularity = 5) {
  const combinations = [];
  generateWeightCombinationsStreaming(numStrategies, granularity, (weights) => {
    combinations.push(weights);
  });
  return combinations;
}

/**
 * Calculate portfolio metrics from return series
 * @param {Array<number>} returns - Array of period returns
 * @param {number} periodsPerYear - Annualization factor (e.g., 252 for daily)
 * @returns {Object} Metrics including sharpeRatio, annualReturn, volatility, maxDrawdown
 */
function calculateMetrics(returns, periodsPerYear = 252) {
  if (!returns || returns.length < 2) {
    return { sharpeRatio: -Infinity, annualReturn: 0, volatility: 0, maxDrawdown: 0 };
  }

  // Calculate mean return and volatility
  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance) * Math.sqrt(periodsPerYear);

  // Calculate annualized return
  const cumulativeReturn = returns.reduce((prod, r) => prod * (1 + r), 1);
  const years = returns.length / periodsPerYear;
  const annualReturn = Math.pow(cumulativeReturn, 1 / years) - 1;

  // Calculate Sharpe ratio (2% risk-free rate)
  const riskFreeRate = 0.02;
  const sharpeRatio = volatility > 0 ? (annualReturn - riskFreeRate) / volatility : -Infinity;

  // Calculate max drawdown
  let peak = 1.0;
  let maxDrawdown = 0;
  let cumulative = 1.0;

  returns.forEach(r => {
    cumulative *= (1 + r);
    if (cumulative > peak) peak = cumulative;
    const drawdown = (cumulative - peak) / peak;
    if (drawdown < maxDrawdown) maxDrawdown = drawdown;
  });

  return {
    sharpeRatio,
    annualReturn: annualReturn * 100, // Convert to percentage
    volatility: volatility * 100,     // Convert to percentage
    maxDrawdown: maxDrawdown * 100,   // Convert to percentage
    totalReturn: (cumulativeReturn - 1) * 100 // Total return percentage
  };
}

/**
 * Blend strategy time series using weights
 * @param {Object} strategySeries - Map of strategyKey to [{date, value}, ...]
 * @param {Array<string>} strategyKeys - Ordered list of strategy keys
 * @param {Array<number>} weights - Weights as percentages (sum to 100)
 * @returns {Array<{date, value}>} Blended portfolio time series
 */
function blendStrategies(strategySeries, strategyKeys, weights) {
  // Get reference series for dates
  const referenceSeries = strategySeries[strategyKeys[0]];
  if (!referenceSeries || referenceSeries.length === 0) {
    return [];
  }

  const blendedSeries = [];

  // For each time point, calculate weighted average
  for (let i = 0; i < referenceSeries.length; i++) {
    const date = referenceSeries[i].date;
    let blendedValue = 0;

    // Weighted sum across all strategies
    for (let j = 0; j < strategyKeys.length; j++) {
      const series = strategySeries[strategyKeys[j]];
      if (series && series[i]) {
        blendedValue += (weights[j] / 100) * series[i].value;
      }
    }

    blendedSeries.push({ date, value: blendedValue });
  }

  return blendedSeries;
}

/**
 * Blend allocation data using weights
 * @param {Object} allocationData - Map of strategyKey to [{date, SPY, IEF, ...}, ...]
 * @param {Array<string>} strategyKeys - Ordered list of strategy keys
 * @param {Array<number>} weights - Weights as percentages (sum to 100)
 * @param {Array<string>} tickers - List of ticker symbols
 * @returns {Array<{date, SPY, IEF, ...}>} Blended allocation time series
 */
function blendAllocations(allocationData, strategyKeys, weights, tickers) {
  // Get reference allocation for dates
  const referenceAlloc = allocationData[strategyKeys[0]];
  if (!referenceAlloc || referenceAlloc.length === 0) {
    return [];
  }

  const blendedAllocations = [];

  // For each time point, calculate weighted average allocations
  for (let i = 0; i < referenceAlloc.length; i++) {
    const date = referenceAlloc[i].date;
    const blendedAlloc = { date };

    // Initialize all tickers to 0
    tickers.forEach(ticker => { blendedAlloc[ticker] = 0; });

    // Weighted sum across all strategies
    for (let j = 0; j < strategyKeys.length; j++) {
      const allocSeries = allocationData[strategyKeys[j]];
      if (allocSeries && allocSeries[i]) {
        tickers.forEach(ticker => {
          blendedAlloc[ticker] += (weights[j] / 100) * (allocSeries[i][ticker] || 0);
        });
      }
    }

    blendedAllocations.push(blendedAlloc);
  }

  return blendedAllocations;
}

/**
 * Find optimal mix of strategies to maximize return with volatility constraint
 * @param {Array} priceData - Raw price data (not used directly, kept for API consistency)
 * @param {Object} strategySeries - Map of strategyKey to [{date, value}, ...]
 * @param {Object} allocationData - Map of strategyKey to [{date, SPY, IEF, ...}, ...]
 * @param {string} targetMetric - Metric to optimize ('annualReturn' for return-maximization)
 * @param {number} maxVolatility - Maximum allowed volatility constraint (default: 15%)
 * @returns {Object} { portfolio, allocations, optimalWeights, metrics }
 */
function findOptimalMix(
  priceData,
  strategySeries,
  allocationData = {},
  tickers = ['SPY', 'IEF', 'GLD', 'EFA', 'EEM', 'CASH'],
  targetMetric = 'annualReturn',
  maxVolatility = 20.0
) {
  console.log('🔍 Starting portfolio optimization...');
  const startTime = Date.now();

  // Get base strategy keys (exclude optimizedRP to avoid circular dependency)
  const strategyKeys = Object.keys(strategySeries).filter(key => key !== 'optimizedRP');

  if (strategyKeys.length < 2) {
    throw new Error('Optimizer requires at least 2 base strategies');
  }

  console.log(`  📊 Optimizing across ${strategyKeys.length} strategies: ${strategyKeys.join(', ')}`);
  console.log(`  🎯 Objective: Maximize ${targetMetric} with volatility ≤ ${maxVolatility}%`);

  // Track best result
  let bestReturn = -Infinity;
  let bestWeights = null;
  let bestMetrics = null;
  let combinationsTested = 0;
  let validCombinations = 0;

  // Generate and test combinations on-the-fly (memory efficient streaming)
  console.log('  🔢 Generating and testing weight combinations (10% increments)...');

  const totalCombinations = generateWeightCombinationsStreaming(
    strategyKeys.length,
    10,
    (weights) => {
      combinationsTested++;

      // Log progress every 10k combinations
      if (combinationsTested % 10000 === 0) {
        console.log(`    Progress: ${combinationsTested.toLocaleString()} tested, ${validCombinations} valid (vol ≤${maxVolatility}%), best return: ${bestReturn.toFixed(2)}%`);
      }

      // Blend portfolio values
      const blendedSeries = blendStrategies(strategySeries, strategyKeys, weights);

      // Calculate returns
      const returns = [];
      for (let i = 1; i < blendedSeries.length; i++) {
        const prevValue = blendedSeries[i - 1].value;
        const currValue = blendedSeries[i].value;
        if (prevValue > 0) {
          returns.push((currValue - prevValue) / prevValue);
        }
      }

      // Calculate metrics
      const metrics = calculateMetrics(returns);

      // CONSTRAINT: Skip combinations that exceed volatility limit
      if (metrics.volatility > maxVolatility) {
        return; // Skip this combination
      }

      validCombinations++;

      // Check if this is the best valid combination so far
      if (metrics[targetMetric] > bestReturn) {
        bestReturn = metrics[targetMetric];
        bestWeights = [...weights];
        bestMetrics = metrics;
      }
    }
  );

  console.log(`  ✅ Tested ${totalCombinations.toLocaleString()} combinations`);
  console.log(`  ✅ Found ${validCombinations.toLocaleString()} valid combinations (volatility ≤ ${maxVolatility}%)`);

  if (!bestWeights) {
    throw new Error('Optimizer failed to find valid combination');
  }

  // Build optimal weights object
  const optimalWeights = {};
  strategyKeys.forEach((key, i) => {
    if (bestWeights[i] > 0) {
      optimalWeights[key] = bestWeights[i];
    }
  });

  // Calculate final blended portfolio and allocations
  const optimalPortfolio = blendStrategies(strategySeries, strategyKeys, bestWeights);
  const optimalAllocations = blendAllocations(allocationData, strategyKeys, bestWeights, tickers);

  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('  ✨ Optimization complete!');
  console.log(`  ⏱️  Time elapsed: ${elapsedTime}s`);
  console.log(`  🏆 Best Annual Return: ${bestMetrics.annualReturn.toFixed(2)}% (volatility: ${bestMetrics.volatility.toFixed(2)}%)`);
  console.log('  📈 Optimal Weights:');
  Object.entries(optimalWeights)
    .sort((a, b) => b[1] - a[1])
    .forEach(([key, weight]) => {
      console.log(`      ${key}: ${weight}%`);
    });
  console.log(`  📊 Metrics:`, {
    annualReturn: bestMetrics.annualReturn.toFixed(2) + '%',
    volatility: bestMetrics.volatility.toFixed(2) + '%',
    sharpeRatio: bestMetrics.sharpeRatio.toFixed(4),
    maxDrawdown: bestMetrics.maxDrawdown.toFixed(2) + '%',
    totalReturn: bestMetrics.totalReturn.toFixed(2) + '%'
  });

  return {
    portfolio: optimalPortfolio,
    allocations: optimalAllocations,
    optimalWeights,
    metrics: bestMetrics
  };
}

module.exports = {
  findOptimalMix,
  generateWeightCombinations,
  calculateMetrics,
  blendStrategies,
  blendAllocations
};
