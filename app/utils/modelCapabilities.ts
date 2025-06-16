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
    },
    "gpt-4o": {
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
            "application/pdf",
            "text/plain",
            "text/markdown",
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
    const isImage = file.type.startsWith("image/");
    const isDocument =
        file.type.startsWith("application/") || file.type.startsWith("text/");

    if (isImage) {
        return (
            capabilities.supportsImages &&
            capabilities.supportedImageTypes.includes(file.type) &&
            file.size <= capabilities.maxImageSize
        );
    }

    if (isDocument) {
        return (
            capabilities.supportsDocuments &&
            capabilities.supportedDocumentTypes.includes(file.type) &&
            file.size <= capabilities.maxFileSize
        );
    }

    return false;
};

export const getFileValidationError = (
    file: File,
    capabilities: ModelCapabilities
): string | null => {
    const isImage = file.type.startsWith("image/");
    const isDocument =
        file.type.startsWith("application/") || file.type.startsWith("text/");

    if (isImage) {
        if (!capabilities.supportsImages) {
            return "Current model does not support images";
        }
        if (!capabilities.supportedImageTypes.includes(file.type)) {
            return `Image type ${file.type} not supported`;
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
        if (!capabilities.supportedDocumentTypes.includes(file.type)) {
            return `Document type ${file.type} not supported`;
        }
        if (file.size > capabilities.maxFileSize) {
            return `File size exceeds ${Math.round(
                capabilities.maxFileSize / 1024 / 1024
            )}MB limit`;
        }
    } else {
        return "File type not supported";
    }

    return null;
};
