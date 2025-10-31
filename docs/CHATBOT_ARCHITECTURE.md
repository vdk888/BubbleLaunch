# Bubble Chatbot Architecture - Comprehensive Overview

## Executive Summary

Bubble's chatbot is a **stateless, streaming-based conversational agent** built with vanilla JavaScript on the frontend and Node.js/Express on the backend. It leverages OpenRouter's API as the primary LLM provider with automatic fallback capabilities. The chatbot is context-aware for portfolio simulator discussions and uses session-based rate limiting to prevent abuse.

---

## 1. CHATBOT IMPLEMENTATION ARCHITECTURE

### 1.1 Core Components

**Backend Chatbot Logic:**
- **File**: `/src/backend/controllers/chat.controller.js`
- **Type**: Controller pattern
- **Responsibilities**:
  - Load and manage company context documents
  - Build system prompts with dynamic language support
  - Handle streaming responses via Server-Sent Events (SSE)
  - Implement model fallback mechanism
  - Support portfolio-specific context injection

**Frontend Chatbot UI:**
- **Files**: 
  - `/src/frontend/js/chatbot-logic.js` - Core chat message handling & SSE streaming
  - `/src/frontend/js/chatbot-animations.js` - Rotating placeholder animations
  - `/src/frontend/js/mini-chat.js` - Embedded floating chat widget
  - `/src/frontend/js/floating-chat-input.js` - Glassmorphism input overlay
- **Type**: Vanilla JavaScript IIFE modules
- **Responsibilities**:
  - Render chat UI with message history
  - Parse and display SSE streaming chunks
  - Manage typing indicators and animations
  - Handle user input and submission
  - Manage chat state and focus

### 1.2 Chat Endpoints

| Endpoint | Method | Purpose | Auth | Response |
|----------|--------|---------|------|----------|
| `/api/chat` | POST | Standard chat (main page) | Rate Limit | SSE stream |
| `/api/chat/portfolio` | POST | Portfolio-aware chat | Rate Limit | SSE stream |

**Request Format:**
```json
{
  "message": "User question text",
  "language": "fr" or "en",
  "context": { /* optional portfolio context */ }
}
```

**Response Format (SSE):**
```
data: {"content": "text chunk"}
data: {"content": "more text"}
data: {"done": true}
```

---

## 2. SYSTEM PROMPTS & CONTEXT

### 2.1 Core System Prompt Structure

**Location**: `/src/backend/controllers/chat.controller.js` (lines 37-87)

**Key Sections:**

1. **Company Documents** (Injected at runtime):
   - `/docs/company/mission_texte.txt` - Mission statement
   - `/docs/company/Elevatorpitch5min.md` - Elevator pitch
   - `/docs/company/PointsdeDépartStratégiquesBubble.md` - Strategic talking points

2. **Language Enforcement**:
   ```javascript
   `You MUST respond in ${language.toUpperCase()} only.`
   + "Never switch from the user's selected language"
   ```

3. **Core Principles**:
   - Decision-support SaaS (NOT asset management)
   - Transparent pricing (fixed fees, not AUM %)
   - User control (orders reviewed before execution)

4. **Problem/Solution Framing**:
   - Problem: Traditional finance is opaque, expensive, 90% underperform
   - Solution: AI-powered analytics + transparency + low fixed fees

5. **Audience-Specific Talking Points**:
   - **Retail**: Mistrust of banking, education focus, democratization
   - **Experts**: Tech disruption, inefficiency of current system, data-driven approach

6. **Tone Directive**:
   - Confident, enthusiastic, slightly revolutionary
   - Concrete examples and facts
   - Educational disclaimer on every response

### 2.2 Portfolio-Specific Context (Lines 178-266)

When a user is using the portfolio simulator, a context section is injected:

```javascript
buildPortfolioContextSection(context, language)
```

**Includes**:
- Active strategy name
- Time horizon selected
- Underlying ETFs (SPY, IEF, GLD)
- Key performance metrics:
  - Total return %
  - Annual return %
  - Volatility %
  - Sharpe ratio
  - Max drawdown %
- Custom strategy details (if mixing two strategies)
- Cache generation timestamp

