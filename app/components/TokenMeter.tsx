"use client";

import { AlertTriangle, Info } from "lucide-react";
import { useEffect, useState } from "react";
import {
    countMessagesTokens,
    getTokenStats,
    type ChatMessage,
} from "../utils/tokenUtils";

interface TokenMeterProps {
    messages: ChatMessage[];
    maxTokens?: number;
}

export default function TokenMeter({
    messages,
    maxTokens = 3500,
}: TokenMeterProps) {
    const [stats, setStats] = useState<ReturnType<typeof getTokenStats> | null>(
        null
    );
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        if (messages.length > 0) {
            const tokenStats = getTokenStats(messages, maxTokens);
            setStats(tokenStats);
        } else {
            setStats(null);
        }
    }, [messages, maxTokens]);

    if (!stats || messages.length === 0) {
        return null;
    }

    const getColorClass = (percent: number) => {
        if (percent >= 90) return "text-red-500";
        if (percent >= 70) return "text-yellow-500";
        return "text-green-500";
    };

    const getBarColorClass = (percent: number) => {
        if (percent >= 90) return "bg-red-500";
        if (percent >= 70) return "bg-yellow-500";
        return "bg-green-500";
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowDetails(!showDetails)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors
          ${
              stats.wasTrimmed
                  ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                  : stats.utilizationPercent >= 70
                  ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                  : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
          }`}
                aria-label="Token usage information"
            >
                {stats.wasTrimmed ? (
                    <AlertTriangle size={12} />
                ) : (
                    <Info size={12} />
                )}
                <span className={getColorClass(stats.utilizationPercent)}>
                    {stats.trimmedTokens.toLocaleString()} /{" "}
                    {stats.maxTokens.toLocaleString()}
                </span>
                <div className="w-8 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${getBarColorClass(
                            stats.utilizationPercent
                        )}`}
                        style={{
                            width: `${Math.min(
                                stats.utilizationPercent,
                                100
                            )}%`,
                        }}
                    />
                </div>
                {stats.utilizationPercent}%
            </button>

            {showDetails && (
                <div className="absolute top-full right-0 mt-2 p-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg z-10 min-w-64">
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                                Messages:
                            </span>
                            <span className="font-medium">
                                {messages.length}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                                Active Tokens:
                            </span>
                            <span className="font-medium">
                                {stats.trimmedTokens.toLocaleString()}
                            </span>
                        </div>

                        {stats.wasTrimmed && (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Original Tokens:
                                    </span>
                                    <span className="font-medium">
                                        {stats.originalTokens.toLocaleString()}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-red-600 dark:text-red-400">
                                        Messages Dropped:
                                    </span>
                                    <span className="font-medium text-red-600 dark:text-red-400">
                                        {stats.messagesDropped}
                                    </span>
                                </div>
                            </>
                        )}

                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                                Limit:
                            </span>
                            <span className="font-medium">
                                {stats.maxTokens.toLocaleString()}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                                Utilization:
                            </span>
                            <span
                                className={`font-medium ${getColorClass(
                                    stats.utilizationPercent
                                )}`}
                            >
                                {stats.utilizationPercent}%
                            </span>
                        </div>

                        {stats.wasTrimmed && (
                            <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded text-red-700 dark:text-red-400">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle
                                        size={12}
                                        className="mt-0.5 flex-shrink-0"
                                    />
                                    <div>
                                        <div className="font-medium text-xs">
                                            Context Trimmed
                                        </div>
                                        <div className="text-xs opacity-90 mt-1">
                                            Older messages were removed to stay
                                            within the token limit. Server-side
                                            trimming ensures optimal
                                            performance.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!stats.wasTrimmed &&
                            stats.utilizationPercent >= 70 && (
                                <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-yellow-700 dark:text-yellow-400">
                                    <div className="flex items-start gap-2">
                                        <Info
                                            size={12}
                                            className="mt-0.5 flex-shrink-0"
                                        />
                                        <div className="text-xs">
                                            Approaching token limit. Older
                                            messages may be trimmed soon.
                                        </div>
                                    </div>
                                </div>
                            )}
                    </div>
                </div>
            )}
        </div>
    );
}
