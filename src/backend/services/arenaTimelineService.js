/**
 * Arena Timeline Service
 *
 * Serves 20-year historical data for the AI Trading Arena.
 * LEVERAGES EXISTING PORTFOLIO CACHE - no redundant data fetching.
 *
 * Bot Personas (per education plan):
 * - Équi: Equal Weight - calm, balanced, simple
 * - Pari: Risk Parity (Simple) - thoughtful, analytical
 * - Momo: Momentum - energetic, trend-following
 * - Sage: Enhanced Risk Parity (Defensive) - cautious, protective
 */

const fs = require('fs/promises');
const path = require('path');

// ═══════════════════════════════════════════════════════════════
// Bot Persona Definitions
// ═══════════════════════════════════════════════════════════════

const BOT_PERSONAS = {
  equi: {
    id: 'equi',
    name: { fr: 'Équi', en: 'Equi' },
    fullName: { fr: 'Équilibre', en: 'Balance' },
    strategy: 'equalWeight',
    strategyName: { fr: 'Allocation Égale', en: 'Equal Weight' },
    personality: { fr: 'Calme, équilibré, simple', en: 'Calm, balanced, simple' },
    color: '#6B7280',
    icon: 'scale-balanced',
    dialogueStyle: 'simple and direct',
  },
  pari: {
    id: 'pari',
    name: { fr: 'Pari', en: 'Pari' },
    fullName: { fr: 'Parité', en: 'Parity' },
    strategy: 'simpleRP',
    strategyName: { fr: 'Parité des Risques', en: 'Risk Parity' },
    personality: { fr: 'Réfléchi, analytique', en: 'Thoughtful, analytical' },
    color: '#667eea',
    icon: 'shield-chart',
    dialogueStyle: 'analytical and measured',
  },
  momo: {
    id: 'momo',
    name: { fr: 'Momo', en: 'Momo' },
    fullName: { fr: 'Momentum', en: 'Momentum' },
    strategy: 'momentum',
    strategyName: { fr: 'Momentum', en: 'Momentum' },
    personality: { fr: 'Énergique, suit les tendances', en: 'Energetic, trend-following' },
    color: '#F97316',
    icon: 'trending-up',
    dialogueStyle: 'enthusiastic and action-oriented',
  },
  sage: {
    id: 'sage',
    name: { fr: 'Sage', en: 'Sage' },
    fullName: { fr: 'Sage', en: 'Sage' },
    strategy: 'regimeAwareRP',
    strategyName: { fr: 'Parité Adaptative', en: 'Regime-Aware RP' },
    personality: { fr: 'Prudent, protecteur', en: 'Cautious, protective' },
    color: '#10B981',
    icon: 'shield-check',
    dialogueStyle: 'cautious and risk-aware',
  },
};

// Map bot IDs to strategy keys in cached data
const BOT_STRATEGY_MAP = {
  equi: 'equalWeight',
  pari: 'simpleRP',
  momo: 'momentum',
  sage: 'regimeAwareRP',
};

// ═══════════════════════════════════════════════════════════════
// Key Historical Events (12 events across 20 years)
// ═══════════════════════════════════════════════════════════════

