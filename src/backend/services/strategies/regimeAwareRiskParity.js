/**
 * Regime-Aware Risk Parity Strategy
 *
 * This strategy adapts portfolio parameters based on detected market regimes.
 * It combines EWMA volatility calculations with correlation adjustments,
 * while dynamically adjusting key parameters based on market conditions.
 *
 * Key Features:
 * - Adaptive rebalancing frequency (more frequent in high volatility)
 * - Dynamic EWMA lambda parameter (more reactive in low volatility)
 * - Regime-adjusted correlation penalty
 * - Market regime detection (volatility, trend, crisis)
 *
 * Ported from anim-main project with CommonJS compatibility
 */

// Import calculation functions from portfolio helpers
const {
  calculateReturns,
  calculateEWMAVolatility,
  calculatePearsonCorrelation
} = require('../portfolioHelpers');

// Import regime detection functions
const { getAdaptiveParameters } = require('./regimeDetection');

/**
 * Calculate Regime-Aware Enhanced Risk Parity Portfolio
 *
 * This strategy detects market regimes and adapts its parameters accordingly:
 * - In high volatility: More frequent rebalancing, higher EWMA smoothing
 * - In low volatility: Less frequent rebalancing, more reactive EWMA
 * - In crisis: Maximum defensive positioning with tight rebalancing
 *
 * @param {Object} normalizedData - Normalized price data for all ETFs
 *                                  Format: { 'SPY': [{date, price}, ...], 'IEF': [...], ... }
 * @param {number} baseRebalanceFreqDays - Base rebalancing frequency in days (default: 21)
 * @param {number} baseLookbackDays - Base lookback period for calculations (default: 60)
 * @returns {Object} { portfolio: [...], allocations: [...] }
 *                   portfolio: Array of {date, value} objects
 *                   allocations: Array of {date, SPY, IEF, GLD, ...} weight objects
 */
function calculateRegimeAwareRiskParity(normalizedData, baseRebalanceFreqDays = 21, baseLookbackDays = 60) {
  console.log('Calculating Regime-Aware Enhanced Risk Parity...');

  if (!normalizedData || Object.keys(normalizedData).length === 0) {
    return { portfolio: null, allocations: null };
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

  const portfolio = [];
  const allocations = [];
  let currentWeights = {};
  tickers.forEach(ticker => {
    currentWeights[ticker] = 1.0 / tickers.length;
  });

  // Regime detection will be handled via direct function calls

  allDates.forEach((date, i) => {
    let hasAllPrices = true;
    tickers.forEach(ticker => {
      if (!priceMap[ticker][date]) {
        hasAllPrices = false;
      }
    });

    if (!hasAllPrices) return;

    // Get adaptive parameters based on regime
    let adaptiveParams = {
      rebalanceFreqDays: baseRebalanceFreqDays,
      ewmaLambda: 0.94,
      correlationPenalty: 0.5
    };

    try {
      if (i >= 252) { // Need sufficient data for regime detection
        const priceHistory = [];
        for (let j = Math.max(0, i - 252); j <= i; j++) {
          const datePoint = allDates[j];
          const avgPrice = tickers.reduce((sum, ticker) => {
            return sum + (priceMap[ticker][datePoint] || 0);
          }, 0) / tickers.length;
          priceHistory.push({ date: datePoint, price: avgPrice });
        }

        adaptiveParams = getAdaptiveParameters(priceHistory, {
          baseRebalanceFreq: baseRebalanceFreqDays,
          baseEwmaLambda: 0.94,
          baseCorrelationPenalty: 0.5
        });
      }
    } catch (error) {
      console.log('Regime detection fallback to base parameters');
    }

    // Rebalance check with adaptive frequency
    const shouldRebalance = (i >= baseLookbackDays && i % adaptiveParams.rebalanceFreqDays === 0) || i === baseLookbackDays;

    if (shouldRebalance && i >= baseLookbackDays) {
      // Calculate volatilities using adaptive EWMA lambda
      const volatilities = {};

      tickers.forEach(ticker => {
        const priceSlice = [];
        for (let j = Math.max(0, i - baseLookbackDays); j < i; j++) {
          if (priceMap[ticker][allDates[j]]) {
            priceSlice.push({ price: priceMap[ticker][allDates[j]] });
          }
        }

        if (priceSlice.length >= 20) {
          const returns = calculateReturns(priceSlice);
          const volatility = returns.length > 0 ?
            calculateEWMAVolatility(returns, adaptiveParams.ewmaLambda) : 0.15;
          volatilities[ticker] = Math.max(volatility, 0.05);
        } else {
          volatilities[ticker] = 0.15;
        }
      });

      // Calculate rolling correlations with adaptive penalty
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

      // Calculate correlation-adjusted inverse volatility weights with adaptive penalty
      const invVols = {};

      tickers.forEach(ticker => {
        const baseInvVol = 1.0 / volatilities[ticker];
        const correlationPenalty = 1.0 + adaptiveParams.correlationPenalty * avgCorrelations[ticker];
        const adjustedInvVol = baseInvVol / correlationPenalty;
        invVols[ticker] = adjustedInvVol;
      });

      const totalInvVol = Object.values(invVols).reduce((sum, val) => sum + val, 0);

      if (totalInvVol > 0) {
        tickers.forEach(ticker => {
          currentWeights[ticker] = invVols[ticker] / totalInvVol;
        });
      }
    }

    // Calculate portfolio value
    let portfolioValue = 0;
    tickers.forEach(ticker => {
      portfolioValue += currentWeights[ticker] * priceMap[ticker][date];
    });

    portfolio.push({
      date,
      value: portfolioValue
    });

    // Store weights
    const weightPoint = { date };
    tickers.forEach(ticker => {
      weightPoint[ticker] = currentWeights[ticker];
    });
    allocations.push(weightPoint);
  });

  console.log(`Regime-aware risk parity: ${portfolio.length} data points`);
  return { portfolio, allocations };
}

// Export the strategy function
module.exports = { calculateRegimeAwareRiskParity };
