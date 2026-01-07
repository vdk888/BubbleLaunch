const { Client } = require("@notionhq/client");
const fs = require("fs");
const path = require("path");

// Initialize Notion client using the existing blog API key
const knowledgeGardenApiKey = process.env.NOTION_BLOG_API_KEY;
const knowledgeGardenDatabaseId = process.env.NOTION_KNOWLEDGE_GARDEN_DATABASE_ID;

// Cache configuration
const CACHE_FILE = path.join(__dirname, "../cache/knowledge-garden-cache.json");
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Check if knowledge garden configuration is available
const isKnowledgeGardenConfigured = knowledgeGardenApiKey && knowledgeGardenDatabaseId;

const notion = isKnowledgeGardenConfigured ? new Client({ auth: knowledgeGardenApiKey }) : null;

/**
 * Get references from local cache if valid
 */
function getReferencesFromCache() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const cacheData = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
            const now = new Date().getTime();
            
            // Check if cache is still valid
            if (now - cacheData.timestamp < CACHE_TTL) {
                console.log("✅ Serving knowledge garden references from cache");
                return cacheData.data;
            } else {
                console.log("⚠️ Knowledge garden cache expired");
            }
        }
    } catch (error) {
        console.error("Error reading knowledge garden cache:", error);
    }
    return null;
}

/**
 * Save references to local cache
 */
function saveReferencesToCache(data) {
    try {
        // Ensure cache directory exists
        const cacheDir = path.dirname(CACHE_FILE);
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }

        const cacheData = {
            timestamp: new Date().getTime(),
            data: data
        };
        
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2));
        console.log("💾 Knowledge garden references saved to cache");
    } catch (error) {
        console.error("Error saving knowledge garden cache:", error);
    }
}

/**
 * Fetches published references from the Knowledge Garden database
 * Filters for items tagged with both "bubble blog" and "published"
 */
async function getPublishedReferences() {
    // Try to get from cache first
    const cachedReferences = getReferencesFromCache();
    if (cachedReferences) {
        return cachedReferences;
    }

    if (!isKnowledgeGardenConfigured) {
        console.log("Knowledge Garden not configured - returning empty array");
        return [];
    }

    try {
        console.log("🌱 Fetching published references from Knowledge Garden...");
        
        // First, let"s explore the database structure
        // const database = await notion.databases.retrieve({ database_id: knowledgeGardenDatabaseId });
        // console.log("📊 Database properties:", Object.keys(database.properties));
        
        // Query for published references (excluding archived pages)
        const response = await notion.databases.query({
            database_id: knowledgeGardenDatabaseId,
            filter: {
                and: [
                    {
                        property: "Bubble Blog", // Correct property name from database structure
                        multi_select: {
                            contains: "Published"
                        }
                    }
                ]
            },
            sorts: [
                {
                    property: "Created", // Sort by creation date
                    direction: "descending"
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
            const sourceType = extractSelectProperty(properties["Source Type"]);
            const mainTheme = extractSelectProperty(properties["Main Theme"]);
            const category = extractMultiSelectProperty(properties.Category);
            const topics = extractMultiSelectProperty(properties.Topics);
            const url = extractUrlProperty(properties["URL"]);

            // Extract bilingual summaries from Notion properties
            const summaryEnRaw = extractTextProperty(properties["AI summary"]);
            const summaryFrRaw = extractTextProperty(properties["FR Summary"]);
            const summary_en = normalizeSummary(summaryEnRaw);
            const summary_fr = normalizeSummary(summaryFrRaw);

            const bubbleBlogStatus = extractMultiSelectProperty(properties["Bubble Blog"]);
            const status = extractSelectProperty(properties.Status);
            const date = extractDateProperty(properties.Date);
            const videoEmbedUrl = sourceType === "Video" ? extractVideoEmbedUrl(url) : null;

            // Generate search links (no LLM needed)
            const searchLinks = generateSearchLinks(title, author, sourceType);

            return {
                id: page.id,
                title: title || "Untitled",
                author: author || "Unknown Author",
                sourceType: sourceType || "Book",
                mainTheme: mainTheme || "General",
                category: category || [],
                topics: topics || [],
                url: url || null,
                summary: summary_en || summary_fr || "", // Keep for backward compatibility
                summary_en: summary_en || "",
                summary_fr: summary_fr || "",
                bubbleBlogStatus: bubbleBlogStatus || [],
                status: status || "Draft",
                date: date || null,
                createdDate: page.created_time,
                lastEditedDate: page.last_edited_time,
                isVideo: sourceType === "Video",
                videoEmbedUrl,
                legalLinks: searchLinks
            };
        });

        // Save to cache
        saveReferencesToCache(references);

        return references;
    } catch (error) {
        console.error("❌ Error fetching published references:", error);
        
        // If it"s an API error, let"s explore what properties are actually available
        if (error.status === 400) {
            try {
                console.log("🔍 Exploring database structure...");
                const database = await notion.databases.retrieve({ database_id: knowledgeGardenDatabaseId });
                console.log("Available properties:", Object.keys(database.properties));
                console.log("Property details:", JSON.stringify(database.properties, null, 2));
            } catch (exploreError) {
                console.error("Failed to explore database:", exploreError);
            }
        }
        
        throw new Error("Failed to fetch knowledge garden references");
    }
}

/**
 * Get references grouped by source type (Books/Articles/Videos)
 */
async function getReferencesGroupedBySourceType() {
    try {
        const references = await getPublishedReferences();

        const allowedTypes = new Set(["Book", "Article", "Video"]);
        const groupedReferences = references.reduce((groups, reference) => {
            const sourceType = reference.sourceType || "Unknown";

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
                if (sourceType === "Video") {
                    const dateA = new Date(a.date || a.createdDate || 0);
                    const dateB = new Date(b.date || b.createdDate || 0);
                    if (!isNaN(dateA) && !isNaN(dateB)) {
                        return dateB - dateA;
                    }
                }
                return (a.title || "").localeCompare(b.title || "");
            })
        }));

    } catch (error) {
        console.error("❌ Error grouping references by source type:", error);
        throw new Error("Failed to group references by source type");
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
            const categories = reference.category.length > 0 ? reference.category : ["General"];
            
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
        console.error("Error grouping references by theme:", error);
        throw error;
    }
}

