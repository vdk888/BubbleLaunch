/**
 * Tool Execution Service
 * Wraps existing BubbleLaunch services as tools for chatbot interaction
 */

const fs = require('fs/promises');
const path = require('path');
let Ajv;
try {
  Ajv = require('ajv');
} catch (e) {
  Ajv = null;
  console.warn('AJV not installed; tool input validation will be skipped.');
}
const arenaTimelineService = require('./arenaTimelineService');
const strategyBuilderService = require('./strategyBuilderService');
const portfolioService = require('./portfolioService');

const ajv = Ajv ? new Ajv({ allErrors: true, strict: true }) : null;

const TOOLS = {
  get_profile_visualization: {
    name: 'get_profile_visualization',
    description: `
      Retrieve the current investor profile including risk score (0-100), confidence, goals, horizon, knowledge level,
      and detected personality traits. Use this when the user asks to "see my profile", "what's my risk score", or wants
      a recap of their onboarding. If include_recommendations is true, also return strategy/bot suggestions (e.g., Fox/Hedgehog/Hawk)
      mapped to the risk score. Always call this tool instead of guessing the user's profile from memory.
    `.trim(),
    input_schema: {
      type: 'object',
      properties: {
        include_recommendations: {
          type: 'boolean',
          description: 'If true, also return strategy/bot recommendations based on the current risk profile'
        }
      },
      required: [],
      additionalProperties: false
    },
    input_examples: [
      { include_recommendations: false },
      { include_recommendations: true }
    ],
    execute: async ({ include_recommendations = false, profile: injectedProfile = null }) => {
      // Check if we have a real profile from BubbleAgentMemory
      const userProfile = injectedProfile;

      // Return structured error if profile is missing or incomplete
      if (!userProfile || userProfile.riskScore === null || userProfile.riskScore === undefined) {
        return {
          type: "PROFILE_INCOMPLETE",
          message: "Profile not yet discovered",
          hint: "Continue chatting to build your investment profile",
          visualizationUrl: "/investors/playground"
        };
      }

      // Use real data from BubbleAgentMemory
      const profile = {
        riskScore: userProfile.riskScore,
        riskConfidence: userProfile.riskConfidence || 0,
        traits: userProfile.traits || [],
        goal: userProfile.investmentGoal || userProfile.goal || null,
        horizon: userProfile.investmentHorizon || userProfile.horizon || null,
        level: userProfile.knowledgeLevel || userProfile.level || null
      };

      // Calculate suggested allocation based on risk score
      const riskScore = Math.min(Math.max(profile.riskScore, 0), 100);
      const allocation = {
        stocks: riskScore,
        bonds: Math.max(100 - riskScore - 5, 0),
        gold: 5
      };

      // Generate personalized bot recommendations based on risk score
      let recommendations = [];
      if (include_recommendations) {
        if (riskScore <= 30) {
          // Conservative: 0-30
          recommendations = [
            { bot: 'Hedgehog', strategy: 'Defensive', match: 'best', description: 'Prioritizes capital preservation and stability' },
            { bot: 'Fox', strategy: 'Risk Parity', match: 'good', description: 'Balanced approach with risk management' }
          ];
        } else if (riskScore <= 70) {
          // Balanced: 30-70
          recommendations = [
            { bot: 'Fox', strategy: 'Risk Parity', match: 'best', description: 'Optimal balance between risk and return' },
            { bot: 'Hedgehog', strategy: 'Defensive', match: 'good', description: 'For more conservative allocation' },
            { bot: 'Hawk', strategy: 'Momentum', match: 'moderate', description: 'For growth-oriented portion' }
          ];
        } else {
          // Aggressive: 70-100
          recommendations = [
            { bot: 'Hawk', strategy: 'Momentum', match: 'best', description: 'Captures market trends for maximum growth' },
            { bot: 'Fox', strategy: 'Risk Parity', match: 'good', description: 'For a more balanced core' }
          ];
        }
      }

      return {
        profile,
        allocation,
        recommendations,
        visualizationUrl: '/investors/playground#profile'
      };
    }
  },

  recommend_learning_path: {
    name: 'recommend_learning_path',
    description: `
      Recommend a personalized learning sequence (guides/resources) based on the investor's profile (risk tolerance, knowledge level,
      goals, learning style). Call when the user asks "what should I learn next" or needs a curated path.
    `.trim(),
    input_schema: {
      type: 'object',
      properties: {
        focus_area: {
          type: 'string',
          enum: ['fundamentals', 'strategies', 'risk_management', 'tools'],
          description: 'Primary learning focus area'
        },
        max_resources: {
          type: 'integer',
          description: 'Maximum number of resources to recommend (default: 5, max: 10)'
        }
      },
      required: [],
      additionalProperties: false
    },
    input_examples: [
      { focus_area: 'fundamentals', max_resources: 3 },
      { focus_area: 'strategies' }
    ],
    execute: async ({ focus_area = 'fundamentals', max_resources = 5 }) => {
      const allResources = [
        { id: 'guide-00', title: 'Comprendre les Placements', level: 'beginner', topic: 'fundamentals' },
        { id: 'guide-01', title: 'Placement Sécurisé', level: 'beginner', topic: 'risk_management' },
        { id: 'guide-02', title: 'Investir dans les ETF', level: 'beginner', topic: 'fundamentals' },
        { id: 'guide-03', title: 'Composer Ta Stratégie', level: 'intermediate', topic: 'strategies' },
        { id: 'guide-04', title: 'Stock-Picking', level: 'advanced', topic: 'strategies' },
        { id: 'guide-05', title: 'Stratégies et Facteurs', level: 'advanced', topic: 'strategies' },
        { id: 'guide-06', title: 'Allocation Dynamique', level: 'advanced', topic: 'tools' }
      ];

      const filtered = focus_area
        ? allResources.filter(r => r.topic === focus_area)
        : allResources;

      return {
        resources: filtered.slice(0, max_resources),
        nextSteps: [
          'Start with the recommended guides in order',
          'Test strategies in the Arena to see them in action',
          'Build your custom mix in the Simulator'
        ]
      };
    }
  },

  explain_bot_trade: {
    name: 'explain_bot_trade',
    description: `
      Explain why a specific AI bot (Hedgehog, Fox, Hawk, Bear) made a trade at a given timeline frame.
      Use when the user asks "why did Hawk buy here?" or wants educational context on a trade.
      Returns date, PnL, event info, and a dialogue snippet if available.
    `.trim(),
    input_schema: {
      type: 'object',
      properties: {
        bot_name: {
          type: 'string',
          enum: ['Hedgehog', 'Fox', 'Hawk', 'Bear'],
          description: 'The AI bot mascot to explain'
        },
        frame_index: {
          type: 'integer',
          description: 'Index of the frame in arena timeline (0-239 for 20 years monthly)'
        },
        level: {
          type: 'string',
          enum: ['beginner', 'intermediate', 'advanced'],
          description: 'Explanation depth level'
        }
      },
      required: ['bot_name', 'frame_index'],
      additionalProperties: false
    },
    input_examples: [
      { bot_name: 'Hawk', frame_index: 120, level: 'beginner' },
      { bot_name: 'Fox', frame_index: 42 }
    ],
    execute: async ({ bot_name, frame_index, level = 'intermediate' }) => {
      const timeline = await arenaTimelineService.getTimeline('fr');
      const frame = timeline.frames[frame_index];
      if (!frame) {
        return { error: 'Frame not found' };
      }

      const botIdMap = { Hedgehog: 'equi', Fox: 'pari', Hawk: 'momo', Bear: 'sage' };
      const botId = botIdMap[bot_name];
      const botData = frame.bots[botId];
      const event = frame.event;

      let dialogue = null;
      if (event) {
        dialogue = arenaTimelineService.getBotDialogue(botId, event.type, 'fr');
      }

      return {
        bot: bot_name,
        date: frame.date,
        value: botData?.value,
        pnl: botData?.pnl,
        event,
        dialogue,
        explanation: `At this point, ${bot_name} ${botData?.pnl > 0 ? 'gained' : 'lost'} ${Math.abs(botData?.pnl || 0).toFixed(2)}%. ${dialogue?.text || ''}`,
        level,
      };
    }
  },

  backtest_strategy: {
    name: 'backtest_strategy',
    description: `
      Execute a backtest for a user-defined portfolio allocation (e.g., SPY/IEF/GLD) over 1-20 years.
      Use when the user requests a test like "60% actions / 40% obligations sur 20 ans" or "backtest this mix".
      Returns performance metrics and a chart URL to visualize the equity curve.
    `.trim(),
    input_schema: {
      type: 'object',
      properties: {
        strategy_name: {
          type: 'string',
          description: 'Name of the strategy or custom mix'
        },
        allocation: {
          type: 'object',
          properties: {
            SPY: { type: 'number', description: '% allocation to stocks (S&P 500)' },
            IEF: { type: 'number', description: '% allocation to bonds (7-10Y Treasury)' },
            GLD: { type: 'number', description: '% allocation to gold' }
          },
          description: 'Allocation percentages (must sum to 100)'
        },
        leverage: {
          type: 'number',
          description: 'Leverage multiplier (1.0 = unleveraged, 2.0 = 2x leverage)'
        },
        period_years: {
          type: 'integer',
          enum: [1, 3, 5, 10, 20],
          description: 'Historical period to backtest'
        }
      },
      required: ['strategy_name', 'allocation'],
      additionalProperties: false
    },
    input_examples: [
      {
        strategy_name: '60/40',
        allocation: { SPY: 60, IEF: 40, GLD: 0 },
        leverage: 1.0,
        period_years: 20
      }
    ],
    execute: async ({ strategy_name, allocation, leverage = 1.0, period_years = 20 }) => {
      const total = Object.values(allocation || {}).reduce((sum, val) => sum + val, 0);
      if (Math.abs(total - 100) > 0.01) {
        return { error: 'Allocation must sum to 100%' };
      }

      // Load cached price data for the requested period
      const cachePath = path.join(__dirname, '../cache/portfolio-preview-periods.json');
      let cache;
      try {
        const raw = await fs.readFile(cachePath, 'utf-8');
        cache = JSON.parse(raw);
      } catch (err) {
        console.error('backtest_strategy: failed to read cache', err);
        return { error: 'Historical cache unavailable. Please try again later.' };
      }

      const periodKey = String(period_years);
      const period = cache?.periods?.[periodKey];
      if (!period || !Array.isArray(period.data) || period.data.length === 0) {
        return { error: `No cached data for period ${period_years} ans.` };
      }

      const weights = {
        SPY: allocation.SPY || 0,
        IEF: allocation.IEF || 0,
        GLD: allocation.GLD || 0,
      };

      // Build custom equity curve
      const portfolioSeries = period.data.map((point, idx) => {
        const value =
          (point.SPY || 0) * (weights.SPY / 100) +
          (point.IEF || 0) * (weights.IEF / 100) +
          (point.GLD || 0) * (weights.GLD / 100);
        return { date: point.date, value };
      });

      const metrics = portfolioService.calculateMetrics(portfolioSeries);

      // Format metrics as percentages
      const formatted = {
        totalReturn: +(metrics.totalReturn * 100).toFixed(1),
        annualizedReturn: +(metrics.annualReturn * 100).toFixed(1),
        volatility: +(metrics.volatility * 100).toFixed(1),
        sharpeRatio: +metrics.sharpeRatio.toFixed(2),
        maxDrawdown: +(metrics.maxDrawdown * 100).toFixed(1),
        calmarRatio:
          metrics.maxDrawdown !== 0
            ? +((metrics.totalReturn / Math.abs(metrics.maxDrawdown))).toFixed(2)
            : 0,
      };

      return {
        strategy_name,
        allocation,
        metrics: formatted,
        chartUrl: null,
        chartData: portfolioSeries,
        period: {
          years: period_years,
          startDate: portfolioSeries[0]?.date,
          endDate: portfolioSeries[portfolioSeries.length - 1]?.date,
        },
      };
    }
  },

  compare_strategies: {
    name: 'compare_strategies',
    description: `
      Compare 2-3 AI bot strategies (Hedgehog, Fox, Hawk, Bear) side-by-side with key metrics and a recommendation.
      Use when the user asks to "compare Hedgehog vs Fox" or similar. Returns metrics and a suggested winner.
    `.trim(),
    input_schema: {
      type: 'object',
      properties: {
        strategies: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['Hedgehog', 'Fox', 'Hawk', 'Bear']
          },
          description: '2-3 bot strategies to compare'
        },
        metrics: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['return', 'volatility', 'sharpe', 'drawdown', 'calmar']
          },
          description: 'Which metrics to emphasize'
        }
      },
      required: ['strategies'],
      additionalProperties: false
    },
    input_examples: [
      { strategies: ['Hedgehog', 'Fox'], metrics: ['sharpe', 'drawdown'] },
      { strategies: ['Hawk', 'Fox', 'Bear'] }
    ],
    execute: async ({ strategies, metrics = ['return', 'sharpe', 'drawdown'] }) => {
      if (!Array.isArray(strategies) || strategies.length < 2 || strategies.length > 3) {
        return { error: 'Must compare 2-3 strategies' };
      }

      const strategyData = {
        Hedgehog: { return: 4.2, volatility: 8.1, sharpe: 0.52, drawdown: -15.3, calmar: 0.27 },
        Fox: { return: 6.8, volatility: 10.2, sharpe: 0.67, drawdown: -18.7, calmar: 0.36 },
        Hawk: { return: 9.3, volatility: 15.6, sharpe: 0.60, drawdown: -28.4, calmar: 0.32 },
        Bear: { return: 5.5, volatility: 9.3, sharpe: 0.59, drawdown: -16.2, calmar: 0.34 }
      };

      const comparison = strategies.map((s) => ({
        strategy: s,
        metrics: strategyData[s] || {}
      }));

      const winner = strategies.reduce((best, current) => {
        const bestSharpe = strategyData[best]?.sharpe || -Infinity;
        const currentSharpe = strategyData[current]?.sharpe || -Infinity;
        return currentSharpe > bestSharpe ? current : best;
      }, strategies[0]);

      return {
        comparison,
        metrics,
        winner,
        recommendation: 'Fox offers the best risk-adjusted returns (Sharpe ratio) for most investors.'
      };
    }
  }
};

