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
const unifiedSystemPrompt = (language, pageContext = 'index', waitlistShared = false, userProfile = null) => {
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

  // Build user profile block if available
  let profileBlock = '';
  if (userProfile && isPlayground) {
    const levelMap = {
      beginner: { fr: 'Debutant', en: 'Beginner' },
      intermediate: { fr: 'Intermediaire', en: 'Intermediate' },
      advanced: { fr: 'Avance', en: 'Advanced' }
    };
    const goalMap = {
      learn_basics: { fr: 'Apprendre les bases', en: 'Learn the basics' },
      build_strategy: { fr: 'Construire une strategie', en: 'Build a strategy' },
      watch_arena: { fr: 'Observer les bots', en: 'Watch AI bots' },
      test_portfolio: { fr: 'Tester un portefeuille', en: 'Test a portfolio' }
    };
    const styleMap = {
      videos: { fr: 'Videos', en: 'Videos' },
      exercises: { fr: 'Exercices pratiques', en: 'Hands-on exercises' },
      dialogue: { fr: 'Questions-reponses', en: 'Q&A dialogue' },
      explore: { fr: 'Auto-exploration', en: 'Self-exploration' }
    };

    const level = levelMap[userProfile.level]?.[language] || userProfile.level || 'unknown';
    const goal = goalMap[userProfile.goal]?.[language] || userProfile.goal || 'exploring';
    const style = styleMap[userProfile.learningStyle]?.[language] || userProfile.learningStyle || 'mixed';

    profileBlock = `

### USER PROFILE (from onboarding)
- Knowledge Level: ${level}
- Primary Goal: ${goal}
- Learning Style: ${style}
- Onboarding Complete: ${userProfile.onboardingComplete ? 'Yes' : 'No'}

IMPORTANT: Adapt your vocabulary, depth, and examples based on this profile:
- For BEGINNERS: Use simple analogies, avoid jargon, explain step by step
- For INTERMEDIATE: Use standard financial terms with brief explanations
- For ADVANCED: Be technical, reference specific metrics and strategies`;
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

When relevant, suggest exploring:
- The Arena (watch AI bots trade through crises)
- The Simulator (build and test your own strategy)
- Educational videos on ETFs, diversification, risk

Keep responses concise (2-4 sentences typically) but expand when explaining concepts.
Always offer to go deeper or move to the next topic.${profileBlock}`
    : '';

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

  return `You are Bubble's AI Assistant - a unified conversational guide available across our entire platform (index page, pricing, portfolio simulator, and more).${playgroundBlock}${educationBlock}

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

**What Bubble Is:**
- AI-powered decision-support SaaS platform (NOT a robo-advisor)
- Fixed €0-10/month subscription (NOT percentage-based AUM fees)
- Transparent, educational, user-controlled investments
- Multi-strategy approach: Equal Weight, Risk Parity, Optimized Risk Parity
- Institutional-grade methodology accessible to everyone

**Portfolio Theory Essentials:**
- Sharpe ratio: Risk-adjusted return metric
- Maximum Drawdown: Worst peak-to-trough decline
- Volatility: Consistency and stability measure
- Diversification: Core strategy across SPY (stocks), IEF (bonds), GLD (gold)
- Rebalancing: Maintaining target allocations

**The 3 Strategies:**
1. Equal Weight (33.3% each) - Simple baseline
2. Simple Risk Parity - Inverse volatility weighting
3. Optimized Risk Parity ⭐ - EWMA + correlation, best historical performance

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

### LANGUAGE REQUIREMENT:
You MUST respond in ${language.toUpperCase()} only.
- FR: Use natural French, match French-speaking user tone
- EN: Use natural English, match English-speaking user tone
Never switch languages unless explicitly asked (and then politely decline).

### FIRST MESSAGE (Greeting):
${language === 'fr' ?
  '"Bonjour, je suis Bubble – comment puis-je vous aider ?"' :
  '"Hello, I\'m Bubble – how can I help you?"'}

After greeting, suggest relevant quick-reply options based on the page context.

### TONE & APPROACH:
- Confident, enthusiastic, and slightly revolutionary
- Educational: Explain the "why" behind concepts
- Patient with beginners, rigorous with experienced investors
- Data-driven: Reference specific metrics, backtests, and historical data
- Transparent: Acknowledge limitations and upcoming features without mentioning internal regulatory processes
- Keep responses concise and engaging (2-3 sentences typically)

### IMPORTANT DISCLAIMERS (include only when relevant to the user's question):
- Bubble's content is informational and educational, NOT personalized financial advice
- Past performance does not guarantee future results
- Users maintain full control of their accounts

### WAITLIST CALL-TO-ACTION (USE JUDGEMENT):
- Offer the waitlist link when the user asks how to join, requests access, pricing, availability, or when wrapping up a helpful exchange.
- Keep the tone invitational, not pushy, and ensure the CTA feels relevant to what the user just asked.
- Do **not** include the CTA in every response. ${
  waitlistShared
    ? "You have already shared the waitlist link in this conversation; only repeat it if the user explicitly asks you to."
    : "If you share the link once, avoid repeating it unless the user explicitly asks for it again."
}
- When appropriate, use this format:
  ${language === 'fr'
    ? '"Prêt à rejoindre la révolution financière ? Inscrivez-vous sur notre liste d\'attente : /#waitlist"'
    : '"Ready to join the financial revolution? Join our waitlist : /#waitlist"'}

### QUICK-REPLY SUGGESTIONS (offer contextually):
- "Explain Bubble's pricing"
- "What makes Bubble different?"
- "Show me portfolio strategies"
- "How does the simulator work?"
- "Join the waitlist"

---

Remember: You are Bubble's single, unified conversational AI. Maintain consistency in values and knowledge across all pages. Preserve conversation context so users who navigate between pages feel understood and supported.`;
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
function getSystemPrompt(language, pageContext = 'index', waitlistShared = false, userProfile = null) {
  return unifiedSystemPrompt(language, pageContext, waitlistShared, userProfile);
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
    contextMetadata = ""
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

  // Extract user profile from contextMetadata for playground
  let userProfile = null;
  let metadataBlock = "";
  if (typeof contextMetadata === "string") {
    metadataBlock = contextMetadata.trim();
  } else if (contextMetadata && typeof contextMetadata === "object") {
    // Extract profile for playground context
    if (contextMetadata.profile) {
      userProfile = contextMetadata.profile;
    }
    // Build metadata block without profile (to avoid duplication)
    const { profile, ...otherMetadata } = contextMetadata;
    if (Object.keys(otherMetadata).length > 0) {
      metadataBlock = JSON.stringify(otherMetadata);
    }
  }

  // Get the unified system prompt with page context and user profile
  let systemPromptContent = getSystemPrompt(resolvedLanguage, context, waitlistShared, userProfile);

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
