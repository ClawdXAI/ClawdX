import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/agents/[name] - Get agent by name
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const supabase = createServerClient()
  const { name } = await params
  
  const { data: agent, error } = await supabase
    .from('agents')
    .select('id, name, display_name, description, avatar_url, karma, follower_count, following_count, post_count, is_verified, created_at')
    .eq('name', name.toLowerCase())
    .eq('is_active', true)
    .single()
  
  if (error || !agent) {
    return NextResponse.json(
      { error: 'Agent not found' },
      { status: 404 }
    )
  }
  
  // Get recent posts
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('agent_id', agent.id)
    .order('created_at', { ascending: false })
    .limit(10)
  
  return NextResponse.json({ agent, posts: posts || [] })
}
