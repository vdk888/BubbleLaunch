# SEO Implementation Roadmap - Technical Tasks Only

**Last Updated**: 2025-10-10
**Status**: 🎯 Ready to Execute
**Focus**: Code-based implementations only (content strategy in workshops)

---

## 🎯 Quick Reference: What Can Be Done Now

### ✅ Code-Based Tasks (This Document)
- Meta tags, structured data, sitemap
- Cookie consent implementation
- Page speed optimization
- Internal linking structure
- Image optimization
- Analytics setup
- Technical SEO configuration

### 📝 Workshop Tasks (Separate Discussion)
- Blog content topics and calendar
- Backlink outreach strategy
- Competitor content analysis
- Brand messaging refinement

---

## 📊 Implementation Priority Matrix

| Task | Priority | Effort | Impact | Status | ETA |
|------|----------|--------|--------|--------|-----|
| **Phase 0: Foundation** | | | | | |
| Meta tags (all pages) | 🔥 CRITICAL | 2h | HIGH | ⏳ Pending | Week 1 |
| Structured data (JSON-LD) | 🔥 CRITICAL | 2h | HIGH | ⏳ Pending | Week 1 |
| Google Search Console setup | 🔥 CRITICAL | 30min | HIGH | ⏳ Pending | Week 1 |
| Sitemap.xml generation | 🔥 CRITICAL | 1h | HIGH | ⏳ Pending | Week 1 |
| Robots.txt configuration | 🔥 CRITICAL | 15min | MEDIUM | ⏳ Pending | Week 1 |
| Cookie consent (Tarteaucitron) | 🔥 CRITICAL | 1.5h | HIGH | ⏳ Pending | Week 1 |
| Google Analytics 4 setup | ⭐ HIGH | 30min | HIGH | ⏳ Pending | Week 1 |
| Privacy Policy page | ⭐ HIGH | 1h | MEDIUM | ⏳ Pending | Week 1 |
| Mentions Légales page | ⭐ HIGH | 30min | MEDIUM | ⏳ Pending | Week 1 |
| **Phase 1: On-Page SEO** | | | | | |
| Title tag optimization | ⭐ HIGH | 1h | HIGH | ⏳ Pending | Week 2 |
| Heading structure (H1/H2/H3) | ⭐ HIGH | 1h | HIGH | ⏳ Pending | Week 2 |
| Internal linking strategy | ⭐ HIGH | 2h | HIGH | ⏳ Pending | Week 2 |
| Image alt text optimization | ⭐ HIGH | 1h | MEDIUM | ⏳ Pending | Week 2 |
| Social share images | ⭐ HIGH | 1h | MEDIUM | ⏳ Pending | Week 2 |
| Hreflang tags (bilingual) | 💡 MEDIUM | 30min | MEDIUM | ⏳ Pending | Week 2 |
| 404 error page | 💡 MEDIUM | 30min | LOW | ⏳ Pending | Week 2 |
| **Phase 2: Performance** | | | | | |
| Lighthouse audit | 💡 MEDIUM | 30min | HIGH | ⏳ Pending | Week 3 |
| Font preloading | 💡 MEDIUM | 15min | MEDIUM | ⏳ Pending | Week 3 |
| JavaScript deferring | 💡 MEDIUM | 30min | MEDIUM | ⏳ Pending | Week 3 |
| DNS prefetch | 💡 MEDIUM | 15min | LOW | ⏳ Pending | Week 3 |
| CSS/JS minification | 💡 MEDIUM | 1h | MEDIUM | ⏳ Pending | Week 3 |
| Browser caching headers | 💡 MEDIUM | 30min | MEDIUM | ⏳ Pending | Week 3 |
| **Phase 3: Content Infrastructure** | | | | | |
| Blog template optimization | 💡 MEDIUM | 2h | MEDIUM | ⏳ Pending | Week 4 |
| Breadcrumb navigation | 💡 MEDIUM | 30min | LOW | ⏳ Pending | Week 4 |
| Social sharing buttons | 💡 MEDIUM | 30min | LOW | ⏳ Pending | Week 4 |
| Related articles section | 💡 MEDIUM | 1h | MEDIUM | ⏳ Pending | Week 4 |
| Reading time calculation | ⚪ LOW | 15min | LOW | ⏳ Pending | Week 4 |

**Legend:**
- 🔥 CRITICAL: Must-do for Google indexing
- ⭐ HIGH: Significant SEO impact
- 💡 MEDIUM: Incremental improvements
- ⚪ LOW: Nice-to-have enhancements

---

## 🚀 Phase 0: Foundation (Week 1) - CRITICAL

**Goal:** Make site discoverable and indexable by Google
**Total Effort:** ~8 hours
**Expected Impact:** Without these, SEO efforts are wasted

---

### Task 1.1: Meta Tags Implementation

**Priority:** 🔥 CRITICAL | **Effort:** 2 hours | **Impact:** HIGH

**Files to modify:**
- `src/frontend/pages/index.html`
- `src/frontend/pages/blog.html`
- `src/frontend/pages/blog-post.html`
- `src/frontend/pages/portfolio-simulator.html`

**Implementation:**

