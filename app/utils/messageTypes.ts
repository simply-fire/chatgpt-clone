import { Message } from "ai";

export interface MessageAttachment {
    id: string;
    name: string;
    type: "image" | "document" | "pdf";
    size: number;
    mimeType: string;
    url?: string; // Cloud URL (Cloudinary secure_url)
    public_id?: string; // Cloudinary public ID for management
    file?: File; // Original File object for AI SDK (local processing)
    previewUrl?: string; // Local preview URL (for immediate display)
    cloudinary?: {
        public_id: string;
        secure_url: string;
        format: string;
        resource_type: string;
        bytes: number;
        width?: number;
        height?: number;
    };
}

// Extend AI SDK Message type for attachments
export interface ChatMessage extends Message {
    attachments?: MessageAttachment[];
}

// Utility to convert File to base64
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
