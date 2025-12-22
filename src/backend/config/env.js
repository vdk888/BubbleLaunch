require("dotenv").config();

/**
 * Environment configuration and validation
 */
const env = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Notion
  NOTION_TOKEN: process.env.NOTION_TOKEN,
  NOTION_DATABASE_ID_WAITLIST: process.env.NOTION_DATABASE_ID_WAITLIST,
  NOTION_DATABASE_ID_BUSINESS: process.env.NOTION_DATABASE_ID_BUSINESS,
  NOTION_BLOG_API_KEY: process.env.NOTION_BLOG_API_KEY,
  NOTION_BLOG_DATABASE_ID: process.env.NOTION_BLOG_DATABASE_ID,
  NOTION_KNOWLEDGE_GARDEN_DATABASE_ID: process.env.NOTION_KNOWLEDGE_GARDEN_DATABASE_ID,

  // OpenRouter (Chat)
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,

  // OpenAI (Image generation)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || process.env.FREEPIK_API_KEY,

  // Session
  SESSION_SECRET: process.env.SESSION_SECRET,
};

/**
 * Validate required environment variables
 */
function validateEnv() {
  const required = [
    "SESSION_SECRET",
    "NOTION_TOKEN",
    "NOTION_DATABASE_ID_WAITLIST",
    "OPENROUTER_API_KEY",
  ];

  const missing = required.filter((key) => !env[key]);

  if (missing.length > 0) {
    console.warn(
      `⚠️  Missing environment variables: ${missing.join(", ")}`
    );
    console.warn(
      "Some features may not work. Please check your .env file."
    );
  }
}

// Validate on load
validateEnv();

module.exports = env;
