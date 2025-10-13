const axios = require('axios');
const fs = require('fs');
const path = require('path');

class FreepikService {
    constructor() {
        this.apiKey = process.env.FREEPIK_API_KEY;
        this.baseUrl = 'https://api.freepik.com/v1';
        this.isRateLimited = false;
        this.rateLimitResetTime = null;
        this.imageCache = new Map(); // Simple in-memory cache
        this.cacheFile = path.join(__dirname, '../cache/freepik-images.json');
        
        // Load persistent cache on startup
        this.loadPersistentCache();
        
        // Debug environment loading
        console.log('🔧 FreepikService initialized:');
        console.log('  - API Key found:', !!this.apiKey);
        console.log('  - API Key length:', this.apiKey?.length || 0);
        console.log('  - API Key preview:', this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'none');
        console.log('  - Base URL:', this.baseUrl);
        console.log('  - Cache file location:', this.cacheFile);
        console.log('  - Cache size:', this.imageCache.size);
        
        if (!this.apiKey) {
            console.warn('❌ Freepik API key not found. Image generation will be disabled.');
            console.warn('   Make sure FREEPIK_API_KEY is set in your .env file');
        }
    }

    /**
     * Check if an image is already cached for an article
     * @param {string} articleId - Unique article ID from Notion
     * @returns {string|null} - Cached image URL or null if not found
     */
    getCachedImage(articleId) {
        if (!articleId) return null;
        
        const cacheKey = `article-${articleId}`;
        if (this.imageCache.has(cacheKey)) {
            console.log(`📦 Found cached image for article ID: ${articleId}`);
            return this.imageCache.get(cacheKey);
        }
        return null;
    }

    /**
     * Generate an image based on article content
     * @param {string} articleTitle - The title of the article
     * @param {string} articleSummary - The summary/description of the article
     * @param {Array} tags - Article tags for context
     * @param {string} articleId - Unique article ID from Notion (optional but recommended)
     * @param {boolean} bypassCache - Whether to bypass cache and force regeneration
     * @returns {Promise<string|null>} - Generated image URL or null if failed
     */
    async generateArticleImage(articleTitle, articleSummary, tags = [], articleId = null, bypassCache = false) {
        if (!this.apiKey) {
            console.log('Freepik API not configured, using Unsplash fallback');
            return this.getFallbackImage(tags, articleId);
        }

        // Check if we're rate limited
        if (this.isRateLimited) {
            console.log('⚠️ Freepik API rate limited, using Unsplash fallback');
            return this.getFallbackImage(tags, articleId);
        }

        try {
            // Create a unique cache key - use articleId if available, otherwise use content hash + timestamp
            let cacheKey;
            if (articleId) {
                // Use article ID for guaranteed uniqueness
                cacheKey = `article-${articleId}`;
            } else {
                // Fallback: create unique cache key with timestamp to ensure uniqueness
                const contentHash = this.getSimpleHash(`${articleTitle}${articleSummary}${tags.join(',')}`);
                const timestamp = Date.now();
                cacheKey = `${contentHash}-${timestamp}-${articleTitle.substring(0, 20)}`;
            }
            
            console.log(`🔑 Cache key for "${articleTitle}": ${cacheKey}`);
            
            // Check cache first (unless bypassed)
            if (!bypassCache && this.imageCache.has(cacheKey)) {
                console.log(`📦 Using cached image for: "${articleTitle}"`);
                return this.imageCache.get(cacheKey);
            }
            
            if (bypassCache) {
                console.log(`🚫 Cache bypassed for: "${articleTitle}"`);
            }

            // Generate intelligent prompt based on article content
            const prompt = this.createImagePrompt(articleTitle, articleSummary, tags);
            
            console.log(`🎨 Generating image for article: "${articleTitle}"`);
            console.log(`📝 Using prompt: "${prompt}"`);
            console.log(`🏷️ Article summary: "${articleSummary?.substring(0, 100)}..."`);
            console.log(`🔀 Tags: [${tags.join(', ')}]`);
            
            // Generate the image
            const imageUrl = await this.generateImage(prompt, articleTitle, articleSummary, tags);
            
            if (imageUrl) {
                console.log(`✅ Successfully generated image: ${imageUrl}`);
                // Cache the result in memory and persistently
                this.imageCache.set(cacheKey, imageUrl);
                this.savePersistentCache();
                return imageUrl;
            }

            console.log(`❌ Failed to generate image via Freepik for: "${articleTitle}"`);
            console.log(`🖼️ Using Unsplash fallback image instead`);

            // Use Unsplash fallback when Freepik fails
            const fallbackImage = this.getFallbackImage(tags, articleId);

            // Cache the fallback image so we don't regenerate on every request
            this.imageCache.set(cacheKey, fallbackImage);
            this.savePersistentCache();

            return fallbackImage;
        } catch (error) {
            console.error('Error generating article image:', error);

            // Check if it's a rate limit error
            if (error.response?.data?.message?.includes('API request limit')) {
                console.log('🚫 Rate limit detected, marking service as rate limited');
                this.isRateLimited = true;
                // Reset after 24 hours (typical rate limit reset)
                setTimeout(() => {
                    this.isRateLimited = false;
                    console.log('✅ Rate limit reset, service available again');
                }, 24 * 60 * 60 * 1000);
            }

            console.log(`🖼️ Using Unsplash fallback image due to error`);

            // Use Unsplash fallback when error occurs
            const fallbackImage = this.getFallbackImage(tags, articleId);

            // Cache the fallback image
            if (articleId) {
                const cacheKey = `article-${articleId}`;
                this.imageCache.set(cacheKey, fallbackImage);
                this.savePersistentCache();
            }

            return fallbackImage;
        }
    }

