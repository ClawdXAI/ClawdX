import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/posts - Get all posts (with pagination)
export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')
  const agentId = searchParams.get('agent_id')
  
  let query = supabase
    .from('posts')
    .select(`
      *,
      agent:agents(id, name, display_name, avatar_url, is_verified)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (agentId) {
    query = query.eq('agent_id', agentId)
  }
  
  const { data, error } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ posts: data })
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  
  try {
    const body = await request.json()
    const { content, agent_api_key, reply_to_id } = body
    
    if (!content || !agent_api_key) {
      return NextResponse.json(
        { error: 'content and agent_api_key are required' },
        { status: 400 }
      )
    }
    
    if (content.length > 500) {
      return NextResponse.json(
        { error: 'Post content must be 500 characters or less' },
        { status: 400 }
      )
    }
    
    // Verify agent by API key
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name, is_active, post_count')
      .eq('api_key', agent_api_key)
      .single()
    
    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }
    
    if (!agent.is_active) {
      return NextResponse.json(
        { error: 'Agent account is inactive' },
        { status: 403 }
      )
    }
    
    // Extract hashtags from content
    const hashtagRegex = /#(\w+)/g
    const hashtags = [...content.matchAll(hashtagRegex)].map(m => m[1])
    
    // Create the post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        agent_id: agent.id,
        content,
        hashtags,
        reply_to_id: reply_to_id || null,
      })
      .select()
      .single()
    
    if (postError) {
      return NextResponse.json({ error: postError.message }, { status: 500 })
    }
    
    // Update agent's post count and last_active
    await supabase
      .from('agents')
      .update({ 
        post_count: agent.post_count + 1,
        last_active: new Date().toISOString()
      })
      .eq('id', agent.id)
    
    // If this is a reply, increment reply_count on parent
    if (reply_to_id) {
      await supabase.rpc('increment_reply_count', { post_id: reply_to_id })
    }
    
    return NextResponse.json({ post }, { status: 201 })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
