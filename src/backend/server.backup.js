require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const { Client } = require("@notionhq/client");
const axios = require("axios");
const fs = require("fs").promises;
const { getPublishedPosts, getPostBySlug } = require("./services/blogService");
const freepikService = require("./services/freepikService");
const { 
  getPublishedReferences, 
  getReferencesGroupedByTheme, 
  exploreKnowledgeGardenStructure,
  getEnrichedPublishedReferences,
  getEnrichedReferencesGroupedBySourceType,
  clearEnrichmentCache
} = require("./services/knowledgeGardenService");

const app = express();
const port = process.env.PORT || 3000;

// Notion client
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DATABASE_ID_WAITLIST;
const openRouterApiKey = process.env.OPENROUTER_API_KEY;

// Middleware
app.use(express.json());
app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "your-super-secret-key-that-should-be-in-env",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using https
  }),
);

// Document loading functions
let missionDocument = "";
let elevatorPitch = "";
let strategicPoints = "";

async function loadDocument(fileName) {
  try {
    const filePath = path.join(__dirname, "../../docs/company", fileName);
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

// Load documents when server starts
loadAllDocuments().catch(console.error);

const systemPrompt = (
  language,
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

// Helper function to handle streaming response
async function streamResponse(res, model, messages, headers) {
  return new Promise((resolve, reject) => {
    axios({
      method: 'post',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      data: {
        model: model,
        messages: messages,
        stream: true
      },
      responseType: 'stream',
      headers: headers
    })
    .then(response => {
      // Set headers for SSE (Server-Sent Events)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      let fullResponse = '';
      let buffer = '';

      response.data.on('data', chunk => {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          const message = line.replace(/^data: /, '').trim();
          
          if (message === '[DONE]') {
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
            console.error('Error parsing message:', e);
          }
        }
      });

      response.data.on('end', () => {
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
          resolve(fullResponse);
        }
      });

      response.data.on('error', err => {
        console.error('Stream error:', err);
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`);
          res.end();
        }
        reject(err);
      });
    })
    .catch(error => {
      console.error('Request failed:', error);
      reject(error);
    });
  });
}

app.post("/api/chat", async (req, res) => {
  console.log("POST /api/chat hit on server");
  
  if (!req.session.messageCount) {
    req.session.messageCount = 0;
  }

  if (req.session.messageCount >= 10) {
    return res.status(429).json({ error: "Message limit reached" });
  }

  req.session.messageCount++;

  const { message, language = "fr" } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  if (!openRouterApiKey || openRouterApiKey === "YOUR_API_KEY_HERE") {
    return res.status(500).json({
      error: "OpenRouter API key not configured on the server. Please add it to the .env file.",
    });
  }

  const messages = [
    { role: "system", content: systemPrompt(language) },
    { role: "user", content: message },
  ];

  const headers = {
    'Authorization': `Bearer ${openRouterApiKey}`,
    'Content-Type': 'application/json'
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
    console.error('Error in chat endpoint:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "An error occurred while processing your request.",
        details: error.message,
      });
    }
  }
});

// API endpoint for form submission
app.post("/subscribe", async (req, res) => {
  const { name, email, profile, comments } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required." });
  }

  try {
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Nom: {
          title: [
            {
              text: {
                content: name,
              },
            },
          ],
        },
        Email: {
          email: email,
        },
        Profil: {
          select: {
            name: profile || "other",
          },
        },
        Commentaires: {
          rich_text: [
            {
              text: {
                content: comments || "",
              },
            },
          ],
        },
      },
    });
    res.status(201).json({ message: "Successfully subscribed!" });
  } catch (error) {
    console.error("Error adding to Notion:", error);
    res
      .status(500)
      .json({ error: "Failed to subscribe. Please try again later." });
  }
});

// Test POST route
app.post("/test-post", (req, res) => {
  console.log("POST /test-post hit on Replit server");
  res.status(200).send("POST test successful on Replit");
});

// API endpoint to get blog posts as JSON
app.get("/api/blog/posts", async (req, res) => {
  try {
    const posts = await getPublishedPosts();
    res.json(posts);
  } catch (error) {
    console.error("Error fetching blog posts for API:", error);
    res.status(500).json({ error: "Failed to fetch blog posts" });
  }
});

// API endpoint to get a single blog post by slug
app.get("/api/blog/post/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const post = await getPostBySlug(slug);
    
    if (!post) {
      return res.status(404).json({ error: "Blog post not found" });
    }
    
    res.json(post);
  } catch (error) {
    console.error("Error fetching blog post by slug:", error);
    res.status(500).json({ error: "Failed to fetch blog post" });
  }
});

// API endpoint to get knowledge garden references (with LLM enrichment)
app.get("/api/knowledge-garden/references", async (req, res) => {
  try {
    // Check if enrichment is requested (default: true)
    const useEnrichment = req.query.enrich !== 'false';
    
    if (useEnrichment) {
      const references = await getEnrichedPublishedReferences();
      res.json(references);
    } else {
      const references = await getPublishedReferences();
      res.json(references);
    }
  } catch (error) {
    console.error("Error fetching knowledge garden references:", error);
    res.status(500).json({ error: "Failed to fetch references" });
  }
});

// API endpoint to get enriched references grouped by source type (Books/Articles)
app.get("/api/knowledge-garden/references-by-source-type", async (req, res) => {
  try {
    const groupedReferences = await getEnrichedReferencesGroupedBySourceType();
    res.json(groupedReferences);
  } catch (error) {
    console.error("Error fetching references grouped by source type:", error);
    res.status(500).json({ error: "Failed to fetch grouped references by source type" });
  }
});

// API endpoint to get references grouped by theme
app.get("/api/knowledge-garden/references-by-theme", async (req, res) => {
  try {
    const groupedReferences = await getReferencesGroupedByTheme();
    res.json(groupedReferences);
  } catch (error) {
    console.error("Error fetching grouped references:", error);
    res.status(500).json({ error: "Failed to fetch grouped references" });
  }
});

// API endpoint to explore knowledge garden database structure
app.get("/api/knowledge-garden/explore", async (req, res) => {
  try {
    const structure = await exploreKnowledgeGardenStructure();
    res.json(structure);
  } catch (error) {
    console.error("Error exploring knowledge garden structure:", error);
    res.status(500).json({ error: "Failed to explore database structure" });
  }
});

// API endpoint to clear enrichment cache (for testing)
app.post("/api/knowledge-garden/clear-cache", (req, res) => {
  try {
    clearEnrichmentCache();
    res.json({ success: true, message: "Enrichment cache cleared" });
  } catch (error) {
    console.error("Error clearing enrichment cache:", error);
    res.status(500).json({ error: "Failed to clear cache" });
  }
});

// Test route for Freepik API connection
app.get("/api/test-freepik-connection", async (req, res) => {
  try {
    console.log('🔍 Testing Freepik API connection...');
    
    // Debug environment variables
    console.log('🔧 Environment check:');
    console.log('  - FREEPIK_API_KEY present:', !!process.env.FREEPIK_API_KEY);
    console.log('  - FREEPIK_API_KEY length:', process.env.FREEPIK_API_KEY?.length || 0);
    console.log('  - FREEPIK_API_KEY preview:', process.env.FREEPIK_API_KEY ? `${process.env.FREEPIK_API_KEY.substring(0, 8)}...` : 'none');
    
    const isConnected = await freepikService.testConnection();
    
    res.json({
      success: isConnected,
      message: isConnected ? "Freepik API connection successful" : "Freepik API connection failed",
      apiKeyPresent: !!process.env.FREEPIK_API_KEY,
      apiKeyLength: process.env.FREEPIK_API_KEY?.length || 0,
      debug: {
        baseUrl: 'https://api.freepik.com/v1',
        endpoint: '/ai/text-to-image'
      }
    });
  } catch (error) {
    console.error("Error testing Freepik connection:", error);
    res.status(500).json({ 
      error: "Failed to test Freepik connection",
      details: error.message,
      stack: error.stack
    });
  }
});

// Direct API test endpoint for debugging
app.get("/api/test-freepik-direct", async (req, res) => {
  try {
    console.log('🧪 Making direct Freepik API test...');
    
    const apiKey = process.env.FREEPIK_API_KEY;
    const baseUrl = 'https://api.freepik.com/v1';
    
    console.log('Direct test config:', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length,
      baseUrl,
      endpoint: '/ai/text-to-image'
    });
    
    if (!apiKey) {
      return res.json({
        success: false,
        error: 'No API key found',
        debug: { envVars: Object.keys(process.env).filter(k => k.includes('FREEPIK')) }
      });
    }
    
    const response = await axios.post(
      `${baseUrl}/ai/text-to-image`,
      { prompt: "Simple blue background" },
      {
        headers: {
          'x-freepik-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );
    
    console.log('✅ Direct API response:', {
      status: response.status,
      headers: response.headers,
      data: response.data
    });
    
    res.json({
      success: true,
      message: 'Direct API call successful',
      response: {
        status: response.status,
        data: response.data
      }
    });
    
  } catch (error) {
    console.error('❌ Direct API test failed:');
    console.error('Status:', error.response?.status);
    console.error('Headers:', error.response?.headers);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    
    res.json({
      success: false,
      error: 'Direct API call failed',
      details: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      }
    });
  }
});

// Test route for Freepik image generation
app.post("/api/test-image-generation", async (req, res) => {
  try {
    const { title, summary, tags } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }
    
    console.log(`🧪 Testing image generation for: "${title}"`);
    
    const imageUrl = await freepikService.generateArticleImage(
      title,
      summary || "Test article summary for image generation",
      tags || ["test", "ai", "finance"]
    );
    
    if (imageUrl) {
      res.json({ 
        success: true, 
        imageUrl: imageUrl,
        message: "Image generated successfully"
      });
    } else {
      res.json({ 
        success: false, 
        message: "Image generation failed or service not available"
      });
    }
  } catch (error) {
    console.error("❌ Error testing image generation:", error);
    res.status(500).json({ 
      error: "Failed to generate test image",
      details: error.message
    });
  }
});

// Clear Freepik image cache and regenerate images
app.post("/api/clear-image-cache", async (req, res) => {
  try {
    console.log('🧹 Clearing Freepik image cache...');
    
    // Clear the cache
    freepikService.clearCache();
    
    // Get cache stats
    const cacheStats = freepikService.getCacheStats();
    
    res.json({ 
      success: true, 
      message: "Image cache cleared successfully",
      cacheStats: cacheStats
    });
  } catch (error) {
    console.error("❌ Error clearing image cache:", error);
    res.status(500).json({ 
      error: "Failed to clear image cache",
      details: error.message
    });
  }
});

// Get Freepik cache statistics
app.get("/api/image-cache-stats", async (req, res) => {
  try {
    const cacheStats = freepikService.getCacheStats();
    
    res.json({ 
      success: true, 
      cacheStats: cacheStats
    });
  } catch (error) {
    console.error("❌ Error getting cache stats:", error);
    res.status(500).json({ 
      error: "Failed to get cache statistics",
      details: error.message
    });
  }
});

// Force regenerate images for all blog posts
app.post("/api/regenerate-all-images", async (req, res) => {
  try {
    console.log('🔄 Force regenerating all blog images...');
    
    // Clear the cache first
    freepikService.clearCache();
    
    // Get all published posts
    const posts = await getPublishedPosts();
    
    // Force regenerate images for each post
    const regenerationPromises = posts.map(async (post) => {
      try {
        console.log(`🎨 Regenerating image for: "${post.title.fr}"`);
        const newImageUrl = await freepikService.generateArticleImage(
          post.title.fr, 
          post.summary.fr, 
          post.tags,
          post.id, // Pass the article ID
          true // bypassCache = true
        );
        return { 
          title: post.title.fr, 
          success: !!newImageUrl, 
          imageUrl: newImageUrl 
        };
      } catch (error) {
        console.error(`Failed to regenerate image for "${post.title.fr}":`, error);
        return { 
          title: post.title.fr, 
          success: false, 
          error: error.message 
        };
      }
    });
    
    const results = await Promise.all(regenerationPromises);
    
    res.json({ 
      success: true, 
      message: `Regenerated images for ${results.length} articles`,
      results: results
    });
  } catch (error) {
    console.error("❌ Error regenerating images:", error);
    res.status(500).json({ 
      error: "Failed to regenerate images",
      details: error.message
    });
  }
});

// Force regenerate image for a specific blog post by slug
app.post("/api/regenerate-image/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    console.log(`🔄 Force regenerating image for post: ${slug}`);
    
    // Get the post details
    const post = await getPostBySlug(slug);
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        error: "Post not found" 
      });
    }
    
    // Force regenerate the image
    const newImageUrl = await freepikService.generateArticleImage(
      post.title.fr,
      post.summary.fr, 
      post.tags,
      post.id,
      true // bypassCache = true
    );
    
    res.json({
      success: true,
      message: `Image regenerated for "${post.title.fr}"`,
      imageUrl: newImageUrl,
      post: {
        slug,
        title: post.title.fr
      }
    });
    
  } catch (error) {
    console.error('Error regenerating single post image:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Generate image for a specific article (to be called when publishing)
app.post("/api/generate-article-image", async (req, res) => {
  try {
    const { articleId, title, summary, tags, forceRegenerate } = req.body;
    
    if (!articleId || !title) {
      return res.status(400).json({ 
        success: false, 
        error: "articleId and title are required" 
      });
    }
    
    // Check if image already exists in cache (unless force regenerate)
    if (!forceRegenerate) {
      const cachedImage = freepikService.getCachedImage(articleId);
      if (cachedImage) {
        return res.json({ 
          success: true, 
          imageUrl: cachedImage,
          fromCache: true
        });
      }
    }
    
    // Generate new image
    const imageUrl = await freepikService.generateArticleImage(
      title,
      summary || '',
      tags || [],
      articleId,
      forceRegenerate
    );
    
    if (imageUrl) {
      res.json({ 
        success: true, 
        imageUrl,
        fromCache: false
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: "Failed to generate image" 
      });
    }
  } catch (error) {
    console.error("Error generating article image:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Blog routes
app.get("/blog", async (req, res) => {
  try {
    const posts = await getPublishedPosts();
    const blogIndexPath = path.join(__dirname, "../frontend/pages/blog.html");
    
    // Check if blog.html exists, if not serve a simple response for now
    try {
      await fs.access(blogIndexPath);
      res.sendFile(blogIndexPath);
    } catch {
      // Temporary response until we create the blog page
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Bubble Blog</title>
          <style>body{font-family:Inter,sans-serif;max-width:800px;margin:0 auto;padding:20px;}</style>
        </head>
        <body>
          <h1>Bubble Blog</h1>
          <p>Blog functionality is being set up...</p>
          <a href="/">← Back to Bubble</a>
          <h2>Posts (${posts.length})</h2>
          ${posts.map(post => `
            <div style="border-bottom:1px solid #eee;padding:20px 0;">
              <h3><a href="/blog/${post.slug}">${post.title}</a></h3>
              <p>${post.summary}</p>
              <small>${post.publishedDate}</small>
            </div>
          `).join('')}
        </body>
        </html>
      `);
    }
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    res.status(500).send("Error loading blog");
  }
});

app.get("/blog/:slug", async (req, res) => {
  try {
    const blogPostPath = path.join(__dirname, "../frontend/pages/blog-post.html");
    res.sendFile(blogPostPath);
  } catch (error) {
    console.error("Error serving blog post page:", error);
    res.status(500).send("Error loading blog post");
  }
});


// Test route for image generation page
app.get("/test-image", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/test-image-generation.html"));
});

// Clear cache management page
app.get("/clear-cache", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/clear-cache.html"));
});

// Serve index.html for the root
app.get("/", (req, res) => {
  console.log("Root route hit, serving index.html");
  const filePath = path.join(__dirname, "../frontend/pages/index.html");
  console.log("File path:", filePath);
  res.sendFile(filePath);
});

// Serve static files (CSS, JS, images) but not index.html
app.use(express.static(path.join(__dirname, "../frontend"), {
  index: false // This prevents express.static from serving index.html
}));

app.listen(port, () => {
  console.log("Server running at http://localhost:" + port);
});

// Graceful shutdown to save cache
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  // Save Freepik cache before exiting
  freepikService.savePersistentCache();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  // Save Freepik cache before exiting
  freepikService.savePersistentCache();
  process.exit(0);
});