**Example Context Injection**:
```
### PORTFOLIO SIMULATOR CONTEXT:
- Active strategy: optimizedRiskParity
- Time horizon: 20 years of history
- Underlying ETFs: SPY, IEF, GLD
- Key performance metrics:
  • Total return: +523.5%
  • Annual return: +7.2%
  • Volatility: 12.1%
  • Sharpe ratio: 0.58
  • Max drawdown: -35.2%
```

### 2.3 Call-to-Action Enforcement

**Location**: Lines 80-87

Every chatbot response MUST end with a waitlist CTA:

```javascript
/**
 * IMPORTANT INSTRUCTIONS FOR CALL TO ACTION:
 * 1. At the end of every response, always include a clear CTA
 * 2. Use only ONE of these variations (rephrase naturally):
 *    - "Ready to join the financial revolution? Secure your spot on our waitlist now!"
 *    - "Be among the first to experience Bubble. Join our waitlist today!"
 *    - "Interested in early access? Join our waitlist to be notified when we launch!"
 * 3. Make it feel natural and relevant to conversation
 * 4. No weblinks or marketing promises
 */
```

---

## 3. LLM MODEL CONFIGURATION

### 3.1 Model Stack (with Fallback Chain)

**Primary Model Order** (lines 89-94):

```javascript
const models = [
  "google/gemini-2.0-flash-001",      // 1st choice (fast, capable)
  "openai/gpt-4.1-mini",               // 2nd fallback
  "mistralai/magistral-small-2506",    // 3rd fallback
  "deepseek/deepseek-r1-0528:free",   // Final fallback
];
```

### 3.2 Model Fallback Mechanism

**Implementation** (lines 365-374):

```javascript
try {
  for (const model of models) {
    try {
      await streamResponse(res, model, messages, headers);
      return; // Success - stop trying
    } catch (error) {
      console.error(`Error with model ${model}:`, error.message);
      // Try next model in chain
    }
  }
  
  // All models failed
  res.status(500).json({
    error: "All LLM providers failed. Please try again later."
  });
}
```

**Advantages**:
- Automatic graceful degradation
- No single point of failure
- Optimizes for speed (Gemini 2.0 Flash is fastest)
- Cost-effective (includes free DeepSeek fallback)

### 3.3 OpenRouter Configuration

**API Setup**:
```javascript
axios({
  url: "https://openrouter.ai/api/v1/chat/completions",
  method: "post",
  data: {
    model: model,
    messages: messages,
    stream: true  // Enable SSE streaming
  },
  headers: {
    Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": env.CHAT_REFERER || "https://bubbleinvest.org"
  }
})
```

---

## 4. CONVERSATION STATE & MEMORY

### 4.1 Current Limitations (Stateless Design)

**CRITICAL LIMITATION**: The chatbot **does NOT maintain conversation history**.

Each API call is independent:

```javascript
// Frontend sends ONLY current message + language
const body = JSON.stringify({ 
  message,        // Current message only
  language: lang  // Language preference
});

// Backend doesn't track previous messages
const messages = [
  { role: "system", content: systemPrompt(language) },
  { role: "user", content: message }  // Only this turn
];
```

**Consequences**:
- No context carryover between turns
- User must re-explain context if asking follow-up questions
- Chatbot cannot reference previous responses
- No conversation continuity in chat history
- Each response is "forgetful" of prior exchanges

### 4.2 Client-Side Chat History

**Frontend stores messages locally** for UI display only:

```javascript
// chatbot-logic.js, lines 30-27
function addMessageToChat(sender, message, isUser) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("chat-message", sender);
  
  // Appends to DOM only - not sent to backend
  chatMessages.appendChild(messageElement);
}
```

**Current Chat History Features**:
- Messages appear in UI DOM
- Scroll history visible in chat window
- NO persistence (lost on page refresh)
- NO backend storage
- Mini-chat history NOT persisted

### 4.3 Portfolio Context Workaround

For portfolio simulator, the frontend CAN inject simulator state:

