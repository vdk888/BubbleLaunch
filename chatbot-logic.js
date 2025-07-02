document.addEventListener("DOMContentLoaded", () => {
  const chatInput = document.querySelector(".chat-input");
  const chatSubmit = document.querySelector(".chat-submit");
  const chatMessages = document.querySelector(".chat-messages");

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

    try {
      const lang = document.documentElement.lang || 'en';
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, language: lang }),
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

  if (chatInput && chatSubmit) {
    chatSubmit.addEventListener("click", handleSendMessage);
    chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleSendMessage();
      }
    });
  }
});