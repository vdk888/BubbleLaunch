/**
 * True Risk Budgeting Optimization Module
 *
 * This module implements mathematical risk parity through numerical optimization,
 * equalizing risk contributions rather than simple inverse volatility weighting.
 *
 * Mathematical Background:
 * - Risk Contribution RC_i = w_i * (Σ * w)_i / (w^T * Σ * w)^0.5
 * - For risk parity: RC_i = 1/N for all i
 * - We solve: minimize Σ(RC_i - 1/N)^2 subject to Σw_i = 1, w_i >= 0
 */

// Calculate covariance matrix from returns data
export const calculateCovarianceMatrix = (returnsSeries, tickers) => {
  const n = returnsSeries[tickers[0]].length;
  if (n === 0) return null;

  const covMatrix = {};

  // Initialize matrix
  tickers.forEach(ticker1 => {
    covMatrix[ticker1] = {};
    tickers.forEach(ticker2 => {
      covMatrix[ticker1][ticker2] = 0;
    });
  });

  // Calculate means
  const means = {};
  tickers.forEach(ticker => {
    means[ticker] = returnsSeries[ticker].reduce((sum, val) => sum + val, 0) / n;
  });

  // Calculate covariances
  tickers.forEach(ticker1 => {
    tickers.forEach(ticker2 => {
      let covariance = 0;
      for (let i = 0; i < n; i++) {
        covariance += (returnsSeries[ticker1][i] - means[ticker1]) *
                      (returnsSeries[ticker2][i] - means[ticker2]);
      }
      covMatrix[ticker1][ticker2] = covariance / (n - 1);
    });
  });

  return covMatrix;
};

// Calculate portfolio volatility: sqrt(w^T * Σ * w)
export const calculatePortfolioVolatility = (weights, covMatrix, tickers) => {
  let portfolioVariance = 0;

  tickers.forEach(ticker1 => {
    tickers.forEach(ticker2 => {
      portfolioVariance += weights[ticker1] * weights[ticker2] * covMatrix[ticker1][ticker2];
    });
  });

  return Math.sqrt(Math.max(portfolioVariance, 1e-10)); // Avoid division by zero
};

// Calculate marginal risk contributions: (Σ * w)_i
export const calculateMarginalRiskContributions = (weights, covMatrix, tickers) => {
  const marginalContribs = {};

  tickers.forEach(ticker1 => {
    let marginalContrib = 0;
    tickers.forEach(ticker2 => {
      marginalContrib += covMatrix[ticker1][ticker2] * weights[ticker2];
    });
    marginalContribs[ticker1] = marginalContrib;
  });

  return marginalContribs;
};

// Calculate risk contributions: RC_i = w_i * (Σ * w)_i / sqrt(w^T * Σ * w)
export const calculateRiskContributions = (weights, covMatrix, tickers) => {
  const portfolioVol = calculatePortfolioVolatility(weights, covMatrix, tickers);
  const marginalContribs = calculateMarginalRiskContributions(weights, covMatrix, tickers);
  const riskContribs = {};

  tickers.forEach(ticker => {
    riskContribs[ticker] = weights[ticker] * marginalContribs[ticker] / portfolioVol;
  });

  return riskContribs;
};

// Risk parity objective function: minimize sum of squared deviations from equal risk
export const riskParityObjective = (weights, covMatrix, tickers) => {
  const riskContribs = calculateRiskContributions(weights, covMatrix, tickers);
  const targetRiskContrib = 1.0 / tickers.length;
  let objective = 0;

  tickers.forEach(ticker => {
    const deviation = riskContribs[ticker] - targetRiskContrib;
    objective += deviation * deviation;
  });

  return objective;
};

// Gradient of the risk parity objective function
export const riskParityGradient = (weights, covMatrix, tickers, epsilon = 1e-8) => {
  const gradient = {};
  const baseObjective = riskParityObjective(weights, covMatrix, tickers);

  tickers.forEach(ticker => {
    // Create perturbed weights
    const perturbedWeights = { ...weights };
    perturbedWeights[ticker] += epsilon;

    // Renormalize
    const sum = Object.values(perturbedWeights).reduce((s, w) => s + w, 0);
    Object.keys(perturbedWeights).forEach(t => {
      perturbedWeights[t] /= sum;
    });

    const perturbedObjective = riskParityObjective(perturbedWeights, covMatrix, tickers);
    gradient[ticker] = (perturbedObjective - baseObjective) / epsilon;
  });

  return gradient;
};

