/**
 * Pricing Workflow Demo - Interactive Animated Chat
 * Showcases the Japanese Stocks workflow with input field typing, portfolio visualization, and enriched content
 */

document.addEventListener('DOMContentLoaded', () => {
  const workflowTranslations =
    (typeof window !== "undefined" && window.translations) ||
    (typeof translations !== "undefined" ? translations : {});
  const DEMO_SHOWN_KEY = 'bubble_workflow_demo_shown';

  // Track current scenario for routing
  let currentScenario = 'japan-momentum'; // default to intermediate demo
  const overlay = document.getElementById('workflow-demo-overlay');
  const closeBtn = document.getElementById('workflow-demo-close');
  const messagesContainer = document.getElementById('workflow-demo-messages');
  const pricingContent = document.getElementById('pricing-content');
  const replayBtn = document.getElementById('replay-demo');
  const inputField = document.querySelector('.workflow-demo-input-field');
  const sendButton = document.querySelector('.workflow-demo-send-button');

  const frDemoSwitch = document.getElementById('fr-demo-switch');
  const enDemoSwitch = document.getElementById('en-demo-switch');

  // Get current language from URL or default
  let currentLanguage = window.location.pathname.includes('/en/') ||
                        window.location.pathname.startsWith('/en') ? 'en' : 'fr';

  // Demo control flags and timeouts
  let demoAbortController = null;
  let pendingTimeouts = [];
  let isAnimationRunning = false;

  // Update language display buttons
  const updateLanguageButtons = () => {
    if (frDemoSwitch) {
      frDemoSwitch.classList.toggle('active', currentLanguage === 'fr');
      enDemoSwitch.classList.toggle('active', currentLanguage === 'en');
    }
  };

  updateLanguageButtons();

  // Cancel all pending animations and timeouts
  const cancelAnimations = () => {
    isAnimationRunning = false;
    pendingTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    pendingTimeouts = [];
    if (inputField) inputField.value = '';
  };

  // Wrapped setTimeout that tracks timeouts for cancellation
  const safeSetTimeout = (callback, delay) => {
    const timeoutId = setTimeout(() => {
      if (isAnimationRunning) {
        callback();
      }
      pendingTimeouts = pendingTimeouts.filter(id => id !== timeoutId);
    }, delay);
    pendingTimeouts.push(timeoutId);
    return timeoutId;
  };

  // Wrapped Promise.resolve for delays that respects cancellation
  const safeDelay = (ms) => {
    return new Promise((resolve) => {
      const timeoutId = safeSetTimeout(resolve, ms);
    });
  };

  // Auto-resize textarea as content grows
  const autoResizeTextarea = () => {
    if (!inputField) return;
    inputField.style.height = 'auto';
    inputField.style.height = Math.min(inputField.scrollHeight, 120) + 'px';
  };

  // Type in input field, animate send button, then show message as user
  const typeInInputAndSend = async (text) => {
    if (!inputField || !sendButton || !isAnimationRunning) return;

    // Type character by character in textarea
    inputField.value = '';
    autoResizeTextarea();

    for (let i = 0; i < text.length; i++) {
      if (!isAnimationRunning) break; // Stop if animation was cancelled
      inputField.value += text.charAt(i);
      autoResizeTextarea(); // Resize as text is added
      await safeDelay(80);
    }

    if (!isAnimationRunning) return;

    // Wait briefly
    await safeDelay(500);

    if (!isAnimationRunning) return;

    // Animate send button
    sendButton.classList.add('sending');
    await safeDelay(600);
    sendButton.classList.remove('sending');

    if (!isAnimationRunning) return;

    // Clear input and reset height
    inputField.value = '';
    autoResizeTextarea();

    // Small delay before message appears
    await safeDelay(200);
  };

  // Add system message (time transition)
  const addSystemMessage = (text) => {
    const systemDiv = document.createElement('div');
    systemDiv.className = 'workflow-demo-system-message';

    const content = document.createElement('div');
    content.className = 'workflow-demo-system-message-content';
    content.textContent = text;

    systemDiv.appendChild(content);
    messagesContainer.appendChild(systemDiv);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  };

  // Typing animation function
  const typeMessage = (element, text, speed = 60) => {
    return new Promise((resolve) => {
      if (!isAnimationRunning) {
        resolve();
        return;
      }

      let index = 0;
      element.innerHTML = '';
      const cursor = document.createElement('span');
      cursor.className = 'typing-cursor';
      element.appendChild(cursor);

      const typeNextChar = () => {
        if (!isAnimationRunning) {
          resolve();
          return;
        }

        if (index < text.length) {
          element.insertBefore(document.createTextNode(text.charAt(index)), cursor);
          index++;
          safeSetTimeout(typeNextChar, speed);
        } else {
          if (cursor && cursor.parentNode) {
            cursor.remove();
          }
          // Collect all text nodes and consolidate them into a text-content div
          const textDiv = document.createElement('div');
          let textContent = '';
          const nodesToRemove = [];

          for (let node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
              textContent += node.textContent;
              nodesToRemove.push(node);
            }
          }

          // Remove individual text nodes
          nodesToRemove.forEach(node => node.remove());

          // Add consolidated text as the first child
          if (textContent) {
            textDiv.textContent = textContent;
            element.insertBefore(textDiv, element.firstChild);
          }

          resolve();
        }
      };

      typeNextChar();
    });
  };

  // Create typing indicator
  const createTypingIndicator = () => {
    const indicator = document.createElement('div');
    indicator.className = 'workflow-demo-typing-indicator';
    indicator.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;
    return indicator;
  };

  // Add message to chat
  const addMessage = (text, isUser = false, enrichedContent = null) => {
    const messageDiv = document.createElement('div');
    messageDiv.className = `workflow-demo-message ${isUser ? 'user' : 'bot'}`;

    const bubble = document.createElement('div');
    bubble.className = 'workflow-demo-message-bubble';

    // Set text if provided
    if (text) {
      bubble.textContent = text;
    }

    messageDiv.appendChild(bubble);

    if (enrichedContent) {
      messageDiv.appendChild(enrichedContent);
    }

    messagesContainer.appendChild(messageDiv);

    // Auto-scroll to bottom
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 80);

    return { messageDiv, bubble };
  };

  // Create enriched research content (inline, not separate card)
  const createResearchContent = () => {
    const container = document.createElement('div');

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['workflow.message2.bot.research'][currentLanguage];
    container.appendChild(header);

    const stocks = workflowTranslations['workflow.message2.bot.stocks'];
    const list = document.createElement('div');
    list.className = 'workflow-demo-research-list';

    stocks.forEach(stock => {
      const item = document.createElement('div');
      item.className = 'workflow-demo-research-item';
      item.textContent = `${stock.name} (${stock.ticker})`;
      list.appendChild(item);
    });

    container.appendChild(list);
    return container;
  };

  // Create backtest metrics card
  const createBacktestCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['workflow.message4.bot.header'][currentLanguage];
    card.appendChild(header);

    const strategy = document.createElement('div');
    strategy.style.fontWeight = '600';
    strategy.style.color = '#667eea';
    strategy.style.marginTop = '0.8rem';
    strategy.textContent = workflowTranslations['workflow.message4.bot.strategy'][currentLanguage];
    card.appendChild(strategy);

    const details = document.createElement('div');
    details.style.fontSize = '0.85rem';
    details.style.color = '#444444';
    details.style.marginTop = '0.6rem';
    details.style.lineHeight = '1.6';
    details.textContent = workflowTranslations['workflow.message4.bot.details'][currentLanguage];
    card.appendChild(details);

    const metricsHeader = document.createElement('div');
    metricsHeader.style.fontWeight = '600';
    metricsHeader.style.color = '#333333';
    metricsHeader.style.marginTop = '1rem';
    metricsHeader.textContent = workflowTranslations['workflow.message4.bot.metrics_header'][currentLanguage];
    card.appendChild(metricsHeader);

    const metricsData = workflowTranslations['workflow.message4.bot.metrics'];
    const table = document.createElement('table');
    table.className = 'workflow-demo-metrics-table';

    const rows = [
      {
        label: metricsData.annualized_return[currentLanguage],
        value: metricsData.return_value
      },
      {
        label: metricsData.volatility[currentLanguage],
        value: metricsData.volatility_value
      },
      {
        label: metricsData.sortino_ratio[currentLanguage],
        value: metricsData.sortino_value
      },
      {
        label: metricsData.max_drawdown[currentLanguage],
        value: `${metricsData.max_drawdown_value} (${metricsData.topix_comparison[currentLanguage]})`
      }
    ];

    rows.forEach(row => {
      const tr = document.createElement('tr');
      const tdLabel = document.createElement('td');
      tdLabel.textContent = row.label;
      const tdValue = document.createElement('td');
      tdValue.textContent = row.value;
      tr.appendChild(tdLabel);
      tr.appendChild(tdValue);
      table.appendChild(tr);
    });

    card.appendChild(table);
    return card;
  };

  // Create summary card
  const createSummaryCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.innerHTML = '✓ ' + workflowTranslations['workflow.message6.bot.summary_header'][currentLanguage];
    card.appendChild(header);

    const summary = workflowTranslations['workflow.message6.bot.summary'];
    const items = [
      { label: summary.name[currentLanguage], value: summary.name_value[currentLanguage] },
      { label: summary.allocation[currentLanguage], value: summary.allocation_value },
      { label: summary.strategy[currentLanguage], value: summary.strategy_value[currentLanguage] },
      { label: summary.rebalancing[currentLanguage], value: summary.rebalancing_value[currentLanguage] },
      { label: summary.activation[currentLanguage], value: summary.activation_value[currentLanguage] }
    ];

    items.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.style.padding = '0.6rem 0';
      itemDiv.style.borderBottom = '1px solid rgba(102, 126, 234, 0.1)';
      itemDiv.style.fontSize = '0.85rem';

      const label = document.createElement('strong');
      label.style.color = '#333333';
      label.textContent = item.label + ': ';

      const value = document.createElement('span');
      value.style.color = '#666666';
      value.textContent = item.value;

      itemDiv.appendChild(label);
      itemDiv.appendChild(value);
      card.appendChild(itemDiv);
    });

    return card;
  };

  // Create portfolio bar chart
  const createPortfolioBarChart = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['workflow.message9.bot.portfolio_header'][currentLanguage];
    card.appendChild(header);

    const allocHeader = document.createElement('div');
    allocHeader.style.fontSize = '0.85rem';
    allocHeader.style.fontWeight = '600';
    allocHeader.style.color = '#333333';
    allocHeader.style.marginTop = '0.8rem';
    allocHeader.style.marginBottom = '0.8rem';
    allocHeader.textContent = workflowTranslations['workflow.message9.bot.allocations'][currentLanguage];
    card.appendChild(allocHeader);

    const chartContainer = document.createElement('div');
    chartContainer.className = 'workflow-demo-bar-chart';

    const portfolioData = workflowTranslations['workflow.message9.bot.portfolio_items'];

    portfolioData.forEach((item, index) => {
      const barItem = document.createElement('div');
      barItem.className = 'portfolio-bar-item';

      // Label
      const label = document.createElement('div');
      label.className = 'portfolio-bar-label';
      label.innerHTML = `${item.flag} ${item.name[currentLanguage]}`;

      if (item.new) {
        const badge = document.createElement('span');
        badge.className = 'portfolio-bar-new-badge';
        badge.textContent = workflowTranslations['workflow.message9.bot.new_pocket'][currentLanguage];
        label.appendChild(badge);
      }

      barItem.appendChild(label);

      // Bar wrapper
      const barWrapper = document.createElement('div');
      barWrapper.className = 'portfolio-bar-wrapper';

      // Bar fill
      const barFill = document.createElement('div');
      barFill.className = `portfolio-bar-fill ${item.highlight ? 'highlight' : ''} animating`;
      barFill.style.width = '0%';
      barFill.dataset.targetWidth = item.percentage;

      // Value label
      const barValue = document.createElement('span');
      barValue.className = 'portfolio-bar-value';
      barValue.textContent = item.percentage;

      barWrapper.appendChild(barFill);
      barWrapper.appendChild(barValue);
      barItem.appendChild(barWrapper);
      chartContainer.appendChild(barItem);

      // Animate bars after a delay (stagger effect)
      setTimeout(() => {
        barFill.style.width = item.percentage;
        barFill.classList.remove('animating');
      }, 100 + (index * 80));
    });

    card.appendChild(chartContainer);
    return card;
  };

  // Intermediate Demo Sequence (Japan Momentum - Legacy)
  const runIntermediateDemo = async () => {
    messagesContainer.innerHTML = '';

    // Message 1: User
    const msg1Text = workflowTranslations['workflow.message1.user'][currentLanguage];
    await typeInInputAndSend(msg1Text);
    const { bubble: bubble1 } = addMessage(msg1Text, true);
    await safeDelay(2500);

    // Message 2: Bot with research (all in one bubble)
    const msg2IntroText = workflowTranslations['workflow.message2.bot.intro'][currentLanguage];
    const { messageDiv: msg2Div, bubble: msg2Bubble } = addMessage('', false);

    const typingIndicator = createTypingIndicator();
    msg2Div.insertBefore(typingIndicator, msg2Bubble.nextSibling);
    await safeDelay(2500);
    typingIndicator.remove();

    // Type intro text
    await typeMessage(msg2Bubble, msg2IntroText, 80);

    // Add line break and research content
    msg2Bubble.appendChild(document.createElement('br'));
    const researchContent = createResearchContent();
    msg2Bubble.appendChild(researchContent);

    // Add closing text
    msg2Bubble.appendChild(document.createElement('br'));
    const msg2ClosingText = workflowTranslations['workflow.message2.bot.closing'][currentLanguage];
    const closingSpan = document.createElement('span');
    closingSpan.style.color = '#444444';
    closingSpan.textContent = msg2ClosingText;
    msg2Bubble.appendChild(closingSpan);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(2500);

    // Message 3: User
    const msg3Text = workflowTranslations['workflow.message3.user'][currentLanguage];
    await typeInInputAndSend(msg3Text);
    const { bubble: bubble3 } = addMessage(msg3Text, true);
    await safeDelay(2500);

    // Message 4: Bot with backtest (all in one bubble)
    const msg4IntroText = workflowTranslations['workflow.message4.bot.intro'][currentLanguage];
    const { messageDiv: msg4Div, bubble: msg4Bubble } = addMessage('', false);

    const typingIndicator2 = createTypingIndicator();
    msg4Div.insertBefore(typingIndicator2, msg4Bubble.nextSibling);
    await safeDelay(2500);
    typingIndicator2.remove();

    await typeMessage(msg4Bubble, msg4IntroText, 80);

    // Add line break and backtest content
    msg4Bubble.appendChild(document.createElement('br'));
    const backtestContent = createBacktestCard();
    msg4Bubble.appendChild(backtestContent);

    // Add conclusion text
    msg4Bubble.appendChild(document.createElement('br'));
    const msg4ConclusionText = workflowTranslations['workflow.message4.bot.conclusion'][currentLanguage];
    const conclusionSpan = document.createElement('span');
    conclusionSpan.style.color = '#444444';
    conclusionSpan.textContent = msg4ConclusionText;
    msg4Bubble.appendChild(conclusionSpan);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(2500);

    // Message 5: User
    const msg5Text = workflowTranslations['workflow.message5.user'][currentLanguage];
    await typeInInputAndSend(msg5Text);
    const { bubble: bubble5 } = addMessage(msg5Text, true);
    await safeDelay(2500);

    // Message 6: Bot with summary (all in one bubble)
    const msg6ConfirmText = workflowTranslations['workflow.message6.bot.confirmation'][currentLanguage];
    const { messageDiv: msg6Div, bubble: msg6Bubble } = addMessage('', false);

    const typingIndicator3 = createTypingIndicator();
    msg6Div.insertBefore(typingIndicator3, msg6Bubble.nextSibling);
    await safeDelay(2500);
    typingIndicator3.remove();

    await typeMessage(msg6Bubble, msg6ConfirmText, 80);

    // Add line break and summary content
    msg6Bubble.appendChild(document.createElement('br'));
    const summaryCard = createSummaryCard();
    msg6Bubble.appendChild(summaryCard);

    // Add closing text
    msg6Bubble.appendChild(document.createElement('br'));
    const msg6ClosingText = workflowTranslations['workflow.message6.bot.closing'][currentLanguage];
    const msg6ClosingSpan = document.createElement('span');
    msg6ClosingSpan.style.color = '#444444';
    msg6ClosingSpan.textContent = msg6ClosingText;
    msg6Bubble.appendChild(msg6ClosingSpan);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(2500);

    // Message 7: System message (Time transition)
    const timeTransition = workflowTranslations['workflow.message7.system'][currentLanguage];
    addSystemMessage(timeTransition);
    await safeDelay(2500);

    // Message 8: User
    const msg8Text = workflowTranslations['workflow.message8.user'][currentLanguage];
    await typeInInputAndSend(msg8Text);
    const { bubble: bubble8 } = addMessage(msg8Text, true);
    await safeDelay(2500);

    // Message 9: Bubble with portfolio bar chart (all in one bubble)
    const msg9CelebrationText = workflowTranslations['workflow.message9.bot.celebration'][currentLanguage];
    const { messageDiv: msg9Div, bubble: msg9Bubble } = addMessage('', false);

    const typingIndicator4 = createTypingIndicator();
    msg9Div.insertBefore(typingIndicator4, msg9Bubble.nextSibling);
    await safeDelay(2500);
    typingIndicator4.remove();

    await typeMessage(msg9Bubble, msg9CelebrationText, 80);

    // Add line break and portfolio chart
    msg9Bubble.appendChild(document.createElement('br'));
    const portfolioBarChart = createPortfolioBarChart();
    msg9Bubble.appendChild(portfolioBarChart);

    // Add closing text
    msg9Bubble.appendChild(document.createElement('br'));
    const msg9ClosingText = workflowTranslations['workflow.message9.bot.closing'][currentLanguage];
    const msg9ClosingSpan = document.createElement('span');
    msg9ClosingSpan.style.color = '#444444';
    msg9ClosingSpan.textContent = msg9ClosingText;
    msg9Bubble.appendChild(msg9ClosingSpan);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(2500);

    // Message 10: User thanks
    const msg10Text = workflowTranslations['workflow.message10.user'][currentLanguage];
    await typeInInputAndSend(msg10Text);
    const { bubble: bubble10 } = addMessage(msg10Text, true);
    await safeDelay(2500);

    // Message 11: Bubble closing
    const msg11Text = workflowTranslations['workflow.message11.bot'][currentLanguage];
    const { messageDiv: msg11Div } = addMessage('', false);
    const msg11Bubble = msg11Div.querySelector('.workflow-demo-message-bubble');

    const typingIndicator5 = createTypingIndicator();
    msg11Div.appendChild(typingIndicator5);
    await safeDelay(2500);
    typingIndicator5.remove();

    await typeMessage(msg11Bubble, msg11Text, 80);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Mark demo as shown
    sessionStorage.setItem(DEMO_SHOWN_KEY, 'true');
  };

  const showDemoOverlay = () => {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    if (pricingContent) {
      pricingContent.classList.add('hidden');
    }
  };

  // Close demo and show pricing
  const closeDemo = () => {
    cancelAnimations();
    if (!overlay) return;
    overlay.classList.add('hidden');
    if (pricingContent) {
      pricingContent.classList.remove('hidden');
    }
  };

  // Route demo based on scenario
  const routeDemo = () => {
    console.log('[WorkflowDemo] Routing to scenario:', currentScenario);

    // Cancel any running animations and clear the container
    cancelAnimations();
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
    }

    // Start the new animation
    isAnimationRunning = true;

    switch(currentScenario) {
      case 'macro-defense':
        runBeginnerDemo();
        break;
      case 'japan-momentum':
        runIntermediateDemo(); // Legacy demo
        break;
      case 'semiconductors-sortino':
        runExpertDemo();
        break;
      default:
        console.warn('[WorkflowDemo] Unknown scenario, defaulting to intermediate');
        runIntermediateDemo();
    }
  };

  const launchWorkflowDemo = () => {
    showDemoOverlay();
    routeDemo();
  };

  // Event listeners
  if (closeBtn) {
    closeBtn.addEventListener('click', closeDemo);
  }

  // Keyboard support
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay && !overlay.classList.contains('hidden')) {
      closeDemo();
    }
  });

  // Language switching
  if (frDemoSwitch) {
    frDemoSwitch.addEventListener('click', () => {
      currentLanguage = 'fr';
      updateLanguageButtons();
      routeDemo();
    });
  }

  if (enDemoSwitch) {
    enDemoSwitch.addEventListener('click', () => {
      currentLanguage = 'en';
      updateLanguageButtons();
      routeDemo();
    });
  }

  // Replay button
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      sessionStorage.removeItem(DEMO_SHOWN_KEY);
      launchWorkflowDemo();
    });
  }

  window.addEventListener('launchDemo', (event) => {
    const demoExperience = event.detail;
    if (demoExperience && demoExperience.scenarioId) {
      currentScenario = demoExperience.scenarioId;
      console.log('[WorkflowDemo] Scenario set to:', currentScenario);
    }
    launchWorkflowDemo();
  });

  // ========== BEGINNER DEMO VISUAL HELPERS ==========

  // Create "Why This Works" card with 4 benefits
  const createBeginnerWhyCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['beginner.message2.bot.why_works'][currentLanguage];
    card.appendChild(header);

    const items = workflowTranslations['beginner.message2.bot.why_works_items'];
    const itemsContainer = document.createElement('div');
    itemsContainer.style.display = 'grid';
    itemsContainer.style.gridTemplateColumns = '1fr 1fr';
    itemsContainer.style.gap = '1rem';
    itemsContainer.style.marginTop = '1rem';

    items.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.style.padding = '0.8rem';
      itemDiv.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
      itemDiv.style.borderRadius = '12px';
      itemDiv.style.borderLeft = '3px solid #667eea';

      const title = document.createElement('div');
      title.style.fontWeight = '600';
      title.style.color = '#333333';
      title.style.marginBottom = '0.4rem';
      title.innerHTML = `${item.icon} ${item[`title_${currentLanguage}`]}`;

      const desc = document.createElement('div');
      desc.style.fontSize = '0.8rem';
      desc.style.color = '#666666';
      desc.style.lineHeight = '1.4';
      desc.textContent = item[`desc_${currentLanguage}`];

      itemDiv.appendChild(title);
      itemDiv.appendChild(desc);
      itemsContainer.appendChild(itemDiv);
    });

    card.appendChild(itemsContainer);
    return card;
  };

  // Create portfolio assets card with 5 allocations
  const createBeginnerPortfolioCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['beginner.message4.bot.portfolio_proposal'][currentLanguage];
    card.appendChild(header);

    const assets = workflowTranslations['beginner.message4.bot.assets'];
    const assetsContainer = document.createElement('div');
    assetsContainer.style.marginTop = '1rem';

    assets.forEach(asset => {
      const assetDiv = document.createElement('div');
      assetDiv.style.padding = '0.8rem';
      assetDiv.style.marginBottom = '0.8rem';
      assetDiv.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
      assetDiv.style.borderRadius = '8px';
      assetDiv.style.borderLeft = '3px solid #667eea';

      const nameRow = document.createElement('div');
      nameRow.style.display = 'flex';
      nameRow.style.justifyContent = 'space-between';
      nameRow.style.alignItems = 'center';
      nameRow.style.marginBottom = '0.4rem';

      const nameSpan = document.createElement('span');
      nameSpan.style.fontWeight = '600';
      nameSpan.style.color = '#333333';
      nameSpan.innerHTML = `${asset.icon} ${asset[`name_${currentLanguage}`]}`;

      const percentageSpan = document.createElement('span');
      percentageSpan.style.fontWeight = '700';
      percentageSpan.style.color = '#667eea';
      percentageSpan.style.fontSize = '1rem';
      percentageSpan.textContent = asset.percentage;

      nameRow.appendChild(nameSpan);
      nameRow.appendChild(percentageSpan);
      assetDiv.appendChild(nameRow);

      const descSpan = document.createElement('div');
      descSpan.style.fontSize = '0.8rem';
      descSpan.style.color = '#666666';
      descSpan.style.lineHeight = '1.4';
      descSpan.textContent = asset[`desc_${currentLanguage}`];
      assetDiv.appendChild(descSpan);

      assetsContainer.appendChild(assetDiv);
    });

    card.appendChild(assetsContainer);
    return card;
  };

  // Create risk statistics card
  const createBeginnerRiskCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const riskExpl = workflowTranslations['beginner.message4.bot.risk_explanation'][currentLanguage];
    const explDiv = document.createElement('div');
    explDiv.style.fontSize = '0.85rem';
    explDiv.style.color = '#444444';
    explDiv.style.marginBottom = '1rem';
    explDiv.textContent = riskExpl;
    card.appendChild(explDiv);

    const stats = workflowTranslations['beginner.message4.bot.risk_stats'];
    const statsContainer = document.createElement('div');

    stats.forEach(stat => {
      const statDiv = document.createElement('div');
      statDiv.style.padding = '0.6rem';
      statDiv.style.marginBottom = '0.6rem';
      statDiv.style.borderLeft = '3px solid #4CAF50';
      statDiv.style.paddingLeft = '0.8rem';
      statDiv.style.fontSize = '0.85rem';
      statDiv.style.color = '#333333';
      statDiv.innerHTML = `${stat.icon} ${stat[`stat_${currentLanguage}`]}`;
      statsContainer.appendChild(statDiv);
    });

    card.appendChild(statsContainer);

    const finalNote = workflowTranslations['beginner.message4.bot.final_note'][currentLanguage];
    const noteDiv = document.createElement('div');
    noteDiv.style.marginTop = '1rem';
    noteDiv.style.padding = '0.8rem';
    noteDiv.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
    noteDiv.style.borderRadius = '8px';
    noteDiv.style.fontSize = '0.85rem';
    noteDiv.style.color = '#2e5c3e';
    noteDiv.style.lineHeight = '1.5';
    noteDiv.textContent = finalNote;
    card.appendChild(noteDiv);

    return card;
  };

  // Create automation checklist card (7 items)
  const createBeginnerChecklistCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['beginner.message6.bot.checklist_title'][currentLanguage];
    card.appendChild(header);

    const items = workflowTranslations['beginner.message6.bot.checklist_items'];
    const listContainer = document.createElement('div');
    listContainer.style.marginTop = '1rem';

    items.forEach((item, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.style.padding = '0.8rem';
      itemDiv.style.marginBottom = '0.6rem';
      itemDiv.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
      itemDiv.style.borderRadius = '8px';
      itemDiv.style.borderLeft = '3px solid #667eea';

      const title = document.createElement('div');
      title.style.fontWeight = '600';
      title.style.color = '#333333';
      title.style.marginBottom = '0.4rem';
      title.innerHTML = `${item.icon} ${item[`title_${currentLanguage}`]}`;

      const desc = document.createElement('div');
      desc.style.fontSize = '0.8rem';
      desc.style.color = '#666666';
      desc.style.lineHeight = '1.4';
      desc.textContent = item[`desc_${currentLanguage}`];

      itemDiv.appendChild(title);
      itemDiv.appendChild(desc);
      listContainer.appendChild(itemDiv);
    });

    card.appendChild(listContainer);

    const example = workflowTranslations['beginner.message6.bot.real_life_example'][currentLanguage];
    const exampleDiv = document.createElement('div');
    exampleDiv.style.marginTop = '1rem';
    exampleDiv.style.padding = '0.8rem';
    exampleDiv.style.backgroundColor = 'rgba(255, 193, 7, 0.1)';
    exampleDiv.style.borderRadius = '8px';
    exampleDiv.style.fontSize = '0.85rem';
    exampleDiv.style.color = '#5d4037';
    exampleDiv.style.lineHeight = '1.5';
    exampleDiv.style.borderLeft = '3px solid #FFC107';
    exampleDiv.style.paddingLeft = '0.8rem';
    exampleDiv.textContent = example;
    card.appendChild(exampleDiv);

    return card;
  };

  // Create liquidity options card
  const createBeginnerLiquidityCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['beginner.message8.bot.liquidity'][currentLanguage];
    card.appendChild(header);

    const items = workflowTranslations['beginner.message8.bot.liquidity_items'];
    const itemsContainer = document.createElement('div');
    itemsContainer.style.marginTop = '1rem';

    items.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.style.padding = '0.8rem';
      itemDiv.style.marginBottom = '0.6rem';
      itemDiv.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
      itemDiv.style.borderRadius = '8px';
      itemDiv.style.borderLeft = '3px solid #667eea';

      const title = document.createElement('div');
      title.style.fontWeight = '600';
      title.style.color = '#333333';
      title.style.marginBottom = '0.4rem';
      title.innerHTML = `${item.icon} ${item[`title_${currentLanguage}`]}`;

      const desc = document.createElement('div');
      desc.style.fontSize = '0.8rem';
      desc.style.color = '#666666';
      desc.style.lineHeight = '1.4';
      desc.textContent = item[`desc_${currentLanguage}`];

      itemDiv.appendChild(title);
      itemDiv.appendChild(desc);
      itemsContainer.appendChild(itemDiv);
    });

    card.appendChild(itemsContainer);

    const reassurance = workflowTranslations['beginner.message8.bot.liquidity_reassurance'][currentLanguage];
    const reassuranceDiv = document.createElement('div');
    reassuranceDiv.style.marginTop = '1rem';
    reassuranceDiv.style.padding = '0.8rem';
    reassuranceDiv.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
    reassuranceDiv.style.borderRadius = '8px';
    reassuranceDiv.style.fontSize = '0.85rem';
    reassuranceDiv.style.color = '#2e5c3e';
    reassuranceDiv.style.lineHeight = '1.5';
    reassuranceDiv.textContent = reassurance;
    card.appendChild(reassuranceDiv);

    return card;
  };

  // Create timeline card (3 steps with sub-items)
  const createBeginnerTimelineCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['beginner.message8.bot.timeline_title'][currentLanguage];
    card.appendChild(header);

    const steps = workflowTranslations['beginner.message8.bot.timeline_steps'];
    const timelineContainer = document.createElement('div');
    timelineContainer.style.marginTop = '1rem';

    steps.forEach((step, stepIndex) => {
      const stepDiv = document.createElement('div');
      stepDiv.style.marginBottom = '1rem';
      stepDiv.style.paddingLeft = '1rem';
      stepDiv.style.borderLeft = '3px solid #667eea';
      stepDiv.style.position = 'relative';

      const stepTitle = document.createElement('div');
      stepTitle.style.fontWeight = '700';
      stepTitle.style.color = '#333333';
      stepTitle.style.marginBottom = '0.6rem';
      stepTitle.style.fontSize = '0.95rem';
      stepTitle.textContent = step[`step${currentLanguage === 'en' ? '' : '_fr'}`];
      stepDiv.appendChild(stepTitle);

      const itemsList = document.createElement('div');
      itemsList.style.marginLeft = '0.5rem';

      step.items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.style.padding = '0.4rem 0';
        itemDiv.style.fontSize = '0.85rem';
        itemDiv.style.color = '#666666';
        itemDiv.style.lineHeight = '1.4';
        itemDiv.innerHTML = `${item.icon} ${item[`text_${currentLanguage}`]}`;
        itemsList.appendChild(itemDiv);
      });

      stepDiv.appendChild(itemsList);
      timelineContainer.appendChild(stepDiv);
    });

    card.appendChild(timelineContainer);
    return card;
  };

  // Create backtest results card
  const createBeginnerBacktestCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['beginner.message10.bot.backtest_title'][currentLanguage];
    card.appendChild(header);

    const metrics = workflowTranslations['beginner.message10.bot.backtest_metrics'];
    const table = document.createElement('table');
    table.className = 'workflow-demo-metrics-table';
    table.style.width = '100%';
    table.style.marginTop = '0.8rem';
    table.style.marginBottom = '1rem';

    const rows = [
      {
        label: metrics[`starting_amount_${currentLanguage}`],
        value: metrics[`starting_value${currentLanguage === 'en' ? '' : '_fr'}`]
      },
      {
        label: metrics[`ending_amount_${currentLanguage}`],
        value: metrics[`ending_value${currentLanguage === 'en' ? '' : '_fr'}`]
      },
      {
        label: metrics[`avg_return_${currentLanguage}`],
        value: metrics[`avg_return_value${currentLanguage === 'en' ? '' : '_fr'}`]
      },
      {
        label: metrics[`worst_year_${currentLanguage}`],
        value: metrics[`worst_year_value${currentLanguage === 'en' ? '' : '_fr'}`]
      },
      {
        label: metrics[`best_year_${currentLanguage}`],
        value: metrics[`best_year_value${currentLanguage === 'en' ? '' : '_fr'}`]
      },
      {
        label: metrics[`winning_years_${currentLanguage}`],
        value: metrics[`winning_years_value${currentLanguage === 'en' ? '' : '_fr'}`]
      },
      {
        label: metrics[`recovery_${currentLanguage}`],
        value: metrics[`recovery_value${currentLanguage === 'en' ? '' : '_fr'}`]
      }
    ];

    rows.forEach(row => {
      const tr = document.createElement('tr');
      const tdLabel = document.createElement('td');
      tdLabel.style.paddingRight = '1rem';
      tdLabel.style.fontWeight = '600';
      tdLabel.style.color = '#333333';
      tdLabel.textContent = row.label;

      const tdValue = document.createElement('td');
      tdValue.style.textAlign = 'right';
      tdValue.style.color = '#667eea';
      tdValue.style.fontWeight = '600';
      tdValue.textContent = row.value;

      tr.appendChild(tdLabel);
      tr.appendChild(tdValue);
      table.appendChild(tr);
    });

    card.appendChild(table);

    const comparison = workflowTranslations['beginner.message10.bot.comparison_items'];
    const compHeader = document.createElement('div');
    compHeader.style.fontWeight = '600';
    compHeader.style.color = '#333333';
    compHeader.style.marginTop = '1rem';
    compHeader.style.marginBottom = '0.8rem';
    compHeader.textContent = workflowTranslations['beginner.message10.bot.comparison_title'][currentLanguage];
    card.appendChild(compHeader);

    const compContainer = document.createElement('div');
    comparison.forEach(comp => {
      const compDiv = document.createElement('div');
      compDiv.style.padding = '0.8rem';
      compDiv.style.marginBottom = '0.6rem';
      compDiv.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
      compDiv.style.borderRadius = '8px';

      const option = document.createElement('div');
      option.style.fontWeight = '600';
      option.style.color = '#333333';
      option.style.marginBottom = '0.4rem';
      option.innerHTML = `${comp.icon} ${comp[`option_${currentLanguage}`]}`;

      const result = document.createElement('div');
      result.style.fontSize = '0.85rem';
      result.style.color = '#667eea';
      result.style.fontWeight = '600';
      result.textContent = comp[`result${currentLanguage === 'en' ? '' : '_fr'}`];

      compDiv.appendChild(option);
      compDiv.appendChild(result);
      compContainer.appendChild(compDiv);
    });

    card.appendChild(compContainer);

    const finalNote = workflowTranslations['beginner.message10.bot.final_note'][currentLanguage];
    const noteDiv = document.createElement('div');
    noteDiv.style.marginTop = '1rem';
    noteDiv.style.padding = '0.8rem';
    noteDiv.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
    noteDiv.style.borderRadius = '8px';
    noteDiv.style.fontSize = '0.85rem';
    noteDiv.style.color = '#2e5c3e';
    noteDiv.style.lineHeight = '1.5';
    noteDiv.textContent = finalNote;
    card.appendChild(noteDiv);

    return card;
  };

  // ========== BEGINNER DEMO (macro-defense) ==========
  const runBeginnerDemo = async () => {
    console.log('[WorkflowDemo] Launching Beginner Demo (macro-defense)');
    messagesContainer.innerHTML = '';

    // Message 1: User
    const msg1Text = workflowTranslations['beginner.message1.user'][currentLanguage];
    await typeInInputAndSend(msg1Text);
    const { bubble: bubble1 } = addMessage(msg1Text, true);
    await safeDelay(2500);

    // Message 2: Bot intro with "Why This Works" card
    const msg2IntroText = workflowTranslations['beginner.message2.bot.intro'][currentLanguage];
    const { messageDiv: msg2Div, bubble: msg2Bubble } = addMessage('', false);

    const typingIndicator2 = createTypingIndicator();
    msg2Div.insertBefore(typingIndicator2, msg2Bubble.nextSibling);
    await safeDelay(2500);
    typingIndicator2.remove();

    await typeMessage(msg2Bubble, msg2IntroText, 80);

    // Add "Why This Works" card
    msg2Bubble.appendChild(document.createElement('br'));
    const whyCard = createBeginnerWhyCard();
    msg2Bubble.appendChild(whyCard);

    // Add closing text
    msg2Bubble.appendChild(document.createElement('br'));
    const msg2ClosingText = workflowTranslations['beginner.message2.bot.closing'][currentLanguage];
    const closingSpan2 = document.createElement('span');
    closingSpan2.style.color = '#444444';
    closingSpan2.textContent = msg2ClosingText;
    msg2Bubble.appendChild(closingSpan2);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(2500);

    // Message 3: User
    const msg3Text = workflowTranslations['beginner.message3.user'][currentLanguage];
    await typeInInputAndSend(msg3Text);
    const { bubble: bubble3 } = addMessage(msg3Text, true);
    await safeDelay(2500);

    // Message 4: Bot with portfolio proposal and risk card
    const msg4IntroText = workflowTranslations['beginner.message4.bot.intro'][currentLanguage];
    const { messageDiv: msg4Div, bubble: msg4Bubble } = addMessage('', false);

    const typingIndicator4 = createTypingIndicator();
    msg4Div.insertBefore(typingIndicator4, msg4Bubble.nextSibling);
    await safeDelay(2500);
    typingIndicator4.remove();

    await typeMessage(msg4Bubble, msg4IntroText, 80);

    // Add portfolio card
    msg4Bubble.appendChild(document.createElement('br'));
    const portfolioCard = createBeginnerPortfolioCard();
    msg4Bubble.appendChild(portfolioCard);

    // Add risk card
    msg4Bubble.appendChild(document.createElement('br'));
    const riskCard = createBeginnerRiskCard();
    msg4Bubble.appendChild(riskCard);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(2500);

    // Message 5: User
    const msg5Text = workflowTranslations['beginner.message5.user'][currentLanguage];
    await typeInInputAndSend(msg5Text);
    const { bubble: bubble5 } = addMessage(msg5Text, true);
    await safeDelay(2500);

    // Message 6: Bot with automation checklist
    const msg6IntroText = workflowTranslations['beginner.message6.bot.intro'][currentLanguage];
    const { messageDiv: msg6Div, bubble: msg6Bubble } = addMessage('', false);

    const typingIndicator6 = createTypingIndicator();
    msg6Div.insertBefore(typingIndicator6, msg6Bubble.nextSibling);
    await safeDelay(2500);
    typingIndicator6.remove();

    await typeMessage(msg6Bubble, msg6IntroText, 80);

    // Add checklist card
    msg6Bubble.appendChild(document.createElement('br'));
    const checklistCard = createBeginnerChecklistCard();
    msg6Bubble.appendChild(checklistCard);

    // Add closing text
    msg6Bubble.appendChild(document.createElement('br'));
    const msg6ClosingText = workflowTranslations['beginner.message6.bot.closing'][currentLanguage];
    const closingSpan6 = document.createElement('span');
    closingSpan6.style.color = '#444444';
    closingSpan6.textContent = msg6ClosingText;
    msg6Bubble.appendChild(closingSpan6);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(2500);

    // Message 7: User
    const msg7Text = workflowTranslations['beginner.message7.user'][currentLanguage];
    await typeInInputAndSend(msg7Text);
    const { bubble: bubble7 } = addMessage(msg7Text, true);
    await safeDelay(2500);

    // Message 8: Bot with liquidity and timeline cards
    const msg8IntroText = workflowTranslations['beginner.message8.bot.intro'][currentLanguage];
    const { messageDiv: msg8Div, bubble: msg8Bubble } = addMessage('', false);

    const typingIndicator8 = createTypingIndicator();
    msg8Div.insertBefore(typingIndicator8, msg8Bubble.nextSibling);
    await safeDelay(2500);
    typingIndicator8.remove();

    await typeMessage(msg8Bubble, msg8IntroText, 80);

    // Add liquidity card
    msg8Bubble.appendChild(document.createElement('br'));
    const liquidityCard = createBeginnerLiquidityCard();
    msg8Bubble.appendChild(liquidityCard);

    // Add timeline card
    msg8Bubble.appendChild(document.createElement('br'));
    const timelineCard = createBeginnerTimelineCard();
    msg8Bubble.appendChild(timelineCard);

    // Add closing text
    msg8Bubble.appendChild(document.createElement('br'));
    const msg8ClosingText = workflowTranslations['beginner.message8.bot.closing'][currentLanguage];
    const closingSpan8 = document.createElement('span');
    closingSpan8.style.color = '#444444';
    closingSpan8.textContent = msg8ClosingText;
    msg8Bubble.appendChild(closingSpan8);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(2500);

    // Message 9: User
    const msg9Text = workflowTranslations['beginner.message9.user'][currentLanguage];
    await typeInInputAndSend(msg9Text);
    const { bubble: bubble9 } = addMessage(msg9Text, true);
    await safeDelay(2500);

    // Message 10: Bot with backtest card
    const msg10IntroText = workflowTranslations['beginner.message10.bot.intro'][currentLanguage];
    const { messageDiv: msg10Div, bubble: msg10Bubble } = addMessage('', false);

    const typingIndicator10 = createTypingIndicator();
    msg10Div.insertBefore(typingIndicator10, msg10Bubble.nextSibling);
    await safeDelay(2500);
    typingIndicator10.remove();

    await typeMessage(msg10Bubble, msg10IntroText, 80);

    // Add backtest card
    msg10Bubble.appendChild(document.createElement('br'));
    const backtestCard = createBeginnerBacktestCard();
    msg10Bubble.appendChild(backtestCard);

    // Add closing text with P.S.
    msg10Bubble.appendChild(document.createElement('br'));
    const msg10ClosingText = workflowTranslations['beginner.message10.bot.closing'][currentLanguage];
    const closingSpan10 = document.createElement('span');
    closingSpan10.style.color = '#444444';
    closingSpan10.textContent = msg10ClosingText;
    msg10Bubble.appendChild(closingSpan10);

    // Add P.S.
    msg10Bubble.appendChild(document.createElement('br'));
    msg10Bubble.appendChild(document.createElement('br'));
    const psText = workflowTranslations['beginner.message10.bot.ps'][currentLanguage];
    const psSpan = document.createElement('span');
    psSpan.style.color = '#888888';
    psSpan.style.fontSize = '0.85rem';
    psSpan.style.fontStyle = 'italic';
    psSpan.textContent = psText;
    msg10Bubble.appendChild(psSpan);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Mark demo as shown
    sessionStorage.setItem(DEMO_SHOWN_KEY, 'true');
  };

  // ========== EXPERT DEMO VISUAL HELPERS ==========

  // Create strategy architecture card (4 layers)
  const createExpertStrategyCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['expert.message2.bot.strategy_overview'][currentLanguage];
    card.appendChild(header);

    const layers = workflowTranslations['expert.message2.bot.strategy_layers'];
    const layersContainer = document.createElement('div');
    layersContainer.style.marginTop = '1rem';

    layers.forEach((layer, idx) => {
      const layerDiv = document.createElement('div');
      layerDiv.style.padding = '1rem';
      layerDiv.style.marginBottom = '0.8rem';
      layerDiv.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
      layerDiv.style.borderRadius = '8px';
      layerDiv.style.borderLeft = '4px solid #667eea';

      const layerNum = document.createElement('div');
      layerNum.style.fontSize = '0.75rem';
      layerNum.style.fontWeight = '700';
      layerNum.style.color = '#667eea';
      layerNum.style.marginBottom = '0.4rem';
      layerNum.style.textTransform = 'uppercase';
      layerNum.textContent = `Layer ${idx + 1}`;
      layerDiv.appendChild(layerNum);

      const title = document.createElement('div');
      title.style.fontWeight = '700';
      title.style.color = '#333333';
      title.style.marginBottom = '0.6rem';
      title.style.fontSize = '0.95rem';
      title.innerHTML = `${layer.icon} ${layer[`title_${currentLanguage}`]}`;
      layerDiv.appendChild(title);

      const desc = document.createElement('div');
      desc.style.fontSize = '0.85rem';
      desc.style.color = '#666666';
      desc.style.lineHeight = '1.5';
      desc.textContent = layer.desc_en; // Using English description as they're not translated per item
      layerDiv.appendChild(desc);

      layersContainer.appendChild(layerDiv);
    });

    card.appendChild(layersContainer);
    return card;
  };

  // Create risk metrics comparison table
  const createExpertRiskMetricsCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['expert.message4.bot.risk_metrics_title'][currentLanguage];
    card.appendChild(header);

    const metrics = workflowTranslations['expert.message4.bot.risk_comparison'];
    const table = document.createElement('table');
    table.className = 'workflow-demo-metrics-table';
    table.style.width = '100%';
    table.style.marginTop = '1rem';

    const headerRow = document.createElement('tr');
    const thMetric = document.createElement('th');
    thMetric.style.textAlign = 'left';
    thMetric.style.fontWeight = '700';
    thMetric.style.color = '#333333';
    thMetric.style.paddingBottom = '0.8rem';
    thMetric.textContent = 'Metric';

    const thStrategy = document.createElement('th');
    thStrategy.style.textAlign = 'right';
    thStrategy.style.fontWeight = '700';
    thStrategy.style.color = '#667eea';
    thStrategy.style.paddingBottom = '0.8rem';
    thStrategy.textContent = 'Our Strategy';

    const thBench = document.createElement('th');
    thBench.style.textAlign = 'right';
    thBench.style.fontWeight = '700';
    thBench.style.color = '#888888';
    thBench.style.paddingBottom = '0.8rem';
    thBench.textContent = 'Benchmark (SMH)';

    headerRow.appendChild(thMetric);
    headerRow.appendChild(thStrategy);
    headerRow.appendChild(thBench);
    table.appendChild(headerRow);

    metrics.forEach(metric => {
      const tr = document.createElement('tr');
      tr.style.borderTop = '1px solid rgba(102, 126, 234, 0.1)';

      const tdMetric = document.createElement('td');
      tdMetric.style.padding = '0.8rem 0';
      tdMetric.style.fontWeight = '600';
      tdMetric.style.color = '#333333';
      tdMetric.style.fontSize = '0.9rem';
      tdMetric.textContent = metric[`metric_${currentLanguage}`];

      const tdStrategy = document.createElement('td');
      tdStrategy.style.padding = '0.8rem 0.8rem 0.8rem 0';
      tdStrategy.style.textAlign = 'right';
      tdStrategy.style.color = '#667eea';
      tdStrategy.style.fontWeight = '700';
      tdStrategy.textContent = metric.strategy;

      const tdBench = document.createElement('td');
      tdBench.style.padding = '0.8rem 0';
      tdBench.style.textAlign = 'right';
      tdBench.style.color = '#888888';
      tdBench.textContent = metric.benchmark;

      tr.appendChild(tdMetric);
      tr.appendChild(tdStrategy);
      tr.appendChild(tdBench);
      table.appendChild(tr);
    });

    card.appendChild(table);
    return card;
  };

  // Create stress test scenarios card
  const createExpertStressTestCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['expert.message4.bot.stress_title'][currentLanguage];
    card.appendChild(header);

    const scenarios = workflowTranslations['expert.message4.bot.stress_scenarios'];
    const scenariosContainer = document.createElement('div');
    scenariosContainer.style.marginTop = '1rem';

    scenarios.forEach(scenario => {
      const scDiv = document.createElement('div');
      scDiv.style.padding = '0.8rem';
      scDiv.style.marginBottom = '0.8rem';
      scDiv.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
      scDiv.style.borderRadius = '8px';
      scDiv.style.borderLeft = '3px solid #667eea';

      const periodDiv = document.createElement('div');
      periodDiv.style.fontWeight = '700';
      periodDiv.style.color = '#333333';
      periodDiv.style.marginBottom = '0.6rem';
      periodDiv.textContent = scenario.date;
      scDiv.appendChild(periodDiv);

      const comparisonDiv = document.createElement('div');
      comparisonDiv.style.display = 'grid';
      comparisonDiv.style.gridTemplateColumns = '1fr 1fr';
      comparisonDiv.style.gap = '0.8rem';
      comparisonDiv.style.marginBottom = '0.6rem';

      const smhDiv = document.createElement('div');
      smhDiv.innerHTML = `<div style="font-size: 0.75rem; color: #888888; text-transform: uppercase;">SMH</div><div style="font-weight: 700; color: #f44336; font-size: 1rem;">${scenario.smh_loss || scenario.smh_gain || scenario.smh_dd}</div>`;
      comparisonDiv.appendChild(smhDiv);

      const strategyDiv = document.createElement('div');
      strategyDiv.innerHTML = `<div style="font-size: 0.75rem; color: #667eea; text-transform: uppercase;">Strategy</div><div style="font-weight: 700; color: #667eea; font-size: 1rem;">${scenario.strategy_loss || scenario.strategy_gain || scenario.strategy_dd}</div>`;
      comparisonDiv.appendChild(strategyDiv);

      comparisonDiv.appendChild(smhDiv);
      comparisonDiv.appendChild(strategyDiv);
      scDiv.appendChild(comparisonDiv);

      const noteDiv = document.createElement('div');
      noteDiv.style.fontSize = '0.85rem';
      noteDiv.style.color = '#666666';
      noteDiv.style.fontStyle = 'italic';
      noteDiv.style.padding = '0.6rem';
      noteDiv.style.backgroundColor = 'rgba(255, 193, 7, 0.1)';
      noteDiv.style.borderRadius = '4px';
      noteDiv.textContent = scenario.hedge_benefit || scenario.note;
      scDiv.appendChild(noteDiv);

      scenariosContainer.appendChild(scDiv);
    });

    card.appendChild(scenariosContainer);
    return card;
  };

  // Create rebalancing rules card
  const createExpertRebalancingCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['expert.message6.bot.rebalancing_title'][currentLanguage];
    card.appendChild(header);

    const rules = workflowTranslations['expert.message6.bot.rebalancing_rules'];
    const rulesContainer = document.createElement('div');
    rulesContainer.style.marginTop = '1rem';

    rules.forEach(rule => {
      const ruleDiv = document.createElement('div');
      ruleDiv.style.padding = '0.8rem';
      ruleDiv.style.marginBottom = '0.8rem';
      ruleDiv.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
      ruleDiv.style.borderRadius = '8px';
      ruleDiv.style.borderLeft = '3px solid #667eea';

      const ruleName = document.createElement('div');
      ruleName.style.fontWeight = '700';
      ruleName.style.color = '#333333';
      ruleName.style.marginBottom = '0.6rem';
      ruleName.innerHTML = `${rule.icon} ${rule[`rule_${currentLanguage}`]}`;
      ruleDiv.appendChild(ruleName);

      const detail = document.createElement('div');
      detail.style.fontSize = '0.85rem';
      detail.style.color = '#666666';
      detail.style.lineHeight = '1.5';
      detail.textContent = rule.detail_en; // Using English as primary
      ruleDiv.appendChild(detail);

      rulesContainer.appendChild(ruleDiv);
    });

    card.appendChild(rulesContainer);
    return card;
  };

  // Create black swan events card
  const createExpertBlackSwanCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['expert.message6.bot.black_swan_title'][currentLanguage];
    card.appendChild(header);

    const events = workflowTranslations['expert.message6.bot.black_swan_events'];
    const eventsContainer = document.createElement('div');
    eventsContainer.style.marginTop = '1rem';

    events.forEach(event => {
      const eventDiv = document.createElement('div');
      eventDiv.style.padding = '1rem';
      eventDiv.style.marginBottom = '0.8rem';
      eventDiv.style.backgroundColor = 'rgba(244, 67, 54, 0.05)';
      eventDiv.style.borderRadius = '8px';
      eventDiv.style.borderLeft = '3px solid #f44336';

      const eventTitle = document.createElement('div');
      eventTitle.style.fontWeight = '700';
      eventTitle.style.color = '#d32f2f';
      eventTitle.style.marginBottom = '0.8rem';
      eventTitle.style.fontSize = '0.95rem';
      eventTitle.textContent = event.event;
      eventDiv.appendChild(eventTitle);

      const metricsGrid = document.createElement('div');
      metricsGrid.style.display = 'grid';
      metricsGrid.style.gridTemplateColumns = '1fr 1fr 1fr';
      metricsGrid.style.gap = '0.8rem';

      const markets = document.createElement('div');
      markets.innerHTML = `<div style="font-size: 0.75rem; color: #888888; text-transform: uppercase;">Market</div><div style="font-weight: 700; color: #f44336;">${event.market_loss}</div>`;
      metricsGrid.appendChild(markets);

      const strat = document.createElement('div');
      strat.innerHTML = `<div style="font-size: 0.75rem; color: #667eea; text-transform: uppercase;">Strategy</div><div style="font-weight: 700; color: #667eea;">${event.strategy}</div>`;
      metricsGrid.appendChild(strat);

      const payout = document.createElement('div');
      payout.innerHTML = `<div style="font-size: 0.75rem; color: #4caf50; text-transform: uppercase;">Hedge Payout</div><div style="font-weight: 700; color: #4caf50; font-size: 0.85rem;">${event.hedge_payout}</div>`;
      metricsGrid.appendChild(payout);

      eventDiv.appendChild(metricsGrid);
      eventsContainer.appendChild(eventDiv);
    });

    card.appendChild(eventsContainer);
    return card;
  };

  // Create execution details card
  const createExpertExecutionCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['expert.message8.bot.execution_title'][currentLanguage];
    card.appendChild(header);

    const details = workflowTranslations['expert.message8.bot.execution_details'];
    const detailsContainer = document.createElement('div');
    detailsContainer.style.marginTop = '1rem';

    details.forEach(detail => {
      const detailDiv = document.createElement('div');
      detailDiv.style.padding = '0.8rem';
      detailDiv.style.marginBottom = '0.8rem';
      detailDiv.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
      detailDiv.style.borderRadius = '8px';
      detailDiv.style.borderLeft = '3px solid #667eea';

      const title = document.createElement('div');
      title.style.fontWeight = '700';
      title.style.color = '#333333';
      title.style.marginBottom = '0.6rem';
      title.style.fontSize = '0.95rem';
      title.textContent = detail[`component_${currentLanguage}`];
      detailDiv.appendChild(title);

      const text = document.createElement('div');
      text.style.fontSize = '0.85rem';
      text.style.color = '#666666';
      text.style.lineHeight = '1.5';
      text.textContent = detail.details_en; // Using English
      detailDiv.appendChild(text);

      detailsContainer.appendChild(detailDiv);
    });

    card.appendChild(detailsContainer);

    const slippageNote = workflowTranslations['expert.message8.bot.real_slippage'][currentLanguage];
    const slippageDiv = document.createElement('div');
    slippageDiv.style.marginTop = '1rem';
    slippageDiv.style.padding = '0.8rem';
    slippageDiv.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
    slippageDiv.style.borderRadius = '8px';
    slippageDiv.style.fontSize = '0.85rem';
    slippageDiv.style.color = '#2e5c3e';
    slippageDiv.style.lineHeight = '1.5';
    slippageDiv.style.borderLeft = '3px solid #4caf50';
    slippageDiv.style.paddingLeft = '0.8rem';
    slippageDiv.textContent = slippageNote;
    card.appendChild(slippageDiv);

    return card;
  };

  // Create implementation timeline card
  const createExpertTimelineCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['expert.message10.bot.timeline_title'][currentLanguage];
    card.appendChild(header);

    const steps = workflowTranslations['expert.message10.bot.timeline_steps'];
    const timelineContainer = document.createElement('div');
    timelineContainer.style.marginTop = '1rem';

    steps.forEach((step, stepIndex) => {
      const stepDiv = document.createElement('div');
      stepDiv.style.marginBottom = '1.2rem';
      stepDiv.style.paddingLeft = '1rem';
      stepDiv.style.borderLeft = '3px solid #667eea';
      stepDiv.style.position = 'relative';

      const stepTitle = document.createElement('div');
      stepTitle.style.fontWeight = '700';
      stepTitle.style.color = '#333333';
      stepTitle.style.marginBottom = '0.8rem';
      stepTitle.style.fontSize = '0.95rem';
      stepTitle.textContent = step[`step${currentLanguage === 'en' ? '' : '_fr'}`];
      stepDiv.appendChild(stepTitle);

      const itemsList = document.createElement('div');
      itemsList.style.marginLeft = '0';

      step.items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.style.padding = '0.5rem 0';
        itemDiv.style.fontSize = '0.85rem';
        itemDiv.style.color = '#666666';
        itemDiv.style.lineHeight = '1.4';
        itemDiv.innerHTML = `${item.icon} ${item[`text_${currentLanguage}`]}`;
        itemsList.appendChild(itemDiv);
      });

      stepDiv.appendChild(itemsList);
      timelineContainer.appendChild(stepDiv);
    });

    card.appendChild(timelineContainer);

    const leverageNote = workflowTranslations['expert.message10.bot.leverage_note'][currentLanguage];
    const leverageDiv = document.createElement('div');
    leverageDiv.style.marginTop = '1rem';
    leverageDiv.style.padding = '0.8rem';
    leverageDiv.style.backgroundColor = 'rgba(255, 193, 7, 0.1)';
    leverageDiv.style.borderRadius = '8px';
    leverageDiv.style.fontSize = '0.85rem';
    leverageDiv.style.color = '#5d4037';
    leverageDiv.style.lineHeight = '1.5';
    leverageDiv.style.borderLeft = '3px solid #FFC107';
    leverageDiv.style.paddingLeft = '0.8rem';
    leverageDiv.textContent = leverageNote;
    card.appendChild(leverageDiv);

    return card;
  };

  // Create alpha decomposition card
  const createExpertAlphaCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['expert.message12.bot.alpha_breakdown'][currentLanguage];
    card.appendChild(header);

    const sources = workflowTranslations['expert.message12.bot.alpha_sources'];
    const sourcesContainer = document.createElement('div');
    sourcesContainer.style.marginTop = '1rem';

    sources.forEach((src, idx) => {
      const srcDiv = document.createElement('div');
      srcDiv.style.padding = '0.8rem';
      srcDiv.style.marginBottom = '0.8rem';
      srcDiv.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
      srcDiv.style.borderRadius = '8px';
      srcDiv.style.borderLeft = '3px solid #667eea';

      const sourceTitle = document.createElement('div');
      sourceTitle.style.display = 'flex';
      sourceTitle.style.justifyContent = 'space-between';
      sourceTitle.style.alignItems = 'center';
      sourceTitle.style.marginBottom = '0.6rem';

      const title = document.createElement('span');
      title.style.fontWeight = '700';
      title.style.color = '#333333';
      title.textContent = src[`source${currentLanguage === 'en' ? '' : '_fr'}`];

      const alpha = document.createElement('span');
      alpha.style.fontWeight = '700';
      alpha.style.color = '#667eea';
      alpha.style.fontSize = '1.1rem';
      alpha.textContent = src.alpha;

      sourceTitle.appendChild(title);
      sourceTitle.appendChild(alpha);
      srcDiv.appendChild(sourceTitle);

      const explanation = document.createElement('div');
      explanation.style.fontSize = '0.85rem';
      explanation.style.color = '#666666';
      explanation.style.lineHeight = '1.5';
      explanation.textContent = src.explanation;
      srcDiv.appendChild(explanation);

      sourcesContainer.appendChild(srcDiv);
    });

    card.appendChild(sourcesContainer);

    const caveat = workflowTranslations['expert.message12.bot.alpha_caveat'][currentLanguage];
    const caveatDiv = document.createElement('div');
    caveatDiv.style.marginTop = '1rem';
    caveatDiv.style.padding = '0.8rem';
    caveatDiv.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
    caveatDiv.style.borderRadius = '8px';
    caveatDiv.style.fontSize = '0.85rem';
    caveatDiv.style.color = '#5d4037';
    caveatDiv.style.lineHeight = '1.5';
    caveatDiv.style.borderLeft = '3px solid #f44336';
    caveatDiv.style.paddingLeft = '0.8rem';
    caveatDiv.textContent = caveat;
    card.appendChild(caveatDiv);

    return card;
  };

  // Create next steps checklist card
  const createExpertNextStepsCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = workflowTranslations['expert.message13.bot.next_steps'][currentLanguage];
    card.appendChild(header);

    const steps = workflowTranslations['expert.message13.bot.steps'];
    const stepsContainer = document.createElement('div');
    stepsContainer.style.marginTop = '1rem';

    steps.forEach((step, idx) => {
      const stepDiv = document.createElement('div');
      stepDiv.style.padding = '0.8rem';
      stepDiv.style.marginBottom = '0.8rem';
      stepDiv.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
      stepDiv.style.borderRadius = '8px';
      stepDiv.style.borderLeft = '3px solid #667eea';

      const stepText = document.createElement('div');
      stepText.style.fontSize = '0.9rem';
      stepText.style.color = '#333333';
      stepText.style.lineHeight = '1.5';
      stepText.innerHTML = `${step.icon} ${step[`step_${currentLanguage}`]}`;
      stepDiv.appendChild(stepText);

      stepsContainer.appendChild(stepDiv);
    });

    card.appendChild(stepsContainer);
    return card;
  };

  // ========== EXPERT DEMO (semiconductors-sortino) ==========
  const runExpertDemo = async () => {
    console.log('[WorkflowDemo] Launching Expert Demo (semiconductors-sortino)');
    messagesContainer.innerHTML = '';

    // Message 1: User
    const msg1Text = workflowTranslations['expert.message1.user'][currentLanguage];
    await typeInInputAndSend(msg1Text);
    const { bubble: bubble1 } = addMessage(msg1Text, true);
    await safeDelay(2500);

    // Message 2: Bot intro with strategy architecture
    const msg2IntroText = workflowTranslations['expert.message2.bot.intro'][currentLanguage];
    const { messageDiv: msg2Div, bubble: msg2Bubble } = addMessage('', false);

    const typingIndicator2 = createTypingIndicator();
    msg2Div.insertBefore(typingIndicator2, msg2Bubble.nextSibling);
    await safeDelay(2500);
    typingIndicator2.remove();

    await typeMessage(msg2Bubble, msg2IntroText, 80);

    // Add strategy card
    msg2Bubble.appendChild(document.createElement('br'));
    const strategyCard = createExpertStrategyCard();
    msg2Bubble.appendChild(strategyCard);

    // Add closing text
    msg2Bubble.appendChild(document.createElement('br'));
    const msg2ClosingText = workflowTranslations['expert.message2.bot.closing'][currentLanguage];
    const closingSpan2 = document.createElement('span');
    closingSpan2.style.color = '#444444';
    closingSpan2.textContent = msg2ClosingText;
    msg2Bubble.appendChild(closingSpan2);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(2500);

    // Message 3: User
    const msg3Text = workflowTranslations['expert.message3.user'][currentLanguage];
    await typeInInputAndSend(msg3Text);
    const { bubble: bubble3 } = addMessage(msg3Text, true);
    await safeDelay(2500);

    // Message 4: Bot with risk metrics and stress tests
    const msg4IntroText = workflowTranslations['expert.message4.bot.intro'][currentLanguage];
    const { messageDiv: msg4Div, bubble: msg4Bubble } = addMessage('', false);

    const typingIndicator4 = createTypingIndicator();
    msg4Div.insertBefore(typingIndicator4, msg4Bubble.nextSibling);
    await safeDelay(2500);
    typingIndicator4.remove();

    await typeMessage(msg4Bubble, msg4IntroText, 80);

    // Add risk metrics card
    msg4Bubble.appendChild(document.createElement('br'));
    const riskMetricsCard = createExpertRiskMetricsCard();
    msg4Bubble.appendChild(riskMetricsCard);

    // Add stress test card
    msg4Bubble.appendChild(document.createElement('br'));
    const stressTestCard = createExpertStressTestCard();
    msg4Bubble.appendChild(stressTestCard);

    // Add closing text
    msg4Bubble.appendChild(document.createElement('br'));
    const msg4ClosingText = workflowTranslations['expert.message4.bot.closing'][currentLanguage];
    const closingSpan4 = document.createElement('span');
    closingSpan4.style.color = '#444444';
    closingSpan4.textContent = msg4ClosingText;
    msg4Bubble.appendChild(closingSpan4);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(2500);

    // Message 5: User
    const msg5Text = workflowTranslations['expert.message5.user'][currentLanguage];
    await typeInInputAndSend(msg5Text);
    const { bubble: bubble5 } = addMessage(msg5Text, true);
    await safeDelay(2500);

    // Message 6: Bot with rebalancing and black swan cards
    const msg6IntroText = workflowTranslations['expert.message6.bot.intro'][currentLanguage];
    const { messageDiv: msg6Div, bubble: msg6Bubble } = addMessage('', false);

    const typingIndicator6 = createTypingIndicator();
    msg6Div.insertBefore(typingIndicator6, msg6Bubble.nextSibling);
    await safeDelay(2500);
    typingIndicator6.remove();

    await typeMessage(msg6Bubble, msg6IntroText, 80);

    // Add rebalancing card
    msg6Bubble.appendChild(document.createElement('br'));
    const rebalancingCard = createExpertRebalancingCard();
    msg6Bubble.appendChild(rebalancingCard);

    // Add black swan card
    msg6Bubble.appendChild(document.createElement('br'));
    const blackSwanCard = createExpertBlackSwanCard();
    msg6Bubble.appendChild(blackSwanCard);

    // Add closing text
    msg6Bubble.appendChild(document.createElement('br'));
    const msg6ClosingText = workflowTranslations['expert.message6.bot.closing'][currentLanguage];
    const closingSpan6 = document.createElement('span');
    closingSpan6.style.color = '#444444';
    closingSpan6.textContent = msg6ClosingText;
    msg6Bubble.appendChild(closingSpan6);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(2500);

    // Message 7: User
    const msg7Text = workflowTranslations['expert.message7.user'][currentLanguage];
    await typeInInputAndSend(msg7Text);
    const { bubble: bubble7 } = addMessage(msg7Text, true);
    await safeDelay(2500);

    // Message 8: Bot with execution card
    const msg8IntroText = workflowTranslations['expert.message8.bot.intro'][currentLanguage];
    const { messageDiv: msg8Div, bubble: msg8Bubble } = addMessage('', false);

    const typingIndicator8 = createTypingIndicator();
    msg8Div.insertBefore(typingIndicator8, msg8Bubble.nextSibling);
    await safeDelay(2500);
    typingIndicator8.remove();

    await typeMessage(msg8Bubble, msg8IntroText, 80);

    // Add execution card
    msg8Bubble.appendChild(document.createElement('br'));
    const executionCard = createExpertExecutionCard();
    msg8Bubble.appendChild(executionCard);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(2500);

    // Message 9: User
    const msg9Text = workflowTranslations['expert.message9.user'][currentLanguage];
    await typeInInputAndSend(msg9Text);
    const { bubble: bubble9 } = addMessage(msg9Text, true);
    await safeDelay(2500);

    // Message 10: Bot with timeline and implementation
    const msg10IntroText = workflowTranslations['expert.message10.bot.intro'][currentLanguage];
    const { messageDiv: msg10Div, bubble: msg10Bubble } = addMessage('', false);

    const typingIndicator10 = createTypingIndicator();
    msg10Div.insertBefore(typingIndicator10, msg10Bubble.nextSibling);
    await safeDelay(2500);
    typingIndicator10.remove();

    await typeMessage(msg10Bubble, msg10IntroText, 80);

    // Add timeline card
    msg10Bubble.appendChild(document.createElement('br'));
    const timelineCard = createExpertTimelineCard();
    msg10Bubble.appendChild(timelineCard);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(2500);

    // Message 11: User
    const msg11Text = workflowTranslations['expert.message11.user'][currentLanguage];
    await typeInInputAndSend(msg11Text);
    const { bubble: bubble11 } = addMessage(msg11Text, true);
    await safeDelay(2500);

    // Message 12: Bot with alpha decomposition
    const msg12IntroText = workflowTranslations['expert.message12.bot.intro'][currentLanguage];
    const { messageDiv: msg12Div, bubble: msg12Bubble } = addMessage('', false);

    const typingIndicator12 = createTypingIndicator();
    msg12Div.insertBefore(typingIndicator12, msg12Bubble.nextSibling);
    await safeDelay(2500);
    typingIndicator12.remove();

    await typeMessage(msg12Bubble, msg12IntroText, 80);

    // Add alpha card
    msg12Bubble.appendChild(document.createElement('br'));
    const alphaCard = createExpertAlphaCard();
    msg12Bubble.appendChild(alphaCard);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await safeDelay(2500);

    // Message 13: Bot closing with next steps
    const msg13IntroText = workflowTranslations['expert.message13.bot.intro'][currentLanguage];
    const { messageDiv: msg13Div, bubble: msg13Bubble } = addMessage('', false);

    const typingIndicator13 = createTypingIndicator();
    msg13Div.insertBefore(typingIndicator13, msg13Bubble.nextSibling);
    await safeDelay(2500);
    typingIndicator13.remove();

    await typeMessage(msg13Bubble, msg13IntroText, 80);

    // Add next steps card
    msg13Bubble.appendChild(document.createElement('br'));
    const nextStepsCard = createExpertNextStepsCard();
    msg13Bubble.appendChild(nextStepsCard);

    // Add closing text
    msg13Bubble.appendChild(document.createElement('br'));
    const msg13ClosingText = workflowTranslations['expert.message13.bot.closing'][currentLanguage];
    const closingSpan13 = document.createElement('span');
    closingSpan13.style.color = '#444444';
    closingSpan13.textContent = msg13ClosingText;
    msg13Bubble.appendChild(closingSpan13);

    // Add P.S.
    msg13Bubble.appendChild(document.createElement('br'));
    msg13Bubble.appendChild(document.createElement('br'));
    const psText = workflowTranslations['expert.message13.bot.ps'][currentLanguage];
    const psSpan = document.createElement('span');
    psSpan.style.color = '#888888';
    psSpan.style.fontSize = '0.85rem';
    psSpan.style.fontStyle = 'italic';
    psSpan.textContent = psText;
    msg13Bubble.appendChild(psSpan);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Mark demo as shown
    sessionStorage.setItem(DEMO_SHOWN_KEY, 'true');
  };

  // Ensure overlay hidden on load
  closeDemo();
});
