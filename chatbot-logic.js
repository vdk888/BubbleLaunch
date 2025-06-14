// Function to handle sending a message to the chatbot
async function sendMessageToBot(message, language = 'en') {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, language }),
    });

    if (response.status === 429) {
        throw new Error('Message limit reached');
    }

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An error occurred.');
    }

    const data = await response.json();
    return data.reply;
}
