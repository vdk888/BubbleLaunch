const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;
const { getPublishedPosts } = require("../services/blogService");

const frPagesDir = path.join(__dirname, "../../frontend/pages");
const enPagesDir = path.join(__dirname, "../../frontend/pages/en");

async function renderBlogPage(res, templatePath, lang = "fr") {
  const heading =
    lang === "en" ? "Recent articles" : "Articles récents";

  try {
    const posts = await getPublishedPosts();
    let html = await fs.readFile(templatePath, "utf-8");

    const seoContent = `
      <!-- SEO: Server-rendered blog post links for search engines -->
      <noscript>
        <div class="seo-blog-posts" style="max-width: 1200px; margin: 0 auto; padding: 40px 20px;">
          <h2>${heading}</h2>
          ${posts
            .map((post) => {
              const title =
                lang === "en"
                  ? post.title?.en || post.title?.fr || post.title
                  : post.title?.fr || post.title;
              const summary =
                lang === "en"
                  ? post.summary?.en || post.summary?.fr || ""
                  : post.summary?.fr || post.summary || "";
              return `
                <article style="margin-bottom: 30px; padding-bottom: 30px; border-bottom: 1px solid #eee;">
                  <h3 style="margin-bottom: 10px;">
                    <a href="${lang === "en" ? `/en/blog/${post.slug}` : `/blog/${post.slug}`}" style="color: #000; text-decoration: none;">
                      ${title}
                    </a>
                  </h3>
                  <p style="color: #666; margin-bottom: 10px;">
                    ${summary}
                  </p>
                  <time style="color: #999; font-size: 0.9em;">${post.publishedDate}</time>
                </article>
              `;
            })
            .join("")}
        </div>
      </noscript>
      <!-- End SEO content -->
    `;

    html = html.replace("</body>", `${seoContent}</body>`);

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.send(html);
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    res.status(500).send("Error loading blog");
  }
}

/**
 * Serve index.html for the root
 */
router.get("/", (req, res) => {
  console.log("Root route hit, serving index.html");
  const filePath = path.join(frPagesDir, "index.html");
  console.log("File path:", filePath);
  res.sendFile(filePath);
});

/**
 * Serve index.html for /home (alternative homepage URL for SEO)
 */
router.get("/home", (req, res) => {
  console.log("Home route hit, serving index.html");
  const filePath = path.join(frPagesDir, "index.html");
  res.sendFile(filePath);
});

/**
 * Blog index page with server-side rendering for SEO
 */
router.get("/blog", async (req, res) => {
  const blogIndexPath = path.join(frPagesDir, "blog.html");
  await renderBlogPage(res, blogIndexPath, "fr");
});

/**
 * Individual blog post page - Server-side rendering for SEO
 */
