const path = require("path");
const fs = require("fs").promises;
const yahooFinanceService = require("../services/yahooFinanceService");
const portfolioService = require("../services/portfolioService");
const portfolioCacheService = require("../services/portfolioCacheService");

/**
 * Get pre-calculated preview data for landing page snapshot
 * Returns static JSON data for fast loading
 */
async function getPreviewData(req, res) {
  try {
    const previewDataPath = path.join(
      __dirname,
      "../cache/portfolio-preview-data.json"
    );

    const data = await fs.readFile(previewDataPath, "utf-8");
    const previewData = JSON.parse(data);

    res.json({
      success: true,
      ...previewData,
      fromCache: true,
    });
  } catch (error) {
    if (error.code === "ENOENT") {
      try {
        console.log("📊 Cache miss – regenerating portfolio preview data...");
        const snapshots = await portfolioCacheService.generateSnapshots();
        const { defaultSnapshot } =
          await portfolioCacheService.writeSnapshotsToDisk(snapshots);

        res.json({
          success: true,
          data: defaultSnapshot.data,
          metrics: defaultSnapshot.metrics,
          generatedAt: defaultSnapshot.generatedAt,
          periodYears: defaultSnapshot.periodYears,
          periodsAvailable: Object.keys(snapshots.periods).map(Number),
          tickers: snapshots.tickers,
          fromCache: false,
        });
      } catch (generationError) {
        console.error("Error generating preview data:", generationError);
        res.status(500).json({
          success: false,
          error: "Failed to generate preview data",
          details: generationError.message,
        });
      }
      return;
    }

    console.error("Error getting preview data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch preview data",
      details: error.message,
    });
  }
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

    let portfolio;

    switch (strategy) {
      case "equal":
        portfolio = portfolioService.calculateEqualWeight(prices);
        break;
      case "simple-rp":
        portfolio = portfolioService.calculateSimpleRiskParity(prices);
        break;
      case "optimized-rp":
        portfolio = portfolioService.calculateOptimizedRiskParity(prices);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown strategy: ${strategy}`,
        });
    }

    const metrics = portfolioService.calculateMetrics(portfolio);

    res.json({
      success: true,
      portfolio,
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
 * Clear Yahoo Finance cache
 */
async function clearCache(req, res) {
  try {
    yahooFinanceService.clearCache();
    const cacheDir = path.join(__dirname, "../cache");
    const filesToRemove = [
      "portfolio-preview-data.json",
      "portfolio-preview-periods.json",
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

    res.json({ success: true, message: "Cache cleared" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getPreviewData,
  getETFData,
  calculatePortfolio,
  clearCache,
};
