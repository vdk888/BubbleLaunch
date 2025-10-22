const { Client } = require("@notionhq/client");
require('dotenv').config();

// Initialize Notion client
const notion = new Client({ auth: process.env.NOTION_BLOG_API_KEY });
const blogDatabaseId = process.env.NOTION_BLOG_DATABASE_ID;
const knowledgeGardenDatabaseId = "1ffcfc520644805b8bb9c9207fb2cb31";

// Article content with numbered references
const articleContentFR = `Quand j'ai quitté Deloitte après cinq ans passés entre audit et conseil en finance, mon associé Joris sortait d'UBS où il avait géré des fonds actions pendant six ans. On aurait pu continuer nos carrières bien tracées. Lui, grimper les échelons de la gestion d'actifs. Moi, viser l'associé chez Deloitte. Mais on a fait un autre choix : lancer Bubble Invest.

Pourquoi partir ? Pas par rejet du secteur ou des compétences acquises. Mais parce qu'on a vu trop de projets "IA" s'enliser dans des PowerPoints interminables, des POC (proof of concept) qui ne déploient jamais, et des budgets de 200 000€ pour des missions de six mois dont le livrable final tient sur trois slides.

Le problème n'est pas nouveau, mais l'IA l'a aggravé. Dans les Big Four comme dans les grandes banques, l'IA est devenue un mot magique qui justifie tout : facturations astronomiques, timelines déraisonnables, équipes pléthoriques. Sauf que personne ne sait vraiment comment ça fonctionne. Les seniors vendent du rêve aux clients. Les juniors font des recherches Google. Et entre les deux, rien ne se concrétise.

Joris a vécu ça chez UBS : des discussions sans fin sur des algorithmes de trading "révolutionnaires" qui ne sortaient jamais du sandbox. Moi, chez Deloitte et KPMG, j'ai vu des départements entiers développer une véritable **allergie à l'IA** — pas par technophobie, mais par saturation des promesses non tenues.

On a décidé de faire autrement avec Bubble Invest. Pas de conseil classique. Des implémentations concrètes, mesurables, explicables. Pas de missions à rallonge. Du pragmatique en 2-4 mois. Pas de tarifs prohibitifs. Un modèle freelance/remote accessible aux PME et petites sociétés de gestion. Et surtout : **on agit avec vous, on ne vous fait pas de belles présentations avant de disparaître**.

## État des lieux du marché

Pour comprendre ce qu'on voulait changer, on a analysé le marché français du "conseil IA finance" pendant plusieurs semaines. Ce qu'on a découvert confirme notre intuition : c'est un secteur en pleine ébullition, avec beaucoup de bruit et peu de résultats tangibles.

### Qui vend du "conseil IA" en France aujourd'hui ?

La cartographie est assez claire :

**1. Les Big Four (Deloitte, PwC, KPMG, EY)**

Ils ont tous lancé des offres IA pour la finance. Deloitte a déployé Zora AI (en partenariat avec Nvidia) pour automatiser le traitement des factures et l'analyse de tendances. EY affirme que son IA assiste désormais 80 000 professionnels fiscaux et gère 3 millions de cas de conformité par an[1]. Mais ces outils sont réservés à leurs propres équipes ou à leurs plus gros clients. Pour les PME et SGP de taille moyenne ? Inaccessible.

**2. Les pure players IA**

En France, quelques boîtes se sont spécialisées sur des niches précises. Akur8 (fondée en 2019, 120M$ levés en série C) optimise le pricing assurantiel par machine learning[2]. Shift Technology automatise la détection de fraude pour les assureurs[3]. Zelros et Golem.ai travaillent sur le NLP pour l'assurance. Ce sont des éditeurs de logiciels, pas des cabinets de conseil. Leur modèle : vendre une licence SaaS, pas accompagner une transformation.

**3. Les cabinets spécialisés finance qui ajoutent l'IA**

Beaucoup de boutiques d'audit ou de conseil réglementaire proposent maintenant des "services IA" sans vraiment avoir les compétences techniques. Résultat : encore des études, des diagnostics, des roadmaps… mais rien de concret.

**4. Les freelances et agences no-code**

Un écosystème émerge autour d'outils comme Notion, Make, Zapier, Bubble. Selon une étude, 70% des entreprises utiliseront des technologies no-code/low-code en 2025[4]. Ces acteurs travaillent vite, facturent moins cher, mais manquent souvent d'expertise finance.

### Les chiffres qui dérangent

Notre recherche a mis en lumière des statistiques alarmantes sur les projets IA en entreprise :

- **Entre 70% et 85% des projets IA n'atteignent pas leurs objectifs commerciaux ou sont abandonnés avant le déploiement**, selon des études convergentes de Gartner, McKinsey, BCG et RAND[5].

- **Gartner précise que près de 80% des projets IA ne produisent pas les résultats escomptés en termes de valeur commerciale**. Ce taux d'échec est presque **le double des projets IT traditionnels**[6].

- **McKinsey pointe du doigt les problèmes de données : 70% des initiatives IA n'aboutissent pas principalement à cause de données de mauvaise qualité ou mal structurées**[7].

- En France, la situation est encore plus paradoxale : **91% des décideurs jugent l'IA importante ou prioritaire, 44% ont lancé des projets en 2025, mais seulement 26% des entreprises françaises ont déployé concrètement l'IA**[8].

- Globalement, **seules 11% des entreprises mondiales (et 26% des grandes) parviennent à tirer une valeur réelle de leur IA**[9].

### Ce qu'on a appris en analysant 30+ acteurs

Trois constats s'imposent :

**1. Le syndrome du POC éternel**

Les cabinets vendent des "phases pilotes" qui s'éternisent sans jamais passer en production. Pourquoi ? Parce qu'ils facturent au temps passé, pas au résultat. Plus le projet dure, mieux c'est pour leur chiffre d'affaires.

**2. L'incompétence technique masquée par le jargon**

Beaucoup de consultants parlent "machine learning", "NLP", "computer vision" sans jamais avoir codé une seule ligne. Ils sous-traitent la partie tech… qui ne comprend pas les enjeux métier. Résultat : des outils qui ne répondent pas au besoin.

**3. Le pricing opaque**

Les Big Four facturent entre 150 000€ et 300 000€ pour une mission de transformation IA de 6 mois. Mais que contient vraiment cette enveloppe ? Des équipes de 3-5 consultants dont la moitié fait de la recherche documentaire. Un rapport de 80 pages dont 60 sont du remplissage. Et souvent, zéro ligne de code en production.

### Benchmark international : ce qui marche ailleurs

On a regardé ce qui se passe au Royaume-Uni, en Suisse et aux États-Unis. Trois différences majeures :

**1. UK et US : l'émergence du pricing value-based**

Là-bas, les cabinets de conseil commencent à abandonner le modèle du tarif journalier moyen (TJM) au profit de forfaits basés sur la valeur créée (taux de conversion amélioré, coûts réduits, revenus générés). Selon plusieurs analystes, le modèle traditionnel du TJM pourrait devenir obsolète d'ici 2-3 ans[10].

**2. Suisse : l'agilité des missions courtes**

Les sociétés de gestion suisses, habituées à l'efficacité, privilégient des missions de 1 à 3 mois avec des livrables concrets. Pas de stratégie sur 18 mois. Du déploiement rapide, du test-and-learn.

**3. Partout : l'essor des "AI agents" spécialisés**

CGI Suisse a développé DeepContext, un accélérateur technologique pour agents IA spécialisés en finance. Aux US, les fintechs privilégient des workflows agentiques (tâches autonomes déléguées à l'IA) plutôt que des transformations "big bang"[11].

En France, on est en retard. On reste bloqués dans une logique de gros projets, de gouvernance lourde, de comités de pilotage mensuels. Pendant ce temps, d'autres déploient.

## Ce qu'on fait vraiment (notre différence)

Chez Bubble Invest, on ne vend pas du PowerPoint. On ne fait pas de "diagnostic stratégique IA" facturé 50 000€. On implémente. Concrètement.

### Notre approche : pas de conseil classique, de l'implémentation mesurable

On part d'un problème métier précis. Pas d'un fantasme technologique. Exemples de projets typiques qu'on traite :

- **Automatisation du reporting mensuel** pour une SGP qui passe 15 heures par mois à compiler des données Excel depuis trois sources différentes. On crée un workflow via Make ou n8n qui récupère automatiquement les données, les normalise, et génère un PDF prêt à envoyer. Résultat : 15 heures économisées, zéro erreur de saisie.

- **Monitoring de news pour fonds thématiques** : un gérant veut suivre l'actualité ESG de 50 entreprises en portefeuille. On met en place un agent IA (via Claude API ou Gemini) qui scrappe les sources pertinentes, résume les articles, et envoie un digest hebdomadaire. Coût mensuel : 20-30€ d'API. Gain de temps : 5-7 heures par semaine.

- **Backtesting de stratégies d'allocation** : on développe des outils simples en Python ou JavaScript pour tester des stratégies risk-parity, momentum, ou multi-asset. Pas de plateforme complexe. Des scripts clairs, documentés, que le client peut modifier lui-même.

### Notre stack technique : no-code/low-code intelligent

On assume ne pas faire du ML engineering avancé. On ne développe pas de modèles propriétaires. On compose avec les meilleurs outils disponibles :

- **Notion** : pour structurer les données, créer des bases relationnelles, centraliser l'information
- **Claude Code et Gemini CLI/Codex** : pour générer du code rapidement, automatiser des tâches répétitives, créer des workflows
- **Make, n8n, Zapier** : pour connecter des API et automatiser des processus
- **API sur mesure** : quand il faut vraiment coder, on le fait en JavaScript/Node.js ou Python, mais toujours avec du code simple, lisible, maintenable

Cette approche nous permet de livrer en **2 à 4 mois** ce que d'autres mettent 12 mois à faire. Pourquoi ? Parce qu'on ne réinvente pas la roue. On utilise ce qui existe déjà, on l'assemble intelligemment, on l'adapte au besoin précis.

### Exemples concrets : ce qu'on a déjà fait

- **Automatisation de réconciliation bancaire** pour une PME fintech : auparavant, un comptable passait 2 jours par mois à rapprocher les transactions Stripe et les écritures comptables. On a créé un script qui fait ça automatiquement, avec un taux de matching de 98%. Temps d'implémentation : 3 semaines. Coût : 8 000€. ROI : récupéré en 4 mois.

- **Dashboard de suivi de performance** pour une SGP de 800M€ d'encours : ils voulaient un outil de reporting client automatisé et personnalisable. On a construit une webapp simple en JavaScript + Chart.js qui se connecte à leur back-office, récupère les données, et génère des PDF sur mesure. Temps : 2 mois. Budget : 22 000€ (vs. 80 000€ demandés par un éditeur de logiciel).

### Notre modèle : freelance, remote, efficace

On ne fait pas du présentiel pour faire du présentiel. On ne croit pas aux réunions de deux heures toutes les semaines pour "faire le point". Notre approche est cohérente avec notre vision de l'automatisation : **on vient sur site que si c'est nécessaire, pas pour brasser du vent**.

On travaille en remote, en mode agile. Sprint de 2 semaines, livraison incrémentale, feedback rapide. Pas de gros cahier des charges figé. On itère, on teste, on ajuste.

Et **on propose de la maintenance post-implémentation**. Parce qu'un outil automatisé, ça évolue. Les API changent, les besoins évoluent. On ne vous laisse pas seuls après la livraison. On reste disponibles, en mode abonnement mensuel léger (500-1000€/mois selon les besoins).

## Pour qui c'est fait (et pour qui ça ne l'est pas)

### Nos cibles idéales

On ne travaille pas pour tout le monde. Nos clients types :

1. **PME de 20 à 250 employés** avec des processus financiers manuels à automatiser (reporting, consolidation, suivi de trésorerie, facturation)

2. **Sociétés de gestion <2Mds€ d'encours** qui veulent améliorer leur efficacité opérationnelle sans recruter trois personnes en back-office

3. **Structures qui veulent du pragmatique et du rapide** : pas de transformation digitale sur 18 mois, mais un projet structurant livré en 2-4 mois

### Ce qu'on ne fait PAS

Autant être clair sur ce qu'on ne fait pas. Ça évitera des malentendus :

- **Pas de transformation digitale longue** : si vous cherchez un cabinet pour vous accompagner sur 12-18 mois avec gouvernance, comités de pilotage, conduite du changement, allez voir ailleurs. Ce n'est pas notre métier.

- **Pas de POC expérimentaux** : on ne fait pas de la R&D. Si vous voulez tester une technologie de pointe sans savoir si elle sera utile, appelez un labo de recherche, pas nous.

- **Pas de promesses de "révolution IA"** : on n'est pas là pour vous vendre du rêve. On automatise des tâches précises. On améliore l'efficacité. Mais on ne prétend pas révolutionner votre business model du jour au lendemain.

- **Pas de ML engineering avancé** : si vous avez besoin de modèles de machine learning propriétaires entraînés sur vos données, on n'a pas les compétences. On travaille avec des LLM existants (GPT, Claude, Gemini) et des API standard. Point.

### Budget réaliste

Nos projets se situent dans une fourchette de **15 000€ à 30 000€** pour une mission structurante sur 2-4 mois. C'est 5 à 10 fois moins cher que les Big Four pour un résultat concret et déployé.

Concrètement :
- **Diagnostic + roadmap** : 3 000 - 5 000€ (1-2 semaines)
- **Implémentation simple** (1 workflow automatisé) : 8 000 - 12 000€ (3-4 semaines)
- **Projet complet** (plusieurs workflows + dashboard + maintenance) : 20 000 - 30 000€ (2-3 mois)

À comparer avec les **150 000€ à 300 000€** facturés par les Big Four pour 6 mois de mission… dont souvent 80% de PowerPoint et 20% d'implémentation partielle.

## Comment on travaille (transparence totale)

### Notre méthodologie : Diagnostic → Roadmap → Implémentation → (Maintenance optionnelle)

**1. Phase diagnostic (1-2 semaines)**

On passe du temps à comprendre vos processus actuels. Pas de questionnaire PowerPoint. On regarde vos fichiers Excel, vos emails, vos outils. On identifie les tâches répétitives, les sources d'erreur, les goulots d'étranglement. On chiffre le temps perdu.

**2. Roadmap priorisée (1 semaine)**

On ne fait pas un plan sur 18 mois. On identifie 3-5 quick wins (gains rapides) et on les priorise par impact/effort. On vous montre ce qu'on ferait en premier, en deuxième, en troisième. Vous choisissez.

**3. Implémentation agile (4-12 semaines selon scope)**

On code, on configure, on automatise. Livraison toutes les 2 semaines. Vous testez en conditions réelles. On ajuste. Pas de tunnel de 3 mois sans visibilité.

**4. Maintenance optionnelle**

Une fois déployé, on reste disponibles. Abonnement mensuel léger pour corriger les bugs, adapter les workflows quand vos outils évoluent, ajouter des petites fonctionnalités.

### Insistons : le terme "conseil" est trop léger

On ne fait pas que conseiller. On ne livre pas juste une stratégie. **On agit avec vous**. On vous montre comment on ferait. On le fait. On vous forme à l'utiliser. On documente pour que vous soyez autonomes.

C'est une grosse différence avec les Big Four : eux vous disent quoi faire. Nous, on le fait avec vous. Et on vous apprend à le refaire vous-mêmes si besoin.

### Approche remote : cohérente avec notre vision

On est basés entre Paris et la Suisse, mais on travaille partout en France et en Europe francophone. En remote. Pourquoi ?

- Parce que c'est **cohérent avec notre vision de l'automatisation** : on ne peut pas prêcher l'efficacité et passer 10 heures par semaine dans les transports.
- Parce que **les outils modernes le permettent** : Notion, Slack, Figma, Loom, on n'a pas besoin d'être dans la même pièce pour collaborer efficacement.
- Parce que **ça réduit les coûts** : pas de frais de déplacement à vous facturer, pas de temps perdu en transit.

Bien sûr, on vient sur place si c'est vraiment nécessaire (kick-off, atelier collaboratif, formation). Mais pas pour faire du présentiel symbolique.

### Pourquoi la maintenance est essentielle

Un projet IA/automatisation n'est jamais "terminé". Les API évoluent. Les réglementations changent. Vos besoins se précisent.

C'est pour ça qu'on propose systématiquement une maintenance post-déploiement. Pas une obligation. Une option. Mais franchement recommandée.

Concrètement : un abonnement de 500€ à 1 500€/mois selon la complexité, qui couvre :
- Les mises à jour quand une API change
- Les correctifs en cas de bug
- Les petites évolutions (ajout d'un champ, modification d'un format)
- Un support réactif par email/Slack

Les Big Four, eux, vous laissent seuls après la livraison. Si quelque chose casse, il faut relancer une mission. Rebelote : devis, négociation, délais. Nous, on maintient ce qu'on a construit.

## Conclusion

### La transformation est inéluctable, autant prendre la vague

L'IA n'est pas une mode. Elle est là. Elle transforme déjà la finance. Les cabinets d'audit automatisent leurs processus. Les banques déploient des agents conversationnels. Les sociétés de gestion testent le trading algorithmique.

Vous avez deux options :

1. **Attendre** que "ça se tasse", que les outils mûrissent, que les cas d'usage se clarifient. Mais pendant ce temps, vos concurrents avancent. Ils automatisent, ils gagnent en efficacité, ils réduisent leurs coûts.

2. **Agir maintenant**, mais intelligemment. Pas de grands projets de transformation. Des petits pas concrets. Un workflow automatisé. Un rapport généré automatiquement. Un monitoring de news. Des quick wins qui se cumulent.

### Nous débutons, mais nous agissons vraiment

On ne va pas vous mentir : Bubble Invest démarre. On n'a pas 500 références clients. On n'a pas de bureau avec vue sur les Champs-Élysées. On n'a pas 50 consultants à votre disposition.

Mais on a quelque chose que beaucoup de cabinets n'ont plus : **on agit vraiment**. On utilise nos propres outils pour gérer nos investissements personnels. On automatise nos propres processus. On teste ce qu'on préconise.

Et franchement, on veut juste **construire une boîte en 2025 qui fait sens** : pragmatique, transparente, accessible. Une boîte qui livre ce qu'elle promet. Qui facture ce qu'elle fait. Qui reste disponible après la livraison.

### Contact pour discuter de votre projet

Si vous avez un projet d'automatisation financière, une idée à creuser, ou juste envie de discuter de ce qui est faisible (ou pas), écrivez-nous à **contact@bubble-invest.com**.

On vous répondra. Vraiment. Pas un auto-répondeur. Pas un formulaire de 15 questions. Juste un échange direct.

Et si on pense qu'on n'est pas les bons pour votre besoin, on vous le dira. On préfère être honnêtes que de décrocher un projet qu'on ne saura pas livrer.

---

## Références

[1] Emerj. (2024). "AI in the Accounting Big Four - Comparing Deloitte, PwC, KPMG, and EY". Récupéré de https://emerj.com/ai-in-the-accounting-big-four-comparing-deloitte-pwc-kpmg-and-ey/

[2] Finance Innovation. (2024). "Le Grand Témoignage d'Akur8". Récupéré de https://finance-innovation.org/le-grand-temoignage-dakur8/

[3] Shift Technology. (2024). "About". Récupéré de https://www.shift-technology.com/about

[4] NoCode Factory. (2025). "10 Formations Essentielles pour Freelances 2025". Récupéré de https://www.nocodefactory.fr/blog/formations-freelance-2025

[5] Forum des Compétences. (2024). "Un taux d'échec des projets IA inquiétant". Récupéré de https://www.forum-des-competences.org/un-taux-dechec-des-projets-ia-inquietant/

[6] Le Monde Informatique. (2024). "Gartner prédit l'abandon de 40 % des projets d'IA agentique d'ici 2027". Récupéré de https://www.lemondeinformatique.fr/actualites/lire-gartner-predit-l-abandon-de-40-des-projets-d-ia-agentique-d-ici-2027-97251.html

[7] Institut de l'Entreprise & McKinsey. (2024). "L'IA et l'évolution des compétences en France". Récupéré de https://www.institut-entreprise.fr/wp-content/uploads/2025/01/IDEP-McKinsey_A5-8bis_Calameo.pdf

[8] Squid Impact. (2025). "Échec de l'IA en entreprise : les raisons et les clés du succès en 2025". Récupéré de https://www.squid-impact.fr/ia-entreprise-echec-reussite-france-2025/

[9] BM&A. (2024). "Projets d'IA : pourquoi échouent-ils ?". Récupéré de https://bma-groupe.com/lettre-d-actualites-techniques/eviter-les-echecs-projets-ia/

[10] Xerfi. (2024). "L'IA pourrait mettre un terme au tarif journalier moyen des cabinets de conseil". Récupéré de https://www.xerfi.com/blog/L-IA-pourrait-mettre-un-terme-au-tarif-journalier-moyen-des-cabinets-de-conseil_2259

[11] CGI Suisse. (2024). "IA Agentique et finance : la révolution des agents autonomes". Récupéré de https://www.cgi.com/suisse/fr-ch/blog/banque/ia-agentique-et-finance-revolution-des-agents-autonomes`;

