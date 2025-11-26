const cron = require("node-cron");
const { Client } = require("@notionhq/client");

// Reuse existing Notion credentials for the blog database
const blogApiKey = process.env.NOTION_BLOG_API_KEY;
const blogDatabaseId = process.env.NOTION_BLOG_DATABASE_ID;

const isConfigured = Boolean(blogApiKey && blogDatabaseId);
const notion = isConfigured ? new Client({ auth: blogApiKey }) : null;

/**
 * Run a single sweep: move posts from Scheduled to Published when their Publication Date is past (UTC).
 */
async function runScheduledToPublishedSweep() {
  const nowIso = new Date().toISOString();

  if (!isConfigured) {
    console.warn("⚠️  Blog Notion credentials are not set; skipping status sync.");
    return { updated: 0, skipped: 0, reason: "not_configured" };
  }

  try {
    const response = await notion.databases.query({
      database_id: blogDatabaseId,
      filter: {
        and: [
          {
            property: "Status",
            select: { equals: "Scheduled" },
          },
          {
            property: "Publication Date",
            date: { on_or_before: nowIso },
          },
        ],
      },
    });

    const pagesToUpdate = response.results || [];

    if (pagesToUpdate.length === 0) {
      console.log(`🗓️  Status sync at ${nowIso}: no posts to update.`);
      return { updated: 0, skipped: 0, reason: "no_matches" };
    }

    await Promise.all(
      pagesToUpdate.map((page) =>
        notion.pages.update({
          page_id: page.id,
          properties: {
            Status: { select: { name: "Published" } },
          },
        })
      )
    );

    console.log(
      `✅ Status sync at ${nowIso}: updated ${pagesToUpdate.length} posts from Scheduled -> Published.`
    );

    return { updated: pagesToUpdate.length, skipped: 0, reason: "updated" };
  } catch (error) {
    console.error(`❌ Status sync failed at ${nowIso}:`, error.message);
    return { updated: 0, skipped: 0, reason: "error", error: error.message };
  }
}

/**
 * Initialize cron to run hourly (top of the hour, UTC).
 */
function initialize() {
  if (!isConfigured) {
    console.warn("⚠️  Blog Notion credentials are not set; status sync cron not started.");
    return;
  }

  // Cron format: m h dom mon dow — "0 * * * *" = every hour at minute 0 (UTC)
  const schedule = "0 * * * *";

  cron.schedule(
    schedule,
    () => {
      runScheduledToPublishedSweep();
    },
    { timezone: "UTC" }
  );

  console.log("✅ Blog status sync scheduler initialized (runs hourly, UTC).");
}

module.exports = {
  initialize,
  runScheduledToPublishedSweep,
};
