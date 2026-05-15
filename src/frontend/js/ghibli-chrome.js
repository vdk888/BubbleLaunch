/**
 * Bubble — Ghibli Chrome (Sprint 3 Phase 2)
 *
 * Injecte les composants signature de la charte Ghibli V3 :
 *   1. Top strip "Labo ouvert" (sticky, dot menthe pulsante, heure live)
 *   2. Floating bubbles SVG en background (5 bulles animées)
 *
 * Pourquoi en JS plutôt qu'en HTML :
 *   - On évite de toucher 17 fichiers HTML
 *   - Activation/désactivation centralisée
 *   - Respecte prefers-reduced-motion automatiquement
 *
 * Activation : ajout automatique au load.
 * Désactivation : retirer le <script src="/js/ghibli-chrome.js"></script> ou
 *                 ajouter <body data-ghibli-disable="true">.
 *
 * Source charte : ~/claude-workspaces/claudette/site-mocks/v3-wow-ghibli/style.css
 */
(function () {
  'use strict';

  if (document.body && document.body.dataset.ghibliDisable === 'true') {
    return;
  }

  // === TOP STRIP — "Labo ouvert" ============================
  function injectTopStrip() {
    if (document.getElementById('ghibli-strip')) return;

    const strip = document.createElement('div');
    strip.id = 'ghibli-strip';
    strip.className = 'ghibli-strip';
    strip.setAttribute('role', 'status');
    strip.setAttribute('aria-live', 'polite');

    strip.innerHTML = `
      <span class="ghibli-strip-dot" aria-hidden="true"></span>
      <span class="ghibli-strip-text">Labo ouvert</span>
      <span class="ghibli-strip-sep">·</span>
      <span class="ghibli-strip-meta" id="ghibli-strip-time">--:-- Paris</span>
      <span class="ghibli-strip-sep">·</span>
      <span class="ghibli-strip-meta">build in public</span>
    `;

    // Insertion au tout début du body (avant le header sticky)
    document.body.insertBefore(strip, document.body.firstChild);

    // Heure live (fuseau Paris)
    function updateTime() {
      const el = document.getElementById('ghibli-strip-time');
      if (!el) return;
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      el.textContent = `${hh}:${mm} Paris`;
    }
    updateTime();
    setInterval(updateTime, 30 * 1000);  // refresh toutes les 30s
  }

  // === FLOATING BUBBLES — signature Ghibli en background ====
  function injectBubbles() {
    if (document.getElementById('ghibli-bubbles')) return;

    // Respect prefers-reduced-motion
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const container = document.createElement('div');
    container.id = 'ghibli-bubbles';
    container.className = 'ghibli-bubbles';
    container.setAttribute('aria-hidden', 'true');

    container.innerHTML = `
      <span class="ghibli-bubble ghibli-bubble-1"></span>
      <span class="ghibli-bubble ghibli-bubble-2"></span>
      <span class="ghibli-bubble ghibli-bubble-3"></span>
      <span class="ghibli-bubble ghibli-bubble-4"></span>
      <span class="ghibli-bubble ghibli-bubble-5"></span>
    `;

    document.body.appendChild(container);
  }

  // === HERO TAG — "01 / Laboratoire" ====================
  // Insère le tag de numérotation Ghibli avant le H1 dans la section hero.
  function injectHeroTag() {
    if (document.querySelector('.ghibli-hero-tag')) return;

    const hero = document.querySelector('.hero, header.hero, section.hero');
    if (!hero) return;

    const heroContent = hero.querySelector('.hero-content') || hero;
    const h1 = heroContent.querySelector('h1');
    if (!h1) return;

    // Détection langue : si <html lang="en"> on traduit
    const lang = document.documentElement.lang || 'fr';
    const labelMap = {
      fr: 'Laboratoire',
      en: 'Laboratory'
    };

    const tag = document.createElement('div');
    tag.className = 'ghibli-hero-tag';
    tag.innerHTML = `
      <span class="ghibli-hero-tag-num">01</span>
      <span class="ghibli-hero-tag-label">${labelMap[lang] || labelMap.fr}</span>
    `;

    // Insertion avant le H1 (ou avant le hero-logo s'il existe)
    const heroLogo = heroContent.querySelector('.hero-logo');
    const insertBefore = heroLogo || h1;
    insertBefore.parentNode.insertBefore(tag, insertBefore);
  }

  // === HERO SPRIG — brin végétal SVG décoratif ============
  function injectHeroSprig() {
    if (document.querySelector('.ghibli-hero-sprig')) return;

    const hero = document.querySelector('.hero, header.hero, section.hero');
    if (!hero) return;

    // Sprig SVG inline (charte Ghibli — feuilles + tiges courbées)
    const svgNs = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('class', 'ghibli-hero-sprig');
    svg.setAttribute('viewBox', '0 0 120 200');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('preserveAspectRatio', 'xMidYMax meet');
    svg.innerHTML = `
      <g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M60 200 C 58 160, 62 130, 60 90 C 58 60, 64 30, 60 5"/>
        <path d="M60 165 C 50 158, 40 158, 32 152" />
        <path d="M60 130 C 70 122, 80 122, 88 116" />
        <path d="M60 100 C 50 92, 40 92, 32 86" />
        <path d="M60 70 C 70 62, 80 62, 88 56" />
        <ellipse cx="32" cy="152" rx="8" ry="3.5" transform="rotate(-30 32 152)" />
        <ellipse cx="88" cy="116" rx="8" ry="3.5" transform="rotate(30 88 116)" />
        <ellipse cx="32" cy="86"  rx="8" ry="3.5" transform="rotate(-30 32 86)" />
        <ellipse cx="88" cy="56"  rx="8" ry="3.5" transform="rotate(30 88 56)" />
      </g>
    `;

    hero.appendChild(svg);
  }

  // === SECTION NUMBERS — numérotation 02/03/04... =========
  // Numérote les sections principales après le hero pour donner le rythme "labo séquencé"
  function injectSectionNumbers() {
    // Sections à numéroter (sélecteurs ciblés pour pas tout tagger)
    const sections = document.querySelectorAll(
      'section.problem-solution, section.who-we-are, section.blog-preview, ' +
      'section.newsletter-shop-spotlight, section.waitlist'
    );

    const labelMap = {
      fr: ['Le problème', 'L\'équipe', 'Le labo', 'Gratuités', 'Pro'],
      en: ['The problem', 'The team', 'The lab', 'Free stuff', 'Pro']
    };
    const lang = document.documentElement.lang || 'fr';
    const labels = labelMap[lang] || labelMap.fr;

    sections.forEach((section, i) => {
      if (section.querySelector('.ghibli-section-tag')) return;
      const num = String(i + 2).padStart(2, '0');  // 02, 03, 04...

      const container = section.querySelector('.container') || section;
      const tag = document.createElement('div');
      tag.className = 'ghibli-section-tag';
      tag.innerHTML = `
        <span class="ghibli-section-tag-num">${num}</span>
        <span class="ghibli-section-tag-label">${labels[i] || 'Section'}</span>
      `;
      container.insertBefore(tag, container.firstChild);
    });
  }

  // === MOBILE NAV CLOSE BUTTON (Jade msg 4965) ============
  // Ajoute un bouton X explicite dans l'overlay mobile pour la fermeture,
  // en plus du hamburger qui se transforme en X (moins visible).
  function injectMobileNavCloseButton() {
    const overlay = document.getElementById('mobile-nav-overlay') ||
                    document.querySelector('.mobile-nav-overlay') ||
                    document.querySelector('.mobile-nav');
    if (!overlay) return;
    if (overlay.querySelector('.mobile-nav-close')) return;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'mobile-nav-close';
    closeBtn.setAttribute('type', 'button');
    closeBtn.setAttribute('aria-label', 'Fermer le menu');
    closeBtn.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <line x1="6" y1="6" x2="18" y2="18"/>
        <line x1="18" y1="6" x2="6" y2="18"/>
      </svg>
    `;

    closeBtn.addEventListener('click', function () {
      // Fermer en utilisant la même logique que le hamburger
      const toggle = document.getElementById('hamburger-toggle') ||
                     document.querySelector('.hamburger-toggle') ||
                     document.querySelector('.mobile-menu-toggle');
      overlay.classList.remove('open');
      if (toggle) {
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
      document.body.style.overflow = '';
      document.body.classList.remove('nav-open');
    });

    overlay.insertBefore(closeBtn, overlay.firstChild);
  }

  // === BOOT ===============================================
  function boot() {
    try {
      injectTopStrip();
      injectBubbles();
      injectHeroTag();
      injectHeroSprig();
      injectSectionNumbers();
      injectMobileNavCloseButton();
    } catch (e) {
      // Silencieux — ne jamais casser la page si une erreur survient
      console.warn('[ghibli-chrome] Init error:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
