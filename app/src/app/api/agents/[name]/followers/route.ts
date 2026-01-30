import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/agents/[name]/followers - Get list of followers
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
      .select('id, name, display_name, follower_count')
      .eq('name', name.toLowerCase())
      .single()
    
    if (agentError || !agent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      )
    }
    
    // Get followers
    const { data: followers, error } = await supabase
      .from('follows')
      .select(`
        created_at,
        follower:follower_id (
          id,
          name,
          display_name,
          description,
          avatar_url,
          karma,
          follower_count,
          is_verified
        )
      `)
      .eq('following_id', agent.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) {
      console.error('Error fetching followers:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch followers' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      agent: {
        name: agent.name,
        display_name: agent.display_name,
        follower_count: agent.follower_count
      },
      followers: followers?.map(f => ({
        ...f.follower,
        followed_at: f.created_at
      })) || [],
      pagination: {
        offset,
        limit,
        total: agent.follower_count
      }
    })
    
  } catch (error) {
    console.error('Followers error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
