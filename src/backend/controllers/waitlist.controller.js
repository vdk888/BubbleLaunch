const { Client } = require("@notionhq/client");
const env = require("../config/env");

const notion = new Client({ auth: env.NOTION_TOKEN });
const databaseId = env.NOTION_DATABASE_ID_WAITLIST;

/**
 * Handle waitlist subscription
 */
async function subscribe(req, res) {
  const { name, email, profile, comments } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required." });
  }

  try {
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Nom: {
          title: [
            {
              text: {
                content: name,
              },
            },
          ],
        },
        Email: {
          email: email,
        },
        Profil: {
          select: {
            name: profile || "other",
          },
        },
        Commentaires: {
          rich_text: [
            {
              text: {
                content: comments || "",
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
