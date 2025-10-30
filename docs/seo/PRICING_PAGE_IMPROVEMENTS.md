# Pricing Page Improvements - Business Model Clarity

**Date**: 2025-10-30
**Purpose**: Clarify that users pay for **platform/agent/MCP access** (not automated trading), and that **AI empowers but doesn't control** investment decisions

---

## Critical Clarifications Needed

### **Current Problem:**
The pricing page focuses on features (screeners, strategies, backtests) but doesn't clearly explain:
1. What users are actually paying for (platform access vs. trading service)
2. That AI **empowers/educates** users but **doesn't control** their investments
3. That users maintain **full decision-making authority**

### **Business Model Reality:**
- **What users pay for**: Platform/agent/MCP access to cover API costs, infrastructure, servers
- **What AI provides**: Analysis tools, insights, backtests, education, decision support
- **What users control**: ALL investment decisions and execution
- **Regulatory positioning**: Decision support tool, NOT asset management service

---

## Recommended Changes to Pricing Page

### **1. Add New Section After Hero: "What You're Paying For"**

Insert this section between the hero (`<section class="pricing-hero">`) and pricing plans (`<section class="pricing-plans">`):

```html
<section class="pricing-value-prop">
  <div class="container">
    <div class="value-prop-content">
      <h2>Ce que vous payez : l'accès, pas le contrôle</h2>

      <div class="value-prop-grid">
        <div class="value-prop-card">
          <div class="value-prop-icon">
            <svg><!-- Platform icon --></svg>
          </div>
          <h3>Accès à la Plateforme</h3>
          <p>
            Votre abonnement couvre <strong>l'accès à notre agent IA, nos APIs et notre infrastructure</strong> :
            serveurs, calculs, données en temps réel, backtests.
          </p>
        </div>

        <div class="value-prop-card">
          <div class="value-prop-icon">
            <svg><!-- Education icon --></svg>
          </div>
          <h3>IA qui Vous Éduque</h3>
          <p>
            Notre IA <strong>vous donne des insights, des analyses et des recommandations</strong>.
            Elle ne prend <strong>jamais</strong> de décisions d'investissement à votre place.
          </p>
        </div>

        <div class="value-prop-card">
          <div class="value-prop-icon">
            <svg><!-- Control icon --></svg>
          </div>
          <h3>Vous Gardez le Contrôle</h3>
          <p>
            <strong>100% de vos décisions d'investissement vous appartiennent</strong>.
            Vous validez chaque trade. Vous restez propriétaire de vos comptes courtiers.
          </p>
        </div>
      </div>

      <div class="value-prop-highlight">
        <p>
          <strong>Important :</strong> Bubble est un <strong>outil de décision</strong>,
          pas un service de gestion d'actifs. Nous vous aidons à investir mieux,
          mais <strong>vous restez aux commandes</strong>.
        </p>
      </div>
    </div>
  </div>
</section>
```

---

### **2. Update Hero Subtitle for Clarity**

**Current:**
```html
<p class="hero-subtitle">
  Des offres simples et prévisibles — aucun % d'AUM, aucune couche cachée.
</p>
```

**Recommended:**
```html
<p class="hero-subtitle">
  Des offres simples et prévisibles pour <strong>l'accès à notre plateforme IA</strong> —
  aucun % d'AUM, aucune couche cachée, aucune gestion pour vous.
</p>
```

---

### **3. Update Hero Helper Text**

**Current:**
```html
<p class="hero-helper">
  Construisez votre portefeuille avec une automatisation transparente qui vous restitue la valeur.
</p>
```

**Recommended:**
```html
<p class="hero-helper">
  Construisez votre portefeuille avec <strong>des outils d'analyse IA</strong> qui vous
  <strong>éduquent et vous conseillent</strong> — sans jamais prendre de décisions à votre place.
</p>
```

---

### **4. Update Plan Descriptions to Emphasize "Tools" Not "Automation"**

#### **Free Plan:**
**Current:** "Prouver la valeur et guider l'onboarding."

**Recommended:** "Découvrir les outils d'analyse et comprendre votre style d'investissement."

---

#### **Starter Plan:**
**Current tagline:** "Automatisation Guidée"
**Current purpose:** "Relier la découverte à l'automatisation."

**Recommended tagline:** "Outils Guidés"
**Recommended purpose:** "Accès aux outils d'analyse et signaux pour vos premières décisions."

**Feature update:**
- **Current:** "Réévaluation mensuelle automatique"
- **Recommended:** "Alertes de réévaluation mensuelle (vous décidez d'exécuter)"

---

#### **Plus Plan (Most Popular):**
**Current tagline:** "Intelligence Active"
**Current purpose:** "Débloquer données quotidiennes et signaux intelligents."

