/**
 * Equal Weight Portfolio Strategy
 * Ported from anim-main/src/services/portfolioCalculations.js
 *
 * Simple equal allocation to all ETFs - baseline comparison strategy
 * Each asset receives 1/N allocation where N is the number of assets
 * No rebalancing needed as weights remain constant
 */

/**
 * Calculate equal weight portfolio
 * @param {Object} normalizedData - Price data normalized to base 100, format: { ticker: [{date, price}] }
 * @returns {Object} { portfolio: [{date, value}], allocations: [{date, SPY, IEF, GLD, ...}] }
 */
function calculateEqualWeight(normalizedData) {
  console.log('Calculating equal weight portfolio...');

  if (!normalizedData || Object.keys(normalizedData).length === 0) {
    return { portfolio: [], allocations: [] };
  }

  // Get common dates for all ETFs
  const tickers = Object.keys(normalizedData);
  const allDatesSet = new Set();

  // Collect all dates
  tickers.forEach(function(ticker) {
    normalizedData[ticker].forEach(function(dataPoint) {
      allDatesSet.add(dataPoint.date);
    });
  });

  const allDates = Array.from(allDatesSet).sort();

  // Create a map for quick price lookup
  const priceMap = {};
  tickers.forEach(function(ticker) {
    priceMap[ticker] = {};
    normalizedData[ticker].forEach(function(dataPoint) {
      priceMap[ticker][dataPoint.date] = dataPoint.price;
    });
  });

  const weight = 1.0 / tickers.length; // Equal weight for all assets
  const portfolio = [];
  const allocations = [];

  allDates.forEach(function(date) {
    let portfolioValue = 0;
    let hasAllPrices = true;

    // Check if all ETFs have prices for this date
    tickers.forEach(function(ticker) {
      if (!priceMap[ticker][date]) {
        hasAllPrices = false;
      }
    });

    if (hasAllPrices) {
      tickers.forEach(function(ticker) {
        portfolioValue += weight * priceMap[ticker][date];
      });

      portfolio.push({
        date: date,
        value: portfolioValue
      });

      // Store allocation weights (fixed equal weight for all dates)
      const allocationPoint = { date: date };
      tickers.forEach(function(ticker) {
        allocationPoint[ticker] = weight;
      });
      allocations.push(allocationPoint);
    }
  });

  console.log('Equal weight portfolio: ' + portfolio.length + ' data points, ' + (weight * 100).toFixed(1) + '% allocation each');
  return { portfolio: portfolio, allocations: allocations };
}

module.exports = { calculateEqualWeight };
