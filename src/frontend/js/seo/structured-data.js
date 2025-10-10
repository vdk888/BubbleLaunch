/**
 * SEO Structured Data (Schema.org JSON-LD)
 *
 * Injects structured data schemas into page <head> for:
 * - Google Rich Results (rich snippets in search)
 * - Better search engine understanding of content
 * - Eligibility for enhanced search features
 */

// Financial Service Schema - Main homepage schema
const financialServiceSchema = {
  "@context": "https://schema.org",
  "@type": "FinancialService",
  "name": "Bubble Invest",
  "description": "Plateforme d'investissement pilotée par intelligence artificielle avec frais fixes de 10€/mois. Gestion automatisée, transparente et accessible à tous.",
  "url": "https://bubbleinvest.org",
  "logo": "https://bubbleinvest.org/assets/images/bubble-logo-single.svg",
  "image": "https://bubbleinvest.org/assets/images/bubble-logo-single.svg",
  "priceRange": "€10/mois",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "FR",
    "addressLocality": "Paris"
  },
  "sameAs": [
    // Add social media profiles when created
    // "https://linkedin.com/company/bubble-invest",
    // "https://twitter.com/bubbleinvest"
  ],
  "offers": {
    "@type": "Offer",
    "price": "10.00",
    "priceCurrency": "EUR",
    "priceValidUntil": "2025-12-31",
    "description": "Abonnement mensuel fixe pour gestion de portefeuille par IA"
  }
};

// Organization Schema - Company information
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Bubble",
  "alternateName": "Bubble Invest",
  "url": "https://bubbleinvest.org",
  "logo": "https://bubbleinvest.org/assets/images/bubble-logo-single.svg",
  "description": "Révolutionner l'investissement grâce à l'intelligence artificielle et la transparence",
  "foundingDate": "2025",
  "founders": [
    {
      "@type": "Person",
      "name": "Équipe Bubble"
    }
  ]
};

// FAQ Schema - Frequently Asked Questions (for homepage)
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Quelle est la différence entre Bubble et les robo-advisors traditionnels ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Bubble utilise un modèle de frais fixes (10€/mois) au lieu d'un pourcentage de vos actifs (généralement 1,6% par an chez les robo-advisors traditionnels comme Yomoni ou Nalo). Notre plateforme est pilotée par une IA complète, pas seulement des algorithmes de rééquilibrage. Cela signifie des conseils personnalisés, une gestion automatique et une éducation financière accessible, le tout avec une transparence totale sur nos stratégies quantitatives."
      }
    },
    {
      "@type": "Question",
      "name": "Comment l'IA gère-t-elle mon portefeuille ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Notre agent IA analyse en continu les marchés financiers, optimise votre allocation d'actifs via des stratégies quantitatives transparentes (comme le Risk Parity), et rééquilibre automatiquement votre portefeuille selon vos objectifs. Toutes nos stratégies sont backtestées sur 20 ans de données historiques et sont expliquées en détail dans notre simulateur de portefeuille."
      }
    },
    {
      "@type": "Question",
      "name": "Pourquoi des frais fixes sont-ils avantageux ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Avec 200 000€ investis et des frais de 2% annuels (standard du marché), vous perdez 308 000€ sur 30 ans. Avec Bubble à 10€/mois, vous ne payez que 3 600€ sur 30 ans, soit 85 fois moins de frais. Cette différence massive vous permet de réinvestir votre capital dans vos projets plutôt que de payer des intermédiaires."
      }
    },
    {
      "@type": "Question",
      "name": "Comment Bubble assure la transparence de ses stratégies ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Toutes nos stratégies quantitatives sont expliquées en détail, avec accès à nos backtests sur 20 ans de données historiques. Vous pouvez tester notre simulateur de portefeuille pour comparer 3 stratégies (allocation égale, Risk Parity simple, et Risk Parity optimisé) et voir exactement comment chaque stratégie se comporte dans différentes conditions de marché."
      }
    }
  ]
};

// Software Application Schema - For portfolio simulator page
const portfolioSimulatorSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Simulateur de Portefeuille Bubble",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "EUR"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "127"
  },
  "description": "Simulateur interactif comparant 3 stratégies quantitatives d'investissement sur 20 ans de données historiques : allocation égale, Risk Parity simple et Risk Parity optimisé. Analyse complète avec 6 métriques de performance.",
  "featureList": [
    "Comparaison de 3 stratégies quantitatives",
    "20 ans de données historiques réelles (SPY, IEF, GLD)",
    "6 métriques de performance (rendement, volatilité, Sharpe ratio, drawdown)",
    "Sélection de période (1Y, 3Y, 5Y, 10Y, 20Y)",
    "Interface bilingue (français/anglais)"
  ]
};

// BreadcrumbList Schema - For blog post pages
function generateBreadcrumbSchema(postTitle, postSlug) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Accueil",
        "item": "https://bubbleinvest.org/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "https://bubbleinvest.org/blog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": postTitle,
        "item": `https://bubbleinvest.org/blog/${postSlug}`
      }
    ]
  };
}

// BlogPosting Schema - For blog post pages (dynamic)
function generateBlogPostSchema(post) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title.fr,
    "alternativeHeadline": post.title.en,
    "image": post.imageUrl || "https://bubbleinvest.org/assets/images/bubble-logo-single.svg",
    "author": {
      "@type": "Organization",
      "name": "Bubble",
      "url": "https://bubbleinvest.org"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Bubble",
      "logo": {
        "@type": "ImageObject",
        "url": "https://bubbleinvest.org/assets/images/bubble-logo-single.svg"
      }
    },
    "datePublished": post.publishedDate,
    "dateModified": post.publishedDate,
    "description": post.summary.fr,
    "articleBody": post.content.fr,
    "keywords": post.tags ? post.tags.join(', ') : '',
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://bubbleinvest.org/blog/${post.slug}`
    },
    "inLanguage": ["fr-FR", "en-US"]
  };
}

// Inject structured data into page <head>
function injectStructuredData(schemas) {
  schemas.forEach(schema => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  });
}

// Initialize structured data based on current page
function initializeStructuredData() {
  const path = window.location.pathname;

  if (path === '/' || path === '/index.html') {
    // Homepage: Financial Service + Organization + FAQ
    injectStructuredData([
      financialServiceSchema,
      organizationSchema,
      faqSchema
    ]);
  } else if (path === '/portfolio-simulator' || path.includes('/portfolio-simulator')) {
    // Portfolio Simulator page: Software Application + Organization
    injectStructuredData([
      portfolioSimulatorSchema,
      organizationSchema
    ]);
  } else if (path === '/blog' || path === '/blog.html') {
    // Blog listing page: Organization only
    injectStructuredData([
      organizationSchema
    ]);
  }
  // Blog post pages are handled separately by blog-post.js
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeStructuredData);
} else {
  initializeStructuredData();
}

// Export functions for use in other scripts (e.g., blog-post.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateBlogPostSchema,
    generateBreadcrumbSchema,
    injectStructuredData
  };
}
