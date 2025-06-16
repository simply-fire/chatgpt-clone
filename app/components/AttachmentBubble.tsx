"use client";

import React from "react";
import { Download, ExternalLink, Image, FileText, File } from "lucide-react";
import { MessageAttachment, formatFileSize } from "../utils/messageTypes";

interface AttachmentBubbleProps {
    attachments: MessageAttachment[];
    isUserMessage?: boolean;
}

export default function AttachmentBubble({
    attachments,
    isUserMessage = true,
}: AttachmentBubbleProps) {
    if (!attachments || attachments.length === 0) return null;

    const getFileIcon = (type: string) => {
        switch (type) {
            case "image":
                return <Image size={16} className="text-blue-500" />;
            case "pdf":
                return <FileText size={16} className="text-red-500" />;
            default:
                return <File size={16} className="text-gray-500" />;
        }
    };

    const handleDownload = (attachment: MessageAttachment) => {
        // Prefer cloud URL for downloads, fallback to preview URL
        const downloadUrl = attachment.url || attachment.previewUrl;
        if (downloadUrl) {
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = attachment.name;
            link.click();
        }
    };

    const handleView = (attachment: MessageAttachment) => {
        // Prefer cloud URL for viewing, fallback to preview URL
        const viewUrl = attachment.url || attachment.previewUrl;
        if (viewUrl) {
            window.open(viewUrl, "_blank");
        }
    };

    return (
        <div className="space-y-2 mt-2">
            {attachments.map((attachment) => {
                // Use cloud URL if available, otherwise fallback to preview URL
                const displayUrl = attachment.url || attachment.previewUrl;

                if (attachment.type === "image" && displayUrl) {
                    return (
                        <div key={attachment.id} className="relative group">
                            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 max-w-sm">
                                <img
                                    src={displayUrl}
                                    alt={attachment.name}
                                    className="w-full h-auto max-h-64 object-cover cursor-pointer"
                                    onClick={() => handleView(attachment)}
                                />

                                {/* Image overlay with actions */}
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-end">
                                    <div className="w-full p-2 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex items-center justify-between">
                                            <span className="text-white text-sm truncate">
                                                {attachment.name}
                                                {attachment.url && (
                                                    <span className="ml-1 text-xs opacity-75">
                                                        ☁️
                                                    </span>
                                                )}
                                            </span>
                                            <div className="flex gap-1 ml-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleView(attachment);
                                                    }}
                                                    className="p-1 rounded bg-white/20 hover:bg-white/30 transition-colors"
                                                    title="View full size"
                                                >
                                                    <ExternalLink
                                                        size={14}
                                                        className="text-white"
                                                    />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDownload(
                                                            attachment
                                                        );
                                                    }}
                                                    className="p-1 rounded bg-white/20 hover:bg-white/30 transition-colors"
                                                    title="Download"
                                                >
                                                    <Download
                                                        size={14}
                                                        className="text-white"
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }

                // Non-image files
                return (
                    <div
                        key={attachment.id}
                        className={`
              flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer
              ${
                  isUserMessage
                      ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
              }
            `}
                        onClick={() => handleView(attachment)}
                    >
                        <div className="flex-shrink-0">
                            {getFileIcon(attachment.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                                {attachment.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                {formatFileSize(attachment.size)} •{" "}
                                {attachment.mimeType}
                            </div>
                        </div>

                        <div className="flex gap-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleView(attachment);
                                }}
                                className={`
                  p-1 rounded transition-colors
                  ${
                      isUserMessage
                          ? "hover:bg-blue-200 dark:hover:bg-blue-800"
                          : "hover:bg-gray-200 dark:hover:bg-gray-600"
                  }
                `}
                                title="View"
                            >
                                <ExternalLink
                                    size={14}
                                    className="text-gray-600 dark:text-gray-400"
                                />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(attachment);
                                }}
                                className={`
                  p-1 rounded transition-colors
                  ${
                      isUserMessage
                          ? "hover:bg-blue-200 dark:hover:bg-blue-800"
                          : "hover:bg-gray-200 dark:hover:bg-gray-600"
                  }
                `}
                                title="Download"
                            >
                                <Download
                                    size={14}
                                    className="text-gray-600 dark:text-gray-400"
                                />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
