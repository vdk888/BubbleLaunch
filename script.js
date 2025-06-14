document.addEventListener('DOMContentLoaded', function() {
    // Default language
    let currentLanguage = 'en';

    // Get language buttons
    const enButton = document.getElementById('en-switch');
    const frButton = document.getElementById('fr-switch');

    // Get all translatable elements
    const translatableElements = document.querySelectorAll('[data-translate]');

    // Function to update language
    function updateLanguage(lang) {
        currentLanguage = lang;

        // Update active state on buttons
        enButton.classList.toggle('active', lang === 'en');
        frButton.classList.toggle('active', lang === 'fr');

        // Update HTML lang attribute
        document.documentElement.lang = lang;

        // Update all translatable elements
        translatableElements.forEach(element => {
            const key = element.getAttribute('data-translate');
            if (translations[key] && translations[key][lang]) {
                if (element.tagName === 'INPUT' && element.type === 'text' && key === 'chat.placeholder') {
                    element.placeholder = translations[key][lang];
                } else {
                    element.textContent = translations[key][lang];
                }
            }
        });

        // Set placeholder for waitlist comments textarea based on language
        const commentsTextarea = document.querySelector('textarea#comments[data-translate="waitlist.form.comments"]');
        if (commentsTextarea) {
            const placeholders = {
                fr: "L'utilisation de l'IA, la transparence des frais, le modèle de partage des richesses...",
                en: "The use of AI, fee transparency, the wealth-sharing model..."
            };
            commentsTextarea.placeholder = placeholders[lang] || placeholders['fr'];
            console.log('Set placeholder to:', commentsTextarea.placeholder, 'for lang:', lang);
        }

        // Update select option translations for profile selector
        const profileOptions = document.querySelectorAll('#profile option[data-translate]');
        profileOptions.forEach(option => {
            const key = option.getAttribute('data-translate');
            if (translations[key] && translations[key][lang]) {
                option.textContent = translations[key][lang];
            }
        });

        // Store the language preference
        localStorage.setItem('bubbleLanguage', lang);
    }

    // Set up event listeners for language switches
    enButton.addEventListener('click', () => updateLanguage('en'));
    frButton.addEventListener('click', () => updateLanguage('fr'));

    // Check for stored language preference
    const storedLanguage = localStorage.getItem('bubbleLanguage');
    if (storedLanguage && (storedLanguage === 'en' || storedLanguage === 'fr')) {
        updateLanguage(storedLanguage);
    } else {
        // Try to detect browser language
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang.startsWith('fr')) {
            updateLanguage('fr');
        } else {
            updateLanguage('en');
        }
    }

    // Simple form submission handling
    const waitlistForm = document.getElementById('waitlist-form');
    if (waitlistForm) {
        waitlistForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const profileInput = document.getElementById('profile');
            const commentsInput = document.getElementById('comments');

            const formData = {
                name: nameInput.value,
                email: emailInput.value,
                profile: profileInput.value,
                comments: commentsInput.value
            };

            fetch('/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })
            .then(async response => {
                const data = await response.json();
                if (!response.ok) {
                    const error = new Error(data.error || 'Something went wrong');
                    throw error;
                }
                return data;
            })
            .then(data => {
                alert(data.message);
                waitlistForm.reset();
            })
            .catch(error => {
                console.error('Error:', error);
                alert(error.message);
            });
        });
    }

    // Chat interface functionality
    const chatInput = document.querySelector('.chat-input');
    const chatSubmit = document.querySelector('.chat-submit');
    const suggestionButtons = document.querySelectorAll('.chat-suggestion-btn');
    const chatMessages = document.querySelector('.chat-messages');
    const chatSuggestionsContainer = document.querySelector('.chat-suggestions');
    const toggleSuggestionsBtn = document.getElementById('toggle-suggestions-btn');
    const chatSection = document.querySelector('.chat-section');
    const fullscreenToggleBtn = document.getElementById('fullscreen-toggle-btn');
    let firstMessageSent = false;
    let isFullscreen = false;

    function addMessageToChat(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', `${sender}-message`);
        
        // Format markdown-like syntax
        const formattedMessage = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                        .replace(/^- (.*)/gm, '<li>$1</li>')
                                        .replace(/(\r\n|\n|\r)/g, '<br>');
        
        // Add with a slight delay for animation effect
        setTimeout(() => {
            chatMessages.appendChild(messageElement);
            
            // If it's a bot message, animate it word by word
            if (sender === 'bot') {
                // Create a container for the animated text
                messageElement.innerHTML = '';
                const words = formattedMessage.split(' ');
                let wordIndex = 0;
                
                // Function to add words one by one
                const typeNextWord = () => {
                    if (wordIndex < words.length) {
                        // Add the next word with a space
                        if (wordIndex > 0) {
                            messageElement.innerHTML += ' ';
                        }
                        
                        // Handle HTML tags (like <strong>, <em>, <br>, etc.)
                        if (words[wordIndex].startsWith('<') && !words[wordIndex].startsWith('<br')) {
                            // For HTML tags, add them immediately without animation
                            let tagContent = words[wordIndex];
                            while (wordIndex + 1 < words.length && !words[wordIndex].includes('>')) {
                                wordIndex++;
                                tagContent += ' ' + words[wordIndex];
                            }
                            messageElement.innerHTML += tagContent;
                        } else {
                            messageElement.innerHTML += words[wordIndex];
                        }
                        
                        // Scroll to the bottom as words are added
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                        
                        wordIndex++;
                        // Random typing speed between 30-70ms for natural effect
                        const typingSpeed = Math.floor(Math.random() * 40) + 30;
                        setTimeout(typeNextWord, typingSpeed);
                    }
                };
                
                // Start the typing animation
                typeNextWord();
            } else {
                // For user messages, show immediately
                messageElement.innerHTML = formattedMessage;
            }
            
            chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to the bottom
            
            // Add focus effect to chat section when new message appears
            chatSection.classList.add('chat-active');
            setTimeout(() => chatSection.classList.remove('chat-active'), 1000);
        }, sender === 'bot' ? 300 : 0);
    }

    function showTypingIndicator() {
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('chat-message', 'bot-message', 'typing-indicator');
        typingIndicator.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Add subtle pulsing effect to chat section while typing
        chatSection.classList.add('chat-thinking');
    }

    function removeTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        // Remove the thinking effect
        chatSection.classList.remove('chat-thinking');
    }

    async function handleUserMessage(displayMessageOverride, promptMessageOverride) {
        const displayMessage = displayMessageOverride || chatInput.value.trim();
        const promptMessage = promptMessageOverride || displayMessage;

        if (!promptMessage) return;

        if (!firstMessageSent) {
            if (chatSuggestionsContainer) chatSuggestionsContainer.style.display = 'none';
            if (toggleSuggestionsBtn) toggleSuggestionsBtn.style.display = 'block'; // Or 'inline-block' or '' depending on desired layout
            firstMessageSent = true;
        }

        // Enhance chat section when user interacts
        chatSection.classList.add('chat-active');
        
        // Disable input while processing
        chatInput.disabled = true;
        chatSubmit.disabled = true;
        chatSubmit.classList.add('processing');
        
        addMessageToChat(displayMessage, 'user');
        chatInput.value = '';
        showTypingIndicator();

        try {
            const botResponse = await sendMessageToBot(promptMessage, currentLanguage);
            removeTypingIndicator();
            addMessageToChat(botResponse, 'bot');
            // Re-enable on success
            chatInput.disabled = false;
            chatSubmit.disabled = false;
        } catch (error) {
            removeTypingIndicator();
            if (error.message === 'Message limit reached') {
                addMessageToChat('You have reached the message limit for this session.', 'bot');
                // Inputs remain disabled
            } else {
                addMessageToChat('Sorry, an error occurred. Please try again.', 'bot');
                // Re-enable on other errors
                chatInput.disabled = false;
                chatSubmit.disabled = false;
            }
        } finally {
            chatSubmit.classList.remove('processing');
            if (!chatInput.disabled) {
                chatInput.focus();
            }
            // Remove active state after a delay
            setTimeout(() => chatSection.classList.remove('chat-active'), 1000);
        }
    }

    suggestionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const key = button.getAttribute('data-translate');
            const promptMessage = translations[key]['en']; // Always send English prompt for consistency
            const displayMessage = button.textContent;
            
            // Add visual feedback when clicking a suggestion
            button.classList.add('active');
            setTimeout(() => button.classList.remove('active'), 300);
            
            handleUserMessage(displayMessage, promptMessage);
        });
    });

    chatSubmit.addEventListener('click', () => {
        // Add click effect
        chatSubmit.classList.add('clicked');
        setTimeout(() => chatSubmit.classList.remove('clicked'), 300);
        handleUserMessage();
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            chatSubmit.classList.add('clicked');
            setTimeout(() => chatSubmit.classList.remove('clicked'), 300);
            handleUserMessage();
        }
    });
    
    // Add focus effect when clicking on the chat input
    chatInput.addEventListener('focus', () => {
        chatSection.classList.add('chat-focus');
    });
    
    chatInput.addEventListener('blur', () => {
        chatSection.classList.remove('chat-focus');
    });
    
    // Function to show welcome message
    function showWelcomeMessage() {
        // Clear any existing welcome messages
        const existingWelcome = document.querySelector('.welcome-message');
        if (existingWelcome) {
            existingWelcome.remove();
        }
        
        const welcomeMessages = {
            'en': 'Hello! I\'m your Bubble assistant. How can I help you today?',
            'fr': 'Bonjour ! Je suis votre assistant Bubble. Comment puis-je vous aider aujourd\'hui ?'
        };
        
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', 'bot-message', 'welcome-message');
        messageElement.textContent = welcomeMessages[currentLanguage] || welcomeMessages['en'];
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Show initial welcome message
    setTimeout(showWelcomeMessage, 1000);
    
    if (toggleSuggestionsBtn) {
        toggleSuggestionsBtn.addEventListener('click', () => {
            if (chatSuggestionsContainer) {
                const isHidden = chatSuggestionsContainer.style.display === 'none';
                chatSuggestionsContainer.style.display = isHidden ? 'flex' : 'none'; // Assuming suggestions use flex display
                // Update button text if needed (e.g., Show/Hide Suggestions)
                // toggleSuggestionsBtn.textContent = isHidden ? (translations['chat.hideSuggestions']?.[currentLanguage] || 'Hide Suggestions') : (translations['chat.showSuggestions']?.[currentLanguage] || 'Show Suggestions');
            }
        });
    }
    
    // Fullscreen toggle functionality for mobile
    if (fullscreenToggleBtn) {
        // Initially hide the fullscreen button on desktop
        if (window.innerWidth > 768) {
            fullscreenToggleBtn.style.display = 'none';
        }
        
        // Show fullscreen button when user interacts with chat on mobile
        const showFullscreenButton = () => {
            if (window.innerWidth <= 768) {
                fullscreenToggleBtn.style.display = 'flex';
            }
        };
        
        // Event listeners to show the fullscreen button
        chatInput.addEventListener('focus', showFullscreenButton);
        chatInput.addEventListener('click', showFullscreenButton);
        chatSection.addEventListener('click', showFullscreenButton);
        
        // Toggle fullscreen mode
        fullscreenToggleBtn.addEventListener('click', () => {
            isFullscreen = !isFullscreen;
            chatSection.classList.toggle('fullscreen', isFullscreen);
            
            // Update the button icon based on state
            if (isFullscreen) {
                fullscreenToggleBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M1.5 1a.5.5 0 0 1 .5.5v4A1.5 1.5 0 0 1 .5 7H0a.5.5 0 0 1 0-1h.5a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5zm10 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5H15a.5.5 0 0 1 0 1h-2.5A1.5 1.5 0 0 1 11 5.5v-4a.5.5 0 0 1 .5-.5zM0 10.5a.5.5 0 0 1 .5-.5H3a1.5 1.5 0 0 1 1.5 1.5v2.5a.5.5 0 0 1-1 0v-2.5a.5.5 0 0 0-.5-.5H.5a.5.5 0 0 1-.5-.5zm11 0a.5.5 0 0 1 .5-.5h2.5a.5.5 0 0 1 .5.5v2.5a.5.5 0 0 1-1 0v-2.5a.5.5 0 0 0-.5-.5h-2.5a.5.5 0 0 1-.5-.5z"/></svg>';
            } else {
                fullscreenToggleBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 0a.5.5 0 0 1 .5.5v4A1.5 1.5 0 0 1 4.5 6h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5zm5 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 10 4.5v-4a.5.5 0 0 1 .5-.5zM0 10.5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 6 11.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zm10 1a1.5 1.5 0 0 1 1.5-1.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4z"/></svg>';
            }
            
            // Scroll chat messages to bottom when toggling fullscreen
            setTimeout(() => {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 300);
        });
        
        // Also make chat fullscreen when user starts interacting with it
        chatInput.addEventListener('focus', () => {
            if (window.innerWidth <= 768 && !isFullscreen) {
                isFullscreen = true;
                chatSection.classList.add('fullscreen');
                fullscreenToggleBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M1.5 1a.5.5 0 0 1 .5.5v4A1.5 1.5 0 0 1 .5 7H0a.5.5 0 0 1 0-1h.5a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5zm10 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5H15a.5.5 0 0 1 0 1h-2.5A1.5 1.5 0 0 1 11 5.5v-4a.5.5 0 0 1 .5-.5zM0 10.5a.5.5 0 0 1 .5-.5H3a1.5 1.5 0 0 1 1.5 1.5v2.5a.5.5 0 0 1-1 0v-2.5a.5.5 0 0 0-.5-.5H.5a.5.5 0 0 1-.5-.5zm11 0a.5.5 0 0 1 .5-.5h2.5a.5.5 0 0 1 .5.5v2.5a.5.5 0 0 1-1 0v-2.5a.5.5 0 0 0-.5-.5h-2.5a.5.5 0 0 1-.5-.5z"/></svg>';
                
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
                const chatInputContainer = document.querySelector('.chat-input-container');
                if (chatInputContainer) {
                    chatInputContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }
            }
        };
        
        // Call scrollChatToBottom when entering fullscreen mode
        fullscreenToggleBtn.addEventListener('click', scrollChatToBottom);
    }

    // Update welcome message when language changes
    const originalUpdateLanguage = window.updateLanguage;
    window.updateLanguage = function(lang) {
        originalUpdateLanguage(lang);
        showWelcomeMessage();
    };
});