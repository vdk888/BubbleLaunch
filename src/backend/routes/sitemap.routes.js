const express = require('express');
const router = express.Router();
const blogService = require('../services/blogService');

/**
 * Generate XML Sitemap
 * Route: GET /sitemap.xml
 *
 * Dynamically generates sitemap including:
 * - Static pages (homepage, portfolio simulator, blog)
 * - All published blog posts from Notion
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const buildLocalizedEntries = ({ fr, en, priority, changefreq, lastmod }) => {
      const entries = [];
      const frUrl = fr ? `https://bubbleinvest.org${fr}` : null;
      const enUrl = en ? `https://bubbleinvest.org${en}` : null;
      const defaultHref = frUrl || enUrl;

      const alternates = [];
      if (frUrl) alternates.push({ hreflang: 'fr', href: frUrl });
      if (enUrl) alternates.push({ hreflang: 'en', href: enUrl });
      if (defaultHref) alternates.push({ hreflang: 'x-default', href: defaultHref });

      if (frUrl) {
        entries.push({
          loc: frUrl,
          changefreq,
          priority,
          lastmod,
          alternates
        });
      }

      if (enUrl) {
        entries.push({
          loc: enUrl,
          changefreq,
          priority,
          lastmod,
          alternates
        });
      }

      return entries;
    };

    // Static pages with priority and changefreq
    const staticPages = [
      {
        fr: '/',
        en: '/en/',
        priority: '1.0',
        changefreq: 'weekly',
        lastmod: today
      },
      {
        fr: '/portfolio-simulator',
        en: '/en/portfolio-simulator',
        priority: '0.9',
        changefreq: 'monthly',
        lastmod: today
      },
      {
        fr: '/blog',
        en: '/en/blog',
        priority: '0.8',
        changefreq: 'weekly',
        lastmod: today
      },
      {
        fr: '/pricing',
        en: '/en/pricing',
        priority: '0.8',
        changefreq: 'monthly',
        lastmod: today
      },
      {
        fr: '/investors',
        en: '/en/investors',
        priority: '0.7',
        changefreq: 'monthly',
        lastmod: today
      },
      {
        fr: '/investors/solution',
        en: '/en/investors/solution',
        priority: '0.7',
        changefreq: 'monthly',
        lastmod: today
      },
      {
        fr: '/investors/pricing',
        en: '/en/investors/pricing',
        priority: '0.8',
        changefreq: 'monthly',
        lastmod: today
      },
      {
        fr: '/professionals',
        en: '/en/professionals',
        priority: '0.7',
        changefreq: 'monthly',
        lastmod: today
      },
      {
        fr: '/professionals/solutions-companies',
        en: '/en/professionals/solutions-companies',
        priority: '0.7',
        changefreq: 'monthly',
        lastmod: today
      },
      {
        fr: '/professionals/solutions-wealth-managers',
        en: '/en/professionals/solutions-wealth-managers',
        priority: '0.7',
        changefreq: 'monthly',
        lastmod: today
      },
      {
        fr: '/professionals/demo',
        en: '/en/professionals/demo',
        priority: '0.6',
        changefreq: 'yearly',
        lastmod: today
      },
      {
        fr: '/privacy',
        en: '/en/privacy',
        priority: '0.4',
        changefreq: 'yearly',
        lastmod: today
      },
      {
        fr: '/mentions-legales',
        en: '/en/legal-notice',
        priority: '0.4',
        changefreq: 'yearly',
        lastmod: today
      },
    ];

    const staticEntries = staticPages.flatMap(buildLocalizedEntries);

    // Fetch published blog posts
    let blogPages = [];
    try {
      const posts = await blogService.getPublishedPosts();
      blogPages = posts.flatMap(post => {
        const lastmod = post.publishedDate
          ? new Date(post.publishedDate).toISOString().split('T')[0]
          : today;
        return buildLocalizedEntries({
          fr: `/blog/${post.slug}`,
          en: `/en/blog/${post.slug}`,
          priority: '0.7',
          changefreq: 'monthly',
          lastmod
        });
      });
    } catch (error) {
      console.warn('Could not fetch blog posts for sitemap:', error.message);
      // Continue without blog posts if service fails
    }

    // Combine all pages
    const allPages = [...staticEntries, ...blogPages];

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${allPages.map(page => `  <url>
    <loc>${page.loc}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
${page.alternates.map(alt => `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}" />`).join('\n')}
  </url>`).join('\n')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

module.exports = router;
