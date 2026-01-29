const express = require("express");
const router = express.Router();
const newsletterController = require("../controllers/newsletter.controller");

router.post("/newsletter/subscribe", newsletterController.subscribeNewsletter);
router.get("/newsletter/roles", newsletterController.getRoles);

module.exports = router;
