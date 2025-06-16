"use client";

import React from "react";
import { CldUploadWidget } from "next-cloudinary";
import { Paperclip } from "lucide-react";
import { ModelCapabilities } from "../utils/modelCapabilities";

interface NextCloudinaryUploadProps {
    onFileSelect: (files: File[]) => void;
    onUploadSuccess?: (result: any) => void;
    isProcessing: boolean;
    canUpload: boolean;
    capabilities: ModelCapabilities;
}

export function NextCloudinaryUpload({
    onFileSelect,
    onUploadSuccess,
    isProcessing,
    canUpload,
    capabilities,
}: NextCloudinaryUploadProps) {
    if (!capabilities.supportsImages && !capabilities.supportsDocuments) {
        return null;
    }
    const handleSuccess = (result: any) => {
        console.log("✅ Next Cloudinary upload success:", result);

        // Convert Cloudinary format to proper MIME type
        const getMimeType = (format: string, resourceType: string) => {
            if (resourceType === "image") {
                switch (format.toLowerCase()) {
                    case "jpg":
                    case "jpeg":
                        return "image/jpeg";
                    case "png":
                        return "image/png";
                    case "gif":
                        return "image/gif";
                    case "webp":
                        return "image/webp";
                    case "svg":
                        return "image/svg+xml";
                    default:
                        return `image/${format}`;
                }
            } else if (resourceType === "video") {
                return `video/${format}`;
            } else {
                // For documents and other files
                switch (format.toLowerCase()) {
                    case "pdf":
                        return "application/pdf";
                    case "txt":
                        return "text/plain";
                    case "md":
                        return "text/markdown";
                    default:
                        return "application/octet-stream";
                }
            }
        };

        // Create a File object that represents the uploaded file
        // Use a buffer that matches the actual file size from Cloudinary
        const actualSize = result.info.bytes || 1024; // Use actual size or default to 1KB
        const dummyBuffer = new Uint8Array(Math.min(actualSize, 1024)); // Cap at 1KB for mock file
        dummyBuffer.fill(65); // Fill with 'A' character for debugging

        const mockFile = new File(
            [dummyBuffer],
            result.info.original_filename || "uploaded-file",
            {
                type: getMimeType(
                    result.info.format || "",
                    result.info.resource_type || "image"
                ),
            }
        );

        // Override the size property to match Cloudinary's reported size
        Object.defineProperty(mockFile, "size", {
            value: actualSize,
            writable: false,
        });

        // Add Cloudinary data to the file object to indicate it's already uploaded
        (mockFile as any).cloudinaryData = {
            public_id: result.info.public_id,
            secure_url: result.info.secure_url,
            format: result.info.format,
            resource_type: result.info.resource_type,
            bytes: result.info.bytes,
            width: result.info.width,
            height: result.info.height,
        };

        // Mark this file as already uploaded to prevent re-uploading
        (mockFile as any).isAlreadyUploaded = true;
        (mockFile as any).cloudUrl = result.info.secure_url;

        console.log("✅ Created mock file for Next Cloudinary upload:", {
            name: mockFile.name,
            size: mockFile.size,
            type: mockFile.type,
            isAlreadyUploaded: (mockFile as any).isAlreadyUploaded,
            cloudUrl: (mockFile as any).cloudUrl,
            cloudinaryData: (mockFile as any).cloudinaryData,
        });

        onFileSelect([mockFile]);
        onUploadSuccess?.(result);
    };

    const handleError = (error: any) => {
        console.error("❌ Next Cloudinary upload error:", error);
        // Also log the error details for debugging
        if (error.error && error.error.message) {
            console.error("❌ Error message:", error.error.message);
        }
        if (error.error && error.error.http_code) {
            console.error("❌ HTTP code:", error.error.http_code);
        }
    };

    return (
        <CldUploadWidget
            signatureEndpoint="/api/sign-cloudinary-params"
            options={{
                multiple: true,
                maxFiles: 5,
                folder: "chatgpt-clone/uploads",
                resourceType: "auto",
                clientAllowedFormats: capabilities.supportsImages
                    ? ["jpg", "jpeg", "png", "gif", "webp", "pdf", "txt", "md"]
                    : ["pdf", "txt", "md"],
                maxFileSize: capabilities.supportsImages
                    ? 20000000 // 20MB for images
                    : 25000000, // 25MB for documents
            }}
            onSuccess={handleSuccess}
            onError={handleError}
        >
            {({ open }) => (
                <button
                    type="button"
                    onClick={() => canUpload && !isProcessing && open()}
                    disabled={!canUpload || isProcessing}
                    className={`
                        p-2 rounded-lg transition-colors
                        ${
                            canUpload && !isProcessing
                                ? "text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                                : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                        }
                    `}
                    title="Upload to cloud storage"
                >
                    <Paperclip size={20} />
                </button>
            )}
        </CldUploadWidget>
    );
}

export default NextCloudinaryUpload;