```javascript
// portfolio-simulator.js, lines 281-296
window.bubbleSimulatorState = {
  strategy: currentStrategy,
  period: currentPeriod,
  generatedAt: data.generatedAt,
  tickers: data.tickers,
  metrics: data.metrics,
  customStrategy: {...}
};

// floating-chat-input.js, lines 32-38
// This state is available to chatbot context:
const state = window.bubbleSimulatorState || {};
window.gtag('event', action, {
  strategy: state.strategy || null,
  period_years: state.period || null,
  ...params
});
```

**But Note**: This state is NOT currently sent to the chatbot - it's only for analytics.

---

## 5. RATE LIMITING & SESSION MANAGEMENT

### 5.1 Rate Limiter Implementation

**File**: `/src/backend/middleware/rate-limiter.js`

**Type**: Session-based message counter

```javascript
const chatRateLimiter = (req, res, next) => {
  if (!req.session.messageCount) {
    req.session.messageCount = 0;
  }
  
  if (req.session.messageCount >= 10) {
    return res.status(429).json({ error: "Message limit reached" });
  }
  
  req.session.messageCount++;
  next();
};
```

**Limit**: **10 messages per session**

**Reset**: Session lifetime (typically 24 hours or browser close)

**Applied To**:
- `/api/chat` - Main chatbot
- `/api/chat/portfolio` - Portfolio-specific chat

### 5.2 Session Configuration

**File**: `/src/backend/middleware/session.js`

```javascript
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "your-super-secret-key",
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false  // Set to true for HTTPS/production
  }
});
```

**Key Points**:
- Uses Express-session with default memory store
- Session ID stored in HTTP-only cookie
- NO persistent session database
- Sessions lost on server restart
- Each browser/tab has separate session

### 5.3 Limitations of Current Rate Limiting

1. **Per-session, not per-IP**: Different browsers = different sessions
2. **No persistence**: Restarting server resets all rate limits
3. **No user authentication**: Can't distinguish users
4. **Vulnerable to**: Tab-based attacks (10 tabs = 100 messages)
5. **No sliding window**: Hard reset at 10 messages, not time-based

---

## 6. PORTFOLIO SIMULATOR INTEGRATION

### 6.1 Portfolio Chat Endpoint

**Dedicated endpoint**: `POST /api/chat/portfolio`

**Unique Feature**: Accepts context parameter

```javascript
async function handlePortfolioChat(req, res) {
  const { message, language = "fr", context } = req.body;
  
  // Build portfolio-specific system prompt
  const portfolioContextSection = buildPortfolioContextSection(context, language);
  
  // Inject into system prompt
  const messages = [
    {
      role: "system",
      content: `${systemPrompt(language)}
                
### ADDITIONAL GUIDELINES FOR PORTFOLIO SIMULATION:
You are now Bubble's portfolio simulator specialist...
${portfolioContextSection}`
    },
    { role: "user", content: message }
  ];
}
```

### 6.2 Frontend Integration Points

**Portfolio Simulator Page** (`/portfolio-simulator`):

1. **Floating Chat Input** (lines 43-48):
   ```javascript
   const isSimulatorPage = window.location.pathname.includes('portfolio-simulator');
   const alwaysVisible = dataset.alwaysVisible === 'true';
   // Input always visible on portfolio page
   ```

2. **Simulator State Tracking** (lines 269-279):
   ```javascript
   function trackSimulatorEvent(action, params = {}) {
     window.gtag('event', action, {
       event_category: 'Portfolio Simulator',
       language: getCurrentLanguage(),
       strategy: currentStrategy,
       period_years: currentPeriod,
       custom_mix_enabled: customStrategyState.enabled,
       ...params
     });
   }
   ```

