# Freepik API Integration for Blog Images

## Overview
This integration automatically generates article illustrations using the Freepik API based on article titles, summaries, and tags.

## Setup
1. **API Key**: Added to `.env` file as `FREEPIK_API_KEY`
2. **Service**: Located in `/src/backend/services/freepikService.js`
3. **Integration**: Automatically called when fetching blog posts

## How It Works
1. **Prompt Generation**: Creates optimized prompts based on article content
2. **Theme Detection**: Analyzes content for finance, AI, and tech themes
3. **Image Generation**: Uses Freepik's Imagen3 API
4. **Async Processing**: Polls for completion (up to 30 seconds)

## Smart Prompt Creation
The service automatically detects themes and creates appropriate prompts:

- **Finance + AI**: Modern fintech illustrations with charts and AI elements
- **Finance Only**: Professional financial charts and business growth visuals
- **AI Only**: Neural networks and digital innovation concepts
- **Tech**: Modern technology and innovation themes
- **Generic**: Professional business startup illustrations

## API Features Used
- **Model**: Imagen3 (Freepik's latest AI model)
- **Aspect Ratio**: 16:9 widescreen (perfect for blog headers)
- **Style**: Digital art with cinematic lighting
- **Safety**: Medium-level content filtering
- **Quality**: High-resolution professional illustrations

## Testing
Visit `/test-image` to test image generation with custom prompts.

## Integration Points
- **Blog Index**: Images displayed in post cards
- **Individual Posts**: Featured images in article headers
- **Automatic**: No manual intervention required

## Error Handling
- Graceful fallback when API is unavailable
- Comprehensive logging for debugging
- Non-blocking - blog still works without images

## Performance
- Images generated on-demand when posts are fetched
- Cached URLs returned by Freepik API
- Timeout protection (30 seconds max)

## Cost Optimization
- One image per article
- Only generates for published posts
- Smart prompt engineering reduces failed generations