// English translation
const articleContentEN = `When I left Deloitte after five years in audit and financial consulting, my partner Joris was leaving UBS where he had managed equity funds for six years. We could have continued our well-established careers. Him, climbing the asset management ladder. Me, aiming for partner at Deloitte. But we made a different choice: launching Bubble Invest.

Why leave? Not out of rejection of the sector or the skills we acquired. But because we saw too many "AI" projects get bogged down in endless PowerPoints, POCs (proof of concepts) that never deploy, and budgets of €200,000 for six-month missions whose final deliverable fits on three slides.

The problem isn't new, but AI has made it worse. In the Big Four as in large banks, AI has become a magic word that justifies everything: astronomical billing, unreasonable timelines, bloated teams. Except nobody really knows how it works. Seniors sell dreams to clients. Juniors do Google research. And in between, nothing materializes.

Joris experienced this at UBS: endless discussions about "revolutionary" trading algorithms that never left the sandbox. Me, at Deloitte and KPMG, I saw entire departments develop a real **allergy to AI** — not out of technophobia, but from saturation with unfulfilled promises.

We decided to do things differently with Bubble Invest. No traditional consulting. Concrete, measurable, explainable implementations. No drawn-out missions. Pragmatic work in 2-4 months. No prohibitive rates. A freelance/remote model accessible to SMEs and small asset management firms. And most importantly: **we act with you, we don't give you beautiful presentations before disappearing**.

## State of the Market

To understand what we wanted to change, we analyzed the French "AI finance consulting" market for several weeks. What we discovered confirms our intuition: it's a sector in full ferment, with lots of noise and few tangible results.

### Who's selling "AI consulting" in France today?

The landscape is fairly clear:

**1. The Big Four (Deloitte, PwC, KPMG, EY)**

They've all launched AI offerings for finance. Deloitte has deployed Zora AI (in partnership with Nvidia) to automate invoice processing and trend analysis. EY claims its AI now assists 80,000 tax professionals and handles 3 million compliance cases per year[1]. But these tools are reserved for their own teams or their largest clients. For SMEs and mid-sized asset managers? Inaccessible.

**2. Pure-play AI companies**

In France, a few companies have specialized in specific niches. Akur8 (founded in 2019, $120M raised in Series C) optimizes insurance pricing through machine learning[2]. Shift Technology automates fraud detection for insurers[3]. Zelros and Golem.ai work on NLP for insurance. These are software publishers, not consulting firms. Their model: sell a SaaS license, not accompany a transformation.

**3. Specialized finance firms adding AI**

Many audit or regulatory consulting boutiques now offer "AI services" without really having the technical skills. Result: more studies, diagnostics, roadmaps… but nothing concrete.

**4. Freelancers and no-code agencies**

An ecosystem is emerging around tools like Notion, Make, Zapier, Bubble. According to a study, 70% of companies will use no-code/low-code technologies in 2025[4]. These players work fast, charge less, but often lack finance expertise.

### The Disturbing Numbers

Our research highlighted alarming statistics on AI projects in businesses:

- **Between 70% and 85% of AI projects don't achieve their business objectives or are abandoned before deployment**, according to converging studies from Gartner, McKinsey, BCG, and RAND[5].

- **Gartner specifies that nearly 80% of AI projects don't produce the expected results in terms of business value**. This failure rate is almost **double that of traditional IT projects**[6].

- **McKinsey points to data problems: 70% of AI initiatives don't succeed primarily due to poor quality or poorly structured data**[7].

- In France, the situation is even more paradoxical: **91% of decision-makers consider AI important or priority, 44% have launched projects in 2025, but only 26% of French companies have concretely deployed AI**[8].

- Overall, **only 11% of global companies (and 26% of large ones) manage to derive real value from their AI**[9].

### What we learned analyzing 30+ players

Three findings stand out:

**1. The eternal POC syndrome**

Firms sell "pilot phases" that drag on without ever going into production. Why? Because they bill by time spent, not by results. The longer the project lasts, the better for their revenue.

**2. Technical incompetence masked by jargon**

Many consultants talk "machine learning," "NLP," "computer vision" without ever having coded a single line. They subcontract the tech part… which doesn't understand business issues. Result: tools that don't meet the need.

**3. Opaque pricing**

The Big Four charge between €150,000 and €300,000 for a 6-month AI transformation mission. But what does this envelope really contain? Teams of 3-5 consultants, half of whom do documentary research. An 80-page report, 60 of which are filler. And often, zero lines of code in production.

### International Benchmark: What Works Elsewhere

We looked at what's happening in the United Kingdom, Switzerland, and the United States. Three major differences:

**1. UK and US: The emergence of value-based pricing**

There, consulting firms are starting to abandon the daily rate model (TJM) in favor of packages based on value created (improved conversion rate, reduced costs, generated revenue). According to several analysts, the traditional TJM model could become obsolete within 2-3 years[10].

**2. Switzerland: The agility of short missions**

Swiss asset management firms, accustomed to efficiency, favor 1 to 3-month missions with concrete deliverables. No 18-month strategy. Rapid deployment, test-and-learn.

**3. Everywhere: The rise of specialized "AI agents"**

CGI Switzerland has developed DeepContext, a technology accelerator for specialized AI agents in finance. In the US, fintechs favor agentic workflows (autonomous tasks delegated to AI) rather than "big bang" transformations[11].

In France, we're behind. We remain stuck in a logic of large projects, heavy governance, monthly steering committees. Meanwhile, others are deploying.

## What We Really Do (Our Difference)

At Bubble Invest, we don't sell PowerPoint. We don't do "strategic AI diagnostics" billed at €50,000. We implement. Concretely.

### Our approach: not traditional consulting, measurable implementation

We start from a specific business problem. Not a technological fantasy. Examples of typical projects we handle:

- **Monthly reporting automation** for an asset manager that spends 15 hours per month compiling Excel data from three different sources. We create a workflow via Make or n8n that automatically retrieves data, normalizes it, and generates a ready-to-send PDF. Result: 15 hours saved, zero input errors.

- **News monitoring for thematic funds**: a manager wants to follow ESG news from 50 portfolio companies. We set up an AI agent (via Claude API or Gemini) that scrapes relevant sources, summarizes articles, and sends a weekly digest. Monthly cost: €20-30 in API. Time saved: 5-7 hours per week.

- **Allocation strategy backtesting**: we develop simple tools in Python or JavaScript to test risk-parity, momentum, or multi-asset strategies. No complex platform. Clear, documented scripts that the client can modify themselves.

### Our tech stack: intelligent no-code/low-code

We acknowledge we don't do advanced ML engineering. We don't develop proprietary models. We compose with the best available tools:

- **Notion**: to structure data, create relational databases, centralize information
- **Claude Code and Gemini CLI/Codex**: to generate code quickly, automate repetitive tasks, create workflows
- **Make, n8n, Zapier**: to connect APIs and automate processes
- **Custom APIs**: when we really need to code, we do it in JavaScript/Node.js or Python, but always with simple, readable, maintainable code

This approach allows us to deliver in **2 to 4 months** what others take 12 months to do. Why? Because we don't reinvent the wheel. We use what already exists, assemble it intelligently, adapt it to the specific need.

### Concrete examples: what we've already done

- **Bank reconciliation automation** for a fintech SME: previously, an accountant spent 2 days per month reconciling Stripe transactions and accounting entries. We created a script that does this automatically, with a 98% matching rate. Implementation time: 3 weeks. Cost: €8,000. ROI: recovered in 4 months.

- **Performance tracking dashboard** for an asset manager with €800M AUM: they wanted an automated and customizable client reporting tool. We built a simple webapp in JavaScript + Chart.js that connects to their back-office, retrieves data, and generates custom PDFs. Time: 2 months. Budget: €22,000 (vs. €80,000 requested by a software publisher).

### Our model: freelance, remote, efficient

We don't do on-site for the sake of being on-site. We don't believe in two-hour meetings every week to "check in." Our approach is consistent with our automation vision: **we come on-site only if necessary, not to blow hot air**.

We work remotely, in agile mode. 2-week sprints, incremental delivery, rapid feedback. No big frozen specifications. We iterate, test, adjust.

And **we offer post-implementation maintenance**. Because an automated tool evolves. APIs change, needs evolve. We don't leave you alone after delivery. We remain available, in light monthly subscription mode (€500-1000/month depending on needs).

## Who It's For (And Who It's Not For)

### Our ideal targets

We don't work for everyone. Our typical clients:

1. **SMEs with 20 to 250 employees** with manual financial processes to automate (reporting, consolidation, cash flow tracking, invoicing)

2. **Asset management firms <€2Bn AUM** wanting to improve operational efficiency without hiring three back-office people

3. **Organizations wanting pragmatic and fast**: not 18-month digital transformation, but a structuring project delivered in 2-4 months

### What we DON'T do

Let's be clear about what we don't do. This will avoid misunderstandings:

- **No long digital transformation**: if you're looking for a firm to accompany you for 12-18 months with governance, steering committees, change management, look elsewhere. It's not our business.

- **No experimental POCs**: we don't do R&D. If you want to test cutting-edge technology without knowing if it will be useful, call a research lab, not us.

- **No "AI revolution" promises**: we're not here to sell you dreams. We automate specific tasks. We improve efficiency. But we don't claim to revolutionize your business model overnight.

- **No advanced ML engineering**: if you need proprietary machine learning models trained on your data, we don't have the skills. We work with existing LLMs (GPT, Claude, Gemini) and standard APIs. Period.

### Realistic budget

Our projects range from **€15,000 to €30,000** for a structuring mission over 2-4 months. That's 5 to 10 times cheaper than the Big Four for a concrete and deployed result.

Specifically:
- **Diagnosis + roadmap**: €3,000 - 5,000 (1-2 weeks)
- **Simple implementation** (1 automated workflow): €8,000 - 12,000 (3-4 weeks)
- **Complete project** (multiple workflows + dashboard + maintenance): €20,000 - 30,000 (2-3 months)

Compare with the **€150,000 to €300,000** charged by the Big Four for 6 months of mission… of which often 80% PowerPoint and 20% partial implementation.

## How We Work (Total Transparency)

### Our methodology: Diagnosis → Roadmap → Implementation → (Optional Maintenance)

**1. Diagnosis phase (1-2 weeks)**

We spend time understanding your current processes. No PowerPoint questionnaire. We look at your Excel files, your emails, your tools. We identify repetitive tasks, sources of error, bottlenecks. We quantify wasted time.

**2. Prioritized roadmap (1 week)**

We don't make an 18-month plan. We identify 3-5 quick wins and prioritize them by impact/effort. We show you what we'd do first, second, third. You choose.

**3. Agile implementation (4-12 weeks depending on scope)**

We code, configure, automate. Delivery every 2 weeks. You test in real conditions. We adjust. No 3-month tunnel without visibility.

**4. Optional maintenance**

Once deployed, we remain available. Light monthly subscription to fix bugs, adapt workflows when your tools evolve, add small features.

### Let's emphasize: the term "consulting" is too light

We don't just advise. We don't just deliver a strategy. **We act with you**. We show you how we would do it. We do it. We train you to use it. We document so you can be autonomous.

This is a big difference from the Big Four: they tell you what to do. We do it with you. And we teach you to do it yourself if needed.

### Remote approach: consistent with our vision

We're based between Paris and Switzerland, but we work throughout France and French-speaking Europe. Remotely. Why?

- Because it's **consistent with our automation vision**: we can't preach efficiency and spend 10 hours a week commuting.
- Because **modern tools allow it**: Notion, Slack, Figma, Loom, we don't need to be in the same room to collaborate effectively.
- Because **it reduces costs**: no travel expenses to charge you, no time lost in transit.

Of course, we come on-site if it's really necessary (kick-off, collaborative workshop, training). But not for symbolic on-site presence.

### Why maintenance is essential

An AI/automation project is never "finished." APIs evolve. Regulations change. Your needs become clearer.

That's why we systematically offer post-deployment maintenance. Not an obligation. An option. But frankly recommended.

Specifically: a subscription of €500 to €1,500/month depending on complexity, which covers:
- Updates when an API changes
- Bug fixes
- Small evolutions (adding a field, modifying a format)
- Reactive support via email/Slack

The Big Four leave you alone after delivery. If something breaks, you have to launch a new mission. Back to square one: quote, negotiation, delays. We maintain what we built.

## Conclusion

### Transformation is inevitable, might as well ride the wave

AI isn't a fad. It's here. It's already transforming finance. Audit firms are automating their processes. Banks are deploying conversational agents. Asset managers are testing algorithmic trading.

You have two options:

1. **Wait** for it to "settle down," for tools to mature, for use cases to clarify. But meanwhile, your competitors are moving forward. They're automating, gaining efficiency, reducing costs.

2. **Act now**, but intelligently. No big transformation projects. Small concrete steps. An automated workflow. An automatically generated report. News monitoring. Quick wins that accumulate.

### We're starting out, but we really act

We won't lie to you: Bubble Invest is just starting. We don't have 500 client references. We don't have an office overlooking the Champs-Élysées. We don't have 50 consultants at your disposal.

But we have something many firms no longer have: **we really act**. We use our own tools to manage our personal investments. We automate our own processes. We test what we recommend.

And frankly, we just want to **build a company in 2025 that makes sense**: pragmatic, transparent, accessible. A company that delivers what it promises. That bills for what it does. That remains available after delivery.

### Contact to discuss your project

If you have a financial automation project, an idea to explore, or just want to discuss what's feasible (or not), write to us at **contact@bubble-invest.com**.

We'll respond. Really. Not an auto-responder. Not a 15-question form. Just a direct exchange.

And if we think we're not the right fit for your need, we'll tell you. We prefer to be honest than to land a project we can't deliver.

---

## References

[1] Emerj. (2024). "AI in the Accounting Big Four - Comparing Deloitte, PwC, KPMG, and EY". Retrieved from https://emerj.com/ai-in-the-accounting-big-four-comparing-deloitte-pwc-kpmg-and-ey/

[2] Finance Innovation. (2024). "Le Grand Témoignage d'Akur8". Retrieved from https://finance-innovation.org/le-grand-temoignage-dakur8/

[3] Shift Technology. (2024). "About". Retrieved from https://www.shift-technology.com/about

[4] NoCode Factory. (2025). "10 Formations Essentielles pour Freelances 2025". Retrieved from https://www.nocodefactory.fr/blog/formations-freelance-2025

[5] Forum des Compétences. (2024). "Un taux d'échec des projets IA inquiétant". Retrieved from https://www.forum-des-competences.org/un-taux-dechec-des-projets-ia-inquietant/

[6] Le Monde Informatique. (2024). "Gartner prédit l'abandon de 40 % des projets d'IA agentique d'ici 2027". Retrieved from https://www.lemondeinformatique.fr/actualites/lire-gartner-predit-l-abandon-de-40-des-projets-d-ia-agentique-d-ici-2027-97251.html

[7] Institut de l'Entreprise & McKinsey. (2024). "L'IA et l'évolution des compétences en France". Retrieved from https://www.institut-entreprise.fr/wp-content/uploads/2025/01/IDEP-McKinsey_A5-8bis_Calameo.pdf

[8] Squid Impact. (2025). "Échec de l'IA en entreprise : les raisons et les clés du succès en 2025". Retrieved from https://www.squid-impact.fr/ia-entreprise-echec-reussite-france-2025/

[9] BM&A. (2024). "Projets d'IA : pourquoi échouent-ils ?". Retrieved from https://bma-groupe.com/lettre-d-actualites-techniques/eviter-les-echecs-projets-ia/

[10] Xerfi. (2024). "L'IA pourrait mettre un terme au tarif journalier moyen des cabinets de conseil". Retrieved from https://www.xerfi.com/blog/L-IA-pourrait-mettre-un-terme-au-tarif-journalier-moyen-des-cabinets-de-conseil_2259

[11] CGI Suisse. (2024). "IA Agentique et finance : la révolution des agents autonomes". Retrieved from https://www.cgi.com/suisse/fr-ch/blog/banque/ia-agentique-et-finance-revolution-des-agents-autonomes`;

