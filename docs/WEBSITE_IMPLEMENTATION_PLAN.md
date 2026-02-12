# Plan d'Intégration Website — Bubble Invest
**Basé sur :** Strategy Brief v1.0 | **Date :** Février 2026

---

## Vue d'Ensemble

Ce document traduit la stratégie en modifications concrètes du website. Chaque section = une page ou un composant avec : contenu, structure, et appels à l'action.

---

## 1. HOMEPAGE — `/` 

### Objectif
Capturer l'attention des investisseurs avertis frustrés, établir la crédibilité par la transparence, diriger vers le bon parcours (B2C ou B2B).

---

### Section Hero

**Structure :**
```
[Logo Bubble.]

# Investissement actif automatisé.
# Vous gardez le contrôle.

Au cœur de Bubble, une conviction : la bienveillance crée plus de valeur que la compétition.
Notre mission — vous élever, pas vous rendre dépendant.

[CTA Primaire] Rejoindre la liste d'attente
[CTA Secondaire] Solutions pour professionnels →
```

**Éléments visuels :**
- Aucune image stock
- Éventuellement : screenshot réel de l'interface conversationnelle (flouté si nécessaire)
- Ou : simple typographie épurée, espace blanc

---

### Section Le Vrai Problème (Nouvelle)

**Titre :**
> **Coincé entre l'ETF trop simple et le stock picking trop chronophage ?**

**Contenu :**

Vous connaissez les marchés. Vous suivez l'actualité financière. Vous savez ce qu'est un ETF.

Mais vous êtes coincé :

• **Trop simple** — 100% MSCI World, allocation figée, aucune personnalisation
• **Trop chronophage** — stock picking actif, heures à passer des ordres, surveillance constante
• **Trop opaque** — robo-advisors boîte noire, impossible de comprendre les décisions
• **Trop cher** — pourcentage sur vos actifs, incentives désalignés

Vous voulez investir activement, avec vos convictions (secteurs, géographies, thématiques).
Mais sans y consacrer 10 heures par semaine.

**On a créé Bubble Invest pour nous. On vous le partage.**

---

### Section Solution — "Sans Friction, Sans Intermédiaires, Sans Boîte Noire"

**Titre :**
> **Investissement actif, sans la charge opérationnelle**

**Grid 2x3 (ou accordéon mobile) :**

| | |
|---|---|
| **🗣️ Une interface, tout l'investissement** | Agent conversationnel, construction de stratégies, backtests, visualisation — tout dans une seule conversation. |
| **📊 Backtests avant engagement** | Testez chaque stratégie sur 10-20 ans d'historique. Voyez comment elle réagit aux crises. Pas de surprises. |
| **⚡ Exécution automatisée** | Connexion à votre broker (Alpaca, Interactive Brokers...). L'agent passe les ordres, rééquilibre, surveille. |
| **🔍 Stratégies explicables** | Vous voyez les règles. Vous comprenez chaque décision. Pas d'algorithme opaque. |
| **💼 Au-delà des ETFs (Pro)** | Automatisation de la sélection d'actions pour les portefeuilles avancés. |
| **🔒 Vos actifs restent les vôtres** | On ne détient jamais votre argent. Connexion directe à votre compte existant. |

**Note de transparence (sous le grid) :**
> *Transparence sur les limites : l'exécution automatique fonctionne sur compte-titres ordinaire (CTO). Les PEA et assurances-vie ne permettent pas l'automatisation pour l'instant (contraintes réglementaires). Notre objectif : faire évoluer ces limites, mais on ne promet que ce qu'on peut faire aujourd'hui.*

---

### Section Selfware (Nouvelle — Différenciation Clé)

**Titre :**
> **Vos actifs restent chez votre broker. On ne les touche jamais.**

**Contenu :**

On ne veut pas être un nouvel intermédiaire qui détient votre patrimoine.

