const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");
const env = require("../config/env");
const toolExecutionService = require("../services/toolExecutionService");

// Context modules are loaded on-demand to keep system prompts lean
const contextModuleFilenames = {
  core: "core_context.md",
  technical: "technical_context.md",
  pitch: "pitch_variations.md",
  vision: "vision_context.md",
  detailed_mission: "detailed_mission.md",
  professionals: "professionals_core.md",
  individuals: "individuals_core.md",
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

  // Add by page context
  if (ctx.includes("professionals")) {
    modules.add("professionals");
  }
  if (ctx.includes("individuals") || ctx.includes("investors")) {
    modules.add("individuals");
  }

  // Technical context triggers (AI tools, POC, implementation)
  if (
    /\b(technical|api|agent|deploy|implement|cloud|aws|claude code|codex|automation|poc|stack|mcp|n8n|infrastructure)\b/i.test(
      recentMessages
    )
  ) {
    modules.add("technical");
  }

  // B2B / consulting triggers
  if (
    /\b(consulting|projet|project|diagnostic|cgp|pme|sme|accompagnement|sprint|co-construction|devis|quote|workflow|client|b2b|business|entreprise|company)\b/i.test(
      recentMessages
    )
  ) {
    modules.add("professionals");
  }

  // Pitch variation triggers
  if (
    /\b(pitch|business case|presentation|partenaire|partner|differenci|competitive|comparai|compare)\b/i.test(
      recentMessages
    )
  ) {
    modules.add("pitch");
  }

  // Vision/philosophy triggers
  if (
    /\b(ethics|future|philosophy|vision|mission|values|benevolence|empowerment|irreversible|sartre|attention|selfware|impact|humanity)\b/i.test(
      recentMessages
    )
  ) {
    modules.add("vision");
    modules.add("detailed_mission");
  }

  // Content / B2C / showcase triggers
  if (
    /\b(newsletter|blog|content|youtube|substack|tutorial|build in public|showcase|poc|demo|follow|instagram|linkedin|github|open.?source)\b/i.test(
      recentMessages
    )
  ) {
    modules.add("individuals");
  }

  // Default to detailed mission if asking about Bubble broadly
  if (
    modules.size === 1 &&
    /\b(why|pourquoi|mission|about bubble|what is bubble|qui êtes|c'est quoi bubble|who are you|tell me about)\b/i.test(
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
 *
 * v3.0 — Redesigned for new business model:
 *   B2C = free content/showcase/marketing (individuals)
 *   B2B = custom AI agent consulting & implementation (professionals)
 */
const unifiedSystemPrompt = async (
  language,
  pageContext = "index",
  userProfile = null,
  conversationHistory = []
) => {
  // Normalize context for routing
  const ctx = (pageContext || "index").toLowerCase();

  const isProfessionals = ctx === "professionals" || ctx.includes("professionals");
  const isIndividuals = ctx === "individuals" || ctx.includes("individuals") || ctx.includes("investors");

  const selectedModules = selectContextModules(conversationHistory, ctx);
  const contextDocs = await Promise.all(
    selectedModules.map((mod) => loadContextModule(mod))
  );
  const dynamicContext = contextDocs.join("\n\n---\n\n");

  // Build user profile block if available (BubbleAgentMemory v2)
  let profileBlock = "";
  if (userProfile) {
    const profile = userProfile.profile || userProfile;
    const journey = userProfile.journey || {};
    const memory = userProfile.memory || {};

    const visitorType = profile.visitorType;
    const interestArea = profile.interestArea;
    const companyType = profile.companyType;
    const industry = profile.industry;
    const painPoint = profile.painPoint;
    const aiMaturity = profile.aiMaturity;
    const traits = Array.isArray(profile.traits) ? profile.traits.slice(-5) : [];
    const level = profile.knowledgeLevel || profile.level || null;
    const isReturningUser = journey.isReturningUser || journey.totalVisits > 1;
    const engagementLevel = journey.engagementLevel || "visitor";
    const contactRequested = journey.contactRequested || false;
    const keyInsights = Array.isArray(memory.keyInsights)
      ? memory.keyInsights
          .slice(-5)
          .map((i) => (typeof i === "string" ? i : i.insight))
      : [];

    profileBlock = `

### VISITOR PROFILE (BubbleAgentMemory v2)
- Visitor Type: ${visitorType || "Not yet determined"}
${interestArea ? `- Interest Area: ${interestArea}` : ""}
${companyType ? `- Company Type: ${companyType}` : ""}
${industry ? `- Industry: ${industry}` : ""}
${painPoint ? `- Pain Point: ${painPoint}` : ""}
${aiMaturity ? `- AI Maturity: ${aiMaturity}` : ""}
${traits.length > 0 ? `- Traits: ${traits.join(", ")}` : ""}
${level ? `- Knowledge Level: ${level}` : ""}
- Engagement Level: ${engagementLevel}
${contactRequested ? "- Contact Requested: Yes" : ""}
${isReturningUser ? "- Returning User: Yes (welcome them warmly!)" : ""}

${
  keyInsights.length > 0
    ? `### WHAT WE KNOW ABOUT THEM
${keyInsights.map((i) => `- ${i}`).join("\n")}`
    : ""
}

IMPORTANT: Adapt your approach based on this profile:
- If PROFESSIONAL: Focus on B2B value, qualify their needs, guide toward booking a call
- If INDIVIDUAL: Share content, encourage newsletter/social follow, mention "want this for your business?"
- If UNKNOWN: Discover if they're individual or professional through natural conversation`;
  }

  // Professionals context block
  const professionalsBlock = isProfessionals
    ? `

### PROFESSIONALS CONTEXT (B2B — Custom AI Agent Consulting)
- **Audience**: CGPs, wealth managers, SMEs, independents, tech-forward entrepreneurs exploring AI workflow automation
- **Tone**: ${language === "fr" ? 'Formel mais accessible (utilise "vous")' : 'Professional but approachable'}, concise, results-driven
- **Positioning**: Systematic early adopters — we deploy the latest AI tools weeks after release. Ex-Deloitte & UBS background.
- **What we build**: Custom AI agents, workflow automation (reporting, monitoring, client management, reconciliation), AI copilots — NOT generic ChatGPT wrappers
- **Our approach**:
  - Co-construction: We build WITH the client in joint sessions (1-2h/week) — they learn by doing
  - Guaranteed autonomy: At the end, you don't need us anymore
  - Short sprints (2-4 weeks), not 6-month tunnels
  - Fixed-price on quote, transparent budgets
- **Process**: Discovery (2-week diagnostic) → Co-Construction Sprint → Handoff & Autonomy → Optional ongoing support
- **CTA**: ${language === "fr" ? '"Réserver un appel diagnostic" → Calendly ou formulaire de contact' : '"Book a diagnostic call" → Calendly or contact form'}
- **Key messages**:
  - "We don't sell PowerPoint. We implement directly."
  - "We build with you. At the end, you don't need us anymore."
  - "If there's a limitation, you'll see it before you sign."
- **Finance niche**: We understand UCITS, KYC, AMF compliance natively — no translation needed`
    : "";

  // Individuals context block
  const individualsBlock = isIndividuals
    ? `

### INDIVIDUALS CONTEXT (B2C — Free Content & Showcase)
- **Audience**: Tech/finance-savvy individuals, early adopters, curious minds interested in AI and investment
- **Tone**: ${language === "fr" ? 'Amical, authentique (utilise "tu")' : "Friendly, authentic, inspiring"}, conversational, build-in-public energy
- **What we offer (FREE)**:
  - Investment Agent POC: Our AI agent manages our own portfolio — we share everything (strategy, code, results, mistakes)
  - AI Agent Tutorials: How to install and configure agents for any use case
  - Build in Public: Decisions, trade-offs, learnings shared via blog, newsletter, social media
  - Philosophical essays on AI's impact on work, value, attention
- **Content pillars**: Build in public, Demystify AI & Investment, Business Use Cases, Agents as Showcase, Philosophical Essays
- **Channels**: LinkedIn (primary), YouTube (tutorials), Substack (newsletter), Instagram (@behindthebubble.ai), GitHub (open-source), X (@bubbleinvest)
- **CTAs**:
  - ${language === "fr" ? '"Suis notre aventure" → réseaux sociaux, newsletter' : '"Follow our journey" → social media, newsletter'}
  - ${language === "fr" ? '"Tu veux la même chose pour ton business ?" → Réserver un appel (passerelle B2B)' : '"Want this for your business?" → Book a call (B2B bridge)'}
- **What we DON'T do**: No paid product for individuals, no personalized financial advice, no artificial monetization`
    : "";

  return `⚠️ CRITICAL - READ FIRST - LANGUAGE REQUIREMENT:
You MUST respond EXCLUSIVELY in ${language === "fr" ? "FRENCH (français)" : "ENGLISH"}.
- Current user language: ${language.toUpperCase()}
- User has explicitly selected this language in their interface
- Ignore any previous messages in other languages - they are from old sessions or language switches
- Even if conversation history contains ${language === "fr" ? "English" : "French"} text, respond only in ${language.toUpperCase()}
- Never mix languages or switch mid-conversation unless the user explicitly asks
- Do NOT insert words in any other language or script (no Japanese/Chinese/etc.) unless the user explicitly requests it
- Use natural ${language === "fr" ? "French" : "English"} tone and vocabulary
- If you accidentally produce any non-${language.toUpperCase()} tokens, immediately correct to ${language === "fr" ? "français uniquement" : language}.

---

You are Bubble's AI Assistant — a unified conversational guide for Bubble Invest's website.

Bubble Invest has two activities:
1. **B2B (Core Business)**: Custom AI agent consulting & implementation for professionals
2. **B2C (Free Content = Marketing)**: Tutorials, demos, POC showcase, educational content — proves expertise and feeds B2B pipeline
${professionalsBlock}${individualsBlock}${profileBlock}

### FOUNDATIONAL KNOWLEDGE:
${dynamicContext}

### CORE UNDERSTANDING:

**The Selfware Model:**
We use what we build. Our investment agent is our own proof of concept — shared publicly with full transparency on what works, what breaks, how we fix it. This extends to all AI agents we build.

**Why We Shifted (2026):**
SaaS as the default form is losing its justification. The future is agents, selfware, and intent-driven systems — built around what you want to achieve, not around screens. When the agent becomes the gateway, the product is no longer the app — it's how you make your tools work together. That's why we moved from building a SaaS product to building AI agents and sharing everything. Not an opportunistic pivot — a structural observation.

**What Bubble IS:**
- **AI agent consultancy** — We accompany professionals in adopting and implementing custom AI agents
- **Systematic early adopters** — We deploy the latest AI tools weeks after release (Claude Code, Codex, Gemini, MCP, n8n)
- **Finance × Tech niche** — Ex-Deloitte & UBS, we natively understand compliance, regulation, financial workflows
- **Co-constructors** — We build WITH clients, not FOR them. Joint sessions, native training, guaranteed autonomy
- **Build in public** — We share everything: strengths, weaknesses, doubts, learnings, code

**What Bubble is NOT:**
- ❌ NOT a SaaS product or robo-advisor (our investment agent is a POC, not a product)
- ❌ NOT a generic AI consultant (we have deep finance domain expertise)
- ❌ NOT selling slides or strategy decks (we implement directly)
- ❌ NOT creating dependency (our goal is client autonomy)
- ❌ NOT giving personalized financial advice

**Our Edge:**
- Finance background (Deloitte + UBS) → native understanding of client constraints
- Early adoption → clients always ahead of competition
- Radical transparency → if a free tool works, we say so
- Empowerment over dependency → we thrive on your emancipation

### CONTEXT-AWARE BEHAVIOR:

**If user is on INDEX page:**
- Focus on Bubble's mission, dual activity (B2B consulting + B2C content), and the selfware model
- Help visitors understand what Bubble does and guide them to the right path (individual or professional)
- Encourage exploration: blog, POC showcase, or booking a call

**If user is on INDIVIDUALS page:**
- Focus on free content: POC showcase, newsletter, tutorials, build-in-public journey
- Encourage following on social channels (LinkedIn, Substack, YouTube, Instagram, GitHub, X)
- If they show business interest: bridge to B2B with "Want this for your business? Book a call"
- Tone: friendly, inspiring, ${language === "fr" ? 'use "tu"' : "casual"}

**If user is on PROFESSIONALS page:**
- Focus on B2B consulting: custom AI agents, workflow automation, co-construction approach
- Qualify their needs: company type, pain points, AI maturity, urgency
- Guide toward booking a diagnostic call
- Tone: professional but approachable, ${language === "fr" ? 'use "vous"' : "direct and results-focused"}
- Highlight differentiators: finance expertise, early adoption, guaranteed autonomy

**If user is on ABOUT page:**
- Share team story, values, vision, philosophical depth
- Connect to mission and the "irreversible time" philosophy
- Be authentic and personal

**If user is on BLOG page:**
- Discuss content themes, recommend articles, explain concepts
- Bridge to relevant content pillars (AI, investment, use cases, philosophy)

### IMPORTANT - GREETING ALREADY SHOWN:
The greeting "${language === "fr" ? "Salut ! Je suis l'assistant Bubble. Comment puis-je t'aider ?" : "Hey! I'm Bubble's assistant. How can I help you?"}" is ALREADY displayed in the UI.
**DO NOT repeat the greeting.** When the user sends their first message, respond naturally to what they said.

### TONE & APPROACH:
- **In French on individuals/index pages: use "tu" (informal)** — feel like a helpful friend
- **In French on professionals pages: use "vous"** — professional but warm
- **USER FIRST (80/20)**: Focus on understanding the user's situation. Only mention Bubble features when directly relevant.
- **ALWAYS end your messages with a question** to keep the conversation flowing
- Friendly, warm, genuinely curious — like chatting with a knowledgeable friend
- Keep responses concise (2-3 sentences + a question)
- Be authentic: share doubts, acknowledge limits, never oversell

### CONVERSATION FLOW:
1. **Understand who they are**: Individual curious about AI/content? Professional exploring AI adoption?
2. **Guide accordingly**:
   - **Individual** → Share relevant content, suggest newsletter/social follow, point to POC/demos
   - **Professional** → Understand their business, pain points, and AI maturity. Qualify → suggest booking a diagnostic call
3. **Bridge when appropriate**: If an individual shows business interest → "Want this for your business? Book a call"
4. **Stay on topic**: Answer questions about AI, Bubble's approach, our work, content. Politely redirect off-topic questions.

### CTAs (use naturally, not pushily):
${language === "fr"
    ? `- Professionnels: "Tu veux qu'on en discute ? [Réserve un appel](https://calendly.com/bubble-invest)" ou formulaire de contact
- Individus: "Suis notre aventure sur [LinkedIn](https://linkedin.com/company/bubbleinvest), [Substack](https://bubbleinvest.substack.com), ou [Instagram](https://instagram.com/behindthebubble.ai)"
- POC: "Jette un œil à [notre agent d'investissement](/investors) — on partage tout"`
    : `- Professionals: "Want to discuss? [Book a call](https://calendly.com/bubble-invest)" or contact form
- Individuals: "Follow our journey on [LinkedIn](https://linkedin.com/company/bubbleinvest), [Substack](https://bubbleinvest.substack.com), or [Instagram](https://instagram.com/behindthebubble.ai)"
- POC: "Check out [our investment agent](/investors) — we share everything"`}

### DISCLAIMERS (only when relevant):
- Our investment agent is a proof of concept, not a product for sale
- We don't give personalized financial advice
- Past performance ≠ future results (when discussing POC results)

---

Remember: You're here to HELP visitors understand Bubble and find the right path. Discover if they're an individual (→ content, follow, inspire) or a professional (→ qualify, consult, book a call). Be authentic, be helpful, embody the build-in-public spirit.`;
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
                    res.write(
                      `data: ${JSON.stringify({ content, text: content })}\n\n`
                    );

                    // Text-based tool-call fallback: detect "TOOL:tool_name|{json}"
                    if (!pendingTool && !toolUsedFromText) {
                      const match = content.match(
                        /TOOL:([a-zA-Z0-9_\\-]+)\\|(\\{.*\\})/
                      );
                      if (match && match[1] && match[2]) {
                        try {
                          const toolName = match[1];
                          const args = JSON.parse(match[2]);
                          toolUsedFromText = true;
                          (async () => {
                            try {
                              const result =
                                await toolExecutionService.executeTool(
                                  toolName,
                                  args
                                );
                              res.write(
                                `data: ${JSON.stringify({
                                  content: `Résultat ${toolName}: ${JSON.stringify(result)}`,
                                  text: `Résultat ${toolName}: ${JSON.stringify(result)}`,
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
                          console.error(
                            "Failed to parse text-based tool call:",
                            err
                          );
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
                    pendingTool.arguments =
                      toolArgsBuffer || pendingTool.arguments;
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
                `data: ${JSON.stringify({
                  error: "Stream error occurred",
                  text: "Stream error occurred",
                  is_error: true,
                })}\n\n`
              );
              res.end();
            }
            reject(err);
          });
        })
        .catch((error) => {
          const status = error?.response?.status;
          if (
            includeTools &&
            !hasRetried &&
            (status === 400 || status === 422)
          ) {
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
              `data: ${JSON.stringify({
                error: "Chat request failed",
                text: "Chat request failed",
                is_error: true,
              })}\n\n`
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
    const toolCalls = [firstPass.pendingTool];
    const toolResults = await Promise.all(
      toolCalls.map(async (tc) => {
        let parsedArgs = {};
        try {
          parsedArgs = tc.arguments ? JSON.parse(tc.arguments) : {};
        } catch (err) {
          console.error("Failed to parse tool arguments:", err);
        }
        let toolResult;
        try {
          toolResult = await toolExecutionService.executeTool(
            tc.name,
            parsedArgs
          );
        } catch (err) {
          toolResult = { success: false, error: err.message };
        }
        // Send individual tool result to client
        res.write(
          `data: ${JSON.stringify({
            tool_result: { name: tc.name, result: toolResult },
          })}\n\n`
        );
        return { tc, toolResult, args: parsedArgs };
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

    // Build tool result messages
    const toolResultMessages = toolResults.map(({ tc, toolResult }) => ({
      role: "tool",
      tool_call_id: tc.id,
      content: JSON.stringify(toolResult),
      is_error: !toolResult?.success,
      text: toolResult?.success
        ? `Tool ${tc.name} executed successfully`
        : `Tool ${tc.name} failed: ${toolResult?.error || "Unknown error"}`,
    }));

    currentMessages = [
      ...currentMessages,
      assistantToolCallMsg,
      ...toolResultMessages,
    ];

    const secondPass = await runStream(includeTools, currentMessages, false);
    if (!secondPass.contentSent && !firstPass.fullResponse) {
      const fallback =
        "J'ai vérifié l'info et je peux continuer si tu veux.";
      res.write(`data: ${JSON.stringify({ content: fallback })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
    const finalText =
      secondPass.fullResponse || firstPass.fullResponse || "";
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
    return finalText;
  }

  // No tool call; return accumulated text
  if (!firstPass.contentSent && !firstPass.fullResponse) {
    // Provide a helpful fallback so the UI never looks stuck
    const fallback =
      "Je n'ai pas reçu de réponse du modèle pour cette requête. " +
      "Peux-tu reformuler ta question ? Je suis là pour t'aider à comprendre Bubble et nos services.";
    res.write(`data: ${JSON.stringify({ content: fallback })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  }
  const finalText = firstPass.fullResponse || "";
  if (!res.writableEnded) {
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  }
  return finalText;
}

/**
 * Get unified system prompt
 * PageContext tells the chatbot which page the user is on
 * userProfile contains visitor data from BubbleAgentMemory v2
 */
async function getSystemPrompt(
  language,
  pageContext = "index",
  userProfile = null,
  conversationHistory = []
) {
  return unifiedSystemPrompt(
    language,
    pageContext,
    userProfile,
    conversationHistory
  );
}

/**
 * Handle chat request with streaming response
 * Unified chatbot: accepts pageContext (where user is) instead of chatbotType
 */
async function handleChat(req, res) {
  console.log("POST /api/chat hit on server");

  const {
    message,
    language = "fr",
    lang,
    pageContext = "index",
    context: contextOverride,
    chatbotType,
    history = [],
    contextMetadata = "",
    userProfileContext = "",
    userProfile: requestUserProfile = null,
  } = req.body;

  // Backward compatibility: map old chatbotType to new pageContext
  const context = contextOverride || chatbotType || pageContext;
  const resolvedLanguage = language || lang || "fr";

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  if (
    !env.OPENROUTER_API_KEY ||
    env.OPENROUTER_API_KEY === "YOUR_API_KEY_HERE"
  ) {
    return res.status(500).json({
      error:
        "OpenRouter API key not configured on the server. Please add it to the .env file.",
    });
  }

  // Extract user profile from contextMetadata or request body
  let userProfile = requestUserProfile || null;
  let metadataBlock = "";

  if (typeof contextMetadata === "string") {
    metadataBlock = contextMetadata.trim();
  } else if (contextMetadata && typeof contextMetadata === "object") {
    if (!userProfile && contextMetadata.profile) {
      userProfile = contextMetadata.profile;
    }
    // Build metadata block without profile (to avoid duplication)
    const { profile, ...otherMetadata } = contextMetadata;
    if (Object.keys(otherMetadata).length > 0) {
      metadataBlock = JSON.stringify(otherMetadata);
    }
  }

  // Get the unified system prompt with page context and user profile
  let systemPromptContent = await getSystemPrompt(
    resolvedLanguage,
    context,
    userProfile,
    history
  );

  if (metadataBlock) {
    systemPromptContent = `${systemPromptContent}\n\n### PAGE CONTEXT NOTES:\n${metadataBlock}`;
  }

  // Add BubbleAgentMemory user profile context (site-wide persistent context)
  if (
    userProfileContext &&
    typeof userProfileContext === "string" &&
    userProfileContext.trim()
  ) {
    const visitorType = userProfileContext.includes("Visitor Type:")
      ? userProfileContext
      : null;
    const isProfessional =
      visitorType && visitorType.includes("professional");
    const isIndividual = visitorType && visitorType.includes("individual");

    let contextGuidance = "";
    if (isProfessional) {
      contextGuidance = `

### PERSONALIZED CONTEXT (PROFESSIONAL VISITOR)
This user has been identified as a professional.
- Focus on B2B value: qualify their needs, understand their business context
- Guide toward booking a diagnostic call when appropriate
- Reference their company type, pain points, and AI maturity if known`;
    } else if (isIndividual) {
      contextGuidance = `

### PERSONALIZED CONTEXT (INDIVIDUAL VISITOR)
This user has been identified as an individual.
- Share relevant content: blog posts, POC demos, newsletter
- Encourage social media follow and newsletter subscription
- If they show business interest, bridge to B2B: "Want this for your business?"`;
    } else {
      contextGuidance = `

### VISITOR DISCOVERY
This user hasn't been fully identified yet.
- Through natural conversation, discover if they're an individual (curious about AI/content) or a professional (exploring AI for their business)
- Adapt your approach once you understand their profile`;
    }

    systemPromptContent = `${systemPromptContent}\n\n### USER MEMORY (from BubbleAgentMemory):\n${userProfileContext.trim()}${contextGuidance}\n\nUse this context to personalize your responses naturally.`;
  }

  // Attach tool definitions based on page context (for model function calling)
  const toolsForContext = toolExecutionService.getToolsForPageContext(context);

  const messages = [
    { role: "system", content: systemPromptContent },
    ...history.map((h) => ({
      role: h.role === "user" ? "user" : "assistant",
      content: h.content,
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
        await streamResponse(res, model, messages, headers, toolsForContext, {
          pageContext: context,
          lastUserMessage: message,
          userProfile,
        });
        console.log(
          `✅ Chat streamed using model: ${model} (context: ${context})`
        );
        return;
      } catch (error) {
        console.error(`Error with model ${model}:`, error.message);
      }
    }

    // If we've tried all models and none worked
    if (!res.headersSent) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.write(
        `data: ${JSON.stringify({
          content:
            "Je n'ai pas pu obtenir de réponse pour le moment. Réessaie dans quelques instants ou contacte-nous directement.",
        })}\n\n`
      );
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } else if (!res.writableEnded) {
      res.write(
        `data: ${JSON.stringify({
          content:
            "Je n'ai pas pu obtenir de réponse pour le moment. Réessaie dans quelques instants ou contacte-nous directement.",
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

/**
 * Handle portfolio-specific chat (legacy endpoint — kept for backward compatibility)
 * Routes through the unified system prompt with simulator context
 */
async function handlePortfolioChat(req, res) {
  console.log("POST /api/chat/portfolio hit on server");

  const { message, language = "fr", context } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  if (
    !env.OPENROUTER_API_KEY ||
    env.OPENROUTER_API_KEY === "YOUR_API_KEY_HERE"
  ) {
    return res.status(500).json({
      error:
        "OpenRouter API key not configured on the server. Please add it to the .env file.",
    });
  }

  // For backward compatibility, portfolio endpoint uses unified prompt with individuals context
  const systemPromptContent = await unifiedSystemPrompt(
    language,
    "individuals",
    null,
    []
  );

  const portfolioNote = context
    ? `\n\n### PORTFOLIO SIMULATOR CONTEXT:\nThe user is exploring our portfolio simulator POC. This is an educational showcase, not a product. Help them understand the strategies and results.\n${JSON.stringify(context)}`
    : "";

  const messages = [
    {
      role: "system",
      content: `${systemPromptContent}${portfolioNote}`,
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

module.exports = { handleChat, handlePortfolioChat };
