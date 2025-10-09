import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

// Load .env file from the current working directory (project root)
dotenv.config(); 

const notionApiKey = process.env.NOTION_API_KEY;
const databaseId = process.env.NOTION_DATABASE_ID;

if (!notionApiKey || !databaseId) {
    console.error('Error: NOTION_API_KEY or NOTION_DATABASE_ID is not set in the .env file.');
    process.exit(1);
}

const notion = new Client({ auth: notionApiKey });

// Define the desired properties and their configuration
const desiredProperties = {
    'Slug': { type: 'rich_text', rich_text: {} }, // Type: Rich Text
    'Status': {
        select: {
            options: [
                { name: 'Draft', color: 'gray' },
                { name: 'Published', color: 'green' },
            ],
        },
    }, // Type: Select
    'Published Date': { date: {} }, // Type: Date
    'Summary': { type: 'rich_text', rich_text: {} }, // Type: Rich Text
    // Note: 'Title' is managed implicitly via the 'Name' property
};

async function setupDatabase() {
    // Ensure databaseId is treated as a string for the log message
    const dbIdString = databaseId || 'undefined'; // Handle potential undefined case
    console.log(`Checking properties for Notion database: ${dbIdString}...`);

    try {
        // Retrieve the current database schema
        const response = await notion.databases.retrieve({ database_id: dbIdString });
        const currentProperties = response.properties;
        console.log('Current properties retrieved.');

        const propertiesToUpdate: Record<string, any> = {};
        let needsUpdate = false;

        // Check each desired property
        for (const [name, config] of Object.entries(desiredProperties)) {
            if (!currentProperties[name]) {
                console.log(`- Property '${name}' is missing. Adding...`);
                propertiesToUpdate[name] = config;
                needsUpdate = true;
            } else {
                // Optional: Add checks here if you want to verify the type or options of existing properties
                console.log(`- Property '${name}' already exists.`);
            }
        }

        // If any properties need to be added/updated, call the update endpoint
        if (needsUpdate) {
            console.log('Updating database properties...');
            await notion.databases.update({
                database_id: dbIdString,
                properties: propertiesToUpdate,
            });
            console.log('Database properties updated successfully!');
        } else {
            console.log('All desired properties already exist.');
        }

    } catch (error: any) {
        // Log the specific error from Notion API if available
        if (error.code) { // Notion API errors usually have a code
            console.warn(`@notionhq/client warn: request fail ${JSON.stringify({ code: error.code, message: error.message }, null, 2)}`);
        }
        console.error(`Error setting up Notion database: ${JSON.stringify(error)}`);
        process.exit(1); // Exit with error status
    }
}

// Execute the setup function
setupDatabase();
