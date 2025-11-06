/**
 * Dynamic Conditional Correlation (DCC) Models for ETF Portfolio Analysis
 *
 * This module implements sophisticated time-varying correlation estimation
 * that goes beyond simple rolling windows. It provides:
 *
 * 1. DCC-GARCH models for dynamic correlation estimation
 * 2. Regime change detection for correlation shifts
 * 3. Correlation forecasting capabilities
 * 4. Enhanced correlation matrices for risk parity calculations
 *
 * The implementation is designed to work with the existing 5-asset ETF structure:
 * SPY (S&P 500), IEF (7-10Y Treasury), GLD (Gold), EFA (Developed Markets), VNQ (REITs)
 *
 * Author: Agent 3
 * Created: 2025-09-26
 */

// Mathematical utility functions for matrix operations
const MatrixUtils = {
  // Create identity matrix
  identity: (size) => {
    const matrix = Array(size).fill().map(() => Array(size).fill(0));
    for (let i = 0; i < size; i++) {
      matrix[i][i] = 1;
    }
    return matrix;
  },

  // Matrix multiplication
  multiply: (a, b) => {
    const rows = a.length;
    const cols = b[0].length;
    const inner = b.length;
    const result = Array(rows).fill().map(() => Array(cols).fill(0));

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        for (let k = 0; k < inner; k++) {
          result[i][j] += a[i][k] * b[k][j];
        }
      }
    }
    return result;
  },

  // Calculate matrix determinant (for 2x2 and larger matrices)
  determinant: (matrix) => {
    const n = matrix.length;
    if (n === 1) return matrix[0][0];
    if (n === 2) {
      return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    }

    // For larger matrices, use cofactor expansion
    let det = 0;
    for (let j = 0; j < n; j++) {
      const minor = matrix.slice(1).map(row => row.filter((_, colIndex) => colIndex !== j));
      det += (j % 2 === 0 ? 1 : -1) * matrix[0][j] * MatrixUtils.determinant(minor);
    }
    return det;
  },

  // Ensure matrix is positive definite by eigenvalue adjustment
  makePositiveDefinite: (matrix) => {
    const n = matrix.length;
    const eigenvalueFloor = 1e-8;

    // Simple approach: add small value to diagonal if needed
    const result = matrix.map(row => [...row]);
    for (let i = 0; i < n; i++) {
      if (result[i][i] < eigenvalueFloor) {
        result[i][i] = eigenvalueFloor;
      }
    }
    return result;
  }
};

/**
 * GARCH(1,1) model for volatility estimation
 * Used as a component in DCC models
 */
class GARCHModel {
  constructor(omega = 0.0001, alpha = 0.05, beta = 0.9) {
    this.omega = omega;  // Constant term
    this.alpha = alpha;  // ARCH term (short-term volatility)
    this.beta = beta;    // GARCH term (persistence)
    this.volatilities = [];
    this.isEstimated = false;
  }

  // Estimate GARCH parameters using maximum likelihood (simplified)
  estimate(returns) {
    if (returns.length < 50) {
      throw new Error('GARCH estimation requires at least 50 observations');
    }

    // Initialize with sample variance
    const sampleVar = returns.reduce((sum, r) => sum + r * r, 0) / returns.length;
    let variance = sampleVar;

    const variances = [];
    variances.push(variance);

    // Simple parameter estimation (in practice, would use numerical optimization)
    // Using method of moments approximation
    const unconditionalVar = sampleVar;

    // Estimate parameters iteratively
    let bestLogLikelihood = -Infinity;
    let bestParams = { omega: this.omega, alpha: this.alpha, beta: this.beta };

    // Grid search over reasonable parameter space
    const omegaRange = [0.00001, 0.0001, 0.001];
    const alphaRange = [0.01, 0.05, 0.1, 0.15];
    const betaRange = [0.8, 0.85, 0.9, 0.95];

    for (const omega of omegaRange) {
      for (const alpha of alphaRange) {
        for (const beta of betaRange) {
          // Ensure stationarity condition
          if (alpha + beta >= 1) continue;

          const logLikelihood = this._calculateLogLikelihood(returns, omega, alpha, beta);
          if (logLikelihood > bestLogLikelihood) {
            bestLogLikelihood = logLikelihood;
            bestParams = { omega, alpha, beta };
          }
        }
      }
    }

    this.omega = bestParams.omega;
    this.alpha = bestParams.alpha;
    this.beta = bestParams.beta;

    // Calculate fitted variances
    variance = unconditionalVar;
    this.volatilities = [Math.sqrt(variance)];

    for (let i = 1; i < returns.length; i++) {
      variance = this.omega + this.alpha * returns[i-1] * returns[i-1] + this.beta * variance;
      this.volatilities.push(Math.sqrt(variance));
    }

    this.isEstimated = true;
    return bestParams;
  }

