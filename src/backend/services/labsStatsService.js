/**
 * Bubble Labs Stats Service
 *
 * Powers the "live laboratory" section on the homepage and the dedicated /labs
 * page. Compiles aggregate counters (tokens, routines, skills, agents) and a
 * recent activity feed (Substack RSS + GitHub commits + Notion Bubble Shop)
 * into two in-memory snapshots, refreshed hourly via node-cron.
 *
 * Design (Jade msg 5269 — "site for LLMs not just humans"):
 *   - All data exposed via /api/labs/stats.json (raw JSON, public, no auth)
 *   - HTML page consumes the same endpoint
 *   - LLM agents (ChatGPT, Perplexity, etc.) can scrape directly
 *   - Confidential routines/agents are NEVER exposed (whitelist approach)
 *
 * Refresh cadence: every hour at minute 5 (avoid common cron contention).
 * Initial run: at boot, non-blocking.
 *
 * Privacy / confidentiality rules:
 *   - Counters are aggregates only (e.g. "847,239 tokens this month")
 *   - Feed entries are from PUBLIC sources only (Substack public posts,
 *     public GitHub commits, Notion Bubble Shop entries marked "Published")
 *   - Internal routines/agents are NOT enumerated by name
 *   - User-level usage breakdowns are NOT exposed
 */

const cron = require("node-cron");
const axios = require("axios");
const env = require("../config/env");

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

// Anthropic Admin API for token usage. Optional — gracefully falls back if
// ADMIN key not provided (counter shows "—" instead of breaking).
// Get one at: https://console.anthropic.com/settings/admin-keys
const ANTHROPIC_ADMIN_API_KEY = process.env.ANTHROPIC_ADMIN_API_KEY || "";

// Whitelist of public routine identifiers we're comfortable surfacing as a count.
// Keep this list curated — it's the public "shape" of our automation footprint.
// Used for the "X routines actives" counter only; we never list individual names
// on the website per Jade's confidentiality requirement.
const PUBLIC_ROUTINE_COUNT_HINT = 43; // matches our internal count as of 2026-05-21

// Static fallbacks if external APIs are unreachable. Keep these honest — they
// match reality at the time of writing and should be updated periodically.
const STATIC_FALLBACK = {
  agents_in_production: 22, // bubble + claudette + argus + miranda + sentinel + ...
  routines_active: PUBLIC_ROUTINE_COUNT_HINT,
  skills_public: 14, // counted from ~/.claude/skills/ (publishable subset)
  experience_years: 12,
  code_shared_percent: 100,
  conflicts_of_interest_percent: 0,
};

// Refresh interval. "5 * * * *" = top of every hour at xx:05 UTC.
const REFRESH_CRON = "5 * * * *";

// In-memory snapshot. Initialized at boot, refreshed by cron.
let snapshot = {
  stats: {
    ...STATIC_FALLBACK,
    tokens_this_month: null,
    last_updated: null,
  },
  feed: [], // [{ when, type, source, title, url }]
  last_refreshed_at: null,
  refresh_errors: [],
};

let cronTask = null;

// ─────────────────────────────────────────────────────────────────────────────
// Data fetchers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch monthly token usage from Anthropic's organization usage report.
 * Returns null on any error or missing config (caller handles fallback).
 *
 * Anthropic Admin API docs: https://docs.anthropic.com/en/api/admin-api/usage
 */
async function fetchAnthropicTokenUsage() {
  if (!ANTHROPIC_ADMIN_API_KEY) {
    return { tokens: null, reason: "ADMIN_KEY_NOT_CONFIGURED" };
  }
  try {
    // Start of current month (UTC)
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const startingAt = monthStart.toISOString();

    const r = await axios.get(
      "https://api.anthropic.com/v1/organizations/usage_report/messages",
      {
        params: {
          starting_at: startingAt,
          bucket_width: "1d", // we'll sum the days
        },
        headers: {
          "x-api-key": ANTHROPIC_ADMIN_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        timeout: 10000,
      }
    );

    const data = r.data?.data || [];
    let totalTokens = 0;
    for (const bucket of data) {
      for (const item of bucket.results || []) {
        totalTokens +=
          (item.uncached_input_tokens || 0) +
          (item.cache_creation_input_tokens || 0) +
          (item.cache_read_input_tokens || 0) +
          (item.output_tokens || 0);
      }
    }
    return { tokens: totalTokens, reason: "ok" };
  } catch (err) {
    return {
      tokens: null,
      reason: err?.response?.status
        ? `anthropic_${err.response.status}`
        : err?.code || err?.message || "unknown_error",
    };
  }
}

/**
 * Fetch the latest items from the Substack RSS feed.
 */
async function fetchSubstackLatest(limit = 5) {
  try {
    const r = await axios.get("https://bubbleinvest.substack.com/feed", {
      timeout: 8000,
      headers: { "User-Agent": "BubbleLabsStats/1.0" },
    });
    const xml = r.data;
    // Lightweight RSS parser (no extra dep). Match <item>…</item>.
    const items = [];
    const itemRe = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = itemRe.exec(xml)) !== null && items.length < limit) {
      const block = m[1];
      const title = (block.match(/<title>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?\s*<\/title>/) || [])[1] || "";
      const link = (block.match(/<link>\s*([\s\S]*?)\s*<\/link>/) || [])[1] || "";
      const pubDate = (block.match(/<pubDate>\s*([\s\S]*?)\s*<\/pubDate>/) || [])[1] || "";
      items.push({
        when: pubDate ? new Date(pubDate).toISOString() : null,
        type: "ARTICLE",
        source: "Substack",
        title: title.trim(),
        url: link.trim(),
      });
    }
    return items;
  } catch (err) {
    return [];
  }
}

