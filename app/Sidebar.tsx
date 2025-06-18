// Sidebar.tsx
// Enhanced sidebar with conversation management
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
} from "lucide-react";
import { useConversations } from "./contexts/ConversationContext";
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
            {/* Mobile overlay - only on small screens */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onToggle}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        fixed lg:relative z-50 lg:z-auto
        w-64 h-full bg-[#181818]
        border-r border-[#3a3a3a]
        flex flex-col transition-transform duration-300 ease-in-out
        shadow-xl lg:shadow-none
      `}
            >
                {/* Header with minimal styling */}
                <div className="p-6 border-b border-[#3a3a3a]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                                <div className="w-6 h-6 rounded-md flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">
                                        AI
                                    </span>
                                </div>
                            </div>
                            <div>
                                <h2 className="text-[#f5f5f5] font-bold text-lg">
                                    ChatGPT
                                </h2>
                                <p className="text-[#b4b4b4] text-xs">
                                    AI Assistant
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onToggle}
                            aria-label="Close sidebar"
                            className="p-2 rounded-lg hover:bg-white/10 transition text-[#e5e5e5] hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* New Chat Button - Minimal */}
                    <button
                        onClick={handleNewChat}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#2a2a2a] text-[#f5f5f5] hover:bg-[#3a3a3a] transition-all duration-200"
                    >
                        <PlusCircle size={18} />
                        <span className="font-medium">New Chat</span>
                    </button>
                </div>
                {/* Fixed Options */}
                <nav className="p-4 space-y-2">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#2a2a2a] transition text-left text-[#e5e5e5]">
                        <Search size={18} />
                        <span>Search Chat</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#2a2a2a] transition text-left text-[#e5e5e5]">
                        <BookOpen size={18} />
                        <span>Library</span>
                    </button>
                </nav>

                {/* Chat History */}
                <div className="flex-1 p-4 pt-0 overflow-y-auto">
                    <div className="text-xs text-[#a0a0a0] mb-3 font-semibold uppercase tracking-wider">
                        Recent Chats
                    </div>

                    {conversations.length === 0 ? (
                        <div className="text-sm text-[#a0a0a0] text-center py-8">
                            <MessageSquare
                                size={24}
                                className="mx-auto mb-2 opacity-50"
                            />
                            No conversations yet
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {conversations.map((conversation) => (
                                <div
                                    key={conversation.id}
                                    className={`group relative rounded-xl transition-all duration-200 ${
                                        currentConversation?.id ===
                                        conversation.id
                                            ? "bg-[#2a2a2a]"
                                            : "hover:bg-[#2a2a2a]/50"
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
                                                className="w-full px-2 py-1 text-sm bg-[#2a2a2a] text-[#e5e5e5] border border-[#525252] rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                            className="w-full p-3 text-left hover:bg-transparent"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                                    <MessageSquare
                                                        size={16}
                                                        className="text-white"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-[#f5f5f5] truncate mb-1">
                                                        {conversation.title}
                                                    </div>
                                                    <div className="text-xs text-[#a0a0a0]">
                                                        {formatDate(
                                                            conversation.updatedAt
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    )}

                                    {/* Action buttons - enhanced hover states */}
                                    {editingId !== conversation.id && (
                                        <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditStart(
                                                        conversation.id,
                                                        conversation.title
                                                    );
                                                }}
                                                className="p-2 rounded-lg hover:bg-[#3a3a3a] transition-all duration-200"
                                                title="Rename conversation"
                                            >
                                                <Edit2
                                                    size={14}
                                                    className="text-[#a0a0a0] hover:text-[#e5e5e5]"
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
                                                className="p-2 rounded-lg hover:bg-[#3a3a3a] transition-all duration-200"
                                                title="Delete conversation"
                                            >
                                                <Trash2
                                                    size={14}
                                                    className="text-[#a0a0a0] hover:text-red-400"
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
