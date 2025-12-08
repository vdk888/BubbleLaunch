/**
 * Clears the blog image cache so covers regenerate (or fall back to local assets)
 *
 * Usage:
 *   node scripts/clear-blog-image-cache.js
 */
const path = require('path');
const imageService = require('../src/backend/services/imageService');

// Clear and report
imageService.clearCache();

const stats = imageService.getCacheStats();
console.log('\n🧹 Blog image cache cleared.');
console.log('Cache file:', path.relative(process.cwd(), stats.cacheFile));
console.log('Entries now:', stats.entries);
console.log('Fallback images available:', stats.fallbackImagesAvailable);
console.log('Runware connected:', stats.runwareConnected);
