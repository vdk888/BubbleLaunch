// Portfolio calculation functions - direct ports from Python script
import { calculateTrueRiskBudgeting } from './riskBudgeting.js';
import { calculateHierarchicalRiskParity } from './hierarchicalRiskParity.js';
import { DynamicCorrelationService } from './dynamicCorrelations.js';
import { getAdaptiveParameters } from './regimeDetection.js';

// Calculate equal weight portfolio (equal allocation to all ETFs)
export const calculateEqualWeightPortfolio = (normalizedData) => {
  console.log('Calculating equal weight portfolio...');

  if (!normalizedData || Object.keys(normalizedData).length === 0) {
    return null;
  }

  // Get common dates for all ETFs
  const tickers = Object.keys(normalizedData);
  const allDatesSet = new Set();

  // Collect all dates
  tickers.forEach(ticker => {
    normalizedData[ticker].forEach(dataPoint => {
      allDatesSet.add(dataPoint.date);
    });
  });

  const allDates = Array.from(allDatesSet).sort();

  // Create a map for quick price lookup
  const priceMap = {};
  tickers.forEach(ticker => {
    priceMap[ticker] = {};
    normalizedData[ticker].forEach(dataPoint => {
      priceMap[ticker][dataPoint.date] = dataPoint.price;
    });
  });

  const weight = 1.0 / tickers.length; // Equal weight for all assets
  const portfolioData = [];

  allDates.forEach(date => {
    let portfolioValue = 0;
    let hasAllPrices = true;

    // Check if all ETFs have prices for this date
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

  console.log(`Equal weight portfolio: ${portfolioData.length} data points, ${(weight * 100).toFixed(1)}% allocation each`);
  return portfolioData;
};

// Calculate leveraged equal weight portfolio
export const calculateLeveragedEqualWeightPortfolio = (normalizedData, leverage = 2.0, borrowingRate = 0.08) => {
  console.log(`Calculating leveraged equal weight portfolio: ${leverage}x leverage, ${(borrowingRate * 100).toFixed(1)}% borrowing rate`);

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

  const equalWeights = {};
  tickers.forEach(ticker => {
    equalWeights[ticker] = 1.0 / tickers.length;
  });

  const portfolioData = [];
  let previousPortfolioVal = 100.0; // Starting value

  allDates.forEach((date, i) => {
    let hasAllPrices = true;
    tickers.forEach(ticker => {
      if (!priceMap[ticker][date]) {
        hasAllPrices = false;
      }
    });

    if (!hasAllPrices) return;

    // Calculate unleveraged equal weight portfolio value
    let unleveragedPortfolioVal = 0;
    tickers.forEach(ticker => {
      unleveragedPortfolioVal += equalWeights[ticker] * priceMap[ticker][date];
    });

    let portfolioVal;

    if (i === 0) {
      // First day: start with base 100, no leverage effect yet
      portfolioVal = 100.0;
    } else {
      // Calculate daily returns for leveraged portfolio
      const prevDate = allDates[i - 1];
      let prevUnleveraged = 0;
      tickers.forEach(ticker => {
        if (priceMap[ticker][prevDate]) {
          prevUnleveraged += equalWeights[ticker] * priceMap[ticker][prevDate];
        }
      });

      if (prevUnleveraged > 0) {
        const dailyUnleveragedReturn = (unleveragedPortfolioVal / prevUnleveraged) - 1.0;
        const dailyLeveragedReturn = leverage * dailyUnleveragedReturn;

        // Apply leveraged return to previous portfolio value
        const portfolioValBeforeCost = previousPortfolioVal * (1.0 + dailyLeveragedReturn);

        // Calculate daily borrowing cost (8% annual on borrowed amount)
        const equityAmount = previousPortfolioVal / leverage; // Our actual equity
        const borrowedAmount = previousPortfolioVal - equityAmount; // Amount borrowed
        const dailyBorrowingRate = borrowingRate / 252;
        const dailyBorrowingCost = borrowedAmount * dailyBorrowingRate;

        // Final portfolio value after borrowing costs
        portfolioVal = portfolioValBeforeCost - dailyBorrowingCost;
      } else {
        portfolioVal = previousPortfolioVal;
      }
    }

    portfolioData.push({
      date,
      value: portfolioVal
    });

    previousPortfolioVal = portfolioVal;
  });

  console.log(`Leveraged equal weight portfolio: ${portfolioData.length} data points, ${leverage}x leverage`);
  return portfolioData;
};

// Calculate EWMA volatility
export const calculateEWMAVolatility = (returns, lambda = 0.94) => {
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

// Calculate price returns from price array
export const calculateReturns = (prices) => {
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    const returnValue = (prices[i].price - prices[i-1].price) / prices[i-1].price;
    returns.push(returnValue);
  }
  return returns;
};

// Calculate correlation matrix
export const calculateCorrelationMatrix = (returnsSeries) => {
  const tickers = Object.keys(returnsSeries);
  const correlationMatrix = {};

  tickers.forEach(ticker1 => {
    correlationMatrix[ticker1] = {};
    tickers.forEach(ticker2 => {
      if (ticker1 === ticker2) {
        correlationMatrix[ticker1][ticker2] = 1.0;
      } else {
        const returns1 = returnsSeries[ticker1];
        const returns2 = returnsSeries[ticker2];
        const correlation = calculatePearsonCorrelation(returns1, returns2);
        correlationMatrix[ticker1][ticker2] = correlation;
      }
    });
  });

  return correlationMatrix;
};

// Calculate Pearson correlation
export const calculatePearsonCorrelation = (x, y) => {
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

// Simple Risk Parity - basic inverse volatility weighting
export const calculateSimpleRiskParity = (normalizedData, rebalanceFreqDays = 21, lookbackDays = 60) => {
  console.log('Calculating simple risk parity portfolio...');

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
    currentWeights[ticker] = 1.0 / tickers.length; // Start with equal weights
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

    // Rebalance check
    const shouldRebalance = (i >= lookbackDays && i % rebalanceFreqDays === 0) || i === lookbackDays;

    if (shouldRebalance && i >= lookbackDays) {
      // Calculate volatilities using lookback period
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
          volatilities[ticker] = Math.max(volatility, 0.05); // Floor at 5%
        } else {
          volatilities[ticker] = 0.15; // Default
        }
      });

      // Calculate inverse volatility weights
      const invVols = {};
      tickers.forEach(ticker => {
        invVols[ticker] = 1.0 / volatilities[ticker];
      });

      const totalInvVol = Object.values(invVols).reduce((sum, val) => sum + val, 0);

      if (totalInvVol > 0) {
        tickers.forEach(ticker => {
          currentWeights[ticker] = invVols[ticker] / totalInvVol;
        });

        if (i % (rebalanceFreqDays * 12) === 0) { // Log every ~year
          console.log(`Simple Risk Parity Rebalancing on ${date}:`, currentWeights);
        }
      }
    }

    // Calculate portfolio value
    let portfolioValue = 0;
    tickers.forEach(ticker => {
      portfolioValue += currentWeights[ticker] * priceMap[ticker][date];
    });

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
  });

  console.log(`Simple risk parity portfolio: ${portfolioData.length} data points`);
  return { portfolioData, weightsData };
};

