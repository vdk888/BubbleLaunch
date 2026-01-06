const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const imageService = require('../src/backend/services/imageService');

async function testImageService() {
    console.log("--- Starting Image Service Debug ---");
    
    // 1. Check API Key
    if (!process.env.RUNWARE_API_KEY) {
        console.error("❌ RUNWARE_API_KEY is missing in environment variables!");
    } else {
        console.log("✅ RUNWARE_API_KEY is present.");
    }

    // 2. Test with a known broken article ID from the cache
    // This ID corresponds to a URL we confirmed was 404: "https://im.runware.ai/image/ws/2/ii/48e75c63-cc5b-49af-81e1-37ad3f57628e.png"
    const testArticleId = "article-23ecfc52-0644-809c-bb91-edf329d64015";
    
    console.log(`\nTesting article ID: ${testArticleId}`);

    try {
        // Check what's currently in the cache object (memory)
        // We can't access imageService.imageCache directly easily if it's not exported, 
        // but we can infer from getCachedImage behavior.
        
        console.log("Calling getCachedImage...");
        const cachedUrl = await imageService.getCachedImage(testArticleId.replace('article-', ''));
        console.log(`getCachedImage returned: ${cachedUrl}`);
        
        if (cachedUrl === null) {
            console.log("✅ Cache validation working: Broken URL was identified and removed (returned null).");
            
            console.log("\nAttempting regeneration...");
            // Mock title/summary/tags for regeneration
            const newImage = await imageService.generateArticleImage(
                "Test Article Title",
                "Test Summary",
                ["finance", "ai"],
                testArticleId.replace('article-', '')
            );
            
            console.log(`generateArticleImage returned: ${newImage}`);
            
            if (newImage) {
                 console.log("✅ Regeneration successful!");
            } else {
                 console.log("❌ Regeneration failed. Check Runware API credits or connection.");
            }

        } else {
             console.log("❌ Cache validation failed: Returned a URL (check if this URL is actually valid via curl).");
             console.log(`URL: ${cachedUrl}`);
        }

    } catch (error) {
        console.error("Error during test:", error);
    }
}

testImageService();
