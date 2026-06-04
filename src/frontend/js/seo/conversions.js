/**
 * Bubble Tracking — Unified conversion tracking with Meta Pixel + CAPI + GA4 + Google Ads
 *
 * Generates a shared event_id (UUID v4) that's used both client-side (Pixel) and
 * server-side (CAPI) so Meta deduplicates the two sources within its 48h window.
 *
 * Architecture:
 *
 *   [Browser]                           [Server BubbleLaunch]              [Meta CAPI]
 *     Pixel fbq('track', name) ────────────────────────────────────────────► Browser source
 *     + event_id (UUID v4)             POST /api/tracking/capi/event
 *                                      ├─ Hash PII (em, ph, fn, ln, etc.) ──► CAPI source
 *                                      ├─ SAME event_id → dedup
 *                                      └─ Returns success
 *     fbq('track', name) fires        After server ack (or in parallel)
 *
 * Public API (window.BubbleTracking):
 *
 *   trackPageView()         — Fire PageView in Pixel + CAPI (called by cookie-banner after marketing opt-in)
 *   trackLead(userData?)    — Fire Lead event (e.g. user clicked CTA Calendly)
 *   trackSchedule(userData?)— Fire Schedule event (user confirmed RDV via Calendly embed)
 *   trackContact(userData?) — Fire Contact event (form submission)
 *   trackGoogleAdsConversion(value?) — Fire Google Ads conversion 'RDV Diagnostic IA'
 *
 * Privacy:
 *   - Nothing fires before marketing consent (cookie-banner enforces gating)
 *   - Server hashes PII before sending to Meta (SHA-256)
 *   - event_id is regenerated per page load (not stored long-term)
 *
 * Configuration (read from <meta> tags or window.BUBBLE_TRACKING_CONFIG):
 *   - META_PIXEL_ID (from inline Pixel snippet)
 *   - GOOGLE_ADS_CONVERSION_ID (from window.BUBBLE_TRACKING_CONFIG.googleAdsConversionId)
 *   - GOOGLE_ADS_CONVERSION_LABEL (from same)
 */

