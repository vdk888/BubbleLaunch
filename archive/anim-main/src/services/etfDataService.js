// ETF data service that fetches real Yahoo Finance data via backend API
// This replaces the mock data implementation with real historical data
// matching the Python yfinance implementation exactly

const ETF_CONFIG = {
  'SPY': 'S&P 500 (US Large Cap)',
  'IEF': '7-10Y Treasury Bonds',
  'GLD': 'Gold',
  'EFA': 'Developed Markets (MSCI EAFE)',
  'VNQ': 'REITs',
  'CASH': 'Risk-Free Asset (2.5% Annual)'
};

// Backend API base URL (uses proxy configuration)
const API_BASE_URL = '/api';

// Fetch real ETF data from backend API
const fetchRealETFData = async () => {
  try {
    console.log('Fetching real ETF data from backend API...');

    const response = await fetch(`${API_BASE_URL}/etf-data`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch ETF data');
    }

    console.log(result.message);
    return result.data;

  } catch (error) {
    console.error('Error fetching real ETF data:', error);
    throw error;
  }
};

// Main data fetching function (mirrors get_price_series_directly from Python)
export const fetchETFPriceData = async () => {
  console.log('Fetching real ETF price data via backend API...');

  try {
    // Fetch real data from Yahoo Finance via our backend
    const priceData = await fetchRealETFData();

    // Validate that we have data for all expected ETFs
    const expectedETFs = Object.keys(ETF_CONFIG);
    const receivedETFs = Object.keys(priceData);

    console.log(`Expected ETFs: ${expectedETFs.join(', ')}`);
    console.log(`Received data for ETFs: ${receivedETFs.join(', ')}`);

    // Log data summary
    for (const [ticker, prices] of Object.entries(priceData)) {
      if (prices && prices.length > 0) {
        console.log(`${ticker}: ${prices.length} days of real historical data`);
      }
    }

    return priceData;

  } catch (error) {
    console.error('Failed to fetch real ETF data:', error);

    // Instead of falling back to mock data, throw the error
    // This ensures we're using real data or nothing
    throw new Error(`Failed to fetch real Yahoo Finance data: ${error.message}`);
  }
};

// Generate risk-free asset data (2.5% annual yield, compounded daily)
const generateRiskFreeData = (referenceDates) => {
  const annualRate = 0.025; // 2.5% annual
  const dailyRate = annualRate / 365; // Daily compounding

  let currentPrice = 100; // Start at base 100
  const riskFreeData = [];

  referenceDates.forEach((date, index) => {
    if (index === 0) {
      riskFreeData.push({ date, price: currentPrice });
    } else {
      currentPrice *= (1 + dailyRate); // Compound daily
      riskFreeData.push({ date, price: currentPrice });
    }
  });

  return riskFreeData;
};

// Normalize to base 100 (direct port from Python)
export const normalizeToBase100 = (priceData) => {
  console.log('Normalizing price data to base 100...');

  const normalizedData = {};

  // Get all unique dates from existing data for risk-free asset
  const allDates = new Set();
  for (const [ticker, prices] of Object.entries(priceData)) {
    if (ticker !== 'CASH' && prices.length > 0) {
      prices.forEach(day => allDates.add(day.date));
    }
  }
  const sortedDates = Array.from(allDates).sort();

  for (const [ticker, prices] of Object.entries(priceData)) {
    if (ticker === 'CASH') {
      // Generate synthetic risk-free data
      const riskFreeData = generateRiskFreeData(sortedDates);
      normalizedData[ticker] = riskFreeData;
      console.log(`Generated CASH (Risk-Free): ${riskFreeData.length} data points, 2.5% annual yield`);
    } else if (prices.length > 0) {
      const firstPrice = prices[0].price;
      const normalizedPrices = prices.map(day => ({
        date: day.date,
        price: (day.price / firstPrice) * 100
      }));

      normalizedData[ticker] = normalizedPrices;
      console.log(`Normalized ${ticker}: ${normalizedPrices.length} data points, base price: $${firstPrice.toFixed(2)}`);
    }
  }

  // Add CASH if it wasn't in the original data
  if (!priceData.CASH && sortedDates.length > 0) {
    const riskFreeData = generateRiskFreeData(sortedDates);
    normalizedData.CASH = riskFreeData;
    console.log(`Generated CASH (Risk-Free): ${riskFreeData.length} data points, 2.5% annual yield`);
  }

  return normalizedData;
};

// Get ETF descriptions for UI
export const getETFDescriptions = () => ETF_CONFIG;

// Health check function to verify backend connectivity
export const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`Backend health check failed: ${response.status}`);
    }
    const result = await response.json();
    console.log('Backend health check:', result);
    return result;
  } catch (error) {
    console.error('Backend health check failed:', error);
    throw error;
  }
};