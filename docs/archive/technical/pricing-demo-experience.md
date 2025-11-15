# Bubble Pricing Demo Experience Plan

> **Historical Note (2025-11-14):** ✅ **IMPLEMENTATION COMPLETE**
>
> This plan has been fully implemented as of November 14, 2025. All sections (1-7) have been realized in production code:
> - **Dual-Path Selector:** `src/frontend/js/dual-path-selector.js` (homepage architecture)
> - **Knowledge Overlay:** `src/frontend/js/knowledge-overlay.js` + `knowledge-overlay.css`
> - **UI Integration:** Both `/pricing.html` and `/en/pricing.html`
> - **Internationalization:** 15 translation keys added to `translations.js`
>
> See `docs/SESSION_SUMMARY_2025-11-14.md` for complete implementation details and remaining work (Phase 3-7).
>
> **Status:** Phases 1-2 production-ready. Phase 3 (scenario engine refactor) pending.

---

## 1. Objectives
- Turn the pricing page into an *interactive proof* instead of a static table.
- Match each visitor’s skill level with the most convincing storyline.
- Keep the current Japan workflow untouched and promote it as the “intermediate” reference demo.
- Create a seamless entry path starting from the homepage hero all the way to the in-page chat overlay.

---

## 2. Homepage Hero Entry
- **CTA placement:** keep `Join Us` as the primary conversion, and add a secondary button (`See how it works`) right beside/under it. On mobile, the demo CTA can sit above the fold, stacked above the waitlist CTA.
- **CTA behavior:** clicking the new button opens the knowledge question overlay (see §3) directly, without scrolling down to pricing.
- **Copy suggestions:**
  - Headline helper: “Prefer to see how Bubble works first?”
  - Button label: “Watch a tailored demo”.
- **Return visitors:** if `sessionStorage.demoExperience` exists, the button label switches to “Replay your demo” and deep-links to the relevant scenario immediately.

---

## 3. Knowledge Question Overlay
- **Trigger order:** knowledge overlay launches first (either from the hero CTA or from the existing “Replay demo” button in the pricing section). Once a choice is made, it slides away and reveals the chat overlay underneath, which then auto-plays the corresponding scenario.
- **Question copy:** “What’s your investment knowledge?” with the short helper “Choose the experience that matches you.”
- **Options (chips with aria-pressed):**
  - `Beginner` → Macro Defense / Hedge scenario (*new*).
  - `Intermediate` → Existing Japan Momentum workflow (current implementation).
  - `Expert` → Semiconductors Sortino or Opportunistic Drawdown scenario (*new*).
- **Fallback:** a text link “Not sure yet? Show me anything” that defaults to Intermediate.
- **Persistence:** store `{ level, scenarioId }` in `sessionStorage`; use it to prevent re-asking until the user taps “Change demo” inside the overlay header.

---

## 4. Scenario Roster & Content Pillars
| Knowledge level | Scenario | Goal | Key assets |
| --- | --- | --- | --- |
| Beginner | **Macro Defense – Election Hedge** | Build trust by showing Bubble’s coaching tone and risk management. | Risk alert banner, simple facts (VIX, gold inflows), before/after allocation donut, execution timeline. |
| Intermediate | **Japan Momentum – Current Demo** | Showcase research depth, backtests, and allocation guidance. | (Already built) – keep as-is but wrap in the scenario framework. |
| Expert | **Semiconductors Sortino Insight** | Highlight advanced analytics and education (ASML explainer + Sortino). | Table with caps/weights, supply-chain diagram, Sharpe vs Sortino toggle, crisis playback mini-chart. |
| Optional 4th | **Proactive Green Energy Alert** | Demonstrate Bubble’s notifications + sustainability expertise. | Push notification UI, renewable table, low-vol strategy card, before/after portfolio bars. |

---

## 5. Technical Implementation Outline
1. **Scenario config:**  
   - Create `src/frontend/js/demo-scenarios.js` exporting a map of scenario IDs → message arrays, enriched card configs, language strings.  
   - Move current translation keys (`workflow.message…`) into the `intermediate` scenario entry so nothing changes visually.
2. **Overlay refactor:**  
   - Add a `knowledge-overlay` component in `pricing.html`. It contains the question, chips, and skip link.  
   - When an answer is selected, hide the knowledge overlay, ensure the pricing chat overlay is visible, then call `runDemo(selectedScenario)`.
3. **Hero integration:**  
   - Insert the new CTA button next to `Join Us`.  
   - On click, call the same function used by the pricing “Replay demo” button so the experience is consistent regardless of entry point.
4. **State machine:**  
   - `pricing-workflow-demo.js` becomes scenario-agnostic: it receives `{ messages, cards, settings }` from the scenario config instead of fetching translation keys individually.  
   - Provide a scenario switcher inside the chat header (dropdown or pill group) titled “Demo mode:” enabling users to revisit other flows without reloading.

---

## 6. Analytics, Accessibility, and Localization
- **Analytics:** fire a `demoScenarioSelected` event with `{ knowledgeLevel, scenarioId, entryPoint }` (hero vs pricing). Track completion to learn which flows convert.
- **Accessibility:**  
  - Knowledge overlay buttons use `role="button"` + `aria-pressed`; focus is trapped while the overlay is open.  
  - Respect `prefers-reduced-motion` by shortening typing animations by 50% or replacing them with instant text.
- **Localization:** duplicate question copy, button labels, and scenario names in `translations.js`. The scenario config should hold both FR/EN text fragments so we can roll out simultaneously.

---

## 7. Rollout Steps
1. Build hero CTA + knowledge overlay skeleton (no scenario switch yet).  
2. Refactor current demo into the new scenario engine, verifying the Intermediate flow matches today’s behavior pixel-for-pixel.  
3. Implement Beginner and Expert scenarios (static data first, real metrics later).  
4. Add analytics + accessibility polish, then QA on mobile and desktop.  
5. Monitor selection metrics; iterate on copy or mapping if most users pick the wrong level.

---

## 8. Open Questions
- Should the knowledge overlay also appear automatically when users scroll into the pricing section (for those who ignore the hero CTA)?  
- Do we want to prefetch scenario assets (images, diagrams) lazily after the knowledge choice to keep initial load fast?  
- Once multiple demos exist, do we expose a “See all demos” link somewhere else (docs, blog) for cross-navigation?

This document consolidates the decisions from our discussion and sets the groundwork for implementation.
