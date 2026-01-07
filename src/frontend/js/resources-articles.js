/**
 * Playground Resources - Blog Articles Loader
 * Dynamically loads and displays educational blog articles on the resources page
 */

// Function to determine difficulty level based on article tags
function getDifficultyLevel(tags) {
  if (!tags || !Array.isArray(tags)) return 'Beginner';

  const advancedTags = ['Behavioral Finance', 'Market Analysis', 'Value Investing', 'AI & Finance'];
  const hasAdvanced = tags.some(tag => advancedTags.includes(tag));

  return hasAdvanced ? 'Intermediate' : 'Beginner';
}

// Function to translate difficulty level
function translateDifficultyLevel(level) {
  const translations = window.translations || {};
  const key = `playground.resources.videos.${level.toLowerCase()}`;

  if (translations[key]) {
    const langCode = document.documentElement.lang || 'fr';
    return translations[key][langCode] || level;
  }

  return level;
}

// Function to format date
function formatDate(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  const langCode = document.documentElement.lang || 'fr';

  const options = { year: 'numeric', month: 'short', day: 'numeric' };

  if (langCode === 'en') {
    return date.toLocaleDateString('en-US', options);
  } else {
    return date.toLocaleDateString('fr-FR', options);
  }
}

// Function to create article card HTML
function createArticleCard(article) {
  const level = getDifficultyLevel(article.tags);
  const translatedLevel = translateDifficultyLevel(level);
  const formattedDate = formatDate(article.publishedDate);
  const langCode = document.documentElement.lang || 'fr';

  // Use featured image if available, otherwise use placeholder
  const imageHTML = article.featuredImage
    ? `<img src="${article.featuredImage}" alt="${article.title}" class="article-image" loading="lazy" />`
    : `<div class="article-image-placeholder">📰</div>`;

  // Get article title and summary for the current language
  const title = langCode === 'en' ? (article.titleEn || article.title) : article.title;
  const summary = langCode === 'en' ? (article.summaryEn || article.summary) : (article.summary || '');

  return `
    <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="article-card">
      ${imageHTML}
      <div class="article-content">
        <div class="article-meta">
          <span class="article-tag">${translatedLevel}</span>
          ${formattedDate ? `<span class="article-date">${formattedDate}</span>` : ''}
        </div>
        <h3 class="article-title">${title}</h3>
        <p class="article-summary">${summary}</p>
        <div class="article-footer">
          <span class="article-cta">
            ${langCode === 'en' ? 'Read article' : 'Lire l\'article'}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </span>
        </div>
      </div>
    </a>
  `;
}

// Main function to load articles
async function loadBlogArticles() {
  try {
    const articlesGrid = document.getElementById('articlesGrid');

    if (!articlesGrid) {
      console.warn('Articles grid element not found');
      return;
    }

    const langCode = document.documentElement.lang || 'fr';

    // Fetch published blog articles
    const response = await fetch('/api/blog/posts?status=published');

    if (!response.ok) {
      throw new Error(`Failed to fetch articles: ${response.status}`);
    }

    const articles = await response.json();

    if (!Array.isArray(articles) || articles.length === 0) {
      console.warn('No articles found');
      const noArticlesMsg = langCode === 'en' ? 'No articles available at the moment.' : 'Aucun article disponible pour le moment.';
      articlesGrid.innerHTML = `<p>${noArticlesMsg}</p>`;
      return;
    }

    // Filter articles with educational tone (by tags or title)
    const educationalArticles = articles.filter(article => {
      const tags = (article.tags || []).map(t => t.toLowerCase());
      const title = (article.title || '').toLowerCase();

      // Include articles with educational tags
      const educationalTags = [
        'financial education', 'investment strategy', 'behavioral finance',
        'market analysis', 'value investing', 'portfolio management', 'ai & finance', 'fintech'
      ];

      return tags.some(tag => educationalTags.some(eduTag => tag.includes(eduTag.toLowerCase()))) ||
             title.includes('investissement') ||
             title.includes('investisseur') ||
             title.includes('invest');
    });

    // Sort by pinned status and date
    educationalArticles.sort((a, b) => {
      // Pinned articles first
      const aPinned = a.pinned || false;
      const bPinned = b.pinned || false;

      if (aPinned !== bPinned) return bPinned - aPinned;

      // Then by date (newest first)
      const aDate = new Date(a.publishedDate || 0);
      const bDate = new Date(b.publishedDate || 0);

      return bDate - aDate;
    });

    // Limit to first 6 articles for cleaner display
    const displayArticles = educationalArticles.slice(0, 6);

    // Generate HTML for all articles
    const articlesHTML = displayArticles
      .map(article => createArticleCard(article))
      .join('');

    const noArticlesMsg = langCode === 'en'
      ? 'No educational articles available.'
      : 'Aucun article éducatif disponible.';

    articlesGrid.innerHTML = articlesHTML || `<p>${noArticlesMsg}</p>`;

  } catch (error) {
    console.error('Error loading blog articles:', error);
    const articlesGrid = document.getElementById('articlesGrid');
    if (articlesGrid) {
      const langCode = document.documentElement.lang || 'fr';
      const errorMsg = langCode === 'en'
        ? 'Error loading articles. Please try again later.'
        : 'Erreur lors du chargement des articles. Veuillez réessayer plus tard.';
      articlesGrid.innerHTML = `<p>${errorMsg}</p>`;
    }
  }
}

// Load articles when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadBlogArticles);
} else {
  loadBlogArticles();
}

// Also reload articles when language changes
if (typeof window !== 'undefined') {
  // Listen for language change events
  document.addEventListener('languageChanged', () => {
    loadBlogArticles();
  });
}
