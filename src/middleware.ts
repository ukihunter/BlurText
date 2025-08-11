import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { rateLimit, securityHeaders } from "@/lib/security";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Apply security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Rate limiting based on IP address from headers
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const rateLimitKey = `rate_limit_${ip}`;

  // Get rate limit settings from environment
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX || "100");
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000");

  if (!rateLimit.check(rateLimitKey, maxRequests, windowMs)) {
    return new Response(
      JSON.stringify({
        error: "Too many requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: Math.ceil(windowMs / 1000),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": Math.ceil(windowMs / 1000).toString(),
          ...securityHeaders,
        },
      }
    );
  }

  const token = request.cookies.get("token")?.value;

  // Public routes that don't require authentication
  const publicRoutes = [
    "/login",
    "/register",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/logout",
    "/api/auth/me",
    "/api/translate", // Allow translation API for basic functionality
    "/api/clear-cookies", // Allow cookie clearing for troubleshooting
    "/api/create-test-user", // Allow test user creation for debugging
    "/api/reset-rate-limit", // Allow rate limit reset for development
  ];

  // SECURITY: Only allow debug routes in development environment
  if (process.env.NODE_ENV === "development") {
    publicRoutes.push(
      "/api/debug/clear-db",
      "/api/debug/clear-database",
      "/api/debug/create-test-users",
      "/api/debug/users",
      "/api/debug/unfollowed"
    );
  }

  // Check if current path is a public route
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return response;
  }

  // For API routes, require authentication
  if (request.nextUrl.pathname.startsWith("/api/")) {
    if (!token) {
      return new Response(
        JSON.stringify({
          error: "Authentication required",
          message: "Please login to access this resource",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...securityHeaders,
          },
        }
      );
    }

    // SECURITY: Proper environment variable check
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not configured - critical security issue");
      return new Response(
        JSON.stringify({
          error: "Server configuration error",
          message: "Authentication system is not properly configured",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...securityHeaders,
          },
        }
      );
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);

      // Add user info to request headers for API routes
      response.headers.set("x-user-id", payload.userId as string);
      response.headers.set("x-username", payload.username as string);

      return response;
    } catch (error) {
      // SECURITY: Don't log sensitive error details in production
      if (process.env.NODE_ENV === "development") {
        console.error("JWT verification failed:", error);
      } else {
        console.error("JWT verification failed");
      }

      return new Response(
        JSON.stringify({
          error: "Invalid token",
          message: "Your session has expired. Please login again.",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...securityHeaders,
          },
        }
      );
    }
  }

  // For regular pages, allow access (app handles auth state)
  return response;
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|icons/).*)",
  ],
};
