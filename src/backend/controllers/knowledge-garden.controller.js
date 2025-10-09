const {
  getPublishedReferences,
  getReferencesGroupedByTheme,
  exploreKnowledgeGardenStructure,
  getEnrichedPublishedReferences,
  getEnrichedReferencesGroupedBySourceType,
  clearEnrichmentCache,
} = require("../services/knowledgeGardenService");

// In-memory cache for references
let referencesCache = null;
let groupedReferencesCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

/**
 * Get knowledge garden references (with optional LLM enrichment)
 */
async function getReferences(req, res) {
  try {
    // Check cache first
    if (referencesCache && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_TTL) {
      console.log('📦 Serving references from cache');
      return res.json(referencesCache);
    }

    // Check if enrichment is requested (default: true)
    const useEnrichment = req.query.enrich !== "false";

    if (useEnrichment) {
      const references = await getEnrichedPublishedReferences();
      referencesCache = references;
      cacheTimestamp = Date.now();
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
    // Check cache first
    if (groupedReferencesCache && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_TTL) {
      console.log('📦 Serving grouped references from cache');
      return res.json(groupedReferencesCache);
    }

    const groupedReferences = await getEnrichedReferencesGroupedBySourceType();
    groupedReferencesCache = groupedReferences;
    cacheTimestamp = Date.now();
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
    // Clear both service and controller caches
    clearEnrichmentCache();
    referencesCache = null;
    groupedReferencesCache = null;
    cacheTimestamp = null;
    console.log('🧹 Cleared all caches (enrichment + controller)');
    res.json({ success: true, message: "All caches cleared" });
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
