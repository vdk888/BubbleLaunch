const express = require("express");
const router = express.Router();
const portfolioController = require("../controllers/portfolio.controller");

// Portfolio simulator API endpoints
router.get("/preview-data", portfolioController.getPreviewData);
router.get("/etf-data", portfolioController.getETFData);
router.post("/calculate", portfolioController.calculatePortfolio);
router.post("/custom-allocation", portfolioController.calculateCustomAllocation);
router.post("/clear-cache", portfolioController.clearCache);
router.post("/regenerate-cache", portfolioController.regenerateCache);

module.exports = router;
