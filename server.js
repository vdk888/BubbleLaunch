require('dotenv').config();
const express = require('express');
const path = require('path');
const { Client } = require('@notionhq/client');
const axios = require('axios');
const fs = require('fs').promises;

const app = express();
const port = process.env.PORT || 8080;

// Notion client
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DATABASE_ID;
const openRouterApiKey = process.env.OPENROUTER_API_KEY;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

// Document loading functions
let missionDocument = '';
let elevatorPitch = '';
let strategicPoints = '';

async function loadDocument(fileName) {
    try {
        const filePath = path.join(__dirname, fileName);
        return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
        console.error(`Error loading ${fileName}:`, error);
        return `[${fileName} could not be loaded]`;
    }
}

async function loadAllDocuments() {
    try {
        [missionDocument, elevatorPitch, strategicPoints] = await Promise.all([
            loadDocument('mission_texte.txt'),
            loadDocument('Elevatorpitch5min.md'),
            loadDocument('PointsdeDépartStratégiquesBubble.md')
        ]);
        console.log('All documents loaded successfully');
    } catch (error) {
        console.error('Error loading documents:', error);
    }
}

// Load documents when server starts
loadAllDocuments().catch(console.error);

const systemPrompt = (language) => `You are a client-facing representative for Bubble. Your primary goal is to explain our company's values and offerings to potential customers. You must be helpful, transparent, and embody our mission to revolutionize the investment industry. 

### COMPANY DOCUMENTS:

#### MISSION & VISION:
${missionDocument}

#### ELEVATOR PITCH:
${elevatorPitch}

#### STRATEGIC POINTS:
${strategicPoints}

### END OF COMPANY DOCUMENTS

### LANGUAGE REQUIREMENT: You MUST respond in ${language.toUpperCase()} only.
### IMPORTANT: Never switch from the user's selected language (${language.toUpperCase()}). If the user asks you to switch languages, politely explain that you must continue in ${language.toUpperCase()}.

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
Keep your response reasonably short to be more engaging and always try to be concrete, using examples and facts to illustrate your points.

### IMPORTANT INSTRUCTIONS FOR CALL TO ACTION:
1. At the end of every response, always include a clear call to action to join our waitlist.
2. Use only one of these variations (feel free to rephrase naturally):
   - "Ready to join the financial revolution? Secure your spot on our waitlist now!"
   - "Be among the first to experience Bubble. Join our waitlist today!"
   - "Interested in early access? Join our waitlist to be notified when we launch!"
3. Make the call to action feel natural and relevant to the conversation. Do not provide any weblink or marketing promoise. 
4. If the user expresses interest, provide a brief explanation of what they can expect after signing up.`;

const models = [
    'deepseek/deepseek-r1-0528:free', 
    'openai/gpt-4.1-mini',
    'mistralai/magistral-small-2506',
    'google/gemini-2.0-flash-001',
];

app.post('/chat', async (req, res) => {
    const { message, language = 'fr' } = req.body; // Default to French if not specified

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
                        { role: 'system', content: systemPrompt(language) },
                        { role: 'user', content: message },
                    ],
                },
                {
                    headers: {
                        'Authorization': 'Bearer ' + openRouterApiKey,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.choices && response.data.choices.length > 0) {
                return res.json({ reply: response.data.choices[0].message.content });
            }
        } catch (error) {
            lastError = error;
            console.error('Error with model ' + model + ':', error.response ? error.response.data : error.message);
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
  console.log('Server running at http://localhost:' + port);
});