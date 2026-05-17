/**
 * Modern Cookie Consent Banner
 * GDPR/CNIL compliant - Custom implementation
 *
 * Features:
 * - Simple overlay banner on first visit
 * - Remembers user choice (localStorage + cookie)
 * - Google Analytics 4 Consent Mode integration
 * - Bilingual support (FR/EN)
 * - Mobile responsive
 */

(function() {
  'use strict';

  // Configuration
  const COOKIE_NAME = 'bubble_cookie_consent';
  const COOKIE_DURATION = 365; // days
  const LOCALE_COOKIE = 'bubble_locale';

  // Detect language
  const getLanguage = () => {
    const savedLocale = getCookie(LOCALE_COOKIE);
    if (savedLocale) return savedLocale;
    const htmlLang = document.documentElement.getAttribute('lang') || 'fr';
    return htmlLang.toLowerCase().startsWith('en') ? 'en' : 'fr';
  };

  const lang = getLanguage();

  // Translations
  const translations = {
    fr: {
      title: 'Ce site utilise des cookies',
      description: 'Nous utilisons des cookies essentiels (sécurité du chat, préférence de langue), des cookies analytiques (Google Analytics) et des cookies marketing (Meta Pixel) pour améliorer votre expérience.',
      acceptAll: 'Tout accepter',
      acceptEssential: 'Essentiel uniquement',
      customize: 'Personnaliser',
      save: 'Enregistrer mes choix',
      essentialTitle: 'Cookies essentiels',
      essentialDesc: 'Nécessaires au fonctionnement du site (chat, langue). Toujours actifs.',
      analyticsTitle: 'Cookies analytiques',
      analyticsDesc: 'Google Analytics pour comprendre l\'utilisation du site et améliorer les performances.',
      marketingTitle: 'Cookies marketing',
      marketingDesc: 'Meta Pixel (Facebook/Instagram) pour mesurer l\'efficacité de nos campagnes publicitaires et adapter le contenu marketing.',
      privacyLink: 'Politique de confidentialité',
      manageConsent: 'Gérer les Cookies'
    },
    en: {
      title: 'This site uses cookies',
      description: 'We use essential cookies (chat safety, language preference), analytics cookies (Google Analytics) and marketing cookies (Meta Pixel) to improve your experience.',
      acceptAll: 'Accept all',
      acceptEssential: 'Essential only',
      customize: 'Customize',
      save: 'Save my choices',
      essentialTitle: 'Essential cookies',
      essentialDesc: 'Required for the site to function (chat, language). Always active.',
      analyticsTitle: 'Analytics cookies',
      analyticsDesc: 'Google Analytics to understand site usage and improve performance.',
      marketingTitle: 'Marketing cookies',
      marketingDesc: 'Meta Pixel (Facebook/Instagram) to measure ad campaign performance and personalize marketing content.',
      privacyLink: 'Privacy policy',
      manageConsent: 'Manage Cookies'
    }
  };

  const t = translations[lang];
  const privacyUrl = lang === 'en' ? '/en/privacy' : '/privacy';

  // Cookie utilities
  function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = 'expires=' + date.toUTCString();
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = name + '=' + value + ';' + expires + ';path=/;SameSite=Lax' + secure;
  }

  function getCookie(name) {
    const nameEQ = name + '=';
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      let c = cookies[i];
      while (c.charAt(0) === ' ') c = c.substring(1);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length);
    }
    return null;
  }

  // Google Analytics 4 Consent Mode
  // analytics → analytics_storage (GA measurement)
  // marketing → ad_storage + ad_user_data + ad_personalization (Google Ads / personalized ads)
  function updateGAConsent(analytics, marketing) {
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        'analytics_storage': analytics ? 'granted' : 'denied',
        'ad_storage': marketing ? 'granted' : 'denied',
        'ad_user_data': marketing ? 'granted' : 'denied',
        'ad_personalization': marketing ? 'granted' : 'denied'
      });
      console.log('[Cookie Consent] GA4 consent: analytics=' + (analytics ? 'granted' : 'denied') + ', ads=' + (marketing ? 'granted' : 'denied'));
    }
  }

  // Meta Pixel Consent Mode — grant/revoke + fire PageView once when granted
  // Meta Pixel is a marketing tracker (Facebook/Instagram ads), not a pure analytics tool,
  // so it is gated on the "marketing" consent category, NOT "analytics".
  // Reference: https://developers.facebook.com/docs/meta-pixel/implementation/gdpr/
  let _metaPixelPageViewFired = false;
  function updateMetaPixelConsent(marketing) {
    if (typeof fbq !== 'function') {
      console.log('[Cookie Consent] Meta Pixel not loaded yet, skipping');
      return;
    }
    if (marketing) {
      fbq('consent', 'grant');
      // Fire PageView only once per page load to avoid double-counting
      if (!_metaPixelPageViewFired) {
        fbq('track', 'PageView');
        _metaPixelPageViewFired = true;
        console.log('[Cookie Consent] Meta Pixel: consent granted + PageView fired');
      } else {
        console.log('[Cookie Consent] Meta Pixel: consent granted (PageView already fired)');
      }
    } else {
      fbq('consent', 'revoke');
      console.log('[Cookie Consent] Meta Pixel: consent revoked');
    }
  }

  // Save consent
  function saveConsent(essential, analytics, marketing) {
    const consent = {
      essential: essential,
      analytics: analytics,
      marketing: marketing,
      timestamp: new Date().toISOString(),
      version: 2  // v2 = split analytics/marketing (was v1: analytics only)
    };

    // Save to cookie and localStorage
    setCookie(COOKIE_NAME, JSON.stringify(consent), COOKIE_DURATION);
    localStorage.setItem(COOKIE_NAME, JSON.stringify(consent));

    // Update trackers — GA gets analytics+ads flags, Meta Pixel gets marketing only
    updateGAConsent(analytics, marketing);
    updateMetaPixelConsent(marketing);

    // Close banner
    closeBanner();
  }

  // Get current consent
  function getConsent() {
    const cookieValue = getCookie(COOKIE_NAME);
    if (cookieValue) {
      try {
        return JSON.parse(cookieValue);
      } catch (e) {
        return null;
      }
    }

    // Fallback to localStorage
    const localValue = localStorage.getItem(COOKIE_NAME);
    if (localValue) {
      try {
        return JSON.parse(localValue);
      } catch (e) {
        return null;
      }
    }

    return null;
  }

  // Close banner
  function closeBanner() {
    const banner = document.getElementById('bubble-cookie-banner');
    if (banner) {
      banner.classList.add('bubble-cookie-banner--hidden');
      setTimeout(() => {
        banner.remove();
      }, 300);
    }
  }

  // Show customize panel
  function showCustomize() {
    const simple = document.getElementById('bubble-cookie-simple');
    const custom = document.getElementById('bubble-cookie-custom');
    if (simple) simple.style.display = 'none';
    if (custom) custom.style.display = 'block';
  }

  // Create banner HTML
  function createBanner() {
    const banner = document.createElement('div');
    banner.id = 'bubble-cookie-banner';
    banner.className = 'bubble-cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', t.title);

    banner.innerHTML = `
      <div class="bubble-cookie-overlay"></div>
      <div class="bubble-cookie-content">
        <!-- Simple view -->
        <div id="bubble-cookie-simple" class="bubble-cookie-simple">
          <h3 class="bubble-cookie-title">${t.title}</h3>
          <p class="bubble-cookie-description">${t.description}</p>
          <div class="bubble-cookie-actions">
            <button id="bubble-accept-all" class="bubble-cookie-btn bubble-cookie-btn--primary">
              ${t.acceptAll}
            </button>
            <button id="bubble-accept-essential" class="bubble-cookie-btn bubble-cookie-btn--secondary">
              ${t.acceptEssential}
            </button>
            <button id="bubble-customize" class="bubble-cookie-btn bubble-cookie-btn--text">
              ${t.customize}
            </button>
          </div>
          <a href="${privacyUrl}" class="bubble-cookie-privacy-link">${t.privacyLink}</a>
        </div>

        <!-- Customize view -->
        <div id="bubble-cookie-custom" class="bubble-cookie-custom" style="display: none;">
          <h3 class="bubble-cookie-title">${t.title}</h3>

          <div class="bubble-cookie-option">
            <div class="bubble-cookie-option-header">
              <label class="bubble-cookie-switch">
                <input type="checkbox" id="bubble-essential-toggle" checked disabled>
                <span class="bubble-cookie-slider"></span>
              </label>
              <div class="bubble-cookie-option-info">
                <h4>${t.essentialTitle}</h4>
                <p>${t.essentialDesc}</p>
              </div>
            </div>
          </div>

          <div class="bubble-cookie-option">
            <div class="bubble-cookie-option-header">
              <label class="bubble-cookie-switch">
                <input type="checkbox" id="bubble-analytics-toggle">
                <span class="bubble-cookie-slider"></span>
              </label>
              <div class="bubble-cookie-option-info">
                <h4>${t.analyticsTitle}</h4>
                <p>${t.analyticsDesc}</p>
              </div>
            </div>
          </div>

          <div class="bubble-cookie-option">
            <div class="bubble-cookie-option-header">
              <label class="bubble-cookie-switch">
                <input type="checkbox" id="bubble-marketing-toggle">
                <span class="bubble-cookie-slider"></span>
              </label>
              <div class="bubble-cookie-option-info">
                <h4>${t.marketingTitle}</h4>
                <p>${t.marketingDesc}</p>
              </div>
            </div>
          </div>

          <div class="bubble-cookie-actions">
            <button id="bubble-save-custom" class="bubble-cookie-btn bubble-cookie-btn--primary">
              ${t.save}
            </button>
          </div>
          <a href="${privacyUrl}" class="bubble-cookie-privacy-link">${t.privacyLink}</a>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Bind events
    document.getElementById('bubble-accept-all').addEventListener('click', () => {
      saveConsent(true, true, true);
    });

    document.getElementById('bubble-accept-essential').addEventListener('click', () => {
      saveConsent(true, false, false);
    });

    document.getElementById('bubble-customize').addEventListener('click', showCustomize);

    document.getElementById('bubble-save-custom').addEventListener('click', () => {
      const analytics = document.getElementById('bubble-analytics-toggle').checked;
      const marketing = document.getElementById('bubble-marketing-toggle').checked;
      saveConsent(true, analytics, marketing);
    });

    // Show banner with animation
    setTimeout(() => {
      banner.classList.add('bubble-cookie-banner--visible');
    }, 100);
  }

  // Handle "Manage Cookies" link in footer
  function bindFooterLink(retryCount = 0) {
    const MAX_RETRIES = 5; // Max 2.5 seconds of retries (5 × 500ms)
    const footerLinks = document.querySelectorAll('a[href="#cookies"], #tarteaucitronRoot');

    if (footerLinks.length === 0) {
      if (retryCount < MAX_RETRIES) {
        console.warn('[Cookie Consent] No footer links found for cookie management. Will retry... (attempt', retryCount + 1, '/', MAX_RETRIES, ')');
        // Retry after a short delay (for dynamically loaded content)
        setTimeout(() => bindFooterLink(retryCount + 1), 500);
      } else {
        console.log('[Cookie Consent] No footer links found after', MAX_RETRIES, 'attempts. Some pages may not have cookie management links.');
      }
      return;
    }

    console.log('[Cookie Consent] Binding', footerLinks.length, 'footer link(s)');

    footerLinks.forEach(link => {
      // Avoid binding multiple times
      if (link.dataset.cookieBound) return;
      link.dataset.cookieBound = 'true';

      link.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('[Cookie Consent] Footer link clicked, opening banner');

        // Remove existing banner if any
        const existing = document.getElementById('bubble-cookie-banner');
        if (existing) existing.remove();

        // Show customize panel directly
        createBanner();
        setTimeout(showCustomize, 100);
      });
    });
  }

  // Initialize
  function init() {
    // Check if consent already exists
    const consent = getConsent();

    if (consent) {
      // User has already made a choice - apply it
      // Backward compat: v1 cookies have no `marketing` field — treat marketing as denied
      // (we don't re-consent retroactively for Meta Pixel; user must re-open the banner)
      const marketing = (consent.version === 2) ? !!consent.marketing : false;
      updateGAConsent(consent.analytics, marketing);
      updateMetaPixelConsent(marketing);
      console.log('[Cookie Consent] Existing consent loaded:', consent, '(marketing resolved to ' + marketing + ')');
    } else {
      // First visit - show banner
      // Set default deny for GA4 until user chooses
      if (typeof gtag === 'function') {
        gtag('consent', 'default', {
          'analytics_storage': 'denied',
          'ad_storage': 'denied',
          'ad_user_data': 'denied',
          'ad_personalization': 'denied'
        });
      }

      // Show banner after DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createBanner);
      } else {
        createBanner();
      }
    }

    // Bind footer link
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindFooterLink);
    } else {
      bindFooterLink();
    }
  }

  // Start
  init();
})();
