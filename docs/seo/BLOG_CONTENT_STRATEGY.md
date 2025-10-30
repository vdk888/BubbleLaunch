# Blog Content Strategy for SEO Growth

**Project**: Bubble Invest
**Date**: 2025-10-29
**Status**: 📝 **ACTIVE CONTENT ROADMAP**
**Goal**: Scale from 6 to 30 articles in 12 months for SEO growth

---

## 🎯 Strategic Overview

### Current Situation
- **Published Articles**: 6 articles in Notion "Bubble Blog Articles" database
- **Monthly Traffic**: ~50-100 visits
- **Ranked Keywords**: 5-10 (mostly brand terms)
- **Top 10 Rankings**: 0-1
- **SEO Foundation**: ✅ Complete (technical SEO = 100%)

### Target Situation (12 Months)
- **Published Articles**: 30+ articles
- **Monthly Traffic**: 3,000-5,000 visits
- **Ranked Keywords**: 150-200
- **Top 10 Rankings**: 20-30
- **Domain Authority**: Established fintech education leader

### Content Gap Analysis
**Problem**: Only 6 articles = insufficient keyword coverage and domain authority

**Solution**: Publish 2-3 articles per month following strategic priorities below

---

## 📚 Content Workflow: Notion Integration

### Notion Database Architecture

#### 1. **"Bubble Knowledge Garden" Database** (Source Material)
**Database ID**: `1ffcfc520644805b8bb9c9207fb2cb31`

**Schema**:
- Name (title) - Reference name
- Author (rich_text) - Creator/researcher
- Source Type (select) - Book, Article, Paper, Video, Website
- Category (multi_select) - Thematic categories
- Topics (multi_select) - Specific topics
- Drive URL (url) - Access link
- AI summary (rich_text) - AI-generated summary
- Bubble Blog (multi_select) - Publication status (Published, Draft, etc.)
- Status (select) - Workflow status
- Date (date) - Publication/creation date
- Main Theme (multi_select) - Primary themes

**Usage**: This database serves as the **research library** for all blog articles. Every article should cite 3-8 references from this database.

#### 2. **"Bubble Blog Articles" Database** (Published Content)
**Database ID**: `process.env.NOTION_BLOG_DATABASE_ID`

**Schema**:
- Title FR (title) - French article title
- Title EN (rich_text) - English article title
- Content Summary FR (rich_text) - French summary
- Content Summary EN (rich_text) - English summary
- Content FR (rich_text) - French full content
- Content EN (rich_text) - English full content
- Status (select) - Published, Draft, Scheduled
- Publication Date (date) - When article goes live
- Topic Tags (multi_select) - SEO keywords/categories
- Author (multi_select) - Article authors
- Target Audience (multi_select) - Reader personas
- Related Knowledge Topics (relation) - **Links to Knowledge Garden database**
- Website URL (url) - Canonical URL
- Idée de l'article (rich_text) - Initial article concept

**Usage**: This database stores all **published and draft articles** that appear on the website blog.

---

## 🔄 Content Creation Workflow

### Step-by-Step Process

#### Phase 1: Research & Planning (1-2 hours per article)

1. **Select Article Topic** from priority list below
2. **Query Knowledge Garden** for relevant references:
   - Filter by relevant Categories (e.g., "Investment Strategy", "AI & Finance")
   - Filter by relevant Topics (e.g., "Portfolio Management", "Behavioral Finance")
   - Filter by Status = "Published" in Bubble Blog field
3. **Identify 5-10 Knowledge Garden references** that support article thesis
4. **Review External Sources**:
   - Academic research (Google Scholar, SSRN)
   - Regulatory sources (AMF, CNIL)
   - Competitor articles (Yomoni, Nalo, Moneyvox)
   - Industry reports (Morningstar, Vanguard)
5. **Create Article Entry** in "Bubble Blog Articles" database:
   - Set Status = "Draft"
   - Fill "Idée de l'article" with outline
   - Link 3-8 references via "Related Knowledge Topics" relation field
   - Add "Topic Tags" for SEO (primary keyword + variations)

#### Phase 2: Writing (3-5 hours per article)

1. **Draft in Notion** "Bubble Blog Articles" database:
   - Write in "Content FR" field (French first, 1,500-2,500 words)
   - Follow SEO structure (see Section 4 below)
   - Cite Knowledge Garden references with hyperlinks
2. **Include Data-Driven Elements**:
   - Charts from portfolio simulator
   - Backtests from your system
   - Fee comparison calculators
   - Real-world examples
3. **Add Internal Links**:
   - Link to portfolio simulator (at least once)
   - Link to 2-3 other blog articles
   - Link to waitlist signup (CTA)
4. **Write Summaries**:
   - Fill "Content Summary FR" (150-155 characters for meta description)
   - Optimize for click-through rate (CTR)

#### Phase 3: Review & Optimization (30-60 minutes per article)

1. **SEO Checklist**:
   - [ ] Target keyword in Title FR
   - [ ] Target keyword in first 100 words
   - [ ] 2-3 H2 headings with keyword variations
   - [ ] 1,500-2,500 word count
   - [ ] 3-8 Knowledge Garden references cited
   - [ ] 2-3 internal links to blog/simulator/waitlist
   - [ ] 2-3 external authoritative links
   - [ ] Meta description 150-155 characters
   - [ ] Topic Tags include primary + secondary keywords
2. **Quality Checklist**:
   - [ ] Clear value proposition in first paragraph
   - [ ] Data/charts support key claims
   - [ ] Actionable takeaways
   - [ ] CTA to simulator or waitlist
   - [ ] Author credentials mentioned
   - [ ] No grammar/spelling errors

#### Phase 4: Translation (1-2 hours per article - Optional)

**Priority**: Only translate top-performing articles after 3 months

1. **Check Analytics** in Google Search Console
2. **Select Top 5 Articles** by traffic
3. **Translate to English**:
   - Fill "Title EN" field
   - Fill "Content EN" field (adapt cultural references)
   - Fill "Content Summary EN" field
4. **Update Bilingual Tags**:
   - Ensure hreflang tags in blog-post.js
   - Verify sitemap includes EN versions

#### Phase 5: Publishing (15 minutes per article)

1. **Generate Featured Image**:
   - Use existing OpenAI image generation system
   - Prompt based on article title + Topic Tags
   - Image cached automatically
2. **Set Publication Date**:
   - Update "Publication Date" field
   - Set Status = "Published"
3. **Dynamic Deployment**:
   - Article appears automatically on `/blog`
   - Dynamic meta tags populated via blog-post.js
   - Sitemap.xml updates automatically
   - Blog structured data (BlogPosting schema) applied
4. **Submit to Google**:
   - Wait 24-48 hours for automatic crawl
   - Or manually request indexing in Google Search Console

---

## 📝 20 High-Priority Articles

### Priority 1: Product Differentiation & Trust (Write First)
**Timeline**: Month 1-2 | **Impact**: High buyer intent traffic

#### Article 1: "Frais Fixes vs Frais en Pourcentage : Le Vrai Calcul sur 20 Ans"
- **Target Keywords**: `frais robo advisor comparaison`, `frais fixes investissement`, `coût robo advisor france`
- **Word Count**: 2,000-2,500
- **Knowledge Garden References**:
  - Category: "Investment Strategy", "Financial Education"
  - Topics: "Portfolio Management", "Behavioral Finance"
  - Filter for references about fee structures, compound costs, investor returns
- **External Sources**:
  - AMF statistics on French robo-advisor fees
  - Vanguard research on cost impact over time
  - Morningstar fee analyzer methodology
- **Content Structure**:
  - H2: "Le Coût Caché des Frais en Pourcentage"
    - Show compound effect: €100k @ 1.6% fees = €51,200 lost over 20 years
  - H2: "Comparaison Détaillée : 10€/mois vs 1.6%"
    - Interactive calculator showing breakeven point
    - Table: €10k, €50k, €100k, €500k portfolios over 1/5/10/20 years
  - H2: "Pourquoi Les Robo-Advisors Utilisent les Frais en Pourcentage"
    - Industry incentive structure
    - Psychological pricing (seems cheaper at small amounts)
  - H2: "Notre Modèle à Frais Fixes : Alignement d'Intérêts"
    - Flat €10/month benefits all portfolio sizes
    - No conflict of interest
- **CTAs**:
  - Interactive calculator in article
  - "Essayez Notre Simulateur" button → /portfolio-simulator
  - Waitlist signup at bottom
- **Expected Traffic**: 100-200 visits/month by Month 3
- **Notion Fields**:
  - Topic Tags: `frais fixes`, `robo advisor`, `comparaison frais`, `investissement France`
  - Target Audience: `Débutants`, `Investisseurs Actifs`
  - Related Knowledge Topics: Link 5-7 references about fee structures, behavioral finance

---

#### Article 2: "Yomoni vs Nalo vs Bubble : Analyse Comparative Complète 2025"
- **Target Keywords**: `alternative yomoni`, `alternative nalo`, `comparatif robo advisor france`, `meilleur robo advisor 2025`
- **Word Count**: 2,500-3,000 (comprehensive comparison)
- **Knowledge Garden References**:
  - Category: "Market Analysis", "Investment Strategy", "FinTech"
  - Topics: "Portfolio Management", "AI & Finance"
  - Filter for competitive analysis, robo-advisor research, fee structures
- **External Sources**:
  - Yomoni website (fees, performance, methodology)
  - Nalo website (fees, performance, methodology)
  - AMF registered entity information
  - Moneyvox/Les Echos robo-advisor comparisons
