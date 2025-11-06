// Test Hierarchical Risk Parity Implementation

// Create sample normalized data for testing
const createSampleData = () => {
  const tickers = ['SPY', 'IEF', 'GLD', 'EFA', 'VNQ'];
  const dates = [];
  const normalizedData = {};

  // Generate 100 days of sample data
  const startDate = new Date('2024-01-01');
  for (let i = 0; i < 100; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }

  tickers.forEach((ticker, tickerIdx) => {
    normalizedData[ticker] = [];
    let price = 100; // Start at base 100

    dates.forEach((date, i) => {
      // Add some volatility and correlation patterns
      const randomReturn = (Math.random() - 0.5) * 0.04; // 4% daily volatility
      const correlatedReturn = tickerIdx === 0 ? randomReturn : randomReturn * 0.7 + (Math.random() - 0.5) * 0.02;

      price *= (1 + correlatedReturn);
      normalizedData[ticker].push({
        date: date,
        price: price
      });
    });
  });

  return normalizedData;
};

const testHRP = async () => {
  console.log('Testing Hierarchical Risk Parity Implementation...');

  try {
    // Dynamic import for ES module
    const { calculateHierarchicalRiskParity } = await import('./src/services/hierarchicalRiskParity.js');

    console.log('✅ HRP module imported successfully');

    const sampleData = createSampleData();
    console.log('Sample data created with tickers:', Object.keys(sampleData));

    const result = calculateHierarchicalRiskParity(sampleData, 21, 60, 3);

    if (result && result.portfolioData && result.weightsData) {
      console.log('✅ HRP implementation successful!');
      console.log(`Portfolio data points: ${result.portfolioData.length}`);
      console.log(`Weights data points: ${result.weightsData.length}`);

      if (result.weightsData.length > 0) {
        const lastWeights = result.weightsData[result.weightsData.length - 1];
        console.log('Final allocation weights:', lastWeights);

        // Check if weights sum to approximately 1
        const weightSum = Object.keys(lastWeights)
          .filter(key => key !== 'date')
          .reduce((sum, ticker) => sum + lastWeights[ticker], 0);

        console.log(`Weight sum: ${weightSum.toFixed(4)} (should be ~1.0)`);

        if (Math.abs(weightSum - 1.0) < 0.01) {
          console.log('✅ Weights are properly normalized');
        } else {
          console.log('⚠️ Weight normalization may need adjustment');
        }
      }

      return true;
    } else {
      console.log('❌ HRP implementation returned null or invalid results');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing HRP implementation:', error);
    return false;
  }
};

// Run the test
testHRP().then(success => {
  console.log(success ? '\n🎉 HRP implementation test completed successfully!' : '\n💥 HRP implementation test failed!');
  process.exit(success ? 0 : 1);
});