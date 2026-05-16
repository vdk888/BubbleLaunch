// Smooth scroll-triggered animations for 2026 pages
document.addEventListener("DOMContentLoaded", () => {
  // Set up intersection observer for fade-in animations
  // Sprint 1 (2026-05-12): lowered threshold to 0 + rootMargin negative on bottom only
  // Reason: threshold 0.1 + ad-blockers/iframe contexts sometimes never reach 10% — invisible content
  const fadeInObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("fade-in-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0,
      rootMargin: "0px 0px -10% 0px",
    },
  );

  // Observe all elements with fade-in class
  document.querySelectorAll(".fade-in").forEach((el) => {
    fadeInObserver.observe(el);
  });

  // Safety net: after 1.5s, force-reveal anything still hidden (fallback for buggy observers)
  // Sprint 1 (2026-05-12): added because /a-propos team photos were stuck invisible in some browsers
  setTimeout(() => {
    document.querySelectorAll(".fade-in:not(.fade-in-visible)").forEach((el) => {
      el.classList.add("fade-in-visible");
    });
  }, 1500);

  // Also handle prefers-reduced-motion: instant reveal
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".fade-in").forEach((el) => {
      el.classList.add("fade-in-visible");
    });
  }

  // Auto-observe section headers and content blocks for smooth reveal
  document.querySelectorAll(
    "section .section-header, section .path-card, section .selfware-content, " +
    "section .selfware-visual, section .trust-item, section .blog-card, " +
    "section .feature-item, section .flow-diagram, " +
    "section .card, section .service-card, section .example-card, " +
    "section .value-card, section .testimonial-card, section .why-item, " +
    "section .process-step, section .differentiation-item, section .team-member, " +
    "section .manifesto-quote, section .reference-category, " +
    ".workflow-step, .workflow-connector"
  ).forEach((el) => {
    if (!el.classList.contains("fade-in")) {
      el.classList.add("fade-in");
    }
    fadeInObserver.observe(el);
  });

  // Stagger animation delays for items inside carousels / grids
  document.querySelectorAll(
    ".cards-grid, .services-grid, .examples-grid, .testimonials-grid, " +
    ".process-grid, .values-grid, .why-bubble-grid, .differentiation-grid, " +
    ".trust-grid, .blog-grid, .team-grid"
  ).forEach((grid) => {
    Array.from(grid.children).forEach((child, i) => {
      child.style.transitionDelay = (i * 0.08) + "s";
    });
  });

  // Add smooth hover/active transitions to interactive cards
  const interactiveCards = ".card, .feature-item, .platform-card, .path-card, .blog-card, " +
    ".trust-item, .service-card, .example-card, .value-card, .testimonial-card, " +
    ".why-item, .social-btn, .reference-card";

  document.querySelectorAll(interactiveCards).forEach((card) => {
    card.style.transition = card.style.transition
      ? card.style.transition + ", transform 0.3s ease, box-shadow 0.3s ease"
      : "transform 0.3s ease, box-shadow 0.3s ease";
  });
});