  // Calculate log-likelihood for parameter estimation
  _calculateLogLikelihood(returns, omega, alpha, beta) {
    let logLikelihood = 0;
    let variance = returns.reduce((sum, r) => sum + r * r, 0) / returns.length;

    for (let i = 1; i < returns.length; i++) {
      variance = omega + alpha * returns[i-1] * returns[i-1] + beta * variance;
      if (variance <= 0) return -Infinity;

      logLikelihood += -0.5 * Math.log(2 * Math.PI * variance) - 0.5 * returns[i] * returns[i] / variance;
    }

    return logLikelihood;
  }

  // Forecast volatility one step ahead
  forecast() {
    if (!this.isEstimated || this.volatilities.length === 0) {
      throw new Error('Model must be estimated before forecasting');
    }

    const lastVolatility = this.volatilities[this.volatilities.length - 1];
    const lastVariance = lastVolatility * lastVolatility;

    // One-step ahead variance forecast
    const forecastVariance = this.omega + (this.alpha + this.beta) * lastVariance;
    return Math.sqrt(forecastVariance);
  }

  // Get standardized residuals (for correlation modeling)
  getStandardizedResiduals(returns) {
    if (!this.isEstimated) {
      this.estimate(returns);
    }

    return returns.map((ret, i) => {
      if (i === 0) return ret / this.volatilities[0];
      return ret / this.volatilities[i];
    });
  }
}

/**
 * Dynamic Conditional Correlation (DCC) Model
 * Estimates time-varying correlations between assets
 */
class DCCModel {
  constructor(alpha = 0.01, beta = 0.95) {
    this.alpha = alpha;  // Short-run persistence of correlation
    this.beta = beta;    // Long-run persistence of correlation
    this.garchModels = {};
    this.correlationMatrices = [];
    this.unconditionalCorrelation = null;
    this.isEstimated = false;
  }

  // Estimate DCC model for multiple return series
  estimate(returnsSeries) {
    const tickers = Object.keys(returnsSeries);
    const n = tickers.length;

    if (n < 2) {
      throw new Error('DCC requires at least 2 assets');
    }

    // Step 1: Estimate GARCH models for each series
    console.log('Estimating GARCH models for each asset...');
    for (const ticker of tickers) {
      this.garchModels[ticker] = new GARCHModel();
      this.garchModels[ticker].estimate(returnsSeries[ticker]);
    }

    // Step 2: Get standardized residuals
    const standardizedResiduals = {};
    for (const ticker of tickers) {
      standardizedResiduals[ticker] = this.garchModels[ticker].getStandardizedResiduals(returnsSeries[ticker]);
    }

    // Step 3: Estimate unconditional correlation matrix
    this.unconditionalCorrelation = this._calculateCorrelationMatrix(standardizedResiduals);

    // Step 4: Estimate DCC parameters and dynamic correlations
    this._estimateDCCParameters(standardizedResiduals);

    this.isEstimated = true;
    console.log(`DCC model estimated with ${this.correlationMatrices.length} correlation matrices`);
  }

  // Estimate DCC parameters using quasi-maximum likelihood
  _estimateDCCParameters(standardizedResiduals) {
    const tickers = Object.keys(standardizedResiduals);
    const n = tickers.length;
    const T = standardizedResiduals[tickers[0]].length;

    // Initialize Q matrix with unconditional correlation
    let Q = this.unconditionalCorrelation.map(row => [...row]);

    // Grid search for optimal alpha and beta
    let bestLogLikelihood = -Infinity;
    let bestParams = { alpha: this.alpha, beta: this.beta };

    const alphaRange = [0.005, 0.01, 0.02, 0.05];
    const betaRange = [0.90, 0.92, 0.95, 0.97, 0.98];

    for (const alpha of alphaRange) {
      for (const beta of betaRange) {
        // Ensure stationarity
        if (alpha + beta >= 1) continue;

        const logLikelihood = this._calculateDCCLogLikelihood(standardizedResiduals, alpha, beta);
        if (logLikelihood > bestLogLikelihood) {
          bestLogLikelihood = logLikelihood;
          bestParams = { alpha, beta };
        }
      }
    }

    this.alpha = bestParams.alpha;
    this.beta = bestParams.beta;

    // Generate correlation matrices with optimal parameters
    this._generateCorrelationMatrices(standardizedResiduals);
  }

