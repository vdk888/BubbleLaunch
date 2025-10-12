const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;
const { getPublishedPosts } = require("../services/blogService");

/**
 * Serve index.html for the root
 */
router.get("/", (req, res) => {
  console.log("Root route hit, serving index.html");
  const filePath = path.join(__dirname, "../../frontend/pages/index.html");
  console.log("File path:", filePath);
  res.sendFile(filePath);
});

/**
 * Serve index.html for /home (alternative homepage URL for SEO)
 */
router.get("/home", (req, res) => {
  console.log("Home route hit, serving index.html");
  const filePath = path.join(__dirname, "../../frontend/pages/index.html");
  res.sendFile(filePath);
});

/**
 * Blog index page with server-side rendering for SEO
 */
router.get("/blog", async (req, res) => {
  try {
    const posts = await getPublishedPosts();
    const blogIndexPath = path.join(
      __dirname,
      "../../frontend/pages/blog.html"
    );

    // Read the blog.html template
    let html = await fs.readFile(blogIndexPath, "utf-8");

    // Inject server-rendered blog post links for SEO (noscript fallback)
    // This ensures Google sees content even without JavaScript
    const seoContent = `
      <!-- SEO: Server-rendered blog post links for search engines -->
      <noscript>
        <div class="seo-blog-posts" style="max-width: 1200px; margin: 0 auto; padding: 40px 20px;">
          <h2>Articles récents</h2>
          ${posts
            .map(
              (post) => `
            <article style="margin-bottom: 30px; padding-bottom: 30px; border-bottom: 1px solid #eee;">
              <h3 style="margin-bottom: 10px;">
                <a href="/blog/${post.slug}" style="color: #000; text-decoration: none;">
                  ${post.title.fr || post.title}
                </a>
              </h3>
              <p style="color: #666; margin-bottom: 10px;">
                ${post.summary.fr || post.summary}
              </p>
              <time style="color: #999; font-size: 0.9em;">${post.publishedDate}</time>
            </article>
          `
            )
            .join("")}
        </div>
      </noscript>
      <!-- End SEO content -->
    `;

    // Inject before </body> tag
    html = html.replace("</body>", `${seoContent}</body>`);

    res.send(html);
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    res.status(500).send("Error loading blog");
  }
});

/**
 * Individual blog post page
 */
router.get("/blog/:slug", async (req, res) => {
  try {
    const blogPostPath = path.join(
      __dirname,
      "../../frontend/pages/blog-post.html"
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
    path.join(__dirname, "../../frontend/pages/test-image-generation.html")
  );
});

/**
 * Clear cache management page
 */
router.get("/clear-cache", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../frontend/pages/clear-cache.html")
  );
});

/**
 * Portfolio simulator page
 */
router.get("/portfolio-simulator", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../frontend/pages/portfolio-simulator.html")
  );
});

/**
 * Privacy Policy page (SEO + GDPR compliance)
 */
router.get("/privacy", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../frontend/pages/privacy.html")
  );
});

module.exports = router;
