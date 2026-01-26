# Accessibility Remediation Guide - Priority Implementation

**Estimated Remediation Time:** 15-20 hours
**Risk Level:** Medium (design changes required)
**Dependencies:** None

---

## Quick Reference: Critical Failures

| Issue | WCAG Criterion | Impact | Effort |
|-------|-----------------|--------|--------|
| Primary color contrast | 1.4.3 | All #6666ff text/borders | 2h |
| Missing focus indicators | 2.4.7 | Keyboard users blind | 4h |
| Form labels missing | 3.3.2 | Screen reader users lost | 3h |
| Modal focus trap | 2.4.3 | Keyboard users stuck | 2h |
| ARIA labels missing | 4.1.2 | Screen readers confused | 2h |

---

## Fix #1: Primary Color Contrast (CRITICAL)

### Current Problem
```
#6666ff (Bubble primary) on #ffffff (white)
Contrast ratio: 4.28:1
Required: 4.5:1 (WCAG AA)
Status: FAILS by 0.22:1
```

### Solution: Darken Color
```css
/* FILE: src/frontend/assets/styles/styles.css */
/* LINE: 54 (in :root section) */

/* BEFORE: */
--bubble-primary: #6666ff;
--bubble-primary-rgb: 102, 102, 255;
--bubble-primary-hover: #5555ee;

/* AFTER: */
--bubble-primary: #5555dd;
--bubble-primary-rgb: 85, 85, 221;
--bubble-primary-hover: #4444cc;
```

### Verification
```
#5555dd on #ffffff = 5.47:1 ✓ PASS (WCAG AA)
#4444cc on #ffffff = 7.22:1 ✓ PASS (WCAG AAA)
```

### Where to Update
1. `src/frontend/assets/styles/styles.css` - Line 54
2. `src/frontend/pages/design-mock.html` - Line 18
3. Any hardcoded color references

### Testing
```bash
# After change, verify with contrast checker:
# https://webaim.org/resources/contrastchecker/
# Test: #5555dd on #ffffff
```

---

## Fix #2: Focus Indicators (CRITICAL)

### Current Problem
```css
/* File: styles.css, Line 6360 */
@media (prefers-reduced-motion: no-preference) {
  :focus {
    outline: 2px solid var(--primary);  /* #333333 */
  }

  :focus:not(:focus-visible) {
    outline: none;  /* BREAKS for keyboard */
  }
}
/* Users with prefers-reduced-motion: reduce get NO focus! */
```

### Solution 1: Move Focus Outside Motion Query

**File:** `src/frontend/assets/styles/styles.css`
**Insert after Line 6369:**

```css
/* WCAG 2.4.7 Focus Visible - ALWAYS visible, motion independent */
:focus-visible {
  outline: 2px solid var(--bubble-primary);
  outline-offset: 2px;
  transition: outline-offset 0.2s ease;
}

:focus:not(:focus-visible) {
  outline: none;  /* Hide focus for mouse users only */
}

/* At-risk element: prevent focus disappearing on dark backgrounds */
@media (prefers-reduced-motion: reduce) {
  :focus-visible {
    transition: none;  /* Remove transition, keep outline */
  }
}
```

### Solution 2: Add Card-Specific Focus

**File:** `src/frontend/assets/styles/styles.css`
**After Line 3236 (pricing-card:hover):**

```css
/* Pricing card focus - light backgrounds */
.pricing-card:focus-visible {
  outline: 3px solid var(--bubble-primary);
  outline-offset: 2px;
  box-shadow:
    0 24px 60px rgba(16, 38, 95, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    0 0 0 3px var(--bubble-primary-08);
}

/* Pricing card focus - DARK backgrounds */
.pricing-card.dark:focus-visible {
  outline: 3px solid #ffffff;
  outline-offset: 2px;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
```

### Solution 3: Add Button Focus States

**File:** `src/frontend/assets/styles/styles.css`
**After Line 3354 (.plan-cta-primary:hover):**

