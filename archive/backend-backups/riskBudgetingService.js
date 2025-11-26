const MIN_WEIGHT = 0.02;
const MAX_WEIGHT = 0.65;

function calculateCovarianceMatrix(returnsSeries, tickers) {
  const n = returnsSeries[tickers[0]]?.length ?? 0;
  if (n === 0) return null;

  const covMatrix = {};
  const means = {};

  tickers.forEach((ticker) => {
    covMatrix[ticker] = {};
    means[ticker] =
      returnsSeries[ticker].reduce((sum, val) => sum + val, 0) / n;
  });

  tickers.forEach((ticker1) => {
    tickers.forEach((ticker2) => {
      let covariance = 0;
      for (let i = 0; i < n; i++) {
        covariance +=
          (returnsSeries[ticker1][i] - means[ticker1]) *
          (returnsSeries[ticker2][i] - means[ticker2]);
      }
      covMatrix[ticker1][ticker2] = covariance / Math.max(n - 1, 1);
    });
  });

  return covMatrix;
}

function calculatePortfolioVolatility(weights, covMatrix, tickers) {
  let variance = 0;
  tickers.forEach((t1) => {
    tickers.forEach((t2) => {
      variance += weights[t1] * weights[t2] * (covMatrix[t1]?.[t2] ?? 0);
    });
  });
  return Math.sqrt(Math.max(variance, 1e-10));
}

function calculateMarginalRiskContributions(weights, covMatrix, tickers) {
  const contributions = {};
  tickers.forEach((t1) => {
    let sum = 0;
    tickers.forEach((t2) => {
      sum += (covMatrix[t1]?.[t2] ?? 0) * weights[t2];
    });
    contributions[t1] = sum;
  });
  return contributions;
}

function calculateRiskContributions(weights, covMatrix, tickers) {
  const portfolioVol = calculatePortfolioVolatility(weights, covMatrix, tickers);
  const marginal = calculateMarginalRiskContributions(
    weights,
    covMatrix,
    tickers
  );
  const contributions = {};
  tickers.forEach((ticker) => {
    contributions[ticker] = weights[ticker] * marginal[ticker] / portfolioVol;
  });
  return contributions;
}

function riskParityObjective(weights, covMatrix, tickers) {
  const contributions = calculateRiskContributions(weights, covMatrix, tickers);
  const target = 1 / tickers.length;
  let objective = 0;
  tickers.forEach((ticker) => {
    const deviation = contributions[ticker] - target;
    objective += deviation * deviation;
  });
  return objective;
}

function projectOntoSimplex(weights, tickers) {
  const projected = {};
  tickers.forEach((ticker) => {
    const weight = weights[ticker] ?? 0;
    projected[ticker] = Math.max(MIN_WEIGHT, Math.min(weight, MAX_WEIGHT));
  });
  const sum = Object.values(projected).reduce((acc, val) => acc + val, 0);
  tickers.forEach((ticker) => {
    projected[ticker] /= sum;
  });
  return projected;
}

function riskParityGradient(weights, covMatrix, tickers, epsilon = 1e-8) {
  const gradient = {};
  const baseObjective = riskParityObjective(weights, covMatrix, tickers);

  tickers.forEach((ticker) => {
    const perturbed = { ...weights };
    perturbed[ticker] += epsilon;
    const normalised = projectOntoSimplex(perturbed, tickers);
    const objective = riskParityObjective(normalised, covMatrix, tickers);
    gradient[ticker] = (objective - baseObjective) / epsilon;
  });

  return gradient;
}

function optimizeRiskBudgetingWeights(
  covMatrix,
  tickers,
  options = {}
) {
  const {
    maxIterations = 500,
    learningRate = 0.02,
    tolerance = 1e-10,
    momentum = 0.9,
  } = options;

  let weights = {};
  tickers.forEach((ticker) => {
    weights[ticker] = 1 / tickers.length;
  });

  const velocity = {};
  tickers.forEach((ticker) => {
    velocity[ticker] = 0;
  });

  let prevObjective = Infinity;
  let currentLR = learningRate;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const objective = riskParityObjective(weights, covMatrix, tickers);
    if (
      iteration > 0 &&
      Math.abs(prevObjective - objective) < tolerance
    ) {
      break;
    }

    const gradient = riskParityGradient(weights, covMatrix, tickers);
    const updated = {};

    tickers.forEach((ticker) => {
      velocity[ticker] = momentum * velocity[ticker] - currentLR * gradient[ticker];
      updated[ticker] = weights[ticker] + velocity[ticker];
    });

    weights = projectOntoSimplex(updated, tickers);

    if (iteration > 0 && objective > prevObjective) {
      currentLR *= 0.9;
    }

    prevObjective = objective;
  }

  return weights;
}

module.exports = {
  calculateCovarianceMatrix,
  calculateRiskContributions,
  optimizeRiskBudgetingWeights,
};
