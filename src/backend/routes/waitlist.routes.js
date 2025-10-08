const express = require("express");
const router = express.Router();
const { subscribe, testPost } = require("../controllers/waitlist.controller");

// Subscribe to waitlist
router.post("/subscribe", subscribe);

// Test POST route
router.post("/test-post", testPost);

module.exports = router;
