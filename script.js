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
                element.textContent = translations[key][lang];
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
    const chatSection = document.querySelector('.chat-section');

    function addMessageToChat(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', `${sender}-message`);
        
        // Format markdown-like syntax
        const formattedMessage = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                        .replace(/^- (.*)/gm, '<li>$1</li>')
                                        .replace(/(\r\n|\n|\r)/g, '<br>');
        
        messageElement.innerHTML = formattedMessage;
        
        // Add with a slight delay for animation effect
        setTimeout(() => {
            chatMessages.appendChild(messageElement);
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
            const botReply = await sendMessageToBot(promptMessage);
            removeTypingIndicator();
            addMessageToChat(botReply, 'bot');
        } catch (error) {
            removeTypingIndicator();
            addMessageToChat('Sorry, something went wrong. Please try again.', 'bot');
        } finally {
            // Re-enable input after processing
            chatInput.disabled = false;
            chatSubmit.disabled = false;
            chatSubmit.classList.remove('processing');
            chatInput.focus();
            
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
    
    // Initialize with a welcome message after a short delay
    setTimeout(() => {
        addMessageToChat('Hello! I\'m your Bubble assistant. How can I help you today?', 'bot');
    }, 1000);
});