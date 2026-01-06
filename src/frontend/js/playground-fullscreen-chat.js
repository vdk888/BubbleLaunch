/**
 * Bubble Playground - Full-Screen Chatbot Experience
 * Scripted onboarding that EDUCATES users about WHY strategies matter
 * Explains Bubble's raison d'etre: personalized portfolios based on risk profile
 * Transitions to LLM after profile determination
 */

const PlaygroundFullscreenChat = (function() {
  'use strict';

  // DOM Elements
  let messagesContainer = null;
  let inputField = null;
  let inputForm = null;
  let sendButton = null;
  let micButton = null;
  let abortController = null;

  // Voice recognition
  let recognition = null;
  let isRecording = false;

  // Session state
  const SESSION_KEY = 'bubblePlaygroundFullscreenSession';
  let session = null;

  // SVG Icons (no emojis)
  const ICONS = {
    shield: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    turtle: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="14" rx="8" ry="5"/><circle cx="12" cy="14" r="3"/><path d="M4 14c-1-2 0-4 2-5"/><path d="M20 14c1-2 0-4-2-5"/><circle cx="12" cy="7" r="2"/></svg>',
    seedling: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22V12"/><path d="M12 12c-3 0-6-3-6-6 3 0 6 3 6 6"/><path d="M12 12c3 0 6-3 6-6-3 0-6 3-6 6"/></svg>',
    leaf: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>',
    scale: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18"/><path d="M5 8l7-5 7 5"/><path d="M5 8v4c0 2 2 4 7 4s7-2 7-4V8"/></svg>',
    target: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    trendUp: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
    rocket: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',
    bolt: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    flame: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
    gem: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>',
    eye: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    wrench: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    book: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    mic: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
    micOff: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>'
  };

  // 11-Profile Spectrum (0% to 100% stocks) - using SVG icons instead of emojis
  const PROFILES = {
    0: { name: { fr: 'Securite Absolue', en: 'Absolute Security' }, stocks: 0, bonds: 100, icon: 'shield', description: { fr: 'Tu preferes la tranquillite. Ton argent dort en securite.', en: 'You prefer peace of mind. Your money sleeps safely.' } },
    10: { name: { fr: 'Tres Prudent', en: 'Very Conservative' }, stocks: 10, bonds: 90, icon: 'turtle', description: { fr: 'Un tout petit pied dans les marches, juste pour voir.', en: 'A tiny foot in the markets, just to see.' } },
    20: { name: { fr: 'Prudent', en: 'Conservative' }, stocks: 20, bonds: 80, icon: 'seedling', description: { fr: 'Tu acceptes un peu de mouvement pour un peu plus de rendement.', en: 'You accept some movement for a bit more return.' } },
    30: { name: { fr: 'Prudent+', en: 'Conservative+' }, stocks: 30, bonds: 70, icon: 'leaf', description: { fr: 'Tu commences a apprecier le potentiel des marches.', en: 'You start appreciating market potential.' } },
    40: { name: { fr: 'Equilibre Defensif', en: 'Defensive Balanced' }, stocks: 40, bonds: 60, icon: 'scale', description: { fr: 'Un bon equilibre penche vers la securite.', en: 'A good balance leaning toward safety.' } },
    50: { name: { fr: 'Equilibre', en: 'Balanced' }, stocks: 50, bonds: 50, icon: 'target', description: { fr: 'Le classique 50/50 : moitie securite, moitie croissance.', en: 'The classic 50/50: half safety, half growth.' } },
    60: { name: { fr: 'Equilibre Dynamique', en: 'Dynamic Balanced' }, stocks: 60, bonds: 40, icon: 'trendUp', description: { fr: 'Tu privilegie la croissance avec un filet de securite.', en: 'You favor growth with a safety net.' } },
    70: { name: { fr: 'Dynamique', en: 'Growth' }, stocks: 70, bonds: 30, icon: 'rocket', description: { fr: 'Tu acceptes les montagnes russes pour viser plus haut.', en: 'You accept roller coasters to aim higher.' } },
    80: { name: { fr: 'Dynamique+', en: 'Growth+' }, stocks: 80, bonds: 20, icon: 'bolt', description: { fr: 'Les baisses temporaires ne te font pas peur.', en: 'Temporary drops don\'t scare you.' } },
    90: { name: { fr: 'Tres Dynamique', en: 'Very Aggressive' }, stocks: 90, bonds: 10, icon: 'flame', description: { fr: 'Tu vois les krachs comme des opportunites d\'achat.', en: 'You see crashes as buying opportunities.' } },
    100: { name: { fr: 'Croissance Max', en: 'Maximum Growth' }, stocks: 100, bonds: 0, icon: 'gem', description: { fr: '100% actions. Tu joues le long terme sans filet.', en: '100% stocks. You play the long game with no safety net.' } }
  };

  // Conversation stages - expanded for education
  const STAGES = {
    welcome: 'welcome',
    education_problem: 'education_problem',
    education_spectrum: 'education_spectrum',
    scenario_crisis: 'scenario_crisis',
    scenario_bonus: 'scenario_bonus',
    scenario_horizon: 'scenario_horizon',
    scenario_friends: 'scenario_friends',
    scenario_layoffs: 'scenario_layoffs',
    profile_reveal: 'profile_reveal',
    bubble_solution: 'bubble_solution',
    free_chat: 'free_chat'
  };

  // Educational & Scripted content - Bubble's Raison d'Etre
  const CONTENT = {
    welcome: {
      messages: {
        fr: [
          "Salut ! Je suis Bubble, ton assistant investissement.",
          "Avant de parler chiffres, laisse-moi te poser une question simple..."
        ],
        en: [
          "Hey! I'm Bubble, your investment assistant.",
          "Before talking numbers, let me ask you a simple question..."
        ]
      },
      question: {
        fr: "Tu as 50 000 euros. Comment les repartir entre placements surs (livrets, fonds euros) et actions (bourse) ?",
        en: "You have 50,000 euros. How would you split it between safe investments (savings, bonds) and stocks?"
      },
      cta: {
        fr: "Bonne question...",
        en: "Good question..."
      }
    },

    education_problem: {
      messages: {
        fr: [
          "Si tu hesites, c'est normal. La plupart des gens ne savent pas repondre a cette question.",
          "Et c'est exactement LE probleme que Bubble resout.",
          "La vraie question n'est pas QUE choisir, mais COMMENT choisir. Et surtout : qu'est-ce qui te correspond vraiment ?"
        ],
        en: [
          "If you're hesitating, that's normal. Most people don't know how to answer this question.",
          "And that's exactly THE problem Bubble solves.",
          "The real question isn't WHAT to choose, but HOW to choose. And most importantly: what really fits YOU?"
        ]
      },
      cta: {
        fr: "Ca m'interesse",
        en: "I'm interested"
      }
    },

    education_spectrum: {
      messages: {
        fr: [
          "Voici le secret : il n'y a pas de bonne ou mauvaise reponse. Chacun a sa propre tolerance au risque.",
          "Chez Bubble, on a identifie 11 profils differents - de 0% actions (securite totale) a 100% actions (croissance maximale).",
          "Ton profil ideal depend de comment tu VIS emotionnellement les hauts et les bas. Pas de ce que tu PENSES vouloir.",
          "Je vais te poser quelques scenarios concrets. Reponds spontanement - il n'y a pas de piege !"
        ],
        en: [
          "Here's the secret: there's no right or wrong answer. Everyone has their own risk tolerance.",
          "At Bubble, we identified 11 different profiles - from 0% stocks (total safety) to 100% stocks (maximum growth).",
          "Your ideal profile depends on how you LIVE emotionally through the ups and downs. Not what you THINK you want.",
          "I'm going to ask you a few concrete scenarios. Answer spontaneously - there's no trick!"
        ]
      },
      cta: {
        fr: "C'est parti !",
        en: "Let's go!"
      }
    },

    scenario_crisis: {
      intro: {
        fr: "Mars 2020. Le confinement est annonce. Les marches s'effondrent de 35% en 3 semaines. Ton portefeuille affiche -18 000€.",
        en: "March 2020. Lockdown is announced. Markets crash 35% in 3 weeks. Your portfolio shows -€18,000."
      },
      question: {
        fr: "Que fais-tu ?",
        en: "What do you do?"
      },
      options: [
        {
          id: 'panic',
          text: { fr: "Je vends tout immediatement. Et si ca ne remontait jamais ?", en: "I sell everything immediately. What if it never recovers?" },
          score: 0
        },
        {
          id: 'anxious',
          text: { fr: "Tres inquiet, je regarde 5x/jour, mais je ne vends pas", en: "Very worried, I check 5x/day, but I don't sell" },
          score: 25
        },
        {
          id: 'stressed',
          text: { fr: "Stresse mais je me dis 'c'est temporaire'. Je regarde 1x/semaine", en: "Stressed but I tell myself 'it's temporary'. I check once a week" },
          score: 50
        },
        {
          id: 'calm',
          text: { fr: "Je ne regarde pas pendant 2 mois. Quand je regarde, c'est remonte", en: "I don't check for 2 months. When I look, it's recovered" },
          score: 75
        },
        {
          id: 'opportunist',
          text: { fr: "Super, c'est en solde ! J'augmente mes versements", en: "Great, it's on sale! I increase my contributions" },
          score: 100
        }
      ]
    },

    scenario_bonus: {
      intro: {
        fr: "Tu recois un bonus de 10 000€. L'economie va bien, les marches ont fait +25% cette annee.",
        en: "You receive a €10,000 bonus. The economy is doing well, markets are up 25% this year."
      },
      question: {
        fr: "Qu'en fais-tu ?",
        en: "What do you do with it?"
      },
      options: [
        {
          id: 'all_safe',
          text: { fr: "Tout en fonds euros. Les marches sont trop hauts", en: "All in bonds/cash. Markets are too high" },
          score: 0
        },
        {
          id: 'mostly_safe',
          text: { fr: "2 000€ en actions, 8 000€ en securise", en: "€2k in stocks, €8k in safe assets" },
          score: 25
        },
        {
          id: 'balanced',
          text: { fr: "50/50 - Je profite avec un filet de securite", en: "50/50 - I benefit with a safety net" },
          score: 50
        },
        {
          id: 'mostly_stocks',
          text: { fr: "7 000€ en actions, 3 000€ securise", en: "€7k in stocks, €3k safe" },
          score: 75
        },
        {
          id: 'all_stocks',
          text: { fr: "100% actions. Sur 20 ans, ca montera encore", en: "100% stocks. In 20 years, it'll go higher" },
          score: 100
        }
      ]
    },

    scenario_horizon: {
      intro: {
        fr: "Tu as 50 000€ a investir aujourd'hui.",
        en: "You have €50,000 to invest today."
      },
      question: {
        fr: "Dans combien de temps auras-tu besoin de cet argent ?",
        en: "When will you need this money?"
      },
      options: [
        {
          id: 'short',
          text: { fr: "Moins de 3 ans (ou je ne sais pas)", en: "Less than 3 years (or I don't know)" },
          score: 0
        },
        {
          id: 'medium_short',
          text: { fr: "3-5 ans (achat immo, travaux...)", en: "3-5 years (real estate, renovations...)" },
          score: 25
        },
        {
          id: 'medium',
          text: { fr: "5-10 ans (projet moyen terme)", en: "5-10 years (medium-term project)" },
          score: 50
        },
        {
          id: 'long',
          text: { fr: "10-20 ans (retraite, projet lointain)", en: "10-20 years (retirement, distant project)" },
          score: 75
        },
        {
          id: 'very_long',
          text: { fr: "20-30 ans minimum (retraite lointaine)", en: "20-30 years minimum (distant retirement)" },
          score: 100
        }
      ]
    },

    scenario_friends: {
      intro: {
        fr: "Tu es au restaurant avec des amis. Ils parlent de leurs investissements.",
        en: "You're at a restaurant with friends. They're talking about their investments."
      },
      question: {
        fr: "Que ressens-tu ?",
        en: "How do you feel?"
      },
      options: [
        {
          id: 'avoid',
          text: { fr: "Moi je ne touche pas a la bourse, c'est trop risque", en: "I don't touch the stock market, too risky" },
          score: 0
        },
        {
          id: 'cautious',
          text: { fr: "J'ai mis un petit peu, mais vraiment tres peu", en: "I put in a little, but really very little" },
          score: 25
        },
        {
          id: 'balanced_talk',
          text: { fr: "J'ai un mix actions/fonds euros. L'equilibre, quoi", en: "I have a stocks/bonds mix. Balance, you know" },
          score: 50
        },
        {
          id: 'growth_talk',
          text: { fr: "Majoritairement en actions, avec un peu de securise", en: "Mostly stocks, with some safe assets" },
          score: 75
        },
        {
          id: 'aggressive_talk',
          text: { fr: "100% actions ! Les krachs ? Des opportunites d'achat", en: "100% stocks! Crashes? Buying opportunities" },
          score: 100
        }
      ]
    },

    scenario_layoffs: {
      intro: {
        fr: "Ton secteur d'activite connait des licenciements. Tu n'es pas concerne, mais l'ambiance est anxiogene.",
        en: "Your industry is seeing layoffs. You're not affected, but the atmosphere is anxious."
      },
      question: {
        fr: "Que fais-tu avec tes placements ?",
        en: "What do you do with your investments?"
      },
      options: [
        {
          id: 'reduce',
          text: { fr: "Je reduis ma part d'actions. Et si j'etais le prochain ?", en: "I reduce my stock allocation. What if I'm next?" },
          score: 0
        },
        {
          id: 'uncomfortable',
          text: { fr: "Je ne change rien mais je verifie mon epargne de precaution", en: "I don't change but check my emergency fund" },
          score: 33
        },
        {
          id: 'separate',
          text: { fr: "Je ne change rien. Mon epargne de precaution est la pour ca", en: "I don't change. My emergency fund is for that" },
          score: 66
        },
        {
          id: 'opportunity',
          text: { fr: "Si mon secteur va mal, les actions vont baisser. Opportunite !", en: "If my sector struggles, stocks will drop. Opportunity!" },
          score: 100
        }
      ]
    },

    profile_reveal: {
      intro: {
        fr: "Merci pour tes reponses ! Voici ton profil de risque :",
        en: "Thanks for your answers! Here's your risk profile:"
      },
      explanation: {
        fr: "Ce profil reflete ta tolerance au risque basee sur tes reponses emotionnelles. Il n'y a pas de bon ou mauvais profil - juste celui qui te correspond.",
        en: "This profile reflects your risk tolerance based on your emotional responses. There's no good or bad profile - just the one that fits you."
      }
    },

    bubble_solution: {
      messages: {
        fr: [
          "Et maintenant, la question a 1 million d'euros : qui va gerer ton portefeuille selon ce profil ?",
          "C'est la que Bubble entre en jeu.",
          "Bubble cree des portefeuilles personnalises bases sur TON profil de risque. Pas une solution generique vendue a tout le monde.",
          "On teste chaque strategie sur 20+ ans de donnees historiques. Tu vois exactement comment ton portefeuille aurait performe pendant les crises, les euphories, et tout le reste.",
          "Tu merites une strategie qui te ressemble, pas une solution toute faite."
        ],
        en: [
          "And now, the million-dollar question: who's going to manage your portfolio according to this profile?",
          "That's where Bubble comes in.",
          "Bubble creates personalized portfolios based on YOUR risk profile. Not a generic solution sold to everyone.",
          "We test each strategy on 20+ years of historical data. You see exactly how your portfolio would have performed during crises, euphoria, and everything in between.",
          "You deserve a strategy that fits you, not a one-size-fits-all solution."
        ]
      }
    },

    transition: {
      fr: "Maintenant tu peux explorer nos outils, me poser des questions, ou rejoindre Bubble pour automatiser tout ca :",
      en: "Now you can explore our tools, ask me questions, or join Bubble to automate all of this:"
    },

    nav_cards: {
      arena: {
        iconKey: 'eye',
        title: { fr: "Observer l'Arena", en: "Watch the Arena" },
        desc: { fr: "4 bots IA s'affrontent sur 20 ans de donnees", en: "4 AI bots compete over 20 years of data" },
        url: { fr: '/investors/education/arena', en: '/en/investors/education/arena' }
      },
      simulator: {
        iconKey: 'wrench',
        title: { fr: "Creer ma Strategie", en: "Build My Strategy" },
        desc: { fr: "Construis et teste ton allocation", en: "Build and test your allocation" },
        url: { fr: '/investors/education/simulator', en: '/en/investors/education/simulator' }
      },
      resources: {
        iconKey: 'book',
        title: { fr: "Approfondir", en: "Learn More" },
        desc: { fr: "Videos et ressources educatives", en: "Videos and educational resources" },
        url: { fr: '/investors/playground/resources', en: '/en/investors/playground/resources' }
      }
    }
  };

  /**
   * Get current language
   */
  function getLang() {
    const stored = localStorage.getItem('bubbleLanguage');
    if (stored) return stored;
    return document.documentElement.lang || 'fr';
  }

  /**
   * Get text in current language
   */
  function t(obj) {
    if (typeof obj === 'string') return obj;
    const lang = getLang();
    return obj[lang] || obj.fr || obj.en || '';
  }

  /**
   * Load or initialize session
   */
  function loadSession() {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        session = JSON.parse(stored);
        return true;
      } catch (e) {
        console.error('Failed to parse session:', e);
      }
    }

    session = {
      started: Date.now(),
      stage: STAGES.welcome,
      scores: [],
      profile: null,
      answers: {},
      conversation: []
    };
    saveSession();
    return false;
  }

  /**
   * Save session
   */
  function saveSession() {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  /**
   * Calculate profile from scores (0-100 scale, rounded to nearest 10)
   */
  function calculateProfile() {
    if (session.scores.length === 0) return 50;
    const avg = session.scores.reduce((a, b) => a + b, 0) / session.scores.length;
    return Math.round(avg / 10) * 10;
  }

  /**
   * Create message bubble
   */
  function createMessageBubble(content, type = 'bot') {
    const bubble = document.createElement('div');
    bubble.className = `playground-message ${type}`;

    if (type === 'bot') {
      bubble.innerHTML = `
        <div class="message-avatar">
          <svg width="20" height="20" viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="41" r="22" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-dasharray="120 24" stroke-dashoffset="8"/>
            <circle cx="54" cy="22" r="5" fill="currentColor"/>
          </svg>
        </div>
        <div class="message-content">${formatMessage(content)}</div>
      `;
    } else {
      bubble.innerHTML = `<div class="message-content">${escapeHtml(content)}</div>`;
    }

    return bubble;
  }

  function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function formatMessage(text) {
    if (!text) return '';
    let html = escapeHtml(text);
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\n/g, '<br>');
    return html;
  }

  /**
   * Show typing indicator
   */
  function showTyping() {
    const typing = document.createElement('div');
    typing.className = 'playground-typing';
    typing.id = 'playgroundTyping';
    typing.innerHTML = `
      <div class="playground-typing-bubble">
        <span></span><span></span><span></span>
      </div>
    `;
    messagesContainer.appendChild(typing);
    scrollToBottom();
    return typing;
  }

  function hideTyping() {
    const typing = document.getElementById('playgroundTyping');
    if (typing) typing.remove();
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Add message with typing delay
   */
  async function addMessage(content, type = 'bot', delay = 0) {
    return new Promise(resolve => {
      if (delay > 0 && type === 'bot') {
        const typing = showTyping();
        setTimeout(() => {
          typing.remove();
          const bubble = createMessageBubble(content, type);
          messagesContainer.appendChild(bubble);
          scrollToBottom();
          session.conversation.push({ role: type === 'bot' ? 'assistant' : 'user', content });
          saveSession();
          resolve();
        }, delay);
      } else {
        const bubble = createMessageBubble(content, type);
        messagesContainer.appendChild(bubble);
        scrollToBottom();
        session.conversation.push({ role: type === 'bot' ? 'assistant' : 'user', content });
        saveSession();
        resolve();
      }
    });
  }

  /**
   * Add element to chat
   */
  function addElement(element) {
    messagesContainer.appendChild(element);
    scrollToBottom();
  }

  /**
   * Create option buttons
   */
  function createOptions(options, onSelect) {
    const container = document.createElement('div');
    container.className = 'playground-options';

    options.forEach((option, index) => {
      const btn = document.createElement('button');
      btn.className = 'playground-option';
      btn.textContent = t(option.text);
      btn.style.animationDelay = `${0.1 + index * 0.05}s`;
      btn.addEventListener('click', () => {
        container.querySelectorAll('.playground-option').forEach(b => b.disabled = true);
        btn.classList.add('selected');
        setTimeout(() => {
          container.remove();
          onSelect(option);
        }, 300);
      });
      container.appendChild(btn);
    });

    return container;
  }

  /**
   * Create navigation cards
   */
  function createNavCards() {
    const container = document.createElement('div');
    container.className = 'playground-nav-cards';

    ['arena', 'simulator', 'resources'].forEach(key => {
      const card = CONTENT.nav_cards[key];
      const el = document.createElement('a');
      el.href = t(card.url);
      el.className = 'playground-nav-card';
      el.innerHTML = `
        <span class="nav-card-icon">${ICONS[card.iconKey] || ''}</span>
        <div class="nav-card-content">
          <span class="nav-card-title">${t(card.title)}</span>
          <span class="nav-card-description">${t(card.desc)}</span>
        </div>
        <svg class="nav-card-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      `;
      container.appendChild(el);
    });

    return container;
  }

  /**
   * Create profile card
   */
  function createProfileCard(profileLevel) {
    const profile = PROFILES[profileLevel];
    const lang = getLang();
    const iconSvg = ICONS[profile.icon] || '';

    const container = document.createElement('div');
    container.className = 'playground-profile-card';

    container.innerHTML = `
      <div class="profile-badge"><span class="profile-icon">${iconSvg}</span> ${t(profile.name)}</div>
      <p class="profile-description">${t(profile.description)}</p>
      <div class="profile-allocation">
        <span class="allocation-item">${profile.stocks}% ${lang === 'fr' ? 'Actions' : 'Stocks'}</span>
        <span class="allocation-item">${profile.bonds}% ${lang === 'fr' ? 'Fonds Euros' : 'Bonds'}</span>
      </div>
      <div class="profile-spectrum">
        <div class="spectrum-bar">
          <div class="spectrum-marker" style="left: ${profileLevel}%"></div>
        </div>
        <div class="spectrum-labels">
          <span>${lang === 'fr' ? 'Prudent' : 'Conservative'}</span>
          <span>${lang === 'fr' ? 'Dynamique' : 'Growth'}</span>
        </div>
      </div>
      <p class="profile-note">${t(CONTENT.profile_reveal.explanation)}</p>
    `;

    return container;
  }

  /**
   * Handle welcome stage - poses the key question
   */
  async function handleWelcome() {
    const messages = t(CONTENT.welcome.messages);

    for (let i = 0; i < messages.length; i++) {
      await addMessage(messages[i], 'bot', i === 0 ? 600 : 1000);
    }

    // Ask the key question about 50k allocation
    await addMessage(t(CONTENT.welcome.question), 'bot', 1200);

    setTimeout(() => {
      const options = createOptions([
        { id: 'start', text: CONTENT.welcome.cta, score: 0 }
      ], () => {
        addMessage(t(CONTENT.welcome.cta), 'user');
        session.stage = STAGES.education_problem;
        saveSession();
        setTimeout(() => handleEducationProblem(), 500);
      });
      addElement(options);
    }, 800);
  }

  /**
   * Handle education about the problem most people face
   */
  async function handleEducationProblem() {
    const messages = t(CONTENT.education_problem.messages);

    for (let i = 0; i < messages.length; i++) {
      await addMessage(messages[i], 'bot', i === 0 ? 800 : 1200);
    }

    setTimeout(() => {
      const options = createOptions([
        { id: 'interested', text: CONTENT.education_problem.cta, score: 0 }
      ], () => {
        addMessage(t(CONTENT.education_problem.cta), 'user');
        session.stage = STAGES.education_spectrum;
        saveSession();
        setTimeout(() => handleEducationSpectrum(), 500);
      });
      addElement(options);
    }, 800);
  }

  /**
   * Handle education about the 11-profile spectrum
   */
  async function handleEducationSpectrum() {
    const messages = t(CONTENT.education_spectrum.messages);

    for (let i = 0; i < messages.length; i++) {
      await addMessage(messages[i], 'bot', i === 0 ? 800 : 1200);
    }

    setTimeout(() => {
      const options = createOptions([
        { id: 'ready', text: CONTENT.education_spectrum.cta, score: 0 }
      ], () => {
        addMessage(t(CONTENT.education_spectrum.cta), 'user');
        session.stage = STAGES.scenario_crisis;
        saveSession();
        setTimeout(() => handleScenario('crisis'), 500);
      });
      addElement(options);
    }, 800);
  }

  /**
   * Handle scenario questions
   */
  async function handleScenario(scenarioKey) {
    const scenarioMap = {
      'crisis': { content: CONTENT.scenario_crisis, next: STAGES.scenario_bonus },
      'bonus': { content: CONTENT.scenario_bonus, next: STAGES.scenario_horizon },
      'horizon': { content: CONTENT.scenario_horizon, next: STAGES.scenario_friends },
      'friends': { content: CONTENT.scenario_friends, next: STAGES.scenario_layoffs },
      'layoffs': { content: CONTENT.scenario_layoffs, next: STAGES.profile_reveal }
    };

    const scenario = scenarioMap[scenarioKey];
    if (!scenario) return;

    await addMessage(t(scenario.content.intro), 'bot', 800);
    await addMessage(t(scenario.content.question), 'bot', 600);

    setTimeout(() => {
      const options = createOptions(scenario.content.options, (selected) => {
        addMessage(t(selected.text), 'user');
        session.scores.push(selected.score);
        session.answers[scenarioKey] = selected.id;
        session.stage = scenario.next;
        saveSession();

        if (scenario.next === STAGES.profile_reveal) {
          setTimeout(() => handleProfileReveal(), 500);
        } else {
          const nextKey = scenario.next.replace('scenario_', '');
          setTimeout(() => handleScenario(nextKey), 500);
        }
      });
      addElement(options);
    }, 400);
  }

  /**
   * Handle profile reveal
   */
  async function handleProfileReveal() {
    const profileLevel = calculateProfile();
    session.profile = profileLevel;
    saveSession();

    await addMessage(t(CONTENT.profile_reveal.intro), 'bot', 800);

    setTimeout(() => {
      const profileCard = createProfileCard(profileLevel);
      addElement(profileCard);

      setTimeout(async () => {
        // Now explain Bubble's solution
        session.stage = STAGES.bubble_solution;
        saveSession();
        await handleBubbleSolution();
      }, 1500);
    }, 500);
  }

  /**
   * Handle Bubble solution explanation - the "raison d'etre"
   */
  async function handleBubbleSolution() {
    const messages = t(CONTENT.bubble_solution.messages);

    for (let i = 0; i < messages.length; i++) {
      await addMessage(messages[i], 'bot', i === 0 ? 1000 : 1500);
    }

    setTimeout(async () => {
      await addMessage(t(CONTENT.transition), 'bot', 1000);

      // Add voice input hint message with mic icon
      const lang = getLang();
      const voiceHint = lang === 'fr'
        ? 'Tu peux répondre en tapant ou en utilisant le micro.'
        : 'You can type your answer or use voice input.';
      await addMessage(voiceHint, 'bot', 600);

      setTimeout(() => {
        const navCards = createNavCards();
        addElement(navCards);

        session.stage = STAGES.free_chat;
        saveSession();

        // Enable input for free-form questions (text + voice)
        enableInput();
      }, 500);
    }, 1000);
  }

  /**
   * Send message to LLM
   */
  async function sendToLLM(message) {
    if (abortController) abortController.abort();
    abortController = new AbortController();

    addMessage(message, 'user');
    const typing = showTyping();

    const bubble = createMessageBubble('', 'bot');
    const contentEl = bubble.querySelector('.message-content');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          language: getLang(),
          pageContext: 'playground',
          history: session.conversation.slice(-10),
          contextMetadata: {
            profile: {
              level: session.profile <= 30 ? 'beginner' : session.profile <= 60 ? 'intermediate' : 'advanced',
              riskProfile: session.profile,
              answers: session.answers
            }
          }
        }),
        signal: abortController.signal
      });

      typing.remove();
      messagesContainer.appendChild(bubble);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          const data = line.replace('data: ', '');
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullResponse += parsed.content;
              contentEl.innerHTML = formatMessage(fullResponse);
              scrollToBottom();
            }
          } catch (e) {}
        }
      }

      if (fullResponse) {
        session.conversation.push({ role: 'assistant', content: fullResponse });
        saveSession();
      }

    } catch (error) {
      typing.remove();
      if (error.name === 'AbortError') return;

      const errorMsg = getLang() === 'fr'
        ? "Desole, une erreur s'est produite. Reessaie."
        : "Sorry, an error occurred. Try again.";
      addMessage(errorMsg, 'bot');
    }
  }

  /**
   * Resume from saved session
   */
  function resumeSession() {
    // Replay last few messages
    const recent = session.conversation.slice(-6);
    recent.forEach(msg => {
      const bubble = createMessageBubble(msg.content, msg.role === 'assistant' ? 'bot' : 'user');
      bubble.style.animation = 'none';
      messagesContainer.appendChild(bubble);
    });
    scrollToBottom();

    // Continue based on stage
    if (session.stage === STAGES.free_chat) {
      // Enable input for free-form questions (text + voice)
      enableInput();
      // Show welcome back
      const lang = getLang();
      setTimeout(async () => {
        await addMessage(
          lang === 'fr'
            ? "Content de te revoir ! Tu peux continuer à me poser des questions en tapant ou en utilisant le micro."
            : "Good to see you again! Feel free to keep asking questions by typing or using voice input.",
          'bot', 500
        );
        const navCards = createNavCards();
        addElement(navCards);
      }, 300);
    } else {
      // Continue onboarding
      handleStage(session.stage);
    }
  }

  function handleStage(stage) {
    switch (stage) {
      case STAGES.welcome:
        handleWelcome();
        break;
      case STAGES.education_problem:
        handleEducationProblem();
        break;
      case STAGES.education_spectrum:
        handleEducationSpectrum();
        break;
      case STAGES.scenario_crisis:
        handleScenario('crisis');
        break;
      case STAGES.scenario_bonus:
        handleScenario('bonus');
        break;
      case STAGES.scenario_horizon:
        handleScenario('horizon');
        break;
      case STAGES.scenario_friends:
        handleScenario('friends');
        break;
      case STAGES.scenario_layoffs:
        handleScenario('layoffs');
        break;
      case STAGES.profile_reveal:
        handleProfileReveal();
        break;
      case STAGES.bubble_solution:
        handleBubbleSolution();
        break;
    }
  }

  /**
   * Initialize voice recognition (Web Speech API)
   */
  function initVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return false;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    // Set language based on current language
    const lang = getLang();
    recognition.lang = lang === 'fr' ? 'fr-FR' : 'en-US';

    recognition.onstart = function() {
      isRecording = true;
      if (micButton) {
        micButton.classList.add('recording');
        micButton.innerHTML = ICONS.micOff;
      }
    };

    recognition.onend = function() {
      isRecording = false;
      if (micButton) {
        micButton.classList.remove('recording');
        micButton.innerHTML = ICONS.mic;
      }
    };

    recognition.onresult = function(event) {
      const transcript = event.results[0][0].transcript;
      if (transcript && inputField) {
        inputField.value = transcript;
        // Auto-submit if in free chat mode
        if (session.stage === STAGES.free_chat) {
          handleUserInput(transcript);
          inputField.value = '';
        }
      }
    };

    recognition.onerror = function(event) {
      console.error('Speech recognition error:', event.error);
      isRecording = false;
      if (micButton) {
        micButton.classList.remove('recording');
        micButton.innerHTML = ICONS.mic;
      }
    };

    return true;
  }

  /**
   * Toggle voice recording
   */
  function toggleVoiceRecording() {
    if (!recognition) {
      const supported = initVoiceRecognition();
      if (!supported) {
        const lang = getLang();
        const errorMsg = lang === 'fr'
          ? "La reconnaissance vocale n'est pas supportee par ton navigateur."
          : "Voice recognition is not supported in your browser.";
        addMessage(errorMsg, 'bot', 300);
        return;
      }
    }

    // Update language on each use
    const lang = getLang();
    recognition.lang = lang === 'fr' ? 'fr-FR' : 'en-US';

    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
    }
  }

  /**
   * Enable text/voice input
   */
  function enableInput() {
    if (inputField) {
      inputField.disabled = false;
      inputField.placeholder = getLang() === 'fr'
        ? 'Tape ici ou utilise le micro...'
        : 'Type anything or use voice...';
    }
    if (sendButton) {
      sendButton.disabled = false;
    }
    if (micButton) {
      micButton.disabled = false;
    }
  }

  /**
   * Disable text/voice input
   */
  function disableInput() {
    if (inputField) {
      inputField.disabled = true;
    }
    if (sendButton) {
      sendButton.disabled = true;
    }
    if (micButton) {
      micButton.disabled = true;
    }
  }

  /**
   * Initialize
   */
  function init() {
    messagesContainer = document.getElementById('playgroundMessages');
    inputField = document.getElementById('playgroundInput');
    inputForm = document.getElementById('playgroundForm');
    sendButton = document.querySelector('.playground-send-btn');
    micButton = document.getElementById('playgroundMicBtn');

    if (!messagesContainer) {
      console.error('Playground messages container not found');
      return;
    }

    // Initialize voice recognition if supported
    initVoiceRecognition();

    // Setup mic button
    if (micButton) {
      micButton.addEventListener('click', (e) => {
        e.preventDefault();
        toggleVoiceRecording();
      });
    }

    // Enable input from the start - users can type or use voice at any time
    enableInput();

    // Setup form submission - FIX: bind directly to input and button
    if (inputForm) {
      inputForm.addEventListener('submit', (e) => {
        e.preventDefault();
        submitUserMessage();
      });
    }

    // Also bind click on send button
    if (sendButton) {
      sendButton.addEventListener('click', (e) => {
        e.preventDefault();
        submitUserMessage();
      });
    }

    // Also bind Enter key on input field
    if (inputField) {
      inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          submitUserMessage();
        }
      });
    }

    // Load session
    const hasSession = loadSession();

    if (hasSession && session.conversation.length > 0) {
      resumeSession();
    } else {
      handleWelcome();
    }
  }

  /**
   * Submit user message from input field
   */
  function submitUserMessage() {
    if (!inputField) return;
    const text = inputField.value.trim();
    if (text) {
      handleUserInput(text);
      inputField.value = '';
    }
  }

  /**
   * Handle user input - works in both scripted and free-chat modes
   */
  function handleUserInput(text) {
    if (!text.trim()) return;

    // In free-chat mode, send to LLM
    if (session.stage === STAGES.free_chat) {
      sendToLLM(text);
      return;
    }

    // During onboarding, show user message but don't process (options handle the flow)
    // This allows the user to see their typed input even during scripted mode
    addMessage(text, 'user');
  }

  /**
   * Reset session
   */
  function reset() {
    if (abortController) abortController.abort();
    if (recognition && isRecording) {
      recognition.stop();
    }
    sessionStorage.removeItem(SESSION_KEY);
    if (messagesContainer) messagesContainer.innerHTML = '';
    loadSession();
    enableInput();
    handleWelcome();
  }

  return {
    init,
    reset,
    enableInput,
    disableInput,
    getSession: () => session ? { ...session } : null,
    getProfile: () => session?.profile
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PlaygroundFullscreenChat;
}
