# Plan de Réutilisation des Pages Existantes
**Date :** Février 2026  
**Objectif :** Réutiliser au maximum la structure et le design des pages existantes

---

## 📁 Inventaire des Pages Existantes

### Pages Racine (`/src/frontend/pages/`)

| Page | Fichier | Statut | Réutilisation |
|------|---------|--------|---------------|
| **Homepage** | `index.html` | ✅ Existe | **Réécrire le copy** uniquement |
| **Blog** | `blog.html` | ✅ Existe | **Conserver** — structure OK |
| **Article Blog** | `blog-post.html` | ✅ Existe | **Conserver** |
| **Simulateur** | `portfolio-simulator.html` | ✅ Existe | **Reprioriser** — déplacer dans menu ressources |
| **Tarifs** | `pricing.html` | ✅ Existe | **Mettre à jour** — contenu à vérifier |
| **Mentions Légales** | `mentions-legales.html` | ✅ Existe | **Conserver** |
| **Privacy** | `privacy.html` | ✅ Existe | **Conserver** |
| **404** | `404.html` | ✅ Existe | **Conserver** |

### Pages Investors (`/src/frontend/pages/investors/`)

| Page | Fichier | Statut | Réutilisation |
|------|---------|--------|---------------|
| **Solution B2C** | `index.html` | ✅ Existe | **Fusionner** avec homepage principale OU réécrire |
| **Tarifs B2C** | `pricing.html` | ✅ Existe | **Fusionner** avec pricing principal |
| **Éducation** | `education.html` | ✅ Existe | **Conserver** — moins prioritaire |
| **Playground** | `playground.html` | ✅ Existe | **Reprioriser** comme "Démo" |
| **Playground/** | `playground/` | ✅ Existe | **Conserver** structure, renommer "Démo" |

### Pages Professionals (`/src/frontend/pages/professionals/`)

| Page | Fichier | Statut | Réutilisation |
|------|---------|--------|---------------|
| **Accueil B2B** | `index.html` | ✅ Existe | **Réécrire** avec nouveau copy |
| **Solutions Entreprises** | `solutions-companies.html` | ✅ Existe | **Renommer** `/solutions` |
| **Solutions CGP** | `solutions-wealth-managers.html` | ✅ Existe | **Fusionner** dans `/solutions` |
| **Démo B2B** | `demo.html` | ✅ Existe | **Conserver** ou fusionner avec page solutions |

---

## 🔄 Plan de Réutilisation par Page

### 1. HOMEPAGE — `/index.html`

**Structure existante à conserver :**
- Header avec logo + navigation
- Hero section avec chatbot
- Section Manifesto
- Section Vision
- Section Waitlist (formulaire)
- Footer

**Modifications nécessaires :**
```diff
# Hero
- Ancien tagline : "L'investissement repensé"
+ Nouveau tagline : "L'agent qui vous élève, pas qui vous gère"

+ Ajouter mission statement sous le tagline

# Section Manifesto
- Garder structure avec sliders
+ Remplacer contenu par "Le Vrai Problème"

# Section Vision
- Garder grid layout
+ Remplacer contenu par "Solution" (features grid)

+ Ajouter section "Selfware" (nouvelle)
+ Ajouter section "Différenciation Silencieuse" (nouvelle)

# Waitlist
- Garder formulaire existant
+ Ajouter champ "Profil" (B2C/B2B)
+ Ajouter champ "Broker"
```

---

### 2. PAGE B2B — Réutiliser `/professionals/index.html`

**Structure existante à conserver :**
- Header B2B
- Hero avec titre + CTA
- Section features (3 colonnes)
- Formulaire de contact
- Footer

**Modifications nécessaires :**
```diff
# Hero
+ "L'automatisation qu'on déploie pour nous, à votre service"

# Sections
- Remplacer features par : Edge + Services + Méthodologie
- Garder layout 3 colonnes pour les 3 niveaux de service

# Formulaire
- Conserver structure
+ Ajouter champ "Type de structure" (CGP/Société/Indépendant)
+ Ajouter lien Calendly
```

**Alternative :** Fusionner avec `solutions-companies.html` et `solutions-wealth-managers.html` → une seule page `/solutions`

---

### 3. PAGE PLAYGROUND/DÉMO — Réutiliser `/investors/playground.html`

**Structure existante à conserver :**
- Layout fullscreen
- Chatbot à gauche
- Profil à droite
- Input flottant

**Modifications nécessaires :**
```diff
# Repositionnement
- Titre : "Playground" → "Démo Bubble"
- Ajouter message : "Version démo — Rejoignez la liste d'attente pour l'accès complet"

# Limitations
- Garder chat simple (session uniquement)
- Ne pas promettre de persistence
```

---

### 4. PAGE SIMULATEUR — Conserver `/portfolio-simulator.html`

**Modifications nécessaires :**
```diff
# Repositionnement
- Déplacer dans menu "Ressources" (pas menu principal)
- Ajouter bannière : "Outil d'exploration — Pour tester les stratégies, rejoignez la liste d'attente"

# CTA
+ Ajouter CTA vers liste d'attente en haut et en bas
```

---

### 5. PAGE BLOG — Conserver `/blog.html` et `/blog-post.html`

**Aucune modification structurelle** — juste :
- Mettre à jour le contenu (articles "Build in Public")
- Ajouter section "Newsletter" dans la sidebar ou footer

---

### 6. PAGE TARIFS — Réutiliser `/pricing.html`

**Modifications nécessaires :**
```diff
# Tiers
- Vérifier si les 4 tiers correspondent (Découverte/Investisseur/Pro/B2B)
- Adapter contenu si nécessaire

# Design
- Conserver table/toggle existant
- S'assurer que la différence "pas de % sur AUM" est claire
```

---

## 🎨 Composants à Réutiliser

### Header existant
```html
<!-- Structure actuelle à conserver -->
<header>
  <div class="container">
    <div class="brand">
      <div class="logo">[Symbole] Bubble.</div>
      <div class="tagline">L'investissement repensé.</div>
    </div>
    <nav>
      <a href="#manifesto">Manifeste</a>
      <a href="#vision">Vision</a>
      <a href="#approach">Approche</a>
      <a href="#waitlist">Nous rejoindre</a>
      <div class="language-switcher">EN | FR</div>
    </nav>
  </div>
</header>
```

**Modifications :**
- Mettre à jour les liens nav selon nouvelle structure
- Garder style glassmorphism existant

---

### Formulaire Waitlist existant
```html
<!-- Structure actuelle à conserver -->
<form id="waitlist-form">
  <div class="form-group">
    <label for="name">Nom</label>
    <input type="text" id="name" name="name" required />
  </div>
  <div class="form-group">
    <label for="email">Email</label>
    <input type="email" id="email" name="email" required />
  </div>
  <!-- Ajouter champs B2C/B2B et Broker -->
</form>
```

---

### Chatbot existant
```html
<!-- Réutiliser chat-side-panel.js et structure -->
<div id="chat-side-panel" class="chat-side-panel">
  <div class="chat-side-panel-header">...</div>
  <div class="chat-side-panel-messages">...</div>
  <form class="chat-side-panel-input-container">...</form>
</div>
```

**Modifications :**
- Limiter à session uniquement (pas de persistence)
- Ajouter message "Rejoignez la liste d'attente pour plus"

---

### Cards existantes
```css
/* Réutiliser styles existants */
.approach-item, .feature-item, .platform-card {
  background: white;
  border-radius: 24px; /* ou 8px selon charte */
  padding: 2rem;
  /* ... */
}
```

---

## 📝 Checklist Réutilisation

### Phase 1 : Audit Visuel (1-2h)
- [ ] Capturer screenshots de toutes les pages existantes
- [ ] Identifier les composants réutilisables (cards, boutons, formulaires)
- [ ] Noter les styles CSS communs

### Phase 2 : Mapping Contenu (2-3h)
- [ ] Mapper nouveau contenu sur structures existantes
- [ ] Identifier les sections à créer ex nihilo (Selfware, Différenciation Silencieuse)
- [ ] Décider quelles pages fusionner

### Phase 3 : Modifications (4-6h)
- [ ] Homepage : réécrire copy, ajouter sections manquantes
- [ ] B2B : réécrire avec nouveau positionnement
- [ ] Playground : reprioriser comme "Démo"
- [ ] Simulateur : déplacer dans ressources

### Phase 4 : Navigation (1h)
- [ ] Mettre à jour menu principal
- [ ] Mettre à jour footer
- [ ] Vérifier tous les liens internes

---

## 🚫 Nouvelles Pages à Créer (Minimum)

| Page | Justification |
|------|---------------|
| `/mission` (ou `/about`) | Page mission n'existe pas — créer nouvelle |
| Section "Selfware" sur homepage | Nouveau concept — ajouter section |
| Section "Différenciation Silencieuse" | Nouveau concept — ajouter section |

**Tout le reste = réutilisation !**

---

## 🎯 Objectif : 80% Réutilisation

| Élément | Réutilisation | Création |
|---------|--------------|----------|
| Header | ✅ 100% | — |
| Footer | ✅ 100% | — |
| Hero structure | ✅ 90% | Nouveau copy |
| Formulaires | ✅ 90% | Ajouter champs |
| Cards/Grids | ✅ 100% | — |
| Chatbot | ✅ 80% | Limiter session |
| Sections content | ⚠️ 50% | Réécrire beaucoup |
| Page Mission | ❌ 0% | Créer nouvelle |

**Estimation : ~75-80% de réutilisation globale**

---

*Document de planification — Version 1.0*
