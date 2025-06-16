// tokenUtils.ts
// Token counting and message trimming utilities for context window management
import { encode } from "gpt-tokenizer";

export interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

/**
 * Count tokens in a single text string
 */
export const countTokens = (text: string): number => {
    try {
        return encode(text).length;
    } catch (error) {
        // Fallback: rough estimation (1 token ≈ 4 characters)
        return Math.ceil(text.length / 4);
    }
};

/**
 * Count total tokens for an array of messages
 * Includes overhead for message structure (role, formatting, etc.)
 */
export const countMessagesTokens = (messages: ChatMessage[]): number => {
    return messages.reduce((total, message) => {
        // Each message has ~4 tokens overhead for structure + content tokens
        const contentTokens = countTokens(message.content);
        const roleTokens = countTokens(message.role);
        const overhead = 4; // For message formatting in API

        return total + contentTokens + roleTokens + overhead;
    }, 0);
};

/**
 * Trim messages to fit within token limit using FIFO strategy
 * Always keeps the most recent messages
 */
export const trimMessages = (
    messages: ChatMessage[],
    maxTokens: number = 3500
): ChatMessage[] => {
    if (messages.length === 0) return messages;

    const totalTokens = countMessagesTokens(messages);

    // If under limit, return as-is
    if (totalTokens <= maxTokens) {
        return messages;
    }

    // Start with the most recent message and work backwards
    const trimmedMessages: ChatMessage[] = [];
    let currentTokens = 0;

    // Add messages from the end (most recent first) until we hit the limit
    for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        const messageTokens =
            countTokens(message.content) + countTokens(message.role) + 4;

        // Check if adding this message would exceed the limit
        if (currentTokens + messageTokens <= maxTokens) {
            trimmedMessages.unshift(message); // Add to beginning to maintain order
            currentTokens += messageTokens;
        } else {
            // Stop adding messages - we've hit our limit
            break;
        }
    }

    return trimmedMessages;
};

/**
 * Get token usage statistics for debugging/monitoring
 */
export const getTokenStats = (
    messages: ChatMessage[],
    maxTokens: number = 3500
) => {
    const totalTokens = countMessagesTokens(messages);
    const trimmedMessages = trimMessages(messages, maxTokens);
    const trimmedTokens = countMessagesTokens(trimmedMessages);
    const messagesDropped = messages.length - trimmedMessages.length;

    return {
        originalTokens: totalTokens,
        trimmedTokens: trimmedTokens,
        maxTokens,
        messagesDropped,
        utilizationPercent: Math.round((trimmedTokens / maxTokens) * 100),
        wasTrimmed: messagesDropped > 0,
    };
};
