/**
 * Regime Detection Module for ETF Portfolio Analysis
 *
 * This module implements market regime detection using statistical methods to identify
 * different market conditions and provide adaptive parameter recommendations for
 * portfolio optimization strategies.
 *
 * Regimes Detected:
 * - Volatility Regimes: Low, Medium, High volatility environments
 * - Trend Regimes: Bull, Bear, Sideways markets
 * - Crisis Detection: Financial stress periods
 * - Market Stress: Overall market stress levels
 *
 * Integration: Works with existing portfolio strategies to provide adaptive parameters
 *
 * Ported from anim-main project with CommonJS compatibility
 */

// Import calculation functions from portfolio helpers
const {
  calculateReturns,
  calculateEWMAVolatility,
  calculatePearsonCorrelation
} = require('../portfolioHelpers');

/**
 * Market regime classification constants
 */
const REGIME_TYPES = {
  VOLATILITY: {
    LOW: 'low_vol',
    MEDIUM: 'medium_vol',
    HIGH: 'high_vol'
  },
  TREND: {
    BULL: 'bull_market',
    BEAR: 'bear_market',
    SIDEWAYS: 'sideways_market'
  },
  CRISIS: {
    NORMAL: 'normal',
    STRESS: 'stress',
    CRISIS: 'crisis'
  }
};

/**
 * Default parameters for regime detection
 */
const DEFAULT_REGIME_PARAMS = {
  // Volatility regime thresholds (annualized)
  volatility: {
    low_threshold: 0.12,     // 12% annual volatility
    high_threshold: 0.25     // 25% annual volatility
  },

  // Trend detection parameters
  trend: {
    short_ma: 21,            // Short-term moving average (1 month)
    long_ma: 63,             // Long-term moving average (3 months)
    trend_threshold: 0.02    // 2% threshold for trend classification
  },

  // Crisis detection parameters
  crisis: {
    correlation_threshold: 0.7,     // High correlation threshold
    volatility_percentile: 0.8,     // 80th percentile for volatility
    drawdown_threshold: -0.15       // 15% drawdown threshold
  },

  // Lookback windows
  windows: {
    volatility: 60,          // 60 days for volatility calculation
    correlation: 60,         // 60 days for correlation calculation
    trend: 252,              // 252 days for trend analysis
    crisis: 21               // 21 days for crisis detection
  }
};

/**
 * Calculate rolling volatility for market regime detection
 * @param {Array} prices - Array of price objects {date, price}
 * @param {number} windowSize - Rolling window size
 * @param {number} lambda - EWMA lambda parameter
 * @returns {Array} Array of volatility measurements
 */
function calculateRollingVolatility(prices, windowSize = 60, lambda = 0.94) {
  if (prices.length < windowSize) {
    return [];
  }

  const volatilities = [];

  for (let i = windowSize; i < prices.length; i++) {
    const window = prices.slice(i - windowSize, i);
    const returns = calculateReturns(window);

    if (returns.length > 0) {
      const volatility = calculateEWMAVolatility(returns, lambda);
      volatilities.push({
        date: prices[i].date,
        volatility: volatility
      });
    }
  }

  return volatilities;
}

/**
 * Calculate moving averages for trend detection
 * @param {Array} prices - Array of price objects {date, price}
 * @param {number} shortWindow - Short MA window
 * @param {number} longWindow - Long MA window
 * @returns {Array} Array of MA signals
 */
function calculateMovingAverages(prices, shortWindow = 21, longWindow = 63) {
  if (prices.length < longWindow) {
    return [];
  }

  const signals = [];

  for (let i = longWindow - 1; i < prices.length; i++) {
    // Calculate short MA
    const shortSlice = prices.slice(i - shortWindow + 1, i + 1);
    const shortMA = shortSlice.reduce((sum, p) => sum + p.price, 0) / shortWindow;

    // Calculate long MA
    const longSlice = prices.slice(i - longWindow + 1, i + 1);
    const longMA = longSlice.reduce((sum, p) => sum + p.price, 0) / longWindow;

    signals.push({
      date: prices[i].date,
      shortMA: shortMA,
      longMA: longMA,
      signal: (shortMA - longMA) / longMA // Relative difference
    });
  }

  return signals;
}

/**
 * Calculate rolling correlations for crisis detection
 * @param {Object} normalizedData - Normalized price data for all ETFs
 * @param {number} windowSize - Rolling correlation window
 * @returns {Array} Array of correlation measurements
 */
