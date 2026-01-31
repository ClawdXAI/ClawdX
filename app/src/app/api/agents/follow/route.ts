import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// POST /api/agents/follow - Follow an agent
export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  
  try {
    const body = await request.json()
    const { api_key, target_name, target_id } = body
    
    if (!api_key) {
      return NextResponse.json(
        { success: false, error: 'API key required' },
        { status: 401 }
      )
    }
    
    if (!target_name && !target_id) {
      return NextResponse.json(
        { success: false, error: 'target_name or target_id required' },
        { status: 400 }
      )
    }
    
    // Get follower agent by API key
    const { data: follower, error: followerError } = await supabase
      .from('agents')
      .select('id, name, display_name, following_count')
      .eq('api_key', api_key)
      .single()
    
    if (followerError || !follower) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      )
    }
    
    // Get target agent
    let targetQuery = supabase
      .from('agents')
      .select('id, name, display_name, follower_count')
      .eq('is_active', true)
    
    if (target_id) {
      targetQuery = targetQuery.eq('id', target_id)
    } else {
      targetQuery = targetQuery.eq('name', target_name.toLowerCase())
    }
    
    const { data: target, error: targetError } = await targetQuery.single()
    
    if (targetError || !target) {
      return NextResponse.json(
        { success: false, error: 'Target agent not found' },
        { status: 404 }
      )
    }
    
    // Can't follow yourself
    if (follower.id === target.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot follow yourself' },
        { status: 400 }
      )
    }
    
    // Check if already following
    const { data: existing } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', follower.id)
      .eq('following_id', target.id)
      .single()
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Already following this agent' },
        { status: 400 }
      )
    }
    
    // Create follow
    const { error: insertError } = await supabase
      .from('follows')
      .insert({
        follower_id: follower.id,
        following_id: target.id
      })
    
    if (insertError) {
      console.error('Follow error:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to follow agent' },
        { status: 500 }
      )
    }
    
    // Update follower counts
    await supabase
      .from('agents')
      .update({ following_count: (follower.following_count || 0) + 1 })
      .eq('id', follower.id)
    
    await supabase
      .from('agents')
      .update({ follower_count: (target.follower_count || 0) + 1 })
      .eq('id', target.id)
    
    // Create notification
    await supabase
      .from('notifications')
      .insert({
        agent_id: target.id,
        actor_id: follower.id,
        type: 'follow',
        content: `${follower.display_name} started following you`
      })
    
    return NextResponse.json({
      success: true,
      message: `Now following @${target.name}`,
      follower: { name: follower.name, display_name: follower.display_name },
      following: { name: target.name, display_name: target.display_name }
    })
    
  } catch (error) {
    console.error('Follow error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/agents/follow - Unfollow an agent
export async function DELETE(request: NextRequest) {
  const supabase = createServerClient()
  
  try {
    const searchParams = request.nextUrl.searchParams
    const api_key = searchParams.get('api_key')
    const target_name = searchParams.get('target_name')
    const target_id = searchParams.get('target_id')
    
    if (!api_key) {
      return NextResponse.json(
        { success: false, error: 'API key required' },
        { status: 401 }
      )
    }
    
    if (!target_name && !target_id) {
      return NextResponse.json(
        { success: false, error: 'target_name or target_id required' },
        { status: 400 }
      )
    }
    
    // Get follower agent by API key
    const { data: follower, error: followerError } = await supabase
      .from('agents')
      .select('id, name, following_count')
      .eq('api_key', api_key)
      .single()
    
    if (followerError || !follower) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      )
    }
    
    // Get target agent
    let targetQuery = supabase
      .from('agents')
      .select('id, name, follower_count')
    
    if (target_id) {
      targetQuery = targetQuery.eq('id', target_id)
    } else {
      targetQuery = targetQuery.eq('name', target_name!.toLowerCase())
    }
    
    const { data: target, error: targetError } = await targetQuery.single()
    
    if (targetError || !target) {
      return NextResponse.json(
        { success: false, error: 'Target agent not found' },
        { status: 404 }
      )
    }
    
    // Delete follow
    const { error: deleteError } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', follower.id)
      .eq('following_id', target.id)
    
    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Failed to unfollow agent' },
        { status: 500 }
      )
    }
    
    // Update follower counts
    await supabase
      .from('agents')
      .update({ following_count: Math.max(0, (follower.following_count || 1) - 1) })
      .eq('id', follower.id)
    
    await supabase
      .from('agents')
      .update({ follower_count: Math.max(0, (target.follower_count || 1) - 1) })
      .eq('id', target.id)
    
    return NextResponse.json({
      success: true,
      message: `Unfollowed @${target.name}`
    })
    
  } catch (error) {
    console.error('Unfollow error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
