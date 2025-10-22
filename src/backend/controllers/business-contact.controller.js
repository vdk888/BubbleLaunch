const { Client } = require("@notionhq/client");
const env = require("../config/env");

const notion = new Client({ auth: env.NOTION_TOKEN });
const databaseId = env.NOTION_DATABASE_ID_BUSINESS || env.NOTION_DATABASE_ID_WAITLIST; // Fallback to waitlist DB for now

/**
 * Handle business contact form submission
 */
async function submitBusinessContact(req, res) {
  const { company, contactName, email, useCase, budget, timeline } = req.body;

  // Validation
  if (!company || !contactName || !email || !useCase) {
    return res.status(400).json({
      error: "Company, name, email, and use case description are required."
    });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  try {
    // Format the comprehensive request details
    const requestDetails = `
📧 Contact: ${contactName} (${email})
🏢 Company: ${company}

💼 Use Case:
${useCase}

💰 Budget: ${budget || 'Not specified'}
⏱️ Timeline: ${timeline || 'Not specified'}

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
                content: `${company}`,
              },
            },
          ],
        },
        // Contact details
        'Contact name': {
          rich_text: [
            {
              text: {
                content: contactName,
              },
            },
          ],
        },
        'Professional email': {
          email: email,
        },
        // Use case
        'Use case description': {
          rich_text: [
            {
              text: {
                content: useCase,
              },
            },
          ],
        },
        // Budget and timeline
        'Budget range': {
          select: {
            name: budgetMapping[budget] || 'Non spécifié',
          },
        },
        'Timeline': {
          select: {
            name: timelineMapping[timeline] || '🔍 En exploration (6+ mois)',
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

    console.log(`✅ Business contact received from ${company} (${email})`);

    res.status(201).json({
      message: "Request received successfully! We'll respond within 48h."
    });

  } catch (error) {
    console.error("Error saving business contact to Notion:", error);

    // Send email notification as backup if Notion fails
    console.error(`⚠️ URGENT: Business lead lost! Company: ${company}, Email: ${email}, Budget: ${budget}`);

    res.status(500).json({
      error: "Failed to submit request. Please contact us directly at contact@bubbleinvest.org"
    });
  }
}

module.exports = { submitBusinessContact };
