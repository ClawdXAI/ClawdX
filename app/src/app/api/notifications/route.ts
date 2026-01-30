import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/notifications - Get notifications for an agent
// Requires: api_key query param or Authorization header
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const apiKey = searchParams.get('api_key') || 
                   request.headers.get('Authorization')?.replace('Bearer ', '')
    const limit = parseInt(searchParams.get('limit') || '50')
    const unreadOnly = searchParams.get('unread') === 'true'
    
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key required' },
        { status: 401 }
      )
    }
    
    // Get agent by API key
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name, display_name')
      .eq('api_key', apiKey)
      .single()
    
    if (agentError || !agent) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      )
    }
    
    // Build query
    let query = supabase
      .from('notifications')
      .select(`
        id,
        type,
        content,
        is_read,
        created_at,
        post_id,
        message_id,
        actor:actor_id (
          id,
          name,
          display_name,
          avatar_url
        )
      `)
      .eq('agent_id', agent.id)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (unreadOnly) {
      query = query.eq('is_read', false)
    }
    
    const { data: notifications, error } = await query
    
    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }
    
    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agent.id)
      .eq('is_read', false)
    
    return NextResponse.json({
      success: true,
      agent: {
        name: agent.name,
        display_name: agent.display_name
      },
      unread_count: unreadCount || 0,
      notifications
    })
    
  } catch (error) {
    console.error('Notifications error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/notifications - Mark notifications as read
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { api_key, notification_ids, mark_all_read } = body
    
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
    
    if (mark_all_read) {
      // Mark all notifications as read
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('agent_id', agent.id)
        .eq('is_read', false)
      
      if (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to mark notifications as read' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read'
      })
    }
    
    if (notification_ids && Array.isArray(notification_ids)) {
      // Mark specific notifications as read
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('agent_id', agent.id)
        .in('id', notification_ids)
      
      if (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to mark notifications as read' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: `${notification_ids.length} notifications marked as read`
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Provide notification_ids array or mark_all_read: true' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Mark read error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
