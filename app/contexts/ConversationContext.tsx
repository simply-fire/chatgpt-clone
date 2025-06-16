"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useCallback,
    useMemo,
} from "react";
import { Message } from "ai";
import {
    Conversation,
    getConversations,
    createNewConversation,
    saveConversation,
    deleteConversation,
    generateConversationTitle,
    updateConversationTitle,
} from "../utils/conversations";

interface ConversationContextType {
    // Current conversation state
    currentConversation: Conversation | null;
    conversations: Conversation[];

    // Actions
    createConversation: () => string;
    loadConversation: (id: string) => void;
    updateCurrentConversation: (messages: Message[]) => void;
    deleteConversationById: (id: string) => void;
    renameConversation: (id: string, title: string) => void;

    // UI state
    isLoading: boolean;
}

const ConversationContext = createContext<ConversationContextType | null>(null);

export function ConversationProvider({ children }: { children: ReactNode }) {
    const [currentConversation, setCurrentConversation] =
        useState<Conversation | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load conversations on mount
    useEffect(() => {
        const loadedConversations = getConversations();
        setConversations(loadedConversations);

        // If no conversations exist, create a new one
        if (loadedConversations.length === 0) {
            const newConv = createNewConversation();
            setCurrentConversation(newConv);
            setConversations([newConv]);
            saveConversation(newConv);
        } else {
            // Load the most recent conversation
            setCurrentConversation(loadedConversations[0]);
        }

        setIsLoading(false);
    }, []);

    // Create a new conversation
    const createConversation = useCallback((): string => {
        const newConv = createNewConversation();
        setCurrentConversation(newConv);
        setConversations((prev) => [newConv, ...prev]);
        saveConversation(newConv);
        return newConv.id;
    }, []);

    // Load existing conversation
    const loadConversation = useCallback(
        (id: string): void => {
            const conversation = conversations.find((conv) => conv.id === id);
            if (conversation) {
                setCurrentConversation(conversation);
            }
        },
        [conversations]
    );

    // Update current conversation with new messages
    const updateCurrentConversation = useCallback(
        (messages: Message[]): void => {
            if (!currentConversation) return;

            // Avoid unnecessary updates if messages are the same
            if (currentConversation.messages.length === messages.length) {
                let isIdentical = true;
                for (let i = 0; i < messages.length; i++) {
                    const existing = currentConversation.messages[i];
                    const newMsg = messages[i];
                    if (
                        existing.id !== newMsg.id ||
                        existing.content !== newMsg.content ||
                        existing.role !== newMsg.role
                    ) {
                        isIdentical = false;
                        break;
                    }
                }
                if (isIdentical) return;
            }

            const updatedConversation = {
                ...currentConversation,
                messages,
                updatedAt: new Date().toISOString(),
            };

            // Auto-generate title from first user message if still "New Chat"
            if (
                updatedConversation.title === "New Chat" &&
                messages.length > 0
            ) {
                const firstUserMessage = messages.find(
                    (msg) => msg.role === "user"
                );
                if (firstUserMessage) {
                    updatedConversation.title = generateConversationTitle(
                        firstUserMessage.content
                    );
                }
            }

            setCurrentConversation(updatedConversation);

            // Update conversations list
            setConversations((prev) =>
                prev.map((conv) =>
                    conv.id === updatedConversation.id
                        ? updatedConversation
                        : conv
                )
            );

            // Save to localStorage
            saveConversation(updatedConversation);
        },
        [
            currentConversation?.id,
            currentConversation?.title,
            currentConversation?.messages,
        ] // More specific dependencies
    );

    // Delete conversation
    const deleteConversationById = useCallback(
        (id: string): void => {
            deleteConversation(id);
            setConversations((prev) => prev.filter((conv) => conv.id !== id));

            // If deleted conversation was current, create new one
            if (currentConversation?.id === id) {
                const newConv = createNewConversation();
                setCurrentConversation(newConv);
                saveConversation(newConv);
                setConversations((prev) => [newConv, ...prev]);
            }
        },
        [currentConversation]
    );

    // Rename conversation
    const renameConversation = useCallback(
        (id: string, title: string): void => {
            updateConversationTitle(id, title);
            setConversations((prev) =>
                prev.map((conv) =>
                    conv.id === id
                        ? {
                              ...conv,
                              title,
                              updatedAt: new Date().toISOString(),
                          }
                        : conv
                )
            );

            if (currentConversation?.id === id) {
                setCurrentConversation((prev) =>
                    prev
                        ? {
                              ...prev,
                              title,
                              updatedAt: new Date().toISOString(),
                          }
                        : null
                );
            }
        },
        [currentConversation]
    );

    const value: ConversationContextType = useMemo(
        () => ({
            currentConversation,
            conversations,
            createConversation,
            loadConversation,
            updateCurrentConversation,
            deleteConversationById,
            renameConversation,
            isLoading,
        }),
        [
            currentConversation,
            conversations,
            createConversation,
            loadConversation,
            updateCurrentConversation,
            deleteConversationById,
            renameConversation,
            isLoading,
        ]
    );

    return (
        <ConversationContext.Provider value={value}>
            {children}
        </ConversationContext.Provider>
    );
}

export function useConversations() {
    const context = useContext(ConversationContext);
    if (!context) {
        throw new Error(
            "useConversations must be used within a ConversationProvider"
        );
    }
    return context;
}