async function executeTool(toolName, input) {
  const tool = TOOLS[toolName];
  if (!tool) {
    throw new Error(`Tool '${toolName}' not found`);
  }
  try {
    const effectiveInput = input || {};
    // Validate input against schema if available
    if (tool.input_schema && ajv) {
      const validate = ajv.compile(tool.input_schema);
      const valid = validate(effectiveInput);
      if (!valid) {
        return { success: false, error: 'Invalid tool arguments', details: validate.errors };
      }
    }
    const result = await tool.execute(effectiveInput);
    return { success: true, data: result };
  } catch (error) {
    console.error(`Tool execution error (${toolName}):`, error);
    return { success: false, error: error.message };
  }
}

function getToolDefinitions(toolNames = null) {
  const allTools = Object.values(TOOLS);

  const filtered = toolNames
    ? allTools.filter((t) => toolNames.includes(t.name))
    : allTools;

  // Return OpenAI / OpenRouter compatible function schemas
  return filtered.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    },
  }));
}

function getToolsForPageContext(pageContext) {
  switch (pageContext) {
    case 'playground':
      return getToolDefinitions(['get_profile_visualization', 'recommend_learning_path']);
    case 'arena':
    case 'education-arena':
    case 'education/arena':
    case 'education_arena':
      return getToolDefinitions(['explain_bot_trade', 'compare_strategies']);
    case 'simulator':
    case 'education-simulator':
    case 'education/simulator':
    case 'education_simulator':
      return getToolDefinitions(['backtest_strategy', 'compare_strategies']);
    default:
      return [];
  }
}

module.exports = {
  executeTool,
  getToolDefinitions,
  getToolsForPageContext,
  TOOLS
};
