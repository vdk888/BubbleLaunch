# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Start the application:**
```bash
npm start
```
This starts the Express server on port 3000 (or PORT from environment).

**Install dependencies:**
```bash
npm install
```

**Development mode (for debugging):**
```bash
# Enable debug mode for better error logging
DEBUG=* npm start
```

**Important:** The user should run the terminal commands manually in a separate terminal window. Do not run the server in the background - let the user execute `npm start` themselves to maintain control over the application.

## Architecture Overview

This is a **Bubble waitlist landing page** - a Node.js/Express application that showcases an AI-powered investment platform with a focus on transparency, automation, and low-cost investing.

### Project Structure

The project follows a clean, organized structure:
- `src/backend/` - Express.js server and API endpoints
- `src/frontend/` - Static frontend files (HTML, CSS, JS)
  - `pages/` - HTML pages (index, blog, blog-post)
  - `js/` - JavaScript modules for UI logic
  - `i18n/` - Internationalization (translations.js)
  - `assets/` - Static assets (images, styles)
- `docs/` - Documentation and company materials
  - `company/` - Mission, pitch, strategic documents
  - `technical/` - Technical documentation
  - `references/` - Reference materials
- `scripts/` - Utility scripts
- `helpers/` - Separate PersonalBlogBuilder project (unrelated to main app)
- `tests/` - Test directories (unit, integration, e2e)

### Core Components

**Backend (src/backend/server.js)**
- Express server with session management for rate limiting (10 messages per session)
- Multiple model fallback system for AI chat:
  - Primary: `google/gemini-2.0-flash-001`
  - Fallbacks: `openai/gpt-4.1-mini`, `mistralai/magistral-small-2506`, `deepseek/deepseek-r1-0528:free`
- Server-sent events (SSE) for streaming chat responses
- Document loading system that reads company materials at startup

**Frontend Architecture:**
- **index.html** - Main landing page with sections: manifesto, vision, approach, waitlist
- **blog.html** - Blog index page with featured post and grid layout
- **blog-post.html** - Individual blog post template
- **JavaScript modules:**
  - `chatbot-logic.js` - Chat UI with streaming responses, markdown rendering, typing indicators
  - `script.js` - Language switching (EN/FR), form handling, smooth scrolling
  - `translations.js` - Complete bilingual content management
  - `animations.js` - Intersection observer animations, fade effects
  - `chatbot-animations.js` - Chat-specific animations and effects
  - `charts.js` - Data visualizations for investment concepts
  - `floating-bubble.js`, `mini-chat.js` - Additional UI components
  - `blog.js`, `blog-post.js` - Blog functionality

### Key Features

1. **AI Chatbot** - Multilingual assistant (EN/FR) that explains Bubble's investment philosophy using company documents
2. **Waitlist System** - Notion-powered form submissions with investor profile selection
3. **Blog System** - Complete blog functionality with Notion CMS and Telegram publishing
4. **Internationalization** - Full EN/FR support with dynamic language switching
5. **Rate Limiting** - Session-based limit of 10 messages per user
6. **Streaming Responses** - Real-time chat experience with typing indicators
7. **Model Fallback** - Automatic switching between AI models if primary fails

### API Endpoints

**Main Application:**
- `POST /api/chat` - Chat endpoint with streaming responses (src/backend/server.js:194)
- `POST /subscribe` - Waitlist subscription (src/backend/server.js:259)
- `GET /` - Serves main landing page

**Blog System:**
- `GET /blog` - Blog index page
- `GET /blog/:slug` - Individual blog post page
- `GET /api/blog/posts` - JSON API for all published posts
- `GET /api/blog/post/:slug` - JSON API for individual post
- `POST /telegram/webhook/:token` - Telegram webhook for blog publishing

**Static Files:**
- Express serves static files from `src/frontend/` directory

### Environment Variables

**Required in `.env`:**
- `NOTION_TOKEN` - Notion API token for waitlist database
- `NOTION_DATABASE_ID_WAITLIST` - Notion database ID for waitlist entries
- `OPENROUTER_API_KEY` - OpenRouter API key for LLM access

**Blog-specific (optional):**
- `NOTION_BLOG_API_KEY` - Notion API token for blog database
- `NOTION_BLOG_DATABASE_ID` - Notion database ID for blog posts
- `TELEGRAM_BOT_TOKEN` - Telegram bot token for publishing
- `WEBHOOK_URL` - Webhook URL for Telegram bot (production)

**Optional:**
- `SESSION_SECRET` - Express session secret (has default fallback)
- `PORT` - Server port (defaults to 3000)

### Content Documents

The chatbot loads these company documents at startup:
- `docs/company/mission_texte.txt` - Core mission and values
- `docs/company/Elevatorpitch5min.md` - 5-minute elevator pitch
- `docs/company/PointsdeDépartStratégiquesBubble.md` - Strategic starting points

These documents form the knowledge base for the AI assistant's responses about Bubble's philosophy and approach.

### Blog System Architecture

**Content Management:**
- Notion as headless CMS for blog posts
- Properties: Title, Slug, Summary, Status, Published Date, Featured Image, Tags
- Markdown content with HTML conversion
- Rich content support (images, code blocks, formatting)

**Publishing Workflow:**
1. Chat with Telegram bot to brainstorm ideas
2. Use `/publish` command to generate blog post from conversation
3. Post automatically created in Notion and published to website
4. Further editing available directly in Notion

**Key Services:**
- `src/backend/services/blogService.js` - Notion blog operations
- `src/backend/services/telegramService.js` - Telegram bot and publishing logic

### Important Implementation Details

**Rate Limiting:**
- Uses express-session to track message count per session
- Limit of 10 messages per user session to manage API costs
- Session data stored in memory (consider Redis for production)

**AI Model Fallback:**
- Implements retry logic with multiple LLM providers
- Gracefully handles API failures with user-friendly error messages
- Streams responses using Server-Sent Events for better UX

**Static File Serving:**
- Frontend files served directly from `src/frontend/`
- All paths in HTML files are relative for easy deployment

**Error Handling:**
- Comprehensive error handling in chat endpoint
- Fallback to sample posts when blog not configured
- User-friendly error messages in both languages

### Code Style Guidelines

- Use async/await for asynchronous operations
- Implement proper error handling with try/catch blocks
- Keep frontend JavaScript modular and organized
- Maintain bilingual support in all user-facing content
- Follow existing naming conventions and file structure

### Development and Debugging

**No formal test framework** is configured. Testing is done manually through:
- Browser testing of the frontend interface
- Manual API endpoint testing
- Cross-language testing (EN/FR)

**No lint/build scripts** are available. The project runs directly with Node.js without build steps.

**Debugging tips:**
- Use `DEBUG=*` environment variable for verbose logging
- Check browser console for frontend JavaScript errors
- Monitor server logs for API and backend issues
- Verify environment variables are properly set in `.env`