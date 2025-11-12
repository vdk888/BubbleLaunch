const axios = require('axios');

/**
 * LLM Enrichment Service for Knowledge Garden References
 * 
 * This service automatically enriches references with:
 * - Reference type detection (book vs article)
 * - Purchase/access links (Amazon, publisher, DOI, etc.)
 * - Uses existing Notion AI summaries (cost-efficient)
 * - Legal compliance (no copyrighted PDFs)
 */
class LLMEnrichmentService {
    constructor() {
        this.openRouterApiKey = process.env.OPENROUTER_API_KEY;
        this.openRouterBaseUrl = 'https://openrouter.ai/api/v1';
        
        // Cache for enriched data to avoid re-processing
        this.enrichmentCache = new Map();
        
        // Model preferences (cheapest to most expensive)
        this.models = [
            'openai/gpt-4o-mini',      // Cheapest, good for most tasks
            'openai/gpt-4o',           // Fallback for complex cases
            'anthropic/claude-3-haiku' // Alternative fallback
        ];
    }

    /**
     * Enrich a single reference with LLM-generated metadata
     */
    async enrichReference(reference) {
        try {
            // Check cache first
            const cacheKey = this.getCacheKey(reference);
            if (this.enrichmentCache.has(cacheKey)) {
                console.log(`Cache hit for: ${reference.title}`);
                return { ...reference, ...this.enrichmentCache.get(cacheKey) };
            }

            console.log(`Enriching reference: ${reference.title}`);

            // Prepare the prompt for the LLM
            const prompt = this.buildEnrichmentPrompt(reference);

            // Try models in order of preference (cheapest first)
            let enrichedData = null;
            for (const model of this.models) {
                try {
                    enrichedData = await this.callLLM(prompt, model);
                    // Validate and enhance the enriched data
                    enrichedData = this.validateAndEnhanceLinks(enrichedData, reference);
                    break; // Success, exit loop
                } catch (error) {
                    console.warn(`Model ${model} failed, trying next:`, error.message);
                    continue;
                }
            }

            if (!enrichedData) {
                throw new Error('All LLM models failed');
            }

            // Use existing Notion AI summary instead of generating new one
            const finalEnrichedData = {
                ...enrichedData,
                enhancedAbstract: reference.summary || 'No summary available'
            };

            // Cache the result
            this.enrichmentCache.set(cacheKey, finalEnrichedData);

            // Return the enriched reference
            return { ...reference, ...finalEnrichedData };

        } catch (error) {
            console.error(`Failed to enrich reference "${reference.title}":`, error);
            // Return original reference with minimal enrichment on failure
            return {
                ...reference,
                enriched: false,
                enrichmentError: error.message,
                referenceType: this.guessTypeFromTitle(reference.title),
                enhancedAbstract: reference.summary || 'No summary available',
                legalLinks: {
                    search: `https://www.google.com/search?q=${encodeURIComponent(reference.title + ' ' + (reference.author || ''))}`
                }
            };
        }
    }

    /**
     * Validate and enhance links to ensure they're usable
     * Adds fallback links if primary links are missing or invalid
     */
    validateAndEnhanceLinks(enrichedData, reference) {
        const sourceType = (enrichedData.referenceType || '').toLowerCase();
        const title = reference.title;
        const author = reference.author;

        // Ensure legalLinks object exists
        if (!enrichedData.legalLinks) {
            enrichedData.legalLinks = {};
        }

        // For books: ensure at least one usable link
        if (sourceType === 'book') {
            // Validate Amazon link - remove if it's a placeholder or invalid
            if (enrichedData.legalLinks.amazon) {
                if (!this.isValidAmazonLink(enrichedData.legalLinks.amazon)) {
                    console.log(`⚠️ Invalid Amazon link for "${title}": ${enrichedData.legalLinks.amazon}`);
                    enrichedData.legalLinks.amazon = null;
                }
            }

            // Generate fallback links for missing primary sources
            const searchQuery = `${title}${author ? ' ' + author : ''}`;

            // Generate Open Library link (always free, never returns null)
            if (!enrichedData.legalLinks.open_library) {
                enrichedData.legalLinks.open_library = `https://openlibrary.org/search?q=${encodeURIComponent(searchQuery).replace(/%20/g, '+')}`;
                console.log(`✅ Generated Open Library link for: ${title}`);
            }

            // Generate Goodreads link if not present
            if (!enrichedData.legalLinks.goodreads) {
                enrichedData.legalLinks.goodreads = `https://www.goodreads.com/search?q=${encodeURIComponent(searchQuery)}`;
                console.log(`✅ Generated Goodreads link for: ${title}`);
            }

            // Generate Bookshop.org link if not present (supports independent bookstores)
            if (!enrichedData.legalLinks.bookshop) {
                enrichedData.legalLinks.bookshop = `https://bookshop.org/search?q=${encodeURIComponent(searchQuery)}`;
                console.log(`✅ Generated Bookshop.org link for: ${title}`);
            }

            // Generate Google Books link if not present
            if (!enrichedData.legalLinks.google_books) {
                enrichedData.legalLinks.google_books = `https://books.google.com/books?q=${encodeURIComponent(searchQuery)}`;
                console.log(`✅ Generated Google Books link for: ${title}`);
            }
        }

        // For articles: ensure at least one usable link
        if (sourceType === 'article' || sourceType === 'paper') {
            // If no links available, generate a Google Scholar fallback
            if (!enrichedData.legalLinks.doi_link && !enrichedData.legalLinks.journal &&
                !enrichedData.legalLinks.publisher && !enrichedData.legalLinks.author_page) {
                const searchQuery = `${title}${reference.author ? ' ' + reference.author : ''}`;
                enrichedData.legalLinks.doi_link = `https://scholar.google.com/scholar?q=${encodeURIComponent(searchQuery)}`;
                console.log(`✅ Generated Google Scholar link for: ${title}`);
            }
        }

        return enrichedData;
    }

