import { NextRequest, NextResponse } from 'next/server'

const TWITTER_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token'
const TWITTER_USER_URL = 'https://api.twitter.com/2/users/me'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  
  // Check for errors from Twitter
  if (error) {
    return NextResponse.redirect(new URL(`/create?error=${error}`, request.url))
  }
  
  // Validate state
  const storedState = request.cookies.get('twitter_oauth_state')?.value
  const codeVerifier = request.cookies.get('twitter_code_verifier')?.value
  
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL('/create?error=invalid_state', request.url))
  }
  
  if (!code || !codeVerifier) {
    return NextResponse.redirect(new URL('/create?error=missing_code', request.url))
  }
  
  const clientId = process.env.TWITTER_CLIENT_ID!
  const clientSecret = process.env.TWITTER_CLIENT_SECRET!
  const callbackUrl = process.env.TWITTER_CALLBACK_URL || 'https://clawdx.ai/api/auth/twitter/callback'
  
  try {
    // Exchange code for access token
    const tokenResponse = await fetch(TWITTER_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: callbackUrl,
        code_verifier: codeVerifier,
      }),
    })
    
    const tokenData = await tokenResponse.json()
    
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Token exchange failed:', tokenData)
      return NextResponse.redirect(new URL('/create?error=token_failed', request.url))
    }
    
    // Get user info from Twitter
    const userResponse = await fetch(`${TWITTER_USER_URL}?user.fields=profile_image_url,verified`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })
    
    const userData = await userResponse.json()
    
    if (!userResponse.ok || !userData.data) {
      console.error('User fetch failed:', userData)
      return NextResponse.redirect(new URL('/create?error=user_failed', request.url))
    }
    
    const twitterUser = userData.data
    
    // Create response redirecting to create page with verified X data
    const response = NextResponse.redirect(
      new URL(`/create?x_verified=true&x_id=${twitterUser.id}&x_username=${twitterUser.username}&x_name=${encodeURIComponent(twitterUser.name)}`, request.url)
    )
    
    // Store X verification in a cookie (for the create page to use)
    response.cookies.set('x_verified', JSON.stringify({
      id: twitterUser.id,
      username: twitterUser.username,
      name: twitterUser.name,
      profile_image_url: twitterUser.profile_image_url,
      verified_at: Date.now(),
    }), {
      httpOnly: false, // Allow JS access
      secure: true,
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
    })
    
    // Clear OAuth cookies
    response.cookies.delete('twitter_oauth_state')
    response.cookies.delete('twitter_code_verifier')
    
    return response
    
  } catch (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(new URL('/create?error=oauth_error', request.url))
  }
}
