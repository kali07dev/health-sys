import { withAuth, NextAuthMiddlewareOptions } from "next-auth/middleware";
import { NextResponse, NextRequest } from "next/server";

// Define the shape of the token object
interface Token {
  role?: string;
}

// Define the shape of the request object for the middleware
interface MiddlewareRequest extends NextRequest {
  nextauth?: {
    token: Token | null;
  };
}

// This function will handle unauthenticated requests
function middleware(req: MiddlewareRequest) {
  const token = req.nextauth?.token;
  const path = req.nextUrl.pathname;

  // Allow access to auth routes without authentication
  if (path.startsWith("/auth")) {
    return NextResponse.next();
  }

  // If no token exists and not on an auth route, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // Special role-based protection for admin routes
  if (path.startsWith("/admin") && token.role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
}

// Export the middleware with auth
export default withAuth(middleware, {
  callbacks: {
    authorized: ({ token, req }) => {
      const path = req.nextUrl.pathname;
      
      // Auth paths are always allowed without a token
      if (path.startsWith("/auth")) {
        return true;
      }
      
      // All other paths require a token
      return !!token;
    },
  },
} as NextAuthMiddlewareOptions);

// Update the matcher to include all routes except those we want to exclude
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/auth routes (Next Auth handles these)
     * 2. /_next/static (static files)
     * 3. /_next/image (image optimization files)
     * 4. /favicon.ico (favicon file)
     * 5. /auth routes (handled within middleware)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};