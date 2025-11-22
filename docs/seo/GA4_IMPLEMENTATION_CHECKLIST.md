# Google Analytics 4 Implementation Checklist

**Date Started**: [DATE]
**Target Completion**: Week 1 (by Friday)
**Measurement ID**: `G-XXXXXXXXXX` (UPDATE THIS AFTER STEP 1)

---

## Phase 1: GA4 Property Setup (30 minutes)

### Step 1: Create GA4 Property
- [ ] Go to https://analytics.google.com/
- [ ] Click "+ Create" → "Property"
- [ ] Enter property name: "Bubble Invest - BubbleLaunch"
- [ ] Set timezone: Europe/Paris
- [ ] Set currency: EUR
- [ ] Click "Create"
- [ ] Select "Web" platform
- [ ] Enter stream name: "bubbleinvest.org"
- [ ] Enter website URL: "https://bubbleinvest.org"
- [ ] **COPY MEASUREMENT ID**: `G-_________________________`
- [ ] Add to `.env`: `GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX`

---

## Phase 2: Add Tracking Code to All Pages (90 minutes)

### French Pages - Add to `<head>` before `</head>`:

- [ ] `src/frontend/pages/index.html` - Homepage
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

- [ ] `src/frontend/pages/pricing.html` - Pricing
- [ ] `src/frontend/pages/portfolio-simulator.html` - Simulator
- [ ] `src/frontend/pages/blog.html` - Blog listing
- [ ] `src/frontend/pages/blog-post.html` - Blog post template
- [ ] `src/frontend/pages/investors/index.html` - Investors page
- [ ] `src/frontend/pages/investors/pricing.html` - Investor pricing
- [ ] `src/frontend/pages/professionals/index.html` - Professionals page
- [ ] `src/frontend/pages/professionals/demo.html` - Professional demo
- [ ] `src/frontend/pages/professionals/solutions-companies.html` - Companies
- [ ] `src/frontend/pages/professionals/solutions-wealth-managers.html` - Wealth managers
- [ ] `src/frontend/pages/privacy.html` - Privacy policy
- [ ] `src/frontend/pages/mentions-legales.html` - Legal notice
- [ ] `src/frontend/pages/professionals/contact.html` - Professional contact (if exists)

### English Pages - Add to `<head>` before `</head>`:

- [ ] `src/frontend/pages/en/index.html` - Homepage EN
- [ ] `src/frontend/pages/en/pricing.html` - Pricing EN
- [ ] `src/frontend/pages/en/portfolio-simulator.html` - Simulator EN
- [ ] `src/frontend/pages/en/blog.html` - Blog listing EN
- [ ] `src/frontend/pages/en/blog-post.html` - Blog post template EN
- [ ] `src/frontend/pages/en/investors/index.html` - Investors page EN
- [ ] `src/frontend/pages/en/investors/pricing.html` - Investor pricing EN
- [ ] `src/frontend/pages/en/professionals/index.html` - Professionals page EN
- [ ] `src/frontend/pages/en/professionals/demo.html` - Professional demo EN
- [ ] `src/frontend/pages/en/professionals/solutions-companies.html` - Companies EN
- [ ] `src/frontend/pages/en/professionals/solutions-wealth-managers.html` - Wealth managers EN
- [ ] `src/frontend/pages/en/privacy.html` - Privacy policy EN
- [ ] `src/frontend/pages/en/legal-notice.html` - Legal notice EN
- [ ] `src/frontend/pages/en/professionals/contact.html` - Professional contact EN (if exists)

**Total Pages**: 26 (businesses.html pages deleted)

---

## Phase 3: Test Implementation (30 minutes)

### Verification Steps:

1. **Real-time Dashboard Test**
   - [ ] Open https://analytics.google.com/
   - [ ] Go to Real-time → Overview
   - [ ] Visit https://bubbleinvest.org in new browser tab
   - [ ] Should see yourself as active user within 5 seconds
   - [ ] ✅ Confirmed: Real-time tracking works

2. **Event Tracking Test**
   - [ ] Go to Real-time → Events
   - [ ] Click a CTA button on website
   - [ ] Should see event appear in real-time
   - [ ] ✅ Confirmed: Events are tracking

