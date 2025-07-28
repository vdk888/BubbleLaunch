const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");
const { marked } = require("marked");

// Initialize Notion client
const blogApiKey = process.env.NOTION_BLOG_API_KEY;
const blogDatabaseId = process.env.NOTION_BLOG_DATABASE_ID;

// Check if blog configuration is available
const isBlogConfigured = blogApiKey && blogDatabaseId;

const notion = isBlogConfigured ? new Client({ auth: blogApiKey }) : null;

// Initialize NotionToMarkdown
const n2m = isBlogConfigured ? new NotionToMarkdown({ notionClient: notion }) : null;

/**
 * Returns sample posts when Notion is not configured
 */
function getSamplePosts() {
    return [];
}

/**
 * Format plain text content with basic HTML formatting
 */
function formatPlainTextContent(content) {
    if (!content) return '';
    
    return content
        // Convert double line breaks to paragraphs
        .split('\n\n')
        .map(paragraph => {
            if (!paragraph.trim()) return '';
            
            // Format bold text (between ** or __)
            paragraph = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            paragraph = paragraph.replace(/__(.*?)__/g, '<strong>$1</strong>');
            
            // Format italic text (between * or _)
            paragraph = paragraph.replace(/\*(.*?)\*/g, '<em>$1</em>');
            paragraph = paragraph.replace(/_(.*?)_/g, '<em>$1</em>');
            
            // Check if it's a heading (starts with #)
            if (paragraph.startsWith('# ')) {
                return `<h1>${paragraph.substring(2)}</h1>`;
            } else if (paragraph.startsWith('## ')) {
                return `<h2>${paragraph.substring(3)}</h2>`;
            } else if (paragraph.startsWith('### ')) {
                return `<h3>${paragraph.substring(4)}</h3>`;
            } else if (paragraph.startsWith('#### ')) {
                return `<h4>${paragraph.substring(5)}</h4>`;
            }
            
            // Regular paragraph
            return `<p>${paragraph.replace(/\n/g, '<br>')}</p>`;
        })
        .filter(p => p)
        .join('\n');
}

/**
 * Fetches published blog posts from the Notion database.
 */
async function getPublishedPosts() {
    if (!isBlogConfigured) {
        console.log('Blog not configured - returning sample posts');
        return getSamplePosts();
    }

    try {
        const response = await notion.databases.query({
            database_id: blogDatabaseId,
            filter: {
                or: [
                    {
                        property: 'Status',
                        select: {
                            equals: 'Published',
                        },
                    },
                    {
                        and: [
                            {
                                property: 'Status',
                                select: {
                                    equals: 'Scheduled',
                                },
                            },
                            {
                                property: 'Publication Date',
                                date: {
                                    on_or_before: new Date().toISOString(),
                                },
                            },
                        ],
                    },
                ],
            },
            sorts: [
                {
                    property: 'Publication Date',
                    direction: 'descending',
                },
            ],
        });

        const posts = response.results.map(page => {
            const properties = page.properties;
            
            // Extract bilingual titles using correct property names
            const titleFRProperty = properties['Title FR'];
            
            let titleFR = 'Untitled';
            // Title FR is a title property, not rich_text
            if (titleFRProperty?.title && Array.isArray(titleFRProperty.title)) {
                titleFR = titleFRProperty.title.map(block => block.plain_text || block.text?.content || '').join('');
            }
            if (!titleFR || titleFR === '') {
                titleFR = 'Untitled';
            }
            
            const titleENProperty = properties['Title EN'];
            let titleEN = '';
            if (titleENProperty?.rich_text && Array.isArray(titleENProperty.rich_text)) {
                titleEN = titleENProperty.rich_text.map(block => block.text?.content || block.plain_text || '').join('');
            }
            if (!titleEN) titleEN = titleFR;
            
            // Generate slug from French title (primary)
            const slug = titleFR.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            
            // Extract bilingual summaries using correct property names
            const summaryFRProperty = properties['Content Summary FR'];
            let summaryFR = '';
            if (summaryFRProperty?.rich_text && Array.isArray(summaryFRProperty.rich_text)) {
                summaryFR = summaryFRProperty.rich_text.map(block => block.text?.content || block.plain_text || '').join('');
            }
            
            const summaryENProperty = properties['Content Summary EN'];
            let summaryEN = '';
            if (summaryENProperty?.rich_text && Array.isArray(summaryENProperty.rich_text)) {
                summaryEN = summaryENProperty.rich_text.map(block => block.text?.content || block.plain_text || '').join('');
            }
            if (!summaryEN) summaryEN = summaryFR;
            
            // Extract published date from Publication Date
            const publishedDateProperty = properties['Publication Date'];
            const publishedDate = publishedDateProperty?.date?.start || null;
            
            // No Featured Image property in database
            const featuredImage = null;

            // Extract status
            const statusProperty = properties.Status;
            const status = statusProperty?.select?.name || 'Draft';
            
            // Extract tags
            const tagsProperty = properties['Topic Tags'];
            const tags = tagsProperty?.multi_select?.map(tag => tag.name) || [];

            return {
                id: page.id,
                title: {
                    fr: titleFR,
                    en: titleEN
                },
                slug,
                summary: {
                    fr: summaryFR,
                    en: summaryEN
                },
                publishedDate,
                featuredImage,
                status,
                tags,
                url: `/blog/${slug}`
            };
        });

        return posts;
    } catch (error) {
        console.error('Error fetching published posts:', error);
        throw new Error('Failed to fetch blog posts');
    }
}

