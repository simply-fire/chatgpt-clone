"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import { useConversations } from "./contexts/ConversationContext";

export default function Home() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { isLoading } = useConversations();

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                        <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-sm font-medium text-foreground">
                            Loading conversations...
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Setting up your AI assistant
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-background text-foreground">
            {/* Sidebar with smooth width transition */}
            <div
                className={`transition-all duration-300 ease-in-out ${
                    isSidebarOpen ? "w-64" : "w-0"
                } lg:block hidden overflow-hidden`}
            >
                <Sidebar
                    isOpen={isSidebarOpen}
                    onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                />
            </div>

            {/* Mobile Sidebar Overlay */}
            <div className="lg:hidden">
                <Sidebar
                    isOpen={isSidebarOpen}
                    onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                />
            </div>

            {/* Main Chat Window - automatically expands when sidebar closes */}
            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
                <ChatWindow
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                />
            </div>
        </div>
    );
}
