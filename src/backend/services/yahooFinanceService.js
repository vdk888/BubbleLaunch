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
  EFA: "MSCI EAFE (Developed Markets)",
  EEM: "MSCI Emerging Markets",
  VNQ: "Real Estate (US REITs)",
  CASH: "Euro Cash Reserve (2% annual return)",
};
const BASE_TICKERS = Object.keys(ETF_CONFIG).filter((ticker) => ticker !== "CASH");

// In-memory cache for ETF data
const cache = {
  data: {},
  timestamp: null,
  TTL: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Calculate date range for historical data
 * @param {number} years - Number of years to fetch (default: 20)
 * @returns {Object} {startDate, endDate} in YYYY-MM-DD format
 */
function getDateRange(years = 20) {
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
 * @param {number} years - Number of years of history (default: 20)
 * @returns {Promise<Object>} Object with ticker symbols as keys and price arrays as values
 */
async function fetchETFData(requestedTickers = Object.keys(ETF_CONFIG), years = 20) {
  const uniqueRequested = Array.from(new Set(requestedTickers));
  const includeCash = uniqueRequested.includes("CASH");
  const tickers = Array.from(
    new Set(uniqueRequested.filter((ticker) => ticker !== "CASH"))
  );
  const baseTickers = tickers.length > 0 ? tickers : BASE_TICKERS;

  // Check cache
  if (
    cache.timestamp &&
    Date.now() - cache.timestamp < cache.TTL &&
    Object.keys(cache.data).length > 0
  ) {
    console.log("📊 Returning cached ETF data");
    const cachedData = cache.data;
    const subset = {};
    uniqueRequested.forEach((ticker) => {
      if (cachedData[ticker]) {
        subset[ticker] = cachedData[ticker];
      }
    });
    return subset;
  }

  console.log(`📈 Fetching ${years} years of data for ${baseTickers.join(", ")}${includeCash ? " + CASH" : ""}...`);

  const { startDate, endDate } = getDateRange(years);
  const priceData = {};

  // Fetch data for each ticker sequentially to avoid rate limiting
  for (const ticker of baseTickers) {
    let retries = 3;
    let lastError;

    while (retries > 0) {
      try {
        console.log(`  Fetching ${ticker}... (attempt ${4 - retries}/3)`);
        const prices = await fetchTickerData(ticker, startDate, endDate);
        priceData[ticker] = prices;
        console.log(`  ✓ ${ticker}: ${prices.length} days`);
        break; // Success - exit retry loop
      } catch (error) {
        lastError = error;
        retries--;
        if (retries > 0) {
          // Wait longer before retrying (exponential backoff: 1s, 2s, 4s)
          const waitTime = Math.pow(2, 3 - retries) * 1000;
          console.log(`  ⟳ ${ticker} failed, retrying in ${waitTime}ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    if (lastError && retries === 0) {
      console.error(`  ✗ ${ticker} failed after 3 attempts:`, lastError.message);
    }

    // Longer delay to respect Yahoo Finance rate limits (1s between requests)
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  const successCount = Object.keys(priceData).length;
  console.log(
    `✅ Fetched data for ${successCount}/${baseTickers.length} ETFs`
  );

  // Only cache if we got ALL tickers - don't cache partial data
  if (successCount === baseTickers.length) {
    // ⚠️ DAILY DATA: No longer resampling to weekly (strategy calculations expect daily data)
    // Add cash series if needed
    const referenceTicker = baseTickers[0];
    const referenceDates = priceData[referenceTicker]?.map((point) => point.date) || [];
    if (referenceDates.length > 0) {
      priceData.CASH = generateCashSeries(referenceDates);
    }

    cache.data = priceData;
    cache.timestamp = Date.now();
  } else {
    console.warn(`⚠️ Incomplete data: only got ${successCount}/${baseTickers.length} tickers. NOT caching.`);
    // Clear cache so next request tries fresh
    cache.data = {};
    cache.timestamp = null;
  }

  const finalData = cache.data;
  const output = {};
  uniqueRequested.forEach((ticker) => {
    if (finalData[ticker]) {
      output[ticker] = finalData[ticker];
    }
  });
  return output;
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


function generateCashSeries(referenceDates, annualRate = 0.02) {
  if (!Array.isArray(referenceDates) || referenceDates.length === 0) {
    return [];
  }

  // Daily compounding: (1 + r)^(1/252) per trading day
  const dailyFactor = Math.pow(1 + annualRate, 1 / 252);
  return referenceDates.map((date, index) => ({
    date,
    price: Math.pow(dailyFactor, index),
  }));
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
  BASE_TICKERS,
  fetchETFData,
  normalizeToBase100,
  clearCache,
  getDateRange,
};
