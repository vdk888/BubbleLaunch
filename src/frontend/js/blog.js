// Blog functionality for Bubble
let currentLanguage = 'fr'; // Default to French
let allPosts = []; // Store all posts for language switching

document.addEventListener('DOMContentLoaded', async () => {
    // Detect language from URL route (similar to script.js)
    const isEnglishRoute = window.location.pathname.startsWith('/en/');
    currentLanguage = isEnglishRoute ? 'en' : 'fr';

    // Store the detected language
    localStorage.setItem('bubbleLanguage', currentLanguage);

    // Update static text translations on page load
    updateStaticTranslations();

    // Load posts
    await loadBlogPosts();

    // Listen to language changes from main script.js
    document.addEventListener('languageChanged', (e) => {
        currentLanguage = e.detail.lang;
        updateStaticTranslations();
        renderPosts();
    });

    // Add smooth scrolling for navigation links
    document.querySelectorAll('nav a[href^="/#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(2);

            // Navigate to home page with hash
            window.location.href = '/' + this.getAttribute('href').substring(1);
        });
    });
});

function updateStaticTranslations() {
    // Update all elements with data-translate attributes
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[key] && translations[key][currentLanguage]) {
            element.textContent = translations[key][currentLanguage];
        }
    });
}

async function loadBlogPosts() {
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const postsGrid = document.getElementById('posts-grid');

    console.log('🔄 Starting to load blog posts...');

    try {
        // Fetch posts from the API
        console.log('📡 Fetching /api/blog/posts');
        const response = await fetch('/api/blog/posts');

        console.log('📩 Got response:', response.status);

        if (!response.ok) {
            throw new Error('Failed to fetch blog posts');
        }

        allPosts = await response.json();
        console.log('✅ Posts loaded:', allPosts.length);

        // Hide loading state
        loadingState.style.display = 'none';
        console.log('👁️ Hidden loading state');

        if (allPosts.length === 0) {
            // Show empty state
            emptyState.style.display = 'block';
            return;
        }

        // Render posts with current language
        console.log('🎨 Rendering posts...');
        renderPosts();
        console.log('✨ Posts rendered');
        
    } catch (error) {
        console.error('Error loading blog posts:', error);
        loadingState.style.display = 'none';
        
        // Show error state
        postsGrid.innerHTML = `
            <div class="error-state" style="grid-column: 1/-1; text-align: center; padding: 4rem 0;">
                <div style="font-size: 2rem; margin-bottom: 1rem;">⚠️</div>
                <h3 style="color: #666; margin-bottom: 0.5rem;">${currentLanguage === 'fr' ? 'Erreur de chargement' : 'Loading Error'}</h3>
                <p style="color: #888;">${currentLanguage === 'fr' ? 'Impossible de charger les articles. Veuillez réessayer plus tard.' : 'Unable to load articles. Please try again later.'}</p>
                <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #1a1a1a; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    ${currentLanguage === 'fr' ? 'Réessayer' : 'Retry'}
                </button>
            </div>
        `;
    }
}

function renderPosts() {
    const featuredPost = document.getElementById('featured-post');
    const postsGrid = document.getElementById('posts-grid');

    if (allPosts.length === 0) return;

    // Find first pinned post or fallback to most recent
    const pinnedPost = allPosts.find(post => post.isPinned) || allPosts[0];

    // Display pinned/featured post
    displayFeaturedPost(pinnedPost, featuredPost);

    // Display remaining posts (excluding the featured one)
    const remainingPosts = allPosts.filter(post => post.id !== pinnedPost.id);
    displayPostsGrid(remainingPosts, postsGrid);
}

function displayFeaturedPost(post, container) {
    const formattedDate = formatDate(post.publishedDate);
    const title = post.title[currentLanguage] || post.title.fr;
    const summary = post.summary[currentLanguage] || post.summary.fr;

    const featuredTag = post.isPinned
        ? (currentLanguage === 'fr' ? '📌 Épinglé' : '📌 Pinned')
        : (currentLanguage === 'fr' ? 'Article principal' : 'Featured Article');
    const readMoreText = currentLanguage === 'fr' ? 'Lire l\'article' : 'Read Article';
    const defaultSummary = currentLanguage === 'fr' ? 
        'Découvrez nos dernières réflexions sur l\'investissement intelligent.' :
        'Discover our latest thoughts on intelligent investing.';
    
    container.innerHTML = `
        <div class="featured-card">
            <div class="featured-image">
                ${post.featuredImage ? 
                    `<img src="${post.featuredImage}" alt="${title}" loading="lazy">` :
                    `<div class="post-image-placeholder">📝</div>`
                }
            </div>
            <div class="featured-content">
                <div class="featured-meta">
                    <span class="post-date">${formattedDate}</span>
                    <span class="featured-tag">${featuredTag}</span>
                </div>
                <h2>${title}</h2>
                <p>${summary || defaultSummary}</p>
                <a href="/blog/${post.slug}" class="read-more-btn">
                    ${readMoreText}
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
        const emptyMessage = currentLanguage === 'fr' ?
            'Plus d\'articles arrivent bientôt...' :
            'More articles coming soon...';

        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem 0;">
                <p style="color: #888;">${emptyMessage}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = posts.map(post => createPostCard(post)).join('');

    // Initialize scroll animations after rendering
    setTimeout(() => initScrollAnimations(), 100);
}

function createPostCard(post) {
    const formattedDate = formatDate(post.publishedDate);
    const title = post.title[currentLanguage] || post.title.fr;

    const postTag = currentLanguage === 'fr' ? 'Article' : 'Article';

    return `
        <a href="/blog/${post.slug}" class="post-card">
            <div class="post-image">
                ${post.featuredImage ?
                    `<img src="${post.featuredImage}" alt="${title}" loading="lazy">` :
                    `<div class="post-image-placeholder">📝</div>`
                }
            </div>
            <div class="post-content">
                <div class="post-meta">
                    <span class="post-date">${formattedDate}</span>
                    ${post.isPinned ?
                        `<span class="post-tag pinned-tag">${currentLanguage === 'fr' ? '📌 Épinglé' : '📌 Pinned'}</span>` :
                        `<span class="post-tag">${postTag}</span>`
                    }
                </div>
                <h3 class="post-title">${title}</h3>
            </div>
        </a>
    `;
}

function formatDate(dateString) {
    if (!dateString) {
        return currentLanguage === 'fr' ? 'Date inconnue' : 'Unknown date';
    }
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // If less than 7 days ago, show relative time
    if (diffDays === 1) {
        return currentLanguage === 'fr' ? 'Hier' : 'Yesterday';
    } else if (diffDays < 7) {
        return currentLanguage === 'fr' ? 
            `Il y a ${diffDays} jours` : 
            `${diffDays} days ago`;
    } else {
        // Otherwise show formatted date
        const locale = currentLanguage === 'fr' ? 'fr-FR' : 'en-US';
        return date.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

/**
 * Initialize scroll-triggered animations for cards
 */
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                cardObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all post cards
    document.querySelectorAll('.post-card').forEach(card => {
        card.classList.add('fade-in');
        cardObserver.observe(card);
    });

    // Force check for cards already in view on initial load
    requestAnimationFrame(() => {
        document.querySelectorAll('.post-card.fade-in').forEach(card => {
            const rect = card.getBoundingClientRect();
            // If card is in viewport, make it visible immediately
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                card.classList.add('visible');
            }
        });
    });
}