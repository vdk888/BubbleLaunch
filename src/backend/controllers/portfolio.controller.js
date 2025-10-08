const yahooFinanceService = require("../services/yahooFinanceService");
const portfolioService = require("../services/portfolioService");
const path = require("path");
const fs = require("fs").promises;

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

    // Try to read cached preview data
    try {
      const data = await fs.readFile(previewDataPath, "utf-8");
      const previewData = JSON.parse(data);

      res.json({
        success: true,
        ...previewData,
        fromCache: true,
      });
    } catch (error) {
      // If cache doesn't exist, generate it
      console.log("📊 Generating portfolio preview data...");
      const generatedData = await generatePreviewData();

      // Save to cache
      await fs.writeFile(
        previewDataPath,
        JSON.stringify(generatedData, null, 2)
      );

      res.json({
        success: true,
        ...generatedData,
        fromCache: false,
      });
    }
  } catch (error) {
    console.error("Error getting preview data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch preview data",
      details: error.message,
    });
  }
}

/**
 * Generate preview data (helper function)
 */
async function generatePreviewData() {
  // Fetch 20 years of data for 3 ETFs
  const rawData = await yahooFinanceService.fetchETFData(["SPY", "IEF", "GLD"], 20);
  const priceData = yahooFinanceService.normalizeToBase100(rawData);

  // Calculate portfolios
  const equalWeight = portfolioService.calculateEqualWeight(priceData);
  const simpleRP = portfolioService.calculateSimpleRiskParity(priceData);
  const optimizedRP = portfolioService.calculateOptimizedRiskParity(priceData);

  // Calculate metrics
  const equalWeightMetrics = portfolioService.calculateMetrics(equalWeight);
  const simpleRPMetrics = portfolioService.calculateMetrics(simpleRP);
  const optimizedRPMetrics = portfolioService.calculateMetrics(optimizedRP);

  // Combine data for chart (monthly data to reduce size)
  const chartData = [];
  for (let i = 0; i < equalWeight.length; i += 21) {
    // Sample every 21 days (~monthly)
    const date = equalWeight[i].date;
    const spyPoint = priceData.SPY.find((p) => p.date === date);
    const iefPoint = priceData.IEF.find((p) => p.date === date);
    const gldPoint = priceData.GLD.find((p) => p.date === date);

    if (spyPoint && iefPoint && gldPoint) {
      chartData.push({
        date,
        SPY: Math.round(spyPoint.price * 100) / 100,
        IEF: Math.round(iefPoint.price * 100) / 100,
        GLD: Math.round(gldPoint.price * 100) / 100,
        equalWeight: Math.round(equalWeight[i].value * 100) / 100,
        simpleRP: Math.round(simpleRP[i].value * 100) / 100,
        optimizedRP: Math.round(optimizedRP[i].value * 100) / 100,
      });
    }
  }

  return {
    data: chartData,
    metrics: {
      equalWeight: {
        totalReturn: Math.round(equalWeightMetrics.totalReturn * 10000) / 100, // Convert to percentage
        sharpeRatio: Math.round(equalWeightMetrics.sharpeRatio * 100) / 100,
      },
      simpleRP: {
        totalReturn: Math.round(simpleRPMetrics.totalReturn * 10000) / 100,
        sharpeRatio: Math.round(simpleRPMetrics.sharpeRatio * 100) / 100,
      },
      optimizedRP: {
        totalReturn: Math.round(optimizedRPMetrics.totalReturn * 10000) / 100,
        sharpeRatio: Math.round(optimizedRPMetrics.sharpeRatio * 100) / 100,
      },
    },
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
function clearCache(req, res) {
  try {
    yahooFinanceService.clearCache();
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
