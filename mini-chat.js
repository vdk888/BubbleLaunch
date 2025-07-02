document.addEventListener('DOMContentLoaded', () => {
  const floatingBubble = document.getElementById('floating-chat-bubble');
  const chatBubble = floatingBubble?.querySelector('.floating-bubble-inner');
  const miniChatWindow = floatingBubble?.querySelector('.mini-chat-window');
  const chatInput = floatingBubble?.querySelector('.mini-chat-input');
  const chatMessages = floatingBubble?.querySelector('.mini-chat-messages');
  const closeButton = floatingBubble?.querySelector('.mini-chat-close');
  const sendButton = floatingBubble?.querySelector('.mini-chat-send');

  if (!floatingBubble || !chatBubble || !miniChatWindow || !chatInput || !chatMessages || !closeButton || !sendButton) {
    console.warn('Mini chat elements not found');
    return;
  }

  let isChatOpen = false;
  let isProcessing = false;
  let currentAbortController = null;

  // Toggle chat window
  const toggleChat = () => {
    isChatOpen = !isChatOpen;
    floatingBubble.classList.toggle('chat-open', isChatOpen);
    
    if (isChatOpen) {
      // Focus input when opening
      setTimeout(() => {
        chatInput.focus();
      }, 300);
    }
  };

  // Add message to chat
  const addMessage = (text, isUser = false) => {
    const messageDiv = document.createElement('div');
    messageDiv.className = `mini-chat-message ${isUser ? 'user' : 'bot'}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  // Handle send message
  const sendMessage = async () => {
    const message = chatInput.value.trim();
    if (!message || isProcessing) return;

    // Add user message
    addMessage(message, true);
    chatInput.value = '';
    
    // Show typing indicator
    isProcessing = true;
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'mini-chat-message bot typing-indicator';
    typingIndicator.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    chatMessages.appendChild(typingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      // Create new AbortController for this request
      currentAbortController = new AbortController();
      
      // Call your chatbot API here
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
        signal: currentAbortController.signal
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      // Remove typing indicator
      typingIndicator.remove();
      
      // Add bot response
      if (data.reply) {
        addMessage(data.reply);
      } else {
        addMessage('I apologize, but I encountered an error processing your request.');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        typingIndicator.remove();
        addMessage('Request was cancelled.');
      } else {
        console.error('Error:', error);
        typingIndicator.remove();
        addMessage('Sorry, I encountered an error. Please try again.');
      }
    } finally {
      isProcessing = false;
      currentAbortController = null;
    }
  };

  // Event Listeners
  chatBubble.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleChat();
  });

  closeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleChat();
  });

  sendButton.addEventListener('click', sendMessage);

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (isChatOpen && !floatingBubble.contains(e.target)) {
      toggleChat();
    }
  });

  // Prevent clicks inside the chat from closing it
  miniChatWindow.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Add initial bot message
  addMessage('Hello! How can I help you today?');
});
