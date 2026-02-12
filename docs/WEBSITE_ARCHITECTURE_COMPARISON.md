# Website Architecture Comparison — Bubble Invest
**Old vs New Architecture** | **Date:** February 2026

---

## 📊 Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ANCIENNE ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🏠 ACCUEIL (B2C focus)                                                │
│  ├── /index.html              ← Homepage (générique, débutants)        │
│  ├── /portfolio-simulator.html← Simulateur (prominent)                 │
│  └── /playground.html         ← Playground (prominent)                 │
│                                                                         │
│  👤 INVESTORS (B2C)                                                     │
│  ├── /investors/index.html    ← Solution B2C                           │
│  ├── /investors/pricing.html  ← Tarifs B2C                             │
│  ├── /investors/education.html← Éducation                              │
│  └── /investors/playground/   ← Playground chat (profile discovery)    │
│                                                                         │
│  💼 PROFESSIONALS (B2B)                                                 │
│  ├── /professionals/index.html       ← Accueil B2B                     │
│  ├── /professionals/solutions-companies.html    ← Entreprises          │
│  ├── /professionals/solutions-wealth-managers.html ← CGP               │
│  └── /professionals/demo.html        ← Démo B2B                        │
│                                                                         │
│  📝 CONTENU                                                             │
│  ├── /blog.html               ← Blog                                   │
│  ├── /blog-post.html          ← Article                                │
│  └── /mentions-legales.html, /privacy.html ← Légal                     │
│                                                                         │
│  📊 Problèmes identifiés :                                              │
│  • Trop de pages B2C dispersées                                        │
│  • Positionnement débutant (Playground/Simulator trop visibles)        │
│  • B2B fragmenté sur 3 pages                                           │
│  • Pas de page Mission/About claire                                    │
│  • Navigation confuse (Investors vs Professionals)                     │
└─────────────────────────────────────────────────────────────────────────┘

                                    ⬇️
                              REFACTORING
                                    ⬇️

┌─────────────────────────────────────────────────────────────────────────┐
│                         NOUVELLE ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🏠 ACCUEIL (Marketing unifié)                                         │
│  ├── /index.html              ← 🔄 RÉUTILISÉ (structure conservée)     │
│  │                              + Nouveau copy                         │
│  │                              + Sections Selfware & Différenciation  │
│  └── /demo (ou /playground)   ← 🔄 RÉUTILISÉ (ex-playground.html)      │
│                                 Repositionné comme "Démo" secondaire   │
│                                                                         │
│  💼 SOLUTIONS B2B (Priorisé)                                            │
│  └── /solutions (ou /professionals) ← 🔄 FUSION 3 pages → 1            │
│      - professionals/index.html                                        │
│      - professionals/solutions-companies.html                          │
│      - professionals/solutions-wealth-managers.html                    │
│      → 1 page unifiée avec formulaire + Calendly                       │
│                                                                         │
│  🎯 MISSION (Nouvelle)                                                  │
│  └── /mission (ou /a-propos)  ← ⭐ CRÉÉE EX NIHILO                     │
│      - Histoire fondateurs                                             │
│      - Convictions                                                     │
│      - Build in Public links                                           │
│                                                                         │
│  🛠️ RESSOURCES (Repriorisé)                                             │
│  ├── /blog                    ← 🔄 CONSERVÉ (inchangé)                 │
│  ├── /portfolio-simulator     ← 🔄 DÉPLACÉ (menu secondaire)           │
│  │                              Bannière "outil d'exploration"         │
│  └── /newsletter              ← ⭐ OPTIONNEL (nouvelle ou section)     │
│                                                                         │
│  📝 LÉGAL                                                               │
│  ├── /mentions-legales.html   ← 🔄 CONSERVÉ                            │
│  └── /privacy.html            ← 🔄 CONSERVÉ                            │
│                                                                         │
│  📈 Résultat :                                                          │
│  • Navigation simplifiée (4 entrées vs 8+)                             │
│  • B2B priorisé et unifié                                              │
│  • Message cohérent "Investisseur actif averti"                        │
│  • ~85% réutilisation des pages existantes                             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Mapping Détaillé : Ancien → Nouveau

### 1. HOMEPAGE — `/index.html`

| Aspect | Ancien | Nouveau | Action |
|--------|--------|---------|--------|
| **Tagline** | "L'investissement repensé" | "L'agent qui vous élève, pas qui vous gère" | 📝 Réécrire |
| **Target** | Débutants | CSP+ tech/finance | 📝 Réécrire |
| **Sections** | Manifesto, Vision, Waitlist | Problème, Solution, Selfware, Différenciation, Waitlist | 🔄 Restructurer |
| **Hero** | Chatbot générique | Mission statement + CTA dual (B2C/B2B) | 🔄 Modifier |
| **Réutilisation** | Structure HTML, CSS, Header, Footer | — | ✅ 80% conservé |

