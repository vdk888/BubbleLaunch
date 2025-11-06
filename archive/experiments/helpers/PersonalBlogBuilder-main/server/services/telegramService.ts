import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { getChatCompletion, generateBlogPostFromHistory } from './openaiService.js'; // Reuse OpenAI service
import { createNotionPage } from './notionService.js'; // Reuse Notion service

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
// Get webhook URL from environment variable
const webhookUrl = process.env.WEBHOOK_URL;

// For Replit deployment without explicit webhook URL, fall back to polling
if (!webhookUrl) {
    console.log('No webhook URL provided. Telegram bot will use polling mode.');
}

if (!token) {
    console.warn('TELEGRAM_BOT_TOKEN not set in .env. Telegram bot functionality disabled.');
    // Return dummy functions or throw error if Telegram is essential
}

let bot: TelegramBot | null = null;

const MAX_TELEGRAM_MESSAGE_LENGTH = 4096;

// Utility function to send messages, chunking if they are too long
async function sendChunkedMessage(botInstance: TelegramBot, chatId: number, text: string) {
    if (!botInstance) return;

    if (text.length <= MAX_TELEGRAM_MESSAGE_LENGTH) {
        await botInstance.sendMessage(chatId, text);
    } else {
        console.log(`Message for chat ID ${chatId} is too long (${text.length} chars), chunking.`);
        const numChunks = Math.ceil(text.length / MAX_TELEGRAM_MESSAGE_LENGTH);
        for (let i = 0, o = 0; i < numChunks; ++i, o += MAX_TELEGRAM_MESSAGE_LENGTH) {
            const chunk = text.substring(o, o + MAX_TELEGRAM_MESSAGE_LENGTH);
            // Add a small delay between sending chunks to avoid rate limiting if necessary, though Telegram usually handles this well.
            // await new Promise(resolve => setTimeout(resolve, 250)); 
            await botInstance.sendMessage(chatId, chunk);
        }
        console.log(`Sent ${numChunks} chunks for chat ID ${chatId}.`);
    }
}

// Store conversation history per chat ID
const chatHistories: { [chatId: number]: { role: 'user' | 'assistant'; content: string }[] } = {};

export function initializeTelegramBot() {
    if (!token) return; // Don't initialize if token is missing

    bot = new TelegramBot(token);

    const isProduction = process.env.NODE_ENV === 'production' || webhookUrl;
    
    if (isProduction) {
        if (!webhookUrl) {
            console.warn('WEBHOOK_URL not available. Telegram bot will use polling even in production.');
            setupPollingMode();
            return;
        }
        
        // Set webhook
        const webhookEndpoint = `/api/telegram/webhook/${token}`; // Unique endpoint per bot
        bot.setWebHook(`${webhookUrl}${webhookEndpoint}`);
        console.log(`Telegram bot webhook set to: ${webhookUrl}${webhookEndpoint}`);

        // We'll handle incoming messages via the webhook route in Express
        setupBotListeners(); // Still set up command listeners for webhook mode
    } else {
        // Use polling for local development
        setupPollingMode();
    }

    // Generic error handling
    bot.on('polling_error', (error) => {
        console.error('Telegram polling error:', error);
    });
    bot.on('webhook_error', (error) => {
        console.error('Telegram webhook error:', error);
    });
}

function setupPollingMode() {
    if (!bot) return;
    
    console.log('Telegram bot started with polling.');
    bot.startPolling();
    setupBotListeners();
}

function setupBotListeners() {
    if (!bot) return;
    
    // Listener for /start command
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        const welcomeMessage = "Welcome to the Blog Assistant Bot! Send me your ideas, and I'll help you structure them. Use /publish when you're ready to create a Notion page.";
        if (bot) await sendChunkedMessage(bot, chatId, welcomeMessage);
        // Initialize chat history for new users
        if (!chatHistories[chatId]) {
            chatHistories[chatId] = [];
        }
    });

    // Listener for regular messages when polling
    bot.on('message', (msg) => {
        if (msg.text && !msg.text.startsWith('/')) { // Ignore commands
            handleIncomingMessage(msg);
        }
    });

    // Listener for the /publish command
    bot.onText(/\/publish/, (msg) => {
        handlePublishCommand(msg.chat.id);
    });
}

