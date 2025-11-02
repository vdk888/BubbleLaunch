document.addEventListener("DOMContentLoaded", function () {
  const pathName = window.location.pathname;
  const isEnglishRoute =
    pathName === "/en" || pathName === "/en/" || pathName.startsWith("/en/");

  // Default language aligns with current route
  let currentLanguage = isEnglishRoute ? "en" : "fr";

  // Mobile logo scroll animation
  let lastScrollTop = 0;
  const header = document.querySelector('header');
  const scrollThreshold = 50; // Scroll threshold in pixels

  if (header) {
    window.addEventListener('scroll', function() {
      if (window.innerWidth <= 768) { // Only on mobile
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop > scrollThreshold) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }

        lastScrollTop = scrollTop;
      }
    }, { passive: true });
  }

  // Get language buttons (desktop)
  const enButton = document.getElementById("en-switch");
  const frButton = document.getElementById("fr-switch");
  
  // Get mobile language buttons
  const enButtonMobile = document.getElementById("en-switch-mobile");
  const frButtonMobile = document.getElementById("fr-switch-mobile");

  // Get all translatable elements
  const translatableElements = document.querySelectorAll("[data-translate]");
  const translatableHtmlElements = document.querySelectorAll("[data-translate-html]");

  function redirectIfNeeded(lang) {
    const { pathname, search, hash } = window.location;
    if (lang === "en") {
      if (!(pathname === "/en" || pathname === "/en/" || pathname.startsWith("/en/"))) {
        const newPath =
          pathname === "/"
            ? "/en/"
            : pathname.startsWith("/")
              ? `/en${pathname}`
              : `/en/${pathname}`;
        window.location.href = `${newPath}${search}${hash}`;
        return true;
      }
    } else if (lang === "fr") {
      if (pathname === "/en" || pathname === "/en/" || pathname.startsWith("/en/")) {
        let stripped = pathname.replace(/^\/en/, "");
        if (stripped === "") stripped = "/";
        window.location.href = `${stripped}${search}${hash}`;
        return true;
      }
    }
    return false;
  }

  // Function to update language
  function updateLanguage(lang) {
    currentLanguage = lang;

    // Update active state on desktop buttons
    if (enButton) enButton.classList.toggle("active", lang === "en");
    if (frButton) frButton.classList.toggle("active", lang === "fr");

    // Update active state on mobile buttons
    if (enButtonMobile) enButtonMobile.classList.toggle("active", lang === "en");
    if (frButtonMobile) frButtonMobile.classList.toggle("active", lang === "fr");

    // Update HTML lang attribute
    document.documentElement.lang = lang;

    // Update all translatable elements (text only)
    translatableElements.forEach((element) => {
      const key = element.getAttribute("data-translate");
      if (translations[key] && translations[key][lang]) {
        if (
          element.tagName === "INPUT" &&
          element.type === "text" &&
          key === "chat.placeholder"
        ) {
          element.placeholder = translations[key][lang];
        } else {
          // Check if translation contains HTML tags
          const translationText = translations[key][lang];
          if (translationText.includes('<') && translationText.includes('>')) {
            // Use innerHTML for HTML content
            element.innerHTML = translationText;
          } else {
            // Use textContent for plain text (safer)
            element.textContent = translationText;
          }
        }
      }
    });

    // Update all elements with data-translate-placeholder attribute
    document.querySelectorAll('[data-translate-placeholder]').forEach((element) => {
      const key = element.getAttribute("data-translate-placeholder");
      if (translations[key] && translations[key][lang]) {
        element.placeholder = translations[key][lang];
      }
    });

    // Update all translatable HTML elements (allows HTML tags)
    translatableHtmlElements.forEach((element) => {
      const key = element.getAttribute("data-translate-html");
      if (translations[key] && translations[key][lang]) {
        element.innerHTML = translations[key][lang];
      }
    });

    // Set placeholder for waitlist comments textarea based on language
    const commentsTextarea = document.querySelector('textarea#comments');
    if (commentsTextarea) {
      const placeholders = {
        fr: "L'utilisation de l'IA, la transparence des frais, le modèle de partage des richesses...",
        en: "The use of AI, fee transparency, the wealth-sharing model...",
      };
      commentsTextarea.placeholder = placeholders[lang] || placeholders["fr"];
      console.log(
        "Set placeholder to:",
        commentsTextarea.placeholder,
        "for lang:",
        lang,
      );
    }

    // Update select option translations for ALL select elements (not just profile)
    const allOptions = document.querySelectorAll(
      "option[data-translate]",
    );
    allOptions.forEach((option) => {
      const key = option.getAttribute("data-translate");
      if (translations[key] && translations[key][lang]) {
        option.textContent = translations[key][lang];
      }
    });

    // Store the language preference
    localStorage.setItem("bubbleLanguage", lang);

    // Dispatch a custom event for other modules to react to language change
    const event = new CustomEvent("languageChanged", {
      detail: { lang: lang },
    });
    document.dispatchEvent(event);
  }

  function handleLanguageSwitch(lang) {
    localStorage.setItem("bubbleLanguage", lang);
    const redirected = redirectIfNeeded(lang);
    if (!redirected) {
      updateLanguage(lang);
    }
  }

  // Set up event listeners for desktop language switches
  if (enButton) enButton.addEventListener("click", () => handleLanguageSwitch("en"));
  if (frButton) frButton.addEventListener("click", () => handleLanguageSwitch("fr"));
  
  // Set up event listeners for mobile language switches
  if (enButtonMobile) enButtonMobile.addEventListener("click", () => handleLanguageSwitch("en"));
  if (frButtonMobile) frButtonMobile.addEventListener("click", () => handleLanguageSwitch("fr"));

  // Check for stored language preference
  const storedLanguage = localStorage.getItem("bubbleLanguage");
  let initialLanguage = currentLanguage;

  if (storedLanguage && (storedLanguage === "en" || storedLanguage === "fr")) {
    if (storedLanguage === currentLanguage) {
      initialLanguage = storedLanguage;
    } else {
      // Keep the route language but remember preference for future navigations
      localStorage.setItem("bubbleLanguage", currentLanguage);
    }
  } else {
    const browserLang = navigator.language || navigator.userLanguage;
    if (!isEnglishRoute && browserLang.startsWith("en")) {
      initialLanguage = "en";
    } else if (isEnglishRoute && browserLang.startsWith("fr")) {
      initialLanguage = "en";
    } else if (browserLang.startsWith("fr")) {
      initialLanguage = "fr";
    }
    localStorage.setItem("bubbleLanguage", initialLanguage);
  }

  updateLanguage(initialLanguage);

  // Simple form submission handling
  const waitlistForm = document.getElementById("waitlist-form");
  if (waitlistForm) {
    waitlistForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const nameInput = document.getElementById("name");
      const emailInput = document.getElementById("email");
      const profileInput = document.getElementById("profile");
      const commentsInput = document.getElementById("comments");

      const formData = {
        name: nameInput.value,
        email: emailInput.value,
        profile: profileInput.value,
        comments: commentsInput.value,
      };

      fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) {
            const error = new Error(data.error || "Something went wrong");
            throw error;
          }
          return data;
        })
        .then((data) => {
          alert(data.message);
          waitlistForm.reset();
        })
        .catch((error) => {
          console.error("Error:", error);
          alert(error.message);
        });
    });
  }

  // Chat interface functionality
  const chatSection = document.querySelector(".chat-section");

  // Only initialize chat if chat section exists (not on blog pages)
  if (chatSection) {
    const chatInput = document.querySelector(".chat-input");
    const chatSubmit = document.querySelector(".chat-submit");
    const chatMessages = document.querySelector(".chat-messages");
    const chatSuggestionsContainer = document.querySelector(".chat-suggestions");
    const toggleSuggestionsBtn = document.getElementById(
      "toggle-suggestions-btn",
    );
    const fullscreenToggleBtn = document.getElementById("fullscreen-toggle-btn");
    let firstMessageSent = false;
  let isFullscreen = false;
  let stopTyping = false;
  let currentAbortController = null;

  function addMessageToChat(message, sender) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("chat-message", `${sender}-message`);

    // Format markdown-like syntax
    const formattedMessage = message
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/^- (.*)/gm, "<li>$1</li>")
      .replace(/(\r\n|\n|\r)/g, "<br>");

    // Add with a slight delay for animation effect
    setTimeout(
      () => {
        chatMessages.appendChild(messageElement);

        // If it's a bot message, animate it word by word
        if (sender === "bot") {
          messageElement.innerHTML = ''; // Clear previous content
          messageElement.textContent = ''; // Ensure no content remains
          
          const textSpan = document.createElement('span');
          messageElement.appendChild(textSpan);

          const words = formattedMessage.split(' ');
          let wordIndex = 0;

          const typeNextWord = () => {
            if (stopTyping) {
              // Re-enable inputs if generation is stopped by user
              chatInput.disabled = false;
              chatSubmit.disabled = false;
              chatSubmit.classList.remove("processing");
              chatInput.focus();
              return;
            }

            if (wordIndex < words.length) {
              if (wordIndex > 0) textSpan.innerHTML += ' ';
              
              // Handle HTML tags (like <strong>, <em>, <br>, etc.)
              if (words[wordIndex].startsWith('<') && !words[wordIndex].startsWith('<br')) {
                let tagContent = words[wordIndex];
                while (wordIndex + 1 < words.length && !words[wordIndex].includes('>')) {
                  wordIndex++;
                  tagContent += ' ' + words[wordIndex];
                }
                textSpan.innerHTML += tagContent;
              } else {
                textSpan.innerHTML += words[wordIndex];
              }

              chatMessages.scrollTop = chatMessages.scrollHeight;
              wordIndex++;
              const typingSpeed = Math.floor(Math.random() * 40) + 30;
              setTimeout(typeNextWord, typingSpeed);
            } else {
              // Typing finished, hide the button
              stopButton.classList.remove('visible');
            }
          };

          typeNextWord();
        } else {
          // For user messages, show immediately
          messageElement.innerHTML = formattedMessage;
        }

        chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to the bottom

        // Add focus effect to chat section when new message appears
        chatSection.classList.add("chat-active");
        setTimeout(() => chatSection.classList.remove("chat-active"), 1000);
      },
      sender === "bot" ? 300 : 0,
    );
  }

  function showTypingIndicator() {
    const typingIndicator = document.createElement("div");
    typingIndicator.classList.add(
      "chat-message",
      "bot-message",
      "typing-indicator",
    );
    typingIndicator.innerHTML =
      '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    chatMessages.appendChild(typingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Add subtle pulsing effect to chat section while typing
    chatSection.classList.add("chat-thinking");
  }

  function removeTypingIndicator() {
    const typingIndicator = document.querySelector(".typing-indicator");
    if (typingIndicator) {
      typingIndicator.remove();
    }
    // Remove the thinking effect
    chatSection.classList.remove("chat-thinking");
  }

  async function handleUserMessage(
    displayMessageOverride,
    promptMessageOverride,
  ) {
    // Reset stop typing flag and create new abort controller
    stopTyping = false;
    currentAbortController = new AbortController();
    
    const rawInput = chatInput.value.trim();
    const displayMessage = displayMessageOverride || rawInput;

    const datasetPrompt = chatInput.dataset.promptOverride;
    const datasetSource = chatInput.dataset.promptSource;

    let promptMessage = promptMessageOverride || displayMessage;
    if (!promptMessageOverride && datasetPrompt && datasetSource) {
      if (rawInput === datasetSource.trim()) {
        promptMessage = datasetPrompt;
      }
    }

    if (!promptMessage) return;

    if (!firstMessageSent) {
      if (chatSuggestionsContainer)
        chatSuggestionsContainer.style.display = "none";
      if (toggleSuggestionsBtn) toggleSuggestionsBtn.style.display = "block";
      firstMessageSent = true;
    }

    // Enhance chat section when user interacts
    chatSection.classList.add("chat-active");

    // Disable input while processing
    chatInput.disabled = true;
    chatSubmit.disabled = false; // Keep enabled for stop button
    chatSubmit.classList.add("processing");
    chatSubmit.setAttribute("aria-label", "Stop generation");

    // Add user message to chat first
    addMessageToChat(displayMessage, "user");
    chatInput.value = "";
    delete chatInput.dataset.promptOverride;
    delete chatInput.dataset.promptSource;
    showTypingIndicator();

    // Create a new message element for the bot's response
    // But don't append it yet - we'll do that when we get the first chunk
    const botMessageElement = document.createElement("div");
    botMessageElement.classList.add("chat-message", "bot-message");
    const botMessageContent = document.createElement("span");
    botMessageElement.appendChild(botMessageContent);
    
    // Store the abort function for the current request
    const abortController = currentAbortController;
    let isStreaming = false;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: promptMessage, 
          language: currentLanguage 
        }),
        signal: abortController.signal
      });

      if (response.status === 429) {
        throw new Error("Message limit reached");
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "An error occurred");
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botMessage = "";
      let buffer = "";
      
      // Remove typing indicator since we're showing the response
      removeTypingIndicator();
      
      // Now that we have the first chunk, append the bot message element
      chatMessages.appendChild(botMessageElement);
      isStreaming = true;
      
      // Process the stream
      while (true) {
        if (stopTyping) {
          // Abort the request when stop is clicked
          abortController.abort();
          throw new DOMException('The operation was aborted.', 'AbortError');
        }
        
        const { done, value } = await reader.read();
        if (done) break;
        
        // Decode the chunk and process each line
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Process complete SSE messages
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ""; // Keep the last incomplete line in the buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6).trim());
              
              if (data.done) {
                // End of stream
                break;
              } else if (data.error) {
                throw new Error(data.error);
              } else if (data.content) {
                // Append content to the message
                botMessage += data.content;
                botMessageContent.textContent = botMessage;
                
                // Auto-scroll to the bottom
                chatMessages.scrollTop = chatMessages.scrollHeight;
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
      
    } catch (error) {
      // Only show error if it's not an abort error (user cancellation)
      if (error.name !== 'AbortError') {
        console.error("Chat error:", error);
        
        // Only show error if we haven't started streaming yet
        if (!isStreaming) {
          if (error.message === "Message limit reached") {
            addMessageToChat(
              "You have reached the message limit for this session.",
              "bot",
            );
          } else {
            addMessageToChat("Sorry, an error occurred. Please try again.", "bot");
          }
        }
      }
      
      // Remove the partial message if it exists and was added
      if (isStreaming && botMessageElement && botMessageElement.parentNode) {
        // Only remove if it's empty or we're stopping
        if (stopTyping || botMessageContent.textContent === '') {
          botMessageElement.remove();
        }
      }
    } finally {
      // Always clean up the UI
      if (stopTyping || !chatSubmit.classList.contains("processing")) {
        chatSubmit.classList.remove("processing");
        chatSubmit.setAttribute("aria-label", "Submit question");
        chatInput.disabled = false;
        chatSubmit.disabled = false;
        currentAbortController = null;
        stopTyping = false;
        
        if (!chatInput.disabled) {
          chatInput.focus();
        }
        
        // Remove active state after a delay if not already removed
        setTimeout(() => {
          if (chatSection) {
            chatSection.classList.remove("chat-active");
          }
        }, 1000);
      }
    }
  }

  const applySuggestionButton = (button) => {
    if (!chatInput || !button) return;

    const displayMessage =
      (button.getAttribute("data-display") || button.textContent || "").trim();
    if (!displayMessage) return;

    const translateKey = button.getAttribute("data-translate");
    const promptFallback =
      button.getAttribute("data-prompt") || button.dataset.prompt || "";
    let promptMessage = promptFallback;

    if (!promptMessage && typeof translations !== "undefined" && translateKey) {
      const translationEntry = translations[translateKey];
      if (translationEntry) {
        promptMessage =
          translationEntry["en"] ||
          translationEntry["fr"] ||
          translationEntry["en_us"] ||
          "";
      }
    }

    if (!promptMessage) {
      promptMessage = displayMessage;
    }

    button.classList.add("active");
    setTimeout(() => button.classList.remove("active"), 300);

    chatInput.value = displayMessage;
    chatInput.dataset.promptOverride = promptMessage;
    chatInput.dataset.promptSource = displayMessage;
    chatInput.focus();
    chatInput.setSelectionRange(
      chatInput.value.length,
      chatInput.value.length,
    );
  };

  const suggestionButtons = document.querySelectorAll(".chat-suggestion-btn");
  suggestionButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      applySuggestionButton(button);
    });
  });

  if (chatSection) {
    chatSection.addEventListener("click", (event) => {
      const targetButton = event.target.closest(".chat-suggestion-btn");
      if (!targetButton) return;
      event.preventDefault();
      applySuggestionButton(targetButton);
    });
  }

  chatSubmit.addEventListener("click", () => {
    // Add click effect
    chatSubmit.classList.add("clicked");
    setTimeout(() => chatSubmit.classList.remove("clicked"), 300);

    // Check if we're currently processing (showing stop button)
    if (chatSubmit.classList.contains("processing")) {
      // Stop the current generation
      stopTyping = true;
      if (currentAbortController) {
        currentAbortController.abort();
        currentAbortController = null;
      }
    } else {
      // Handle new message
      handleUserMessage();
    }
  });

  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Trigger the click event on the submit button to handle both submit and stop cases
      chatSubmit.click();
    }
  });

  chatInput.addEventListener("input", () => {
    const source = chatInput.dataset.promptSource;
    if (!source) return;
    if (chatInput.value.trim() !== source.trim()) {
      delete chatInput.dataset.promptOverride;
      delete chatInput.dataset.promptSource;
    }
  });

  // Add focus effect when clicking on the chat input
  chatInput.addEventListener("focus", () => {
    chatSection.classList.add("chat-focus");
  });

  chatInput.addEventListener("blur", () => {
    chatSection.classList.remove("chat-focus");
  });

  // Welcome message is now in HTML, no need to add it dynamically

  if (toggleSuggestionsBtn) {
    toggleSuggestionsBtn.addEventListener("click", () => {
      if (chatSuggestionsContainer) {
        const isHidden = chatSuggestionsContainer.style.display === "none";
        chatSuggestionsContainer.style.display = isHidden ? "flex" : "none"; // Assuming suggestions use flex display
        // Update button text if needed (e.g., Show/Hide Suggestions)
        // toggleSuggestionsBtn.textContent = isHidden ? (translations['chat.hideSuggestions']?.[currentLanguage] || 'Hide Suggestions') : (translations['chat.showSuggestions']?.[currentLanguage] || 'Show Suggestions');
      }
    });
  }

  // Fullscreen toggle functionality for mobile
  if (fullscreenToggleBtn) {
    // Initially hide the fullscreen button on desktop
    if (window.innerWidth > 768) {
      fullscreenToggleBtn.style.display = "none";
    }

    // Show fullscreen button when user interacts with chat on mobile
    const showFullscreenButton = () => {
      if (window.innerWidth <= 768) {
        fullscreenToggleBtn.style.display = "flex";
      }
    };

    // Event listeners to show the fullscreen button
    chatInput.addEventListener("focus", showFullscreenButton);
    chatInput.addEventListener("click", showFullscreenButton);
    chatSection.addEventListener("click", showFullscreenButton);

    // Toggle fullscreen mode
    fullscreenToggleBtn.addEventListener("click", () => {
      isFullscreen = !isFullscreen;
      chatSection.classList.toggle("fullscreen", isFullscreen);

      // CSS will handle icon switching based on .fullscreen class
      // No need to manually update innerHTML

      // Scroll chat messages to bottom when toggling fullscreen
      setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 300);
    });

    // Also make chat fullscreen when user starts interacting with it
    chatInput.addEventListener("focus", () => {
      if (window.innerWidth <= 768 && !isFullscreen) {
        isFullscreen = true;
        chatSection.classList.add("fullscreen");

        // CSS will handle icon switching based on .fullscreen class

        // Scroll to bottom of chat section with focus on input
        setTimeout(() => {
          chatMessages.scrollTop = chatMessages.scrollHeight;
          chatInput.focus();
        }, 300);
      }
    });

    // Function to ensure chat input is visible at the bottom of the screen
    const scrollChatToBottom = () => {
      if (isFullscreen) {
        const chatInputContainer = document.querySelector(
          ".chat-input-container",
        );
        if (chatInputContainer) {
          chatInputContainer.scrollIntoView({
            behavior: "smooth",
            block: "end",
          });
        }
      }
    };

    // Call scrollChatToBottom when entering fullscreen mode
    fullscreenToggleBtn.addEventListener("click", scrollChatToBottom);
  }
  } // End of if (chatSection) block

  // Welcome message updates automatically via data-translate attribute

  // Mobile Navigation Hamburger Menu
  const hamburgerMenu = document.getElementById('hamburger-menu');
  const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
  const body = document.body;

  console.log('Hamburger menu setup:', { hamburgerMenu: !!hamburgerMenu, mobileNavOverlay: !!mobileNavOverlay });

  if (hamburgerMenu && mobileNavOverlay) {
    // Toggle mobile menu
    function toggleMobileMenu() {
      console.log('toggleMobileMenu called');
      const isActive = hamburgerMenu.classList.contains('active');

      hamburgerMenu.classList.toggle('active');
      mobileNavOverlay.classList.toggle('active');

      // Prevent body scroll when menu is open
      if (!isActive) {
        // Store current scroll position to restore later
        const scrollY = window.scrollY;
        body.classList.add('mobile-menu-open');
        body.style.top = `-${scrollY}px`;
      } else {
        // Restore scroll position
        const scrollY = body.style.top;
        body.classList.remove('mobile-menu-open');
        body.style.top = '';
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    // Hamburger menu click event (both click and touch for better mobile support)
    hamburgerMenu.addEventListener('click', toggleMobileMenu);
    hamburgerMenu.addEventListener('touchend', function(e) {
      e.preventDefault();
      toggleMobileMenu();
    });

    // Mobile dropdown accordion functionality
    const mobileDropdownToggle = document.querySelector('.mobile-nav-dropdown-toggle');
    const mobileDropdownMenu = document.querySelector('.mobile-nav-dropdown-menu');

    if (mobileDropdownToggle && mobileDropdownMenu) {
      mobileDropdownToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        // Toggle active class
        mobileDropdownToggle.classList.toggle('active');
        mobileDropdownMenu.classList.toggle('active');
      });

      // Close dropdown when clicking on a sub-link
      const mobileDropdownLinks = mobileDropdownMenu.querySelectorAll('a');
      mobileDropdownLinks.forEach(link => {
        link.addEventListener('click', function() {
          // Close the dropdown
          mobileDropdownToggle.classList.remove('active');
          mobileDropdownMenu.classList.remove('active');

          // Then close the mobile menu
          if (hamburgerMenu.classList.contains('active')) {
            toggleMobileMenu();
          }
        });
      });
    }

    // Close menu when clicking on overlay (outside nav)
    mobileNavOverlay.addEventListener('click', function(e) {
      if (e.target === mobileNavOverlay) {
        toggleMobileMenu();
      }
    });

    // Close menu when clicking any navigation link (except dropdown toggles)
    const mobileNavLinks = mobileNavOverlay.querySelectorAll('.mobile-nav > a:not(.mobile-nav-dropdown-toggle)');
    mobileNavLinks.forEach(link => {
      link.addEventListener('click', function() {
        if (hamburgerMenu.classList.contains('active')) {
          toggleMobileMenu();
        }
      });
    });

    // Close menu on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && hamburgerMenu.classList.contains('active')) {
        toggleMobileMenu();
      }
    });

    // Close menu on window resize (if screen becomes large desktop size)
    let resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        if (window.innerWidth >= 1025 && hamburgerMenu.classList.contains('active')) {
          hamburgerMenu.classList.remove('active');
          mobileNavOverlay.classList.remove('active');
          // Restore scroll position
          const scrollY = body.style.top;
          body.classList.remove('mobile-menu-open');
          body.style.top = '';
          if (scrollY) {
            window.scrollTo(0, parseInt(scrollY) * -1);
          }
        }
      }, 100);
    });
  }

});
