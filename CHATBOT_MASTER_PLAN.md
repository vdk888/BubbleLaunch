# Chatbot Master Plan - BubbleLaunch

**Created**: 2026-01-13
**Status**: Implementation Ready
**Compliance**: 74% → Target 95%

---

## Executive Summary

This document consolidates all chatbot improvement documentation into a single actionable plan. It replaces:
- ANTHROPIC_COMPLIANCE_REPORT.md
- ANTHROPIC_INTEGRATION_ROADMAP.md
- ANTHROPIC_QUICK_REFERENCE.md
- TOOL_IMPLEMENTATION_PLAN.md
- TOOL_IMPLEMENTATION_COMPARISON.md
- CHART_VISUALIZATION_GAP_ANALYSIS.md
- BUG_FIX_TOOL_EXECUTION.md
- START_HERE.md
- DOCUMENTATION_INDEX.md
- DOCUMENTATION_CLEANUP_LOG.md

**Goal**: Transform chatbot into a conversion engine: Playground → Simulator → Client

---

## Part 1: Current State

### Critical Bug Fixed (2026-01-13)
- **Location**: `chat.controller.js` line 855
- **Issue**: `pendingTools` (plural) → `pendingTool` (singular)
- **Status**: FIXED - All 5 tools now execute

### Current Tools (5 total)

| Tool | Page | Status | Data Source |
|------|------|--------|-------------|
| `get_profile_visualization` | Playground | Works but placeholder data | Needs BubbleAgentMemory |
| `recommend_learning_path` | Playground | Works | Static (acceptable) |
| `explain_bot_trade` | Arena | Works | arenaTimelineService |
| `backtest_strategy` | Simulator | Works | portfolioService |
| `compare_strategies` | Arena/Simulator | Works | Static (acceptable) |

### Compliance Score: 74%

| Component | Score | Gap |
|-----------|-------|-----|
| Tool Schemas | 85% | Minor - add min/max |
| Tool Invocation | 80% | Missing parallel support |
| Message Format | 70% | Missing is_error/text |
| Error Handling | 50% | No structured protocol |
| Tool Result Display | 2% | CRITICAL - Frontend ignores |
| Data Integrity | 60% | Profile uses placeholders |
| Input Validation | 0% | No AJV |

---

## Part 2: Implementation Plan

### Phase 1: Critical Fixes (4-6 hours) → 95% Compliance

#### Fix 1: Tool Result Visualization (2-3 hours)
**Priority**: CRITICAL
**Impact**: Users can see charts/metrics from tools

**Files to modify**:
- `src/frontend/js/chat-side-panel.js` (lines 1263-1300)
- NEW: `src/frontend/js/tool-result-visualizer.js`
- `src/frontend/assets/styles/styles.css` (append)

**Implementation**:
```javascript
// chat-side-panel.js line 1263
if (payload.tool_result) {
  handleToolResult(payload.tool_result, botMessageContent);
  continue;
}

function handleToolResult({ name, result }) {
  if (!result?.success) return;

  switch (name) {
    case 'backtest_strategy':
      ToolResultVisualizer.renderBacktestChart(result.data, container);
      break;
    case 'get_profile_visualization':
      ToolResultVisualizer.renderProfileCard(result.data, container);
      break;
    case 'compare_strategies':
      ToolResultVisualizer.renderComparisonTable(result.data, container);
      break;
    case 'explain_bot_trade':
      ToolResultVisualizer.renderTradeExplanation(result.data, container);
      break;
  }
}
```

#### Fix 2: Wire Profile to Real Data (1-2 hours)
**Priority**: CRITICAL
**Impact**: Personalized recommendations

**Files to modify**:
- `src/frontend/js/chat-side-panel.js` (API call)
- `src/backend/controllers/chat.controller.js` (extract profile)
- `src/backend/services/toolExecutionService.js` (lines 45-56)

**Implementation**:
```javascript
// Frontend: Pass profile in API call
fetch('/api/chat', {
  body: JSON.stringify({
    message: userMessage,
    pageContext: pageContext,
    userProfile: Memory.getProfile(),  // ADD THIS
    userProfileContext: Memory.getContextForLLM()
  })
});

// Backend toolExecutionService.js
execute: async ({ include_recommendations = false }, { userProfile } = {}) => {
  if (!userProfile?.riskScore) {
    return {
      type: "PROFILE_INCOMPLETE",
      message: "Profile not yet discovered",
      hint: "Continue chatting to build your profile"
    };
  }
  // Use real data...
}
```

#### Fix 3: Message Format Validation (1 hour)
**Priority**: IMPORTANT
**Impact**: Anthropic compliance

**File**: `src/backend/controllers/chat.controller.js` (lines 798-814)

```javascript
const toolResultMsg = {
  role: 'user',
  content: [{
    type: 'tool_result',
    tool_use_id: toolCallId,
    content: JSON.stringify(toolResult),
    is_error: false,  // ADD
    text: `${toolName} executed successfully`  // ADD
  }]
};
```