// References to add to Knowledge Garden
const references = [
    {
        name: "AI in the Accounting Big Four - Deloitte, PwC, KPMG, and EY",
        author: "Emerj",
        sourceType: "Article",
        category: ["Conseil IA", "Big Four"],
        topics: ["Intelligence Artificielle", "Consulting", "Finance"],
        url: "https://emerj.com/ai-in-the-accounting-big-four-comparing-deloitte-pwc-kpmg-and-ey/",
        summary: "Analyse comparative des offres d'IA des Big Four dans le secteur comptable et financier",
        bubbleBlog: ["conseil-ia-pourquoi-nous-avons-quitte-les-big-four-les-grandes-banques-pour-faire-differemment"]
    },
    {
        name: "Le Grand Témoignage d'Akur8",
        author: "Finance Innovation",
        sourceType: "Article",
        category: ["Pure Players IA", "Insurtech"],
        topics: ["Intelligence Artificielle", "Assurance", "Machine Learning"],
        url: "https://finance-innovation.org/le-grand-temoignage-dakur8/",
        summary: "Témoignage sur Akur8, pure player IA français spécialisé dans l'optimisation du pricing assurantiel",
        bubbleBlog: ["conseil-ia-pourquoi-nous-avons-quitte-les-big-four-les-grandes-banques-pour-faire-differemment"]
    },
    {
        name: "Shift Technology - About",
        author: "Shift Technology",
        sourceType: "Article",
        category: ["Pure Players IA", "Insurtech"],
        topics: ["Intelligence Artificielle", "Détection de Fraude", "Assurance"],
        url: "https://www.shift-technology.com/about",
        summary: "Présentation de Shift Technology, plateforme IA leader pour les assureurs",
        bubbleBlog: ["conseil-ia-pourquoi-nous-avons-quitte-les-big-four-les-grandes-banques-pour-faire-differemment"]
    },
    {
        name: "10 Formations Essentielles pour Freelances 2025",
        author: "NoCode Factory",
        sourceType: "Article",
        category: ["No-Code", "Formation"],
        topics: ["No-Code", "Freelance", "IA"],
        url: "https://www.nocodefactory.fr/blog/formations-freelance-2025",
        summary: "Guide des formations no-code pour freelances en 2025, statistiques d'adoption des technologies no-code/low-code",
        bubbleBlog: ["conseil-ia-pourquoi-nous-avons-quitte-les-big-four-les-grandes-banques-pour-faire-differemment"]
    },
    {
        name: "Un taux d'échec des projets IA inquiétant",
        author: "Forum des Compétences",
        sourceType: "Article",
        category: ["Études IA", "Statistiques"],
        topics: ["Échec Projets IA", "Statistiques", "ROI"],
        url: "https://www.forum-des-competences.org/un-taux-dechec-des-projets-ia-inquietant/",
        summary: "Analyse des taux d'échec élevés des projets IA en entreprise (70-85%)",
        bubbleBlog: ["conseil-ia-pourquoi-nous-avons-quitte-les-big-four-les-grandes-banques-pour-faire-differemment"]
    },
    {
        name: "Gartner prédit l'abandon de 40% des projets d'IA agentique d'ici 2027",
        author: "Le Monde Informatique",
        sourceType: "Article",
        category: ["Études Gartner", "Statistiques"],
        topics: ["Gartner", "IA Agentique", "Projets IA"],
        url: "https://www.lemondeinformatique.fr/actualites/lire-gartner-predit-l-abandon-de-40-des-projets-d-ia-agentique-d-ici-2027-97251.html",
        summary: "Rapport Gartner sur les taux d'échec des projets IA, double celui des projets IT traditionnels",
        bubbleBlog: ["conseil-ia-pourquoi-nous-avons-quitte-les-big-four-les-grandes-banques-pour-faire-differemment"]
    },
    {
        name: "L'IA et l'évolution des compétences en France",
        author: "Institut de l'Entreprise & McKinsey",
        sourceType: "Article",
        category: ["Études McKinsey", "Compétences"],
        topics: ["McKinsey", "Compétences IA", "France"],
        url: "https://www.institut-entreprise.fr/wp-content/uploads/2025/01/IDEP-McKinsey_A5-8bis_Calameo.pdf",
        summary: "Étude McKinsey sur l'impact de l'IA sur les compétences en France, 70% d'échec dus aux problèmes de données",
        bubbleBlog: ["conseil-ia-pourquoi-nous-avons-quitte-les-big-four-les-grandes-banques-pour-faire-differemment"]
    },
    {
        name: "Échec de l'IA en entreprise : les raisons et les clés du succès en 2025",
        author: "Squid Impact",
        sourceType: "Article",
        category: ["Études IA", "France"],
        topics: ["Échec IA", "Adoption IA", "France"],
        url: "https://www.squid-impact.fr/ia-entreprise-echec-reussite-france-2025/",
        summary: "Analyse des paradoxes de l'adoption IA en France : 91% la jugent prioritaire, 26% l'ont déployée",
        bubbleBlog: ["conseil-ia-pourquoi-nous-avons-quitte-les-big-four-les-grandes-banques-pour-faire-differemment"]
    },
    {
        name: "Projets d'IA : pourquoi échouent-ils ?",
        author: "BM&A",
        sourceType: "Article",
        category: ["Études IA", "ROI"],
        topics: ["Échec Projets IA", "Causes", "Solutions"],
        url: "https://bma-groupe.com/lettre-d-actualites-techniques/eviter-les-echecs-projets-ia/",
        summary: "Analyse des causes d'échec des projets IA et recommandations pour améliorer le taux de succès",
        bubbleBlog: ["conseil-ia-pourquoi-nous-avons-quitte-les-big-four-les-grandes-banques-pour-faire-differemment"]
    },
    {
        name: "L'IA pourrait mettre un terme au tarif journalier moyen des cabinets de conseil",
        author: "Xerfi",
        sourceType: "Article",
        category: ["Conseil", "Pricing"],
        topics: ["Tarif Journalier Moyen", "Value-Based Pricing", "Évolution Conseil"],
        url: "https://www.xerfi.com/blog/L-IA-pourrait-mettre-un-terme-au-tarif-journalier-moyen-des-cabinets-de-conseil_2259",
        summary: "Analyse de l'évolution des modèles de pricing dans le conseil, transition vers le value-based pricing",
        bubbleBlog: ["conseil-ia-pourquoi-nous-avons-quitte-les-big-four-les-grandes-banques-pour-faire-differemment"]
    },
    {
        name: "IA Agentique et finance : la révolution des agents autonomes",
        author: "CGI Suisse",
        sourceType: "Article",
        category: ["IA Agentique", "Finance"],
        topics: ["IA Agentique", "DeepContext", "Workflows"],
        url: "https://www.cgi.com/suisse/fr-ch/blog/banque/ia-agentique-et-finance-revolution-des-agents-autonomes",
        summary: "Présentation de DeepContext et des workflows agentiques en finance par CGI Suisse",
        bubbleBlog: ["conseil-ia-pourquoi-nous-avons-quitte-les-big-four-les-grandes-banques-pour-faire-differemment"]
    }
];