3. **Form Submission Test**
   - [ ] Scroll to waitlist form
   - [ ] Enter test data and submit
   - [ ] Check GA4 events for form_submit
   - [ ] ✅ Confirmed: Form tracking works

4. **Multiple Device Test**
   - [ ] Test on mobile device
   - [ ] Test in incognito/private mode
   - [ ] Test in different browser
   - [ ] ✅ Confirmed: Works across devices

---

## Phase 4: Configure Custom Events (30 minutes)

### Event 1: CTA Click Tracking
- [ ] Find all CTA buttons in codebase:
  - Waitlist buttons
  - Demo request buttons
  - Contact buttons
  - Pricing CTAs

- [ ] Add event code to buttons:
  ```html
  <button onclick="gtag('event', 'cta_click', { 'cta_name': 'waitlist', 'cta_location': 'homepage' })">
    Early Access
  </button>
  ```

- [ ] Test: Click button → Event appears in GA4 Real-time

### Event 2: Form Submissions
- [ ] Find all form elements
- [ ] Add submit listener:
  ```javascript
  document.getElementById('waitlist-form').addEventListener('submit', function() {
    gtag('event', 'form_submit', {
      'form_name': 'waitlist',
      'form_location': 'homepage'
    });
  });
  ```

- [ ] Test: Submit form → Conversion appears in GA4

### Event 3: Portfolio Simulator Interaction
- [ ] Track strategy selection:
  ```javascript
  gtag('event', 'simulator_interaction', {
    'interaction_type': 'strategy_selected',
    'strategy_name': 'Risk Parity'
  });
  ```

- [ ] Track export actions:
  ```javascript
  gtag('event', 'simulator_interaction', {
    'interaction_type': 'export',
    'export_format': 'csv'
  });
  ```

### Event 4: Page Views with Category
- [ ] Blog posts include:
  ```javascript
  gtag('event', 'page_view', {
    'page_title': 'Article Title',
    'page_category': 'blog',
    'page_language': 'fr'
  });
  ```

---

## Phase 5: Privacy & GDPR Integration (Optional but Recommended)

### Tarteaucitron Integration
- [ ] Update `/src/frontend/js/seo/cookie-consent.js`
- [ ] Add GA4 as optional analytics service
- [ ] Only load GA4 after user consent
- [ ] Test cookie banner works with GA4

### Privacy Policy Update
- [ ] Add GA4 section to `/src/frontend/pages/privacy.html`
- [ ] Add GA4 section to `/src/frontend/pages/en/privacy.html`
- [ ] Document anonymization settings
- [ ] Link to Google Analytics privacy policy

---

## Phase 6: Goal Configuration (30 minutes)

### Goal 1: Waitlist Signup
- [ ] In GA4, go to Admin → Goals
- [ ] Create goal: "Investor Waitlist Signup"
- [ ] Condition: Event equals `form_submit` where `form_name` = `waitlist`
- [ ] Conversion value: €50
- [ ] ✅ Confirmed: Goal is tracking

### Goal 2: Demo Request
- [ ] Create goal: "Professional Demo Request"
- [ ] Condition: Event equals `form_submit` where `form_name` = `demo_request`
- [ ] Conversion value: €100
- [ ] ✅ Confirmed: Goal is tracking

### Goal 3: Simulator Usage
- [ ] Create goal: "Portfolio Simulator Interaction"
- [ ] Condition: Event equals `simulator_interaction`
- [ ] ✅ Confirmed: Goal is tracking

### Goal 4: Pricing Page View
- [ ] Create goal: "Pricing Page Visit"
- [ ] Condition: Page path equals `/pricing` OR `/en/pricing`
- [ ] ✅ Confirmed: Goal is tracking

---

## Phase 7: Reporting Setup (20 minutes)

### Standard Reports to Create:

- [ ] **Traffic Summary**
  - Path: Home → Acquisition → All traffic
  - Metric: Sessions, Users, Bounce rate
  - Frequency: Check daily

- [ ] **Top Pages**
  - Path: Engagement → Pages and screens
  - Metric: Views, Users, Avg duration
  - Goal: Identify best performing pages

