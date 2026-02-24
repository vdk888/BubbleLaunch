# Plan de Migration SEO & Archivage - Bubble Invest Website

## 📋 Vue d'ensemble

Ce document décrit la stratégie de migration SEO pour le refactoring majeur du site Bubble Invest, incluant le renommage "Investisseurs" → "Particuliers" et l'archivage des pages legacy.

---

## 🗂️ Structure des Pages

### ✅ Pages Mock (Nouvelles - À valider)

| Page FR | URL | Page EN | URL |
|---------|-----|---------|-----|
| Homepage V4 | `/homepage-mock-v4` | Homepage EN | `/homepage-mock-v4-en` |
| Particuliers | `/particuliers-mock` | Individuals | `/individuals-mock-en` |
| Professionnels | `/professionnels-mock` | Professionals | `/professionals-mock-en` |
| À Propos | `/a-propos-mock` | About | `/about-mock-en` |
| Blog | `/blog-mock` | Blog EN | `/blog-mock-en` |

### 📦 Pages Legacy (À archiver)

#### Pages à remplacer complètement:

| Page Legacy | URL Legacy | Remplacée par | Action SEO |
|-------------|------------|---------------|------------|
| Homepage (old) | `/` → `index.html` | `/homepage-mock-v4` | 301 redirect |
| Investors FR | `/investors` | `/particuliers-mock` | 301 redirect |
| Investors EN | `/en/investors` | `/individuals-mock-en` | 301 redirect |
| Professionals FR | `/professionals` | `/professionnels-mock` | 301 redirect |
| Professionals EN | `/en/professionals` | `/professionnels-mock` | 301 redirect |
| About FR | `/about` | `/a-propos-mock` | 301 redirect |
| About EN | `/en/about` | `/about-mock-en` | 301 redirect |
| Blog FR | `/blog` | `/blog-mock` | 301 redirect |
| Blog EN | `/en/blog` | `/blog-mock-en` | 301 redirect |

#### Pages à archiver (noindex + redirect):

| Page | URL | Raison | Action |
|------|-----|--------|--------|
| Portfolio Simulator FR | `/portfolio-simulator` | Remplacé par Playground | 301 → `/particuliers-mock#playground` |
| Portfolio Simulator EN | `/en/portfolio-simulator` | Remplacé par Playground | 301 → `/individuals-mock-en#playground` |
| Pricing FR (old) | `/pricing` | Refonte complète | 301 → `/particuliers-mock` |
| Pricing EN (old) | `/en/pricing` | Refonte complète | 301 → `/individuals-mock-en` |
| Workflow Visualization Mock | `/workflow-visualization-mock` | Page test | 410 Gone |
| Design Mock | `/design-mock` | Page test | 410 Gone |
| Clear Cache | `/clear-cache` | Outil interne | Noindex + robots.txt disallow |

---

## 🔀 Stratégie de Redirection

### Redirects 301 (Permanent)

```nginx
# French redirects
redirect 301 /investors /particuliers-mock;
redirect 301 /professionals /professionnels-mock;
redirect 301 /about /a-propos-mock;
redirect 301 /portfolio-simulator /particuliers-mock#playground;
redirect 301 /pricing /particuliers-mock;

# English redirects  
redirect 301 /en/investors /individuals-mock-en;
redirect 301 /en/professionals /professionals-mock-en;
redirect 301 /en/about /about-mock-en;
redirect 301 /en/portfolio-simulator /individuals-mock-en#playground;
redirect 301 /en/pricing /individuals-mock-en;

# Blog redirects (preserve SEO juice)
redirect 301 /blog /blog-mock;
redirect 301 /en/blog /blog-mock-en;
```

### Configuration Express (pages.routes.js)

```javascript
// Phase de transition - redirects legacy vers mocks
router.get("/investors", (req, res) => res.redirect(301, "/particuliers-mock"));
router.get("/en/investors", (req, res) => res.redirect(301, "/individuals-mock-en"));

router.get("/professionals", (req, res) => res.redirect(301, "/professionnels-mock"));
router.get("/en/professionals", (req, res) => res.redirect(301, "/professionals-mock-en"));

router.get("/about", (req, res) => res.redirect(301, "/a-propos-mock"));
router.get("/en/about", (req, res) => res.redirect(301, "/about-mock-en"));

router.get("/portfolio-simulator", (req, res) => res.redirect(301, "/particuliers-mock#playground"));
router.get("/en/portfolio-simulator", (req, res) => res.redirect(301, "/individuals-mock-en#playground"));
```

---

## 🏷️ Meta Tags & SEO

### Canonical URLs

```html
<!-- French pages -->
<link rel="canonical" href="https://bubbleinvest.org/particuliers-mock" />
<link rel="alternate" hreflang="fr" href="https://bubbleinvest.org/particuliers-mock" />
<link rel="alternate" hreflang="en" href="https://bubbleinvest.org/individuals-mock-en" />
<link rel="alternate" hreflang="x-default" href="https://bubbleinvest.org/individuals-mock-en" />

<!-- English pages -->
<link rel="canonical" href="https://bubbleinvest.org/individuals-mock-en" />
<link rel="alternate" hreflang="en" href="https://bubbleinvest.org/individuals-mock-en" />
<link rel="alternate" hreflang="fr" href="https://bubbleinvest.org/particuliers-mock" />
```

