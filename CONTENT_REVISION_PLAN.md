# Plan de Révision des Contenus — Bubble Invest

> **Objectif** : Aligner toutes les pages mock avec la vision B2C = vitrine éducative gratuite / B2B = implémentation sur mesure
> 
> **Design** : Préservé intact (CSS, animations, layout)
> 
> **Date** : 24 Fév 2026

---

## 🎯 Principes Directeurs

1. **B2C = Vitrine, pas produit** — On ne vend rien aux particuliers. On montre, on explique, on donne les ressources.
2. **Transparence technique** — OpenClaw, MCP, codage avec IA doivent être mentionnés pour prouver l'expertise.
3. **Funnel clair** — Particuliers (éduquer) → Professionnels (implémenter)
4. **Autonomie comme promesse** — "À la fin, vous n'avez plus besoin de nous"
5. **Early adopters** — On est parmi les premiers à tester/déployer

---

## 📄 PAGE 1 : HOMEPAGE (`homepage-mock-v4.html`)

### Changements à valider

#### ✅ PRESERVE (Design intact)
- Structure hero avec gradient
- Dual path cards
- Chat input animé
- Section blog tiles
- Footer social links

---

#### 🔤 SECTION HERO — Textes à modifier

**Titre H1** — ACTUEL :
```
(Bubble logo)
```
→ **CONSERVÉ** (juste le logo, pas de changement)

**Tagline** — ACTUEL :
```
(La tagline visuelle, pas de texte)
```
→ **CONSERVÉ**

**Description** — ACTUEL :
```
On construit l'outil qu'on voulait pour nous : un agent qui automatise vos investissements, avec transparence.
```
→ **PROPOSÉ** :
```
On construit des agents IA pour nous — et on vous montre comment faire pareil.
Vitrine d'expertise gratuite pour particuliers. Implémentation sur mesure pour professionnels.
```

---

#### 🔤 SECTION DUAL PATH — Textes à modifier

**Card 1 : Particuliers** — ACTUEL :
```
Particuliers
Pour les investisseurs qui veulent comprendre

L'agent d'investissement qu'on a construit pour nous. Il incarne nos valeurs, il fonctionne, il est compatible avec notre API.

• Selfware — Vos actifs restent chez votre broker
• Méthode transparente — Backtests publics
• Analyses 2x/semaine — Newsletter personnalisée

[Explorer notre agent]
```

→ **PROPOSÉ** :
```
Particuliers
Apprenez en observant ce qu'on a construit

Notre agent d'investissement est un proof of concept public. On partage comment il marche (OpenClaw, code, prompts) pour que vous puissiez reproduire — pour vos investissements ou vos propres projets.

• POC 100% transparent — Stack, limites, apprentissages
• Ressources gratuites — Configs, tutos, veille
• Newsletter — Ce qu'on découvre chaque semaine

[Explorer notre agent]
```

**Card 2 : Professionnels** — ACTUEL :
```
Professionnels
Pour les entreprises qui veulent déployer l'IA

CGP, sociétés de gestion, entreprises. On déploie des agents sur VOS systèmes — vos clients restent chez vous.

• Diagnostic gratuit — Appel initial 30min
• Co-construction — On build avec vos équipes
• Early adopters — Dernières solutions IA

[Parler de votre projet]
```

→ **PROPOSÉ** :
```
Professionnels
Implémentez l'IA dans votre métier — avec les tout derniers outils

CGP, sociétés de gestion, PME. On déploie des agents sur vos systèmes. Les solutions qu'on utilise sont sorties il y a quelques semaines — on est parmi les premiers en France à les maîtriser.

• Early adopters systématiques — Toujours une longueur d'avance
• Co-construction — On build avec vous, pas pour vous
• Autonomie garantie — À la fin, vous n'avez plus besoin de nous

[Discuter de votre projet]
```

---

#### 🔤 SECTION BLOG PREVIEW — Ajout tag série

**Actuel** : Titres des articles sans contexte

→ **PROPOSÉ** : Ajouter des tags sur chaque tile
- "Build in Public"
- "Agents en vitrine" 
- "Démystifier l'IA"

---

#### 🔤 FOOTER — Mise à jour liens

**Réseaux sociaux** — ACTUELS :
- LinkedIn, Instagram, TikTok, YouTube

→ **PROPOSÉ** :
- ✅ LinkedIn (garder)
- ✅ Instagram (garder)
- ✅ GitHub (ajouter — lien profil Jade/Joris)
- ✅ Substack (ajouter — lien newsletter)
- ❌ TikTok (retirer)
- ❌ YouTube (retirer)

