# Bubble Chatbot Documentation Index

This folder contains comprehensive documentation about the Bubble chatbot implementation, architecture, limitations, and improvement strategies.

## Documents Overview

### 1. CHATBOT_SUMMARY.md (Quick Reference)
**Length**: 265 lines | **Read Time**: 10 minutes

Executive summary for decision-makers and product managers.

Contains:
- Current state overview (what works, what's missing)
- Architecture overview (backend/frontend stacks)
- Key findings summary
- Quick wins (high ROI improvements)
- Estimated timeline to production

**Read this if you want**: A fast, high-level understanding of the chatbot's current state and what needs to happen next.

---

### 2. CHATBOT_ARCHITECTURE.md (Technical Deep Dive)
**Length**: 912 lines | **Read Time**: 45 minutes

Complete technical documentation of how the chatbot is implemented.

Covers:
1. Core components (backend controller, frontend UI modules)
2. System prompts and context injection
3. LLM model configuration and fallback mechanism
4. Conversation state and memory (limitations explained)
5. Rate limiting and session management
6. Portfolio simulator integration
7. Streaming implementation (SSE)
8. Frontend chat implementations (3 variants)
9. Animations and UX enhancements
10. Language support
11. Error handling
12. Analytics and tracking
13. Production status
14. File structure reference
15. Key takeaways

**Read this if you want**: To understand exactly how every part of the chatbot works, including code snippets and implementation details.

---

### 3. CHATBOT_IMPROVEMENTS.md (Problem & Solutions)
**Length**: 857 lines | **Read Time**: 40 minutes

Detailed analysis of limitations with concrete solutions.

Covers:
1. **Stateless Conversation** (CRITICAL) - 3 implementation levels
2. **No User Authentication** (HIGH) - 3 implementation levels
3. **Missing Conversation Storage** (HIGH) - 3 implementation levels
4. **Portfolio Context Not Sent** (MEDIUM) - Easy fix
5. **No Request Cancellation** (MEDIUM) - Easy fix
6. **Simple Session Store** (MEDIUM) - 2 options
7. Improvement roadmap (4 phases)
8. Architecture decisions matrix
9. Technical debt assessment
10. Testing strategy
11. Conclusion and priorities

**Read this if you want**: To understand what's broken, why it matters, and exactly how to fix it with code examples.

---

## Quick Navigation Guide

### By Role

**Product Manager**
1. Start: CHATBOT_SUMMARY.md (10 min)
2. Then: CHATBOT_IMPROVEMENTS.md sections 1, 2, 3 (15 min)
3. Reference: CHATBOT_ARCHITECTURE.md sections 4, 7 (10 min)

**Engineering Lead**
1. Start: CHATBOT_SUMMARY.md (10 min)
2. Deep dive: CHATBOT_ARCHITECTURE.md (45 min)
3. Planning: CHATBOT_IMPROVEMENTS.md (40 min)

**Developer/Implementer**
1. Reference: CHATBOT_ARCHITECTURE.md (45 min)
2. Details: CHATBOT_IMPROVEMENTS.md for specific sections (30 min)
3. Code locations: Use file structure reference

**QA/Tester**
1. Overview: CHATBOT_SUMMARY.md (10 min)
2. Flows: CHATBOT_ARCHITECTURE.md sections 8, 9, 10 (20 min)
3. Scenarios: CHATBOT_IMPROVEMENTS.md testing section (10 min)

### By Interest

**How does it work?**
- Read: CHATBOT_ARCHITECTURE.md (all sections)

**What's broken?**
- Read: CHATBOT_SUMMARY.md (What's Missing section)
- Read: CHATBOT_IMPROVEMENTS.md (Critical/High sections)

**How do I fix it?**
- Read: CHATBOT_IMPROVEMENTS.md (specific limitation section with code)

**How do I prioritize improvements?**
- Read: CHATBOT_IMPROVEMENTS.md section 7 (Roadmap)
- Read: CHATBOT_IMPROVEMENTS.md section 8 (Matrix)

**Where's the code?**
- Read: CHATBOT_ARCHITECTURE.md section 16 (File Structure)
- Locations: Absolute paths provided for all key files

---

## Key File Locations

### Backend
```
/src/backend/controllers/chat.controller.js       Main logic (394 lines)
/src/backend/middleware/rate-limiter.js            Rate limiting (19 lines)
/src/backend/middleware/session.js                 Sessions (15 lines)
/src/backend/routes/chat.routes.js                 Routes (13 lines)
/src/backend/config/env.js                         Config (51 lines)
```

### Frontend
```
/src/frontend/js/chatbot-logic.js                  Main chat UI (115 lines)
/src/frontend/js/chatbot-animations.js             Placeholders (132 lines)
/src/frontend/js/mini-chat.js                      Bubble widget (218 lines)
/src/frontend/js/floating-chat-input.js            Overlay (177 lines)
/src/frontend/i18n/translations.js                 Languages
```

### System Context
```
/docs/company/mission_texte.txt                    Loaded in prompt
/docs/company/Elevatorpitch5min.md                 Loaded in prompt
/docs/company/PointsdeDépartStratégiquesBubble.md  Loaded in prompt
```

---

## Critical Findings Summary

| Issue | Severity | Impact | Fix Time |
|-------|----------|--------|----------|
| No conversation memory | CRITICAL | Users can't ask follow-ups | 2-3 hours |
| No user auth | HIGH | Weak rate limiting | 3-5 days |
| No persistent storage | HIGH | Chat history lost | 2-3 days |
| Portfolio context unused | MEDIUM | Wasted endpoint | 2-3 hours |
| No request cancel | MEDIUM | Can't stop responses | 1-2 hours |
| Session in memory only | MEDIUM | Lost on restart | 2-4 hours |

---

## Recommended Improvements (Priority Order)

### Week 1 (MVP Enhancement)
1. Add localStorage conversation memory (2-3 hours)
2. Wire portfolio context endpoint (2-3 hours)
3. Add request cancellation (1-2 hours)

### Week 2-3 (Beta Ready)
1. Implement user authentication (3-5 days)
2. Add IP-based rate limiting (1-2 hours)
3. Set up Redis for sessions (2-4 hours)

### Week 4+ (Production Ready)
1. Database conversation storage (2-3 days)
2. Conversation UI/management (1-2 days)
3. Search and export features (1-2 days)

---

## API Endpoints Reference

```
POST /api/chat
Request:  { message: string, language: "en"|"fr" }
Response: SSE stream with { content: string }
Rate:     10 messages per session
Auth:     Session-based (weak)

POST /api/chat/portfolio
Request:  { message: string, language: "en"|"fr", context: {...} }
Response: SSE stream with { content: string }
Context:  { strategy, period, metrics, customStrategy, ... }
Rate:     10 messages per session
Auth:     Session-based (weak)
Note:     Frontend doesn't use this endpoint (yet)
```

---

## System Prompt Injection

The chatbot's behavior is controlled by three documents loaded at runtime:

1. **mission_texte.txt** - Company mission statement
2. **Elevatorpitch5min.md** - 5-minute elevator pitch
3. **PointsdeDépartStratégiquesBubble.md** - Strategic talking points

These are injected into the system prompt dynamically. To modify chatbot behavior, edit these files.

---

## LLM Model Configuration

The chatbot automatically falls back through models in this order:

1. `google/gemini-2.0-flash-001` - Primary (fast)
2. `openai/gpt-4.1-mini` - Fallback (reliable)
3. `mistralai/magistral-small-2506` - Fallback (cost-effective)
4. `deepseek/deepseek-r1-0528:free` - Final (free)

If all fail, returns 500 error. This is well-implemented and prevents total failures.

---

## Frontend Chat Implementations

### Main Chat Widget
Located in: `.chat-section`
Controller: `/src/frontend/js/chatbot-logic.js`
Features: Full-page chat interface, history visible, enter-to-send

### Mini Chat Bubble
Located in: `#floating-chat-bubble`
Controller: `/src/frontend/js/mini-chat.js`
Features: Expandable floating widget, independent from main chat

### Floating Input Overlay
Located in: `#floating-chat-input`
Controller: `/src/frontend/js/floating-chat-input.js`
Features: Glassmorphism design, appears after scrolling past waitlist, forwards to main chat

---

## Testing Recommendations

### Unit Tests Needed
- Conversation history tracking
- Portfolio context injection
- Model fallback mechanism
- Rate limiting logic
- Language switching

### Integration Tests Needed
- Full chat flow with history
- Portfolio context sending
- SSE streaming with large responses
- Concurrent requests
- Session persistence

### Load Tests Needed
- 100+ concurrent chat requests
- Rate limiting under load
- Memory usage with large history
- Database query performance

---

## Questions & Answers

**Q: Why doesn't the chatbot remember my previous questions?**
A: It's stateless by design. Each message is processed independently. See CHATBOT_IMPROVEMENTS.md section 1.

**Q: Can I use it on the portfolio simulator page?**
A: Yes, but the chatbot doesn't know about your selected strategy. That feature is built in the backend but not wired in the frontend. See CHATBOT_IMPROVEMENTS.md section 4.

**Q: How do I customize the chatbot personality?**
A: Edit the system prompt documents in `/docs/company/`. They're loaded and injected at runtime.

**Q: What happens when all LLM models fail?**
A: Returns 500 error. The fallback chain has 4 models, so total failure is rare.

**Q: Can I implement conversation memory without user auth?**
A: Yes! Start with Level 1 in CHATBOT_IMPROVEMENTS.md - frontend-only history. No backend changes needed.

**Q: Is the rate limiting effective?**
A: Not really. It's per-session, so 10 tabs = 100 messages. See CHATBOT_IMPROVEMENTS.md section 2 for solutions.

---

## Related Documentation

See also:
- `/docs/PORTFOLIO_SIMULATOR.md` - Portfolio simulator docs
- `/CLAUDE.md` - Project guidelines
- `/src/backend/controllers/portfolio.controller.js` - Portfolio controller

---

## Glossary

- **SSE**: Server-Sent Events (streaming protocol)
- **Fallback**: Automatic retry with different LLM model
- **Context Injection**: Adding company docs to system prompt
- **Stateless**: Each message treated independently, no history
- **Rate Limiting**: Restricting number of messages per time period
- **Portfolio Context**: Information about selected strategy/period
- **System Prompt**: Initial instruction given to LLM before user message
- **Floating Bubble**: Mini-chat widget that appears at bottom-right
- **Glassmorphism**: Frosted glass UI effect

---

## Document Maintenance

**Last Updated**: 2025-10-31
**Applies To**: BubbleLaunch codebase
**Current Status**: Production (v1)

When you implement improvements, update these docs:
1. CHATBOT_SUMMARY.md - Update "What Works" section
2. CHATBOT_ARCHITECTURE.md - Document new patterns
3. CHATBOT_IMPROVEMENTS.md - Move completed items to "Completed" section

---

## Quick Start for Developers

1. **Understand current state** (10 min)
   - Read: CHATBOT_SUMMARY.md

2. **Explore the code** (30 min)
   - Read: CHATBOT_ARCHITECTURE.md section 1
   - Examine: `/src/backend/controllers/chat.controller.js`
   - Examine: `/src/frontend/js/chatbot-logic.js`

3. **Pick an improvement** (5 min)
   - Read: CHATBOT_IMPROVEMENTS.md section 4 (easiest)
   - Or: CHATBOT_IMPROVEMENTS.md section 2 (most impactful)

4. **Start coding** (2-3 hours)
   - Use code examples from CHATBOT_IMPROVEMENTS.md
   - Reference file locations from CHATBOT_ARCHITECTURE.md section 16

5. **Test it**
   - Manual testing in browser
   - Check SSE streaming in Network tab
   - Verify language switching works
   - Test on portfolio simulator page

---

**For questions or updates, refer to the detailed documentation files above.**

