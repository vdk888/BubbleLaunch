# Contenus Finaux — Bubble Invest Website

> **Version**: 1.0  
> **Date**: 24 Fév 2026  
> **Statut**: En attente validation  
> **Pages**: 4 (FR) + 4 (EN)

---

## 🎯 Rappel Positionnement

**Tagline**: *« L'IA implémentée. Vous gardez l'avance. »*

**Modèle**:
- **B2C** = Vitrine éducative gratuite (contenu, agents en démo, tutos)
- **B2B** = Implémentation agents IA sur mesure (CGP, PME, pros)

**5 Promesses**:
1. Niche Finance × Tech (Deloitte + UBS)
2. Early adopters systématiques
3. Transparence radicale
4. Formation par co-construction
5. Build in Public

---

## 🇫🇷 VERSION FRANÇAISE

---

### PAGE 1 : HOMEPAGE (`index.html`)

#### HEADER (conservé)
```
[Logo Bubble.] — [À Propos] [Particuliers] [Professionnels] [Blog]
```

#### HERO

**Titre visuel**: (Logo Bubble — conservé)

**Description**:
```
On construit des agents IA pour nous — et on vous montre comment faire pareil.
Vitrine d'expertise gratuite pour particuliers. 
Implémentation sur mesure pour professionnels.
```

**Chat placeholder**:
```
Par exemple : "Comment fonctionne votre agent d'investissement ?"
```

#### DUAL PATH CARDS

**Card 1 — Particuliers**:
```
Particuliers
Apprenez en observant ce qu'on a construit

Notre agent d'investissement est un proof of concept public. 
On partage comment il marche (OpenClaw, code, méthodes) pour que 
vous puissiez reproduire — pour vos investissements ou vos propres projets.

• POC 100% transparent — Stack, limites, apprentissages
• Ressources gratuites — Configs, tutos, veille  
• Newsletter — Ce qu'on découvre chaque semaine

[Explorer notre agent]
```

**Card 2 — Professionnels**:
```
Professionnels
Implémentez l'IA dans votre métier — avec les tout derniers outils

CGP, sociétés de gestion, PME. On déploie des agents sur vos systèmes. 
Les solutions qu'on utilise sont sorties il y a quelques semaines — 
on est parmi les premiers en France à les maîtriser.

• Early adopters — Toujours une longueur d'avance
• Co-construction — On build avec vous, pas pour vous
• Autonomie garantie — À la fin, vous n'avez plus besoin de nous

[Discuter de votre projet]
```

#### SECTION BLOG PREVIEW

**Header**:
```
Build in Public
Ce qu'on apprend, ce qu'on pense, ce qu'on partage — gratuitement
```

**Tiles** (avec tags):
- "Notre agent en action : 18 mois de gestion réelle" — **Tag**: Agents en vitrine
- "Comment on automatise la veille réglementaire avec OpenClaw" — **Tag**: Cas d'usage
- "L'IA va-t-elle remplacer les CGP ? Réflexion sur la valeur du conseil" — **Tag**: Essai philosophique

**CTA**:
```
[Voir tous les articles] [S'abonner à la newsletter]
```

#### FOOTER

```
[Logo Bubble.]

L'ère de l'IA a tout changé. Changez avec elle.

[Implémentation]    [Ressources]        [Entreprise]
- Particuliers      - Blog              - À Propos  
- Professionnels    - Newsletter        - Build in Public
                    - Agents & Tutos    - Notre méthode

Réseaux : [LinkedIn] [Instagram] [GitHub] [Substack]

© 2026 Bubble Invest — Contenu gratuit · Expertise sur mesure · Build in Public
```

---

### PAGE 2 : PARTICULIERS (`particuliers.html`)

#### HERO

**Titre H1**:
```
Notre Agent d'Investissement — Un POC Open
```

**Sous-titre**:
```
On a construit un agent IA pour nous avec OpenClaw et du code.
On partage comment ça marche — stack technique, prompts, limites —
pour que vous puissiez reproduire, pour vos investissements ou vos projets.
```

**CTAs**:
- Primaire: "Recevoir nos analyses (2×/semaine)" → Newsletter
- Secondaire: "Vous voulez implémenter ça ?" → #contact-b2b (ancre vers section B2B en bas)

#### SECTION AGENT DEMO

