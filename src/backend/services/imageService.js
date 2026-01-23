const fs = require("fs");
const path = require("path");
const { Runware } = require("@runware/sdk-js");
const axios = require("axios");

class ImageService {
  constructor() {
    // Initialize Runware SDK for blog image generation
    this.runwareApiKey = process.env.RUNWARE_API_KEY || null;
    this.runware = null;
    this.connectionReady = false;
    this.runwareInitPromise = null;

    this.imageCache = new Map();
    this.cacheFile = path.join(__dirname, "../cache/image-service-cache.json");

    // Model configuration - Use Runware's native Flux Schnell model
    // Format: runware:model@version
    this.modelId = "runware:100@1"; // Runware Flux Schnell - Ultra-fast, excellent quality

    // Runware docs require 128-2048 dims in multiples of 64:
    // https://runware.ai/docs/en/image-inference/api-reference#request-width
    this.imageWidth = 1152;
    this.imageHeight = 704; // 16:9-ish while still multiple of 64

    this.loadPersistentCache();
    console.log("🔧 ImageService initializing (Runware):");
    console.log("  - Runware API key present:", !!this.runwareApiKey);
    if (this.runwareApiKey) {
      const preview = `${this.runwareApiKey.slice(0, 8)}…${this.runwareApiKey.slice(-4)}`;
      console.log("  - API key preview:", preview);
    }
    console.log("  - Model: Runware Flux Schnell (runware:100@1)");
    console.log("  - Cost: ~$0.0004/image");
    console.log("  - Cache entries:", this.imageCache.size);

    if (!this.runwareApiKey) {
      console.warn("❌ RUNWARE_API_KEY not found. Image generation will not work.");
    } else {
      // Kick off initialization; consumers await ensureRunwareReady before use
      this.runwareInitPromise = this.initializeRunware();
    }
  }

  /**
   * Initialize Runware connection with error handling
   */
  async initializeRunware() {
    try {
      if (!this.runwareApiKey) {
        throw new Error("RUNWARE_API_KEY is missing");
      }

      // Use documented async initialization pattern for guaranteed readiness
      this.runware = await Runware.initialize({
        apiKey: this.runwareApiKey,
        timeoutDuration: 60000,
      });

      this.connectionReady = true;
      console.log("✅ Runware connection established successfully (async initialize)");
    } catch (error) {
      console.error("❌ Failed to initialize Runware connection:", error.message);
      this.connectionReady = false;
      this.runware = null;
      this.runwareInitPromise = null;
    }
  }

  async ensureRunwareReady() {
    if (this.connectionReady && this.runware) {
      return true;
    }

    if (!this.runwareInitPromise) {
      this.runwareInitPromise = this.initializeRunware();
    }

    await this.runwareInitPromise;
    return this.connectionReady;
  }

  /**
   * Check if a URL is valid via HEAD request
   */
  async checkUrlValidity(url) {
    if (!url) return false;
    
    // Only check Runware URLs or other external links that might expire
    // Skip local assets or already known bad domains
    if (!url.includes('runware.ai') && !url.includes('http')) return true;

    try {
      await axios.head(url, { timeout: 2000 }); // Short timeout for checking
      return true;
    } catch (error) {
      // 404 or connection error
      return false;
    }
  }

  async getCachedImage(articleId) {
    if (!articleId) {
      return null;
    }

    const cacheKey = this.getCacheKey(articleId);
    if (this.imageCache.has(cacheKey)) {
      const cachedUrl = this.imageCache.get(cacheKey);

      // 1. Check hardcoded broken list first (fastest)
      if (cachedUrl && this.isBrokenRunwareUrl(cachedUrl)) {
        console.log(`⚠️ Cached Runware URL is in broken list for article ID: ${articleId}, removing`);
        this.imageCache.delete(cacheKey);
        this.savePersistentCache();
        return null;
      }

      // 2. Check live validity for Runware URLs
      if (cachedUrl && cachedUrl.includes('runware.ai')) {
        const isValid = await this.checkUrlValidity(cachedUrl);
        if (!isValid) {
          console.log(`⚠️ Cached Runware URL is dead (404) for article ID: ${articleId}, removing`);
          this.imageCache.delete(cacheKey);
          this.savePersistentCache();
          return null;
        }
      }

      console.log(`📦 Found valid cached image for article ID: ${articleId}`);
      return cachedUrl;
    }

    return null;
  }