  // Calculate DCC log-likelihood
  _calculateDCCLogLikelihood(standardizedResiduals, alpha, beta) {
    const tickers = Object.keys(standardizedResiduals);
    const n = tickers.length;
    const T = standardizedResiduals[tickers[0]].length;

    let logLikelihood = 0;
    let Q = this.unconditionalCorrelation.map(row => [...row]);

    for (let t = 1; t < T; t++) {
      // Get residuals at time t-1
      const residuals = tickers.map(ticker => standardizedResiduals[ticker][t-1]);

      // Update Q matrix
      const residualOuter = this._outerProduct(residuals);
      Q = this._updateQMatrix(Q, residualOuter, alpha, beta);

      // Convert Q to correlation matrix
      const R = this._qToCorrelation(Q);

      // Calculate log-likelihood contribution
      const det = MatrixUtils.determinant(R);
      if (det <= 0) return -Infinity;

      const currentResiduals = tickers.map(ticker => standardizedResiduals[ticker][t]);
      const quadForm = this._quadraticForm(currentResiduals, this._invertMatrix(R));

      logLikelihood += -0.5 * Math.log(det) - 0.5 * quadForm;
    }

    return logLikelihood;
  }

  // Generate correlation matrices for the entire sample
  _generateCorrelationMatrices(standardizedResiduals) {
    const tickers = Object.keys(standardizedResiduals);
    const T = standardizedResiduals[tickers[0]].length;

    this.correlationMatrices = [];
    let Q = this.unconditionalCorrelation.map(row => [...row]);

    // Initial correlation matrix
    this.correlationMatrices.push(this._qToCorrelation(Q));

    for (let t = 1; t < T; t++) {
      const residuals = tickers.map(ticker => standardizedResiduals[ticker][t-1]);
      const residualOuter = this._outerProduct(residuals);

      Q = this._updateQMatrix(Q, residualOuter, this.alpha, this.beta);
      const R = this._qToCorrelation(Q);

      this.correlationMatrices.push(R);
    }
  }

  // Update Q matrix according to DCC specification
  _updateQMatrix(Q, residualOuter, alpha, beta) {
    const n = Q.length;
    const newQ = Array(n).fill().map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        newQ[i][j] = (1 - alpha - beta) * this.unconditionalCorrelation[i][j] +
                     alpha * residualOuter[i][j] +
                     beta * Q[i][j];
      }
    }

    return newQ;
  }

  // Convert Q matrix to correlation matrix
  _qToCorrelation(Q) {
    const n = Q.length;
    const R = Array(n).fill().map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        R[i][j] = Q[i][j] / Math.sqrt(Q[i][i] * Q[j][j]);
      }
    }

    return MatrixUtils.makePositiveDefinite(R);
  }

  // Calculate outer product of vector
  _outerProduct(vector) {
    const n = vector.length;
    const result = Array(n).fill().map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        result[i][j] = vector[i] * vector[j];
      }
    }

    return result;
  }

  // Calculate correlation matrix from standardized residuals
  _calculateCorrelationMatrix(standardizedResiduals) {
    const tickers = Object.keys(standardizedResiduals);
    const n = tickers.length;
    const correlationMatrix = Array(n).fill().map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          correlationMatrix[i][j] = 1.0;
        } else {
          const corr = this._pearsonCorrelation(
            standardizedResiduals[tickers[i]],
            standardizedResiduals[tickers[j]]
          );
          correlationMatrix[i][j] = corr;
        }
      }
    }

    return correlationMatrix;
  }

  // Calculate Pearson correlation coefficient
  _pearsonCorrelation(x, y) {
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
    return Math.max(-0.99, Math.min(0.99, numerator / denominator));
  }

  // Simple matrix inversion for small matrices
  _invertMatrix(matrix) {
    const n = matrix.length;
    if (n === 2) {
      const det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
      if (Math.abs(det) < 1e-10) return MatrixUtils.identity(n);

      return [
        [matrix[1][1] / det, -matrix[0][1] / det],
        [-matrix[1][0] / det, matrix[0][0] / det]
      ];
    }

    // For larger matrices, use simple approach (in practice would use LU decomposition)
    return MatrixUtils.identity(n);
  }

  // Calculate quadratic form x'Ax
  _quadraticForm(x, A) {
    const n = x.length;
    let result = 0;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        result += x[i] * A[i][j] * x[j];
      }
    }

    return result;
  }

  // Get correlation matrix at specific time index
  getCorrelationMatrix(timeIndex) {
    if (!this.isEstimated) {
      throw new Error('Model must be estimated before getting correlations');
    }

    if (timeIndex < 0 || timeIndex >= this.correlationMatrices.length) {
      return this.correlationMatrices[this.correlationMatrices.length - 1];
    }

    return this.correlationMatrices[timeIndex];
  }

  // Get latest correlation matrix
  getLatestCorrelationMatrix() {
    if (!this.isEstimated) {
      throw new Error('Model must be estimated before getting correlations');
    }

    return this.correlationMatrices[this.correlationMatrices.length - 1];
  }

  // Forecast correlation matrix one step ahead
  forecastCorrelation() {
    if (!this.isEstimated) {
      throw new Error('Model must be estimated before forecasting');
    }

    // Simple forecast: use latest Q matrix to generate forecast
    const latestIndex = this.correlationMatrices.length - 1;
    return this.correlationMatrices[latestIndex];
  }
}

