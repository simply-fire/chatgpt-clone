// Memory-related TypeScript interfaces for Mem0 integration

export interface MemoryOptions {
    user_id?: string;
    agent_id?: string;
    run_id?: string;
    metadata?: Record<string, any>;
}

export interface SearchOptions {
    user_id?: string;
    agent_id?: string;
    run_id?: string;
    limit?: number;
    threshold?: number;
    categories?: string[];
    filters?: Record<string, any>;
    api_version?: "v1" | "v2";
}

export interface Memory {
    id: string;
    text: string;
    user_id?: string;
    agent_id?: string;
    run_id?: string;
    categories?: string[];
    metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;
    score?: number;
}

export interface MemorySearchResult {
    id: string;
    memory: Memory;
    score: number;
}

export interface MemoryResponse {
    results: Memory[];
    success: boolean;
    message?: string;
}

export interface UserContext {
    id: string;
    preferences: Record<string, any>;
    conversation_style?: string;
    topics_of_interest?: string[];
    last_seen?: string;
}

export interface ConversationMemory {
    conversationId: string;
    userId: string;
    memories: Memory[];
    summary?: string;
    key_topics?: string[];
}
