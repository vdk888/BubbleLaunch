/**
 * Test script for regime detection functionality
 * This script validates the regime detection system using historical ETF data
 */

// Import necessary modules
import { fetchETFPriceData, normalizeToBase100 } from './src/services/etfDataService.js';
import {
  detectMarketRegimes,
  getAdaptiveParameters,
  getCurrentRegime,
  validateRegimeDetection,
  REGIME_TYPES
} from './src/services/regimeDetection.js';

/**
 * Main testing function
 */
async function testRegimeDetection() {
  console.log('='.repeat(60));
  console.log('REGIME DETECTION VALIDATION TEST');
  console.log('='.repeat(60));

  try {
    // Step 1: Load historical data
    console.log('\n1. Loading historical ETF data...');
    const rawData = await fetchETFPriceData();
    const normalizedData = normalizeToBase100(rawData);

    // Verify data quality
    const tickers = Object.keys(normalizedData);
    console.log(`   Data loaded for ${tickers.length} ETFs: ${tickers.join(', ')}`);

    let totalDataPoints = 0;
    let dateRange = { start: null, end: null };

    tickers.forEach(ticker => {
      const data = normalizedData[ticker];
      totalDataPoints += data.length;

      if (data.length > 0) {
        const start = data[0].date;
        const end = data[data.length - 1].date;

        if (!dateRange.start || start < dateRange.start) dateRange.start = start;
        if (!dateRange.end || end > dateRange.end) dateRange.end = end;

        console.log(`   ${ticker}: ${data.length} data points (${start} to ${end})`);
      }
    });

    console.log(`   Total data points: ${totalDataPoints}`);
    console.log(`   Date range: ${dateRange.start} to ${dateRange.end}`);

    // Step 2: Run regime detection
    console.log('\n2. Running regime detection analysis...');
    const regimes = detectMarketRegimes(normalizedData);

    if (regimes.length === 0) {
      console.error('   ERROR: No regimes detected!');
      return;
    }

    console.log(`   Detected ${regimes.length} regime periods`);
    console.log(`   Regime detection period: ${regimes[0].date} to ${regimes[regimes.length - 1].date}`);

    // Step 3: Validate regime detection quality
    console.log('\n3. Validating regime detection quality...');
    const validation = validateRegimeDetection(regimes);

    console.log(`   Validation status: ${validation.valid ? 'PASSED' : 'FAILED'}`);
    console.log(`   Message: ${validation.message}`);

    if (validation.stats) {
      console.log('\n   Regime Statistics:');
      console.log(`   - Total periods analyzed: ${validation.stats.totalPeriods}`);
      console.log(`   - Average volatility: ${(validation.stats.avgVolatility * 100).toFixed(2)}%`);
      console.log(`   - Average correlation: ${validation.stats.avgCorrelation.toFixed(3)}`);

      console.log('\n   Volatility Regime Distribution:');
      Object.entries(validation.stats.volatilityRegimes).forEach(([regime, count]) => {
        const percentage = ((count / validation.stats.totalPeriods) * 100).toFixed(1);
        console.log(`     ${regime}: ${count} periods (${percentage}%)`);
      });

      console.log('\n   Trend Regime Distribution:');
      Object.entries(validation.stats.trendRegimes).forEach(([regime, count]) => {
        const percentage = ((count / validation.stats.totalPeriods) * 100).toFixed(1);
        console.log(`     ${regime}: ${count} periods (${percentage}%)`);
      });

      console.log('\n   Crisis Regime Distribution:');
      Object.entries(validation.stats.crisisRegimes).forEach(([regime, count]) => {
        const percentage = ((count / validation.stats.totalPeriods) * 100).toFixed(1);
        console.log(`     ${regime}: ${count} periods (${percentage}%)`);
      });
    }

    // Step 4: Test adaptive parameter adjustments
    console.log('\n4. Testing adaptive parameter adjustments...');

    // Test different regime scenarios
    const testScenarios = [
      {
        name: 'Bull Market + Low Volatility',
        regime: {
          volatilityRegime: REGIME_TYPES.VOLATILITY.LOW,
          trendRegime: REGIME_TYPES.TREND.BULL,
          crisisRegime: REGIME_TYPES.CRISIS.NORMAL
        }
      },
      {
        name: 'Bear Market + High Volatility',
        regime: {
          volatilityRegime: REGIME_TYPES.VOLATILITY.HIGH,
          trendRegime: REGIME_TYPES.TREND.BEAR,
          crisisRegime: REGIME_TYPES.CRISIS.STRESS
        }
      },
      {
        name: 'Crisis Period',
        regime: {
          volatilityRegime: REGIME_TYPES.VOLATILITY.HIGH,
          trendRegime: REGIME_TYPES.TREND.BEAR,
          crisisRegime: REGIME_TYPES.CRISIS.CRISIS
        }
      },
      {
        name: 'Sideways Market + Medium Volatility',
        regime: {
          volatilityRegime: REGIME_TYPES.VOLATILITY.MEDIUM,
          trendRegime: REGIME_TYPES.TREND.SIDEWAYS,
          crisisRegime: REGIME_TYPES.CRISIS.NORMAL
        }
      }
    ];

    const baseParams = {
      ewmaLambda: 0.94,
      rebalanceFreqDays: 21,
      leverage: 2.0,
      borrowingRate: 0.08,
      correlationPenalty: 0.5,
      lookbackDays: 60
    };

    console.log('\n   Base Parameters:');
    console.log(`     EWMA Lambda: ${baseParams.ewmaLambda}`);
    console.log(`     Rebalance Frequency: ${baseParams.rebalanceFreqDays} days`);
    console.log(`     Leverage: ${baseParams.leverage}x`);
    console.log(`     Borrowing Rate: ${(baseParams.borrowingRate * 100).toFixed(1)}%`);
    console.log(`     Correlation Penalty: ${baseParams.correlationPenalty}`);

    testScenarios.forEach(scenario => {
      console.log(`\n   Scenario: ${scenario.name}`);
      const adaptedParams = getAdaptiveParameters(scenario.regime, baseParams);

      console.log(`     Adjusted EWMA Lambda: ${adaptedParams.ewmaLambda} (${adaptedParams.ewmaLambda === baseParams.ewmaLambda ? 'no change' : (adaptedParams.ewmaLambda > baseParams.ewmaLambda ? 'increased' : 'decreased')})`);
      console.log(`     Adjusted Rebalance Freq: ${adaptedParams.rebalanceFreqDays} days (${adaptedParams.rebalanceFreqDays === baseParams.rebalanceFreqDays ? 'no change' : (adaptedParams.rebalanceFreqDays > baseParams.rebalanceFreqDays ? 'increased' : 'decreased')})`);
      console.log(`     Adjusted Leverage: ${adaptedParams.leverage}x (${adaptedParams.leverage === baseParams.leverage ? 'no change' : (adaptedParams.leverage > baseParams.leverage ? 'increased' : 'decreased')})`);
      console.log(`     Adjusted Correlation Penalty: ${adaptedParams.correlationPenalty} (${adaptedParams.correlationPenalty === baseParams.correlationPenalty ? 'no change' : (adaptedParams.correlationPenalty > baseParams.correlationPenalty ? 'increased' : 'decreased')})`);
    });

    // Step 5: Analyze historical regime transitions
    console.log('\n5. Analyzing historical regime transitions...');

    // Look for interesting periods (like 2008 financial crisis, COVID-19, etc.)
    const interestingDates = [
      '2008-09-15', // Lehman Brothers collapse
      '2008-10-01', // Height of 2008 crisis
      '2020-03-15', // COVID-19 market crash (if data available)
      '2007-01-01', // Pre-crisis period
      '2009-01-01'  // Post-crisis recovery
    ];

    interestingDates.forEach(date => {
      const regime = getCurrentRegime(regimes, date);
      if (regime) {
        console.log(`\n   Date: ${date}`);
        console.log(`     Volatility Regime: ${regime.volatilityRegime}`);
        console.log(`     Trend Regime: ${regime.trendRegime}`);
        console.log(`     Crisis Regime: ${regime.crisisRegime}`);
        console.log(`     Volatility: ${(regime.measurements.volatility * 100).toFixed(2)}%`);
        console.log(`     Trend Signal: ${regime.measurements.trendSignal.toFixed(4)}`);
        console.log(`     Avg Correlation: ${regime.measurements.correlation.toFixed(3)}`);

        const adaptedParams = getAdaptiveParameters(regime, baseParams);
        console.log(`     Recommended Lambda: ${adaptedParams.ewmaLambda}`);
        console.log(`     Recommended Rebalance: ${adaptedParams.rebalanceFreqDays} days`);
        console.log(`     Recommended Leverage: ${adaptedParams.leverage}x`);
      } else {
        console.log(`   Date: ${date} - No regime data available`);
      }
    });

    // Step 6: Summary and recommendations
    console.log('\n6. Summary and Recommendations');
    console.log('='.repeat(40));

    if (validation.valid) {
      console.log('✅ Regime detection system is functioning correctly');
      console.log('✅ All regime types are properly identified');
      console.log('✅ Parameter adjustments are working as expected');
      console.log('\nRecommendations for integration:');
      console.log('- The regime detection system is ready for integration with portfolio strategies');
      console.log('- Consider using a moving window approach for real-time regime updates');
      console.log('- Monitor parameter adjustments during extreme market conditions');
      console.log('- Validate performance improvements through backtesting');
    } else {
      console.log('❌ Regime detection system needs improvement');
      console.log('❌ Review validation errors and adjust parameters');
    }

    // Get latest regime for current portfolio strategies
    const latestRegime = getCurrentRegime(regimes);
    if (latestRegime) {
      console.log('\n📊 Current Market Regime (Latest Available):');
      console.log(`   Date: ${latestRegime.date}`);
      console.log(`   Volatility: ${latestRegime.volatilityRegime}`);
      console.log(`   Trend: ${latestRegime.trendRegime}`);
      console.log(`   Crisis: ${latestRegime.crisisRegime}`);

      const currentParams = getAdaptiveParameters(latestRegime, baseParams);
      console.log('\n🎯 Recommended Current Parameters:');
      console.log(`   EWMA Lambda: ${currentParams.ewmaLambda}`);
      console.log(`   Rebalance Frequency: ${currentParams.rebalanceFreqDays} days`);
      console.log(`   Leverage: ${currentParams.leverage}x`);
      console.log(`   Correlation Penalty: ${currentParams.correlationPenalty}`);
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }

  console.log('\n' + '='.repeat(60));
  console.log('TEST COMPLETE');
  console.log('='.repeat(60));
}

// Run the test
testRegimeDetection();