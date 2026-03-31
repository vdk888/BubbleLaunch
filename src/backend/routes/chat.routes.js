const express = require("express");
const router = express.Router();
const {
  handleChat,
  handlePortfolioChat,
  handleChatHealth,
} = require("../controllers/chat.controller");
const chatRateLimiter = require("../middleware/rate-limiter");

// Chat health check (no rate limiting)
router.get("/chat/health", handleChatHealth);

// Chat endpoint with rate limiting
router.post("/chat", chatRateLimiter, handleChat);
router.post("/chat/portfolio", chatRateLimiter, handlePortfolioChat);

module.exports = router;
