const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_BLOG_API_KEY });
const knowledgeGardenDatabaseId = '1ffcfc520644805b8bb9c9207fb2cb31';

async function testArchivedFiltering() {
    console.log('🧪 Testing archived page filtering...\n');

    const response = await notion.databases.query({
        database_id: knowledgeGardenDatabaseId,
        filter: {
            and: [
                {
                    property: 'Bubble Blog',
                    multi_select: {
                        contains: 'Published'
                    }
                }
            ]
        }
    });

    console.log(`Total results from Notion API: ${response.results.length}`);

    const archivedPages = response.results.filter(page => page.archived);
    const activePages = response.results.filter(page => !page.archived);

    console.log(`Archived pages: ${archivedPages.length}`);
    console.log(`Active pages: ${activePages.length}`);

    if (archivedPages.length > 0) {
        console.log('\n📋 Archived pages found:');
        archivedPages.forEach(page => {
            const title = page.properties.Name?.title?.[0]?.plain_text || 'Unknown';
            console.log(`  - ${title}`);
        });
    }

    console.log('\n✅ After filtering, only active pages will be displayed on the website.');
    console.log(`Expected count on website: ${activePages.length} references`);
}

testArchivedFiltering().catch(console.error);
