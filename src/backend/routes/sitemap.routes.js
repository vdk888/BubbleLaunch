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
    // Static pages with priority and changefreq
    const staticPages = [
      {
        url: '/',
        priority: '1.0',
        changefreq: 'weekly',
        lastmod: new Date().toISOString().split('T')[0]
      },
      {
        url: '/home',
        priority: '1.0',
        changefreq: 'weekly',
        lastmod: new Date().toISOString().split('T')[0]
      },
      {
        url: '/portfolio-simulator',
        priority: '0.9',
        changefreq: 'monthly',
        lastmod: new Date().toISOString().split('T')[0]
      },
      {
        url: '/blog',
        priority: '0.8',
        changefreq: 'weekly',
        lastmod: new Date().toISOString().split('T')[0]
      },
    ];

    // Fetch published blog posts
    let blogPages = [];
    try {
      const posts = await blogService.getAllPublishedPosts();
      blogPages = posts.map(post => ({
        url: `/blog/${post.slug}`,
        priority: '0.7',
        changefreq: 'monthly',
        lastmod: post.publicationDate || new Date().toISOString().split('T')[0]
      }));
    } catch (error) {
      console.warn('Could not fetch blog posts for sitemap:', error.message);
      // Continue without blog posts if service fails
    }

    // Combine all pages
    const allPages = [...staticPages, ...blogPages];

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${allPages.map(page => `  <url>
    <loc>https://bubbleinvest.org${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <xhtml:link rel="alternate" hreflang="fr" href="https://bubbleinvest.org${page.url}" />
    <xhtml:link rel="alternate" hreflang="en" href="https://bubbleinvest.org${page.url}?lang=en" />
    <xhtml:link rel="alternate" hreflang="x-default" href="https://bubbleinvest.org${page.url}" />
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
