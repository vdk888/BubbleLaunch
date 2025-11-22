const { Client } = require("@notionhq/client");
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_BLOG_API_KEY });
const articleId = '23ecfc52-0644-809c-bb91-edf329d64015';

// New titles
const newTitleFR = "Analyse concurrentielle : pourquoi Bubble Invest réinvente le conseil en investissement";
const newTitleEN = "Competitive analysis: why Bubble Invest reinvents investment advisory";

// Full French content (with proper formatting)
const contentFR = `Dans un marché saturé de promesses, trois archétypes se partagent l'espace. Les assistants IA grand public, comme WarrenAI d'Investing.com, brillent par l'étendue des données et la qualité des analyses, avec plus de 1 200 métriques fondamentales et une couverture de plus de 72 000 instruments selon leurs annonces de lancement.[1][2][3] Ils répondent, comparent, contextualisent. Puis, au moment d'agir, la conversation s'arrête : il faut basculer vers une autre plateforme pour exécuter. Certaines pages de WarrenAI évoquent aussi des quotas d'usage sur l'entrée gratuite, ce qui borne la profondeur d'échange pour les profils débutants.[4]

Les robo-advisors, à l'inverse, prennent la main. Betterment facture typiquement 0,25 % d'encours par an pour son offre « Digital », avec un plan Premium à 0,65 % au-delà de 100 000 $ ; en-dessous de 20 000 $ sans dépôts récurrents, des frais fixes de 4 $/mois peuvent s'appliquer.[5][6] Wealthfront communique de son côté un 0,25 % pour l'« Automated Investing Account », et la gratuité pour le compte « Stock Investing » hors AUM, tout en précisant que les ETF détenus embarquent leurs propres frais de gestion.[7][8] Tout est propre et « pris en charge ». Sauf l'explication : la mécanique reste largement opaque pour la plupart des clients, et la facture en pourcentage grimpe mécaniquement avec la réussite. À 50 000 € investis, 0,25 % représente ≈ 125 € par an ; à 500 000 €, le coût absolu est multiplié par dix pour un service similaire.

Enfin, les suites professionnelles comme BlackRock Aladdin ou FactSet incarnent l'excellence : profondeur analytique, workflows rigoureux, intégrations puissantes. Mais ces environnements sont conçus pour des équipes dédiées, demandent une formation soutenue et restent financièrement hors de portée pour la plupart des investisseuses et investisseurs particuliers.

Entre ces pôles demeure un angle mort. Il manque un outil qui explique avant d'agir, qui construit avec la personne investisseuse plutôt que « sur » elle, et qui accompagne l'exécution sans prélever un pourcentage des gains. C'est précisément là que se place Bubble Invest.

💡 **Notre thèse**

Un prix fixe lisible (ordre de grandeur : 10–20 €/mois), un agent IA toujours disponible et contextualisé, et une pédagogie intégrée qui expose raisons d'allocation, logique de rééquilibrage et règles d'adaptation. L'IA sert à réduire l'asymétrie d'information, pas à l'exploiter.

Concrètement, nous voulons rendre accessible une sophistication aujourd'hui réservée aux outils experts. Plutôt que d'opposer « ETF de base » et « stock-picking », nous assemblons des stratégies multiples, articulées par une logique quantitative explicable, inspectable et auditée.

Pourquoi maintenant ? Parce que la confiance se gagne par l'alignement des incitations et la lisibilité des calculs. La valeur se déplace de l'opacité performative vers l'accompagnement compréhensible. Un coach qui reste, explique et ajuste vaut mieux qu'un consultant qui s'éclipse ou qu'un gestionnaire muet.

Pour rendre cette promesse vérifiable, nous publierons des traces régulières : journal d'audit des décisions, registre des « tentations refusées », notes de méthode sur le rééquilibrage et ses coûts implicites, et mises à jour d'hypothèses.

🤝 **Notre positionnement : l'AI Financial Coach**

Nous ne sommes ni le consultant qui vous laisse agir seul, ni le gestionnaire qui agit sans expliquer. Nous sommes votre coach IA qui :

- Comprend votre situation financière complète
- Explique les meilleures stratégies en langage simple
- Aide à les construire pas à pas
- Reste disponible pour ajuster quand votre situation évolue
- Coûte un prix fixe, pas un % de vos gains

**Pourquoi cette approche nous semble juste**

- L'industrie a prospéré sur l'asymétrie d'information ; l'IA démocratise le savoir
- Nous ne promettons pas de battre le marché
- Nous vous donnons le pouvoir d'agir au moindre coût en langage naturel

**L'invitation**

Nous construisons la solution que nous aurions voulu avoir. Si les limites de WarrenAI vous frustrent, l'opacité des robo-advisors vous agace, ou si les outils pro sont hors de prix, vous êtes notre public. Partagez envies et retours avec nous.

[Accès Anticipé d'attente](https://bubbleinvest.org)

---

## Références

[1] Finextra. "Investing.com Unveils AI-Driven Financial Researcher". Récupéré de https://www.finextra.com/newsarticle/45855/investingcom-unveils-ai-driven-financial-researcher

[2] FF News. "Investing.com Launches WarrenAI, a Cutting-Edge AI-Driven Financial Researcher". Récupéré de https://ffnews.com/newsarticle/investing-com-launches-warrenai-a-cutting-edge-ai-driven-financial-researcher/

[3] Morningstar. "Investing.com Launches WarrenAI, a Cutting-Edge AI-Driven Financial Researcher". Récupéré de https://www.morningstar.com/news/pr-newswire/20250421cn66385/investingcom-launches-warrenai-a-cutting-edge-ai-driven-financial-researcher

[4] Investing.com Poland. "WarrenAI". Récupéré de https://pl.investing.com/warrenai

[5] Betterment. "Fees". Récupéré de https://www.betterment.com/help/fees

[6] Betterment. "Pricing Fee Calculation". Récupéré de https://www.betterment.com/help/pricing-fee-calculation

[7] Wealthfront. "Understanding Wealthfront Fees". Récupéré de https://support.wealthfront.com/hc/en-us/articles/13992378758676-Understanding-Wealthfront-fees

[8] Wealthfront. "Fees for Investment Accounts". Récupéré de https://support.wealthfront.com/hc/en-us/articles/211003683-Fees-for-Investment-Accounts`;

