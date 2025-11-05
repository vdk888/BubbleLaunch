/**
 * 60/40 Portfolio Strategy
 *
 * Classic balanced portfolio allocation:
 * - 60% stocks (SPY)
 * - 40% bonds (IEF)
 *
 * This is a simple fixed-allocation strategy that doesn't require rebalancing.
 * It serves as a traditional baseline comparison against more sophisticated strategies.
 */

/**
 * Calculate 60/40 portfolio (60% SPY / 40% IEF)
 * @param {Object} normalizedData - Price data normalized to base 100, format: { ticker: [{date, price}] }
 * @returns {Object} { portfolio: [{date, value}], allocations: [{date, SPY, IEF, GLD, ...}] }
 */
function calculateSixtyForty(normalizedData) {
  console.log('Calculating 60/40 portfolio...');

  if (!normalizedData || Object.keys(normalizedData).length === 0) {
    return { portfolio: [], allocations: [] };
  }

  // Check that both required tickers exist
  if (!normalizedData.SPY || !normalizedData.IEF) {
    console.error('60/40 portfolio requires both SPY and IEF data');
    return { portfolio: [], allocations: [] };
  }

  // Get all tickers for allocation tracking
  const tickers = Object.keys(normalizedData);
  const allDatesSet = new Set();

  // Collect all dates from SPY and IEF
  ['SPY', 'IEF'].forEach(function(ticker) {
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

  // Fixed allocations
  const SPY_WEIGHT = 0.6; // 60% stocks
  const IEF_WEIGHT = 0.4; // 40% bonds

  const portfolio = [];
  const allocations = [];

  allDates.forEach(function(date) {
    // Check if both SPY and IEF have prices for this date
    if (priceMap.SPY[date] && priceMap.IEF[date]) {
      // Calculate portfolio value: 60% SPY + 40% IEF
      const portfolioValue =
        SPY_WEIGHT * priceMap.SPY[date] +
        IEF_WEIGHT * priceMap.IEF[date];

      portfolio.push({
        date: date,
        value: portfolioValue
      });

      // Store allocation weights (fixed 60/40 for all dates)
      const allocationPoint = { date: date };
      tickers.forEach(function(ticker) {
        if (ticker === 'SPY') {
          allocationPoint[ticker] = SPY_WEIGHT;
        } else if (ticker === 'IEF') {
          allocationPoint[ticker] = IEF_WEIGHT;
        } else {
          allocationPoint[ticker] = 0.0;
        }
      });
      allocations.push(allocationPoint);
    }
  });

  console.log('60/40 portfolio: ' + portfolio.length + ' data points, 60% SPY / 40% IEF');
  return { portfolio: portfolio, allocations: allocations };
}

module.exports = { calculateSixtyForty };
