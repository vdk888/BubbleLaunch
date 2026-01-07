/**
 * Language Switcher
 * Handles language toggle between French and English
 */

(function() {
  'use strict';

  function initLanguageSwitcher() {
    const langToggle = document.getElementById('langToggle');
    if (!langToggle) return;

    langToggle.addEventListener('click', function(e) {
      e.preventDefault();
      const currentLang = localStorage.getItem('bubbleLanguage') || 'fr';
      const newLang = currentLang === 'fr' ? 'en' : 'fr';

      localStorage.setItem('bubbleLanguage', newLang);

      // Update UI immediately
      updateLanguageDisplay(newLang);

      // Trigger page reload to apply language changes
      location.reload();
    });

    // Set initial language display
    const currentLang = localStorage.getItem('bubbleLanguage') || 'fr';
    updateLanguageDisplay(currentLang);
  }

  function updateLanguageDisplay(lang) {
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
      langToggle.textContent = lang === 'fr' ? 'EN' : 'FR';
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguageSwitcher);
  } else {
    initLanguageSwitcher();
  }
})();
