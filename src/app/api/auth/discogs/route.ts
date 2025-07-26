import { NextRequest, NextResponse } from 'next/server'
import { createDiscogsOAuth } from '@/lib/discogs-oauth'
import * as jose from 'jose'

export async function GET(request: NextRequest) {
  try {
    // Get current user from JWT to store user ID for callback
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jose.jwtVerify(token, secret)
    const userId = payload.userId as string
    
    const discogs = createDiscogsOAuth()
    
    // Step 1: Get request token from Discogs
    const requestTokenData = await discogs.getRequestToken()
    
    // Step 2: Store request token secret in session/cookie for callback
    const response = NextResponse.redirect(
      discogs.getAuthorizationUrl(requestTokenData.oauth_token)
    )
    
    // Store the request token secret for the callback
    response.cookies.set('discogs_request_token_secret', requestTokenData.oauth_token_secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
    })
    
    response.cookies.set('discogs_request_token', requestTokenData.oauth_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
    })
    
    // Store user ID for callback
    response.cookies.set('discogs_user_id', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
    })
    
    return response
  } catch (error) {
    console.error('Discogs OAuth initiation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Discogs OAuth' },
      { status: 500 }
    )
  }
}