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
                property: 'Status',
                select: {
                    equals: 'Published',
                },
            },
            sorts: [
                {
                    property: 'Published Date',
                    direction: 'descending',
                },
            ],
        });

        const posts = response.results.map(page => {
            const properties = page.properties;
            
            // Extract title
            const titleProperty = properties.Title || properties.Name;
            const title = titleProperty?.title?.[0]?.text?.content || 'Untitled';
            
            // Extract slug
            const slugProperty = properties.Slug;
            const slug = slugProperty?.rich_text?.[0]?.text?.content || title.toLowerCase().replace(/\s+/g, '-');
            
            // Extract summary
            const summaryProperty = properties.Summary;
            const summary = summaryProperty?.rich_text?.[0]?.text?.content || '';
            
            // Extract published date
            const publishedDateProperty = properties['Published Date'];
            const publishedDate = publishedDateProperty?.date?.start || null;
            
            // Extract featured image
            const imageProperty = properties['Featured Image'];
            const featuredImage = imageProperty?.files?.[0]?.file?.url || imageProperty?.files?.[0]?.external?.url || null;

            return {
                id: page.id,
                title,
                slug,
                summary,
                publishedDate,
                featuredImage,
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
        const response = await notion.databases.query({
            database_id: blogDatabaseId,
            filter: {
                and: [
                    {
                        property: 'Status',
                        select: {
                            equals: 'Published',
                        },
                    },
                    {
                        property: 'Slug',
                        rich_text: {
                            equals: slug,
                        },
                    },
                ],
            },
        });

        if (response.results.length === 0) {
            return null;
        }

        const page = response.results[0];
        const properties = page.properties;
        
        // Extract basic info
        const titleProperty = properties.Title || properties.Name;
        const title = titleProperty?.title?.[0]?.text?.content || 'Untitled';
        
        const summaryProperty = properties.Summary;
        const summary = summaryProperty?.rich_text?.[0]?.text?.content || '';
        
        const publishedDateProperty = properties['Published Date'];
        const publishedDate = publishedDateProperty?.date?.start || null;
        
        const imageProperty = properties['Featured Image'];
        const featuredImage = imageProperty?.files?.[0]?.file?.url || imageProperty?.files?.[0]?.external?.url || null;

        // Get the page content and convert to markdown
        const mdBlocks = await n2m.pageToMarkdown(page.id);
        const markdownContent = n2m.toMarkdownString(mdBlocks);
        
        // Convert markdown to HTML
        const htmlContent = marked(markdownContent.parent);

        return {
            id: page.id,
            title,
            slug,
            summary,
            publishedDate,
            featuredImage,
            content: htmlContent,
            markdownContent: markdownContent.parent
        };
    } catch (error) {
        console.error('Error fetching post by slug:', error);
        throw new Error('Failed to fetch blog post');
    }
}

/**
 * Creates a new blog post in Notion
 */
async function createBlogPost(title, content) {
    if (!isBlogConfigured) {
        throw new Error('Blog functionality not configured - NOTION_BLOG_API_KEY and NOTION_BLOG_DATABASE_ID environment variables are required.');
    }

    try {
        // Generate slug from title
        const slug = title.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .trim();

        // Convert markdown content to Notion blocks
        const blocks = await markdownToNotionBlocks(content);

        const response = await notion.pages.create({
            parent: { database_id: blogDatabaseId },
            properties: {
                Title: {
                    title: [
                        {
                            text: {
                                content: title,
                            },
                        },
                    ],
                },
                Slug: {
                    rich_text: [
                        {
                            text: {
                                content: slug,
                            },
                        },
                    ],
                },
                Status: {
                    select: {
                        name: 'Published',
                    },
                },
                'Published Date': {
                    date: {
                        start: new Date().toISOString().split('T')[0],
                    },
                },
            },
            children: blocks,
        });

        console.log(`Blog post created: ${title} (${slug})`);
        return `https://www.notion.so/${response.id.replace(/-/g, '')}`;
    } catch (error) {
        console.error('Error creating blog post:', error);
        throw new Error('Failed to create blog post');
    }
}

/**
 * Converts Markdown content to Notion blocks (simplified version)
 */
async function markdownToNotionBlocks(markdownContent) {
    const blocks = [];
    const lines = markdownContent.split('\n');
    let inCodeBlock = false;
    let codeContent = '';

    for (const line of lines) {
        if (line.startsWith('```')) {
            if (inCodeBlock) {
                // End of code block
                blocks.push({
                    object: 'block',
                    type: 'code',
                    code: {
                        rich_text: [{ type: 'text', text: { content: codeContent.trim() } }],
                        language: 'javascript'
                    }
                });
                codeContent = '';
                inCodeBlock = false;
            } else {
                // Start of code block
                inCodeBlock = true;
            }
        } else if (inCodeBlock) {
            codeContent += line + '\n';
        } else if (line.startsWith('# ')) {
            // Heading 1
            blocks.push({
                object: 'block',
                type: 'heading_1',
                heading_1: {
                    rich_text: [{ type: 'text', text: { content: line.substring(2) } }]
                }
            });
        } else if (line.startsWith('## ')) {
            // Heading 2
            blocks.push({
                object: 'block',
                type: 'heading_2',
                heading_2: {
                    rich_text: [{ type: 'text', text: { content: line.substring(3) } }]
                }
            });
        } else if (line.trim() !== '') {
            // Regular paragraph
            blocks.push({
                object: 'block',
                type: 'paragraph',
                paragraph: {
                    rich_text: [{ type: 'text', text: { content: line } }]
                }
            });
        }
    }

    return blocks;
}

module.exports = {
    getPublishedPosts,
    getPostBySlug,
    createBlogPost
};