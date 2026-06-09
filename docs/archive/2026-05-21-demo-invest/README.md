# 2026-05-21 — Archived: pricing-workflow-demo

These two files (`pricing-workflow-demo.js`, `pricing-workflow-demo.css`)
were created in early 2026 as part of a demo interactive product visualization
for an investment agent we were planning to ship. The product direction changed,
and the demo is no longer referenced from any active page.

Kept here as an example of an interactive workflow demo that worked well
(Jade msg 5269 — "archive on le garde juste en archive pour avoir un exemple de
demo qu'on avait réussi").

Originally lived at:
- `src/frontend/js/pricing-workflow-demo.js`
- `src/frontend/assets/styles/pricing-workflow-demo.css`

Still referenced from legacy pages under `archive/2024-2025/` (investors/pricing,
professionals/solutions-*), which are themselves archived. Removing the JS/CSS
from the live tree avoids confusion for future contributors who might wire it
into a new page by accident.

If you ever need to revive this UI:
1. Copy the files back to `src/frontend/js/` and `src/frontend/assets/styles/`
2. Inspect the markup contract by reading the JS — it expects specific data
   attributes on a container, manages a stepper, and renders scenario timelines
3. Adapt to the new product domain (it was originally hardcoded around an
   investment-agent workflow, with ~15-17 steps per scenario)
