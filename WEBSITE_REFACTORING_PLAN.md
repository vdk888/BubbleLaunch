# Plan de Refactoring - Bubble Invest Website

## 🎯 Vision & Positionnement

> **L'IA implémentée pour les pros. Sans baratin, sans boîte noire, sans dépendance.**

**Notre modèle hybride unique :**
- **B2C** = Contenu gratuit, éducation & vitrine d'expertise (le marketing)
- **B2B** = Conseil & implémentation d'agents IA sur mesure (le cœur de business)

---

## 📐 Architecture Simplifiée (4 Pages + Blog)

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER: [Logo] — [À Propos] [Particuliers] [Professionnels] [Blog] │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   🏠 HOME   │ │  👤 PART.   │ │  💼 PROS    │ │   ℹ️ ABOUT  │
├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤
│ Dual path   │ │ POC Agent   │ │ Consulting  │ │ Vision      │
│ à la vitrine│ │ d'invest    │ │ Early adop. │ │ Philosophie │
│ Blog        │ │ Généralis.  │ │ Co-constr.  │ │ Mission     │
│ Newsletter  │ │ Ressources  │ │ Use cases   │ │ Parcours    │
│             │ │ gratuitas   │ │ FAQ         │ │ Build Public│
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

---

## 📄 Pages Détaillées

---

### 1. 🏠 Homepage (`index.html`)

**Objectif** : Orienter vers la bonne vitrine + capturer l'email

**Structure** :

| Section | Contenu |
|---------|---------|
| **Hero** | "On construit des agents IA. On vous montre comment." <br>Dual path : Particuliers (apprendre) / Professionnels (implémenter) |
| **Manifeste** | Les 5 promesses visuelles (cartes) |
| **Aperçu contenu** | 3 derniers articles blog + tag série |
| **Newsletter** | "Suivez nos agents et apprentissages" (input inline) |
| **Preuve sociale** | "Early adopters systématiques" — les outils qu'on a testés avant tout le monde |
| **Footer** | Liens + réseaux (LinkedIn, Instagram, GitHub, Substack) |

**CTA primaire** : "Recevoir nos découvertes" (newsletter)
**CTA secondaire** : "Discuter d'un projet" (Calendly — pour pros)

---

### 2. 👤 Particuliers (`particuliers.html`)

**Objectif** : Vitrine éducative — notre POC agent + comment faire pareil

> **Ce n'est PAS un produit. C'est un proof of concept public.**

**Structure** :

| Section | Contenu | Intention |
|---------|---------|-----------|
| **Hero** | "Notre agent d'investissement — et comment vous pouvez en construire un aussi" | Positionner comme POC, pas SaaS |
| **Le POC en action** | Démo live + explication technique (stack, prompts) + **ses limites** | Transparence radicale |
| **Ce qu'on a appris** | Build in public : ratés, ajustements, découvertes | Authenticité |
| **Généralisation** | "Cette méthode marche pour n'importe quel agent IA" <br>→ Open Claw, configurations, veille... | Montrer l'expertise au-delà de l'investissement |
| **Ressources gratuites** | Accès libre : configs, prompts, tutos, outils testés | Valeur immédiate |
| **La suite ?** | "Si vous voulez implémenter ça dans votre business → [Professionnels]" | Funnel B2B clair |
| **Newsletter** | "Suivre les nouveaux agents qu'on construit" | Engagement B2C |

**Différenciation clé** :
- ✅ On montre comment c'est construit
- ✅ On dit ce qui ne marche pas
- ✅ On donne les ressources pour reproduire
- ❌ Pas de "signup" / "mon compte" / "prix"

**Messaging** :
> *"On a construit cet agent pour nous. On le partage en open — ce qu'il fait bien, ses limites, comment le reproduire. Les outils se commoditisent. Notre valeur : le contexte, la curation, l'honnêteté."*

---

### 3. 💼 Professionnels (`professionnels.html`)

**Objectif** : Converting B2B — early adopters, co-construction, autonomie

**Structure** :

| Section | Contenu |
|---------|---------|
| **Hero** | "Implémentez l'IA dans votre métier — avec les tout derniers outils" <br>Accent "Early adopters systématiques" |
| **L'edge** | "Les solutions qu'on déploie sont sorties il y a quelques semaines. Nous sommes parmi les premiers en France à les maîtriser." |
| **Pour qui** | CGP / Sociétés de gestion (cœur) + PME agiles + indépendants tech-forward |
| **Notre méthode : Co-construction** | On ne livre pas. On build **avec** vous. Sessions 1-2h/semaine. Chaque décision expliquée. À la fin, vous maintenez seul. |
| **Use cases** | 3 exemples concrets (CGP, architecte, PME) avec résultats |
| **FAQ** | Objections : "On n'a pas d'équipe tech" / "Ça va prendre combien de temps ?" / "Et après, on dépend de vous ?" → Non, autonomie. |
| **Testimonials** | 2-3 témoignages courts (focus sur "on a appris en faisant") |
| **CTA** | "Discuter de votre projet" (Calendly) — pas de pricing affiché, sur-mesure |