**Tagline footer** — ACTUEL :
```
Transparent by design.
Gestion pilotée par agent IA.
```

→ **PROPOSÉ** :
```
L'IA implémentée. Vous gardez l'avance.
B2C gratuit · B2B sur mesure · Build in Public
```

---

## 📄 PAGE 2 : PARTICULIERS (`particuliers-mock.html`)

### Changements majeurs — Page à re-travailler en priorité

#### 🔤 SECTION HERO — Refonte complète

**Titre H1** — ACTUEL :
```
Gestion d'Investissement par Agent IA
```
→ **PROPOSÉ** :
```
Notre Agent d'Investissement — Un POC Open
```

**Sous-titre** — ACTUEL :
```
On utilise un agent IA pour gérer nos propres investissements.
On partage notre méthode, nos analyses de marché,
et on accompagne les entreprises qui veulent faire de même.
```
→ **PROPOSÉ** :
```
On a construit des agents IA pour nous d'abord pour nos investissements, puis pour d'autres usages.
On vous partage comment on a fait et comment ça marche — stack technique, prompts, limites —
pour que vous puissiez reproduire, pour vos investissements ou vos projets persos.
```

**CTA Principal** — ACTUEL :
```
Recevoir notre newsletter personnalisée (2x/semaine)
```
→ **CONSERVÉ** (déjà bon)

**CTA Secondaire** — ACTUEL :
```
Parler de votre projet
```
→ **PROPOSÉ** :
```
Vous voulez implémenter ça ? (pour professionnels)
```

---

#### 🔤 SECTION AGENT DEMO — Ajouts transparence

**Sous-titre actuel** :
```
18 mois de gestion réelle — voici ce qu'il voit chaque matin
```
→ **PROPOSÉ** :
```
18 mois de gestion réelle — voici ce qu'il voit chaque matin, et comment il est construit
```

**AJOUTER nouvelle section après la démo** :

```html
<section class="stack-reveal" style="padding: 4rem 0; background: var(--bg-subtle);">
  <div class="container">
    <div class="section-header">
      <h2>Comment c'est construit</h2>
      <h3>100% transparent — notre stack technique</h3>
    </div>
    
    <div class="stack-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; margin-top: 3rem;">
      
      <div class="stack-card" style="background: white; padding: 2rem; border-radius: 12px; border: 1px solid var(--border);">
        <div style="font-size: 2rem; margin-bottom: 1rem;">🛠️</div>
        <h4>OpenClaw</h4>
        <p style="color: var(--secondary); font-size: 0.9rem; margin-top: 0.5rem;">
          Orchestration des agents via MCP (Model Context Protocol). 
          On vous montre comment configurer vos propres serveurs.
        </p>
      </div>
      
      <div class="stack-card" style="background: white; padding: 2rem; border-radius: 12px; border: 1px solid var(--border);">
        <div style="font-size: 2rem; margin-bottom: 1rem;">💻</div>
        <h4>Code avec IA</h4>
        <p style="color: var(--secondary); font-size: 0.9rem; margin-top: 0.5rem;">
          On ne code pas seuls — on utilise Claude, Kimi, Cursor.
          On partage nos prompts et notre workflow de développement.
        </p>
      </div>
      
      <div class="stack-card" style="background: white; padding: 2rem; border-radius: 12px; border: 1px solid var(--border);">
        <div style="font-size: 2rem; margin-bottom: 1rem;">📊</div>
        <h4>API & Data</h4>
        <p style="color: var(--secondary); font-size: 0.9rem; margin-top: 0.5rem;">
          Connexion broker, bases vectorielles pour la mémoire,
          stockage sécurisé. On explique chaque choix technique.
        </p>
      </div>
      
      <div class="stack-card" style="background: white; padding: 2rem; border-radius: 12px; border: 1px solid var(--border);">
        <div style="font-size: 2rem; margin-bottom: 1rem;">🔍</div>
        <h4>Les limites</h4>
        <p style="color: var(--secondary); font-size: 0.9rem; margin-top: 0.5rem;">
          On ne cache rien : latence API, coûts, edge cases.
          Ce qu'on sait faire, ce qu'on ne sait pas encore faire.
        </p>
      </div>
      
    </div>
  </div>
</section>
```

---

#### 🔤 SECTION MÉTHODE — Modification

**Titre actuel** :
```
Notre méthode
Ce qui guide chaque décision — et pourquoi ça marche
```
→ **PROPOSÉ** :
```
Notre méthode
Ce qu'on a appris en construisant — et comment appliquer ça à vos projets
```

---

