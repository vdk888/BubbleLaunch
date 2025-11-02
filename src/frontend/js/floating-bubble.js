document.addEventListener('DOMContentLoaded', () => {
  const floatingBubble = document.getElementById('floating-chat-bubble');

  if (!floatingBubble) return;

  // Check if we're on portfolio simulator or pricing page
  const isSimulatorPage = window.location.pathname.includes('portfolio-simulator');
  const isPricingPage = window.location.pathname.includes('pricing');

  // On simulator/pricing pages, show bubble immediately
  if (isSimulatorPage || isPricingPage) {
    console.log('Floating bubble: Showing immediately on simulator/pricing page');
    floatingBubble.classList.add('show');

    // Handle click to toggle mini-chat
    const bubbleInner = floatingBubble.querySelector('.floating-bubble-inner');
    if (bubbleInner) {
      bubbleInner.addEventListener('click', (e) => {
        e.stopPropagation();
        floatingBubble.classList.toggle('chat-open');

        if (floatingBubble.classList.contains('chat-open')) {
          setTimeout(() => {
            const input = floatingBubble.querySelector('.mini-chat-input');
            if (input) input.focus();
          }, 100);
        }
      });
    }
    return; // Exit early - no scroll behavior needed
  }

  // INDEX PAGE BEHAVIOR: Scroll-based bubble with chat section detection
  let sectionsToObserve = document.querySelectorAll('#manifesto, #vision, #approach');

  // If no sections found, try alternative sections
  let hasScrollBehavior = true;
  if (sectionsToObserve.length === 0) {
    sectionsToObserve = document.querySelectorAll('[data-section], .section');
    if (sectionsToObserve.length === 0) {
      // No sections found - show bubble immediately
      console.log('Floating bubble: No sections to observe, showing bubble immediately');
      floatingBubble.classList.add('show');
      hasScrollBehavior = false;
    }
  }

  // Track auto-hide timeout
  let autoHideTimeout = null;

  // Only set up IntersectionObserver if we have sections to observe
  if (hasScrollBehavior && sectionsToObserve.length > 0) {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.8 // Trigger when 80% of the section is visible
    };

    const bubbleObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Don't show if chat section is already visible (if it exists)
          const chatSection = document.querySelector('.chat-section');
          if (chatSection) {
            const chatRect = chatSection.getBoundingClientRect();
            if (chatRect.top < window.innerHeight && chatRect.bottom >= 0) {
              return;
            }
          }

          floatingBubble.classList.add('show');

          // Auto-hide after 8 seconds ONLY if chat is not open
          if (autoHideTimeout) clearTimeout(autoHideTimeout);
          autoHideTimeout = setTimeout(() => {
            // Only hide if chat is not open
            if (!floatingBubble.classList.contains('chat-open')) {
              floatingBubble.classList.remove('show');
            }
          }, 8000);
        }
      });
    }, observerOptions);

    sectionsToObserve.forEach(section => {
      bubbleObserver.observe(section);
    });
  }

  // Hide bubble if user scrolls back up (only if scroll behavior is enabled AND chat is not open)
  if (hasScrollBehavior) {
    let lastScrollY = window.scrollY;
    window.addEventListener('scroll', () => {
      if (window.scrollY < lastScrollY) {
        // Only hide if chat is not open
        if (!floatingBubble.classList.contains('chat-open')) {
          floatingBubble.classList.remove('show');
        }
      }
      lastScrollY = window.scrollY;
    }, { passive: true });
  }

  // Handle click on bubble - different behavior based on page type
  const bubbleInner = floatingBubble.querySelector('.floating-bubble-inner');
  if (bubbleInner) {
    bubbleInner.addEventListener('click', (e) => {
      e.stopPropagation();

      // Check if page has a dedicated chat section (index page)
      const chatSection = document.querySelector('.chat-section');

      if (chatSection) {
        // INDEX PAGE BEHAVIOR: Scroll to chat section
        chatSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Hide the floating bubble after scrolling
        floatingBubble.classList.remove('show');

        // Focus the chat input after scrolling
        setTimeout(() => {
          const chatInput = chatSection.querySelector('.chat-input');
          if (chatInput) chatInput.focus();
        }, 500);
      } else {
        // PRICING/SIMULATOR PAGE BEHAVIOR: Toggle mini-chat window
        const miniChatWindow = floatingBubble.querySelector('.mini-chat-window');
        if (miniChatWindow) {
          // Toggle chat open state
          floatingBubble.classList.toggle('chat-open');

          // Clear auto-hide timeout when opening chat
          if (floatingBubble.classList.contains('chat-open')) {
            if (autoHideTimeout) {
              clearTimeout(autoHideTimeout);
              autoHideTimeout = null;
            }
            // Focus input when opening
            setTimeout(() => {
              const input = floatingBubble.querySelector('.mini-chat-input');
              if (input) input.focus();
            }, 100);
          }
        }
      }
    });
  }
});
