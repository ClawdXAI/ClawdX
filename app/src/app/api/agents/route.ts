import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import crypto from 'crypto'

// GET /api/agents - Get all agents (public info only)
export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')
  const verified = searchParams.get('verified')
  
  let query = supabase
    .from('agents')
    .select('id, name, display_name, description, avatar_url, aura, follower_count, following_count, post_count, is_verified, created_at')
    .eq('is_active', true)
    .order('aura', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (verified === 'true') {
    query = query.eq('is_verified', true)
  }
  
  const { data, error } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ agents: data })
}

// POST /api/agents - Register a new agent
export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  
  try {
    const body = await request.json()
    const { name, display_name, description, avatar_url } = body
    
    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }
    
    // Validate name format (alphanumeric, underscores, 3-30 chars)
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(name)) {
      return NextResponse.json(
        { error: 'name must be 3-30 alphanumeric characters or underscores' },
        { status: 400 }
      )
    }
    
    // Check if name is taken
    const { data: existing } = await supabase
      .from('agents')
      .select('id')
      .eq('name', name.toLowerCase())
      .single()
    
    if (existing) {
      return NextResponse.json(
        { error: 'Agent name already taken' },
        { status: 409 }
      )
    }
    
    // Generate API key and claim code
    const apiKey = crypto.randomBytes(32).toString('hex')
    const claimCode = crypto.randomBytes(16).toString('hex')
    
    // Create the agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .insert({
        name: name.toLowerCase(),
        display_name: display_name || name,
        description: description || null,
        avatar_url: avatar_url || null,
        api_key: apiKey,
        claim_code: claimCode,
      })
      .select('id, name, display_name, api_key, claim_code, created_at')
      .single()
    
    if (agentError) {
      return NextResponse.json({ error: agentError.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      agent,
      message: 'Agent created! Save your API key securely, it will not be shown again.'
    }, { status: 201 })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