// English translation
const contentEN = `In a market saturated with promises, three archetypes share the space. Mass-market AI assistants, like Investing.com's WarrenAI, shine through their data breadth and analysis quality, with over 1,200 fundamental metrics and coverage of more than 72,000 instruments according to their launch announcements.[1][2][3] They answer, compare, contextualize. Then, when it's time to act, the conversation stops: you must switch to another platform to execute. Some WarrenAI pages also mention usage quotas on the free tier, which limits the depth of exchange for beginner profiles.[4]

Robo-advisors, conversely, take control. Betterment typically charges 0.25% of assets under management annually for its "Digital" offering, with a Premium plan at 0.65% above $100,000; below $20,000 without recurring deposits, fixed fees of $4/month may apply.[5][6] Wealthfront communicates 0.25% for the "Automated Investing Account," and free for the "Stock Investing" account outside AUM, while specifying that held ETFs carry their own management fees.[7][8] Everything is clean and "taken care of." Except the explanation: the mechanics remain largely opaque for most clients, and the percentage fee mechanically climbs with success. At €50,000 invested, 0.25% represents ≈ €125 per year; at €500,000, the absolute cost is multiplied by ten for a similar service.

Finally, professional suites like BlackRock Aladdin or FactSet embody excellence: analytical depth, rigorous workflows, powerful integrations. But these environments are designed for dedicated teams, require sustained training, and remain financially out of reach for most individual investors.

Between these poles remains a blind spot. What's missing is a tool that explains before acting, that builds with the investor rather than "on" them, and that accompanies execution without taking a percentage of gains. This is precisely where Bubble Invest positions itself.

💡 **Our thesis**

A clear fixed price (order of magnitude: €10–20/month), an AI agent always available and contextualized, and integrated pedagogy that exposes allocation reasons, rebalancing logic, and adaptation rules. AI serves to reduce information asymmetry, not exploit it.

Concretely, we want to make accessible a sophistication currently reserved for expert tools. Rather than opposing "basic ETFs" and "stock-picking," we assemble multiple strategies, articulated by an explainable, inspectable, and audited quantitative logic.

Why now? Because trust is earned through aligned incentives and calculation transparency. Value shifts from performative opacity toward understandable accompaniment. A coach who stays, explains, and adjusts is worth more than a consultant who vanishes or a silent manager.

To make this promise verifiable, we will publish regular traces: decision audit log, register of "refused temptations," methodology notes on rebalancing and its implicit costs, and assumption updates.

🤝 **Our positioning: the AI Financial Coach**

We are neither the consultant who leaves you to act alone, nor the manager who acts without explaining. We are your AI coach who:

- Understands your complete financial situation
- Explains the best strategies in simple language
- Helps build them step by step
- Remains available to adjust when your situation evolves
- Costs a fixed price, not a % of your gains

**Why this approach seems right to us**

- The industry has prospered on information asymmetry; AI democratizes knowledge
- We don't promise to beat the market
- We give you the power to act at minimal cost in natural language

**The invitation**

We're building the solution we wish we had. If WarrenAI's limits frustrate you, robo-advisors' opacity annoys you, or professional tools are too expensive, you're our audience. Share your desires and feedback with us.

[Join the waitlist](https://bubbleinvest.org)

---

## References

[1] Finextra. "Investing.com Unveils AI-Driven Financial Researcher". Retrieved from https://www.finextra.com/newsarticle/45855/investingcom-unveils-ai-driven-financial-researcher

[2] FF News. "Investing.com Launches WarrenAI, a Cutting-Edge AI-Driven Financial Researcher". Retrieved from https://ffnews.com/newsarticle/investing-com-launches-warrenai-a-cutting-edge-ai-driven-financial-researcher/

[3] Morningstar. "Investing.com Launches WarrenAI, a Cutting-Edge AI-Driven Financial Researcher". Retrieved from https://www.morningstar.com/news/pr-newswire/20250421cn66385/investingcom-launches-warrenai-a-cutting-edge-ai-driven-financial-researcher

[4] Investing.com Poland. "WarrenAI". Retrieved from https://pl.investing.com/warrenai

[5] Betterment. "Fees". Retrieved from https://www.betterment.com/help/fees

[6] Betterment. "Pricing Fee Calculation". Retrieved from https://www.betterment.com/help/pricing-fee-calculation

[7] Wealthfront. "Understanding Wealthfront Fees". Retrieved from https://support.wealthfront.com/hc/en-us/articles/13992378758676-Understanding-Wealthfront-fees

[8] Wealthfront. "Fees for Investment Accounts". Retrieved from https://support.wealthfront.com/hc/en-us/articles/211003683-Fees-for-Investment-Accounts`;