// Project weights onto simplex (sum to 1, all positive) with stronger constraints
export const projectOntoSimplex = (weights, tickers) => {
  // Stronger constraints to prevent extreme allocations
  const minWeight = 0.05;  // Minimum 5% allocation per asset
  const maxWeight = 0.60;  // Maximum 60% allocation per asset
  const projected = {};

  tickers.forEach(ticker => {
    // Clamp weights between min and max
    projected[ticker] = Math.max(minWeight, Math.min(weights[ticker], maxWeight));
  });

  // Normalize to sum to 1
  const sum = Object.values(projected).reduce((s, w) => s + w, 0);
  tickers.forEach(ticker => {
    projected[ticker] /= sum;
  });

  // Final safety check
  const finalMax = Math.max(...Object.values(projected));
  const finalMin = Math.min(...Object.values(projected));
  if (finalMax > 0.7 || finalMin < 0.03) {
    console.warn(`⚠️ Constraint violation after projection: Max=${(finalMax*100).toFixed(1)}%, Min=${(finalMin*100).toFixed(1)}%`);
  }

  return projected;
};

// Risk Budgeting Optimization using Gradient Descent with Momentum
export const optimizeRiskBudgetingWeights = (
  covMatrix,
  tickers,
  maxIterations = 1000,
  learningRate = 0.01,
  tolerance = 1e-10,
  momentum = 0.9
) => {
  // Initialize with equal weights
  let weights = {};
  tickers.forEach(ticker => {
    weights[ticker] = 1.0 / tickers.length;
  });

  // Momentum terms
  let momentum_weights = {};
  tickers.forEach(ticker => {
    momentum_weights[ticker] = 0.0;
  });

  let prevObjective = Infinity;
  let iteration = 0;

  console.log('Starting Risk Budgeting Optimization...');

  for (iteration = 0; iteration < maxIterations; iteration++) {
    const objective = riskParityObjective(weights, covMatrix, tickers);

    // Check convergence (but skip on first iteration)
    if (iteration > 0 && Math.abs(prevObjective - objective) < tolerance) {
      console.log(`Risk Budgeting converged after ${iteration} iterations. Final objective: ${objective.toFixed(8)}`);
      console.log(`Convergence details: |${prevObjective.toFixed(12)} - ${objective.toFixed(12)}| = ${Math.abs(prevObjective - objective).toExponential()} < ${tolerance.toExponential()}`);
      break;
    }

    // Calculate gradient
    const gradient = riskParityGradient(weights, covMatrix, tickers);

    // Update weights with momentum
    const newWeights = {};
    const currentLR = learningRate;
    const currentWeights = weights;
    tickers.forEach(ticker => {
      // Momentum update
      momentum_weights[ticker] = momentum * momentum_weights[ticker] - currentLR * gradient[ticker];
      newWeights[ticker] = currentWeights[ticker] + momentum_weights[ticker];
    });

    // Debug: Check for NaN or extreme values
    const hasNaN = tickers.some(ticker => isNaN(newWeights[ticker]));
    const maxNewWeight = Math.max(...Object.values(newWeights));
    if (hasNaN || maxNewWeight > 10) {
      console.error('❌ OPTIMIZATION ERROR:', {
        iteration,
        hasNaN,
        maxNewWeight,
        gradient,
        newWeights
      });
    }

    // Project onto simplex (ensure sum=1 and non-negative)
    weights = projectOntoSimplex(newWeights, tickers);

    // Adaptive learning rate
    if (iteration > 0 && objective > prevObjective && iteration > 10) {
      learningRate *= 0.95; // Reduce learning rate if not improving
    }

    prevObjective = objective;

    // Log progress every 100 iterations
    if (iteration % 100 === 0) {
      console.log(`Iteration ${iteration}: Objective = ${objective.toFixed(8)}, LR = ${learningRate.toFixed(6)}`);
    }
  }

  if (iteration === maxIterations) {
    console.log(`Risk Budgeting reached maximum iterations (${maxIterations}). Final objective: ${riskParityObjective(weights, covMatrix, tickers).toFixed(8)}`);
  }

  // Verify final weights
  const finalRiskContribs = calculateRiskContributions(weights, covMatrix, tickers);
  console.log('Final Risk Budgeting Weights:', weights);
  console.log('Final Risk Contributions:', finalRiskContribs);

  // Debug: Check for extreme allocations
  const maxWeight = Math.max(...Object.values(weights));
  const minWeight = Math.min(...Object.values(weights));
  if (maxWeight > 0.8 || minWeight < 0.01) {
    console.warn(`⚠️ EXTREME ALLOCATION DETECTED: Max=${(maxWeight*100).toFixed(1)}%, Min=${(minWeight*100).toFixed(1)}%`);
    console.warn('Weights:', Object.fromEntries(Object.entries(weights).map(([k,v]) => [k, `${(v*100).toFixed(1)}%`])));
  }

  return weights;
};

