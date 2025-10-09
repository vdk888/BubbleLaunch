import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const notionApiKey = process.env.NOTION_API_KEY;
const emailDatabaseId = process.env.NOTION_EMAIL_DATABASE_ID;

if (!notionApiKey) {
  console.error('NOTION_API_KEY is not set in the environment variables');
}

if (!emailDatabaseId) {
  console.error('NOTION_EMAIL_DATABASE_ID is not set in the environment variables');
}

// Initialize Notion client with better error handling
let notion: Client;
try {
  notion = new Client({ auth: notionApiKey || '' });
  console.log('Notion client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Notion client:', error);
  // Create a dummy client that will log errors instead of crashing
  notion = new Client({ auth: 'dummy_token' });
}

/**
 * Check if an email already exists in the Notion database
 * @param email - The email address to check
 * @returns boolean indicating if the email exists
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  if (!emailDatabaseId) return false;

  try {
    const response = await notion.databases.query({
      database_id: emailDatabaseId,
      filter: {
        property: 'Email',
        email: {
          equals: email,
        },
      },
    });

    return response.results.length > 0;
  } catch (error) {
    console.error('Error checking if email exists:', error);
    return false;
  }
}

/**
 * Add a new subscriber to the Notion database
 * @param email - The email address to add
 * @returns boolean indicating success or failure
 */
export async function addSubscriber(email: string): Promise<boolean> {
  if (!emailDatabaseId) {
    console.error('Cannot add subscriber: NOTION_EMAIL_DATABASE_ID is not set');
    return false;
  }

  if (!notionApiKey) {
    console.error('Cannot add subscriber: NOTION_API_KEY is not set');
    return false;
  }

  console.log(`Attempting to add subscriber with email: ${email}`);
  console.log(`Using database ID: ${emailDatabaseId}`);

  try {
    // First check if the email already exists
    const exists = await checkEmailExists(email);
    if (exists) {
      console.log(`Email ${email} already exists in the database`);
      return false;
    }

    // Add the new subscriber
    await notion.pages.create({
      parent: {
        database_id: emailDatabaseId,
      },
      properties: {
        // The 'Name' property is the title in Notion
        'Name': {
          title: [
            {
              text: {
                content: email, // Use email as the title for easy identification
              },
            },
          ],
        },
        'Email': {
          email: email,
        },
        'Subscription Date': {
          date: {
            start: new Date().toISOString(),
          },
        },
        'Status': {
          select: {
            name: 'Active',
          },
        },
      },
    });

    console.log(`Successfully added subscriber: ${email}`);
    return true;
  } catch (error: any) {
    console.error('Error adding subscriber:', error);
    
    // Log more detailed error information
    if (error.code) {
      console.error(`Notion API error code: ${error.code}`);
    }
    
    if (error.body) {
      console.error('Notion API error details:', JSON.stringify(error.body, null, 2));
    }
    
    // Check for specific error types
    if (error.code === 'validation_error') {
      console.error('This is likely due to incorrect database properties or structure');
      console.error('Make sure you have run the setup-email-subscribers-db script');
    } else if (error.code === 'unauthorized') {
      console.error('This is likely due to an invalid Notion API key');
    } else if (error.code === 'object_not_found') {
      console.error('This is likely due to an invalid database ID or the database does not exist');
    }
    
    return false;
  }
}

/**
 * Get all subscribers from the Notion database
 * @returns Array of subscriber emails
 */
export async function getAllSubscribers(): Promise<string[]> {
  if (!emailDatabaseId) return [];

  try {
    const response = await notion.databases.query({
      database_id: emailDatabaseId,
      filter: {
        property: 'Status',
        select: {
          equals: 'Active',
        },
      },
    });

    const subscribers = response.results.map((page: any) => {
      // Extract the email from the Email property
      return page.properties.Email?.email || '';
    }).filter(email => email !== '');

    return subscribers;
  } catch (error) {
    console.error('Error getting subscribers:', error);
    return [];
  }
}
