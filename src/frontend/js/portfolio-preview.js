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
  function formatChartData(data) {
    const labels = data.data.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });
    });

    return {
      labels,
      datasets: [
        {
          label: 'SPY (S&P 500)',
          data: data.data.map(d => d.SPY),
          borderColor: 'rgba(102, 126, 234, 0.4)', // More visible
          backgroundColor: 'rgba(102, 126, 234, 0.05)',
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.4,
          borderDash: [3, 3],
          order: 5, // Behind portfolios
        },
        {
          label: 'IEF (Obligations)',
          data: data.data.map(d => d.IEF),
          borderColor: 'rgba(107, 114, 128, 0.4)', // More visible
          backgroundColor: 'rgba(107, 114, 128, 0.05)',
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.4,
          borderDash: [3, 3],
          order: 4, // Behind portfolios
        },
        {
          label: 'GLD (Or)',
          data: data.data.map(d => d.GLD),
          borderColor: 'rgba(156, 163, 175, 0.4)', // More visible
          backgroundColor: 'rgba(156, 163, 175, 0.05)',
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.4,
          borderDash: [3, 3],
          order: 3, // Behind portfolios
        },
        {
          label: 'Allocation Égale',
          data: data.data.map(d => d.equalWeight),
          borderColor: '#6B7280', // Medium gray
          backgroundColor: 'rgba(107, 114, 128, 0.1)',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          tension: 0.4,
          order: 2, // Middle layer
        },
        {
          label: 'Portefeuille 60/40',
          data: data.data.map(d => d.sixtyForty ?? d.equalWeight),
          borderColor: '#4B5563',
          backgroundColor: 'rgba(75, 85, 99, 0.12)',
          borderWidth: 2.2,
          pointRadius: 0,
          tension: 0.4,
          order: 1.5,
        },
        {
          label: '✨ Optimisé (Risk Parity)',
          data: data.data.map(d => d.optimizedRP),
          borderColor: '#667eea', // Brand chart violet - stands out most
          backgroundColor: 'rgba(102, 126, 234, 0.15)',
          borderWidth: 3,
          pointRadius: 0,
          tension: 0.4,
          order: 1, // On top
        },
      ],
    };
  }

  /**
   * Create animated chart
   */
  function createChart(data) {
    const ctx = document.getElementById('portfolioPreviewChart');
    if (!ctx) return;

    const chartConfig = {
      type: 'line',
      data: formatChartData(data),
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
              text: 'Valeur (Base 100)',
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

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (chart) {
      chart.destroy();
    }
  });
})();
