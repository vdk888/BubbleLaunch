/**
 * Cookie Consent with Tarteaucitron.js
 * CNIL/RGPD compliant cookie consent banner
 *
 * Documentation: https://opt-out.ferank.eu/en/
 */

tarteaucitron.init({
  // Privacy policy URL
  "privacyUrl": "/privacy",

  // Hashtag for cookie preferences link
  "hashtag": "#cookies",

  // Cookie name
  "cookieName": "bubble_cookies",

  // Banner orientation (top, middle, bottom)
  "orientation": "bottom",

  // Group services by category
  "groupServices": false,

  // Show small alert when banner is hidden
  "showAlertSmall": false,

  // Show cookies list
  "cookieslist": true,

  // Close popup on click outside
  "closePopup": false,

  // Show tarteaucitron icon
  "showIcon": true,

  // Icon position
  "iconPosition": "BottomRight",

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
  "readmoreLink": "/privacy",

  // Mandatory cookies (always allowed, no consent needed)
  "mandatory": false
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
