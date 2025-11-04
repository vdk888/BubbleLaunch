# Blog Content Guidelines - Notion Writing Standards

**Purpose**: Standardized formatting and writing guidelines for creating blog articles in Notion that render consistently in HTML
**Audience**: Content writers, Notion AI drafting system, editorial team
**Status**: ✅ **ACTIVE - Apply to all blog content**
**Last Updated**: 2025-11-04

---

## Quick Reference Card

### Formatting Rules (Use in Notion)

| Element | Notion Format | How It Renders | Example |
|---------|---------------|----------------|---------|
| **Bold** | `**text**` | `<strong>text</strong>` | **Important concept** |
| *Italic* | `*text*` | `<em>text</em>` | *emphasis here* |
| [Link](url) | `[Link text](https://url.com)` | Clickable `<a>` tag | [Read more](https://example.com) |
| Bare URL | `https://example.com` (no markup needed) | Auto-converts to link | https://example.com |
| H2 Heading | `## Heading Text` | `<h2>` tag | ## Section Title |
| H3 Heading | `### Heading Text` | `<h3>` tag | ### Subsection |
| H4 Heading | `#### Heading Text` | `<h4>` tag | #### Small Section |
| Bullet List | `- ` (dash space) | `<ul>` with `<li>` | - Item 1<br>- Item 2 |
| Numbered List | `1. ` `2. ` `3. ` | `<ol>` with `<li>` | 1. First<br>2. Second |
| Code | `` `code` `` | `<code>` tag | `function_name()` |
| Block Quote | `> Quote text` | `<blockquote>` | > Famous quote |

---

## Spacing & Line Breaks

### ✅ CORRECT Spacing

**Between paragraphs**: Single blank line
```
Paragraph 1

Paragraph 2 (with single blank line above)
```

**Between headings and content**: Single blank line
```
## Section Heading

Paragraph text starts here
```

**In lists**: No blank lines between list items
```
- Item 1
- Item 2
- Item 3
```

**After lists**: Single blank line before next paragraph
```
- Item 1
- Item 2

Next paragraph here
```

### ❌ INCORRECT Spacing (AVOID)

- ❌ Multiple blank lines between paragraphs (creates excessive gaps)
- ❌ No space between heading and content (looks cramped)
- ❌ Extra line breaks within single paragraph (splits unnecessarily)
- ❌ Blank lines between list items (breaks list structure)

### Real Example from Your Article

❌ **What Notion shows (incorrect spacing):**
```
## Section Title


Paragraph 1


Paragraph 2


Paragraph 3
```

✅ **What it should be (correct spacing):**
```
## Section Title

Paragraph 1

Paragraph 2

Paragraph 3
```

---

## Link Formatting

### Two Approved Ways to Format Links

**Format 1: Markdown Links (Explicit)**
```
Use this when you want to change link text
[Click here to learn more](https://www.amf-france.org/fr/actualites)
```
Renders as: [Click here to learn more](https://www.amf-france.org/fr/actualites)

**Format 2: Bare URLs (Auto-converted)**
```
Use this for direct URLs, will auto-convert to clickable link
See https://www.amf-france.org/fr/actualites for details
```
Renders as: See [https://www.amf-france.org/fr/actualites](https://www.amf-france.org/fr/actualites) for details

### ✅ GOOD Link Examples

```
AMF — Suppression des « commissions de mouvement » (annonce) : https://www.amf-france.org/fr/actualites-publications/actualites/frais-lamf-annonce-la-suppression-des-commissions-de-mouvement-pour-la-gestion-sous-mandat

[Learn more about fee structures](https://www.amf-france.org/fr/actualites-publications/publications/observatoire-de-lepargne)

For more information, visit the [Fed's official guide](https://files.stlouisfed.org/files/htdocs/publications/page1-econ/2021/04/01/the-anchoring-effect_SE.pdf)
```

### ❌ COMMON LINK MISTAKES

```
❌ Plain text URLs (these now auto-convert, but markdown is clearer):
See https://example.com for details

✅ Better with markdown for clarity:
[For details, visit the official guide](https://example.com)

❌ Broken markdown (missing closing parenthesis):
[Link text](https://example.com

✅ Correct format:
[Link text](https://example.com)
```

---

## Bold Text & Titles

### ✅ CORRECT Bold Formatting

Use `**text**` markdown to make text bold:

```
**This entire sentence is bold.**

Some text with **bold emphasis** in the middle.

**Key Takeaway**: The important message here.
```

### For Headings (Use Markdown Headers, Not Bold)

```
❌ **Using bold instead of heading**:
**This is not a heading**
Paragraph text here

✅ Using proper heading syntax:
## This Is a Heading
Paragraph text here
```

### Real Example from Your Article

Your article required manual asterisks:
```
❌ (Workaround you had to use):
**Trois modèles, trois incitations**

✅ (Proper way going forward):
## Trois modèles, trois incitations
```

---

## Code & Technical Content

### Inline Code

Use backticks for code within text:
```
The `calculateTotal()` function returns...

Use `CAGR` to measure annualized returns...
```

### Code Blocks

For multi-line code, use triple backticks with language specification:
````
```javascript
function calculateFees(portfolio, feePercentage) {
    return portfolio * (feePercentage / 100);
}
```
````

---

## Lists

### Bullet Lists (Unordered)

```
- First item
- Second item
- Third item
```

Do NOT use:
- ❌ `* Item` (use dash `-` instead for consistency)
- ❌ `• Item` (unnecessary, markdown converts `-` automatically)

### Numbered Lists (Ordered)

```
1. First step
2. Second step
3. Third step
```

Important: Number them sequentially. The system handles auto-numbering, but explicit numbers work too.

### Nested Lists

```
- Main item 1
  - Sub-item 1.1
  - Sub-item 1.2
- Main item 2
  - Sub-item 2.1
```

---

## Real Article Example: Frais Fixes vs Frais en Pourcentage

### What You Had (Issues)

Your article rendered with:
- ✅ Good: Strong brand voice, excellent structure
- ❌ Problem: URLs appeared as plain text
- ❌ Problem: Extra paragraph spacing
- ❌ Problem: Had to manually add `**asterisks**` for subtitles
- ❌ Problem: Meta summary got truncated

### Formatting Applied (Going Forward)

**Original (Notion):**
```
Pourquoi les frais en % pèsent lourd

Chaque année, un pourcentage est prélevé...
```

**Now renders as:**
```html
<h2>Pourquoi les frais en % pèsent lourd</h2>

<p>Chaque année, un pourcentage est prélevé...</p>
```

**Links (Fixed):**
```
Reference: https://www.amf-france.org/fr/actualites-publications/publications/observatoire-de-lepargne/lettres-de-lobservatoire-de-lepargne/lettre-de-lobservatoire-de-lepargne-de-lamf-ndeg61-mai-2025

NOW renders as:
<p>Reference: <a href="https://www.amf-france.org/fr/actualites-publications/publications/observatoire-de-lepargne/lettres-de-lobservatoire-de-lepargne/lettre-de-lobservatoire-de-lepargne-de-lamf-ndeg61-mai-2025" target="_blank" rel="noopener noreferrer">https://www.amf-france.org/...</a></p>
```

---

## Integration with Existing Style Guides

### Three Documents Work Together

1. **STYLE_GUIDE_SEO_WRITING.md** (Brand voice, positioning, language standards)
   - How to describe Bubble
   - How to position against competitors
   - What claims to make/avoid
   - Pricing language requirements

2. **MASTER_BLOG_ARTICLE_OUTLINES.md** (Article structure, SEO keywords)
   - Outline for each article
   - Target keywords
   - Section structure
   - Notion AI prompts

3. **BLOG_CONTENT_GUIDELINES.md** (THIS DOCUMENT - Technical formatting)
   - How to format content in Notion
   - Link syntax
   - Spacing rules
   - Markdown conventions

### When Writing an Article

**Step 1: Follow the Outline**
- Reference MASTER_BLOG_ARTICLE_OUTLINES.md
- Use the H2/H3 structure provided
- Follow SEO keywords in outline

**Step 2: Follow Brand Voice**
- Reference STYLE_GUIDE_SEO_WRITING.md
- Use correct positioning language
- Apply pricing standards
- Match tone and terminology

**Step 3: Apply This Formatting Guide**
- Use markdown syntax for formatting
- Follow spacing rules
- Format links correctly
- Keep consistent line breaks

---

## Notion AI Prompt Template

Use this prompt when asking Notion AI to expand sections:

```
You are writing for Bubble Invest, an AI-powered quantitative investment platform.

BEFORE YOU START:
1. Read STYLE_GUIDE_SEO_WRITING.md (brand voice, positioning)
2. Read MASTER_BLOG_ARTICLE_OUTLINES.md (article structure)
3. Read BLOG_CONTENT_GUIDELINES.md (formatting standards)

IMPORTANT FORMATTING:
- Use **bold** (double asterisks) for emphasis
- Use [Link text](https://url.com) for links
- Use ## for H2 headings, ### for H3
- Use - for bullet lists, 1. for numbered lists
- Add single blank line between paragraphs
- Do NOT use excessive line breaks

IMPORTANT POSITIONING:
- Bubble is NOT a robo-advisor (it's a quantitative platform)
- Bubble's AI educates and recommends, doesn't control
- Pricing: "plans from €0 to €10/month (example pricing)" NOT definitive
- Data sources: Uncle Stock and Yahoo Finance (external)
- Proprietary IP: Multi-factor scoring and 11-step process
- Users own their accounts (IBKR/Alpaca/Saxo), we don't manage them
- Backtesting: 17+ years (2005-2025) with realistic assumptions

TASK: Expand this outline section into full article text
- Keep H2 headings exactly as provided
- Aim for 500-1,500 words per H2 section
- Use clear, educational tone
- Include examples and real numbers
- Include internal links where relevant

[INSERT OUTLINE HERE]

After writing, I will review for:
1. Accuracy of positioning
2. Correct formatting (links, bold, spacing)
3. Brand voice compliance
4. SEO quality
```

---

## Troubleshooting

### Issue: Links not clickable in HTML

**Symptom**: URLs appear in article but aren't underlined/clickable

**Solution**:
- ✅ Use markdown format: `[text](https://url.com)`
- ✅ Or use bare URL (will auto-convert): `https://example.com`
- ❌ Don't use plain text without markdown: `example.com` (won't work)

### Issue: Too much spacing between paragraphs

**Symptom**: Large gaps between sections in final HTML

**Solution**:
- Remove extra blank lines in Notion
- Use single blank line between paragraphs, not double
- Check for hidden spaces/tabs in blank lines

### Issue: Text appearing as bold when it shouldn't

**Symptom**: Random text is bolded in final article

**Solution**:
- Check for unmatched `**` asterisks
- Example: `**bold starts here but doesn't close` (missing closing `**`)
- Correct: `**bold text**`

### Issue: Summary gets truncated on article page

**Symptom**: Meta summary shows only partial text

**Solution**:
- ✅ System now auto-adjusts font size
- ✅ No truncation for long summaries
- Summary will wrap to multiple lines if needed

### Issue: Heading appearing as regular text

**Symptom**: `## Section Title` doesn't look like a heading

**Solution**:
- ✅ This only happens in Notion editor preview
- ✅ Will render correctly as `<h2>` in HTML
- Use `##` for H2, `###` for H3, `####` for H4

---

## Checklist Before Publishing

Before submitting any article for publication, verify:

### Formatting
- [ ] All headings use markdown: `## Heading 2`, `### Heading 3`
- [ ] All bold uses `**text**` syntax (not manual formatting)
- [ ] All links either: `[text](url)` or bare URL `https://example.com`
- [ ] Single blank line between paragraphs
- [ ] Lists use `-` for bullets, `1. 2. 3.` for numbered
- [ ] No excessive line breaks or spacing

### Content Quality
- [ ] Follows STYLE_GUIDE_SEO_WRITING.md for brand voice
- [ ] Follows MASTER_BLOG_ARTICLE_OUTLINES.md for structure
- [ ] All SEO checkboxes in outline met (keywords, links, word count)
- [ ] Meta summary not too long (will adjust size, but keep reasonable)
- [ ] Internal links included (3-5 to other blog content)

### Accuracy
- [ ] Positioning correct (quantitative platform, not robo-advisor)
- [ ] Pricing language: "plans from €0 to €10/month (example)"
- [ ] AI role clear: educates and recommends, doesn't control
- [ ] No false claims about returns or market beating
- [ ] Data sources cited: Uncle Stock, Yahoo Finance
- [ ] Backtesting timeframe mentioned: 2005-2025

---

## Examples from Your Latest Article

### Before (Issues)

```
Les frais cachés rongent vos gains. Sur 20 ans, 1 % par an peut effacer jusqu'à un quart de votre capital final. Voici pourquoi l'abonnement fixe — plans from €0 to €10/month (exemple de tarification) — est souvent l'option la plus honnête, la plus lisible et la plus économique.

AMF — Observatoire de l'épargne, Lettre n° 61 : https://www.amf-france.org/fr/actualites-publications/publications/observatoire-de-lepargne/lettres-de-lobservatoire-de-lepargne/lettre-de-lobservatoire-de-lepargne-de-lamf-ndeg61-mai-2025
```

**Issues:**
- ❌ URL not clickable (plain text)
- ❌ Had to manually add `*` around titles for bold

### After (Fixed)

```
Les frais cachés rongent vos gains. Sur 20 ans, 1 % par an peut effacer jusqu'à un quart de votre capital final. Voici pourquoi l'abonnement fixe — plans from €0 to €10/month (exemple de tarification) — est souvent l'option la plus honnête, la plus lisible et la plus économique.

AMF — Observatoire de l'épargne, Lettre n° 61 : https://www.amf-france.org/fr/actualites-publications/publications/observatoire-de-lepargne/lettres-de-lobservatoire-de-lepargne/lettre-de-lobservatoire-de-lepargne-de-lamf-ndeg61-mai-2025
```

**What changed:**
- ✅ URL auto-converts to clickable link (no markdown needed)
- ✅ Subtitles now use `## Heading 2` instead of bold text
- ✅ Spacing normalized (no extra paragraph breaks)
- ✅ Summary displays fully without truncation

---

## Summary: What Changed for You

| Issue | Before | After | Solution |
|-------|--------|-------|----------|
| **URLs not clickable** | Plain text URLs ignored | Auto-converts to `<a>` tags | Bare URLs now auto-detect |
| **Extra spacing** | Multiple blank lines between paragraphs | Clean single-line spacing | Normalize excessive line breaks |
| **Bold subtitles** | Had to manually add `**text**` | Markdown `**text**` converts | Support markdown syntax |
| **Summary truncated** | Long summaries cut off | Full display on all sizes | Responsive font sizing |

---

## Questions or Edge Cases?

If you encounter a formatting situation not covered:

1. **Check this document** first (common issues section)
2. **Review STYLE_GUIDE_SEO_WRITING.md** for positioning questions
3. **Check MASTER_BLOG_ARTICLE_OUTLINES.md** for structure questions
4. **Reference your latest article** to see applied examples
5. **Test in Notion** - the preview might differ from final HTML

---

## Version History

- **v1.0** - 2025-11-04 - Initial comprehensive formatting guide
  - Added quick reference card
  - Documented all formatting rules
  - Integrated with existing style guides
  - Included Notion AI prompt template
  - Real examples from "Frais Fixes vs Frais en Pourcentage" article

---

**Status**: ✅ **ACTIVE - Apply to all new blog content**
**Next Step**: Use this guide for your next article in Notion
**Questions**: Reference STYLE_GUIDE_SEO_WRITING.md or MASTER_BLOG_ARTICLE_OUTLINES.md
