// Simple Risk Parity - basic inverse volatility weighting
// Ported from anim-main ES6 to CommonJS

/**
 * Calculate price returns from price array
 * @param {Array} prices - Array of {price} objects
 * @returns {Array} Array of return values
 */
function calculateReturns(prices) {
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    const returnValue = (prices[i].price - prices[i-1].price) / prices[i-1].price;
    returns.push(returnValue);
  }
  return returns;
}

/**
 * Calculate Simple Risk Parity portfolio with inverse volatility weighting
 * @param {Object} normalizedData - Object with ticker keys and normalized price arrays
 * @param {number} rebalanceFreqDays - Rebalancing frequency in days (default: 21)
 * @param {number} lookbackDays - Lookback period for volatility calculation (default: 60)
 * @returns {Object} { portfolio: [{date, value}], allocations: [{date, SPY, IEF, ...}] }
 */
function calculateSimpleRiskParity(normalizedData, rebalanceFreqDays = 21, lookbackDays = 60) {
  console.log('Calculating simple risk parity portfolio...');

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
  tickers.forEach(function(ticker) {
    currentWeights[ticker] = 1.0 / tickers.length; // Start with equal weights
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
      // Calculate volatilities using lookback period
      const volatilities = {};

      tickers.forEach(function(ticker) {
        const priceSlice = [];
        for (let j = Math.max(0, i - lookbackDays); j < i; j++) {
          if (priceMap[ticker][allDates[j]]) {
            priceSlice.push({ price: priceMap[ticker][allDates[j]] });
          }
        }

        if (priceSlice.length >= 20) {
          const returns = calculateReturns(priceSlice);
          const volatility = returns.length > 0 ?
            Math.sqrt(returns.reduce(function(sum, r) { return sum + r * r; }, 0) / returns.length) * Math.sqrt(252) : 0.15;
          volatilities[ticker] = Math.max(volatility, 0.05); // Floor at 5%
        } else {
          volatilities[ticker] = 0.15; // Default
        }
      });

      // Calculate inverse volatility weights
      const invVols = {};
      tickers.forEach(function(ticker) {
        invVols[ticker] = 1.0 / volatilities[ticker];
      });

      const totalInvVol = Object.values(invVols).reduce(function(sum, val) { return sum + val; }, 0);

      if (totalInvVol > 0) {
        tickers.forEach(function(ticker) {
          currentWeights[ticker] = invVols[ticker] / totalInvVol;
        });

        if (i % (rebalanceFreqDays * 12) === 0) { // Log every ~year
          console.log(`Simple Risk Parity Rebalancing on ${date}:`, currentWeights);
        }
      }
    }

    // Calculate portfolio value
    let portfolioValue = 0;
    tickers.forEach(function(ticker) {
      portfolioValue += currentWeights[ticker] * priceMap[ticker][date];
    });

    portfolio.push({
      date,
      value: portfolioValue
    });

    // Store weights
    const weightPoint = { date };
    tickers.forEach(function(ticker) {
      weightPoint[ticker] = currentWeights[ticker];
    });
    allocations.push(weightPoint);
  });

  console.log(`Simple risk parity portfolio: ${portfolio.length} data points`);
  return { portfolio, allocations };
}

module.exports = { calculateSimpleRiskParity };
