const express = require("express");
const router = express.Router();

const waitlistRoutes = require("./waitlist.routes");
const chatRoutes = require("./chat.routes");
const blogRoutes = require("./blog.routes");
const knowledgeGardenRoutes = require("./knowledge-garden.routes");
const portfolioRoutes = require("./portfolio.routes");
const pagesRoutes = require("./pages.routes");

/**
 * API Routes
 */
router.use("/api", chatRoutes);
router.use("/api", waitlistRoutes);
router.use("/api/blog", blogRoutes);
router.use("/api/knowledge-garden", knowledgeGardenRoutes);
router.use("/api/portfolio", portfolioRoutes);

/**
 * Page Routes (HTML serving)
 */
router.use("/", pagesRoutes);

module.exports = router;
