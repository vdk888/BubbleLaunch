/**
 * Portfolio Simulator - Interactive Chart & Metrics
 * Fetches real ETF data and calculates portfolio strategies
 *
 * ADDING NEW STRATEGIES:
 * 1. Add strategy config to STRATEGY_CONFIG below (set isBest: true for the optimal one)
 * 2. Ensure backend API returns data with matching dataKey (e.g., 'newStrategyName')
 * 3. Add corresponding pill button in portfolio-simulator.html with data-strategy attribute
 * 4. Add tooltip text in HTML to explain the new strategy
 * 5. Update metrics calculation if needed (updateMetrics function)
 */

(function () {
  'use strict';

  let portfolioChart = null;
  let currentStrategy = 'equalWeight';
  let currentPeriod = 20;
  let portfolioData = null;

  function getCurrentLanguage() {
    return document.documentElement.lang || localStorage.getItem('preferredLanguage') || 'fr';
  }

  function trackSimulatorEvent(action, params = {}) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', action, {
      event_category: 'Portfolio Simulator',
      language: getCurrentLanguage(),
      strategy: currentStrategy,
      period_years: currentPeriod,
      ...params,
    });
  }

  function updateSimulatorState(data) {
    window.bubbleSimulatorState = {
      strategy: currentStrategy,
      period: currentPeriod,
      generatedAt: data.generatedAt || null,
      tickers: data.tickers || [],
      metrics: data.metrics || {},
    };
  }

  // Strategy Configuration - Easily extensible for future additions
  // To add a new strategy: add entry here + ensure backend provides the data
  const STRATEGY_CONFIG = {
    equalWeight: {
      labelKey: 'simulator.strategy.equalWeight',
      dataKey: 'equalWeight',
      color: '#6B7280',
      borderWidth: 2,
      borderDash: [5, 5],
      order: 3,
      isBest: false,
    },
    simpleRiskParity: {
      labelKey: 'simulator.strategy.simpleRiskParity',
      dataKey: 'simpleRP',
      color: '#333333',
      borderWidth: 2.5,
      borderDash: [],
      order: 2,
      isBest: false,
    },
    optimizedRiskParity: {
      labelKey: 'simulator.strategy.optimizedRiskParity',
      dataKey: 'optimizedRP',
      color: '#667eea', // Brand violet for best strategy
      borderWidth: 3,
      borderDash: [],
      order: 1,
      isBest: true, // Marks this as the highlighted "best" strategy
    },
  };

  /**
   * Get translated label for strategy
   */
  function getStrategyLabel(labelKey) {
    const lang = localStorage.getItem('preferredLanguage') || 'fr';

    // Ensure translations object exists
    if (!window.translations) {
      console.warn('Translations not loaded yet, using fallback');
      // Fallback labels
      const fallbacks = {
        'simulator.strategy.equalWeight': lang === 'en' ? 'Equal Allocation' : 'Allocation Égale',
        'simulator.strategy.simpleRiskParity': 'Risk Parity',
        'simulator.strategy.optimizedRiskParity': lang === 'en' ? '✨ Optimized' : '✨ Optimisé',
      };
      return fallbacks[labelKey] || labelKey;
    }

    return window.translations[labelKey]
      ? window.translations[labelKey][lang]
      : labelKey;
  }

  /**
   * Get translated ETF labels
   */
  function getETFLabels() {
    const lang = localStorage.getItem('preferredLanguage') || 'fr';
    const t = window.translations || {};

    return {
      spy: t['simulator.etf.spy'] ? t['simulator.etf.spy'][lang] : (lang === 'en' ? 'SPY (S&P 500)' : 'SPY (S&P 500)'),
      ief: t['simulator.etf.ief'] ? t['simulator.etf.ief'][lang] : (lang === 'en' ? 'IEF (Bonds)' : 'IEF (Obligations)'),
      gld: t['simulator.etf.gld'] ? t['simulator.etf.gld'][lang] : (lang === 'en' ? 'GLD (Gold)' : 'GLD (Or)'),
      yAxisTitle: t['simulator.chart.yAxisTitle'] ? t['simulator.chart.yAxisTitle'][lang] : (lang === 'en' ? 'Value (Base 100)' : 'Valeur (Base 100)'),
    };
  }

  /**
   * Convert hex color to rgba with opacity
   */
  function hexToRgba(hex, opacity) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  /**
   * Fetch portfolio data from API
   */
  async function fetchPortfolioData(period) {
    try {
      const query = period ? `?period=${encodeURIComponent(period)}` : '';
      const response = await fetch(`/api/portfolio/preview-data${query}`);
      const result = await response.json();

      if (result.success && result.data) {
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
    const lang = localStorage.getItem('preferredLanguage') || 'fr';
    const locale = lang === 'en' ? 'en-US' : 'fr-FR';
    const labels = data.data.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString(locale, { year: 'numeric', month: 'short' });
    });

    const datasets = [];
    const etfLabels = getETFLabels();

    // Always show the 3 ETFs (background - more visible)
    datasets.push(
      {
        label: etfLabels.spy,
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
        label: etfLabels.ief,
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
        label: etfLabels.gld,
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

    // Always show all portfolio strategies using STRATEGY_CONFIG
    // This makes it easy to add/modify strategies in the future
    Object.entries(STRATEGY_CONFIG).forEach(([strategyKey, config]) => {
      const isActive = strategy === strategyKey;

      // Make selected portfolio very prominent, others faded but visible
      const opacity = isActive ? 1.0 : 0.3;
      const borderWidthMultiplier = isActive ? 1.5 : 0.7;

      datasets.push({
        label: getStrategyLabel(config.labelKey),
        data: data.data.map(d => d[config.dataKey] || d.equalWeight), // Fallback to equalWeight
        borderColor: isActive ? config.color : hexToRgba(config.color, opacity),
        backgroundColor: hexToRgba(config.color, isActive ? 0.15 : 0.05),
        borderWidth: config.borderWidth * borderWidthMultiplier,
        borderDash: config.borderDash,
        pointRadius: 0,
        tension: 0.4,
        order: isActive ? 0 : config.order, // Active always on top
      });
    });

    return { labels, datasets };
  }

  function formatPercentage(value, { withPlus = false } = {}) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return '—';
    }
    const sign = value > 0 ? '+' : '';
    const formatted = value.toFixed(1);
    return withPlus && value > 0 ? `${sign}${formatted}%` : `${formatted}%`;
  }

  /**
   * Detect if device is mobile
   */
  function isMobile() {
    return window.innerWidth <= 768;
  }

  /**
   * Get responsive chart options based on screen size
   */
  function getResponsiveChartOptions() {
    const mobile = isMobile();
    return {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: mobile ? 1.2 : 2.5,
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
            boxWidth: mobile ? 10 : 12,
            padding: mobile ? 8 : 15,
            font: { size: mobile ? 9 : 11, family: 'Inter, sans-serif' },
            color: '#374151',
            usePointStyle: true,
          },
        },
        tooltip: {
          enabled: !mobile,
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
            maxTicksLimit: mobile ? 6 : 12,
            font: { size: mobile ? 8 : 10, family: 'Inter, sans-serif' },
            color: '#6B7280',
            maxRotation: mobile ? 45 : 0,
            minRotation: mobile ? 45 : 0,
          },
        },
        y: {
          beginAtZero: false,
          grid: { color: 'rgba(0, 0, 0, 0.05)' },
          ticks: {
            maxTicksLimit: mobile ? 6 : 8,
            callback: function (value) {
              return value.toFixed(0);
            },
            font: { size: mobile ? 8 : 10, family: 'Inter, sans-serif' },
            color: '#6B7280',
          },
          title: {
            display: !mobile,
            text: getETFLabels().yAxisTitle,
            font: { size: 11, family: 'Inter, sans-serif', weight: '500' },
            color: '#374151',
          },
        },
      },
    };
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
      portfolioChart.options = getResponsiveChartOptions();
      portfolioChart.update('default');
    } else {
      // Create new chart
      portfolioChart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: getResponsiveChartOptions(),
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
    document.getElementById('totalReturn').textContent = formatPercentage(metrics.totalReturn, { withPlus: true });

    // Annualized Return
    document.getElementById('annualReturn').textContent = formatPercentage(metrics.annualReturn);

    // Volatility
    document.getElementById('volatility').textContent = formatPercentage(metrics.volatility);

    // Sharpe Ratio
    document.getElementById('sharpeRatio').textContent =
      typeof metrics.sharpeRatio === 'number' ? metrics.sharpeRatio.toFixed(2) : '—';

    // Max Drawdown (already negative percentage)
    document.getElementById('maxDrawdown').textContent = formatPercentage(metrics.maxDrawdown);

    // Calmar Ratio (annualized return / |max drawdown|)
    let calmarRatio = '—';
    if (typeof metrics.annualReturn === 'number' && typeof metrics.maxDrawdown === 'number' && metrics.maxDrawdown !== 0) {
      calmarRatio = Math.abs(metrics.annualReturn / metrics.maxDrawdown).toFixed(2);
    }
    document.getElementById('calmarRatio').textContent = calmarRatio;
  }

  /**
   * Load and display portfolio data
   */
  async function loadPortfolioData(strategy, period) {
    try {
      const result = await fetchPortfolioData(period);

      if (result) {
        portfolioData = result;
        currentPeriod = result.periodYears || period || currentPeriod;

        updateChart(result, strategy);
        updateMetrics(result, strategy);
        updateSimulatorState(result);

        trackSimulatorEvent('simulator_data_loaded', {
          data_points: Array.isArray(result.data) ? result.data.length : 0,
          period_years: currentPeriod,
          generated_at: result.generatedAt || null,
        });
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
      updateSimulatorState(portfolioData);
    }

    // Analytics tracking (if available)
    trackSimulatorEvent('strategy_changed', { strategy });
  }

  /**
   * Handle period change
   */
  function handlePeriodChange(period) {
    currentPeriod = period;

    trackSimulatorEvent('period_selected', { period_years: period });
    loadPortfolioData(currentStrategy, period);

    // Analytics tracking (if available)
    trackSimulatorEvent('period_changed', { period_years: period });
  }

  /**
   * Initialize simulator
   */
  function initializeSimulator() {
    // Load initial data
    loadPortfolioData(currentStrategy, currentPeriod);

    trackSimulatorEvent('simulator_page_initialized');

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

  // Listen for language changes and update chart
  window.addEventListener('languageChanged', () => {
    if (portfolioData && portfolioChart) {
      updateChart(portfolioData, currentStrategy);
    }
  });

  // Listen for window resize to update chart responsively
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (portfolioData && portfolioChart) {
        portfolioChart.options = getResponsiveChartOptions();
        portfolioChart.update('none'); // Update without animation
      }
    }, 250);
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (portfolioChart) {
      portfolioChart.destroy();
    }
  });
})();
