// Portfolio calculation web worker
// This worker handles expensive portfolio calculations in the background

// Import calculation functions (we'll need to restructure these to avoid React dependencies)
const calculateEWMAVolatility = (returns, lambda = 0.94) => {
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
};

const calculateReturns = (prices) => {
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    const returnValue = (prices[i].price - prices[i-1].price) / prices[i-1].price;
    returns.push(returnValue);
  }
  return returns;
};

const calculatePearsonCorrelation = (x, y) => {
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
};

// Equal weight portfolio calculation
const calculateEqualWeightPortfolioWorker = (normalizedData) => {
  if (!normalizedData || Object.keys(normalizedData).length === 0) {
    return null;
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

  const weight = 1.0 / tickers.length;
  const portfolioData = [];

  allDates.forEach(date => {
    let portfolioValue = 0;
    let hasAllPrices = true;

    tickers.forEach(ticker => {
      if (!priceMap[ticker][date]) {
        hasAllPrices = false;
      }
    });

    if (hasAllPrices) {
      tickers.forEach(ticker => {
        portfolioValue += weight * priceMap[ticker][date];
      });

      portfolioData.push({
        date,
        value: portfolioValue
      });
    }
  });

  return portfolioData;
};

// Simple Risk Parity calculation
const calculateSimpleRiskParityWorker = (normalizedData, rebalanceFreqDays = 21, lookbackDays = 60) => {
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

    const shouldRebalance = (i >= lookbackDays && i % rebalanceFreqDays === 0) || i === lookbackDays;

    if (shouldRebalance && i >= lookbackDays) {
      const volatilities = {};

      tickers.forEach(ticker => {
        const priceSlice = [];
        for (let j = Math.max(0, i - lookbackDays); j < i; j++) {
          if (priceMap[ticker][allDates[j]]) {
            priceSlice.push({ price: priceMap[ticker][allDates[j]] });
          }
        }

        if (priceSlice.length >= 20) {
          const returns = calculateReturns(priceSlice);
          const volatility = returns.length > 0 ?
            Math.sqrt(returns.reduce((sum, r) => sum + r * r, 0) / returns.length) * Math.sqrt(252) : 0.15;
          volatilities[ticker] = Math.max(volatility, 0.05);
        } else {
          volatilities[ticker] = 0.15;
        }
      });

      const invVols = {};
      tickers.forEach(ticker => {
        invVols[ticker] = 1.0 / volatilities[ticker];
      });

      const totalInvVol = Object.values(invVols).reduce((sum, val) => sum + val, 0);

      if (totalInvVol > 0) {
        tickers.forEach(ticker => {
          currentWeights[ticker] = invVols[ticker] / totalInvVol;
        });
      }
    }

    let portfolioValue = 0;
    tickers.forEach(ticker => {
      portfolioValue += currentWeights[ticker] * priceMap[ticker][date];
    });

    portfolioData.push({
      date,
      value: portfolioValue
    });

    const weightPoint = { date };
    tickers.forEach(ticker => {
      weightPoint[ticker] = currentWeights[ticker];
    });
    weightsData.push(weightPoint);
  });

  return { portfolioData, weightsData };
};

// Enhanced Risk Parity calculation
const calculateEnhancedRiskParityWorker = (normalizedData, rebalanceFreqDays = 21, lookbackDays = 60) => {
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

    const shouldRebalance = (i >= lookbackDays && i % rebalanceFreqDays === 0) || i === lookbackDays;

    if (shouldRebalance && i >= lookbackDays) {
      const volatilities = {};

      tickers.forEach(ticker => {
        const returns21 = [];
        const returns60 = [];
        const returns252 = [];

        if (i >= 21) {
          for (let j = Math.max(0, i - 21); j < i - 1; j++) {
            const curr = priceMap[ticker][allDates[j + 1]];
            const prev = priceMap[ticker][allDates[j]];
            if (curr && prev && prev !== 0) {
              returns21.push((curr - prev) / prev);
            }
          }
        }

        if (i >= 60) {
          for (let j = Math.max(0, i - 60); j < i - 1; j++) {
            const curr = priceMap[ticker][allDates[j + 1]];
            const prev = priceMap[ticker][allDates[j]];
            if (curr && prev && prev !== 0) {
              returns60.push((curr - prev) / prev);
            }
          }
        }

        if (i >= 252) {
          for (let j = Math.max(0, i - 252); j < i - 1; j++) {
            const curr = priceMap[ticker][allDates[j + 1]];
            const prev = priceMap[ticker][allDates[j]];
            if (curr && prev && prev !== 0) {
              returns252.push((curr - prev) / prev);
            }
          }
        }

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

        volatilities[ticker] = Math.max(finalVolatility, 0.05);
      });

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
      }
    }

    let portfolioVal = 0;
    tickers.forEach(ticker => {
      portfolioVal += currentWeights[ticker] * priceMap[ticker][date];
    });

    portfolioData.push({
      date,
      value: portfolioVal
    });

    const weightPoint = { date };
    tickers.forEach(ticker => {
      weightPoint[ticker] = currentWeights[ticker];
    });
    weightsData.push(weightPoint);
  });

  return { portfolioData, weightsData };
};

// Message handler for the web worker
self.onmessage = function(e) {
  const { type, payload, id } = e.data;

  try {
    let result;

    // Report progress for long-running calculations
    self.postMessage({
      type: 'progress',
      id,
      progress: 0,
      message: `Starting ${type} calculation...`
    });

    switch (type) {
      case 'calculateEqualWeight':
        result = calculateEqualWeightPortfolioWorker(payload.normalizedData);
        break;
      case 'calculateSimpleRiskParity':
        result = calculateSimpleRiskParityWorker(
          payload.normalizedData,
          payload.rebalanceFreqDays,
          payload.lookbackDays
        );
        break;
      case 'calculateEnhancedRiskParity':
        result = calculateEnhancedRiskParityWorker(
          payload.normalizedData,
          payload.rebalanceFreqDays,
          payload.lookbackDays
        );
        break;
      case 'calculateLeveragedEqualWeight':
        // For now, we'll handle this in the main thread as it's more complex
        self.postMessage({
          type: 'error',
          id,
          error: 'Leveraged calculations not yet supported in web worker'
        });
        return;
      default:
        throw new Error(`Unknown calculation type: ${type}`);
    }

    self.postMessage({
      type: 'progress',
      id,
      progress: 100,
      message: `${type} calculation completed`
    });

    self.postMessage({
      type: 'result',
      id,
      result
    });

  } catch (error) {
    self.postMessage({
      type: 'error',
      id,
      error: error.message
    });
  }
};