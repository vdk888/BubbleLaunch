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
          "https://www.googleadservices.com", // Google Ads conversion linker (Phase 1 — Jade 2026-05-18)
          "https://googleads.g.doubleclick.net", // Google Ads remarketing pixel
          "https://pagead2.googlesyndication.com", // Google Ads gtag remarketing collector script (Phase 1 — Jade 2026-05-19)
          "https://cdn.jsdelivr.net", // Required for Chart.js
          "https://assets.calendly.com", // Calendly widget script (Sprint 3 fix — Jade msg 5014)
          "https://connect.facebook.net", // Meta Pixel fbevents.js (Jade msg 5024)
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://assets.calendly.com", // Calendly widget stylesheet (Sprint 3 fix)
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://r2cdn.perplexity.ai",
          "https://frontend-cdn.perplexity.ai", // Perplexity browser extension assets (msg 5015)
        ],
        imgSrc: ["'self'", "data:", "https:", "blob:"], // 'https:' already allows Meta Pixel + Google Ads tracking pixels
        connectSrc: [
          "'self'",
          "https://www.google-analytics.com",
          "https://*.google-analytics.com", // Allow all GA4 regions (region1, etc.)
          "https://api.notion.com",
          "https://openrouter.ai",
          "https://cdn.jsdelivr.net", // Allow Chart.js source maps
          "https://calendly.com", // Calendly API calls (Sprint 3 fix)
          "https://*.calendly.com", // Subdomains
          "https://www.facebook.com", // Meta Pixel tracking endpoint (Jade msg 5024)
          "https://connect.facebook.net", // Meta Pixel script + events
          "https://www.googleadservices.com", // Google Ads conversion endpoint (Phase 1 — Jade 2026-05-18)
          "https://googleads.g.doubleclick.net", // Google Ads remarketing endpoint
          "https://www.google.com", // Google Ads 1p-conversion + ccm/collect + rmkt/collect (gtag fires from here, Phase 1 — Jade 2026-05-19)
          "https://pagead2.googlesyndication.com", // Google Ads conversion tracking (gtag/js loads remarketing collector from here, Phase 1 — Jade 2026-05-19)
        ],
        frameSrc: [
          "'self'",
          "https://www.youtube.com",
          "https://youtube.com",
          "https://calendly.com", // Calendly inline embed iframe (Sprint 3 fix — Jade msg 5014)
          "https://*.calendly.com",
        ],
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

  // Debug: log API requests before session middleware to diagnose chat issues
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      console.log(`[DEBUG] ${req.method} ${req.path}`);
    }
    next();
  });

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

  // Serve llms.txt and llms-full.txt from root (LLM discoverability)
  app.get('/llms.txt', (req, res) => {
    res.type('text/plain');
    res.sendFile(path.join(__dirname, '../../frontend/llms.txt'));
  });

  app.get('/llms-full.txt', (req, res) => {
    res.type('text/plain');
    res.sendFile(path.join(__dirname, '../../frontend/llms-full.txt'));
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
