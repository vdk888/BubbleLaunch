# Google Search Console - Quick Start Guide

**Priority**: 🔴 **CRITICAL** - DO THIS FIRST
**Time Required**: 20 minutes
**Impact**: Get your 28 pages indexed 1-2 weeks faster

---

## Why This Matters

Your sitemap is **already created and working** at `https://bubbleinvest.org/sitemap.xml`. Now Google needs to know about it.

**Without this step**: Google will slowly discover your pages (2-4 weeks)
**With this step**: Google crawls and indexes your pages (2-4 days)

---

## What You'll Do (3 Steps)

1. **Verify Domain** (5 minutes)
2. **Submit Sitemap** (2 minutes)
3. **Request Priority Indexing** (10 minutes)

---

## Step 1: Verify Domain Ownership (5 minutes)

### Option A: Domain Name Verification (RECOMMENDED)

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click **"Start now"** or **"Add property"**
3. Select **"Domain"** (left option)
4. Enter: `bubbleinvest.org`
5. Click **"Continue"**
6. Google shows you DNS TXT record to add
7. Go to your domain registrar (likely OVH, Namecheap, GoDaddy, etc.)
8. Add the TXT record to your DNS settings
9. Return to GSC, click **"Verify"**
10. ✅ Should show "Verification successful"

**Note**: DNS verification applies to all subdomains (www, api, etc.)

### Option B: HTML Tag Method (FASTER IF NO DNS ACCESS)

1. Go to GSC → Add property
2. Copy the meta tag provided
3. Add to `src/frontend/pages/index.html` (homepage) before `</head>`:
   ```html
   <meta name="google-site-verification" content="xxxxxxxxxxxxxxxxxx" />
   ```
4. Deploy your website
5. Return to GSC, click **"Verify"**
6. ✅ GSC confirms verification

---

## Step 2: Submit Sitemap (2 minutes)

1. In GSC, go to **Sitemaps** (left menu)
2. Click **"Add a new sitemap"**
3. Enter: `sitemap.xml`
4. Click **"Submit"**
5. ✅ Should show "Success"

GSC will now crawl your sitemap and start processing your 28 pages.

---

## Step 3: Request Priority Indexing (10 minutes)

To speed up indexing of your key pages, request priority processing:

### URL Inspection Method:

1. In GSC, go to **"URL Inspection"** (top search box)
2. Enter first URL: `https://bubbleinvest.org`
3. Click **"Request indexing"** (blue button)
4. Repeat for these HIGH-PRIORITY pages:

**French Pages**:
- [ ] `https://bubbleinvest.org/` - Homepage
- [ ] `https://bubbleinvest.org/investors` - Investor hub (KEY)
- [ ] `https://bubbleinvest.org/investors/pricing` - Investor pricing (KEY)
- [ ] `https://bubbleinvest.org/professionals` - Professional hub (KEY)
- [ ] `https://bubbleinvest.org/pricing` - Pricing page (KEY)
- [ ] `https://bubbleinvest.org/portfolio-simulator` - Simulator (KEY)
- [ ] `https://bubbleinvest.org/blog` - Blog listing
- [ ] `https://bubbleinvest.org/businesses` - Businesses

**English Pages**:
- [ ] `https://bubbleinvest.org/en/` - Homepage EN
- [ ] `https://bubbleinvest.org/en/investors` - Investor hub EN (KEY)
- [ ] `https://bubbleinvest.org/en/investors/pricing` - Investor pricing EN (KEY)
- [ ] `https://bubbleinvest.org/en/professionals` - Professional hub EN (KEY)
- [ ] `https://bubbleinvest.org/en/pricing` - Pricing EN (KEY)
- [ ] `https://bubbleinvest.org/en/portfolio-simulator` - Simulator EN (KEY)

**Time**: ~1 minute per URL × 16 URLs = ~15 minutes for all

---

## Step 4: Monitor Indexing Progress (Ongoing)

### Daily (First Week):
1. In GSC, go to **"Coverage"**
2. Watch for changes:
   - 🟢 **Valid** = Page successfully indexed
   - 🟡 **Valid with warnings** = Indexed but minor issues
   - 🔴 **Error** = Fix immediately

### Expected Timeline:
- **Day 1**: Sitemap submitted (0% indexed)
- **Days 2-3**: URL inspections processed (25-50% indexed)
- **Days 4-7**: Remaining pages crawled (75-100% indexed)

### Weekly (After Week 1):
1. Check **"Performance"** report
2. Note which pages are getting impressions
3. Identify any indexing issues

