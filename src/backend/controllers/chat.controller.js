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

  const selectedModules = selectContextModules(conversationHistory, ctx);
  const contextDocs = await Promise.all(
    selectedModules.map((mod) => loadContextModule(mod))
  );
  const dynamicContext = contextDocs.join("\n\n---\n\n");

  // Build compact user profile block if available
  let profileBlock = "";
  if (userProfile) {
    const profile = userProfile.profile || userProfile;
    const journey = userProfile.journey || {};
    const memory = userProfile.memory || {};
    const parts = [];
    if (profile.visitorType) parts.push(`type:${profile.visitorType}`);
    if (profile.companyType) parts.push(`company:${profile.companyType}`);
    if (profile.industry) parts.push(`industry:${profile.industry}`);
    if (profile.painPoint) parts.push(`pain:${profile.painPoint}`);
    if (profile.aiMaturity) parts.push(`ai-maturity:${profile.aiMaturity}`);
    if (journey.isReturningUser || journey.totalVisits > 1) parts.push("returning-user");
    if (journey.contactRequested) parts.push("contact-requested");
    const keyInsights = Array.isArray(memory.keyInsights)
      ? memory.keyInsights.slice(-3).map((i) => (typeof i === "string" ? i : i.insight))
      : [];
    if (parts.length > 0 || keyInsights.length > 0) {
      profileBlock = `\nVisitor: ${parts.join(" | ")}${keyInsights.length > 0 ? `\nInsights: ${keyInsights.join("; ")}` : ""}`;
    }
  }

  const lang = language === "fr" ? "FRENCH" : "ENGLISH";
  const isFr = language === "fr";
  const pageBehaviorMap = {
    index: "Explain Bubble's dual activity (B2B consulting + B2C content). Guide visitor to right path.",
    individuals: `Free content focus: POC, newsletter, tutorials, social follow.${isFr ? ' Use "tu".' : ""} If business interest → bridge to B2B.`,
    professionals: `B2B focus: qualify needs, pain points, AI maturity → book a call.${isFr ? ' Use "vous".' : ""} Highlight: finance expertise, early adoption, autonomy.`,
    about: "Share team story, values, vision. Be authentic and personal.",
    blog: "Discuss content, recommend articles, bridge to relevant pillars.",
  };
  const pageBehavior = pageBehaviorMap[ctx] || pageBehaviorMap.index;

  const ctaPro = isFr
    ? "[Réserve un appel](https://calendly.com/bubble-invest)"
    : "[Book a call](https://calendly.com/bubble-invest)";
  const ctaFollow = isFr
    ? "[LinkedIn](https://linkedin.com/company/bubbleinvest), [Substack](https://bubbleinvest.substack.com), [Instagram](https://instagram.com/behindthebubble.ai)"
    : "[LinkedIn](https://linkedin.com/company/bubbleinvest), [Substack](https://bubbleinvest.substack.com), [Instagram](https://instagram.com/behindthebubble.ai)";
  const dontKnow = isFr
    ? `"Bonne question — ${ctaPro} pour en discuter avec l'équipe"`
    : `"Great question — ${ctaPro} to discuss with the team"`;

  return `LANGUAGE: Respond ONLY in ${lang}. Never mix languages.

You are Bubble's AI Assistant on the ${ctx} page.
${profileBlock}

Bubble Invest: B2B AI agent consulting (core) + B2C free content/marketing. Ex-Deloitte & UBS, finance×tech niche. Selfware model: we build & use our own AI agents, share everything publicly. NOT a SaaS, robo-advisor, or financial advisor.

CONTEXT:
${dynamicContext}

PAGE BEHAVIOR: ${pageBehavior}

RULES:
- Max 100 words (2-3 sentences + a question). Always end with a question.
- Greeting already shown — do NOT repeat it.
- Never invent numbers, prices, ROI, timelines. If unknown → ${dontKnow}
- Only use info from CONTEXT above. No hallucination.
- Off-topic → politely redirect.
- Professional visitor → qualify → ${ctaPro}
- Individual visitor → content, follow ${ctaFollow}
- POC is educational, not a product. No financial advice.
- On individuals page: never propose demos — suggest blog/newsletter/social instead.
- Be authentic, warm, concise.`;
};

