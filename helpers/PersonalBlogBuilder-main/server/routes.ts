import express, { type Request, type Response, Router } from 'express';
import { getChatCompletion, generateBlogPostFromHistory } from './services/openaiService.js';
import { createNotionPage } from './services/notionService.js';
import { processWebhookUpdate, handlePublishCommand } from './services/telegramService.js'; 
import { addSubscriber, checkEmailExists } from './services/notionSubscriberService.js';
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';

const router = Router();

// GET /api/health - Simple health check endpoint to verify API connectivity
router.get('/health', (req: Request, res: Response) => {
    // Set CORS headers to allow access from any origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    // Return basic environment info to help with debugging
    const envInfo = {
        notionApiKey: process.env.NOTION_API_KEY ? 'Set' : 'Not set',
        notionDatabaseId: process.env.NOTION_DATABASE_ID ? 'Set' : 'Not set',
        notionEmailDatabaseId: process.env.NOTION_EMAIL_DATABASE_ID ? 'Set' : 'Not set',
        nodeEnv: process.env.NODE_ENV || 'Not set'
    };
    
    res.status(200).json({
        status: 'ok',
        message: 'API is running',
        timestamp: new Date().toISOString(),
        environment: envInfo
    });
});

// Middleware to parse JSON bodies
router.use(express.json());

// --- API Routes for Web Interface --- 

// POST /api/chat - Handles chat messages from the web UI
router.post('/chat', async (req: Request, res: Response) => {
    // Add logging to check if the route is hit
    console.log('Received request on POST /api/chat');
    const { message, history } = req.body;

    if (!message || !history) {
        return res.status(400).json({ error: 'Missing message or history in request body' });
    }

    try {
        // Construct the conversation history for OpenAI
        const currentHistory = [...history, { role: 'user', content: message }];
        
        // Get completion from OpenAI
        const reply = await getChatCompletion(currentHistory);
        
        res.json({ reply });

    } catch (error: any) {
        console.error('Error in /api/chat:', error);
        res.status(500).json({ error: error.message || 'Failed to process chat message' });
    }
});

// POST /api/publish - Handles request to generate and publish post from web UI
router.post('/publish', async (req: Request, res: Response) => {
    const { history } = req.body;

    if (!history || history.length === 0) {
        return res.status(400).json({ error: 'Missing or empty history in request body' });
    }

    try {
        // 1. Generate blog post content from history
        console.log('Generating blog post via API...');
        const { title, content } = await generateBlogPostFromHistory(history);
        console.log(`Generated post: "${title}"`);

        // 2. Create Notion page
        console.log('Publishing to Notion via API...');
        const notionUrl = await createNotionPage(title, content);
        console.log(`Published to Notion: ${notionUrl}`);

        res.json({ notionUrl });

    } catch (error: any) {
        console.error('Error in /api/publish:', error);
        res.status(500).json({ error: error.message || 'Failed to publish blog post' });
    }
});


// --- Route for Telegram Webhook --- 

// POST /api/telegram/webhook/:token - Handles updates from Telegram
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
if (telegramToken) {
    const webhookPath = `/telegram/webhook/${telegramToken}`;
    console.log(`Setting up Telegram webhook listener at: /api${webhookPath}`);

    router.post(webhookPath, (req: Request, res: Response) => {
        const update: TelegramBot.Update = req.body;
        console.log('Received Telegram update:', JSON.stringify(update, null, 2));
        
        try {
            // Process the update using the Telegram service
            processWebhookUpdate(update); 
            // Respond quickly to Telegram to acknowledge receipt
            res.sendStatus(200);
        } catch (error: any) {
             console.error('Error processing Telegram webhook update:', error);
             res.sendStatus(500); // Indicate an error occurred
        }
    });
} else {
     console.warn('Telegram bot token not found, webhook endpoint not created.');
}


// POST /api/subscribe - Handles email subscription requests
router.post('/subscribe', async (req: Request, res: Response) => {
    // Set explicit headers for CORS and content type
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    console.log('Received subscription request:', req.body);
    
    const { email } = req.body;

    if (!email) {
        console.log('Email missing in request body');
        return res.status(400).json({ error: 'Email address is required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email address format' });
    }

    try {
        // Verify environment variables are set
        const notionApiKey = process.env.NOTION_API_KEY;
        const emailDatabaseId = process.env.NOTION_EMAIL_DATABASE_ID;
        
        if (!notionApiKey) {
            console.error('NOTION_API_KEY is not set in the environment variables');
            return res.status(500).json({ error: 'Server configuration error: Missing API key' });
        }
        
        if (!emailDatabaseId) {
            console.error('NOTION_EMAIL_DATABASE_ID is not set in the environment variables');
            return res.status(500).json({ error: 'Server configuration error: Missing database ID' });
        }
        
        // Check if email already exists
        console.log(`Checking if email exists: ${email}`);
        const exists = await checkEmailExists(email);
        if (exists) {
            console.log(`Email ${email} is already subscribed`);
            return res.status(409).json({ message: 'Email is already subscribed' });
        }

        // Add the new subscriber
        console.log(`Adding new subscriber: ${email}`);
        const success = await addSubscriber(email);
        if (success) {
            console.log(`Successfully added subscriber: ${email}`);
            return res.status(201).json({ message: 'Subscription successful' });
        } else {
            console.error(`Failed to add subscriber: ${email}`);
            return res.status(500).json({ error: 'Failed to add subscription. Check server logs for details.' });
        }
    } catch (error: any) {
        console.error('Error in /api/subscribe:', error);
        
        // Ensure we always return a valid JSON response
        try {
            res.status(500).json({ 
                error: error.message || 'Failed to process subscription request',
                details: process.env.NODE_ENV === 'development' ? JSON.stringify(error) : undefined
            });
        } catch (responseError) {
            console.error('Error sending error response:', responseError);
            // Last resort if JSON serialization fails
            res.status(500).send('{"error": "Internal server error"}');
        }
    }
});

export default router;