    /**
     * Create an optimized prompt for article illustration with enhanced tech/finance focus
     * @param {string} title - Article title
     * @param {string} summary - Article summary
     * @param {Array} tags - Article tags
     * @returns {string} - Optimized prompt for image generation
     */
    createImagePrompt(title, summary, tags = []) {
        // Extract key themes for context
        const tagContext = tags.length > 0 ? tags.join(', ') : '';
        const contentKeywords = this.extractKeywords(title, summary);

        // Create hash for randomization
        const titleHash = this.getSimpleHash(title);
        const summaryHash = this.getSimpleHash(summary || '');
        const combinedHash = titleHash + summaryHash;

        // Base Bubble brand-aligned prompt
        let basePrompt = `Create an abstract, tech-inspired illustration for a blog article cover, fully aligned with Bubble's visual identity. `;

        // Add article-specific context subtly
        if (contentKeywords) {
            basePrompt += `Visual theme relates to: ${contentKeywords}. `;
        }

        // Core Bubble visual style (always applied)
        basePrompt += `Visuals and Style: Flowing shapes and layered translucent gradients, glassmorphism and soft blurs encouraged. `;
        basePrompt += `Palette strictly based on: dominant white and very light gray, cool blue, cyan, soft purple hex #667eea, black and deep gray for accents—always ensuring strong contrast and accessibility. `;
        basePrompt += `Composition: smooth transitions, digital light effects, minimal geometric or organic overlays, and soft shadows. `;
        basePrompt += `Vibe: innovative, digital, artistic, professional—evokes cutting-edge AI technology, modernity, and creativity. `;
        basePrompt += `CRITICAL: Absolutely NO text, NO letters, NO words, NO typography, NO written content of any kind in the image. NO logos, NO symbols with text. Purely abstract visual design only. `;
        basePrompt += `Horizontal layout, suitable for website/blog tiles and banners. `;
        basePrompt += `Tiles and cards should have a unified border-radius of 24px. `;

        // Randomized elements for uniqueness
        const colorFocus = [
            'emphasis on soft purple #667eea gradients with white accents',
            'dominant white with cyan and blue flowing shapes',
            'cool blue primary with purple and light gray layers',
            'white and very light gray base with soft purple highlights',
            'cyan and white translucent shapes with minimal purple',
            'layered white, light gray, and #667eea transparent gradients'
        ];
        const selectedColorFocus = colorFocus[titleHash % colorFocus.length];

        const shapeFluidity = [
            'highly fluid organic shapes with smooth curves',
            'balanced mix of geometric and organic flowing forms',
            'angular geometric patterns with soft rounded edges',
            'circular and elliptical floating shapes',
            'wavy flowing ribbons and translucent layers',
            'crystalline structures with soft transparent edges'
        ];
        const selectedShapeFluidity = shapeFluidity[summaryHash % shapeFluidity.length];

        const motifArrangement = [
            'layered from bottom-left to top-right diagonal',
            'centered composition with radiating elements',
            'asymmetrical balance with floating shapes on sides',
            'horizontal flow from left to right',
            'scattered distribution with depth perspective',
            'vertical stacking with transparent overlays'
        ];
        const selectedMotifArrangement = motifArrangement[combinedHash % motifArrangement.length];

        basePrompt += `Randomized uniqueness: ${selectedColorFocus}, ${selectedShapeFluidity}, ${selectedMotifArrangement}. `;
        basePrompt += `Light and airy overall feeling—never crowded or dark. `;

        // Add tags context if available
        if (tagContext) {
            basePrompt += `Subtle thematic reference to: ${tagContext}. `;
        }

        // Expressive value statement (always applied)
        basePrompt += `Expressive Value Statement: The artwork must radiate clarity and visual lightness, using transparent, floating shapes and a luminous color palette to embody Bubble's core principles: total transparency, openness, ethical innovation, and making finance accessible for everyone. `;
        basePrompt += `The image should feel welcoming and explainable, as if you can "see through" both the design and the layers—mirroring the way Bubble builds in public.`;

        return basePrompt;
    }

