/**
 * Pricing Workflow Demo - Interactive Animated Chat
 * Showcases the Japanese Stocks workflow with input field typing, portfolio visualization, and enriched content
 */

document.addEventListener('DOMContentLoaded', () => {
  const DEMO_SHOWN_KEY = 'bubble_workflow_demo_shown';
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

  // Update language display buttons
  const updateLanguageButtons = () => {
    if (frDemoSwitch) {
      frDemoSwitch.classList.toggle('active', currentLanguage === 'fr');
      enDemoSwitch.classList.toggle('active', currentLanguage === 'en');
    }
  };

  updateLanguageButtons();

  // Auto-resize textarea as content grows
  const autoResizeTextarea = () => {
    if (!inputField) return;
    inputField.style.height = 'auto';
    inputField.style.height = Math.min(inputField.scrollHeight, 120) + 'px';
  };

  // Type in input field, animate send button, then show message as user
  const typeInInputAndSend = async (text) => {
    if (!inputField || !sendButton) return;

    // Type character by character in textarea
    inputField.value = '';
    autoResizeTextarea();

    for (let i = 0; i < text.length; i++) {
      inputField.value += text.charAt(i);
      autoResizeTextarea(); // Resize as text is added
      await new Promise(resolve => setTimeout(resolve, 60));
    }

    // Wait briefly
    await new Promise(resolve => setTimeout(resolve, 300));

    // Animate send button
    sendButton.classList.add('sending');
    await new Promise(resolve => setTimeout(resolve, 400));
    sendButton.classList.remove('sending');

    // Clear input and reset height
    inputField.value = '';
    autoResizeTextarea();

    // Small delay before message appears
    await new Promise(resolve => setTimeout(resolve, 200));
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
      let index = 0;
      element.textContent = '';
      const cursor = document.createElement('span');
      cursor.className = 'typing-cursor';
      element.appendChild(cursor);

      const typeNextChar = () => {
        if (index < text.length) {
          element.insertBefore(document.createTextNode(text.charAt(index)), cursor);
          index++;
          setTimeout(typeNextChar, speed);
        } else {
          cursor.remove();
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
    messageDiv.appendChild(bubble);

    if (enrichedContent) {
      messageDiv.appendChild(enrichedContent);
    }

    messagesContainer.appendChild(messageDiv);

    // Auto-scroll to bottom
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 50);

    return { messageDiv, bubble };
  };

  // Create enriched research content (inline, not separate card)
  const createResearchContent = () => {
    const container = document.createElement('div');

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = translations['workflow.message2.bot.research'][currentLanguage];
    container.appendChild(header);

    const stocks = translations['workflow.message2.bot.stocks'];
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
    header.textContent = translations['workflow.message4.bot.header'][currentLanguage];
    card.appendChild(header);

    const strategy = document.createElement('div');
    strategy.style.fontWeight = '600';
    strategy.style.color = '#667eea';
    strategy.style.marginTop = '0.8rem';
    strategy.textContent = translations['workflow.message4.bot.strategy'][currentLanguage];
    card.appendChild(strategy);

    const details = document.createElement('div');
    details.style.fontSize = '0.85rem';
    details.style.color = '#444444';
    details.style.marginTop = '0.6rem';
    details.style.lineHeight = '1.6';
    details.textContent = translations['workflow.message4.bot.details'][currentLanguage];
    card.appendChild(details);

    const metricsHeader = document.createElement('div');
    metricsHeader.style.fontWeight = '600';
    metricsHeader.style.color = '#333333';
    metricsHeader.style.marginTop = '1rem';
    metricsHeader.textContent = translations['workflow.message4.bot.metrics_header'][currentLanguage];
    card.appendChild(metricsHeader);

    const metricsData = translations['workflow.message4.bot.metrics'];
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
    header.innerHTML = '✓ ' + translations['workflow.message6.bot.summary_header'][currentLanguage];
    card.appendChild(header);

    const summary = translations['workflow.message6.bot.summary'];
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
    header.textContent = translations['workflow.message9.bot.portfolio_header'][currentLanguage];
    card.appendChild(header);

    const allocHeader = document.createElement('div');
    allocHeader.style.fontSize = '0.85rem';
    allocHeader.style.fontWeight = '600';
    allocHeader.style.color = '#333333';
    allocHeader.style.marginTop = '0.8rem';
    allocHeader.style.marginBottom = '0.8rem';
    allocHeader.textContent = translations['workflow.message9.bot.allocations'][currentLanguage];
    card.appendChild(allocHeader);

    const chartContainer = document.createElement('div');
    chartContainer.className = 'workflow-demo-bar-chart';

    const portfolioData = translations['workflow.message9.bot.portfolio_items'];

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
        badge.textContent = translations['workflow.message9.bot.new_pocket'][currentLanguage];
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

  // Main demo sequence
  const runDemo = async () => {
    messagesContainer.innerHTML = '';

    // Message 1: User
    const msg1Text = translations['workflow.message1.user'][currentLanguage];
    await typeInInputAndSend(msg1Text);
    const { bubble: bubble1 } = addMessage(msg1Text, true);
    bubble1.textContent = msg1Text;
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Message 2: Bot with research (all in one bubble)
    const msg2IntroText = translations['workflow.message2.bot.intro'][currentLanguage];
    const { messageDiv: msg2Div, bubble: msg2Bubble } = addMessage('', false);

    const typingIndicator = createTypingIndicator();
    msg2Div.insertBefore(typingIndicator, msg2Bubble.nextSibling);
    await new Promise(resolve => setTimeout(resolve, 1500));
    typingIndicator.remove();

    // Type intro text
    await typeMessage(msg2Bubble, msg2IntroText, 50);

    // Add line break and research content
    msg2Bubble.appendChild(document.createElement('br'));
    const researchContent = createResearchContent();
    msg2Bubble.appendChild(researchContent);

    // Add closing text
    msg2Bubble.appendChild(document.createElement('br'));
    const msg2ClosingText = translations['workflow.message2.bot.closing'][currentLanguage];
    const closingSpan = document.createElement('span');
    closingSpan.style.color = '#444444';
    closingSpan.textContent = msg2ClosingText;
    msg2Bubble.appendChild(closingSpan);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Message 3: User
    const msg3Text = translations['workflow.message3.user'][currentLanguage];
    await typeInInputAndSend(msg3Text);
    const { bubble: bubble3 } = addMessage(msg3Text, true);
    bubble3.textContent = msg3Text;
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Message 4: Bot with backtest (all in one bubble)
    const msg4IntroText = translations['workflow.message4.bot.intro'][currentLanguage];
    const { messageDiv: msg4Div, bubble: msg4Bubble } = addMessage('', false);

    const typingIndicator2 = createTypingIndicator();
    msg4Div.insertBefore(typingIndicator2, msg4Bubble.nextSibling);
    await new Promise(resolve => setTimeout(resolve, 1500));
    typingIndicator2.remove();

    await typeMessage(msg4Bubble, msg4IntroText, 50);

    // Add line break and backtest content
    msg4Bubble.appendChild(document.createElement('br'));
    const backtestContent = createBacktestCard();
    msg4Bubble.appendChild(backtestContent);

    // Add conclusion text
    msg4Bubble.appendChild(document.createElement('br'));
    const msg4ConclusionText = translations['workflow.message4.bot.conclusion'][currentLanguage];
    const conclusionSpan = document.createElement('span');
    conclusionSpan.style.color = '#444444';
    conclusionSpan.textContent = msg4ConclusionText;
    msg4Bubble.appendChild(conclusionSpan);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Message 5: User
    const msg5Text = translations['workflow.message5.user'][currentLanguage];
    await typeInInputAndSend(msg5Text);
    const { bubble: bubble5 } = addMessage(msg5Text, true);
    bubble5.textContent = msg5Text;
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Message 6: Bot with summary (all in one bubble)
    const msg6ConfirmText = translations['workflow.message6.bot.confirmation'][currentLanguage];
    const { messageDiv: msg6Div, bubble: msg6Bubble } = addMessage('', false);

    const typingIndicator3 = createTypingIndicator();
    msg6Div.insertBefore(typingIndicator3, msg6Bubble.nextSibling);
    await new Promise(resolve => setTimeout(resolve, 1500));
    typingIndicator3.remove();

    await typeMessage(msg6Bubble, msg6ConfirmText, 50);

    // Add line break and summary content
    msg6Bubble.appendChild(document.createElement('br'));
    const summaryCard = createSummaryCard();
    msg6Bubble.appendChild(summaryCard);

    // Add closing text
    msg6Bubble.appendChild(document.createElement('br'));
    const msg6ClosingText = translations['workflow.message6.bot.closing'][currentLanguage];
    const msg6ClosingSpan = document.createElement('span');
    msg6ClosingSpan.style.color = '#444444';
    msg6ClosingSpan.textContent = msg6ClosingText;
    msg6Bubble.appendChild(msg6ClosingSpan);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Message 7: System message (Time transition)
    const timeTransition = translations['workflow.message7.system'][currentLanguage];
    addSystemMessage(timeTransition);
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Message 8: User
    const msg8Text = translations['workflow.message8.user'][currentLanguage];
    await typeInInputAndSend(msg8Text);
    const { bubble: bubble8 } = addMessage(msg8Text, true);
    bubble8.textContent = msg8Text;
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Message 9: Bubble with portfolio bar chart (all in one bubble)
    const msg9CelebrationText = translations['workflow.message9.bot.celebration'][currentLanguage];
    const { messageDiv: msg9Div, bubble: msg9Bubble } = addMessage('', false);

    const typingIndicator4 = createTypingIndicator();
    msg9Div.insertBefore(typingIndicator4, msg9Bubble.nextSibling);
    await new Promise(resolve => setTimeout(resolve, 1500));
    typingIndicator4.remove();

    await typeMessage(msg9Bubble, msg9CelebrationText, 50);

    // Add line break and portfolio chart
    msg9Bubble.appendChild(document.createElement('br'));
    const portfolioBarChart = createPortfolioBarChart();
    msg9Bubble.appendChild(portfolioBarChart);

    // Add closing text
    msg9Bubble.appendChild(document.createElement('br'));
    const msg9ClosingText = translations['workflow.message9.bot.closing'][currentLanguage];
    const msg9ClosingSpan = document.createElement('span');
    msg9ClosingSpan.style.color = '#444444';
    msg9ClosingSpan.textContent = msg9ClosingText;
    msg9Bubble.appendChild(msg9ClosingSpan);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Message 10: User thanks
    const msg10Text = translations['workflow.message10.user'][currentLanguage];
    await typeInInputAndSend(msg10Text);
    const { bubble: bubble10 } = addMessage(msg10Text, true);
    bubble10.textContent = msg10Text;
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Message 11: Bubble closing
    const msg11Text = translations['workflow.message11.bot'][currentLanguage];
    const { messageDiv: msg11Div } = addMessage('', false);
    const msg11Bubble = msg11Div.querySelector('.workflow-demo-message-bubble');

    const typingIndicator5 = createTypingIndicator();
    msg11Div.appendChild(typingIndicator5);
    await new Promise(resolve => setTimeout(resolve, 1500));
    typingIndicator5.remove();

    await typeMessage(msg11Bubble, msg11Text, 50);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Mark demo as shown
    sessionStorage.setItem(DEMO_SHOWN_KEY, 'true');
  };

  // Close demo and show pricing
  const closeDemo = () => {
    overlay.classList.add('hidden');
    if (pricingContent) {
      pricingContent.classList.remove('hidden');
    }
  };

  // Event listeners
  closeBtn.addEventListener('click', closeDemo);

  // Keyboard support
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
      closeDemo();
    }
  });

  // Language switching
  if (frDemoSwitch) {
    frDemoSwitch.addEventListener('click', () => {
      currentLanguage = 'fr';
      updateLanguageButtons();
      runDemo();
    });
  }

  if (enDemoSwitch) {
    enDemoSwitch.addEventListener('click', () => {
      currentLanguage = 'en';
      updateLanguageButtons();
      runDemo();
    });
  }

  // Replay button
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      overlay.classList.remove('hidden');
      if (pricingContent) {
        pricingContent.classList.add('hidden');
      }
      runDemo();
    });
  }

  // Auto-play on page load if not shown before
  if (!sessionStorage.getItem(DEMO_SHOWN_KEY)) {
    runDemo();
  } else {
    // Skip demo, show pricing directly
    closeDemo();
  }
});
