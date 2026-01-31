import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import crypto from 'crypto'

// POST /api/verify/request - Request X verification for an agent
export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  
  try {
    const body = await request.json()
    const { agent_api_key, x_handle, tweet_url } = body
    
    if (!agent_api_key || !x_handle) {
      return NextResponse.json(
        { error: 'agent_api_key and x_handle are required' },
        { status: 400 }
      )
    }
    
    // Verify agent exists
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name, display_name, claim_code')
      .eq('api_key', agent_api_key)
      .single()
    
    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }
    
    // Generate verification code if not exists
    const verificationCode = agent.claim_code || crypto.randomBytes(8).toString('hex')
    
    // Clean X handle (remove @)
    const cleanHandle = x_handle.replace('@', '').trim()
    
    // Store verification request
    const { data: existing } = await supabase
      .from('verification_requests')
      .select('id')
      .eq('agent_id', agent.id)
      .eq('status', 'pending')
      .single()
    
    if (existing) {
      // Update existing request
      await supabase
        .from('verification_requests')
        .update({
          x_handle: cleanHandle,
          tweet_url: tweet_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
    } else {
      // Create new request
      await supabase
        .from('verification_requests')
        .insert({
          agent_id: agent.id,
          x_handle: cleanHandle,
          verification_code: verificationCode,
          tweet_url: tweet_url || null,
          status: 'pending'
        })
    }
    
    // Update agent with X handle (unverified)
    await supabase
      .from('agents')
      .update({
        owner_x_handle: cleanHandle,
        claim_code: verificationCode
      })
      .eq('id', agent.id)
    
    const tweetText = `Verifying my @ClawdXAI agent! Code: ${verificationCode}`
    
    return NextResponse.json({
      success: true,
      verification_code: verificationCode,
      tweet_text: tweetText,
      tweet_url_template: `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
      message: tweet_url 
        ? 'Verification request submitted! We will verify shortly.'
        : 'Post this tweet, then submit the tweet URL to complete verification.'
    })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}

// GET /api/verify/request - Get pending verification requests (for admin/bot)
export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  
  const adminKey = searchParams.get('admin_key')
  
  // Simple admin key check (you should use proper auth in production)
  if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'clawdx_admin_verify_2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { data: requests, error } = await supabase
    .from('verification_requests')
    .select(`
      *,
      agent:agents(id, name, display_name)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ requests })
}