  /**
   * Check if a URL is a broken Runware URL
   * Only returns true for the specific broken image IDs from before the fix
   */
  isBrokenRunwareUrl(url) {
    if (!url) return false;
    // Specific broken Runware image IDs that returned 404
    const brokenImageIds = [
      '94fa839b-3247-43e7-b231-09442709dd31',
      '74dc21d1-8a59-40c0-9cbc-8b02f67fa6e6',
      '40a07784-cd6e-4dde-b08e-b66e828b4e52',
      '1b04787c-47b7-406c-9e4a-e58c45d12039',
      '33581d98-2a75-48ca-84c6-be6900fa9dab',
      'cbbbd618-70ca-452b-ae8c-e64d98c65198',
      '2b45a2e1-4dbc-42d5-b22d-9dd2874eeab2',
    ];

    return brokenImageIds.some(id => url.includes(id));
  }

  async generateArticleImage(
    articleTitle,
    articleSummary,
    tags = [],
    articleId = null,
    bypassCache = false
  ) {
    const cacheKey = this.getCacheKey(articleId, articleTitle, articleSummary, tags);

    if (!bypassCache) {
      // Use the async getCachedImage which performs validation
      const cachedUrl = await this.getCachedImage(articleId);
      if (cachedUrl) {
         return cachedUrl;
      }
    }

    const ready = await this.ensureRunwareReady();

    if (!ready) {
      console.log("Runware connection not available, and fallbacks are disabled.");
      return null;
    }

    const prompt = this.createImagePrompt();

    console.log(`🎨 Generating Runware image for: "${articleTitle}"`);
    console.log(`📝 Prompt: ${prompt.substring(0, 100)}...`);

    let imageUrl = null;
    try {
      imageUrl = await this.generateImage(prompt);
    } catch (error) {
      const message = error?.message || JSON.stringify(error);
      console.error("❌ Runware image generation failed:", message);
    }

    if (imageUrl) {
      console.log(`✅ Generated Runware image for: "${articleTitle}"`);
      this.imageCache.set(cacheKey, imageUrl);
      this.savePersistentCache();
      return imageUrl;
    }

    console.log(`❌ Failed to generate image for: "${articleTitle}" and fallbacks are disabled.`);
    return null;
  }

