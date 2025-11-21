# Comprehensive Site Restructuring Implementation Plan
## Dual-Path Architecture: Retail Investors vs Professionals

**Document Date:** November 15, 2025
**Plan Status:** Ready for Phase 1 Implementation
**Version:** 1.0 - Final Approved Plan

---

## EXECUTIVE SUMMARY

This document outlines the complete restructuring of BubbleLaunch from a unified landing page into **two distinct user journeys**: one for retail investors (`/investors`) and one for professionals (`/professionals`).

### Implementation Status Update (Nov 15, 2025)

**Work completed to date**
- Restored hero chat input (FR + EN) with rotating placeholder questions and reconnected it to the chatbot logic.
- Added dual-path cards to the homepage and wired retail/professional navigation plus the knowledge overlay redirection into `dual-path-selector.js` and `script.js`.
- Built dedicated investor and professional page directories (FR + EN) with custom headers, nav, CTA buttons, and standalone templates for solution/pricing/join/contact/demo/etc.
- Repaired global translations (`src/frontend/i18n/translations.js`), ensured they load in the browser via `window.translations`, and updated scripts that rely on them.
- Inserted `/js/animations.js` into every investor/professional template so fade-in sections render.
- Replaced the homepage waitlist form with a CTA to `/investors/join-us`, and ensured the only retail waitlist form lives on that page.
- Rebuilt the investor nav/header on all retail templates (FR + EN) and pointed their “Try the demo” buttons at the retail pricing page so the knowledge overlay remains the single entry point.
- Rebuilt all professional headers (FR + EN) with the prompt-mandated structure (Vision, Solutions dropdown, Blog, Contact, Request a demo) and created preconfigured prompt buttons on `/professionals/demo`.
- Embedded the knowledge overlay markup/CSS directly on the homepage and wired the dual-path retail CTA to dispatch the overlay event before falling back to `/investors/pricing`; closing the overlay now redirects to `/investors`.
- Trimmed the homepage back to the neutral sections (hero, dual-path selector, approach, blog preview) so investor-specific manifesto/fee-slider sections are ready to be relocated.
- Added enterprise “Contact our team” CTAs and waitlist anchors on `/professionals` (FR + EN) so the professional nav buttons can point to a dedicated section.

**Outstanding tasks before moving to the next phases**
1. **Professional solutions refresh (Consulting for SMEs/Wealth Managers & Bubble Portfolio white-label)**
   - Rewrite the hero + summary copy on `/professionals/solutions-companies` (FR/EN) to target small enterprises, Wealth Managers, and family offices needing AI-enabled workflows—remove fintech/bank references.
   - Strip the consulting page down to the essentials requested: remove “Outils portefeuille professionnel”, “Cas d’usage typiques”, “Notre approche”, “Pourquoi Bubble”, “Valeurs et méthodologie”, “Prêt à transformer vos opérations”. Rebuild “Solutions clés” tiles so they match the legacy concrete examples; drop the duplicated “exemples concrets” grid and ensure every block ends with a “Discutons de votre projet” CTA.
   - Append the same contact form + blog preview used on `/professionals/index.html`, retain the tarifs paragraph, and follow the Bubble glassmorphism/charter layout.
   - Reposition `/professionals/solutions-wealth-managers` (FR/EN) so it strictly markets the Bubble Portfolio tool as a white-label solution for Wealth Managers (CGPs in FR): replace the “Solutions clés” with one offer that explains the product, delete “Cas d’usage”, “Notre approche”, “Valeurs”, “Pourquoi Bubble”, “Tarifs”, “Amplifiez votre capacité…” etc., and add CTAs for “Discutons de votre projet” plus a placeholder “See the demo”.
2. **Floating chat + assistant parity**
   - Import the floating chat input and side panel on every professional page (FR + EN) so enterprise visitors can ask about consulting or Bubble Portfolio; confirm it still reuses the global chatbot logic.
3. **Investor journey cleanup**
   - Now that the waitlist form lives directly inside `/` and `/investors`, consolidate `/investors/join-us` by redirecting it to `#investor-waitlist` or removing duplicate forms; make sure every CTA points to that anchor instead of the legacy page.
   - Remove or redirect `/pricing.html` and `/en/pricing.html` so `/investors/pricing` becomes the single retail pricing path, and audit for any straggling links to the old routes.
4. **Professional demo instrumentation & CTA**
   - Keep analytics for `/professionals/demo` up to date (prompt buttons, CTA clicks) and wire the future “Découvrir / See demo” buttons on the dual path + solutions pages to the professional demo workflow once specs land; for now, ensure every CTA routes to `#enterprise-waitlist`.
5. **Documentation & positioning alignment**
   - Update this plan and the related Markdown docs (`docs/company/bubble-launch-text-review.md`, `docs/company/bubble_portfolio_ib_beta_version.md`, etc.) to underline the Composer Trade–style positioning: Bubble is an automated trading platform/app that lets investors and professionals build, backtest, and run AI-powered strategies without coding, with no financial advice or performance promises.

### Key Objectives
1. ✅ Restore interactive hero chat input with rotating sample questions
2. ✅ Create `/investors` journey with vision, solution, pricing, simulator, and waitlist pages
3. ✅ Create `/professionals` journey with vision, solutions (companies & Wealth Managers), demo, and contact pages
4. ✅ Integrate FAQ sections into both journeys (adapted from current pricing page)
5. ✅ Implement for both French and English versions simultaneously
6. ✅ Ensure accessibility, responsiveness, and SEO compliance
7. ✅ Remove auto-triggers from demos, require explicit interactions

### Total Effort Estimate
**20-30 hours** across 10 phases with verification steps between each

---

## PHASE 1: HOMEPAGE RESTORATION & DUAL-PATH ENHANCEMENT

### 1.1 Restore Hero Chat Input

**Objective:** Bring back interactive chat input to hero section with rotating placeholder questions

**Files to Modify:**
- `src/frontend/pages/index.html` (FR)
- `src/frontend/pages/en/index.html` (EN)

**Implementation:**

**A. HTML Structure (Hero Section)**

Insert after subtitle, before old CTA button:

```html
<!-- Hero Chat Input -->
<div class="hero-chat-container">
  <form class="hero-chat-form" id="hero-chat-form">
    <input
      type="text"
      class="chat-input hero-chat-input"
      placeholder=""
      data-translate-placeholder="chat.placeholder"
      aria-label="Ask the AI assistant"
      autocomplete="off"
    />
    <button type="submit" class="chat-submit hero-chat-submit" aria-label="Send message">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M5 10L12 3L19 10" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M12 21V4" stroke-linecap="round" />
      </svg>
    </button>
  </form>
</div>
```

**B. CSS Styling**

Add to `src/frontend/assets/styles/styles.css` (~80 lines):

```css
/* Hero Chat Input */
.hero-chat-container {
  max-width: 600px;
  margin: 2rem auto 0;
}

.hero-chat-form {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50px;
  padding: 0.5rem 0.75rem;
  transition: all 0.3s ease;
}

.hero-chat-form:focus-within {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(0, 0, 0, 0.1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.hero-chat-input {
  flex: 1;
  background: transparent;
  border: none;
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
  color: #000;
  outline: none;
  font-family: inherit;
}

.hero-chat-input::placeholder {
  color: rgba(0, 0, 0, 0.5);
}

.hero-chat-submit {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #333 0%, #1a1a1a 100%);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.hero-chat-submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

@media (max-width: 768px) {
  .hero-chat-container {
    max-width: 100%;
  }

  .hero-chat-input {
    font-size: 16px; /* Prevent iOS zoom */
  }
}
```

