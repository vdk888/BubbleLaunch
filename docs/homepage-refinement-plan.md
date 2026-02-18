# Homepage Refinement Plan — Targeted Updates Only

**Approach:** Keep all existing structure, animations, CSS. Only update content/wordings.

---

## SECTION 1: HERO

### Current → New

**Hero Title:**
```
Current: <span data-translate="hero.title">Bubble.</span>
New:     <span data-translate="hero.title">Bubble.</span>  (KEEP - already capitalized)
```

**Hero Tagline:**
```
Current: "Investissement IA : Transparent by design."
New:     "L'agent qui gère votre portefeuille pour vous."
         (Remove "IA", focus on agent + action)
```

**Hero Subtitle:**
```
Current: "Pionniers de l'implémentation IA en France..."
New:     "On construit l'outil qu'on voulait pour nous : un agent qui automatise vos investissements, avec transparence."
         ("implémentation IA" → "agent qui automatise")
```

**Chat Input Placeholder:**
```
Current: "Qu'est-ce que tu aimerais savoir sur Bubble ?"
New:     "Discutez avec l'agent Bubble..." 
         (Keep as is or slight tweak)
```

---

## SECTION 2: TRI-PATH SELECTOR (3 CARDS)

### Card 1: Retail (B2C) — Keep but Reframe

**Current:**
- Title: "Plateforme d'Investissement"
- Description: "L'agent IA qu'on utilise pour nos propres portefeuilles."

**New:**
- Badge: "PARTAGE" (add this)
- Title: "Pour les Investisseurs" 
- Description: "L'agent qu'on utilise pour nos propres portefeuilles. On vous aide à configurer le vôtre."
  (Remove "IA", add "partage" framing)

**Features:** Keep as is or simplify to:
- "Configuration personnalisée"
- "Automatisation complète"
- "Transparence totale"

### Card 2: Professional (B2B) — PRIORITIZE

**Current:**
- Title: "Solutions Entreprises"
- Description: "Automatisez vos processus avec nos Agents IA sur-mesure."

**New:**
- Badge: "FOCUS ACTUEL" (add this - visual priority)
- Title: "Implémentation de Systèmes Agentiques" 
  (Up-to-date wording per your request)
- Description: "CGP, sociétés de gestion, entreprises. On déploie les dernières solutions d'automatisation — souvent parmi les premiers en France."

**Features:**
- "Diagnostic rapide"
- "Agents sur-mesure"
- "Déploiement accéléré"

### Card 3: Build in Public — Make Clickable

**Current:**
- Title: "Build in Public"
- Description: "Nos doutes, nos victoires, nos chiffres. Zéro cachette."
  (Remove "Zéro cachette" - bullshit reference)

**New:**
- Title: "On Construit en Public"
- Description: "Nos apprentissages, nos pivots, nos décisions techniques — partagés en temps réel."

**Make tiles clickable:** Each of the 4 values links to relevant blog category

**Change from 3 features to 4 clickable values:**

| Tile | Links To |
|------|----------|
| 📚 **Éduquer** | Blog category: educational content |
| 🤖 **Automatiser** | Blog: technical deep-dives on automation |
| 👁️ **Transparence** | Blog: open metrics, "build in public" posts |
| 💜 **Bienveillance** | /mission page (new) or blog about values |

---

## SECTION 3: SUPERHERO HIGHLIGHT

**Current:**
```
"Les super-pouvoirs des hedge funds, maintenant dans votre poche"
```

**New Options:**
```
Option A: "L'automatisation qu'on déploie pour nous, à votre service"
Option B: "Un agent qui travaille pour vous, 24/7"
Option C: Keep as is (it's punchy)
```

---

## SECTION 4: BLOG PREVIEW

**Current subtitle:**
```
"Explorez nos analyses sur l'IA, l'investissement et la finance quantitative"
```

**New:**
```
"Découvrez nos analyses sur l'automatisation, l'investissement et la démystification de la finance"
```

---

## SECTION 5: APPROACH SECTION (4 Steps)

These already align well! Minor tweaks:

### Step 1: Automatiser
**Current:** "via des algorithmes simples et transparents qui montrent comment l'IA remplace désormais cette exécution manuelle"

**New:** "via des agents qui exécutent automatiquement vos stratégies, en toute transparence"

### Step 3: Partager
**Current:** "Parce que l'IA rend désormais l'expertise accessible à tous..."

**New:** "Parce que l'automatisation rend l'expertise accessible..."

