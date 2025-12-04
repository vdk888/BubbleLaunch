/**
 * Strategy Builder Service
 * Lightweight intent → suggestion helper for the education simulator chatbot.
 * 
 * Note: This is heuristic and keeps runtime fast by avoiding external calls.
 */

const KEYWORDS = {
  safe: ['safe', 'defensive', 'conservative', 'low risk', 'protect', 'stable', 'capital preservation', 'drawdown'],
  growth: ['growth', 'aggressive', 'high return', 'maximize', 'performance', 'upside'],
  balanced: ['balanced', 'moderate', 'middle', 'mix', 'blend'],
  momentum: ['momentum', 'trend', 'follow', 'trend following', 'chase'],
  diversified: ['diversified', 'spread', 'all weather', 'dalio', 'diversification'],
  income: ['income', 'dividend', 'yield'],
  inflation: ['inflation', 'hedge', 'protection'],
};

const SUGGESTIONS = [
  {
    id: 'defensive_rp',
    label: { fr: 'Parité Défensive', en: 'Defensive Risk Parity' },
    mix: { SPY: 35, IEF: 45, GLD: 20 },
    why: {
      fr: 'Volatilité basse, amortit les chocs. Idéale si la protection prime.',
      en: 'Lower volatility, cushions shocks. Good when protection matters most.'
    }
  },
  {
    id: 'balanced_rp_momo',
    label: { fr: 'RP + Momentum', en: 'RP + Momentum' },
    mix: { SPY: 55, IEF: 30, GLD: 15 },
    why: {
      fr: 'Équilibre risque avec une dose de momentum pour capter les tendances.',
      en: 'Balances risk with a dash of momentum to catch trends.'
    }
  },
  {
    id: 'aggressive_momo',
    label: { fr: 'Momentum Dynamique', en: 'Dynamic Momentum' },
    mix: { SPY: 70, IEF: 20, GLD: 10 },
    why: {
      fr: 'Cherche la performance, accepte des drawdowns plus forts.',
      en: 'Seeks higher performance, accepts larger drawdowns.'
    }
  },
  {
    id: 'all_weather',
    label: { fr: 'All-Weather inspiré', en: 'All-Weather inspired' },
    mix: { SPY: 30, IEF: 40, GLD: 20, CASH: 10 },
    why: {
      fr: 'Diversification large pour encaisser inflation et récessions.',
      en: 'Broad diversification to handle inflation and recessions.'
    }
  }
];

function classify(text = '') {
  const lower = text.toLowerCase();
  const hits = new Set();
  Object.entries(KEYWORDS).forEach(([key, words]) => {
    if (words.some((w) => lower.includes(w))) {
      hits.add(key);
    }
  });
  return hits;
}

function pickSuggestions(intents) {
  if (intents.has('safe')) return ['defensive_rp', 'all_weather', 'balanced_rp_momo'];
  if (intents.has('growth')) return ['aggressive_momo', 'balanced_rp_momo', 'all_weather'];
  if (intents.has('balanced')) return ['balanced_rp_momo', 'all_weather', 'defensive_rp'];
  if (intents.has('momentum')) return ['aggressive_momo', 'balanced_rp_momo'];
  if (intents.has('diversified')) return ['all_weather', 'balanced_rp_momo'];
  return ['balanced_rp_momo', 'all_weather'];
}

function getHeuristics(text, lang = 'fr') {
  const intents = classify(text);
  const picks = pickSuggestions(intents);
  const suggestions = picks
    .map((id) => SUGGESTIONS.find((s) => s.id === id))
    .filter(Boolean)
    .map((s) => {
      const mixStr = Object.entries(s.mix)
        .map(([k, v]) => `${v}% ${k}`)
        .join(', ');
      return `${s.label[lang] || s.label.fr}: ${mixStr} — ${s.why[lang] || s.why.fr}`;
    });

  if (!suggestions.length) return '';

  const intentsList = Array.from(intents).join(', ') || 'balanced-default';
  return `Detected intents: ${intentsList}. Suggested mixes: ${suggestions.join(' | ')}`;
}

module.exports = {
  getHeuristics,
};
