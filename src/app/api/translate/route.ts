import { NextRequest, NextResponse } from "next/server";
import { sanitizeInput } from "@/lib/security";

// Simple translation service using Google Translate API
// Note: For production, you should use Google Cloud Translation API with proper authentication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = body.text;
    const targetLanguage = body.targetLanguage;

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: "Text and target language are required" },
        { status: 400 }
      );
    }

    // Validate and sanitize inputs
    const sanitizedText = sanitizeInput.text(text);
    if (sanitizedText.length === 0) {
      return NextResponse.json(
        { error: "Invalid text content" },
        { status: 400 }
      );
    }

    // Validate language code format (2-3 letter codes only)
    const languageRegex = /^[a-z]{2,3}$/i;
    if (!languageRegex.test(targetLanguage)) {
      return NextResponse.json(
        { error: "Invalid target language code" },
        { status: 400 }
      );
    }

    // Text length limit to prevent abuse (reduced for public access)
    if (sanitizedText.length > 1000) {
      return NextResponse.json(
        { error: "Text too long (max 1000 characters)" },
        { status: 400 }
      );
    }

    // If target language is English, return sanitized text
    if (targetLanguage.toLowerCase() === "en") {
      return NextResponse.json({ translatedText: sanitizedText });
    }

    // Using Google Translate free endpoint (less reliable, consider Google Cloud Translation API for production)
    const encodedText = encodeURIComponent(sanitizedText);
    const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
      targetLanguage.toLowerCase()
    )}&dt=t&q=${encodedText}`;

    const response = await fetch(translateUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.error(`Translation service error: ${response.status}`);
      throw new Error("Translation service unavailable");
    }

    const data = await response.json();

    // Parse Google Translate response format
    let translatedText = "";
    if (data && data[0] && Array.isArray(data[0])) {
      for (const item of data[0]) {
        if (item && item[0] && typeof item[0] === "string") {
          translatedText += item[0];
        }
      }
    }

    // Sanitize the translated response
    const sanitizedTranslation = sanitizeInput.text(translatedText.trim());
    const finalText = sanitizedTranslation || sanitizedText;

    return NextResponse.json({ translatedText: finalText });
  } catch (error) {
    console.error(
      "Translation error:",
      process.env.NODE_ENV === "development" ? error : "Translation failed"
    );

    // Return error without exposing internal details
    return NextResponse.json(
      { error: "Translation service temporarily unavailable" },
      { status: 503 }
    );
  }
}
