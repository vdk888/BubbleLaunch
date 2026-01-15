/**
 * Bubble Playground - Full-Screen Chatbot Experience
 * CONVERSATIONAL onboarding that discovers user risk profile through natural dialogue
 * Leverages BubbleAgentMemory for persistent profile building
 * Supports French and English with automatic language detection
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
  let hasShownWelcomeMessage = false;

  // Reference to BubbleAgentMemory (loaded externally)
  let Memory = null;

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
    0: { name: { fr: 'Sécurité Absolue', en: 'Absolute Security' }, stocks: 0, bonds: 100, icon: 'shield', description: { fr: 'Tu préfères la tranquillité. Ton argent dort en sécurité.', en: 'You prefer peace of mind. Your money sleeps safely.' } },
    10: { name: { fr: 'Très Prudent', en: 'Very Conservative' }, stocks: 10, bonds: 90, icon: 'turtle', description: { fr: 'Un tout petit pied dans les marchés, juste pour voir.', en: 'A tiny foot in the markets, just to see.' } },
    20: { name: { fr: 'Prudent', en: 'Conservative' }, stocks: 20, bonds: 80, icon: 'seedling', description: { fr: 'Tu acceptes un peu de mouvement pour un peu plus de rendement.', en: 'You accept some movement for a bit more return.' } },
    30: { name: { fr: 'Prudent+', en: 'Conservative+' }, stocks: 30, bonds: 70, icon: 'leaf', description: { fr: 'Tu commences à apprécier le potentiel des marchés.', en: 'You start appreciating market potential.' } },
    40: { name: { fr: 'Équilibre Défensif', en: 'Defensive Balanced' }, stocks: 40, bonds: 60, icon: 'scale', description: { fr: 'Un bon équilibre penché vers la sécurité.', en: 'A good balance leaning toward safety.' } },
    50: { name: { fr: 'Équilibré', en: 'Balanced' }, stocks: 50, bonds: 50, icon: 'target', description: { fr: 'Le classique 50/50 : moitié sécurité, moitié croissance.', en: 'The classic 50/50: half safety, half growth.' } },
    60: { name: { fr: 'Équilibre Dynamique', en: 'Dynamic Balanced' }, stocks: 60, bonds: 40, icon: 'trendUp', description: { fr: 'Tu privilégies la croissance avec un filet de sécurité.', en: 'You favor growth with a safety net.' } },
    70: { name: { fr: 'Dynamique', en: 'Growth' }, stocks: 70, bonds: 30, icon: 'rocket', description: { fr: 'Tu acceptes les montagnes russes pour viser plus haut.', en: 'You accept roller coasters to aim higher.' } },
    80: { name: { fr: 'Dynamique+', en: 'Growth+' }, stocks: 80, bonds: 20, icon: 'bolt', description: { fr: 'Les baisses temporaires ne te font pas peur.', en: 'Temporary drops don\'t scare you.' } },
    90: { name: { fr: 'Très Dynamique', en: 'Very Aggressive' }, stocks: 90, bonds: 10, icon: 'flame', description: { fr: 'Tu vois les krachs comme des opportunités d\'achat.', en: 'You see crashes as buying opportunities.' } },
    100: { name: { fr: 'Croissance Max', en: 'Maximum Growth' }, stocks: 100, bonds: 0, icon: 'gem', description: { fr: '100% actions. Tu joues le long terme sans filet.', en: '100% stocks. You play the long game with no safety net.' } }
  };

  // Conversation stages - simplified for conversational onboarding
  const STAGES = {
    onboarding_active: 'onboarding_active',  // LLM-driven conversational discovery
    profile_reveal: 'profile_reveal',         // Show calculated profile
    free_chat: 'free_chat'                    // Post-onboarding free questions
  };

  // Minimum confidence to complete onboarding (0-100)
  const MIN_CONFIDENCE_TO_REVEAL = 70;
  // Minimum exchanges before allowing profile reveal
  const MIN_EXCHANGES_FOR_PROFILE = 3;

  /**
   * Parse PROFILE_UPDATE from LLM response
   * Format: <!-- PROFILE_UPDATE {...json...} -->
   * @param {string} response - LLM response text
   * @returns {{ cleanResponse: string, profileUpdate: object|null }}
   */
  function parseProfileUpdate(response) {
    const regex = /<!--\s*PROFILE_UPDATE\s*([\s\S]*?)\s*-->/;
    const match = response.match(regex);

    if (!match) {
      return { cleanResponse: response, profileUpdate: null };
    }

    // Remove the profile update block from visible response
    const cleanResponse = response.replace(regex, '').trim();

    try {
      // Normalize whitespace: trim and collapse internal whitespace for multi-line JSON
      let jsonStr = match[1].trim();
      // Replace multiple whitespace (including newlines) between JSON tokens with single space
      // This handles multi-line JSON with inconsistent indentation
      jsonStr = jsonStr.replace(/\s+/g, ' ');

      const profileUpdate = JSON.parse(jsonStr);
      console.log('[PlaygroundChat] Successfully parsed PROFILE_UPDATE:', profileUpdate);
      return { cleanResponse, profileUpdate };
    } catch (e) {
      // Debug logging with raw content for troubleshooting
      console.warn('[PlaygroundChat] Failed to parse PROFILE_UPDATE JSON:', e);
      console.debug('[PlaygroundChat] Raw PROFILE_UPDATE content:', match[1]);
      console.debug('[PlaygroundChat] Trimmed content length:', match[1]?.trim()?.length);
      return { cleanResponse, profileUpdate: null };
    }
  }

  /**
   * Apply profile update from LLM to BubbleAgentMemory
   * @param {object} update - Parsed profile update object
   */
  function applyProfileUpdate(update) {
    if (!Memory || !update) return;

    try {
      // Use BubbleAgentMemory's built-in method
      Memory.applyProfileUpdate(update);

      // Sync session with memory state
      const profile = Memory.getProfile();
      if (profile) {
        session.riskScore = profile.riskScore;
        session.riskConfidence = profile.riskConfidence;
        session.traits = profile.traits || [];
        saveSession();
      }

      console.log('[PlaygroundChat] Profile updated:', {
        riskScore: profile?.riskScore,
        confidence: profile?.riskConfidence,
        traits: profile?.traits?.length
      });
    } catch (e) {
      console.error('[PlaygroundChat] Failed to apply profile update:', e);
    }
  }

  /**
   * Check if onboarding is complete based on confidence
   * @returns {boolean}
   */
  function isOnboardingComplete() {
    if (!Memory) return false;
    const profile = Memory.getProfile();
    const journey = Memory.getJourney();

    const confidence = profile?.riskConfidence || 0;
    const exchanges = journey?.questionsAsked || 0;

    return confidence >= MIN_CONFIDENCE_TO_REVEAL && exchanges >= MIN_EXCHANGES_FOR_PROFILE;
  }

  /**
   * Initialize BubbleAgentMemory reference
   */
  function initMemory() {
    if (typeof BubbleAgentMemory !== 'undefined') {
      Memory = BubbleAgentMemory;

      // Sync current language with memory
      const lang = getLang();
      Memory.setPreferredLanguage(lang);

      // Log initialization
      console.log('[PlaygroundChat] BubbleAgentMemory initialized, language:', lang);
      return true;
    }

    console.warn('[PlaygroundChat] BubbleAgentMemory not available');
    return false;
  }

  /**
   * Sync language preference with memory
   */
  function syncLanguageWithMemory() {
    if (!Memory) return;
    const lang = getLang();
    Memory.setPreferredLanguage(lang);
  }

  // Content used for profile display and navigation
  const CONTENT = {
    // Profile explanation shown in profile card
    profile_reveal: {
      explanation: {
        fr: "Ce profil reflète ta tolérance au risque basée sur nos échanges. Il n'y a pas de bon ou mauvais profil - juste celui qui te correspond.",
        en: "This profile reflects your risk tolerance based on our conversation. There's no good or bad profile - just the one that fits you."
      }
    },

    // Navigation cards shown after onboarding
    nav_cards: {
      arena: {
        iconKey: 'eye',
        title: { fr: "Observer l'Arena", en: "Watch the Arena" },
        desc: { fr: "4 bots IA s'affrontent sur 20 ans de données", en: "4 AI bots compete over 20 years of data" },
        url: { fr: '/investors/education/arena', en: '/en/investors/education/arena' }
      },
      simulator: {
        iconKey: 'wrench',
        title: { fr: "Créer ma Stratégie", en: "Build My Strategy" },
        desc: { fr: "Construis et teste ton allocation", en: "Build and test your allocation" },
        url: { fr: '/investors/education/simulator', en: '/en/investors/education/simulator' }
      },
      resources: {
        iconKey: 'book',
        title: { fr: "Approfondir", en: "Learn More" },
        desc: { fr: "Vidéos et ressources éducatives", en: "Videos and educational resources" },
        url: { fr: '/investors/playground/resources', en: '/en/investors/playground/resources' }
      }
    },

    // Profile-based bot recommendations for Arena
    bot_recommendations: {
      conservative: { // Risk 0-30
        primary: 'hedgehog', // Defensive
        fr: "Avec ton profil prudent, tu devrais observer le **Hérisson** (Défensif) - il minimise les pertes pendant les crises.",
        en: "With your conservative profile, you should watch the **Hedgehog** (Defensive) - it minimizes losses during crises."
      },
      balanced: { // Risk 40-60
        primary: 'fox', // Risk Parity
        fr: "Ton profil équilibré s'aligne bien avec le **Renard** (Risk Parity) - il balance automatiquement risque et rendement.",
        en: "Your balanced profile aligns well with the **Fox** (Risk Parity) - it automatically balances risk and return."
      },
      growth: { // Risk 70-100
        primary: 'hawk', // Momentum
        fr: "Avec ton appétit pour la croissance, le **Faucon** (Momentum) devrait t'intéresser - il surfe sur les tendances fortes.",
        en: "With your appetite for growth, the **Hawk** (Momentum) should interest you - it rides strong trends."
      }
    },

    // Returning user messages based on time away - proactive and engaging
    returning_user: {
      short: { // < 24 hours
        fr: "Content de te revoir si vite ! Alors, tu as repensé à notre discussion ? Qu'est-ce qui t'a marqué ?",
        en: "Good to see you back so soon! So, have you been thinking about our chat? What stood out to you?"
      },
      medium: { // 1-7 days
        fr: "Ça fait quelques jours ! J'espère que tu as pu réfléchir à tout ça. Dis-moi, il s'est passé quelque chose côté finances depuis ?",
        en: "It's been a few days! I hope you've had time to think things through. Tell me, has anything happened on the finance side since then?"
      },
      long: { // > 7 days
        fr: "Ça fait un moment ! Ravi de te revoir. Alors, quoi de neuf ? Tu as eu des réflexions sur l'investissement entre-temps ?",
        en: "It's been a while! Great to see you again. So, what's new? Have you had any thoughts about investing in the meantime?"
      }
    }
  };

  // ===========================================
  // POST-ONBOARDING PERSONALIZATION HELPERS
  // ===========================================

  /**
   * Get profile-based recommendation category
   * @returns {'conservative'|'balanced'|'growth'}
   */
  function getProfileCategory() {
    const score = getProfileLevel();
    if (score <= 30) return 'conservative';
    if (score <= 60) return 'balanced';
    return 'growth';
  }

  /**
   * Get time away category for returning users
   * @returns {'short'|'medium'|'long'|null}
   */
  function getTimeAwayCategory() {
    if (!Memory) return null;
    const hours = Memory.getHoursSinceLastVisit();
    if (hours < 24) return 'short';
    if (hours < 168) return 'medium'; // 7 days
    return 'long';
  }

  /**
   * Build personalized welcome back message
   */
  function buildReturningUserWelcome() {
    const lang = getLang();
    const timeCategory = getTimeAwayCategory();
    const profile = Memory ? Memory.getProfile() : null;
    const journey = Memory ? Memory.getJourney() : null;

    let message = '';

    // Base welcome based on time away
    if (timeCategory && CONTENT.returning_user[timeCategory]) {
      message = t(CONTENT.returning_user[timeCategory]);
    } else {
      message = lang === 'fr' ? 'Content de te revoir !' : 'Good to see you again!';
    }

    // Add profile reminder if completed onboarding
    if (journey?.onboardingCompleted && profile?.riskScore !== null) {
      const profileLevel = getProfileLevel();
      const profileData = PROFILES[profileLevel];
      if (profileData) {
        const profileName = t(profileData.name);
        const reminder = lang === 'fr'
          ? `\n\nPour rappel, ton profil : **${profileName}** (${profileLevel}% actions)`
          : `\n\nAs a reminder, your profile: **${profileName}** (${profileLevel}% stocks)`;
        message += reminder;
      }
    }

    // Add journey progress
    if (journey) {
      const strategiesTested = journey.strategiesTested?.length || 0;
      const pagesVisited = journey.pagesVisited?.length || 0;

      if (strategiesTested > 0 || pagesVisited > 3) {
        const progress = lang === 'fr'
          ? `\n\nTu as déjà ${strategiesTested > 0 ? `testé ${strategiesTested} stratégie${strategiesTested > 1 ? 's' : ''}` : ''}${strategiesTested > 0 && pagesVisited > 3 ? ' et ' : ''}${pagesVisited > 3 ? 'exploré plusieurs pages' : ''}.`
          : `\n\nYou've already ${strategiesTested > 0 ? `tested ${strategiesTested} strateg${strategiesTested > 1 ? 'ies' : 'y'}` : ''}${strategiesTested > 0 && pagesVisited > 3 ? ' and ' : ''}${pagesVisited > 3 ? 'explored several pages' : ''}.`;
        message += progress;
      }
    }

    return message;
  }

  /**
   * Create personalized recommendation card based on profile
   */
  function createPersonalizedRecommendation() {
    const lang = getLang();
    const category = getProfileCategory();
    const rec = CONTENT.bot_recommendations[category];

    const container = document.createElement('div');
    container.className = 'playground-recommendation';
    container.innerHTML = `
      <div class="recommendation-content">
        <p>${formatMessage(t(rec))}</p>
      </div>
      <a href="${t(CONTENT.nav_cards.arena.url)}" class="recommendation-cta">
        ${ICONS.eye}
        <span>${lang === 'fr' ? "Voir dans l'Arena" : "Watch in Arena"}</span>
      </a>
    `;

    return container;
  }

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
        // Migrate old stage names if necessary
        if (session.stage && !Object.values(STAGES).includes(session.stage)) {
          // Map old stages to new simplified stages
          if (session.stage === 'free_chat') {
            session.stage = STAGES.free_chat;
          } else if (session.stage === 'profile_reveal' || session.stage === 'bubble_solution') {
            session.stage = STAGES.profile_reveal;
          } else {
            // Any other old stage becomes onboarding_active
            session.stage = STAGES.onboarding_active;
          }
          saveSession();
        }
        return true;
      } catch (e) {
        console.error('Failed to parse session:', e);
      }
    }

    session = {
      started: Date.now(),
      stage: STAGES.onboarding_active,
      riskScore: 50,                  // Current risk score (synced with Memory)
      riskConfidence: 0,              // Profile confidence (0-100)
      traits: [],                     // Personality traits discovered
      conversation: []                // Chat history
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
   * Get calculated profile level (0-100, rounded to nearest 10) from Memory
   */
  function getProfileLevel() {
    if (Memory) {
      const profile = Memory.getProfile();
      if (profile && typeof profile.riskScore === 'number') {
        return Math.round(profile.riskScore / 10) * 10;
      }
    }
    // Fallback to session
    if (typeof session?.riskScore === 'number') {
      return Math.round(session.riskScore / 10) * 10;
    }
    return 50; // Default balanced
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
   * Supports both string and array of strings (combined into single bubble with paragraphs)
   */
  async function addMessage(content, type = 'bot', delay = 0) {
    return new Promise(resolve => {
      // Convert array to single string with paragraph breaks
      const messageContent = Array.isArray(content) ? content.join('\n\n') : content;

      if (delay > 0 && type === 'bot') {
        const typing = showTyping();
        setTimeout(() => {
          typing.remove();
          const bubble = createMessageBubble(messageContent, type);
          messagesContainer.appendChild(bubble);
          scrollToBottom();
          session.conversation.push({ role: type === 'bot' ? 'assistant' : 'user', content: messageContent });
          saveSession();
          resolve();
        }, delay);
      } else {
        const bubble = createMessageBubble(messageContent, type);
        messagesContainer.appendChild(bubble);
        scrollToBottom();
        session.conversation.push({ role: type === 'bot' ? 'assistant' : 'user', content: messageContent });
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
   * Remove all suggestion buttons with smooth fade-out animation
   */
  function removeAllSuggestionButtons() {
    const buttons = messagesContainer.querySelectorAll('.playground-option, .playground-options, .chat-suggestion-btn, .chat-suggestions-container');
    buttons.forEach(el => {
      el.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      el.style.opacity = '0';
      el.style.transform = 'translateY(-8px)';
      setTimeout(() => el.remove(), 200);
    });
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
        // Remove all suggestion buttons (including this container) before processing
        removeAllSuggestionButtons();
        setTimeout(() => {
          onSelect(option);
        }, 200);
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

  // ===========================================
  // LEGACY MCQ HANDLERS REMOVED
  // Conversational onboarding now handled via LLM
  // See startConversationalOnboarding() and sendToLLM()
  // ===========================================

  // LocalStorage key for tracking interrupted onboarding transitions
  const ONBOARDING_TRANSITION_KEY = 'bubbleOnboardingTransitionPending';

  /**
   * Handle profile reveal - shows calculated profile and transitions to free chat
   */
  async function handleProfileReveal() {
    const profileLevel = getProfileLevel();
    const lang = getLang();

    // Update session stage
    session.stage = STAGES.profile_reveal;
    saveSession();

    // Mark onboarding complete in memory
    if (Memory) {
      Memory.completeOnboarding();
    }

    // Introduction message
    const introMsg = lang === 'fr'
      ? "Merci pour notre discussion ! J'ai maintenant une bonne idée de ton profil d'investisseur. Voici ce que j'ai compris :"
      : "Thanks for our chat! I now have a good sense of your investor profile. Here's what I understood:";

    await addMessage(introMsg, 'bot', 800);

    setTimeout(() => {
      const profileCard = createProfileCard(profileLevel);
      addElement(profileCard);

      // Add traits if available
      const profile = Memory ? Memory.getProfile() : null;
      if (profile?.traits && profile.traits.length > 0) {
        setTimeout(async () => {
          const traitsMsg = lang === 'fr'
            ? `Tes traits principaux : ${profile.traits.slice(0, 4).join(', ')}`
            : `Your main traits: ${profile.traits.slice(0, 4).join(', ')}`;
          await addMessage(traitsMsg, 'bot', 400);
        }, 600);
      }

      setTimeout(async () => {
        // Profile-based recommendation message
        const category = getProfileCategory();
        const recMsg = t(CONTENT.bot_recommendations[category]);
        await addMessage(recMsg, 'bot', 600);

        setTimeout(() => {
          // Personalized recommendation card
          const recommendation = createPersonalizedRecommendation();
          addElement(recommendation);

          setTimeout(async () => {
            // Transition message
            const transitionMsg = lang === 'fr'
              ? "Tu peux aussi explorer le Simulateur, me poser des questions, ou simplement continuer à discuter !"
              : "You can also explore the Simulator, ask me questions, or just keep chatting!";
            await addMessage(transitionMsg, 'bot', 500);

            setTimeout(() => {
              const navCards = createNavCards();
              addElement(navCards);

              session.stage = STAGES.free_chat;
              saveSession();

              // Clear the transition flag - onboarding completed successfully
              localStorage.removeItem(ONBOARDING_TRANSITION_KEY);
              console.log('[PlaygroundChat] Onboarding transition completed successfully');

              enableInput();
            }, 400);
          }, 600);
        }, 500);
      }, 1500);
    }, 500);
  }

  /**
   * Send message to LLM with profile extraction support
   */
  async function sendToLLM(message) {
    if (abortController) abortController.abort();
    abortController = new AbortController();

    addMessage(message, 'user');

    // Track that user is engaging (journey tracking)
    if (Memory) {
      Memory.recordQuestion('onboarding');
    }

    const typing = showTyping();

    const bubble = createMessageBubble('', 'bot');
    const contentEl = bubble.querySelector('.message-content');

    // Build context metadata from Memory
    const memoryProfile = Memory ? Memory.getProfile() : null;
    const memoryJourney = Memory ? Memory.getJourney() : null;
    // keyInsights is in Memory.getMemory(), not in the profile object
    const memoryData = Memory ? Memory.getMemory() : null;
    const isOnboarding = session.stage === STAGES.onboarding_active;

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
            isOnboarding,
            onboardingStage: isOnboarding ? 'conversational' : 'free_chat',
            profile: memoryProfile ? {
              riskScore: memoryProfile.riskScore,
              riskConfidence: memoryProfile.riskConfidence,
              traits: memoryProfile.traits,
              goal: memoryProfile.goal,
              horizon: memoryProfile.horizon,
              level: memoryProfile.level,
              // Fix BUG 9: keyInsights is in Memory.getMemory(), not memoryProfile
              keyInsights: memoryData?.keyInsights?.slice(-5).map(i => i.insight) || []
            } : {
              riskScore: session.riskScore || 50,
              riskConfidence: session.riskConfidence || 0,
              traits: session.traits || []
            },
            journey: memoryJourney ? {
              questionsAsked: memoryJourney.questionsAsked,
              sessionsCount: memoryJourney.sessionsCount,
              currentPhase: memoryJourney.currentPhase
            } : null
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
              // Display with profile update block hidden (temporary, will be cleaned after)
              const tempClean = fullResponse.replace(/<!--\s*PROFILE_UPDATE[\s\S]*?-->/g, '');
              contentEl.innerHTML = formatMessage(tempClean);
              scrollToBottom();
            }
          } catch (e) {}
        }
      }

      // Parse and apply profile update from LLM response
      const { cleanResponse, profileUpdate } = parseProfileUpdate(fullResponse);

      // Update display with clean response (no JSON block)
      contentEl.innerHTML = formatMessage(cleanResponse);

      // Apply profile update to memory
      if (profileUpdate) {
        applyProfileUpdate(profileUpdate);
      }

      // Save clean response to conversation history
      if (cleanResponse) {
        session.conversation.push({ role: 'assistant', content: cleanResponse });
        saveSession();
      }

      // Check if onboarding should complete (confidence threshold met)
      if (isOnboarding && isOnboardingComplete()) {
        // Set transition flag BEFORE starting the reveal process
        // This allows recovery if user navigates away during the 800ms timeout
        localStorage.setItem(ONBOARDING_TRANSITION_KEY, 'true');
        console.log('[PlaygroundChat] Onboarding complete - starting profile reveal transition');

        setTimeout(() => {
          handleProfileReveal();
        }, 800);
      }

    } catch (error) {
      typing.remove();
      if (error.name === 'AbortError') return;

      const errorMsg = getLang() === 'fr'
        ? "Désolé, une erreur s'est produite. Réessaie."
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

    const lang = getLang();
    const journey = Memory ? Memory.getJourney() : null;
    const isReturning = Memory ? Memory.isReturningUser() : false;

    // Continue based on stage
    if (session.stage === STAGES.free_chat) {
      enableInput();
      setTimeout(async () => {
        if (hasShownWelcomeMessage) return;
        // Use personalized welcome for returning users - always end with a question
        const welcomeMsg = isReturning
          ? buildReturningUserWelcome()
          : (lang === 'fr'
              ? "Content de te revoir ! Alors, qu'est-ce qui t'amène aujourd'hui ? Une question, une curiosité ?"
              : "Good to see you again! So, what brings you here today? A question, something you're curious about?");

        await addMessage(welcomeMsg, 'bot', 500);
        hasShownWelcomeMessage = true;

        // Show personalized recommendation if onboarding completed
        if (journey?.onboardingCompleted) {
          setTimeout(() => {
            const recommendation = createPersonalizedRecommendation();
            addElement(recommendation);

            setTimeout(() => {
              const navCards = createNavCards();
              addElement(navCards);
            }, 400);
          }, 600);
        } else {
          const navCards = createNavCards();
          addElement(navCards);
        }
      }, 300);
    } else if (session.stage === STAGES.profile_reveal) {
      // Show profile and transition to free chat
      handleProfileReveal();
    } else {
      // Onboarding active - show welcome back and enable input
      enableInput();
      setTimeout(async () => {
        if (hasShownWelcomeMessage) return;
        const memoryProfile = Memory ? Memory.getProfile() : null;
        const confidence = journey?.onboardingCompleted
          ? (memoryProfile?.riskConfidence || 0)
          : 0;

        if (confidence > 0 && isReturning) {
          // Returning user with some profile data - be proactive
          const timeCategory = getTimeAwayCategory();
          let welcomeBase = t(CONTENT.returning_user[timeCategory] || CONTENT.returning_user.short);

          await addMessage(
            `${welcomeBase}\n\n${lang === 'fr'
              ? `On avait bien avancé sur ton profil (${confidence}% de confiance). Tu veux qu'on continue à creuser ensemble ?`
              : `We made good progress on your profile (${confidence}% confidence). Want to keep digging together?`}`,
            'bot', 500
          );
        } else if (confidence > 0) {
          // Has some profile data - be proactive
          await addMessage(
            lang === 'fr'
              ? `Content de te revoir ! On avait commencé à cerner ton profil (${confidence}% de confiance). Dis-moi, tu as eu de nouvelles réflexions depuis ?`
              : `Good to see you again! We started figuring out your profile (${confidence}% confidence). Tell me, have you had any new thoughts since then?`,
            'bot', 500
          );
        } else {
          // Fresh onboarding - be proactive and invite engagement
          await addMessage(
            lang === 'fr'
              ? "Content de te revoir ! Alors, tu as eu le temps de réfléchir depuis la dernière fois ? Qu'est-ce qui te trotte dans la tête côté investissement ?"
              : "Good to see you again! So, have you had time to think since last time? What's been on your mind when it comes to investing?",
            'bot', 500
          );
        }
        hasShownWelcomeMessage = true;
      }, 300);
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
        // Auto-submit voice input (works in both onboarding and free chat modes)
        handleUserInput(transcript);
        inputField.value = '';
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
          ? "La reconnaissance vocale n'est pas supportée par ton navigateur."
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
   * Enable text/voice input with context-aware placeholder
   */
  function enableInput() {
    if (inputField) {
      inputField.disabled = false;
      // Context-aware placeholder: different during onboarding vs free chat
      const isOnboarding = session.stage !== STAGES.free_chat;
      if (isOnboarding) {
        inputField.placeholder = getLang() === 'fr'
          ? 'Pose une question ou utilise les boutons...'
          : 'Ask a question or use the buttons...';
      } else {
        inputField.placeholder = getLang() === 'fr'
          ? 'Tape ici ou utilise le micro...'
          : 'Type anything or use voice...';
      }
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
   * Handle language change - update UI elements
   */
  function handleLanguageChange() {
    const lang = getLang();
    console.log('[PlaygroundChat] Language changed to:', lang);

    // Update input placeholder
    if (inputField) {
      const isOnboarding = session && session.stage !== STAGES.free_chat;
      if (isOnboarding) {
        inputField.placeholder = lang === 'fr'
          ? 'Pose une question ou utilise les boutons...'
          : 'Ask a question or use the buttons...';
      } else {
        inputField.placeholder = lang === 'fr'
          ? 'Tape ici ou utilise le micro...'
          : 'Type anything or use voice...';
      }
    }

    // Update voice recognition language
    if (recognition) {
      recognition.lang = lang === 'fr' ? 'fr-FR' : 'en-US';
    }

    // Update navigation cards if they exist
    const navCards = messagesContainer?.querySelector('.playground-nav-cards');
    if (navCards) {
      const newNavCards = createNavCards();
      navCards.replaceWith(newNavCards);
    }

    // Update option buttons if they exist
    const optionsContainer = messagesContainer?.querySelector('.playground-options');
    if (optionsContainer) {
      const buttons = optionsContainer.querySelectorAll('.playground-option');
      buttons.forEach(btn => {
        // We can't easily update these without knowing the original data
        // But at least new options will be in the correct language
      });
    }

    // Update profile card if it exists
    const profileCard = messagesContainer?.querySelector('.playground-profile-card');
    if (profileCard) {
      const profileLevel = getProfileLevel();
      const newProfileCard = createProfileCard(profileLevel);
      profileCard.replaceWith(newProfileCard);
    }

    // Sync language with Memory
    syncLanguageWithMemory();
  }

  /**
   * Start conversational onboarding - first message from LLM
   */
  async function startConversationalOnboarding() {
    const lang = getLang();

    // Send initial context to LLM to get a personalized greeting
    // The message should make the assistant proactive and invite user engagement
    const initMessage = lang === 'fr'
      ? '[SYSTEM: L\'utilisateur vient d\'arriver sur le Playground. Accueille-le chaleureusement comme un ami curieux (utilise "tu"). Pose une question engageante et personnelle pour démarrer la conversation - quelque chose qui l\'invite vraiment à partager son expérience ou ses pensées. Finis ABSOLUMENT par une question ouverte qui donne envie de répondre. Exemple de fin : "Et toi, qu\'est-ce qui t\'amène à t\'intéresser à l\'investissement ?" ou "Tu as déjà mis de l\'argent de côté quelque part ?"]'
      : '[SYSTEM: The user just arrived at the Playground. Welcome them warmly like a curious friend. Ask an engaging, personal question to start the conversation - something that genuinely invites them to share their experience or thoughts. You MUST end with an open question that makes them want to respond. Example endings: "What got you interested in investing?" or "Have you ever put money aside somewhere?"]';

    // Show typing indicator
    const typing = showTyping();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: initMessage,
          language: lang,
          pageContext: 'playground',
          history: [],
          contextMetadata: {
            isOnboarding: true,
            onboardingStage: 'conversational',
            profile: { riskScore: 50, riskConfidence: 0, traits: [] },
            isFirstMessage: true
          }
        })
      });

      typing.remove();

      const bubble = createMessageBubble('', 'bot');
      const contentEl = bubble.querySelector('.message-content');
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
              const tempClean = fullResponse.replace(/<!--\s*PROFILE_UPDATE[\s\S]*?-->/g, '');
              contentEl.innerHTML = formatMessage(tempClean);
              scrollToBottom();
            }
          } catch (e) {}
        }
      }

      // Parse any profile update
      const { cleanResponse, profileUpdate } = parseProfileUpdate(fullResponse);
      contentEl.innerHTML = formatMessage(cleanResponse);

      if (profileUpdate) {
        applyProfileUpdate(profileUpdate);
      }

      if (cleanResponse) {
        session.conversation.push({ role: 'assistant', content: cleanResponse });
        saveSession();
      }

    } catch (error) {
      typing.remove();
      // Fallback to static greeting - make it proactive and engaging
      const fallbackMsg = lang === 'fr'
        ? "Salut ! Super content de te voir ici. Je suis curieux de te connaître un peu mieux. Dis-moi, c'est quoi ton histoire avec l'argent ? Tu as déjà essayé d'investir ou c'est tout nouveau pour toi ?"
        : "Hey there! Really excited to meet you. I'm curious to get to know you a bit better. So tell me, what's your story with money? Have you tried investing before, or is this all new to you?";
      await addMessage(fallbackMsg, 'bot', 500);
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

    // Initialize BubbleAgentMemory
    initMemory();

    // Initialize voice recognition if supported
    initVoiceRecognition();

    // Setup mic button
    if (micButton) {
      micButton.addEventListener('click', (e) => {
        e.preventDefault();
        toggleVoiceRecording();
      });
    }

    // Setup form submission
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

    // Listen for language changes
    document.addEventListener('languageChanged', handleLanguageChange);
    window.addEventListener('languageChange', handleLanguageChange);

    // Load session
    const hasSession = loadSession();

    // If onboarding not complete, reset session to onboarding_active and clear history
    if (!isOnboardingComplete()) {
      session.stage = STAGES.onboarding_active;
      session.conversation = [];
      saveSession();
      messagesContainer.innerHTML = '';
      hasShownWelcomeMessage = false;
      if (Memory && typeof Memory.reset === 'function') {
        Memory.reset();
        console.log('[PlaygroundChat] Reset BubbleAgentMemory for fresh onboarding');
      }
    }

    // Check for interrupted onboarding transition
    const transitionPending = localStorage.getItem(ONBOARDING_TRANSITION_KEY);
    if (transitionPending === 'true') {
      console.log('[PlaygroundChat] Detected interrupted onboarding transition - resuming profile reveal');
      // The transition was interrupted, resume the profile reveal
      // First replay any conversation history, then trigger the reveal
      if (hasSession && session.conversation.length > 0) {
        const recent = session.conversation.slice(-6);
        recent.forEach(msg => {
          const bubble = createMessageBubble(msg.content, msg.role === 'assistant' ? 'bot' : 'user');
          bubble.style.animation = 'none';
          messagesContainer.appendChild(bubble);
        });
        scrollToBottom();
      }
      enableInput();
      // Resume the profile reveal after a brief delay
      setTimeout(() => {
        handleProfileReveal();
      }, 500);
      return;
    }

    // Enable input from the start
    enableInput();

    if (hasSession && session.conversation.length > 0) {
      resumeSession();
    } else {
      // Start fresh conversational onboarding
      startConversationalOnboarding();
    }
  }

  /**
   * Submit user message from input field
   */
  function submitUserMessage() {
    if (!inputField) return;
    const text = inputField.value.trim();
    if (text) {
      // Remove all suggestion buttons when user sends a typed message
      removeAllSuggestionButtons();
      handleUserInput(text);
      inputField.value = '';
    }
  }

  /**
   * Handle user input - all input goes to LLM for conversational flow
   */
  function handleUserInput(text) {
    if (!text.trim()) return;
    sendToLLM(text);
  }

  /**
   * Reset session - clears both session and memory
   */
  function reset() {
    if (abortController) abortController.abort();
    if (recognition && isRecording) {
      recognition.stop();
    }
    sessionStorage.removeItem(SESSION_KEY);
    if (messagesContainer) messagesContainer.innerHTML = '';

    // Reset memory but preserve GDPR compliance
    if (Memory) {
      Memory.reset();
    }

    loadSession();
    enableInput();
    startConversationalOnboarding();
  }

  return {
    init,
    reset,
    enableInput,
    disableInput,
    getSession: () => session ? { ...session } : null,
    getProfile: () => Memory ? Memory.getProfile() : null,
    getProfileLevel,
    isOnboardingComplete
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PlaygroundFullscreenChat;
}
