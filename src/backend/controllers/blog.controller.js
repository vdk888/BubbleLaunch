const { getPublishedPosts, getPostBySlug } = require("../services/blogService");
const imageService = require("../services/imageService");

/**
 * Get all published blog posts (JSON API)
 */
async function getPosts(req, res) {
  try {
    const posts = await getPublishedPosts();
    res.json(posts);
  } catch (error) {
    console.error("Error fetching blog posts for API:", error);
    res.status(500).json({ error: "Failed to fetch blog posts" });
  }
}

/**
 * Get a single blog post by slug (JSON API)
 */
async function getPost(req, res) {
  try {
    const { slug } = req.params;
    const post = await getPostBySlug(slug);

    if (!post) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    res.json(post);
  } catch (error) {
    console.error("Error fetching blog post by slug:", error);
    res.status(500).json({ error: "Failed to fetch blog post" });
  }
}

/**
 * Test OpenAI image service connectivity
 */
async function testImageServiceConnection(req, res) {
  try {
    console.log("🔍 Testing OpenAI image service connection...");

    const isConnected = await imageService.testConnection();

    res.json({
      success: isConnected,
      message: isConnected
        ? "OpenAI image service connection successful"
        : "OpenAI image service connection failed",
      apiKeyPresent: !!(
        process.env.OPENAI_API_KEY || process.env.FREEPIK_API_KEY
      ),
    });
  } catch (error) {
    console.error("Error testing OpenAI image service connection:", error);
    res.status(500).json({
      error: "Failed to test OpenAI image service connection",
      details: error.message,
    });
  }
}

/**
 * Test image generation
 */
async function testImageGeneration(req, res) {
  try {
    const { title, summary, tags } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    console.log(`🧪 Testing image generation for: "${title}"`);

    const imageUrl = await imageService.generateArticleImage(
      title,
      summary || "Test article summary for image generation",
      tags || ["test", "ai", "finance"]
    );

    if (imageUrl) {
      res.json({
        success: true,
        imageUrl: imageUrl,
        message: "Image generated successfully",
      });
    } else {
      res.json({
        success: false,
        message: "Image generation failed or service not available",
      });
    }
  } catch (error) {
    console.error("❌ Error testing image generation:", error);
    res.status(500).json({
      error: "Failed to generate test image",
      details: error.message,
    });
  }
}

/**
 * Clear OpenAI image cache
 */
async function clearImageCache(req, res) {
  try {
    console.log("🧹 Clearing OpenAI image cache...");

    imageService.clearCache();
    const cacheStats = imageService.getCacheStats();

    res.json({
      success: true,
      message: "Image cache cleared successfully",
      cacheStats: cacheStats,
    });
  } catch (error) {
    console.error("❌ Error clearing image cache:", error);
    res.status(500).json({
      error: "Failed to clear image cache",
      details: error.message,
    });
  }
}

/**
 * Get cache statistics
 */
async function getImageCacheStats(req, res) {
  try {
    const cacheStats = imageService.getCacheStats();
    res.json({ success: true, cacheStats: cacheStats });
  } catch (error) {
    console.error("❌ Error getting cache stats:", error);
    res.status(500).json({
      error: "Failed to get cache statistics",
      details: error.message,
    });
  }
}

/**
 * Regenerate all blog images
 */
async function regenerateAllImages(req, res) {
  try {
    console.log("🔄 Force regenerating all blog images...");

    imageService.clearCache();
    const posts = await getPublishedPosts();

    const regenerationPromises = posts.map(async (post) => {
      try {
        console.log(`🎨 Regenerating image for: "${post.title.fr}"`);
        const newImageUrl = await imageService.generateArticleImage(
          post.title.fr,
          post.summary.fr,
          post.tags,
          post.id,
          true // bypassCache = true
        );
        return {
          title: post.title.fr,
          success: !!newImageUrl,
          imageUrl: newImageUrl,
        };
      } catch (error) {
        console.error(
          `Failed to regenerate image for "${post.title.fr}":`,
          error
        );
        return {
          title: post.title.fr,
          success: false,
          error: error.message,
        };
      }
    });

    const results = await Promise.all(regenerationPromises);

    res.json({
      success: true,
      message: `Regenerated images for ${results.length} articles`,
      results: results,
    });
  } catch (error) {
    console.error("❌ Error regenerating images:", error);
    res.status(500).json({
      error: "Failed to regenerate images",
      details: error.message,
    });
  }
}

/**
 * Regenerate image for a specific blog post
 */
async function regenerateImage(req, res) {
  try {
    const { slug } = req.params;
    console.log(`🔄 Force regenerating image for post: ${slug}`);

    const post = await getPostBySlug(slug);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      });
    }

    const newImageUrl = await imageService.generateArticleImage(
      post.title.fr,
      post.summary.fr,
      post.tags,
      post.id,
      true // bypassCache = true
    );

    res.json({
      success: true,
      message: `Image regenerated for "${post.title.fr}"`,
      imageUrl: newImageUrl,
      post: {
        slug,
        title: post.title.fr,
      },
    });
  } catch (error) {
    console.error("Error regenerating single post image:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Generate image for a specific article
 */
async function generateArticleImage(req, res) {
  try {
    const { articleId, title, summary, tags, forceRegenerate } = req.body;

    if (!articleId || !title) {
      return res.status(400).json({
        success: false,
        error: "articleId and title are required",
      });
    }

    // Check if image already exists in cache (unless force regenerate)
    if (!forceRegenerate) {
      const cachedImage = imageService.getCachedImage(articleId);
      if (cachedImage) {
        return res.json({
          success: true,
          imageUrl: cachedImage,
          fromCache: true,
        });
      }
    }

    // Generate new image
    const imageUrl = await imageService.generateArticleImage(
      title,
      summary || "",
      tags || [],
      articleId,
      forceRegenerate
    );

    if (imageUrl) {
      res.json({
        success: true,
        imageUrl,
        fromCache: false,
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to generate image",
      });
    }
  } catch (error) {
    console.error("Error generating article image:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getPosts,
  getPost,
  testImageServiceConnection,
  testImageGeneration,
  clearImageCache,
  getImageCacheStats,
  regenerateAllImages,
  regenerateImage,
  generateArticleImage,
};
