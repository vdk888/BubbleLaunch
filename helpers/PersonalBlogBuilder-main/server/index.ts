import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import apiRoutes from './routes.js';
import { initializeTelegramBot } from './services/telegramService.js';

// Load environment variables
dotenv.config();

const app = express();
// Force port 4000 for the backend, as Astro needs 5000 and proxy targets 4000.
const port = 4000;

// --- Middleware --- 

// Enable CORS for all origins (adjust for production if needed)
app.use(cors()); 

// Parse JSON bodies (already included in routes.ts, but good practice here too)
app.use(express.json());

// --- API Routes --- 
app.use('/api', apiRoutes);

// --- Initialize Services --- 
initializeTelegramBot(); // Initialize Telegram Bot (starts polling or sets webhook)

// --- Start Server --- 
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Backend server listening on http://0.0.0.0:${port}`);
    if (process.env.NODE_ENV !== 'production' && !process.env.WEBHOOK_URL && process.env.TELEGRAM_BOT_TOKEN) {
        console.log('🔌 Telegram bot running in polling mode for development.');
    }
});

// --- Graceful Shutdown (Optional but Recommended) --- 
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    // Perform cleanup if needed (e.g., close database connections)
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    // Perform cleanup
    process.exit(0);
});
