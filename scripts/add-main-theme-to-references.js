const { Client } = require("@notionhq/client");
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_BLOG_API_KEY });
const knowledgeGardenDatabaseId = '1ffcfc520644805b8bb9c9207fb2cb31';

// Mapping of our 11 added references to their appropriate Main Theme
const referencesMainThemes = {
    "AI in the Accounting Big Four - Deloitte, PwC, KPMG, and EY": "Fintech Startups & Innovation",
    "Le Grand Témoignage d'Akur8": "Fintech Startups & Innovation",
    "Shift Technology - About": "Fintech Startups & Innovation",
    "10 Formations Essentielles pour Freelances 2025": "Fintech Startups & Innovation",
    "Un taux d'échec des projets IA inquiétant": "Economics & Social Sciences",
    "Gartner prédit l'abandon de 40% des projets d'IA agentique d'ici 2027": "Economics & Social Sciences",
    "L'IA et l'évolution des compétences en France": "Economics & Social Sciences",
    "Échec de l'IA en entreprise : les raisons et les clés du succès en 2025": "Economics & Social Sciences",
    "Projets d'IA : pourquoi échouent-ils ?": "Economics & Social Sciences",
    "L'IA pourrait mettre un terme au tarif journalier moyen des cabinets de conseil": "Economics & Social Sciences",
    "IA Agentique et finance : la révolution des agents autonomes": "Fintech Startups & Innovation"
};

async function findAndUpdateReferences() {
    console.log('🔍 Finding and updating references with Main Theme...\n');

    try {
        // Query all pages in the Knowledge Garden
        const response = await notion.databases.query({
            database_id: knowledgeGardenDatabaseId
        });

        console.log(`📚 Total references in database: ${response.results.length}\n`);

        let updatedCount = 0;
        let duplicatesFound = [];
        const seenTitles = new Map(); // Track duplicates

        for (const page of response.results) {
            const titleProp = page.properties.Name;
            const title = titleProp?.title?.[0]?.plain_text || '';
            const currentMainTheme = page.properties['Main Theme']?.multi_select || [];

            // Check for duplicates
            if (seenTitles.has(title)) {
                duplicatesFound.push({
                    title,
                    pageId: page.id,
                    firstOccurrence: seenTitles.get(title)
                });
            } else {
                seenTitles.set(title, page.id);
            }

            // Check if this is one of our added references
            if (referencesMainThemes[title]) {
                const mainTheme = referencesMainThemes[title];

                // Only update if Main Theme is empty or different
                const hasTheme = currentMainTheme.some(theme => theme.name === mainTheme);

                if (!hasTheme) {
                    console.log(`✏️  Updating: ${title}`);
                    console.log(`   Adding Main Theme: ${mainTheme}`);

                    await notion.pages.update({
                        page_id: page.id,
                        properties: {
                            'Main Theme': {
                                multi_select: [{ name: mainTheme }]
                            }
                        }
                    });

                    updatedCount++;
                    console.log('   ✅ Updated\n');
                } else {
                    console.log(`⏭️  Skipping: ${title} (already has Main Theme: ${mainTheme})\n`);
                }
            }
        }

        console.log('\n📊 Summary:');
        console.log('==========');
        console.log(`✅ References updated: ${updatedCount}/${Object.keys(referencesMainThemes).length}`);

        if (duplicatesFound.length > 0) {
            console.log(`\n⚠️  Duplicates found: ${duplicatesFound.length}`);
            console.log('\nDuplicate references:');
            duplicatesFound.forEach(dup => {
                console.log(`  - "${dup.title}"`);
                console.log(`    Duplicate ID: ${dup.pageId}`);
                console.log(`    Original ID: ${dup.firstOccurrence}`);
            });
            console.log('\n💡 Tip: You can manually delete duplicate pages in Notion');
        } else {
            console.log('✅ No duplicates found');
        }

        console.log('\n🎯 Main Theme assignments:');
        console.log('========================');
        console.log('Fintech Startups & Innovation:');
        console.log('  - AI in the Accounting Big Four');
        console.log('  - Le Grand Témoignage d\'Akur8');
        console.log('  - Shift Technology - About');
        console.log('  - 10 Formations Essentielles pour Freelances 2025');
        console.log('  - IA Agentique et finance : la révolution des agents autonomes');
        console.log('\nEconomics & Social Sciences:');
        console.log('  - Un taux d\'échec des projets IA inquiétant');
        console.log('  - Gartner prédit l\'abandon de 40% des projets...');
        console.log('  - L\'IA et l\'évolution des compétences en France');
        console.log('  - Échec de l\'IA en entreprise...');
        console.log('  - Projets d\'IA : pourquoi échouent-ils ?');
        console.log('  - L\'IA pourrait mettre un terme au tarif journalier moyen...');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    }
}

findAndUpdateReferences();