- **Content Structure**:
  - H2: "Vue d'Ensemble : Trois Approches Différentes"
    - Quick comparison table (fees, minimum investment, automation level, transparency)
  - H2: "Yomoni : Le Leader Établi"
    - Strengths: track record, AUM, brand recognition
    - Weaknesses: 1.6% fees, limited transparency, tax optimization focus
    - Best for: tax-sensitive French investors with €100k+
  - H2: "Nalo : L'Alternative Pédagogique"
    - Strengths: educational content, questionnaire, life goals approach
    - Weaknesses: 1.65% fees, manual processes, no AI optimization
    - Best for: beginners wanting hand-holding
  - H2: "Bubble : L'IA à Frais Fixes"
    - Strengths: €10/month fixed fees, AI-powered rebalancing, full transparency
    - Weaknesses: new entrant (not yet launched), shorter track record
    - Best for: cost-conscious investors, tech-savvy users, small-medium portfolios
  - H2: "Tableau Comparatif Détaillé"
    - Feature matrix: 15 criteria compared
  - H2: "Calcul sur 20 Ans : Impact Réel des Frais"
    - €50k portfolio: Bubble saves €16,000 vs Yomoni/Nalo
    - Interactive calculator embedded
  - H2: "Notre Recommandation"
    - Decision tree based on portfolio size, tax situation, tech comfort
- **CTAs**:
  - "Comparez les Stratégies" → /portfolio-simulator
  - "Rejoindre la Liste d'Attente" → /#waitlist
- **Expected Traffic**: 300-500 visits/month (high buyer intent)
- **Notion Fields**:
  - Topic Tags: `yomoni`, `nalo`, `comparatif robo advisor`, `alternative robo advisor`, `meilleur robo advisor`
  - Target Audience: `Investisseurs Actifs`, `Comparateurs`
  - Related Knowledge Topics: 6-8 references on competitive analysis, fee structures, robo-advisor research

---

#### Article 3: "Comment Choisir un Robo-Advisor en 2025 : Guide Complet"
- **Target Keywords**: `choisir robo advisor france`, `critères robo advisor`, `guide robo advisor`
- **Word Count**: 2,000-2,500
- **Knowledge Garden References**:
  - Category: "Financial Education", "Investment Strategy"
  - Topics: "Portfolio Management", "Behavioral Finance"
  - Filter for investor education, decision frameworks
- **External Sources**:
  - AMF investor guides
  - Consumer Reports methodology
  - Academic research on robo-advisor selection
- **Content Structure**:
  - H2: "Les 10 Critères Essentiels"
    - Checklist with explanations:
      1. Frais totaux (TFE - Total Fee Equivalent)
      2. Transparence de l'algorithme
      3. Régulation AMF/ACPR
      4. Enveloppes fiscales (PEA, Assurance-Vie, CTO)
      5. Niveau d'automatisation
      6. Service client
      7. Montant minimum
      8. Performance historique (avec contexte)
      9. Méthodologie d'allocation
      10. Sécurité et assurance
  - H2: "Questions à Poser Avant de S'Engager"
    - 15 questions with "red flag" indicators
  - H2: "Profils d'Investisseurs et Recommandations"
    - Débutant < €10k
    - Intermédiaire €10k-€100k
    - Avancé > €100k
  - H2: "Les Pièges à Éviter"
    - Performance past ≠ future
    - Hidden fees (transaction costs, spread)
    - Over-personalization (unnecessary complexity)
- **CTAs**:
  - "Analysez Notre Approche" → /#approach
  - "Testez Notre Simulateur" → /portfolio-simulator
- **Expected Traffic**: 150-250 visits/month
- **Notion Fields**:
  - Topic Tags: `guide robo advisor`, `choisir investissement`, `critères selection`, `éducation financière`
  - Target Audience: `Débutants`, `Comparateurs`

---

#### Article 4: "Investissement IA : Comment Ça Marche Vraiment ?"
- **Target Keywords**: `investissement intelligence artificielle`, `IA gestion portefeuille`, `algorithme robo advisor`
- **Word Count**: 2,000-2,500
- **Knowledge Garden References**:
  - Category: "AI & Finance", "FinTech"
  - Topics: "Portfolio Management", "Machine Learning", "Quantitative Finance"
  - Priority: References explaining AI/ML in finance
- **External Sources**:
  - Academic papers on ML in portfolio management
  - Explanations of rebalancing algorithms
  - Risk parity methodology papers
