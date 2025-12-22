const { Client } = require("@notionhq/client");
const env = require("../config/env");

const notion = new Client({ auth: env.NOTION_TOKEN });
const databaseId = env.NOTION_DATABASE_ID_WAITLIST;

// Input validation constants
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254; // RFC 5321
const MAX_COMMENTS_LENGTH = 1000;
const VALID_PROFILES = ["investor", "professional", "curious", "other"];

/**
 * Sanitize string input - remove potential injection characters
 */
function sanitizeString(str, maxLength) {
  if (typeof str !== "string") return "";
  return str
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ""); // Remove HTML brackets
}

/**
 * Validate email format (stricter than basic regex)
 */
function isValidEmail(email) {
  if (typeof email !== "string" || email.length > MAX_EMAIL_LENGTH) return false;
  // RFC 5322 compliant regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email);
}

/**
 * Handle waitlist subscription
 */
async function subscribe(req, res) {
  const { name, email, profile, comments } = req.body;

  // Required field validation
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required." });
  }

  // Type validation
  if (typeof name !== "string" || typeof email !== "string") {
    return res.status(400).json({ error: "Invalid input types." });
  }

  // Length validation
  if (name.length > MAX_NAME_LENGTH) {
    return res.status(400).json({ error: `Name must be under ${MAX_NAME_LENGTH} characters.` });
  }

  // Email validation
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  // Profile validation (if provided)
  const sanitizedProfile = VALID_PROFILES.includes(profile) ? profile : "other";

  // Sanitize inputs
  const sanitizedName = sanitizeString(name, MAX_NAME_LENGTH);
  const sanitizedEmail = email.trim().toLowerCase().slice(0, MAX_EMAIL_LENGTH);
  const sanitizedComments = sanitizeString(comments || "", MAX_COMMENTS_LENGTH);

  try {
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Nom: {
          title: [
            {
              text: {
                content: sanitizedName,
              },
            },
          ],
        },
        Email: {
          email: sanitizedEmail,
        },
        Profil: {
          select: {
            name: sanitizedProfile,
          },
        },
        Commentaires: {
          rich_text: [
            {
              text: {
                content: sanitizedComments,
              },
            },
          ],
        },
      },
    });
    res.status(201).json({ message: "Successfully subscribed!" });
  } catch (error) {
    console.error("Error adding to Notion:", error);
    res
      .status(500)
      .json({ error: "Failed to subscribe. Please try again later." });
  }
}

/**
 * Test POST route
 */
function testPost(req, res) {
  console.log("POST /test-post hit on server");
  res.status(200).send("POST test successful");
}

module.exports = { subscribe, testPost };
