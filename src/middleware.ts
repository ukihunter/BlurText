import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  // Public routes that don't require authentication
  const publicRoutes = [
    "/login",
    "/register",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/logout",
    "/api/auth/me",
    "/api/debug/clear-db", // Debug route for clearing database
    "/api/debug/clear-database", // Debug route for clearing database
    "/api/debug/create-test-users", // Debug route for creating test users
    "/api/debug/users", // Debug route for checking users
    "/api/debug/unfollowed", // Debug route for unfollowed logic
  ];

  // Check if current path is a public route
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For API routes, require authentication
  if (request.nextUrl.pathname.startsWith("/api/")) {
    if (!token) {
      console.log("MIDDLEWARE: No token found");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log("MIDDLEWARE: Verifying token for path:", request.nextUrl.pathname);
    console.log("MIDDLEWARE: JWT_SECRET exists:", !!process.env.JWT_SECRET);
    
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
      const { payload } = await jwtVerify(token, secret);
      console.log("MIDDLEWARE: Token verification successful");
      return NextResponse.next();
    } catch (error) {
      console.log("MIDDLEWARE: JWT verification failed:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  }

  // For regular pages, allow access (your app handles auth state)
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|icons/).*)",
  ],
};
