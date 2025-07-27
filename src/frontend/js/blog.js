// Blog functionality for Bubble
document.addEventListener('DOMContentLoaded', async () => {
    await loadBlogPosts();
});

async function loadBlogPosts() {
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const postsGrid = document.getElementById('posts-grid');
    const featuredPost = document.getElementById('featured-post');
    
    try {
        // Fetch posts from the API (we'll create this endpoint)
        const response = await fetch('/api/blog/posts');
        
        if (!response.ok) {
            throw new Error('Failed to fetch blog posts');
        }
        
        const posts = await response.json();
        
        // Hide loading state
        loadingState.style.display = 'none';
        
        if (posts.length === 0) {
            // Hide featured post section
            featuredPost.style.display = 'none';
            // Show empty state
            emptyState.style.display = 'block';
            return;
        }
        
        // Display featured post (first post)
        if (posts.length > 0) {
            displayFeaturedPost(posts[0], featuredPost);
        }
        
        // Display remaining posts in grid
        const remainingPosts = posts.slice(1);
        displayPostsGrid(remainingPosts, postsGrid);
        
    } catch (error) {
        console.error('Error loading blog posts:', error);
        loadingState.style.display = 'none';
        
        // Show error state
        postsGrid.innerHTML = `
            <div class="error-state" style="grid-column: 1/-1; text-align: center; padding: 4rem 0;">
                <div style="font-size: 2rem; margin-bottom: 1rem;">⚠️</div>
                <h3 style="color: #666; margin-bottom: 0.5rem;">Erreur de chargement</h3>
                <p style="color: #888;">Impossible de charger les articles. Veuillez réessayer plus tard.</p>
                <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #1a1a1a; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Réessayer
                </button>
            </div>
        `;
    }
}

function displayFeaturedPost(post, container) {
    const formattedDate = formatDate(post.publishedDate);
    
    container.innerHTML = `
        <div class="featured-card">
            <div class="featured-image">
                ${post.featuredImage ? 
                    `<img src="${post.featuredImage}" alt="${post.title}" loading="lazy">` :
                    `<div class="post-image-placeholder">📝</div>`
                }
            </div>
            <div class="featured-content">
                <div class="featured-meta">
                    <span class="post-date">${formattedDate}</span>
                    <span class="featured-tag">Article principal</span>
                </div>
                <h2>${post.title}</h2>
                <p>${post.summary || 'Découvrez nos dernières réflexions sur l\'investissement intelligent.'}</p>
                <a href="/blog/${post.slug}" class="read-more-btn">
                    Lire l'article
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </a>
            </div>
        </div>
    `;
}

function displayPostsGrid(posts, container) {
    if (posts.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem 0;">
                <p style="color: #888;">Plus d'articles arrivent bientôt...</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = posts.map(post => createPostCard(post)).join('');
}

function createPostCard(post) {
    const formattedDate = formatDate(post.publishedDate);
    
    return `
        <a href="/blog/${post.slug}" class="post-card">
            <div class="post-image">
                ${post.featuredImage ? 
                    `<img src="${post.featuredImage}" alt="${post.title}" loading="lazy">` :
                    `<div class="post-image-placeholder">📝</div>`
                }
            </div>
            <div class="post-content">
                <div class="post-meta">
                    <span class="post-date">${formattedDate}</span>
                    <span class="post-tag">Article</span>
                </div>
                <h3 class="post-title">${post.title}</h3>
                <p class="post-summary">${post.summary || 'Découvrez cet article sur l\'investissement intelligent.'}</p>
            </div>
        </a>
    `;
}

function formatDate(dateString) {
    if (!dateString) return 'Date inconnue';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // If less than 7 days ago, show relative time
    if (diffDays === 1) {
        return 'Hier';
    } else if (diffDays < 7) {
        return `Il y a ${diffDays} jours`;
    } else {
        // Otherwise show formatted date
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Add smooth scrolling for navigation links
document.querySelectorAll('nav a[href^="/#"]').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(2);
        
        // Navigate to home page with hash
        window.location.href = '/' + this.getAttribute('href').substring(1);
    });
});