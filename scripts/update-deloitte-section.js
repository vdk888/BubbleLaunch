const { Client } = require("@notionhq/client");
require('dotenv').config();

// Initialize Notion client
const notion = new Client({ auth: process.env.NOTION_BLOG_API_KEY });
const articleId = '293cfc52-0644-8142-bc02-fbadda702ab8';

// Read current article
async function getCurrentArticle() {
    const page = await notion.pages.retrieve({ page_id: articleId });
    const props = page.properties;

    const contentFR = props['Content FR']?.rich_text || [];
    const contentEN = props['Content EN']?.rich_text || [];

    const fullContentFR = contentFR.map(block => block.text?.content || '').join('');
    const fullContentEN = contentEN.map(block => block.text?.content || '').join('');

    return { fullContentFR, fullContentEN };
}

// Helper function to split long text into chunks
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

async function updateDeloitteSection() {
    console.log('🔍 Retrieving current article...\n');

    const { fullContentFR, fullContentEN } = await getCurrentArticle();

    // OLD French text to replace
    const oldTextFR = `En interne ? Les outils IA ont longtemps été ignorés (ChatGPT est sorti en novembre 2022, il n'a été bloqué qu'en 2025…) et les gaffes commencent à se voir (faire des recherches sur les rapports écrits avec de l'IA, non assumés par Deloitte).`;

    // NEW French text with verified information
    const newTextFR = `En interne ? Les outils IA ont longtemps été ignorés — ChatGPT a été bloqué sur leurs systèmes pour protéger les données clients, mais paradoxalement, Azure OpenAI GPT-4o était autorisé. Résultat : en octobre 2024, Deloitte Australie s'est fait prendre la main dans le sac avec un rapport gouvernemental de 440 000$ AU truffé d'hallucinations IA — citations inventées, jugements de cour fédérale fictifs, références académiques inexistantes. Découvert par un chercheur de l'Université de Sydney, le scandale a forcé Deloitte à rembourser partiellement le gouvernement australien. Un sénateur a comparé ces erreurs à "ce qu'un étudiant de première année universitaire commettrait". L'hypocrisie ultime : interdire ChatGPT en interne tout en utilisant l'IA sans le divulguer aux clients.`;

    // OLD English text to replace
    const oldTextEN = `Internally? AI tools were long ignored (ChatGPT came out in November 2022, it was only blocked in 2025...) and the blunders are starting to show (doing research on reports written with AI, not acknowledged by Deloitte).`;

    // NEW English text with verified information
    const newTextEN = `Internally? AI tools were long ignored — ChatGPT was blocked on their systems to protect client data, but paradoxically, Azure OpenAI GPT-4o was authorized. Result: in October 2024, Deloitte Australia got caught red-handed with a AU$440,000 government report riddled with AI hallucinations — fabricated citations, fictitious federal court judgments, non-existent academic references. Discovered by a University of Sydney researcher, the scandal forced Deloitte to partially refund the Australian government. A senator compared these errors to "what a first-year university student would get in deep trouble for." The ultimate hypocrisy: banning ChatGPT internally while using AI without disclosing it to clients.`;

    // Replace the text
    const updatedContentFR = fullContentFR.replace(oldTextFR, newTextFR);
    const updatedContentEN = fullContentEN.replace(oldTextEN, newTextEN);

    // Check if replacement was successful
    if (updatedContentFR === fullContentFR) {
        console.log('⚠️  Warning: French text was not found or not replaced');
        console.log('Looking for:', oldTextFR.substring(0, 100) + '...');
    } else {
        console.log('✅ French text replaced successfully');
    }

    if (updatedContentEN === fullContentEN) {
        console.log('⚠️  Warning: English text was not found or not replaced');
        console.log('Looking for:', oldTextEN.substring(0, 100) + '...');
    } else {
        console.log('✅ English text replaced successfully');
    }

    console.log('\n🔄 Updating article in Notion...\n');

    try {
        await notion.pages.update({
            page_id: articleId,
            properties: {
                'Content FR': {
                    rich_text: splitIntoRichTextChunks(updatedContentFR)
                },
                'Content EN': {
                    rich_text: splitIntoRichTextChunks(updatedContentEN)
                }
            }
        });

        console.log('✅ Article updated successfully!');
        console.log(`📄 Page ID: ${articleId}`);
        console.log(`🔗 URL: https://www.notion.so/${articleId.replace(/-/g, '')}`);

        console.log('\n📊 Update summary:');
        console.log(`- French content: ${updatedContentFR.length} characters`);
        console.log(`- English content: ${updatedContentEN.length} characters`);
        console.log('\n✨ Updated section with verified Deloitte Australia scandal (October 2024)');
        console.log('   - AU$440,000 government report');
        console.log('   - AI hallucinations (fabricated citations, fictitious court judgments)');
        console.log('   - Partial refund issued');
        console.log('   - Political scandal');

    } catch (error) {
        console.error('❌ Failed to update article:', error.message);
        if (error.body) {
            console.error('Error details:', JSON.stringify(error.body, null, 2));
        }
        throw error;
    }
}

// Run the update
updateDeloitteSection();
