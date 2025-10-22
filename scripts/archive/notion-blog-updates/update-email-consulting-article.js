require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_BLOG_API_KEY });

const pageId = '293cfc52-0644-8142-bc02-fbadda702ab8'; // Conseil en IA article

async function updateEmail() {
    console.log('🔄 Updating email address in Conseil en IA article...\n');

    try {
        // First, fetch the current content
        const page = await notion.pages.retrieve({ page_id: pageId });
        const contentFR = page.properties['Content FR'].rich_text.map(t => t.plain_text).join('');
        const contentEN = page.properties['Content EN'].rich_text.map(t => t.plain_text).join('');

        // Replace old email with new email
        const oldEmail = 'contact@bubble-invest.com';
        const newEmail = 'contact@bubbleinvest.org';

        const updatedContentFR = contentFR.replace(new RegExp(oldEmail, 'g'), newEmail);
        const updatedContentEN = contentEN.replace(new RegExp(oldEmail, 'g'), newEmail);

        // Helper function to split text into chunks
        function splitIntoRichTextChunks(text) {
            const chunks = [];
            const maxLength = 1900;
            let currentPos = 0;

            while (currentPos < text.length) {
                const chunk = text.substring(currentPos, currentPos + maxLength);
                chunks.push({ text: { content: chunk } });
                currentPos += maxLength;
            }

            return chunks;
        }

        // Update the page
        await notion.pages.update({
            page_id: pageId,
            properties: {
                'Content FR': {
                    rich_text: splitIntoRichTextChunks(updatedContentFR)
                },
                'Content EN': {
                    rich_text: splitIntoRichTextChunks(updatedContentEN)
                }
            }
        });

        console.log('✅ Email address updated successfully!\n');
        console.log(`📧 Changed from: ${oldEmail}`);
        console.log(`📧 Changed to: ${newEmail}`);
        console.log(`\n🔗 URL: https://www.notion.so/${pageId.replace(/-/g, '')}`);

    } catch (error) {
        console.error('❌ Failed to update email:', error.message);
        if (error.body) {
            console.error('Error details:', JSON.stringify(error.body, null, 2));
        }
        throw error;
    }
}

updateEmail();
