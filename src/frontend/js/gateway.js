/**
 * Bubble Path Gateway
 * CTA-triggered modal overlay for path selection (B2C or B2B)
 * Opens when user clicks "Découvrir notre approche" or "Voir notre alternative"
 */

(function () {
  var gateway = document.getElementById('path-gateway');
  if (!gateway) return;

  // All CTA buttons that should trigger the gateway
  var triggers = document.querySelectorAll('[data-gateway-trigger]');

  // Open gateway modal
  function openGateway(e) {
    e.preventDefault();
    gateway.classList.remove('gateway-hidden');
    gateway.classList.remove('gateway-exit');
    document.body.style.overflow = 'hidden';
    trapFocus(gateway);
  }

  // Close gateway modal
  function closeGateway() {
    gateway.classList.add('gateway-exit');
    document.body.style.overflow = '';
    setTimeout(function () {
      gateway.classList.add('gateway-hidden');
      gateway.classList.remove('gateway-exit');
    }, 500);
  }

  // Attach trigger buttons
  triggers.forEach(function (btn) {
    btn.addEventListener('click', openGateway);
  });

  // Card click: navigate to chosen path
  gateway.querySelectorAll('.gateway-card').forEach(function (card) {
    card.addEventListener('click', function () {
      var href = card.dataset.href;
      gateway.classList.add('gateway-exit');
      document.body.style.overflow = '';
      setTimeout(function () {
        window.location.href = href;
      }, 500);
    });
  });

  // Close button
  var closeBtn = document.getElementById('gateway-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeGateway);
  }

  // Close on backdrop click (outside cards area)
  gateway.addEventListener('click', function (e) {
    if (e.target === gateway || e.target.classList.contains('gateway-bg-layer') || e.target.classList.contains('gateway-grid-lines')) {
      closeGateway();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !gateway.classList.contains('gateway-hidden')) {
      closeGateway();
    }
  });

  // Accessibility: trap focus within gateway modal
  function trapFocus(element) {
    var focusables = element.querySelectorAll('button, a, [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];

    element.addEventListener('keydown', function handler(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    first.focus();
  }
})();
