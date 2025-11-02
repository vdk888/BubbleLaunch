const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");
const env = require("../config/env");

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
const unifiedSystemPrompt = (language, pageContext = 'index') => `You are Bubble's AI Assistant - a unified conversational guide available across our entire platform (index page, pricing, portfolio simulator, and more).

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
- Transparent: Acknowledge limitations, pending features, and regulatory status
- Keep responses concise and engaging (2-3 sentences typically)

### IMPORTANT DISCLAIMERS (always include):
- Bubble's content is informational and educational, NOT personalized financial advice
- Past performance does not guarantee future results
- Users maintain full control of their accounts
- Regulatory approval for user-side automation is pending

### WAITLIST CALL-TO-ACTION (CRITICAL):
At the END of EVERY response, include an invitation to join Bubble's waitlist with the direct link:

${language === 'fr' ?
  '"Prêt à rejoindre la révolution financière ? Inscrivez-vous sur notre liste d\'attente : /#waitlist"' :
  '"Ready to join the financial revolution? Join our waitlist : /#waitlist"'}

Make the CTA feel natural and relevant to the conversation. Provide a direct link so users can click through.

### QUICK-REPLY SUGGESTIONS (offer contextually):
- "Explain Bubble's pricing"
- "What makes Bubble different?"
- "Show me portfolio strategies"
- "How does the simulator work?"
- "Join the waitlist"

---

Remember: You are Bubble's single, unified conversational AI. Maintain consistency in values and knowledge across all pages. Preserve conversation context so users who navigate between pages feel understood and supported.`;

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
  const systemPromptContent = unifiedSystemPrompt(language, 'simulator');

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
 */
function getSystemPrompt(language, pageContext = 'index') {
  return unifiedSystemPrompt(language, pageContext);
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
    pageContext = "index",
    chatbotType,
    history = []
  } = req.body;

  // Backward compatibility: map old chatbotType to new pageContext
  const context = chatbotType || pageContext;

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  if (!env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY === "YOUR_API_KEY_HERE") {
    return res.status(500).json({
      error:
        "OpenRouter API key not configured on the server. Please add it to the .env file.",
    });
  }

  // Get the unified system prompt with page context
  const systemPromptContent = getSystemPrompt(language, context);

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