function calculateRollingCorrelations(normalizedData, windowSize = 60) {
  const tickers = Object.keys(normalizedData);
  if (tickers.length < 2) {
    return [];
  }

  // Get common dates
  const allDatesSet = new Set();
  tickers.forEach(ticker => {
    normalizedData[ticker].forEach(dataPoint => {
      allDatesSet.add(dataPoint.date);
    });
  });
  const allDates = Array.from(allDatesSet).sort();

  // Create price map for quick lookup
  const priceMap = {};
  tickers.forEach(ticker => {
    priceMap[ticker] = {};
    normalizedData[ticker].forEach(dataPoint => {
      priceMap[ticker][dataPoint.date] = dataPoint.price;
    });
  });

  const correlations = [];

  for (let i = windowSize; i < allDates.length; i++) {
    const windowDates = allDates.slice(i - windowSize, i);

    // Calculate returns for each ticker in this window
    const returnsSeries = {};
    tickers.forEach(ticker => {
      const windowPrices = [];
      windowDates.forEach(date => {
        if (priceMap[ticker][date]) {
          windowPrices.push({ price: priceMap[ticker][date] });
        }
      });

      if (windowPrices.length > 1) {
        returnsSeries[ticker] = calculateReturns(windowPrices);
      }
    });

    // Calculate average absolute correlation
    const correlationValues = [];
    tickers.forEach(ticker1 => {
      tickers.forEach(ticker2 => {
        if (ticker1 !== ticker2 && returnsSeries[ticker1] && returnsSeries[ticker2]) {
          const corr = calculatePearsonCorrelation(returnsSeries[ticker1], returnsSeries[ticker2]);
          if (!isNaN(corr)) {
            correlationValues.push(Math.abs(corr));
          }
        }
      });
    });

    if (correlationValues.length > 0) {
      const avgCorrelation = correlationValues.reduce((sum, val) => sum + val, 0) / correlationValues.length;
      correlations.push({
        date: allDates[i],
        avgCorrelation: avgCorrelation
      });
    }
  }

  return correlations;
}

/**
 * Detect volatility regime for a given date
 * @param {number} volatility - Current volatility measurement
 * @param {Object} thresholds - Volatility thresholds
 * @returns {string} Volatility regime classification
 */
function classifyVolatilityRegime(volatility, thresholds) {
  if (volatility < thresholds.low_threshold) {
    return REGIME_TYPES.VOLATILITY.LOW;
  } else if (volatility < thresholds.high_threshold) {
    return REGIME_TYPES.VOLATILITY.MEDIUM;
  } else {
    return REGIME_TYPES.VOLATILITY.HIGH;
  }
}

/**
 * Detect trend regime based on moving average signals
 * @param {number} signal - MA signal (short MA - long MA) / long MA
 * @param {number} threshold - Trend classification threshold
 * @returns {string} Trend regime classification
 */
function classifyTrendRegime(signal, threshold) {
  if (signal > threshold) {
    return REGIME_TYPES.TREND.BULL;
  } else if (signal < -threshold) {
    return REGIME_TYPES.TREND.BEAR;
  } else {
    return REGIME_TYPES.TREND.SIDEWAYS;
  }
}

/**
 * Detect crisis regime based on correlation and volatility
 * @param {number} correlation - Average correlation
 * @param {number} volatility - Current volatility
 * @param {Array} volatilityHistory - Historical volatility for percentile calculation
 * @param {Object} thresholds - Crisis detection thresholds
 * @returns {string} Crisis regime classification
 */
function classifyCrisisRegime(correlation, volatility, volatilityHistory, thresholds) {
  // Calculate volatility percentile
  const sortedVolatilities = [...volatilityHistory].sort((a, b) => a - b);
  const percentileIndex = Math.floor(thresholds.volatility_percentile * sortedVolatilities.length);
  const volatilityThreshold = sortedVolatilities[percentileIndex] || 0.25;

  const highCorrelation = correlation > thresholds.correlation_threshold;
  const highVolatility = volatility > volatilityThreshold;

  if (highCorrelation && highVolatility) {
    return REGIME_TYPES.CRISIS.CRISIS;
  } else if (highCorrelation || highVolatility) {
    return REGIME_TYPES.CRISIS.STRESS;
  } else {
    return REGIME_TYPES.CRISIS.NORMAL;
  }
}

/**
 * Main regime detection function
 * @param {Object} normalizedData - Normalized price data for all ETFs
 * @param {Object} params - Regime detection parameters (optional)
 * @returns {Array} Array of regime classifications by date
 */