**Comment ça marche :**
1. Vous connectez votre compte broker existant (Alpaca, Interactive Brokers, et bientôt d'autres)
2. L'agent analyse, suggère, prépare les ordres
3. **Vous validez** — chaque décision passe par votre approbation (ou en mode automatique si vous le souhaitez)
4. L'exécution se fait sur votre compte, à votre nom

Vos actifs ne bougent jamais de chez votre broker.
On ne fait que vous donner l'intelligence pour décider mieux, plus vite.

**"Selfware"** — Un logiciel qui vous donne les outils pour être autonome, sans vous enfermer.

---

### Section Build in Public (Nouvelle — Preuve par la Transparence)

**Titre :**
> **On construit en public**

**Contenu :**

On partage nos doutes, nos victoires, nos erreurs.
Parce qu'on croit que la confiance se mérite par la transparence, pas par le marketing.

**Où nous suivre :**
- **[Blog] —** Ce qu'on apprend, nos pivots, nos décisions techniques
- **[Newsletter IA/Finance] —** Veille personnalisée **2x par semaine** (profils Tech/Finance/Équilibré)
- **[YouTube] —** Behind the Bubble : construction, explications, coulisses  
- **[LinkedIn/Twitter] —** Réflexions au jour le jour, annonces
- **[Roadmap publique] —** Ce qu'on construit, ce qu'on reporte, pourquoi

*[Aperçu du dernier article / vidéo]*

---

### Section Différenciation Silencieuse (Nouvelle)

**Titre :**
> **Ce qu'on dit, ce qu'on ne dit pas**

**List (check icon) :**

✓ **On ne prendra jamais de pourcentage sur vos actifs.** Abonnement fixe, quel que soit votre patrimoine.  
✓ **On ne détient jamais vos actifs.** Connexion directe à votre broker.  
✓ **Vous voyez exactement comment les décisions sont prises.** Règles transparentes, backtests inspectables.  
✓ **Si une stratégie ne vous convient pas, vous la modifiez.** Ou vous en créez une nouvelle.  
✓ **S'il y a une limitation, vous la verrez avant de payer.** On préfère perdre un client que vendre de l'opaque.

---

### Section B2B Teaser

**Titre :**
> **Vous accompagnez des clients sur leurs investissements ?**

**Contenu :**

CGP, sociétés de gestion, indépendants — on déploie les dernières solutions d'automatisation dès leur sortie.
Souvent parmi les premiers en France.

**Ce qu'on fait :**
- Diagnostic rapide
- Automatisations ciblées (intégrations API, déploiement d'agents)
- Applications sur mesure
- Support & suivi personnalisé 

**CTA :** [Voir nos solutions B2B →]

---

### Section Preuve Sociale (Nouvelle)

**Titre :**
> **Ils investissent avec Bubble**

**Contenu (à remplir au fur et à mesure) :**

- "XXX investisseurs actifs sur la liste d'attente"
- Témoignages (avec photo, nom, métier — pas "Customer X")
- Logos B2B (avec autorisation)

**Premier témoignage placeholder :**
> *"J'étais à 100% MSCI World. Je voulais surpondérer la tech et l'Asie, mais je n'avais pas le temps de gérer moi-même. Bubble me permet d'avoir un portefeuille personnalisé, sans y passer mes week-ends."*
> — [Nom], [Métier], [Ville]

---

### Section CTA Finale

**Titre :**
> **Construisons l'avenir ensemble**

**Formulaire liste d'attente (simplifié) :**

```
Email * ___________________

Vous êtes : 
○ Investisseur particulier
○ Professionnel (CGP, gestionnaire, etc.)

Votre broker actuel (si applicable) :
○ Alpaca  ○ Interactive Brokers  ○ Saxo  ○ Autre : _____  ○ Aucun

Votre expérience investissement :
○ Débutant (je découvre)  
○ Intermédiaire (je connais les bases)
○ Avancé (j'investis régulièrement)

Une chose à nous dire ? (optionnel)
[_________________________]

[Rejoindre la liste d'attente]
```

**Note sous le formulaire :**
> Accès progressif. L'application complète (app.bubbleinvest.org) n'est pas encore ouverte au public. On ouvre petit à petit pour bien accompagner chaque utilisateur. Vous serez informé par email quand c'est votre tour.

---

## 2. PAGE B2B — `/solutions` ou `/professionnels`

### Objectif
Convertir les professionnels de la finance (CGP, sociétés de gestion, indépendants) en leads qualifiés.

---

### Section Hero

**Titre :**
> **L'automatisation qu'on déploie pour nous, à votre service**

**Sous-titre :**
> Pour CGP, sociétés de gestion, et indépendants qui veulent garder une longueur d'avance.

**CTA :** [Prendre rendez-vous]  
**CTA Secondaire :** [Voir nos cas d'usage]

---

### Section Notre Edge

**Titre :**
> **Toujours sur la balle**

**Contenu :**

Les solutions qu'on propose sont souvent sorties il y a quelques semaines.
On est parmi les premiers en France à les maîtriser et à les déployer.

**Ce que ça signifie pour vous :**
- Vous testez les outils d'automatisation avant vos concurrents
- Vous validez rapidement ce qui fonctionne (ou pas)
- Vous gardez une longueur d'avance sur le marché

---

### Section Services

**Titre :**
> **De l'idée au déploiement**

**3 colonnes :**

| Diagnostic | Automatisation | Projet Complet |
|------------|----------------|----------------|
| Sur devis | Sur devis | Sur devis |
| Audit de vos processus actuels. Identification des gains d'automatisation rapides. | Développement ciblé : reporting, alertes, workflows récurrents. | Transformation complète : intégration système, formation, documentation. |
| **Livrable :** Rapport d'opportunités priorisées | **Livrable :** Solution opérationnelle + formation | **Livrable :** Système automatisé + transfert de compétences |
| *2-3 semaines* | *4-8 semaines* | *2-4 mois* |

---

### Section Qui On Sert

**Titre :**
> **À qui on s'adresse**

**Grid :**

**CGP & Family Offices**  
Automatisation du reporting client, alertes de rééquilibrage, veille réglementaire.

**Sociétés de Gestion**  
Outils d'analyse quantitative, backtesting interne, génération de commentaires de performance.

**Indépendants**  
Workflows personnalisés, gain de temps sur les tâches récurrentes, montée en compétence sur l'automatisation.

**On ne s'adresse pas à :**  
Grandes banques (trop lents), institutions avec cycles de décision > 6 mois (on préfère l'action rapide).

---

### Section Méthodologie

**Titre :**
> **Comment on travaille**

**Processus en 4 étapes :**

1. **Diagnostic (gratuit, 30 min)** — On comprend vos processus, vos douleurs, vos objectifs.
2. **Proposition chiffrée** — Scope clair, budget fixe, délais réalistes. Pas de surprise.
3. **Développement itératif** — Livraisons toutes les 2 semaines, ajustements en cours de route.
4. **Transfert de compétences** — Vous devenez autonome. On reste disponible, mais on ne crée pas de dépendance.

---

### Section Cas d'Usage (À venir)

**Titre :**
> **Exemples concrets**

*[Placeholder pour études de cas]*

- Cas 1 : CGP — Automatisation du reporting trimestriel
- Cas 2 : Société de gestion — Système d'alerte sur déséquilibres de portefeuille
- Cas 3 : Indépendant — Workflow de veille et de synthèse

---

### Section CTA

**Titre :**
> **Parlons de vos processus**

**Formulaire :**
```
Nom * ___________________
Email * ___________________
Société ___________________
Rôle ___________________

Votre situation : 
○ CGP / Family Office
○ Société de gestion  
○ Indépendant
○ Autre : _____

Ce que vous souhaitez automatiser :
[_________________________]

[Envoyer]
```

**Note :**
> On vous répond sous 24h. Le premier diagnostic est gratuit et sans engagement.

---

## 3. PAGE ABOUT / MISSION — `/mission` ou `/a-propos`

### Objectif
Raconter l'histoire, ancrer la crédibilité émotionnelle, expliquer le "pourquoi".

---

### Section Notre Histoire

**Titre :**
> **Pourquoi on a créé Bubble**

**Contenu (format storytelling) :**

On a passé 6 ans dans la gestion de fonds et les grandes banques.
À côtoyer quotidiennement ce qu'on appelle "la haute finance".

Et on s'est rendu compte de deux choses :

**Premièrement** — Les investisseurs individuels paient trop cher pour un service opaque. Des frais qui ne reflètent pas la valeur réelle créée.

**Deuxièmement** — Les méthodes de travail dans le secteur sont archaïques. À l'ère de l'automatisation, la plupart des sociétés de gestion utilisent encore Excel de façon primitive.

On a quitté nos emplois confortables pour construire l'outil qu'on voulait pour nous.

**Un outil qui :**
- Automatise l'investissement actif, sans nous déposséder de nos actifs
- Explique chaque décision, sans jargon inutile
- Coûte un abonnement fixe, pas un pourcentage de notre patrimoine

Et on a décidé de le construire en public.
Parce qu'on croit que la confiance se mérite par la transparence.

---

### Section Nos Convictions

**Titre :**
> **Ce en quoi on croit**

**4 convictions :**

**1. La bienveillance crée plus de valeur que la compétition**  
Notre objectif n'est pas de battre les autres. C'est d'élever chaque personne qui nous fait confiance.

**2. La transparence est un avantage compétitif**  
Montrer nos forces ET nos faiblesses. Dire ce qu'on sait faire ET ce qu'on ne sait pas encore faire.

**3. L'autonomie vaut plus que la dépendance**  
On ne veut pas de clients accros. On veut des investisseurs compétents qui comprennent leurs choix.

**4. Construire en public, cêtre plus fort**  
Partager nos apprentissages, nos erreurs, nos pivots — ça nous rend meilleurs et ça crée de la confiance.

---

### Section L'Équipe

**Titre :**
> **Qui on est**

**Contenu :**

J & J — Deux anciens gestionnaires de fonds.
Un passeport tech, un passeport finance.
Un optimiste, un pragmatique.

On ne cherche pas à devenir des icônes. On veut rester anonymes.
Parce que Bubble n'est pas notre histoire — c'est la vôtre.

*[Photos optionnelles — ou illustration anonyme]*

---

### Section Build in Public (Approfondi)

**Titre :**
> **On partage tout"

**Liens :**
- Roadmap publique (Notion)
- Chaîne YouTube "Behind the Bubble"
- Chaîne Substack
- Blog technique
- GitHub (si applicable)

---

## 4. PAGE PRICING — `/pricing` ou `/tarifs`

### Structure

| Découverte | Investisseur | Pro | B2B |
|------------|--------------|-----|-----|
| **Gratuit** | **€8/mois** | **€29/mois** | **Sur devis** |
| Pour découvrir | Pour investir activement | Pour les plus exigeants | Pour les professionnels |
| • Agent limité (X messages/mois) | • Agent illimité | • Tout Investisseur + | • Solutions sur mesure |
| • 1 stratégie active | • Stratégies personnalisées illimitées | • Sélection d'actions automatisée | • Déploiement rapide |
| • Backtests basiques | • Exécution automatisée | • Accès API | • Formation équipe |
| | • Tous les brokers disponibles | • Support prioritaire | • Support dédié |
| | | • Backtests avancés | |

**Note sous le tableau :**
> *On ne prend jamais de pourcentage sur vos actifs. Quel que soit votre patrimoine, le prix reste le même.*

---

## 5. INTERFACE UNIFIÉE — `/app` ou `/dashboard`

### Concept
Une interface unique, centrée sur l'**agent conversationnel**, qui intègre :
- **Agent** — Conversation, profil, recommandations
- **Strategy Builder** — Construction de stratégies via dialogue (ex-simulateur)
- **Arena** — Visualisation des performances des stratégies (ex-arena)
- **Portfolio** — Vue de vos portefeuilles connectés
- **Backtests** — Tests historiques des stratégies

L'utilisateur navigue entre ces modes **par la conversation**, pas par des menus.

---

### Structure de l'Interface

```
┌─────────────────────────────────────────────────────────────┐
│  [Sidebar]                          [Zone de Conversation]  │
│  • Profil                           ┌─────────────────────┐ │
│  • Portefeuilles                    │                     │ │
│  • Stratégies                       │   Conversation      │ │
│  • Historique                       │   avec l'agent      │ │
│                                     │                     │ │
│  [Modes Contextuels]                │   [Input texte]     │ │
│  💬 Discuter                        └─────────────────────┘ │
│  🏗️ Construire une stratégie                               │
│  📊 Visualiser (Arena)                                     │ │
│  📈 Backtester                                             │ │
└─────────────────────────────────────────────────────────────┘
```

---

### Navigation par Intention (Conversation-Driven)

Au lieu de cliquer sur "Simulateur" ou "Arena", l'utilisateur dit :

| Ce que l'utilisateur veut | Ce qu'il dit | Ce que l'agent fait |
|---------------------------|--------------|---------------------|
| Créer une stratégie | *"Je veux tester une stratégie 60/40 avec 10% d'or"* | Passe en mode **Strategy Builder**, génère la stratégie, affiche le backtest |
| Voir des performances | *"Montre-moi comment cette stratégie a performé en 2008"* | Passe en mode **Arena/Timeline**, affiche la visualisation |
| Comparer des approches | *"Compare l'égal weight et le risk parity"* | Affiche la **comparaison côte à côte** dans la conversation |
| Exécuter | *"Valide et exécute sur mon compte"* | Passe en mode **Exécution**, montre l'aperçu des ordres |

---

### Les 4 Modes de l'Agent

#### Mode 1 : Conversation (Défaut)
**Objectif :** Comprendre le profil, répondre aux questions, guider.

**Exemples d'échanges :**
> *"Quel est mon profil de risque actuel ?"*  
> → L'agent affiche le profil découvert + visualisation

> *"Je veux plus d'exposition aux émergents, comment faire ?"*  
> → L'agent suggère des ajustements + backtest

---

#### Mode 2 : Strategy Builder (ex-Simulateur)
**Objectif :** Construire et tester des stratégies via dialogue.

**Flux typique :**
```
Utilisateur : "Je veux une stratégie avec 50% actions US, 30% obligations, 20% or"
Agent : "D'accord. Quel ETF pour les actions US ? SPY, VTI, ou autre ?"
Utilisateur : "SPY"
Agent : "Pour les obligations — court terme (SHY), moyen (IEF), ou long (TLT) ?"
[...]
Agent : "Stratégie créée. Je lance le backtest sur 20 ans ?"
→ [Affichage du backtest dans la conversation]
```

**Affichage :**
- Graphique de performance (embed dans le chat)
- Métriques clés (rendement, volatilité, drawdown max)
- Tableau des allocations année par année
- CTA : "Tester autre chose" / "Sauvegarder cette stratégie" / "Exécuter sur mon compte"

---

#### Mode 3 : Arena (Visualisation)
**Objectif :** Voir les performances historiques et comparer.

**Flux typique :**
```
Utilisateur : "Montre-moi comment mes stratégies ont résisté aux crises"
Agent : "Voici la période 2008-2009 pour vos 3 stratégies actives :"
→ [Visualisation Arena : timeline avec événements clés, décisions des stratégies, performances]
```

**Affichage :**
- Timeline interactive (scroll horizontal)
- Marqueurs d'événements (crises, rallyes)
- Décisions prises par chaque stratégie
- Curseur temporel pour voir l'évolution
- Comparaison côte à côte

---

#### Mode 4 : Portfolio (Vue d'ensemble)
**Objectif :** Voir ses portefeuilles connectés, leurs performances, alertes.

**Contenu :**
- Liste des comptes brokers connectés
- Allocation actuelle vs cible
- Alertes (rééquilibrage nécessaire, opportunités)
- Historique des ordres passés par l'agent

---

### Transition Entre Modes

**Automatique :** L'agent détecte l'intention et switch de mode.  
**Manuelle :** L'utilisateur peut dire *"Passe en mode construction"* ou cliquer sur les icônes de mode dans la sidebar.

**Indicateur visuel :** Le nom du mode actuel apparaît dans l'en-tête de la conversation :
> 💬 **Conversation** | 🏗️ **Construction** | 📊 **Visualisation** | 📈 **Backtest**

---

## 6. PAGE PLAYGROUND — `/playground` (OPTIONNEL)

### Positionnement
Accès direct à l'**interface unifiée** avec focus sur la découverte de profil.

### Fonctionnement
L'utilisateur arrive directement dans l'agent, qui commence par :  
> *"Bonjour ! Je suis l'agent Bubble. Je vais vous poser quelques questions pour comprendre votre profil — ça prend 2 minutes. Ou si vous préférez, vous pouvez explorer directement."*

**Deux chemins :**
1. **Profil (conversational)** — L'agent pose 5-7 questions pour découvrir le profil
2. **Exploration libre** — L'utilisateur explore Strategy Builder/Arena directement

**À la fin :** CTA vers la liste d'attente ou connexion compte.

---

## 6. PAGE PLAYGROUND — `/playground` (Repensé)

### Nouveau Positionnement
Optionnel, onboarding doux pour ceux qui veulent explorer avant de s'engager.

### Section Hero

**Titre :**
> **Découvrez votre profil d'investisseur**

**Sous-titre :**
> 5 minutes de conversation pour identifier votre tolérance au risque et vos préférences.

**Note :**
> *Cette étape est optionnelle. Vous pouvez aussi rejoindre directement la liste d'attente et commencer avec l'agent complet.*

---

## 7. FOOTER — Global

### Structure

```
[Logo Bubble.] — "Investissement actif automatisé. Vous gardez le contrôle."

Produit          Solutions Pro      Ressources          Légal
• Fonctionnalités • Pour CGP         • Blog (Build in Public) • Mentions légales
• Tarifs          • Pour sociétés    • YouTube           • Confidentialité  
• Liste d'attente • Contact B2B      • Documentation     • Cookies
• Interface                             • FAQ
• Playground (Démo)

Mission
• Pourquoi Bubble
• Notre histoire
• Construire en public

Contact
• contact@bubbleinvest.org
• LinkedIn
• Twitter/X
• Instagram
• Substack

© 2026 Bubble Invest — Transparent by design
```

---

## 8. NAVIGATION — Global

### Structure

```
[Logo Bubble.]                    [Produit ▼]  [Solutions Pro]  [Ressources ▼]  [Mission]  [Liste d'attente]
                                   • Fonctionnalités               • Blog
                                   • Tarifs                       • YouTube  
                                   • Interface                    • Documentation
                                   • Démo (Playground)
```

**Mobile :** Hamburger menu avec mêmes sections.

---

## 9. SEO & Méta-données

### Homepage
```
Title : Bubble — Investissement actif automatisé
Meta : Investissement actif sans la charge opérationnelle. Vos actifs restent chez votre broker. Stratégies transparentes, backtests historiques, exécution automatisée.
```

### B2B
```
Title : Solutions pour professionnels — Bubble
Meta : Automatisation pour CGP et sociétés de gestion. Déploiement des dernières technologies. Diagnostic à projet complet.
```

---

## 10. Plan de Migration (Checklist)

### Phase 1 : Fondation (Semaines 1-2)
- [ ] Réécrire Hero homepage
- [ ] Créer section "Le Vrai Problème"
- [ ] Créer section "Selfware"
- [ ] Créer section "Build in Public"
- [ ] Créer section "Différenciation Silencieuse"
- [ ] Mettre à jour formulaire liste d'attente
- [ ] Mettre à jour navigation
- [ ] Mettre à jour footer

### Phase 2 : B2B (Semaines 3-4)
- [ ] Créer page `/solutions` complète
- [ ] Intégrer formulaire B2B
- [ ] Créer templates d'études de cas (vides pour l'instant)
- [ ] Configurer workflow de lead B2B

### Phase 3 : Contenu (Semaines 5-6)
- [ ] Publier premier article "Build in Public"
- [ ] Publier première vidéo YouTube
- [ ] Créer page Roadmap publique
- [ ] Collecter 3-5 témoignages pour section Preuve Sociale

### Phase 4 : Optimisation (Semaines 7-8)
- [ ] Développer l'interface unifiée (Agent + Strategy Builder + Arena)
- [ ] Intégrer la navigation conversation-driven
- [ ] Repositionner `/playground` comme démo publique de l'interface
- [ ] Implémenter freemium (si applicable)
- [ ] Lancer programme Early Adopter

---

*Document de travail — Version 1.0*