    /**
     * Check if an Amazon link is valid (not a placeholder or invalid ASIN)
     */
    isValidAmazonLink(amazonUrl) {
        if (!amazonUrl || typeof amazonUrl !== 'string') return false;

        // Check for placeholder patterns
        if (amazonUrl.includes('/dp/ASIN') || amazonUrl.includes('dp/ASIN')) return false;
        if (amazonUrl.includes('ASIN') && amazonUrl.length < 30) return false;

        // Check if it has a valid ASIN (10 alphanumeric characters after /dp/)
        const asinMatch = amazonUrl.match(/\/dp\/([A-Z0-9]{10})/);
        if (!asinMatch) return false;

        // Validate the ASIN format
        const asin = asinMatch[1];
        return asin && asin !== 'ASIN' && asin.length === 10;
    }

    /**
     * Build the LLM prompt for enriching a reference
     */
    buildEnrichmentPrompt(reference) {
        return `You are a research assistant helping to enrich academic and investment literature references with metadata and legal access links.

Given this reference:
- Title: "${reference.title}"
- Author: "${reference.author || 'Unknown'}"
- Current URL: "${reference.url || 'None'}"
- Existing Summary: "${reference.summary || 'None'}"
- Categories: ${JSON.stringify(reference.categories || [])}

Please provide enrichment data in the following JSON format:

{
  "referenceType": "book" | "article" | "paper" | "report" | "website",
  "isbn": "ISBN number if book (13 digits), null otherwise",
  "doi": "DOI if academic paper, null otherwise",
  "legalLinks": {
    "amazon": "Amazon purchase link if book",
    "open_library": "Open Library link (https://openlibrary.org/search?q=TITLE+AUTHOR)",
    "goodreads": "Goodreads book page link",
    "bookshop": "Bookshop.org indie bookstore link (https://bookshop.org/search?q=TITLE+AUTHOR)",
    "publisher": "Publisher official link",
    "journal": "Journal/publication link if article",
    "doi_link": "DOI resolver link if available (https://doi.org/XXXX)",
    "google_books": "Google Books preview link",
    "worldcat": "WorldCat library link",
    "author_page": "Author's official page or academia.edu"
  },
  "keyInsights": ["insight1", "insight2", "insight3"],
  "publicationYear": "YYYY if known",
  "publisher": "Publisher name",
  "isAccessible": true/false,
  "accessibilityNote": "Why this reference is/isn't freely accessible",
  "enriched": true
}

CRITICAL RULES FOR BOOKS:
1. PRIORITY 1 (Main Link): Amazon link in format https://www.amazon.com/dp/ASIN or https://www.amazon.com/TITLE/dp/ASIN
2. PRIORITY 2 (Free/Cheap): Open Library link (always free) - format: https://openlibrary.org/search?q=TITLE+AUTHOR
3. PRIORITY 3: Goodreads link to show book info
4. PRIORITY 4: Bookshop.org link supporting independent bookstores
5. PRIORITY 5: Publisher official site
6. PRIORITY 6: Google Books preview
7. DO NOT return null for all links - ALWAYS provide at least Open Library or Goodreads link
8. Never suggest sharing copyrighted PDFs or Google Drive links
9. For articles: prioritize journal links, DOI links, actual article URLs, author pages
10. Do NOT generate a new summary - we will use the existing Notion AI summary

EXAMPLE LINKS:
- Open Library: https://openlibrary.org/search?q=Freakonomics+Steven+Levitt
- Goodreads: https://www.goodreads.com/search?q=Freakonomics
- Bookshop.org: https://bookshop.org/search?q=Freakonomics
- Amazon: https://www.amazon.com/Freakonomics-Economics-Unexpected-Truths-About/dp/0060731338

Respond only with the JSON object, no additional text.`;
    }