### Pages à Noindex (Archivage)

```html
<!-- À ajouter sur les pages legacy avant suppression -->
<meta name="robots" content="noindex, nofollow">
```

Pages concernées:
- `/workflow-visualization-mock`
- `/design-mock`
- `/clear-cache`
- Toutes les anciennes pages après migration

---

## 📊 Preservation du SEO

### 1. Backlinks & Link Equity

Tous les liens entrants vers les anciennes URLs seront préservés via les redirects 301.

### 2. Sitemap Strategy

**Étape 1: Sitemap de transition**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Nouvelles pages (priorité haute) -->
  <url>
    <loc>https://bubbleinvest.org/homepage-mock-v4</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://bubbleinvest.org/particuliers-mock</loc>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://bubbleinvest.org/professionnels-mock</loc>
    <priority>0.9</priority>
  </url>
  
  <!-- Anciennes pages (priorité basse, seront redirectées) -->
  <url>
    <loc>https://bubbleinvest.org/investors</loc>
    <priority>0.1</priority>
  </url>
</urlset>
```

**Étape 2: Sitemap final (après validation)**
- Supprimer les anciennes URLs
- Garder uniquement les nouvelles pages mocks

### 3. Google Search Console

Actions à prendre:
1. **Inspection d'URL** pour chaque nouvelle page
2. **Demande d'indexation** pour les pages importantes
3. **Sitemap** soumis avec les nouvelles URLs
4. **Suppression d'URL** temporaire pour les pages legacy (après migration)

---

## 🌍 SEO Local & International

### Hreflang Tags (À implémenter sur toutes les pages)

```html
<!-- Sur /particuliers-mock -->
<link rel="alternate" hreflang="fr" href="https://bubbleinvest.org/particuliers-mock" />
<link rel="alternate" hreflang="en" href="https://bubbleinvest.org/individuals-mock-en" />

<!-- Sur /individuals-mock-en -->
<link rel="alternate" hreflang="en" href="https://bubbleinvest.org/individuals-mock-en" />
<link rel="alternate" hreflang="fr" href="https://bubbleinvest.org/particuliers-mock" />
```

### Ciblage Géographique

| Page | Langue | Pays cible | hreflang |
|------|--------|------------|----------|
| Particuliers | FR | France, Belgique, Suisse, Québec | fr-FR, fr-BE, fr-CH, fr-CA |
| Individuals | EN | International | en |

---

## 📈 Tracking & Analytics

### Événements GA4 à configurer

```javascript
// Redirect tracking
gtag('event', 'legacy_redirect', {
  'from_page': '/investors',
  'to_page': '/particuliers-mock'
});

// Mock page views
gtag('event', 'page_view', {
  'page_title': 'Particuliers Mock',
  'page_location': '/particuliers-mock'
});
```

### URLs à tracker

| URL | Objectif | Conversion |
|-----|----------|------------|
| `/particuliers-mock` | Acquisition | CTA "Essayer" |
| `/professionnels-mock` | B2B Leads | Calendly click |
| `/blog-mock` | Engagement | Newsletter signup |

---

## ✅ Checklist de Migration

### Avant le déploiement

- [ ] Tous les mocks FR validés
- [ ] Tous les mocks EN créés
- [ ] Routes Express testées
- [ ] Redirects 301 configurés
- [ ] Canonical tags ajoutés
- [ ] Hreflang tags implémentés
- [ ] Sitemap XML généré
- [ ] Robots.txt mis à jour

### Pendant le déploiement

- [ ] Déployer les nouvelles pages
- [ ] Activer les redirects
- [ ] Soumettre le sitemap à GSC
- [ ] Tester tous les liens

### Après le déploiement

- [ ] Vérifier les 404 dans GSC
- [ ] Monitorer le trafic
- [ ] Vérifier les positions keywords
- [ ] Attendre 2-4 semaines
- [ ] Supprimer les pages legacy (noindex → delete)

---

## 🚨 Risques & Mitigations

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Perte de ranking "Investisseurs" | Moyenne | Élevé | 301 redirect + contenu optimisé "Particuliers" |
| 404 sur anciens liens | Faible | Moyen | Redirects complets + monitoring |
| Duplicate content FR/EN | Faible | Moyen | Hreflang tags + canonicals |
| Baisse trafic organique | Moyenne | Élevé | Monitoring GA4 + GSC, ajustements rapides |

---

## 📞 Questions ouvertes

1. **Timing**: Quand déployer ? (recommandé: semaine, éviter weekends)
2. **Batch**: Tout d'un coup ou par vagues ?
3. **Rollback**: Plan de retour en arrière si problème ?
4. **Communication**: Annoncer aux utilisateurs ?

---

*Document créé: 24 Fév 2026*
*À valider avant migration*
