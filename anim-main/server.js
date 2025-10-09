const express = require('express');
const cors = require('cors');
const yahooFinance = require('yahoo-finance2').default;

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// ETF configuration matching the Python script exactly
const ETF_CONFIG = {
  'SPY': 'S&P 500 (US Large Cap)',
  'IEF': '7-10Y Treasury Bonds',
  'GLD': 'Gold',
  'EFA': 'Developed Markets (MSCI EAFE)',
  'VNQ': 'REITs'
};

// Calculate date range for 20 years (matching Python logic exactly)
const getDateRange = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (20 * 365)); // 20 years of days

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
};

// Main endpoint that replicates get_price_series_directly() from Python
app.get('/api/etf-data', async (req, res) => {
  try {
    console.log('Fetching ETF price data from Yahoo Finance...');

    const { startDate, endDate } = getDateRange();
    console.log(`Fetching data from ${startDate} to ${endDate}`);

    const priceData = {};
    const tickers = Object.keys(ETF_CONFIG);

    // Fetch data for each ETF sequentially to avoid rate limiting
    for (const ticker of tickers) {
      console.log(`Fetching price series for ${ticker}`);

      try {
        // Use yahoo-finance2 historical method with exact same parameters as Python yfinance
        const historicalData = await yahooFinance.historical(ticker, {
          period1: startDate,
          period2: endDate,
          interval: '1d' // Daily interval
        });

        if (historicalData && historicalData.length > 0) {
          // Convert to the format expected by the frontend (matching Python pandas Series)
          const prices = historicalData.map(day => ({
            date: day.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
            price: day.adjClose // Use adjusted closing price (matches Python hist['Close'] - yfinance returns adjusted prices by default)
          }));

          priceData[ticker] = prices;
          console.log(`Fetched ${historicalData.length} days of data for ${ticker} - First price: raw=${historicalData[0].close} adj=${historicalData[0].adjClose}`);
        } else {
          console.warn(`No price data for ${ticker}`);
        }

        // Small delay to be respectful to Yahoo Finance servers
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error fetching price data for ${ticker}:`, error.message);

        // Continue with other tickers even if one fails
        continue;
      }
    }

    // Return the data in the same structure as the mock implementation
    res.json({
      success: true,
      data: priceData,
      dateRange: { startDate, endDate },
      message: `Fetched real Yahoo Finance data for ${Object.keys(priceData).length} ETFs`
    });

  } catch (error) {
    console.error('Error in /api/etf-data endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ETF data',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Yahoo Finance ETF Data Server is running',
    timestamp: new Date().toISOString()
  });
});

// Get ETF descriptions
app.get('/api/etf-config', (req, res) => {
  res.json(ETF_CONFIG);
});

app.listen(PORT, () => {
  console.log(`Yahoo Finance ETF Data Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`ETF data endpoint: http://localhost:${PORT}/api/etf-data`);
});

module.exports = app;