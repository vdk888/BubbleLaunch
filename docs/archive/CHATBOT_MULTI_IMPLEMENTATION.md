# Unified Chatbot Implementation Summary

**Updated:** 2025-11-06  
**Status:** ✅ Live in production

---

## Overview

Bubble now ships a **single, unified AI assistant** that dynamically adapts to page context instead of juggling three separate chatbots. The controller builds one prompt, injects shared knowledge (mission, pricing, strategic docs), and tunes behaviour at runtime using `pageContext`, user language, and conversation history. This simplifies maintenance, keeps tone consistent, and allows new pages to opt-in with minimal wiring.

---

## Current Architecture

| Layer | Responsibility | Key Files |
|-------|----------------|-----------|
| **Backend (Express)** | Build unified system prompt, stream responses, enforce rate limits | `src/backend/controllers/chat.controller.js`, `src/backend/routes/chat.routes.js`, `src/backend/middleware/rate-limiter.js` |
| **Frontend (Vanilla JS)** | Detect page context, manage localStorage history, handle SSE stream | `src/frontend/js/chatbot-logic.js`, `src/frontend/js/mini-chat.js`, `src/frontend/js/floating-bubble.js` |
| **Shared Docs** | Mission, elevator pitch, strategic notes, pricing/system overview | `docs/company/*.md` |

---

## Backend Changes

### 1. Unified System Prompt

`chat.controller.js` now exports `unifiedSystemPrompt(language, pageContext, waitlistShared)` which:
- Loads mission, elevator pitch, strategy notes, and pricing docs once at boot.
- Describes Bubble’s positioning, subscription model, and portfolio approach.
- Embeds context-aware guidance blocks for **index**, **pricing**, **portfolio simulator**, **businesses**, and future pages.
- Enforces language (FR/EN) and waitlist link etiquette.

This prompt feeds every request regardless of entry point, guaranteeing consistent brand voice.

### 2. Streaming Orchestration

- Requests send `{ message, language, pageContext, history, waitlistShared }`.
- Controller merges the prompt + trimmed history (last 10 exchanges) + current message.
- Maintains the existing multi-model fallback list (`gemini-2.0-flash`, `gpt-4.1-mini`, `magistral-small`, `deepseek-r1`).
- Streams via SSE, preserving typing indicators on the frontend.

### 3. Simplified Routing

`src/backend/routes/chat.routes.js` exposes a single `POST /api/chat` endpoint. The multi-chatbot selector logic was removed, and all downstream services expect the unified payload shape.

---

## Frontend Changes

### Context Detection

`chatbot-logic.js` and `mini-chat.js` derive `pageContext` from `window.location.pathname`:
- `/`, `/en/` → `index`
- `/pricing`, `/en/pricing` → `pricing`
- `/portfolio-simulator`, `/en/portfolio-simulator` → `simulator`
- `/businesses`, `/en/businesses` → `businesses`
- Fallback: `index`

### Persistent History

- Local storage key format: `bubble_chat_history_${pageContext}`.
- Last 10 messages sent with each request, preserving tone and context when users navigate between pages.
- Waitlist link tracking prevents repeat CTAs unless re-requested.

### UI Integration

- Floating bubble and mini chat widget are shared across pages.
- First message greeting adapts to language and context (e.g., simulator prompts quick replies about strategies).
- SSE handler unchanged; it now simply renders the unified assistant output.

---

## Legacy Multi-Bot Approach

The previous document referenced three standalone prompts with hard-coded behaviour. That logic has been sunset and lives only in Git history. If specialised personalities are needed again:
1. Add context guards to `unifiedSystemPrompt`.
2. Extend the frontend `pageContext` detection map.
3. Optionally inject extra doc snippets per page before invoking the LLM.

---

## Follow-Up Opportunities

1. **Automated Prompt Tests** — snapshot key contexts (index/pricing/simulator) to guard against regression.
2. **Analytics Instrumentation** — track which quick replies are used and feed back into CTA tuning.
3. **Business Context Expansion** — pull targeted copy from `docs/company/bubble_portfolio_system.md` once that roadmap stabilises.

---

## Files Touched by Migration

- `src/backend/controllers/chat.controller.js` — unified prompt + document loaders.
- `src/frontend/js/chatbot-logic.js`, `mini-chat.js` — page context detection, history management.
- `docs/CHATBOT_MULTI_IMPLEMENTATION.md` — you are reading the updated version.
