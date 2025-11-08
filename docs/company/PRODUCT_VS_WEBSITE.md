# BubbleLaunch vs. Bubble Portfolio: Quick Reference

## At a Glance

| **Aspect** | **BubbleLaunch (This Codebase)** | **Bubble Portfolio (Separate Repo)** |
|------------|----------------------------------|-------------------------------------|
| **What is it?** | Marketing website for Bubble Invest | AI-agent portfolio management platform |
| **Purpose** | Present company & products; capture waitlist | Main product used by customers |
| **Technology Stack** | Vanilla JS + Node.js/Express | Python/Node backend + AI orchestration |
| **Distribution** | Single website (bubble.invest) | ChatGPT app (primary), web, MCP |
| **Repository** | This one (BubbleLaunch) | Separate GitHub repo (under development) |
| **Audience** | Website visitors, blog readers, B2B prospects | Product users: retail, CGP, asset managers |
| **Status** | Live & maintained | In development with ITEXUS supplier |

---

## BubbleLaunch Website (This Codebase)

### What's Included
- **Landing Page** - Hero section, vision statements, product overview
- **Portfolio Simulator** - Educational demo with 9 strategies, charts, metrics (not the real product)
- **Blog** - Articles on investment strategies, AI, quantitative finance
- **Businesses Page** - B2B consulting services (€3k-€30k AI automation projects)
- **Waitlist** - Email capture for early adopters
- **AI Chatbot** - Educational chatbot answering questions about Bubble's philosophy and products

### Technology
- **Frontend**: Vanilla JavaScript, Chart.js, responsive CSS
- **Backend**: Node.js/Express
- **Database**: Notion API (content management for blog, waitlist)
- **Deployment**: Docker, replit.nix, cloud-ready

### Key Files
```
src/backend/
  ├── controllers/ - API endpoints
  ├── services/ - Notion integration, image generation, chatbot
  └── routes/ - Route definitions
src/frontend/
  ├── pages/ - HTML pages (index.html, blog.html, portfolio-simulator.html)
  ├── js/ - JavaScript modules (chatbot, blog, simulator)
  └── assets/ - Images, CSS, static files
```

### Purpose in Product Funnel
```
Visitor → Landing Page → Blog (education) → Portfolio Simulator (demo) → Waitlist
```

---

## Bubble Portfolio Product (Separate Repository)

### What It Is
The actual AI-agent-driven portfolio management platform that users will subscribe to. It's currently under development with external supplier ITEXUS.

### Core Architecture
1. **AI Agent Orchestrator** - Conversational interface (ChatGPT native app)
2. **Stock Screener** - Pluggable data sources (Uncle Stock, FMP, Bloomberg future)
3. **Backtesting Engine** - Tests multiple strategies on historical data
4. **Portfolio Optimizer** - Risk Parity, Regime Detection, allocation algorithms
5. **Broker Integration** - OAuth connections to IBKR, Alpaca, Saxo, others
6. **Order Execution** - Automated or manual order generation
7. **Billing System** - Stripe/PayPal integration, usage-based cost tracking
8. **Compliance** - KYC, GDPR, AMF certification framework

### Three-Tier System
- **Retail**: Full automated portfolio management (€0-10/month)
- **CGP (Wealth Advisors)**: Multi-client admin dashboard
- **Asset Managers**: Screening/backtesting tools for funds

### Distribution
- **Primary**: ChatGPT native app (needs OpenAI approval)
- **Secondary**: Web application (bubble.invest)
- **Tertiary**: MCP (Model Context Protocol) for Claude, ChatGPT, other AI tools
- **Future**: Mobile apps

---

## How They Connect

### User Journey
```
1. Find Bubble via search → 2. Land on bubbleinvest.org
3. Read blog articles → 4. Try educational simulator
5. Sign up for waitlist → 6. Join Bubble Portfolio beta
7. Use ChatGPT app or web → 8. Execute AI-recommended trades
```

### Content Relationship
- **Blog Content**: Educates about concepts users encounter in product (risk parity, momentum, Sharpe ratio)
- **Simulator**: Simplified preview of product's backtesting capabilities
- **Waitlist**: Feeds into product repository's user database
- **Chatbot**: Answers FAQ about philosophy; full product has more advanced AI agent

### Technology Relationship
- **Separate Codebases**: Different tech stacks, deployment models
- **Shared Vision**: Both present Bubble's mission of democratized, transparent investing
- **No Direct Coupling**: Changes to website don't affect product and vice versa

---

## Important for Claude Code Development

### When Working on BubbleLaunch (This Codebase)

✅ **DO**:
- Understand that this is a **marketing website**, not the product
- When writing blog posts or website copy, keep product features in context
- Reference product capabilities accurately (screener, backtesting, etc.)
- Link educational content to full product experience

❌ **DON'T**:
- Try to build stock screening functionality here (it's in product repo)
- Modify broker integration code (that's product repo)
- Build billing/payment systems here
- Make changes assuming this is the actual trading platform

### When Claude Code Mentions "Bubble Portfolio"
- Clarify if you're talking about **website simulator demo** or **actual product**
- Website simulator = educational preview (9 strategies, static time periods)
- Actual product = AI agent + broker execution (separate repository, under development)

---

## Current Development Status

### BubbleLaunch Website
- ✅ **Live**: Landing page, blog, portfolio simulator, chatbot
- ✅ **Recent updates**: Responsive design, leverage controls, Calmar metrics
- 🔄 **Ongoing**: Blog content, SEO optimization
- 🔜 **Future**: Waitlist email integration improvements, analytics

### Bubble Portfolio (Separate Repo)
- 🔄 **In development**: ITEXUS working on main platform
- 🔄 **Current status**: Beta for founders' portfolios (IBKR, Alpaca, Saxo automation)
- ⏳ **Next**: Regulatory compliance, ChatGPT app SDK integration
- 🚀 **Target**: Launch to retail users post-beta

---

## Key Contacts / Resources

- **Bubble Team**: Co-founders (Joris + partner)
- **ITEXUS**: External supplier for Bubble Portfolio development
- **GitHub Repos**:
  - BubbleLaunch: This repository
  - Bubble Portfolio: Separate repository (under ITEXUS development)

---

## Questions?

**Is X a website feature or product feature?**
- Website: Landing page, blog, simulator, chatbot, businesses page, waitlist
- Product: Stock screening, strategy backtesting, broker execution, multi-tier management, billing

**Where do I make changes?**
- Website copy, blog posts, simulator UI: **This repository (BubbleLaunch)**
- Product features, broker APIs, billing: **Separate Bubble Portfolio repository**

**How do I understand what's coming in the product?**
- Read: `docs/company/bubble_portfolio_system.md` for technical architecture
- Read: `docs/company/ITEXUS_REQUIREMENTS.md` (if available) for full product vision
- Ask: Check with team if unsure about scope