/**
 * Explore the database structure
 */
async function exploreKnowledgeGardenStructure() {
    if (!isKnowledgeGardenConfigured) {
        return { error: "Knowledge Garden not configured" };
    }

    try {
        const database = await notion.databases.retrieve({ database_id: knowledgeGardenDatabaseId });
        
        const structure = {
            title: database.title[0]?.plain_text || "Unknown",
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
        console.error("Error exploring database structure:", error);
        return { error: error.message };
    }
}

/**
 * Generate search links for a reference (no LLM needed)
 */
function generateSearchLinks(title, author, sourceType) {
    const searchQuery = `${title}${author && author !== "Unknown Author" ? " " + author : ""}`.trim();
    const encodedQuery = encodeURIComponent(searchQuery);

    const links = {
        // Universal search links
        googleScholar: `https://scholar.google.com/scholar?q=${encodedQuery}`,
        openLibrary: `https://openlibrary.org/search?q=${encodedQuery.replace(/%20/g, "+")}`,
    };

    // Add source-specific links
    if (sourceType === "Book") {
        links.amazon = `https://www.amazon.com/s?k=${encodedQuery}`;
        links.goodreads = `https://www.goodreads.com/search?q=${encodedQuery}`;
        links.bookshop = `https://bookshop.org/search?q=${encodedQuery}`;
    } else if (sourceType === "Article" || sourceType === "Paper") {
        // For articles, prioritize Google Scholar
        links.journal = null; // Will use URL from Notion if available
    }

    return links;
}

// Helper functions to extract different property types
function extractTextProperty(property) {
    if (!property) return null;
    
    if (property.title && Array.isArray(property.title)) {
        return property.title.map(block => block.plain_text || "").join("");
    }
    if (property.rich_text && Array.isArray(property.rich_text)) {
        return property.rich_text.map(block => block.plain_text || "").join("");
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
    if (!summary) return "";
    const trimmed = summary.trim();
    if (trimmed.toLowerCase() === "no content") {
        return "";
    }
    return trimmed;
}

function extractVideoEmbedUrl(url) {
    if (!url) return null;

    try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();

        // Handle standard youtube.com
        if (host.includes("youtube.com") || host.includes("m.youtube.com")) {
            // Standard watch URL: /watch?v=VIDEO_ID
            if (parsed.pathname === "/watch" && parsed.searchParams.has("v")) {
                const videoId = parsed.searchParams.get("v");
                return `https://www.youtube.com/embed/${videoId}`;
            }

            // Embed URL: /embed/VIDEO_ID
            if (parsed.pathname.startsWith("/embed/")) {
                const parts = parsed.pathname.split("/");
                // parts[0] is "", parts[1] is "embed", parts[2] is VIDEO_ID
                const videoId = parts[2];
                return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
            }
            
            // Short URL within youtube.com: /v/VIDEO_ID
            if (parsed.pathname.startsWith("/v/")) {
                const parts = parsed.pathname.split("/");
                const videoId = parts[2];
                return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
            }
        }

        // Handle short youtu.be
        if (host === "youtu.be" || host === "www.youtu.be") {
            const videoId = parsed.pathname.replace("/", "");
            if (videoId) {
                return `https://www.youtube.com/embed/${videoId}`;
            }
        }

        return null;
    } catch (error) {
        console.warn("Failed to parse video URL for embed:", error.message);
        return null;
    }
}

module.exports = {
    getPublishedReferences,
    getReferencesGroupedBySourceType,
    getReferencesGroupedByTheme,
    exploreKnowledgeGardenStructure
};