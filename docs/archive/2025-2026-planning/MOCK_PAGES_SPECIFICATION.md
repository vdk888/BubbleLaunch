# Spécification des Mock Pages — Bubble Invest
**Date :** Février 2026  
**Objectif :** Définir le design et le contenu des nouvelles pages sans modifier la structure actuelle

---

## ⚠️ Architecture & Contraintes

| Élément | Description |
|---------|-------------|
| **Site Marketing** | bubbleinvest.org — Homepage, produit, B2B, démo, liste d'attente |
| **Application Complète** | app.bubbleinvest.org — Interface unifiée avec comptes, execution réelle (non ouvert au public) |
| **Démo sur le site** | Chatbot simple (session uniquement, pas de persistence) + animations enregistrées |
| **Objectif site** | Convaincre de s'inscrire à la LISTE D'ATTENTE pour accéder à app.bubbleinvest.org |
| **Animations** | Les features "Arena" et "Builder" sur le site sont des enregistrements/animations, pas du live |
| **Bilinguisme** | Toutes les modifications doivent être faites simultanément sur **FR** (`/`) et **EN** (`/en/`) |

---

## 🔄 Réutilisation des Pages Existantes

> **Voir document détaillé :** `MOCK_PAGES_REUSE_PLAN.md`

**Taux de réutilisation visé : ~80%**

| Élément | Réutilisation | Action |
|---------|--------------|--------|
| **Header/Footer** | 100% | Conserver structure + mise à jour liens |
| **Homepage** | 80% | Réécrire copy, ajouter 2-3 sections nouvelles |
| **Formulaires** | 90% | Ajouter champs B2C/B2B et broker |
| **Cards/Grids** | 100% | Réutiliser classes CSS existantes |
| **Chatbot** | 80% | Limiter session, ajouter message waitlist |
| **Page B2B** | 70% | Fusionner pages existantes, réécrire copy |
| **Page Mission** | 0% | **Créer nouvelle page** (n'existe pas) |

**Pages existantes à réutiliser :**
- `/index.html` → Homepage (structure à garder)
- `/professionals/index.html` → Base page B2B
- `/investors/playground.html` → Page Démo
- `/portfolio-simulator.html` → Déplacer dans ressources
- `/blog.html` → Conserver tel quel
- `/pricing.html` → Mettre à jour contenu

---

## 1. HOMEPAGE — `/` (Marketing)

> **Base à réutiliser :** `/src/frontend/pages/index.html` (page existante)

### Objectif
Convertir un visiteur en inscription liste d'attente (B2C) ou lead B2B pour accéder à l'application complète (app.bubbleinvest.org).

### Note Importante
Le site bubbleinvest.org est **marketing uniquement**. L'application complète avec connexion utilisateur et exécution réelle est sur app.bubbleinvest.org (non ouvert au public — accès par liste d'attente uniquement).

### Structure des Sections

```
┌─────────────────────────────────────┐
│  HEADER                             │
│  Logo + Nav (Produit | Pro | Ressources | Mission | Liste d'attente) │
├─────────────────────────────────────┤
│  SECTION HERO                       │
│  Tagline + Mission + 2 CTAs         │
├─────────────────────────────────────┤
│  SECTION PROBLÈME                   │
│  "Coincé entre ETF et stock picking"│
├─────────────────────────────────────┤
│  SECTION SOLUTION (Features Grid)   │
│  6 features clés                    │
├─────────────────────────────────────┤
│  SECTION SELFWARE                   │
│  "Vos actifs restent chez vous"     │
├─────────────────────────────────────┤
│  SECTION INTERFACE DÉMO             │
│  Aperçu visuel + CTA "Essayer la démo" │
├─────────────────────────────────────┤
│  SECTION DIFFÉRENCIATION SILENCIEUSE│
│  5 promesses distinctives           │
├─────────────────────────────────────┤
│  SECTION B2B TEASER                 │
│  Pour professionnels                │
├─────────────────────────────────────┤
│  SECTION SOCIAL PROOF               │
│  Témoignages / chiffres             │
├─────────────────────────────────────┤
│  SECTION CTA FINALE                 │
│  Formulaire liste d'attente         │
├─────────────────────────────────────┤
│  FOOTER                             │
│  Liens + réseaux                    │
└─────────────────────────────────────┘
```

