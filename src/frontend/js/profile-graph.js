/**
 * ProfileGraph - Real-time profile visualization component
 * Shows user's risk profile on the LEFT side of Playground
 * Updates dynamically as conversation progresses
 */

const ProfileGraph = (function() {
  'use strict';

  // DOM Elements
  let container = null;
  let riskGauge = null;
  let confidenceBar = null;
  let traitsContainer = null;
  let toggleButton = null;

  // State
  let isExpanded = true; // Desktop default
  let isMobile = false;
  let Memory = null;
  let updateInterval = null;

  // Profile names by risk level (0-100, rounded to nearest 10)
  const PROFILE_NAMES = {
    0: { fr: 'Sécurité Absolue', en: 'Absolute Security', icon: 'shield' },
    10: { fr: 'Très Prudent', en: 'Very Conservative', icon: 'turtle' },
    20: { fr: 'Prudent', en: 'Conservative', icon: 'seedling' },
    30: { fr: 'Prudent+', en: 'Conservative+', icon: 'leaf' },
    40: { fr: 'Équilibre Défensif', en: 'Defensive Balance', icon: 'scale' },
    50: { fr: 'Équilibré', en: 'Balanced', icon: 'target' },
    60: { fr: 'Équilibre Dynamique', en: 'Dynamic Balance', icon: 'trendUp' },
    70: { fr: 'Dynamique', en: 'Growth', icon: 'rocket' },
    80: { fr: 'Dynamique+', en: 'Growth+', icon: 'bolt' },
    90: { fr: 'Très Dynamique', en: 'Very Aggressive', icon: 'flame' },
    100: { fr: 'Croissance Max', en: 'Maximum Growth', icon: 'gem' }
  };

  // SVG Icons
  const ICONS = {
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    turtle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="14" rx="8" ry="5"/><circle cx="12" cy="14" r="3"/><path d="M4 14c-1-2 0-4 2-5"/><path d="M20 14c1-2 0-4-2-5"/><circle cx="12" cy="7" r="2"/></svg>',
    seedling: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22V12"/><path d="M12 12c-3 0-6-3-6-6 3 0 6 3 6 6"/><path d="M12 12c3 0 6-3 6-6-3 0-6 3-6 6"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>',
    scale: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18"/><path d="M5 8l7-5 7 5"/><path d="M5 8v4c0 2 2 4 7 4s7-2 7-4V8"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    trendUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
    rocket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
    gem: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>',
    chevronLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>',
    chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    bubble: '<svg viewBox="0 0 72 72" fill="none"><circle cx="36" cy="41" r="26" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-dasharray="145 29" stroke-dashoffset="10"/><circle cx="59" cy="21" r="6" fill="currentColor"/></svg>'
  };

  /**
   * Get current language
   */
  function getLang() {
    return localStorage.getItem('bubbleLanguage') || document.documentElement.lang || 'fr';
  }

  /**
   * Get profile name based on risk score
   */
  function getProfileName(riskScore) {
    const level = Math.round(riskScore / 10) * 10;
    const clamped = Math.max(0, Math.min(100, level));
    return PROFILE_NAMES[clamped] || PROFILE_NAMES[50];
  }

  /**
   * Get color based on risk score (gradient from blue to orange)
   */
  function getRiskColor(riskScore) {
    // Conservative (0-30): Blue tones
    // Balanced (40-60): Purple/violet tones
    // Aggressive (70-100): Orange/red tones
    if (riskScore <= 30) {
      return '#667eea'; // Blue-purple
    } else if (riskScore <= 60) {
      return '#764ba2'; // Purple
    } else {
      return '#F97316'; // Orange
    }
  }

  /**
   * Create the profile panel HTML structure
   */
  function createPanelHTML() {
    const lang = getLang();
    const title = lang === 'fr' ? 'Ton Profil' : 'Your Profile';
    const confidenceLabel = lang === 'fr' ? 'Confiance' : 'Confidence';
    const traitsLabel = lang === 'fr' ? 'Traits découverts' : 'Discovered traits';
    const noTraitsYet = lang === 'fr' ? 'Continue à discuter pour découvrir tes traits' : 'Keep chatting to discover your traits';

    // Toggle button is outside the panel (on container) so it doesn't transform with panel
    return `
      <button class="profile-graph-toggle" id="profileGraphToggle" aria-label="Toggle profile panel">
        <span class="toggle-icon">${ICONS.chevronLeft}</span>
      </button>
      <div class="profile-graph-panel" id="profileGraphPanel">
        <div class="profile-graph-content">
          <div class="profile-graph-header">
            <span class="profile-graph-icon">${ICONS.user}</span>
            <h3 class="profile-graph-title">${title}</h3>
          </div>

          <!-- Risk Gauge -->
          <div class="profile-risk-gauge" id="profileRiskGauge">
            <div class="risk-gauge-track">
              <div class="risk-gauge-fill" id="riskGaugeFill"></div>
              <div class="risk-gauge-marker" id="riskGaugeMarker"></div>
            </div>
            <div class="risk-gauge-labels">
              <span>${lang === 'fr' ? 'Prudent' : 'Conservative'}</span>
              <span>${lang === 'fr' ? 'Dynamique' : 'Growth'}</span>
            </div>
            <div class="risk-profile-name" id="riskProfileName">
              <span class="profile-icon" id="profileIcon"></span>
              <span class="profile-name-text" id="profileNameText">--</span>
            </div>
            <div class="risk-score-value" id="riskScoreValue">--</div>
          </div>

          <!-- Confidence Bar -->
          <div class="profile-confidence" id="profileConfidence">
            <div class="confidence-header">
              <span class="confidence-label">${confidenceLabel}</span>
              <span class="confidence-value" id="confidenceValue">0%</span>
            </div>
            <div class="confidence-track">
              <div class="confidence-fill" id="confidenceFill"></div>
            </div>
          </div>

          <!-- Traits -->
          <div class="profile-traits" id="profileTraits">
            <div class="traits-header">
              <span class="traits-label">${traitsLabel}</span>
            </div>
            <div class="traits-list" id="traitsList">
              <span class="no-traits">${noTraitsYet}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Update the risk gauge visualization
   */
  function updateRiskGauge(riskScore, confidence) {
    if (!container) return;

    const lang = getLang();
    const profile = getProfileName(riskScore);
    const color = getRiskColor(riskScore);

    // Update gauge fill (gradient from left)
    const fill = container.querySelector('#riskGaugeFill');
    if (fill) {
      fill.style.width = `${riskScore}%`;
      fill.style.background = `linear-gradient(90deg, #667eea 0%, ${color} 100%)`;
    }

    // Update marker position
    const marker = container.querySelector('#riskGaugeMarker');
    if (marker) {
      marker.style.left = `${riskScore}%`;
      marker.style.backgroundColor = color;
      marker.style.opacity = confidence > 0 ? '1' : '0.3';
    }

    // Update profile name
    const nameText = container.querySelector('#profileNameText');
    if (nameText) {
      nameText.textContent = profile[lang] || profile.fr;
    }

    // Update profile icon
    const iconEl = container.querySelector('#profileIcon');
    if (iconEl && ICONS[profile.icon]) {
      iconEl.innerHTML = ICONS[profile.icon];
      iconEl.style.color = color;
    }

    // Update score value
    const scoreValue = container.querySelector('#riskScoreValue');
    if (scoreValue) {
      scoreValue.textContent = confidence > 0 ? `${Math.round(riskScore)}%` : '--';
      scoreValue.style.color = color;
    }
  }

  /**
   * Update confidence bar
   */
  function updateConfidence(confidence) {
    if (!container) return;

    const fill = container.querySelector('#confidenceFill');
    const value = container.querySelector('#confidenceValue');

    if (fill) {
      fill.style.width = `${confidence}%`;
      // Color based on confidence level
      if (confidence >= 70) {
        fill.style.backgroundColor = '#10B981'; // Green
      } else if (confidence >= 40) {
        fill.style.backgroundColor = '#F59E0B'; // Yellow
      } else {
        fill.style.backgroundColor = '#6B7280'; // Gray
      }
    }

    if (value) {
      value.textContent = `${Math.round(confidence)}%`;
    }
  }

  /**
   * Update traits display
   */
  function updateTraits(traits) {
    if (!container) return;

    const list = container.querySelector('#traitsList');
    if (!list) return;

    const lang = getLang();

    if (!traits || traits.length === 0) {
      const noTraitsYet = lang === 'fr' ? 'Continue à discuter pour découvrir tes traits' : 'Keep chatting to discover your traits';
      list.innerHTML = `<span class="no-traits">${noTraitsYet}</span>`;
      return;
    }

    // Show up to 6 traits as tags
    const displayTraits = traits.slice(0, 6);
    list.innerHTML = displayTraits.map(trait =>
      `<span class="trait-tag">${trait}</span>`
    ).join('');

    // Add "+N more" if there are more
    if (traits.length > 6) {
      const more = lang === 'fr' ? `+${traits.length - 6} autres` : `+${traits.length - 6} more`;
      list.innerHTML += `<span class="trait-tag trait-more">${more}</span>`;
    }
  }

  /**
   * Toggle panel expanded/collapsed state
   */
  function togglePanel() {
    isExpanded = !isExpanded;
    const panel = container.querySelector('.profile-graph-panel');
    const toggle = container.querySelector('.profile-graph-toggle');

    if (panel) {
      panel.classList.toggle('collapsed', !isExpanded);
    }

    // Also toggle on container for CSS fallback (browsers without :has() support)
    if (container) {
      container.classList.toggle('panel-collapsed', !isExpanded);
    }

    if (toggle) {
      const icon = toggle.querySelector('.toggle-icon');
      if (icon) {
        // Always use chevrons - same on mobile and desktop
        icon.innerHTML = isExpanded ? ICONS.chevronLeft : ICONS.chevronRight;
      }
    }

    // Save preference
    localStorage.setItem('profilePanelExpanded', isExpanded ? 'true' : 'false');
  }

  /**
   * Check if mobile viewport
   */
  function checkMobile() {
    isMobile = window.innerWidth < 768;
    return isMobile;
  }

  /**
   * Update all profile data from Memory
   */
  function updateFromMemory() {
    if (!Memory) return;

    const profile = Memory.getProfile();
    if (!profile) return;

    const riskScore = profile.riskScore ?? 50;
    const confidence = profile.riskConfidence ?? 0;
    const traits = profile.traits || [];

    updateRiskGauge(riskScore, confidence);
    updateConfidence(confidence);
    updateTraits(traits);
  }

  /**
   * Update language-dependent text
   */
  function updateLanguage() {
    if (!container) return;

    const lang = getLang();

    // Update title
    const title = container.querySelector('.profile-graph-title');
    if (title) {
      title.textContent = lang === 'fr' ? 'Ton Profil' : 'Your Profile';
    }

    // Update labels
    const confidenceLabel = container.querySelector('.confidence-label');
    if (confidenceLabel) {
      confidenceLabel.textContent = lang === 'fr' ? 'Confiance' : 'Confidence';
    }

    const traitsLabel = container.querySelector('.traits-label');
    if (traitsLabel) {
      traitsLabel.textContent = lang === 'fr' ? 'Traits découverts' : 'Discovered traits';
    }

    // Update gauge labels
    const gaugeLabels = container.querySelectorAll('.risk-gauge-labels span');
    if (gaugeLabels.length >= 2) {
      gaugeLabels[0].textContent = lang === 'fr' ? 'Prudent' : 'Conservative';
      gaugeLabels[1].textContent = lang === 'fr' ? 'Dynamique' : 'Growth';
    }

    // Re-update from memory to refresh profile name
    updateFromMemory();
  }

  /**
   * Initialize the profile graph
   */
  function init(containerSelector = '#playgroundFullscreen') {
    // Find or create container
    const parent = document.querySelector(containerSelector);
    if (!parent) {
      console.warn('[ProfileGraph] Parent container not found:', containerSelector);
      return false;
    }

    // Check if BubbleAgentMemory is available
    if (typeof BubbleAgentMemory !== 'undefined') {
      Memory = BubbleAgentMemory;
    } else {
      console.warn('[ProfileGraph] BubbleAgentMemory not available');
    }

    // Check mobile state
    checkMobile();

    // Load saved preference
    const savedExpanded = localStorage.getItem('profilePanelExpanded');
    isExpanded = savedExpanded !== 'false'; // Default to expanded

    // On mobile, default to collapsed
    if (isMobile && savedExpanded === null) {
      isExpanded = false;
    }

    // Create container
    container = document.createElement('div');
    container.className = 'profile-graph-container';
    container.innerHTML = createPanelHTML();

    // Insert into content wrapper (before chat main)
    const contentWrapper = parent.querySelector('.playground-content-wrapper');
    const chatMain = parent.querySelector('.playground-chat-main');

    if (contentWrapper && chatMain) {
      contentWrapper.insertBefore(container, chatMain);
    } else if (chatMain) {
      chatMain.parentNode.insertBefore(container, chatMain);
    } else {
      parent.appendChild(container);
    }

    // Apply initial state
    const panel = container.querySelector('.profile-graph-panel');
    if (panel && !isExpanded) {
      panel.classList.add('collapsed');
      container.classList.add('panel-collapsed'); // CSS fallback
      const icon = container.querySelector('.toggle-icon');
      if (icon) {
        // Always use chevron
        icon.innerHTML = ICONS.chevronRight;
      }
    }

    // Setup toggle button
    const toggle = container.querySelector('#profileGraphToggle');
    if (toggle) {
      toggle.addEventListener('click', togglePanel);
    }

    // Initial update from memory
    updateFromMemory();

    // Setup periodic updates (every 2 seconds)
    updateInterval = setInterval(updateFromMemory, 2000);

    // Listen for resize
    window.addEventListener('resize', () => {
      const wasMobile = isMobile;
      checkMobile();

      // Auto-collapse on transition to mobile if not manually set
      if (!wasMobile && isMobile && localStorage.getItem('profilePanelExpanded') === null) {
        isExpanded = false;
        const panel = container.querySelector('.profile-graph-panel');
        if (panel) panel.classList.add('collapsed');
        container.classList.add('panel-collapsed');
        const icon = container.querySelector('.toggle-icon');
        if (icon) icon.innerHTML = ICONS.chevronRight;
      }

      // Update toggle icon on viewport change - always chevron
      if (wasMobile !== isMobile) {
        const icon = container.querySelector('.toggle-icon');
        if (icon && !isExpanded) {
          icon.innerHTML = ICONS.chevronRight;
        }
      }
    });

    // Listen for language changes
    document.addEventListener('languageChanged', updateLanguage);
    window.addEventListener('languageChange', updateLanguage);

    console.log('[ProfileGraph] Initialized');
    return true;
  }

  /**
   * Cleanup
   */
  function destroy() {
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }

    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }

    container = null;
    Memory = null;
  }

  /**
   * Force refresh from memory
   */
  function refresh() {
    updateFromMemory();
  }

  return {
    init,
    destroy,
    refresh,
    togglePanel,
    updateLanguage
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProfileGraph;
}
