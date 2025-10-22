const express = require("express");
const router = express.Router();
const { submitBusinessContact } = require("../controllers/business-contact.controller");

// Business contact form submission
router.post("/", submitBusinessContact);

module.exports = router;