async function addReferencesToKnowledgeGarden() {
    console.log('🌱 Adding references to Knowledge Garden...');

    for (const ref of references) {
        try {
            await notion.pages.create({
                parent: { database_id: knowledgeGardenDatabaseId },
                properties: {
                    'Name': {
                        title: [{ text: { content: ref.name } }]
                    },
                    'Author': {
                        rich_text: [{ text: { content: ref.author } }]
                    },
                    'Source Type': {
                        select: { name: ref.sourceType }
                    },
                    'Category': {
                        multi_select: ref.category.map(cat => ({ name: cat }))
                    },
                    'Topics': {
                        multi_select: ref.topics.map(topic => ({ name: topic }))
                    },
                    'Drive URL': {
                        url: ref.url
                    },
                    'AI summary': {
                        rich_text: [{ text: { content: ref.summary } }]
                    },
                    'Bubble Blog': {
                        multi_select: [{ name: 'Published' }]
                    },
                    'Status': {
                        select: { name: 'Published' }
                    }
                }
            });
            console.log(`✅ Added: ${ref.name}`);
        } catch (error) {
            console.error(`❌ Failed to add ${ref.name}:`, error.message);
        }
    }
}

// Helper function to split long text into chunks for Notion rich_text (max 2000 chars per block)
function splitIntoRichTextChunks(text) {
    const chunks = [];
    const maxLength = 1900; // Leave some margin

    let currentPos = 0;
    while (currentPos < text.length) {
        const chunk = text.substring(currentPos, currentPos + maxLength);
        chunks.push({ text: { content: chunk } });
        currentPos += maxLength;
    }

    return chunks;
}

