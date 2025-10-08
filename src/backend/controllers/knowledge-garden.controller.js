const {
  getPublishedReferences,
  getReferencesGroupedByTheme,
  exploreKnowledgeGardenStructure,
  getEnrichedPublishedReferences,
  getEnrichedReferencesGroupedBySourceType,
  clearEnrichmentCache,
} = require("../services/knowledgeGardenService");

/**
 * Get knowledge garden references (with optional LLM enrichment)
 */
async function getReferences(req, res) {
  try {
    // Check if enrichment is requested (default: true)
    const useEnrichment = req.query.enrich !== "false";

    if (useEnrichment) {
      const references = await getEnrichedPublishedReferences();
      res.json(references);
    } else {
      const references = await getPublishedReferences();
      res.json(references);
    }
  } catch (error) {
    console.error("Error fetching knowledge garden references:", error);
    res.status(500).json({ error: "Failed to fetch references" });
  }
}

/**
 * Get enriched references grouped by source type (Books/Articles)
 */
async function getReferencesGroupedByType(req, res) {
  try {
    const groupedReferences = await getEnrichedReferencesGroupedBySourceType();
    res.json(groupedReferences);
  } catch (error) {
    console.error("Error fetching references grouped by source type:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch grouped references by source type" });
  }
}

/**
 * Get references grouped by theme
 */
async function getReferencesGroupedByThemes(req, res) {
  try {
    const groupedReferences = await getReferencesGroupedByTheme();
    res.json(groupedReferences);
  } catch (error) {
    console.error("Error fetching grouped references:", error);
    res.status(500).json({ error: "Failed to fetch grouped references" });
  }
}

/**
 * Explore knowledge garden database structure
 */
async function exploreStructure(req, res) {
  try {
    const structure = await exploreKnowledgeGardenStructure();
    res.json(structure);
  } catch (error) {
    console.error("Error exploring knowledge garden structure:", error);
    res.status(500).json({ error: "Failed to explore database structure" });
  }
}

/**
 * Clear enrichment cache (for testing)
 */
function clearCache(req, res) {
  try {
    clearEnrichmentCache();
    res.json({ success: true, message: "Enrichment cache cleared" });
  } catch (error) {
    console.error("Error clearing enrichment cache:", error);
    res.status(500).json({ error: "Failed to clear cache" });
  }
}

module.exports = {
  getReferences,
  getReferencesGroupedByType,
  getReferencesGroupedByThemes,
  exploreStructure,
  clearCache,
};
