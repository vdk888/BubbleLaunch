const path = require("path");
const fs = require("fs/promises");
const yahooFinanceService = require("./yahooFinanceService");
const portfolioService = require("./portfolioService");

const DEFAULT_PERIODS = [1, 3, 5, 10, 20];
const DEFAULT_PERIOD = 20;
const DEFAULT_TICKERS = ["SPY", "IEF", "GLD", "EFA", "EEM", "CASH"]; // 5 ETFs + Cash reserve
const SAMPLE_INTERVAL_DAYS = 1; // Daily data (no downsampling)
const CACHE_TTL_DAYS = 31; // Cache TTL: 31 days (monthly regeneration)

const STRATEGY_BUILDERS = {
  equalWeight: portfolioService.calculateEqualWeight,
  sixtyForty: portfolioService.calculateSixtyForty,
  momentumTilt: portfolioService.calculateMomentumTilt,
  hierarchicalRiskParity: portfolioService.calculateMinimumVarianceWeights,
  simpleRP: portfolioService.calculateSimpleRiskParity,
  optimizedRP: portfolioService.calculateOptimizedRiskParity,
  optimizedRiskBudgeting: portfolioService.calculateOptimizedRiskBudgeting,
  enhancedRiskParityDCC: portfolioService.calculateEnhancedRiskParityWithDCC,
};

const STRATEGY_ORDER = [
  "equalWeight",
  "sixtyForty",
  "momentumTilt",
  "hierarchicalRiskParity",
  "simpleRP",
  "optimizedRP",
  "optimizedRiskBudgeting",
  "enhancedRiskParityDCC",
];

function formatPercentage(value) {
  return Math.round(value * 10000) / 100;
}

function formatRatio(value) {
  return Math.round(value * 100) / 100;
}

function createLookup(series, valueKey) {
  const map = new Map();
  if (!Array.isArray(series)) return map;

  for (const point of series) {
    if (point && point.date) {
      map.set(point.date, point[valueKey]);
    }
  }
  return map;
}

function filterSeriesByCutoff(series, cutoffDate) {
  if (!Array.isArray(series)) return [];
  return series.filter((point) => new Date(point.date) >= cutoffDate);
}

function filterPriceDataByCutoff(priceData, cutoffDate) {
  const filtered = {};

  for (const [ticker, series] of Object.entries(priceData)) {
    const filteredSeries = filterSeriesByCutoff(series, cutoffDate);
    if (filteredSeries.length > 0) {
      filtered[ticker] = filteredSeries;
    }
  }

  return filtered;
}

function resolveStrategyKeys(strategies) {
  const available = Object.keys(strategies || {});
  const ordered = STRATEGY_ORDER.filter((key) => available.includes(key));
  const extras = available.filter((key) => !STRATEGY_ORDER.includes(key));
  return [...ordered, ...extras];
}

function buildChartData(tickers, priceData, strategies, cutoffDate = null, includeAllData = false) {
  if (!tickers.length) return [];

  const baseTicker = tickers[0];
  const baseSeries = priceData[baseTicker] || [];
  if (!baseSeries.length) return [];

  const strategyKeys = resolveStrategyKeys(strategies);
  const chartData = [];

  // Build date-based lookups for ALL data
  const priceLookups = {};
  for (const ticker of tickers) {
    priceLookups[ticker] = new Map();
    const priceArray = priceData[ticker] || [];
    for (const point of priceArray) {
      if (point && point.date) {
        priceLookups[ticker].set(point.date, point.price);
      }
    }
  }

  const strategyLookups = {};
  for (const strategyKey of strategyKeys) {
    strategyLookups[strategyKey] = new Map();
    const stratArray = strategies[strategyKey] || [];
    for (const point of stratArray) {
      if (point && point.date) {
        strategyLookups[strategyKey].set(point.date, point.value);
      }
    }
  }

  // Determine sampling interval
  const samplingInterval = includeAllData ? 1 : SAMPLE_INTERVAL_DAYS;

  // Sample or include all data points
  for (let i = 0; i < baseSeries.length; i += samplingInterval) {
    const basePoint = baseSeries[i];
    if (!basePoint || !basePoint.date) continue;

    const date = basePoint.date;
    const dateObj = new Date(date);

    // Skip if date is before cutoff date (for period-specific filtering)
    if (cutoffDate && dateObj < cutoffDate) {
      continue;
    }

    // Skip if strategy data is missing for this date
    const hasAllStrategyData = strategyKeys.every(key => strategyLookups[key].has(date));
    if (!hasAllStrategyData) continue;

    // Build chart entry
    const entry = { date };

    // Add price data
    let missingPrice = false;
    for (const ticker of tickers) {
      const price = priceLookups[ticker].get(date);
      if (price === undefined) {
        missingPrice = true;
        break;
      }
      entry[ticker] = Math.round(price * 100) / 100;
    }
    if (missingPrice) continue;

    // Add strategy data
    for (const strategyKey of strategyKeys) {
      const stratValue = strategyLookups[strategyKey].get(date);
      entry[strategyKey] = Math.round(stratValue * 100) / 100;
    }

    chartData.push(entry);
  }

  return chartData;
}

