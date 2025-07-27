const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { createBlogPost } = require('./blogService');

const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookUrl = process.env.WEBHOOK_URL;
const openRouterApiKey = process.env.OPENROUTER_API_KEY;

if (!token) {
    console.warn('TELEGRAM_BOT_TOKEN not set. Telegram bot functionality disabled.');
}

let bot = null;
const MAX_TELEGRAM_MESSAGE_LENGTH = 4096;

// Store conversation history per chat ID
const chatHistories = {};

// Initialize Telegram Bot
function initializeTelegramBot() {
    if (!token) return;

    try {
        bot = new TelegramBot(token, { polling: false });
        
        if (webhookUrl) {
            const fullWebhookUrl = `${webhookUrl}/api/telegram/webhook/${token}`;
            bot.setWebHook(fullWebhookUrl);
            console.log(`Telegram webhook set to: ${fullWebhookUrl}`);
        } else {
            console.log('No webhook URL provided. Use polling mode for development.');
            bot = new TelegramBot(token, { polling: true });
            setupBotHandlers();
        }
    } catch (error) {
        console.error('Failed to initialize Telegram bot:', error);
    }
}

// Setup bot message handlers
function setupBotHandlers() {
    if (!bot) return;

    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text;

        if (!text) return;

        // Initialize chat history if not exists
        if (!chatHistories[chatId]) {
            chatHistories[chatId] = [];
        }

        try {
            if (text === '/start') {
                await sendChunkedMessage(bot, chatId, 
                    "Welcome to Bubble Blog Bot! 🫧\n\n" +
                    "I can help you create blog posts for the Bubble website.\n\n" +
                    "Commands:\n" +
                    "• Just chat with me to discuss ideas\n" +
                    "• /publish - Generate and publish a blog post from our conversation\n" +
                    "• /clear - Clear conversation history"
                );
            } else if (text === '/clear') {
                chatHistories[chatId] = [];
                await sendChunkedMessage(bot, chatId, "Conversation history cleared! Let's start fresh. 🧹");
            } else if (text === '/publish') {
                await handlePublishCommand(chatId);
            } else {
                // Regular conversation
                chatHistories[chatId].push({ role: 'user', content: text });
                
                // Get AI response
                const aiResponse = await getChatCompletion(chatHistories[chatId]);
                chatHistories[chatId].push({ role: 'assistant', content: aiResponse });
                
                await sendChunkedMessage(bot, chatId, aiResponse);
            }
        } catch (error) {
            console.error('Error handling message:', error);
            await sendChunkedMessage(bot, chatId, "Sorry, I encountered an error. Please try again.");
        }
    });
}

// Handle publish command
async function handlePublishCommand(chatId) {
    if (!chatHistories[chatId] || chatHistories[chatId].length === 0) {
        await sendChunkedMessage(bot, chatId, "No conversation history found. Please chat with me first to create content for the blog post.");
        return;
    }

    try {
        await sendChunkedMessage(bot, chatId, "🔄 Generating blog post from our conversation...");

        // Generate blog post from conversation history
        const { title, content } = await generateBlogPostFromHistory(chatHistories[chatId]);
        
        await sendChunkedMessage(bot, chatId, `📝 Generated post: "${title}"`);
        await sendChunkedMessage(bot, chatId, "🚀 Publishing to Notion...");

        // Create blog post in Notion
        const notionUrl = await createBlogPost(title, content);
        
        await sendChunkedMessage(bot, chatId, 
            `✅ Blog post published successfully!\n\n` +
            `📖 Title: ${title}\n` +
            `🔗 Notion: ${notionUrl}\n` +
            `🌐 Blog: https://your-bubble-site.com/blog\n\n` +
            `The post will appear on the Bubble website blog section.`
        );

        // Clear conversation history after publishing
        chatHistories[chatId] = [];
        
    } catch (error) {
        console.error('Error in handlePublishCommand:', error);
        await sendChunkedMessage(bot, chatId, `❌ Error publishing blog post: ${error.message}`);
    }
}