3. **Chat Context Could Be Sent** (but currently isn't):
   ```javascript
   // In portfolio-simulator.js, lines 281-296
   // This data COULD be sent to /api/chat/portfolio
   window.bubbleSimulatorState = {
     strategy: currentStrategy,
     period: currentPeriod,
     metrics: data.metrics,
     // ...
   };
   ```

---

## 7. CURRENT LIMITATIONS & CONSTRAINTS

### 7.1 Architectural Limitations

| Limitation | Impact | Workaround |
|-----------|--------|-----------|
| **Stateless conversations** | No multi-turn memory | Users must repeat context |
| **No conversation persistence** | Chat history lost on refresh | Would need database |
| **Minimal rate limiting** | Can be bypassed with tabs | Need IP-based + auth |
| **No user authentication** | Can't track individual users | Would need auth system |
| **Language lock enforcement** | Strict single-language per message | Can't code-switch naturally |
| **Portfolio context not sent** | Chat doesn't know simulator state | Would need frontend modification |
| **No streaming control** | Can't interrupt/cancel mid-stream | Would need AbortController |
| **Simple session store** | Lost on server restart | Would need persistent DB |

### 7.2 UX Limitations

| Issue | Cause | Severity |
|-------|-------|----------|
| Chatbot forgets previous questions | Stateless design | HIGH |
| Must rejoin waitlist in every response | System prompt requirement | MEDIUM |
| No portfolio context awareness | Context not passed to /api/chat/portfolio | MEDIUM |
| 10 message limit feels arbitrary | Fixed session limit | LOW |
| No typing context | Each message treated independently | MEDIUM |

### 7.3 Functional Gaps

1. **Multi-turn conversations**: Cannot maintain coherent dialogue threads
2. **Portfolio understanding**: Chat doesn't know user's current strategy choice
3. **Context carryover**: Each message is isolated
4. **Conversation recovery**: Cannot revisit previous points
5. **Personalization**: No user profile/preference tracking
6. **Analytics**: Limited tracking of conversation quality

---

## 8. STREAMING IMPLEMENTATION (SSE)

### 8.1 Backend SSE Setup

**Location**: `/src/backend/controllers/chat.controller.js`, lines 99-174

```javascript
async function streamResponse(res, model, messages, headers) {
  return new Promise((resolve, reject) => {
    axios({
      method: "post",
      url: "https://openrouter.ai/api/v1/chat/completions",
      data: {
        model: model,
        messages: messages,
        stream: true  // Enable streaming
      },
      responseType: "stream",  // Treat response as stream
      headers: headers
    })
      .then((response) => {
        // Set SSE headers
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();
        
        // Parse streamed chunks
        response.data.on("data", (chunk) => {
          const lines = chunk.toString().split("\n");
          
          for (const line of lines) {
            const message = line.replace(/^data: /, "").trim();
            
            if (message === "[DONE]") {
              res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
              res.end();
              return;
            }
            
            try {
              const parsed = JSON.parse(message);
              if (parsed.choices[0].delta.content) {
                const content = parsed.choices[0].delta.content;
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
              }
            } catch (e) {
              // Skip parsing errors
            }
          }
        });
      })
  });
}
```

### 8.2 Frontend SSE Parsing

**Location**: `/src/frontend/js/chatbot-logic.js`, lines 56-95

```javascript
const reader = response.body.getReader();
const decoder = new TextDecoder();
let fullResponse = "";
let buffer = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop();  // Keep last partial line
  
  for (const line of lines) {
    if (line.startsWith('data:')) {
      const data = line.substring(5).trim();
      
      if (data === '[DONE]') {
        return;
      }
      
      try {
        const parsed = JSON.parse(data);
        
        if (parsed.done) break;
        
        if (parsed.content) {
          if (isFirstChunk) {
            botMessageContent.innerHTML = '';  // Clear typing indicator
            isFirstChunk = false;
          }
          fullResponse += parsed.content;
          botMessageContent.textContent = fullResponse;
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      } catch (e) {
        console.error("Error parsing stream:", e);
      }
    }
  }
}
```

### 8.3 Streaming Benefits

- **Perceived Speed**: User sees response appearing immediately
- **Better UX**: Typing effect feels more natural
- **Memory Efficient**: Chunks processed as received
- **Real-time Updates**: DOM updated continuously during generation

---

## 9. FRONTEND CHAT IMPLEMENTATIONS

### 9.1 Main Chat Widget (Standalone Section)

**HTML Structure**:
```html
<div class="chat-section">
  <div class="chat-messages">
    <!-- Messages added here -->
  </div>
  <div class="chat-input-wrapper">
    <input class="chat-input" placeholder="...">
    <button class="chat-submit">Send</button>
  </div>
</div>
```

**JavaScript**: `/src/frontend/js/chatbot-logic.js`

**Features**:
- Full-page chat interface
- Message history visible
- Enter-to-send functionality
- Disabled state during loading

### 9.2 Mini Chat Widget (Floating Bubble)

**HTML Structure**:
```html
<div id="floating-chat-bubble" class="floating-bubble">
  <div class="floating-bubble-inner"><!-- Click to expand --></div>
  
  <div class="mini-chat-window">
    <div class="mini-chat-header"><!-- Title + Close --></div>
    <div class="mini-chat-messages"><!-- Messages --></div>
    <div class="mini-chat-input-container">
      <input class="mini-chat-input" placeholder="...">
      <button class="mini-chat-send">Send</button>
    </div>
  </div>
</div>
```

**JavaScript**: `/src/frontend/js/mini-chat.js`

**Features**:
- Expandable floating widget
- Chat history visible in bubble
- Click outside to close
- Message count-based abort control
- Independent from main chat

### 9.3 Floating Chat Input (Landing Page)

**HTML Structure**:
```html
<div id="floating-chat-input" class="floating-input-glassmorphism hidden">
  <input class="floating-input-field" placeholder="Ask Bubble...">
  <button class="floating-input-submit">Submit</button>
</div>
```

**JavaScript**: `/src/frontend/js/floating-chat-input.js`

**Behavior**:
- Hidden by default (only visible after scrolling past waitlist)
- On submit: Opens main chat section + sends message
- Or fallback to mini-chat if available
- Glassmorphism styling (frosted glass effect)

---

## 10. ANIMAT IONS & UX ENHANCEMENTS

### 10.1 Typing Indicator

**HTML**:
```html
<div class="typing-indicator">
  <span></span>
  <span></span>
  <span></span>
</div>
```

**Behavior**:
- Shown while streaming response
- Replaced with first chunk received
- Creates sense of "thinking"

### 10.2 Rotating Placeholder Animations

**File**: `/src/frontend/js/chatbot-animations.js`

**Features**:
- Cycles through placeholder suggestions
- Types them character-by-character
- 50ms per character typing
- 2 second pause between rotations
- Stops when input focused
- Resumes when input blurred

**Placeholders** (from translations):
```javascript
chat.rotatingPlaceholders: {
  en: ["Ask about strategies", "What's your mission?", ...],
  fr: ["Parlez des stratégies", "Quelle est votre mission?", ...]
}
```

### 10.3 UI State Management

**Disabled During Send**:
```javascript
chatInput.disabled = true;
chatSubmit.disabled = true;
chatSubmit.classList.add('disabled');
```

**Re-enabled After Response**:
```javascript
finally {
  chatInput.disabled = false;
  chatSubmit.disabled = false;
  chatSubmit.classList.remove('disabled');
  chatInput.focus();
}
```

---

## 11. LANGUAGE SUPPORT

### 11.1 Dynamic Language Detection

```javascript
const lang = document.documentElement.lang || 'en';

// System prompt uses selected language
const messages = [
  { role: "system", content: systemPrompt(language) }
];
```

**Language Options**:
- French (fr) - Default
- English (en) - Secondary

### 11.2 Placeholder Localization

```javascript
const placeholders = translations['chat.rotatingPlaceholders'][lang];

// Falls back to hardcoded if not available
const fallbacks = {
  en: ["Ask anything about our platform", ...],
  fr: ["Posez vos questions", ...]
};
```

---

## 12. ERROR HANDLING

### 12.1 Frontend Error Display

```javascript
catch (error) {
  botMessageContent.textContent = `Error: ${error.message}`;
}
```

**Error Messages**:
- "Message limit reached" (429 rate limit)
- "An error occurred." (generic errors)
- Network timeouts
- Parsing errors (silent fail)

### 12.2 Backend Error Handling

```javascript
try {
  // Try each model in sequence
} catch (error) {
  console.error("Error in chat endpoint:", error);
  
  if (!res.headersSent) {
    res.status(500).json({
      error: "An error occurred while processing your request.",
      details: error.message
    });
  }
}
```

**Error Types Handled**:
- All models failed (500)
- Missing API key (500)
- Invalid language parameter (200 - proceeds with default)
- Empty message (400)

---

## 13. ANALYTICS & TRACKING

### 13.1 Portfolio Simulator Events

**Function**: `trackSimulatorEvent(action, params)`

**Events Tracked**:
- `strategy_changed` - Strategy pill selected
- `period_selected` - Time period changed
- `custom_strategy_applied` - Custom mix created
- `custom_strategy_reset` - Reset to default
- `export_chart_png` - Chart exported
- `export_metrics_csv` - Metrics exported
- `simulator_data_loaded` - Data fetch completed

### 13.2 Floating Input Events

**Events Tracked**:
- `floating_input_submitted` - User typed message
- `floating_input_forwarded` - Message sent to chat

---

## 14. CURRENT PRODUCTION STATUS

### 14.1 What's Production-Ready

- ✅ Main chat widget (full-page)
- ✅ Mini-chat bubble (floating)
- ✅ Floating input overlay
- ✅ SSE streaming
- ✅ Model fallback chain
- ✅ Portfolio simulator integration
- ✅ Bilingual support (FR/EN)
- ✅ Rate limiting (basic)
- ✅ Session management

### 14.2 What's NOT Production-Ready

- ❌ Conversation memory/history
- ❌ User authentication
- ❌ Persistent chat storage
- ❌ Advanced rate limiting (IP-based, sliding window)
- ❌ Portfolio context sent to chatbot
- ❌ Request cancellation/interruption
- ❌ Error recovery & retry logic
- ❌ Analytics dashboard
- ❌ Conversation export/backup

---

## 15. RECOMMENDED IMPROVEMENTS (Priority Order)

### Phase 1: Memory & Continuity (High Impact)
1. Add conversation history tracking in backend/database
2. Send previous N messages with each request
3. Add user ID/session tracking
4. Implement conversation reset functionality

### Phase 2: Enhanced Context (Medium Impact)
1. Send portfolio context to `/api/chat/portfolio` endpoint
2. Include user's current strategy selection
3. Track portfolio-specific interactions
4. Enable follow-up questions about simulator

### Phase 3: Robustness (Medium Impact)
1. Implement AbortController for request cancellation
2. Add IP-based rate limiting (not just session)
3. Implement retry logic with exponential backoff
4. Add error recovery and suggestion responses

### Phase 4: User Experience (Lower Priority)
1. Typing indicators for slow networks
2. Message editing capability
3. Conversation branching/alternatives
4. Conversation search & history sidebar
5. Export conversation as PDF/markdown

---

## 16. FILE STRUCTURE REFERENCE

```
src/backend/
├── controllers/
│   └── chat.controller.js          # Main chatbot logic
├── middleware/
│   ├── rate-limiter.js             # 10 msg/session limit
│   └── session.js                  # Express-session config
├── routes/
│   └── chat.routes.js              # API routes
└── config/
    └── env.js                      # Environment variables

src/frontend/
├── js/
│   ├── chatbot-logic.js            # Main chat UI
│   ├── chatbot-animations.js       # Placeholder rotation
│   ├── mini-chat.js                # Floating bubble
│   └── floating-chat-input.js      # Overlay input
├── pages/
│   ├── index.html                  # Main page with chat
│   ├── portfolio-simulator.html    # Simulator page
│   └── en/index.html               # English version
└── i18n/
    └── translations.js             # FR/EN text

docs/company/
├── mission_texte.txt               # Loaded into prompt
├── Elevatorpitch5min.md            # Loaded into prompt
└── PointsdeDépartStratégiquesBubble.md  # Loaded
```

---

## 17. KEY TAKEAWAYS

1. **Stateless Design**: Each message is isolated - no conversation memory
2. **OpenRouter Abstraction**: Leverages multiple LLM providers automatically
3. **Streaming-First**: All responses use Server-Sent Events for real-time rendering
4. **Simple Rate Limiting**: Session-based (10 msgs) - not suitable for production with auth
5. **Context Injection**: System prompt includes company docs + optional portfolio state
6. **Bilingual**: French/English support with language enforcement
7. **Modular Frontend**: Multiple chat implementations (main, mini, floating input)
8. **Portfolio Aware**: Special endpoint for simulator context (mostly unused currently)
9. **Production Gap**: Missing conversation history, user auth, and persistent storage
10. **Low Barrier to Enhancement**: Architecture is clean and modular for improvements

