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
 * Individual blog post page
 */
router.get("/blog/:slug", async (req, res) => {
  try {
    const blogPostPath = path.join(
      frPagesDir,
      "blog-post.html"
    );
    res.sendFile(blogPostPath);
  } catch (error) {
    console.error("Error serving blog post page:", error);
    res.status(500).send("Error loading blog post");
  }
});

/**
 * Test image generation page
 */
router.get("/test-image", (req, res) => {
  res.sendFile(
    path.join(frPagesDir, "test-image-generation.html")
  );
});

/**
 * Clear cache management page
 */
router.get("/clear-cache", (req, res) => {
  res.sendFile(
    path.join(frPagesDir, "clear-cache.html")
  );
});

/**
 * Portfolio simulator page
 */
router.get("/portfolio-simulator", (req, res) => {
  res.sendFile(
    path.join(frPagesDir, "portfolio-simulator.html")
  );
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
 * Businesses page (B2B consulting services)
 */
router.get("/businesses", (req, res) => {
  res.sendFile(
    path.join(frPagesDir, "businesses.html")
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
 * English individual blog post
 */
router.get("/en/blog/:slug", async (req, res) => {
  try {
    const blogPostPath = path.join(enPagesDir, "blog-post.html");
    res.sendFile(blogPostPath);
  } catch (error) {
    console.error("Error serving EN blog post page:", error);
    res.status(500).send("Error loading blog post");
  }
});

router.get("/en/portfolio-simulator", (req, res) => {
  res.sendFile(path.join(enPagesDir, "portfolio-simulator.html"));
});

router.get("/en/privacy", (req, res) => {
  res.sendFile(path.join(enPagesDir, "privacy.html"));
});

router.get("/en/businesses", (req, res) => {
  res.sendFile(path.join(enPagesDir, "businesses.html"));
});

module.exports = router;
