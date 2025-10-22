require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_BLOG_API_KEY });

// Helper function to split text into rich_text chunks (Notion limit: 2000 chars)
function splitIntoRichTextChunks(text) {
    const chunks = [];
    const maxLength = 1900; // Leave some margin

    let currentPos = 0;
    while (currentPos < text.length) {
        const chunk = text.substring(currentPos, currentPos + maxLength);
        chunks.push({
            text: { content: chunk }
        });
        currentPos += maxLength;
    }

    return chunks;
}

const pageId = '23ecfc52-0644-809c-bb91-edf329d64015';

const newContentFR = `Dans un marché saturé de promesses, trois archétypes se partagent l'espace. Les assistants IA grand public, comme WarrenAI d'Investing.com, brillent par l'étendue des données et la qualité des analyses, avec plus de 1 200 métriques fondamentales et une couverture de plus de 72 000 instruments selon leurs annonces de lancement.[1][2][3] Ils répondent, comparent, contextualisent. Puis, au moment d'agir, la conversation s'arrête : il faut basculer vers une autre plateforme pour exécuter. Certaines déclinaisons américaines comme Betterment ou Wealthfront franchissent ce cap, mais à un prix : 0,25 % de frais de gestion (Digital plan) ou 0,65 % au-delà de 100 000$ (Premium plan).[4] Pour un patrimoine de 100 000$, cela représente 250$ annuels. Pour 500 000$, le coût grimpe à 3 250$ par an. En dessous de 20 000$ d'actifs, Betterment facture un abonnement fixe de 4$ par mois (48$ annuels). Wealthfront adopte un modèle similaire avec un taux unique de 0,25 % pour son compte d'investissement automatisé.[5]

---

📊 **Par les chiffres : comparaison des coûts annuels**

| Patrimoine investi | Betterment (0,25%) | Wealthfront (0,25%) | Bubble (€10–20/mois) |
|--------------------|--------------------|---------------------|----------------------|
| **50 000 €**       | 125 €              | 125 €               | **120–240 €**        |
| **500 000 €**      | **1 250 €**        | **1 250 €**         | **120–240 €**        |

*À 500 k€ d'actifs, les modèles en % d'AUM coûtent 5 à 10 fois plus cher qu'un abonnement fixe. L'écart se creuse au fil du temps : plus votre patrimoine croît, plus vous payez — même si le service reste identique.*

---

À l'autre extrême du spectre, les géants institutionnels comme BlackRock Aladdin ou FactSet dominent le marché professionnel avec des suites complètes d'analyse et de gestion, mais leurs tarifs les rendent inaccessibles aux particuliers fortunés et aux petites structures.[6][7]

C'est dans cette faille que Bubble se positionne : ni assistant conversationnel décorrélé de l'exécution, ni plateforme de robo-advisory facturant au pourcentage des actifs sous gestion (AUM), ni suite institutionnelle hors de prix. Bubble se définit comme un **AI Financial Coach** — un conseiller augmenté qui pose les bonnes questions, construit une allocation adaptée, explique ses choix, et permet de passer à l'action. Le tout pour un abonnement mensuel fixe, accessible dès 10 à 20€/mois, quel que soit le patrimoine investi.[8]

Cette approche répond à un besoin structurel : rendre l'accompagnement financier personnalisé accessible sans sacrifier la qualité ni transférer le coût de la relation humaine vers une tarification proportionnelle au patrimoine. Dans un monde où l'IA permet de démocratiser l'expertise, Bubble choisit de redistribuer cette valeur plutôt que de la capter.

---

**Références**

[1] Investing.com - Warren.AI Advanced Financial Intelligence - https://www.investing.com/warren-ai
[2] TechCrunch - Investing.com launches Warren.AI - https://techcrunch.com/2024/11/12/investing-com-launches-warren-ai/
[3] Business Wire - Investing.com Introduces Warren.AI - https://www.businesswire.com/news/home/20241112649039/en/
[4] Betterment Pricing - https://www.betterment.com/pricing
[5] Wealthfront Pricing - https://www.wealthfront.com/pricing
[6] BlackRock Aladdin Overview - https://www.blackrock.com/aladdin
[7] FactSet Platform Overview - https://www.factset.com/products/factset-platform
[8] Bubble Invest - Internal positioning documentation`;