---

### Phase 2: Simulator-Chat Integration (4-6 hours)

**Goal**: Backtest results visible in BOTH chat AND simulator page

#### Step 2.1: Create Event Bus
**NEW File**: `src/frontend/js/strategy-event-bus.js`

```javascript
class StrategyEventBus {
  constructor() { this.listeners = {}; }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    (this.listeners[event] || []).forEach(cb => cb(data));
  }

  static EVENTS = {
    BACKTEST_COMPLETE: 'backtest:complete',
    ALLOCATION_CHANGED: 'allocation:changed',
    STRATEGY_SAVED: 'strategy:saved'
  };
}

window.StrategyEventBus = new StrategyEventBus();
```

#### Step 2.2: Emit from Chat
**File**: `src/frontend/js/tool-result-visualizer.js`

```javascript
function renderBacktestChart(data, container) {
  // Render in chat...

  // Emit to simulator
  if (window.StrategyEventBus) {
    window.StrategyEventBus.emit('backtest:complete', {
      strategy_name: data.strategy_name,
      allocation: data.allocation,
      metrics: data.metrics,
      chartData: data.chartData
    });
  }
}
```

#### Step 2.3: Listen in Simulator
**File**: `src/frontend/js/portfolio-simulator.js`

```javascript
if (window.StrategyEventBus) {
  window.StrategyEventBus.on('backtest:complete', (data) => {
    addCustomStrategy(data.strategy_name, data.chartData, data.metrics);
    highlightStrategy(data.strategy_name);
  });
}
```

---

### Phase 3: New Tools (8-12 hours)

#### Playground Tools (Profile → Strategy flow)

**3.1 explain_risk_profile**
```javascript
{
  name: 'explain_risk_profile',
  description: `Explain what the user's risk profile means in practical terms.
    Use when user asks "What does my 65 risk score mean?" or "Am I too aggressive?"`,
  input_schema: {
    type: 'object',
    properties: {
      aspect: {
        type: 'string',
        enum: ['overview', 'allocation', 'timeline', 'volatility'],
        description: 'Which aspect to explain'
      }
    },
    additionalProperties: false
  }
}
```

**3.2 suggest_allocation**
```javascript
{
  name: 'suggest_allocation',
  description: `Suggest portfolio allocation based on user's profile.
    Use when user asks "What allocation should I try?" or "Start building for me"`,
  input_schema: {
    type: 'object',
    properties: {
      optimize_for: {
        type: 'string',
        enum: ['return', 'stability', 'balanced'],
        description: 'Optimization target'
      }
    },
    additionalProperties: false
  }
}
```

#### Simulator Tools (Strategy building)

**3.3 stress_test_portfolio**
```javascript
{
  name: 'stress_test_portfolio',
  description: `Test allocation against historical market crashes.
    Use when user asks "How would this handle 2008?" or "What if there's a crash?"`,
  input_schema: {
    type: 'object',
    properties: {
      allocation: {
        type: 'object',
        properties: {
          SPY: { type: 'number' },
          IEF: { type: 'number' },
          GLD: { type: 'number' }
        }
      },
      events: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['2008_crisis', '2020_covid', '2022_inflation', 'dotcom_2000']
        }
      }
    },
    required: ['allocation'],
    additionalProperties: false
  }
}
```

**3.4 what_if_scenario**
```javascript
{
  name: 'what_if_scenario',
  description: `Run hypothetical scenarios on allocations.
    Use when user asks "What if I add more gold?" or "What happens with 2x leverage?"`,
  input_schema: {
    type: 'object',
    properties: {
      current_allocation: { type: 'object' },
      scenario: {
        type: 'string',
        enum: ['add_gold', 'add_bonds', 'add_leverage', 'reduce_stocks']
      },
      magnitude: { type: 'number' }
    },
    additionalProperties: false
  }
}
```

#### Educational Tools

**3.5 explain_metric**
```javascript
{
  name: 'explain_metric',
  description: `Explain portfolio metrics in simple terms.
    Use when user asks "What is Sharpe ratio?" or "Why does volatility matter?"`,
  input_schema: {
    type: 'object',
    properties: {
      metric: {
        type: 'string',
        enum: ['sharpe', 'volatility', 'drawdown', 'cagr', 'calmar']
      },
      context: {
        type: 'string',
        enum: ['beginner', 'intermediate', 'with_example']
      }
    },
    additionalProperties: false
  }
}
```

---

### Phase 4: Production Hardening (5-8 hours)

#### 4.1 Parallel Tool Execution (2-3 hours)
**File**: `src/backend/controllers/chat.controller.js`

