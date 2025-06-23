import { useState, useCallback } from "react";
import { MessageAttachment, getFileType } from "../utils/messageTypes";
import {
    getCurrentModelCapabilities,
    getFileValidationError,
} from "../utils/modelCapabilities";

export const useFileUpload = (currentModel: string = "gpt-3.5-turbo") => {
    const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    const capabilities = getCurrentModelCapabilities(currentModel);

    const processFile = useCallback(
        async (file: File): Promise<MessageAttachment | null> => {
            console.log("🔄 useFileUpload - Processing file:", {
                name: file.name,
                size: file.size,
                type: file.type,
                capabilities,
            });

            // Validate file
            const validationError = getFileValidationError(file, capabilities);
            if (validationError) {
                console.log("❌ File validation failed:", validationError);
                setErrors((prev) => [
                    ...prev,
                    `${file.name}: ${validationError}`,
                ]);
                return null;
            }            const attachment: MessageAttachment = {
                id: crypto.randomUUID(),
                name: file.name,
                type: getFileType(file), // Use improved file type detection
                size: file.size,
                mimeType: file.type || 'application/octet-stream', // Fallback for missing MIME type
                file: file, // Store original File object for AI SDK
                previewUrl: URL.createObjectURL(file),
            };

            // Check if this file is already uploaded to cloud (from Next Cloudinary)
            const fileAny = file as any;
            if (fileAny.isAlreadyUploaded && fileAny.cloudUrl) {
                attachment.url = fileAny.cloudUrl;
                attachment.public_id = fileAny.cloudinaryData?.public_id;
                attachment.cloudinary = fileAny.cloudinaryData;
            }

            console.log("✅ File processed successfully:", {
                id: attachment.id,
                name: attachment.name,
                type: attachment.type,
                hasFile: !!attachment.file,
                hasCloudUrl: !!attachment.url,
            });

            return attachment;
        },
        [capabilities]
    );

    const handleFileSelect = useCallback(
        async (files: File[]) => {
            setIsProcessing(true);
            setErrors([]); // Clear previous errors

            // Limit to 5 files max
            const filesToProcess = files.slice(0, 5);
            if (files.length > 5) {
                setErrors((prev) => [
                    ...prev,
                    "Maximum 5 files allowed per message",
                ]);
            }

            try {
                const processedAttachments = await Promise.all(
                    filesToProcess.map(processFile)
                );

                // Filter out null results (failed validations)
                const validAttachments = processedAttachments.filter(
                    (attachment): attachment is MessageAttachment =>
                        attachment !== null
                );

                setAttachments((prev) => [...prev, ...validAttachments]);
            } catch (error) {
                console.error("Error processing files:", error);
                setErrors((prev) => [...prev, "Failed to process some files"]);
            } finally {
                setIsProcessing(false);
            }
        },
        [processFile]
    );

    const removeFile = useCallback((fileId: string) => {
        setAttachments((prev) => {
            const fileToRemove = prev.find((att) => att.id === fileId);
            // Clean up object URL
            if (fileToRemove?.previewUrl) {
                URL.revokeObjectURL(fileToRemove.previewUrl);
            }
            return prev.filter((att) => att.id !== fileId);
        });
    }, []);

    const clearAll = useCallback(() => {
        // Clean up object URLs
        attachments.forEach((att) => {
            if (att.previewUrl) {
                URL.revokeObjectURL(att.previewUrl);
            }
        });
        setAttachments([]);
        setErrors([]);
    }, [attachments]);

    const clearErrors = useCallback(() => {
        setErrors([]);
    }, []);

    return {
        attachments,
        isProcessing,
        errors,
        handleFileSelect,
        removeFile,
        clearAll,
        clearErrors,
        capabilities,
        hasFiles: attachments.length > 0,
        canUpload: !isProcessing && attachments.length < 5,
    };
};