// Alternative: Cyclical Coordinate Descent approach (more stable for some cases)
export const optimizeRiskBudgetingCCD = (
  covMatrix,
  tickers,
  maxIterations = 500,
  tolerance = 1e-10
) => {
  // Initialize with equal weights
  let weights = {};
  tickers.forEach(ticker => {
    weights[ticker] = 1.0 / tickers.length;
  });

  let prevObjective = Infinity;

  console.log('Starting Risk Budgeting Optimization (Cyclical Coordinate Descent)...');

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const objective = riskParityObjective(weights, covMatrix, tickers);

    if (iteration > 0 && Math.abs(prevObjective - objective) < tolerance) {
      console.log(`Risk Budgeting CCD converged after ${iteration} iterations. Final objective: ${objective.toFixed(8)}`);
      break;
    }

    // Update each weight cyclically
    const currentWeights = { ...weights };
    tickers.forEach(ticker => {
      const otherTickers = tickers.filter(t => t !== ticker);
      const otherWeightSum = otherTickers.reduce((sum, t) => sum + currentWeights[t], 0);

      // Binary search for optimal weight for this asset
      let low = 0.001; // minimum weight
      let high = 1.0 - otherWeightSum;

      for (let i = 0; i < 20; i++) { // 20 binary search iterations
        const mid = (low + high) / 2;
        const testWeights = { ...currentWeights };
        testWeights[ticker] = mid;

        // Renormalize
        const sum = Object.values(testWeights).reduce((s, w) => s + w, 0);
        Object.keys(testWeights).forEach(t => {
          testWeights[t] /= sum;
        });

        const obj1 = riskParityObjective(testWeights, covMatrix, tickers);

        // Test slightly higher weight
        const testWeights2 = { ...currentWeights };
        testWeights2[ticker] = mid + (high - low) * 0.01;
        const sum2 = Object.values(testWeights2).reduce((s, w) => s + w, 0);
        Object.keys(testWeights2).forEach(t => {
          testWeights2[t] /= sum2;
        });
        const obj2 = riskParityObjective(testWeights2, covMatrix, tickers);

        if (obj2 < obj1) {
          low = mid;
        } else {
          high = mid;
        }
      }

      currentWeights[ticker] = (low + high) / 2;
    });

    weights = currentWeights;

    // Renormalize weights
    weights = projectOntoSimplex(weights, tickers);
    prevObjective = objective;
  }

  const finalRiskContribs = calculateRiskContributions(weights, covMatrix, tickers);
  console.log('Final Risk Budgeting Weights (CCD):', weights);
  console.log('Final Risk Contributions (CCD):', finalRiskContribs);

  return weights;
};

// Calculate True Risk Budgeting Portfolio with proper mathematical optimization
export const calculateTrueRiskBudgeting = (
  normalizedData,
  rebalanceFreqDays = 21,
  lookbackDays = 120,
  optimizationMethod = 'gradient_descent' // or 'ccd'
) => {
  console.log('Calculating True Risk Budgeting Portfolio using mathematical optimization...');

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

    // Rebalance check
    const shouldRebalance = (i >= lookbackDays && i % rebalanceFreqDays === 0) || i === lookbackDays;

    if (shouldRebalance && i >= lookbackDays) {
      // Calculate returns series for the lookback period
      const returnsSeries = {};
      tickers.forEach(ticker => {
        returnsSeries[ticker] = [];
      });

      // Collect returns data
      for (let j = Math.max(0, i - lookbackDays); j < i - 1; j++) {
        const currDate = allDates[j + 1];
        const prevDate = allDates[j];

        let hasAllReturns = true;
        const dailyReturns = {};

        tickers.forEach(ticker => {
          const currPrice = priceMap[ticker][currDate];
          const prevPrice = priceMap[ticker][prevDate];

          if (currPrice && prevPrice && prevPrice !== 0) {
            dailyReturns[ticker] = (currPrice - prevPrice) / prevPrice;
          } else {
            hasAllReturns = false;
          }
        });

        if (hasAllReturns) {
          tickers.forEach(ticker => {
            returnsSeries[ticker].push(dailyReturns[ticker]);
          });
        }
      }

      // Check if we have enough data points
      const minDataPoints = Math.min(...tickers.map(ticker => returnsSeries[ticker].length));
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
              console.log(`True Risk Budgeting Rebalancing on ${date}:`, currentWeights);
              const riskContribs = calculateRiskContributions(currentWeights, covMatrix, tickers);
              console.log(`Risk Contributions:`, riskContribs);
            }
          } catch (error) {
            console.warn(`Risk budgeting optimization failed on ${date}:`, error);
            // Keep previous weights if optimization fails
          }
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

  console.log(`True Risk Budgeting portfolio: ${portfolioData.length} data points`);
  return { portfolioData, weightsData };
};