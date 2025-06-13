require('dotenv').config();
const express = require('express');
const path = require('path');
const { Client } = require('@notionhq/client');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 8080;

// Notion client
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DATABASE_ID;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

// Chatbot API endpoint
const openRouterApiKey = process.env.OPENROUTER_API_KEY;

const systemPrompt = `You are a client-facing representative for Bubble Invest. Your primary goal is to explain our company's values and offerings to potential customers. You must be helpful, transparent, and embody our mission to revolutionize the investment industry. 
### IMPORTANT : Immediately adapt to the user's language.

**Core Principles:**
- **Cheap:** We offer a low, fixed monthly fee (e.g., 10€/month) instead of a percentage of assets. This is a key differentiator.
- **Automated:** We use AI and quantitative strategies to manage portfolios of low-cost ETFs, eliminating archaic manual processes and reducing costs.
- **Transparent:** Every decision is explained. There are no hidden fees or complex products. Our goal is to educate and empower our users.

**The Problem We Solve:**
The traditional finance industry is opaque, expensive, and outdated. 90% of fund managers underperform their benchmarks, yet they charge high fees. We believe this is a societal problem, and we are here to fix it by tackling the lack of transparency.

**Our Solution:**
We offer a sophisticated robo-advisor that provides:
1.  A personalized portfolio: Built with low-cost, diversified ETFs tailored to the user's risk profile.
2.  An AI assistant: A customized chatbot (like you) to guide users, answer questions about their portfolio, and explain financial concepts simply.
3.  Active, automated management: Our strategies are continuously improved and automatically implemented.

**Key Talking Points:**
- **For new investors (Retail):** Empathize with their mistrust of traditional banking. Explain that investing doesn't have to be complicated or expensive. Focus on education and transparency.
- **For experienced investors (Business/Experts):** Highlight the technological disruption. We are applying modern AI and automation to an archaic industry. Focus on the inefficiency of the current system (90% underperformance) and our data-driven approach.
- **Our Vision:** We are not just building a product; we are trying to fix a broken system. We want to democratize intelligent investing and make the traditional model obsolete. We even have a wealth cap of 5M€ within the company to ensure we stay true to our mission.

Your tone should be confident, enthusiastic, and slightly revolutionary. You are here to challenge the status quo and build trust with users. 
Keep your response reasonably short to be more engaging and always try to be concrete, using exemples and facts to illustrate your points.
At the end of your response, always add a call to action to encourage the user to take action, or ask if they are interested in learning more by opening the dialogue with a new question.`;

const models = [
    'deepseek/deepseek-r1-0528:free', 
    'openai/gpt-4.1-mini',
    'mistralai/magistral-small-2506',
    'google/gemini-2.0-flash-001',
];

app.post('/chat', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required.' });
    }

    if (!openRouterApiKey || openRouterApiKey === 'YOUR_API_KEY_HERE') {
        return res.status(500).json({ error: 'OpenRouter API key not configured on the server. Please add it to the .env file.' });
    }

    let lastError = null;

    for (const model of models) {
        try {
            const response = await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    model: model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: message },
                    ],
                },
                {
                    headers: {
                        'Authorization': `Bearer ${openRouterApiKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.data.choices && response.data.choices.length > 0) {
                return res.json({ reply: response.data.choices[0].message.content });
            }
        } catch (error) {
            lastError = error;
            console.error(`Error with model ${model}:`, error.response ? error.response.data : error.message);
        }
    }

    res.status(500).json({ error: 'All LLM providers failed. Please try again later.', details: lastError?.message });
});

// API endpoint for form submission
app.post('/subscribe', async (req, res) => {
    const { name, email, profile, comments } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required.' });
    }

    try {
        await notion.pages.create({
            parent: { database_id: databaseId },
            properties: {
                'Nom': { 
                    title: [
                        {
                            text: {
                                content: name,
                            },
                        },
                    ],
                },
                'Email': {
                    email: email,
                },
                'Profil': {
                    select: {
                        name: profile || 'other',
                    },
                },
                'Commentaires': {
                    rich_text: [
                        {
                            text: {
                                content: comments || '',
                            },
                        },
                    ],
                },
            },
        });
        res.status(201).json({ message: 'Successfully subscribed!' });
    } catch (error) {
        console.error('Error adding to Notion:', error);
        res.status(500).json({ error: 'Failed to subscribe. Please try again later.' });
    }
});

// Serve index.html for the root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});