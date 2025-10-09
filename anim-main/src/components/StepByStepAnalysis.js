import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchETFPriceData, normalizeToBase100, getETFDescriptions } from '../services/etfDataService';
import { calculateEqualWeightPortfolio, calculateLeveragedEqualWeightPortfolio, calculateSimpleRiskParity, calculateEnhancedRiskParity, calculateLeveragedEnhancedRiskParity, calculateOptimizedRiskBudgeting, calculateHierarchicalRiskParityPortfolio, calculateEnhancedRiskParityWithDCC, calculateRegimeAwareRiskParity } from '../services/portfolioCalculations';
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

      // Calculate all portfolio strategies
      const equalWeight = calculateEqualWeightPortfolio(normalized);
      const leveragedEqualWeight = calculateLeveragedEqualWeightPortfolio(normalized, 2.0, 0.08);

      // Risk parity strategies
      const simpleRPResult = calculateSimpleRiskParity(normalized, 21, 60);
      const enhancedRPResult = calculateEnhancedRiskParity(normalized, 21, 60);
      const optimizedRBResult = calculateOptimizedRiskBudgeting(normalized, 21, 120, 'gradient_descent');
      const hierarchicalRPResult = calculateHierarchicalRiskParityPortfolio(normalized, 21, 126, 3);
      const enhancedRPDCCResult = calculateEnhancedRiskParityWithDCC(normalized, 21, 60);
      const regimeAwareRPResult = calculateRegimeAwareRiskParity(normalized, 21, 60);
      const leveragedEnhancedRPResult = calculateLeveragedEnhancedRiskParity(normalized, 21, 60, 2.0, 0.08);

      const portfolios = {
        equalWeight,
        leveragedEqualWeight,
        simpleRiskParity: simpleRPResult.portfolioData,
        enhancedRiskParity: enhancedRPResult.portfolioData,
        optimizedRiskBudgeting: optimizedRBResult.portfolioData,
        hierarchicalRiskParity: hierarchicalRPResult.portfolioData,
        enhancedRiskParityDCC: enhancedRPDCCResult.portfolioData,
        regimeAwareRiskParity: regimeAwareRPResult.portfolioData,
        leveragedEnhancedRiskParity: leveragedEnhancedRPResult.portfolioData,
        leveraged: leveragedEqualWeight,
        // Store weights data for allocation charts
        simpleRiskParityWeights: simpleRPResult.weightsData,
        enhancedRiskParityWeights: enhancedRPResult.weightsData,
        optimizedRiskBudgetingWeights: optimizedRBResult.weightsData,
        hierarchicalRiskParityWeights: hierarchicalRPResult.weightsData,
        enhancedRiskParityDCCWeights: enhancedRPDCCResult.weightsData,
        regimeAwareRiskParityWeights: regimeAwareRPResult.weightsData,
        leveragedEnhancedRiskParityWeights: leveragedEnhancedRPResult.weightsData
      };

      setPortfolioData(portfolios);

      // Calculate performance metrics
      const descriptions = getETFDescriptions();
      const metrics = calculateAllMetrics(normalized, portfolios, descriptions);
      setPerformanceMetrics(metrics);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateChartForSelectedStrategies = useCallback(() => {
    if (!normalizedData || !portfolioData || Object.keys(selectedStrategies).length === 0) return;

    const tickers = Object.keys(normalizedData);

    // Get all unique dates and sort them
    const allDates = new Set();
    tickers.forEach(ticker => {
      normalizedData[ticker].forEach(point => allDates.add(point.date));
    });
    const sortedDates = Array.from(allDates).sort();

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

    setChartData(newChartData);
  }, [normalizedData, portfolioData, selectedStrategies, showIndividualETFs, strategies]);

  const generateAllocationWeightsForSelection = useCallback((dates) => {
    // Only show allocation weights if exactly one strategy is selected
    const selectedKeys = Object.keys(selectedStrategies).filter(key => selectedStrategies[key]);

    if (selectedKeys.length !== 1) {
      setAllocationWeights([]);
      return;
    }

    const selectedKey = selectedKeys[0];
    const tickers = Object.keys(normalizedData);

    // Map strategy keys to their corresponding weights data
    const weightsMap = {
      equalWeight: () => {
        // Equal weight: 1/n each
        const equalWeight = 1.0 / tickers.length;
        return dates.map(date => {
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
        return dates.map(date => {
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
      setAllocationWeights(weights || []);
    } else {
      setAllocationWeights([]);
    }
  }, [selectedStrategies, normalizedData, portfolioData]);

  // useEffect to update chart when data or selections change
  useEffect(() => {
    if (normalizedData && Object.keys(selectedStrategies).length > 0) {
      updateChartForSelectedStrategies();

      // Update allocation weights
      const tickers = Object.keys(normalizedData);
      const allDates = new Set();
      tickers.forEach(ticker => {
        normalizedData[ticker].forEach(point => allDates.add(point.date));
      });
      const sortedDates = Array.from(allDates).sort();
      generateAllocationWeightsForSelection(sortedDates);
    }
  }, [selectedStrategies, normalizedData, portfolioData, showIndividualETFs, updateChartForSelectedStrategies, generateAllocationWeightsForSelection]);

  // Handler functions for checkbox changes
  const handleStrategyToggle = (strategyKey) => {
    setSelectedStrategies(prev => ({
      ...prev,
      [strategyKey]: !prev[strategyKey]
    }));
  };

  const handleETFToggle = () => {
    setShowIndividualETFs(prev => !prev);
  };

  const getSelectedStrategyTitle = () => {
    const selectedKeys = Object.keys(selectedStrategies).filter(key => selectedStrategies[key]);
    if (selectedKeys.length === 1) {
      const selectedStrategy = Object.values(strategies).flat().find(s => s.key === selectedKeys[0]);
      return selectedStrategy ? selectedStrategy.title : '';
    }
    return '';
  };

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

  const descriptions = getETFDescriptions();

  return (
    <div className="container">
      <div className="strategy-controls">
        <h1>ETF Portfolio Analysis - Strategy Selection</h1>

        {/* Individual ETFs Toggle */}
        <div className="strategy-group">
          <h3>Individual ETFs</h3>
          <label className="strategy-checkbox">
            <input
              type="checkbox"
              checked={showIndividualETFs}
              onChange={handleETFToggle}
            />
            <span className="checkmark"></span>
            Show Individual ETF Lines
            <div className="strategy-description">Display individual ETF performance lines on the chart</div>
          </label>
        </div>

        {/* Basic Portfolios */}
        <div className="strategy-group">
          <h3>Basic Portfolios</h3>
          {strategies.basicPortfolios.map(strategy => (
            <label key={strategy.key} className="strategy-checkbox">
              <input
                type="checkbox"
                checked={selectedStrategies[strategy.key] || false}
                onChange={() => handleStrategyToggle(strategy.key)}
              />
              <span className="checkmark"></span>
              {strategy.title}
              <div className="strategy-description">{strategy.description}</div>
            </label>
          ))}
        </div>

        {/* Risk Parity Strategies */}
        <div className="strategy-group">
          <h3>Risk Parity Strategies</h3>
          {strategies.riskParity.map(strategy => (
            <label key={strategy.key} className="strategy-checkbox">
              <input
                type="checkbox"
                checked={selectedStrategies[strategy.key] || false}
                onChange={() => handleStrategyToggle(strategy.key)}
              />
              <span className="checkmark"></span>
              {strategy.title}
              <div className="strategy-description">{strategy.description}</div>
            </label>
          ))}
        </div>

        {/* Advanced Optimization */}
        <div className="strategy-group">
          <h3>Advanced Optimization</h3>
          {strategies.advancedOptimization.map(strategy => (
            <label key={strategy.key} className="strategy-checkbox">
              <input
                type="checkbox"
                checked={selectedStrategies[strategy.key] || false}
                onChange={() => handleStrategyToggle(strategy.key)}
              />
              <span className="checkmark"></span>
              {strategy.title}
              <div className="strategy-description">{strategy.description}</div>
            </label>
          ))}
        </div>

        {/* Leveraged Strategies */}
        <div className="strategy-group">
          <h3>Leveraged Strategies</h3>
          {strategies.leveragedStrategies.map(strategy => (
            <label key={strategy.key} className="strategy-checkbox">
              <input
                type="checkbox"
                checked={selectedStrategies[strategy.key] || false}
                onChange={() => handleStrategyToggle(strategy.key)}
              />
              <span className="checkmark"></span>
              {strategy.title}
              <div className="strategy-description">{strategy.description}</div>
            </label>
          ))}
        </div>
      </div>

      <div className="chart-container">
        <h2 className="chart-title">Portfolio Performance Comparison</h2>
        <p className="chart-description">Select strategies to compare their performance over 20 years (normalized to base 100)</p>

        <ResponsiveContainer width="100%" height={500}>
          <LineChart data={chartData}>
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
      {allocationWeights.length > 0 && (
        <div className="chart-container allocation-chart">
          <h3>Portfolio Allocation Weights Over Time
            {getSelectedStrategyTitle() && ` - ${getSelectedStrategyTitle()}`}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={allocationWeights}>
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