### Contenu Détaillé

#### Section Hero

```
[Logo Bubble.]

# Investissement actif automatisé.
# Vous gardez le contrôle.

Au cœur de Bubble, une conviction : la bienveillance crée plus de valeur 
que la compétition. Notre mission — vous élever, pas vous rendre dépendant.

[CTA Primaire] Rejoindre la liste d'attente
[CTA Secondaire] Solutions pour professionnels →
```

**Design :**
- Background : Blanc/clean ou très léger gradient
- Typographie : Inter, bold sur le H1
- Espacement généreux (air)
- Pas d'image hero (ou screenshot subtile de l'interface en fond flouté)

---

#### Section Problème

```
Coincé entre l'ETF trop simple et le stock picking trop chronophage ?

Vous connaissez les marchés. Vous suivez l'actualité financière. 
Vous savez ce qu'est un ETF.

Mais vous êtes coincé :

• Trop simple — 100% MSCI World, allocation figée
• Trop chronophage — stock picking, heures de gestion
• Trop opaque — robo-advisors boîte noire  
• Trop cher — pourcentage sur vos actifs

Vous voulez investir activement, avec vos convictions.
Sans y consacrer 10 heures par semaine.

On a créé Bubble Invest pour nous. On vous le partage.
```

**Design :**
- Background : Légèrement contrasté (gris très clair #F9FAFB)
- Liste avec icônes (simples, ligne fine)
- CTA textuel : "Voir comment ça marche →"

---

#### Section Solution (Features)

```
Investissement actif, sans la charge opérationnelle

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ 💬 Une seule    │  │ 📊 Backtests    │  │ ⚡ Exécution    │
│   interface     │  │   avant         │  │   automatisée   │
│                 │  │   engagement    │  │                 │
│ Conversation,   │  │ Testez sur      │  │ Connexion       │
│ construction    │  │ 10-20 ans.      │  │ directe à vos   │
│ de stratégies,  │  │ Pas de          │  │ brokers.        │
│ visualisation — │  │ surprises.      │  │                 │
│ tout dans un    │  │                 │  │                 │
│ seul flux.      │  │                 │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ 🔍 Stratégies   │  │ 💼 Au-delà des  │  │ 🔒 Vos actifs   │
│   explicables   │  │   ETFs (Pro)    │  │   restent       │
│                 │  │                 │  │   les vôtres    │
│ Vous voyez les  │  │ Sélection       │  │                 │
│ règles. Pas     │  │ d'actions       │  │ On ne détient   │
│ d'algorithme    │  │ automatisée     │  │ jamais votre    │
│ opaque.         │  │ pour les        │  │ argent.         │
│                 │  │ portefeuilles   │  │                 │
│                 │  │ avancés.        │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘

Note : L'exécution automatique fonctionne sur compte-titres (CTO). 
PEA et assurances-vie ne le permettent pas encore (réglementation).
```

**Design :**
- Grid 3x2 responsive (2x3 sur mobile)
- Cards avec border subtile, border-radius 8px
- Hover : légère élévation (shadow)
- Icônes : style line (pas fill), couleur noire/gris foncé

---

#### Section Interface Démo (NOUVELLE)

```
Une interface, tout l'investissement

[MOCKUP VISUEL DE L'INTERFACE]
┌─────────────────────────────────────────┐
│  Bubble Agent                    [_]   │
├─────────────────────────────────────────┤
│                                         │
│  👤 Bonjour ! Je suis l'agent Bubble.   │
│     Je peux vous aider à :              │
│                                         │
│     • Découvrir votre profil            │
│     • Construire une stratégie          │
│     • Visualiser des performances       │
│                                         │
│  Que souhaitez-vous explorer ?          │
│                                         │
│  [Démo : Construire une stratégie]      │
│  [Démo : Voir l'Arena]                  │
│  [Parler à l'agent]                     │
│                                         │
└─────────────────────────────────────────┘

Testez la démo interactive — aucune inscription requise.

[CTA] Voir la démo →  
*(Accès à l'application complète : liste d'attente)*
```

**Design :**
- Mockup de l'interface chatbot (style iMessage/WhatsApp web)
- Boutons de démo visibles (conduisent à `/demo`)
- CTA clair vers la page démo

---

#### Section Selfware

```
Vos actifs restent chez votre broker. On ne les touche jamais.

On ne veut pas être un nouvel intermédiaire qui détient votre patrimoine.

Comment ça marche :

1. Vous connectez votre compte broker existant
2. L'agent analyse, suggère, prépare
3. Vous validez chaque décision
4. L'exécution se fait sur votre compte, à votre nom

"Selfware" — Un logiciel qui vous donne les outils pour être autonome, 
sans vous enfermer.

[Schéma simple : User → Bubble Agent → Broker → Marchés]
                        ↑___________|
                    (validation user)
```

**Design :**
- Schéma simple en 4 étapes (horizontal desktop, vertical mobile)
- Flèches claires
- Accent sur "validation user" (point de contrôle)

---

#### Section Différenciation Silencieuse

```
Ce qu'on dit, ce qu'on ne dit pas

✓ On ne prendra jamais de pourcentage sur vos actifs
✓ On ne détient jamais vos actifs  
✓ Vous voyez exactement comment les décisions sont prises
✓ Si une stratégie ne vous convient pas, vous la modifiez
✓ S'il y a une limitation, vous la verrez avant de payer
```

**Design :**
- Check icons (simples, pas colorés)
- Texte en liste verticale, espacée
- Citation finale optionnelle :
> "On préfère perdre un lead que vendre de l'opaque."

---

#### Section B2B Teaser

```
Vous accompagnez des clients sur leurs investissements ?

CGP, sociétés de gestion, indépendants — on déploie les dernières 
solutions d'automatisation dès leur sortie.

Diagnostic → Automatisations ciblées → Projets complets

[Voir nos solutions B2B →]
```

**Design :**
- Background légèrement différent (subtil)
- Flèche de process (desktop horizontal, mobile vertical)

---

#### Section Newsletter (Nouvelle — Avant ou après CTA finale)

```
Veille IA & Finance

**Deux fois par semaine**, recevez notre sélection personnalisée 
des actualités IA et finance qui comptent vraiment.

[Email *] ___________________  [S'abonner]

Sans spam. Désinscription à tout moment.
```

**Placement :** Cette section peut être :
- Dans le footer (newsletter secondaire)
- Avant la CTA liste d'attente (pour capturer ceux pas encore prêts)
- Dans une popup modale (avec retenue)

---

#### Section CTA Finale (Liste d'attente)

```
Construisons l'avenir ensemble

[Email *] _________________________________

Vous êtes :
○ Investisseur particulier  ○ Professionnel

Votre broker actuel :
○ Alpaca  ○ Interactive Brokers  ○ Saxo  ○ Autre  ○ Aucun

Votre expérience :
○ Débutant  ○ Intermédiaire  ○ Avancé

Message (optionnel) :
[_________________________________]

[Rejoindre la liste d'attente]

Accès progressif à l'application (app.bubbleinvest.org). 
On ouvre petit à petit pour bien accompagner chaque utilisateur.
Vous serez informé par email quand c'est votre tour.
```

**Design :**
- Formulaire compact mais clair
- Radio buttons stylisés (pas natifs)
- Bouton principal : full width sur mobile

---

## 2. PAGE DÉMO — `/demo` (ou `/playground`)

> **Base à réutiliser :** `/src/frontend/pages/investors/playground.html` (page existante à renommer/repositionner)

### Objectif
Montrer l'interface unifiée (de l'app complète) en action via animations/enregistrements pour convaincre de s'inscrire à la liste d'attente.

