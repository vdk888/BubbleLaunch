/**
 * Portfolio Simulator - Interactive Chart & Metrics
 * Fetches real ETF data and calculates portfolio strategies
 */

(function () {
  'use strict';

  let portfolioChart = null;
  let currentStrategy = 'equalWeight';
  let currentPeriod = 10;
  let portfolioData = null;

  /**
   * Fetch portfolio data from API
   */
  async function fetchPortfolioData(strategy, years) {
    try {
      const response = await fetch('/api/portfolio/preview-data');
      const result = await response.json();

      if (result.success) {
        return result;
      } else {
        throw new Error('Failed to fetch portfolio data');
      }
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      return null;
    }
  }

  /**
   * Format chart data based on strategy
   */
  function formatChartData(data, strategy) {
    const labels = data.data.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });
    });

    const datasets = [];

    // Always show the 3 ETFs (background - more visible)
    datasets.push(
      {
        label: 'SPY (S&P 500)',
        data: data.data.map(d => d.SPY),
        borderColor: 'rgba(102, 126, 234, 0.4)', // More visible
        backgroundColor: 'rgba(102, 126, 234, 0.05)',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.4,
        borderDash: [3, 3], // Subtle dash for ETFs
        order: 6, // Behind all portfolios
      },
      {
        label: 'IEF (Obligations)',
        data: data.data.map(d => d.IEF),
        borderColor: 'rgba(107, 114, 128, 0.4)', // More visible
        backgroundColor: 'rgba(107, 114, 128, 0.05)',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.4,
        borderDash: [3, 3], // Subtle dash for ETFs
        order: 5, // Behind all portfolios
      },
      {
        label: 'GLD (Or)',
        data: data.data.map(d => d.GLD),
        borderColor: 'rgba(156, 163, 175, 0.4)', // More visible
        backgroundColor: 'rgba(156, 163, 175, 0.05)',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.4,
        borderDash: [3, 3], // Subtle dash for ETFs
        order: 4, // Behind all portfolios
      }
    );

    // Always show all 3 portfolio strategies with visual hierarchy
    // 1. Equal Weight (baseline - dashed line, medium prominence)
    const isEqualWeightActive = strategy === 'equalWeight';
    datasets.push({
      label: 'Allocation Égale',
      data: data.data.map(d => d.equalWeight),
      borderColor: '#6B7280', // Medium gray
      backgroundColor: 'rgba(107, 114, 128, 0.1)',
      borderWidth: isEqualWeightActive ? 3 : 2,
      borderDash: [5, 5],
      pointRadius: 0,
      tension: 0.4,
      order: 3, // Draw first (behind others)
    });

    // 2. Simple Risk Parity (better - solid line, more prominent)
    const isSimpleRPActive = strategy === 'simpleRiskParity';
    datasets.push({
      label: 'Risk Parity Simple',
      data: data.data.map(d => d.simpleRP || d.equalWeight), // Fallback if simpleRP not available
      borderColor: '#333333', // Dark gray
      backgroundColor: 'rgba(51, 51, 51, 0.1)',
      borderWidth: isSimpleRPActive ? 3.5 : 2.5,
      pointRadius: 0,
      tension: 0.4,
      order: 2, // Draw second
    });

    // 3. Optimized (best - highlighted with brand color, most prominent)
    const isOptimizedActive = strategy === 'optimizedRiskParity';
    datasets.push({
      label: '✨ Optimisé (Risk Parity)',
      data: data.data.map(d => d.optimizedRP),
      borderColor: '#667eea', // Brand violet - stands out
      backgroundColor: 'rgba(102, 126, 234, 0.15)',
      borderWidth: isOptimizedActive ? 4 : 3, // Thickest line
      pointRadius: 0,
      tension: 0.4,
      order: 1, // Draw last (on top)
    });

    return { labels, datasets };
  }

  /**
   * Create or update chart
   */
  function updateChart(data, strategy) {
    const ctx = document.getElementById('portfolioChart');
    if (!ctx) return;

    const chartData = formatChartData(data, strategy);

    if (portfolioChart) {
      // Update existing chart
      portfolioChart.data = chartData;
      portfolioChart.update('default');
    } else {
      // Create new chart
      portfolioChart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 2.5,
          animation: {
            duration: 750,
            easing: 'easeInOutQuart',
          },
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              labels: {
                boxWidth: 12,
                padding: 15,
                font: { size: 11, family: 'Inter, sans-serif' },
                color: '#374151',
                usePointStyle: true,
              },
            },
            tooltip: {
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              titleColor: '#1F2937',
              bodyColor: '#374151',
              borderColor: '#E5E7EB',
              borderWidth: 1,
              padding: 12,
              callbacks: {
                label: function (context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  label += context.parsed.y.toFixed(1);
                  return label;
                },
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                maxTicksLimit: 12,
                font: { size: 10, family: 'Inter, sans-serif' },
                color: '#6B7280',
              },
            },
            y: {
              beginAtZero: false,
              grid: { color: 'rgba(0, 0, 0, 0.05)' },
              ticks: {
                callback: function (value) {
                  return value.toFixed(0);
                },
                font: { size: 10, family: 'Inter, sans-serif' },
                color: '#6B7280',
              },
              title: {
                display: true,
                text: 'Valeur (Base 100)',
                font: { size: 11, family: 'Inter, sans-serif', weight: '500' },
                color: '#374151',
              },
            },
          },
        },
      });
    }
  }

  /**
   * Update performance metrics
   */
  function updateMetrics(data, strategy) {
    const strategyKey = {
      equalWeight: 'equalWeight',
      simpleRiskParity: 'simpleRP',
      optimizedRiskParity: 'optimizedRP',
    }[strategy];

    const metrics = data.metrics[strategyKey];
    if (!metrics) return;

    // Total Return
    document.getElementById('totalReturn').textContent = `+${metrics.totalReturn.toFixed(1)}%`;

    // Annualized Return (estimate from total return and time period)
    const years = (data.data.length - 1) / 12; // Assuming monthly data
    const annualizedReturn = (Math.pow(1 + metrics.totalReturn / 100, 1 / years) - 1) * 100;
    document.getElementById('annualReturn').textContent = `${annualizedReturn.toFixed(1)}%`;

    // Volatility (estimate from data variance)
    const returns = [];
    for (let i = 1; i < data.data.length; i++) {
      const prevValue = data.data[i - 1][strategyKey];
      const currValue = data.data[i][strategyKey];
      returns.push(((currValue - prevValue) / prevValue) * 100);
    }
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const monthlyVol = Math.sqrt(variance);
    const annualVol = monthlyVol * Math.sqrt(12);
    document.getElementById('volatility').textContent = `${annualVol.toFixed(1)}%`;

    // Sharpe Ratio
    document.getElementById('sharpeRatio').textContent = metrics.sharpeRatio.toFixed(2);

    // Max Drawdown (calculate from data)
    let maxDrawdown = 0;
    let peak = data.data[0][strategyKey];
    for (const point of data.data) {
      const value = point[strategyKey];
      if (value > peak) peak = value;
      const drawdown = ((value - peak) / peak) * 100;
      if (drawdown < maxDrawdown) maxDrawdown = drawdown;
    }
    document.getElementById('maxDrawdown').textContent = `${maxDrawdown.toFixed(1)}%`;

    // Calmar Ratio (annualized return / max drawdown)
    const calmarRatio = Math.abs(annualizedReturn / maxDrawdown);
    document.getElementById('calmarRatio').textContent = calmarRatio.toFixed(2);
  }

  /**
   * Load and display portfolio data
   */
  async function loadPortfolioData(strategy, period) {
    try {
      const data = await fetchPortfolioData(strategy, period);

      if (data) {
        portfolioData = data;
        updateChart(data, strategy);
        updateMetrics(data, strategy);
      } else {
        // Show error state
        console.error('Failed to load portfolio data');
      }
    } catch (error) {
      console.error('Error loading portfolio:', error);
    }
  }

  /**
   * Handle strategy change
   */
  function handleStrategyChange(strategy) {
    currentStrategy = strategy;

    if (portfolioData) {
      updateChart(portfolioData, strategy);
      updateMetrics(portfolioData, strategy);
    }
  }

  /**
   * Handle period change
   */
  function handlePeriodChange(period) {
    currentPeriod = period;
    // TODO: Filter data based on period
    // For now, just reload with full data
    if (portfolioData) {
      updateChart(portfolioData, currentStrategy);
      updateMetrics(portfolioData, currentStrategy);
    }
  }

  /**
   * Initialize simulator
   */
  function initializeSimulator() {
    // Load initial data
    loadPortfolioData(currentStrategy, currentPeriod);

    // Strategy pills interaction
    const pills = document.querySelectorAll('.strategy-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        const strategy = pill.getAttribute('data-strategy');
        console.log('🎯 Selected strategy:', strategy);
        handleStrategyChange(strategy);
      });
    });

    // Time period buttons interaction
    const periodBtns = document.querySelectorAll('.time-period-btn');
    periodBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        periodBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const period = parseInt(btn.getAttribute('data-period'));
        console.log('📅 Selected period:', period + ' years');
        handlePeriodChange(period);
      });
    });
  }

  /**
   * Initialize on DOM ready
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSimulator);
  } else {
    initializeSimulator();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (portfolioChart) {
      portfolioChart.destroy();
    }
  });
})();