```css
/* CTA Button Focus - all variants */
.plan-cta:focus-visible {
  outline: 2px solid var(--bubble-primary);
  outline-offset: 3px;
}

.plan-cta-primary:focus-visible {
  outline: 2px solid #ffffff;  /* White outline on blue button */
}

.plan-cta:focus-visible,
.plan-cta-primary:focus-visible {
  transform: translateY(-3px);  /* Lift effect on focus */
}
```

### Testing Keyboard Focus
```bash
# Test in browser:
1. Open http://localhost:3000/pricing
2. Press Tab key repeatedly
3. Observe: Every interactive element shows visible outline
4. Dark card should show WHITE outline
5. Light cards should show PRIMARY color outline
```

---

## Fix #3: Form Labels (CRITICAL)

### Current Problem
```html
<!-- INACCESSIBLE: No label association -->
<input class="form-group-input" type="email" placeholder="your@email.com" />
```

### Solution: Add Label Elements

**File:** All form pages
**Example for pricing page:** `src/frontend/pages/pricing.html`

**Before (Line ~370):**
```html
<div class="plan-cta-group">
  <a href="/#waitlist" class="plan-cta">Obtenir un accès anticipé</a>
</div>
```

**After:**
```html
<div class="plan-cta-group">
  <!-- Email subscription form (add if not exists) -->
  <form class="email-signup">
    <div class="form-group">
      <label for="email-pricing" class="form-label">
        Email Address <span class="required" aria-label="required">*</span>
      </label>
      <input
        id="email-pricing"
        type="email"
        class="form-group-input"
        placeholder="your@email.com"
        required
        aria-required="true"
        aria-describedby="email-help email-error"
      />
      <span id="email-help" class="form-help-text">We'll never share your email.</span>
      <span id="email-error" class="error-message" role="alert" aria-live="polite"></span>
    </div>
    <button type="submit" class="plan-cta plan-cta-primary">
      Obtenir un accès anticipé
    </button>
  </form>
</div>
```

### CSS for Form Elements

**File:** `src/frontend/assets/styles/styles.css`
**Add at end of file:**

```css
/* Form Styling - Accessibility */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.form-label {
  font-weight: 600;
  font-size: 0.95rem;
  color: #0f172a;
  display: block;
}

.required {
  color: #e74c3c;
  margin-left: 0.25rem;
  font-weight: 700;
}

.form-group-input {
  padding: 0.85rem 1.2rem;
  border: 2px solid #d4d7dc;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.form-group-input:focus {
  outline: none;
  border-color: var(--bubble-primary);
  box-shadow: 0 0 0 3px var(--bubble-primary-08);
}

.form-group-input[aria-invalid="true"] {
  border-color: #e74c3c;
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
}

.form-help-text {
  font-size: 0.85rem;
  color: #616c89;
  font-weight: 500;
}

.error-message {
  font-size: 0.85rem;
  color: #e74c3c;
  font-weight: 600;
  display: none;
}

.error-message.visible {
  display: block;
}

/* Mobile form responsiveness */
@media (max-width: 480px) {
  .form-group-input {
    font-size: 16px;  /* Prevents iOS zoom */
  }
}
```

### JavaScript for Form Validation

**File:** `src/frontend/js/form-validation.js` (new file)

