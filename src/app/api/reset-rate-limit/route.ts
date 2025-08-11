import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/security";

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    // Get IP address
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const rateLimitKey = `rate_limit_${ip}`;

    // Reset rate limit for this IP
    rateLimit.reset(rateLimitKey);

    return NextResponse.json({
      message: "Rate limit reset successfully",
      ip: ip,
      resetKey: rateLimitKey,
    });
  } catch (error) {
    console.error("Reset rate limit error:", error);
    return NextResponse.json(
      { error: "Failed to reset rate limit" },
      { status: 500 }
    );
  }
}
