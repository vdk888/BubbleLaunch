require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = '294cfc52-0644-80e0-9ea3-cbc2ce09112a';

async function checkDatabase() {
  console.log('🔍 Checking current database structure...\n');

  try {
    const database = await notion.databases.retrieve({
      database_id: databaseId
    });

    console.log('📋 Current properties:');
    for (const [propertyName, propertyData] of Object.entries(database.properties)) {
      console.log(`   - ${propertyName}: ${propertyData.type}`);
    }

    console.log('\n🔗 Database URL: https://www.notion.so/' + databaseId.replace(/-/g, ''));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDatabase();
