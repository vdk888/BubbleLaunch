const { Client } = require("@notionhq/client");
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_BLOG_API_KEY });
const knowledgeGardenDatabaseId = '1ffcfc520644805b8bb9c9207fb2cb31';

// Keywords to identify our 11 added references
const referenceKeywords = {
    'Accounting Big Four': 'Fintech Startups & Innovation',
    'Akur8': 'Fintech Startups & Innovation',
    'Shift Technology': 'Fintech Startups & Innovation',
    'Formations Essentielles pour Freelances': 'Fintech Startups & Innovation',
    'taux d\'échec des projets IA': 'Economics & Social Sciences',
    'Gartner': 'Economics & Social Sciences',
    'évolution des compétences en France': 'Economics & Social Sciences',
    'Échec de l\'IA en entreprise': 'Economics & Social Sciences',
    'Projets d\'IA : pourquoi': 'Economics & Social Sciences',
    'tarif journalier moyen': 'Economics & Social Sciences',
    'IA Agentique et finance': 'Fintech Startups & Innovation'
};

// Duplicates to delete (keeping the first occurrence)
const duplicatesToDelete = [
    '225cfc52-0644-818f-a44e-f02d0e88b6f1', // The Five Rules for Successful Stock Investing (duplicate)
    '225cfc52-0644-81f6-a6b3-e1dbd7610ae3', // Business Adventures (duplicate)
    '239cfc52-0644-819d-80a4-d723c6516617', // The Warren Buffett Way (duplicate)
    '239cfc52-0644-81b0-a842-d70653d28118', // Common Stocks and Uncommon Profits (duplicate)
    '239cfc52-0644-81cd-a722-ed0f151d4bd1', // The Little Book That Beats the Market (duplicate)
    '239cfc52-0644-81f6-b009-e3d138bb0c99'  // Et si vous en saviez assez pour gagner en Bourse... (duplicate)
];

async function updateMainThemesAndDeleteDuplicates() {
    console.log('🚀 Starting update process...\n');

    try {
        // Step 1: Delete duplicates
        console.log('🗑️  Step 1: Deleting duplicate references...\n');

        for (const pageId of duplicatesToDelete) {
            try {
                // First get the page to see its title
                const page = await notion.pages.retrieve({ page_id: pageId });
                const title = page.properties.Name?.title?.[0]?.plain_text || 'Unknown';

                await notion.pages.update({
                    page_id: pageId,
                    archived: true
                });
                console.log(`  ✅ Deleted duplicate: "${title}"`);
            } catch (error) {
                console.log(`  ⚠️  Could not delete ${pageId}: ${error.message}`);
            }
        }

        console.log(`\n✅ Deleted ${duplicatesToDelete.length} duplicate references\n`);

        // Step 2: Update Main Themes for our added references
        console.log('📝 Step 2: Adding Main Theme to article references...\n');

        const response = await notion.databases.query({
            database_id: knowledgeGardenDatabaseId,
            filter: {
                property: 'Bubble Blog',
                multi_select: {
                    contains: 'Published'
                }
            }
        });

        console.log(`Found ${response.results.length} published references\n`);

        let updatedCount = 0;

        for (const page of response.results) {
            const title = page.properties.Name?.title?.[0]?.plain_text || '';
            const currentMainTheme = page.properties['Main Theme']?.multi_select || [];

            // Check if this reference matches our keywords
            for (const [keyword, mainTheme] of Object.entries(referenceKeywords)) {
                if (title.includes(keyword)) {
                    // Check if it already has the correct Main Theme
                    const hasCorrectTheme = currentMainTheme.some(t => t.name === mainTheme);

                    if (!hasCorrectTheme) {
                        console.log(`  📌 Updating: "${title}"`);
                        console.log(`     Adding Main Theme: ${mainTheme}`);

                        await notion.pages.update({
                            page_id: page.id,
                            properties: {
                                'Main Theme': {
                                    multi_select: [{ name: mainTheme }]
                                }
                            }
                        });

                        updatedCount++;
                        console.log('     ✅ Done\n');
                    } else {
                        console.log(`  ⏭️  "${title}" already has correct Main Theme\n`);
                    }
                    break; // Found a match, move to next page
                }
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 FINAL SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Duplicates deleted: ${duplicatesToDelete.length}`);
        console.log(`✅ Main Themes added: ${updatedCount}`);
        console.log('\n🎯 Main Theme Distribution:');
        console.log('   • Fintech Startups & Innovation: 5 references');
        console.log('     - AI in the Accounting Big Four');
        console.log('     - Akur8');
        console.log('     - Shift Technology');
        console.log('     - Formations Essentielles pour Freelances 2025');
        console.log('     - IA Agentique et finance');
        console.log('');
        console.log('   • Economics & Social Sciences: 6 references');
        console.log('     - Taux d\'échec des projets IA');
        console.log('     - Gartner');
        console.log('     - Évolution des compétences en France');
        console.log('     - Échec de l\'IA en entreprise');
        console.log('     - Projets d\'IA : pourquoi');
        console.log('     - Tarif journalier moyen');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    }
}

updateMainThemesAndDeleteDuplicates();
