/**
 * True Risk Budgeting Optimization Engine
 *
 * Ported from anim-main (ES6) to CommonJS
 *
 * This module implements mathematical risk parity through numerical optimization,
 * equalizing risk contributions rather than simple inverse volatility weighting.
 *
 * Mathematical Background:
 * - Risk Contribution RC_i = w_i * (Σ * w)_i / (w^T * Σ * w)^0.5
 * - For risk parity: RC_i = 1/N for all i
 * - We solve: minimize Σ(RC_i - 1/N)^2 subject to Σw_i = 1, w_i >= 0
 *
 * Key Algorithms:
 * 1. Gradient Descent with Momentum (primary)
 * 2. Cyclical Coordinate Descent (alternative, more stable)
 */

// Portfolio constraints
const MIN_WEIGHT = 0.05;  // Minimum 5% allocation per asset
const MAX_WEIGHT = 0.60;  // Maximum 60% allocation per asset

/**
 * Calculate covariance matrix from returns data
 * @param {Object} returnsSeries - Object with ticker keys and returns arrays
 * @param {Array} tickers - Array of ticker symbols
 * @returns {Object} Covariance matrix as nested object
 */
function calculateCovarianceMatrix(returnsSeries, tickers) {
  const n = returnsSeries[tickers[0]].length;
  if (n === 0) return null;

  const covMatrix = {};

  // Initialize matrix
  tickers.forEach(function(ticker1) {
    covMatrix[ticker1] = {};
    tickers.forEach(function(ticker2) {
      covMatrix[ticker1][ticker2] = 0;
    });
  });

  // Calculate means
  const means = {};
  tickers.forEach(function(ticker) {
    means[ticker] = returnsSeries[ticker].reduce(function(sum, val) {
      return sum + val;
    }, 0) / n;
  });

  // Calculate covariances
  tickers.forEach(function(ticker1) {
    tickers.forEach(function(ticker2) {
      let covariance = 0;
      for (let i = 0; i < n; i++) {
        covariance += (returnsSeries[ticker1][i] - means[ticker1]) *
                      (returnsSeries[ticker2][i] - means[ticker2]);
      }
      covMatrix[ticker1][ticker2] = covariance / (n - 1);
    });
  });

  return covMatrix;
}

/**
 * Calculate portfolio volatility: sqrt(w^T * Σ * w)
 * @param {Object} weights - Portfolio weights
 * @param {Object} covMatrix - Covariance matrix
 * @param {Array} tickers - Array of ticker symbols
 * @returns {number} Portfolio volatility
 */
function calculatePortfolioVolatility(weights, covMatrix, tickers) {
  let portfolioVariance = 0;

  tickers.forEach(function(ticker1) {
    tickers.forEach(function(ticker2) {
      portfolioVariance += weights[ticker1] * weights[ticker2] * covMatrix[ticker1][ticker2];
    });
  });

  return Math.sqrt(Math.max(portfolioVariance, 1e-10)); // Avoid division by zero
}

/**
 * Calculate marginal risk contributions: (Σ * w)_i
 * @param {Object} weights - Portfolio weights
 * @param {Object} covMatrix - Covariance matrix
 * @param {Array} tickers - Array of ticker symbols
 * @returns {Object} Marginal risk contributions
 */
function calculateMarginalRiskContributions(weights, covMatrix, tickers) {
  const marginalContribs = {};

  tickers.forEach(function(ticker1) {
    let marginalContrib = 0;
    tickers.forEach(function(ticker2) {
      marginalContrib += covMatrix[ticker1][ticker2] * weights[ticker2];
    });
    marginalContribs[ticker1] = marginalContrib;
  });

  return marginalContribs;
}

/**
 * Calculate risk contributions: RC_i = w_i * (Σ * w)_i / sqrt(w^T * Σ * w)
 * @param {Object} weights - Portfolio weights
 * @param {Object} covMatrix - Covariance matrix
 * @param {Array} tickers - Array of ticker symbols
 * @returns {Object} Risk contributions
 */
function calculateRiskContributions(weights, covMatrix, tickers) {
  const portfolioVol = calculatePortfolioVolatility(weights, covMatrix, tickers);
  const marginalContribs = calculateMarginalRiskContributions(weights, covMatrix, tickers);
  const riskContribs = {};

  tickers.forEach(function(ticker) {
    riskContribs[ticker] = weights[ticker] * marginalContribs[ticker] / portfolioVol;
  });

  return riskContribs;
}

/**
 * Risk parity objective function: minimize sum of squared deviations from equal risk
 * @param {Object} weights - Portfolio weights
 * @param {Object} covMatrix - Covariance matrix
 * @param {Array} tickers - Array of ticker symbols
 * @returns {number} Objective function value
 */
function riskParityObjective(weights, covMatrix, tickers) {
  const riskContribs = calculateRiskContributions(weights, covMatrix, tickers);
  const targetRiskContrib = 1.0 / tickers.length;
  let objective = 0;

  tickers.forEach(function(ticker) {
    const deviation = riskContribs[ticker] - targetRiskContrib;
    objective += deviation * deviation;
  });

  return objective;
}