**C. JavaScript Handler**

Update `src/frontend/js/chatbot-logic.js` (add to end):

```javascript
document.addEventListener('DOMContentLoaded', () => {
  const heroForm = document.getElementById('hero-chat-form');
  if (heroForm) {
    heroForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = heroForm.querySelector('.chat-input');
      const message = input.value.trim();

      if (message && window.chatSidePanel) {
        window.chatSidePanel.open(message);
        input.value = '';

        // Track analytics
        if (typeof gtag !== 'undefined') {
          gtag('event', 'hero_chat_submit', {
            entry_point: 'homepage_hero'
          });
        }
      }
    });
  }
});
```

**D. Activate Rotating Placeholders**

`chatbot-animations.js` already has rotating placeholder logic. It will automatically activate on `.hero-chat-input` without code changes needed.

**Verification Checklist**
- [x] Hero chat input renders on `/` (FR/EN) directly under the hero subtitle.
- [x] `hero-chat-form` submit dispatches to the existing chat panel (verified via `chatbot-logic.js`).
- [x] `chatbot-animations.js` rotates through `chat.rotatingPlaceholders` without console errors.
- [x] Submitted message opens the chat side panel and feeds the user question into the conversation history.
- [ ] Accessibility: keyboard focus moves correctly from hero input to submit button, ARIA label describes the action.

### 1.1.b Homepage Scope & Navigation (Prompt Compliance)
**Objective:** Keep the root page lean (hero, dual path, “Our approach”, shared charts/simulator preview, blog preview) and expose only high-level navigation.

**Tasks**
1. `src/frontend/pages/index.html` / `en/index.html`
   - Remove investor-specific sections (Vision, fee comparison, “What we’re building”, waitlist form) and relocate content to `/investors`.
   - Keep the chatbot hero, dual-path selector, shared approach/charts/blog components.
   - Replace waitlist form with a CTA linking to `/investors/join-us` (FR) / `/en/investors/join-us`.
2. Homepage header
   - Desktop/mobile nav should list exactly: `Investors`, `Professionals`, `Blog`, `Join Us`.
   - “Join Us” points to `/investors/join-us` (FR) or `/en/investors/join-us`.
   - No anchor links (`#about`, `#approach`) remain on `/`.
3. Dual-path CTAs
   - Retail: “Start now” button calls the knowledge overlay (via JS event or redirect) instead of linking directly to `/investors`.
   - Professional: “Discover” CTA keeps linking to `/professionals`.

**Verification**
- [ ] View Source on `/` to confirm only the approved sections remain.
- [ ] Header on `/` shows the four links and no investor-specific anchors.
- [ ] Retail CTA opens the knowledge overlay (or at least redirects to `/investors/pricing` which triggers it automatically).
- [ ] Professional CTA routes to `/professionals` without console warnings.

### 1.2 Update Dual-Path Selector
**Translation Keys Needed:**
- `chat.placeholder` (already exists - "Why is AI a game-changer?")
- `chat.rotatingPlaceholders` (already exists - array of 18 questions)

---

### 1.2 Update Dual-Path Selector

**Current State:** Dual-path selector exists but triggers navigation to pricing

**Target State:** Simplified tiles that immediately trigger demo (for retail) or navigate to professional pages

**Files to Modify:**
- `src/frontend/pages/index.html` (FR)
- `src/frontend/pages/en/index.html` (EN)
- `src/frontend/js/dual-path-selector.js`
- `src/frontend/i18n/translations.js`

**HTML Changes:**

Keep existing dual-path structure but:
1. Remove title "Choisissez votre parcours Bubble" and subtitle
2. Update card titles to be main titles (not subtitles)
3. Add 2-3 bullet point features under description
4. Keep CTAs but update behavior

```html
<!-- Dual-Path Selector Section (UPDATED) -->
<section class="dual-path-selector fade-in">
  <div class="container">
    <!-- REMOVED title and subtitle -->

    <div class="dual-path-cards">
      <!-- Retail Investors Card -->
      <div class="dual-path-card retail-card">
        <div class="card-icon">
          <svg>...</svg>
        </div>
        <h3 class="card-title" data-translate="dualPath.retail.mainTitle">For Individual Investors</h3>
        <p class="card-subtitle" data-translate="dualPath.retail.subtitle">AI portfolios matched to your experience level</p>

        <!-- NEW: Bullet points -->
        <ul class="card-features">
          <li data-translate="dualPath.retail.feature1">Personalized portfolio recommendations</li>
          <li data-translate="dualPath.retail.feature2">Transparent backtesting & explanations</li>
          <li data-translate="dualPath.retail.feature3">€0-10/month fixed pricing</li>
        </ul>

        <a href="#" class="cta-button retail-demo-btn" data-action="trigger-demo" data-translate="dualPath.retail.cta">Start now</a>
      </div>

      <!-- Professional Card -->
      <div class="dual-path-card professional-card">
        <div class="card-icon">
          <svg>...</svg>
        </div>
        <h3 class="card-title" data-translate="dualPath.professional.mainTitle">For Investment Professionals</h3>
        <p class="card-subtitle" data-translate="dualPath.professional.subtitle">AI tools & advisory for firms and Wealth Managers</p>

        <!-- NEW: Bullet points -->
        <ul class="card-features">
          <li data-translate="dualPath.professional.feature1">White-label AI advisor solutions</li>
          <li data-translate="dualPath.professional.feature2">Multi-client portfolio management</li>
          <li data-translate="dualPath.professional.feature3">Compliance & audit-ready reports</li>
        </ul>

        <a href="/professionals" class="cta-button professional-btn gray-btn" data-translate="dualPath.professional.cta">Discover</a>
      </div>
    </div>
  </div>
</section>
```

**CSS Updates for Features:**

```css
.card-features {
  list-style: none;
  padding: 0;
  margin: 1.5rem 0;
  text-align: left;
}

.card-features li {
  padding-left: 1.5rem;
  margin-bottom: 0.75rem;
  position: relative;
  font-size: 0.9rem;
  color: #555;
  line-height: 1.5;
}

.card-features li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #333;
  font-weight: 600;
}
```

**JavaScript Updates (`dual-path-selector.js`):**

```javascript
// Update retail button behavior - trigger demo immediately
document.addEventListener('DOMContentLoaded', () => {
  const retailBtn = document.querySelector('.retail-demo-btn');
  if (retailBtn) {
    retailBtn.addEventListener('click', (e) => {
      e.preventDefault();

      // Track analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', 'dual_cta_clicked', {
          cta_type: 'retail_investors',
          entry_point: 'homepage_dual_path'
        });
      }

      // Trigger knowledge overlay immediately
      window.dispatchEvent(new CustomEvent('openKnowledgeOverlay', {
        detail: { entryPoint: 'homepage_dual_path' }
      }));
    });
  }
});
```

**Translation Keys to Add (12 new keys):**

