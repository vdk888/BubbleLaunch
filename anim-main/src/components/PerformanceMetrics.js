import React from 'react';

const PerformanceMetrics = ({ metrics, selectedStrategies, showIndividualETFs }) => {
  if (!metrics || metrics.length === 0) {
    return null;
  }

  // Filter metrics based on selected strategies
  const getVisibleMetrics = () => {
    const etfMetrics = metrics.filter(m => m.name.includes(' - '));
    const portfolioMetrics = metrics.filter(m => !m.name.includes(' - '));

    let visibleMetrics = [];

    // Add ETF metrics if individual ETFs are enabled
    if (showIndividualETFs) {
      visibleMetrics = [...etfMetrics];
    }

    // Map strategy keys to their metric names
    const strategyMetricMap = {
      equalWeight: "Equal Weight Portfolio",
      simpleRiskParity: "Simple Risk Parity Portfolio",
      enhancedRiskParity: "Enhanced Risk Parity Portfolio",
      optimizedRiskBudgeting: "Optimized Risk Budgeting Portfolio",
      hierarchicalRiskParity: "Hierarchical Risk Parity Portfolio",
      enhancedRiskParityDCC: "Enhanced Risk Parity Portfolio (DCC)",
      regimeAwareRiskParity: "Regime-Aware Risk Parity Portfolio",
      leveragedEnhancedRiskParity: "Enhanced Risk Parity Portfolio (2x Leveraged)",
      leveragedEqualWeight: "Equal Weight Portfolio (2x Leveraged)"
    };

    // Add portfolio metrics based on selected strategies
    Object.keys(selectedStrategies).forEach(strategyKey => {
      if (selectedStrategies[strategyKey] && strategyMetricMap[strategyKey]) {
        const metric = portfolioMetrics.find(m => m.name === strategyMetricMap[strategyKey]);
        if (metric) {
          visibleMetrics.push(metric);
        }
      }
    });

    return visibleMetrics;
  };

  const visibleMetrics = getVisibleMetrics();
  const etfCount = visibleMetrics.filter(m => m.name.includes(' - ')).length;
  const portfolioCount = visibleMetrics.length - etfCount;

  return (
    <div className="performance-metrics">
      <h3>Performance & Risk Analysis (20-Year)</h3>
      <div className="metrics-table-container">
        <table className="metrics-table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Total Return</th>
              <th>Ann. Return</th>
              <th>Volatility</th>
              <th>Sharpe</th>
              <th>Max Drawdown</th>
            </tr>
          </thead>
          <tbody>
            {/* Individual ETFs */}
            {visibleMetrics.slice(0, etfCount).map((metric, index) => (
              <tr key={`etf-${index}`} className="etf-row">
                <td className="asset-name">{metric.name}</td>
                <td className="metric-value">{metric.totalReturn.toFixed(2)}%</td>
                <td className="metric-value">{metric.annualizedReturn.toFixed(2)}%</td>
                <td className="metric-value">{metric.volatility.toFixed(2)}%</td>
                <td className="metric-value">{metric.sharpeRatio.toFixed(2)}</td>
                <td className="metric-value">{metric.maxDrawdown.toFixed(2)}%</td>
              </tr>
            ))}

            {/* Separator row if there are portfolios */}
            {portfolioCount > 0 && (
              <tr className="separator-row">
                <td colSpan="6"></td>
              </tr>
            )}

            {/* Portfolio strategies */}
            {visibleMetrics.slice(etfCount).map((metric, index) => (
              <tr key={`portfolio-${index}`} className="portfolio-row">
                <td className="asset-name portfolio-name">{metric.name}</td>
                <td className="metric-value portfolio-value">{metric.totalReturn.toFixed(2)}%</td>
                <td className="metric-value portfolio-value">{metric.annualizedReturn.toFixed(2)}%</td>
                <td className="metric-value portfolio-value">{metric.volatility.toFixed(2)}%</td>
                <td className="metric-value portfolio-value">{metric.sharpeRatio.toFixed(2)}</td>
                <td className="metric-value portfolio-value">{metric.maxDrawdown.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="metrics-legend">
        <p><strong>Legend:</strong> Ann. Return = Annualized Return, Sharpe = Sharpe Ratio (vs 2% risk-free), Max Drawdown = Maximum Drawdown</p>
        {portfolioCount > 0 && (selectedStrategies.leveragedEnhancedRiskParity || selectedStrategies.leveragedEqualWeight) && (
          <p><strong>Note:</strong> Leveraged portfolios include 2x leverage with 8% annual borrowing cost</p>
        )}
      </div>

      <style jsx>{`
        .performance-metrics {
          margin: 2rem 0;
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .performance-metrics h3 {
          margin: 0 0 1rem 0;
          color: #2c3e50;
          font-size: 1.4rem;
          font-weight: 600;
        }

        .metrics-table-container {
          overflow-x: auto;
          margin-bottom: 1rem;
        }

        .metrics-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .metrics-table th {
          background: #34495e;
          color: white;
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .metrics-table td {
          padding: 10px 8px;
          border-bottom: 1px solid #e9ecef;
          font-size: 0.9rem;
        }

        .asset-name {
          font-weight: 500;
          color: #2c3e50;
          max-width: 300px;
        }

        .metric-value {
          text-align: right;
          font-family: 'Courier New', monospace;
          font-weight: 500;
        }

        .etf-row:hover {
          background-color: #f8f9fa;
        }

        .portfolio-row {
          background-color: #fff3cd;
        }

        .portfolio-row:hover {
          background-color: #ffeaa7;
        }

        .portfolio-name {
          font-weight: 600;
          color: #856404;
        }

        .portfolio-value {
          font-weight: 600;
          color: #856404;
        }

        .separator-row {
          height: 8px;
          background: transparent;
        }

        .separator-row td {
          border: none;
          padding: 4px;
        }

        .metrics-legend {
          font-size: 0.85rem;
          color: #6c757d;
          line-height: 1.4;
        }

        .metrics-legend p {
          margin: 0.25rem 0;
        }

        @media (max-width: 768px) {
          .metrics-table {
            font-size: 0.8rem;
          }

          .metrics-table th,
          .metrics-table td {
            padding: 8px 4px;
          }

          .asset-name {
            max-width: 200px;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PerformanceMetrics;