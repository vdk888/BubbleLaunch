/**
 * Bubble Labs frontend — consumes /api/labs/stats.json and renders counters + feed.
 *
 * - Fetches the JSON once on page load.
 * - Animates counters with a smooth count-up when they enter the viewport.
 * - Renders the activity feed (Substack articles + GitHub commits).
 * - Surfaces the "last refreshed" status with a small green/grey dot.
 *
 * Designed to degrade gracefully: if the endpoint is unreachable or the
 * snapshot is empty, the static fallback HTML (em-dash placeholders) stays
 * visible and the status line says so honestly.
 *
 * No external dependencies. Count-up is hand-rolled (~30 lines).
 */
(function () {
  'use strict';

  const ENDPOINT = '/api/labs/stats.json';
  const COUNT_UP_DURATION_MS = 1200;

  // ──────────────────────────────────────────────────────────
  // Formatters
  // ──────────────────────────────────────────────────────────

  function formatByType(value, type) {
    if (value === null || value === undefined) return '—';
    const lang = document.documentElement.lang || 'fr';
    const locale = lang.startsWith('en') ? 'en-US' : 'fr-FR';
    switch (type) {
      case 'integer':
        return Math.round(value).toLocaleString(locale);
      case 'integer-plus':
        return Math.round(value).toLocaleString(locale) + '+';
      case 'percent':
        return Math.round(value) + ' %';
      case 'compact':
        // Collapsed display for large figures (design policy): 9 841 464 099 → "9,8 Md" (fr) / "9.8B" (en)
        return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(Math.round(value));
      case 'number':
      default:
        return Math.round(value).toLocaleString(locale);
    }
  }

  // Ease-out cubic for the count-up animation
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function animateCounter(el, finalValue, formatType) {
    if (finalValue === null || finalValue === undefined) {
      el.textContent = '—';
      return;
    }
    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      const t = Math.min(elapsed / COUNT_UP_DURATION_MS, 1);
      const current = finalValue * easeOutCubic(t);
      el.textContent = formatByType(current, formatType);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = formatByType(finalValue, formatType);
    }
    requestAnimationFrame(tick);
  }

  // ──────────────────────────────────────────────────────────
  // Counters rendering
  // ──────────────────────────────────────────────────────────

  function renderCounters(stats) {
    const counters = document.querySelectorAll('[data-counter-key]');
    counters.forEach((el) => {
      const key = el.getAttribute('data-counter-key');
      const formatType = el.getAttribute('data-counter-format') || 'integer';
      const value = stats && stats[key] !== undefined ? stats[key] : null;
      // Trigger animation when in viewport (IntersectionObserver), otherwise immediately
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCounter(el, value, formatType);
              io.disconnect();
            }
          });
        }, { threshold: 0.3 });
        io.observe(el);
      } else {
        animateCounter(el, value, formatType);
      }
    });
  }

  // ──────────────────────────────────────────────────────────
  // Feed rendering
  // ──────────────────────────────────────────────────────────

  function formatRelativeDate(isoDate) {
    if (!isoDate) return '—';
    const lang = document.documentElement.lang || 'fr';
    const isEn = lang.startsWith('en');
    const then = new Date(isoDate);
    const now = new Date();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 60) {
      return isEn ? `${diffMin} min ago` : `il y a ${diffMin} min`;
    }
    if (diffHr < 24) {
      return isEn ? `${diffHr}h ago` : `il y a ${diffHr}h`;
    }
    if (diffDay === 1) {
      return isEn ? 'yesterday' : 'hier';
    }
    if (diffDay < 7) {
      return isEn ? `${diffDay} days ago` : `il y a ${diffDay} jours`;
    }
    // For older, show absolute date
    return then.toLocaleDateString(isEn ? 'en-US' : 'fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  }

  function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderFeed(feed) {
    const lists = document.querySelectorAll('[data-labs-feed]');
    if (!lists.length) return;
    if (!feed || feed.length === 0) {
      const emptyMsg = (document.documentElement.lang || 'fr').startsWith('en')
        ? 'No recent public activity to show.'
        : 'Aucune activité publique récente à afficher.';
      lists.forEach((list) => {
        list.innerHTML = `<li class="labs-feed-empty">${emptyMsg}</li>`;
      });
      return;
    }
    // Each [data-labs-feed] element can declare data-feed-limit to cap entries
    // (e.g. teaser on the home shows 3, full /labs page shows 5).
    lists.forEach((list) => {
      const limit = parseInt(list.getAttribute('data-feed-limit') || '5', 10);
      list.innerHTML = feed.slice(0, limit)
        .map((item) => {
        const when = escapeHtml(formatRelativeDate(item.when));
        const datetime = escapeHtml(item.when || '');
        const type = escapeHtml(item.type || '');
        const source = escapeHtml(item.source || '');
        const title = escapeHtml(item.title || '');
        const url = escapeHtml(item.url || '#');
        return `
          <li class="labs-feed-item">
            <time class="labs-feed-time" datetime="${datetime}">${when}</time>
            <span class="labs-feed-type labs-feed-type-${type.toLowerCase()}">${type}</span>
            <span class="labs-feed-source">${source}</span>
            <a class="labs-feed-title" href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>
          </li>
        `;
        })
        .join('');
    });
  }

  // ──────────────────────────────────────────────────────────
  // Status line
  // ──────────────────────────────────────────────────────────

  function renderStatus(snap) {
    const dot = document.querySelector('[data-status-dot]');
    const text = document.querySelector('[data-status-text]');
    const lang = document.documentElement.lang || 'fr';
    const isEn = lang.startsWith('en');
    if (!dot || !text) return;
    if (!snap || !snap.last_refreshed_at) {
      dot.classList.add('labs-status-dot-grey');
      text.textContent = isEn
        ? 'Stats not yet refreshed on this server instance.'
        : 'Stats pas encore rafraîchies sur cette instance serveur.';
      return;
    }
    dot.classList.add('labs-status-dot-green');
    const refreshedAt = new Date(snap.last_refreshed_at);
    const refreshedRel = formatRelativeDate(snap.last_refreshed_at);
    text.textContent = isEn
      ? `Last refreshed ${refreshedRel} · ${refreshedAt.toISOString()}`
      : `Dernière mise à jour ${refreshedRel} · ${refreshedAt.toISOString()}`;
  }

  // ──────────────────────────────────────────────────────────
  // Bootstrap
  // ──────────────────────────────────────────────────────────

  async function fetchAndRender() {
    try {
      const r = await fetch(ENDPOINT, { credentials: 'omit', cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const snap = await r.json();
      renderCounters(snap.stats || {});
      renderFeed(snap.feed || []);
      renderStatus(snap);
    } catch (err) {
      console.warn('[Labs] Failed to load stats:', err.message);
      renderStatus(null);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchAndRender);
  } else {
    fetchAndRender();
  }
})();
