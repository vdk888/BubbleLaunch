// Individual Blog Post functionality
let currentLanguage = 'fr'; // Default to French
let currentPost = null; // Store current post for language switching

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize language
    currentLanguage = localStorage.getItem('selectedLanguage') || 'fr';
    updateLanguageButtons();
    
    // Add language switcher event listeners
    document.getElementById('fr-switch').addEventListener('click', () => switchLanguage('fr'));
    document.getElementById('en-switch').addEventListener('click', () => switchLanguage('en'));
    
    const slug = getSlugFromUrl();
    if (slug) {
        await loadBlogPost(slug);
    } else {
        showError();
    }
});

function switchLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('selectedLanguage', lang);
    updateLanguageButtons();
    
    // Re-render post with new language
    if (currentPost) {
        displayBlogPost(currentPost);
    }
}

function updateLanguageButtons() {
    const frBtn = document.getElementById('fr-switch');
    const enBtn = document.getElementById('en-switch');
    
    frBtn.classList.toggle('active', currentLanguage === 'fr');
    enBtn.classList.toggle('active', currentLanguage === 'en');
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
    
    // Update page title and meta
    document.title = `${title} - Bubble Blog`;
    document.getElementById('post-title').textContent = `${title} - Bubble Blog`;
    
    const defaultSummary = currentLanguage === 'fr' ? 
        'Découvrez cet article sur l\'investissement intelligent.' :
        'Discover this article on intelligent investing.';
    document.getElementById('post-description').setAttribute('content', summary || defaultSummary);
    
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
    }
    
    // Update content
    const contentDiv = document.getElementById('article-content');
    contentDiv.innerHTML = content;
    
    // Calculate and display reading time
    const readingTime = calculateReadingTime(content);
    const readingTimeText = currentLanguage === 'fr' ? 
        `${readingTime} min de lecture` : 
        `${readingTime} min read`;
    document.getElementById('reading-time').textContent = readingTimeText;
    
    // Enhance content (add syntax highlighting, etc.)
    enhanceContent();
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

// Add navigation event listeners
document.querySelectorAll('nav a[href^="/#"]').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(2);
        window.location.href = '/' + this.getAttribute('href').substring(1);
    });
});