**Recommended tagline:** "Insights Intelligents"
**Recommended purpose:** "Données quotidiennes et signaux IA pour décisions éclairées."

**Feature update:**
- **Current:** "Réévaluation hebdomadaire + alertes"
- **Recommended:** "Alertes de réévaluation hebdomadaire + recommandations IA (vous validez)"

---

#### **Pro Plan:**
**Current tagline:** "Contrôle Expert"
**Current purpose:** "Puissance institutionnelle et profondeur analytique."

**Recommended:** Keep as-is (already emphasizes "control" and "analysis")

---

### **5. Add FAQ Section at Bottom of Page**

Insert before `<section class="pricing-notes-section">`:

```html
<section class="pricing-faq">
  <div class="container">
    <h2>Questions Fréquentes</h2>

    <div class="faq-list">
      <details class="faq-item">
        <summary>
          <h3>Que payez-vous exactement avec un abonnement Bubble ?</h3>
        </summary>
        <p>
          Vous payez pour <strong>l'accès à notre plateforme d'analyse IA</strong> :
          serveurs, APIs de données (Uncle Stock, Yahoo Finance, etc.),
          calculs de backtests, alertes en temps réel, et notre agent conversationnel.
          <strong>Vous ne payez PAS pour de la gestion d'actifs.</strong>
        </p>
      </details>

      <details class="faq-item">
        <summary>
          <h3>L'IA prend-elle des décisions d'investissement pour moi ?</h3>
        </summary>
        <p>
          <strong>Non, jamais.</strong> Notre IA vous fournit des <strong>analyses, insights, backtests et recommandations</strong>.
          Mais <strong>vous validez chaque décision d'investissement</strong>.
          Vous êtes aux commandes de vos comptes courtiers (IBKR, Alpaca, Saxo).
        </p>
      </details>

      <details class="faq-item">
        <summary>
          <h3>Quelle est la différence avec un robo-advisor comme Yomoni ou Nalo ?</h3>
        </summary>
        <p>
          Yomoni et Nalo sont des <strong>services de gestion d'actifs</strong> :
          ils gèrent votre argent, prennent les décisions, et vous facturent un % de vos actifs.
          <br><br>
          Bubble est un <strong>outil de décision</strong> : nous vous donnons les analyses et recommandations,
          mais <strong>vous gardez le contrôle total</strong> de vos investissements et vos comptes courtiers.
        </p>
      </details>

      <details class="faq-item">
        <summary>
          <h3>Pourquoi un prix fixe plutôt qu'un % d'actifs ?</h3>
        </summary>
        <p>
          Parce que nous <strong>ne gérons pas vos actifs</strong>.
          Notre coût est lié à <strong>l'infrastructure (serveurs, APIs, calculs)</strong>,
          pas à la taille de votre portefeuille.
          <br><br>
          Un prix fixe signifie <strong>zéro conflit d'intérêt</strong> :
          nous ne gagnons pas plus si vous investissez plus.
          Notre succès dépend de la <strong>qualité de nos outils</strong>, pas de vos AUM.
        </p>
      </details>

      <details class="faq-item">
        <summary>
          <h3>Qui garde le contrôle de mes comptes courtiers ?</h3>
        </summary>
        <p>
          <strong>Vous, à 100%.</strong>
          Vous maintenez vos propres comptes chez Interactive Brokers, Alpaca ou Saxo Bank.
          Bubble se connecte via API pour <strong>récupérer vos positions</strong> et
          <strong>vous suggérer des ordres</strong>, mais <strong>vous validez chaque transaction</strong>.
        </p>
      </details>

      <details class="faq-item">
        <summary>
          <h3>Est-ce que Bubble est régulé par l'AMF ?</h3>
        </summary>
        <p>
          Bubble est un <strong>outil de décision et d'analyse</strong>,
          pas un service de gestion d'actifs.
          Cela signifie un cadre réglementaire différent des robo-advisors traditionnels.
          <br><br>
          Vos actifs restent chez des courtiers régulés (IBKR, Alpaca, Saxo),
          couverts par leurs protections respectives (SIPC aux US, FCA/CySEC en Europe).
        </p>
      </details>
    </div>
  </div>
</section>
```

---

### **6. Update Pricing Notes Section**

**Current:**
```html
<div class="pricing-notes">
  <p><strong>Prix indicatifs</strong>, susceptibles d'évoluer.</p>
  <p>
    ARPU progressif 0 → 3 → 7 → 15 €. Annualisation –15 %. « Founder plan » early birds.
    Exemple bundle « Plus + Data Premium » ≈ 9,90 €.
  </p>
</div>
```

