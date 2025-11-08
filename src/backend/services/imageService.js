const fs = require("fs");
const path = require("path");
const { Runware } = require("@runware/sdk-js");

class ImageService {
  constructor() {
    // Initialize Runware SDK for blog image generation
    this.runwareApiKey = process.env.RUNWARE_API_KEY || null;
    this.runware = null;
    this.connectionReady = false;
    this.runwareInitPromise = null;

    // Local fallback images stored in assets
    this.fallbackImagesDir = path.join(__dirname, "../../frontend/assets/images/blog-fallbacks");
    this.fallbackImages = this.loadFallbackImages();

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
    console.log("  - Fallback images loaded:", this.fallbackImages.length);
    console.log("  - Cache entries:", this.imageCache.size);

    if (!this.runwareApiKey) {
      console.warn("❌ RUNWARE_API_KEY not found. Image generation will use local fallback images only.");
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
   * Load local fallback images from the blog-fallbacks directory
   */
  loadFallbackImages() {
    const fallbacks = [];
    try {
      if (fs.existsSync(this.fallbackImagesDir)) {
        const files = fs.readdirSync(this.fallbackImagesDir);
        files.forEach((file) => {
          if (/\.(jpg|jpeg|png|webp|gif)$/i.test(file)) {
            const filePath = path.join(this.fallbackImagesDir, file);
            fallbacks.push({
              filename: file,
              path: filePath,
              url: `/assets/images/blog-fallbacks/${file}`
            });
          }
        });
        console.log(`✅ Loaded ${fallbacks.length} fallback images from ${this.fallbackImagesDir}`);
      } else {
        console.warn(`⚠️ Fallback images directory not found: ${this.fallbackImagesDir}`);
      }
    } catch (error) {
      console.error("❌ Error loading fallback images:", error.message);
    }
    return fallbacks;
  }

  getCachedImage(articleId) {
    if (!articleId) {
      return null;
    }

    const cacheKey = this.getCacheKey(articleId);
    if (this.imageCache.has(cacheKey)) {
      console.log(`📦 Found cached image for article ID: ${articleId}`);
      return this.imageCache.get(cacheKey);
    }

    return null;
  }

  async generateArticleImage(
    articleTitle,
    articleSummary,
    tags = [],
    articleId = null,
    bypassCache = false
  ) {
    const cacheKey = this.getCacheKey(articleId, articleTitle, articleSummary, tags);

    if (!bypassCache && this.imageCache.has(cacheKey)) {
      console.log(`📦 Using cached image for: "${articleTitle}"`);
      return this.imageCache.get(cacheKey);
    }

    const ready = await this.ensureRunwareReady();

    if (!ready) {
      console.log("Runware connection not available, using local fallback image.");
      const fallback = this.getFallbackImage(articleId);
      this.imageCache.set(cacheKey, fallback);
      this.savePersistentCache();
      return fallback;
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

    console.log(`🖼️ Falling back to local image for: "${articleTitle}"`);
    const fallback = this.getFallbackImage(articleId);
    this.imageCache.set(cacheKey, fallback);
    this.savePersistentCache();
    return fallback;
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

  /**
   * Get a random local fallback image using deterministic selection based on article ID
   */
  getFallbackImage(articleId = null) {
    if (this.fallbackImages.length === 0) {
      console.warn("⚠️ No fallback images available");
      return null;
    }

    // Use article ID for deterministic selection, or random if no ID
    const articleHash = articleId
      ? Math.abs(this.getSimpleHash(articleId))
      : Math.floor(Math.random() * 1000);

    const selectedIndex = articleHash % this.fallbackImages.length;
    const selectedImage = this.fallbackImages[selectedIndex];

    console.log(
      `🎨 Selected local fallback image [${selectedIndex}]: ${selectedImage.filename}`
    );

    return selectedImage.url;
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
      fallbackImagesAvailable: this.fallbackImages.length,
      runwareConnected: this.connectionReady,
    };
  }
}

module.exports = new ImageService();