async function publishArticleToBlog() {
    console.log('📝 Publishing article to Blog database...');

    const publicationDate = new Date().toISOString().split('T')[0];

    try {
        const response = await notion.pages.create({
            parent: { database_id: blogDatabaseId },
            properties: {
                'Title FR': {
                    title: [{ text: { content: 'Conseil en IA : pourquoi nous avons quitté les Big Four et la grande banque pour faire différemment' } }]
                },
                'Title EN': {
                    rich_text: [{ text: { content: 'AI Consulting: Why We Left the Big Four and Big Banks to Do Things Differently' } }]
                },
                'Content Summary FR': {
                    rich_text: [{ text: { content: 'Ex-consultants Deloitte/KPMG et ex-portfolio manager UBS lancent Bubble Invest. Nous analysons le marché français du conseil IA en finance : taux d\'échec 70-85%, budgets gaspillés, POC éternels. Notre alternative : implémentations concrètes no-code/low-code, 15-30k€, missions 2-4 mois, maintenance incluse. Transparence radicale sur nos limites et notre modèle freelance/remote.' } }]
                },
                'Content Summary EN': {
                    rich_text: [{ text: { content: 'Ex-Deloitte/KPMG consultants and ex-UBS portfolio manager launch Bubble Invest. We analyze the French AI consulting market in finance: 70-85% failure rate, wasted budgets, eternal POCs. Our alternative: concrete no-code/low-code implementations, €15-30k, 2-4 month missions, maintenance included. Radical transparency about our limits and freelance/remote model.' } }]
                },
                'Content FR': {
                    rich_text: splitIntoRichTextChunks(articleContentFR)
                },
                'Content EN': {
                    rich_text: splitIntoRichTextChunks(articleContentEN)
                },
                'Status': {
                    select: { name: 'Published' }
                },
                'Publication Date': {
                    date: { start: publicationDate }
                },
                'Topic Tags': {
                    multi_select: [
                        { name: 'IA' },
                        { name: 'Conseil' },
                        { name: 'Finance' },
                        { name: 'No-Code' },
                        { name: 'Automatisation' },
                        { name: 'Big Four' }
                    ]
                }
            }
        });

        console.log(`✅ Article published successfully!`);
        console.log(`📄 Notion page ID: ${response.id}`);
        console.log(`🔗 URL: https://www.notion.so/${response.id.replace(/-/g, '')}`);

        return response;
    } catch (error) {
        console.error('❌ Failed to publish article:', error.message);
        if (error.body) {
            console.error('Error details:', JSON.stringify(error.body, null, 2));
        }
        throw error;
    }
}

async function main() {
    try {
        console.log('🚀 Starting publication process...\n');

        // Step 1: Add references to Knowledge Garden
        await addReferencesToKnowledgeGarden();
        console.log('\n✅ All references added to Knowledge Garden\n');

        // Step 2: Publish article to Blog
        await publishArticleToBlog();
        console.log('\n✅ Article published to Blog database\n');

        console.log('🎉 Publication process completed successfully!');
    } catch (error) {
        console.error('❌ Publication process failed:', error);
        process.exit(1);
    }
}

// Run the script
main();
