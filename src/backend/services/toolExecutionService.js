/**
 * Tool Execution Service
 * Provides callable tools for the chatbot aligned to Bubble's business model:
 *   - B2B: qualify professional needs, book consultation
 *   - B2C: showcase POC, recommend content
 *
 * v2.0 — Redesigned for new business direction (consulting + content)
 */

let Ajv;
try {
  Ajv = require('ajv');
} catch (e) {
  Ajv = null;
  console.warn('AJV not installed; tool input validation will be skipped.');
}

const ajv = Ajv ? new Ajv({ allErrors: true, strict: true }) : null;

// ═══════════════════════════════════════════════════════════════════════════
// TOOL DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

const TOOLS = {

  // ─────────────────────────────────────────────────────────────────────────
  // B2B TOOLS (Professionals)
  // ─────────────────────────────────────────────────────────────────────────

  qualify_professional_need: {
    name: 'qualify_professional_need',
    description: `
      Structured intake tool for qualifying a professional prospect's needs.
      Use when the user mentions their business, a pain point, or asks about
      Bubble's B2B services. Returns a qualification summary and recommended
      next step (diagnostic call, specific service, or content to share).
      Call this to structure the conversation and guide toward booking a call.
    `.trim(),
    input_schema: {
      type: 'object',
      properties: {
        company_type: {
          type: 'string',
          enum: ['wealth_manager', 'cgp', 'sme', 'startup', 'independent', 'asset_manager', 'other'],
          description: 'Type of company or professional'
        },
        industry: {
          type: 'string',
          enum: ['finance', 'tech', 'consulting', 'real_estate', 'healthcare', 'other'],
          description: 'Industry sector'
        },
        pain_point: {
          type: 'string',
          enum: ['too_many_tools', 'no_internal_skills', 'fear_of_falling_behind', 'generic_solutions', 'need_trusted_guide', 'manual_processes', 'reporting', 'client_management'],
          description: 'Primary pain point or challenge'
        },
        ai_maturity: {
          type: 'string',
          enum: ['unaware', 'curious', 'experimenting', 'deploying'],
          description: 'Current level of AI adoption'
        },
        urgency: {
          type: 'string',
          enum: ['exploring', 'planning', 'ready_now'],
          description: 'How urgently they need a solution'
        },
        team_size: {
          type: 'string',
          enum: ['solo', 'small', 'medium', 'large'],
          description: 'Size of their team'
        }
      },
      required: ['company_type', 'pain_point'],
      additionalProperties: false
    },
    input_examples: [
      { company_type: 'cgp', pain_point: 'manual_processes', ai_maturity: 'curious', urgency: 'planning' },
      { company_type: 'sme', pain_point: 'too_many_tools', urgency: 'ready_now' }
    ],
    execute: async ({ company_type, industry = null, pain_point, ai_maturity = 'curious', urgency = 'exploring', team_size = null }) => {
      // Map pain points to recommended services
      const serviceRecommendations = {
        too_many_tools: {
          service: 'AI Tool Audit & Consolidation',
          scope: 'diagnostic',
          description: 'We audit your current tool stack and recommend which AI agents can replace or consolidate multiple tools'
        },
        no_internal_skills: {
          service: 'Co-Construction Sprint',
          scope: 'targeted_automation',
          description: 'We build your first AI agent together in joint sessions — you learn by doing, not by watching slides'
        },
        fear_of_falling_behind: {
          service: 'Early Adoption Program',
          scope: 'diagnostic',
          description: 'We deploy the latest AI tools in your workflow within weeks — keeping you ahead of competition'
        },
        generic_solutions: {
          service: 'Custom AI Agent Development',
          scope: 'full_project',
          description: 'We build AI agents tailored to YOUR business processes — not generic ChatGPT wrappers'
        },
        need_trusted_guide: {
          service: 'Strategic AI Diagnostic',
          scope: 'diagnostic',
          description: 'A 2-week diagnostic to map your automation opportunities and build a concrete action plan'
        },
        manual_processes: {
          service: 'Workflow Automation Sprint',
          scope: 'targeted_automation',
          description: 'We automate your most time-consuming manual processes with custom AI agents'
        },
        reporting: {
          service: 'AI Reporting Copilot',
          scope: 'targeted_automation',
          description: 'We build a natural language reporting assistant that generates reports from your data'
        },
        client_management: {
          service: 'Client Intelligence Agent',
          scope: 'targeted_automation',
          description: 'We build an AI agent that monitors, summarizes, and acts on client information'
        }
      };

      const recommendation = serviceRecommendations[pain_point] || serviceRecommendations.need_trusted_guide;

      // Determine next step based on urgency and AI maturity
      let nextStep;
      if (urgency === 'ready_now') {
        nextStep = {
          action: 'book_diagnostic',
          message: 'Book a free diagnostic call to get started immediately',
          calendlyUrl: 'https://calendly.com/bubble-invest/diagnostic'
        };
      } else if (urgency === 'planning' || ai_maturity === 'experimenting' || ai_maturity === 'deploying') {
        nextStep = {
          action: 'book_discovery',
          message: 'Schedule a discovery call to discuss your specific needs',
          calendlyUrl: 'https://calendly.com/bubble-invest/discovery'
        };
      } else {
        nextStep = {
          action: 'share_content',
          message: 'Explore our case studies and blog to see how we work, then book a call when ready',
          contentLinks: ['/professionals', '/blog']
        };
      }

      // Finance-specific qualifier
      const isFinanceClient = ['wealth_manager', 'cgp', 'asset_manager'].includes(company_type) || industry === 'finance';

      return {
        qualification: {
          company_type,
          industry,
          pain_point,
          ai_maturity,
          urgency,
          team_size,
          isFinanceClient
        },
        recommendation,
        nextStep,
        differentiators: isFinanceClient
          ? [
            'Ex-Deloitte & UBS — we understand your regulatory constraints natively',
            'UCITS, KYC, AMF compliance built into our approach',
            'We speak your language — no translation needed'
          ]
          : [
            'We build WITH you, not FOR you — co-construction in joint sessions',
            'Systematic early adopters — latest AI tools deployed weeks after release',
            'Guaranteed autonomy — at the end, you don\'t need us anymore'
          ],
        event: 'prospect:qualified'
      };
    }
  },

  book_consultation: {
    name: 'book_consultation',
    description: `
      Generate a consultation booking link with pre-filled context from the conversation.
      Use when the user is ready to book a call, asks "how do I get started", or expresses
      interest in working with Bubble. Returns a Calendly link and a summary of what was discussed.
    `.trim(),
    input_schema: {
      type: 'object',
      properties: {
        consultation_type: {
          type: 'string',
          enum: ['diagnostic', 'discovery', 'general'],
          description: 'Type of consultation to book'
        },
        context_summary: {
          type: 'string',
          description: 'Brief summary of what was discussed to pre-fill the booking'
        },
        company_type: {
          type: 'string',
          description: 'Type of company (if known from conversation)'
        },
        pain_point: {
          type: 'string',
          description: 'Main pain point discussed (if identified)'
        }
      },
      required: ['consultation_type'],
      additionalProperties: false
    },
    input_examples: [
      { consultation_type: 'diagnostic', context_summary: 'CGP looking to automate client reporting', company_type: 'cgp', pain_point: 'reporting' },
      { consultation_type: 'discovery', context_summary: 'SME interested in AI workflow automation' }
    ],
    execute: async ({ consultation_type, context_summary = '', company_type = '', pain_point = '' }) => {
      const consultationTypes = {
        diagnostic: {
          label: 'Free Diagnostic Call',
          duration: '30 min',
          description: 'We map your automation opportunities and build an action plan',
          url: 'https://calendly.com/bubble-invest/diagnostic'
        },
        discovery: {
          label: 'Discovery Call',
          duration: '20 min',
          description: 'Discuss your specific needs and see if we\'re a good fit',
          url: 'https://calendly.com/bubble-invest/discovery'
        },
        general: {
          label: 'General Conversation',
          duration: '15 min',
          description: 'Ask us anything about our approach and services',
          url: 'https://calendly.com/bubble-invest/chat'
        }
      };

      const consultation = consultationTypes[consultation_type] || consultationTypes.general;

      // Build UTM parameters for tracking
      const params = new URLSearchParams();
      if (company_type) params.set('a1', company_type);
      if (pain_point) params.set('a2', pain_point);
      if (context_summary) params.set('a3', context_summary.substring(0, 100));

      const trackingUrl = params.toString()
        ? `${consultation.url}?${params.toString()}`
        : consultation.url;

      return {
        consultation,
        bookingUrl: trackingUrl,
        contextSummary: context_summary,
        message: `Ready to book: ${consultation.label} (${consultation.duration})`,
        event: 'consultation:booked'
      };
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // B2C TOOLS (Individuals / Content)
  // ─────────────────────────────────────────────────────────────────────────

  get_poc_showcase: {
    name: 'get_poc_showcase',
    description: `
      Return information about Bubble's public proof of concept (investment agent).
      Use when someone asks about our investment agent, our POC, what we've built,
      or how our own portfolio is managed. Returns current status, approach description,
      and links to explore further.
    `.trim(),
    input_schema: {
      type: 'object',
      properties: {
        detail_level: {
          type: 'string',
          enum: ['brief', 'detailed'],
          description: 'How much detail to include'
        },
        language: {
          type: 'string',
          enum: ['fr', 'en'],
          description: 'Response language'
        }
      },
      required: [],
      additionalProperties: false
    },
    input_examples: [
      { detail_level: 'brief', language: 'fr' },
      { detail_level: 'detailed' }
    ],
    execute: async ({ detail_level = 'brief', language = 'fr' }) => {
      const showcase = {
        name: language === 'fr' ? "Agent d'investissement Bubble" : 'Bubble Investment Agent',
        status: language === 'fr' ? 'En production sur nos propres portefeuilles' : 'Live on our own portfolios',
        description: language === 'fr'
          ? "Notre agent IA gère nos propres portefeuilles avec des stratégies quantitatives (risk parity, momentum, allocation dynamique). On partage tout : le code, les résultats, les erreurs."
          : "Our AI agent manages our own portfolios with quantitative strategies (risk parity, momentum, dynamic allocation). We share everything: code, results, mistakes.",
        approach: {
          strategies: ['Risk Parity', 'Momentum', 'Equal Weight', 'Regime-Aware'],
          brokers: ['Interactive Brokers', 'Alpaca', 'Saxo Bank'],
          dataHistory: '20+ years of ETF data',
          etfs: ['SPY', 'IEF', 'GLD', 'EFA', 'EEM', 'VNQ']
        },
        links: {
          simulator: '/portfolio-simulator',
          blog: '/blog',
          github: 'https://github.com/bubbleinvest',
          newsletter: 'https://bubbleinvest.substack.com'
        },
        keyPoint: language === 'fr'
          ? "Ce n'est PAS un produit à vendre. C'est notre preuve de concept publique — le selfware en action."
          : "This is NOT a product for sale. It's our public proof of concept — selfware in action."
      };

      if (detail_level === 'detailed') {
        showcase.technicalDetails = {
          stack: 'Node.js, Express, Chart.js, Yahoo Finance API, OpenRouter',
          aiModels: 'Free models via OpenRouter (cost: $0/month)',
          architecture: 'Modular strategy engine with pluggable data sources and broker integrations',
          transparency: language === 'fr'
            ? "Tout est public : stratégies, backtests, résultats réels, code source. On partage aussi nos erreurs et nos doutes."
            : "Everything is public: strategies, backtests, real results, source code. We also share our mistakes and doubts."
        };
      }

      return showcase;
    }
  },

  recommend_content: {
    name: 'recommend_content',
    description: `
      Suggest relevant content (blog posts, newsletter, social channels, resources)
      based on the user's interests. Use when an individual asks what to read,
      wants to learn more, or when bridging from a topic to Bubble's content.
    `.trim(),
    input_schema: {
      type: 'object',
      properties: {
        interest: {
          type: 'string',
          enum: ['investment_agent', 'ai_agents', 'tutorials', 'philosophy', 'build_in_public', 'business_cases', 'all'],
          description: 'What the user is interested in'
        },
        format_preference: {
          type: 'string',
          enum: ['blog', 'video', 'newsletter', 'social', 'code'],
          description: 'Preferred content format'
        },
        language: {
          type: 'string',
          enum: ['fr', 'en'],
          description: 'Content language preference'
        }
      },
      required: ['interest'],
      additionalProperties: false
    },
    input_examples: [
      { interest: 'ai_agents', format_preference: 'blog', language: 'fr' },
      { interest: 'philosophy' },
      { interest: 'tutorials', format_preference: 'video' }
    ],
    execute: async ({ interest, format_preference = null, language = 'fr' }) => {
      // Content recommendations by interest area
      const contentMap = {
        investment_agent: {
          description: language === 'fr'
            ? "Notre agent d'investissement — POC public avec code, résultats, et transparence totale"
            : 'Our investment agent — public POC with code, results, and full transparency',
          channels: [
            { type: 'page', label: 'Portfolio Simulator', url: '/portfolio-simulator', format: 'interactive' },
            { type: 'page', label: 'Investment Agent Showcase', url: '/investors', format: 'page' },
            { type: 'social', label: 'GitHub', url: 'https://github.com/bubbleinvest', format: 'code' },
            { type: 'newsletter', label: 'Substack', url: 'https://bubbleinvest.substack.com', format: 'newsletter' }
          ]
        },
        ai_agents: {
          description: language === 'fr'
            ? "Comment construire et déployer des agents IA — tutoriels, configurations, retours d'expérience"
            : 'How to build and deploy AI agents — tutorials, configs, experience sharing',
          channels: [
            { type: 'blog', label: 'Blog', url: '/blog', format: 'blog' },
            { type: 'social', label: 'LinkedIn', url: 'https://linkedin.com/company/bubbleinvest', format: 'social' },
            { type: 'social', label: 'YouTube', url: 'https://youtube.com/@bubbleinvest', format: 'video' },
            { type: 'social', label: 'GitHub', url: 'https://github.com/bubbleinvest', format: 'code' }
          ]
        },
        tutorials: {
          description: language === 'fr'
            ? "Tutoriels pratiques pour installer et configurer des agents IA"
            : 'Practical tutorials to install and configure AI agents',
          channels: [
            { type: 'social', label: 'YouTube', url: 'https://youtube.com/@bubbleinvest', format: 'video' },
            { type: 'blog', label: 'Blog', url: '/blog', format: 'blog' },
            { type: 'social', label: 'GitHub', url: 'https://github.com/bubbleinvest', format: 'code' }
          ]
        },
        philosophy: {
          description: language === 'fr'
            ? "Réflexions sur l'impact de l'IA sur le travail, la valeur, l'attention humaine"
            : "Reflections on AI's impact on work, value, and human attention",
          channels: [
            { type: 'blog', label: 'Blog', url: '/blog', format: 'blog' },
            { type: 'newsletter', label: 'Substack', url: 'https://bubbleinvest.substack.com', format: 'newsletter' },
            { type: 'social', label: 'LinkedIn', url: 'https://linkedin.com/company/bubbleinvest', format: 'social' }
          ]
        },
        build_in_public: {
          description: language === 'fr'
            ? "Notre aventure semaine par semaine : ce qu'on teste, déploie, apprend"
            : 'Our journey week by week: what we test, deploy, learn',
          channels: [
            { type: 'social', label: 'LinkedIn', url: 'https://linkedin.com/company/bubbleinvest', format: 'social' },
            { type: 'social', label: 'Instagram', url: 'https://instagram.com/behindthebubble.ai', format: 'social' },
            { type: 'social', label: 'X/Twitter', url: 'https://x.com/bubbleinvest', format: 'social' },
            { type: 'newsletter', label: 'Substack', url: 'https://bubbleinvest.substack.com', format: 'newsletter' }
          ]
        },
        business_cases: {
          description: language === 'fr'
            ? "Comment on a automatisé X pour un CGP, un architecte, une PME"
            : 'How we automated X for a CGP, an architect, an SME',
          channels: [
            { type: 'blog', label: 'Blog', url: '/blog', format: 'blog' },
            { type: 'page', label: 'Professionals', url: '/professionals', format: 'page' },
            { type: 'social', label: 'LinkedIn', url: 'https://linkedin.com/company/bubbleinvest', format: 'social' }
          ]
        },
        all: {
          description: language === 'fr'
            ? "Tous nos contenus : blog, newsletter, réseaux sociaux, code"
            : 'All our content: blog, newsletter, social media, code',
          channels: [
            { type: 'blog', label: 'Blog', url: '/blog', format: 'blog' },
            { type: 'newsletter', label: 'Substack', url: 'https://bubbleinvest.substack.com', format: 'newsletter' },
            { type: 'social', label: 'LinkedIn', url: 'https://linkedin.com/company/bubbleinvest', format: 'social' },
            { type: 'social', label: 'YouTube', url: 'https://youtube.com/@bubbleinvest', format: 'video' },
            { type: 'social', label: 'Instagram', url: 'https://instagram.com/behindthebubble.ai', format: 'social' },
            { type: 'social', label: 'GitHub', url: 'https://github.com/bubbleinvest', format: 'code' },
            { type: 'social', label: 'X/Twitter', url: 'https://x.com/bubbleinvest', format: 'social' }
          ]
        }
      };

      const content = contentMap[interest] || contentMap.all;

      // Filter by format preference if specified
      let channels = content.channels;
      if (format_preference) {
        const formatFiltered = channels.filter(c => c.format === format_preference);
        if (formatFiltered.length > 0) {
          channels = formatFiltered;
        }
        // If no match, keep all channels (don't return empty)
      }

      return {
        interest,
        description: content.description,
        channels,
        cta: language === 'fr'
          ? "Tu veux la même chose pour ton business ? Réserve un appel !"
          : "Want this for your business? Book a call!",
        ctaUrl: 'https://calendly.com/bubble-invest/discovery'
      };
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// EXECUTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════

async function executeTool(toolName, input) {
  const tool = TOOLS[toolName];
  if (!tool) {
    throw new Error(`Tool '${toolName}' not found`);
  }
  try {
    const effectiveInput = input || {};
    // Validate input against schema if available
    if (tool.input_schema && ajv) {
      const validate = ajv.compile(tool.input_schema);
      const valid = validate(effectiveInput);
      if (!valid) {
        return { success: false, error: 'Invalid tool arguments', details: validate.errors };
      }
    }
    const result = await tool.execute(effectiveInput);
    return { success: true, data: result };
  } catch (error) {
    console.error(`Tool execution error (${toolName}):`, error);
    return { success: false, error: error.message };
  }
}

function getToolDefinitions(toolNames = null) {
  const allTools = Object.values(TOOLS);

  const filtered = toolNames
    ? allTools.filter((t) => toolNames.includes(t.name))
    : allTools;

  // Return OpenAI / OpenRouter compatible function schemas
  return filtered.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    },
  }));
}

/**
 * Return tool definitions appropriate for the page context.
 * Tools are now aligned to the business model:
 *   - Professionals pages → qualification + booking tools
 *   - Individuals pages → POC showcase + content recommendation
 *   - Index/About → all tools available (discovery phase)
 */
function getToolsForPageContext(pageContext) {
  const ctx = (pageContext || '').toLowerCase();

  if (ctx.includes('professionals') || ctx.includes('business')) {
    return getToolDefinitions([
      'qualify_professional_need',
      'book_consultation'
    ]);
  }

  if (ctx.includes('individuals') || ctx.includes('investors')) {
    return getToolDefinitions([
      'get_poc_showcase',
      'recommend_content',
      'book_consultation'
    ]);
  }

  if (ctx.includes('blog')) {
    return getToolDefinitions([
      'recommend_content'
    ]);
  }

  // Index, about, or unknown context → all tools available
  // This lets the chatbot discover visitor type and use appropriate tools
  if (ctx === 'index' || ctx === 'about' || ctx === '') {
    return getToolDefinitions([
      'qualify_professional_need',
      'get_poc_showcase',
      'recommend_content',
      'book_consultation'
    ]);
  }

  // Default: provide all tools
  return getToolDefinitions();
}

module.exports = {
  executeTool,
  getToolDefinitions,
  getToolsForPageContext,
  TOOLS
};
