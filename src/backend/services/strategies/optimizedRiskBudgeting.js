/**
 * Optimized Risk Budgeting Portfolio Strategy
 *
 * Ported from anim-main (ES6) to CommonJS
 *
 * This strategy implements True Risk Budgeting using mathematical optimization
 * to achieve equal risk contributions from all assets.
 *
 * Unlike simple risk parity (inverse volatility weighting), this approach:
 * - Uses numerical optimization algorithms (gradient descent or CCD)
 * - Equalizes actual risk contributions, not just inverse volatility
 * - Accounts for correlations between assets
 * - Converges to mathematically optimal risk parity solution
 */

const {
  calculateCovarianceMatrix,
  calculateRiskContributions,
  optimizeRiskBudgetingWeights,
  optimizeRiskBudgetingCCD
} = require('./riskBudgeting');

/**
 * Calculate Optimized Risk Budgeting Portfolio with mathematical optimization
 * @param {Object} normalizedData - Object with ticker keys and normalized price arrays
 * @param {number} rebalanceFreqDays - Rebalancing frequency in days (default: 21)
 * @param {number} lookbackDays - Lookback period for covariance calculation (default: 120)
 * @param {string} optimizationMethod - 'gradient_descent' or 'ccd' (default: 'gradient_descent')
 * @returns {Object} { portfolio: [{date, value}], allocations: [{date, SPY, IEF, ...}] }
 */
function calculateOptimizedRiskBudgeting(
  normalizedData,
  rebalanceFreqDays,
  lookbackDays,
  optimizationMethod
) {
  // Default parameters
  if (rebalanceFreqDays === undefined) rebalanceFreqDays = 21;
  if (lookbackDays === undefined) lookbackDays = 120;
  if (optimizationMethod === undefined) optimizationMethod = 'gradient_descent';

  console.log('Calculating Optimized Risk Budgeting Portfolio using mathematical optimization...');

  if (!normalizedData || Object.keys(normalizedData).length === 0) {
    return { portfolio: null, allocations: null };
  }

  const tickers = Object.keys(normalizedData);
  const allDatesSet = new Set();

  tickers.forEach(function(ticker) {
    normalizedData[ticker].forEach(function(dataPoint) {
      allDatesSet.add(dataPoint.date);
    });
  });

  const allDates = Array.from(allDatesSet).sort();

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

  // Initialize with equal weights
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

    // Rebalance check
    const shouldRebalance = (i >= lookbackDays && i % rebalanceFreqDays === 0) || i === lookbackDays;

    if (shouldRebalance && i >= lookbackDays) {
      // Calculate returns series for the lookback period
      const returnsSeries = {};
      tickers.forEach(function(ticker) {
        returnsSeries[ticker] = [];
      });

      // Collect returns data
      for (let j = Math.max(0, i - lookbackDays); j < i - 1; j++) {
        const currDate = allDates[j + 1];
        const prevDate = allDates[j];

        let hasAllReturns = true;
        const dailyReturns = {};

        tickers.forEach(function(ticker) {
          const currPrice = priceMap[ticker][currDate];
          const prevPrice = priceMap[ticker][prevDate];

          if (currPrice && prevPrice && prevPrice !== 0) {
            dailyReturns[ticker] = (currPrice - prevPrice) / prevPrice;
          } else {
            hasAllReturns = false;
          }
        });

        if (hasAllReturns) {
          tickers.forEach(function(ticker) {
            returnsSeries[ticker].push(dailyReturns[ticker]);
          });
        }
      }

      // Check if we have enough data points
      const minDataPoints = Math.min.apply(Math, tickers.map(function(ticker) {
        return returnsSeries[ticker].length;
      }));

      if (minDataPoints >= 30) { // Need at least 30 data points for stable optimization
        // Calculate covariance matrix
        const covMatrix = calculateCovarianceMatrix(returnsSeries, tickers);

        if (covMatrix) {
          // Optimize for true risk parity
          try {
            if (optimizationMethod === 'ccd') {
              currentWeights = optimizeRiskBudgetingCCD(covMatrix, tickers);
            } else {
              currentWeights = optimizeRiskBudgetingWeights(covMatrix, tickers);
            }

            // Log rebalancing periodically
            if (i % (rebalanceFreqDays * 12) === 0) { // Log every ~year
              console.log('True Risk Budgeting Rebalancing on ' + date + ':', currentWeights);
              const riskContribs = calculateRiskContributions(currentWeights, covMatrix, tickers);
              console.log('Risk Contributions:', riskContribs);
            }
          } catch (error) {
            console.warn('Risk budgeting optimization failed on ' + date + ':', error);
            // Keep previous weights if optimization fails
          }
        }
      }
    }

    // Calculate portfolio value
    let portfolioValue = 0;
    tickers.forEach(function(ticker) {
      portfolioValue += currentWeights[ticker] * priceMap[ticker][date];
    });

    portfolio.push({
      date: date,
      value: portfolioValue
    });

    // Store weights
    const weightPoint = { date: date };
    tickers.forEach(function(ticker) {
      weightPoint[ticker] = currentWeights[ticker];
    });
    allocations.push(weightPoint);
  });

  console.log('True Risk Budgeting portfolio: ' + portfolio.length + ' data points');
  return { portfolio: portfolio, allocations: allocations };
}

module.exports = { calculateOptimizedRiskBudgeting };
