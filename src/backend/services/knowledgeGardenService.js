const { Client } = require("@notionhq/client");

// Initialize Notion client using the existing blog API key
const knowledgeGardenApiKey = process.env.NOTION_BLOG_API_KEY;
const knowledgeGardenDatabaseId = "1ffcfc520644805b8bb9c9207fb2cb31";

// Check if knowledge garden configuration is available
const isKnowledgeGardenConfigured = knowledgeGardenApiKey && knowledgeGardenDatabaseId;

const notion = isKnowledgeGardenConfigured ? new Client({ auth: knowledgeGardenApiKey }) : null;

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
        
        // Query for published references
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

        console.log(`📚 Found ${response.results.length} published references`);

        const references = response.results.map(page => {
            const properties = page.properties;
            
            // Extract basic information (using correct property names from database structure)
            const title = extractTextProperty(properties.Name);
            const author = extractTextProperty(properties.Author);
            const sourceType = extractSelectProperty(properties['Source Type']);
            const mainTheme = extractSelectProperty(properties['Main Theme']);
            const category = extractMultiSelectProperty(properties.Category);
            const topics = extractMultiSelectProperty(properties.Topics);
            const url = extractUrlProperty(properties['Drive URL']);
            const summary = extractTextProperty(properties['AI summary']);
            const bubbleBlogStatus = extractMultiSelectProperty(properties['Bubble Blog']);
            const status = extractSelectProperty(properties.Status);
            const date = extractDateProperty(properties.Date);
            
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
                lastEditedDate: page.last_edited_time
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

module.exports = {
    getPublishedReferences,
    getReferencesGroupedByTheme,
    exploreKnowledgeGardenStructure
};