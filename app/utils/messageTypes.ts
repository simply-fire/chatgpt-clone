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

// Utility to detect file type from MIME type and extension
export const getFileType = (file: File): "image" | "document" | "pdf" => {
    const mimeType = file.type.toLowerCase();
    const extension = file.name.toLowerCase().split('.').pop() || '';
    
    // PDF files
    if (mimeType === 'application/pdf' || extension === 'pdf') {
        return 'pdf';
    }
    
    // Image files
    if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) {
        return 'image';
    }
    
    // Document files - comprehensive list
    const documentMimeTypes = [
        // Text formats
        'text/plain', 'text/markdown', 'text/csv', 'text/rtf', 'application/rtf',
        'text/html', 'text/xml', 'application/xml', 'application/json',
        
        // Microsoft Office formats
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-powerpoint', // .ppt
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
        'application/vnd.ms-excel.sheet.macroEnabled.12', // .xlsm
        'application/vnd.ms-powerpoint.presentation.macroEnabled.12', // .pptm
        'application/vnd.ms-word.document.macroEnabled.12', // .docm
        
        // OpenDocument formats
        'application/vnd.oasis.opendocument.text', // .odt
        'application/vnd.oasis.opendocument.spreadsheet', // .ods
        'application/vnd.oasis.opendocument.presentation', // .odp
    ];
    
    const documentExtensions = [
        'txt', 'md', 'csv', 'rtf', 'html', 'htm', 'xml', 'json',
        'doc', 'docx', 'docm', 'xls', 'xlsx', 'xlsm', 'ppt', 'pptx', 'pptm',
        'odt', 'ods', 'odp'
    ];
    
    if (documentMimeTypes.includes(mimeType) || documentExtensions.includes(extension)) {
        return 'document';
    }
    
    // Default to document for any unrecognized file (fallback)
    return 'document';
};

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
