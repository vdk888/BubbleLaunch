/**
 * OpenRouter Warmup Service
 *
 * Problem (observed 2026-05-19, Jade msg 5207):
 *   Free OpenRouter models (Llama 70B, Qwen, Nemotron, etc.) are not "kept hot"
 *   by the provider. Each cold start adds 9-13s of latency BEFORE the first
 *   token streams. With our 8s per-model timeout, this also triggers cascade
 *   fallbacks → first user message of a session waits 10-25s.
 *
 * Fix: send a tiny "ping" completion to each model at boot time + every 4 minutes
 * to keep them warm. OpenRouter free tier doesn't charge for this, and the
 * payload is intentionally minimal (1 token max output, 4-character prompt).
 *
 * Expected impact:
 *   - First user message of a session: TTFB drops from 9-13s to <2s
 *   - Background cost: ~7 requests every 4 min = ~100 requests/hour, zero cost
 *
 * If OpenRouter changes their cold-start behavior (e.g. starts charging for
 * pings, or models become consistently hot without warmup), remove this service
 * by deleting the `initialize()` call in server.js.
 */

const axios = require("axios");
const env = require("../config/env");

// Warmup interval — 4 min keeps models hot without flooding OpenRouter.
// (Their cold-start window for free models appears to be ~5-10 min idle.)
const WARMUP_INTERVAL_MS = 4 * 60 * 1000;

// Per-ping timeout. Pings should be <2s when models are warm; >5s means cold.
const PING_TIMEOUT_MS = 6000;

// Models to keep warm (mirror of `models` in chat.controller.js).
// Kept in sync manually — if you add a model to the chat rotation, add it here too.
const MODELS_TO_WARMUP = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "stepfun/step-3.5-flash:free",
  "qwen/qwen3.6-plus-preview:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "arcee-ai/trinity-large-preview:free",
];

let warmupTimer = null;
const stats = {
  totalPings: 0,
  totalSuccess: 0,
  totalErrors: 0,
  lastRunAt: null,
  lastRunDurationsMs: {},
};

/**
 * Send a minimal completion request to wake up a single model.
 * Returns { model, ok, latencyMs, error }.
 */
async function pingModel(model) {
  const t0 = Date.now();
  try {
    const abortCtrl = new AbortController();
    const timer = setTimeout(() => abortCtrl.abort(), PING_TIMEOUT_MS);
    await axios({
      method: "post",
      url: "https://openrouter.ai/api/v1/chat/completions",
      data: {
        model,
        // Tiny payload — keeps the model warm without burning tokens
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 1,
        stream: false,
      },
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: abortCtrl.signal,
      timeout: PING_TIMEOUT_MS,
    });
    clearTimeout(timer);
    const latencyMs = Date.now() - t0;
    return { model, ok: true, latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - t0;
    const reason =
      err?.response?.status ||
      (err?.code === "ERR_CANCELED" ? "timeout" : err?.code || err?.message);
    return { model, ok: false, latencyMs, error: String(reason) };
  }
}

/**
 * Ping all models in parallel. One slow/down model doesn't block the others.
 */
async function warmupAllModels() {
  if (!env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY === "YOUR_API_KEY_HERE") {
    console.log("[OpenRouterWarmup] Skipping — OPENROUTER_API_KEY not set");
    return;
  }
  const t0 = Date.now();
  const results = await Promise.allSettled(
    MODELS_TO_WARMUP.map((m) => pingModel(m))
  );
  const summary = { ok: 0, err: 0, durations: {} };
  for (const r of results) {
    if (r.status === "fulfilled") {
      stats.totalPings += 1;
      if (r.value.ok) {
        summary.ok += 1;
        stats.totalSuccess += 1;
      } else {
        summary.err += 1;
        stats.totalErrors += 1;
      }
      summary.durations[r.value.model] = r.value.latencyMs;
    } else {
      summary.err += 1;
      stats.totalErrors += 1;
    }
  }
  stats.lastRunAt = new Date().toISOString();
  stats.lastRunDurationsMs = summary.durations;
  const totalMs = Date.now() - t0;
  console.log(
    `[OpenRouterWarmup] Pinged ${MODELS_TO_WARMUP.length} models in ${totalMs}ms (ok=${summary.ok}, err=${summary.err})`
  );
}

/**
 * Initialize the warmup loop. Call once at server boot.
 * - Runs a warmup immediately (non-blocking — fire & forget)
 * - Schedules a recurring warmup every WARMUP_INTERVAL_MS
 */
function initialize() {
  if (warmupTimer) {
    console.warn("[OpenRouterWarmup] Already initialized — skipping");
    return;
  }
  // Fire & forget initial warmup so server.listen() resolves fast
  warmupAllModels().catch((err) =>
    console.error("[OpenRouterWarmup] Initial warmup error:", err.message)
  );
  warmupTimer = setInterval(() => {
    warmupAllModels().catch((err) =>
      console.error("[OpenRouterWarmup] Scheduled warmup error:", err.message)
    );
  }, WARMUP_INTERVAL_MS);
  console.log(
    `[OpenRouterWarmup] Initialized — warming ${MODELS_TO_WARMUP.length} models every ${WARMUP_INTERVAL_MS / 1000}s`
  );
}

function shutdown() {
  if (warmupTimer) {
    clearInterval(warmupTimer);
    warmupTimer = null;
  }
}

function getStats() {
  return { ...stats, modelsTracked: MODELS_TO_WARMUP };
}

module.exports = { initialize, shutdown, getStats, pingModel, warmupAllModels };
