import { NextRequest, NextResponse } from 'next/server'
import { createDiscogsOAuth } from '@/lib/discogs-oauth'
import { prisma } from '@/lib/db'
import * as jose from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET)

export async function GET(request: NextRequest) {
  try {
    console.log('Discogs callback started')
    const { searchParams } = new URL(request.url)
    const oauth_token = searchParams.get('oauth_token')
    const oauth_verifier = searchParams.get('oauth_verifier')
    
    console.log('OAuth params:', { oauth_token, oauth_verifier })
    
    if (!oauth_token || !oauth_verifier) {
      console.log('Missing OAuth params')
      return NextResponse.redirect(new URL('/profile?error=oauth_failed', request.url))
    }
    
    // Get the request token secret from cookies
    const requestTokenSecret = request.cookies.get('discogs_request_token_secret')?.value
    const requestToken = request.cookies.get('discogs_request_token')?.value
    
    console.log('Request tokens from cookies:', { requestToken, hasSecret: !!requestTokenSecret })
    
    if (!requestTokenSecret || !requestToken || requestToken !== oauth_token) {
      console.log('Invalid or missing request tokens')
      return NextResponse.redirect(new URL('/profile?error=invalid_token', request.url))
    }
    
    // Get current user from stored user ID or JWT token
    let userId: string
    const storedUserId = request.cookies.get('discogs_user_id')?.value
    
    if (storedUserId) {
      userId = storedUserId
      console.log('Using stored user ID:', userId)
    } else {
      const token = request.cookies.get('token')?.value
      console.log('JWT token present:', !!token)
      if (!token) {
        console.log('No JWT token or stored user ID found, redirecting to login')
        return NextResponse.redirect(new URL('/login?discogs_callback=true', request.url))
      }
      
      const { payload } = await jose.jwtVerify(token, secret)
      userId = payload.userId as string
      console.log('Using JWT user ID:', userId)
    }
    
    // Exchange for access token
    const discogs = createDiscogsOAuth()
    const accessTokenData = await discogs.getAccessToken(
      requestToken,
      requestTokenSecret,
      oauth_verifier
    )
    
    // Get user's Discogs profile to store username
    const profileResponse = await discogs.makeAuthenticatedRequest(
      'https://api.discogs.com/oauth/identity',
      'GET',
      accessTokenData.oauth_token,
      accessTokenData.oauth_token_secret
    )
    
    if (!profileResponse.ok) {
      throw new Error('Failed to get Discogs profile')
    }
    
    const profileData = await profileResponse.json()
    
    // Store access token and username in database
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        discogsAccessToken: accessTokenData.oauth_token,
        discogsAccessTokenSecret: accessTokenData.oauth_token_secret,
        discogsUsername: profileData.username,
      },
    })
    
    // Clear temporary cookies
    const response = NextResponse.redirect(new URL('/profile?discogs=connected', request.url))
    response.cookies.delete('discogs_request_token_secret')
    response.cookies.delete('discogs_request_token')
    response.cookies.delete('discogs_user_id')
    
    console.log('Discogs OAuth completed successfully for user:', userId)
    return response
  } catch (error) {
    console.error('Discogs OAuth callback error:', error)
    return NextResponse.redirect(new URL('/profile?error=oauth_callback_failed', request.url))
  }
}