**Promesses B2B** :
1. **Early adoption** : Vous avez toujours une longueur d'avance
2. **Co-construction** : On build ensemble, vous apprenez en temps réel
3. **Autonomie** : À la fin, vous n'avez plus besoin de nous
4. **Transparence** : Pas de black box, on explique tout

**Messaging clé** :
> *"On ne fait pas de formations en salle. On forme en construisant avec vous. C'est du temps irréversible qu'on investit dans votre montée en compétence — pas des livrables jetables."*

---

### 4. ℹ️ À Propos (`a-propos.html`)

**Objectif** : Vision philosophique + preuve de crédibilité + Build in Public

**Structure** :

| Section | Contenu |
|---------|---------|
| **Vision** | "L'IA transforme l'économie. On veut être un pont entre l'économie d'hier et celle de demain." <br>Impact ultime : collectif d'early adopters qui partagent leurs apprentissages. |
| **Mission** | B2B : Accompagner pros dans l'implémentation agents IA. <br>B2C : Partager gratuitement savoir-faire. <br>Build in Public : Partager ce qu'on apprend. |
| **Philosophie : Le temps irréversible** | L'IA produit à coût marginal zéro. Ce qu'elle ne peut pas produire : l'attention authentique d'un être fini. Notre valeur = temps investi dans chaque relation, chaque geste. |
| **Will to Empower** | Transfert de pouvoir : dépendance → autonomie. <br>"Là où le conseil prospère sur votre dépendance, nous prospérons sur votre émancipation." |
| **Notre parcours** | Jade (Deloitte/UBS) + Joris — backgrounds crédibles mais pas masterminds. On apprend en public. |
| **Build in Public** | Métriques ouvertes (si pertinent), timeline, ce qu'on a appris/raté |
| **Articles fondamentaux** | Liens vers posts clés du blog (singularité économique, Sartre et les machines, etc.) |

**Tone** : Philosophique mais terre-à-terre. Pas de bullshit. On ne prétend pas avoir toutes les réponses.

---

### 5. 📝 Blog (`blog.html` + articles)

**Objectif** : Contenu gratuit qui prouve l'expertise + alimente le B2B

**5 séries de contenu** (tags visibles) :

1. **🔨 Build in Public** — Ce qu'on a testé, déployé, appris cette semaine
2. **🧠 Démystifier l'IA** — Séparer le signal du bruit (outils, hype vs réalité)
3. **💼 Cas d'usage métier** — Comment on a automatisé X pour Y
4. **🤖 Agents en vitrine** — Deep-dive technique sur un agent (config, prompts, limites)
5. **📚 Essais philosophiques** — IA, temps, attention, valeur (Sartre, singularité, etc.)

**Règles** :
- Tout est gratuit
- On montre les limites et les ratés
- On donne les ressources pour reproduire
- Chaque article a un CTA subtil vers Professionnels si pertinent

---

## 🎨 Composants Communs

### Header (toutes pages)
```
[Logo Bubble.] — [À Propos] [Particuliers] [Professionnels] [Blog]
```
Navigation simple, 4 items. Logo → Home.

### Footer (toutes pages)
```
[Logo Bubble.]

L'IA implémentée. Vous gardez l'avance.

[Produit]              [Ressources]           [Entreprise]
- Particuliers         - Blog                 - À Propos
- Professionnels       - Newsletter           - Build in Public
                       - Agents & Tutos       - Notre méthode

Réseaux : [LinkedIn] [Instagram] [GitHub] [Substack]

© 2026 Bubble Invest — Contenu gratuit. Expertise sur mesure.
```

