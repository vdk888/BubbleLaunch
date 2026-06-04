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

// ============================================
// FRENCH PAGES (2026)
// ============================================

router.get("/", (req, res) => {
  res.sendFile(path.join(frPagesDir, "index.html"));
});

router.get("/home", (req, res) => {
  res.sendFile(path.join(frPagesDir, "index.html"));
});

router.get("/particuliers", (req, res) => {
  res.sendFile(path.join(frPagesDir, "particuliers.html"));
});

router.get("/professionnels", (req, res) => {
  res.sendFile(path.join(frPagesDir, "professionnels.html"));
});

router.get("/newsletter", (req, res) => {
  res.sendFile(path.join(frPagesDir, "newsletter.html"));
});

router.get("/a-propos", (req, res) => {
  res.sendFile(path.join(frPagesDir, "a-propos.html"));
});

router.get("/blog", (req, res) => {
  res.sendFile(path.join(frPagesDir, "blog.html"));
});

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

router.get("/privacy", (req, res) => {
  res.sendFile(path.join(frPagesDir, "privacy.html"));
});

router.get("/mentions-legales", (req, res) => {
  res.sendFile(path.join(frPagesDir, "mentions-legales.html"));
});

router.get("/github", (req, res) => {
  res.sendFile(path.join(frPagesDir, "github.html"));
});

router.get("/labs", (req, res) => {
  res.sendFile(path.join(frPagesDir, "labs.html"));
});

// ============================================
// ENGLISH PAGES (2026)
// ============================================

router.get(["/en", "/en/"], (req, res) => {
  res.sendFile(path.join(enPagesDir, "index.html"));
});

router.get("/en/individuals", (req, res) => {
  res.sendFile(path.join(enPagesDir, "individuals.html"));
});

router.get("/en/professionals", (req, res) => {
  res.sendFile(path.join(enPagesDir, "professionals.html"));
});

router.get("/en/newsletter", (req, res) => {
  res.sendFile(path.join(enPagesDir, "newsletter.html"));
});

router.get("/en/about", (req, res) => {
  res.sendFile(path.join(enPagesDir, "about.html"));
});

router.get("/en/blog", (req, res) => {
  res.sendFile(path.join(enPagesDir, "blog.html"));
});

router.get("/en/shop", (req, res) => {
  res.sendFile(path.join(enPagesDir, "shop.html"));
});

router.get("/en/blog/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const { getPostBySlug } = require("../services/blogService");
    const post = await getPostBySlug(slug);

    if (!post) {
      return res.status(404).sendFile(path.join(frPagesDir, "404.html"));
    }

    const blogPostPath = path.join(enPagesDir, "blog-post.html");
    let html = await fs.readFile(blogPostPath, "utf-8");

    const title = post.title?.en || post.title?.fr || post.title;
    const summary = post.summary?.en || post.summary?.fr || post.summary || "Discover this article on intelligent investing.";
    const imageUrl = post.featuredImage || "https://bubbleinvest.org/assets/images/bubble-logo-single.svg";
    const publishedDate = post.publishedDate ? new Date(post.publishedDate).toISOString() : "";
    const content = post.content?.en || post.content?.fr || post.content || "";

    html = html.replace(
      'id="post-title">Article - Bubble Blog<',
      `id="post-title">${title} | Bubble Blog<`
    );
    html = html.replace(
      'id="post-description" content="Read this article',
      `id="post-description" content="${summary}`
    );
    html = html.replace(
      'id="og-title" content="Article - Bubble Blog"',
      `id="og-title" content="${title} | Bubble Blog"`
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
      `id="hreflang-default" hreflang="x-default" href="https://bubbleinvest.org/blog/${slug}"`
    );

    if (publishedDate) {
      html = html.replace(
        'id="article-published-time" content=""',
        `id="article-published-time" content="${publishedDate}"`
      );
    }

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

router.get("/en/privacy", (req, res) => {
  res.sendFile(path.join(enPagesDir, "privacy.html"));
});

router.get("/en/legal-notice", (req, res) => {
  res.sendFile(path.join(enPagesDir, "legal-notice.html"));
});

router.get("/en/github", (req, res) => {
  res.sendFile(path.join(enPagesDir, "github.html"));
});

router.get("/en/labs", (req, res) => {
  res.sendFile(path.join(enPagesDir, "labs.html"));
});

// ============================================
// 301 REDIRECTS FROM LEGACY URLs
// ============================================

// Legacy investor pages → new particuliers
router.get("/investors", (req, res) => res.redirect(301, "/particuliers"));
router.get("/investors/solution", (req, res) => res.redirect(301, "/particuliers"));
router.get("/investors/pricing", (req, res) => res.redirect(301, "/particuliers"));
router.get("/investors/playground", (req, res) => res.redirect(301, "/particuliers"));
router.get("/investors/playground/*", (req, res) => res.redirect(301, "/particuliers"));
router.get("/investors/education", (req, res) => res.redirect(301, "/particuliers"));
router.get("/investors/education/*", (req, res) => res.redirect(301, "/particuliers"));
router.get("/investors/portfolio-simulator", (req, res) => res.redirect(301, "/particuliers"));

// Legacy professional pages → new professionnels
router.get("/professionals", (req, res) => res.redirect(301, "/professionnels"));
router.get("/professionals/*", (req, res) => res.redirect(301, "/professionnels"));

// Legacy EN investor pages → new individuals
router.get("/en/investors", (req, res) => res.redirect(301, "/en/individuals"));
router.get("/en/investors/*", (req, res) => res.redirect(301, "/en/individuals"));

// Legacy EN professional pages → new professionals page
router.get("/en/professionals/*", (req, res) => res.redirect(301, "/en/professionals"));

// Legacy portfolio simulator & pricing
router.get("/portfolio-simulator", (req, res) => res.redirect(301, "/particuliers"));
router.get("/en/portfolio-simulator", (req, res) => res.redirect(301, "/en/individuals"));
router.get(["/pricing", "/pricing.html"], (req, res) => res.redirect(301, "/particuliers"));
router.get(["/en/pricing", "/en/pricing.html"], (req, res) => res.redirect(301, "/en/individuals"));

// ============================================
// DEV-ONLY ROUTES
// ============================================

if (process.env.NODE_ENV !== "production") {
  router.get("/clear-cache", (req, res) => {
    res.sendFile(path.join(frPagesDir, "clear-cache.html"));
  });
}

module.exports = router;
