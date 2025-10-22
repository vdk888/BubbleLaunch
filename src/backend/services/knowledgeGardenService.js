const { Client } = require("@notionhq/client");
const LLMEnrichmentService = require("./llmEnrichmentService");

// Initialize Notion client using the existing blog API key
const knowledgeGardenApiKey = process.env.NOTION_BLOG_API_KEY;
const knowledgeGardenDatabaseId = "1ffcfc520644805b8bb9c9207fb2cb31";

// Check if knowledge garden configuration is available
const isKnowledgeGardenConfigured = knowledgeGardenApiKey && knowledgeGardenDatabaseId;

const notion = isKnowledgeGardenConfigured ? new Client({ auth: knowledgeGardenApiKey }) : null;

// Initialize LLM enrichment service
const llmEnrichment = new LLMEnrichmentService();

/**
 * Fetches published references from the Knowledge Garden database
 * Filters for items tagged with both "bubble blog" and "published"
 */
async function getPublishedReferences() {
    if (!isKnowledgeGardenConfigured) {
        console.log('Knowledge Garden not configured - returning empty array');
        return [];
    }

    try {
        console.log('🌱 Fetching published references from Knowledge Garden...');
        
        // First, let's explore the database structure
        const database = await notion.databases.retrieve({ database_id: knowledgeGardenDatabaseId });
        console.log('📊 Database properties:', Object.keys(database.properties));
        
        // Query for published references (excluding archived pages)
        const response = await notion.databases.query({
            database_id: knowledgeGardenDatabaseId,
            filter: {
                and: [
                    {
                        property: 'Bubble Blog', // Correct property name from database structure
                        multi_select: {
                            contains: 'Published'
                        }
                    }
                ]
            },
            sorts: [
                {
                    property: 'Created', // Sort by creation date
                    direction: 'descending'
                }
            ]
        });

        // Filter out archived pages (Notion includes archived pages in query results by default)
        const activePages = response.results.filter(page => !page.archived);

        console.log(`📚 Found ${response.results.length} total references (${activePages.length} active, ${response.results.length - activePages.length} archived)`);

        const references = activePages.map(page => {
            const properties = page.properties;
            
            // Extract basic information (using correct property names from database structure)
            const title = extractTextProperty(properties.Name);
            const author = extractTextProperty(properties.Author);
            const sourceType = extractSelectProperty(properties['Source Type']);
            const mainTheme = extractSelectProperty(properties['Main Theme']);
            const category = extractMultiSelectProperty(properties.Category);
            const topics = extractMultiSelectProperty(properties.Topics);
            const url = extractUrlProperty(properties['Drive URL']);
            const summaryRaw = extractTextProperty(properties['AI summary']);
            const summary = normalizeSummary(summaryRaw);
            const bubbleBlogStatus = extractMultiSelectProperty(properties['Bubble Blog']);
            const status = extractSelectProperty(properties.Status);
            const date = extractDateProperty(properties.Date);
            const videoEmbedUrl = sourceType === 'Video' ? extractVideoEmbedUrl(url) : null;
            
            return {
                id: page.id,
                title: title || 'Untitled',
                author: author || 'Unknown Author',
                sourceType: sourceType || 'Book',
                mainTheme: mainTheme || 'General',
                category: category || [],
                topics: topics || [],
                url: url || null,
                summary: summary || '',
                bubbleBlogStatus: bubbleBlogStatus || [],
                status: status || 'Draft',
                date: date || null,
                createdDate: page.created_time,
                lastEditedDate: page.last_edited_time,
                isVideo: sourceType === 'Video',
                videoEmbedUrl
            };
        });

        return references;
    } catch (error) {
        console.error('❌ Error fetching published references:', error);
        
        // If it's an API error, let's explore what properties are actually available
        if (error.status === 400) {
            try {
                console.log('🔍 Exploring database structure...');
                const database = await notion.databases.retrieve({ database_id: knowledgeGardenDatabaseId });
                console.log('Available properties:', Object.keys(database.properties));
                console.log('Property details:', JSON.stringify(database.properties, null, 2));
            } catch (exploreError) {
                console.error('Failed to explore database:', exploreError);
            }
        }
        
        throw new Error('Failed to fetch knowledge garden references');
    }
}

/**
 * Fetches published references with LLM enrichment
 * Includes enhanced abstracts, purchase links, and type detection
 */
async function getEnrichedPublishedReferences() {
    try {
        console.log('🤖 Fetching and enriching published references...');
        
        // Get base references from Notion
        const baseReferences = await getPublishedReferences();
        
        if (baseReferences.length === 0) {
            return [];
        }

        // Check which references need enrichment
        const enrichmentCandidates = baseReferences.filter(ref => ['Book', 'Article'].includes(ref.sourceType));
        const needsEnrichment = enrichmentCandidates.filter(ref => llmEnrichment.needsEnrichment(ref));
        
        if (needsEnrichment.length > 0) {
            console.log(`📝 Found ${needsEnrichment.length} references needing enrichment`);
            
            // Enrich references that need it
            const enrichedRefs = await llmEnrichment.enrichReferences(needsEnrichment);
            
            // Create a map for quick lookup
            const enrichedMap = new Map();
            enrichedRefs.forEach(ref => {
                const key = `${ref.title}_${ref.author || 'no_author'}`;
                enrichedMap.set(key, ref);
            });
            
            // Merge enriched data with base references
            const finalReferences = baseReferences.map(ref => {
                const key = `${ref.title}_${ref.author || 'no_author'}`;
                return enrichedMap.get(key) || ref;
            });
            
            console.log(`✅ Enrichment complete: ${finalReferences.length} references ready`);
            return finalReferences;
        } else {
            console.log('✅ All references already enriched');
            return baseReferences;
        }
        
    } catch (error) {
        console.error('❌ Error in enriched references:', error);
        
        // Fallback to base references without enrichment
        console.log('🔄 Falling back to base references without enrichment');
        return await getPublishedReferences();
    }
}