    /**
     * Extract meaningful keywords from title and summary
     */
    extractKeywords(title, summary) {
        const text = `${title} ${summary}`.toLowerCase();
        
        // Enhanced keyword patterns with more specificity
        const keywordPatterns = [
            // Finance-specific terms
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
            
            // AI/Tech-specific terms
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
            
            // Business/Strategy terms
            /startup?s?/g,
            /entreprise?s?|business/g,
            /stratégie?s?|strategy?/g,
            /croissance|growth/g,
            /développement|development/g,
            /productivité|productivity/g,
            /efficacité|efficiency/g,
            /transformation/g,
            /optimisation|optimization/g,
            
            // Market/Economic terms
            /inflation/g,
            /récession|recession/g,
            /volatilité|volatility/g,
            /liquidité|liquidity/g,
            /capitalisation/g,
            /analyse|analysis/g,
            /prédiction|prediction/g,
            /tendance?s?|trend?s?/g
        ];
        
        const foundKeywords = [];
        keywordPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                foundKeywords.push(...matches.slice(0, 1)); // One per pattern for variety
            }
        });
        
        // If no specific keywords found, extract meaningful words from title
        if (foundKeywords.length === 0) {
            const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'les', 'des', 'une', 'dans', 'sur', 'pour', 'avec', 'qui', 'que', 'what', 'how', 'why', 'when', 'where'];
            const titleWords = title.split(/[\s\-_,.:;!?]+/).filter(word => 
                word.length > 3 && 
                !stopWords.includes(word.toLowerCase()) &&
                /^[a-zA-ZÀ-ÿ]+$/.test(word) // Only letters, including accented characters
            );
            foundKeywords.push(...titleWords.slice(0, 2));
        }
        
        // Add some randomization to keyword selection
        const hash = this.getSimpleHash(title + summary);
        const shuffledKeywords = foundKeywords.sort(() => (hash % 3) - 1);
        
        return shuffledKeywords.slice(0, 3).join(' '); // Limit to 3 keywords max
    }

    /**
     * Generate visual metaphors based on article content
     */
    generateVisualMetaphor(title, summary, tags) {
        const content = `${title} ${summary} ${tags.join(' ')}`.toLowerCase();
        const hash = this.getSimpleHash(content);
        
        // Finance-related visual metaphors
        const financeMetaphors = [
            'ascending graph arrows',
            'interconnected network nodes', 
            'balanced scale elements',
            'growth spiral patterns',
            'flowing currency symbols',
            'digital transaction streams',
            'market pulse visualizations',
            'investment tree structures'
        ];
        
        // AI/Tech visual metaphors
        const techMetaphors = [
            'neural network connections',
            'data flow streams',
            'algorithmic patterns',
            'binary code elements',
            'circuit board aesthetics',
            'holographic interfaces',
            'quantum particle effects',
            'digital transformation waves'
        ];
        
        // Fintech/Business metaphors (combining business and finance)
        const fintechMetaphors = [
            'investment growth trajectories',
            'financial ecosystem networks',
            'digital transformation pathways',
            'automated portfolio structures',
            'intelligent trading connections',
            'fintech innovation bridges',
            'investment platform foundations',
            'financial data architecture'
        ];
        
        // Select metaphor based on content theme - always finance/tech relevant
        let selectedMetaphors = fintechMetaphors; // default to fintech for Bubble
        
        if (this.isFinanceTheme(title, summary, tags) && this.isAITheme(title, summary, tags)) {
            // Combine both for AI + Finance articles
            selectedMetaphors = [...financeMetaphors, ...techMetaphors];
        } else if (this.isFinanceTheme(title, summary, tags)) {
            selectedMetaphors = financeMetaphors;
        } else if (this.isAITheme(title, summary, tags) || this.isTechTheme(title, summary, tags)) {
            selectedMetaphors = techMetaphors;
        }
        
        return selectedMetaphors[hash % selectedMetaphors.length];
    }

    /**
     * Simple hash function for title variation
     */
    getSimpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Check if content is finance-related
     */
    isFinanceTheme(title, summary, tags) {
        const financeKeywords = ['finance', 'investment', 'trading', 'market', 'stock', 'portfolio', 'money', 'économie', 'investissement', 'marché', 'bourse'];
        const content = `${title} ${summary} ${tags.join(' ')}`.toLowerCase();
        return financeKeywords.some(keyword => content.includes(keyword));
    }

    /**
     * Check if content is AI-related
     */
    isAITheme(title, summary, tags) {
        const aiKeywords = ['ai', 'artificial intelligence', 'intelligence artificielle', 'machine learning', 'neural', 'algorithm', 'automation', 'algorithme'];
        const content = `${title} ${summary} ${tags.join(' ')}`.toLowerCase();
        return aiKeywords.some(keyword => content.includes(keyword));
    }

    /**
     * Check if content is tech-related
     */
    isTechTheme(title, summary, tags) {
        const techKeywords = ['technology', 'tech', 'digital', 'innovation', 'startup', 'product', 'development', 'technologie', 'numérique', 'produit'];
        const content = `${title} ${summary} ${tags.join(' ')}`.toLowerCase();
        return techKeywords.some(keyword => content.includes(keyword));
    }

    /**
     * Check if content is investment-related
     */
    isInvestmentTheme(title, summary, tags) {
        const investmentKeywords = ['investment', 'investing', 'portfolio', 'asset', 'wealth', 'capital', 'returns', 'dividend', 'investissement', 'portefeuille', 'actifs', 'rendement', 'robo-advisor', 'automated investing'];
        const content = `${title} ${summary} ${tags.join(' ')}`.toLowerCase();
        return investmentKeywords.some(keyword => content.includes(keyword));
    }

    /**
     * Check if content is crypto-related
     */
    isCryptoTheme(title, summary, tags) {
        const cryptoKeywords = ['crypto', 'cryptocurrency', 'bitcoin', 'blockchain', 'defi', 'nft', 'ethereum', 'token', 'digital currency', 'web3', 'smart contract'];
        const content = `${title} ${summary} ${tags.join(' ')}`.toLowerCase();
        return cryptoKeywords.some(keyword => content.includes(keyword));
    }

    /**
     * Select optimal model based on content theme
     */
    selectOptimalModel(title, summary, tags) {
        const content = `${title} ${summary} ${tags.join(' ')}`.toLowerCase();
        const hash = this.getSimpleHash(content);
        
        // Model selection based on content complexity and theme
        if (this.isAITheme(title, summary, tags) || this.isCryptoTheme(title, summary, tags)) {
            // Complex AI/crypto themes need highest quality
            const aiModels = ['imagen-4', 'imagen-4-ultra', 'flux-realism'];
            return aiModels[hash % aiModels.length];
        } else if (this.isInvestmentTheme(title, summary, tags)) {
            // Investment themes benefit from photorealistic models
            const investmentModels = ['imagen-4', 'flux-realism', 'imagen-4-fast'];
            return investmentModels[hash % investmentModels.length];
        } else if (this.isFinanceTheme(title, summary, tags)) {
            // Finance themes need professional quality
            const financeModels = ['imagen-4-fast', 'imagen-4', 'flux'];
            return financeModels[hash % financeModels.length];
        } else {
            // Default tech/business themes
            const defaultModels = ['imagen-4-fast', 'flux', 'imagen-3'];
            return defaultModels[hash % defaultModels.length];
        }
    }

    /**
     * Generate enhanced visual elements for tech/finance themes
     */
    generateEnhancedVisualElements(title, summary, tags) {
        const content = `${title} ${summary} ${tags.join(' ')}`.toLowerCase();
        const hash = this.getSimpleHash(content);
        
        const elements = [];
        
        // Tech/Finance specific visual elements pool
        const techElements = [
            'floating holographic displays',
            'interconnected network nodes',
            'flowing data streams',
            'geometric algorithm patterns',
            'digital grid overlays',
            'particle effect backgrounds',
            'abstract circuit pathways',
            'crystalline data structures'
        ];
        
        const financeElements = [
            'ascending growth arrows',
            'market trend visualizations',
            'investment portfolio charts',
            'financial flow diagrams',
            'risk analysis graphics',
            'performance metric displays',
            'automated trading interfaces',
            'wealth optimization visualizations'
        ];
        
        const innovationElements = [
            'futuristic technology interfaces',
            'next-generation design elements',
            'cutting-edge visual metaphors',
            'revolutionary concept illustrations',
            'breakthrough innovation symbols',
            'transformative technology graphics',
            'disruptive business visualizations',
            'pioneering solution representations'
        ];
        
        // Select elements based on theme and add randomization
        if (this.isFinanceTheme(title, summary, tags)) {
            elements.push(financeElements[hash % financeElements.length]);
            elements.push(techElements[(hash * 2) % techElements.length]);
        } else if (this.isAITheme(title, summary, tags) || this.isTechTheme(title, summary, tags)) {
            elements.push(techElements[hash % techElements.length]);
            elements.push(innovationElements[(hash * 3) % innovationElements.length]);
        } else {
            // Default to fintech combination
            elements.push(financeElements[hash % financeElements.length]);
            elements.push(innovationElements[(hash * 2) % innovationElements.length]);
        }
        
        return elements;
    }

    /**
     * Generate image using Freepik API
     * @param {string} prompt - Image generation prompt
     * @param {string} _title - Article title (optional, for model selection) - Currently unused but kept for future use
     * @param {string} _summary - Article summary (optional, for model selection) - Currently unused but kept for future use
     * @param {Array} _tags - Article tags (optional, for model selection) - Currently unused but kept for future use
     * @returns {Promise<string|null>} - Generated image URL
     */
    async generateImage(prompt, _title = "", _summary = "", _tags = []) {
        if (!this.apiKey) {
            console.log('Freepik API not configured, skipping image generation');
            return null;
        }

        try {
            console.log('🎨 Starting image generation...');
            console.log('📝 Prompt:', prompt);
            
            const response = await axios.post(
                `${this.baseUrl}/ai/text-to-image`,
                { prompt: prompt },
                {
                    headers: {
                        'x-freepik-api-key': this.apiKey,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            console.log('✅ API Response status:', response.status);
            console.log('📄 API Response data:', JSON.stringify(response.data, null, 2));

            // Check for base64 data (most common response)
            const base64Data = response.data?.data?.[0]?.base64;
            if (base64Data) {
                console.log('🎉 Base64 image data received');
                return `data:image/png;base64,${base64Data}`;
            }

            // Check for direct image URL
            const imageUrl = response.data?.url || response.data?.image_url;
            if (imageUrl) {
                console.log('🎉 Direct image URL received:', imageUrl);
                return imageUrl;
            }

            // Check for task_id (async processing)
            const taskId = response.data?.task_id;
            if (taskId) {
                console.log('🆔 Task ID received:', taskId);
                return await this.pollForImageCompletion(taskId);
            }

            console.log('❌ No recognizable image data found in response');
            return null;
            
        } catch (error) {
            console.error('❌ Image generation failed:', error.response?.data || error.message);
            return null;
        }
    }

    /**
     * Poll for image generation completion
     * @param {string} taskId - Task ID from initial request
     * @returns {Promise<string|null>} - Generated image URL
     */
    async pollForImageCompletion(taskId, maxAttempts = 10, delayMs = 2000) {
        console.log(`🔄 Starting to poll for task completion: ${taskId}`);
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                console.log(`⏳ Waiting ${delayMs}ms before polling attempt ${attempt + 1}...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
                
                console.log(`📡 Polling attempt ${attempt + 1}/${maxAttempts} for task: ${taskId}`);
                const response = await axios.get(
                    `${this.baseUrl}/ai/text-to-image/${taskId}`,
                    {
                        headers: {
                            'x-freepik-api-key': this.apiKey
                        }
                    }
                );

                console.log(`📊 Polling response status: ${response.status}`);
                console.log(`📋 Polling response data:`, JSON.stringify(response.data, null, 2));

                // Check both nested and direct data structures
                const taskData = response.data?.data || response.data;
                const taskStatus = taskData?.status;
                
                console.log(`📋 Task status: ${taskStatus}`);

                if (taskStatus === 'COMPLETED' || taskStatus === 'completed') {
                    console.log('🎉 Task completed successfully!');
                    
                    // Check multiple possible image locations
                    const images = taskData?.generated || taskData?.result?.images || taskData?.images;
                    
                    if (images && images.length > 0) {
                        const imageUrl = images[0]?.url || images[0];
                        console.log(`🖼️ Image URL received: ${imageUrl}`);
                        return imageUrl;
                    } else {
                        console.log('❌ No images in completed result');
                        console.log('🔍 Available data:', {
                            hasGenerated: !!taskData?.generated,
                            hasResultImages: !!taskData?.result?.images,
                            hasImages: !!taskData?.images,
                            generatedLength: taskData?.generated?.length,
                            resultImagesLength: taskData?.result?.images?.length,
                            imagesLength: taskData?.images?.length
                        });
                        return null;
                    }
                }

                if (taskStatus === 'FAILED' || taskStatus === 'failed') {
                    console.error('💥 Image generation failed:', taskData?.error || 'Unknown error');
                    return null;
                }

                // If still processing, continue polling
                console.log(`⏳ Task still ${taskStatus || 'processing'}... continuing to poll`);
                
            } catch (error) {
                console.error(`❌ Error polling for image completion (attempt ${attempt + 1}):`, error.response?.data || error.message);
                
                if (attempt === maxAttempts - 1) {
                    console.error('🚫 Max polling attempts reached, giving up');
                    return null;
                }
            }
        }

        console.error('⏰ Image generation timed out after maximum attempts');
        return null;
    }

    /**
     * Delete a specific cached image by article ID
     * @param {string} articleId - Article ID to remove from cache
     * @returns {boolean} - True if image was found and deleted
     */
    deleteCachedImage(articleId) {
        if (!articleId) return false;

        const cacheKey = `article-${articleId}`;
        const hadImage = this.imageCache.has(cacheKey);

        if (hadImage) {
            this.imageCache.delete(cacheKey);
            this.savePersistentCache();
            console.log(`🗑️ Deleted cached image for article ID: ${articleId}`);
            return true;
        }

        console.log(`⚠️ No cached image found for article ID: ${articleId}`);
        return false;
    }

    /**
     * Clear the image cache (useful for getting fresh images)
     */
    clearCache() {
        this.imageCache.clear();
        try {
            if (fs.existsSync(this.cacheFile)) {
                fs.unlinkSync(this.cacheFile);
                console.log('🧹 Freepik image cache cleared from disk');
            }
        } catch (error) {
            console.warn('⚠️ Failed to clear persistent cache file:', error.message);
        }
        console.log('🧹 Freepik image cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.imageCache.size,
            keys: Array.from(this.imageCache.keys())
        };
    }

    /**
     * Load persistent cache from disk
     */
    loadPersistentCache() {
        try {
            // Ensure cache directory exists
            const cacheDir = path.dirname(this.cacheFile);
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
                console.log(`📁 Created cache directory: ${cacheDir}`);
            }

            // Load existing cache if it exists
            if (fs.existsSync(this.cacheFile)) {
                const cacheData = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
                this.imageCache = new Map(Object.entries(cacheData));
                console.log(`📦 Loaded ${this.imageCache.size} cached images from disk`);
            } else {
                console.log('📦 No existing cache file found, starting with empty cache');
            }
        } catch (error) {
            console.warn('⚠️ Failed to load persistent cache:', error.message);
            this.imageCache = new Map(); // Fallback to empty cache
        }
    }

    /**
     * Save persistent cache to disk
     */
    savePersistentCache() {
        try {
            const cacheData = Object.fromEntries(this.imageCache);
            fs.writeFileSync(this.cacheFile, JSON.stringify(cacheData, null, 2));
            console.log(`💾 Saved ${this.imageCache.size} cached images to disk`);
        } catch (error) {
            console.warn('⚠️ Failed to save persistent cache:', error.message);
        }
    }

    /**
     * Test the Freepik API connection
     * @returns {Promise<boolean>} - True if API is working
     */
    async testConnection() {
        console.log('🔍 Testing Freepik API connection...');
        console.log('🔑 API Key present:', !!this.apiKey);
        console.log('🔑 API Key length:', this.apiKey?.length || 0);
        console.log('🌐 Base URL:', this.baseUrl);
        
        if (!this.apiKey) {
            console.error('❌ No API key found');
            return false;
        }

        try {
            // Test with the most basic request possible
            console.log('🧪 Making test API call...');
            const response = await axios.post(
                `${this.baseUrl}/ai/text-to-image`,
                { prompt: "Simple blue abstract background" },
                {
                    headers: {
                        'x-freepik-api-key': this.apiKey,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000 // Shorter timeout for test
                }
            );
            
            console.log('✅ Test API Response status:', response.status);
            console.log('📄 Test API Response data:', JSON.stringify(response.data, null, 2));
            
            // Check if we got a valid response structure
            const hasTaskId = !!response.data?.task_id;
            const hasImageUrl = !!(response.data?.url || response.data?.image_url);
            
            console.log('🔍 Response analysis:', {
                status: response.status,
                hasTaskId,
                hasImageUrl,
                responseKeys: Object.keys(response.data || {})
            });
            
            return response.status === 200 && (hasTaskId || hasImageUrl);
            
        } catch (error) {
            console.error('❌ Freepik API test failed:');
            console.error('Status:', error.response?.status);
            console.error('Status Text:', error.response?.statusText);
            console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
            console.error('Error Message:', error.message);
            
            if (error.response?.status === 401) {
                console.error('🔐 Authentication failed - check API key');
            } else if (error.response?.status === 403) {
                console.error('🚫 Access forbidden - check API permissions');
            } else if (error.response?.status === 429) {
                console.error('⏰ Rate limit exceeded');
            }
            
            return false;
        }
    }

    /**
     * Get theme-based Unsplash fallback image
     * Returns high-quality stock images that match Bubble's aesthetic
     * @param {Array} tags - Article tags for theme detection
     * @param {string} articleId - Article ID for consistent selection
     * @returns {string} - Unsplash image URL
     */
    getFallbackImage(tags = [], articleId = null) {
        // Create hash from article ID for consistent selection
        const articleHash = articleId ? Math.abs(this.getSimpleHash(articleId)) : Math.floor(Math.random() * 1000);

        // Detect themes from tags (case-insensitive, check if keyword is in tag)
        const isFinanceTheme = tags.some(tag => {
            const lowerTag = tag.toLowerCase();
            return ['finance', 'investment', 'trading', 'market', 'portfolio', 'money', 'financial'].some(keyword => lowerTag.includes(keyword));
        });
        const isAITheme = tags.some(tag => {
            const lowerTag = tag.toLowerCase();
            return ['ai', 'intelligence', 'technology', 'tech', 'automation', 'robo'].some(keyword => lowerTag.includes(keyword));
        });
        const isDataTheme = tags.some(tag => {
            const lowerTag = tag.toLowerCase();
            return ['data', 'analytics', 'analysis', 'statistics', 'research'].some(keyword => lowerTag.includes(keyword));
        });

        // Curated Unsplash images matching Bubble's aesthetic:
        // - Tech/AI: Abstract, minimalist, blue/purple tones
        // - Finance: Professional, clean, modern
        // - Data: Charts, graphs, analytical
        let imagePool = [];

        if (isFinanceTheme && isAITheme) {
            // Fintech + AI: Abstract, flowing gradients with purple/blue
            imagePool = [
                'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=675&fit=crop', // Abstract purple/blue gradient
                'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&h=675&fit=crop', // Smooth gradient flow
                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=675&fit=crop', // Abstract gradient art
                'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1200&h=675&fit=crop', // Abstract wavy gradient
                'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&h=675&fit=crop'  // Purple blue abstract waves
            ];
        } else if (isFinanceTheme && isDataTheme) {
            // Finance + Data: Abstract with cool tones
            imagePool = [
                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=675&fit=crop', // Abstract gradient
                'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=1200&h=675&fit=crop', // Blue abstract shapes
                'https://images.unsplash.com/photo-1635070041409-e63e783ce3b0?w=1200&h=675&fit=crop', // Gradient layers
                'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&h=675&fit=crop', // Abstract flowing shapes
                'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1200&h=675&fit=crop'  // Wavy gradients
            ];
        } else if (isAITheme && isDataTheme) {
            // AI + Data: Abstract tech gradients
            imagePool = [
                'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=675&fit=crop', // Purple/blue abstract
                'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&h=675&fit=crop', // Tech gradient
                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=675&fit=crop', // Abstract art
                'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&h=675&fit=crop', // Flowing waves
                'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=1200&h=675&fit=crop'  // Blue abstract
            ];
        } else if (isFinanceTheme) {
            // Finance: Elegant abstract gradients
            imagePool = [
                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=675&fit=crop', // Gradient abstract
                'https://images.unsplash.com/photo-1635070041409-e63e783ce3b0?w=1200&h=675&fit=crop', // Layered gradients
                'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=1200&h=675&fit=crop', // Blue abstract
                'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1200&h=675&fit=crop', // Wavy gradient
                'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&h=675&fit=crop'  // Abstract waves
            ];
        } else if (isAITheme) {
            // AI: Futuristic abstract gradients
            imagePool = [
                'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=675&fit=crop', // Purple/blue tech
                'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&h=675&fit=crop', // Smooth gradient
                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=675&fit=crop', // Abstract art
                'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&h=675&fit=crop', // Flowing abstract
                'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1200&h=675&fit=crop'  // Gradient waves
            ];
        } else if (isDataTheme) {
            // Data: Abstract analytical visuals
            imagePool = [
                'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=1200&h=675&fit=crop', // Blue abstract
                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=675&fit=crop', // Gradient abstract
                'https://images.unsplash.com/photo-1635070041409-e63e783ce3b0?w=1200&h=675&fit=crop', // Layered gradient
                'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&h=675&fit=crop', // Abstract flow
                'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1200&h=675&fit=crop'  // Wavy abstract
            ];
        } else {
            // Generic: Abstract, artistic, modern gradients
            imagePool = [
                'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=675&fit=crop', // Purple/blue gradient
                'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&h=675&fit=crop', // Smooth gradient
                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=675&fit=crop', // Abstract gradient art
                'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1200&h=675&fit=crop', // Wavy gradient
                'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&h=675&fit=crop'  // Abstract waves
            ];
        }

        // Select image consistently based on article hash
        const selectedImage = imagePool[articleHash % imagePool.length];
        console.log(`🖼️ Selected fallback image for article (themes: finance=${isFinanceTheme}, AI=${isAITheme}, data=${isDataTheme}): ${selectedImage}`);

        return selectedImage;
    }
}

module.exports = new FreepikService();