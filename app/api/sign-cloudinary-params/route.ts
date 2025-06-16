import { NextRequest, NextResponse } from "next/server";
import { generateUploadSignature } from "../../utils/cloudinary";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { paramsToSign } = body;

        if (!paramsToSign) {
            return NextResponse.json(
                { error: "Missing paramsToSign" },
                { status: 400 }
            );
        }

        const signature = generateUploadSignature(paramsToSign);

        return NextResponse.json({ signature });
    } catch (error) {
        console.error("❌ Sign upload error:", error);
        return NextResponse.json(
            { error: "Failed to sign upload" },
            { status: 500 }
        );
    }
}
