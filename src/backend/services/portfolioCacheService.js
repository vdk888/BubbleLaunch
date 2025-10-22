const path = require("path");
const fs = require("fs/promises");
const yahooFinanceService = require("./yahooFinanceService");
const portfolioService = require("./portfolioService");

const DEFAULT_PERIODS = [1, 3, 5, 10, 20];
const DEFAULT_PERIOD = 20;
const DEFAULT_TICKERS = ["SPY", "IEF", "GLD"];
const SAMPLE_INTERVAL_DAYS = 21; // ~ monthly sampling

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

function buildChartData(tickers, priceData, strategies) {
  if (!tickers.length) return [];

  const baseTicker = tickers[0];
  const baseSeries = priceData[baseTicker] || [];
  if (!baseSeries.length) return [];

  const priceLookups = {};
  tickers.forEach((ticker) => {
    priceLookups[ticker] = createLookup(priceData[ticker] || [], "price");
  });

  const strategyLookups = {
    equalWeight: createLookup(strategies.equalWeight, "value"),
    simpleRP: createLookup(strategies.simpleRP, "value"),
    optimizedRP: createLookup(strategies.optimizedRP, "value"),
  };

  const chartData = [];
  const usedDates = new Set();

  const buildEntry = (date) => {
    const entry = { date };

    for (const ticker of tickers) {
      const value = priceLookups[ticker].get(date);
      if (value === undefined) {
        return null;
      }
      entry[ticker] = Math.round(value * 100) / 100;
    }

    const equalWeight = strategyLookups.equalWeight.get(date);
    const simpleRP = strategyLookups.simpleRP.get(date);
    const optimizedRP = strategyLookups.optimizedRP.get(date);

    if (
      equalWeight === undefined ||
      simpleRP === undefined ||
      optimizedRP === undefined
    ) {
      return null;
    }

    entry.equalWeight = Math.round(equalWeight * 100) / 100;
    entry.simpleRP = Math.round(simpleRP * 100) / 100;
    entry.optimizedRP = Math.round(optimizedRP * 100) / 100;

    return entry;
  };

  for (let i = 0; i < baseSeries.length; i += SAMPLE_INTERVAL_DAYS) {
    const { date } = baseSeries[i];
    const entry = buildEntry(date);
    if (entry) {
      chartData.push(entry);
      usedDates.add(date);
    }
  }

  const lastDate =
    baseSeries.length > 0 ? baseSeries[baseSeries.length - 1].date : null;
  if (lastDate && !usedDates.has(lastDate)) {
    const entry = buildEntry(lastDate);
    if (entry) {
      chartData.push(entry);
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

  const filteredStrategies = {
    equalWeight: filterSeriesByCutoff(strategySeries.equalWeight, cutoffDate),
    simpleRP: filterSeriesByCutoff(strategySeries.simpleRP, cutoffDate),
    optimizedRP: filterSeriesByCutoff(strategySeries.optimizedRP, cutoffDate),
  };

  const chartData = buildChartData(
    tickers,
    filteredPriceData,
    filteredStrategies
  );
  const metrics = calculateStrategyMetrics(filteredStrategies);

  return {
    periodYears: years,
    generatedAt,
    tickers,
    data: chartData,
    metrics,
    rawPoints: {
      equalWeight: filteredStrategies.equalWeight.length,
      simpleRP: filteredStrategies.simpleRP.length,
      optimizedRP: filteredStrategies.optimizedRP.length,
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

  const strategySeries = {
    equalWeight: portfolioService.calculateEqualWeight(normalizedData),
    simpleRP: portfolioService.calculateSimpleRiskParity(normalizedData),
    optimizedRP: portfolioService.calculateOptimizedRiskParity(normalizedData),
  };

  const latestPoint =
    strategySeries.equalWeight[strategySeries.equalWeight.length - 1];

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