(function (global) {
  'use strict';

  // ─── Configuration ────────────────────────────────────────────────────────

  const CONFIG = global.BUBBLE_TRACKING_CONFIG || {
    googleAdsConversionId: 'AW-18054203382',
    googleAdsConversionLabel: '4Ti9CMLcqq8cEPaP9aBD',
    googleAdsConversionValueEUR: 200,
    ga4MeasurementId: 'G-T0MQEL0ZG0',
    capiEndpoint: '/api/tracking/capi/event',
  };

  // ─── UUID v4 generator (no external dependency) ───────────────────────────

  function uuidv4() {
    // Use crypto.randomUUID if available (modern browsers, Node 19+)
    if (global.crypto && typeof global.crypto.randomUUID === 'function') {
      return global.crypto.randomUUID();
    }
    // Fallback: manual UUID v4 generation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // ─── Cookie helpers (read fbp/fbc from Meta-managed cookies) ──────────────

  function getCookie(name) {
    const re = new RegExp('(?:^|;\\s*)' + name + '=([^;]*)');
    const match = document.cookie.match(re);
    return match ? decodeURIComponent(match[1]) : null;
  }

  /**
   * Get Meta Pixel _fbp cookie (browser ID) and _fbc cookie (click ID from URL ?fbclid).
   * These are crucial for EMQ (Event Match Quality) ≥ 6.0.
   */
  function getFbCookies() {
    return {
      fbp: getCookie('_fbp'),
      fbc: getCookie('_fbc'),
    };
  }

  // ─── Server-side CAPI forwarding ──────────────────────────────────────────

  /**
   * POST the event to BubbleLaunch CAPI endpoint, which then forwards to Meta Graph API.
   * Fire-and-forget; doesn't block UX.
   */
  function sendToCapi(eventName, eventId, opts = {}) {
    const fbCookies = getFbCookies();

    const payload = {
      event_name: eventName,
      event_id: eventId,
      event_source_url: opts.event_source_url || global.location.href,
      user_data: {
        // PII (will be hashed server-side)
        email: opts.email || undefined,
        phone: opts.phone || undefined,
        first_name: opts.firstName || undefined,
        last_name: opts.lastName || undefined,
        // Meta cookies (unhashed)
        fbp: fbCookies.fbp || undefined,
        fbc: fbCookies.fbc || undefined,
      },
      custom_data: opts.customData || {},
    };

    // navigator.sendBeacon for unload-safe delivery if available, else fetch keepalive
    const json = JSON.stringify(payload);
    if (navigator.sendBeacon && opts.useBeacon !== false) {
      const blob = new Blob([json], { type: 'application/json' });
      navigator.sendBeacon(CONFIG.capiEndpoint, blob);
      return Promise.resolve({ success: true, transport: 'beacon' });
    }

    return fetch(CONFIG.capiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: json,
      keepalive: true,
      credentials: 'same-origin',
    })
      .then((r) => r.json())
      .catch((err) => ({ success: false, error: String(err) }));
  }

  // ─── Tracking primitives ──────────────────────────────────────────────────

  /**
   * Internal: fire an event on both Pixel (client) and CAPI (server) with a shared event_id.
   *
   * @param {string} eventName - Meta standard event (PageView, Lead, Schedule, Contact, etc.)
   * @param {object} opts - { customData, email, phone, firstName, lastName }
   * @returns {string} event_id used (caller can stash if needed)
   */
  function fireDualTracking(eventName, opts = {}) {
    const eventId = opts.eventId || uuidv4();

    // 1. Client-side Pixel (Meta browser source)
    if (typeof global.fbq === 'function') {
      const fbqPayload = opts.customData ? { ...opts.customData, eventID: eventId } : { eventID: eventId };
      // Note: Meta Pixel expects `eventID` (camelCase) for dedup on client side
      // and `event_id` (snake_case) on server side — they're the same value.
      try {
        global.fbq('track', eventName, opts.customData || {}, { eventID: eventId });
      } catch (err) {
        console.warn('[Tracking] fbq error:', err.message);
      }
    } else {
      console.log('[Tracking] fbq not available; skipping Pixel for', eventName);
    }

    // 2. Server-side CAPI (Meta server source, deduplicated via event_id)
    sendToCapi(eventName, eventId, opts).then((result) => {
      if (result && result.success) {
        console.log('[Tracking] CAPI:', eventName, eventId.slice(0, 8) + '…', '✓');
      } else {
        console.warn('[Tracking] CAPI failed:', eventName, result);
      }
    });

    // 3. GA4 (Google Analytics 4) — give the analytics funnel visibility of the
    //    lead/booking steps (visite → lead → RDV). Meta + Google Ads already get
    //    these via the calls above; GA4 was previously blind to them.
    //    Routed with send_to the GA4 stream so the Google Ads tag (AW-…) isn't
    //    spammed with non-conversion events. PageView is skipped — the GA4 config
    //    tag already emits page_view, so re-emitting would double-count.
    if (typeof global.gtag === 'function') {
      const GA4_EVENT_NAME = { Lead: 'generate_lead', Schedule: 'book_meeting', Contact: 'contact' };
      const ga4Name = GA4_EVENT_NAME[eventName];
      if (ga4Name && CONFIG.ga4MeasurementId) {
        try {
          global.gtag('event', ga4Name, {
            send_to: CONFIG.ga4MeasurementId,
            currency: (opts.customData && opts.customData.currency) || 'EUR',
            value: (opts.customData && opts.customData.value) || undefined,
            // Reuse the Meta event_id so a lead can be cross-referenced across tools.
            event_id: eventId,
          });
          console.log('[Tracking] GA4:', ga4Name, '✓');
        } catch (err) {
          console.warn('[Tracking] gtag GA4 event error:', err.message);
        }
      }
    }

    return eventId;
  }

  // ─── Public tracking API ──────────────────────────────────────────────────

  const BubbleTracking = {
    /**
     * Fire PageView dual tracking.
     * Called by cookie-banner.js when user opts in to marketing cookies.
     * Idempotent across the page load (won't double-fire if called twice).
     */
    _pageViewFired: false,
    trackPageView() {
      if (this._pageViewFired) {
        console.log('[Tracking] PageView already fired this page load — skipping');
        return null;
      }
      this._pageViewFired = true;
      return fireDualTracking('PageView', {
        customData: {
          page_title: document.title,
          page_path: global.location.pathname,
        },
      });
    },

    /**
     * Fire Lead event — user expressed interest (e.g. clicked CTA Calendly link).
     * @param {object} userData - { email?, phone?, firstName?, lastName? }
     */
    trackLead(userData = {}) {
      return fireDualTracking('Lead', {
        ...userData,
        customData: {
          content_name: 'Diagnostic IA',
          value: CONFIG.googleAdsConversionValueEUR,
          currency: 'EUR',
        },
      });
    },

    /**
     * Fire Schedule event — user confirmed an RDV via Calendly embed.
     * Best event for B2B lead conversion tracking.
     * Triggered by listening to Calendly's 'calendly.event_scheduled' postMessage.
     *
     * @param {object} userData - { email?, phone?, firstName?, lastName? }
     */
    trackSchedule(userData = {}) {
      return fireDualTracking('Schedule', {
        ...userData,
        customData: {
          content_name: 'RDV Diagnostic IA',
          value: CONFIG.googleAdsConversionValueEUR,
          currency: 'EUR',
        },
      });
    },

    /**
     * Fire Contact event — user filled the business contact form.
     */
    trackContact(userData = {}) {
      return fireDualTracking('Contact', {
        ...userData,
        customData: {
          content_name: 'Business contact form',
        },
      });
    },

    /**
     * Fire CompleteRegistration — user subscribed to the newsletter.
     * Dual Pixel + CAPI with a shared event_id; pass the subscriber email so the
     * server can hash it for high Event Match Quality. Secondary campaign signal
     * (the primary objective is the diagnostic booking via trackLead/trackSchedule).
     * @param {object} userData - { email?, firstName?, lastName? }
     */
    trackCompleteRegistration(userData = {}) {
      return fireDualTracking('CompleteRegistration', {
        ...userData,
        customData: {
          content_name: 'Newsletter Behind the Bubble',
        },
      });
    },

    /**
     * Fire Google Ads conversion 'RDV Diagnostic IA'.
     * Separate call (not bundled with fireDualTracking) because Google Ads has its own
     * conversion mechanism via gtag.
     *
     * @param {object} opts
     * @param {number} [opts.value] - Override conversion value (default 200 EUR)
     * @param {function} [opts.callback] - Optional callback after gtag fires (used for redirects)
     */
    trackGoogleAdsConversion(opts = {}) {
      if (typeof global.gtag !== 'function') {
        console.warn('[Tracking] gtag not available — cannot fire Google Ads conversion');
        if (opts.callback) opts.callback();
        return;
      }

      const value = typeof opts.value === 'number' ? opts.value : CONFIG.googleAdsConversionValueEUR;

      const conversionPayload = {
        send_to: CONFIG.googleAdsConversionId + '/' + CONFIG.googleAdsConversionLabel,
        value: value,
        currency: 'EUR',
      };

      if (opts.callback) {
        // Google's recommended pattern for click-with-callback (e.g. CTA Calendly redirect)
        conversionPayload.event_callback = opts.callback;
        // Safety: fire callback after 1s even if gtag hangs
        setTimeout(() => {
          if (opts.callback._fired) return;
          opts.callback._fired = true;
          opts.callback();
        }, 1000);
      }

      global.gtag('event', 'conversion', conversionPayload);
      console.log('[Tracking] Google Ads conversion fired:', value, 'EUR');
    },

    /**
     * One-shot helper for CTA "Réserver mon diagnostic IA" — fires:
     *   - Lead (Meta Pixel + CAPI server-side)
     *   - Conversion (Google Ads)
     * Pattern: attach to onclick of the CTA button with `event.preventDefault()` then redirect after.
     *
     * @param {string} url - Calendly URL to redirect to after tracking
     * @param {object} [userData] - { email?, phone?, etc. } if known
     * @returns {boolean} false (for inline onclick handlers)
     */
    trackCtaClickThenRedirect(url, userData = {}) {
      // Fire Meta Lead (dual Pixel + CAPI)
      try {
        this.trackLead(userData);
      } catch (err) {
        console.warn('[Tracking] trackLead failed:', err.message);
      }

      // Fire Google Ads conversion with redirect callback
      this.trackGoogleAdsConversion({
        callback: function () {
          if (url) {
            global.location.href = url;
          }
        },
      });

      return false; // prevent default form/link behavior; redirect happens in callback
    },

    /**
     * Listen for Calendly embed's `calendly.event_scheduled` postMessage to fire Schedule.
     * Should be called once per page (idempotent).
     */
    _calendlyListenerAttached: false,
    listenForCalendlyScheduled() {
      if (this._calendlyListenerAttached) return;
      this._calendlyListenerAttached = true;

      global.addEventListener('message', (e) => {
        if (!e.data || typeof e.data !== 'object') return;
        if (e.data.event === 'calendly.event_scheduled') {
          console.log('[Tracking] Calendly event_scheduled detected — firing Schedule + Google Ads conversion');
          this.trackSchedule({
            // Calendly may include invitee info in payload — best-effort extraction
            email: e.data.payload?.invitee?.email,
            firstName: e.data.payload?.invitee?.first_name,
            lastName: e.data.payload?.invitee?.last_name,
          });
          this.trackGoogleAdsConversion();
        }
      });

      console.log('[Tracking] Calendly listener attached');
    },
  };

  // ─── Auto-wire Calendly CTA clicks ────────────────────────────────────────

  /**
   * Listen for clicks on any Calendly booking anchor and fire
   * Lead (Pixel + CAPI dual tracking) + Google Ads conversion before redirect.
   *
   * Match on the href (any link to the booking URL) so EVERY Calendly CTA is
   * tracked regardless of its data-cta-track name — some booking buttons are
   * named e.g. `pricing_accompagnement_click` / `pricing_quickstart_click`
   * (no "calendly" substring) and were previously missed. The data-cta-track
   * selector is kept as a fallback for any anchor that points elsewhere.
   *
   * Existing markup pattern in BubbleLaunch (no DOM changes needed):
   *   <a href="https://calendly.com/bubbleinvest-ai" target="_blank"
   *      data-cta-track="header_calendly_click">Réserver un diagnostic</a>
   */
  function autoWireCalendlyCtas() {
    document.querySelectorAll('a[href*="calendly.com/bubbleinvest-ai"], a[data-cta-track*="calendly"]').forEach((link) => {
      if (link.dataset.bubbleTrackingBound) return;
      link.dataset.bubbleTrackingBound = '1';

      link.addEventListener('click', (e) => {
        // For target="_blank" links: do NOT preventDefault — the new tab will open,
        // and we just fire-and-forget tracking. The opening tab gives time for sendBeacon
        // and the gtag conversion event to flush before browser tab-suspend.
        const ctaName = link.dataset.ctaTrack || 'calendly_unknown';
        console.log('[Tracking] Calendly CTA clicked:', ctaName, '→', link.href);

        try {
          BubbleTracking.trackLead();
        } catch (err) {
          console.warn('[Tracking] trackLead failed:', err.message);
        }

        try {
          // No callback — link opens in new tab, no redirect needed from us
          BubbleTracking.trackGoogleAdsConversion();
        } catch (err) {
          console.warn('[Tracking] trackGoogleAdsConversion failed:', err.message);
        }
      });
    });
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  function init() {
    // Calendly embed listener (fires Schedule + Google Ads conversion on event_scheduled)
    BubbleTracking.listenForCalendlyScheduled();
    // Auto-wire CTA Calendly links (fires Lead + Google Ads conversion on click)
    autoWireCalendlyCtas();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-scan periodically in case CTAs are added dynamically (e.g. blog post inserts)
  // Cheap (< 1ms per scan); only checks for new unbound links.
  setInterval(autoWireCalendlyCtas, 5000);

  // Export
  global.BubbleTracking = BubbleTracking;
})(window);
