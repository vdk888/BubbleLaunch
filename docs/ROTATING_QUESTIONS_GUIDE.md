# Rotating Sample Questions Guide

## Location

**File:** `/src/frontend/i18n/translations.js`

**Translation Key:** `"chat.rotatingPlaceholders"`

**Line Numbers:** Starting at line 189

---

## Current Questions

### English (Lines 190-208)
```javascript
  "en: [
  "Why is AI a game-changer for investment?",
  "Explain what drove last year's performance by sector, style, and region...",
  "How do you cut fees?",
  "Compare Sharpe, Sortino, drawdown...",
  "What is volatility, put simply?",
  "How to compare two funds?",
  "Make a stress test for rates, inflation, spreads...",
  "What is diversification?",
  "Quantify fee drag and breakeven alpha...",
  "How to build my starter portfolio?",
  "Do performance attribution by sector and factor...",
  "Why rebalance? How often to rebalance?...",
  "Optimize my portfolio with constraints and taxes...",
  "What are the actual fees left?",
  "Explain liquidity, slippage, execution costs...",
  "How to read a factsheet?",
  "What returns should I expect?",
  "Compute the VaR and Expected Shortfall..."
]
```

### French (Lines 210+)
```javascript
  "fr: [
  "Pourquoi l'IA change la donne pour les investissements ?",
  "Expliquez ce qui a soutenu la performance de l'année dernière par secteur, style et région...",
  "Comment réduisez-vous les frais ?",
  "Compare Sharpe, Sortino, drawdown...",
  "C'est quoi la volatilité, simplement ?",
  "Comment comparer deux fonds ?",
  "Fais moi un stress test: taux, inflation, spreads...",
  "C'est quoi la diversification ?",
  "Mesure l'impact des frais et l'alpha de seuil...",
  "Comment construire mon portefeuille de démarrage ?",
  "Fais moi une attribution de performance par secteur et facteur...",
  "Pourquoi rééquilibrer ? Combien de fois par an ?...",
  "Optimise mon portfolio avec mes contraintes et la fiscalité...",
  "Quel sont les vrais frais restants ?",
  "Explique la liquidité, le slippage, les coûts d'exécution...",
  "Comment lire une fiche signalétique ?",
  "Quels rendements dois-je attendre ?",
  "Calcule la VaR et la Shortfall attendue..."
]
```

---

## How to Edit

1. **Open the file:**
   `/src/frontend/i18n/translations.js`

2. **Find the section:**
   Search for `"chat.rotatingPlaceholders"` (line 189)

3. **Edit the questions:**
   - Keep the array structure (each question as a string within the array)
   - Make sure French and English arrays have matching counts
   - The animation will cycle through them automatically

4. **Important:**
   - Always maintain both `en` and `fr` arrays in sync
   - Keep questions concise (they animate with a typing effect)
   - Use ellipsis (...) at the end of longer questions for visual consistency

---

## Where These Questions Appear

1. **Homepage Hero Chat Input** (`.hero-chat-input`)
   - Animated in the main hero section
   - Stops when user focuses on the input
   - Resumes when user blurs (unfocuses) the input
   - Handled by: `/src/frontend/js/hero-chat-animation.js`

2. **Chat Side Panel Input** (`.chat-input`)
   - Animated inside the chat side panel (on pricing, blog, etc.)
   - Same animation behavior
   - Handled by: `/src/frontend/js/chatbot-animations.js`

---

## Animation Behavior

- **Typing Speed:** 50ms per character
- **Pause Between Questions:** 2 seconds
- **Total Rotation Cycle:** ~4 seconds per question
- **Stops On:** User focuses the input field
- **Resumes On:** User blurs (unfocuses) the input field with no text entered
- **Language Switching:** Automatically restarts animation with new language

---

## Recent Fix

**Bug Fix (Nov 15, 2025):**
- **Issue:** Rotating questions were appearing twice on the homepage
- **Cause:** Both `chatbot-animations.js` and `hero-chat-animation.js` were running simultaneously
- **Solution:** Added visibility check to `chatbot-animations.js` to skip animation if the chat panel is hidden

The fix ensures:
- Only the visible input animates at any given time
- No conflict between hero chat and side panel chat animations
- Smooth experience on all pages
