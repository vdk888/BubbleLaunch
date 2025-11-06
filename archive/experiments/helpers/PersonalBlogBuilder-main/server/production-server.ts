import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import apiRoutes from './routes.js';
import { initializeTelegramBot } from './services/telegramService.js';

// Load environment variables
dotenv.config();

// Setup Express application
const app = express();
// Explicitly set the port for the backend API server to 4000
const apiPort = 4000; 

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../client');

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Initialize Telegram Bot
initializeTelegramBot();

// Start the server
app.listen(apiPort, '0.0.0.0', () => {
  // Updated log message to reflect the correct port
  console.log(`🚀 Backend API server running on http://0.0.0.0:${apiPort}`);
  
  if (!process.env.WEBHOOK_URL && process.env.TELEGRAM_BOT_TOKEN) {
    console.log('🤖 Telegram bot running in polling mode for production');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});