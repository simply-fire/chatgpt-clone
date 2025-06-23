// Sidebar.tsx
// Enhanced sidebar with conversation management and modern design
"use client";

import {
    PlusCircle,
    Search,
    BookOpen,
    Menu,
    X,
    MessageSquare,
    MoreHorizontal,
    Trash2,
    Edit2,
    Clock,
    Sparkles,
} from "lucide-react";
import { useConversations } from "../../app/contexts/ConversationContext";
import { useState } from "react";

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
    const {
        conversations,
        currentConversation,
        createConversation,
        loadConversation,
        deleteConversationById,
        renameConversation,
    } = useConversations();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState<string>("");

    const handleNewChat = () => {
        createConversation();
        // Close sidebar on mobile after creating new chat
        if (window.innerWidth < 1024) {
            onToggle();
        }
    };

    const handleLoadConversation = (conversationId: string) => {
        loadConversation(conversationId);
        // Close sidebar on mobile after loading conversation
        if (window.innerWidth < 1024) {
            onToggle();
        }
    };

    const handleEditStart = (id: string, title: string) => {
        setEditingId(id);
        setEditTitle(title);
    };

    const handleEditSave = () => {
        if (editingId && editTitle.trim()) {
            renameConversation(editingId, editTitle.trim());
        }
        setEditingId(null);
        setEditTitle("");
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditTitle("");
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return "Today";
        if (diffDays === 2) return "Yesterday";
        if (diffDays <= 7) return `${diffDays - 1} days ago`;
        return date.toLocaleDateString();
    };

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={onToggle}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        fixed lg:relative z-50 lg:z-auto
        w-64 h-full bg-sidebar-bg border-r border-border
        transition-transform duration-300 ease-in-out lg:translate-x-0
        flex flex-col
      `}
            >
                {/* Header */}
                <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
                                <Sparkles size={16} className="text-white" />
                            </div>
                            <h2 className="font-semibold text-foreground">ChatGPT</h2>
                        </div>
                        <button
                            onClick={onToggle}
                            className="lg:hidden p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <X size={18} />
                        </button>
                    </div>
                    
                    {/* New Chat Button */}
                    <button
                        onClick={handleNewChat}
                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        <PlusCircle size={18} />
                        <span className="font-medium">New Chat</span>
                    </button>
                </div> 
        flex flex-col transition-transform duration-300 ease-in-out
        lg:${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
            >
                {/* Header with toggle */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-800">
                    <div className="font-bold text-lg text-gray-800 dark:text-gray-200">
                        ChatGPT Clone
                    </div>
                    <button
                        onClick={onToggle}
                        aria-label="Close sidebar"
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-neutral-800 transition text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Fixed Options */}
                <nav className="p-4 space-y-2">
                    <button
                        onClick={handleNewChat}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-neutral-800 transition text-left"
                    >
                        <PlusCircle size={18} />
                        <span>New Chat</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-neutral-800 transition text-left">
                        <Search size={18} />
                        <span>Search Chat</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-neutral-800 transition text-left">
                        <BookOpen size={18} />
                        <span>Library</span>
                    </button>
                </nav>

                {/* Chat History */}
                <div className="flex-1 p-4 pt-0 overflow-y-auto">
                    <div className="text-xs text-gray-400 mb-3 font-semibold">
                        Recent Chats
                    </div>

                    {conversations.length === 0 ? (
                        <div className="text-xs text-gray-400">
                            No conversations yet
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {conversations.map((conversation) => (
                                <div
                                    key={conversation.id}
                                    className={`group relative rounded-lg transition-colors ${
                                        currentConversation?.id ===
                                        conversation.id
                                            ? "bg-gray-200 dark:bg-neutral-800"
                                            : "hover:bg-gray-100 dark:hover:bg-neutral-800/50"
                                    }`}
                                >
                                    {editingId === conversation.id ? (
                                        <div className="p-2">
                                            <input
                                                type="text"
                                                value={editTitle}
                                                onChange={(e) =>
                                                    setEditTitle(e.target.value)
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter")
                                                        handleEditSave();
                                                    if (e.key === "Escape")
                                                        handleEditCancel();
                                                }}
                                                onBlur={handleEditSave}
                                                className="w-full px-2 py-1 text-sm bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                autoFocus
                                            />
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() =>
                                                handleLoadConversation(
                                                    conversation.id
                                                )
                                            }
                                            className="w-full p-2 text-left"
                                        >
                                            <div className="flex items-start gap-2">
                                                <MessageSquare
                                                    size={16}
                                                    className="mt-0.5 text-gray-400 flex-shrink-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                                        {conversation.title}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {formatDate(
                                                            conversation.updatedAt
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    )}

                                    {/* Action buttons - only show on hover and not when editing */}
                                    {editingId !== conversation.id && (
                                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditStart(
                                                        conversation.id,
                                                        conversation.title
                                                    );
                                                }}
                                                className="p-1 rounded hover:bg-gray-300 dark:hover:bg-neutral-700 transition"
                                                title="Rename conversation"
                                            >
                                                <Edit2
                                                    size={12}
                                                    className="text-gray-500"
                                                />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (
                                                        confirm(
                                                            "Delete this conversation?"
                                                        )
                                                    ) {
                                                        deleteConversationById(
                                                            conversation.id
                                                        );
                                                    }
                                                }}
                                                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition"
                                                title="Delete conversation"
                                            >
                                                <Trash2
                                                    size={12}
                                                    className="text-red-500"
                                                />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