- **Content Structure**:
  - H2: "Les Trois Types d'IA en Investissement"
    - Rules-based automation (most "robo-advisors")
    - Machine learning optimization (Bubble's approach)
    - AI forecasting (overpromised, underdelivered)
  - H2: "Comment Bubble Utilise l'IA"
    - Diagram of decision flow
    - Real-time volatility monitoring
    - Correlation-adjusted rebalancing
    - Risk parity optimization with EWMA
  - H2: "Backtests : 20 Ans de Données"
    - Show portfolio simulator results
    - Equal Weight vs Simple Risk Parity vs Optimized Risk Parity
    - Explain why Optimized performs better
  - H2: "IA vs Conseiller Humain vs Robo Simple"
    - Comparison table
    - When AI adds value (rebalancing frequency, emotion removal)
    - When humans add value (complex tax, life planning)
  - H2: "Les Limites de Notre IA"
    - Transparency section (anti-"black box")
    - What the AI cannot do (predict markets, timing)
    - Our bias: long-term, diversified, evidence-based
- **CTAs**:
  - "Voir l'IA en Action" → /portfolio-simulator
  - "Rejoindre la Liste d'Attente" → /#waitlist
- **Expected Traffic**: 200-300 visits/month
- **Notion Fields**:
  - Topic Tags: `intelligence artificielle`, `IA investissement`, `algorithme`, `portfolio management`, `automatisation`
  - Target Audience: `Tech-Savvy`, `Investisseurs Actifs`

---

### Priority 2: SEO Quick Wins (Low Competition, High Value)
**Timeline**: Month 3-4 | **Impact**: Long-tail keyword coverage

#### Article 5: "Risk Parity Expliqué Simplement : La Stratégie des Fonds Institutionnels"
- **Target Keywords**: `risk parity france`, `stratégie risk parity`, `allocation risk parity`, `portfolio parité risque`
- **Word Count**: 1,800-2,200
- **Knowledge Garden References**:
  - Category: "Investment Strategy", "Quantitative Finance"
  - Topics: "Portfolio Management", "Risk Management"
  - Priority: Academic papers on risk parity (Bridgewater, AQR research)
- **External Sources**:
  - Ray Dalio's All Weather Portfolio explanation
  - AQR Capital research papers
  - Academic studies on risk-based allocation
- **Content Structure**:
  - H2: "Qu'est-ce que le Risk Parity ?"
    - Traditional 60/40 portfolio problem
    - Risk concentration in stocks
    - Equal risk contribution concept
  - H2: "La Méthode de Calcul (Simplifié)"
    - Inverse volatility weighting
    - Rolling window methodology
    - Visual examples with 3 assets (SPY, IEF, GLD)
  - H2: "Risk Parity vs Allocation Égale"
    - Backtest comparison using portfolio simulator
    - 20 years of data (2005-2025)
    - Performance metrics explained
  - H2: "Notre Amélioration : Risk Parity Optimisé"
    - EWMA volatility (λ=0.94)
    - Correlation adjustment
    - Why it performs better (30% less drawdown)
  - H2: "Pour Qui Cette Stratégie ?"
    - Conservative investors seeking Sharpe ratio improvement
    - Retirees needing income stability
    - Institutional-quality approach for retail
- **CTAs**:
  - "Testez Risk Parity sur Votre Simulateur" → /portfolio-simulator
  - Embedded interactive chart showing 3 strategies
- **Expected Traffic**: 80-120 visits/month (highly qualified audience)
- **Notion Fields**:
  - Topic Tags: `risk parity`, `stratégie quantitative`, `allocation actifs`, `volatilité`
  - Target Audience: `Investisseurs Actifs`, `Professionnels Finance`

---

#### Article 6: "Simulateur de Portefeuille Gratuit : 3 Stratégies Quantitatives Comparées"
- **Target Keywords**: `simulateur portefeuille gratuit`, `backtest portefeuille`, `test stratégie investissement`
- **Word Count**: 1,500-2,000
- **Knowledge Garden References**:
  - Category: "Investment Strategy", "Financial Education"
  - Topics: "Portfolio Management", "Backtesting"
- **Content Structure**:
  - H2: "Pourquoi Utiliser un Simulateur de Portefeuille"
  - H2: "Comment Utiliser Notre Simulateur"
    - Step-by-step tutorial with screenshots
  - H2: "Les 3 Stratégies Expliquées"
    - Equal Weight, Simple Risk Parity, Optimized Risk Parity
  - H2: "Interpréter les Résultats"
    - 6 metrics explained (Total Return, CAGR, Volatility, Sharpe, Max Drawdown, Calmar)
    - What "good" looks like
  - H2: "Limitations et Avertissements"
    - Past performance disclaimer
    - No transaction costs included
    - Educational tool, not financial advice
- **CTAs**:
  - Embedded simulator directly in article
  - "Rejoindre Bubble" → /#waitlist
- **Expected Traffic**: 100-150 visits/month
- **Notion Fields**:
  - Topic Tags: `simulateur`, `backtest`, `stratégies quantitatives`, `allocation portefeuille`

---

#### Article 7: "Robo-Advisor Réglementé AMF : Ce Que Vous Devez Savoir"
- **Target Keywords**: `robo advisor amf`, `réglementation robo advisor france`, `agrément amf investissement`
- **Word Count**: 1,800-2,200
- **Knowledge Garden References**:
  - Category: "Financial Education", "Legal & Compliance"
  - Topics: "Regulation", "Investor Protection"
- **External Sources**:
  - AMF official guidelines on robo-advisors
  - ACPR regulations for financial services
  - MiFID II requirements
- **Content Structure**:
  - H2: "Les Trois Régimes Réglementaires en France"
    - PSAN (crypto) vs CIF (investment firm) vs Conseiller en Investissements Financiers
  - H2: "Que Doit Vérifier l'AMF ?"
    - Capital requirements
    - Risk management processes
    - Client fund segregation
    - Disclosure requirements
  - H2: "Comment Vérifier si Votre Robo-Advisor est Réglementé"
    - AMF/ACPR registry lookup
    - Red flags (offshore entities, no ORIAS number)
  - H2: "Protections pour les Investisseurs"
    - Fonds de Garantie des Dépôts (€70k protection)
    - ACPR supervision
    - Complaint mechanisms
  - H2: "Le Parcours de Bubble vers la Régulation"
    - Current status (pre-authorization)
    - Timeline for CIF license
    - Transparency commitment
- **CTAs**:
  - "En Savoir Plus sur Notre Approche" → /#approach
- **Expected Traffic**: 50-80 visits/month (high trust signal)
- **Notion Fields**:
  - Topic Tags: `réglementation`, `AMF`, `sécurité`, `protection investisseurs`
  - Target Audience: `Investisseurs Prudents`, `Séniors`

---

#### Article 8: "Investir avec 100€, 500€ ou 5000€ : Quel Impact des Frais ?"
- **Target Keywords**: `investir 100 euros`, `petit investissement france`, `investir petite somme`
- **Word Count**: 1,500-2,000
- **Knowledge Garden References**:
  - Category: "Financial Education", "Investment Strategy"
  - Topics: "Behavioral Finance", "Portfolio Management"
- **Content Structure**:
  - H2: "Le Problème des Frais en Pourcentage pour les Petits Investisseurs"
    - €100 portfolio @ 1.6% fees = losing 80% of gains over 30 years
  - H2: "Calcul Réel : Trois Scénarios"
    - €100/month DCA: Bubble vs traditional robo-advisor
    - €500 lump sum: fee impact over 5/10/20 years
    - €5000 portfolio: breakeven analysis
  - H2: "Pourquoi Les Robo-Advisors Ont des Montants Minimum"
    - €1000-€5000 minimum = excluding beginners
    - Percentage fees don't scale down
  - H2: "Notre Approche : Pas de Montant Minimum"
    - €10/month works for any portfolio size
    - Educational value for beginners
  - H2: "Comment Commencer avec Peu d'Argent"
    - DCA strategy
    - Focus on learning, not returns
    - Compound habit formation
- **CTAs**:
  - Calculator showing fee comparison at different amounts
  - "Rejoindre la Liste d'Attente" → /#waitlist
- **Expected Traffic**: 150-250 visits/month (large audience segment)
- **Notion Fields**:
  - Topic Tags: `petit investissement`, `investir 100 euros`, `débutant`, `frais`, `DCA`
  - Target Audience: `Débutants`, `Jeunes Investisseurs`

---

### Priority 3: Educational Content (Authority Building)
**Timeline**: Month 5-8 | **Impact**: Backlinks, domain authority

#### Article 9: "Finance Comportementale : Pourquoi 90% des Investisseurs Perdent de l'Argent"
- **Target Keywords**: `finance comportementale`, `biais cognitifs investissement`, `erreurs investissement`, `psychologie investissement`
- **Word Count**: 2,200-2,800
- **Knowledge Garden References**:
  - Category: "Behavioral Finance", "Financial Education"
  - Topics: "Investor Psychology", "Behavioral Economics"
  - Priority: Kahneman, Thaler, academic papers on biases
- **External Sources**:
  - Daniel Kahneman's research
  - Richard Thaler's nudge theory
  - DALBAR Quantitative Analysis of Investor Behavior report
- **Content Structure**:
  - H2: "Le Behavior Gap : 3-4% de Performance Perdue"
    - DALBAR study showing investor returns < market returns
    - Why: buying high, selling low
  - H2: "Les 10 Biais Cognitifs qui Coûtent Cher"
    - Loss aversion (2x stronger than gain motivation)
    - Recency bias (last 6 months predict future?)
    - Confirmation bias (seeking validating information)
    - Overconfidence bias (thinking you can time market)
    - Herd behavior (FOMO, panic selling)
    - Anchoring (stuck on purchase price)
    - Mental accounting (treating money differently)
    - Disposition effect (selling winners, holding losers)
    - Hindsight bias ("I knew it would happen")
    - Status quo bias (inaction default)
  - H2: "Exemples Réels et Coût Estimé"
    - Case study: 2020 COVID crash panic sellers
    - Case study: 2021 crypto FOMO buyers
    - Quantified cost of each bias
  - H2: "Comment l'Automatisation Résout Ces Biais"
    - Remove emotional decision points
    - Systematic rebalancing (sell winners, buy losers)
    - No market timing
    - Discipline through rules
  - H2: "Les Limites de l'Automatisation"
    - When human judgment adds value
    - Life events requiring changes
    - Behavioral coaching value
- **CTAs**:
  - "Découvrez Notre Agent d'Investissement Automatisé" → /#vision
  - Quiz: "Quels Biais Vous Affectent ?" (interactive)
- **Expected Traffic**: 200-300 visits/month (viral potential on LinkedIn)
- **Notion Fields**:
  - Topic Tags: `finance comportementale`, `biais cognitifs`, `psychologie`, `automatisation`, `erreurs investissement`
  - Target Audience: `Tous`, `Éducation`

---

#### Article 10: "ETF vs Fonds Actifs : Données sur 20 Ans"
- **Target Keywords**: `etf vs fonds actifs`, `performance etf france`, `gestion passive vs active`
- **Word Count**: 2,000-2,500
- **Knowledge Garden References**:
  - Category: "Investment Strategy", "Market Analysis"
  - Topics: "ETF", "Active Management", "Performance Analysis"
  - Priority: SPIVA reports, Vanguard research, Morningstar studies
- **External Sources**:
  - SPIVA Europe Scorecard (S&P Dow Jones Indices)
  - Morningstar Active/Passive Barometer
  - AMF statistics on French fund performance
- **Content Structure**:
  - H2: "L'Hypothèse d'Efficience des Marchés"
  - H2: "SPIVA Report : Les Chiffres sur 20 Ans"
    - 85-90% of active funds underperform their benchmark
    - Survivorship bias (failed funds disappear from stats)
  - H2: "Pourquoi les Fonds Actifs Sous-Performent"
    - Fees (2-3% vs 0.1-0.3% for ETF)
    - Transaction costs
    - Tax inefficiency
    - Manager selection difficulty
  - H2: "Les Rares Cas où l'Actif Peut Gagner"
    - Small-cap markets
    - Emerging markets
    - Niche sectors
  - H2: "Notre Position : ETF Core + Optimisation IA"
    - Low-cost ETF building blocks
    - AI optimizes allocation, not stock picking
    - Tax optimization layer
- **CTAs**:
  - "Voir Notre Allocation d'ETF" → /portfolio-simulator
- **Expected Traffic**: 120-180 visits/month
- **Notion Fields**:
  - Topic Tags: `ETF`, `fonds actifs`, `gestion passive`, `performance`, `comparaison`
  - Target Audience: `Investisseurs Actifs`, `Comparateurs`

---

#### Article 11: "Dollar Cost Averaging (DCA) : Mythe ou Réalité ?"
- **Target Keywords**: `investissement programmé`, `dca investissement`, `étaler investissement`, `lump sum vs dca`
- **Word Count**: 1,800-2,200
- **Knowledge Garden References**:
  - Category: "Investment Strategy", "Behavioral Finance"
  - Topics: "Portfolio Management", "Risk Management"
  - Priority: Vanguard DCA study, academic research
- **External Sources**:
  - Vanguard: "Dollar-cost averaging just means taking risk later"
  - Academic studies comparing lump sum vs DCA
  - Real-world behavioral considerations
- **Content Structure**:
  - H2: "Qu'est-ce que le DCA (Investissement Programmé) ?"
  - H2: "L'Étude Vanguard : Lump Sum Gagne 2/3 du Temps"
    - Backtest 1926-2020: lump sum beats DCA in 68% of periods
    - Average outperformance: 2.3%/year
    - Why: market goes up more than it goes down
  - H2: "Alors Pourquoi Faire du DCA ?"
    - Behavioral reality: fear of bad timing
    - Regret minimization (psychological insurance)
    - Forced discipline (paycheck-based investing)
  - H2: "Notre Recommandation Nuancée"
    - Large windfall (inheritance, bonus): lump sum with guardrails
    - Regular income: DCA automatically
    - Volatile markets: DCA can reduce regret
  - H2: "Backtest : DCA vs Lump Sum en 2020 (COVID Crash)"
    - Visual comparison showing DCA benefit during crash
- **CTAs**:
  - "Simulez Votre Stratégie" → /portfolio-simulator
- **Expected Traffic**: 100-150 visits/month
- **Notion Fields**:
  - Topic Tags: `DCA`, `investissement programmé`, `lump sum`, `timing marché`, `stratégie`

---

#### Article 12: "Diversification de Portefeuille : Le Guide Scientifique"
- **Target Keywords**: `diversification portefeuille`, `allocation actifs`, `corrélation actifs`, `optimisation portefeuille`
- **Word Count**: 2,200-2,800
- **Knowledge Garden References**:
  - Category: "Investment Strategy", "Quantitative Finance"
  - Topics: "Portfolio Management", "Modern Portfolio Theory", "Diversification"
  - Priority: Markowitz, efficient frontier research
- **External Sources**:
  - Harry Markowitz Modern Portfolio Theory
  - Yale Endowment allocation model (David Swensen)
  - Academic research on correlation breakdown during crises
- **Content Structure**:
  - H2: "La Théorie Moderne du Portefeuille (Markowitz)"
    - Efficient frontier concept
    - Risk-return tradeoff
  - H2: "Au-Delà des Actions/Obligations : Vraie Diversification"
    - Asset class correlation matrix
    - Gold, commodities, real estate (REITs)
  - H2: "Le Problème de la Corrélation en Crise"
    - 2008, 2020: everything crashed together
    - Flight to quality (Treasuries)
  - H2: "Geographic Diversification : France vs Monde"
    - Home bias problem
    - Emerging markets correlation
  - H2: "Comment Bubble Optimise la Diversification"
    - 3-asset portfolio (stocks, bonds, gold)
    - Dynamic rebalancing based on correlations
    - Risk parity approach
  - H2: "Combien d'ETF Faut-il ?"
    - Diminishing returns after 5-7 asset classes
    - Avoid over-diversification (diworsification)
- **CTAs**:
  - "Voir Notre Approche de Diversification" → /portfolio-simulator
- **Expected Traffic**: 150-200 visits/month
- **Notion Fields**:
  - Topic Tags: `diversification`, `allocation actifs`, `corrélation`, `Markowitz`, `portfolio theory`
  - Target Audience: `Investisseurs Actifs`, `Professionnels Finance`

---

### Priority 4: Trending & Timely Topics
**Timeline**: Month 6-12 (Ongoing) | **Impact**: Seasonal traffic spikes

#### Article 13: "Investir en 2025 : Taux Élevés, Inflation, et Stratégie IA"
- **Target Keywords**: `investir 2025`, `stratégie investissement 2025`, `investir inflation`, `taux intérêt investissement`
- **Word Count**: 2,000-2,500
- **Update Schedule**: Annually (Dec-Jan)
- **Knowledge Garden References**:
  - Category: "Market Analysis", "Economics", "Investment Strategy"
  - Topics: "Inflation", "Interest Rates", "Market Outlook"
- **Content Structure**:
  - H2: "Le Contexte Macro-Économique de 2025"
    - ECB interest rates status
    - Inflation trends (France, Eurozone, US)
    - Market valuations (CAPE ratio, bond yields)
  - H2: "Les Trois Scénarios pour 2025"
    - Soft landing (60% probability)
    - Recession (25% probability)
    - Stagflation (15% probability)
  - H2: "Allocation Optimale par Scénario"
    - Asset class performance in each scenario
    - Why diversification matters more than prediction
  - H2: "Notre Stratégie IA Face à l'Incertitude"
    - Adaptive rebalancing
    - Risk monitoring
    - No macro bets
  - H2: "Actions Concrètes pour 2025"
    - Checklist: rebalance, check fees, update risk tolerance
- **CTAs**:
  - "Testez Votre Portefeuille pour 2025" → /portfolio-simulator
- **Expected Traffic**: 300-400 visits/month (Jan-Feb spike)
- **Notion Fields**:
  - Topic Tags: `2025`, `prévisions`, `stratégie`, `taux intérêt`, `inflation`
  - Target Audience: `Tous`

---

#### Article 14: "Faut-il Investir Pendant une Récession ? Données sur 100 Ans"
- **Target Keywords**: `investir récession`, `investir crise`, `opportunité crise financière`, `marché baissier investissement`
- **Word Count**: 2,000-2,500
- **Update Trigger**: Publish during market volatility (VIX > 30)
- **Knowledge Garden References**:
  - Category: "Market Analysis", "Investment Strategy", "Behavioral Finance"
  - Topics: "Market Cycles", "Crisis Investing"
- **Content Structure**:
  - H2: "Les 10 Dernières Récessions : Que S'est-il Passé ?"
    - Timeline: 1929, 1973, 1987, 2000, 2008, 2020
    - Market drawdowns and recovery times
  - H2: "Le Meilleur Jour vs Le Pire Jour"
    - Missing 10 best days reduces returns by 50%
    - Best days often occur during recessions
    - Timing is impossible
  - H2: "Les Trois Stratégies en Récession"
    - Panic selling (worst outcome)
    - Stay invested (good outcome)
    - Buy the dip (best outcome, but requires courage)
  - H2: "Backtest : Investir €10k au Pire Moment"
    - Invest at peak before each crash
    - Show 10-year outcomes
    - Still positive returns
  - H2: "Comment Notre IA Gère les Récessions"
    - Rebalancing = automatic buy-low-sell-high
    - No panic selling
    - Risk parity reduces drawdowns
- **CTAs**:
  - "Simulez Votre Résilience en Crise" → /portfolio-simulator
- **Expected Traffic**: 100-200 visits/month (spikes during market drops)
- **Notion Fields**:
  - Topic Tags: `récession`, `crise`, `volatilité`, `opportunité`, `timing marché`

---

#### Article 15: "L'IA va-t-elle Remplacer les Conseillers Financiers ?"
- **Target Keywords**: `IA conseiller financier`, `avenir conseil financier`, `robo advisor vs conseiller`, `automatisation finance`
- **Word Count**: 1,800-2,200
- **Knowledge Garden References**:
  - Category: "AI & Finance", "FinTech", "Future of Work"
  - Topics: "Automation", "Financial Advisory", "Human vs AI"
- **Content Structure**:
  - H2: "Ce Que l'IA Fait Mieux que les Humains"
    - Data processing at scale
    - Emotion-free decisions
    - 24/7 monitoring
    - Cost efficiency
  - H2: "Ce Que les Humains Font Mieux que l'IA"
    - Complex life planning (divorce, inheritance)
    - Behavioral coaching during panic
    - Tax optimization for edge cases
    - Relationship and empathy
  - H2: "Le Modèle Hybride : Le Futur"
    - AI handles routine tasks
    - Humans handle exceptions
    - Example: Bubble (AI) + access to human advisors for complex questions
  - H2: "Les Trois Segments de Conseil"
    - Mass market (< €100k): Full AI (Bubble, Betterment)
    - Affluent (€100k-€1M): Hybrid (Schwab Intelligent Portfolios)
    - High net worth (> €1M): Human-centric (private banks)
  - H2: "Notre Vision : IA Transparente + Expertise Accessible"
- **CTAs**:
  - "Découvrez Notre Agent d'Investissement IA" → /#vision
- **Expected Traffic**: 80-120 visits/month
- **Notion Fields**:
  - Topic Tags: `IA`, `conseiller financier`, `automatisation`, `futur`, `robo advisor`

---

#### Article 16: "Bitcoin et Crypto : Faut-il les Intégrer dans un Portefeuille Traditionnel ?"
- **Target Keywords**: `bitcoin portefeuille`, `crypto allocation`, `diversification crypto`, `investir bitcoin 2025`
- **Word Count**: 2,200-2,800
- **Knowledge Garden References**:
  - Category: "Investment Strategy", "Market Analysis", "Alternative Assets"
  - Topics: "Cryptocurrency", "Portfolio Management", "Risk Management"
- **External Sources**:
  - Academic research on crypto correlation
  - Fidelity/Vanguard crypto position papers
  - ARK Invest Bitcoin research
- **Content Structure**:
  - H2: "L'Argument pour la Crypto (5-10% Allocation)"
    - Uncorrelated asset (historically)
    - Inflation hedge thesis
    - Upside optionality (asymmetric returns)
  - H2: "L'Argument contre la Crypto"
    - Extreme volatility (80% drawdowns)
    - No intrinsic value (no cash flows)
    - Regulatory risk
    - Correlation breakdown (2022: crypto crashed with stocks)
  - H2: "Données : Crypto dans un Portefeuille 60/40"
    - Backtest 2015-2025 with 5% Bitcoin allocation
    - Sharpe ratio improvement?
    - Max drawdown increase
  - H2: "Pourquoi Bubble Ne Propose Pas (Encore) la Crypto"
    - Regulatory clarity needed (MiCA in EU)
    - Custody complexity
    - Our focus: evidence-based, not speculative
  - H2: "Notre Position Nuancée"
    - Crypto as 0-5% "satellite" allocation (outside main portfolio)
    - Self-custody for small amounts
    - Wait for regulated crypto ETFs in France
- **CTAs**:
  - "Comparez des Stratégies Traditionnelles" → /portfolio-simulator
  - "Suivez Notre Position sur la Crypto" → /blog (subscribe)
- **Expected Traffic**: 200-350 visits/month (high search volume topic)
- **Notion Fields**:
  - Topic Tags: `crypto`, `bitcoin`, `allocation`, `diversification`, `risque`
  - Target Audience: `Tech-Savvy`, `Jeunes Investisseurs`

---

### Priority 5: Advanced Topics (Niche Authority)
**Timeline**: Month 9-12 | **Impact**: Backlinks from finance professionals

#### Article 17: "Optimisation Fiscale PEA vs Assurance-Vie vs CTO pour ETF"
- **Target Keywords**: `fiscalité etf france`, `pea vs assurance vie`, `optimisation fiscale investissement`, `cto etf`
- **Word Count**: 2,500-3,000
- **Knowledge Garden References**:
  - Category: "Financial Education", "Legal & Compliance", "Investment Strategy"
  - Topics: "Taxation", "PEA", "Assurance-Vie"
  - Priority: French tax code references, AMF guides
- **External Sources**:
  - Code général des impôts (CGI)
  - AMF investor guides on envelopes
  - Notary/tax advisor best practices
- **Content Structure**:
  - H2: "Les Trois Enveloppes Fiscales en France"
    - PEA (Plan d'Épargne en Actions)
    - Assurance-Vie
    - CTO (Compte-Titres Ordinaire)
  - H2: "Comparaison Fiscale Détaillée"
    - Table: plafond, eligibility, taxation, withdrawal rules
  - H2: "Optimisation par Profil"
    - Young investor (< 30 years): PEA priority
    - Mid-career (30-50): PEA + Assurance-Vie
    - Pre-retiree (50+): Assurance-Vie priority
    - High net worth (> €500k): All three
  - H2: "ETF Éligibles au PEA"
    - Only EU-domiciled ETFs
    - List of compatible ETFs (Amundi, Lyxor)
    - Performance comparison vs US ETFs
  - H2: "Les Pièges Fiscaux à Éviter"
    - PEA withdrawal before 5 years (loss of advantage)
    - Assurance-Vie < 8 years taxation
    - CTO: PFU 30% flat tax (sometimes better than progressive)
  - H2: "Notre Approche chez Bubble"
    - Support for all three envelopes
    - Automatic tax-loss harvesting (future)
    - Withdrawal optimization tools (future)
- **CTAs**:
  - "Rejoindre la Liste d'Attente" → /#waitlist
- **Expected Traffic**: 100-150 visits/month (high-value audience)
- **Notion Fields**:
  - Topic Tags: `fiscalité`, `PEA`, `assurance-vie`, `CTO`, `optimisation fiscale`, `ETF`
  - Target Audience: `Investisseurs Actifs`, `Professionnels Finance`

---

#### Article 18: "Rebalancing de Portefeuille : Fréquence Optimale et Méthodologie"
- **Target Keywords**: `rebalancing portefeuille`, `rééquilibrage allocation`, `fréquence rebalancing`
- **Word Count**: 1,800-2,200
- **Knowledge Garden References**:
  - Category: "Investment Strategy", "Portfolio Management"
  - Topics: "Rebalancing", "Risk Management"
  - Priority: Vanguard research on rebalancing frequency
- **Content Structure**:
  - H2: "Pourquoi Rebalancer ?"
    - Drift from target allocation
    - Risk creep (overweight in winners = overweight in volatile assets)
    - Forced discipline (sell high, buy low)
  - H2: "Les Quatre Méthodes de Rebalancing"
    - Calendar-based (monthly, quarterly, annually)
    - Threshold-based (5%, 10%, 20% drift)
    - Hybrid (quarterly + 10% threshold)
    - Volatility-based (AI approach)
  - H2: "Étude Vanguard : Quelle Fréquence Optimale ?"
    - Annual rebalancing wins in most scenarios
    - Diminishing returns beyond quarterly
    - Transaction costs matter
  - H2: "Notre Approche IA : Rebalancing Adaptatif"
    - Volatility monitoring (EWMA)
    - Correlation changes trigger rebalancing
    - No unnecessary transactions
  - H2: "Backtest : Annual vs Quarterly vs IA"
    - Show 20-year results
    - Transaction cost assumptions
  - H2: "Rebalancing et Fiscalité"
    - PEA: no tax on internal rebalancing
    - CTO: capital gains tax consideration
- **CTAs**:
  - "Voir le Rebalancing en Action" → /portfolio-simulator
- **Expected Traffic**: 60-100 visits/month
- **Notion Fields**:
  - Topic Tags: `rebalancing`, `rééquilibrage`, `portfolio management`, `optimisation`
  - Target Audience: `Investisseurs Actifs`, `Professionnels Finance`

---

#### Article 19: "Factor Investing : Momentum, Value, Quality Expliqués"
- **Target Keywords**: `factor investing`, `smart beta france`, `facteurs quantitatifs`, `investissement factoriel`
- **Word Count**: 2,200-2,800
- **Knowledge Garden References**:
  - Category: "Investment Strategy", "Quantitative Finance"
  - Topics: "Factor Investing", "Smart Beta", "Quantitative Analysis"
  - Priority: Fama-French research, AQR papers
- **External Sources**:
  - Fama-French five-factor model
  - AQR Capital research
  - Dimensional Fund Advisors methodology
- **Content Structure**:
  - H2: "Qu'est-ce qu'un Facteur ?"
    - Beyond market beta
    - Systematic sources of return
  - H2: "Les Six Facteurs Principaux"
    - Value (cheap stocks outperform)
    - Size (small-cap premium)
    - Momentum (winners keep winning)
    - Quality (profitable, stable companies)
    - Low volatility (defensive stocks win)
    - Dividend (yield premium)
  - H2: "L'Évidence Académique"
    - Fama-French research (1993-2024)
    - Long-term performance data
  - H2: "Smart Beta ETFs : Promesse vs Réalité"
    - High fees erode factor premium
    - Crowding effect
    - Factor timing difficulty
  - H2: "Notre Position : Market-Cap-Weighted"
    - Factor timing = market timing
    - Fees matter more than factor tilts
    - Risk parity captures some factor exposure naturally
  - H2: "Quand Envisager le Factor Investing"
    - Large portfolios (> €500k)
    - Long horizons (20+ years)
    - Acceptance of tracking error
- **CTAs**:
  - "Comparez Market-Cap vs Risk Parity" → /portfolio-simulator
- **Expected Traffic**: 80-120 visits/month (institutional audience)
- **Notion Fields**:
  - Topic Tags: `factor investing`, `smart beta`, `fama-french`, `quantitatif`, `academic research`
  - Target Audience: `Professionnels Finance`, `Investisseurs Avancés`

---

#### Article 20: "Build in Public : Comment Nous Construisons Bubble (Série Mensuelle)"
- **Target Keywords**: `build in public fintech`, `startup investissement`, `transparence startup`, `créer robo advisor`
- **Word Count**: 1,200-1,500 (monthly updates)
- **Format**: Monthly series (Month 1, Month 2, Month 3...)
- **Knowledge Garden References**:
  - Category: "FinTech", "Entrepreneurship"
  - Topics: "Product Development", "Transparency", "Startup Journey"
- **Content Structure** (Template for each month):
  - H2: "Ce Mois-ci : Les Chiffres"
    - Waitlist growth
    - Blog traffic
    - Social media followers
    - Development progress (% complete)
  - H2: "Ce Que Nous Avons Construit"
    - Product features shipped
    - Technical challenges solved
    - Screenshots/demos
  - H2: "Ce Que Nous Avons Appris"
    - User feedback insights
    - Market learnings
    - Technical lessons
  - H2: "Défis et Obstacles"
    - Regulatory hurdles
    - Technical debt
    - Resource constraints
    - Honest reflection
  - H2: "Objectifs du Mois Prochain"
    - Feature roadmap
    - Milestones
  - H2: "Derrière les Coulisses"
    - Team updates
    - Personal reflections from founders
    - Photos/videos
- **CTAs**:
  - "Rejoindre Notre Aventure" → /#waitlist
  - "Nous Suivre sur LinkedIn" → [LinkedIn profile]
- **Expected Traffic**: 50-100 visits/month + LinkedIn sharing
- **Social Amplification**: Share each update on LinkedIn with key metrics screenshot
- **Notion Fields**:
  - Topic Tags: `build in public`, `startup`, `transparence`, `entrepreneurship`, `fintech`
  - Target Audience: `Entrepreneurs`, `Tech-Savvy`, `Early Adopters`

---

## 🎨 SEO Writing Best Practices

### Content Structure (Every Article)

#### 1. Title Optimization
- **Format**: `[Primary Keyword] : [Benefit/Promise]`
- **Examples**:
  - ✅ "Frais Fixes vs Frais en Pourcentage : Le Vrai Calcul sur 20 Ans"
  - ✅ "Yomoni vs Nalo vs Bubble : Analyse Comparative Complète 2025"
  - ❌ "Notre Avis sur les Frais" (too vague, no keyword)
- **Length**: 50-60 characters (displays fully in Google)
- **Include**: Primary keyword + year (if relevant)

#### 2. Meta Description (Content Summary FR)
- **Length**: 150-155 characters (optimal for Google SERP)
- **Include**: Primary keyword + compelling benefit
- **Tone**: Active voice, call-to-action
- **Examples**:
  - ✅ "Découvrez comment les frais fixes à 10€/mois surpassent les frais en pourcentage. Calcul sur 20 ans avec exemples réels." (148 chars)
  - ❌ "Cet article parle des frais d'investissement et compare différentes options." (too generic)

#### 3. First Paragraph (Hook)
- **First 100 words must include**:
  - Primary keyword (within first 50 words)
  - Clear problem statement
  - Promise of solution
  - Hook to keep reading
- **Example**:
  > "Les **frais d'investissement** sont le tueur silencieux de vos rendements. Sur 20 ans, un portefeuille de 100 000€ avec des **frais de 1,6%** vous coûtera plus de 51 000€ en performance perdue. Dans cet article, nous comparons les **frais fixes vs frais en pourcentage** avec des calculs réels et démontrons pourquoi notre modèle à 10€/mois change la donne."

#### 4. Heading Hierarchy (H2/H3 Structure)
- **H1**: Article title (only one per page, auto-generated from Title FR)
- **H2**: Main sections (5-8 per article)
  - Include keyword variations in 2-3 H2s
  - Use questions for educational content ("Pourquoi X ?", "Comment Y ?")
- **H3**: Subsections within H2 (as needed)
  - Use for lists, examples, case studies

**Example Hierarchy**:
```
H1: Frais Fixes vs Frais en Pourcentage : Le Vrai Calcul sur 20 Ans

  H2: Le Coût Caché des Frais en Pourcentage
    H3: L'Effet Compound sur 20 Ans
    H3: Exemple Réel : Portefeuille de 100 000€

  H2: Comparaison Détaillée : 10€/mois vs 1.6%
    H3: Scénario 1 : Petit Investisseur (10 000€)
    H3: Scénario 2 : Investisseur Moyen (50 000€)
    H3: Scénario 3 : Gros Investisseur (500 000€)

  H2: Pourquoi Les Robo-Advisors Utilisent les Frais en Pourcentage

  H2: Notre Modèle à Frais Fixes : Alignement d'Intérêts

  H2: Calculez Vos Économies [Interactive Calculator]
```

#### 5. Content Depth (1,500-2,500 Words)
- **Target**: 2,000 words average
- **Structure**:
  - Introduction: 150-200 words
  - Body sections: 300-500 words each (5-6 sections)
  - Conclusion: 150-200 words
- **Avoid**: Fluff, repetition, over-optimization
- **Include**: Data, examples, case studies

#### 6. Internal Linking (2-5 Links per Article)
- **Must include**:
  - 1 link to portfolio simulator (relevant articles)
  - 1 link to waitlist (all articles)
  - 1-2 links to related blog articles
- **Anchor text**: Descriptive, keyword-rich
  - ✅ "notre simulateur de portefeuille gratuit"
  - ❌ "cliquez ici"
- **Link placement**: Contextual within content, not just CTAs

#### 7. External Linking (2-4 Links per Article)
- **Link to authoritative sources**:
  - Academic research (Google Scholar, SSRN)
  - Regulatory bodies (AMF, ACPR, ECB)
  - Reputable publications (Les Echos, Financial Times)
  - Industry research (Vanguard, Morningstar)
- **No-follow links**: Competitors (Yomoni, Nalo)
- **Purpose**: Build credibility, support claims with data

#### 8. Visual Elements (2-5 per Article)
- **Featured image**: AI-generated via OpenAI (automatic)
- **Charts/graphs**: Portfolio simulator embeds, backtests
- **Tables**: Comparison tables (fees, features, performance)
- **Screenshots**: Product demos (when available)
- **Infographics**: Complex concepts visualized

#### 9. Call-to-Actions (CTAs)
- **Placement**:
  - Mid-article: Contextual CTA (after key insight)
  - End of article: Strong final CTA
- **CTA Types**:
  - "Testez Notre Simulateur de Portefeuille" → /portfolio-simulator
  - "Rejoindre la Liste d'Attente" → /#waitlist
  - "Téléchargez Notre Guide Gratuit" → (future: lead magnet)
- **Design**: Pill-shaped buttons (border-radius: 50px, matches site design)

#### 10. E-E-A-T Signals (Expertise, Experience, Authoritativeness, Trust)
- **Author bio**: Include at end of article
  - "Par [Joris Dupraz / Jade Hoang], co-fondateur de Bubble Invest. [Credentials]."
- **Publication date**: Display prominently
- **Last updated date**: Show when article is refreshed
- **Citations**: Link to sources for all claims
- **Transparency**: Disclose conflicts, limitations, biases

---

## 📊 Performance Tracking & Optimization

### Metrics to Monitor (Google Search Console)

#### 1. Traffic Metrics (Weekly Check)
- **Total clicks**: Blog traffic
- **Impressions**: How often articles appear in search
- **CTR (Click-Through Rate)**: Impressions → clicks (target: 3-5%)
- **Average position**: Ranking for keywords (target: position 1-10)

#### 2. Keyword Performance (Monthly Review)
- **Track top 20 keywords** by impressions
- **Identify opportunities**:
  - High impressions + low clicks = improve title/meta description
  - Position 11-20 = optimization opportunity (push to top 10)
  - Position 1-3 = protect with content updates

#### 3. Article Performance (Quarterly Review)
- **Top 5 articles by traffic**: Translate to EN, expand, update
- **Bottom 5 articles**: Identify issues:
  - Wrong keyword targeting?
  - Content quality issues?
  - Cannibalization (competing with own articles)?
  - Low search volume topic?

#### 4. Conversion Tracking (Monthly)
- **Blog → Simulator**: Track clicks on simulator CTAs
- **Blog → Waitlist**: Track signups from blog traffic
- **Blog → Other pages**: Engagement depth

---

### Optimization Playbook

#### When Article Ranks #11-20 (Page 2)
**Goal**: Push to Page 1 (position 1-10)

**Actions**:
1. **Expand content**: Add 300-500 words with new data
2. **Update title**: Test more compelling variation
3. **Add internal links**: From 2-3 high-traffic articles
4. **Refresh date**: Update "Last modified" date
5. **Add schema**: Ensure FAQPage or HowTo schema if applicable
6. **Build backlinks**: Share on LinkedIn, pitch to aggregators

#### When Article Ranks #1-3 (Top of Page 1)
**Goal**: Maintain position, prevent decay

**Actions**:
1. **Quarterly refresh**: Update stats, examples, dates
2. **Add depth**: Expand with new sections (FAQs, case studies)
3. **Monitor competitors**: Check if they're targeting same keyword
4. **Add video**: Embed YouTube explainer (future)
5. **Build moat**: Make article most comprehensive on topic

#### When Article Has Low CTR (< 2%)
**Goal**: Improve click appeal in search results

**Actions**:
1. **Rewrite title**: Make more compelling/specific
2. **Rewrite meta description**: Add numbers, questions, urgency
3. **Test power words**: "Guide Complet", "Analyse", "2025", "Gratuit"
4. **A/B test**: Change title, wait 2 weeks, compare CTR

#### When Article Has High Bounce Rate (> 70%)
**Goal**: Improve content relevance/quality

**Actions**:
1. **Check keyword intent**: Are searchers finding what they expect?
2. **Improve intro**: Hook readers in first 100 words
3. **Add TOC**: Table of contents for scanability
4. **Improve formatting**: More headings, bullet points, bold text
5. **Add visuals**: Charts, tables, images to break up text

---

## 🗓️ 12-Month Content Calendar

### Month 1-2: Foundation (4 articles)
**Goal**: Establish core positioning, capture high-intent traffic

| Week | Article | Target Keyword | Est. Time | Priority |
|------|---------|----------------|-----------|----------|
| 1 | Yomoni vs Nalo vs Bubble | `alternative yomoni` | 5h | 🔥 Highest |
| 2 | Frais Fixes vs Frais Pourcentage | `frais robo advisor` | 4h | 🔥 Highest |
| 3 | Comment Choisir un Robo-Advisor | `choisir robo advisor` | 4h | High |
| 4 | Investissement IA Expliqué | `investissement IA` | 4h | High |

**Deliverable**: 4 articles, ~8,000 words, 15-20 Knowledge Garden references cited

---

### Month 3-4: Quick Wins (4 articles)
**Goal**: Diversify keyword coverage, drive tool usage

| Week | Article | Target Keyword | Est. Time | Priority |
|------|---------|----------------|-----------|----------|
| 5 | Risk Parity Expliqué | `risk parity france` | 4h | High |
| 6 | Simulateur Gratuit Guide | `simulateur portefeuille` | 3h | High |
| 7 | Robo-Advisor Réglementé AMF | `robo advisor amf` | 4h | Medium |
| 8 | Investir avec 100€/500€/5000€ | `investir 100 euros` | 3h | High |

**Deliverable**: 4 articles, ~7,000 words, 12-16 Knowledge Garden references

---

### Month 5-6: Authority Building (4 articles)
**Goal**: Build domain authority, attract backlinks

| Week | Article | Target Keyword | Est. Time | Priority |
|------|---------|----------------|-----------|----------|
| 9 | Finance Comportementale | `biais cognitifs investissement` | 5h | 🔥 High |
| 10 | ETF vs Fonds Actifs | `etf vs fonds actifs` | 4h | High |
| 11 | DCA Mythe ou Réalité | `investissement programmé` | 4h | Medium |
| 12 | Diversification Scientifique | `diversification portefeuille` | 5h | High |

**Deliverable**: 4 articles, ~9,000 words, 16-20 Knowledge Garden references

---

### Month 7-8: Trending Topics (4 articles)
**Goal**: Capture seasonal and timely searches

| Week | Article | Target Keyword | Est. Time | Priority |
|------|---------|----------------|-----------|----------|
| 13 | Investir en 2025 | `investir 2025` | 4h | 🔥 Seasonal |
| 14 | Investir Pendant Récession | `investir récession` | 4h | High |
| 15 | IA vs Conseillers Financiers | `IA conseiller financier` | 4h | Medium |
| 16 | Bitcoin dans Portefeuille | `bitcoin portefeuille` | 5h | High |

**Deliverable**: 4 articles, ~8,500 words, 14-18 Knowledge Garden references

---

### Month 9-10: Advanced Topics (4 articles)
**Goal**: Target finance professionals, build niche authority

| Week | Article | Target Keyword | Est. Time | Priority |
|------|---------|----------------|-----------|----------|
| 17 | Optimisation Fiscale PEA/AV/CTO | `fiscalité etf france` | 5h | 🔥 High |
| 18 | Rebalancing Optimal | `rebalancing portefeuille` | 4h | Medium |
| 19 | Factor Investing Expliqué | `factor investing` | 5h | Medium |
| 20 | Build in Public #1 | `build in public fintech` | 2h | Low |

**Deliverable**: 4 articles, ~8,000 words, 12-16 Knowledge Garden references

---

### Month 11-12: Maintenance & Expansion (4+ articles)
**Goal**: Update existing content, fill gaps, test new topics

| Week | Article | Target Keyword | Est. Time | Priority |
|------|---------|----------------|-----------|----------|
| 21 | Build in Public #2 | Monthly series | 2h | Low |
| 22 | Top 5 Article Updates | Refresh high-traffic | 4h | High |
| 23 | New Topic (Data-Driven) | From Search Console | 4h | TBD |
| 24 | New Topic (Data-Driven) | From Search Console | 4h | TBD |

**Deliverable**: 4+ articles/updates, identify top 5 for translation to English

---

### Ongoing Tasks (Every Month)

#### Weekly (1 hour)
- [ ] Check Google Search Console for new keyword opportunities
- [ ] Monitor article performance (clicks, impressions, CTR)
- [ ] Share top article on LinkedIn with insights

#### Monthly (2 hours)
- [ ] Review top 10 keywords rankings
- [ ] Identify articles in position 11-20 for optimization
- [ ] Update 1 existing article with new data/section
- [ ] Track blog → waitlist conversion rate

#### Quarterly (4 hours)
- [ ] Full content audit (traffic, rankings, conversions)
- [ ] Translate top 2 articles to English
- [ ] Plan next quarter's content calendar
- [ ] Competitor content analysis (Yomoni, Nalo, Moneyvox blogs)

---

## 🔗 Notion Workflow Integration

### Knowledge Garden → Blog Article Linking

#### Step 1: Identify Relevant References
When writing Article #X, query Knowledge Garden database:

**Filter Criteria**:
- **Status** = "Published" (in Bubble Blog field)
- **Category** matches article theme (e.g., "Investment Strategy")
- **Topics** matches article keywords (e.g., "Portfolio Management")

**API Query Example** (for developers):
```javascript
// In blog article writing workflow
const knowledgeGardenReferences = await notion.databases.query({
  database_id: '1ffcfc520644805b8bb9c9207fb2cb31',
  filter: {
    and: [
      { property: 'Bubble Blog', multi_select: { contains: 'Published' } },
      { property: 'Category', multi_select: { contains: 'Investment Strategy' } }
    ]
  },
  sorts: [{ property: 'Date', direction: 'descending' }]
});
```

#### Step 2: Cite References in Article
**In Content FR field**, cite references with hyperlinks:

```markdown
Comme le démontre la recherche de [Author Name](Drive URL from Knowledge Garden),
les frais d'investissement ont un impact compound significatif sur le long terme.

Selon [Title of Reference](Drive URL), les investisseurs sous-estiment
systématiquement le coût des frais en pourcentage...
```

**Format**:
- Link text = Author name or reference title
- Link URL = "Drive URL" field from Knowledge Garden
- Add footnote with full citation at end of article (optional)

#### Step 3: Link via Notion Relations
**In "Bubble Blog Articles" database**:
- Use "Related Knowledge Topics" field (relation type)
- Select 3-8 references from Knowledge Garden
- This creates bidirectional link:
  - Blog article shows which references it cites
  - Knowledge Garden reference shows which blog articles cite it

**Benefits**:
- Track which references are most cited (popular research)
- Identify under-utilized references (unused research)
- Update articles when referenced research updates

---

### Content Approval Workflow

#### Draft Status Flow (Collaborative Writing Process)

**IMPORTANT**: Articles written by Claude will NEVER be set to "Published" automatically. You must review and approve each article before publication.

1. **Article Selection Phase**:
   - **You**: Choose article from priority list below
   - **You**: Create entry in "Bubble Blog Articles" Notion database
   - **You**: Set Status = "Idea"
   - **You**: Fill "Idée de l'article" with brief outline or ask Claude to create one
   - **You**: Notify Claude which article to work on

2. **Research Phase**:
   - **Claude**: Queries Knowledge Garden for relevant references
   - **Claude**: Identifies 5-10 references that match article theme
   - **Claude**: Researches external sources (AMF, academic papers, competitor articles)
   - **Claude**: Creates research brief with key points and sources
   - **You**: Review research brief, add any specific sources you want included
   - **You**: Update Status = "Research" in Notion

3. **Writing Phase**:
   - **Claude**: Writes full article (2,000 words) following SEO best practices
   - **Claude**: Includes citations to Knowledge Garden references
   - **Claude**: Creates meta description (150-155 characters)
   - **Claude**: Adds internal links (simulator, waitlist, related articles)
   - **Claude**: Suggests Topic Tags (SEO keywords)
   - **Claude**: Creates article entry directly in Notion with Status = "Draft" ⭐ **AUTOMATIC**
   - **Claude**: Populates all fields (Title FR/EN, Content FR/EN, Summaries, Tags)
   - **You**: Receive Notion URL to review the article

4. **Review Phase** ⭐ **YOUR APPROVAL REQUIRED**:
   - **You**: Open Notion URL provided by Claude
   - **You**: Read full article (Content FR and Content EN fields)
   - **You**: Check SEO checklist (keyword in title, H2s, first 100 words)
   - **You**: Verify quality (data-driven, actionable, accurate)
   - **You**: Make any edits directly in Notion OR ask Claude for revisions
   - **You**: Change Status to "In Review" (if good) or keep as "Draft" (if needs work)

5. **Revision Phase** (If Needed):
   - **You**: Provide specific feedback to Claude
   - **Claude**: Makes requested changes
   - **You**: Review again until satisfied
   - **You**: Set Status = "In Review" when ready for final approval

6. **Scheduling Phase**:
   - **You**: Final approval - article meets quality standards
   - **You**: Set "Publication Date" (today or future date)
   - **You**: Set Status = "Scheduled"
   - **System**: Featured image generates automatically when status changes

7. **Publication** ✅:
   - **You**: Change Status = "Published" in Notion
   - **System**: Article appears automatically on /blog
   - **System**: Dynamic meta tags populate
   - **System**: Sitemap.xml updates
   - **You**: (Optional) Submit to Google Search Console for faster indexing
   - **You**: (Optional) Share on LinkedIn with key insight

---

### How to Work with Claude on Articles

#### Option 1: Full Article Writing (Most Common) ⭐ **FULLY AUTOMATED**
**Use when**: You want Claude to write the entire article from scratch

**Process**:
1. **Tell Claude**: "Write article #X from the blog strategy: [Article Title]"
2. **Claude automatically**:
   - Queries Knowledge Garden for relevant references
   - Researches external sources
   - Writes 2,000-word article with proper structure (FR + EN)
   - Includes SEO optimization (keywords, headings, links)
   - Cites 3-8 Knowledge Garden references
   - Creates meta descriptions for both languages
   - **Creates article entry directly in Notion database**
   - **Sets Status = "Draft"**
   - **Provides you with Notion URL to review**
3. **You review**: Open Notion URL, read Content FR and Content EN
4. **You decide**:
   - ✅ Approve → Change Status to "In Review" → "Scheduled" → "Published"
   - ❌ Request changes → "Claude, please revise section X to focus more on Y"
   - 📝 Edit directly → Make small tweaks in Notion yourself
5. **You publish**: When satisfied, change Status = "Published" in Notion

**Example Request**:
```
"Claude, write Article #2 from the blog strategy:
'Frais Fixes vs Frais en Pourcentage : Le Vrai Calcul sur 20 Ans'

Please include:
- Research from Knowledge Garden on fee structures
- Interactive calculator concept
- Comparison at €10k, €50k, €100k, €500k over 20 years
- Link to our portfolio simulator

Create it directly in Notion with Status = Draft."
```

**Claude's Response**:
```
✅ Article created in Notion!

Notion URL: https://www.notion.so/[page-id]
Status: Draft
Word count: 2,043 (FR) / 2,011 (EN)
Knowledge Garden refs: 6 linked
Topic Tags: frais fixes, robo advisor, comparaison frais, investissement France

📄 Full article content saved to: docs/seo/ARTICLE_X_TITLE_FULL.md

Next steps:
1. Open Notion URL
2. Copy full FR content from .md file → paste into "Content FR" field
3. Copy full EN content from .md file → paste into "Content EN" field
4. Review and change Status when ready
```

**Note on Notion API Limitations**:
- Notion rich_text fields have a 2000-character limit per block
- For articles > 2000 chars, Claude creates:
  1. **Summary in Notion** (preview with structure)
  2. **Full content in .md file** (`docs/seo/ARTICLE_X_FULL.md`)
- You copy-paste full content from .md file into Notion UI
- Future improvement: Programmatic multi-block insertion (requires Notion blocks API)

---

#### Option 2: Outline First, Then Write (More Control)
**Use when**: You want to approve the structure before writing begins

**Process**:
1. **Tell Claude**: "Create an outline for article #X"
2. **Claude provides**: H2/H3 structure with key points (in chat, not yet in Notion)
3. **You review**: Approve outline or suggest changes
4. **Tell Claude**: "Outline approved, write the full article and create in Notion"
5. **Claude writes**: Full 2,000-word article following approved outline
6. **Claude creates**: Article entry in Notion with Status = "Draft"
7. **You review and publish**: Same as Option 1

**Example Request**:
```
"Claude, create a detailed outline for Article #1:
'Yomoni vs Nalo vs Bubble : Analyse Comparative Complète 2025'

Include:
- H2 sections you recommend
- Key comparison points
- Knowledge Garden references to cite"
```

---

#### Option 3: Section-by-Section Collaboration (Highest Quality)
**Use when**: You want to co-create the article with maximum control

**Process**:
1. **Tell Claude**: "Let's write Article #X section by section. Create the Notion entry first."
2. **Claude creates**: Empty Notion entry with Status = "Draft", provides URL
3. **Claude writes**: Introduction + first H2 section (shows you in chat)
4. **You review**: Approve or request changes
5. **Repeat**: For each H2 section until article is complete
6. **Claude updates**: Notion entry with full compiled article (FR + EN)
7. **You publish**: Review in Notion, change Status when ready

**Example Request**:
```
"Claude, let's write Article #4 section by section.
Start with the introduction and first H2:
'Les Trois Types d'IA en Investissement'

After I review this section, we'll continue to the next one."
```

---

#### Option 4: Revision and Enhancement (Existing Articles)
**Use when**: You want to update or improve existing articles

**Process**:
1. **Tell Claude**: "Update article [Notion URL or title] - add section on X, update stats, expand Y"
2. **Claude reads**: Current article from Notion via API
3. **Claude updates**: Article directly in Notion with changes
4. **Claude notifies**: "Updated article with new section on X, added 2024 data"
5. **You review**: Check changes in Notion
6. **You update**: Change Status to "In Review" if significant changes, or keep "Published" if minor edits

**Example Request**:
```
"Claude, I want to update our existing article on Risk Parity.
Please add a new section comparing our Optimized Risk Parity
to traditional 60/40 portfolios with 2024 data."
```

---

### Quality Control Checklist (Your Review)

Before changing Status from "Draft" to "In Review" or "Scheduled", verify:

#### SEO Checklist ✅
- [ ] Target keyword in Title FR (within first 60 characters)
- [ ] Target keyword in first 100 words of article
- [ ] 2-3 H2 headings include keyword variations
- [ ] Article length: 1,500-2,500 words (target: 2,000)
- [ ] Content Summary FR: 150-155 characters (meta description)
- [ ] Topic Tags: Primary keyword + 3-5 variations
- [ ] Internal links: 2-5 (simulator, waitlist, other blog posts)
- [ ] External links: 2-4 (authoritative sources like AMF, academic papers)
- [ ] Knowledge Garden references: 3-8 cited with links

#### Content Quality Checklist ✅
- [ ] Clear value proposition in first paragraph
- [ ] Data/charts support key claims (not just opinions)
- [ ] Actionable takeaways (reader learns something useful)
- [ ] No factual errors (verify stats, names, dates)
- [ ] Accurate representation of Bubble's product
- [ ] No grammar/spelling errors (Grammarly check)
- [ ] Tone matches brand (transparent, data-driven, accessible)
- [ ] CTAs are contextual and non-pushy

#### E-E-A-T Signals ✅
- [ ] Author mentioned (Joris, Jade, or "Bubble Team")
- [ ] Citations to authoritative sources
- [ ] Transparency about limitations/biases
- [ ] Publication date will be set
- [ ] No overpromising or misleading claims

**If all checkboxes pass** → Status = "Scheduled" → Set Publication Date → Approve

**If any fail** → Keep Status = "Draft" → Request Claude to revise specific sections

---

### Notion Status Definitions

| Status | Meaning | Who Sets It |
|--------|---------|-------------|
| **Idea** | Article topic selected, brief outline | You |
| **Research** | Claude is gathering references | You (after Claude provides research) |
| **Draft** | Full article written, needs your review | You (after pasting Claude's article) |
| **In Review** | Article is good, final check before scheduling | You |
| **Scheduled** | Approved, will publish on set date | You |
| **Published** | Live on /blog, visible to public | You (manual approval required) |

**KEY RULE**: Claude will NEVER set Status = "Published". Only you can publish articles after review.

---

### Bilingual Publication Requirement ⭐ MANDATORY

**IMPORTANT**: All articles must be available in BOTH French and English before publication.

#### Translation Workflow

**For French-first articles** (most common):
1. **Claude writes** in French (Content FR field, 2,000 words)
2. **You review** French version → Status = "Draft"
3. **Claude translates** to English (Content EN field)
   - Not word-for-word translation
   - Adapts cultural references (e.g., "AMF" → "AMF (French financial regulator)")
   - Maintains same structure (H2/H3)
   - Adapts examples for international audience
4. **You review** both versions → Status = "In Review"
5. **You approve** → Status = "Scheduled" → Both versions publish simultaneously

**For English-first articles** (if applicable):
1. **Claude writes** in English (Content EN field)
2. **Claude translates** to French (Content FR field)
3. **You review** both versions
4. Same approval process

#### Notion Fields to Fill (Before Publishing)

**French Version** (Required):
- Title FR (title field) ✅
- Content FR (rich_text) ✅
- Content Summary FR (meta description, 150-155 chars) ✅

**English Version** (Required):
- Title EN (rich_text) ✅
- Content EN (rich_text) ✅
- Content Summary EN (meta description, 150-155 chars) ✅

**Shared Fields**:
- Topic Tags (same for both languages)
- Related Knowledge Topics (same references)
- Publication Date (same for both)
- Author (same)
- Target Audience (same)

#### Example Request for Bilingual Article

```
"Claude, write Article #1 from the blog strategy:
'Yomoni vs Nalo vs Bubble : Analyse Comparative Complète 2025'

Please provide:
1. Full article in French (2,000 words)
2. Translation to English (adapted for international readers)
3. Meta descriptions for both languages (150-155 chars each)
4. Suggested Topic Tags

I'll review both versions before publishing."
```

#### Quality Check: Bilingual Content

Before Status = "Scheduled":
- [ ] Content FR field filled (1,500-2,500 words)
- [ ] Content EN field filled (1,500-2,500 words)
- [ ] Title FR matches Title EN (translated)
- [ ] Content Summary FR: 150-155 characters
- [ ] Content Summary EN: 150-155 characters
- [ ] Both versions cite same Knowledge Garden references
- [ ] Both versions have same internal links (FR: /blog/[slug], EN: /en/blog/[slug])
- [ ] Cultural references adapted (not just translated)
- [ ] No English text in French version, no French text in English version

#### URL Structure (Automatic)

When you publish:
- French version: `https://bubbleinvest.org/blog/[slug-fr]`
- English version: `https://bubbleinvest.org/en/blog/[slug-en]`
- Hreflang tags link both versions automatically
- Sitemap.xml includes both URLs

**Translation Time Estimate**: +1-2 hours per article (included in workflow)

---

### Knowledge Garden Enrichment for Blog

**Proactive Content Mining**:
Every month, query Knowledge Garden for:

1. **Most Cited References**:
   - Filter: "Bubble Blog" = "Published"
   - Sort by: Number of blog relations
   - Action: Expand top references into standalone articles

2. **Under-Utilized References**:
   - Filter: "Bubble Blog" = "Published" AND zero blog relations
   - Action: Find blog opportunities for these references

3. **New References Added**:
   - Filter: Created in last 30 days
   - Action: Identify if any match current article priorities

**Content Gap Analysis**:
- Compare Knowledge Garden Categories with blog Topic Tags
- Identify categories with many references but few blog articles
- Prioritize writing articles for under-covered categories

---

## 📈 Success Metrics & KPIs

### Traffic Goals (12-Month Targets)

| Metric | Current | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|---------|----------|
| **Monthly Blog Visits** | 50-100 | 500-800 | 1,500-2,500 | 3,000-5,000 |
| **Published Articles** | 6 | 10 | 16 | 25-30 |
| **Ranked Keywords** | 5-10 | 30-50 | 80-120 | 150-200 |
| **Top 10 Rankings** | 0-1 | 2-4 | 8-15 | 20-30 |
| **Average Position** | 50-100 | 30-50 | 20-40 | 10-20 |
| **Domain Authority** | New | 10-15 | 15-20 | 20-30 |
| **Backlinks** | 0-5 | 5-10 | 15-25 | 30-50 |

### Conversion Goals

| Metric | Current | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|---------|----------|
| **Blog → Waitlist** | N/A | 2-3% | 3-5% | 5-8% |
| **Blog → Simulator** | N/A | 5-8% | 8-12% | 10-15% |
| **Avg. Time on Page** | N/A | 2-3 min | 3-4 min | 4-5 min |
| **Bounce Rate** | N/A | 60-70% | 50-60% | 40-50% |

### Content Quality Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Word Count** | 1,500-2,500 avg | Notion character count / 5 |
| **Knowledge Garden Citations** | 3-8 per article | Count "Related Knowledge Topics" relations |
| **Internal Links** | 2-5 per article | Manual count in Content FR |
| **External Links** | 2-4 per article | Manual count in Content FR |
| **Publication Frequency** | 2-3 per month | Notion "Published" filter by month |
| **Update Frequency** | Top 5 quarterly | Track "Last edited" field |

---

## 🛠️ Tools & Resources

### Writing Tools
- **Notion**: Primary writing environment (Content FR/EN fields)
- **Grammarly** (Free): Grammar/spelling check for FR
- **Hemingway Editor** (Free): Readability check (target: Grade 8-10)
- **ChatGPT/Claude**: Research assistant, outline generation (NOT full article writing)

### SEO Tools (Free)
- **Google Search Console**: Traffic, rankings, keyword opportunities
- **Google Analytics 4** (Optional): Deeper traffic analysis
- **Google Trends**: Seasonal search volume, keyword validation
- **AnswerThePublic** (Free tier): Question-based keyword research

### Image Tools
- **OpenAI DALL-E** (Already integrated): Automatic featured images
- **Unsplash**: Fallback stock images (free, no attribution required)
- **Canva** (Free): Custom graphics, infographics

### Research Tools
- **Google Scholar**: Academic research
- **SSRN**: Finance research papers
- **AMF Website**: Regulatory data, investor guides
- **Knowledge Garden** (Notion): Primary research library

---

## ✅ Launch Checklist

### Before Publishing First New Article

- [ ] Review this strategy document
- [ ] Set up Google Search Console weekly email reports
- [ ] Create "Article Writing" template in Notion with SEO checklist
- [ ] Test featured image generation (OpenAI)
- [ ] Verify sitemap.xml includes new blog posts automatically
- [ ] Test blog post meta tag updates (title, description, OG)
- [ ] Create LinkedIn content sharing template

### Before Publishing Each Article

- [ ] Query Knowledge Garden for 5-10 relevant references
- [ ] Link 3-8 references in "Related Knowledge Topics" field
- [ ] SEO checklist: keyword in title, H2s, first 100 words
- [ ] Quality checklist: 1,500+ words, 2+ CTAs, data/charts
- [ ] Meta description: 150-155 characters, compelling, keyword-rich
- [ ] Topic Tags: primary keyword + 3-5 variations
- [ ] Internal links: simulator (1x), waitlist (1x), other articles (2x)
- [ ] External links: 2-4 authoritative sources
- [ ] Set "Publication Date" to today or future (for scheduling)
- [ ] Status = "Published"

### After Publishing Each Article

- [ ] Wait 24-48 hours for Google to auto-crawl
- [ ] Or: Submit URL to Google Search Console for immediate indexing
- [ ] Share on LinkedIn with key insight + link
- [ ] Monitor Google Search Console for impressions (week 1-2)
- [ ] Track article performance in GSC monthly

---

## 📚 Additional Resources

### SEO Learning
- **Ahrefs Blog**: [ahrefs.com/blog](https://ahrefs.com/blog) (free, excellent guides)
- **Backlinko**: [backlinko.com](https://backlinko.com) (Brian Dean's SEO strategies)
- **Google Search Central**: [developers.google.com/search](https://developers.google.com/search) (official guidelines)

### Finance Content Examples (Inspiration)
- **Vanguard Blog**: Data-driven, evidence-based approach
- **Morningstar**: Deep analysis, research-backed
- **A Wealth of Common Sense** (Ben Carlson): Simple explanations, charts
- **Of Dollars and Data** (Nick Maggiulli): Data storytelling

### French FinTech Blogs (Competitors)
- **Yomoni Blog**: Product-focused, tax-heavy
- **Nalo Blog**: Educational, beginner-friendly
- **Moneyvox**: Comparison-focused, SEO-optimized

---

## 🎯 Next Steps

### Immediate Actions (This Week)
1. ✍️ **Write Article #1**: "Yomoni vs Nalo vs Bubble" (5 hours)
   - Highest impact, buyer intent traffic
   - Research competitors, create comparison table
   - Link 6-8 Knowledge Garden references on robo-advisors
2. ✍️ **Write Article #2**: "Frais Fixes vs Frais Pourcentage" (4 hours)
   - Core differentiator, strong SEO potential
   - Build interactive fee calculator (embedded in article)
   - Link 5-7 Knowledge Garden references on fees/costs
3. 📊 **Set up tracking**: Enable Google Search Console weekly reports

### This Month
4. ✍️ Write Article #3 & #4 from Priority 1 list
5. 🔗 Update existing 6 articles with internal links to new articles
6. 📱 Share new articles on LinkedIn (tag relevant influencers)

### Next Quarter (Month 2-3)
7. Complete Priority 1 articles (4 total)
8. Start Priority 2 articles (4 total)
9. Translate top 2 performing articles to English
10. Monitor Google Search Console, optimize underperforming articles

---

**Document Status**: ✅ **READY FOR EXECUTION**
**Last Updated**: 2025-10-29
**Next Review**: 2026-01-29 (quarterly review)

---

**Questions or Need Clarification?**
This strategy is a living document. Update it as you learn from data, user feedback, and market changes. Focus on quality over quantity—2 excellent articles per month beat 5 mediocre ones.

**Let's build the best AI investment education hub in France! 🚀**
