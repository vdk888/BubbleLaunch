const axios = require('axios');

class FreepikService {
    constructor() {
        this.apiKey = process.env.FREEPIK_API_KEY;
        this.baseUrl = 'https://api.freepik.com/v1';
        this.isRateLimited = false;
        this.rateLimitResetTime = null;
        this.imageCache = new Map(); // Simple in-memory cache
        
        if (!this.apiKey) {
            console.warn('Freepik API key not found. Image generation will be disabled.');
        }
    }

    /**
     * Generate an image based on article content
     * @param {string} articleTitle - The title of the article
     * @param {string} articleSummary - The summary/description of the article
     * @param {Array} tags - Article tags for context
     * @returns {Promise<string|null>} - Generated image URL or null if failed
     */
    async generateArticleImage(articleTitle, articleSummary, tags = []) {
        if (!this.apiKey) {
            console.log('Freepik API not configured, skipping image generation');
            return null;
        }

        // Check if we're rate limited
        if (this.isRateLimited) {
            console.log('⚠️ Freepik API rate limited, skipping image generation');
            return null;
        }

        try {
            // Create a cache key based on article content
            const cacheKey = `${articleTitle}-${articleSummary}-${tags.join(',')}`;
            
            // Check cache first
            if (this.imageCache.has(cacheKey)) {
                console.log(`📦 Using cached image for: "${articleTitle}"`);
                return this.imageCache.get(cacheKey);
            }

            // Create a prompt based on article content
            const prompt = this.createImagePrompt(articleTitle, articleSummary, tags);
            
            console.log(`Generating image for article: "${articleTitle}"`);
            console.log(`Using prompt: "${prompt}"`);
            
            // Generate the image
            const imageUrl = await this.generateImage(prompt);
            
            if (imageUrl) {
                console.log(`Successfully generated image: ${imageUrl}`);
                // Cache the result
                this.imageCache.set(cacheKey, imageUrl);
                return imageUrl;
            }
            
            return null;
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
            
            return null;
        }
    }

    /**
     * Create an optimized prompt for article illustration
     * @param {string} title - Article title
     * @param {string} summary - Article summary
     * @param {Array} tags - Article tags
     * @returns {string} - Optimized prompt for image generation
     */
    createImagePrompt(title, summary, tags = []) {
        // Extract key themes and concepts
        const tagContext = tags.length > 0 ? tags.join(', ') : '';
        
        // Create a focused prompt for article illustration
        let prompt = '';
        
        // Determine the main theme based on title and tags
        const isFinanceRelated = this.isFinanceTheme(title, summary, tags);
        const isAIRelated = this.isAITheme(title, summary, tags);
        const isTechRelated = this.isTechTheme(title, summary, tags);
        
        if (isFinanceRelated && isAIRelated) {
            prompt = `Modern financial technology illustration, AI and finance concept, sleek digital interface with financial charts and data, futuristic design, professional business aesthetic, clean minimal style, blue and teal color palette`;
        } else if (isFinanceRelated) {
            prompt = `Professional financial illustration, investment and trading concept, modern charts and graphs, business growth, clean corporate design, sophisticated color scheme`;
        } else if (isAIRelated) {
            prompt = `Artificial intelligence concept illustration, modern tech design, neural networks, digital innovation, futuristic elements, gradient blue and purple colors, clean professional style`;
        } else if (isTechRelated) {
            prompt = `Modern technology illustration, innovation and digital transformation, clean tech design, professional business aesthetic, contemporary color palette`;
        } else {
            // Generic business/startup illustration
            prompt = `Modern business illustration, startup and innovation concept, professional design, clean minimal aesthetic, contemporary color scheme`;
        }
        
        // Add context from tags if available
        if (tagContext) {
            prompt += `, themes: ${tagContext}`;
        }
        
        // Ensure professional quality
        prompt += `, high quality, professional illustration, suitable for blog article header`;
        
        return prompt;
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
     * Generate image using Freepik API
     * @param {string} prompt - Image generation prompt
     * @returns {Promise<string|null>} - Generated image URL
     */
    async generateImage(prompt) {
        console.log('🎨 Starting image generation...');
        console.log('📝 Prompt:', prompt);
        console.log('🔑 API Key present:', !!this.apiKey);
        console.log('🌐 Base URL:', this.baseUrl);
        
        const requestData = {
            prompt: prompt,
            num_images: 1,
            aspect_ratio: "widescreen_16_9", // Good for blog headers
            styling: {
                style: "digital-art",
                effects: {
                    color: "vibrant",
                    lighting: "cinematic",
                    framing: "panoramic"
                }
            },
            person_generation: "dont_allow", // Avoid generating people for business illustrations
            safety_settings: "block_medium_and_above"
        };
        
        console.log('📋 Request payload:', JSON.stringify(requestData, null, 2));
        
        // Try with Classic Fast model first (most cost-effective)
        try {
            console.log('🚀 Making API request to Freepik Classic Fast...');
            const response = await axios.post(
                `${this.baseUrl}/ai/text-to-image`,
                requestData,
                {
                    headers: {
                        'x-freepik-api-key': this.apiKey,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000 // 30 second timeout
                }
            );

            console.log('✅ API Response status:', response.status);
            console.log('📄 API Response data:', JSON.stringify(response.data, null, 2));

            // Check for task_id in the nested data structure
            const taskId = response.data?.data?.task_id || response.data?.task_id;
            
            if (taskId) {
                console.log('🆔 Task ID received:', taskId);
                // The API returns a task_id, we need to poll for completion
                return await this.pollForImageCompletion(taskId);
            }

            console.log('❌ No task_id found in response structure');
            console.log('🔍 Response structure:', {
                hasData: !!response.data,
                hasNestedData: !!response.data?.data,
                nestedTaskId: response.data?.data?.task_id,
                directTaskId: response.data?.task_id
            });
            return null;
        } catch (error) {
            console.error('Error with full styling, trying simplified request:', error.response?.data || error.message);
            
            // Fallback: try with minimal styling on Classic Fast
            try {
                console.log('Attempting fallback with minimal styling...');
                const response = await axios.post(
                    `${this.baseUrl}/ai/text-to-image`,
                    {
                        prompt: prompt,
                        num_images: 1,
                        aspect_ratio: "widescreen_16_9",
                        styling: {
                            style: "digital-art"
                        },
                        person_generation: "dont_allow",
                        safety_settings: "block_medium_and_above"
                    },
                    {
                        headers: {
                            'x-freepik-api-key': this.apiKey,
                            'Content-Type': 'application/json'
                        },
                        timeout: 30000
                    }
                );

                const fallbackTaskId = response.data?.data?.task_id || response.data?.task_id;
                if (fallbackTaskId) {
                    console.log('🆔 Fallback Task ID received:', fallbackTaskId);
                    return await this.pollForImageCompletion(fallbackTaskId);
                }

                return null;
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError.response?.data || fallbackError.message);
                throw error; // Throw original error
            }
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
     * Test the Freepik API connection
     * @returns {Promise<boolean>} - True if API is working
     */
    async testConnection() {
        if (!this.apiKey) {
            return false;
        }

        try {
            const testImageUrl = await this.generateImage("Simple blue geometric abstract background, minimal design");
            return testImageUrl !== null;
        } catch (error) {
            console.error('Freepik API test failed:', error.message);
            return false;
        }
    }
}

module.exports = new FreepikService();