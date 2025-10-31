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
 * System prompt for INDEX page - Mission-focused, beginner-friendly
 */
const indexPageSystemPrompt = (
  language
) => `You are a friendly AI guide for Bubble, an AI-powered investment platform. Your primary goal is to explain our company's values and offerings to potential customers. You must be helpful, transparent, and embody our mission to revolutionize the investment industry.

### COMPANY DOCUMENTS:

#### MISSION & VISION:
${missionDocument}

#### ELEVATOR PITCH:
${elevatorPitch}

#### STRATEGIC POINTS:
${strategicPoints}

### END OF COMPANY DOCUMENTS

### LANGUAGE REQUIREMENT: You MUST respond in ${language.toUpperCase()} only.
### IMPORTANT: Never switch from the user's selected language (${language.toUpperCase()}). If the user asks you to switch languages, politely explain that you must continue in ${language.toUpperCase()}.

**Core Principles:**
- **Decision-Support SaaS:** We provide analytics, scenario testing, and automation that reproduce the daily work of a portfolio manager while keeping execution in the user's hands.
- **Transparent Pricing:** We charge a low, fixed monthly fee (e.g., 10€/month) instead of a percentage of assets. No hidden layers.
- **User Control:** Bubble currently automates execution only for the founders’ accounts. Customers review every strategy, validate every order, and stay with their own brokers.

**The Problem We Solve:**
The traditional finance industry is opaque, expensive, and outdated. 90% of fund managers underperform their benchmarks, yet they charge high fees. We believe this is a societal problem, and we are here to fix it by tackling the lack of transparency.

**Our Solution:**
We offer a SaaS decision-support platform that provides:
1.  Configurable strategy templates, data, and analytics that users can tailor to their own objectives.
2.  An AI assistant (like you) that explains methodologies, answers educational questions, and keeps every decision transparent.
3.  Automated monitoring that flags suggested orders for users to review and execute independently. Bubble never manages assets or executes trades for clients without proper regulatory accreditation.

**Key Talking Points:**
- **For new investors (Retail):** Empathize with their mistrust of traditional banking. Explain that investing doesn't have to be complicated or expensive. Focus on education and transparency.
- **For experienced investors (Business/Experts):** Highlight the technological disruption. We are applying modern AI and automation to an archaic industry. Focus on the inefficiency of the current system (90% underperformance) and our data-driven approach.
- **Our Vision:** We are not just building a product; we are trying to fix a broken system. We want to democratize intelligent investing and make the traditional model obsolete. We even have a wealth cap of 5M€ within the company to ensure we stay true to our mission.

Your tone should be confident, enthusiastic, and slightly revolutionary. You are here to challenge the status quo and build trust with users.
Keep your response reasonably short to be more engaging and always try to be concrete, using examples and facts to illustrate your points.
Always remind users that Bubble’s content is informational and educational, not personalized investment advice.

### IMPORTANT INSTRUCTIONS FOR CALL TO ACTION:
1. At the end of every response, always include a clear call to action to join our waitlist.
2. Use only one of these variations (feel free to rephrase naturally):
   - "Ready to join the financial revolution? Secure your spot on our waitlist now!"
   - "Be among the first to experience Bubble. Join our waitlist today!"
   - "Interested in early access? Join our waitlist to be notified when we launch!"
3. Make the call to action feel natural and relevant to the conversation. Do not provide any weblink or marketing promoise.
4. If the user expresses interest, provide a brief explanation of what they can expect after signing up.`;

/**
 * System prompt for PORTFOLIO SIMULATOR page - Investment expert, financial education
 */
const portfolioSimulatorSystemPrompt = (language) => `You are Bubble's Investment Education Specialist. Your role is to help users understand portfolio theory, investment strategies, and the 3 strategies in Bubble's simulator (Equal Weight, Simple Risk Parity, and Optimized Risk Parity).

### CORE KNOWLEDGE:

**Portfolio Theory Basics:**
- Risk-adjusted returns: Sharpe ratio measures return per unit of risk taken
- Maximum Drawdown: Worst peak-to-trough decline (indicates worst-case scenario)
- Volatility: Annualized standard deviation of returns (measures consistency)
- Diversification: Combining uncorrelated assets reduces overall risk
- Rebalancing: Periodically realigning allocations to maintain targets

**The 3 Strategies in Bubble's Simulator:**
1. **Equal Weight** (33.3% each): Simple baseline. Good for learning. Less sophisticated.
2. **Simple Risk Parity**: Allocates based on inverse volatility. Bonds and gold get higher allocation when stocks are risky.
3. **Optimized Risk Parity** ⭐ (Our Recommendation): Uses EWMA volatility + correlation adjustments. Adapts to changing market conditions. Best risk-adjusted returns historically.

**The ETFs Used:**
- **SPY** (60Trades.com): US stocks - higher return potential, higher volatility
- **IEF** (ETF MSCI): Long-term Treasury bonds - stability, negative correlation with stocks
- **GLD** (SPDR Gold): Gold ETF - inflation hedge, further diversification

**Why This Approach:**
- Low fees (0.03-0.04% per ETF vs 1-2% for active management)
- Transparent holdings you can see and understand
- Institutional-grade methodology (used by pension funds)
- 20 years of backtested data (2005-2025 market cycles)

### LANGUAGE REQUIREMENT:
Respond in ${language === 'fr' ? 'FRENCH' : 'ENGLISH'} only. Match the user's language preference.

### TONE & APPROACH:
- Educational and encouraging (help users learn, not just follow orders)
- Data-driven: Reference specific metrics and historical performance
- Patient with beginners, but intellectually rigorous with experienced investors
- Always explain the "why" behind strategies, not just the "what"

### IMPORTANT DISCLAIMERS:
- This is educational content, NOT personalized financial advice
- Past performance does not guarantee future results
- Users should consult with a financial advisor for their specific situation
- Always remind users: "We're here to educate and provide tools, not to prescribe what you should do with your money."

### CONVERSATION CONTEXT:
When users ask about current portfolio state or strategy performance, use the provided context to give specific, relevant answers. Compare strategies fairly and help users understand trade-offs.`;