router.get("/blog/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const { getPostBySlug } = require("../services/blogService");
    const post = await getPostBySlug(slug);

    if (!post) {
      return res.status(404).sendFile(path.join(frPagesDir, "404.html"));
    }

    const blogPostPath = path.join(frPagesDir, "blog-post.html");
    let html = await fs.readFile(blogPostPath, "utf-8");

    const title = post.title?.fr || post.title;
    const summary = post.summary?.fr || post.summary || "Découvrez cet article sur l'investissement intelligent.";
    const imageUrl = post.featuredImage || "https://bubbleinvest.org/assets/images/bubble-logo-single.svg";
    const publishedDate = post.publishedDate ? new Date(post.publishedDate).toISOString() : "";
    const content = post.content?.fr || post.content || "";

    // Replace dynamic meta tags with actual content for SEO
    html = html.replace(
      'id="post-title">Article - Blog Bubble<',
      `id="post-title">${title} | Blog Bubble<`
    );
    html = html.replace(
      'id="post-description" content="Découvrez cet article',
      `id="post-description" content="${summary}`
    );
    html = html.replace(
      'id="og-title" content="Article - Blog Bubble"',
      `id="og-title" content="${title} | Blog Bubble"`
    );
    html = html.replace(
      'id="og-description" content="Découvrez cet article',
      `id="og-description" content="${summary}`
    );
    html = html.replace(
      'id="og-image" content="https://bubbleinvest.org/assets/images/bubble-logo-single.svg"',
      `id="og-image" content="${imageUrl}"`
    );
    html = html.replace(
      'id="og-url" content="https://bubbleinvest.org/blog/"',
      `id="og-url" content="https://bubbleinvest.org/blog/${slug}"`
    );
    html = html.replace(
      'id="canonical-url" href="https://bubbleinvest.org/blog/"',
      `id="canonical-url" href="https://bubbleinvest.org/blog/${slug}"`
    );
    html = html.replace(
      'id="hreflang-fr" hreflang="fr" href="https://bubbleinvest.org/blog/"',
      `id="hreflang-fr" hreflang="fr" href="https://bubbleinvest.org/blog/${slug}"`
    );
    html = html.replace(
      'id="hreflang-en" hreflang="en" href="https://bubbleinvest.org/en/blog/"',
      `id="hreflang-en" hreflang="en" href="https://bubbleinvest.org/en/blog/${slug}"`
    );
    html = html.replace(
      'id="hreflang-default" hreflang="x-default" href="https://bubbleinvest.org/blog/"',
      `id="hreflang-default" hreflang="x-default" href="https://bubbleinvest.org/blog/${slug}"`
    );

    if (publishedDate) {
      html = html.replace(
        'id="article-published-time" content=""',
        `id="article-published-time" content="${publishedDate}"`
      );
    }

    // Add SEO content in noscript for search engines
    const seoContent = `
      <!-- SEO: Server-rendered blog post content for search engines -->
      <noscript>
        <article style="max-width: 800px; margin: 0 auto; padding: 60px 20px;">
          <h1>${title}</h1>
          <p style="color: #666; margin: 20px 0;">${summary}</p>
          <div style="margin: 20px 0; color: #999;">${post.publishedDate}</div>
          ${imageUrl && imageUrl !== "https://bubbleinvest.org/assets/images/bubble-logo-single.svg" ? `<img src="${imageUrl}" alt="${title}" style="max-width: 100%; height: auto; margin: 20px 0;">` : ""}
          <div style="color: #333; line-height: 1.6; margin-top: 30px;">${content}</div>
        </article>
      </noscript>
      <!-- End SEO content -->
    `;

    html = html.replace("</body>", `${seoContent}</body>`);
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.send(html);
  } catch (error) {
    console.error("Error serving blog post page:", error);
    res.status(500).send("Error loading blog post");
  }
});

/**
 * Clear cache management page (dev only)
 */
if (process.env.NODE_ENV !== "production") {
  router.get("/clear-cache", (req, res) => {
    res.sendFile(
      path.join(frPagesDir, "clear-cache.html")
    );
  });
}

/**
 * Portfolio simulator page - Redirect to playground simulator
 * Legacy route maintained for backwards compatibility and SEO
 */
router.get("/portfolio-simulator", (req, res) => {
  res.redirect(301, "/investors/playground/simulator");
});

router.get(["/pricing", "/pricing.html"], (req, res) => {
  res.sendFile(path.join(frPagesDir, "pricing.html"));
});

/**
 * Privacy Policy page (SEO + GDPR compliance)
 */
router.get("/privacy", (req, res) => {
  res.sendFile(
    path.join(frPagesDir, "privacy.html")
  );
});

/**
 * Mentions Légales page (French legal notice - required by law)
 */
router.get("/mentions-legales", (req, res) => {
  res.sendFile(
    path.join(frPagesDir, "mentions-legales.html")
  );
});


/**
 * English homepage
 */
router.get(["/en", "/en/"], (req, res) => {
  const filePath = path.join(enPagesDir, "index.html");
  res.sendFile(filePath);
});

/**
 * English blog listing with SSR
 */
router.get("/en/blog", async (req, res) => {
  const blogIndexPath = path.join(enPagesDir, "blog.html");
  await renderBlogPage(res, blogIndexPath, "en");
});

/**
 * English individual blog post - Server-side rendering for SEO
 */
