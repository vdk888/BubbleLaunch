import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

/**
 * Gets a chat completion from OpenAI.
 * @param history Conversation history including the latest user message.
 * @returns The assistant's reply.
 */
export async function getChatCompletion(history: ChatMessage[]): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured in .env file.');
    }

    const systemPromptContent = `You are a highly intelligent and engaging conversational AI. Your goal is to not just answer questions, but to enrich the conversation by:
- Actively reflecting on the user's statements and ideas, offering deeper insights.
- Proactively identifying and discussing potential blind spots or unconsidered angles related to the topic.
- Citing relevant scientific works, notable authors, or specific references to support and illustrate points.
- Encouraging out-of-the-box thinking and exploring concepts from novel perspectives.
- Drawing connections to analogous concepts or systems in other domains to foster a broader understanding.
- Overall, aim to make the dialogue stimulating, thought-provoking, and expansive. Go beyond surface-level responses and dive into the 'why' and 'how' of concepts.`;

    const systemMessage: ChatMessage = { role: 'system', content: systemPromptContent };

    const messagesWithSystemPrompt: ChatMessage[] = [systemMessage, ...history];

    console.log('Sending to OpenAI with system prompt:', JSON.stringify(messagesWithSystemPrompt, null, 2));

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4.1', // Or your preferred model
            messages: messagesWithSystemPrompt,
            temperature: 0.7,
            max_tokens: 18240, // Keeping existing max_tokens
        });

        const reply = completion.choices[0]?.message?.content;
        console.log('Received from OpenAI:', reply);

        if (!reply) {
            throw new Error('No reply content received from OpenAI.');
        }
        return reply;

    } catch (error: unknown) {
        console.error('Error calling OpenAI API:', error); // Log the raw error

        if (error instanceof OpenAI.APIError) {
            console.error('OpenAI API Error Status:', error.status);
            if (error.error) {
                 console.error('OpenAI API Error Details:', error.error);
            } else {
                 console.error('OpenAI API Error Message (from APIError):', error.message);
            }
            // Re-throw a new error with more context from the APIError
            throw new Error(`OpenAI API Error (${error.status}): ${error.message}`);
        }
        // Check if it's a generic Error instance after checking for APIError
        if (error instanceof Error) {
            // Handle other errors that are instances of Error but not APIError
            throw new Error(`Failed to get completion from OpenAI: ${error.message}`);
        }
        
        // Fallback for errors that are not instances of Error (e.g., a string was thrown)
        throw new Error('Failed to get completion from OpenAI due to an unknown error type.');
    }
}

/**
 * Generates a structured blog post from conversation history.
 * @param history The full conversation history.
 * @returns An object containing title and content (Markdown).
 */
export async function generateBlogPostFromHistory(history: ChatMessage[]): Promise<{ title: string; content: string }> {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured.');
    }

    console.log('Generating blog post from history...');

    const systemPrompt: ChatMessage = {
      role: 'system',
      content: `You are an expert blog post writer. Based on the following conversation history between a user and an assistant, generate a well-structured, engaging blog post, at least 10 pages long. 
      The output MUST be in JSON format with two keys: "title" (a concise and catchy title for the post) and "content" (the full blog post content in Markdown format). 
      Ensure the Markdown is clean and includes headings, paragraphs, lists, and potentially code blocks if relevant. Infer the main topic and key points from the conversation.
      Make it sound like a coherent article, not just a transcript. Extract relevant information, links, or ideas mentioned. Avoid meta-commentary about the generation process itself.

      **Prioritize Comprehensive Content:**
      Your primary objective is to generate a blog post that is as comprehensive and detailed as possible, faithfully reflecting all aspects of the provided conversation history.
      -   **Elaborate, Don't Summarize:** Expand on all ideas, arguments, examples, and nuances. Avoid condensing or omitting information for the sake of brevity.
      -   **Preserve Nuances:** Ensure that subtle points and the full context of the discussion are captured.
      -   **Depth over Length Constraints:** While the output needs to be a coherent article, do not shy away from length if it's necessary to fully cover the material. The goal is a rich, detailed exploration.
      -   **Integrate All Relevant Information:** Systematically incorporate every piece of relevant information, link, or idea mentioned into the narrative.
      Strive to produce an article that allows the reader to gain a deep and thorough understanding of all topics discussed in the conversation history.

      ## Practice

      Take the ideas from user's conversation and transform it by using these five techniques to make it more engaging and relatable, especially around examples: 

      1. Start by stating the location
      2. Describe your actions in that moment
      3. Share your authentic thoughts
      4. Show your emotions through physical reactions
      5. Include exact dialogue from the key moment

      ## Detailed Explanations

      Throughout the blog post, thoroughly explain each idea and concept introduced. Walk the reader through your reasoning step by step, showing how one thought connects to the next. Don't just state conclusions - develop the full thought process that leads to them even if not explicit in the attached conversation. Provide clear examples that illustrate complex points, and explain why these examples are relevant. The reader should finish the article with a deep understanding of not just what you're saying, but why you're saying it and how you arrived at your conclusions.

      General guidance: do not organize the content by parts with titles, those are guides. The article should be a continuous flow for a fluid reading experience.

      Remember: Great storytelling isn't about summarizing events—it's about zooming into specific moments and making your audience feel like they're right there with you, and great explanations make readers feel like they've discovered the insights themselves through clear reasoning.`
    };

    const messages: ChatMessage[] = [systemPrompt, ...history];

    console.log('Messages sent to OpenAI:', messages);

    
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4.1', // Use a powerful model for structuring
            messages: messages,
            temperature: 0.5,
            max_tokens: 32383,
            response_format: { type: "json_object" }, // Request JSON output
        });

        const rawJsonResponse = completion.choices[0]?.message?.content;
        console.log('Raw JSON response for blog post:', rawJsonResponse);

        if (!rawJsonResponse) {
            throw new Error('No content received from OpenAI for blog post generation.');
        }

        try {
            const blogPost = JSON.parse(rawJsonResponse);
            if (!blogPost.title || !blogPost.content) {
                 throw new Error('Invalid JSON structure received from OpenAI. Missing title or content.');
            }
            console.log('Parsed blog post:', blogPost);
            return blogPost as { title: string; content: string };
        } catch (parseError) {
            console.error('Error parsing JSON response from OpenAI:', parseError);
            console.error('Raw response was:', rawJsonResponse);
             // Fallback: Try to return the raw response if it looks like reasonable text
            if (typeof rawJsonResponse === 'string' && rawJsonResponse.length > 50) {
                return { title: "Generated Post (Parsing Failed)", content: rawJsonResponse };
            }
            throw new Error('Failed to parse valid JSON blog post from OpenAI response.');
        }

    } catch (error: unknown) {
        console.error('Error generating blog post via OpenAI:', error); // Log the raw error

        if (error instanceof OpenAI.APIError) {
            console.error('OpenAI API Error Status for blog post generation:', error.status);
            if (error.error) {
                console.error('OpenAI API Error Details for blog post generation:', error.error);
            } else {
                console.error('OpenAI API Error Message (from APIError) for blog post generation:', error.message);
            }
            throw new Error(`OpenAI API Error during blog post generation (${error.status}): ${error.message}`);
        }
        // Check if it's a generic Error instance after checking for APIError
        if (error instanceof Error) {
            throw new Error(`Failed to generate blog post: ${error.message}`);
        }
        
        throw new Error('Failed to generate blog post due to an unknown error type.');
    }
}