function calculateStrategyMetrics(strategySeries) {
  const metrics = {};

  for (const [key, series] of Object.entries(strategySeries)) {
    if (!series || series.length === 0) continue;

    const rawMetrics = portfolioService.calculateMetrics(series);

    metrics[key] = {
      totalReturn: formatPercentage(rawMetrics.totalReturn),
      annualReturn: formatPercentage(rawMetrics.annualReturn),
      volatility: formatPercentage(rawMetrics.volatility),
      sharpeRatio: formatRatio(rawMetrics.sharpeRatio),
      maxDrawdown: formatPercentage(rawMetrics.maxDrawdown),
    };
  }

  return metrics;
}

function buildSnapshot({
  years,
  cutoffDate,
  tickers,
  normalizedPriceData,
  strategySeries,
  allocationData,
  generatedAt,
}) {
  const filteredStrategies = {};
  for (const [strategyKey, series] of Object.entries(strategySeries)) {
    filteredStrategies[strategyKey] = filterSeriesByCutoff(series, cutoffDate);
  }

  // Filter allocation data by cutoff date
  const filteredAllocations = {};
  if (allocationData) {
    for (const [strategyKey, allocations] of Object.entries(allocationData)) {
      if (allocations && Array.isArray(allocations)) {
        filteredAllocations[strategyKey] = filterSeriesByCutoff(allocations, cutoffDate);
      }
    }
  }

  // Build chart data using full histories but clip to the requested cutoff date
  // Price/strategy series remain unfiltered so strategies with long lookbacks still compute correctly
  const chartData = buildChartData(
    tickers,
    normalizedPriceData,  // ALL unfiltered price data
    strategySeries,       // ALL unfiltered strategy data (has all dates for matching)
    cutoffDate            // Filter to the requested period when building chart data
  );

  // Calculate metrics only on filtered data for accuracy
  const metrics = calculateStrategyMetrics(filteredStrategies);
  const strategyKeys = resolveStrategyKeys(filteredStrategies);

  return {
    periodYears: years,
    dataStartDate: cutoffDate.toISOString().split('T')[0], // ISO date string (YYYY-MM-DD) for frontend filtering
    generatedAt,
    tickers,
    data: chartData,
    metrics,
    strategyKeys,
    allocations: filteredAllocations,  // Add allocation data to snapshot
    rawPoints: {
      ...Object.fromEntries(
        strategyKeys.map((key) => [
          key,
          filteredStrategies[key] ? filteredStrategies[key].length : 0,
        ])
      ),
    },
  };
}

