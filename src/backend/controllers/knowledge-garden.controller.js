const {
  getPublishedReferences,
  getReferencesGroupedBySourceType,
  getReferencesGroupedByTheme,
  exploreKnowledgeGardenStructure,
} = require("../services/knowledgeGardenService");

/**
 * Get knowledge garden references
 */
async function getReferences(req, res) {
  try {
    const references = await getPublishedReferences();
    res.json(references);
  } catch (error) {
    console.error("Error fetching knowledge garden references:", error);
    res.status(500).json({ error: "Failed to fetch references" });
  }
}

/**
 * Get references grouped by source type (Books/Articles/Videos)
 */
async function getReferencesGroupedByType(req, res) {
  try {
    const groupedReferences = await getReferencesGroupedBySourceType();
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
 * Clear cache (no longer needed without LLM enrichment)
 */
function clearCache(req, res) {
  try {
    console.log('✅ Cache clearing requested (no caches active)');
    res.json({ success: true, message: "No caches to clear (LLM enrichment removed)" });
  } catch (error) {
    console.error("Error clearing cache:", error);
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