### Clarification
Cette page montre ce à quoi ressemble **l'application complète** (app.bubbleinvest.org) via des animations. Ce n'est pas l'app elle-même, qui nécessite un accès par liste d'attente.

### Structure

```
┌─────────────────────────────────────┐
│  HEADER (simplifié)                 │
│  Logo + [Retour à l'accueil]        │
├─────────────────────────────────────┤
│  TITRE                              │
│  "Découvrez Bubble en action"       │
├─────────────────────────────────────┤
│  INTERFACE DÉMO (3 onglets)         │
│                                     │
│  [Agent] [Builder] [Arena]          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │   CONTENU ANIMÉ/ENREGISTRÉ  │    │
│  │   selon l'onglet actif      │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  [Lancer le chat live] ← Chatbot réel│
├─────────────────────────────────────┤
│  CTA FINALE                         │
│  "Prêt à utiliser Bubble pour vous ?"│
│  [Rejoindre la liste d'attente]     │
└─────────────────────────────────────┘
```

### Contenu des Onglets

#### Onglet 1 : Agent (Démo conversation)

**Animation :** GIF/video de 15-20s montrant :
```
User : "Je veux investir avec 60% actions US, 30% obligations, 10% or"
Agent : "D'accord. Quel horizon ?"
User : "10 ans"
Agent : [Génère allocation + graphique projection]
```

