/**
 * Cookie Consent with Tarteaucitron.js
 * CNIL/RGPD compliant cookie consent banner
 *
 * Google Analytics 4 Consent Mode Integration
 * Ensures GDPR compliance while enabling analytics
 *
 * Documentation: https://opt-out.ferank.eu/en/
 */

var documentLanguage = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
var isFrenchLocale = documentLanguage.indexOf('fr') === 0;
var privacyPath = isFrenchLocale ? '/privacy' : '/en/privacy';

var cookieLangOverrides = {
  en: {
    alertBig: "Choose the cookies you allow",
    alertBigPrivacy: "Bubble keeps essential cookies and optional analytics. Essential: chat safety, language preference. Optional: Google Analytics for performance tracking.",
    alertSmall: "Cookie settings",
    personalize: "Review choices",
    acceptAll: "Allow all cookies",
    denyAll: "Keep essential only",
    close: "Close",
    noServices: "We use essential cookies (chat safety, language) and optional analytics (Google Analytics). You can reopen this panel any time via the 'Cookies' badge.",
    icon: "Cookies",
    mandatoryTitle: "Essential cookies",
    mandatoryText: "These cookies keep the chat safe and remember your language. They are always on because the product will not work without them."
  },
  fr: {
    alertBig: "Choisissez les cookies autorises",
    alertBigPrivacy: "Bubble conserve les cookies essentiels et l'analytique optionnelle. Essentiels : securite du chat, preference de langue. Optionnel : Google Analytics pour le suivi des performances.",
    alertSmall: "Parametres cookies",
    personalize: "Revoir mes choix",
    acceptAll: "Autoriser tous les cookies",
    denyAll: "Conserver l'essentiel",
    close: "Fermer",
    noServices: "Nous utilisons les cookies essentiels (securite du chat, preference de langue) et l'analytique optionnelle (Google Analytics). Vous pouvez rouvrir ce panneau a tout moment via le badge 'Cookies'.",
    icon: "Cookies",
    mandatoryTitle: "Cookies essentiels",
    mandatoryText: "Ces cookies limitent le chat et gardent votre preference de langue. Ils sont toujours actifs car la plateforme ne fonctionne pas sans eux."
  }
};

function applyLanguageOverrides() {
  if (typeof tarteaucitron === 'undefined' || !tarteaucitron.lang) {
    return;
  }
  Object.keys(cookieLangOverrides).forEach(function (locale) {
    if (!tarteaucitron.lang[locale]) {
      return;
    }
    var overrides = cookieLangOverrides[locale];
    Object.keys(overrides).forEach(function (key) {
      tarteaucitron.lang[locale][key] = overrides[key];
    });
  });
}

function registerBubbleServices() {
  if (typeof tarteaucitron === 'undefined') {
    return;
  }

  tarteaucitron.services = tarteaucitron.services || {};

  var essentialServices = [
    {
      key: 'bubblechat',
      type: 'support',
      name: isFrenchLocale ? 'Limitation des conversations (chat)' : 'Chat session safety',
      cookies: ['connect.sid'],
      needConsent: false,
      fallbackContent: isFrenchLocale
        ? "Assure la limite de messages pour la securite du chat."
        : "Enforces the chat safety message cap."
    },
    {
      key: 'bubblelanguage',
      type: 'support',
      name: isFrenchLocale ? 'Preference de langue' : 'Language preference',
      cookies: ['bubble_locale'],
      needConsent: false,
      fallbackContent: isFrenchLocale
        ? "Se souvient de votre choix FR/EN pour afficher la bonne version."
        : "Remembers your FR/EN choice so we show the right version."
    }
  ];

  essentialServices.forEach(function (service) {
    if (!tarteaucitron.services[service.key]) {
      tarteaucitron.services[service.key] = {
        key: service.key,
        type: service.type,
        name: service.name,
        needConsent: service.needConsent,
        cookies: service.cookies,
        js: function () {},
        fallback: function () {
          return tarteaucitron.fallback([service.key], function (elem) {
            elem.innerHTML = service.fallbackContent;
            return elem;
          });
        }
      };
    }

    if (!tarteaucitron.job) {
      tarteaucitron.job = [];
    }
    if (tarteaucitron.job.indexOf(service.key) === -1) {
      tarteaucitron.job.push(service.key);
    }
  });

  // Register Google Analytics 4 as optional service
  tarteaucitron.services.ga4 = {
    key: 'ga4',
    type: 'analytics',
    name: isFrenchLocale ? 'Google Analytics 4' : 'Google Analytics 4',
    uri: 'https://policies.google.com/privacy',
    needConsent: true,
    cookies: ['_ga', '_gid', '_ga_T0MQEL0ZG0'],
    js: function() {
      // GA4 consent granted - enable analytics
      if (window.gtag) {
        gtag('consent', 'update', {
          'analytics_storage': 'granted',
          'ad_storage': 'denied'
        });
      }
      console.log('[GA4] Analytics consent granted - tracking enabled');
    },
    fallback: function() {
      // GA4 consent denied - disable analytics
      if (window.gtag) {
        gtag('consent', 'update', {
          'analytics_storage': 'denied',
          'ad_storage': 'denied'
        });
      }
      console.log('[GA4] Analytics consent denied - tracking disabled');
    }
  };

  // Add GA4 to the job queue
  if (!tarteaucitron.job) {
    tarteaucitron.job = [];
  }
  if (tarteaucitron.job.indexOf('ga4') === -1) {
    tarteaucitron.job.push('ga4');
  }
}

