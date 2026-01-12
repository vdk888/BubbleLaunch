const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");
const env = require("../config/env");
const strategyBuilderService = require("../services/strategyBuilderService");

// Document loading
let missionDocument = "";
let elevatorPitch = "";
let strategicPoints = "";

async function loadDocument(fileName) {
  try {
    const filePath = path.join(__dirname, "../../../docs/company", fileName);
    return await fs.readFile(filePath, "utf-8");
  } catch (error) {
    console.error(`Error loading ${fileName}:`, error);
    return `[${fileName} could not be loaded]`;
  }
}

async function loadAllDocuments() {
  try {
    [missionDocument, elevatorPitch, strategicPoints] = await Promise.all([
      loadDocument("mission_texte.txt"),
      loadDocument("Elevatorpitch5min.md"),
      loadDocument("PointsdeDépartStratégiquesBubble.md"),
    ]);
    console.log("All documents loaded successfully");
  } catch (error) {
    console.error("Error loading documents:", error);
  }
}

// Load additional document for pricing
let portfolioSystemDoc = "";

async function loadPricingDocument() {
  try {
    portfolioSystemDoc = await loadDocument("bubble_portfolio_system.md");
    console.log("Portfolio system document loaded successfully");
  } catch (error) {
    console.error("Error loading portfolio system document:", error);
  }
}

// Load documents when controller is initialized
loadAllDocuments().catch(console.error);
loadPricingDocument().catch(console.error);

/**
 * UNIFIED SYSTEM PROMPT - Single chatbot across all pages
 * Adapts behavior and context based on page and conversation history
 */
const unifiedSystemPrompt = (language, pageContext = 'index', waitlistShared = false, userProfile = null, isOnboarding = false, onboardingStage = null) => {
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
  const isArena = ctx === 'arena' || ctx === 'education-arena' || ctx === 'education/arena';
  const isSimulator = ctx === 'simulator' || ctx === 'education-simulator' || ctx === 'education/simulator';

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

  return `⚠️ CRITICAL - READ FIRST - LANGUAGE REQUIREMENT:
You MUST respond EXCLUSIVELY in ${language === 'fr' ? 'FRENCH (français)' : 'ENGLISH'}.
- Current user language: ${language.toUpperCase()}
- User has explicitly selected this language in their interface
- Ignore any previous messages in other languages - they are from old sessions or language switches
- Even if conversation history contains ${language === 'fr' ? 'English' : 'French'} text, respond only in ${language.toUpperCase()}
- Never mix languages or switch mid-conversation unless the user explicitly asks
- Use natural ${language === 'fr' ? 'French' : 'English'} tone and vocabulary

---

You are Bubble's AI Assistant - a unified conversational guide available across our entire platform (index page, pricing, portfolio simulator, and more).${playgroundBlock}${simplicityBlock}${educationBlock}

Your goal is to be helpful, transparent, and embody Bubble's mission to democratize intelligent investing.

### FOUNDATIONAL KNOWLEDGE:

**Mission & Vision:**
${missionDocument}

**Elevator Pitch:**
${elevatorPitch}

**Strategic Points:**
${strategicPoints}

**Portfolio System & Pricing:**
${portfolioSystemDoc}

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

const models = [
  "google/gemini-2.0-flash-001",
  "openai/gpt-4.1-mini",
  "mistralai/magistral-small-2506",
  "deepseek/deepseek-r1-0528:free",
];

/**
 * Helper function to handle streaming response
 */
async function streamResponse(res, model, messages, headers) {
  return new Promise((resolve, reject) => {
    axios({
      method: "post",
      url: "https://openrouter.ai/api/v1/chat/completions",
      data: {
        model: model,
        messages: messages,
        stream: true,
      },
      responseType: "stream",
      headers: headers,
    })
      .then((response) => {
        // Set headers for SSE (Server-Sent Events)
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        let fullResponse = "";

        response.data.on("data", (chunk) => {
          const lines = chunk
            .toString()
            .split("\n")
            .filter((line) => line.trim() !== "");

          for (const line of lines) {
            const message = line.replace(/^data: /, "").trim();

            if (message === "[DONE]") {
              res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
              res.end();
              resolve(fullResponse);
              return;
            }

            try {
              const parsed = JSON.parse(message);
              if (parsed.choices && parsed.choices[0].delta.content) {
                const content = parsed.choices[0].delta.content;
                fullResponse += content;
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
              }
            } catch (e) {
              console.error("Error parsing message:", e);
            }
          }
        });

        response.data.on("end", () => {
          if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
            res.end();
            resolve(fullResponse);
          }
        });

        response.data.on("error", (err) => {
          console.error("Stream error:", err);
          if (!res.writableEnded) {
            res.write(
              `data: ${JSON.stringify({ error: "Stream error occurred" })}\n\n`
            );
            res.end();
          }
          reject(err);
        });
      })
      .catch((error) => {
        console.error("Request failed:", error);
        reject(error);
      });
  });
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
      `  • Total return: ${
        typeof totalReturn === "number" ? totalReturn.toFixed(1) + "%" : "N/A"
      }`,
      `  • Annual return: ${
        typeof annualReturn === "number" ? annualReturn.toFixed(1) + "%" : "N/A"
      }`,
      `  • Volatility: ${
        typeof volatility === "number" ? volatility.toFixed(1) + "%" : "N/A"
      }`,
      `  • Sharpe ratio: ${
        typeof sharpeRatio === "number" ? sharpeRatio.toFixed(2) : "N/A"
      }`,
      `  • Max drawdown: ${
        typeof maxDrawdown === "number" ? maxDrawdown.toFixed(1) + "%" : "N/A"
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
      `  • Weight for Strategy A: ${
        typeof customStrategy.weight === "number"
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

  return `### PORTFOLIO SIMULATOR CONTEXT (summarized in ${
    language === "en" ? "English" : "French"
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
  const systemPromptContent = unifiedSystemPrompt(language, 'simulator', false);

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
function getSystemPrompt(language, pageContext = 'index', waitlistShared = false, userProfile = null, isOnboarding = false, onboardingStage = null) {
  return unifiedSystemPrompt(language, pageContext, waitlistShared, userProfile, isOnboarding, onboardingStage);
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
    userProfileContext = "" // From BubbleAgentMemory (side panel chatbot)
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
  let userProfile = null;
  let metadataBlock = "";
  let isOnboarding = false;
  let onboardingStage = null;

  if (typeof contextMetadata === "string") {
    metadataBlock = contextMetadata.trim();
  } else if (contextMetadata && typeof contextMetadata === "object") {
    // Extract profile for playground context
    if (contextMetadata.profile) {
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
  let systemPromptContent = getSystemPrompt(resolvedLanguage, context, waitlistShared, userProfile, isOnboarding, onboardingStage);

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

  try {
    for (const model of models) {
      try {
        await streamResponse(res, model, messages, headers);
        console.log(`✅ Chat streamed using model: ${model} (context: ${context})`);
        return; // If we get here, streaming was successful
      } catch (error) {
        console.error(`Error with model ${model}:`, error.message);
        // Try the next model
      }
    }

    // If we've tried all models and none worked
    if (!res.headersSent) {
      res.status(500).json({
        error: "All LLM providers failed. Please try again later.",
        details: error?.message,
      });
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