**Sous l'animation :**
> Discutez en langage naturel. L'agent comprend votre profil, vos objectifs, vos contraintes.

---

#### Onglet 2 : Builder (Démonstruction stratégie)

**Animation :** GIF/video de 15-20s montrant :
```
[Interface avec sliders/options]
User ajuste : Actions US 50% → Émergents 20% → Or 10% → Obligations 20%
[Click "Backtest"]
[Affichage résultat : +X% sur 20 ans, drawdown max Y%]
```

**Sous l'animation :**
> Construisez et testez vos stratégies sur 20 ans d'historique avant d'investir.

---

#### Onglet 3 : Arena (Visualisation performance)

**Animation :** GIF/video de 15-20s montrant :
```
[Timeline horizontale]
2008 → 2009 → ... → 2024
Marqueurs : Crise financière, COVID, etc.
Ligne de performance qui réagit
Détails au survol
```

**Sous l'animation :**
> Visualisez comment vos stratégies ont résisté aux crises historiques.

---

#### Chat Live

**Bouton flottant ou section en bas :**
```
[💬 Parler à l'agent]

Une question ? Discutez avec notre agent (version démo).
Note : C'est une démo. Pour exécuter réellement, rejoignez la liste d'attente.
```

**Comportement :** Ouvre un chatbot simple (comme celui actuel mais plus limité)
- Session uniquement (pas de sauvegarde)
- Réponses préparées pour les FAQs
- Si question complexe : "Rejoignez la liste d'attente pour accéder à l'agent complet"

---

## 3. PAGE B2B — `/solutions` (ou `/professionnels`)

### Objectif
Générer des leads qualifiés (CGP, sociétés de gestion, indépendants).

### Structure

```
┌─────────────────────────────────────┐
│  HEADER standard                    │
├─────────────────────────────────────┤
│  HERO                               │
│  "L'automatisation qu'on déploie    │
│   pour nous, à votre service"       │
├─────────────────────────────────────┤
│  NOTRE EDGE                         │
│  "Toujours sur la balle"            │
├─────────────────────────────────────┤
│  SERVICES (3 niveaux)               │
│  Diagnostic → Automatisation → Projet│
├─────────────────────────────────────┤
│  QUI ON SERT / QUI ON NE SERT PAS   │
├─────────────────────────────────────┤
│  MÉTHODOLOGIE (4 étapes)            │
├─────────────────────────────────────┤
│  APPEL À L'ACTION                   │
│  Formulaire de contact              │
│  + Calendly pour call stratégique   │
└─────────────────────────────────────┘
```

### Contenu Clés

#### Section Services

