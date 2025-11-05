const cron = require("node-cron");
const portfolioCacheService = require("./portfolioCacheService");

/**
 * Cache Scheduler Service
 * Handles automatic monthly cache regeneration on the last Sunday of each month at 2 AM UTC
 */

/**
 * Check if current date is within 7 days of month end
 * @param {Date} date - Date to check
 * @returns {boolean} True if within 7 days of month end
 */
function isWithinSevenDaysOfMonthEnd(date = new Date()) {
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const daysUntilMonthEnd = Math.ceil((lastDayOfMonth - date) / (1000 * 60 * 60 * 24));
  return daysUntilMonthEnd <= 7 && daysUntilMonthEnd >= 0;
}

/**
 * Trigger cache regeneration
 * @returns {Promise<Object>} Regeneration result with metadata
 */
async function triggerCacheRegeneration() {
  console.log("🔄 Starting scheduled cache regeneration...");

  try {
    const startTime = Date.now();

    // Generate new snapshots
    const snapshots = await portfolioCacheService.generateSnapshots();

    // Write to disk (this also updates metadata)
    const result = await portfolioCacheService.writeSnapshotsToDisk(snapshots);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Cache regeneration completed in ${duration}s`);
    console.log(`📊 Next scheduled regeneration: ${result.metadata.nextScheduled}`);

    return {
      success: true,
      duration,
      metadata: result.metadata,
      tradingDays: result.metadata.tradingDaysIncluded,
      strategies: result.metadata.strategiesIncluded.length,
    };
  } catch (error) {
    console.error("❌ Cache regeneration failed:", error.message);
    console.error(error.stack);

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Initialize cache scheduler
 * Runs every Sunday at 2 AM UTC and checks if it's within 7 days of month end
 */
function initialize() {
  console.log("📅 Initializing cache scheduler...");

  // Cron schedule: Every Sunday at 2:00 AM UTC
  // Format: second minute hour day month weekday
  // "0 2 * * 0" = minute 0, hour 2, any day, any month, Sunday (0)
  const schedule = "0 2 * * 0";

  cron.schedule(schedule, async () => {
    const now = new Date();
    console.log(`⏰ Cron job triggered at ${now.toISOString()} (Sunday 2 AM UTC)`);

    // Check if we're within 7 days of month end
    if (isWithinSevenDaysOfMonthEnd(now)) {
      console.log("📅 Within 7 days of month end - triggering cache regeneration");
      await triggerCacheRegeneration();
    } else {
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const daysUntilMonthEnd = Math.ceil((lastDayOfMonth - now) / (1000 * 60 * 60 * 24));
      console.log(`⏭️  Not within 7 days of month end (${daysUntilMonthEnd} days remaining) - skipping regeneration`);
    }
  }, {
    scheduled: true,
    timezone: "UTC"
  });

  console.log(`✅ Cache scheduler initialized (runs every Sunday at 2 AM UTC)`);
  console.log(`📅 Next check: ${getNextSundayAt2AM().toISOString()}`);

  // Check current cache status on startup
  checkCacheStatus();
}

/**
 * Get next Sunday at 2 AM UTC
 * @returns {Date} Next Sunday at 2 AM UTC
 */
function getNextSundayAt2AM() {
  const now = new Date();
  const daysUntilSunday = (7 - now.getUTCDay()) % 7;
  const nextSunday = new Date(now);
  nextSunday.setUTCDate(now.getUTCDate() + (daysUntilSunday || 7));
  nextSunday.setUTCHours(2, 0, 0, 0);
  return nextSunday;
}

/**
 * Check cache status on startup
 */
async function checkCacheStatus() {
  try {
    const metadata = await portfolioCacheService.readCacheMetadata();
    const validation = portfolioCacheService.validateCacheAge(metadata);

    console.log("📊 Cache Status:");
    console.log(`  - Last generated: ${metadata.lastGenerated || "Never"}`);
    console.log(`  - Cache age: ${validation.ageDays === Infinity ? "N/A" : `${validation.ageDays} days`}`);
    console.log(`  - Status: ${validation.reason}`);
    console.log(`  - Next scheduled: ${metadata.nextScheduled || "Not scheduled"}`);

    if (!validation.isValid) {
      console.warn(`⚠️  Cache is ${validation.ageDays > metadata.ttlDays ? "stale" : "uninitialized"} - consider triggering manual regeneration`);
    }
  } catch (error) {
    console.error("❌ Failed to check cache status:", error.message);
  }
}

module.exports = {
  initialize,
  triggerCacheRegeneration,
  isWithinSevenDaysOfMonthEnd,
  getNextSundayAt2AM,
};
