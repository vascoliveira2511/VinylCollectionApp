import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import * as jose from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET)

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const { payload } = await jose.jwtVerify(token, secret)
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.userId as string)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    console.error('Middleware: JWT Verification Error', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/', '/profile', '/stats', '/api/collection/:path*', '/api/auth/user'], // Apply middleware to these paths
}

