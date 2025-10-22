#!/usr/bin/env node

/**
 * Portfolio cache regeneration script
 * Generates multi-period snapshots and writes them to the backend cache directory.
 */

const portfolioCacheService = require("../src/backend/services/portfolioCacheService");

async function main() {
  try {
    console.log("📊 Generating portfolio cache snapshots...");
    const snapshots = await portfolioCacheService.generateSnapshots();
    const { defaultPath, multiPath } =
      await portfolioCacheService.writeSnapshotsToDisk(snapshots);

    const periods = Object.keys(snapshots.periods)
      .map(Number)
      .sort((a, b) => a - b);

    console.log(
      `✅ Cache updated for periods: ${periods.join(", ")} years\n` +
        `   • Default cache: ${defaultPath}\n` +
        `   • Multi-period cache: ${multiPath}`
    );
  } catch (error) {
    console.error("❌ Failed to generate portfolio cache snapshots:", error);
    process.exit(1);
  }
}

main();
