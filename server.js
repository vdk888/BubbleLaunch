require('dotenv').config();
const express = require('express');
const path = require('path');
const { Client } = require('@notionhq/client');

const app = express();
const port = process.env.PORT || 8080;

// Notion client
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DATABASE_ID;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

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