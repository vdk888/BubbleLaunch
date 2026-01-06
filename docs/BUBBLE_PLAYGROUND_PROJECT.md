# Bubble Playground (Education) Project

## Project Overview

**Objective**: Transform financial education into a fun, engaging, and accessible experience. Replace the legacy `/investors/portfolio-simulator` with a modern, gamified learning platform.

**Core Philosophy**:
- Make learning feel like play, not school
- Use AI to empower, not overwhelm
- Session-based gamification (no accounts required)
- Integrate YouTube videos and quizzes for engagement

---

## Project Status

### Completed Tasks

| Task | Status | Date |
|------|--------|------|
| Explore and understand BubbleLaunch codebase | ✅ Done | 2026-01-05 |
| Review existing education pages (Hub, Arena, Simulator) | ✅ Done | 2026-01-05 |
| Rename "Éducation" → "Bubble Playground" (nav, footer, hub, SEO) | ✅ Done | 2026-01-05 |
| Update bot names with animal mascots (translations) | ✅ Done | 2026-01-05 |
| Add SVG animal icons to Arena bot cards (FR) | ✅ Done | 2026-01-05 |
| Add SVG animal icons to Hub bot avatars (FR) | ✅ Done | 2026-01-05 |
| Update English Hub page (SEO, icons, animal names) | ✅ Done | 2026-01-05 |
| Update English Arena page (bot cards, leaderboard) | ✅ Done | 2026-01-05 |
| Create project documentation (BUBBLE_PLAYGROUND_PROJECT.md) | ✅ Done | 2026-01-05 |
| Update CLAUDE.md with Bubble Playground section | ✅ Done | 2026-01-05 |
| Update strategy chips with animal + strategy names | ✅ Done | 2026-01-05 |
| Fix bot card click to highlight in chart | ✅ Done | 2026-01-05 |
| Make Play button prominent with pulse animation | ✅ Done | 2026-01-05 |
| Add dynamic vignettes and proactive chatbot | ✅ Done | 2026-01-05 |
| Simulator: Add mobile-first chatbot interface | ✅ Done | 2026-01-06 |
| Add YouTube video references to Hub | ✅ Done | 2026-01-06 |
| Add CTA hooks throughout pages (Arena, Simulator) | ✅ Done | 2026-01-06 |

### In Progress

| Task | Status | Notes |
|------|--------|-------|
| (None currently) | - | - |

### Pending Tasks

| Task | Priority | Notes |
|------|----------|-------|
| Integrate quiz elements from Notion | Medium | 4 Notion pages provided |
| Phase 3: Replace legacy portfolio-simulator | High | Route redirect |

---

## Architecture

### Page Structure

```
/investors/education/           → Bubble Playground Hub
/investors/education/arena      → AI Trading Arena
/investors/education/simulator  → Strategy Simulator
/en/investors/education/*       → English mirrors
```

### Bot Mascots

| Animal (FR) | Animal (EN) | Strategy | Color | Icon |
|-------------|-------------|----------|-------|------|
| Ours | Bear | Equal Weight | #6B7280 | 🐻 |
| Renard | Fox | Risk Parity | #667eea | 🦊 |
| Faucon | Hawk | Momentum | #F97316 | 🦅 |
| Hérisson | Hedgehog | Defensive | #10B981 | 🦔 |

### Key Files

- **Hub**: `src/frontend/pages/investors/education.html`
- **Arena**: `src/frontend/pages/investors/education/arena.html`
- **Simulator**: `src/frontend/pages/investors/education/simulator.html`
- **Styles**: `src/frontend/assets/styles/education.css`
- **Translations**: `src/frontend/i18n/translations.js`
- **Arena JS**: `src/frontend/js/arena.js`
- **Routes**: `src/backend/routes/pages.routes.js`

---

## Design Decisions

### Naming
- Section: "Bubble Playground" (not "Education") - feels fun, not patronizing
- Bots: Animal mascots - memorable and personality-driven

### UX Principles
1. **Mobile-first simulator**: Chat-driven on mobile, split view on desktop
2. **Session-based gamification**: Achievements persist only for session
3. **Proactive engagement**: Chatbot suggests actions, vignettes appear automatically
4. **Quiz integration**: Test knowledge without feeling like a test

### Visual Style
- Glassmorphism cards
- Simple SVG animal icons (line style)
- Violet accent (#667eea)
- Pill-shaped buttons

---

## Quiz Integration (Notion Pages)

### Available Quiz Pages
1. **00 - Débutant**: Comprendre les Placements (Actions/Obligations)
2. **01 - Débutant**: Placement Sécurisé - Zéro Risque
3. **02 - Débutant**: Investir dans les ETF Actions
4. **03 - Débutant**: Composer Votre Stratégie Risque/Rendement

### Integration Plan
- Fetch quiz questions from Notion API
- Display as interactive cards within Arena/Simulator
- Session-based progress tracking
- Unlockable after completing certain actions

---

## YouTube Video Integration

### Plan
- Add "Learn More" video section to Hub
- Embed relevant Bubble channel videos
- Curated external educational content
- Video suggestions in chat responses

---

## Next Steps

1. **Immediate**: Complete English page updates
2. **Short-term**: Arena Play button enhancement
3. **Medium-term**: Mobile-first simulator redesign
4. **Long-term**: Quiz and video integration

---

## Development Guidelines

### Before Committing
1. Test changes in both FR and EN
2. Check mobile responsiveness
3. Verify translations work correctly
4. Run visual regression on key pages

### Testing URLs
- Hub: http://localhost:3000/investors/education
- Arena: http://localhost:3000/investors/education/arena
- Simulator: http://localhost:3000/investors/education/simulator
- EN Hub: http://localhost:3000/en/investors/education

---

*Last Updated: 2026-01-05 (English pages sync complete)*
