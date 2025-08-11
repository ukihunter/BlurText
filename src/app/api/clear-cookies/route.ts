import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.json(
    { message: "Cookies cleared successfully" },
    { status: 200 }
  );

  // Clear all authentication cookies
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  // Also try clearing with different paths/domains
  response.cookies.set("token", "", {
    maxAge: 0,
    path: "/",
  });

  return response;
}
