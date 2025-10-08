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
 * Blog index page
 */
router.get("/blog", async (req, res) => {
  try {
    const posts = await getPublishedPosts();
    const blogIndexPath = path.join(
      __dirname,
      "../../frontend/pages/blog.html"
    );

    // Check if blog.html exists
    try {
      await fs.access(blogIndexPath);
      res.sendFile(blogIndexPath);
    } catch {
      // Temporary response until we create the blog page
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Bubble Blog</title>
          <style>body{font-family:Inter,sans-serif;max-width:800px;margin:0 auto;padding:20px;}</style>
        </head>
        <body>
          <h1>Bubble Blog</h1>
          <p>Blog functionality is being set up...</p>
          <a href="/">← Back to Bubble</a>
          <h2>Posts (${posts.length})</h2>
          ${posts
            .map(
              (post) => `
            <div style="border-bottom:1px solid #eee;padding:20px 0;">
              <h3><a href="/blog/${post.slug}">${post.title}</a></h3>
              <p>${post.summary}</p>
              <small>${post.publishedDate}</small>
            </div>
          `
            )
            .join("")}
        </body>
        </html>
      `);
    }
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

module.exports = router;
