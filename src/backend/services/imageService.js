const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

class ImageService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || process.env.FREEPIK_API_KEY || null;
    if (!process.env.OPENAI_API_KEY && process.env.FREEPIK_API_KEY) {
      console.warn(
        "⚠️  FREEPIK_API_KEY is deprecated. Please migrate to OPENAI_API_KEY for image generation."
      );
    }

    this.openai =
      this.apiKey && typeof this.apiKey === "string"
        ? new OpenAI({ apiKey: this.apiKey })
        : null;

    this.imageCache = new Map();
    this.cacheFile = path.join(__dirname, "../cache/image-service-cache.json");
    this.legacyCacheFile = path.join(
      __dirname,
      "../cache/freepik-images.json"
    );

    this.loadPersistentCache();

    console.log("🔧 ImageService initialized (OpenAI Images):");
    console.log("  - API key present:", !!this.apiKey);
    if (this.apiKey) {
      const preview = `${this.apiKey.slice(0, 8)}…${this.apiKey.slice(-4)}`;
      console.log("  - API key preview:", preview);
    }
    console.log("  - Cache entries:", this.imageCache.size);
    console.log("  - Cache file:", this.cacheFile);

    if (!this.apiKey) {
      console.warn(
        "❌ OPENAI_API_KEY not found. Image generation will fall back to stock imagery."
      );
    }
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

    if (!this.apiKey || !this.openai) {
      console.log("OpenAI API key missing, returning fallback image.");
      const fallback = this.getFallbackImage(tags, articleId);
      this.imageCache.set(cacheKey, fallback);
      this.savePersistentCache();
      return fallback;
    }

    const prompt = this.createImagePrompt(articleTitle, articleSummary, tags);

    console.log(`🎨 Generating OpenAI image for: "${articleTitle}"`);
    console.log(`📝 Prompt: ${prompt}`);

    let imageUrl = null;
    try {
      imageUrl = await this.generateImage(prompt);
    } catch (error) {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message;
      console.error("❌ OpenAI image generation failed:", message);
    }

    if (imageUrl) {
      console.log(`✅ Generated OpenAI image for: "${articleTitle}"`);
      this.imageCache.set(cacheKey, imageUrl);
      this.savePersistentCache();
      return imageUrl;
    }

    console.log(`🖼️ Falling back to stock image for: "${articleTitle}"`);
    const fallback = this.getFallbackImage(tags, articleId);
    this.imageCache.set(cacheKey, fallback);
    this.savePersistentCache();
    return fallback;
  }

  async generateImage(prompt) {
    if (!this.openai) {
      return null;
    }

    const response = await this.openai.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1792x1024",
      quality: "high",
      response_format: "b64_json",
    });

    const image = response?.data?.[0];
    if (!image?.b64_json) {
      return null;
    }

    const mime = image.mime_type || "image/png";
    return `data:${mime};base64,${image.b64_json}`;
  }

  async testConnection() {
    if (!this.openai) {
      return false;
    }

    try {
      await this.openai.models.retrieve("gpt-image-1");
      return true;
    } catch (error) {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message;
      console.error("❌ Failed to validate OpenAI API access:", message);
      return false;
    }
  }

  clearCache() {
    this.imageCache.clear();
    this.savePersistentCache();
  }

  getCacheStats() {
    let lastModified = null;
    try {
      if (fs.existsSync(this.cacheFile)) {
        const stats = fs.statSync(this.cacheFile);
        lastModified = stats.mtime.toISOString();
      }
    } catch (error) {
      console.warn("⚠️  Unable to read cache metadata:", error.message);
    }

    return {
      size: this.imageCache.size,
      keys: Array.from(this.imageCache.keys()),
      provider: "openai",
      cacheFile: this.cacheFile,
      lastModified,
    };
  }

  savePersistentCache() {
    try {
      const cacheDir = path.dirname(this.cacheFile);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const serialized = JSON.stringify(
        Object.fromEntries(this.imageCache),
        null,
        2
      );
      fs.writeFileSync(this.cacheFile, serialized, "utf8");
    } catch (error) {
      console.warn("⚠️  Failed to persist image cache:", error.message);
    }
  }

  loadPersistentCache() {
    try {
      const cacheDir = path.dirname(this.cacheFile);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      let cachePath = null;
      if (fs.existsSync(this.cacheFile)) {
        cachePath = this.cacheFile;
      } else if (fs.existsSync(this.legacyCacheFile)) {
        cachePath = this.legacyCacheFile;
        console.log(
          "♻️  Migrating legacy Freepik cache to OpenAI image cache."
        );
      }

      if (!cachePath) {
        return;
      }

      const raw = fs.readFileSync(cachePath, "utf8");
      const parsed = JSON.parse(raw);

      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === "string") {
          this.imageCache.set(key, value);
        }
      }

      if (cachePath === this.legacyCacheFile) {
        this.savePersistentCache();
      }
    } catch (error) {
      console.warn("⚠️  Failed to load image cache:", error.message);
    }
  }

  getCacheKey(articleId, title = "", summary = "", tags = []) {
    if (articleId) {
      return `article-${articleId}`;
    }

    const contentHash = this.getSimpleHash(
      `${title}${summary}${tags.join(",")}`
    );
    return `content-${contentHash}`;
  }

  createImagePrompt(title, summary, tags = []) {
    const tagContext = tags.length > 0 ? tags.join(", ") : "";
    const contentKeywords = this.extractKeywords(title, summary);

    const titleHash = this.getSimpleHash(title);
    const summaryHash = this.getSimpleHash(summary || "");
    const combinedHash = titleHash + summaryHash;

    let prompt =
      "Create an abstract, tech-inspired illustration for a blog article cover aligned with Bubble's brand. ";

    if (contentKeywords) {
      prompt += `Visual theme should subtly reference: ${contentKeywords}. `;
    }

    prompt +=
      "Design language: flowing shapes, layered translucent gradients, glassmorphism and soft blurs. ";
    prompt +=
      "Palette: dominant white and light greys, cool blue, cyan, soft purple (#667eea), with deep grey accents. ";
    prompt +=
      "Composition: horizontal layout, soft depth, lighting effects, smooth geometric or organic overlays. ";
    prompt +=
      "Mood: innovative, transparent, ethical fintech and AI storytelling. ";
    prompt +=
      "Critical constraints: no text, no typography, no logos, no letterforms. Pure abstract design only. ";
    prompt +=
      "Output must suit website hero and blog tile usage with rounded corners (24px radius). ";

    const colorFocus = [
      "soft purple #667eea gradients with white accents",
      "dominant white with cyan and blue flowing shapes",
      "cool blue primary with purple and light grey layers",
      "white and light grey base with soft purple highlights",
      "cyan and white translucent shapes with minimal purple",
      "layered white, light grey, and #667eea transparent gradients",
    ];
    const selectedColorFocus =
      colorFocus[titleHash % colorFocus.length];

    const shapeFluidity = [
      "highly fluid organic shapes with smooth curves",
      "balanced mix of geometric and organic flowing forms",
      "angular geometric patterns with softened edges",
      "circular and elliptical floating shapes",
      "wavy ribbons and translucent layered trails",
      "crystalline structures with gentle transparent edges",
    ];
    const selectedShapeFluidity =
      shapeFluidity[summaryHash % shapeFluidity.length];

    const motifArrangement = [
      "layered from bottom-left to top-right diagonal",
      "center-focused composition with radiating elements",
      "asymmetrical balance with floating side motifs",
      "horizontal flow from left to right",
      "scattered distribution with subtle depth cues",
      "vertical stacking with transparent overlays",
    ];
    const selectedMotifArrangement =
      motifArrangement[combinedHash % motifArrangement.length];

    const metaphor = this.generateVisualMetaphor(title, summary, tags);
    prompt += `Unique twist: ${selectedColorFocus}, ${selectedShapeFluidity}, ${selectedMotifArrangement}`;
    if (metaphor) {
      prompt += `, hint of ${metaphor}`;
    }
    prompt += ". ";

    if (tagContext) {
      prompt += `Subtle thematic reference to: ${tagContext}. `;
    }

    prompt +=
      "Emphasize visual clarity, transparency, and layered storytelling to reflect Bubble's open finance ethos.";

    return prompt;
  }

  extractKeywords(title, summary) {
    const text = `${title} ${summary}`.toLowerCase();
    const keywordPatterns = [
      /investissement?s?|investment?s?/g,
      /portefeuille?s?|portfolio?s?/g,
      /trading|négociation/g,
      /marché?s?|market?s?/g,
      /finance?s?|financier?s?/g,
      /économie?s?|economy?/g,
      /bourse?s?|stock?s?/g,
      /crypto|bitcoin|blockchain/g,
      /dividende?s?|dividend?s?/g,
      /risque?s?|risk?s?/g,
      /rendement?s?|return?s?/g,
      /intelligence artificielle|artificial intelligence|ai/g,
      /algorithme?s?|algorithm?s?/g,
      /automation|automatisation/g,
      /machine learning|apprentissage/g,
      /data|données/g,
      /neural|neuronal/g,
      /technologie?s?|technology?/g,
      /numérique?s?|digital/g,
      /innovation?s?/g,
      /cloud|nuage/g,
      /startup?s?/g,
      /entreprise?s?|business/g,
      /stratégie?s?|strategy?/g,
      /croissance|growth/g,
      /développement|development/g,
      /productivité|productivity/g,
      /efficacité|efficiency/g,
      /transformation/g,
      /optimisation|optimization/g,
      /inflation/g,
      /récession|recession/g,
      /volatilité|volatility/g,
      /liquidité|liquidity/g,
      /capitalisation/g,
      /analyse|analysis/g,
      /prédiction|prediction/g,
      /tendance?s?|trend?s?/g,
    ];

    const foundKeywords = [];
    keywordPatterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        foundKeywords.push(...matches.slice(0, 1));
      }
    });

    if (foundKeywords.length === 0) {
      const stopWords = [
        "the",
        "and",
        "or",
        "but",
        "in",
        "on",
        "at",
        "to",
        "for",
        "of",
        "with",
        "by",
        "les",
        "des",
        "une",
        "dans",
        "sur",
        "pour",
        "avec",
        "qui",
        "que",
        "what",
        "how",
        "why",
        "when",
        "where",
      ];
      const titleWords = title
        .split(/[\s\-_,.:;!?]+/)
        .filter(
          (word) =>
            word.length > 3 &&
            !stopWords.includes(word.toLowerCase()) &&
            /^[a-zA-ZÀ-ÿ]+$/.test(word)
        );
      foundKeywords.push(...titleWords.slice(0, 2));
    }

    const hash = this.getSimpleHash(title + summary);
    const shuffledKeywords = foundKeywords.sort(() => (hash % 3) - 1);

    return shuffledKeywords.slice(0, 3).join(" ");
  }

  generateVisualMetaphor(title, summary, tags) {
    const content = `${title} ${summary} ${tags.join(" ")}`.toLowerCase();
    const hash = this.getSimpleHash(content);

    const financeMetaphors = [
      "ascending graph trails",
      "interconnected network nodes",
      "balanced scale elements",
      "growth spiral patterns",
      "flowing currency streams",
      "digital market pulse",
      "investment tree structures",
      "capital flow ribbons",
    ];

    const techMetaphors = [
      "neural network light webs",
      "data flow streams",
      "algorithmic lattices",
      "binary shimmer layers",
      "circuit board motifs",
      "holographic interface arcs",
      "quantum particle halos",
      "digital transformation waves",
    ];

    const fintechMetaphors = [
      "automated portfolio structures",
      "digital wealth ecosystems",
      "fintech innovation bridges",
      "intelligent trading connectors",
      "financial data architecture",
      "responsive investment grids",
      "smart finance constellations",
      "transparent ledger layers",
    ];

    let selectedSet = fintechMetaphors;
    if (this.isFinanceTheme(title, summary, tags) && this.isAITheme(title, summary, tags)) {
      selectedSet = [...financeMetaphors, ...techMetaphors];
    } else if (this.isFinanceTheme(title, summary, tags)) {
      selectedSet = financeMetaphors;
    } else if (this.isAITheme(title, summary, tags) || this.isTechTheme(title, summary, tags)) {
      selectedSet = techMetaphors;
    }

    return selectedSet[hash % selectedSet.length];
  }

  getFallbackImage(tags = [], articleId = null) {
    const articleHash = articleId
      ? Math.abs(this.getSimpleHash(articleId))
      : Math.floor(Math.random() * 1000);

    const isFinanceTheme = tags.some((tag) => {
      const lowerTag = tag.toLowerCase();
      return ["finance", "investment", "trading", "market", "portfolio", "money", "financial"].some(
        (keyword) => lowerTag.includes(keyword)
      );
    });
    const isAITheme = tags.some((tag) => {
      const lowerTag = tag.toLowerCase();
      return ["ai", "intelligence", "technology", "tech", "automation", "robo"].some((keyword) =>
        lowerTag.includes(keyword)
      );
    });
    const isDataTheme = tags.some((tag) => {
      const lowerTag = tag.toLowerCase();
      return ["data", "analytics", "analysis", "statistics", "research"].some(
        (keyword) => lowerTag.includes(keyword)
      );
    });

    let imagePool = [];

    if (isFinanceTheme && isAITheme) {
      imagePool = [
        "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=675&fit=crop",
        "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&h=675&fit=crop",
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=675&fit=crop",
        "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1200&h=675&fit=crop",
        "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&h=675&fit=crop",
      ];
    } else if (isFinanceTheme && isDataTheme) {
      imagePool = [
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=675&fit=crop",
        "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=1200&h=675&fit=crop",
        "https://images.unsplash.com/photo-1635070041409-e63e783ce3b0?w=1200&h=675&fit=crop",
        "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&h=675&fit=crop",
        "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1200&h=675&fit=crop",
      ];
    } else if (isAITheme && isDataTheme) {
      imagePool = [
        "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=675&fit=crop",
        "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&h=675&fit=crop",
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=675&fit=crop",
        "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&h=675&fit=crop",
        "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=1200&h=675&fit=crop",
      ];
    } else if (isFinanceTheme) {
      imagePool = [
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=675&fit=crop",
        "https://images.unsplash.com/photo-1635070041409-e63e783ce3b0?w=1200&h=675&fit=crop",
        "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=1200&h=675&fit=crop",
        "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1200&h=675&fit=crop",
        "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&h=675&fit=crop",
      ];
    } else if (isAITheme) {
      imagePool = [
        "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=675&fit=crop",
        "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&h=675&fit=crop",
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=675&fit=crop",
        "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&h=675&fit=crop",
        "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1200&h=675&fit=crop",
      ];
    } else if (isDataTheme) {
      imagePool = [
        "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=1200&h=675&fit=crop",
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=675&fit=crop",
        "https://images.unsplash.com/photo-1635070041409-e63e783ce3b0?w=1200&h=675&fit=crop",
        "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&h=675&fit=crop",
        "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1200&h=675&fit=crop",
      ];
    } else {
      imagePool = [
        "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=675&fit=crop",
        "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&h=675&fit=crop",
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=675&fit=crop",
        "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1200&h=675&fit=crop",
        "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&h=675&fit=crop",
      ];
    }

    const selectedImage = imagePool[articleHash % imagePool.length];
    console.log(
      `🖼️ Selected fallback image (finance=${isFinanceTheme}, ai=${isAITheme}, data=${isDataTheme}): ${selectedImage}`
    );

    return selectedImage;
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

  isFinanceTheme(title, summary, tags) {
    const financeKeywords = [
      "finance",
      "investment",
      "trading",
      "market",
      "stock",
      "portfolio",
      "money",
      "économie",
      "investissement",
      "marché",
      "bourse",
    ];
    const content = `${title} ${summary} ${tags.join(" ")}`.toLowerCase();
    return financeKeywords.some((keyword) => content.includes(keyword));
  }

  isAITheme(title, summary, tags) {
    const aiKeywords = [
      "ai",
      "artificial intelligence",
      "intelligence artificielle",
      "machine learning",
      "neural",
      "algorithm",
      "automation",
      "algorithme",
    ];
    const content = `${title} ${summary} ${tags.join(" ")}`.toLowerCase();
    return aiKeywords.some((keyword) => content.includes(keyword));
  }

  isTechTheme(title, summary, tags) {
    const techKeywords = [
      "technology",
      "tech",
      "digital",
      "innovation",
      "startup",
      "product",
      "development",
      "technologie",
      "numérique",
      "produit",
    ];
    const content = `${title} ${summary} ${tags.join(" ")}`.toLowerCase();
    return techKeywords.some((keyword) => content.includes(keyword));
  }
}

module.exports = new ImageService();