**Header**:
```
Notre agent en action
18 mois de gestion réelle — voici ce qu'il voit chaque matin
```

**Contenu démo**: (conservé — dashboard avec métriques)

#### SECTION STACK TECHNIQUE (NOUVELLE)

**Header**:
```
Comment c'est construit
100% transparent — notre stack technique
```

**4 cartes**:

```
🛠️ OpenClaw & APIs 
Orchestration des agents via APIs. 
On vous montre comment configurer vos propres serveurs 
et connecter différents outils entre eux.
```

```
💻 Code avec IA
On ne code pas seuls — on utilise plusieurs modèles d'IA comme Claude, Gemini, Kimi etc comme co-pilotes.
On partage nos prompts, nos workflows de développement, 
comment on passe d'une idée à un agent fonctionnel.
```

```
📊 API & Data
Connexion broker, bases vectorielles pour la mémoire,
stockage sécurisé. On explique chaque choix technique 
et pourquoi on a privilégié telle ou telle solution.
```

```
🔍 Les limites (qu'on cache pas)
Exécution des ordres (achat/vente) applicable uniquement pour les comptes titre (pas pour PEA ou assurance vie).

On montre ici tout ce qui marche et tout ce qui ne marche pas encore — 
pour que vous ayez une vision réaliste de ce qu'on peut faire avec les outils d'aujourd'hui.
```

#### SECTION NOTRE MÉTHODE

**Header**:
```
Notre méthode
Ce qu'on a appris en construisant — et comment appliquer ça à vos projets
```

**5 points** (conservés mais reformulés):
```
1️⃣ Backtest systématique — Aucune décision sans validation historique
2️⃣ Risk parity 2 niveaux — Thématique + intra-pocket  
3️⃣ Régime de marché — 5 signaux composites (VIX, yield curve, credit...)
4️⃣ Position sizing strict — 1-10% max, jamais plus de 30 positions
5️⃣ Validation humaine — L'agent propose, nous validons (et on vous explique pourquoi)
```

#### SECTION GÉNÉRALISATION

**Header**:
```
Cette méthode marche pour vos propres projets
Au-delà de l'investissement
```

**3 cas d'usage**:
```
📈 Veille réglementaire
Automatiser la surveillance des évolutions règlementaires 
(AMF, lois fiscales) avec alertes personnalisées.

📄 Génération de rapports
Créer des templates intelligents qui remplissent automatiquement 
vos comptes-rendus clients à partir de vos données.

⚡ Productivité personnelle
Agents de tri email, synthèse de documents, 
recherche d'informations — tout ce qui vous prend du temps.
```

**CTA**:
```
[Voir nos tutos] [Recevoir les nouveaux agents par mail]
```

#### SECTION BUILD IN PUBLIC

**Header**:
```
Build in Public
On documente tout : ce qui marche, ce qui casse, comment on répare.
```

**3 articles récents**:
- "Comment on a réduit la latence de notre agent de 40%"
- "Ce qui n'a pas marché : nos ratés sur les prompts de raisonnement"
- "Pourquoi on a migré de X vers Y (et les leçons apprises)"

#### SECTION RESSOURCES GRATUITES

**Header**:
```
Ressources gratuites
Téléchargez, reproduisez, adaptez
```

**Items**:
- Config OpenClaw de base
- Prompts pour analyse de portefeuille
- Liste des outils qu'on teste chaque semaine
- Template Notion pour veille IA

#### SECTION TESTIMONIALS (PLACEHOLDER)

**Header**:
```
Ils suivent notre travail
Ce que disent ceux qui nous lisent
```

**Placeholder** (3 témoignages):
```
"Grâce à leurs explications sur OpenClaw, j'ai pu construire mon propre 
agent de veille en 2 semaines. Pas besoin d'équipe tech."
— Thomas D., Consultant indépendant

"Enfin du contenu IA sans la hype et le bullshit. Ils nous montrent et nous expliquent tout et ça change tout."
— Marie L., CGP

"J'ai commencé par la newsletter, puis j'ai reproduit leur agent d'investissement, 
et maintenant je travaille avec eux sur un projet pour ma boîte."
— Alexandre K., Entrepreneur
```

#### SECTION B2B (funnel conversion)

**Header**:
```
Vous voulez aller plus loin ?
Implémentez cette approche dans votre business
```

