# Google Search Console Implementation Checklist

**Date Started**: _______________
**Target Completion**: Today (20 minutes)
**Status**: 🟥 NOT STARTED

---

## Phase 1: Domain Verification (5 minutes)

### Method A: Domain Name Verification (RECOMMENDED)

- [ ] Go to https://search.google.com/search-console
- [ ] Click **"Start now"** or **"Add property"**
- [ ] Click **"Domain"** option (left)
- [ ] Enter domain: `bubbleinvest.org`
- [ ] Click **"Continue"**
- [ ] Copy DNS TXT record provided by Google
- [ ] Go to domain registrar (OVH / Namecheap / GoDaddy / etc.)
- [ ] Add TXT record to DNS settings
- [ ] ⏳ Wait for DNS propagation (can take 5 minutes to 24 hours)
- [ ] Return to GSC
- [ ] Click **"Verify"**
- [ ] ✅ **Verification Status**: VERIFIED

**DNS TXT Record Details**:
- **Host**: `@` or `bubbleinvest.org`
- **Type**: TXT
- **Value**: `google-site-verification=xxxxxxxxxxxxxxxx`

---

### Method B: HTML Meta Tag (ALTERNATIVE - FASTER)

Only use if Method A doesn't work or you need faster verification.

- [ ] In GSC, select **"HTML tag"** method
- [ ] Copy meta tag provided
- [ ] Open `src/frontend/pages/index.html` (French homepage)
- [ ] Find `</head>` closing tag
- [ ] Add this before it:
  ```html
  <meta name="google-site-verification" content="xxxxxxxxxxxxxxxxxxxxxxxxxx" />
  ```
- [ ] Save file
- [ ] Deploy website to production
- [ ] Return to GSC
- [ ] Click **"Verify"**
- [ ] ✅ **Verification Status**: VERIFIED

**Note**: This only verifies the homepage. Domain verification is better.

---

## Phase 2: Submit Sitemap (2 minutes)

### Step 1: Navigate to Sitemaps
- [ ] In GSC, go to **Sitemaps** (left sidebar menu)
- [ ] You should see section: "A new sitemap"

### Step 2: Submit Your Sitemap
- [ ] Click **"Add a new sitemap"**
- [ ] In the text field, enter: `sitemap.xml`
- [ ] Click **"Submit"**
- [ ] ✅ Page should show success message

### Step 3: Verify Sitemap Submission
- [ ] In Sitemaps list, look for: `https://bubbleinvest.org/sitemap.xml`
- [ ] Status should show: ✅ Success
- [ ] Should display:
  - **Date submitted**: Today's date
  - **Last read**: Recent timestamp
  - **URLs in sitemap**: Should show ~28 URLs

### Troubleshooting:
If you see **red error icon**:
- [ ] Click on the error
- [ ] Read error message
- [ ] Visit `https://bubbleinvest.org/sitemap.xml` in browser
- [ ] Verify you see XML with proper `<urlset>` tags
- [ ] Check that all URLs start with `https://`
- [ ] Wait 30 seconds and try resubmitting

---

## Phase 3: Request Priority Indexing (10 minutes)

### Overview
Google discovered your pages from the sitemap, but hasn't indexed them yet. "Request indexing" asks Google to prioritize crawling these pages.

### Key Pages to Request (16 Total)

**Critical Pages** (Your conversion pages - DO THESE FIRST):

1. **French Homepage**
   - [ ] URL: `https://bubbleinvest.org/`
   - [ ] Status: Requested ___________

2. **English Homepage**
   - [ ] URL: `https://bubbleinvest.org/en/`
   - [ ] Status: Requested ___________

3. **French Investor Hub** (HIGH PRIORITY)
   - [ ] URL: `https://bubbleinvest.org/investors`
   - [ ] Status: Requested ___________

4. **English Investor Hub** (HIGH PRIORITY)
   - [ ] URL: `https://bubbleinvest.org/en/investors`
   - [ ] Status: Requested ___________

5. **French Investor Pricing** (HIGH PRIORITY)
   - [ ] URL: `https://bubbleinvest.org/investors/pricing`
   - [ ] Status: Requested ___________

6. **English Investor Pricing** (HIGH PRIORITY)
   - [ ] URL: `https://bubbleinvest.org/en/investors/pricing`
   - [ ] Status: Requested ___________

