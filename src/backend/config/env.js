const fs = require("fs");
const path = require("path");

// Load secrets: prefer .env.runtime (SOPS-decrypted by scripts/load-secrets.sh)
// then fall back to .env (legacy/local-dev). Both are .gitignored.
const projectRoot = path.resolve(__dirname, "../../..");
const runtimeEnv = path.join(projectRoot, ".env.runtime");
if (fs.existsSync(runtimeEnv)) {
  require("dotenv").config({ path: runtimeEnv });
}
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
  NOTION_DATABASE_ID_NEWSLETTER: process.env.NOTION_DATABASE_ID_NEWSLETTER,

  // OpenRouter (Chat)
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,

  // OpenAI (Image generation)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || process.env.FREEPIK_API_KEY,

  // Session
  SESSION_SECRET: process.env.SESSION_SECRET,

  // Meta Conversions API (Phase 1 tracking — Jade msg 5085+)
  // Loaded at runtime from SOPS-encrypted secrets.sops.env via scripts/load-secrets.sh
  META_SYSTEM_USER_TOKEN: process.env.META_SYSTEM_USER_TOKEN,
  META_PIXEL_ID: process.env.META_PIXEL_ID,
  META_AD_ACCOUNT_ID: process.env.META_AD_ACCOUNT_ID,
  META_APP_ID: process.env.META_APP_ID,
  META_TEST_EVENT_CODE: process.env.META_TEST_EVENT_CODE, // optional, for CAPI debug via Events Manager
  META_GRAPH_API_VERSION: process.env.META_GRAPH_API_VERSION || "v21.0",

  // Google Ads (Phase 1 tracking)
  GOOGLE_ADS_CONVERSION_ID: process.env.GOOGLE_ADS_CONVERSION_ID,
  GOOGLE_ADS_CONVERSION_LABEL: process.env.GOOGLE_ADS_CONVERSION_LABEL,
  GOOGLE_ADS_CONVERSION_VALUE_EUR: parseFloat(process.env.GOOGLE_ADS_CONVERSION_VALUE_EUR || "200"),
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