**Texte**:
```
Vous avez vu comment on construit nos agents. 
Vous voulez faire pareil pour votre entreprise, vos clients, vos processus ?

On accompagne les professionnels (CGP, PME, sociétés de gestion) 
dans l'implémentation concrète d'agents IA sur mesure — 
avec la même approche transparente et la promesse d'autonomie.
```

**CTAs**:
- Primaire: "Discuter de votre projet" → Calendly
- Secondaire: "Voir nos solutions B2B" → /professionnels

---

### PAGE 3 : PROFESSIONNELS (`professionnels.html`)

#### HERO

**Badge** (nouveau):
```
🚀 Early adopters systématiques
```

**Titre H1**:
```
Implémentez les agents IA dans votre métier
```

**Sous-titre**:
```
Les solutions que nous déployons sont sorties il y a quelques semaines à peine.
Nous sommes parmi les premiers en France à les maîtriser — 
notre edge unique pour vous garder une longueur d'avance.
```

**CTAs**:
- Primaire: "Prendre rendez-vous (30min)" → Calendly
- Secondaire: "Voir nos cas d'usage" → #use-cases

#### SECTION NOS SERVICES

**Header**:
```
Trois façons de collaborer
Du diagnostic à l'autonomie
```

**Card 1 — Conseil & Implémentation**:
```
Conseil & Implémentation
On ne fait pas de PowerPoint. On build directement.

• Diagnostic 30min gratuit — On identifie ce qui vaut le coup d'automatiser
• Co-construction en sessions live — Vous voyez chaque décision
• Transparence totale — Stack, prompts, tout est documenté

[En savoir plus]
```

**Card 2 — Développement Sur Mesure**:
```
Développement Sur Mesure
Agents IA construits spécifiquement pour votre métier.

• Stack moderne — OpenClaw, MCP, agents, LLMs, cloud-native
• Intégration vos systèmes — API existantes, CRM, bases de données
• Documentation complète — Pour que vous soyez autonomes

[En savoir plus]
```

**Card 3 — Formation par la Construction**:
```
Formation par la Construction
Pas de cours magistraux. On forme en buildant ensemble.

• Sessions 1-2h/semaine en live — Pas de formation en salle
• Chaque décision expliquée en temps réel — Vous montez en compétence
• À la fin, vous maintenez seuls — Pas de dépendance créée

[En savoir plus]
```

#### SECTION NOTRE MÉTHODE : CO-CONSTRUCTION

**Header**:
```
Notre méthode : Co-construction
On build avec vous, pas pour vous
```

**Timeline 4 étapes**:

```
1. Discovery (1h)
On comprend vos enjeux et on identifie ce qui vaut 
le coup d'automatiser vs ce qui reste manuel. On ne vous vendra pas de l'IA à tout prix. 
```

```
2. Co-construction (4-8 semaines)
Sessions 1-2h/semaine où on build ensemble. 
Vous voyez chaque décision, on explique chaque choix technique.
Vous montez en compétence en temps réel.
```

```
3. Autonomie (jour J)
Livraison + documentation complète. 
Vous pouvez maintenir et faire évoluer vos agents 
sans dépendre de nous.
```

```
4. Upgrade continu (optionnel)
Nouveaux outils sortis ? On vous tient au courant.
Vous restez toujours une longueur d'avance.
```

#### SECTION EARLY ADOPTERS (différenciation)

**Header**:
```
🚀 Early Adopters Systématiques
Toujours une longueur d'avance
```

**Texte**:
```
Les solutions que nous proposons sont sorties il y a quelques semaines.
Pas des outils hype d'il y a 2 ans genre n8n, Zapier ou Make. 
Des agents, des MCPs, du selfware, des intégrations 
que vos concurrents découvriront dans 6 mois.

Quelques outils qu'on a testés avant tout le monde :
• OpenClaw — Orchestration d'agents modulaires
• MCP - Connecteurs customs ou natifs pour connecter tous vos outils  
• Claude Computer Use — Automatisation UI avancée 
• Selfware - Agents autonomes pour vos tâches répétitives 
• Voice cloning, video generation - Remotion, ElevenLabs, HeyGen
• Vector DB pour mémoire contextuelle — RAG sur mesure
• Nouveaux modèles reasoning — O1, DeepSeek, DeepMing etc.

Vos concurrents découvrent quand vous déployez déjà.
```

