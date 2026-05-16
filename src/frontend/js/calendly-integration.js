/**
 * Calendly integration — Sprint 1 (2026-05-14)
 *
 * Goal: keep visitors on-site when they click a Calendly CTA (popup widget)
 * + capture booking conversions via GTM dataLayer for Meta Pixel / GA4 routing.
 *
 * Why popup over external redirect:
 * - 25-40% better conversion on landing pages (no context switch)
 * - postMessage events expose booking lifecycle for tracking
 * - Free tier of Calendly supports popup + inline widgets, no limit
 *
 * Two surfaces:
 * 1. Popup widget on ALL <a href="https://calendly.com/...">  →  modal opens
 *    Excludes [data-calendly-skip="true"] for explicit external links if needed.
 * 2. Inline embed when an element with [data-calendly-inline] is in the page.
 *
 * Event tracking (dataLayer pushes for GTM):
 * - calendly_widget_opened     when modal opens or inline is rendered
 * - calendly_profile_page_viewed   user landed on profile page within widget
 * - calendly_event_type_viewed     user picked an event type
 * - calendly_date_and_time_selected  user picked a slot
 * - calendly_event_scheduled   ⭐ CONVERSION — wire Meta Pixel `Lead` here
 *
 * GTM consumers should listen for these events in dataLayer
 * and forward to Meta Pixel / GA4 / etc.
 */

(function () {
  'use strict';

  // Calendly profile URL — single source of truth
  var CALENDLY_URL = 'https://calendly.com/bubbleinvest-ai';

  // Idempotence guard
  if (window.__BUBBLE_CALENDLY_INIT__) return;
  window.__BUBBLE_CALENDLY_INIT__ = true;

  window.dataLayer = window.dataLayer || [];

  /**
   * Push to GTM dataLayer + console log for debug.
   */
  function track(eventName, extra) {
    var payload = Object.assign({
      event: eventName,
      timestamp: new Date().toISOString()
    }, extra || {});
    window.dataLayer.push(payload);
    if (typeof console !== 'undefined' && console.debug) {
      console.debug('[Calendly]', eventName, extra || {});
    }
  }

  /**
   * Inject Calendly widget script + CSS once.
   * Returns a promise that resolves when Calendly global is available.
   */
  var calendlyReady = null;
  function loadCalendlyAssets() {
    if (calendlyReady) return calendlyReady;
    calendlyReady = new Promise(function (resolve, reject) {
      // CSS
      if (!document.querySelector('link[href*="calendly.com/assets/external/widget.css"]')) {
        var css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://assets.calendly.com/assets/external/widget.css';
        document.head.appendChild(css);
      }
      // Script
      if (window.Calendly) { resolve(window.Calendly); return; }
      var existing = document.querySelector('script[src*="calendly.com/assets/external/widget.js"]');
      if (existing) {
        existing.addEventListener('load', function () { resolve(window.Calendly); });
        existing.addEventListener('error', function () { reject(new Error('Calendly script failed to load')); });
        return;
      }
      var script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = function () { resolve(window.Calendly); };
      script.onerror = function () { reject(new Error('Calendly script failed to load')); };
      document.head.appendChild(script);
    });
    return calendlyReady;
  }

  /**
   * Open the popup widget. Falls back to external redirect on script failure.
   */
  function openPopup(opts) {
    opts = opts || {};
    track('calendly_widget_opened', {
      surface: 'popup',
      source_cta: opts.source || 'unknown'
    });
    loadCalendlyAssets().then(function () {
      if (window.Calendly && window.Calendly.initPopupWidget) {
        window.Calendly.initPopupWidget({ url: CALENDLY_URL });
      } else {
        // Defensive fallback — should not happen
        window.open(CALENDLY_URL, '_blank', 'noopener,noreferrer');
      }
    }).catch(function () {
      window.open(CALENDLY_URL, '_blank', 'noopener,noreferrer');
    });
  }

  /**
   * Hijack all Calendly anchor links: open popup instead of external page.
   * Skips elements with [data-calendly-skip="true"] (explicit external link).
   */
  function wireAnchors() {
    var anchors = document.querySelectorAll('a[href*="calendly.com"]');
    anchors.forEach(function (a) {
      if (a.dataset.calendlySkip === 'true') return;
      if (a.dataset.calendlyWired === 'true') return;
      a.dataset.calendlyWired = 'true';
      a.addEventListener('click', function (e) {
        // Allow modifier-click (open in new tab) to keep working
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        var trackId = a.dataset.ctaTrack || (a.className.split(' ')[0] || 'unknown');
        openPopup({ source: trackId });
      });
    });
  }

  /**
   * Render inline embed wherever the page has [data-calendly-inline].
   */
  function wireInline() {
    var containers = document.querySelectorAll('[data-calendly-inline]');
    if (containers.length === 0) return;
    loadCalendlyAssets().then(function () {
      containers.forEach(function (el) {
        if (el.dataset.calendlyMounted === 'true') return;
        el.dataset.calendlyMounted = 'true';
        if (!window.Calendly || !window.Calendly.initInlineWidget) return;
        window.Calendly.initInlineWidget({
          url: CALENDLY_URL,
          parentElement: el,
          prefill: {},
          utm: {}
        });
        track('calendly_widget_opened', {
          surface: 'inline',
          source_cta: el.dataset.calendlyInlineSource || 'inline_embed'
        });
      });
    });
  }

  /**
   * Listen for Calendly postMessage events.
   * Reference: https://developer.calendly.com/api-docs/embed/events
   */
  function listenForBookingEvents() {
    window.addEventListener('message', function (e) {
      // Calendly events come from calendly.com origin and have event.data.event
      if (!e.data || typeof e.data !== 'object') return;
      var calEvent = e.data.event;
      if (!calEvent || typeof calEvent !== 'string') return;
      if (calEvent.indexOf('calendly.') !== 0) return;

      // Map Calendly's hyphenated/underscored event names to our snake_case dataLayer events
      var mapping = {
        'calendly.profile_page_viewed': 'calendly_profile_page_viewed',
        'calendly.event_type_viewed': 'calendly_event_type_viewed',
        'calendly.date_and_time_selected': 'calendly_date_and_time_selected',
        'calendly.event_scheduled': 'calendly_event_scheduled' // ⭐ conversion
      };
      var ourName = mapping[calEvent];
      if (!ourName) return;

      track(ourName, {
        calendly_event: calEvent,
        payload: e.data.payload || {}
      });
    });
  }

  // Boot
  function init() {
    wireAnchors();
    wireInline();
    listenForBookingEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-wire on dynamic DOM updates (e.g. after lang toggle that swaps content)
  // Lightweight: a MutationObserver scoped to nav + main content area.
  if (typeof MutationObserver !== 'undefined') {
    var observer = new MutationObserver(function () { wireAnchors(); wireInline(); });
    try {
      observer.observe(document.body, { childList: true, subtree: true });
    } catch (err) {
      // body not ready yet; defer
      document.addEventListener('DOMContentLoaded', function () {
        observer.observe(document.body, { childList: true, subtree: true });
      });
    }
  }

  // Expose for debugging
  window.BubbleCalendly = {
    openPopup: openPopup,
    track: track,
    url: CALENDLY_URL
  };
})();
