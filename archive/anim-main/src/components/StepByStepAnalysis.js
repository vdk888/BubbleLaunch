import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchETFPriceData, normalizeToBase100, getETFDescriptions } from '../services/etfDataService';
import { calculateEqualWeightPortfolio, calculateLeveragedEqualWeightPortfolio, calculateSimpleRiskParity, calculateLeveragedSimpleRiskParity, calculateEnhancedRiskParity, calculateLeveragedEnhancedRiskParity, calculateOptimizedRiskBudgeting, calculateHierarchicalRiskParityPortfolio, calculateEnhancedRiskParityWithDCC, calculateRegimeAwareRiskParity } from '../services/portfolioCalculations';
import { portfolioWorkerService } from '../services/portfolioWorkerService';
import { calculateAllMetrics } from '../services/performanceMetrics';
import PerformanceMetrics from './PerformanceMetrics';

const COLORS = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'];

const StepByStepAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [, setRawPriceData] = useState(null);
  const [normalizedData, setNormalizedData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [portfolioData, setPortfolioData] = useState({});
  const [allocationWeights, setAllocationWeights] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState([]);
  const [selectedStrategies, setSelectedStrategies] = useState({});
  const [showIndividualETFs, setShowIndividualETFs] = useState(true);
  const [calculatingStrategies, setCalculatingStrategies] = useState(new Set());
  const [calculatedStrategies, setCalculatedStrategies] = useState(new Set());
  const [calculationProgress, setCalculationProgress] = useState({});
  const [openDropdowns, setOpenDropdowns] = useState({});

  const strategies = useMemo(() => ({
    basicPortfolios: [
      {
        key: 'equalWeight',
        title: 'Equal Weight Portfolio',
        description: 'Simple equal allocation to each asset',
        chartKey: 'equalWeightPortfolio',
        color: '#000000',
        chartName: 'EQUAL WEIGHT PORTFOLIO'
      }
    ],
    riskParity: [
      {
        key: 'simpleRiskParity',
        title: 'Simple Risk Parity',
        description: 'Basic inverse volatility weighting',
        chartKey: 'simpleRiskParityPortfolio',
        color: '#800080',
        chartName: 'SIMPLE RISK PARITY PORTFOLIO'
      },
      {
        key: 'enhancedRiskParity',
        title: 'Enhanced Risk Parity',
        description: 'EWMA volatility + correlation adjustment (unleveraged)',
        chartKey: 'enhancedRiskParityPortfolio',
        color: '#9467bd',
        chartName: 'ENHANCED RISK PARITY (EWMA + Corr Adj)'
      },
      {
        key: 'enhancedRiskParityDCC',
        title: 'Enhanced Risk Parity with DCC',
        description: 'Dynamic conditional correlation models for time-varying correlations',
        chartKey: 'enhancedRiskParityDCCPortfolio',
        color: '#FF1493',
        chartName: 'ENHANCED RISK PARITY (Dynamic Correlations)'
      },
      {
        key: 'regimeAwareRiskParity',
        title: 'Regime-Aware Risk Parity',
        description: 'Adaptive parameters based on market regime detection',
        chartKey: 'regimeAwareRiskParityPortfolio',
        color: '#4B0082',
        chartName: 'REGIME-AWARE RISK PARITY (Adaptive Parameters)'
      }
    ],
    advancedOptimization: [
      {
        key: 'optimizedRiskBudgeting',
        title: 'Optimized Risk Budgeting',
        description: 'True mathematical risk parity via numerical optimization',
        chartKey: 'optimizedRiskBudgetingPortfolio',
        color: '#FF6600',
        chartName: 'OPTIMIZED RISK BUDGETING (Mathematical Optimization)'
      },
      {
        key: 'hierarchicalRiskParity',
        title: 'Hierarchical Risk Parity',
        description: 'Machine learning clustering with multi-level risk allocation',
        chartKey: 'hierarchicalRiskParityPortfolio',
        color: '#228B22',
        chartName: 'HIERARCHICAL RISK PARITY (ML Clustering)'
      }
    ],
    leveragedStrategies: [
      {
        key: 'leveragedSimpleRiskParity',
        title: 'Simple Risk Parity (2x Leveraged)',
        description: 'Basic inverse volatility weighting with 2x leverage',
        chartKey: 'leveragedSimpleRiskParityPortfolio',
        color: '#8B008B',
        chartName: 'SIMPLE RISK PARITY (2x Lev, 8% Cost)',
        strokeDasharray: '3 3'
      },
      {
        key: 'leveragedEnhancedRiskParity',
        title: 'Enhanced Risk Parity (2x Leveraged)',
        description: 'EWMA + correlation adjustment with 2x leverage',
        chartKey: 'leveragedEnhancedRiskParityPortfolio',
        color: '#FF0000',
        chartName: 'ENHANCED RISK PARITY (2x Lev, 8% Cost)',
        strokeDasharray: '5 5'
      },
      {
        key: 'leveragedEqualWeight',
        title: 'Equal Weight Portfolio (2x Leveraged)',
        description: 'Equal weight with 2x leverage',
        chartKey: 'leveragedEqualWeightPortfolio',
        color: '#0066CC',
        chartName: 'EQUAL WEIGHT PORTFOLIO (2x Lev, 8% Cost)'
      }
    ]
  }), []);

  // Initialize default selections
  const initializeSelections = () => {
    const initialSelections = {};
    Object.values(strategies).flat().forEach(strategy => {
      initialSelections[strategy.key] = false;
    });
    return initialSelections;
  };

  useEffect(() => {
    loadData();
    setSelectedStrategies(initializeSelections());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Move this useEffect after the function definitions

  const loadData = async () => {
    try {
      console.log('Loading ETF data...');
      setLoading(true);

      const rawData = await fetchETFPriceData();
      const normalized = normalizeToBase100(rawData);

      setRawPriceData(rawData);
      setNormalizedData(normalized);

      // Only calculate basic metrics for individual ETFs on load
      const descriptions = getETFDescriptions();
      const basicMetrics = calculateAllMetrics(normalized, {}, descriptions);
      setPerformanceMetrics(basicMetrics);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Lazy calculation function for individual strategies
  const calculateStrategy = useCallback(async (strategyKey) => {
    if (!normalizedData || calculatingStrategies.has(strategyKey) || calculatedStrategies.has(strategyKey)) {
      return;
    }

    console.log(`Calculating strategy: ${strategyKey}`);
    setCalculatingStrategies(prev => new Set(prev).add(strategyKey));

    try {
      let result;

      // Progress callback for web worker calculations
      const onProgress = (progress, message) => {
        setCalculationProgress(prev => ({
          ...prev,
          [strategyKey]: { progress, message }
        }));
      };

      // Check if web workers are available
      await portfolioWorkerService.initialize();
      const useWorker = portfolioWorkerService.isAvailable();

      switch (strategyKey) {
        case 'equalWeight':
          if (useWorker) {
            const portfolioData = await portfolioWorkerService.calculateEqualWeight(normalizedData, onProgress);
            result = { portfolioData };
          } else {
            result = { portfolioData: calculateEqualWeightPortfolio(normalizedData) };
          }
          break;
        case 'leveragedEqualWeight':
          // Complex leveraged calculations stay on main thread
          result = { portfolioData: calculateLeveragedEqualWeightPortfolio(normalizedData, 2.0, 0.08) };
          break;
        case 'simpleRiskParity':
          if (useWorker) {
            result = await portfolioWorkerService.calculateSimpleRiskParity(normalizedData, 21, 60, onProgress);
          } else {
            result = calculateSimpleRiskParity(normalizedData, 21, 60);
          }
          break;
        case 'leveragedSimpleRiskParity':
          // Complex leveraged calculations stay on main thread
          result = calculateLeveragedSimpleRiskParity(normalizedData, 21, 60, 2.0, 0.08);
          break;
        case 'enhancedRiskParity':
          if (useWorker) {
            result = await portfolioWorkerService.calculateEnhancedRiskParity(normalizedData, 21, 60, onProgress);
          } else {
            result = calculateEnhancedRiskParity(normalizedData, 21, 60);
          }
          break;
        case 'leveragedEnhancedRiskParity':
          // Complex leveraged calculations stay on main thread
          result = calculateLeveragedEnhancedRiskParity(normalizedData, 21, 60, 2.0, 0.08);
          break;
        case 'optimizedRiskBudgeting':
          // Advanced strategies stay on main thread for now
          result = calculateOptimizedRiskBudgeting(normalizedData, 21, 120, 'gradient_descent');
          break;
        case 'hierarchicalRiskParity':
          // Advanced strategies stay on main thread for now
          result = calculateHierarchicalRiskParityPortfolio(normalizedData, 21, 126, 3);
          break;
        case 'enhancedRiskParityDCC':
          // Advanced strategies stay on main thread for now
          result = calculateEnhancedRiskParityWithDCC(normalizedData, 21, 60);
          break;
        case 'regimeAwareRiskParity':
          // Advanced strategies stay on main thread for now
          result = calculateRegimeAwareRiskParity(normalizedData, 21, 60);
          break;
        default:
          console.warn(`Unknown strategy: ${strategyKey}`);
          return;
      }

      // Update portfolio data with the calculated result
      setPortfolioData(prev => {
        const updated = { ...prev };
        updated[strategyKey] = result.portfolioData;

        // Handle leveraged equal weight special case
        if (strategyKey === 'leveragedEqualWeight') {
          updated.leveraged = result.portfolioData;
        }

        // Add weights data if available
        if (result.weightsData) {
          updated[`${strategyKey}Weights`] = result.weightsData;
        }

        return updated;
      });

      // Update performance metrics with the new strategy
      const descriptions = getETFDescriptions();
      setPerformanceMetrics(prev => {
        const portfolioForMetrics = { [strategyKey]: result.portfolioData };
        const newMetrics = calculateAllMetrics(normalizedData, portfolioForMetrics, descriptions);

        // Get the strategy metrics from the new calculation (exclude ETF metrics with ' - ')
        const newStrategyMetrics = newMetrics.filter(m => !m.name.includes(' - '));

        if (newStrategyMetrics.length === 0) {
          console.warn(`No strategy metrics found for ${strategyKey}`);
          return prev;
        }

        // Get the name of the strategy metric we just calculated
        const newStrategyName = newStrategyMetrics[0].name;

        // Remove any existing metrics with the same name and add the new one
        const updatedMetrics = prev.filter(m => m.name !== newStrategyName);

        return [...updatedMetrics, ...newStrategyMetrics];
      });

      setCalculatedStrategies(prev => new Set(prev).add(strategyKey));

      // Clear progress indicator
      setCalculationProgress(prev => {
        const updated = { ...prev };
        delete updated[strategyKey];
        return updated;
      });

    } catch (error) {
      console.error(`Error calculating strategy ${strategyKey}:`, error);

      // Clear progress indicator on error
      setCalculationProgress(prev => {
        const updated = { ...prev };
        delete updated[strategyKey];
        return updated;
      });

    } finally {
      setCalculatingStrategies(prev => {
        const newSet = new Set(prev);
        newSet.delete(strategyKey);
        return newSet;
      });
    }
  }, [normalizedData, calculatingStrategies, calculatedStrategies]);

  // Memoized sorted dates for consistent ordering
  const sortedDates = useMemo(() => {
    if (!normalizedData) return [];

    const tickers = Object.keys(normalizedData);
    const allDates = new Set();
    tickers.forEach(ticker => {
      normalizedData[ticker].forEach(point => allDates.add(point.date));
    });
    return Array.from(allDates).sort();
  }, [normalizedData]);

  // Function to sample data for chart display (reduces chart rendering load)
  const sampleChartData = useCallback((data, maxPoints = 2000) => {
    if (!data || data.length <= maxPoints) {
      return data;
    }

    const step = Math.ceil(data.length / maxPoints);
    const sampledData = [];

    for (let i = 0; i < data.length; i += step) {
      sampledData.push(data[i]);
    }

    // Always include the last data point
    if (sampledData[sampledData.length - 1] !== data[data.length - 1]) {
      sampledData.push(data[data.length - 1]);
    }

    return sampledData;
  }, []);

  // Memoized chart data to avoid recalculation on every render
  const memoizedChartData = useMemo(() => {
    if (!normalizedData || !portfolioData || Object.keys(selectedStrategies).length === 0) {
      return [];
    }

    const tickers = Object.keys(normalizedData);

    // Create base chart data
    const newChartData = sortedDates.map(date => {
      const dataPoint = { date };

      // Add ETF prices if individual ETFs are enabled
      if (showIndividualETFs) {
        tickers.forEach(ticker => {
          const pricePoint = normalizedData[ticker].find(p => p.date === date);
          if (pricePoint) {
            dataPoint[ticker] = pricePoint.price;
          }
        });
      }

      return dataPoint;
    }).filter(point => {
      // Only include points where we have data for all ETFs (when showing ETFs)
      if (showIndividualETFs) {
        return tickers.every(ticker => point[ticker] !== undefined);
      }
      return true;
    });

    // Add portfolio data based on selected strategies
    Object.values(strategies).flat().forEach(strategy => {
      if (selectedStrategies[strategy.key] && portfolioData[strategy.key]) {
        portfolioData[strategy.key].forEach(point => {
          const chartPoint = newChartData.find(cp => cp.date === point.date);
          if (chartPoint) {
            chartPoint[strategy.chartKey] = point.value;
          }
        });
      }
    });

    // Handle special case for leveraged equal weight
    if (selectedStrategies.leveragedEqualWeight && portfolioData.leveraged) {
      portfolioData.leveraged.forEach(point => {
        const chartPoint = newChartData.find(cp => cp.date === point.date);
        if (chartPoint) {
          chartPoint.leveragedEqualWeightPortfolio = point.value;
        }
      });
    }

    // Sample data for better chart performance (reduce from 5000+ points to ~2000)
    return sampleChartData(newChartData, 2000);
  }, [normalizedData, portfolioData, selectedStrategies, showIndividualETFs, strategies, sortedDates, sampleChartData]);

  // Memoized allocation weights calculation
  const memoizedAllocationWeights = useMemo(() => {
    if (!normalizedData) return [];

    // Only show allocation weights if exactly one strategy is selected
    const selectedKeys = Object.keys(selectedStrategies).filter(key => selectedStrategies[key]);

    if (selectedKeys.length !== 1) {
      return [];
    }

    const selectedKey = selectedKeys[0];
    const tickers = Object.keys(normalizedData);

    // Map strategy keys to their corresponding weights data
    const weightsMap = {
      equalWeight: () => {
        // Equal weight: 1/n each
        const equalWeight = 1.0 / tickers.length;
        return sortedDates.map(date => {
          const point = { date };
          tickers.forEach(ticker => {
            point[ticker] = equalWeight;
          });
          return point;
        });
      },
      simpleRiskParity: () => portfolioData.simpleRiskParityWeights,
      enhancedRiskParity: () => portfolioData.enhancedRiskParityWeights,
      optimizedRiskBudgeting: () => portfolioData.optimizedRiskBudgetingWeights,
      hierarchicalRiskParity: () => portfolioData.hierarchicalRiskParityWeights,
      enhancedRiskParityDCC: () => portfolioData.enhancedRiskParityDCCWeights,
      regimeAwareRiskParity: () => portfolioData.regimeAwareRiskParityWeights,
      leveragedEnhancedRiskParity: () => portfolioData.leveragedEnhancedRiskParityWeights,
      leveragedEqualWeight: () => {
        // Equal weight for leveraged version: 1/n each
        const equalWeight = 1.0 / tickers.length;
        return sortedDates.map(date => {
          const point = { date };
          tickers.forEach(ticker => {
            point[ticker] = equalWeight;
          });
          return point;
        });
      }
    };

    if (weightsMap[selectedKey]) {
      const weights = weightsMap[selectedKey]();
      // Sample allocation weights data for better performance
      return sampleChartData(weights || [], 1000);
    }

    return [];
  }, [selectedStrategies, normalizedData, portfolioData, sortedDates, sampleChartData]);

  // Memoized selected strategy title
  const selectedStrategyTitle = useMemo(() => {
    const selectedKeys = Object.keys(selectedStrategies).filter(key => selectedStrategies[key]);
    if (selectedKeys.length === 1) {
      const selectedStrategy = Object.values(strategies).flat().find(s => s.key === selectedKeys[0]);
      return selectedStrategy ? selectedStrategy.title : '';
    }
    return '';
  }, [selectedStrategies, strategies]);

  // Handler functions for checkbox changes
  const handleStrategyToggle = async (strategyKey) => {
    const isCurrentlySelected = selectedStrategies[strategyKey];

    setSelectedStrategies(prev => ({
      ...prev,
      [strategyKey]: !prev[strategyKey]
    }));

    // If strategy is being selected and not yet calculated, calculate it
    if (!isCurrentlySelected && !calculatedStrategies.has(strategyKey)) {
      await calculateStrategy(strategyKey);
    }
  };

  const handleETFToggle = () => {
    setShowIndividualETFs(prev => !prev);
  };

  const toggleDropdown = (categoryKey) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  // Memoized ETF descriptions
  const descriptions = useMemo(() => getETFDescriptions(), []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (loading) {
    return <div className="loading">Loading 20-year ETF data...</div>;
  }

  return (
    <div className="container">
      <div className="strategy-controls-compact">
        <h1>ETF Portfolio Analysis</h1>

        {/* Compact Strategy Selection */}
        <div className="strategy-selection-compact">
          <div className="strategy-header">
            <h3>📊 Strategy Selection</h3>
            <div className="selected-count">
              {Object.values(selectedStrategies).filter(Boolean).length + (showIndividualETFs ? 1 : 0)} selected
            </div>
          </div>

          {/* Individual ETFs - Always Visible */}
          <div className="strategy-category-compact">
            <label className="strategy-checkbox-compact">
              <input
                type="checkbox"
                checked={showIndividualETFs}
                onChange={handleETFToggle}
              />
              <span className="checkmark-compact"></span>
              <strong>Individual ETFs</strong>
              <span className="strategy-description-inline">Show individual ETF performance lines</span>
            </label>
          </div>

          {/* Basic Portfolios */}
          <div className="strategy-category-compact">
            <div className="category-header-compact" onClick={() => toggleDropdown('basicPortfolios')}>
              <span className={`dropdown-arrow ${openDropdowns.basicPortfolios ? 'open' : ''}`}>▶</span>
              <strong>Basic Portfolios</strong>
              <span className="category-count">
                ({strategies.basicPortfolios.filter(s => selectedStrategies[s.key]).length}/{strategies.basicPortfolios.length})
              </span>
            </div>
            {openDropdowns.basicPortfolios && (
              <div className="strategy-options-compact">
                {strategies.basicPortfolios.map(strategy => (
                  <label key={strategy.key} className="strategy-checkbox-compact">
                    <input
                      type="checkbox"
                      checked={selectedStrategies[strategy.key] || false}
                      onChange={() => handleStrategyToggle(strategy.key)}
                      disabled={calculatingStrategies.has(strategy.key)}
                    />
                    <span className="checkmark-compact"></span>
                    {strategy.title}
                    {calculatingStrategies.has(strategy.key) && (
                      <span className="calculating-indicator-compact">calculating...</span>
                    )}
                    <div className="strategy-description-compact">{strategy.description}</div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Risk Parity Strategies */}
          <div className="strategy-category-compact">
            <div className="category-header-compact" onClick={() => toggleDropdown('riskParity')}>
              <span className={`dropdown-arrow ${openDropdowns.riskParity ? 'open' : ''}`}>▶</span>
              <strong>Risk Parity Strategies</strong>
              <span className="category-count">
                ({strategies.riskParity.filter(s => selectedStrategies[s.key]).length}/{strategies.riskParity.length})
              </span>
            </div>
            {openDropdowns.riskParity && (
              <div className="strategy-options-compact">
                {strategies.riskParity.map(strategy => (
                  <label key={strategy.key} className="strategy-checkbox-compact">
                    <input
                      type="checkbox"
                      checked={selectedStrategies[strategy.key] || false}
                      onChange={() => handleStrategyToggle(strategy.key)}
                      disabled={calculatingStrategies.has(strategy.key)}
                    />
                    <span className="checkmark-compact"></span>
                    {strategy.title}
                    {calculatingStrategies.has(strategy.key) && (
                      <span className="calculating-indicator-compact">calculating...</span>
                    )}
                    <div className="strategy-description-compact">{strategy.description}</div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Advanced Optimization */}
          <div className="strategy-category-compact">
            <div className="category-header-compact" onClick={() => toggleDropdown('advancedOptimization')}>
              <span className={`dropdown-arrow ${openDropdowns.advancedOptimization ? 'open' : ''}`}>▶</span>
              <strong>Advanced Optimization</strong>
              <span className="category-count">
                ({strategies.advancedOptimization.filter(s => selectedStrategies[s.key]).length}/{strategies.advancedOptimization.length})
              </span>
            </div>
            {openDropdowns.advancedOptimization && (
              <div className="strategy-options-compact">
                {strategies.advancedOptimization.map(strategy => (
                  <label key={strategy.key} className="strategy-checkbox-compact">
                    <input
                      type="checkbox"
                      checked={selectedStrategies[strategy.key] || false}
                      onChange={() => handleStrategyToggle(strategy.key)}
                      disabled={calculatingStrategies.has(strategy.key)}
                    />
                    <span className="checkmark-compact"></span>
                    {strategy.title}
                    {calculatingStrategies.has(strategy.key) && (
                      <span className="calculating-indicator-compact">calculating...</span>
                    )}
                    <div className="strategy-description-compact">{strategy.description}</div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Leveraged Strategies */}
          <div className="strategy-category-compact">
            <div className="category-header-compact" onClick={() => toggleDropdown('leveragedStrategies')}>
              <span className={`dropdown-arrow ${openDropdowns.leveragedStrategies ? 'open' : ''}`}>▶</span>
              <strong>Leveraged Strategies</strong>
              <span className="category-count">
                ({strategies.leveragedStrategies.filter(s => selectedStrategies[s.key]).length}/{strategies.leveragedStrategies.length})
              </span>
            </div>
            {openDropdowns.leveragedStrategies && (
              <div className="strategy-options-compact">
                {strategies.leveragedStrategies.map(strategy => (
                  <label key={strategy.key} className="strategy-checkbox-compact">
                    <input
                      type="checkbox"
                      checked={selectedStrategies[strategy.key] || false}
                      onChange={() => handleStrategyToggle(strategy.key)}
                      disabled={calculatingStrategies.has(strategy.key)}
                    />
                    <span className="checkmark-compact"></span>
                    {strategy.title}
                    {calculatingStrategies.has(strategy.key) && (
                      <span className="calculating-indicator-compact">calculating...</span>
                    )}
                    <div className="strategy-description-compact">{strategy.description}</div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Compact Quick Start */}
        <div className="quick-start-compact">
          <strong>⚡ Quick Start:</strong>
          <button
            className="quick-start-btn-compact"
            onClick={() => handleStrategyToggle('equalWeight')}
            disabled={calculatingStrategies.has('equalWeight')}
          >
            📊 Equal Weight
          </button>
          <button
            className="quick-start-btn-compact"
            onClick={() => handleStrategyToggle('simpleRiskParity')}
            disabled={calculatingStrategies.has('simpleRiskParity')}
          >
            ⚖️ Risk Parity
          </button>
          <button
            className="quick-start-btn-compact"
            onClick={async () => {
              setShowIndividualETFs(true);
              await handleStrategyToggle('equalWeight');
              await handleStrategyToggle('simpleRiskParity');
            }}
            disabled={calculatingStrategies.has('equalWeight') || calculatingStrategies.has('simpleRiskParity')}
          >
            🚀 Compare
          </button>
        </div>
      </div>

      <div className="chart-container">
        <h2 className="chart-title">Portfolio Performance Comparison</h2>
        <p className="chart-description">Select strategies to compare their performance over 20 years (normalized to base 100)</p>
        <div className="performance-status">
          {memoizedChartData.length > 1500 ? (
            <span className="status-badge positive">📈 Chart Optimized ({memoizedChartData.length}/{sortedDates.length} points)</span>
          ) : sortedDates.length > 0 && (
            <span className="status-badge neutral">📊 Full Dataset ({sortedDates.length} points)</span>
          )}
          <span className="status-badge positive">🚀 Lazy Loading</span>
          <span className="status-badge positive">🧠 Smart Caching</span>
          {portfolioWorkerService?.isAvailable?.() ? (
            <span className="status-badge positive">⚡ Background Processing</span>
          ) : (
            <span className="status-badge neutral">🔧 Main Thread</span>
          )}
        </div>

        <ResponsiveContainer width="100%" height={500}>
          <LineChart data={memoizedChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[50, 'dataMax + 50']}
              label={{ value: 'Normalized Price (Base 100)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              labelFormatter={formatDate}
              formatter={(value, name) => [value.toFixed(2), name]}
            />
            <Legend />

            {/* Individual ETF lines */}
            {showIndividualETFs && Object.keys(descriptions).map((ticker, index) => (
              <Line
                key={ticker}
                type="monotone"
                dataKey={ticker}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={1.5}
                dot={false}
                name={`${ticker} - ${descriptions[ticker]}`}
              />
            ))}

            {/* Portfolio lines based on selected strategies */}
            {Object.values(strategies).flat().map(strategy => {
              if (selectedStrategies[strategy.key]) {
                return (
                  <Line
                    key={strategy.key}
                    type="monotone"
                    dataKey={strategy.chartKey}
                    stroke={strategy.color}
                    strokeWidth={4}
                    strokeDasharray={strategy.strokeDasharray || "0"}
                    dot={false}
                    name={strategy.chartName}
                  />
                );
              }
              return null;
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Allocation weights chart - only show when exactly one strategy is selected */}
      {memoizedAllocationWeights.length > 0 && (
        <div className="chart-container allocation-chart">
          <h3>Portfolio Allocation Weights Over Time
            {selectedStrategyTitle && ` - ${selectedStrategyTitle}`}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={memoizedAllocationWeights}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={formatPercentage}
              />
              <Tooltip
                labelFormatter={formatDate}
                formatter={(value, name) => [formatPercentage(value), `${name} - ${descriptions[name]}`]}
              />
              <Legend />

              {Object.keys(descriptions).map((ticker, index) => (
                <Area
                  key={ticker}
                  type="monotone"
                  dataKey={ticker}
                  stackId="1"
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.8}
                  name={ticker}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Performance Metrics Table */}
      <PerformanceMetrics
        metrics={performanceMetrics}
        selectedStrategies={selectedStrategies}
        showIndividualETFs={showIndividualETFs}
      />
    </div>
  );
};

// Add component styles
const styles = `
  .strategy-controls {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
  }

  .strategy-controls h1 {
    margin: 0 0 1.5rem 0;
    color: #2c3e50;
    font-size: 1.8rem;
    font-weight: 600;
  }

  .strategy-group {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: white;
    border-radius: 6px;
    border: 1px solid #e9ecef;
  }

  .strategy-group h3 {
    margin: 0 0 1rem 0;
    color: #34495e;
    font-size: 1.2rem;
    font-weight: 600;
    border-bottom: 2px solid #3498db;
    padding-bottom: 0.5rem;
  }

  .strategy-checkbox {
    display: block;
    position: relative;
    padding: 0.75rem 0.75rem 0.75rem 2.5rem;
    margin-bottom: 0.5rem;
    cursor: pointer;
    background: #fafafa;
    border-radius: 4px;
    border: 1px solid #e9ecef;
    transition: all 0.2s ease;
  }

  .strategy-checkbox:hover {
    background: #f0f8ff;
    border-color: #3498db;
  }

  .strategy-checkbox input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }

  .checkmark {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    height: 1.2rem;
    width: 1.2rem;
    background-color: #fff;
    border: 2px solid #ddd;
    border-radius: 3px;
    transition: all 0.2s ease;
  }

  .strategy-checkbox input:checked ~ .checkmark {
    background-color: #3498db;
    border-color: #3498db;
  }

  .checkmark:after {
    content: "";
    position: absolute;
    display: none;
    left: 3px;
    top: 0px;
    width: 4px;
    height: 8px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  .strategy-checkbox input:checked ~ .checkmark:after {
    display: block;
  }

  .strategy-description {
    font-size: 0.85rem;
    color: #6c757d;
    margin-top: 0.25rem;
    line-height: 1.3;
  }

  .calculating-indicator {
    font-size: 0.8rem;
    color: #007bff;
    font-style: italic;
  }

  .strategy-checkbox input:disabled ~ .checkmark {
    background-color: #f8f9fa;
    border-color: #dee2e6;
    opacity: 0.6;
  }

  .strategy-checkbox:has(input:disabled) {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .chart-title {
    margin: 0 0 0.5rem 0;
    color: #2c3e50;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .chart-description {
    margin: 0 0 1rem 0;
    color: #6c757d;
    font-size: 0.95rem;
  }

  .performance-status {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0 0 1rem 0;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
    border: 1px solid;
  }

  .status-badge.positive {
    background: #e8f5e8;
    color: #2e7d32;
    border-color: #a5d6a7;
  }

  .status-badge.neutral {
    background: #f3f4f6;
    color: #6b7280;
    border-color: #d1d5db;
  }


  .quick-start-section {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%);
    border-radius: 8px;
    border: 1px solid #e3f2fd;
  }

  .quick-start-section h3 {
    margin: 0 0 0.5rem 0;
    color: #1976d2;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .quick-start-section p {
    margin: 0 0 1rem 0;
    color: #555;
    font-size: 0.9rem;
  }

  .quick-start-buttons {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .quick-start-btn {
    padding: 0.5rem 1rem;
    background: #2196f3;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .quick-start-btn:hover:not(:disabled) {
    background: #1976d2;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
  }

  .quick-start-btn:disabled {
    background: #bdbdbd;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 768px) {
    .quick-start-buttons {
      flex-direction: column;
    }

    .quick-start-btn {
      justify-content: center;
    }
  }

  @media (max-width: 768px) {
    .strategy-controls {
      padding: 1rem;
    }

    .strategy-group {
      padding: 0.75rem;
    }

    .strategy-checkbox {
      padding: 0.5rem 0.5rem 0.5rem 2rem;
    }

    .checkmark {
      left: 0.5rem;
      height: 1rem;
      width: 1rem;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default StepByStepAnalysis;