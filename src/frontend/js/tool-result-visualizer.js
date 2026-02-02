/**
 * Tool Result Visualizer
 * Renders visual representations of chatbot tool results
 * Uses Chart.js for charts and glassmorphism design patterns
 */

(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // INJECT STYLES FOR CHAT ↔ SIMULATOR INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  const styleId = 'tool-result-visualizer-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Chat-highlighted animation for strategy pills */
      .strategy-pill.chat-highlighted {
        animation: chat-highlight-pulse 0.6s ease-in-out 3;
        box-shadow: 0 0 20px rgba(102, 102, 255, 0.5);
      }

      @keyframes chat-highlight-pulse {
        0%, 100% {
          transform: scale(1);
          box-shadow: 0 0 10px rgba(102, 102, 255, 0.3);
        }
        50% {
          transform: scale(1.05);
          box-shadow: 0 0 25px rgba(102, 102, 255, 0.6);
        }
      }

      /* Chat allocation display styling */
      .chat-allocation-display {
        animation: slide-in-fade 0.3s ease-out;
      }

      @keyframes slide-in-fade {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Tool result card styling (fallback) */
      .tool-result {
        margin-top: 12px;
        padding: 16px;
        background: linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.95) 100%);
        border: 1px solid rgba(226, 232, 240, 0.8);
        border-radius: 12px;
        backdrop-filter: blur(10px);
        width: 100%;
        box-sizing: border-box;
      }

      /* Backtest chart styling */
      .tool-result-chart .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .tool-result-chart .chart-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #1f2937;
      }

      .tool-result-chart .chart-period {
        font-size: 12px;
        color: #6b7280;
        background: #f3f4f6;
        padding: 4px 8px;
        border-radius: 6px;
      }

      .tool-result-chart .metrics-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-bottom: 16px;
      }

      .tool-result-chart .metric {
        text-align: center;
        padding: 8px;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 8px;
      }

      .tool-result-chart .metric-value {
        display: block;
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
      }

      .tool-result-chart .metric-value.positive { color: #10B981; }
      .tool-result-chart .metric-value.negative { color: #EF4444; }

      .tool-result-chart .metric-label {
        display: block;
        font-size: 11px;
        color: #6b7280;
        margin-top: 2px;
      }

      .tool-result-chart .chart-wrapper {
        width: 100%;
        height: 160px;
      }

      /* Profile card styling */
      .tool-result-profile .profile-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
      }

      .tool-result-profile .profile-emoji {
        font-size: 24px;
      }

      .tool-result-profile .profile-name {
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
      }

      .tool-result-profile .profile-badge {
        background: #10B981;
        color: white;
        font-size: 12px;
        padding: 2px 6px;
        border-radius: 4px;
      }

      .tool-result-profile .risk-gauge {
        margin-bottom: 16px;
      }

      .tool-result-profile .gauge-labels {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: #6b7280;
        margin-bottom: 4px;
      }

      .tool-result-profile .gauge-bar {
        height: 8px;
        background: linear-gradient(to right, #10B981, #FBBF24, #EF4444);
        border-radius: 4px;
        position: relative;
      }

      .tool-result-profile .gauge-fill {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 4px;
      }

      .tool-result-profile .gauge-marker {
        position: absolute;
        top: -4px;
        transform: translateX(-50%);
        width: 16px;
        height: 16px;
        background: white;
        border: 2px solid #4f46e5;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .tool-result-profile .gauge-value {
        font-size: 8px;
        font-weight: bold;
        color: #4f46e5;
      }

      .tool-result-profile .gauge-confidence {
        text-align: right;
        font-size: 11px;
        color: #6b7280;
        margin-top: 4px;
      }

      .tool-result-profile .profile-traits {
        margin-bottom: 12px;
      }

      .tool-result-profile .traits-label {
        font-size: 11px;
        color: #6b7280;
        margin-bottom: 6px;
      }

      .tool-result-profile .traits-list {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }

      .tool-result-profile .trait-tag {
        font-size: 11px;
        padding: 2px 8px;
        background: rgba(102, 102, 255, 0.1);
        color: #4f46e5;
        border-radius: 12px;
      }

      .tool-result-profile .profile-info-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      .tool-result-profile .profile-info-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
      }

      .tool-result-profile .info-icon { font-size: 14px; }
      .tool-result-profile .info-label { color: #6b7280; }
      .tool-result-profile .info-value { font-weight: 500; color: #1f2937; }

      /* Comparison table styling */
      .tool-result-comparison .comparison-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        font-weight: 600;
        color: #1f2937;
      }

      .tool-result-comparison .comparison-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }

      .tool-result-comparison .comparison-table th {
        text-align: left;
        padding: 8px;
        background: #f8fafc;
        color: #6b7280;
        font-weight: 500;
        border-bottom: 1px solid #e5e7eb;
      }

      .tool-result-comparison .comparison-table td {
        padding: 8px;
        border-bottom: 1px solid #f3f4f6;
      }

      .tool-result-comparison .winner-row {
        background: rgba(102, 102, 255, 0.05);
      }

      .tool-result-comparison .winner-badge {
        margin-right: 4px;
      }

      .tool-result-comparison .comparison-recommendation {
        margin-top: 12px;
        padding: 10px;
        background: rgba(252, 211, 77, 0.1);
        border-radius: 8px;
        font-size: 12px;
        display: flex;
        align-items: flex-start;
        gap: 8px;
      }

      /* Trade explanation styling */
      .tool-result-trade .trade-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }

      .tool-result-trade .trade-bot-emoji { font-size: 24px; }
      .tool-result-trade .trade-bot-name { font-weight: 600; }
      .tool-result-trade .trade-date { color: #6b7280; font-size: 12px; margin-left: auto; }

      .tool-result-trade .trade-stats {
        display: flex;
        gap: 24px;
        margin-bottom: 12px;
      }

      .tool-result-trade .trade-stat {
        text-align: center;
      }

      .tool-result-trade .stat-label {
        display: block;
        font-size: 11px;
        color: #6b7280;
      }

      .tool-result-trade .stat-value {
        display: block;
        font-size: 18px;
        font-weight: 600;
      }

      .tool-result-trade .stat-value.positive { color: #10B981; }
      .tool-result-trade .stat-value.negative { color: #EF4444; }

      .tool-result-trade .trade-event {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        background: rgba(59, 130, 246, 0.1);
        border-radius: 8px;
        margin-bottom: 12px;
        font-size: 12px;
      }

      .tool-result-trade .trade-dialogue {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 12px;
        background: #f8fafc;
        border-radius: 12px;
        border-left: 3px solid #4f46e5;
        margin-bottom: 12px;
        font-style: italic;
      }

      .tool-result-trade .trade-explanation {
        font-size: 13px;
        color: #4b5563;
        line-height: 1.5;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Get current language from document or localStorage
   * @returns {string} Language code ('fr' or 'en')
   */
  function getLang() {
    return document.documentElement.lang || localStorage.getItem('bubbleLanguage') || 'fr';
  }

  /**
   * Format a number as percentage
   * @param {number} value - Number to format
   * @param {number} decimals - Decimal places
   * @returns {string} Formatted percentage
   */
  function formatPercent(value, decimals = 1) {
    if (value === undefined || value === null || isNaN(value)) return '—';
    return `${Number(value).toFixed(decimals)}%`;
  }

  /**
   * Format a number with decimals
   * @param {number} value - Number to format
   * @param {number} decimals - Decimal places
   * @returns {string} Formatted number
   */
  function formatNumber(value, decimals = 2) {
    if (value === undefined || value === null || isNaN(value)) return '—';
    return Number(value).toFixed(decimals);
  }

  /**
   * Create a styled container for tool results
   * @param {string} className - Additional CSS class
   * @returns {HTMLElement} Styled container
   */
  function createResultContainer(className) {
    const container = document.createElement('div');
    container.className = `tool-result ${className}`;
    return container;
  }

  /**
   * Render a backtest result with equity curve chart and metrics
   * @param {Object} data - Backtest result data
   * @param {HTMLElement} anchorEl - Element to append the visualization to
   */
  function renderBacktestChart(data, anchorEl) {
    if (!data || !anchorEl) return;

    const wrapper = anchorEl.closest('.chat-side-panel-message');
    if (!wrapper) return;

    const lang = getLang();
    const container = createResultContainer('tool-result-chart');

    // Header with strategy name
    const header = document.createElement('div');
    header.className = 'chart-header';
    header.innerHTML = `
      <div class="chart-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
        <span>${data.strategy_name || (lang === 'fr' ? 'Strategie' : 'Strategy')}</span>
      </div>
      <div class="chart-period">${data.period?.years || 20} ${lang === 'fr' ? 'ans' : 'years'}</div>
    `;
    container.appendChild(header);

    // Metrics grid
    const metrics = data.metrics || {};
    const metricsGrid = document.createElement('div');
    metricsGrid.className = 'metrics-grid';

    const metricsData = [
      {
        label: lang === 'fr' ? 'Rendement total' : 'Total Return',
        value: formatPercent(metrics.totalReturn),
        positive: metrics.totalReturn > 0
      },
      {
        label: lang === 'fr' ? 'Annualise' : 'Annualized',
        value: formatPercent(metrics.annualizedReturn),
        positive: metrics.annualizedReturn > 0
      },
      {
        label: lang === 'fr' ? 'Volatilite' : 'Volatility',
        value: formatPercent(metrics.volatility),
        neutral: true
      },
      {
        label: lang === 'fr' ? 'Sharpe' : 'Sharpe',
        value: formatNumber(metrics.sharpeRatio),
        positive: metrics.sharpeRatio > 1
      },
      {
        label: lang === 'fr' ? 'Max DD' : 'Max DD',
        value: formatPercent(metrics.maxDrawdown),
        positive: false
      },
      {
        label: 'Calmar',
        value: formatNumber(metrics.calmarRatio),
        positive: metrics.calmarRatio > 0.5
      }
    ];

    metricsData.forEach(m => {
      const metric = document.createElement('div');
      metric.className = 'metric';
      if (m.positive) metric.classList.add('positive');
      else if (m.positive === false && !m.neutral) metric.classList.add('negative');
      metric.innerHTML = `
        <span class="metric-value">${m.value}</span>
        <span class="metric-label">${m.label}</span>
      `;
      metricsGrid.appendChild(metric);
    });
    container.appendChild(metricsGrid);

    // Chart canvas
    const chartData = data.chartData;
    if (Array.isArray(chartData) && chartData.length > 1 && typeof Chart !== 'undefined') {
      const chartWrapper = document.createElement('div');
      chartWrapper.className = 'chart-wrapper';

      const canvas = document.createElement('canvas');
      canvas.id = `backtest-chart-${Date.now()}`;
      canvas.style.width = '100%';
      canvas.style.height = '160px';
      chartWrapper.appendChild(canvas);
      container.appendChild(chartWrapper);

      // Render chart after DOM insertion
      setTimeout(() => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const labels = chartData.map(p => {
          const d = new Date(p.date);
          return d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
            year: '2-digit',
            month: 'short'
          });
        });
        const values = chartData.map(p => p.value);

        // Determine chart color based on performance
        const firstVal = values[0] || 100;
        const lastVal = values[values.length - 1] || 100;
        const chartColor = lastVal >= firstVal ? '#10B981' : '#EF4444';

        new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: data.strategy_name || 'Portfolio',
              data: values,
              borderColor: chartColor,
              backgroundColor: `${chartColor}20`,
              fill: true,
              tension: 0.3,
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              intersect: false,
              mode: 'index'
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 10,
                cornerRadius: 8,
                displayColors: false,
                callbacks: {
                  label: (ctx) => `${lang === 'fr' ? 'Valeur' : 'Value'}: ${ctx.raw?.toFixed(1) || ctx.formattedValue}`
                }
              }
            },
            scales: {
              x: {
                display: true,
                grid: { display: false },
                ticks: {
                  maxTicksLimit: 6,
                  font: { size: 10 },
                  color: '#9CA3AF'
                }
              },
              y: {
                display: true,
                grid: {
                  color: 'rgba(156, 163, 175, 0.1)',
                  drawBorder: false
                },
                ticks: {
                  font: { size: 10 },
                  color: '#9CA3AF',
                  callback: (val) => val.toFixed(0)
                }
              }
            }
          }
        });
      }, 50);
    }

    wrapper.appendChild(container);

    // Emit event for simulator sync (Phase 2)
    if (window.StrategyEventBus) {
      window.StrategyEventBus.emit('backtest:complete', {
        strategy_name: data.strategy_name,
        allocation: data.allocation,
        metrics: data.metrics,
        chartData: data.chartData
      });
    }
  }

  /**
   * Render an investor profile card with risk gauge
   * @param {Object} data - Profile visualization data
   * @param {HTMLElement} anchorEl - Element to append the visualization to
   */
  function renderProfileCard(data, anchorEl) {
    if (!data || !anchorEl) return;

    const wrapper = anchorEl.closest('.chat-side-panel-message');
    if (!wrapper) return;

    const lang = getLang();
    const container = createResultContainer('tool-result-profile');

    const profile = data.profile || {};
    const riskScore = profile.riskScore ?? 50;
    const confidence = profile.riskConfidence ?? 0;

    // Determine profile name based on risk score
    let profileName, profileEmoji;
    if (riskScore <= 30) {
      profileName = lang === 'fr' ? 'Conservateur' : 'Conservative';
      profileEmoji = '🛡️';
    } else if (riskScore <= 60) {
      profileName = lang === 'fr' ? 'Equilibre' : 'Balanced';
      profileEmoji = '⚖️';
    } else {
      profileName = lang === 'fr' ? 'Croissance' : 'Growth';
      profileEmoji = '🚀';
    }

    // Header
    const header = document.createElement('div');
    header.className = 'profile-header';
    header.innerHTML = `
      <span class="profile-emoji">${profileEmoji}</span>
      <span class="profile-name">${profileName}</span>
      ${confidence >= 70 ? '<span class="profile-badge">✓</span>' : ''}
    `;
    container.appendChild(header);

    // Risk gauge
    const gaugeContainer = document.createElement('div');
    gaugeContainer.className = 'risk-gauge';
    gaugeContainer.innerHTML = `
      <div class="gauge-labels">
        <span>${lang === 'fr' ? 'Prudent' : 'Safe'}</span>
        <span>${lang === 'fr' ? 'Risque' : 'Risk'}</span>
      </div>
      <div class="gauge-bar">
        <div class="gauge-fill" style="width: ${riskScore}%"></div>
        <div class="gauge-marker" style="left: ${riskScore}%">
          <div class="gauge-value">${riskScore}</div>
        </div>
      </div>
      <div class="gauge-confidence">
        ${lang === 'fr' ? 'Confiance' : 'Confidence'}: ${confidence}%
      </div>
    `;
    container.appendChild(gaugeContainer);

    // Traits
    const traits = profile.traits || [];
    if (traits.length > 0) {
      const traitsContainer = document.createElement('div');
      traitsContainer.className = 'profile-traits';
      traitsContainer.innerHTML = `
        <div class="traits-label">${lang === 'fr' ? 'Traits' : 'Traits'}</div>
        <div class="traits-list">
          ${traits.map(t => `<span class="trait-tag">${t}</span>`).join('')}
        </div>
      `;
      container.appendChild(traitsContainer);
    }

    // Goals and horizon
    const infoGrid = document.createElement('div');
    infoGrid.className = 'profile-info-grid';

    const infoItems = [];
    if (profile.goal) {
      const goalLabels = {
        learn: lang === 'fr' ? 'Apprendre' : 'Learn',
        grow: lang === 'fr' ? 'Croissance' : 'Growth',
        preserve: lang === 'fr' ? 'Preserver' : 'Preserve',
        income: lang === 'fr' ? 'Revenus' : 'Income'
      };
      infoItems.push({
        icon: '🎯',
        label: lang === 'fr' ? 'Objectif' : 'Goal',
        value: goalLabels[profile.goal] || profile.goal
      });
    }
    if (profile.horizon) {
      const horizonLabels = {
        short: lang === 'fr' ? 'Court terme' : 'Short term',
        medium: lang === 'fr' ? 'Moyen terme' : 'Medium term',
        long: lang === 'fr' ? 'Long terme' : 'Long term'
      };
      infoItems.push({
        icon: '📅',
        label: lang === 'fr' ? 'Horizon' : 'Horizon',
        value: horizonLabels[profile.horizon] || profile.horizon
      });
    }
    if (profile.level) {
      const levelLabels = {
        beginner: lang === 'fr' ? 'Debutant' : 'Beginner',
        intermediate: lang === 'fr' ? 'Intermediaire' : 'Intermediate',
        advanced: lang === 'fr' ? 'Avance' : 'Advanced'
      };
      infoItems.push({
        icon: '📚',
        label: lang === 'fr' ? 'Niveau' : 'Level',
        value: levelLabels[profile.level] || profile.level
      });
    }

    if (infoItems.length > 0) {
      infoItems.forEach(item => {
        const infoItem = document.createElement('div');
        infoItem.className = 'profile-info-item';
        infoItem.innerHTML = `
          <span class="info-icon">${item.icon}</span>
          <span class="info-label">${item.label}</span>
          <span class="info-value">${item.value}</span>
        `;
        infoGrid.appendChild(infoItem);
      });
      container.appendChild(infoGrid);
    }

    // Recommended bot
    if (data.recommendedBot) {
      const recommendation = document.createElement('div');
      recommendation.className = 'profile-recommendation';
      recommendation.innerHTML = `
        <div class="recommendation-label">${lang === 'fr' ? 'Bot recommande' : 'Recommended Bot'}</div>
        <div class="recommendation-bot">
          <strong>${data.recommendedBot.name}</strong>
          ${data.recommendedBot.reason ? `<span class="recommendation-reason">${data.recommendedBot.reason}</span>` : ''}
        </div>
      `;
      container.appendChild(recommendation);
    }

    wrapper.appendChild(container);
  }

  /**
   * Render a strategy comparison table
   * @param {Object} data - Comparison data
   * @param {HTMLElement} anchorEl - Element to append the visualization to
   */
  function renderComparisonTable(data, anchorEl) {
    if (!data || !anchorEl) return;

    const wrapper = anchorEl.closest('.chat-side-panel-message');
    if (!wrapper) return;

    const lang = getLang();
    const container = createResultContainer('tool-result-comparison');

    const comparison = data.comparison || [];
    const winner = data.winner;

    // Header
    const header = document.createElement('div');
    header.className = 'comparison-header';
    header.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="3" y1="9" x2="21" y2="9"></line>
        <line x1="9" y1="21" x2="9" y2="9"></line>
      </svg>
      <span>${lang === 'fr' ? 'Comparaison' : 'Comparison'}</span>
    `;
    container.appendChild(header);

    // Table
    const table = document.createElement('table');
    table.className = 'comparison-table';

    // Table header
    const metricLabels = {
      return: lang === 'fr' ? 'Rendement' : 'Return',
      volatility: lang === 'fr' ? 'Volatilite' : 'Volatility',
      sharpe: 'Sharpe',
      drawdown: lang === 'fr' ? 'Max DD' : 'Max DD',
      calmar: 'Calmar'
    };

    const metricsToShow = data.metrics || ['return', 'sharpe', 'drawdown'];

    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>${lang === 'fr' ? 'Strategie' : 'Strategy'}</th>
        ${metricsToShow.map(m => `<th>${metricLabels[m] || m}</th>`).join('')}
      </tr>
    `;
    table.appendChild(thead);

    // Table body
    const tbody = document.createElement('tbody');
    comparison.forEach(item => {
      const isWinner = item.strategy === winner;
      const row = document.createElement('tr');
      if (isWinner) row.classList.add('winner-row');

      const strategyCell = `
        <td class="strategy-cell">
          ${isWinner ? '<span class="winner-badge">👑</span>' : ''}
          <span>${item.strategy}</span>
        </td>
      `;

      const metricCells = metricsToShow.map(m => {
        const val = item.metrics?.[m];
        const formatted = m === 'drawdown' || m === 'return' || m === 'volatility'
          ? formatPercent(val)
          : formatNumber(val);
        return `<td>${formatted}</td>`;
      }).join('');

      row.innerHTML = strategyCell + metricCells;
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);

    // Recommendation
    if (data.recommendation) {
      const recommendation = document.createElement('div');
      recommendation.className = 'comparison-recommendation';
      recommendation.innerHTML = `
        <span class="recommendation-icon">💡</span>
        <span>${data.recommendation}</span>
      `;
      container.appendChild(recommendation);
    }

    wrapper.appendChild(container);
  }

  /**
   * Render a bot trade explanation with dialogue
   * @param {Object} data - Trade explanation data
   * @param {HTMLElement} anchorEl - Element to append the visualization to
   */
  function renderTradeExplanation(data, anchorEl) {
    if (!data || !anchorEl) return;

    const wrapper = anchorEl.closest('.chat-side-panel-message');
    if (!wrapper) return;

    const lang = getLang();
    const container = createResultContainer('tool-result-trade');

    // Bot emoji mapping
    const botEmojis = {
      Hedgehog: '🦔',
      Fox: '🦊',
      Hawk: '🦅',
      Bear: '🐻'
    };

    // Header with bot info
    const header = document.createElement('div');
    header.className = 'trade-header';
    header.innerHTML = `
      <span class="trade-bot-emoji">${botEmojis[data.bot] || '🤖'}</span>
      <span class="trade-bot-name">${data.bot || 'Bot'}</span>
      <span class="trade-date">${data.date || ''}</span>
    `;
    container.appendChild(header);

    // Trade stats
    const stats = document.createElement('div');
    stats.className = 'trade-stats';

    const pnl = data.pnl || 0;
    const pnlClass = pnl >= 0 ? 'positive' : 'negative';
    const pnlSign = pnl >= 0 ? '+' : '';

    stats.innerHTML = `
      <div class="trade-stat">
        <span class="stat-label">${lang === 'fr' ? 'Valeur' : 'Value'}</span>
        <span class="stat-value">${formatNumber(data.value, 1)}</span>
      </div>
      <div class="trade-stat">
        <span class="stat-label">${lang === 'fr' ? 'P&L' : 'P&L'}</span>
        <span class="stat-value ${pnlClass}">${pnlSign}${formatPercent(pnl)}</span>
      </div>
    `;
    container.appendChild(stats);

    // Event info
    if (data.event) {
      const eventInfo = document.createElement('div');
      eventInfo.className = 'trade-event';
      eventInfo.innerHTML = `
        <span class="event-icon">📰</span>
        <span class="event-type">${data.event.type || data.event.name || 'Event'}</span>
        ${data.event.description ? `<span class="event-desc">${data.event.description}</span>` : ''}
      `;
      container.appendChild(eventInfo);
    }

    // Dialogue bubble
    if (data.dialogue) {
      const dialogue = document.createElement('div');
      dialogue.className = 'trade-dialogue';
      dialogue.innerHTML = `
        <span class="dialogue-emoji">${data.dialogue.emoji || '💬'}</span>
        <span class="dialogue-text">"${data.dialogue.text || ''}"</span>
      `;
      container.appendChild(dialogue);
    }

    // Explanation
    if (data.explanation) {
      const explanation = document.createElement('div');
      explanation.className = 'trade-explanation';
      explanation.innerHTML = `<p>${data.explanation}</p>`;
      container.appendChild(explanation);
    }

    wrapper.appendChild(container);
  }

  /**
   * Handle a tool result and render the appropriate visualization
   * Also emits events to StrategyEventBus for UI components that need to sync
   * @param {Object} toolResult - Tool result from SSE payload
   * @param {HTMLElement} anchorEl - Element to anchor the visualization to
   */
  function handleToolResult(toolResult, anchorEl) {
    if (!toolResult || !toolResult.result?.success) return;

    const name = toolResult.name;
    const data = toolResult.result.data || toolResult.result || {};

    // Render visualization based on tool type
    switch (name) {
      case 'backtest_strategy':
        renderBacktestChart(data, anchorEl);
        break;
      case 'get_profile_visualization':
        renderProfileCard(data, anchorEl);
        break;
      case 'compare_strategies':
        renderComparisonTable(data, anchorEl);
        break;
      case 'explain_bot_trade':
        renderTradeExplanation(data, anchorEl);
        break;
      case 'set_simulator_allocation':
        // Render allocation confirmation card
        renderAllocationCard(data, anchorEl);
        break;
      case 'apply_recommended_strategy':
        // Render strategy application card
        renderStrategyCard(data, anchorEl);
        break;
      case 'update_profile_setting':
        // Render profile update confirmation
        renderProfileUpdateCard(data, anchorEl);
        break;
      default:
        console.log('[ToolResultVisualizer] Unknown tool result:', name);
    }

    // Emit event to StrategyEventBus if the tool result contains an event
    // (This is a backup in case chat-side-panel didn't emit it)
    if (data.event && window.StrategyEventBus && !window.StrategyEventBus._lastEmittedToolEvent?.includes(name)) {
      console.log(`[ToolResultVisualizer] Emitting event: ${data.event}`);
      window.StrategyEventBus.emit(data.event, {
        toolName: name,
        ...data
      });
    }
  }

  /**
   * Render a card confirming allocation was set
   * @param {Object} data - Allocation data
   * @param {HTMLElement} anchorEl - Anchor element
   */
  function renderAllocationCard(data, anchorEl) {
    if (!data || !anchorEl) return;

    const wrapper = anchorEl.closest('.chat-side-panel-message');
    if (!wrapper) return;

    const lang = getLang();
    const container = createResultContainer('tool-result-allocation');

    const allocation = data.allocation || {};
    
    container.innerHTML = `
      <div class="allocation-header" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <span style="font-size: 20px;">📊</span>
        <span style="font-weight: 600; color: #1f2937;">${lang === 'fr' ? 'Allocation définie' : 'Allocation Set'}</span>
        <span style="margin-left: auto; font-size: 12px; color: #10B981;">✓</span>
      </div>
      <div class="allocation-values" style="display: flex; gap: 16px; margin-bottom: 12px;">
        <div style="flex: 1; text-align: center; padding: 12px; background: rgba(16, 185, 129, 0.1); border-radius: 8px;">
          <div style="font-size: 20px; font-weight: 600; color: #10B981;">${allocation.stocks || 0}%</div>
          <div style="font-size: 11px; color: #6b7280;">📈 ${lang === 'fr' ? 'Actions' : 'Stocks'}</div>
        </div>
        <div style="flex: 1; text-align: center; padding: 12px; background: rgba(59, 130, 246, 0.1); border-radius: 8px;">
          <div style="font-size: 20px; font-weight: 600; color: #3b82f6;">${allocation.bonds || 0}%</div>
          <div style="font-size: 11px; color: #6b7280;">📊 ${lang === 'fr' ? 'Obligations' : 'Bonds'}</div>
        </div>
        <div style="flex: 1; text-align: center; padding: 12px; background: rgba(251, 191, 36, 0.1); border-radius: 8px;">
          <div style="font-size: 20px; font-weight: 600; color: #f59e0b;">${allocation.gold || 0}%</div>
          <div style="font-size: 11px; color: #6b7280;">🥇 ${lang === 'fr' ? 'Or' : 'Gold'}</div>
        </div>
      </div>
      ${data.riskProfile ? `
        <div style="font-size: 12px; color: #6b7280; text-align: center;">
          ${lang === 'fr' ? 'Profil de risque' : 'Risk profile'}: <strong>${data.riskProfile}</strong>
        </div>
      ` : ''}
    `;

    wrapper.appendChild(container);
  }

  /**
   * Render a card confirming strategy was applied
   * @param {Object} data - Strategy data
   * @param {HTMLElement} anchorEl - Anchor element
   */
  function renderStrategyCard(data, anchorEl) {
    if (!data || !anchorEl) return;

    const wrapper = anchorEl.closest('.chat-side-panel-message');
    if (!wrapper) return;

    const lang = getLang();
    const container = createResultContainer('tool-result-strategy');

    const strategyEmojis = {
      conservative: '🛡️',
      balanced: '⚖️',
      growth: '📈',
      aggressive: '🚀',
      '60_40': '⚖️',
      risk_parity: '🦊',
      all_weather: '☀️'
    };

    const strategyLabels = {
      conservative: { fr: 'Conservateur', en: 'Conservative' },
      balanced: { fr: 'Équilibré', en: 'Balanced' },
      growth: { fr: 'Croissance', en: 'Growth' },
      aggressive: { fr: 'Agressif', en: 'Aggressive' },
      '60_40': { fr: '60/40 Classique', en: 'Classic 60/40' },
      risk_parity: { fr: 'Risk Parity', en: 'Risk Parity' },
      all_weather: { fr: 'All Weather', en: 'All Weather' }
    };

    const emoji = strategyEmojis[data.strategy_name] || '📊';
    const label = strategyLabels[data.strategy_name]?.[lang] || data.strategy_name;
    const allocation = data.allocation || {};

    container.innerHTML = `
      <div class="strategy-header" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <span style="font-size: 24px;">${emoji}</span>
        <div>
          <div style="font-weight: 600; color: #1f2937; font-size: 16px;">${label}</div>
          <div style="font-size: 11px; color: #6b7280;">${data.description || ''}</div>
        </div>
        <span style="margin-left: auto; font-size: 12px; color: #10B981;">✓ ${lang === 'fr' ? 'Appliqué' : 'Applied'}</span>
      </div>
      <div class="strategy-allocation" style="display: flex; gap: 8px; margin-bottom: 12px;">
        <div style="flex: 1; text-align: center; padding: 8px; background: #f8fafc; border-radius: 6px;">
          <div style="font-weight: 600;">${allocation.stocks || 0}%</div>
          <div style="font-size: 10px; color: #6b7280;">${lang === 'fr' ? 'Actions' : 'Stocks'}</div>
        </div>
        <div style="flex: 1; text-align: center; padding: 8px; background: #f8fafc; border-radius: 6px;">
          <div style="font-weight: 600;">${allocation.bonds || 0}%</div>
          <div style="font-size: 10px; color: #6b7280;">${lang === 'fr' ? 'Obligations' : 'Bonds'}</div>
        </div>
        <div style="flex: 1; text-align: center; padding: 8px; background: #f8fafc; border-radius: 6px;">
          <div style="font-weight: 600;">${allocation.gold || 0}%</div>
          <div style="font-size: 10px; color: #6b7280;">${lang === 'fr' ? 'Or' : 'Gold'}</div>
        </div>
      </div>
    `;

    wrapper.appendChild(container);
  }

  /**
   * Render a card confirming profile was updated
   * @param {Object} data - Profile update data
   * @param {HTMLElement} anchorEl - Anchor element
   */
  function renderProfileUpdateCard(data, anchorEl) {
    if (!data || !anchorEl) return;

    const wrapper = anchorEl.closest('.chat-side-panel-message');
    if (!wrapper) return;

    const lang = getLang();
    const container = createResultContainer('tool-result-profile-update');

    const update = data.update || {};
    const settingLabels = {
      riskScore: { fr: 'Score de risque', en: 'Risk Score' },
      investmentHorizon: { fr: 'Horizon d\'investissement', en: 'Investment Horizon' },
      investmentGoal: { fr: 'Objectif d\'investissement', en: 'Investment Goal' },
      knowledgeLevel: { fr: 'Niveau de connaissance', en: 'Knowledge Level' }
    };

    const settingName = Object.keys(update)[0];
    const settingValue = update[settingName];
    const label = settingLabels[settingName]?.[lang] || settingName;

    container.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 24px;">✅</span>
        <div>
          <div style="font-weight: 600; color: #1f2937;">${lang === 'fr' ? 'Profil mis à jour' : 'Profile Updated'}</div>
          <div style="font-size: 13px; color: #6b7280;">
            ${label}: <strong>${settingValue}</strong>
          </div>
        </div>
      </div>
    `;

    wrapper.appendChild(container);
  }

  // Export to global namespace
  window.ToolResultVisualizer = {
    renderBacktestChart,
    renderProfileCard,
    renderComparisonTable,
    renderTradeExplanation,
    renderAllocationCard,
    renderStrategyCard,
    renderProfileUpdateCard,
    handleToolResult
  };

})();