// Enhanced Risk Parity - EWMA + Correlation Adjusted (unleveraged)
export const calculateEnhancedRiskParity = (normalizedData, rebalanceFreqDays = 21, lookbackDays = 60) => {
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
};

// Enhanced Risk Parity - EWMA + Correlation Adjusted (with leverage)
export const calculateLeveragedEnhancedRiskParity = (normalizedData, rebalanceFreqDays = 21, lookbackDays = 60, leverage = 2.0, borrowingRate = 0.08) => {
  console.log(`Calculating leveraged enhanced risk parity: EWMA + Correlation Adjusted, ${leverage}x leverage, ${(borrowingRate * 100).toFixed(1)}% borrowing rate`);

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

  let previousPortfolioVal = 100.0; // Starting value

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
          console.log(`Leveraged Enhanced Risk Parity Rebalancing on ${date}:`, currentWeights);
        }
      }
    }

    // Calculate portfolio value with leverage mechanics
    let unleveragedPortfolioVal = 0;
    tickers.forEach(ticker => {
      unleveragedPortfolioVal += currentWeights[ticker] * priceMap[ticker][date];
    });

    let portfolioVal;

    if (i === 0) {
      portfolioVal = 100.0;
    } else {
      // Calculate leveraged returns
      const prevDate = allDates[i - 1];
      let prevUnleveraged = 0;
      tickers.forEach(ticker => {
        if (priceMap[ticker][prevDate]) {
          prevUnleveraged += currentWeights[ticker] * priceMap[ticker][prevDate];
        }
      });

      if (prevUnleveraged > 0) {
        const dailyUnleveragedReturn = (unleveragedPortfolioVal / prevUnleveraged) - 1.0;
        const dailyLeveragedReturn = leverage * dailyUnleveragedReturn;

        const portfolioValBeforeCost = previousPortfolioVal * (1.0 + dailyLeveragedReturn);

        // Calculate daily borrowing cost
        const equityAmount = previousPortfolioVal / leverage;
        const borrowedAmount = previousPortfolioVal - equityAmount;
        const dailyBorrowingRate = borrowingRate / 252;
        const dailyBorrowingCost = borrowedAmount * dailyBorrowingRate;

        portfolioVal = portfolioValBeforeCost - dailyBorrowingCost;
      } else {
        portfolioVal = previousPortfolioVal;
      }
    }

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

    previousPortfolioVal = portfolioVal;
  });

  console.log(`Leveraged enhanced risk parity portfolio: ${portfolioData.length} data points, ${leverage}x leverage`);
  return { portfolioData, weightsData };
};