```
De l'idée au déploiement

┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Diagnostic  │ →  │ Automatisation│ → │ Projet      │
│ Diagnostic  │    │ Ciblé       │    │ Complet     │
├─────────────┤    ├─────────────┤    ├─────────────┤
│ Audit de vos│    │ Développement│   │ Transformation│
│ processus.  │    │ ciblé :      │    │ complète :  │
│             │    │ reporting,   │    │ intégration,│
│ Identification│  │ alertes,     │    │ formation,  │
│ des gains   │    │ workflows.   │    │ transfert.  │
│ rapides.    │    │             │    │             │
├─────────────┤    ├─────────────┤    ├─────────────┤
│ 2-3 semaines│    │ 4-8 semaines│    │ 2-4 mois    │
└─────────────┘    └─────────────┘    └─────────────┘
```

#### Section Formulaire + Call

```
Parlons de vos processus

[Nom *] ___________________
[Email *] ___________________
[Société] ___________________
[Rôle] ___________________

Votre situation : 
○ CGP / Family Office
○ Société de gestion
○ Indépendant
○ Autre : _____

Ce que vous souhaitez automatiser :
[_________________________]

[Envoyer]

─── OU ───

[📅 Prendre un rendez-vous directement]
← Intégration Calendly 30 min
```

---

## 4. PAGE MISSION — `/mission` (ou `/a-propos`)

### Objectif
Raconter l'histoire, créer connexion émotionnelle.

### Sections

```
Pourquoi on a créé Bubble
[Storytelling fondateur]

Nos Convictions
1. Bienveillance > Compétition
2. Transparence = avantage
3. Autonomie > Dépendance  
4. Build in public = plus fort

Qui on est

**Joris Dupraz** & **Jade Hoang** — Deux anciens gestionnaires de fonds.

Un passeport tech, un passeport finance.  
Un optimiste, un pragmatique.

On ne cherche pas à devenir des icônes.  
Bubble n'est pas notre histoire — c'est la vôtre.

*[Photos à venir — style N&B ou couleur naturelle à définir]*

Suivre notre construction
[Liens Blog | YouTube | LinkedIn | Twitter | Roadmap]
```

---

## 5. PAGE SIMULATEUR — `/simulateur` (Ressources)

> **Base à réutiliser :** `/src/frontend/pages/portfolio-simulator.html` (page existante)

### Nouveau Positionnement
**Déplacer dans le menu "Ressources"** — plus dans le menu principal.

### Modifications

**Bannière en haut de page :**
```
⚠️ Outil d'exploration pour les curieux

Ce simulateur vous permet de tester des stratégies sur 20 ans d'historique.
Pour créer vos propres stratégies et les exécuter automatiquement :
→ [Rejoindre la liste d'attente]
```

**Footer de la page :**
- Ajouter CTA vers liste d'attente
- Message : "Prêt à passer à l'action ? Rejoignez la liste d'attente pour l'accès complet."

**Aucune modification structurelle** — garder le simulateur tel quel, juste reprioriser.

---

## 6. Composants Transversaux (Réutilisation 100%)

### Header

```
[Logo Bubble.]      Produit ▼    Solutions Pro    Ressources ▼    Mission    [Liste d'attente]
                     • Interface    (CTA direct)    • Blog
                     • Tarifs                       • YouTube
                     • Démo                         • Documentation
```

**Mobile :** Hamburger menu

### Footer

```
Produit          Solutions Pro      Ressources          Légal
• Interface      • Pour CGP         • Blog              • Mentions légales
• Tarifs         • Pour sociétés    • YouTube           • Confidentialité
• Démo           • Contact          • Documentation     • Cookies

Mission
• Notre histoire
• Construire en public

Newsletter
• IA/Finance — Veille **2x par semaine** (profils Tech/Finance/Équilibré)
• Inscription

Contact
contact@bubbleinvest.org
LinkedIn | Twitter/X

© 2026 Bubble Invest — Transparent by design
```

---

## 7. Spécifications Design — Charte Graphique Bubble

