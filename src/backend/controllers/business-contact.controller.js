const { Client } = require("@notionhq/client");
const env = require("../config/env");

const notion = new Client({ auth: env.NOTION_TOKEN });
const databaseId = env.NOTION_DATABASE_ID_BUSINESS || env.NOTION_DATABASE_ID_WAITLIST; // Fallback to waitlist DB for now

// Input validation constants
const MAX_COMPANY_LENGTH = 200;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254; // RFC 5321
const MAX_USECASE_LENGTH = 2000;
const VALID_BUDGETS = ["diagnostic", "small", "medium", "large", "unknown"];
const VALID_TIMELINES = ["urgent", "soon", "planning", "exploring"];

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
 * Handle business contact form submission
 */
async function submitBusinessContact(req, res) {
  const { company, contactName, email, useCase, budget, timeline } = req.body;

  // Required field validation
  if (!company || !contactName || !email || !useCase) {
    return res.status(400).json({
      error: "Company, name, email, and use case description are required."
    });
  }

  // Type validation
  if (typeof company !== "string" || typeof contactName !== "string" ||
      typeof email !== "string" || typeof useCase !== "string") {
    return res.status(400).json({ error: "Invalid input types." });
  }

  // Length validation
  if (company.length > MAX_COMPANY_LENGTH) {
    return res.status(400).json({ error: `Company name must be under ${MAX_COMPANY_LENGTH} characters.` });
  }
  if (contactName.length > MAX_NAME_LENGTH) {
    return res.status(400).json({ error: `Contact name must be under ${MAX_NAME_LENGTH} characters.` });
  }
  if (useCase.length > MAX_USECASE_LENGTH) {
    return res.status(400).json({ error: `Use case must be under ${MAX_USECASE_LENGTH} characters.` });
  }

  // Email validation
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  // Sanitize all inputs
  const sanitizedCompany = sanitizeString(company, MAX_COMPANY_LENGTH);
  const sanitizedName = sanitizeString(contactName, MAX_NAME_LENGTH);
  const sanitizedEmail = email.trim().toLowerCase().slice(0, MAX_EMAIL_LENGTH);
  const sanitizedUseCase = sanitizeString(useCase, MAX_USECASE_LENGTH);
  const sanitizedBudget = VALID_BUDGETS.includes(budget) ? budget : "unknown";
  const sanitizedTimeline = VALID_TIMELINES.includes(timeline) ? timeline : "exploring";

  try {
    // Format the comprehensive request details
    const requestDetails = `
📧 Contact: ${sanitizedName} (${sanitizedEmail})
🏢 Company: ${sanitizedCompany}

💼 Use Case:
${sanitizedUseCase}

💰 Budget: ${sanitizedBudget || 'Not specified'}
⏱️ Timeline: ${sanitizedTimeline || 'Not specified'}

---
📅 Submitted: ${new Date().toISOString()}
🌐 Source: bubbleinvest.org/businesses
`;

    // Map form budget to database format
    const budgetMapping = {
      'diagnostic': '€3k-€5k',
      'small': '€8k-€12k',
      'medium': '€20k-€30k',
      'large': '€30k+',
      'unknown': 'Non spécifié'
    };

    const timelineMapping = {
      'urgent': '🔥 Urgent (< 1 mois)',
      'soon': '⚡ Prochainement (1-3 mois)',
      'planning': '📅 En planification (3-6 mois)',
      'exploring': '🔍 En exploration (6+ mois)'
    };

    // Create entry in Notion matching existing database structure
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        // Title property
        'Company name': {
          title: [
            {
              text: {
                content: sanitizedCompany,
              },
            },
          ],
        },
        // Contact details
        'Contact name': {
          rich_text: [
            {
              text: {
                content: sanitizedName,
              },
            },
          ],
        },
        'Professional email': {
          email: sanitizedEmail,
        },
        // Use case
        'Use case description': {
          rich_text: [
            {
              text: {
                content: sanitizedUseCase,
              },
            },
          ],
        },
        // Budget and timeline
        'Budget range': {
          select: {
            name: budgetMapping[sanitizedBudget] || 'Non spécifié',
          },
        },
        'Timeline': {
          select: {
            name: timelineMapping[sanitizedTimeline] || '🔍 En exploration (6+ mois)',
          },
        },
        // Status
        'Statut': {
          select: {
            name: '🆕 Nouveau',
          },
        },
        // Profile type
        'Profil': {
          select: {
            name: 'business',
          },
        },
        // Additional notes
        'Commentaires': {
          rich_text: [
            {
              text: {
                content: `📅 Submitted: ${new Date().toISOString()}\n🌐 Source: bubbleinvest.org/businesses\n\n${requestDetails}`,
              },
            },
          ],
        },
      },
    });

    console.log(`✅ Business contact received from ${sanitizedCompany} (${sanitizedEmail})`);

    res.status(201).json({
      message: "Request received successfully! We'll respond within 48h."
    });

  } catch (error) {
    console.error("Error saving business contact to Notion:", error);

    // Send email notification as backup if Notion fails
    console.error(`⚠️ URGENT: Business lead lost! Company: ${sanitizedCompany}, Email: ${sanitizedEmail}, Budget: ${sanitizedBudget}`);

    res.status(500).json({
      error: "Failed to submit request. Please contact us directly at contact@bubbleinvest.org"
    });
  }
}

module.exports = { submitBusinessContact };
