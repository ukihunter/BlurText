import { NextRequest, NextResponse } from "next/server";
import { decryptImageData } from "@/lib/imageEncryption";
import Post from "@/models/Post";
import dbConnect from "@/lib/mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string; imageIndex: string } }
) {
  try {
    console.log(
      "Image request for postId:",
      params.postId,
      "imageIndex:",
      params.imageIndex
    );
    await dbConnect();

    const post = await Post.findById(params.postId);
    console.log("Found post:", post ? "yes" : "no");
    console.log("Post has images:", post?.images?.length || 0);

    if (!post || !post.images) {
      console.log("Post or images not found");
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const imageIndex = parseInt(params.imageIndex);
    console.log("Parsed imageIndex:", imageIndex);

    if (imageIndex < 0 || imageIndex >= post.images.length) {
      console.log("Image index out of range");
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const imageData = post.images[imageIndex];
    console.log("Image data found:", !!imageData);
    console.log("Image filename:", imageData?.filename);

    try {
      // Decrypt the image data
      console.log("Starting decryption...");
      const decryptedBase64 = decryptImageData(
        imageData.data,
        imageData.key,
        imageData.iv
      );
      console.log(
        "Decryption complete, base64 length:",
        decryptedBase64.length
      );

      const imageBuffer = Buffer.from(decryptedBase64, "base64");
      console.log("Buffer created, size:", imageBuffer.length);

      return new NextResponse(imageBuffer, {
        headers: {
          "Content-Type": imageData.mimetype,
          "Content-Length": imageBuffer.length.toString(),
          "Cache-Control": "private, max-age=3600", // Private cache for privacy
          "Content-Disposition": `inline; filename="${imageData.filename}"`,
        },
      });
    } catch (decryptError) {
      console.error("Decryption error:", decryptError);
      return NextResponse.json(
        { error: "Failed to decrypt image" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Image retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve image" },
      { status: 500 }
    );
  }
}
