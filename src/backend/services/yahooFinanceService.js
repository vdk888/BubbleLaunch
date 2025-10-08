const axios = require("axios");

/**
 * Yahoo Finance Service (Simplified)
 * Fetches ETF historical data for portfolio simulator
 *
 * Note: For production, consider using yahoo-finance2 library for better reliability
 * This implementation uses the public Yahoo Finance API endpoints
 */

// ETF Configuration for portfolio simulator
const ETF_CONFIG = {
  SPY: "S&P 500 (US Large Cap)",
  IEF: "7-10Y Treasury Bonds",
  GLD: "Gold",
};

// In-memory cache for ETF data
const cache = {
  data: {},
  timestamp: null,
  TTL: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Calculate date range for historical data
 * @param {number} years - Number of years to fetch (default: 10)
 * @returns {Object} {startDate, endDate} in YYYY-MM-DD format
 */
function getDateRange(years = 10) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - years);

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
}

/**
 * Convert date to Unix timestamp
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {number} Unix timestamp
 */
function dateToUnix(dateString) {
  return Math.floor(new Date(dateString).getTime() / 1000);
}

/**
 * Fetch historical prices for a single ticker using Yahoo Finance API
 * @param {string} ticker - ETF ticker symbol
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of {date, price} objects
 */
async function fetchTickerData(ticker, startDate, endDate) {
  try {
    const period1 = dateToUnix(startDate);
    const period2 = dateToUnix(endDate);

    // Yahoo Finance public API endpoint
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`;
    const params = {
      period1,
      period2,
      interval: "1d",
      events: "history",
    };

    const response = await axios.get(url, { params, timeout: 10000 });

    if (!response.data?.chart?.result?.[0]) {
      throw new Error(`No data returned for ${ticker}`);
    }

    const result = response.data.chart.result[0];
    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];
    const adjClose = result.indicators.adjclose?.[0]?.adjclose || quotes.close;

    // Convert to array of {date, price} objects
    const prices = timestamps.map((timestamp, i) => ({
      date: new Date(timestamp * 1000).toISOString().split("T")[0],
      price: adjClose[i] || quotes.close[i],
    }));

    return prices.filter((p) => p.price !== null);
  } catch (error) {
    console.error(`Error fetching ${ticker}:`, error.message);
    throw error;
  }
}

/**
 * Fetch historical data for multiple tickers
 * @param {Array<string>} tickers - Array of ticker symbols
 * @param {number} years - Number of years of history (default: 10)
 * @returns {Promise<Object>} Object with ticker symbols as keys and price arrays as values
 */
async function fetchETFData(tickers = Object.keys(ETF_CONFIG), years = 10) {
  // Check cache
  if (
    cache.timestamp &&
    Date.now() - cache.timestamp < cache.TTL &&
    Object.keys(cache.data).length > 0
  ) {
    console.log("📊 Returning cached ETF data");
    return cache.data;
  }

  console.log(`📈 Fetching ${years} years of data for ${tickers.join(", ")}...`);

  const { startDate, endDate } = getDateRange(years);
  const priceData = {};

  // Fetch data for each ticker sequentially to avoid rate limiting
  for (const ticker of tickers) {
    try {
      console.log(`  Fetching ${ticker}...`);
      const prices = await fetchTickerData(ticker, startDate, endDate);
      priceData[ticker] = prices;
      console.log(`  ✓ ${ticker}: ${prices.length} days`);

      // Small delay to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`  ✗ ${ticker} failed:`, error.message);
      // Continue with other tickers
    }
  }

  // Update cache
  cache.data = priceData;
  cache.timestamp = Date.now();

  console.log(
    `✅ Fetched data for ${Object.keys(priceData).length}/${tickers.length} ETFs`
  );

  return priceData;
}

/**
 * Get normalized price data (base 100)
 * @param {Object} priceData - Raw price data from fetchETFData
 * @returns {Object} Normalized price data
 */
function normalizeToBase100(priceData) {
  const normalized = {};

  for (const [ticker, prices] of Object.entries(priceData)) {
    if (prices.length === 0) continue;

    const basePrice = prices[0].price;
    normalized[ticker] = prices.map((p) => ({
      date: p.date,
      price: (p.price / basePrice) * 100,
    }));
  }

  return normalized;
}

/**
 * Clear the cache
 */
function clearCache() {
  cache.data = {};
  cache.timestamp = null;
  console.log("🧹 ETF data cache cleared");
}

module.exports = {
  ETF_CONFIG,
  fetchETFData,
  normalizeToBase100,
  clearCache,
  getDateRange,
};
