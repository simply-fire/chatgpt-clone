// React hook for managing memory operations in the chat interface
import { useState, useEffect } from "react";
import {
    getUserId,
    getUserMemories,
    deleteMemory,
    deleteUserMemories,
} from "../utils/mem0Client";
import type { Memory } from "../types/memory";

export function useMemory() {
    const [userId, setUserId] = useState<string>(() => {
        // Initialize with the user ID immediately to prevent empty string
        if (typeof window !== "undefined") {
            return getUserId();
        }
        return "";
    });
    const [memories, setMemories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize user ID on component mount only if not already set
    // REMOVED: This useEffect was causing infinite loops in useChat
    // useEffect(() => {
    //     if (!userId && typeof window !== 'undefined') {
    //         const id = getUserId();
    //         setUserId(id);
    //         console.log("🆔 Memory Hook: User ID initialized:", id);
    //     }
    // }, [userId]);

    // Load user memories
    const loadMemories = async (page: number = 1, pageSize: number = 50) => {
        if (!userId) return;

        setIsLoading(true);
        setError(null);

        try {
            console.log("📋 Memory Hook: Loading memories...", {
                userId,
                page,
                pageSize,
            });
            const userMemories = await getUserMemories(userId, page, pageSize);
            setMemories(userMemories);
            console.log(
                "✅ Memory Hook: Memories loaded:",
                userMemories.length
            );
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Failed to load memories";
            setError(errorMessage);
            console.error("❌ Memory Hook: Error loading memories:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Delete a specific memory
    const removeMemory = async (memoryId: string) => {
        try {
            console.log("🗑️ Memory Hook: Deleting memory...", { memoryId });
            const success = await deleteMemory(memoryId);

            if (success) {
                // Remove from local state
                setMemories((prev) => prev.filter((m) => m.id !== memoryId));
                console.log("✅ Memory Hook: Memory deleted successfully");
            } else {
                throw new Error("Failed to delete memory");
            }
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Failed to delete memory";
            setError(errorMessage);
            console.error("❌ Memory Hook: Error deleting memory:", err);
        }
    };

    // Clear all user memories
    const clearAllMemories = async () => {
        if (!userId) return;

        try {
            console.log("🗑️ Memory Hook: Clearing all memories...", { userId });
            const success = await deleteUserMemories(userId);

            if (success) {
                setMemories([]);
                console.log(
                    "✅ Memory Hook: All memories cleared successfully"
                );
            } else {
                throw new Error("Failed to clear all memories");
            }
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Failed to clear memories";
            setError(errorMessage);
            console.error("❌ Memory Hook: Error clearing memories:", err);
        }
    };

    // Refresh memories
    const refreshMemories = () => {
        loadMemories();
    };

    // Get memory statistics
    const getMemoryStats = () => {
        const totalMemories = memories.length;
        const categories = new Set(memories.flatMap((m) => m.categories || []))
            .size;
        const recentMemories = memories.filter((m) => {
            const memoryDate = new Date(m.created_at);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return memoryDate > weekAgo;
        }).length;

        return {
            total: totalMemories,
            categories,
            recent: recentMemories,
        };
    };

    return {
        userId,
        memories,
        isLoading,
        error,
        loadMemories,
        removeMemory,
        clearAllMemories,
        refreshMemories,
        getMemoryStats,
    };
}