```javascript
if (firstPass.pendingTools?.length > 1) {
  const results = await Promise.all(
    firstPass.pendingTools.map(tool =>
      toolExecutionService.executeTool(tool.name, tool.input)
    )
  );

  // Format all results in single message
  const toolResultMsg = {
    role: 'user',
    content: results.map((r, idx) => ({
      type: 'tool_result',
      tool_use_id: firstPass.pendingTools[idx].id,
      content: JSON.stringify(r),
      is_error: false
    }))
  };
}
```

#### 4.2 Structured Error Protocol (1-2 hours)
**File**: `src/backend/services/toolExecutionService.js`

```javascript
function createToolError(type, message, hint) {
  return {
    type: "ERROR",
    error_type: type,
    message: message,
    hint: hint,
    timestamp: new Date().toISOString()
  };
}

// Usage
if (!userProfile?.riskScore) {
  return createToolError(
    "DATA_NOT_AVAILABLE",
    "Profile not yet discovered",
    "Continue chatting to build your profile"
  );
}
```

#### 4.3 Input Schema Validation (2-3 hours)
**File**: `src/backend/services/toolExecutionService.js`

```javascript
const Ajv = require('ajv');
const ajv = new Ajv({ strict: true });

async function executeTool(toolName, input) {
  const tool = TOOLS[toolName];

  const validate = ajv.compile(tool.input_schema);
  if (!validate(input)) {
    return createToolError(
      "SCHEMA_VALIDATION_ERROR",
      "Invalid input",
      validate.errors.map(e => e.message).join('; ')
    );
  }

  return await tool.execute(input);
}
```

---

## Part 3: Tool Routing

### Updated getToolsForPageContext()

```javascript
function getToolsForPageContext(pageContext) {
  switch (pageContext) {
    case 'playground':
      return getToolDefinitions([
        'get_profile_visualization',
        'recommend_learning_path',
        'explain_risk_profile',    // NEW
        'suggest_allocation'       // NEW
      ]);

    case 'arena':
    case 'education-arena':
      return getToolDefinitions([
        'explain_bot_trade',
        'compare_strategies'
      ]);

    case 'simulator':
    case 'education-simulator':
      return getToolDefinitions([
        'backtest_strategy',
        'compare_strategies',
        'suggest_allocation',       // NEW
        'stress_test_portfolio',    // NEW
        'what_if_scenario',         // NEW
        'explain_metric'            // NEW
      ]);

    default:
      return [];
  }
}
```

---

## Part 4: Testing Checklist

### Phase 1 Tests
- [ ] User requests backtest → Chart displays in chat
- [ ] User asks "show my profile" → Real profile data shown
- [ ] Tool results have is_error/text fields

### Phase 2 Tests
- [ ] Backtest from chat → Simulator chart updates
- [ ] Strategy saved → Appears in simulator list
- [ ] Visual feedback confirms sync

### Phase 3 Tests
- [ ] explain_risk_profile returns personalized explanation
- [ ] suggest_allocation uses real profile
- [ ] stress_test_portfolio shows historical performance
- [ ] what_if_scenario compares before/after

### Phase 4 Tests
- [ ] Multiple tools execute in parallel
- [ ] Invalid inputs return structured errors
- [ ] Schema validation catches malformed inputs

---

## Part 5: File Reference

### Files to Modify

| File | Phase | Changes |
|------|-------|---------|
| `src/frontend/js/chat-side-panel.js` | 1, 2 | Tool result handler, API call |
| `src/backend/controllers/chat.controller.js` | 1, 4 | Message format, parallel tools |
| `src/backend/services/toolExecutionService.js` | 1, 3, 4 | Profile wiring, new tools, validation |
| `src/frontend/js/portfolio-simulator.js` | 2 | Event listener |
| `src/frontend/assets/styles/styles.css` | 1 | Visualization CSS |

### Files to Create

| File | Phase | Purpose |
|------|-------|---------|
| `src/frontend/js/tool-result-visualizer.js` | 1 | Visualization component |
| `src/frontend/js/strategy-event-bus.js` | 2 | Cross-component events |

---

## Part 6: Timeline

| Phase | Hours | Outcome |
|-------|-------|---------|
| Phase 1 | 4-6 | 95% compliance, users see charts |
| Phase 2 | 4-6 | Simulator-chat sync working |
| Phase 3 | 8-12 | 8 new tools available |
| Phase 4 | 5-8 | Production hardened |
| **Total** | **21-32** | **Full conversion engine** |

---

## Anthropic Documentation References

| Topic | URL |
|-------|-----|
| Tool Use Overview | https://platform.claude.com/docs/en/agents-and-tools/tool-use |
| Best Practices | https://platform.claude.com/docs/en/agents-and-tools/tool-use/best-practices |
| Parallel Tools | https://platform.claude.com/docs/en/agents-and-tools/tool-use#parallel-tool-execution |
| Error Handling | https://platform.claude.com/docs/en/agents-and-tools/tool-use#error-handling |

---

**Next Step**: Run implementation agents for Phase 1