router.get("/en/blog/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const { getPostBySlug } = require("../services/blogService");
    const post = await getPostBySlug(slug);

    if (!post) {
      return res.status(404).sendFile(path.join(enPagesDir, "404.html"));
    }

    const blogPostPath = path.join(enPagesDir, "blog-post.html");
    let html = await fs.readFile(blogPostPath, "utf-8");

    const title = post.title?.en || post.title?.fr || post.title;
    const summary = post.summary?.en || post.summary?.fr || post.summary || "Discover this article on intelligent investing.";
    const imageUrl = post.featuredImage || "https://bubbleinvest.org/assets/images/bubble-logo-single.svg";
    const publishedDate = post.publishedDate ? new Date(post.publishedDate).toISOString() : "";
    const content = post.content?.en || post.content?.fr || post.content || "";

    // Replace dynamic meta tags with actual content for SEO
    html = html.replace(
      'id="post-title">Article - Blog Bubble<',
      `id="post-title">${title} | Blog Bubble<`
    );
    html = html.replace(
      'id="post-description" content="Discover this article',
      `id="post-description" content="${summary}`
    );
    html = html.replace(
      'id="og-title" content="Article - Blog Bubble"',
      `id="og-title" content="${title} | Blog Bubble"`
    );
    html = html.replace(
      'id="og-description" content="Discover this article',
      `id="og-description" content="${summary}`
    );
    html = html.replace(
      'id="og-image" content="https://bubbleinvest.org/assets/images/bubble-logo-single.svg"',
      `id="og-image" content="${imageUrl}"`
    );
    html = html.replace(
      'id="og-url" content="https://bubbleinvest.org/en/blog/"',
      `id="og-url" content="https://bubbleinvest.org/en/blog/${slug}"`
    );
    html = html.replace(
      'id="canonical-url" href="https://bubbleinvest.org/en/blog/"',
      `id="canonical-url" href="https://bubbleinvest.org/en/blog/${slug}"`
    );
    html = html.replace(
      'id="hreflang-fr" hreflang="fr" href="https://bubbleinvest.org/blog/"',
      `id="hreflang-fr" hreflang="fr" href="https://bubbleinvest.org/blog/${slug}"`
    );
    html = html.replace(
      'id="hreflang-en" hreflang="en" href="https://bubbleinvest.org/en/blog/"',
      `id="hreflang-en" hreflang="en" href="https://bubbleinvest.org/en/blog/${slug}"`
    );
    html = html.replace(
      'id="hreflang-default" hreflang="x-default" href="https://bubbleinvest.org/blog/"',
      `id="hreflang-default" hreflang="x-default" href="https://bubbleinvest.org/en/blog/${slug}"`
    );

    if (publishedDate) {
      html = html.replace(
        'id="article-published-time" content=""',
        `id="article-published-time" content="${publishedDate}"`
      );
    }

    // Add SEO content in noscript for search engines
    const seoContent = `
      <!-- SEO: Server-rendered blog post content for search engines -->
      <noscript>
        <article style="max-width: 800px; margin: 0 auto; padding: 60px 20px;">
          <h1>${title}</h1>
          <p style="color: #666; margin: 20px 0;">${summary}</p>
          <div style="margin: 20px 0; color: #999;">${post.publishedDate}</div>
          ${imageUrl && imageUrl !== "https://bubbleinvest.org/assets/images/bubble-logo-single.svg" ? `<img src="${imageUrl}" alt="${title}" style="max-width: 100%; height: auto; margin: 20px 0;">` : ""}
          <div style="color: #333; line-height: 1.6; margin-top: 30px;">${content}</div>
        </article>
      </noscript>
      <!-- End SEO content -->
    `;

    html = html.replace("</body>", `${seoContent}</body>`);
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.send(html);
  } catch (error) {
    console.error("Error serving EN blog post page:", error);
    res.status(500).send("Error loading blog post");
  }
});

/**
 * English Portfolio simulator page - Redirect to playground simulator
 */
router.get("/en/portfolio-simulator", (req, res) => {
  res.redirect(301, "/en/investors/playground/simulator");
});

router.get(["/en/pricing", "/en/pricing.html"], (req, res) => {
  res.sendFile(path.join(enPagesDir, "pricing.html"));
});

router.get("/en/privacy", (req, res) => {
  res.sendFile(path.join(enPagesDir, "privacy.html"));
});

router.get("/en/legal-notice", (req, res) => {
  res.sendFile(path.join(enPagesDir, "legal-notice.html"));
});


/**
 * ============================================
 * INVESTOR PAGES (French)
 * ============================================
 */
router.get("/investors", (req, res) => {
  res.sendFile(path.join(frPagesDir, "investors/index.html"));
});

router.get("/investors/solution", (req, res) => {
  res.sendFile(path.join(frPagesDir, "investors/solution.html"));
});

router.get("/investors/pricing", (req, res) => {
  res.sendFile(path.join(frPagesDir, "investors/pricing.html"));
});

/**
 * Investors Portfolio simulator - Redirect to playground simulator
 */
router.get("/investors/portfolio-simulator", (req, res) => {
  res.redirect(301, "/investors/playground/simulator");
});

/**
 * Bubble Playground Hub and Sub-pages (French)
 * Primary chatbot-first experience for investor education
 */
router.get("/investors/playground", (req, res) => {
  res.set("X-Robots-Tag", "noindex, nofollow");
  res.sendFile(path.join(frPagesDir, "investors/playground.html"));
});

router.get("/investors/playground/resources", (req, res) => {
  res.set("X-Robots-Tag", "noindex, nofollow");
  res.sendFile(path.join(frPagesDir, "investors/playground/resources.html"));
});

