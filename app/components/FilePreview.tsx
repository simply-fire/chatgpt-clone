"use client";

import React from "react";
import { X, Image, FileText, File } from "lucide-react";
import { MessageAttachment, formatFileSize } from "../utils/messageTypes";

interface FilePreviewProps {
    attachment: MessageAttachment;
    onRemove: (id: string) => void;
    showRemove?: boolean;
    size?: "small" | "medium" | "large";
}

export default function FilePreview({
    attachment,
    onRemove,
    showRemove = true,
    size = "medium",
}: FilePreviewProps) {
    const getFileIcon = () => {
        switch (attachment.type) {
            case "image":
                return <Image size={16} className="text-blue-500" />;
            case "pdf":
                return <FileText size={16} className="text-red-500" />;
            default:
                return <File size={16} className="text-gray-500" />;
        }
    };

    const sizeClasses = {
        small: "w-12 h-12",
        medium: "w-16 h-16",
        large: "w-20 h-20",
    };

    const containerClasses = {
        small: "p-1",
        medium: "p-2",
        large: "p-3",
    };

    if (attachment.type === "image" && attachment.previewUrl) {
        return (
            <div className={`relative group ${containerClasses[size]}`}>
                <div
                    className={`${sizeClasses[size]} rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800`}
                >
                    <img
                        src={attachment.previewUrl}
                        alt={attachment.name}
                        className="w-full h-full object-cover"
                    />
                </div>

                {showRemove && (
                    <button
                        onClick={() => onRemove(attachment.id)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove file"
                    >
                        <X size={12} />
                    </button>
                )}

                {size !== "small" && (
                    <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 truncate max-w-full">
                        {attachment.name}
                    </div>
                )}
            </div>
        );
    }

    // Non-image files
    return (
        <div className={`relative group ${containerClasses[size]}`}>
            <div
                className={`${sizeClasses[size]} rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col items-center justify-center`}
            >
                {getFileIcon()}
                {size !== "small" && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center px-1">
                        <div className="truncate">{attachment.name}</div>
                        <div className="text-gray-500">
                            {formatFileSize(attachment.size)}
                        </div>
                    </div>
                )}
            </div>

            {showRemove && (
                <button
                    onClick={() => onRemove(attachment.id)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove file"
                >
                    <X size={12} />
                </button>
            )}
        </div>
    );
}

// Component for selected files strip
export function FilePreviewStrip({
    attachments,
    onRemove,
}: {
    attachments: MessageAttachment[];
    onRemove: (id: string) => void;
}) {
    if (attachments.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 p-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            {attachments.map((attachment) => (
                <FilePreview
                    key={attachment.id}
                    attachment={attachment}
                    onRemove={onRemove}
                    size="small"
                />
            ))}
        </div>
    );
}