// Model rotation (free models verified on OpenRouter — March 2026)
const models = [
  "stepfun/step-3.5-flash:free",                  // 196B sparse MoE, excellent reasoning + tools
  "qwen/qwen3.6-plus-preview:free",               // Latest Qwen with tool support
  "nvidia/nemotron-3-super-120b-a12b:free",        // 120B, 262K context, tool support
  "qwen/qwen3-next-80b-a3b-instruct:free",        // 80B, 262K context, instruction-tuned
  "meta-llama/llama-3.3-70b-instruct:free",        // 70B, reliable with tool support
  "nvidia/nemotron-3-nano-30b-a3b:free",           // 30B, 256K context, lightweight fallback
  "arcee-ai/trinity-large-preview:free",           // 400B sparse MoE (org renamed from arcee)
];

// Per-model timeout (ms) — prevents one slow/hung model from eating the entire request budget
const MODEL_TIMEOUT_MS = 8000;

// Cache the last model that succeeded so we try it first next time
let lastSuccessfulModel = null;

// List of free openrouter models that reliably support tool calls
const modelsSupportingTools = [
  "stepfun/step-3.5-flash:free",
  "qwen/qwen3.6-plus-preview:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "arcee-ai/trinity-large-preview:free",
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
   * Includes per-model timeout via AbortController to prevent stalling.
   */
  const attemptRequest = (includeTools, msgs) => {
    const abortCtrl = new AbortController();
    const timer = setTimeout(() => abortCtrl.abort(), MODEL_TIMEOUT_MS);
    return axios({
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
      signal: abortCtrl.signal,
      validateStatus: (status) => status >= 200 && status < 300,
    }).finally(() => clearTimeout(timer));
  };

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
          console.error("Request failed:", error?.message || error);
          reject(error);
        });
    });

  // Execute streaming with possible tool call follow-up
  let currentMessages = messages;

  // Decide if we should include tools based on model capabilities to avoid the 400 error loop
  const supportsTools = modelsSupportingTools.includes(model);
  let includeTools = supportsTools && tools && tools.length > 0;

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
    // Build ordered model list: try last successful model first to avoid unnecessary fallbacks
    const orderedModels = lastSuccessfulModel && models.includes(lastSuccessfulModel)
      ? [lastSuccessfulModel, ...models.filter((m) => m !== lastSuccessfulModel)]
      : models;

    for (const model of orderedModels) {
      try {
        await streamResponse(res, model, messages, headers, toolsForContext, {
          pageContext: context,
          lastUserMessage: message,
          userProfile,
        });
        lastSuccessfulModel = model;
        console.log(
          `✅ Chat streamed using model: ${model} (context: ${context})`
        );
        return;
      } catch (error) {
        console.error(`❌ Error with model ${model}:`, error.message, error?.response?.status || '');
      }
    }

    console.error('❌ All models failed for chat request');
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

/**
 * Health check endpoint for chat service
 * Verifies API key and tests OpenRouter connectivity
 */
async function handleChatHealth(req, res) {
  const checks = {
    apiKeyConfigured: !!(env.OPENROUTER_API_KEY && env.OPENROUTER_API_KEY !== "YOUR_API_KEY_HERE"),
    modelsConfigured: models.length,
    modelList: models,
    openRouterReachable: false,
  };

  if (checks.apiKeyConfigured) {
    try {
      const response = await axios({
        method: "post",
        url: "https://openrouter.ai/api/v1/chat/completions",
        data: {
          model: models[0],
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 5,
        },
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });
      checks.openRouterReachable = response.status === 200;
      checks.firstModelStatus = "ok";
    } catch (error) {
      checks.openRouterReachable = false;
      checks.firstModelStatus = error?.response?.status || error.message;
    }
  }

  const healthy = checks.apiKeyConfigured && checks.openRouterReachable;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "unhealthy",
    ...checks,
  });
}

module.exports = { handleChat, handlePortfolioChat, handleChatHealth };
