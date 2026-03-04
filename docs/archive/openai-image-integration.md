# OpenAI Image Integration for Blog Articles

## Overview
Bubble generates bespoke blog illustrations using the OpenAI Images API (`gpt-image-1`). Each article prompt blends Bubble's visual identity with thematic keywords extracted from the article title, summary, and tags. Results are cached on disk and in memory to avoid unnecessary regeneration.

## Setup
1. **API Key**: Add `OPENAI_API_KEY` to your `.env` file (falls back to legacy `FREEPIK_API_KEY` for compatibility).
2. **Service**: `src/backend/services/imageService.js`
3. **Routes**: Managed via `src/backend/controllers/blog.controller.js` and `src/backend/routes/blog.routes.js`

## How It Works
1. **Prompt Engineering**  
   - Builds an abstract, tech-inspired description aligned with Bubble's brand guidelines.  
   - Injects content-specific keywords and randomized color/shape motifs for variety.  
   - Adds strict guardrails (no text, logos, or letterforms) to keep compositions abstract.
2. **OpenAI Generation (`gpt-image-1`)**  
   - Requests a single `1792x1024` HD image (horizontal layout).  
   - Returns data URI-encoded PNG by default.  
   - Logs minimal metadata for debugging without leaking prompts or keys.
3. **Caching Strategy**  
   - In-memory `Map` for fast lookups.  
   - Persistent JSON cache at `src/backend/cache/image-service-cache.json`.  
   - Legacy cache (`freepik-images.json`) is migrated automatically on startup.
4. **Fallbacks**  
   - When the API key is missing or a request fails, the service selects curated Unsplash URLs based on detected themes (Finance, AI, Data).

## API Touchpoints
- `GET /api/blog/test-image-service-connection` – Health check for OpenAI access.
- `POST /api/blog/test-image-generation` – Manual generation test endpoint.
- `POST /api/blog/generate-article-image` – Primary endpoint used by the blog ingestion pipeline.
- Cache utilities: `/api/blog/clear-image-cache`, `/api/blog/image-cache-stats`, `/api/blog/regenerate-all-images`.

## Testing
Use `/test-image-generation` in the browser to:
- Validate API connectivity.
- Generate sample images.
- Inspect cache stats and regeneration flows.

## Operational Notes
- **Rate Limits**: The service does not auto-throttle; monitor OpenAI usage to stay within enterprise quotas.
- **Graceful Shutdown**: `imageService.savePersistentCache()` runs on `SIGINT`/`SIGTERM`.
- **Logging**: Console logs highlight cache hits, prompt generation, and error scenarios without exposing the API key.
- **Cost Control**: One image per article, regenerated only when explicitly requested.