```javascript
/**
 * Form Validation with Accessibility
 */

class FormValidator {
  constructor(formSelector) {
    this.form = document.querySelector(formSelector);
    if (!this.form) return;

    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.setupFieldValidation();
  }

  setupFieldValidation() {
    const inputs = this.form.querySelectorAll('input[required]');
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => this.clearError(input));
    });
  }

  validateField(input) {
    const group = input.closest('.form-group');
    const errorEl = group.querySelector('.error-message');
    const isValid = input.checkValidity();

    if (!isValid) {
      this.showError(input, errorEl);
    } else {
      this.clearError(input);
    }
  }

  showError(input, errorEl) {
    input.setAttribute('aria-invalid', 'true');

    let message = '';
    if (input.type === 'email' && !input.validity.valid) {
      message = 'Please enter a valid email address.';
    } else if (input.value === '') {
      message = 'This field is required.';
    }

    if (errorEl && message) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    }
  }

  clearError(input) {
    const group = input.closest('.form-group');
    const errorEl = group.querySelector('.error-message');

    input.setAttribute('aria-invalid', 'false');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
  }

  handleSubmit(e) {
    const isValid = this.form.checkValidity();

    if (!isValid) {
      e.preventDefault();

      // Focus first invalid field
      const firstInvalid = this.form.querySelector('input:invalid');
      if (firstInvalid) {
        firstInvalid.focus();
      }
    }
  }
}

// Initialize on all forms
document.addEventListener('DOMContentLoaded', () => {
  new FormValidator('.email-signup');
});
```

### Testing Forms
```bash
1. Open http://localhost:3000/pricing
2. Tab to email input
3. Observe: Label clearly visible above input
4. Type invalid email (e.g., "test")
5. Tab away
6. Observe: Error message appears with red border
7. Screen reader test: Should announce "Email Address, required" on focus
```

---

## Fix #4: Modal Focus Trap (CRITICAL)

### Current Problem
```javascript
// Users can Tab out of modal into background page
// No focus cycling at modal boundaries
```

### Solution: Focus Trap Implementation

**File:** `src/frontend/js/focus-trap.js` (new file)

```javascript
/**
 * Focus Trap for Modal Dialogs
 * Ensures Tab/Shift+Tab stay within modal boundaries
 */

class FocusTrap {
  constructor(modalElement) {
    this.modal = modalElement;
    this.previouslyFocused = null;
  }

  activate() {
    // Store currently focused element for restoration later
    this.previouslyFocused = document.activeElement;

    // Find all focusable elements in modal
    this.focusableElements = this.modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (this.focusableElements.length === 0) {
      console.warn('FocusTrap: No focusable elements found in modal');
      return;
    }

    // Focus first element
    this.focusableElements[0].focus();

    // Add event listener
    this.modal.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  deactivate() {
    this.modal.removeEventListener('keydown', this.handleKeyDown.bind(this));

    // Restore previous focus
    if (this.previouslyFocused) {
      this.previouslyFocused.focus();
    }
  }

  handleKeyDown(e) {
    if (e.key !== 'Tab') return;
    if (e.code !== 'Tab') return;  // Handle both 'Tab' and 'Tab' code

    const firstElement = this.focusableElements[0];
    const lastElement = this.focusableElements[this.focusableElements.length - 1];
    const isMovingForward = !e.shiftKey;

    if (isMovingForward && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    } else if (!isMovingForward && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    }
  }
}

// Usage with Workflow Demo Modal
class WorkflowDemo {
  constructor() {
    this.overlay = document.getElementById('workflow-demo-overlay');
    this.closeBtn = document.getElementById('workflow-demo-close');
    this.focusTrap = null;
  }

  open() {
    this.overlay.classList.remove('hidden');
    this.focusTrap = new FocusTrap(this.overlay);
    this.focusTrap.activate();

    // Handle Escape key
    document.addEventListener('keydown', this.handleEscapeKey.bind(this));
  }

  close() {
    this.overlay.classList.add('hidden');
    if (this.focusTrap) {
      this.focusTrap.deactivate();
    }
    document.removeEventListener('keydown', this.handleEscapeKey.bind(this));
  }

  handleEscapeKey(e) {
    if (e.key === 'Escape') {
      this.close();
    }
  }
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const demoBtn = document.querySelector('[data-demo-trigger]');
  if (demoBtn) {
    const demo = new WorkflowDemo();
    demoBtn.addEventListener('click', () => demo.open());
    document.getElementById('workflow-demo-close').addEventListener('click', () => demo.close());
  }
});
```