/**
 * Gradient of the risk parity objective function (numerical approximation)
 * @param {Object} weights - Portfolio weights
 * @param {Object} covMatrix - Covariance matrix
 * @param {Array} tickers - Array of ticker symbols
 * @param {number} epsilon - Finite difference step size
 * @returns {Object} Gradient vector
 */
function riskParityGradient(weights, covMatrix, tickers, epsilon) {
  if (epsilon === undefined) epsilon = 1e-8;

  const gradient = {};
  const baseObjective = riskParityObjective(weights, covMatrix, tickers);

  tickers.forEach(function(ticker) {
    // Create perturbed weights
    const perturbedWeights = {};
    Object.keys(weights).forEach(function(t) {
      perturbedWeights[t] = weights[t];
    });
    perturbedWeights[ticker] += epsilon;

    // Renormalize
    const sum = Object.values(perturbedWeights).reduce(function(s, w) {
      return s + w;
    }, 0);
    Object.keys(perturbedWeights).forEach(function(t) {
      perturbedWeights[t] /= sum;
    });

    const perturbedObjective = riskParityObjective(perturbedWeights, covMatrix, tickers);
    gradient[ticker] = (perturbedObjective - baseObjective) / epsilon;
  });

  return gradient;
}

/**
 * Project weights onto simplex (sum to 1, all positive) with constraints
 * @param {Object} weights - Portfolio weights
 * @param {Array} tickers - Array of ticker symbols
 * @returns {Object} Projected weights
 */
function projectOntoSimplex(weights, tickers) {
  // Stronger constraints to prevent extreme allocations
  const projected = {};

  tickers.forEach(function(ticker) {
    // Clamp weights between min and max
    projected[ticker] = Math.max(MIN_WEIGHT, Math.min(weights[ticker], MAX_WEIGHT));
  });

  // Normalize to sum to 1
  const sum = Object.values(projected).reduce(function(s, w) {
    return s + w;
  }, 0);
  tickers.forEach(function(ticker) {
    projected[ticker] /= sum;
  });

  // Final safety check
  const finalMax = Math.max.apply(Math, Object.values(projected));
  const finalMin = Math.min.apply(Math, Object.values(projected));
  if (finalMax > 0.7 || finalMin < 0.03) {
    console.warn('⚠️ Constraint violation after projection: Max=' + (finalMax*100).toFixed(1) + '%, Min=' + (finalMin*100).toFixed(1) + '%');
  }

  return projected;
}

/**
 * Risk Budgeting Optimization using Gradient Descent with Momentum
 * @param {Object} covMatrix - Covariance matrix
 * @param {Array} tickers - Array of ticker symbols
 * @param {number} maxIterations - Maximum optimization iterations
 * @param {number} learningRate - Gradient descent learning rate
 * @param {number} tolerance - Convergence tolerance
 * @param {number} momentum - Momentum coefficient
 * @returns {Object} Optimized weights
 */
