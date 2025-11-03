const path = require("path");
const fs = require("fs/promises");
const yahooFinanceService = require("./yahooFinanceService");
const portfolioService = require("./portfolioService");

const DEFAULT_PERIODS = [1, 3, 5, 10, 20];
const DEFAULT_PERIOD = 20;
const DEFAULT_TICKERS = ["SPY", "IEF", "GLD", "EFA", "EEM"]; // 5 ETFs for global diversification
const SAMPLE_INTERVAL_DAYS = 21; // ~ monthly sampling

const STRATEGY_BUILDERS = {
  equalWeight: portfolioService.calculateEqualWeight,
  sixtyForty: portfolioService.calculateSixtyForty,
  momentumTilt: portfolioService.calculateMomentumTilt,
  hierarchicalRiskParity: portfolioService.calculateMinimumVarianceWeights,
  simpleRP: portfolioService.calculateSimpleRiskParity,
  optimizedRP: portfolioService.calculateOptimizedRiskParity,
};

const STRATEGY_ORDER = [
  "equalWeight",
  "sixtyForty",
  "momentumTilt",
  "hierarchicalRiskParity",
  "simpleRP",
  "optimizedRP",
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

function buildChartData(tickers, priceData, strategies) {
  if (!tickers.length) return [];

  const baseTicker = tickers[0];
  const baseSeries = priceData[baseTicker] || [];
  if (!baseSeries.length) return [];

  const strategyKeys = resolveStrategyKeys(strategies);
  const chartData = [];
  const usedDates = new Set();

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
  const allStrategyDates = new Set();
  for (const strategyKey of strategyKeys) {
    strategyLookups[strategyKey] = new Map();
    const stratArray = strategies[strategyKey] || [];
    for (const point of stratArray) {
      if (point && point.date) {
        strategyLookups[strategyKey].set(point.date, point.value);
        allStrategyDates.add(point.date);
      }
    }
  }

  // Sample every N days, skipping dates where strategy data isn't available
  for (let i = 0; i < baseSeries.length; i += SAMPLE_INTERVAL_DAYS) {
    const basePoint = baseSeries[i];
    if (!basePoint || !basePoint.date) continue;

    const date = basePoint.date;

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
    usedDates.add(date);
  }

  // Add last point if not already included
  if (baseSeries.length > 0) {
    const lastPoint = baseSeries[baseSeries.length - 1];
    if (lastPoint && lastPoint.date && !usedDates.has(lastPoint.date)) {
      const entry = { date: lastPoint.date };

      // Add prices for last point
      let hasAllPrices = true;
      for (const ticker of tickers) {
        const priceArray = priceData[ticker];
        if (!priceArray || priceArray.length === 0) {
          hasAllPrices = false;
          break;
        }
        const lastPrice = priceArray[priceArray.length - 1];
        entry[ticker] = Math.round(lastPrice.price * 100) / 100;
      }

      if (hasAllPrices) {
        // Try to add strategy data for last point
        let hasAllStrategies = true;
        for (const strategyKey of strategyKeys) {
          const stratValue = strategyLookups[strategyKey].get(lastPoint.date);
          if (stratValue === undefined) {
            hasAllStrategies = false;
            break;
          }
          entry[strategyKey] = Math.round(stratValue * 100) / 100;
        }

        if (hasAllStrategies) {
          chartData.push(entry);
        }
      }
    }
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
  generatedAt,
}) {
  const filteredPriceData = filterPriceDataByCutoff(
    normalizedPriceData,
    cutoffDate
  );

  const filteredStrategies = {};
  for (const [strategyKey, series] of Object.entries(strategySeries)) {
    filteredStrategies[strategyKey] = filterSeriesByCutoff(series, cutoffDate);
  }

  const chartData = buildChartData(
    tickers,
    filteredPriceData,
    filteredStrategies
  );
  const metrics = calculateStrategyMetrics(filteredStrategies);
  const strategyKeys = resolveStrategyKeys(filteredStrategies);

  return {
    periodYears: years,
    generatedAt,
    tickers,
    data: chartData,
    metrics,
    strategyKeys,
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
  for (const [strategyKey, builder] of Object.entries(STRATEGY_BUILDERS)) {
    const series = builder(normalizedData);
    if (Array.isArray(series) && series.length > 0) {
      strategySeries[strategyKey] = series;
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

  return { defaultPath, multiPath, defaultSnapshot };
}

module.exports = {
  DEFAULT_PERIODS,
  DEFAULT_PERIOD,
  generateSnapshots,
  getSnapshotForPeriod,
  writeSnapshotsToDisk,
};
