const express = require("express");
const router = express.Router();
const {
  handleChat,
  handlePortfolioChat,
} = require("../controllers/chat.controller");
const chatRateLimiter = require("../middleware/rate-limiter");

// Chat endpoint with rate limiting
router.post("/chat", chatRateLimiter, handleChat);
router.post("/chat/portfolio", chatRateLimiter, handlePortfolioChat);

module.exports = router;