> **Source :** `docs/company/Charte Graphique Bubble.md`

### Palette de Couleurs

| Élément | Hex | Usage |
|---------|-----|-------|
| **Blanc** | `#FFFFFF` | Arrière-plan principal (privilégié) |
| **Noir** | `#000000` | Logo, textes principaux, contours |
| **Gris Foncé (Primary)** | `#333333` | Titres, boutons principaux |
| **Gris Foncé Hover** | `#444444` | États de survol |
| **Gris Clair (Card)** | `#F8F8F8` | Arrière-plans de cartes, sections alternées |
| **Gris Très Clair** | `#EEEEEE` | Bordures, séparateurs |
| **Gris Moyen** | `#666666` | Textes secondaires |
| **Violet (Charts)** | `#667eea` | Graphiques, points d'accent, états "après" |
| **Violet Clair** | `rgba(102, 126, 234, 0.08)` | Fonds de cartes colorées |

### Typographie — Inter (Google Fonts)

| Élément | Taille | Poids | Espacement | Notes |
|---------|--------|-------|------------|-------|
| **H1 Hero** | 3.5rem (mobile) / 4rem (desktop) | 800 (Extra Bold) | -0.03em | — |
| **H2 Sections** | clamp(1.7rem, 4vw, 2.5rem) | 700 (Bold) | -0.02em | — |
| **H3 Cartes** | 1.75rem | 700 (Bold) | — | — |
| **H4 Features** | clamp(1.15rem, 2.5vw, 1.5rem) | 700 (Bold) | — | — |
| **Corps** | 1rem / 1.1rem | 400 (Regular) | 1.6-1.8 | Couleur #444444 |
| **Tagline** | 1.5rem | 500 (Medium) | — | **Toujours en italique** |

### Composants

**Bouton Principal (CTA) :**
```css
background: linear-gradient(135deg, #333333 0%, #444444 100%);
color: white;
padding: 1.1rem 2.5rem;
border-radius: 50px; /* Forme de pilule */
font-weight: 600;
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
```
**Hover :** `background: #6b7280;`

**Bouton Secondaire :**
```css
background: rgba(255, 255, 255, 0.6);
border: 1px solid rgba(255, 255, 255, 0.3);
color: #333333;
backdrop-filter: blur(4px);
```

**Bouton Submit (Circulaire) :**
```css
background: linear-gradient(135deg, rgba(107, 114, 128, 0.9), rgba(107, 114, 128, 0.7));
border-radius: 50%;
width: 40px;
height: 40px;
/* Icône : flèche vers le haut */
```

**Cards :**
```css
background: white; /* ou #F8F8F8 */
border-radius: 24px; /* Standard unifié */
padding: 2rem;
/* Hover : translateY(-5px) + shadow renforcée */
```

**Champs de Saisie :**
```css
background: rgba(255, 255, 255, 0.6);
border: 1px solid rgba(255, 255, 255, 0.3);
border-radius: 50px; /* Forme de pilule */
/* Focus : bordure #333333 */
```

**Glassmorphisme (Chat Interface) :**
```css
background: rgba(255, 255, 255, 0.7);
border: 1px solid rgba(255, 255, 255, 0.3);
backdrop-filter: blur(10px);
```

### Animation Logo (Au survol)
```css
/* Cercle : stroke-dashoffset animation sur 0.6s */
/* Point : scale(0→1) + translateY(-10px→0) sur 0.3s (démarrage à 0.5s) */
/* Timing : cubic-bezier(0.25, 0.1, 0.25, 1) */
```

### Responsive

| Élément | Desktop | Tablet | Mobile | Petit Mobile |
|---------|---------|--------|--------|--------------|
| **Icônes** | 24-32px | 20-28px | 20-28px | 18-24px |
| **Charts** | 400px | 350px | 280-300px | 240-250px |
| **Touch targets** | — | — | 44px min | 44px min |
| **Font size input** | 16px | 16px | 16px | 16px |