#### SECTION CAS D'USAGE

**Header**:
```
Ce qu'on a déployé
Exemples concrets
```

**Use Case 1 — CGP**:
```
Automatisation du reporting client

Problème : 2 jours/semaine passés à préparer des comptes-rendus
Solution : Agent qui génère les rapports à partir des données
Résultat : 4h/semaine au lieu de 2 jours — le CGP se concentre sur le conseil

Tech : OpenClaw, API broker, LLM pour synthèse, Notion pour sortie
```

**Use Case 2 — Architecte**:
```
Veille réglementaire automatisée

Problème : Rater des évolutions normatives importantes
Solution : Agent qui scanne quotidiennement + alertes personnalisées
Résultat : 0 retard de conformité, temps de veille divisé par 5

Tech : MCP servers, scraping intelligent, classification LLM
```

**Use Case 3 — PME E-commerce**:
```
Analyse des retours clients à échelle

Problème : 1000+ avis clients/jour, impossible d'analyser manuellement
Solution : Agent de classification et synthèse thématique
Résultat : Insights actionnables en temps réel, amélioration produit accélérée

Tech : LLM fine-tuné, base vectorielle, dashboard automatisé
```

#### SECTION NOTRE DIFFÉRENCE

**Header**:
```
Pourquoi travailler avec nous
```

**4 cartes**:

```
🎯 Niche Finance × Tech
On ne fait pas de l'IA générique. 
Background Deloitte + UBS : on parle votre langage (AMF, OPCVM, conformité).
On comprend vos contraintes métier dès le premier appel.
```

```
🚀 Early Adopters
On est sur la balle, on teste tout ce qui sort. Vous bénéficiez des dernières 
solutions avant que votre concurrence ne les connaisse.
C'est notre ADN, pas un marketing gimmick.
```

```
🔧 Implémentation, pas PowerPoint
On ne vend pas de slides. On build directement et on ne vous vend pas de l'IA à tout prix.
On construit intelligement pour vous et avec vous.Vous voyez votre projet prendre forme semaine après semaine.
Pas de surprise à la livraison. Nous changeons votre façon de travailler pour qu'elle soit en phase avec les outils d'aujourd'hui.
```

```
🎓 Autonomie garantie
À la fin, vous n'avez plus besoin de nous.
On documente tout, on forme vos équipes, 
on vous rend autonome — et si vous paniquez ? On reste là. 
```

#### SECTION TESTIMONIALS (PLACEHOLDER)

**Header**:
```
Ils nous font confiance
Ce que disent nos premiers clients
```

**Placeholder** (3 témoignages):
```
"On a commencé par un diagnostic gratuit. 6 semaines plus tard, 
notre agent de reporting tournait. Et surtout : je comprends 
ce qu'il fait, je peux le faire évoluer seul."
— Marc T., CGP indépendant

"J'avais peur de créer de la dépendance. Au contraire — 
la doc est tellement claire que mon équipe a pu reprendre 
le relais sans problème après 2 mois."
— Sophie L., Directrice PME 

"Ce qui m'a séduit : ils sont honnêtes sur ce qui ne marche pas. 
Quand un outil n'était pas adapté, ils me l'ont dit. 
Pas de vendeurs de rêves ou d'IA a tout prix. Ils trouvent les meilleurs outils pour votre stack actuel."
— Pierre D., Entrepreneur 
```

#### SECTION FAQ

**Header**:
```
Questions fréquentes
```

**Q1**:
```
Q: "On n'a pas d'équipe tech en interne. Ça marche quand même ?"
R: Oui — c'est justement pour ça qu'on existe. On vient du métier 
(Deloitte, UBS), pas du pur dev. On parle votre langage. On comprend vos enjeux métiers.  
Notre but est de vous rendre autonome et de vous faire évoluer sans être dépendant.
```

**Q2**:
```
Q: "Combien de temps ça prend ?"
R: Notre projet dure quelques semaines en moyenne (cela dépend de la complexité). On build rapidement, on itère avec vous. 
```

**Q3**:
```
Q: "Et si on veut arrêter de travailler avec vous ?"
R: C'est le but ! On documente tout. Vous gardez le code, 
les configs, le savoir-faire. Pas de vendor lock-in. 
On prospère sur votre émancipation, pas votre dépendance.
```

