import { v4 as uuidv4 } from "uuid";
import { Message } from "ai";

export interface Conversation {
    id: string;
    title: string;
    messages: Message[];
    createdAt: string;
    updatedAt: string;
}

const STORAGE_KEY = "chatgpt-clone-conversations";

// Get all conversations from localStorage
export function getConversations(): Conversation[] {
    if (typeof window === "undefined") return [];

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("Error loading conversations:", error);
        return [];
    }
}

// Save conversations to localStorage
export function saveConversations(conversations: Conversation[]): void {
    if (typeof window === "undefined") return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (error) {
        console.error("Error saving conversations:", error);
    }
}

// Create a new conversation
export function createNewConversation(): Conversation {
    const now = new Date().toISOString();
    return {
        id: uuidv4(),
        title: "New Chat",
        messages: [],
        createdAt: now,
        updatedAt: now,
    };
}

// Generate title from first user message
export function generateConversationTitle(firstMessage: string): string {
    if (!firstMessage || firstMessage.trim().length === 0) {
        return "New Chat";
    }

    // Take first 30 characters and add ellipsis if longer
    const title = firstMessage.trim();
    return title.length > 30 ? title.substring(0, 30) + "..." : title;
}

// Get conversation by ID
export function getConversationById(id: string): Conversation | null {
    const conversations = getConversations();
    return conversations.find((conv) => conv.id === id) || null;
}

// Update or create conversation
export function saveConversation(conversation: Conversation): void {
    const conversations = getConversations();
    const existingIndex = conversations.findIndex(
        (conv) => conv.id === conversation.id
    );

    conversation.updatedAt = new Date().toISOString();

    if (existingIndex >= 0) {
        conversations[existingIndex] = conversation;
    } else {
        conversations.unshift(conversation); // Add to beginning
    }

    saveConversations(conversations);
}

// Delete conversation
export function deleteConversation(id: string): void {
    const conversations = getConversations();
    const filtered = conversations.filter((conv) => conv.id !== id);
    saveConversations(filtered);
}

// Update conversation title
export function updateConversationTitle(id: string, title: string): void {
    const conversations = getConversations();
    const conversation = conversations.find((conv) => conv.id === id);

    if (conversation) {
        conversation.title = title;
        conversation.updatedAt = new Date().toISOString();
        saveConversations(conversations);
    }
}
