/**
 * Meta Conversions API (CAPI) Service
 *
 * Server-side companion to the Meta Pixel installed on bubbleinvest.org.
 * Sends conversion events directly to Meta's Graph API, bypassing browser
 * limitations (ITP, ad blockers, iOS 14.5+ tracking restrictions).
 *
 * Events are deduplicated against the browser Pixel using a shared `event_id`.
 *
 * Setup context (Jade msg 5085-5163, 2026-05-18):
 *   - Meta App: Bubble Invest ads (App ID 943511705337623)
 *   - System User: bubblecapi (long-lived token, never expires)
 *   - Pixel: 1553953629409728 (also acts as Dataset ID in modern Meta API)
 *   - Ad Account: act_883947750258546
 *   - Token + IDs loaded from SOPS-encrypted secrets.sops.env
 *
 * Best practice 2026 (sources: Meta CAPI docs, Triple Whale, ingestlabs):
 *   - Dual tracking (Pixel + CAPI) with shared event_id for dedup
 *   - SHA-256 hashing of all PII before sending (em, ph, fn, ln, ge, db, ct, st, country)
 *   - 48h dedup window — Meta will merge same event_name + event_id from both sources
 *   - Event Match Quality (EMQ) target: ≥ 6.0 (visible in Events Manager)
 *   - Retry with exponential backoff on 5xx/timeout
 *
 * Public API:
 *   - sendEvent(eventName, payload) → promise<{ success, eventsReceived, error? }>
 *   - hashUserData(userData) → SHA-256 normalized + hashed object
 *   - isConfigured() → boolean
 */

const crypto = require("crypto");
const env = require("../config/env");

const GRAPH_API_BASE = "https://graph.facebook.com";

/**
 * Normalize then SHA-256 hash a PII string per Meta's spec.
 * Returns null for empty/undefined values.
 *
 * Normalization rules (Meta docs):
 *   - email: lowercase + trim
 *   - phone: digits only, prepend country code if missing
 *   - first/last name: lowercase, trim, remove special chars
 *   - city/state/country: lowercase, trim
 *   - gender: 'f' or 'm' lowercase
 *   - date of birth: YYYYMMDD format
 */
function sha256(input) {
  if (input === null || input === undefined || input === "") return null;
  const str = String(input).trim();
  if (str === "") return null;
  return crypto.createHash("sha256").update(str).digest("hex");
}

function normalizeEmail(email) {
  if (!email) return null;
  return String(email).trim().toLowerCase();
}

function normalizePhone(phone) {
  if (!phone) return null;
  // Strip all non-digits
  return String(phone).replace(/\D/g, "");
}

function normalizeName(name) {
  if (!name) return null;
  return String(name).trim().toLowerCase().replace(/[^a-zÀ-ɏ]/g, "");
}

function normalizeCity(city) {
  if (!city) return null;
  return String(city).trim().toLowerCase().replace(/\s+/g, "");
}

function normalizeCountry(country) {
  if (!country) return null;
  // Meta expects 2-letter ISO code, lowercase
  return String(country).trim().toLowerCase().slice(0, 2);
}

/**
 * Hash user data per Meta's specification.
 * Accepts an object with cleartext fields; returns an object with hashed values.
 *
 * Special unhashed fields (Meta accepts them raw):
 *   - client_ip_address, client_user_agent, fbc, fbp, external_id (id user-provided)
 *
 * @param {object} userData - Cleartext user data
 * @returns {object} Object with hashed values, suitable for Graph API payload
 */
function hashUserData(userData = {}) {
  const hashed = {};

  // PII fields (must be normalized then hashed)
  if (userData.email) hashed.em = sha256(normalizeEmail(userData.email));
  if (userData.phone) hashed.ph = sha256(normalizePhone(userData.phone));
  if (userData.first_name || userData.fn) hashed.fn = sha256(normalizeName(userData.first_name || userData.fn));
  if (userData.last_name || userData.ln) hashed.ln = sha256(normalizeName(userData.last_name || userData.ln));
  if (userData.city || userData.ct) hashed.ct = sha256(normalizeCity(userData.city || userData.ct));
  if (userData.state || userData.st) hashed.st = sha256(normalizeCity(userData.state || userData.st));
  if (userData.country) hashed.country = sha256(normalizeCountry(userData.country));
  if (userData.zip || userData.zp) hashed.zp = sha256(String(userData.zip || userData.zp).trim().toLowerCase().replace(/\s+/g, ""));
  if (userData.gender || userData.ge) hashed.ge = sha256(String(userData.gender || userData.ge).trim().toLowerCase().slice(0, 1));
  if (userData.dob || userData.db) hashed.db = sha256(String(userData.dob || userData.db).replace(/\D/g, ""));

  // Unhashed fields (Meta accepts raw)
  if (userData.client_ip_address) hashed.client_ip_address = userData.client_ip_address;
  if (userData.client_user_agent) hashed.client_user_agent = userData.client_user_agent;
  if (userData.fbc) hashed.fbc = userData.fbc; // Click ID from URL ?fbclid=
  if (userData.fbp) hashed.fbp = userData.fbp; // Browser Pixel ID cookie
  if (userData.external_id) hashed.external_id = sha256(String(userData.external_id).trim().toLowerCase());

  // Remove null/undefined entries (Meta rejects them)
  return Object.fromEntries(
    Object.entries(hashed).filter(([_, v]) => v !== null && v !== undefined)
  );
}

