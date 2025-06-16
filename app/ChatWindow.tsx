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
    const { currentConversation, updateCurrentConversation } =
        useConversations();
    const isUpdatingRef = useRef(false);
    const conversationInitialized = useRef<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
            console.log("🤖 Chat API Response received:", response.status);
        },
        onFinish: (message) => {
            console.log("✅ Chat finished, updating conversation");
        },
    });

    // Memory integration
    // const { addMemory, searchMemories } = useMemory();

    // Edit state for messages
    const [editingMessageId, setEditingMessageId] = useState<string | null>(
        null
    );
    const [editContent, setEditContent] = useState<string>("");

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
                                                    <Bot
                                                        size={16}
                                                        className="text-white"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                                    <User
                                                        size={16}
                                                        className="text-white"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Message Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                    {message.role ===
                                                    "assistant"
                                                        ? "Assistant"
                                                        : "You"}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {new Date().toLocaleTimeString(
                                                        [],
                                                        {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        }
                                                    )}
                                                </span>
                                            </div>

                                            <div className="text-gray-800 dark:text-gray-200">
                                                {message.role === "user" ? (
                                                    editingMessageId ===
                                                    message.id ? (
                                                        /* Edit mode */
                                                        <div className="space-y-2">
                                                            <textarea
                                                                value={
                                                                    editContent
                                                                }
                                                                onChange={(e) =>
                                                                    setEditContent(
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                className="w-full bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-500 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-400"
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
                                                                        status ===
                                                                            "submitted" ||
                                                                        status ===
                                                                            "streaming"
                                                                    }
                                                                    className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition text-blue-600 dark:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                            <p className="whitespace-pre-wrap mb-3">
                                                                {
                                                                    message.content
                                                                }
                                                            </p>

                                                            {/* Edit button for user messages */}
                                                            {status !==
                                                                "submitted" &&
                                                                status !==
                                                                    "streaming" && (
                                                                    <button
                                                                        onClick={() =>
                                                                            handleEditStart(
                                                                                message.id,
                                                                                message.content
                                                                            )
                                                                        }
                                                                        className="absolute top-0 right-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200 dark:hover:bg-gray-700"
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
                                                    )
                                                ) : (
                                                    /* Assistant message content */
                                                    <div className="prose prose-sm dark:prose-invert max-w-none mb-3">
                                                        <ReactMarkdown
                                                            components={{
                                                                p: ({
                                                                    children,
                                                                }) => (
                                                                    <p className="mb-2 last:mb-0">
                                                                        {
                                                                            children
                                                                        }
                                                                    </p>
                                                                ),
                                                                code: ({
                                                                    children,
                                                                }) => (
                                                                    <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">
                                                                        {
                                                                            children
                                                                        }
                                                                    </code>
                                                                ),
                                                                pre: ({
                                                                    children,
                                                                }) => (
                                                                    <pre className="bg-gray-200 dark:bg-gray-700 p-3 rounded-lg overflow-x-auto">
                                                                        {
                                                                            children
                                                                        }
                                                                    </pre>
                                                                ),
                                                            }}
                                                        >
                                                            {message.content}
                                                        </ReactMarkdown>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Response actions */}
                                            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 transition-all duration-200"
                                                    title="Good response"
                                                >
                                                    <ThumbsUp
                                                        size={16}
                                                        className="text-green-600 dark:text-green-400"
                                                    />
                                                </button>
                                                <button
                                                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-all duration-200"
                                                    title="Bad response"
                                                >
                                                    <ThumbsDown
                                                        size={16}
                                                        className="text-red-600 dark:text-red-400"
                                                    />
                                                </button>
                                                <button
                                                    className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all duration-200"
                                                    title="Regenerate response"
                                                >
                                                    <RotateCcw
                                                        size={16}
                                                        className="text-blue-600 dark:text-blue-400"
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {(status === "submitted" || status === "streaming") && (
                            <div className="border-b border-gray-100 dark:border-neutral-800/50 bg-white dark:bg-neutral-950">
                                <div className="max-w-4xl mx-auto px-6 py-6">
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                                            <Bot
                                                size={16}
                                                className="text-white"
                                            />
                                        </div>
                                        <div className="flex items-center">
                                            <div className="flex space-x-1">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                <div
                                                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                                    style={{
                                                        animationDelay: "0.1s",
                                                    }}
                                                ></div>
                                                <div
                                                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
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
                <div className="border-t border-gray-200 dark:border-neutral-800">
                    {/* File upload errors */}
                    {errors.length > 0 && (
                        <div className="px-6 pt-4">
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
                                            canUpload={true}
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
                                            canUpload={true}
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
                                    {status === "submitted" ||
                                    status === "streaming" ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <Send size={20} />
                                    )}
                                </button>
                            </div>
                        </form>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                            ChatGPT can make mistakes. Check important info.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