```html
<!-- Add to <head> section of each page -->

<!-- Primary Meta Tags -->
<meta name="description" content="[Page-specific description, 155 chars max]">
<meta name="keywords" content="[5-10 relevant keywords, comma-separated]">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="[Full URL]">
<meta property="og:title" content="[Page title with keyword]">
<meta property="og:description" content="[Same as meta description]">
<meta property="og:image" content="https://bubbleinvest.org/assets/images/og-image.jpg">
<meta property="og:locale" content="fr_FR">
<meta property="og:locale:alternate" content="en_US">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:url" content="[Full URL]">
<meta name="twitter:title" content="[Page title]">
<meta name="twitter:description" content="[Same as meta description]">
<meta name="twitter:image" content="https://bubbleinvest.org/assets/images/twitter-card.jpg">

<!-- Canonical URL -->
<link rel="canonical" href="[Full URL]">

<!-- Robots -->
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">

<!-- Language Alternates -->
<link rel="alternate" hreflang="fr" href="[French URL]">
<link rel="alternate" hreflang="en" href="[English URL]">
<link rel="alternate" hreflang="x-default" href="[Default URL]">
```

**Page-specific content:**

#### index.html
```html
<meta name="description" content="Bubble : plateforme d'investissement pilotée par IA avec frais fixes de 10€/mois. Gestion automatisée, transparente et accessible. Alternative aux robo-advisors traditionnels comme Yomoni et Nalo.">
<meta property="og:title" content="Bubble - Investissement optimisé par IA à frais fixes">
```

#### portfolio-simulator.html
```html
<meta name="description" content="Simulateur de portefeuille d'investissement IA : comparez 3 stratégies quantitatives sur 20 ans de données historiques. Allocation égale, Risk Parity simple et optimisée.">
<meta property="og:title" content="Simulateur de Portefeuille IA | Comparez 3 Stratégies Quantitatives">
```

#### blog.html
```html
<meta name="description" content="Blog Bubble : actualités de l'investissement intelligent, stratégies quantitatives, analyses de marché et insights sur l'IA en finance.">
<meta property="og:title" content="Blog Bubble | Actualités Investissement IA & Finance Quantitative">
```

