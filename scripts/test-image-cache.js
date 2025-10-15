#!/usr/bin/env node

/**
 * Test script to verify OpenAI image caching is working correctly
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function testImageCache() {
    console.log('🧪 Testing OpenAI Image Cache\n');
    
    try {
        // Test 1: Check cache stats
        console.log('📊 Getting cache stats...');
        const statsResponse = await axios.get(`${API_URL}/api/blog/image-cache-stats`);
        console.log('Cache stats:', statsResponse.data);
        console.log('');
        
        // Test 2: Generate an image for a test article
        const testArticle = {
            articleId: 'test-article-123',
            title: 'Test Article: Understanding AI in Finance',
            summary: 'This is a test article about artificial intelligence in financial markets',
            tags: ['AI', 'Finance', 'Technology']
        };
        
        console.log('🎨 Generating image for test article...');
        console.log('Article:', testArticle);
        
        const generateResponse1 = await axios.post(`${API_URL}/api/blog/generate-article-image`, testArticle);
        console.log('First generation result:', {
            success: generateResponse1.data.success,
            fromCache: generateResponse1.data.fromCache,
            imageUrl: generateResponse1.data.imageUrl ? 'Generated' : 'None'
        });
        console.log('');
        
        // Test 3: Try generating again - should use cache
        console.log('📦 Attempting to generate same image again (should use cache)...');
        const generateResponse2 = await axios.post(`${API_URL}/api/blog/generate-article-image`, testArticle);
        console.log('Second generation result:', {
            success: generateResponse2.data.success,
            fromCache: generateResponse2.data.fromCache,
            imageUrl: generateResponse2.data.imageUrl ? 'Cached' : 'None'
        });
        
        if (generateResponse2.data.fromCache) {
            console.log('✅ Cache is working correctly!');
        } else {
            console.log('❌ Cache is not working - image was regenerated');
        }
        console.log('');
        
        // Test 4: Force regenerate
        console.log('🔄 Force regenerating image...');
        const forceResponse = await axios.post(`${API_URL}/api/blog/generate-article-image`, {
            ...testArticle,
            forceRegenerate: true
        });
        console.log('Force regeneration result:', {
            success: forceResponse.data.success,
            fromCache: forceResponse.data.fromCache,
            imageUrl: forceResponse.data.imageUrl ? 'Regenerated' : 'None'
        });
        
        console.log('\n✅ All tests completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Run the test
console.log('Make sure the server is running on port 3000...\n');
testImageCache();