async function generateSnapshots({
  periods = DEFAULT_PERIODS,
  tickers = DEFAULT_TICKERS,
} = {}) {
  if (!Array.isArray(periods) || periods.length === 0) {
    throw new Error("At least one period is required to generate snapshots.");
  }

  const uniquePeriods = Array.from(new Set(periods)).sort((a, b) => a - b);
  const maxYears = uniquePeriods[uniquePeriods.length - 1];

  const rawData = await yahooFinanceService.fetchETFData(tickers, maxYears);
  const normalizedData = yahooFinanceService.normalizeToBase100(rawData);

  const strategySeries = {};
  const allocationData = {};
  for (const [strategyKey, builder] of Object.entries(STRATEGY_BUILDERS)) {
    const result = builder(normalizedData);

    // Handle new { portfolio, allocations } structure
    if (result && typeof result === 'object' && result.portfolio && result.allocations) {
      strategySeries[strategyKey] = result.portfolio;
      allocationData[strategyKey] = result.allocations;
    }
    // Backward compatibility: handle old array format (should not occur after our changes)
    else if (Array.isArray(result) && result.length > 0) {
      strategySeries[strategyKey] = result;
      console.warn(`Strategy ${strategyKey} returned old array format without allocations`);
    }
  }

  const referenceSeries =
    strategySeries.equalWeight ||
    Object.values(strategySeries).find(
      (series) => Array.isArray(series) && series.length > 0
    );

  if (!referenceSeries) {
    throw new Error("No portfolio strategy data available to build snapshots.");
  }

  const latestPoint = referenceSeries[referenceSeries.length - 1];

  if (!latestPoint) {
    throw new Error("No portfolio data available to build snapshots.");
  }

  const generatedAt = new Date().toISOString();
  const snapshots = {};

  for (const years of uniquePeriods) {
    const cutoffDate = new Date(latestPoint.date);
    cutoffDate.setFullYear(cutoffDate.getFullYear() - years);

    snapshots[String(years)] = buildSnapshot({
      years,
      cutoffDate,
      tickers,
      normalizedPriceData: normalizedData,
      strategySeries,
      allocationData,  // Pass allocation data to buildSnapshot
      generatedAt,
    });
  }

  return {
    generatedAt,
    tickers,
    strategyKeys: resolveStrategyKeys(strategySeries),
    periods: snapshots,
  };
}

function getSnapshotForPeriod(snapshots, period) {
  if (!snapshots || !snapshots.periods) return null;
  const key = String(period);
  return snapshots.periods[key] || null;
}

async function writeSnapshotsToDisk(
  snapshots,
  {
    cacheDir = path.join(__dirname, "../cache"),
    defaultFilename = "portfolio-preview-data.json",
    multiFilename = "portfolio-preview-periods.json",
    defaultPeriod = DEFAULT_PERIOD,
  } = {}
) {
  await fs.mkdir(cacheDir, { recursive: true });

  const multiPath = path.join(cacheDir, multiFilename);
  await fs.writeFile(multiPath, JSON.stringify(snapshots, null, 2), "utf-8");

  const defaultSnapshot = getSnapshotForPeriod(snapshots, defaultPeriod);
  if (!defaultSnapshot) {
    throw new Error(
      `Default period ${defaultPeriod} does not exist in generated snapshots.`
    );
  }

  const defaultPayload = {
    data: defaultSnapshot.data,
    metrics: defaultSnapshot.metrics,
    allocations: defaultSnapshot.allocations || {},  // Include allocation data
    generatedAt: snapshots.generatedAt,
    periodYears: defaultSnapshot.periodYears,
    periodsAvailable: Object.keys(snapshots.periods).map(Number),
    tickers: snapshots.tickers,
    strategyKeys:
      defaultSnapshot.strategyKeys ||
      snapshots.strategyKeys ||
      resolveStrategyKeys({}),
  };

  const defaultPath = path.join(cacheDir, defaultFilename);
  await fs.writeFile(defaultPath, JSON.stringify(defaultPayload, null, 2), "utf-8");

  // Calculate total trading days included (from largest period)
  const maxPeriod = Math.max(...Object.keys(snapshots.periods).map(Number));
  const maxPeriodSnapshot = snapshots.periods[String(maxPeriod)];
  const tradingDaysIncluded = maxPeriodSnapshot?.data?.length || 0;

  // Update cache metadata
  const now = new Date();
  const metadata = {
    lastGenerated: now.toISOString(),
    nextScheduled: calculateNextScheduled(now),
    dataFrequency: "daily",
    tradingDaysIncluded,
    strategiesIncluded: snapshots.strategyKeys || [],
    ttlDays: CACHE_TTL_DAYS,
    version: "1.0",
    cacheStatus: "ready",
  };

  await writeCacheMetadata(metadata, cacheDir);
  console.log(`✅ Cache regenerated successfully (${tradingDaysIncluded} trading days, ${snapshots.strategyKeys?.length || 0} strategies)`);

  return { defaultPath, multiPath, defaultSnapshot, metadata };
}

