"use client";

import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Paperclip, X } from "lucide-react";
import { ModelCapabilities } from "../utils/modelCapabilities";

interface FileUploadProps {
    onFileSelect: (files: File[]) => void;
    isProcessing: boolean;
    canUpload: boolean;
    capabilities: ModelCapabilities;
    className?: string;
}

export default function FileUpload({
    onFileSelect,
    isProcessing,
    canUpload,
    capabilities,
    className = "",
}: FileUploadProps) {
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (!canUpload) return;
            onFileSelect(acceptedFiles);
        },
        [onFileSelect, canUpload]
    );

    // Build accepted file types based on model capabilities
    const acceptedTypes: Record<string, string[]> = {};

    if (capabilities.supportsImages) {
        capabilities.supportedImageTypes.forEach((type) => {
            acceptedTypes[type] = [];
        });
    }

    if (capabilities.supportsDocuments) {
        capabilities.supportedDocumentTypes.forEach((type) => {
            acceptedTypes[type] = [];
        });
    }

    const { getRootProps, getInputProps, isDragActive, isDragReject } =
        useDropzone({
            onDrop,
            accept: acceptedTypes,
            maxFiles: 5,
            disabled: !canUpload || isProcessing,
            multiple: true,
        });

    // Show different states
    if (!capabilities.supportsImages && !capabilities.supportsDocuments) {
        return (
            <div
                className={`p-3 text-center text-sm text-gray-500 dark:text-gray-400 ${className}`}
            >
                Current model doesn't support file uploads
            </div>
        );
    }

    return (
        <div
            {...getRootProps()}
            className={`
        relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
        ${
            isDragActive && !isDragReject
                ? "border-blue-400 bg-blue-50 dark:bg-blue-950/20"
                : isDragReject
                ? "border-red-400 bg-red-50 dark:bg-red-950/20"
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
        }
        ${!canUpload || isProcessing ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
        >
            <input {...getInputProps()} />

            <div className="flex flex-col items-center space-y-2">
                <Upload
                    size={24}
                    className={`
            ${isDragActive && !isDragReject ? "text-blue-500" : "text-gray-400"}
            ${isDragReject ? "text-red-500" : ""}
          `}
                />

                {isProcessing ? (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Processing files...
                    </div>
                ) : isDragActive ? (
                    isDragReject ? (
                        <div className="text-sm text-red-600 dark:text-red-400">
                            Some files are not supported
                        </div>
                    ) : (
                        <div className="text-sm text-blue-600 dark:text-blue-400">
                            Drop files here
                        </div>
                    )
                ) : (                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Click to upload</span> or
                        drag and drop
                        <div className="text-xs mt-1">
                            {capabilities.supportsImages && "Images: JPG, PNG, GIF, WebP"}
                            {capabilities.supportsImages && capabilities.supportsDocuments && " • "}
                            {capabilities.supportsDocuments && "Documents: PDF, Word, Excel, PowerPoint, CSV, RTF, and more"}
                        </div>
                        <div className="text-xs text-gray-500">
                            Max{" "}
                            {Math.round(
                                (capabilities.maxImageSize ||
                                    capabilities.maxFileSize) /
                                    1024 /
                                    1024
                            )}
                            MB per file
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Compact version for chat input
export function FileUploadButton({
    onFileSelect,
    isProcessing,
    canUpload,
    capabilities,
}: FileUploadProps) {
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (!canUpload) return;
            onFileSelect(acceptedFiles);
        },
        [onFileSelect, canUpload]
    );

    const acceptedTypes: Record<string, string[]> = {};

    if (capabilities.supportsImages) {
        capabilities.supportedImageTypes.forEach((type) => {
            acceptedTypes[type] = [];
        });
    }

    if (capabilities.supportsDocuments) {
        capabilities.supportedDocumentTypes.forEach((type) => {
            acceptedTypes[type] = [];
        });
    }

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: acceptedTypes,
        maxFiles: 5,
        disabled: !canUpload || isProcessing,
        multiple: true,
        noClick: false,
    });

    if (!capabilities.supportsImages && !capabilities.supportsDocuments) {
        return null;
    }

    return (
        <div {...getRootProps()}>
            <input {...getInputProps()} />
            <button
                type="button"
                disabled={!canUpload || isProcessing}
                className={`
        p-2 rounded-lg transition-colors
        ${
            canUpload && !isProcessing
                ? "text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
        }
        `}
                title="Attach files"
            >
                <Paperclip size={20} />
            </button>
        </div>
    );
}
