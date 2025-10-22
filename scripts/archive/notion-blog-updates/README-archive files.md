# Archived Notion Blog Update Scripts

This directory contains one-time scripts used for managing and updating blog articles in Notion. These scripts were executed successfully and are archived for historical reference.

## Purpose

These scripts were created to perform specific updates to blog articles stored in Notion CMS during the initial content creation phase (October 2024).

## Archived Scripts

### Blog Article Publishing
- **`publish-conseil-ia-article.js`** (Oct 21, 2024)
  - Published the "Conseil en IA" article with full French and English content
  - ~3800 words per language with 11 academic references
  - Includes market research on Big Four, pure players, and AI consulting landscape

### Blog Article Updates
- **`update-conseil-ia-article.js`** (Oct 21, 2024)
  - Updated "Conseil en IA" with personal career details and stronger critique of Big Four
  - Added positioning statement: "Avec ou sans IA ? Ce n'est plus une question"

- **`update-deloitte-section.js`** (Oct 21, 2024)
  - Added verified details about Deloitte Australia AI scandal (October 2024)
  - Replaced vague statements with concrete incident: AU$440,000 government report with AI hallucinations

- **`update-email-consulting-article.js`** (Oct 22, 2024)
  - Updated email address from `contact@bubble-invest.com` to `contact@bubbleinvest.org`

- **`update-analyse-concurrentielle.js`** (Oct 22, 2024)
  - Updated competitive analysis article with new positioning content
  - Added pricing comparisons (WarrenAI, Betterment, Wealthfront, BlackRock Aladdin, FactSet)
  - Positioned Bubble as "AI Financial Coach" with €10-20/month fixed pricing

- **`add-sidebar-with-full-content.js`** (Oct 22, 2024)
  - Added "By the Numbers" sidebar with fee comparison table
  - Cost comparison at €50k and €500k AUM showing 5-10x savings vs percentage-based models
  - Successfully preserved all article content

- **`add-sidebar-to-analyse-concurrentielle.js`** (Oct 22, 2024)
  - ⚠️ Failed attempt - removed article content accidentally
  - Replaced by `add-sidebar-with-full-content.js`

### Knowledge Garden Management
- **`add-main-theme-to-references.js`** (Oct 22, 2024)
  - Added "Main Theme" categories to 11 Knowledge Garden references
  - Themes: "Fintech Startups & Innovation" (5 refs), "Economics & Social Sciences" (6 refs)

- **`update-main-themes-and-delete-duplicates.js`** (Oct 22, 2024)
  - Archived 6 duplicate references in Knowledge Garden database
  - Duplicates: Warren Buffett books, Peter Lynch books, investment classics

### Testing Scripts
- **`test-archived-filtering.js`** (Oct 22, 2024)
  - Testing script to verify archived pages were properly filtered
  - Led to bug fix in `knowledgeGardenService.js` (line 54-59)

## Why Archived?

These scripts were **one-time operations** that:
1. Successfully completed their intended purpose
2. Modified specific Notion database entries
3. Are no longer needed for day-to-day operations
4. Should not be re-run without careful consideration

## If You Need to Reference These Scripts

These scripts can serve as templates for:
- Future blog article publishing workflows
- Notion API rich_text chunking (2000-char limit handling)
- Bilingual content management patterns
- Knowledge Garden database operations

## Core Scripts (Not Archived)

The following scripts remain in `/scripts/` as they may be reused:
- `pdf_to_markdown.py` - PDF conversion utility
- `test-image-cache.js` - Blog image cache testing

---

**Archive Date:** October 22, 2024
**Total Scripts:** 10 files
**Total Size:** ~170 KB
