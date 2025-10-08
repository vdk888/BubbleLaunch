const express = require("express");
const router = express.Router();
const portfolioController = require("../controllers/portfolio.controller");

// Portfolio simulator API endpoints
router.get("/preview-data", portfolioController.getPreviewData);
router.get("/etf-data", portfolioController.getETFData);
router.post("/calculate", portfolioController.calculatePortfolio);
router.post("/clear-cache", portfolioController.clearCache);

module.exports = router;
