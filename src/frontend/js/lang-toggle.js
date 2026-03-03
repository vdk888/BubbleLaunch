/**
 * Language Toggle - CSP-compliant language switching
 * Replaces inline onclick handlers with event listeners.
 * Buttons use data-href attributes to specify target URLs.
 * Blog post pages use dynamic slug extraction from the current URL.
 */
(function () {
  'use strict';

  document.querySelectorAll('.lang-switch button[data-href]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var href = btn.getAttribute('data-href');
      if (href) {
        window.location.href = href;
      }
    });
  });

  // Blog post pages: dynamically resolve slug-based language URLs
  document.querySelectorAll('.lang-switch button[data-lang-blog]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var prefix = btn.getAttribute('data-lang-blog');
      var pathParts = window.location.pathname.split('/');
      var currentSlug = pathParts[pathParts.length - 1];
      window.location.href = prefix + currentSlug;
    });
  });
})();
