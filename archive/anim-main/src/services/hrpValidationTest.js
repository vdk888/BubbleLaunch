/**
 * HRP Validation Test
 *
 * This file contains validation tests for the Hierarchical Risk Parity implementation
 * to ensure it works correctly with the 5-asset ETF portfolio structure.
 */

import {
  calculateCorrelationDistance,
  performHierarchicalClustering,
  extractOptimalClusters,
  calculateRiskParityWeights,
  calculateHRPWeights,
  calculateHierarchicalRiskParity
} from './hierarchicalRiskParity.js';

/**
 * Create mock normalized data structure similar to the real ETF data
 */
const createMockNormalizedData = () => {
  const tickers = ['SPY', 'IEF', 'GLD', 'EFA', 'VNQ'];
  const numDays = 252; // One year of data
  const mockData = {};

  tickers.forEach((ticker, index) => {
    const prices = [];
    let price = 100; // Start at base 100

    for (let i = 0; i < numDays; i++) {
      // Different volatility patterns for each ETF
      const volatility = [0.15, 0.08, 0.20, 0.18, 0.25][index]; // SPY, IEF, GLD, EFA, VNQ
      const correlation = [1.0, -0.2, 0.1, 0.8, 0.3][index]; // Correlation with market

      // Generate correlated returns
      const marketReturn = (Math.random() - 0.5) * 0.04; // ±2% daily range
      const idiosyncraticReturn = (Math.random() - 0.5) * 0.02;
      const dailyReturn = correlation * marketReturn + Math.sqrt(1 - correlation ** 2) * idiosyncraticReturn;

      price *= (1 + dailyReturn * volatility);

      prices.push({
        date: `2023-${String(Math.floor(i / 21) + 1).padStart(2, '0')}-${String((i % 21) + 1).padStart(2, '0')}`,
        price: price
      });
    }

    mockData[ticker] = prices;
  });

  return mockData;
};

/**
 * Create mock returns series for testing
 */
const createMockReturnsSeries = () => {
  const tickers = ['SPY', 'IEF', 'GLD', 'EFA', 'VNQ'];
  const numReturns = 60;
  const returnsSeries = {};

  tickers.forEach((ticker, index) => {
    const returns = [];
    const baseVol = [0.15, 0.08, 0.20, 0.18, 0.25][index];

    for (let i = 0; i < numReturns; i++) {
      // Generate returns with different correlations
      returns.push((Math.random() - 0.5) * baseVol);
    }

    returnsSeries[ticker] = returns;
  });

  return returnsSeries;
};

/**
 * Test correlation distance matrix calculation
 */
export const testCorrelationDistance = () => {
  console.log('Testing correlation distance matrix calculation...');

  const returnsSeries = createMockReturnsSeries();
  const distanceMatrix = calculateCorrelationDistance(returnsSeries);

  // Validate structure
  const tickers = Object.keys(returnsSeries);

  // Check matrix is square and symmetric
  let passed = true;
  tickers.forEach(ticker1 => {
    if (!distanceMatrix[ticker1]) {
      console.error(`Missing row for ${ticker1}`);
      passed = false;
    }

    tickers.forEach(ticker2 => {
      if (distanceMatrix[ticker1][ticker2] === undefined) {
        console.error(`Missing distance for ${ticker1}-${ticker2}`);
        passed = false;
      }

      // Check diagonal is zero
      if (ticker1 === ticker2 && distanceMatrix[ticker1][ticker2] !== 0) {
        console.error(`Diagonal should be zero for ${ticker1}`);
        passed = false;
      }

      // Check distance is between 0 and 2
      const distance = distanceMatrix[ticker1][ticker2];
      if (distance < 0 || distance > 2) {
        console.error(`Distance out of range [0,2]: ${distance} for ${ticker1}-${ticker2}`);
        passed = false;
      }

      // Check symmetry
      if (Math.abs(distanceMatrix[ticker1][ticker2] - distanceMatrix[ticker2][ticker1]) > 1e-10) {
        console.error(`Matrix not symmetric: ${ticker1}-${ticker2}`);
        passed = false;
      }
    });
  });

  if (passed) {
    console.log('✅ Correlation distance matrix test passed');
    console.log('Sample distances:', {
      'SPY-IEF': distanceMatrix.SPY.IEF.toFixed(3),
      'SPY-GLD': distanceMatrix.SPY.GLD.toFixed(3),
      'GLD-VNQ': distanceMatrix.GLD.VNQ.toFixed(3)
    });
  } else {
    console.log('❌ Correlation distance matrix test failed');
  }

  return passed;
};