**Recommended:**
```html
<div class="pricing-notes">
  <p><strong>Prix indicatifs</strong>, susceptibles d'évoluer avant le lancement.</p>
  <p>
    Ces tarifs couvrent <strong>l'accès à notre plateforme, nos APIs de données tierces
    (Uncle Stock, Yahoo Finance, etc.), notre infrastructure de calcul et notre agent IA</strong>.
    Vous ne payez <strong>pas</strong> pour de la gestion d'actifs ou des % d'AUM.
  </p>
  <p>
    <small>
      ARPU progressif 0 → 3 → 7 → 15 €. Annualisation –15%. « Founder plan » early birds.
      Exemple bundle « Plus + Data Premium » ≈ 9,90 €.
    </small>
  </p>
</div>
```

---

## Summary of Key Messages to Reinforce

### **What Users Pay For:**
✅ Platform/agent/MCP access
✅ API costs (Uncle Stock, Yahoo Finance, Perplexity, etc.)
✅ Infrastructure (servers, compute, backtests)
✅ AI-powered analysis tools and insights

### **What Users Get:**
✅ Education and empowerment through AI
✅ Analysis, insights, backtests, recommendations
✅ Decision support tools
✅ Alerts and signals

### **What Users DON'T Get:**
❌ Automated trading without user approval
❌ Asset management service
❌ Someone else controlling their investments
❌ Custody of their assets (they keep their own broker accounts)

### **What Users Control:**
✅ 100% of investment decisions
✅ Their own brokerage accounts (IBKR/Alpaca/Saxo)
✅ When to execute trades (AI suggests, user validates)
✅ Their asset allocation and risk profile

---

## CSS Additions Needed

Add to `/assets/styles/styles.css`:

```css
/* Pricing Value Proposition Section */
.pricing-value-prop {
  padding: 4rem 0;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-top: 1px solid #dee2e6;
  border-bottom: 1px solid #dee2e6;
}

.value-prop-content h2 {
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 3rem;
  color: #212529;
}

.value-prop-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.value-prop-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  text-align: center;
}

.value-prop-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
}

.value-prop-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #212529;
}

.value-prop-card p {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #6c757d;
}

.value-prop-highlight {
  background: white;
  border-left: 4px solid #667eea;
  border-radius: 8px;
  padding: 1.5rem 2rem;
  margin-top: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.value-prop-highlight p {
  margin: 0;
  font-size: 1rem;
  line-height: 1.6;
  color: #495057;
}

/* Pricing FAQ Section */
.pricing-faq {
  padding: 4rem 0;
  background: white;
}

.pricing-faq h2 {
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 3rem;
  color: #212529;
}

.faq-list {
  max-width: 800px;
  margin: 0 auto;
}

.faq-item {
  background: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 1rem;
  overflow: hidden;
  border: 1px solid #dee2e6;
}

.faq-item summary {
  padding: 1.5rem;
  cursor: pointer;
  font-weight: 600;
  color: #212529;
  list-style: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.faq-item summary::-webkit-details-marker {
  display: none;
}

.faq-item summary::after {
  content: '+';
  font-size: 1.5rem;
  font-weight: 400;
  color: #667eea;
  transition: transform 0.2s ease;
}

.faq-item[open] summary::after {
  transform: rotate(45deg);
}

.faq-item summary h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.faq-item p {
  padding: 0 1.5rem 1.5rem 1.5rem;
  margin: 0;
  line-height: 1.6;
  color: #495057;
}

@media (max-width: 768px) {
  .value-prop-grid {
    grid-template-columns: 1fr;
  }

  .pricing-value-prop {
    padding: 2rem 0;
  }

  .value-prop-content h2,
  .pricing-faq h2 {
    font-size: 1.5rem;
  }
}
```

---

## English Version Equivalent Changes

Apply the same structure and messaging to `/src/frontend/pages/en/pricing.html`:

- Hero subtitle: "Simple, predictable pricing for **AI platform access** — no AUM%, no hidden layers, no management for you."
- Hero helper: "Build your portfolio with **AI analysis tools** that **educate and advise you** — never making decisions on your behalf."
- Value prop section: "What You're Paying For: Access, Not Control"
- FAQ translated to English with same Q&A structure

---

## Next Steps

1. **Implement HTML/CSS changes** to pricing page (FR + EN)
2. **Update all documentation** (CLAUDE.md, corrections docs, strategy docs) to reflect empowerment model
3. **Update blog content strategy** to never position Bubble as "automated trading" but as "AI-powered decision support"
4. **Test messaging** with early waitlist users for clarity

---

**Key Takeaway**: Every mention of "automation" should be reframed as "analysis tools + user decision". Bubble empowers, educates, and recommends — but **users always control**.