const newContentEN = `In a saturated market of promises, three archetypes share the space. Mass-market AI assistants like WarrenAI by Investing.com excel in data breadth and analytical quality, featuring over 1,200 fundamental metrics and coverage of 72,000+ instruments according to their launch announcements.[1][2][3] They answer questions, compare, contextualize. Then, when it's time to act, the conversation stops: you must switch to another platform to execute. Some American variants like Betterment or Wealthfront cross that threshold, but at a price: 0.25% management fee (Digital plan) or 0.65% above $100,000 (Premium plan).[4] For a $100,000 portfolio, that represents $250 annually. For $500,000, the cost climbs to $3,250 per year. Below $20,000 in assets, Betterment charges a fixed subscription of $4 per month ($48 annually). Wealthfront adopts a similar model with a single 0.25% rate for its automated investing account.[5]

---

📊 **By the Numbers: Annual Cost Comparison**

| Invested Assets    | Betterment (0.25%) | Wealthfront (0.25%) | Bubble (€10–20/month) |
|--------------------|--------------------|---------------------|-----------------------|
| **€50,000**        | €125               | €125                | **€120–240**          |
| **€500,000**       | **€1,250**         | **€1,250**          | **€120–240**          |

*At €500k in assets, percentage-based AUM models cost 5 to 10 times more than a fixed subscription. The gap widens over time: as your wealth grows, you pay more — even though the service remains identical.*

---

At the opposite end of the spectrum, institutional giants like BlackRock Aladdin or FactSet dominate the professional market with comprehensive analysis and management suites, but their pricing makes them inaccessible to affluent individuals and small firms.[6][7]

It's in this gap that Bubble positions itself: neither a conversational assistant disconnected from execution, nor a robo-advisory platform charging a percentage of assets under management (AUM), nor an institutional suite with prohibitive pricing. Bubble defines itself as an **AI Financial Coach** — an augmented advisor that asks the right questions, builds a tailored allocation, explains its choices, and enables action. All for a fixed monthly subscription, accessible from €10–20/month, regardless of invested assets.[8]

This approach addresses a structural need: making personalized financial guidance accessible without sacrificing quality or transferring the cost of human relationships into wealth-proportional pricing. In a world where AI democratizes expertise, Bubble chooses to redistribute that value rather than capture it.

---

**References**

[1] Investing.com - Warren.AI Advanced Financial Intelligence - https://www.investing.com/warren-ai
[2] TechCrunch - Investing.com launches Warren.AI - https://techcrunch.com/2024/11/12/investing-com-launches-warren-ai/
[3] Business Wire - Investing.com Introduces Warren.AI - https://www.businesswire.com/news/home/20241112649039/en/
[4] Betterment Pricing - https://www.betterment.com/pricing
[5] Wealthfront Pricing - https://www.wealthfront.com/pricing
[6] BlackRock Aladdin Overview - https://www.blackrock.com/aladdin
[7] FactSet Platform Overview - https://www.factset.com/products/factset-platform
[8] Bubble Invest - Internal positioning documentation`;

async function updateArticle() {
    console.log('🔄 Adding "By the Numbers" sidebar to Analyse Concurrentielle article...\n');

    try {
        await notion.pages.update({
            page_id: pageId,
            properties: {
                'Content FR': {
                    rich_text: splitIntoRichTextChunks(newContentFR)
                },
                'Content EN': {
                    rich_text: splitIntoRichTextChunks(newContentEN)
                }
            }
        });

        console.log('✅ Article updated successfully!\n');
        console.log('📝 Added elements:');
        console.log('   - "By the Numbers" sidebar with fee comparison table');
        console.log('   - Cost comparison at €50k and €500k AUM');
        console.log('   - Visual emphasis on Bubble\'s fixed pricing advantage');
        console.log(`   - Content FR: ${newContentFR.length} characters (${Math.ceil(newContentFR.length / 1900)} blocks)`);
        console.log(`   - Content EN: ${newContentEN.length} characters (${Math.ceil(newContentEN.length / 1900)} blocks)`);
        console.log('\n🔗 URL: https://www.notion.so/' + pageId.replace(/-/g, ''));

    } catch (error) {
        console.error('❌ Error updating article:', error.message);
        throw error;
    }
}

updateArticle();
