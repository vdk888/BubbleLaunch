/**
 * Hierarchical Risk Parity Portfolio Calculation
 *
 * Portfolio wrapper for HRP algorithm that manages historical data,
 * rebalancing, and portfolio value calculation over time.
 *
 * This module orchestrates the HRP algorithm (from hierarchicalRiskParity.js)
 * and applies it to historical price data to generate portfolio performance.
 *
 * Ported from anim-main/src/services/portfolioCalculations.js (calculateHierarchicalRiskParityPortfolio)
 * Converted from ES6 to CommonJS for BubbleLaunch backend
 */

const {
  calculateReturns,
  calculateCorrelationMatrix,
  calculateDistanceMatrix,
  HierarchicalCluster,
  getQuasiDiagonalOrder,
  recursiveBisection
} = require('./hierarchicalRiskParity');

/**
 * Calculate Hierarchical Risk Parity Portfolio
 *
 * Uses machine learning clustering to group similar assets, then applies
 * risk parity allocation hierarchically across clusters and within clusters.
 *
 * @param {Object} normalizedData - Price data normalized to base 100, keyed by ticker
 *                                  Example: { 'SPY': [{date: '2024-01-01', price: 100}, ...], ... }
 * @param {number} rebalanceFreqDays - How often to rebalance (default: 21 days)
 * @param {number} lookbackDays - Lookback period for correlation calculation (default: 126 days)
 * @param {number} maxClusters - Maximum number of clusters (default: 3, currently unused)
 * @returns {Object} { portfolioData, weightsData } - Portfolio values and weight allocations over time
 */
function calculateHierarchicalRiskParityPortfolio(
  normalizedData,
  rebalanceFreqDays = 21,
  lookbackDays = 126,
  maxClusters = 3
) {
  console.log('Calculating Hierarchical Risk Parity portfolio...');

  if (!normalizedData || Object.keys(normalizedData).length === 0) {
    return { portfolioData: null, weightsData: null };
  }

  const tickers = Object.keys(normalizedData);
  const allDatesSet = new Set();

  // Collect all dates
  tickers.forEach(ticker => {
    normalizedData[ticker].forEach(dataPoint => {
      allDatesSet.add(dataPoint.date);
    });
  });

  const allDates = Array.from(allDatesSet).sort();

  // Create price map for quick lookup
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
  let previousPortfolioValue = 100.0; // Start at base 100

  // Initialize with equal weights
  tickers.forEach(ticker => {
    currentWeights[ticker] = 1.0 / tickers.length;
  });

  allDates.forEach((date, i) => {
    // Check if all ETFs have prices for this date
    let hasAllPrices = true;
    tickers.forEach(ticker => {
      if (!priceMap[ticker][date]) {
        hasAllPrices = false;
      }
    });

    if (!hasAllPrices) return;

    let portfolioValue;

    if (i === 0) {
      // First day: start at base 100
      portfolioValue = 100.0;
    } else {
      // Calculate portfolio return based on price changes with current weights
      const prevDate = allDates[i - 1];
      let portfolioReturn = 0;

      tickers.forEach(ticker => {
        if (priceMap[ticker][prevDate] && priceMap[ticker][date]) {
          const assetReturn = (priceMap[ticker][date] - priceMap[ticker][prevDate]) / priceMap[ticker][prevDate];
          portfolioReturn += currentWeights[ticker] * assetReturn;
        }
      });

      // Apply return to previous portfolio value
      portfolioValue = previousPortfolioValue * (1 + portfolioReturn);
    }

    // Rebalance periodically (but after calculating today's value with old weights)
    if (i % rebalanceFreqDays === 0 && i >= lookbackDays) {
      // Collect price data for lookback period
      const lookbackStartIdx = Math.max(0, i - lookbackDays);
      const lookbackDates = allDates.slice(lookbackStartIdx, i + 1);

      // Calculate returns for each ticker
      const returnsSeries = {};
      tickers.forEach(ticker => {
        const prices = lookbackDates
          .map(d => priceMap[ticker][d])
          .filter(p => p !== undefined);

        if (prices.length > 1) {
          returnsSeries[ticker] = calculateReturns(prices);
        } else {
          returnsSeries[ticker] = [0]; // Handle edge case
        }
      });

      // Ensure all tickers have returns data
      const validTickers = tickers.filter(ticker =>
        returnsSeries[ticker] && returnsSeries[ticker].length > 0
      );

      if (validTickers.length >= 2) {
        try {
          // Step 1: Calculate correlation matrix
          const correlationMatrix = calculateCorrelationMatrix(returnsSeries, validTickers);

          if (correlationMatrix) {
            // Step 2: Tree clustering
            const distanceMatrix = calculateDistanceMatrix(correlationMatrix, validTickers);
            const clusterer = new HierarchicalCluster(validTickers, distanceMatrix);
            const dendrogram = clusterer.cluster();

            // Step 3: Quasi-diagonalization
            const orderedTickers = getQuasiDiagonalOrder(dendrogram, validTickers);

            // Step 4: Recursive bisection
            const hrpWeights = recursiveBisection(correlationMatrix, dendrogram, orderedTickers);

            // Update current weights
            validTickers.forEach(ticker => {
              currentWeights[ticker] = hrpWeights[ticker] || 0;
            });

            // Set weights to 0 for invalid tickers
            tickers.forEach(ticker => {
              if (!validTickers.includes(ticker)) {
                currentWeights[ticker] = 0;
              }
            });

            if (i % (rebalanceFreqDays * 12) === 0) { // Log every ~year
              console.log(`HRP Rebalancing on ${date}:`, currentWeights);
            }
          }
        } catch (error) {
          console.error('Error in HRP calculation:', error);
          // Fall back to equal weights
          tickers.forEach(ticker => {
            currentWeights[ticker] = 1.0 / tickers.length;
          });
        }
      }
    }

    // Store portfolio value and weights
    portfolioData.push({
      date,
      value: portfolioValue
    });

    // Store weights
    const weightPoint = { date };
    tickers.forEach(ticker => {
      weightPoint[ticker] = currentWeights[ticker];
    });
    weightsData.push(weightPoint);

    // Update previous portfolio value for next iteration
    previousPortfolioValue = portfolioValue;
  });

  console.log(`Hierarchical Risk Parity portfolio: ${portfolioData.length} data points`);
  return { portfolioData, weightsData };
}

module.exports = { calculateHierarchicalRiskParityPortfolio };
