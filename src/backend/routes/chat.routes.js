const express = require("express");
const router = express.Router();
const { handleChat } = require("../controllers/chat.controller");
const chatRateLimiter = require("../middleware/rate-limiter");

// Chat endpoint with rate limiting
router.post("/chat", chatRateLimiter, handleChat);

module.exports = router;
