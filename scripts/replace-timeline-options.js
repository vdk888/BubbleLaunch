require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = '294cfc52-0644-80e0-9ea3-cbc2ce09112a';

async function replaceTimelineOptions() {
  console.log('🔄 Replacing Timeline options (EN → FR)...\n');

  try {
    // First, get current database to see existing options
    const database = await notion.databases.retrieve({
      database_id: databaseId
    });

    console.log('📋 Current Timeline options:');
    const currentOptions = database.properties.Timeline.select.options;
    currentOptions.forEach(opt => {
      console.log(`   - "${opt.name}" (${opt.color})`);
    });

    console.log('\n🔄 Updating to French options with emojis...\n');

    // Update Timeline property with ONLY the new French options
    const response = await notion.databases.update({
      database_id: databaseId,
      properties: {
        'Timeline': {
          select: {
            options: [
              { name: '🔥 Urgent (< 1 mois)', color: 'red' },
              { name: '⚡ Prochainement (1-3 mois)', color: 'orange' },
              { name: '📅 En planification (3-6 mois)', color: 'yellow' },
              { name: '🔍 En exploration (6+ mois)', color: 'gray' }
            ]
          }
        }
      }
    });

    console.log('✅ Timeline options updated successfully!\n');
    console.log('📋 New Timeline options:');
    console.log('   - 🔥 Urgent (< 1 mois) [red]');
    console.log('   - ⚡ Prochainement (1-3 mois) [orange]');
    console.log('   - 📅 En planification (3-6 mois) [yellow]');
    console.log('   - 🔍 En exploration (6+ mois) [gray]');

    console.log('\n⚠️  Note: Les anciennes options en anglais ont été remplacées.');
    console.log('    Si des entrées existantes utilisaient les anciennes options,');
    console.log('    elles seront maintenant vides. Vous devrez les mettre à jour manuellement.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.body) {
      console.error('Details:', JSON.stringify(error.body, null, 2));
    }
  }
}

replaceTimelineOptions();
