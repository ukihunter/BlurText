import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";

export async function GET(_request: NextRequest) {
  try {
    await dbConnect();
    return NextResponse.json({
      message: "Database connection successful!",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database connection error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Database connection failed", details: errorMessage },
      { status: 500 }
    );
  }
}
