export interface ModelCapabilities {
    supportsImages: boolean;
    supportsDocuments: boolean;
    maxImageSize: number;
    maxFileSize: number;
    supportedImageTypes: string[];
    supportedDocumentTypes: string[];
}

export const MODEL_CAPABILITIES: Record<string, ModelCapabilities> = {
    "gpt-4-vision-preview": {
        supportsImages: true,
        supportsDocuments: false,
        maxImageSize: 20 * 1024 * 1024, // 20MB
        maxFileSize: 10 * 1024 * 1024, // 10MB
        supportedImageTypes: [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
        ],
        supportedDocumentTypes: [],
    },    "gpt-4o": {
        supportsImages: true,
        supportsDocuments: true,
        maxImageSize: 20 * 1024 * 1024, // 20MB
        maxFileSize: 25 * 1024 * 1024, // 25MB
        supportedImageTypes: [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
        ],
        supportedDocumentTypes: [
            // Text formats
            "application/pdf",
            "text/plain",
            "text/markdown",
            "text/csv",
            "text/rtf",
            "application/rtf",
            
            // Microsoft Office formats
            "application/msword", // .doc
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
            "application/vnd.ms-excel", // .xls
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
            "application/vnd.ms-powerpoint", // .ppt
            "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
            
            // OpenDocument formats
            "application/vnd.oasis.opendocument.text", // .odt
            "application/vnd.oasis.opendocument.spreadsheet", // .ods
            "application/vnd.oasis.opendocument.presentation", // .odp
            
            // Other common formats
            "application/json",
            "application/xml",
            "text/xml",
            "text/html",
            "application/vnd.ms-excel.sheet.macroEnabled.12", // .xlsm
            "application/vnd.ms-powerpoint.presentation.macroEnabled.12", // .pptm
            "application/vnd.ms-word.document.macroEnabled.12", // .docm
        ],
    },
    "gpt-4o-mini": {
        supportsImages: true,
        supportsDocuments: false,
        maxImageSize: 20 * 1024 * 1024, // 20MB
        maxFileSize: 10 * 1024 * 1024, // 10MB
        supportedImageTypes: [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
        ],
        supportedDocumentTypes: [],
    },
    "gpt-3.5-turbo": {
        supportsImages: false,
        supportsDocuments: false,
        maxImageSize: 0,
        maxFileSize: 0,
        supportedImageTypes: [],
        supportedDocumentTypes: [],
    },
};

export const getCurrentModelCapabilities = (
    model: string = "gpt-3.5-turbo"
): ModelCapabilities => {
    return MODEL_CAPABILITIES[model] || MODEL_CAPABILITIES["gpt-3.5-turbo"];
};

export const isFileSupported = (
    file: File,
    capabilities: ModelCapabilities
): boolean => {
    const mimeType = file.type.toLowerCase();
    const extension = file.name.toLowerCase().split('.').pop() || '';
    
    // Check if it's an image
    const isImageByMime = mimeType.startsWith("image/");
    const isImageByExt = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension);
    const isImage = isImageByMime || isImageByExt;
    
    // Check if it's a PDF
    const isPdf = mimeType === 'application/pdf' || extension === 'pdf';
    
    // Check if it's a document
    const documentMimeTypes = capabilities.supportedDocumentTypes;
    const documentExtensions = ['txt', 'md', 'csv', 'rtf', 'html', 'htm', 'xml', 'json',
        'doc', 'docx', 'docm', 'xls', 'xlsx', 'xlsm', 'ppt', 'pptx', 'pptm',
        'odt', 'ods', 'odp'];
    const isDocumentByMime = documentMimeTypes.includes(mimeType);
    const isDocumentByExt = documentExtensions.includes(extension);
    const isDocument = isDocumentByMime || isDocumentByExt || isPdf;

    if (isImage) {
        return (
            capabilities.supportsImages &&
            (capabilities.supportedImageTypes.includes(mimeType) || isImageByExt) &&
            file.size <= capabilities.maxImageSize
        );
    }

    if (isDocument) {
        return (
            capabilities.supportsDocuments &&
            file.size <= capabilities.maxFileSize
        );
    }

    return false;
};

export const getFileValidationError = (
    file: File,
    capabilities: ModelCapabilities
): string | null => {
    const mimeType = file.type.toLowerCase();
    const extension = file.name.toLowerCase().split('.').pop() || '';
    
    // Check if it's an image
    const isImageByMime = mimeType.startsWith("image/");
    const isImageByExt = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension);
    const isImage = isImageByMime || isImageByExt;
    
    // Check if it's a PDF
    const isPdf = mimeType === 'application/pdf' || extension === 'pdf';
    
    // Check if it's a document
    const documentMimeTypes = capabilities.supportedDocumentTypes;
    const documentExtensions = ['txt', 'md', 'csv', 'rtf', 'html', 'htm', 'xml', 'json',
        'doc', 'docx', 'docm', 'xls', 'xlsx', 'xlsm', 'ppt', 'pptx', 'pptm',
        'odt', 'ods', 'odp'];
    const isDocumentByMime = documentMimeTypes.includes(mimeType);
    const isDocumentByExt = documentExtensions.includes(extension);
    const isDocument = isDocumentByMime || isDocumentByExt || isPdf;

    if (isImage) {
        if (!capabilities.supportsImages) {
            return "Current model does not support images";
        }
        if (file.size > capabilities.maxImageSize) {
            return `Image size exceeds ${Math.round(
                capabilities.maxImageSize / 1024 / 1024
            )}MB limit`;
        }
    } else if (isDocument) {
        if (!capabilities.supportsDocuments) {
            return "Current model does not support documents";
        }
        if (file.size > capabilities.maxFileSize) {
            return `File size exceeds ${Math.round(
                capabilities.maxFileSize / 1024 / 1024
            )}MB limit`;
        }
    } else {
        return `File type '${extension || mimeType}' is not supported`;
    }

    return null;
};