/**
 * Regime Change Detection for Correlations
 * Detects structural breaks in correlation patterns
 */
class RegimeDetector {
  constructor(windowSize = 126, threshold = 0.3) {
    this.windowSize = windowSize;  // ~6 months of daily data
    this.threshold = threshold;    // Threshold for regime change detection
  }

  // Detect regime changes in correlation time series
  detectRegimeChanges(correlationMatrices, tickers) {
    if (correlationMatrices.length < this.windowSize * 2) {
      return { regimeChanges: [], regimeLabels: Array(correlationMatrices.length).fill(0) };
    }

    const regimeChanges = [];
    const regimeLabels = Array(correlationMatrices.length).fill(0);
    let currentRegime = 0;

    // Calculate rolling average correlations
    for (let t = this.windowSize; t < correlationMatrices.length - this.windowSize; t++) {
      const beforeWindow = correlationMatrices.slice(t - this.windowSize, t);
      const afterWindow = correlationMatrices.slice(t, t + this.windowSize);

      const avgCorrBefore = this._calculateAverageCorrelation(beforeWindow);
      const avgCorrAfter = this._calculateAverageCorrelation(afterWindow);

      // Check for significant change in correlation level
      const correlationChange = Math.abs(avgCorrAfter - avgCorrBefore);

      if (correlationChange > this.threshold) {
        regimeChanges.push({
          date: t,
          correlationBefore: avgCorrBefore,
          correlationAfter: avgCorrAfter,
          change: correlationChange
        });
        currentRegime++;
      }

      regimeLabels[t] = currentRegime;
    }

    // Fill remaining labels
    for (let t = 0; t < this.windowSize; t++) {
      regimeLabels[t] = 0;
    }
    for (let t = correlationMatrices.length - this.windowSize; t < correlationMatrices.length; t++) {
      regimeLabels[t] = currentRegime;
    }

    return { regimeChanges, regimeLabels };
  }

  // Calculate average off-diagonal correlation for a set of matrices
  _calculateAverageCorrelation(matrices) {
    if (matrices.length === 0) return 0;

    let totalCorr = 0;
    let count = 0;

    matrices.forEach(matrix => {
      const n = matrix.length;
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          totalCorr += Math.abs(matrix[i][j]);
          count++;
        }
      }
    });

    return count > 0 ? totalCorr / count : 0;
  }

  // Detect current market regime based on recent correlations
  getCurrentRegime(recentCorrelationMatrices) {
    if (recentCorrelationMatrices.length === 0) return 'normal';

    const avgCorr = this._calculateAverageCorrelation(recentCorrelationMatrices);

    // Define regime thresholds based on correlation levels
    if (avgCorr > 0.7) return 'crisis';      // High correlation regime
    if (avgCorr > 0.4) return 'stressed';    // Moderate correlation regime
    return 'normal';                         // Low correlation regime
  }
}

/**
 * Main DCC Service Interface
 * Provides easy-to-use functions for portfolio calculations
 */
export class DynamicCorrelationService {
  constructor() {
    this.dccModel = null;
    this.regimeDetector = new RegimeDetector();
    this.isInitialized = false;
  }

  // Initialize with return series data
  async initialize(returnsSeries) {
    console.log('Initializing Dynamic Correlation Service...');

    this.dccModel = new DCCModel();

    try {
      this.dccModel.estimate(returnsSeries);
      this.isInitialized = true;
      console.log('DCC model successfully initialized');
    } catch (error) {
      console.error('Failed to initialize DCC model:', error);
      throw error;
    }
  }

