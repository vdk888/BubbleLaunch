/**
 * Knowledge Garden References Component
 * Displays references from Notion Knowledge Garden in the blog section
 */

class ReferencesComponent {
    constructor() {
        this.references = [];
        this.groupedReferences = {};
        this.loading = false;
        this.currentLanguage = localStorage.getItem('bubbleLanguage') || 'en';
        this.setupLanguageListener();
    }

    async init() {
        console.log('🌱 Initializing Knowledge Garden References...');

        // Sync with current page language state
        this.syncLanguageState();

        // Show loading state immediately
        this.renderLoading();

        await this.loadReferences();
        this.renderReferences();
    }

    syncLanguageState() {
        // Use exact same logic as main script for consistency
        const storedLanguage = localStorage.getItem("bubbleLanguage");
        if (storedLanguage && (storedLanguage === "en" || storedLanguage === "fr")) {
            this.currentLanguage = storedLanguage;
        } else {
            // Try to detect browser language (same as main script)
            const browserLang = navigator.language || navigator.userLanguage;
            if (browserLang.startsWith("fr")) {
                this.currentLanguage = "fr";
            } else {
                this.currentLanguage = "en";
            }
        }
    }

    setupLanguageListener() {
        // Listen for language change events
        document.addEventListener('languageChanged', (event) => {
            this.currentLanguage = event.detail.language;
            this.updateLanguageContent();
        });
    }

    updateLanguageContent() {
        // Update static text that doesn't require re-rendering
        const referenceLinks = document.querySelectorAll('.reference-link-indicator');
        referenceLinks.forEach(link => {
            const textNode = link.lastChild;
            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                textNode.textContent = this.currentLanguage === 'fr' ? 'Lire' : 'Read';
            }
        });

        // Update source type names
        document.querySelectorAll('.source-type-name').forEach(nameSpan => {
            const sourceType = nameSpan.dataset.translateSourceType;
            if (sourceType) {
                nameSpan.textContent = this.translateSourceType(sourceType);
            }
        });

