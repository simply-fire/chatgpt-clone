import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import {
    getRelevantMemories,
    addConversationMemory,
    formatMemoriesForContext,
    getUserId,
} from "../../utils/mem0Client";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    console.log("🔄 API Route: POST request received");

    try {
        const {
            messages,
            model = "gpt-4o",
            userId: clientUserId,
        } = await req.json();

        // Get or generate user ID for memory association
        const userId = clientUserId || getUserId();

        console.log("📥 API Route - Received:", {
            model,
            userId,
            messageCount: messages.length,
            lastMessage: messages[messages.length - 1],
            allMessages: messages.map((m: any) => ({
                role: m.role,
                content:
                    typeof m.content === "string"
                        ? m.content.substring(0, 100) + "..."
                        : "non-string content",
                hasAttachments: m.experimental_attachments
                    ? m.experimental_attachments.length
                    : 0,
                attachmentDetails: m.experimental_attachments
                    ? m.experimental_attachments.map((att: any) => ({
                        name: att.name,
                        contentType: att.contentType,
                        hasUrl: !!att.url,
                        urlType: att.url
                            ? att.url.startsWith("data:")
                                ? "data"
                                : "http"
                            : "none",
                    }))
                    : [],
            })),
        });

        // 🧠 MEM0 INTEGRATION: Get relevant memories instead of token trimming
        const lastUserMessage =
            messages.filter((m: any) => m.role === "user").pop()?.content || "";

        console.log("🧠 Mem0: Searching for relevant memories...");
        const relevantMemories = await getRelevantMemories(
            lastUserMessage,
            userId
        );

        // Format memories for context injection
        const memoryContext = formatMemoriesForContext(relevantMemories);

        console.log("🧠 Mem0: Memory context prepared:", {
            memoriesFound: relevantMemories.length,
            contextLength: memoryContext.length,
        });

        // Inject memory context as system message
        const enhancedMessages = [
            {
                role: "system" as const,
                content: `You are a helpful AI assistant. Here is relevant context from previous conversations with this user:

${memoryContext}

Use this context to provide personalized, contextual responses. If the context is relevant, acknowledge what you remember about the user. If not directly relevant, focus on the current question.`,
            },
            ...messages,
        ];

        console.log(
            "📤 API Route - Calling streamText with OpenAI and memory context..."
        );

        try {
            const result = await streamText({
                model: openai(model),
                messages: enhancedMessages,
                temperature: 0.7,
                maxTokens: 1000,
            });

            console.log("✅ API Route - streamText created successfully");

            // 🧠 MEM0 INTEGRATION: Store conversation memory after successful response
            console.log("🧠 Mem0: Storing conversation memory...");
            await addConversationMemory(messages, userId);

            return result.toDataStreamResponse();
        } catch (error) {
            console.error("❌ API Route - Error in streamText:", error);

            // Return a proper error response
            return new Response(
                JSON.stringify({
                    error: "Failed to process chat request",
                    details:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }
    } catch (requestError) {
        console.error("❌ API Route - Error parsing request:", requestError);

        return new Response(
            JSON.stringify({
                error: "Invalid request format",
                details:
                    requestError instanceof Error
                        ? requestError.message
                        : "Unknown error",
            }),
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}