```javascript
// Dual-Path Retail
"dualPath.retail.mainTitle": {
  en: "For Individual Investors",
  fr: "Pour les Investisseurs Particuliers"
},
"dualPath.retail.subtitle": {
  en: "AI portfolios matched to your experience level",
  fr: "Portefeuilles IA adaptés à votre niveau d'expérience"
},
"dualPath.retail.feature1": {
  en: "Personalized portfolio recommendations",
  fr: "Recommandations de portefeuille personnalisées"
},
"dualPath.retail.feature2": {
  en: "Transparent backtesting & explanations",
  fr: "Backtesting et explications transparents"
},
"dualPath.retail.feature3": {
  en: "€0-10/month fixed pricing",
  fr: "Tarification fixe 0-10€/mois"
},

// Dual-Path Professional
"dualPath.professional.mainTitle": {
  en: "For Investment Professionals",
  fr: "Pour les Professionnels de l'Investissement"
},
"dualPath.professional.subtitle": {
  en: "AI tools & advisory for firms and Wealth Managers",
  fr: "Outils IA et conseil pour entreprises et gestionnaires de patrimoine"
},
"dualPath.professional.feature1": {
  en: "White-label AI advisor solutions",
  fr: "Solutions IA en marque blanche"
},
"dualPath.professional.feature2": {
  en: "Multi-client portfolio management",
  fr: "Gestion multi-clients de portefeuilles"
},
"dualPath.professional.feature3": {
  en: "Compliance & audit-ready reports",
  fr: "Rapports conformes et auditables"
}
```

---

### 1.3 Remove Old "Join Us" CTA

**Action:** Delete the `<a href="#waitlist" class="cta-button">` button from hero section (replaced by dual-path selector)

---

### 1.4 Homepage Neutrality + “Construisons l’avenir ensemble”

1. Keep only the neutral sections on `/` + `/en/`: hero, dual-path selector, “Notre approche / Our approach”, and the shared blog preview. The manifesto, fee slider, simulator preview, and “What we’re building” tiles must live exclusively under `/investors`.
2. Reintroduce the “Construisons l’avenir ensemble / Building the future together” block at the bottom of the homepage using the Bubble charter styling (two-column layout, large title, supporting paragraph). This block is now **CTA-only**—no form fields. Button copy: “Rejoindre la liste d’attente” (FR) / “Join the waitlist” (EN) → `/investors/join-us`.
3. Remove any references to `/#waitlist`. All analytics/IDs should reflect the new CTA-only behavior (e.g., `data-cta="homepage_waitlist"`).
4. Prepare translation keys for the headline, paragraph, and CTA label so FR/EN stay in sync.

### 1.5 Hero Typing Animations & CTA QA

1. Ensure only `chatbot-animations.js` manipulates the hero placeholder. Remove legacy scripts (`hero-chat-animation.js`, duplicated inline typings) that currently trigger `Unexpected string` errors and cause overlapping text in the “key points” section.
2. Validate that the knowledge overlay opens when:
   - Clicking the “Start now / Commencer” button on the investor tile.
   - Pressing the header “Try the demo” button once inside `/investors`.
   - Clicking the “See the demo” button under “A complete AI investment agent.”
   Closing the overlay on the homepage must redirect to `/investors`.
3. Track CTA origin via `detail.entryPoint` in the overlay event (`hero_start`, `dual_path`, `investor_tile`, etc.) and log a GA event.
4. Stage the professional CTA: keep the “Discover” button linking to `/professionals` for now but document that it will eventually open the professional demo (Phase 5 deliverable).

---

## PHASE 2: REMOVE HOMEPAGE ELEMENTS

### 2.1 Actions
1. ✅ Delete "Join Us" CTA button from hero (line 161-163)
2. ✅ Keep waitlist form for now (will move to `/investors/join-us` in Phase 3)
3. ✅ Update waitlist section header to neutral language

---

## PHASE 3: CREATE INVESTOR JOURNEY (`/investors`)

### 3.1 Directory Structure

```
src/frontend/pages/
├── investors/
│   ├── index.html              (Vision page)
│   ├── solution.html           (How it works)
│   ├── pricing.html            (Pricing table + FAQ)
│   ├── portfolio-simulator.html (Simulator)
│   └── join-us.html            (Waitlist form)
└── en/
    └── investors/
        ├── index.html
        ├── solution.html
        ├── pricing.html
        ├── portfolio-simulator.html
        └── join-us.html
```

### 3.2 Investor Navigation Header

All investor pages include:

```html
<nav class="desktop-nav investor-nav">
  <a href="/investors" data-translate="investors.nav.vision">Vision</a>

  <div class="nav-dropdown">
    <button class="nav-dropdown-toggle" data-translate="investors.nav.solution">Solution</button>
    <div class="nav-dropdown-menu">
      <button class="dropdown-link" data-action="open-investor-agent" data-translate="investors.nav.solution.agent">Agent</button>
      <a href="/investors/portfolio-simulator" class="dropdown-link" data-translate="investors.nav.solution.education">Education</a>
    </div>
  </div>

  <a href="/investors/pricing" data-translate="investors.nav.pricing">Tarification</a>
  <a href="/blog" data-translate="nav.blog">Blog</a>
  <a href="/investors/join-us" data-translate="investors.nav.joinUs">Rejoignez-nous</a>

  <!-- Demo button in header -->
  <button class="nav-demo-btn" id="investor-demo-btn" data-translate="investors.nav.demoBtn">Try the demo</button>

  <!-- Language switcher -->
  <div class="language-switcher">
    <button id="en-switch">EN</button>
    <span>|</span>
    <button id="fr-switch" class="active">FR</button>
  </div>
</nav>
```

**Notes**
- `open-investor-agent` dispatches the same knowledge overlay event as the hero CTA (entry point `solution_dropdown_agent`).
- The dropdown closes on selection and must remain keyboard accessible (tab + ESC).
- Add `investors.nav.solution.agent` / `.education` translation keys for FR/EN.

### 3.3 Investor Pages Specification

#### **A. `/investors/index.html` (Vision Page)**

**Sections:**
1. Hero: "Bubble for Individual Investors"
2. "Notre Constat" / "Our Findings" (copy from homepage)
3. Fee comparison slider (4 slides)
4. "What We Are Building" section:
   - Tile: "A Complete AI Investment Agent"
   - Description
   - Two CTAs: "See Pricing" (link) and "Try the Demo" (button wired to the knowledge overlay; reuse `data-entry-point="vision_ai_agent"` and focus the overlay on submit)
5. Portfolio simulator preview
6. Blog preview
7. Footer with investor-specific links
8. “Construisons l’avenir ensemble / Building the future together” block cloned from the homepage (CTA → `/investors/join-us`)
9. Ensure the “key points” typing animation runs once (remove duplicate `.typing-text` nodes); QA by watching the hero and manifesto on slow network throttling.

#### **B. `/investors/solution.html` (Solution Page)**

**Content:**
1. Hero: "How Bubble Works for You"
2. **Section 1: Onboarding**
   - Profile assessment, goals, risk tolerance
   - Description and benefits
3. **Section 2: Portfolio Construction**
   - AI screening process
   - Strategy selection and backtesting
   - Explanation of methodology
4. **Section 3: Rebalancing & Monitoring**
   - Automated alerts
   - Monthly rebalancing process
   - Real-time dashboard
5. **Section 4: Education & Transparency**
   - Explainable AI methodology
   - Learning resources
   - Performance tracking tools
6. **Section 5: Limitations**
   - What Bubble does NOT do
   - Not financial advice
   - Not account custody
   - User maintains 100% control