/**
 * Get enriched references grouped by source type (Books/Articles)
 */
async function getEnrichedReferencesGroupedBySourceType() {
    try {
        const references = await getEnrichedPublishedReferences();
        
        const allowedTypes = new Set(['Book', 'Article', 'Video']);
        const groupedReferences = references.reduce((groups, reference) => {
            const sourceType = reference.sourceType || 'Unknown';
            
            if (!allowedTypes.has(sourceType)) {
                return groups;
            }
            
            if (!groups[sourceType]) {
                groups[sourceType] = [];
            }
            
            groups[sourceType].push(reference);
            return groups;
        }, {});

        // Convert to array format expected by frontend
        return Object.entries(groupedReferences).map(([sourceType, references]) => ({
            sourceType,
            count: references.length,
            references: references.sort((a, b) => {
                // Videos: sort by most recent date, fallback to title
                if (sourceType === 'Video') {
                    const dateA = new Date(a.date || a.createdDate || 0);
                    const dateB = new Date(b.date || b.createdDate || 0);
                    if (!isNaN(dateA) && !isNaN(dateB)) {
                        return dateB - dateA;
                    }
                }
                return (a.title || '').localeCompare(b.title || '');
            })
        }));
        
    } catch (error) {
        console.error('❌ Error grouping enriched references by source type:', error);
        throw new Error('Failed to group enriched references by source type');
    }
}

/**
 * Get references grouped by theme/category
 */
async function getReferencesGroupedByTheme() {
    try {
        const references = await getPublishedReferences();
        
        // Group by category
        const groupedReferences = references.reduce((groups, reference) => {
            // Handle multiple categories - create entry for each category
            const categories = reference.category.length > 0 ? reference.category : ['General'];
            
            categories.forEach(categoryName => {
                if (!groups[categoryName]) {
                    groups[categoryName] = [];
                }
                groups[categoryName].push(reference);
            });
            
            return groups;
        }, {});

        return groupedReferences;
    } catch (error) {
        console.error('Error grouping references by theme:', error);
        throw error;
    }
}

/**
 * Explore the database structure
 */
async function exploreKnowledgeGardenStructure() {
    if (!isKnowledgeGardenConfigured) {
        return { error: 'Knowledge Garden not configured' };
    }

    try {
        const database = await notion.databases.retrieve({ database_id: knowledgeGardenDatabaseId });
        
        const structure = {
            title: database.title[0]?.plain_text || 'Unknown',
            properties: {},
            propertyCount: Object.keys(database.properties).length
        };

        // Analyze each property
        Object.entries(database.properties).forEach(([name, property]) => {
            structure.properties[name] = {
                type: property.type,
                options: property.select?.options || property.multi_select?.options || null
            };
        });

        return structure;
    } catch (error) {
        console.error('Error exploring database structure:', error);
        return { error: error.message };
    }
}

// Helper functions to extract different property types
function extractTextProperty(property) {
    if (!property) return null;
    
    if (property.title && Array.isArray(property.title)) {
        return property.title.map(block => block.plain_text || '').join('');
    }
    if (property.rich_text && Array.isArray(property.rich_text)) {
        return property.rich_text.map(block => block.plain_text || '').join('');
    }
    return null;
}

function extractSelectProperty(property) {
    if (!property) return null;
    return property.select?.name || null;
}

function extractMultiSelectProperty(property) {
    if (!property) return [];
    return property.multi_select?.map(item => item.name) || [];
}

function extractUrlProperty(property) {
    if (!property) return null;
    return property.url || null;
}

function extractDateProperty(property) {
    if (!property) return null;
    return property.date?.start || null;
}

function normalizeSummary(summary) {
    if (!summary) return '';
    const trimmed = summary.trim();
    if (trimmed.toLowerCase() === 'no content') {
        return '';
    }
    return trimmed;
}

function extractVideoEmbedUrl(url) {
    if (!url) return null;

    try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();

        if (host.includes('youtube.com')) {
            if (parsed.pathname === '/watch' && parsed.searchParams.has('v')) {
                const videoId = parsed.searchParams.get('v');
                return `https://www.youtube.com/embed/${videoId}`;
            }

            if (parsed.pathname.startsWith('/embed/')) {
                const parts = parsed.pathname.split('/');
                const videoId = parts[2];
                return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
            }
        }

        if (host === 'youtu.be') {
            const videoId = parsed.pathname.replace('/', '');
            if (videoId) {
                return `https://www.youtube.com/embed/${videoId}`;
            }
        }

        return null;
    } catch (error) {
        console.warn('Failed to parse video URL for embed:', error.message);
        return null;
    }
}

module.exports = {
    getPublishedReferences,
    getReferencesGroupedByTheme,
    exploreKnowledgeGardenStructure,
    getEnrichedPublishedReferences,
    getEnrichedReferencesGroupedBySourceType,
    clearEnrichmentCache: () => llmEnrichment.clearCache()
};
