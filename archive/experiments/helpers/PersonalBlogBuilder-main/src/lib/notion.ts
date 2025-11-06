import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';

// Initialize Notion client
const notion = new Client({ auth: import.meta.env.NOTION_API_KEY });
const DATABASE_ID = import.meta.env.NOTION_DATABASE_ID;

// Initialize NotionToMarkdown
const n2m = new NotionToMarkdown({ notionClient: notion });

// Type definition for a simplified Post object
export interface PostInfo {
    id: string;
    title: string;
    slug: string;
    summary: string;
    publishedDate: string | null;
}

/**
 * Fetches published blog posts from the Notion database.
 */
export async function getPublishedPosts(): Promise<PostInfo[]> {
    if (!DATABASE_ID) {
        throw new Error('NOTION_DATABASE_ID environment variable is not set.');
    }

    try {
        const response = await notion.databases.query({
            database_id: DATABASE_ID,
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

        // Map results to PostInfo objects
        const posts = response.results.map((page: any) => {
            // Safely access properties, providing defaults or null
            // Check for both 'Nom' (French) and 'title' property names
            const titleProp = 
                page.properties.Nom?.title?.[0]?.plain_text ?? 
                page.properties.title?.title?.[0]?.plain_text ?? 
                'Untitled';
            const slugProp = page.properties.Slug?.rich_text?.[0]?.plain_text ?? ''; // Need a slug!
            const summaryProp = page.properties.Summary?.rich_text?.[0]?.plain_text ?? '';
            const dateProp = page.properties['Published Date']?.date?.start ?? null;

            return {
                id: page.id,
                title: titleProp,
                slug: slugProp || page.id, // Fallback slug to page ID if empty
                summary: summaryProp,
                publishedDate: dateProp,
            };
        });

        return posts;
    } catch (error: any) {
        console.error('Error fetching published posts from Notion:', error.body || error.message);
        throw new Error('Failed to fetch posts from Notion.');
    }
}

/**
 * Fetches the details and content (as Markdown) of a single post by its slug.
 */
export async function getPostDetails(slug: string): Promise<{ title: string; markdownContent: string } | null> {
    if (!DATABASE_ID) {
        throw new Error('NOTION_DATABASE_ID environment variable is not set.');
    }

    try {
        const response = await notion.databases.query({
            database_id: DATABASE_ID,
            filter: {
                property: 'Slug',
                rich_text: {
                    equals: slug,
                },
            },
            page_size: 1 // Expecting only one match for a unique slug
        });

        if (response.results.length === 0) {
            console.warn(`No post found with slug: ${slug}`);
            return null; // No post found with this slug
        }

        const page: any = response.results[0];
        const pageId = page.id;
        // Check for both 'Nom' (French) and 'title' property names
        const title = 
            page.properties.Nom?.title?.[0]?.plain_text ?? 
            page.properties.title?.title?.[0]?.plain_text ?? 
            'Untitled';

        // Fetch blocks and convert to Markdown
        const mdblocks = await n2m.pageToMarkdown(pageId);
        const markdownContent = n2m.toMarkdownString(mdblocks).parent;

        return { title, markdownContent };

    } catch (error: any) {
        console.error(`Error fetching post details for slug "${slug}" from Notion:`, error.body || error.message);
        throw new Error(`Failed to fetch post details for slug "${slug}" from Notion.`);
    }
}