#### 🔤 SECTION BUILD IN PUBLIC — Ajout

**Titre actuel** :
```
Build in Public
Ce qu'on apprend, ce qu'on pense, ce qu'on partage
```
→ **CONSERVÉ** (déjà bon)

**AJOUTER sous les articles** :
```
On documente tout : ce qui marche, ce qui casse, comment on répare.
Pas de produit fini parfait — un work in progress honnête.
```

---

#### 🔤 SECTION OUTILS — Repositionnement

**Titre actuel** :
```
Explorer nos outils
Testez les concepts, découvrez votre profil, comparez les stratégies
```
→ **PROPOSÉ** :
```
Ressources gratuites
Testez les concepts, téléchargez nos configs, reproduisez nos agents
```

---

#### 🔤 SECTION B2B (en bas de page) — Modification

**Titre actuel** :
```
Vous êtes professionnel ?
Vous voulez déployer des agents IA dans votre entreprise ?
```
→ **PROPOSÉ** :
```
Vous voulez aller plus loin ?
Implémentez cette approche dans votre business — on vous accompagne
```

**CTA** — ACTUEL - lead to calendly link:
```
Voir nos solutions B2B
```
→ **PROPOSÉ** :
```
Discuter de votre projet (pour professionnels)
```

---

## 📄 PAGE 3 : PROFESSIONNELS (`professionnels-mock.html`)

### Renforcement Early Adopters + Co-construction

#### 🔤 SECTION HERO — Ajout

