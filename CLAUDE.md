# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Bubble**, a fintech startup revolutionizing investment through AI-powered robo-advisory services. The application consists of a multilingual waitlist landing page with an integrated AI chatbot and blog system, built with vanilla JavaScript and Node.js/Express.

## Commands

### Development
- `npm start` - Start the development server (runs on port 3000)
- `node src/backend/server.js` - Direct server start

### Database Migration
- `./migrate.sh` - Run database migration script

### Testing
- No specific test framework is configured in package.json
- Manual testing endpoints are available at `/test-post` and `/api/test-freepik-connection`

## Architecture & Key Components

### Backend Structure (`src/backend/`)
- **`server.js`** - Main Express server with all API endpoints
- **`services/blogService.js`** - Notion CMS integration for blog content management
- **`services/freepikService.js`** - AI image generation service for blog articles

### Frontend Structure (`src/frontend/`)
- **`pages/`** - HTML pages (index.html, blog.html, blog-post.html)
- **`js/`** - Modular JavaScript components:
  - `script.js` - Main application logic
  - `chatbot-logic.js` - AI chatbot implementation
  - `blog.js` - Blog listing functionality
  - `blog-post.js` - Individual blog post rendering
  - `animations.js` - UI animations and effects
  - `floating-bubble.js` - Interactive bubble elements
- **`i18n/translations.js`** - Internationalization (French/English)
- **`assets/`** - Static resources (styles, images)

### Key Integrations
- **Notion API** - Content management for both waitlist database and blog posts
- **OpenRouter API** - LLM provider with fallback model rotation
- **Freepik API** - Automated blog image generation with intelligent caching
- **Express Sessions** - Chat rate limiting (10 messages per session)

### Environment Configuration
The application requires several environment variables in `.env`:
- `NOTION_TOKEN` - Waitlist database access
- `NOTION_DATABASE_ID_WAITLIST` - Waitlist storage
- `NOTION_BLOG_API_KEY` & `NOTION_BLOG_DATABASE_ID` - Blog CMS
- `OPENROUTER_API_KEY` - AI chatbot functionality
- `FREEPIK_API_KEY` - Blog image generation
- `SESSION_SECRET` - Session security

### Database Schema (Notion)
**Waitlist Database:** Properties include Nom (title), Email, Profil (select), Commentaires (rich_text)
**Blog Database:** Bilingual content with Title FR (title), Title EN (rich_text), Content Summary FR/EN, Content FR/EN, Status (select), Publication Date, Topic Tags (multi_select)

### Content Management
- Blog posts support bilingual content (French primary, English secondary)
- Automatic slug generation from French titles
- AI-powered image generation with fallback to thematic Unsplash images
- Status-based publishing (Published/Scheduled with date validation)

### Frontend Features
- Responsive multilingual design with language toggle
- Interactive AI chatbot with streaming responses
- Dynamic blog system with bilingual content rendering
- Real-time form validation and submission
- Animated UI elements and smooth transitions

## Development Notes

### Blog System
- Uses Notion as headless CMS with rich bilingual content support
- Automatic image generation for articles using AI
- Intelligent caching system for generated images
- Falls back to thematic stock images when AI generation fails

### Chatbot Implementation
- Streams responses using Server-Sent Events (SSE)
- Model fallback system with multiple LLM providers
- Context-aware responses about Bubble's mission and services
- Integrated rate limiting for abuse prevention

### Image Generation
- Freepik API integration with intelligent prompt generation
- Persistent caching system to avoid regeneration
- Thematic fallback images based on article tags
- Cache management endpoints for debugging

### Deployment Considerations
- Designed for cloud deployment (includes Dockerfile and replit.nix)
- Graceful shutdown handling for cache persistence
- Environment-specific configurations
- Static file serving with proper routing