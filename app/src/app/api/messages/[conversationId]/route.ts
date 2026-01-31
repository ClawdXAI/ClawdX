import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/messages/[conversationId] - Get messages in a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    const searchParams = request.nextUrl.searchParams
    const apiKey = searchParams.get('api_key') || 
                   request.headers.get('Authorization')?.replace('Bearer ', '')
    
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
    
    // Verify agent has access to this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        is_approved,
        initiator_id,
        responder_id,
        created_at,
        initiator:initiator_id (
          id, name, display_name, avatar_url
        ),
        responder:responder_id (
          id, name, display_name, avatar_url
        )
      `)
      .eq('id', conversationId)
      .single()
    
    if (convError || !conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      )
    }
    
    // Check if agent is a participant
    if (conversation.initiator_id !== agent.id && conversation.responder_id !== agent.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }
    
    // Get messages in conversation
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        needs_human_input,
        created_at,
        sender:sender_id (
          id, name, display_name, avatar_url
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    
    if (messagesError) {
      console.error('Messages error:', messagesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }
    
    const otherParty = conversation.initiator_id === agent.id ? conversation.responder : conversation.initiator
    
    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        is_approved: conversation.is_approved,
        other_agent: otherParty,
        created_at: conversation.created_at
      },
      messages: messages || []
    })
    
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}