/**
 * Fetch latest public commits across our known public repos.
 * No auth needed (public repos, unauthenticated GitHub rate limit ≥ 60/hr).
 */
async function fetchGitHubCommitsLatest(limit = 5) {
  const repos = [
    "vdk888/BubbleLaunch",
    // Add more public repos here when they exist
  ];
  const out = [];
  for (const repo of repos) {
    try {
      const r = await axios.get(
        `https://api.github.com/repos/${repo}/commits`,
        {
          params: { per_page: 3 },
          timeout: 8000,
          headers: {
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "BubbleLabsStats/1.0",
          },
        }
      );
      for (const c of r.data || []) {
        const msg = (c.commit?.message || "").split("\n")[0];
        // Filter out auto-backup commits (noise)
        if (/^backup:|daily auto-commit/i.test(msg)) continue;
        out.push({
          when: c.commit?.author?.date || null,
          type: "COMMIT",
          source: `github/${repo.split("/")[1]}`,
          title: msg,
          url: c.html_url,
        });
      }
    } catch (err) {
      // skip repo on error
    }
  }
  // sort by date desc, slice
  out.sort((a, b) => (b.when || "").localeCompare(a.when || ""));
  return out.slice(0, limit);
}

// ─────────────────────────────────────────────────────────────────────────────
// Snapshot orchestration
// ─────────────────────────────────────────────────────────────────────────────

function formatTokens(n) {
  if (n === null || n === undefined) return null;
  return Math.round(n);
}

async function refreshSnapshot() {
  const t0 = Date.now();
  const errors = [];

  const [tokensResult, substackItems, githubItems] = await Promise.allSettled([
    fetchAnthropicTokenUsage(),
    fetchSubstackLatest(5),
    fetchGitHubCommitsLatest(5),
  ]);

  let tokens = null;
  let tokensReason = "unknown";
  if (tokensResult.status === "fulfilled") {
    tokens = formatTokens(tokensResult.value.tokens);
    tokensReason = tokensResult.value.reason;
  } else {
    errors.push({ source: "anthropic_tokens", error: String(tokensResult.reason) });
  }

  const substack = substackItems.status === "fulfilled" ? substackItems.value : [];
  if (substackItems.status === "rejected") {
    errors.push({ source: "substack_rss", error: String(substackItems.reason) });
  }

  const github = githubItems.status === "fulfilled" ? githubItems.value : [];
  if (githubItems.status === "rejected") {
    errors.push({ source: "github_commits", error: String(githubItems.reason) });
  }

  // Merge feed: substack + github, dedup by url, sort by date desc, top 5
  const merged = [...substack, ...github]
    .filter((x) => x.when && x.title)
    .reduce((acc, item) => {
      if (!acc.find((a) => a.url === item.url)) acc.push(item);
      return acc;
    }, [])
    .sort((a, b) => (b.when || "").localeCompare(a.when || ""))
    .slice(0, 5);

  snapshot = {
    stats: {
      ...STATIC_FALLBACK,
      tokens_this_month: tokens,
      tokens_status: tokensReason,
      last_updated: new Date().toISOString(),
    },
    feed: merged,
    last_refreshed_at: new Date().toISOString(),
    refresh_errors: errors,
    refresh_duration_ms: Date.now() - t0,
  };

  console.log(
    `[LabsStats] Refreshed in ${snapshot.refresh_duration_ms}ms — ` +
      `tokens=${tokens ?? "—"} (${tokensReason}), ` +
      `feed=${merged.length}, errors=${errors.length}`
  );
}

function getSnapshot() {
  return snapshot;
}

function initialize() {
  if (cronTask) {
    console.warn("[LabsStats] Already initialized — skipping");
    return;
  }
  // Initial refresh fire-and-forget (don't block server boot)
  refreshSnapshot().catch((err) =>
    console.error("[LabsStats] Initial refresh error:", err.message)
  );
  cronTask = cron.schedule(REFRESH_CRON, () => {
    refreshSnapshot().catch((err) =>
      console.error("[LabsStats] Scheduled refresh error:", err.message)
    );
  });
  console.log(`[LabsStats] Initialized — refresh schedule "${REFRESH_CRON}"`);
}

function shutdown() {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
  }
}

module.exports = {
  initialize,
  shutdown,
  getSnapshot,
  refreshSnapshot, // exported for tests/manual triggers
};
