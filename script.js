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

    function addMessageToChat(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', `${sender}-message`);
        const formattedMessage = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                        .replace(/^- (.*)/gm, '<li>$1</li>')
                                        .replace(/(\r\n|\n|\r)/g, '<br>');
        messageElement.innerHTML = formattedMessage;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to the bottom
    }

    function showTypingIndicator() {
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('chat-message', 'bot-message', 'typing-indicator');
        typingIndicator.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function removeTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    async function handleUserMessage(displayMessageOverride, promptMessageOverride) {
        const displayMessage = displayMessageOverride || chatInput.value.trim();
        const promptMessage = promptMessageOverride || displayMessage;

        if (!promptMessage) return;

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
        }
    }

    suggestionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const key = button.getAttribute('data-translate');
            const promptMessage = translations[key]['en']; // Always send English prompt for consistency
            const displayMessage = button.textContent;
            handleUserMessage(displayMessage, promptMessage);
        });
    });

    chatSubmit.addEventListener('click', () => handleUserMessage());

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleUserMessage();
        }
    });
});