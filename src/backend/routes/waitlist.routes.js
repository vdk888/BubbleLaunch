const express = require("express");
const router = express.Router();
const { subscribe, testPost } = require("../controllers/waitlist.controller");

// Subscribe to waitlist
router.post("/subscribe", subscribe);

// Development-only test route
if (process.env.NODE_ENV !== "production") {
  router.post("/test-post", testPost);
}

module.exports = router;