- [ ] **Conversion Funnel**
  - Path: Conversions → Funnel
  - Steps: Homepage → Waitlist form → Confirmation
  - Goal: Measure conversion rate

- [ ] **Event Summary**
  - Path: Events
  - Events: cta_click, form_submit, simulator_interaction
  - Goal: Track user engagement

- [ ] **Blog Performance**
  - Path: Engagement → Pages
  - Filter: Page path contains `/blog/`
  - Goal: Identify top-performing articles

---

## Phase 8: Validation Checklist (Before "Complete")

### Core Functionality:
- [ ] GA4 code present in all 28 HTML pages
- [ ] Tracking ID matches across all pages
- [ ] Real-time dashboard shows active users
- [ ] Page views are being recorded
- [ ] Bounce rates are realistic

### Events Working:
- [ ] CTA clicks tracked and appear in GA4
- [ ] Form submissions tracked
- [ ] Simulator interactions tracked
- [ ] Blog page views categorized
- [ ] Pricing page views recorded

### Goals Configured:
- [ ] Waitlist signup goal tracking
- [ ] Demo request goal tracking
- [ ] Simulator usage goal tracking
- [ ] Pricing page goal tracking

### Privacy & GDPR:
- [ ] IP anonymization enabled
- [ ] Cookie consent integration (optional)
- [ ] Privacy policy updated with GA4 info
- [ ] No sensitive data being tracked

### Documentation:
- [ ] Measurement ID documented
- [ ] Custom events documented
- [ ] Goals documented
- [ ] Monitoring procedures documented

---

## Phase 9: Documentation & Handoff

### Create Monitoring Guide:
- [ ] Daily metrics to check (users, bounce rate)
- [ ] Weekly reports to review (traffic sources, top pages)
- [ ] Monthly analysis (trends, improvements)
- [ ] Conversion tracking setup

### Document Dashboard Links:
- [ ] Real-time overview: [Link]
- [ ] Acquisition report: [Link]
- [ ] Conversion funnel: [Link]
- [ ] Event tracking: [Link]
- [ ] Goals report: [Link]

### Team Training:
- [ ] Team member trained on GA4 basics
- [ ] Measurement ID shared securely
- [ ] Monthly review process established
- [ ] Data interpretation guidelines documented

---

## Timeline Summary

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 1 | Create GA4 property | 30 min | ⏳ |
| 2 | Add tracking to 28 pages | 90 min | ⏳ |
| 3 | Test implementation | 30 min | ⏳ |
| 4 | Configure custom events | 30 min | ⏳ |
| 5 | GDPR/Privacy setup | 30 min | ⏳ |
| 6 | Goal configuration | 30 min | ⏳ |
| 7 | Reporting setup | 20 min | ⏳ |
| 8 | Validation | 20 min | ⏳ |
| 9 | Documentation | 30 min | ⏳ |
| **TOTAL** | | **4 hours** | |

---

## Troubleshooting

### Issue: No data in Real-time dashboard
**Solution**:
- [ ] Verify Measurement ID is correct
- [ ] Check for console errors (F12 → Console)
- [ ] Verify script tag is in `<head>` before `</head>`
- [ ] Clear browser cache and reload
- [ ] Wait 5+ seconds before checking

### Issue: Events not appearing
**Solution**:
- [ ] Verify event name matches exactly (case-sensitive)
- [ ] Check for JavaScript errors in console
- [ ] Verify gtag function is called before event
- [ ] Wait 30 seconds and refresh GA4 dashboard

### Issue: Conversion not tracking
**Solution**:
- [ ] Verify goal condition is correct
- [ ] Check event name in goal matches event being fired
- [ ] Verify form is actually submitting
- [ ] Check network tab for any blocked requests

---

## Success Indicators ✅

After completing all phases, you should have:

✅ Active Google Analytics 4 tracking on all pages
✅ Real-time dashboard showing visitor activity
✅ Custom events tracking user interactions
✅ Conversion goals measuring business outcomes
✅ Baseline traffic metrics for future comparison
✅ Historical data to identify trends and opportunities

---

**Status**: Ready to implement
**Estimated Completion**: 4 hours focused work
**Next Review**: After initial data collection (48 hours)

