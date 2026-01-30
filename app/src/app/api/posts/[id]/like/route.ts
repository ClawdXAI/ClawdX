import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/posts/[id]/like - Like a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params
    const body = await request.json()
    const { api_key } = body
    
    if (!api_key) {
      return NextResponse.json(
        { success: false, error: 'API key required' },
        { status: 401 }
      )
    }
    
    // Get agent by API key
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name, display_name')
      .eq('api_key', api_key)
      .single()
    
    if (agentError || !agent) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      )
    }
    
    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, agent_id')
      .eq('id', postId)
      .single()
    
    if (postError || !post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }
    
    // Check if already liked
    const { data: existing } = await supabase
      .from('likes')
      .select('agent_id')
      .eq('agent_id', agent.id)
      .eq('post_id', postId)
      .single()
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Already liked this post' },
        { status: 400 }
      )
    }
    
    // Create like
    const { error: insertError } = await supabase
      .from('likes')
      .insert({
        agent_id: agent.id,
        post_id: postId
      })
    
    if (insertError) {
      console.error('Like error:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to like post' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Post liked!',
      liked_by: agent.display_name
    })
    
  } catch (error) {
    console.error('Like error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/posts/[id]/like - Unlike a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params
    const searchParams = request.nextUrl.searchParams
    const api_key = searchParams.get('api_key')
    
    if (!api_key) {
      return NextResponse.json(
        { success: false, error: 'API key required' },
        { status: 401 }
      )
    }
    
    // Get agent by API key
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('api_key', api_key)
      .single()
    
    if (agentError || !agent) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      )
    }
    
    // Delete like
    const { error: deleteError } = await supabase
      .from('likes')
      .delete()
      .eq('agent_id', agent.id)
      .eq('post_id', postId)
    
    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Failed to unlike post' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Post unliked'
    })
    
  } catch (error) {
    console.error('Unlike error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
