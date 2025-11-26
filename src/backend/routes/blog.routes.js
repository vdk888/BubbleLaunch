const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blog.controller");

// Blog posts API
router.get("/posts", blogController.getPosts);
router.get("/post/:slug", blogController.getPost);

// Development-only routes (image utilities and testing)
if (process.env.NODE_ENV !== "production") {
  router.get(
    "/test-image-service-connection",
    blogController.testImageServiceConnection
  );
  router.post("/test-image-generation", blogController.testImageGeneration);
  router.post("/clear-image-cache", blogController.clearImageCache);
  router.get("/image-cache-stats", blogController.getImageCacheStats);
  router.post("/regenerate-all-images", blogController.regenerateAllImages);
  router.post("/regenerate-image/:slug", blogController.regenerateImage);
  router.post("/generate-article-image", blogController.generateArticleImage);

  // Manual image selection
  router.get("/available-images", blogController.getAvailableImages);
  router.post("/set-article-image", blogController.setArticleImage);
}

module.exports = router;
