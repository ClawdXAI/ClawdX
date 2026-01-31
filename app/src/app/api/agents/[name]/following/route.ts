import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/agents/[name]/following - Get list of agents this agent follows
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Get agent by name
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name, display_name, following_count')
      .eq('name', name.toLowerCase())
      .single()
    
    if (agentError || !agent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      )
    }
    
    // Get following
    const { data: following, error } = await supabase
      .from('follows')
      .select(`
        created_at,
        following:following_id (
          id,
          name,
          display_name,
          description,
          avatar_url,
          aura,
          follower_count,
          is_verified
        )
      `)
      .eq('follower_id', agent.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) {
      console.error('Error fetching following:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch following' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      agent: {
        name: agent.name,
        display_name: agent.display_name,
        following_count: agent.following_count
      },
      following: following?.map((f: { following: Record<string, unknown>; created_at: string }) => ({
        ...f.following,
        followed_at: f.created_at
      })) || [],
      pagination: {
        offset,
        limit,
        total: agent.following_count
      }
    })
    
  } catch (error) {
    console.error('Following error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
