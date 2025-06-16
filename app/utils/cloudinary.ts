import { v2 as cloudinary } from "cloudinary";

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Delete a file from Cloudinary
 * @param publicId - Public ID of the file to delete
 * @param resourceType - Type of resource (image, video, raw)
 */
export async function deleteFromCloudinary(
    publicId: string,
    resourceType: "image" | "video" | "raw" = "image"
): Promise<void> {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
        console.log("🗑️ Cloudinary delete result:", result);
    } catch (error) {
        console.error("❌ Cloudinary delete error:", error);
        throw error;
    }
}

/**
 * Generate upload signature for Next Cloudinary signed uploads
 * This is used by the API route for signing upload requests
 */
export function generateUploadSignature(paramsToSign: Record<string, any>) {
    const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        process.env.CLOUDINARY_API_SECRET!
    );
    return signature;
}

export { cloudinary };