/**
 * Test hierarchical clustering
 */
export const testHierarchicalClustering = () => {
  console.log('Testing hierarchical clustering...');

  const returnsSeries = createMockReturnsSeries();
  const distanceMatrix = calculateCorrelationDistance(returnsSeries);
  const { dendrogram, history } = performHierarchicalClustering(distanceMatrix);

  let passed = true;

  // Check dendrogram has all assets
  const allAssets = Object.keys(returnsSeries);
  if (dendrogram.members.length !== allAssets.length) {
    console.error(`Dendrogram missing assets. Expected ${allAssets.length}, got ${dendrogram.members.length}`);
    passed = false;
  }

  // Check all assets are included
  allAssets.forEach(asset => {
    if (!dendrogram.members.includes(asset)) {
      console.error(`Asset ${asset} missing from dendrogram`);
      passed = false;
    }
  });

  // Check clustering history
  if (history.length !== allAssets.length - 1) {
    console.error(`Expected ${allAssets.length - 1} clustering steps, got ${history.length}`);
    passed = false;
  }

  if (passed) {
    console.log('✅ Hierarchical clustering test passed');
    console.log(`Clustered ${allAssets.length} assets in ${history.length} steps`);
    console.log('Final cluster:', dendrogram.members);
  } else {
    console.log('❌ Hierarchical clustering test failed');
  }

  return passed;
};

/**
 * Test cluster extraction
 */
export const testClusterExtraction = () => {
  console.log('Testing cluster extraction...');

  const returnsSeries = createMockReturnsSeries();
  const distanceMatrix = calculateCorrelationDistance(returnsSeries);
  const { dendrogram } = performHierarchicalClustering(distanceMatrix);

  // Test different numbers of clusters
  const testCases = [1, 2, 3];
  let passed = true;

  testCases.forEach(maxClusters => {
    const clusters = extractOptimalClusters(dendrogram, maxClusters);

    // Check cluster count
    if (clusters.length > maxClusters) {
      console.error(`Too many clusters: expected ≤${maxClusters}, got ${clusters.length}`);
      passed = false;
    }

    // Check all assets are assigned
    const assignedAssets = clusters.flat();
    const allAssets = Object.keys(returnsSeries);

    if (assignedAssets.length !== allAssets.length) {
      console.error(`Asset count mismatch: expected ${allAssets.length}, got ${assignedAssets.length}`);
      passed = false;
    }

    // Check no asset is assigned to multiple clusters
    const uniqueAssets = [...new Set(assignedAssets)];
    if (uniqueAssets.length !== assignedAssets.length) {
      console.error('Assets assigned to multiple clusters');
      passed = false;
    }

    console.log(`${maxClusters} clusters:`, clusters);
  });

  if (passed) {
    console.log('✅ Cluster extraction test passed');
  } else {
    console.log('❌ Cluster extraction test failed');
  }

  return passed;
};

/**
 * Test risk parity weights calculation
 */
export const testRiskParityWeights = () => {
  console.log('Testing risk parity weights calculation...');

  const returnsSeries = createMockReturnsSeries();
  let passed = true;

  // Test single asset
  const singleAssetWeights = calculateRiskParityWeights(['SPY'], { SPY: returnsSeries.SPY });
  if (Math.abs(singleAssetWeights.SPY - 1.0) > 1e-10) {
    console.error('Single asset should have weight 1.0');
    passed = false;
  }

  // Test multiple assets
  const allAssets = Object.keys(returnsSeries);
  const weights = calculateRiskParityWeights(allAssets, returnsSeries);

  // Check weights sum to 1
  const weightSum = Object.values(weights).reduce((sum, w) => sum + w, 0);
  if (Math.abs(weightSum - 1.0) > 1e-10) {
    console.error(`Weights should sum to 1.0, got ${weightSum}`);
    passed = false;
  }

  // Check all weights are positive
  Object.entries(weights).forEach(([asset, weight]) => {
    if (weight <= 0) {
      console.error(`Weight for ${asset} should be positive, got ${weight}`);
      passed = false;
    }
  });

  if (passed) {
    console.log('✅ Risk parity weights test passed');
    console.log('Sample weights:',
      Object.fromEntries(
        Object.entries(weights).map(([k, v]) => [k, v.toFixed(3)])
      )
    );
  } else {
    console.log('❌ Risk parity weights test failed');
  }

  return passed;
};

/**
 * Test full HRP weights calculation
 */
