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

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const clientDistPath = path.join(rootDir, 'dist/client');
const serverEntryPath = path.join(rootDir, 'dist/server/entry.mjs');

// Create Express app
const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 4000;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- API Routes ---
app.use('/api', apiRoutes);

// --- Initialize Services ---
initializeTelegramBot();

// --- Serve Static Astro Files ---
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath, { 
    index: false // Don't use index.html by default
  }));
  console.log(`📂 Serving static files from ${clientDistPath}`);
} else {
  console.warn(`⚠️ Static files directory not found at ${clientDistPath}`);
}

// --- Serve Astro Server-Side Rendered Pages ---
if (fs.existsSync(serverEntryPath)) {
  import(serverEntryPath)
    .then(({ handler }) => {
      // For all routes not handled by API or static files, use Astro's handler
      app.use(handler);
      console.log('🚀 Astro SSR handler initialized');
    })
    .catch(err => {
      console.error('❌ Failed to load Astro SSR handler:', err);
      
      // Fallback - serve a simple HTML page
      app.get('*', (req, res) => {
        res.status(500).send(`
          <html>
            <head><title>Blog Error</title></head>
            <body>
              <h1>Server Error</h1>
              <p>The blog server encountered an error. Please try again later.</p>
            </body>
          </html>
        `);
      });
    });
} else {
  console.error(`❌ Astro server build not found at: ${serverEntryPath}`);
  
  // Fallback - send error page
  app.get('*', (req, res) => {
    res.status(404).send(`
      <html>
        <head><title>Blog Not Found</title></head>
        <body>
          <h1>Blog Not Found</h1>
          <p>The blog has not been built yet. Please run the build process first.</p>
        </body>
      </html>
    `);
  });
}

// --- Start Server ---
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Production server running on http://0.0.0.0:${port}`);
  console.log('📄 Serving both the API and Astro site in production mode');
  
  if (!process.env.WEBHOOK_URL && process.env.TELEGRAM_BOT_TOKEN) {
    console.log('🔌 Telegram bot running in polling mode');
  }
});

// --- Graceful Shutdown ---
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});