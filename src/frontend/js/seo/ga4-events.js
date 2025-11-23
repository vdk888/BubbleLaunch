/**
 * Google Analytics 4 Event Tracking
 *
 * Tracks key user interactions and conversions:
 * - CTA clicks (waitlist, demo, contact)
 * - Form submissions
 * - Portfolio simulator interactions
 * - Page views with custom parameters
 */

// Initialize dataLayer if not already present
window.dataLayer = window.dataLayer || [];

/**
 * Track CTA (Call-to-Action) clicks
 * @param {string} ctaName - Name of the CTA (e.g., 'waitlist_signup', 'demo_request')
 * @param {string} ctaLocation - Where the CTA is located (e.g., 'homepage', 'professionals_page')
 */
function trackCtaClick(ctaName, ctaLocation) {
  gtag('event', 'cta_click', {
    'cta_name': ctaName,
    'cta_location': ctaLocation,
    'timestamp': new Date().toISOString()
  });
  console.log(`[GA4] CTA Click: ${ctaName} from ${ctaLocation}`);
}

/**
 * Track form submissions
 * @param {string} formName - Name of the form (e.g., 'contact_form', 'waitlist_form')
 * @param {string} formLocation - Page/section where form appears
 * @param {object} formData - Optional: additional form metadata
 */
function trackFormSubmission(formName, formLocation, formData = {}) {
  gtag('event', 'form_submit', {
    'form_name': formName,
    'form_location': formLocation,
    'timestamp': new Date().toISOString(),
    ...formData
  });
  console.log(`[GA4] Form Submit: ${formName} from ${formLocation}`);
}

/**
 * Track portfolio simulator interactions
 * @param {string} interactionType - Type of interaction (e.g., 'strategy_selection', 'export')
 * @param {object} interactionData - Details about the interaction
 */
function trackSimulatorInteraction(interactionType, interactionData = {}) {
  gtag('event', 'simulator_interaction', {
    'interaction_type': interactionType,
    'timestamp': new Date().toISOString(),
    ...interactionData
  });
  console.log(`[GA4] Simulator Interaction: ${interactionType}`, interactionData);
}

/**
 * Track blog post views with custom parameters
 * @param {string} postTitle - Title of the blog post
 * @param {string} postSlug - URL slug of the post
 * @param {string} postLanguage - Language code (e.g., 'fr', 'en')
 * @param {string} postCategory - Blog post category/topic
 */
function trackBlogPostView(postTitle, postSlug, postLanguage = 'fr', postCategory = 'general') {
  gtag('event', 'page_view', {
    'page_title': postTitle,
    'page_category': 'blog',
    'page_language': postLanguage,
    'post_slug': postSlug,
    'post_category': postCategory,
    'timestamp': new Date().toISOString()
  });
  console.log(`[GA4] Blog Post View: ${postTitle} (${postLanguage})`);
}

/**
 * Track pricing page visits
 * @param {string} language - Language code (e.g., 'fr', 'en')
 */
function trackPricingPageView(language = 'fr') {
  gtag('event', 'pricing_page_view', {
    'language': language,
    'referrer': document.referrer,
    'timestamp': new Date().toISOString()
  });
  console.log(`[GA4] Pricing Page View (${language})`);
}

/**
 * Track portfolio simulator strategy selection
 * @param {string} strategy - Strategy name (e.g., 'equal_weight', 'risk_parity', 'custom')
 * @param {string} timePeriod - Time period selected (e.g., '1y', '5y', '20y')
 * @param {number} leverage - Leverage multiplier (1 or 2)
 */
function trackStrategySelection(strategy, timePeriod = '20y', leverage = 1) {
  trackSimulatorInteraction('strategy_selection', {
    'strategy': strategy,
    'time_period': timePeriod,
    'leverage': leverage
  });
}

/**
 * Track portfolio export action
 * @param {string} format - Export format (e.g., 'csv', 'png')
 * @param {string} strategy - Strategy exported
 */
function trackSimulatorExport(format, strategy = 'unknown') {
  trackSimulatorInteraction('export', {
    'export_format': format,
    'strategy': strategy
  });
}

/**
 * Track chatbot interaction
 * @param {string} action - Action type (e.g., 'message_sent', 'question_asked')
 * @param {string} page - Page where chatbot was used
 */
function trackChatbotInteraction(action, page = 'unknown') {
  gtag('event', 'chatbot_interaction', {
    'action': action,
    'page': page,
    'timestamp': new Date().toISOString()
  });
  console.log(`[GA4] Chatbot Interaction: ${action} on ${page}`);
}

/**
 * Track scroll depth
 * @param {number} scrollPercent - Percentage of page scrolled (0-100)
 */
function trackScrollDepth(scrollPercent) {
  if (scrollPercent > 0 && scrollPercent % 25 === 0) {
    gtag('event', 'scroll_depth', {
      'scroll_percent': scrollPercent,
      'page_title': document.title,
      'timestamp': new Date().toISOString()
    });
    console.log(`[GA4] Scroll Depth: ${scrollPercent}%`);
  }
}

/**
 * Automatically track all CTA buttons on the page
 * Looks for buttons with data-ga4-cta attribute
 * Usage: <button data-ga4-cta="waitlist_signup" data-ga4-location="homepage">Click me</button>
 */
function initializeAutoTracking() {
  // Track CTA button clicks
  document.querySelectorAll('[data-ga4-cta]').forEach(button => {
    button.addEventListener('click', function() {
      const ctaName = this.getAttribute('data-ga4-cta');
      const ctaLocation = this.getAttribute('data-ga4-location') || 'unknown';
      trackCtaClick(ctaName, ctaLocation);
    });
  });

  // Track form submissions
  document.querySelectorAll('[data-ga4-form]').forEach(form => {
    form.addEventListener('submit', function(e) {
      const formName = this.getAttribute('data-ga4-form');
      const formLocation = this.getAttribute('data-ga4-location') || 'unknown';
      trackFormSubmission(formName, formLocation);
    });
  });

  // Track scroll depth
  let lastScrollPercent = 0;
  window.addEventListener('scroll', function() {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = window.scrollY / scrollHeight;
    const scrollPercent = Math.round(scrolled * 100);

    if (scrollPercent > lastScrollPercent) {
      trackScrollDepth(scrollPercent);
      lastScrollPercent = scrollPercent;
    }
  });

  console.log('[GA4] Auto-tracking initialized');
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAutoTracking);
} else {
  initializeAutoTracking();
}

// Export functions for use in other scripts
window.GA4Events = {
  trackCtaClick,
  trackFormSubmission,
  trackSimulatorInteraction,
  trackBlogPostView,
  trackPricingPageView,
  trackStrategySelection,
  trackSimulatorExport,
  trackChatbotInteraction,
  trackScrollDepth
};
