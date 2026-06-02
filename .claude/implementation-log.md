# Implementation Log
**Stack**: Static HTML/CSS/JS frontend (BubbleLaunch) | **Updated**: 2026-06-02

## Project Patterns
- **Pages**: src/frontend/pages/*.html (FR) + src/frontend/pages/en/*.html (EN)
- **Styles**: src/frontend/assets/styles/*.css (served at /assets/styles/)
- **JS**: src/frontend/js/ (served at /js/), i18n at /i18n/translations.js
- **Reference (ported) page**: professionnels.html (FR) / en/professionals.html (EN)
- **gle- charte**: core-2026.css + <page>-2026.css + cookie-banner.css + glass-lab-editorial.css (loads LAST)

## Charte v3 (Glass Lab Editorial) shell pieces (copy verbatim, adjust active nav + lang)
- gle-top-strip (FR: LABO OUVERT/BUILD IN PUBLIC/22+ AGENTS EN PROD; EN: LAB OPEN/.../IN PROD)
- header.gle-site-header > gle-container > gle-header-inner (gle-logo-block, hamburger-toggle, gle-nav)
- mobile-nav-overlay#mobile-nav-overlay (outside header)
- gle-footer (footer-grid: Navigation/Ressources/Légal)
- chat-side-panel + floating-chat-input + scripts block (cookie-banner, conversions, lang-toggle,
  translations, bubble-agent-memory, chatbot-animations, chat-side-panel, floating-chat-input,
  animations, ga4-events, ghibli-chrome[defer], calendly-integration[defer], calendly widget,
  inline hamburger toggle)
- Fonts link: IBM Plex Sans + Klee One + Shippori Mincho + JetBrains Mono

## Sections
- gle-section / gle-container / gle-section-header (gle-section-num, gle-section-title, gle-section-kicker)
- gle-hero / gle-hero-grid / gle-hero-tag / gle-hero-title / gle-hero-kicker / gle-hero-ctas / gle-hero-orb
- buttons: gle-btn-primary / gle-btn-secondary; bg: gle-bg-warm-atmospheric / gle-bg-cool-atmospheric

## Gotchas
- TRACKING: GA4 G-T0MQEL0ZG0 + Google Ads AW-18054203382 gtag block + Meta Pixel must stay in <head>.
- blog-post.html is DYNAMIC: js/blog-post.js fills ids (post-title, post-description, post-keywords,
  og-*, twitter-*, canonical-url, hreflang-fr/en/default, article-published-time, breadcrumb-title,
  article-title, post-date, reading-time, article-summary, featured-image-container, featured-image,
  article-content, post-tags, loading-state, error-state, blog-post) + classes (.error-state h2/p,
  .back-to-blog-btn). Keep blog-post.css (styles .post-content body). Only restyle chrome.

## Port approach that worked (additive)
- Legacy *-2026.css dashboard/grid pages (labs, shop): keep that CSS, add
  glass-lab-editorial.css LAST, ADD gle classes alongside existing ones
  (e.g. class="shop-section gle-section gle-bg-cool-atmospheric", class="container gle-container").
  Do NOT strip legacy classes — labs.js / shop filter / data-attrs depend on them.
- blog-post: new blog-post-2026.css for chrome; kept blog-post.css for JS-injected .post-content.
  Wrapped #blog-post in <section class="gle-article-section"><div class="gle-article-container">.
- github FR+EN: de-nested mobile-nav-overlay out of <header> (was nested inside); kept inline
  <style>, remapped colors to --gle-* tokens. Added missing GA4 gtag.js loader on shop FR+EN.

## Recent Changes
- 2026-06-02: ported blog-post (FR+EN) → gle, new blog-post-2026.css. All 28 dynamic ids kept.
- 2026-06-02: ported labs (FR+EN) → gle additive. data-labs-* live hooks kept.
- 2026-06-02: ported shop (FR+EN) → gle additive. shop filter data-attrs + product links kept.
- 2026-06-02: ported github (FR+EN) → gle. jade.hng/vdk888 kept; added GA4 loader.
