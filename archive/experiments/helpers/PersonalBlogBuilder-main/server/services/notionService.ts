import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import dotenv from 'dotenv';
import { notifySubscribersAboutNewPost } from './emailNotificationService.js';

dotenv.config();

const notionApiKey = process.env.NOTION_API_KEY;
const databaseId = process.env.NOTION_DATABASE_ID;

if (!notionApiKey) {
    console.warn('NOTION_API_KEY is not set in .env file. Notion integration will be disabled.');
}
if (!databaseId) {
    console.warn('NOTION_DATABASE_ID is not set in .env file. Notion integration will be disabled.');
}

// Initialize Notion Client
const notion = new Client({ auth: notionApiKey });

// Initialize NotionToMarkdown
// We pass the Notion Client instance to NotionToMarkdown
const n2m = new NotionToMarkdown({ notionClient: notion });

/**
 * Converts Markdown content to Notion blocks.
 * This is a simplified version. Real-world usage might need more robust parsing.
 * @param markdownContent The Markdown content string.
 * @returns An array of Notion block objects.
 */
async function markdownToNotionBlocks(markdownContent: string): Promise<any[]> {
    // Use NotionToMarkdown's utility for conversion (though it's primarily md -> blocks)
    // For complex md -> blocks, consider external libraries or custom logic.
    // This is a basic placeholder conversion.

    const blocks = [];
    const lines = markdownContent.split('\n');
    let inCodeBlock = false;
    let codeContent = '';
    let codeLang = 'text'; // Default language

    for (const line of lines) {
        if (line.startsWith('```')) {
            if (inCodeBlock) {
                // End of code block
                blocks.push({
                    object: 'block',
                    type: 'code',
                    code: {
                        rich_text: [{ type: 'text', text: { content: codeContent.trim() } }],
                        language: codeLang,
                    },
                });
                inCodeBlock = false;
                codeContent = '';
                codeLang = 'text';
            } else {
                // Start of code block
                inCodeBlock = true;
                codeLang = line.substring(3).trim() || 'text';
            }
        } else if (inCodeBlock) {
            codeContent += line + '\n';
        } else if (line.startsWith('# ')) {
            blocks.push({
                object: 'block',
                type: 'heading_1',
                heading_1: { rich_text: [{ type: 'text', text: { content: line.substring(2) } }] }
            });
        } else if (line.startsWith('## ')) {
            blocks.push({
                object: 'block',
                type: 'heading_2',
                heading_2: { rich_text: [{ type: 'text', text: { content: line.substring(3) } }] }
            });
        } else if (line.startsWith('### ')) {
            blocks.push({
                object: 'block',
                type: 'heading_3',
                heading_3: { rich_text: [{ type: 'text', text: { content: line.substring(4) } }] }
            });
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
            blocks.push({
                object: 'block',
                type: 'bulleted_list_item',
                bulleted_list_item: { rich_text: [{ type: 'text', text: { content: line.substring(2) } }] }
            });
        } else if (line.trim() !== '') {
             // Treat non-empty lines as paragraphs
             blocks.push({
                object: 'block',
                type: 'paragraph',
                paragraph: { rich_text: [{ type: 'text', text: { content: line } }] }
            });
        } else {
             // Handle empty lines if needed, e.g., add paragraph breaks or ignore
             // Currently ignored
        }
    }

    return blocks;
}

/**
 * Creates a new page in the specified Notion database.
 * @param title The title of the blog post.
 * @param markdownContent The content of the blog post in Markdown.
 * @returns The URL of the newly created Notion page.
 */
export async function createNotionPage(title: string, markdownContent: string): Promise<string> {
    if (!notion || !databaseId) {
        throw new Error('Notion API key or Database ID is not configured.');
    }

    console.log(`Creating Notion page titled: "${title}" in database: ${databaseId}`);

    try {
        // Convert Markdown to Notion blocks
        // Using NotionToMarkdown's parsing capability (experimental for md-to-blocks)
        // const mdBlocks = await n2m.pageToMarkdown('', 0); // Placeholder
        // A more direct approach is needed for md -> blocks
        const notionBlocks = await markdownToNotionBlocks(markdownContent);

        if (notionBlocks.length > 100) {
            console.warn('Content exceeds 100 blocks, Notion API might truncate. Consider splitting content.');
            // Notion API has a limit of 100 blocks per request for page creation/update children
        }

        // Generate a slug from the title
        const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
            
        // Get current date in ISO format for the Published Date
        const currentDate = new Date().toISOString();
        
        // Extract first paragraph as summary (up to 200 chars)
        const summaryMatch = markdownContent.match(/^(.+?)\n/m);
        const summary = summaryMatch ? 
            summaryMatch[1].substring(0, 200) + (summaryMatch[1].length > 200 ? '...' : '') : 
            'No summary available';

        const response = await notion.pages.create({
            parent: { database_id: databaseId },
            properties: {
                // Title property (called 'Nom' in the French Notion interface)
                'Nom': {
                    title: [
                        {
                            text: {
                                content: title,
                            },
                        },
                    ],
                },
                // Slug property (rich_text)
                'Slug': {
                    rich_text: [
                        {
                            text: {
                                content: slug,
                            },
                        },
                    ],
                },
                // Status property (select)
                'Status': {
                    select: {
                        name: 'Published'
                    }
                },
                // Published Date property (date)
                'Published Date': {
                    date: {
                        start: currentDate,
                    }
                },
                // Summary property (rich_text)
                'Summary': {
                    rich_text: [
                        {
                            text: {
                                content: summary,
                            },
                        },
                    ],
                }
            },
            // Add the main content as blocks
            children: notionBlocks.slice(0, 100), // Adhere to 100 block limit initially
        });

        console.log('Successfully created Notion page:', response.id);

        // If content exceeds 100 blocks, append the rest
        if (notionBlocks.length > 100) {
            console.log(`Appending remaining ${notionBlocks.length - 100} blocks...`);
            for (let i = 100; i < notionBlocks.length; i += 100) {
                const chunk = notionBlocks.slice(i, i + 100);
                await notion.blocks.children.append({
                    block_id: response.id,
                    children: chunk,
                });
            }
            console.log('Finished appending all blocks.');
        }

        // Cast to PageObjectResponse to access the 'url' property
        const pageResponse = response as any;
        const pageUrl = pageResponse.url;
        
        // Send email notifications to subscribers
        try {
            console.log('Sending email notifications to subscribers...');
            await notifySubscribersAboutNewPost(title, summary, pageUrl);
            console.log('Email notifications sent successfully');
        } catch (notificationError) {
            console.error('Error sending email notifications:', notificationError);
            // Continue even if notification fails - the post is still published
        }
        
        return pageUrl; // Return the URL of the created page

    } catch (error: any) {
        console.error('Error creating Notion page:', error.body || error.message);
        throw new Error(`Failed to create Notion page: ${error.message}`);
    }
}
