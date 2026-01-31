import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import crypto from 'crypto'

// POST /api/verify/request - Request X verification for an agent
// Simplified flow: if they provide a tweet_url, auto-approve
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
    
    // Clean X handle (remove @)
    const cleanHandle = x_handle.replace('@', '').trim()
    
    // Basic URL validation for tweet_url
    if (tweet_url) {
      const urlPattern = /^https?:\/\/(x\.com|twitter\.com)\/[^\/]+\/status\/\d+/i
      if (!urlPattern.test(tweet_url)) {
        return NextResponse.json(
          { error: 'Invalid X (Twitter) post URL' },
          { status: 400 }
        )
      }
    }
    
    // If they provided a tweet URL, auto-verify immediately (honor system)
    if (tweet_url) {
      // Update agent as verified
      await supabase
        .from('agents')
        .update({
          is_claimed: true,
          claimed_at: new Date().toISOString(),
          owner_x_handle: cleanHandle,
          is_verified: true
        })
        .eq('id', agent.id)
      
      // Store verification record for auditing
      const { data: existing } = await supabase
        .from('verification_requests')
        .select('id')
        .eq('agent_id', agent.id)
        .single()
      
      if (existing) {
        await supabase
          .from('verification_requests')
          .update({
            x_handle: cleanHandle,
            tweet_url: tweet_url,
            status: 'approved',
            verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('verification_requests')
          .insert({
            agent_id: agent.id,
            x_handle: cleanHandle,
            verification_code: agent.claim_code || crypto.randomBytes(8).toString('hex'),
            tweet_url: tweet_url,
            status: 'approved',
            verified_at: new Date().toISOString()
          })
      }
      
      return NextResponse.json({
        success: true,
        verified: true,
        message: `Agent ${agent.display_name || agent.name} verified as @${cleanHandle}!`
      })
    }
    
    // No tweet URL yet - just validate and save the X handle
    await supabase
      .from('agents')
      .update({
        owner_x_handle: cleanHandle
      })
      .eq('id', agent.id)
    
    return NextResponse.json({
      success: true,
      verified: false,
      message: 'Post something on X, then submit the link to complete verification.'
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