**Q4**:
```
Q: "C'est cher ?"
R: Ça dépend de la complexité. On fait un premier diagnostic gratuit 
de 30min pour identifier ce qui vaut le coup — 
souvent, le ROI est visible en quelques semaines.
```

**Q5**:
```
Q: "Vous faites de la formation séparée ?"
R: Non. On ne croit pas aux formations en salle. 
On forme en buildant avec vous et en écoutant vos demandes — c'est intégré dans la co-construction.
Vous apprenez en faisant, pas en écoutant des slides. On vous fournit toutes les ressources nécessaires pour être autonome. 
```

#### SECTION CTA FINAL

**Header**:
```
Discutons de votre projet
30 minutes pour identifier ce qui vaut le coup d'automatiser
```

**Texte**:
```
Gratuit, sans engagement. On regarde ensemble vos processus 
et on vous dit honnêtement si l'IA peut vous aider — ou pas.
```

**CTA**:
```
[Prendre rendez-vous] → Calendly
```

---

### PAGE 4 : À PROPOS (`a-propos.html`)

#### HERO

**Titre H1**:
```
À Propos de Bubble
```

**Sous-titre**:
```
On construit en public. On apprend en faisant. 
On partage tout: nos réussites comme noséchecs.
```

#### SECTION NOTRE VISION

**Header**:
```
Notre Vision
Un pont entre deux économies
```

**Texte**:
```
L'IA et la robotique transforment déjà l'économie: emploi, richesse, 
rapport au travail. On ne prétend pas avoir toutes les réponses 
ni le meilleur produit, mais on veut être un pont entre 
l'économie d'hier et celle de demain.

Nous accompagnons tous les professionnels 
(CGPs, indépendants, PME, sociétés de gestion) dans leur transition 
vers cette nouvelle économie — tout en partageant gratuitement 
nos apprentissages avec le plus grand nombre.

Impact ultime : Un collectif d'early adopters qui a compris 
les implications économiques de l'automatisation, qui a pris de l'avance, 
et qui partage ce qu'il apprend en chemin.
```

#### SECTION NOTRE MISSION

**Header**:
```
Notre Mission
Accompagner et partager
```

**2 colonnes**:

```
🎯 B2B — Cœur de l'activité
Accompagner les professionnels (CGP, sociétés de gestion, PME) 
dans l'adoption et l'implémentation d'agents IA et d'outils 
d'automatisation sur mesure.

→ Early adoption systématique
→ Co-construction avec transfert de compétences
→ Autonomie du client comme objectif
```

```
📚 B2C — Contenu gratuit
Partager notre savoir-faire et nos apprentissages avec les particuliers 
via du contenu éducatif, des démos publiques, et notre agent 
d'investissement en vitrine.

→ Preuve d'expertise qui alimente le B2B
→ Ressources libres et transparentes
→ Build in public : le processus, pas juste le résultat
```

#### SECTION NOTRE PHILOSOPHIE (NOUVELLE)

**Header**:
```
Notre Philosophie
Le temps irréversible et l'attention authentique
```

**Texte**:
```
L'IA peut produire du contenu, du code, des images à coût marginal zéro. 
Ce qu'elle ne peut pas produire, c'est l'investissement authentique 
d'un être humain fini dans un geste adressé à un autre.

Quand on passe du temps avec un client, quand on écrit un article, 
quand on build un agent ensemble — ce temps est consommé, irréversible, 
perdu pour tout le reste. C'est ça qu'on offre. Pas des livrables. 
Du temps de vie.

Comme Sartre l'avait compris : l'attention n'a de valeur que parce qu'elle 
vient d'un être libre qui aurait pu faire autrement. Une IA ne peut pas 
choisir de ne pas vous répondre — et c'est précisément cette impossibilité 
qui vide son attention de ce qui la rendrait précieuse.
```
**Citation**:
```
"Une IA ne peut pas *choisir* de ne pas vous répondre — 
et c'est précisément cette impossibilité qui vide son attention 
de ce qui la rendrait précieuse."
— Inspiré de Sartre
```
```

#### SECTION WILL TO EMPOWER (NOUVELLE)

**Header**:
```
Will to Empower
Prospérer sur votre émancipation
```

**4 cartes**:

```
🎯 Transfert de pouvoir
Chaque article, vidéo, ou mission client vise une chose : 
de la dépendance à l'autonomie. On forme pour que vous 
n'ayez plus besoin de nous.
```

```
🔧 Co-construction
On ne livre pas des agents à distance. On s'assied avec vous, 
on construit ensemble, on investit notre temps irréversible 
dans votre montée en compétence.
```

```
📚 Éducation sans gatekeeping
Si un outil gratuit fait le job, on vous le dit. 
Notre contenu B2C existe pour donner les clés à ceux 
qui veulent se lancer seuls.
```

```
💎 Transparence empathique
Nos forces, nos faiblesses, nos doutes — on les partage 
parce que l'authenticité construit la confiance. 
On ne prétend pas être parfaits.
```

**Citation finale**:
```
"Là où l'industrie du conseil prospère sur votre dépendance, 
nous prospérons sur votre émancipation."
```

#### SECTION NOTRE ÉQUIPE

**Header**:
```
Qui on est
```

**Jade**:
```
Jade Hoang