### Step 4: Éduquer
**Current:** "Notre IA explique les concepts financiers simplement..."

**New:** "Notre agent explique les concepts financiers simplement..."
(Or keep "IA" here since it's functional, not buzzword)

---

## SECTION 6: WAITLIST

**Current subtitle:**
```
"Nous partageons avec vous cet agent IA que nous utilisons pour nos propres portefeuilles."
```

**New:**
```
"Nous partageons avec vous l'outil d'automatisation que nous utilisons pour nos propres investissements."
```

---

## NEW SECTION: "POURQUOI BUBBLE ?"

Add new small section between Approach and Waitlist, or as a footer element:

```
💭 Pourquoi "Bubble" ?

🫧 **Bubble** = Transparence (on éclate la bulle de la finance opaque)
💰 **Invest** = Investissement (notre cœur de métier historique)
🎯 **Double sens :** Investir dans les bulles (technologiques) + Investir en soi (formation, autonomie)
```

Placement options:
- A) Small expandable section above footer
- B) Tooltip/hover on logo
- C) Dedicated /about page linked from footer
- D) Subtle text in footer: "Bubble : éclater la bulle de la finance opaque"

---

## SECTION 7: FOOTER

**Check existing social links are present:**
- LinkedIn ✓
- Twitter/X ✓  
- YouTube ✓
- Instagram ✓
- Substack/Newsletter ✓

If missing, add them.

---

## CSS CHANGES (Minimal)

### Purple on Hover Only

Current: Purple might be used as default color
New: Keep purple for hover states only

```css
/* Add/update these styles */

/* Cards default: no purple border */
.dual-path-card {
  border: 1px solid rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

/* Cards hover: purple accent */
.dual-path-card:hover {
  border-color: #8B5CF6; /* or your purple */
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.1);
}

/* B2B Card (Focus Actuel) - subtle distinction */
.dual-path-card.professional-card {
  border: 1px solid rgba(0,0,0,0.15); /* slightly darker */
}

.dual-path-card.professional-card:hover {
  border-color: #8B5CF6;
}

/* Badge styling */
.path-badge {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  margin-bottom: 0.75rem;
  display: inline-block;
}

.path-badge.focus {
  background: #111;
  color: white;
}

.path-badge.partage {
  background: #f3f3f3;
  color: #666;
}
```

---

## TRANSLATIONS FILE UPDATES

Update `translations.js` for bilingual support:

```javascript
// HERO
dualPath.retail.badge: "PARTAGE",
dualPath.professional.badge: "FOCUS ACTUEL",

// BUILD IN PUBLIC TILES
tiles: {
  educate: "Éduquer",
  automate: "Automatiser", 
  transparency: "Transparence",
  benevolence: "Bienveillance"
}
```

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Content Updates (30 min)
- [ ] Update hero tagline/subtitle
- [ ] Update Tri-Path card wordings
- [ ] Update Approach section text
- [ ] Update Waitlist subtitle
- [ ] Add badges to cards

### Phase 2: Build in Public Tiles (1 hour)
- [ ] Redesign card 3 from list to 4 tiles
- [ ] Make tiles clickable with links
- [ ] Add hover effects (purple)

### Phase 3: "Why Bubble" (30 min)
- [ ] Create expandable section or footer text
- [ ] Add explanation content

### Phase 4: Polish (30 min)
- [ ] Update CSS for purple-on-hover
- [ ] Verify all animations still work
- [ ] Test bilingual versions
- [ ] Check mobile responsiveness

**Total estimated time: 2-3 hours**

---

## MOCK PAGES TO CREATE

Instead of full mocks, create **side-by-side comparison** pages:

1. `homepage-before-after.html` — Split screen showing current vs proposed
2. OR update the real pages with comments marking changes:
   ```html
   <!-- CHANGED: Was "Investissement IA", now "L'agent qui..." -->
   ```

Given you want to reuse existing code, I recommend:
- Make changes directly to `index.html` 
- Keep backup of original
- Test thoroughly
- Iterate based on your feedback

---

## QUESTIONS

1. **"Why Bubble" placement:** Footer subtle text, expandable section, or separate /about page?

2. **Build in Public tiles:** Should clicking "Éduquer" go to:
   - Blog filtered by "education" tag?
   - /blog directly (for now, until content organized)?
   - New /learn page?

3. **Purple usage:** Do you want the hero section to stay white, or have subtle purple gradient on load that fades to white?

4. **B2B card priority:** Should it be physically first (leftmost) or just have visual priority (badge + border)?

Ready to implement once you confirm these details!
