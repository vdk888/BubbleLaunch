/**
 * Blog Preview Component
 * Displays latest 3 blog posts as tiles on the homepage
 */

async function loadBlogPreview() {
  const previewGrid = document.getElementById('blog-preview-grid');

  if (!previewGrid) {
    console.warn('Blog preview grid not found');
    return;
  }

  try {
    // Fetch blog posts from API
    const response = await fetch('/api/blog/posts');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const posts = await response.json();

    // Filter published posts and get latest 3
    const publishedPosts = posts
      .filter(post => post.status === 'Published')
      .sort((a, b) => new Date(b.publicationDate) - new Date(a.publicationDate))
      .slice(0, 3);

    if (publishedPosts.length === 0) {
      // Show empty state
      previewGrid.innerHTML = `
        <div class="blog-preview-empty">
          <p data-translate="blogPreview.noPosts">Aucun article pour le moment</p>
        </div>
      `;
      return;
    }

    // Get current language
    const currentLang = localStorage.getItem('bubbleLanguage') || 'fr';

    // Render blog tiles
    previewGrid.innerHTML = publishedPosts.map(post => {
      const title = currentLang === 'en' && post.title.en ? post.title.en : post.title.fr;
      const summary = currentLang === 'en' && post.summary.en ? post.summary.en : post.summary.fr;
      const imageUrl = post.featuredImage || '/assets/images/blog-placeholder.jpg';

      // Format date
      const date = new Date(post.publishedDate);
      const formattedDate = date.toLocaleDateString(currentLang === 'en' ? 'en-US' : 'fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Get first tag for category badge
      const category = post.tags && post.tags.length > 0 ? post.tags[0] : '';

      return `
        <article class="blog-tile" data-slug="${post.slug}">
          <a href="/blog/${post.slug}" class="blog-tile-link">
            <div class="blog-tile-image">
              <img src="${imageUrl}" alt="${title}" loading="lazy" />
              ${category ? `<span class="blog-tile-category">${category}</span>` : ''}
            </div>
            <div class="blog-tile-content">
              <div class="blog-tile-meta">
                <time datetime="${post.publishedDate}">${formattedDate}</time>
              </div>
              <h3 class="blog-tile-title">${title}</h3>
              <p class="blog-tile-summary">${summary}</p>
              <span class="blog-tile-cta" data-translate="blogPreview.readMore">Lire la suite →</span>
            </div>
          </a>
        </article>
      `;
    }).join('');

    // Trigger fade-in animations
    setTimeout(() => {
      const tiles = previewGrid.querySelectorAll('.blog-tile');
      tiles.forEach((tile, index) => {
        setTimeout(() => {
          tile.classList.add('fade-in-up');
        }, index * 100);
      });
    }, 100);

  } catch (error) {
    console.error('Error loading blog preview:', error);

    // Show error state
    previewGrid.innerHTML = `
      <div class="blog-preview-error">
        <p>Impossible de charger les articles. Veuillez réessayer plus tard.</p>
      </div>
    `;
  }
}

// Load blog preview when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadBlogPreview);
} else {
  loadBlogPreview();
}

// Reload preview when language changes
window.addEventListener('languageChanged', loadBlogPreview);
