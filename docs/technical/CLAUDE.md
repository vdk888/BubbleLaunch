# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Start the application:**
```bash
npm start
```
This starts the Express server on port 3002 (or PORT from environment).

**Install dependencies:**
```bash
npm install
```

## Architecture Overview

This is a **Bubble waitlist landing page** - a Node.js/Express application that showcases an AI-powered investment platform.

### Project Structure

The project has been reorganized into a clean structure:
- `src/backend/` - Express.js server and API endpoints
- `src/frontend/` - Static frontend files (HTML, CSS, JS)
- `docs/` - Documentation and company materials
- `scripts/` - Utility scripts
- `helpers/` - Separate PersonalBlogBuilder project (unrelated)

### Core Components

**Backend (src/backend/server.js:1-328)**
- Express server with session management for rate limiting chat interactions (10 messages per session)
- Integration with Notion API for waitlist submissions
- OpenRouter AI integration with multi-model fallback system:
  - Primary: `google/gemini-2.0-flash-001`
  - Fallbacks: `openai/gpt-4.1-mini`, `mistralai/magistral-small-2506`, `deepseek/deepseek-r1-0528:free`
- Server-sent events (SSE) for streaming chat responses
- Document loading system that reads company materials at startup

**Frontend (src/frontend/)**
- **index.html** - Single-page landing with manifesto, vision, approach, and waitlist sections
- **js/chatbot-logic.js** - Chat UI with streaming response handling and typing indicators
- **js/script.js** - Language switching (EN/FR), form handling, and page interactions
- **i18n/translations.js** - Complete bilingual content management system
- **js/animations.js**, **js/chatbot-animations.js** - Visual effects and smooth interactions
- **js/charts.js** - Data visualizations for investment concepts
- **js/floating-bubble.js**, **js/mini-chat.js** - Additional UI components
- **assets/styles/styles.css** - Complete styling system
- **assets/images/** - SVG logo and favicon

### Key Features

1. **AI Chatbot** - Multilingual assistant (EN/FR) that explains Bubble's investment philosophy using company documents
2. **Waitlist System** - Notion-powered form submissions with profile selection
3. **Internationalization** - Complete EN/FR language support with dynamic switching
4. **Rate Limiting** - Session-based limit of 10 messages per user to manage costs
5. **Streaming Responses** - Real-time chat experience with typing indicators
6. **Fallback System** - Automatic model switching if primary LLM fails

### API Endpoints

- `POST /api/chat` - Chat endpoint with streaming responses and rate limiting
- `POST /subscribe` - Waitlist subscription endpoint (integrates with Notion)
- `POST /test-post` - Test endpoint for debugging
- `GET /` - Serves main landing page
- Static file serving for all frontend assets

### Environment Variables

Required in `.env`:
- `NOTION_TOKEN` - Notion API authentication token
- `NOTION_DATABASE_ID_WAITLIST` - Notion database ID for waitlist entries  
- `OPENROUTER_API_KEY` - OpenRouter API key for LLM access

Optional:
- `SESSION_SECRET` - Express session secret (has default fallback)
- `PORT` - Server port (defaults to 3002)

### Content Documents

The chatbot system prompt is built from company documents (docs/company/):
- `mission_texte.txt` - Core mission statement and values
- `Elevatorpitch5min.md` - 5-minute elevator pitch
- `PointsdeDépartStratégiquesBubble.md` - Strategic starting points

These are loaded at server startup via `loadAllDocuments()` function.

### Dependencies

Key packages:
- `express` - Web server framework
- `@notionhq/client` - Notion API integration
- `express-session` - Session management for rate limiting
- `axios` - HTTP client for OpenRouter API calls
- `@google/genai` - Google AI SDK (installed but not currently used)
- `dotenv` - Environment variable management

### File Path References

When working with this codebase, note these key file paths:
- Server entry point: `src/backend/server.js:10` (port configuration)
- Document loading: `src/backend/server.js:35-56` (company content)
- Chat API: `src/backend/server.js:193-255` (streaming chat logic)
- Frontend entry: `src/frontend/index.html:315` (served by server)
- Static files: `src/backend/server.js:321-323` (static file serving configuration)

### Notes

- The `helpers/PersonalBlogBuilder-main` directory contains a separate Astro-based blog project unrelated to the main Bubble application
- The project uses a clean separation between frontend and backend code
- All company branding and content is in French with English translations available