function optimizeRiskBudgetingWeights(
  covMatrix,
  tickers,
  maxIterations,
  learningRate,
  tolerance,
  momentum
) {
  // Default parameters
  if (maxIterations === undefined) maxIterations = 1000;
  if (learningRate === undefined) learningRate = 0.01;
  if (tolerance === undefined) tolerance = 1e-10;
  if (momentum === undefined) momentum = 0.9;

  // Initialize with equal weights
  let weights = {};
  tickers.forEach(function(ticker) {
    weights[ticker] = 1.0 / tickers.length;
  });

  // Momentum terms
  let momentum_weights = {};
  tickers.forEach(function(ticker) {
    momentum_weights[ticker] = 0.0;
  });

  let prevObjective = Infinity;
  let iteration = 0;

  console.log('Starting Risk Budgeting Optimization...');

  for (iteration = 0; iteration < maxIterations; iteration++) {
    const objective = riskParityObjective(weights, covMatrix, tickers);

    // Check convergence (but skip on first iteration)
    if (iteration > 0 && Math.abs(prevObjective - objective) < tolerance) {
      console.log('Risk Budgeting converged after ' + iteration + ' iterations. Final objective: ' + objective.toFixed(8));
      console.log('Convergence details: |' + prevObjective.toFixed(12) + ' - ' + objective.toFixed(12) + '| = ' + Math.abs(prevObjective - objective).toExponential() + ' < ' + tolerance.toExponential());
      break;
    }

    // Calculate gradient
    const gradient = riskParityGradient(weights, covMatrix, tickers);

    // Update weights with momentum
    const newWeights = {};
    const currentLR = learningRate;
    const currentWeights = weights;
    tickers.forEach(function(ticker) {
      // Momentum update
      momentum_weights[ticker] = momentum * momentum_weights[ticker] - currentLR * gradient[ticker];
      newWeights[ticker] = currentWeights[ticker] + momentum_weights[ticker];
    });

    // Debug: Check for NaN or extreme values
    const hasNaN = tickers.some(function(ticker) {
      return isNaN(newWeights[ticker]);
    });
    const maxNewWeight = Math.max.apply(Math, Object.values(newWeights));
    if (hasNaN || maxNewWeight > 10) {
      console.error('❌ OPTIMIZATION ERROR:', {
        iteration: iteration,
        hasNaN: hasNaN,
        maxNewWeight: maxNewWeight,
        gradient: gradient,
        newWeights: newWeights
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
      console.log('Iteration ' + iteration + ': Objective = ' + objective.toFixed(8) + ', LR = ' + learningRate.toFixed(6));
    }
  }

  if (iteration === maxIterations) {
    console.log('Risk Budgeting reached maximum iterations (' + maxIterations + '). Final objective: ' + riskParityObjective(weights, covMatrix, tickers).toFixed(8));
  }

  // Verify final weights
  const finalRiskContribs = calculateRiskContributions(weights, covMatrix, tickers);
  console.log('Final Risk Budgeting Weights:', weights);
  console.log('Final Risk Contributions:', finalRiskContribs);

  // Debug: Check for extreme allocations
  const maxWeight = Math.max.apply(Math, Object.values(weights));
  const minWeight = Math.min.apply(Math, Object.values(weights));
  if (maxWeight > 0.8 || minWeight < 0.01) {
    console.warn('⚠️ EXTREME ALLOCATION DETECTED: Max=' + (maxWeight*100).toFixed(1) + '%, Min=' + (minWeight*100).toFixed(1) + '%');
    const weightsDisplay = {};
    Object.keys(weights).forEach(function(k) {
      weightsDisplay[k] = (weights[k]*100).toFixed(1) + '%';
    });
    console.warn('Weights:', weightsDisplay);
  }

  return weights;
}

/**
 * Alternative: Cyclical Coordinate Descent approach (more stable for some cases)
 * @param {Object} covMatrix - Covariance matrix
 * @param {Array} tickers - Array of ticker symbols
 * @param {number} maxIterations - Maximum optimization iterations
 * @param {number} tolerance - Convergence tolerance
 * @returns {Object} Optimized weights
 */
function optimizeRiskBudgetingCCD(
  covMatrix,
  tickers,
  maxIterations,
  tolerance
) {
  // Default parameters
  if (maxIterations === undefined) maxIterations = 500;
  if (tolerance === undefined) tolerance = 1e-10;

  // Initialize with equal weights
  let weights = {};
  tickers.forEach(function(ticker) {
    weights[ticker] = 1.0 / tickers.length;
  });

  let prevObjective = Infinity;

  console.log('Starting Risk Budgeting Optimization (Cyclical Coordinate Descent)...');

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const objective = riskParityObjective(weights, covMatrix, tickers);

    if (iteration > 0 && Math.abs(prevObjective - objective) < tolerance) {
      console.log('Risk Budgeting CCD converged after ' + iteration + ' iterations. Final objective: ' + objective.toFixed(8));
      break;
    }

    // Update each weight cyclically
    const currentWeights = {};
    Object.keys(weights).forEach(function(t) {
      currentWeights[t] = weights[t];
    });

    tickers.forEach(function(ticker) {
      const otherTickers = tickers.filter(function(t) {
        return t !== ticker;
      });
      const otherWeightSum = otherTickers.reduce(function(sum, t) {
        return sum + currentWeights[t];
      }, 0);

      // Binary search for optimal weight for this asset
      let low = 0.001; // minimum weight
      let high = 1.0 - otherWeightSum;

      for (let i = 0; i < 20; i++) { // 20 binary search iterations
        const mid = (low + high) / 2;
        const testWeights = {};
        Object.keys(currentWeights).forEach(function(t) {
          testWeights[t] = currentWeights[t];
        });
        testWeights[ticker] = mid;

        // Renormalize
        const sum = Object.values(testWeights).reduce(function(s, w) {
          return s + w;
        }, 0);
        Object.keys(testWeights).forEach(function(t) {
          testWeights[t] /= sum;
        });

        const obj1 = riskParityObjective(testWeights, covMatrix, tickers);

        // Test slightly higher weight
        const testWeights2 = {};
        Object.keys(currentWeights).forEach(function(t) {
          testWeights2[t] = currentWeights[t];
        });
        testWeights2[ticker] = mid + (high - low) * 0.01;
        const sum2 = Object.values(testWeights2).reduce(function(s, w) {
          return s + w;
        }, 0);
        Object.keys(testWeights2).forEach(function(t) {
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
}

module.exports = {
  calculateCovarianceMatrix,
  calculatePortfolioVolatility,
  calculateMarginalRiskContributions,
  calculateRiskContributions,
  riskParityObjective,
  riskParityGradient,
  projectOntoSimplex,
  optimizeRiskBudgetingWeights,
  optimizeRiskBudgetingCCD
};
