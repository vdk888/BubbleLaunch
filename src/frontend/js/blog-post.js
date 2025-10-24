// Individual Blog Post functionality
let currentLanguage = 'fr'; // Default to French
let currentPost = null; // Store current post for language switching

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize language (use same key as main script.js)
    currentLanguage = localStorage.getItem('bubbleLanguage') || 'en';

    // Update static text translations on page load
    updateStaticTranslations();

    // Listen to language changes from main script.js
    document.addEventListener('languageChanged', (e) => {
        currentLanguage = e.detail.lang;
        updateStaticTranslations();
        if (currentPost) {
            displayBlogPost(currentPost);
        }
    });

    // Add navigation event listeners
    document.querySelectorAll('nav a[href^="/#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(2);
            window.location.href = '/' + this.getAttribute('href').substring(1);
        });
    });

    const slug = getSlugFromUrl();
    if (slug) {
        await loadBlogPost(slug);
    } else {
        showError();
    }
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

function getSlugFromUrl() {
    const pathParts = window.location.pathname.split('/');
    // URL format: /blog/slug-name
    if (pathParts.length >= 3 && pathParts[1] === 'blog') {
        return pathParts[2];
    }
    return null;
}

async function loadBlogPost(slug) {
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const blogPost = document.getElementById('blog-post');
    
    try {
        // Fetch the specific blog post
        const response = await fetch(`/api/blog/post/${slug}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Post not found');
            }
            throw new Error('Failed to fetch blog post');
        }
        
        currentPost = await response.json();
        
        // Hide loading state
        loadingState.style.display = 'none';
        
        // Display the post
        displayBlogPost(currentPost);
        blogPost.style.display = 'block';
        
    } catch (error) {
        console.error('Error loading blog post:', error);
        loadingState.style.display = 'none';
        showError(error.message);
    }
}

function displayBlogPost(post) {
    // Get language-specific content
    const title = post.title[currentLanguage] || post.title.fr;
    const summary = post.summary[currentLanguage] || post.summary.fr;
    const content = post.content[currentLanguage] || post.content.fr;

    const defaultSummary = currentLanguage === 'fr' ?
        'Découvrez cet article sur l\'investissement intelligent.' :
        'Discover this article on intelligent investing.';
    const metaSummary = summary || defaultSummary;
    const metaTitle = `${title} | Blog Bubble`;
    const currentUrl = `https://bubbleinvest.org/blog/${post.slug}`;
    const imageUrl = post.imageUrl || 'https://bubbleinvest.org/assets/images/bubble-logo-single.svg';

    // Update page title and SEO meta tags
    document.title = metaTitle;
    document.getElementById('post-title').textContent = metaTitle;
    document.getElementById('post-description').setAttribute('content', metaSummary);
    document.getElementById('post-keywords').setAttribute('content', post.tags ? post.tags.join(', ') : 'investissement, finance, IA');

    // Update Open Graph meta tags
    document.getElementById('og-url').setAttribute('content', currentUrl);
    document.getElementById('og-title').setAttribute('content', metaTitle);
    document.getElementById('og-description').setAttribute('content', metaSummary);
    document.getElementById('og-image').setAttribute('content', imageUrl);

    // Update Twitter Card meta tags
    document.getElementById('twitter-url').setAttribute('content', currentUrl);
    document.getElementById('twitter-title').setAttribute('content', metaTitle);
    document.getElementById('twitter-description').setAttribute('content', metaSummary);
    document.getElementById('twitter-image').setAttribute('content', imageUrl);

    // Update canonical URL
    document.getElementById('canonical-url').setAttribute('href', currentUrl);

    // Update hreflang tags
    document.getElementById('hreflang-fr').setAttribute('href', currentUrl);
    document.getElementById('hreflang-en').setAttribute('href', `${currentUrl}?lang=en`);
    document.getElementById('hreflang-default').setAttribute('href', currentUrl);

    // Update article published time
    if (post.publishedDate) {
        document.getElementById('article-published-time').setAttribute('content', new Date(post.publishedDate).toISOString());
    }
    
    // Update breadcrumb
    document.getElementById('breadcrumb-title').textContent = title;
    
    // Update article header
    document.getElementById('article-title').textContent = title;
    document.getElementById('post-date').textContent = formatDate(post.publishedDate);
    
    if (summary) {
        document.getElementById('article-summary').textContent = summary;
    } else {
        document.getElementById('article-summary').style.display = 'none';
    }
    
    // Update featured image if available
    if (post.featuredImage) {
        const imageContainer = document.getElementById('featured-image-container');
        const image = document.getElementById('featured-image');
        image.src = post.featuredImage;
        image.alt = title;
        imageContainer.style.display = 'block';
        
        // Add regenerate button (only in development or with special access)
        if (window.location.hostname === 'localhost' || window.location.search.includes('dev=true')) {
            let regenerateBtn = document.getElementById('regenerate-image-btn');
            if (!regenerateBtn) {
                regenerateBtn = document.createElement('button');
                regenerateBtn.id = 'regenerate-image-btn';
                regenerateBtn.textContent = 'Regenerate Image';
                regenerateBtn.onclick = regeneratePostImage;
                regenerateBtn.style.cssText = `
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    padding: 8px 12px;
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    z-index: 10;
                `;
                imageContainer.style.position = 'relative';
                imageContainer.appendChild(regenerateBtn);
            }
        }
    }
    
    // Update content
    const contentDiv = document.getElementById('article-content');
    contentDiv.innerHTML = content;
    
    // Update tags
    updatePostTags(post.tags || []);
    
    // Calculate and display reading time
    const readingTime = calculateReadingTime(content);
    const readingTimeText = currentLanguage === 'fr' ? 
        `${readingTime} min de lecture` : 
        `${readingTime} min read`;
    document.getElementById('reading-time').textContent = readingTimeText;
    
    // Enhance content (add syntax highlighting, etc.)
    enhanceContent();
}

function updatePostTags(tags) {
    const tagsContainer = document.getElementById('post-tags');
    if (!tagsContainer) return;
    
    if (tags.length === 0) {
        tagsContainer.style.display = 'none';
        return;
    }
    
    tagsContainer.style.display = 'block';
    tagsContainer.innerHTML = tags.map(tag => `<span class="tag">${tag}</span>`).join('');
}

function formatDate(dateString) {
    if (!dateString) {
        return currentLanguage === 'fr' ? 'Date inconnue' : 'Unknown date';
    }
    
    const date = new Date(dateString);
    const locale = currentLanguage === 'fr' ? 'fr-FR' : 'en-US';
    return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function calculateReadingTime(content) {
    // Remove HTML tags and count words
    const text = content.replace(/<[^>]*>/g, '');
    const words = text.trim().split(/\s+/).length;
    // Average reading speed: 200 words per minute
    const readingTime = Math.ceil(words / 200);
    return Math.max(1, readingTime);
}

function enhanceContent() {
    const contentDiv = document.getElementById('article-content');
    
    // Add target="_blank" to external links
    const links = contentDiv.querySelectorAll('a[href^="http"]');
    links.forEach(link => {
        if (!link.hostname.includes(window.location.hostname)) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });
    
    // Add copy button to code blocks
    const codeBlocks = contentDiv.querySelectorAll('pre code');
    codeBlocks.forEach(codeBlock => {
        const pre = codeBlock.parentElement;
        const button = document.createElement('button');
        button.textContent = 'Copier';
        button.className = 'copy-code-btn';
        button.style.cssText = `
            position: absolute;
            top: 0.5rem;
            right: 0.5rem;
            padding: 0.25rem 0.5rem;
            background: rgba(0,0,0,0.7);
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 0.75rem;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.2s ease;
        `;
        
        pre.style.position = 'relative';
        pre.appendChild(button);
        
        pre.addEventListener('mouseenter', () => {
            button.style.opacity = '1';
        });
        
        pre.addEventListener('mouseleave', () => {
            button.style.opacity = '0';
        });
        
        button.addEventListener('click', () => {
            navigator.clipboard.writeText(codeBlock.textContent).then(() => {
                button.textContent = 'Copié!';
                setTimeout(() => {
                    button.textContent = 'Copier';
                }, 2000);
            });
        });
    });
    
    // Add smooth scrolling for anchor links
    const anchorLinks = contentDiv.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function showError(message = 'Article introuvable') {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('error-state').style.display = 'block';
    
    if (message === 'Post not found') {
        document.querySelector('.error-state h2').textContent = 'Article introuvable';
        document.querySelector('.error-state p').textContent = 'Cet article n\'existe pas ou a été supprimé.';
    } else {
        document.querySelector('.error-state h2').textContent = 'Erreur de chargement';
        document.querySelector('.error-state p').textContent = 'Impossible de charger cet article. Veuillez réessayer plus tard.';
    }
}

// Function to regenerate image for current post
async function regeneratePostImage() {
    if (!currentPost) return;
    
    const slug = getSlugFromUrl();
    const regenerateBtn = document.getElementById('regenerate-image-btn');
    
    if (regenerateBtn) {
        regenerateBtn.disabled = true;
        regenerateBtn.textContent = 'Regenerating...';
    }
    
    try {
        const response = await fetch(`/api/regenerate-image/${slug}`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Reload the post to get the new image
            await loadBlogPost(slug);
            alert('Image regenerated successfully!');
        } else {
            alert('Failed to regenerate image: ' + result.error);
        }
    } catch (error) {
        console.error('Error regenerating image:', error);
        alert('Error regenerating image');
    } finally {
        if (regenerateBtn) {
            regenerateBtn.disabled = false;
            regenerateBtn.textContent = 'Regenerate Image';
        }
    }
}

// Make function available globally
window.regeneratePostImage = regeneratePostImage;