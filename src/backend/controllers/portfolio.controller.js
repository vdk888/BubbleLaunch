const path = require("path");
const fs = require("fs").promises;
const yahooFinanceService = require("../services/yahooFinanceService");
const portfolioService = require("../services/portfolioService");
const portfolioCacheService = require("../services/portfolioCacheService");
const cacheScheduler = require("../services/cacheScheduler");

/**
 * Get pre-calculated preview data for landing page snapshot
 * Returns static JSON data for fast loading
 * Query params:
 * - period: number of years (1, 3, 5, 10, 20)
 * - leverage: leverage multiplier (1 or 2, default: 1)
 */
async function getPreviewData(req, res) {
  try {
    const requestedPeriod = req.query.period
      ? parseInt(req.query.period, 10)
      : null;

    // Parse and validate leverage parameter
    const leverage = req.query.leverage
      ? parseInt(req.query.leverage, 10)
      : 1;

    // Validate leverage: only 1 or 2 allowed
    if (leverage !== 1 && leverage !== 2) {
      return res.status(400).json({
        success: false,
        error: "Invalid leverage value. Only 1 or 2 are allowed.",
      });
    }

    const previewDataPath = path.join(
      __dirname,
      "../cache/portfolio-preview-data.json"
    );

    const periodsPath = path.join(
      __dirname,
      "../cache/portfolio-preview-periods.json"
    );

    let previewData;
    let periodsPayload;

    // Read cache metadata
    const metadata = await portfolioCacheService.readCacheMetadata();
    const cacheValidation = portfolioCacheService.validateCacheAge(metadata);

    try {
      const [previewRaw, multiRaw] = await Promise.all([
        fs.readFile(previewDataPath, "utf-8"),
        fs.readFile(periodsPath, "utf-8"),
      ]);
      previewData = JSON.parse(previewRaw);
      periodsPayload = JSON.parse(multiRaw);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }

      console.log("📊 Cache miss – regenerating portfolio preview data...");
      const snapshots = await portfolioCacheService.generateSnapshots();
      const { defaultSnapshot } =
        await portfolioCacheService.writeSnapshotsToDisk(snapshots);

      previewData = {
        data: defaultSnapshot.data,
        metrics: defaultSnapshot.metrics,
        allocations: defaultSnapshot.allocations || {},  // Include allocation data
        generatedAt: snapshots.generatedAt,
        periodYears: defaultSnapshot.periodYears,
        periodsAvailable: Object.keys(snapshots.periods).map(Number),
        tickers: snapshots.tickers,
      };
      periodsPayload = snapshots;
    }

    // Prepare initial response payload
    let responsePayload = {
      ...previewData,
      strategyKeys:
        previewData.strategyKeys ||
        periodsPayload?.strategyKeys ||
        Object.keys(previewData.metrics || {}),
    };

    // Apply leverage to default preview data if no specific period requested
    if (!requestedPeriod && leverage > 1) {
      const leveragedDefault = applyLeverageToPeriodSnapshot(
        {
          data: previewData.data,
          metrics: previewData.metrics,
          allocations: previewData.allocations,
        },
        leverage
      );

      responsePayload = {
        ...responsePayload,
        data: leveragedDefault.data,
        metrics: leveragedDefault.metrics,
        leverage: leverage,
      };
    }

    if (requestedPeriod && periodsPayload?.periods) {
      const periodKey = String(requestedPeriod);
      let periodSnapshot = periodsPayload.periods[periodKey];

      if (periodSnapshot) {
        // Apply leverage if requested
        if (leverage > 1) {
          periodSnapshot = applyLeverageToPeriodSnapshot(periodSnapshot, leverage);
        }

        responsePayload = {
          data: periodSnapshot.data,
          metrics: periodSnapshot.metrics,
          allocations: periodSnapshot.allocations || {},  // Include allocation data
          generatedAt: periodSnapshot.generatedAt,
          periodYears: periodSnapshot.periodYears,
          dataStartDate: periodSnapshot.dataStartDate,
          periodsAvailable: Object.keys(periodsPayload.periods).map(Number),
          tickers: periodsPayload.tickers,
          strategyKeys:
            periodSnapshot.strategyKeys ||
            periodsPayload.strategyKeys ||
            Object.keys(periodSnapshot.metrics || {}),
          fromCache: true,
          leverage: leverage, // Include leverage in response
        };
      } else {
        return res.status(404).json({
          success: false,
          error: `No cached data for period ${requestedPeriod} years`,
        });
      }
    }

    // Add cache age information to response headers
    if (cacheValidation.ageDays !== Infinity) {
      res.set('X-Cache-Age-Days', String(cacheValidation.ageDays));
      res.set('X-Cache-Status', cacheValidation.isValid ? 'fresh' : 'stale');
    }

    res.json({
      success: true,
      ...responsePayload,
      fromCache: true,
      cacheMetadata: {
        ageDays: cacheValidation.ageDays,
        isValid: cacheValidation.isValid,
        lastGenerated: metadata.lastGenerated,
        nextScheduled: metadata.nextScheduled,
      },
    });
  } catch (error) {
    console.error("Error getting preview data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch preview data",
      details: error.message,
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// Helper Functions for Leverage Application
// ═══════════════════════════════════════════════════════════════

/**
 * Extract strategy time series from chart data
 * @param {Array} chartData - Array of {date, equalWeight, simpleRP, optimizedRP, ...}
 * @param {string} strategyKey - Strategy name (e.g., "equalWeight", "optimizedRP")
 * @returns {Array} Array of {date, value} objects for that strategy
 */
function extractStrategyTimeSeries(chartData, strategyKey) {
  if (!Array.isArray(chartData) || chartData.length === 0) {
    return [];
  }

  return chartData.map((point) => ({
    date: point.date,
    value: point[strategyKey],
  }));
}

/**
 * Apply leverage to a strategy time series
 * @param {Array} timeSeries - Array of {date, value} objects
 * @param {number} leverage - Leverage multiplier (1 or 2)
 * @param {number} borrowingRate - Annual borrowing rate (default: 0.0675 = 6.75%)
 * @returns {Array} Leveraged time series with same structure {date, value}
 */
function applyLeverageToSeries(timeSeries, leverage, borrowingRate = 0.0675) {
  if (leverage === 1 || !timeSeries || timeSeries.length === 0) {
    return timeSeries;
  }

  console.log(`🔍 DEBUG applyLeverageToSeries: Input length=${timeSeries.length}, leverage=${leverage}, rate=${borrowingRate}`);
  console.log(`🔍 DEBUG applyLeverageToSeries: First 3 values:`, timeSeries.slice(0, 3));
  console.log(`🔍 DEBUG applyLeverageToSeries: Last 3 values:`, timeSeries.slice(-3));

  const leveragedResult = portfolioService.applyLeverageToPortfolio(
    timeSeries,
    leverage,
    borrowingRate
  );

  console.log(`🔍 DEBUG applyLeverageToSeries: Output length=${leveragedResult.length}`);
  console.log(`🔍 DEBUG applyLeverageToSeries: First 3 leveraged values:`, leveragedResult.slice(0, 3));
  console.log(`🔍 DEBUG applyLeverageToSeries: Last 3 leveraged values:`, leveragedResult.slice(-3));

  return leveragedResult;
}

/**
 * Merge leveraged strategy back into chart data
 * @param {Array} chartData - Original chart data array
 * @param {string} strategyKey - Strategy name to update
 * @param {Array} leveragedSeries - Leveraged time series {date, value}
 * @returns {Array} Updated chart data with leveraged values
 */
function mergeStrategyIntoChartData(chartData, strategyKey, leveragedSeries) {
  if (!Array.isArray(chartData) || !Array.isArray(leveragedSeries)) {
    return chartData;
  }

  // Create a map for fast lookup
  const leveragedMap = new Map(
    leveragedSeries.map((point) => [point.date, point.value])
  );

  // Update chart data with leveraged values
  return chartData.map((point) => {
    const leveragedValue = leveragedMap.get(point.date);
    if (leveragedValue !== undefined) {
      return {
        ...point,
        [strategyKey]: leveragedValue,
      };
    }
    return point;
  });
}

/**
 * Recalculate metrics for leveraged strategy
 * @param {Array} timeSeries - Time series {date, value} objects
 * @returns {Object} Metrics object with all performance metrics
 */
function recalculateMetricsForLeveragedStrategy(timeSeries) {
  if (!Array.isArray(timeSeries) || timeSeries.length === 0) {
    return {
      totalReturn: 0,
      annualReturn: 0,
      volatility: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      calmarRatio: 0,
    };
  }

  console.log(`🔍 DEBUG recalculateMetrics: Input length=${timeSeries.length}`);
  console.log(`🔍 DEBUG recalculateMetrics: First value=${timeSeries[0]?.value}, Last value=${timeSeries[timeSeries.length - 1]?.value}`);

  // Use portfolioService.calculateMetrics to get base metrics
  const baseMetrics = portfolioService.calculateMetrics(timeSeries);

  console.log(`🔍 DEBUG recalculateMetrics: baseMetrics=`, JSON.stringify(baseMetrics, null, 2));

  // Calculate Calmar Ratio = Annual Return / |Max Drawdown|
  const calmarRatio =
    baseMetrics.maxDrawdown !== 0
      ? Math.abs(baseMetrics.annualReturn / baseMetrics.maxDrawdown)
      : 0;

  const result = {
    totalReturn: baseMetrics.totalReturn,
    annualReturn: baseMetrics.annualReturn,
    volatility: baseMetrics.volatility,
    sharpeRatio: baseMetrics.sharpeRatio,
    maxDrawdown: baseMetrics.maxDrawdown,
    calmarRatio: calmarRatio,
  };

  console.log(`🔍 DEBUG recalculateMetrics: Final result=`, JSON.stringify(result, null, 2));

  return result;
}

/**
 * Apply leverage to all strategies in the period snapshot
 * @param {Object} periodSnapshot - Snapshot with data and metrics
 * @param {number} leverage - Leverage multiplier (1 or 2)
 * @returns {Object} Updated snapshot with leveraged data and metrics
 */
function applyLeverageToPeriodSnapshot(periodSnapshot, leverage) {
  if (leverage === 1 || !periodSnapshot || !periodSnapshot.data) {
    return periodSnapshot;
  }

  console.log(`📊 Applying ${leverage}x leverage to portfolio data...`);

  let updatedChartData = periodSnapshot.data;
  const updatedMetrics = {};

  // Get all strategy keys from metrics
  const strategyKeys = Object.keys(periodSnapshot.metrics || {});

  // Apply leverage to each strategy
  for (const strategyKey of strategyKeys) {
    // Skip ETF tickers (SPY, IEF, GLD, EFA, EEM) - only leverage strategies
    if (['SPY', 'IEF', 'GLD', 'EFA', 'EEM', 'VNQ', 'CASH'].includes(strategyKey)) {
      updatedMetrics[strategyKey] = periodSnapshot.metrics[strategyKey];
      continue;
    }

    console.log(`  - Processing strategy: ${strategyKey}`);
    console.log(`  - Original metrics for ${strategyKey}:`, JSON.stringify(periodSnapshot.metrics[strategyKey], null, 2));

    // Extract strategy time series
    const timeSeries = extractStrategyTimeSeries(updatedChartData, strategyKey);
    console.log(`  - Extracted ${timeSeries.length} data points for ${strategyKey}`);

    // Apply leverage
    const leveragedSeries = applyLeverageToSeries(timeSeries, leverage);
    console.log(`  - Leveraged series has ${leveragedSeries.length} data points`);

    // Merge back into chart data
    updatedChartData = mergeStrategyIntoChartData(
      updatedChartData,
      strategyKey,
      leveragedSeries
    );

    // Recalculate metrics
    const newMetrics = recalculateMetricsForLeveragedStrategy(leveragedSeries);
    console.log(`  - New metrics for ${strategyKey}:`, JSON.stringify(newMetrics, null, 2));
    updatedMetrics[strategyKey] = newMetrics;
  }

  console.log(`✅ Leverage applied successfully to ${strategyKeys.length} strategies`);

  return {
    ...periodSnapshot,
    data: updatedChartData,
    metrics: updatedMetrics,
    leverage: leverage, // Add leverage indicator to response
  };
}

/**
 * Get ETF historical data
 * Query params: tickers (comma-separated), period (years, default: 20)
 */
async function getETFData(req, res) {
  try {
    const tickersParam = req.query.tickers || "SPY,IEF,GLD";
    const tickers = tickersParam.split(",").map((t) => t.trim());
    const period = parseInt(req.query.period) || 20;

    console.log(`📈 Fetching ${period}Y data for ${tickers.join(", ")}`);

    const data = await yahooFinanceService.fetchETFData(tickers, period);

    res.json({
      success: true,
      data,
      tickers,
      period,
    });
  } catch (error) {
    console.error("Error fetching ETF data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch ETF data",
      details: error.message,
    });
  }
}

/**
 * Calculate portfolio strategy
 * POST body: { prices, strategy: 'equal' | 'simple-rp' | 'optimized-rp' }
 */
async function calculatePortfolio(req, res) {
  try {
    const { prices, strategy } = req.body;

    if (!prices || !strategy) {
      return res.status(400).json({
        success: false,
        error: "prices and strategy are required",
      });
    }

    let result;

    switch (strategy) {
      case "equal":
        result = portfolioService.calculateEqualWeight(prices);
        break;
      case "simple-rp":
        result = portfolioService.calculateSimpleRiskParity(prices);
        break;
      case "optimized-rp":
        result = portfolioService.calculateOptimizedRiskParity(prices);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown strategy: ${strategy}`,
        });
    }

    // Handle new { portfolio, allocations } structure
    const portfolio = result.portfolio || result; // Backward compatibility
    const allocations = result.allocations || null;

    const metrics = portfolioService.calculateMetrics(portfolio);

    res.json({
      success: true,
      portfolio,
      allocations,  // Include allocation data in API response
      metrics: {
        totalReturn: Math.round(metrics.totalReturn * 10000) / 100,
        annualReturn: Math.round(metrics.annualReturn * 10000) / 100,
        volatility: Math.round(metrics.volatility * 10000) / 100,
        sharpeRatio: Math.round(metrics.sharpeRatio * 100) / 100,
        maxDrawdown: Math.round(metrics.maxDrawdown * 10000) / 100,
      },
    });
  } catch (error) {
    console.error("Error calculating portfolio:", error);
    res.status(500).json({
      success: false,
      error: "Failed to calculate portfolio",
      details: error.message,
    });
  }
}

/**
 * Clear Yahoo Finance cache and portfolio cache
 */
async function clearCache(req, res) {
  try {
    yahooFinanceService.clearCache();
    const cacheDir = path.join(__dirname, "../cache");
    const filesToRemove = [
      "portfolio-preview-data.json",
      "portfolio-preview-periods.json",
      "cache-metadata.json",
    ];

    for (const filename of filesToRemove) {
      const filePath = path.join(cacheDir, filename);
      try {
        await fs.unlink(filePath);
        console.log(`🧹 Removed cache file ${filename}`);
      } catch (error) {
        if (error.code !== "ENOENT") {
          throw error;
        }
      }
    }

    res.json({ success: true, message: "Cache and metadata cleared" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Manually trigger cache regeneration
 * POST /api/portfolio/regenerate-cache
 * Optional auth: Include CACHE_REGENERATION_TOKEN in Authorization header
 */
async function regenerateCache(req, res) {
  try {
    // Optional authentication via environment variable
    const expectedToken = process.env.CACHE_REGENERATION_TOKEN;
    if (expectedToken) {
      const authHeader = req.headers.authorization;
      const providedToken = authHeader?.replace("Bearer ", "");

      if (providedToken !== expectedToken) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized - Invalid or missing token",
        });
      }
    }

    console.log("🔄 Manual cache regeneration triggered via API");

    // Trigger regeneration
    const result = await cacheScheduler.triggerCacheRegeneration();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    res.json({
      success: true,
      message: "Cache regenerated successfully",
      duration: result.duration,
      metadata: {
        tradingDays: result.tradingDays,
        strategies: result.strategies,
        nextScheduled: result.metadata.nextScheduled,
        lastGenerated: result.metadata.lastGenerated,
      },
    });
  } catch (error) {
    console.error("Error regenerating cache:", error);
    res.status(500).json({
      success: false,
      error: "Failed to regenerate cache",
      details: error.message,
    });
  }
}

module.exports = {
  getPreviewData,
  getETFData,
  calculatePortfolio,
  clearCache,
  regenerateCache,
};
