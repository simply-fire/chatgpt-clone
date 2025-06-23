"use client";

// ChatWindow.tsx
// Enhanced chat window with conversation management, streaming AI responses, and file uploads
import { Menu, Send, User, Bot, Edit, Check, X, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import { useEffect, useRef, useState, useCallback, FormEvent } from "react";
import TokenMeter from "../../app/components/TokenMeter";
import { useConversations } from "../../app/contexts/ConversationContext";
import { useFileUpload } from "../../app/hooks/useFileUpload";
import { useMemory } from "../../app/hooks/useMemory"; // NEW: Memory integration
import { getUserId } from "../../app/utils/mem0Client"; // NEW: For stable user ID
import { FileUploadButton } from "../../app/components/FileUpload";
import NextCloudinaryUpload from "../../app/components/NextCloudinaryUpload";
import { FilePreviewStrip } from "../../app/components/FilePreview";
import AttachmentBubble from "../../app/components/AttachmentBubble";
import { ChatMessage } from "../../app/utils/messageTypes";

interface ChatWindowProps {
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
}

export default function ChatWindow({
    isSidebarOpen,
    onToggleSidebar,
}: ChatWindowProps) {
    const { currentConversation, updateCurrentConversation } =
        useConversations();
    const isUpdatingRef = useRef(false);
    const conversationInitialized = useRef<string | null>(null);

    // File upload integration
    const currentModel = "gpt-4o"; // TODO: Make this configurable

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
        canUpload,
    } = useFileUpload(currentModel);

    // 🧠 Memory integration - stabilize userId to prevent infinite loops
    const [stableUserId] = useState<string>(() => {
        if (typeof window !== "undefined") {
            return getUserId();
        }
        return "";
    });
    const { memories, loadMemories } = useMemory();

    const {
        messages,
        input,
        handleInputChange,
        handleSubmit: originalHandleSubmit,
        status,
        setMessages,
        append,
    } = useChat({
        api: "/api/chat",
        body: {
            model: currentModel,
            userId: stableUserId, // 🧠 Send stable user ID for memory association
        },
        onFinish: (message, options) => {
            console.log("✅ useChat - onFinish called:", {
                message: message.content.substring(0, 100) + "...",
                usage: options.usage,
                finishReason: options.finishReason,
            });
        },
        onError: (error) => {
            console.error("❌ useChat - onError called:", error);
        },
        onResponse: (response) => {
            console.log("📥 useChat - onResponse called:", {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
            });
        },
        // Add key to force re-initialization when conversation changes
        key: currentConversation?.id || "new-chat",
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Log status changes for debugging
    useEffect(() => {
        console.log("📊 useChat status changed:", status);
    }, [status]);

    // Edit state management
    const [editingMessageId, setEditingMessageId] = useState<string | null>(
        null
    );
    const [editContent, setEditContent] = useState<string>("");

    // Edit handlers
    const handleEditStart = useCallback(
        (messageId: string, content: string) => {
            setEditingMessageId(messageId);
            setEditContent(content);
        },
        []
    );

    const handleEditCancel = useCallback(() => {
        setEditingMessageId(null);
        setEditContent("");
    }, []);

    const handleEditSave = useCallback(
        async (messageId: string) => {
            if (!editContent.trim()) return;

            // Find the index of the message being edited
            const messageIndex = messages.findIndex(
                (msg) => msg.id === messageId
            );
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

            // Manually trigger API call with the updated conversation history
            try {
                const response = await fetch("/api/chat", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        messages: updatedMessages.map((msg) => ({
                            role: msg.role,
                            content: msg.content,
                        })),
                    }),
                });

                if (!response.ok) throw new Error("Failed to get AI response");

                const reader = response.body?.getReader();
                if (!reader) throw new Error("No response body");

                // Create new assistant message
                const assistantMessage = {
                    id: crypto.randomUUID(),
                    role: "assistant" as const,
                    content: "",
                    createdAt: new Date(),
                };

                // Add the assistant message to the updated messages
                setMessages((prev) => [...prev, assistantMessage]);

                // Stream and accumulate the response
                let accumulatedContent = "";
                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split("\n");

                    for (const line of lines) {
                        if (line.startsWith('0:"')) {
                            // Parse AI SDK stream format: 0:"text content"
                            try {
                                const textMatch = line.match(/^0:"(.*)"/);
                                if (textMatch) {
                                    const text = textMatch[1]
                                        .replace(/\\n/g, "\n")
                                        .replace(/\\"/g, '"')
                                        .replace(/\\\\/g, "\\");
                                    accumulatedContent += text;

                                    // Update the assistant message content
                                    setMessages((prev) =>
                                        prev.map((msg) =>
                                            msg.id === assistantMessage.id
                                                ? {
                                                      ...msg,
                                                      content:
                                                          accumulatedContent,
                                                  }
                                                : msg
                                        )
                                    );
                                }
                            } catch (e) {
                                // Skip invalid lines
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Error regenerating response:", error);
            }
        },
        [editContent, messages, setMessages]
    );

    // Enhanced submit handler that includes file attachments
    const handleSubmit = useCallback(
        async (e: FormEvent) => {
            e.preventDefault();
            console.log("🚀 ChatWindow handleSubmit called:", {
                input: input.trim(),
                hasFiles,
                attachments: attachments.length,
                isProcessing,
                status,
            });

            if (!input.trim() && !hasFiles) {
                console.log("❌ Submit blocked: No input and no files");
                return;
            }
            if (isProcessing) {
                console.log("❌ Submit blocked: Currently processing files");
                return;
            }

            // Files are already processed and ready (cloud URLs from Next Cloudinary or local preview URLs)
            const finalAttachments = attachments;

            // Convert our attachments to proper Attachment format for AI SDK
            const attachmentList = await Promise.all(
                finalAttachments
                    .filter((att) => att.file)
                    .map(async (att) => {
                        // Prefer cloud URL if available, otherwise use data URL
                        if (att.url) {
                            console.log(
                                `☁️ Using cloud URL for ${att.name}: ${att.url}`
                            );
                            return {
                                name: att.name,
                                contentType: att.mimeType,
                                url: att.url, // Use Cloudinary URL
                            };
                        } else {
                            // Fallback: Convert File to data URL for OpenAI
                            console.log(
                                `💾 Using local data URL for ${att.name}`
                            );
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
                                url: dataUrl, // Use data URL as fallback
                            };
                        }
                    })
            );

            console.log("📁 Files prepared for AI SDK:", {
                attachmentCount: attachmentList.length,
                attachments: attachmentList.map((a) => ({
                    name: a.name,
                    contentType: a.contentType,
                })),
            });

            // Use AI SDK's native attachment support
            const submitOptions = {
                experimental_attachments:
                    attachmentList.length > 0 ? attachmentList : undefined,
            };

            console.log(
                "📤 Calling originalHandleSubmit with options:",
                submitOptions
            );

            try {
                originalHandleSubmit(e, submitOptions);
                console.log("✅ originalHandleSubmit called successfully");
            } catch (error) {
                console.error("❌ Error in originalHandleSubmit:", error);
            }

            // Clear files after sending
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
            status,
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
            isUpdatingRef.current = true;
            setMessages(currentConversation.messages);
            conversationInitialized.current = currentConversation.id;
            setTimeout(() => {
                isUpdatingRef.current = false;
            }, 100);
        }
    }, [currentConversation?.id, setMessages]);

    // Update conversation when messages change (debounced and protected)
    useEffect(() => {
        if (
            messages.length > 0 &&
            currentConversation &&
            !isUpdatingRef.current &&
            conversationInitialized.current === currentConversation.id
        ) {
            // Debounce updates to prevent rapid fire
            const timeoutId = setTimeout(() => {
                updateCurrentConversation(messages);
            }, 500);

            return () => clearTimeout(timeoutId);
        }
    }, [messages, currentConversation?.id, updateCurrentConversation]);

    return (
        <section className="flex-1 flex flex-col h-full bg-gradient-to-br from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900">
            {/* Header with enhanced styling */}
            <header className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-neutral-800/50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
                <div className="flex items-center">
                    <button
                        onClick={onToggleSidebar}
                        aria-label="Toggle sidebar"
                        className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all duration-200 text-gray-700 dark:text-gray-300 hover:scale-105"
                    >
                        <Menu size={20} />
                    </button>
                    <h1 className="ml-4 font-bold text-xl bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
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
                            
                            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                How can I help you today?
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-12 text-lg">
                                Start a conversation by typing a message below or try one of these suggestions
                            </p>
                            
                            {/* Suggested Prompts */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                {[
                                    "Explain quantum computing in simple terms",
                                    "Write a creative story about space exploration",
                                    "Help me plan a healthy meal prep routine",
                                    "Debug this JavaScript code snippet"
                                ].map((prompt, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            // Set the input value to the prompt
                                            handleInputChange({ target: { value: prompt } } as any);
                                        }}
                                        className="p-4 rounded-2xl border border-gray-200 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-neutral-800 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all duration-200 text-left group hover:shadow-lg transform hover:-translate-y-1"
                                    >
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                            {prompt}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Modern Messages Display - No Bubbles */
                    <div className="flex-1 overflow-y-auto">
                        {messages.map((message, index) => (
                            <div
                                key={message.id}
                                className={`relative animate-slide-in border-b border-gray-100 dark:border-neutral-800/50 last:border-b-0 ${
                                    message.role === "user"
                                        ? "bg-gray-50/50 dark:bg-neutral-900/30"
                                        : "bg-white dark:bg-neutral-950"
                                }`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="max-w-4xl mx-auto px-6 py-6">
                                    <div className="flex gap-4">
                                        {/* Avatar */}
                                        <div className="flex-shrink-0">
                                            {message.role === "assistant" ? (
                                                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                                                    <Bot size={16} className="text-white" />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                                    <User size={16} className="text-white" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Message Content */}
                                        <div className="flex-1 min-w-0 group">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                    {message.role === "assistant" ? "Assistant" : "You"}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>

                                            <div className="text-gray-800 dark:text-gray-200">
                                                {message.role === "user" ? (
                                                    editingMessageId === message.id ? (
                                                        /* Edit mode */
                                                        <div className="space-y-2">
                                                            <textarea
                                                                value={editContent}
                                                                onChange={(e) =>
                                                                    setEditContent(
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="w-full bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-500 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                placeholder="Edit your message..."
                                                                rows={Math.max(
                                                                    2,
                                                                    editContent.split("\n")
                                                                        .length
                                                                )}
                                                                autoFocus
                                                            />
                                                            <div className="flex gap-2 justify-end">
                                                                <button
                                                                    onClick={
                                                                        handleEditCancel
                                                                    }
                                                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-400"
                                                                    aria-label="Cancel edit"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        handleEditSave(
                                                                            message.id
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        !editContent.trim() ||
                                                                        status ===
                                                                            "submitted" ||
                                                                        status ===
                                                                            "streaming"
                                                                    }
                                                                    className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition text-blue-600 dark:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    aria-label="Save edit"
                                                                >
                                                                    <Check size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        /* User message content */
                                                        <div className="relative group">
                                                            <p className="whitespace-pre-wrap">
                                                                {message.content}
                                                            </p>
                                                            
                                                            {/* Response actions for user messages */}
                                                            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                                                <button
                                                                    className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 transition-all duration-200"
                                                                    title="Good response"
                                                                >
                                                                    <ThumbsUp size={16} className="text-green-600 dark:text-green-400" />
                                                                </button>
                                                                <button
                                                                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-all duration-200"
                                                                    title="Bad response"
                                                                >
                                                                    <ThumbsDown size={16} className="text-red-600 dark:text-red-400" />
                                                                </button>
                                                                <button
                                                                    className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all duration-200"
                                                                    title="Regenerate response"
                                                                >
                                                                    <RotateCcw size={16} className="text-blue-600 dark:text-blue-400" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )
                                                ) : (
                                                    /* Assistant message content */
                                                    <div>
                                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                                            <ReactMarkdown>
                                                                {message.content}
                                                            </ReactMarkdown>
                                                        </div>
                                                        
                                                        {/* Response actions for assistant messages */}
                                                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                                            <button
                                                                className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 transition-all duration-200"
                                                                title="Good response"
                                                            >
                                                                <ThumbsUp size={16} className="text-green-600 dark:text-green-400" />
                                                            </button>
                                                            <button
                                                                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-all duration-200"
                                                                title="Bad response"
                                                            >
                                                                <ThumbsDown size={16} className="text-red-600 dark:text-red-400" />
                                                            </button>
                                                            <button
                                                                className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all duration-200"
                                                                title="Regenerate response"
                                                            >
                                                                <RotateCcw size={16} className="text-blue-600 dark:text-blue-400" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                                    {message.role === "user" ? (
                                        editingMessageId === message.id ? (
                                            /* Edit mode */
                                            <div className="space-y-2">
                                                <textarea
                                                    value={editContent}
                                                    onChange={(e) =>
                                                        setEditContent(
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full bg-blue-600 text-white placeholder-blue-200 border border-blue-400 rounded px-2 py-1 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                                                    placeholder="Edit your message..."
                                                    rows={Math.max(
                                                        2,
                                                        editContent.split("\n")
                                                            .length
                                                    )}
                                                    autoFocus
                                                />
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={
                                                            handleEditCancel
                                                        }
                                                        className="p-1 rounded hover:bg-blue-600 transition text-blue-200 hover:text-white"
                                                        aria-label="Cancel edit"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleEditSave(
                                                                message.id
                                                            )
                                                        }
                                                        disabled={
                                                            !editContent.trim() ||
                                                            status ===
                                                                "submitted" ||
                                                            status ===
                                                                "streaming"
                                                        }
                                                        className="p-1 rounded hover:bg-blue-600 transition text-blue-200 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                                        aria-label="Save edit"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* View mode */
                                            <div className="relative">
                                                <p className="whitespace-pre-wrap pr-8">
                                                    {message.content}
                                                </p>

                                                {/* Render attachments for user messages */}
                                                {(message as any)
                                                    .experimental_attachments && (
                                                    <div className="mt-2 space-y-2">
                                                        {(
                                                            message as any
                                                        ).experimental_attachments
                                                            .filter(
                                                                (att: any) =>
                                                                    att.contentType?.startsWith(
                                                                        "image/"
                                                                    )
                                                            )
                                                            .map(
                                                                (
                                                                    att: any,
                                                                    index: number
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="relative group"
                                                                    >
                                                                        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 max-w-sm">
                                                                            <img
                                                                                src={
                                                                                    att.url
                                                                                }
                                                                                alt={
                                                                                    att.name ||
                                                                                    "Uploaded image"
                                                                                }
                                                                                className="w-full h-auto object-cover"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )
                                                            )}
                                                    </div>
                                                )}

                                                {/* Render legacy attachments for backward compatibility */}
                                                {(message as ChatMessage)
                                                    .attachments && (
                                                    <AttachmentBubble
                                                        attachments={
                                                            (
                                                                message as ChatMessage
                                                            ).attachments!
                                                        }
                                                        isUserMessage={true}
                                                    />
                                                )}

                                                {status !== "submitted" &&
                                                    status !== "streaming" && (
                                                        <button
                                                            onClick={() =>
                                                                handleEditStart(
                                                                    message.id,
                                                                    message.content
                                                                )
                                                            }
                                                            className="absolute top-0 right-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600"
                                                            aria-label="Edit message"
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                    )}
                                            </div>
                                        )
                                    ) : (
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <ReactMarkdown
                                                components={{
                                                    p: ({ children }) => (
                                                        <p className="mb-2 last:mb-0">
                                                            {children}
                                                        </p>
                                                    ),
                                                    code: ({ children }) => (
                                                        <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">
                                                            {children}
                                                        </code>
                                                    ),
                                                    pre: ({ children }) => (
                                                        <pre className="bg-gray-200 dark:bg-gray-700 p-3 rounded-lg overflow-x-auto">
                                                            {children}
                                                        </pre>
                                                    ),
                                                }}
                                            >
                                                {message.content}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </div>

                                {message.role === "user" && (
                                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                                        <User
                                            size={20}
                                            className="text-white"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}

                        {(status === "submitted" || status === "streaming") && (
                            <div className="flex gap-3 justify-start">
                                <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                    <Bot size={18} className="text-white" />
                                </div>
                                <div className="bg-gray-100 dark:bg-neutral-800 rounded-lg px-4 py-2">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div
                                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                            style={{ animationDelay: "0.1s" }}
                                        ></div>
                                        <div
                                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                            style={{ animationDelay: "0.2s" }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                )}

                {/* Chat input - moves to bottom when messages exist */}
                <div
                    className={`border-t border-gray-200 dark:border-neutral-800 ${
                        messages.length === 0 ? "max-w-4xl mx-auto w-full" : ""
                    }`}
                >
                    {/* File upload errors */}
                    {errors.length > 0 && (
                        <div className="px-4 pt-2">
                            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-sm font-medium text-red-800 dark:text-red-400">
                                            Upload Errors
                                        </h4>
                                        <ul className="mt-1 text-sm text-red-700 dark:text-red-300 list-disc list-inside">
                                            {errors.map((error, index) => (
                                                <li key={index}>{error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <button
                                        onClick={clearErrors}
                                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
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

                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="relative">
                            <div className="relative flex items-center bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-lg hover:shadow-xl transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
                                {/* File upload button */}
                                {useNextCloudinary ? (
                                    <div className="pl-4">
                                        <NextCloudinaryUpload
                                            onFileSelect={handleFileSelect}
                                            isProcessing={isProcessing}
                                            canUpload={canUpload}
                                            capabilities={capabilities}
                                            onUploadSuccess={(result) => {
                                                console.log(
                                                    "🎉 Next Cloudinary upload completed:",
                                                    result
                                                );
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="pl-4">
                                        <FileUploadButton
                                            onFileSelect={handleFileSelect}
                                            isProcessing={isProcessing}
                                            canUpload={canUpload}
                                            capabilities={capabilities}
                                        />
                                    </div>
                                )}

                                <input
                                    value={input}
                                    onChange={handleInputChange}
                                    type="text"
                                    className="flex-1 px-4 py-4 bg-transparent focus:outline-none resize-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                                    placeholder={
                                        hasFiles
                                            ? "Add a message (optional)..."
                                            : "Message ChatGPT..."
                                    }
                                    disabled={
                                        status === "submitted" ||
                                        status === "streaming"
                                    }
                                />
                                <button
                                    type="submit"
                                    disabled={
                                        status === "submitted" ||
                                        status === "streaming" ||
                                        (!input.trim() && !hasFiles) ||
                                        isProcessing
                                    }
                                    className="mr-3 p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                                >
                                    {status === "submitted" || status === "streaming" ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <Send size={20} />
                                    )}
                                </button>
                            </div>
                        </form>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
                            <span className="inline-flex items-center gap-1">
                                ⚡ ChatGPT can make mistakes. Check important info.
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
