const express = require("express");
const path = require("path");
const helmet = require("helmet");
const sessionMiddleware = require("../middleware/session");

/**
 * Configure Express middleware
 * @param {express.Application} app - Express app instance
 */
function configureExpress(app) {
  // Trust proxy headers (needed for Cloudflare/DigitalOcean)
  app.set('trust proxy', true);

  // Security headers via helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // Required for inline scripts (GA4, etc.)
          "https://www.googletagmanager.com",
          "https://www.google-analytics.com",
          "https://cdn.jsdelivr.net", // Required for Chart.js
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: [
          "'self'",
          "https://www.google-analytics.com",
          "https://*.google-analytics.com", // Allow all GA4 regions (region1, etc.)
          "https://api.notion.com",
          "https://openrouter.ai",
          "https://cdn.jsdelivr.net", // Allow Chart.js source maps
        ],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for external images
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow external resources
  }));

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

  // Redirect legacy pricing routes to investor-specific pricing
  app.get(["/pricing", "/pricing.html"], (req, res) => {
    res.redirect(301, '/investors/pricing');
  });

  app.get(["/en/pricing", "/en/pricing.html"], (req, res) => {
    res.redirect(301, '/en/investors/pricing');
  });

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
