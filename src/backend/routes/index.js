const express = require("express");
const router = express.Router();

const waitlistRoutes = require("./waitlist.routes");
const newsletterRoutes = require("./newsletter.routes");
const chatRoutes = require("./chat.routes");
const blogRoutes = require("./blog.routes");
const knowledgeGardenRoutes = require("./knowledge-garden.routes");
const portfolioRoutes = require("./portfolio.routes");
const arenaRoutes = require("./arena.routes");
const businessContactRoutes = require("./business-contact.routes");
const pagesRoutes = require("./pages.routes");
const shopProxyRoutes = require("./shop-proxy.routes");
const sitemapRoutes = require("./sitemap.routes");
const trackingRoutes = require("./tracking.routes");
const labsRoutes = require("./labs.routes");

/**
 * SEO Routes
 */
router.use("/", sitemapRoutes);

/**
 * API Routes
 */
router.use("/api", chatRoutes);
router.use("/api", waitlistRoutes);
router.use("/api", newsletterRoutes);
router.use("/api/blog", blogRoutes);
router.use("/api/knowledge-garden", knowledgeGardenRoutes);
router.use("/api/portfolio", portfolioRoutes);
router.use("/api/arena", arenaRoutes);
router.use("/api/business-contact", businessContactRoutes);
router.use("/api/tracking", trackingRoutes);
router.use("/api", labsRoutes);

/**
 * Shop Proxy Routes (Netlify → bubbleinvest.org/shop/*)
 */
router.use("/shop", shopProxyRoutes);

/**
 * Page Routes (HTML serving)
 */
router.use("/", pagesRoutes);

module.exports = router;
