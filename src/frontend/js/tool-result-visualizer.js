/**
 * Tool Result Visualizer v2.0
 * Renders visual cards for the 4 business-aligned chatbot tools:
 *   - qualify_professional_need → Qualification card with recommendation + CTA
 *   - book_consultation → Booking card with Calendly link
 *   - get_poc_showcase → POC info card with links
 *   - recommend_content → Content channels card with links
 */

(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // INJECT STYLES
  // ═══════════════════════════════════════════════════════════════════════════

  const styleId = 'tool-result-visualizer-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .tool-result {
        margin-top: 12px;
        padding: 16px;
        background: linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.95) 100%);
        border: 1px solid rgba(226, 232, 240, 0.8);
        border-radius: 12px;
        backdrop-filter: blur(10px);
        width: 100%;
        box-sizing: border-box;
      }

      .tool-result .result-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 12px;
      }

      .tool-result .result-header-icon {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        flex-shrink: 0;
      }

      .tool-result .result-header-text {
        font-weight: 600;
        color: #1f2937;
        font-size: 14px;
      }

      .tool-result .result-header-badge {
        margin-left: auto;
        font-size: 11px;
        padding: 3px 8px;
        border-radius: 6px;
        font-weight: 500;
      }

      .tool-result .result-description {
        font-size: 13px;
        color: #4b5563;
        line-height: 1.5;
        margin-bottom: 12px;
      }

      .tool-result .result-list {
        list-style: none;
        padding: 0;
        margin: 0 0 12px 0;
      }

      .tool-result .result-list li {
        font-size: 12px;
        color: #374151;
        padding: 6px 0;
        display: flex;
        align-items: flex-start;
        gap: 8px;
        border-bottom: 1px solid rgba(229, 231, 235, 0.5);
      }

      .tool-result .result-list li:last-child {
        border-bottom: none;
      }

      .tool-result .result-list .check-icon {
        color: #10B981;
        flex-shrink: 0;
        margin-top: 1px;
      }

      .tool-result .result-cta {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 10px 16px;
        background: linear-gradient(135deg, #6666ff 0%, #764ba2 100%);
        color: white;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 500;
        font-size: 13px;
        transition: transform 0.2s, box-shadow 0.2s;
        cursor: pointer;
        border: none;
      }

      .tool-result .result-cta:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 102, 255, 0.3);
      }

      .tool-result .channel-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 12px;
      }

      .tool-result .channel-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: rgba(255, 255, 255, 0.7);
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        font-size: 12px;
        color: #374151;
        text-decoration: none;
        transition: background 0.2s, border-color 0.2s;
      }

      .tool-result .channel-chip:hover {
        background: rgba(255, 255, 255, 0.95);
        border-color: #6666ff;
      }

      .tool-result .channel-chip .chip-icon {
        font-size: 14px;
      }

      .tool-result .poc-details {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-bottom: 12px;
      }

      .tool-result .poc-detail-item {
        padding: 8px 10px;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 8px;
        font-size: 12px;
      }

      .tool-result .poc-detail-item .detail-label {
        color: #6b7280;
        display: block;
        margin-bottom: 2px;
      }

      .tool-result .poc-detail-item .detail-value {
        color: #1f2937;
        font-weight: 500;
      }

      .tool-result .result-note {
        font-size: 11px;
        color: #6b7280;
        font-style: italic;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(229, 231, 235, 0.5);
      }

      .tool-result .qualification-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
        margin-bottom: 12px;
      }

      .tool-result .qualification-item {
        padding: 6px 10px;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 6px;
        font-size: 11px;
      }

      .tool-result .qualification-item .q-label {
        color: #6b7280;
        display: block;
      }

      .tool-result .qualification-item .q-value {
        color: #1f2937;
        font-weight: 500;
        text-transform: capitalize;
      }
    `;
    document.head.appendChild(style);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  function getLang() {
    return document.documentElement.lang || localStorage.getItem('bubbleLanguage') || 'fr';
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function createResultContainer(extraClass) {
    const container = document.createElement('div');
    container.className = `tool-result ${extraClass || ''}`;
    return container;
  }

  function getWrapper(anchorEl) {
    return anchorEl?.closest('.chat-side-panel-message') || anchorEl?.parentElement;
  }

  const FORMAT_ICONS = {
    blog: '📝',
    video: '🎥',
    newsletter: '📬',
    social: '💬',
    code: '💻',
    interactive: '🎯',
    page: '📄'
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: qualify_professional_need
  // ═══════════════════════════════════════════════════════════════════════════

  function renderQualificationCard(data, anchorEl) {
    if (!data || !anchorEl) return;
    const wrapper = getWrapper(anchorEl);
    if (!wrapper) return;

    const lang = getLang();
    const container = createResultContainer('tool-result-qualification');
    const rec = data.recommendation || {};
    const nextStep = data.nextStep || {};
    const qualification = data.qualification || {};
    const differentiators = data.differentiators || [];

    // Badge color based on urgency
    const urgencyColors = {
      ready_now: { bg: '#dcfce7', text: '#166534' },
      planning: { bg: '#fef3c7', text: '#92400e' },
      exploring: { bg: '#e0e7ff', text: '#3730a3' }
    };
    const urgencyColor = urgencyColors[qualification.urgency] || urgencyColors.exploring;
    const urgencyLabel = {
      ready_now: lang === 'fr' ? 'Prêt' : 'Ready',
      planning: lang === 'fr' ? 'En planification' : 'Planning',
      exploring: lang === 'fr' ? 'Exploration' : 'Exploring'
    };

    let html = `
      <div class="result-header">
        <div class="result-header-icon" style="background: linear-gradient(135deg, #e0e7ff, #c7d2fe);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
        </div>
        <span class="result-header-text">${lang === 'fr' ? 'Qualification' : 'Qualification'}</span>
        <span class="result-header-badge" style="background: ${urgencyColor.bg}; color: ${urgencyColor.text};">
          ${urgencyLabel[qualification.urgency] || ''}
        </span>
      </div>
    `;

    // Recommendation
    if (rec.service) {
      html += `
        <div class="result-description">
          <strong>${escapeHtml(rec.service)}</strong><br>
          ${escapeHtml(rec.description || '')}
        </div>
      `;
    }

    // Qualification summary grid
    html += '<div class="qualification-grid">';
    if (qualification.company_type) {
      html += `<div class="qualification-item"><span class="q-label">${lang === 'fr' ? 'Type' : 'Type'}</span><span class="q-value">${escapeHtml(qualification.company_type.replace(/_/g, ' '))}</span></div>`;
    }
    if (qualification.pain_point) {
      html += `<div class="qualification-item"><span class="q-label">${lang === 'fr' ? 'Besoin' : 'Need'}</span><span class="q-value">${escapeHtml(qualification.pain_point.replace(/_/g, ' '))}</span></div>`;
    }
    if (qualification.ai_maturity) {
      html += `<div class="qualification-item"><span class="q-label">${lang === 'fr' ? 'Maturité IA' : 'AI Maturity'}</span><span class="q-value">${escapeHtml(qualification.ai_maturity)}</span></div>`;
    }
    if (qualification.team_size) {
      html += `<div class="qualification-item"><span class="q-label">${lang === 'fr' ? 'Équipe' : 'Team'}</span><span class="q-value">${escapeHtml(qualification.team_size)}</span></div>`;
    }
    html += '</div>';

    // Differentiators
    if (differentiators.length > 0) {
      html += '<ul class="result-list">';
      differentiators.forEach(d => {
        html += `<li><span class="check-icon">✓</span> ${escapeHtml(d)}</li>`;
      });
      html += '</ul>';
    }

    // CTA
    if (nextStep.calendlyUrl) {
      html += `<a href="${nextStep.calendlyUrl}" target="_blank" rel="noopener noreferrer" class="result-cta">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        ${lang === 'fr' ? 'Réserver un appel' : 'Book a Call'}
      </a>`;
    } else if (nextStep.contentLinks) {
      html += `<a href="${nextStep.contentLinks[0] || '/professionals'}" class="result-cta">
        ${lang === 'fr' ? 'Explorer nos services' : 'Explore Our Services'}
      </a>`;
    }

    container.innerHTML = html;
    wrapper.appendChild(container);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: book_consultation
  // ═══════════════════════════════════════════════════════════════════════════

  function renderBookingCard(data, anchorEl) {
    if (!data || !anchorEl) return;
    const wrapper = getWrapper(anchorEl);
    if (!wrapper) return;

    const lang = getLang();
    const container = createResultContainer('tool-result-booking');
    const consultation = data.consultation || {};

    container.innerHTML = `
      <div class="result-header">
        <div class="result-header-icon" style="background: linear-gradient(135deg, #d1fae5, #a7f3d0);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <span class="result-header-text">${escapeHtml(consultation.label || 'Consultation')}</span>
        <span class="result-header-badge" style="background: #d1fae5; color: #065f46;">
          ${escapeHtml(consultation.duration || '')}
        </span>
      </div>
      <div class="result-description">${escapeHtml(consultation.description || '')}</div>
      ${data.contextSummary ? `<div class="result-note">${lang === 'fr' ? 'Contexte' : 'Context'}: ${escapeHtml(data.contextSummary)}</div>` : ''}
      <a href="${data.bookingUrl || '#'}" target="_blank" rel="noopener noreferrer" class="result-cta" style="margin-top: 12px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
        ${lang === 'fr' ? 'Ouvrir Calendly' : 'Open Calendly'}
      </a>
    `;

    wrapper.appendChild(container);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: get_poc_showcase
  // ═══════════════════════════════════════════════════════════════════════════

  function renderPocShowcase(data, anchorEl) {
    if (!data || !anchorEl) return;
    const wrapper = getWrapper(anchorEl);
    if (!wrapper) return;

    const lang = getLang();
    const container = createResultContainer('tool-result-poc');
    const approach = data.approach || {};
    const links = data.links || {};

    let html = `
      <div class="result-header">
        <div class="result-header-icon" style="background: linear-gradient(135deg, #fef3c7, #fde68a);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
        <span class="result-header-text">${escapeHtml(data.name || 'Bubble POC')}</span>
        <span class="result-header-badge" style="background: #fef3c7; color: #92400e;">
          ${escapeHtml(data.status || '')}
        </span>
      </div>
      <div class="result-description">${escapeHtml(data.description || '')}</div>
    `;

    // Details grid
    html += '<div class="poc-details">';
    if (approach.strategies) {
      html += `<div class="poc-detail-item"><span class="detail-label">${lang === 'fr' ? 'Stratégies' : 'Strategies'}</span><span class="detail-value">${escapeHtml(approach.strategies.join(', '))}</span></div>`;
    }
    if (approach.brokers) {
      html += `<div class="poc-detail-item"><span class="detail-label">Brokers</span><span class="detail-value">${escapeHtml(approach.brokers.join(', '))}</span></div>`;
    }
    if (approach.dataHistory) {
      html += `<div class="poc-detail-item"><span class="detail-label">${lang === 'fr' ? 'Historique' : 'History'}</span><span class="detail-value">${escapeHtml(approach.dataHistory)}</span></div>`;
    }
    if (approach.etfs) {
      html += `<div class="poc-detail-item"><span class="detail-label">ETFs</span><span class="detail-value">${escapeHtml(approach.etfs.join(', '))}</span></div>`;
    }
    html += '</div>';

    // Technical details (if detailed level)
    if (data.technicalDetails) {
      const td = data.technicalDetails;
      html += `<div class="result-description" style="font-size: 12px; background: rgba(255,255,255,0.5); padding: 10px; border-radius: 8px; margin-bottom: 12px;">`;
      if (td.stack) html += `<strong>Stack:</strong> ${escapeHtml(td.stack)}<br>`;
      if (td.aiModels) html += `<strong>${lang === 'fr' ? 'Modèles IA' : 'AI Models'}:</strong> ${escapeHtml(td.aiModels)}<br>`;
      if (td.transparency) html += `<em>${escapeHtml(td.transparency)}</em>`;
      html += '</div>';
    }

    // Links
    html += '<div class="channel-list">';
    if (links.simulator) {
      html += `<a href="${links.simulator}" class="channel-chip"><span class="chip-icon">🎯</span> Simulator</a>`;
    }
    if (links.blog) {
      html += `<a href="${links.blog}" class="channel-chip"><span class="chip-icon">📝</span> Blog</a>`;
    }
    if (links.github) {
      html += `<a href="${links.github}" target="_blank" rel="noopener noreferrer" class="channel-chip"><span class="chip-icon">💻</span> GitHub</a>`;
    }
    if (links.newsletter) {
      html += `<a href="${links.newsletter}" target="_blank" rel="noopener noreferrer" class="channel-chip"><span class="chip-icon">📬</span> Newsletter</a>`;
    }
    html += '</div>';

    // Key point
    if (data.keyPoint) {
      html += `<div class="result-note">${escapeHtml(data.keyPoint)}</div>`;
    }

    container.innerHTML = html;
    wrapper.appendChild(container);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: recommend_content
  // ═══════════════════════════════════════════════════════════════════════════

  function renderContentRecommendation(data, anchorEl) {
    if (!data || !anchorEl) return;
    const wrapper = getWrapper(anchorEl);
    if (!wrapper) return;

    const lang = getLang();
    const container = createResultContainer('tool-result-content');
    const channels = data.channels || [];

    let html = `
      <div class="result-header">
        <div class="result-header-icon" style="background: linear-gradient(135deg, #ede9fe, #ddd6fe);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
        <span class="result-header-text">${lang === 'fr' ? 'Contenus recommandés' : 'Recommended Content'}</span>
      </div>
      <div class="result-description">${escapeHtml(data.description || '')}</div>
    `;

    // Channel chips
    if (channels.length > 0) {
      html += '<div class="channel-list">';
      channels.forEach(ch => {
        const icon = FORMAT_ICONS[ch.format] || FORMAT_ICONS[ch.type] || '🔗';
        const target = ch.url.startsWith('/') ? '' : ' target="_blank" rel="noopener noreferrer"';
        html += `<a href="${ch.url}"${target} class="channel-chip"><span class="chip-icon">${icon}</span> ${escapeHtml(ch.label)}</a>`;
      });
      html += '</div>';
    }

    // CTA bridge to B2B
    if (data.cta && data.ctaUrl) {
      html += `<div class="result-note">${escapeHtml(data.cta)} <a href="${data.ctaUrl}" target="_blank" rel="noopener noreferrer" style="color: #6666ff; text-decoration: underline;">${lang === 'fr' ? 'Réserver' : 'Book'}</a></div>`;
    }

    container.innerHTML = html;
    wrapper.appendChild(container);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN DISPATCHER
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Handle a tool result and render the appropriate visualization
   * @param {Object} toolResult - Tool result from SSE payload
   * @param {HTMLElement} anchorEl - Element to anchor the visualization to
   */
  function handleToolResult(toolResult, anchorEl) {
    if (!toolResult || !toolResult.result?.success) return;

    const name = toolResult.name;
    const data = toolResult.result.data || toolResult.result || {};

    switch (name) {
      case 'qualify_professional_need':
        renderQualificationCard(data, anchorEl);
        break;
      case 'book_consultation':
        renderBookingCard(data, anchorEl);
        break;
      case 'get_poc_showcase':
        renderPocShowcase(data, anchorEl);
        break;
      case 'recommend_content':
        renderContentRecommendation(data, anchorEl);
        break;
      default:
        console.log('[ToolResultVisualizer] Unknown tool result:', name);
    }
  }

  // Export to global namespace
  window.ToolResultVisualizer = {
    renderQualificationCard,
    renderBookingCard,
    renderPocShowcase,
    renderContentRecommendation,
    handleToolResult
  };

})();
