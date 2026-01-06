/**
 * Bubble Playground - Chatbot-First Experience
 * Personality assessment through scenario-based conversations
 */

const PlaygroundChat = (function() {
  'use strict';

  // Session state
  const SESSION_KEY = 'bubblePlaygroundSession';
  let session = null;
  let chatContainer = null;
  let inputField = null;
  let currentStage = 'welcome';
  let typingTimeout = null;

  // Profile levels: 0% to 100% stocks (11 profiles)
  const PROFILES = {
    0: { name: { fr: 'Ultra-Prudent', en: 'Ultra-Conservative' }, stocks: 0, bonds: 100 },
    10: { name: { fr: 'Très Prudent', en: 'Very Conservative' }, stocks: 10, bonds: 90 },
    20: { name: { fr: 'Prudent', en: 'Conservative' }, stocks: 20, bonds: 80 },
    30: { name: { fr: 'Modérément Prudent', en: 'Moderately Conservative' }, stocks: 30, bonds: 70 },
    40: { name: { fr: 'Équilibré-Prudent', en: 'Balanced-Conservative' }, stocks: 40, bonds: 60 },
    50: { name: { fr: 'Équilibré', en: 'Balanced' }, stocks: 50, bonds: 50 },
    60: { name: { fr: 'Équilibré-Dynamique', en: 'Balanced-Growth' }, stocks: 60, bonds: 40 },
    70: { name: { fr: 'Dynamique', en: 'Growth' }, stocks: 70, bonds: 30 },
    80: { name: { fr: 'Très Dynamique', en: 'Aggressive Growth' }, stocks: 80, bonds: 20 },
    90: { name: { fr: 'Offensif', en: 'Aggressive' }, stocks: 90, bonds: 10 },
    100: { name: { fr: 'Ultra-Offensif', en: 'Ultra-Aggressive' }, stocks: 100, bonds: 0 }
  };

  // Conversation stages
  const STAGES = {
    welcome: 'welcome',
    scenario_intro: 'scenario_intro',
    scenario_crisis: 'scenario_crisis',
    scenario_boom: 'scenario_boom',
    scenario_time: 'scenario_time',
    profile_reveal: 'profile_reveal',
    explore_options: 'explore_options',
    education_check: 'education_check'
  };

  // Scenario questions with response tracking
  const SCENARIOS = {
    crisis: {
      question: {
        fr: "Imagine : tu as investi 50 000€. Une crise éclate, le marché chute de 30% en quelques semaines. Ton portefeuille affiche -15 000€.\n\nQue ressens-tu ?",
        en: "Imagine: you've invested €50,000. A crisis hits, the market drops 30% in a few weeks. Your portfolio shows -€15,000.\n\nHow do you feel?"
      },
      options: [
        {
          id: 'panic',
          text: { fr: "😰 Panique — Je vendrais tout", en: "😰 Panic — I'd sell everything" },
          score: -30
        },
        {
          id: 'worried',
          text: { fr: "😟 Inquiet — Ça me stresse vraiment", en: "😟 Worried — This really stresses me" },
          score: -15
        },
        {
          id: 'uncomfortable',
          text: { fr: "😐 Inconfortable — Mais je tiendrais", en: "😐 Uncomfortable — But I'd hold" },
          score: 0
        },
        {
          id: 'calm',
          text: { fr: "🙂 Calme — C'est normal sur le long terme", en: "🙂 Calm — It's normal in the long run" },
          score: 15
        },
        {
          id: 'opportunity',
          text: { fr: "🤑 Opportunité — J'en rajouterais !", en: "🤑 Opportunity — I'd add more!" },
          score: 30
        }
      ]
    },
    boom: {
      question: {
        fr: "Autre scénario : après 3 ans, le marché a grimpé de 50%. Tes amis avec 100% actions ont gagné 25 000€. Toi avec 50/50, tu as gagné 12 500€.\n\nComment tu vis ça ?",
        en: "Another scenario: after 3 years, the market is up 50%. Friends with 100% stocks made €25,000. You with 50/50 made €12,500.\n\nHow do you feel?"
      },
      options: [
        {
          id: 'regret',
          text: { fr: "😤 Frustré — J'aurais dû prendre plus de risque", en: "😤 Frustrated — I should've taken more risk" },
          score: 20
        },
        {
          id: 'fomo',
          text: { fr: "🤔 Un peu jaloux mais bon...", en: "🤔 A bit jealous but okay..." },
          score: 10
        },
        {
          id: 'content',
          text: { fr: "😊 Content — 12 500€ c'est déjà super", en: "😊 Content — €12,500 is already great" },
          score: 0
        },
        {
          id: 'relieved',
          text: { fr: "😌 Soulagé — J'ai pas pris de risque inutile", en: "😌 Relieved — I didn't take unnecessary risk" },
          score: -10
        }
      ]
    },
    time: {
      question: {
        fr: "Dernière question : dans combien de temps pourrais-tu avoir besoin de cet argent ?",
        en: "Final question: when might you need this money?"
      },
      options: [
        {
          id: 'short',
          text: { fr: "🗓️ Moins de 3 ans", en: "🗓️ Less than 3 years" },
          score: -20
        },
        {
          id: 'medium',
          text: { fr: "📅 3 à 5 ans", en: "📅 3 to 5 years" },
          score: -5
        },
        {
          id: 'long',
          text: { fr: "🗓️ 5 à 10 ans", en: "🗓️ 5 to 10 years" },
          score: 10
        },
        {
          id: 'verylong',
          text: { fr: "🎯 Plus de 10 ans (retraite)", en: "🎯 10+ years (retirement)" },
          score: 20
        }
      ]
    }
  };

  // Content for different conversation flows
  const MESSAGES = {
    welcome: {
      fr: [
        "👋 Bienvenue dans le Bubble Playground !",
        "Je suis là pour t'aider à découvrir ton profil d'investisseur.",
        "Pas de maths, pas de jargon. Juste quelques questions simples pour comprendre ta relation au risque."
      ],
      en: [
        "👋 Welcome to the Bubble Playground!",
        "I'm here to help you discover your investor profile.",
        "No math, no jargon. Just a few simple questions to understand your relationship with risk."
      ]
    },
    scenario_intro: {
      fr: "On va te présenter des scénarios réels. Imagine-toi vraiment dedans. Il n'y a pas de bonne ou mauvaise réponse — seulement ce qui te correspond.",
      en: "I'll show you real scenarios. Really imagine yourself in them. There's no right or wrong answer — only what fits you."
    },
    profile_reveal_intro: {
      fr: "Merci pour tes réponses ! Voici ce que je comprends de toi :",
      en: "Thanks for your answers! Here's what I understand about you:"
    },
    explore_prompt: {
      fr: "Maintenant, tu peux :",
      en: "Now you can:"
    },
    education_needed: {
      fr: "💡 Si tu veux d'abord comprendre les bases (actions, obligations, ETF), je peux t'expliquer ou te montrer des ressources.",
      en: "💡 If you want to understand the basics first (stocks, bonds, ETFs), I can explain or show you resources."
    }
  };

  // Interactive cards for navigation
  const NAVIGATION_CARDS = {
    arena: {
      icon: '👁️',
      title: { fr: "Voir l'Arena", en: "Watch the Arena" },
      description: { fr: "Observe 4 bots IA trader en temps réel", en: "Watch 4 AI bots trade in real-time" },
      url: { fr: '/investors/education/arena', en: '/en/investors/education/arena' }
    },
    simulator: {
      icon: '🛠️',
      title: { fr: "Créer ma Stratégie", en: "Build My Strategy" },
      description: { fr: "Construis et teste ton allocation", en: "Build and test your allocation" },
      url: { fr: '/investors/education/simulator', en: '/en/investors/education/simulator' }
    },
    waitlist: {
      icon: '🚀',
      title: { fr: "Rejoindre Bubble", en: "Join Bubble" },
      description: { fr: "Accès anticipé à la plateforme", en: "Early access to the platform" },
      url: { fr: '/investors#investor-waitlist', en: '/en/investors#investor-waitlist' }
    },
    videos: {
      icon: '🎬',
      title: { fr: "Vidéos Éducatives", en: "Educational Videos" },
      description: { fr: "Approfondis tes connaissances", en: "Deepen your knowledge" },
      action: 'scrollToVideos'
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
  function t(textObj) {
    if (typeof textObj === 'string') return textObj;
    const lang = getLang();
    return textObj[lang] || textObj.fr || textObj.en || '';
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
      conversationHistory: []
    };
    saveSession();
    return false;
  }

  /**
   * Save session to storage
   */
  function saveSession() {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  /**
   * Calculate profile from scores
   */
  function calculateProfile() {
    if (session.scores.length === 0) return 50; // Default balanced

    const totalScore = session.scores.reduce((a, b) => a + b, 0);
    // Map score range (-70 to +70) to profile (0 to 100)
    const normalizedScore = Math.max(-70, Math.min(70, totalScore));
    const profile = Math.round((normalizedScore + 70) / 140 * 100 / 10) * 10;
    return Math.max(0, Math.min(100, profile));
  }

  /**
   * Create message bubble HTML
   */
  function createMessageBubble(content, type = 'bot', animate = true) {
    const bubble = document.createElement('div');
    bubble.className = `playground-message ${type}${animate ? ' animate' : ''}`;

    if (type === 'bot') {
      bubble.innerHTML = `
        <div class="message-avatar">
          <svg width="24" height="24" viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="41" r="22" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-dasharray="120 24" stroke-dashoffset="8"/>
            <circle cx="54" cy="22" r="5" fill="currentColor"/>
          </svg>
        </div>
        <div class="message-content">${content}</div>
      `;
    } else {
      bubble.innerHTML = `<div class="message-content">${content}</div>`;
    }

    return bubble;
  }

  /**
   * Create option buttons
   */
  function createOptionButtons(options, onSelect) {
    const container = document.createElement('div');
    container.className = 'playground-options';

    options.forEach((option, index) => {
      const btn = document.createElement('button');
      btn.className = 'playground-option';
      btn.innerHTML = t(option.text);
      btn.style.animationDelay = `${index * 0.1}s`;
      btn.addEventListener('click', () => onSelect(option));
      container.appendChild(btn);
    });

    return container;
  }

  /**
   * Create navigation cards
   */
  function createNavigationCards(cards) {
    const container = document.createElement('div');
    container.className = 'playground-nav-cards';

    cards.forEach(cardKey => {
      const card = NAVIGATION_CARDS[cardKey];
      if (!card) return;

      const el = document.createElement('a');
      el.className = 'playground-nav-card';

      if (card.action === 'scrollToVideos') {
        el.href = '#educationVideos';
        el.addEventListener('click', (e) => {
          e.preventDefault();
          document.getElementById('educationVideos')?.scrollIntoView({ behavior: 'smooth' });
        });
      } else {
        el.href = t(card.url);
      }

      el.innerHTML = `
        <span class="nav-card-icon">${card.icon}</span>
        <div class="nav-card-content">
          <span class="nav-card-title">${t(card.title)}</span>
          <span class="nav-card-description">${t(card.description)}</span>
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
   * Create profile display
   */
  function createProfileDisplay(profileLevel) {
    const profile = PROFILES[profileLevel];
    const lang = getLang();

    const container = document.createElement('div');
    container.className = 'playground-profile-card';

    container.innerHTML = `
      <div class="profile-header">
        <div class="profile-badge">${t(profile.name)}</div>
        <div class="profile-allocation">
          <span class="allocation-item stocks">${profile.stocks}% ${lang === 'fr' ? 'Actions' : 'Stocks'}</span>
          <span class="allocation-item bonds">${profile.bonds}% ${lang === 'fr' ? 'Obligations/Fonds Euros' : 'Bonds/Euro Funds'}</span>
        </div>
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
      <p class="profile-note">
        ${lang === 'fr'
          ? "Ce profil reflète ta tolérance au risque d'après tes réponses. Ce n'est pas un conseil d'investissement."
          : "This profile reflects your risk tolerance based on your answers. This is not investment advice."
        }
      </p>
    `;

    return container;
  }

  /**
   * Show typing indicator
   */
  function showTyping() {
    const typing = document.createElement('div');
    typing.className = 'playground-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    chatContainer.appendChild(typing);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return typing;
  }

  /**
   * Add message with optional delay
   */
  async function addMessage(content, type = 'bot', delay = 0) {
    return new Promise(resolve => {
      if (delay > 0 && type === 'bot') {
        const typing = showTyping();
        typingTimeout = setTimeout(() => {
          typing.remove();
          const bubble = createMessageBubble(content, type);
          chatContainer.appendChild(bubble);
          chatContainer.scrollTop = chatContainer.scrollHeight;

          // Store in history
          session.conversationHistory.push({ content, type, timestamp: Date.now() });
          saveSession();

          resolve();
        }, delay);
      } else {
        const bubble = createMessageBubble(content, type, delay > 0);
        chatContainer.appendChild(bubble);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        session.conversationHistory.push({ content, type, timestamp: Date.now() });
        saveSession();

        resolve();
      }
    });
  }

  /**
   * Add element to chat (for options, cards, etc.)
   */
  function addElement(element) {
    chatContainer.appendChild(element);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  /**
   * Handle welcome stage
   */
  async function handleWelcome() {
    const messages = MESSAGES.welcome[getLang()] || MESSAGES.welcome.fr;

    for (let i = 0; i < messages.length; i++) {
      await addMessage(messages[i], 'bot', i === 0 ? 500 : 1000);
    }

    // Add start button
    setTimeout(() => {
      const startOptions = createOptionButtons([
        { id: 'start', text: { fr: "🎯 C'est parti !", en: "🎯 Let's go!" }, score: 0 },
        { id: 'learn', text: { fr: "📚 D'abord les bases", en: "📚 Basics first" }, score: 0 }
      ], (option) => {
        addMessage(t(option.text), 'user');
        if (option.id === 'start') {
          session.stage = STAGES.scenario_intro;
          saveSession();
          setTimeout(() => handleScenarioIntro(), 500);
        } else {
          session.stage = STAGES.education_check;
          saveSession();
          setTimeout(() => handleEducationCheck(), 500);
        }
      });
      addElement(startOptions);
    }, 1500);
  }

  /**
   * Handle scenario introduction
   */
  async function handleScenarioIntro() {
    await addMessage(t(MESSAGES.scenario_intro), 'bot', 800);

    setTimeout(() => {
      session.stage = STAGES.scenario_crisis;
      saveSession();
      handleScenarioCrisis();
    }, 1000);
  }

  /**
   * Handle crisis scenario
   */
  async function handleScenarioCrisis() {
    await addMessage(t(SCENARIOS.crisis.question), 'bot', 1000);

    setTimeout(() => {
      const options = createOptionButtons(SCENARIOS.crisis.options, (option) => {
        session.scores.push(option.score);
        session.answers.crisis = option.id;
        saveSession();

        addMessage(t(option.text), 'user');

        setTimeout(() => {
          session.stage = STAGES.scenario_boom;
          saveSession();
          handleScenarioBoom();
        }, 500);
      });
      addElement(options);
    }, 500);
  }

  /**
   * Handle boom scenario
   */
  async function handleScenarioBoom() {
    await addMessage(t(SCENARIOS.boom.question), 'bot', 1000);

    setTimeout(() => {
      const options = createOptionButtons(SCENARIOS.boom.options, (option) => {
        session.scores.push(option.score);
        session.answers.boom = option.id;
        saveSession();

        addMessage(t(option.text), 'user');

        setTimeout(() => {
          session.stage = STAGES.scenario_time;
          saveSession();
          handleScenarioTime();
        }, 500);
      });
      addElement(options);
    }, 500);
  }

  /**
   * Handle time horizon scenario
   */
  async function handleScenarioTime() {
    await addMessage(t(SCENARIOS.time.question), 'bot', 1000);

    setTimeout(() => {
      const options = createOptionButtons(SCENARIOS.time.options, (option) => {
        session.scores.push(option.score);
        session.answers.time = option.id;
        saveSession();

        addMessage(t(option.text), 'user');

        setTimeout(() => {
          session.stage = STAGES.profile_reveal;
          saveSession();
          handleProfileReveal();
        }, 500);
      });
      addElement(options);
    }, 500);
  }

  /**
   * Handle profile reveal
   */
  async function handleProfileReveal() {
    const profileLevel = calculateProfile();
    session.profile = profileLevel;
    saveSession();

    await addMessage(t(MESSAGES.profile_reveal_intro), 'bot', 800);

    setTimeout(() => {
      const profileCard = createProfileDisplay(profileLevel);
      addElement(profileCard);

      setTimeout(() => {
        session.stage = STAGES.explore_options;
        saveSession();
        handleExploreOptions();
      }, 1500);
    }, 500);
  }

  /**
   * Handle explore options
   */
  async function handleExploreOptions() {
    await addMessage(t(MESSAGES.explore_prompt), 'bot', 800);

    setTimeout(() => {
      // Show navigation cards based on profile
      let cards = ['arena', 'simulator'];
      if (session.profile >= 50) {
        cards = ['simulator', 'arena']; // More dynamic users → build first
      }
      cards.push('videos', 'waitlist');

      const navCards = createNavigationCards(cards);
      addElement(navCards);
    }, 500);
  }

  /**
   * Handle education check
   */
  async function handleEducationCheck() {
    await addMessage(t(MESSAGES.education_needed), 'bot', 800);

    setTimeout(() => {
      const navCards = createNavigationCards(['videos', 'arena', 'simulator']);
      addElement(navCards);

      // Also offer to continue with assessment
      setTimeout(async () => {
        await addMessage(
          getLang() === 'fr'
            ? "Quand tu te sens prêt, on peut continuer avec le profil !"
            : "When you feel ready, we can continue with the profile!",
          'bot',
          1000
        );

        const continueBtn = createOptionButtons([
          { id: 'continue', text: { fr: "✨ Continuons !", en: "✨ Let's continue!" }, score: 0 }
        ], () => {
          addMessage(getLang() === 'fr' ? "C'est parti !" : "Let's go!", 'user');
          session.stage = STAGES.scenario_intro;
          saveSession();
          setTimeout(() => handleScenarioIntro(), 500);
        });
        addElement(continueBtn);
      }, 500);
    }, 500);
  }

  /**
   * Handle user text input
   */
  function handleUserInput(text) {
    if (!text.trim()) return;

    addMessage(text, 'user');

    // Simple response handling - in production, this would connect to an AI backend
    const lang = getLang();
    const lowerText = text.toLowerCase();

    setTimeout(async () => {
      if (lowerText.includes('arena') || lowerText.includes('bot')) {
        await addMessage(
          lang === 'fr'
            ? "L'Arena te permet d'observer 4 bots IA avec des stratégies différentes !"
            : "The Arena lets you observe 4 AI bots with different strategies!",
          'bot',
          800
        );
        const cards = createNavigationCards(['arena']);
        addElement(cards);
      } else if (lowerText.includes('simulat') || lowerText.includes('strateg') || lowerText.includes('crée') || lowerText.includes('build')) {
        await addMessage(
          lang === 'fr'
            ? "Dans le Simulateur, tu peux construire et tester ta propre allocation !"
            : "In the Simulator, you can build and test your own allocation!",
          'bot',
          800
        );
        const cards = createNavigationCards(['simulator']);
        addElement(cards);
      } else if (lowerText.includes('waitlist') || lowerText.includes('join') || lowerText.includes('rejoindre')) {
        await addMessage(
          lang === 'fr'
            ? "Tu peux rejoindre la liste d'attente pour accéder à Bubble Portfolio !"
            : "You can join the waitlist for early access to Bubble Portfolio!",
          'bot',
          800
        );
        const cards = createNavigationCards(['waitlist']);
        addElement(cards);
      } else if (lowerText.includes('profil') || lowerText.includes('profile') || lowerText.includes('risque') || lowerText.includes('risk')) {
        if (session.profile !== null) {
          await addMessage(
            lang === 'fr'
              ? `D'après tes réponses, ton profil est ${PROFILES[session.profile].name.fr} (${session.profile}% actions).`
              : `Based on your answers, your profile is ${PROFILES[session.profile].name.en} (${session.profile}% stocks).`,
            'bot',
            800
          );
        } else {
          await addMessage(
            lang === 'fr'
              ? "Je peux t'aider à découvrir ton profil de risque !"
              : "I can help you discover your risk profile!",
            'bot',
            800
          );
          const btn = createOptionButtons([
            { id: 'start', text: { fr: "🎯 Découvrir mon profil", en: "🎯 Discover my profile" }, score: 0 }
          ], () => {
            session.stage = STAGES.scenario_intro;
            saveSession();
            handleScenarioIntro();
          });
          addElement(btn);
        }
      } else {
        await addMessage(
          lang === 'fr'
            ? "Je suis encore en apprentissage ! Tu peux explorer l'Arena, le Simulateur, ou me demander de découvrir ton profil."
            : "I'm still learning! You can explore the Arena, Simulator, or ask me to discover your profile.",
          'bot',
          800
        );
        const cards = createNavigationCards(['arena', 'simulator']);
        addElement(cards);
      }
    }, 300);
  }

  /**
   * Resume session from stored state
   */
  function resumeSession() {
    // Replay conversation history
    session.conversationHistory.forEach(msg => {
      const bubble = createMessageBubble(msg.content, msg.type, false);
      chatContainer.appendChild(bubble);
    });
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Continue from current stage
    switch (session.stage) {
      case STAGES.welcome:
        handleWelcome();
        break;
      case STAGES.scenario_intro:
        handleScenarioIntro();
        break;
      case STAGES.scenario_crisis:
        handleScenarioCrisis();
        break;
      case STAGES.scenario_boom:
        handleScenarioBoom();
        break;
      case STAGES.scenario_time:
        handleScenarioTime();
        break;
      case STAGES.profile_reveal:
        handleProfileReveal();
        break;
      case STAGES.explore_options:
        handleExploreOptions();
        break;
      case STAGES.education_check:
        handleEducationCheck();
        break;
    }
  }

  /**
   * Initialize the playground chatbot
   */
  function init(containerId, inputId) {
    chatContainer = document.getElementById(containerId);
    inputField = document.getElementById(inputId);

    if (!chatContainer) {
      console.error('Playground chat container not found:', containerId);
      return;
    }

    // Load or create session
    const hasExistingSession = loadSession();

    // Setup input handler
    if (inputField) {
      const form = inputField.closest('form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const text = inputField.value.trim();
          if (text) {
            handleUserInput(text);
            inputField.value = '';
          }
        });
      }

      inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const text = inputField.value.trim();
          if (text) {
            handleUserInput(text);
            inputField.value = '';
          }
        }
      });
    }

    // Start or resume conversation
    if (hasExistingSession && session.conversationHistory.length > 0) {
      resumeSession();
    } else {
      handleWelcome();
    }
  }

  /**
   * Reset session and start fresh
   */
  function reset() {
    sessionStorage.removeItem(SESSION_KEY);
    if (chatContainer) {
      chatContainer.innerHTML = '';
    }
    loadSession();
    handleWelcome();
  }

  /**
   * Get current session data
   */
  function getSession() {
    return { ...session };
  }

  /**
   * Get calculated profile
   */
  function getProfile() {
    return session?.profile ?? calculateProfile();
  }

  // Public API
  return {
    init,
    reset,
    getSession,
    getProfile,
    handleUserInput
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PlaygroundChat;
}