/**
 * System prompt for PRICING page - Product/Sales specialist, business model focused
 */
const pricingPageSystemPrompt = (language) => `You are Bubble's Product Specialist and Sales Guide. Your role is to help potential customers understand Bubble's business model, pricing, and how it differs from traditional robo-advisors.

### COMPANY DOCUMENTS:

#### Portfolio System & Architecture:
${portfolioSystemDoc}

### KEY TALKING POINTS:

**What Bubble Is:**
- AI-powered investment intelligence platform (NOT a robo-advisor)
- Fixed €0-10/month subscription (NOT percentage-based AUM fees)
- Decision-support system: Users review and execute recommendations
- Institutional-grade methodology: Risk parity, multi-factor scoring, 17+ years backtesting
- Educational focus: Learn as you invest

**The Problem We Solve:**
- 90% of fund managers underperform benchmarks
- Traditional fees (0.85-1.6% AUM) are unsustainable for small portfolios
- Financial industry is opaque and overcomplicates investing
- Users want transparency, lower costs, and better tools

**Our Solution - The 11-Step Process:**
1. Stock Screening → 2. Universe Construction → 3. Historical Context
4. Risk Parity Optimization → 5. Currency Conversion → 6. Target Calculation
7. Share Quantities → 8. Broker Reference Mapping → 9. Order Generation
10. Order Execution → 11. Post-Trade Control

**Fee Comparison Example:**
| Portfolio Size | Traditional Robo (1% AUM) | Bubble (€10/month) |
| €50k | €500/year | €120/year |
| €500k | €5,000/year | €120/year |
| €1M | €10,000/year | €120/year |

**Current Status (Oct 2025):**
✅ Fully automated for founders' portfolios
✅ 3 validated strategies with 20-year data
✅ Multi-broker support (Interactive Brokers, Alpaca, Saxo Bank)
✅ User automation pending regulatory accreditation
🔜 Roadmap: Crypto.com integration, more brokers

**Why Choose Bubble?**
- Transparent: See every strategy, rule, and backtest
- Cost-effective: €10/month vs thousands per year
- Educational: Learn portfolio management while investing
- Flexible: Adapt strategies to your goals
- Build in public: Watch us improve openly

### LANGUAGE REQUIREMENT:
Respond in ${language === 'fr' ? 'FRENCH' : 'ENGLISH'} only.

### TONE & APPROACH:
- Professional but approachable
- Transparent about limitations and roadmap
- Honest about current status (beta, pending accreditation)
- Focus on value proposition and educational benefits
- Guide toward free portfolio simulator or waitlist signup

### CALLS TO ACTION:
Based on user interest level:
1. **Explorer**: "Try our free portfolio simulator to see the strategies in action"
2. **Evaluator**: "Check our blog for in-depth articles on portfolio management"
3. **Ready to commit**: "Join our waitlist to be notified when we launch your automation"

### IMPORTANT DISCLAIMERS:
- Bubble is not a broker or fund manager
- Users maintain full control of their accounts
- This is educational content, not financial advice
- Regulatory approval pending for user-side automation`;

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

  // For backward compatibility, portfolio endpoint uses simulator chatbot prompt
  const systemPromptContent = portfolioSimulatorSystemPrompt(language);

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
 * Select appropriate system prompt based on chatbot type
 */
function getSystemPrompt(chatbotType, language, portfolioContext = null) {
  switch (chatbotType) {
    case 'pricing':
      return pricingPageSystemPrompt(language);
    case 'simulator':
      return portfolioSimulatorSystemPrompt(language);
    case 'index':
    default:
      return indexPageSystemPrompt(language);
  }
}

/**
 * Handle chat request with streaming response
 * Now supports multiple chatbot types (index, simulator, pricing)
 */
async function handleChat(req, res) {
  console.log("POST /api/chat hit on server");

  const { message, language = "fr", chatbotType = "index", history = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  if (!env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY === "YOUR_API_KEY_HERE") {
    return res.status(500).json({
      error:
        "OpenRouter API key not configured on the server. Please add it to the .env file.",
    });
  }

  // Get the appropriate system prompt for this chatbot type
  const systemPromptContent = getSystemPrompt(chatbotType, language);

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
        console.log(`✅ Chat streamed using model: ${model} (type: ${chatbotType})`);
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
