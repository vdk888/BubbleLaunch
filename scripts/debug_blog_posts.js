const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const blogService = require('../src/backend/services/blogService');

async function debugBlogPosts() {
    console.log("--- Debugging Blog Posts & Image Generation ---");
    
    try {
        console.log("Fetching published posts...");
        const startTime = Date.now();
        const posts = await blogService.getPublishedPosts();
        const duration = (Date.now() - startTime) / 1000;
        
        console.log(`\nFetched ${posts.length} posts in ${duration} seconds.`);
        
        let validImages = 0;
        let nullImages = 0;
        
        posts.forEach((post, index) => {
            console.log(`\n[${index + 1}] ${post.title.fr}`);
            console.log(`    ID: ${post.id}`);
            console.log(`    Image: ${post.featuredImage}`);
            
            if (post.featuredImage) validImages++;
            else nullImages++;
        });
        
        console.log("\n--- Summary ---");
        console.log(`Total Posts: ${posts.length}`);
        console.log(`Valid Images: ${validImages}`);
        console.log(`Null Images: ${nullImages}`);
        
    } catch (error) {
        console.error("Error fetching posts:", error);
    }
}

debugBlogPosts();
