/**
 * Tracking routes — Server-side conversion endpoints (Meta CAPI + future Google Ads)
 *
 * Mounted at /api/tracking by routes/index.js
 *
 * Endpoints:
 *   POST /api/tracking/capi/event — Forward a browser-fired Pixel event to Meta CAPI
 *   GET  /api/tracking/capi/health — Diagnostic: is CAPI configured?
 */

const express = require("express");
const router = express.Router();
const trackingController = require("../controllers/tracking.controller");

// Meta CAPI
router.post("/capi/event", trackingController.postCapiEvent);
router.get("/capi/health", trackingController.getCapiHealth);

module.exports = router;