**Fichiers concernés :**
- `/src/frontend/pages/index.html` (FR)
- `/src/frontend/pages/en/index.html` (EN)

---

### 2. PAGE DÉMO — `/demo` ou `/playground`

| Aspect | Ancien | Nouveau | Action |
|--------|--------|---------|--------|
| **Nom** | "Playground" | "Démo" | 🏷️ Renommer |
| **Position** | Menu principal | Menu secondaire (Produit → Démo) | 📍 Repositionner |
| **Objectif** | Découverte profil débutant | Montrer l'app complète (animations) | 🎯 Repositionner |
| **Fonction** | Chatbot profile discovery | Animations Agent/Builder/Arena + chat limité | 🔧 Adapter |
| **Réutilisation** | Layout fullscreen, chatbot existant | — | ✅ 90% conservé |

**Fichiers concernés :**
- `/src/frontend/pages/investors/playground.html` → renommé/réutilisé

---

### 3. PAGE B2B — `/solutions`

| Aspect | Ancien | Nouveau | Action |
|--------|--------|---------|--------|
| **Structure** | 3 pages séparées | 1 page unifiée | 🔀 Fusionner |
| **Pages sources** | `professionals/index.html`<br>`solutions-companies.html`<br>`solutions-wealth-managers.html` | `/solutions` unique | 🔄 Consolider |
| **Contenu** | Générique, features dispersées | Edge + Services + Méthodologie + Formulaire | 📝 Réécrire |
| **Prix** | €3k-€30k | "Sur devis" | 📝 Retirer |
| **CTA** | Formulaire simple | Formulaire + Calendly | ➕ Ajouter |
| **Réutilisation** | Composants des 3 pages, cards, formulaires | — | ✅ 70% conservé |

**Fichiers concernés :**
- Fusion de : `professionals/index.html` + `solutions-companies.html` + `solutions-wealth-managers.html`

---

### 4. PAGE SIMULATEUR — `/portfolio-simulator`

| Aspect | Ancien | Nouveau | Action |
|--------|--------|---------|--------|
| **Menu** | Principal | Secondaire (Ressources) | 📍 Reprioriser |
| **Positionnement** | Feature clé | "Outil d'exploration" | 🏷️ Repositionner |
| **Bannière** | Aucune | "Version démo — Rejoignez la liste d'attente" | ➕ Ajouter |
| **CTA** | Minimal | CTA liste d'attente visible | ➕ Ajouter |
| **Réutilisation** | Page entière, charts, calculs | — | ✅ 95% conservé |

**Fichiers concernés :**
- `/src/frontend/pages/portfolio-simulator.html` (déplacé dans menu)

---

### 5. PAGE MISSION — `/mission` ⭐ NOUVELLE

| Aspect | Ancien | Nouveau | Action |
|--------|--------|---------|--------|
| **Existence** | ❌ Absente | ⭐ Nouvelle page | 🆕 Créer |
| **Contenu** | — | Histoire Joris & Jade<br>4 Convictions<br>Build in Public | 📝 Créer |
| **Réutilisation** | — | Header, Footer, Cards styles | ✅ Composants réutilisés |

**Fichiers à créer :**
- `/src/frontend/pages/mission.html` (FR)
- `/src/frontend/pages/en/mission.html` (EN)

---

### 6. BLOG — `/blog`

| Aspect | Ancien | Nouveau | Action |
|--------|--------|---------|--------|
| **Structure** | Liste d'articles | Identique | ✅ Aucun changement |
| **Contenu** | Général | "Build in Public" focus | 📝 Métadonnées seulement |
| **Réutilisation** | 100% | — | ✅ Inchangé |

---

## 🗺️ Structure URL Comparative

### Ancienne Structure
```
/
├── /index.html
├── /portfolio-simulator.html
├── /playground.html (redirect vers /investors/playground)
├── /blog.html
├── /blog-post.html
├── /investors/
│   ├── /index.html (solution B2C)
│   ├── /pricing.html
│   ├── /education.html
│   └── /playground/
│       └── /index.html
├── /professionals/
│   ├── /index.html
│   ├── /solutions-companies.html
│   ├── /solutions-wealth-managers.html
│   └── /demo.html
├── /mentions-legales.html
└── /privacy.html
```

