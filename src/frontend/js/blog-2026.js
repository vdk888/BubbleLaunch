/**
 * Blog 2026 — Dynamic content loader
 * Shared across /blog (FR) and /en/blog (EN)
 * Auto-detects language from <html lang="...">
 */
(function () {
  'use strict';

  const LANG = document.documentElement.lang === 'en' ? 'en' : 'fr';

  const STRINGS = {
    fr: {
      readMore: 'Lire la suite →',
      readArticle: '→ Lire l\'article',
      loadMore: 'Voir plus d\'articles',
      loadMoreRemaining: (n) => `Voir plus d'articles (${n} restants)`,
      loading: 'Chargement des articles...',
      noArticles: 'Aucun article pour le moment',
      noArticlesDesc: 'Nos premiers articles arrivent bientôt. Restez connectés !',
      loadError: 'Erreur de chargement',
      loadErrorDesc: 'Impossible de charger les articles. Veuillez réessayer plus tard.',
      loadingRefs: 'Chargement des références...',
      noRefs: 'Aucune référence disponible.',
      loadRefsError: 'Impossible de charger les références.',
      byAuthor: (a) => `Par ${a}`,
      read: 'Lire →',
      watch: 'Regarder →',
      categoryNames: {
        'Book': 'Livres',
        'Article': 'Articles',
        'Video': 'Vidéos',
        'Research': 'Recherches',
        'Podcast': 'Podcasts',
        'Research Paper': 'Papiers de recherche'
      }
    },
    en: {
      readMore: 'Read more →',
      readArticle: '→ Read article',
      loadMore: 'Load more articles',
      loadMoreRemaining: (n) => `Load more articles (${n} remaining)`,
      loading: 'Loading articles...',
      noArticles: 'No articles yet',
      noArticlesDesc: 'Our first articles are coming soon. Stay tuned!',
      loadError: 'Loading error',
      loadErrorDesc: 'Unable to load articles. Please try again later.',
      loadingRefs: 'Loading references...',
      noRefs: 'No references available.',
      loadRefsError: 'Unable to load references.',
      byAuthor: (a) => `By ${a}`,
      read: 'Read →',
      watch: 'Watch →',
      categoryNames: {
        'Book': 'Books',
        'Article': 'Articles',
        'Video': 'Videos',
        'Research': 'Research',
        'Podcast': 'Podcasts',
        'Research Paper': 'Research Papers'
      }
    }
  };

  const S = STRINGS[LANG];

  // Substack icon SVG
  const SUBSTACK_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/></svg>';

  function isSubstackUrl(url) {
    return url && (url.includes('substack.com') || url.includes('.substack.'));
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString(LANG === 'en' ? 'en-US' : 'fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function getTitle(post) {
    if (LANG === 'en') return post.title?.en || post.title?.fr || post.title;
    return post.title?.fr || post.title;
  }

  function getSummary(post) {
    var summary;

    // Extract summary for current language with fallback to other language
    if (LANG === 'en') {
      summary = post.summary?.en || post.summary?.fr;
    } else {
      summary = post.summary?.fr || post.summary?.en;
    }

    // Defensive: ensure we return a string, never an object
    if (!summary || typeof summary === 'object') {
      return '';
    }

    return String(summary);
  }

  // Pagination state
  let allPosts = [];
  let currentPage = 1;
  const postsPerPage = 6;

  function renderPostsPage(posts, page) {
    const blogGrid = document.getElementById('blog-grid');
    const loadMoreContainer = document.getElementById('load-more-container');
    const btnLoadMore = document.getElementById('btn-load-more');

    const endIndex = page * postsPerPage;
    const postsToShow = posts.slice(0, endIndex);

    const blogPrefix = LANG === 'en' ? '/en/blog' : '/blog';

    blogGrid.innerHTML = postsToShow.map(function (post) {
      var title = getTitle(post);
      var summary = getSummary(post);
      var image = post.featuredImage || '';
      var url = post.url || blogPrefix + '/' + post.slug;
      var date = formatDate(post.publishedDate || post.publicationDate);
      var category = Array.isArray(post.tags) && post.tags.length > 0 ? post.tags[0] : '';
      var isExternal = isSubstackUrl(url);

      return '<article class="blog-card" data-url="' + escapeHtml(url) + '" data-target="' + (isExternal ? '_blank' : '_self') + '">' +
        '<div class="blog-card-image">' +
          (image ? '<img src="' + image + '" alt="' + title + '" loading="lazy">' : '') +
          (category ? '<span class="blog-card-category">' + category + '</span>' : '') +
          (isExternal ? '<span class="substack-badge">' + SUBSTACK_ICON + '</span>' : '') +
        '</div>' +
        '<div class="blog-card-content">' +
          '<div class="blog-card-meta"><time datetime="' + (post.publishedDate || '') + '">' + date + '</time></div>' +
          '<h3>' + title + '</h3>' +
          '<p>' + summary + '</p>' +
          '<span class="blog-card-cta">' + S.readMore + '</span>' +
        '</div>' +
      '</article>';
    }).join('');

    if (posts.length > endIndex) {
      loadMoreContainer.style.display = 'block';
      btnLoadMore.classList.remove('hidden');
      btnLoadMore.innerHTML = '<span>' + S.loadMoreRemaining(posts.length - endIndex) + '</span>' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>';
    } else {
      loadMoreContainer.style.display = 'none';
    }
  }

  async function loadBlogPosts() {
    var loadingState = document.getElementById('loading-state');
    var emptyState = document.getElementById('empty-state');
    var featuredSection = document.getElementById('featured-post');
    var btnLoadMore = document.getElementById('btn-load-more');

    try {
      var response = await fetch('/api/blog/posts?t=' + Date.now());
      if (!response.ok) throw new Error('Failed to fetch blog posts');

      var posts = await response.json();
      var blogPrefix = LANG === 'en' ? '/en/blog' : '/blog';

      allPosts = posts
        .filter(function (post) { return !post.status || post.status === 'Published'; })
        .sort(function (a, b) { return new Date(b.publishedDate || b.publicationDate || 0) - new Date(a.publishedDate || a.publicationDate || 0); });

      loadingState.style.display = 'none';

      if (allPosts.length === 0) {
        emptyState.style.display = 'block';
        return;
      }

      // First post is featured
      var fp = allPosts[0];
      var remainingPosts = allPosts.slice(1);

      var fpTitle = getTitle(fp);
      var fpSummary = getSummary(fp);
      var fpImage = fp.featuredImage || '';
      var fpUrl = fp.url || blogPrefix + '/' + fp.slug;
      var fpDate = formatDate(fp.publishedDate || fp.publicationDate);
      var fpCategory = Array.isArray(fp.tags) && fp.tags.length > 0 ? fp.tags[0] : 'Article';
      var fpExternal = isSubstackUrl(fpUrl);

      featuredSection.innerHTML =
        '<article class="featured-card" data-url="' + escapeHtml(fpUrl) + '" data-target="' + (fpExternal ? '_blank' : '_self') + '">' +
          '<div class="featured-image">' +
            (fpImage ? '<img src="' + fpImage + '" alt="' + fpTitle + '" loading="lazy">' : '') +
            (fpExternal ? '<span class="substack-badge">' + SUBSTACK_ICON + '</span>' : '') +
          '</div>' +
          '<div class="featured-content">' +
            '<span class="featured-tag">' + fpCategory + (fpExternal ? ' — Substack' : '') + '</span>' +
            '<h2>' + fpTitle + '</h2>' +
            '<p>' + fpSummary + '</p>' +
            '<div class="featured-meta">' +
              '<time datetime="' + (fp.publishedDate || '') + '">' + fpDate + '</time>' +
              '<span>' + S.readArticle + '</span>' +
            '</div>' +
          '</div>' +
        '</article>';

      if (remainingPosts.length > 0) {
        renderPostsPage(remainingPosts, currentPage);
      }

      btnLoadMore.addEventListener('click', function () {
        currentPage++;
        renderPostsPage(remainingPosts, currentPage);
        setTimeout(function () {
          var newPosts = document.querySelectorAll('.blog-card');
          var lastVisible = newPosts[Math.min(currentPage * postsPerPage, newPosts.length) - 1];
          if (lastVisible) lastVisible.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      });

    } catch (error) {
      console.error('Error loading blog posts:', error);
      loadingState.style.display = 'none';
      emptyState.style.display = 'block';
      emptyState.querySelector('h3').textContent = S.loadError;
      emptyState.querySelector('p').textContent = S.loadErrorDesc;
    }
  }

  // === REFERENCES ===

  function getBestReferenceLink(reference) {
    if (reference.legalLinks) {
      if (reference.sourceType === 'Book') {
        if (reference.legalLinks.amazon) return reference.legalLinks.amazon;
        if (reference.legalLinks.publisher) return reference.legalLinks.publisher;
        if (reference.legalLinks.bookshop) return reference.legalLinks.bookshop;
        if (reference.legalLinks.open_library) return reference.legalLinks.open_library;
        if (reference.legalLinks.google_books) return reference.legalLinks.google_books;
        if (reference.legalLinks.goodreads) return reference.legalLinks.goodreads;
      }
      if (reference.sourceType === 'Article') {
        if (reference.legalLinks.journal) return reference.legalLinks.journal;
        if (reference.legalLinks.doi_link) return reference.legalLinks.doi_link;
        if (reference.legalLinks.publisher) return reference.legalLinks.publisher;
      }
      if (reference.sourceType === 'Video') {
        return reference.url || reference.legalLinks.video || null;
      }
    }
    if (reference.url && !reference.url.includes('drive.google.com')) return reference.url;
    return null;
  }

  function getHashtagsHTML(reference) {
    var tags = [];
    if (reference.category && reference.category.length > 0) {
      tags.push.apply(tags, reference.category.map(function (cat) { return '#' + cat.replace(/\s+/g, ''); }));
    }
    if (reference.mainTheme && reference.mainTheme !== 'General') {
      var themeTag = '#' + reference.mainTheme.replace(/\s+/g, '');
      if (tags.indexOf(themeTag) === -1) tags.push(themeTag);
    }
    if (reference.topics && reference.topics.length > 0) {
      var topicTags = reference.topics.slice(0, 3).map(function (topic) { return '#' + topic.replace(/\s+/g, '').replace(/[()]/g, ''); });
      tags.push.apply(tags, topicTags);
    }
    if (tags.length === 0) return '';
    return '<div class="reference-hashtags">' +
      tags.slice(0, 6).map(function (tag) { return '<span class="hashtag">' + tag + '</span>'; }).join('') +
    '</div>';
  }

  var categoryIcons = {
    'Book': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    'Article': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
    'Video': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>',
    'Research': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    'Podcast': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/><circle cx="12" cy="11" r="3"/></svg>'
  };

  async function loadReferences() {
    var referencesGrid = document.getElementById('references-grid');
    if (!referencesGrid) return;

    try {
      var response = await fetch('/api/knowledge-garden/references-by-source-type');
      if (!response.ok) throw new Error('Failed to fetch references');

      var groupedData = await response.json();

      if (!Array.isArray(groupedData) || groupedData.length === 0) {
        referencesGrid.innerHTML = '<p style="text-align: center; color: var(--muted);">' + S.noRefs + '</p>';
        return;
      }

      var sortedGroups = groupedData.slice().sort(function (a, b) {
        if (a.sourceType === 'Book' && b.sourceType !== 'Book') return -1;
        if (b.sourceType === 'Book' && a.sourceType !== 'Book') return 1;
        return a.sourceType.localeCompare(b.sourceType);
      });

      var categoriesHTML = sortedGroups
        .filter(function (group) { return group.references && group.references.length > 0; })
        .map(function (group) {
          var sourceType = group.sourceType;
          var references = group.references;
          var icon = categoryIcons[sourceType] || categoryIcons['Article'];
          var name = S.categoryNames[sourceType] || sourceType;

          return '<div class="reference-category" data-category="' + sourceType + '">' +
            '<div class="category-header" onclick="this.parentElement.classList.toggle(\'collapsed\')">' +
              '<h3 class="category-title">' +
                '<span class="category-icon">' + icon + '</span>' +
                name +
                '<span class="category-count">(' + (group.count || references.length) + ')</span>' +
              '</h3>' +
              '<button class="category-toggle" aria-expanded="true">' +
                '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
              '</button>' +
            '</div>' +
            '<div class="category-content">' +
              '<div class="references-inner-grid">' +
                references.map(function (ref) {
                  var bestLink = getBestReferenceLink(ref);
                  var hasLink = bestLink && bestLink !== '';
                  var summary = LANG === 'en' ? (ref.summary_en || ref.summary_fr || '') : (ref.summary_fr || ref.summary_en || '');
                  var isVideo = ref.sourceType === 'Video';
                  var actionLabel = isVideo ? S.watch : S.read;

                  return '<div class="reference-card">' +
                    '<div class="reference-header"><span style="opacity: 0.6;">' + ref.sourceType + '</span></div>' +
                    '<div class="reference-content">' +
                      (hasLink ? '<a href="' + bestLink + '" target="_blank" rel="noopener" class="reference-title">' + ref.title + '</a>' : '<div class="reference-title">' + ref.title + '</div>') +
                      (ref.author && ref.author !== 'Unknown Author' ? '<p class="reference-author">' + S.byAuthor(ref.author) + '</p>' : '') +
                      (summary ? '<p class="reference-summary">' + summary + '</p>' : '') +
                      getHashtagsHTML(ref) +
                    '</div>' +
                    (hasLink ? '<div class="reference-footer"><a href="' + bestLink + '" target="_blank" rel="noopener" class="reference-link-indicator"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8.5 1.5L15 8L8.5 14.5M14.5 8H1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' + actionLabel + '</a></div>' : '') +
                  '</div>';
                }).join('') +
              '</div>' +
            '</div>' +
          '</div>';
        }).join('');

      referencesGrid.innerHTML = categoriesHTML || '<p style="text-align: center; color: var(--muted);">' + S.noRefs + '</p>';

    } catch (error) {
      console.error('Error loading references:', error);
      referencesGrid.innerHTML = '<p style="text-align: center; color: var(--muted);">' + S.loadRefsError + '</p>';
    }
  }

  // Event delegation for blog card clicks
  document.addEventListener('click', function(e) {
    var card = e.target.closest('.blog-card, .featured-card');
    if (!card) return;

    var url = card.getAttribute('data-url');
    var target = card.getAttribute('data-target') || '_self';

    // Safety check for missing/invalid URLs
    if (!url || url === 'null' || url === 'undefined') {
      console.warn('Blog card missing URL:', card);
      return;
    }

    window.open(url, target);
  });

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      loadBlogPosts();
      loadReferences();
    });
  } else {
    loadBlogPosts();
    loadReferences();
  }
})();
