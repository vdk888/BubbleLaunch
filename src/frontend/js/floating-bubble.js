document.addEventListener('DOMContentLoaded', () => {
  const floatingBubble = document.getElementById('floating-chat-bubble');
  const chatSection = document.getElementById('chat');
  const sectionsToObserve = document.querySelectorAll('#manifesto, #vision, #approach');

  if (!floatingBubble || !chatSection || sectionsToObserve.length === 0) return;

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.8 // Trigger when 80% of the section is visible
  };

  const bubbleObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Don't show if chat section is already visible
        const chatRect = chatSection.getBoundingClientRect();
        if (chatRect.top < window.innerHeight && chatRect.bottom >= 0) {
          return;
        }

        floatingBubble.classList.add('show');

        // Auto-hide after 8 seconds
        setTimeout(() => {
          floatingBubble.classList.remove('show');
        }, 8000);
      }
    });
  }, observerOptions);

  sectionsToObserve.forEach(section => {
    bubbleObserver.observe(section);
  });

  // Hide bubble if user scrolls back up
  let lastScrollY = window.scrollY;
  window.addEventListener('scroll', () => {
    if (window.scrollY < lastScrollY) {
      floatingBubble.classList.remove('show');
    }
    lastScrollY = window.scrollY;
  }, { passive: true });

  // Handle click on bubble
  floatingBubble.addEventListener('click', () => {
    chatSection.scrollIntoView({ behavior: 'smooth' });
    floatingBubble.classList.remove('show');
    // Focus on the chat input after scrolling
    setTimeout(() => {
      document.querySelector('.chat-input').focus();
    }, 500);
  });
});
