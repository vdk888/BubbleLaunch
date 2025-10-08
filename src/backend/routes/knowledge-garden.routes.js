const express = require("express");
const router = express.Router();
const kgController = require("../controllers/knowledge-garden.controller");

// Knowledge Garden API endpoints
router.get("/references", kgController.getReferences);
router.get("/references-by-source-type", kgController.getReferencesGroupedByType);
router.get("/references-by-theme", kgController.getReferencesGroupedByThemes);
router.get("/explore", kgController.exploreStructure);
router.post("/clear-cache", kgController.clearCache);

module.exports = router;