**Réseaux sociaux** :
- ✅ **Garder** : LinkedIn, Instagram
- ✅ **Ajouter** : GitHub, Substack
- ❌ **Retirer** : TikTok, YouTube (pour l'instant)

---

## 🗂️ Gestion des Fichiers

### Pages Mock → Production

| Fichier Mock | → Destination | Action |
|--------------|---------------|--------|
| `homepage-mock-v4.html` | `index.html` | Renommer + cleanup |
| `particuliers-mock.html` | `particuliers.html` | Revoir messaging (POC pas produit) |
| `professionnels-mock.html` | `professionnels.html` | Accent early adopters + co-construction |
| `a-propos-mock.html` | `a-propos.html` | Ajouter philosophie temps/attention |
| `blog-mock.html` | `blog/index.html` | Organiser par 5 séries |

### Pages à Archiver (`/archive/`)
- `investors-mock.html` (ancienne logique)
- `homepage-mock-v3.html` et antérieurs
- `individuals-mock-en.html` (temporaire)
- `professionals-mock-en.html` (temporaire)
- Tous les drafts intermédiaires

### Pages à Créer (si besoin spécifique)
- `privacy.html` (RGPD)
- `mentions-legales.html`
- `404.html`

---

## ✅ Checklist de Déploiement

### Phase 1 : Fondation (Jour 1-2)
- [ ] Uniformiser header (4 liens) sur toutes les pages
- [ ] Mettre à jour footer (GitHub, Substack, pas TikTok/YouTube)
- [ ] Vérifier tous les liens internes
- [ ] Responsive mobile

### Phase 2 : Page Particuliers (Jour 2-3)
- [ ] **CRITIQUE** : Reformuler tout le messaging (POC public, pas produit)
- [ ] Ajouter section "Comment c'est construit" (transparence technique)
- [ ] Ajouter section "Les limites" (honnêteté)
- [ ] Créer section "Ressources gratuites" (configs, prompts)
- [ ] Ajouter lien vers Professionnels (funnel B2B)
- [ ] Vérifier : aucun langage SaaS ("votre compte", "tarifs", etc.)

### Phase 3 : Page Professionnels (Jour 3-4)
- [ ] Accent "Early adopters systématiques"
- [ ] Section "Co-construction" détaillée (pas de formation séparée)
- [ ] Use cases avec chiffres concrets
- [ ] FAQ : objection "dépendance" → réponse autonomie
- [ ] CTA Calendly (pas de pricing page)

### Phase 4 : Page À Propos (Jour 4-5)
- [ ] Rédiger section "Temps irréversible / Attention authentique"
- [ ] Section "Will to Empower"
- [ ] Parcours Jade + Joris (humble, pas masterminds)
- [ ] Métriques Build in Public (si pertinent)
- [ ] Liens articles philosophiques clés

### Phase 5 : Homepage (Jour 5)
- [ ] Hero dual path clair (apprendre vs implémenter)
- [ ] Manifeste 5 promesses (visuel)
- [ ] Preview blog dynamique
- [ ] CTA newsletter optimisé

### Phase 6 : Blog (Jour 6-7)
- [ ] Système de tags (5 séries)
- [ ] CTA newsletter sticky
- [ ] Relier articles pertinents à Professionnels

### Phase 7 : Polish (Jour 8-10)
- [ ] SEO (titres, meta, schema.org)
- [ ] Accessibilité (ARIA, contraste)
- [ ] Performance (images WebP, lazy loading)
- [ ] Analytics (events clés)

---

## 📝 Copywriting Référence

### Manifeste (5 promesses)

1. **Niche Finance × Tech** — Notre expertise native (Deloitte + UBS), pas des consultants généralistes
2. **Early adoption** — On teste et déploie les dernières solutions IA avant tout le monde en France
3. **Transparence radicale** — Ce qui marche, ce qui ne marche pas, comment on travaille
4. **Co-construction** — On build avec vous. À la fin, vous n'avez plus besoin de nous.
5. **Build in Public** — Nos décisions, arbitrages et apprentissages en temps réel

### Citations clés à intégrer

> *"Vous n'avez pas besoin de plus de slides sur l'IA. Vous avez besoin de quelqu'un qui l'implémente concrètement dans votre métier."*

> *"L'IA peut produire à coût marginal zéro. Ce qu'elle ne peut pas produire, c'est l'attention authentique d'un être fini investi dans un geste adressé à un autre."*

> *"Là où l'industrie du conseil prospère sur votre dépendance, nous prospérons sur votre émancipation."*

> *"On ne fait pas de formations en salle. On forme en construisant avec vous."*

---

## 📊 KPIs à Tracker

### B2C (Vitrine)
- Taux d'inscription newsletter
- Temps passé sur Particuliers
- Clics vers ressources gratuites
- Clics Particuliers → Professionnels (funnel B2B)

### B2B (Conversion)
- Clics Calendly
- Origine des leads (quel contenu les a amenés ?)
- Taux de conversion lead → call

### Engagement
- Temps passu sur blog
- Articles les plus lus (par série)
- Retour sur Build in Public

---

*Document mis à jour : 24 Fév 2026*
*Architecture : 4 pages + blog | B2C = Vitrine éducative | B2B = Conseil sur mesure*