        // Update author text
        document.querySelectorAll('.reference-author').forEach(author => {
            const text = author.textContent;
            if (this.currentLanguage === 'en' && text.startsWith('Par ')) {
                author.textContent = text.replace('Par ', 'By ');
            } else if (this.currentLanguage === 'fr' && text.startsWith('By ')) {
                author.textContent = text.replace('By ', 'Par ');
            }
        });
    }

    async loadReferences() {
        this.loading = true;
        try {
            console.log('📚 Fetching references from Knowledge Garden...');
            
            // Fetch enriched references grouped by source type
            const response = await fetch('/api/knowledge-garden/references-by-source-type');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.groupedReferences = await response.json();
            
            console.log(`✅ Loaded enriched references in ${this.groupedReferences.length} source types`);
            
        } catch (error) {
            console.error('❌ Error loading references:', error);
            this.renderError();
        } finally {
            this.loading = false;
        }
    }

    groupBySourceType(references) {
        const grouped = {};
        
        references.forEach(reference => {
            const sourceType = reference.sourceType || 'Article';
            if (!grouped[sourceType]) {
                grouped[sourceType] = [];
            }
            grouped[sourceType].push(reference);
        });
        
        return grouped;
    }

    renderReferences() {
        const container = document.getElementById('references-section');
        if (!container) {
            console.warn('References container not found');
            return;
        }

        if (!this.groupedReferences || this.groupedReferences.length === 0) {
            this.renderEmpty(container);
            return;
        }

        container.innerHTML = this.getReferencesHTML();
        this.attachEventListeners();
    }

    getReferencesHTML() {
        // Sort source types to show Books first, then Articles
        const sortedGroups = [...this.groupedReferences].sort((a, b) => {
            if (a.sourceType === 'Book' && b.sourceType !== 'Book') return -1;
            if (b.sourceType === 'Book' && a.sourceType !== 'Book') return 1;
            return a.sourceType.localeCompare(b.sourceType);
        });
        
        return `
            <div class="references-header">
                <h2 class="references-title" data-translate="references.title">
                    Nos références
                </h2>
                <p class="references-subtitle" data-translate="references.subtitle">
                    Découvrez les livres et articles qui inspirent notre approche de l'investissement intelligent.
                </p>
            </div>
            
            <div class="references-categories">
                ${sortedGroups.map(group => this.getSourceTypeHTML(group)).join('')}
            </div>
        `;
    }

    getSourceTypeHTML(group) {
        const { sourceType, count, references } = group;
        const sourceTypeIcon = this.getSourceTypeIcon(sourceType);
        const translatedSourceType = this.translateSourceType(sourceType);
        
        return `
            <div class="reference-category" data-source-type="${sourceType}">
                <div class="category-header">
                    <h3 class="category-title">
                        <span class="source-type-icon-large">${sourceTypeIcon}</span>
                        <span class="source-type-name" data-translate-source-type="${sourceType}">${translatedSourceType}</span>
                        <span class="category-count">(${count})</span>
                    </h3>
                    <button class="category-toggle" aria-expanded="true">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
                
                <div class="category-content">
                    <div class="references-grid">
                        ${references.map(ref => this.getReferenceHTML(ref)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    getBestAvailableLink(reference) {
        // Manual override for known references while LLM enrichment is being fixed
        const manualLinks = {
            'Ego Is the Enemy': 'https://www.amazon.com/Ego-Enemy-Ryan-Holiday/dp/1591847818',
            'Warren Buffett Accounting Book': 'https://www.amazon.com/Warren-Buffett-Accounting-Book-Stig/dp/1939370159',
            'The dawn of the post-literate society': reference.url, // Keep original for articles
            'The death of corporate job': reference.url, // Keep original for articles  
            'Sam Altman ': 'https://blog.samaltman.com' // Author's blog
        };
        
        // Use manual link if available
        if (manualLinks[reference.title]) {
            return manualLinks[reference.title];
        }
        
        // Prioritize legal purchase links over original URL
        if (reference.legalLinks) {
            // For books: prioritize Amazon, then Google Books, then publisher
            if (reference.sourceType === 'Book') {
                if (reference.legalLinks.amazon) return reference.legalLinks.amazon;
                if (reference.legalLinks.google_books) return reference.legalLinks.google_books;
                if (reference.legalLinks.publisher) return reference.legalLinks.publisher;
                if (reference.legalLinks.worldcat) return reference.legalLinks.worldcat;
            }
            
            // For articles: prioritize DOI, then journal, then publisher
            if (reference.sourceType === 'Article') {
                if (reference.legalLinks.doi_link) return reference.legalLinks.doi_link;
                if (reference.legalLinks.journal) return reference.legalLinks.journal;
                if (reference.legalLinks.publisher) return reference.legalLinks.publisher;
                if (reference.legalLinks.author_page) return reference.legalLinks.author_page;
            }
        }
        
        // Fallback to original URL if no legal links available
        return reference.url || null;
    }

    getReferenceHTML(reference) {
        // Get the best available link (prioritize legal links over original URL)
        const bestLink = this.getBestAvailableLink(reference);
        const hasLink = bestLink && bestLink !== '';
        const sourceTypeIcon = this.getSourceTypeIcon(reference.sourceType);
        
        return `
            <div class="reference-card" data-source-type="${reference.sourceType}">
                <div class="reference-header">
                    <span class="source-type-icon">${sourceTypeIcon}</span>
                    <span class="source-type">${reference.sourceType}</span>
                </div>
                
                <div class="reference-content">
                    ${hasLink ? `<a href="${bestLink}" target="_blank" rel="noopener noreferrer" class="reference-link">` : '<div class="reference-no-link">'}
                        <h4 class="reference-title">${this.sanitizeHTML(reference.title)}</h4>
                    ${hasLink ? '</a>' : '</div>'}
                    
                    ${reference.author && reference.author !== 'Unknown Author' ? 
                        `<p class="reference-author">${this.currentLanguage === 'fr' ? 'Par' : 'By'} ${this.sanitizeHTML(reference.author)}</p>` : 
                        ''
                    }
                    
                    ${reference.summary ? 
                        `<p class="reference-summary">${this.sanitizeHTML(reference.summary)}</p>` : 
                        ''
                    }
                    
                    ${this.getHashtagsHTML(reference)}
                </div>
                
                ${hasLink ? `
                    <div class="reference-footer">
                        <a href="${bestLink}" target="_blank" rel="noopener noreferrer" class="reference-link-indicator">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <path d="M8.5 1.5L15 8L8.5 14.5M14.5 8H1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            ${this.currentLanguage === 'fr' ? 'Lire' : 'Read'}
                        </a>
                    </div>
                ` : ''}
            </div>
        `;
    }

    getHashtagsHTML(reference) {
        const allTags = [];
        
        // Add categories as hashtags
        if (reference.category && reference.category.length > 0) {
            allTags.push(...reference.category.map(cat => `#${cat.replace(/\s+/g, '')}`));
        }
        
        // Add main theme as hashtag if different from categories
        if (reference.mainTheme && reference.mainTheme !== 'General') {
            const themeTag = `#${reference.mainTheme.replace(/\s+/g, '')}`;
            if (!allTags.includes(themeTag)) {
                allTags.push(themeTag);
            }
        }
        
        // Add selected topics as hashtags (limit to 3 most relevant)
        if (reference.topics && reference.topics.length > 0) {
            const topicTags = reference.topics
                .slice(0, 3)
                .map(topic => `#${topic.replace(/\s+/g, '').replace(/[()]/g, '')}`);
            allTags.push(...topicTags);
        }
        
        if (allTags.length === 0) return '';
        
        return `
            <div class="reference-hashtags">
                ${allTags.slice(0, 6).map(tag => 
                    `<span class="hashtag">${this.sanitizeHTML(tag)}</span>`
                ).join('')}
                ${allTags.length > 6 ? `<span class="hashtag-more">+${allTags.length - 6}</span>` : ''}
            </div>
        `;
    }

    translateSourceType(sourceType) {
        if (this.currentLanguage === 'fr') {
            const frenchTranslations = {
                'Book': 'Livres',
                'Article': 'Articles',
                'Research': 'Recherches',
                'Report': 'Rapports',
                'Video': 'Vidéos',
                'Podcast': 'Podcasts'
            };
            return frenchTranslations[sourceType] || sourceType;
        }
        
        // English - make plural for section headers
        const englishPlurals = {
            'Book': 'Books',
            'Article': 'Articles',
            'Research': 'Research',
            'Report': 'Reports',
            'Video': 'Videos',
            'Podcast': 'Podcasts'
        };
        return englishPlurals[sourceType] || sourceType;
    }

    getCategoryClass(category) {
        const categoryClasses = {
            'Value Investing': 'category-value-investing',
            'Behavioral Finance': 'category-behavioral',
            'Asset Management': 'category-asset-management',
            'Financial Analysis': 'category-analysis',
            'Market Theory': 'category-market-theory',
            'Risk Management': 'category-risk',
            'Economics': 'category-economics',
            'Strategy': 'category-strategy',
            'General': 'category-general'
        };
        return categoryClasses[category] || 'category-general';
    }

    getSourceTypeIcon(sourceType) {
        const icons = {
            'Book': this.getBookSVG(),
            'Article': this.getArticleSVG(),
            'Research': '🔬',
            'Report': '📊',
            'Video': this.getVideoSVG(),
            'Podcast': '🎧'
        };
        return icons[sourceType] || this.getArticleSVG();
    }

    getBookSVG() {
        return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 64 64" class="source-icon">
            <g><g><path d="M20.609,31.985v7.78l-3-4.08l-3,2.83v-7.601c0-0.93,0.33-1.84,0.93-2.55l5.88,1.22C20.899,30.275,20.609,31.115,20.609,31.985z"/></g></g>
            <path d="M33.64,14.505l-23.331,9.93v0.01c0.61-0.26,1.31-0.35,2.01-0.2l22.611,4.7l21.32-9.74L33.64,14.505z M30.723,19.009l3.226-1.373l12.725,2.646l-3.075,1.403L30.723,19.009z"/>
            <g><g><path d="M34.929,36.841c-0.067,0-0.136-0.007-0.204-0.021L20.41,33.846c-0.541-0.112-0.888-0.643-0.775-1.183c0.112-0.541,0.639-0.891,1.183-0.775l14.313,2.974c0.541,0.112,0.889,0.643,0.776,1.183C35.809,36.517,35.393,36.841,34.929,36.841z"/></g></g>
            <g><g><path d="M14.615,32.619c-0.067,0-0.136-0.007-0.205-0.021l-3.674-0.764c-0.541-0.113-0.888-0.643-0.775-1.184s0.639-0.889,1.183-0.775l3.674,0.764c0.541,0.113,0.888,0.643,0.775,1.184C15.495,32.295,15.079,32.619,14.615,32.619z"/></g></g>
            <g><g><path d="M34.929,50.642c-0.38,0-0.743-0.217-0.911-0.585c-0.229-0.502-0.008-1.096,0.495-1.325l21.322-9.732c0.503-0.228,1.096-0.008,1.325,0.495c0.229,0.502,0.008,1.096-0.495,1.325l-21.322,9.732C35.208,50.612,35.067,50.642,34.929,50.642z"/></g></g>
            <g><g><path d="M34.929,43.741c-0.38,0-0.743-0.217-0.911-0.585c-0.229-0.502-0.008-1.096,0.495-1.325l21.322-9.732c0.503-0.231,1.096-0.008,1.325,0.495c0.229,0.502,0.008,1.096-0.495,1.325l-21.322,9.732C35.208,43.712,35.067,43.741,34.929,43.741z"/></g></g>
            <g><g><path d="M34.929,36.841c-0.38,0-0.743-0.217-0.911-0.585c-0.229-0.502-0.008-1.096,0.495-1.325l21.322-9.731c0.503-0.23,1.096-0.008,1.325,0.494c0.229,0.503,0.008,1.096-0.495,1.325l-21.322,9.732C35.208,36.812,35.067,36.841,34.929,36.841z"/></g></g>
            <g><g><path d="M10.94,45.656c-0.067,0-0.136-0.007-0.205-0.021c-2.363-0.492-3.887-2.814-3.395-5.178c0.238-1.146,0.907-2.129,1.885-2.77c0.978-0.642,2.147-0.86,3.292-0.626c0.541,0.113,0.888,0.643,0.775,1.183c-0.113,0.541-0.642,0.884-1.183,0.776c-0.62-0.13-1.256-0.009-1.788,0.339c-0.531,0.349-0.895,0.883-1.024,1.504c-0.267,1.284,0.561,2.546,1.844,2.813c0.541,0.113,0.888,0.643,0.775,1.183C11.82,45.332,11.404,45.656,10.94,45.656z"/></g></g>
        </svg>`;
    }

    getArticleSVG() {
        return `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 100 100" class="source-icon">
            <path d="m78.125 6.25h-44.359c-3.4531 0-6.25 2.7969-6.25 6.25v63.609c0 1.6562 0.66016 3.2461 1.832 4.418s2.7617 1.832 4.418 1.832h44.359c1.6562 0 3.2461-0.66016 4.418-1.832s1.832-2.7617 1.832-4.418v-63.609c0-1.6562-0.66016-3.2461-1.832-4.418s-2.7617-1.832-4.418-1.832zm-1.1406 69.359h-42.078c-0.86328 0-1.5625-0.69922-1.5625-1.5625s0.69922-1.5625 1.5625-1.5625h42.094c0.86328 0 1.5625 0.69922 1.5625 1.5625s-0.69922 1.5625-1.5625 1.5625zm0.98438-42h-14.328c-0.86328 0-1.5625-0.69922-1.5625-1.5625s0.69922-1.5625 1.5625-1.5625h14.344c0.86328 0 1.5625 0.69922 1.5625 1.5625s-0.69922 1.5625-1.5625 1.5625zm1.5625 8.5469c0 0.41406-0.16406 0.8125-0.45703 1.1055s-0.69141 0.45703-1.1055 0.45703h-14.328c-0.86328 0-1.5625-0.69922-1.5625-1.5625s0.69922-1.5625 1.5625-1.5625h14.344c0.41797 0 0.82031 0.16797 1.1172 0.46875 0.29297 0.30078 0.45313 0.70703 0.44531 1.125zm-19.188-25.109v18.891c0 2.5898-2.0977 4.6875-4.6875 4.6875h-16.75c-2.5898 0-4.6875-2.0977-4.6875-4.6875v-18.891c0-2.5898 2.0977-4.6875 4.6875-4.6875h16.75c2.5898 0 4.6875 2.0977 4.6875 4.6875zm-25.438 32.812h42.094c0.86328 0 1.5625 0.69922 1.5625 1.5625s-0.69922 1.5625-1.5625 1.5625h-42.094c-0.86328 0-1.5625-0.69922-1.5625-1.5625s0.69922-1.5625 1.5625-1.5625zm43.656 12.875c0 0.41406-0.16406 0.8125-0.45703 1.1055-0.29297 0.29297-0.69141 0.45703-1.1055 0.45703h-42.094c-0.86328 0-1.5625-0.69922-1.5625-1.5625s0.69922-1.5625 1.5625-1.5625h42.094c0.41406 0 0.8125 0.16406 1.1055 0.45703 0.29297 0.29297 0.45703 0.69141 0.45703 1.1055zm-0.57812-39.297h-14.344c-0.86328 0-1.5625-0.69922-1.5625-1.5625s0.69922-1.5625 1.5625-1.5625h14.344c0.86328 0 1.5625 0.69922 1.5625 1.5625s-0.69922 1.5625-1.5625 1.5625z"/>
            <path d="m76.281 85.078h-50.266c-1.7266 0-3.125-1.3984-3.125-3.125v-69.156c0-0.86328-0.69922-1.5625-1.5625-1.5625s-1.5625 0.69922-1.5625 1.5625v69.156c0 1.6562 0.66016 3.2461 1.832 4.418s2.7617 1.832 4.418 1.832h50.266c0.86328 0 1.5625-0.69922 1.5625-1.5625s-0.69922-1.5625-1.5625-1.5625z"/>
            <path d="m68.75 90.625h-50.266c-1.7266 0-3.125-1.3984-3.125-3.125v-69.156c0-0.86328-0.69922-1.5625-1.5625-1.5625s-1.5625 0.69922-1.5625 1.5625v69.156c0 1.6562 0.66016 3.2461 1.832 4.418s2.7617 1.832 4.418 1.832h50.266c0.86328 0 1.5625-0.69922 1.5625-1.5625s-0.69922-1.5625-1.5625-1.5625z"/>
            <path d="m38.906 15.484c-0.86328 0-1.5625 0.69922-1.5625 1.5625v18.891c0 0.41406 0.16406 0.8125 0.45703 1.1055s0.69141 0.45703 1.1055 0.45703h16.75c0.41406 0 0.8125-0.16406 1.1055-0.45703s0.45703-0.69141 0.45703-1.1055v-18.891c0-0.41406-0.16406-0.8125-0.45703-1.1055-0.29297-0.29297-0.69141-0.45703-1.1055-0.45703z"/>
        </svg>`;
    }

    getVideoSVG() {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="source-icon">
            <path d="M8.3,14.8h83.4c4.6,0,8.3,3.7,8.3,8.3v53.8c0,4.6-3.7,8.3-8.3,8.3H8.3C3.7,85.2,0,81.5,0,76.9V23.1C0,18.5,3.7,14.8,8.3,14.8z M57,52.7l-11.5,7.1c-2.3,1.5-4.2,0.4-4.2-2.3V42.5c0-2.8,1.9-3.8,4.2-2.3L57,47.3C59.3,48.8,59.3,51.2,57,52.7z"/>
        </svg>`;
    }

    translateCategory(category) {
        if (this.currentLanguage === 'en') {
            return category; // English categories are already in English
        }
        
        const frenchTranslations = {
            'Value Investing': 'Investissement de valeur',
            'Behavioral Finance': 'Finance comportementale',
            'Asset Management': 'Gestion d\'actifs',
            'Financial Analysis': 'Analyse financière',
            'Market Theory': 'Théorie des marchés',
            'Risk Management': 'Gestion des risques',
            'Economics': 'Économie',
            'Strategy': 'Stratégie',
            'General': 'Général'
        };
        return frenchTranslations[category] || category;
    }

    attachEventListeners() {
        // Category toggle functionality
        document.querySelectorAll('.category-toggle').forEach(button => {
            button.addEventListener('click', (e) => {
                const categoryDiv = e.target.closest('.reference-category');
                const content = categoryDiv.querySelector('.category-content');
                const isExpanded = button.getAttribute('aria-expanded') === 'true';
                
                button.setAttribute('aria-expanded', !isExpanded);
                categoryDiv.classList.toggle('collapsed', isExpanded);
                
                if (isExpanded) {
                    content.style.maxHeight = '0px';
                } else {
                    content.style.maxHeight = content.scrollHeight + 'px';
                }
            });
        });

        // Track reference clicks for analytics
        document.querySelectorAll('.reference-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const referenceCard = e.target.closest('.reference-card');
                const title = referenceCard.querySelector('.reference-title').textContent;
                console.log('📖 Reference clicked:', title);
                
                // Add analytics tracking here if needed
                // trackEvent('reference_click', { title, category, source_type });
            });
        });
    }

    renderLoading() {
        const container = document.getElementById('references-section');
        if (!container) return;

        const texts = this.currentLanguage === 'fr'
            ? {
                title: 'Nos références',
                subtitle: 'Découvrez les livres et articles qui inspirent notre approche de l\'investissement intelligent.',
                loading: 'Chargement des références...'
              }
            : {
                title: 'Our References',
                subtitle: 'Discover the books and articles that inspire our intelligent investment approach.',
                loading: 'Loading references...'
              };

        container.innerHTML = `
            <div class="references-header">
                <h2 class="references-title">${texts.title}</h2>
                <p class="references-subtitle">${texts.subtitle}</p>
            </div>
            <div class="references-loading">
                <div class="loading-spinner">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <p class="loading-text">${texts.loading}</p>
            </div>
        `;
    }

    renderError() {
        const container = document.getElementById('references-section');
        if (!container) return;

        const texts = this.currentLanguage === 'fr'
            ? {
                title: 'Erreur de chargement',
                message: 'Impossible de charger les références pour le moment.',
                retry: 'Réessayer'
              }
            : {
                title: 'Loading Error',
                message: 'Unable to load references at the moment.',
                retry: 'Retry'
              };

        container.innerHTML = `
            <div class="references-error">
                <div class="error-icon">⚠️</div>
                <h3>${texts.title}</h3>
                <p>${texts.message}</p>
                <button class="retry-button" onclick="window.referencesComponent.init()">
                    ${texts.retry}
                </button>
            </div>
        `;
    }

    renderEmpty(container) {
        const texts = this.currentLanguage === 'fr' 
            ? {
                title: 'Aucune référence disponible',
                message: 'Les références sont en cours de préparation.'
              }
            : {
                title: 'No references available',
                message: 'References are being prepared.'
              };

        container.innerHTML = `
            <div class="references-empty">
                <div class="empty-icon">📚</div>
                <h3>${texts.title}</h3>
                <p>${texts.message}</p>
            </div>
        `;
    }

    sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Initialize when DOM is loaded - with delay to ensure main script language setup is complete
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('references-section')) {
        // Small delay to ensure main script has set up the language
        setTimeout(() => {
            window.referencesComponent = new ReferencesComponent();
            window.referencesComponent.init();
        }, 100);
    }
});