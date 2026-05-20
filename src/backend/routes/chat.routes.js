const express = require("express");
const router = express.Router();
const {
  handleChat,
  handlePortfolioChat,
  handleChatHealth,
  handleOpenRouterDiag,
} = require("../controllers/chat.controller");
const chatRateLimiter = require("../middleware/rate-limiter");

// Chat health check (no rate limiting)
router.get("/chat/health", handleChatHealth);

// Temporary diagnostic endpoint to identify OpenRouter account
// Token-gated, returns 404 if no token. Remove after identification (2026-05-20).
router.get("/chat/_diag/openrouter-account", handleOpenRouterDiag);

// Chat endpoint with rate limiting
router.post("/chat", chatRateLimiter, handleChat);
router.post("/chat/portfolio", chatRateLimiter, handlePortfolioChat);

module.exports = router;
