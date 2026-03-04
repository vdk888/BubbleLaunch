# Homepage Mock V2 — Design Rationale

**Status:** Mock ready for review  
**Files:** 
- `/homepage-mock-v2.html` (French)
- `/homepage-mock-v2-en.html` (English)
- `/src/backend/routes/pages.routes.js` (route added)

**View at:** 
- http://localhost:3001/homepage-mock-v2
- http://localhost:3001/homepage-mock-v2-en (English version)

---

## Design Principles

### 1. Minimalist & Purified
- **Pure white background** (`#FFFFFF`) — no gradients
- **Clean typography** — Inter font family, careful hierarchy
- **Generous whitespace** — let content breathe
- **Subtle borders** — `rgba(0,0,0,0.1)` for separation
- **High contrast** — black text on white, no frills

### 2. OpenAI-Inspired Aesthetic
- Single-column, centered layouts
- Clear visual hierarchy
- Minimal decorative elements
- Focus on content, not chrome
- Subtle hover states

### 3. What Was Simplified

| Current Website | Mock V2 |
|-----------------|---------|
| Gradient hero background | Pure white |
| Multiple hero CTAs + chat input | Two clean buttons |
| Tri-path selector (3 cards) | Dual path (2 cards) |
| Complex "Build in Public" section | Simple 4-item grid |
| Multiple sections (superpower, blog preview, etc.) | 5 essential sections only |
| Purple accent colors | Black, white, grays only |

---

## Structure

### 1. Header
- Logo + simple nav
- Language switcher
- Clean border separator

### 2. Hero
- **Kept:** `bubble.` title at 3.5rem (as requested)
- **Kept:** Logo + wordmark lockup
- **Simplified:** Single subtitle line
- **Two CTAs:**
  - Primary: "Solutions pour professionnels" (B2B focus)
  - Secondary: "Configurer votre agent (B2C)" (clearly labeled as sharing/helping)

### 3. Path Selector (Dual Path)
**B2B Card (Primary):**
- Badge: "Focus actuel"
- Black border to indicate primary
- Clear value proposition
- Features listed with em-dashes
- Primary CTA button

**B2C Card (Secondary):**
- Badge: "Partage" (indicates it's about helping/sharing)
- No special border
- Honest framing: "L'outil qu'on utilise... on vous aide à configurer"
- Secondary CTA

### 4. Manifesto
- Single quote (from Creative Hub positioning)
- Centered, large text
- Attribution to founders
- No visual distractions

### 5. Build in Public
- **Simplified:** Just 4 items (Blog, Newsletter, YouTube, Roadmap)
- Each as a clean card
- Links to actual pages
- No complex embeds or previews

### 6. Footer
- Minimal
- Logo + tagline
- Essential links only

---

## Content Strategy

### B2B First, B2C Second

**Hero CTAs:**
1. Primary button → Professionals
2. Secondary button → Investors (labeled as "Configurer votre agent")

**Path Cards:**
- B2B gets visual priority (black border, "Focus actuel" badge)
- B2C framed as "sharing what we built" rather than a product pitch

### Messaging Alignment with Creative Hub

| Creative Hub | Mock V2 Implementation |
|--------------|------------------------|
| "L'automatisation qu'on déploie pour nous, à votre service" | Hero subtitle |
| "On construit en public. Zéro bullshit." | Hero subtitle continuation |
| "Focus actuel" on B2B | Badge on B2B card |
| Benevolence quote | Manifesto section |
| Build in public as blog/content | Simplified to 4 links |

---

## Technical Notes

### CSS Variables
```css
--text-primary: #111111;
--text-secondary: #666666;
--text-muted: #999999;
--border-light: rgba(0, 0, 0, 0.1);
--bg-white: #FFFFFF;
--bg-subtle: #FAFAFA;
```

### Responsive Behavior
- Hero title scales: `2.5rem` on mobile, `3.5rem` desktop
- Path cards stack on mobile
- Navigation hidden on mobile (hamburger to be added if needed)
- Footer stacks on mobile

### Accessibility
- High contrast text
- Clear button states
- Semantic HTML
- Alt text on logo

---

## Next Steps

1. **Review the mock:** Visit http://localhost:3001/homepage-mock-v2
2. **Feedback needed:**
   - Is the B2B/B2C balance right?
   - Does the "Partage" framing work for B2C?
   - Is it too minimal? What's missing?
   - Should we add a contact/waitlist form somewhere?
3. **Iterate:** Make changes to mock files before implementing on real pages

---

## Comparison with Previous Mock

| Aspect | Mock V1 (Feb 12) | Mock V2 (This) |
|--------|------------------|----------------|
| Background | Gradient gray | Pure white |
| Hero | Chat input form | Clean CTAs only |
| Paths | Complex features | Simplified lists |
| Build in Public | Embedded previews | Simple links |
| B2B priority | Equal | Primary |
| Overall feel | Feature-rich | Minimalist |

---

*Document created: February 2026*  
*Next review: After user feedback on mock*
