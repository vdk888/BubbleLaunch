/**
 * Language Switcher
 * Handles language toggle between French and English
 * Supports proper URL-based language routing for bilingual pages
 */

(function() {
  'use strict';

  /**
   * Get the target URL for language switch based on current path
   * Maps FR paths to EN paths and vice versa
   */
  function getLanguageSwitchUrl(newLang) {
    const currentPath = window.location.pathname;

    if (newLang === 'en') {
      // Switching to English: add /en/ prefix if not already present
      if (currentPath.startsWith('/en/')) {
        return currentPath; // Already English
      }
      // Special case: root path
      if (currentPath === '/' || currentPath === '') {
        return '/en/';
      }
      return '/en' + currentPath;
    } else {
      // Switching to French: remove /en/ prefix
      if (currentPath.startsWith('/en/')) {
        const frPath = currentPath.replace(/^\/en/, '');
        return frPath || '/';
      }
      return currentPath; // Already French
    }
  }

  function initLanguageSwitcher() {
    const langToggle = document.getElementById('langToggle');
    if (!langToggle) return;

    langToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation(); // Prevent any other handlers from firing

      const currentLang = localStorage.getItem('bubbleLanguage') || 'fr';
      const newLang = currentLang === 'fr' ? 'en' : 'fr';

      localStorage.setItem('bubbleLanguage', newLang);

      // Clear playground session to avoid language mixing in conversation history
      sessionStorage.removeItem('bubblePlaygroundFullscreenSession');

      // Get the correct URL for the new language and redirect
      const targetUrl = getLanguageSwitchUrl(newLang);
      window.location.href = targetUrl;
    });

    // Set initial language display
    const currentLang = localStorage.getItem('bubbleLanguage') || 'fr';
    updateLanguageDisplay(currentLang);
  }

  function updateLanguageDisplay(lang) {
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
      // Find the .lang-current span inside the button, or update the button text directly
      const langCurrentSpan = langToggle.querySelector('.lang-current');
      if (langCurrentSpan) {
        langCurrentSpan.textContent = lang.toUpperCase();
      } else {
        langToggle.textContent = lang === 'fr' ? 'EN' : 'FR';
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguageSwitcher);
  } else {
    initLanguageSwitcher();
  }
})();
