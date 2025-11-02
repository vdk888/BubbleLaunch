/**
 * Pricing Workflow Demo - Interactive Animated Chat
 * Showcases the Japanese Stocks workflow with typing animations and enriched content
 */

document.addEventListener('DOMContentLoaded', () => {
  const DEMO_SHOWN_KEY = 'bubble_workflow_demo_shown';
  const overlay = document.getElementById('workflow-demo-overlay');
  const closeBtn = document.getElementById('workflow-demo-close');
  const messagesContainer = document.getElementById('workflow-demo-messages');
  const pricingContent = document.getElementById('pricing-content');
  const replayBtn = document.getElementById('replay-demo');

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

  // Typing animation function
  const typeMessage = (element, text, speed = 40) => {
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

  // Create enriched research card
  const createResearchCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = translations['workflow.message2.bot.research'][currentLanguage];
    card.appendChild(header);

    const stocks = translations['workflow.message2.bot.stocks'];
    const list = document.createElement('div');
    list.className = 'workflow-demo-research-list';

    stocks.forEach(stock => {
      const item = document.createElement('div');
      item.className = 'workflow-demo-research-item';
      item.textContent = `${stock.name} (${stock.ticker})`;
      list.appendChild(item);
    });

    card.appendChild(list);
    return card;
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

  // Create portfolio breakdown card
  const createPortfolioCard = () => {
    const card = document.createElement('div');
    card.className = 'workflow-demo-enriched-card';

    const header = document.createElement('div');
    header.className = 'workflow-demo-enriched-header';
    header.textContent = translations['workflow.message8.bot.portfolio_header'][currentLanguage];
    card.appendChild(header);

    const allocHeader = document.createElement('div');
    allocHeader.style.fontSize = '0.85rem';
    allocHeader.style.fontWeight = '600';
    allocHeader.style.color = '#333333';
    allocHeader.style.marginBottom = '0.8rem';
    allocHeader.textContent = translations['workflow.message8.bot.allocations'][currentLanguage];
    card.appendChild(allocHeader);

    const portfolioData = translations['workflow.message8.bot.portfolio_items'];
    portfolioData.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.className = item.highlight ? 'workflow-demo-portfolio-item highlight' : 'workflow-demo-portfolio-item';

      const label = document.createElement('span');
      label.className = 'workflow-demo-portfolio-label';
      label.textContent = `${item.flag} ${item.name[currentLanguage]}`;
      if (item.new) {
        label.textContent += ` (${translations['workflow.message8.bot.new_pocket'][currentLanguage]})`;
      }

      const percentage = document.createElement('span');
      percentage.className = 'workflow-demo-portfolio-percentage';
      percentage.textContent = item.percentage;

      itemDiv.appendChild(label);
      itemDiv.appendChild(percentage);
      card.appendChild(itemDiv);
    });

    return card;
  };

  // Main demo sequence
  const runDemo = async () => {
    messagesContainer.innerHTML = '';

    // Message 1: User
    const msg1Text = translations['workflow.message1.user'][currentLanguage];
    const { bubble: bubble1 } = addMessage(msg1Text, true);
    await typeMessage(bubble1, msg1Text, 40);
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Message 2: Bot with research
    const msg2IntroText = translations['workflow.message2.bot.intro'][currentLanguage];
    const { messageDiv: msg2Div } = addMessage('', false);
    const msg2Bubble = msg2Div.querySelector('.workflow-demo-message-bubble');

    // Show typing indicator
    const typingIndicator = createTypingIndicator();
    msg2Div.appendChild(typingIndicator);
    await new Promise(resolve => setTimeout(resolve, 1500));
    typingIndicator.remove();

    // Type main text
    await typeMessage(msg2Bubble, msg2IntroText, 30);

    // Add research card
    const researchCard = createResearchCard();
    msg2Div.appendChild(researchCard);

    // Add closing text
    const msg2ClosingText = translations['workflow.message2.bot.closing'][currentLanguage];
    const closingP = document.createElement('p');
    closingP.style.marginTop = '1rem';
    closingP.style.color = '#444444';
    closingP.style.fontSize = '0.95rem';
    closingP.textContent = msg2ClosingText;
    msg2Div.appendChild(closingP);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Message 3: User
    const msg3Text = translations['workflow.message3.user'][currentLanguage];
    const { bubble: bubble3 } = addMessage(msg3Text, true);
    await typeMessage(bubble3, msg3Text, 40);
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Message 4: Bot with backtest
    const msg4IntroText = translations['workflow.message4.bot.intro'][currentLanguage];
    const { messageDiv: msg4Div } = addMessage('', false);
    const msg4Bubble = msg4Div.querySelector('.workflow-demo-message-bubble');

    const typingIndicator2 = createTypingIndicator();
    msg4Div.appendChild(typingIndicator2);
    await new Promise(resolve => setTimeout(resolve, 1500));
    typingIndicator2.remove();

    await typeMessage(msg4Bubble, msg4IntroText, 30);

    const backTestCard = createBacktestCard();
    msg4Div.appendChild(backTestCard);

    const msg4ConclusionText = translations['workflow.message4.bot.conclusion'][currentLanguage];
    const conclusionP = document.createElement('p');
    conclusionP.style.marginTop = '1rem';
    conclusionP.style.color = '#444444';
    conclusionP.style.fontSize = '0.95rem';
    conclusionP.textContent = msg4ConclusionText;
    msg4Div.appendChild(conclusionP);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Message 5: User
    const msg5Text = translations['workflow.message5.user'][currentLanguage];
    const { bubble: bubble5 } = addMessage(msg5Text, true);
    await typeMessage(bubble5, msg5Text, 40);
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Message 6: Bot with summary
    const msg6ConfirmText = translations['workflow.message6.bot.confirmation'][currentLanguage];
    const { messageDiv: msg6Div } = addMessage('', false);
    const msg6Bubble = msg6Div.querySelector('.workflow-demo-message-bubble');

    const typingIndicator3 = createTypingIndicator();
    msg6Div.appendChild(typingIndicator3);
    await new Promise(resolve => setTimeout(resolve, 1500));
    typingIndicator3.remove();

    await typeMessage(msg6Bubble, msg6ConfirmText, 30);

    const summaryCard = createSummaryCard();
    msg6Div.appendChild(summaryCard);

    const msg6ClosingText = translations['workflow.message6.bot.closing'][currentLanguage];
    const msg6ClosingP = document.createElement('p');
    msg6ClosingP.style.marginTop = '1rem';
    msg6ClosingP.style.color = '#444444';
    msg6ClosingP.style.fontSize = '0.95rem';
    msg6ClosingP.textContent = msg6ClosingText;
    msg6Div.appendChild(msg6ClosingP);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Message 7: User
    const msg7Text = translations['workflow.message7.user'][currentLanguage];
    const { bubble: bubble7 } = addMessage(msg7Text, true);
    await typeMessage(bubble7, msg7Text, 40);
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Message 8: Bot with portfolio
    const msg8CelebrationText = translations['workflow.message8.bot.celebration'][currentLanguage];
    const { messageDiv: msg8Div } = addMessage('', false);
    const msg8Bubble = msg8Div.querySelector('.workflow-demo-message-bubble');

    const typingIndicator4 = createTypingIndicator();
    msg8Div.appendChild(typingIndicator4);
    await new Promise(resolve => setTimeout(resolve, 1500));
    typingIndicator4.remove();

    await typeMessage(msg8Bubble, msg8CelebrationText, 30);

    const portfolioCard = createPortfolioCard();
    msg8Div.appendChild(portfolioCard);

    const msg8ClosingText = translations['workflow.message8.bot.closing'][currentLanguage];
    const msg8ClosingP = document.createElement('p');
    msg8ClosingP.style.marginTop = '1rem';
    msg8ClosingP.style.color = '#444444';
    msg8ClosingP.style.fontSize = '0.95rem';
    msg8ClosingP.textContent = msg8ClosingText;
    msg8Div.appendChild(msg8ClosingP);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Mark demo as shown
    sessionStorage.setItem(DEMO_SHOWN_KEY, 'true');
  };

  // Close demo and show pricing
  const closeDemo = () => {
    overlay.classList.add('hidden');
    pricingContent.classList.remove('hidden');
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
      pricingContent.classList.add('hidden');
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
