const express = require("express");
const router = express.Router();
const { getStats, getHealth } = require("../controllers/labs.controller");

// Public — no rate limit, served from in-memory snapshot (cheap)
router.get("/labs/stats.json", getStats);
router.get("/labs/health", getHealth);

module.exports = router;
