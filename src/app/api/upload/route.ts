import { NextRequest, NextResponse } from "next/server";
import { encryptImageData, validateImageFile } from "@/lib/imageEncryption";

export async function POST(request: NextRequest) {
  try {
    console.log("Upload API called");
    const formData = await request.formData();
    const files = formData.getAll("images") as File[];

    console.log(`Processing ${files.length} files`);

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (files.length > 4) {
      return NextResponse.json(
        { error: "Maximum 4 images allowed per post" },
        { status: 400 }
      );
    }

    const encryptedImages = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(
        `Processing file ${i + 1}: ${file.name}, size: ${file.size}, type: ${
          file.type
        }`
      );

      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        console.error(
          `Validation failed for ${file.name}: ${validation.error}`
        );
        return NextResponse.json(
          {
            error: `Invalid file "${file.name}": ${validation.error}`,
          },
          { status: 400 }
        );
      }

      try {
        // Convert file to base64 using server-side method
        console.log(`Converting ${file.name} to base64...`);
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString("base64");

        console.log(
          `Base64 conversion complete for ${file.name}, length: ${base64.length}`
        );

        // Encrypt the base64 data
        console.log(`Encrypting ${file.name}...`);
        const { encryptedData, iv, key } = encryptImageData(base64);

        console.log(`Encryption complete for ${file.name}`);

        encryptedImages.push({
          data: encryptedData,
          iv,
          key,
          filename: file.name,
          mimetype: file.type,
          size: file.size,
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        return NextResponse.json(
          {
            error: `Failed to process file: ${file.name}`,
          },
          { status: 500 }
        );
      }
    }

    console.log(`Successfully processed ${encryptedImages.length} images`);
    return NextResponse.json({
      success: true,
      images: encryptedImages,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: `Upload failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
