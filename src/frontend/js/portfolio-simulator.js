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
  let currentLeverage = 1; // NEW: Leverage toggle state (1x or 2x)
  let portfolioData = null;
  const CUSTOM_STRATEGY_STORAGE_KEY = 'bubbleCustomStrategy';
  const FEATURE_FLAGS = {
    exports: true,
  };
  const ETF_VISIBILITY_STORAGE_KEY = 'bubbleSimulatorEtfVisibility';
  const ETF_KEYS = ['SPY', 'IEF', 'GLD', 'EFA', 'EEM'];
  const etfToggleButtons = new Map();
  let etfVisibility = ETF_KEYS.reduce((acc, key) => {
    acc[key] = true;
    return acc;
  }, {});
  const DEFAULT_CUSTOM_STRATEGY = {
    enabled: false,
    strategyA: 'optimizedRiskParity',
    strategyB: 'sixtyForty',
    weight: 60, // percent for strategy A
  };
  let customStrategyState = { ...DEFAULT_CUSTOM_STRATEGY };
  const customStrategyElements = {};
  const exportElements = {
    section: null,
    chartBtn: null,
    metricsBtn: null,
    status: null,
  };
  const SLIDER_CONFIGS = [
    { id: 'strategySlider', trackSelector: '.strategy-pills' },
    { id: 'metricsSlider', trackSelector: '.metrics-cards' },
  ];
  const mobileSliderInstances = new Map();
  const mobileSliderQuery = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(max-width: 768px)')
    : null;
  const mobileTooltipState = {
    initialized: false,
    overlay: null,
    content: null,
    currentTrigger: null,
  };

  function loadCustomStrategyState() {
    try {
      const stored = localStorage.getItem(CUSTOM_STRATEGY_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (!parsed || typeof parsed !== 'object') return;
      customStrategyState = {
        ...customStrategyState,
        ...parsed,
      };
    } catch (error) {
      console.warn('Unable to load custom strategy state:', error);
    }
  }

  function persistCustomStrategyState() {
    try {
      localStorage.setItem(
        CUSTOM_STRATEGY_STORAGE_KEY,
        JSON.stringify(customStrategyState)
      );
    } catch (error) {
      console.warn('Unable to persist custom strategy state:', error);
    }
  }

  function resolveTranslation(key, fallback) {
    const lang = getCurrentLanguage();
    const translations = window.translations?.[key];
    if (translations && translations[lang]) {
      return translations[lang];
    }
    return fallback;
  }

  function setExportStatus(statusKey) {
    if (!exportElements.status) return;
    const fallbacks = {
      ready: getCurrentLanguage() === 'en'
        ? 'Choose an export to download.'
        : 'Choisissez un export à télécharger.',
      success: getCurrentLanguage() === 'en'
        ? 'Download started!'
        : 'Téléchargement lancé !',
      error: getCurrentLanguage() === 'en'
        ? 'Export failed. Please try again.'
        : 'Export impossible. Réessayez.',
    };
    exportElements.status.textContent = resolveTranslation(
      `simulator.export.status.${statusKey}`,
      fallbacks[statusKey] || ''
    );
  }

  function downloadFile(filename, content, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleChartExport() {
    if (!portfolioChart) {
      setExportStatus('error');
      return;
    }
    try {
      const dataUrl = portfolioChart.toBase64Image('image/png', 1);
      const filename = `bubble-portfolio-chart-${currentStrategy}-${currentPeriod}y.png`;
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExportStatus('success');
      trackSimulatorEvent('export_chart_png', {
        export_strategy: currentStrategy,
        export_period_years: currentPeriod,
      });
    } catch (error) {
      console.error('Failed to export chart:', error);
      setExportStatus('error');
    }
  }

  function handleMetricsExport() {
    if (!portfolioData || !portfolioData.metrics) {
      setExportStatus('error');
      return;
    }

    const strategyKeys = Array.isArray(portfolioData.strategyKeys)
      ? Array.from(new Set(portfolioData.strategyKeys))
      : Object.keys(portfolioData.metrics);

    if (!strategyKeys || strategyKeys.length === 0) {
      setExportStatus('error');
      return;
    }

    const headers = [
      'strategy',
      'totalReturn(%)',
      'annualReturn(%)',
      'volatility(%)',
      'sharpeRatio',
      'maxDrawdown(%)',
      'periodYears',
    ];

    const csvRows = [headers.join(',')];

    strategyKeys.forEach((key) => {
      const metric = portfolioData.metrics[key];
      if (!metric) return;
      const row = [
        key,
        typeof metric.totalReturn === 'number' ? metric.totalReturn.toFixed(2) : '',
        typeof metric.annualReturn === 'number' ? metric.annualReturn.toFixed(2) : '',
        typeof metric.volatility === 'number' ? metric.volatility.toFixed(2) : '',
        typeof metric.sharpeRatio === 'number' ? metric.sharpeRatio.toFixed(2) : '',
        typeof metric.maxDrawdown === 'number' ? metric.maxDrawdown.toFixed(2) : '',
        currentPeriod,
      ];
      csvRows.push(row.join(','));
    });

    const filename = `bubble-portfolio-metrics-${currentPeriod}y.csv`;
    try {
      downloadFile(filename, csvRows.join('\n'), 'text/csv;charset=utf-8;');
      setExportStatus('success');
      trackSimulatorEvent('export_metrics_csv', {
        export_period_years: currentPeriod,
        strategies_exported: strategyKeys.length,
      });
    } catch (error) {
      console.error('Failed to export metrics:', error);
      setExportStatus('error');
    }
  }

  function initializeExportActions() {
    if (!FEATURE_FLAGS.exports) {
      return;
    }

    exportElements.section = document.getElementById('exportActions');
    exportElements.chartBtn = document.getElementById('exportChartBtn');
    exportElements.metricsBtn = document.getElementById('exportMetricsBtn');
    exportElements.status = document.getElementById('exportStatus');

    if (
      !exportElements.section ||
      !exportElements.chartBtn ||
      !exportElements.metricsBtn ||
      !exportElements.status
    ) {
      return;
    }

    exportElements.section.classList.remove('hidden');
    setExportStatus('ready');

    exportElements.chartBtn.addEventListener('click', handleChartExport);
    exportElements.metricsBtn.addEventListener('click', handleMetricsExport);
  }

  function applyQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const strategyParam = params.get('strategy');
    const periodParam = parseInt(params.get('period'), 10);
    const mixParam = params.get('mix');

    if (!Number.isNaN(periodParam) && [1, 3, 5, 10, 20].includes(periodParam)) {
      currentPeriod = periodParam;
    }

    if (strategyParam && STRATEGY_CONFIG[strategyParam]) {
      currentStrategy = strategyParam;
    }

    if (mixParam) {
      const parts = mixParam.split(',').map((part) => part.trim());
      if (parts.length >= 2) {
        const [strategyA, strategyB, weightRaw] = parts;
        if (
          STRATEGY_CONFIG[strategyA] &&
          STRATEGY_CONFIG[strategyB] &&
          strategyA !== 'customMix' &&
          strategyB !== 'customMix'
        ) {
          const weightValue = parseInt(weightRaw, 10);
          customStrategyState.strategyA = strategyA;
          customStrategyState.strategyB = strategyB;
          if (!Number.isNaN(weightValue)) {
            customStrategyState.weight = Math.min(95, Math.max(5, weightValue));
          }
          customStrategyState.enabled = true;
          if (!strategyParam || strategyParam === 'customMix') {
            currentStrategy = 'customMix';
          }
        }
      }
    }
  }

  function getCurrentLanguage() {
    return document.documentElement.lang || localStorage.getItem('bubbleLanguage') || 'fr';
  }

  function trackSimulatorEvent(action, params = {}) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', action, {
      event_category: 'Portfolio Simulator',
      language: getCurrentLanguage(),
      strategy: currentStrategy,
      period_years: currentPeriod,
      custom_mix_enabled: customStrategyState.enabled,
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
      customStrategy: customStrategyState.enabled
        ? {
            strategyA: customStrategyState.strategyA,
            strategyB: customStrategyState.strategyB,
            weight: customStrategyState.weight,
          }
        : null,
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
    sixtyForty: {
      labelKey: 'simulator.strategy.sixtyForty',
      dataKey: 'sixtyForty',
      color: '#4B5563',
      borderWidth: 2.2,
      borderDash: [],
      order: 2.5,
      isBest: false,
    },
    momentumTilt: {
      labelKey: 'simulator.strategy.momentumTilt',
      dataKey: 'momentumTilt',
      color: '#14B8A6',
      borderWidth: 2.4,
      borderDash: [],
      order: 2,
      isBest: false,
    },
    hierarchicalRiskParity: {
      labelKey: 'simulator.strategy.hierarchicalRiskParity',
      dataKey: 'hierarchicalRiskParity',
      color: '#F59E0B',
      borderWidth: 2.4,
      borderDash: [4, 4],
      order: 1.8,
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
    customMix: {
      labelKey: 'simulator.strategy.customMix',
      dataKey: 'customMix',
      color: '#0ea5e9',
      borderWidth: 3,
      borderDash: [],
      order: 0,
      isBest: false,
      isCustom: true,
    },
  };

  /**
   * Get translated label for strategy
   */
  function getStrategyLabel(labelKey) {
    const lang = localStorage.getItem('bubbleLanguage') || 'fr';

    // Ensure translations object exists
    if (!window.translations) {
      console.warn('Translations not loaded yet, using fallback');
      // Fallback labels
      const fallbacks = {
        'simulator.strategy.equalWeight': lang === 'en' ? 'Equal Allocation' : 'Allocation Égale',
        'simulator.strategy.sixtyForty': lang === 'en' ? '60/40 Balanced' : 'Portefeuille 60/40',
        'simulator.strategy.momentumTilt': lang === 'en' ? 'Momentum Tilt' : 'Momentum',
        'simulator.strategy.hierarchicalRiskParity': lang === 'en' ? 'Hierarchical RP' : 'Risk Parity Hiérarchique',
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
    const lang = localStorage.getItem('bubbleLanguage') || 'fr';
    const t = window.translations || {};

    const fallback = (labels) => (lang === 'en' ? labels.en : labels.fr);
    return {
      spy: t['simulator.etf.spy'] ? t['simulator.etf.spy'][lang] : fallback({ en: 'SPY (S&P 500)', fr: 'SPY (S&P 500)' }),
      ief: t['simulator.etf.ief'] ? t['simulator.etf.ief'][lang] : fallback({ en: 'IEF (Bonds)', fr: 'IEF (Obligations)' }),
      gld: t['simulator.etf.gld'] ? t['simulator.etf.gld'][lang] : fallback({ en: 'GLD (Gold)', fr: 'GLD (Or)' }),
      efa: t['simulator.etf.efa'] ? t['simulator.etf.efa'][lang] : fallback({ en: 'EFA (Developed ex-US)', fr: 'EFA (Marchés développés)' }),
      eem: t['simulator.etf.eem'] ? t['simulator.etf.eem'][lang] : fallback({ en: 'EEM (Emerging Markets)', fr: 'EEM (Marchés émergents)' }),
      yAxisTitle: t['simulator.chart.yAxisTitle'] ? t['simulator.chart.yAxisTitle'][lang] : fallback({ en: 'Value (Base 100)', fr: 'Valeur (Base 100)' }),
    };
  }

  function loadEtfVisibilityState() {
    try {
      const stored = localStorage.getItem(ETF_VISIBILITY_STORAGE_KEY);
      if (!stored) {
        return;
      }
      const parsed = JSON.parse(stored);
      if (!parsed || typeof parsed !== 'object') {
        return;
      }
      ETF_KEYS.forEach((key) => {
        if (typeof parsed[key] === 'boolean') {
          etfVisibility[key] = parsed[key];
        }
      });
    } catch (error) {
      console.warn('Unable to load ETF visibility preferences:', error);
    }
  }

  function persistEtfVisibilityState() {
    try {
      localStorage.setItem(ETF_VISIBILITY_STORAGE_KEY, JSON.stringify(etfVisibility));
    } catch (error) {
      console.warn('Unable to persist ETF visibility preferences:', error);
    }
  }

  function setEtfButtonState(key, isVisible) {
    const button = etfToggleButtons.get(key);
    if (!button) return;
    if (isVisible) {
      button.classList.add('active');
      button.classList.remove('is-off');
    } else {
      button.classList.remove('active');
      button.classList.add('is-off');
    }
    button.setAttribute('aria-pressed', isVisible ? 'true' : 'false');
  }

  function refreshEtfToggleUi() {
    ETF_KEYS.forEach((key) => {
      setEtfButtonState(key, etfVisibility[key]);
    });
  }

  function updateEtfToggleLabels() {
    const etfLabels = getETFLabels();
    ETF_KEYS.forEach((key) => {
      const button = etfToggleButtons.get(key);
      if (!button) return;
      const labelKey = key.toLowerCase();
      if (etfLabels[labelKey]) {
        button.setAttribute('title', etfLabels[labelKey]);
        button.setAttribute('aria-label', etfLabels[labelKey]);
      }
    });
  }

  function isEtfVisible(ticker) {
    return etfVisibility[ticker] !== false;
  }

  function initializeEtfToggleControls() {
    loadEtfVisibilityState();
    const toggleContainer = document.getElementById('etfToggleGroup');
    if (!toggleContainer) {
      return;
    }

    ETF_KEYS.forEach((key) => {
      const button = toggleContainer.querySelector(`[data-etf="${key}"]`);
      if (!button) return;
      etfToggleButtons.set(key, button);
      button.addEventListener('click', () => {
        etfVisibility[key] = !etfVisibility[key];
        setEtfButtonState(key, etfVisibility[key]);
        persistEtfVisibilityState();
        if (portfolioData) {
          updateChart(portfolioData, currentStrategy);
        }
        trackSimulatorEvent('etf_visibility_toggled', {
          ticker: key,
          visible: etfVisibility[key],
        });
      });
    });

    updateEtfToggleLabels();
    refreshEtfToggleUi();
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
  async function fetchPortfolioData(period, leverage = 1) {
    try {
      const params = new URLSearchParams();
      if (period) params.append('period', period);
      if (leverage > 1) params.append('leverage', leverage);
      const query = params.toString() ? `?${params.toString()}` : '';
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
  function normalizeChartSeries(rawRows = []) {
    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      return [];
    }

    const numericKeys = Object.keys(rawRows[0] || {}).filter((key) => key !== 'date');
    const baseValues = {};

    numericKeys.forEach((key) => {
      const firstPointWithValue = rawRows.find(
        (row) => typeof row[key] === 'number' && !Number.isNaN(row[key]) && row[key] !== 0
      );
      if (firstPointWithValue) {
        baseValues[key] = firstPointWithValue[key];
      }
    });

    return rawRows.map((row) => {
      const normalizedRow = { ...row };
      numericKeys.forEach((key) => {
        const baseValue = baseValues[key];
        if (
          typeof baseValue === 'number' &&
          baseValue !== 0 &&
          typeof row[key] === 'number' &&
          !Number.isNaN(row[key])
        ) {
          normalizedRow[key] = Number(((row[key] / baseValue) * 100).toFixed(2));
        }
      });
      return normalizedRow;
    });
  }

  function ensureNormalizedCache(data) {
    if (!data || !Array.isArray(data.data)) {
      return [];
    }
    if (Array.isArray(data.normalizedCache) && data.normalizedCache.length === data.data.length) {
      return data.normalizedCache;
    }
    data.normalizedCache = normalizeChartSeries(data.data);
    return data.normalizedCache;
  }

  function formatChartData(data, strategy) {
    const lang = localStorage.getItem('bubbleLanguage') || 'fr';
    const locale = lang === 'en' ? 'en-US' : 'fr-FR';
    const normalizedRows = ensureNormalizedCache(data);

    // Filter data by period start date if available
    const dataStartDate = data.dataStartDate ? new Date(data.dataStartDate) : null;
    const filteredRows = dataStartDate
      ? normalizedRows.filter(d => new Date(d.date) >= dataStartDate)
      : normalizedRows;

    const labels = filteredRows.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString(locale, { year: 'numeric', month: 'short' });
    });

    const datasets = [];
    const etfLabels = getETFLabels();

    // Display ETFs (background) based on toggle visibility
    if (isEtfVisible('SPY')) {
      datasets.push({
        label: etfLabels.spy,
        data: filteredRows.map(d => d.SPY),
        borderColor: 'rgba(102, 126, 234, 0.4)',
        backgroundColor: 'rgba(102, 126, 234, 0.05)',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.4,
        borderDash: [3, 3],
        order: 6,
      });
    }
    if (isEtfVisible('IEF')) {
      datasets.push({
        label: etfLabels.ief,
        data: filteredRows.map(d => d.IEF),
        borderColor: 'rgba(107, 114, 128, 0.4)',
        backgroundColor: 'rgba(107, 114, 128, 0.05)',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.4,
        borderDash: [3, 3],
        order: 5,
      });
    }
    if (isEtfVisible('GLD')) {
      datasets.push({
        label: etfLabels.gld,
        data: filteredRows.map(d => d.GLD),
        borderColor: 'rgba(156, 163, 175, 0.4)',
        backgroundColor: 'rgba(156, 163, 175, 0.05)',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.4,
        borderDash: [3, 3],
        order: 4,
      });
    }
    if (isEtfVisible('EFA')) {
      datasets.push({
        label: etfLabels.efa,
        data: filteredRows.map(d => d.EFA),
        borderColor: 'rgba(129, 140, 248, 0.35)',
        backgroundColor: 'rgba(129, 140, 248, 0.05)',
        borderWidth: 1.3,
        pointRadius: 0,
        tension: 0.4,
        borderDash: [4, 3],
        order: 3,
      });
    }
    if (isEtfVisible('EEM')) {
      datasets.push({
        label: etfLabels.eem,
        data: filteredRows.map(d => d.EEM),
        borderColor: 'rgba(248, 113, 113, 0.35)',
        backgroundColor: 'rgba(248, 113, 113, 0.05)',
        borderWidth: 1.3,
        pointRadius: 0,
        tension: 0.4,
        borderDash: [4, 4],
        order: 2,
      });
    }

    // Always show all portfolio strategies using STRATEGY_CONFIG
    // This makes it easy to add/modify strategies in the future
    Object.entries(STRATEGY_CONFIG).forEach(([strategyKey, config]) => {
      const hasSeries = filteredRows.some(
        (point) => typeof point[config.dataKey] === 'number'
      );
      if (!hasSeries) {
        return;
      }

      const isActive = strategy === strategyKey;

      // Make selected portfolio very prominent, others faded but visible
      const opacity = isActive ? 1.0 : 0.3;
      const borderWidthMultiplier = isActive ? 1.5 : 0.7;

      datasets.push({
        label: getStrategyLabel(config.labelKey),
        data: filteredRows.map((point) => point[config.dataKey]),
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

  function calculateLocalMetricsFromSeries(series) {
    if (!Array.isArray(series) || series.length < 2) {
      return null;
    }

    const sanitized = series.filter(
      (value) => typeof value === 'number' && !Number.isNaN(value)
    );

    if (sanitized.length < 2) {
      return null;
    }

    const startValue = sanitized[0];
    const endValue = sanitized[sanitized.length - 1];
    if (startValue === 0) {
      return null;
    }

    const totalReturn = ((endValue - startValue) / startValue) * 100;
    const returns = [];

    for (let i = 1; i < sanitized.length; i++) {
      const prev = sanitized[i - 1];
      const curr = sanitized[i];
      if (prev === 0) {
        return null;
      }
      returns.push((curr - prev) / prev);
    }

    if (returns.length === 0) {
      return null;
    }

    const meanReturn = returns.reduce((sum, value) => sum + value, 0) / returns.length;
    const variance =
      returns.reduce((sum, value) => sum + Math.pow(value - meanReturn, 2), 0) /
      returns.length;
    const monthlyVolatility = Math.sqrt(variance);
    const annualVolatility = monthlyVolatility * Math.sqrt(12) * 100;

    const years = (sanitized.length - 1) / 12;
    const annualReturn =
      years > 0 ? (Math.pow(1 + totalReturn / 100, 1 / years) - 1) * 100 : totalReturn;

    const riskFreeRate = 0.02;
    const sharpeRatio =
      annualVolatility > 0
        ? (annualReturn / 100 - riskFreeRate) / (annualVolatility / 100)
        : 0;

    let peak = sanitized[0];
    let maxDrawdown = 0;

    sanitized.forEach((value) => {
      if (value > peak) {
        peak = value;
      }
      const drawdown = (value - peak) / peak;
      if (drawdown < maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    return {
      totalReturn,
      annualReturn,
      volatility: annualVolatility,
      sharpeRatio,
      maxDrawdown: maxDrawdown * 100,
    };
  }

  function resetMetricDisplay() {
    ['totalReturn', 'annualReturn', 'volatility', 'sharpeRatio', 'maxDrawdown', 'calmarRatio'].forEach(
      (id) => {
        const element = document.getElementById(id);
        if (element) {
          element.textContent = '--';
        }
      }
    );
  }

  function removeCustomStrategyData(data = portfolioData) {
    if (!data || !Array.isArray(data.data)) {
      return;
    }

    data.data.forEach((row) => {
      if (row && Object.prototype.hasOwnProperty.call(row, 'customMix')) {
        delete row.customMix;
      }
    });

    if (data.metrics && Object.prototype.hasOwnProperty.call(data.metrics, 'customMix')) {
      delete data.metrics.customMix;
    }

    if (Array.isArray(data.strategyKeys)) {
      data.strategyKeys = data.strategyKeys.filter((key) => key !== 'customMix');
    }
  }

  function applyCustomStrategyToData(data) {
    if (!data || !Array.isArray(data.data)) {
      return false;
    }

    const configA = STRATEGY_CONFIG[customStrategyState.strategyA];
    const configB = STRATEGY_CONFIG[customStrategyState.strategyB];

    if (!configA || !configB) {
      return false;
    }

    const weightA = customStrategyState.weight / 100;
    const weightB = 1 - weightA;
    const composedSeries = [];

    for (const row of data.data) {
      if (
        typeof row[configA.dataKey] !== 'number' ||
        typeof row[configB.dataKey] !== 'number'
      ) {
        return false;
      }

      const rawValue = weightA * row[configA.dataKey] + weightB * row[configB.dataKey];
      const rounded = Math.round(rawValue * 100) / 100;
      row.customMix = rounded;
      composedSeries.push(rawValue);
    }

    const metrics = calculateLocalMetricsFromSeries(composedSeries);
    if (!metrics) {
      return false;
    }

    data.metrics = data.metrics || {};
    data.metrics.customMix = metrics;

    if (Array.isArray(data.strategyKeys)) {
      if (!data.strategyKeys.includes('customMix')) {
        data.strategyKeys.push('customMix');
      }
    } else {
      data.strategyKeys = ['customMix'];
    }

    return true;
  }

  function refreshCustomStrategyDataset({ forceDisable = false } = {}) {
    if (!portfolioData) {
      return;
    }

    removeCustomStrategyData(portfolioData);

    // FIX: Always invalidate normalized cache before regeneration
    delete portfolioData.normalizedCache;

    if (!customStrategyState.enabled || forceDisable) {
      ensureNormalizedCache(portfolioData);
      return;
    }

    const success = applyCustomStrategyToData(portfolioData);
    if (!success) {
      console.warn('Unable to compute custom strategy mix with the selected configuration.');
      customStrategyState.enabled = false;
      persistCustomStrategyState();
      removeCustomStrategyData(portfolioData);
    }

    // FIX: Force cache regeneration with new custom data
    ensureNormalizedCache(portfolioData);
  }

  function setActiveStrategyPill(strategyKey) {
    const pills = document.querySelectorAll('.strategy-pill');
    pills.forEach((pill) => {
      const key = pill.getAttribute('data-strategy');
      if (key === strategyKey) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  }

  function cacheCustomStrategyElements() {
    customStrategyElements.panel = document.getElementById('customStrategyPanel');
    customStrategyElements.alert = document.getElementById('customStrategyAlert');
    customStrategyElements.selectA = document.getElementById('customStrategyA');
    customStrategyElements.selectB = document.getElementById('customStrategyB');
    customStrategyElements.weight = document.getElementById('customStrategyWeight');
    customStrategyElements.weightValue = document.getElementById('customStrategyWeightValue');
    customStrategyElements.apply = document.getElementById('customStrategyApply');
    customStrategyElements.reset = document.getElementById('customStrategyReset');
  }

  function getBaseStrategyKeys() {
    return Object.keys(STRATEGY_CONFIG).filter((key) => key !== 'customMix');
  }

  function populateSelectOptions(selectElement, selectedValue) {
    if (!selectElement) return;

    const baseKeys = getBaseStrategyKeys();
    selectElement.innerHTML = '';

    baseKeys.forEach((key) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = getStrategyLabel(STRATEGY_CONFIG[key].labelKey);
      selectElement.appendChild(option);
    });

    if (!baseKeys.includes(selectedValue)) {
      selectedValue = baseKeys[0];
    }

    selectElement.value = selectedValue;
    return selectedValue;
  }

  function populateCustomStrategyOptions() {
    const resolvedA = populateSelectOptions(
      customStrategyElements.selectA,
      customStrategyState.strategyA
    );
    const resolvedB = populateSelectOptions(
      customStrategyElements.selectB,
      customStrategyState.strategyB
    );
    if (resolvedA) {
      customStrategyState.strategyA = resolvedA;
    }
    if (resolvedB) {
      customStrategyState.strategyB = resolvedB;
    }
  }

  function updateCustomWeightDisplay(weight) {
    if (!customStrategyElements.weightValue) return;
    const strategyBPercent = 100 - weight;
    customStrategyElements.weightValue.innerHTML = `<strong>${weight}%</strong> A &nbsp;·&nbsp; <span>${strategyBPercent}%</span> B`;
  }

  function updateCustomAlert() {
    if (!customStrategyElements.alert) return;
    customStrategyElements.alert.style.display = customStrategyState.enabled ? 'none' : 'block';
  }

  function toggleCustomPanel(shouldShow) {
    if (!customStrategyElements.panel) return;
    if (shouldShow) {
      customStrategyElements.panel.classList.remove('hidden');
      updateCustomAlert();
    } else {
      customStrategyElements.panel.classList.add('hidden');
    }
  }

  function markCustomStrategyDirty() {
    customStrategyState.enabled = false;
    persistCustomStrategyState();
    removeCustomStrategyData(portfolioData);
    updateCustomAlert();

    if (currentStrategy === 'customMix') {
      resetMetricDisplay();
      if (portfolioData) {
        updateChart(portfolioData, currentStrategy);
      }
    }
    updateSimulatorState(portfolioData);
    setExportStatus('ready');
  }

  function applyCustomStrategyFromInputs() {
    if (!portfolioData) {
      return;
    }

    customStrategyState.strategyA = customStrategyElements.selectA.value;
    customStrategyState.strategyB = customStrategyElements.selectB.value;
    customStrategyState.weight = parseInt(customStrategyElements.weight.value, 10);
    customStrategyState.enabled = true;
    persistCustomStrategyState();

    refreshCustomStrategyDataset();
    updateCustomAlert();

    setActiveStrategyPill('customMix');
    currentStrategy = 'customMix';

    // FIX: Force chart update with animation for user feedback
    if (portfolioChart) {
      updateChart(portfolioData, currentStrategy);
      portfolioChart.update('active'); // 'active' animation mode
    }

    updateMetrics(portfolioData, currentStrategy);
    updateSimulatorState(portfolioData);
    setExportStatus('ready');

    trackSimulatorEvent('custom_strategy_applied', {
      base_strategy_a: customStrategyState.strategyA,
      base_strategy_b: customStrategyState.strategyB,
      weight_a_percent: customStrategyState.weight,
      weight_b_percent: 100 - customStrategyState.weight,
    });
  }

  function resetCustomStrategy() {
    customStrategyState = { ...DEFAULT_CUSTOM_STRATEGY };
    persistCustomStrategyState();
    populateCustomStrategyOptions();
    if (customStrategyElements.weight) {
      customStrategyElements.weight.value = customStrategyState.weight;
    }
    updateCustomWeightDisplay(customStrategyState.weight);
    refreshCustomStrategyDataset({ forceDisable: true });
    updateCustomAlert();
    if (currentStrategy === 'customMix') {
      resetMetricDisplay();
      if (portfolioData) {
        updateChart(portfolioData, currentStrategy);
        updateSimulatorState(portfolioData);
      }
    }
    setExportStatus('ready');
    trackSimulatorEvent('custom_strategy_reset');
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
      layout: {
        padding: {
          top: mobile ? 12 : 16,
          bottom: mobile ? 12 : 20,
          left: mobile ? 8 : 24,
          right: mobile ? 8 : 24,
        },
      },
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
      sixtyForty: 'sixtyForty',
      momentumTilt: 'momentumTilt',
      hierarchicalRiskParity: 'hierarchicalRiskParity',
      customMix: 'customMix',
    }[strategy];

    const metrics = data.metrics[strategyKey];
    if (!metrics) {
      resetMetricDisplay();
      return;
    }

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
  async function loadPortfolioData(strategy, period, leverage = 1) {
    try {
      const result = await fetchPortfolioData(period, leverage);

      if (result) {
        portfolioData = result;
        ensureNormalizedCache(portfolioData);
        currentPeriod = result.periodYears || period || currentPeriod;

        refreshCustomStrategyDataset();
        updateChart(portfolioData, strategy);
        updateMetrics(portfolioData, strategy);
        updateSimulatorState(portfolioData);
        updateCustomAlert();
        setExportStatus('ready');

        trackSimulatorEvent('simulator_data_loaded', {
          data_points: Array.isArray(portfolioData.data) ? portfolioData.data.length : 0,
          period_years: currentPeriod,
          generated_at: portfolioData.generatedAt || null,
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
    hideMobileTooltip();
    currentStrategy = strategy;
    setActiveStrategyPill(strategy);
    toggleCustomPanel(strategy === 'customMix');

    const sliderState = getSliderStateById('strategySlider');
    if (sliderState) {
      const targetIndex = sliderState.slides.findIndex(
        (slide) => slide.getAttribute('data-strategy') === strategy
      );
      if (targetIndex >= 0) {
        scrollSliderToIndex(sliderState, targetIndex);
      }
    }

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
    hideMobileTooltip();
    currentPeriod = period;

    trackSimulatorEvent('period_selected', { period_years: period });
    loadPortfolioData(currentStrategy, period);

    // Analytics tracking (if available)
    trackSimulatorEvent('period_changed', { period_years: period });
  }

  /**
   * Mobile slider helpers (strategy & metrics cards)
   */
  function getSliderStateById(id) {
    return mobileSliderInstances.get(id);
  }

  function updateSliderUi(state) {
    state.slides.forEach((slide, index) => {
      slide.classList.toggle('is-active', index === state.currentIndex);
    });

    if (state.dotsContainer) {
      const dots = state.dotsContainer.querySelectorAll('.slider-dot');
      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === state.currentIndex);
      });
    }

    if (state.prevBtn) {
      state.prevBtn.disabled = state.currentIndex === 0;
    }
    if (state.nextBtn) {
      state.nextBtn.disabled = state.currentIndex >= state.slides.length - 1;
    }
  }

  function scrollSliderToIndex(state, requestedIndex, behavior = 'smooth') {
    const targetIndex = Math.max(0, Math.min(requestedIndex, state.slides.length - 1));
    const targetSlide = state.slides[targetIndex];
    if (!targetSlide) {
      return;
    }
    state.currentIndex = targetIndex;
    state.track.scrollTo({
      left: targetSlide.offsetLeft,
      behavior,
    });
    updateSliderUi(state);
  }

  function syncSliderIndexWithScroll(state) {
    hideMobileTooltip();
    let closestIndex = state.currentIndex;
    let minDistance = Number.POSITIVE_INFINITY;
    const scrollLeft = state.track.scrollLeft;

    state.slides.forEach((slide, index) => {
      const distance = Math.abs(slide.offsetLeft - scrollLeft);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex !== state.currentIndex) {
      state.currentIndex = closestIndex;
      updateSliderUi(state);
    }
  }

  function initializeSlider(wrapperId, trackSelector) {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) {
      return;
    }
    const track = wrapper.querySelector(trackSelector);
    if (!track) {
      return;
    }
    const slides = Array.from(track.children);
    if (slides.length <= 1) {
      return;
    }

    const prevBtn = wrapper.querySelector('[data-slider-prev]');
    const nextBtn = wrapper.querySelector('[data-slider-next]');
    const dotsContainer = wrapper.querySelector('[data-slider-dots]');

    const state = {
      id: wrapperId,
      wrapper,
      track,
      slides,
      prevBtn,
      nextBtn,
      dotsContainer,
      currentIndex: 0,
      scrollTimeout: null,
      scrollHandler: null,
      resizeHandler: null,
      prevHandler: null,
      nextHandler: null,
    };

    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'slider-dot';
        dot.setAttribute('aria-label', `Slide ${index + 1}`);
        dot.addEventListener('click', () => scrollSliderToIndex(state, index));
        dotsContainer.appendChild(dot);
      });
    }

    if (prevBtn) {
      state.prevHandler = () => scrollSliderToIndex(state, state.currentIndex - 1);
      prevBtn.addEventListener('click', state.prevHandler);
    }

    if (nextBtn) {
      state.nextHandler = () => scrollSliderToIndex(state, state.currentIndex + 1);
      nextBtn.addEventListener('click', state.nextHandler);
    }

    state.scrollHandler = () => {
      if (state.scrollTimeout) {
        window.clearTimeout(state.scrollTimeout);
      }
      state.scrollTimeout = window.setTimeout(() => syncSliderIndexWithScroll(state), 80);
    };
    state.track.addEventListener('scroll', state.scrollHandler, { passive: true });

    state.resizeHandler = () => {
      scrollSliderToIndex(state, state.currentIndex, 'auto');
    };
    window.addEventListener('resize', state.resizeHandler);

    wrapper.classList.add('slider-enabled');
    scrollSliderToIndex(state, 0, 'auto');
    mobileSliderInstances.set(wrapperId, state);
  }

  function destroySlider(state) {
    if (!state) {
      return;
    }
    if (state.prevBtn && state.prevHandler) {
      state.prevBtn.removeEventListener('click', state.prevHandler);
    }
    if (state.nextBtn && state.nextHandler) {
      state.nextBtn.removeEventListener('click', state.nextHandler);
    }
    if (state.scrollHandler) {
      state.track.removeEventListener('scroll', state.scrollHandler);
    }
    if (state.resizeHandler) {
      window.removeEventListener('resize', state.resizeHandler);
    }
    if (state.dotsContainer) {
      state.dotsContainer.innerHTML = '';
    }
    state.slides.forEach((slide) => slide.classList.remove('is-active'));
    state.wrapper.classList.remove('slider-enabled');
  }

  function enableMobileSliders() {
    SLIDER_CONFIGS.forEach((config) => {
      if (mobileSliderInstances.has(config.id)) {
        return;
      }
      initializeSlider(config.id, config.trackSelector);
    });
  }

  function disableMobileSliders() {
    Array.from(mobileSliderInstances.entries()).forEach(([key, state]) => {
      destroySlider(state);
      mobileSliderInstances.delete(key);
    });
  }

  function initializeMobileSliderController() {
    if (!mobileSliderQuery) {
      return;
    }

    const handleChange = (event) => {
      if (event.matches) {
        enableMobileSliders();
      } else {
        disableMobileSliders();
      }
    };

    if (typeof mobileSliderQuery.addEventListener === 'function') {
      mobileSliderQuery.addEventListener('change', handleChange);
    } else if (typeof mobileSliderQuery.addListener === 'function') {
      mobileSliderQuery.addListener(handleChange);
    }
    handleChange(mobileSliderQuery);
  }

  function shouldUseMobileTooltip() {
    return Boolean(mobileSliderQuery && mobileSliderQuery.matches);
  }

  function ensureMobileTooltipOverlay() {
    if (mobileTooltipState.overlay) {
      return mobileTooltipState.overlay;
    }
    const overlay = document.createElement('div');
    overlay.className = 'mobile-tooltip-bubble';
    const content = document.createElement('div');
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    mobileTooltipState.overlay = overlay;
    mobileTooltipState.content = content;
    return overlay;
  }

  function hideMobileTooltip() {
    if (!mobileTooltipState.overlay) {
      return;
    }
    mobileTooltipState.overlay.classList.remove('is-visible');
    mobileTooltipState.overlay.style.top = '';
    mobileTooltipState.overlay.style.left = '';
    if (mobileTooltipState.overlay.dataset) {
      delete mobileTooltipState.overlay.dataset.position;
    }
    mobileTooltipState.currentTrigger = null;
  }

  function positionMobileTooltip(trigger) {
    if (!mobileTooltipState.overlay) {
      return;
    }
    const overlay = mobileTooltipState.overlay;
    const triggerRect = trigger.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const minPadding = 16;
    const overlayRect = overlay.getBoundingClientRect();

    let top = triggerRect.top + window.scrollY - overlayRect.height - 16;
    let position = 'top';
    if (top < window.scrollY + 16) {
      top = triggerRect.bottom + window.scrollY + 16;
      position = 'bottom';
    }

    const triggerCenterX = triggerRect.left + triggerRect.width / 2;
    let left = triggerCenterX - overlayRect.width / 2;
    let arrowOffset = overlayRect.width / 2;

    if (left < minPadding) {
      arrowOffset += left - minPadding;
      left = minPadding;
    }
    if (left + overlayRect.width > viewportWidth - minPadding) {
      const diff = left + overlayRect.width - (viewportWidth - minPadding);
      left -= diff;
      arrowOffset += diff;
    }

    overlay.style.top = `${top}px`;
    overlay.style.left = `${left}px`;
    overlay.dataset.position = position;
    overlay.style.setProperty(
      '--tooltip-arrow-offset',
      `${Math.max(20, Math.min(overlayRect.width - 20, arrowOffset))}px`
    );
  }

  function showMobileTooltip(trigger) {
    if (!shouldUseMobileTooltip()) {
      return;
    }
    const tooltip = trigger.querySelector('[data-tooltip]');
    if (!tooltip) {
      return;
    }
    const html = tooltip.innerHTML?.trim();
    if (!html) {
      return;
    }

    const overlay = ensureMobileTooltipOverlay();
    mobileTooltipState.content.innerHTML = html;
    mobileTooltipState.currentTrigger = trigger;
    overlay.style.visibility = 'hidden';
    overlay.classList.add('is-visible');
    overlay.style.top = '0px';
    overlay.style.left = '0px';

    requestAnimationFrame(() => {
      positionMobileTooltip(trigger);
      overlay.style.visibility = 'visible';
    });
  }

  function bindPressTooltip(trigger) {
    let pressTimer = null;
    const PRESS_DELAY = 450;

    const startPress = () => {
      if (!shouldUseMobileTooltip()) {
        return;
      }
      if (pressTimer) {
        clearTimeout(pressTimer);
      }
      pressTimer = window.setTimeout(() => {
        hideMobileTooltip();
        showMobileTooltip(trigger);
      }, PRESS_DELAY);
    };

    const cancelPress = () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    };

    trigger.addEventListener('touchstart', startPress, { passive: true });
    trigger.addEventListener('touchend', cancelPress);
    trigger.addEventListener('touchcancel', cancelPress);
    trigger.addEventListener('touchmove', cancelPress);
  }

  function bindTapTooltip(trigger) {
    trigger.addEventListener('click', (event) => {
      if (!shouldUseMobileTooltip()) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (mobileTooltipState.currentTrigger === trigger) {
        hideMobileTooltip();
      } else {
        hideMobileTooltip();
        showMobileTooltip(trigger);
      }
    });
  }

  function bindTooltipTriggers() {
    const triggers = document.querySelectorAll('[data-tooltip-behavior]');
    triggers.forEach((trigger) => {
      if (trigger.dataset.tooltipBound === 'true') {
        return;
      }
      trigger.dataset.tooltipBound = 'true';
      const behavior = trigger.getAttribute('data-tooltip-behavior');
      if (behavior === 'press') {
        bindPressTooltip(trigger);
      } else {
        bindTapTooltip(trigger);
      }
    });
  }

  function initializeMobileTooltipSystem() {
    if (mobileTooltipState.initialized) {
      return;
    }
    mobileTooltipState.initialized = true;
    bindTooltipTriggers();

    document.addEventListener('click', (event) => {
      if (!shouldUseMobileTooltip()) {
        return;
      }
      if (
        mobileTooltipState.overlay &&
        mobileTooltipState.overlay.contains(event.target)
      ) {
        return;
      }
      if (event.target.closest('[data-tooltip-behavior]')) {
        return;
      }
      hideMobileTooltip();
    });

    window.addEventListener(
      'scroll',
      () => {
        if (shouldUseMobileTooltip()) {
          hideMobileTooltip();
        }
      },
      { passive: true }
    );

    window.addEventListener('resize', hideMobileTooltip);
    if (mobileSliderQuery && typeof mobileSliderQuery.addEventListener === 'function') {
      mobileSliderQuery.addEventListener('change', hideMobileTooltip);
    }
  }

  /**
   * Initialize simulator
   */
  /**
   * Initialize leverage toggle functionality
   */
  function initializeLeverageToggle() {
    const leveragePills = document.querySelectorAll('.leverage-pill');
    const leverageWarning = document.getElementById('leverageWarning');

    leveragePills.forEach(pill => {
      pill.addEventListener('click', () => {
        const leverage = parseInt(pill.getAttribute('data-leverage'));

        // Update active state
        leveragePills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        // Show/hide warning
        if (leverageWarning) {
          if (leverage === 2) {
            leverageWarning.classList.remove('hidden');
          } else {
            leverageWarning.classList.add('hidden');
          }
        }

        // Update global state
        currentLeverage = leverage;

        // Reload portfolio data with new leverage
        loadPortfolioData(currentStrategy, currentPeriod, leverage);

        // Track analytics
        trackSimulatorEvent('leverage_changed', {
          leverage,
          strategy: currentStrategy,
          period: currentPeriod
        });
      });
    });
  }

  function initializeSimulator() {
    loadCustomStrategyState();
    applyQueryParams();
    cacheCustomStrategyElements();
    populateCustomStrategyOptions();
    if (customStrategyElements.weight) {
      customStrategyElements.weight.value = customStrategyState.weight;
    }
    updateCustomWeightDisplay(customStrategyState.weight);
    updateCustomAlert();
    toggleCustomPanel(false);
    initializeExportActions();
    if (customStrategyState.enabled && currentStrategy === 'customMix') {
      updateCustomAlert();
      toggleCustomPanel(true);
    }

    if (customStrategyElements.selectA) {
      customStrategyElements.selectA.addEventListener('change', (event) => {
        customStrategyState.strategyA = event.target.value;
        markCustomStrategyDirty();
      });
    }

    if (customStrategyElements.selectB) {
      customStrategyElements.selectB.addEventListener('change', (event) => {
        customStrategyState.strategyB = event.target.value;
        markCustomStrategyDirty();
      });
    }

    if (customStrategyElements.weight) {
      customStrategyElements.weight.addEventListener('input', (event) => {
        const value = parseInt(event.target.value, 10);
        customStrategyState.weight = Number.isNaN(value) ? customStrategyState.weight : value;
        updateCustomWeightDisplay(customStrategyState.weight);
        markCustomStrategyDirty();
      });
    }

    if (customStrategyElements.apply) {
      customStrategyElements.apply.addEventListener('click', applyCustomStrategyFromInputs);
    }

    if (customStrategyElements.reset) {
      customStrategyElements.reset.addEventListener('click', resetCustomStrategy);
    }

    initializeEtfToggleControls();

    // Load initial data
    loadPortfolioData(currentStrategy, currentPeriod);

    trackSimulatorEvent('simulator_page_initialized');

    // Strategy pills interaction
    const pills = document.querySelectorAll('.strategy-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
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

    setActiveStrategyPill(currentStrategy);
    toggleCustomPanel(currentStrategy === 'customMix');
    initializeLeverageToggle(); // NEW: Initialize leverage toggle
    initializeMobileSliderController();
    initializeMobileTooltipSystem();
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
    populateCustomStrategyOptions();
    updateCustomWeightDisplay(customStrategyState.weight);
    updateCustomAlert();
    setExportStatus('ready');
    updateEtfToggleLabels();
    refreshEtfToggleUi();
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