export const testHRPWeights = () => {
  console.log('Testing HRP weights calculation...');

  const returnsSeries = createMockReturnsSeries();
  const weights = calculateHRPWeights(returnsSeries, 3);

  let passed = true;

  // Check weights sum to 1
  const weightSum = Object.values(weights).reduce((sum, w) => sum + w, 0);
  if (Math.abs(weightSum - 1.0) > 1e-10) {
    console.error(`HRP weights should sum to 1.0, got ${weightSum}`);
    passed = false;
  }

  // Check all weights are positive
  Object.entries(weights).forEach(([asset, weight]) => {
    if (weight <= 0) {
      console.error(`HRP weight for ${asset} should be positive, got ${weight}`);
      passed = false;
    }
  });

  // Check all assets have weights
  const allAssets = Object.keys(returnsSeries);
  allAssets.forEach(asset => {
    if (!(asset in weights)) {
      console.error(`Missing weight for asset ${asset}`);
      passed = false;
    }
  });

  if (passed) {
    console.log('✅ HRP weights test passed');
    console.log('HRP weights:',
      Object.fromEntries(
        Object.entries(weights).map(([k, v]) => [k, v.toFixed(3)])
      )
    );
  } else {
    console.log('❌ HRP weights test failed');
  }

  return passed;
};

/**
 * Test full HRP portfolio calculation
 */
export const testHRPPortfolio = () => {
  console.log('Testing HRP portfolio calculation...');

  const normalizedData = createMockNormalizedData();
  const result = calculateHierarchicalRiskParity(normalizedData, 21, 60, 2);

  let passed = true;

  // Check result structure
  if (!result || !result.portfolioData || !result.weightsData) {
    console.error('HRP portfolio result missing required fields');
    passed = false;
  }

  if (passed && result.portfolioData.length === 0) {
    console.error('HRP portfolio data is empty');
    passed = false;
  }

  if (passed && result.weightsData.length === 0) {
    console.error('HRP weights data is empty');
    passed = false;
  }

  // Check portfolio data structure
  if (passed && result.portfolioData.length > 0) {
    const firstPoint = result.portfolioData[0];
    if (!firstPoint.date || typeof firstPoint.value !== 'number') {
      console.error('Invalid portfolio data structure');
      passed = false;
    }
  }

  // Check weights data structure
  if (passed && result.weightsData.length > 0) {
    const firstWeightPoint = result.weightsData[0];
    const allAssets = Object.keys(normalizedData);

    if (!firstWeightPoint.date) {
      console.error('Missing date in weights data');
      passed = false;
    }

    allAssets.forEach(asset => {
      if (typeof firstWeightPoint[asset] !== 'number') {
        console.error(`Missing or invalid weight for ${asset}`);
        passed = false;
      }
    });
  }

  if (passed) {
    console.log('✅ HRP portfolio calculation test passed');
    console.log(`Generated ${result.portfolioData.length} portfolio data points`);
    console.log(`Generated ${result.weightsData.length} weight data points`);

    // Show final portfolio value and weights
    if (result.portfolioData.length > 0) {
      const finalValue = result.portfolioData[result.portfolioData.length - 1].value;
      console.log(`Final portfolio value: ${finalValue.toFixed(2)}`);
    }

    if (result.weightsData.length > 0) {
      const finalWeights = result.weightsData[result.weightsData.length - 1];
      const { date, ...weights } = finalWeights;
      console.log('Final weights:',
        Object.fromEntries(
          Object.entries(weights).map(([k, v]) => [k, v.toFixed(3)])
        )
      );
    }
  } else {
    console.log('❌ HRP portfolio calculation test failed');
  }

  return passed;
};

/**
 * Run all validation tests
 */
export const runAllHRPTests = () => {
  console.log('\n🧪 Running HRP Validation Tests...\n');

  const tests = [
    testCorrelationDistance,
    testHierarchicalClustering,
    testClusterExtraction,
    testRiskParityWeights,
    testHRPWeights,
    testHRPPortfolio
  ];

  const results = tests.map(test => {
    try {
      return test();
    } catch (error) {
      console.error(`Test failed with error: ${error.message}`);
      return false;
    }
  });

  const passedCount = results.filter(r => r).length;
  const totalCount = results.length;

  console.log(`\n📊 Test Results: ${passedCount}/${totalCount} tests passed`);

  if (passedCount === totalCount) {
    console.log('🎉 All HRP validation tests passed!');
    console.log('✅ HRP implementation is ready for integration');
  } else {
    console.log('⚠️  Some tests failed. Please review the implementation.');
  }

  return passedCount === totalCount;
};

// Export for potential use in other test files
export {
  createMockNormalizedData,
  createMockReturnsSeries
};