function bindEssentialOnlyHandlers() {
  if (typeof tarteaucitron === 'undefined') {
    return true;
  }
  if (Array.isArray(tarteaucitron.job) && tarteaucitron.job.length > 0) {
    return true;
  }

  var applyChoice = function (choice) {
    var cookieName = (tarteaucitron.parameters && tarteaucitron.parameters.cookieName) ? tarteaucitron.parameters.cookieName : 'tarteaucitron';
    var cookieValue = encodeURIComponent(choice);
    var cookieParts = [
      cookieName + '=' + cookieValue,
      'path=/',
      'samesite=lax',
      'max-age=' + 60 * 60 * 24 * 365
    ];
    if (location.protocol === 'https:') {
      cookieParts.push('secure');
    }
    document.cookie = cookieParts.join('; ');
    if (tarteaucitron.userInterface && typeof tarteaucitron.userInterface.respondAll === 'function') {
      var acceptAll = choice === 'all';
      tarteaucitron.userInterface.respondAll(acceptAll);
    }
    if (tarteaucitron.userInterface) {
      if (typeof tarteaucitron.userInterface.closePanel === 'function') {
        tarteaucitron.userInterface.closePanel();
      }
      if (typeof tarteaucitron.userInterface.closeAlert === 'function') {
        tarteaucitron.userInterface.closeAlert();
      }
    }
  };

  var bindButton = function (id, choice) {
    var element = document.getElementById(id);
    if (!element || element.dataset.essentialChoiceBound === 'true') {
      return;
    }
    element.dataset.essentialChoiceBound = 'true';
    element.addEventListener('click', function () {
      applyChoice(choice);
    });
  };

  bindButton('tarteaucitronAllAllowed', 'all');
  bindButton('tarteaucitronPersonalize2', 'all');
  bindButton('tarteaucitronAllDenied', 'essential');
  bindButton('tarteaucitronAllDenied2', 'essential');

  return document.getElementById('tarteaucitronAllAllowed') !== null;
}

function scheduleEssentialOnlyBindings() {
  if (typeof tarteaucitron === 'undefined') {
    return;
  }
  var attempt = 0;
  var maxAttempts = 20;
  var timer = setInterval(function () {
    attempt += 1;
    var done = bindEssentialOnlyHandlers();
    if (done || attempt >= maxAttempts) {
      clearInterval(timer);
    }
  }, 200);
}

if (typeof tarteaucitron !== 'undefined') {
  applyLanguageOverrides();
  registerBubbleServices();

  tarteaucitron.events = tarteaucitron.events || {};
  var previousLoadHandler = tarteaucitron.events.load;
  tarteaucitron.events.load = function () {
    if (typeof previousLoadHandler === 'function') {
      previousLoadHandler();
    }
    applyLanguageOverrides();
    registerBubbleServices();
    scheduleEssentialOnlyBindings();
  };
}

tarteaucitron.init({
  // Privacy policy URL
  "privacyUrl": privacyPath,

  // Hashtag for cookie preferences link
  "hashtag": "#cookies",

  // Cookie name
  "cookieName": "bubble_cookies",

  // Banner orientation (top, middle, bottom)
  "orientation": "bottom",

  // Group services by category
  "groupServices": true,

  // Show small alert when banner is hidden
  "showAlertSmall": false,

  // Show cookies list
  "cookieslist": false,

  // Close popup on click outside
  "closePopup": false,

  // Show tarteaucitron icon
  "showIcon": false,

  // Icon position
  "iconPosition": "TopRight",

  // Adblocker detection
  "adblocker": false,

  // Show "Deny All" button
  "DenyAllCta": true,

  // Show "Accept All" button
  "AcceptAllCta": true,

  // High privacy mode (cookies only after explicit consent)
  "highPrivacy": true,

  // Handle browser Do Not Track request
  "handleBrowserDNTRequest": false,

  // Remove Tarteaucitron credit link
  "removeCredit": false,

  // Show "More info" link
  "moreInfoLink": true,

  // Use external CSS
  "useExternalCss": false,

  // Readmore link
  "readmoreLink": privacyPath,

  // Mandatory cookies (always allowed, no consent needed)
  "mandatory": true
});

console.log('[GA4] Cookie consent initialized with Consent Mode support');
