# Mock V4 Summary — Refined Homepage & About Page

## Overview

After visiting the live site (bubbleinvest.org), created refined mocks that:
- Keep the **existing 2-card dual path** (not 3 cards)
- Preserve **all animations** from current site
- Use **purple accents on hover only**
- Add **minimal header** (like Mock 2)
- Include enriched **footer with social links**
- Create new **About page** with mission, values, story

---

## Mock Pages Available

### 1. Homepage Mock V4
**URL:** http://localhost:3001/homepage-mock-v4

**Key Changes from Live Site:**

| Element | Live Site | Mock V4 |
|---------|-----------|---------|
| Header | Complex nav with dropdowns | Minimal: Logo + 4 links + lang switch |
| Hero tagline | "L'agent d'investissement transparent" | "L'agent qui gère votre portefeuille pour vous" |
| Hero subtitle | Mentions "IA" | "un agent qui automatise vos investissements" |
| B2B card title | "Solutions pour Entreprises" | **"Implémentation de Systèmes Agentiques"** |
| B2B badge | None | **"FOCUS ACTUEL"** badge |
| B2C badge | None | **"PARTAGE"** badge |
| Purple usage | Background gradients | **Hover only** (cards, buttons, links) |
| Footer | Simple | **Enriched** with 4 columns + social links |
| "Why Bubble" | Not present | Link in footer to /about |

**Sections (same structure as live):**
1. Hero with chat input
2. Dual Path (2 cards)
3. Superhero highlight
4. Blog preview
5. Approach (4 steps)
6. Waitlist
7. Footer (enriched)

**Animations Kept:**
- Fade-in on scroll
- Float animation on hero logo
- Pulse on background gradient
- Hover effects (purple)
- Card lift on hover

---

### 2. About Page Mock
**URL:** http://localhost:3001/about-mock

**New Page — Sections:**

1. **Hero** — Simple header with page title
2. **Manifesto** — Benevolence quote with attribution
3. **Values (4 tiles)** — Clickable cards linking to blog:
   - 📚 Éduquer → /blog?tag=education
   - 🤖 Automatiser → /blog?tag=automation
   - 👁️ Transparence → /blog?tag=transparency
   - 💜 Bienveillance → /blog?tag=values
4. **Our Story** — J&J background, why they created Bubble
5. **Team** — Joris (tech) & Jade (finance), anonymous approach
6. **What We Do** — B2B first, B2C as sharing
7. **Why Bubble** — The 3 meanings:
   - 🫧 Éclater la bulle de la finance opaque
   - 💰 Investir (métier historique)
   - 🎯 Double sens: bulles tech + investir en soi
8. **Build in Public** — Links to blog, newsletter, YouTube, LinkedIn

---

## Design System Used

### Colors
```css
--primary: #111111;        /* Text, buttons */
--secondary: #666666;      /* Descriptions */
--muted: #999999;          /* Subtle text */
--border: rgba(0,0,0,0.1); /* Borders */
--bg-white: #FFFFFF;       /* Background */
--bg-subtle: #F8F8F8;      /* Section backgrounds */
--purple: #7C3AED;         /* Accent (hover only) */
--purple-light: rgba(124, 58, 237, 0.1); /* Hover backgrounds */
```

### Typography
- Font: Inter (Google Fonts)
- Hero: 4rem (64px), weight 700
- Section titles: 2rem (32px), weight 600
- Body: 1rem (16px), weight 400
- Small: 0.85rem (14px), weight 400

### Spacing
- Section padding: 5rem (80px) vertical
- Container max-width: 1200px (homepage), 900px (about)
- Card padding: 2rem (32px)
- Grid gaps: 1.5rem - 2rem

---

## Wordings Changes Summary

### Removed "IA" / "AI" buzzwords:
| Before | After |
|--------|-------|
| "Investissement IA" | "L'agent qui gère votre portefeuille" |
| "agent IA" | "agent" or "l'agent" |
| "Agents IA sur-mesure" | "Agents sur-mesure" |
| "implémentation IA" | "automatisation via agents" |
| "notre IA explique" | "notre agent explique" |

### Updated Positioning:
| Before | After |
|--------|-------|
| "Solutions Entreprises" | **"Implémentation de Systèmes Agentiques"** |
| "Zéro cachette" | "Nos apprentissages partagés" |
| Generic B2B description | "On déploie les dernières solutions d'automatisation — souvent parmi les premiers en France" |

---

## Next Steps

1. **Review the mocks:**
   ```bash
   cd "/Users/jadethi-viet-lanhoang/Documents/Documents - MacBook Air (2)/GitHub/BubbleLaunch"
   npm start
   ```
   Then visit:
   - http://localhost:3001/homepage-mock-v4
   - http://localhost:3001/about-mock

2. **Feedback needed on:**
   - Is the "FOCUS ACTUEL / PARTAGE" badge system clear?
   - Does the About page have the right level of detail?
   - Should the 4 Values tiles link elsewhere?
   - Is the "Why Bubble" explanation clear and well-placed?

3. **Once approved:**
   - Apply changes to real `index.html`
   - Create new `/about` page
   - Update translations file
   - Test bilingual versions

---

## Files Created

```
/homepage-mock-v4.html        — Refined homepage
/about-mock.html              — New about page  
/docs/mock-v4-summary.md      — This document
/src/backend/routes/pages.routes.js  — Added routes
```

---

## Comparison with Previous Mocks

| Aspect | Mock V2 | Mock V4 (This) |
|--------|---------|----------------|
| Structure | New minimal | Based on live site |
| Cards | 2 cards (B2B/B2C) | 2 cards (same) |
| Chat input | Removed | **Kept** |
| Animations | Minimal | **Full** (fade, float, pulse, hover) |
| Purple | None | **On hover only** |
| Header | Minimal | Minimal (same) |
| Footer | Basic | **Enriched** |
| About page | None | **New** |
| "Why Bubble" | None | **In footer + /about** |

---

*Ready for your review!* 🎉