// Helper function to split text into chunks
function splitIntoRichTextChunks(text) {
    const chunks = [];
    const maxLength = 1900;
    let currentPos = 0;

    while (currentPos < text.length) {
        const chunk = text.substring(currentPos, currentPos + maxLength);
        chunks.push({ text: { content: chunk } });
        currentPos += maxLength;
    }

    return chunks;
}

async function updateArticle() {
    console.log('🔄 Updating Analyse Concurrentielle article...\n');

    try {
        await notion.pages.update({
            page_id: articleId,
            properties: {
                'Title FR': {
                    title: [{ text: { content: newTitleFR } }]
                },
                'Title EN': {
                    rich_text: [{ text: { content: newTitleEN } }]
                },
                'Content FR': {
                    rich_text: splitIntoRichTextChunks(contentFR)
                },
                'Content EN': {
                    rich_text: splitIntoRichTextChunks(contentEN)
                }
            }
        });

        console.log('✅ Article updated successfully!\n');
        console.log('📝 Updated elements:');
        console.log(`   - Title FR: "${newTitleFR}"`);
        console.log(`   - Title EN: "${newTitleEN}"`);
        console.log(`   - Content FR: ${contentFR.length} characters (${splitIntoRichTextChunks(contentFR).length} blocks)`);
        console.log(`   - Content EN: ${contentEN.length} characters (${splitIntoRichTextChunks(contentEN).length} blocks)`);
        console.log(`\n🔗 URL: https://www.notion.so/${articleId.replace(/-/g, '')}`);

    } catch (error) {
        console.error('❌ Failed to update article:', error.message);
        if (error.body) {
            console.error('Error details:', JSON.stringify(error.body, null, 2));
        }
        throw error;
    }
}

updateArticle();