// Function to handle incoming messages (used by webhook or polling)
export async function handleIncomingMessage(msg: TelegramBot.Message) {
    if (!bot || !msg.text || msg.text.startsWith('/')) return; // Ignore non-text or commands here

    const chatId = msg.chat.id;
    const userMessage = msg.text;

    console.log(`Received Telegram message from chat ID ${chatId}: ${userMessage}`);

    // Initialize history if it doesn't exist
    if (!chatHistories[chatId]) {
        chatHistories[chatId] = [];
    }

    // Add user message to history
    chatHistories[chatId].push({ role: 'user', content: userMessage });

    try {
        // Show typing indicator
        await bot.sendChatAction(chatId, 'typing');

        // Get AI completion (limit history size if needed)
        const historyForAI = chatHistories[chatId].slice(-10); // Send last 10 turns
        const aiReply = await getChatCompletion(historyForAI);

        // Add AI reply to history
        chatHistories[chatId].push({ role: 'assistant', content: aiReply });

        // Send reply back to Telegram user
        await sendChunkedMessage(bot, chatId, aiReply);

    } catch (error: unknown) {
        console.error(`Error handling Telegram message for chat ${chatId}:`, error);
        if (error instanceof Error) {
            await sendChunkedMessage(bot, chatId, `Sorry, I encountered an error: ${error.message}`);
        } else {
            await sendChunkedMessage(bot, chatId, 'Sorry, I encountered an unknown error.');
        }
    }
}

// Function to handle the /publish command
export async function handlePublishCommand(chatId: number) {
    if (!bot) return;

    console.log(`Received /publish command from chat ID ${chatId}`);

    const history = chatHistories[chatId];

    if (!history || history.length === 0) {
        if (bot) await sendChunkedMessage(bot, chatId, 'There is no conversation history to publish. Please chat with me first.');
        return;
    }

    try {
        if (bot) await sendChunkedMessage(bot, chatId, 'Generating blog post from our conversation...');
        await bot.sendChatAction(chatId, 'typing');

        // Log the history being sent to OpenAI for blog post generation
        console.log(`[handlePublishCommand] History for chat ID ${chatId} being sent to generateBlogPostFromHistory:`, JSON.stringify(history, null, 2));

        // Generate blog post using OpenAI service
        const { title, content } = await generateBlogPostFromHistory(history);

        if (bot) await sendChunkedMessage(bot, chatId, `Generated post titled: "${title}". Now publishing to Notion...`);
        await bot.sendChatAction(chatId, 'typing');

        // Publish to Notion using Notion service
        const notionUrl = await createNotionPage(title, content);

        if (bot) await sendChunkedMessage(bot, chatId, `Successfully published to Notion! You can view it here: ${notionUrl}`);

        // Optional: Clear history after successful publish
        // delete chatHistories[chatId];

    } catch (error: unknown) {
        console.error(`Error handling /publish command for chat ${chatId}:`, error);
        if (bot) if (error instanceof Error) {
            if (bot) await sendChunkedMessage(bot, chatId, `Sorry, I encountered an error during publishing: ${error.message}`);
        } else {
            if (bot) await sendChunkedMessage(bot, chatId, 'Sorry, I encountered an unknown error during publishing.');
        }
    }
}

// Function to process updates received from the webhook
export function processWebhookUpdate(update: TelegramBot.Update) {
     if (!bot) return;

     // Make sure the bot processes the update
     // The 'message' and 'onText' handlers defined during initialization will be triggered
     bot.processUpdate(update);
}