---

## What to Expect in GSC

### Homepage Checklist:
- [ ] Sitemap submitted
- [ ] All 28 pages in Coverage report
- [ ] Most pages showing "Valid" status
- [ ] Mobile usability issues resolved
- [ ] Core Web Vitals monitoring active

### After 1 Week You Should See:
✅ 20+ pages indexed in Google
✅ Sitemap crawl statistics showing 28 URLs
✅ Coverage report showing successful indexing
✅ Search appearance data for top pages
✅ Mobile-friendliness verification

---

## Troubleshooting

### Problem: "Verification Failed"
**Solution**:
- [ ] Check DNS record is correct (if using domain verification)
- [ ] Wait 24-48 hours for DNS propagation
- [ ] Or use HTML tag method instead (faster)

### Problem: Sitemap Not Accepted
**Solution**:
- [ ] Visit `https://bubbleinvest.org/sitemap.xml` manually
- [ ] Should see XML with `<urlset>` tags
- [ ] Check for any XML syntax errors
- [ ] Verify URL format in sitemap is correct (starts with `https://`)

### Problem: Pages Not Indexing
**Solution**:
- [ ] Check robots.txt allows crawling: `/robots.txt`
- [ ] Verify no `noindex` meta tags on pages
- [ ] Check robots.txt doesn't block `/api/*` excessively
- [ ] Manually request indexing for each page (URL Inspection)

### Problem: "Discovered - not indexed"
**Solution**:
- [ ] This is normal - Google discovered but hasn't indexed yet
- [ ] Click "Request indexing" for high-priority pages
- [ ] Check back in 7 days
- [ ] Look for quality issues in Coverage report

---

## After Sitemap is Indexed

Once your pages are indexed (3-7 days), you can:

1. **Check Search Performance**
   - Go to **"Performance"** report
   - See which keywords your pages rank for
   - Monitor impressions and clicks

2. **Find Indexing Issues**
   - Go to **"Coverage"** report
   - Filter by "Excluded" to find any blocked pages
   - Fix blocking issues (robots.txt, noindex, redirects)

3. **Optimize Core Web Vitals**
   - Go to **"Core Web Vitals"** report
   - See which pages need speed optimization
   - Fix mobile experience issues

4. **Monitor Mobile Usability**
   - Go to **"Mobile Usability"** report
   - Fix any reported issues

---

## Quick Reference

### Key GSC Links:
- **Main Dashboard**: https://search.google.com/search-console
- **Coverage Report**: Monitor indexing status
- **URL Inspection**: Request individual page indexing
- **Performance Report**: See search rankings & CTR
- **Sitemaps**: Submit and monitor sitemap status

### Your Sitemap:
- **Location**: `https://bubbleinvest.org/sitemap.xml`
- **Pages Included**: 28 (14 French + 14 English)
- **Dynamic**: Blog posts automatically added
- **Updated**: Daily (lastmod = today)

### Priority Pages to Monitor:
1. `/` and `/en/` - Homepages
2. `/investors` and `/en/investors` - High conversion
3. `/pricing` and `/en/pricing` - High intent
4. `/professionals` and `/en/professionals` - B2B lead gen
5. `/portfolio-simulator` - High engagement

---

## Timeline

| Task | Time | When |
|------|------|------|
| Verify domain | 5 min | **TODAY** |
| Submit sitemap | 2 min | **TODAY** |
| Request priority indexing | 10 min | **TODAY** |
| Monitor coverage (7 days) | 5 min/day | Days 1-7 |
| Check indexing completion | 5 min | Day 7 |
| **Total** | **~30 min** | |

---

## Success Criteria ✅

**After completing this guide, you'll have**:

✅ Domain verified in Google Search Console
✅ Sitemap submitted and accepted
✅ 16 high-priority pages requested for indexing
✅ GSC Coverage report showing indexing progress
✅ Monitoring process established

**Expected Result**: 20-25 of your 28 pages indexed within 7 days

---

## Next Steps

After sitemap indexing completes:

1. **Week 1**: [Implement GA4 Analytics](SEO_IMPLEMENTATION_PRIORITY.md#priority-1-google-analytics-4-implementation) to measure traffic
2. **Week 2**: Write first blog article to capture SEO keywords
3. **Week 3**: Optimize top pages based on Google Search Console data

---

**Status**: Ready to implement
**Time Investment**: 20 minutes
**Expected Impact**: 1-2 week faster indexing of 28 pages
**ROI**: High - Accelerates all other SEO efforts