function detectMarketRegimes(normalizedData, params = DEFAULT_REGIME_PARAMS) {
  console.log('Detecting market regimes across multiple dimensions...');

  if (!normalizedData || Object.keys(normalizedData).length === 0) {
    return [];
  }

  const tickers = Object.keys(normalizedData);
  console.log(`Analyzing regimes for ${tickers.length} ETFs:`, tickers.join(', '));

  // Use SPY as market proxy for volatility and trend analysis
  const marketProxy = normalizedData['SPY'] || normalizedData[tickers[0]];

  if (!marketProxy || marketProxy.length < params.windows.trend) {
    console.warn('Insufficient data for regime detection');
    return [];
  }

  // Calculate components for regime detection
  console.log('Calculating volatility measures...');
  const volatilities = calculateRollingVolatility(marketProxy, params.windows.volatility);

  console.log('Calculating trend signals...');
  const trendSignals = calculateMovingAverages(marketProxy, params.trend.short_ma, params.trend.long_ma);

  console.log('Calculating correlation measures...');
  const correlations = calculateRollingCorrelations(normalizedData, params.windows.correlation);

  // Create date-aligned regime classifications
  const regimes = [];
  const volatilityMap = new Map(volatilities.map(v => [v.date, v.volatility]));
  const trendMap = new Map(trendSignals.map(t => [t.date, t.signal]));
  const correlationMap = new Map(correlations.map(c => [c.date, c.avgCorrelation]));

  // Get volatility history for percentile calculations
  const volatilityHistory = volatilities.map(v => v.volatility);

  // Find common dates where we have all measures
  const commonDates = volatilities
    .map(v => v.date)
    .filter(date =>
      trendMap.has(date) && correlationMap.has(date)
    )
    .sort();

  console.log(`Processing ${commonDates.length} dates for regime classification...`);

  commonDates.forEach(date => {
    const volatility = volatilityMap.get(date);
    const trendSignal = trendMap.get(date);
    const correlation = correlationMap.get(date);

    const volatilityRegime = classifyVolatilityRegime(volatility, params.volatility);
    const trendRegime = classifyTrendRegime(trendSignal, params.trend.trend_threshold);
    const crisisRegime = classifyCrisisRegime(correlation, volatility, volatilityHistory, params.crisis);

    regimes.push({
      date: date,
      volatilityRegime: volatilityRegime,
      trendRegime: trendRegime,
      crisisRegime: crisisRegime,
      // Raw measurements for analysis
      measurements: {
        volatility: volatility,
        trendSignal: trendSignal,
        correlation: correlation
      }
    });
  });

  console.log(`Regime detection complete: ${regimes.length} classified periods`);

  // Log regime distribution for validation
  const regimeStats = {
    volatility: {},
    trend: {},
    crisis: {}
  };

  regimes.forEach(r => {
    regimeStats.volatility[r.volatilityRegime] = (regimeStats.volatility[r.volatilityRegime] || 0) + 1;
    regimeStats.trend[r.trendRegime] = (regimeStats.trend[r.trendRegime] || 0) + 1;
    regimeStats.crisis[r.crisisRegime] = (regimeStats.crisis[r.crisisRegime] || 0) + 1;
  });

  console.log('Regime distribution:', regimeStats);

  return regimes;
}

/**
 * Get adaptive parameters based on current market regime
 * @param {Array} priceHistory - Price history for regime detection
 * @param {Object} baseParams - Base parameters to adjust
 * @returns {Object} Adjusted parameters for portfolio strategies
 */
