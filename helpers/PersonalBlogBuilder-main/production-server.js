// This is a standalone production server that serves Astro static files
// without relying on TypeScript or complex imports
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Setup Express application
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple logger for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// API Routes - Simplified for production
app.use('/api', (req, res) => {
  // Basic API route handler for production
  if (req.path === '/chat') {
    return res.json({ message: "Please use the API in development mode for full functionality." });
  } else if (req.path === '/publish') {
    return res.json({ message: "Please use the API in development mode for full functionality." });
  } else {
    return res.status(404).json({ error: "API endpoint not found" });
  }
});

// Setup paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine the client directory
const distDir = path.join(__dirname, 'dist/client');

console.log(`Looking for Astro build at: ${distDir}`);

// Check for Astro build
if (fs.existsSync(distDir)) {
  console.log(`✅ Found Astro build at: ${distDir}`);
  
  // Serve static files from Astro build
  app.use(express.static(distDir));
  
  // For any other route, serve the index.html (Astro's entry point)
  app.get('*', (req, res) => {
    // Skip API routes which are handled separately
    if (req.path.startsWith('/api/')) return;
    
    const indexPath = path.join(distDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      console.log(`Serving index.html for path: ${req.path}`);
      res.sendFile(indexPath);
    } else {
      console.error(`Index file not found at: ${indexPath}`);
      res.status(404).send('Blog not found. Please build the Astro site first.');
    }
  });
} else {
  console.warn(`⚠️ Astro build directory not found at ${distDir}`);
  
  // Try falling back to src directory for direct rendering
  console.log("Checking contents of the directory:");
  
  try {
    const rootContents = fs.readdirSync(".");
    console.log("Root directory contents:", rootContents);
    
    if (fs.existsSync("./dist")) {
      const distContents = fs.readdirSync("./dist");
      console.log("Dist directory contents:", distContents);
    }
  } catch (error) {
    console.error("Error listing directory contents:", error);
  }
  
  // Simple fallback page
  app.get('*', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>Personal Blog</title>
          <style>
            body { font-family: system-ui, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; }
            h1 { color: #333; }
            p { margin-bottom: 1rem; }
            pre { background: #f5f5f5; padding: 1rem; border-radius: 5px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <h1>Welcome to Personal Blog Builder</h1>
          <p>The blog is currently in maintenance mode. Please check back later.</p>
          <p>Looking for Astro build at: ${distDir}</p>
          <p>Current directory: ${__dirname}</p>
        </body>
      </html>
    `);
  });
}

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Production server running on http://0.0.0.0:${port}`);
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