7. **French Professionals Hub** (HIGH PRIORITY)
   - [ ] URL: `https://bubbleinvest.org/professionals`
   - [ ] Status: Requested ___________

8. **English Professionals Hub** (HIGH PRIORITY)
   - [ ] URL: `https://bubbleinvest.org/en/professionals`
   - [ ] Status: Requested ___________

9. **French Pricing Page** (HIGH PRIORITY)
   - [ ] URL: `https://bubbleinvest.org/pricing`
   - [ ] Status: Requested ___________

10. **English Pricing Page** (HIGH PRIORITY)
    - [ ] URL: `https://bubbleinvest.org/en/pricing`
    - [ ] Status: Requested ___________

11. **French Simulator** (Engagement)
    - [ ] URL: `https://bubbleinvest.org/portfolio-simulator`
    - [ ] Status: Requested ___________

12. **English Simulator** (Engagement)
    - [ ] URL: `https://bubbleinvest.org/en/portfolio-simulator`
    - [ ] Status: Requested ___________

13. **French Blog Listing** (Content Hub)
    - [ ] URL: `https://bubbleinvest.org/blog`
    - [ ] Status: Requested ___________

14. **English Blog Listing** (Content Hub)
    - [ ] URL: `https://bubbleinvest.org/en/blog`
    - [ ] Status: Requested ___________

15. **French Businesses Page** (B2B)
    - [ ] URL: `https://bubbleinvest.org/businesses`
    - [ ] Status: Requested ___________

16. **English Professionals Solutions** (B2B)
    - [ ] URL: `https://bubbleinvest.org/en/professionals/solutions-companies`
    - [ ] Status: Requested ___________

### How to Request Indexing for Each Page:

1. In GSC, find the **URL Inspection** search box (top of page)
2. Paste URL: `https://bubbleinvest.org/investors` (example)
3. Press Enter
4. Wait for inspection to complete (~10 seconds)
5. You'll see inspection results
6. Click blue **"Request indexing"** button
7. ✅ Should show: "Requested indexing for this URL"
8. Move to next URL

### Batch Tracking:
- **Batch 1** (4 pages): Investors hub & pricing
  - Time: ~5 minutes
  - Status: ⏳ In progress

- **Batch 2** (4 pages): Professionals hub & pricing
  - Time: ~5 minutes
  - Status: ⏳ Pending

- **Batch 3** (8 pages): Simulators, blog, businesses
  - Time: ~10 minutes
  - Status: ⏳ Pending

### Completion Status:
- [ ] **Batch 1 Complete**: 4/4 pages requested
- [ ] **Batch 2 Complete**: 4/4 pages requested
- [ ] **Batch 3 Complete**: 8/8 pages requested
- [ ] **✅ ALL 16 PAGES REQUESTED**

---

## Phase 4: Monitor Coverage Report (Days 1-7)

### Daily Check (5 minutes/day):

**Day 1** (Today):
- [ ] Go to **Coverage** report
- [ ] Expected: 0 pages indexed (URLs just submitted)
- [ ] Status notes: _____________________

**Day 2-3**:
- [ ] Check **Coverage** report again
- [ ] Expected: 5-10 pages indexed
- [ ] Status: Pages should show "Valid"
- [ ] Status notes: _____________________

**Day 4-5**:
- [ ] Check **Coverage** report
- [ ] Expected: 15-20 pages indexed
- [ ] All "Valid" status
- [ ] Status notes: _____________________

**Day 6-7**:
- [ ] Check **Coverage** report
- [ ] Expected: 25-28 pages indexed
- [ ] All showing "Valid" status
- [ ] ✅ Goal: 28/28 pages indexed

### Coverage Report Navigation:
1. In GSC, click **"Coverage"** (left menu)
2. You'll see a chart with:
   - 🟢 **Valid** - Successfully indexed
   - 🟡 **Valid with warnings** - Indexed but minor issues
   - 🔴 **Error** - Needs fixing
   - ⚪ **Excluded** - Blocked or marked noindex

### What to Look For:

**Good Signs** ✅:
- 🟢 Most pages showing "Valid"
- Steady increase in indexed pages each day
- No new errors appearing

**Concerning Signs** ⚠️:
- 🔴 Red error pages - Click to see issue
- Pages stuck at "Discovered - not indexed"
- Error messages about robots.txt or crawl budget

### If You See Errors:

**Error: "Crawl anomaly"**
- [ ] Likely temporary - Check again tomorrow

