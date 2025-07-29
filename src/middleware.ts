import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jose.jwtVerify(token, secret);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.userId as string);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error: any) {
    console.error("Middleware: JWT Verification Error", error);
    
    // If token is expired, try to refresh it
    if (error.code === 'ERR_JWT_EXPIRED') {
      try {
        // Attempt to refresh token
        const refreshResponse = await fetch(new URL('/api/auth/refresh', request.url), {
          method: 'POST',
          headers: {
            'Cookie': request.headers.get('cookie') || '',
          },
        });

        if (refreshResponse.ok) {
          // Get the new token from the response
          const setCookieHeader = refreshResponse.headers.get('set-cookie');
          if (setCookieHeader) {
            // Extract user ID from the old token for the headers
            const decoded = jose.decodeJwt(token);
            const requestHeaders = new Headers(request.headers);
            requestHeaders.set("x-user-id", decoded.userId as string);

            // Create response with new token
            const response = NextResponse.next({
              request: {
                headers: requestHeaders,
              },
            });
            
            // Forward the new token cookie
            response.headers.set('set-cookie', setCookieHeader);
            return response;
          }
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
      }
    }
    
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth/login (login endpoint)
     * - api/auth/signup (signup endpoint)
     * - api/auth/logout (logout endpoint)
     * - api/auth/discogs (discogs oauth endpoints)
     * - login (login page)
     * - signup (signup page)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.svg (favicon file)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth/login|api/auth/signup|api/auth/logout|api/auth/discogs|api/auth/google|login|signup|_next/static|_next/image|favicon).*)",
  ],
};
