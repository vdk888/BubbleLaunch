# Personal Blog Builder with Notion & Telegram Integration

A multi-channel AI Journey Blog with Notion and Telegram integrations for effortless content creation and publishing.

## Features

- AI-powered chat interface for brainstorming blog content
- Telegram bot integration for mobile content creation
- Notion database integration for publishing and organizing blog posts
- Responsive web interface for blog viewing and management

## Development

To run the application locally:

```bash
npm run dev:all
```

This will start:
- Astro frontend server (port 5000)
- Express backend server (port 4000)

## Deployment

To deploy the application on Replit:

1. Ensure all required secrets are set:
   - `NOTION_API_KEY`: Your Notion API key
   - `NOTION_DATABASE_ID`: Your Notion database ID
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
   - `ADMIN_PASSWORD`: Password for admin access
   - `WEBHOOK_URL` (optional): For Telegram bot webhook mode in production

2. **Important:** Before deploying, edit the `.replit` file to use the production deployment configuration:
   ```
   [deployment]
   deploymentTarget = "autoscale"
   build = ["sh", "-c", "bash deploy.sh"]
   run = ["sh", "-c", "node start-production.js"]
   ```

3. The provided deployment scripts handle:
   - Building the Astro frontend (which copies the files to `dist/client`)
   - Compiling the TypeScript backend server
   - Creating a unified server that serves both the API and the Astro static files

4. To manually test the production build:
   ```bash
   # Build the project
   bash deploy.sh
   
   # Start the production server
   node start-production.js
   ```

5. Once deployed via the Replit interface, your application will be available at:
   ```
   https://[your-repl-name].replit.app
   ```

6. For Telegram webhook functionality in production, set the `WEBHOOK_URL` environment variable. Otherwise, the bot will use polling mode.

### Troubleshooting Deployment

- If you see "Cannot GET /blog" errors, make sure the build process has completed successfully.
- Check the logs for any errors related to the build or server startup.
- Verify that port mappings in the `.replit` file are correct: port 3000 should be mapped to the web (port 80).

## Project Structure

- `/server`: Express.js backend
  - `/services`: Backend services (OpenAI, Notion, Telegram)
  - `routes.ts`: API route definitions
- `/src`: Astro frontend
  - `/pages`: Astro page components
  - `/components`: Reusable UI components
  - `/layouts`: Page layout templates
  - `/lib`: Frontend utilities and services
- `/scripts`: Utility scripts for project setup and management

## License

MIT