const KEY_EVENTS = [
  // 2008-2010: Financial Crisis
  {
    date: '2008-09-15',
    label: { en: 'Lehman Brothers Collapse', fr: 'Faillite de Lehman Brothers' },
    type: 'crash',
    lesson: {
      en: 'How defensive strategies protect during systemic risk',
      fr: 'Comment les stratégies défensives protègent pendant les crises systémiques',
    },
  },
  {
    date: '2009-03-09',
    label: { en: 'Market Bottom', fr: 'Point bas du marché' },
    type: 'recovery',
    lesson: {
      en: 'The value of staying invested through volatility',
      fr: "L'importance de rester investi malgré la volatilité",
    },
  },
  // 2011-2015: Recovery & Volatility
  {
    date: '2011-08-05',
    label: { en: 'US Credit Downgrade', fr: 'Dégradation de la note US' },
    type: 'volatility',
    lesson: {
      en: 'Flight to quality - bonds and gold as safe havens',
      fr: 'Fuite vers la qualité - obligations et or comme valeurs refuges',
    },
  },
  {
    date: '2015-08-24',
    label: { en: 'China Black Monday', fr: 'Lundi noir chinois' },
    type: 'crash',
    lesson: {
      en: 'Global contagion and momentum reversals',
      fr: 'Contagion mondiale et retournements de momentum',
    },
  },
  // 2016-2019: Political Events
  {
    date: '2016-11-09',
    label: { en: 'Trump Election', fr: 'Élection de Trump' },
    type: 'rally',
    lesson: {
      en: 'Unexpected momentum shifts from political events',
      fr: 'Changements de momentum inattendus suite aux événements politiques',
    },
  },
  {
    date: '2018-12-24',
    label: { en: 'Christmas Eve Crash', fr: 'Krach de la veille de Noël' },
    type: 'correction',
    lesson: {
      en: 'Rebalancing in action during sharp corrections',
      fr: 'Le rééquilibrage en action lors des corrections brutales',
    },
  },
  // 2020: COVID
  {
    date: '2020-03-23',
    label: { en: 'COVID Bottom', fr: 'Point bas COVID' },
    type: 'crash',
    lesson: {
      en: 'Worst single-month decline in decades - crisis behavior',
      fr: 'Pire baisse mensuelle en décennies - comportement de crise',
    },
  },
  {
    date: '2020-11-09',
    label: { en: 'Vaccine Announcement', fr: 'Annonce du vaccin' },
    type: 'rally',
    lesson: {
      en: 'Sector rotation and recovery momentum',
      fr: 'Rotation sectorielle et momentum de reprise',
    },
  },
  // 2022: Inflation & Geopolitics
  {
    date: '2022-02-24',
    label: { en: 'Russia Invades Ukraine', fr: "Invasion de l'Ukraine" },
    type: 'geopolitical',
    lesson: {
      en: 'Commodity spikes and geopolitical risk hedging',
      fr: 'Pics des matières premières et couverture du risque géopolitique',
    },
  },
  {
    date: '2022-10-13',
    label: { en: 'Inflation Peak (CPI 9.1%)', fr: "Pic d'inflation (IPC 9.1%)" },
    type: 'bear',
    lesson: {
      en: 'Interest rate impact on all asset classes',
      fr: "Impact des taux d'intérêt sur toutes les classes d'actifs",
    },
  },
  // 2023-2024: Recent Events
  {
    date: '2023-03-10',
    label: { en: 'SVB Bank Collapse', fr: 'Faillite de SVB' },
    type: 'banking',
    lesson: {
      en: 'Contagion risk and sector-specific crises',
      fr: 'Risque de contagion et crises sectorielles',
    },
  },
  {
    date: '2024-10-07',
    label: { en: 'Israel-Hamas Escalation', fr: 'Escalade Israël-Hamas' },
    type: 'geopolitical',
    lesson: {
      en: 'Safe haven flows during regional conflicts',
      fr: 'Flux vers les valeurs refuges pendant les conflits régionaux',
    },
  },
];

// ═══════════════════════════════════════════════════════════════
// Pre-generated Dialogues for Key Events
// ═══════════════════════════════════════════════════════════════