// True Risk Budgeting Portfolio - Mathematical Risk Parity with Optimization
export const calculateOptimizedRiskBudgeting = (normalizedData, rebalanceFreqDays = 21, lookbackDays = 120, optimizationMethod = 'gradient_descent') => {
  console.log('Calculating Optimized Risk Budgeting Portfolio using mathematical optimization...');

  return calculateTrueRiskBudgeting(normalizedData, rebalanceFreqDays, lookbackDays, optimizationMethod);
};

// Hierarchical Risk Parity Portfolio - Machine Learning Clustering with Multi-Level Risk Allocation
export const calculateHierarchicalRiskParityPortfolio = (normalizedData, rebalanceFreqDays = 21, lookbackDays = 126, maxClusters = 3) => {
  console.log('Calculating Hierarchical Risk Parity Portfolio using machine learning clustering...');

  return calculateHierarchicalRiskParity(normalizedData, rebalanceFreqDays, lookbackDays, maxClusters);
};

// Enhanced Risk Parity with Dynamic Conditional Correlation
export const calculateEnhancedRiskParityWithDCC = (normalizedData, rebalanceFreqDays = 21, lookbackDays = 60) => {
  console.log('Calculating Enhanced Risk Parity with Dynamic Conditional Correlation...');

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

  // Initialize DCC service
  const dccService = new DynamicCorrelationService();

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
      // Calculate volatilities using EWMA
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
            calculateEWMAVolatility(returns, 0.94) : 0.15;
          volatilities[ticker] = Math.max(volatility, 0.05);
        } else {
          volatilities[ticker] = 0.15;
        }
      });

      // Get dynamic correlations from DCC if available
      let avgCorrelations = {};
      try {
        // Try to get dynamic correlations
        if (i >= 252) { // Need sufficient data for DCC
          const returnsSeries = {};
          tickers.forEach(ticker => {
            const returns = [];
            for (let j = Math.max(0, i - 252); j < i - 1; j++) {
              const curr = priceMap[ticker][allDates[j + 1]];
              const prev = priceMap[ticker][allDates[j]];
              if (curr && prev && prev !== 0) {
                returns.push((curr - prev) / prev);
              }
            }
            returnsSeries[ticker] = returns;
          });

          if (Object.keys(returnsSeries).length === tickers.length) {
            dccService.updateWithReturns(returnsSeries);
            avgCorrelations = dccService.calculateDynamicAverageCorrelations(tickers);
          }
        }
      } catch (error) {
        console.log('DCC fallback to rolling correlations');
        // Fallback to rolling correlations
        avgCorrelations = {};
        tickers.forEach(ticker => {
          avgCorrelations[ticker] = 0.0;
        });
      }

      // Calculate correlation-adjusted inverse volatility weights
      const correlationPenaltyFactor = 0.5;
      const invVols = {};

      tickers.forEach(ticker => {
        const baseInvVol = 1.0 / volatilities[ticker];
        const correlationPenalty = 1.0 + correlationPenaltyFactor * (avgCorrelations[ticker] || 0.0);
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
  });

  console.log(`Enhanced risk parity with DCC: ${portfolioData.length} data points`);
  return { portfolioData, weightsData };
};

// Regime-Aware Enhanced Risk Parity
export const calculateRegimeAwareRiskParity = (normalizedData, baseRebalanceFreqDays = 21, baseLookbackDays = 60) => {
  console.log('Calculating Regime-Aware Enhanced Risk Parity...');

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
  });

  console.log(`Regime-aware risk parity: ${portfolioData.length} data points`);
  return { portfolioData, weightsData };
};