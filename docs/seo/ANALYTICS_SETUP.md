# Google Analytics 4 Setup Guide

**Date**: 2025-11-21
**Status**: 📋 **SETUP INSTRUCTIONS** (awaiting implementation)
**Priority**: HIGH (enables SEO performance measurement)

---

## 📋 Overview

This guide documents the Google Analytics 4 (GA4) setup for BubbleLaunch marketing website. GA4 is essential for tracking SEO performance, understanding user behavior, and measuring conversion rates.

**Current Status**: ❌ **NOT IMPLEMENTED** - No GA4 tracking code found in codebase
**Required for**: Measuring impact of SEO improvements, tracking conversions, understanding user journeys

---

## 🚀 Quick Start (10 minutes)

### Step 1: Create GA4 Property (If Not Already Created)

1. Go to **Google Analytics**: https://analytics.google.com/
2. Click **+ Create** button
3. Enter property name: `BubbleLaunch - Bubble Invest Marketing`
4. Set reporting timezone: **Europe/Paris** (France-based company)
5. Select currency: **EUR**
6. Click **Create**
7. Select **Web** as your platform
8. Configure stream:
   - **Stream name**: `bubbleinvest.org`
   - **Website URL**: `https://bubbleinvest.org`
   - **Stream ID**: `G-XXXXXXXXXX` (copy this - you'll need it)

### Step 2: Add Tracking Code to All HTML Pages

Copy the GA4 tracking code below to the `<head>` section of **ALL** HTML pages (after meta tags, before `</head>`):

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

**Replace `G-XXXXXXXXXX` with your actual GA4 Measurement ID**

### Step 3: Test Implementation

1. Go to your website: `https://bubbleinvest.org`
2. Open Google Analytics
3. Go to **Real-time** → **Overview**
4. You should see yourself as an active user within 5 seconds
5. Check that events are being tracked

---

## 📁 Files to Update

**Pages requiring GA4 tracking code** (add to `<head>` section):

### English Pages:
- [ ] `src/frontend/pages/en/index.html` - EN Homepage
- [ ] `src/frontend/pages/en/pricing.html` - EN Pricing
- [ ] `src/frontend/pages/en/portfolio-simulator.html` - EN Simulator
- [ ] `src/frontend/pages/en/blog.html` - EN Blog listing
- [ ] `src/frontend/pages/en/blog-post.html` - EN Individual blog posts
- [ ] `src/frontend/pages/en/investors/index.html` - EN Investor hub
- [ ] `src/frontend/pages/en/investors/solution.html` - EN How it works
- [ ] `src/frontend/pages/en/investors/pricing.html` - EN Investor pricing
- [ ] `src/frontend/pages/en/investors/join-us.html` - EN Investor waitlist
- [ ] `src/frontend/pages/en/professionals/index.html` - EN Professional hub
- [ ] `src/frontend/pages/en/professionals/solutions-companies.html` - EN Companies
- [ ] `src/frontend/pages/en/professionals/solutions-wealth-managers.html` - EN Wealth Managers
- [ ] `src/frontend/pages/en/professionals/demo.html` - EN Demo
- [ ] `src/frontend/pages/en/professionals/contact.html` - EN Contact

### French Pages:
- [ ] `src/frontend/pages/index.html` - FR Homepage
- [ ] `src/frontend/pages/pricing.html` - FR Pricing
- [ ] `src/frontend/pages/portfolio-simulator.html` - FR Simulator
- [ ] `src/frontend/pages/blog.html` - FR Blog listing
- [ ] `src/frontend/pages/blog-post.html` - FR Individual blog posts
- [ ] `src/frontend/pages/investors/index.html` - FR Investor hub
- [ ] `src/frontend/pages/investors/solution.html` - FR How it works
- [ ] `src/frontend/pages/investors/pricing.html` - FR Investor pricing
- [ ] `src/frontend/pages/investors/join-us.html` - FR Investor waitlist
- [ ] `src/frontend/pages/professionals/index.html` - FR Professional hub
- [ ] `src/frontend/pages/professionals/solutions-companies.html` - FR Companies
- [ ] `src/frontend/pages/professionals/solutions-wealth-managers.html` - FR Wealth Managers
- [ ] `src/frontend/pages/professionals/demo.html` - FR Demo
- [ ] `src/frontend/pages/professionals/contact.html` - FR Contact

### Static Pages:
- [ ] `src/frontend/pages/privacy.html` - Privacy Policy
- [ ] `src/frontend/pages/en/privacy.html` - Privacy Policy (EN)
- [ ] `src/frontend/pages/mentions-legales.html` - Legal Notice
- [ ] `src/frontend/pages/en/legal-notice.html` - Legal Notice (EN)

**Total**: 28 pages requiring tracking code

---

## 🎯 Key Events to Configure

### Event 1: CTA Click Tracking

**Event Name**: `cta_click`

**Triggers on**:
- Waitlist button clicks
- Demo request buttons
- Contact form submissions
- Pricing page CTAs

**Implementation**:
```html
<!-- Add to CTA buttons -->
<button onclick="gtag('event', 'cta_click', { 'cta_name': 'waitlist', 'cta_location': 'homepage' })">
  Early Access
</button>
```

**Examples**:
```javascript
// Waitlist signup
gtag('event', 'cta_click', {
  'cta_name': 'waitlist_signup',
  'cta_location': 'homepage'
});

// Demo request
gtag('event', 'cta_click', {
  'cta_name': 'demo_request',
  'cta_location': 'professionals_page'
});

// Pricing page contact
gtag('event', 'cta_click', {
  'cta_name': 'pricing_contact',
  'cta_location': 'pricing_page'
});
```

### Event 2: Portfolio Simulator Interaction

**Event Name**: `simulator_interaction`

**Triggers on**:
- Strategy selection
- Time period change
- Leverage toggle
- Export button clicks

**Implementation**:
```javascript
// When user selects strategy
gtag('event', 'simulator_interaction', {
  'interaction_type': 'strategy_selection',
  'strategy': 'risk_parity',
  'time_period': '20y'
});

// When user exports data
gtag('event', 'simulator_interaction', {
  'interaction_type': 'export',
  'export_format': 'csv'
});
```

### Event 3: Blog Post Views

**Event Name**: `page_view` (automatically tracked)

**Enhanced with**:
```javascript
// On blog post page load
gtag('event', 'page_view', {
  'page_title': 'Frais Fixes vs Frais en Pourcentage',
  'page_category': 'blog',
  'page_language': 'fr'
});
```

### Event 4: Pricing Page Visit

**Event Name**: `pricing_page_view`

**Implementation**:
```javascript
// On pricing page load
gtag('event', 'pricing_page_view', {
  'language': 'fr',
  'referrer': document.referrer
});
```

### Event 5: Form Submissions

**Event Name**: `form_submit`

**Triggers on**:
- Contact form submission
- Waitlist signup
- Demo request submission

**Implementation**:
```javascript
// On form submit
document.getElementById('contact-form').addEventListener('submit', function(e) {
  gtag('event', 'form_submit', {
    'form_name': 'contact_form',
    'form_location': 'professionals_contact'
  });
});
```

---

## 📊 Conversion Funnel to Track

### Primary Funnel: Investor Waitlist
1. **Homepage** → Click "Early Access"
2. **Waitlist Modal/Page** → Fill form
3. **Confirmation** → Thank you page

**GA4 Conversion**: Form submission on waitlist

### Secondary Funnel: Professional Demo
1. **Professionals Page** → Click "Request Demo"
2. **Demo Form** → Fill contact details
3. **Confirmation** → Thank you page

**GA4 Conversion**: Form submission on demo request

### Tertiary Funnel: Blog to Product
1. **Blog Post** → Read article
2. **"Try Simulator" CTA** → Click button
3. **Simulator** → Interact with tool
4. **"Ask AI" CTA** → Start chatbot

**GA4 Events**: Blog view → Simulator interaction → CTA click

---

## 🔍 Reports to Create

### Report 1: Top Traffic Sources
- **Path**: Google Analytics → Acquisition → Traffic source
- **Metric**: Session count by source/medium
- **Goal**: Identify best-performing SEO keywords

### Report 2: Conversion Funnel
- **Path**: Google Analytics → Conversion → Funnel
- **Segments**:
  - Waitlist signups
  - Demo requests
  - Contact form submissions
- **Metric**: Conversion rate by stage

### Report 3: Page Performance
- **Path**: Google Analytics → Engagement → Pages and screens
- **Top pages**: Monitor views on:
  - Homepage
  - Pricing page
  - Portfolio simulator
  - Investor hub pages
  - Professional hub pages

### Report 4: User Behavior
- **Path**: Google Analytics → Engagement → User journey
- **Metrics**:
  - Average session duration
  - Bounce rate by page
  - Pages per session

### Report 5: Event Tracking
- **Path**: Google Analytics → Events
- **Events to monitor**:
  - CTA clicks
  - Simulator interactions
  - Form submissions

---

## 📈 Key Metrics to Monitor

### Daily Monitoring:
- **Active Users**: How many people visit the site
- **New vs Returning**: Ratio of new to returning visitors
- **Conversion Rate**: Percentage of visitors completing desired action

### Weekly Monitoring:
- **Traffic by Source**: Which channels drive most traffic
- **Page Performance**: Which pages get most views
- **Bounce Rate**: Which pages need improvement

### Monthly Monitoring:
- **Organic Traffic**: Impact of SEO improvements
- **Conversion Trends**: Are conversions improving?
- **User Journey**: How do users navigate your site?

---

## 🚨 GDPR & Privacy Considerations

### Cookie Consent Integration
- GA4 requires explicit consent in EU (GDPR)
- Your site uses Tarteaucitron for cookie management
- **Update needed**: Add GA4 as optional analytics service in Tarteaucitron config

### Implementation:
```javascript
// In src/frontend/js/seo/cookie-consent.js

tarteaucitron.job = ['bubblechat', 'bubblelanguage', 'google-analytics'];

tarteaucitron.services.google-analytics = {
  key: 'google-analytics',
  type: 'analytics',
  name: 'Google Analytics',
  uri: 'https://policies.google.com/privacy',
  needConsent: true,
  cookies: ['_ga', '_gid'],
  js: function(callback) {
    // GA4 implementation with consent
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('consent', 'default', {
      'analytics_storage': 'denied'
    });
    // Load GA4 script only after user consent
    if(callback) callback();
  }
};
```

### Anonymization Settings:
- ✅ Already configured: `'anonymize_ip': true` (recommended)
- ✅ Already configured: `'SameSite=None;Secure'` (GDPR compliant)

---

## ✅ Implementation Checklist

### GA4 Setup:
- [ ] Create GA4 property in Google Analytics
- [ ] Get Measurement ID (G-XXXXXXXXXX)
- [ ] Set up data streams
- [ ] Configure consent settings

### Tracking Code:
- [ ] Add GA4 code to all 28+ HTML pages
- [ ] Test in real-time dashboard
- [ ] Verify events are firing correctly
- [ ] Check for any console errors

### Events Configuration:
- [ ] Configure CTA click events
- [ ] Configure simulator interaction events
- [ ] Configure form submission events
- [ ] Configure pricing page events
- [ ] Configure blog post view events

### Privacy/Compliance:
- [ ] Integrate with Tarteaucitron cookie consent
- [ ] Update privacy policy to mention GA4
- [ ] Test cookie banner and consent flow
- [ ] Verify anonymization is working

### Testing:
- [ ] Open website in incognito/private mode
- [ ] Watch real-time dashboard in GA4
- [ ] Click CTAs and verify events track
- [ ] Submit forms and verify conversions track
- [ ] Test on mobile devices
- [ ] Test in different browsers

### Documentation:
- [ ] Document GA4 property ID
- [ ] Document custom events
- [ ] Document conversion goals
- [ ] Create runbook for monitoring reports

---

## 📞 Verification Steps

### Immediate (After Implementation):
1. **Real-time Dashboard**
   - Go to Google Analytics → Real-time → Overview
   - Load your website
   - Should see yourself as active user within 5 seconds

2. **Event Tracking**
   - Click CTA button → Check Events in real-time
   - Should see `cta_click` event within seconds

3. **Conversion Tracking**
   - Submit form → Check Conversions in real-time
   - Should see conversion event recorded

### 24 Hours Later:
1. **Data Collection**
   - Check if traffic data is accumulating
   - Verify multiple sessions recorded
   - Confirm events are tracked

2. **Reports**
   - Check Traffic and Engagement reports
   - Verify events appear in Events report
   - Confirm conversions are being tracked

### 7 Days Later:
1. **Analysis**
   - Review top pages
   - Identify traffic sources
   - Analyze conversion funnel
   - Check bounce rates

---

## 🎯 Goals to Set Up in GA4

### Goal 1: Waitlist Signup
- **Name**: Investor Waitlist Signup
- **Condition**: Event equals `form_submit` where `form_name` equals `waitlist`
- **Value**: €50 (estimated lead value)

### Goal 2: Demo Request
- **Name**: Professional Demo Request
- **Condition**: Event equals `form_submit` where `form_name` equals `demo_request`
- **Value**: €100 (estimated enterprise lead value)

### Goal 3: Pricing Page Visit
- **Name**: Pricing Page Visit
- **Condition**: Page path equals `/pricing` or `/en/pricing`
- **Value**: €10 (early interest indicator)

### Goal 4: Simulator Usage
- **Name**: Portfolio Simulator Interaction
- **Condition**: Event equals `simulator_interaction`
- **Value**: €5 (engagement metric)

---

## 📚 Recommended Reading

- [Google Analytics 4 Documentation](https://support.google.com/analytics#topic=9303319)
- [GA4 Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)
- [GA4 Events Reference](https://support.google.com/analytics/answer/9267744)
- [GDPR and Google Analytics](https://support.google.com/analytics/answer/9019185)

---

## 🔗 Related Documentation

- [README-SEO.md](README-SEO.md) - Main SEO documentation index
- [GOOGLE_SEARCH_CONSOLE_ACTIONS.md](GOOGLE_SEARCH_CONSOLE_ACTIONS.md) - GSC setup guide
- [src/frontend/js/seo/cookie-consent.js](../../src/frontend/js/seo/cookie-consent.js) - Cookie consent config

---

**Last Updated**: 2025-11-21
**Status**: 📋 **READY FOR IMPLEMENTATION**
**Estimated Time**: 2-3 hours (tracking code + events + testing)
**Next Step**: Implement GA4 tracking code on all pages, configure events, and test