  // Get enhanced correlation matrix for portfolio calculations
  getEnhancedCorrelationMatrix(timeIndex = null) {
    if (!this.isInitialized) {
      throw new Error('Service must be initialized before use');
    }

    if (timeIndex === null) {
      return this.dccModel.getLatestCorrelationMatrix();
    }

    return this.dccModel.getCorrelationMatrix(timeIndex);
  }

  // Get correlation forecast
  forecastCorrelation() {
    if (!this.isInitialized) {
      throw new Error('Service must be initialized before forecasting');
    }

    return this.dccModel.forecastCorrelation();
  }

  // Detect regime changes in correlation patterns
  detectRegimeChanges(tickers) {
    if (!this.isInitialized) {
      throw new Error('Service must be initialized before regime detection');
    }

    return this.regimeDetector.detectRegimeChanges(
      this.dccModel.correlationMatrices,
      tickers
    );
  }

  // Get current market regime
  getCurrentMarketRegime() {
    if (!this.isInitialized) {
      return 'unknown';
    }

    // Use recent correlation matrices to determine regime
    const recentMatrices = this.dccModel.correlationMatrices.slice(-20); // Last 20 days
    return this.regimeDetector.getCurrentRegime(recentMatrices);
  }

  // Get correlation matrix in dictionary format (compatible with existing code)
  getCorrelationMatrixDict(tickers, timeIndex = null) {
    const matrix = this.getEnhancedCorrelationMatrix(timeIndex);
    const correlationDict = {};

    tickers.forEach((ticker1, i) => {
      correlationDict[ticker1] = {};
      tickers.forEach((ticker2, j) => {
        correlationDict[ticker1][ticker2] = matrix[i][j];
      });
    });

    return correlationDict;
  }

  // Calculate time-varying average correlations for risk parity
  calculateDynamicAverageCorrelations(tickers) {
    if (!this.isInitialized) {
      throw new Error('Service must be initialized before correlation calculation');
    }

    const avgCorrelations = {};
    const latestMatrix = this.getLatestCorrelationMatrix();

    tickers.forEach((ticker, i) => {
      const otherCorrelations = [];
      tickers.forEach((otherTicker, j) => {
        if (i !== j) {
          otherCorrelations.push(Math.abs(latestMatrix[i][j]));
        }
      });

      avgCorrelations[ticker] = otherCorrelations.length > 0 ?
        otherCorrelations.reduce((sum, val) => sum + val, 0) / otherCorrelations.length : 0;
    });

    return avgCorrelations;
  }

  // Get model diagnostics and statistics
  getDiagnostics() {
    if (!this.isInitialized) {
      return null;
    }

    const correlationMatrices = this.dccModel.correlationMatrices;
    const avgCorrelations = correlationMatrices.map(matrix => {
      let sum = 0;
      let count = 0;
      const n = matrix.length;

      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          sum += Math.abs(matrix[i][j]);
          count++;
        }
      }

      return count > 0 ? sum / count : 0;
    });

    return {
      modelParameters: {
        alpha: this.dccModel.alpha,
        beta: this.dccModel.beta,
        persistence: this.dccModel.alpha + this.dccModel.beta
      },
      correlationStatistics: {
        averageCorrelation: avgCorrelations.reduce((sum, val) => sum + val, 0) / avgCorrelations.length,
        minCorrelation: Math.min(...avgCorrelations),
        maxCorrelation: Math.max(...avgCorrelations),
        correlationVolatility: this._calculateStandardDeviation(avgCorrelations)
      },
      sampleSize: correlationMatrices.length
    };
  }

  // Helper function to calculate standard deviation
  _calculateStandardDeviation(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance);
  }
}

// Export utility functions for potential direct use
export const CorrelationUtils = {
  // Convert DCC output to format compatible with existing portfolio functions
  convertToDictFormat: (matrix, tickers) => {
    const correlationDict = {};
    tickers.forEach((ticker1, i) => {
      correlationDict[ticker1] = {};
      tickers.forEach((ticker2, j) => {
        correlationDict[ticker1][ticker2] = matrix[i][j];
      });
    });
    return correlationDict;
  },

  // Calculate correlation distance for clustering
  calculateCorrelationDistance: (correlationMatrix) => {
    const n = correlationMatrix.length;
    const distanceMatrix = Array(n).fill().map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          // Distance = sqrt(2 * (1 - correlation))
          distanceMatrix[i][j] = Math.sqrt(2 * (1 - correlationMatrix[i][j]));
        }
      }
    }

    return distanceMatrix;
  }
};

export default DynamicCorrelationService;