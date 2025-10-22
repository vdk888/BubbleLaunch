# Notion Business Database Structure

**Database ID:** `294cfc52-0644-80e0-9ea3-cbc2ce09112a`

**Purpose:** Store and manage B2B leads from the `/businesses` contact form

**Database URL:** https://www.notion.so/294cfc52064480e09ea3cbc2ce09112a

---

## Required Properties

These properties are **mandatory** for the business contact form to work correctly:

### 1. **Nom** (Title property)
- **Type:** Title
- **Purpose:** Primary identifier for the lead
- **Format:** `[B2B] Company Name - Contact Name`
- **Example:** `[B2B] BNP Paribas - Jean Dupont`
- **Why:** Distinguishes B2B leads from B2C waitlist entries

### 2. **Email**
- **Type:** Email
- **Purpose:** Professional contact email
- **Format:** Standard email format
- **Example:** `jean.dupont@bnpparibas.com`
- **Validation:** Email format validated on frontend and backend
- **Why:** Primary contact method for responding to leads

### 3. **Profil**
- **Type:** Select (single-select)
- **Purpose:** Categorize lead type
- **Required Option:** `business` (must exist in dropdown)
- **Other Suggested Options:**
  - `individual` (for B2C waitlist)
  - `investor` (for B2C waitlist)
  - `professional` (for B2C waitlist)
  - `other` (for B2C waitlist)
- **Why:** Allows filtering B2B leads from B2C leads in the same database

### 4. **Commentaires**
- **Type:** Rich Text
- **Purpose:** Store all form details (use case, budget, timeline)
- **Format:** Structured text block with emojis for readability
- **Example:**
  ```
  📧 Contact: Jean Dupont (jean.dupont@bnpparibas.com)
  🏢 Company: BNP Paribas

  💼 Use Case:
  Automatiser la réconciliation bancaire pour notre fonds d'investissement...

  💰 Budget: €20k-€30k (Projet complet)
  ⏱️ Timeline: Prochainement (1-3 mois)

  ---
  📅 Submitted: 2025-10-22T14:30:00.000Z
  🌐 Source: bubbleinvest.org/businesses
  ```
- **Why:** Stores all context needed to evaluate and respond to the lead

---

## Recommended Additional Properties

These properties will help you manage leads more effectively:

### 5. **Statut** (Status)
- **Type:** Select (single-select)
- **Purpose:** Track lead progression through sales pipeline
- **Suggested Options:**
  - 🆕 `Nouveau` - Just submitted, not yet reviewed
  - 👁️ `En révision` - Being reviewed by team
  - 📞 `Premier contact` - Initial outreach sent
  - 💬 `En discussion` - Active conversation
  - 📝 `Devis envoyé` - Proposal/quote sent
  - ✅ `Converti` - Became a client
  - ❌ `Refusé` - Not a good fit
  - ⏸️ `En attente` - Waiting for client response
  - 🗑️ `Perdu` - Lost to competitor or budget

### 6. **Date de soumission** (Submission Date)
- **Type:** Date
- **Purpose:** Track when lead was submitted
- **Format:** Automatically set on form submission
- **Why:** Helps with response time tracking and lead aging

### 7. **Budget estimé**
- **Type:** Select (single-select)
- **Purpose:** Quick view of budget range
- **Options:**
  - `€3k-€5k` - Diagnostic
  - `€8k-€12k` - Simple automation
  - `€20k-€30k` - Complete project
  - `€30k+` - Complex project
  - `Non spécifié`
- **Why:** Helps prioritize high-value leads

### 8. **Timeline**
- **Type:** Select (single-select)
- **Purpose:** Urgency level
- **Options:**
  - `🔥 Urgent (< 1 mois)`
  - `⚡ Prochainement (1-3 mois)`
  - `📅 En planification (3-6 mois)`
  - `🔍 En exploration (6+ mois)`
- **Why:** Helps prioritize hot leads

### 9. **Responsable** (Owner)
- **Type:** Person
- **Purpose:** Assign lead to team member
- **Why:** Clear accountability for follow-up

### 10. **Date de réponse** (Response Date)
- **Type:** Date
- **Purpose:** Track when you responded
- **SLA Target:** Within 48h
- **Why:** Monitor response time performance

### 11. **Secteur** (Industry)
- **Type:** Select or Multi-select
- **Purpose:** Categorize by industry
- **Suggested Options:**
  - `Fintech`
  - `Asset Management`
  - `Banque`
  - `Assurance`
  - `Private Equity`
  - `Family Office`
  - `Autre finance`
  - `Non-finance`
- **Why:** Helps identify sector expertise and trends

### 12. **Cas d'usage** (Use Case Category)
- **Type:** Multi-select
- **Purpose:** Tag by automation type
- **Suggested Options:**
  - `Réconciliation bancaire`
  - `Reporting automatisé`
  - `Dashboard de gestion`
  - `Compliance / KYC`
  - `Trading automation`
  - `Client onboarding`
  - `Document processing`
  - `Chatbot / Support`
  - `Analyse de risque`
  - `Autre`
- **Why:** Identify patterns in demand

### 13. **Source**
- **Type:** Select (single-select)
- **Purpose:** Track lead source
- **Options:**
  - `Site web - /businesses`
  - `Référence client`
  - `LinkedIn`
  - `Conférence`
  - `Email direct`
  - `Autre`
- **Default:** `Site web - /businesses`
- **Why:** Track marketing effectiveness

### 14. **Notes internes**
- **Type:** Rich Text
- **Purpose:** Team notes, call summaries, action items
- **Why:** Centralize all lead-related information

