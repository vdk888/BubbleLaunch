const express = require("express");
const path = require("path");
const sessionMiddleware = require("../middleware/session");

/**
 * Configure Express middleware
 * @param {express.Application} app - Express app instance
 */
function configureExpress(app) {
  // Trust proxy headers (needed for Cloudflare/DigitalOcean)
  app.set('trust proxy', true);

  // Redirect www to non-www
  app.use((req, res, next) => {
    const host = req.get('host');
    if (host && host.startsWith('www.')) {
      const newHost = host.replace('www.', '');
      // Force HTTPS for redirect (since we're behind proxy)
      return res.redirect(301, `https://${newHost}${req.originalUrl}`);
    }
    next();
  });

  // Body parser
  app.use(express.json());

  // Session middleware
  app.use(sessionMiddleware);

  // Serve robots.txt from root (SEO)
  app.get('/robots.txt', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/robots.txt'));
  });

  // Serve static files (CSS, JS, images) but not index.html
  app.use(
    express.static(path.join(__dirname, "../../frontend"), {
      index: false, // This prevents express.static from serving index.html
      setHeaders: (res, filePath) => {
        // Prevent caching of JS files to avoid stale code issues
        if (filePath.endsWith('.js')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    })
  );
}

module.exports = configureExpress;