  async generateImage(prompt) {
    const ready = await this.ensureRunwareReady();
    if (!ready) {
      return null;
    }

    try {
      console.log("📡 Sending request to Runware Flux API...");

      // Add a 45-second timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Runware API timeout (45s)")), 45000)
      );

      const imageResults = await Promise.race([
        this.runware.imageInference({
          positivePrompt: prompt,
          model: this.modelId,
          width: this.imageWidth,
          height: this.imageHeight,
          numberResults: 1,
          outputType: "URL",
          outputFormat: "PNG",
          CFGScale: 7.5,
          steps: 20,
          includeCost: true,
        }),
        timeoutPromise
      ]);

      if (imageResults && imageResults.length > 0 && imageResults[0].imageURL) {
        console.log("✅ Runware image generated successfully");
        if (typeof imageResults[0].cost === "number") {
          console.log(`   Cost: $${imageResults[0].cost}`);
        }
        return imageResults[0].imageURL;
      } else {
        console.warn("❌ Runware returned no image URL");
        return null;
      }
    } catch (error) {
      console.error("❌ Runware API error:", error?.message || error);
      console.error("   Raw error payload:", error);
      return null;
    }
  }

  async testConnection() {
    const ready = await this.ensureRunwareReady();
    if (!ready) {
      return false;
    }

    try {
      console.log("🔍 Testing Runware API connection...");
      const testPrompt = "A simple abstract geometric shape in blue and white";

      const result = await Promise.race([
        this.runware.imageInference({
          positivePrompt: testPrompt,
          model: this.modelId,
          width: 512,
          height: 512,
          numberResults: 1,
          outputType: "URL",
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Connection test timeout")), 30000)
        )
      ]);

      if (result && result.length > 0 && result[0].imageURL) {
        console.log("✅ Runware API connection successful");
        return true;
      } else {
        console.warn("❌ Runware connection test returned no image");
        return false;
      }
    } catch (error) {
      console.error("❌ Failed to validate Runware API access:", error.message);
      return false;
    }
  }

  /**
   * Create image generation prompt with randomized variations
   * Each call produces a unique prompt with varied color focus, flow direction, and motif
   */
  createImagePrompt() {
    // Randomize color focus
    const colorFocuses = ["cool blue", "cyan", "soft purple", "white", "deep gray"];
    const primaryColor = colorFocuses[Math.floor(Math.random() * colorFocuses.length)];
    const secondaryColor = colorFocuses[Math.floor(Math.random() * colorFocuses.length)];

    // Randomize flow direction
    const flowDirections = ["flowing upward", "flowing downward", "flowing horizontally", "spiraling", "cascading"];
    const flow = flowDirections[Math.floor(Math.random() * flowDirections.length)];

    // Randomize composition emphasis
    const compositions = [
      "with flowing shapes and layered translucent gradients",
      "with smooth transitions and digital light effects",
      "with minimal geometric overlays and soft shadows",
      "with organic flowing elements and luminous effects",
      "with abstract geometric patterns and gradient transitions"
    ];
    const composition = compositions[Math.floor(Math.random() * compositions.length)];

    const prompt = `Create an abstract, tech-inspired illustration for a blog article cover. Visuals: - ${composition} - Palette: ${primaryColor}, ${secondaryColor}, hex #667eea, white, and deep gray with varied proportions for diversity - Composition: smooth transitions, digital light effects, minimal overlays, soft shadows, ${flow} - Vibe: innovative, digital, artistic, professional—evokes modern technology and creativity - No text or logos - Horizontal layout (1152x704), suitable for website/blog tiles and banners. Variation: each output should randomize color focus, flow direction, and motif arrangement for uniqueness. Each variation should have a unique gradient and motif composition, always feeling creative, digital, and modern.`;

    return prompt;
  }

  getSimpleHash(str) {
    let hash = 0;
    const input = String(str || "");
    for (let i = 0; i < input.length; i += 1) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash);
  }

  getCacheKey(articleId, title, summary, tags) {
    if (articleId) {
      return `article-${articleId}`;
    }
    const key = `${title}-${summary}-${tags.join(",")}`;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `content-${Math.abs(hash)}`;
  }

  loadPersistentCache() {
    try {
      if (fs.existsSync(this.cacheFile)) {
        const data = fs.readFileSync(this.cacheFile, "utf-8");
        const parsed = JSON.parse(data);
        Object.entries(parsed).forEach(([key, value]) => {
          this.imageCache.set(key, value);
        });
        console.log(`✅ Loaded ${this.imageCache.size} cached images`);
      }
    } catch (error) {
      console.warn("⚠️ Could not load persistent image cache:", error.message);
    }
  }

  savePersistentCache() {
    try {
      const cacheDir = path.dirname(this.cacheFile);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const cacheData = {};
      this.imageCache.forEach((value, key) => {
        cacheData[key] = value;
      });

      fs.writeFileSync(this.cacheFile, JSON.stringify(cacheData, null, 2));
    } catch (error) {
      console.error("❌ Failed to save image cache:", error.message);
    }
  }

  /**
   * Manually set a cached image URL for an article (e.g., for external OG images)
   */
  setCachedImage(articleId, imageUrl) {
    if (!articleId || !imageUrl) return;
    const cacheKey = `article-${articleId}`;
    this.imageCache.set(cacheKey, imageUrl);
    console.log(`📦 Cached external image for article: ${articleId}`);
    this.savePersistentCache();
  }

  clearCacheForArticle(articleId) {
    if (!articleId) return;
    const cacheKey = `article-${articleId}`;
    if (this.imageCache.has(cacheKey)) {
      this.imageCache.delete(cacheKey);
      console.log(`🗑️ Cleared cache for article: ${articleId}`);
    }
    this.savePersistentCache();
  }

  clearCache() {
    this.imageCache.clear();
    try {
      if (fs.existsSync(this.cacheFile)) {
        fs.unlinkSync(this.cacheFile);
        console.log("✅ Image cache cleared");
      }
    } catch (error) {
      console.error("❌ Failed to clear image cache file:", error.message);
    }
  }

  getCacheStats() {
    return {
      entries: this.imageCache.size,
      cacheFile: this.cacheFile,
      runwareConnected: this.connectionReady,
    };
  }
}

module.exports = new ImageService();