/**
 * Fetches a single post by slug
 */
async function getPostBySlug(slug) {
    if (!isBlogConfigured) {
        return null;
    }

    try {
        // Since we don't have a Slug property, we need to get all published posts
        // and find the one whose generated slug matches the requested slug
        const response = await notion.databases.query({
            database_id: blogDatabaseId,
            filter: {
                or: [
                    {
                        property: 'Status',
                        select: {
                            equals: 'Published',
                        },
                    },
                    {
                        and: [
                            {
                                property: 'Status',
                                select: {
                                    equals: 'Scheduled',
                                },
                            },
                            {
                                property: 'Publication Date',
                                date: {
                                    on_or_before: new Date().toISOString(),
                                },
                            },
                        ],
                    },
                ],
            },
        });

        if (response.results.length === 0) {
            return null;
        }

        // Find the post whose generated slug matches the requested slug
        let matchingPage = null;
        for (const page of response.results) {
            const titleFRProperty = page.properties['Title FR'];
            let title = 'Untitled';
            // Title FR is a title property, not rich_text
            if (titleFRProperty?.title && Array.isArray(titleFRProperty.title)) {
                title = titleFRProperty.title.map(block => block.plain_text || block.text?.content || '').join('');
            }
            const generatedSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            
            if (generatedSlug === slug) {
                matchingPage = page;
                break;
            }
        }

        if (!matchingPage) {
            return null;
        }

        const properties = matchingPage.properties;
        
        // Extract bilingual titles using correct property names
        const titleFRProperty = properties['Title FR'];
        let titleFR = 'Untitled';
        // Title FR is a title property, not rich_text
        if (titleFRProperty?.title && Array.isArray(titleFRProperty.title)) {
            titleFR = titleFRProperty.title.map(block => block.plain_text || block.text?.content || '').join('');
        }
        if (!titleFR || titleFR === '') {
            titleFR = 'Untitled';
        }
        
        const titleENProperty = properties['Title EN'];
        let titleEN = '';
        if (titleENProperty?.rich_text && Array.isArray(titleENProperty.rich_text)) {
            titleEN = titleENProperty.rich_text.map(block => block.text?.content || block.plain_text || '').join('');
        }
        if (!titleEN) titleEN = titleFR;
        
        // Extract bilingual summaries using correct property names
        const summaryFRProperty = properties['Content Summary FR'];
        let summaryFR = '';
        if (summaryFRProperty?.rich_text && Array.isArray(summaryFRProperty.rich_text)) {
            summaryFR = summaryFRProperty.rich_text.map(block => block.text?.content || block.plain_text || '').join('');
        }
        
        const summaryENProperty = properties['Content Summary EN'];
        let summaryEN = '';
        if (summaryENProperty?.rich_text && Array.isArray(summaryENProperty.rich_text)) {
            summaryEN = summaryENProperty.rich_text.map(block => block.text?.content || block.plain_text || '').join('');
        }
        if (!summaryEN) summaryEN = summaryFR;
        
        // Extract published date from Publication Date
        const publishedDateProperty = properties['Publication Date'];
        const publishedDate = publishedDateProperty?.date?.start || null;
        
        // No Featured Image property in database
        const featuredImage = null;

        // Extract status
        const statusProperty = properties.Status;
        const status = statusProperty?.select?.name || 'Draft';
        
        // Extract tags
        const tagsProperty = properties['Topic Tags'];
        const tags = tagsProperty?.multi_select?.map(tag => tag.name) || [];

        // Extract bilingual content (concatenate all rich text blocks)
        const contentFRProperty = properties['Content FR'];
        const contentFR = contentFRProperty?.rich_text?.map(block => block.text?.content || '').join('') || '';
        
        const contentENProperty = properties['Content EN'];
        const contentEN = contentENProperty?.rich_text?.map(block => block.text?.content || '').join('') || contentFR;

        // Get the page content and convert to markdown (fallback if Content FR/EN are empty)
        let markdownContentFR = contentFR;
        let markdownContentEN = contentEN;
        
        // If Content FR/EN properties are empty, extract from Notion page content
        if (!contentFR && !contentEN) {
            const mdBlocks = await n2m.pageToMarkdown(matchingPage.id);
            const markdownContent = n2m.toMarkdownString(mdBlocks);
            markdownContentFR = markdownContent.parent;
            markdownContentEN = markdownContent.parent; // Fallback to same content
        }
        
        // Convert markdown to HTML for both languages
        // Apply basic formatting to plain text content
        const htmlContentFR = contentFR ? formatPlainTextContent(markdownContentFR) : marked(markdownContentFR);
        const htmlContentEN = contentEN ? formatPlainTextContent(markdownContentEN) : marked(markdownContentEN);

        return {
            id: matchingPage.id,
            title: {
                fr: titleFR,
                en: titleEN
            },
            slug,
            summary: {
                fr: summaryFR,
                en: summaryEN
            },
            content: {
                fr: htmlContentFR,
                en: htmlContentEN
            },
            publishedDate,
            featuredImage,
            status,
            tags,
            url: `/blog/${slug}`
        };
    } catch (error) {
        console.error('Error fetching post by slug:', error);
        throw new Error('Failed to fetch blog post');
    }
}

module.exports = {
    getPublishedPosts,
    getPostBySlug
};