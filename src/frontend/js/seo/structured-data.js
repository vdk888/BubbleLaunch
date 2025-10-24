/**
 * SEO Structured Data (Schema.org JSON-LD)
 *
 * Injects structured data schemas into page <head> for:
 * - Google Rich Results (rich snippets in search)
 * - Better search engine understanding of content
 * - Eligibility for enhanced search features
 */

const SITE_URL = "https://bubbleinvest.org";
const ASSET_LOGO = `${SITE_URL}/assets/images/bubble-logo-single.svg`;

const LOCALES = {
  fr: {
    code: "fr",
    locale: "fr-FR",
    pathPrefix: "",
    homeLabel: "Accueil",
    blogLabel: "Blog",
  },
  en: {
    code: "en",
    locale: "en-US",
    pathPrefix: "/en",
    homeLabel: "Home",
    blogLabel: "Blog",
  },
};

function createFinancialServiceSchema(lang = "fr") {
  const locale = LOCALES[lang] || LOCALES.fr;
  const descriptions = {
    fr: "Plateforme d'investissement pilotée par IA avec frais fixes de 10€/mois. Gestion automatisée, transparente et accessible.",
    en: "AI-powered investment platform from France with a transparent €10/month subscription. Automated, discreet, and built for modern investors.",
  };
  const offerDescriptions = {
    fr: "Abonnement mensuel fixe pour gestion de portefeuille par IA.",
    en: "Flat monthly subscription for AI-managed portfolios.",
  };

  return {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    "@id": `${SITE_URL}#financial-service`,
    "name": "Bubble Invest",
    "alternateName": lang === "en" ? "Bubble AI Investment Platform" : "Bubble Invest",
    "description": descriptions[lang] || descriptions.fr,
    "url": SITE_URL,
    "logo": ASSET_LOGO,
    "image": ASSET_LOGO,
    "priceRange": "€10/mois",
    "inLanguage": [locale.locale],
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "FR",
      "addressLocality": "Paris",
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
      "description": offerDescriptions[lang] || offerDescriptions.fr,
    },
  };
}

// Organization Schema - Company information
function createOrganizationSchema(lang = "fr") {
  const descriptions = {
    fr: "Révolutionner l'investissement grâce à l'intelligence artificielle et la transparence.",
    en: "Reinventing investing with a discreet, transparent AI platform built in France.",
  };

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}#organization`,
    "name": "Bubble",
    "alternateName": "Bubble Invest",
    "url": SITE_URL,
    "logo": ASSET_LOGO,
    "description": descriptions[lang] || descriptions.fr,
    "foundingDate": "2025",
    "founders": [
      {
        "@type": "Person",
        "name": "Équipe Bubble",
      },
    ],
  };
}

// FAQ Schema - Frequently Asked Questions (for homepage)
function createFaqSchema(lang = "fr") {
  const faqContent = {
    fr: [
      {
        question: "Quelle est la différence entre Bubble et les robo-advisors traditionnels ?",
        answer:
          "Bubble utilise un modèle de frais fixes (10€/mois) plutôt qu'un pourcentage de vos actifs (1,6 % par an en moyenne chez Yomoni ou Nalo). L'IA gère votre portefeuille de bout en bout, avec des conseils personnalisés, une transparence totale et une pédagogie continue.",
      },
      {
        question: "Comment l'IA gère-t-elle mon portefeuille ?",
        answer:
          "Notre agent IA analyse en continu les marchés, optimise l'allocation via des stratégies quantitatives transparentes (Risk Parity, égal pondération optimisée) et rééquilibre automatiquement selon vos objectifs. Toutes les stratégies sont backtestées sur 20 ans de données.",
      },
      {
        question: "Pourquoi des frais fixes sont-ils avantageux ?",
        answer:
          "À 200 000€ investis, des frais annuels de 2 % coûtent 308 000€ sur 30 ans. Avec Bubble (10€/mois), le coût tombe à 3 600€ sur la même période. Vous conservez votre capital pour vos projets plutôt que de payer des intermédiaires.",
      },
      {
        question: "Comment Bubble assure la transparence de ses stratégies ?",
        answer:
          "Chaque stratégie est documentée et testée sur 20 ans de données. Le simulateur permet de comparer trois approches et de comprendre le comportement du portefeuille selon les conditions de marché.",
      },
    ],
    en: [
      {
        question: "How is Bubble different from traditional robo-advisors?",
        answer:
          "Bubble charges a flat €10/month instead of 1.6% of assets under management. Our full-stack AI agent delivers personalised advice, automated execution, and transparent quantitative strategies—without the usual opacity.",
      },
      {
        question: "How does the AI manage my portfolio?",
        answer:
          "Bubble's agent continuously analyses markets, optimises allocation via transparent quantitative strategies (risk parity, optimised equal weight), and rebalances automatically. Every strategy is backtested on 20 years of data.",
      },
      {
        question: "Why are fixed fees more efficient?",
        answer:
          "Investing €200k with 2% yearly fees costs €308k over 30 years. Bubble's €10/month plan costs €3,600 over the same period, keeping capital on your side for projects and compounding.",
      },
      {
        question: "How transparent are Bubble's strategies?",
        answer:
          "All strategies are documented, backtested, and accessible in the portfolio simulator so you can compare three approaches and understand performance in different market regimes.",
      },
    ],
  };

  const content = faqContent[lang] || faqContent.fr;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "inLanguage": [LOCALES[lang]?.locale || LOCALES.fr.locale],
    "mainEntity": content.map(({ question, answer }) => ({
      "@type": "Question",
      "name": question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": answer,
      },
    })),
  };
}