// Generate blog post from conversation history
async function generateBlogPostFromHistory(history) {
    const systemPrompt = `You are a blog post writer for Bubble, an AI-powered investment platform. 

Based on the conversation history provided, create a high-quality blog post that:
1. Has an engaging, SEO-friendly title
2. Is written in a professional yet accessible tone
3. Relates to investment, AI, fintech, or Bubble's mission
4. Is structured with clear headings and paragraphs
5. Is informative and valuable to readers
6. Uses markdown formatting

Return ONLY a JSON object with this structure:
{
  "title": "Blog Post Title",
  "content": "Full markdown content of the blog post"
}`;

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Please create a blog post based on this conversation:\n\n${JSON.stringify(history, null, 2)}` }
    ];

    const headers = {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json'
    };

    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'google/gemini-2.0-flash-001',
            messages: messages,
            temperature: 0.7
        }, { headers });

        const aiResponse = response.data.choices[0].message.content;
        
        // Parse JSON response
        const parsed = JSON.parse(aiResponse);
        return {
            title: parsed.title,
            content: parsed.content
        };
    } catch (error) {
        console.error('Error generating blog post:', error);
        throw new Error('Failed to generate blog post content');
    }
}

// Get chat completion from AI
async function getChatCompletion(history) {
    const systemPrompt = `You are a helpful assistant for Bubble, an AI-powered investment platform. 
You help brainstorm ideas for blog posts about:
- Investment strategies and market insights
- AI in finance and fintech
- Bubble's mission and philosophy
- Financial education and transparency
- Technology and innovation

Be conversational, knowledgeable, and focus on topics that would make great blog content for Bubble's audience.`;

    const messages = [
        { role: 'system', content: systemPrompt },
        ...history
    ];

    const headers = {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json'
    };

    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'google/gemini-2.0-flash-001',
            messages: messages,
            temperature: 0.7
        }, { headers });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error getting chat completion:', error);
        throw new Error('Failed to get AI response');
    }
}

// Send chunked messages to handle Telegram length limits
async function sendChunkedMessage(botInstance, chatId, text) {
    if (!botInstance) return;

    if (text.length <= MAX_TELEGRAM_MESSAGE_LENGTH) {
        await botInstance.sendMessage(chatId, text);
    } else {
        const numChunks = Math.ceil(text.length / MAX_TELEGRAM_MESSAGE_LENGTH);
        for (let i = 0, o = 0; i < numChunks; ++i, o += MAX_TELEGRAM_MESSAGE_LENGTH) {
            const chunk = text.substring(o, o + MAX_TELEGRAM_MESSAGE_LENGTH);
            await botInstance.sendMessage(chatId, chunk);
        }
    }
}

// Process webhook updates
function processWebhookUpdate(update) {
    if (update.message) {
        const msg = update.message;
        const chatId = msg.chat.id;
        const text = msg.text;

        if (!text) return;

        // Initialize chat history if not exists
        if (!chatHistories[chatId]) {
            chatHistories[chatId] = [];
        }

        // Handle the message (similar to polling handler)
        handleMessage(msg);
    }
}

async function handleMessage(msg) {
    const chatId = msg.chat.id;
    const text = msg.text;

    try {
        if (text === '/start') {
            await sendChunkedMessage(bot, chatId, 
                "Welcome to Bubble Blog Bot! 🫧\n\n" +
                "I can help you create blog posts for the Bubble website.\n\n" +
                "Commands:\n" +
                "• Just chat with me to discuss ideas\n" +
                "• /publish - Generate and publish a blog post from our conversation\n" +
                "• /clear - Clear conversation history"
            );
        } else if (text === '/clear') {
            chatHistories[chatId] = [];
            await sendChunkedMessage(bot, chatId, "Conversation history cleared! Let's start fresh. 🧹");
        } else if (text === '/publish') {
            await handlePublishCommand(chatId);
        } else {
            // Regular conversation
            chatHistories[chatId].push({ role: 'user', content: text });
            
            // Get AI response
            const aiResponse = await getChatCompletion(chatHistories[chatId]);
            chatHistories[chatId].push({ role: 'assistant', content: aiResponse });
            
            await sendChunkedMessage(bot, chatId, aiResponse);
        }
    } catch (error) {
        console.error('Error handling message:', error);
        await sendChunkedMessage(bot, chatId, "Sorry, I encountered an error. Please try again.");
    }
}

module.exports = {
    initializeTelegramBot,
    processWebhookUpdate,
    handlePublishCommand
};