### Interdictions ❌
- Modifier les proportions du logo
- Omettre le point final de "Bubble."
- **Écrire "Bubble." en vertical si espace insuffisant** → utiliser symbole seul
- Utiliser des fonds sombres (sauf contrainte absolue)
- Omettre l'italique sur les taglines

---

## 8. PAGE NEWSLETTER (Optionnelle) — `/newsletter`

> **Base à réutiliser :** Réutiliser structure formulaire de `/src/frontend/pages/index.html` (section waitlist)

### Objectif
Page dédiée pour les visiteurs qui veulent uniquement s'abonner à la newsletter sans rejoindre la liste d'attente principale.

### Structure

```
┌─────────────────────────────────────┐
│  HEADER standard                    │
├─────────────────────────────────────┤
│  TITRE                              │
│  "Veille IA & Finance"              │
│                                     │
│  **Deux fois par semaine**, recevez │
│  notre sélection personnalisée des  │
│  actualités qui comptent.           │
│                                     │
│  [Email *] ___________________      │
│                                     │
│  Fréquence préférée :               │
│  ○ Quotidienne  ○ Hebdomadaire      │
│                                     │
│  [S'abonner]                        │
│                                     │
│  ─── Exemple de contenu ───         │
│  [Aperçu d'une newsletter récente]  │
│                                     │
│  ─── Ce que vous recevez ───        │
│  • Actualités IA pertinentes        │
│  • Analyses marché                  │
│  • Outils découverts                │
│  • Veille réglementaire             │
└─────────────────────────────────────┘
```

**Note :** Cette page peut être intégrée dans le footer ou les ressources plutôt que navigation principale.

---

## 9. Assets à Préparer

### Vidéos/GIFs Animations — Enregistrement Interface Actuelle

**Source :** `app.bubbleinvest.org` (interface existante)

1. **demo-agent.mp4** (15-20s) — Conversation avec l'agent
   - Démarrer chat → Poser question → Réponse avec contexte
   - Enregistrement écran simple, pas de montage complexe

2. **demo-builder.mp4** (15-20s) — Construction de stratégie
   - User input allocation → Génération stratégie → Affichage backtest
   - Montrer la fluidité du dialogue

3. **demo-arena.mp4** (15-20s) — Visualisation timeline
   - Timeline avec événements clés (crises, rallyes)
   - Survol pour détails, curseur temporel

**Format :** MP4, 1080p, sans son (ou musique libre de droits très discrète)

### Images

1. **Logo** — SVG existant (`bubble-logo-single.svg`)
2. **Mockup interface** — Screenshot stylisé du chatbot (glassmorphism)
3. **Schéma Selfware** — Illustration simple (User → Agent → Broker)
   - Style : lignes fines, icônes minimalistes
   - Couleurs : noir #000000 + violet #667eea pour accent

4. **Photos des Fondateurs** — **À recevoir**
   - **Joris Dupraz** — Photo portrait
   - **Jade Hoang** — Photo portrait
   - **Style :** Naturel ou N&B selon préférence
   - **Usage :** Section "Qui on est" de la page Mission

### Contenu Texte

#### Témoignages (Placeholders pour les mocks)

**Format placeholder :**
> *"[Citation sur la frustration ETF vs stock picking, et comment Bubble résout ça]."*  
> — **[Prénom N., Profession]**, *Ville*

**Exemples à adapter :**
1. Développeur : *"J'étais à 100% MSCI World. Je voulais surpondérer la tech sans y passer mes week-ends."*
2. Consultant : *"Enfin un outil qui exécute mes décisions sans me déposséder de mes actifs."*
3. Entrepreneur : *"La transparence sur les frais et les décisions — c'est ce qui m'a convaincu."*

**Status :** Placeholders pour les mocks → Remplacer par vrais témoignages dès que possible

#### Études de cas B2B
- **Cas 1 :** CGP — Automatisation reporting (placeholder)
- **Cas 2 :** Société de gestion — Alertes déséquilibres (placeholder)
- **Cas 3 :** Indépendant — Workflow veille (placeholder)