router.get("/investors/playground/arena", (req, res) => {
  res.set("X-Robots-Tag", "noindex, nofollow");
  res.sendFile(path.join(frPagesDir, "investors/education/arena.html"));
});

router.get("/investors/playground/simulator", (req, res) => {
  res.set("X-Robots-Tag", "noindex, nofollow");
  res.sendFile(path.join(frPagesDir, "investors/education/simulator.html"));
});

/**
 * Legacy Education Routes - Redirect to Playground (French)
 */
router.get("/investors/education", (req, res) => {
  res.redirect(301, "/investors/playground");
});

router.get("/investors/education/arena", (req, res) => {
  res.redirect(301, "/investors/playground/arena");
});

router.get("/investors/education/simulator", (req, res) => {
  res.redirect(301, "/investors/playground/simulator");
});


/**
 * ============================================
 * INVESTOR PAGES (English)
 * ============================================
 */
router.get("/en/investors", (req, res) => {
  res.sendFile(path.join(enPagesDir, "investors/index.html"));
});

router.get("/en/investors/solution", (req, res) => {
  res.sendFile(path.join(enPagesDir, "investors/solution.html"));
});

router.get("/en/investors/pricing", (req, res) => {
  res.sendFile(path.join(enPagesDir, "investors/pricing.html"));
});

/**
 * English Investors Portfolio simulator - Redirect to playground simulator
 */
router.get("/en/investors/portfolio-simulator", (req, res) => {
  res.redirect(301, "/en/investors/playground/simulator");
});

/**
 * Bubble Playground Hub and Sub-pages (English)
 * Primary chatbot-first experience for investor education
 */
router.get("/en/investors/playground", (req, res) => {
  res.set("X-Robots-Tag", "noindex, nofollow");
  res.sendFile(path.join(enPagesDir, "investors/playground.html"));
});

router.get("/en/investors/playground/resources", (req, res) => {
  res.set("X-Robots-Tag", "noindex, nofollow");
  res.sendFile(path.join(enPagesDir, "investors/playground/resources.html"));
});

router.get("/en/investors/playground/arena", (req, res) => {
  res.set("X-Robots-Tag", "noindex, nofollow");
  res.sendFile(path.join(enPagesDir, "investors/education/arena.html"));
});

router.get("/en/investors/playground/simulator", (req, res) => {
  res.set("X-Robots-Tag", "noindex, nofollow");
  res.sendFile(path.join(enPagesDir, "investors/education/simulator.html"));
});

/**
 * Legacy Education Routes - Redirect to Playground (English)
 */
router.get("/en/investors/education", (req, res) => {
  res.redirect(301, "/en/investors/playground");
});

router.get("/en/investors/education/arena", (req, res) => {
  res.redirect(301, "/en/investors/playground/arena");
});

router.get("/en/investors/education/simulator", (req, res) => {
  res.redirect(301, "/en/investors/playground/simulator");
});

/**
 * ============================================
 * PROFESSIONAL PAGES (French)
 * ============================================
 */
router.get("/professionals", (req, res) => {
  res.sendFile(path.join(frPagesDir, "professionals/index.html"));
});

router.get("/professionals/solutions-companies", (req, res) => {
  res.sendFile(path.join(frPagesDir, "professionals/solutions-companies.html"));
});

router.get("/professionals/solutions-wealth-managers", (req, res) => {
  res.sendFile(path.join(frPagesDir, "professionals/solutions-wealth-managers.html"));
});

router.get("/professionals/demo", (req, res) => {
  res.sendFile(path.join(frPagesDir, "professionals/demo.html"));
});

router.get("/professionals/portfolio-simulator", (req, res) => {
  res.sendFile(path.join(frPagesDir, "professionals/portfolio-simulator.html"));
});

/**
 * ============================================
 * PROFESSIONAL PAGES (English)
 * ============================================
 */
router.get("/en/professionals", (req, res) => {
  res.sendFile(path.join(enPagesDir, "professionals/index.html"));
});

router.get("/en/professionals/solutions-companies", (req, res) => {
  res.sendFile(path.join(enPagesDir, "professionals/solutions-companies.html"));
});

router.get("/en/professionals/solutions-wealth-managers", (req, res) => {
  res.sendFile(path.join(enPagesDir, "professionals/solutions-wealth-managers.html"));
});

router.get("/en/professionals/demo", (req, res) => {
  res.sendFile(path.join(enPagesDir, "professionals/demo.html"));
});

router.get("/en/professionals/portfolio-simulator", (req, res) => {
  res.sendFile(path.join(enPagesDir, "professionals/portfolio-simulator.html"));
});

module.exports = router;