**Acceptance Criteria:**
- [ ] All 6 pages have unique meta descriptions (<155 characters)
- [ ] All pages have Open Graph tags
- [ ] All pages have Twitter Card tags
- [ ] All pages have canonical URLs
- [ ] Social share images created (1200×630px OG, 1200×600px Twitter)
- [ ] Test with [Open Graph Debugger](https://developers.facebook.com/tools/debug/)
- [ ] Test with [Twitter Card Validator](https://cards-dev.twitter.com/validator)

---

### Task 1.2: Structured Data (JSON-LD)

**Priority:** 🔥 CRITICAL | **Effort:** 2 hours | **Impact:** HIGH

**File to create:** `src/frontend/js/structured-data.js`

**Implementation:** See [SEO_STRATEGY.md](SEO_STRATEGY.md#12-structured-data-schemaorg-json-ld) for full code

**Key schemas to implement:**
1. **FinancialService** - Homepage
2. **Organization** - Homepage
3. **FAQPage** - Homepage
4. **BlogPosting** - Blog posts (dynamic)
5. **BreadcrumbList** - All pages

**Acceptance Criteria:**
- [ ] `structured-data.js` created with 5 schema types
- [ ] Script loaded on all pages
- [ ] Test with [Google Rich Results Test](https://search.google.com/test/rich-results)
- [ ] No validation errors
- [ ] Preview shows correct structured data

---

### Task 1.3: Sitemap.xml Generation

**Priority:** 🔥 CRITICAL | **Effort:** 1 hour | **Impact:** HIGH

**File to create:** `src/backend/routes/sitemap.routes.js`

**Implementation:** See [SEO_STRATEGY.md](SEO_STRATEGY.md#13-sitemap-generation) for full code

**Route:** `GET /sitemap.xml`

**Features:**
- Dynamic generation (includes all blog posts)
- Proper priority and changefreq
- Last modification dates
- Bilingual URL alternates

**Acceptance Criteria:**
- [ ] Sitemap route created and mounted
- [ ] Test at http://localhost:3000/sitemap.xml
- [ ] XML validates (use [XML Sitemap Validator](https://www.xml-sitemaps.com/validate-xml-sitemap.html))
- [ ] Includes all static pages (6+)
- [ ] Includes all blog posts (dynamic)
- [ ] Submitted to Google Search Console

---

### Task 1.4: Robots.txt Configuration

**Priority:** 🔥 CRITICAL | **Effort:** 15 minutes | **Impact:** MEDIUM

**File to create:** `src/frontend/robots.txt`

**Implementation:** See [SEO_STRATEGY.md](SEO_STRATEGY.md#14-robotstxt-configuration) for full code

**Server config:** Update `src/backend/config/express.js`

```javascript
// Serve robots.txt from root
app.use('/robots.txt', express.static(path.join(__dirname, '../../frontend/robots.txt')));
```

**Acceptance Criteria:**
- [ ] robots.txt created with proper directives
- [ ] Disallows /api/, /clear-cache, /test-image-generation
- [ ] Includes sitemap URL
- [ ] Test at http://localhost:3000/robots.txt
- [ ] Verify Google respects directives in Search Console

---

### Task 1.5: Google Search Console Setup

**Priority:** 🔥 CRITICAL | **Effort:** 30 minutes | **Impact:** HIGH

**Steps:**
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property: `https://bubbleinvest.org`
3. Verify ownership (HTML file or DNS TXT record)
4. Submit sitemap: `https://bubbleinvest.org/sitemap.xml`
5. Request indexing for key pages

**Acceptance Criteria:**
- [ ] Domain verified in Google Search Console
- [ ] Sitemap submitted and processing
- [ ] Indexing requested for homepage, /portfolio-simulator, /blog
- [ ] Email reports enabled (weekly)
- [ ] Performance tracking configured

---

### Task 1.6: Cookie Consent (Tarteaucitron)

**Priority:** 🔥 CRITICAL | **Effort:** 1.5 hours | **Impact:** HIGH

**Why critical:** Legal requirement in France (CNIL/RGPD)

**Files to create:**
- `src/frontend/js/cookie-consent.js`
- `src/frontend/pages/privacy.html`
- `src/frontend/pages/mentions-legales.html`

**Implementation:**

**Step 1: Install Tarteaucitron**

Add to all HTML pages before closing `</body>`:

```html
<!-- Tarteaucitron Cookie Consent -->
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/tarteaucitronjs@latest/tarteaucitron.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tarteaucitronjs@latest/css/tarteaucitron.min.css">
<script src="js/cookie-consent.js"></script>
```

**Step 2: Configure cookie-consent.js**

```javascript
tarteaucitron.init({
  "privacyUrl": "/privacy",
  "hashtag": "#cookies",
  "cookieName": "bubble_cookies",
  "orientation": "bottom",
  "groupServices": false,
  "showAlertSmall": false,
  "cookieslist": true,
  "closePopup": false,
  "showIcon": true,
  "iconPosition": "BottomRight",
  "adblocker": false,
  "DenyAllCta": true,
  "AcceptAllCta": true,
  "highPrivacy": true,
  "handleBrowserDNTRequest": false,
  "removeCredit": false,
  "moreInfoLink": true,
  "useExternalCss": false,
  "readmoreLink": "/privacy",
  "mandatory": false
});

// Google Analytics 4 (requires consent)
tarteaucitron.user.gtagUa = 'G-XXXXXXXXXX';
(tarteaucitron.job = tarteaucitron.job || []).push('gtag');
```

**Step 3: Create Privacy Policy page**

Use [CNIL template](https://www.cnil.fr/fr/modele/politique-de-confidentialite) and adapt to:
- Notion data collection (waitlist)
- Google Analytics (if used)
- Session cookies (chat rate limiting)
- OpenAI Images API (blog illustrations)

**Step 4: Create Mentions Légales page**

Required information:
- Company/individual name
- Legal status (to be updated when SAS created)
- Address (update when available)
- Publication director
- Hosting provider (Replit/Vercel/etc.)

**Acceptance Criteria:**
- [ ] Tarteaucitron script loaded on all pages
- [ ] Cookie banner appears on first visit
- [ ] Accept/Reject/Customize options work
- [ ] Privacy Policy page created with proper sections
- [ ] Mentions Légales page created
- [ ] Google Analytics only loads after consent
- [ ] Cookie preferences saved in localStorage
- [ ] Test in incognito mode

---

### Task 1.7: Google Analytics 4 Setup

**Priority:** ⭐ HIGH | **Effort:** 30 minutes | **Impact:** HIGH

**Steps:**
1. Create GA4 property at [Google Analytics](https://analytics.google.com)
2. Get measurement ID (G-XXXXXXXXXX)
3. Add tracking code to all pages
4. Configure custom events

**Implementation:**

Add to `<head>` of all pages (after cookie consent):

```html
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX', {
    'cookie_flags': 'SameSite=None;Secure',
    'anonymize_ip': true
  });
</script>
```

**Custom events to track:**

Update `src/frontend/js/script.js`:

```javascript
// Waitlist signup event
document.getElementById('waitlist-form').addEventListener('submit', function(e) {
  gtag('event', 'signup', {
    'event_category': 'engagement',
    'event_label': 'waitlist'
  });
});
```

Update `src/frontend/js/chatbot-logic.js`:

```javascript
// Chat message sent event
function sendMessage(message) {
  gtag('event', 'chat_message', {
    'event_category': 'engagement',
    'event_label': 'ai_chatbot'
  });
  // ... rest of function
}
```

Update `src/frontend/js/portfolio-simulator.js`:

```javascript
// Strategy switch event
function switchStrategy(strategyName) {
  gtag('event', 'simulator_interaction', {
    'event_category': 'engagement',
    'event_label': strategyName
  });
  // ... rest of function
}
```

**Acceptance Criteria:**
- [ ] GA4 property created
- [ ] Tracking code added to all 6 pages
- [ ] Custom events configured (waitlist, chat, simulator)
- [ ] Test events in GA4 DebugView
- [ ] Verify real-time data appears in GA4
- [ ] Set up conversion goals (waitlist signup)

**Alternative:** [Plausible Analytics](https://plausible.io/) (€9/month, GDPR-friendly, no cookie consent needed)

---

## 🎨 Phase 1: On-Page SEO (Week 2) - HIGH

**Goal:** Optimize content for search engines
**Total Effort:** ~7 hours
**Expected Impact:** Better keyword rankings, improved CTR

---

### Task 2.1: Title Tag Optimization

**Priority:** ⭐ HIGH | **Effort:** 1 hour | **Impact:** HIGH

**Files to modify:** All HTML pages (6 files)

**Best practices:**
- 50-60 characters max
- Include primary keyword
- Unique for each page
- Front-load important keywords
- Include brand name

**Current vs. Optimized:**

| Page | Current | Optimized |
|------|---------|-----------|
| index.html | "Bubble. - L'agent d'investissement transparent" | "Bubble - Investissement IA à Frais Fixes \| Robo-Advisor France" |
| portfolio-simulator.html | "Portfolio Simulator" | "Simulateur de Portefeuille IA \| Comparez 3 Stratégies" |
| blog.html | "Blog - Bubble" | "Blog Bubble \| Actualités Investissement IA & Finance Quantitative" |
| blog-post.html | "[Post Title]" | "[Post Title] \| Blog Bubble" |

**Implementation:**

```html
<!-- index.html -->
<title>Bubble - Investissement IA à Frais Fixes | Robo-Advisor France</title>

<!-- portfolio-simulator.html -->
<title>Simulateur de Portefeuille IA | Comparez 3 Stratégies Quantitatives</title>

<!-- blog.html -->
<title>Blog Bubble | Actualités Investissement IA & Finance Quantitative</title>

<!-- blog-post.html (dynamic) -->
<title id="page-title">[Post Title FR] | Blog Bubble</title>
```

**Acceptance Criteria:**
- [ ] All 6 pages have optimized title tags
- [ ] Titles are 50-60 characters
- [ ] Each includes primary keyword
- [ ] Test with [SERP Preview Tool](https://www.seomofo.com/snippet-optimizer.html)
- [ ] No duplicate titles

---

### Task 2.2: Heading Structure Optimization

**Priority:** ⭐ HIGH | **Effort:** 1 hour | **Impact:** HIGH

**Files to modify:** All HTML pages

**Best practices:**
- One H1 per page (includes primary keyword)
- H2 for main sections
- H3 for subsections
- Semantic hierarchy (don't skip levels)
- Descriptive, keyword-rich headings

**Current issues:**
- Multiple H1s on some pages
- Missing keywords in headings
- Non-semantic hierarchy

**Implementation:**

#### index.html

```html
<!-- H1 (one per page) -->
<h1>Investissement Optimisé par Intelligence Artificielle</h1>

<!-- H2s (main sections) -->
<h2 id="manifesto">Pourquoi l'IA Change Tout en Investissement</h2>
<h2 id="approach">Notre Approche : Transparence, Automatisation, IA</h2>
<h2 id="vision">Découvrez Notre Plateforme d'Investissement IA</h2>
<h2 id="waitlist">Rejoignez la Liste d'Attente</h2>

<!-- H3s (subsections) -->
<h3>Automatiser la Gestion de Portefeuille</h3>
<h3>Clarifier les Frais et Stratégies</h3>
<h3>Partager les Gains d'Efficacité</h3>
<h3>Éduquer avec l'IA Conversationnelle</h3>
```

#### portfolio-simulator.html

```html
<h1>Simulateur de Portefeuille d'Investissement IA</h1>
<h2>Comparez 3 Stratégies Quantitatives sur 20 Ans</h2>
<h3>Allocation Égale (Baseline)</h3>
<h3>Risk Parity Simple</h3>
<h3>Risk Parity Optimisé</h3>
<h2>Métriques de Performance</h2>
<h3>Rendement Total et Annualisé</h3>
<h3>Volatilité et Sharpe Ratio</h3>
```

**Acceptance Criteria:**
- [ ] All pages have single H1 with primary keyword
- [ ] Semantic hierarchy (H1 → H2 → H3)
- [ ] No skipped heading levels
- [ ] Headings are descriptive and keyword-rich
- [ ] Test with [Web Accessibility Evaluation Tool](https://wave.webaim.org/)

---

### Task 2.3: Internal Linking Strategy

**Priority:** ⭐ HIGH | **Effort:** 2 hours | **Impact:** HIGH

**Goal:** Distribute page authority, help Google understand site structure

**Best practices:**
- 2-5 contextual links per page
- Descriptive anchor text (not "click here")
- Link to important pages from high-authority pages (homepage)
- Link to related content (blog posts)

**Implementation:**

#### index.html (add contextual links)

```html
<section id="manifesto">
  <p>
    Les LLMs transforment radicalement l'accès à l'expertise financière.
    <a href="/blog/ia-investissement-revolution">Découvrez comment l'IA révolutionne l'investissement</a>
    et pourquoi les modèles traditionnels deviennent obsolètes.
  </p>
</section>

<section id="approach">
  <p>
    Nos stratégies quantitatives sont transparentes et backtestées sur 20 ans.
    <a href="/portfolio-simulator">Testez notre simulateur de portefeuille</a>
    pour voir la différence entre allocation égale et Risk Parity optimisé.
  </p>
</section>

<section id="vision">
  <p>
    Notre plateforme intègre un véritable agent IA capable de gérer votre portefeuille.
    Consultez <a href="/blog">notre blog</a> pour découvrir nos analyses de marché
    et insights sur l'investissement quantitatif.
  </p>
</section>
```

#### portfolio-simulator.html (add links)

```html
<div class="simulator-intro">
  <p>
    Ce simulateur compare 3 stratégies quantitatives sur 20 ans de données historiques.
    Pour comprendre notre approche, lisez
    <a href="/blog/strategies-quantitatives-expliquees">notre guide des stratégies quantitatives</a>.
  </p>
  <p>
    Vous avez des questions sur ces stratégies?
    <a href="/#waitlist">Contactez notre équipe</a> ou
    <a href="/">découvrez notre plateforme IA</a>.
  </p>
</div>
```

#### blog-post.html (add related articles)

```html
<section class="related-articles">
  <h2>Articles similaires</h2>
  <div class="article-grid">
    <!-- Dynamically populated with 3 related posts -->
    <article>
      <a href="/blog/[slug]">[Title]</a>
    </article>
  </div>
</section>

<div class="article-cta">
  <p>Prêt à essayer notre plateforme?</p>
  <a href="/#waitlist" class="cta-button">Rejoindre la liste d'attente</a>
  <a href="/portfolio-simulator" class="cta-button">Tester le simulateur</a>
</div>
```

#### Footer (add site map)

```html
<footer>
  <div class="footer-nav">
    <div class="footer-column">
      <h4>Plateforme</h4>
      <a href="/">Accueil</a>
      <a href="/#approach">Notre Approche</a>
      <a href="/portfolio-simulator">Simulateur</a>
      <a href="/#waitlist">Liste d'Attente</a>
    </div>
    <div class="footer-column">
      <h4>Ressources</h4>
      <a href="/blog">Blog</a>
      <a href="/blog/faq">FAQ</a>
      <a href="/blog/guide-investissement-ia">Guide Débutant</a>
    </div>
    <div class="footer-column">
      <h4>Légal</h4>
      <a href="/privacy">Confidentialité</a>
      <a href="/mentions-legales">Mentions Légales</a>
    </div>
  </div>
</footer>
```

**Acceptance Criteria:**
- [ ] Homepage has 3-5 contextual links
- [ ] Portfolio simulator has 2-3 contextual links
- [ ] Blog posts have "Related Articles" section (3 posts)
- [ ] Footer has comprehensive site map
- [ ] All internal links use descriptive anchor text
- [ ] No broken internal links (test with Screaming Frog)

---

### Task 2.4: Image Alt Text Optimization

**Priority:** ⭐ HIGH | **Effort:** 1 hour | **Impact:** MEDIUM

**Goal:** Improve accessibility and image SEO

**Best practices:**
- Descriptive (what's in the image)
- Include keywords naturally
- 125 characters max
- Don't start with "image of" or "picture of"
- Decorative images: empty alt (`alt=""`)

**Current issues:**
- Generic alt text ("Bubble Logo", "Icon")
- Missing alt text on some images

**Implementation:**

```html
<!-- Logo -->
<!-- Current -->
<img src="assets/images/bubble-logo-single.svg" alt="Bubble Logo">

<!-- Optimized -->
<img src="assets/images/bubble-logo-single.svg"
     alt="Bubble - Plateforme d'investissement IA à frais fixes"
     width="72" height="72">

<!-- Portfolio chart -->
<img src="assets/images/portfolio-chart.png"
     alt="Graphique comparatif de 3 stratégies quantitatives sur 20 ans : allocation égale, Risk Parity simple et optimisé"
     width="1200" height="600">

<!-- Blog post images -->
<img src="[blog-image-url]"
     alt="[Descriptive alt based on article topic]"
     loading="lazy">

<!-- Icons (decorative) -->
<img src="assets/images/icon-ai.svg" alt="" role="presentation">

<!-- Strategy icons (functional) -->
<img src="assets/images/simul port icons/noun-ai-6480915-clean.svg"
     alt="Icône IA représentant la stratégie Risk Parity optimisée"
     width="24" height="24">
```

**Acceptance Criteria:**
- [ ] All images have descriptive alt text
- [ ] Alt text includes relevant keywords
- [ ] Decorative images have empty alt
- [ ] Specified width/height for layout stability
- [ ] Test with screen reader (NVDA or VoiceOver)

---

### Task 2.5: Social Share Images Creation

**Priority:** ⭐ HIGH | **Effort:** 1 hour | **Impact:** MEDIUM

**Goal:** Improve social media sharing (LinkedIn, Twitter, Facebook)

**Images to create:**
1. **Open Graph image** (1200×630px) - `assets/images/og-image.jpg`
2. **Twitter Card image** (1200×600px) - `assets/images/twitter-card.jpg`

**Design specifications:**
- Include Bubble logo
- Tagline: "L'agent d'investissement transparent"
- Key differentiator: "Frais fixes : 10€/mois"
- Clean, professional design
- High contrast for readability
- Use brand colors (Inter font, dark gray #333)

**Tools:**
- [Canva](https://www.canva.com/) (free templates for OG images)
- [Figma](https://www.figma.com/) (free for individuals)

**Acceptance Criteria:**
- [ ] OG image created (1200×630px, <8MB)
- [ ] Twitter Card image created (1200×600px, <5MB)
- [ ] Images compressed (use TinyPNG)
- [ ] Uploaded to `assets/images/`
- [ ] Referenced in meta tags (all pages)
- [ ] Test with [Facebook Debugger](https://developers.facebook.com/tools/debug/)
- [ ] Test with [Twitter Card Validator](https://cards-dev.twitter.com/validator)

---

### Task 2.6: Hreflang Tags (Bilingual Support)

**Priority:** 💡 MEDIUM | **Effort:** 30 minutes | **Impact:** MEDIUM

**Goal:** Tell Google which language version to show in search results

**Implementation:**

Add to `<head>` of all pages:

```html
<!-- French (default) -->
<link rel="alternate" hreflang="fr" href="https://bubbleinvest.org/">
<link rel="alternate" hreflang="en" href="https://bubbleinvest.org/?lang=en">
<link rel="alternate" hreflang="x-default" href="https://bubbleinvest.org/">
```

For blog posts with translations:

```html
<link rel="alternate" hreflang="fr" href="https://bubbleinvest.org/blog/frais-robo-advisor">
<link rel="alternate" hreflang="en" href="https://bubbleinvest.org/blog/robo-advisor-fees">
<link rel="alternate" hreflang="x-default" href="https://bubbleinvest.org/blog/frais-robo-advisor">
```

**Update sitemap.xml:**

```xml
<url>
  <loc>https://bubbleinvest.org/</loc>
  <xhtml:link rel="alternate" hreflang="fr" href="https://bubbleinvest.org/" />
  <xhtml:link rel="alternate" hreflang="en" href="https://bubbleinvest.org/?lang=en" />
  <xhtml:link rel="alternate" hreflang="x-default" href="https://bubbleinvest.org/" />
</url>
```

**Acceptance Criteria:**
- [ ] Hreflang tags added to all pages
- [ ] Sitemap updated with language alternates
- [ ] Test with [Hreflang Testing Tool](https://www.aleydasolis.com/english/international-seo-tools/hreflang-tags-generator/)
- [ ] Verify in Google Search Console (International Targeting)

---

### Task 2.7: 404 Error Page

**Priority:** 💡 MEDIUM | **Effort:** 30 minutes | **Impact:** LOW

**File to create:** `src/frontend/pages/404.html`

**Implementation:** See [SEO_STRATEGY.md](SEO_STRATEGY.md#-404-error-page-seo-friendly) for full code

**Key features:**
- "noindex" meta tag
- Internal links to key pages
- Branded design matching site
- User-friendly messaging

**Server configuration:**

```javascript
// src/backend/config/express.js
// Add as last route (after all other routes)
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../../frontend/pages/404.html'));
});
```

**Acceptance Criteria:**
- [ ] 404 page created with branded design
- [ ] Includes internal links (home, simulator, blog)
- [ ] Returns proper 404 status code
- [ ] Has "noindex" meta tag
- [ ] Test by visiting non-existent URL

---

## ⚡ Phase 2: Performance Optimization (Week 3) - MEDIUM

**Goal:** Improve page speed and Core Web Vitals
**Total Effort:** ~3 hours
**Expected Impact:** Better rankings (page speed is ranking factor)

---

### Task 3.1: Lighthouse Audit

**Priority:** 💡 MEDIUM | **Effort:** 30 minutes | **Impact:** HIGH

**Tool:** [Google Lighthouse](https://developers.google.com/web/tools/lighthouse)

**Steps:**
1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Run audit for all 6 pages
4. Document scores for: Performance, SEO, Accessibility, Best Practices

**Target scores:**
- Performance: >85
- SEO: >95
- Accessibility: >90
- Best Practices: >90

**Common issues to fix:**
- Large images (compress)
- Render-blocking resources (CSS/JS)
- Missing width/height on images (layout shift)
- Low contrast text
- Missing ARIA labels

**Acceptance Criteria:**
- [ ] Audit run on all 6 pages
- [ ] Scores documented in spreadsheet
- [ ] Top 3 issues identified for each page
- [ ] Create action plan for improvements

---

### Task 3.2: Font Preloading

**Priority:** 💡 MEDIUM | **Effort:** 15 minutes | **Impact:** MEDIUM

**Goal:** Load critical fonts faster, reduce layout shift

**Implementation:**

Add to `<head>` of all pages (before stylesheet):

```html
<!-- Preload critical fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" as="style">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" media="print" onload="this.media='all'">
```

**Acceptance Criteria:**
- [ ] Font preload added to all pages
- [ ] Test Lighthouse score improvement (+5-10 points)
- [ ] No flash of unstyled text (FOUT)

---

### Task 3.3: JavaScript Deferring

**Priority:** 💡 MEDIUM | **Effort:** 30 minutes | **Impact:** MEDIUM

**Goal:** Load non-critical JS after page content

**Current state:**
```html
<script src="js/script.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

**Optimized:**
```html
<!-- Critical JS (inline or loaded immediately) -->
<script src="js/script.js"></script>

<!-- Non-critical JS (deferred) -->
<script src="https://cdn.jsdelivr.net/npm/chart.js" defer></script>
<script src="js/chatbot-logic.js" defer></script>
<script src="js/animations.js" defer></script>
<script src="js/portfolio-preview.js" defer></script>
```

**Acceptance Criteria:**
- [ ] Non-critical scripts have `defer` attribute
- [ ] Page renders faster (test with Lighthouse)
- [ ] No broken functionality
- [ ] Test on slow 3G connection

---

### Task 3.4: DNS Prefetch & Preconnect

**Priority:** 💡 MEDIUM | **Effort:** 15 minutes | **Impact:** LOW

**Goal:** Speed up connections to external domains

**Implementation:**

Add to `<head>` of all pages:

```html
<!-- DNS prefetch for external resources -->
<link rel="dns-prefetch" href="https://fonts.googleapis.com">
<link rel="dns-prefetch" href="https://fonts.gstatic.com">
<link rel="dns-prefetch" href="https://cdn.jsdelivr.net">

<!-- Preconnect for critical external resources -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

**Acceptance Criteria:**
- [ ] DNS prefetch added for Google Fonts, CDNs
- [ ] Preconnect added for critical resources
- [ ] Test with Chrome DevTools Network tab (DNS lookup time reduced)

---

### Task 3.5: CSS/JS Minification

**Priority:** 💡 MEDIUM | **Effort:** 1 hour | **Impact:** MEDIUM

**Goal:** Reduce file sizes for faster loading

**Implementation:**

**Step 1: Install build tools**

```bash
npm install --save-dev terser clean-css-cli
```

**Step 2: Add build scripts to package.json**

```json
"scripts": {
  "start": "node src/backend/server.js",
  "build:css": "cleancss -o src/frontend/assets/styles/styles.min.css src/frontend/assets/styles/styles.css",
  "build:js": "terser src/frontend/js/*.js -o src/frontend/assets/js/bundle.min.js --compress --mangle",
  "build": "npm run build:css && npm run build:js"
}
```

**Step 3: Update HTML to use minified files (production only)**

```html
<!-- Development -->
<link rel="stylesheet" href="assets/styles/styles.css">

<!-- Production (manual switch for now) -->
<link rel="stylesheet" href="assets/styles/styles.min.css">
```

**Acceptance Criteria:**
- [ ] Build scripts added to package.json
- [ ] Run `npm run build` successfully
- [ ] Minified CSS created (styles.min.css)
- [ ] Minified JS created (bundle.min.js)
- [ ] Test production build loads correctly
- [ ] File sizes reduced by 30-50%

---

### Task 3.6: Browser Caching Headers

**Priority:** 💡 MEDIUM | **Effort:** 30 minutes | **Impact:** MEDIUM

**Goal:** Cache static assets (CSS, JS, images) in browser

**Implementation:**

Update `src/backend/config/express.js`:

```javascript
const express = require('express');
const app = express();

// Cache static assets for 1 year (immutable)
app.use('/assets', express.static(path.join(__dirname, '../../frontend/assets'), {
  maxAge: '1y',
  immutable: true,
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
  }
}));

// Cache HTML pages for 1 hour
app.use(express.static(path.join(__dirname, '../../frontend/pages'), {
  maxAge: '1h',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
    }
  }
}));
```

**Acceptance Criteria:**
- [ ] Caching headers configured for static assets
- [ ] CSS/JS cached for 1 year
- [ ] Images cached for 1 year
- [ ] HTML pages cached for 1 hour
- [ ] Test with Chrome DevTools Network tab (304 Not Modified responses)

---

## 📝 Phase 3: Content Infrastructure (Week 4) - MEDIUM

**Goal:** Optimize blog template for SEO and user engagement
**Total Effort:** ~4 hours
**Expected Impact:** Better blog post rankings, increased engagement

---

### Task 4.1: Blog Template Optimization

**Priority:** 💡 MEDIUM | **Effort:** 2 hours | **Impact:** MEDIUM

**File to modify:** `src/frontend/pages/blog-post.html`

**Features to add:**
1. Breadcrumb navigation
2. Reading time
3. Author box
4. Social sharing buttons
5. Related articles section
6. Table of contents (for long articles)

**Implementation:** See [SEO_STRATEGY.md](SEO_STRATEGY.md#-blog-post-template-optimization) for full code

**Acceptance Criteria:**
- [ ] Breadcrumb navigation with schema.org markup
- [ ] Reading time calculated dynamically
- [ ] Author box with team info
- [ ] Social sharing buttons (Twitter, LinkedIn)
- [ ] Related articles section (3 posts)
- [ ] Table of contents for articles >1500 words
- [ ] Test on 3 different blog posts

---

### Task 4.2: Breadcrumb Navigation

**Priority:** 💡 MEDIUM | **Effort:** 30 minutes | **Impact:** LOW

**Goal:** Improve navigation and SEO (schema.org BreadcrumbList)

**Implementation:**

Add to `blog-post.html`:

```html
<nav aria-label="breadcrumb">
  <ol class="breadcrumb" itemscope itemtype="https://schema.org/BreadcrumbList">
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <a itemprop="item" href="/">
        <span itemprop="name">Accueil</span>
      </a>
      <meta itemprop="position" content="1" />
    </li>
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <a itemprop="item" href="/blog">
        <span itemprop="name">Blog</span>
      </a>
      <meta itemprop="position" content="2" />
    </li>
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <span itemprop="name" id="breadcrumb-current">{{post.titleFR}}</span>
      <meta itemprop="position" content="3" />
    </li>
  </ol>
</nav>
```

**Acceptance Criteria:**
- [ ] Breadcrumb navigation added to blog posts
- [ ] Schema.org BreadcrumbList markup
- [ ] Test with Google Rich Results Test
- [ ] Responsive design (mobile-friendly)

---

### Task 4.3: Social Sharing Buttons

**Priority:** 💡 MEDIUM | **Effort:** 30 minutes | **Impact:** LOW

**Goal:** Increase social shares, generate backlinks

**Implementation:**

Add to `blog-post.html`:

```html
<div class="share-buttons">
  <h3>Partager cet article</h3>
  <a href="https://twitter.com/intent/tweet?url={{currentUrl}}&text={{post.titleFR}}&via=BubbleInvest"
     target="_blank" rel="noopener"
     class="share-button twitter">
    <svg><!-- Twitter icon --></svg>
    Partager sur Twitter
  </a>
  <a href="https://www.linkedin.com/shareArticle?mini=true&url={{currentUrl}}&title={{post.titleFR}}"
     target="_blank" rel="noopener"
     class="share-button linkedin">
    <svg><!-- LinkedIn icon --></svg>
    Partager sur LinkedIn
  </a>
  <button onclick="navigator.clipboard.writeText('{{currentUrl}}')"
          class="share-button copy-link">
    <svg><!-- Copy icon --></svg>
    Copier le lien
  </button>
</div>
```

**Acceptance Criteria:**
- [ ] Share buttons added (Twitter, LinkedIn, Copy Link)
- [ ] URLs properly encoded
- [ ] Click tracking with GA4 events
- [ ] Test sharing on social platforms

---

### Task 4.4: Related Articles Section

**Priority:** 💡 MEDIUM | **Effort:** 1 hour | **Impact:** MEDIUM

**Goal:** Increase time on site, reduce bounce rate

**Implementation:**

**Frontend (blog-post.html):**

```html
<section class="related-articles">
  <h2>Articles similaires</h2>
  <div class="article-grid" id="related-articles-container">
    <!-- Populated dynamically by JS -->
  </div>
</section>
```

**JavaScript (blog-post.js):**

```javascript
// Fetch related articles based on tags
async function loadRelatedArticles(currentSlug, tags) {
  try {
    const response = await fetch('/api/blog/posts');
    const posts = await response.json();

    // Filter by matching tags, exclude current post
    const related = posts
      .filter(post => post.slug !== currentSlug)
      .map(post => ({
        ...post,
        matchScore: post.tags.filter(tag => tags.includes(tag)).length
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);

    // Render related articles
    const container = document.getElementById('related-articles-container');
    container.innerHTML = related.map(post => `
      <article class="related-article">
        <a href="/blog/${post.slug}">
          <img src="${post.imageUrl}" alt="${post.titleFR}" loading="lazy">
          <h3>${post.titleFR}</h3>
          <p>${post.summaryFR}</p>
        </a>
      </article>
    `).join('');
  } catch (error) {
    console.error('Error loading related articles:', error);
  }
}
```

**Acceptance Criteria:**
- [ ] Related articles section added to blog template
- [ ] JavaScript function loads 3 related posts
- [ ] Matching based on shared tags
- [ ] Fallback to latest posts if no tag matches
- [ ] Test on 5 different blog posts

---

### Task 4.5: Reading Time Calculation

**Priority:** ⚪ LOW | **Effort:** 15 minutes | **Impact:** LOW

**Goal:** Improve user experience (set expectations)

**Implementation:**

Add to `blog-post.js`:

```javascript
function calculateReadingTime(text) {
  const wordsPerMinute = 200; // Average reading speed
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return minutes;
}

// Display reading time
const articleText = document.querySelector('.article-content').innerText;
const readingTime = calculateReadingTime(articleText);
document.getElementById('reading-time').textContent = `${readingTime} min de lecture`;
```

**Acceptance Criteria:**
- [ ] Reading time calculated and displayed
- [ ] Shows in article metadata (near publication date)
- [ ] Accurate for articles of varying lengths
- [ ] Bilingual support (FR: "min de lecture", EN: "min read")

---

## 📊 Success Tracking & Monitoring

### Weekly Tasks (30 min/week)

**Google Search Console Review:**
- [ ] Check impressions and clicks
- [ ] Identify new ranking keywords
- [ ] Fix any coverage errors
- [ ] Monitor Core Web Vitals

**Google Analytics Review:**
- [ ] Check organic traffic growth
- [ ] Analyze bounce rate by page
- [ ] Review conversion goals (waitlist signups)
- [ ] Identify top-performing content

**Keyword Rank Tracking:**
- [ ] Track 10 primary keywords in Semrush/Ubersuggest
- [ ] Document position changes
- [ ] Identify opportunities (pages ranking 11-20)

### Monthly Tasks (2 hours/month)

**SEO Performance Report:**
- [ ] Total organic traffic vs. previous month
- [ ] New keywords ranked
- [ ] Conversion rate (organic → waitlist)
- [ ] Backlinks acquired
- [ ] Top-performing pages

**Technical SEO Audit:**
- [ ] Run Screaming Frog crawl (broken links, redirects)
- [ ] Check for duplicate content
- [ ] Verify sitemap is up-to-date
- [ ] Review page speed (Lighthouse)

**Competitor Analysis:**
- [ ] Check Yomoni, Nalo ranking keywords
- [ ] Identify content gaps
- [ ] Analyze their backlink profiles
- [ ] Find guest post opportunities

---

## 🎓 Testing Checklist

### Pre-Launch Testing

**Technical SEO:**
- [ ] All pages indexed in Google Search Console
- [ ] Sitemap submitted and processed
- [ ] Robots.txt allows indexing
- [ ] No broken links (404s)
- [ ] HTTPS enabled (when deployed)
- [ ] Mobile-friendly test passed
- [ ] Structured data validates (no errors)

**On-Page SEO:**
- [ ] All pages have unique titles
- [ ] All pages have meta descriptions
- [ ] All images have alt text
- [ ] Internal linking structure complete
- [ ] Heading hierarchy semantic (H1 → H2 → H3)
- [ ] Canonical URLs set correctly

**Performance:**
- [ ] Lighthouse Performance score >85
- [ ] Lighthouse SEO score >95
- [ ] Page load time <3 seconds
- [ ] Core Web Vitals pass (LCP, FID, CLS)

**Legal Compliance:**
- [ ] Cookie consent banner appears
- [ ] Privacy Policy page exists
- [ ] Mentions Légales page exists
- [ ] GDPR compliance (data collection disclosed)

---

## 📞 Support & Resources

### Tools Required

**Free:**
- Google Search Console (mandatory)
- Google Analytics 4 (or Plausible)
- Google Lighthouse (Chrome DevTools)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Facebook Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)

**Paid (Optional):**
- Semrush Pro (€119/month) - Keyword research
- Ahrefs (€99/month) - Backlink analysis
- Plausible Analytics (€9/month) - GDPR-friendly

### Reference Documentation

- [Google Search Central](https://developers.google.com/search)
- [Schema.org](https://schema.org/)
- [CNIL Guidelines](https://www.cnil.fr/fr/reglement-europeen-protection-donnees)
- [Web.dev SEO Guide](https://web.dev/learn/seo/)

---

## 🎯 Next Steps

**Immediate priorities (this week):**
1. ✅ Review this roadmap with team
2. ⏳ Decide on budget allocation (€0 / €200 / €500?)
3. ⏳ Start Phase 0 implementation (meta tags, structured data)
4. ⏳ Set up Google Search Console
5. ⏳ Install cookie consent (legal requirement)

**Questions for team discussion:**
- Budget: Bootstrap (€0) or invest (€200-500/month)?
- Timeline: When should SEO tasks be completed?
- Ownership: Who implements these technical tasks?
- Content: When do we workshop blog topics and strategy?

---

**Document Status:** ✅ Complete
**Ready for Implementation:** Yes
**Dependencies:** None
**Total Estimated Time:** 20-25 hours (all phases)

---

**Last Updated:** 2025-10-10
**Next Review:** After Phase 0 completion
