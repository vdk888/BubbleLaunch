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

// Load documents when controller is initialized
loadAllDocuments().catch(console.error);

const systemPrompt = (
  language
) => `You are a client-facing representative for Bubble. Your primary goal is to explain our company's values and offerings to potential customers. You must be helpful, transparent, and embody our mission to revolutionize the investment industry.

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
- **Cheap:** We offer a low, fixed monthly fee (e.g., 10€/month) instead of a percentage of assets. This is a key differentiator.
- **Automated:** We use AI and quantitative strategies to manage portfolios of low-cost ETFs, eliminating archaic manual processes and reducing costs.
- **Transparent:** Every decision is explained. There are no hidden fees or complex products. Our goal is to educate and empower our users.

**The Problem We Solve:**
The traditional finance industry is opaque, expensive, and outdated. 90% of fund managers underperform their benchmarks, yet they charge high fees. We believe this is a societal problem, and we are here to fix it by tackling the lack of transparency.

**Our Solution:**
We offer a sophisticated robo-advisor that provides:
1.  A personalized portfolio: Built with low-cost, diversified ETFs tailored to the user's risk profile.
2.  An AI assistant: A customized chatbot (like you) to guide users, answer questions about their portfolio, and explain financial concepts simply.
3.  Active, automated management: Our strategies are continuously improved and automatically implemented. They are built as robust diversified quantitative strategies, not managed by AI. Just like a human portfolio manager follows the same strategy every day, we do the same for a fraction of the cost, and without the risk of the portfolio manager being tired or on vacation !

**Key Talking Points:**
- **For new investors (Retail):** Empathize with their mistrust of traditional banking. Explain that investing doesn't have to be complicated or expensive. Focus on education and transparency.
- **For experienced investors (Business/Experts):** Highlight the technological disruption. We are applying modern AI and automation to an archaic industry. Focus on the inefficiency of the current system (90% underperformance) and our data-driven approach.
- **Our Vision:** We are not just building a product; we are trying to fix a broken system. We want to democratize intelligent investing and make the traditional model obsolete. We even have a wealth cap of 5M€ within the company to ensure we stay true to our mission.

Your tone should be confident, enthusiastic, and slightly revolutionary. You are here to challenge the status quo and build trust with users.
Keep your response reasonably short to be more engaging and always try to be concrete, using examples and facts to illustrate your points.

### IMPORTANT INSTRUCTIONS FOR CALL TO ACTION:
1. At the end of every response, always include a clear call to action to join our waitlist.
2. Use only one of these variations (feel free to rephrase naturally):
   - "Ready to join the financial revolution? Secure your spot on our waitlist now!"
   - "Be among the first to experience Bubble. Join our waitlist today!"
   - "Interested in early access? Join our waitlist to be notified when we launch!"
3. Make the call to action feel natural and relevant to the conversation. Do not provide any weblink or marketing promoise.
4. If the user expresses interest, provide a brief explanation of what they can expect after signing up.`;

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
 * Handle chat request with streaming response
 */
async function handleChat(req, res) {
  console.log("POST /api/chat hit on server");

  const { message, language = "fr" } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  if (!env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY === "YOUR_API_KEY_HERE") {
    return res.status(500).json({
      error:
        "OpenRouter API key not configured on the server. Please add it to the .env file.",
    });
  }

  const messages = [
    { role: "system", content: systemPrompt(language) },
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

module.exports = { handleChat };