/**
 * Read cache metadata from disk
 * @returns {Promise<Object>} Cache metadata object
 */
async function readCacheMetadata(cacheDir = path.join(__dirname, "../cache")) {
  const metadataPath = path.join(cacheDir, "cache-metadata.json");

  try {
    const content = await fs.readFile(metadataPath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    // Return default metadata if file doesn't exist
    console.warn("Cache metadata not found, using defaults");
    return {
      lastGenerated: null,
      nextScheduled: null,
      dataFrequency: "daily",
      tradingDaysIncluded: 0,
      strategiesIncluded: [],
      ttlDays: CACHE_TTL_DAYS,
      version: "1.0",
      cacheStatus: "uninitialized",
    };
  }
}

/**
 * Write cache metadata to disk
 * @param {Object} metadata - Metadata object to save
 * @param {string} cacheDir - Cache directory path
 */
async function writeCacheMetadata(metadata, cacheDir = path.join(__dirname, "../cache")) {
  await fs.mkdir(cacheDir, { recursive: true });
  const metadataPath = path.join(cacheDir, "cache-metadata.json");
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), "utf-8");
  console.log(`📊 Cache metadata saved: ${metadataPath}`);
}

/**
 * Calculate days since last cache generation
 * @param {Object} metadata - Cache metadata
 * @returns {number} Days since last generation (or Infinity if never generated)
 */
function getCacheAgeDays(metadata) {
  if (!metadata.lastGenerated) {
    return Infinity;
  }

  const lastGenerated = new Date(metadata.lastGenerated);
  const now = new Date();
  const diffMs = now - lastGenerated;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Calculate next scheduled cache regeneration (last Sunday of next month at 2 AM UTC)
 * @param {Date} lastGenerated - Last generation timestamp
 * @returns {string} ISO string of next scheduled regeneration
 */
function calculateNextScheduled(lastGenerated = new Date()) {
  const current = new Date(lastGenerated);

  // Move to next month
  current.setMonth(current.getMonth() + 1);

  // Find last day of that month
  const lastDay = new Date(current.getFullYear(), current.getMonth() + 1, 0);

  // Find last Sunday of that month
  const dayOfWeek = lastDay.getDay();
  const daysToSubtract = dayOfWeek; // Sunday is 0
  const lastSunday = new Date(lastDay);
  lastSunday.setDate(lastDay.getDate() - daysToSubtract);

  // Set time to 2 AM UTC
  lastSunday.setUTCHours(2, 0, 0, 0);

  return lastSunday.toISOString();
}

/**
 * Validate cache age and determine if regeneration is needed
 * @param {Object} metadata - Cache metadata
 * @returns {Object} { isValid: boolean, ageDays: number, reason: string }
 */
function validateCacheAge(metadata) {
  const ageDays = getCacheAgeDays(metadata);

  if (ageDays === Infinity) {
    return {
      isValid: false,
      ageDays: Infinity,
      reason: "Cache has never been generated",
    };
  }

  if (ageDays > metadata.ttlDays) {
    return {
      isValid: false,
      ageDays,
      reason: `Cache is stale (${ageDays} days old, TTL: ${metadata.ttlDays} days)`,
    };
  }

  return {
    isValid: true,
    ageDays,
    reason: `Cache is fresh (${ageDays} days old)`,
  };
}

module.exports = {
  DEFAULT_PERIODS,
  DEFAULT_PERIOD,
  CACHE_TTL_DAYS,
  generateSnapshots,
  getSnapshotForPeriod,
  writeSnapshotsToDisk,
  readCacheMetadata,
  writeCacheMetadata,
  getCacheAgeDays,
  calculateNextScheduled,
  validateCacheAge,
};