const BOT_DIALOGUES = {
  // Default dialogues (used when no specific event)
  default: {
    equi: {
      fr: 'Je maintiens ma répartition égale. Simple et efficace.',
      en: 'I maintain my equal allocation. Simple and effective.',
    },
    pari: {
      fr: "J'équilibre le risque entre les actifs. La volatilité guide mes décisions.",
      en: 'I balance risk across assets. Volatility guides my decisions.',
    },
    momo: {
      fr: 'Je suis les tendances. Ce qui monte continue souvent de monter.',
      en: "I follow trends. What goes up often keeps going up.",
    },
    sage: {
      fr: 'La prudence avant tout. Je préfère manquer un gain que subir une perte.',
      en: 'Caution first. I prefer missing a gain to suffering a loss.',
    },
  },
  // Crash event dialogues
  crash: {
    equi: {
      fr: "Les marchés chutent mais je garde mon allocation. Pas de panique, c'est ma discipline.",
      en: "Markets are falling but I keep my allocation. No panic, that's my discipline.",
    },
    pari: {
      fr: 'La volatilité explose. Je réduis automatiquement mon exposition aux actions.',
      en: 'Volatility is spiking. I automatically reduce my equity exposure.',
    },
    momo: {
      fr: "Aïe ! Je suis le plus exposé aux crashs - le momentum marche dans les deux sens. Je subis toute la baisse avant de pouvoir réagir.",
      en: "Ouch! I'm most exposed to crashes - momentum works both ways. I take the full hit before I can react.",
    },
    sage: {
      fr: "Mes protections fonctionnent. L'or et les obligations amortissent le choc.",
      en: 'My protections are working. Gold and bonds are cushioning the blow.',
    },
  },
  // Recovery event dialogues
  recovery: {
    equi: {
      fr: 'Le rebond profite à tous mes actifs équitablement. La patience paie.',
      en: 'The rebound benefits all my assets equally. Patience pays.',
    },
    pari: {
      fr: 'La volatilité se normalise. Je peux progressivement revenir sur les actions.',
      en: 'Volatility is normalizing. I can gradually return to equities.',
    },
    momo: {
      fr: 'Le momentum redevient positif ! Je renforce les gagnants.',
      en: 'Momentum is turning positive! I reinforce the winners.',
    },
    sage: {
      fr: "Je reste prudent. Ce n'est peut-être qu'un rebond technique.",
      en: "I remain cautious. This might just be a technical bounce.",
    },
  },
  // Rally event dialogues
  rally: {
    equi: {
      fr: 'Belle hausse ! Ma diversification capture une part de chaque secteur.',
      en: 'Nice rally! My diversification captures a share of each sector.',
    },
    pari: {
      fr: 'Les actions performent bien. Je maintiens mon équilibre de risque.',
      en: 'Equities are performing well. I maintain my risk balance.',
    },
    momo: {
      fr: "C'est mon moment ! Je surpondère les actifs en tendance haussière.",
      en: "This is my moment! I overweight assets in uptrend.",
    },
    sage: {
      fr: "Prudence dans l'euphorie. Je garde mes protections actives.",
      en: 'Caution in euphoria. I keep my protections active.',
    },
  },
  // Volatility event dialogues
  volatility: {
    equi: {
      fr: 'La volatilité ne change rien à ma stratégie. Je reste sur mes positions.',
      en: "Volatility doesn't change my strategy. I stay on my positions.",
    },
    pari: {
      fr: 'Volatilité élevée détectée. Je rééquilibre pour maintenir le risque égal.',
      en: 'High volatility detected. I rebalance to maintain equal risk.',
    },
    momo: {
      fr: "Forte volatilité = forte exposition dans les deux sens. Quand ça tourne mal, je suis le premier à souffrir.",
      en: "High volatility = high exposure both ways. When it turns bad, I'm the first to suffer.",
    },
    sage: {
      fr: 'Environnement incertain. Je renforce mes positions défensives.',
      en: 'Uncertain environment. I strengthen my defensive positions.',
    },
  },
  // Geopolitical event dialogues
  geopolitical: {
    equi: {
      fr: "Les événements géopolitiques passent. Ma stratégie reste constante.",
      en: 'Geopolitical events pass. My strategy stays constant.',
    },
    pari: {
      fr: "Le risque géopolitique augmente la volatilité. J'ajuste mes pondérations.",
      en: 'Geopolitical risk increases volatility. I adjust my weights.',
    },
    momo: {
      fr: "Les matières premières s'envolent ! Je suis le mouvement.",
      en: 'Commodities are soaring! I follow the movement.',
    },
    sage: {
      fr: "Fuite vers la qualité. L'or et les obligations sont mes alliés.",
      en: 'Flight to quality. Gold and bonds are my allies.',
    },
  },
  // Bear market dialogues
  bear: {
    equi: {
      fr: "Marché baissier prolongé. Ma discipline m'empêche de paniquer.",
      en: 'Extended bear market. My discipline prevents me from panicking.',
    },
    pari: {
      fr: 'Les corrélations augmentent en période de stress. Je reste vigilant.',
      en: 'Correlations increase in stress periods. I stay vigilant.',
    },
    momo: {
      fr: "C'est là que ma stratégie souffre le plus. J'absorbe toutes les baisses avant de pouvoir pivoter. Le drawdown est sévère.",
      en: "This is where my strategy suffers most. I absorb all the downside before I can pivot. The drawdown is severe.",
    },
    sage: {
      fr: "C'est exactement pour ça que je suis prudent. Mes pertes sont limitées.",
      en: "This is exactly why I'm cautious. My losses are limited.",
    },
  },
  // Banking crisis dialogues
  banking: {
    equi: {
      fr: 'Crise bancaire mais je suis diversifié. Pas de surexposition sectorielle.',
      en: 'Banking crisis but I am diversified. No sector overexposure.',
    },
    pari: {
      fr: 'Le risque systémique augmente. Je surveille les corrélations de près.',
      en: 'Systemic risk is rising. I monitor correlations closely.',
    },
    momo: {
      fr: 'Le secteur financier chute. Je réduis mon exposition rapidement.',
      en: 'Financial sector is falling. I reduce my exposure quickly.',
    },
    sage: {
      fr: 'Les crises bancaires sont imprévisibles. Heureux de ma prudence.',
      en: 'Banking crises are unpredictable. Glad for my caution.',
    },
  },
  // Correction dialogues
  correction: {
    equi: {
      fr: 'Correction de marché. Je ne change rien, cela fait partie du jeu.',
      en: 'Market correction. I change nothing, it is part of the game.',
    },
    pari: {
      fr: 'Correction saine. Mon rééquilibrage automatique achète à bon prix.',
      en: 'Healthy correction. My automatic rebalancing buys at good prices.',
    },
    momo: {
      fr: "La correction me coûte cher - j'étais 100% exposé à la hausse précédente. C'est le prix de ma stratégie agressive.",
      en: "The correction hurts - I was 100% exposed to the previous rally. That's the price of my aggressive strategy.",
    },
    sage: {
      fr: 'Les corrections arrivent. Ma sous-exposition aux actions limite la casse.',
      en: 'Corrections happen. My underexposure to equities limits damage.',
    },
  },
};