### 15. **Valeur potentielle** (Potential Value)
- **Type:** Number (Currency: EUR)
- **Purpose:** Estimated project value
- **Why:** Calculate pipeline value and revenue forecasting

### 16. **Taille entreprise** (Company Size)
- **Type:** Select
- **Options:**
  - `TPE (1-10)`
  - `PME (11-250)`
  - `ETI (251-5000)`
  - `Grande entreprise (5000+)`
- **Why:** Adjust sales approach based on company size

### 17. **Projet** (Linked Project)
- **Type:** Relation
- **Purpose:** Link to project database once converted
- **Why:** Track from lead to delivery

---

## Database Views Recommendations

Create these views for better lead management:

### View 1: **Pipeline - Kanban**
- **Type:** Board (grouped by Statut)
- **Columns:** Nouveau → En révision → Premier contact → En discussion → Devis envoyé → Converti
- **Filters:** Show only active leads (exclude Refusé, Perdu)
- **Sort:** Date de soumission (newest first)

### View 2: **Leads chauds** (Hot Leads)
- **Type:** Table
- **Filters:**
  - Timeline = "Urgent" OR "Prochainement"
  - Statut ≠ "Refusé" AND ≠ "Perdu"
- **Sort:** Date de soumission (newest first)
- **Why:** Focus on high-priority leads

### View 3: **À recontacter** (Follow-up needed)
- **Type:** Table
- **Filters:**
  - Statut = "Premier contact" OR "En discussion"
  - Date de réponse < 7 days ago
- **Sort:** Date de réponse (oldest first)
- **Why:** Identify leads needing follow-up

### View 4: **Budget €20k+**
- **Type:** Table
- **Filters:** Budget estimé = "€20k-€30k" OR "€30k+"
- **Sort:** Valeur potentielle (descending)
- **Why:** Focus on high-value opportunities

### View 5: **Conversion Metrics**
- **Type:** Timeline (by Date de soumission)
- **Group by:** Statut
- **Why:** Visualize pipeline over time

---

## Current Database Structure

Based on the code in `business-contact.controller.js`, the form currently writes to these properties:

```javascript
{
  Nom: "[B2B] Company Name - Contact Name",
  Email: "contact@company.com",
  Profil: "business",
  Commentaires: "📧 Contact: ...\n🏢 Company: ...\n\n💼 Use Case: ...\n\n💰 Budget: ...\n⏱️ Timeline: ..."
}
```

**These 4 properties MUST exist in your Notion database for the form to work.**

---

## Setup Instructions

### Step 1: Create Required Properties

In your Notion database, ensure these exist:

1. **Nom** - Should already exist (it's the default title property)
2. **Email** - Type: Email
3. **Profil** - Type: Select, with option `business`
4. **Commentaires** - Type: Rich Text

### Step 2: Add Recommended Properties

Add the properties from the "Recommended Additional Properties" section above.

### Step 3: Create Views

Set up the 5 recommended views for pipeline management.

### Step 4: Test Form Submission

1. Visit `https://bubbleinvest.org/businesses`
2. Fill out the contact form
3. Check your Notion database for the new entry
4. Verify all data appears correctly in the **Commentaires** field

---

## Integration Code

The form submission is handled by:
- **Frontend:** `/src/frontend/js/businesses-form.js`
- **Backend Controller:** `/src/backend/controllers/business-contact.controller.js`
- **Backend Route:** `/src/backend/routes/business-contact.routes.js`
- **API Endpoint:** `POST /api/business-contact`

---

## Response SLA

**Commitment:** Respond within 48h to all business leads

**Action Items:**
1. Set up Notion automation to send email notification on new entry
2. Check database daily (morning + evening)
3. Assign **Responsable** within 24h
4. Send **Premier contact** within 48h

---

## Sample Lead Entry

Here's what a complete lead entry looks like:

| Property | Value |
|----------|-------|
| **Nom** | [B2B] BNP Paribas - Jean Dupont |
| **Email** | jean.dupont@bnpparibas.com |
| **Profil** | business |
| **Statut** | Nouveau |
| **Date de soumission** | 2025-10-22 |
| **Budget estimé** | €20k-€30k |
| **Timeline** | Prochainement (1-3 mois) |
| **Secteur** | Banque |
| **Cas d'usage** | Réconciliation bancaire, Dashboard de gestion |
| **Source** | Site web - /businesses |
| **Commentaires** | 📧 Contact: Jean Dupont...<br/>🏢 Company: BNP Paribas<br/><br/>💼 Use Case: Automatiser la réconciliation bancaire...<br/><br/>💰 Budget: €20k-€30k<br/>⏱️ Timeline: Prochainement (1-3 mois) |

---

## Troubleshooting

### Form submission fails

**Check:**
1. ✅ Database ID in `.env` is correct: `294cfc52-0644-80e0-9ea3-cbc2ce09112a`
2. ✅ Properties `Nom`, `Email`, `Profil`, `Commentaires` exist
3. ✅ Property types match exactly (Title, Email, Select, Rich Text)
4. ✅ `business` option exists in `Profil` dropdown
5. ✅ Notion integration has write access to database

### Leads not showing in database

**Check:**
1. View filters - may be hiding new entries
2. Database permissions - form uses `NOTION_TOKEN` from `.env`
3. Check server logs for errors: `npm start`

---

**Last Updated:** October 22, 2025
**Database Owner:** Bubble Invest Team
**Maintained by:** contact@bubbleinvest.org
