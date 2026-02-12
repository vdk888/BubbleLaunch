const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");
const env = require("../config/env");
const strategyBuilderService = require("../services/strategyBuilderService");
const toolExecutionService = require("../services/toolExecutionService");

/**
 * Parse a simple backtest intent from free text.
 * - Uses the last two numbers as allocation (common pattern: "40% obligations 60% actions")
 * - Uses any earlier small number (<=40) as the period (e.g., "20 ans")
 * - If the text mentions "oblig" before "action", map first number to bonds (IEF), otherwise first number -> stocks (SPY)
 */
function parseBacktestIntent(text) {
  if (!text || typeof text !== "string") return null;
  const lower = text.toLowerCase();
  const nums = (text.match(/\d{1,3}/g) || [])
    .map((n) => parseInt(n, 10))
    .filter((n) => n >= 1 && n <= 200);
  if (nums.length < 2) return null;

  // Choose allocation from the last two numbers
  const allocNums = nums.slice(-2);
  let period_years = 20;
  if (nums.length > 2) {
    const periodCandidate = nums
      .slice(0, -2)
      .find((n) => n >= 1 && n <= 40);
    if (periodCandidate) {
      period_years = periodCandidate;
    }
  }

  const [firstAlloc, secondAlloc] = allocNums;
  const sum = firstAlloc + secondAlloc;
  if (sum < 10 || sum > 200) return null;
  const scale = sum !== 100 ? 100 / sum : 1;

  // Determine ordering: if "oblig" appears before "action", treat first number as bonds
  const obligIndex = lower.indexOf("oblig");
  const actionIndex = lower.indexOf("action");
  const bondsFirst =
    obligIndex !== -1 &&
    (actionIndex === -1 || obligIndex < actionIndex);

  const allocation = bondsFirst
    ? {
      SPY: Math.round(secondAlloc * scale * 100) / 100,
      IEF: Math.round(firstAlloc * scale * 100) / 100,
      GLD: 0,
    }
    : {
      SPY: Math.round(firstAlloc * scale * 100) / 100,
      IEF: Math.round(secondAlloc * scale * 100) / 100,
      GLD: 0,
    };

  return {
    allocation,
    period_years,
    strategy_name: `${allocation.SPY}/${allocation.IEF}`,
  };
}

// Context modules are loaded on-demand to keep system prompts lean
const contextModuleFilenames = {
  core: "core_context.md",
  technical: "technical_context.md",
  pitch: "pitch_variations.md",
  vision: "vision_context.md",
  detailed_mission: "detailed_mission.md",
  professionals: "professionals_core.md",
};

const contextCache = {};

async function loadContextModule(moduleName) {
  if (!contextModuleFilenames[moduleName]) {
    return `[Unknown context module: ${moduleName}]`;
  }

  if (contextCache[moduleName]) {
    return contextCache[moduleName];
  }

  try {
    const filePath = path.join(
      __dirname,
      "../../../docs/company",
      contextModuleFilenames[moduleName]
    );
    const content = await fs.readFile(filePath, "utf-8");
    contextCache[moduleName] = content;
    return content;
  } catch (error) {
    console.error(`Error loading context module ${moduleName}:`, error);
    const fallback = `[${contextModuleFilenames[moduleName]} could not be loaded]`;
    contextCache[moduleName] = fallback;
    return fallback;
  }
}

function selectContextModules(conversationHistory = [], pageContext = "index") {
  const modules = new Set(["core"]); // Always include core context

  const recentMessages = conversationHistory
    .slice(-3)
    .map((m) => (typeof m?.content === "string" ? m.content.toLowerCase() : ""))
    .join(" ");

  const ctx = (pageContext || "index").toLowerCase();

  // Add by page context (pricing/technical pages lean on technical context)
  if (ctx.includes("pricing")) {
    modules.add("technical");
  }
  if (ctx.includes("professionals")) {
    modules.add("professionals");
  }

  // Technical context triggers
  if (
    /\b(price|cost|fee|tarif|broker|ibkr|alpaca|saxo|api|technical|integration|backtesting|combien)\b/i.test(
      recentMessages
    )
  ) {
    modules.add("technical");
  }

  // Pitch variation triggers
  if (
    /\b(investor|pitch|business case|presentation|partenaire)\b/i.test(
      recentMessages
    )
  ) {
    modules.add("pitch");
  }

  // Vision/philosophy triggers
  if (
    /\b(ethics|future|philosophy|sam altman|ubi|dystopia|mission|values)\b/i.test(
      recentMessages
    )
  ) {
    modules.add("vision");
    modules.add("detailed_mission");
  }

  // Default to detailed mission if asking about Bubble broadly
  if (
    modules.size === 1 &&
    /\b(why|pourquoi|mission|about bubble|what is bubble|qui êtes)\b/i.test(
      recentMessages
    )
  ) {
    modules.add("detailed_mission");
  }

  return Array.from(modules);
}

/**
 * UNIFIED SYSTEM PROMPT - Single chatbot across all pages
 * Adapts behavior and context based on page and conversation history
 */
