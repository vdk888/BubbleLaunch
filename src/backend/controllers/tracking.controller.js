/**
 * Tracking Controller — Server-side conversion event endpoints
 *
 * Receives events from the browser (Pixel + GA4 + Google Ads tags fire client-side),
 * and forwards them to Meta CAPI server-side for dual tracking + dedup.
 *
 * The browser sends an `event_id` (UUID v4) generated client-side; we forward the
 * SAME event_id to Meta CAPI so the two sources are deduplicated within Meta's 48h window.
 *
 * Privacy & GDPR (PR #10 context — Jade 2026-05-17):
 *   - The browser only POSTs events AFTER the user opted in to marketing cookies via the banner.
 *   - We hash all PII (em, ph, fn, ln) SHA-256 before sending to Meta.
 *   - We log events without PII for debugging.
 *   - Privacy page must document Meta CAPI (separate from Pixel) — backlog SP7.
 */

const metaCapi = require("../services/metaCapiService");
const env = require("../config/env");

const SUPPORTED_EVENTS = new Set([
  "PageView",
  "ViewContent",
  "Lead",
  "Schedule",
  "Contact",
  "CompleteRegistration",
]);

/**
 * POST /api/tracking/capi/event
 *
 * Body:
 *   {
 *     event_name: "Lead",            // required, must be in SUPPORTED_EVENTS
 *     event_id: "uuid-v4",            // required, shared with browser Pixel for dedup
 *     event_source_url: "https://bubbleinvest.org/professionnels",
 *     user_data: {                    // optional cleartext (will be hashed)
 *       email: "...", phone: "...",
 *       fbp: "fb.1.xxxx", fbc: "fb.1.xxxx"  // sent unhashed
 *     },
 *     custom_data: {                  // optional Meta custom event fields
 *       value: 200, currency: "EUR",
 *       content_name: "Diagnostic IA"
 *     }
 *   }
 *
 * Returns: { success, eventsReceived, fbtrace_id?, error? }
 */
async function postCapiEvent(req, res) {
  try {
    const {
      event_name,
      event_id,
      event_source_url,
      user_data = {},
      custom_data = {},
    } = req.body || {};

    // Validation
    if (!event_name || typeof event_name !== "string") {
      return res.status(400).json({ success: false, error: "Missing or invalid event_name" });
    }
    if (!SUPPORTED_EVENTS.has(event_name)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported event_name '${event_name}'. Allowed: ${[...SUPPORTED_EVENTS].join(", ")}`,
      });
    }
    if (!event_id || typeof event_id !== "string") {
      return res.status(400).json({ success: false, error: "Missing or invalid event_id (required for dedup)" });
    }

    // Auto-enrich user_data with request metadata (IP + User-Agent) for better EMQ
    const enrichedUserData = {
      ...user_data,
      client_ip_address: user_data.client_ip_address || getClientIp(req),
      client_user_agent: user_data.client_user_agent || req.get("User-Agent"),
    };

    // Send to CAPI
    const result = await metaCapi.sendEvent(event_name, {
      event_id,
      event_source_url: event_source_url || req.get("Referer"),
      user_data: enrichedUserData,
      custom_data,
      action_source: "website",
    });

    // Lightweight logging (no PII)
    const logCtx = `[capi] event=${event_name} event_id=${event_id.slice(0, 8)}…`;
    if (result.success) {
      console.log(`${logCtx} ✓ received=${result.eventsReceived} fbtrace=${result.fbtrace_id || "-"}`);
    } else {
      console.warn(`${logCtx} ✗ error="${result.error}" status=${result.status || "-"}`);
    }

    // Always 200 to the browser (even on CAPI failure) so we don't disrupt UX.
    // Status code reflects whether Meta accepted; payload shape is consistent.
    return res.json(result);
  } catch (err) {
    console.error("[capi] postCapiEvent fatal:", err.message);
    return res.status(500).json({ success: false, error: "Internal error processing event" });
  }
}

/**
 * GET /api/tracking/capi/health
 *
 * Lightweight diagnostic to confirm CAPI is wired (token + pixel ID present).
 * Does NOT call Graph API; just reports config state.
 */
function getCapiHealth(req, res) {
  const configured = metaCapi.isConfigured();
  return res.json({
    configured,
    pixel_id: configured ? env.META_PIXEL_ID : null,
    graph_api_version: env.META_GRAPH_API_VERSION,
    test_event_code_present: !!env.META_TEST_EVENT_CODE,
  });
}

/**
 * Best-effort client IP extraction (handles proxies via X-Forwarded-For).
 */
function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (xff) {
    // Take the first IP in the chain (the real client)
    return String(xff).split(",")[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || null;
}

module.exports = {
  postCapiEvent,
  getCapiHealth,
};
