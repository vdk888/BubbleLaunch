import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import apiRoutes from './routes.ts';
import { initializeTelegramBot } from './services/telegramService.ts';

// Load environment variables
dotenv.config();

// Setup Express application
const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist/client');

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Check for Astro build
if (fs.existsSync(distDir)) {
  console.log(`✅ Serving Astro static files from ${distDir}`);
  
  // Serve static files from Astro build
  app.use(express.static(distDir));
  
  // For any other route, serve the index.html (Astro's entry point)
  app.get('*', (req, res) => {
    // Skip API routes which are handled separately
    if (req.path.startsWith('/api/')) return;
    
    const indexPath = path.join(distDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Blog not found. Please build the Astro site first.');
    }
  });
} else {
  console.warn(`⚠️ Astro build directory not found at ${distDir}`);
  app.get('/', (req, res) => {
    res.send(`
      <html>
        <head><title>Blog Not Found</title></head>
        <body>
          <h1>Blog Not Found</h1>
          <p>The blog has not been built yet. Please run the build process first.</p>
          <p>Looking for Astro build at: ${distDir}</p>
        </body>
      </html>
    `);
  });
}

// Initialize Telegram Bot
initializeTelegramBot();

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Production server running on http://0.0.0.0:${port}`);
  
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