    /**
     * Call the LLM API with retry logic
     */
    async callLLM(prompt, model, maxRetries = 2) {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const response = await axios.post(
                    `${this.openRouterBaseUrl}/chat/completions`,
                    {
                        model: model,
                        messages: [
                            {
                                role: 'user',
                                content: prompt
                            }
                        ],
                        temperature: 0.1,
                        max_tokens: 500
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${this.openRouterApiKey}`,
                            'Content-Type': 'application/json',
                            'X-Title': 'Bubble Knowledge Garden Enrichment'
                        },
                        timeout: 30000
                    }
                );

                const content = response.data.choices[0].message.content.trim();
                
                // Parse JSON response
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    throw new Error('No JSON found in LLM response');
                }

                const enrichedData = JSON.parse(jsonMatch[0]);
                
                // Validate required fields
                if (!enrichedData.referenceType) {
                    throw new Error('Missing referenceType in LLM response');
                }

                return enrichedData;

            } catch (error) {
                if (attempt === maxRetries) {
                    throw error;
                }
                console.warn(`LLM attempt ${attempt + 1} failed, retrying:`, error.message);
                await this.sleep(1000 * (attempt + 1)); // Exponential backoff
            }
        }
    }

    /**
     * Enrich multiple references in batch
     */
    async enrichReferences(references) {
        console.log(`Starting batch enrichment of ${references.length} references`);
        
        const enrichedReferences = [];
        const batchSize = 3; // Process 3 at a time to avoid rate limits
        
        for (let i = 0; i < references.length; i += batchSize) {
            const batch = references.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(references.length/batchSize)}`);
            
            const batchPromises = batch.map(ref => this.enrichReference(ref));
            const batchResults = await Promise.allSettled(batchPromises);
            
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    console.log(`✅ Successfully enriched: ${batch[index].title}`);
                    console.log(`📄 Legal links generated:`, result.value.legalLinks);
                    enrichedReferences.push(result.value);
                } else {
                    console.error(`❌ Failed to enrich reference ${batch[index].title}:`, result.reason);
                    enrichedReferences.push(batch[index]); // Add original on failure
                }
            });

            // Small delay between batches
            if (i + batchSize < references.length) {
                await this.sleep(2000);
            }
        }

        console.log(`Batch enrichment completed: ${enrichedReferences.length} references processed`);
        return enrichedReferences;
    }

    /**
     * Check which references need enrichment
     */
    needsEnrichment(reference) {
        // Check if already enriched
        if (reference.enriched === true) {
            return false;
        }

        // Check if basic metadata is missing
        return !reference.referenceType || 
               !reference.legalLinks || 
               !reference.enhancedAbstract;
    }

    /**
     * Simple type guessing fallback
     */
    guessTypeFromTitle(title) {
        const titleLower = title.toLowerCase();
        
        if (titleLower.includes('journal') || 
            titleLower.includes('paper') || 
            titleLower.includes('study') ||
            titleLower.includes('research')) {
            return 'article';
        }
        
        if (titleLower.includes('book') || 
            titleLower.includes('guide') ||
            titleLower.includes('manual')) {
            return 'book';
        }
        
        return 'unknown';
    }

    /**
     * Generate cache key for a reference
     */
    getCacheKey(reference) {
        return `${reference.title}_${reference.author || 'no_author'}`.replace(/[^a-zA-Z0-9_]/g, '_');
    }

    /**
     * Utility sleep function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clear enrichment cache (useful for testing)
     */
    clearCache() {
        this.enrichmentCache.clear();
        console.log('Enrichment cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.enrichmentCache.size,
            keys: Array.from(this.enrichmentCache.keys())
        };
    }
}

module.exports = LLMEnrichmentService;