/**
 * Build a CAPI event payload per Meta's spec.
 *
 * @param {string} eventName - Standard event (PageView, ViewContent, Lead, Schedule, Contact)
 * @param {object} opts - Event options
 * @param {string} opts.event_id - REQUIRED for dedup with Pixel
 * @param {string} opts.event_source_url - URL of the page where the event occurred
 * @param {number} opts.event_time - Unix timestamp in seconds (default: now)
 * @param {string} opts.action_source - 'website' | 'app' | 'email' | etc. (default: 'website')
 * @param {object} opts.user_data - Cleartext PII to hash (em, ph, fn, ln, etc.)
 * @param {object} opts.custom_data - Custom fields (value, currency, content_name, etc.)
 * @returns {object} Event payload ready to send
 */
function buildEvent(eventName, opts = {}) {
  const event = {
    event_name: eventName,
    event_time: opts.event_time || Math.floor(Date.now() / 1000),
    event_id: opts.event_id, // CRITICAL for dedup with Pixel
    event_source_url: opts.event_source_url,
    action_source: opts.action_source || "website",
    user_data: hashUserData(opts.user_data || {}),
  };

  if (opts.custom_data && Object.keys(opts.custom_data).length > 0) {
    event.custom_data = opts.custom_data;
  }

  // Remove empty user_data if no PII at all (Meta still accepts but EMQ will be 0)
  if (Object.keys(event.user_data).length === 0) {
    // Keep an empty object — Meta allows it but logs a warning
  }

  return event;
}

/**
 * Send one or more events to Meta Conversions API.
 *
 * @param {object[]} events - Array of event payloads (from buildEvent)
 * @param {object} [opts]
 * @param {string} [opts.test_event_code] - Override the env test code (for debug)
 * @returns {Promise<object>} { success, eventsReceived, fbtrace_id, error? }
 */
async function sendEvents(events, opts = {}) {
  if (!isConfigured()) {
    return {
      success: false,
      error: "Meta CAPI not configured (missing META_SYSTEM_USER_TOKEN or META_PIXEL_ID)",
    };
  }

  const url = `${GRAPH_API_BASE}/${env.META_GRAPH_API_VERSION}/${env.META_PIXEL_ID}/events`;
  const body = {
    data: events,
    access_token: env.META_SYSTEM_USER_TOKEN,
  };

  const testCode = opts.test_event_code || env.META_TEST_EVENT_CODE;
  if (testCode) {
    body.test_event_code = testCode;
  }

  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        // Node 18+ has native fetch; no extra dep needed
      });

      const json = await response.json();

      if (!response.ok) {
        // 4xx errors: do not retry (auth, validation, etc.)
        if (response.status >= 400 && response.status < 500) {
          return {
            success: false,
            status: response.status,
            error: json.error?.message || `HTTP ${response.status}`,
            fbtrace_id: json.error?.fbtrace_id,
          };
        }
        // 5xx: retry with exponential backoff
        lastError = `HTTP ${response.status}: ${json.error?.message || "Server error"}`;
        await sleep(500 * Math.pow(2, attempt)); // 500ms, 1000ms, 2000ms
        continue;
      }

      return {
        success: true,
        eventsReceived: json.events_received,
        fbtrace_id: json.fbtrace_id,
        messages: json.messages,
      };
    } catch (err) {
      lastError = err.message;
      // Network error: retry
      if (attempt < maxRetries - 1) {
        await sleep(500 * Math.pow(2, attempt));
      }
    }
  }

  return {
    success: false,
    error: `Failed after ${maxRetries} attempts: ${lastError}`,
  };
}

/**
 * Convenience wrapper: send a single event.
 *
 * @param {string} eventName - Standard event name
 * @param {object} opts - Same as buildEvent
 * @returns {Promise<object>}
 */
async function sendEvent(eventName, opts = {}) {
  const event = buildEvent(eventName, opts);
  return sendEvents([event], { test_event_code: opts.test_event_code });
}

/**
 * Check if CAPI is configured (token + pixel ID present).
 */
function isConfigured() {
  return !!(env.META_SYSTEM_USER_TOKEN && env.META_PIXEL_ID);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  sendEvent,
  sendEvents,
  buildEvent,
  hashUserData,
  isConfigured,
};