7. CTA row:
   - Button “Try the demo” (opens knowledge overlay; entry point `solution_agent_section`)
   - Secondary link “See pricing” (`/investors/pricing`)
8. Reuse the “Solutions clés / Key capabilities” design for this page so it mirrors the dual-path aesthetic, and include a footer consistent with Charte Graphique Bubble mandates.
9. Ensure the floating chatbot, knowledge overlay script, and animations all load (no missing `window.translations` errors).

#### **C. `/investors/pricing.html` (Pricing Page)**

**Content:**
1. Hero: "Simple, Transparent Pricing"
2. **"What You're Paying For" Section** (from current pricing page)
   - 3 cards:
     - Platform Access (infrastructure, API, servers)
     - AI Education & Empowerment (AI educates, doesn't control)
     - You Keep Control (100% user decision-making)
   - Highlight box: "Bubble is a decision-support tool, not an asset management service"
3. **Pricing Plans Grid** (current 5 tiers)
4. **FAQ Section** (12 questions - see below)
5. **Additional Resources**
   - Comparison table: Bubble vs traditional robo-advisors
   - Cost calculator (optional)
6. Migrate the legacy `/pricing.html` content into this page (FR + EN) and remove the “Enterprise (on quote)” tile entirely so professional prospects stay on their dedicated path.
7. Every “Accès anticipé / Get early access” button now links to `/investors/join-us`.

#### **D. `/investors/portfolio-simulator.html`**

**Content:**
- Copy current `/portfolio-simulator.html` functionality
- Add investor-specific header
- Keep all simulator features unchanged
- Add CTA: "Talk to Our AI Advisor" → Opens chat side panel
- Ensure this page is the destination for the “Education” item in the Solution dropdown and includes the global footer + floating chatbot scripts so animations continue to run.

#### **E. `/investors/join-us.html` (Waitlist/Early Access)**

**Content:**
- Move waitlist form from homepage
- Hero: "Join Early Adopters"
- Form fields: Name, Email, Profile (select), Comments
- Submission to `/api/waitlist` endpoint
- Success message
- Privacy disclaimer

### 3.4 Investor Journey Checklist
- [x] All investor pages render with the dedicated investor header/footer (FR + EN) including the “Try the demo” CTA.
- [x] Floating chatbot + language toggle work on every `/investors/*` page.
- [x] `/investors/join-us` (FR + EN) hosts the only waitlist form; homepage now links here via CTA only.
- [x] Each investor CTA that mentions “demo” routes through `/investors/pricing`.
- [ ] Move “Notre Constat / Our Findings”, fee slider, and “What we’re building” tiles from `/` → `/investors` (FR + EN) and keep their typing animations from overlapping.
- [ ] Replace `/investors/portfolio-simulator.html` redirect with the full simulator UI, investor header/footer, and CTA back to the AI advisor (accessible from the Solution dropdown “Education” link).
- [ ] Update all plan cards on `/investors/pricing.html` (FR + EN) so “Get early access”/“Accès anticipé” links target `/investors/join-us`.
- [ ] Knowledge overlay opens when clicking “Start now” (homepage tile), “Try the demo” (investor nav/buttons), or the “See the demo” CTA in the “Complete AI investment agent” tile; closing it from the homepage returns to `/investors`.
- [ ] “Solution” dropdown exposes “Agent” (demo trigger) + “Education” (links to simulator) on both FR + EN investor headers and dispatches analytics entry points.
- [ ] Rebuild the “Construisons l’avenir ensemble / Building the future together” block after the investor FAQ with the same CTA-only component used on `/`.
- [ ] Hero + manifesto typing animations run once (no overlapping text) in both languages.

### 3.5 Knowledge Overlay & Demo Flow
**Objective:** Repair the investor demo journey so the knowledge overlay launches the demo, and exiting the demo returns users to `/investors`.

**Tasks**
1. Embed `knowledge-overlay.js` and the overlay markup on `/` and `/en/`.
2. Update `dual-path-selector.js` to dispatch `openKnowledgeOverlay` before redirecting and redirect to `/investors` after the overlay closes.
3. Attach the same overlay trigger to the investor header CTA, the “Agent” dropdown item, and the “See the demo” button inside “What we’re building” (each with a unique `entryPoint` for analytics).
4. Ensure `knowledge-overlay.js` listens for direct page events (`homepage_direct`, `solution_dropdown_agent`, etc.) and closes cleanly, clearing any timers.
5. Verify the retail demo (pricing workflow) loads its scripts and showcases the typing animation/backtest without console errors, and closing the modal routes to `/investors`.

### 3.6 Dual Waitlist Block (“Building the Future Together”)
**Objective:** Provide a consistent waitlist CTA on both journeys.

**Tasks**
1. Rebuild the waitlist section at the bottom of `/index.html` and `/en/index.html` using the charter design but with CTAs pointing to `/investors/join-us`.
2. Add the same component (localized) after the investor FAQ so users can join the waitlist without returning to the homepage.
3. Both instances should be CTA-only (no embedded form) and must **not** include a professional CTA; the enterprise contact lives exclusively on `/professionals`.

---

### 3.4 Investor FAQ Section (12 Questions)

**Location:** `/investors/pricing.html`

**FAQ Content** (adapted from current pricing page, expanded):

**Q1: "Que payez-vous exactement?" / "What are you paying for?"**
- Answer: Platform access and AI empowerment, not asset management
- Clarify infrastructure costs, not based on portfolio size

**Q2: "L'IA prend-elle des décisions?" / "Does the AI make decisions for me?"**
- Answer: No, never. Users validate every action
- Explain AI empowers, doesn't control

**Q3: "Différence vs Yomoni/Nalo?" / "How is Bubble different from Yomoni or Nalo?"**
- Answer: We're a decision-support tool, they're asset managers
- Different regulatory framework
- User maintains full control

**Q4: "Pourquoi prix fixe?" / "Why fixed pricing instead of percentage-based?"**
- Answer: No AUM conflicts, reflects actual infrastructure costs
- Cheaper for larger portfolios than 0.85% AUM fees

**Q5: "Contrôle des comptes courtiers?" / "Can Bubble access my brokerage account?"**
- Answer: No, you maintain 100% control
- Bubble suggests, you execute
- Works with IBKR, Alpaca, Saxo Bank

**Q6: "Régulation AMF?" / "Is Bubble regulated?"**
- Answer: Decision-support tool, different framework than asset managers
- Compliant with KYC, GDPR, and French regulations
- Not a financial advisory service

**Q7: "Données de mon portefeuille?" / "What happens to my portfolio data?"**
- Answer: End-to-end encrypted, never shared
- Privacy policy link
- GDPR-compliant data handling

**Q8: "Puis-je utiliser mes propres stratégies?" / "Can I create custom strategies?"**
- Answer: Yes, via chatbot interface
- Backtesting capabilities for your ideas
- Full transparency of results

**Q9: "Quel est le rendement moyen?" / "What returns should I expect?"**
- Answer: Depends on market conditions and strategy
- Historical backtests available (17+ years)
- No guaranteed returns

**Q10: "Comment fonctionne le support client?" / "What customer support is available?"**
- Answer: Email support, community forum
- Resource library and educational content
- Demo and onboarding assistance

**Q11: "Comment annuler ma souscription?" / "Can I cancel anytime?"**
- Answer: Yes, no lock-in period
- All data exportable
- Month-to-month billing

**Q12: "Frais cachés?" / "Are there hidden fees?"**
- Answer: No, completely transparent
- What you see is what you pay
- No transaction fees or spreads

---

### 3.5 Investor Translation Keys

**Estimate:** ~80 new translation keys for investor pages

**Key categories:**
- Navigation: `investors.nav.*` (5 keys)
- Hero sections: `investors.hero.*`, `investors.solution.hero.*`, etc.
- Content sections: `investors.vision.*`, `investors.solution.*`, `investors.pricing.*`
- FAQ: `investors.faq.q1.question`, `investors.faq.q1.answer`, etc. (12 questions × 2 = 24 keys)
- Buttons/CTAs: Various `investors.*.cta` keys

---

## PHASE 4: CREATE PROFESSIONAL JOURNEY (`/professionals`)

### 4.1 Directory Structure

```
src/frontend/pages/
├── professionals/
│   ├── index.html                      (Vision page)
│   ├── solutions-companies.html        (For companies/fintechs)
│   ├── solutions-wealth-managers.html  (For Wealth Managers/wealth advisors)
│   ├── demo.html                       (Professional demo page)
│   ├── faq.html                        (Professional FAQ)
│   └── contact.html                    (Contact/inquiry form)
└── en/
    └── professionals/
        ├── index.html
        ├── solutions-companies.html
        ├── solutions-wealth-managers.html
        ├── demo.html
        ├── faq.html
        └── contact.html
```

### 4.2 Professional Navigation Header

```html
<nav class="desktop-nav professional-nav">
  <a href="/professionals" data-translate="professionals.nav.vision">Vision</a>

  <!-- Solutions dropdown -->
  <div class="nav-dropdown">
    <a href="#" class="nav-dropdown-toggle" data-translate="professionals.nav.solutions">Solutions</a>
    <div class="nav-dropdown-menu">
      <a href="/professionals/solutions-companies" data-translate="professionals.nav.companies">For Companies</a>
      <a href="/professionals/solutions-wealth-managers" data-translate="professionals.nav.wealthManagers">For Wealth Managers</a>
    </div>
  </div>

  <a href="/blog" data-translate="nav.blog">Blog</a>
  <a href="/professionals/faq" data-translate="professionals.nav.faq">FAQ</a>
  <a href="/professionals/contact" data-translate="professionals.nav.contact">Contact Us</a>

  <!-- CTA now scrolls to enterprise waitlist -->
  <a href="/professionals#enterprise-waitlist"
     class="nav-cta"
     data-cta="professional_contact"
     data-translate="professionals.nav.cta">
    Contact us
  </a>

  <!-- Language switcher -->
  <div class="language-switcher">...</div>
</nav>
```

**Requirements**
- CTA label is “Contact us / Contactez-nous” and scrolls to `#enterprise-waitlist` on the current page. The `/professionals/demo` page remains accessible via hero buttons and contextual CTAs.
- Language switchers must match the Charte Graphique Bubble layout used on the root page (inline buttons, clear active state).
- Header/hero combos on every professional page must include the same CTA + toggle block to stay consistent.

### 4.3 Professional Pages Specification

#### **A. `/professionals/index.html` (Vision Page)**

**Sections:**
1. Hero: "Bubble for Investment Professionals"
2. **Pain Points**
   - Scalability challenges
   - Personalization at scale
   - Compliance and regulatory burdens
   - Client engagement
3. **Value Proposition**
   - White-label AI solution
   - API integration
   - Multi-client management
   - Compliance automation
4. **Use Cases Grid** (4-6 tiles)
   - Fintechs
   - Banks
   - Investment platforms
   - Wealth advisors
   - Asset managers
5. **Key Features**
   - 170+ proprietary datasets
   - Custom agents
   - Integration flexibility
6. CTAs: "Discover Solutions" (scroll/link) and "Request a Demo"
- Replace the experimental “Prêt à explorer l’accès entreprise” block with the legacy waitlist/contact section from `businesses.html` and append it directly after the FAQ. This becomes the anchor `#enterprise-waitlist`.
- Remove the grey “Contactez-nous” CTA, ensure only the charter CTA (dark button) remains, and wire it to `#enterprise-waitlist`.
- Fix the FR/EN language toggle markup so it mirrors the root header (buttons with `.active` class); ensure translations load to avoid blank headers.
- Update hero CTAs: primary links to `/professionals/solutions-companies`, secondary to `/professionals/demo`.
- Footer must match Bubble design (logo left, nav columns, socials) just like `/investors`.

#### **B. `/professionals/solutions-companies.html`**

**Target:** SMEs and independent Wealth Managers that need pragmatic AI consulting (no fintech/banks focus).  
**Purpose:** Showcase custom AI workflow delivery (Claude Code, Codex, Gemini builders + API integrations) plus the `/api/business-contact` form.

**Required structure (FR + EN):**
1. **Hero** – Title: "AI consulting for SMEs & Wealth Managers" (translation key `professionals.solutions.companies.hero.title`) with subtitle referencing custom AI copilots and CTA "Discutons de votre projet" → `#project-form`.
2. **Solutions Grid** – 5 tiles mapped to translation keys (`tile1`..`tile5`): custom AI workflow sprints, revenue recognition automation, monthly reporting copilots, client intelligence digests, custom dashboards.
3. **CTA repeat** – Button below the grid linking to `#project-form`.
4. **Pinned Blog Preview** – Section title "AI & Consulting Insights" with article + CTA pointing to the legacy slug.
5. **Pricing Paragraph** – Transparent €15k-30k copy, no mention of fintech/banks/ESG.
6. **Contact Form** – Same fields as `/businesses` (Company, Name, Email, Use case, Budget, Timeline). Posts to `/api/business-contact`, includes success/error panels, and uses the `businesses.*` translation keys.
7. **Shared Footer + Floating Chatbot** – Links route to `/professionals` anchors (not `/#waitlist`).

Implementation notes:
- Only reference SMEs/Wealth Managers and custom AI code builders; avoid promising managed services or low-code kits.
- CTA labels must use translation keys (`professionals.solutions.companies.form.button`) so FR/EN stay in sync.
- Blog and pricing content appear once; no duplicate “approach/values/testimonials” blocks.

#### **C. `/professionals/solutions-wealth-managers.html`**

**Target:** Wealth Managers, family offices, RIAs evaluating the white-label Bubble Portfolio.  
**Purpose:** Present Bubble Portfolio’s professional feature set without reintroducing the consulting sections.

**Required structure (FR + EN):**
1. **Hero** – Text from `professionals.solutions.wealth.hero.*` describing the white-label Bubble Portfolio.
2. **Feature Grid (6 tiles)** – Multi-client dashboard, personalized AI agents, advanced reporting, broker APIs, 20+ years of data, quant strategy library.
3. **CTA block** – Section `#pro-demo` using `professionals.solutions.wealth.cta.*` with two buttons:
   - "See the demo" (`href="#pro-demo"`, placeholder until the demo overlay ships)
   - "Contact us / Contactez-nous" → `/professionals#enterprise-waitlist` (FR) or `/en/professionals#enterprise-waitlist` (EN)
4. **Shared Footer + Floating Chatbot** identical to the companies page.

Implementation notes:
- No legacy sections (“approach”, “values”, “pricing”, duplicate workflows). The page is intentionally lean.
- CTA copy lives in translation keys only; ensure both locales share the same structure.
- All outbound professional CTAs route to `/professionals#enterprise-waitlist` (never `/#waitlist`).

#### **D. `/professionals/demo.html` (Professional Demo)**

**Content:**
- Standalone demo page (NOT knowledge overlay)
- Pre-configured professional prompts:
  - "Generate a model portfolio for a 45-year-old with moderate risk"
  - "Show me sector allocation for conservative growth strategy"
  - "Backtest a 60/40 portfolio vs risk parity over 10 years"
- Live chat interface with AI agent
- No beginner/intermediate/expert selection
- Focus on professional use cases
- CTA: "Contact Us to Integrate" or "Schedule a Call"

#### **E. `/professionals/faq.html` (Professional FAQ)**

**Location:** Dedicated FAQ page (NOT in pricing)

**FAQ Content** (10-12 questions specific to professionals):

**Q1: "Comment intégrer Bubble à ma plateforme?" / "How can I integrate Bubble into my platform?"**
- Answer: API-first architecture, REST endpoints
- Multiple integration patterns available
- Full technical documentation
- Support during integration

**Q2: "Quels sont les délais d'intégration?" / "How long does integration take?"**
- Answer: 2-4 weeks for standard setup
- Depends on complexity and customization
- Dedicated integration team

**Q3: "Quels sont les coûts?" / "How is pricing structured?"**
- Answer: Depends on volume, API calls, customization
- No AUM fees
- Transparent, per-unit cost model

**Q4: "Conformité réglementaire?" / "Is Bubble compliance-ready?"**
- Answer: Built for KYC, GDPR, AMF compliance from Day 1
- Audit logs and documentation
- Regular security audits

### 4.4 Professional Journey Checklist
- [x] `/professionals` directories (FR + EN) contain all required pages.
- [x] Navigation exposes Vision + Solutions dropdown (Companies, Wealth Managers) + Blog + Contact + CTA.
- [x] `/professionals/demo` (FR + EN) shows the preconfigured prompt buttons (via `data-prompt-key`) and excludes the retail overlay.
- [x] Enterprise CTA + waitlist anchor added to `/professionals` (FR + EN) so header CTAs have a dedicated target.
- [ ] Ensure every professional subpage header (solutions, demo, FAQ, contact) matches the Bubble design charter: brand/tagline block, CTA → `#enterprise-waitlist`, `.lang-toggle` buttons.
- [ ] `/professionals/solutions-companies` (FR + EN) uses the SME/CGPs consulting layout: hero, 5 solutions tiles, blog preview, pricing paragraph, and the `/api/business-contact` form with translation keys only.
- [ ] `/professionals/solutions-wealth-managers` (FR + EN) focuses solely on the white-label Bubble Portfolio with the 6-tile feature grid and the demo/contact CTA strip (no duplicate “approach/values/pricing” sections).
- [ ] Confirm no professional footer/nav link references `/#waitlist`; all “join/contact” links route to `/professionals#enterprise-waitlist`.
- [ ] Chatbot (floating input + side panel) is present on every professional page and receives the correct `pageContext` metadata (`professionals_companies` vs `professionals_wealth`).
- [ ] Investor + professional CTAs consistently read “Contact us / Contactez-nous” and use pill styling per the Bubble design system.

**Q5: "Sécurité des données?" / "How secure is my client data?"**
- Answer: Bank-grade encryption
- SOC 2 Type II certified
- Regular security assessments
- Data residency options

**Q6: "Support client?" / "What level of support is available?"**
- Answer: Dedicated account manager
- 24/7 technical support
- Regular business reviews
- Training and onboarding

**Q7: "Personnalisation?" / "Can you customize the solution?"**
- Answer: Yes, extensive customization available
- Custom agents, guardrails, workflows
- Branded interface options
- White-label available

**Q8: "Contrats de niveau de service?" / "Are there SLA guarantees?"**
- Answer: 99.9% uptime SLA
- Response time guarantees
- Performance metrics dashboard
- Credits for downtime

**Q9: "Portée des données?" / "What data sources are available?"**
- Answer: 170+ proprietary datasets
- Real-time market data
- Custom data integration possible
- Historical backtesting (17+ years)

**Q10: "Multi-devise?" / "Do you support multiple currencies?"**
- Answer: Yes, 30+ currencies supported
- Real-time FX conversion
- Client statement support

**Q11: "Concurrence de marché?" / "How is Bubble different from competitors?"**
- Answer: AI empowerment vs. asset management
- Better UX and integration
- Transparent costs
- Cutting-edge technology

**Q12: "Plan de feuille de route?" / "What's your product roadmap?"**
- Answer: Quarterly releases and improvements
- Community feedback integration
- Transparent roadmap
- Early access to beta features

---

#### **F. `/professionals/contact.html` (Contact/Inquiry Form)**

**Content:**
- Move contact form from current `/businesses.html`
- Form fields:
  - Name, Email, Company
  - Role (Founder, CTO, CFO, Other)
  - Company type (Fintech, Bank, Platform, Advisor, Asset Manager, Other)
  - Project description
  - Budget range (optional)
  - Timeline (optional)
- Submission to `/api/business-contact` endpoint
- Response: "We'll be in touch within 24 hours"
- Privacy disclaimer
- This is the canonical `#enterprise-waitlist` anchor; the nav CTA and footer buttons must scroll to it instead of reloading the page.

---

### 4.4 Professional Translation Keys

**Estimate:** ~90 new translation keys for professional pages

**Key categories:**
- Navigation: `professionals.nav.*` (7 keys)
- Vision/Hero: `professionals.hero.*`, `professionals.vision.*`
- Solutions pages: `professionals.solutions.companies.*`, `professionals.solutions.wealthManagers.*`
- FAQ: `professionals.faq.q1.question`, `professionals.faq.q1.answer`, etc. (12 questions × 2 = 24 keys)
- Contact: `professionals.contact.*`
- Demo: `professionals.demo.*`

---

## PHASE 5: UPDATE DEMO SYSTEM

### 5.1 Remove Auto-Triggers

**File:** `src/frontend/js/pricing-workflow-demo.js`

**Action:** Comment out or remove auto-play logic on page load

**Current Code to Remove:**
```javascript
// Remove or disable:
// if (!sessionStorage.getItem('bubble_workflow_demo_shown')) {
//   setTimeout(() => showDemo(), 500);
// }
```

### 5.2 Update Knowledge Overlay Triggering

**File:** `src/frontend/js/knowledge-overlay.js`

**Update `autoShowIfNeeded()` method:**

```javascript
autoShowIfNeeded() {
  // DISABLE auto-show on pricing page
  // Only show via explicit button/event trigger
  return;
}

// Ensure event listener works for explicit triggers
window.addEventListener('openKnowledgeOverlay', (e) => {
  this.show(e.detail?.entryPoint || 'unknown');
});
```

### 5.3 Demo Trigger Points

**Retail Demo Triggers:**
1. Homepage dual-path "Start now" button → Dispatches `openKnowledgeOverlay` (`entryPoint: 'dual_path_start'`)
2. Investor header/button "Try the demo" + Solution dropdown “Agent” option → Dispatch overlay with corresponding entry points.
3. “See the demo” CTA inside “A complete AI investment agent” (Vision page) → Dispatch overlay.
4. Knowledge overlay questionnaire → Launches appropriate demo scenario; when the modal closes, redirect to `/investors`.

**Professional Demo Triggers:**
1. Homepage dual-path "Discover" button → Temporarily links to `/professionals`; once professional demo instrumentation is complete, it should be able to deep-link to `/professionals/demo`.
2. Professional hero CTAs (“Discover solutions”, “See demo”) and solutions-page buttons → Navigate to `/professionals/demo`.
3. `/professionals/demo` page auto-loads chat interface with professional prompts; include a persistent “Contact our team” CTA that points to `/professionals#enterprise-waitlist`.

### 5.4 Professional Demo Instrumentation & CTA

1. Fire `gtag('event', 'professional_demo_entry', { entry_point })` whenever a user lands on `/professionals/demo` (include source info from referring button).
2. Attach analytics to each `data-prompt-key` button (event `demo_prompt_clicked` already exists—ensure it sets `audience: 'professional'`).
3. Add a “Contact us” panel on the demo page linking to `#enterprise-waitlist` so enterprise users remain in the professional flow.
4. Consider adding a dedicated CTA (“Talk to our enterprise team”) inside the demo transcript area that fires `professional_demo_contact_click`.

---

## PHASE 6: GLOBAL ELEMENTS

### 6.1 Floating Chatbot (All Pages)

**Requirement:** Maintain floating chat input + side panel on ALL pages

**Implementation:**
- Import `floating-chat-input.js` on all page layouts
- Import `chat-side-panel.js` on all page layouts
- Include HTML snippets for both components
- Update context detection to include new paths

**Update `chat-side-panel.js` context detection:**

```javascript
detectPageContext() {
  const path = window.location.pathname;

  if (path.includes('/investors')) {
    if (path.includes('/pricing')) return 'investor_pricing';
    if (path.includes('/simulator')) return 'investor_simulator';
    if (path.includes('/join-us')) return 'investor_waitlist';
    return 'investor_general';
  }

  if (path.includes('/professionals')) {
    if (path.includes('/demo')) return 'professional_demo';
    if (path.includes('/solutions')) return 'professional_solutions';
    if (path.includes('/contact')) return 'professional_contact';
    return 'professional_general';
  }

  // Original paths
  if (path.includes('/pricing')) return 'pricing';
  if (path.includes('/simulator')) return 'simulator';
  if (path.includes('/businesses')) return 'businesses';

  return 'index';
}
```

### 6.2 Language Toggle (All Pages)

**Current Behavior:** URL-based routing (`/` ↔ `/en/`)

**Keep This Approach:**
- Investor pages: `/investors` ↔ `/en/investors`
- Professional pages: `/professionals` ↔ `/en/professionals`
- Blog: `/blog` ↔ `/en/blog`
- Benefits: Better SEO, clearer routing

### 6.3 Blog (Shared)

**Location:** `/blog` and `/en/blog` (unchanged)

**Access Points:**
- From investor pages: Header link "Blog"
- From professional pages: Header link "Blog"
- From homepage: Blog preview section

**Content:** Same articles for both audiences

---

## PHASE 7: FORMS CONSOLIDATION

### 7.1 Waitlist Form

**Current Location:** Homepage `#waitlist` section

**New Location:** `/investors/join-us`

**Actions:**
1. MOVE HTML from homepage to new page
2. Keep form fields unchanged
3. Keep submission endpoint `/api/waitlist`
4. Pre-fill hidden field or track `userType: 'retail'`

### 7.2 Contact Form

**Current Location:** `/businesses.html` (embedded)

**New Location:** `/professionals/contact`

**Actions:**
1. MOVE HTML from businesses page
2. Keep form fields unchanged
3. Keep submission endpoint `/api/business-contact`
4. Pre-fill hidden field or track `userType: 'professional'`

### 7.3 Form Cleanup

**Homepage Changes:**
- Remove old "Join Us" button from hero (already handled in Phase 1).
- Delete the embedded form entirely; the homepage now shows only the CTA-based “Construisons l’avenir ensemble” block that links to `/investors/join-us`.
- Ensure there are no lingering references to `/investors/join-us#form` and that analytics track CTA clicks instead of form submissions on `/`.

---

## PHASE 8: ACCESSIBILITY & INTERNATIONALIZATION

### 8.1 Accessibility Requirements

**All Interactive Elements:**
- ✅ ARIA roles and labels
- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ Focus indicators (visible outlines)
- ✅ Screen reader compatibility
- ✅ Color contrast WCAG AA compliant

**Specific Components:**
- Knowledge overlay: Focus trap, ARIA dialog
- Hero chat input: ARIA labels, form semantics
- Dual-path cards: Keyboard accessible links/buttons
- Navigation dropdowns: Keyboard accessible
- Chat side panel: Focus management
- Forms: Proper labels, validation messages

### 8.2 Internationalization - Translation Keys Summary

**Total New Keys Estimate:** ~170 translation keys

**Breakdown:**
- Dual-path update: 12 keys
- Investor pages: ~80 keys
  - Navigation: 5
  - Content sections: ~50
  - FAQ: 24
  - CTAs/miscellaneous: ~5
- Professional pages: ~90 keys
  - Navigation: 7
  - Content sections: ~55
  - FAQ: 24
  - CTAs/miscellaneous: ~5

**Implementation:**
- All keys follow pattern: `section.subsection.key`
- Each key has both `en` and `fr` values
- Add to `src/frontend/i18n/translations.js`
- Test language toggle on all new pages

---

## PHASE 9: TESTING & QA

### 9.1 Testing Checklist

**Functionality:**
- [ ] Hero chat input accepts input and opens side panel
- [ ] Rotating placeholders animate correctly
- [ ] Dual-path "Start now" triggers knowledge overlay
- [ ] Dual-path professional tile links to `/professionals`
- [ ] Knowledge overlay shows on button clicks (not auto)
- [ ] All investor pages load correctly
- [ ] All professional pages load correctly
- [ ] Forms submit successfully
- [ ] Language toggle switches all text
- [ ] Floating chatbot works on all pages
- [ ] Blog accessible from both journeys

**Responsive Design:**
- [ ] Desktop layout (1024px+)
- [ ] Tablet layout (481-1024px)
- [ ] Mobile layout (≤480px)
- [ ] All pages responsive
- [ ] Touch targets 44px minimum

**Localization:**
- [ ] All FR pages have French content
- [ ] All EN pages have English content
- [ ] No missing translation keys
- [ ] Language toggle updates all UI elements
- [ ] FAQ questions and answers in both languages

**Cross-Browser:**
- [ ] Chrome/Edge
- [ ] Safari
- [ ] Firefox
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

**Performance:**
- [ ] Page load times < 3 seconds
- [ ] Chat responsiveness
- [ ] Chart/simulator performance
- [ ] No console errors

**SEO Compliance:**
- [ ] Meta tags on all pages
- [ ] Proper heading hierarchy
- [ ] Image alt text
- [ ] Mobile-friendly
- [ ] Sitemap updated (Phase 10)

---

## PHASE 10: FINAL DEPLOYMENT & MONITORING

### 10.1 Pre-Deployment Checklist

- [ ] All pages tested on multiple devices/browsers
- [ ] All forms tested and validated
- [ ] Analytics events configured
- [ ] Chatbot context detection updated
- [ ] No console errors or warnings
- [ ] Performance tested
- [ ] Accessibility audit passed
- [ ] SEO requirements met
- [ ] Backup of current site created
- [ ] Rollback plan documented

### 10.2 Post-Deployment Monitoring

**Metrics to Track:**
- User flow completion rates (homepage → demo → waitlist)
- Demo start vs completion rates by experience level
- Form submission rates
- Floating chatbot engagement
- Language toggle usage
- Page load times
- Error rates and console errors
- Mobile vs desktop traffic patterns

---

## IMPLEMENTATION ORDER & VERIFICATION STEPS

### **Step 1: Homepage Updates** (2 hours)
**Actions:**
1. Restore hero chat input (FR + EN)
2. Update dual-path selector UI
3. Add translation keys
4. Remove old "Join Us" CTA
5. Test chat functionality and rotating placeholders

**Verification:** User tests homepage, confirms chat works and demos trigger correctly

---

### **Step 2: Create Investor Directory** (1 hour)
**Actions:**
1. Create directory structure
2. Create investor header component
3. Create `/investors/index.html` (FR + EN) - Vision page
4. Set up navigation

**Verification:** User navigates to `/investors`, confirms layout and links work

---

### **Step 3: Implement Investor Pages** (6 hours)
**Actions:**
1. Create `/investors/solution.html` (FR + EN)
2. Create `/investors/pricing.html` (FR + EN) with FAQ section
3. Create `/investors/portfolio-simulator.html` (FR + EN)
4. Create `/investors/join-us.html` (FR + EN)
5. Test each page individually
6. Verify forms work

**Verification:** User reviews each investor page, confirms content accuracy and forms function

---

### **Step 4: Create Professional Directory** (1 hour)
**Actions:**
1. Create directory structure
2. Create professional header component
3. Create `/professionals/index.html` (FR + EN) - Vision page

**Verification:** User navigates to `/professionals`, confirms layout

---

### **Step 5: Implement Professional Pages** (8 hours)
**Actions:**
1. Create `/professionals/solutions-companies.html` (FR + EN)
2. Create `/professionals/solutions-wealth-managers.html` (FR + EN)
3. Create `/professionals/demo.html` (FR + EN)
4. Create `/professionals/faq.html` (FR + EN)
5. Create `/professionals/contact.html` (FR + EN)
6. Test each page individually
7. Verify forms work

**Verification:** User reviews each professional page, confirms content and links

---

### **Step 6: Update Demo System** (2 hours)
**Actions:**
1. Remove auto-trigger from pricing page
2. Update knowledge overlay to trigger on button clicks only
3. Update dual-path to open overlay
4. Test demo flow

**Verification:** User tests complete demo flow (homepage → dual-path → overlay → demo)

---

### **Step 7: Global Elements** (2 hours)
**Actions:**
1. Add floating chatbot to all new pages
2. Add language toggles to all headers
3. Update chat context detection
4. Test chatbot on all pages
5. Test language switching

**Verification:** User tests chatbot and language toggle on multiple pages

---

### **Step 8: Forms & Analytics** (2 hours)
**Actions:**
1. Verify waitlist form works on `/investors/join-us`
2. Verify contact form works on `/professionals/contact`
3. Add analytics tracking to new pages
4. Test form submissions
5. Verify analytics events fire

**Verification:** User submits test forms, checks analytics

---

### **Step 9: Translation Keys** (2 hours)
**Actions:**
1. Add all new translation keys to `translations.js`
2. Ensure all FR keys have French text
3. Ensure all EN keys have English text
4. Test language switching on all pages
5. Check for missing translation warnings

**Verification:** User switches language on all pages, confirms no errors

---

### **Step 10: Final QA & Launch** (4 hours)
**Actions:**
1. Run full testing checklist (Phase 9)
2. Cross-browser testing
3. Mobile responsiveness testing
4. Accessibility audit
5. Performance check
6. Fix any issues found
7. Deploy to staging/production
8. Monitor analytics and errors

**Verification:** User performs comprehensive QA, approves for live deployment

---

## ESTIMATED EFFORT BREAKDOWN

| Phase | Task | Duration | Total |
|-------|------|----------|-------|
| 1 | Homepage updates | 2 hours | 2 hrs |
| 2 | Investor directory | 1 hour | 1 hr |
| 3 | Investor pages | 6 hours | 6 hrs |
| 4 | Professional directory | 1 hour | 1 hr |
| 5 | Professional pages | 8 hours | 8 hrs |
| 6 | Demo system | 2 hours | 2 hrs |
| 7 | Global elements | 2 hours | 2 hrs |
| 8 | Forms & analytics | 2 hours | 2 hrs |
| 9 | Translations | 2 hours | 2 hrs |
| 10 | QA & launch | 4 hours | 4 hrs |
| **Total** | **All phases** | **30 hours** | **30 hrs** |

**Plus verification steps between phases: ~2 hours**

**Grand Total: ~32 hours**

---

## SUCCESS CRITERIA

✅ Hero chat input with rotating placeholders functional on homepage
✅ Dual-path selector updated with feature bullets and correct CTAs
✅ Investor journey complete with 5 pages + FAQ (FR + EN)
✅ Professional journey complete with 6 pages + FAQ (FR + EN)
✅ No auto-trigger demos (all explicit button clicks)
✅ One waitlist form in `/investors/join-us`
✅ One contact form in `/professionals/contact`
✅ Floating chatbot works on all pages
✅ Language toggle works on all pages
✅ All translation keys present (FR + EN) including FAQs
✅ All pages accessible (ARIA, keyboard nav)
✅ All pages responsive (mobile, tablet, desktop)
✅ All forms submit successfully
✅ Analytics tracking on all new pages
✅ No console errors or warnings
✅ SEO meta tags on all pages

---

## NOTES

### ⚠️ CRITICAL: GIT OPERATIONS POLICY
- **DO NOT COMMIT** any changes without explicit user approval
- **DO NOT PUSH** any changes to remote without explicit user approval
- **WAIT FOR USER VERIFICATION** after each phase before any git operations
- **ONLY COMMIT** when user explicitly requests: "commit this" or "save this"
- **ALWAYS SHOW SUMMARY** of changes before proposing any commit
- This applies to ALL phases, ALL files, and ALL modifications

### Implementation Guidelines
- **No commits/pushes** until user approval after each verification step
- **Step-by-step verification** ensures quality at each phase
- **Both FR and EN** implemented simultaneously to avoid drift
- **Preserve all existing functionality** (chatbot, translations, analytics)
- **FAQ sections** integrated into both investor and professional journeys
- **Professional FAQ** as dedicated page (more content than investor FAQ)
- **SEO review deferred** to post-implementation (sitemaps, meta tags)

---

## APPENDIX: FAQ TRANSLATION STRATEGY

### Investor FAQ Keys (12 questions)

```javascript
"investors.faq.q1.question": { en: "...", fr: "..." },
"investors.faq.q1.answer": { en: "...", fr: "..." },
// ... repeat for q2-q12
```

### Professional FAQ Keys (12 questions)

```javascript
"professionals.faq.q1.question": { en: "...", fr: "..." },
"professionals.faq.q1.answer": { en: "...", fr: "..." },
// ... repeat for q2-q12
```

All FAQ text to be added to `translations.js` in Phase 9.

---

**Document Status:** ✅ READY FOR PHASE 1 IMPLEMENTATION

**Approval Date:** November 15, 2025
**Plan Version:** 1.0
**Next Step:** User approval and Phase 1 commencement