function getAdaptiveParameters(priceHistory, baseParams = null) {
  // Default base parameters (current fixed values)
  const base = baseParams || {
    ewmaLambda: 0.94,
    baseRebalanceFreq: 21,
    baseCorrelationPenalty: 0.5
  };

  // Initialize with base parameters
  let adjusted = {
    rebalanceFreqDays: base.baseRebalanceFreq || base.rebalanceFreqDays || 21,
    ewmaLambda: base.baseEwmaLambda || base.ewmaLambda || 0.94,
    correlationPenalty: base.baseCorrelationPenalty || base.correlationPenalty || 0.5
  };

  // If insufficient data, return base parameters
  if (!priceHistory || priceHistory.length < 60) {
    return adjusted;
  }

  // Calculate simple volatility for regime classification
  const returns = calculateReturns(priceHistory);
  if (returns.length === 0) {
    return adjusted;
  }

  const currentVolatility = calculateEWMAVolatility(returns, 0.94);

  // Simple regime detection based on volatility
  let volatilityRegime = 'medium_vol';
  if (currentVolatility < 0.12) {
    volatilityRegime = 'low_vol';
  } else if (currentVolatility > 0.25) {
    volatilityRegime = 'high_vol';
  }

  // Adjust based on volatility regime
  switch (volatilityRegime) {
    case 'low_vol':
      adjusted.ewmaLambda = Math.max(0.85, adjusted.ewmaLambda - 0.05);  // More responsive
      adjusted.rebalanceFreqDays = Math.min(42, Math.floor(adjusted.rebalanceFreqDays * 1.3)); // Less frequent
      break;
    case 'high_vol':
      adjusted.ewmaLambda = Math.min(0.98, adjusted.ewmaLambda + 0.03);  // Less responsive
      adjusted.rebalanceFreqDays = Math.max(10, Math.floor(adjusted.rebalanceFreqDays * 0.7)); // More frequent
      break;
    // medium_vol keeps base parameters
  }

  // Ensure parameters stay within reasonable bounds
  adjusted.ewmaLambda = Math.max(0.8, Math.min(0.99, adjusted.ewmaLambda));
  adjusted.rebalanceFreqDays = Math.max(1, Math.min(63, adjusted.rebalanceFreqDays));
  adjusted.correlationPenalty = Math.max(0.0, Math.min(2.0, adjusted.correlationPenalty));

  return adjusted;
}

/**
 * Get current regime for a specific date or latest available
 * @param {Array} regimes - Array of regime classifications
 * @param {string} targetDate - Target date (optional, uses latest if not provided)
 * @returns {Object|null} Regime classification for the date
 */
function getCurrentRegime(regimes, targetDate = null) {
  if (!regimes || regimes.length === 0) {
    return null;
  }

  if (!targetDate) {
    // Return the most recent regime
    return regimes[regimes.length - 1];
  }

  // Find regime for specific date
  const regime = regimes.find(r => r.date === targetDate);
  return regime || null;
}

/**
 * Validate regime detection quality
 * @param {Array} regimes - Array of regime classifications
 * @returns {Object} Validation metrics
 */
function validateRegimeDetection(regimes) {
  if (!regimes || regimes.length === 0) {
    return { valid: false, message: 'No regime data available' };
  }

  const stats = {
    totalPeriods: regimes.length,
    volatilityRegimes: {},
    trendRegimes: {},
    crisisRegimes: {},
    avgVolatility: 0,
    avgCorrelation: 0
  };

  // Calculate regime distributions and averages
  let volSum = 0, corrSum = 0;

  regimes.forEach(r => {
    stats.volatilityRegimes[r.volatilityRegime] = (stats.volatilityRegimes[r.volatilityRegime] || 0) + 1;
    stats.trendRegimes[r.trendRegime] = (stats.trendRegimes[r.trendRegime] || 0) + 1;
    stats.crisisRegimes[r.crisisRegime] = (stats.crisisRegimes[r.crisisRegime] || 0) + 1;

    volSum += r.measurements.volatility;
    corrSum += r.measurements.correlation;
  });

  stats.avgVolatility = volSum / regimes.length;
  stats.avgCorrelation = corrSum / regimes.length;

  // Basic validation checks
  const hasAllRegimeTypes =
    Object.keys(stats.volatilityRegimes).length >= 2 &&
    Object.keys(stats.trendRegimes).length >= 2;

  const reasonableVolatility =
    stats.avgVolatility > 0.05 && stats.avgVolatility < 0.5;

  const reasonableCorrelation =
    stats.avgCorrelation > 0.0 && stats.avgCorrelation < 1.0;

  const valid = hasAllRegimeTypes && reasonableVolatility && reasonableCorrelation;

  return {
    valid: valid,
    stats: stats,
    message: valid ? 'Regime detection appears valid' : 'Regime detection may have issues'
  };
}

// Export all functions and constants
module.exports = {
  // Constants
  REGIME_TYPES,
  DEFAULT_PARAMETERS: DEFAULT_REGIME_PARAMS,

  // Main functions
  detectMarketRegimes,
  getAdaptiveParameters,
  getCurrentRegime,
  validateRegimeDetection,

  // Helper functions (for testing)
  calculateRollingVolatility,
  calculateMovingAverages,
  calculateRollingCorrelations,
  classifyVolatilityRegime,
  classifyTrendRegime,
  classifyCrisisRegime
};
