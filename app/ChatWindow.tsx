"use client";

// ChatWindow.tsx
// Enhanced chat window with conversation management, streaming AI responses, and file uploads
import {
    Menu,
    Send,
    User,
    Bot,
    Edit,
    Check,
    X,
    ThumbsUp,
    ThumbsDown,
    RotateCcw,
    PlusCircle,
} from "lucide-react";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import { useEffect, useRef, useState, useCallback, FormEvent } from "react";
import TokenMeter from "./components/TokenMeter";
import { useConversations } from "./contexts/ConversationContext";
import { useFileUpload } from "./hooks/useFileUpload";
import { useMemory } from "./hooks/useMemory"; // NEW: Memory integration
import { getUserId } from "./utils/mem0Client"; // NEW: For stable user ID
import { FileUploadButton } from "./components/FileUpload";
import NextCloudinaryUpload from "./components/NextCloudinaryUpload";
import { FilePreviewStrip } from "./components/FilePreview";
import AttachmentBubble from "./components/AttachmentBubble";
import { ChatMessage } from "./utils/messageTypes";

interface ChatWindowProps {
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
}

export default function ChatWindow({
    isSidebarOpen,
    onToggleSidebar,
}: ChatWindowProps) {
    console.log("🔍 [ChatWindow] Component render started");

    const {
        currentConversation,
        updateCurrentConversation,
        createConversation,
    } = useConversations();
    const isUpdatingRef = useRef(false);
    const conversationInitialized = useRef<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    console.log("🔍 [ChatWindow] Current conversation:", {
        id: currentConversation?.id,
        messageCount: currentConversation?.messages?.length || 0,
        updateCurrentConversation: typeof updateCurrentConversation,
    });

    // File upload integration
    const currentModel = "gpt-4o";

    // Check if Next Cloudinary is configured
    const useNextCloudinary =
        process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
        process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;

    const {
        attachments,
        isProcessing,
        errors,
        handleFileSelect,
        removeFile,
        clearAll,
        clearErrors,
        capabilities,
        hasFiles,
    } = useFileUpload(currentModel);

    // Enhanced useChat integration with memory
    const {
        messages,
        input,
        handleInputChange,
        handleSubmit: originalHandleSubmit,
        isLoading,
        setMessages,
        status,
    } = useChat({
        api: "/api/chat",
        keepLastMessageOnError: true,
        onResponse: (response) => {
            console.log("🔍 [ChatWindow] useChat onResponse:", response.status);
        },
        onFinish: (message) => {
            console.log("🔍 [ChatWindow] useChat onFinish:", {
                messageLength: message.content.length,
                messagesCount: messages.length,
            });
            // Note: Conversation saving is now handled by useEffect
        },
        // Prevent automatic state mutations that cause loops
        initialMessages: [],
    });

    console.log("🔍 [ChatWindow] useChat state:", {
        messagesCount: messages.length,
        isLoading,
        status,
        inputLength: input.length,
    });

    // Memory integration
    // const { addMemory, searchMemories } = useMemory();

    // Edit state for messages
    const [editingMessageId, setEditingMessageId] = useState<string | null>(
        null
    );
    const [editContent, setEditContent] = useState<string>("");

    // State for tracking feedback on responses
    const [feedbackState, setFeedbackState] = useState<{
        [messageId: string]: "thumbsUp" | "thumbsDown" | null;
    }>({});

    // Handle response feedback (thumbs up/down)
    const handleResponseFeedback = (
        messageId: string,
        feedback: "thumbsUp" | "thumbsDown"
    ) => {
        setFeedbackState((prev) => ({
            ...prev,
            [messageId]: prev[messageId] === feedback ? null : feedback,
        }));

        // You could extend this to send feedback to an analytics service
        console.log(`Feedback for message ${messageId}:`, feedback);
    };

    // Handle regenerate response
    const handleRegenerateResponse = useCallback(() => {
        console.log("🔄 Regenerating response...");

        // Find the last user message to regenerate from
        const lastUserMessageIndex = messages.findLastIndex(
            (msg) => msg.role === "user"
        );
        if (lastUserMessageIndex === -1) return;

        // Remove all assistant messages after the last user message
        const messagesToKeep = messages.slice(0, lastUserMessageIndex + 1);
        console.log("✂️ Keeping", messagesToKeep.length, "messages");
        setMessages(messagesToKeep);

        // Re-submit the last user message
        const lastUserMessage = messages[lastUserMessageIndex];
        if (lastUserMessage && lastUserMessage.content) {
            setTimeout(() => {
                console.log(
                    "🚀 Re-submitting:",
                    lastUserMessage.content.substring(0, 50) + "..."
                );
                // Use a simple synthetic event
                const event = { preventDefault: () => {} } as FormEvent;

                // Temporarily set input to trigger submission
                handleInputChange({
                    target: { value: lastUserMessage.content },
                } as any);

                // Submit after input is set
                setTimeout(() => {
                    originalHandleSubmit(event);
                    // Clear input after submission
                    setTimeout(() => {
                        handleInputChange({ target: { value: "" } } as any);
                    }, 100);
                }, 50);
            }, 100);
        }
    }, [messages, setMessages, originalHandleSubmit, handleInputChange]);

    const handleEditStart = (messageId: string, content: string) => {
        setEditingMessageId(messageId);
        setEditContent(content);
    };

    const handleEditCancel = () => {
        setEditingMessageId(null);
        setEditContent("");
    };

    const handleEditSave = async (messageId: string) => {
        if (!editContent.trim()) return;

        const messageIndex = messages.findIndex((msg) => msg.id === messageId);
        if (messageIndex === -1) return;

        // Create new messages array with updated content and remove subsequent messages
        const updatedMessages = messages.slice(0, messageIndex);
        updatedMessages.push({
            ...messages[messageIndex],
            content: editContent.trim(),
        });

        // Update messages and clear edit state
        setMessages(updatedMessages);
        setEditingMessageId(null);
        setEditContent("");
    };

    // Enhanced submit handler that includes file attachments
    const handleSubmit = useCallback(
        async (e: FormEvent) => {
            e.preventDefault();

            if (!input.trim() && !hasFiles) {
                return;
            }
            if (isProcessing) {
                return;
            }

            // Convert attachments for AI SDK
            const attachmentList = await Promise.all(
                attachments
                    .filter((att) => att.file)
                    .map(async (att) => {
                        if (att.url) {
                            return {
                                name: att.name,
                                contentType: att.mimeType,
                                url: att.url,
                            };
                        } else {
                            const dataUrl = await new Promise<string>(
                                (resolve, reject) => {
                                    const reader = new FileReader();
                                    reader.onload = () =>
                                        resolve(reader.result as string);
                                    reader.onerror = reject;
                                    reader.readAsDataURL(att.file!);
                                }
                            );

                            return {
                                name: att.name,
                                contentType: att.mimeType,
                                url: dataUrl,
                            };
                        }
                    })
            );

            const submitOptions = {
                experimental_attachments:
                    attachmentList.length > 0 ? attachmentList : undefined,
            };

            try {
                originalHandleSubmit(e, submitOptions);
            } catch (error) {
                console.error("❌ Error in originalHandleSubmit:", error);
            }

            clearAll();
            clearErrors();
        },
        [
            input,
            hasFiles,
            attachments,
            isProcessing,
            originalHandleSubmit,
            clearAll,
            clearErrors,
        ]
    );

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize messages from current conversation on mount or conversation change
    useEffect(() => {
        if (
            currentConversation &&
            conversationInitialized.current !== currentConversation.id
        ) {
            console.log("🔄 Loading conversation:", currentConversation.id);
            isUpdatingRef.current = true;
            setMessages(currentConversation.messages);
            conversationInitialized.current = currentConversation.id;
            // Reset the completed message count when loading a new conversation
            lastSavedMessageCount.current = currentConversation.messages.length;
            setTimeout(() => {
                isUpdatingRef.current = false;
            }, 100);
        }
    }, [currentConversation?.id, setMessages]);

    // Track message saving with refs to avoid infinite loops
    const lastSavedMessageCount = useRef(0);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isSavingRef = useRef(false);

    // Save messages when they change (but not during loading/streaming)
    useEffect(() => {
        // Clear any existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }

        // Don't save if:
        // - No current conversation
        // - Still initializing conversation
        // - No messages
        // - Currently loading/streaming
        // - Already saving
        // - Message count hasn't changed
        if (
            !currentConversation ||
            conversationInitialized.current !== currentConversation.id ||
            messages.length === 0 ||
            isLoading ||
            isSavingRef.current ||
            messages.length === lastSavedMessageCount.current
        ) {
            return;
        }

        console.log("💾 [ChatWindow] Messages changed, scheduling save...", {
            messageCount: messages.length,
            lastSaved: lastSavedMessageCount.current,
            isLoading,
            conversationId: currentConversation.id,
        });

        // Use a timeout to batch rapid message changes and ensure streaming is complete
        saveTimeoutRef.current = setTimeout(() => {
            // Double-check conditions before saving
            if (
                currentConversation &&
                conversationInitialized.current === currentConversation.id &&
                !isLoading &&
                !isSavingRef.current &&
                messages.length > lastSavedMessageCount.current
            ) {
                console.log("💾 [ChatWindow] Saving messages to conversation");
                isSavingRef.current = true;
                lastSavedMessageCount.current = messages.length;

                try {
                    updateCurrentConversation(messages);
                } catch (error) {
                    console.error(
                        "❌ [ChatWindow] Error saving conversation:",
                        error
                    );
                } finally {
                    // Reset saving flag after a short delay
                    setTimeout(() => {
                        isSavingRef.current = false;
                    }, 500);
                }
            }
            saveTimeoutRef.current = null;
        }, 1000); // 1 second delay to ensure streaming is complete

        // Cleanup function
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = null;
            }
        };
    }, [
        messages.length,
        isLoading,
        currentConversation?.id,
        updateCurrentConversation,
    ]);

    return (
        <section className="flex-1 flex flex-col h-full bg-[#212121]">
            {/* Header with minimal styling */}
            <header className="flex items-center justify-between p-6 bg-[#212121]">
                <div className="flex items-center gap-2">
                    <button
                        onClick={onToggleSidebar}
                        aria-label="Toggle sidebar"
                        className="p-3 rounded-xl hover:bg-white/10 transition-all duration-200 text-[#e5e5e5] hover:text-white hover:scale-105"
                    >
                        <Menu size={20} />
                    </button>

                    {/* New Chat button - only visible when sidebar is closed */}
                    {!isSidebarOpen && (
                        <button
                            onClick={() => createConversation()}
                            aria-label="Start new chat"
                            className="p-3 rounded-xl hover:bg-white/10 transition-all duration-200 text-[#e5e5e5] hover:text-white hover:scale-105 animate-fade-in"
                            title="Start new chat"
                        >
                            <PlusCircle size={20} />
                        </button>
                    )}

                    <h1 className="ml-2 font-bold text-xl text-[#f5f5f5]">
                        {currentConversation?.title || "New Chat"}
                    </h1>
                </div>

                {/* Token Meter */}
                <TokenMeter
                    messages={messages.map((msg) => ({
                        role: msg.role as "user" | "assistant",
                        content: msg.content,
                    }))}
                />
            </header>

            {/* Chat Messages Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {messages.length === 0 ? (
                    /* Enhanced Welcome Screen */
                    <div className="flex-1 flex flex-col justify-center items-center p-8 text-center animate-fade-in">
                        <div className="max-w-2xl">
                            {/* AI Bot Icon */}
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl animate-pulse">
                                <Bot size={36} className="text-white" />
                            </div>

                            <h2 className="text-4xl font-bold mb-4 text-[#f5f5f5]">
                                How can I help you today?
                            </h2>
                            <p className="text-[#b4b4b4] mb-12 text-lg">
                                Start a conversation by typing a message below
                                or try one of these suggestions
                            </p>

                            {/* Suggested Prompts */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                {[
                                    "Explain quantum computing in simple terms",
                                    "Write a creative story about space exploration",
                                    "Help me plan a healthy meal prep routine",
                                    "Debug this JavaScript code snippet",
                                ].map((prompt, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            handleInputChange({
                                                target: { value: prompt },
                                            } as any);
                                        }}
                                        className="p-4 rounded-lg border border-[#525252] hover:border-[#7a7a7a] bg-[#2a2a2a]/50 hover:bg-[#3a3a3a]/50 transition-all duration-200 text-left group"
                                    >
                                        <div className="text-sm font-medium text-[#e5e5e5] group-hover:text-[#f5f5f5]">
                                            {prompt}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ChatGPT-style Messages Display */
                    <div className="flex-1 overflow-y-auto">
                        {messages.map((message, index) => (
                            <div
                                key={message.id}
                                className="relative animate-slide-in"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="max-w-4xl mx-auto px-6 py-6">
                                    {message.role === "user" ? (
                                        /* User message - bubble style, right-aligned */
                                        <div className="flex justify-end">
                                            <div className="max-w-[70%] flex flex-col items-end gap-2">
                                                <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl px-4 py-3">
                                                    <div className="text-[#e5e5e5]">
                                                        {editingMessageId ===
                                                        message.id ? (
                                                            /* Edit mode for user messages */
                                                            <div className="space-y-2">
                                                                <textarea
                                                                    value={
                                                                        editContent
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        setEditContent(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    className="w-full bg-[#1a1a1a] text-[#e5e5e5] placeholder-[#a0a0a0] border border-[#525252] rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                    placeholder="Edit your message..."
                                                                    rows={Math.max(
                                                                        2,
                                                                        editContent.split(
                                                                            "\n"
                                                                        ).length
                                                                    )}
                                                                    autoFocus
                                                                />
                                                                <div className="flex gap-2 justify-end">
                                                                    <button
                                                                        onClick={
                                                                            handleEditCancel
                                                                        }
                                                                        className="p-2 rounded-lg hover:bg-[#3a3a3a] transition text-[#a0a0a0] hover:text-[#e5e5e5]"
                                                                        aria-label="Cancel edit"
                                                                    >
                                                                        <X
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                    </button>
                                                                    <button
                                                                        onClick={() =>
                                                                            handleEditSave(
                                                                                message.id
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            !editContent.trim() ||
                                                                            isLoading
                                                                        }
                                                                        className="p-2 rounded-lg hover:bg-blue-900/20 transition text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                        aria-label="Save edit"
                                                                    >
                                                                        <Check
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            /* User message content */
                                                            <div className="relative group">
                                                                <p className="whitespace-pre-wrap">
                                                                    {
                                                                        message.content
                                                                    }
                                                                </p>
                                                                {/* Edit button for user messages */}
                                                                {!isLoading && (
                                                                    <button
                                                                        onClick={() =>
                                                                            handleEditStart(
                                                                                message.id,
                                                                                message.content
                                                                            )
                                                                        }
                                                                        className="absolute -top-1 -right-1 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#3a3a3a] text-[#a0a0a0] hover:text-[#e5e5e5]"
                                                                        aria-label="Edit message"
                                                                    >
                                                                        <Edit
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-[#a0a0a0]">
                                                        {new Date().toLocaleTimeString(
                                                            [],
                                                            {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            }
                                                        )}
                                                    </span>
                                                    <div className="w-6 h-6 bg-[#4a4a4a] rounded-full flex items-center justify-center">
                                                        <User
                                                            size={12}
                                                            className="text-[#e5e5e5]"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Assistant message - traditional layout, left-aligned */
                                        <div className="flex gap-4">
                                            {/* Avatar */}
                                            <div className="flex-shrink-0">
                                                <div className="w-8 h-8 bg-[#4a4a4a] rounded-full flex items-center justify-center">
                                                    <Bot
                                                        size={16}
                                                        className="text-[#e5e5e5]"
                                                    />
                                                </div>
                                            </div>

                                            {/* Message Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-sm font-semibold text-[#f5f5f5]">
                                                        Assistant
                                                    </span>
                                                    <span className="text-xs text-[#a0a0a0]">
                                                        {new Date().toLocaleTimeString(
                                                            [],
                                                            {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            }
                                                        )}
                                                    </span>
                                                </div>

                                                {/* Assistant message content */}
                                                <div className="prose prose-sm prose-invert max-w-none mb-3">
                                                    <ReactMarkdown
                                                        components={{
                                                            // Paragraphs
                                                            p: ({
                                                                children,
                                                            }) => (
                                                                <p className="mb-3 last:mb-0 text-[#e5e5e5] leading-relaxed">
                                                                    {children}
                                                                </p>
                                                            ),

                                                            // Headers
                                                            h1: ({
                                                                children,
                                                            }) => (
                                                                <h1 className="text-2xl font-bold text-[#f5f5f5] mb-4 mt-6 first:mt-0 border-b border-[#3a3a3a] pb-2">
                                                                    {children}
                                                                </h1>
                                                            ),
                                                            h2: ({
                                                                children,
                                                            }) => (
                                                                <h2 className="text-xl font-semibold text-[#f5f5f5] mb-3 mt-5 first:mt-0">
                                                                    {children}
                                                                </h2>
                                                            ),
                                                            h3: ({
                                                                children,
                                                            }) => (
                                                                <h3 className="text-lg font-semibold text-[#f5f5f5] mb-2 mt-4 first:mt-0">
                                                                    {children}
                                                                </h3>
                                                            ),
                                                            h4: ({
                                                                children,
                                                            }) => (
                                                                <h4 className="text-base font-semibold text-[#f5f5f5] mb-2 mt-3 first:mt-0">
                                                                    {children}
                                                                </h4>
                                                            ),
                                                            h5: ({
                                                                children,
                                                            }) => (
                                                                <h5 className="text-sm font-semibold text-[#f5f5f5] mb-2 mt-3 first:mt-0">
                                                                    {children}
                                                                </h5>
                                                            ),
                                                            h6: ({
                                                                children,
                                                            }) => (
                                                                <h6 className="text-sm font-medium text-[#e5e5e5] mb-2 mt-3 first:mt-0">
                                                                    {children}
                                                                </h6>
                                                            ),

                                                            // Lists
                                                            ul: ({
                                                                children,
                                                            }) => (
                                                                <ul className="mb-3 pl-6 list-disc text-[#e5e5e5] space-y-1">
                                                                    {children}
                                                                </ul>
                                                            ),
                                                            ol: ({
                                                                children,
                                                            }) => (
                                                                <ol className="mb-3 pl-6 list-decimal text-[#e5e5e5] space-y-1">
                                                                    {children}
                                                                </ol>
                                                            ),
                                                            li: ({
                                                                children,
                                                            }) => (
                                                                <li className="text-[#e5e5e5] leading-relaxed">
                                                                    {children}
                                                                </li>
                                                            ),

                                                            // Code blocks and inline code
                                                            code: ({
                                                                children,
                                                                className,
                                                            }) => {
                                                                const isInline =
                                                                    !className;
                                                                return isInline ? (
                                                                    <code className="bg-[#3a3a3a] text-[#f5f5f5] px-1.5 py-0.5 rounded text-sm font-mono border border-[#4a4a4a]">
                                                                        {
                                                                            children
                                                                        }
                                                                    </code>
                                                                ) : (
                                                                    <code className="text-[#e5e5e5] font-mono text-sm">
                                                                        {
                                                                            children
                                                                        }
                                                                    </code>
                                                                );
                                                            },
                                                            pre: ({
                                                                children,
                                                            }) => (
                                                                <pre className="bg-[#1a1a1a] border border-[#3a3a3a] text-[#e5e5e5] p-4 rounded-lg overflow-x-auto mb-3 font-mono text-sm leading-relaxed">
                                                                    {children}
                                                                </pre>
                                                            ),

                                                            // Blockquotes
                                                            blockquote: ({
                                                                children,
                                                            }) => (
                                                                <blockquote className="border-l-4 border-[#525252] pl-4 py-2 mb-3 bg-[#2a2a2a] rounded-r-lg italic text-[#d5d5d5]">
                                                                    {children}
                                                                </blockquote>
                                                            ),

                                                            // Links
                                                            a: ({
                                                                children,
                                                                href,
                                                            }) => (
                                                                <a
                                                                    href={href}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/50 hover:decoration-blue-300 transition-colors"
                                                                >
                                                                    {children}
                                                                </a>
                                                            ),

                                                            // Tables
                                                            table: ({
                                                                children,
                                                            }) => (
                                                                <div className="overflow-x-auto mb-3">
                                                                    <table className="min-w-full border border-[#3a3a3a] rounded-lg">
                                                                        {
                                                                            children
                                                                        }
                                                                    </table>
                                                                </div>
                                                            ),
                                                            thead: ({
                                                                children,
                                                            }) => (
                                                                <thead className="bg-[#2a2a2a]">
                                                                    {children}
                                                                </thead>
                                                            ),
                                                            tbody: ({
                                                                children,
                                                            }) => (
                                                                <tbody className="bg-[#1a1a1a]">
                                                                    {children}
                                                                </tbody>
                                                            ),
                                                            tr: ({
                                                                children,
                                                            }) => (
                                                                <tr className="border-b border-[#3a3a3a] last:border-b-0">
                                                                    {children}
                                                                </tr>
                                                            ),
                                                            th: ({
                                                                children,
                                                            }) => (
                                                                <th className="px-4 py-2 text-left font-semibold text-[#f5f5f5] border-r border-[#3a3a3a] last:border-r-0">
                                                                    {children}
                                                                </th>
                                                            ),
                                                            td: ({
                                                                children,
                                                            }) => (
                                                                <td className="px-4 py-2 text-[#e5e5e5] border-r border-[#3a3a3a] last:border-r-0">
                                                                    {children}
                                                                </td>
                                                            ),

                                                            // Horizontal rule
                                                            hr: () => (
                                                                <hr className="border-0 h-px bg-[#3a3a3a] my-6" />
                                                            ),

                                                            // Strong and emphasis
                                                            strong: ({
                                                                children,
                                                            }) => (
                                                                <strong className="font-bold text-[#f5f5f5]">
                                                                    {children}
                                                                </strong>
                                                            ),
                                                            em: ({
                                                                children,
                                                            }) => (
                                                                <em className="italic text-[#e5e5e5]">
                                                                    {children}
                                                                </em>
                                                            ),
                                                        }}
                                                    >
                                                        {message.content}
                                                    </ReactMarkdown>
                                                </div>

                                                {/* Response actions - only for assistant messages */}
                                                {message.role ===
                                                    "assistant" && (
                                                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[#3a3a3a] opacity-0 hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() =>
                                                                handleResponseFeedback(
                                                                    message.id,
                                                                    "thumbsUp"
                                                                )
                                                            }
                                                            className="p-2 rounded-lg hover:bg-[#3a3a3a] transition-all duration-200"
                                                            title="Good response"
                                                        >
                                                            <ThumbsUp
                                                                size={16}
                                                                className="text-[#a0a0a0] hover:text-[#e5e5e5]"
                                                            />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleResponseFeedback(
                                                                    message.id,
                                                                    "thumbsDown"
                                                                )
                                                            }
                                                            className="p-2 rounded-lg hover:bg-[#3a3a3a] transition-all duration-200"
                                                            title="Bad response"
                                                        >
                                                            <ThumbsDown
                                                                size={16}
                                                                className="text-[#a0a0a0] hover:text-[#e5e5e5]"
                                                            />
                                                        </button>
                                                        <button
                                                            onClick={
                                                                handleRegenerateResponse
                                                            }
                                                            className="p-2 rounded-lg hover:bg-[#3a3a3a] transition-all duration-200"
                                                            title="Regenerate response"
                                                            disabled={isLoading}
                                                        >
                                                            <RotateCcw
                                                                size={16}
                                                                className={`${
                                                                    isLoading
                                                                        ? "animate-spin text-blue-400"
                                                                        : "text-[#a0a0a0] hover:text-[#e5e5e5]"
                                                                }`}
                                                            />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Centered shorter separator line - only between messages */}
                                {index < messages.length - 1 && (
                                    <div className="flex justify-center py-4">
                                        <div className="w-32 h-px bg-[#3a3a3a]"></div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="border-b border-[#3a3a3a] bg-transparent">
                                <div className="max-w-4xl mx-auto px-6 py-6">
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 bg-[#4a4a4a] rounded-full flex items-center justify-center">
                                            <Bot
                                                size={16}
                                                className="text-[#e5e5e5]"
                                            />
                                        </div>
                                        <div className="flex items-center">
                                            <div className="flex space-x-1">
                                                <div className="w-2 h-2 bg-[#a0a0a0] rounded-full animate-bounce"></div>
                                                <div
                                                    className="w-2 h-2 bg-[#a0a0a0] rounded-full animate-bounce"
                                                    style={{
                                                        animationDelay: "0.1s",
                                                    }}
                                                ></div>
                                                <div
                                                    className="w-2 h-2 bg-[#a0a0a0] rounded-full animate-bounce"
                                                    style={{
                                                        animationDelay: "0.2s",
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                )}

                {/* Enhanced Input Area */}
                <div className="bg-[#212121]">
                    {/* File upload errors */}
                    {errors.length > 0 && (
                        <div className="px-6 pt-4">
                            <div className="bg-red-950/20 border border-red-800 rounded-lg p-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-sm font-medium text-red-400">
                                            Upload Errors
                                        </h4>
                                        <ul className="mt-1 text-sm text-red-300 list-disc list-inside">
                                            {errors.map((error, index) => (
                                                <li key={index}>{error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <button
                                        onClick={clearErrors}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* File preview strip */}
                    <FilePreviewStrip
                        attachments={attachments}
                        onRemove={removeFile}
                    />

                    <div className="p-6 flex justify-center">
                        <div className="w-full max-w-4xl">
                            <form onSubmit={handleSubmit} className="space-y-3">
                                {/* Unified input container - wraps both lines with increased curvature */}
                                <div className="bg-[#2a2a2a] border border-[#525252] rounded-3xl p-5 space-y-4 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 transition-all duration-200">
                                    {/* First line - Text input */}
                                    <div className="relative">
                                        <input
                                            value={input}
                                            onChange={handleInputChange}
                                            type="text"
                                            className="w-full px-0 py-2 bg-transparent text-[#f5f5f5] placeholder-[#a0a0a0] border-0 focus:outline-none focus:ring-0"
                                            placeholder="Ask anything..."
                                            disabled={isLoading}
                                        />
                                    </div>

                                    {/* Second line - Tools and send button */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {/* File upload button */}
                                            {useNextCloudinary ? (
                                                <NextCloudinaryUpload
                                                    onFileSelect={
                                                        handleFileSelect
                                                    }
                                                    isProcessing={isProcessing}
                                                    canUpload={true}
                                                    capabilities={capabilities}
                                                    onUploadSuccess={(
                                                        result
                                                    ) => {
                                                        console.log(
                                                            "🎉 Next Cloudinary upload completed:",
                                                            result
                                                        );
                                                    }}
                                                />
                                            ) : (
                                                <FileUploadButton
                                                    onFileSelect={
                                                        handleFileSelect
                                                    }
                                                    isProcessing={isProcessing}
                                                    canUpload={true}
                                                    capabilities={capabilities}
                                                />
                                            )}

                                            {/* Tools button placeholder for future features */}
                                            <button
                                                type="button"
                                                className="p-2 rounded-lg text-[#a0a0a0] hover:text-[#e5e5e5] hover:bg-[#3a3a3a] transition-all duration-200"
                                                title="Tools"
                                            >
                                                <svg
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                >
                                                    <path d="M12 20h9" />
                                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Send button */}
                                        <button
                                            type="submit"
                                            disabled={
                                                isLoading ||
                                                (!input.trim() && !hasFiles) ||
                                                isProcessing
                                            }
                                            className="p-2 rounded-lg bg-[#f5f5f5] text-[#212121] hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 disabled:hover:bg-[#f5f5f5]"
                                            title="Send message"
                                        >
                                            {isLoading ? (
                                                <div className="w-4 h-4 border-2 border-[#212121]/30 border-t-[#212121] rounded-full animate-spin"></div>
                                            ) : (
                                                <svg
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                >
                                                    <path d="m22 2-7 20-4-9-9-4Z" />
                                                    <path d="M22 2 11 13" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>

                            <p className="text-xs text-[#a0a0a0] mt-3 text-center">
                                ChatGPT can make mistakes. Check important info.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