#### FAQ
- 5-10 questions récurrentes à rédiger

#### Newsletter IA/Finance
- **Fréquence :** **2x par semaine** (ex: mardi et vendredi)
- **Profils :** Contenu personnalisé selon 3 profils :
  - **Tech** — Focus IA, nouveaux outils, innovations
  - **Finance** — Marchés, réglementation, stratégies
  - **Équilibré** — Mix des deux
- **Sources :** 12+ newsletters agrégées (The Rundown AI, TLDR, a16z, etc.)
- **Template :** Existe déjà (système en production)
- **Rubriques :** Veille IA, Actu marché, Outils découverts, Blog Bubble

---

## 10. Plan de Réalisation des Mocks

### Étape 1 : Wireframes (Figma/Whimsical)
- [ ] Homepage — structure des sections
- [ ] Page Démo — 3 onglets
- [ ] Page B2B — layout services
- [ ] Page Newsletter (optionnel)
- [ ] Navigation + Footer

### Étape 2 : Design Visuel (Figma)
- [ ] Homepage — design complet
- [ ] Démo — interface mockée
- [ ] B2B — layout final
- [ ] Composants (boutons, formulaires, cards)

### Étape 3 : Prototype Interactif (Figma)
- [ ] Liens entre pages
- [ ] États hover/active
- [ ] Navigation mobile

### Étape 4 : Revue & Ajustements
- [ ] Test utilisateur informel
- [ ] Ajustements copy/design
- [ ] Validation finale

---

## 11. Questions Ouvertes / Réponses

| # | Question | Réponse | Status |
|---|----------|---------|--------|
| 1 | **Photos d'équipe** | Photos réelles des fondateurs : **Joris Dupraz** & **Jade Hoang** | **À recevoir** |
| 2 | **Vidéos démo** | Enregistrement de l'interface actuelle (`app.bubbleinvest.org`) | ✅ Décidé |
| 3 | **Témoignages** | Placeholders pour les mocks, remplacer par vrais plus tard | ✅ Décidé |
| 4 | **Calendly B2B** | Compte existant ou à créer ? | **À préciser** |
| 5 | **Newsletter fréquence** | **2x par semaine** (décidé) | ✅ **Confirmé** |
| 6 | **Newsletter format** | Template existant ou à créer ? | **À préciser** |
| 7 | **Style photos fondateurs** | N&B ou couleur naturelle ? | **À préciser** |

### Prochaines Actions

**De votre côté :**
- [ ] Envoyer photos Joris Dupraz & Jade Hoang
- [ ] Confirmer style (N&B vs couleur)
- [ ] Préciser format newsletter (template existant ?)
- [ ] Confirmer Calendly (compte existant ?)

**De notre côté :**
- [ ] Enregistrer les 3 vidéos démo sur `app.bubbleinvest.org`
- [ ] Créer les témoignages placeholders
- [ ] Finaliser les wireframes Figma/Whimsical

---

## 📊 Récapitulatif Réutilisation

| Page | Base Existante | Réutilisation | Création |
|------|---------------|---------------|----------|
| **Homepage** `/` | `index.html` | ~80% | Sections Selfware + Différenciation |
| **Démo** `/demo` | `investors/playground.html` | ~90% | Renommer, repositionner |
| **B2B** `/solutions` | `professionals/index.html` + `solutions-*.html` | ~70% | Fusion + nouveau copy |
| **Mission** `/mission` | ⚠️ Aucune | — | **Page nouvelle** |
| **Simulateur** `/simulateur` | `portfolio-simulator.html` | ~95% | Bannière + CTA |
| **Blog** `/blog` | `blog.html` | ~100% | Contenu uniquement |
| **Newsletter** `/newsletter` | Formulaire `index.html` | ~80% | Structure page |
| **Header** | Composant existant | ~100% | Mise à jour liens |
| **Footer** | Composant existant | ~100% | Mise à jour liens |

**Taux global de réutilisation : ~85%**

---

*Document de spécification — Version 1.1 (avec réutilisation)*