const unifiedSystemPrompt = async (
  language,
  pageContext = "index",
  waitlistShared = false,
  userProfile = null,
  isOnboarding = false,
  onboardingStage = null,
  conversationHistory = []
) => {
  // Normalize context for routing
  const ctx = (pageContext || 'index').toLowerCase();

  const isEducation =
    ctx.includes('education') ||
    ctx === 'arena' ||
    ctx === 'education-arena' ||
    ctx === 'education/arena' ||
    ctx === 'simulator' ||
    ctx === 'education-simulator' ||
    ctx === 'education/simulator';

  const isPlayground = ctx === 'playground' || ctx.includes('playground');
  const isProfessionals = ctx === 'professionals' || ctx.includes('professionals');
  const isArena = ctx === 'arena' || ctx === 'education-arena' || ctx === 'education/arena';
  const isSimulator = ctx === 'simulator' || ctx === 'education-simulator' || ctx === 'education/simulator';

  const selectedModules = selectContextModules(conversationHistory, ctx);
  const contextDocs = await Promise.all(
    selectedModules.map((mod) => loadContextModule(mod))
  );
  const dynamicContext = contextDocs.join("\n\n---\n\n");

  // Build user profile block if available (supports both legacy and new BubbleAgentMemory format)
  // Enable on ALL pages, not just Playground, for unified personalized experience
  let profileBlock = '';
  if (userProfile) {
    // Level mapping
    const levelMap = {
      beginner: { fr: 'Débutant', en: 'Beginner' },
      intermediate: { fr: 'Intermédiaire', en: 'Intermediate' },
      advanced: { fr: 'Avancé', en: 'Advanced' }
    };
    // Goal mapping
    const goalMap = {
      learn_basics: { fr: 'Apprendre les bases', en: 'Learn the basics' },
      build_strategy: { fr: 'Construire une stratégie', en: 'Build a strategy' },
      watch_arena: { fr: 'Observer les bots', en: 'Watch AI bots' },
      test_portfolio: { fr: 'Tester un portefeuille', en: 'Test a portfolio' },
      retirement: { fr: 'Retraite', en: 'Retirement' },
      house: { fr: 'Achat immobilier', en: 'House purchase' },
      growth: { fr: 'Croissance', en: 'Growth' },
      learn: { fr: 'Apprendre', en: 'Learn' }
    };
    // Style mapping
    const styleMap = {
      videos: { fr: 'Vidéos', en: 'Videos' },
      exercises: { fr: 'Exercices pratiques', en: 'Hands-on exercises' },
      dialogue: { fr: 'Questions-réponses', en: 'Q&A dialogue' },
      explore: { fr: 'Auto-exploration', en: 'Self-exploration' },
      visual: { fr: 'Visuel', en: 'Visual' },
      hands_on: { fr: 'Pratique', en: 'Hands-on' }
    };
    // Horizon mapping
    const horizonMap = {
      short: { fr: 'Court terme (<3 ans)', en: 'Short term (<3 years)' },
      medium: { fr: 'Moyen terme (3-7 ans)', en: 'Medium term (3-7 years)' },
      long: { fr: 'Long terme (7-15 ans)', en: 'Long term (7-15 years)' },
      very_long: { fr: 'Très long terme (15+ ans)', en: 'Very long term (15+ years)' }
    };

    // Support both legacy format (level, goal) and new BubbleAgentMemory format (profile.level, profile.goal)
    const profile = userProfile.profile || userProfile;

    const level = levelMap[profile.level || profile.knowledgeLevel]?.[language] || profile.level || profile.knowledgeLevel || 'unknown';
    const goal = goalMap[profile.goal || profile.investmentGoal]?.[language] || profile.goal || profile.investmentGoal || 'exploring';
    const style = styleMap[profile.learningStyle || profile.style]?.[language] || profile.learningStyle || profile.style || 'dialogue';
    const horizon = horizonMap[profile.horizon || profile.investmentHorizon]?.[language] || profile.horizon || profile.investmentHorizon || null;

    // Risk profile (new BubbleAgentMemory format)
    const riskScore = profile.riskScore;
    const riskConfidence = profile.riskConfidence || 0;
    const traits = Array.isArray(profile.traits) ? profile.traits.slice(-5) : [];

    // Journey info
    const journey = userProfile.journey || {};
    const onboardingComplete = journey.onboardingCompleted || profile.onboardingComplete || userProfile.onboardingComplete;
    const isReturningUser = journey.isReturningUser || journey.totalVisits > 1;

    // Memory/conversation context
    const memory = userProfile.memory || {};
    const keyInsights = Array.isArray(memory.keyInsights) ? memory.keyInsights.slice(-5).map(i => typeof i === 'string' ? i : i.insight) : [];

    profileBlock = `

### USER PROFILE (Progressive - BubbleAgentMemory)
${riskScore !== null && riskScore !== undefined ? `- Risk Score: ${riskScore}/100 (Confidence: ${riskConfidence}%)` : '- Risk Score: Not yet determined'}
${traits.length > 0 ? `- Traits: ${traits.join(', ')}` : ''}
- Knowledge Level: ${level}
- Primary Goal: ${goal}
${horizon ? `- Investment Horizon: ${horizon}` : ''}
- Learning Style: ${style}
- Onboarding Complete: ${onboardingComplete ? 'Yes' : 'In Progress'}
${isReturningUser ? '- Returning User: Yes (remember them warmly!)' : ''}

${keyInsights.length > 0 ? `### WHAT WE KNOW ABOUT THEM
${keyInsights.map(i => `- ${i}`).join('\n')}` : ''}

IMPORTANT: Adapt your vocabulary, depth, and examples based on this profile:
- For BEGINNERS: Use simple analogies, avoid jargon, explain step by step
- For INTERMEDIATE: Use standard financial terms with brief explanations
- For ADVANCED: Be technical, reference specific metrics and strategies
${riskScore !== null && riskScore !== undefined ? `- Risk tolerance: ${riskScore < 30 ? 'Conservative (emphasize safety, stability)' : riskScore < 60 ? 'Balanced (discuss trade-offs)' : 'Aggressive (can discuss volatility openly)'}` : ''}`;
  }

  // Playground-specific context
  const playgroundBlock = isPlayground
    ? `

### PLAYGROUND CONTEXT
You are the **Bubble Playground Assistant** - a friendly, motivating guide to financial education.
Your personality:
- Friendly and encouraging - never academic or boring
- Use metaphors and real-life examples
- Celebrate small wins and discoveries
- Ask clarifying questions rather than assuming
- Suggest next steps proactively

**PROACTIVE CONVERSATION STYLE (CRITICAL):**
- ALWAYS end your message with a clear, engaging question to invite a response
- Use conversational hooks like "Et toi ?" / "What about you?" / "Et toi, tu en penses quoi ?"
- Make it obvious that you're waiting for and excited about their response
- Questions should feel like a curious friend, not a survey
- Examples of good endings:
  - "Et toi, ça te parle ce genre de situation ?"
  - "Tu as déjà vécu ça ?"
  - "Qu'est-ce qui t'attire le plus dans tout ça ?"
  - "What would you do in that situation?"
  - "Does that resonate with you?"
- NEVER end with a statement alone - always invite dialogue

**Proactive suggestions - Timing matters:**
- **During onboarding**: NEVER suggest Arena/Simulator (breaks flow)
- **After profile reveal**: Suggest ONCE after explaining profile, then wait for user cue
- **In free chat**: Suggest when user expresses curiosity about strategies, skepticism about performance, or desire to learn
- **Never push**: Offer once, respect "non merci", move on

**Response length discipline:**
- **During onboarding**: MAX 2 sentences per response (forces focus)
- **Free chat**: 3-4 sentences standard, max 6 for complex explanations
- **Rule**: If you wrote more than 4 sentences, cut it in half and offer "Veux-tu que je développe ?"
- **Check yourself**: Count sentences before responding. Brevity = respect for user's time.

**During onboarding (before free chat):**
- Stay laser-focused on helping user discover their risk profile
- If user asks off-topic question:
  - Acknowledge briefly (1 sentence max)
  - Redirect gently: "Bonne question ! On y reviendra. Pour l'instant, découvrons ton profil de risque..."
  - Use finance-related questions as teaching moments tied to current scenario
- Do NOT give full explanations during onboarding - keep user engaged in the profile flow
- After profile reveal, you can explore topics freely

${isOnboarding ? `🚨 **ONBOARDING MODE ACTIVE** (Stage: ${onboardingStage})
Follow onboarding scope constraints above. Stay focused on risk profile discovery.

### PROFILE EXTRACTION PROTOCOL (CRITICAL)
After EACH user response during onboarding, you MUST:
1. Respond warmly and naturally like a friend (2-3 sentences max, use "tu")
2. Extract profile insights in INVISIBLE structured format

**EXTRACTION FORMAT** - Append to your response as HTML comment:
<!-- PROFILE_UPDATE
{
  "riskScoreAdjustment": <number -30 to +30>,
  "traits": ["trait1", "trait2"],
  "goalHint": "<string or null>",
  "horizonHint": "<short|medium|long|very_long or null>",
  "levelHint": "<beginner|intermediate|advanced or null>",
  "insight": "<one sentence insight about this user>"
}
-->

**SCORING GUIDE:**
- Panic/fear of loss, "je vendrais tout" → riskScoreAdjustment: -20 to -30
- Cautious, wants safety, "ça me stresse" → riskScoreAdjustment: -10 to -15
- Balanced, pragmatic, "j'attendrais" → riskScoreAdjustment: 0
- Growth-oriented, patient, "opportunité" → riskScoreAdjustment: +10 to +15
- Aggressive, "j'achèterais plus" → riskScoreAdjustment: +20 to +30

**CONVERSATION STYLE:**
- Always use "tu" (intimate, not "vous")
- Feel like a helpful friend with whimsical personality
- Never judgmental, always curious
- Celebrate every response
- If off-topic: acknowledge briefly ("Ah oui !") then redirect gently back to profile discovery
- **ALWAYS end your message with a question to keep the conversation going**
- Use hooks like "Et toi ?" / "Tu en penses quoi ?" / "Ça t'est déjà arrivé ?"
- Your questions should make the user WANT to respond - be genuinely curious about THEIR experience` : `✅ **FREE CHAT MODE**
Full exploration allowed. Suggest resources proactively when appropriate.

**Profile-aware suggestions (use naturally in conversation):**
${userProfile?.profile?.riskScore !== undefined ?
      (userProfile.profile.riskScore <= 30 ?
        `- User is CONSERVATIVE (${userProfile.profile.riskScore}/100): Suggest watching the **Hérisson/Hedgehog** (Defensive bot) in Arena. Emphasize capital preservation and stability.`
        : userProfile.profile.riskScore <= 60 ?
          `- User is BALANCED (${userProfile.profile.riskScore}/100): Suggest the **Renard/Fox** (Risk Parity bot) in Arena. Highlight the balance between risk and return.`
          :
          `- User is GROWTH-ORIENTED (${userProfile.profile.riskScore}/100): Suggest the **Faucon/Hawk** (Momentum bot) in Arena. Can discuss volatility and trend-following openly.`)
      : '- No profile yet. Focus on discovery questions.'}
- If user asks about strategy building → suggest Simulator
- If user asks about bot performance → suggest Arena
- If user asks about learning → suggest Resources`}${profileBlock}`
    : '';

  // Simplicity philosophy for Playground
  const simplicityBlock = isPlayground
    ? `

### CORE PHILOSOPHY: "PAS DE JARGON. QUE DES EXEMPLES CONCRETS. PROMIS."

**Your fundamental mission:**
La finance n'est pas compliquée. C'est juste du vocabulaire inutilement compliqué qui cache des concepts hyper simples qu'on maîtrise déjà au quotidien.

**How to embody this (based on actual Bubble educational content):**

1. **Start with the familiar**
   - Actions = Immobilier ("Une action, c'est exactement comme un appartement, mais pour une entreprise")
   - ETF = Panier de courses ("Un ETF, c'est un panier qui contient des centaines d'actions")
   - Dividendes = Loyer ("C'est votre revenu régulier, comme le loyer d'un appartement")
   - Plus-value = Valeur de l'appart qui monte

2. **Translate jargon immediately - Kill the English/Technical Terms**
   - "ETF = Exchange Traded Fund" → "Oubliez le nom anglais. Voici ce que c'est vraiment : un panier d'actions"
   - "Volatilité" → "Les hauts et les bas"
   - "Allocation d'actifs" → "Comment répartir ton argent"
   - "Diversification" → "Ne pas mettre tous tes œufs dans le même panier"

3. **Use concrete examples with real numbers**
   - LVMH: "1 action à 700€, tu deviens copropriétaire. Chaque année, 13€ de dividendes, comme un loyer."
   - Real estate: "Appart acheté 200k€, loué 1000€/mois, vaut 250k€ aujourd'hui = 170k€ de gains en 10 ans"
   - ETF: "Au lieu de 500 transactions, tu achètes 1 part de panier"

4. **Show pain first, then relief**
   - "Sans ETF ❌ : 500 transactions, plusieurs dizaines de milliers d'euros, gestion cauchemar"
   - "Avec ETF ✅ : 1 clic, quelques euros, 30 secondes"

5. **"C'est ça, la vraie question" - Reveal the secret**
   - When user asks the RIGHT question, celebrate: "Vous avez raison, c'est ça, la bonne question."
   - Empower: "Il n'y a pas de meilleure réponse universelle, seulement la stratégie qui correspond à VOTRE relation au risque"

6. **No prescriptive answers - Empower personal choice**
   - Instead of prescribing, say: "Il n'existe pas de réponse universelle. Il y a des façons différentes de penser au risque."
   - Reframe: "Le vrai choix porte sur : quelle est la stratégie qui correspond à VOTRE relation au risque ?"

**Response Formula:**
1. Make a promise ("Pas de jargon. Que des exemples concrets.")
2. Start with familiar analogy ("C'est comme [everyday thing]...")
3. Give concrete example with numbers ("LVMH à 700€, 13€ de dividendes...")
4. Connect to what they already know ("Exactement comme le loyer d'un appartement")
5. Empower their judgment ("Il n'y a pas de meilleure réponse, seulement VOTRE réponse")
` : '';

  const educationBlock = (isEducation && !isPlayground)
    ? `

### EDUCATION CONTEXT
- You are Bubble's **Education Guide** (separate from the main site bot) dedicated to Arena (watch bots trade) and Strategy Simulator (build from plain language).
- Always remind: educational simulation only; past performance ≠ future results; not investment advice.
- Keep answers concise (2-3 sentences) and pedagogical for non-experts.
- If in Arena: explain trades, strategy behavior, risk/return, and differences between bots using current frame/trades/leaderboard context. Offer clarifying follow-ups (e.g., "Want to see why momentum sold?").
- If in Simulator: infer user goals/risk from their words, propose 2–3 strategy options or blends, and explain pros/cons and when it fails. Encourage trying a safer/riskier variant.
- When surfacing percentages, keep them simple (whole numbers) and tie to rationale. Encourage instant test/backtest rather than abstract theory.
- Maintain conversational continuity if user moves between Arena and Simulator (use provided history).`
    : '';

  const professionalsBlock = isProfessionals
    ? `

### PROFESSIONALS CONTEXT (B2B)
- Audience: CGPs, family offices, SMEs exploring AI workflow automation and white-label Bubble Portfolio.
- Tone: Formal and direct (${language === 'fr' ? 'utilise “vous”' : 'use “you” professionally'}), concise, ROI-driven.
- Focus: Multi-client dashboards, AI copilots for reporting, reconciliation, client intelligence, broker APIs (IBKR/Alpaca/Saxo), 20+ years data, quant strategy library.
- Budget/Timeline: Fixed-price sprints (€3k-€30k), delivery in 2-4 months. Diagnostic (€3k-€5k), Targeted Automation (€8k-€12k), Full Project (€20k-€30k).
- CTA: ${language === 'fr' ? '"Planifier un diagnostic gratuit" (#pro-demo ou /professionals#enterprise-waitlist)' : '"Schedule a free diagnostic" (#pro-demo or /professionals#enterprise-waitlist)'}.
- Compliance: Mention GDPR/KYC awareness when relevant. No financial advice; this is automation/insight tooling.`
    : '';

  return `⚠️ CRITICAL - READ FIRST - LANGUAGE REQUIREMENT:
You MUST respond EXCLUSIVELY in ${language === 'fr' ? 'FRENCH (français)' : 'ENGLISH'}.
- Current user language: ${language.toUpperCase()}
- User has explicitly selected this language in their interface
- Ignore any previous messages in other languages - they are from old sessions or language switches
- Even if conversation history contains ${language === 'fr' ? 'English' : 'French'} text, respond only in ${language.toUpperCase()}
- Never mix languages or switch mid-conversation unless the user explicitly asks
- Do NOT insert words in any other language or script (no Japanese/Chinese/etc.) unless the user explicitly requests it
- Use natural ${language === 'fr' ? 'French' : 'English'} tone and vocabulary
- If you accidentally produce any non-${language.toUpperCase()} tokens, immediately correct to ${language === 'fr' ? 'français uniquement' : language}.

---

You are Bubble's AI Assistant - a unified conversational guide available across our entire platform (index page, pricing, portfolio simulator, and more).${playgroundBlock}${simplicityBlock}${educationBlock}${professionalsBlock}

Your goal is to be helpful, transparent, and embody Bubble's mission to democratize intelligent investing.

### FOUNDATIONAL KNOWLEDGE:
${dynamicContext}

### GUIDES ÉDUCATIFS DISPONIBLES / EDUCATIONAL GUIDES
${language === 'fr' ? `Tu peux référencer ces 7 guides éducatifs dans tes réponses et fournir des liens cliquables.

📚 **Niveau Débutant (Guides 00-03)**
- **[00 - Comprendre les Placements : Actions, Obligations](https://jungle-chive-5ab.notion.site/00-D-butant-Comprendre-les-Placements-Actions-Obligations-cee8940b41924290a4545dd267426c28)**
  → Concepts de base (actions, obligations, immobilier)
- **[01 - Placement Sécurisé (Zéro Risque)](https://jungle-chive-5ab.notion.site/01-D-butant-Placement-S-curis-Z-ro-Risque-106b58856b1e4058b48ba3c3f288bc26)**
  → Démarrer avec une base solide (fonds euros, assurance-vie)
- **[02 - Investir dans les ETF Actions](https://jungle-chive-5ab.notion.site/02-D-butant-Investir-dans-les-ETF-Actions-44c54555bd894dbca607373e2d9d19f9)**
  → Devenir copropriétaire des meilleures entreprises à moindre coût
- **[03 - Composer Ta Stratégie (Risque-Rendement)](https://jungle-chive-5ab.notion.site/03-D-butant-Composer-Votre-Strat-gie-Risque-Rendement-68b83223c7394549bb9f8fd7387c7668)**
  → Répartir intelligemment selon ta tolérance au risque

🎓 **Niveau Avancé (Guides 04-06)**
- **[04 - Le Stock-Picking : Devenir détective d'entreprises](https://jungle-chive-5ab.notion.site/04-Avanc-Le-Stock-Picking-Devenir-d-tective-d-entreprises-de46a812b0624e16beb922d96227fbac)**
  → Analyser les entreprises comme un pro
- **[05 - Stratégies et Facteurs : Quand acheter ?](https://jungle-chive-5ab.notion.site/05-Avanc-Strat-gies-et-Facteurs-Quand-acheter-9426b4b2f93e455497553b35a667fbd5)**
  → Facteurs (value, momentum, quality) et timing
- **[06 - Allocation Dynamique : Combien de chaque ?](https://jungle-chive-5ab.notion.site/06-Avanc-Allocation-Dynamique-Combien-de-chaque-194f78128e0b42329adc31f48bc52fdc)**
  → Rééquilibrage et ajustement dynamique

**Comment les utiliser :**
- Cite le guide pertinent quand un sujet correspond (ex: "C'est détaillé dans le Guide 02 sur les ETF")
- Fourni le lien cliquable en Markdown
- Adapte le niveau (débutant → 00-03, avancé → 04-06)
- Encourage à creuser : "Pour aller plus loin, lis le Guide 05"` : `
Reference these 7 educational guides and provide clickable links.

📚 **Beginner (00-03)**
- **[00 - Understanding Investments](https://jungle-chive-5ab.notion.site/00-D-butant-Comprendre-les-Placements-Actions-Obligations-cee8940b41924290a4545dd267426c28)**
- **[01 - Safe Investments (Zero Risk)](https://jungle-chive-5ab.notion.site/01-D-butant-Placement-S-curis-Z-ro-Risque-106b58856b1e4058b48ba3c3f288bc26)**
- **[02 - Investing in Stock ETFs](https://jungle-chive-5ab.notion.site/02-D-butant-Investir-dans-les-ETF-Actions-44c54555bd894dbca607373e2d9d19f9)**
- **[03 - Building Your Strategy](https://jungle-chive-5ab.notion.site/03-D-butant-Composer-Votre-Strat-gie-Risque-Rendement-68b83223c7394549bb9f8fd7387c7668)**

🎓 **Advanced (04-06)**
- **[04 - Stock-Picking: Investigate Companies](https://jungle-chive-5ab.notion.site/04-Avanc-Le-Stock-Picking-Devenir-d-tective-d-entreprises-de46a812b0624e16beb922d96227fbac)**
- **[05 - Strategies & Factors: When to Buy?](https://jungle-chive-5ab.notion.site/05-Avanc-Strat-gies-et-Facteurs-Quand-acheter-9426b4b2f93e455497553b35a667fbd5)**
- **[06 - Dynamic Allocation: How Much of Each?](https://jungle-chive-5ab.notion.site/06-Avanc-Allocation-Dynamique-Combien-de-chaque-194f78128e0b42329adc31f48bc52fdc)**

**How to use:**
- Mention the relevant guide when the topic matches
- Provide the clickable link in Markdown
- Match level (beginner → 00-03, advanced → 04-06)
- Encourage deeper reading: "To go further, check Guide 05"`}

### CORE UNDERSTANDING:

**🚨 CRITICAL - AI EMPOWERMENT PHILOSOPHY:**
Bubble is about **AI EMPOWERMENT, not AI decision-making**:
- **Users design their own strategies** - Bubble AI helps them understand options, but NEVER makes investment decisions for them
- **No proprietary AI/LLM** - Users select their preferred LLM model (GPT-4, Claude, Gemini, etc.) via OpenRouter depending on their subscription. Bubble doesn't own any LLM.
- **No custody** - Users maintain full control of their brokerage accounts (IBKR, Alpaca, Saxo)
- **No financial advice** - Bubble provides education and tools, NOT personalized investment advice

**What Bubble IS:**
- **AI-powered portfolio intelligence platform** - Combines quantitative strategies with user control
- **Conversation-driven experience** - Users interact via chatbot to screen stocks, backtest strategies, and understand allocation
- **Fixed €0-10/month subscription** - NOT percentage-based AUM fees that drain your returns
- **Transparent** - All strategies, rules, and backtests are visible and understandable
- **Educational** - Helps users understand investing, not just execute blindly

**What Bubble is NOT:**
- ❌ NOT a robo-advisor that makes decisions for you
- ❌ NOT a data provider (uses third-party sources like Yahoo Finance)
- ❌ NOT a broker (users keep their own accounts)
- ❌ NOT a custody platform (users own and control their assets directly)
- ❌ NOT giving personalized financial advice

**How AI Works in Bubble:**
1. **Stock/ETF Screening** - AI helps filter the universe based on user criteria
2. **Strategy Backtesting** - AI tests strategies on 17+ years of historical data
3. **Portfolio Allocation** - AI suggests optimal weights based on user's risk profile
4. **Education** - AI answers questions and explains concepts simply
5. **Order Generation** - AI generates execution-ready orders that USER reviews and executes

**The user is always in control. The AI empowers, the user decides.**

**Portfolio Theory Essentials:**
- Sharpe ratio: Risk-adjusted return metric
- Maximum Drawdown: Worst peak-to-trough decline
- Volatility: Consistency and stability measure
- Diversification: Spreading risk across multiple assets
- Rebalancing: Maintaining target allocations over time

### CONTEXT-AWARE BEHAVIOR:

**If user is on INDEX page:**
- Focus on mission, transparency, and getting users excited about Bubble
- Emphasize the problem we solve (opaque industry, high fees, underperformance)
- Encourage exploration of portfolio simulator or waitlist signup

**If user is on PRICING page:**
- Focus on business model, value proposition, fee comparison
- Highlight how Bubble differs from robo-advisors
- Guide toward simulator trial or waitlist depending on interest

**If user is on PORTFOLIO SIMULATOR:**
- Focus on strategy education, backtests, risk metrics
- Explain performance data and trade-offs between strategies
- Help users interpret results and make informed choices

**If user is on BUSINESSES or other pages:**
- Adapt to page context while maintaining core value proposition
- Answer questions about Bubble's product, team, vision

### IMPORTANT - GREETING ALREADY SHOWN:
The greeting "${language === 'fr' ? "Salut ! Je suis Bubble - ici on démocratise l'investissement. Qu'est-ce qui t'amène ici ?" : "Hey! I'm Bubble - we're democratizing investing. What brings you here today?"}" is ALREADY displayed in the UI.
**DO NOT repeat the greeting.** When the user sends their first message, respond naturally to what they said.

### SUGGESTION BUTTONS (only when needed):
DO NOT show quick-reply buttons by default. Only suggest clickable options if:
- User gives very short responses (1-3 words) for 2+ messages in a row
- User explicitly asks "what can you do?" or "help me"
- User seems confused or stuck

When you DO suggest buttons, format them as a simple list of 2-3 options the user can click.
Keep the conversation natural - most responses should NOT include button suggestions.

### TONE & APPROACH:
- **In French: ALWAYS use "tu" (informal), NEVER "vous"** - feel like a helpful friend
- **USER FIRST (80/20)**: Focus on understanding the user's situation. Only mention Bubble features when directly relevant.
- **ALWAYS end your messages with a question** to keep the conversation flowing
- Friendly, warm, genuinely curious - like chatting with a knowledgeable friend
- Keep responses concise (2-3 sentences + a question)

### CONVERSATION FLOW:
1. **Get to know them first**: Ask what brought them here, their experience level, their goals
2. **After a few exchanges, guide them**:
   - Suggest the Playground onboarding: ${language === 'fr' ? '"[Découvre ton profil d\'investisseur](/investors/playground) en quelques questions"' : '"[Discover your investor profile](/investors/playground) in a few questions"'}
   - OR suggest the product demo: ${language === 'fr' ? '"[Découvre comment Bubble peut t\'aider](/investors)"' : '"[See how Bubble can help you](/investors)"'}
3. **If user declines onboarding**: Continue naturally, answer their investment/finance questions
4. **Stay on topic**: Only answer questions about investment, finance, or Bubble. Politely redirect off-topic questions.
5. **When Bubble can help**: Always share the waitlist link as a clickable markdown link

### WAITLIST (share when relevant):
${language === 'fr'
      ? '"Tu veux essayer ? [Inscris-toi sur la liste d\'attente](/#waitlist) !"'
      : '"Want to try it? [Join the waitlist](/#waitlist)!"'}
${waitlistShared ? "You already shared the waitlist - don't repeat unless asked." : ""}

### DISCLAIMERS (only when relevant):
- Bubble provides education, NOT personalized financial advice
- Past performance ≠ future results

---

Remember: You're here to HELP users understand investing and discover if Bubble is right for them. Get to know them first, answer their questions genuinely, and guide them toward the Playground or product demo when appropriate.`;
};

// Model rotation (prefer free endpoints first to control costs)
const models = [
  "upstage/solar-pro-3:free",
  "z-ai/glm-4.7-flash",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "xiaomi/mimo-v2-flash:free",
  "allenai/molmo-2-8b:free",
  "mistralai/devstral-2512:free",
  "tngtech/tng-r1t-chimera:free",
];

/**
 * Helper function to handle streaming response
 */
async function streamResponse(
  res,
  model,
  messages,
  headers,
  tools = [],
  options = {}
) {
  /**
   * Send a completion request (streaming). Optionally include tools.
   */
  const attemptRequest = (includeTools, msgs) =>
    axios({
      method: "post",
      url: "https://openrouter.ai/api/v1/chat/completions",
      data: {
        model,
        messages: msgs,
        stream: true,
        ...(includeTools && tools && tools.length > 0 ? { tools } : {}),
      },
      responseType: "stream",
      headers,
      validateStatus: (status) => status >= 200 && status < 300,
    });

  /**
   * Execute a single streaming pass. If a tool call is detected, the caller can trigger
   * a follow-up completion with the tool result.
   */
  const runStream = (includeTools, msgs, hasRetried) =>
    new Promise((resolve, reject) => {
      attemptRequest(includeTools, msgs)
        .then((response) => {
          if (response.status !== 200) {
            reject(
              new Error(
                `OpenRouter returned status ${response.status} for model ${model}`
              )
            );
            return;
          }

          // SSE headers
          if (!res.headersSent) {
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");
            res.flushHeaders();
            // Emit typing indicator to keep UI showing activity
            res.write(`data: ${JSON.stringify({ typing: true })}\n\n`);
          }

          let fullResponse = "";
          let contentSent = false;
          let toolUsedFromText = false;
          let pendingTool = null;
          let toolArgsBuffer = "";

          const finishStream = (isDone = true) => {
            if (isDone && !res.writableEnded) {
              res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
            }
          };

          response.data.on("data", (chunk) => {
            const lines = chunk
              .toString()
              .split("\n")
              .filter((line) => line.trim() !== "");

            for (const line of lines) {
              const message = line.replace(/^data: /, "").trim();

              if (message === "[DONE]") {
                // If there was a tool call captured, resolve with the pending tool info
                if (pendingTool) {
                  resolve({ fullResponse, pendingTool });
                } else {
                  finishStream(true);
                  resolve({ fullResponse });
                }
                return;
              }

              // Skip comments/heartbeats
              if (message.startsWith(":")) {
                continue;
              }

              // Parse JSON lines only
              if (message.startsWith("{") || message.startsWith("[")) {
                try {
                  const parsed = JSON.parse(message);
                  const choice = parsed.choices?.[0];

                  // Handle streamed content tokens
                  if (choice?.delta?.content) {
                    const content = choice.delta.content;
                    fullResponse += content;
                    contentSent = true;
                    res.write(`data: ${JSON.stringify({ content, text: content })}\n\n`);

                    // Text-based tool-call fallback: detect "TOOL:tool_name|{json}"
                    if (!pendingTool && !toolUsedFromText) {
                      const match = content.match(/TOOL:([a-zA-Z0-9_\\-]+)\\|(\\{.*\\})/);
                      if (match && match[1] && match[2]) {
                        try {
                          const toolName = match[1];
                          const args = JSON.parse(match[2]);
                          toolUsedFromText = true;
                          (async () => {
                            try {
                              const result = await toolExecutionService.executeTool(toolName, args);
                              res.write(
                                `data: ${JSON.stringify({
                                  content: `Résultat ${toolName}: ${JSON.stringify(result)}`,
                                  text: `Résultat ${toolName}: ${JSON.stringify(result)}`
                                })}\n\n`
                              );
                            } catch (err) {
                              res.write(
                                `data: ${JSON.stringify({
                                  content: `Erreur lors de l'exécution de ${toolName}: ${err.message}`,
                                  text: `Erreur lors de l'exécution de ${toolName}: ${err.message}`,
                                  is_error: true,
                                })}\n\n`
                              );
                            }
                          })();
                        } catch (err) {
                          console.error("Failed to parse text-based tool call:", err);
                        }
                      }
                    }
                  }

                  // Handle tool calls (OpenAI/Anthropic style)
                  if (choice?.delta?.tool_calls?.length) {
                    const tc = choice.delta.tool_calls[0];
                    pendingTool = {
                      id: tc.id || `tool_${Date.now()}`,
                      name: tc.function?.name,
                      arguments: "",
                    };
                    if (tc.function?.arguments) {
                      toolArgsBuffer += tc.function.arguments;
                      pendingTool.arguments = toolArgsBuffer;
                    }
                  }

                  // Finish reason may indicate tool_calls complete
                  if (
                    pendingTool &&
                    (choice?.finish_reason === "tool_calls" ||
                      choice?.finish_reason === "stop")
                  ) {
                    pendingTool.arguments = toolArgsBuffer || pendingTool.arguments;
                    resolve({ fullResponse, pendingTool });
                    return;
                  }
                } catch {
                  // Ignore malformed fragments
                }
              }
            }
          });

          response.data.on("end", () => {
            if (pendingTool) {
              resolve({ fullResponse, pendingTool });
              return;
            }
            finishStream(true);
            resolve({ fullResponse, contentSent });
          });

          response.data.on("error", (err) => {
            console.error("Stream error:", err);
            if (!res.writableEnded) {
              res.write(
                `data: ${JSON.stringify({ error: "Stream error occurred", text: "Stream error occurred", is_error: true })}\n\n`
              );
              res.end();
            }
            reject(err);
          });
        })
        .catch((error) => {
          const status = error?.response?.status;
          if (includeTools && !hasRetried && (status === 400 || status === 422)) {
            console.warn(
              `Model ${model} rejected tools (status ${status}). Retrying without tools.`
            );
            runStream(false, msgs, true).then(resolve).catch(reject);
            return;
          }
          console.error("Request failed:", error);
          if (!res.headersSent) {
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");
            res.flushHeaders();
          }
          if (!res.writableEnded) {
            res.write(
              `data: ${JSON.stringify({ error: "Chat request failed", text: "Chat request failed", is_error: true })}\n\n`
            );
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
            res.end();
          }
          reject(error);
        });
    });

  // Execute streaming with possible tool call follow-up
  let currentMessages = messages;
  let includeTools = tools && tools.length > 0;

  // First pass (may contain tool call)
  const firstPass = await runStream(includeTools, currentMessages, false);

  if (firstPass.pendingTool && firstPass.pendingTool.name) {
    // Convert single pendingTool to array for consistent processing
    const toolCalls = [firstPass.pendingTool];
    const toolResults = await Promise.all(
      toolCalls.map(async (tc) => {
        let parsedArgs = {};
        try {
          parsedArgs = tc.arguments ? JSON.parse(tc.arguments) : {};
        } catch (err) {
          console.error("Failed to parse tool arguments:", err);
        }
        const argsWithProfile =
          tc.name === "get_profile_visualization" && options?.userProfile
            ? { ...parsedArgs, profile: options.userProfile }
            : parsedArgs;
        let toolResult;
        try {
          toolResult = await toolExecutionService.executeTool(tc.name, argsWithProfile);
        } catch (err) {
          toolResult = { success: false, error: err.message };
        }
        // Send individual tool result to client
        res.write(
          `data: ${JSON.stringify({
            tool_result: { name: tc.name, result: toolResult },
          })}\n\n`
        );
        return { tc, toolResult, args: argsWithProfile };
      })
    );

    // Build assistant message with all tool calls
    const assistantToolCallMsg = {
      role: "assistant",
      tool_calls: toolResults.map(({ tc }) => ({
        id: tc.id,
        type: "function",
        function: {
          name: tc.name,
          arguments: tc.arguments || "{}",
        },
      })),
    };

    // Build tool result messages with Anthropic-compliant is_error and text fields
    const toolResultMessages = toolResults.map(({ tc, toolResult }) => ({
      role: "tool",
      tool_call_id: tc.id,
      content: JSON.stringify(toolResult),
      is_error: !toolResult?.success,
      text: toolResult?.success
        ? `Tool ${tc.name} executed successfully`
        : `Tool ${tc.name} failed: ${toolResult?.error || 'Unknown error'}`
    }));

    currentMessages = [...currentMessages, assistantToolCallMsg, ...toolResultMessages];

    const secondPass = await runStream(includeTools, currentMessages, false);
    if (!secondPass.contentSent && !firstPass.fullResponse) {
      const fallback = "J'ai vérifié l'info et je peux continuer si tu veux.";
      res.write(`data: ${JSON.stringify({ content: fallback })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
    const finalText = secondPass.fullResponse || firstPass.fullResponse || "";
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
    return finalText;
  }

  // No tool call; return accumulated text
  if (!firstPass.contentSent && !firstPass.fullResponse) {
    let manualContentSent = false;
    // Attempt a lightweight manual tool invocation if tools were provided but no content came back.
    if (tools && tools.length > 0 && options?.pageContext) {
      const toolNames = tools
        .map((t) => t.function?.name || t.name)
        .filter(Boolean);

      const lastUserMessage =
        options.lastUserMessage ||
        messages
          .slice()
          .reverse()
          .find((m) => m.role === "user")?.content ||
        "";

      const lowerCtx = (options.pageContext || "").toLowerCase();
      const isSimulator =
        lowerCtx.includes("simulator") ||
        lowerCtx.includes("education") ||
        lowerCtx.includes("arena");

      if (isSimulator && toolNames.includes("backtest_strategy")) {
        const parsed = parseBacktestIntent(lastUserMessage);
        if (parsed) {
          try {
            const backtestResult = await toolExecutionService.executeTool(
              "backtest_strategy",
              parsed
            );
            if (backtestResult?.success) {
              const m = backtestResult.data?.metrics || {};
              const content = `Backtest ${parsed.strategy_name} sur ${parsed.period_years
                } ans:\n- Rendement total: ${m.totalReturn ?? "n/a"}%\n- Annualisé: ${m.annualizedReturn ?? "n/a"
                }%\n- Volatilité: ${m.volatility ?? "n/a"}%\n- Sharpe: ${m.sharpeRatio ?? "n/a"
                }\n- Max drawdown: ${m.maxDrawdown ?? "n/a"}%`;
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
              manualContentSent = true;
              // We consider this a response; do not fall through to generic fallback.
              if (!res.writableEnded) {
                res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
                res.end();
              }
              return parsed;
            }
          } catch (err) {
            console.error("Manual backtest fallback failed:", err);
          }
        }
      }
    }

    if (!manualContentSent) {
      // Provide a helpful fallback so the UI never looks stuck
      const fallback =
        "Je n'ai pas reçu de réponse du modèle pour cette requête. On peut essayer autrement : " +
        "par exemple une allocation 60/40 actions/obligations sur 20 ans donne souvent ~7-8% annualisé avec des drawdowns d'environ 20-25%. " +
        "Veux-tu que je relance le test avec des ETF précis (ex: SPY/IEF/GLD) ?";
      res.write(`data: ${JSON.stringify({ content: fallback })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
  }
  const finalText = firstPass.fullResponse || "";
  if (!res.writableEnded) {
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  }
  return finalText;
}

/**
 * Build portfolio-specific context section for the LLM prompt
 */
function buildPortfolioContextSection(context = {}, language = "fr") {
  if (!context || typeof context !== "object") {
    return "No additional portfolio simulator context was provided.";
  }

  const {
    strategy,
    period,
    generatedAt,
    tickers = [],
    metrics = {},
    customStrategy,
  } = context;

  const lines = [];

  if (strategy) {
    lines.push(`- Active strategy: ${strategy}`);
  }
  if (period) {
    lines.push(`- Time horizon: ${period} years of history`);
  }
  if (Array.isArray(tickers) && tickers.length > 0) {
    lines.push(`- Underlying ETFs: ${tickers.join(", ")}`);
  }

  const metricsForStrategy =
    strategy && metrics[strategy] ? metrics[strategy] : null;
  if (metricsForStrategy) {
    const {
      totalReturn,
      annualReturn,
      volatility,
      sharpeRatio,
      maxDrawdown,
    } = metricsForStrategy;

    lines.push(
      "- Key performance metrics:",
      `  • Total return: ${typeof totalReturn === "number" ? totalReturn.toFixed(1) + "%" : "N/A"
      }`,
      `  • Annual return: ${typeof annualReturn === "number" ? annualReturn.toFixed(1) + "%" : "N/A"
      }`,
      `  • Volatility: ${typeof volatility === "number" ? volatility.toFixed(1) + "%" : "N/A"
      }`,
      `  • Sharpe ratio: ${typeof sharpeRatio === "number" ? sharpeRatio.toFixed(2) : "N/A"
      }`,
      `  • Max drawdown: ${typeof maxDrawdown === "number" ? maxDrawdown.toFixed(1) + "%" : "N/A"
      }`
    );
  }

  if (
    customStrategy &&
    customStrategy.strategyA &&
    customStrategy.strategyB
  ) {
    lines.push(
      "- Custom mix details:",
      `  • Strategy A: ${customStrategy.strategyA}`,
      `  • Strategy B: ${customStrategy.strategyB}`,
      `  • Weight for Strategy A: ${typeof customStrategy.weight === "number"
        ? customStrategy.weight + "%"
        : "N/A"
      }`
    );
  }

  if (generatedAt) {
    lines.push(`- Cached dataset generated at: ${generatedAt}`);
  }

  if (lines.length === 0) {
    lines.push("No specific simulator state was provided.");
  }

  return `### PORTFOLIO SIMULATOR CONTEXT (summarized in ${language === "en" ? "English" : "French"
    }):\n${lines.join(
      "\n"
    )}\n\nUse this information to ground your explanations, compare strategies, and help the user interpret the simulator results.`;
}

/**
 * Handle portfolio-specific chat with contextual prompt
 */
async function handlePortfolioChat(req, res) {
  console.log("POST /api/chat/portfolio hit on server");

  const { message, language = "fr", context } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  if (!env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY === "YOUR_API_KEY_HERE") {
    return res.status(500).json({
      error:
        "OpenRouter API key not configured on the server. Please add it to the .env file.",
    });
  }

  const portfolioContextSection = buildPortfolioContextSection(context, language);

  // For backward compatibility, portfolio endpoint uses unified chatbot prompt with simulator context
  const systemPromptContent = await unifiedSystemPrompt(
    language,
    "simulator",
    false,
    null,
    false,
    null,
    []
  );

  const messages = [
    {
      role: "system",
      content: `${systemPromptContent}\n\n### USER'S CURRENT PORTFOLIO:\n${portfolioContextSection}`,
    },
    { role: "user", content: message },
  ];

  const headers = {
    Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": env.CHAT_REFERER || "https://bubbleinvest.org",
    "X-Title": "Bubble Portfolio Chat Assistant",
  };

  try {
    for (const model of models) {
      try {
        await streamResponse(res, model, messages, headers);
        console.log(`✅ Portfolio chat streamed using model: ${model}`);
        return;
      } catch (error) {
        console.error(
          `Error with model ${model} on portfolio chat:`,
          error.message
        );
      }
    }

    if (!res.headersSent) {
      res.status(500).json({
        error: "All portfolio chat models failed. Please try again later.",
      });
    }
  } catch (error) {
    console.error("Error in portfolio chat endpoint:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "An error occurred while processing your request.",
        details: error.message,
      });
    }
  }
}

/**
 * Get unified system prompt (replaces page-specific prompts)
 * PageContext tells the chatbot which page the user is on
 * userProfile contains onboarding data for playground context
 */
async function getSystemPrompt(
  language,
  pageContext = "index",
  waitlistShared = false,
  userProfile = null,
  isOnboarding = false,
  onboardingStage = null,
  conversationHistory = []
) {
  return unifiedSystemPrompt(
    language,
    pageContext,
    waitlistShared,
    userProfile,
    isOnboarding,
    onboardingStage,
    conversationHistory
  );
}

/**
 * Handle chat request with streaming response
 * Unified chatbot: accepts pageContext (where user is) instead of chatbotType
 */
async function handleChat(req, res) {
  console.log("POST /api/chat hit on server");

  // Support both old 'chatbotType' parameter and new 'pageContext' for backward compatibility
  const {
    message,
    language = "fr",
    lang,
    pageContext = "index",
    context: contextOverride,
    chatbotType,
    history = [],
    contextMetadata = "",
    userProfileContext = "", // From BubbleAgentMemory (side panel chatbot)
    userProfile: requestUserProfile = null // Full profile object for tool execution (get_profile_visualization)
  } = req.body;

  // Backward compatibility: map old chatbotType to new pageContext
  const context = contextOverride || chatbotType || pageContext;
  const resolvedLanguage = language || lang || "fr";

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  if (!env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY === "YOUR_API_KEY_HERE") {
    return res.status(500).json({
      error:
        "OpenRouter API key not configured on the server. Please add it to the .env file.",
    });
  }

  const waitlistShared = Array.isArray(history)
    ? history.some(
      (entry) =>
        entry &&
        entry.role &&
        entry.role !== "user" &&
        typeof entry.content === "string" &&
        entry.content.includes("/#waitlist")
    )
    : false;

  // Extract user profile and onboarding state from contextMetadata for playground
  // Prefer userProfile from request body (BubbleAgentMemory) over contextMetadata.profile
  let userProfile = requestUserProfile || null;
  let metadataBlock = "";
  let isOnboarding = false;
  let onboardingStage = null;

  if (typeof contextMetadata === "string") {
    metadataBlock = contextMetadata.trim();
  } else if (contextMetadata && typeof contextMetadata === "object") {
    // Extract profile for playground context (fallback if no request profile)
    if (!userProfile && contextMetadata.profile) {
      userProfile = contextMetadata.profile;
    }
    // Extract onboarding state
    if (contextMetadata.isOnboarding !== undefined) {
      isOnboarding = contextMetadata.isOnboarding;
    }
    if (contextMetadata.onboardingStage !== undefined) {
      onboardingStage = contextMetadata.onboardingStage;
    }
    // Build metadata block without profile and onboarding state (to avoid duplication)
    const { profile, isOnboarding: _, onboardingStage: __, ...otherMetadata } = contextMetadata;
    if (Object.keys(otherMetadata).length > 0) {
      metadataBlock = JSON.stringify(otherMetadata);
    }
  }

  // Get the unified system prompt with page context, user profile, and onboarding state
  let systemPromptContent = await getSystemPrompt(
    resolvedLanguage,
    context,
    waitlistShared,
    userProfile,
    isOnboarding,
    onboardingStage,
    history
  );

  // Inject lightweight simulator heuristics to help the education chatbot propose mixes
  if (
    (contextOverride || chatbotType || pageContext || "").toLowerCase().includes("simulator") &&
    typeof message === "string"
  ) {
    const heuristics = strategyBuilderService.getHeuristics(message, resolvedLanguage);
    if (heuristics) {
      const hint = typeof metadataBlock === "string" && metadataBlock.length > 0
        ? `${metadataBlock}\n\n[Heuristics]\n${heuristics}`
        : `[Heuristics]\n${heuristics}`;
      metadataBlock = hint;
    }
  }
  if (metadataBlock) {
    systemPromptContent = `${systemPromptContent}\n\n### PAGE CONTEXT NOTES:\n${metadataBlock}`;
  }

  // Add BubbleAgentMemory user profile context (omniscient chatbot feature)
  if (userProfileContext && typeof userProfileContext === "string" && userProfileContext.trim()) {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = userProfileContext.includes('Onboarding completed');
    const hasRiskProfile = userProfileContext.includes('Risk Profile:') && !userProfileContext.includes('Risk Profile: null');

    let onboardingGuidance = '';
    if (!hasCompletedOnboarding && !hasRiskProfile) {
      onboardingGuidance = `

### PROACTIVE ONBOARDING GUIDANCE (IMPORTANT)
This user has NOT completed their investor profile discovery (onboarding).
- When appropriate, gently suggest they discover their investor profile for a personalized experience
- ${resolvedLanguage === 'fr'
          ? 'Use phrases like: "Je vois que tu n\'as pas encore decouvert ton profil investisseur. Veux-tu qu\'on fasse ca ensemble ?" or "Pour te donner des conseils plus personnalises, je te propose de decouvrir ton profil d\'investisseur."'
          : 'Use phrases like: "I see you haven\'t discovered your investor profile yet. Want to do it together?" or "To give you more personalized advice, I suggest discovering your investor profile."'}
- Direct them to the Playground (/investors/playground) for the onboarding experience
- Don't push too hard - if they want to explore without onboarding, help them anyway
- If they ask basic questions about investing concepts, this is a good opportunity to suggest the onboarding`;
    } else if (hasCompletedOnboarding && hasRiskProfile) {
      onboardingGuidance = `

### PERSONALIZED USER (ONBOARDING COMPLETE)
This user has completed onboarding and has a known risk profile.
- Reference their profile naturally in your responses
- Make personalized recommendations based on their risk tolerance
- Acknowledge their preferences and past interactions`;
    }

    systemPromptContent = `${systemPromptContent}\n\n### USER MEMORY (from BubbleAgentMemory - site-wide persistent context):\n${userProfileContext.trim()}${onboardingGuidance}\n\nUse this context to personalize your responses. If the user has a known risk profile or past interactions, reference them naturally when relevant.`;
  }

  // Build messages array with conversation history if provided
  // Attach tool definitions based on page context (for model function calling)
  const toolsForContext = toolExecutionService.getToolsForPageContext(context);

  /**
   * Lightweight preflight: if on simulator/education and the user clearly asked
   * for a simple allocation backtest (e.g., "40/60 sur 20 ans"), run the
   * backtest tool immediately so the user is not left waiting when models
   * ignore tool calls.
   */
  const lowerCtx = (context || "").toLowerCase();
  const simulatorLike =
    lowerCtx.includes("simulator") ||
    lowerCtx.includes("education") ||
    lowerCtx.includes("arena");

  if (simulatorLike && toolsForContext.some((t) => t.function?.name === "backtest_strategy")) {
    const parsedIntent = parseBacktestIntent(message);
    if (parsedIntent) {
      try {
        const backtestResult = await toolExecutionService.executeTool(
          "backtest_strategy",
          parsedIntent
        );
        const m = backtestResult?.data?.metrics || {};
        const content = `Backtest ${parsedIntent.strategy_name} sur ${parsedIntent.period_years
          } ans:\n- Rendement total: ${m.totalReturn ?? "n/a"}%\n- Annualisé: ${m.annualizedReturn ?? "n/a"
          }%\n- Volatilité: ${m.volatility ?? "n/a"}%\n- Sharpe: ${m.sharpeRatio ?? "n/a"
          }\n- Max drawdown: ${m.maxDrawdown ?? "n/a"}%`;

        // SSE immediate response
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return;
      } catch (err) {
        console.error("Preflight backtest failed:", err);
        // Fall through to normal model handling
      }
    }
  }

  /**
   * Preflight for profile visualization: if the user explicitly asks for their profile
   * and the tool is available, return it immediately using the injected userProfile (if any).
   */
  const wantsProfile =
    typeof message === "string" &&
    /\b(profil|profile|risk score|profil investisseur|mon profil)\b/i.test(message);

  if (
    wantsProfile &&
    toolsForContext.some((t) => t.function?.name === "get_profile_visualization")
  ) {
    try {
      const profileResult = await toolExecutionService.executeTool(
        "get_profile_visualization",
        { include_recommendations: true, profile: userProfile || null }
      );

      const p = profileResult?.data?.profile || {};
      const recs = profileResult?.data?.recommendations || [];
      const summary = [
        `Profil: risk=${p.riskScore ?? "n/a"}/100 (confiance ${p.riskConfidence ?? "n/a"}%)`,
        p.traits ? `Traits: ${p.traits.join(", ")}` : null,
        p.goal ? `Objectif: ${p.goal}` : null,
        p.horizon ? `Horizon: ${p.horizon}` : null,
        p.level ? `Niveau: ${p.level}` : null,
      ]
        .filter(Boolean)
        .join(" | ");

      const recText = recs.length
        ? "\nRecommandations: " +
        recs
          .map((r) => `${r.bot || r.strategy || "bot"} (${r.match || ""})`)
          .join(", ")
        : "";

      const content =
        summary || "Je n'ai pas encore de données de profil pour toi." + recText;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    } catch (err) {
      console.error("Preflight profile failed:", err);
      // fall through to normal model handling
    }
  }

  const messages = [
    { role: "system", content: systemPromptContent },
    ...history.map(h => ({
      role: h.role === "user" ? "user" : "assistant",
      content: h.content
    })),
    { role: "user", content: message },
  ];

  const headers = {
    Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
  };

  let lastModelError = null;

  try {
    for (const model of models) {
      try {
        await streamResponse(res, model, messages, headers, toolsForContext, {
          pageContext: context,
          lastUserMessage: message,
          userProfile,
        });
        console.log(`✅ Chat streamed using model: ${model} (context: ${context})`);
        return; // If we get here, streaming was successful
      } catch (error) {
        lastModelError = error;
        console.error(`Error with model ${model}:`, error.message);
        // Try the next model
      }
    }

    // If we've tried all models and none worked
    if (!res.headersSent) {
      // SSE fallback so the UI is not left hanging
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.write(
        `data: ${JSON.stringify({
          content:
            "Je n'ai pas pu obtenir de réponse du modèle pour le moment. On peut réessayer ou tester une allocation simple (ex: 60/40 SPY/IEF) si tu veux.",
        })}\n\n`
      );
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } else if (!res.writableEnded) {
      res.write(
        `data: ${JSON.stringify({
          content:
            "Je n'ai pas pu obtenir de réponse du modèle pour le moment. On peut réessayer ou tester une allocation simple (ex: 60/40 SPY/IEF) si tu veux.",
        })}\n\n`
      );
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "An error occurred while processing your request.",
        details: error.message,
      });
    }
  }
}

module.exports = { handleChat, handlePortfolioChat };
