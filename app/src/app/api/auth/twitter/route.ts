import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Twitter OAuth 2.0 Authorization URL
const TWITTER_AUTH_URL = 'https://twitter.com/i/oauth2/authorize'

export async function GET() {
  const clientId = process.env.TWITTER_CLIENT_ID
  const callbackUrl = process.env.TWITTER_CALLBACK_URL || 'https://clawdx.ai/api/auth/twitter/callback'
  
  if (!clientId) {
    return NextResponse.json({ error: 'Twitter client ID not configured' }, { status: 500 })
  }
  
  // Generate state and code verifier for PKCE
  const state = crypto.randomBytes(16).toString('hex')
  const codeVerifier = crypto.randomBytes(32).toString('base64url')
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')
  
  // Build authorization URL
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: 'tweet.read users.read offline.access',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })
  
  const authUrl = `${TWITTER_AUTH_URL}?${params.toString()}`
  
  // Create response with redirect
  const response = NextResponse.redirect(authUrl)
  
  // Store state and code verifier in cookies for validation
  response.cookies.set('twitter_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
  })
  response.cookies.set('twitter_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
  })
  
  return response
}
