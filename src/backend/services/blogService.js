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
            
            // Extract title
            const titleProperty = properties.Title;
            const title = titleProperty?.title?.[0]?.text?.content || 'Untitled';
            
            // Generate slug from title (no Slug property in database)
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            
            // Extract summary from Content Summary
            const summaryProperty = properties['Content Summary'];
            const summary = summaryProperty?.rich_text?.[0]?.text?.content || '';
            
            // Extract published date from Publication Date
            const publishedDateProperty = properties['Publication Date'];
            const publishedDate = publishedDateProperty?.date?.start || null;
            
            // No Featured Image property in database
            const featuredImage = null;

            // Extract status
            const statusProperty = properties.Status;
            const status = statusProperty?.select?.name || 'Draft';

            return {
                id: page.id,
                title,
                slug,
                summary,
                publishedDate,
                featuredImage,
                status,
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
                                        property: 'Published Date',
                                        date: {
                                            on_or_before: new Date().toISOString(),
                                        },
                                    },
                                ],
                            },
                        ],
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

        // Extract status
        const statusProperty = properties.Status;
        const status = statusProperty?.select?.name || 'Draft';

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
            status,
            content: htmlContent,
            markdownContent: markdownContent.parent
        };
    } catch (error) {
        console.error('Error fetching post by slug:', error);
        throw new Error('Failed to fetch blog post');
    }
}

/**
 * Creates a new blog post in Notion with specified status and scheduling
 */
async function createBlogPost(title, content, options = {}) {
    if (!isBlogConfigured) {
        throw new Error('Blog functionality not configured - NOTION_BLOG_API_KEY and NOTION_BLOG_DATABASE_ID environment variables are required.');
    }

    try {
        // Extract options with defaults
        const {
            status = 'Published',
            summary = '',
            publishedDate = null,
            slug: customSlug = null
        } = options;

        // Generate slug from title if not provided
        const slug = customSlug || title.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .trim();

        // Set published date
        let dateToUse = publishedDate;
        if (!dateToUse) {
            if (status === 'Published') {
                dateToUse = new Date().toISOString().split('T')[0];
            } else if (status === 'Scheduled') {
                // Default to tomorrow if no date provided for scheduled posts
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                dateToUse = tomorrow.toISOString().split('T')[0];
            }
        }

        // Convert markdown content to Notion blocks
        const blocks = await markdownToNotionBlocks(content);

        const properties = {
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
                    name: status,
                },
            },
        };

        // Add summary if provided
        if (summary) {
            properties.Summary = {
                rich_text: [
                    {
                        text: {
                            content: summary,
                        },
                    },
                ],
            };
        }

        // Add published date if provided
        if (dateToUse) {
            properties['Published Date'] = {
                date: {
                    start: dateToUse,
                },
            };
        }

        const response = await notion.pages.create({
            parent: { database_id: blogDatabaseId },
            properties,
            children: blocks,
        });

        console.log(`Blog post created: ${title} (${slug}) - Status: ${status}`);
        return {
            id: response.id,
            url: `https://www.notion.so/${response.id.replace(/-/g, '')}`,
            slug,
            status,
            publishedDate: dateToUse
        };
    } catch (error) {
        console.error('Error creating blog post:', error);
        throw new Error('Failed to create blog post');
    }
}

/**
 * Updates a blog post status (useful for publishing drafts)
 */
async function updateBlogPostStatus(pageId, status, publishedDate = null) {
    if (!isBlogConfigured) {
        throw new Error('Blog functionality not configured - NOTION_BLOG_API_KEY and NOTION_BLOG_DATABASE_ID environment variables are required.');
    }

    try {
        const properties = {
            Status: {
                select: {
                    name: status,
                },
            },
        };

        // Set published date if publishing or scheduling
        if ((status === 'Published' || status === 'Scheduled') && !publishedDate) {
            publishedDate = new Date().toISOString().split('T')[0];
        }

        if (publishedDate) {
            properties['Published Date'] = {
                date: {
                    start: publishedDate,
                },
            };
        }

        await notion.pages.update({
            page_id: pageId,
            properties,
        });

        console.log(`Blog post status updated to: ${status}`);
        return { success: true, status, publishedDate };
    } catch (error) {
        console.error('Error updating blog post status:', error);
        throw new Error('Failed to update blog post status');
    }
}

/**
 * Gets all posts regardless of status (for admin/Claude use)
 */
async function getAllPosts() {
    if (!isBlogConfigured) {
        return [];
    }

    try {
        const response = await notion.databases.query({
            database_id: blogDatabaseId,
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
            const titleProperty = properties.Title;
            const title = titleProperty?.title?.[0]?.text?.content || 'Untitled';
            
            // Generate slug from title (no Slug property in database)
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            
            // Extract summary from Content Summary
            const summaryProperty = properties['Content Summary'];
            const summary = summaryProperty?.rich_text?.[0]?.text?.content || '';
            
            // Extract published date from Publication Date
            const publishedDateProperty = properties['Publication Date'];
            const publishedDate = publishedDateProperty?.date?.start || null;
            
            // No Featured Image property in database
            const featuredImage = null;

            // Extract status
            const statusProperty = properties.Status;
            const status = statusProperty?.select?.name || 'Draft';

            return {
                id: page.id,
                title,
                slug,
                summary,
                publishedDate,
                featuredImage,
                status,
                url: `/blog/${slug}`
            };
        });

        return posts;
    } catch (error) {
        console.error('Error fetching all posts:', error);
        throw new Error('Failed to fetch all posts');
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
    createBlogPost,
    updateBlogPostStatus,
    getAllPosts
};