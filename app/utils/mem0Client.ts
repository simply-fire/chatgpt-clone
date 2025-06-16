// Mem0 Client Integration for intelligent memory management
import MemoryClient from "mem0ai";
import type { Message } from "ai";
import {
    MemoryOptions,
    SearchOptions,
    Memory,
    MemorySearchResult,
    MemoryResponse,
} from "../types/memory";

// Initialize Mem0 client
const getMemoryClient = () => {
    const apiKey = process.env.MEM0_API_KEY;
    if (!apiKey) {
        console.warn("⚠️ MEM0_API_KEY not found in environment variables");
        return null;
    }
    // Fix: Use correct MemoryClient constructor
    return new MemoryClient({ apiKey });
};

const memoryClient = getMemoryClient();

/**
 * Add conversation memories to Mem0
 * Stores both user and assistant messages for learning
 */
export async function addConversationMemory(
    messages: Message[],
    userId: string,
    conversationId?: string
): Promise<MemoryResponse | null> {
    if (!memoryClient) return null;

    try {
        console.log("🧠 Mem0: Adding conversation memory...", {
            userId,
            conversationId,
            messageCount: messages.length,
        });

        // Filter and convert messages to Mem0 format
        const mem0Messages = messages
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map((m) => ({
                role: m.role as "user" | "assistant",
                content:
                    typeof m.content === "string"
                        ? m.content
                        : JSON.stringify(m.content),
            }));

        const memoryOptions: any = {
            user_id: userId,
            metadata: {
                timestamp: new Date().toISOString(),
                conversation_id: conversationId,
                model: "gpt-4o",
                message_count: messages.length,
            },
        };

        // Add run_id for session-specific memories if provided
        if (conversationId) {
            memoryOptions.run_id = conversationId;
        }

        const result = await memoryClient.add(mem0Messages, memoryOptions);

        console.log("✅ Mem0: Memory added successfully", result);
        return {
            results: Array.isArray(result) ? (result as any[]) : [],
            success: true,
            message: "Memory added successfully",
        };
    } catch (error) {
        console.error("❌ Mem0: Error adding memory:", error);
        return {
            results: [],
            success: false,
            message: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Search for relevant memories based on user query
 * Returns semantically similar memories for context injection
 */
export async function getRelevantMemories(
    query: string,
    userId: string,
    options: Partial<SearchOptions> = {}
): Promise<any[]> {
    if (!memoryClient) return [];

    try {
        console.log("🔍 Mem0: Searching for relevant memories...", {
            query: query.substring(0, 100) + "...",
            userId,
            options,
        });

        const searchOptions: any = {
            user_id: userId,
            limit: 5,
            threshold: 0.1, // 🔧 Lowered from 0.7 to 0.1 for better memory retrieval
            ...options,
        };

        const results = await memoryClient.search(query, searchOptions);

        console.log("📋 Mem0: Found relevant memories:", {
            count: results?.length || 0,
            memories:
                results?.slice(0, 3).map((r: any) => ({
                    id: r.id,
                    score: r.score,
                    text:
                        r.memory?.substring(0, 50) + "..." ||
                        r.text?.substring(0, 50) + "...",
                })) || [],
        });

        return results || [];
    } catch (error) {
        console.error("❌ Mem0: Error searching memories:", error);
        return [];
    }
}

/**
 * Get all memories for a specific user
 * Useful for memory management and analytics
 */
export async function getUserMemories(
    userId: string,
    page: number = 1,
    pageSize: number = 50
): Promise<any[]> {
    if (!memoryClient) return [];

    try {
        console.log("📊 Mem0: Getting user memories...", {
            userId,
            page,
            pageSize,
        });

        const result = await memoryClient.getAll({
            user_id: userId,
            page,
            page_size: pageSize,
        });

        console.log("📋 Mem0: Retrieved user memories:", {
            count: Array.isArray(result) ? result.length : 0,
        });

        return Array.isArray(result) ? result : [];
    } catch (error) {
        console.error("❌ Mem0: Error getting user memories:", error);
        return [];
    }
}

/**
 * Delete specific memory by ID
 */
export async function deleteMemory(memoryId: string): Promise<boolean> {
    if (!memoryClient) return false;

    try {
        console.log("🗑️ Mem0: Deleting memory...", { memoryId });

        await memoryClient.delete(memoryId);

        console.log("✅ Mem0: Memory deleted successfully");
        return true;
    } catch (error) {
        console.error("❌ Mem0: Error deleting memory:", error);
        return false;
    }
}

/**
 * Delete all memories for a user
 */
export async function deleteUserMemories(userId: string): Promise<boolean> {
    if (!memoryClient) return false;

    try {
        console.log("🗑️ Mem0: Deleting all user memories...", { userId });

        await memoryClient.deleteAll({ user_id: userId });

        console.log("✅ Mem0: All user memories deleted successfully");
        return true;
    } catch (error) {
        console.error("❌ Mem0: Error deleting user memories:", error);
        return false;
    }
}

/**
 * Format memories for context injection into AI prompts
 */
export function formatMemoriesForContext(memories: any[]): string {
    if (!memories || memories.length === 0) {
        return "No relevant user context available.";
    }

    const formattedMemories = memories
        .slice(0, 5) // Limit to top 5 most relevant
        .map((result, index) => {
            // Handle different memory result formats
            const memory = result.memory || result.text || result;
            const score = result.score || 1;
            const text =
                typeof memory === "string"
                    ? memory
                    : memory.text || JSON.stringify(memory);

            return `${index + 1}. ${text} (Relevance: ${(score * 100).toFixed(
                1
            )}%)`;
        })
        .join("\n");

    return `User Context (from past conversations):\n${formattedMemories}`;
}

/**
 * Generate a robust device fingerprint for user identification
 * Works across sessions and can be used as NoSQL database key
 */
function generateDeviceFingerprint(): string {
    if (typeof window === "undefined") return "server-device";

    // Collect stable device characteristics
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx!.textBaseline = "top";
    ctx!.font = "14px Arial";
    ctx!.fillText("Device fingerprint", 2, 2);

    const fingerprint = {
        // Hardware characteristics
        screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform,
        userAgent: navigator.userAgent.slice(0, 100), // Truncated for stability
        canvas: canvas.toDataURL().slice(-50), // Canvas fingerprint sample

        // Browser characteristics
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        maxTouchPoints: navigator.maxTouchPoints,
        hardwareConcurrency: navigator.hardwareConcurrency,
    };

    // Create stable hash from fingerprint
    const fingerprintString = JSON.stringify(fingerprint);
    let hash = 0;
    for (let i = 0; i < fingerprintString.length; i++) {
        const char = fingerprintString.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    return `fp_${Math.abs(hash).toString(36)}`;
}

/**
 * Generate or retrieve a robust persistent user ID
 * Combines device fingerprinting with UUID backup for stability
 * Perfect for NoSQL database keys (MongoDB ObjectId compatible)
 *
 * ID Format: usr_[timestamp]_[fingerprint]_[random]
 * Example: usr_lxk8m2_fp_2k9j1m_a4b8c2
 */
export function getUserId(): string {
    if (typeof window === "undefined") return "server-user";

    const STORAGE_KEY = "chatgpt_user_id";
    const FINGERPRINT_KEY = "chatgpt_device_fp";

    // Try to get existing stable ID
    let userId = localStorage.getItem(STORAGE_KEY);
    let storedFingerprint = localStorage.getItem(FINGERPRINT_KEY);

    // Generate current device fingerprint
    const currentFingerprint = generateDeviceFingerprint();

    // If no user ID or fingerprint changed significantly, create new ID
    if (!userId || !storedFingerprint) {
        // Create new stable ID: timestamp + fingerprint + random
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        userId = `usr_${timestamp}_${currentFingerprint}_${random}`;

        localStorage.setItem(STORAGE_KEY, userId);
        localStorage.setItem(FINGERPRINT_KEY, currentFingerprint);

        console.log("🆔 Generated new robust user ID:", userId);
        console.log("🔍 Device fingerprint:", currentFingerprint);
    } else {
        // Verify fingerprint stability (allow minor variations)
        if (storedFingerprint !== currentFingerprint) {
            console.log("🔄 Device fingerprint changed:", {
                stored: storedFingerprint,
                current: currentFingerprint,
            });
            // Update fingerprint but keep same user ID for continuity
            localStorage.setItem(FINGERPRINT_KEY, currentFingerprint);
        }
    }

    return userId;
}

/**
 * Legacy function - keeping for backward compatibility
 * @deprecated Use getUserId() instead
 */
export function generateUserId(): string {
    return getUserId();
}

export { memoryClient };
