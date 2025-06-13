// Function to handle sending a message to the chatbot
async function sendMessageToBot(message, language = 'en') {
    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message, language }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'An error occurred.');
        }

        const data = await response.json();
        return data.reply;
    } catch (error) {
        console.error('Error sending message to bot:', error);
        return `Error: ${error.message}`;
    }
}