Background : Deloitte (opérations financières) + KPMG (audit)
Expertise : Finance, automatisation, agents IA
Approche : Build in public, transparence totale

Ce qu'elle fait : Architecture des agents, veille techno, 
relation client. Écrit sur la philosophie de l'IA et son impact économique.

[LinkedIn] [GitHub]
```

**Joris**:
```
Joris Dupraz

Background : UBS (gestion actions institutionnelle) + Deloitte
Expertise : Marchés financiers, implémentation tech, automation
Approche : Pragmatisme, early adoption, honnêteté sur les limites

Ce qu'il fait : Développement des agents, intégration APIs, 
co-construction avec clients. Partage les tutos techniques et les configs.

[LinkedIn] [GitHub]
```

**Note commune**:
```
Comment on travaille

On ne code pas seuls. On utilise Claude, Kimi, Cursor — 
l'IA comme co-pilote de développement. On partage nos prompts, 
nos workflows, nos ratés aussi. 

Build in Public, même sur la technique.
```

#### SECTION BUILD IN PUBLIC

**Header**:
```
Build in Public
Suivez notre construction en temps réel
```

**Métriques ouvertes** (si pertinent):
```
• X agents déployés en production
• Y heures de co-construction avec clients
• Z articles publiés, échecs compris
```

**CTA**:
```
[S'abonner à la newsletter] [Lire le blog]
```

---

## 🇬🇧 VERSION ANGLAISE

### Traduction adaptée (pas mot-à-mot)

---

### PAGE 1 : HOMEPAGE (`en/index.html`)

#### HERO Description:
```
We build AI agents for ourselves — and show you how to do the same.
Free expertise showcase for individuals. 
Custom implementation for professionals.
```

#### DUAL PATH

**Individuals**:
```
Individuals
Learn by watching what we've built

Our investment agent is a public proof of concept. 
We share how it works (OpenClaw, code, prompts) so you 
can reproduce it — for your investments or your own projects.

• 100% transparent POC — Stack, limits, learnings
• Free resources — Configs, tutorials, watch
• Newsletter — What we discover each week

[Explore our agent]
```

**Professionals**:
```
Professionals
Implement AI in your business — with the latest tools

Wealth managers, asset managers, SMBs. We deploy agents on your systems. 
The solutions we use were released weeks ago — 
we're among the first in France to master them.

• Early adopters — Always one step ahead
• Co-construction — We build with you, not for you
• Guaranteed autonomy — In the end, you don't need us

[Discuss your project]
```

#### FOOTER:
```
AI implemented. You stay ahead.

Free content · Custom expertise · Build in Public
```

---

### PAGE 2 : INDIVIDUALS (`en/individuals.html`)

#### HERO:
```
Our Investment Agent — An Open POC
```

**Subtitle**:
```
We built an AI agent for ourselves using OpenClaw and code.
We share how it works — technical stack, prompts, limits —
so you can reproduce it, for your investments or your projects.
```

#### STACK SECTION:
```
How it's built
100% transparent — our technical stack

🛠️ OpenClaw & MCP
Agent orchestration via Model Context Protocol.
We show you how to configure your own MCP servers.

💻 Code with AI
We don't code alone — we use Claude, Kimi, Cursor as co-pilots.
We share our prompts and development workflows.

📊 APIs & Data
Broker connections, vector databases for memory,
secure storage. We explain every technical choice.

🔍 The limits (we don't hide)
API latency, unexpected costs, edge cases that break.
We also show what doesn't work yet.
```

---

### PAGE 3 : PROFESSIONALS (`en/professionals.html`)

#### HERO:
```
🚀 Systematic Early Adopters

Implement AI in your business

The solutions we deploy were released just weeks ago.
We're among the first in France to master them —
our unique edge to keep you ahead.
```

#### METHODOLOGY:
```
Our Method: Co-construction
We build with you, not for you

1. Discovery (1h)
Understand your challenges and identify what 
should be automated vs what stays manual.

2. Co-construction (4-8 weeks)
1-2h/week live sessions where we build together.
You see every decision, we explain every technical choice.
You learn by doing.

3. Autonomy (go-live day)
Delivery + complete documentation.
You can maintain and evolve your agents 
without depending on us.

4. Continuous upgrade (optional)
New AI tools released? We keep you informed.
You stay ahead.
```

#### TESTIMONIALS (placeholder):
```
"We started with a free diagnostic. 6 weeks later, 
our reporting agent was running. And most importantly: 
I understand what it does, I can evolve it alone."
— Marc T., Independent Wealth Manager

"I was afraid of creating dependency. Instead — 
the documentation is so clear that my team took over 
without issue after 2 months."
— Sophie L., SMB Director (45 employees)

"What convinced me: they're honest about what doesn't work. 
When a tool wasn't suitable, they told me. 
No dream sellers."
— Pierre D., Tech-forward Entrepreneur
```

---

### PAGE 4 : ABOUT (`en/about.html`)

#### VISION:
```
Our Vision
A bridge between two economies

AI and robotics are already transforming the economy — 
jobs, wealth, relationship to work. We don't claim to have 
all the answers or the best product, but we want to be a bridge 
between yesterday's economy and tomorrow's.

In 10 years, we will have accompanied thousands of professionals 
(wealth managers, independents, SMBs, asset managers) in their 
transition to this new economy — while freely sharing 
our learnings with as many as possible.
```

#### PHILOSOPHY:
```
Our Philosophy
Irreversible time and authentic attention

AI can produce content, code, images at near-zero marginal cost. 
What it cannot produce is the authentic investment 
of a finite human being in a gesture addressed to another.

When we spend time with a client, when we write an article, 
when we build an agent together — that time is consumed, 
irreversible, lost to everything else. That's what we offer. 
Not deliverables. Life time.

As Sartre understood: attention only has value because it comes 
from a free being who could have done otherwise. 
An AI cannot *choose* not to respond to you — 
and it is precisely this impossibility that empties 
its attention of what would make it precious.
```

#### WILL TO EMPOWER:
```
"Where the consulting industry thrives on your dependency, 
we thrive on your emancipation."
```

---

## ✅ CHECKLIST VALIDATION

Avant implémentation, merci de valider :

### Structure
- [ ] 4 pages FR OK
- [ ] 4 pages EN OK
- [ ] Placeholders testimonials acceptables

### Messaging clés
- [ ] "POC Open" / "Proof of concept public" clair
- [ ] OpenClaw + MCP mentionnés explicitement
- [ ] "Early adopters systématiques" présent
- [ ] "Autonomie garantie" / "You don't need us anymore" visible
- [ ] Philosophie "temps irréversible" intégrée
- [ ] "Will to Empower" / "émancipation vs dépendance" présent

### Funnel
- [ ] Particuliers → B2B clair (ancre/lien)
- [ ] CTAs distincts (Newsletter vs Calendly)

### Réseaux
- [ ] Footer: LinkedIn, Instagram, GitHub, Substack
- [ ] Pas de TikTok/YouTube

---

## 🚀 PLAN IMPLÉMENTATION (après validation)

**Phase 1 : FR** (après votre GO)
1. Homepage FR
2. Particuliers FR  
3. Professionnels FR
4. À Propos FR

**Phase 2 : EN**
1. Homepage EN
2. Individuals EN
3. Professionals EN
4. About EN

**Phase 3 : Cleanup**
- Archivage anciennes pages
- Tests liens internes
- Responsive check

---

*Document complet prêt pour validation*
*Merci de cocher les cases et me donner le GO pour implémentation*
