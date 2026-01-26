/**
 * Portfolio Preview Chart
 * Animated chart showing portfolio performance comparison
 * Integrates with Bubble's design system and animations
 */

(function () {
  'use strict';

  let chart = null;
  let chartData = null;
  let hasAnimated = false;

  const ETF_KEYS = ['SPY', 'IEF', 'GLD', 'EFA', 'EEM', 'VNQ', 'CASH'];
  const ETF_STYLES = {
    SPY: {
      borderColor: 'rgba(102, 126, 234, 0.4)',
      backgroundColor: 'rgba(102, 126, 234, 0.05)',
      borderWidth: 1.5,
      borderDash: [3, 3],
      order: 8,
    },
    IEF: {
      borderColor: 'rgba(107, 114, 128, 0.4)',
      backgroundColor: 'rgba(107, 114, 128, 0.05)',
      borderWidth: 1.5,
      borderDash: [3, 3],
      order: 7,
    },
    GLD: {
      borderColor: 'rgba(156, 163, 175, 0.4)',
      backgroundColor: 'rgba(156, 163, 175, 0.05)',
      borderWidth: 1.5,
      borderDash: [3, 3],
      order: 6,
    },
    EFA: {
      borderColor: 'rgba(129, 140, 248, 0.35)',
      backgroundColor: 'rgba(129, 140, 248, 0.05)',
      borderWidth: 1.3,
      borderDash: [4, 3],
      order: 5,
    },
    EEM: {
      borderColor: 'rgba(248, 113, 113, 0.35)',
      backgroundColor: 'rgba(248, 113, 113, 0.05)',
      borderWidth: 1.3,
      borderDash: [4, 4],
      order: 4,
    },
    VNQ: {
      borderColor: 'rgba(139, 92, 246, 0.4)',
      backgroundColor: 'rgba(139, 92, 246, 0.05)',
      borderWidth: 1.3,
      borderDash: [3, 4],
      order: 3.75,
    },
    CASH: {
      borderColor: 'rgba(34, 197, 94, 0.4)',
      backgroundColor: 'rgba(34, 197, 94, 0.08)',
      borderWidth: 1.2,
      borderDash: [2, 2],
      order: 3.5,
    },
  };

  const STRATEGY_CONFIG = {
    equalWeight: {
      labelKey: 'simulator.strategy.equalWeight',
      dataKey: 'equalWeight',
      color: '#6B7280',
      borderWidth: 2,
      borderDash: [5, 5],
      order: 3.5,
    },
    sixtyForty: {
      labelKey: 'simulator.strategy.sixtyForty',
      dataKey: 'sixtyForty',
      color: '#4B5563',
      borderWidth: 2.2,
      borderDash: [],
      order: 3,
    },
    momentumTilt: {
      labelKey: 'simulator.strategy.momentumTilt',
      dataKey: 'momentumTilt',
      color: '#14B8A6',
      borderWidth: 2.4,
      borderDash: [],
      order: 2.5,
    },
    hierarchicalRiskParity: {
      labelKey: 'simulator.strategy.hierarchicalRiskParity',
      dataKey: 'hierarchicalRiskParity',
      color: '#F59E0B',
      borderWidth: 2.4,
      borderDash: [4, 4],
      order: 2.2,
    },
    simpleRiskParity: {
      labelKey: 'simulator.strategy.simpleRiskParity',
      dataKey: 'simpleRP',
      color: '#333333',
      borderWidth: 2.5,
      borderDash: [],
      order: 2,
    },
    optimizedRiskBudgeting: {
      labelKey: 'simulator.strategy.optimizedRiskBudgeting',
      dataKey: 'optimizedRiskBudgeting',
      color: '#7C3AED',
      borderWidth: 3,
      borderDash: [],
      order: 0.8,
      isBest: true,
    },
    enhancedRiskParityDCC: {
      labelKey: 'simulator.strategy.enhancedRiskParityDCC',
      dataKey: 'enhancedRiskParityDCC',
      color: '#0EA5E9',
      borderWidth: 2.6,
      borderDash: [6, 3],
      order: 1.2,
    },
    optimizedRiskParity: {
      labelKey: 'simulator.strategy.optimizedRiskParity',
      dataKey: 'optimizedRP',
      color: '#6666ff',
      borderWidth: 3,
      borderDash: [],
      order: 0.5,
      isBest: true,
    },
  };
  const STRATEGY_ORDER = [
    'equalWeight',
    'sixtyForty',
    'momentumTilt',
    'hierarchicalRiskParity',
    'simpleRiskParity',
    'optimizedRiskBudgeting',
    'enhancedRiskParityDCC',
    'optimizedRiskParity',
  ];

  function getCurrentLanguage() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('bubbleLanguage');
      if (stored) {
        return stored;
      }
    }
    return document.documentElement.lang || 'fr';
  }

  function resolveTranslation(key, fallback) {
    const lang = getCurrentLanguage();
    const translations = window.translations?.[key];
    if (translations && translations[lang]) {
      return translations[lang];
    }
    return fallback;
  }

  function getETFLabels() {
    const lang = getCurrentLanguage();
    const fallback = (en, fr) => (lang === 'en' ? en : fr);
    return {
      SPY: resolveTranslation('simulator.etf.spy', fallback('SPY (S&P 500)', 'SPY (S&P 500)')),
      IEF: resolveTranslation('simulator.etf.ief', fallback('IEF (Bonds)', 'IEF (Obligations)')),
      GLD: resolveTranslation('simulator.etf.gld', fallback('GLD (Gold)', 'GLD (Or)')),
      EFA: resolveTranslation('simulator.etf.efa', fallback('EFA (Developed ex-US)', 'EFA (Marchés développés)')),
      EEM: resolveTranslation('simulator.etf.eem', fallback('EEM (Emerging Markets)', 'EEM (Marchés émergents)')),
      VNQ: resolveTranslation('simulator.etf.vnq', fallback('VNQ (US REITs)', 'VNQ (Immobilier US)')),
      CASH: resolveTranslation('simulator.etf.cash', fallback('Cash (2% yield)', 'Trésorerie (rendement 2 %)')),
      yAxisTitle: resolveTranslation('simulator.chart.yAxisTitle', fallback('Value (Base 100)', 'Valeur (Base 100)')),
    };
  }

  function getStrategyLabel(labelKey, fallback) {
    const lang = getCurrentLanguage();
    const translations = window.translations?.[labelKey];
    if (translations && translations[lang]) {
      return translations[lang];
    }
    const fallbacks = {
      'simulator.strategy.equalWeight': lang === 'en' ? 'Equal Allocation' : 'Allocation Égale',
      'simulator.strategy.sixtyForty': lang === 'en' ? '60/40 Balanced' : 'Portefeuille 60/40',
      'simulator.strategy.momentumTilt': lang === 'en' ? 'Momentum Tilt' : 'Momentum',
      'simulator.strategy.hierarchicalRiskParity': lang === 'en' ? 'Hierarchical RP' : 'Risk Parity Hiérarchique',
      'simulator.strategy.simpleRiskParity': lang === 'en' ? 'Risk Parity' : 'Risk Parity',
      'simulator.strategy.optimizedRiskBudgeting': lang === 'en' ? 'Optimized Risk Budgeting' : 'Répartition de Risque Optimisée',
      'simulator.strategy.enhancedRiskParityDCC': lang === 'en' ? 'Enhanced Risk Parity (DCC)' : 'Risk Parity DCC',
      'simulator.strategy.optimizedRiskParity': lang === 'en' ? '✨ Optimized' : '✨ Optimisé',
    };
    return fallbacks[labelKey] || fallback || labelKey;
  }

  function hexToRgba(hex, opacity) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  /**
   * Fetch portfolio preview data from API
   */
  async function fetchPreviewData() {
    try {
      const response = await fetch('/api/portfolio/preview-data');
      const result = await response.json();

      if (result.success) {
        return result;
      } else {
        throw new Error('Failed to fetch portfolio data');
      }
    } catch (error) {
      console.error('Error fetching portfolio preview:', error);
      return null;
    }
  }

  /**
   * Format data for Chart.js
   */
  function formatChartData(payload) {
    if (!payload || !Array.isArray(payload.data)) {
      return { labels: [], datasets: [] };
    }

    const lang = getCurrentLanguage();
    const locale = lang === 'en' ? 'en-US' : 'fr-FR';
    const rows = payload.data;
    const labels = rows.map((row) => {
      const date = new Date(row.date);
      return date.toLocaleDateString(locale, { year: 'numeric', month: 'short' });
    });

    const datasets = [];
    const etfLabels = getETFLabels();

    ETF_KEYS.forEach((key) => {
      if (!rows.some((row) => typeof row[key] === 'number')) {
        return;
      }
      const style = ETF_STYLES[key];
      datasets.push({
        label: etfLabels[key],
        data: rows.map((row) => row[key]),
        borderColor: style.borderColor,
        backgroundColor: style.backgroundColor,
        borderWidth: style.borderWidth,
        borderDash: style.borderDash,
        pointRadius: 0,
        tension: 0.4,
        order: style.order,
      });
    });

    // Display only equalWeight and optimizedRiskParity strategies on landing page
    const landingPageStrategies = ['equalWeight', 'optimizedRiskParity'];
    landingPageStrategies.forEach((key) => {
      const config = STRATEGY_CONFIG[key];
      if (!config) {
        return;
      }

      if (!rows.some((row) => typeof row[config.dataKey] === 'number')) {
        return;
      }

      const datasetColor = config.color;
      const backgroundOpacity = config.isBest ? 0.18 : 0.1;
      datasets.push({
        label: getStrategyLabel(config.labelKey, config.dataKey),
        data: rows.map((row) => row[config.dataKey]),
        borderColor: datasetColor,
        backgroundColor: hexToRgba(datasetColor, backgroundOpacity),
        borderWidth: config.borderWidth,
        borderDash: config.borderDash || [],
        pointRadius: 0,
        tension: 0.4,
        order: config.order || 1,
      });
    });

    return { labels, datasets };
  }

  /**
   * Create animated chart
   */
  function createChart(data) {
    const ctx = document.getElementById('portfolioPreviewChart');
    if (!ctx) return;

    const chartDatasets = formatChartData(data);
    const axisLabels = getETFLabels();

    const chartConfig = {
      type: 'line',
      data: chartDatasets,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 2000,
          easing: 'easeInOutQuart',
          onComplete: function() {
            // Update metrics after animation
            updateMetrics(data.metrics);
          }
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
              font: {
                size: 11,
                family: 'Inter, sans-serif',
              },
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
            displayColors: true,
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
            display: true,
            grid: {
              display: false,
            },
            ticks: {
              maxTicksLimit: 8,
              font: {
                size: 10,
                family: 'Inter, sans-serif',
              },
              color: '#6B7280',
            },
          },
          y: {
            display: true,
            beginAtZero: false,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              callback: function (value) {
                return value.toFixed(0);
              },
              font: {
                size: 10,
                family: 'Inter, sans-serif',
              },
              color: '#6B7280',
            },
            title: {
              display: true,
              text: axisLabels.yAxisTitle,
              font: {
                size: 11,
                family: 'Inter, sans-serif',
                weight: '500',
              },
              color: '#374151',
            },
          },
        },
      },
    };

    chart = new Chart(ctx, chartConfig);
  }

  /**
   * Update performance metrics with animation
   */
  function updateMetrics(metrics) {
    const equalWeightEl = document.getElementById('equalWeightReturn');
    const optimizedEl = document.getElementById('optimizedReturn');

    if (equalWeightEl && metrics.equalWeight) {
      animateNumber(equalWeightEl, 0, metrics.equalWeight.totalReturn, 1500, '%');
    }

    if (optimizedEl && metrics.optimizedRP) {
      animateNumber(optimizedEl, 0, metrics.optimizedRP.totalReturn, 1500, '%');
    }
  }

  /**
   * Animate number counter
   */
  function animateNumber(element, start, end, duration, suffix = '') {
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = start + (end - start) * easeOutQuart;

      element.textContent = `+${current.toFixed(1)}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  /**
   * Initialize chart with Intersection Observer for scroll animation
   */
  function initializeChart() {
    const chartSection = document.getElementById('portfolio-preview');
    if (!chartSection) return;

    // Create Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            hasAnimated = true;
            loadAndRenderChart();
          }
        });
      },
      {
        threshold: 0.2, // Trigger when 20% visible
      }
    );

    observer.observe(chartSection);
  }

  /**
   * Load data and render chart
   */
  async function loadAndRenderChart() {
    try {
      const data = await fetchPreviewData();

      if (data) {
        chartData = data;
        createChart(data);
      } else {
        // Show error state
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
          chartContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #6B7280;">
              <p>Données temporairement indisponibles</p>
            </div>
          `;
        }
      }
    } catch (error) {
      console.error('Error loading chart:', error);
    }
  }

  /**
   * Initialize on DOM ready
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeChart);
  } else {
    initializeChart();
  }

  window.addEventListener('languageChanged', () => {
    if (chart && chartData) {
      chart.data = formatChartData(chartData);
      const axisLabels = getETFLabels();
      if (chart.options?.scales?.y?.title) {
        chart.options.scales.y.title.text = axisLabels.yAxisTitle;
      }
      chart.update('none');
    }
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (chart) {
      chart.destroy();
    }
  });
})();