### Nouvelle Structure
```
/
├── /index.html                      🔄 Réutilisé
├── /demo (ou /playground)           🔄 Réutilisé (ex-/investors/playground)
├── /solutions (ou /professionals)   🔄 Fusionné (3 → 1)
├── /mission (ou /a-propos)          ⭐ Nouveau
├── /blog.html                       🔄 Conservé
├── /blog-post.html                  🔄 Conservé
├── /portfolio-simulator.html        🔄 Déplacé (menu secondaire)
├── /newsletter (optionnel)          ⭐ Optionnel
├── /mentions-legales.html           🔄 Conservé
└── /privacy.html                    🔄 Conservé
```

---

## 📋 Navigation Comparative

### Ancienne Navigation
```
[Logo]  Investors ▼  Professionals  Resources  [Waitlist]
        Solution     Solutions Pro   Blog
        Pricing      Demo            Education
        Education
        Playground
```

**Problèmes :**
- Double menu Investors/Professionals (confusion)
- Playground/Simulator trop visibles (positionnement débutant)
- B2B pas assez prominent

### Nouvelle Navigation
```
[Logo]  Produit ▼    Solutions Pro    Ressources ▼    Mission    [Waitlist]
        Interface    (B2B direct)    Blog            
        Tarifs                       Simulateur
        Démo                         
```

**Avantages :**
- B2B en 2ème position (priorité)
- Ressources regroupées (Blog, Simulateur)
- Mission ajoutée (crédibilité)
- Simplifié (5 entrées vs 8+)

---

## 📊 Taux de Réutilisation par Page

| Page | Ancien Fichier | Réutilisation | Nouveau Fichier |
|------|---------------|---------------|-----------------|
| **Homepage** | `index.html` | 80% | `index.html` (même) |
| **Démo** | `investors/playground.html` | 90% | `/demo` ou `/playground` |
| **B2B Solutions** | `professionals/*` (3 fichiers) | 70% | `/solutions` (1 fichier) |
| **Simulateur** | `portfolio-simulator.html` | 95% | Même (menu secondaire) |
| **Blog** | `blog.html` | 100% | Même |
| **Mission** | — | 0% | `/mission` ⭐ NOUVEAU |
| **Légal** | `mentions-legales.html`, `privacy.html` | 100% | Mêmes |
| **Header** | Composant existant | 100% | Même (liens mis à jour) |
| **Footer** | Composant existant | 100% | Même (liens mis à jour) |

**Moyenne globale : ~85% réutilisation**

---

## 🎯 Changements de Positionnement

| Élément | Avant | Après | Impact |
|---------|-------|-------|--------|
| **Cible principale** | Débutants | CSP+ tech/finance | Copy technique |
| **Feature hero** | Playground/Simulator | Agent conversationnel | Homepage redesign |
| **B2B visibilité** | Menu séparé | Prominent | + leads qualifiés |
| **Prix B2B** | Publics (€3k-€30k) | Sur devis | + conversations |
| **Pédagogie** | Frontale (Playground) | Intégrée (Blog) | Moins de friction |

---

## ✅ Checklist Migration

### Phase 1 : Préparation
- [ ] Capturer screenshots pages existantes (référence)
- [ ] Identifier composants réutilisables (CSS classes)
- [ ] Créer fichier `translations.js` pour bilinguisme

### Phase 2 : Homepage (Semaine 1)
- [ ] Modifier `index.html` (FR)
- [ ] Modifier `en/index.html` (EN)
- [ ] Ajouter sections Selfware + Différenciation
- [ ] Mettre à jour formulaire waitlist

### Phase 3 : B2B (Semaine 1-2)
- [ ] Créer `solutions.html` (fusion 3 pages)
- [ ] Créer `en/solutions.html`
- [ ] Intégrer Calendly
- [ ] Retirer prix

### Phase 4 : Mission (Semaine 2)
- [ ] Créer `mission.html`
- [ ] Créer `en/mission.html`
- [ ] Ajouter photos Joris & Jade
- [ ] Intégrer liens Build in Public

### Phase 5 : Repriorisation (Semaine 2)
- [ ] Modifier navigation (header/footer)
- [ ] Déplacer Simulateur dans Ressources
- [ ] Repositionner Playground comme Démo
- [ ] Tester tous les liens

### Phase 6 : Tests (Semaine 3)
- [ ] Vérifier bilinguisme FR/EN
- [ ] Test responsive mobile
- [ ] Review avec équipe
- [ ] Déployer

---

*Document d'architecture — Version 1.0*