// Software Application Schema - For portfolio simulator page
function createPortfolioSimulatorSchema(lang = "fr") {
  const descriptions = {
    fr: "Simulateur interactif comparant 3 stratégies quantitatives d'investissement sur 20 ans de données historiques : allocation égale, Risk Parity simple et Risk Parity optimisé. Analyse avec 6 métriques de performance.",
    en: "Interactive AI portfolio simulator comparing three quantitative strategies on 20 years of historical ETF data. Includes six performance metrics and bilingual interface.",
  };

  const featureLists = {
    fr: [
      "Comparaison de 3 stratégies quantitatives",
      "20 ans de données historiques réelles (SPY, IEF, GLD)",
      "6 métriques de performance (rendement, volatilité, Sharpe ratio, drawdown)",
      "Sélection de période (1Y, 3Y, 5Y, 10Y, 20Y)",
      "Interface bilingue (français/anglais)",
    ],
    en: [
      "Compare three quantitative strategies side by side",
      "20 years of historical ETF data (SPY, IEF, GLD)",
      "Six performance metrics (return, volatility, Sharpe ratio, drawdown)",
      "Flexible time horizons (1Y, 3Y, 5Y, 10Y, 20Y)",
      "Bilingual interface (French/English)",
    ],
  };

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": lang === "en" ? "Bubble AI Portfolio Simulator" : "Simulateur de Portefeuille Bubble",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "EUR",
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "127",
    },
    "description": descriptions[lang] || descriptions.fr,
    "featureList": featureLists[lang] || featureLists.fr,
    "inLanguage": [LOCALES[lang]?.locale || LOCALES.fr.locale],
  };
}

// BreadcrumbList Schema - For blog post pages
function generateBreadcrumbSchema(postTitle, postSlug, lang = "fr") {
  const locale = LOCALES[lang] || LOCALES.fr;
  const prefix = locale.pathPrefix;
  const homeUrl = `${SITE_URL}${locale.pathPrefix || ""}/`.replace(/\/+$/, "/");
  const blogUrl = `${SITE_URL}${prefix}/blog`.replace(/\/+$/, "");
  const postUrl = `${blogUrl}/${postSlug}`;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": locale.homeLabel,
        "item": homeUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": locale.blogLabel,
        "item": blogUrl
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": postTitle,
        "item": postUrl
      }
    ]
  };
}

// BlogPosting Schema - For blog post pages (dynamic)
function generateBlogPostSchema(post, lang = "fr") {
  const locale = LOCALES[lang] || LOCALES.fr;
  const title = post.title?.[lang] || post.title?.fr || post.title;
  const summary = post.summary?.[lang] || post.summary?.fr || "";
  const content = post.content?.[lang] || post.content?.fr || "";
  const slug = post.slug;
  const mainUrl = `${SITE_URL}${locale.pathPrefix}/blog/${slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${mainUrl}#post`,
    "headline": title,
    "alternativeHeadline": post.title?.en || post.title?.fr || post.title,
    "image": post.imageUrl || ASSET_LOGO,
    "author": {
      "@type": "Organization",
      "name": "Bubble",
      "url": SITE_URL
    },
    "publisher": {
      "@type": "Organization",
      "name": "Bubble",
      "logo": {
        "@type": "ImageObject",
        "url": ASSET_LOGO
      }
    },
    "datePublished": post.publishedDate,
    "dateModified": post.publishedDate,
    "description": summary,
    "articleBody": content,
    "keywords": post.tags ? post.tags.join(', ') : '',
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": mainUrl
    },
    "inLanguage": [locale.locale]
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
  let path = window.location.pathname;
  const isEnglishRoute =
    path === "/en" || path === "/en/" || path.startsWith("/en/");
  const lang = isEnglishRoute ? "en" : "fr";

  if (isEnglishRoute) {
    path = path.replace("/en", "") || "/";
  }

  if (path === '/' || path === '/index.html') {
    // Homepage: Financial Service + Organization + FAQ
    injectStructuredData([
      createFinancialServiceSchema(lang),
      createOrganizationSchema(lang),
      createFaqSchema(lang)
    ]);
  } else if (path === '/portfolio-simulator' || path.includes('/portfolio-simulator')) {
    // Portfolio Simulator page: Software Application + Organization
    injectStructuredData([
      createPortfolioSimulatorSchema(lang),
      createOrganizationSchema(lang)
    ]);
  } else if (path === '/blog' || path === '/blog.html') {
    // Blog listing page: Organization only
    injectStructuredData([
      createOrganizationSchema(lang)
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
    injectStructuredData,
    createFinancialServiceSchema,
    createOrganizationSchema,
    createFaqSchema,
    createPortfolioSimulatorSchema
  };
}
