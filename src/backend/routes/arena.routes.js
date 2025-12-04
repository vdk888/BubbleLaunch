const express = require("express");
const router = express.Router();
const arenaController = require("../controllers/arena.controller");

/**
 * Arena Timeline API Endpoints
 * Serves pre-computed 20-year historical data for AI Trading Arena
 */

// Get full timeline with all frames
router.get("/timeline", arenaController.getTimeline);

// Get timeline metadata only (bots, events, metrics - no frames)
router.get("/metadata", arenaController.getMetadata);

// Get a single frame by index
router.get("/frame/:index", arenaController.getFrame);

// Get frames for a date range
router.get("/frames", arenaController.getFramesByDateRange);

// Get bot dialogue for a specific context
router.get("/dialogue/:botId", arenaController.getBotDialogue);

// Clear arena cache (for testing)
router.post("/clear-cache", arenaController.clearCache);

module.exports = router;