**HTML Update:**
```html
<!-- File: src/frontend/pages/pricing.html -->
<!-- Add to close button: -->
<button class="workflow-demo-close" id="workflow-demo-close"
        aria-label="Close demo">
  <svg>...</svg>
</button>

<!-- Add to modal: -->
<div id="workflow-demo-overlay" class="workflow-demo-overlay hidden"
     role="dialog" aria-modal="true" aria-labelledby="demo-title">
  <h1 id="demo-title" class="sr-only">Bubble AI Agent Workflow Demo</h1>
```

### Testing Modal Focus
```bash
1. Open http://localhost:3000/pricing
2. Click to open workflow demo modal
3. Press Tab repeatedly
4. Verify: Focus cycles within modal only
5. Press Shift+Tab at first element
6. Verify: Focus jumps to last element (reverse cycle)
7. Press Escape
8. Verify: Modal closes, focus returns to trigger button
```

---

## Fix #5: ARIA Labels (CRITICAL)

### Problem 1: Icons Missing aria-hidden

**Current:**
```html
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
  <path d="M18 6L6 18M6 6L18 18" />
</svg>
```

**Fixed:**
```html
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
     aria-hidden="true">
  <path d="M18 6L6 18M6 6L18 18" />
</svg>
```

### Problem 2: Dropdown aria-expanded

**File:** `src/frontend/assets/styles/styles.css`
**Search for nav dropdown code**

**Current:**
```html
<button class="nav-dropdown-toggle">Solutions</button>
<div class="nav-dropdown-menu">
  <a href="/professionals/solutions-companies">Entreprises</a>
</div>
```

**Fixed:**
```html
<button class="nav-dropdown-toggle"
        aria-expanded="false"
        aria-controls="solutions-menu">
  Solutions
</button>
<div id="solutions-menu" class="nav-dropdown-menu">
  <a href="/professionals/solutions-companies">Entreprises</a>
</div>
```

**JavaScript:**
```javascript
const toggleBtn = document.querySelector('.nav-dropdown-toggle');
const menu = document.getElementById('solutions-menu');

toggleBtn.addEventListener('click', () => {
  const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
  toggleBtn.setAttribute('aria-expanded', !isExpanded);
  menu.hidden = isExpanded;
});
```

### Problem 3: Dialog aria-describedby

**File:** `src/frontend/pages/pricing.html` (line 72)

**Current:**
```html
<div id="knowledge-overlay" class="knowledge-overlay hidden"
     role="dialog" aria-modal="true" aria-labelledby="knowledge-title">
  <h2 id="knowledge-title">Quel est votre niveau d'expérience?</h2>
  <p class="knowledge-subtitle">Choisissez l'expérience qui vous convient.</p>
</div>
```

**Fixed:**
```html
<div id="knowledge-overlay" class="knowledge-overlay hidden"
     role="dialog" aria-modal="true"
     aria-labelledby="knowledge-title"
     aria-describedby="knowledge-subtitle">
  <h2 id="knowledge-title">Quel est votre niveau d'expérience?</h2>
  <p id="knowledge-subtitle" class="knowledge-subtitle">
    Choisissez l'expérience qui vous convient.
  </p>
</div>
```

### Testing ARIA

```bash
# Use WAVE browser extension or:
# https://www.w3.org/WAI/test-evaluate/
1. Install axe DevTools (Chrome extension)
2. Open http://localhost:3000/pricing
3. Run axe scan
4. Verify: No ARIA violations
5. Check: All icons have aria-hidden="true"
6. Check: All dropdowns have aria-expanded
7. Check: All dialogs have aria-labelledby + aria-describedby
```

---

## Implementation Checklist

### Phase 1: Critical (Week 1)
- [ ] Update primary color #6666ff → #5555dd
- [ ] Add :focus-visible rules to all interactive elements
- [ ] Move focus styles outside @media prefers-reduced-motion query
- [ ] Add form labels with `<label>` elements
- [ ] Test with keyboard navigation
- [ ] Test with screen reader (NVDA/JAWS)

