// Performance metrics calculations based on the Python analysis

export const calculateComprehensiveMetrics = (priceData, name = "Asset") => {
  if (!priceData || priceData.length < 2) {
    return null;
  }

  // Sort data by date to ensure chronological order
  const sortedData = [...priceData].sort((a, b) => new Date(a.date) - new Date(b.date));
  const prices = sortedData.map(d => d.price || d.value);

  if (prices.length < 2) {
    return null;
  }

  // Calculate returns
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i-1] > 0) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
  }

  if (returns.length === 0) {
    return null;
  }

  // Performance metrics
  const startVal = prices[0];
  const endVal = prices[prices.length - 1];
  const totalReturn = ((endVal - startVal) / startVal) * 100;

  // Annualized metrics
  const years = prices.length / 252; // Assuming 252 trading days per year
  const annualizedReturn = years > 0 ? (Math.pow(endVal / startVal, 1/years) - 1) * 100 : 0;

  // Risk metrics
  const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance * 252) * 100; // Annualized volatility in %

  // Sharpe ratio (assuming risk-free rate of 2%)
  const riskFreeRate = 0.02;
  const sharpeRatio = volatility > 0 ? ((annualizedReturn/100 - riskFreeRate) / (volatility/100)) : 0;

  // Maximum drawdown
  let runningMax = startVal;
  let maxDrawdown = 0;

  for (let i = 0; i < prices.length; i++) {
    if (prices[i] > runningMax) {
      runningMax = prices[i];
    }
    const drawdown = (prices[i] - runningMax) / runningMax;
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  maxDrawdown = maxDrawdown * 100;

  return {
    name,
    totalReturn,
    annualizedReturn,
    volatility,
    sharpeRatio,
    maxDrawdown,
    startValue: startVal,
    endValue: endVal,
    dataPoints: prices.length
  };
};

export const calculateAllMetrics = (normalizedData, portfolioData, descriptions) => {
  const allMetrics = [];

  // Individual ETFs
  if (normalizedData) {
    Object.keys(normalizedData).forEach(ticker => {
      const priceData = normalizedData[ticker];
      const desc = descriptions[ticker] || ticker;
      const metrics = calculateComprehensiveMetrics(priceData, `${ticker} - ${desc}`);
      if (metrics) {
        allMetrics.push(metrics);
      }
    });
  }

  // Portfolio strategies
  if (portfolioData.equalWeight) {
    const metrics = calculateComprehensiveMetrics(portfolioData.equalWeight, "Equal Weight Portfolio");
    if (metrics) {
      allMetrics.push(metrics);
    }
  }

  if (portfolioData.leveraged) {
    const metrics = calculateComprehensiveMetrics(portfolioData.leveraged, "Equal Weight Portfolio (2x Leveraged)");
    if (metrics) {
      allMetrics.push(metrics);
    }
  }

  if (portfolioData.simpleRiskParity) {
    const metrics = calculateComprehensiveMetrics(portfolioData.simpleRiskParity, "Simple Risk Parity Portfolio");
    if (metrics) {
      allMetrics.push(metrics);
    }
  }

  if (portfolioData.enhancedRiskParity) {
    const metrics = calculateComprehensiveMetrics(portfolioData.enhancedRiskParity, "Enhanced Risk Parity Portfolio");
    if (metrics) {
      allMetrics.push(metrics);
    }
  }

  if (portfolioData.optimizedRiskBudgeting) {
    const metrics = calculateComprehensiveMetrics(portfolioData.optimizedRiskBudgeting, "Optimized Risk Budgeting Portfolio");
    if (metrics) {
      allMetrics.push(metrics);
    }
  }

  if (portfolioData.hierarchicalRiskParity) {
    const metrics = calculateComprehensiveMetrics(portfolioData.hierarchicalRiskParity, "Hierarchical Risk Parity Portfolio");
    if (metrics) {
      allMetrics.push(metrics);
    }
  }

  if (portfolioData.enhancedRiskParityDCC) {
    const metrics = calculateComprehensiveMetrics(portfolioData.enhancedRiskParityDCC, "Enhanced Risk Parity Portfolio (DCC)");
    if (metrics) {
      allMetrics.push(metrics);
    }
  }

  if (portfolioData.regimeAwareRiskParity) {
    const metrics = calculateComprehensiveMetrics(portfolioData.regimeAwareRiskParity, "Regime-Aware Risk Parity Portfolio");
    if (metrics) {
      allMetrics.push(metrics);
    }
  }

  if (portfolioData.leveragedEnhancedRiskParity) {
    const metrics = calculateComprehensiveMetrics(portfolioData.leveragedEnhancedRiskParity, "Enhanced Risk Parity Portfolio (2x Leveraged)");
    if (metrics) {
      allMetrics.push(metrics);
    }
  }

  return allMetrics;
};

export const formatMetrics = (metrics) => {
  if (!metrics) return {};

  return {
    ...metrics,
    totalReturn: `${metrics.totalReturn.toFixed(2)}%`,
    annualizedReturn: `${metrics.annualizedReturn.toFixed(2)}%`,
    volatility: `${metrics.volatility.toFixed(2)}%`,
    sharpeRatio: metrics.sharpeRatio.toFixed(2),
    maxDrawdown: `${metrics.maxDrawdown.toFixed(2)}%`,
    startValue: metrics.startValue.toFixed(2),
    endValue: metrics.endValue.toFixed(2)
  };
};