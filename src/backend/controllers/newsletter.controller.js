const { Client } = require("@notionhq/client");
const env = require("../config/env");

const notion = new Client({ auth: env.NOTION_TOKEN });
const databaseId = env.NOTION_DATABASE_ID_NEWSLETTER;

// Input validation constants
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_COMPANY_LENGTH = 200;

// Newsletter profiles (determined by role/profession)
const NEWSLETTER_PROFILES = ["Tech", "Finance", "Balanced"];

// Map internal profile -> the exact option in the Notion DB select "Votre profil"
// (DB options are: Tech, Finance, Equilibré). Verified against DB 251cfc52...0e3 on 2026-06-04.
const PROFILE_TO_NOTION = {
  Tech: "Tech",
  Finance: "Finance",
  Balanced: "Equilibré",
};

// Valid roles and their profile mappings (Role → Profile)
const ROLE_TO_PROFILE = {
  risk_manager: "Finance",
  portfolio_manager: "Finance",
  equity_research_analyst: "Finance",
  other_investment_professional: "Finance",
  non_professional_investor: "Balanced",
  tech_professional: "Tech",
  data_scientist: "Tech",
  software_engineer: "Tech",
  other: "Balanced",
};

// Role display names written to the Notion DB select "Rôle".
// The 4 finance roles + Data Scientist match existing DB options exactly.
// Tech Professional / Software Engineer / Autre have no DB option yet -> Notion
// auto-creates them on first write (kept in FR to stay consistent with the other
// options). Verified against DB 251cfc52...0e3 on 2026-06-04.
const ROLE_DISPLAY_NAMES = {
  risk_manager: "Risk Manager",
  portfolio_manager: "Portfolio Manager",
  equity_research_analyst: "Equity Research Analyst",
  other_investment_professional: "Autre Investisseur Professionnel",
  non_professional_investor: "Investisseur Non Professionnel",
  tech_professional: "Professionnel Tech",
  data_scientist: "Data Scientist",
  software_engineer: "Développeur / Ingénieur",
  other: "Autre",
};

const VALID_ROLES = Object.keys(ROLE_TO_PROFILE);

/**
 * Sanitize string input
 */
function sanitizeString(str, maxLength) {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, maxLength).replace(/[<>]/g, "");
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  if (typeof email !== "string" || email.length > MAX_EMAIL_LENGTH) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email);
}

/**
 * Determine newsletter profile based on role
 */
function determineProfile(role) {
  return ROLE_TO_PROFILE[role] || "Balanced";
}

/**
 * Handle newsletter subscription
 */
async function subscribeNewsletter(req, res) {
  const { name, email, profession, company } = req.body;

  // Required field validation
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  // Email validation
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  // Role validation (profession field from frontend maps to Role in Notion)
  const sanitizedRole = VALID_ROLES.includes(profession) ? profession : "other";
  const profile = determineProfile(sanitizedRole);
  const roleDisplayName = ROLE_DISPLAY_NAMES[sanitizedRole] || "Other";

  // Sanitize inputs
  const sanitizedName = sanitizeString(name || "", MAX_NAME_LENGTH);
  const sanitizedEmail = email.trim().toLowerCase().slice(0, MAX_EMAIL_LENGTH);
  const sanitizedCompany = sanitizeString(company || "", MAX_COMPANY_LENGTH);

  // Check if database ID is configured
  if (!databaseId) {
    console.error("Newsletter database ID not configured");
    return res.status(500).json({ error: "Newsletter service not configured." });
  }

  try {
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        "Subscriber Name": {
          title: [{ text: { content: sanitizedName || sanitizedEmail.split("@")[0] } }],
        },
        Email: {
          email: sanitizedEmail,
        },
        "Votre Entreprise": {
          rich_text: [{ text: { content: sanitizedCompany } }],
        },
        "Rôle": {
          select: { name: roleDisplayName },
        },
        "Votre profil": {
          select: { name: PROFILE_TO_NOTION[profile] || profile },
        },
        Source: {
          select: { name: "Newsletter Form" },
        },
        Subscribed: {
          checkbox: true,
        },
      },
    });

    res.status(201).json({ 
      message: "Successfully subscribed to newsletter!",
      profile: profile,
    });
  } catch (error) {
    console.error("Error adding to newsletter:", error);
    res.status(500).json({ error: "Failed to subscribe. Please try again later." });
  }
}

/**
 * Get available roles for frontend
 */
function getRoles(req, res) {
  const roles = [
    { value: "risk_manager", labelFr: "Risk Manager", labelEn: "Risk Manager", profile: "Finance" },
    { value: "portfolio_manager", labelFr: "Portfolio Manager", labelEn: "Portfolio Manager", profile: "Finance" },
    { value: "equity_research_analyst", labelFr: "Analyste Equity Research", labelEn: "Equity Research Analyst", profile: "Finance" },
    { value: "other_investment_professional", labelFr: "Autre professionnel de l'investissement", labelEn: "Other Investment Professional", profile: "Finance" },
    { value: "non_professional_investor", labelFr: "Investisseur non professionnel", labelEn: "Non-Professional Investor", profile: "Balanced" },
    { value: "tech_professional", labelFr: "Professionnel Tech", labelEn: "Tech Professional", profile: "Tech" },
    { value: "data_scientist", labelFr: "Data Scientist", labelEn: "Data Scientist", profile: "Tech" },
    { value: "software_engineer", labelFr: "Développeur / Ingénieur", labelEn: "Software Engineer", profile: "Tech" },
    { value: "other", labelFr: "Autre", labelEn: "Other", profile: "Balanced" },
  ];

  res.json({ roles, profiles: NEWSLETTER_PROFILES });
}

module.exports = { subscribeNewsletter, getRoles };