**Conserver le design actuel** (très beau avec l'illustration)

**AJOUTER sous le sous-titre existant** :
```
💡 Early adopters systématiques : Les solutions que nous déployons sont 
sorties il y a quelques semaines à peine. Nous sommes parmi les premiers 
en France à les maîtriser.
```

---

#### 🔤 SECTION NOS SERVICES — Modification

**Card 1 : Consulting** — ACTUEL :
```
Conseil & Stratégie
Audit de vos processus et définition d'une roadmap sur mesure.

→ Diagnostic complet de vos processus actuels
→ Roadmap priorisée (avec les dernières solutions)
→ Formation équipes pour être autonomes
```
→ **PROPOSÉ** :
```
Conseil & Implémentation
On ne fait pas de PowerPoint à rallonge. On livre et on construit directement avec vous.

→ Diagnostic complet de vos processus actuels
- Proposition de roadmap priorisée (avec les dernières solutions)
→ Co-construction en sessions live 
→ Vous apprenez en faisant, pas en écoutant pour être autonomes le plus tôt possible
```

**Card 2 : Développement** — ACTUEL :
```
Développement Sur Mesure
Construction d'agents IA adaptés à vos systèmes et vos workflows.

→ Agents sur mesure
→ Intégration API
→ Maintenance incluse
```
→ **PROPOSÉ** :
```
Développement Sur Mesure
Agents IA construits spécifiquement pour votre métier.

→ Stack moderne (OpenClaw, MCP, agents, cascades de LLMs..)
→ Intégration vos systèmes existants (API, bases de données, outils métiers..)
→ Documentation complète pour autonomie avec les outils du moment
```

**Card 3 : Formation** — ACTUEL :
```
Formation & Accompagnement
Montée en compétence de vos équipes sur les outils IA.

→ Workshops pratiques
→ Best practices
→ Support continu
```
→ **PROPOSÉ** :
```
Formation par la Construction
Pas de cours magistraux. On forme en buildant ensemble.

→ Sessions 1-2h/semaine en live
→ Chaque décision expliquée en temps réel
→ À la fin, vous maîtrisez les outils et les concepts pour être autonomes
→ Et si vous paniquez ? Nous assurons le suivi et le support continu en cas de besoin. 
```

---

#### 🔤 SECTION MÉTHODOLOGIE — Refonte

**Titre** — ACTUEL :
```
Notre Méthodologie
Comment nous travaillons
```
→ **PROPOSÉ** :
```
Notre Méthode : Co-construction
On build avec vous, pas pour vous
```

**Étapes** — ACTUELLES :
```
1. Discovery — Comprendre vos enjeux
2. Design — Architecture sur mesure
3. Build — Développement itératif
4. Deploy — Mise en production
```
→ **PROPOSÉ** :
```
1. Discovery (2h) — On comprend vos enjeux et on identifie ce qui vaut le coup d'automatiser

2. Co-construction (4-8 semaines) — Sessions 1-2h/semaine où on construit ensemble sur vos processus prioritaires.
   Vous voyez chaque décision, on vous explique chaque choix. Vous montez en compétence en temps réel sur les derniers outils. 

3. Autonomie (jour J) — Livraison + documentation complète. 
   Vous pouvez maintenir et faire évoluer sans dépendre de nous.

4. Upgrade continu (optionnel) — Nouveaux outils sortent ? On vous tient au courant.
```

---

#### 🔤 SECTION DIFFÉRENCE — Ajout

**AJOUTER carte "Early Adopters"** :
```
🚀 Toujours une longueur d'avance

Les solutions que nous proposons sont sorties il y a quelques semaines.
Pas des outils hype d'il y a 2 ans (comme n8n ou Make). Mais des agents, des workflows, du selfware adapté à vos besoins.
LLM avancés, des intégrations que vos concurrents découvriront dans 6 mois.

→ Liste des outils qu'on a testés avant tout le monde
→ Veille technologique continue
→ Vos concurrents découvrent quand vous déployez déjà
```

**AJOUTER carte "Autonomie"** :
```
🎯 Autonomie garantie

On ne cherche pas à créer de la dépendance. Notre objectif : 
que vous n'ayez plus besoin de nous.

→ Documentation complète
→ Transfert de compétences natif
→ Pas de black box, tout est expliqué
→ Vous pouvez recruter en interne après
```

---

#### 🔤 SECTION FAQ — Ajout questions

**AJOUTER** :

```
Q: "On n'a pas d'équipe tech en interne. Ça marche quand même ?"
R: Oui — c'est justement pour ça qu'on existe. On vient du métier (Deloitte, UBS), 
   pas du pur dev. On parle votre langage. Et à la fin, vous avez la doc pour 
   faire évoluer sans être dépendant.

Q: "Combien de temps ça prend ?"
R: Un premier agent fonctionnel : 4-8 semaines en co-construction. 
   Pas 6 mois de spec. On build rapidement, on itère.

Q: "Et si on veut arrêter de travailler avec vous ?"
R: C'est le but ! On documente tout. Vous gardez le code, les configs, 
   le savoir-faire. Pas de vendor lock-in.
```

---

#### 🔤 SECTION CTA FINAL — Modification

**Titre** — ACTUEL :
```
Parlons de votre projet
Prêt à explorer comment l'IA peut transformer votre business ?
```
→ **PROPOSÉ** :
```
Discutons de votre projet
30 minutes pour identifier ce qui vaut le coup d'automatiser — gratuit, sans engagement
```

---

## 📄 PAGE 4 : À PROPOS (`a-propos-mock.html`)

### Ajout Philosophie + Will to Empower

#### 🔤 SECTION HERO — Conservation
→ **CONSERVÉ** (déjà très bien)

---

#### 🔤 SECTION MISSION — Modification

**Texte actuel** :
```
Notre mission est de démocratiser l'intelligence artificielle dans le monde 
de l'investissement et de la finance. Nous croyons que l'IA doit être un outil 
au service de l'humain, pas une boîte noire qui décide à votre place.
```
→ **PROPOSÉ** :
```
Notre mission : être un pont entre l'économie d'hier et celle de demain.

L'IA et la robotique transforment déjà l'emploi, la richesse, le rapport au travail. Nous croyons que la technologie doit être un outil 
au service de l'humain, pas une boîte noire qui décide à votre place.
On ne prétend pas avoir toutes les réponses. Mais on veut accompagner ceux 
qui veulent comprendre et prendre de l'avance — avec transparence et honnêteté.

B2C : On partage gratuitement notre savoir-faire (agents, tutos, apprentissages, actualités IA et finance).
B2B : On accompagne pros et entreprises dans l'implémentation concrète.
```

---

#### 🔤 NOUVELLE SECTION : Philosophie (après Mission)

**À insérer** :

```html
<section class="philosophy" style="padding: 6rem 0; background: var(--bg-subtle);">
  <div class="container">
    <div class="section-header">
      <h2>Notre Philosophie</h2>
      <h3>Le temps irréversible et l'attention authentique</h3>
    </div>
    
    <div class="philosophy-content" style="max-width: 800px; margin: 3rem auto 0; text-align: center;">
      <p style="font-size: 1.2rem; line-height: 1.8; color: var(--secondary); margin-bottom: 2rem;">
        "L'IA peut produire du contenu, du code, des images à coût marginal zéro. 
        Ce qu'elle ne peut pas produire, c'est <strong>l'investissement authentique 
        d'un être humain fini dans un geste adressé à un autre</strong>.
      </p>
      
      <p style="font-size: 1.1rem; line-height: 1.7; color: var(--secondary); margin-bottom: 2rem;">
        Quand on passe du temps avec un client, quand on écrit un article, 
        quand on build un agent ensemble — ce temps est consommé, irréversible, 
        perdu pour tout le reste. <strong>C'est ça qu'on offre. Pas des livrables. Du temps de vie.</strong>
      </p>
      
      <blockquote style="border-left: 3px solid var(--purple); padding-left: 1.5rem; margin: 2rem 0; text-align: left; font-style: italic;">
        "Une IA ne peut pas choisir de ne pas vous répondre — et c'est précisément 
        cette impossibilité qui vide son attention de ce qui la rendrait précieuse."
        <footer style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--muted);">— Inspiré de Sartre</footer>
      </blockquote>
    </div>
  </div>
</section>
```

---

#### 🔤 NOUVELLE SECTION : Will to Empower (après Philosophie)

**À insérer** :

```html
<section class="empowerment" style="padding: 6rem 0;">
  <div class="container">
    <div class="section-header">
      <h2>Will to Empower</h2>
      <h3>Prospérer sur votre émancipation, pas votre dépendance</h3>
    </div>
    
    <div class="empower-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 3rem; margin-top: 3rem;">
      
      <div class="empower-card">
        <h4>🎯 Transfert de pouvoir</h4>
        <p>Chaque article, vidéo, ou mission client vise une chose : 
           de la dépendance à l'autonomie. On forme pour que vous n'ayez plus besoin de nous.</p>
      </div>
      
      <div class="empower-card">
        <h4>🔧 Co-construction</h4>
        <p>On ne livre pas des agents à distance. On s'assied avec vous, 
           on construit ensemble, on investit notre temps dans votre montée en compétence.</p>
      </div>
      
      <div class="empower-card">
        <h4>📚 Éducation sans gatekeeping</h4>
        <p>Si un outil gratuit fait le job, on le dit. Notre contenu B2C existe 
           pour donner les clés à ceux qui veulent se lancer seuls.</p>
      </div>
      
      <div class="empower-card">
        <h4>💎 Transparence empathique</h4>
        <p>Nos forces, nos faiblesses, nos doutes — on les partage parce que 
           l'authenticité construit la confiance. On ne prétend pas être parfaits.</p>
      </div>
      
    </div>
    
    <div class="empower-quote" style="text-align: center; margin-top: 4rem; padding: 2rem; background: var(--bg-subtle); border-radius: 12px;">
      <p style="font-size: 1.3rem; font-weight: 500; color: var(--primary);">
        "Là où l'industrie du conseil prospère sur votre dépendance, <br>
        nous prospérons sur votre émancipation."
      </p>
    </div>
  </div>
</section>
```

---

#### 🔤 SECTION ÉQUIPE — Ajout

**AJOUTER sous les bios** :
```
Comment on travaille

On ne code pas seuls. On utilise Claude, Kimi, Cursor — l'IA comme 
co-pilote de développement. On partage nos pensées, nos réussites comme nos échecs. 
Build in Public depuis 2023, même sur la technique.
```

---

#### 🔤 SECTION BUILD IN PUBLIC — Conservation
→ **CONSERVÉ** (déjà très bien)

---

## ✅ CHECKLIST VALIDATION

Avant implémentation, merci de valider :

### Général
- [ ] Approche B2C = vitrine éducative (pas produit) claire
- [ ] Mention OpenClaw + MCP + codage avec IA suffisamment présente
- [ ] Funnel Particuliers → Professionnels visible
- [ ] Réseaux sociaux : GitHub + Substack ajoutés, TikTok + YouTube retirés

### Page Particuliers
- [ ] Titre "POC Open" au lieu de "Gestion..."
- [ ] Section "Stack technique" ajoutée
- [ ] Section "Comment c'est construit" avec transparence
- [ ] CTA B2B reformulé

### Page Professionnels
- [ ] "Early adopters systématiques" bien mis en avant
- [ ] Méthode "co-construction" expliquée clairement
- [ ] Promesse "autonomie" visible
- [ ] FAQ avec objections B2B réalistes

### Page À Propos
- [ ] Section "Philosophie" avec "temps irréversible"
- [ ] Section "Will to Empower" ajoutée
- [ ] Mission reformulée avec distinction B2C/B2B

---

## 📝 PROCHAINES ÉTAPES

1. **Validation** : Vous relisez ce document et cochez ce qui vous convient
2. **Ajustements** : Je modifie selon vos retours
3. **Implémentation FR** : Je mets à jour les 4 fichiers HTML français
4. **Implémentation EN** : Je traduis et mets à jour les versions anglaises

---

*Document créé le 24 Fév 2026*
*En attente de validation*