### Phase 2: High Priority (Week 2)
- [ ] Implement focus trap in modals
- [ ] Add ARIA labels to all icons (aria-hidden or aria-label)
- [ ] Add aria-expanded to dropdown menus
- [ ] Add aria-describedby to dialog subtitles
- [ ] Implement form validation with error messages
- [ ] Test with color contrast checker

### Phase 3: Medium Priority (Week 3)
- [ ] Remove italic styling from taglines (use font-weight instead)
- [ ] Add dark card-specific focus styles
- [ ] Implement keyboard handler for tooltip terms
- [ ] Add aria-live="polite" to dynamic content
- [ ] Test responsive design at all breakpoints

### Phase 4: Testing & Verification (Week 4)
- [ ] Full accessibility re-audit with Lighthouse
- [ ] Manual WCAG AA checklist verification
- [ ] Screen reader testing (NVDA on Windows, VoiceOver on Mac)
- [ ] Keyboard-only navigation test
- [ ] Color contrast verification
- [ ] Document all fixes in ACCESSIBILITY_AUDIT.md

---

## Verification Script

Create `test-accessibility.sh`:

```bash
#!/bin/bash

echo "Starting Accessibility Tests..."
echo "================================"

# Test 1: Color Contrast
echo "[1] Color Contrast Tests"
python3 -c "
from PIL import Image
import colorsys

def hex_to_rgb(hex_color):
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def contrast_ratio(fg, bg):
    def luminance(r, g, b):
        r, g, b = [x/255.0 for x in [r, g, b]]
        rgb = [x/12.92 if x <= 0.03928 else ((x+0.055)/1.055)**2.4 for x in [r, g, b]]
        return 0.2126*rgb[0] + 0.7152*rgb[1] + 0.0722*rgb[2]

    l1 = luminance(*hex_to_rgb(fg))
    l2 = luminance(*hex_to_rgb(bg))
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

tests = [
    ('Primary on White', '#5555dd', '#ffffff'),
    ('White on Dark Card', '#ffffff', '#1e1e28'),
]

for name, fg, bg in tests:
    ratio = contrast_ratio(fg, bg)
    status = 'PASS' if ratio >= 4.5 else 'FAIL'
    print(f'  {name}: {ratio:.2f}:1 [{status}]')
"

# Test 2: Focus Visible
echo ""
echo "[2] Focus Visible Rules"
echo "  Checking: :focus-visible exists in stylesheet..."
grep -q ":focus-visible" src/frontend/assets/styles/styles.css && echo "  ✓ FOUND" || echo "  ✗ MISSING"

# Test 3: Form Labels
echo ""
echo "[3] Form Labels"
echo "  Checking: <label> elements in forms..."
grep -c "<label" src/frontend/pages/pricing.html

# Test 4: ARIA Attributes
echo ""
echo "[4] ARIA Labels"
echo "  Icons with aria-hidden: $(grep -c 'aria-hidden' src/frontend/pages/pricing.html)"
echo "  Buttons with aria-label: $(grep -c 'aria-label' src/frontend/pages/pricing.html)"
echo "  Dialogs with aria-modal: $(grep -c 'aria-modal' src/frontend/pages/pricing.html)"

echo ""
echo "================================"
echo "Tests Complete"
```

Run with:
```bash
chmod +x test-accessibility.sh
./test-accessibility.sh
```

---

## Resources

- **WCAG 2.1 Specification:** https://www.w3.org/WAI/WCAG21/quickref/
- **Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **ARIA Authoring Practices:** https://www.w3.org/WAI/ARIA/apg/
- **Focus Management:** https://inclusive-components.design/
- **Testing Tools:**
  - axe DevTools (Chrome extension)
  - WAVE (browser extension)
  - NVDA Screen Reader (free)
  - Lighthouse (Chrome DevTools)

---

## Questions?

For accessibility questions, refer to:
1. WCAG 2.1 Level AA Specification
2. Web Accessibility Initiative (W3C WAI)
3. The A11Y Project: https://www.a11yproject.com/
