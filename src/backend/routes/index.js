const express = require("express");
const router = express.Router();

const waitlistRoutes = require("./waitlist.routes");
const chatRoutes = require("./chat.routes");
const blogRoutes = require("./blog.routes");
const knowledgeGardenRoutes = require("./knowledge-garden.routes");
const portfolioRoutes = require("./portfolio.routes");
const businessContactRoutes = require("./business-contact.routes");
const pagesRoutes = require("./pages.routes");
const sitemapRoutes = require("./sitemap.routes");

/**
 * SEO Routes
 */
router.use("/", sitemapRoutes);

/**
 * API Routes
 */
router.use("/api", chatRoutes);
router.use("/api", waitlistRoutes);
router.use("/api/blog", blogRoutes);
router.use("/api/knowledge-garden", knowledgeGardenRoutes);
router.use("/api/portfolio", portfolioRoutes);
router.use("/api/business-contact", businessContactRoutes);

/**
 * Page Routes (HTML serving)
 */
router.use("/", pagesRoutes);

module.exports = router;
