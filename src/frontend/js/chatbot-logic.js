document.addEventListener("DOMContentLoaded", () => {
  const chatInput = document.querySelector(".chat-input");
  const chatSubmit = document.querySelector(".chat-submit");
  const chatMessages = document.querySelector(".chat-messages");

  // Detect current page context for the unified chatbot
  function getPageContext() {
    const path = window.location.pathname;
    if (path.includes('pricing')) return 'pricing';
    if (path.includes('portfolio-simulator')) return 'simulator';
    return 'index'; // Default for home page
  }

  // UNIFIED STORAGE: All chatbots now share the same conversation history
  const pageContext = getPageContext();
  const storageKey = 'bubble_chat_history';

  // Load conversation history from localStorage
  let conversationHistory = [];
  function loadConversationHistory() {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        conversationHistory = JSON.parse(stored);
        // Display loaded messages
        conversationHistory.forEach(msg => {
          addMessageToChat(msg.role === 'user' ? 'user' : 'bot', msg.content, msg.role === 'user');
        });
      }
    } catch (error) {
      console.warn('Failed to load conversation history:', error);
    }
  }

  // Save conversation history to localStorage
  function saveConversationHistory() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(conversationHistory));
    } catch (error) {
      console.warn('Failed to save conversation history:', error);
    }
  }

  // Function to add a message to the chat UI and return the content element for the bot
  function addMessageToChat(sender, message, isUser) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("chat-message", sender);

    const messageContent = document.createElement("div");
    messageContent.classList.add("message-content");

    if (isUser) {
      messageContent.textContent = message;
    } else {
      // Bot message starts with a typing indicator
      messageContent.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    }

    messageElement.appendChild(messageContent);
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Return the element so we can update it with the streamed response
    return messageContent;
  }

  const handleSendMessage = async () => {
    const message = chatInput.value.trim();
    if (!message) return;

    addMessageToChat("user", message, true);
    chatInput.value = "";
    chatInput.disabled = true;
    chatSubmit.disabled = true;
    chatSubmit.classList.add('disabled');

    const botMessageContent = addMessageToChat("bot", "", false);

    // Add user message to history
    conversationHistory.push({ role: 'user', content: message });
    saveConversationHistory();

    try {
      const lang = document.documentElement.lang || 'en';

      // Prepare request body with pageContext and conversation history
      const requestBody = {
        message,
        language: lang,
        pageContext,  // Tell chatbot which page user is on
        history: conversationHistory.slice(-10) // Send last 10 messages for context
      };

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "An error occurred.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let isFirstChunk = true;
      let fullResponse = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep the last partial line in the buffer

        for (const line of lines) {
            if (line.startsWith('data:')) {
                const data = line.substring(5).trim();
                if (data === '[DONE]') {
                    return; // Stream finished
                }
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.done) {
                      break;
                    }
                    if (parsed.content) {
                        if (isFirstChunk) {
                            botMessageContent.innerHTML = ''; // Clear typing indicator
                            isFirstChunk = false;
                        }
                        fullResponse += parsed.content;
                        botMessageContent.textContent = fullResponse;
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }
                } catch (e) {
                    console.error("Error parsing stream data:", data, e);
                }
            }
        }
      }

      // Convert URLs in bot response to clickable links
      if (fullResponse) {
        const urlRegex = /(\/#waitlist|https?:\/\/[^\s)]+)/gi;
        const htmlContent = fullResponse.replace(urlRegex, (url) => {
          const href = url.startsWith('/#') ? url : url;
          return `<a href="${href}" target="${url.startsWith('/#') ? '_self' : '_blank'}" rel="noopener noreferrer" style="color: inherit; text-decoration: underline; cursor: pointer;">${url}</a>`;
        });
        botMessageContent.innerHTML = htmlContent;
      }

      // Save assistant response to history
      conversationHistory.push({ role: 'assistant', content: fullResponse });
      saveConversationHistory();

    } catch (error) {
        botMessageContent.textContent = `Error: ${error.message}`;
    } finally {
      chatInput.disabled = false;
      chatSubmit.disabled = false;
      chatSubmit.classList.remove('disabled');
      chatInput.focus();
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  };

  // Load conversation history when page loads
  loadConversationHistory();

  if (chatInput && chatSubmit) {
    chatSubmit.addEventListener("click", handleSendMessage);
    chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleSendMessage();
      }
    });
  }
});