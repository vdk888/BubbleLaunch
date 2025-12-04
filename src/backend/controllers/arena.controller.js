/**
 * Arena Controller
 * Handles API requests for the AI Trading Arena timeline
 */

const arenaTimelineService = require('../services/arenaTimelineService');

/**
 * GET /api/arena/timeline
 * Returns the full arena timeline with all monthly frames
 */
async function getTimeline(req, res) {
  try {
    const timeline = await arenaTimelineService.getArenaTimeline();
    res.json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    console.error('[ArenaController] Error getting timeline:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to load arena timeline',
    });
  }
}

/**
 * GET /api/arena/metadata
 * Returns timeline metadata without full frame data (lighter payload)
 */
async function getMetadata(req, res) {
  try {
    const metadata = await arenaTimelineService.getTimelineMetadata();
    res.json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    console.error('[ArenaController] Error getting metadata:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to load arena metadata',
    });
  }
}

/**
 * GET /api/arena/frame/:index
 * Returns a single frame by index
 */
async function getFrame(req, res) {
  try {
    const index = parseInt(req.params.index, 10);

    if (isNaN(index) || index < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid frame index',
      });
    }

    const frame = await arenaTimelineService.getFrame(index);

    if (!frame) {
      return res.status(404).json({
        success: false,
        error: `Frame at index ${index} not found`,
      });
    }

    res.json({
      success: true,
      data: frame,
    });
  } catch (error) {
    console.error('[ArenaController] Error getting frame:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to load frame',
    });
  }
}

/**
 * GET /api/arena/frames?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Returns frames within a date range
 */
async function getFramesByDateRange(req, res) {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        error: 'Both start and end dates are required (YYYY-MM-DD format)',
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(start) || !dateRegex.test(end)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    const frames = await arenaTimelineService.getFramesByDateRange(start, end);

    res.json({
      success: true,
      data: frames,
      count: frames.length,
    });
  } catch (error) {
    console.error('[ArenaController] Error getting frames by date range:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to load frames',
    });
  }
}

/**
 * GET /api/arena/dialogue/:botId?eventType=crash&lang=fr
 * Returns bot dialogue for a specific context
 */
async function getBotDialogue(req, res) {
  try {
    const { botId } = req.params;
    const { eventType = 'default', lang = 'fr' } = req.query;

    // Validate bot ID
    const validBots = ['equi', 'pari', 'momo', 'sage'];
    if (!validBots.includes(botId)) {
      return res.status(400).json({
        success: false,
        error: `Invalid bot ID. Valid options: ${validBots.join(', ')}`,
      });
    }

    const dialogue = arenaTimelineService.getBotDialogue(botId, eventType, lang);

    res.json({
      success: true,
      data: {
        botId,
        eventType,
        language: lang,
        dialogue,
      },
    });
  } catch (error) {
    console.error('[ArenaController] Error getting dialogue:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to load dialogue',
    });
  }
}

/**
 * POST /api/arena/clear-cache
 * Clears the arena cache (for testing/development)
 */
async function clearCache(req, res) {
  try {
    await arenaTimelineService.clearArenaCache();
    res.json({
      success: true,
      message: 'Arena cache cleared successfully',
    });
  } catch (error) {
    console.error('[ArenaController] Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to clear cache',
    });
  }
}

module.exports = {
  getTimeline,
  getMetadata,
  getFrame,
  getFramesByDateRange,
  getBotDialogue,
  clearCache,
};
