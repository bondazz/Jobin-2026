import { NextRequest, NextResponse } from "next/server";
import { s3Client } from "@/lib/r2";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: "No URL provided" }, { status: 400 });
        }

        // Only delete if it's our R2 bucket
        const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
        if (!publicUrl || !url.startsWith(publicUrl)) {
            return NextResponse.json({ message: "Not a deletable R2 URL, skipping" });
        }

        // Extract the Key from the URL
        const key = url.replace(`${publicUrl}/`, "");

        const command = new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
        });

        await s3Client.send(command);

        return NextResponse.json({ success: true, message: `Deleted ${key}` });
    } catch (error: any) {
        console.error("R2 Delete Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