**Error: "Robots.txt blocked"**
- [ ] Check `/src/backend/robots.txt`
- [ ] Verify `/` is NOT blocked

**Error: "Redirect error"**
- [ ] Check redirects in server config
- [ ] Ensure no redirect chains

**Error: "Not found (404)"**
- [ ] Page URL may be wrong in sitemap
- [ ] Visit URL in browser to verify it exists

---

## Phase 5: Monitoring Dashboard Setup (Ongoing)

### Create Bookmarks for Quick Access:

- [ ] **GSC Homepage**: https://search.google.com/search-console/
  - Bookmark as: "GSC Dashboard"

- [ ] **Coverage Report**: https://search.google.com/search-console/coverage
  - Bookmark as: "GSC Coverage"

- [ ] **URL Inspection**: https://search.google.com/search-console/url-inspection
  - Bookmark as: "GSC URL Inspector"

- [ ] **Sitemaps**: https://search.google.com/search-console/sitemaps
  - Bookmark as: "GSC Sitemaps"

### Weekly Monitoring Routine (Every Tuesday):
- [ ] Check **Coverage** report
- [ ] Note % of pages indexed
- [ ] Look for any new errors
- [ ] Click top 3 error pages
- [ ] Document findings: _______________

### Monthly Deep Dive (First Monday of Month):
- [ ] Review Coverage history
- [ ] Check Performance report for rankings
- [ ] Identify top-performing pages
- [ ] List pages needing optimization
- [ ] Document insights: _______________

---

## Phase 6: Validation Checklist (Before Complete)

### Verification Status:
- [ ] Domain verified in GSC
- [ ] Verification method used: **Domain DNS** / **HTML Tag** (circle one)
- [ ] Green checkmark showing "Ownership verified"

### Sitemap Status:
- [ ] Sitemap submitted: `https://bubbleinvest.org/sitemap.xml`
- [ ] Status shows: ✅ Success
- [ ] Last submitted date: _______________
- [ ] URLs in sitemap showing: ~28

### Indexing Requests:
- [ ] 16 high-priority pages requested
- [ ] All requests completed
- [ ] No errors during requests

### Coverage Report:
- [ ] Coverage report accessible
- [ ] Shows pages indexed over time
- [ ] Baseline documented for Day 1

### Documentation:
- [ ] GSC links bookmarked
- [ ] Monitoring schedule created
- [ ] Contacts notified of setup

---

## Timeline Summary

| Step | Task | Time | Status |
|------|------|------|--------|
| 1 | Domain verification | 5 min | ⏳ |
| 2 | Submit sitemap | 2 min | ⏳ |
| 3 | Request priority indexing | 10 min | ⏳ |
| 4 | Monitor (Days 1-7) | 5 min/day | ⏳ |
| 5 | Setup monitoring | 10 min | ⏳ |
| **TOTAL** | | **20 min** | |

---

## Success Indicators ✅

**After completing this checklist, you should have**:

✅ Domain verified in Google Search Console
✅ Sitemap submitted and accepted (28 URLs)
✅ 16 high-priority pages requested for indexing
✅ Monitoring process established
✅ Coverage report tracked from Day 1

**Expected Results After 7 Days**:
✅ 20-25 of 28 pages indexed
✅ All indexed pages showing "Valid" status
✅ Baseline established for future growth

---

## Troubleshooting Quick Guide

| Problem | Solution |
|---------|----------|
| "Domain not verified" | Try HTML tag method, or wait 24h for DNS |
| "Sitemap error" | Verify `sitemap.xml` is accessible at URL |
| "Pages not indexing" | Request individual indexing, check robots.txt |
| "Crawl errors" | Check page URL is correct, page is live |
| "Coverage stuck" | Normal - GSC crawls gradually over days |

---

## Notes & Documentation

**Domain Registrar**: _______________
**Verification Method Used**: _______________
**Sitemap Submitted**: ✅ Date: _______________
**Indexing Requests Completed**: ✅ Date: _______________

**Observations**:
- Day 1: ___________________
- Day 2-3: ___________________
- Day 4-5: ___________________
- Day 6-7: ___________________

---

**Status**: Ready to implement
**Time Investment**: 20 minutes (one-time setup)
**Expected Impact**: 20-28 pages indexed within 7 days
**Next Steps**: Monitor daily, then proceed with GA4 analytics

