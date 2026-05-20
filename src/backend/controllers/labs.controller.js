/**
 * Bubble Labs controller — exposes the in-memory snapshot from labsStatsService
 * to public HTTP endpoints. No auth (data is intentionally public).
 *
 * Endpoints:
 *   GET /api/labs/stats.json — full snapshot (stats + feed + last_refreshed_at)
 *   GET /api/labs/health     — diagnostic: was the snapshot ever refreshed?
 */

const labsStats = require("../services/labsStatsService");

function getStats(req, res) {
  const snap = labsStats.getSnapshot();
  // Allow LLM agents and any client to consume this freely
  res.setHeader("Cache-Control", "public, max-age=300"); // 5 min CDN cache
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.json(snap);
}

function getHealth(req, res) {
  const snap = labsStats.getSnapshot();
  const healthy = !!snap.last_refreshed_at;
  return res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "never_refreshed",
    last_refreshed_at: snap.last_refreshed_at,
    refresh_errors_count: (snap.refresh_errors || []).length,
    tokens_status: snap.stats?.tokens_status || "unknown",
    feed_size: (snap.feed || []).length,
  });
}

module.exports = { getStats, getHealth };
