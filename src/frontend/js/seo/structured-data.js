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
    fr: "Contenu gratuit sur l'investissement et l'IA (blog, tutoriels, ressources open-source) + consulting IA sur mesure pour professionnels (CGP, gestion d'actifs, PME). Expertise finance & tech, build in public.",
    en: "Free content on AI and investing (blog, tutorials, open-source resources) + custom AI consulting for professionals (wealth advisors, asset managers, SMEs). Finance & tech expertise, building in public.",
  };

  return {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    "@id": `${SITE_URL}#financial-service`,
    "name": "Bubble Invest",
    "alternateName": lang === "en" ? "Bubble — AI & Finance Content + Consulting" : "Bubble — Contenu IA & Finance + Consulting",
    "description": descriptions[lang] || descriptions.fr,
    "url": SITE_URL,
    "logo": ASSET_LOGO,
    "image": ASSET_LOGO,
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
  };
}

// Organization Schema - Company information
function createOrganizationSchema(lang = "fr") {
  const descriptions = {
    fr: "Contenu gratuit IA & finance (blog, tutoriels, open-source) + consulting IA sur mesure pour professionnels. Build in public depuis 2024.",
    en: "Free AI & finance content (blog, tutorials, open-source) + custom AI consulting for professionals. Building in public since 2024.",
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
        question: "Qu'est-ce que Bubble propose gratuitement ?",
        answer:
          "Bubble partage gratuitement du contenu éducatif sur l'investissement et l'IA : blog, tutoriels, guides sur les agents IA (Claude Code, Open Claw), code open-source, et une newsletter hebdomadaire. Tout est partagé en build in public.",
      },
      {
        question: "Comment fonctionne le consulting IA de Bubble ?",
        answer:
          "Nous accompagnons les professionnels (CGP, gestionnaires d'actifs, PME) dans le déploiement d'agents IA et l'automatisation de workflows. Notre avantage : systematic early adopters — nous maîtrisons les outils IA des semaines avant le marché.",
      },
      {
        question: "Qu'est-ce que l'agent d'investissement Bubble ?",
        answer:
          "C'est un proof of concept personnel que nous partageons ouvertement pour montrer notre expertise. Il automatise notre propre portefeuille — nous partageons l'architecture, les résultats et les limites en toute transparence. Ce n'est PAS un produit commercial.",
      },
      {
        question: "À qui s'adresse le consulting IA de Bubble ?",
        answer:
          "Aux conseillers en gestion de patrimoine (CGP), sociétés de gestion d'actifs, PME et indépendants tech-forward qui veulent déployer des agents IA et automatiser leurs processus métier.",
      },
    ],
    en: [
      {
        question: "What does Bubble offer for free?",
        answer:
          "Bubble freely shares educational content on investing and AI: blog, tutorials, AI agent guides (Claude Code, Open Claw), open-source code, and a weekly newsletter. Everything is shared in a build-in-public approach.",
      },
      {
        question: "How does Bubble's AI consulting work?",
        answer:
          "We help professionals (wealth advisors, asset managers, SMEs) deploy AI agents and automate workflows. Our edge: systematic early adopters — we master AI tools weeks before the market.",
      },
      {
        question: "What is the Bubble investment agent?",
        answer:
          "It's a personal proof of concept we share openly to demonstrate our expertise. It automates our own portfolio — we share the architecture, results, and limitations transparently. It is NOT a commercial product.",
      },
      {
        question: "Who is Bubble's AI consulting for?",
        answer:
          "Wealth advisors, asset management firms, SMEs, and tech-forward independents who want to deploy AI agents and automate their business processes.",
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

// WebSite Schema - For enhanced search appearance
function createWebSiteSchema(lang = "fr") {
  const descriptions = {
    fr: "Blog, tutoriels et ressources gratuites sur l'IA et la finance. Consulting IA sur mesure pour professionnels.",
    en: "Blog, tutorials, and free resources on AI and finance. Custom AI consulting for professionals.",
  };

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Bubble",
    "alternateName": "Bubble Invest",
    "url": SITE_URL,
    "description": descriptions[lang] || descriptions.fr,
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
    // Homepage: Financial Service + Organization + FAQ + WebSite
    injectStructuredData([
      createFinancialServiceSchema(lang),
      createOrganizationSchema(lang),
      createFaqSchema(lang),
      createWebSiteSchema(lang)
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
    createWebSiteSchema
  };
}