// ═══════════════════════════════════════════════════════════════
// Cache Management - Uses existing portfolio cache
// ═══════════════════════════════════════════════════════════════

const CACHE_DIR = path.join(__dirname, '../cache');
const PORTFOLIO_CACHE_FILE = 'portfolio-preview-periods.json';
const ARENA_CACHE_FILE = 'arena-timeline.json';

let arenaCache = null;
let arenaCacheTimestamp = null;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Load existing portfolio cache data
 */
async function loadPortfolioCache() {
  try {
    const cachePath = path.join(CACHE_DIR, PORTFOLIO_CACHE_FILE);
    const content = await fs.readFile(cachePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('[ArenaTimeline] Failed to load portfolio cache:', error.message);
    return null;
  }
}

/**
 * Get cached arena data or generate new from portfolio cache
 */
async function getArenaTimeline() {
  const now = Date.now();

  // Check in-memory cache first
  if (arenaCache && arenaCacheTimestamp && now - arenaCacheTimestamp < CACHE_TTL) {
    console.log('[ArenaTimeline] Returning in-memory cached data');
    return arenaCache;
  }

  // Try to load from disk cache
  try {
    const diskCachePath = path.join(CACHE_DIR, ARENA_CACHE_FILE);
    const diskContent = await fs.readFile(diskCachePath, 'utf-8');
    const diskCache = JSON.parse(diskContent);

    // Check if disk cache is still valid
    if (diskCache.generatedAt) {
      const cacheAge = now - new Date(diskCache.generatedAt).getTime();
      if (cacheAge < CACHE_TTL) {
        console.log('[ArenaTimeline] Returning disk cached data');
        arenaCache = diskCache;
        arenaCacheTimestamp = now;
        return arenaCache;
      }
    }
  } catch {
    // Disk cache doesn't exist or is invalid, will regenerate
  }

  console.log('[ArenaTimeline] Generating timeline from portfolio cache...');
  arenaCache = await generateArenaTimeline();
  arenaCacheTimestamp = now;

  // Save to disk cache
  try {
    await fs.writeFile(
      path.join(CACHE_DIR, ARENA_CACHE_FILE),
      JSON.stringify(arenaCache, null, 2),
      'utf-8'
    );
    console.log('[ArenaTimeline] Saved to disk cache');
  } catch (error) {
    console.warn('[ArenaTimeline] Failed to save disk cache:', error.message);
  }

  return arenaCache;
}

/**
 * Clear cache (for testing)
 */
async function clearArenaCache() {
  arenaCache = null;
  arenaCacheTimestamp = null;

  try {
    await fs.unlink(path.join(CACHE_DIR, ARENA_CACHE_FILE));
  } catch {
    // File doesn't exist
  }

  console.log('[ArenaTimeline] Cache cleared');
}

// ═══════════════════════════════════════════════════════════════
// Timeline Generation - Uses existing portfolio cache
// ═══════════════════════════════════════════════════════════════

/**
 * Generate complete arena timeline from existing portfolio cache
 */
async function generateArenaTimeline() {
  // Load existing portfolio cache (already has 20 years of data)
  const portfolioCache = await loadPortfolioCache();

  if (!portfolioCache || !portfolioCache.periods) {
    throw new Error('Portfolio cache not available. Run portfolio cache regeneration first.');
  }

  // Use 20-year period data
  const period20 = portfolioCache.periods['20'];
  if (!period20 || !period20.data) {
    throw new Error('20-year portfolio data not available in cache.');
  }

  console.log(`[ArenaTimeline] Using ${period20.data.length} data points from portfolio cache`);

  // Convert daily data to monthly frames for arena timeline
  const frames = generateMonthlyFrames(period20.data);

  // Add dialogues to frames based on events
  const framesWithDialogues = addDialoguesToFrames(frames);

  // Calculate bot metrics from the full 20-year data
  const metrics = calculateBotMetricsFromCache(period20.data);

  // Get date range from data
  const firstDate = period20.data[0]?.date;
  const lastDate = period20.data[period20.data.length - 1]?.date;

  console.log(`[ArenaTimeline] Generated ${framesWithDialogues.length} monthly frames`);

  return {
    bots: BOT_PERSONAS,
    frames: framesWithDialogues,
    keyEvents: KEY_EVENTS,
    metrics,
    tickers: period20.tickers || ['SPY', 'IEF', 'GLD', 'EFA', 'EEM', 'VNQ', 'CASH'],
    dateRange: {
      start: firstDate,
      end: lastDate,
    },
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Convert daily portfolio data to monthly frames
 */
function generateMonthlyFrames(dailyData) {
  const monthlyFrames = [];
  const monthMap = new Map();

  // Group data by month and take end-of-month values
  dailyData.forEach((dataPoint) => {
    const date = dataPoint.date;
    const monthKey = date.substring(0, 7); // YYYY-MM

    // Keep updating to get end-of-month value
    monthMap.set(monthKey, dataPoint);
  });

  // Convert to array of frames
  Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([month, dataPoint], index) => {
      const frame = {
        index,
        date: dataPoint.date,
        month,
        bots: {},
        // Include raw ETF prices for potential display
        etfPrices: {
          SPY: dataPoint.SPY,
          IEF: dataPoint.IEF,
          GLD: dataPoint.GLD,
          EFA: dataPoint.EFA,
          EEM: dataPoint.EEM,
          VNQ: dataPoint.VNQ,
        },
      };

      // Extract bot values using strategy mapping
      Object.entries(BOT_STRATEGY_MAP).forEach(([botId, strategyKey]) => {
        const value = dataPoint[strategyKey];
        if (value !== undefined) {
          const pnlRaw = value - 100; // value is already base-100 indexed
          const pnlRounded = Math.round(pnlRaw * 100) / 100;
          frame.bots[botId] = {
            value: Math.round(value * 100) / 100,
            pnl: pnlRounded,
            pnlPercent: pnlRounded,
          };
        }
      });

      monthlyFrames.push(frame);
    });

  return monthlyFrames;
}

/**
 * Add dialogues to frames based on events and market conditions
 */
function addDialoguesToFrames(frames) {
  return frames.map((frame) => {
    // Check if this frame coincides with a key event
    const event = KEY_EVENTS.find((e) => {
      const eventMonth = e.date.substring(0, 7);
      return eventMonth === frame.month;
    });

    const eventType = event?.type || 'default';

    // Add dialogues for each bot
    const dialogues = {};
    Object.keys(BOT_PERSONAS).forEach((botId) => {
      const dialogueSet = BOT_DIALOGUES[eventType] || BOT_DIALOGUES.default;
      dialogues[botId] = dialogueSet[botId] || BOT_DIALOGUES.default[botId];
    });

    return {
      ...frame,
      event: event || null,
      dialogues,
    };
  });
}

/**
 * Calculate performance metrics for each bot from cached data
 */
function calculateBotMetricsFromCache(dailyData) {
  const metrics = {};

  Object.entries(BOT_STRATEGY_MAP).forEach(([botId, strategyKey]) => {
    // Extract values for this strategy
    const values = dailyData
      .map((d) => d[strategyKey])
      .filter((v) => v !== undefined && v !== null);

    if (values.length < 2) {
      metrics[botId] = null;
      return;
    }

    const initialValue = values[0];
    const finalValue = values[values.length - 1];
    const years = values.length / 252; // Approximate trading days per year

    // Total Return
    const totalReturn = ((finalValue - initialValue) / initialValue) * 100;

    // Annualized Return (CAGR)
    const cagr = (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;

    // Volatility (annualized)
    const returns = [];
    for (let i = 1; i < values.length; i++) {
      returns.push((values[i] - values[i - 1]) / values[i - 1]);
    }
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100;

    // Max Drawdown
    let maxDrawdown = 0;
    let peak = values[0];
    values.forEach((value) => {
      if (value > peak) peak = value;
      const drawdown = ((peak - value) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    // Sharpe Ratio (assuming 2% risk-free rate)
    const riskFreeRate = 2;
    const sharpe = volatility > 0 ? (cagr - riskFreeRate) / volatility : 0;

    // Calmar Ratio
    const calmar = maxDrawdown > 0 ? cagr / maxDrawdown : 0;

    metrics[botId] = {
      totalReturn: totalReturn.toFixed(2),
      cagr: cagr.toFixed(2),
      volatility: volatility.toFixed(2),
      maxDrawdown: maxDrawdown.toFixed(2),
      sharpe: sharpe.toFixed(2),
      calmar: calmar.toFixed(2),
      finalValue: finalValue.toFixed(2),
    };
  });

  return metrics;
}

/**
 * Get a single frame by index
 */
async function getFrame(index) {
  const timeline = await getArenaTimeline();
  if (index < 0 || index >= timeline.frames.length) {
    return null;
  }
  return timeline.frames[index];
}

/**
 * Get frames for a specific date range
 */
async function getFramesByDateRange(startDate, endDate) {
  const timeline = await getArenaTimeline();
  return timeline.frames.filter((frame) => frame.date >= startDate && frame.date <= endDate);
}

/**
 * Get bot dialogue for a specific context
 */
function getBotDialogue(botId, eventType = 'default', language = 'fr') {
  const dialogueSet = BOT_DIALOGUES[eventType] || BOT_DIALOGUES.default;
  const botDialogue = dialogueSet[botId] || BOT_DIALOGUES.default[botId];
  return botDialogue?.[language] || botDialogue?.fr || '';
}

/**
 * Get total frame count
 */
async function getFrameCount() {
  const timeline = await getArenaTimeline();
  return timeline.frames.length;
}

/**
 * Get timeline metadata (without full frame data)
 */
async function getTimelineMetadata() {
  const timeline = await getArenaTimeline();
  return {
    bots: timeline.bots,
    keyEvents: timeline.keyEvents,
    metrics: timeline.metrics,
    tickers: timeline.tickers,
    dateRange: timeline.dateRange,
    frameCount: timeline.frames.length,
    generatedAt: timeline.generatedAt,
  };
}

// ═══════════════════════════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════════════════════════

module.exports = {
  BOT_PERSONAS,
  BOT_STRATEGY_MAP,
  KEY_EVENTS,
  BOT_DIALOGUES,
  getArenaTimeline,
  clearArenaCache,
  getFrame,
  getFramesByDateRange,
  getBotDialogue,
  getFrameCount,
  getTimelineMetadata,
};
