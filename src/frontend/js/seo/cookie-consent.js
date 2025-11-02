/**
 * Cookie Consent with Tarteaucitron.js
 * CNIL/RGPD compliant cookie consent banner
 *
 * Documentation: https://opt-out.ferank.eu/en/
 */

var documentLanguage = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
var isFrenchLocale = documentLanguage.indexOf('fr') === 0;
var privacyPath = isFrenchLocale ? '/privacy' : '/en/privacy';

var cookieLangOverrides = {
  en: {
    alertBig: "Choose the cookies you allow",
    alertBigPrivacy: "Bubble keeps only essential cookies right now: chat session safety and language preference. No analytics or ads.",
    alertSmall: "Cookie settings",
    personalize: "Review choices",
    acceptAll: "Allow all cookies",
    denyAll: "Keep essential only",
    close: "Close",
    noServices: "We only use essential cookies right now (chat session safety and language preference). You can reopen this panel any time via the \"Cookies\" badge.",
    icon: "Cookies",
    mandatoryTitle: "Essential cookies",
    mandatoryText: "These cookies keep the chat safe and remember your language. They are always on because the product will not work without them."
  },
  fr: {
    alertBig: "Choisissez les cookies autorises",
    alertBigPrivacy: "Bubble conserve uniquement des cookies essentiels : securite du chat et preference de langue. Aucun suivi analytique ou publicitaire.",
    alertSmall: "Parametres cookies",
    personalize: "Revoir mes choix",
    acceptAll: "Autoriser tous les cookies",
    denyAll: "Conserver l'essentiel",
    close: "Fermer",
    noServices: "Nous utilisons uniquement des cookies essentiels : securite du chat et preference de langue. Vous pouvez rouvrir ce panneau a tout moment via le badge \"Cookies\".",
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
  "showIcon": true,

  // Icon position
  "iconPosition": "BottomLeft",

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

// Note: Google Analytics 4 setup is optional for €0 budget
// Uncomment below if you decide to add GA4 later
/*
tarteaucitron.user.gtagUa = 'G-XXXXXXXXXX'; // Replace with your GA4 ID
tarteaucitron.user.gtagMore = function () {
  // Custom GA4 configuration
};
(tarteaucitron.job = tarteaucitron.job || []).push('gtag');
*/
